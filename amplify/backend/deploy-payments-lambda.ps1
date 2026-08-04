# Deploy payments-lambda to AWS
$REGION = "ap-southeast-1"
$FUNCTION_NAME = "payments-handler"
$ZIP_FILE = "payments-lambda.zip"

Write-Host "📦 Zipping Lambda..."
Compress-Archive -Path payments-lambda.js -DestinationPath $ZIP_FILE -Force

$exists = aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "🔄 Updating Lambda: $FUNCTION_NAME"
    aws lambda update-function-code `
        --function-name $FUNCTION_NAME `
        --zip-file "fileb://$ZIP_FILE" `
        --region $REGION
} else {
    Write-Host "🆕 Creating Lambda: $FUNCTION_NAME"
    $ROLE_ARN = (aws lambda get-function --function-name "EmployerProfileAPI" --region $REGION --query "Configuration.Role" --output text)
    aws lambda create-function `
        --function-name $FUNCTION_NAME `
        --runtime nodejs18.x `
        --role $ROLE_ARN `
        --handler payments-lambda.handler `
        --zip-file "fileb://$ZIP_FILE" `
        --region $REGION `
        --timeout 30 `
        --environment "Variables={PAYMENTS_TABLE=Payment,EMPLOYERS_TABLE=EmployerProfiles,USER_PACKAGES_TABLE=PackageSubscriptions,VIETQR_BANK_ID=MB,VIETQR_ACCOUNT_NO=0123456789,VIETQR_ACCOUNT_NAME=CONG%20TY%20OP%20PO}"
}

Write-Host "✅ Done!"
