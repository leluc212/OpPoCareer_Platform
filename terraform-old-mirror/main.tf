terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
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
      Migration   = "old-account-mirror"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "OpPoReviewWeb"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Migration   = "old-account-mirror"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
