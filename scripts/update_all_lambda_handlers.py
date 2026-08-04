import boto3
import os
import zipfile

region = "ap-southeast-1"
client = boto3.client("lambda", region_name=region)

handlers = {
    "ApplicationLambda": "application-lambda.lambda_handler",
    "ApplicantsReportLambda": "applicants-report-lambda.lambda_handler",
    "CandidateProfileLambda": "candidate-profile-lambda.lambda_handler",
    "EmployerProfileLambda": "api-employer-profile.handler",
    "CheckEmailLambda": "check-email-lambda.handler",
    "CvAiLambda": "handler.lambda_handler",
    "DiditEkycLambda": "didit-ekyc-handler.lambda_handler",
    "ExperienceLambda": "experience-lambda.lambda_handler",
    "JobPostLambda": "job-post-lambda.lambda_handler",
    "NotificationsLambda": "notifications-lambda.lambda_handler",
    "PackageSubscriptionsLambda": "package-subscriptions-lambda.lambda_handler",
    "PaymentsLambda": "payments-lambda.handler",
    "QuickJobLambda": "quick-job-lambda.lambda_handler",
    "TranslateLambda": "translate-lambda.lambda_handler",
    "ws-admin-connect": "websocket-connect-lambda.lambda_handler",
    "ws-admin-disconnect": "websocket-disconnect-lambda.lambda_handler",
    "ws-admin-stream-broadcast": "websocket-stream-broadcast-lambda.lambda_handler",
    "CvUploadLambda": "cv-upload-lambda.lambda_handler",
    "FeaturedPercentLambda": "featured-percent-lambda.lambda_handler",
    "UserRoleLambda": "user-role-lambda.lambda_handler",
    "ekyc-handler": "ekyc-handler.lambda_handler",
    "BannerManagementLambda": "banner-lambda.handler",
}

print("[INFO] Updating handlers for all Lambda functions...")
for func_name, handler_str in handlers.items():
    try:
        client.update_function_configuration(
            FunctionName=func_name,
            Handler=handler_str
        )
        print(f"  [OK] {func_name} -> {handler_str}")
    except Exception as e:
        print(f"  [ERR] {func_name} error: {e}")

print("\n[INFO] Building and deploying EmployerProfileLambda code zip...")
emp_dir = os.path.join(os.getcwd(), "amplify", "backend", "lambda-deployment")
zip_path = os.path.join(os.getcwd(), "terraform", "build", "employer-profile-lambda.zip")
os.makedirs(os.path.dirname(zip_path), exist_ok=True)

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for filename in ["api-employer-profile.cjs", "employer-profile.cjs"]:
        filepath = os.path.join(emp_dir, filename)
        if os.path.exists(filepath):
            zf.write(filepath, arcname=filename)
            print(f"  Added {filename} to zip")

with open(zip_path, "rb") as f:
    zip_bytes = f.read()

try:
    client.update_function_code(
        FunctionName="EmployerProfileLambda",
        ZipFile=zip_bytes
    )
    print("  [OK] EmployerProfileLambda code updated successfully!")
except Exception as e:
    print(f"  [ERR] EmployerProfileLambda code update error: {e}")

print("\n[DONE] All Lambdas updated successfully!")
