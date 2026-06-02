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

import json, boto3, base64, urllib.error, urllib.parse, time, ssl
from datetime import datetime, timezone
from decimal import Decimal
import requests as req_lib

# ─── AWS ──────────────────────────────────────────────────────────────────────
dynamodb       = boto3.resource('dynamodb', region_name='ap-southeast-1')
secrets_client = boto3.client('secretsmanager', region_name='ap-southeast-1')
table          = dynamodb.Table('CandidateProfiles')

# ─── VNPT endpoints ───────────────────────────────────────────────────────────
VNPT_BASE           = 'https://api.idg.vnpt.vn'
VNPT_UPLOAD_URL     = f'{VNPT_BASE}/file-service/v1/addFile'
VNPT_OCR_FRONT_URL  = f'{VNPT_BASE}/ai/v1/ocr/id/front'
VNPT_FACE_MATCH_URL = f'{VNPT_BASE}/ai/v1/face/compare'
VNPT_LIVENESS_URL   = f'{VNPT_BASE}/ai/v1/face/liveness'
VNPT_TOKEN_URL      = f'{VNPT_BASE}/auth/oauth/token'
SECRET_NAME         = 'vnpt-ekyc-credentials'

SIMILARITY_THRESHOLD = 85.0
MAX_DAILY_ATTEMPTS   = 3
MAC_ADDRESS          = 'TEST1'
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
    secret = secrets_client.get_secret_value(SecretId=SECRET_NAME)
    return json.loads(secret['SecretString'])

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

    # Refresh
    print('Token expired, refreshing...')
    try:
        form     = urllib.parse.urlencode({'grant_type': 'client_credentials', 'scope': 'read'}).encode()
        cred_b64 = base64.b64encode(f'{tid}:{tkey}'.encode()).decode()
        r = req_lib.post(VNPT_TOKEN_URL, data=form, timeout=10,
            headers={'Content-Type': 'application/x-www-form-urlencoded',
                     'Authorization': f'Basic {cred_b64}'})
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
                print(f'Token refreshed, exp in {tr.get("expires_in")}s')
                return new_token, tid, tkey
    except Exception as e:
        print(f'Token refresh failed: {e}')

    _token_cache.update({'bearer': token, 'exp': now + 60, 'token_id': tid, 'token_key': tkey})
    return token, tid, tkey

def vnpt_headers(bearer, tid, tkey):
    """Headers chuẩn theo VNPT docs."""
    return {
        'Content-Type':  'application/json',
        'Authorization': f'Bearer {bearer}',
        'Token-id':      tid,
        'Token-key':     tkey,
        'mac-address':   MAC_ADDRESS,
    }

def vnpt_upload(b64_data, bearer, tid, tkey):
    """Upload ảnh lên VNPT file-service (multipart/form-data), trả về hash."""
    img_bytes = base64.b64decode(b64_data)
    files  = {'file': ('image.jpg', img_bytes, 'image/jpeg')}
    data   = {'title': 'ekyc', 'description': 'ekyc'}
    hdrs   = {
        'Authorization': f'Bearer {bearer}',
        'Token-id':      tid,
        'Token-key':     tkey,
        'mac-address':   MAC_ADDRESS,
    }
    r = req_lib.post(VNPT_UPLOAD_URL, headers=hdrs, files=files, data=data, timeout=20)
    print(f'Upload: status={r.status_code} body={r.text[:200]}')
    if r.status_code >= 400:
        raise urllib.error.HTTPError(VNPT_UPLOAD_URL, r.status_code, r.text[:200], {}, None)
    result = r.json()
    obj = result.get('object') or result.get('data') or result
    if isinstance(obj, dict):
        h = (obj.get('hash') or obj.get('fileId') or obj.get('id') or obj.get('hashFile'))
    elif isinstance(obj, str) and len(obj) > 5:
        h = obj
    else:
        h = None
    if not h:
        raise ValueError(f'Upload không trả hash: {r.text[:200]}')
    return h

def vnpt_ocr(b64_front, bearer, tid, tkey):
    """
    OCR CCCD mặt trước.
    Body: img_front (base64 thuần), client_session, type=1 (CCCD)
    """
    payload = {
        'img_front':        b64_front,
        'client_session':   CLIENT_SESSION,
        'type':             1,
        'validate_postcode': False,
        'token':            '',   # VNPT yêu cầu field này (có thể để rỗng)
    }
    r = req_lib.post(VNPT_OCR_FRONT_URL,
                     headers=vnpt_headers(bearer, tid, tkey),
                     json=payload, timeout=30)
    print(f'OCR: status={r.status_code} body={r.text[:300]}')
    if r.status_code >= 400:
        raise urllib.error.HTTPError(VNPT_OCR_FRONT_URL, r.status_code, r.text[:300], {}, None)
    return r.json()

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
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return resp(400, {'success': False, 'errorMsg': 'Invalid JSON'})

    front = strip_prefix(body.get('imageFront', ''))
    if not front:
        return resp(400, {'success': False, 'errorMsg': 'imageFront là bắt buộc'})

    try:
        creds          = load_creds()
        bearer, tid, tkey = get_auth(creds)

        # Gọi OCR trực tiếp với base64 — không cần upload trước
        ocr = vnpt_ocr(front, bearer, tid, tkey)

        err_code = ocr.get('errorCode') or (0 if ocr.get('message') == 'IDG-00000000' else -1)
        if err_code != 0 and ocr.get('message') != 'IDG-00000000':
            return resp(422, {'success': False,
                              'errorCode': err_code,
                              'errorMsg': ocr.get('message') or ocr.get('errorMessage') or 'OCR thất bại'})

        ocr_obj = ocr.get('object') or {}

        # Map field names sang format frontend expect
        mapped = {
            'id':          ocr_obj.get('id') or ocr_obj.get('citizen_id', ''),
            'name':        ocr_obj.get('name', ''),
            'dob':         ocr_obj.get('birth_day', ''),
            'sex':         ocr_obj.get('gender', ''),
            'nationality': ocr_obj.get('nationality', ''),
            'home':        ocr_obj.get('origin_location', ''),
            'address':     ocr_obj.get('recent_location', ''),
            'issue_date':  ocr_obj.get('issue_date', ''),
            'issue_place': ocr_obj.get('issue_place', ''),
            'doe':         ocr_obj.get('valid_date', ''),
            'type':        ocr_obj.get('card_type', ''),
            'confidence':  ocr_obj.get('name_prob', 0),
            'id_fake_warning': ocr_obj.get('id_fake_warning', 'no'),
        }

        return resp(200, {
            'success':   True,
            'errorCode': 0,
            'errorMsg':  'Successful!',
            'object':    mapped,
            'raw':       ocr_obj,
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
    if not user_id:
        return resp(401, {'success': False, 'errorMsg': 'Cần đăng nhập'})

    allowed, remaining = check_rate_limit(user_id)
    if not allowed:
        return resp(429, {'success': False,
                          'errorMsg': f'Vượt quá {MAX_DAILY_ATTEMPTS} lần/ngày. Thử lại ngày mai.'})

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return resp(400, {'success': False, 'errorMsg': 'Invalid JSON'})

    face     = strip_prefix(body.get('faceImage', ''))
    id_front = strip_prefix(body.get('idFrontImage', '')) if body.get('idFrontImage') else None
    if not face:
        return resp(400, {'success': False, 'errorMsg': 'faceImage là bắt buộc'})

    try:
        creds             = load_creds()
        bearer, tid, tkey = get_auth(creds)
        hdrs              = vnpt_headers(bearer, tid, tkey)

        # Upload ảnh selfie
        print('Uploading selfie...')
        face_hash = vnpt_upload(face, bearer, tid, tkey)
        print(f'Face hash: {face_hash}')

        # Upload CCCD nếu có
        id_hash = None
        if id_front:
            print('Uploading ID front...')
            id_hash = vnpt_upload(id_front, bearer, tid, tkey)
            print(f'ID hash: {id_hash}')

        # Liveness
        liveness, liveness_score = False, 0.0
        try:
            lv = req_lib.post(VNPT_LIVENESS_URL, headers=hdrs,
                              json={'img_face': face_hash, 'client_session': CLIENT_SESSION},
                              timeout=20)
            print(f'Liveness: {lv.status_code} {lv.text[:200]}')
            if lv.status_code == 200:
                lv_data = lv.json()
                obj = lv_data.get('object') or {}
                liveness       = bool(obj.get('liveness', obj.get('is_live', False)))
                liveness_score = float(obj.get('liveness_score', obj.get('score', 0)))
        except Exception as e:
            print(f'Liveness warning: {e}')

        # Face compare
        similarity, matching = 0.0, False
        if id_hash:
            try:
                fm = req_lib.post(VNPT_FACE_MATCH_URL, headers=hdrs,
                                  json={'img_face': face_hash, 'img_front': id_hash,
                                        'client_session': CLIENT_SESSION},
                                  timeout=20)
                print(f'Face compare: {fm.status_code} {fm.text[:200]}')
                if fm.status_code == 200:
                    fm_data    = fm.json()
                    obj        = fm_data.get('object') or {}
                    similarity = float(obj.get('similarity', obj.get('prob', obj.get('score', 0))))
                    matching   = similarity >= SIMILARITY_THRESHOLD and liveness
            except Exception as e:
                print(f'Face compare warning: {e}')
        else:
            matching = liveness

        kyc_status = 'VERIFIED' if matching else 'FAILED'

        if kyc_status == 'VERIFIED':
            try:
                now_iso = datetime.now(timezone.utc).isoformat()
                table.update_item(Key={'userId': user_id},
                    UpdateExpression='SET kycStatus=:s, kycCompleted=:d, kycVerifiedAt=:t, updatedAt=:t',
                    ExpressionAttributeValues={':s': 'VERIFIED', ':d': True, ':t': now_iso})
                print(f'DynamoDB: {user_id} -> VERIFIED')
            except Exception as e:
                print(f'DynamoDB error: {e}')

        return resp(200, {
            'success':    True,
            'kycStatus':  kyc_status,
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
