resource "aws_cognito_user_pool" "legacy" {
  name                     = "OpPoWebUserPool"
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OFF"

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  lambda_config {
    pre_sign_up       = aws_lambda_function.legacy["PreSignUpLinkAccounts"].arn
    post_confirmation = aws_lambda_function.legacy["CognitoAutoAddUserToGroup"].arn
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
    recovery_mechanism {
      name     = "verified_phone_number"
      priority = 2
    }
  }

  lifecycle {
    ignore_changes = [schema]
  }
}

resource "aws_cognito_identity_provider" "google" {
  count         = var.google_client_id == "" || var.google_client_secret == "" ? 0 : 1
  user_pool_id  = aws_cognito_user_pool.legacy.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "email openid profile"
  }

  attribute_mapping = {
    email    = "email"
    name     = "name"
    picture  = "picture"
    username = "sub"
  }

  lifecycle {
    ignore_changes = [provider_details]
  }
}

resource "aws_cognito_user_pool_domain" "legacy" {
  count        = var.enable_cognito_domain ? 1 : 0
  domain       = "opporeview"
  user_pool_id = aws_cognito_user_pool.legacy.id
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "OpPoWebClient"
  user_pool_id = aws_cognito_user_pool.legacy.id

  explicit_auth_flows = [
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  supported_identity_providers         = var.google_client_id == "" || var.google_client_secret == "" ? ["COGNITO"] : ["COGNITO", "Google"]
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["aws.cognito.signin.user.admin", "email", "openid", "profile"]
  callback_urls                        = ["com.oppo.tempjobs://", "http://localhost:3000/", "http://localhost:5000/", "https://hd-2004.github.io/OppoApp/", "https://leluc212.github.io/OpPoReview/", "https://oppocareer.com", "https://oppocareer.com/"]
  logout_urls                          = ["com.oppo.tempjobs://", "http://localhost:3000/", "http://localhost:5000/", "https://hd-2004.github.io/OppoApp/", "https://leluc212.github.io/OpPoReview/", "https://oppocareer.com", "https://oppocareer.com/"]

  refresh_token_validity = 30
  access_token_validity  = 60
  id_token_validity      = 60

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  depends_on = [aws_cognito_identity_provider.google]
}

resource "aws_cognito_user_pool_client" "app" {
  name         = "OpPoAppClient"
  user_pool_id = aws_cognito_user_pool.legacy.id

  explicit_auth_flows = [
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  supported_identity_providers         = var.google_client_id == "" || var.google_client_secret == "" ? ["COGNITO"] : ["COGNITO", "Google"]
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["aws.cognito.signin.user.admin", "email", "openid", "phone", "profile"]
  callback_urls                        = ["http://localhost:5000/", "https://hd-2004.github.io/OppoApp/", "https://oppocareer.com", "https://oppocareer.com/"]
  logout_urls                          = ["http://localhost:5000/", "https://hd-2004.github.io/OppoApp/", "https://oppocareer.com", "https://oppocareer.com/"]
  prevent_user_existence_errors        = "ENABLED"

  refresh_token_validity = 5
  access_token_validity  = 60
  id_token_validity      = 60

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  depends_on = [aws_cognito_identity_provider.google]
}

resource "aws_cognito_user_group" "admin" {
  name         = "Admin"
  user_pool_id = aws_cognito_user_pool.legacy.id
  description  = "Admin of website"
  precedence   = 1
}

resource "aws_cognito_user_group" "candidate" {
  name         = "Candidate"
  user_pool_id = aws_cognito_user_pool.legacy.id
  description  = "Candidate account"
  precedence   = 1
}

resource "aws_cognito_user_group" "employer" {
  name         = "Employer"
  user_pool_id = aws_cognito_user_pool.legacy.id
  description  = "Employer account"
  precedence   = 2
}

resource "aws_cognito_user_group" "google" {
  count        = var.google_client_id == "" || var.google_client_secret == "" ? 0 : 1
  name         = "${aws_cognito_user_pool.legacy.id}_Google"
  user_pool_id = aws_cognito_user_pool.legacy.id
  description  = "Autogenerated group for users who sign in using Google"
}

resource "aws_lambda_permission" "cognito_pre_signup" {
  statement_id  = "AllowCognitoInvokePreSignUp"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.legacy["PreSignUpLinkAccounts"].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.legacy.arn
}

resource "aws_lambda_permission" "cognito_post_confirmation" {
  statement_id  = "AllowCognitoInvokePostConfirmation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.legacy["CognitoAutoAddUserToGroup"].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.legacy.arn
}
