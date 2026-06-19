# Diagnostic script for Quick Jobs Lambda 503 errors
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnosing Quick Jobs Lambda 503 Errors" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan

$REGION = "ap-southeast-1"
$LAMBDA_NAME = "quick-job-handler"

Write-Host "`n[1] Checking Lambda function configuration..." -ForegroundColor Yellow
$config = aws lambda get-function-configuration --function-name $LAMBDA_NAME --region $REGION 2>&1
Write-Host $config

Write-Host "`n[2] Checking reserved concurrency..." -ForegroundColor Yellow
$concurrency = aws lambda get-function-concurrency --function-name $LAMBDA_NAME --region $REGION 2>&1
if ($concurrency -like "*ReservedConcurrentExecutions*0*") {
    Write-Host "  ⚠️ FOUND ISSUE: Reserved concurrency is 0! Lambda is disabled." -ForegroundColor Red
    Write-Host "  Fix: aws lambda delete-function-concurrency --function-name $LAMBDA_NAME --region $REGION" -ForegroundColor White
} elseif ($concurrency -like "*ResourceNotFoundException*" -or $concurrency -like "*No reserved*") {
    Write-Host "  ✅ No reserved concurrency (using account default)" -ForegroundColor Green
} else {
    Write-Host "  $concurrency" -ForegroundColor Gray
}

Write-Host "`n[3] Checking recent invocation errors (last 15 min)..." -ForegroundColor Yellow
$logGroup = "/aws/lambda/$LAMBDA_NAME"
$startTime = [int64]((Get-Date).AddMinutes(-15).ToUniversalTime() - (Get-Date "1970-01-01")).TotalMilliseconds
aws logs filter-log-events `
    --log-group-name $logGroup `
    --start-time $startTime `
    --filter-pattern "ERROR" `
    --limit 5 `
    --region $REGION

Write-Host "`n[4] Checking API Gateway integration..." -ForegroundColor Yellow
$API_ID = "6zw89pkuxb"
$resources = aws apigateway get-resources --rest-api-id $API_ID --region $REGION 2>&1
Write-Host "  API Gateway resources retrieved. Check for missing OPTIONS methods." -ForegroundColor Gray

Write-Host "`n[5] Testing Lambda invocation directly..." -ForegroundColor Yellow
$testPayload = '{"httpMethod":"GET","path":"/quick-jobs/active","pathParameters":{},"requestContext":{"authorizer":{}}}'
$result = aws lambda invoke `
    --function-name $LAMBDA_NAME `
    --payload $testPayload `
    --region $REGION `
    response.json 2>&1

if (Test-Path "response.json") {
    $response = Get-Content "response.json" | ConvertFrom-Json
    Write-Host "  Status: $($response.statusCode)" -ForegroundColor $(if ($response.statusCode -eq 200) { "Green" } else { "Red" })
    Write-Host "  Body: $($response.body)" -ForegroundColor Gray
    Remove-Item "response.json" -Force
} else {
    Write-Host "  ⚠️ Lambda invocation failed: $result" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Diagnosis complete." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nCommon fixes for 503:" -ForegroundColor White
Write-Host "  1. Remove concurrency=0: aws lambda delete-function-concurrency --function-name $LAMBDA_NAME --region $REGION" -ForegroundColor Gray
Write-Host "  2. Increase timeout: aws lambda update-function-configuration --function-name $LAMBDA_NAME --timeout 30 --region $REGION" -ForegroundColor Gray
Write-Host "  3. Increase memory: aws lambda update-function-configuration --function-name $LAMBDA_NAME --memory-size 256 --region $REGION" -ForegroundColor Gray
Write-Host "  4. Check DynamoDB table exists: aws dynamodb describe-table --table-name PostQuickJob --region $REGION" -ForegroundColor Gray
