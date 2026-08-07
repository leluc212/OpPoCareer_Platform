$REGION        = "ap-southeast-1"
$API_ID        = "mrag7hkw11"
$INTEGRATION_ID = "n15ro48"

Write-Host "Fix eKYC routes on $API_ID"

$authorizers = aws apigatewayv2 get-authorizers --api-id $API_ID --region $REGION | ConvertFrom-Json
$jwtAuth = $authorizers.Items | Where-Object { $_.AuthorizerType -eq "JWT" } | Select-Object -First 1
if ($jwtAuth) {
    $AUTH_ID = $jwtAuth.AuthorizerId
    Write-Host "JWT Authorizer: $AUTH_ID"
} else {
    $AUTH_ID = $null
    Write-Host "No JWT authorizer found"
}

Write-Host ""
Write-Host "1. Creating POST /ekyc/webhook/didit (NONE auth)..."
$r = aws apigatewayv2 create-route --api-id $API_ID --route-key "POST /ekyc/webhook/didit" --target "integrations/$INTEGRATION_ID" --authorization-type NONE --region $REGION 2>&1
if ($LASTEXITCODE -eq 0) { Write-Host "   Created OK" } else { Write-Host "   $r" }

Write-Host "2. Creating OPTIONS /ekyc/webhook/didit..."
$r = aws apigatewayv2 create-route --api-id $API_ID --route-key "OPTIONS /ekyc/webhook/didit" --target "integrations/$INTEGRATION_ID" --authorization-type NONE --region $REGION 2>&1
if ($LASTEXITCODE -eq 0) { Write-Host "   Created OK" } else { Write-Host "   $r" }

Write-Host "3. Creating GET /ekyc/status/{userId} (JWT auth)..."
if ($AUTH_ID) {
    $r = aws apigatewayv2 create-route --api-id $API_ID --route-key "GET /ekyc/status/{userId}" --target "integrations/$INTEGRATION_ID" --authorization-type JWT --authorizer-id $AUTH_ID --region $REGION 2>&1
} else {
    $r = aws apigatewayv2 create-route --api-id $API_ID --route-key "GET /ekyc/status/{userId}" --target "integrations/$INTEGRATION_ID" --authorization-type JWT --region $REGION 2>&1
}
if ($LASTEXITCODE -eq 0) { Write-Host "   Created OK" } else { Write-Host "   $r" }

Write-Host "4. Creating OPTIONS /ekyc/status/{userId}..."
$r = aws apigatewayv2 create-route --api-id $API_ID --route-key "OPTIONS /ekyc/status/{userId}" --target "integrations/$INTEGRATION_ID" --authorization-type NONE --region $REGION 2>&1
if ($LASTEXITCODE -eq 0) { Write-Host "   Created OK" } else { Write-Host "   $r" }

Write-Host ""
Write-Host "Done."
Write-Host "Correct webhook URL: https://mrag7hkw11.execute-api.ap-southeast-1.amazonaws.com/prod/ekyc/webhook/didit"
