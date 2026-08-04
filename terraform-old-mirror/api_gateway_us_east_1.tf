resource "aws_apigatewayv2_api" "application_us_east_1" {
  provider      = aws.us_east_1
  name          = "ApplicationAPI"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_origins = ["*"]
  }
}

resource "aws_apigatewayv2_integration" "application_us_east_1" {
  provider               = aws.us_east_1
  api_id                 = aws_apigatewayv2_api.application_us_east_1.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.application_us_east_1.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "application_us_east_1" {
  provider = aws.us_east_1
  for_each = toset([
    "PUT /applications/{applicationId}/status",
    "GET /applications/candidate/{candidateId}",
    "POST /applications",
    "OPTIONS /applications",
    "GET /applications/job/{jobId}"
  ])

  api_id    = aws_apigatewayv2_api.application_us_east_1.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.application_us_east_1.id}"
}

resource "aws_apigatewayv2_stage" "application_us_east_1" {
  provider    = aws.us_east_1
  api_id      = aws_apigatewayv2_api.application_us_east_1.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "application_us_east_1_apigateway" {
  provider      = aws.us_east_1
  statement_id  = "AllowAPIGatewayV2USEast1"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.application_us_east_1.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.application_us_east_1.execution_arn}/*/*"
}
