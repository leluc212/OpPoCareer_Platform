"""
Test thử tất cả type value trên /ai/v1/ocr/id/front
để tìm type nào gói free trial chấp nhận với CCCD chip.
Chạy: python test_vnpt_types.py <path_to_cccd_front_image.jpg>
"""
import subprocess, json, base64, sys, urllib.request, urllib.error, time

# Lấy credentials
result = subprocess.run(
    ['aws', 'secretsmanager', 'get-secret-value',
     '--secret-id', 'vnpt-ekyc-credentials',
     '--region', 'ap-southeast-1',
     '--query', 'SecretString', '--output', 'text'],
    capture_output=True, text=True
)
d = json.loads(result.stdout.strip())
bearer = d.get('bearer_token', '')
tid    = d.get('token_id', '')
tkey   = d.get('token_key', '')

VNPT_BASE = 'https://api.idg.vnpt.vn'
MAC       = '00:00:00:00:00:00'
SESSION   = 'TEST_opporeview'

def headers():
    return {
        'Authorization': f'Bearer {bearer}',
        'Token-id': tid,
        'Token-key': tkey,
        'mac-address': MAC,
    }

# ── Step 1: Upload ảnh ─────────────────────────────────────────────────────────
img_path = sys.argv[1] if len(sys.argv) > 1 else None
if not img_path:
    print("Usage: python test_vnpt_types.py <image.jpg>")
    sys.exit(1)

with open(img_path, 'rb') as f:
    img_bytes = f.read()

print(f"Image: {len(img_bytes)} bytes")

import urllib.parse
boundary = 'BOUNDARY12345'
body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="cccd.jpg"\r\n'
    f'Content-Type: image/jpeg\r\n\r\n'
).encode() + img_bytes + f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nekyc\r\n--{boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nekyc\r\n--{boundary}--\r\n'.encode()

upload_headers = {**headers(), 'Content-Type': f'multipart/form-data; boundary={boundary}'}
req = urllib.request.Request(f'{VNPT_BASE}/file-service/v1/addFile', data=body, headers=upload_headers)
try:
    with urllib.request.urlopen(req, timeout=20) as r:
        upload_result = json.loads(r.read().decode())
        obj = upload_result.get('object', {})
        file_hash  = obj.get('hash', '')
        file_token = obj.get('tokenId', obj.get('token', tid))
        print(f"Upload OK: hash={file_hash[:60]}")
        print(f"           token={file_token[:40]}")
except urllib.error.HTTPError as e:
    print(f"Upload FAILED {e.code}: {e.read().decode()[:200]}")
    sys.exit(1)

# ── Step 2: Thử từng endpoint + type ──────────────────────────────────────────
ATTEMPTS = [
    ('/ai/v1/ocr/id/front',   0, 'id/front type=0 auto'),
    ('/ai/v1/ocr/id/front',   1, 'id/front type=1 CCCD chip'),
    ('/ai/v1/ocr/id/front',   2, 'id/front type=2 CMND'),
    ('/ai/v1/ocr/id/front',   3, 'id/front type=3'),
    ('/ai/v1/ocr/id/front',   4, 'id/front type=4'),
    ('/ai/v1/ocr/chip/front', 0, 'chip/front type=0'),
    ('/ai/v1/ocr/chip/front', 1, 'chip/front type=1'),
    ('/ai/v1/ocr/chip/front', 3, 'chip/front type=3'),
]

for path, doc_type, label in ATTEMPTS:
    url = f'{VNPT_BASE}{path}'
    payload = json.dumps({
        'img_front':         file_hash,
        'client_session':    SESSION,
        'type':              doc_type,
        'validate_postcode': False,
        'token':             file_token,
    }).encode()
    ocr_headers = {**headers(), 'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=payload, headers=ocr_headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            res = json.loads(r.read().decode())
            msg = res.get('message', '')
            err = res.get('errorCode', '?')
            obj = res.get('object', {})
            name = obj.get('name', '') if obj else ''
            print(f"  200 [{label}]: errorCode={err} msg={msg} name={name}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:150]
        print(f"  {e.code} [{label}]: {body[:100]}")
    except Exception as ex:
        print(f"  ERR [{label}]: {ex}")
    time.sleep(0.3)
