import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal
from urllib.parse import urlparse, unquote


def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    }

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
BUCKET_NAME = 'opporeview-cv-storage'
applications_table = dynamodb.Table('StandardApplications')
jobs_table = dynamodb.Table('PostStandardJob')
quick_jobs_table = dynamodb.Table('PostQuickJob')

def lambda_handler(event, context):
    print(f"📥 Received event: {json.dumps(event)}")
    
    # Common headers for all responses including CORS
    response_headers = get_cors_headers()

    def create_response(status_code, body):
        return {
            'statusCode': status_code,
            'headers': response_headers,  # ✅ ALWAYS include CORS headers
            'body': json.dumps(body, default=str)
        }

    try:
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', '')
        path = event.get('path', '') or event.get('rawPath', '')
        # --- PATH NORMALIZATION (SỬA LỖI 404 KHI CÓ STAGE PHÍA TRƯỚC) ---
        normalized_path = path
        path_segments = [s for s in path.split('/') if s]
        if path_segments and (path_segments[0] == 'prod' or path_segments[0] == 'test'):
            normalized_path = '/' + '/'.join(path_segments[1:])
        
        print(f"DEBUG: normalized_path={normalized_path}")

        # Handle OPTIONS request FIRST
        if http_method == 'OPTIONS':
            return create_response(200, {'message': 'OK'})

        # Extract user info from Cognito authorizer
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('claims', {}) or authorizer.get('jwt', {}).get('claims', {})
        candidate_id = claims.get('sub')
        candidate_email = claims.get('email')
        
        # If no authorizer, allow GET for admin/public access
        if not candidate_id and http_method == 'GET':
            candidate_id = 'anonymous'
            candidate_email = 'anonymous@example.com'
        
        # ✅ Return 401 with CORS headers (not just reject at authorizer level)
        if not candidate_id and http_method != 'OPTIONS':
            return create_response(401, {'error': 'Unauthorized - No user ID. Missing or invalid Cognito token.'})
        
        # POST /applications - Submit application
        if http_method == 'POST' and normalized_path == '/applications':
            print(f"✅ Matched submit application route: {normalized_path}")
            return submit_application(event, candidate_id, candidate_email, create_response)
        
        # GET /applications - Get all applications (Admin)
        elif http_method == 'GET' and (normalized_path == '/applications' or normalized_path == '/applications/'):
            print(f"✅ Matched get all applications route: {normalized_path}")
            return get_all_applications(create_response)
        
        # GET /applications/candidate/{candidateId} - Get candidate's applications
        elif http_method == 'GET' and normalized_path.startswith('/applications/candidate/'):
            requested_candidate_id = normalized_path.split('/')[-1]
            print(f"✅ Matched candidate applications route: requested_candidate_id={requested_candidate_id}, auth_candidate_id={candidate_id}")
            return get_candidate_applications(requested_candidate_id or candidate_id, create_response)
        
        # GET /applications/job/{jobId} - Get applications for a job (employer only)
        elif http_method == 'GET' and normalized_path.startswith('/applications/job/'):
            job_id = path.split('/')[-1]
            print(f"✅ Matched job applications route: job_id={job_id}")
            return get_job_applications(job_id, candidate_id, create_response)
        
        # PUT /applications/{applicationId}/status - Update application status (employer only)
        elif http_method == 'PUT' and normalized_path.endswith('/status'):
            application_id = path.split('/')[-2]
            print(f"✅ Matched update application status route: application_id={application_id}")
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
        
        # Extract and store S3 key for reliable URL refresh later
        cv_s3_key = body.get('cvS3Key')
        if not cv_s3_key and cv_url and 'amazonaws.com' in cv_url:
            cv_s3_key = extract_s3_key_from_url(cv_url)
            print(f"📎 Extracted cvS3Key from URL: {cv_s3_key}")

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

        if cv_s3_key:
            application['cvS3Key'] = cv_s3_key
        
        applications_table.put_item(Item=application)

        # Send email notification to Employer about the new application
        try:
            from email_service import send_new_application_email
            send_new_application_email(application)
        except Exception as email_err:
            print(f"Error sending application notification email: {str(email_err)}")

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


def extract_s3_key_from_url(cv_url):
    """Extract S3 key from a presigned or regular S3 URL"""
    try:
        parsed = urlparse(cv_url)
        path = unquote(parsed.path.lstrip('/'))
        hostname = parsed.hostname or ''

        if 's3' in hostname:
            # Virtual-host style: bucket-name.s3.region.amazonaws.com/key
            # Path is already the S3 key
            return path
        else:
            # Path style: s3.region.amazonaws.com/bucket-name/key
            path_parts = path.split('/', 1)
            return path_parts[1] if len(path_parts) > 1 else path
    except Exception:
        return None


def refresh_cv_urls(applications):
    """Refresh presigned CV URLs in a list of applications.
    
    Uses cvS3Key if available (most reliable), otherwise parses cvUrl to extract the key.
    This ensures URLs are always fresh regardless of when the application was submitted.
    """
    for app in applications:
        try:
            # Prefer explicit S3 key saved at submission time
            s3_key = app.get('cvS3Key')

            # Fall back to parsing the existing URL
            if not s3_key:
                cv_url = app.get('cvUrl', '')
                if cv_url and 'amazonaws.com' in cv_url:
                    s3_key = extract_s3_key_from_url(cv_url)

            if not s3_key:
                print(f"⚠️ No S3 key found for application {app.get('applicationId')} — skipping URL refresh")
                continue

            # Generate a fresh presigned URL (valid for 12 hours — safe with STS session tokens)
            new_url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': BUCKET_NAME,
                    'Key': s3_key,
                    'ResponseContentDisposition': f'inline; filename="{app.get("cvFilename", "CV.pdf")}"'
                },
                ExpiresIn=43200  # 12 hours — stays within STS session limit
            )
            app['cvUrl'] = new_url
            print(f"✅ Refreshed CV URL for application {app.get('applicationId')}, key={s3_key}")
        except Exception as e:
            print(f"⚠️ Warning: Could not refresh CV URL for application {app.get('applicationId')}: {str(e)}")
    return applications


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
        applications = refresh_cv_urls(applications)
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
        applications = refresh_cv_urls(applications)
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

        current_item = applications_table.get_item(
            Key={'applicationId': application_id},
            ConsistentRead=True
        ).get('Item')
        if not current_item:
            return create_response(404, {'error': 'Application not found'})

        previous_status = current_item.get('status')
        status_changed = previous_status != new_status
        
        now_iso = datetime.utcnow().isoformat() + 'Z'
        
        update_expr = 'SET #status = :status, updatedAt = :now'
        expr_attr_names = {'#status': 'status'}
        expr_attr_values = {
            ':status': new_status,
            ':now': now_iso
        }
        
        optional_fields = [
            'employerRating',
            'employerConfirmedAt',
            'candidateRating',
            'candidateConfirmed',
            'candidateConfirmedAt',
            'chatMessages',
            'acceptedAt'
        ]

        for field in optional_fields:
            if field in body:
                update_expr += f', {field} = :{field}'
                expr_attr_values[f':{field}'] = body[field]

        # Support changeRequest under multiple keys (camelCase, snake_case, or inside extraFields)
        change_req_raw = None
        if 'changeRequest' in body:
            change_req_raw = body.get('changeRequest')
        elif 'change_request' in body:
            change_req_raw = body.get('change_request')
        elif 'extraFields' in body and isinstance(body.get('extraFields'), dict):
            change_req_raw = body['extraFields'].get('changeRequest') or body['extraFields'].get('change_request')

        # Support changeRequestStatus under multiple keys
        change_req_status = None
        if 'changeRequestStatus' in body:
            change_req_status = body.get('changeRequestStatus')
        elif 'change_request_status' in body:
            change_req_status = body.get('change_request_status')
        elif 'extraFields' in body and isinstance(body.get('extraFields'), dict):
            change_req_status = body['extraFields'].get('changeRequestStatus') or body['extraFields'].get('change_request_status')

        # If change request is a JSON string, parse it
        if isinstance(change_req_raw, str):
            try:
                change_req_raw = json.loads(change_req_raw)
            except Exception:
                # leave as string if can't parse
                pass

        # If a changeRequestStatus was provided, persist it (unless deleted)
        if change_req_status is not None and change_req_status.lower() != 'deleted':
            update_expr += ', changeRequestStatus = :changeRequestStatus'
            expr_attr_values[':changeRequestStatus'] = change_req_status

        # Decide whether to persist or remove the changeRequest payload
        # Keep changeRequestStatus so finalized requests can still be tracked.
        remove_change_request = False
        remove_change_request_status = False
        if change_req_raw is not None:
            update_expr += ', changeRequest = :changeRequest'
            expr_attr_values[':changeRequest'] = change_req_raw
        elif isinstance(change_req_status, str) and change_req_status.lower() == 'deleted':
            remove_change_request = True
            remove_change_request_status = True

        print(f"DEBUG: change_req_raw present={change_req_raw is not None}, change_req_status={change_req_status}, remove_change_request={remove_change_request}")
        print(f"DEBUG: updating item with expression: {update_expr}")
        print(f"DEBUG: values: {expr_attr_values}")

        # DynamoDB requires SET and REMOVE as separate clauses in the same expression.
        if remove_change_request_status:
            update_expr = update_expr + ' REMOVE changeRequest, changeRequestStatus'
        elif remove_change_request:
            update_expr = update_expr + ' REMOVE changeRequest'

        applications_table.update_item(
            Key={'applicationId': application_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_attr_names,
            ExpressionAttributeValues=expr_attr_values
        )

        # Chat updates preserve the current status. Only a real status transition
        # should send an application-result email.
        try:
            if status_changed and new_status in ['accepted', 'rejected']:
                # Get the full updated application item
                app_item = applications_table.get_item(Key={'applicationId': application_id}).get('Item', {})
                if app_item:
                    from email_service import send_application_result_email
                    send_application_result_email(app_item, new_status)
        except Exception as email_err:
            print(f"Error sending application status result email: {str(email_err)}")

        # Check if we are completing the job and save to a new table "CompletedJobs" if it exists
        try:
            if status_changed and new_status == 'completed':
                completed_jobs_table = dynamodb.Table('CompletedJobs')
                # Get the latest application info
                app_item = applications_table.get_item(Key={'applicationId': application_id}).get('Item', {})
                
                # Fetch job details to get full job info
                job_id = app_item.get('jobId')
                job_title = '---'
                company_name = '---'
                if job_id:
                    try:
                        job_resp = jobs_table.get_item(Key={'idJob': str(job_id)})
                        if 'Item' in job_resp:
                            job_item = job_resp['Item']
                            job_title = job_item.get('title', '---')
                            company_name = job_item.get('employerName') or job_item.get('companyName', '---')
                        else:
                            job_resp = quick_jobs_table.get_item(Key={'idJob': str(job_id)})
                            if 'Item' in job_resp:
                                job_item = job_resp['Item']
                                job_title = job_item.get('title', '---')
                                company_name = job_item.get('companyName', '---')
                    except Exception as je:
                        print(f"Warning: Could not fetch job info for completed record: {je}")
                
                # Construct completed job record
                completed_record = {
                    'recordId': str(uuid.uuid4()),
                    'applicationId': application_id,
                    'jobId': job_id or '---',
                    'jobTitle': job_title,
                    'companyName': company_name,
                    'candidateId': app_item.get('candidateId', '---'),
                    'candidateEmail': app_item.get('candidateEmail', '---'),
                    'employerId': app_item.get('employerId', '---'),
                    'employerRating': app_item.get('employerRating') or body.get('employerRating') or {},
                    'candidateRating': app_item.get('candidateRating') or body.get('candidateRating') or {},
                    'completedAt': now_iso,
                    'status': 'completed'
                }
                
                # Try to write to CompletedJobs table
                completed_jobs_table.put_item(Item=completed_record)
                print(f"✅ Successfully wrote completed job record to DynamoDB CompletedJobs table: {application_id}")
        except Exception as dbe:
            print(f"⚠️ Warning: Could not write completed job to CompletedJobs DynamoDB table (it might not exist or lacks IAM permissions): {str(dbe)}")

        return create_response(200, {
            'message': 'Status updated successfully',
            'applicationId': application_id,
            'status': new_status
        })
    except Exception as e:
        print(f"❌ Error updating application status: {str(e)}")
        return create_response(500, {'error': str(e)})

def get_all_applications(create_response):
    """Get all applications for admin"""
    try:
        print("🔍 Scanning all applications...")
        # For simplicity in admin dashboard, we scan the whole table
        # In a high-traffic app, we'd use pagination
        response = applications_table.scan()
        applications = response.get('Items', [])
        applications = refresh_cv_urls(applications)
        
        return create_response(200, {
            'success': True,
            'applications': applications,
            'count': len(applications)
        })
    except Exception as e:
        print(f"❌ Error getting all applications: {str(e)}")
        return create_response(500, {'error': str(e)})
