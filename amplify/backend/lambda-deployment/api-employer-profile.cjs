// API Gateway Lambda handler for Employer Profile operations
const employerProfileService = require('./employer-profile.cjs');
const jwt = require('jsonwebtoken');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({ region: 'ap-southeast-1' });
const VERIFICATION_BUCKET = 'opporeview-cv-storage';
const VERIFICATION_PREFIX = 'employer-verification';

/**
 * Extract userId from JWT token
 */
const getUserIdFromToken = (event) => {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    console.log('Auth header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader) {
      console.log('No auth token provided');
      return null;
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format');
      return null;
    }

    const token = authHeader.substring(7);
    console.log('Token length:', token.length);
    
    // Decode without verification (JWT is already verified by API Gateway if using authorizer)
    const decoded = jwt.decode(token);
    console.log('Decoded token sub:', decoded?.sub);
    
    return decoded?.sub;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * CORS headers
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  try {
    const userId = getUserIdFromToken(event);
    let pathUserId = event.pathParameters?.userId;

    // Fallback parsing for API Gateway wildcard proxy routing
    if (!pathUserId && event.path) {
      if (event.path.includes('/admin/employers/')) {
        const parts = event.path.split('/');
        const empIndex = parts.indexOf('employers');
        if (empIndex !== -1 && parts.length > empIndex + 1) {
          pathUserId = parts[empIndex + 1];
          console.log('Parsed pathUserId from event.path (admin):', pathUserId);
        }
      } else if (event.path.includes('/profile/')) {
        const parts = event.path.split('/');
        const profIndex = parts.indexOf('profile');
        if (profIndex !== -1 && parts.length > profIndex + 1) {
          pathUserId = parts[profIndex + 1];
          console.log('Parsed pathUserId from event.path (profile):', pathUserId);
        }
      }
    }
    const httpMethod = event.httpMethod;

    console.log('Request:', { httpMethod, userId, pathUserId, rawPath: event.path });

    // If no userId from token, return 401
    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: false, 
          message: 'Unauthorized - no valid token' 
        })
      };
    }

    // GET /admin/employers - List all employers (Admin only)
    if (httpMethod === 'GET' && (event.path === '/admin/employers' || event.path?.endsWith('/admin/employers'))) {
      const result = await employerProfileService.listAllProfiles();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: result.profiles })
      };
    }

    // POST /admin/employers/{userId}/approve
    if (httpMethod === 'POST' && pathUserId && event.path?.endsWith('/approve')) {
      const body = JSON.parse(event.body || '{}');
      // Approve = set approvalStatus AND isVerified so employer can post jobs / view CVs
      const result = await employerProfileService.updateApprovalStatus(pathUserId, 'approved', body);
      // Also flip isVerified if the request carries it (or always set true on approve)
      const { DynamoDB } = require('@aws-sdk/client-dynamodb');
      const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
      const ddb = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-1' }));
      await ddb.update({
        TableName: 'EmployerProfiles',
        Key: { userId: pathUserId },
        UpdateExpression: 'SET isVerified = :v, verifiedAt = :t, verificationStatus = :vs, updatedAt = :t',
        ExpressionAttributeValues: {
          ':v': true,
          ':vs': 'approved',
          ':t': new Date().toISOString()
        }
      });
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: result })
      };
    }

    // POST /admin/employers/{userId}/reject
    if (httpMethod === 'POST' && pathUserId && event.path?.endsWith('/reject')) {
      const body = JSON.parse(event.body || '{}');
      // Reject = set approvalStatus AND revoke isVerified
      const result = await employerProfileService.updateApprovalStatus(pathUserId, 'rejected', body);
      const { DynamoDB } = require('@aws-sdk/client-dynamodb');
      const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
      const ddb = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-1' }));
      await ddb.update({
        TableName: 'EmployerProfiles',
        Key: { userId: pathUserId },
        UpdateExpression: 'SET isVerified = :v, verificationStatus = :vs, updatedAt = :t',
        ExpressionAttributeValues: {
          ':v': false,
          ':vs': 'rejected',
          ':t': new Date().toISOString()
        }
      });
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: result })
      };
    }

    // POST /admin/employers/{userId}/verify
    if (httpMethod === 'POST' && pathUserId && event.path?.endsWith('/verify')) {
      const body = JSON.parse(event.body || '{}');
      const result = await employerProfileService.updateVerificationStatus(pathUserId, body.isVerified, body);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: result })
      };
    }

    // POST /admin/employers/{userId}/quick-job-status
    if (httpMethod === 'POST' && pathUserId && event.path?.endsWith('/quick-job-status')) {
      const body = JSON.parse(event.body || '{}');
      const { DynamoDB } = require('@aws-sdk/client-dynamodb');
      const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
      const ddb = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-1' }));
      
      const result = await ddb.update({
        TableName: 'EmployerProfiles',
        Key: { userId: pathUserId },
        UpdateExpression: 'SET quickJobStatus = :qs, updatedAt = :ua',
        ExpressionAttributeValues: {
          ':qs': body.quickJobStatus,
          ':ua': body.updatedAt || new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      });
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: result.Attributes })
      };
    }

    // GET /profile/{userId}/verification - Get verification data
    if (httpMethod === 'GET' && pathUserId && event.path?.endsWith('/verification')) {
      try {
        const profile = await employerProfileService.getProfile(pathUserId);
        const verificationData = profile.verificationData || null;
        const submittedAt = profile.verificationSubmittedAt || null;
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            data: verificationData ? { verificationData, submittedAt, status: profile.verificationStatus || 'pending' } : null
          })
        };
      } catch (error) {
        if (error.message.includes('No profile exists')) {
          return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ success: false, data: null }) };
        }
        throw error;
      }
    }

    // POST /profile/{userId}/verification/upload-url - Get presigned S3 upload URL
    if (httpMethod === 'POST' && pathUserId && event.path?.endsWith('/verification/upload-url')) {
      if (userId !== pathUserId) {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Access denied' }) };
      }
      const body = JSON.parse(event.body || '{}');
      const { fileName, fileType, field } = body;
      if (!fileName || !fileType || !field) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'fileName, fileType, field required' }) };
      }
      const allowedFields = ['businessLicense', 'idFrontImage', 'idBackImage', 'authorizationLetter'];
      if (!allowedFields.includes(field)) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Invalid field' }) };
      }
      const ext = fileName.split('.').pop() || 'bin';
      const s3Key = `${VERIFICATION_PREFIX}/${pathUserId}/${field}-${Date.now()}.${ext}`;
      const command = new PutObjectCommand({
        Bucket: VERIFICATION_BUCKET,
        Key: s3Key,
        ContentType: fileType
      });
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
      const fileUrl = `https://${VERIFICATION_BUCKET}.s3.ap-southeast-1.amazonaws.com/${s3Key}`;
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: { uploadUrl, fileUrl, s3Key } })
      };
    }

    // POST /profile/{userId}/verification - Submit verification
    if (httpMethod === 'POST' && pathUserId && event.path?.endsWith('/verification')) {
      if (userId !== pathUserId) {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Access denied' }) };
      }
      const body = JSON.parse(event.body || '{}');

      // Strip base64 image data — only store S3 URLs / metadata to keep DynamoDB item small
      const stripBase64 = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const clean = {};
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === 'string' && v.length > 500 && (v.startsWith('data:') || /^[A-Za-z0-9+/]{100}/.test(v))) {
            clean[k] = '[base64-stripped]';
          } else if (v && typeof v === 'object' && !Array.isArray(v)) {
            clean[k] = stripBase64(v);
          } else {
            clean[k] = v;
          }
        }
        return clean;
      };

      const safeVerificationData = stripBase64(body.verificationData);
      const { DynamoDB } = require('@aws-sdk/client-dynamodb');
      const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
      const ddb = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-1' }));
      await ddb.update({
        TableName: 'EmployerProfiles',
        Key: { userId: pathUserId },
        UpdateExpression: 'SET verificationData = :vd, verificationStatus = :vs, verificationSubmittedAt = :sa, updatedAt = :ua',
        ExpressionAttributeValues: {
          ':vd': safeVerificationData,
          ':vs': 'pending',
          ':sa': body.submittedAt || new Date().toISOString(),
          ':ua': new Date().toISOString()
        }
      });
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, data: { status: 'pending' } }) };
    }

    // GET /profile/{userId} - Get profile
    if (httpMethod === 'GET' && pathUserId) {
      try {
        const profile = await employerProfileService.getProfile(pathUserId);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: true, 
            data: profile 
          })
        };
      } catch (error) {
        if (error.message.includes('No profile exists')) {
          return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ 
              success: false, 
              message: error.message 
            })
          };
        }
        throw error;
      }
    }

    // POST /profile - Create new profile
    if (httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      // Use userId from token
      body.userId = userId;
      
      const profile = await employerProfileService.createProfile(body);
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: true, 
          data: profile 
        })
      };
    }

    // PUT /profile/{userId} - Update profile
    if (httpMethod === 'PUT' && pathUserId) {
      // Verify user is updating their own profile
      if (userId !== pathUserId) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            message: 'Access denied - can only update own profile' 
          })
        };
      }

      const body = JSON.parse(event.body || '{}');
      
      // Get current profile first
      let currentProfile;
      try {
        currentProfile = await employerProfileService.getProfile(userId);
      } catch (error) {
        // If profile doesn't exist, create it
        if (error.message.includes('No profile exists')) {
          body.userId = userId;
          const newProfile = await employerProfileService.createProfile(body);
          return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({ 
              success: true, 
              data: newProfile 
            })
          };
        }
        throw error;
      }
      
      const updatedProfile = await employerProfileService.updateProfile(
        userId, 
        body,
        currentProfile
      );
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: true, 
          data: updatedProfile 
        })
      };
    }

    // DELETE /profile/{userId} - Soft delete profile
    if (httpMethod === 'DELETE' && pathUserId) {
      // Verify user can only delete their own profile
      if (userId !== pathUserId) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            message: 'Access denied' 
          })
        };
      }

      await employerProfileService.deleteProfile(userId);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: true, 
          message: 'Profile deleted successfully' 
        })
      };
    }

    // Invalid route
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: false, 
        message: 'Route not found' 
      })
    };

  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: false, 
        message: error.message || 'Internal server error' 
      })
    };
  }
};
