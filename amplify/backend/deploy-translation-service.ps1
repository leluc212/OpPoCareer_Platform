# Deployment Script for Hybrid Translation Service

Write-Host "🚀 Deploying Hybrid Translation Service" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$REGION = "ap-southeast-1"
$ACCOUNT_ID = "726911960757" # From existing scripts
$FUNCTION_NAME = "HybridTranslateAPI"
$DB_TABLE = "Translations"

# 1. Create DynamoDB Table
Write-Host "Step 1: Setting up DynamoDB..." -ForegroundColor Yellow
.\amplify\backend\create-translation-db.ps1

# 2. Create IAM Role and Policy
Write-Host "`nStep 2: Creating IAM Role and Policy..." -ForegroundColor Yellow
$roleName = "HybridTranslateLambdaRole"
$policyName = "HybridTranslateLambdaPolicy"

# Trust Policy
$trustPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{ Service = "lambda.amazonaws.com" }
            Action = "sts:AssumeRole"
        }
    )
} | ConvertTo-Json -Depth 5
$trustPolicy | Out-File -FilePath "trust-policy-translate.json" -Encoding UTF8

if (!(aws iam get-role --role-name $roleName 2>$null)) {
    aws iam create-role --role-name $roleName --assume-role-policy-document file://trust-policy-translate.json
}

# Inline Policy for DynamoDB and Translate
$policy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = @(
                "translate:TranslateText",
                "comprehend:DetectDominantLanguage"
            )
            Resource = "*"
        },
        @{
            Effect = "Allow"
            Action = @(
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query"
            )
            Resource = "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${DB_TABLE}"
        },
        @{
            Effect = "Allow"
            Action = @(
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            )
            Resource = "arn:aws:logs:*:*:*"
        }
    )
} | ConvertTo-Json -Depth 5
$policy | Out-File -FilePath "translate-policy.json" -Encoding UTF8

aws iam put-role-policy --role-name $roleName --policy-name $policyName --policy-document file://translate-policy.json

# 3. Deploy Lambda
Write-Host "`nStep 3: Deploying Lambda Function..." -ForegroundColor Yellow
$zipFile = "translate-lambda.zip"
if (Test-Path $zipFile) { Remove-Item $zipFile }
Compress-Archive -Path "amplify\backend\translate-lambda.py" -DestinationPath $zipFile

if (aws lambda get-function --function-name $FUNCTION_NAME 2>$null) {
    aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://$zipFile --region $REGION
} else {
    aws lambda create-function `
        --function-name $FUNCTION_NAME `
        --runtime python3.9 `
        --handler translate-lambda.lambda_handler `
        --role "arn:aws:iam::${ACCOUNT_ID}:role/${roleName}" `
        --zip-file fileb://$zipFile `
        --region $REGION
}

# 4. Cleanup
Remove-Item "trust-policy-translate.json"
Remove-Item "translate-policy.json"
Remove-Item $zipFile

Write-Host "`n✅ Backend deployment logic prepared." -ForegroundColor Green
Write-Host "Note: API Gateway setup is usually manual or requires more complex scripting." -ForegroundColor Gray
