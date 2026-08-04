locals {
  dynamodb_tables = {
    Banners = {
      hash_key   = "bannerId"
      attributes = { bannerId = "S" }
    }
    CandidateExperiences = {
      hash_key   = "candidateId"
      range_key  = "experienceId"
      attributes = { candidateId = "S", experienceId = "S" }
    }
    CandidateProfiles = {
      hash_key         = "userId"
      stream_enabled   = true
      stream_view_type = "NEW_AND_OLD_IMAGES"
      attributes       = { userId = "S", email = "S" }
      global_secondary_indexes = {
        EmailIndex = { hash_key = "email", projection_type = "ALL" }
      }
    }
    ChatConnections = {
      hash_key   = "connectionId"
      attributes = { connectionId = "S", conversationId = "S" }
      global_secondary_indexes = {
        ConversationIndex = { hash_key = "conversationId", projection_type = "ALL" }
      }
    }
    ChatConversations = {
      hash_key   = "conversationId"
      attributes = { conversationId = "S", candidateId = "S", employerId = "S" }
      global_secondary_indexes = {
        CandidateIndex = { hash_key = "candidateId", projection_type = "ALL" }
        EmployerIndex  = { hash_key = "employerId", projection_type = "ALL" }
      }
    }
    ChatMessages = {
      hash_key   = "conversationId"
      range_key  = "createdAt"
      attributes = { conversationId = "S", createdAt = "S" }
    }
    CompletedJobs = {
      hash_key   = "recordId"
      attributes = { recordId = "S", jobId = "S", candidateId = "S", employerId = "S" }
      global_secondary_indexes = {
        JobIdIndex       = { hash_key = "jobId", projection_type = "ALL" }
        CandidateIdIndex = { hash_key = "candidateId", projection_type = "ALL" }
        EmployerIdIndex  = { hash_key = "employerId", projection_type = "ALL" }
      }
    }
    EmployerProfiles = {
      hash_key   = "userId"
      attributes = { userId = "S", email = "S" }
      global_secondary_indexes = {
        EmailIndex = { hash_key = "email", projection_type = "ALL" }
      }
    }
    Feedbacks = {
      hash_key   = "id"
      attributes = { id = "S" }
    }
    Notifications = {
      billing_mode   = "PROVISIONED"
      read_capacity  = 5
      write_capacity = 5
      hash_key       = "notificationId"
      attributes     = { notificationId = "S", recipientId = "S", recipientRole = "S", recipientStatus = "S", createdAt = "S", idempotencyKey = "S" }
      global_secondary_indexes = {
        RecipientIndex       = { hash_key = "recipientId", range_key = "recipientRole", projection_type = "ALL", read_capacity = 5, write_capacity = 5 }
        RecipientStatusIndex = { hash_key = "recipientStatus", range_key = "createdAt", projection_type = "ALL", read_capacity = 5, write_capacity = 5 }
        IdempotencyIndex     = { hash_key = "idempotencyKey", projection_type = "ALL", read_capacity = 5, write_capacity = 5 }
      }
    }
    OpPoWebTable = {
      hash_key   = "pk"
      attributes = { pk = "S" }
    }
    OppoAuthOtp = {
      hash_key      = "email"
      attributes    = { email = "S" }
      ttl_attribute = "expires_at_epoch"
    }
    PackageCatalog = {
      hash_key   = "packageId"
      attributes = { packageId = "S" }
    }
    PackageSubscriptions = {
      hash_key   = "subscriptionId"
      attributes = { subscriptionId = "S", status = "S", employerId = "S", purchaseDate = "S" }
      global_secondary_indexes = {
        StatusIndex   = { hash_key = "status", projection_type = "ALL" }
        EmployerIndex = { hash_key = "employerId", range_key = "purchaseDate", projection_type = "ALL" }
      }
    }
    Payment = {
      hash_key      = "paymentId"
      attributes    = { paymentId = "S", transferCode = "S", userId = "S" }
      ttl_attribute = "ttl"
      global_secondary_indexes = {
        TransferCodeIndex = { hash_key = "transferCode", projection_type = "ALL" }
        UserIdIndex       = { hash_key = "userId", projection_type = "ALL" }
      }
    }
    PostQuickJob = {
      hash_key   = "jobID"
      attributes = { jobID = "S", employerId = "S", status = "S", createdAt = "S" }
      global_secondary_indexes = {
        StatusIndex   = { hash_key = "status", range_key = "createdAt", projection_type = "ALL" }
        EmployerIndex = { hash_key = "employerId", range_key = "createdAt", projection_type = "ALL" }
      }
    }
    PostStandardJob = {
      hash_key   = "idJob"
      attributes = { idJob = "S", employerId = "S", status = "S", createdAt = "S" }
      global_secondary_indexes = {
        StatusIndex   = { hash_key = "status", range_key = "createdAt", projection_type = "ALL" }
        EmployerIndex = { hash_key = "employerId", range_key = "createdAt", projection_type = "ALL" }
      }
    }
    StandardApplications = {
      hash_key   = "applicationId"
      attributes = { applicationId = "S", candidateId = "S", jobId = "S", employerId = "S" }
      global_secondary_indexes = {
        CandidateIndex = { hash_key = "candidateId", projection_type = "ALL" }
        JobIndex       = { hash_key = "jobId", projection_type = "ALL" }
        EmployerIndex  = { hash_key = "employerId", projection_type = "ALL" }
      }
    }
    Translations = {
      hash_key   = "textHash"
      range_key  = "langCode"
      attributes = { textHash = "S", langCode = "S" }
    }
    WithdrawalRequests = {
      hash_key   = "requestId"
      attributes = { requestId = "S" }
    }
  }
}

resource "aws_dynamodb_table" "legacy" {
  for_each     = local.dynamodb_tables
  name         = each.key
  billing_mode = try(each.value.billing_mode, "PAY_PER_REQUEST")
  hash_key     = each.value.hash_key
  range_key    = try(each.value.range_key, null)

  read_capacity  = try(each.value.billing_mode, "PAY_PER_REQUEST") == "PROVISIONED" ? try(each.value.read_capacity, 5) : null
  write_capacity = try(each.value.billing_mode, "PAY_PER_REQUEST") == "PROVISIONED" ? try(each.value.write_capacity, 5) : null

  stream_enabled   = try(each.value.stream_enabled, false)
  stream_view_type = try(each.value.stream_view_type, null)

  dynamic "attribute" {
    for_each = each.value.attributes
    content {
      name = attribute.key
      type = attribute.value
    }
  }

  dynamic "global_secondary_index" {
    for_each = try(each.value.global_secondary_indexes, {})
    content {
      name            = global_secondary_index.key
      hash_key        = global_secondary_index.value.hash_key
      range_key       = try(global_secondary_index.value.range_key, null)
      projection_type = global_secondary_index.value.projection_type
      read_capacity   = try(each.value.billing_mode, "PAY_PER_REQUEST") == "PROVISIONED" ? try(global_secondary_index.value.read_capacity, 5) : null
      write_capacity  = try(each.value.billing_mode, "PAY_PER_REQUEST") == "PROVISIONED" ? try(global_secondary_index.value.write_capacity, 5) : null
    }
  }

  dynamic "ttl" {
    for_each = try(each.value.ttl_attribute, null) == null ? [] : [each.value.ttl_attribute]
    content {
      attribute_name = ttl.value
      enabled        = true
    }
  }
}

resource "aws_dynamodb_table" "applications_us_east_1" {
  provider       = aws.us_east_1
  name           = "Applications"
  billing_mode   = "PROVISIONED"
  hash_key       = "applicationId"
  read_capacity  = 5
  write_capacity = 5

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

  attribute {
    name = "appliedAt"
    type = "S"
  }

  global_secondary_index {
    name            = "CandidateIndex"
    hash_key        = "candidateId"
    range_key       = "appliedAt"
    projection_type = "ALL"
    read_capacity   = 5
    write_capacity  = 5
  }

  global_secondary_index {
    name            = "JobIndex"
    hash_key        = "jobId"
    range_key       = "appliedAt"
    projection_type = "ALL"
    read_capacity   = 5
    write_capacity  = 5
  }
}
