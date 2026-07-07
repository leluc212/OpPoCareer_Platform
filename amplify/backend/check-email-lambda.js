'use strict';
/**
 * check-email-provider Lambda
 * GET /auth/check-email?email=<email>
 *
 * Kiểm tra email có tồn tại trong Cognito User Pool không và provider là gì.
 * Không yêu cầu xác thực (NONE) — dùng trước khi đăng ký / đăng nhập.
 *
 * Response:
 *   { exists: false }
 *   { exists: true, provider: "google" }
 *   { exists: true, provider: "native" }
 */

const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const REGION        = process.env.AWS_REGION      || 'ap-southeast-1';
const USER_POOL_ID  = process.env.USER_POOL_ID    || 'ap-southeast-1_ShCajkmJd';

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

/* ── CORS (chỉ cho phép domain đã biết) ───────────────────────────────────── */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://oppocareer.com',
  'https://www.oppocareer.com',
];

function getCorsHeaders(requestOrigin) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : 'https://oppocareer.com';   // fallback cho production
  return {
    'Access-Control-Allow-Origin':  origin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
}

function res(statusCode, body, corsHeaders) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

/* ── Email validation ─────────────────────────────────────────────────────── */
function isValidEmail(email) {
  // RFC 5322 simplified — đủ cho production
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Handler ──────────────────────────────────────────────────────────────── */
exports.handler = async (event) => {
  // HTTP API v2 (apigatewayv2) — lấy method & origin
  const requestContext = event.requestContext || {};
  const httpCtx        = requestContext.http   || {};
  const method         = (event.httpMethod || httpCtx.method || 'GET').toUpperCase();
  const requestOrigin  = (event.headers || {})['origin'] || (event.headers || {})['Origin'] || '';
  const corsHeaders    = getCorsHeaders(requestOrigin);

  // Preflight
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (method !== 'GET') {
    return res(405, { error: 'Method not allowed' }, corsHeaders);
  }

  // Đọc query param email
  const qs    = event.queryStringParameters || {};
  const email = (qs.email || '').trim().toLowerCase();

  if (!email) {
    return res(400, { error: 'email query param is required' }, corsHeaders);
  }

  if (!isValidEmail(email)) {
    return res(400, { error: 'Invalid email format' }, corsHeaders);
  }

  try {
    // Tìm user theo email attribute
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter:     `email = "${email}"`,
      Limit:      5,   // lấy tối đa 5 để handle edge case có nhiều kết quả
    });

    const response = await cognitoClient.send(command);
    const users    = response.Users || [];

    if (users.length === 0) {
      return res(200, { exists: false }, corsHeaders);
    }

    // Xác định provider: username bắt đầu bằng "Google_" → Google
    // Một email có thể có nhiều user nếu đã link — ưu tiên kiểm tra native trước
    let hasNative = false;
    let hasGoogle = false;

    for (const u of users) {
      const username = (u.Username || '').toLowerCase();
      if (username.startsWith('google_')) {
        hasGoogle = true;
      } else {
        hasNative = true;
      }
    }

    if (hasNative) {
      // Native account tồn tại — ưu tiên native khi có cả hai
      return res(200, { exists: true, provider: 'native' }, corsHeaders);
    }

    return res(200, { exists: true, provider: 'google' }, corsHeaders);

  } catch (err) {
    console.error('check-email-lambda error:', err);
    return res(500, { error: 'Internal server error' }, corsHeaders);
  }
};
