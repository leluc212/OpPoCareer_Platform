# Configure S3 CORS for banner image uploads from the browser
# Run this once after creating the S3 bucket or when CORS errors appear

$BucketName = "opporeview-cv-storage-prod-2026"
$Region     = "ap-southeast-1"

$CorsConfig = @"
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
"@

$CorsConfig | Out-File -FilePath "s3-cors-temp.json" -Encoding utf8 -NoNewline

Write-Host "🪣 Configuring CORS for S3 bucket: $BucketName" -ForegroundColor Cyan
aws s3api put-bucket-cors `
    --bucket $BucketName `
    --cors-configuration file://s3-cors-temp.json `
    --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ CORS configured successfully." -ForegroundColor Green
} else {
    Write-Host "❌ Failed to configure CORS. Check your AWS credentials and bucket name." -ForegroundColor Red
}

Remove-Item "s3-cors-temp.json" -ErrorAction SilentlyContinue
