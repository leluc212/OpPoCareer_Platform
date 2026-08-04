locals {
  legacy_apigatewayv2_apis = {
    package_subscriptions_legacy = { name = "PackageSubscriptionsAPI", protocol = "HTTP", stage = "$default" }
    quick_job_default            = { name = "QuickJobAPI", protocol = "HTTP", stage = "$default" }
    experience                   = { name = "OpPoExperienceAPI", protocol = "HTTP", stage = "prod" }
    quick_job_routes             = { name = "QuickJobAPI", protocol = "HTTP", stage = "$default" }
    package_subscriptions_empty  = { name = "PackageSubscriptionsAPI", protocol = "HTTP", stage = "$default" }
    payments                     = { name = "payments-handler", protocol = "HTTP", stage = "prod" }
    check_email                  = { name = "CheckEmailAPI", protocol = "HTTP", stage = "$default" }
    notifications                = { name = "notifications-api", protocol = "HTTP", stage = "$default" }
    application                  = { name = "ApplicationAPI", protocol = "HTTP", stage = "$default" }
    chat_ws_1                    = { name = "chat-ws-api", protocol = "WEBSOCKET", stage = "prod" }
    package_subscriptions_full   = { name = "PackageSubscriptionsAPI", protocol = "HTTP", stage = "$default" }
    candidate_profile            = { name = "CandidateProfileAPI", protocol = "HTTP", stage = "prod" }
    cv_upload                    = { name = "CVUploadAPI", protocol = "HTTP", stage = "prod" }
    chat_ws_2                    = { name = "chat-ws-api", protocol = "WEBSOCKET", stage = "prod" }
  }

  legacy_apigatewayv2_cors = {
    package_subscriptions_legacy = {
      allow_headers = ["*"]
      allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      allow_origins = ["*"]
    }
    experience = {
      allow_headers = ["content-type", "authorization", "x-amz-date", "x-api-key", "x-amz-security-token"]
      allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      allow_origins = ["*"]
    }
    quick_job_routes = {
      allow_credentials = false
      allow_headers     = ["content-type", "authorization", "x-amz-date", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
      allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
      allow_origins     = ["*"]
      expose_headers    = ["content-type", "x-amz-request-id"]
      max_age           = 3600
    }
    package_subscriptions_empty = {
      allow_headers = ["content-type", "authorization"]
      allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      allow_origins = ["*"]
    }
    payments = {
      allow_credentials = false
      allow_headers     = ["content-type, authorization"]
      allow_methods     = ["GET", "POST", "OPTIONS"]
      allow_origins     = ["*"]
      max_age           = 0
    }
    check_email = {
      allow_headers = ["content-type", "authorization", "accept"]
      allow_methods = ["GET", "POST", "OPTIONS"]
      allow_origins = ["*"]
      max_age       = 3600
    }
    notifications = {
      allow_headers = ["content-type", "authorization", "x-amz-date", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
      allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      allow_origins = ["*"]
      max_age       = 3600
    }
    application = {
      allow_credentials = false
      allow_headers     = ["*", "content-type", "authorization"]
      allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      allow_origins     = ["*"]
      max_age           = 0
    }
    package_subscriptions_full = {
      allow_headers = ["content-type", "authorization"]
      allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      allow_origins = ["*"]
    }
    candidate_profile = {
      allow_credentials = false
      allow_headers     = ["content-type", "authorization", "x-amz-date", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
      allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      allow_origins     = ["*"]
      max_age           = 3600
    }
    cv_upload = {
      allow_credentials = false
      allow_headers     = ["*", "content-type", "authorization"]
      allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      allow_origins     = ["*"]
      max_age           = 0
    }
  }

  legacy_apigatewayv2_integrations = {
    package_subscriptions_legacy_packages_fn = { api = "package_subscriptions_legacy", lambda = "PackageSubscriptionsFunction" }
    quick_job_default_fn                     = { api = "quick_job_default", lambda = "quick-job-handler" }
    experience_fn                            = { api = "experience", lambda = "OpPoExperienceLambda" }
    quick_job_routes_fn                      = { api = "quick_job_routes", lambda = "quick-job-handler" }
    payments_fn                              = { api = "payments", lambda = "payments-handler" }
    check_email_fn                           = { api = "check_email", lambda = "check-email-provider" }
    notifications_fn                         = { api = "notifications", lambda = "notifications-handler" }
    application_fn                           = { api = "application", lambda = "ApplicationLambda" }
    application_user_role_fn                 = { api = "application", lambda = "user-role-handler" }
    chat_ws_1_fn                             = { api = "chat_ws_1", lambda = "chat-ws-handler" }
    package_subscriptions_full_fn            = { api = "package_subscriptions_full", lambda = "package-subscriptions-handler" }
    candidate_profile_api_fn                 = { api = "candidate_profile", lambda = "candidate-profile-api-handler" }
    candidate_profile_handler_fn             = { api = "candidate_profile", lambda = "candidate-profile-handler" }
    candidate_profile_ekyc_fn                = { api = "candidate_profile", lambda = "ekyc-handler" }
    candidate_profile_cv_ai_fn               = { api = "candidate_profile", lambda = "cv-ai-handler" }
    candidate_profile_check_email_fn         = { api = "candidate_profile", lambda = "check-email-provider" }
    cv_upload_fn                             = { api = "cv_upload", lambda = "CVUploadFunction" }
    chat_ws_2_fn                             = { api = "chat_ws_2", lambda = "chat-ws-handler" }
  }

  legacy_apigatewayv2_routes = merge(
    { for r in ["PUT /subscriptions/{subscriptionId}", "GET /subscriptions/employer/{employerId}", "GET /subscriptions", "POST /subscriptions", "DELETE /subscriptions/{subscriptionId}"] : "package_subscriptions_legacy_${r}" => { api = "package_subscriptions_legacy", route = r, integration = "package_subscriptions_legacy_packages_fn" } },
    { "$default_quick_job_default" = { api = "quick_job_default", route = "$default", integration = "quick_job_default_fn" } },
    { for r in ["PUT /admin/experiences/{id}/approve", "GET /admin/experiences/{id}", "PUT /admin/experiences/{id}/reject", "GET /admin/experiences", "POST /candidate/experience", "GET /candidate/experience", "GET /employer/candidate/{candidateId}/experience"] : "experience_${r}" => { api = "experience", route = r, integration = "experience_fn" } },
    { for r in ["GET /quick-jobs/{idJob}", "GET /quick-jobs/active", "POST /quick-jobs/{idJob}/views", "OPTIONS /{proxy+}", "DELETE /quick-jobs/{idJob}", "PUT /quick-jobs/{idJob}", "POST /quick-jobs", "GET /quick-jobs/employer/{employerId}", "$default"] : "quick_job_routes_${r}" => { api = "quick_job_routes", route = r, integration = "quick_job_routes_fn" } },
    { for r in ["POST /payments", "GET /payments/{paymentId}", "POST /payment/webhook"] : "payments_${r}" => { api = "payments", route = r, integration = "payments_fn" } },
    { for r in ["POST /auth/google-otp/verify", "GET /auth/check-email", "POST /auth/google-otp/request"] : "check_email_${r}" => { api = "check_email", route = r, integration = "check_email_fn" } },
    { for r in ["PATCH /candidate/notifications/{notificationId}/read", "PUT /notifications/{notificationId}", "GET /notifications", "PATCH /candidate/notifications/read-all", "GET /notifications/user/{userId}", "GET /notifications/{notificationId}", "GET /notifications/unread/{userId}", "POST /notifications", "PUT /notifications/mark-all-read/{userId}", "PATCH /candidate/notifications/{notificationId}/archive", "GET /candidate/notifications", "DELETE /notifications/{notificationId}"] : "notifications_${r}" => { api = "notifications", route = r, integration = "notifications_fn" } },
    {
      "application_POST /applications"                               = { api = "application", route = "POST /applications", integration = "application_fn" }
      "application_PUT /applications/{applicationId}/approve-change" = { api = "application", route = "PUT /applications/{applicationId}/approve-change", integration = "application_fn" }
      "application_ANY /default"                                     = { api = "application", route = "ANY /default", integration = "application_fn" }
      "application_PUT /applications/{applicationId}/reject-change"  = { api = "application", route = "PUT /applications/{applicationId}/reject-change", integration = "application_fn" }
      "application_OPTIONS /applications"                            = { api = "application", route = "OPTIONS /applications", integration = "application_fn" }
      "application_POST /users/me/role"                              = { api = "application", route = "POST /users/me/role", integration = "application_user_role_fn" }
      "application_GET /applications"                                = { api = "application", route = "GET /applications", integration = "application_fn" }
      "application_PUT /applications/{applicationId}/status"         = { api = "application", route = "PUT /applications/{applicationId}/status", integration = "application_fn" }
      "application_GET /applications/change-requests"                = { api = "application", route = "GET /applications/change-requests", integration = "application_fn" }
      "application_OPTIONS /users/me/role"                           = { api = "application", route = "OPTIONS /users/me/role", integration = "application_user_role_fn" }
      "application_GET /applications/candidate/{candidateId}"        = { api = "application", route = "GET /applications/candidate/{candidateId}", integration = "application_fn" }
      "application_GET /applications/available-workers/{jobId}"      = { api = "application", route = "GET /applications/available-workers/{jobId}", integration = "application_fn" }
      "application_GET /applications/job/{jobId}"                    = { api = "application", route = "GET /applications/job/{jobId}", integration = "application_fn" }
    },
    { for r in ["$disconnect", "message", "$connect", "sendMessage", "$default"] : "chat_ws_1_${r}" => { api = "chat_ws_1", route = r, integration = "chat_ws_1_fn" } },
    { for r in ["GET /subscriptions", "PUT /subscriptions/{subscriptionId}", "DELETE /subscriptions/{subscriptionId}", "PUT /wallet/withdrawals/{requestId}", "GET /wallet/{employerId}", "PUT /packages/{packageId}", "GET /packages", "OPTIONS /wallet/withdrawals/{requestId}", "POST /wallet/withdraw", "OPTIONS /wallet/withdrawals", "POST /wallet/sepay-webhook", "POST /wallet/transaction", "GET /wallet/withdrawals", "GET /subscriptions/{subscriptionId}", "GET /subscriptions/employer/{employerId}", "POST /subscriptions"] : "package_subscriptions_full_${r}" => { api = "package_subscriptions_full", route = r, integration = "package_subscriptions_full_fn" } },
    { for r in ["POST /admin/candidate-verifications/{id}/approve", "OPTIONS /admin/candidate-verifications", "PUT /feedback/{id}", "POST /feedback", "POST /admin/candidate-verifications/{id}/reject", "GET /feedback", "OPTIONS /feedback/{id}", "OPTIONS /admin/candidate-verifications/{id}/reject", "OPTIONS /candidate/verification-request", "OPTIONS /admin/candidate-verifications/{id}/approve", "POST /profile", "PUT /profile/{userId}", "DELETE /feedback/{id}", "GET /admin/candidate-verifications", "DELETE /profile/{userId}", "POST /candidate/verification-request", "GET /feedback/{id}", "GET /profile/{userId}", "OPTIONS /feedback"] : "candidate_handler_${r}" => { api = "candidate_profile", route = r, integration = "candidate_profile_handler_fn" } },
    { for r in ["GET /candidates", "ANY /default", "OPTIONS /candidates"] : "candidate_api_${r}" => { api = "candidate_profile", route = r, integration = "candidate_profile_api_fn" } },
    { for r in ["POST /ekyc/webhook/didit", "GET /ekyc/status/{userId}", "POST /ekyc/verify-face", "POST /ekyc/session", "POST /ekyc/ocr"] : "candidate_ekyc_${r}" => { api = "candidate_profile", route = r, integration = "candidate_profile_ekyc_fn" } },
    { for r in ["POST /api/v1/interview/start", "POST /job/parse-jd", "POST /api/v1/cv/screen", "OPTIONS /cv/analyze", "POST /api/v1/interview/audio-upload-url", "OPTIONS /candidate/recommend-jobs", "OPTIONS /api/v1/interview/respond", "POST /cv/analyze", "POST /candidate/recommend-jobs", "OPTIONS /job/suggest-jd", "POST /api/v1/interview/upload-audio", "POST /job/suggest-jd", "OPTIONS /cv/generate", "OPTIONS /api/v1/interview/upload-audio", "GET /health", "OPTIONS /api/v1/interview/media", "OPTIONS /api/v1/cv/screen", "OPTIONS /api/v1/interview/start", "POST /cv/generate", "POST /cv/recommend-candidates", "POST /api/v1/interview/media", "POST /api/v1/interview/respond", "OPTIONS /api/v1/interview/audio-upload-url", "OPTIONS /job/parse-jd", "OPTIONS /cv/recommend-candidates"] : "candidate_cv_ai_${r}" => { api = "candidate_profile", route = r, integration = "candidate_profile_cv_ai_fn" } },
    { for r in ["OPTIONS /auth/check-email", "GET /auth/check-email"] : "candidate_check_email_${r}" => { api = "candidate_profile", route = r, integration = "candidate_profile_check_email_fn" } },
    { for r in ["DELETE /cv/{userId}", "POST /cv/upload", "DELETE /cv/{userId}/{cvId}", "GET /cv/{userId}"] : "cv_upload_${r}" => { api = "cv_upload", route = r, integration = "cv_upload_fn" } },
    { for r in ["$connect", "sendMessage", "$default", "message", "$disconnect"] : "chat_ws_2_${r}" => { api = "chat_ws_2", route = r, integration = "chat_ws_2_fn" } }
  )
}

resource "aws_apigatewayv2_api" "legacy" {
  for_each                   = local.legacy_apigatewayv2_apis
  name                       = each.value.name
  protocol_type              = each.value.protocol
  route_selection_expression = each.value.protocol == "WEBSOCKET" ? "$request.body.action" : "$request.method $request.path"

  dynamic "cors_configuration" {
    for_each = contains(keys(local.legacy_apigatewayv2_cors), each.key) ? [local.legacy_apigatewayv2_cors[each.key]] : []
    content {
      allow_credentials = try(cors_configuration.value.allow_credentials, null)
      allow_headers     = try(cors_configuration.value.allow_headers, null)
      allow_methods     = try(cors_configuration.value.allow_methods, null)
      allow_origins     = try(cors_configuration.value.allow_origins, null)
      expose_headers    = try(cors_configuration.value.expose_headers, null)
      max_age           = try(cors_configuration.value.max_age, null)
    }
  }
}

resource "aws_apigatewayv2_integration" "legacy" {
  for_each               = local.legacy_apigatewayv2_integrations
  api_id                 = aws_apigatewayv2_api.legacy[each.value.api].id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.legacy[each.value.lambda].invoke_arn
  payload_format_version = local.legacy_apigatewayv2_apis[each.value.api].protocol == "HTTP" ? "2.0" : null
}

resource "aws_apigatewayv2_route" "legacy" {
  for_each  = local.legacy_apigatewayv2_routes
  api_id    = aws_apigatewayv2_api.legacy[each.value.api].id
  route_key = each.value.route
  target    = "integrations/${aws_apigatewayv2_integration.legacy[each.value.integration].id}"
}

resource "aws_apigatewayv2_stage" "legacy" {
  for_each    = local.legacy_apigatewayv2_apis
  api_id      = aws_apigatewayv2_api.legacy[each.key].id
  name        = each.value.stage
  auto_deploy = true
}

resource "aws_lambda_permission" "apigatewayv2" {
  for_each      = local.legacy_apigatewayv2_integrations
  statement_id  = "AllowAPIGatewayV2-${substr(md5(each.key), 0, 12)}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.legacy[each.value.lambda].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.legacy[each.value.api].execution_arn}/*/*"
}
