locals {
  legacy_rest_openapi_files = {
    banner_api            = "BannerAPI-35djy3cnxb-prod.json"
    employer_profile_api  = "EmployerProfileAPI-dlidp35x33-prod.json"
    chat_rest_api         = "chat-rest-api-xxig44mrn3-prod.json"
    candidate_profile_api = "CandidateProfileAPI-xyp4wkszi7-prod.json"
  }

  legacy_rest_openapi_base_bodies = {
    for key, filename in local.legacy_rest_openapi_files :
    key => replace(
      replace(
        file("${path.module}/openapi/${filename}"),
        "726911960757",
        data.aws_caller_identity.current.account_id
      ),
      "arn:aws:iam::726911960757",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}"
    )
  }

  legacy_rest_openapi_bodies = merge(
    local.legacy_rest_openapi_base_bodies,
    {
      candidate_profile_api = replace(
        local.legacy_rest_openapi_base_bodies.candidate_profile_api,
        "\"x-amazon-apigateway-authtype\" : \"cognito_user_pools\"",
        "\"x-amazon-apigateway-authtype\" : \"cognito_user_pools\",\n        \"x-amazon-apigateway-authorizer\" : { \"type\" : \"cognito_user_pools\", \"providerARNs\" : [\"${aws_cognito_user_pool.legacy.arn}\"] }"
      )
    }
  )
}

resource "aws_api_gateway_rest_api" "legacy" {
  for_each = local.legacy_rest_openapi_bodies
  name     = jsondecode(each.value).info.title
  body     = each.value

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_deployment" "legacy" {
  for_each    = aws_api_gateway_rest_api.legacy
  rest_api_id = each.value.id

  triggers = {
    redeployment = sha1(local.legacy_rest_openapi_bodies[each.key])
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "legacy" {
  for_each      = aws_api_gateway_rest_api.legacy
  rest_api_id   = each.value.id
  deployment_id = aws_api_gateway_deployment.legacy[each.key].id
  stage_name    = "prod"
}

resource "aws_lambda_permission" "apigateway_rest" {
  for_each      = aws_lambda_function.legacy
  statement_id  = "AllowRestAPIGateway-${substr(md5(each.key), 0, 12)}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*/*/*"
}
