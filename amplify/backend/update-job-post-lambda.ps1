# PowerShell script to update standard jobs Lambda function
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Updating JobPostAPI Lambda Function" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$REGION = "ap-southeast-1"
$LAMBDA_NAME = "JobPostAPI"

Write-Host "`n[1/2] Creating Lambda package..." -ForegroundColor Yellow
if (Test-Path "job-post-lambda.zip") { 
    Remove-Item "job-post-lambda.zip" -Force
}
Compress-Archive -Path "job-post-lambda.py", "email_service.py", "job_recommender.py" -DestinationPath "job-post-lambda.zip" -Force
Write-Host "Package created" -ForegroundColor Green

Write-Host "`n[2/2] Updating Lambda function code..." -ForegroundColor Yellow
aws lambda update-function-code --function-name $LAMBDA_NAME --zip-file fileb://job-post-lambda.zip --region $REGION 2>&1 | Out-Null
Write-Host "Lambda code updated" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "UPDATE COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
