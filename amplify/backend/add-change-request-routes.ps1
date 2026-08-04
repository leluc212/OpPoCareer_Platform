# PowerShell script to add approve/reject change-request routes to API Gateway HTTP API
# Routes needed:
#   PUT /applications/{applicationId}/approve-change
#   PUT /applications/{applicationId}/reject-change
$ErrorActionPreference = "Continue"

$API_ID      = "1v4xboca50"
$REGION      = "ap-southeast-1"

$integrations = aws apigatewayv2 get-integrations --api-id $API_ID --region $REGION | ConvertFrom-Json
$INTEGRATION = ($integrations.Items | Where-Object { $_.IntegrationUri -match "function:ApplicationLambda/" } | Select-Object -First 1).IntegrationId
if (-not $INTEGRATION) { throw "ApplicationLambda integration not found in API $API_ID" }

$ROUTES = @(
    "PUT /applications/{applicationId}/approve-change",
    "PUT /applications/{applicationId}/reject-change"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Adding change-request routes to API Gateway" -ForegroundColor Cyan
Write-Host "API ID: $API_ID" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($routeKey in $ROUTES) {
    Write-Host "`nCreating route: $routeKey" -ForegroundColor Yellow

    $result = aws apigatewayv2 create-route `
        --api-id $API_ID `
        --route-key $routeKey `
        --target "integrations/$INTEGRATION" `
        --authorization-type NONE `
        --region $REGION 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Route created: $routeKey" -ForegroundColor Green
    } else {
        # ConflictException means the route already exists — not a fatal error
        if ($result -match "ConflictException" -or $result -match "already exists") {
            Write-Host "  ⚠️  Route already exists (skipping): $routeKey" -ForegroundColor Yellow
        } else {
            Write-Host "  ❌ Failed to create route: $routeKey" -ForegroundColor Red
            Write-Host "  $result"
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Done! HTTP APIs auto-deploy — routes are active immediately." -ForegroundColor Green
Write-Host "If you also updated application-lambda.py, run update-application-lambda.ps1 too." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
