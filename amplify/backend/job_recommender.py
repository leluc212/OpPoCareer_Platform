import os
import re
import math
import json
import boto3
from botocore.exceptions import ClientError
from email_service import send_email

def safe_print(msg):
    try:
        print(msg)
    except Exception:
        try:
            print(str(msg).encode('ascii', errors='replace').decode('ascii'))
        except Exception:
            pass

def get_distance_km(lat1, lon1, lat2, lon2):
    try:
        lat1, lon1, lat2, lon2 = map(float, [lat1, lon1, lat2, lon2])
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    except Exception:
        return None

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-1')
candidate_table = dynamodb.Table('CandidateProfiles')

def remove_accents(input_str):
    if not input_str:
        return ""
    # Map Vietnamese accented characters to their unaccented equivalents
    s1 = u'ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỴỵỶỷỸỹ'
    s2 = u'AAAAEEEIIOOOOUUYaaaaeeeiiOOoouuyAaDdIiUuOoUuAaAaAaAaAaAaAaAaAaAaAaAaEeEeEeEeEeEeEeEeIiIiOoOoOoOoOoOoOoOoOoOoOoOoUuUuUuUuUuUuUuYyYyYyYy'
    dict_chars = {ord(x): y for x, y in zip(s1, s2)}
    return input_str.translate(dict_chars)

def is_match(candidate, job, is_quick_job=False):
    # Get candidate info
    cand_loc = (candidate.get('location') or '').strip()
    cand_skills = candidate.get('skills') or []
    cand_title = (candidate.get('title') or '').strip()
    
    # Skip candidate profiles with no skills AND no title to avoid spamming empty profiles
    if not cand_skills and not cand_title:
        return False, []
        
    # Get job info
    job_title = job.get('title') or ''
    job_loc = job.get('location') or ''
    job_desc = job.get('description') or ''
    job_req = job.get('requirements') or ''
    
    # Extract tags
    job_tags = []
    if not is_quick_job:
        tags_raw = job.get('tags') or ''
        if isinstance(tags_raw, str):
            job_tags = [t.strip() for t in tags_raw.split(',') if t.strip()]
        elif isinstance(tags_raw, list):
            job_tags = tags_raw
    else:
        job_tags = job.get('tags') or []

    # 1. Location Matching
    location_ok = False
    
    cand_lat = candidate.get('latitude')
    cand_lng = candidate.get('longitude')
    job_lat = job.get('latitude')
    job_lng = job.get('longitude')
    
    # If GPS coordinates are available for both and it is a quick job, prioritize distance check (within 10km)
    if is_quick_job and cand_lat is not None and cand_lng is not None and job_lat is not None and job_lng is not None:
        dist = get_distance_km(cand_lat, cand_lng, job_lat, job_lng)
        if dist is not None:
            if dist <= 10.0:  # Within 10 kilometers
                location_ok = True
            else:
                return False, []  # Stricter for quick jobs: too far!
                
    if not location_ok:
        cand_loc_clean = remove_accents(cand_loc.lower())
        job_loc_clean = remove_accents(job_loc.lower())
        
        if not cand_loc_clean:
            location_ok = True  # Candidate did not specify location -> matches any
        else:
            # For quick jobs, enforce district level proximity by checking list of districts/sub-regions
            # We want to avoid matching just because they both contain the word "HCM" or "Hồ Chí Minh"
            districts = ['thu duc', 'quan 1', 'quan 2', 'quan 3', 'quan 4', 'quan 5', 'quan 6', 'quan 7', 'quan 8', 'quan 9', 'quan 10', 'quan 11', 'quan 12', 'tan binh', 'binh thanh', 'phu nhuan', 'go vap', 'tan phu', 'binh tan', 'binh chanh', 'hoc mon', 'nha be', 'cu chi']
            hn_districts = ['hoan kiem', 'ba dinh', 'dong da', 'hai ba trung', 'tay ho', 'cau giay', 'thanh xuan', 'hoang mai', 'long bien', 'nam tu liem', 'bac tu liem', 'ha dong', 'thanh tri', 'gia lam', 'dong anh', 'soc son']
            all_districts = districts + hn_districts
            
            # Check for a specific district match
            for dist in all_districts:
                if dist in cand_loc_clean and dist in job_loc_clean:
                    location_ok = True
                    break
            
            if not location_ok:
                # For standard jobs, city-level match is acceptable
                if not is_quick_job:
                    cities = ['hcm', 'ho chi minh', 'ha noi', 'da nang', 'can tho', 'hai phong']
                    for city in cities:
                        if city in cand_loc_clean and city in job_loc_clean:
                            location_ok = True
                            break
                            
                # Fallback to direct string containment (excluding broad city terms for quick jobs)
                if not location_ok:
                    clean_cand_no_city = cand_loc_clean.replace("ho chi minh", "").replace("hcm", "").replace("ha noi", "").replace("da nang", "").strip(", ")
                    clean_job_no_city = job_loc_clean.replace("ho chi minh", "").replace("hcm", "").replace("ha noi", "").replace("da nang", "").strip(", ")
                    
                    if len(clean_cand_no_city) > 2 and len(clean_job_no_city) > 2:
                        if clean_cand_no_city in clean_job_no_city or clean_job_no_city in clean_cand_no_city:
                            location_ok = True
                            
    if not location_ok:
        return False, []
        
    # 2. Skills & Title Matching (Using accented text for output details)
    cand_keywords = []
    for skill in cand_skills:
        cand_keywords.append((remove_accents(skill.lower()), f"Kỹ năng: {skill}"))
        
    if cand_title:
        cand_keywords.append((remove_accents(cand_title.lower()), f"Vị trí mong muốn: {cand_title}"))
        
    # Combine job texts for keyword searching
    job_text = remove_accents((job_title + " " + job_desc + " " + job_req + " " + " ".join(job_tags)).lower())
    
    matched_reasons = []
    for kw, label in cand_keywords:
        if not kw:
            continue
        if kw in job_text:
            matched_reasons.append(label)
            
    # Core Occupational Fallback (if no specific skill/title match found)
    if not matched_reasons:
        occupations = [
            ("pha che", "Pha chế / Barista"),
            ("barista", "Pha chế / Barista"),
            ("phuc vu", "Phục vụ / Server"),
            ("phu kho", "Phụ kho / Logistics"),
            ("bep", "Bếp / Chef"),
            ("chef", "Bếp / Chef"),
            ("thu ngan", "Thu ngân / Cashier"),
            ("cashier", "Thu ngân / Cashier"),
            ("ban hang", "Bán hàng / Sales"),
            ("sales", "Bán hàng / Sales"),
            ("giao hang", "Giao hàng / Shipper"),
            ("shipper", "Giao hàng / Shipper"),
            ("ke toan", "Kế toán / Accounting"),
            ("marketing", "Marketing"),
            ("le tan", "Lễ tân / Receptionist"),
            ("bao ve", "Bảo vệ / Security")
        ]
        cand_text = remove_accents((cand_title + " " + " ".join(cand_skills)).lower())
        job_text_title = remove_accents(job_title.lower())
        for occ_kw, occ_name in occupations:
            if occ_kw in cand_text and (occ_kw in job_text_title or occ_kw in job_text):
                matched_reasons.append(f"Phù hợp lĩnh vực {occ_name}")
                
    return len(matched_reasons) > 0, matched_reasons

def send_recommendation_email(candidate, job, reasons, is_quick_job=False):
    email = candidate.get('email')
    name = candidate.get('fullName') or "Bạn"
    
    job_id = job.get('jobID') if is_quick_job else job.get('idJob')
    job_title = job.get('title', 'Untitled Job')
    company = job.get('companyName') if is_quick_job else job.get('employerName', job.get('employerEmail', 'Công ty tuyển dụng'))
    
    if is_quick_job:
        hourly_rate = job.get('hourlyRate', 0)
        total_hours = job.get('totalHours', 0)
        total_salary = job.get('totalSalary')
        try:
            if total_salary:
                income = int(float(total_salary) * 0.85)
                salary_str = f"{income:,} VNĐ / {total_hours} giờ"
            else:
                income_rate = int(float(hourly_rate) * 0.85)
                salary_str = f"{income_rate:,} VNĐ/giờ"
        except Exception:
            salary_str = f"Thỏa thuận"
    else:
        salary = job.get('salary', 'Thỏa thuận')
        try:
            clean_sal = re.sub(r'\D', '', str(salary))
            if clean_sal:
                val = int(clean_sal)
                salary_str = f"{val:,} VNĐ"
            else:
                salary_str = str(salary)
        except Exception:
            salary_str = str(salary)
        
    location = job.get('location', 'Chưa cập nhật')
    job_type_db = job.get('jobType', 'part-time')
    job_type = "Bán thời gian (Part-time)" if job_type_db == 'part-time' else "Toàn thời gian (Full-time)"
    if is_quick_job:
        job_type = "Việc làm nhanh (Quick Job)"
        
    work_time = ""
    if is_quick_job:
        work_date = job.get('workDate', '')
        start_time = job.get('startTime', '')
        end_time = job.get('endTime', '')
        work_time = f"<p style='margin: 6px 0; color: #475569;'><strong>Thời gian làm việc:</strong> {start_time} - {end_time} ngày {work_date}</p>"
    else:
        work_hours = job.get('workHours', '')
        work_days = job.get('workDays', '')
        if work_hours or work_days:
            work_time = f"<p style='margin: 6px 0; color: #475569;'><strong>Thời gian:</strong> {work_hours} ({work_days})</p>"
            
    reasons_html = ""
    for reason in reasons:
        reasons_html += f"""
        <div style="margin-bottom: 8px; padding-left: 10px; border-left: 3px solid #10b981;">
            <span style="color: #374151; font-size: 14px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">{reason}</span>
        </div>
        """
        
    app_url = "https://oppocareer.com"
    job_link = f"{app_url}/candidate/jobs?selectedJobId={job_id}&tab={'shift' if is_quick_job else 'standard'}"
    
    if is_quick_job:
        subject = f"[Ốp Pờ] [TUYỂN GẤP] Gợi ý việc làm: {job_title} tại {company}"
    else:
        subject = f"[Ốp Pờ] Gợi ý việc làm: {job_title} tại {company}"
    
    urgent_badge_html = ""
    if is_quick_job:
        urgent_badge_html = """
        <div style="margin-bottom: 15px;">
            <span style="background-color: #ef4444; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 12px; font-family: 'Segoe UI', Arial, sans-serif; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase;">
                VIỆC LÀM TUYỂN GẤP
            </span>
        </div>
        """
        
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 10px;">
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);">
                        <!-- Header Banner -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #f8fafc, #eff6ff); border-bottom: 1px solid #e2e8f0; padding: 40px 30px; text-align: center;">
                                <img src="https://opporeview-cv-storage.s3.ap-southeast-1.amazonaws.com/system/logo.png" alt="Ốp Pờ Logo" style="height: 48px; margin-bottom: 10px; display: inline-block; vertical-align: middle;">
                                <h1 style="color: #1e3a8a; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; font-family: 'Segoe UI', Arial, sans-serif;">Ốp Pờ</h1>
                                <p style="color: #475569; margin: 4px 0 0 0; font-size: 14px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif;">Đề xuất việc làm phù hợp cho bạn</p>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 40px 35px; background-color: #ffffff;">
                                <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: 700; font-family: 'Segoe UI', Arial, sans-serif;">Chào {name},</h2>
                                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px; font-family: 'Segoe UI', Arial, sans-serif;">
                                    Chúng tôi tìm thấy một công việc mới phù hợp với năng lực và hồ sơ của bạn trên hệ thống <strong>Ốp Pờ</strong>. Hãy xem các thông tin chi tiết dưới đây:
                                </p>
                                
                                <!-- Match Reasons Card -->
                                <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 14px; padding: 20px; margin-bottom: 30px;">
                                    <h3 style="color: #14532d; margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Segoe UI', Arial, sans-serif;">
                                        Tại sao công việc này phù hợp với bạn?
                                    </h3>
                                    {reasons_html}
                                </div>
                                
                                <!-- Job Details Card -->
                                <div style="border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; background-color: #ffffff; margin-bottom: 35px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
                                    {urgent_badge_html}
                                    <h2 style="color: #1d4ed8; margin-top: 0; margin-bottom: 8px; font-size: 18px; font-weight: 700; font-family: 'Segoe UI', Arial, sans-serif;">
                                        {job_title}
                                    </h2>
                                    <p style="color: #475569; font-weight: 600; font-size: 15px; margin-top: 0; margin-bottom: 18px; font-family: 'Segoe UI', Arial, sans-serif;">
                                        {company}
                                    </p>
                                    
                                    <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; color: #334155; font-size: 14px; line-height: 1.6; font-family: 'Segoe UI', Arial, sans-serif;">
                                        <p style="margin: 6px 0; color: #475569;"><strong>Thu nhập:</strong> <span style="color: #dc2626; font-weight: 700; font-size: 15px;">{salary_str}</span></p>
                                        <p style="margin: 6px 0; color: #475569;"><strong>Địa điểm:</strong> {location}</p>
                                        <p style="margin: 6px 0; color: #475569;"><strong>Loại công việc:</strong> {job_type}</p>
                                        {work_time}
                                    </div>
                                </div>
                                
                                <!-- Action Button -->
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td align="center">
                                            <a href="{job_link}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 15px; text-decoration: none; padding: 15px 38px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3); font-family: 'Segoe UI', Arial, sans-serif;">
                                                Xem Chi Tiết & Ứng Tuyển
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
# Footer
                                <tr>
                                    <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 30px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6; font-family: 'Segoe UI', Arial, sans-serif;">
                                        <p style="margin: 0 0 8px 0;">Email này được gửi tự động từ hệ thống Ốp Pờ.</p>
                                        <p style="margin: 0 0 8px 0;">Địa chỉ liên hệ: <a href="mailto:tuyendung.oppo@oppocareer.com" style="color: #3b82f6; text-decoration: none; font-weight: 500;">tuyendung.oppo@oppocareer.com</a>
                                        <p style="margin: 16px 0 0 0; color: #94a3b8; font-size: 11px;">&copy; 2026 Ốp Pờ. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """
    
    safe_print(f"[Recommender] Dispatching email to {email}")
    res = send_email(email, subject, html_content)
    return res.get('success', False)

def recommend_job_to_candidates(job_item, is_quick_job=False):
    try:
        job_id = job_item.get('jobID') if is_quick_job else job_item.get('idJob')
        safe_print(f"[Recommender] Matching candidates for job {job_id} (is_quick={is_quick_job})")
        
        # Paginated scan CandidateProfiles table
        candidates = []
        response = candidate_table.scan()
        candidates.extend(response.get('Items', []))
        while 'LastEvaluatedKey' in response:
            response = candidate_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            candidates.extend(response.get('Items', []))
            
        active_candidates = []
        for cand in candidates:
            # Must have isActive == True or 'true'
            is_active = cand.get('isActive')
            if not is_active or str(is_active).lower() == 'false':
                continue
            email = cand.get('email')
            if not email or '@' not in email:
                continue
            active_candidates.append(cand)
            
        safe_print(f"[Recommender] Total active candidates scanned: {len(active_candidates)}")
            
        emails_sent = 0
        
        if is_quick_job:
            # Gemini-based recommendation logic for quick/urgent jobs
            job_lat = job_item.get('latitude')
            job_lng = job_item.get('longitude')
            
            # Step 1: Distance filtering (<= 3.0 km) & Deduplication check
            candidates_within_radius = []
            for cand in active_candidates:
                cand_id = cand.get('userId')
                
                # Check if already recommended in Candidate Profile
                if is_job_already_recommended(cand, job_id):
                    safe_print(f"[Recommender] Skipping candidate {cand_id} (already recommended).")
                    continue
                    
                cand_lat = cand.get('latitude')
                cand_lng = cand.get('longitude')
                
                if cand_lat is None or cand_lng is None or job_lat is None or job_lng is None:
                    safe_print(f"[Recommender] Skipping candidate {cand_id} (missing coordinates).")
                    continue
                    
                dist = get_distance_km(cand_lat, cand_lng, job_lat, job_lng)
                if dist is None or dist > 3.0:
                    safe_print(f"[Recommender] Skipping candidate {cand_id} (distance {dist:.2f} km > 3.0 km).")
                    continue
                    
                candidates_within_radius.append(cand)
                
            safe_print(f"[Recommender] Candidates within 3.0 km radius: {len(candidates_within_radius)}")
            
            if not candidates_within_radius:
                return 0
                
            # Step 2: Summarize candidate profiles for Gemini
            summarized_candidates = [_summarize_candidate(c) for c in candidates_within_radius]
            
            # Step 3: Invoke Gemini AI matching
            safe_print(f"[Recommender] Invoking Gemini to analyze {len(summarized_candidates)} candidates...")
            recommendations = call_gemini_recommend_via_api(job_item, summarized_candidates, is_quick_job=True)
            safe_print(f"[Recommender] Gemini returned {len(recommendations)} recommendations.")
            
            # Step 4: Process Gemini results and send emails
            candidate_map = {c.get('userId'): c for c in candidates_within_radius}
            for rec in recommendations:
                cand_id = rec.get('candidateId')
                match_score = rec.get('matchScore', 0)
                match_reason = rec.get('matchReason', '')
                
                if match_score >= 50 and cand_id in candidate_map:
                    cand = candidate_map[cand_id]
                    safe_print(f"[Recommender] Candidate matched by Gemini (score={match_score}): {cand.get('fullName')}")
                    success = send_recommendation_email(cand, job_item, [match_reason], is_quick_job=True)
                    if success:
                        emails_sent += 1
                        mark_job_as_recommended(cand_id, job_id)
                        
        else:
            # Traditional matching logic for standard jobs
            for cand in active_candidates:
                cand_id = cand.get('userId')
                
                # Check if already recommended in Candidate Profile
                if is_job_already_recommended(cand, job_id):
                    safe_print(f"[Recommender] Skipping candidate {cand_id} (already recommended for standard job).")
                    continue
                    
                matched, reasons = is_match(cand, job_item, is_quick_job=False)
                if matched:
                    safe_print(f"[Recommender] Candidate matched (traditional): {cand.get('fullName')} ({cand.get('email')})")
                    success = send_recommendation_email(cand, job_item, reasons, is_quick_job=False)
                    if success:
                        emails_sent += 1
                        mark_job_as_recommended(cand_id, job_id)
                        
        safe_print(f"[Recommender] Processed. Emails sent: {emails_sent}")
        return emails_sent
    except Exception as e:
        safe_print(f"[Recommender] Exception during processing: {str(e)}")
        import traceback
        traceback.print_exc()
        return 0

def recommend_active_jobs_to_candidate(candidate):
    try:
        cand_id = candidate.get('userId')
        safe_print(f"[Recommender] Matching active jobs for candidate {cand_id}")
        
        # 1. Fetch active quick jobs
        qk_table = dynamodb.Table('PostQuickJob')
        response_qk = qk_table.scan(
            FilterExpression='#s = :status',
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':status': 'active'}
        )
        quick_jobs = response_qk.get('Items', [])
        
        # 2. Fetch active standard jobs
        std_table = dynamodb.Table('PostStandardJob')
        response_std = std_table.scan(
            FilterExpression='#s = :status',
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':status': 'active'}
        )
        std_jobs = response_std.get('Items', [])
        
        # Combine jobs (job_item, is_quick_job)
        all_jobs = [(j, True) for j in quick_jobs] + [(j, False) for j in std_jobs]
        
        emails_sent = 0
        for job, is_quick in all_jobs:
            matched, reasons = is_match(candidate, job, is_quick)
            if matched:
                safe_print(f"[Recommender] Active job matched: {job.get('title')} (is_quick={is_quick})")
                success = send_recommendation_email(candidate, job, reasons, is_quick)
                if success:
                    emails_sent += 1
                    
        safe_print(f"[Recommender] Done matching active jobs for candidate. Emails sent: {emails_sent}")
        return emails_sent
    except Exception as e:
        safe_print(f"[Recommender] Error matching active jobs for candidate: {str(e)}")
        import traceback
        traceback.print_exc()
        return 0

# ==========================================
# Gemini AI Recommendation Helpers
# ==========================================

RECOMMENDATION_SCHEMA = {
    "type": "object",
    "properties": {
        "recommendations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "candidateId": {"type": "string"},
                    "fullName": {"type": "string"},
                    "matchScore": {"type": "integer"},
                    "matchReason": {"type": "string"},
                },
                "required": ["candidateId", "fullName", "matchScore", "matchReason"],
            },
        },
    },
    "required": ["recommendations"],
}

def get_gemini_credentials():
    import os
    import json
    import boto3
    # Try Env variables first
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    model = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite").strip()
    if api_key:
        return api_key, model
    
    # Fallback to AWS Secrets Manager
    try:
        secrets_client = boto3.client('secretsmanager', region_name='ap-southeast-1')
        secret = secrets_client.get_secret_value(SecretId='opporeview/gemini')
        secret_json = json.loads(secret['SecretString'])
        key = secret_json.get('GEMINI_API_KEY', '').strip()
        mdl = secret_json.get('GEMINI_MODEL', 'gemini-3.1-flash-lite').strip()
        if key:
            return key, mdl
    except Exception as e:
        safe_print(f"[Gemini Credentials] Failed to retrieve secret from Secrets Manager: {e}")
    return None, "gemini-3.1-flash-lite"

def _recommendation_system_prompt(language, is_quick_job=False):
    output_language = "Vietnamese" if language == "vi" else "English"
    job_type_str = "quick (urgent)" if is_quick_job else "standard"
    return f"""
You are an expert recruitment assistant. Return all prose in {output_language}.
Given a {job_type_str} job posting details and a list of candidate profiles, evaluate the suitability of each candidate for the job.
For each candidate:
1. Rate their match score as an integer from 0 to 100 based on their skills, experience, title, and bio compared to the job requirements and description.
2. Provide a brief, professional explanation (matchReason) in {output_language} summarizing why they are or are not a good fit, highlighting relevant skills or gaps. Keep it concise (1-2 sentences).
Return a JSON object containing a list of recommendations, sorted by matchScore in descending order.
Only include candidates that have a matchScore >= 50. If no candidates match, return an empty list.
Do not invent any information about the candidates or the job.
""".strip()

def _gemini_recommend_payload(validated, candidates):
    is_quick_job = validated.get("isQuickJob", False)
    user_payload = {
        "job": validated["job"],
        "candidates": candidates
    }
    return {
        "systemInstruction": {
            "parts": [{"text": _recommendation_system_prompt(validated["language"], is_quick_job=is_quick_job)}]
        },
        "contents": [{
            "role": "user",
            "parts": [{
                "text": "Recommend candidates for this job:\n" + json.dumps(user_payload, ensure_ascii=False)
            }],
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2500,
            "responseMimeType": "application/json",
            "responseSchema": RECOMMENDATION_SCHEMA,
        },
    }

def _extract_gemini_text(response):
    candidates = response.get("candidates") or []
    if candidates:
        candidate = candidates[0]
        parts = (candidate.get("content") or {}).get("parts") or []
        for part in parts:
            if part.get("text"):
                return part["text"]
    return ""

def call_gemini_recommend_via_api(job_item, candidate_summaries, is_quick_job=True):
    import urllib.request
    import urllib.error
    import json
    
    api_key, model = get_gemini_credentials()
    if not api_key:
        safe_print("[Gemini] API Key not found. Skipping AI recommendation.")
        return []
    
    validated = {
        "job": {
            "title": job_item.get("title", ""),
            "description": job_item.get("description", ""),
            "requirements": job_item.get("requirements", ""),
            "responsibilities": job_item.get("responsibilities", ""),
            "benefits": job_item.get("benefits", ""),
        },
        "language": "vi",
        "isQuickJob": is_quick_job
    }
    
    payload = _gemini_recommend_payload(validated, candidate_summaries)
    
    request = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "x-goog-api-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            res_json = json.loads(response.read().decode("utf-8"))
            candidates_json_str = _extract_gemini_text(res_json)
            if not candidates_json_str:
                safe_print(f"[Gemini] Empty AI response text. Raw response keys: {list(res_json.keys())}")
                return []
            candidates_res = json.loads(candidates_json_str)
            return candidates_res.get("recommendations", [])
    except Exception as e:
        safe_print(f"[Gemini] Error calling Gemini API: {e}")
        return []

def _summarize_candidate(cand):
    uid = cand.get("userId")
    name = cand.get("fullName") or cand.get("email") or "Anonymous"
    title = cand.get("title") or ""
    bio = cand.get("bio") or ""
    skills = cand.get("skills") or []
    experience = cand.get("experience") or ""
    education = cand.get("education") or ""
    return {
        "candidateId": uid,
        "fullName": name,
        "title": title,
        "bio": bio,
        "skills": skills,
        "experience": experience,
        "education": education
    }
def is_job_already_recommended(candidate, job_id):
    rec_jobs = candidate.get('recommendedJobs')
    if not rec_jobs:
        return False
    if isinstance(rec_jobs, set):
        return job_id in rec_jobs
    if isinstance(rec_jobs, list):
        return job_id in rec_jobs
    return False

def mark_job_as_recommended(candidate_id, job_id):
    try:
        candidate_table.update_item(
            Key={'userId': candidate_id},
            UpdateExpression="SET recommendedJobs = list_append(if_not_exists(recommendedJobs, :empty_list), :job_id)",
            ExpressionAttributeValues={
                ':empty_list': [],
                ':job_id': [job_id]
            }
        )
        safe_print(f"[Recommender] Successfully saved recommendation of job {job_id} to candidate {candidate_id} in CandidateProfiles")
        return True
    except Exception as e:
        safe_print(f"[Recommender] Failed to mark job as recommended in CandidateProfiles: {e}")
        return False
