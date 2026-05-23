import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'PostStandardJob')
table = dynamodb.Table(table_name)

# Helper function to convert Decimal to int/float for JSON serialization
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def lambda_handler(event, context):
    """
    Main Lambda handler for PostStandardJob API
    """
    print(f"Event: {json.dumps(event)}")
    
    # CORS headers - allow localhost for development
    headers = {
        'Access-Control-Allow-Origin': '*',  # In production, change to specific domain
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
    }
    
    # Handle OPTIONS request for CORS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'OK'})
        }
    
    try:
        # Extract HTTP method and path
        http_method = event.get('httpMethod')
        path = event.get('path', '')
        path_parameters = event.get('pathParameters') or {}
        
        # Extract user ID from Cognito authorizer (if available)
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('claims', {})
        user_id = claims.get('sub')
        
        # If no authorizer, try to get userId from request body (for testing)
        if not user_id:
            try:
                body = json.loads(event.get('body', '{}'))
                user_id = body.get('employerId') or body.get('userId')
            except:
                pass
        
        # For GET requests without auth, allow public access
        if not user_id and http_method == 'GET':
            user_id = 'anonymous'
        
        # Route requests
        if http_method == 'POST' and path == '/jobs':
            return create_job_post(event, user_id, headers)
        
        elif http_method == 'GET' and '/jobs/employer/' in path:
            employer_id = path_parameters.get('employerId')
            return get_employer_jobs(employer_id, headers)
        
        elif http_method == 'GET' and path == '/jobs/active':
            return get_active_jobs(headers)
        
        elif http_method == 'GET' and '/jobs/' in path:
            job_id = path_parameters.get('idJob')
            return get_job_post(job_id, headers)
        
        elif http_method == 'PUT' and '/jobs/' in path:
            job_id = path_parameters.get('idJob')
            return update_job_post(event, job_id, user_id, headers)
        
        elif http_method == 'DELETE' and '/jobs/' in path:
            job_id = path_parameters.get('idJob')
            return delete_job_post(job_id, user_id, headers)
        
        elif http_method == 'POST' and '/views' in path:
            job_id = path_parameters.get('idJob')
            return increment_views(job_id, headers)
        
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Endpoint not found'
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
            'responsibilities': body.get('responsibilities', ''),
            'requirements': body.get('requirements', ''),
            'benefits': body.get('benefits', ''),
            'status': body.get('status', 'active'),
            'category': 'standard',  # Always set to 'standard' for PostStandardJob
            'applicants': body.get('applicants', 0),
            'views': body.get('views', 0),
            'responseRate': body.get('responseRate', 0),
            'createdAt': body.get('createdAt', datetime.utcnow().isoformat() + 'Z'),
            'updatedAt': body.get('updatedAt', datetime.utcnow().isoformat() + 'Z')
        }
        
        # Put item in DynamoDB
        table.put_item(Item=item)
        
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
        
        # Verify ownership - only job owner can update
        # Allow if user_id matches employerId OR if user_id is None (for backward compatibility)
        if user_id and user_id != 'anonymous' and existing_job.get('employerId') != user_id:
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
                           'salary', 'tags', 'description', 'responsibilities', 
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
