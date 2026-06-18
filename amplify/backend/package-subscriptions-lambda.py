import json
import boto3
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid
import re
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from email_service import send_email

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'PackageSubscriptions')
table = dynamodb.Table(table_name)
catalog_table_name = os.environ.get('PACKAGE_CATALOG_TABLE', 'PackageCatalog')
catalog_table = dynamodb.Table(catalog_table_name)
notifications_table_name = os.environ.get('NOTIFICATIONS_TABLE', 'Notifications')
notifications_table = dynamodb.Table(notifications_table_name)
employer_profile_table_name = os.environ.get('EMPLOYER_PROFILE_TABLE', 'EmployerProfiles')
employer_profile_table = dynamodb.Table(employer_profile_table_name)
withdrawal_requests_table_name = os.environ.get('WITHDRAWAL_REQUESTS_TABLE', 'WithdrawalRequests')
withdrawal_requests_table = dynamodb.Table(withdrawal_requests_table_name)

VN_TZ = timezone(timedelta(hours=7))

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, set):
        return list(obj)
    raise TypeError

def float_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: float_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [float_to_decimal(x) for x in obj]
    return obj


def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Max-Age': '3600',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json; charset=utf-8'
    }

def lambda_handler(event, context):
    """
    Main Lambda handler for PackageSubscriptions API
    """
    print(f"Event: {json.dumps(event)}")
    
    # CORS headers
    headers = get_cors_headers()

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
        if http_method == 'GET' and path == '/packages':
            query_params = event.get('queryStringParameters') or {}
            if query_params and query_params.get('type') == 'banners':
                return get_all_banners(headers)
            return get_all_packages(headers)

        elif http_method == 'PUT' and '/packages/' in path:
            package_id = path_parameters.get('packageId')
            return update_package(package_id, body, headers)

        elif http_method == 'POST' and path == '/subscriptions':
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

        elif http_method == 'GET' and path == '/wallet/withdrawals':
            return get_all_withdrawals(headers)

        elif http_method == 'PUT' and '/wallet/withdrawals/' in path:
            request_id = path_parameters.get('requestId')
            return update_withdrawal_status(request_id, body, headers)

        elif http_method == 'GET' and '/wallet/' in path:
            employer_id = path_parameters.get('employerId')
            return get_employer_wallet(employer_id, headers)
        
        elif http_method == 'POST' and path == '/wallet/transaction':
            return handle_wallet_transaction(body, headers)
            
        elif http_method == 'POST' and path == '/wallet/withdraw':
            return withdraw_wallet(body, headers)
            
        elif http_method == 'POST' and path == '/wallet/sepay-webhook':
            query_params = event.get('queryStringParameters') or {}
            token = query_params.get('token')
            return handle_sepay_webhook(body, token, headers)
        
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

DEFAULT_PACKAGE_CATALOG = [
    {
        'packageId': 'hot-search',
        'packageName': 'Hot Search',
        'order': 1,
        'subtitle': {
            'vi': 'Ưu tiên tìm kiếm',
            'en': 'Priority Search'
        },
        'prices': [
            {'duration': '24h', 'amount': 19000},
            {'duration': '5 ngày', 'amount': 79000},
            {'duration': '7 ngày', 'amount': 99000}
        ],
        'features': {
            'vi': [
                'Lên Top tìm kiếm theo ngành nghề/khu vực',
                'Tăng lượt click & ứng tuyển',
                'Ưu tiên hiển thị trước đối thủ'
            ],
            'en': [
                'Top search by industry/area',
                'Boost clicks & applications',
                'Priority visibility over competitors'
            ]
        },
        'color': '#1e40af',
        'bg': '#EFF6FF',
        'bd': '#BFDBFE',
        'dur': '3.6s',
        'featured': True,
        'iconKey': 'star'
    },
    {
        'packageId': 'quick-boost',
        'packageName': 'Quick Boost',
        'order': 2,
        'subtitle': {
            'vi': 'Đẩy tin bảng tin chung',
            'en': 'Push to general feed'
        },
        'prices': [
            {'duration': '24h', 'amount': 29000},
            {'duration': '5 ngày', 'amount': 99000},
            {'duration': '7 ngày', 'amount': 149000}
        ],
        'features': {
            'vi': [
                'Tự động đẩy tin lên đầu bảng tin',
                'Không lo bài đăng bị trôi',
                'Gắn tag nổi bật [Tuyển Gấp]'
            ],
            'en': [
                'Auto-push post to top of feed',
                'No worries about post fading away',
                'Featured tag [Urgent Hiring]'
            ]
        },
        'color': '#10B981',
        'bg': '#ECFDF5',
        'bd': '#A7F3D0',
        'dur': '4.2s',
        'featured': False,
        'iconKey': 'zap'
    },
    {
        'packageId': 'spotlight-banner',
        'packageName': 'Spotlight Banner',
        'order': 3,
        'subtitle': {
            'vi': '1 Banner Tĩnh',
            'en': '1 Static Banner'
        },
        'prices': [
            {'duration': '24h', 'amount': 39000},
            {'duration': '5 ngày', 'amount': 129000},
            {'duration': '7 ngày', 'amount': 199000}
        ],
        'features': {
            'vi': [
                'Hiển thị Banner riêng tại Trang chủ',
                'Tăng nhận diện thương hiệu tuyển dụng',
                'Click banner → vào thẳng job'
            ],
            'en': [
                'Display custom banner on homepage',
                'Boost employer branding',
                'Click banner directly to job'
            ]
        },
        'color': '#F59E0B',
        'bg': '#FFFBEB',
        'bd': '#FDE68A',
        'dur': '5s',
        'featured': False,
        'iconKey': 'rocket'
    },
    {
        'packageId': 'top-spotlight',
        'packageName': 'Top Spotlight',
        'order': 4,
        'subtitle': {
            'vi': '2 Banner Động + Tĩnh',
            'en': '2 Dynamic + Static Banners'
        },
        'prices': [
            {'duration': '24h', 'amount': 59000},
            {'duration': '5 ngày', 'amount': 249000},
            {'duration': '7 ngày', 'amount': 349000}
        ],
        'features': {
            'vi': [
                'Sở hữu Hero Banner nổi bật nhất',
                'Banner động + Banner tĩnh Premium',
                'Thu hút tối đa lượt xem & ứng tuyển'
            ],
            'en': [
                'Own the most prominent Hero Banner',
                'Dynamic + static Premium banner',
                'Attract maximum views & applications'
            ]
        },
        'color': '#DC2626',
        'bg': '#FEE2E2',
        'bd': '#FECACA',
        'dur': '4.5s',
        'featured': False,
        'iconKey': 'sparkles'
    }
]

def merge_package_catalog(default_item, stored_item):
    if not stored_item:
        return default_item

    merged = default_item.copy()
    merged.update({
        key: value for key, value in stored_item.items()
        if key not in ['subtitle', 'prices', 'features']
    })

    subtitle = default_item.get('subtitle', {}).copy()
    subtitle.update(stored_item.get('subtitle', {}))
    merged['subtitle'] = subtitle

    prices = stored_item.get('prices')
    merged['prices'] = prices if prices else default_item.get('prices', [])

    features = default_item.get('features', {}).copy()
    stored_features = stored_item.get('features', {})
    if isinstance(stored_features, dict):
        features.update({k: v for k, v in stored_features.items() if v})
    merged['features'] = features

    return merged

def load_package_catalog():
    try:
        response = catalog_table.scan()
        items = response.get('Items', [])
        stored_by_id = {item.get('packageId'): item for item in items if item.get('packageId')}
        return [merge_package_catalog(default_item, stored_by_id.get(default_item['packageId'])) for default_item in DEFAULT_PACKAGE_CATALOG]
    except Exception as error:
        print(f"⚠️ Failed to load package catalog from DynamoDB: {str(error)}")
        return DEFAULT_PACKAGE_CATALOG

def get_package_definition(package_name):
    catalog = load_package_catalog()
    for item in catalog:
        if item.get('packageName') == package_name:
            return item
    return None

def normalize_duration_str(d):
    if not d:
        return ""
    d_clean = d.lower()
    d_clean = re.sub(r'[^0-9a-z]', '', d_clean)
    if 'ng' in d_clean:
        d_clean = re.sub(r'ng.*', 'ng', d_clean)
    return d_clean

def get_package_price(package_name, duration):
    """Get package price based on name and duration"""
    package = get_package_definition(package_name)
    if not package:
        return 0

    norm_target = normalize_duration_str(duration)
    for price_option in package.get('prices', []):
        opt_duration = price_option.get('duration')
        if opt_duration == duration or normalize_duration_str(opt_duration) == norm_target:
            return price_option.get('amount', 0)

    return 0

def normalize_package_item(body, package_id):
    package_name = body.get('packageName') or body.get('name') or package_id
    subtitle = body.get('subtitle') or {}
    if isinstance(subtitle, str):
        subtitle = {'vi': subtitle, 'en': subtitle}

    features = body.get('features') or {}
    if isinstance(features, list):
        features = {'vi': features, 'en': features}

    prices = []
    for price in body.get('prices', []):
        if not isinstance(price, dict):
            continue
        prices.append({
            'duration': price.get('duration', ''),
            'amount': int(price.get('amount', 0) or 0)
        })

    return {
        'packageId': package_id,
        'packageName': package_name,
        'order': int(body.get('order', 1) or 1),
        'subtitle': {
            'vi': subtitle.get('vi', ''),
            'en': subtitle.get('en', '')
        },
        'prices': prices,
        'features': {
            'vi': features.get('vi', []) if isinstance(features, dict) else [],
            'en': features.get('en', []) if isinstance(features, dict) else []
        },
        'color': body.get('color', '#1e40af'),
        'bg': body.get('bg', '#EFF6FF'),
        'bd': body.get('bd', '#BFDBFE'),
        'dur': body.get('dur', '4s'),
        'featured': bool(body.get('featured', False)),
        'iconKey': body.get('iconKey', 'sparkles')
    }

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

def get_all_banners(headers):
    try:
        banners_table = dynamodb.Table('Banners')
        response = banners_table.scan()
        items = response.get('Items', [])
        active_items = [item for item in items if item.get('isActive') == True]
        active_items.sort(key=lambda x: float(x.get('order', 999)))
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(active_items, default=decimal_default)
        }
    except Exception as e:
        print(f"Error getting banners: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting banners: {str(e)}'
            })
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

def create_subscription(body_str, headers):
    """Create new subscription request and process payment via wallet"""
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
        price_decimal = Decimal(str(price))
        
        payment_method = body.get('paymentMethod', 'wallet')
        is_contact_request = payment_method == 'contact'
        
        now_dt = get_vn_now()
        
        if not is_contact_request:
            # Check and deduct employer wallet balance in database
            employer_id = body['employerId']
            wallet_info = get_or_create_wallet(employer_id)
            balance = wallet_info.get('walletBalance', Decimal('0'))
            
            if balance < price_decimal:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        'success': False,
                        'message': 'Số dư tài khoản không đủ để thanh toán gói dịch vụ này. Vui lòng nạp thêm tiền.'
                    })
                }
                
            new_balance = balance - price_decimal
            
            txn_id = f"TXN-BUY-{now_dt.strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
            
            transaction = {
                'transactionId': txn_id,
                'type': 'debit',
                'amount': price_decimal,
                'description': f"Thanh toán gói dịch vụ {body['packageName']} ({body['duration']})",
                'timestamp': now_dt.isoformat(),
                'status': 'completed',
                'paymentDetails': {
                    'subscriptionId': subscription_id,
                    'packageName': body['packageName'],
                    'duration': body['duration']
                }
            }
            
            transactions = wallet_info.get('walletTransactions', [])
            transactions.insert(0, transaction)
            
            # Deduct wallet balance and add transaction history record
            employer_profile_table.update_item(
                Key={'userId': employer_id},
                UpdateExpression="SET walletBalance = :bal, walletTransactions = :txs, updatedAt = :updatedAt",
                ExpressionAttributeValues={
                    ':bal': new_balance,
                    ':txs': transactions,
                    ':updatedAt': now_dt.isoformat()
                }
            )
            
            expiry_dt = calculate_expiry_datetime(body['duration'], now_dt)
            expiry_date = format_vn_date(expiry_dt)
            
            # Create item as active & approved directly since it is paid via wallet
            item = {
                'subscriptionId': subscription_id,
                'employerId': body['employerId'],
                'companyName': body['companyName'],
                'packageName': body['packageName'],
                'duration': body['duration'],
                'price': price_decimal,
                'purchaseDate': format_vn_date(now_dt),
                'purchaseDateTime': now_dt.isoformat(),
                'expiryDate': expiry_date,
                'expiryDateTime': expiry_dt.isoformat(),
                'status': 'active',  # active immediately
                'approvalStatus': 'approved',  # approved immediately
                'createdAt': now_dt.isoformat(),
                'updatedAt': now_dt.isoformat(),
                'paymentMethod': 'wallet'
            }
        else:
            # Create item as pending request
            item = {
                'subscriptionId': subscription_id,
                'employerId': body['employerId'],
                'companyName': body['companyName'],
                'packageName': body['packageName'],
                'duration': body['duration'],
                'price': price_decimal,
                'purchaseDate': format_vn_date(now_dt),
                'purchaseDateTime': now_dt.isoformat(),
                # Note: No expiryDate or expiryDateTime since it's waiting for approval
                'status': 'pending',
                'approvalStatus': 'pending',
                'createdAt': now_dt.isoformat(),
                'updatedAt': now_dt.isoformat(),
                'paymentMethod': 'contact'
            }
        
        # Put item in DynamoDB
        table.put_item(Item=item)
        
        print(f"✅ Subscription created (paymentMethod: {payment_method}): {subscription_id}")
        
        # Send Email Alert for Contact Request Subscriptions
        if is_contact_request:
            employer_email = None
            try:
                emp_resp = employer_profile_table.get_item(Key={'userId': body['employerId']})
                if 'Item' in emp_resp:
                    employer_email = emp_resp['Item'].get('email')
            except Exception as email_err:
                print(f"⚠️ Warning: Failed to fetch employer email for notification: {str(email_err)}")
            
            admin_email = os.environ.get('ADMIN_EMAIL', 'admin@opporeview.com')
            formatted_price = f"{int(price_decimal):,}".replace(",", ".")
            
            # 1. Notify Admin
            admin_subject = f"🔔 [Yêu Cầu Mở Gói] Đăng ký gói {body['packageName']} từ {body['companyName']}"
            admin_html = f"""
            <html>
            <body>
                <h3 style="color: #1e40af;">Yêu cầu kích hoạt gói dịch vụ mới (Liên hệ)</h3>
                <p><strong>Doanh nghiệp:</strong> {body['companyName']} ({body['employerId']})</p>
                <p><strong>Email Nhà tuyển dụng:</strong> {employer_email or 'Không có'}</p>
                <p><strong>Gói dịch vụ:</strong> {body['packageName']} ({body['duration']})</p>
                <p><strong>Đơn giá:</strong> {formatted_price} VND</p>
                <p><strong>Mã đăng ký:</strong> {subscription_id}</p>
                <br/>
                <p>Vui lòng truy cập trang quản trị Admin Dashboard để duyệt yêu cầu này.</p>
            </body>
            </html>
            """
            send_email(admin_email, admin_subject, admin_html)
            
            # 2. Confirm to Employer
            if employer_email:
                emp_subject = f"5️⃣ [OpPoReview] Xác nhận yêu cầu đăng ký gói {body['packageName']}"
                emp_html = f"""
                <html>
                <body>
                    <h3 style="color: #1e40af;">Cảm ơn quý khách đã đăng ký dịch vụ tại OpPoReview!</h3>
                    <p>Chúng tôi đã nhận được yêu cầu kích hoạt gói dịch vụ của bạn:</p>
                    <ul>
                        <li><strong>Gói dịch vụ:</strong> {body['packageName']} ({body['duration']})</li>
                        <li><strong>Mã đăng ký:</strong> {subscription_id}</li>
                        <li><strong>Trạng thái:</strong> Đang chờ admin phê duyệt</li>
                    </ul>
                    <p>Đội ngũ hỗ trợ của chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để hoàn tất quy trình kích hoạt gói.</p>
                    <br/>
                    <p>Trân trọng,<br/>Đội ngũ OpPoReview</p>
                </body>
                </html>
                """
                send_email(employer_email, emp_subject, emp_html)
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Đăng ký gói dịch vụ thành công.' if not is_contact_request else 'Gửi yêu cầu mở gói thành công.',
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

def generate_unique_wallet_code():
    import random
    import string
    
    attempts = 0
    while attempts < 10:
        code = 'OP' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        try:
            response = employer_profile_table.scan(
                FilterExpression=Attr('walletCode').eq(code),
                ProjectionExpression='userId'
            )
            if not response.get('Items'):
                return code
        except Exception as e:
            print(f"Error scanning for unique walletCode: {str(e)}")
            return code
        attempts += 1
        
    return 'OP' + str(uuid.uuid4().hex[:4]).upper()

def get_or_create_wallet(employer_id):
    try:
        response = employer_profile_table.get_item(Key={'userId': employer_id})
    except Exception as e:
        print(f"Error getting employer profile: {str(e)}")
        raise e

    if 'Item' not in response:
        now_str = get_vn_now().isoformat()
        wallet_code = generate_unique_wallet_code()
        new_profile = {
            'userId': employer_id,
            'companyName': '',
            'email': f"employer_{employer_id}@placeholder.com",
            'walletBalance': Decimal('0'),
            'walletCode': wallet_code,
            'walletTransactions': [],
            'createdAt': now_str,
            'updatedAt': now_str,
            'isActive': True,
            'isVerified': False
        }
        try:
            employer_profile_table.put_item(Item=new_profile)
            return new_profile
        except Exception as e:
            print(f"Error creating default profile/wallet: {str(e)}")
            raise e
    
    profile = response['Item']
    needs_update = False
    
    if 'walletBalance' not in profile:
        profile['walletBalance'] = Decimal('0')
        needs_update = True
        
    if 'walletTransactions' not in profile:
        profile['walletTransactions'] = []
        needs_update = True
        
    if 'walletCode' not in profile:
        profile['walletCode'] = generate_unique_wallet_code()
        needs_update = True
        
    if needs_update:
        try:
            employer_profile_table.update_item(
                Key={'userId': employer_id},
                UpdateExpression="SET walletBalance = :bal, walletTransactions = :txs, walletCode = :code, updatedAt = :updatedAt",
                ExpressionAttributeValues={
                    ':bal': profile['walletBalance'],
                    ':txs': profile['walletTransactions'],
                    ':code': profile['walletCode'],
                    ':updatedAt': get_vn_now().isoformat()
                }
            )
        except Exception as e:
            print(f"Error updating profile with wallet fields: {str(e)}")
    
    return profile

def get_employer_wallet(employer_id, headers):
    try:
        if not employer_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'employerId is required'
                })
            }
            
        wallet_info = get_or_create_wallet(employer_id)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': {
                    'walletBalance': wallet_info.get('walletBalance', Decimal('0')),
                    'walletCode': wallet_info.get('walletCode', ''),
                    'walletTransactions': wallet_info.get('walletTransactions', [])
                }
            }, default=decimal_default)
        }
    except Exception as e:
        print(f"Error in get_employer_wallet: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting wallet: {str(e)}'
            })
        }

def withdraw_wallet(body_str, headers):
    try:
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        
        employer_id = body.get('employerId')
        amount = Decimal(str(body.get('amount', 0)))
        bank_name = body.get('bankName')
        account_number = body.get('accountNumber')
        account_name = body.get('accountName')
        company_name = body.get('companyName', 'N/A')
        company_logo = body.get('companyLogo', '')
        
        if not employer_id or amount <= 0 or not bank_name or not account_number or not account_name:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Missing required withdrawal fields or invalid amount'
                })
            }
            
        wallet_info = get_or_create_wallet(employer_id)
        balance = wallet_info.get('walletBalance', Decimal('0'))
        
        if balance < amount:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Số dư tài khoản không đủ để thực hiện giao dịch này.'
                })
            }
            
        new_balance = balance - amount
        
        now_dt = get_vn_now()
        txn_id = f"TXN-WITHDRAW-{now_dt.strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        
        transaction = {
            'transactionId': txn_id,
            'type': 'debit',
            'amount': amount,
            'description': f"Rút tiền về tài khoản {bank_name} - {account_number}",
            'timestamp': now_dt.isoformat(),
            'status': 'completed',
            'paymentDetails': {
                'bankName': bank_name,
                'accountNumber': account_number,
                'accountName': account_name
            }
        }
        
        transactions = wallet_info.get('walletTransactions', [])
        transactions.insert(0, transaction)
        
        # Deduct wallet balance
        employer_profile_table.update_item(
            Key={'userId': employer_id},
            UpdateExpression="SET walletBalance = :bal, walletTransactions = :txs, updatedAt = :updatedAt",
            ExpressionAttributeValues={
                ':bal': new_balance,
                ':txs': transactions,
                ':updatedAt': now_dt.isoformat()
            }
        )
        
        # Create request record in database
        request_id = f"REQ-WITHDRAW-{now_dt.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        withdrawal_item = {
            'requestId': request_id,
            'employerId': employer_id,
            'companyName': company_name,
            'companyLogo': company_logo,
            'amount': amount,
            'bankName': bank_name,
            'accountNumber': account_number,
            'accountName': account_name,
            'status': 'pending',
            'transactionId': txn_id,
            'createdAt': now_dt.isoformat(),
            'updatedAt': now_dt.isoformat()
        }
        withdrawal_requests_table.put_item(Item=withdrawal_item)
        
        # Send withdrawal notification to admin
        try:
            admin_email = os.environ.get('ADMIN_EMAIL', 'admin@opporeview.com')
            admin_subject = f"💸 [Yêu Cầu Rút Tiền] Từ {company_name} ({amount} VND)"
            formatted_amount = f"{int(amount):,}".replace(",", ".")
            admin_html = f"""
            <html>
            <body>
                <h3 style="color: #ef4444;">Yêu cầu rút tiền từ tài khoản doanh nghiệp</h3>
                <p><strong>Doanh nghiệp:</strong> {company_name} ({employer_id})</p>
                <p><strong>Số tiền yêu cầu:</strong> {formatted_amount} VND</p>
                <p><strong>Thông tin ngân hàng nhận tiền:</strong></p>
                <ul>
                    <li><strong>Ngân hàng:</strong> {bank_name}</li>
                    <li><strong>Số tài khoản:</strong> {account_number}</li>
                    <li><strong>Tên chủ tài khoản:</strong> {account_name}</li>
                </ul>
                <p><strong>Mã yêu cầu:</strong> {request_id}</p>
                <br/>
                <p>Vui lòng xử lý yêu cầu rút tiền này trong Admin Dashboard.</p>
            </body>
            </html>
            """
            send_email(admin_email, admin_subject, admin_html)
        except Exception as email_err:
            print(f"⚠️ Warning: Failed to send withdrawal email to admin: {str(email_err)}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Rút tiền thành công',
                'data': {
                    'requestId': request_id,
                    'walletBalance': new_balance,
                    'walletTransactions': transactions
                }
            }, default=decimal_default)
        }
        
    except Exception as e:
        print(f"Error in withdraw_wallet: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error processing withdrawal: {str(e)}'
            })
        }

def handle_wallet_transaction(body_str, headers):
    try:
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        body = float_to_decimal(body)
        
        employer_id = body.get('employerId')
        amount = Decimal(str(body.get('amount', 0)))
        txn_type = body.get('type') # 'debit' or 'credit'
        description = body.get('description', 'Giao dịch ví')
        
        if not employer_id or amount <= 0 or txn_type not in ['debit', 'credit']:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Missing required fields or invalid transaction type/amount'
                })
            }
            
        wallet_info = get_or_create_wallet(employer_id)
        balance = wallet_info.get('walletBalance', Decimal('0'))
        
        if txn_type == 'debit':
            if balance < amount:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        'success': False,
                        'message': 'Số dư tài khoản không đủ để thực hiện giao dịch này.'
                    })
                }
            new_balance = balance - amount
        else:
            new_balance = balance + amount
            
        now_dt = get_vn_now()
        txn_id = f"TXN-{txn_type.upper()}-{now_dt.strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        
        transaction = {
            'transactionId': txn_id,
            'type': txn_type,
            'amount': amount,
            'description': description,
            'timestamp': now_dt.isoformat(),
            'status': 'completed',
            'paymentDetails': body.get('paymentDetails', {})
        }
        
        transactions = wallet_info.get('walletTransactions', [])
        transactions.insert(0, transaction)
        
        # Update wallet balance and transaction history in DB
        employer_profile_table.update_item(
            Key={'userId': employer_id},
            UpdateExpression="SET walletBalance = :bal, walletTransactions = :txs, updatedAt = :updatedAt",
            ExpressionAttributeValues={
                ':bal': new_balance,
                ':txs': transactions,
                ':updatedAt': now_dt.isoformat()
            }
        )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Giao dịch thành công',
                'data': {
                    'walletBalance': new_balance,
                    'walletTransactions': transactions
                }
            }, default=decimal_default)
        }
        
    except Exception as e:
        print(f"Error in handle_wallet_transaction: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error processing wallet transaction: {str(e)}'
            })
        }

def get_all_withdrawals(headers):
    try:
        response = withdrawal_requests_table.scan()
        items = response.get('Items', [])
        
        # Sort items by createdAt descending
        items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': items
            }, default=decimal_default)
        }
    except Exception as e:
        print(f"Error in get_all_withdrawals: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting withdrawals: {str(e)}'
            })
        }

def update_withdrawal_status(request_id, body_str, headers):
    try:
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        new_status = body.get('status')
        
        if not request_id or new_status not in ['approved', 'rejected']:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Missing requestId or invalid status'
                })
            }
            
        # Get existing request
        response = withdrawal_requests_table.get_item(Key={'requestId': request_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Withdrawal request not found'
                })
            }
            
        request_item = response['Item']
        current_status = request_item.get('status')
        
        if current_status != 'pending':
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Yêu cầu rút tiền này đã được xử lý trước đó.'
                })
            }
            
        employer_id = request_item.get('employerId')
        amount = request_item.get('amount')
        
        now_dt = get_vn_now()
        
        if new_status == 'rejected':
            # Refund the money to employer's wallet
            wallet_info = get_or_create_wallet(employer_id)
            balance = wallet_info.get('walletBalance', Decimal('0'))
            new_balance = balance + amount
            
            # Create credit refund transaction
            refund_txn_id = f"TXN-REFUND-{now_dt.strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
            refund_txn = {
                'transactionId': refund_txn_id,
                'type': 'credit',
                'amount': amount,
                'description': f"Hoàn tiền rút tiền bị từ chối (Mã YC: {request_id})",
                'timestamp': now_dt.isoformat(),
                'status': 'completed',
                'paymentDetails': {
                    'requestId': request_id,
                    'bankName': request_item.get('bankName'),
                    'accountNumber': request_item.get('accountNumber')
                }
            }
            
            transactions = wallet_info.get('walletTransactions', [])
            transactions.insert(0, refund_txn)
            
            # Update Employer Profile
            employer_profile_table.update_item(
                Key={'userId': employer_id},
                UpdateExpression="SET walletBalance = :bal, walletTransactions = :txs, updatedAt = :updatedAt",
                ExpressionAttributeValues={
                    ':bal': new_balance,
                    ':txs': transactions,
                    ':updatedAt': now_dt.isoformat()
                }
            )
            
        # Update status in WithdrawalRequests table
        withdrawal_requests_table.update_item(
            Key={'requestId': request_id},
            UpdateExpression="SET #st = :status, updatedAt = :updatedAt",
            ExpressionAttributeNames={'#st': 'status'},
            ExpressionAttributeValues={
                ':status': new_status,
                ':updatedAt': now_dt.isoformat()
            }
        )
        
        # Send status email to employer
        try:
            employer_email = None
            emp_resp = employer_profile_table.get_item(Key={'userId': employer_id})
            if 'Item' in emp_resp:
                employer_email = emp_resp['Item'].get('email')
                
            if employer_email:
                formatted_amount = f"{int(amount):,}".replace(",", ".")
                bank_name = request_item.get('bankName', '')
                account_number = request_item.get('accountNumber', '')
                account_name = request_item.get('accountName', '')
                
                if new_status == 'approved':
                    emp_subject = f"✅ [OpPoReview] Yêu cầu rút tiền {request_id} đã được chấp nhận"
                    emp_html = f"""
                    <html>
                    <body>
                        <h3 style="color: #10b981;">Yêu cầu rút tiền của bạn đã được phê duyệt!</h3>
                        <p>Số tiền <strong>{formatted_amount} VND</strong> đã được chuyển đến tài khoản ngân hàng của bạn:</p>
                        <ul>
                            <li><strong>Ngân hàng:</strong> {bank_name}</li>
                            <li><strong>Số tài khoản:</strong> {account_number}</li>
                            <li><strong>Tên chủ tài khoản:</strong> {account_name}</li>
                            <li><strong>Mã yêu cầu:</strong> {request_id}</li>
                        </ul>
                        <p>Giao dịch sẽ được hoàn tất trong vòng 1-3 ngày làm việc tùy thuộc vào ngân hàng của bạn.</p>
                        <br/>
                        <p>Trân trọng,<br/>Đội ngũ OpPoReview</p>
                    </body>
                    </html>
                    """
                else:
                    emp_subject = f"❌ [OpPoReview] Yêu cầu rút tiền {request_id} đã bị từ chối"
                    emp_html = f"""
                    <html>
                    <body>
                        <h3 style="color: #ef4444;">Yêu cầu rút tiền của bạn không được phê duyệt</h3>
                        <p>Yêu cầu rút số tiền <strong>{formatted_amount} VND</strong> (Mã YC: {request_id}) đã bị từ chối bởi quản trị viên.</p>
                        <p>Số tiền đã được hoàn lại đầy đủ vào số dư ví doanh nghiệp của bạn.</p>
                        <p>Vui lòng kiểm tra lại thông tin ngân hàng hoặc liên hệ bộ phận hỗ trợ để được giải đáp.</p>
                        <br/>
                        <p>Trân trọng,<br/>Đội ngũ OpPoReview</p>
                    </body>
                    </html>
                    """
                send_email(employer_email, emp_subject, emp_html)
        except Exception as email_err:
            print(f"⚠️ Warning: Failed to send withdrawal status email: {str(email_err)}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Cập nhật trạng thái rút tiền thành công',
                'data': {
                    'requestId': request_id,
                    'status': new_status
                }
            })
        }
    except Exception as e:
        print(f"Error in update_withdrawal_status: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error updating withdrawal status: {str(e)}'
            })
        }

def extract_wallet_code(content):
    if not content:
        return None
    match = re.search(r'OPPOWALLET\s+(OP[A-Z0-9]{4})', content, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    match2 = re.search(r'\b(OP[A-Z0-9]{4})\b', content, re.IGNORECASE)
    if match2:
        return match2.group(1).upper()
    return None

def handle_sepay_webhook(body_str, token, headers):
    try:
        # Check token
        expected_token = 'oppo_secure_sepay_token_2026'
        if token != expected_token:
            print(f"Unauthorized Webhook Access: Invalid token received: {token}")
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Unauthorized: Invalid token'
                })
            }
            
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        print(f"SePay Webhook received payload: {json.dumps(body)}")
        
        transfer_type = body.get('transferType', 'in')
        if transfer_type != 'in':
            print(f"Ignoring non-credit transaction type: {transfer_type}")
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'message': 'Ignored transferType out'})
            }
            
        content = body.get('content', '')
        wallet_code = extract_wallet_code(content)
        
        if not wallet_code:
            print(f"Could not extract wallet code from content: {content}")
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'message': f'Could not extract wallet code from transaction content: {content}'
                })
            }
            
        # Find employer profile by wallet_code
        try:
            response = employer_profile_table.scan(
                FilterExpression=Attr('walletCode').eq(wallet_code)
            )
            items = response.get('Items', [])
        except Exception as e:
            print(f"Error scanning for walletCode: {str(e)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'success': False, 'message': 'Database error looking up wallet code'})
            }
            
        if not items:
            print(f"No employer profile found for walletCode: {wallet_code}")
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'success': False, 'message': f'Wallet code {wallet_code} not found'})
            }
            
        profile = items[0]
        employer_id = profile['userId']
        transactions = profile.get('walletTransactions', [])
        sepay_id = str(body.get('id', ''))
        
        # Deduplicate
        for txn in transactions:
            if txn.get('paymentDetails', {}).get('sepayId') == sepay_id:
                print(f"Transaction with SePay ID {sepay_id} already processed.")
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'message': 'Already processed'})
                }
                
        transfer_amount = Decimal(str(body.get('transferAmount', 0)))
        if transfer_amount <= 0:
            print(f"Invalid transfer amount: {transfer_amount}")
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'success': False, 'message': 'Invalid transfer amount'})
            }
            
        current_balance = profile.get('walletBalance', Decimal('0'))
        new_balance = current_balance + transfer_amount
        
        now_dt = get_vn_now()
        txn_id = f"TXN-DEPOSIT-{now_dt.strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        
        new_txn = {
            'transactionId': txn_id,
            'type': 'credit',
            'amount': transfer_amount,
            'description': f"Nạp tiền tự động qua SePay (GD: {sepay_id})",
            'timestamp': now_dt.isoformat(),
            'status': 'completed',
            'paymentDetails': {
                'sepayId': sepay_id,
                'gateway': body.get('gateway', ''),
                'transactionDate': body.get('transactionDate', ''),
                'referenceCode': body.get('referenceCode', ''),
                'content': content
            }
        }
        
        transactions.insert(0, new_txn)
        
        employer_profile_table.update_item(
            Key={'userId': employer_id},
            UpdateExpression="SET walletBalance = :bal, walletTransactions = :txs, updatedAt = :updatedAt",
            ExpressionAttributeValues={
                ':bal': new_balance,
                ':txs': transactions,
                ':updatedAt': now_dt.isoformat()
            }
        )
        
        print(f"Successfully credited {transfer_amount} to employer {employer_id}")
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True})
        }
        
    except Exception as e:
        print(f"Error in handle_sepay_webhook: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Internal server error: {str(e)}'
            })
        }

def get_all_packages(headers):
    try:
        packages = load_package_catalog()
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': packages
            }, default=decimal_default)
        }
    except Exception as e:
        print(f"Error getting packages: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error getting packages: {str(e)}'
            })
        }

def update_package(package_id, body_str, headers):
    try:
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        package_item = normalize_package_item(body, package_id)
        now_dt = get_vn_now().isoformat()

        update_params = {
            'Key': {'packageId': package_id},
            'UpdateExpression': 'SET packageName = :packageName, #order = :order, subtitle = :subtitle, prices = :prices, features = :features, color = :color, bg = :bg, bd = :bd, dur = :dur, featured = :featured, iconKey = :iconKey, updatedAt = :updatedAt',
            'ExpressionAttributeNames': {
                '#order': 'order'
            },
            'ExpressionAttributeValues': {
                ':packageName': package_item['packageName'],
                ':order': package_item['order'],
                ':subtitle': package_item['subtitle'],
                ':prices': package_item['prices'],
                ':features': package_item['features'],
                ':color': package_item['color'],
                ':bg': package_item['bg'],
                ':bd': package_item['bd'],
                ':dur': package_item['dur'],
                ':featured': package_item['featured'],
                ':iconKey': package_item['iconKey'],
                ':updatedAt': now_dt
            },
            'ReturnValues': 'ALL_NEW'
        }

        response = catalog_table.update_item(**update_params)
        updated_item = response.get('Attributes', {})

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Package catalog updated successfully',
                'data': updated_item
            }, default=decimal_default)
        }
    except Exception as e:
        print(f"Error updating package catalog: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'message': f'Error updating package catalog: {str(e)}'
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
        
        # If approved/active, send activation email to the employer
        if body.get('approvalStatus') == 'approved' or body.get('status') == 'active':
            employer_id = updated_item.get('employerId')
            employer_email = None
            try:
                emp_resp = employer_profile_table.get_item(Key={'userId': employer_id})
                if 'Item' in emp_resp:
                    employer_email = emp_resp['Item'].get('email')
            except Exception as email_err:
                print(f"⚠️ Warning: Failed to fetch employer email for approval notification: {str(email_err)}")
                
            if employer_email:
                emp_subject = f"🎉 [OpPoReview] Gói dịch vụ {updated_item.get('packageName')} đã được kích hoạt!"
                emp_html = f"""
                <html>
                <body>
                    <h3 style="color: #10b981;">Chúc mừng! Gói dịch vụ của bạn đã được kích hoạt thành công</h3>
                    <p>Chi tiết gói dịch vụ hoạt động:</p>
                    <ul>
                        <li><strong>Gói dịch vụ:</strong> {updated_item.get('packageName')} ({updated_item.get('duration')})</li>
                        <li><strong>Mã đăng ký:</strong> {subscription_id}</li>
                        <li><strong>Ngày bắt đầu:</strong> {updated_item.get('purchaseDate')}</li>
                        <li><strong>Ngày hết hạn:</strong> {updated_item.get('expiryDate')}</li>
                        <li><strong>Trạng thái:</strong> Đang hoạt động (Active)</li>
                    </ul>
                    <p>Bây giờ bạn đã có thể bắt đầu sử dụng các tính năng ưu tiên của gói dịch vụ này.</p>
                    <br/>
                    <p>Trân trọng,<br/>Đội ngũ OpPoReview</p>
                </body>
                </html>
                """
                send_email(employer_email, emp_subject, emp_html)
        
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
