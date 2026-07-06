# ============================================================
# update-vnpt-token.ps1
# Cập nhật bearer_token mới vào AWS Secrets Manager
# khi token VNPT eKYC bị expired (lỗi 401).
#
# Cách dùng:
#   1. Lấy token mới từ VNPT (login portal hoặc API /auth/oauth/token)
#   2. Chạy: .\update-vnpt-token.ps1 -NewToken "eyJ..."
#
# Sau khi chạy, Lambda sẽ tự dùng token mới ngay lần gọi tiếp theo.
# Lambda cache token trong memory — nếu muốn force dùng ngay thì
# deploy lại Lambda (hoặc đợi Lambda cold start mới).
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$NewToken
)

$REGION      = "ap-southeast-1"
$SECRET_NAME = "vnpt-ekyc-credentials"

Write-Host "🔍 Đọc secret hiện tại từ Secrets Manager..."
$currentSecret = aws secretsmanager get-secret-value `
    --secret-id $SECRET_NAME `
    --region $REGION `
    --query "SecretString" `
    --output text

if ($LASTEXITCODE -ne 0 -or -not $currentSecret) {
    Write-Host "❌ Không đọc được secret '$SECRET_NAME'. Kiểm tra AWS credentials và region."
    exit 1
}

# Parse JSON hiện tại
$creds = $currentSecret | ConvertFrom-Json

# Decode token để kiểm tra expiry
try {
    $parts   = $NewToken.Split('.')
    $padding = 4 - ($parts[1].Length % 4)
    if ($padding -lt 4) { $padded = $parts[1] + ('=' * $padding) } else { $padded = $parts[1] }
    $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($padded)) | ConvertFrom-Json
    $expDate = [System.DateTimeOffset]::FromUnixTimeSeconds($payload.exp).LocalDateTime
    Write-Host "📋 Token info:"
    Write-Host "   sub: $($payload.sub)"
    Write-Host "   exp: $expDate"
    Write-Host "   client_id: $($payload.client_id)"
    $nowUnix = [System.DateTimeOffset]::Now.ToUnixTimeSeconds()
    if ($payload.exp -lt $nowUnix) {
        Write-Host "⚠️  WARNING: Token này đã expired ($expDate). Vẫn tiếp tục cập nhật..."
    } else {
        $remaining = $payload.exp - $nowUnix
        Write-Host "   còn hiệu lực: $([math]::Floor($remaining/3600))h $([math]::Floor(($remaining%3600)/60))m"
    }
} catch {
    Write-Host "⚠️  Không decode được token để kiểm tra expiry, tiếp tục update..."
}

# Update bearer_token
$creds | Add-Member -MemberType NoteProperty -Name "bearer_token" -Value $NewToken -Force
$newSecretJson = $creds | ConvertTo-Json -Compress

Write-Host ""
Write-Host "📝 Updating secret '$SECRET_NAME'..."
aws secretsmanager update-secret `
    --secret-id $SECRET_NAME `
    --secret-string $newSecretJson `
    --region $REGION

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Secret cập nhật thành công!"
    Write-Host ""
    Write-Host "⚡ Force Lambda cold start để dùng token mới ngay:"
    Write-Host "   aws lambda update-function-configuration --function-name ekyc-handler --region $REGION --description 'force-restart-$(Get-Date -Format yyyyMMddHHmm)'"
    Write-Host ""
    Write-Host "   Hoặc đợi Lambda tự restart (thường sau 15-30 phút idle)."
} else {
    Write-Host "❌ Cập nhật secret thất bại!"
    exit 1
}
