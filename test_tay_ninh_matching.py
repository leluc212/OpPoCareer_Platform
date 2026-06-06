import boto3
import json

lambda_client = boto3.client('lambda', region_name='ap-southeast-1')
candidate_id = "296aa58c-30a1-70cc-44ed-b829e33a8245"

# 1. Step 1: Deactivate profile search status
deactivate_event = {
    "httpMethod": "PUT",
    "path": f"/profile/{candidate_id}",
    "pathParameters": {
        "userId": candidate_id
    },
    "body": json.dumps({
        "isActive": False
    })
}

print("1. Deactivating candidate status...")
try:
    resp = lambda_client.invoke(
        FunctionName="candidate-profile-handler",
        Payload=json.dumps(deactivate_event)
    )
    result = json.loads(resp['Payload'].read().decode('utf-8'))
    print("Deactivate Status Code:", result.get('statusCode'))
except Exception as e:
    print(f"Deactivation error: {e}")

# 2. Step 2: Activate profile search status with Trang Bang, Tay Ninh coordinates (matching Katinat job)
activate_event = {
    "httpMethod": "PUT",
    "path": f"/profile/{candidate_id}",
    "pathParameters": {
        "userId": candidate_id
    },
    "body": json.dumps({
        "isActive": True,
        "latitude": 11.032493,
        "longitude": 106.335071
    })
}

print("\n2. Activating candidate status with Trang Bang, Tay Ninh coordinates...")
try:
    resp = lambda_client.invoke(
        FunctionName="candidate-profile-handler",
        Payload=json.dumps(activate_event)
    )
    result = json.loads(resp['Payload'].read().decode('utf-8'))
    print("Activate Status Code:", result.get('statusCode'))
    body_data = json.loads(result.get('body', '{}'))
    print("Activate Response Body matches expected triggers.")
except Exception as e:
    print(f"Activation error: {e}")
