import sys
sys.path.append("amplify/backend")

import boto3
from decimal import Decimal
from job_recommender import recommend_active_jobs_to_candidate

def main():
    print("Testing Candidate active status trigger locally...")
    
    # Get candidate profile from DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
    table = dynamodb.Table('CandidateProfiles')
    
    response = table.scan()
    candidates = response.get('Items', [])
    
    luc = None
    for cand in candidates:
        if 'leluc2200' in cand.get('email', ''):
            luc = cand
            break
            
    if not luc:
        print("Candidate Lê Tấn Lực not found!")
        return
        
    safe_name = luc.get('fullName', 'N/A').encode('ascii', errors='replace').decode('ascii')
    safe_loc = luc.get('location', 'N/A').encode('ascii', errors='replace').decode('ascii')
    print(f"Testing recommendation matching for candidate: {safe_name}...")
    print(f"Location: {safe_loc} | GPS: ({luc.get('latitude')}, {luc.get('longitude')})")
    
    # Run the recommender trigger
    emails_sent = recommend_active_jobs_to_candidate(luc)
    print(f"Testing finished. Total emails sent: {emails_sent}")

if __name__ == '__main__':
    main()
