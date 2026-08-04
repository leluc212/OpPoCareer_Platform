# ─────────────────────────────────────────────────────────────────────────────
# WebSocket API Gateway (admin-ws-api)
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "admin_ws_api" {
  name                       = "admin-ws-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

# Integrations
resource "aws_apigatewayv2_integration" "ws_connect_integration" {
  api_id                    = aws_apigatewayv2_api.admin_ws_api.id
  integration_type          = "AWS_PROXY"
  integration_uri           = aws_lambda_function.ws_admin_connect.invoke_arn
  content_handling_strategy = "CONVERT_TO_TEXT"
  passthrough_behavior      = "WHEN_NO_MATCH"
}

resource "aws_apigatewayv2_integration" "ws_disconnect_integration" {
  api_id                    = aws_apigatewayv2_api.admin_ws_api.id
  integration_type          = "AWS_PROXY"
  integration_uri           = aws_lambda_function.ws_admin_disconnect.invoke_arn
  content_handling_strategy = "CONVERT_TO_TEXT"
  passthrough_behavior      = "WHEN_NO_MATCH"
}

# Routes
resource "aws_apigatewayv2_route" "connect_route" {
  api_id    = aws_apigatewayv2_api.admin_ws_api.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.ws_connect_integration.id}"
}

resource "aws_apigatewayv2_route" "disconnect_route" {
  api_id    = aws_apigatewayv2_api.admin_ws_api.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.ws_disconnect_integration.id}"
}

# Stage
resource "aws_apigatewayv2_stage" "admin_ws_stage" {
  api_id      = aws_apigatewayv2_api.admin_ws_api.id
  name        = "prod"
  auto_deploy = true
}

# Lambda Invoke Permissions
resource "aws_lambda_permission" "ws_connect_permission" {
  statement_id  = "AllowWebSocketAPIGatewayConnect"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ws_admin_connect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.admin_ws_api.execution_arn}/*/$connect"
}

resource "aws_lambda_permission" "ws_disconnect_permission" {
  statement_id  = "AllowWebSocketAPIGatewayDisconnect"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ws_admin_disconnect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.admin_ws_api.execution_arn}/*/$disconnect"
}
