# PowerShell script to fix CORS on API Gateway error responses (4xx/5xx)
# This ensures CORS headers are returned even when Lambda errors/timeouts occur

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing CORS Gateway Responses" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$REGION = "ap-southeast-1"

# Create temporary params file
$paramsContent = '{"gatewayresponse.header.Access-Control-Allow-Origin":"' + "'" + '*' + "'" + '","gatewayresponse.header.Access-Control-Allow-Headers":"' + "'" + 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token' + "'" + '","gatewayresponse.header.Access-Control-Allow-Methods":"' + "'" + 'GET,POST,PUT,DELETE,OPTIONS' + "'" + '"}'
$paramsFile = "cors-gw-params-temp.json"
$paramsContent | Out-File -FilePath $paramsFile -Encoding utf8 -NoNewline

# REST API (EmployerProfileAPI / JobPostAPI)
$REST_API_ID = "dlidp35x33"

# Gateway Response types that need CORS headers
$ResponseTypes = @(
    "DEFAULT_4XX",
    "DEFAULT_5XX",
    "ACCESS_DENIED",
    "UNAUTHORIZED",
    "MISSING_AUTHENTICATION_TOKEN"
)

Write-Host "`n--- REST API: EmployerProfileAPI ($REST_API_ID) ---" -ForegroundColor Yellow

foreach ($responseType in $ResponseTypes) {
    Write-Host "  Setting CORS for $responseType..." -ForegroundColor Gray
    aws apigateway put-gateway-response `
        --rest-api-id $REST_API_ID `
        --response-type $responseType `
        --response-parameters file://$paramsFile `
        --region $REGION 2>&1 | Out-Null
    Write-Host "    Done" -ForegroundColor Green
}

# Deploy the changes
Write-Host "  Deploying to 'prod' stage..." -ForegroundColor Gray
aws apigateway create-deployment --rest-api-id $REST_API_ID --stage-name prod --region $REGION 2>&1 | Out-Null
Write-Host "  Deployed to prod" -ForegroundColor Green

# Cleanup
Remove-Item $paramsFile -Force -ErrorAction SilentlyContinue

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Done! CORS Gateway Responses configured." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNote: The Quick Jobs API (6zw89pkuxb) is an HTTP API v2" -ForegroundColor White
Write-Host "which handles CORS at the API level (already configured)." -ForegroundColor White
