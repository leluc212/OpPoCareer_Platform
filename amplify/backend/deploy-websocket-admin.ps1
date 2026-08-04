# =============================================================================
# deploy-websocket-admin.ps1
# Deploy toàn bộ infrastructure cho Admin WebSocket realtime:
#   1. Bảng DynamoDB: AdminWebSocketConnections
#   2. Lambda: ws-admin-connect
#   3. Lambda: ws-admin-disconnect
#   4. Lambda: ws-admin-stream-broadcast (trigger DynamoDB Streams)
#   5. API Gateway WebSocket API
#   6. Bật DynamoDB Streams trên bảng Applications
#
# Yêu cầu: AWS CLI đã cấu hình, region ap-southeast-1
# Chạy: .\deploy-websocket-admin.ps1
# =============================================================================

$REGION       = "ap-southeast-1"
$ACCOUNT_ID   = (aws sts get-caller-identity --query Account --output text)
$STAGE        = "prod"

# Tên các resource
$CONNECTIONS_TABLE = "AdminWebSocketConnections"
$APPLICATIONS_TABLE = "StandardApplications"
# Reuse the migrated execution role so all Admin WebSocket Lambdas use the
# same account-local DynamoDB, CloudWatch and API Gateway permissions.
$LAMBDA_ROLE_NAME  = "OpPoReviewLegacyLambdaExecutionRole-prod"
$CONNECT_LAMBDA    = "ws-admin-connect"
$DISCONNECT_LAMBDA = "ws-admin-disconnect"
$BROADCAST_LAMBDA  = "ws-admin-stream-broadcast"

Write-Host "=== BƯỚC 1: Tạo bảng DynamoDB AdminWebSocketConnections ===" -ForegroundColor Cyan

$tableExists = aws dynamodb describe-table --table-name $CONNECTIONS_TABLE --region $REGION 2>$null
if (-not $tableExists) {
    aws dynamodb create-table `
        --table-name $CONNECTIONS_TABLE `
        --attribute-definitions AttributeName=connectionId,AttributeType=S `
        --key-schema AttributeName=connectionId,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $REGION
    Write-Host "✅ Đã tạo bảng $CONNECTIONS_TABLE"
    
    # Bật TTL
    aws dynamodb update-time-to-live `
        --table-name $CONNECTIONS_TABLE `
        --time-to-live-specification "Enabled=true,AttributeName=ttl" `
        --region $REGION
    Write-Host "✅ Đã bật TTL trên $CONNECTIONS_TABLE"
} else {
    Write-Host "ℹ️ Bảng $CONNECTIONS_TABLE đã tồn tại"
}

Write-Host ""
Write-Host "=== BƯỚC 2: Tạo IAM Role cho Lambda ===" -ForegroundColor Cyan

$trustPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
'@

$roleExists = aws iam get-role --role-name $LAMBDA_ROLE_NAME 2>$null
if (-not $roleExists) {
    aws iam create-role `
        --role-name $LAMBDA_ROLE_NAME `
        --assume-role-policy-document $trustPolicy
    
    # Gắn policies cần thiết
    aws iam attach-role-policy `
        --role-name $LAMBDA_ROLE_NAME `
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    aws iam attach-role-policy `
        --role-name $LAMBDA_ROLE_NAME `
        --policy-arn "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
    aws iam attach-role-policy `
        --role-name $LAMBDA_ROLE_NAME `
        --policy-arn "arn:aws:iam::aws:policy/AmazonAPIGatewayInvokeFullAccess"
    aws iam attach-role-policy `
        --role-name $LAMBDA_ROLE_NAME `
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaDynamoDBExecutionRole"
    
    Write-Host "✅ Đã tạo IAM Role $LAMBDA_ROLE_NAME"
    Start-Sleep -Seconds 10  # Chờ role propagate
} else {
    Write-Host "ℹ️ IAM Role $LAMBDA_ROLE_NAME đã tồn tại"
}

$ROLE_ARN = "arn:aws:iam::${ACCOUNT_ID}:role/${LAMBDA_ROLE_NAME}"

Write-Host ""
Write-Host "=== BƯỚC 3: Deploy Lambda ws-admin-connect ===" -ForegroundColor Cyan

# Nén file Python
Compress-Archive -Path "websocket-connect-lambda.py" -DestinationPath "ws-connect.zip" -Force
Rename-Item -Path "ws-connect.zip" -NewName "ws-connect-tmp.zip" -Force
# Thay đổi tên file trong zip thành lambda_function.py
Add-Type -Assembly "System.IO.Compression.FileSystem"
$zipPath = (Resolve-Path "ws-connect-tmp.zip").Path
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Update)
$entry = $zip.GetEntry("websocket-connect-lambda.py")
if ($entry) { $entry.Delete() }
$zip.Dispose()
# Tạo lại zip với tên đúng
Remove-Item "ws-connect-tmp.zip" -Force
Copy-Item "websocket-connect-lambda.py" "lambda_function.py" -Force
Compress-Archive -Path "lambda_function.py" -DestinationPath "ws-connect.zip" -Force
Remove-Item "lambda_function.py" -Force

$connectExists = aws lambda get-function --function-name $CONNECT_LAMBDA --region $REGION 2>$null
if ($connectExists) {
    aws lambda update-function-code `
        --function-name $CONNECT_LAMBDA `
        --zip-file fileb://ws-connect.zip `
        --region $REGION | Out-Null
    Write-Host "✅ Đã cập nhật Lambda $CONNECT_LAMBDA"
} else {
    aws lambda create-function `
        --function-name $CONNECT_LAMBDA `
        --runtime python3.12 `
        --role $ROLE_ARN `
        --handler lambda_function.lambda_handler `
        --zip-file fileb://ws-connect.zip `
        --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE,USER_POOL_ID=ap-southeast-1_LUa2Zfjtv}" `
        --timeout 10 `
        --region $REGION | Out-Null
    Write-Host "✅ Đã tạo Lambda $CONNECT_LAMBDA"
}

# Keep the Cognito pool explicit on both newly-created and existing Lambdas.
aws lambda update-function-configuration `
    --function-name $CONNECT_LAMBDA `
    --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE,USER_POOL_ID=ap-southeast-1_LUa2Zfjtv}" `
    --region $REGION | Out-Null

Write-Host ""
Write-Host "=== BƯỚC 4: Deploy Lambda ws-admin-disconnect ===" -ForegroundColor Cyan

Copy-Item "websocket-disconnect-lambda.py" "lambda_function.py" -Force
Compress-Archive -Path "lambda_function.py" -DestinationPath "ws-disconnect.zip" -Force
Remove-Item "lambda_function.py" -Force

$disconnectExists = aws lambda get-function --function-name $DISCONNECT_LAMBDA --region $REGION 2>$null
if ($disconnectExists) {
    aws lambda update-function-code `
        --function-name $DISCONNECT_LAMBDA `
        --zip-file fileb://ws-disconnect.zip `
        --region $REGION | Out-Null
    Write-Host "✅ Đã cập nhật Lambda $DISCONNECT_LAMBDA"
} else {
    aws lambda create-function `
        --function-name $DISCONNECT_LAMBDA `
        --runtime python3.12 `
        --role $ROLE_ARN `
        --handler lambda_function.lambda_handler `
        --zip-file fileb://ws-disconnect.zip `
        --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE}" `
        --timeout 10 `
        --region $REGION | Out-Null
    Write-Host "✅ Đã tạo Lambda $DISCONNECT_LAMBDA"
}

Write-Host ""
Write-Host "=== BƯỚC 5: Deploy Lambda ws-admin-stream-broadcast ===" -ForegroundColor Cyan

Copy-Item "websocket-stream-broadcast-lambda.py" "lambda_function.py" -Force
Compress-Archive -Path "lambda_function.py" -DestinationPath "ws-broadcast.zip" -Force
Remove-Item "lambda_function.py" -Force

# NOTE: WS_API_ENDPOINT sẽ được cập nhật sau khi tạo WebSocket API ở bước 6
$broadcastExists = aws lambda get-function --function-name $BROADCAST_LAMBDA --region $REGION 2>$null
if ($broadcastExists) {
    aws lambda update-function-code `
        --function-name $BROADCAST_LAMBDA `
        --zip-file fileb://ws-broadcast.zip `
        --region $REGION | Out-Null
    Write-Host "✅ Đã cập nhật Lambda $BROADCAST_LAMBDA"
} else {
    aws lambda create-function `
        --function-name $BROADCAST_LAMBDA `
        --runtime python3.12 `
        --role $ROLE_ARN `
        --handler lambda_function.lambda_handler `
        --zip-file fileb://ws-broadcast.zip `
        --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE,WS_API_ENDPOINT=PLACEHOLDER}" `
        --timeout 30 `
        --region $REGION | Out-Null
    Write-Host "✅ Đã tạo Lambda $BROADCAST_LAMBDA"
}

Write-Host ""
Write-Host "=== BƯỚC 6: Tạo API Gateway WebSocket API ===" -ForegroundColor Cyan

# Kiểm tra xem API đã tồn tại chưa
$existingApi = aws apigatewayv2 get-apis --region $REGION --query "Items[?Name=='admin-ws-api'].ApiId" --output text
if ($existingApi -and $existingApi -ne "None") {
    $API_ID = $existingApi
    Write-Host "ℹ️ WebSocket API đã tồn tại: $API_ID"
} else {
    $apiResult = aws apigatewayv2 create-api `
        --name "admin-ws-api" `
        --protocol-type WEBSOCKET `
        --route-selection-expression '$request.body.action' `
        --region $REGION `
        --output json | ConvertFrom-Json
    $API_ID = $apiResult.ApiId
    Write-Host "✅ Đã tạo WebSocket API: $API_ID"
}

$CONNECT_LAMBDA_ARN    = "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${CONNECT_LAMBDA}"
$DISCONNECT_LAMBDA_ARN = "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${DISCONNECT_LAMBDA}"

# Tạo Lambda integrations
$connectIntegration = aws apigatewayv2 create-integration `
    --api-id $API_ID `
    --integration-type AWS_PROXY `
    --integration-uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${CONNECT_LAMBDA_ARN}/invocations" `
    --region $REGION `
    --output json | ConvertFrom-Json

$disconnectIntegration = aws apigatewayv2 create-integration `
    --api-id $API_ID `
    --integration-type AWS_PROXY `
    --integration-uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${DISCONNECT_LAMBDA_ARN}/invocations" `
    --region $REGION `
    --output json | ConvertFrom-Json

# Tạo routes
aws apigatewayv2 create-route `
    --api-id $API_ID `
    --route-key '$connect' `
    --target "integrations/$($connectIntegration.IntegrationId)" `
    --region $REGION | Out-Null

aws apigatewayv2 create-route `
    --api-id $API_ID `
    --route-key '$disconnect' `
    --target "integrations/$($disconnectIntegration.IntegrationId)" `
    --region $REGION | Out-Null

Write-Host "✅ Đã tạo routes $connect và $disconnect"

# Deploy stage
aws apigatewayv2 create-stage `
    --api-id $API_ID `
    --stage-name $STAGE `
    --auto-deploy `
    --region $REGION 2>$null | Out-Null
Write-Host "✅ Đã deploy stage $STAGE"

# Cấp quyền cho API Gateway gọi Lambda
aws lambda add-permission `
    --function-name $CONNECT_LAMBDA `
    --statement-id "apigateway-connect" `
    --action "lambda:InvokeFunction" `
    --principal "apigateway.amazonaws.com" `
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/$connect" `
    --region $REGION 2>$null | Out-Null

aws lambda add-permission `
    --function-name $DISCONNECT_LAMBDA `
    --statement-id "apigateway-disconnect" `
    --action "lambda:InvokeFunction" `
    --principal "apigateway.amazonaws.com" `
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/$disconnect" `
    --region $REGION 2>$null | Out-Null

$WS_ENDPOINT = "wss://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
$MGMT_ENDPOINT = "https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"

Write-Host ""
Write-Host "=== BƯỚC 7: Cập nhật WS_API_ENDPOINT cho Lambda broadcast ===" -ForegroundColor Cyan

aws lambda update-function-configuration `
    --function-name $BROADCAST_LAMBDA `
    --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE,WS_API_ENDPOINT=$MGMT_ENDPOINT}" `
    --region $REGION | Out-Null
Write-Host "✅ Đã cập nhật WS_API_ENDPOINT=$MGMT_ENDPOINT"

Write-Host ""
Write-Host "=== BƯỚC 8: Bật DynamoDB Streams trên bảng Applications ===" -ForegroundColor Cyan

$streamResult = aws dynamodb update-table `
    --table-name $APPLICATIONS_TABLE `
    --stream-specification "StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES" `
    --region $REGION `
    --output json | ConvertFrom-Json

$STREAM_ARN = $streamResult.TableDescription.LatestStreamArn
Write-Host "✅ Đã bật DynamoDB Streams: $STREAM_ARN"

Write-Host ""
Write-Host "=== BƯỚC 9: Gắn DynamoDB Stream làm trigger cho Lambda broadcast ===" -ForegroundColor Cyan

aws lambda create-event-source-mapping `
    --function-name $BROADCAST_LAMBDA `
    --event-source-arn $STREAM_ARN `
    --starting-position LATEST `
    --batch-size 10 `
    --filter-criteria '{"Filters":[{"Pattern":"{\"dynamodb\":{\"NewImage\":{\"status\":{\"S\":[\"pending_change\"]}}}}"},{"Pattern":"{\"eventName\":[\"MODIFY\"]}"}]}' `
    --region $REGION 2>$null | Out-Null
Write-Host "✅ Đã gắn DynamoDB Stream trigger cho $BROADCAST_LAMBDA"

# Cleanup zip files
Remove-Item "ws-connect.zip", "ws-disconnect.zip", "ws-broadcast.zip" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ DEPLOY HOÀN THÀNH" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "WebSocket Endpoint (dùng cho frontend):"
Write-Host "  $WS_ENDPOINT" -ForegroundColor Yellow
Write-Host ""
Write-Host "Thêm vào file .env:"
Write-Host "  VITE_ADMIN_WS_ENDPOINT=$WS_ENDPOINT" -ForegroundColor Yellow
Write-Host ""
Write-Host "Bảng Connections: $CONNECTIONS_TABLE"
Write-Host "Region: $REGION"
