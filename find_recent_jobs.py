import json, subprocess

# Scan for all jobs from this employer created from July 13 onwards
# Already have scan results, let's parse from those
# We need to re-run scan to get ALL jobs (previous output may have been truncated)

result = subprocess.run(
    ['aws', 'dynamodb', 'scan', 
     '--table-name', 'PostQuickJob',
     '--filter-expression', 'employerId = :eid',
     '--expression-attribute-values', 'file://scan_filter.json',
     '--region', 'ap-southeast-1',
     '--output', 'json'],
    capture_output=True, text=True, cwd=r'd:\OpPoCareer_Platform'
)

data = json.loads(result.stdout)
items = data.get('Items', [])

print(f"Total jobs found: {len(items)}")
print("\n=== Jobs created from July 13 onwards ===")
for item in sorted(items, key=lambda x: x.get('createdAt', {}).get('S', ''), reverse=True):
    created = item.get('createdAt', {}).get('S', '')
    if created >= '2026-07-13':
        title = item.get('title', {}).get('S', '')
        status = item.get('status', {}).get('S', '')
        job_id = item.get('jobID', {}).get('S', '')
        location = item.get('location', {}).get('S', '')[:60]
        rate = item.get('hourlyRate', {}).get('N', '')
        total = item.get('totalSalary', {}).get('N', '')
        work_date = item.get('workDate', {}).get('S', '')
        print(f"  JobID: {job_id}")
        print(f"  Title: {title}")
        print(f"  Status: {status}")
        print(f"  Created: {created}")
        print(f"  WorkDate: {work_date} | Rate: {rate} | Total: {total}")
        print(f"  Location: {location}")
        print("  ---")

print("\n=== ALL 'pha che' jobs ===")
for item in items:
    title = item.get('title', {}).get('S', '').lower()
    desc = item.get('description', {}).get('S', '').lower()
    if 'pha ch' in title or 'pha ch' in desc:
        created = item.get('createdAt', {}).get('S', '')
        status = item.get('status', {}).get('S', '')
        job_id = item.get('jobID', {}).get('S', '')
        print(f"  JobID: {job_id} | Status: {status} | Created: {created}")
        print(f"  Title: {item.get('title', {}).get('S', '')}")
        print("  ---")
