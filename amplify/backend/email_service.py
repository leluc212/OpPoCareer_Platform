import os
import json
import urllib.request
import urllib.error
import boto3
from botocore.exceptions import ClientError

def send_email(to_email, subject, html_content, text_content=None, from_email=None):
    """
    Sends an email using either Resend or AWS SES based on the EMAIL_PROVIDER environment variable.
    By default, it uses Resend.
    """
    provider = os.environ.get('EMAIL_PROVIDER', 'resend').lower()
    default_sender = os.environ.get('SENDER_EMAIL', 'no-reply@opporeview.com')
    sender = from_email or default_sender
    
    print(f"[EmailService] Sending email to {to_email} using provider: {provider}")
    
    if provider == 'ses':
        return send_via_ses(sender, to_email, subject, html_content, text_content)
    else:
        return send_via_resend(sender, to_email, subject, html_content, text_content)

def send_via_resend(sender, to_email, subject, html_content, text_content=None):
    api_key = os.environ.get('RESEND_API_KEY')
    if not api_key:
        print(" [EmailService] Error: RESEND_API_KEY environment variable is not set.")
        return {'success': False, 'message': 'RESEND_API_KEY is not set.'}
        
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "from": sender,
        "to": [to_email] if isinstance(to_email, str) else to_email,
        "subject": subject,
        "html": html_content
    }
    if text_content:
        payload["text"] = text_content
        
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            print(f"[EmailService] Resend success response: {res_body}")
            return {'success': True, 'message': 'Sent via Resend', 'data': json.loads(res_body)}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"[EmailService] Resend HTTP error: {e.code} - {err_body}")
        return {'success': False, 'message': f"Resend API error {e.code}: {err_body}"}
    except Exception as e:
        print(f"[EmailService] Resend exception: {str(e)}")
        return {'success': False, 'message': str(e)}

def send_via_ses(sender, to_email, subject, html_content, text_content=None):
    region = os.environ.get('AWS_REGION', 'ap-southeast-1')
    ses_client = boto3.client('ses', region_name=region)
    
    destination = {
        'ToAddresses': [to_email] if isinstance(to_email, str) else to_email
    }
    
    body = {
        'Html': {'Data': html_content, 'Charset': 'UTF-8'}
    }
    if text_content:
        body['Text'] = {'Data': text_content, 'Charset': 'UTF-8'}
        
    message = {
        'Subject': {'Data': subject, 'Charset': 'UTF-8'},
        'Body': body
    }
    
    try:
        response = ses_client.send_email(
            Source=sender,
            Destination=destination,
            Message=message
        )
        print(f"[EmailService] SES success response: {json.dumps(response)}")
        return {'success': True, 'message': 'Sent via SES', 'data': response}
    except ClientError as e:
        print(f"[EmailService] AWS SES client error: {e.response['Error']['Message']}")
        return {'success': False, 'message': f"SES error: {e.response['Error']['Message']}"}
    except Exception as e:
        print(f"[EmailService] AWS SES exception: {str(e)}")
        return {'success': False, 'message': str(e)}
