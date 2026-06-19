import json
import boto3  # type: ignore
import os
from datetime import datetime
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'PostStandardJob')
table = dynamodb.Table(table_name)


def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
    }

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, set):
        return list(obj)
    raise TypeError

def lambda_handler(event, context):
    """
    ULTRA-ROBUST Lambda handler for PostStandardJob
    Supports all path variations, stage names, and trailing slashes.
    """
    print(f"Event Trace: {json.dumps(event)}")
    
    # --- 1. CORE CORS HEADERS (Must be first) ---
    headers = get_cors_headers()
    
    http_method = event.get('httpMethod')
    path = event.get('path', '')
    path_parameters = event.get('pathParameters') or {}
    
    # --- 2. PREFLIGHT OPTIONS HANDLER ---
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'OK'})
        }
    
    try:
        # --- 3. PATH NORMALIZATION (The 403/404 Killer) ---
        # Tự động xử lý: /prod/jobs/ -> /jobs
        normalized_path = path.rstrip('/')
        path_segments = [s for s in normalized_path.split('/') if s]
        
        # Strip stage name
        if path_segments and path_segments[0] in ['prod', 'test', 'dev']:
            normalized_path = '/' + '/'.join(path_segments[1:])
        else:
            normalized_path = '/' + '/'.join(path_segments) if path_segments else '/'
            
        print(f"DEBUG: {http_method} {path} normalized to {normalized_path}")
        
        # --- 4. AUTH EXTRACTION ---
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('claims') or authorizer.get('jwt', {}).get('claims') or {}
        user_id = claims.get('sub')
        
        if not user_id:
            try:
                body = json.loads(event.get('body', '{}'))
                user_id = body.get('employerId') or body.get('userId')
            except: pass
        
        if not user_id and http_method == 'GET':
            user_id = 'anonymous'

        # --- 5. SECURE ROUTING ---
        
        # A. GET /jobs HOẶC / (Lấy toàn bộ cho Admin)
        if http_method == 'GET' and (normalized_path == '/jobs' or normalized_path == '/' or not normalized_path):
            response = table.scan()
            items = [item for item in response.get('Items', []) if item.get('status') != 'deleted']
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'data': items}, default=decimal_default)}
            
        # B. GET /jobs/active
        elif http_method == 'GET' and normalized_path == '/jobs/active':
            response = table.scan(FilterExpression='#s = :s', ExpressionAttributeNames={'#s': 'status'}, ExpressionAttributeValues={':s': 'active'})
            items = response.get('Items', [])
            items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'data': items}, default=decimal_default)}

        # C. GET /jobs/employer/{employerId}
        elif http_method == 'GET' and '/employer/' in normalized_path:
            emp_id = path_parameters.get('employerId') or (path_segments[-1] if path_segments else None)
            response = table.query(IndexName='EmployerIndex', KeyConditionExpression='employerId = :e', ExpressionAttributeValues={':e': emp_id})
            items = [item for item in response.get('Items', []) if item.get('status') != 'deleted']
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'data': items}, default=decimal_default)}

        # D. POST /jobs (Create)
        elif http_method == 'POST' and normalized_path == '/jobs':
            body = json.loads(event.get('body', '{}'))
            employer_id = body.get('employerId', user_id)

            # ── Verify employer is approved before allowing job post ──────────
            if employer_id:
                try:
                    employer_table = dynamodb.Table('EmployerProfiles')
                    emp_item = employer_table.get_item(Key={'userId': employer_id}).get('Item', {})
                    if not emp_item.get('isVerified', False):
                        return {
                            'statusCode': 403,
                            'headers': headers,
                            'body': json.dumps({
                                'success': False,
                                'message': 'Tài khoản chưa được xác thực. Vui lòng hoàn tất xác thực hồ sơ công ty và chờ admin phê duyệt trước khi đăng tin.'
                            })
                        }
                except Exception as verify_err:
                    print(f"Warning: could not verify employer status: {verify_err}")
                    # Fail open only if DynamoDB lookup itself errors — still create the job
            # ─────────────────────────────────────────────────────────────────

            # Simple fallback for missing fields in demo
            item = {
                'idJob': body.get('idJob', f"JOB-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"),
                'employerId': employer_id,
                'title': body.get('title', 'Untitled Job'),
                'status': 'pending',
                'createdAt': datetime.utcnow().isoformat() + 'Z',
                'updatedAt': datetime.utcnow().isoformat() + 'Z'
            }
            # Add all other body fields (but don't allow overriding status)
            for k, v in body.items():
                if k not in item and k != 'status': item[k] = v
            table.put_item(Item=item)
            
            # Send email notification to Admin for approval
            if item.get('status') == 'pending':
                try:
                    from email_service import send_admin_approval_email
                    send_admin_approval_email(item, is_quick_job=False)
                except Exception as email_err:
                    print(f"Error sending admin email: {str(email_err)}")
                    
            return {'statusCode': 201, 'headers': headers, 'body': json.dumps({'success': True, 'data': item}, default=decimal_default)}

        # E. Routes based on idJob (e.g. /jobs/JOB-123)
        elif '/jobs/' in normalized_path:
            if '/views' in normalized_path:
                parts = [s for s in normalized_path.split('/') if s]
                jid = None
                try:
                    views_idx = parts.index('views')
                    if views_idx > 0:
                        jid = parts[views_idx - 1]
                except ValueError:
                    pass
                if not jid:
                    jid = path_parameters.get('idJob')
                
                if http_method == 'POST':
                    return increment_views(jid, headers)
                else:
                    return {
                        'statusCode': 405,
                        'headers': headers,
                        'body': json.dumps({'success': False, 'message': f'Method {http_method} not allowed for views'})
                    }
            
            jid = path_parameters.get('idJob') or (path_segments[-1] if path_segments else None)
            if jid == 'active': # Safety catch
                 return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True, 'data': []})} # Handled above
            
            if http_method == 'GET':
                return get_job_post(jid, headers)
            elif http_method == 'PUT':
                return update_job_post(event, jid, user_id, headers)
            elif http_method == 'DELETE':
                return delete_job_post(jid, user_id, headers)
            else:
                return {
                    'statusCode': 405,
                    'headers': headers,
                    'body': json.dumps({'success': False, 'message': f'Method {http_method} not allowed'})
                }

        # F. FALLBACK
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'success': False, 'message': f'Route not found: {normalized_path}'})
        }

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            })
        }

def create_job_post(event, user_id, headers):
    """Create new job post"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        required_fields = ['idJob', 'title', 'location', 'jobType', 'workDays', 'workHours', 'description']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        'success': False,
                        'message': f'Missing required field: {field}'
                    })
                }
        
        # Use employerId from body if user_id is anonymous
        employer_id = body.get('employerId', user_id)
        
        # Create item
        item = {
            'idJob': body['idJob'],
            'employerId': employer_id,
            'employerEmail': body.get('employerEmail', ''),
            'employerName': body.get('employerName', ''),  # Add employer name
            'title': body['title'],
            'location': body['location'],
            'jobType': body['jobType'],
            'workDays': body['workDays'],
            'workHours': body['workHours'],
            'salary': body.get('salary'),
            'tags': body.get('tags', ''),
            'description': body['description'],
            'requirements': body.get('requirements', ''),
            'benefits': body.get('benefits', ''),
            # Default to 'pending' so Admin must manually approve standard jobs
            'status': body.get('status', 'pending'),
            'category': 'standard',  # Always set to 'standard' for PostStandardJob
            'applicants': body.get('applicants', 0),
            'views': body.get('views', 0),
            'responseRate': body.get('responseRate', 0),
            'createdAt': body.get('createdAt', datetime.utcnow().isoformat() + 'Z'),
            'updatedAt': body.get('updatedAt', datetime.utcnow().isoformat() + 'Z')
        }
        
        # Put item in DynamoDB
        table.put_item(Item=item)
        
        if item.get('status') == 'active':
            try:
                from job_recommender import recommend_job_to_candidates
                recommend_job_to_candidates(item, is_quick_job=False)
            except Exception as rec_err:
                print(f"Recommendation alert error: {str(rec_err)}")
        elif item.get('status') == 'pending':
            try:
                from email_service import send_admin_approval_email
                send_admin_approval_email(item, is_quick_job=False)
            except Exception as email_err:
                print(f"Error sending admin email: {str(email_err)}")
        
        print(f"✅ Job post created: {item['idJob']}")
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Job post created successfully',
                'data': item
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error creating job post: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error creating job post: {str(e)}'
            })
        }

def get_employer_jobs(employer_id, headers):
    """Get all jobs for an employer (excluding deleted jobs)"""
    try:
        response = table.query(
            IndexName='EmployerIndex',
            KeyConditionExpression='employerId = :eid',
            ExpressionAttributeValues={
                ':eid': employer_id
            },
            ScanIndexForward=False  # Sort by createdAt descending
        )
        
        # Filter out deleted jobs
        items = [item for item in response.get('Items', []) if item.get('status') != 'deleted']
        
        print(f"✅ Found {len(items)} active jobs for employer {employer_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': items
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error getting employer jobs: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting jobs: {str(e)}'
            })
        }

def get_active_jobs(headers):
    """Get all active job posts"""
    try:
        response = table.query(
            IndexName='StatusIndex',
            KeyConditionExpression='#status = :status',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'active'
            },
            ScanIndexForward=False  # Sort by createdAt descending
        )
        
        items = response.get('Items', [])
        print(f"✅ Found {len(items)} active jobs")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': items
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error getting active jobs: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting active jobs: {str(e)}'
            })
        }

def get_job_post(job_id, headers):
    """Get single job post by ID"""
    try:
        response = table.get_item(Key={'idJob': job_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Job post not found'
                })
            }
        
        item = response['Item']
        print(f"✅ Job post found: {job_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': item
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error getting job post: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting job post: {str(e)}'
            })
        }

def update_job_post(event, job_id, user_id, headers):
    """Update job post"""
    try:
        # First, get the existing job to verify ownership
        response = table.get_item(Key={'idJob': job_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Job post not found'
                })
            }
        
        existing_job = response['Item']
        
        # Check if user is in Admin group
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('claims') or authorizer.get('jwt', {}).get('claims') or {}
        groups = claims.get('cognito:groups') or claims.get('groups') or ''
        is_admin = False
        if isinstance(groups, list):
            is_admin = 'Admin' in groups
        elif isinstance(groups, str):
            is_admin = 'Admin' in [g.strip() for g in groups.split(',') if g.strip()]
        
        # Verify ownership - only job owner or Admin can update
        if user_id and user_id != 'anonymous' and not is_admin and existing_job.get('employerId') != user_id:
            print(f"Ownership check failed: user_id={user_id}, employerId={existing_job.get('employerId')}")
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Forbidden - you can only update your own jobs'
                })
            }
        
        print(f"Ownership check passed: Updating job {job_id} by user {user_id}")
        
        # Parse update data
        body = json.loads(event.get('body', '{}'))
        
        # Build update expression
        update_expr = "SET updatedAt = :updatedAt"
        expr_values = {':updatedAt': datetime.utcnow().isoformat() + 'Z'}
        expr_names = {}
        
        # Add fields to update
        updatable_fields = ['title', 'location', 'jobType', 'workDays', 'workHours', 
                           'salary', 'tags', 'description', 
                           'requirements', 'benefits', 'status']
        
        # Reserved keywords that need ExpressionAttributeNames
        reserved_keywords = ['location', 'status']
        
        for field in updatable_fields:
            if field in body:
                if field in reserved_keywords:
                    # Use ExpressionAttributeNames for reserved keywords
                    update_expr += f", #{field} = :{field}"
                    expr_names[f'#{field}'] = field
                    expr_values[f':{field}'] = body[field]
                else:
                    update_expr += f", {field} = :{field}"
                    expr_values[f':{field}'] = body[field]
        
        # Update item
        update_params = {
            'Key': {'idJob': job_id},
            'UpdateExpression': update_expr,
            'ExpressionAttributeValues': expr_values,
            'ReturnValues': 'ALL_NEW'
        }
        
        if expr_names:
            update_params['ExpressionAttributeNames'] = expr_names
        
        response = table.update_item(**update_params)
        
        updated_item = response['Attributes']
        old_status = existing_job.get('status')
        new_status = updated_item.get('status')
        
        if new_status == 'active' and old_status != 'active':
            try:
                from job_recommender import recommend_job_to_candidates
                recommend_job_to_candidates(updated_item, is_quick_job=False)
            except Exception as rec_err:
                print(f"Recommendation alert error: {str(rec_err)}")
            try:
                from email_service import send_employer_approved_email
                send_employer_approved_email(updated_item, is_quick_job=False)
            except Exception as email_err:
                print(f"Employer approval email error: {str(email_err)}")
        elif new_status == 'pending' and old_status != 'pending':
            try:
                from email_service import send_admin_approval_email
                send_admin_approval_email(updated_item, is_quick_job=False)
            except Exception as email_err:
                print(f"Admin approval email error: {str(email_err)}")
                
        print(f"✅ Job post updated: {job_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Job post updated successfully',
                'data': updated_item
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error updating job post: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error updating job post: {str(e)}'
            })
        }

def delete_job_post(job_id, user_id, headers):
    """Delete job post (soft delete)"""
    try:
        # First, get the existing job to verify ownership
        response = table.get_item(Key={'idJob': job_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Job post not found'
                })
            }
        
        existing_job = response['Item']
        
        # Verify ownership - allow if:
        # 1. user_id is None or 'anonymous' (backward compatibility)
        # 2. user_id matches employerId
        # 3. job has no employerId (old jobs)
        job_employer_id = existing_job.get('employerId')
        
        print(f"🔍 Ownership check: user_id={user_id}, job_employer_id={job_employer_id}")
        
        if user_id and user_id != 'anonymous':
            if job_employer_id and job_employer_id != user_id:
                print(f"❌ Ownership check failed: user {user_id} cannot delete job owned by {job_employer_id}")
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({
                        'success': False,
                        'message': 'Forbidden - you can only delete your own jobs'
                    })
                }
        
        print(f"✅ Ownership check passed: Deleting job {job_id}")
        
        # Soft delete - update status to 'deleted'
        table.update_item(
            Key={'idJob': job_id},
            UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'deleted',
                ':updatedAt': datetime.utcnow().isoformat() + 'Z'
            }
        )
        
        print(f"✅ Job post deleted: {job_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Job post deleted successfully'
            })
        }
    
    except Exception as e:
        print(f"Error deleting job post: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error deleting job post: {str(e)}'
            })
        }

def increment_views(job_id, headers):
    """Increment view count for a job post"""
    try:
        response = table.get_item(Key={'idJob': job_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Job post not found'
                })
            }

        item = response['Item']
        current_views = int(item.get('views', 0) or 0)
        current_applicants = int(item.get('applicants', 0) or 0)
        new_views = current_views + 1
        response_rate = int(round((current_applicants / new_views) * 100)) if new_views else 0

        table.update_item(
            Key={'idJob': job_id},
            UpdateExpression='SET #views = :views, responseRate = :rr, updatedAt = :updated',
            ExpressionAttributeNames={'#views': 'views'},
            ExpressionAttributeValues={
                ':views': new_views,
                ':rr': response_rate,
                ':updated': datetime.utcnow().isoformat() + 'Z'
            }
        )
        
        print(f"✅ View count incremented for job: {job_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'View count incremented'
            })
        }
    
    except Exception as e:
        print(f"Error incrementing views: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error incrementing views: {str(e)}'
            })
        }
