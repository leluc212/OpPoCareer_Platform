# ─────────────────────────────────────────────────────────────────────────────
# Lambda Functions & Archive Definitions
# ─────────────────────────────────────────────────────────────────────────────

# Archive data sources
data "archive_file" "application_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/application-lambda.py"
  output_path = "${path.module}/build/application-lambda.zip"
}

data "archive_file" "applicants_report_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/applicants-report-lambda.py"
  output_path = "${path.module}/build/applicants-report-lambda.zip"
}

data "archive_file" "banner_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/banner-lambda.py"
  output_path = "${path.module}/build/banner-lambda.zip"
}

data "archive_file" "candidate_profile_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/candidate-profile-lambda.py"
  output_path = "${path.module}/build/candidate-profile-lambda.zip"
}

data "archive_file" "employer_profile_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../amplify/backend/lambda-deployment"
  excludes    = ["node_modules", "node_modules/**", "package-lock.json"]
  output_path = "${path.module}/build/employer-profile-lambda.zip"
}

data "archive_file" "check_email_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/check-email-lambda.js"
  output_path = "${path.module}/build/check-email-lambda.zip"
}

data "archive_file" "cv_ai_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/cv-ai/handler.py"
  output_path = "${path.module}/build/cv-ai-lambda.zip"
}

data "archive_file" "didit_ekyc_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/didit-ekyc-handler.py"
  output_path = "${path.module}/build/didit-ekyc-lambda.zip"
}

data "archive_file" "experience_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/experience-lambda.py"
  output_path = "${path.module}/build/experience-lambda.zip"
}

data "archive_file" "job_post_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/job-post-lambda.py"
  output_path = "${path.module}/build/job-post-lambda.zip"
}

data "archive_file" "notifications_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/notifications-lambda.py"
  output_path = "${path.module}/build/notifications-lambda.zip"
}

data "archive_file" "package_subscriptions_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/package-subscriptions-lambda.py"
  output_path = "${path.module}/build/package-subscriptions-lambda.zip"
}

data "archive_file" "payments_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/payments-lambda.js"
  output_path = "${path.module}/build/payments-lambda.zip"
}

data "archive_file" "quick_job_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/quick-job-lambda.py"
  output_path = "${path.module}/build/quick-job-lambda.zip"
}

data "archive_file" "translate_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/translate-lambda.py"
  output_path = "${path.module}/build/translate-lambda.zip"
}

data "archive_file" "pre_signup_zip" {
  type        = "zip"
  source_file = "${path.module}/../infra/lambda/pre-signup-link-accounts/index.js"
  output_path = "${path.module}/build/pre-signup-link-accounts.zip"
}

data "archive_file" "post_confirmation_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/postConfirmation/index.js"
  output_path = "${path.module}/build/postConfirmation.zip"
}

data "archive_file" "ws_connect_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/websocket-connect-lambda.py"
  output_path = "${path.module}/build/ws-connect.zip"
}

data "archive_file" "ws_disconnect_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/websocket-disconnect-lambda.py"
  output_path = "${path.module}/build/ws-disconnect.zip"
}

data "archive_file" "ws_broadcast_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/websocket-stream-broadcast-lambda.py"
  output_path = "${path.module}/build/ws-broadcast.zip"
}

data "archive_file" "cv_upload_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/cv-upload-lambda.py"
  output_path = "${path.module}/build/cv-upload-lambda.zip"
}

data "archive_file" "featured_percent_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/featured-percent-lambda.py"
  output_path = "${path.module}/build/featured-percent-lambda.zip"
}

data "archive_file" "user_role_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/user-role-lambda.py"
  output_path = "${path.module}/build/user-role-lambda.zip"
}

data "archive_file" "ekyc_legacy_zip" {
  type        = "zip"
  source_file = "${path.module}/../amplify/backend/ekyc-handler.py"
  output_path = "${path.module}/build/ekyc-legacy-lambda.zip"
}

# ─────────────────────────────────────────────────────────────────────────────
# Lambda Function Resources
# ─────────────────────────────────────────────────────────────────────────────

# 1. Application Lambda
resource "aws_lambda_function" "application" {
  function_name    = "ApplicationLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "application-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.application_zip.output_path
  source_code_hash = data.archive_file.application_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      APPLICATIONS_TABLE   = aws_dynamodb_table.standard_applications.name
      JOBS_TABLE           = aws_dynamodb_table.post_standard_job.name
      QUICK_JOBS_TABLE     = aws_dynamodb_table.post_quick_job.name
      CANDIDATES_TABLE     = aws_dynamodb_table.candidate_profiles.name
      EMPLOYERS_TABLE      = aws_dynamodb_table.employer_profiles.name
      COMPLETED_JOBS_TABLE = aws_dynamodb_table.completed_jobs.name
    }
  }
}

# 2. Applicants Report Lambda
resource "aws_lambda_function" "applicants_report" {
  function_name    = "ApplicantsReportLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "applicants-report-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.applicants_report_zip.output_path
  source_code_hash = data.archive_file.applicants_report_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      CANDIDATES_TABLE   = aws_dynamodb_table.candidate_profiles.name
      JOBS_TABLE         = aws_dynamodb_table.post_standard_job.name
      QUICK_JOBS_TABLE   = aws_dynamodb_table.post_quick_job.name
      APPLICATIONS_TABLE = aws_dynamodb_table.standard_applications.name
    }
  }
}

# 3. Banner Management Lambda
resource "aws_lambda_function" "banner" {
  function_name    = "BannerManagementLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "banner-lambda.handler"
  runtime          = "python3.12"
  filename         = data.archive_file.banner_zip.output_path
  source_code_hash = data.archive_file.banner_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      BANNERS_TABLE      = aws_dynamodb_table.banners.name
      S3_BUCKET          = aws_s3_bucket.media_storage.id
      S3_REGION          = var.aws_region
      MAX_ACTIVE_BANNERS = "5"
    }
  }
}

# 4. Candidate Profile Lambda
resource "aws_lambda_function" "candidate_profile" {
  function_name    = "CandidateProfileLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "candidate-profile-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.candidate_profile_zip.output_path
  source_code_hash = data.archive_file.candidate_profile_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      TABLE_NAME      = aws_dynamodb_table.candidate_profiles.name
      FEEDBACKS_TABLE = aws_dynamodb_table.feedbacks.name
    }
  }
}

# 5. Employer Profile Lambda
resource "aws_lambda_function" "employer_profile" {
  function_name    = "EmployerProfileLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "api-employer-profile.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.employer_profile_zip.output_path
  source_code_hash = data.archive_file.employer_profile_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      EMPLOYERS_TABLE     = aws_dynamodb_table.employer_profiles.name
      QUICK_JOBS_TABLE    = aws_dynamodb_table.post_quick_job.name
      STANDARD_JOBS_TABLE = aws_dynamodb_table.post_standard_job.name
    }
  }
}

# 6. Check Email Lambda
resource "aws_lambda_function" "check_email" {
  function_name    = "CheckEmailLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "check-email-lambda.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.check_email_zip.output_path
  source_code_hash = data.archive_file.check_email_zip.output_base64sha256
  timeout          = 15
  memory_size      = 128

  environment {
    variables = {
      USERS_TABLE_NAME     = aws_dynamodb_table.users.name
      COGNITO_USER_POOL_ID = aws_cognito_user_pool.user_pool.id
    }
  }
}

# 7. Cv Ai Lambda
resource "aws_lambda_function" "cv_ai" {
  function_name    = "CvAiLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.cv_ai_zip.output_path
  source_code_hash = data.archive_file.cv_ai_zip.output_base64sha256
  timeout          = 60
  memory_size      = 512

  environment {
    variables = {
      CANDIDATES_TABLE    = aws_dynamodb_table.candidate_profiles.name
      STANDARD_JOBS_TABLE = aws_dynamodb_table.post_standard_job.name
      QUICK_JOBS_TABLE    = aws_dynamodb_table.post_quick_job.name
      GEMINI_API_KEY      = var.gemini_api_key
    }
  }
}

# 8. Didit eKYC Lambda
resource "aws_lambda_function" "didit_ekyc" {
  function_name    = "DiditEkycLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "didit-ekyc-handler.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.didit_ekyc_zip.output_path
  source_code_hash = data.archive_file.didit_ekyc_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      DIDIT_API_KEY     = var.didit_api_key
      DIDIT_WORKFLOW_ID = var.didit_workflow_id
      CANDIDATES_TABLE  = aws_dynamodb_table.candidate_profiles.name
      S3_BUCKET         = aws_s3_bucket.media_storage.id
    }
  }
}

# 9. Experience Lambda
resource "aws_lambda_function" "experience" {
  function_name    = "ExperienceLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "experience-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.experience_zip.output_path
  source_code_hash = data.archive_file.experience_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      EXPERIENCE_TABLE = aws_dynamodb_table.candidate_experiences.name
    }
  }
}

# 10. Job Post Lambda
resource "aws_lambda_function" "job_post" {
  function_name    = "JobPostLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "job-post-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.job_post_zip.output_path
  source_code_hash = data.archive_file.job_post_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      JOBS_TABLE          = aws_dynamodb_table.post_standard_job.name
      SUBSCRIPTIONS_TABLE = aws_dynamodb_table.package_subscriptions.name
      APPLICATIONS_TABLE  = aws_dynamodb_table.standard_applications.name
      EMPLOYERS_TABLE     = aws_dynamodb_table.employer_profiles.name
    }
  }
}

# 11. Notifications Lambda
resource "aws_lambda_function" "notifications" {
  function_name    = "NotificationsLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "notifications-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.notifications_zip.output_path
  source_code_hash = data.archive_file.notifications_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      NOTIFICATIONS_TABLE = aws_dynamodb_table.notifications.name
    }
  }
}

# 12. Package Subscriptions Lambda
resource "aws_lambda_function" "package_subscriptions" {
  function_name    = "PackageSubscriptionsLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "package-subscriptions-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.package_subscriptions_zip.output_path
  source_code_hash = data.archive_file.package_subscriptions_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      TABLE_NAME            = aws_dynamodb_table.package_subscriptions.name
      PACKAGE_CATALOG_TABLE = aws_dynamodb_table.package_catalog.name
      NOTIFICATIONS_TABLE   = aws_dynamodb_table.notifications.name
      EMPLOYERS_TABLE       = aws_dynamodb_table.employer_profiles.name
      ADMIN_EMAIL           = var.admin_email
    }
  }
}

# 13. Payments Lambda
resource "aws_lambda_function" "payments" {
  function_name    = "PaymentsLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "payments-lambda.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.payments_zip.output_path
  source_code_hash = data.archive_file.payments_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      PAYMENTS_TABLE       = aws_dynamodb_table.payments.name
      EMPLOYERS_TABLE      = aws_dynamodb_table.employer_profiles.name
      USER_PACKAGES_TABLE  = aws_dynamodb_table.package_subscriptions.name
      VIETQR_BANK_ID       = var.vietqr_bank_id
      VIETQR_ACCOUNT_NO    = var.vietqr_account_no
      VIETQR_ACCOUNT_NAME  = var.vietqr_account_name
      SEPAY_WEBHOOK_SECRET = var.sepay_webhook_secret
    }
  }
}

# 14. Quick Job Lambda
resource "aws_lambda_function" "quick_job" {
  function_name    = "QuickJobLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "quick-job-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.quick_job_zip.output_path
  source_code_hash = data.archive_file.quick_job_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      QUICK_JOBS_TABLE    = aws_dynamodb_table.post_quick_job.name
      SUBSCRIPTIONS_TABLE = aws_dynamodb_table.package_subscriptions.name
      EMPLOYERS_TABLE     = aws_dynamodb_table.employer_profiles.name
    }
  }
}

# 15. Translate Lambda (Function URL enabled)
resource "aws_lambda_function" "translate" {
  function_name    = "TranslateLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "translate-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.translate_zip.output_path
  source_code_hash = data.archive_file.translate_zip.output_base64sha256
  timeout          = 15
  memory_size      = 128

  environment {
    variables = {
      TRANSLATIONS_TABLE = aws_dynamodb_table.translations.name
    }
  }
}

resource "aws_lambda_function_url" "translate_url" {
  function_name      = aws_lambda_function.translate.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_headers     = ["*"]
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    max_age           = 86400
  }
}

# 16. Pre-SignUp Link Accounts Lambda
resource "aws_lambda_function" "pre_signup_link_accounts" {
  function_name    = "PreSignupLinkAccountsLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.pre_signup_zip.output_path
  source_code_hash = data.archive_file.pre_signup_zip.output_base64sha256
  timeout          = 15
  memory_size      = 128
}

# 17. Post-Confirmation Lambda
resource "aws_lambda_function" "post_confirmation" {
  function_name    = "PostConfirmationLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.post_confirmation_zip.output_path
  source_code_hash = data.archive_file.post_confirmation_zip.output_base64sha256
  timeout          = 15
  memory_size      = 128

  environment {
    variables = {
      USERS_TABLE_NAME = aws_dynamodb_table.users.name
    }
  }
}

# 18. WebSocket Admin Connect Lambda
resource "aws_lambda_function" "ws_admin_connect" {
  function_name    = "ws-admin-connect"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "websocket-connect-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.ws_connect_zip.output_path
  source_code_hash = data.archive_file.ws_connect_zip.output_base64sha256
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.admin_websocket_connections.name
    }
  }
}

# 19. WebSocket Admin Disconnect Lambda
resource "aws_lambda_function" "ws_admin_disconnect" {
  function_name    = "ws-admin-disconnect"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "websocket-disconnect-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.ws_disconnect_zip.output_path
  source_code_hash = data.archive_file.ws_disconnect_zip.output_base64sha256
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.admin_websocket_connections.name
    }
  }
}

# 20. WebSocket Admin Stream Broadcast Lambda
resource "aws_lambda_function" "ws_admin_stream_broadcast" {
  function_name    = "ws-admin-stream-broadcast"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "websocket-stream-broadcast-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.ws_broadcast_zip.output_path
  source_code_hash = data.archive_file.ws_broadcast_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.admin_websocket_connections.name
      WS_API_ENDPOINT   = "https://${aws_apigatewayv2_api.admin_ws_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_apigatewayv2_stage.admin_ws_stage.name}"
    }
  }
}

# Event Source Mapping: StandardApplications DynamoDB Stream -> ws-admin-stream-broadcast Lambda
resource "aws_lambda_event_source_mapping" "applications_stream_trigger" {
  event_source_arn  = aws_dynamodb_table.standard_applications.stream_arn
  function_name     = aws_lambda_function.ws_admin_stream_broadcast.arn
  starting_position = "LATEST"
  batch_size        = 10
}

# 21. Cv Upload Lambda
resource "aws_lambda_function" "cv_upload" {
  function_name    = "CvUploadLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "cv-upload-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.cv_upload_zip.output_path
  source_code_hash = data.archive_file.cv_upload_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.media_storage.id
    }
  }
}

# 22. Featured Percent Lambda
resource "aws_lambda_function" "featured_percent" {
  function_name    = "FeaturedPercentLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "featured-percent-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.featured_percent_zip.output_path
  source_code_hash = data.archive_file.featured_percent_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256
}

# 23. User Role Lambda
resource "aws_lambda_function" "user_role" {
  function_name    = "UserRoleLambda"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "user-role-lambda.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.user_role_zip.output_path
  source_code_hash = data.archive_file.user_role_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      USER_POOL_ID = aws_cognito_user_pool.user_pool.id
    }
  }
}

# 24. Legacy Ekyc Handler Lambda
resource "aws_lambda_function" "ekyc_legacy" {
  function_name    = "ekyc-handler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "ekyc-handler.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.ekyc_legacy_zip.output_path
  source_code_hash = data.archive_file.ekyc_legacy_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256
}
