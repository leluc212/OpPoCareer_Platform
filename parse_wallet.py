import json

with open(r'd:\OpPoCareer_Platform\wallet_full.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

txns = data.get('Item', {}).get('walletTransactions', {}).get('L', [])
print(f"Total transactions: {len(txns)}")
print("\n--- Most recent 15 transactions ---")
for i, t in enumerate(txns[:15]):
    m = t.get('M', {})
    ts = m.get('timestamp', {}).get('S', '')
    amount = m.get('amount', {}).get('N', '')
    desc = m.get('description', {}).get('S', '')
    txn_type = m.get('type', {}).get('S', '')
    txn_id = m.get('transactionId', {}).get('S', '')
    print(f"{i+1}. [{txn_type}] {ts} | {amount} | {desc}")
    print(f"   TxnID: {txn_id}")

# Find any transaction from July 2026
print("\n--- July 2026 transactions ---")
for t in txns:
    m = t.get('M', {})
    ts = m.get('timestamp', {}).get('S', '')
    if '2026-07' in ts:
        amount = m.get('amount', {}).get('N', '')
        desc = m.get('description', {}).get('S', '')
        txn_type = m.get('type', {}).get('S', '')
        txn_id = m.get('transactionId', {}).get('S', '')
        print(f"  [{txn_type}] {ts} | {amount} | {desc}")
        print(f"   TxnID: {txn_id}")

# Find any "pha che" related
print("\n--- 'pha che' related ---")
for t in txns:
    m = t.get('M', {})
    desc = m.get('description', {}).get('S', '').lower()
    details = m.get('paymentDetails', {}).get('M', {})
    job_title = details.get('jobTitle', {}).get('S', '').lower() if details else ''
    if 'pha ch' in desc or 'pha ch' in job_title:
        ts = m.get('timestamp', {}).get('S', '')
        amount = m.get('amount', {}).get('N', '')
        full_desc = m.get('description', {}).get('S', '')
        txn_id = m.get('transactionId', {}).get('S', '')
        print(f"  {ts} | {amount} | {full_desc}")
        print(f"   TxnID: {txn_id}")
        print(f"   JobTitle: {details.get('jobTitle', {}).get('S', '')}")
