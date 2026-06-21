import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'PostQuickJob')
table = dynamodb.Table(table_name)

# Helper function to convert Decimal to int/float for JSON serialization
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, set):
        return list(obj)
    raise TypeError


def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Max-Age': '3600',
        'Content-Type': 'application/json'
    }

def lambda_handler(event, context):
    """
    Main Lambda handler for PostQuickJob API
    """
    print(f"Event: {json.dumps(event)}")
    
    # CORS headers
    headers = get_cors_headers()
    
    # Check if this is API Gateway v2 format (HTTP API)
    is_v2 = 'requestContext' in event and 'http' in event.get('requestContext', {})
    
    if is_v2:
        # API Gateway v2 format
        http_method = event.get('requestContext', {}).get('http', {}).get('method')
        path = event.get('rawPath', '')
        path_parameters = event.get('pathParameters') or {}
        body = event.get('body', '{}')
    else:
        # API Gateway v1 format (fallback)
        http_method = event.get('httpMethod')
        path = event.get('path', '')
        path_parameters = event.get('pathParameters') or {}
        body = event.get('body', '{}')
    
    print(f"DEBUG: http_method={http_method}, path={path}")

    # --- PATH NORMALIZATION (SỬA LỖI 404/500 KHI CÓ STAGE PHÍ GI TIEP) ---
    # Tự động loại bỏ /prod hoặc /test nếu có để việc so khớp route luôn đúng
    normalized_path = path
    path_segments = [s for s in path.split('/') if s]
    if path_segments and (path_segments[0] == 'prod' or path_segments[0] == 'test'):
        normalized_path = '/' + '/'.join(path_segments[1:])
    
    print(f"DEBUG: normalized_path={normalized_path}")
    
    # --- ROBUST ID EXTRACTION (SỬA LỖI pathParameters BỊ TRỐNG) ---
    def get_id_from_path(p, param_name='idJob'):
        # Thử lấy từ pathParameters trước
        val = path_parameters.get(param_name)
        if val: return val
        
        # Nếu trống, thử parse thủ công từ path (ví dụ: /quick-jobs/QJOB-123)
        segments = [s for s in p.split('/') if s]
        if len(segments) >= 2 and segments[0] == 'quick-jobs':
            if segments[1] not in ['active', 'employer', 'cleanup', 'cleanup-bulk']:
                return segments[1]
        return None

    # Handle OPTIONS request for CORS
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'OK'})
        }
    
    try:
        # Extract user ID from Cognito authorizer (v1 and v2 payload support)
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('claims') or authorizer.get('jwt', {}).get('claims') or {}
        user_id = claims.get('sub')
        
        # If no authorizer, try to get userId from request body (for testing)
        if not user_id:
            try:
                body_data = json.loads(body) if isinstance(body, str) else body
                user_id = body_data.get('employerId') or body_data.get('userId')
            except:
                pass
        
        # For GET requests without auth, allow public access
        if not user_id and http_method == 'GET':
            user_id = 'anonymous'
        
        print(f"User ID: {user_id}")
        
        # --- ROUTING LOGIC (ƯU TIÊN ROUTE TĨNH ĐỂ KHÔNG BỊ NHẦM VỚI {idJob}) ---
        
        # 1. POST /quick-jobs (Tạo công việc)
        if http_method == 'POST' and normalized_path == '/quick-jobs':
            return create_quick_job(body, user_id, headers)
            
        # 2. GET /quick-jobs (Admin lấy toàn bộ danh sách - FIX 404)
        elif http_method == 'GET' and normalized_path == '/quick-jobs':
            return get_all_quick_jobs(headers)
        
        # 3. GET /quick-jobs/active (Lấy các công việc đang hoạt động - FIX 500)
        elif http_method == 'GET' and normalized_path == '/quick-jobs/active':
            return get_active_quick_jobs(headers)
            
        # 4. GET /quick-jobs/employer/ (Dành cho nhà tuyển dụng)
        elif http_method == 'GET' and '/quick-jobs/employer/' in normalized_path:
            employer_id = path_parameters.get('employerId') or path_parameters.get('employerid')
            if not employer_id:
                # Lấy từ path trực tiếp: /quick-jobs/employer/{id}
                parts = [s for s in normalized_path.split('/') if s]
                emp_idx = next((i for i, s in enumerate(parts) if s == 'employer'), None)
                if emp_idx is not None and emp_idx + 1 < len(parts):
                    employer_id = parts[emp_idx + 1]
            return get_employer_quick_jobs(employer_id, headers)
            
        # 5. POST /views (Tăng lượt xem)
        elif http_method == 'POST' and '/views' in normalized_path:
            job_id = path_parameters.get('idJob')
            if not job_id:
                parts = [s for s in normalized_path.split('/') if s]
                try:
                    v_idx = parts.index('views')
                    if v_idx > 0:
                        job_id = parts[v_idx - 1]
                except ValueError:
                    pass
            return increment_views(job_id, headers)
        
        # 5b. POST /quick-jobs/batch (Lấy nhiều jobs cùng lúc - giảm N+1 requests)
        elif http_method == 'POST' and normalized_path == '/quick-jobs/batch':
            return get_batch_quick_jobs(body, headers)
        
        # 6. BULK CLEANUP (BY SPECIFIC IDs) - Ưu tiên trên các route idJob
        elif http_method == 'POST' and normalized_path == '/quick-jobs/cleanup-bulk':
            return cleanup_bulk(body, headers)

        # 7. DELETE ALL TEST/DUPLICATE JOBS (AUTO-DETECT)
        elif http_method == 'POST' and normalized_path == '/quick-jobs/cleanup':
            return cleanup_ghost_jobs(headers)

        # 8. Các route dựa trên idJob (Ví dụ: /quick-jobs/QJOB-123)
        elif '/quick-jobs/' in normalized_path:
            job_id = get_id_from_path(normalized_path)
            
            if http_method == 'GET':
                return get_quick_job(job_id, headers)
            elif http_method == 'PUT':
                return update_quick_job(body, job_id, user_id, claims, headers)
            elif http_method == 'DELETE':
                return delete_quick_job(job_id, user_id, headers)
            else:
                # Trả về 405 nếu method không được hỗ trợ cho idJob
                return {
                    'statusCode': 405,
                    'headers': headers,
                    'body': json.dumps({'message': f'Method {http_method} not allowed for job ID'})
                }
        
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': f'Endpoint not found: {normalized_path}'
                })
            }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            })
        }

def cleanup_bulk(body_str, headers):
    """Bulk cleanup of specific job IDs"""
    try:
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        job_ids = body.get('jobIds', [])
        
        if not job_ids:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'message': 'Missing jobIds'})}
            
        deleted_count = 0
        for jid in job_ids:
            table.update_item(
                Key={'jobID': jid},
                UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'deleted',
                    ':updatedAt': datetime.utcnow().isoformat() + 'Z'
                }
            )
            deleted_count += 1
            
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': f'Deleted {deleted_count} jobs',
                'deleted_count': deleted_count
            })
        }
    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'success': False, 'message': str(e)})}

def cleanup_ghost_jobs(headers):
    """Internal cleanup of test and duplicate jobs"""
    try:
        response = table.scan()
        jobs = response.get('Items', [])
        
        # Sort by createdAt descending to keep newest
        jobs.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        to_delete = []
        seen = set()
        
        for job in jobs:
            title = (job.get('title') or '').lower().strip()
            company = (job.get('companyName') or 'Unknown Company').lower().strip()
            key = f"{title}|{company}"
            job_id = job.get('jobID')
            
            if not job_id: continue
            
            is_test = any(t in title for t in ['mệt mỏi', 'lười biếng', 'abcd']) or 'unknown company' in company
            
            if is_test or key in seen:
                to_delete.append(job_id)
            else:
                seen.add(key)
        
        deleted_count = 0
        for jid in to_delete:
            table.update_item(
                Key={'jobID': jid},
                UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'deleted',
                    ':updatedAt': datetime.utcnow().isoformat() + 'Z'
                }
            )
            deleted_count += 1
            
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': f'Cleaned up {deleted_count} jobs',
                'deleted_count': deleted_count
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'message': str(e)})
        }

def create_quick_job(body_str, user_id, headers):
    """Create new quick job post"""
    try:
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        
        print(f"Creating quick job with body: {json.dumps(body)}")
        
        # Validate required fields
        required_fields = ['idJob', 'title', 'location', 'hourlyRate', 'startTime', 'endTime', 'description']
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
        
        # Convert numeric fields safely
        def to_decimal(val, default='0'):
            try: return Decimal(str(val)) if val is not None else Decimal(default)
            except: return Decimal(default)

        # Create item
        item = {
            'jobID': body['idJob'],
            'employerId': employer_id,
            'employerEmail': body.get('employerEmail', ''),
            'companyName': body.get('companyName', ''),
            'title': body['title'],
            'location': body['location'],
            'latitude': to_decimal(body.get('latitude'), None) if body.get('latitude') else None,
            'longitude': to_decimal(body.get('longitude'), None) if body.get('longitude') else None,
            'jobType': body.get('jobType', 'part-time'),
            'hourlyRate': to_decimal(body.get('hourlyRate')),
            'startTime': body['startTime'],
            'endTime': body['endTime'],
            'workHours': body.get('workHours', ''),
            'totalHours': to_decimal(body.get('totalHours')),
            'totalSalary': to_decimal(body.get('totalSalary')),
            'description': body['description'],
            'requirements': body.get('requirements', ''),
            'customFields': body.get('customFields', []),
            'status': body.get('status', 'pending'),
            'category': 'quick-jobs',
            'applicants': 0,
            'views': 0,
            'workDate': body.get('workDate', ''),
            'createdAt': body.get('createdAt', datetime.utcnow().isoformat() + 'Z'),
            'updatedAt': body.get('updatedAt', datetime.utcnow().isoformat() + 'Z')
        }
        
        # Put item in DynamoDB
        table.put_item(Item=item)
        
        if item.get('status') == 'active':
            try:
                from job_recommender import recommend_job_to_candidates
                recommend_job_to_candidates(item, is_quick_job=True)
            except Exception as rec_err:
                print(f"Recommendation alert error: {str(rec_err)}")
        elif item.get('status') == 'pending':
            try:
                from email_service import send_admin_approval_email
                send_admin_approval_email(item, is_quick_job=True)
            except Exception as email_err:
                print(f"Error sending admin email: {str(email_err)}")
        
        print(f"✅ Quick job created: {item['jobID']}")
        
        # Return with idJob for API consistency
        item['idJob'] = item['jobID']
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Quick job created successfully',
                'data': item
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error creating quick job: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error creating quick job: {str(e)}'
            })
        }

def get_all_quick_jobs(headers):
    """Admin route to list ALL non-deleted jobs"""
    try:
        response = table.scan()
        items = [i for i in response.get('Items', []) if i.get('status') != 'deleted']
        print(f"✅ Found {len(items)} total quick jobs (Scan)")
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': items
            }, default=decimal_default)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': str(e)
            })
        }

def get_employer_quick_jobs(employer_id, headers):
    """Get all quick jobs for an employer"""
    if not employer_id:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'success': False, 'message': 'employerId is required'})
        }
    try:
        response = table.query(
            IndexName='EmployerIndex',
            KeyConditionExpression='employerId = :eid',
            ExpressionAttributeValues={
                ':eid': employer_id
            },
            ScanIndexForward=False
        )
        
        items = [item for item in response.get('Items', []) if item.get('status') != 'deleted']
        
        # Auto-close expired quick jobs (workDate + endTime has passed)
        now = datetime.utcnow()
        from datetime import timedelta
        now_vn = now + timedelta(hours=7)
        now_date_str = now_vn.strftime('%Y-%m-%d')
        now_time_str = now_vn.strftime('%H:%M')
        
        for item in items:
            if item.get('status') != 'active':
                continue
            work_date = item.get('workDate', '')
            end_time = item.get('endTime', '23:59')
            if work_date:
                if work_date < now_date_str or (work_date == now_date_str and end_time <= now_time_str):
                    try:
                        table.update_item(
                            Key={'jobID': item['jobID']},
                            UpdateExpression='SET #status = :s, updatedAt = :u',
                            ExpressionAttributeNames={'#status': 'status'},
                            ExpressionAttributeValues={':s': 'closed', ':u': datetime.utcnow().isoformat() + 'Z'}
                        )
                        item['status'] = 'closed'
                        print(f"⏰ Auto-closed expired quick job: {item['jobID']}")
                    except Exception as e:
                        print(f"Error auto-closing quick job {item['jobID']}: {str(e)}")
        
        print(f"✅ Found {len(items)} quick jobs for employer {employer_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': items
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error getting employer quick jobs: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting quick jobs: {str(e)}'
            })
        }

def get_active_quick_jobs(headers):
    """Get all active quick job posts"""
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
            ScanIndexForward=False
        )
        
        items = response.get('Items', [])
        
        # Filter out expired quick jobs (workDate + endTime has passed)
        now = datetime.utcnow()
        # Adjust to Vietnam timezone (UTC+7)
        from datetime import timedelta
        now_vn = now + timedelta(hours=7)
        now_date_str = now_vn.strftime('%Y-%m-%d')
        now_time_str = now_vn.strftime('%H:%M')
        
        active_items = []
        expired_ids = []
        for item in items:
            work_date = item.get('workDate', '')
            end_time = item.get('endTime', '23:59')
            if work_date:
                # Job expired if: workDate < today, OR workDate == today and endTime has passed
                if work_date < now_date_str or (work_date == now_date_str and end_time <= now_time_str):
                    expired_ids.append(item['jobID'])
                    continue
            active_items.append(item)
        
        # Auto-close expired jobs in DB
        for job_id in expired_ids:
            try:
                table.update_item(
                    Key={'jobID': job_id},
                    UpdateExpression='SET #status = :s, updatedAt = :u',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={':s': 'closed', ':u': datetime.utcnow().isoformat() + 'Z'}
                )
                print(f"⏰ Auto-closed expired quick job: {job_id}")
            except Exception as e:
                print(f"Error auto-closing quick job {job_id}: {str(e)}")
        
        print(f"✅ Found {len(active_items)} active quick jobs ({len(expired_ids)} auto-closed)")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': active_items
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error getting active quick jobs: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting active quick jobs: {str(e)}'
            })
        }

def get_quick_job(job_id, headers):
    """Get single quick job by ID"""
    try:
        response = table.get_item(Key={'jobID': job_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Quick job not found'
                })
            }
        
        item = response['Item']
        print(f"✅ Quick job found: {job_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': item
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error getting quick job: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting quick job: {str(e)}'
            })
        }

def update_quick_job(body_str, job_id, user_id, claims, headers):
    """Update quick job"""
    try:
        response = table.get_item(Key={'jobID': job_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Quick job not found'
                })
            }
        
        existing_job = response['Item']
        
        # Check if user is in Admin group
        groups = claims.get('cognito:groups') or claims.get('groups') or ''
        is_admin = False
        if isinstance(groups, list):
            is_admin = 'Admin' in groups
        elif isinstance(groups, str):
            is_admin = 'Admin' in [g.strip() for g in groups.split(',') if g.strip()]
            
        if user_id and user_id != 'anonymous' and not is_admin and existing_job.get('employerId') != user_id:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Forbidden'
                })
            }
        
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        update_expr = "SET updatedAt = :updatedAt"
        expr_values = {':updatedAt': datetime.utcnow().isoformat() + 'Z'}
        expr_names = {}
        
        updatable_fields = ['title', 'location', 'latitude', 'longitude', 'jobType', 'hourlyRate', 'startTime', 'endTime',
                           'totalHours', 'totalSalary', 'description', 'requirements', 'customFields', 'workHours', 'status', 'workDate']
        
        reserved_keywords = ['location', 'status']
        
        for field in updatable_fields:
            if field in body:
                value = body[field]
                if field in ['latitude', 'longitude', 'hourlyRate', 'totalHours', 'totalSalary'] and value is not None:
                    value = Decimal(str(value))
                
                if field in reserved_keywords:
                    update_expr += f", #{field} = :{field}"
                    expr_names[f'#{field}'] = field
                    expr_values[f':{field}'] = value
                else:
                    update_expr += f", {field} = :{field}"
                    expr_values[f':{field}'] = value
        
        update_params = {
            'Key': {'jobID': job_id},
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
                recommend_job_to_candidates(updated_item, is_quick_job=True)
            except Exception as rec_err:
                print(f"Recommendation alert error: {str(rec_err)}")
            try:
                from email_service import send_employer_approved_email
                send_employer_approved_email(updated_item, is_quick_job=True)
            except Exception as email_err:
                print(f"Employer approval email error: {str(email_err)}")
        elif new_status == 'pending' and old_status != 'pending':
            try:
                from email_service import send_admin_approval_email
                send_admin_approval_email(updated_item, is_quick_job=True)
            except Exception as email_err:
                print(f"Admin approval email error: {str(email_err)}")
                
        print(f"✅ Quick job updated: {job_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': response['Attributes']
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error updating quick job: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error updating quick job: {str(e)}'
            })
        }

def delete_quick_job(job_id, user_id, headers):
    """Delete quick job (soft delete)"""
    try:
        table.update_item(
            Key={'jobID': job_id},
            UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'deleted',
                ':updatedAt': datetime.utcnow().isoformat() + 'Z'
            }
        )
        print(f"✅ Quick job deleted: {job_id}")
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Quick job deleted successfully'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': str(e)
            })
        }

def increment_views(job_id, headers):
    """Increment view count for a quick job"""
    try:
        response = table.get_item(Key={'jobID': job_id})
        if 'Item' not in response:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'success': False})}

        item = response['Item']
        new_views = int(item.get('views', 0) or 0) + 1
        
        table.update_item(
            Key={'jobID': job_id},
            UpdateExpression='SET #views = :v, updatedAt = :u',
            ExpressionAttributeNames={'#views': 'views'},
            ExpressionAttributeValues={
                ':v': new_views,
                ':u': datetime.utcnow().isoformat() + 'Z'
            }
        )
        print(f"✅ View count incremented for quick job: {job_id}")
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'View count incremented'
            })
        }
    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'success': False})}


def get_batch_quick_jobs(body_str, headers):
    """Get multiple quick jobs by IDs in a single request (avoids N+1 problem)"""
    try:
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        job_ids = body.get('jobIds', [])
        
        if not job_ids:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'success': False, 'message': 'Missing jobIds array'})
            }
        
        # Limit to 25 items per batch (DynamoDB BatchGetItem limit is 100 keys)
        job_ids = job_ids[:25]
        
        # Use BatchGetItem for efficiency
        dynamodb_client = boto3.client('dynamodb')
        
        # Build keys for BatchGetItem
        keys = [{'jobID': {'S': jid}} for jid in job_ids]
        
        response = dynamodb_client.batch_get_item(
            RequestItems={
                table_name: {
                    'Keys': keys
                }
            }
        )
        
        # Convert DynamoDB format to normal dict
        from boto3.dynamodb.types import TypeDeserializer
        deserializer = TypeDeserializer()
        
        raw_items = response.get('Responses', {}).get(table_name, [])
        items = []
        for raw_item in raw_items:
            item = {k: deserializer.deserialize(v) for k, v in raw_item.items()}
            # Skip deleted jobs
            if item.get('status') != 'deleted':
                items.append(item)
        
        print(f"✅ Batch fetched {len(items)} quick jobs out of {len(job_ids)} requested")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': items
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error in batch get quick jobs: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error fetching batch quick jobs: {str(e)}'
            })
        }
