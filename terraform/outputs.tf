# ─────────────────────────────────────────────────────────────────────────────
# Terraform Outputs
# ─────────────────────────────────────────────────────────────────────────────

output "aws_region" {
  value       = var.aws_region
  description = "Deployed AWS Region"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.media_storage.id
  description = "Name of the S3 storage bucket"
}

output "cognito_user_pool_id" {
  value       = aws_cognito_user_pool.user_pool.id
  description = "Cognito User Pool ID"
}

output "cognito_user_pool_client_id" {
  value       = aws_cognito_user_pool_client.user_pool_client.id
  description = "Cognito User Pool Web Client ID"
}

output "candidate_api_url" {
  value       = "${aws_api_gateway_stage.candidate_stage.invoke_url}"
  description = "Candidate / eKYC / Check Email REST API Base URL"
}

output "employer_api_url" {
  value       = "${aws_api_gateway_stage.employer_stage.invoke_url}"
  description = "Employer & Admin REST API Base URL"
}

output "banner_api_url" {
  value       = "${aws_api_gateway_stage.banner_stage.invoke_url}"
  description = "Banner Management REST API Base URL"
}

output "package_subscriptions_api_url" {
  value       = "${aws_api_gateway_stage.package_stage.invoke_url}"
  description = "Package Subscriptions REST API Base URL"
}

output "payments_api_url" {
  value       = "${aws_api_gateway_stage.payments_stage.invoke_url}"
  description = "VietQR & SePay Payments REST API Base URL"
}

output "notifications_api_url" {
  value       = "${aws_api_gateway_stage.notifications_stage.invoke_url}"
  description = "User Notifications REST API Base URL"
}

output "experience_api_url" {
  value       = "${aws_api_gateway_stage.experience_stage.invoke_url}"
  description = "Candidate Experience REST API Base URL"
}

output "translate_api_url" {
  value       = aws_lambda_function_url.translate_url.function_url
  description = "Translate Lambda Function URL"
}

output "admin_websocket_endpoint" {
  value       = "wss://${aws_apigatewayv2_api.admin_ws_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_apigatewayv2_stage.admin_ws_stage.name}"
  description = "Admin Realtime WebSocket Endpoint"
}

output "env_file_snippet" {
  description = "Copy and paste this snippet directly into your .env or .env.production file"
  value       = <<EOT

# ─── Generated Environment Variables for New AWS Account ──────────────────────
VITE_API_URL=${aws_api_gateway_stage.candidate_stage.invoke_url}
VITE_CANDIDATE_API_URL=${aws_api_gateway_stage.candidate_stage.invoke_url}
VITE_CHECK_EMAIL_API=${aws_api_gateway_stage.candidate_stage.invoke_url}
VITE_EKYC_API_URL=${aws_api_gateway_stage.candidate_stage.invoke_url}
VITE_CV_AI_API_URL=${aws_api_gateway_stage.candidate_stage.invoke_url}

VITE_EMPLOYER_API_URL=${aws_api_gateway_stage.employer_stage.invoke_url}
VITE_BANNER_API_URL=${aws_api_gateway_stage.banner_stage.invoke_url}
VITE_PACKAGE_SUBSCRIPTIONS_API=${aws_api_gateway_stage.package_stage.invoke_url}
VITE_PAYMENTS_API_URL=${aws_api_gateway_stage.payments_stage.invoke_url}
VITE_NOTIFICATIONS_API=${aws_api_gateway_stage.notifications_stage.invoke_url}
VITE_EXPERIENCE_API_URL=${aws_api_gateway_stage.experience_stage.invoke_url}
VITE_TRANSLATE_API=${aws_lambda_function_url.translate_url.function_url}
VITE_ADMIN_WS_ENDPOINT=wss://${aws_apigatewayv2_api.admin_ws_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_apigatewayv2_stage.admin_ws_stage.name}

EOT
}
