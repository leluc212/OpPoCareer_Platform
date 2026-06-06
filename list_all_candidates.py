import boto3
import json
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def main():
    dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
    table = dynamodb.Table('CandidateProfiles')
    
    response = table.scan()
    items = response.get('Items', [])
    
    print(f"Total candidates: {len(items)}")
    print(f"{'FullName':<25} | {'Location':<30} | {'Lat':<10} | {'Lng':<10} | {'isActive':<8}")
    print("-" * 90)
    for cand in items:
        name = cand.get('fullName', 'N/A')
        loc = cand.get('location', 'N/A')
        lat = cand.get('latitude', 'None')
        lng = cand.get('longitude', 'None')
        active = cand.get('isActive', 'None')
        
        safe_name = name.encode('ascii', errors='replace').decode('ascii')
        safe_loc = loc.encode('ascii', errors='replace').decode('ascii')
        
        print(f"{safe_name:<25} | {safe_loc:<30} | {str(lat):<10} | {str(lng):<10} | {str(active):<8}")

if __name__ == '__main__':
    main()
