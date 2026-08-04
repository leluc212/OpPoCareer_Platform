# PowerShell script to add GET /applications/available-workers/{jobId} route to API Gateway HTTP API
$ErrorActionPreference = "Continue"

$API_ID       = "1v4xboca50"
$REGION       = "ap-southeast-1"
$ROUTE_KEY    = "GET /applications/available-workers/{jobId}"

$integrations = aws apigatewayv2 get-integrations --api-id $API_ID --region $REGION | ConvertFrom-Json
$INTEGRATION = ($integrations.Items | Where-Object { $_.IntegrationUri -match "function:ApplicationLambda/" } | Select-Object -First 1).IntegrationId
if (-not $INTEGRATION) { throw "ApplicationLambda integration not found in API $API_ID" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Adding route: $ROUTE_KEY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Creating route in API Gateway..." -ForegroundColor Yellow
$result = aws apigatewayv2 create-route `
    --api-id $API_ID `
    --route-key $ROUTE_KEY `
    --target "integrations/$INTEGRATION" `
    --authorization-type NONE `
    --region $REGION

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Route created successfully!" -ForegroundColor Green
    Write-Host $result
} else {
    Write-Host "❌ Failed to create route (it may already exist). Output:" -ForegroundColor Red
    Write-Host $result
    exit 1
}

Write-Host "`n[2/2] Done! The new route is active immediately (HTTP APIs auto-deploy)." -ForegroundColor Green
Write-Host "`nIMPORTANT: Also run update-application-lambda.ps1 if the Lambda code was changed." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
