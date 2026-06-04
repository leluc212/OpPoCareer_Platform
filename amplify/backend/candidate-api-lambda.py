import json
import boto3
from decimal import Decimal
from datetime import datetime
import uuid


def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    }

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
table = dynamodb.Table('CandidateProfiles')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(DecimalEncoder, self).default(obj)

def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': get_cors_headers(),
        'body': json.dumps(body, cls=DecimalEncoder)
    }

def lambda_handler(event, context):
    try:
        headers = get_cors_headers()

        # Handle OPTIONS request for CORS
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        if http_method == 'OPTIONS':
            return {'statusCode': 200, 'headers': headers, 'body': ''}

        path = event.get('path') or event.get('rawPath', '')
        path_params = event.get('pathParameters') or {}
        timestamp = datetime.utcnow().isoformat() + 'Z'

        # ─── Verification Routes ──────────────────────────────────────────────

        # POST /candidate/verification-request
        if http_method == 'POST' and '/candidate/verification-request' in path:
            body = json.loads(event.get('body') or '{}')
            candidate_id = body.get('candidateId')
            if not candidate_id:
                return response(400, {'success': False, 'message': 'candidateId required'})
            table.update_item(
                Key={'userId': candidate_id},
                UpdateExpression='SET verificationStatus = :s, verificationSubmittedAt = :t, updatedAt = :t',
                ExpressionAttributeValues={':s': 'SUBMITTED', ':t': timestamp}
            )
            return response(200, {'success': True, 'message': 'Verification request submitted'})

        # GET /admin/candidate-verifications
        if http_method == 'GET' and '/admin/candidate-verifications' in path and '/approve' not in path and '/reject' not in path:
            result = table.scan(
                FilterExpression='verificationStatus = :s1 OR verificationStatus = :s2',
                ExpressionAttributeValues={':s1': 'SUBMITTED', ':s2': 'REJECTED'}
            )
            items = result.get('Items', [])
            while 'LastEvaluatedKey' in result:
                result = table.scan(
                    ExclusiveStartKey=result['LastEvaluatedKey'],
                    FilterExpression='verificationStatus = :s1 OR verificationStatus = :s2',
                    ExpressionAttributeValues={':s1': 'SUBMITTED', ':s2': 'REJECTED'}
                )
                items.extend(result.get('Items', []))
            items.sort(key=lambda x: x.get('verificationSubmittedAt', ''), reverse=True)
            return response(200, {'success': True, 'data': items, 'count': len(items)})

        # POST /admin/candidate-verifications/{id}/approve
        if http_method == 'POST' and '/admin/candidate-verifications' in path and '/approve' in path:
            parts = path.strip('/').split('/')
            try:
                idx = parts.index('candidate-verifications')
                candidate_id = parts[idx + 1]
            except (ValueError, IndexError):
                return response(400, {'success': False, 'message': 'Cannot parse candidate id'})
            body = json.loads(event.get('body') or '{}')
            note = body.get('note', '')
            table.update_item(
                Key={'userId': candidate_id},
                UpdateExpression='SET verificationStatus = :s, verificationApprovedAt = :t, verificationNote = :n, updatedAt = :t',
                ExpressionAttributeValues={':s': 'APPROVED', ':t': timestamp, ':n': note}
            )
            return response(200, {'success': True, 'message': 'Candidate verification approved'})

        # POST /admin/candidate-verifications/{id}/reject
        if http_method == 'POST' and '/admin/candidate-verifications' in path and '/reject' in path:
            parts = path.strip('/').split('/')
            try:
                idx = parts.index('candidate-verifications')
                candidate_id = parts[idx + 1]
            except (ValueError, IndexError):
                return response(400, {'success': False, 'message': 'Cannot parse candidate id'})
            body = json.loads(event.get('body') or '{}')
            note = body.get('note', '')
            table.update_item(
                Key={'userId': candidate_id},
                UpdateExpression='SET verificationStatus = :s, verificationRejectedAt = :t, verificationNote = :n, updatedAt = :t',
                ExpressionAttributeValues={':s': 'REJECTED', ':t': timestamp, ':n': note}
            )
            return response(200, {'success': True, 'message': 'Candidate verification rejected'})

        # ─── Default: Scan all candidates ────────────────────────────────────
        result = table.scan()
        items = result.get('Items', [])
        while 'LastEvaluatedKey' in result:
            result = table.scan(ExclusiveStartKey=result['LastEvaluatedKey'])
            items.extend(result.get('Items', []))

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(items, cls=DecimalEncoder)
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }
