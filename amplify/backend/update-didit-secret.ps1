# ============================================================
# update-didit-secret.ps1
# Tạo hoặc cập nhật Didit API Key trong AWS Secrets Manager
#
# Cách dùng:
#   .\update-didit-secret.ps1 -ApiKey "YOUR_DIDIT_API_KEY" -WebhookSecret "YOUR_WEBHOOK_SECRET"
#
# Khác với VNPT:
#   - Didit API Key KHÔNG hết hạn theo thời gian
#   - KHÔNG cần cron job hay script tự động refresh
#   - Chỉ chạy script này khi muốn rotate key chủ động
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,

    [Parameter(Mandatory=$false)]
    [string]$WebhookSecret = ""
)

$REGION      = "ap-southeast-1"
$SECRET_NAME = "prod/didit/api-key"

$secretPayload = @{
    apiKey        = $ApiKey
    webhookSecret = $WebhookSecret
} | ConvertTo-Json -Compress

# Kiểm tra secret đã tồn tại chưa
Write-Host "🔍 Kiểm tra secret '$SECRET_NAME' trong Secrets Manager..."
$existing = aws secretsmanager describe-secret `
    --secret-id $SECRET_NAME `
    --region $REGION 2>$null

if ($LASTEXITCODE -eq 0) {
    # Cập nhật secret đã có
    Write-Host "📝 Cập nhật secret hiện có..."
    aws secretsmanager update-secret `
        --secret-id $SECRET_NAME `
        --secret-string $secretPayload `
        --region $REGION

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Secret cập nhật thành công!"
    } else {
        Write-Host "❌ Cập nhật thất bại!"
        exit 1
    }
} else {
    # Tạo secret mới
    Write-Host "🆕 Tạo secret mới '$SECRET_NAME'..."
    aws secretsmanager create-secret `
        --name $SECRET_NAME `
        --description "Didit eKYC API Key and Webhook Secret" `
        --secret-string $secretPayload `
        --region $REGION `
        --tags "Key=project,Value=oppo-career" "Key=service,Value=didit-ekyc"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Secret tạo thành công!"
    } else {
        Write-Host "❌ Tạo secret thất bại!"
        exit 1
    }
}

Write-Host ""
Write-Host "🔐 Secret info:"
Write-Host "   Name  : $SECRET_NAME"
Write-Host "   Region: $REGION"
Write-Host "   Fields: apiKey, webhookSecret"
Write-Host ""
Write-Host "⚡ Lambda sẽ dùng API Key mới trong lần gọi tiếp theo (cache đã được clear)."
Write-Host "   Nếu muốn force reload ngay:"
Write-Host "   aws lambda update-function-configuration --function-name ekyc-handler --region $REGION --description 'force-reload-$(Get-Date -Format yyyyMMddHHmm)'"
Write-Host ""
Write-Host "ℹ️  Lưu ý: Didit API Key KHÔNG hết hạn — không cần cron job refresh như VNPT cũ."
