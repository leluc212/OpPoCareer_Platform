# PowerShell script to update quick jobs Lambda function
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Updating quick-job-handler Lambda Function" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$REGION = "ap-southeast-1"
$LAMBDA_NAME = "quick-job-handler"

Write-Host "`n[1/3] Creating Lambda package..." -ForegroundColor Yellow
if (Test-Path "quick-job-lambda.zip") { 
    Remove-Item "quick-job-lambda.zip" -Force
}
Compress-Archive -Path "quick-job-lambda.py", "email_service.py", "job_recommender.py" -DestinationPath "quick-job-lambda.zip" -Force
Write-Host "Package created" -ForegroundColor Green

Write-Host "`n[2/3] Updating Lambda function code..." -ForegroundColor Yellow
aws lambda update-function-code --function-name $LAMBDA_NAME --zip-file fileb://quick-job-lambda.zip --region $REGION 2>&1 | Out-Null
Write-Host "Lambda code updated" -ForegroundColor Green

Write-Host "`n[3/3] Ensuring Lambda has access to EmployerProfiles table (for atomic payments)..." -ForegroundColor Yellow
# Get the Lambda execution role
$functionConfig = aws lambda get-function-configuration --function-name $LAMBDA_NAME --region $REGION 2>&1 | ConvertFrom-Json
$roleArn = $functionConfig.Role
$roleName = ($roleArn -split '/')[-1]

# Add inline policy for EmployerProfiles table access (idempotent)
$policyDoc = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:PutItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-southeast-1:*:table/EmployerProfiles"
      ]
    }
  ]
}
'@
aws iam put-role-policy --role-name $roleName --policy-name "QuickJobEmployerProfilesAccess" --policy-document $policyDoc --region $REGION 2>&1 | Out-Null
Write-Host "IAM policy updated (EmployerProfiles access)" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "UPDATE COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
