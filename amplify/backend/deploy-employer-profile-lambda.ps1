# Deploy EmployerProfileAPI Lambda to AWS
$REGION = "ap-southeast-1"
$FUNCTION_NAME = "EmployerProfileAPI"
$ZIP_FILE = Join-Path $PSScriptRoot "employer-profile-lambda.zip"
$deployDir = Join-Path $PSScriptRoot "lambda-deployment"

# Step 1: Install dependencies (required — node_modules must be included in zip)
Write-Host "Installing npm dependencies in lambda-deployment folder..."
Push-Location $deployDir
npm install --omit=dev
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install failed"
    Pop-Location
    exit 1
}
Pop-Location

# Step 2: Zip everything including node_modules
Write-Host "Zipping Lambda (lambda-deployment folder with node_modules)..."
if (Test-Path $ZIP_FILE) { Remove-Item $ZIP_FILE -Force }
Compress-Archive -Path "$deployDir\*" -DestinationPath $ZIP_FILE -Force

# Step 3: Deploy to AWS Lambda
Write-Host "Updating Lambda function: $FUNCTION_NAME"
aws lambda update-function-code `
    --function-name $FUNCTION_NAME `
    --zip-file "fileb://$ZIP_FILE" `
    --region $REGION

if ($LASTEXITCODE -ne 0) {
    Write-Error "Lambda update failed"
    exit 1
}

Write-Host "Lambda updated successfully!"
Write-Host "Waiting for update to complete..."
aws lambda wait function-updated --function-name $FUNCTION_NAME --region $REGION
Write-Host "Done. Lambda is live."
