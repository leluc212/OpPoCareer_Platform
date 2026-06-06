import json
import boto3
import base64
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
table = dynamodb.Table('CandidateProfiles')
s3_client = boto3.client('s3', region_name='ap-southeast-1')
S3_BUCKET = 'opporeview-cv-storage'


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


def float_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: float_to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [float_to_decimal(x) for x in obj]
    return obj



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
                
                image_urls = body.get('imageUrls', [])

                # Upload base64 images to S3, replace with public URLs
                uploaded_image_urls = []
                for idx, img_data in enumerate(image_urls):
                    try:
                        # img_data is a data URL: "data:image/png;base64,..."
                        if ',' in img_data:
                            header, b64_data = img_data.split(',', 1)
                            # Extract mime type e.g. "image/png"
                            mime = header.split(':')[1].split(';')[0] if ':' in header else 'image/jpeg'
                        else:
                            b64_data = img_data
                            mime = 'image/jpeg'
                        
                        ext = mime.split('/')[-1].replace('jpeg', 'jpg')
                        s3_key = f"feedback-images/{new_id}/img-{idx + 1}.{ext}"
                        image_bytes = base64.b64decode(b64_data)
                        
                        s3_client.put_object(
                            Bucket=S3_BUCKET,
                            Key=s3_key,
                            Body=image_bytes,
                            ContentType=mime
                        )
                        url = f"https://{S3_BUCKET}.s3.ap-southeast-1.amazonaws.com/{s3_key}"
                        uploaded_image_urls.append(url)
                    except Exception as img_err:
                        print(f"Error uploading feedback image {idx}: {str(img_err)}")

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
                if uploaded_image_urls:
                    item['imageUrls'] = uploaded_image_urls
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

        # GET /candidates - List all candidates (admin)
        if http_method == 'GET' and '/candidates' in path and not user_id:
            result = table.scan()
            items = result.get('Items', [])
            # Handle DynamoDB pagination
            while 'LastEvaluatedKey' in result:
                result = table.scan(ExclusiveStartKey=result['LastEvaluatedKey'])
                items.extend(result.get('Items', []))
            return response(200, {'success': True, 'data': items, 'count': len(items)})

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
            body = float_to_decimal(json.loads(event.get('body') or '{}'))
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
            # Fetch existing profile to compare active status
            try:
                prev_profile_resp = table.get_item(Key={'userId': user_id})
                prev_profile = prev_profile_resp.get('Item') or {}
            except Exception as get_err:
                print(f"Error fetching previous profile: {get_err}")
                prev_profile = {}

            # PUT /profile/{userId} - Update profile
            body = float_to_decimal(json.loads(event.get('body') or '{}'))
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
            updated_profile = result.get('Attributes', {})

            # Check if search status is active and should trigger recommendations
            is_active_now = updated_profile.get('isActive') is True
            was_active = prev_profile.get('isActive') is True
            coords_changed = (
                updated_profile.get('latitude') != prev_profile.get('latitude') or
                updated_profile.get('longitude') != prev_profile.get('longitude')
            )

            if is_active_now and (not was_active or coords_changed):
                try:
                    from job_recommender import recommend_active_jobs_to_candidate
                    recommend_active_jobs_to_candidate(updated_profile)
                except Exception as rec_err:
                    print(f"Failed to match active jobs for activated candidate: {rec_err}")

            return response(200, {'success': True, 'data': updated_profile})
 
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
        import traceback
        traceback.print_exc()
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

    return response(400, {'success': False, 'message': 'Unknown verification route'})
