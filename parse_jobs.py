import json

with open(r'd:\OpPoCareer_Platform\wallet_full.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

# Now let's look at debit transactions from July 15 onwards
txns = data.get('Item', {}).get('walletTransactions', {}).get('L', [])

print("=== DEBIT transactions from July 15 onwards ===")
for t in txns:
    m = t.get('M', {})
    ts = m.get('timestamp', {}).get('S', '')
    txn_type = m.get('type', {}).get('S', '')
    if txn_type != 'debit':
        continue
    # Check if date >= 2026-07-15
    if ts >= '2026-07-15' or (ts >= '2026-07-1' and 'T' in ts and ts[:10] >= '2026-07-15'):
        amount = m.get('amount', {}).get('N', '')
        desc = m.get('description', {}).get('S', '')
        txn_id = m.get('transactionId', {}).get('S', '')
        details = m.get('paymentDetails', {}).get('M', {})
        job_title = details.get('jobTitle', {}).get('S', '') if details else ''
        hours = details.get('hours', {}).get('N', '') if details else ''
        rate = details.get('hourlyRate', {}).get('N', '') if details else ''
        print(f"  Time: {ts}")
        print(f"  Amount: {amount}")
        print(f"  Desc: {desc}")
        print(f"  TxnID: {txn_id}")
        print(f"  JobTitle: {job_title} | Hours: {hours} | Rate: {rate}")
        print("  ---")
