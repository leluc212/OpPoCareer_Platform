import json
import boto3
import base64
import uuid
from datetime import datetime
from decimal import Decimal

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('CandidateProfiles')

BUCKET_NAME = 'opporeview-cv-storage'
ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_CV_COUNT = 3  # Maximum 3 CVs per user

def lambda_handler(event, context):
    print(f"Event: {json.dumps(event)}")
    
    # Common headers for all responses including CORS
    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true'
    }

    def create_response(status_code, body):
        return {
            'statusCode': status_code,
            'headers': response_headers,
            'body': json.dumps(body)
        }

    try:
        http_method = event.get('httpMethod', event.get('requestContext', {}).get('http', {}).get('method', ''))
        path = event.get('rawPath', event.get('path', ''))
        
        print(f"Executing method: {http_method}, Path: {path}")

        if http_method == 'OPTIONS':
            return create_response(200, {'message': 'OK'})

        # Upload CV
        elif http_method == 'POST' and path.endswith('/upload'):
            body = json.loads(event.get('body', '{}'))
            return upload_cv(body, create_response)

        # Get CV Info (List)
        elif http_method == 'GET' and '/cv/' in path:
            user_id = path.split('/cv/')[-1].replace('/prod', '').strip('/')
            return get_cv_list(user_id, create_response)

        # Delete CV
        elif http_method == 'DELETE' and '/cv/' in path:
            parts = path.split('/cv/')[-1].replace('/prod', '').strip('/').split('/')
            user_id = parts[0]
            cv_id = parts[1] if len(parts) > 1 else None
            
            if cv_id:
                return delete_specific_cv(user_id, cv_id, create_response)
            else:
                # Delete all CVs (backward compatibility)
                return delete_all_cvs(user_id, create_response)
        
        else:
            return create_response(404, {'error': f'Route not found: {http_method} {path}'})

    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return create_response(500, {'error': str(e)})

def upload_cv(body, create_response):
    """Upload CV to S3 and add to user's CV list"""
    user_id = body.get('userId')
    file_name = body.get('fileName')
    file_content = body.get('fileContent')  # base64 encoded
    file_type = body.get('fileType', 'application/pdf')
    
    if not all([user_id, file_name, file_content]):
        return create_response(400, {'error': 'Missing required fields: userId, fileName, fileContent'})
    
    # Validate file extension
    file_ext = '.' + file_name.split('.')[-1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return create_response(400, {'error': f'Invalid file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'})
    
    # Decode base64 content
    try:
        file_data = base64.b64decode(file_content)
    except Exception as e:
        return create_response(400, {'error': 'Invalid base64 content'})
    
    # Check file size
    if len(file_data) > MAX_FILE_SIZE:
        return create_response(400, {'error': f'File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB'})
    
    # Get current CV list
    try:
        response = table.get_item(Key={'userId': user_id})
        item = response.get('Item', {})
        cv_list = item.get('cvList', [])
        
        # Check if user has reached max CV count
        if len(cv_list) >= MAX_CV_COUNT:
            return create_response(400, {'error': f'Maximum {MAX_CV_COUNT} CVs allowed. Please delete an existing CV first.'})
    except Exception as e:
        print(f"Error getting CV list: {str(e)}")
        cv_list = []
    
    # Generate unique CV ID and S3 key
    cv_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    s3_key = f"cvs/{user_id}/{cv_id}_{timestamp}_{file_name}"
    
    # Upload to S3
    try:
        import unicodedata
        safe_filename = unicodedata.normalize('NFKD', file_name).encode('ascii', 'ignore').decode('ascii')
        if not safe_filename:
            safe_filename = 'cv_file' + file_ext
        
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=file_data,
            ContentType=file_type,
            ContentDisposition=f'inline; filename="{file_name}"',
            Metadata={
                'userId': user_id,
                'cvId': cv_id,
                'originalFileName': safe_filename,
                'uploadDate': datetime.now().isoformat()
            }
        )
        
        # Generate presigned URL (valid for 7 days)
        cv_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': BUCKET_NAME, 
                'Key': s3_key,
                'ResponseContentDisposition': f'inline; filename="{file_name}"'
            },
            ExpiresIn=604800  # 7 days
        )
        
        # Create new CV object
        new_cv = {
            'id': cv_id,
            'cvUrl': cv_url,
            'cvFileName': file_name,
            'cvS3Key': s3_key,
            'cvUploadDate': datetime.now().isoformat()
        }
        
        # Add to CV list
        cv_list.append(new_cv)
        
        # Update DynamoDB
        table.update_item(
            Key={'userId': user_id},
            UpdateExpression='SET cvList = :list, updatedAt = :updated',
            ExpressionAttributeValues={
                ':list': cv_list,
                ':updated': datetime.now().isoformat()
            }
        )
        
        return create_response(200, {
            'message': 'CV uploaded successfully',
            'cv': new_cv,
            'totalCVs': len(cv_list)
        })
        
    except Exception as e:
        print(f"S3 upload error: {str(e)}")
        return create_response(500, {'error': f'Failed to upload CV: {str(e)}'})

def get_cv_list(user_id, create_response):
    """Get all CVs for a user"""
    try:
        response = table.get_item(Key={'userId': user_id})
        
        if 'Item' not in response:
            return create_response(404, {'error': 'User not found'})
        
        item = response['Item']
        cv_list = item.get('cvList', [])
        
        # Refresh presigned URLs if needed
        updated_list = []
        needs_update = False
        
        for cv in cv_list:
            if cv.get('cvS3Key'):
                try:
                    # Generate new presigned URL
                    new_url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={
                            'Bucket': BUCKET_NAME, 
                            'Key': cv['cvS3Key'],
                            'ResponseContentDisposition': f'inline; filename="{cv.get("cvFileName", "cv.pdf")}"'
                        },
                        ExpiresIn=604800  # 7 days
                    )
                    
                    cv_copy = cv.copy()
                    cv_copy['cvUrl'] = new_url
                    updated_list.append(cv_copy)
                    needs_update = True
                except Exception as e:
                    print(f"Error generating presigned URL for CV {cv.get('id')}: {str(e)}")
                    updated_list.append(cv)
            else:
                updated_list.append(cv)
        
        # Update DynamoDB if URLs were refreshed
        if needs_update:
            table.update_item(
                Key={'userId': user_id},
                UpdateExpression='SET cvList = :list',
                ExpressionAttributeValues={':list': updated_list}
            )
        
        return create_response(200, {
            'cvList': updated_list,
            'totalCVs': len(updated_list)
        })
        
    except Exception as e:
        print(f"Error getting CV list: {str(e)}")
        return create_response(500, {'error': str(e)})

def delete_specific_cv(user_id, cv_id, create_response):
    """Delete a specific CV from user's list"""
    try:
        # Get current CV list
        response = table.get_item(Key={'userId': user_id})
        
        if 'Item' not in response:
            return create_response(404, {'error': 'User not found'})
        
        item = response['Item']
        cv_list = item.get('cvList', [])
        
        # Find and remove the CV
        cv_to_delete = None
        updated_list = []
        
        for cv in cv_list:
            if cv.get('id') == cv_id:
                cv_to_delete = cv
            else:
                updated_list.append(cv)
        
        if not cv_to_delete:
            return create_response(404, {'error': 'CV not found'})
        
        # Delete from S3
        if cv_to_delete.get('cvS3Key'):
            try:
                s3_client.delete_object(Bucket=BUCKET_NAME, Key=cv_to_delete['cvS3Key'])
            except Exception as e:
                print(f"Error deleting from S3: {str(e)}")
        
        # Update DynamoDB
        table.update_item(
            Key={'userId': user_id},
            UpdateExpression='SET cvList = :list, updatedAt = :updated',
            ExpressionAttributeValues={
                ':list': updated_list,
                ':updated': datetime.now().isoformat()
            }
        )
        
        return create_response(200, {
            'message': 'CV deleted successfully',
            'deletedCV': cv_to_delete,
            'remainingCVs': len(updated_list)
        })
        
    except Exception as e:
        print(f"Error deleting CV: {str(e)}")
        return create_response(500, {'error': str(e)})

def delete_all_cvs(user_id, create_response):
    """Delete all CVs for a user (backward compatibility)"""
    try:
        response = table.get_item(Key={'userId': user_id})
        
        if 'Item' not in response:
            return create_response(404, {'error': 'User not found'})
        
        item = response['Item']
        cv_list = item.get('cvList', [])
        
        # Delete all from S3
        for cv in cv_list:
            if cv.get('cvS3Key'):
                try:
                    s3_client.delete_object(Bucket=BUCKET_NAME, Key=cv['cvS3Key'])
                except Exception as e:
                    print(f"Error deleting from S3: {str(e)}")
        
        # Clear CV list in DynamoDB
        table.update_item(
            Key={'userId': user_id},
            UpdateExpression='SET cvList = :list, updatedAt = :updated',
            ExpressionAttributeValues={
                ':list': [],
                ':updated': datetime.now().isoformat()
            }
        )
        
        return create_response(200, {'message': 'All CVs deleted successfully'})
        
    except Exception as e:
        print(f"Error deleting CVs: {str(e)}")
        return create_response(500, {'error': str(e)})

def convert_decimals(obj):
    """Convert Decimal objects to int/float for JSON serialization"""
    if isinstance(obj, list):
        return [convert_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj
