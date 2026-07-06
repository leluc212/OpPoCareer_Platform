# ============================================================
# remove-public-lambda-url.ps1
# Xóa 2 permissions cho phép ANYONE gọi ApplicationLambda
# không cần auth (FunctionURLAllowPublicAccess + FunctionURLAllowInvokeAction)
#
# Chạy: .\remove-public-lambda-url.ps1
# Yêu cầu: aws cli đã cấu hình credentials có quyền lambda:RemovePermission
# ============================================================

$REGION        = "ap-southeast-1"
$FUNCTION_NAME = "ApplicationLambda"

Write-Host "🔐 Removing public Lambda Function URL permissions..."
Write-Host "   Function: $FUNCTION_NAME"
Write-Host "   Region:   $REGION"
Write-Host ""

# Xóa statement cho phép public invoke qua Function URL
$statementsToRemove = @(
    "FunctionURLAllowPublicAccess",
    "FunctionURLAllowInvokeAction"
)

foreach ($sid in $statementsToRemove) {
    Write-Host "🗑️  Removing permission: $sid"
    $result = aws lambda remove-permission `
        --function-name $FUNCTION_NAME `
        --statement-id $sid `
        --region $REGION 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Removed: $sid"
    } else {
        Write-Host "   ⚠️  Could not remove $sid (may not exist): $result"
    }
}

Write-Host ""
Write-Host "📋 Current policy after changes:"
aws lambda get-policy --function-name $FUNCTION_NAME --region $REGION --query Policy --output text | python -m json.tool 2>$null

Write-Host ""
Write-Host "=================================================="
Write-Host "  Done. ApplicationLambda Function URL is now"
Write-Host "  only callable via API Gateway (not public)."
Write-Host ""
Write-Host "  NOTE: Nếu có service nào đang gọi trực tiếp"
Write-Host "  Function URL, cần chuyển sang dùng API Gateway."
Write-Host "=================================================="
