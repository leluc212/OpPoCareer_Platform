# ─────────────────────────────────────────────────────────────────────────────
# redeploy-experience-lambda.ps1
# Re-packages and updates ONLY the Lambda function code (no infra changes).
# ─────────────────────────────────────────────────────────────────────────────

$REGION      = "ap-southeast-1"
$LAMBDA_NAME = "OpPoExperienceLambda"
$ZIP_FILE    = "experience-lambda.zip"

Write-Host "📦 Packaging Lambda..." -ForegroundColor Cyan
if (Test-Path $ZIP_FILE) { Remove-Item $ZIP_FILE }
Compress-Archive -Path "experience-lambda.py" -DestinationPath $ZIP_FILE
Write-Host "✅ Packaged $ZIP_FILE"

Write-Host "`n⚡ Updating Lambda code: $LAMBDA_NAME" -ForegroundColor Cyan
aws lambda update-function-code `
    --function-name $LAMBDA_NAME `
    --zip-file fileb://$ZIP_FILE `
    --region $REGION

Write-Host "`n✅ Done! Lambda redeployed." -ForegroundColor Green
