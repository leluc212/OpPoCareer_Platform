"""
Audit Script: Tìm các NTD bị mất tiền mà không có Job Gấp tương ứng.
Rà soát giao dịch ví loại 'debit' có mô tả liên quan đến "Đăng bài" / "Quick job"
nhưng KHÔNG có bản ghi job tương ứng trong bảng PostQuickJob.

Cách chạy:
  python audit-quick-job-payments.py [--refund]

Mặc định: chỉ báo cáo. Thêm --refund để tự động hoàn tiền.
"""

import boto3
import json
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal

VN_TZ = timezone(timedelta(hours=7))
REGION = 'ap-southeast-1'

dynamodb = boto3.resource('dynamodb', region_name=REGION)
employer_table = dynamodb.Table('EmployerProfiles')
quick_job_table = dynamodb.Table('PostQuickJob')

DO_REFUND = '--refund' in sys.argv


def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError


def get_all_employers_with_transactions():
    """Scan EmployerProfiles for all employers that have walletTransactions"""
    items = []
    response = employer_table.scan(
        FilterExpression='attribute_exists(walletTransactions)',
        ProjectionExpression='userId, walletBalance, walletTransactions, companyName, businessName'
    )
    items.extend(response.get('Items', []))
    while 'LastEvaluatedKey' in response:
        response = employer_table.scan(
            FilterExpression='attribute_exists(walletTransactions)',
            ProjectionExpression='userId, walletBalance, walletTransactions, companyName, businessName',
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        items.extend(response.get('Items', []))
    return items


def get_all_quick_jobs_by_employer(employer_id):
    """Get all quick jobs for an employer"""
    try:
        response = quick_job_table.query(
            IndexName='EmployerIndex',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('employerId').eq(employer_id)
        )
        return response.get('Items', [])
    except Exception:
        # Fallback to scan if GSI doesn't exist
        response = quick_job_table.scan(
            FilterExpression=boto3.dynamodb.conditions.Attr('employerId').eq(employer_id)
        )
        return response.get('Items', [])


def find_orphan_transactions(employer):
    """Find debit transactions related to quick jobs that have no matching job"""
    employer_id = employer['userId']
    transactions = employer.get('walletTransactions', [])
    
    if not transactions:
        return []
    
    # Get all quick jobs for this employer
    jobs = get_all_quick_jobs_by_employer(employer_id)
    job_titles = set()
    for job in jobs:
        job_titles.add((job.get('title', '').strip().lower()))
    
    orphans = []
    for txn in transactions:
        if txn.get('type') != 'debit':
            continue
        
        desc = txn.get('description', '')
        # Identify quick-job related debits
        is_quick_job_debit = any(keyword in desc.lower() for keyword in [
            'đăng bài', 'post job', 'tuyển gấp', 'quick job', 'phí đăng bài'
        ])
        
        if not is_quick_job_debit:
            continue
        
        # Check if there's a corresponding refund (credit) for this transaction
        txn_id = txn.get('transactionId', '')
        has_refund = any(
            t.get('type') == 'credit' and 
            ('hoàn tiền' in t.get('description', '').lower() or 'refund' in t.get('description', '').lower())
            and abs(t.get('amount', 0) - txn.get('amount', 0)) < 1  # Same amount
            for t in transactions
        )
        
        if has_refund:
            continue  # Already refunded, skip
        
        # Try to match with a job by title from description
        # Description format: "Nạp tiền - Đăng bài: {title} (...)"
        job_title_from_desc = ''
        if 'đăng bài:' in desc.lower():
            parts = desc.split(':', 1)
            if len(parts) > 1:
                title_part = parts[1].strip()
                # Remove the hours/rate suffix
                if '(' in title_part:
                    title_part = title_part[:title_part.rfind('(')].strip()
                job_title_from_desc = title_part.lower()
        elif 'post job:' in desc.lower():
            parts = desc.lower().split('post job:', 1)
            if len(parts) > 1:
                title_part = parts[1].strip()
                if '(' in title_part:
                    title_part = title_part[:title_part.rfind('(')].strip()
                job_title_from_desc = title_part
        
        # Check if this title exists in the quick jobs
        has_matching_job = job_title_from_desc in job_titles if job_title_from_desc else False
        
        if not has_matching_job:
            orphans.append({
                'transactionId': txn.get('transactionId'),
                'amount': txn.get('amount'),
                'description': desc,
                'timestamp': txn.get('timestamp'),
                'jobTitleExtracted': job_title_from_desc
            })
    
    return orphans


def refund_employer(employer_id, amount, original_txn_id):
    """Refund an employer by crediting their wallet"""
    import uuid
    
    now_vn = datetime.now(VN_TZ)
    refund_txn_id = f"TXN-REFUND-{now_vn.strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
    
    # Get current employer data
    response = employer_table.get_item(Key={'userId': employer_id})
    emp = response.get('Item', {})
    current_balance = emp.get('walletBalance', Decimal('0'))
    transactions = emp.get('walletTransactions', [])
    
    new_balance = current_balance + Decimal(str(amount))
    
    refund_record = {
        'transactionId': refund_txn_id,
        'type': 'credit',
        'amount': Decimal(str(amount)),
        'description': f'Hoàn tiền tự động - Lỗi hệ thống đăng bài tuyển gấp (ref: {original_txn_id})',
        'timestamp': now_vn.isoformat(),
        'status': 'completed',
        'paymentDetails': {
            'reason': 'system_error_refund',
            'originalTransactionId': original_txn_id
        }
    }
    
    transactions.insert(0, refund_record)
    
    employer_table.update_item(
        Key={'userId': employer_id},
        UpdateExpression="SET walletBalance = :bal, walletTransactions = :txs, updatedAt = :updatedAt",
        ExpressionAttributeValues={
            ':bal': new_balance,
            ':txs': transactions,
            ':updatedAt': now_vn.isoformat()
        }
    )
    
    return refund_txn_id, new_balance


def main():
    print("=" * 60)
    print("AUDIT: Quick Job Payment Orphans")
    print(f"Mode: {'REFUND' if DO_REFUND else 'REPORT ONLY'}")
    print(f"Time: {datetime.now(VN_TZ).isoformat()}")
    print("=" * 60)
    
    employers = get_all_employers_with_transactions()
    print(f"\nScanning {len(employers)} employers with wallet transactions...")
    
    total_orphans = 0
    total_amount = Decimal('0')
    affected_employers = []
    
    for emp in employers:
        employer_id = emp['userId']
        company = emp.get('companyName', emp.get('businessName', 'N/A'))
        
        orphans = find_orphan_transactions(emp)
        
        if orphans:
            total_orphans += len(orphans)
            emp_total = sum(Decimal(str(o['amount'])) for o in orphans)
            total_amount += emp_total
            
            print(f"\n--- Employer: {employer_id} ({company}) ---")
            print(f"    Orphan transactions: {len(orphans)}, Total: {int(emp_total):,} VNĐ")
            
            for o in orphans:
                print(f"    • [{o['transactionId']}] {int(o['amount']):,} VNĐ - {o['timestamp']}")
                print(f"      Desc: {o['description']}")
                
                if DO_REFUND:
                    refund_id, new_bal = refund_employer(employer_id, o['amount'], o['transactionId'])
                    print(f"      ✅ REFUNDED: {refund_id}, New balance: {int(new_bal):,} VNĐ")
            
            affected_employers.append({
                'employerId': employer_id,
                'company': company,
                'orphanCount': len(orphans),
                'totalAmount': int(emp_total)
            })
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Affected employers: {len(affected_employers)}")
    print(f"Total orphan transactions: {total_orphans}")
    print(f"Total amount: {int(total_amount):,} VNĐ")
    
    if DO_REFUND:
        print(f"\n✅ All refunds processed successfully.")
    else:
        if total_orphans > 0:
            print(f"\n⚠️  Run with --refund to automatically process refunds.")
    
    # Save report
    report = {
        'auditDate': datetime.now(VN_TZ).isoformat(),
        'mode': 'refund' if DO_REFUND else 'report',
        'affectedEmployers': affected_employers,
        'totalOrphanTransactions': total_orphans,
        'totalAmount': int(total_amount)
    }
    
    report_file = f"audit-quick-job-report-{datetime.now(VN_TZ).strftime('%Y%m%d-%H%M%S')}.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2, default=decimal_default)
    print(f"\nReport saved: {report_file}")


if __name__ == '__main__':
    main()
