import boto3
import json
from decimal import Decimal

def main():
    dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
    table = dynamodb.Table('CandidateProfiles')
    
    response = table.scan()
    items = response.get('Items', [])
    
    # Let's mock a job post in Tay Ninh to see why they don't match
    job = {
        "jobID": "QJOB-20260607-7GFWO",
        "title": "Nhân viên phục vụ",
        "location": "Trường Trung học cơ sở An Hòa, 221, Nguyễn Du, Lộc An, Trảng Bàng, Phường Trảng Bàng, Tỉnh Tây Ninh",
        "latitude": Decimal("11.032493"),
        "longitude": Decimal("106.335071")
    }
    
    from job_recommender import is_match
    
    print("Evaluating matches for job: Nhan vien phuc vu (Tay Ninh)")

    print("-" * 80)
    for cand in items:
        name = cand.get('fullName', 'N/A')
        email = cand.get('email', 'N/A')
        skills = cand.get('skills', [])
        title = cand.get('title', '')
        loc = cand.get('location', '')
        lat = cand.get('latitude')
        lng = cand.get('longitude')
        
        matched, reasons = is_match(cand, job, is_quick_job=True)
        
        safe_name = name.encode('ascii', errors='replace').decode('ascii')
        safe_loc = loc.encode('ascii', errors='replace').decode('ascii')
        safe_skills = [s.encode('ascii', errors='replace').decode('ascii') for s in skills]
        safe_title = title.encode('ascii', errors='replace').decode('ascii')
        safe_reasons = [r.encode('ascii', errors='replace').decode('ascii') for r in reasons]
        
        print(f"Candidate: {safe_name} ({email})")
        print(f"  Location: '{safe_loc}' | GPS: ({lat}, {lng})")
        print(f"  Skills: {safe_skills} | Title: '{safe_title}'")
        print(f"  MATCHED? {matched} | Reasons: {safe_reasons}")
        print("-" * 50)


if __name__ == '__main__':
    # Add project root to path to import job_recommender
    import sys
    sys.path.append("amplify/backend")
    main()
