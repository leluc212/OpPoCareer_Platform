"""
backfill-ekyc-cccd.py
Backfill số CCCD cho các user đã xác minh eKYC (kycCompleted=True) nhưng chưa có field cccd.

Cách chạy:
  python backfill-ekyc-cccd.py

Yêu cầu:
  - AWS credentials đã cấu hình (aws configure)
  - pip install boto3 (nếu chưa có)
  - Quyền: DynamoDB read/write CandidateProfiles, Secrets Manager read prod/didit/api-key
"""

import json
import boto3
import urllib.request
import urllib.error

REGION = 'ap-southeast-1'
TABLE_NAME = 'CandidateProfiles'
DIDIT_SECRET_NAME = 'prod/didit/api-key'
DIDIT_API_BASE = 'https://verification.didit.me'

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)
secrets_client = boto3.client('secretsmanager', region_name=REGION)


def get_api_key():
    result = secrets_client.get_secret_value(SecretId=DIDIT_SECRET_NAME)
    secret = json.loads(result['SecretString'])
    return secret['apiKey']


def get_session_decision(api_key: str, session_id: str) -> dict:
    """Gọi Didit GET /v3/session/{sessionId}/decision/ để lấy kết quả OCR."""
    url = f'{DIDIT_API_BASE}/v3/session/{session_id}/decision/'
    headers = {
        'accept': 'application/json',
        'x-api-key': api_key,
    }
    req = urllib.request.Request(url, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if hasattr(e, 'read') else ''
        print(f'  [ERROR] HTTP {e.code} for session {session_id}: {err_body[:200]}')
        return {}
    except Exception as e:
        print(f'  [ERROR] {e}')
        return {}


def main():
    print('=== Backfill eKYC CCCD ===')
    print(f'Table: {TABLE_NAME}, Region: {REGION}')
    print()

    # Lấy API Key
    api_key = get_api_key()
    print('API Key loaded from Secrets Manager')
    print()

    # Scan tất cả user kycCompleted=True mà chưa có cccd
    print('Scanning for verified users without CCCD...')
    users_to_backfill = []

    scan_kwargs = {}
    while True:
        result = table.scan(**scan_kwargs)
        for item in result.get('Items', []):
            if item.get('kycCompleted') and not item.get('cccd'):
                users_to_backfill.append({
                    'userId': item['userId'],
                    'diditSessionId': item.get('diditSessionId', ''),
                    'provider': item.get('provider', 'VNPT'),
                    'fullName': item.get('fullName', ''),
                })
        if 'LastEvaluatedKey' not in result:
            break
        scan_kwargs['ExclusiveStartKey'] = result['LastEvaluatedKey']

    print(f'Found {len(users_to_backfill)} user(s) to backfill')
    print()

    if not users_to_backfill:
        print('Nothing to do!')
        return

    success_count = 0
    skip_count = 0
    fail_count = 0

    for user in users_to_backfill:
        user_id = user['userId']
        session_id = user['diditSessionId']
        provider = user['provider']

        print(f'[{user_id}] name={user["fullName"]} provider={provider} session={session_id[:20] if session_id else "N/A"}...')

        # Chỉ xử lý user dùng Didit (có session_id)
        if not session_id or provider != 'DIDIT':
            print(f'  SKIP: provider={provider}, no Didit session')
            skip_count += 1
            continue

        # Gọi Didit API lấy decision
        decision = get_session_decision(api_key, session_id)
        if not decision:
            print(f'  FAIL: Empty decision response')
            fail_count += 1
            continue

        # Extract CCCD từ id_verifications
        id_verifications = decision.get('id_verifications') or []
        if not id_verifications:
            print(f'  FAIL: No id_verifications in decision')
            fail_count += 1
            continue

        id_doc = id_verifications[0]
        cccd_number = id_doc.get('document_number') or id_doc.get('personal_number') or ''
        date_of_birth = id_doc.get('date_of_birth') or ''
        full_name_from_doc = id_doc.get('full_name') or ''

        if not cccd_number:
            print(f'  FAIL: No document_number in id_verifications[0]')
            fail_count += 1
            continue

        # Update DynamoDB
        update_parts = ['cccd = :cccd']
        expr_values = {':cccd': cccd_number}

        if date_of_birth:
            update_parts.append('dateOfBirth = :dob')
            expr_values[':dob'] = date_of_birth
        if full_name_from_doc:
            update_parts.append('kycFullName = :fn')
            expr_values[':fn'] = full_name_from_doc

        try:
            table.update_item(
                Key={'userId': user_id},
                UpdateExpression='SET ' + ', '.join(update_parts),
                ExpressionAttributeValues=expr_values,
            )
            print(f'  OK: cccd={cccd_number}, dob={date_of_birth}, name={full_name_from_doc}')
            success_count += 1
        except Exception as e:
            print(f'  FAIL: DynamoDB error: {e}')
            fail_count += 1

    print()
    print(f'=== Done: {success_count} success, {skip_count} skipped, {fail_count} failed ===')


if __name__ == '__main__':
    main()
