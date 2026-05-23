import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
applications_table = dynamodb.Table('StandardApplications')
jobs_table = dynamodb.Table('PostStandardJob')
quick_jobs_table = dynamodb.Table('PostQuickJob')

def lambda_handler(event, context):
    print(f"📥 Received event: {json.dumps(event)}")
    
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
            'body': json.dumps(body, default=str)
        }

    try:
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', '')
        path = event.get('path', '') or event.get('rawPath', '')
        
        print(f"Executing method: {http_method}, Path: {path}")

        # Handle OPTIONS request FIRST
        if http_method == 'OPTIONS':
            return create_response(200, {'message': 'OK'})

        # Extract user info from Cognito authorizer
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('claims', {}) or authorizer.get('jwt', {}).get('claims', {})
        candidate_id = claims.get('sub')
        candidate_email = claims.get('email')
        
        if not candidate_id:
            return create_response(401, {'error': 'Unauthorized - No user ID'})
        
        # POST /applications - Submit application
        if http_method == 'POST' and path == '/applications':
            return submit_application(event, candidate_id, candidate_email, create_response)
        
        # GET /applications/candidate/{candidateId} - Get candidate's applications
        elif http_method == 'GET' and '/applications/candidate/' in path:
            return get_candidate_applications(candidate_id, create_response)
        
        # GET /applications/job/{jobId} - Get applications for a job (employer only)
        elif http_method == 'GET' and '/applications/job/' in path:
            job_id = path.split('/')[-1]
            return get_job_applications(job_id, candidate_id, create_response)
        
        # PUT /applications/{applicationId}/status - Update application status (employer only)
        elif http_method == 'PUT' and '/status' in path:
            application_id = path.split('/')[-2]
            return update_application_status(event, application_id, candidate_id, create_response)
        
        else:
            return create_response(404, {'error': f'Route not found: {http_method} {path}'})
    
    except Exception as e:
        print(f"❌ Error in lambda_handler: {str(e)}")
        return create_response(500, {'error': str(e)})

def submit_application(event, candidate_id, candidate_email, create_response):
    """Submit a new job application"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Required fields
        job_id = body.get('jobId')
        cv_url = body.get('cvUrl')
        cv_filename = body.get('cvFilename')
        
        if job_id is not None:
            job_id = str(job_id)
        
        if not job_id or not cv_url:
            return create_response(400, {'error': 'Missing required fields: jobId, cvUrl'})
        
        # ANTI-SPAM: Check if user already applied to this job
        try:
            existing_response = applications_table.query(
                IndexName='CandidateIndex',
                KeyConditionExpression='candidateId = :cid',
                FilterExpression='jobId = :jid',
                ExpressionAttributeValues={
                    ':cid': candidate_id,
                    ':jid': job_id
                }
            )
            
            if existing_response.get('Items'):
                return create_response(409, {
                    'error': 'You have already applied to this job',
                    'code': 'ALREADY_APPLIED'
                })
        except Exception as e:
            print(f"Warning: Could not check existing applications: {e}")
        
        # Get job details
        job = None
        employer_id = None
        employer_email = None
        job_title = None
        job_type = 'standard'
        
        try:
            response = jobs_table.get_item(Key={'idJob': job_id})
            if 'Item' in response:
                job = response['Item']
                employer_id = job.get('employerId')
                employer_email = job.get('employerEmail')
                job_title = job.get('title')
                job_type = 'standard'
        except:
            pass
        
        if not job:
            try:
                response = quick_jobs_table.get_item(Key={'jobID': job_id})
                if 'Item' in response:
                    job = response['Item']
                    employer_id = job.get('employerId')
                    employer_email = job.get('employerEmail')
                    job_title = job.get('title')
                    job_type = 'quick'
            except:
                pass
        
        if not job:
            employer_id = body.get('employerId') or 'DEMO-EMPLOYER'
            employer_email = body.get('employerEmail') or 'demo@example.com'
            employer_name = body.get('employerName') or 'Unknown Company'
            job_title = body.get('jobTitle') or 'Unknown Job'
            job_type = 'demo'
        
        application_id = f"APP-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        now_iso = datetime.utcnow().isoformat() + 'Z'
        
        application = {
            'applicationId': application_id,
            'jobId': job_id,
            'jobTitle': job_title,
            'jobType': job_type,
            'candidateId': candidate_id,
            'candidateEmail': candidate_email,
            'employerId': employer_id,
            'employerEmail': employer_email,
            'employerName': job.get('employerName') if job else employer_name,
            'cvUrl': cv_url,
            'cvFilename': cv_filename or 'CV.pdf',
            'status': 'pending',
            'appliedAt': now_iso,
            'updatedAt': now_iso
        }
        
        applications_table.put_item(Item=application)

        # Update job stats (applicants + responseRate) if this is a real job
        try:
            if job and job_type in ['standard', 'quick']:
                now_iso = datetime.utcnow().isoformat() + 'Z'
                current_applicants = int(job.get('applicants', 0) or 0)
                current_views = int(job.get('views', 0) or 0)
                new_applicants = current_applicants + 1
                response_rate = int(round((new_applicants / current_views) * 100)) if current_views else 0

                if job_type == 'standard':
                    jobs_table.update_item(
                        Key={'idJob': job_id},
                        UpdateExpression='SET applicants = :app, responseRate = :rr, updatedAt = :updated',
                        ExpressionAttributeValues={
                            ':app': new_applicants,
                            ':rr': response_rate,
                            ':updated': now_iso
                        }
                    )
                else:
                    # Quick jobs table uses jobID as the key
                    quick_jobs_table.update_item(
                        Key={'jobID': job_id},
                        UpdateExpression='SET applicants = :app, responseRate = :rr, updatedAt = :updated',
                        ExpressionAttributeValues={
                            ':app': new_applicants,
                            ':rr': response_rate,
                            ':updated': now_iso
                        }
                    )
        except Exception as stats_error:
            print(f"⚠️ Warning: Failed to update job stats: {str(stats_error)}")

        return create_response(201, {
            'message': 'Application submitted successfully',
            'applicationId': application_id,
            'application': application
        })
    
    except Exception as e:
        print(f"❌ Error submitting application: {str(e)}")
        return create_response(500, {'error': str(e)})

def get_candidate_applications(candidate_id, create_response):
    """Get all applications for a candidate"""
    try:
        response = applications_table.query(
            IndexName='CandidateIndex',
            KeyConditionExpression='candidateId = :cid',
            ExpressionAttributeValues={':cid': candidate_id},
            ScanIndexForward=False
        )
        applications = response.get('Items', [])
        return create_response(200, {
            'applications': applications,
            'count': len(applications)
        })
    except Exception as e:
        print(f"❌ Error getting candidate applications: {str(e)}")
        return create_response(500, {'error': str(e)})

def get_job_applications(job_id, user_id, create_response):
    """Get all applications for a job (employer only)"""
    try:
        response = applications_table.query(
            IndexName='JobIndex',
            KeyConditionExpression='jobId = :jid',
            ExpressionAttributeValues={':jid': job_id}
        )
        applications = response.get('Items', [])
        # In real life, we should check if requester is the employer here
        return create_response(200, {
            'applications': applications,
            'count': len(applications)
        })
    except Exception as e:
        print(f"❌ Error getting job applications: {str(e)}")
        return create_response(500, {'error': str(e)})

def update_application_status(event, application_id, user_id, create_response):
    """Update application status"""
    try:
        body = json.loads(event.get('body', '{}'))
        new_status = body.get('status')
        if not new_status:
            return create_response(400, {'error': 'Missing status'})
        
        now_iso = datetime.utcnow().isoformat() + 'Z'
        
        applications_table.update_item(
            Key={'applicationId': application_id},
            UpdateExpression='SET #status = :status, updatedAt = :now',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': new_status,
                ':now': now_iso
            }
        )
        return create_response(200, {
            'message': 'Status updated successfully',
            'applicationId': application_id,
            'status': new_status
        })
    except Exception as e:
        print(f"❌ Error updating application status: {str(e)}")
        return create_response(500, {'error': str(e)})
