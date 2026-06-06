# PowerShell script to update quick jobs Lambda function
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Updating quick-job-handler Lambda Function" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$REGION = "ap-southeast-1"
$LAMBDA_NAME = "quick-job-handler"

Write-Host "`n[1/2] Creating Lambda package..." -ForegroundColor Yellow
if (Test-Path "quick-job-lambda.zip") { 
    Remove-Item "quick-job-lambda.zip" -Force
}
Compress-Archive -Path "quick-job-lambda.py", "email_service.py", "job_recommender.py" -DestinationPath "quick-job-lambda.zip" -Force
Write-Host "Package created" -ForegroundColor Green

Write-Host "`n[2/2] Updating Lambda function code..." -ForegroundColor Yellow
aws lambda update-function-code --function-name $LAMBDA_NAME --zip-file fileb://quick-job-lambda.zip --region $REGION 2>&1 | Out-Null
Write-Host "Lambda code updated" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "UPDATE COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
