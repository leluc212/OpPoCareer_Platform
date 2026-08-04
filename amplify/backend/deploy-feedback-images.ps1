# deploy-feedback-images.ps1
# Deploy updated candidate-profile-lambda.py with feedback image upload support
# Also updates S3 bucket policy to allow public read on feedback-images/
# Usage: .\deploy-feedback-images.ps1

$ErrorActionPreference = "Stop"

$LAMBDA_NAME = "candidate-profile-api-handler"
$REGION      = "ap-southeast-1"
$ZIP_FILE    = "candidate-profile-lambda.zip"
$PYTHON_FILE = "candidate-profile-lambda.py"
$BUCKET      = "opporeview-cv-storage-prod-2026"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Deploy Feedback Image Upload Support   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] AWS CLI not found." -ForegroundColor Red
    exit 1
}

# 2. Package lambda
Write-Host "`n[1/4] Packaging $PYTHON_FILE -> $ZIP_FILE ..." -ForegroundColor Yellow
if (Test-Path $ZIP_FILE) { Remove-Item $ZIP_FILE -Force }
Compress-Archive -Path $PYTHON_FILE -DestinationPath $ZIP_FILE -Force
Write-Host "      Package created." -ForegroundColor Green

# 3. Deploy Lambda
Write-Host "`n[2/4] Uploading to Lambda: $LAMBDA_NAME ..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name $LAMBDA_NAME `
    --zip-file fileb://$ZIP_FILE `
    --region $REGION `
    --output table

Write-Host "`n[3/4] Waiting for Lambda update..." -ForegroundColor Yellow
aws lambda wait function-updated `
    --function-name $LAMBDA_NAME `
    --region $REGION
Write-Host "      Lambda updated." -ForegroundColor Green

# 4. Update S3 bucket policy to allow public read on feedback-images/
Write-Host "`n[4/4] Updating S3 bucket policy for feedback-images/ ..." -ForegroundColor Yellow

$policy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid       = "PublicReadForCategorizedAssetsOnly"
            Effect    = "Allow"
            Principal = "*"
            Action    = "s3:GetObject"
            Resource  = @(
                "arn:aws:s3:::$BUCKET/banner/*",
                "arn:aws:s3:::$BUCKET/poster/*",
                "arn:aws:s3:::$BUCKET/system/*",
                "arn:aws:s3:::$BUCKET/feedback-images/*"
            )
        }
    )
} | ConvertTo-Json -Depth 10 -Compress

aws s3api put-bucket-policy `
    --bucket $BUCKET `
    --policy $policy `
    --region $REGION

Write-Host "      Bucket policy updated." -ForegroundColor Green

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "  DONE! Feedback image upload deployed.  " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Make sure the Lambda execution role has s3:PutObject permission" -ForegroundColor Yellow
Write-Host "on arn:aws:s3:::$BUCKET/feedback-images/*" -ForegroundColor Yellow
Write-Host "Use feedback-images-s3-policy.json to attach inline policy to the role." -ForegroundColor Yellow
