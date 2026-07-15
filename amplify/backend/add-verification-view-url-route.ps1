# add-verification-view-url-route.ps1
# Creates the /profile/{userId}/verification and /profile/{userId}/verification/view-url
# resources in the EmployerProfileAPI REST API (dlidp35x33) and deploys to prod stage.
# The Lambda already handles this path - only the API Gateway resources are missing.

$ErrorActionPreference = "Stop"

$REST_API_ID  = "dlidp35x33"
$REGION       = "ap-southeast-1"
$LAMBDA_ARN   = "arn:aws:lambda:ap-southeast-1:726911960757:function:EmployerProfileAPI"
$INTEGRATION_URI = "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations"

# /profile/{userId} resource ID (confirmed: si8qtl)
$USER_ID_RESOURCE = "si8qtl"

Write-Host "========================================"
Write-Host " Add POST /profile/{userId}/verification/view-url"
Write-Host " REST API: $REST_API_ID"
Write-Host "========================================"

# ---- Step 1: Create resource /profile/{userId}/verification -----------------
Write-Host "[1/7] Creating resource 'verification' under /profile/{userId}..."

$VERIFICATION_RESOURCE_ID = $null

$resourceOutput = aws apigateway create-resource `
    --rest-api-id $REST_API_ID `
    --parent-id $USER_ID_RESOURCE `
    --path-part "verification" `
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
        $found = $allResources.items | Where-Object { $_.path -eq "/profile/{userId}/verification" }
        $VERIFICATION_RESOURCE_ID = $found.id
        Write-Host "  Found existing resource ID: $VERIFICATION_RESOURCE_ID"
    } else {
        Write-Host "Failed to create resource:"
        Write-Host $resourceOutput
        exit 1
    }
} else {
    $parsed = $resourceOutput | ConvertFrom-Json
    $VERIFICATION_RESOURCE_ID = $parsed.id
    Write-Host "  Created resource ID: $VERIFICATION_RESOURCE_ID"
}

if (-not $VERIFICATION_RESOURCE_ID) {
    Write-Host "ERROR: Could not determine verification resource ID. Aborting."
    exit 1
}

# ---- Step 2: Create resource /profile/{userId}/verification/view-url --------
Write-Host "[2/7] Creating resource 'view-url' under /profile/{userId}/verification..."

$VIEW_URL_RESOURCE_ID = $null

$resourceOutput = aws apigateway create-resource `
    --rest-api-id $REST_API_ID `
    --parent-id $VERIFICATION_RESOURCE_ID `
    --path-part "view-url" `
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
        $found = $allResources.items | Where-Object { $_.path -eq "/profile/{userId}/verification/view-url" }
        $VIEW_URL_RESOURCE_ID = $found.id
        Write-Host "  Found existing resource ID: $VIEW_URL_RESOURCE_ID"
    } else {
        Write-Host "Failed to create resource:"
        Write-Host $resourceOutput
        exit 1
    }
} else {
    $parsed = $resourceOutput | ConvertFrom-Json
    $VIEW_URL_RESOURCE_ID = $parsed.id
    Write-Host "  Created resource ID: $VIEW_URL_RESOURCE_ID"
}

if (-not $VIEW_URL_RESOURCE_ID) {
    Write-Host "ERROR: Could not determine view-url resource ID. Aborting."
    exit 1
}

# ---- Step 3: Create POST method (auth: NONE - Lambda handles its own auth) --
Write-Host "[3/7] Creating POST method on view-url (authorizationType=NONE)..."
aws apigateway put-method `
    --rest-api-id $REST_API_ID `
    --resource-id $VIEW_URL_RESOURCE_ID `
    --http-method POST `
    --authorization-type NONE `
    --region $REGION | Out-Null
Write-Host "  POST method created"

# ---- Step 4: Create Lambda proxy integration --------------------------------
Write-Host "[4/7] Creating Lambda proxy integration..."
aws apigateway put-integration `
    --rest-api-id $REST_API_ID `
    --resource-id $VIEW_URL_RESOURCE_ID `
    --http-method POST `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri $INTEGRATION_URI `
    --region $REGION | Out-Null
Write-Host "  Lambda integration created"

# ---- Step 5: Create OPTIONS method for CORS preflight ----------------------
Write-Host "[5/7] Creating OPTIONS method for CORS preflight..."
aws apigateway put-method `
    --rest-api-id $REST_API_ID `
    --resource-id $VIEW_URL_RESOURCE_ID `
    --http-method OPTIONS `
    --authorization-type NONE `
    --region $REGION | Out-Null

aws apigateway put-integration `
    --rest-api-id $REST_API_ID `
    --resource-id $VIEW_URL_RESOURCE_ID `
    --http-method OPTIONS `
    --type MOCK `
    --request-templates "{`"application/json`": `"{`\`"statusCode`\`": 200}`"}" `
    --region $REGION | Out-Null

aws apigateway put-method-response `
    --rest-api-id $REST_API_ID `
    --resource-id $VIEW_URL_RESOURCE_ID `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" `
    --region $REGION | Out-Null

aws apigateway put-integration-response `
    --rest-api-id $REST_API_ID `
    --resource-id $VIEW_URL_RESOURCE_ID `
    --http-method OPTIONS `
    --status-code 200 `
    "--response-parameters={`"method.response.header.Access-Control-Allow-Headers`":`"'Content-Type,Authorization'`",`"method.response.header.Access-Control-Allow-Methods`":`"'POST,OPTIONS'`",`"method.response.header.Access-Control-Allow-Origin`":`"'*'`"}" `
    --region $REGION | Out-Null

Write-Host "  OPTIONS/CORS method created"

# ---- Step 6: Grant API Gateway permission to invoke the Lambda --------------
Write-Host "[6/7] Adding Lambda invoke permission for API Gateway..."
$ACCOUNT_ID = "726911960757"
$SOURCE_ARN = "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${REST_API_ID}/*/POST/profile/*/verification/view-url"

aws lambda add-permission `
    --function-name "EmployerProfileAPI" `
    --statement-id "apigateway-verification-view-url-$(Get-Date -Format 'yyyyMMddHHmmss')" `
    --action "lambda:InvokeFunction" `
    --principal "apigateway.amazonaws.com" `
    --source-arn $SOURCE_ARN `
    --region $REGION 2>&1 | Out-Null

Write-Host "  Lambda permission added (or already exists)"

# ---- Step 7: Deploy to prod -------------------------------------------------
Write-Host "[7/7] Deploying to stage: prod..."
aws apigateway create-deployment `
    --rest-api-id $REST_API_ID `
    --stage-name prod `
    --description "Add POST /profile/{userId}/verification/view-url route" `
    --region $REGION | Out-Null
Write-Host "  Deployed to prod"

Write-Host ""
Write-Host "Done! Route is live:" -ForegroundColor Green
Write-Host "  POST https://dlidp35x33.execute-api.ap-southeast-1.amazonaws.com/prod/profile/{userId}/verification/view-url"
Write-Host ""
Write-Host "Also check if /profile/{userId}/verification/upload-url needs to be added (same pattern)." -ForegroundColor Yellow
