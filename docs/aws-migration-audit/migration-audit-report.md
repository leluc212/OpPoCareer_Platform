# AWS Migration Audit: old account vs Terraform

- Old account: `726911960757` via profile `default` at audit time
- Target/new account: `589362963105` (profile not available during this audit)
- Primary region: `ap-southeast-1`; additional app resource found in `us-east-1`
- Secret values were not exported; only secret names/metadata and Lambda env var keys were captured.

## Summary
- DynamoDB tables: old=20, terraform=20, missing_in_terraform=3, extra_in_terraform=3
- Lambda functions: old=24, terraform=24, missing_in_terraform=21, extra_in_terraform=21
- API Gateway REST APIs: old=5, terraform=7, missing_in_terraform=3, extra_in_terraform=6
- API Gateway v2 APIs: old=14, terraform=1, missing_in_terraform=10, extra_in_terraform=1
- Cognito user pools: old=1, terraform=1, missing_in_terraform=1, extra_in_terraform=1
- S3 buckets: old=5, terraform=1, missing_in_terraform=5, extra_in_terraform=1
- SES identities in old: 3; Terraform coverage: 0
- Secrets Manager secrets in old: 3; Terraform coverage currently bypassed
- SSM parameters in old: 1
- Route53 hosted zones in old: 1
- CloudFormation stacks in old: 3
- Amplify apps in old: 2
- CloudFront distributions in old: 0

## DynamoDB tables

Missing in Terraform compared with old account:
- `OpPoWebTable`
- `OppoAuthOtp`
- `WithdrawalRequests`

Present in Terraform but not found in old account:
- `AdminWebSocketConnections`
- `Payments`
- `Users`

## Lambda functions

Missing in Terraform compared with old account:
- `CVUploadFunction`
- `CandidateProfileAPI`
- `CognitoAutoAddUserToGroup`
- `EmployerProfileAPI`
- `JobPostAPI`
- `OpPoExperienceLambda`
- `OpPoWebPostConfirmation`
- `PackageSubscriptionsFunction`
- `PreSignUpLinkAccounts`
- `TranslateServiceFunction`
- `candidate-profile-api-handler`
- `candidate-profile-handler`
- `chat-rest-handler`
- `chat-ws-handler`
- `check-email-provider`
- `cv-ai-handler`
- `notifications-handler`
- `package-subscriptions-handler`
- `payments-handler`
- `quick-job-handler`
- `user-role-handler`

Present in Terraform but not found in old account:
- `ApplicantsReportLambda`
- `CandidateProfileLambda`
- `CheckEmailLambda`
- `CvAiLambda`
- `CvUploadLambda`
- `DiditEkycLambda`
- `EmployerProfileLambda`
- `ExperienceLambda`
- `FeaturedPercentLambda`
- `JobPostLambda`
- `NotificationsLambda`
- `PackageSubscriptionsLambda`
- `PaymentsLambda`
- `PostConfirmationLambda`
- `PreSignupLinkAccountsLambda`
- `QuickJobLambda`
- `TranslateLambda`
- `UserRoleLambda`
- `ws-admin-connect`
- `ws-admin-disconnect`
- `ws-admin-stream-broadcast`

## API Gateway REST APIs

Missing in Terraform compared with old account:
- `CandidateProfileAPI`
- `EmployerProfileAPI`
- `chat-rest-api`

Present in Terraform but not found in old account:
- `CandidateAPI`
- `EmployerAPI`
- `ExperienceAPI`
- `NotificationsAPI`
- `PackageSubscriptionsAPI`
- `PaymentsAPI`

## API Gateway v2 APIs

Missing in Terraform compared with old account:
- `ApplicationAPI`
- `CVUploadAPI`
- `CandidateProfileAPI`
- `CheckEmailAPI`
- `OpPoExperienceAPI`
- `PackageSubscriptionsAPI`
- `QuickJobAPI`
- `chat-ws-api`
- `notifications-api`
- `payments-handler`

Present in Terraform but not found in old account:
- `admin-ws-api`

## Cognito user pools

Missing in Terraform compared with old account:
- `OpPoWebUserPool`

Present in Terraform but not found in old account:
- `opporeview-user-pool-prod`

## S3 buckets

Missing in Terraform compared with old account:
- `aws-sam-cli-managed-default-samclisourcebucket-qrglrexny0ij`
- `cdk-hnb659fds-assets-726911960757-ap-southeast-1`
- `cloudbank-redteam-6058092e-cloudtrail-logs`
- `cloudbank-redteam-6058092e-synthetic-data`
- `opporeview-cv-storage`

Present in Terraform but not found in old account:
- `opporeview-cv-storage-prod-2026`

## Old Account Non-Terraform Services

SES identities:
- `oppocareer.com`
- `lucltse184288@fpt.edu.vn`
- `Duypl2310@gmail.com`

Secrets Manager secret names:
- `vnpt-ekyc-credentials`
- `opporeview/gemini`
- `prod/didit/api-key`

SSM parameter names:
- `/cdk-bootstrap/hnb659fds/version`

Route53 hosted zones:
- `oppocareer.com.`

S3 buckets in old account:
- `aws-sam-cli-managed-default-samclisourcebucket-qrglrexny0ij`
- `cdk-hnb659fds-assets-726911960757-ap-southeast-1`
- `cloudbank-redteam-6058092e-cloudtrail-logs`
- `cloudbank-redteam-6058092e-synthetic-data`
- `opporeview-cv-storage`

CloudFormation stacks:
- `AgentCore-CustomerSupport-default` (UPDATE_COMPLETE)
- `aws-sam-cli-managed-default` (CREATE_COMPLETE)
- `CDKToolkit` (CREATE_COMPLETE)

Amplify apps:
- `OpPoReview` appId=`d23rg33wnu67ml` domain=`d23rg33wnu67ml.amplifyapp.com`
- `OpPoWebsite` appId=`dc4mu49yh0m8` domain=`dc4mu49yh0m8.amplifyapp.com`

CloudFront distributions:
- None

## Extra Region Findings

- `us-east-1`: DynamoDB `Applications`, Lambda `ApplicationLambda`, HTTP API `ApplicationAPI`. These are not represented by the current single-region Terraform provider.