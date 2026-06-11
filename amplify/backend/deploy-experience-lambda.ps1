# ─────────────────────────────────────────────────────────────────────────────
# deploy-experience-lambda.ps1
# Deploys the CandidateExperiences Lambda + API Gateway + DynamoDB table
# ─────────────────────────────────────────────────────────────────────────────

$REGION       = "ap-southeast-1"
$ACCOUNT_ID   = (aws sts get-caller-identity --query Account --output text)
$LAMBDA_NAME  = "OpPoExperienceLambda"
$ZIP_FILE     = "experience-lambda.zip"
$ROLE_NAME    = "OpPoExperienceLambdaRole"
$API_NAME     = "OpPoExperienceAPI"
$TABLE_NAME   = "CandidateExperiences"
$S3_BUCKET    = "opporeview-cv-storage"

Write-Host "🚀 Deploying Experience Lambda to region $REGION ..." -ForegroundColor Cyan

# ── 1. Create DynamoDB Table ──────────────────────────────────────────────────
Write-Host "`n📦 Creating DynamoDB table: $TABLE_NAME"
$tableExists = aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION 2>&1
if ($LASTEXITCODE -ne 0) {
    aws dynamodb create-table `
        --table-name $TABLE_NAME `
        --attribute-definitions `
            AttributeName=candidateId,AttributeType=S `
            AttributeName=experienceId,AttributeType=S `
        --key-schema `
            AttributeName=candidateId,KeyType=HASH `
            AttributeName=experienceId,KeyType=RANGE `
        --billing-mode PAY_PER_REQUEST `
        --region $REGION
    Write-Host "✅ Table created"
} else {
    Write-Host "ℹ️  Table already exists, skipping"
}

# ── 2. Create IAM Role ────────────────────────────────────────────────────────
Write-Host "`n🔐 Creating IAM Role: $ROLE_NAME"
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
$trustFile = "trust-policy-exp.json"
$trustPolicy | Out-File -Encoding utf8 -FilePath $trustFile

$roleExists = aws iam get-role --role-name $ROLE_NAME 2>&1
if ($LASTEXITCODE -ne 0) {
    aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://$trustFile
    aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    Write-Host "✅ Role created"
} else {
    Write-Host "ℹ️  Role already exists"
}

# Inline policy: DynamoDB + S3
$inlinePolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/CandidateExperiences",
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/CandidateProfiles",
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/Notifications"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::${S3_BUCKET}/experience-proofs/*"
    }
  ]
}
"@
$inlinePolicy | Out-File -Encoding utf8 -FilePath "experience-inline-policy.json"
aws iam put-role-policy --role-name $ROLE_NAME --policy-name ExperienceLambdaPolicy --policy-document file://experience-inline-policy.json
Write-Host "✅ Inline policy attached"

# ── 3. Package Lambda ─────────────────────────────────────────────────────────
Write-Host "`n📦 Packaging Lambda..."
if (Test-Path $ZIP_FILE) { Remove-Item $ZIP_FILE }
Compress-Archive -Path "experience-lambda.py" -DestinationPath $ZIP_FILE
Write-Host "✅ Packaged $ZIP_FILE"

# ── 4. Deploy Lambda ──────────────────────────────────────────────────────────
$ROLE_ARN = "arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
Write-Host "`n⚡ Deploying Lambda: $LAMBDA_NAME"

Start-Sleep -Seconds 10  # allow IAM role to propagate

$lambdaExists = aws lambda get-function --function-name $LAMBDA_NAME --region $REGION 2>&1
if ($LASTEXITCODE -ne 0) {
    aws lambda create-function `
        --function-name $LAMBDA_NAME `
        --runtime python3.12 `
        --role $ROLE_ARN `
        --handler experience-lambda.lambda_handler `
        --zip-file fileb://$ZIP_FILE `
        --timeout 30 `
        --memory-size 256 `
        --region $REGION
    Write-Host "✅ Lambda created"
} else {
    aws lambda update-function-code `
        --function-name $LAMBDA_NAME `
        --zip-file fileb://$ZIP_FILE `
        --region $REGION
    Write-Host "✅ Lambda updated"
}

# ── 5. Create/update API Gateway ──────────────────────────────────────────────
Write-Host "`n🌐 Configuring API Gateway: $API_NAME"

$apiId = aws apigateway get-rest-apis --region $REGION --query "items[?name=='$API_NAME'].id" --output text
if (-not $apiId -or $apiId -eq "None") {
    $apiId = (aws apigateway create-rest-api --name $API_NAME --region $REGION --query id --output text)
    Write-Host "✅ REST API created: $apiId"
} else {
    Write-Host "ℹ️  REST API exists: $apiId"
}

$LAMBDA_ARN = "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${LAMBDA_NAME}"

# Grant API Gateway permission to invoke Lambda
aws lambda add-permission `
    --function-name $LAMBDA_NAME `
    --statement-id "apigateway-invoke-$(Get-Random)" `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${apiId}/*" `
    --region $REGION 2>$null

$LAMBDA_URI = "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"

# ── Helper: get or create a resource by path part under a parent ──────────────
function Get-OrCreateResource($parentId, $pathPart) {
    $existing = aws apigateway get-resources --rest-api-id $apiId --region $REGION `
        --query "items[?pathPart=='$pathPart' && parentId=='$parentId'].id" --output text
    if ($existing -and $existing -ne "None") { return $existing }
    return (aws apigateway create-resource `
        --rest-api-id $apiId --region $REGION `
        --parent-id $parentId --path-part $pathPart `
        --query id --output text)
}

# ── Helper: wire a method (no auth) → Lambda proxy ───────────────────────────
function Add-LambdaMethod($resourceId, $httpMethod) {
    # put-method (may already exist – ignore error)
    aws apigateway put-method `
        --rest-api-id $apiId --region $REGION `
        --resource-id $resourceId `
        --http-method $httpMethod `
        --authorization-type NONE 2>$null

    # put-integration
    aws apigateway put-integration `
        --rest-api-id $apiId --region $REGION `
        --resource-id $resourceId `
        --http-method $httpMethod `
        --type AWS_PROXY `
        --integration-http-method POST `
        --uri $LAMBDA_URI | Out-Null
    Write-Host "  ✅ $httpMethod $resourceId"
}

# ── Helper: add OPTIONS (CORS preflight) ──────────────────────────────────────
function Add-CorsOptions($resourceId) {
    aws apigateway put-method `
        --rest-api-id $apiId --region $REGION `
        --resource-id $resourceId `
        --http-method OPTIONS `
        --authorization-type NONE 2>$null

    aws apigateway put-integration `
        --rest-api-id $apiId --region $REGION `
        --resource-id $resourceId `
        --http-method OPTIONS `
        --type MOCK `
        --request-templates '{"application/json":"{\"statusCode\":200}"}' | Out-Null

    aws apigateway put-method-response `
        --rest-api-id $apiId --region $REGION `
        --resource-id $resourceId `
        --http-method OPTIONS --status-code 200 `
        --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" 2>$null | Out-Null

    aws apigateway put-integration-response `
        --rest-api-id $apiId --region $REGION `
        --resource-id $resourceId `
        --http-method OPTIONS --status-code 200 `
        --response-parameters "method.response.header.Access-Control-Allow-Headers='Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',method.response.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS',method.response.header.Access-Control-Allow-Origin='*'" 2>$null | Out-Null
}

# ── Build resource tree ───────────────────────────────────────────────────────
Write-Host "`n🔧 Wiring API Gateway routes..."

$rootId = (aws apigateway get-resources --rest-api-id $apiId --region $REGION `
    --query "items[?path=='/'].id" --output text)

# /candidate
$candidateId = Get-OrCreateResource $rootId "candidate"
# /candidate/experience
$experienceId = Get-OrCreateResource $candidateId "experience"

# /admin
$adminId = Get-OrCreateResource $rootId "admin"
# /admin/experiences
$experiencesId = Get-OrCreateResource $adminId "experiences"
# /admin/experiences/{id}
$expIdResourceId = Get-OrCreateResource $experiencesId "{id}"
# /admin/experiences/{id}/approve
$approveId = Get-OrCreateResource $expIdResourceId "approve"
# /admin/experiences/{id}/reject
$rejectId  = Get-OrCreateResource $expIdResourceId "reject"

# ── Wire methods ──────────────────────────────────────────────────────────────
# POST /candidate/experience
Add-LambdaMethod $experienceId "POST"
# GET  /candidate/experience
Add-LambdaMethod $experienceId "GET"
Add-CorsOptions  $experienceId

# GET /admin/experiences
Add-LambdaMethod $experiencesId "GET"
Add-CorsOptions  $experiencesId

# GET /admin/experiences/{id}
Add-LambdaMethod $expIdResourceId "GET"
Add-CorsOptions  $expIdResourceId

# PUT /admin/experiences/{id}/approve
Add-LambdaMethod $approveId "PUT"
Add-CorsOptions  $approveId

# PUT /admin/experiences/{id}/reject
Add-LambdaMethod $rejectId "PUT"
Add-CorsOptions  $rejectId

# ── Deploy to stage "prod" ────────────────────────────────────────────────────
Write-Host "`n🚀 Deploying API Gateway to stage: prod"
aws apigateway create-deployment `
    --rest-api-id $apiId `
    --stage-name prod `
    --region $REGION | Out-Null
Write-Host "✅ Stage 'prod' deployed"

$API_URL = "https://${apiId}.execute-api.${REGION}.amazonaws.com/prod"
Write-Host @"

✅ Deployment complete!

API URL: $API_URL

Add this to your .env if not already present:
  VITE_EXPERIENCE_API_URL=$API_URL

"@ -ForegroundColor Green

# Cleanup temp files
Remove-Item -ErrorAction SilentlyContinue $trustFile, "experience-inline-policy.json"
