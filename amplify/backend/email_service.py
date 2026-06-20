import os
import json
import urllib.request
import urllib.error
import boto3
from botocore.exceptions import ClientError

def send_email(to_email, subject, html_content, text_content=None, from_email=None, provider=None):
    """
    Sends an email using either Resend or AWS SES based on the EMAIL_PROVIDER environment variable.
    By default, it uses Resend.
    """
    if not provider:
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


# ==========================================
# CUSTOM EMAIL TEMPLATES & HELPERS
# ==========================================

def wrap_layout(subject, content):
    """
    Helper to wrap layout elements (header, body card, footer) into a single HTML structure.
    Uses modern typography and brand-matching colors, with absolutely NO icons or emojis.
    """
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 30px 10px;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
                    <!-- Header Banner -->
                    <tr>
                        <td style="background-color: #1e40af; padding: 35px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">Ốp Pờ</h1>
                            <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 14px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Hệ thống kết nối cơ hội nghề nghiệp</p>
                        </td>
                    </tr>
                    <!-- Main Body Content -->
                    <tr>
                        <td style="padding: 40px 35px; background-color: #ffffff; text-align: left;">
                            {content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 26px 30px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;">
                            <p style="margin: 0 0 6px 0;">Email này được gửi tự động từ hệ thống Ốp Pờ.</p>
                            <p style="margin: 0 0 6px 0;">Mọi thắc mắc và hỗ trợ vui lòng liên hệ: <a href="mailto:tuyendung.oppo@oppocareer.com" style="color: #1e40af; text-decoration: none; font-weight: 600;">tuyendung.oppo@oppocareer.com</a></p>
                            <p style="margin: 14px 0 0 0; color: #94a3b8; font-size: 11px;">&copy; 2026 Ốp Pờ. Bảo lưu mọi quyền.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""


def send_noreply_email(to_email, subject, html_content):
    """
    Helper to send email explicitly from noreply@oppocareer.com using AWS SES.
    """
    return send_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        from_email='noreply@oppocareer.com',
        provider='ses'
    )


def send_admin_approval_email(job, is_quick_job=False):
    """
    Sends an email to the Admin requesting approval for a standard or quick job.
    """
    admin_email = os.environ.get('ADMIN_EMAIL', 'lucltse184288@fpt.edu.vn')
    
    # Extract details safely depending on the job category type
    if is_quick_job:
        job_id = job.get('jobID') or job.get('idJob', '---')
        job_title = job.get('title', 'Việc làm nhanh')
        employer_name = job.get('companyName') or job.get('employerEmail') or 'Nhà tuyển dụng'
        category_type = 'Việc làm nhanh (Quick Job)'
        
        # Salary/Rate
        hourly_rate = job.get('hourlyRate')
        total_salary = job.get('totalSalary')
        total_hours = job.get('totalHours')
        if total_salary:
            salary_str = f"{int(float(total_salary)):,} VNĐ / {total_hours} giờ"
        elif hourly_rate:
            salary_str = f"{int(float(hourly_rate)):,} VNĐ/giờ"
        else:
            salary_str = "Thỏa thuận"
            
        # Work Time
        work_date = job.get('workDate', '---')
        start_time = job.get('startTime', '---')
        end_time = job.get('endTime', '---')
        work_time = f"{start_time} - {end_time} ngày {work_date}"
    else:
        job_id = job.get('idJob', '---')
        job_title = job.get('title', 'Công việc tiêu chuẩn')
        employer_name = job.get('employerName') or job.get('employerEmail') or 'Nhà tuyển dụng'
        category_type = 'Công việc tiêu chuẩn (Standard Job)'
        
        # Salary
        salary = job.get('salary')
        if salary:
            try:
                import re
                clean_sal = re.sub(r'\D', '', str(salary))
                if clean_sal:
                    salary_str = f"{int(clean_sal):,} VNĐ"
                else:
                    salary_str = str(salary)
            except Exception:
                salary_str = str(salary)
        else:
            salary_str = "Thỏa thuận"
            
        # Work Time
        work_hours = job.get('workHours', '')
        work_days = job.get('workDays', '')
        work_time = f"{work_hours} ({work_days})" if (work_hours or work_days) else "Theo thỏa thuận"

    employer_email = job.get('employerEmail', '---')
    location = job.get('location', 'Chưa cập nhật')
    created_at = job.get('createdAt', '---')
    if 'T' in created_at:
        try:
            created_at = created_at.split('T')[0]
        except Exception:
            pass

    subject = f"[Duyệt Bài] Yêu cầu phê duyệt tin tuyển dụng: {job_title}"
    
    content = f"""
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Yêu cầu duyệt tin tuyển dụng</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
        Kính gửi Ban Quản trị,<br><br>
        Hệ thống vừa ghi nhận một tin tuyển dụng mới được đăng tải bởi Nhà tuyển dụng và đang chờ phê duyệt để hiển thị công khai trên hệ thống. Dưới đây là thông tin chi tiết:
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6; color: #334155;">
            <tr>
                <td width="35%" style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Tiêu đề công việc:</td>
                <td style="padding: 6px 0; vertical-align: top; color: #0f172a; font-weight: 600;">{job_title}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Nhà tuyển dụng:</td>
                <td style="padding: 6px 0; vertical-align: top;">{employer_name} ({employer_email})</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Hình thức:</td>
                <td style="padding: 6px 0; vertical-align: top; color: #1e40af; font-weight: 500;">{category_type}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Thu nhập:</td>
                <td style="padding: 6px 0; vertical-align: top; color: #dc2626; font-weight: 600;">{salary_str}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Địa điểm:</td>
                <td style="padding: 6px 0; vertical-align: top;">{location}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Thời gian:</td>
                <td style="padding: 6px 0; vertical-align: top;">{work_time}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Ngày gửi yêu cầu:</td>
                <td style="padding: 6px 0; vertical-align: top;">{created_at}</td>
            </tr>
        </table>
    </div>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <a href="https://oppocareer.com/admin/jobs" target="_blank" style="display: inline-block; background-color: #1e40af; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.2);">
                    Truy cập Trang Quản trị
                </a>
            </td>
        </tr>
    </table>
    """
    
    html_content = wrap_layout(subject, content)
    return send_noreply_email(admin_email, subject, html_content)


def send_employer_approved_email(job, is_quick_job=False):
    """
    Sends an email to the Employer confirming that their standard or quick job has been approved by the admin.
    """
    employer_email = job.get('employerEmail')
    if not employer_email:
        print("[EmailService] No employer email found to send approval notification.")
        return {'success': False, 'message': 'No employer email.'}
        
    # Extract details safely
    if is_quick_job:
        job_id = job.get('jobID') or job.get('idJob', '---')
        job_title = job.get('title', 'Việc làm nhanh')
        category_type = 'Việc làm nhanh (Quick Job)'
        
        # Salary/Rate
        hourly_rate = job.get('hourlyRate')
        total_salary = job.get('totalSalary')
        total_hours = job.get('totalHours')
        if total_salary:
            salary_str = f"{int(float(total_salary)):,} VNĐ / {total_hours} giờ"
        elif hourly_rate:
            salary_str = f"{int(float(hourly_rate)):,} VNĐ/giờ"
        else:
            salary_str = "Thỏa thuận"
            
        tab_type = 'shift'
    else:
        job_id = job.get('idJob', '---')
        job_title = job.get('title', 'Công việc tiêu chuẩn')
        category_type = 'Công việc tiêu chuẩn (Standard Job)'
        
        # Salary
        salary = job.get('salary')
        if salary:
            try:
                import re
                clean_sal = re.sub(r'\D', '', str(salary))
                if clean_sal:
                    salary_str = f"{int(clean_sal):,} VNĐ"
                else:
                    salary_str = str(salary)
            except Exception:
                salary_str = str(salary)
        else:
            salary_str = "Thỏa thuận"
            
        tab_type = 'standard'

    updated_at = job.get('updatedAt', '---')
    if 'T' in updated_at:
        try:
            updated_at = updated_at.split('T')[0]
        except Exception:
            pass

    job_url = f"https://oppocareer.com/candidate/jobs?selectedJobId={job_id}&tab={tab_type}"
    subject = f"[Xác Nhận] Tin tuyển dụng đã được duyệt thành công: {job_title}"
    
    content = f"""
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Tin tuyển dụng đã được duyệt thành công</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
        Kính gửi Nhà tuyển dụng,<br><br>
        Tin tuyển dụng của bạn trên hệ thống <strong>Ốp Pờ</strong> đã được phê duyệt thành công bởi Ban Quản trị. Tin đăng hiện tại đã hiển thị công khai và sẵn sàng nhận hồ sơ ứng tuyển từ các ứng viên.
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6; color: #334155;">
            <tr>
                <td width="35%" style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Tiêu đề công việc:</td>
                <td style="padding: 6px 0; vertical-align: top; color: #0f172a; font-weight: 600;">{job_title}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Hình thức:</td>
                <td style="padding: 6px 0; vertical-align: top;">{category_type}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Mức lương:</td>
                <td style="padding: 6px 0; vertical-align: top; color: #dc2626; font-weight: 600;">{salary_str}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Thời gian duyệt:</td>
                <td style="padding: 6px 0; vertical-align: top;">{updated_at}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Trạng thái:</td>
                <td style="padding: 6px 0; vertical-align: top; color: #10b981; font-weight: 600;">Đang hoạt động (Active)</td>
            </tr>
        </table>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
        Chúc bạn sớm tìm kiếm được những ứng viên phù hợp nhất cho doanh nghiệp của mình.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <a href="{job_url}" target="_blank" style="display: inline-block; background-color: #1e40af; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.2);">
                    Xem Tin tuyển dụng
                </a>
            </td>
        </tr>
    </table>
    """
    
    html_content = wrap_layout(subject, content)
    return send_noreply_email(employer_email, subject, html_content)


def send_new_application_email(application):
    """
    Sends an email to the Employer notifying them that a Candidate has submitted a CV for their job.
    """
    employer_email = application.get('employerEmail')
    if not employer_email:
        print("[EmailService] No employer email found to send new application notification.")
        return {'success': False, 'message': 'No employer email.'}
        
    job_title = application.get('jobTitle', '---')
    candidate_email = application.get('candidateEmail', '---')
    cv_filename = application.get('cvFilename', 'CV.pdf')
    cv_url = application.get('cvUrl', '#')
    
    applied_at = application.get('appliedAt', '---')
    if 'T' in applied_at:
        try:
            applied_at = applied_at.split('T')[0]
        except Exception:
            pass

    subject = f"[Ứng Tuyển Mới] Ứng viên ứng tuyển vị trí: {job_title}"
    
    content = f"""
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Ứng tuyển mới từ ứng viên</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
        Kính gửi Nhà tuyển dụng,<br><br>
        Hệ thống ghi nhận một ứng viên vừa nộp hồ sơ ứng tuyển thành công cho vị trí <strong>{job_title}</strong> của bạn trên hệ thống Ốp Pờ. Dưới đây là thông tin chi tiết:
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6; color: #334155;">
            <tr>
                <td width="35%" style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Vị trí ứng tuyển:</td>
                <td style="padding: 6px 0; vertical-align: top; color: #0f172a; font-weight: 600;">{job_title}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Email ứng viên:</td>
                <td style="padding: 6px 0; vertical-align: top; color: #0f172a;">{candidate_email}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Tên tệp hồ sơ:</td>
                <td style="padding: 6px 0; vertical-align: top;">{cv_filename}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top; color: #475569;">Thời gian nộp:</td>
                <td style="padding: 6px 0; vertical-align: top;">{applied_at}</td>
            </tr>
        </table>
    </div>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
        <tr>
            <td align="center">
                <a href="{cv_url}" target="_blank" style="display: inline-block; background-color: #1e40af; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.2); width: 220px; text-align: center;">
                    Xem Tệp CV Ứng Viên
                </a>
            </td>
        </tr>
    </table>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <a href="https://oppocareer.com/employer/hr" target="_blank" style="display: inline-block; background-color: #ffffff; color: #1e40af; border: 1px solid #1e40af; font-weight: 600; font-size: 15px; text-decoration: none; padding: 13px 30px; border-radius: 8px; width: 220px; text-align: center;">
                    Quản lý Tuyển dụng
                </a>
            </td>
        </tr>
    </table>
    """
    
    html_content = wrap_layout(subject, content)
    return send_noreply_email(employer_email, subject, html_content)


def send_application_result_email(application, new_status):
    """
    Sends an email to the Candidate notifying them whether their CV has been accepted or rejected by the employer.
    """
    candidate_email = application.get('candidateEmail')
    if not candidate_email:
        print("[EmailService] No candidate email found to send application result.")
        return {'success': False, 'message': 'No candidate email.'}
        
    job_title = application.get('jobTitle', '---')
    employer_name = application.get('employerName') or application.get('employerEmail') or 'Nhà tuyển dụng'
    
    if new_status == 'accepted':
        subject = f"[Kết Quả Ứng Tuyển] Hồ sơ của bạn đã được chấp nhận cho vị trí: {job_title}"
        content = f"""
        <h2 style="color: #10b981; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Hồ sơ của bạn đã được chấp nhận</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
            Xin chào,<br><br>
            Hệ thống <strong>Ốp Pờ</strong> xin vui mừng thông báo rằng nhà tuyển dụng <strong>{employer_name}</strong> đã xem xét hồ sơ của bạn và chính thức <strong>chấp nhận hồ sơ</strong> của bạn cho vị trí dưới đây:
        </p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6; color: #14532d;">
                <tr>
                    <td width="35%" style="font-weight: 600; padding: 6px 0; vertical-align: top;">Vị trí ứng tuyển:</td>
                    <td style="padding: 6px 0; vertical-align: top; font-weight: 600;">{job_title}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; padding: 6px 0; vertical-align: top;">Nhà tuyển dụng:</td>
                    <td style="padding: 6px 0; vertical-align: top;">{employer_name}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; padding: 6px 0; vertical-align: top;">Trạng thái hồ sơ:</td>
                    <td style="padding: 6px 0; vertical-align: top; font-weight: 600;">Được chấp nhận (Accepted)</td>
                </tr>
            </table>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Nhà tuyển dụng sẽ liên hệ trực tiếp với bạn qua email, số điện thoại hoặc hệ thống trò chuyện (chat) của <strong>Ốp Pờ</strong> trong thời gian tới để trao đổi chi tiết về các bước tiếp theo. Vui lòng thường xuyên kiểm tra hộp thư và trang quản lý cá nhân.
        </p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center">
                    <a href="https://oppocareer.com/candidate/dashboard" target="_blank" style="display: inline-block; background-color: #1e40af; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.2);">
                        Truy cập Trang Cá Nhân
                    </a>
                </td>
            </tr>
        </table>
        """
    elif new_status == 'approved':
        subject = f"[Kết Quả Ứng Tuyển] CV của bạn đã được duyệt cho vị trí: {job_title}"
        content = f"""
        <h2 style="color: #1e40af; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">CV của bạn đã được duyệt vòng 1</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
            Xin chào,<br><br>
            Hệ thống <strong>Ốp Pờ</strong> xin thông báo rằng nhà tuyển dụng <strong>{employer_name}</strong> đã xem xét và chính thức <strong>duyệt CV (Vòng 1)</strong> của bạn cho vị trí dưới đây.
        </p>
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6; color: #1e3a8a;">
                <tr>
                    <td width="35%" style="font-weight: 600; padding: 6px 0; vertical-align: top;">Vị trí ứng tuyển:</td>
                    <td style="padding: 6px 0; vertical-align: top; font-weight: 600;">{job_title}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; padding: 6px 0; vertical-align: top;">Nhà tuyển dụng:</td>
                    <td style="padding: 6px 0; vertical-align: top;">{employer_name}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; padding: 6px 0; vertical-align: top;">Trạng thái hồ sơ:</td>
                    <td style="padding: 6px 0; vertical-align: top; font-weight: 600;">Đã duyệt CV (Approved)</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; padding: 6px 0; vertical-align: top;">Yêu cầu tiếp theo:</td>
                    <td style="padding: 6px 0; vertical-align: top; font-weight: 600; color: #dc2626;">Thực hiện phỏng vấn với AI trong vòng 2 ngày</td>
                </tr>
            </table>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Để hoàn tất quy trình tuyển dụng, bạn cần truy cập vào hệ thống <strong>Ốp Pờ</strong> và tiến hành buổi <strong>Phỏng vấn với AI (Vòng 2) trong vòng 2 ngày</strong> kể từ khi nhận được thông báo này.
        </p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center">
                    <a href="https://oppocareer.com/candidate/dashboard" target="_blank" style="display: inline-block; background-color: #1e40af; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.2);">
                        Phỏng vấn với AI ngay
                    </a>
                </td>
            </tr>
        </table>
        """
    elif new_status == 'rejected':
        subject = f"[Kết Quả Ứng Tuyển] Phản hồi về hồ sơ ứng tuyển vị trí: {job_title}"
        content = f"""
        <h2 style="color: #475569; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Phản hồi về hồ sơ ứng tuyển</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
            Xin chào,<br><br>
            Cảm ơn bạn đã quan tâm và nộp hồ sơ ứng tuyển cho vị trí <strong>{job_title}</strong> tại nhà tuyển dụng <strong>{employer_name}</strong> qua hệ thống <strong>Ốp Pờ</strong>.<br><br>
            Sau khi xem xét kỹ lưỡng thông tin hồ sơ của bạn, nhà tuyển dụng rất tiếc phải thông báo rằng kinh nghiệm và các kỹ năng hiện tại của bạn chưa hoàn toàn phù hợp với các tiêu chí cần thiết cho vị trí này ở thời điểm hiện tại.
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6; color: #475569;">
                <tr>
                    <td width="35%" style="font-weight: 600; padding: 6px 0; vertical-align: top;">Vị trí ứng tuyển:</td>
                    <td style="padding: 6px 0; vertical-align: top; font-weight: 600; color: #0f172a;">{job_title}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; padding: 6px 0; vertical-align: top;">Nhà tuyển dụng:</td>
                    <td style="padding: 6px 0; vertical-align: top; color: #0f172a;">{employer_name}</td>
                </tr>
                <tr>
                    <td style="font-weight: 600; padding: 6px 0; vertical-align: top;">Trạng thái hồ sơ:</td>
                    <td style="padding: 6px 0; vertical-align: top; font-weight: 600; color: #ef4444;">Chưa phù hợp (Rejected)</td>
                </tr>
            </table>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Thông tin hồ sơ của bạn sẽ được lưu trữ bảo mật trong hệ thống của chúng tôi để đề xuất cho các vị trí công việc khác phù hợp hơn trong tương lai. Hệ thống <strong>Ốp Pờ</strong> chúc bạn gặp nhiều may mắn và gặt hái được nhiều thành công trên con đường phát triển sự nghiệp của mình.
        </p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center">
                    <a href="https://oppocareer.com/candidate/jobs" target="_blank" style="display: inline-block; background-color: #1e40af; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.2);">
                        Tìm Kiếm Việc Làm Khác
                    </a>
                </td>
            </tr>
        </table>
        """
    else:
        return {'success': False, 'message': f'Unsupported status {new_status} for email notification.'}
        
    html_content = wrap_layout(subject, content)
    return send_noreply_email(candidate_email, subject, html_content)


def send_employer_interview_completed_email(application):
    """
    Sends an email to the Employer notifying them that a Candidate has completed the AI Interview (Round 2).
    """
    employer_email = application.get('employerEmail')
    if not employer_email:
        print("[EmailService] No employer email found to send interview completed notification.")
        return {'success': False, 'message': 'No employer email.'}
        
    job_title = application.get('jobTitle', '---')
    candidate_name = application.get('fullName') or application.get('candidateName') or application.get('candidateEmail') or 'Ứng viên'
    candidate_email = application.get('candidateEmail', '---')
    score = application.get('aiInterviewScore') or 0
    
    subject = f"[Phỏng Vấn AI] Ứng viên đã hoàn thành phỏng vấn: {candidate_name}"
    
    content = f"""
    <h2 style="color: #6b21a8; margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Kết quả phỏng vấn AI hoàn thành</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
        Kính gửi Nhà tuyển dụng,<br><br>
        Ứng viên <strong>{candidate_name}</strong> ({candidate_email}) ứng tuyển vị trí <strong>{job_title}</strong> đã hoàn thành buổi phỏng vấn AI (Vòng 2) trên hệ thống Ốp Pờ. Dưới đây là kết quả sơ bộ:
    </p>
    <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.6; color: #581c87;">
            <tr>
                <td width="35%" style="font-weight: 600; padding: 6px 0; vertical-align: top;">Tên ứng viên:</td>
                <td style="padding: 6px 0; vertical-align: top; font-weight: 600; color: #0f172a;">{candidate_name}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top;">Vị trí ứng tuyển:</td>
                <td style="padding: 6px 0; vertical-align: top; color: #0f172a;">{job_title}</td>
            </tr>
            <tr>
                <td style="font-weight: 600; padding: 6px 0; vertical-align: top;">Điểm phỏng vấn AI:</td>
                <td style="padding: 6px 0; vertical-align: top; font-weight: 600; color: #6b21a8; font-size: 16px;">{score}/100</td>
            </tr>
        </table>
    </div>
    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
        Hệ thống đã cập nhật kết quả phỏng vấn chi thức cùng bản ghi âm cuộc trò chuyện vào hồ sơ ứng viên. Vui lòng truy cập trang quản lý tuyển dụng để nghe lại audio phỏng vấn và đưa ra quyết định tuyển dụng cuối cùng.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center">
                <a href="https://oppocareer.com/employer/hr" target="_blank" style="display: inline-block; background-color: #6b21a8; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(107, 33, 168, 0.2);">
                    Quản lý Tuyển dụng
                </a>
            </td>
        </tr>
    </table>
    """
    
    html_content = wrap_layout(subject, content)
    return send_noreply_email(employer_email, subject, html_content)
