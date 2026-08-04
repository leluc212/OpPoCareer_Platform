# ─────────────────────────────────────────────────────────────────────────────
# S3 Storage Bucket & Bucket Policy
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "media_storage" {
  bucket        = var.s3_bucket_name
  force_destroy = false
}

resource "aws_s3_bucket_public_access_block" "media_storage_block" {
  bucket = aws_s3_bucket.media_storage.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_cors_configuration" "media_storage_cors" {
  bucket = aws_s3_bucket.media_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_policy" "media_storage_policy" {
  depends_on = [aws_s3_bucket_public_access_block.media_storage_block]
  bucket     = aws_s3_bucket.media_storage.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadForMediaFolders"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource = [
          "${aws_s3_bucket.media_storage.arn}/banner/*",
          "${aws_s3_bucket.media_storage.arn}/poster/*",
          "${aws_s3_bucket.media_storage.arn}/system/*",
          "${aws_s3_bucket.media_storage.arn}/feedback-images/*"
        ]
      }
    ]
  })
}
