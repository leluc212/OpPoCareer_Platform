param(
    [string]$Region = "ap-southeast-1",
    [string]$SecretName = "opporeview/gemini",
    [string]$Model = "gemini-3.1-flash-lite",
    [string]$ApiId = "sd7ds72m8g",
    [string]$JwtAuthorizerId = "46klga",
    [string]$AllowedOrigins = "http://localhost:3000,https://opporeview.github.io"
)

$ErrorActionPreference = "Stop"
$env:AWS_PAGER = ""
$SecureKey = Read-Host "Enter your Gemini API key" -AsSecureString
$Pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureKey)

try {
    $ApiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Pointer)
    if (-not $ApiKey) {
        throw "Gemini API key cannot be empty."
    }

    $SecretPayload = @{
        GEMINI_API_KEY = $ApiKey
        GEMINI_MODEL = $Model
    } | ConvertTo-Json -Compress

    $ExistingSecret = aws secretsmanager list-secrets `
        --region $Region `
        --query "SecretList[?Name=='$SecretName'].Name | [0]" `
        --output text

    if ($ExistingSecret -and $ExistingSecret -ne "None") {
        aws secretsmanager update-secret `
            --secret-id $SecretName `
            --secret-string $SecretPayload `
            --region $Region `
            --no-cli-pager | Out-Null
    } else {
        aws secretsmanager create-secret `
            --name $SecretName `
            --secret-string $SecretPayload `
            --region $Region `
            --no-cli-pager | Out-Null
    }

    Write-Host "Gemini secret configured."
} finally {
    if ($Pointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Pointer)
    }
    $ApiKey = $null
    $SecretPayload = $null
}

& (Join-Path $PSScriptRoot "deploy-cv-ai-lambda.ps1") `
    -Region $Region `
    -ApiId $ApiId `
    -JwtAuthorizerId $JwtAuthorizerId `
    -StageName "prod" `
    -GeminiSecretName $SecretName `
    -AllowedOrigins $AllowedOrigins
