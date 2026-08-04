# ─────────────────────────────────────────────────────────────────────────────
# DynamoDB Tables Configuration (16 Tables)
# ─────────────────────────────────────────────────────────────────────────────

# 1. Users Table
resource "aws_dynamodb_table" "users" {
  name         = "Users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "Email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }
}

# 2. CandidateProfiles Table
resource "aws_dynamodb_table" "candidate_profiles" {
  name         = "CandidateProfiles"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "cccdNumber"
    type = "S"
  }

  global_secondary_index {
    name            = "cccdNumber-index"
    hash_key        = "cccdNumber"
    projection_type = "ALL"
  }
}

# 3. EmployerProfiles Table
resource "aws_dynamodb_table" "employer_profiles" {
  name         = "EmployerProfiles"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }
}

# 4. PostStandardJob Table
resource "aws_dynamodb_table" "post_standard_job" {
  name         = "PostStandardJob"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "idJob"

  attribute {
    name = "idJob"
    type = "S"
  }

  attribute {
    name = "employerId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "EmployerIndex"
    hash_key        = "employerId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    projection_type = "ALL"
  }
}

# 5. PostQuickJob Table
resource "aws_dynamodb_table" "post_quick_job" {
  name         = "PostQuickJob"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "jobID"

  attribute {
    name = "jobID"
    type = "S"
  }

  attribute {
    name = "employerId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "EmployerIndex"
    hash_key        = "employerId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    projection_type = "ALL"
  }
}

# 6. StandardApplications Table (with DynamoDB Stream for WebSocket notifications)
resource "aws_dynamodb_table" "standard_applications" {
  name             = "StandardApplications"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "applicationId"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "applicationId"
    type = "S"
  }

  attribute {
    name = "candidateId"
    type = "S"
  }

  attribute {
    name = "jobId"
    type = "S"
  }

  global_secondary_index {
    name            = "CandidateIndex"
    hash_key        = "candidateId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "JobIndex"
    hash_key        = "jobId"
    projection_type = "ALL"
  }
}

# 7. CompletedJobs Table
resource "aws_dynamodb_table" "completed_jobs" {
  name         = "CompletedJobs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "recordId"

  attribute {
    name = "recordId"
    type = "S"
  }

  attribute {
    name = "jobId"
    type = "S"
  }

  attribute {
    name = "candidateId"
    type = "S"
  }

  attribute {
    name = "employerId"
    type = "S"
  }

  global_secondary_index {
    name            = "JobIdIndex"
    hash_key        = "jobId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "CandidateIdIndex"
    hash_key        = "candidateId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "EmployerIdIndex"
    hash_key        = "employerId"
    projection_type = "ALL"
  }
}

# 8. PackageCatalog Table
resource "aws_dynamodb_table" "package_catalog" {
  name         = "PackageCatalog"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "packageId"

  attribute {
    name = "packageId"
    type = "S"
  }
}

# 9. PackageSubscriptions Table
resource "aws_dynamodb_table" "package_subscriptions" {
  name         = "PackageSubscriptions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subscriptionId"

  attribute {
    name = "subscriptionId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    projection_type = "ALL"
  }
}

# 10. Payments Table
resource "aws_dynamodb_table" "payments" {
  name         = "Payments"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "paymentId"

  attribute {
    name = "paymentId"
    type = "S"
  }

  attribute {
    name = "transferCode"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "TransferCodeIndex"
    hash_key        = "transferCode"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# 11. Notifications Table
resource "aws_dynamodb_table" "notifications" {
  name         = "Notifications"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "notificationId"

  attribute {
    name = "notificationId"
    type = "S"
  }

  attribute {
    name = "recipientId"
    type = "S"
  }

  attribute {
    name = "recipientRole"
    type = "S"
  }

  global_secondary_index {
    name            = "RecipientIndex"
    hash_key        = "recipientId"
    range_key       = "recipientRole"
    projection_type = "ALL"
  }
}

# 12. Banners Table
resource "aws_dynamodb_table" "banners" {
  name         = "Banners"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "bannerId"

  attribute {
    name = "bannerId"
    type = "S"
  }
}

# 13. CandidateExperiences Table
resource "aws_dynamodb_table" "candidate_experiences" {
  name         = "CandidateExperiences"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "candidateId"
  range_key    = "experienceId"

  attribute {
    name = "candidateId"
    type = "S"
  }

  attribute {
    name = "experienceId"
    type = "S"
  }
}

# 14. Feedbacks Table
resource "aws_dynamodb_table" "feedbacks" {
  name         = "Feedbacks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

# 15. Translations Table
resource "aws_dynamodb_table" "translations" {
  name         = "Translations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "textHash"
  range_key    = "langCode"

  attribute {
    name = "textHash"
    type = "S"
  }

  attribute {
    name = "langCode"
    type = "S"
  }
}

# 16. AdminWebSocketConnections Table
resource "aws_dynamodb_table" "admin_websocket_connections" {
  name         = "AdminWebSocketConnections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# 17. ChatConnections Table
resource "aws_dynamodb_table" "chat_connections" {
  name         = "ChatConnections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }
}

# 18. ChatConversations Table
resource "aws_dynamodb_table" "chat_conversations" {
  name         = "ChatConversations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "conversationId"

  attribute {
    name = "conversationId"
    type = "S"
  }
}

# 19. ChatMessages Table
resource "aws_dynamodb_table" "chat_messages" {
  name         = "ChatMessages"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "conversationId"
  range_key    = "createdAt"

  attribute {
    name = "conversationId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }
}

# 20. Payment Table (Legacy singular alias for Payments)
resource "aws_dynamodb_table" "payment_legacy" {
  name         = "Payment"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "paymentId"

  attribute {
    name = "paymentId"
    type = "S"
  }
}
