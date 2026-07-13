# ============================================================
# deploy-didit-ekyc-lambda.ps1
# Deploy Lambda tích hợp Didit eKYC + wire API Gateway routes
# Chạy từ thư mục: amplify/backend/
#
# Trước khi chạy lần đầu — tạo secret trong Secrets Manager:
#   aws secretsmanager create-secret `
#     --name "prod/didit/api-key" `
#     --secret-string '{"apiKey":"YOUR_DIDIT_API_KEY","webhookSecret":"YOUR_WEBHOOK_SECRET"}' `
#     --region ap-southeast-1
# ============================================================

$REGION        = "ap-southeast-1"
$FUNCTION_NAME = "ekyc-handler"         # Giữ tên cũ để không cần đổi API Gateway routes
$API_ID        = "sd7ds72m8g"           # HTTP API Gateway dùng chung
$AUTHORIZER_ID = "w7g6id"              # CognitoAuthorizer
$ZIP_FILE      = "didit-ekyc-handler.zip"

Write-Host "📦 Đóng gói didit-ekyc-handler.py vào zip..."
if (Test-Path $ZIP_FILE) { Remove-Item $ZIP_FILE }
Compress-Archive -Path "didit-ekyc-handler.py" -DestinationPath $ZIP_FILE
Write-Host "✅ Đã tạo $ZIP_FILE"

# ── Deploy Lambda ──────────────────────────────────────────────────────────────
$exists = aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "🔄 Cập nhật Lambda hiện có: $FUNCTION_NAME"
    aws lambda update-function-code `
        --function-name $FUNCTION_NAME `
        --zip-file "fileb://$ZIP_FILE" `
        --region $REGION
    Write-Host "✅ Lambda code đã cập nhật!"

    # Cập nhật handler name
    aws lambda update-function-configuration `
        --function-name $FUNCTION_NAME `
        --handler "didit-ekyc-handler.lambda_handler" `
        --region $REGION
} else {
    Write-Host "🆕 Tạo Lambda mới: $FUNCTION_NAME"
    $ROLE_ARN = (aws lambda get-function `
        --function-name "candidate-profile-handler" `
        --region $REGION `
        --query "Configuration.Role" `
        --output text 2>$null)

    if (-not $ROLE_ARN) {
        Write-Host "❌ Không tìm được Role ARN từ candidate-profile-handler."
        Write-Host "   Hãy set thủ công: `$ROLE_ARN = 'arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME'"
        exit 1
    }
    Write-Host "🔑 Dùng Role ARN: $ROLE_ARN"

    aws lambda create-function `
        --function-name $FUNCTION_NAME `
        --runtime python3.11 `
        --role $ROLE_ARN `
        --handler "didit-ekyc-handler.lambda_handler" `
        --zip-file "fileb://$ZIP_FILE" `
        --region $REGION `
        --timeout 30 `
        --memory-size 256
    Write-Host "✅ Lambda đã tạo!"
}

# ── Cập nhật env vars Lambda ───────────────────────────────────────────────────
Write-Host "⚙️  Cập nhật environment variables Lambda..."
aws lambda update-function-configuration `
    --function-name $FUNCTION_NAME `
    --environment "Variables={DIDIT_API_BASE_URL=https://verification.didit.me,DIDIT_WORKFLOW_ID=YOUR_WORKFLOW_ID,DIDIT_CALLBACK_URL=https://your-frontend.com/candidate/kyc/callback}" `
    --region $REGION
Write-Host "   (Hãy thay YOUR_WORKFLOW_ID và callback URL thực tế)"

# ── Gán quyền đọc secret Didit từ Secrets Manager ─────────────────────────────
Write-Host "🔐 Cập nhật IAM policy cho Didit secret..."
$ROLE_NAME = (aws lambda get-function `
    --function-name $FUNCTION_NAME `
    --region $REGION `
    --query "Configuration.Role" `
    --output text) -replace ".*role/", ""

# Policy mới: chỉ cho phép đọc secret Didit
# KHÔNG cần quyền nào thêm cho việc gọi Didit API (HTTP ra ngoài thông thường)
$ACCOUNT_ID = (aws sts get-caller-identity --query "Account" --output text)

aws iam put-role-policy `
    --role-name $ROLE_NAME `
    --policy-name "didit-ekyc-secrets-policy" `
    --policy-document "{
        \"Version\":\"2012-10-17\",
        \"Statement\":[{
            \"Effect\":\"Allow\",
            \"Action\":[\"secretsmanager:GetSecretValue\"],
            \"Resource\":\"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:prod/didit/api-key*\"
        }]
    }"
Write-Host "✅ IAM policy cập nhật!"

# Ghi chú: policy cũ "ekyc-secrets-policy" (VNPT) giữ lại để rollback nếu cần
# Xoá sau khi xác nhận Didit hoạt động ổn:
#   aws iam delete-role-policy --role-name $ROLE_NAME --policy-name "ekyc-secrets-policy"

# ── Kiểm tra route webhook đã tồn tại chưa ────────────────────────────────────
Write-Host ""
Write-Host "🛣️  Kiểm tra route webhook Didit..."
$existingRoutes = aws apigatewayv2 get-routes --api-id $API_ID --region $REGION | ConvertFrom-Json
$webhookExists  = $existingRoutes.Items | Where-Object { $_.RouteKey -eq "POST /ekyc/webhook/didit" }

if (-not $webhookExists) {
    Write-Host "   Tạo route POST /ekyc/webhook/didit (PUBLIC — không JWT)..."
    $LAMBDA_ARN = (aws lambda get-function `
        --function-name $FUNCTION_NAME `
        --region $REGION `
        --query "Configuration.FunctionArn" `
        --output text)

    # Tìm integration hiện có của ekyc-handler để tái dùng
    $integrations = aws apigatewayv2 get-integrations --api-id $API_ID --region $REGION | ConvertFrom-Json
    $ekycInteg    = $integrations.Items | Where-Object { $_.IntegrationUri -like "*$FUNCTION_NAME*" } | Select-Object -First 1

    if ($ekycInteg) {
        $INTEGRATION_ID = $ekycInteg.IntegrationId
        Write-Host "   Tái dùng integration: $INTEGRATION_ID"
    } else {
        Write-Host "   Tạo integration mới..."
        $INTEGRATION_ID = (aws apigatewayv2 create-integration `
            --api-id $API_ID `
            --integration-type AWS_PROXY `
            --integration-uri $LAMBDA_ARN `
            --payload-format-version "2.0" `
            --region $REGION `
            --query "IntegrationId" --output text)
    }

    # Route webhook KHÔNG gắn Cognito Authorizer (Didit gọi vào, không phải user)
    aws apigatewayv2 create-route `
        --api-id $API_ID `
        --route-key "POST /ekyc/webhook/didit" `
        --target "integrations/$INTEGRATION_ID" `
        --authorization-type NONE `
        --region $REGION
    Write-Host "✅ Route webhook tạo thành công (KHÔNG có JWT auth)"

    # OPTIONS cho webhook (CORS preflight)
    aws apigatewayv2 create-route `
        --api-id $API_ID `
        --route-key "OPTIONS /ekyc/webhook/didit" `
        --target "integrations/$INTEGRATION_ID" `
        --region $REGION
} else {
    Write-Host "   Route webhook đã tồn tại — bỏ qua"
}

# ── Tạo route POST /ekyc/session nếu chưa có ─────────────────────────────────
$sessionExists = $existingRoutes.Items | Where-Object { $_.RouteKey -eq "POST /ekyc/session" }
if (-not $sessionExists) {
    Write-Host "🛣️  Tạo route POST /ekyc/session (có JWT auth)..."
    $LAMBDA_ARN = (aws lambda get-function `
        --function-name $FUNCTION_NAME `
        --region $REGION `
        --query "Configuration.FunctionArn" `
        --output text)
    $integrations = aws apigatewayv2 get-integrations --api-id $API_ID --region $REGION | ConvertFrom-Json
    $ekycInteg    = $integrations.Items | Where-Object { $_.IntegrationUri -like "*$FUNCTION_NAME*" } | Select-Object -First 1
    $INTEGRATION_ID = $ekycInteg.IntegrationId

    aws apigatewayv2 create-route `
        --api-id $API_ID `
        --route-key "POST /ekyc/session" `
        --target "integrations/$INTEGRATION_ID" `
        --authorization-type JWT `
        --authorizer-id $AUTHORIZER_ID `
        --region $REGION

    aws apigatewayv2 create-route `
        --api-id $API_ID `
        --route-key "OPTIONS /ekyc/session" `
        --target "integrations/$INTEGRATION_ID" `
        --region $REGION
    Write-Host "✅ Route /ekyc/session tạo thành công"
}

Write-Host ""
Write-Host "=================================================="
Write-Host "  Didit eKYC Lambda deployed!"
Write-Host ""
Write-Host "  Endpoints:"
Write-Host "  POST /ekyc/session            — Tạo session (JWT required)"
Write-Host "  GET  /ekyc/status/{userId}    — Trạng thái KYC (JWT required)"
Write-Host "  POST /ekyc/webhook/didit      — Webhook Didit (PUBLIC)"
Write-Host ""
Write-Host "  Secrets Manager: prod/didit/api-key"
Write-Host "  Lambda: $FUNCTION_NAME"
Write-Host "=================================================="
Write-Host ""
Write-Host "⚠️  Checklist sau deploy:"
Write-Host "  1. Cập nhật DIDIT_WORKFLOW_ID trong Lambda env vars"
Write-Host "  2. Đăng ký URL webhook với Didit:"
Write-Host "     https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod/ekyc/webhook/didit"
Write-Host "  3. Test tạo session thành công"
Write-Host "  4. Giữ Lambda ekyc-handler cũ (VNPT) trong git branch riêng để rollback"
