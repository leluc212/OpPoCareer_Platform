# ============================================================
# patch-ekyc-authorizer.ps1
# Attach Cognito JWT authorizer vào các eKYC routes ĐANG TỒN TẠI
# trên API Gateway (sd7ds72m8g).
#
# Chạy script này 1 lần để fix bug "Cần đăng nhập" ở verify-face.
# Sau khi chạy, API Gateway sẽ verify JWT trước khi gọi Lambda,
# và requestContext.authorizer.jwt.claims.sub sẽ luôn có sẵn.
#
# Chạy: .\patch-ekyc-authorizer.ps1
# ============================================================

$REGION        = "ap-southeast-1"
$API_ID        = "sd7ds72m8g"
$AUTHORIZER_ID = "w7g6id"   # CognitoAuthorizer (JWT, Cognito User Pool)

Write-Host "🔍 Fetching existing eKYC routes..."
$routes = aws apigatewayv2 get-routes --api-id $API_ID --region $REGION | ConvertFrom-Json

# Chỉ patch POST và GET routes — OPTIONS không cần auth
$routesToPatch = $routes.Items | Where-Object {
    $_.RouteKey -match "^(POST|GET) /ekyc/"
}

if (-not $routesToPatch) {
    Write-Host "⚠️  No eKYC routes found. Run deploy-ekyc-lambda.ps1 first."
    exit 1
}

foreach ($route in $routesToPatch) {
    $routeId  = $route.RouteId
    $routeKey = $route.RouteKey
    Write-Host "🔐 Patching: $routeKey (RouteId: $routeId)"

    aws apigatewayv2 update-route `
        --api-id $API_ID `
        --route-id $routeId `
        --authorization-type JWT `
        --authorizer-id $AUTHORIZER_ID `
        --region $REGION | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Authorizer attached"
    } else {
        Write-Host "   ❌ Failed to patch $routeKey"
    }
}

Write-Host ""
Write-Host "🚀 Deploying API Gateway stage..."
aws apigatewayv2 create-deployment `
    --api-id $API_ID `
    --stage-name prod `
    --region $REGION | Out-Null

Write-Host ""
Write-Host "=================================================="
Write-Host "  ✅ Done! eKYC routes now require Cognito JWT."
Write-Host ""
Write-Host "  Routes patched:"
foreach ($route in $routesToPatch) {
    Write-Host "    $($route.RouteKey)"
}
Write-Host ""
Write-Host "  requestContext.authorizer.jwt.claims.sub"
Write-Host "  sẽ có sẵn trong Lambda — không cần decode JWT thủ công."
Write-Host "=================================================="
