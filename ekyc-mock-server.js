/**
 * ekyc-mock-server.js — Local Development Mock
 *
 * Mô phỏng Didit eKYC API cho phát triển local.
 * Khi deploy AWS: thay bằng Lambda didit-ekyc-handler.py gọi Didit API thật.
 *
 * Chạy: node ekyc-mock-server.js
 * Port: 3001
 *
 * Endpoints (Didit flow — session-based):
 *   POST /ekyc/session           — Tạo session xác minh
 *   GET  /ekyc/status/:userId    — Lấy trạng thái KYC
 *   POST /ekyc/webhook/didit     — Nhận kết quả webhook (PUBLIC)
 *
 * ─────────────────────────────────────────────────────────────────
 * [VNPT_LEGACY] Mock VNPT cũ đã được comment lại ở cuối file
 * Tìm "VNPT_LEGACY" để thấy code cũ nếu cần rollback
 * ─────────────────────────────────────────────────────────────────
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app  = express();
const PORT = 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:      ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods:     ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-didit-signature'],
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ─── In-memory storage ────────────────────────────────────────────────────────
const kycStatus = new Map();   // userId -> kycRecord
const sessions  = new Map();   // sessionId -> { userId, createdAt, status }

// ─── Helper: Extract userId từ Authorization header ───────────────────────────
function extractUserId(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const token      = auth.slice(7);
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    return payload.sub || null;
  } catch {
    return null;
  }
}

// ─── POST /ekyc/session ───────────────────────────────────────────────────────
/**
 * Tạo session xác minh Didit mock.
 * Trong production: Lambda gọi Didit API POST /v3/session/
 * và trả về session_id + redirect_url thật.
 */
app.post('/ekyc/session', (req, res) => {
  console.log('\n🔐 [Session] Tạo session xác minh Didit mock...');

  const userId = extractUserId(req) || req.body.userId;
  if (!userId) {
    return res.status(401).json({ success: false, errorMsg: 'Cần đăng nhập' });
  }

  const sessionId   = `mock_session_${crypto.randomUUID()}`;
  const callbackUrl = req.body.callbackUrl || 'http://localhost:3000/candidate/kyc?status=completed';

  sessions.set(sessionId, {
    userId,
    createdAt: new Date().toISOString(),
    status:    'pending',
    callbackUrl,
  });

  // Mock redirect_url: trỏ về callback trực tiếp (bỏ qua trang Didit thật)
  // Trong production: redirect_url là URL trang xác minh Didit thật
  const mockRedirectUrl = `${callbackUrl}&session_id=${sessionId}&mock=true`;

  console.log(`✅ [Session] Tạo thành công: sessionId=${sessionId} userId=${userId}`);

  // Tự động giả lập webhook sau 3 giây (mock Didit gửi về kết quả)
  setTimeout(() => {
    simulateWebhookResult(sessionId, userId);
  }, 3000);

  res.json({
    success:     true,
    session_id:  sessionId,
    redirect_url: mockRedirectUrl,
  });
});

// ─── Giả lập Didit gửi webhook kết quả ───────────────────────────────────────
function simulateWebhookResult(sessionId, userId) {
  console.log(`\n📨 [Webhook Mock] Giả lập Didit gọi webhook: sessionId=${sessionId} userId=${userId}`);

  kycStatus.set(userId, {
    kycStatus:    'VERIFIED',
    kycCompleted: true,
    kycVerifiedAt: new Date().toISOString(),
    provider:     'DIDIT',
    diditSessionId: sessionId,
    diditStatus:  'approved',
    diditDecision: 'APPROVED',
  });

  const session = sessions.get(sessionId);
  if (session) {
    session.status = 'approved';
    sessions.set(sessionId, session);
  }

  console.log(`✅ [Webhook Mock] KYC VERIFIED cho userId=${userId}`);
}

// ─── GET /ekyc/status/:userId ─────────────────────────────────────────────────
app.get('/ekyc/status/:userId', (req, res) => {
  const { userId } = req.params;
  const record     = kycStatus.get(userId);

  if (!record) {
    return res.json({
      success:      true,
      userId,
      kycStatus:    'PENDING',
      kycCompleted: false,
    });
  }

  res.json({ success: true, userId, ...record });
});

// ─── POST /ekyc/webhook/didit (PUBLIC — không JWT) ────────────────────────────
/**
 * Endpoint Didit thật sẽ POST vào đây khi xác minh hoàn tất.
 * Mock server nhận và xử lý payload Didit.
 */
app.post('/ekyc/webhook/didit', (req, res) => {
  console.log('\n🔔 [Webhook] Nhận webhook Didit (mock):', JSON.stringify(req.body).slice(0, 200));

  const { session_id, vendor_data: userId, status, decision } = req.body;

  if (userId) {
    const isVerified = decision === 'APPROVED' || status === 'approved';
    kycStatus.set(userId, {
      kycStatus:     isVerified ? 'VERIFIED' : 'FAILED',
      kycCompleted:  isVerified,
      kycVerifiedAt: isVerified ? new Date().toISOString() : null,
      provider:      'DIDIT',
      diditSessionId: session_id,
      diditStatus:   status,
      diditDecision: decision,
    });
    console.log(`✅ [Webhook] Xử lý: userId=${userId} status=${status} decision=${decision}`);
  }

  res.json({ received: true });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    server:    'Didit eKYC Mock',
    port:      PORT,
    timestamp: new Date().toISOString(),
    provider:  'DIDIT',
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║      Didit eKYC Mock Server — LOCAL       ║');
  console.log(`║      http://localhost:${PORT}                 ║`);
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║  POST /ekyc/session         — Tạo session ║');
  console.log('║  GET  /ekyc/status/:id      — KYC status  ║');
  console.log('║  POST /ekyc/webhook/didit   — Webhook      ║');
  console.log('║  GET  /health               — Health check ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║  Provider: DIDIT (session-based flow)      ║');
  console.log('║  Mock: webhook auto-fires sau 3 giây       ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('\n💡 Khi deploy AWS: thay bằng Lambda didit-ekyc-handler.py\n');
});


/*
 * ══════════════════════════════════════════════════════════════════════
 * VNPT_LEGACY — Mock VNPT cũ, giữ lại để rollback nếu cần
 * ══════════════════════════════════════════════════════════════════════
 *
 * // POST /ekyc/ocr
 * app.post('/ekyc/ocr', (req, res) => {
 *   const { imageFront, imageBack } = req.body;
 *   if (!imageFront) return res.status(400).json({ success: false, errorCode: 400, errorMsg: 'imageFront là bắt buộc' });
 *   setTimeout(() => {
 *     res.json({
 *       success: true, errorCode: 0, errorMsg: 'Successful!',
 *       object: { id: '079202012345', name: 'NGUYỄN VĂN AN', dob: '20/02/1995', sex: 'Nam', nationality: 'Việt Nam', address: '123 Nguyễn Huệ, Q.1, TP.HCM', issue_date: '10/05/2020', issue_place: 'Cục Cảnh sát QLHC về TTXH', doe: '20/02/2025', type: 'CCCD', confidence: 0.97 },
 *       front_hash: crypto.createHash('md5').update(imageFront.slice(0, 100)).digest('hex'),
 *     });
 *   }, 800);
 * });
 *
 * // POST /ekyc/verify-face
 * app.post('/ekyc/verify-face', (req, res) => {
 *   const { faceImage } = req.body;
 *   if (!faceImage) return res.status(400).json({ success: false, errorCode: 400, errorMsg: 'faceImage là bắt buộc' });
 *   const similarity = 88 + Math.random() * 10;
 *   setTimeout(() => {
 *     res.json({ success: true, kycStatus: 'VERIFIED', object: { matching: true, similarity: +similarity.toFixed(2), liveness: true, liveness_score: 0.97, msg: 'MATCH' } });
 *   }, 1500);
 * });
 *
 * ══════════════════════════════════════════════════════════════════════
 */
