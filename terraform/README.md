# Legacy Terraform Stack

Do not run `terraform apply` from this directory for production.

This stack describes the pre-migration resource layout. It contains legacy
API Gateway and Cognito resources that are not used by the current frontend
and can recreate duplicate or incomplete Lambda integrations.

Use `terraform-old-mirror/` as the canonical Terraform configuration for AWS
account `589362963105`. The live frontend endpoints are stored in the root
`.env` and `.env.production` files.
