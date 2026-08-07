# Fix Google OAuth login - Update Cognito App Client settings
# Run this with AWS credentials that have cognito-idp:UpdateUserPoolClient permission

$userPoolId = "ap-southeast-1_LUa2Zfjtv"
$clientId = "4g1ssfgjmnuveblss1a7e0v7ob"
$region = "ap-southeast-1"

Write-Host "🔧 Updating Cognito App Client for Google OAuth..." -ForegroundColor Cyan

# Get current settings first
Write-Host "📋 Current settings:" -ForegroundColor Yellow
aws cognito-idp describe-user-pool-client `
  --user-pool-id $userPoolId `
  --client-id $clientId `
  --region $region `
  --query 'UserPoolClient.{CallbackURLs:CallbackURLs,LogoutURLs:LogoutURLs,AllowedOAuthFlows:AllowedOAuthFlows,AllowedOAuthScopes:AllowedOAuthScopes,SupportedIdentityProviders:SupportedIdentityProviders}' `
  --output json

# Update with correct settings
Write-Host "`n🚀 Applying fixes..." -ForegroundColor Green
aws cognito-idp update-user-pool-client `
  --user-pool-id $userPoolId `
  --client-id $clientId `
  --region $region `
  --callback-urls "http://localhost:3000/" "https://oppocareer.com/" `
  --logout-urls "http://localhost:3000/" "https://oppocareer.com/" `
  --allowed-o-auth-flows "code" `
  --allowed-o-auth-scopes "email" "openid" "profile" `
  --allowed-o-auth-flows-user-pool-client `
  --supported-identity-providers "Google" "COGNITO"

if ($LASTEXITCODE -eq 0) {
  Write-Host "`n✅ Google OAuth settings updated successfully!" -ForegroundColor Green
  Write-Host "📌 Callback URLs: http://localhost:3000/, https://oppocareer.com/" -ForegroundColor White
  Write-Host "📌 OAuth Flow: Authorization Code Grant" -ForegroundColor White
  Write-Host "📌 Identity Providers: Google, Cognito" -ForegroundColor White
} else {
  Write-Host "`n❌ Update failed. Check AWS credentials and permissions." -ForegroundColor Red
}
