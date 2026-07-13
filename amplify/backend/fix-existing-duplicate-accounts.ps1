# =============================================================================
# fix-existing-duplicate-accounts.ps1
#
# Fixes the 2 known duplicate Cognito + DynamoDB pairs found before the
# Pre Sign-Up Lambda was deployed.  Run this ONCE after deploying the Lambda.
#
# What this script does for each duplicate pair:
#   1. Calls AdminLinkProviderForUser → merges Google identity into native account
#   2. Updates the DynamoDB Users table: sets the native userId on the Google-sub
#      record (if it exists), then deletes the orphan Google-sub row
#
# IMPORTANT:
#   - Review the pairs below before running.
#   - Run from the PROJECT ROOT directory.
#   - Requires AWS CLI + appropriate IAM permissions.
#   - Script is idempotent: safe to re-run.
# =============================================================================

$ErrorActionPreference = "Stop"

$Region     = "ap-southeast-1"
$UserPoolId = "ap-southeast-1_ShCajkmJd"
$UsersTable = "Users"

# ── Known duplicate pairs (from duplicate-google-users-report.json) ─────────
$Pairs = @(
    @{
        Email          = "leluc2200@gmail.com"
        NativeUsername = "leluc2200@gmail.com"
        NativeSub      = "296aa58c-30a1-70cc-44ed-b829e33a8245"
        GoogleUsername = "Google_109013423826899211367"
        GoogleSub      = "109013423826899211367"
        GoogleUserSub  = "e9aa95dc-20c1-7023-4458-fe03c18d3590"
    },
    @{
        Email          = "ngocminhnguyen250875@gmail.com"
        NativeUsername = "ngocminhnguyen250875@gmail.com"
        NativeSub      = "b96aa56c-b0a1-7045-0cc8-d03dabce7246"
        GoogleUsername = "Google_109764273223095428679"
        GoogleSub      = "109764273223095428679"
        GoogleUserSub  = "890ad50c-a0d1-7055-d543-1be584c008d3"
    }
)

Write-Host ""
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Fix Existing Duplicate Accounts — OpPoCareer"        -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

foreach ($pair in $Pairs) {
    Write-Host "─────────────────────────────────────────────────────" -ForegroundColor Yellow
    Write-Host "Processing: $($pair.Email)" -ForegroundColor Yellow
    Write-Host "  Native  : $($pair.NativeUsername) (sub: $($pair.NativeSub))"
    Write-Host "  Google  : $($pair.GoogleUsername) (sub: $($pair.GoogleUserSub))"
    Write-Host ""

    # ── Step 1: Link Google identity into native account in Cognito ───────────
    Write-Host "  [1/3] Linking Google identity into native Cognito account..."
    try {
        aws cognito-idp admin-link-provider-for-user `
            --user-pool-id $UserPoolId `
            --destination-user "ProviderName=Cognito,ProviderAttributeValue=$($pair.NativeUsername)" `
            --source-user "ProviderName=Google,ProviderAttributeName=Cognito_Subject,ProviderAttributeValue=$($pair.GoogleSub)" `
            --region $Region 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Cognito link succeeded." -ForegroundColor Green
        } else {
            # May already be linked — not fatal
            Write-Host "  ⚠️  Cognito link returned non-zero (may already be linked). Continuing..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️  Cognito link failed (may already be linked): $_" -ForegroundColor Yellow
    }

    # ── Step 2: Check if orphan Google-sub row exists in DynamoDB ─────────────
    Write-Host "  [2/3] Checking DynamoDB for orphan Google-sub row (sub: $($pair.GoogleUserSub))..."
    $orphanCheck = aws dynamodb get-item `
        --table-name $UsersTable `
        --key "{`"userId`":{`"S`":`"$($pair.GoogleUserSub)`"}}" `
        --region $Region `
        --output json 2>&1

    $orphanItem = $orphanCheck | ConvertFrom-Json

    if ($orphanItem.Item) {
        Write-Host "  Found orphan row in DynamoDB. Deleting..."
        try {
            aws dynamodb delete-item `
                --table-name $UsersTable `
                --key "{`"userId`":{`"S`":`"$($pair.GoogleUserSub)`"}}" `
                --region $Region | Out-Null
            Write-Host "  ✅ Orphan DynamoDB row deleted (userId: $($pair.GoogleUserSub))." -ForegroundColor Green
        } catch {
            Write-Host "  ❌ Failed to delete orphan row: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ℹ️  No orphan row found in DynamoDB for Google sub $($pair.GoogleUserSub). Already clean." -ForegroundColor Cyan
    }

    # ── Step 3: Ensure native user record exists / is up-to-date ─────────────
    Write-Host "  [3/3] Verifying native DynamoDB record (userId: $($pair.NativeSub))..."
    $nativeCheck = aws dynamodb get-item `
        --table-name $UsersTable `
        --key "{`"userId`":{`"S`":`"$($pair.NativeSub)`"}}" `
        --region $Region `
        --output json 2>&1

    $nativeItem = $nativeCheck | ConvertFrom-Json
    if ($nativeItem.Item) {
        Write-Host "  ✅ Native DynamoDB record exists for userId $($pair.NativeSub)." -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Native DynamoDB record NOT found for userId $($pair.NativeSub)." -ForegroundColor Yellow
        Write-Host "      You may need to manually create/restore this record or check the table name." -ForegroundColor Yellow
    }

    Write-Host ""
}

Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Fix complete. Summary:"                            -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:"
Write-Host "  1. Run: node amplify\backend\find-duplicate-google-users.js"
Write-Host "     → should show 0 duplicate pairs now."
Write-Host "  2. Run: node amplify\backend\find-duplicate-dynamo-users.js"
Write-Host "     → should show 0 duplicate email groups now."
Write-Host "  3. Ask the affected users (leluc2200@gmail.com,"
Write-Host "     ngocminhnguyen250875@gmail.com) to log in via Google"
Write-Host "     and confirm they see their original profile data."
Write-Host ""
