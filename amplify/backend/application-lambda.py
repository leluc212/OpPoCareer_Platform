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
        
        # GET /applications/change-requests - Admin: list all pending_change applications
        elif http_method == 'GET' and normalized_path == '/applications/change-requests':
            print(f"✅ Matched list change requests route")
            return list_change_requests(create_response)

        # GET /applications/available-workers/{jobId} - Employer: get available workers for replacement
        elif http_method == 'GET' and normalized_path.startswith('/applications/available-workers/'):
            job_id = normalized_path.split('/')[-1]
            print(f"✅ Matched available workers route: job_id={job_id}")
            return get_available_workers(job_id, create_response)

        # PUT /applications/{applicationId}/approve-change - Admin: approve change request
        elif http_method == 'PUT' and normalized_path.endswith('/approve-change'):
            application_id = normalized_path.split('/')[-2]
            print(f"✅ Matched approve change request route: application_id={application_id}")
            return approve_change_request(event, application_id, create_response)

        # PUT /applications/{applicationId}/reject-change - Admin: reject change request
        elif http_method == 'PUT' and normalized_path.endswith('/reject-change'):
            application_id = normalized_path.split('/')[-2]
            print(f"✅ Matched reject change request route: application_id={application_id}")
            return reject_change_request(event, application_id, create_response)

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
        
        # ─── AI Round 1 Screening Gate ────────────────────────────────────────
        # If the CV was screened by AI and explicitly FAILED Round 1, do not create
        # the application — the CV must not be sent to the employer. Applications
        # without an AI screening result (normal flow) or with pass/review proceed.
        if str(body.get('aiScreeningResult', '')).strip().lower() == 'fail':
            return create_response(403, {
                'error': 'CV chưa vượt qua vòng sàng lọc AI (Vòng 1) nên không thể gửi đến nhà tuyển dụng.',
                'code': 'AI_SCREENING_FAILED'
            })
        # ──────────────────────────────────────────────────────────────────────
        
        # ─── eKYC Verification Gate ───────────────────────────────────────────
        try:
            candidate_table = dynamodb.Table('CandidateProfiles')
            profile_response = candidate_table.get_item(Key={'userId': candidate_id})
            profile = profile_response.get('Item', {})
            kyc_completed = profile.get('kycCompleted', False)
            kyc_status = profile.get('kycStatus', '')
            is_verified = kyc_completed == True or kyc_status == 'VERIFIED'
            if not is_verified:
                return create_response(403, {
                    'error': 'Bạn cần hoàn tất xác minh danh tính (eKYC) trước khi ứng tuyển.',
                    'code': 'EKYC_REQUIRED'
                })
        except Exception as kyc_err:
            print(f"⚠️ Error checking eKYC status: {kyc_err}")
            # If cannot verify KYC status, block the application for safety
            return create_response(403, {
                'error': 'Không thể xác minh trạng thái eKYC. Vui lòng thử lại.',
                'code': 'EKYC_CHECK_FAILED'
            })
        # ──────────────────────────────────────────────────────────────────────
        
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
        
        # Block applications to deleted or expired jobs
        if job:
            job_status = job.get('status', '')
            if job_status == 'deleted':
                return create_response(410, {
                    'error': 'Bài đăng này đã bị xóa, không thể ứng tuyển.',
                    'code': 'JOB_DELETED'
                })
            # Check if job is expired (workDays before today)
            work_days = job.get('workDays', '')
            if work_days:
                today_str = datetime.utcnow().strftime('%Y-%m-%d')
                if work_days < today_str:
                    return create_response(410, {
                        'error': 'Bài đăng này đã hết hạn, không thể ứng tuyển.',
                        'code': 'JOB_EXPIRED'
                    })
        
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

        # Save AI screening/interview results if provided
        ai_fields = [
            'aiScreeningScore',
            'aiScreeningResult',
            'aiScreeningReason',
            'aiScreeningStrengths',
            'aiScreeningWeaknesses',
            'aiInterviewScore',
            'aiInterviewReport',
            'aiInterviewAudio',
            'aiInterviewAudioKey'
        ]
        for field in ai_fields:
            if field in body:
                application[field] = body[field]

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
    """Refresh presigned CV URLs and AI Interview Audio URLs in a list of applications.
    
    Uses cvS3Key and aiInterviewAudioKey if available.
    """
    for app in applications:
        try:
            # 1. Refresh CV URL
            s3_key = app.get('cvS3Key')
            if not s3_key:
                cv_url = app.get('cvUrl', '')
                if cv_url and 'amazonaws.com' in cv_url:
                    s3_key = extract_s3_key_from_url(cv_url)

            if s3_key:
                new_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': BUCKET_NAME,
                        'Key': s3_key,
                        'ResponseContentDisposition': f'inline; filename="{app.get("cvFilename", "CV.pdf")}"'
                    },
                    ExpiresIn=43200
                )
                app['cvUrl'] = new_url
                print(f"✅ Refreshed CV URL for application {app.get('applicationId')}, key={s3_key}")
        except Exception as e:
            print(f"⚠️ Warning: Could not refresh CV URL for application {app.get('applicationId')}: {str(e)}")

        try:
            # 2. Refresh AI Interview Audio URL
            audio_key = app.get('aiInterviewAudioKey')
            if audio_key:
                new_audio_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': BUCKET_NAME,
                        'Key': audio_key,
                        'ResponseContentDisposition': 'inline; filename="interview_audio.webm"'
                    },
                    ExpiresIn=43200
                )
                app['aiInterviewAudio'] = new_audio_url
                print(f"✅ Refreshed AI Interview Audio URL for application {app.get('applicationId')}, key={audio_key}")
        except Exception as e:
            print(f"⚠️ Warning: Could not refresh AI Interview Audio URL for application {app.get('applicationId')}: {str(e)}")
            
    return applications


def get_candidate_applications(candidate_id, create_response):
    """Get all applications for a candidate (excluding job_deleted)"""
    try:
        response = applications_table.query(
            IndexName='CandidateIndex',
            KeyConditionExpression='candidateId = :cid',
            ExpressionAttributeValues={':cid': candidate_id},
            ScanIndexForward=False
        )
        applications = response.get('Items', [])
        # Filter out applications whose parent job was deleted
        applications = [app for app in applications if app.get('status') != 'job_deleted']
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
            'acceptedAt',
            'aiScreeningScore',
            'aiScreeningResult',
            'aiScreeningReason',
            'aiScreeningStrengths',
            'aiScreeningWeaknesses',
            'aiInterviewScore',
            'aiInterviewReport',
            'aiInterviewAudio',
            'aiInterviewAudioKey'
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

        try:
            if status_changed and new_status in ['accepted', 'approved', 'rejected']:
                # Get the full updated application item
                app_item = applications_table.get_item(Key={'applicationId': application_id}).get('Item', {})
                if app_item:
                    from email_service import send_application_result_email
                    send_application_result_email(app_item, new_status)
            
            # Trigger employer email if candidate completes AI interview (Round 2)
            is_interview_completed = (not status_changed) and ('aiInterviewScore' in body) and (previous_status == 'approved')
            if is_interview_completed:
                app_item = applications_table.get_item(Key={'applicationId': application_id}).get('Item', {})
                if app_item:
                    from email_service import send_employer_interview_completed_email
                    send_employer_interview_completed_email(app_item)
        except Exception as email_err:
            print(f"Error sending application status result email: {str(email_err)}")

        # ── Credit candidate wallet when employer submits rating ──────────────────
        # Status: completed_pending_candidate = employer has rated, waiting for candidate confirm
        # Guard: only credit if previous status was NOT already completed_pending_candidate
        try:
            if status_changed and new_status == 'completed_pending_candidate' \
                    and previous_status not in ('completed_pending_candidate', 'completed'):
                app_item = applications_table.get_item(
                    Key={'applicationId': application_id},
                    ConsistentRead=True
                ).get('Item', {})

                candidate_id_to_credit = app_item.get('candidateId')
                job_id_to_credit = app_item.get('jobId')

                if candidate_id_to_credit and job_id_to_credit:
                    # Fetch job to get salary — try both standard and quick jobs tables
                    job_salary = Decimal('0')
                    try:
                        qj_resp = quick_jobs_table.get_item(Key={'idJob': str(job_id_to_credit)})
                        if 'Item' in qj_resp:
                            ji = qj_resp['Item']
                            total_salary = Decimal(str(ji.get('totalSalary') or 0))
                            hourly_rate = Decimal(str(ji.get('hourlyRate') or 0))
                            total_hours = Decimal(str(ji.get('totalHours') or 0))
                            job_salary = total_salary if total_salary > 0 else (hourly_rate * total_hours)
                        else:
                            # Fallback: check standard jobs table
                            sj_resp = jobs_table.get_item(Key={'idJob': str(job_id_to_credit)})
                            if 'Item' in sj_resp:
                                ji = sj_resp['Item']
                                total_salary = Decimal(str(ji.get('totalSalary') or ji.get('salary') or 0))
                                job_salary = total_salary
                    except Exception as je:
                        print(f"⚠️ Could not fetch job for wallet credit: {je}")

                    candidate_income = (job_salary * Decimal('0.85')).to_integral_value()

                    if candidate_income > 0:
                        candidate_table = dynamodb.Table('CandidateProfiles')
                        try:
                            # Atomic increment — safe against concurrent calls
                            candidate_table.update_item(
                                Key={'userId': candidate_id_to_credit},
                                UpdateExpression='SET walletBalance = if_not_exists(walletBalance, :zero) + :income, updatedAt = :ts',
                                ExpressionAttributeValues={
                                    ':income': candidate_income,
                                    ':zero': Decimal('0'),
                                    ':ts': now_iso
                                }
                            )
                            print(f"✅ Credited {candidate_income} VND to candidate {candidate_id_to_credit}")
                        except Exception as we:
                            print(f"⚠️ Could not update candidate walletBalance: {we}")
                    else:
                        print(f"⚠️ Job salary is 0 or not found for jobId={job_id_to_credit}, skipping credit")
        except Exception as credit_err:
            print(f"⚠️ Wallet credit step failed (non-fatal): {credit_err}")

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


def list_change_requests(create_response):
    """Admin: get all applications with status pending_change"""
    try:
        print("🔍 Scanning for pending_change applications...")
        response = applications_table.scan(
            FilterExpression='#st = :status',
            ExpressionAttributeNames={'#st': 'status'},
            ExpressionAttributeValues={':status': 'pending_change'}
        )
        applications = response.get('Items', [])

        # Handle DynamoDB pagination
        while 'LastEvaluatedKey' in response:
            response = applications_table.scan(
                FilterExpression='#st = :status',
                ExpressionAttributeNames={'#st': 'status'},
                ExpressionAttributeValues={':status': 'pending_change'},
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            applications.extend(response.get('Items', []))

        # Enrich each request with job info (startTime, endTime, hourlyRate)
        for app in applications:
            job_id = app.get('jobId')
            if job_id:
                try:
                    qj = quick_jobs_table.get_item(Key={'idJob': str(job_id)}).get('Item', {})
                    if qj:
                        app['_jobStartTime'] = qj.get('startTime', '')
                        app['_jobEndTime'] = qj.get('endTime', '')
                        app['_jobHourlyRate'] = str(qj.get('hourlyRate', '0'))
                        app['_jobTitle'] = qj.get('title', '')
                        app['_jobLocation'] = qj.get('location', '')
                except Exception as je:
                    print(f"⚠️ Could not enrich job info for app {app.get('applicationId')}: {je}")

        # Sort by createdAt descending (newest first)
        applications.sort(key=lambda x: x.get('updatedAt', ''), reverse=True)

        print(f"✅ Found {len(applications)} pending change requests")
        return create_response(200, {
            'success': True,
            'applications': applications,
            'count': len(applications)
        })
    except Exception as e:
        print(f"❌ Error listing change requests: {str(e)}")
        return create_response(500, {'error': str(e)})


def get_available_workers(job_id, create_response):
    """Employer: get KYC-verified candidates available for worker replacement.
    Returns candidates who:
    - Have kycCompleted = true
    - Are NOT currently accepted/active on a job that overlaps with the target job's time slot
    """
    try:
        print(f"🔍 Finding available workers for job: {job_id}")

        # Fetch target job details to get workDate, startTime, endTime
        target_job = None
        try:
            qj = quick_jobs_table.get_item(Key={'idJob': str(job_id)}).get('Item')
            if qj:
                target_job = qj
        except Exception as je:
            print(f"⚠️ Could not fetch target job: {je}")

        target_work_date = target_job.get('workDate', '') if target_job else ''
        target_start = target_job.get('startTime', '') if target_job else ''
        target_end = target_job.get('endTime', '') if target_job else ''

        # Scan all accepted/active applications on the same workDate
        busy_candidate_ids = set()
        if target_work_date:
            try:
                resp = applications_table.scan(
                    FilterExpression='#st IN (:s1, :s2, :s3)',
                    ExpressionAttributeNames={'#st': 'status'},
                    ExpressionAttributeValues={
                        ':s1': 'accepted',
                        ':s2': 'pending_change',
                        ':s3': 'pending'
                    }
                )
                all_active = resp.get('Items', [])
                while 'LastEvaluatedKey' in resp:
                    resp = applications_table.scan(
                        FilterExpression='#st IN (:s1, :s2, :s3)',
                        ExpressionAttributeNames={'#st': 'status'},
                        ExpressionAttributeValues={
                            ':s1': 'accepted',
                            ':s2': 'pending_change',
                            ':s3': 'pending'
                        },
                        ExclusiveStartKey=resp['LastEvaluatedKey']
                    )
                    all_active.extend(resp.get('Items', []))

                for active_app in all_active:
                    # Skip the job being replaced itself
                    if active_app.get('jobId') == str(job_id):
                        continue
                    # Check if this app's job overlaps with target job
                    active_job_id = active_app.get('jobId')
                    if not active_job_id:
                        continue
                    try:
                        aqj = quick_jobs_table.get_item(Key={'idJob': str(active_job_id)}).get('Item', {})
                        if aqj.get('workDate') != target_work_date:
                            continue
                        # Check time overlap
                        a_start = aqj.get('startTime', '')
                        a_end = aqj.get('endTime', '')
                        if a_start and a_end and target_start and target_end:
                            # Simple string comparison (HH:MM format works)
                            overlaps = not (a_end <= target_start or a_start >= target_end)
                            if overlaps:
                                busy_candidate_ids.add(active_app.get('candidateId'))
                        else:
                            # No time info — mark as busy to be safe
                            busy_candidate_ids.add(active_app.get('candidateId'))
                    except Exception:
                        pass
            except Exception as ae:
                print(f"⚠️ Could not scan active applications: {ae}")

        # Get current worker of the job being replaced — exclude from results
        current_worker_id = None
        try:
            current_apps = applications_table.query(
                IndexName='JobIndex',
                KeyConditionExpression='jobId = :jid',
                ExpressionAttributeValues={':jid': str(job_id)}
            ).get('Items', [])
            for ca in current_apps:
                if ca.get('status') in ('accepted', 'pending_change'):
                    current_worker_id = ca.get('candidateId')
                    break
        except Exception:
            pass

        # Scan CandidateProfiles for KYC-verified candidates
        candidate_table = dynamodb.Table('CandidateProfiles')
        resp = candidate_table.scan(
            FilterExpression='kycCompleted = :kyc',
            ExpressionAttributeValues={':kyc': True}
        )
        candidates = resp.get('Items', [])
        while 'LastEvaluatedKey' in resp:
            resp = candidate_table.scan(
                FilterExpression='kycCompleted = :kyc',
                ExpressionAttributeValues={':kyc': True},
                ExclusiveStartKey=resp['LastEvaluatedKey']
            )
            candidates.extend(resp.get('Items', []))

        available = []
        for c in candidates:
            cid = c.get('userId', '')
            if not cid:
                continue
            if cid in busy_candidate_ids:
                continue
            if cid == current_worker_id:
                continue
            available.append({
                'candidateId': cid,
                'fullName': c.get('fullName') or c.get('name') or c.get('email', '').split('@')[0] or 'Worker',
                'email': c.get('email', ''),
                'phone': c.get('phone', ''),
                'location': c.get('location', ''),
                'rating': str(c.get('rating', '0'))
            })

        print(f"✅ Found {len(available)} available workers")
        return create_response(200, {
            'success': True,
            'workers': available,
            'count': len(available)
        })
    except Exception as e:
        print(f"❌ Error getting available workers: {str(e)}")
        return create_response(500, {'error': str(e)})


def approve_change_request(event, application_id, create_response):
    """Admin: approve a pending_change request.
    Flow đơn giản:
    1. Đổi candidateId/Email/Name sang worker mới trên application hiện tại
    2. Giữ nguyên status='accepted', startTime, endTime, hourlyRate, jobSalary
    3. Xoá changeRequest, set changeRequestStatus='approved', approvedAt
    Không tạo record mới, không tính tiền.
    """
    try:
        from datetime import timezone, timedelta

        # Lấy application hiện tại
        current_item = applications_table.get_item(
            Key={'applicationId': application_id},
            ConsistentRead=True
        ).get('Item')
        if not current_item:
            return create_response(404, {'error': 'Application not found'})

        if current_item.get('status') != 'pending_change':
            return create_response(400, {'error': f'Application is not in pending_change status (current: {current_item.get("status")})'})

        now_dt = datetime.utcnow()
        now_iso = now_dt.isoformat() + 'Z'

        # Lấy changeRequest data
        change_req = current_item.get('changeRequest') or {}
        if isinstance(change_req, str):
            try:
                change_req = json.loads(change_req)
            except Exception:
                change_req = {}

        old_worker_id    = current_item.get('candidateId', '')
        new_worker_id    = change_req.get('newWorkerId', '')
        new_worker_email = change_req.get('newWorkerEmail', '')
        new_worker_name  = change_req.get('newWorkerName', '')

        if not new_worker_id:
            return create_response(400, {'error': 'newWorkerId missing from changeRequest'})

        # Lấy thông tin job để trả về cho frontend thông báo
        job_id       = current_item.get('jobId', '')
        job_location = current_item.get('jobLocation', '')
        job_title    = current_item.get('jobTitle', '')
        job_shift    = current_item.get('jobShift', '')   # e.g. "08:00 - 17:00"
        job_workdate = current_item.get('jobWorkDate', '')

        if job_id:
            try:
                qj = quick_jobs_table.get_item(Key={'idJob': str(job_id)}).get('Item', {})
                if qj:
                    job_location = job_location or qj.get('location', '')
                    job_title    = job_title    or qj.get('title', '')
                    start_t      = qj.get('startTime', '')
                    end_t        = qj.get('endTime', '')
                    if start_t and end_t:
                        job_shift = f"{start_t} - {end_t}"
                    job_workdate = job_workdate or qj.get('workDate', '')
            except Exception as je:
                print(f"⚠️ Could not fetch job details: {je}")

        # Định dạng workDate dạng DD/MM/YYYY để dùng trong thông báo
        workdate_display = job_workdate
        if job_workdate and '-' in job_workdate:
            try:
                parts = job_workdate.split('-')  # YYYY-MM-DD
                workdate_display = f"{parts[2]}/{parts[1]}/{parts[0]}"
            except Exception:
                pass

        # === Cập nhật application: đổi worker, giữ nguyên mọi thứ khác ===
        applications_table.update_item(
            Key={'applicationId': application_id},
            UpdateExpression=(
                'SET candidateId = :newCid, candidateEmail = :newEmail, candidateName = :newName, '
                'changeRequestStatus = :crs, approvedAt = :now, updatedAt = :now '
                'REMOVE changeRequest'
            ),
            ExpressionAttributeValues={
                ':newCid':   new_worker_id,
                ':newEmail': new_worker_email,
                ':newName':  new_worker_name,
                ':crs':      'approved',
                ':now':      now_iso
            }
        )
        print(f"✅ Worker swapped on application {application_id}: {old_worker_id} → {new_worker_id}")

        return create_response(200, {
            'success':        True,
            'message':        'Yêu cầu thay đổi nhân viên đã được duyệt',
            'applicationId':  application_id,
            'approvedAt':     now_iso,
            'oldWorkerId':    old_worker_id,
            'newWorkerId':    new_worker_id,
            'newWorkerName':  new_worker_name,
            'jobLocation':    job_location,
            'jobTitle':       job_title,
            'jobShift':       job_shift,
            'jobWorkDate':    job_workdate,
            'workDateDisplay': workdate_display
        })
    except Exception as e:
        print(f"❌ Error approving change request: {str(e)}")
        return create_response(500, {'error': str(e)})


def reject_change_request(event, application_id, create_response):
    """Admin: reject a pending_change request — worker cũ tiếp tục làm, không cần lý do"""
    try:
        current_item = applications_table.get_item(
            Key={'applicationId': application_id},
            ConsistentRead=True
        ).get('Item')
        if not current_item:
            return create_response(404, {'error': 'Application not found'})

        if current_item.get('status') != 'pending_change':
            return create_response(400, {'error': f'Application is not in pending_change status (current: {current_item.get("status")})'})

        now_iso = datetime.utcnow().isoformat() + 'Z'

        # Khôi phục worker cũ về accepted, xóa changeRequest
        applications_table.update_item(
            Key={'applicationId': application_id},
            UpdateExpression='SET #status = :status, changeRequestStatus = :crs, updatedAt = :now REMOVE changeRequest',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'accepted',
                ':crs': 'rejected',
                ':now': now_iso
            }
        )

        print(f"✅ Change request rejected for applicationId={application_id}")
        return create_response(200, {
            'success': True,
            'message': 'Yêu cầu thay đổi đã bị từ chối',
            'applicationId': application_id,
            'rejectedAt': now_iso
        })
    except Exception as e:
        print(f"❌ Error rejecting change request: {str(e)}")
        return create_response(500, {'error': str(e)})
