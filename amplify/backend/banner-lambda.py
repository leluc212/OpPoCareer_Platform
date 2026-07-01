"""
Banner Management Lambda
Handles CRUD for banners stored in DynamoDB + image upload to S3.

DynamoDB table: Banners
  PK: bannerId (String)
  Attributes: title, imageUrl, linkUrl, isActive, order, createdAt, updatedAt

S3 bucket: opporeview-cv-storage  (folder: banner/)

Expected API Gateway routes (proxy integration):
  GET    /banners                  → list all
  POST   /banners                  → create banner record
  PUT    /banners/{bannerId}        → update
  DELETE /banners/{bannerId}        → delete
  POST   /banners/upload            → upload image to S3, returns imageUrl
"""

import json
import boto3
import os
import base64
import uuid
from datetime import datetime, timezone
from decimal import Decimal


class DecimalEncoder(json.JSONEncoder):
    """Handle DynamoDB Decimal types returned by boto3."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            # Return int if whole number, else float
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)

# ── Config ─────────────────────────────────────────────────────────────────────
BANNERS_TABLE = os.environ.get('BANNERS_TABLE', 'Banners')
S3_BUCKET     = os.environ.get('S3_BUCKET', 'opporeview-cv-storage')
S3_REGION     = os.environ.get('S3_REGION', 'ap-southeast-1')
MAX_ACTIVE    = int(os.environ.get('MAX_ACTIVE_BANNERS', '5'))

dynamodb = boto3.resource('dynamodb', region_name=S3_REGION)
s3       = boto3.client('s3', region_name=S3_REGION)
table    = dynamodb.Table(BANNERS_TABLE)

CORS_HEADERS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def ok(data, status=200):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(data, cls=DecimalEncoder)}


def err(message, status=400):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps({'error': message})}


# ── Handlers ───────────────────────────────────────────────────────────────────

def list_banners():
    try:
        resp = table.scan()
        banners = sorted(resp.get('Items', []), key=lambda b: b.get('order', 0))
        return ok({'banners': banners})
    except Exception as e:
        return err(str(e), 500)


def create_banner(body):
    try:
        banner_id = f"banner_{uuid.uuid4().hex[:12]}"
        item = {
            'bannerId':  banner_id,
            'title':     body.get('title', ''),
            'imageUrl':  body.get('imageUrl', ''),
            'linkUrl':   body.get('linkUrl', ''),
            'isActive':  body.get('isActive', False),
            'order':     int(body.get('order', 0)),
            'targetRegions': body.get('targetRegions', []),  # [] = all regions
            'isTopSpotlight': body.get('isTopSpotlight', False),
            'displayTime': body.get('displayTime'),
            'expiredAt': body.get('expiredAt'),
            'createdAt': now_iso(),
            'updatedAt': now_iso(),
        }
        # Remove None values to avoid DB pollution and legacy boto3 issues
        item = {k: v for k, v in item.items() if v is not None}
        table.put_item(Item=item)
        return ok({'banner': item}, 201)
    except Exception as e:
        return err(str(e), 500)


def update_banner(banner_id, body):
    try:
        # Build expression
        updates = {
            'title':     body.get('title'),
            'imageUrl':  body.get('imageUrl'),
            'linkUrl':   body.get('linkUrl'),
            'isActive':  body.get('isActive'),
            'order':     body.get('order'),
            'updatedAt': now_iso(),
        }
        # targetRegions can be an empty list (meaning all regions), so check key existence
        if 'targetRegions' in body:
            updates['targetRegions'] = body['targetRegions']

        # Check explicit fields to allow setting them to None/null
        for field in ['isTopSpotlight', 'displayTime', 'expiredAt']:
            if field in body:
                updates[field] = body[field]

        # Remove None values except for explicit fields that can be set to None/null
        updates = {k: v for k, v in updates.items() if v is not None or k in ['displayTime', 'expiredAt']}

        expr_parts = [f'#k_{k} = :v_{k}' for k in updates]
        expr_names = {f'#k_{k}': k for k in updates}
        expr_vals  = {f':v_{k}': v for k, v in updates.items()}

        resp = table.update_item(
            Key={'bannerId': banner_id},
            UpdateExpression='SET ' + ', '.join(expr_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_vals,
            ReturnValues='ALL_NEW'
        )
        return ok({'banner': resp.get('Attributes', {})})
    except Exception as e:
        return err(str(e), 500)


def delete_banner(banner_id):
    try:
        table.delete_item(Key={'bannerId': banner_id})
        return ok({'message': 'Deleted'})
    except Exception as e:
        return err(str(e), 500)


def upload_image(body):
    """
    Accepts { fileName, fileType, folder, fileContent (optional) }
    If fileContent is provided (base64), uploads synchronously.
    Otherwise, returns an S3 presigned URL for direct upload.
    """
    try:
        file_name    = body.get('fileName', f"banner_{uuid.uuid4().hex}.jpg")
        file_type    = body.get('fileType', 'image/jpeg')
        folder       = body.get('folder', 'banner')
        file_content = body.get('fileContent', '')

        s3_key = f"{folder.strip('/')}/{file_name}"
        image_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{s3_key}"

        if file_content:
            # Traditional upload (synchronous base64 decode)
            image_bytes = base64.b64decode(file_content)
            s3.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=image_bytes,
                ContentType=file_type
            )
            return ok({'imageUrl': image_url, 's3Key': s3_key})
        else:
            # Generate S3 Presigned URL for direct upload from the browser
            presigned_url = s3.generate_presigned_url(
                ClientMethod='put_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': s3_key,
                    'ContentType': file_type
                },
                ExpiresIn=3600
            )
            return ok({
                'presignedUrl': presigned_url,
                'imageUrl': image_url,
                's3Key': s3_key
            })
    except Exception as e:
        return err(str(e), 500)


# ── Main handler ───────────────────────────────────────────────────────────────

def handler(event, context):
    method = event.get('httpMethod', 'GET').upper()
    path   = event.get('path', '/banners')
    params = event.get('pathParameters') or {}
    banner_id = params.get('bannerId')

    # Parse body
    body = {}
    raw_body = event.get('body') or ''
    if raw_body:
        try:
            body = json.loads(raw_body)
        except json.JSONDecodeError:
            pass

    # OPTIONS preflight
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    # Route
    if path.rstrip('/').endswith('/upload') and method == 'POST':
        return upload_image(body)

    if method == 'GET' and not banner_id:
        return list_banners()

    if method == 'POST' and not banner_id:
        return create_banner(body)

    if method == 'PUT' and banner_id:
        return update_banner(banner_id, body)

    if method == 'DELETE' and banner_id:
        return delete_banner(banner_id)

    return err('Route not found', 404)
