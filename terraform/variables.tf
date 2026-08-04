variable "aws_region" {
  type        = string
  default     = "ap-southeast-1"
  description = "AWS region for all infrastructure resources."
}

variable "environment" {
  type        = string
  default     = "prod"
  description = "Deployment environment (e.g. prod, staging, dev)."
}

variable "s3_bucket_name" {
  type        = string
  default     = "opporeview-cv-storage-prod-2026"
  description = "Name of the S3 Bucket for media, CVs, banners, and verifications."
}

variable "admin_email" {
  type        = string
  default     = "admin@opporeview.com"
  description = "Default admin email for system notifications."
}

variable "vietqr_bank_id" {
  type        = string
  default     = "MB"
  description = "VietQR default bank ID (e.g. MB, VCB, TCB)."
}

variable "vietqr_account_no" {
  type        = string
  default     = "0123456789"
  description = "VietQR account number."
}

variable "vietqr_account_name" {
  type        = string
  default     = "CONG%20TY%20OP%20PO"
  description = "VietQR account holder name (URL encoded)."
}

variable "didit_api_key" {
  type        = string
  default     = "PLACEHOLDER_DIDIT_API_KEY"
  description = "Didit eKYC API key."
}

variable "didit_workflow_id" {
  type        = string
  default     = "PLACEHOLDER_DIDIT_WORKFLOW_ID"
  description = "Didit eKYC workflow ID."
}

variable "gemini_api_key" {
  type        = string
  default     = "PLACEHOLDER_GEMINI_API_KEY"
  description = "Gemini API key for AI CV Parsing."
}

variable "sepay_webhook_secret" {
  type        = string
  default     = "PLACEHOLDER_SEPAY_SECRET"
  description = "SePay webhook secret."
}
