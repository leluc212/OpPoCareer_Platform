import sys
import os
import boto3
sys.path.append(os.path.abspath('amplify/backend'))

# pyrefly: ignore [missing-import]
from job_recommender import recommend_job_to_candidates, candidate_table

# Let's inspect the database candidate records' recommendedJobs type
response = candidate_table.scan()
items = response.get('Items', [])
for cand in items:
    name = cand.get('fullName', cand.get('email', 'N/A'))
    rec_jobs = cand.get('recommendedJobs')
    # Let's inspect the database candidate records' recommendedJobs type
    try:
        name_str = name.encode('ascii', errors='replace').decode('ascii')
        rec_str = str(rec_jobs).encode('ascii', errors='replace').decode('ascii')
        print(f"Candidate: {name_str}, recommendedJobs type: {type(rec_jobs)}, value: {rec_str}")
    except Exception as e:
        print(f"Printing candidate details failed: {e}")

# Let's test recommending a mock standard job
mock_job = {
    'idJob': 'JOB-TEST-12345',
    'title': 'Nhân viên pha chế trà sữa',
    'location': 'Thủ Đức, TP.HCM',
    'jobType': 'part-time',
    'workHours': 'T2,T3,T4,T5,T6 @ 08:00 - 17:00',
    'salary': '25000',
    'salaryUnit': 'hour',
    'tags': 'Pha chế, Trà sữa',
    'description': 'Pha chế trà sữa và phục vụ khách hàng.',
    'requirements': 'Nhanh nhẹn, có kinh nghiệm pha chế.',
    'status': 'active',
    'createdAt': '2026-06-29T12:00:00Z',
    'updatedAt': '2026-06-29T12:00:00Z'
}

print("\nRunning recommend_job_to_candidates for standard job:")
emails_sent = recommend_job_to_candidates(mock_job, is_quick_job=False)
print(f"Emails sent: {emails_sent}")
