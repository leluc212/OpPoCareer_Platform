# Migration eKYC: VNPT → Didit

**Ngày thực hiện:** 2026-07-10  
**Trạng thái:** Đã implement, chờ deploy lên AWS

---

## Tóm tắt thay đổi

| Hạng mục | VNPT (cũ) | Didit (mới) |
|---|---|---|
| Auth | Bearer token, expire 8h | API Key tĩnh (`x-api-key`) |
| Refresh | Cần cron job / interceptor | **Không cần** |
| Flow xác minh | Upload ảnh CCCD + selfie trực tiếp | Session-based → redirect → webhook |
| Secrets Manager | `vnpt-ekyc-credentials` | `prod/didit/api-key` |
| Webhook | Không có | `POST /ekyc/webhook/didit` (PUBLIC) |

---

## File đã thay đổi

### Mới tạo
- `amplify/backend/didit-ekyc-handler.py` — Lambda Python xử lý Didit
- `amplify/backend/deploy-didit-ekyc-lambda.ps1` — Script deploy
- `amplify/backend/update-didit-secret.ps1` — Script tạo/cập nhật Didit secret
- `amplify/backend/patch-didit-iam-policy.ps1` — Script gán IAM policy

### Đã thay thế (code cũ giữ trong comment VNPT_LEGACY)
- `src/services/ekycService.js` — Chỉ còn `createVerificationSession()`, `getKycStatus()` (bỏ `ocrCCCD()`, `verifyFace()`)
- `src/pages/candidate/CandidateKYC.jsx` — Giao diện session-based thay vì upload ảnh 2 bước
- `ekyc-mock-server.js` — Mock Didit flow cho dev local

### Giữ nguyên (backward compatible)
- `amplify/backend/candidate-profile-lambda.py` — Verification routes không đổi
- `amplify/backend/application-lambda.py` — eKYC gate kiểm tra `kycCompleted` không đổi
- `src/hooks/useVerificationGuard.js` — Không đổi
- `src/pages/admin/CandidateVerificationsManagement.jsx` — Không đổi

### Giữ nguyên nhưng KHÔNG deploy (legacy, để rollback)
- `amplify/backend/ekyc-handler.py` — VNPT Lambda cũ, KHÔNG xoá
- `amplify/backend/ekyc_handler.py` — VNPT Lambda cũ variant
- `amplify/backend/update-vnpt-token.ps1` — Script refresh token VNPT cũ
- `amplify/backend/deploy-ekyc-lambda.ps1` — Deploy script VNPT cũ

---

## Checklist deploy (thực hiện theo thứ tự)

### Bước 1: Tạo Didit Secret
```powershell
cd amplify/backend
.\update-didit-secret.ps1 -ApiKey "YOUR_DIDIT_API_KEY" -WebhookSecret "YOUR_WEBHOOK_SECRET"
```

### Bước 2: Gán IAM Policy
```powershell
.\patch-didit-iam-policy.ps1
```

### Bước 3: Deploy Lambda
```powershell
.\deploy-didit-ekyc-lambda.ps1
# Sau đó update DIDIT_WORKFLOW_ID trong Lambda env vars
```

### Bước 4: Đăng ký Webhook URL với Didit
Trong Didit Dashboard, set webhook URL:
```
https://sd7ds72m8g.execute-api.ap-southeast-1.amazonaws.com/prod/ekyc/webhook/didit
```
Route này **KHÔNG có** Cognito Authorizer.

### Bước 5: Xác nhận NAT Gateway (nếu Lambda trong VPC)
- Nếu Lambda đang gọi được VNPT trước đây → NAT Gateway đã có, bỏ qua
- Didit endpoint: `https://verification.didit.me`

---

## Test checklist

- [ ] `POST /ekyc/session` trả về `session_id` + `redirect_url` hợp lệ (không cần bước lấy token trước)
- [ ] Sau 8 tiếng: không có lỗi 401 nào (API Key không expire)
- [ ] Webhook `POST /ekyc/webhook/didit` nhận payload từ Didit, chữ ký HMAC hợp lệ
- [ ] Webhook route **không bị chặn** bởi Cognito Authorizer
- [ ] `GET /ekyc/status/{userId}` sau webhook trả `kycCompleted: true`
- [ ] `application-lambda.py` gate vẫn hoạt động: ứng viên chưa verify bị block `EKYC_REQUIRED`
- [ ] API Key đọc từ Secrets Manager, không lộ trong CloudWatch log
- [ ] Lambda gọi ra `verification.didit.me` thành công (timeout/NAT không gặp vấn đề)
- [ ] DynamoDB record mới có field `provider: "DIDIT"`, record cũ VNPT không bị ảnh hưởng

---

## Rollback plan

Nếu có sự cố ở production:

1. Deploy lại Lambda với code VNPT cũ:
```powershell
cd amplify/backend
# Đóng gói ekyc-handler.py (VNPT cũ) và deploy lại
python update_ekyc_zip.py
aws lambda update-function-code --function-name ekyc-handler --zip-file fileb://ekyc-handler.zip --region ap-southeast-1
```

2. Frontend tự động dùng lại routes cũ (route `/ekyc/ocr`, `/ekyc/verify-face` vẫn còn trên API Gateway).

3. Restore code CandidateKYC.jsx từ git: `git checkout HEAD~1 -- src/pages/candidate/CandidateKYC.jsx`
