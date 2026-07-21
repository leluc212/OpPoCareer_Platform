<div align="center">

# 🚀 Ốp Pờ — OpPo Career Platform
### Nền Tảng Tuyển Dụng & Việc Làm Nhanh Thế Hệ Mới Hỗ Trợ AI & Cloud-Native AWS

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![AWS Amplify](https://img.shields.io/badge/AWS-Amplify-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/amplify/)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda%20(Python/Node)-FF9900?logo=awslambda&logoColor=white)](https://aws.amazon.com/lambda/)
[![Gemini AI](<https://img.shields.io/badge/AI Engine-Gemini%20AI-8E44AD?logo=google&logoColor=white>)](https://deepmind.google/technologies/gemini/)
[![eKYC Verification](https://img.shields.io/badge/eKYC-VNPT%20%7C%20Didit-10B981?logo=verified&logoColor=white)]()
[![WebSockets](https://img.shields.io/badge/Realtime-API%20Gateway%20WebSockets-009688?logo=socketdotio&logoColor=white)]()

---

**[OpPo Career Platform](https://oppocareer.com)** kết nối 🎯 **Ứng viên**, 🏢 **Nhà tuyển dụng** và 🛠️ **Quản trị viên** trong một hệ sinh thái tuyển dụng hiện đại, minh bạch và tức thì.

[🌐 Trải nghiệm Website](https://oppocareer.com) • [📘 Tài liệu Deploy](file:///d:/OpPoReviewWeb/README_DEPLOY.md) • [✨ Tính năng chính](#-tính-năng-nổi-bật) • [🏗️ Kiến trúc Hệ thống](#%EF%B8%8F-kiến-trúc-kỹ-thuật)

</div>
## 📌 Tổng Quan Dự Án

**Ốp Pờ (OpPo Career)** là nền tảng tuyển dụng thế hệ mới được thiết kế đặc biệt nhằm giải quyết bài toán tuyển dụng tức thì (**Quick Jobs - Việc làm gấp**) và tuyển dụng dài hạn (**Standard Jobs**). 

Hệ thống kết hợp sức mạnh của **Google Gemini AI** để gợi ý công việc dựa trên vị trí địa lý (GPS 10km radius) và bộ kỹ năng, đồng thời ứng dụng công nghệ **eKYC sinh trắc học** để chống tài khoản giả mạo, nâng cao độ tin cậy giữa ứng viên và nhà tuyển dụng.

---

## ✨ Tính Năng Nổi Bật

### 1. 🤖 Động Cơ AI Matching & Smart Recommender (`job_recommender.py`)
- **Thuật toán kép**: Kết hợp giữa thuật toán so khớp khoảng cách GPS Haversine (bán kính < 10km) và mô hình **Google Gemini AI**.
- **Tự động hóa thông báo**: Hệ thống tự động gửi Email thông minh (AWS SES) được cá nhân hóa lý do phù hợp (*Skill-match, Title-match, Proximity-match*) tới ứng viên ngay khi có công việc mới.

### 2. 🛡️ Xác Thực Danh Tính eKYC (VNPT & Didit eKYC Integration)
- Xác thực CCCD / Giấy tờ tùy thân cho ứng viên & doanh nghiệp nhằm ngăn ngừa spam và thông tin giả mạo.
- Hệ thống xét duyệt hồ sơ tự động kết hợp với luồng phê duyệt thủ công từ Admin.

### 3. ⚡ Hệ Thống Realtime & Thông Báo Tức Thì
- Tích hợp **API Gateway WebSockets** & **DynamoDB Streams** giúp phát thông báo tức thì khi có ứng viên nộp đơn hoặc công việc mới được đăng tải.

### 4. 🏢 Phân Hệ Dành Cho Nhà Tuyển Dụng (Employer Portal)
- Đăng tin việc làm nhanh / chuẩn, theo dõi tiến độ ứng tuyển trực quan bằng biểu đồ (Recharts).
- Mua các gói dịch vụ gia tăng (**Spotlight Banners, Hot Search Boost, Priority Listing**) thông qua API Package Subscriptions.

### 5. 👨‍💻 Phân Hệ Ứng Viên (Candidate Portal)
- Tạo & chỉnh sửa hồ sơ chuyên nghiệp, tự động đọc & trích xuất nội dung từ file CV (PDF, DOCX via `mammoth` & `pdf.js`).
- Đăng ký công việc theo ca, tìm kiếm việc làm quanh vị trí hiện tại.

### ⚙️ Phân Hệ Quản Trị (Admin Dashboard)
- Quản lý danh mục gói dịch vụ, duyệt yêu cầu thay đổi thông tin profile, duyệt banner quảng cáo và xem nhật ký giao dịch toàn hệ thống.
## 🛠️ Công Nghệ Sử Dụng

| Tầng | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Styled Components, Framer Motion | Giao diện hiện đại, mượt mà, hỗ trợ animations & glassmorphism |
| **Data Viz & Docs** | Recharts, Mammoth, PDF.js, HTML2Canvas, JSPDF | Biểu đồ báo cáo, đọc/xuất file CV PDF & Word trực tiếp trên web |
| **Cloud Infrastructure** | AWS Amplify, CloudFormation, API Gateway, S3 | Hạ tầng Cloud-Native mở rộng tự động |
| **Backend & Compute** | AWS Lambda (Python 3.x, Node.js), Express (Dev proxy) | Serverless microservices xử lý business logic |
| **Database** | Amazon DynamoDB (Multi-GSI Architecture) | Cơ sở dữ liệu NoSQL hiệu năng cao |
| **AI & ML Engine** | Google Gemini AI API, Custom Haversine Matching Engine | AI gợi ý công việc, tính khoảng cách GPS & matching kỹ năng |
| **Identity & Security** | VNPT eKYC, Didit eKYC API, AWS Cognito | Xác thực sinh trắc học & quản lý người dùng |
| **Communication** | AWS SES, API Gateway WebSockets | Gửi Email giao dịch & thông báo Realtime |
