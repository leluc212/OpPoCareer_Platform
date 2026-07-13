# ============================================================
# patch-didit-iam-policy.ps1
# Cập nhật IAM policy cho Lambda role để đọc Didit secret.
#
# KHÔNG cần thêm quyền khác cho Didit:
#   - Didit API là HTTP bên ngoài → không cần IAM permission
#   - Chỉ cần secretsmanager:GetSecretValue cho secret mới
#
# Chạy script này sau khi đã tạo secret prod/didit/api-key
# ============================================================

$REGION        = "ap-southeast-1"
$FUNCTION_NAME = "ekyc-handler"

Write-Host "🔍 Lấy Lambda role name..."
$ROLE_ARN  = aws lambda get-function `
    --function-name $FUNCTION_NAME `
    --region $REGION `
    --query "Configuration.Role" `
    --output text

if (-not $ROLE_ARN) {
    Write-Host "❌ Không tìm thấy Lambda '$FUNCTION_NAME'"
    exit 1
}

$ROLE_NAME = $ROLE_ARN -replace ".*role/", ""
Write-Host "   Role: $ROLE_NAME"

$ACCOUNT_ID = aws sts get-caller-identity --query "Account" --output text

# Policy mới cho Didit secret
# Chỉ cần GetSecretValue — không cần quyền nào khác
$DIDIT_POLICY = @"
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect":   "Allow",
        "Action":   ["secretsmanager:GetSecretValue"],
        "Resource": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:prod/didit/api-key*"
    }]
}
"@

Write-Host "🔐 Gán policy didit-ekyc-secrets-policy..."
aws iam put-role-policy `
    --role-name $ROLE_NAME `
    --policy-name "didit-ekyc-secrets-policy" `
    --policy-document $DIDIT_POLICY

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Policy gán thành công!"
} else {
    Write-Host "❌ Gán policy thất bại!"
    exit 1
}

# Liệt kê toàn bộ inline policies hiện có
Write-Host ""
Write-Host "📋 Inline policies hiện tại của role '$ROLE_NAME':"
aws iam list-role-policies --role-name $ROLE_NAME --query "PolicyNames" --output table

Write-Host ""
Write-Host "ℹ️  Policy VNPT cũ 'ekyc-secrets-policy' vẫn còn."
Write-Host "   Xoá sau khi xác nhận Didit hoạt động ổn:"
Write-Host "   aws iam delete-role-policy --role-name $ROLE_NAME --policy-name ekyc-secrets-policy"
