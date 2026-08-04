# ─────────────────────────────────────────────────────────────────────────────
# REST API Gateways with Explicit Subpath Routing & CORS Support (No Greedy Root Proxy)
# ─────────────────────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────────────────────
# 1. Candidate API (Candidate, Auth, Check Email, eKYC, CV Upload, CV AI, User Role)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_api_gateway_rest_api" "candidate_api" {
  name        = "CandidateAPI"
  description = "Candidate, eKYC, Check Email, CV AI & User Role REST API"
}

# Root / -> CandidateProfileLambda
resource "aws_api_gateway_method" "candidate_root_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_rest_api.candidate_api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_root_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_rest_api.candidate_api.root_resource_id
  http_method             = aws_api_gateway_method.candidate_root_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.candidate_profile.invoke_arn
}

# Subpath /candidate & /candidate/{proxy+} -> CandidateProfileLambda
resource "aws_api_gateway_resource" "candidate_candidate" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_rest_api.candidate_api.root_resource_id
  path_part   = "candidate"
}

resource "aws_api_gateway_method" "candidate_candidate_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_candidate.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_candidate_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_candidate.id
  http_method             = aws_api_gateway_method.candidate_candidate_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.candidate_profile.invoke_arn
}

resource "aws_api_gateway_resource" "candidate_candidate_proxy" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_resource.candidate_candidate.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "candidate_candidate_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_candidate_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_candidate_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_candidate_proxy.id
  http_method             = aws_api_gateway_method.candidate_candidate_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.candidate_profile.invoke_arn
}

# Subpath /profile & /profile/{proxy+} -> CandidateProfileLambda
resource "aws_api_gateway_resource" "candidate_profile_res" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_rest_api.candidate_api.root_resource_id
  path_part   = "profile"
}

resource "aws_api_gateway_method" "candidate_profile_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_profile_res.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_profile_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_profile_res.id
  http_method             = aws_api_gateway_method.candidate_profile_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.candidate_profile.invoke_arn
}

resource "aws_api_gateway_resource" "candidate_profile_proxy" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_resource.candidate_profile_res.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "candidate_profile_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_profile_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_profile_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_profile_proxy.id
  http_method             = aws_api_gateway_method.candidate_profile_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.candidate_profile.invoke_arn
}

# Subpath /check-email -> CheckEmailLambda
resource "aws_api_gateway_resource" "candidate_check_email" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_rest_api.candidate_api.root_resource_id
  path_part   = "check-email"
}

resource "aws_api_gateway_method" "candidate_check_email_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_check_email.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_check_email_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_check_email.id
  http_method             = aws_api_gateway_method.candidate_check_email_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.check_email.invoke_arn
}

# Subpath /auth & /auth/{proxy+} -> CheckEmailLambda
resource "aws_api_gateway_resource" "candidate_auth" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_rest_api.candidate_api.root_resource_id
  path_part   = "auth"
}

resource "aws_api_gateway_method" "candidate_auth_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_auth.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_auth_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_auth.id
  http_method             = aws_api_gateway_method.candidate_auth_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.check_email.invoke_arn
}

resource "aws_api_gateway_resource" "candidate_auth_proxy" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_resource.candidate_auth.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "candidate_auth_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_auth_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_auth_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_auth_proxy.id
  http_method             = aws_api_gateway_method.candidate_auth_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.check_email.invoke_arn
}

# Subpath /users & /users/{proxy+} -> UserRoleLambda
resource "aws_api_gateway_resource" "candidate_users" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_rest_api.candidate_api.root_resource_id
  path_part   = "users"
}

resource "aws_api_gateway_method" "candidate_users_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_users.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_users_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_users.id
  http_method             = aws_api_gateway_method.candidate_users_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.user_role.invoke_arn
}

resource "aws_api_gateway_resource" "candidate_users_proxy" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_resource.candidate_users.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "candidate_users_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_users_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_users_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_users_proxy.id
  http_method             = aws_api_gateway_method.candidate_users_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.user_role.invoke_arn
}

# Subpath /ekyc & /ekyc/{proxy+}
resource "aws_api_gateway_resource" "candidate_ekyc" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_rest_api.candidate_api.root_resource_id
  path_part   = "ekyc"
}

resource "aws_api_gateway_method" "candidate_ekyc_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_ekyc.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_ekyc_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_ekyc.id
  http_method             = aws_api_gateway_method.candidate_ekyc_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.didit_ekyc.invoke_arn
}

resource "aws_api_gateway_resource" "candidate_ekyc_proxy" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_resource.candidate_ekyc.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "candidate_ekyc_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_ekyc_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_ekyc_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_ekyc_proxy.id
  http_method             = aws_api_gateway_method.candidate_ekyc_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.didit_ekyc.invoke_arn
}

# Subpath /cv & /cv/{proxy+}
resource "aws_api_gateway_resource" "candidate_cv" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_rest_api.candidate_api.root_resource_id
  path_part   = "cv"
}

resource "aws_api_gateway_method" "candidate_cv_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_cv.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_cv_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_cv.id
  http_method             = aws_api_gateway_method.candidate_cv_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.cv_upload.invoke_arn
}

resource "aws_api_gateway_resource" "candidate_cv_proxy" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_resource.candidate_cv.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "candidate_cv_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_cv_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_cv_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_cv_proxy.id
  http_method             = aws_api_gateway_method.candidate_cv_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.cv_upload.invoke_arn
}

# Subpath /cv-ai & /cv-ai/{proxy+}
resource "aws_api_gateway_resource" "candidate_cv_ai" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_rest_api.candidate_api.root_resource_id
  path_part   = "cv-ai"
}

resource "aws_api_gateway_method" "candidate_cv_ai_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_cv_ai.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_cv_ai_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_cv_ai.id
  http_method             = aws_api_gateway_method.candidate_cv_ai_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.cv_ai.invoke_arn
}

resource "aws_api_gateway_resource" "candidate_cv_ai_proxy" {
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  parent_id   = aws_api_gateway_resource.candidate_cv_ai.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "candidate_cv_ai_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  resource_id   = aws_api_gateway_resource.candidate_cv_ai_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "candidate_cv_ai_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.candidate_api.id
  resource_id             = aws_api_gateway_resource.candidate_cv_ai_proxy.id
  http_method             = aws_api_gateway_method.candidate_cv_ai_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.cv_ai.invoke_arn
}

resource "aws_api_gateway_gateway_response" "candidate_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  response_type = "DEFAULT_4XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_gateway_response" "candidate_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  response_type = "DEFAULT_5XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_deployment" "candidate_deployment" {
  depends_on = [
    aws_api_gateway_integration.candidate_root_integration,
    aws_api_gateway_integration.candidate_candidate_integration,
    aws_api_gateway_integration.candidate_candidate_proxy_integration,
    aws_api_gateway_integration.candidate_profile_integration,
    aws_api_gateway_integration.candidate_profile_proxy_integration,
    aws_api_gateway_integration.candidate_check_email_integration,
    aws_api_gateway_integration.candidate_auth_integration,
    aws_api_gateway_integration.candidate_auth_proxy_integration,
    aws_api_gateway_integration.candidate_users_integration,
    aws_api_gateway_integration.candidate_users_proxy_integration,
    aws_api_gateway_integration.candidate_ekyc_integration,
    aws_api_gateway_integration.candidate_ekyc_proxy_integration,
    aws_api_gateway_integration.candidate_cv_integration,
    aws_api_gateway_integration.candidate_cv_proxy_integration,
    aws_api_gateway_integration.candidate_cv_ai_integration,
    aws_api_gateway_integration.candidate_cv_ai_proxy_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.candidate_api.id
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_integration.candidate_root_integration.id,
      aws_api_gateway_integration.candidate_candidate_integration.id,
      aws_api_gateway_integration.candidate_candidate_proxy_integration.id,
      aws_api_gateway_integration.candidate_profile_integration.id,
      aws_api_gateway_integration.candidate_profile_proxy_integration.id,
      aws_api_gateway_integration.candidate_check_email_integration.id,
      aws_api_gateway_integration.candidate_auth_integration.id,
      aws_api_gateway_integration.candidate_auth_proxy_integration.id,
      aws_api_gateway_integration.candidate_users_integration.id,
      aws_api_gateway_integration.candidate_users_proxy_integration.id,
      aws_api_gateway_integration.candidate_ekyc_integration.id,
      aws_api_gateway_integration.candidate_ekyc_proxy_integration.id,
      aws_api_gateway_integration.candidate_cv_integration.id,
      aws_api_gateway_integration.candidate_cv_proxy_integration.id,
      aws_api_gateway_integration.candidate_cv_ai_integration.id,
      aws_api_gateway_integration.candidate_cv_ai_proxy_integration.id,
    ]))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "candidate_stage" {
  deployment_id = aws_api_gateway_deployment.candidate_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.candidate_api.id
  stage_name    = "prod"
}

resource "aws_lambda_permission" "candidate_api_permission" {
  statement_id  = "AllowAPIGatewayInvokeCandidate"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.candidate_profile.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.candidate_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "candidate_check_email_permission" {
  statement_id  = "AllowAPIGatewayInvokeCheckEmail"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.check_email.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.candidate_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "candidate_user_role_permission" {
  statement_id  = "AllowAPIGatewayInvokeUserRole"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.user_role.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.candidate_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "candidate_didit_ekyc_permission" {
  statement_id  = "AllowAPIGatewayInvokeDiditEkyc"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.didit_ekyc.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.candidate_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "candidate_cv_upload_permission" {
  statement_id  = "AllowAPIGatewayInvokeCvUpload"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cv_upload.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.candidate_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "candidate_cv_ai_permission" {
  statement_id  = "AllowAPIGatewayInvokeCvAi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cv_ai.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.candidate_api.execution_arn}/*/*"
}


# ─────────────────────────────────────────────────────────────────────────────
# 2. Employer API (Employer Profile, Jobs, Quick Jobs, Applications)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_api_gateway_rest_api" "employer_api" {
  name        = "EmployerAPI"
  description = "Employer Profile, Jobs, Quick Jobs & Applications REST API"
}

# Root /
resource "aws_api_gateway_method" "employer_root_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_rest_api.employer_api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_root_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_rest_api.employer_api.root_resource_id
  http_method             = aws_api_gateway_method.employer_root_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.employer_profile.invoke_arn
}

# Subpath /profile & /profile/{proxy+} -> EmployerProfileLambda
resource "aws_api_gateway_resource" "employer_profile_res" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_rest_api.employer_api.root_resource_id
  path_part   = "profile"
}

resource "aws_api_gateway_method" "employer_profile_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_profile_res.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_profile_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_profile_res.id
  http_method             = aws_api_gateway_method.employer_profile_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.employer_profile.invoke_arn
}

resource "aws_api_gateway_resource" "employer_profile_proxy" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_resource.employer_profile_res.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "employer_profile_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_profile_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_profile_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_profile_proxy.id
  http_method             = aws_api_gateway_method.employer_profile_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.employer_profile.invoke_arn
}

# Subpath /employers & /employers/{proxy+} -> EmployerProfileLambda
resource "aws_api_gateway_resource" "employer_employers_res" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_rest_api.employer_api.root_resource_id
  path_part   = "employers"
}

resource "aws_api_gateway_method" "employer_employers_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_employers_res.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_employers_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_employers_res.id
  http_method             = aws_api_gateway_method.employer_employers_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.employer_profile.invoke_arn
}

resource "aws_api_gateway_resource" "employer_employers_proxy" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_resource.employer_employers_res.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "employer_employers_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_employers_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_employers_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_employers_proxy.id
  http_method             = aws_api_gateway_method.employer_employers_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.employer_profile.invoke_arn
}

# Subpath /admin & /admin/{proxy+} -> EmployerProfileLambda
resource "aws_api_gateway_resource" "employer_admin_res" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_rest_api.employer_api.root_resource_id
  path_part   = "admin"
}

resource "aws_api_gateway_method" "employer_admin_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_admin_res.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_admin_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_admin_res.id
  http_method             = aws_api_gateway_method.employer_admin_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.employer_profile.invoke_arn
}

resource "aws_api_gateway_resource" "employer_admin_proxy" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_resource.employer_admin_res.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "employer_admin_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_admin_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_admin_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_admin_proxy.id
  http_method             = aws_api_gateway_method.employer_admin_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.employer_profile.invoke_arn
}

# Subpath /jobs & /jobs/{proxy+} -> JobPostLambda
resource "aws_api_gateway_resource" "employer_jobs" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_rest_api.employer_api.root_resource_id
  path_part   = "jobs"
}

resource "aws_api_gateway_method" "employer_jobs_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_jobs.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_jobs_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_jobs.id
  http_method             = aws_api_gateway_method.employer_jobs_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.job_post.invoke_arn
}

resource "aws_api_gateway_resource" "employer_jobs_proxy" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_resource.employer_jobs.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "employer_jobs_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_jobs_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_jobs_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_jobs_proxy.id
  http_method             = aws_api_gateway_method.employer_jobs_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.job_post.invoke_arn
}

# Subpath /quick-jobs & /quick-jobs/{proxy+} -> QuickJobLambda
resource "aws_api_gateway_resource" "employer_quick_jobs" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_rest_api.employer_api.root_resource_id
  path_part   = "quick-jobs"
}

resource "aws_api_gateway_method" "employer_quick_jobs_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_quick_jobs.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_quick_jobs_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_quick_jobs.id
  http_method             = aws_api_gateway_method.employer_quick_jobs_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.quick_job.invoke_arn
}

resource "aws_api_gateway_resource" "employer_quick_jobs_proxy" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_resource.employer_quick_jobs.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "employer_quick_jobs_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_quick_jobs_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_quick_jobs_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_quick_jobs_proxy.id
  http_method             = aws_api_gateway_method.employer_quick_jobs_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.quick_job.invoke_arn
}

# Subpath /applications & /applications/{proxy+} -> ApplicationLambda
resource "aws_api_gateway_resource" "employer_applications" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_rest_api.employer_api.root_resource_id
  path_part   = "applications"
}

resource "aws_api_gateway_method" "employer_applications_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_applications.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_applications_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_applications.id
  http_method             = aws_api_gateway_method.employer_applications_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.application.invoke_arn
}

resource "aws_api_gateway_resource" "employer_applications_proxy" {
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  parent_id   = aws_api_gateway_resource.employer_applications.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "employer_applications_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  resource_id   = aws_api_gateway_resource.employer_applications_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "employer_applications_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.employer_api.id
  resource_id             = aws_api_gateway_resource.employer_applications_proxy.id
  http_method             = aws_api_gateway_method.employer_applications_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.application.invoke_arn
}

resource "aws_api_gateway_gateway_response" "employer_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  response_type = "DEFAULT_4XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_gateway_response" "employer_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  response_type = "DEFAULT_5XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_deployment" "employer_deployment" {
  depends_on = [
    aws_api_gateway_integration.employer_root_integration,
    aws_api_gateway_integration.employer_profile_integration,
    aws_api_gateway_integration.employer_profile_proxy_integration,
    aws_api_gateway_integration.employer_employers_integration,
    aws_api_gateway_integration.employer_employers_proxy_integration,
    aws_api_gateway_integration.employer_admin_integration,
    aws_api_gateway_integration.employer_admin_proxy_integration,
    aws_api_gateway_integration.employer_jobs_integration,
    aws_api_gateway_integration.employer_jobs_proxy_integration,
    aws_api_gateway_integration.employer_quick_jobs_integration,
    aws_api_gateway_integration.employer_quick_jobs_proxy_integration,
    aws_api_gateway_integration.employer_applications_integration,
    aws_api_gateway_integration.employer_applications_proxy_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.employer_api.id
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_integration.employer_root_integration.id,
      aws_api_gateway_integration.employer_profile_integration.id,
      aws_api_gateway_integration.employer_profile_proxy_integration.id,
      aws_api_gateway_integration.employer_employers_integration.id,
      aws_api_gateway_integration.employer_employers_proxy_integration.id,
      aws_api_gateway_integration.employer_admin_integration.id,
      aws_api_gateway_integration.employer_admin_proxy_integration.id,
      aws_api_gateway_integration.employer_jobs_integration.id,
      aws_api_gateway_integration.employer_jobs_proxy_integration.id,
      aws_api_gateway_integration.employer_quick_jobs_integration.id,
      aws_api_gateway_integration.employer_quick_jobs_proxy_integration.id,
      aws_api_gateway_integration.employer_applications_integration.id,
      aws_api_gateway_integration.employer_applications_proxy_integration.id,
    ]))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "employer_stage" {
  deployment_id = aws_api_gateway_deployment.employer_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.employer_api.id
  stage_name    = "prod"
}

resource "aws_lambda_permission" "employer_api_permission" {
  statement_id  = "AllowAPIGatewayInvokeEmployer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.employer_profile.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.employer_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "employer_jobs_permission" {
  statement_id  = "AllowAPIGatewayInvokeJobPost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.job_post.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.employer_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "employer_quick_jobs_permission" {
  statement_id  = "AllowAPIGatewayInvokeQuickJob"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.quick_job.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.employer_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "employer_applications_permission" {
  statement_id  = "AllowAPIGatewayInvokeApplication"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.application.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.employer_api.execution_arn}/*/*"
}


# ─────────────────────────────────────────────────────────────────────────────
# 3. Banner Management API
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_api_gateway_rest_api" "banner_api" {
  name        = "BannerAPI"
  description = "Banner Management REST API"
}

resource "aws_api_gateway_method" "banner_root_method" {
  rest_api_id   = aws_api_gateway_rest_api.banner_api.id
  resource_id   = aws_api_gateway_rest_api.banner_api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "banner_root_integration" {
  rest_api_id             = aws_api_gateway_rest_api.banner_api.id
  resource_id             = aws_api_gateway_rest_api.banner_api.root_resource_id
  http_method             = aws_api_gateway_method.banner_root_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.banner.invoke_arn
}

resource "aws_api_gateway_resource" "banner_proxy" {
  rest_api_id = aws_api_gateway_rest_api.banner_api.id
  parent_id   = aws_api_gateway_rest_api.banner_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "banner_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.banner_api.id
  resource_id   = aws_api_gateway_resource.banner_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "banner_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.banner_api.id
  resource_id             = aws_api_gateway_resource.banner_proxy.id
  http_method             = aws_api_gateway_method.banner_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.banner.invoke_arn
}

resource "aws_api_gateway_gateway_response" "banner_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.banner_api.id
  response_type = "DEFAULT_4XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_gateway_response" "banner_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.banner_api.id
  response_type = "DEFAULT_5XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_deployment" "banner_deployment" {
  depends_on = [
    aws_api_gateway_integration.banner_root_integration,
    aws_api_gateway_integration.banner_proxy_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.banner_api.id
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_integration.banner_root_integration.id,
      aws_api_gateway_integration.banner_proxy_integration.id,
    ]))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "banner_stage" {
  deployment_id = aws_api_gateway_deployment.banner_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.banner_api.id
  stage_name    = "prod"
}

resource "aws_lambda_permission" "banner_api_permission" {
  statement_id  = "AllowAPIGatewayInvokeBanner"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.banner.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.banner_api.execution_arn}/*/*"
}


# ─────────────────────────────────────────────────────────────────────────────
# 4. Package Subscriptions API
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_api_gateway_rest_api" "package_subscriptions_api" {
  name        = "PackageSubscriptionsAPI"
  description = "Package Catalog and Subscriptions REST API"
}

resource "aws_api_gateway_method" "package_root_method" {
  rest_api_id   = aws_api_gateway_rest_api.package_subscriptions_api.id
  resource_id   = aws_api_gateway_rest_api.package_subscriptions_api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "package_root_integration" {
  rest_api_id             = aws_api_gateway_rest_api.package_subscriptions_api.id
  resource_id             = aws_api_gateway_rest_api.package_subscriptions_api.root_resource_id
  http_method             = aws_api_gateway_method.package_root_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.package_subscriptions.invoke_arn
}

resource "aws_api_gateway_resource" "package_proxy" {
  rest_api_id = aws_api_gateway_rest_api.package_subscriptions_api.id
  parent_id   = aws_api_gateway_rest_api.package_subscriptions_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "package_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.package_subscriptions_api.id
  resource_id   = aws_api_gateway_resource.package_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "package_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.package_subscriptions_api.id
  resource_id             = aws_api_gateway_resource.package_proxy.id
  http_method             = aws_api_gateway_method.package_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.package_subscriptions.invoke_arn
}

resource "aws_api_gateway_gateway_response" "package_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.package_subscriptions_api.id
  response_type = "DEFAULT_4XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_gateway_response" "package_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.package_subscriptions_api.id
  response_type = "DEFAULT_5XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_deployment" "package_deployment" {
  depends_on = [
    aws_api_gateway_integration.package_root_integration,
    aws_api_gateway_integration.package_proxy_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.package_subscriptions_api.id
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_integration.package_root_integration.id,
      aws_api_gateway_integration.package_proxy_integration.id,
    ]))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "package_stage" {
  deployment_id = aws_api_gateway_deployment.package_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.package_subscriptions_api.id
  stage_name    = "prod"
}

resource "aws_lambda_permission" "package_api_permission" {
  statement_id  = "AllowAPIGatewayInvokePackageSubscriptions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.package_subscriptions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.package_subscriptions_api.execution_arn}/*/*"
}


# ─────────────────────────────────────────────────────────────────────────────
# 5. Payments API
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_api_gateway_rest_api" "payments_api" {
  name        = "PaymentsAPI"
  description = "VietQR Payments & SePay Webhook REST API"
}

resource "aws_api_gateway_method" "payments_root_method" {
  rest_api_id   = aws_api_gateway_rest_api.payments_api.id
  resource_id   = aws_api_gateway_rest_api.payments_api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "payments_root_integration" {
  rest_api_id             = aws_api_gateway_rest_api.payments_api.id
  resource_id             = aws_api_gateway_rest_api.payments_api.root_resource_id
  http_method             = aws_api_gateway_method.payments_root_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payments.invoke_arn
}

resource "aws_api_gateway_resource" "payments_proxy" {
  rest_api_id = aws_api_gateway_rest_api.payments_api.id
  parent_id   = aws_api_gateway_rest_api.payments_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "payments_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.payments_api.id
  resource_id   = aws_api_gateway_resource.payments_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "payments_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.payments_api.id
  resource_id             = aws_api_gateway_resource.payments_proxy.id
  http_method             = aws_api_gateway_method.payments_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payments.invoke_arn
}

resource "aws_api_gateway_gateway_response" "payments_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.payments_api.id
  response_type = "DEFAULT_4XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_gateway_response" "payments_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.payments_api.id
  response_type = "DEFAULT_5XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_deployment" "payments_deployment" {
  depends_on = [
    aws_api_gateway_integration.payments_root_integration,
    aws_api_gateway_integration.payments_proxy_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.payments_api.id
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_integration.payments_root_integration.id,
      aws_api_gateway_integration.payments_proxy_integration.id,
    ]))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "payments_stage" {
  deployment_id = aws_api_gateway_deployment.payments_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.payments_api.id
  stage_name    = "prod"
}

resource "aws_lambda_permission" "payments_api_permission" {
  statement_id  = "AllowAPIGatewayInvokePayments"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payments.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payments_api.execution_arn}/*/*"
}


# ─────────────────────────────────────────────────────────────────────────────
# 6. Notifications API
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_api_gateway_rest_api" "notifications_api" {
  name        = "NotificationsAPI"
  description = "User Notifications REST API"
}

resource "aws_api_gateway_method" "notifications_root_method" {
  rest_api_id   = aws_api_gateway_rest_api.notifications_api.id
  resource_id   = aws_api_gateway_rest_api.notifications_api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "notifications_root_integration" {
  rest_api_id             = aws_api_gateway_rest_api.notifications_api.id
  resource_id             = aws_api_gateway_rest_api.notifications_api.root_resource_id
  http_method             = aws_api_gateway_method.notifications_root_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.notifications.invoke_arn
}

resource "aws_api_gateway_resource" "notifications_proxy" {
  rest_api_id = aws_api_gateway_rest_api.notifications_api.id
  parent_id   = aws_api_gateway_rest_api.notifications_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "notifications_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.notifications_api.id
  resource_id   = aws_api_gateway_resource.notifications_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "notifications_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.notifications_api.id
  resource_id             = aws_api_gateway_resource.notifications_proxy.id
  http_method             = aws_api_gateway_method.notifications_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.notifications.invoke_arn
}

resource "aws_api_gateway_gateway_response" "notifications_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.notifications_api.id
  response_type = "DEFAULT_4XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_gateway_response" "notifications_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.notifications_api.id
  response_type = "DEFAULT_5XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_deployment" "notifications_deployment" {
  depends_on = [
    aws_api_gateway_integration.notifications_root_integration,
    aws_api_gateway_integration.notifications_proxy_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.notifications_api.id
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_integration.notifications_root_integration.id,
      aws_api_gateway_integration.notifications_proxy_integration.id,
    ]))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "notifications_stage" {
  deployment_id = aws_api_gateway_deployment.notifications_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.notifications_api.id
  stage_name    = "prod"
}

resource "aws_lambda_permission" "notifications_api_permission" {
  statement_id  = "AllowAPIGatewayInvokeNotifications"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notifications.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.notifications_api.execution_arn}/*/*"
}


# ─────────────────────────────────────────────────────────────────────────────
# 7. Experience API
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_api_gateway_rest_api" "experience_api" {
  name        = "ExperienceAPI"
  description = "Candidate Experience REST API"
}

resource "aws_api_gateway_method" "experience_root_method" {
  rest_api_id   = aws_api_gateway_rest_api.experience_api.id
  resource_id   = aws_api_gateway_rest_api.experience_api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "experience_root_integration" {
  rest_api_id             = aws_api_gateway_rest_api.experience_api.id
  resource_id             = aws_api_gateway_rest_api.experience_api.root_resource_id
  http_method             = aws_api_gateway_method.experience_root_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.experience.invoke_arn
}

resource "aws_api_gateway_resource" "experience_proxy" {
  rest_api_id = aws_api_gateway_rest_api.experience_api.id
  parent_id   = aws_api_gateway_rest_api.experience_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "experience_proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.experience_api.id
  resource_id   = aws_api_gateway_resource.experience_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "experience_proxy_integration" {
  rest_api_id             = aws_api_gateway_rest_api.experience_api.id
  resource_id             = aws_api_gateway_resource.experience_proxy.id
  http_method             = aws_api_gateway_method.experience_proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.experience.invoke_arn
}

resource "aws_api_gateway_gateway_response" "experience_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.experience_api.id
  response_type = "DEFAULT_4XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_gateway_response" "experience_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.experience_api.id
  response_type = "DEFAULT_5XX"
  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_deployment" "experience_deployment" {
  depends_on = [
    aws_api_gateway_integration.experience_root_integration,
    aws_api_gateway_integration.experience_proxy_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.experience_api.id
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_integration.experience_root_integration.id,
      aws_api_gateway_integration.experience_proxy_integration.id,
    ]))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "experience_stage" {
  deployment_id = aws_api_gateway_deployment.experience_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.experience_api.id
  stage_name    = "prod"
}

resource "aws_lambda_permission" "experience_api_permission" {
  statement_id  = "AllowAPIGatewayInvokeExperience"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.experience.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.experience_api.execution_arn}/*/*"
}
