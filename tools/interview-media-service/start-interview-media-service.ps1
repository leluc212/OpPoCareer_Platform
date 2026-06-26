param(
    [string]$HostName = "127.0.0.1",
    [int]$Port = 8787,
    [string]$GeminiApiKey = $env:GEMINI_API_KEY,
    [string]$SadTalkerRepoDir = $env:SADTALKER_REPO_DIR,
    [string]$SadTalkerCheckpointDir = $env:SADTALKER_CHECKPOINT_DIR,
    [string]$SadTalkerPython = $env:SADTALKER_PYTHON,
    [string]$AvatarImage = "",
    [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")

if (-not $AvatarImage) {
    $AvatarImage = Join-Path $RepoRoot "src\assets\ai-interviewer-avatar.png"
}
if (-not $OutputDir) {
    $OutputDir = Join-Path $ScriptDir "media"
}
if (-not $SadTalkerPython) {
    $SadTalkerPython = "python"
}

$env:GEMINI_API_KEY = $GeminiApiKey
$env:SADTALKER_REPO_DIR = $SadTalkerRepoDir
$env:SADTALKER_CHECKPOINT_DIR = $SadTalkerCheckpointDir
$env:SADTALKER_PYTHON = $SadTalkerPython
$env:INTERVIEW_AVATAR_IMAGE = $AvatarImage
$env:INTERVIEW_MEDIA_OUTPUT_DIR = $OutputDir
$env:INTERVIEW_MEDIA_PUBLIC_BASE_URL = "http://${HostName}:${Port}"
$env:INTERVIEW_MEDIA_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://127.0.0.1:5173,http://localhost:5173"

Write-Host "Starting interview media service..."
Write-Host "URL: http://${HostName}:${Port}"
Write-Host "Gemini TTS configured: $([bool]$GeminiApiKey)"
Write-Host "SadTalker repo: $SadTalkerRepoDir"
Write-Host "Output: $OutputDir"

Set-Location $ScriptDir
python -m uvicorn app:app --host $HostName --port $Port --reload
