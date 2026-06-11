param(
    [string]$Region = "ap-southeast-1",
    [string]$FunctionName = "cv-ai-handler",
    [Parameter(Mandatory = $true)]
    [string]$ApiId,
    [Parameter(Mandatory = $true)]
    [string]$JwtAuthorizerId,
    [string]$StageName = "prod",
    [string]$GeminiSecretName = "opporeview/gemini",
    [string]$AllowedOrigins = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"
$env:AWS_PAGER = ""
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ZipFile = Join-Path $ScriptDir "cv-ai-handler.zip"
$HandlerFile = Join-Path $ScriptDir "handler.py"

Write-Host "Packaging CV AI Lambda..."
Compress-Archive -LiteralPath $HandlerFile -DestinationPath $ZipFile -Force

$ExistingFunction = aws lambda list-functions `
    --region $Region `
    --query "Functions[?FunctionName=='$FunctionName'].FunctionName | [0]" `
    --output text

if ($ExistingFunction -and $ExistingFunction -ne "None") {
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://$ZipFile" `
        --region $Region | Out-Null
} else {
    $RoleArn = aws lambda get-function `
        --function-name "candidate-profile-handler" `
        --region $Region `
        --query "Configuration.Role" `
        --output text

    aws lambda create-function `
        --function-name $FunctionName `
        --runtime python3.11 `
        --role $RoleArn `
        --handler handler.lambda_handler `
        --zip-file "fileb://$ZipFile" `
        --region $Region `
        --timeout 30 `
        --memory-size 256 | Out-Null
}

$SecretArn = ""
$GeminiKey = ""
$GeminiModel = "gemini-3.1-flash-lite"
$PreviousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$SecretValue = aws secretsmanager get-secret-value `
    --secret-id $GeminiSecretName `
    --region $Region `
    --query "SecretString" `
    --output text 2>$null
$SecretLookupSucceeded = $LASTEXITCODE -eq 0
$ErrorActionPreference = $PreviousErrorActionPreference

if ($SecretLookupSucceeded -and $SecretValue) {
    $SecretArn = aws secretsmanager describe-secret `
        --secret-id $GeminiSecretName `
        --region $Region `
        --query "ARN" `
        --output text
    try {
        $SecretJson = $SecretValue | ConvertFrom-Json
        $GeminiKey = $SecretJson.GEMINI_API_KEY
        if ($SecretJson.GEMINI_MODEL) {
            $GeminiModel = $SecretJson.GEMINI_MODEL
        }
    } catch {
        $GeminiKey = $SecretValue
    }
} else {
    Write-Warning "Gemini secret not found. The endpoint will return AI_NOT_CONFIGURED until the secret is created and this script is run again."
}

$LambdaEnvironment = @{
    Variables = @{
        GEMINI_API_KEY = $GeminiKey
        GEMINI_MODEL = $GeminiModel
        ALLOWED_ORIGINS = $AllowedOrigins
        GEMINI_TIMEOUT_SECONDS = "24"
    }
} | ConvertTo-Json -Compress

$EnvironmentFile = Join-Path ([IO.Path]::GetTempPath()) "cv-ai-lambda-environment-$PID.json"
try {
    [IO.File]::WriteAllText(
        $EnvironmentFile,
        $LambdaEnvironment,
        [Text.UTF8Encoding]::new($false)
    )
    aws lambda update-function-configuration `
        --function-name $FunctionName `
        --region $Region `
        --timeout 30 `
        --memory-size 256 `
        --environment "file://$EnvironmentFile" `
        --no-cli-pager | Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to update Lambda environment variables."
    }
} finally {
    if (Test-Path -LiteralPath $EnvironmentFile) {
        Remove-Item -LiteralPath $EnvironmentFile -Force
    }
}

$LambdaArn = aws lambda get-function `
    --function-name $FunctionName `
    --region $Region `
    --query "Configuration.FunctionArn" `
    --output text

$ExistingIntegration = aws apigatewayv2 get-integrations `
    --api-id $ApiId `
    --region $Region `
    --query "Items[?IntegrationUri=='$LambdaArn'].IntegrationId | [0]" `
    --output text

if (-not $ExistingIntegration -or $ExistingIntegration -eq "None") {
    $IntegrationId = aws apigatewayv2 create-integration `
        --api-id $ApiId `
        --integration-type AWS_PROXY `
        --integration-uri $LambdaArn `
        --payload-format-version "2.0" `
        --timeout-in-millis 29000 `
        --region $Region `
        --query "IntegrationId" `
        --output text
} else {
    $IntegrationId = $ExistingIntegration
}

function Ensure-Route {
    param([string]$RouteKey, [bool]$Authorized)

    $RouteId = aws apigatewayv2 get-routes `
        --api-id $ApiId `
        --region $Region `
        --query "Items[?RouteKey=='$RouteKey'].RouteId | [0]" `
        --output text

    if (-not $RouteId -or $RouteId -eq "None") {
        $Arguments = @(
            "apigatewayv2", "create-route",
            "--api-id", $ApiId,
            "--route-key", $RouteKey,
            "--target", "integrations/$IntegrationId",
            "--region", $Region
        )
        if ($Authorized) {
            $Arguments += @(
                "--authorization-type", "JWT",
                "--authorizer-id", $JwtAuthorizerId
            )
        }
        aws @Arguments | Out-Null
    }
}

Ensure-Route "POST /cv/analyze" $true
Ensure-Route "OPTIONS /cv/analyze" $false
Ensure-Route "POST /cv/generate" $true
Ensure-Route "OPTIONS /cv/generate" $false
Ensure-Route "POST /cv/recommend-candidates" $true
Ensure-Route "OPTIONS /cv/recommend-candidates" $false
Ensure-Route "GET /health" $false

$PreviousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$Policy = aws lambda get-policy `
    --function-name $FunctionName `
    --region $Region `
    --query "Policy" `
    --output text 2>$null
$PolicyLookupSucceeded = $LASTEXITCODE -eq 0
$ErrorActionPreference = $PreviousErrorActionPreference

if (-not $PolicyLookupSucceeded -or $Policy -notmatch "apigateway-cv-ai-invoke") {
    aws lambda add-permission `
        --function-name $FunctionName `
        --statement-id "apigateway-cv-ai-invoke" `
        --action lambda:InvokeFunction `
        --principal apigateway.amazonaws.com `
        --source-arn "arn:aws:execute-api:${Region}:*:${ApiId}/*" `
        --region $Region `
        --no-cli-pager | Out-Null
}

Write-Host "CV AI Lambda deployed."
Write-Host "Endpoint: https://$ApiId.execute-api.$Region.amazonaws.com/$StageName/cv/analyze"
if ($SecretArn) {
    Write-Host "Gemini secret used: $SecretArn"
}
