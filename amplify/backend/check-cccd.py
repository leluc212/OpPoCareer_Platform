import boto3
from decimal import Decimal

table = boto3.resource('dynamodb', region_name='ap-southeast-1').Table('CandidateProfiles')
r = table.scan(
    FilterExpression='email = :e',
    ExpressionAttributeValues={':e': 'duypl2310@gmail.com'}
)
item = r['Items'][0]
cccd = item.get('cccd')
print(f'cccd type: {type(cccd)}')
print(f'cccd value: |{cccd}|')
print(f'cccd len: {len(str(cccd)) if cccd else 0}')
print(f'cccd repr: {cccd!r}')
print(f'is Decimal: {isinstance(cccd, Decimal)}')
print(f'str(cccd): |{str(cccd)}|')

# Also check raw via client API
client = boto3.client('dynamodb', region_name='ap-southeast-1')
resp = client.get_item(
    TableName='CandidateProfiles',
    Key={'userId': {'S': item['userId']}}
)
raw_cccd = resp['Item'].get('cccd', {})
print(f'\nRaw DynamoDB attribute: {raw_cccd}')
