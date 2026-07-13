// API Gateway Lambda handler for Employer Profile operations
const employerProfileService = require('./employer-profile.cjs');
const jwt = require('jsonwebtoken');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const s3Client = new S3Client({ region: 'ap-southeast-1' });
const sesClient = new SESClient({ region: 'ap-southeast-1' });
const cognitoClient = new CognitoIdentityProviderClient({ region: 'ap-southeast-1' });

/**
 * Fetch registered email from Cognito
 */
const getCognitoEmail = async (username) => {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: 'ap-southeast-1_ShCajkmJd',
      Username: username
    });
    const userDetails = await cognitoClient.send(command);
    const emailAttr = userDetails.UserAttributes.find(attr => attr.Name === 'email');
    return emailAttr ? emailAttr.Value : null;
  } catch (err) {
    console.error('Error fetching Cognito email:', err);
    return null;
  }
};

/**
 * Send business verification email via AWS SES
 */
const sendVerificationEmail = async (employerEmail, cognitoEmail, companyName) => {
  const recipients = [];
  if (employerEmail && employerEmail.trim()) {
    recipients.push(employerEmail.trim());
  }
  if (cognitoEmail && cognitoEmail.trim() && !recipients.includes(cognitoEmail.trim())) {
    recipients.push(cognitoEmail.trim());
  }

  if (recipients.length === 0) {
    console.log('No recipient emails found to send verification notification.');
    return;
  }

  const subject = `🔔 [OpPoReview] Chúc mừng! Doanh nghiệp ${companyName} đã được xác minh thành công`;
  
  const htmlBody = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #10b981; margin: 0;">Ốp Pờ - Nền Tảng Tuyển Dụng</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Xác Minh Doanh Nghiệp Thành Công</p>
        </div>
        
        <p>Xin chào quý đối tác,</p>
        
        <p>Chúng tôi xin trân trọng thông báo rằng tài khoản doanh nghiệp <strong>${companyName}</strong> đã được Ban quản trị hệ thống <strong>xác minh chính thức thành công</strong>.</p>
        
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Quyền lợi của tài khoản đã xác minh:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Đăng tin tuyển dụng không giới hạn.</li>
            <li>Xem đầy đủ thông tin hồ sơ ứng viên (CV).</li>
            <li>Độ tin cậy cao hơn, thu hút nhiều ứng viên ứng tuyển.</li>
          </ul>
        </div>
        
        <p>Quý khách hiện có thể đăng nhập vào hệ thống và bắt đầu đăng bài tuyển dụng ngay lập tức.</p>
        
        <div style="text-align: center; margin-top: 32px; margin-bottom: 24px;">
          <a href="https://opporeview.com/employer/jobs" style="background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">Truy cập trang tuyển dụng</a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          Email này được gửi tự động từ hệ thống OpPoReview. Vui lòng không phản hồi email này.<br />
          Bộ phận hỗ trợ tuyển dụng: <strong>tuyendung.oppo@oppocareer.com</strong>
        </p>
      </body>
    </html>
  `;

  try {
    const command = new SendEmailCommand({
      Source: 'tuyendung.oppo@oppocareer.com',
      Destination: {
        ToAddresses: recipients
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8'
          }
        }
      }
    });

    const sendResult = await sesClient.send(command);
    console.log(`✅ Email sent successfully to ${recipients.join(', ')}. MessageId: ${sendResult.MessageId}`);
  } catch (err) {
    console.error('❌ Error sending verification email via SES:', err);
  }
};
const VERIFICATION_BUCKET = 'opporeview-cv-storage';
const VERIFICATION_PREFIX = 'employer-verification';
const COMPANY_IMAGES_PREFIX = 'employer-images';

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

      // Send Verification Email
      try {
        const profile = await employerProfileService.getProfile(pathUserId);
        const cognitoEmail = await getCognitoEmail(pathUserId);
        await sendVerificationEmail(profile.email, cognitoEmail, profile.companyName || 'Doanh nghiệp');
      } catch (emailErr) {
        console.error('Error in sendVerificationEmail flow (approve):', emailErr);
      }

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

      // Send Verification Email if isVerified is true
      if (body.isVerified) {
        try {
          const profile = await employerProfileService.getProfile(pathUserId);
          const cognitoEmail = await getCognitoEmail(pathUserId);
          await sendVerificationEmail(profile.email, cognitoEmail, profile.companyName || 'Doanh nghiệp');
        } catch (emailErr) {
          console.error('Error in sendVerificationEmail flow (verify):', emailErr);
        }
      }

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
          // Return 200 with null data — no profile yet is a normal state for new users
          return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, data: null }) };
        }
        throw error;
      }
    }

    // POST /profile/{userId}/image-upload-url - Get presigned S3 upload URL for logo/banner/images
    if (httpMethod === 'POST' && pathUserId && event.path?.endsWith('/image-upload-url')) {
      if (userId !== pathUserId) {
        return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Access denied' }) };
      }
      const body = JSON.parse(event.body || '{}');
      const { fileName, fileType, field } = body;
      if (!fileName || !fileType || !field) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'fileName, fileType, field required' }) };
      }
      const allowedFields = ['companyLogo', 'companyBanner', 'companyImage'];
      if (!allowedFields.includes(field)) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, message: 'Invalid field. Must be companyLogo, companyBanner, or companyImage' }) };
      }
      const ext = fileName.split('.').pop() || 'bin';
      const s3Key = `${COMPANY_IMAGES_PREFIX}/${pathUserId}/${field}-${Date.now()}.${ext}`;
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

    // GET /admin/employers/pending-changes - Get all pending profile change requests (Admin only)
    // PHẢI đứng trước GET /profile/{userId} vì {proxy+} parse pathUserId = "pending-changes"
    if (httpMethod === 'GET' && (event.path === '/admin/employers/pending-changes' || event.path?.endsWith('/admin/employers/pending-changes'))) {
      const result = await employerProfileService.getAllPendingChanges();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, data: result.requests })
      };
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

    // POST /profile - Create new profile (only when no pathUserId)
    if (httpMethod === 'POST' && !pathUserId) {
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

    // PUT /profile/{userId}/submit-changes - Submit pending changes for admin review (NEW)
    if (httpMethod === 'PUT' && pathUserId && event.path?.endsWith('/submit-changes')) {
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
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            message: 'Profile not found. Please create profile first.' 
          })
        };
      }

      // Check if there's already a pending request
      if (currentProfile.pendingProfileChanges && currentProfile.pendingProfileChanges.status === 'PENDING_REVIEW') {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            message: 'Đang có yêu cầu chỉnh sửa chờ duyệt' 
          })
        };
      }
      
      // Submit pending changes (does not update main profile)
      const pendingChanges = await employerProfileService.submitPendingChanges(userId, body.changes);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: true, 
          message: 'Đã gửi yêu cầu chỉnh sửa hồ sơ. Nội dung sẽ được cập nhật sau khi admin duyệt.',
          data: pendingChanges 
        })
      };
    }

    // POST /admin/employers/{userId}/approve-changes - Approve pending profile changes (Admin only)
    if (httpMethod === 'POST' && pathUserId && event.path?.endsWith('/approve-changes')) {
      try {
        const result = await employerProfileService.approvePendingChanges(pathUserId);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: true, 
            message: 'Yêu cầu chỉnh sửa hồ sơ đã được duyệt',
            data: result 
          })
        };
      } catch (error) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            message: error.message 
          })
        };
      }
    }

    // POST /admin/employers/{userId}/reject-changes - Reject pending profile changes (Admin only)
    if (httpMethod === 'POST' && pathUserId && event.path?.endsWith('/reject-changes')) {
      const body = JSON.parse(event.body || '{}');
      try {
        const result = await employerProfileService.rejectPendingChanges(pathUserId, body.rejectionReason || '');
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: true, 
            message: 'Yêu cầu chỉnh sửa hồ sơ đã bị từ chối',
            data: result 
          })
        };
      } catch (error) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            message: error.message 
          })
        };
      }
    }

    // PUT /profile/{userId} - Update profile (LEGACY - direct update, kept for compatibility)
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
