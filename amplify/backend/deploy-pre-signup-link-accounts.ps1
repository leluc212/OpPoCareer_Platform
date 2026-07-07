# =============================================================================
# Deploy Pre Sign-Up Lambda Trigger — Auto-link Google accounts
# =============================================================================
# Usage (từ thư mục gốc project hoặc amplify/backend):
#   .\amplify\backend\deploy-pre-signup-link-accounts.ps1
#
# Những việc script này làm:
#   1. Cài npm dependencies cho Lambda (bên trong thư mục lambda)
#   2. Đóng gói code + node_modules thành file .zip
#   3. Tạo IAM Role với quyền cognito-idp:ListUsers và AdminLinkProviderForUser
#   4. Tạo hoặc cập nhật Lambda function (Node.js 20.x)
#   5. Cấp quyền để Cognito có thể invoke Lambda này
#   6. Gắn Lambda làm Pre sign-up trigger của User Pool
#
# Yêu cầu:
#   - AWS CLI đã cấu hình (aws configure)
#   - Node.js và npm đã cài
#   - Tài khoản AWS có quyền: iam:*, lambda:*, cognito-idp:UpdateUserPool
# =============================================================================

$ErrorActionPreference = "Stop"

# ── Config ─────────────────────────────────────────────────────────────────────
$Region       = "ap-southeast-1"
$UserPoolId   = "ap-southeast-1_ShCajkmJd"
$FunctionName = "PreSignUpLinkAccounts"
$RoleName     = "PreSignUpLinkAccountsRole"
$LambdaDir    = "infra\lambda\pre-signup-link-accounts"
$ZipFile      = "amplify\backend\pre-signup-link-accounts.zip"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Deploy Pre Sign-Up Lambda: $FunctionName" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

# Verify project root (script should run from project root)
if (-not (Test-Path $LambdaDir)) {
    Write-Host ""
    Write-Host "❌ ERROR: Cannot find '$LambdaDir'." -ForegroundColor Red
    Write-Host "   Please run this script from the PROJECT ROOT directory." -ForegroundColor Red
    Write-Host "   Example: cd d:\OpPoCareer_Platform && .\amplify\backend\deploy-pre-signup-link-accounts.ps1" -ForegroundColor Yellow
    exit 1
}

# ── Get Account ID ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔍 Getting AWS Account ID..." -ForegroundColor Yellow
$AccountId = (aws sts get-caller-identity --query Account --output text 2>&1)
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get AWS Account ID. Is AWS CLI configured?" -ForegroundColor Red
    exit 1
}
$AccountId = $AccountId.Trim()
Write-Host "   Account ID : $AccountId"
Write-Host "   Region     : $Region"
Write-Host "   User Pool  : $UserPoolId"

# ── Step 1: Install npm dependencies ──────────────────────────────────────────
Write-Host ""
Write-Host "📦 Step 1: Installing Lambda npm dependencies..." -ForegroundColor Yellow

Push-Location $LambdaDir
try {
    npm install --production 2>&1 | Write-Host
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    Write-Host "   ✅ Dependencies installed." -ForegroundColor Green
} finally {
    Pop-Location
}

# ── Step 2: Package Lambda into zip ───────────────────────────────────────────
Write-Host ""
Write-Host "📦 Step 2: Packaging Lambda into $ZipFile..." -ForegroundColor Yellow

if (Test-Path $ZipFile) { Remove-Item $ZipFile -Force }

# Compress the lambda directory contents (index.js + node_modules)
Compress-Archive -Path "$LambdaDir\*" -DestinationPath $ZipFile -Force
Write-Host "   ✅ Packaged to $ZipFile" -ForegroundColor Green

# ── Step 3: IAM Role ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔐 Step 3: Ensuring IAM Role '$RoleName'..." -ForegroundColor Yellow

$roleCheck = aws iam get-role --role-name $RoleName --region $Region 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Creating IAM role..."

    $trustDoc = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
    aws iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document $trustDoc `
        --description "Role for PreSignUpLinkAccounts Lambda trigger" | Out-Null

    # Basic Lambda execution (CloudWatch Logs)
    aws iam attach-role-policy `
        --role-name $RoleName `
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole | Out-Null

    Write-Host "   Attached AWSLambdaBasicExecutionRole"
} else {
    Write-Host "   IAM Role already exists."
}

# Always ensure the inline Cognito policy is up-to-date
$UserPoolArn = "arn:aws:cognito-idp:${Region}:${AccountId}:userpool/${UserPoolId}"

# Write policy JSON to a temp file to avoid shell escaping issues
$tmpPolicy = [System.IO.Path]::GetTempFileName() + ".json"
$cognitoPolicyObj = [ordered]@{
    Version = "2012-10-17"
    Statement = @(
        [ordered]@{
            Sid      = "AllowListUsers"
            Effect   = "Allow"
            Action   = "cognito-idp:ListUsers"
            Resource = $UserPoolArn
        },
        [ordered]@{
            Sid      = "AllowLinkProvider"
            Effect   = "Allow"
            Action   = "cognito-idp:AdminLinkProviderForUser"
            Resource = $UserPoolArn
        }
    )
}
$cognitoPolicyObj | ConvertTo-Json -Depth 5 | Set-Content -Path $tmpPolicy -Encoding UTF8

aws iam put-role-policy `
    --role-name $RoleName `
    --policy-name "CognitoLinkAccounts" `
    --policy-document "file://$tmpPolicy" | Out-Null

Remove-Item $tmpPolicy -Force
Write-Host "   ✅ Inline Cognito policy applied (ListUsers + AdminLinkProviderForUser)." -ForegroundColor Green

$RoleArn = "arn:aws:iam::${AccountId}:role/${RoleName}"

# ── Step 4: Create or Update Lambda function ───────────────────────────────────
Write-Host ""
Write-Host "⚡ Step 4: Deploying Lambda '$FunctionName'..." -ForegroundColor Yellow

$lambdaCheck = aws lambda get-function --function-name $FunctionName --region $Region 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Creating new Lambda function (waiting for IAM propagation)..."
    Start-Sleep -Seconds 15

    aws lambda create-function `
        --function-name  $FunctionName `
        --runtime        nodejs20.x `
        --role           $RoleArn `
        --handler        index.handler `
        --zip-file       "fileb://$ZipFile" `
        --timeout        15 `
        --memory-size    128 `
        --description    "Pre Sign-Up trigger: auto-links Google accounts to existing native Cognito accounts" `
        --region         $Region | Out-Null

    Write-Host "   ✅ Lambda created." -ForegroundColor Green
} else {
    Write-Host "   Updating existing Lambda code..."
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file      "fileb://$ZipFile" `
        --region        $Region | Out-Null

    # Wait for update to complete before changing config
    Write-Host "   Waiting for code update to complete..."
    aws lambda wait function-updated `
        --function-name $FunctionName `
        --region        $Region

    aws lambda update-function-configuration `
        --function-name $FunctionName `
        --runtime       nodejs20.x `
        --handler       index.handler `
        --timeout       15 `
        --memory-size   128 `
        --region        $Region | Out-Null

    Write-Host "   ✅ Lambda updated." -ForegroundColor Green
}

$LambdaArn = "arn:aws:lambda:${Region}:${AccountId}:function:${FunctionName}"

# ── Step 5: Grant Cognito permission to invoke Lambda ─────────────────────────
Write-Host ""
Write-Host "🔑 Step 5: Granting Cognito invoke permission..." -ForegroundColor Yellow

$StatementId = "CognitoPreSignUpInvoke"
# Remove existing statement if present (ignore errors)
aws lambda remove-permission `
    --function-name $FunctionName `
    --statement-id  $StatementId `
    --region        $Region 2>&1 | Out-Null

aws lambda add-permission `
    --function-name $FunctionName `
    --statement-id  $StatementId `
    --action        lambda:InvokeFunction `
    --principal     cognito-idp.amazonaws.com `
    --source-arn    "arn:aws:cognito-idp:${Region}:${AccountId}:userpool/${UserPoolId}" `
    --region        $Region | Out-Null

Write-Host "   ✅ Cognito can now invoke Lambda." -ForegroundColor Green

# ── Step 6: Attach Lambda as Pre sign-up trigger ──────────────────────────────
Write-Host ""
Write-Host "🔗 Step 6: Attaching Lambda as Pre sign-up trigger on User Pool '$UserPoolId'..." -ForegroundColor Yellow

# Read current lambda config so we don't overwrite other triggers
$currentConfig = aws cognito-idp describe-user-pool `
    --user-pool-id $UserPoolId `
    --region       $Region `
    --query        "UserPool.LambdaConfig" `
    --output       json 2>&1 | ConvertFrom-Json

if ($null -eq $currentConfig) {
    $currentConfig = @{}
}

# Check if PreSignUp is already set
$existingArn = $currentConfig.PreSignUp
if ($existingArn -eq $LambdaArn) {
    Write-Host "   ✅ Pre sign-up trigger already points to this Lambda." -ForegroundColor Green
} else {
    if ($existingArn) {
        Write-Host "   ⚠️  Replacing existing Pre sign-up trigger: $existingArn" -ForegroundColor Yellow
    }

    # Build update command: only set PreSignUp, preserve others via the current config
    # We pass --lambda-config as JSON to avoid overwriting other triggers
    $lambdaConfigJson = @{
        PreSignUp = $LambdaArn
    }

    # Preserve any existing trigger ARNs from the current config
    foreach ($prop in @("PostConfirmation","PreAuthentication","PostAuthentication","CustomMessage","DefineAuthChallenge","CreateAuthChallenge","VerifyAuthChallengeResponse","PreTokenGeneration","UserMigration","KMSKeyID")) {
        $val = $currentConfig.$prop
        if ($val) {
            $lambdaConfigJson[$prop] = $val
        }
    }

    $tmpLambdaConfig = [System.IO.Path]::GetTempFileName() + ".json"
    $lambdaConfigJson | ConvertTo-Json -Compress | Set-Content -Path $tmpLambdaConfig -Encoding UTF8

    aws cognito-idp update-user-pool `
        --user-pool-id  $UserPoolId `
        --lambda-config "file://$tmpLambdaConfig" `
        --region        $Region | Out-Null

    Remove-Item $tmpLambdaConfig -Force
    Write-Host "   ✅ Pre sign-up trigger attached!" -ForegroundColor Green
}

# ── Done ───────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Deployment COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Lambda ARN : $LambdaArn" -ForegroundColor Cyan
Write-Host "  User Pool  : $UserPoolId" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test: Go to https://oppocareer.com, sign in with Google (email that already"
Write-Host "      has a native account). You should land on the SAME account, not a new one."
Write-Host "   2. Check CloudWatch: Lambda > Logs > /aws/lambda/$FunctionName"
Write-Host "   3. Run the duplicate-user detection script to find any pre-existing duplicates:"
Write-Host "      node amplify\backend\find-duplicate-google-users.js"
Write-Host ""
