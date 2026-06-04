# Deploy ekyc-handler Lambda to AWS + wire API Gateway routes
# Chạy từ thư mục: amplify/backend/
#
# Trước khi chạy lần đầu — tạo secret trong Secrets Manager:
#   aws secretsmanager create-secret --name vnpt-ekyc-credentials `
#     --secret-string '{"token_id":"YOUR_TOKEN_ID","token_key":"YOUR_TOKEN_KEY"}' `
#     --region ap-southeast-1

$REGION        = "ap-southeast-1"
$FUNCTION_NAME = "ekyc-handler"
$API_ID        = "sd7ds72m8g"       # API Gateway HTTP API — dùng chung với candidate profile
$ZIP_FILE      = "ekyc-handler.zip"

Write-Host "📦 Updating ekyc_handler.py inside zip..."
python update_ekyc_zip.py

# ── Deploy Lambda ──────────────────────────────────────────────────────────────
$exists = aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "🔄 Updating existing Lambda: $FUNCTION_NAME"
    aws lambda update-function-code `
        --function-name $FUNCTION_NAME `
        --zip-file "fileb://$ZIP_FILE" `
        --region $REGION
    Write-Host "✅ Lambda code updated!"
} else {
    Write-Host "🆕 Creating new Lambda: $FUNCTION_NAME"

    # Lấy Role ARN từ Lambda hiện có
    $ROLE_ARN = (aws lambda get-function `
        --function-name "candidate-profile-handler" `
        --region $REGION `
        --query "Configuration.Role" `
        --output text 2>$null)

    if (-not $ROLE_ARN) {
        Write-Host "❌ Không tìm được Role ARN. Chỉnh ROLE_ARN thủ công."
        exit 1
    }
    Write-Host "🔑 Using Role ARN: $ROLE_ARN"

    aws lambda create-function `
        --function-name $FUNCTION_NAME `
        --runtime python3.11 `
        --role $ROLE_ARN `
        --handler ekyc_handler.lambda_handler `
        --zip-file "fileb://$ZIP_FILE" `
        --region $REGION `
        --timeout 30 `
        --memory-size 256
    Write-Host "✅ Lambda created!"
}

# ── Gán quyền đọc Secrets Manager cho Lambda role ─────────────────────────────
Write-Host "🔐 Attaching Secrets Manager policy to Lambda role..."
$ROLE_NAME = (aws lambda get-function `
    --function-name $FUNCTION_NAME `
    --region $REGION `
    --query "Configuration.Role" `
    --output text) -replace ".*role/", ""

aws iam put-role-policy `
    --role-name $ROLE_NAME `
    --policy-name "ekyc-secrets-policy" `
    --policy-document '{
        "Version":"2012-10-17",
        "Statement":[{
            "Effect":"Allow",
            "Action":["secretsmanager:GetSecretValue"],
            "Resource":"arn:aws:secretsmanager:ap-southeast-1:*:secret:vnpt-ekyc-credentials*"
        }]
    }'
Write-Host "✅ Secrets policy attached!"

# ── API Gateway integration ────────────────────────────────────────────────────
$LAMBDA_ARN = (aws lambda get-function `
    --function-name $FUNCTION_NAME `
    --region $REGION `
    --query "Configuration.FunctionArn" `
    --output text)
Write-Host "🔗 Lambda ARN: $LAMBDA_ARN"

Write-Host "🔌 Creating API Gateway integration..."
$INTEGRATION_ID = (aws apigatewayv2 create-integration `
    --api-id $API_ID `
    --integration-type AWS_PROXY `
    --integration-uri $LAMBDA_ARN `
    --payload-format-version "2.0" `
    --region $REGION `
    --query "IntegrationId" --output text)
Write-Host "✅ Integration ID: $INTEGRATION_ID"

# ── Routes ─────────────────────────────────────────────────────────────────────
Write-Host "🛣️  Creating routes..."
aws apigatewayv2 create-route --api-id $API_ID --route-key "POST /ekyc/ocr"              --target "integrations/$INTEGRATION_ID" --region $REGION
aws apigatewayv2 create-route --api-id $API_ID --route-key "POST /ekyc/verify-face"      --target "integrations/$INTEGRATION_ID" --region $REGION
aws apigatewayv2 create-route --api-id $API_ID --route-key "GET /ekyc/status/{userId}"   --target "integrations/$INTEGRATION_ID" --region $REGION
aws apigatewayv2 create-route --api-id $API_ID --route-key "OPTIONS /ekyc/ocr"           --target "integrations/$INTEGRATION_ID" --region $REGION
aws apigatewayv2 create-route --api-id $API_ID --route-key "OPTIONS /ekyc/verify-face"   --target "integrations/$INTEGRATION_ID" --region $REGION

# ── Lambda invoke permission ───────────────────────────────────────────────────
Write-Host "🔐 Adding Lambda invoke permission..."
aws lambda add-permission `
    --function-name $FUNCTION_NAME `
    --statement-id "apigateway-ekyc-invoke" `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:${REGION}:*:${API_ID}/*" `
    --region $REGION 2>$null

# ── CORS ───────────────────────────────────────────────────────────────────────
Write-Host "🌐 Updating CORS..."
aws apigatewayv2 update-api `
    --api-id $API_ID `
    --cors-configuration AllowOrigins="*",AllowHeaders="Content-Type,Authorization",AllowMethods="GET,POST,PUT,DELETE,OPTIONS" `
    --region $REGION

Write-Host ""
Write-Host "=================================================="
Write-Host "  eKYC Lambda deployed successfully!"
Write-Host ""
Write-Host "  Endpoint base:"
Write-Host "  https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com"
Write-Host "  /prod/ekyc/ocr"
Write-Host "  /prod/ekyc/verify-face"
Write-Host "  /prod/ekyc/status/{userId}"
Write-Host "=================================================="
