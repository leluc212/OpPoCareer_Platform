import json
import boto3
import hashlib
from decimal import Decimal

# Cấu hình AWS
dynamodb = boto3.resource('dynamodb')
translate = boto3.client('translate')
table = dynamodb.Table('Translations')

def lambda_handler(event, context):
    # AWS Function URL CORS đã được bật trong cấu hình Console, 
    # nên chúng ta KHÔNG được tự thêm headers CORS trong code nữa (tránh bị lặp '*, *')
    headers = {
        'Content-Type': 'application/json'
    }

    # Nếu AWS Console đã xử lý OPTIONS thì code này có thể không cần, 
    # nhưng để an toàn ta vẫn giữ xử lý rỗng.
    method = event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }

    try:
        # 3. Lấy dữ liệu từ Body
        raw_body = event.get('body', '{}')
        if event.get('isBase64Encoded'):
            import base64
            raw_body = base64.b64decode(raw_body).decode('utf-8')
        
        body = json.loads(raw_body)
        text = body.get('text')
        target_lang = body.get('targetLang', 'en')
        source_lang = body.get('sourceLang', 'vi')

        if not text:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Missing text to translate'})
            }

        # 4. Kiểm tra Cache trong DynamoDB
        text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
        cache_response = table.get_item(Key={'textHash': text_hash, 'langCode': target_lang})
        
        if 'Item' in cache_response:
            item = cache_response['Item']
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'translatedText': item['translatedText'],
                    'type': item['type'],
                    'cached': True
                })
            }

        # 5. Gọi AWS Translate nếu chưa có trong Cache
        translate_response = translate.translate_text(
            Text=text,
            SourceLanguageCode=source_lang,
            TargetLanguageCode=target_lang
        )
        translated_text = translate_response['TranslatedText']

        # 6. Lưu vào Cache
        table.put_item(Item={
            'textHash': text_hash,
            'langCode': target_lang,
            'translatedText': translated_text,
            'originalText': text,
            'type': 'machine',
            'createdAt': Decimal('0')
        })

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'translatedText': translated_text,
                'type': 'machine',
                'cached': False
            })
        }

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
