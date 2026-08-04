variable "aws_region" {
  type        = string
  default     = "ap-southeast-1"
  description = "Primary region from the old account inventory."
}

variable "environment" {
  type        = string
  default     = "prod"
  description = "Deployment environment."
}

variable "s3_bucket_name_overrides" {
  type        = map(string)
  default     = {}
  description = "Optional target-account bucket names. S3 names are global, so old names cannot be reused until old buckets are deleted."
}

variable "lambda_environment" {
  type        = map(map(string))
  default     = {}
  sensitive   = true
  description = "Exact Lambda environment variable values keyed by function name. Keep this out of git."
}

variable "google_client_id" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Google OAuth client ID for Cognito IdP."
}

variable "google_client_secret" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Google OAuth client secret for Cognito IdP."
}

variable "create_route53_zone" {
  type        = bool
  default     = true
  description = "Create oppocareer.com hosted zone in target account."
}

variable "create_ses_email_identities" {
  type        = bool
  default     = true
  description = "Create SES email identities from the old account inventory."
}

variable "enable_cognito_domain" {
  type        = bool
  default     = false
  description = "Create the Cognito hosted UI prefix after it is released from the old account."
}
