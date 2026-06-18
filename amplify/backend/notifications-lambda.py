import json
import boto3
import os
from datetime import datetime, timezone
from decimal import Decimal
import uuid

# Force UTC timezone
os.environ['TZ'] = 'UTC'

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'Notifications')
table = dynamodb.Table(table_name)


def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json; charset=utf-8'
    }

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, set):
        return list(obj)
    raise TypeError

def lambda_handler(event, context):
    print('Event:', json.dumps(event))
    
    http_method = event.get('httpMethod', event.get('requestContext', {}).get('http', {}).get('method', ''))
    path = event.get('path', event.get('rawPath', ''))
    
    # CORS headers
    headers = get_cors_headers()
    
    try:
        # Handle OPTIONS for CORS
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'OK'})
            }
        
        # GET /notifications - Get all notifications or filter by query params
        if http_method == 'GET' and path == '/notifications':
            query_params = event.get('queryStringParameters') or {}
            
            # If recipientId and recipientRole are provided, filter by them
            if 'recipientId' in query_params and 'recipientRole' in query_params:
                recipient_id = query_params['recipientId']
                recipient_role = query_params['recipientRole']
                
                # Scan and filter (or use GSI if available)
                response = table.scan()
                items = response.get('Items', [])
                
                # Filter by recipientId and recipientRole
                items = [
                    item for item in items 
                    if item.get('recipientId') == recipient_id 
                    and item.get('recipientRole') == recipient_role
                    and not item.get('deleted', False)
                ]
            else:
                # Get all notifications
                response = table.scan()
                items = response.get('Items', [])
            
            # Sort by createdAt descending
            items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(items, default=decimal_default, ensure_ascii=False)
            }
        
        # GET /notifications/user/{userId} - Get notifications for a specific user
        if http_method == 'GET' and '/notifications/user/' in path:
            user_id = path.split('/notifications/user/')[-1].split('?')[0]
            
            # Get query parameters
            query_params = event.get('queryStringParameters') or {}
            role = query_params.get('role', 'employer')
            
            response = table.query(
                IndexName='RecipientIndex',
                KeyConditionExpression='recipientId = :uid AND recipientRole = :role',
                ExpressionAttributeValues={
                    ':uid': user_id,
                    ':role': role
                }
            )
            
            items = response.get('Items', [])
            
            # Filter out deleted notifications
            items = [item for item in items if not item.get('deleted', False)]
            
            # Sort by createdAt descending
            items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(items, default=decimal_default, ensure_ascii=False)
            }
        
        # GET /notifications/unread/{userId} - Get unread count
        if http_method == 'GET' and '/notifications/unread/' in path:
            user_id = path.split('/notifications/unread/')[-1].split('?')[0]
            
            # Get query parameters
            query_params = event.get('queryStringParameters') or {}
            role = query_params.get('role', 'employer')
            
            response = table.query(
                IndexName='RecipientIndex',
                KeyConditionExpression='recipientId = :uid AND recipientRole = :role',
                ExpressionAttributeValues={
                    ':uid': user_id,
                    ':role': role
                }
            )
            
            items = response.get('Items', [])
            
            # Count unread and not deleted
            unread_count = sum(1 for item in items if not item.get('read', False) and not item.get('deleted', False))
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'count': unread_count}, ensure_ascii=False)
            }
        
        # GET /notifications/{notificationId} - Get single notification
        if http_method == 'GET' and path.startswith('/notifications/') and path.count('/') == 2:
            notification_id = path.split('/notifications/')[-1]
            
            response = table.get_item(Key={'notificationId': notification_id})
            item = response.get('Item')
            
            if not item:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Notification not found'}, ensure_ascii=False)
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(item, default=decimal_default, ensure_ascii=False)
            }
        
        # POST /notifications - Create new notification
        if http_method == 'POST' and path == '/notifications':
            try:
                # Parse body with UTF-8 encoding
                body_str = event.get('body', '{}')
                print(f"📥 Received body (raw): {body_str}")
                
                if isinstance(body_str, str):
                    body = json.loads(body_str)
                else:
                    body = json.loads(body_str.decode('utf-8'))
                
                print(f"📦 Parsed body: {json.dumps(body, ensure_ascii=False)}")
                
                # Validate required fields
                required_fields = ['type', 'title', 'message', 'recipientId', 'recipientRole']
                missing_fields = [field for field in required_fields if not body.get(field)]
                if missing_fields:
                    error_msg = f"Missing required fields: {', '.join(missing_fields)}"
                    print(f"❌ Validation error: {error_msg}")
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({
                            'success': False,
                            'error': error_msg
                        }, ensure_ascii=False)
                    }
                
                notification_id = f"NOTIF-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"
                
                # Get current time in UTC with explicit timezone
                current_time_utc = datetime.now(timezone.utc)
                current_time_iso = current_time_utc.isoformat()
                
                print(f"⏰ TIMESTAMP DEBUG:")
                print(f"   Server time (UTC): {current_time_utc}")
                print(f"   Server time (ISO): {current_time_iso}")
                print(f"   Timezone: {current_time_utc.tzinfo}")
                
                notification = {
                    'notificationId': notification_id,
                    'type': body.get('type'),
                    'title': body.get('title'),
                    'titleEn': body.get('titleEn', body.get('title')),
                    'message': body.get('message'),
                    'messageEn': body.get('messageEn', body.get('message')),
                    'recipientId': body.get('recipientId'),
                    'recipientRole': body.get('recipientRole'),
                    'senderId': body.get('senderId', 'system'),
                    'senderName': body.get('senderName', 'System'),
                    'data': body.get('data', {}),
                    'read': False,
                    'deleted': False,
                    'createdAt': current_time_iso,
                    'updatedAt': current_time_iso,
                    'icon': body.get('icon', 'bell'),
                    'color': body.get('color', '#3b82f6'),
                    'actionUrl': body.get('actionUrl', ''),
                    'actionText': body.get('actionText', ''),
                    'actionTextEn': body.get('actionTextEn', '')
                }
                
                # Log notification with UTF-8
                print(f"💾 Saving notification to DynamoDB:")
                print(f"   Table: {table_name}")
                print(f"   NotificationId: {notification_id}")
                print(f"   RecipientId: {notification['recipientId']}")
                print(f"   RecipientRole: {notification['recipientRole']}")
                print(f"   Title: {notification['title']}")
                print(f"   Message: {notification['message']}")
                print(f"   Full data: {json.dumps(notification, ensure_ascii=False, indent=2)}")
                
                # Save to DynamoDB
                put_response = table.put_item(Item=notification)
                print(f"✅ DynamoDB put_item response: {put_response}")
                
                # Verify it was saved by reading it back
                verify_response = table.get_item(Key={'notificationId': notification_id})
                if 'Item' in verify_response:
                    print(f"✅ Verification successful - notification exists in DynamoDB")
                    print(f"   Verified data: {json.dumps(verify_response['Item'], ensure_ascii=False, default=decimal_default)}")
                else:
                    print(f"⚠️ Warning: Could not verify notification in DynamoDB")
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'message': 'Notification created successfully',
                        'data': notification
                    }, default=decimal_default, ensure_ascii=False)
                }
            except Exception as create_error:
                print(f"❌ Error creating notification: {str(create_error)}")
                import traceback
                traceback.print_exc()
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps({
                        'success': False,
                        'error': 'Failed to create notification',
                        'details': str(create_error)
                    }, ensure_ascii=False)
                }
        
        # PUT /notifications/{notificationId} - Update notification (mark as read/deleted)
        if http_method == 'PUT' and path.startswith('/notifications/') and path.count('/') == 2:
            notification_id = path.split('/notifications/')[-1]
            body = json.loads(event.get('body', '{}'))
            
            # Build update expression
            update_expr = 'SET updatedAt = :updated'
            expr_values = {':updated': datetime.now().isoformat()}
            
            if 'read' in body:
                update_expr += ', #r = :read'
                expr_values[':read'] = body['read']
            
            if 'deleted' in body:
                update_expr += ', deleted = :deleted'
                expr_values[':deleted'] = body['deleted']
            
            expr_names = {'#r': 'read'} if 'read' in body else None
            
            update_params = {
                'Key': {'notificationId': notification_id},
                'UpdateExpression': update_expr,
                'ExpressionAttributeValues': expr_values,
                'ReturnValues': 'ALL_NEW'
            }
            
            if expr_names:
                update_params['ExpressionAttributeNames'] = expr_names
            
            response = table.update_item(**update_params)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'message': 'Notification updated successfully',
                    'data': response['Attributes']
                }, default=decimal_default, ensure_ascii=False)
            }
        
        # PUT /notifications/mark-all-read/{userId} - Mark all as read
        if http_method == 'PUT' and '/notifications/mark-all-read/' in path:
            user_id = path.split('/notifications/mark-all-read/')[-1].split('?')[0]
            
            # Get query parameters
            query_params = event.get('queryStringParameters') or {}
            role = query_params.get('role', 'employer')
            
            # Get all notifications for user
            response = table.query(
                IndexName='RecipientIndex',
                KeyConditionExpression='recipientId = :uid AND recipientRole = :role',
                ExpressionAttributeValues={
                    ':uid': user_id,
                    ':role': role
                }
            )
            
            items = response.get('Items', [])
            
            # Update each unread notification
            updated_count = 0
            for item in items:
                if not item.get('read', False):
                    table.update_item(
                        Key={'notificationId': item['notificationId']},
                        UpdateExpression='SET #r = :read, updatedAt = :updated',
                        ExpressionAttributeNames={'#r': 'read'},
                        ExpressionAttributeValues={
                            ':read': True,
                            ':updated': datetime.now().isoformat()
                        }
                    )
                    updated_count += 1
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'message': f'Marked {updated_count} notifications as read',
                    'count': updated_count
                }, ensure_ascii=False)
            }
        
        # DELETE /notifications/{notificationId} - Delete notification
        if http_method == 'DELETE' and path.startswith('/notifications/') and path.count('/') == 2:
            notification_id = path.split('/notifications/')[-1]
            
            # Soft delete
            table.update_item(
                Key={'notificationId': notification_id},
                UpdateExpression='SET deleted = :deleted, updatedAt = :updated',
                ExpressionAttributeValues={
                    ':deleted': True,
                    ':updated': datetime.now().isoformat()
                }
            )
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'message': 'Notification deleted successfully'
                }, ensure_ascii=False)
            }
        
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Route not found'}, ensure_ascii=False)
        }
        
    except Exception as e:
        print('Error:', str(e))
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            }, ensure_ascii=False)
        }
