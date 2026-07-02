# add-image-upload-url-route.ps1
# Creates POST /profile/{userId}/image-upload-url in the EmployerProfileAPI REST API (dlidp35x33)
# and deploys to prod stage.
# The Lambda already handles this path - only the API Gateway resource is missing.

$ErrorActionPreference = "Stop"

$REST_API_ID  = "dlidp35x33"
$REGION       = "ap-southeast-1"
$LAMBDA_ARN   = "arn:aws:lambda:ap-southeast-1:726911960757:function:EmployerProfileAPI"
$INTEGRATION_URI = "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"

# /profile/{userId} resource ID (confirmed: si8qtl)
$USER_ID_RESOURCE = "si8qtl"

Write-Host "========================================"
Write-Host " Add POST /profile/{userId}/image-upload-url"
Write-Host " REST API: $REST_API_ID"
Write-Host "========================================"

# ---- Step 1: Create resource /profile/{userId}/image-upload-url ------------
Write-Host "[1/5] Creating resource 'image-upload-url' under /profile/{userId}..."

$RESOURCE_ID = $null

$resourceOutput = aws apigateway create-resource `
    --rest-api-id $REST_API_ID `
    --parent-id $USER_ID_RESOURCE `
    --path-part "image-upload-url" `
    --region $REGION `
    --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    $outputStr = "$resourceOutput"
    if ($outputStr -match "ConflictException" -or $outputStr -match "already exists") {
        Write-Host "  Resource already exists - looking up its ID..."
        $allResources = aws apigateway get-resources `
            --rest-api-id $REST_API_ID `
            --region $REGION `
            --output json | ConvertFrom-Json
        $found = $allResources.items | Where-Object { $_.pathPart -eq "image-upload-url" }
        $RESOURCE_ID = $found.id
        Write-Host "  Found existing resource ID: $RESOURCE_ID"
    } else {
        Write-Host "Failed to create resource:"
        Write-Host $resourceOutput
        exit 1
    }
} else {
    $parsed = $resourceOutput | ConvertFrom-Json
    $RESOURCE_ID = $parsed.id
    Write-Host "  Created resource ID: $RESOURCE_ID"
}

if (-not $RESOURCE_ID) {
    Write-Host "ERROR: Could not determine resource ID. Aborting."
    exit 1
}

# ---- Step 2: Create POST method (auth: NONE - Lambda handles its own auth) --
Write-Host "[2/5] Creating POST method (authorizationType=NONE)..."
aws apigateway put-method `
    --rest-api-id $REST_API_ID `
    --resource-id $RESOURCE_ID `
    --http-method POST `
    --authorization-type NONE `
    --region $REGION | Out-Null
Write-Host "  POST method created"

# ---- Step 3: Create Lambda proxy integration --------------------------------
Write-Host "[3/5] Creating Lambda proxy integration..."
aws apigateway put-integration `
    --rest-api-id $REST_API_ID `
    --resource-id $RESOURCE_ID `
    --http-method POST `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri $INTEGRATION_URI `
    --region $REGION | Out-Null
Write-Host "  Lambda integration created"

# ---- Step 4: Create OPTIONS method for CORS preflight ----------------------
Write-Host "[4/5] Creating OPTIONS method for CORS preflight..."
aws apigateway put-method `
    --rest-api-id $REST_API_ID `
    --resource-id $RESOURCE_ID `
    --http-method OPTIONS `
    --authorization-type NONE `
    --region $REGION | Out-Null

aws apigateway put-integration `
    --rest-api-id $REST_API_ID `
    --resource-id $RESOURCE_ID `
    --http-method OPTIONS `
    --type MOCK `
    --request-templates "{`"application/json`": `"{`\`"statusCode`\`": 200}`"}" `
    --region $REGION | Out-Null

aws apigateway put-method-response `
    --rest-api-id $REST_API_ID `
    --resource-id $RESOURCE_ID `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" `
    --region $REGION | Out-Null

aws apigateway put-integration-response `
    --rest-api-id $REST_API_ID `
    --resource-id $RESOURCE_ID `
    --http-method OPTIONS `
    --status-code 200 `
    "--response-parameters={`"method.response.header.Access-Control-Allow-Headers`":`"'Content-Type,Authorization'`",`"method.response.header.Access-Control-Allow-Methods`":`"'POST,OPTIONS'`",`"method.response.header.Access-Control-Allow-Origin`":`"'*'`"}" `
    --region $REGION | Out-Null

Write-Host "  OPTIONS/CORS method created"

# ---- Step 5: Deploy to prod -------------------------------------------------
Write-Host "[5/5] Deploying to stage: prod..."
aws apigateway create-deployment `
    --rest-api-id $REST_API_ID `
    --stage-name prod `
    --description "Add POST /profile/{userId}/image-upload-url route" `
    --region $REGION | Out-Null
Write-Host "  Deployed to prod"

Write-Host ""
Write-Host "Done! Route is live:"
Write-Host "  POST https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod/profile/{userId}/image-upload-url"
