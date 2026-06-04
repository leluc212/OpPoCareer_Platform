# deploy-candidate-verification.ps1
# Deploy updated candidate-profile-lambda.py with verification routes
# Usage: .\deploy-candidate-verification.ps1

$ErrorActionPreference = "Stop"

$LAMBDA_NAME   = "candidate-profile-api-handler"
$REGION        = "ap-southeast-1"
$ZIP_FILE      = "candidate-profile-lambda.zip"
$PYTHON_FILE   = "candidate-profile-lambda.py"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Deploy Candidate Verification Lambda   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] AWS CLI not found. Install from https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

# 2. Package lambda
Write-Host "`n[1/3] Packaging $PYTHON_FILE -> $ZIP_FILE ..." -ForegroundColor Yellow
if (Test-Path $ZIP_FILE) { Remove-Item $ZIP_FILE -Force }

# Use Compress-Archive (PowerShell built-in)
Compress-Archive -Path $PYTHON_FILE -DestinationPath $ZIP_FILE -Force
Write-Host "      Package created: $ZIP_FILE" -ForegroundColor Green

# 3. Update Lambda function code
Write-Host "`n[2/3] Uploading to Lambda: $LAMBDA_NAME ..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name $LAMBDA_NAME `
    --zip-file fileb://$ZIP_FILE `
    --region $REGION `
    --output table

Write-Host "      Upload complete." -ForegroundColor Green

# 4. Wait for update
Write-Host "`n[3/3] Waiting for Lambda update to complete..." -ForegroundColor Yellow
aws lambda wait function-updated `
    --function-name $LAMBDA_NAME `
    --region $REGION

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "  DONE! Verification routes deployed.    " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "New routes available:" -ForegroundColor Cyan
Write-Host "  POST  /candidate/verification-request" -ForegroundColor White
Write-Host "  GET   /admin/candidate-verifications" -ForegroundColor White
Write-Host "  POST  /admin/candidate-verifications/{id}/approve" -ForegroundColor White
Write-Host "  POST  /admin/candidate-verifications/{id}/reject" -ForegroundColor White
