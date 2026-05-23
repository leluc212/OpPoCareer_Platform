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
    raise TypeError

def lambda_handler(event, context):
    """
    Main Lambda handler for PostQuickJob API
    """
    print(f"Event: {json.dumps(event)}")
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Max-Age': '3600',
        'Content-Type': 'application/json'
    }
    
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
    
    print(f"HTTP Method: {http_method}, Path: {path}")
    
    # Handle OPTIONS request for CORS
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'OK'})
        }
    
    try:
        # Extract user ID from Cognito authorizer
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('claims', {})
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
        
        # Route requests
        if http_method == 'POST' and path == '/quick-jobs':
            return create_quick_job(body, user_id, headers)
        
        elif http_method == 'GET' and '/quick-jobs/employer/' in path:
            employer_id = path_parameters.get('employerId')
            return get_employer_quick_jobs(employer_id, headers)
        
        elif http_method == 'GET' and path == '/quick-jobs/active':
            return get_active_quick_jobs(headers)
        
        elif http_method == 'GET' and '/quick-jobs/' in path and path != '/quick-jobs/active':
            job_id = path_parameters.get('idJob')
            return get_quick_job(job_id, headers)
        
        elif http_method == 'PUT' and '/quick-jobs/' in path:
            job_id = path_parameters.get('idJob')
            return update_quick_job(body, job_id, user_id, headers)
        
        elif http_method == 'DELETE' and '/quick-jobs/' in path:
            job_id = path_parameters.get('idJob')
            return delete_quick_job(job_id, user_id, headers)
        
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
        
        # Convert latitude and longitude to Decimal if they exist
        latitude = body.get('latitude')
        longitude = body.get('longitude')
        
        if latitude is not None:
            latitude = Decimal(str(latitude))
        if longitude is not None:
            longitude = Decimal(str(longitude))
        
        # Convert numeric fields to Decimal to avoid Float type errors
        hourly_rate = body.get('hourlyRate', 0)
        total_hours = body.get('totalHours', 0)
        total_salary = body.get('totalSalary', 0)
        
        if hourly_rate is not None:
            hourly_rate = Decimal(str(hourly_rate))
        if total_hours is not None:
            total_hours = Decimal(str(total_hours))
        if total_salary is not None:
            total_salary = Decimal(str(total_salary))
        
        # Create item
        item = {
            'jobID': body['idJob'],  # Note: table uses jobID, but API uses idJob
            'employerId': employer_id,
            'employerEmail': body.get('employerEmail', ''),
            'companyName': body.get('companyName', ''),  # Company name for display
            'title': body['title'],
            'location': body['location'],
            'latitude': latitude,  # GPS latitude for location-based search (Decimal)
            'longitude': longitude,  # GPS longitude for location-based search (Decimal)
            'jobType': body.get('jobType', 'part-time'),  # Job type: part-time or full-time
            'hourlyRate': hourly_rate,
            'startTime': body['startTime'],
            'endTime': body['endTime'],
            'totalHours': total_hours,
            'totalSalary': total_salary,
            'description': body['description'],
            'requirements': body.get('requirements', ''),  # Job requirements
            'status': body.get('status', 'pending'),
            'category': 'quick-jobs',  # Always set to 'quick-jobs'
            'applicants': body.get('applicants', 0),
            'views': body.get('views', 0),
            'workDate': body.get('workDate', ''),  # Work date
            'createdAt': body.get('createdAt', datetime.utcnow().isoformat() + 'Z'),
            'updatedAt': body.get('updatedAt', datetime.utcnow().isoformat() + 'Z')
        }
        
        # Put item in DynamoDB
        table.put_item(Item=item)
        
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

def get_employer_quick_jobs(employer_id, headers):
    """Get all quick jobs for an employer"""
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
            ScanIndexForward=False  # Sort by createdAt descending
        )
        
        items = response.get('Items', [])
        print(f"✅ Found {len(items)} active quick jobs")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': items
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

def update_quick_job(body_str, job_id, user_id, headers):
    """Update quick job"""
    try:
        # First, get the existing job to verify ownership
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
        
        # Verify ownership
        if user_id and user_id != 'anonymous' and existing_job.get('employerId') != user_id:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Forbidden - you can only update your own jobs'
                })
            }
        
        # Parse update data
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        
        # Build update expression
        update_expr = "SET updatedAt = :updatedAt"
        expr_values = {':updatedAt': datetime.utcnow().isoformat() + 'Z'}
        expr_names = {}
        
        # Add fields to update
        updatable_fields = ['title', 'location', 'latitude', 'longitude', 'jobType', 'hourlyRate', 'startTime', 'endTime',
                           'totalHours', 'totalSalary', 'description', 'requirements', 'status', 'workDate']
        
        reserved_keywords = ['location', 'status']
        
        for field in updatable_fields:
            if field in body:
                value = body[field]
                
                # Convert latitude and longitude to Decimal
                if field in ['latitude', 'longitude'] and value is not None:
                    value = Decimal(str(value))
                
                if field in reserved_keywords:
                    update_expr += f", #{field} = :{field}"
                    expr_names[f'#{field}'] = field
                    expr_values[f':{field}'] = value
                else:
                    update_expr += f", {field} = :{field}"
                    expr_values[f':{field}'] = value
        
        # Update item
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
        print(f"✅ Quick job updated: {job_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Quick job updated successfully',
                'data': updated_item
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
        # First, get the existing job to verify ownership
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
        job_employer_id = existing_job.get('employerId')
        
        if user_id and user_id != 'anonymous':
            if job_employer_id and job_employer_id != user_id:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({
                        'success': False,
                        'message': 'Forbidden - you can only delete your own jobs'
                    })
                }
        
        # Soft delete - update status to 'deleted'
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
        print(f"Error deleting quick job: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error deleting quick job: {str(e)}'
            })
        }

def increment_views(job_id, headers):
    """Increment view count for a quick job"""
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
        current_views = int(item.get('views', 0) or 0)
        current_applicants = int(item.get('applicants', 0) or 0)
        new_views = current_views + 1
        response_rate = int(round((current_applicants / new_views) * 100)) if new_views else 0

        table.update_item(
            Key={'jobID': job_id},
            UpdateExpression='SET #views = :views, responseRate = :rr, updatedAt = :updated',
            ExpressionAttributeNames={'#views': 'views'},
            ExpressionAttributeValues={
                ':views': new_views,
                ':rr': response_rate,
                ':updated': datetime.utcnow().isoformat() + 'Z'
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
        print(f"Error incrementing views: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error incrementing views: {str(e)}'
            })
        }
