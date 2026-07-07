"""
Fix double-encoded UTF-8 strings in CandidateProfiles DynamoDB table.
Converts Latin-1 misread UTF-8 back to correct Unicode strings.
"""
import boto3
import json

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
table = dynamodb.Table('CandidateProfiles')

def fix_encoding(value):
    """Fix a double-encoded UTF-8 string (was stored as Latin-1)."""
    if not isinstance(value, str):
        return value
    try:
        # Try to encode as latin-1 then decode as utf-8
        fixed = value.encode('latin-1').decode('utf-8')
        if fixed != value:
            return fixed
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass
    return value

def fix_value(val):
    """Recursively fix encoding in any value."""
    if isinstance(val, str):
        return fix_encoding(val)
    elif isinstance(val, list):
        return [fix_value(v) for v in val]
    elif isinstance(val, dict):
        return {k: fix_value(v) for k, v in val.items()}
    return val

def scan_and_fix():
    print("Scanning CandidateProfiles table...")
    
    # Fields that can contain Vietnamese text
    TEXT_FIELDS = ['title', 'location', 'bio', 'fullName', 'skills']
    
    items = []
    result = table.scan()
    items.extend(result.get('Items', []))
    while 'LastEvaluatedKey' in result:
        result = table.scan(ExclusiveStartKey=result['LastEvaluatedKey'])
        items.extend(result.get('Items', []))
    
    print(f"Found {len(items)} items total.")
    
    fixed_count = 0
    for item in items:
        user_id = item.get('userId')
        updates = {}
        
        for field in TEXT_FIELDS:
            original = item.get(field)
            if original is None:
                continue
            fixed = fix_value(original)
            if fixed != original:
                updates[field] = fixed
                print(f"  [{user_id}] {field}: {repr(original)} → {repr(fixed)}")
        
        if updates:
            # Build UpdateExpression
            expr_parts = []
            attr_names = {}
            attr_values = {}
            for i, (key, val) in enumerate(updates.items()):
                expr_parts.append(f'#k{i} = :v{i}')
                attr_names[f'#k{i}'] = key
                attr_values[f':v{i}'] = val
            
            update_expr = 'SET ' + ', '.join(expr_parts)
            table.update_item(
                Key={'userId': user_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=attr_names,
                ExpressionAttributeValues=attr_values
            )
            fixed_count += 1
            print(f"  ✅ Fixed {user_id}")
    
    print(f"\nDone. Fixed {fixed_count} out of {len(items)} profiles.")

if __name__ == '__main__':
    scan_and_fix()
