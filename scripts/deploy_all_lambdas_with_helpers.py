import boto3
import os
import zipfile
import io
import time

region = "ap-southeast-1"
client = boto3.client("lambda", region_name=region)
waiter = client.get_waiter("function_updated")

lambda_specs = {
    "ApplicationLambda": {
        "files": [
            ("amplify/backend/application-lambda.py", "application-lambda.py"),
            ("amplify/backend/email_service.py", "email_service.py"),
            ("amplify/backend/job_recommender.py", "job_recommender.py"),
        ],
        "handler": "application-lambda.lambda_handler"
    },
    "ApplicantsReportLambda": {
        "files": [
            ("amplify/backend/applicants-report-lambda.py", "applicants-report-lambda.py"),
        ],
        "handler": "applicants-report-lambda.lambda_handler"
    },
    "CandidateProfileLambda": {
        "files": [
            ("amplify/backend/candidate-profile-lambda.py", "candidate-profile-lambda.py"),
        ],
        "handler": "candidate-profile-lambda.lambda_handler"
    },
    "EmployerProfileLambda": {
        "files": [
            ("amplify/backend/lambda-deployment/api-employer-profile.cjs", "api-employer-profile.cjs"),
            ("amplify/backend/lambda-deployment/employer-profile.cjs", "employer-profile.cjs"),
        ],
        "handler": "api-employer-profile.handler"
    },
    "CheckEmailLambda": {
        "files": [
            ("amplify/backend/check-email-lambda.js", "check-email-lambda.js"),
        ],
        "handler": "check-email-lambda.handler"
    },
    "CvAiLambda": {
        "files": [
            ("amplify/backend/cv-ai/handler.py", "handler.py"),
            ("amplify/backend/cv-ai/fnb_interview_dataset.py", "fnb_interview_dataset.py"),
        ],
        "handler": "handler.lambda_handler"
    },
    "DiditEkycLambda": {
        "files": [
            ("amplify/backend/didit-ekyc-handler.py", "didit-ekyc-handler.py"),
        ],
        "handler": "didit-ekyc-handler.lambda_handler"
    },
    "ExperienceLambda": {
        "files": [
            ("amplify/backend/experience-lambda.py", "experience-lambda.py"),
        ],
        "handler": "experience-lambda.lambda_handler"
    },
    "JobPostLambda": {
        "files": [
            ("amplify/backend/job-post-lambda.py", "job-post-lambda.py"),
            ("amplify/backend/email_service.py", "email_service.py"),
            ("amplify/backend/job_recommender.py", "job_recommender.py"),
        ],
        "handler": "job-post-lambda.lambda_handler"
    },
    "NotificationsLambda": {
        "files": [
            ("amplify/backend/notifications-lambda.py", "notifications-lambda.py"),
        ],
        "handler": "notifications-lambda.lambda_handler"
    },
    "PackageSubscriptionsLambda": {
        "files": [
            ("amplify/backend/package-subscriptions-lambda.py", "package-subscriptions-lambda.py"),
            ("amplify/backend/email_service.py", "email_service.py"),
        ],
        "handler": "package-subscriptions-lambda.lambda_handler"
    },
    "PaymentsLambda": {
        "files": [
            ("amplify/backend/payments-lambda.js", "payments-lambda.js"),
        ],
        "handler": "payments-lambda.handler"
    },
    "QuickJobLambda": {
        "files": [
            ("amplify/backend/quick-job-lambda.py", "quick-job-lambda.py"),
            ("amplify/backend/email_service.py", "email_service.py"),
            ("amplify/backend/job_recommender.py", "job_recommender.py"),
        ],
        "handler": "quick-job-lambda.lambda_handler"
    },
    "TranslateLambda": {
        "files": [
            ("amplify/backend/translate-lambda.py", "translate-lambda.py"),
        ],
        "handler": "translate-lambda.lambda_handler"
    },
    "ws-admin-connect": {
        "files": [
            ("amplify/backend/websocket-connect-lambda.py", "websocket-connect-lambda.py"),
        ],
        "handler": "websocket-connect-lambda.lambda_handler"
    },
    "ws-admin-disconnect": {
        "files": [
            ("amplify/backend/websocket-disconnect-lambda.py", "websocket-disconnect-lambda.py"),
        ],
        "handler": "websocket-disconnect-lambda.lambda_handler"
    },
    "ws-admin-stream-broadcast": {
        "files": [
            ("amplify/backend/websocket-stream-broadcast-lambda.py", "websocket-stream-broadcast-lambda.py"),
        ],
        "handler": "websocket-stream-broadcast-lambda.lambda_handler"
    },
    "CvUploadLambda": {
        "files": [
            ("amplify/backend/cv-upload-lambda.py", "cv-upload-lambda.py"),
        ],
        "handler": "cv-upload-lambda.lambda_handler"
    },
    "FeaturedPercentLambda": {
        "files": [
            ("amplify/backend/featured-percent-lambda.py", "featured-percent-lambda.py"),
        ],
        "handler": "featured-percent-lambda.lambda_handler"
    },
    "UserRoleLambda": {
        "files": [
            ("amplify/backend/user-role-lambda.py", "user-role-lambda.py"),
        ],
        "handler": "user-role-lambda.lambda_handler"
    },
    "ekyc-handler": {
        "files": [
            ("amplify/backend/ekyc-handler.py", "ekyc-handler.py"),
        ],
        "handler": "ekyc-handler.lambda_handler"
    },
    "BannerManagementLambda": {
        "files": [
            ("amplify/backend/banner-lambda.py", "banner-lambda.py"),
        ],
        "handler": "banner-lambda.handler"
    },
    "PreSignupLinkAccountsLambda": {
        "files": [
            ("infra/lambda/pre-signup-link-accounts/index.js", "index.js"),
        ],
        "handler": "index.handler"
    },
    "PostConfirmationLambda": {
        "files": [
            ("amplify/backend/postConfirmation/index.js", "index.js"),
        ],
        "handler": "index.handler"
    }
}

print("[INFO] Deploying all 24 Lambdas with full helper files and handlers...")

for func_name, spec in lambda_specs.items():
    # Build Zip in memory
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for rel_src, arc_name in spec["files"]:
            full_src = os.path.join(os.getcwd(), rel_src.replace("/", os.sep))
            if os.path.exists(full_src):
                zf.write(full_src, arcname=arc_name)

    zip_bytes = buf.getvalue()
    handler_str = spec["handler"]

    # Wait for function to be Active/Updated before making changes
    try:
        waiter.wait(FunctionName=func_name)
    except Exception:
        time.sleep(2)

    # 1. Update Handler Config
    try:
        client.update_function_configuration(
            FunctionName=func_name,
            Handler=handler_str
        )
    except Exception as e:
        print(f"  [ERR] {func_name} config update failed: {e}")

    # Wait for config update to finish
    try:
        waiter.wait(FunctionName=func_name)
    except Exception:
        time.sleep(2)

    # 2. Update Code
    try:
        client.update_function_code(
            FunctionName=func_name,
            ZipFile=zip_bytes
        )
        print(f"  [OK] {func_name} updated successfully! (handler: {handler_str}, size: {len(zip_bytes)} bytes)")
    except Exception as e:
        print(f"  [ERR] {func_name} code update failed: {e}")

print("\n[DONE] All 24 Lambdas deployed and updated successfully!")
