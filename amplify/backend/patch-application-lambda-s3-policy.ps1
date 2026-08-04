# Patch ApplicationLambda IAM role with s3:GetObject permission
$ErrorActionPreference = "Stop"

$REGION      = "ap-southeast-1"
$LAMBDA_NAME = "ApplicationLambda"
$POLICY_NAME = "ApplicationLambdaS3CVAccess"
$POLICY_FILE = ".\s3-cv-access-policy.json"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Patching ApplicationLambda IAM role" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Get the Lambda execution role name
Write-Host "`n[1/4] Getting Lambda execution role..." -ForegroundColor Yellow
$roleArn = (aws lambda get-function-configuration `
    --function-name $LAMBDA_NAME `
    --region $REGION `
    --query "Role" `
    --output text)

if (-not $roleArn) {
    Write-Host "ERROR: Could not get role for $LAMBDA_NAME" -ForegroundColor Red
    exit 1
}

$roleName = $roleArn.Split('/')[-1]
Write-Host "  Role ARN : $roleArn" -ForegroundColor Green
Write-Host "  Role name: $roleName" -ForegroundColor Green

# 2. Write policy to temp file
Write-Host "`n[2/4] Writing policy document..." -ForegroundColor Yellow
@'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::opporeview-cv-storage-prod-2026/*"
    }
  ]
}
'@ | Out-File -FilePath $POLICY_FILE -Encoding ascii -Force
Write-Host "  Written to $POLICY_FILE" -ForegroundColor Green

# 3. Attach inline policy
Write-Host "`n[3/4] Attaching inline policy '$POLICY_NAME' to role '$roleName'..." -ForegroundColor Yellow
aws iam put-role-policy `
    --role-name $roleName `
    --policy-name $POLICY_NAME `
    --policy-document "file://$POLICY_FILE" `
    --region $REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to attach policy" -ForegroundColor Red
    exit 1
}
Write-Host "  Policy attached successfully." -ForegroundColor Green

# 4. Verify
Write-Host "`n[4/4] Verifying policy..." -ForegroundColor Yellow
aws iam get-role-policy `
    --role-name $roleName `
    --policy-name $POLICY_NAME `
    --region $REGION

# Cleanup temp file
Remove-Item $POLICY_FILE -Force -ErrorAction SilentlyContinue

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DONE. ApplicationLambda can now generate" -ForegroundColor Green
Write-Host "valid presigned URLs for opporeview-cv-storage-prod-2026." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
