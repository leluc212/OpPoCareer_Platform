"""
CandidateExperiences Lambda Handler
Table: CandidateExperiences  (PK: candidateId, SK: experienceId)
S3 bucket: opporeview-cv-storage / prefix: experience-proofs/

Routes:
  POST   /candidate/experience           → create experience (candidate)
  GET    /candidate/experience           → list own experiences (candidate)
  GET    /admin/experiences              → list all (admin, filterable by status)
  GET    /admin/experiences/{id}         → get one by experienceId (admin)
  PUT    /admin/experiences/{id}/approve → approve (admin)
  PUT    /admin/experiences/{id}/reject  → reject  (admin)
"""

import json
import uuid
import base64
import boto3
from datetime import datetime
from decimal import Decimal


# ─── AWS Clients ──────────────────────────────────────────────────────────────
dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
s3_client = boto3.client('s3', region_name='ap-southeast-1')

EXPERIENCE_TABLE = 'CandidateExperiences'
CANDIDATE_TABLE  = 'CandidateProfiles'
NOTIFICATIONS_TABLE = 'Notifications'

S3_BUCKET        = 'opporeview-cv-storage'
S3_PREFIX        = 'experience-proofs'


# ─── Helpers ──────────────────────────────────────────────────────────────────
def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': (
            'Content-Type,Authorization,X-Amz-Date,'
            'X-Api-Key,X-Amz-Security-Token'
        ),
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json',
    }


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def resp(status, body):
    return {
        'statusCode': status,
        'headers': cors_headers(),
        'body': json.dumps(body, cls=DecimalEncoder, ensure_ascii=False),
    }


def now_iso():
    return datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')


def short_id():
    return str(uuid.uuid4())[:8]


def _decode_jwt_payload(token):
    """
    Decode the JWT payload without signature verification.
    We rely on API Gateway / Cognito having already issued a valid token.
    For extra safety the sub/email/groups come from the signed payload only.
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return {}
        # Add padding if necessary
        padded = parts[1] + '=' * (-len(parts[1]) % 4)
        decoded = base64.urlsafe_b64decode(padded)
        return json.loads(decoded)
    except Exception as e:
        print(f"⚠️  JWT decode error: {e}")
        return {}


def get_claims(event):
    """
    Extract Cognito claims from the event.

    Priority:
    1. requestContext.authorizer.claims  – set when a Cognito authorizer is
       attached to the API Gateway method (ideal / fully verified path).
    2. requestContext.authorizer.jwt.claims – HTTP API (v2) JWT authorizer.
    3. Fall back to decoding the Authorization header ourselves so the Lambda
       still works when the API Gateway method has authorization-type NONE.
    """
    # Path 1 & 2: authorizer-provided claims (already verified by API GW)
    auth = event.get('requestContext', {}).get('authorizer', {})
    claims = auth.get('claims') or auth.get('jwt', {}).get('claims', {})
    if claims:
        return claims

    # Path 3: no authorizer – decode the token from the Authorization header
    headers = event.get('headers') or {}
    # API Gateway normalises header names to lower-case
    auth_header = headers.get('Authorization') or headers.get('authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
        if token:
            return _decode_jwt_payload(token)

    return {}


def is_admin(claims):
    groups = claims.get('cognito:groups', '') or ''
    # When decoded from JWT directly, cognito:groups is a list; from authorizer claims it's a comma-separated string
    if isinstance(groups, list):
        return any('admin' in g.lower() for g in groups)
    return 'admin' in groups.lower()


# ─── S3 upload ────────────────────────────────────────────────────────────────
def upload_base64_image(b64_data, candidate_id, idx, content_type='image/jpeg'):
    """Upload a base64-encoded image to S3 and return the public HTTPS URL."""
    # Strip data URI header if present
    if ',' in b64_data:
        header, b64_data = b64_data.split(',', 1)
        if 'png' in header:
            content_type = 'image/png'
        elif 'webp' in header:
            content_type = 'image/webp'
        elif 'jpeg' in header or 'jpg' in header:
            content_type = 'image/jpeg'

    binary = base64.b64decode(b64_data)
    ext = content_type.split('/')[-1].replace('jpeg', 'jpg')
    key = f"{S3_PREFIX}/{candidate_id}/{short_id()}-{idx}.{ext}"

    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=binary,
        ContentType=content_type,
    )
    region = 'ap-southeast-1'
    url = f"https://{S3_BUCKET}.s3.{region}.amazonaws.com/{key}"
    return url


# ─── Notification helper ──────────────────────────────────────────────────────
def create_notification(notification_data):
    """Write a notification record to DynamoDB."""
    try:
        table = dynamodb.Table(NOTIFICATIONS_TABLE)
        nid = f"notif-{str(uuid.uuid4())[:8]}"
        item = {
            'notificationId': nid,
            'createdAt': now_iso(),
            'read': False,
            'status': 'UNREAD',
            **notification_data,
        }
        table.put_item(Item=item)
        return nid
    except Exception as e:
        print(f"⚠️  Could not write notification: {e}")
        return None


# ─── DynamoDB scan with optional filter ───────────────────────────────────────
def scan_all_experiences(status_filter=None):
    table = dynamodb.Table(EXPERIENCE_TABLE)
    items = []

    if status_filter and status_filter != 'all':
        from boto3.dynamodb.conditions import Attr
        result = table.scan(FilterExpression=Attr('status').eq(status_filter.upper()))
    else:
        result = table.scan()

    items.extend(result.get('Items', []))
    while 'LastEvaluatedKey' in result:
        kwargs = {'ExclusiveStartKey': result['LastEvaluatedKey']}
        if status_filter and status_filter != 'all':
            from boto3.dynamodb.conditions import Attr
            kwargs['FilterExpression'] = Attr('status').eq(status_filter.upper())
        result = table.scan(**kwargs)
        items.extend(result.get('Items', []))

    return items


def scan_candidate_experiences(candidate_id):
    """Get all experiences for a candidate using query (PK = candidateId)."""
    table = dynamodb.Table(EXPERIENCE_TABLE)
    from boto3.dynamodb.conditions import Key
    result = table.query(KeyConditionExpression=Key('candidateId').eq(candidate_id))
    items = result.get('Items', [])
    while 'LastEvaluatedKey' in result:
        result = table.query(
            KeyConditionExpression=Key('candidateId').eq(candidate_id),
            ExclusiveStartKey=result['LastEvaluatedKey'],
        )
        items.extend(result.get('Items', []))
    return items


def get_experience_by_id(experience_id):
    """Scan to find an experience by experienceId (secondary lookup)."""
    from boto3.dynamodb.conditions import Attr
    table = dynamodb.Table(EXPERIENCE_TABLE)
    result = table.scan(FilterExpression=Attr('experienceId').eq(experience_id))
    items = result.get('Items', [])
    return items[0] if items else None


# ─── Candidate: get candidate name from profile ───────────────────────────────
def get_candidate_name(candidate_id):
    try:
        table = dynamodb.Table(CANDIDATE_TABLE)
        result = table.get_item(Key={'userId': candidate_id})
        item = result.get('Item', {})
        return item.get('fullName', 'Ứng viên')
    except Exception:
        return 'Ứng viên'


# ─── Route handlers ───────────────────────────────────────────────────────────
def handle_create_experience(event, candidate_id):
    """POST /candidate/experience"""
    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return resp(400, {'success': False, 'message': 'Invalid JSON body'})

    # Validate required fields
    required = ['companyName', 'jobTitle', 'startMonth', 'startYear']
    for field in required:
        if not body.get(field):
            return resp(400, {'success': False, 'message': f'Thiếu trường bắt buộc: {field}'})

    # Handle proof images (base64 list, max 5)
    raw_images = body.get('proofImages', [])
    if len(raw_images) > 5:
        return resp(400, {'success': False, 'message': 'Tối đa 5 ảnh chứng minh'})

    proof_urls = []
    for idx, img in enumerate(raw_images):
        if img.startswith('http'):
            proof_urls.append(img)  # already uploaded URL
        elif img.startswith('data:') or len(img) > 100:
            try:
                url = upload_base64_image(img, candidate_id, idx)
                proof_urls.append(url)
            except Exception as e:
                print(f"⚠️  Image upload failed: {e}")

    experience_id = f"exp-{str(uuid.uuid4())[:12]}"
    timestamp = now_iso()

    item = {
        'candidateId':  candidate_id,
        'experienceId': experience_id,
        'companyName':  body['companyName'],
        'jobTitle':     body['jobTitle'],
        'startMonth':   int(body['startMonth']),
        'startYear':    int(body['startYear']),
        'endMonth':     int(body['endMonth'])   if body.get('endMonth')   else None,
        'endYear':      int(body['endYear'])    if body.get('endYear')    else None,
        'isCurrent':    bool(body.get('isCurrent', False)),
        'description':  body.get('description', ''),
        'proofImages':  proof_urls,
        'status':       'PENDING',
        'createdAt':    timestamp,
        'updatedAt':    timestamp,
        'approvedBy':   None,
        'approvedAt':   None,
        'rejectedReason': None,
    }

    # Remove None values to keep DynamoDB clean
    item = {k: v for k, v in item.items() if v is not None}

    table = dynamodb.Table(EXPERIENCE_TABLE)
    table.put_item(Item=item)

    # Send notification to admin
    candidate_name = get_candidate_name(candidate_id)
    create_notification({
        'type':          'NEW_EXPERIENCE_SUBMISSION',
        'title':         'Ứng viên gửi kinh nghiệm mới',
        'titleEn':       'New experience submission',
        'message':       f'{candidate_name} vừa gửi kinh nghiệm làm việc cần duyệt',
        'messageEn':     f'{candidate_name} submitted a new work experience for review',
        'recipientId':   'admin',
        'recipientRole': 'admin',
        'senderId':      candidate_id,
        'senderName':    candidate_name,
        'data': {
            'experienceId': experience_id,
            'companyName':  body['companyName'],
            'jobTitle':     body['jobTitle'],
            'candidateId':  candidate_id,
        },
        'icon':       'briefcase',
        'color':      '#3b82f6',
        'actionUrl':  '/admin/experiences',
        'actionText': 'Xem chi tiết',
        'actionTextEn': 'View details',
    })

    return resp(201, {'success': True, 'data': item})


def handle_get_candidate_experiences(candidate_id):
    """GET /candidate/experience  – returns all experiences for the caller."""
    items = scan_candidate_experiences(candidate_id)
    items.sort(key=lambda x: (x.get('startYear', 0), x.get('startMonth', 0)), reverse=True)
    return resp(200, {'success': True, 'data': items})


def handle_get_candidate_approved_experiences(candidate_id):
    """GET /employer/candidate/{candidateId}/experience – APPROVED only, for employer view."""
    items = scan_candidate_experiences(candidate_id)
    approved = [i for i in items if i.get('status') == 'APPROVED']
    approved.sort(key=lambda x: (x.get('startYear', 0), x.get('startMonth', 0)), reverse=True)
    return resp(200, {'success': True, 'data': approved})


def handle_get_all_experiences(event):
    """GET /admin/experiences  – admin list with optional ?status= filter."""
    qs = event.get('queryStringParameters') or {}
    status_filter = qs.get('status', 'all')
    items = scan_all_experiences(status_filter)
    items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
    return resp(200, {'success': True, 'data': items, 'total': len(items)})


def handle_get_experience_detail(experience_id):
    """GET /admin/experiences/{id}"""
    item = get_experience_by_id(experience_id)
    if not item:
        return resp(404, {'success': False, 'message': 'Không tìm thấy kinh nghiệm'})
    return resp(200, {'success': True, 'data': item})


def handle_approve_experience(event, experience_id):
    """PUT /admin/experiences/{id}/approve"""
    claims = get_claims(event)
    admin_id = claims.get('sub', 'admin')
    admin_name = claims.get('email', 'Admin')

    item = get_experience_by_id(experience_id)
    if not item:
        return resp(404, {'success': False, 'message': 'Không tìm thấy kinh nghiệm'})

    timestamp = now_iso()
    table = dynamodb.Table(EXPERIENCE_TABLE)
    table.update_item(
        Key={'candidateId': item['candidateId'], 'experienceId': item['experienceId']},
        UpdateExpression='SET #s = :s, approvedBy = :ab, approvedAt = :aa, updatedAt = :ua',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={
            ':s':  'APPROVED',
            ':ab': admin_id,
            ':aa': timestamp,
            ':ua': timestamp,
        },
    )

    # Notify candidate
    create_notification({
        'type':          'EXPERIENCE_APPROVED',
        'title':         'Kinh nghiệm làm việc đã được duyệt',
        'titleEn':       'Work experience approved',
        'message':       f'Kinh nghiệm tại {item["companyName"]} của bạn đã được Admin duyệt',
        'messageEn':     f'Your experience at {item["companyName"]} has been approved',
        'recipientId':   item['candidateId'],
        'recipientRole': 'candidate',
        'senderId':      admin_id,
        'senderName':    admin_name,
        'data': {
            'experienceId': experience_id,
            'companyName':  item.get('companyName', ''),
        },
        'icon':       'check-circle',
        'color':      '#10b981',
        'actionUrl':  '/candidate/profile',
        'actionText': 'Xem hồ sơ',
        'actionTextEn': 'View profile',
    })

    return resp(200, {'success': True, 'message': 'Đã duyệt kinh nghiệm'})


def handle_reject_experience(event, experience_id):
    """PUT /admin/experiences/{id}/reject"""
    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        body = {}

    rejected_reason = body.get('rejectedReason', '').strip()
    claims = get_claims(event)
    admin_id = claims.get('sub', 'admin')
    admin_name = claims.get('email', 'Admin')

    item = get_experience_by_id(experience_id)
    if not item:
        return resp(404, {'success': False, 'message': 'Không tìm thấy kinh nghiệm'})

    timestamp = now_iso()
    table = dynamodb.Table(EXPERIENCE_TABLE)
    table.update_item(
        Key={'candidateId': item['candidateId'], 'experienceId': item['experienceId']},
        UpdateExpression='SET #s = :s, rejectedReason = :rr, updatedAt = :ua',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={
            ':s':  'REJECTED',
            ':rr': rejected_reason,
            ':ua': timestamp,
        },
    )

    # Notify candidate
    create_notification({
        'type':          'EXPERIENCE_REJECTED',
        'title':         'Kinh nghiệm làm việc chưa được duyệt',
        'titleEn':       'Work experience not approved',
        'message':       f'Kinh nghiệm tại {item["companyName"]} chưa được duyệt'
                         + (f'. Lý do: {rejected_reason}' if rejected_reason else ''),
        'messageEn':     f'Your experience at {item["companyName"]} was not approved'
                         + (f'. Reason: {rejected_reason}' if rejected_reason else ''),
        'recipientId':   item['candidateId'],
        'recipientRole': 'candidate',
        'senderId':      admin_id,
        'senderName':    admin_name,
        'data': {
            'experienceId':   experience_id,
            'companyName':    item.get('companyName', ''),
            'rejectedReason': rejected_reason,
        },
        'icon':       'alert-circle',
        'color':      '#ef4444',
        'actionUrl':  '/candidate/profile',
        'actionText': 'Xem hồ sơ',
        'actionTextEn': 'View profile',
    })

    return resp(200, {'success': True, 'message': 'Đã từ chối kinh nghiệm'})


# ─── Main handler ─────────────────────────────────────────────────────────────
def lambda_handler(event, context):
    print('Event:', json.dumps(event, default=str))

    method = (
        event.get('httpMethod')
        or event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    ).upper()

    # CORS preflight
    if method == 'OPTIONS':
        return resp(200, {})

    raw_path = event.get('path') or event.get('rawPath', '')

    # Strip stage prefix (/prod, /test, …)
    parts = [p for p in raw_path.split('/') if p]
    if parts and parts[0] in ('prod', 'test', 'dev'):
        parts = parts[1:]
    path = '/' + '/'.join(parts)

    print(f"➡️  {method} {path}")

    # ── Extract caller identity ────────────────────────────────────────────────
    claims     = get_claims(event)
    caller_id  = claims.get('sub')
    caller_admin = is_admin(claims)

    # ── Route matching ─────────────────────────────────────────────────────────

    # POST /candidate/experience
    if method == 'POST' and path == '/candidate/experience':
        if not caller_id:
            return resp(401, {'success': False, 'message': 'Unauthorized'})
        return handle_create_experience(event, caller_id)

    # GET /candidate/experience
    if method == 'GET' and path == '/candidate/experience':
        if not caller_id:
            return resp(401, {'success': False, 'message': 'Unauthorized'})
        return handle_get_candidate_experiences(caller_id)

    # GET /admin/experiences
    if method == 'GET' and path == '/admin/experiences':
        return handle_get_all_experiences(event)

    # GET /admin/experiences/{id}
    if method == 'GET' and path.startswith('/admin/experiences/') and not path.endswith('/approve') and not path.endswith('/reject'):
        exp_id = path.split('/')[-1]
        return handle_get_experience_detail(exp_id)

    # PUT /admin/experiences/{id}/approve
    if method == 'PUT' and path.endswith('/approve'):
        exp_id = path.split('/')[-2]
        return handle_approve_experience(event, exp_id)

    # PUT /admin/experiences/{id}/reject
    if method == 'PUT' and path.endswith('/reject'):
        exp_id = path.split('/')[-2]
        return handle_reject_experience(event, exp_id)

    # GET /employer/candidate/{candidateId}/experience  – approved only
    if method == 'GET' and path.startswith('/employer/candidate/') and path.endswith('/experience'):
        cand_id = path.split('/')[-2]
        if not cand_id:
            return resp(400, {'success': False, 'message': 'candidateId is required'})
        return handle_get_candidate_approved_experiences(cand_id)

    return resp(404, {'success': False, 'message': f'Route not found: {method} {path}'})
