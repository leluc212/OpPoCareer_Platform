#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Fix the JWT authorizer on the applications API Gateway (x1yrkadmaa).

.DESCRIPTION
    The CognitoAuthorizer (w7g6id) was pointing to the WRONG user pool:
      - Wrong pool:   ap-southeast-1_ShCajkmJd  / client 2mv7qt4gpmq03dmlm0or9724n8
      - Correct pool: ap-southeast-1_LUa2Zfjtv  / client 4g1ssfgjmnuveblss1a7e0v7ob

    This mismatch caused every authenticated API call to /applications to return 401,
    because API Gateway rejected all tokens whose `iss` / `aud` claims didn't match.

    This script updates the authorizer in-place via apigatewayv2 update-authorizer.
    HTTP APIs (apigatewayv2) auto-deploy — no manual stage deployment needed.
#>

$REGION        = "ap-southeast-1"
$API_ID        = "x1yrkadmaa"
$AUTHORIZER_ID = "w7g6id"

# Correct values — the User Pool the rest of the backend uses
$CORRECT_POOL_ID   = "ap-southeast-1_LUa2Zfjtv"
$CORRECT_CLIENT_ID = "4g1ssfgjmnuveblss1a7e0v7ob"
$CORRECT_ISSUER    = "https://cognito-idp.${REGION}.amazonaws.com/${CORRECT_POOL_ID}"

Write-Host "`n======================================================" -ForegroundColor Cyan
Write-Host " Fix Applications API Authorizer" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "API ID      : $API_ID"
Write-Host "Authorizer  : $AUTHORIZER_ID"
Write-Host "New Issuer  : $CORRECT_ISSUER"
Write-Host "New Audience: $CORRECT_CLIENT_ID"
Write-Host ""

# Show current authorizer config before changing
Write-Host "[0/2] Current authorizer config:" -ForegroundColor Yellow
aws apigatewayv2 get-authorizer `
    --api-id $API_ID `
    --authorizer-id $AUTHORIZER_ID `
    --region $REGION

Write-Host "`n[1/2] Updating authorizer..." -ForegroundColor Yellow
$result = aws apigatewayv2 update-authorizer `
    --api-id $API_ID `
    --authorizer-id $AUTHORIZER_ID `
    --jwt-configuration "Issuer=${CORRECT_ISSUER},Audience=${CORRECT_CLIENT_ID}" `
    --region $REGION 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to update authorizer" -ForegroundColor Red
    Write-Host $result
    exit 1
}

Write-Host "  Authorizer updated successfully." -ForegroundColor Green
Write-Host $result

Write-Host "`n[2/2] Verifying new authorizer config:" -ForegroundColor Yellow
aws apigatewayv2 get-authorizer `
    --api-id $API_ID `
    --authorizer-id $AUTHORIZER_ID `
    --region $REGION

Write-Host "`n======================================================" -ForegroundColor Green
Write-Host " Done! HTTP API auto-deploys — no stage redeploy needed." -ForegroundColor Green
Write-Host " Test by calling: GET /applications/candidate/<userId>" -ForegroundColor Green
Write-Host "======================================================`n" -ForegroundColor Green
