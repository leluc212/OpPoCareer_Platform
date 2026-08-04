# PowerShell script to create the {proxy+} resource under /admin/employers
# in the EmployerProfileAPI REST API of the new account.
$REST_API_ID = "fhkig55p32"
$REGION = "ap-southeast-1"
$LAMBDA_ARN = "arn:aws:lambda:ap-southeast-1:589362963105:function:EmployerProfileAPI"
$INTEGRATION_URI = "arn:aws:apigateway:ap-southeast-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

$resources = aws apigateway get-resources --rest-api-id $REST_API_ID --region $REGION | ConvertFrom-Json
$PARENT_RESOURCE_ID = ($resources.items | Where-Object { $_.path -eq "/admin/employers" }).id
if (-not $PARENT_RESOURCE_ID) { throw "Resource /admin/employers not found in API $REST_API_ID" }

Write-Host "Creating {proxy+} resource under /admin/employers in API Gateway..."
$resource = aws apigateway create-resource `
    --rest-api-id $REST_API_ID `
    --parent-id $PARENT_RESOURCE_ID `
    --path-part "{proxy+}" `
    --region $REGION `
    --query "id" --output text

if ($LASTEXITCODE -ne 0 -or -not $resource) {
    Write-Host "❌ Failed to create resource or resource already exists. Attempting to get existing one..."
    # Let's find the resource if it already exists
    $resources = aws apigateway get-resources --rest-api-id $REST_API_ID --region $REGION --query "items[?pathPart=='{proxy+}']" --output json
    Write-Host "Existing resources check: $resources"
    exit 1
}
Write-Host "✅ Created resource ID: $resource"

Write-Host "Creating ANY method..."
aws apigateway put-method `
    --rest-api-id $REST_API_ID `
    --resource-id $resource `
    --http-method ANY `
    --authorization-type NONE `
    --region $REGION

Write-Host "Creating Lambda Integration..."
aws apigateway put-integration `
    --rest-api-id $REST_API_ID `
    --resource-id $resource `
    --http-method ANY `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri $INTEGRATION_URI `
    --region $REGION

Write-Host "Deploying API to stage: prod..."
aws apigateway create-deployment `
    --rest-api-id $REST_API_ID `
    --stage-name prod `
    --region $REGION

Write-Host "🎉 Successfully created proxy route and deployed API!"
