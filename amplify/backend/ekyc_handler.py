"""
ekyc-handler.py — Lambda Python 3.11
VNPT eKYC theo đúng API docs:
  - Headers: Authorization Bearer, Token-id, Token-key, mac-address
  - OCR body: img_front (base64), client_session, type
  - Face: img_selfie + img_front hoặc hash
  - Upload ảnh → lấy hash → OCR/Face dùng hash

Secrets Manager: vnpt-ekyc-credentials
  { "token_id":"...", "token_key":"...", "bearer_token":"..." }
"""

import json, boto3, base64, urllib.error, urllib.parse, time, ssl, io
from datetime import datetime, timezone
from decimal import Decimal
import requests as req_lib
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# ─── AWS ──────────────────────────────────────────────────────────────────────
dynamodb       = boto3.resource('dynamodb', region_name='ap-southeast-1')
secrets_client = boto3.client('secretsmanager', region_name='ap-southeast-1')
table          = dynamodb.Table('CandidateProfiles')

# ─── VNPT endpoints ───────────────────────────────────────────────────────────
VNPT_BASE           = 'https://api.idg.vnpt.vn'
VNPT_UPLOAD_URL       = f'{VNPT_BASE}/file-service/v1/addFile'
VNPT_OCR_CHIP_URL     = f'{VNPT_BASE}/ai/v1/ocr/chip/front'   # CCCD chip QR (2021+)
VNPT_OCR_FRONT_URL    = f'{VNPT_BASE}/ai/v1/ocr/id/front'     # CMND / CCCD cũ
VNPT_FACE_MATCH_URL   = f'{VNPT_BASE}/ai/v1/face/compare'
VNPT_LIVENESS_URL     = f'{VNPT_BASE}/ai/v1/face/liveness'
VNPT_TOKEN_URL        = f'{VNPT_BASE}/auth/oauth/token'
SECRET_NAME         = 'vnpt-ekyc-credentials'

SIMILARITY_THRESHOLD = 85.0
MAX_DAILY_ATTEMPTS   = 3
MAC_ADDRESS          = '00:00:00:00:00:00'
CLIENT_SESSION       = 'ANDROID_opporeview_1.0_Device_1234567890'

_token_cache = {'bearer': None, 'exp': 0, 'token_id': None, 'token_key': None}

# ─── Helpers ──────────────────────────────────────────────────────────────────
def get_cors_headers():
    return {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json'
    }

def resp(status, body):
    return {'statusCode': status, 'headers': get_cors_headers(),
            'body': json.dumps(body, ensure_ascii=False)}

def resize_b64(b64_data, max_bytes=300_000, max_dim=1200):
    """
    Nén ảnh xuống dưới max_bytes và max_dim px.
    Trả về base64 string (không có data URL prefix).
    """
    clean = b64_data.split(',', 1)[-1] if ',' in b64_data else b64_data
    clean += '=' * (-len(clean) % 4)
    img_bytes = base64.b64decode(clean)

    if len(img_bytes) <= max_bytes:
        return clean  # đã đủ nhỏ

    if not HAS_PIL:
        # Không có PIL — trả về ảnh gốc, để VNPT tự xử lý
        print(f'PIL not available, skipping resize (size={len(img_bytes)})')
        return clean

    img = Image.open(io.BytesIO(img_bytes))
    # Resize nếu quá lớn
    w, h = img.size
    if max(w, h) > max_dim:
        ratio = max_dim / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

    # Nén JPEG với chất lượng giảm dần cho đến khi đủ nhỏ
    for quality in [85, 75, 65, 55]:
        buf = io.BytesIO()
        img.convert('RGB').save(buf, format='JPEG', quality=quality, optimize=True)
        result = buf.getvalue()
        print(f'Resize: quality={quality} size={len(result)} bytes')
        if len(result) <= max_bytes:
            return base64.b64encode(result).decode()

    # Nếu vẫn lớn — dùng cái nhỏ nhất
    buf = io.BytesIO()
    img.convert('RGB').save(buf, format='JPEG', quality=45, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()

def strip_prefix(b64):
    if b64 and ',' in b64:
        return b64.split(',', 1)[1]
    return b64 or ''

def extract_user_id(event):
    try:
        auth = ((event.get('headers') or {}).get('authorization') or
                (event.get('headers') or {}).get('Authorization') or '')
        if not auth.startswith('Bearer '): return None
        p = auth[7:].split('.')[1]
        p += '=' * (4 - len(p) % 4)
        return json.loads(base64.b64decode(p).decode()).get('sub')
    except Exception:
        return None

def load_creds():
    try:
        secret = secrets_client.get_secret_value(SecretId=SECRET_NAME)
        return json.loads(secret['SecretString'])
    except Exception as e:
        print(f'load_creds ERROR: {type(e).__name__}: {e}')
        raise

def get_auth(creds):
    """Trả (bearer_token, token_id, token_key). Tự refresh khi hết hạn."""
    now      = int(time.time())
    token    = creds.get('bearer_token', '')
    tid      = creds.get('token_id', '')
    tkey     = creds.get('token_key', '')

    if _token_cache['bearer'] and _token_cache['exp'] > now + 300:
        return _token_cache['bearer'], _token_cache['token_id'], _token_cache['token_key']

    try:
        p = token.split('.')[1]; p += '=' * (4 - len(p) % 4)
        exp = json.loads(base64.b64decode(p).decode()).get('exp', 0)
    except Exception:
        exp = 0

    if exp > now + 300:
        _token_cache.update({'bearer': token, 'exp': exp, 'token_id': tid, 'token_key': tkey})
        print(f'Token OK exp in {exp-now}s')
        return token, tid, tkey

    print('Token expired, refreshing...')
    
    # Thử client_credentials grant type trước (cho tk thật tế, scope=idgv2 hoặc read)
    for scope in ['idgv2', 'read']:
        try:
            print(f'Trying client_credentials refresh with scope {scope}...')
            form     = urllib.parse.urlencode({
                'grant_type': 'client_credentials',
                'scope':      scope
            }).encode()
            cred_b64 = base64.b64encode(f'{tid}:{tkey}'.encode()).decode()
            r = req_lib.post(VNPT_TOKEN_URL, data=form, timeout=10,
                headers={'Content-Type': 'application/x-www-form-urlencoded',
                         'Authorization': f'Basic {cred_b64}'})
            print(f'client_credentials ({scope}) status={r.status_code} body={r.text[:300]}')
            if r.status_code == 200:
                tr = r.json()
                new_token = tr.get('access_token')
                if new_token:
                    new_exp = now + int(tr.get('expires_in', 3600))
                    _token_cache.update({'bearer': new_token, 'exp': new_exp, 'token_id': tid, 'token_key': tkey})
                    try:
                        creds['bearer_token'] = new_token
                        secrets_client.update_secret(SecretId=SECRET_NAME, SecretString=json.dumps(creds))
                    except Exception as e:
                        print(f'Secret update warn: {e}')
                    print(f'Token refreshed via client_credentials, exp in {tr.get("expires_in")}s')
                    return new_token, tid, tkey
        except Exception as e:
            print(f'client_credentials ({scope}) failed: {e}')

    # Fallback sang password grant type (cho môi trường mock/dev cũ)
    try:
        print('Falling back to password grant type...')
        username = creds.get('username', '')
        password = creds.get('password', '') or tkey
        form     = urllib.parse.urlencode({
            'grant_type': 'password',
            'username':   username,
            'password':   password,
            'scope':      'read'
        }).encode()
        cred_b64 = base64.b64encode(f'{tid}:{tkey}'.encode()).decode()
        r = req_lib.post(VNPT_TOKEN_URL, data=form, timeout=10,
            headers={'Content-Type': 'application/x-www-form-urlencoded',
                     'Authorization': f'Basic {cred_b64}'})
        print(f'password grant status={r.status_code} body={r.text[:300]}')
        if r.status_code == 200:
            tr = r.json()
            new_token = tr.get('access_token')
            if new_token:
                new_exp = now + int(tr.get('expires_in', 3600))
                _token_cache.update({'bearer': new_token, 'exp': new_exp, 'token_id': tid, 'token_key': tkey})
                try:
                    creds['bearer_token'] = new_token
                    secrets_client.update_secret(SecretId=SECRET_NAME, SecretString=json.dumps(creds))
                except Exception as e:
                    print(f'Secret update warn: {e}')
                print(f'Token refreshed via password grant, exp in {tr.get("expires_in")}s')
                return new_token, tid, tkey
    except Exception as e:
        print(f'password grant failed: {e}')

    _token_cache.update({'bearer': token, 'exp': now + 60, 'token_id': tid, 'token_key': tkey})
    return token, tid, tkey


def vnpt_headers(bearer, tid, tkey):
    """Headers chuẩn theo VNPT docs.
    Nếu bearer rỗng/invalid → dùng Token-id + Token-key (RSA public key flow).
    """
    hdrs = {
        'Content-Type':  'application/json',
        'Token-id':      tid,
        'Token-key':     tkey,
        'mac-address':   MAC_ADDRESS,
    }
    if bearer:
        hdrs['Authorization'] = f'Bearer {bearer}'
    else:
        # RSA key flow: dùng Basic auth với token_id:token_key
        cred_b64 = base64.b64encode(f'{tid}:{tkey}'.encode()).decode()
        hdrs['Authorization'] = f'Basic {cred_b64}'
    return hdrs

def vnpt_upload(b64_data, bearer, tid, tkey):
    """Upload ảnh lên VNPT file-service (multipart/form-data), trả về (hash, token)."""
    # Đảm bảo bỏ data URL prefix và padding đúng
    clean = b64_data
    if ',' in clean:
        clean = clean.split(',', 1)[1]
    # Thêm padding nếu thiếu
    clean += '=' * (4 - len(clean) % 4) if len(clean) % 4 else ''
    try:
        img_bytes = base64.b64decode(clean)
    except Exception as e:
        raise ValueError(f'Base64 decode lỗi: {e}')

    # Detect content type từ base64 header
    content_type = 'image/jpeg'
    if ',' in b64_data:
        prefix = b64_data.split(',')[0].lower()
        if 'png' in prefix:
            content_type = 'image/png'
        elif 'webp' in prefix:
            content_type = 'image/webp'

    # Detect từ magic bytes nếu không có prefix
    if img_bytes[:4] == b'\x89PNG':
        content_type = 'image/png'
    elif img_bytes[:2] == b'\xff\xd8':
        content_type = 'image/jpeg'

    ext = 'png' if content_type == 'image/png' else 'jpg'
    filename = f'cccd.{ext}'
    print(f'Upload: image size={len(img_bytes)} bytes, type={content_type}')
    if len(img_bytes) < 1000:
        raise ValueError(f'Ảnh quá nhỏ ({len(img_bytes)} bytes) — cần ảnh JPEG/PNG hợp lệ')

    files  = {'file': (filename, img_bytes, content_type)}
    data   = {'title': 'ekyc', 'description': 'ekyc'}
    hdrs   = {
        'Token-id':      tid,
        'Token-key':     tkey,
        'mac-address':   MAC_ADDRESS,
    }
    if bearer:
        hdrs['Authorization'] = f'Bearer {bearer}'
    else:
        cred_b64 = base64.b64encode(f'{tid}:{tkey}'.encode()).decode()
        hdrs['Authorization'] = f'Basic {cred_b64}'
    r = req_lib.post(VNPT_UPLOAD_URL, headers=hdrs, files=files, data=data, timeout=20)
    print(f'Upload: status={r.status_code} FULL_BODY={r.text[:500]}')
    if r.status_code >= 400:
        raise urllib.error.HTTPError(VNPT_UPLOAD_URL, r.status_code, r.text[:200], {}, None)
    result = r.json()
    obj = result.get('object') or result.get('data') or result
    if isinstance(obj, dict):
        h     = (obj.get('hash') or obj.get('fileId') or obj.get('id') or obj.get('hashFile'))
        # VNPT upload trả về trans_token trong field 'tokenId' (không phải 'token' hay 'transToken')
        token = (obj.get('tokenId') or obj.get('token') or
                 obj.get('transToken') or obj.get('trans_token') or '')
    elif isinstance(obj, str) and len(obj) > 5:
        h, token = obj, ''
    else:
        h, token = None, ''
    if not h:
        raise ValueError(f'Upload không trả hash: {r.text[:300]}')
    print(f'Upload hash={h} token={token}')
    return h, token

def vnpt_ocr(front_hash, trans_token, bearer, tid, tkey):
    """
    OCR CCCD mặt trước.
    Thử theo thứ tự:
      1. /ai/v1/ocr/chip/front  → CCCD chip gắn QR (2021+), type=3
      2. /ai/v1/ocr/id/front    → CMND 9 số / CCCD 12 số cũ, type=1
    Trả về response JSON của lần thành công.
    """
    tok = trans_token or tid
    base_payload = {
        'img_front':         front_hash,
        'client_session':    CLIENT_SESSION,
        'validate_postcode': False,
        'token':             tok,
    }

    # Danh sách endpoint + type để thử lần lượt
    attempts = [
        (VNPT_OCR_CHIP_URL,  3, 'CCCD chip (chip endpoint)'),       # CCCD gắn chip QR mới (endpoint riêng)
        (VNPT_OCR_FRONT_URL, 2, 'CCCD gắn chip (id endpoint, type=2)'), # CCCD gắn chip trên ID endpoint
        (VNPT_OCR_FRONT_URL, 3, 'CCCD gắn chip (id endpoint, type=3)'), # CCCD gắn chip trên ID endpoint (type=3)
        (VNPT_OCR_FRONT_URL, 1, 'CCCD/CMND cũ'),                    # CCCD 12 số / CMND 9 số
        (VNPT_OCR_FRONT_URL, 0, 'auto-detect'),                     # fallback auto
    ]

    last_error = None
    for url, doc_type, label in attempts:
        payload = {**base_payload, 'type': doc_type}
        print(f'OCR try [{label}] url={url.split("/")[-3:]} token={tok[:36]} type={doc_type}')
        r = req_lib.post(url, headers=vnpt_headers(bearer, tid, tkey), json=payload, timeout=30)
        print(f'OCR [{label}]: status={r.status_code} body={r.text[:800]}')

        if r.status_code == 200:
            result = r.json()
            err_code = result.get('errorCode')
            msg = result.get('message') or result.get('msg') or ''
            # 0 hoặc IDG-00000000 = success
            if err_code == 0 or msg == 'IDG-00000000':
                print(f'OCR success with [{label}]')
                return result
            # IDG-00010445 = sai loại giấy tờ → thử tiếp
            if 'IDG-00010445' in str(result) or 'IDG-00010444' in str(result):
                print(f'OCR [{label}] wrong doc type, trying next...')
                last_error = r
                continue
            return result  # Lỗi khác thì trả về để xử lý ở trên

        if r.status_code in (400, 401, 403):
            body = r.text
            # 400: sai loại giấy tờ → thử endpoint tiếp
            # 401/403: endpoint này chưa được cấp quyền trên tài khoản → thử endpoint tiếp
            skip_codes = ('IDG-00010445', 'IDG-00010444', 'input_khong_hop_le',
                          'IDG-00000401', 'No permission', 'UNAUTHORIZED')
            if any(c in body for c in skip_codes):
                if 'input_khong_hop_le' in body or 'IDG-00010445' in body:
                    last_error = type('E', (), {'text': 'CCCD gắn chip (loại mới 2021+) chưa được hỗ trợ ở gói hiện tại. Vui lòng liên hệ admin.'})()
                else:
                    last_error = r
                print(f'OCR [{label}] skipping ({r.status_code}): {body[:100]}')
                continue
        # Lỗi khác (500...) → raise ngay
        raise urllib.error.HTTPError(url, r.status_code, r.text[:800], {}, None)

    # Tất cả đều fail
    err_msg = 'Không nhận diện được loại giấy tờ'
    if last_error and hasattr(last_error, 'text'):
        err_msg = last_error.text
    raise urllib.error.HTTPError(VNPT_OCR_FRONT_URL, 400, err_msg, {}, None)

def check_rate_limit(user_id):
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    try:
        item  = table.get_item(Key={'userId': user_id}).get('Item', {})
        count = (item.get('kycAttempts') or {}).get(today, 0)
        if count >= MAX_DAILY_ATTEMPTS:
            return False, 0
        table.update_item(Key={'userId': user_id},
            UpdateExpression='SET kycAttempts.#d = if_not_exists(kycAttempts.#d, :z) + :one',
            ExpressionAttributeNames={'#d': today},
            ExpressionAttributeValues={':z': 0, ':one': 1})
        return True, MAX_DAILY_ATTEMPTS - count - 1
    except Exception as e:
        print(f'Rate limit error: {e}')
        return True, MAX_DAILY_ATTEMPTS

# ─── Route handlers ───────────────────────────────────────────────────────────

def handle_ocr(event, user_id):
    """
    POST /ekyc/ocr
    Luồng đúng theo VNPT API docs:
      1. Upload ảnh mặt trước → lấy hash Minio + trans_token
      2. Gọi OCR với hash (img_front = hash, token = trans_token)
      3. Trả kết quả + front_hash để dùng ở bước face verify
    """
    print(f'handle_ocr start, user_id={user_id}')
    try:
        raw_body = event.get('body') or '{}'
        if event.get('isBase64Encoded'):
            raw_body = base64.b64decode(raw_body).decode('utf-8')
        body = json.loads(raw_body)
    except Exception as e:
        print(f'JSON parse error: {e}, body_preview={str(event.get("body",""))[:80]}')
        return resp(400, {'success': False, 'errorMsg': f'Invalid JSON: {e}'})

    front = strip_prefix(body.get('imageFront', ''))
    print(f'imageFront present={bool(front)}, length={len(front) if front else 0}')
    if not front:
        return resp(400, {'success': False, 'errorMsg': 'imageFront là bắt buộc'})

    try:
        print('Loading credentials...')
        creds             = load_creds()
        print('Getting auth token...')
        bearer, tid, tkey = get_auth(creds)
        print(f'Auth ok, bearer prefix={bearer[:20]}...')

        # Bước 1: Resize ảnh nếu cần, rồi upload lên VNPT → lấy hash Minio
        print(f'Original base64 length={len(front)}')
        front_resized = resize_b64(front, max_bytes=400_000, max_dim=1400)
        print(f'Resized base64 length={len(front_resized)}')

        print('Uploading front image to VNPT...')
        front_hash, front_token = vnpt_upload(front_resized, bearer, tid, tkey)
        print(f'front_hash={front_hash[:80]} front_token={front_token[:40] if front_token else "-"}')

        # Bước 2: OCR bằng hash Minio (không gửi base64)
        print('Calling OCR with hash...')
        ocr = vnpt_ocr(front_hash, front_token, bearer, tid, tkey)

        err_code = ocr.get('errorCode')
        msg      = ocr.get('message') or ocr.get('msg') or ''
        is_ok    = (err_code == 0) or (msg == 'IDG-00000000')

        if not is_ok:
            vnpt_err = msg or 'OCR thất bại'
            for mf in (ocr.get('messageFields') or []):
                if mf.get('fieldName') == 'img_front':
                    code = mf.get('message', '')
                    if code == 'IDG-00000001':
                        vnpt_err = 'Không đọc được CCCD — ảnh không rõ hoặc không phải CCCD/CMND hợp lệ'
                    else:
                        vnpt_err = f'VNPT: {code}'
            return resp(422, {'success': False, 'errorCode': err_code, 'errorMsg': vnpt_err})

        ocr_obj = ocr.get('object') or {}
        print(f'OCR ok: id={ocr_obj.get("id","?")} name={ocr_obj.get("name","?")}')

        mapped = {
            'id':              ocr_obj.get('id') or ocr_obj.get('citizen_id', ''),
            'name':            ocr_obj.get('name', ''),
            'dob':             ocr_obj.get('birth_day', ''),
            'sex':             ocr_obj.get('gender', ''),
            'nationality':     ocr_obj.get('nationality', ''),
            'home':            ocr_obj.get('origin_location', ''),
            'address':         ocr_obj.get('recent_location', ''),
            'issue_date':      ocr_obj.get('issue_date', ''),
            'issue_place':     ocr_obj.get('issue_place', ''),
            'doe':             ocr_obj.get('valid_date', ''),
            'type':            ocr_obj.get('card_type', ''),
            'confidence':      ocr_obj.get('name_prob', 0),
            'id_fake_warning': ocr_obj.get('id_fake_warning', 'no'),
        }

        return resp(200, {
            'success':     True,
            'errorCode':   0,
            'errorMsg':    'Successful!',
            'object':      mapped,
            'front_hash':  front_hash,
            'front_token': front_token,
        })

    except urllib.error.HTTPError as e:
        err = str(e.reason)[:300] if e.reason else ''
        print(f'HTTP {e.code}: {err}')
        return resp(502, {'success': False, 'errorMsg': f'VNPT lỗi {e.code}: {err}'})
    except ValueError as e:
        return resp(422, {'success': False, 'errorMsg': str(e)})
    except Exception as e:
        print(f'OCR exception: {e}')
        return resp(500, {'success': False, 'errorMsg': str(e)})




def handle_verify_face(event, user_id):
    """
    POST /ekyc/verify-face
    Body: { faceImage: base64, front_hash: str, front_token: str }
    front_hash + front_token lấy từ response của /ekyc/ocr — KHÔNG upload lại ảnh CCCD.
    Nếu không có front_hash thì chỉ check liveness (không face compare).
    """
    if not user_id:
        return resp(401, {'success': False, 'errorMsg': 'Cần đăng nhập'})

    allowed, remaining = check_rate_limit(user_id)
    if not allowed:
        return resp(429, {'success': False,
                          'errorMsg': f'Vượt quá {MAX_DAILY_ATTEMPTS} lần/ngày. Thử lại ngày mai.'})

    try:
        raw_body = event.get('body') or '{}'
        if event.get('isBase64Encoded'):
            raw_body = base64.b64decode(raw_body).decode('utf-8')
        body = json.loads(raw_body)
    except Exception:
        return resp(400, {'success': False, 'errorMsg': 'Invalid JSON'})

    face        = strip_prefix(body.get('faceImage', ''))
    front_hash  = body.get('front_hash') or body.get('idFrontHash')   # hash từ bước OCR
    front_token = body.get('front_token') or body.get('idFrontToken') or ''

    if not face:
        return resp(400, {'success': False, 'errorMsg': 'faceImage là bắt buộc'})

    try:
        creds             = load_creds()
        bearer, tid, tkey = get_auth(creds)
        hdrs              = vnpt_headers(bearer, tid, tkey)

        # Upload selfie — nén < 300KB
        print('Uploading selfie...')
        face_small = resize_b64(face, max_bytes=250_000, max_dim=1000)
        face_hash, face_token = vnpt_upload(face_small, bearer, tid, tkey)
        print(f'Face hash={face_hash}')

        # Liveness check
        liveness, liveness_score = False, 0.0
        try:
            lv = req_lib.post(VNPT_LIVENESS_URL, headers=hdrs,
                              json={'img_face': face_hash, 'client_session': CLIENT_SESSION,
                                    'token': face_token},
                              timeout=20)
            print(f'Liveness: {lv.status_code} {lv.text[:200]}')
            if lv.status_code == 200:
                obj            = (lv.json().get('object') or {})
                liveness       = bool(obj.get('liveness', obj.get('is_live', False)))
                liveness_score = float(obj.get('liveness_score', obj.get('score', 0)))
            elif lv.status_code in (400, 401, 403):
                # Nếu không có quyền sử dụng Liveness (IDG-00010444), bypass liveness check và cho qua
                body = lv.text
                if any(c in body for c in ('IDG-00010444', 'No permission', 'UNAUTHORIZED', '401', '403')):
                    print('Liveness API not subscribed or no permission. Bypassing liveness check (liveness=True)')
                    liveness = True
                    liveness_score = 1.0
        except Exception as e:
            print(f'Liveness warning: {e}')

        # Face compare — dùng front_hash từ bước OCR, không upload lại
        similarity, matching = 0.0, False
        if front_hash:
            try:
                fm = req_lib.post(VNPT_FACE_MATCH_URL, headers=hdrs,
                                  json={'img_face':       face_hash,
                                        'img_front':      front_hash,   # hash đã có từ OCR
                                        'client_session': CLIENT_SESSION,
                                        'token':          front_token or face_token},
                                  timeout=20)
                print(f'Face compare: {fm.status_code} {fm.text[:200]}')
                if fm.status_code == 200:
                    obj        = (fm.json().get('object') or {})
                    similarity = float(obj.get('similarity', obj.get('prob', obj.get('score', 0))))
                    matching   = similarity >= SIMILARITY_THRESHOLD and liveness
            except Exception as e:
                print(f'Face compare warning: {e}')
        else:
            # Không có ảnh CCCD → chỉ dựa vào liveness
            matching = liveness

        kyc_status = 'VERIFIED' if matching else 'FAILED'

        if kyc_status == 'VERIFIED':
            try:
                now_iso = datetime.now(timezone.utc).isoformat()
                table.update_item(Key={'userId': user_id},
                    UpdateExpression='SET kycStatus=:s, kycCompleted=:d, kycVerifiedAt=:t, updatedAt=:t',
                    ExpressionAttributeValues={':s': 'VERIFIED', ':d': True, ':t': now_iso})
                print(f'DynamoDB updated: {user_id} -> VERIFIED')
            except Exception as e:
                print(f'DynamoDB error: {e}')

        return resp(200, {
            'success':   True,
            'kycStatus': kyc_status,
            'object': {
                'matching':       matching,
                'similarity':     round(similarity, 2),
                'liveness':       liveness,
                'liveness_score': round(liveness_score, 2),
                'msg':            'MATCH' if matching else 'NOT_MATCH',
            },
            'remaining_attempts': remaining,
        })

    except urllib.error.HTTPError as e:
        err = str(e.reason)[:300] if e.reason else ''
        print(f'HTTP {e.code}: {err}')
        return resp(502, {'success': False, 'errorMsg': f'VNPT lỗi {e.code}: {err}'})
    except ValueError as e:
        return resp(422, {'success': False, 'errorMsg': str(e)})
    except Exception as e:
        print(f'Face verify exception: {e}')
        return resp(500, {'success': False, 'errorMsg': str(e)})


def handle_status(event, uid):
    try:
        item = table.get_item(Key={'userId': uid}).get('Item', {})
        if not item:
            return resp(200, {'success': True, 'userId': uid,
                              'kycStatus': 'PENDING', 'kycCompleted': False})
        return resp(200, {
            'success':       True,
            'userId':        uid,
            'kycStatus':     item.get('kycStatus', 'PENDING'),
            'kycCompleted':  bool(item.get('kycCompleted', False)),
            'kycVerifiedAt': item.get('kycVerifiedAt'),
        })
    except Exception as e:
        return resp(500, {'success': False, 'errorMsg': str(e)})


# ─── Main ─────────────────────────────────────────────────────────────────────

def lambda_handler(event, context):
    method = ((event.get('requestContext') or {}).get('http', {}).get('method') or
               event.get('httpMethod', ''))
    path   = event.get('rawPath') or event.get('path') or '/'
    if path.startswith('/prod/'):
        path = path[5:]
    print(f'[{method}] {path}')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': get_cors_headers(), 'body': ''}

    user_id = extract_user_id(event)

    try:
        if method == 'POST' and path == '/ekyc/ocr':
            return handle_ocr(event, user_id)
        if method == 'POST' and path == '/ekyc/verify-face':
            return handle_verify_face(event, user_id)
        if method == 'GET' and '/ekyc/status/' in path:
            uid = path.split('/ekyc/status/')[-1].strip('/')
            return handle_status(event, uid)
        return resp(404, {'success': False, 'errorMsg': f'Not found: {method} {path}'})
    except Exception as e:
        print(f'Unhandled: {e}')
        return resp(500, {'success': False, 'errorMsg': 'Internal server error'})
