locals {
  legacy_lambdas = {
    "payments-handler" = {
      runtime = "nodejs24.x", handler = "payments-lambda.handler", timeout = 3, memory = 128, zip = "payments-handler.zip"
    }
    "OpPoExperienceLambda" = {
      runtime = "python3.12", handler = "experience-lambda.lambda_handler", timeout = 30, memory = 256, zip = "OpPoExperienceLambda.zip"
    }
    "TranslateServiceFunction" = {
      runtime = "python3.14", handler = "lambda_function.lambda_handler", timeout = 3, memory = 128, zip = "TranslateServiceFunction.zip"
    }
    "CandidateProfileAPI" = {
      runtime = "nodejs18.x", handler = "api-candidate-profile.handler", timeout = 15, memory = 256, zip = "CandidateProfileAPI.zip"
    }
    "ekyc-handler" = {
      runtime = "python3.11", handler = "didit-ekyc-handler.lambda_handler", timeout = 30, memory = 256, zip = "ekyc-handler.zip"
    }
    "quick-job-handler" = {
      runtime = "python3.11", handler = "quick-job-lambda.lambda_handler", timeout = 30, memory = 256, zip = "quick-job-handler.zip"
    }
    "chat-rest-handler" = {
      runtime = "python3.11", handler = "chat_rest_lambda.lambda_handler", timeout = 15, memory = 256, zip = "chat-rest-handler.zip"
    }
    "OpPoWebPostConfirmation" = {
      runtime = "nodejs18.x", handler = "index.handler", timeout = 15, memory = 128, zip = "OpPoWebPostConfirmation.zip"
    }
    "candidate-profile-api-handler" = {
      runtime = "python3.9", handler = "candidate-api-lambda.lambda_handler", timeout = 30, memory = 128, zip = "candidate-profile-api-handler.zip"
    }
    "cv-ai-handler" = {
      runtime = "python3.11", handler = "handler.lambda_handler", timeout = 30, memory = 256, zip = "cv-ai-handler.zip"
    }
    "JobPostAPI" = {
      runtime = "python3.11", handler = "job-post-lambda.lambda_handler", timeout = 30, memory = 256, zip = "JobPostAPI.zip"
    }
    "package-subscriptions-handler" = {
      runtime = "python3.11", handler = "package-subscriptions-lambda.lambda_handler", timeout = 30, memory = 256, zip = "package-subscriptions-handler.zip"
    }
    "BannerManagementLambda" = {
      runtime = "python3.12", handler = "banner-lambda.handler", timeout = 30, memory = 256, zip = "BannerManagementLambda.zip"
    }
    "CognitoAutoAddUserToGroup" = {
      runtime = "nodejs24.x", handler = "index.handler", timeout = 3, memory = 128, zip = "CognitoAutoAddUserToGroup.zip"
    }
    "ApplicationLambda" = {
      runtime = "python3.14", handler = "application-lambda.lambda_handler", timeout = 30, memory = 256, zip = "ApplicationLambda.zip"
    }
    "candidate-profile-handler" = {
      runtime = "python3.11", handler = "candidate-profile-lambda.lambda_handler", timeout = 30, memory = 128, zip = "candidate-profile-handler.zip"
    }
    "chat-ws-handler" = {
      runtime = "python3.11", handler = "chat_ws_lambda.lambda_handler", timeout = 15, memory = 256, zip = "chat-ws-handler.zip"
    }
    "check-email-provider" = {
      runtime = "nodejs18.x", handler = "check-email-lambda.handler", timeout = 10, memory = 128, zip = "check-email-provider.zip"
    }
    "user-role-handler" = {
      runtime = "python3.14", handler = "lambda_function.lambda_handler", timeout = 3, memory = 128, zip = "user-role-handler.zip"
    }
    "PackageSubscriptionsFunction" = {
      runtime = "python3.11", handler = "package-subscriptions-lambda.lambda_handler", timeout = 30, memory = 256, zip = "PackageSubscriptionsFunction.zip"
    }
    "PreSignUpLinkAccounts" = {
      runtime = "nodejs20.x", handler = "index.handler", timeout = 15, memory = 128, zip = "PreSignUpLinkAccounts.zip"
    }
    "EmployerProfileAPI" = {
      runtime = "nodejs24.x", handler = "api-employer-profile.handler", timeout = 30, memory = 256, zip = "EmployerProfileAPI.zip"
    }
    "notifications-handler" = {
      runtime = "python3.11", handler = "notifications-lambda.lambda_handler", timeout = 30, memory = 256, zip = "notifications-handler.zip"
    }
    "CVUploadFunction" = {
      runtime = "python3.11", handler = "cv-upload-lambda.lambda_handler", timeout = 30, memory = 512, zip = "CVUploadFunction.zip"
    }
  }

}

resource "aws_lambda_function" "legacy" {
  for_each         = local.legacy_lambdas
  function_name    = each.key
  role             = aws_iam_role.lambda_exec.arn
  runtime          = each.value.runtime
  handler          = each.value.handler
  filename         = "${path.module}/../terraform/legacy-lambda-zips/${each.value.zip}"
  source_code_hash = filebase64sha256("${path.module}/../terraform/legacy-lambda-zips/${each.value.zip}")
  timeout          = each.value.timeout
  memory_size      = each.value.memory

  dynamic "environment" {
    for_each = length(lookup(var.lambda_environment, each.key, {})) == 0 ? [] : [lookup(var.lambda_environment, each.key, {})]
    content {
      variables = environment.value
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy.lambda_app_permissions,
    aws_dynamodb_table.legacy
  ]
}

resource "aws_lambda_function" "application_us_east_1" {
  provider         = aws.us_east_1
  function_name    = "ApplicationLambda"
  role             = aws_iam_role.lambda_exec.arn
  runtime          = "python3.9"
  handler          = "application-lambda.lambda_handler"
  filename         = "${path.module}/../terraform/legacy-lambda-zips-us-east-1/ApplicationLambda.zip"
  source_code_hash = filebase64sha256("${path.module}/../terraform/legacy-lambda-zips-us-east-1/ApplicationLambda.zip")
  timeout          = 30
  memory_size      = 256
}

resource "aws_lambda_function_url" "translate_url" {
  function_name      = aws_lambda_function.legacy["TranslateServiceFunction"].function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_headers     = ["*"]
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    max_age           = 86400
  }
}
