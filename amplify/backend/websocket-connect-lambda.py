"""
Lambda handler cho WebSocket $connect route.
Lưu connectionId vào bảng AdminWebSocketConnections (DynamoDB).
Chỉ cho phép kết nối nếu user có role admin (kiểm tra qua Cognito groups hoặc query param).

Trigger: API Gateway WebSocket $connect
"""

import json
import boto3
import os
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')
connections_table = dynamodb.Table(os.environ.get('CONNECTIONS_TABLE', 'AdminWebSocketConnections'))
cognito = boto3.client('cognito-idp')
USER_POOL_ID = os.environ.get('USER_POOL_ID', 'ap-southeast-1_LUa2Zfjtv')

def lambda_handler(event, context):
    connection_id = event['requestContext']['connectionId']
    
    # Lấy thông tin user từ requestContext (Cognito authorizer)
    request_context = event.get('requestContext', {})
    authorizer = request_context.get('authorizer', {})
    
    # Kiểm tra Cognito groups — admin phải có group 'admin' hoặc 'admins'
    claims = authorizer.get('claims', {})
    cognito_groups = claims.get('cognito:groups', '') or authorizer.get('cognito:groups', '')
    user_sub = claims.get('sub', '') or authorizer.get('principalId', '')
    
    # Nếu không có authorizer info, kiểm tra query string (fallback khi dùng token thủ công)
    query_params = event.get('queryStringParameters') or {}
    access_token = query_params.get('access_token') or query_params.get('accessToken')

    # Validate the Cognito access token server-side. A role query parameter is
    # never accepted as proof of administrator access.
    is_admin = False
    cognito_username = None
    if access_token:
        try:
            user = cognito.get_user(AccessToken=access_token)
            cognito_username = user.get('Username')
            groups = cognito.admin_list_groups_for_user(
                UserPoolId=USER_POOL_ID,
                Username=cognito_username,
            ).get('Groups', [])
            is_admin = any(group.get('GroupName') == 'Admin' for group in groups)
        except Exception as exc:
            print(f'WebSocket Cognito validation failed: {exc}')

    # Also support a connection already authenticated by an API Gateway
    # authorizer, but never trust an unverified browser query parameter.
    if not is_admin:
        if isinstance(cognito_groups, str):
            cognito_groups = [g.strip() for g in cognito_groups.strip('[]').split(',') if g.strip()]
        is_admin = 'admin' in {str(group).lower() for group in (cognito_groups or [])}
    
    if not is_admin:
        print(f"⛔ Từ chối kết nối WebSocket: {connection_id} — không phải admin (groups: {cognito_groups})")
        return {'statusCode': 403, 'body': 'Forbidden: chỉ admin mới được kết nối'}
    
    now_iso = datetime.now(timezone.utc).isoformat()
    
    try:
        connections_table.put_item(Item={
            'connectionId': connection_id,
            'role': 'admin',
            'userId': user_sub or cognito_username or connection_id,
            'connectedAt': now_iso,
            # TTL 24 giờ để tự dọn dẹp các connection cũ
            'ttl': int(datetime.now(timezone.utc).timestamp()) + 86400
        })
        print(f"✅ Admin kết nối WebSocket: {connection_id} (userId={user_sub})")
        return {'statusCode': 200, 'body': 'Đã kết nối'}
    except Exception as e:
        print(f"❌ Lỗi lưu connectionId {connection_id}: {e}")
        return {'statusCode': 500, 'body': str(e)}
