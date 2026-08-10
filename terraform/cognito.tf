# ─────────────────────────────────────────────────────────────────────────────
# Cognito User Pool & User Pool Client
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_cognito_user_pool" "user_pool" {
  name                     = "opporeview-user-pool-${var.environment}"
  auto_verified_attributes = ["email"]

  username_attributes = ["email"]

  # Use the verified oppocareer.com SES identity instead of Cognito's shared
  # sender. SES Production Access must be enabled before applying in prod.
  email_configuration {
    email_sending_account  = "DEVELOPER"
    from_email_address     = var.cognito_email_from
    reply_to_email_address = var.cognito_email_reply_to
    source_arn             = "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/oppocareer.com"
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Mã xác thực tài khoản Ốp Pờ"
    email_message        = "Xin chào,\n\nMã xác thực tài khoản của bạn là: {####}\n\nNếu bạn không yêu cầu mã này, hãy bỏ qua email.\n\nỐp Pờ"
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = false
    require_numbers   = false
    require_symbols   = false
    require_uppercase = false
  }

  lambda_config {
    pre_sign_up       = aws_lambda_function.pre_signup_link_accounts.arn
    post_confirmation = aws_lambda_function.post_confirmation.arn
  }

  schema {
    attribute_data_type      = "String"
    name                     = "email"
    required                 = true
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    attribute_data_type      = "String"
    name                     = "name"
    required                 = false
    mutable                  = true
    developer_only_attribute = false
  }

  schema {
    attribute_data_type      = "String"
    name                     = "picture"
    required                 = false
    mutable                  = true
    developer_only_attribute = false
  }

  lifecycle {
    ignore_changes = [
      schema
    ]
  }
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  name         = "opporeview-web-client"
  user_pool_id = aws_cognito_user_pool.user_pool.id

  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_CUSTOM_AUTH"
  ]
  supported_identity_providers         = ["COGNITO"]
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = ["http://localhost:5173", "https://localhost:5173"]
  logout_urls                          = ["http://localhost:5173", "https://localhost:5173"]
}

# Grant Cognito permissions to invoke Lambda Triggers
resource "aws_lambda_permission" "cognito_pre_signup" {
  statement_id  = "AllowCognitoInvokePreSignUp"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_signup_link_accounts.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.user_pool.arn
}

resource "aws_lambda_permission" "cognito_post_confirmation" {
  statement_id  = "AllowCognitoInvokePostConfirmation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.user_pool.arn
}

# ─────────────────────────────────────────────────────────────────────────────
# Cognito User Groups
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_cognito_user_group" "candidate_group" {
  name         = "Candidate"
  user_pool_id = aws_cognito_user_pool.user_pool.id
  description  = "Candidate users"
}

resource "aws_cognito_user_group" "employer_group" {
  name         = "Employer"
  user_pool_id = aws_cognito_user_pool.user_pool.id
  description  = "Employer users"
}

resource "aws_cognito_user_group" "admin_group" {
  name         = "Admin"
  user_pool_id = aws_cognito_user_pool.user_pool.id
  description  = "Admin users"
}
