"""
fix-cccd-duypl2310.py
Fix số CCCD cho user duypl2310@gmail.com — đang lưu sai trong DynamoDB.

CCCD thật: 070205010078
Đang hiện: 000205010078 (do Didit trả thiếu leading digits → padStart sai)

Cách chạy:
  python fix-cccd-duypl2310.py

Yêu cầu: AWS credentials đã cấu hình, pip install boto3
"""

import boto3

REGION = 'ap-southeast-1'
TABLE_NAME = 'CandidateProfiles'
CORRECT_CCCD = '070205010078'

# Tìm user bằng email
TARGET_EMAIL = 'duypl2310@gmail.com'

dynamodb = boto3.resource('dynamodb', region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


def main():
    print(f'=== Fix CCCD cho {TARGET_EMAIL} ===')
    print(f'CCCD đúng: {CORRECT_CCCD}')
    print()

    # Scan tìm user (hoặc dùng GSI nếu có email-index)
    print('Tìm user...')
    result = table.scan(
        FilterExpression='email = :e',
        ExpressionAttributeValues={':e': TARGET_EMAIL}
    )

    items = result.get('Items', [])
    if not items:
        print(f'Không tìm thấy user với email {TARGET_EMAIL}!')
        return

    user = items[0]
    user_id = user['userId']
    current_cccd = user.get('cccd', '(trống)')

    print(f'Tìm thấy: userId={user_id}')
    print(f'CCCD hiện tại trong DB: {current_cccd}')
    print(f'CCCD đúng:              {CORRECT_CCCD}')
    print()

    if current_cccd == CORRECT_CCCD:
        print('CCCD đã đúng rồi, không cần update!')
        return

    # Update
    confirm = input(f'Cập nhật CCCD từ "{current_cccd}" → "{CORRECT_CCCD}"? (y/n): ')
    if confirm.lower() != 'y':
        print('Huỷ.')
        return

    table.update_item(
        Key={'userId': user_id},
        UpdateExpression='SET cccd = :cccd',
        ExpressionAttributeValues={':cccd': CORRECT_CCCD},
    )
    print(f'✓ Đã update CCCD = {CORRECT_CCCD} cho userId={user_id}')


if __name__ == '__main__':
    main()
