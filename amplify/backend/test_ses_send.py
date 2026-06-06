import os
import sys

# Add current directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from email_service import send_email

# Set temporary environment variables for local testing
os.environ['EMAIL_PROVIDER'] = 'ses'
os.environ['SENDER_EMAIL'] = 'tuyendung.oppo@oppocareer.com'

to_email = 'tuyendung.oppo@oppocareer.com'
subject = 'Test AWS SES Integration'
html_content = """
<html>
<body>
    <h2 style="color: #1e40af;">AWS SES Test Email</h2>
    <p>This is a test email sent from the local environment using AWS SES.</p>
    <p><strong>Sender:</strong> tuyendung.oppo@oppocareer.com</p>
    <p><strong>Provider:</strong> AWS SES</p>
</body>
</html>
"""

print(f"Sending test email to {to_email}...")
result = send_email(to_email, subject, html_content)
print("Result:", result)
