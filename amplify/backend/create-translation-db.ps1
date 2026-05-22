# DynamoDB Table Creation Script for Hybrid Translation
# Table Name: HybridTranslations

$tableName = "HybridTranslations"

try {
    # Check if table exists
    Write-Host "Checking if table '$tableName' exists..." -ForegroundColor Cyan
    $tableNames = aws dynamodb list-tables --query "TableNames" --output json | ConvertFrom-Json
    
    if ($tableNames -contains $tableName) {
        Write-Host "Table '$tableName' already exists. Skipping creation." -ForegroundColor Yellow
    } else {
        Write-Host "Creating table '$tableName'..." -ForegroundColor Cyan
        aws dynamodb create-table `
            --table-name $tableName `
            --attribute-definitions `
                AttributeName=textHash,AttributeType=S `
                AttributeName=langCode,AttributeType=S `
            --key-schema `
                AttributeName=textHash,KeyType=HASH `
                AttributeName=langCode,KeyType=RANGE `
            --billing-mode PAY_PER_REQUEST

        Write-Host "Table creation request submitted successfully." -ForegroundColor Green
        Write-Host "Please wait a few seconds for the table to become ACTIVE." -ForegroundColor Green
    }
} catch {
    Write-Host "An error occurred: $_" -ForegroundColor Red
}
