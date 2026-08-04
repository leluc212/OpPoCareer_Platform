output "cognito_user_pool_id" {
  value       = aws_cognito_user_pool.legacy.id
  description = "Mirror Cognito user pool ID."
}

output "cognito_web_client_id" {
  value       = aws_cognito_user_pool_client.web.id
  description = "Mirror Cognito web client ID."
}

output "cognito_app_client_id" {
  value       = aws_cognito_user_pool_client.app.id
  description = "Mirror Cognito app client ID."
}

output "cognito_domain" {
  value       = "opporeview"
  description = "Cognito hosted UI prefix to create after it is released from the old account."
}

output "legacy_apigatewayv2_endpoints" {
  value = {
    for key, api in aws_apigatewayv2_api.legacy :
    key => api.api_endpoint
  }
}

output "legacy_rest_api_invoke_urls" {
  value = {
    for key, stage in aws_api_gateway_stage.legacy :
    key => stage.invoke_url
  }
}

output "application_us_east_1_endpoint" {
  value = aws_apigatewayv2_api.application_us_east_1.api_endpoint
}

output "route53_name_servers" {
  value       = var.create_route53_zone ? aws_route53_zone.oppocareer[0].name_servers : []
  description = "Use these name servers at the registrar after DNS validation/cutover."
}

output "s3_bucket_names" {
  value = {
    for key, bucket in aws_s3_bucket.legacy :
    key => bucket.id
  }
}

output "translate_api_url" {
  value       = aws_lambda_function_url.translate_url.function_url
  description = "Translate Lambda Function URL."
}
