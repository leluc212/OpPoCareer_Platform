# ─────────────────────────────────────────────────────────────────────────────
# Deploy check-email-provider Lambda + thêm route vào API Gateway sd7ds72m8g
#
# Usage (từ thư mục amplify/backend/):
#   .\deploy-check-email-lambda.ps1
#
# Route được tạo:
#   GET /auth/check-email  (KHÔNG cần xác thực — dùng trước khi đăng ký/đăng nhập)
#   OPTIONS /auth/check-email  (CORS preflight)
#
# Throttling: API Gateway HTTP API mặc định đã có throttling 10K req/s ở API level.
# Route-level throttling: 10 req/s / 5 burst (cấu hình bên dưới nếu muốn)
# ─────────────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Continue"

$REGION        = "ap-southeast-1"
$FUNCTION_NAME = "check-email-provider"
$API_ID        = "sd7ds72m8g"      # Candidate/eKYC HTTP API — dùng chung
$ZIP_FILE      = "check-email-lambda.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy check-email-provider Lambda"     -ForegroundColor Cyan
Write-Host "  API: $API_ID | Region: $REGION"         -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ── 1. Zip Lambda ─────────────────────────────────────────────────────────────
Write-Host "`n📦 Step 1: Packaging Lambda..." -ForegroundColor Yellow
if (Test-Path $ZIP_FILE) { Remove-Item $ZIP_FILE -Force }

# check-email-lambda.js cần @aws-sdk/client-cognito-identity-provider
# Lambda Node.js 18+ runtime đã có @aws-sdk/client-* built-in → không cần node_modules
Compress-Archive -Path "check-email-lambda.js" -DestinationPath $ZIP_FILE -Force
Write-Host "  ✅ Zipped: $ZIP_FILE" -ForegroundColor Green

# ── 2. Lấy Role ARN từ Lambda hiện có (tái dùng role) ─────────────────────────
Write-Host "`n🔑 Step 2: Getting IAM Role from existing Lambda..." -ForegroundColor Yellow
$ROLE_ARN = (aws lambda get-function `
    --function-name "candidate-profile-handler" `
    --region $REGION `
    --query "Configuration.Role" `
    --output text 2>$null)

if (-not $ROLE_ARN -or $ROLE_ARN -eq "None") {
    Write-Host "  ⚠️  candidate-profile-handler not found, trying ekyc-handler..." -ForegroundColor Yellow
    $ROLE_ARN = (aws lambda get-function `
        --function-name "ekyc-handler" `
        --region $REGION `
        --query "Configuration.Role" `
        --output text 2>$null)
}

if (-not $ROLE_ARN -or $ROLE_ARN -eq "None") {
    Write-Host "  ❌ Không tìm được Role ARN. Vui lòng kiểm tra Lambda hiện có." -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Role ARN: $ROLE_ARN" -ForegroundColor Green

# ── 3. Thêm quyền cognito-idp:ListUsers vào role ──────────────────────────────
Write-Host "`n🔐 Step 3: Ensuring Cognito ListUsers permission on role..." -ForegroundColor Yellow
$ROLE_NAME = $ROLE_ARN -replace ".*role/", ""

# Kiểm tra policy đã tồn tại chưa
$existingPolicy = aws iam get-role-policy `
    --role-name $ROLE_NAME `
    --policy-name "check-email-cognito-policy" `
    --region $REGION 2>$null

if ($LASTEXITCODE -ne 0) {
    # Tạo inline policy chỉ cho ListUsers trên đúng User Pool
    $policyDoc = '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": ["cognito-idp:ListUsers"],
            "Resource": "arn:aws:cognito-idp:ap-southeast-1:*:userpool/ap-southeast-1_ShCajkmJd"
        }]
    }'
    
    aws iam put-role-policy `
        --role-name $ROLE_NAME `
        --policy-name "check-email-cognito-policy" `
        --policy-document $policyDoc `
        --region $REGION | Out-Null
    
    Write-Host "  ✅ Cognito ListUsers policy attached!" -ForegroundColor Green
} else {
    Write-Host "  ✅ Policy already exists." -ForegroundColor Green
}

# ── 4. Create / Update Lambda ─────────────────────────────────────────────────
Write-Host "`n⚡ Step 4: Deploying Lambda '$FUNCTION_NAME'..." -ForegroundColor Yellow

$lambdaExists = aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  🔄 Updating existing Lambda..." -ForegroundColor Cyan
    aws lambda update-function-code `
        --function-name $FUNCTION_NAME `
        --zip-file "fileb://$ZIP_FILE" `
        --region $REGION | Out-Null
    
    Start-Sleep -Seconds 3
    
    aws lambda update-function-configuration `
        --function-name $FUNCTION_NAME `
        --runtime nodejs18.x `
        --timeout 10 `
        --memory-size 128 `
        --environment "Variables={USER_POOL_ID=ap-southeast-1_ShCajkmJd}" `
        --region $REGION | Out-Null
    
    Write-Host "  ✅ Lambda updated!" -ForegroundColor Green
} else {
    Write-Host "  🆕 Creating new Lambda..." -ForegroundColor Cyan
    
    # Chờ role propagate nếu vừa tạo policy
    Start-Sleep -Seconds 5
    
    aws lambda create-function `
        --function-name $FUNCTION_NAME `
        --runtime nodejs18.x `
        --role $ROLE_ARN `
        --handler "check-email-lambda.handler" `
        --zip-file "fileb://$ZIP_FILE" `
        --timeout 10 `
        --memory-size 128 `
        --environment "Variables={USER_POOL_ID=ap-southeast-1_ShCajkmJd}" `
        --region $REGION | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Lambda created!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Lambda creation failed!" -ForegroundColor Red
        exit 1
    }
}

# Lấy Lambda ARN
$LAMBDA_ARN = (aws lambda get-function `
    --function-name $FUNCTION_NAME `
    --region $REGION `
    --query "Configuration.FunctionArn" `
    --output text)
Write-Host "  🔗 Lambda ARN: $LAMBDA_ARN" -ForegroundColor Cyan

# ── 5. Tạo API Gateway Integration ────────────────────────────────────────────
Write-Host "`n🔌 Step 5: Creating API Gateway integration..." -ForegroundColor Yellow

$INTEGRATION_ID = (aws apigatewayv2 create-integration `
    --api-id $API_ID `
    --integration-type AWS_PROXY `
    --integration-uri $LAMBDA_ARN `
    --payload-format-version "2.0" `
    --region $REGION `
    --query "IntegrationId" --output text 2>$null)

if (-not $INTEGRATION_ID -or $INTEGRATION_ID -eq "None") {
    Write-Host "  ❌ Failed to create integration!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Integration ID: $INTEGRATION_ID" -ForegroundColor Green

# ── 6. Tạo Routes ─────────────────────────────────────────────────────────────
Write-Host "`n🛣️  Step 6: Creating routes..." -ForegroundColor Yellow

# GET /auth/check-email — KHÔNG cần auth (user chưa đăng nhập)
$routeResult = aws apigatewayv2 create-route `
    --api-id $API_ID `
    --route-key "GET /auth/check-email" `
    --target "integrations/$INTEGRATION_ID" `
    --region $REGION 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Route created: GET /auth/check-email" -ForegroundColor Green
} elseif ($routeResult -match "ConflictException" -or $routeResult -match "already exists") {
    Write-Host "  ⚠️  Route already exists (OK): GET /auth/check-email" -ForegroundColor Yellow
} else {
    Write-Host "  ❌ Failed to create route: $routeResult" -ForegroundColor Red
}

# OPTIONS /auth/check-email — CORS preflight (không cần auth)
$optionsResult = aws apigatewayv2 create-route `
    --api-id $API_ID `
    --route-key "OPTIONS /auth/check-email" `
    --target "integrations/$INTEGRATION_ID" `
    --region $REGION 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Route created: OPTIONS /auth/check-email" -ForegroundColor Green
} elseif ($optionsResult -match "ConflictException" -or $optionsResult -match "already exists") {
    Write-Host "  ⚠️  Route already exists (OK): OPTIONS /auth/check-email" -ForegroundColor Yellow
} else {
    Write-Host "  ❌ Failed to create OPTIONS route: $optionsResult" -ForegroundColor Red
}

# ── 7. Lambda invoke permission cho API Gateway ────────────────────────────────
Write-Host "`n🔐 Step 7: Adding Lambda invoke permission..." -ForegroundColor Yellow
aws lambda add-permission `
    --function-name $FUNCTION_NAME `
    --statement-id "apigateway-check-email-invoke" `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:${REGION}:*:${API_ID}/*" `
    --region $REGION 2>$null | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Lambda invoke permission added!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Permission may already exist (OK)." -ForegroundColor Yellow
}

# ── 8. Cập nhật CORS trên API Gateway ─────────────────────────────────────────
Write-Host "`n🌐 Step 8: Updating CORS on API Gateway..." -ForegroundColor Yellow
aws apigatewayv2 update-api `
    --api-id $API_ID `
    --cors-configuration AllowOrigins="http://localhost:3000,http://localhost:5000,http://localhost:5173,http://localhost:4173,https://oppocareer.com,https://www.oppocareer.com",AllowHeaders="Content-Type,Authorization",AllowMethods="GET,POST,PUT,DELETE,OPTIONS" `
    --region $REGION | Out-Null

Write-Host "  ✅ CORS updated!" -ForegroundColor Green

# HTTP API auto-deploys — không cần deployment step
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ Deployment COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "  Endpoint:" -ForegroundColor Cyan
Write-Host "  https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod/auth/check-email?email=test@example.com" -ForegroundColor White
Write-Host ""
Write-Host "  Thêm vào .env:" -ForegroundColor Yellow
Write-Host "  VITE_CHECK_EMAIL_API=https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod" -ForegroundColor White
Write-Host ""
Write-Host "  Test:" -ForegroundColor Yellow
Write-Host "  curl 'https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod/auth/check-email?email=YOUR_EMAIL'" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
