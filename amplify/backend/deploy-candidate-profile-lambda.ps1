# Deploy candidate-profile-lambda to AWS and wire up API Gateway route
$REGION = "ap-southeast-1"
$FUNCTION_NAME = "candidate-profile-handler"
$API_ID = "sd7ds72m8g"
$ZIP_FILE = "candidate-profile-lambda.zip"

Write-Host "📦 Zipping Lambda..."
Compress-Archive -Path candidate-profile-lambda.py, email_service.py, job_recommender.py -DestinationPath $ZIP_FILE -Force

# Check if function exists
$exists = aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "🔄 Updating existing Lambda..."
    aws lambda update-function-code `
        --function-name $FUNCTION_NAME `
        --zip-file fileb://$ZIP_FILE `
        --region $REGION
} else {
    Write-Host "🆕 Creating new Lambda..."
    # Get role ARN from existing lambda
    $ROLE_ARN = (aws lambda get-function --function-name "candidate-api-handler" --region $REGION --query "Configuration.Role" --output text 2>$null)
    if (-not $ROLE_ARN) {
        Write-Host "❌ Could not find role ARN. Please set ROLE_ARN manually."
        exit 1
    }
    aws lambda create-function `
        --function-name $FUNCTION_NAME `
        --runtime python3.11 `
        --role $ROLE_ARN `
        --handler candidate-profile-lambda.lambda_handler `
        --zip-file fileb://$ZIP_FILE `
        --region $REGION `
        --timeout 30
}

Write-Host "✅ Lambda deployed!"

# Get Lambda ARN
$LAMBDA_ARN = (aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query "Configuration.FunctionArn" --output text)
Write-Host "🔗 Lambda ARN: $LAMBDA_ARN"

# Create integration
Write-Host "🔌 Creating API Gateway integration..."
$INTEGRATION_ID = (aws apigatewayv2 create-integration `
    --api-id $API_ID `
    --integration-type AWS_PROXY `
    --integration-uri $LAMBDA_ARN `
    --payload-format-version "2.0" `
    --region $REGION `
    --query "IntegrationId" --output text)
Write-Host "Integration ID: $INTEGRATION_ID"

# Create routes
Write-Host "🛣️ Creating routes..."
aws apigatewayv2 create-route --api-id $API_ID --route-key "GET /profile/{userId}" --target "integrations/$INTEGRATION_ID" --region $REGION
aws apigatewayv2 create-route --api-id $API_ID --route-key "POST /profile" --target "integrations/$INTEGRATION_ID" --region $REGION
aws apigatewayv2 create-route --api-id $API_ID --route-key "PUT /profile/{userId}" --target "integrations/$INTEGRATION_ID" --region $REGION
aws apigatewayv2 create-route --api-id $API_ID --route-key "DELETE /profile/{userId}" --target "integrations/$INTEGRATION_ID" --region $REGION
aws apigatewayv2 create-route --api-id $API_ID --route-key "OPTIONS /profile/{userId}" --target "integrations/$INTEGRATION_ID" --region $REGION

# Add Lambda permission for API Gateway
Write-Host "🔐 Adding Lambda permission..."
aws lambda add-permission `
    --function-name $FUNCTION_NAME `
    --statement-id apigateway-invoke `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:${REGION}:*:${API_ID}/*" `
    --region $REGION

# Enable CORS on API
Write-Host "🌐 Enabling CORS..."
aws apigatewayv2 update-api `
    --api-id $API_ID `
    --cors-configuration AllowOrigins="*",AllowHeaders="Content-Type,Authorization",AllowMethods="GET,POST,PUT,DELETE,OPTIONS" `
    --region $REGION

Write-Host "✅ Done! Routes created for /profile/{userId}"
