// @ts-check
'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'ap-southeast-1';
const PAYMENTS_TABLE = (process.env.PAYMENTS_TABLE || 'Payment').trim();
const EMPLOYERS_TABLE = (process.env.EMPLOYERS_TABLE || 'EmployerProfiles').trim();
const USER_PACKAGES_TABLE = (process.env.USER_PACKAGES_TABLE || 'PackageSubscriptions').trim();

// VietQR config — set via env vars
const BANK_ID = process.env.VIETQR_BANK_ID || 'MB';
const ACCOUNT_NO = process.env.VIETQR_ACCOUNT_NO || '0123456789';
const ACCOUNT_NAME = process.env.VIETQR_ACCOUNT_NAME || 'CONG%20TY%20OP%20PO';

// SePay webhook secret (can also be retrieved from AWS Secrets Manager 'opporeview/sepay')
// const SEPAY_SECRET = process.env.SEPAY_WEBHOOK_SECRET || '';

const client = new DynamoDBClient({ region: REGION });
const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

/** @param {number} ms */
// @ts-ignore
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Generate unique transfer code: OPPO_xxxxxxxx (8 hex chars)
 * @returns {string}
 */
function generateTransferCode() {
  const hex = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0');
  return `OPPO_${hex}`;
}

/**
 * Build VietQR URL
 * @param {number} amount
 * @param {string} transferCode
 * @returns {string}
 */
function buildQrUrl(amount, transferCode) {
  const info = encodeURIComponent(transferCode);
  return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${info}&accountName=${ACCOUNT_NAME}`;
}

/**
 * CORS headers
 */
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json',
};

/**
 * @param {number} status
 * @param {object} body
 */
const res = (status, body) => ({
  statusCode: status,
  headers: cors,
  body: JSON.stringify(body),
});

let secretsCache = {};

/**
 * @param {string} secretName
 * @param {string} keyName
 */
async function getSecret(secretName, keyName) {
  // @ts-ignore
  if (secretsCache[secretName]) {
    // @ts-ignore
    const val = secretsCache[secretName];
    return keyName && typeof val === 'object' ? val[keyName] : val;
  }
  try {
    // @ts-ignore
    const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
    const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
    const response = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
    let secretVal = response.SecretString;
    try {
      secretVal = JSON.parse(secretVal);
    } catch (err) {
      // not JSON
    }
    // @ts-ignore
    secretsCache[secretName] = secretVal;
    return keyName && typeof secretVal === 'object' ? secretVal[keyName] : secretVal;
  } catch (err) {
    // @ts-ignore
    console.error(`[SecretsManager] Error loading secret ${secretName}:`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────
exports.handler = async (/** @type {{ httpMethod: any; requestContext: { http: { method: any; }; }; path: any; rawPath: any; }} */ event) => {
  const method = (event.httpMethod || event.requestContext?.http?.method || 'GET').toUpperCase();
  const rawPath = event.path || event.rawPath || '/';

  // Strip stage prefix
  const segments = rawPath.split('/').filter(Boolean);
  if (['prod', 'dev', 'test'].includes(segments[0])) segments.shift();
  const path = '/' + segments.join('/');

  if (method === 'OPTIONS') return res(200, {});

  try {
    // POST /payments — create payment intent
    if (method === 'POST' && path === '/payments') {
      // @ts-ignore
      return await createPayment(event);
    }

    // GET /payments/:paymentId — poll status
    if (method === 'GET' && path.startsWith('/payments/')) {
      const paymentId = segments[segments.length - 1];
      return await getPayment(paymentId);
    }

    // POST /payment/webhook — SePay webhook
    if (method === 'POST' && (path === '/payment/webhook' || path === '/payments/webhook')) {
      // @ts-ignore
      return await handleWebhook(event);
    }

    return res(404, { error: `Route not found: ${method} ${path}` });
  } catch (err) {
    console.error('Unhandled error:', err);
    // @ts-ignore
    return res(500, { error: err.message || 'Internal server error' });
  }
};

// ─────────────────────────────────────────────
// CREATE PAYMENT
// ─────────────────────────────────────────────
/**
 * @param {{ body: any; }} event
 */
async function createPayment(event) {
  const body = JSON.parse(event.body || '{}');
  const { userId, packageId, amount, packageName, duration } = body;

  if (!userId || !packageId || !amount) {
    return res(400, { error: 'Missing required fields: userId, packageId, amount' });
  }

  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return res(400, { error: 'Invalid amount' });
  }

  const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const transferCode = generateTransferCode();
  const now = new Date().toISOString();
  // TTL: 24 hours from now (for pending payments)
  const ttl = Math.floor(Date.now() / 1000) + 86400;

  const item = {
    paymentId,
    userId,
    packageId,
    packageName: packageName || '',
    duration: duration || '',
    amount: numAmount,
    transferCode,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    ttl,
  };

  await db.send(new PutCommand({
    TableName: PAYMENTS_TABLE,
    Item: item,
    ConditionExpression: 'attribute_not_exists(paymentId)',
  }));

  const qrUrl = buildQrUrl(numAmount, transferCode);

  console.log(`✅ Payment created: ${paymentId} | code: ${transferCode} | amount: ${numAmount}`);

  return res(201, {
    success: true,
    data: {
      paymentId,
      transferCode,
      amount: numAmount,
      qrUrl,
      status: 'pending',
      bankId: BANK_ID,
      accountNo: ACCOUNT_NO,
      accountName: decodeURIComponent(ACCOUNT_NAME),
    },
  });
}

// ─────────────────────────────────────────────
// GET PAYMENT STATUS (for polling)
// ─────────────────────────────────────────────
/**
 * @param {any} paymentId
 */
async function getPayment(paymentId) {
  if (!paymentId) return res(400, { error: 'Missing paymentId' });

  const result = await db.send(new GetCommand({
    TableName: PAYMENTS_TABLE,
    Key: { paymentId },
  }));

  if (!result.Item) return res(404, { error: 'Payment not found' });

  const { status, amount, transferCode, paidAt, transactionId, packageId } = result.Item;
  return res(200, {
    success: true,
    data: { paymentId, status, amount, transferCode, paidAt, transactionId, packageId },
  });
}

// ─────────────────────────────────────────────
// WEBHOOK — SePay
// ─────────────────────────────────────────────
/**
 * @param {{ headers: { [x: string]: any; }; body: any; }} event
 */
async function handleWebhook(event) {
  // Verify SePay API Key header
  const sepaySecret = process.env.SEPAY_WEBHOOK_SECRET || await getSecret('opporeview/sepay', 'SEPAY_WEBHOOK_SECRET') || '';
  if (sepaySecret) {
    const authHeader = event.headers?.['Authorization'] || event.headers?.['authorization'] || '';
    // SePay sends: Authorization: Apikey YOUR_KEY
    const incoming = authHeader.replace(/^Apikey\s+/i, '').trim();
    if (incoming !== sepaySecret) {
      console.warn('⚠️ Invalid SePay API Key');
      return res(401, { error: 'Unauthorized' });
    }
  }

  const body = JSON.parse(event.body || '{}');
  console.log('📥 SePay webhook payload:', JSON.stringify(body));

  // SePay sends: { content, transferAmount, referenceCode, ... }
  const content = (body.content || body.description || '').trim();
  const incomingAmount = Number(body.transferAmount || body.amount || 0);
  const transactionId = body.referenceCode || body.transactionId || body.id || '';

  if (!content) return res(400, { error: 'Missing content' });

  // Extract transferCode from content — support both OPPO_XXXXXXXX and OPPO XXXXXXXX and OPPOXXXXXXXX
  const match = content.match(/OPPO[_\s-]?([A-F0-9]{8})/i);
  if (!match) {
    console.warn('⚠️ No transferCode found in content:', content);
    return res(200, { success: false, message: 'No matching transfer code' });
  }
  const transferCode = `OPPO_${match[1].toUpperCase()}`;

  // Find payment by transferCode
  const queryResult = await db.send(new QueryCommand({
    TableName: PAYMENTS_TABLE,
    IndexName: 'TransferCodeIndex',
    KeyConditionExpression: 'transferCode = :tc',
    ExpressionAttributeValues: { ':tc': transferCode },
    Limit: 1,
  }));

  const payment = queryResult.Items?.[0];
  if (!payment) {
    console.warn('⚠️ Payment not found for transferCode:', transferCode);
    return res(200, { success: false, message: 'Payment not found' });
  }

  // Idempotency: already paid
  if (payment.status === 'paid') {
    console.log('ℹ️ Payment already processed:', payment.paymentId);
    return res(200, { success: true, message: 'Already processed' });
  }

  // Validate amount (allow ±1000 VND tolerance)
  if (Math.abs(incomingAmount - payment.amount) > 1000) {
    console.warn(`⚠️ Amount mismatch: expected ${payment.amount}, got ${incomingAmount}`);
    return res(200, { success: false, message: 'Amount mismatch' });
  }

  const now = new Date().toISOString();

  // Update payment status
  await db.send(new UpdateCommand({
    TableName: PAYMENTS_TABLE,
    Key: { paymentId: payment.paymentId },
    UpdateExpression: 'SET #s = :paid, paidAt = :now, transactionId = :txId, updatedAt = :now REMOVE #ttl',
    ConditionExpression: '#s = :pending',
    ExpressionAttributeNames: { '#s': 'status', '#ttl': 'ttl' },
    ExpressionAttributeValues: {
      ':paid': 'paid',
      ':pending': 'pending',
      ':now': now,
      ':txId': transactionId,
    },
  }));

  console.log(`✅ Payment ${payment.paymentId} marked as paid`);

  // Activate package for user
  await activatePackage(payment);

  return res(200, { success: true, message: 'Payment processed' });
}

// ─────────────────────────────────────────────
// ACTIVATE PACKAGE
// ─────────────────────────────────────────────
/**
 * @param {Record<string, any>} payment
 */
async function activatePackage(payment) {
  const { userId, packageId, packageName, duration, amount, paymentId } = payment;
  const now = new Date().toISOString();

  // Calculate expiry based on duration string (e.g. "7 ngày", "30 ngày")
  const days = parseDurationDays(duration || '7 ngày');
  const expiryDate = new Date(Date.now() + days * 86400000).toISOString();

  const subscriptionId = `SUB-${paymentId}`;

  // Write to UserPackages table
  try {
    await db.send(new PutCommand({
      TableName: USER_PACKAGES_TABLE,
      Item: {
        subscriptionId,
        userId,
        packageId,
        packageName: packageName || '',
        amount,
        paymentId,
        status: 'active',
        activatedAt: now,
        expiryDate,
        createdAt: now,
        updatedAt: now,
      },
    }));
    console.log(`✅ Package activated: ${subscriptionId} for user ${userId}`);
  } catch (err) {
    console.error('❌ Failed to activate package:', err);
  }

  // Also update EmployerProfiles.isVerified / activeSubscription
  try {
    await db.send(new UpdateCommand({
      TableName: EMPLOYERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET activeSubscription = :sub, subscriptionExpiry = :exp, updatedAt = :now',
      ExpressionAttributeValues: {
        ':sub': subscriptionId,
        ':exp': expiryDate,
        ':now': now,
      },
    }));
  } catch (err) {
    // @ts-ignore
    console.warn('⚠️ Could not update EmployerProfiles:', err.message);
  }
}

/**
 * Parse duration string to days
 * @param {string} duration
 * @returns {number}
 */
function parseDurationDays(duration) {
  const match = duration.match(/(\d+)/);
  if (!match) return 7;
  const n = parseInt(match[1], 10);
  if (duration.includes('tháng') || duration.includes('month')) return n * 30;
  return n; // days
}
