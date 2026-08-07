import boto3
import json
import sys
from collections import defaultdict
from decimal import Decimal

sys.stdout.reconfigure(encoding='utf-8')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')

def get_all_items(table_name):
    try:
        table = dynamodb.Table(table_name)
        items = []
        response = table.scan()
        items.extend(response.get('Items', []))
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))
        return items
    except Exception as e:
        print(f"Error scanning {table_name}: {e}")
        return []

def main():
    cand_items = get_all_items('CandidateProfiles')
    user_items = get_all_items('Users')
    
    print(f"CandidateProfiles items: {len(cand_items)}")
    print(f"Users items: {len(user_items)}")
    
    # Check CandidateProfiles duplicates
    email_map = defaultdict(list)
    for item in cand_items:
        email = item.get('email') or item.get('contactEmail') or item.get('Email')
        if email:
            email_clean = str(email).strip().lower()
            email_map[email_clean].append(item)
        else:
            email_map['__NO_EMAIL__'].append(item)

    cand_duplicates = {e: items for e, items in email_map.items() if e != '__NO_EMAIL__' and len(items) > 1}
    
    print(f"\n--- CandidateProfiles Duplicates ({len(cand_duplicates)} email groups) ---")
    
    report = []
    
    for email, items in sorted(cand_duplicates.items(), key=lambda x: len(x[1]), reverse=True):
        group_info = {
            "email": email,
            "count": len(items),
            "records": []
        }
        for idx, c in enumerate(items, 1):
            uid = c.get('userId') or c.get('id') or c.get('candidateId')
            name = c.get('fullName') or c.get('name') or c.get('candidateName') or 'N/A'
            phone = c.get('phone') or c.get('phoneNumber') or c.get('contactPhone') or 'N/A'
            created = c.get('createdAt') or c.get('created_at') or c.get('dateJoined') or c.get('registeredAt') or 'N/A'
            is_active = c.get('isActive')
            ekyc = c.get('ekycStatus') or c.get('isEkycVerified') or c.get('ekycStep')
            
            group_info["records"].append({
                "index": idx,
                "userId": uid,
                "fullName": name,
                "phone": phone,
                "createdAt": created,
                "isActive": is_active,
                "ekycStatus": ekyc
            })
        report.append(group_info)

    # Write report to markdown file
    md_content = ["# Report: Các Ứng Viên Bị Duplicate Trong Database (CandidateProfiles)\n"]
    md_content.append(f"Tổng số ứng viên trong `CandidateProfiles`: **{len(cand_items)}**\n")
    md_content.append(f"Tổng số nhóm email bị trùng lặp: **{len(cand_duplicates)}**\n\n")
    
    md_content.append("| STT | Email | Số lượng bản ghi trùng | Chi tiết Ứng Viên (userId, Tên, SĐT, Ngày tạo, Active) |\n")
    md_content.append("|---|---|---|---|\n")
    
    for stt, group in enumerate(report, 1):
        email = group['email']
        count = group['count']
        details = []
        for r in group['records']:
            details.append(f"- **userId**: `{r['userId']}` | **Tên**: {r['fullName']} | **SĐT**: {r['phone']} | **Ngày tạo**: {r['createdAt']} | **Active**: {r['isActive']}")
        details_str = "<br>".join(details)
        md_content.append(f"| {stt} | `{email}` | **{count}** | {details_str} |\n")
        
    with open('duplicate_candidates_report.md', 'w', encoding='utf-8') as f:
        f.writelines(md_content)
        
    print("Report written to duplicate_candidates_report.md successfully!")

if __name__ == '__main__':
    main()
