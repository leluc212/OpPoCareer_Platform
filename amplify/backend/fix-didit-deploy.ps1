# ============================================================
# fix-didit-deploy.ps1
# Deploy fix lỗi "Lỗi nội bộ" cho Lambda ekyc-handler:
#   1. Tạo / cập nhật secret prod/didit/api-key
#   2. Patch IAM role cho Lambda
#   3. Update Lambda code từ ZIP mới
#   4. Kiểm tra kết quả
# ============================================================

$REGION        = "ap-southeast-1"
$FUNCTION_NAME = "ekyc-handler"
$API_KEY       = $env:DIDIT_API_KEY   # Set via: $env:DIDIT_API_KEY = "your-key"
$WEBHOOK_SECRET = ""   # Điền webhook secret nếu có, để trống cũng OK

$ZIP_FILE      = "$PSScriptRoot\didit-ekyc-handler-new.zip"
$SECRET_NAME   = "prod/didit/api-key"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Fix Didit eKYC Lambda" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── 0. Kiểm tra credentials ───────────────────────────────────────────────────
Write-Host "[0/4] Kiểm tra AWS credentials..." -ForegroundColor Yellow
$identity = aws sts get-caller-identity --output json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Credentials không hợp lệ hoặc đã expired!" -ForegroundColor Red
    Write-Host "   Vào AWS Console → IAM → Security credentials → Create access key"
    Write-Host "   Rồi chạy: aws configure"
    exit 1
}
$account = ($identity | ConvertFrom-Json).Account
Write-Host "✅ Account: $account | Region: $REGION" -ForegroundColor Green
Write-Host ""

# ── 1. Tạo / cập nhật secret ─────────────────────────────────────────────────
Write-Host "[1/4] Kiểm tra / tạo secret '$SECRET_NAME'..." -ForegroundColor Yellow
$secretValue = "{`"apiKey`":`"$API_KEY`",`"webhookSecret`":`"$WEBHOOK_SECRET`"}"

$existing = aws secretsmanager describe-secret --secret-id $SECRET_NAME --region $REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Secret đã tồn tại → cập nhật giá trị..."
    aws secretsmanager put-secret-value `
        --secret-id $SECRET_NAME `
        --secret-string $secretValue `
        --region $REGION | Out-Null
    Write-Host "✅ Secret đã cập nhật" -ForegroundColor Green
} else {
    Write-Host "   Secret chưa có → tạo mới..."
    aws secretsmanager create-secret `
        --name $SECRET_NAME `
        --description "Didit eKYC API Key and Webhook Secret" `
        --secret-string $secretValue `
        --region $REGION | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Secret đã tạo thành công" -ForegroundColor Green
    } else {
        Write-Host "❌ Tạo secret thất bại!" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# ── 2. Patch IAM policy cho Lambda role ──────────────────────────────────────
Write-Host "[2/4] Patch IAM policy cho Lambda role..." -ForegroundColor Yellow
$ROLE_ARN = aws lambda get-function `
    --function-name $FUNCTION_NAME `
    --region $REGION `
    --query "Configuration.Role" `
    --output text 2>&1

if ($LASTEXITCODE -ne 0 -or -not $ROLE_ARN) {
    Write-Host "❌ Không tìm được Lambda '$FUNCTION_NAME'!" -ForegroundColor Red
    Write-Host "   Kiểm tra lại tên function hoặc chạy deploy-didit-ekyc-lambda.ps1 trước"
    exit 1
}

$ROLE_NAME = $ROLE_ARN.Split("/")[-1]
Write-Host "   Lambda role: $ROLE_NAME"

$ACCOUNT_ID = aws sts get-caller-identity --query "Account" --output text
$DIDIT_POLICY = @"
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": ["secretsmanager:GetSecretValue"],
        "Resource": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:${SECRET_NAME}*"
    }]
}
"@

$policyFile = "$env:TEMP\didit-iam-policy.json"
$DIDIT_POLICY | Out-File -FilePath $policyFile -Encoding utf8

aws iam put-role-policy `
    --role-name $ROLE_NAME `
    --policy-name "didit-secret-policy" `
    --policy-document "file://$policyFile" `
    --region $REGION 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ IAM policy đã gán cho role $ROLE_NAME" -ForegroundColor Green
} else {
    Write-Host "⚠️  Gán IAM policy thất bại — có thể đã có sẵn hoặc thiếu quyền IAM" -ForegroundColor Yellow
}
Remove-Item $policyFile -Force -ErrorAction SilentlyContinue
Write-Host ""

# ── 3. Update Lambda code ─────────────────────────────────────────────────────
Write-Host "[3/4] Deploy ZIP mới lên Lambda '$FUNCTION_NAME'..." -ForegroundColor Yellow
if (-not (Test-Path $ZIP_FILE)) {
    Write-Host "❌ Không tìm thấy ZIP: $ZIP_FILE" -ForegroundColor Red
    exit 1
}

$zipSize = [math]::Round((Get-Item $ZIP_FILE).Length / 1KB, 1)
Write-Host "   ZIP: $ZIP_FILE ($zipSize KB)"

aws lambda update-function-code `
    --function-name $FUNCTION_NAME `
    --zip-file "fileb://$ZIP_FILE" `
    --region $REGION `
    --query "CodeSize" `
    --output text 2>&1 | ForEach-Object { Write-Host "   Uploaded: $_ bytes" }

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lambda code đã cập nhật" -ForegroundColor Green
} else {
    Write-Host "❌ Update Lambda code thất bại!" -ForegroundColor Red
    exit 1
}

# Đợi Lambda update xong
Write-Host "   Đợi Lambda sẵn sàng..."
aws lambda wait function-updated --function-name $FUNCTION_NAME --region $REGION 2>&1 | Out-Null
Write-Host ""

# ── 4. Invoke test để kiểm tra ────────────────────────────────────────────────
Write-Host "[4/4] Test invoke Lambda (không có JWT — expect 401)..." -ForegroundColor Yellow
$testPayload = @{
    requestContext = @{ http = @{ method = "POST" } }
    rawPath = "/ekyc/session"
    body = '{"callbackUrl":"https://test.oppo.vn"}'
    headers = @{}
} | ConvertTo-Json -Compress

$testPayloadB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($testPayload))
$outFile = "$env:TEMP\lambda-test-out.json"

aws lambda invoke `
    --function-name $FUNCTION_NAME `
    --payload $testPayloadB64 `
    --region $REGION `
    $outFile 2>&1 | Out-Null

if (Test-Path $outFile) {
    $result = Get-Content $outFile | ConvertFrom-Json
    $statusCode = $result.statusCode
    $body = $result.body | ConvertFrom-Json -ErrorAction SilentlyContinue
    Write-Host "   Response: HTTP $statusCode"
    if ($body) { Write-Host "   Body: $($body | ConvertTo-Json -Compress)" }

    if ($statusCode -eq 401) {
        Write-Host "✅ Lambda hoạt động đúng (401 = không có JWT, expected)" -ForegroundColor Green
    } elseif ($statusCode -eq 500) {
        Write-Host "❌ Vẫn còn lỗi 500 — kiểm tra CloudWatch logs:" -ForegroundColor Red
        Write-Host "   aws logs tail /aws/lambda/$FUNCTION_NAME --region $REGION --since 5m"
    } else {
        Write-Host "ℹ️  Status $statusCode" -ForegroundColor Cyan
    }
    Remove-Item $outFile -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "⚠️  Không đọc được response file" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Xong! Vào lại trang eKYC và thử lại." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
