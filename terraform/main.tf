terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "OpPoReviewWeb"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Current AWS Account & Region details
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
