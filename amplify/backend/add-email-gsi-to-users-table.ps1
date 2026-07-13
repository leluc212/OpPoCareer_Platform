# =============================================================================
# add-email-gsi-to-users-table.ps1
#
# Adds a Global Secondary Index (GSI) named "email-index" to the DynamoDB
# Users table so that Lambda functions can look up users by email efficiently.
#
# GSI spec:
#   Index name  : email-index
#   Hash key    : email (String)
#   Projection  : ALL
#   Billing     : PAY_PER_REQUEST (on-demand) — same as the base table
#
# Usage (from project root):
#   .\amplify\backend\add-email-gsi-to-users-table.ps1
#
# Idempotent: safe to re-run. If the GSI already exists, the script reports
# that and exits cleanly.
#
# Requirements:
#   - AWS CLI configured with credentials that have dynamodb:UpdateTable /
#     dynamodb:DescribeTable permissions.
# =============================================================================

$ErrorActionPreference = "Stop"

$Region     = "ap-southeast-1"
$TableName  = "Users"
$GsiName    = "email-index"
$EmailAttr  = "email"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Add email-index GSI to DynamoDB Users table"          -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Check if GSI already exists ────────────────────────────────────────────────
Write-Host "🔍 Checking current table config..."

$tableJson = aws dynamodb describe-table `
    --table-name $TableName `
    --region $Region `
    --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Could not describe table '$TableName'. Check table name and AWS credentials." -ForegroundColor Red
    Write-Host $tableJson
    exit 1
}

$table = $tableJson | ConvertFrom-Json
$existingGSIs = $table.Table.GlobalSecondaryIndexes

if ($existingGSIs) {
    $alreadyExists = $existingGSIs | Where-Object { $_.IndexName -eq $GsiName }
    if ($alreadyExists) {
        Write-Host "✅ GSI '$GsiName' already exists on table '$TableName'. Nothing to do." -ForegroundColor Green
        exit 0
    }
}

Write-Host "  GSI '$GsiName' not found. Creating..."

# ── Build the UpdateTable call ────────────────────────────────────────────────
# We must pass the attribute definition for 'email' and the GSI in one call.
$updateInput = @{
    TableName = $TableName
    AttributeDefinitions = @(
        @{ AttributeName = $EmailAttr; AttributeType = "S" }
    )
    GlobalSecondaryIndexUpdates = @(
        @{
            Create = @{
                IndexName = $GsiName
                KeySchema = @(
                    @{ AttributeName = $EmailAttr; KeyType = "HASH" }
                )
                Projection = @{ ProjectionType = "ALL" }
                # BillingMode is inherited from the table (PAY_PER_REQUEST).
                # For PROVISIONED tables, add ProvisionedThroughput here.
            }
        }
    )
}

$tmpInput = [System.IO.Path]::GetTempFileName() + ".json"
$updateInput | ConvertTo-Json -Depth 10 | Set-Content -Path $tmpInput -Encoding UTF8

Write-Host ""
Write-Host "⚙️  Sending UpdateTable request..."

aws dynamodb update-table `
    --cli-input-json "file://$tmpInput" `
    --region $Region | Out-Null

Remove-Item $tmpInput -Force

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ UpdateTable failed. See output above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ UpdateTable request accepted. GSI creation is in progress (usually < 5 min)." -ForegroundColor Green
Write-Host ""
Write-Host "   Monitor status:"
Write-Host "   aws dynamodb describe-table --table-name $TableName --region $Region --query 'Table.GlobalSecondaryIndexes[*].{Name:IndexName,Status:IndexStatus}' --output table"
Write-Host ""
Write-Host "   Wait until IndexStatus = ACTIVE before deploying Lambda functions that use it."
Write-Host ""

# ── Poll until ACTIVE ─────────────────────────────────────────────────────────
Write-Host "⏳ Waiting for GSI to become ACTIVE (polling every 15 s, max 10 min)..."
$maxWait   = 600  # seconds
$pollEvery = 15
$elapsed   = 0

while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds $pollEvery
    $elapsed += $pollEvery

    $statusJson = aws dynamodb describe-table `
        --table-name $TableName `
        --region $Region `
        --query "Table.GlobalSecondaryIndexes[?IndexName=='$GsiName'].IndexStatus" `
        --output json 2>&1

    $statuses = $statusJson | ConvertFrom-Json

    if ($statuses -and $statuses.Count -gt 0) {
        $status = $statuses[0]
        Write-Host "  [$elapsed s] IndexStatus = $status"
        if ($status -eq "ACTIVE") {
            Write-Host ""
            Write-Host "✅ GSI '$GsiName' is now ACTIVE." -ForegroundColor Green
            break
        }
    } else {
        Write-Host "  [$elapsed s] GSI not found yet..."
    }
}

if ($elapsed -ge $maxWait) {
    Write-Host ""
    Write-Host "⚠️  Timed out waiting for GSI to become ACTIVE." -ForegroundColor Yellow
    Write-Host "   Check manually: aws dynamodb describe-table --table-name $TableName --region $Region"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Done. email-index GSI added to Users table."           -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
