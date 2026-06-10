import boto3
import json
from decimal import Decimal

class DecEnc(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

table = boto3.resource('dynamodb', region_name='ap-southeast-1').Table('CandidateProfiles')
item = table.get_item(Key={'userId': '296aa58c-30a1-70cc-44ed-b829e33a8245'}).get('Item')
with open('cand_profile.json', 'w', encoding='utf-8') as f:
    json.dump(item, f, cls=DecEnc, ensure_ascii=False, indent=2)
