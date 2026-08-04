locals {
  legacy_s3_buckets = {
    sam_source       = "aws-sam-cli-managed-default-samclisourcebucket-qrglrexny0ij"
    cdk_assets       = "cdk-hnb659fds-assets-726911960757-ap-southeast-1"
    cloudtrail_logs  = "cloudbank-redteam-6058092e-cloudtrail-logs"
    synthetic_data   = "cloudbank-redteam-6058092e-synthetic-data"
    opporeview_media = "opporeview-cv-storage-prod-2026"
  }

  ses_email_identities = toset([
    "lucltse184288@fpt.edu.vn",
    "Duypl2310@gmail.com"
  ])

  secret_names = toset([
    "vnpt-ekyc-credentials",
    "opporeview/gemini",
    "prod/didit/api-key"
  ])
}

resource "aws_s3_bucket" "legacy" {
  for_each = local.legacy_s3_buckets
  bucket   = lookup(var.s3_bucket_name_overrides, each.key, each.value)
}

resource "aws_s3_bucket_public_access_block" "opporeview_media" {
  bucket = aws_s3_bucket.legacy["opporeview_media"].id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_cors_configuration" "opporeview_media" {
  bucket = aws_s3_bucket.legacy["opporeview_media"].id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_policy" "opporeview_media" {
  depends_on = [aws_s3_bucket_public_access_block.opporeview_media]
  bucket     = aws_s3_bucket.legacy["opporeview_media"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadForMediaFolders"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource = [
          "${aws_s3_bucket.legacy["opporeview_media"].arn}/banner/*",
          "${aws_s3_bucket.legacy["opporeview_media"].arn}/poster/*",
          "${aws_s3_bucket.legacy["opporeview_media"].arn}/system/*",
          "${aws_s3_bucket.legacy["opporeview_media"].arn}/feedback-images/*"
        ]
      }
    ]
  })
}

resource "aws_route53_zone" "oppocareer" {
  count = var.create_route53_zone ? 1 : 0
  name  = "oppocareer.com"
}

resource "aws_route53_record" "oppocareer_apex_a" {
  count   = var.create_route53_zone ? 1 : 0
  zone_id = aws_route53_zone.oppocareer[0].zone_id
  name    = "oppocareer.com"
  type    = "A"
  ttl     = 300
  records = [
    "185.199.108.153",
    "185.199.109.153",
    "185.199.110.153",
    "185.199.111.153"
  ]
}

resource "aws_route53_record" "oppocareer_www" {
  count   = var.create_route53_zone ? 1 : 0
  zone_id = aws_route53_zone.oppocareer[0].zone_id
  name    = "www.oppocareer.com"
  type    = "CNAME"
  ttl     = 300
  records = ["leluc212.github.io"]
}

resource "aws_route53_record" "oppocareer_mx" {
  count   = var.create_route53_zone ? 1 : 0
  zone_id = aws_route53_zone.oppocareer[0].zone_id
  name    = "oppocareer.com"
  type    = "MX"
  ttl     = 300
  records = ["10 feedback-smtp.ap-southeast-1.amazonses.com"]
}

resource "aws_route53_record" "oppocareer_spf" {
  count   = var.create_route53_zone ? 1 : 0
  zone_id = aws_route53_zone.oppocareer[0].zone_id
  name    = "oppocareer.com"
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com include:spf.nhanhoa.com ~all"]
}

resource "aws_route53_record" "oppocareer_dmarc" {
  count   = var.create_route53_zone ? 1 : 0
  zone_id = aws_route53_zone.oppocareer[0].zone_id
  name    = "_dmarc.oppocareer.com"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=none;"]
}

resource "aws_route53_record" "oppocareer_ses_dkim" {
  for_each = var.create_route53_zone ? toset([
    "ihegwwopl6iyqvu7krxlrdj2gqh2jaz2",
    "yqpem3npmcvznzj762stozwgtmnzbs65",
    "ea4mofakwlic7jifs7yt25fjxitrnc4y"
  ]) : []

  zone_id = aws_route53_zone.oppocareer[0].zone_id
  name    = "${each.key}._domainkey.oppocareer.com"
  type    = "CNAME"
  ttl     = 1800
  records = ["${each.key}.dkim.amazonses.com"]
}

resource "aws_sesv2_email_identity" "domain" {
  email_identity = "oppocareer.com"
}

resource "aws_sesv2_email_identity" "emails" {
  for_each       = var.create_ses_email_identities ? local.ses_email_identities : []
  email_identity = each.key
}

resource "aws_secretsmanager_secret" "legacy" {
  for_each    = local.secret_names
  name        = each.key
  description = each.key == "vnpt-ekyc-credentials" ? "VNPT eKYC Token-Id and Token-Key" : each.key == "prod/didit/api-key" ? "Didit eKYC API Key" : null
}
