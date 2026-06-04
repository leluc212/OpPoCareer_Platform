/**
 * VNPT eKYC Mock Server - Local Development
 * 
 * Mô phỏng VNPT eKYC API để phát triển local.
 * Khi deploy AWS: thay bằng Lambda ekyc-handler.py gọi VNPT API thật.
 * 
 * Chạy: node ekyc-mock-server.js
 * Port: 3001
 * 
 * Endpoints:
 *   POST /ekyc/ocr         - OCR ảnh CCCD
 *   POST /ekyc/verify-face - Xác minh khuôn mặt
 *   GET  /ekyc/status/:userId - Lấy trạng thái KYC
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ─── In-memory storage (thay bằng DynamoDB khi lên AWS) ───────────────────────
const kycAttempts = new Map();   // userId -> { count, date }
const kycStatus   = new Map();   // userId -> kycRecord

const MAX_DAILY_ATTEMPTS = 999; // Tăng giới hạn để test local thoải mái

// ─── Helper: Check rate limit ─────────────────────────────────────────────────
function checkRateLimit(userId) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const record = kycAttempts.get(userId);

  if (!record || record.date !== today) {
    kycAttempts.set(userId, { count: 1, date: today });
    return { allowed: true, remaining: MAX_DAILY_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_DAILY_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  kycAttempts.set(userId, record);
  return { allowed: true, remaining: MAX_DAILY_ATTEMPTS - record.count };
}

// ─── Helper: Extract userId from Authorization header ─────────────────────────
function extractUserId(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;

  try {
    const token = auth.slice(7);
    // Decode JWT payload (không verify — giống pattern hiện có trong project)
    const payloadB64 = token.split('.')[1];
    if (!payloadB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    return payload.sub || null;
  } catch {
    return null;
  }
}

// ─── Mock VNPT OCR logic ──────────────────────────────────────────────────────
function mockVnptOcr(imageFront, imageBack) {
  // Trong production: gọi https://api.vnpt.vn/ekyc/v3/ocr
  // Trả về dữ liệu mock hợp lệ để test UI
  const mockData = {
    id:          '079202012345',
    name:        'NGUYỄN VĂN AN',
    dob:         '20/02/1995',
    sex:         'Nam',
    nationality: 'Việt Nam',
    home:        'Thôn 3, Xã Đại Đồng, Huyện Vĩnh Tường, Tỉnh Vĩnh Phúc',
    address:     '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    doe:         '20/02/2025',   // date of expiry
    issue_date:  '10/05/2020',
    issue_place: 'Cục Cảnh sát QLHC về TTXH',
    type:        'CCCD',
    type_id:     '1',
    confidence:  0.97,
    valid_date:  true,
    warning:     null,
  };

  return {
    success:    true,
    errorCode:  0,
    errorMsg:   'Successful!',
    object:     { ...mockData, hash_id: crypto.randomUUID() },
    front_hash: crypto.createHash('md5').update(imageFront.slice(0, 100)).digest('hex'),
    back_hash:  imageBack ? crypto.createHash('md5').update(imageBack.slice(0, 100)).digest('hex') : null,
  };
}

// ─── Mock VNPT Face Matching logic ───────────────────────────────────────────
function mockVnptFaceMatch(faceImage, idFrontImage) {
  // Trong production: gọi VNPT Face Matching + Liveness API
  // Ngưỡng: similarity >= 85% VÀ liveness = true -> VERIFIED
  const similarity = 88 + Math.random() * 10; // 88–98% để mock luôn pass
  const liveness   = true;

  return {
    success:    true,
    errorCode:  0,
    errorMsg:   'Successful!',
    object: {
      matching:   similarity >= 85 && liveness,
      similarity: parseFloat(similarity.toFixed(2)),
      liveness,
      msg:        similarity >= 85 ? 'MATCH' : 'NOT_MATCH',
    }
  };
}

// ─── POST /ekyc/ocr ───────────────────────────────────────────────────────────
app.post('/ekyc/ocr', (req, res) => {
  console.log('\n📄 [OCR] Request received');

  const userId    = extractUserId(req) || req.body.userId;
  const { imageFront, imageBack } = req.body;

  // Validate
  if (!imageFront) {
    return res.status(400).json({
      success: false,
      errorCode: 400,
      errorMsg: 'imageFront là bắt buộc',
    });
  }

  // Rate limit
  if (userId) {
    const limit = checkRateLimit(`ocr_${userId}`);
    if (!limit.allowed) {
      console.log(`⛔ [OCR] Rate limit exceeded for userId: ${userId}`);
      return res.status(429).json({
        success:   false,
        errorCode: 429,
        errorMsg:  'Đã vượt quá giới hạn 3 lần xác thực/ngày. Vui lòng thử lại vào ngày mai.',
      });
    }
    console.log(`✅ [OCR] Rate limit OK. Remaining today: ${limit.remaining}`);
  }

  // Validate image format (base64 data URL)
  if (!imageFront.startsWith('data:image/')) {
    return res.status(400).json({
      success: false,
      errorCode: 400,
      errorMsg: 'imageFront phải là base64 data URL (data:image/...)',
    });
  }

  // Simulate VNPT API latency (500–1200ms)
  const delay = 500 + Math.random() * 700;
  setTimeout(() => {
    const result = mockVnptOcr(imageFront, imageBack);
    console.log(`✅ [OCR] Completed. ID: ${result.object.id}, Name: ${result.object.name}`);
    res.json(result);
  }, delay);
});

// ─── POST /ekyc/verify-face ───────────────────────────────────────────────────
app.post('/ekyc/verify-face', (req, res) => {
  console.log('\n📸 [Face] Request received');

  const userId       = extractUserId(req) || req.body.userId;
  const { faceImage, idFrontImage } = req.body;

  // Validate
  if (!faceImage) {
    return res.status(400).json({
      success: false,
      errorCode: 400,
      errorMsg: 'faceImage là bắt buộc',
    });
  }

  // Rate limit
  if (userId) {
    const limit = checkRateLimit(`face_${userId}`);
    if (!limit.allowed) {
      console.log(`⛔ [Face] Rate limit exceeded for userId: ${userId}`);
      return res.status(429).json({
        success:   false,
        errorCode: 429,
        errorMsg:  'Đã vượt quá giới hạn 3 lần xác thực/ngày. Vui lòng thử lại vào ngày mai.',
      });
    }
  }

  // Simulate VNPT API latency (1000–2000ms)
  const delay = 1000 + Math.random() * 1000;
  setTimeout(() => {
    const result      = mockVnptFaceMatch(faceImage, idFrontImage);
    const { matching, similarity, liveness } = result.object;

    // Nếu VERIFIED: lưu vào memory (trên AWS: update DynamoDB)
    if (matching && userId) {
      kycStatus.set(userId, {
        kycStatus:   'VERIFIED',
        kycCompleted: true,
        verifiedAt:  new Date().toISOString(),
        similarity,
      });
      console.log(`✅ [Face] VERIFIED. userId: ${userId}, similarity: ${similarity}%`);
    } else {
      console.log(`❌ [Face] NOT VERIFIED. similarity: ${similarity}%, liveness: ${liveness}`);
    }

    res.json({
      ...result,
      kycStatus: matching ? 'VERIFIED' : 'FAILED',
      // Khi lên AWS Lambda: trả thêm trường này sau khi update DynamoDB
      dynamoUpdated: matching && !!userId,
    });
  }, delay);
});

// ─── GET /ekyc/status/:userId ─────────────────────────────────────────────────
app.get('/ekyc/status/:userId', (req, res) => {
  const { userId } = req.params;
  const record = kycStatus.get(userId);

  if (!record) {
    return res.json({
      success:      true,
      userId,
      kycStatus:    'PENDING',
      kycCompleted: false,
    });
  }

  res.json({
    success: true,
    userId,
    ...record,
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'eKYC Mock', port: PORT, timestamp: new Date().toISOString() });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║      VNPT eKYC Mock Server — LOCAL        ║');
  console.log(`║      http://localhost:${PORT}                 ║`);
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║  POST /ekyc/ocr          — OCR CCCD       ║');
  console.log('║  POST /ekyc/verify-face  — Face match     ║');
  console.log(`║  GET  /ekyc/status/:id   — KYC status     ║`);
  console.log('║  GET  /health            — Health check   ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║  Rate limit: 3 lần/ngày/tài khoản         ║');
  console.log('║  Similarity threshold: >= 85%             ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('\n💡 Khi deploy AWS: thay bằng Lambda ekyc-handler.py\n');
});
