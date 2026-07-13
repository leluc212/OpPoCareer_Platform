"""
didit-ekyc-handler.py — Lambda Python 3.11
Tích hợp Didit eKYC thay thế VNPT.

Khác biệt chính so với VNPT:
  - Didit dùng API Key tĩnh (x-api-key header) — KHÔNG có bearer token, KHÔNG cần refresh
  - Luồng: tạo session → redirect user → nhận kết quả qua webhook
  - Secrets Manager: "prod/didit/api-key"
      { "apiKey": "...", "webhookSecret": "..." }

Routes Lambda:
  POST  /ekyc/session              — Tạo session xác minh Didit (yêu cầu JWT)
  GET   /ekyc/status/{userId}      — Lấy trạng thái KYC (yêu cầu JWT)
  POST  /ekyc/webhook/didit        — Nhận kết quả webhook từ Didit (PUBLIC, không JWT)

Chữ ký webhook Didit (docs.didit.me/integration/webhooks):
  - Header thật: X-Signature-V2 (ưu tiên), X-Signature-Simple (fallback)
  - KHÔNG dùng x-didit-signature (tên sai — không tồn tại)
  - X-Signature-V2: HMAC-SHA256 trên canonical JSON
      sort_keys=True, separators=(',',':'), ensure_ascii=False, shorten_floats
  - X-Signature-Simple: HMAC-SHA256 trên "{timestamp}:{session_id}:{status}:{webhook_type}"
  - X-Timestamp: Unix epoch seconds, reject nếu |now - ts| > 300 giây
  - Field event: "webhook_type" (không phải "event" hay "type")
  - Status "Approved"/"Declined" là title case (case-sensitive)

Ghi chú AWS:
  - Route /ekyc/webhook/didit KHÔNG gắn Cognito Authorizer
  - Các route còn lại giữ nguyên Cognito JWT Authorizer
  - Secret: prod/didit/api-key (IAM policy cho phép Lambda đọc)
"""

import json
import boto3
import base64
import hmac
import hashlib
import os
import urllib.request
import urllib.error
from datetime import datetime, timezone

# ─── AWS clients ──────────────────────────────────────────────────────────────
dynamodb       = boto3.resource('dynamodb', region_name='ap-southeast-1')
secrets_client = boto3.client('secretsmanager', region_name='ap-southeast-1')
table          = dynamodb.Table('CandidateProfiles')

# ─── Didit config ─────────────────────────────────────────────────────────────
DIDIT_SECRET_NAME = 'prod/didit/api-key'
DIDIT_API_BASE    = os.environ.get('DIDIT_API_BASE_URL', 'https://verification.didit.me')
DIDIT_WORKFLOW_ID = os.environ.get('DIDIT_WORKFLOW_ID', '')

# Cache API Key trong memory giữa các lần warm invocation
# Không cần refresh — Didit API Key không hết hạn
_secret_cache: dict | None = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_cors_headers():
    return {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json'
    }


def resp(status, body):
    return {
        'statusCode': status,
        'headers':    get_cors_headers(),
        'body':       json.dumps(body, ensure_ascii=False),
    }


def get_didit_secret() -> dict:
    """
    Đọc API Key + webhookSecret từ Secrets Manager.
    Cache trong memory Lambda (warm invocation) để tránh gọi lại mỗi request.
    Ở dev local có thể dùng env vars DIDIT_API_KEY / DIDIT_WEBHOOK_SECRET.
    """
    global _secret_cache
    if _secret_cache:
        return _secret_cache

    # Dev fallback: dùng env vars nếu có (không bao giờ dùng ở production)
    env_key    = os.environ.get('DIDIT_API_KEY', '')
    env_secret = os.environ.get('DIDIT_WEBHOOK_SECRET', '')
    if env_key:
        _secret_cache = {'apiKey': env_key, 'webhookSecret': env_secret}
        print('[Didit] Dùng DIDIT_API_KEY từ env var (dev mode)')
        return _secret_cache

    # Production: đọc từ Secrets Manager
    result = secrets_client.get_secret_value(SecretId=DIDIT_SECRET_NAME)
    _secret_cache = json.loads(result['SecretString'])
    print('[Didit] API Key tải từ Secrets Manager thành công')
    return _secret_cache


def didit_request(endpoint: str, method: str = 'GET', body: dict | None = None) -> dict:
    """
    Gọi Didit API.
    - Header: x-api-key (không Bearer, không refresh)
    - Khác biệt hoàn toàn với VNPT bearer token flow
    """
    secret  = get_didit_secret()
    api_key = secret['apiKey']

    url  = f'{DIDIT_API_BASE}{endpoint}'
    data = json.dumps(body).encode('utf-8') if body else None

    headers = {
        'accept':       'application/json',
        'content-type': 'application/json',
        'x-api-key':    api_key,
    }

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read().decode('utf-8')
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if hasattr(e, 'read') else ''
        print(f'[Didit] HTTP {e.code} {url}: {err_body[:300]}')
        try:
            err_json = json.loads(err_body)
        except Exception:
            err_json = {'message': err_body[:200]}
        raise RuntimeError(f'Didit API lỗi {e.code}: {err_json.get("message", err_body[:100])}')


def extract_user_id(event) -> str | None:
    """
    Lấy user sub từ Cognito JWT đã được API Gateway verify.
    Giữ nguyên logic từ ekyc-handler.py cũ.
    """
    try:
        req_ctx    = event.get('requestContext') or {}
        jwt_claims = (req_ctx.get('authorizer') or {}).get('jwt', {}).get('claims') or {}
        sub        = jwt_claims.get('sub')
        if sub:
            return sub
        claims = (req_ctx.get('authorizer') or {}).get('claims') or {}
        sub    = claims.get('sub')
        if sub:
            return sub
    except Exception:
        pass

    # Fallback: tự decode payload (dev / direct call)
    try:
        auth = ((event.get('headers') or {}).get('authorization') or
                (event.get('headers') or {}).get('Authorization') or '')
        if not auth.startswith('Bearer '):
            return None
        p  = auth[7:].split('.')[1]
        p += '=' * (4 - len(p) % 4)
        return json.loads(base64.b64decode(p).decode()).get('sub')
    except Exception:
        return None


def _shorten_floats(data):
    """
    Normalize whole-valued floats → int để khớp với canonical JSON của Didit.
    Ví dụ: 95.0 → 95, nhưng 95.4 giữ nguyên.
    """
    if isinstance(data, dict):
        return {k: _shorten_floats(v) for k, v in data.items()}
    if isinstance(data, list):
        return [_shorten_floats(x) for x in data]
    if isinstance(data, float) and data == int(data):
        return int(data)
    return data


def _canonical_json(body_dict: dict) -> str:
    """
    Tạo canonical JSON theo đúng chuẩn Didit X-Signature-V2:
      - sort_keys=True
      - separators=(',',':') — compact, không có khoảng trắng
      - ensure_ascii=False   — Unicode giữ nguyên, không escape
      - shorten_floats       — whole-valued floats → int
    """
    return json.dumps(
        _shorten_floats(body_dict),
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=False,
    )


def verify_signature_v2(body_dict: dict, signature: str, timestamp_str: str, secret: str) -> bool:
    """
    Xác thực X-Signature-V2:
    HMAC-SHA256 trên canonical JSON (sort_keys, compact, Unicode preserved).
    Reject nếu timestamp cách hiện tại > 300 giây (chống replay attack).
    """
    if not signature or not secret or not timestamp_str:
        return False
    try:
        now = int(datetime.now(timezone.utc).timestamp())
        if abs(now - int(timestamp_str)) > 300:
            print(f'[Didit Webhook] Timestamp quá cũ: ts={timestamp_str} now={now} diff={abs(now - int(timestamp_str))}s')
            return False
    except (ValueError, TypeError):
        return False

    canonical = _canonical_json(body_dict)
    expected  = hmac.new(
        secret.encode('utf-8'),
        canonical.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_signature_simple(body_dict: dict, signature: str, timestamp_str: str, secret: str) -> bool:
    """
    Fallback: Xác thực X-Signature-Simple:
    HMAC-SHA256 trên "{timestamp}:{session_id}:{status}:{webhook_type}"
    Lưu ý: Simple KHÔNG xác thực nội dung decision — chỉ dùng làm fallback.
    """
    if not signature or not secret or not timestamp_str:
        return False
    try:
        now = int(datetime.now(timezone.utc).timestamp())
        if abs(now - int(timestamp_str)) > 300:
            return False
    except (ValueError, TypeError):
        return False

    canonical = ':'.join([
        str(body_dict.get('timestamp', '')),
        str(body_dict.get('session_id', '')),
        str(body_dict.get('status', '')),
        str(body_dict.get('webhook_type', '')),
    ])
    expected = hmac.new(
        secret.encode('utf-8'),
        canonical.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def update_kyc_verified(user_id: str, session_id: str, status: str, decision: dict):
    """
    Cập nhật trạng thái KYC vào DynamoDB CandidateProfiles.
    Giữ nguyên các field cũ (kycStatus, kycCompleted) để tương thích với
    application-lambda.py gate kiểm tra kycCompleted == True.
    Thêm field mới provider='DIDIT' để phân biệt record cũ VNPT / mới Didit.

    Khi status == "Approved", extract thông tin cá nhân từ decision payload:
      - document_number → cccd (Số CCCD)
      - date_of_birth  → dateOfBirth
      - full_name      → fullName (nếu chưa có)

    Didit status values (title case, case-sensitive):
      "Approved"     → kycCompleted=True, kycStatus="VERIFIED"
      "Declined"     → kycCompleted=False, kycStatus="FAILED"
      "In Review"    → kycStatus="IN_REVIEW"
      "In Progress"  → kycStatus="IN_PROGRESS"
      Các trạng thái khác → kycStatus="PENDING"
    """
    now_iso     = datetime.now(timezone.utc).isoformat()
    is_verified = status == 'Approved'
    is_failed   = status == 'Declined'

    # Map Didit status → internal kycStatus
    kyc_status_map = {
        'Approved':     'VERIFIED',
        'Declined':     'FAILED',
        'In Review':    'IN_REVIEW',
        'In Progress':  'IN_PROGRESS',
        'Resubmitted':  'RESUBMITTED',
        'Abandoned':    'FAILED',
        'Expired':      'EXPIRED',
        'Kyc Expired':  'EXPIRED',
    }
    kyc_status_value = kyc_status_map.get(status, 'PENDING')

    # Extract thông tin cá nhân từ decision payload khi Approved
    # Didit trả id_verifications[] — có thể nằm trong decision hoặc top-level webhook payload
    cccd_number = ''
    date_of_birth = ''
    full_name = ''
    if is_verified and decision:
        id_verifications = decision.get('id_verifications') or []
        # Fallback: id_verifications có thể nằm trực tiếp trong decision (nếu decision IS top-level)
        if not id_verifications and isinstance(decision, dict):
            # Trường hợp decision chính là object chứa document_number trực tiếp
            if decision.get('document_number'):
                id_verifications = [decision]
        if id_verifications and isinstance(id_verifications, list):
            id_doc = id_verifications[0]
            cccd_number   = id_doc.get('document_number') or id_doc.get('personal_number') or ''
            date_of_birth = id_doc.get('date_of_birth') or ''
            full_name     = id_doc.get('full_name') or ''
            print(f'[Didit] Extracted from decision: cccd={cccd_number}, dob={date_of_birth}, name={full_name}')

    # Build update expression dynamically
    update_parts = [
        'kycStatus = :s',
        'kycCompleted = :d',
        'kycVerifiedAt = :t',
        'updatedAt = :t',
        'diditSessionId = :sid',
        'diditRawStatus = :rs',
        'provider = :pv',
    ]
    expr_values = {
        ':s':   kyc_status_value,
        ':d':   is_verified,
        ':t':   now_iso,
        ':sid': session_id,
        ':rs':  status,           # giữ nguyên status gốc từ Didit
        ':pv':  'DIDIT',
    }

    # Chỉ cập nhật cccd/dateOfBirth khi có dữ liệu (Approved + OCR thành công)
    if cccd_number:
        update_parts.append('cccd = :cccd')
        expr_values[':cccd'] = cccd_number
    if date_of_birth:
        update_parts.append('dateOfBirth = :dob')
        expr_values[':dob'] = date_of_birth
    if full_name:
        update_parts.append('kycFullName = :fn')
        expr_values[':fn'] = full_name

    try:
        table.update_item(
            Key={'userId': user_id},
            UpdateExpression='SET ' + ', '.join(update_parts),
            ExpressionAttributeValues=expr_values,
        )
        print(f'[Didit] DynamoDB updated: userId={user_id} kycStatus={kyc_status_value} diditStatus={status} cccd={cccd_number or "N/A"}')
    except Exception as e:
        print(f'[Didit] DynamoDB error: {e}')
        raise


# ─── Route handlers ───────────────────────────────────────────────────────────

def handle_create_session(event, user_id: str | None):
    """
    POST /ekyc/session
    Tạo session xác minh Didit cho user.
    Trả về session_id + redirect_url để frontend redirect user đến trang Didit.
    """
    if not user_id:
        return resp(401, {'success': False, 'errorMsg': 'Cần đăng nhập để xác minh danh tính'})

    try:
        raw_body = event.get('body') or '{}'
        if event.get('isBase64Encoded'):
            raw_body = base64.b64decode(raw_body).decode('utf-8')
        body = json.loads(raw_body)
    except Exception as e:
        return resp(400, {'success': False, 'errorMsg': f'Dữ liệu không hợp lệ: {e}'})

    callback_url = body.get('callbackUrl') or os.environ.get('DIDIT_CALLBACK_URL', '')

    try:
        payload = {
            'vendor_data': user_id,
            'callback':    callback_url,
        }
        if DIDIT_WORKFLOW_ID:
            payload['workflow_id'] = DIDIT_WORKFLOW_ID

        result = didit_request('/v3/session/', method='POST', body=payload)

        session_id   = result.get('session_id') or result.get('id') or ''
        redirect_url = result.get('url') or result.get('redirect_url') or ''

        # Lưu session_id tạm thời vào DynamoDB để đối chiếu khi webhook gọi về
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            table.update_item(
                Key={'userId': user_id},
                UpdateExpression='SET diditSessionId = :sid, kycStatus = :s, updatedAt = :t',
                ExpressionAttributeValues={
                    ':sid': session_id,
                    ':s':   'PENDING',
                    ':t':   now_iso,
                },
            )
        except Exception as db_err:
            print(f'[Didit] DynamoDB session save warning: {db_err}')

        return resp(200, {
            'success':     True,
            'session_id':  session_id,
            'redirect_url': redirect_url,
        })

    except RuntimeError as e:
        return resp(502, {'success': False, 'errorMsg': str(e)})
    except Exception as e:
        print(f'[Didit] handle_create_session error: {e}')
        return resp(500, {'success': False, 'errorMsg': 'Lỗi nội bộ. Vui lòng thử lại.'})


def handle_status(event, uid: str):
    """
    GET /ekyc/status/{userId}
    Trả trạng thái KYC từ DynamoDB — giữ nguyên contract với frontend.
    """
    try:
        item = table.get_item(Key={'userId': uid}).get('Item', {})
        if not item:
            return resp(200, {
                'success':      True,
                'userId':       uid,
                'kycStatus':    'PENDING',
                'kycCompleted': False,
            })
        return resp(200, {
            'success':       True,
            'userId':        uid,
            'kycStatus':     item.get('kycStatus', 'PENDING'),
            'kycCompleted':  bool(item.get('kycCompleted', False)),
            'kycVerifiedAt': item.get('kycVerifiedAt'),
            'provider':      item.get('provider', 'VNPT'),  # backward compat
        })
    except Exception as e:
        return resp(500, {'success': False, 'errorMsg': str(e)})


def handle_webhook(event):
    """
    POST /ekyc/webhook/didit
    Route PUBLIC — KHÔNG gắn Cognito Authorizer (Didit gọi vào, không phải user).

    Xác thực chữ ký theo đúng tài liệu Didit (docs.didit.me/integration/webhooks):
      - Header thật: X-Signature-V2 (ưu tiên) hoặc X-Signature-Simple (fallback)
      - KHÔNG dùng x-didit-signature (tên sai, không tồn tại trong Didit)
      - X-Timestamp: Unix epoch seconds — reject nếu |now - ts| > 300 giây
      - webhook_type: "status.updated" | "data.updated" | ...
      - Status: "Approved" / "Declined" (title case, case-sensitive)
    """
    headers_raw = event.get('headers') or {}

    # Header names từ API Gateway có thể lowercase hoàn toàn
    sig_v2     = headers_raw.get('x-signature-v2')     or headers_raw.get('X-Signature-V2')     or ''
    sig_simple = headers_raw.get('x-signature-simple') or headers_raw.get('X-Signature-Simple') or ''
    timestamp  = headers_raw.get('x-timestamp')        or headers_raw.get('X-Timestamp')        or ''
    is_test    = headers_raw.get('x-didit-test-webhook') or headers_raw.get('X-Didit-Test-Webhook') or ''

    raw_body = event.get('body') or ''
    if event.get('isBase64Encoded'):
        raw_body = base64.b64decode(raw_body).decode('utf-8')

    try:
        secret         = get_didit_secret()
        webhook_secret = secret.get('webhookSecret', '')
    except Exception as e:
        print(f'[Didit Webhook] Không đọc được secret: {e}')
        return resp(500, {'error': 'Lỗi nội bộ'})

    # Parse JSON để xác thực V2 (cần dict để tạo canonical JSON)
    try:
        body_dict = json.loads(raw_body)
    except Exception as e:
        print(f'[Didit Webhook] JSON parse error: {e}')
        return resp(400, {'error': 'Dữ liệu webhook không hợp lệ'})

    # Xác thực chữ ký — bỏ qua nếu webhookSecret chưa cấu hình (dev/staging)
    if webhook_secret:
        verified = False

        # Ưu tiên X-Signature-V2 (canonical JSON — an toàn nhất)
        if sig_v2:
            verified = verify_signature_v2(body_dict, sig_v2, timestamp, webhook_secret)
            if verified:
                print('[Didit Webhook] Xác thực V2 thành công')
            else:
                print(f'[Didit Webhook] V2 thất bại. sig={sig_v2[:20]}... ts={timestamp}')

        # Fallback: X-Signature-Simple (chỉ xác thực envelope, không xác thực decision)
        if not verified and sig_simple:
            verified = verify_signature_simple(body_dict, sig_simple, timestamp, webhook_secret)
            if verified:
                print('[Didit Webhook] Xác thực Simple thành công (fallback — decision chưa được xác thực)')
            else:
                print(f'[Didit Webhook] Simple thất bại. sig={sig_simple[:20]}... ts={timestamp}')

        if not verified:
            print(f'[Didit Webhook] Chữ ký không hợp lệ. sig_v2={sig_v2[:20] if sig_v2 else "MISSING"} sig_simple={sig_simple[:20] if sig_simple else "MISSING"} ts={timestamp}')
            return resp(401, {'error': 'Chữ ký webhook không hợp lệ'})
    else:
        print('[Didit Webhook] CẢNH BÁO: webhookSecret chưa cấu hình — bỏ qua xác thực chữ ký (chỉ chấp nhận ở dev)')

    webhook_type = body_dict.get('webhook_type', '')
    session_id   = body_dict.get('session_id') or ''
    user_id      = body_dict.get('vendor_data') or ''
    status       = body_dict.get('status') or ''

    print(f'[Didit Webhook] {"[TEST] " if is_test else ""}Nhận webhook_type={webhook_type} session_id={session_id} vendor_data={user_id} status={status}')

    # Bỏ qua webhook test (X-Didit-Test-Webhook: true) — không ghi vào DB
    if is_test and is_test.lower() in ('true', '1'):
        print('[Didit Webhook] Webhook test — bỏ qua, không cập nhật DynamoDB')
        return resp(200, {'received': True, 'test': True})

    # Chỉ xử lý status.updated — đây là event chính xác nhận kết quả xác minh
    if webhook_type == 'status.updated':
        if not user_id:
            print('[Didit Webhook] vendor_data (userId) trống — bỏ qua')
            return resp(200, {'received': True})

        decision = body_dict.get('decision') or {}
        # Nếu decision trống nhưng id_verifications nằm ở top level payload
        if not decision and body_dict.get('id_verifications'):
            decision = body_dict
        try:
            # GIỮ NGUYÊN logic nghiệp vụ cũ — chỉ đổi nguồn field từ payload Didit
            # Status Didit: "Approved"/"Declined"/"In Review"/"In Progress"/... (title case)
            update_kyc_verified(user_id, session_id, status, decision)
        except Exception as e:
            print(f'[Didit Webhook] Lỗi cập nhật DynamoDB: {e}')
            return resp(500, {'error': 'Lỗi lưu kết quả xác minh'})

    # Trả 200 ngay cho tất cả webhook_type (kể cả data.updated, user.status.updated, ...)
    # Didit retry nếu nhận 5xx/404, không retry 2xx
    return resp(200, {'received': True})


# ─── Main handler ─────────────────────────────────────────────────────────────

def lambda_handler(event, context):
    method = (
        (event.get('requestContext') or {}).get('http', {}).get('method') or
        event.get('httpMethod', '')
    )
    path = event.get('rawPath') or event.get('path') or '/'
    if path.startswith('/prod/'):
        path = path[5:]
    print(f'[Didit eKYC] [{method}] {path}')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': get_cors_headers(), 'body': ''}

    # ── Route: Webhook Didit (PUBLIC — không cần user_id) ─────────────────────
    if method == 'POST' and path in ('/ekyc/webhook/didit', '/ekyc/webhook'):
        return handle_webhook(event)

    # ── Các route còn lại yêu cầu JWT (Cognito Authorizer) ───────────────────
    user_id = extract_user_id(event)

    try:
        if method == 'POST' and path == '/ekyc/session':
            return handle_create_session(event, user_id)

        if method == 'GET' and '/ekyc/status/' in path:
            uid = path.split('/ekyc/status/')[-1].strip('/')
            return handle_status(event, uid)

        return resp(404, {'success': False, 'errorMsg': f'Không tìm thấy route: {method} {path}'})

    except Exception as e:
        print(f'[Didit eKYC] Lỗi không xử lý được: {e}')
        return resp(500, {'success': False, 'errorMsg': 'Lỗi nội bộ máy chủ'})
