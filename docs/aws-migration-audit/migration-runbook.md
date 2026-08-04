# OpPoReview AWS Account Migration Runbook

Source account: `726911960757`
Target account: `589362963105`
Primary region: `ap-southeast-1`
Additional region found: `us-east-1`

## 1. Confirm Profiles

```powershell
aws sts get-caller-identity --profile OLD_PROFILE
aws sts get-caller-identity --profile NEW_PROFILE
```

Expected:

- `OLD_PROFILE` account must be `726911960757`
- `NEW_PROFILE` account must be `589362963105`

## 2. Deploy Mirror Infrastructure

Use the generated mirror Terraform, not the current `terraform/` state-backed directory.

```powershell
cd terraform-old-mirror
terraform init
terraform plan -var-file=terraform.tfvars -out=tfplan
terraform apply tfplan
```

Notes:

- S3 bucket names are global. If old buckets still exist, set `s3_bucket_name_overrides` in `terraform.tfvars`.
- Google Cognito IdP requires `google_client_id` and `google_client_secret`.
- Lambda environment values are intentionally not committed. Provide them through sensitive `lambda_environment` values in a local tfvars file, or copy them after deploy with AWS CLI.
- Secret containers are created, but secret values must be copied separately.

## 3. Copy Secrets Manager Values

Do not commit secret values.

```powershell
$old="OLD_PROFILE"
$new="NEW_PROFILE"
$region="ap-southeast-1"
$secrets=@("vnpt-ekyc-credentials","opporeview/gemini","prod/didit/api-key")

foreach ($s in $secrets) {
  $value = aws secretsmanager get-secret-value --profile $old --region $region --secret-id $s --query SecretString --output text
  aws secretsmanager put-secret-value --profile $new --region $region --secret-id $s --secret-string $value
}
```

## 4. Copy DynamoDB Data

```powershell
python scripts/migrate_dynamodb_data.py --action export --profile OLD_PROFILE --region ap-southeast-1
python scripts/migrate_dynamodb_data.py --action import --profile NEW_PROFILE --region ap-southeast-1
```

The old account also has `us-east-1` table `Applications`.
Export/import that table separately or use DynamoDB Export to S3/Import from S3 for large data.

## 5. Copy S3 Objects

Use different target bucket names if old buckets remain alive.

```powershell
aws s3 sync s3://opporeview-cv-storage s3://TARGET_MEDIA_BUCKET --profile OLD_PROFILE --source-region ap-southeast-1 --region ap-southeast-1
```

Repeat only for buckets you intentionally want to migrate:

- `opporeview-cv-storage`
- `aws-sam-cli-managed-default-samclisourcebucket-qrglrexny0ij`
- `cdk-hnb659fds-assets-726911960757-ap-southeast-1`
- `cloudbank-redteam-6058092e-cloudtrail-logs`
- `cloudbank-redteam-6058092e-synthetic-data`

## 6. Cognito Users

Cognito user passwords and MFA secrets cannot be exported. Migrate users/groups/attributes, then users must reset passwords unless you implement a just-in-time migration flow.

Required old pool:

- pool: `OpPoWebUserPool`
- domain: `opporeview`
- clients: `OpPoWebClient`, `OpPoAppClient`
- groups: `Admin`, `Candidate`, `Employer`, Google generated group
- IdP: `Google`

## 7. SES and DNS

Terraform creates SES identities and the Route53 hosted zone.

After apply:

1. Add SES DKIM/verification records to Route53.
2. Lower TTL before cutover if old DNS is still active.
3. Switch registrar name servers to Terraform output `route53_name_servers`.
4. Verify `oppocareer.com` and email identities in SES.

## 8. Frontend Env Cutover

After `terraform apply`, use outputs to update `.env.production`:

- `VITE_USER_POOL_ID`
- `VITE_USER_POOL_CLIENT_ID`
- `VITE_API_URL`
- `VITE_CANDIDATE_API_URL`
- `VITE_CHECK_EMAIL_API`
- `VITE_EKYC_API_URL`
- `VITE_CV_AI_API_URL`
- `VITE_EMPLOYER_API_URL`
- `VITE_BANNER_API_URL`
- `VITE_PACKAGE_SUBSCRIPTIONS_API`
- `VITE_PAYMENTS_API_URL`
- `VITE_NOTIFICATIONS_API`
- `VITE_EXPERIENCE_API_URL`
- `VITE_S3_BUCKET_NAME`

## 9. Verification

Verify in this order:

1. `terraform output`
2. API health/routes with curl
3. Cognito sign up/sign in/reset password
4. Google OAuth callback
5. S3 upload and public media read
6. SES send test
7. DynamoDB item counts old vs new
8. Admin/employer/candidate workflows
