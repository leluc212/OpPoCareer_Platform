import json
import boto3
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
table = dynamodb.Table('CandidateProfiles')


def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
    }


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': get_cors_headers(),
        'body': json.dumps(body, cls=DecimalEncoder)
    }


def lambda_handler(event, context):
    print('Event:', json.dumps(event))

    # Handle CORS preflight
    http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    if http_method == 'OPTIONS':
        return response(200, {})

    # Get path
    path = event.get('path') or event.get('rawPath', '')
    path_params = event.get('pathParameters') or {}
    user_id = path_params.get('userId') or path_params.get('proxy', '').split('/')[-1]

    # Get userId from path manually if not in pathParameters
    if not user_id and '/profile/' in path:
        user_id = path.split('/profile/')[-1].strip('/')

    try:
        # ─── Verification routes (must come before profile routes) ────────────────
        if '/candidate/verification-request' in path or '/admin/candidate-verifications' in path:
            return handle_verification_routes(event, http_method, path, path_params)

        # Check if feedback route
        if '/feedback' in path:
            feedbacks_table = dynamodb.Table('Feedbacks')
            
            # Parse feedback ID from path if present, e.g. /feedback/feed-123 or /prod/feedback/feed-123
            feedback_id = None
            parts = path.strip('/').split('/')
            try:
                feedback_idx = parts.index('feedback')
                if len(parts) > feedback_idx + 1:
                    feedback_id = parts[feedback_idx + 1]
            except ValueError:
                pass

                
            if http_method == 'GET':
                if feedback_id:
                    # GET /feedback/{id}
                    result = feedbacks_table.get_item(Key={'id': feedback_id})
                    item = result.get('Item')
                    if not item:
                        return response(404, {'success': False, 'message': 'Feedback not found'})
                    return response(200, {'success': True, 'data': item})
                else:
                    # GET /feedback - List all feedbacks
                    result = feedbacks_table.scan()
                    items = result.get('Items', [])
                    # Sort by createdAt descending
                    items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
                    return response(200, items)
                    
            elif http_method == 'POST':
                # POST /feedback - Submit new feedback
                body = json.loads(event.get('body') or '{}')
                timestamp = datetime.utcnow().isoformat() + 'Z'
                
                # Generate random ID
                import uuid
                new_id = f"feed-{str(uuid.uuid4())[:8]}"
                
                item = {
                    'id': new_id,
                    'category': body.get('category', 'other'),
                    'comment': body.get('comment', ''),
                    'userId': body.get('userId', 'anonymous-guest'),
                    'userName': body.get('userName', 'Khách vãng lai'),
                    'userEmail': body.get('userEmail', 'guest.anonymous@oppo.com'),
                    'userRole': body.get('userRole', 'guest'),
                    'status': 'unread',
                    'createdAt': timestamp
                }
                feedbacks_table.put_item(Item=item)
                return response(200, {'success': True, 'data': item})
                
            elif http_method == 'PUT' and feedback_id:
                # PUT /feedback/{id} - Mark as read / update
                body = json.loads(event.get('body') or '{}')
                status = body.get('status', 'read')
                
                result = feedbacks_table.update_item(
                    Key={'id': feedback_id},
                    UpdateExpression='SET #st = :status',
                    ExpressionAttributeNames={'#st': 'status'},
                    ExpressionAttributeValues={':status': status},
                    ReturnValues='ALL_NEW'
                )
                return response(200, {'success': True, 'data': result.get('Attributes', {})})
                
            elif http_method == 'DELETE' and feedback_id:
                # DELETE /feedback/{id} - Delete feedback
                feedbacks_table.delete_item(Key={'id': feedback_id})
                return response(200, {'success': True, 'message': 'Feedback deleted'})
                
            else:
                return response(400, {'success': False, 'message': 'Invalid feedback request'})

        # Profile routes
        if http_method == 'GET' and user_id:
            # GET /profile/{userId}
            result = table.get_item(Key={'userId': user_id})
            item = result.get('Item')
            if not item:
                return response(404, {'success': False, 'message': 'Profile not found'})
            return response(200, {'success': True, 'data': item})
 
        elif http_method == 'POST':
            # POST /profile - Create profile
            body = json.loads(event.get('body') or '{}')
            if not user_id:
                # Get userId from body or token
                user_id = body.get('userId')
            if not user_id:
                return response(400, {'success': False, 'message': 'userId is required'})
 
            timestamp = datetime.utcnow().isoformat() + 'Z'
            item = {
                'userId': user_id,
                'fullName': body.get('fullName', ''),
                'email': body.get('email', ''),
                'phone': body.get('phone', ''),
                'location': body.get('location', ''),
                'title': body.get('title', ''),
                'bio': body.get('bio', ''),
                'skills': body.get('skills', []),
                'profileImage': body.get('profileImage'),
                'socialLinks': body.get('socialLinks', {}),
                'createdAt': timestamp,
                'updatedAt': timestamp,
                'isActive': True,
                'profileCompletion': 0
            }
            table.put_item(Item=item)
            return response(200, {'success': True, 'data': item})
 
        elif http_method == 'PUT' and user_id:
            # PUT /profile/{userId} - Update profile
            body = json.loads(event.get('body') or '{}')
            body.pop('userId', None)
            body.pop('createdAt', None)
            body['updatedAt'] = datetime.utcnow().isoformat() + 'Z'
 
            update_expr = 'SET ' + ', '.join(f'#k{i} = :v{i}' for i, k in enumerate(body))
            attr_names = {f'#k{i}': k for i, k in enumerate(body)}
            attr_values = {f':v{i}': v for i, (k, v) in enumerate(body.items())}
 
            result = table.update_item(
                Key={'userId': user_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=attr_names,
                ExpressionAttributeValues=attr_values,
                ReturnValues='ALL_NEW'
            )
            return response(200, {'success': True, 'data': result.get('Attributes', {})})
 
        elif http_method == 'DELETE' and user_id:
            # DELETE /profile/{userId} - Soft delete
            table.update_item(
                Key={'userId': user_id},
                UpdateExpression='SET isActive = :false, updatedAt = :ts',
                ExpressionAttributeValues={
                    ':false': False,
                    ':ts': datetime.utcnow().isoformat() + 'Z'
                }
            )
            return response(200, {'success': True, 'message': 'Profile deactivated'})

        else:
            return response(400, {'success': False, 'message': 'Invalid request'})

    except Exception as e:
        print(f'Error: {str(e)}')
        return response(500, {'success': False, 'message': str(e)})


# ─── Verification Routes (called from the same lambda_handler above) ──────────
# These are handled BEFORE the profile routes via early path checks in lambda_handler.
# Patch: add verification route handling at the top of the try block.
# Since we can't restructure the whole function here, we add a helper and
# insert a check at the START of the try block via a path prefix guard.
# The actual insertion point is patched below as a separate exported helper.
def handle_verification_routes(event, http_method, path, path_params):
    """
    Handle candidate verification routes:
      POST   /candidate/verification-request          (candidate submits)
      GET    /admin/candidate-verifications            (admin lists SUBMITTED/REJECTED)
      POST   /admin/candidate-verifications/{id}/approve
      POST   /admin/candidate-verifications/{id}/reject
    """
    timestamp = datetime.utcnow().isoformat() + 'Z'

    # POST /candidate/verification-request
    if http_method == 'POST' and '/candidate/verification-request' in path:
        body = json.loads(event.get('body') or '{}')
        candidate_id = body.get('candidateId') or path_params.get('userId')
        if not candidate_id:
            return response(400, {'success': False, 'message': 'candidateId required'})

        table.update_item(
            Key={'userId': candidate_id},
            UpdateExpression='SET verificationStatus = :s, verificationSubmittedAt = :t, updatedAt = :t',
            ExpressionAttributeValues={
                ':s': 'SUBMITTED',
                ':t': timestamp
            }
        )
        return response(200, {'success': True, 'message': 'Verification request submitted'})

    # GET /admin/candidate-verifications
    if http_method == 'GET' and '/admin/candidate-verifications' in path and not any(
        x in path for x in ['/approve', '/reject']
    ):
        result = table.scan(
            FilterExpression='verificationStatus = :s1 OR verificationStatus = :s2',
            ExpressionAttributeValues={':s1': 'SUBMITTED', ':s2': 'REJECTED'}
        )
        items = result.get('Items', [])
        items.sort(key=lambda x: x.get('verificationSubmittedAt', ''), reverse=True)
        return response(200, {'success': True, 'data': items, 'count': len(items)})

    # POST /admin/candidate-verifications/{id}/approve
    if http_method == 'POST' and '/approve' in path and '/admin/candidate-verifications' in path:
        # Extract candidate id from path: /admin/candidate-verifications/{id}/approve
        parts = path.strip('/').split('/')
        try:
            idx = parts.index('candidate-verifications')
            candidate_id = parts[idx + 1]
        except (ValueError, IndexError):
            return response(400, {'success': False, 'message': 'Cannot parse candidate id from path'})

        body = json.loads(event.get('body') or '{}')
        note = body.get('note', '')

        table.update_item(
            Key={'userId': candidate_id},
            UpdateExpression='SET verificationStatus = :s, verificationApprovedAt = :t, verificationNote = :n, updatedAt = :t',
            ExpressionAttributeValues={
                ':s': 'APPROVED',
                ':t': timestamp,
                ':n': note
            }
        )
        return response(200, {'success': True, 'message': 'Candidate verification approved'})

    # POST /admin/candidate-verifications/{id}/reject
    if http_method == 'POST' and '/reject' in path and '/admin/candidate-verifications' in path:
        parts = path.strip('/').split('/')
        try:
            idx = parts.index('candidate-verifications')
            candidate_id = parts[idx + 1]
        except (ValueError, IndexError):
            return response(400, {'success': False, 'message': 'Cannot parse candidate id from path'})

        body = json.loads(event.get('body') or '{}')
        note = body.get('note', '')

        table.update_item(
            Key={'userId': candidate_id},
            UpdateExpression='SET verificationStatus = :s, verificationRejectedAt = :t, verificationNote = :n, updatedAt = :t',
            ExpressionAttributeValues={
                ':s': 'REJECTED',
                ':t': timestamp,
                ':n': note
            }
        )
        return response(200, {'success': True, 'message': 'Candidate verification rejected'})


    except Exception as e:
        print(f'Error: {str(e)}')
        return response(500, {'success': False, 'message': str(e)})
