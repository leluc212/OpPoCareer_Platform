"""
Script kiểm tra giao dịch quick job trong DynamoDB.
Tìm job "pha chế" ở Gò Vấp và kiểm tra ví NTD.

Cách dùng:
  python check_quick_job_payment.py
  python check_quick_job_payment.py --user-id YOUR_USER_ID
"""

import boto3
import json
import argparse
from decimal import Decimal

REGION = 'ap-southeast-1'
QUICK_JOB_TABLE = 'PostQuickJob'
EMPLOYER_TABLE = 'EmployerProfiles'


def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def find_quick_job(dynamodb):
    """Tìm job pha chế ở Gò Vấp trong bảng PostQuickJob"""
    print("=" * 60)
    print("🔍 Tìm kiếm job 'pha chế' ở 'Gò Vấp' trong PostQuickJob...")
    print("=" * 60)

    table = dynamodb.Table(QUICK_JOB_TABLE)

    response = table.scan(
        FilterExpression="contains(title, :t)",
        ExpressionAttributeValues={":t": "pha chế"},
    )

    items = response.get('Items', [])

    # Paginate if needed
    while 'LastEvaluatedKey' in response:
        response = table.scan(
            FilterExpression="contains(title, :t)",
            ExpressionAttributeValues={":t": "pha chế"},
            ExclusiveStartKey=response['LastEvaluatedKey'],
        )
        items.extend(response.get('Items', []))

    if not items:
        print("❌ Không tìm thấy job nào có title chứa 'pha chế'")
        return None

    # Filter thêm theo location Gò Vấp
    go_vap_jobs = [j for j in items if 'gò vấp' in j.get('location', '').lower() or 'go vap' in j.get('location', '').lower()]

    if go_vap_jobs:
        print(f"✅ Tìm thấy {len(go_vap_jobs)} job pha chế ở Gò Vấp:\n")
        for job in go_vap_jobs:
            print(f"  📋 Job ID: {job.get('jobID')}")
            print(f"     Title: {job.get('title')}")
            print(f"     Location: {job.get('location')}")
            print(f"     Status: {job.get('status')}")
            print(f"     Start: {job.get('startTime')}")
            print(f"     End: {job.get('endTime')}")
            print(f"     Employer ID: {job.get('employerId')}")
            print(f"     Created: {job.get('createdAt')}")
            print()
        return go_vap_jobs
    else:
        print(f"⚠️  Tìm thấy {len(items)} job 'pha chế' nhưng không ở Gò Vấp:")
        for job in items:
            print(f"  - {job.get('title')} | {job.get('location')} | {job.get('status')}")
        return items


def check_wallet(dynamodb, user_id):
    """Kiểm tra ví và lịch sử giao dịch của employer"""
    print("=" * 60)
    print(f"💰 Kiểm tra ví của employer: {user_id}")
    print("=" * 60)

    table = dynamodb.Table(EMPLOYER_TABLE)
    response = table.get_item(Key={'userId': user_id})
    item = response.get('Item')

    if not item:
        print(f"❌ Không tìm thấy employer profile với userId: {user_id}")
        return

    balance = item.get('walletBalance', 0)
    transactions = item.get('walletTransactions', [])

    print(f"\n  💳 Số dư hiện tại: {int(float(str(balance))):,} VNĐ")
    print(f"  📝 Tổng số giao dịch: {len(transactions)}")

    # Tìm giao dịch debit liên quan quick job
    print(f"\n  --- Lịch sử giao dịch DEBIT gần đây (5 giao dịch mới nhất) ---")
    debit_txns = [t for t in transactions if t.get('type') == 'debit']

    for txn in debit_txns[:5]:
        print(f"\n  🔸 ID: {txn.get('transactionId')}")
        print(f"     Số tiền: -{int(float(str(txn.get('amount', 0)))):,} VNĐ")
        print(f"     Mô tả: {txn.get('description')}")
        print(f"     Thời gian: {txn.get('timestamp')}")
        print(f"     Status: {txn.get('status')}")

    # Tìm giao dịch 30k
    txn_30k = [t for t in debit_txns if int(float(str(t.get('amount', 0)))) == 30000]
    if txn_30k:
        print(f"\n  ⚠️  Tìm thấy {len(txn_30k)} giao dịch trừ 30,000 VNĐ:")
        for t in txn_30k:
            print(f"     - {t.get('transactionId')} | {t.get('timestamp')} | {t.get('description')}")
    else:
        print(f"\n  ✅ Không có giao dịch nào trừ đúng 30,000 VNĐ → Tiền chưa bị trừ")


def main():
    parser = argparse.ArgumentParser(description='Kiểm tra quick job payment trong DynamoDB')
    parser.add_argument('--user-id', type=str, help='Employer user ID để check ví')
    parser.add_argument('--region', type=str, default=REGION, help='AWS region')
    args = parser.parse_args()

    dynamodb = boto3.resource('dynamodb', region_name=args.region)

    # Step 1: Tìm job
    jobs = find_quick_job(dynamodb)

    # Step 2: Check ví
    user_id = args.user_id

    # Nếu không truyền user_id, lấy từ job tìm được
    if not user_id and jobs:
        user_id = jobs[0].get('employerId')
        print(f"\n📌 Sử dụng employer ID từ job tìm được: {user_id}")

    if user_id:
        print()
        check_wallet(dynamodb, user_id)
    else:
        print("\n⚠️  Không có user ID. Chạy lại với --user-id YOUR_ID để check ví.")

    print("\n" + "=" * 60)
    print("📌 KẾT LUẬN:")
    print("  - Nếu job tồn tại + có giao dịch 30k → Job đã tạo, tiền đã trừ đúng")
    print("  - Nếu job tồn tại + KHÔNG có giao dịch → Bug, cần điều tra thêm")
    print("  - Nếu KHÔNG có job + có giao dịch 30k → Cần REFUND")
    print("  - Nếu KHÔNG có job + KHÔNG có giao dịch → Tiền chưa bị trừ")
    print("=" * 60)


if __name__ == '__main__':
    main()
