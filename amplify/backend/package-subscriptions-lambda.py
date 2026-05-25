import json
import boto3
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'PackageSubscriptions')
table = dynamodb.Table(table_name)
notifications_table_name = os.environ.get('NOTIFICATIONS_TABLE', 'Notifications')
notifications_table = dynamodb.Table(notifications_table_name)

VN_TZ = timezone(timedelta(hours=7))

# Helper function to convert Decimal to int/float for JSON serialization
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def lambda_handler(event, context):
    """
    Main Lambda handler for PackageSubscriptions API
    """
    print(f"Event: {json.dumps(event)}")
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Max-Age': '3600',
        'Content-Type': 'application/json; charset=utf-8'
    }

    # Scheduled EventBridge trigger
    if event.get('source') == 'aws.events' or event.get('detail-type') == 'Scheduled Event':
        try:
            expired_count = process_expired_subscriptions()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'expiredCount': expired_count
                })
            }
        except Exception as e:
            print(f"Error processing expired subscriptions: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': f'Error processing expired subscriptions: {str(e)}'
                })
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
        # Route requests
        if http_method == 'POST' and path == '/subscriptions':
            return create_subscription(body, headers)
        
        elif http_method == 'GET' and path == '/subscriptions':
            return get_all_subscriptions(headers)
        
        elif http_method == 'GET' and '/subscriptions/employer/' in path:
            employer_id = path_parameters.get('employerId')
            return get_employer_subscriptions(employer_id, headers)
        
        elif http_method == 'GET' and '/subscriptions/' in path:
            subscription_id = path_parameters.get('subscriptionId')
            return get_subscription(subscription_id, headers)
        
        elif http_method == 'PUT' and '/subscriptions/' in path:
            subscription_id = path_parameters.get('subscriptionId')
            return update_subscription(body, subscription_id, headers)
        
        elif http_method == 'DELETE' and '/subscriptions/' in path:
            subscription_id = path_parameters.get('subscriptionId')
            return delete_subscription(subscription_id, headers)
        
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

def generate_subscription_id():
    """Generate unique subscription ID"""
    from datetime import datetime
    import random
    import string
    
    date_str = datetime.now().strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"SUB-{date_str}-{random_str}"

def get_vn_now():
    return datetime.now(VN_TZ)

def calculate_expiry_datetime(duration, start_dt):
    """Calculate expiry datetime based on duration"""
    if '24h' in duration or '24 h' in duration:
        expiry = start_dt + timedelta(hours=24)
    elif '7' in duration:
        expiry = start_dt + timedelta(days=7)
    elif '30' in duration or 'tháng' in duration or 'month' in duration:
        expiry = start_dt + timedelta(days=30)
    else:
        # Default to 7 days
        expiry = start_dt + timedelta(days=7)

    return expiry

def format_vn_date(dt):
    return dt.strftime('%Y-%m-%d')

def format_vn_datetime(dt):
    vn_dt = dt.astimezone(VN_TZ) if dt.tzinfo else dt.replace(tzinfo=VN_TZ)
    return vn_dt.strftime('%H:%M %d/%m/%Y')

def format_expiry_time(subscription):
    expiry_dt = parse_expiry_datetime(subscription)
    if expiry_dt:
        return format_vn_datetime(expiry_dt)

    return subscription.get('expiryDateTime') or subscription.get('expiryDate', '')

def parse_expiry_datetime(item):
    expiry_dt = item.get('expiryDateTime')
    if expiry_dt:
        try:
            return datetime.fromisoformat(expiry_dt)
        except ValueError:
            return None

    expiry_date = item.get('expiryDate')
    if not expiry_date:
        return None

    try:
        base_date = datetime.strptime(expiry_date, '%Y-%m-%d')
        return base_date.replace(hour=23, minute=59, second=0, microsecond=0, tzinfo=VN_TZ)
    except ValueError:
        return None

def create_notification(notification):
    notifications_table.put_item(Item=notification)

def build_expiry_notification(recipient_id, recipient_role, subscription, now_dt):
    package_name = subscription.get('packageName', 'Gói dịch vụ')
    duration = subscription.get('duration', '')
    company_name = subscription.get('companyName', '')
    expiry_time = format_expiry_time(subscription)

    if recipient_role == 'admin':
        title = 'Gói dịch vụ đã hết hạn'
        message = f"{company_name} - {package_name} ({duration}) đã hết hạn lúc {expiry_time}."
        action_url = '/admin/packages'
        action_text = 'Xem gói'
    else:
        title = 'Gói dịch vụ đã hết hạn'
        message = f"Gói {package_name} ({duration}) đã hết hạn lúc {expiry_time}. Vui lòng gia hạn nếu cần."
        action_url = '/employer/packages'
        action_text = 'Xem gói'

    notification_id = f"NOTIF-{now_dt.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"

    return {
        'notificationId': notification_id,
        'type': 'package_expired',
        'title': title,
        'titleEn': title,
        'message': message,
        'messageEn': message,
        'recipientId': recipient_id,
        'recipientRole': recipient_role,
        'senderId': 'system',
        'senderName': 'System',
        'data': {
            'subscriptionId': subscription.get('subscriptionId'),
            'packageName': package_name,
            'duration': duration,
            'expiryDateTime': subscription.get('expiryDateTime'),
            'expiryDate': subscription.get('expiryDate')
        },
        'read': False,
        'deleted': False,
        'createdAt': now_dt.isoformat(),
        'updatedAt': now_dt.isoformat(),
        'icon': 'bell',
        'color': '#ef4444',
        'actionUrl': action_url,
        'actionText': action_text,
        'actionTextEn': action_text
    }

def build_pre_expiry_notification(recipient_id, recipient_role, subscription, now_dt, expiry_dt):
    package_name = subscription.get('packageName', 'Gói dịch vụ')
    duration = subscription.get('duration', '')
    company_name = subscription.get('companyName', '')
    expiry_time = format_vn_datetime(expiry_dt)

    title = 'Gói dịch vụ sắp hết hạn'

    if recipient_role == 'admin':
        message = (
            f"{company_name} - {package_name} ({duration}) sẽ hết hạn lúc {expiry_time}."
        )
        action_url = '/admin/packages'
        action_text = 'Xem gói'
        action_text_en = 'View package'
    else:
        message = (
            f"Gói {package_name} ({duration}) sẽ hết hạn lúc {expiry_time}. "
            "Vui lòng gia hạn để tránh gián đoạn."
        )
        action_url = '/employer/packages'
        action_text = 'Gia hạn ngay'
        action_text_en = 'Renew now'

    notification_id = f"NOTIF-{now_dt.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"

    return {
        'notificationId': notification_id,
        'type': 'package_expiring',
        'title': title,
        'titleEn': title,
        'message': message,
        'messageEn': message,
        'recipientId': recipient_id,
        'recipientRole': recipient_role,
        'senderId': 'system',
        'senderName': 'System',
        'data': {
            'subscriptionId': subscription.get('subscriptionId'),
            'packageName': package_name,
            'duration': duration,
            'expiryDateTime': subscription.get('expiryDateTime'),
            'expiryDate': subscription.get('expiryDate')
        },
        'read': False,
        'deleted': False,
        'createdAt': now_dt.isoformat(),
        'updatedAt': now_dt.isoformat(),
        'icon': 'bell',
        'color': '#f59e0b',
        'actionUrl': action_url,
        'actionText': action_text,
        'actionTextEn': action_text_en
    }

def process_expired_subscriptions():
    now_dt = get_vn_now()
    expired_count = 0
    pre_expiry_hours = 3

    statuses = ['active', 'locked']
    subscriptions = []

    for status in statuses:
        try:
            response = table.query(
                IndexName='StatusIndex',
                KeyConditionExpression=Key('status').eq(status)
            )
            subscriptions.extend(response.get('Items', []))
        except ClientError as error:
            if error.response.get('Error', {}).get('Code') != 'ValidationException':
                raise

            response = table.scan(
                FilterExpression=Attr('status').eq(status)
            )
            subscriptions.extend(response.get('Items', []))

    for subscription in subscriptions:
        expiry_dt = parse_expiry_datetime(subscription)
        if not expiry_dt:
            continue

        if expiry_dt <= now_dt:
            table.update_item(
                Key={'subscriptionId': subscription['subscriptionId']},
                UpdateExpression="SET #status = :status, updatedAt = :updatedAt, expiredAt = :expiredAt",
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'expired',
                    ':updatedAt': now_dt.isoformat(),
                    ':expiredAt': now_dt.isoformat()
                }
            )

            expired_count += 1

            admin_notification = build_expiry_notification('admin', 'admin', subscription, now_dt)
            create_notification(admin_notification)

            employer_id = subscription.get('employerId')
            if employer_id:
                employer_notification = build_expiry_notification(employer_id, 'employer', subscription, now_dt)
                create_notification(employer_notification)
            continue

        pre_expiry_at = expiry_dt - timedelta(hours=pre_expiry_hours)
        if pre_expiry_at <= now_dt < expiry_dt and not subscription.get('preExpiryNotifiedAt'):
            employer_id = subscription.get('employerId')
            admin_notification = build_pre_expiry_notification('admin', 'admin', subscription, now_dt, expiry_dt)
            try:
                create_notification(admin_notification)
                if employer_id:
                    employer_notification = build_pre_expiry_notification(
                        employer_id,
                        'employer',
                        subscription,
                        now_dt,
                        expiry_dt
                    )
                    create_notification(employer_notification)

                table.update_item(
                    Key={'subscriptionId': subscription['subscriptionId']},
                    UpdateExpression='SET preExpiryNotifiedAt = :notifiedAt, updatedAt = :updatedAt',
                    ExpressionAttributeValues={
                        ':notifiedAt': now_dt.isoformat(),
                        ':updatedAt': now_dt.isoformat()
                    },
                    ConditionExpression='attribute_not_exists(preExpiryNotifiedAt)'
                )
            except ClientError as error:
                if error.response.get('Error', {}).get('Code') != 'ConditionalCheckFailedException':
                    raise

    return expired_count

def get_package_price(package_name, duration):
    """Get package price based on name and duration"""
    prices = {
        'Quick Boost': {'24h': 29000, '7 ngày': 145000, '7 days': 145000},
        'Hot Search': {'24h': 49000, '7 ngày': 245000, '7 days': 245000},
        'Spotlight Banner': {'24h': 99000, '7 ngày': 495000, '7 days': 495000},
        'Top Spotlight': {'24h': 149000, '7 ngày': 745000, '7 days': 745000}
    }
    
    return prices.get(package_name, {}).get(duration, 0)

def create_subscription(body_str, headers):
    """Create new subscription request"""
    try:
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        
        print(f"Creating subscription with body: {json.dumps(body)}")
        
        # Validate required fields
        required_fields = ['employerId', 'companyName', 'packageName', 'duration']
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
        
        # Generate subscription ID
        subscription_id = generate_subscription_id()
        
        # Calculate price
        price = get_package_price(body['packageName'], body['duration'])
        
        now_dt = get_vn_now()
        expiry_dt = calculate_expiry_datetime(body['duration'], now_dt)
        expiry_date = format_vn_date(expiry_dt)
        
        # Create item
        item = {
            'subscriptionId': subscription_id,
            'employerId': body['employerId'],
            'companyName': body['companyName'],
            'packageName': body['packageName'],
            'duration': body['duration'],
            'price': Decimal(str(price)),
            'purchaseDate': format_vn_date(now_dt),
            'purchaseDateTime': now_dt.isoformat(),
            'expiryDate': expiry_date,
            'expiryDateTime': expiry_dt.isoformat(),
            'status': 'pending',  # pending, active, expired
            'approvalStatus': 'pending',  # pending, approved, rejected
            'createdAt': now_dt.isoformat(),
            'updatedAt': now_dt.isoformat()
        }
        
        # Put item in DynamoDB
        table.put_item(Item=item)
        
        print(f"✅ Subscription created: {subscription_id}")
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Subscription request created successfully',
                'data': item
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error creating subscription: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error creating subscription: {str(e)}'
            })
        }

def get_all_subscriptions(headers):
    """Get all subscriptions"""
    try:
        response = table.scan()
        items = response.get('Items', [])
        
        print(f"✅ Found {len(items)} subscriptions")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(items, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error getting subscriptions: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting subscriptions: {str(e)}'
            })
        }

def get_employer_subscriptions(employer_id, headers):
    """Get all subscriptions for an employer"""
    try:
        response = table.query(
            IndexName='EmployerIndex',
            KeyConditionExpression='employerId = :eid',
            ExpressionAttributeValues={
                ':eid': employer_id
            }
        )
        
        items = response.get('Items', [])
        print(f"✅ Found {len(items)} subscriptions for employer {employer_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': items
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error getting employer subscriptions: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting subscriptions: {str(e)}'
            })
        }

def get_subscription(subscription_id, headers):
    """Get single subscription by ID"""
    try:
        response = table.get_item(Key={'subscriptionId': subscription_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Subscription not found'
                })
            }
        
        item = response['Item']
        print(f"✅ Subscription found: {subscription_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': item
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error getting subscription: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting subscription: {str(e)}'
            })
        }

def update_subscription(body_str, subscription_id, headers):
    """Update subscription (for admin approval)"""
    try:
        # First, get the existing subscription
        response = table.get_item(Key={'subscriptionId': subscription_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Subscription not found'
                })
            }
        
        # Parse update data
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        
        now_dt = get_vn_now()
        # Build update expression
        update_expr = "SET updatedAt = :updatedAt"
        expr_values = {':updatedAt': now_dt.isoformat()}
        expr_names = {}
        
        # Add fields to update
        updatable_fields = ['status', 'approvalStatus', 'purchaseDate', 'expiryDate', 'purchaseDateTime', 'expiryDateTime']
        
        for field in updatable_fields:
            if field in body:
                value = body[field]
                
                if field == 'status':
                    update_expr += f", #status = :status"
                    expr_names['#status'] = 'status'
                    expr_values[':status'] = value
                else:
                    update_expr += f", {field} = :{field}"
                    expr_values[f':{field}'] = value
        
        # If approving, set dates
        if body.get('approvalStatus') == 'approved' or body.get('status') == 'active':
            existing_item = response['Item']
            duration = existing_item.get('duration', '7 ngày')
            expiry_dt = calculate_expiry_datetime(duration, now_dt)

            if 'purchaseDate' not in body:
                update_expr += ", purchaseDate = :purchaseDate"
                expr_values[':purchaseDate'] = format_vn_date(now_dt)

            if 'purchaseDateTime' not in body:
                update_expr += ", purchaseDateTime = :purchaseDateTime"
                expr_values[':purchaseDateTime'] = now_dt.isoformat()

            if 'expiryDate' not in body:
                update_expr += ", expiryDate = :expiryDate"
                expr_values[':expiryDate'] = format_vn_date(expiry_dt)

            if 'expiryDateTime' not in body:
                update_expr += ", expiryDateTime = :expiryDateTime"
                expr_values[':expiryDateTime'] = expiry_dt.isoformat()
        
        # Update item
        update_params = {
            'Key': {'subscriptionId': subscription_id},
            'UpdateExpression': update_expr,
            'ExpressionAttributeValues': expr_values,
            'ReturnValues': 'ALL_NEW'
        }
        
        if expr_names:
            update_params['ExpressionAttributeNames'] = expr_names
        
        response = table.update_item(**update_params)
        
        updated_item = response['Attributes']
        print(f"✅ Subscription updated: {subscription_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Subscription updated successfully',
                'data': updated_item
            }, default=decimal_default)
        }
    
    except Exception as e:
        print(f"Error updating subscription: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error updating subscription: {str(e)}'
            })
        }

def delete_subscription(subscription_id, headers):
    """Delete subscription"""
    try:
        table.delete_item(Key={'subscriptionId': subscription_id})
        
        print(f"✅ Subscription deleted: {subscription_id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Subscription deleted successfully'
            })
        }
    
    except Exception as e:
        print(f"Error deleting subscription: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error deleting subscription: {str(e)}'
            })
        }
