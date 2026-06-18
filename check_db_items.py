import boto3

dynamodb = boto3.resource('dynamodb')
client = boto3.client('dynamodb')

tables = client.list_tables()['TableNames']

for table_name in tables:
    table = dynamodb.Table(table_name)
    try:
        response = table.scan()
        items = response.get('Items', [])
        for item in items:
            item_str = str(item)
            if 'FWFXW' in item_str:
                print(f"Match in table {table_name}:")
                for k, v in item.items():
                    if 'FWFXW' in str(v) or k == 'jobId' or k == 'idJob':
                        print(f"  {k}: {v}")
    except Exception as e:
        print(f"Error scanning {table_name}: {e}")


