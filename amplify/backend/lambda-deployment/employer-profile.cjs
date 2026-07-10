// DynamoDB table definition for Employer Profiles
// This table stores company information for each employer user

const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');

/**
 * Employer Profile Table Schema
 * 
 * Primary Key: userId (String) - Cognito user ID
 * 
 * Attributes:
 * - userId: String (Primary Key) - Unique identifier from Cognito
 * - companyName: String - Company name
 * - email: String - Company email address
 * - phone: String - Company phone number
 * - address: String - Company address/location
 * - website: String - Company website URL
 * - industry: String - Industry/business type (F&B, Retail, etc.)
 * - companySize: String - Company size (1-10, 11-50, 51-200, 200+)
 * - foundedYear: String - Year company was founded
 * - description: String - Company description/about
 * - companyLogo: String - Base64 encoded logo image or S3 URL
 * - companyVideo: String - YouTube or video URL for company intro (optional)
 * - companyImages: List - Array of base64/S3 URL images showcasing the company (optional, max 5)
 * - taxCode: String - Business tax code (locked after first set)
 * - businessLicense: String - Business license number (locked after first set)
 * - createdAt: String - ISO timestamp when profile was created
 * - updatedAt: String - ISO timestamp when profile was last updated
 * - profileCompletion: Number - Percentage of profile completion (0-100)
 * - isActive: Boolean - Whether the profile is active
 * - isVerified: Boolean - Whether company is verified
 */

const tableName = process.env.EMPLOYER_PROFILE_TABLE || 'EmployerProfiles';

// Initialize DynamoDB client
const dynamoDb = DynamoDBDocument.from(new DynamoDB({
  region: process.env.AWS_REGION || 'ap-southeast-1'
}));

class EmployerProfileService {
  /**
   * Create new employer profile
   */
  async createProfile(profileData) {
    const timestamp = new Date().toISOString();
    
    const profile = {
      userId: profileData.userId,
      companyName: profileData.companyName || '',
      email: profileData.email,
      phone: profileData.phone || '',
      address: profileData.address || '',
      website: profileData.website || '',
      industry: profileData.industry || '',
      companySize: profileData.companySize || '',
      foundedYear: profileData.foundedYear || '',
      description: profileData.description || '',
      companyLogo: profileData.companyLogo || '',
      companyBanner: profileData.companyBanner || '',
      companyVideo: profileData.companyVideo || '',
      companyImages: profileData.companyImages || [],
      taxCode: profileData.taxCode || '',
      businessLicense: profileData.businessLicense || '',
      createdAt: timestamp,
      updatedAt: timestamp,
      profileCompletion: this.calculateCompletion(profileData),
      isActive: true,
      isVerified: false
    };

    await dynamoDb.put({
      TableName: tableName,
      Item: profile,
      ConditionExpression: 'attribute_not_exists(userId)'
    });

    return profile;
  }

  /**
   * Get employer profile by userId
   */
  async getProfile(userId) {
    const result = await dynamoDb.get({
      TableName: tableName,
      Key: { userId }
    });

    if (!result.Item) {
      throw new Error('No profile exists for this user ID');
    }

    return result.Item;
  }

  /**
   * Update employer profile
   */
  async updateProfile(userId, updates, currentProfile) {
    const timestamp = new Date().toISOString();
    
    // Fields that cannot be updated
    const { 
      userId: _,
      createdAt: __, 
      email: ___,
      profileCompletion: ____,
      updatedAt: _____,
      ...allowedUpdates 
    } = updates;

    // Check if taxCode or businessLicense are being changed (should be locked after first set)
    if (currentProfile.taxCode && updates.taxCode && updates.taxCode !== currentProfile.taxCode) {
      delete allowedUpdates.taxCode;
    }
    if (currentProfile.businessLicense && updates.businessLicense && updates.businessLicense !== currentProfile.businessLicense) {
      delete allowedUpdates.businessLicense;
    }

    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    let index = 0;
    for (const [key, value] of Object.entries(allowedUpdates)) {
      updateExpressions.push(`#field${index} = :value${index}`);
      expressionAttributeNames[`#field${index}`] = key;
      expressionAttributeValues[`:value${index}`] = value;
      index++;
    }

    // Add updatedAt
    const updatedAtIndex = index;
    updateExpressions.push(`#field${updatedAtIndex} = :value${updatedAtIndex}`);
    expressionAttributeNames[`#field${updatedAtIndex}`] = 'updatedAt';
    expressionAttributeValues[`:value${updatedAtIndex}`] = timestamp;

    // Add profileCompletion
    const completionIndex = updatedAtIndex + 1;
    updateExpressions.push(`#field${completionIndex} = :value${completionIndex}`);
    expressionAttributeNames[`#field${completionIndex}`] = 'profileCompletion';
    expressionAttributeValues[`:value${completionIndex}`] = this.calculateCompletion({
      ...currentProfile,
      ...allowedUpdates
    });

    const params = {
      TableName: tableName,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDb.update(params);
    return result.Attributes;
  }

  /**
   * Submit pending profile changes (for admin review)
   * This DOES NOT update the main profile immediately
   */
  async submitPendingChanges(userId, changes) {
    const crypto = require('crypto');
    const timestamp = new Date().toISOString();
    
    const pendingChanges = {
      requestId: crypto.randomUUID(),
      employerId: userId,
      changes: changes,
      status: 'PENDING_REVIEW',
      submittedAt: timestamp
    };

    // Store pending changes in the profile
    await dynamoDb.update({
      TableName: tableName,
      Key: { userId },
      UpdateExpression: 'SET pendingProfileChanges = :pending',
      ExpressionAttributeValues: {
        ':pending': pendingChanges
      },
      ReturnValues: 'ALL_NEW'
    });

    return pendingChanges;
  }

  /**
   * Get all pending profile change requests (Admin only)
   */
  async getAllPendingChanges() {
    const params = {
      TableName: tableName,
      FilterExpression: 'attribute_exists(pendingProfileChanges) AND pendingProfileChanges.#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'PENDING_REVIEW'
      }
    };

    const result = await dynamoDb.scan(params);
    
    return {
      requests: result.Items || []
    };
  }

  /**
   * Approve pending profile changes (Admin only)
   * Applies the pending changes to the main profile
   */
  async approvePendingChanges(userId) {
    // Get current profile with pending changes
    const profile = await this.getProfile(userId);
    
    if (!profile.pendingProfileChanges || profile.pendingProfileChanges.status !== 'PENDING_REVIEW') {
      throw new Error('No pending changes to approve');
    }

    const timestamp = new Date().toISOString();
    const changes = profile.pendingProfileChanges.changes;
    
    console.log('Approving changes for userId:', userId);
    console.log('Changes keys:', Object.keys(changes || {}));
    
    // Build update expression to apply changes and mark as approved
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    let index = 0;
    for (const [key, value] of Object.entries(changes)) {
      // Skip internal fields that shouldn't be overwritten directly
      if (key === 'userId' || key === 'createdAt' || key === 'pendingProfileChanges') {
        console.log(`Skipping protected field: ${key}`);
        continue;
      }
      
      updateExpressions.push(`#field${index} = :value${index}`);
      expressionAttributeNames[`#field${index}`] = key;
      expressionAttributeValues[`:value${index}`] = value;
      index++;
    }

    // Update pendingProfileChanges status to APPROVED
    const pendingIndex = index;
    updateExpressions.push(`#field${pendingIndex}.#status = :approved`);
    updateExpressions.push(`#field${pendingIndex}.#approvedAt = :timestamp`);
    expressionAttributeNames[`#field${pendingIndex}`] = 'pendingProfileChanges';
    expressionAttributeNames['#status'] = 'status';
    expressionAttributeNames['#approvedAt'] = 'approvedAt';
    expressionAttributeValues[':approved'] = 'APPROVED';
    expressionAttributeValues[':timestamp'] = timestamp;

    // Add updatedAt
    const updatedAtIndex = pendingIndex + 1;
    updateExpressions.push(`#field${updatedAtIndex} = :updatedAt`);
    expressionAttributeNames[`#field${updatedAtIndex}`] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = timestamp;

    // Recalculate profile completion with new values
    const completionIndex = updatedAtIndex + 1;
    updateExpressions.push(`#field${completionIndex} = :completion`);
    expressionAttributeNames[`#field${completionIndex}`] = 'profileCompletion';
    expressionAttributeValues[':completion'] = this.calculateCompletion({
      ...profile,
      ...changes
    });

    const params = {
      TableName: tableName,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamoDb.update(params);
      console.log('✅ Changes approved successfully');
      return result.Attributes;
    } catch (error) {
      console.error('❌ DynamoDB update failed:', error);
      throw error;
    }
  }

  /**
   * Reject pending profile changes (Admin only)
   * Marks the pending changes as rejected without applying them
   */
  async rejectPendingChanges(userId, rejectionReason = '') {
    // Get current profile
    const profile = await this.getProfile(userId);
    
    if (!profile.pendingProfileChanges || profile.pendingProfileChanges.status !== 'PENDING_REVIEW') {
      throw new Error('No pending changes to reject');
    }

    const timestamp = new Date().toISOString();

    // Update pendingProfileChanges status to REJECTED
    await dynamoDb.update({
      TableName: tableName,
      Key: { userId },
      UpdateExpression: 'SET pendingProfileChanges.#status = :rejected, pendingProfileChanges.#rejectedAt = :timestamp, pendingProfileChanges.#reason = :reason',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#rejectedAt': 'rejectedAt',
        '#reason': 'rejectionReason'
      },
      ExpressionAttributeValues: {
        ':rejected': 'REJECTED',
        ':timestamp': timestamp,
        ':reason': rejectionReason
      },
      ReturnValues: 'ALL_NEW'
    });

    return { success: true, message: 'Changes rejected' };
  }

  /**
   * Delete employer profile (soft delete)
   */
  async deleteProfile(userId) {
    await dynamoDb.update({
      TableName: tableName,
      Key: { userId },
      UpdateExpression: 'SET isActive = :false, updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':false': false,
        ':timestamp': new Date().toISOString()
      }
    });

    return { success: true };
  }

  /**
   * Calculate profile completion percentage
   */
  calculateCompletion(profileData) {
    let completion = 0;
    
    // Basic info (40% total - 10% each)
    if (profileData.companyName?.trim()) completion += 10;
    if (profileData.email?.trim()) completion += 10;
    if (profileData.phone?.trim()) completion += 10;
    if (profileData.address?.trim()) completion += 10;
    
    // Business info (30% total - 10% each)
    if (profileData.industry?.trim()) completion += 10;
    if (profileData.companySize?.trim()) completion += 10;
    if (profileData.description?.trim()) completion += 10;
    
    // Company logo (15%)
    if (profileData.companyLogo) completion += 15;
    
    // Website (5%)
    if (profileData.website?.trim()) completion += 5;
    
    // Legal documents (20% - 10% each)
    if (profileData.taxCode?.trim()) completion += 10;
    if (profileData.businessLicense?.trim()) completion += 10;
    
    return Math.min(completion, 100);
  }

  /**
   * List all active employer profiles
   */
  async listProfiles(limit = 50, lastEvaluatedKey = null) {
    const params = {
      TableName: tableName,
      FilterExpression: 'isActive = :true',
      ExpressionAttributeValues: {
        ':true': true
      },
      Limit: limit
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const result = await dynamoDb.scan(params);
    
    return {
      profiles: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey
    };
  }

  /**
   * List ALL employer profiles (Admin only - no filters)
   */
  async listAllProfiles() {
    const params = {
      TableName: tableName
    };

    const result = await dynamoDb.scan(params);
    
    return {
      profiles: result.Items || []
    };
  }

  /**
   * Update approval status (Admin only)
   */
  async updateApprovalStatus(userId, status, metadata = {}) {
    const timestamp = new Date().toISOString();
    
    const updateExpressions = ['approvalStatus = :status', 'updatedAt = :timestamp'];
    const expressionAttributeValues = {
      ':status': status,
      ':timestamp': timestamp
    };

    if (status === 'approved') {
      updateExpressions.push('approvedAt = :approvedAt');
      expressionAttributeValues[':approvedAt'] = metadata.approvedAt || timestamp;
    } else if (status === 'rejected') {
      updateExpressions.push('rejectedAt = :rejectedAt');
      expressionAttributeValues[':rejectedAt'] = metadata.rejectedAt || timestamp;
      
      if (metadata.rejectionReason) {
        updateExpressions.push('rejectionReason = :reason');
        expressionAttributeValues[':reason'] = metadata.rejectionReason;
      }
    }

    const params = {
      TableName: tableName,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDb.update(params);
    return result.Attributes;
  }

  /**
   * Update verification status (Admin only)
   */
  async updateVerificationStatus(userId, isVerified, metadata = {}) {
    const timestamp = new Date().toISOString();
    
    const updateExpressions = ['isVerified = :verified', 'updatedAt = :timestamp'];
    const expressionAttributeValues = {
      ':verified': isVerified,
      ':timestamp': timestamp
    };

    if (isVerified && metadata.verifiedAt) {
      updateExpressions.push('verifiedAt = :verifiedAt');
      expressionAttributeValues[':verifiedAt'] = metadata.verifiedAt;
    }

    const params = {
      TableName: tableName,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDb.update(params);
    return result.Attributes;
  }
}

module.exports = new EmployerProfileService();
