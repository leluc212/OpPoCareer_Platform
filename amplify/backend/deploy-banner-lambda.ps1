# ─────────────────────────────────────────────────────────────────────────────
# Deploy Banner Management Lambda + API Gateway
# Usage: .\deploy-banner-lambda.ps1
#
# What it does:
#   1. Creates DynamoDB table "Banners" (if not exists)
#   2. Zips banner-lambda.py
#   3. Creates / updates Lambda function
#   4. Creates API Gateway with routes:
#      GET    /banners
#      POST   /banners
#      PUT    /banners/{bannerId}
#      DELETE /banners/{bannerId}
#      POST   /banners/upload
#   5. Prints the API base URL to paste into .env as VITE_BANNER_API_URL
# ─────────────────────────────────────────────────────────────────────────────

$Region         = "ap-southeast-1"
$AccountId      = (aws sts get-caller-identity --query Account --output text)
$FunctionName   = "BannerManagementLambda"
$RoleName       = "BannerLambdaRole"
$TableName      = "Banners"
$S3Bucket       = "opporeview-cv-storage"
$ZipFile        = "banner-lambda.zip"
$ApiName        = "BannerAPI"

Write-Host "🚀 Starting Banner Lambda deployment..." -ForegroundColor Cyan
Write-Host "Region: $Region | Account: $AccountId"

# ── 1. DynamoDB Table ──────────────────────────────────────────────────────────
Write-Host "`n📦 Step 1: Ensuring DynamoDB table '$TableName'..." -ForegroundColor Yellow

$tableExists = aws dynamodb describe-table --table-name $TableName --region $Region 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Creating table..."
    aws dynamodb create-table `
        --table-name $TableName `
        --attribute-definitions AttributeName=bannerId,AttributeType=S `
        --key-schema AttributeName=bannerId,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $Region | Out-Null

    Write-Host "  Waiting for table to become active..."
    aws dynamodb wait table-exists --table-name $TableName --region $Region
    Write-Host "  ✅ Table created." -ForegroundColor Green
} else {
    Write-Host "  ✅ Table already exists." -ForegroundColor Green
}

# ── 2. IAM Role ────────────────────────────────────────────────────────────────
Write-Host "`n🔐 Step 2: Ensuring IAM Role '$RoleName'..." -ForegroundColor Yellow

$roleExists = aws iam get-role --role-name $RoleName 2>&1
if ($LASTEXITCODE -ne 0) {
    $trustPolicy = '{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"lambda.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}'
    aws iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document $trustPolicy | Out-Null

    # Attach managed policies
    aws iam attach-role-policy --role-name $RoleName --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole | Out-Null
    aws iam attach-role-policy --role-name $RoleName --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess | Out-Null
    aws iam attach-role-policy --role-name $RoleName --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess | Out-Null

    Write-Host "  Waiting for role propagation (15s)..."
    Start-Sleep -Seconds 15
    Write-Host "  ✅ Role created." -ForegroundColor Green
} else {
    Write-Host "  ✅ Role already exists." -ForegroundColor Green
}

$RoleArn = "arn:aws:iam::${AccountId}:role/${RoleName}"

# ── 3. Zip Lambda ──────────────────────────────────────────────────────────────
Write-Host "`n📦 Step 3: Packaging Lambda..." -ForegroundColor Yellow

if (Test-Path $ZipFile) { Remove-Item $ZipFile }
Compress-Archive -Path "banner-lambda.py" -DestinationPath $ZipFile -Force
Write-Host "  ✅ Zipped to $ZipFile" -ForegroundColor Green

# ── 4. Create / Update Lambda ──────────────────────────────────────────────────
Write-Host "`n⚡ Step 4: Deploying Lambda '$FunctionName'..." -ForegroundColor Yellow

$lambdaExists = aws lambda get-function --function-name $FunctionName --region $Region 2>&1
if ($LASTEXITCODE -ne 0) {
    $EnvVars = 'Variables={BANNERS_TABLE=' + $TableName + ',S3_BUCKET=' + $S3Bucket + ',S3_REGION=' + $Region + ',MAX_ACTIVE_BANNERS=5}'
    aws lambda create-function `
        --function-name $FunctionName `
        --runtime python3.12 `
        --role $RoleArn `
        --handler "banner-lambda.handler" `
        --zip-file "fileb://$ZipFile" `
        --timeout 30 `
        --memory-size 256 `
        --environment $EnvVars `
        --region $Region | Out-Null
    Write-Host "  ✅ Lambda created." -ForegroundColor Green
} else {
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://$ZipFile" `
        --region $Region | Out-Null

    Start-Sleep -Seconds 5

    $EnvVars = 'Variables={BANNERS_TABLE=' + $TableName + ',S3_BUCKET=' + $S3Bucket + ',S3_REGION=' + $Region + ',MAX_ACTIVE_BANNERS=5}'
    aws lambda update-function-configuration `
        --function-name $FunctionName `
        --timeout 30 `
        --memory-size 256 `
        --environment $EnvVars `
        --region $Region | Out-Null
    Write-Host "  ✅ Lambda updated." -ForegroundColor Green
}

$LambdaArn = "arn:aws:lambda:${Region}:${AccountId}:function:${FunctionName}"

# ── 5. API Gateway ─────────────────────────────────────────────────────────────
Write-Host "`n🌐 Step 5: Setting up API Gateway '$ApiName'..." -ForegroundColor Yellow

# Check existing
$existingApi = aws apigateway get-rest-apis --region $Region --query "items[?name=='$ApiName'].id" --output text
if ([string]::IsNullOrWhiteSpace($existingApi) -or $existingApi -eq "None") {

    $apiId = (aws apigateway create-rest-api `
        --name $ApiName `
        --description "Banner Management API" `
        --region $Region `
        --query 'id' --output text)
    Write-Host "  Created API: $apiId"
} else {
    $apiId = $existingApi.Trim()
    Write-Host "  Using existing API: $apiId"
}

# Root resource
$rootId = (aws apigateway get-resources --rest-api-id $apiId --region $Region `
    --query 'items[?path==`/`].id' --output text).Trim()

# Helper: get or create resource
function Get-OrCreateResource($parentId, $pathPart) {
    $existing = (aws apigateway get-resources --rest-api-id $apiId --region $Region `
        --query "items[?pathPart=='$pathPart' && parentId=='$parentId'].id" --output text).Trim()
    if ([string]::IsNullOrWhiteSpace($existing) -or $existing -eq "None") {
        $existing = (aws apigateway create-resource `
            --rest-api-id $apiId --parent-id $parentId --path-part $pathPart `
            --region $Region --query 'id' --output text).Trim()
    }
    return $existing
}

# Helper: put method + lambda integration
function Add-Method($resourceId, $httpMethod) {
    aws apigateway put-method `
        --rest-api-id $apiId --resource-id $resourceId `
        --http-method $httpMethod --authorization-type NONE `
        --region $Region 2>&1 | Out-Null

    $uri = "arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations"
    aws apigateway put-integration `
        --rest-api-id $apiId --resource-id $resourceId `
        --http-method $httpMethod --type AWS_PROXY `
        --integration-http-method POST `
        --uri $uri `
        --region $Region 2>&1 | Out-Null
}

# /banners resource
$bannersId = Get-OrCreateResource $rootId "banners"

# /banners/upload resource (must be before {bannerId} to avoid conflict)
$uploadId = Get-OrCreateResource $bannersId "upload"

# /banners/{bannerId} resource
$bannerItemId = Get-OrCreateResource $bannersId "{bannerId}"

# Add methods
Add-Method $bannersId "GET"
Add-Method $bannersId "POST"
Add-Method $bannersId "OPTIONS"
Add-Method $uploadId  "POST"
Add-Method $uploadId  "OPTIONS"
Add-Method $bannerItemId "PUT"
Add-Method $bannerItemId "DELETE"
Add-Method $bannerItemId "OPTIONS"

# Lambda permission for API Gateway
$sourceArn = "arn:aws:execute-api:${Region}:${AccountId}:${apiId}/*/*"
aws lambda add-permission `
    --function-name $FunctionName `
    --statement-id "APIGatewayInvoke_$(Get-Date -Format 'yyyyMMddHHmmss')" `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn $sourceArn `
    --region $Region 2>&1 | Out-Null

# Deploy to 'prod' stage
aws apigateway create-deployment `
    --rest-api-id $apiId `
    --stage-name prod `
    --region $Region | Out-Null

$ApiUrl = "https://${apiId}.execute-api.${Region}.amazonaws.com/prod"

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "─────────────────────────────────────────────────────"
Write-Host "API URL: $ApiUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Add this to your .env file:" -ForegroundColor Yellow
Write-Host "VITE_BANNER_API_URL=$ApiUrl" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────"
