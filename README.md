<div align="center">

# 🚀 Ốp Pờ — OpPo Career Platform

### Nền tảng tuyển dụng nhanh ứng dụng AI và kiến trúc Cloud-Native trên AWS

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge\&logo=react\&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge\&logo=vite\&logoColor=white)](https://vite.dev/)
[![AWS Amplify](https://img.shields.io/badge/AWS-Amplify-FF9900?style=for-the-badge\&logo=awsamplify\&logoColor=white)](https://aws.amazon.com/amplify/)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-FF9900?style=for-the-badge\&logo=awslambda\&logoColor=white)](https://aws.amazon.com/lambda/)
[![Amazon DynamoDB](https://img.shields.io/badge/Amazon-DynamoDB-4053D6?style=for-the-badge\&logo=amazondynamodb\&logoColor=white)](https://aws.amazon.com/dynamodb/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_AI-8E75B2?style=for-the-badge\&logo=googlegemini\&logoColor=white)](https://ai.google.dev/)
[![Amazon Cognito](https://img.shields.io/badge/Amazon-Cognito-DD344C?style=for-the-badge\&logo=amazonaws\&logoColor=white)](https://aws.amazon.com/cognito/)
[![WebSocket](https://img.shields.io/badge/Realtime-WebSocket-010101?style=for-the-badge\&logo=socketdotio\&logoColor=white)](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)

---

**[OpPo Career Platform](https://oppocareer.com)** kết nối **ứng viên**, **nhà tuyển dụng** và **quản trị viên** trong một hệ sinh thái tuyển dụng nhanh, minh bạch và có khả năng mở rộng.

[🌐 Truy cập Website](https://oppocareer.com) · [✨ Tính năng](#-tính-năng-nổi-bật) · [🧰 Công nghệ](#-công-nghệ-sử-dụng) · [🏗️ Kiến trúc](#️-kiến-trúc-và-tối-ưu-hệ-thống)

</div>

---

## 📌 Tổng quan dự án

**Ốp Pờ — OpPo Career** là nền tảng tuyển dụng được xây dựng nhằm hỗ trợ hai nhóm nhu cầu chính:

* **Quick Jobs:** Các công việc cần tuyển nhanh, làm việc theo ca hoặc trong thời gian ngắn.
* **Standard Jobs:** Các vị trí tuyển dụng dài hạn với quy trình ứng tuyển và sàng lọc đầy đủ.

Nền tảng kết hợp **Google Gemini AI**, dữ liệu kỹ năng và vị trí địa lý để hỗ trợ đề xuất công việc phù hợp. Hệ thống cũng tích hợp **eKYC** nhằm tăng độ tin cậy của hồ sơ, hạn chế tài khoản giả mạo và hỗ trợ quá trình xác minh ứng viên, doanh nghiệp.

OpPo Career được phát triển theo định hướng **serverless-first**, sử dụng các dịch vụ AWS để giảm chi phí vận hành, đơn giản hóa triển khai và hỗ trợ mở rộng theo lưu lượng thực tế.

---

## ✨ Tính năng nổi bật

### 🤖 1. AI Matching và Job Recommendation

Hệ thống đề xuất công việc dựa trên nhiều tiêu chí thay vì chỉ phụ thuộc hoàn toàn vào AI:

* Tính khoảng cách giữa ứng viên và địa điểm làm việc bằng công thức **Haversine**.
* Ưu tiên các công việc nằm trong bán kính được cấu hình, mặc định khoảng **10 km**.
* So khớp kỹ năng, vị trí mong muốn, chức danh và thông tin hồ sơ.
* Sử dụng **Google Gemini AI** để phân tích mức độ phù hợp sau bước lọc ban đầu.
* Giải thích lý do đề xuất như:

  * Skill match
  * Job title match
  * Location proximity
  * Profile relevance

Cách tiếp cận nhiều giai đoạn giúp hạn chế các yêu cầu AI không cần thiết và tối ưu chi phí token.

---

### 🪪 2. Xác thực danh tính eKYC

OpPo Career tích hợp các dịch vụ **VNPT eKYC** và **Didit** để hỗ trợ:

* Xác minh CCCD hoặc giấy tờ tùy thân.
* Đối chiếu khuôn mặt và thông tin định danh.
* Hạn chế tài khoản giả mạo, spam và hồ sơ không đáng tin cậy.
* Hỗ trợ xác minh cho cả ứng viên và doanh nghiệp.
* Kết hợp quy trình kiểm tra tự động với phê duyệt thủ công từ quản trị viên.

Trạng thái xác minh được sử dụng như một tín hiệu bổ sung trong quy trình ứng tuyển và xét duyệt tài khoản.

---

### ⚡ 3. Thông báo theo thời gian thực

Hệ thống sử dụng **Amazon API Gateway WebSocket APIs** kết hợp với các sự kiện từ backend để cập nhật dữ liệu gần như tức thời.

Các sự kiện được hỗ trợ gồm:

* Ứng viên nộp đơn vào vị trí tuyển dụng.
* Nhà tuyển dụng cập nhật trạng thái hồ sơ.
* Công việc mới được tạo hoặc phê duyệt.
* Người dùng nhận thông báo trong hệ thống.
* Quản trị viên xử lý các yêu cầu cần xét duyệt.

Thiết kế này giúp giảm nhu cầu tải lại trang và nâng cao trải nghiệm người dùng.

---

### 🏢 4. Employer Portal

Phân hệ dành cho nhà tuyển dụng hỗ trợ:

* Tạo và quản lý tin tuyển dụng.
* Đăng **Quick Jobs** hoặc **Standard Jobs**.
* Theo dõi danh sách ứng viên theo từng trạng thái.
* Xem báo cáo và biểu đồ tuyển dụng bằng **Recharts**.
* Sàng lọc ứng viên dựa trên hồ sơ, CV và kết quả đánh giá AI.
* Quản lý lịch sử gói dịch vụ và giao dịch.
* Đăng ký các dịch vụ gia tăng:

  * Spotlight Banner
  * Hot Search Boost
  * Priority Listing

---

### 👤 5. Candidate Portal

Phân hệ dành cho ứng viên cung cấp:

* Tạo và cập nhật hồ sơ nghề nghiệp.
* Tải lên CV định dạng PDF hoặc DOCX.
* Trích xuất nội dung CV trực tiếp trên trình duyệt bằng `pdf.js` và `mammoth`.
* Nhận gợi ý cải thiện CV dựa trên nội dung đã cung cấp.
* Tìm kiếm công việc theo kỹ năng, từ khóa và vị trí hiện tại.
* Đăng ký công việc theo ca.
* Theo dõi trạng thái ứng tuyển.
* Tham gia vòng phỏng vấn AI khi nhà tuyển dụng kích hoạt tính năng.

---

### 🛠️ 6. Admin Dashboard

Phân hệ quản trị hỗ trợ vận hành và kiểm soát hệ thống:

* Quản lý người dùng và trạng thái xác minh.
* Duyệt yêu cầu cập nhật thông tin hồ sơ.
* Duyệt doanh nghiệp và hồ sơ eKYC.
* Quản lý danh mục gói dịch vụ.
* Kiểm duyệt banner quảng cáo.
* Theo dõi yêu cầu đăng ký gói.
* Kiểm tra lịch sử giao dịch.
* Theo dõi các sự kiện và hoạt động quan trọng trong hệ thống.

---

## 🧰 Công nghệ sử dụng

| Tầng hệ thống              | Công nghệ                                        | Vai trò                                              |
| -------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| **Frontend**               | React 18, Vite, Styled Components, Framer Motion | Xây dựng giao diện người dùng và hiệu ứng tương tác  |
| **Data Visualization**     | Recharts                                         | Hiển thị biểu đồ và thống kê tuyển dụng              |
| **Document Processing**    | PDF.js, Mammoth.js, HTML2Canvas, jsPDF           | Đọc, phân tích và xuất dữ liệu CV                    |
| **Hosting & Deployment**   | AWS Amplify, AWS CloudFormation                  | Triển khai frontend và quản lý hạ tầng               |
| **API Layer**              | Amazon API Gateway                               | Cung cấp REST API và WebSocket API                   |
| **Backend**                | AWS Lambda với Python và Node.js                 | Xử lý nghiệp vụ theo mô hình serverless              |
| **Database**               | Amazon DynamoDB                                  | Lưu trữ dữ liệu NoSQL và hỗ trợ nhiều access pattern |
| **Object Storage**         | Amazon S3                                        | Lưu CV, tài liệu, hình ảnh và tệp tải lên            |
| **AI Engine**              | Google Gemini API                                | Matching, phân tích CV và hỗ trợ đánh giá ứng viên   |
| **Location Matching**      | Haversine Formula                                | Tính khoảng cách giữa ứng viên và công việc          |
| **Authentication**         | Amazon Cognito                                   | Đăng nhập, phân quyền và quản lý người dùng          |
| **Identity Verification**  | VNPT eKYC, Didit                                 | Xác minh danh tính và giấy tờ                        |
| **Email**                  | Amazon SES                                       | Gửi email giao dịch và thông báo                     |
| **Realtime Communication** | API Gateway WebSockets                           | Truyền thông báo theo thời gian thực                 |

---

## 🏗️ Kiến trúc và tối ưu hệ thống

### ☁️ Serverless-first Architecture

Backend được chia thành các Lambda function theo từng nhóm nghiệp vụ, chẳng hạn:

* Authentication và user profile
* Job management
* Job application
* AI matching
* AI interview
* Package subscription
* Notification
* Payment và transaction
* Admin moderation

Kiến trúc này giúp từng chức năng có thể triển khai, giám sát và mở rộng tương đối độc lập.

---

### 💰 Cost Optimization

#### AI Request Pre-filtering

Trước khi gọi Gemini API, hệ thống thực hiện các bước kiểm tra:

1. Kiểm tra độ đầy đủ của hồ sơ ứng viên.
2. Lọc theo vị trí và bán kính tìm kiếm.
3. So khớp kỹ năng và chức danh cơ bản.
4. Chỉ gửi các trường hợp tiềm năng đến AI để đánh giá sâu hơn.

Điều này giúp giảm số lần gọi AI và tránh tiêu thụ token cho các trường hợp không phù hợp rõ ràng.

#### DynamoDB Data Projection

Các truy vấn sử dụng `ProjectionExpression` khi phù hợp để:

* Chỉ lấy các thuộc tính cần thiết.
* Giảm lượng dữ liệu trả về.
* Hạn chế chi phí đọc không cần thiết.
* Cải thiện thời gian phản hồi của API.

#### Direct S3 Upload

Các tệp lớn như CV, ảnh hồ sơ hoặc tài liệu xác minh được tải trực tiếp lên Amazon S3 bằng **presigned URL**.

Lambda chỉ xử lý metadata và quyền truy cập thay vì truyền toàn bộ nội dung tệp.

#### Pay-per-use Infrastructure

Hệ thống sử dụng các dịch vụ có khả năng mở rộng theo nhu cầu như:

* AWS Lambda
* DynamoDB On-Demand
* Amazon S3
* API Gateway
* AWS Amplify

Mô hình này phù hợp với nền tảng có lưu lượng biến động và giúp hạn chế chi phí tài nguyên nhàn rỗi.

---

## 🎯 AI-Powered ATS Pipeline

Quy trình ATS được thiết kế theo nhiều lớp kiểm tra.

### Bước 1 — Identity Gate

Ứng viên hoàn thành xác minh danh tính khi công việc hoặc nhà tuyển dụng yêu cầu.

Mục tiêu:

* Hạn chế hồ sơ giả.
* Tăng độ tin cậy.
* Giảm hành vi spam ứng tuyển.

### Bước 2 — Profile và CV Screening

Hệ thống phân tích:

* Thông tin hồ sơ.
* Nội dung CV.
* Kỹ năng.
* Kinh nghiệm.
* Mức độ liên quan với mô tả công việc.

Kết quả AI được xem là một tín hiệu hỗ trợ sàng lọc, không thay thế hoàn toàn quyết định của nhà tuyển dụng.

### Bước 3 — AI Interview

Ứng viên có thể tham gia vòng phỏng vấn bằng văn bản hoặc giọng nói.

Hệ thống hỗ trợ:

* Tạo câu hỏi dựa trên mô tả công việc.
* Đánh giá câu trả lời theo tiêu chí định sẵn.
* Tổng hợp điểm mạnh và điểm cần cải thiện.
* Sinh báo cáo `aiInterviewReport` cho nhà tuyển dụng tham khảo.

### Bước 4 — Employer Review

Nhà tuyển dụng xem lại:

* Hồ sơ ứng viên.
* CV.
* Kết quả matching.
* Báo cáo phỏng vấn AI.
* Trạng thái eKYC.

Quyết định cuối cùng vẫn thuộc về nhà tuyển dụng.

---

## 💳 Payment và Wallet Workflow

Đối với các Quick Jobs có luồng thanh toán, hệ thống hỗ trợ:

* Ghi nhận giao dịch giữa ứng viên và nhà tuyển dụng.
* Cập nhật trạng thái hoàn thành công việc.
* Xử lý số dư ví theo quy tắc nghiệp vụ.
* Ghi lại lịch sử giao dịch để phục vụ đối soát.
* Hỗ trợ quy trình hoàn tiền hoặc thay thế ứng viên khi đáp ứng điều kiện.

Các tỷ lệ thanh toán và hoàn tiền được quản lý theo cấu hình nghiệp vụ của nền tảng.

---

## 📊 Kết quả thử nghiệm nội bộ

Các số liệu dưới đây được ghi nhận trong môi trường thử nghiệm hoặc dùng làm mục tiêu tối ưu kỹ thuật. Kết quả thực tế có thể thay đổi tùy theo dữ liệu, cấu hình AWS, giới hạn API và lưu lượng sử dụng.

| Hạng mục                   |                      Kết quả hoặc mục tiêu | Phương pháp tối ưu                                    |
| -------------------------- | -----------------------------------------: | ----------------------------------------------------- |
| **Số lượng AI request**    |          Giảm đáng kể sau bước lọc ban đầu | Lọc theo vị trí, kỹ năng và độ đầy đủ hồ sơ           |
| **DynamoDB data transfer** |           Giảm dữ liệu đọc không cần thiết | `ProjectionExpression` và thiết kế access pattern     |
| **AI response latency**    | Khoảng vài giây trong điều kiện thử nghiệm | Mô hình phản hồi nhanh, JSON output và giới hạn token |
| **Concurrent processing**  |      Tự động mở rộng theo giới hạn dịch vụ | AWS Lambda và kiến trúc event-driven                  |
| **File upload overhead**   |                        Giảm tải cho Lambda | S3 presigned URL                                      |
| **Realtime notification**  |                  Cập nhật gần như tức thời | API Gateway WebSocket APIs                            |

> Các benchmark chính thức cần được kiểm chứng thêm bằng công cụ load testing, CloudWatch Metrics, AWS X-Ray và dữ liệu production thực tế.

---

## 🔐 Security Highlights

Một số biện pháp bảo mật đang được áp dụng hoặc định hướng triển khai:

* Xác thực và quản lý phiên đăng nhập bằng Amazon Cognito.
* Phân quyền theo vai trò Candidate, Employer và Admin.
* Sử dụng presigned URL có thời hạn cho tệp trên S3.
* Không công khai trực tiếp thông tin xác thực của dịch vụ bên thứ ba.
* Lưu secret và API key thông qua biến môi trường hoặc dịch vụ quản lý secret.
* Kiểm tra định dạng và nội dung đầu vào tại API.
* Giới hạn quyền IAM theo nguyên tắc **least privilege**.
* Ghi log các thao tác quan trọng phục vụ kiểm tra và xử lý sự cố.
* Kết hợp eKYC với quy trình kiểm duyệt tài khoản.

---

## 🗂️ Cấu trúc dự án tham khảo

```text
oppo-career-platform/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── hooks/
│   ├── services/
│   ├── contexts/
│   ├── utils/
│   └── assets/
├── amplify/
├── backend/
│   ├── functions/
│   ├── layers/
│   ├── templates/
│   └── scripts/
├── public/
├── docs/
└── README.md
```

---

## 🚀 Định hướng phát triển

* Cải thiện chất lượng AI matching bằng dữ liệu phản hồi thực tế.
* Bổ sung cơ chế giải thích kết quả AI rõ ràng hơn.
* Xây dựng hệ thống đánh giá độ tin cậy của nhà tuyển dụng.
* Hoàn thiện quy trình chống gian lận trong AI Interview.
* Tăng cường monitoring bằng Amazon CloudWatch và AWS X-Ray.
* Bổ sung dashboard theo dõi chi phí AI và AWS.
* Tối ưu DynamoDB access pattern cho dữ liệu quy mô lớn.
* Tích hợp thêm các kênh thông báo như push notification.
* Hoàn thiện kiểm thử tải và benchmark trên môi trường production-like.

---

## 🌐 Website

Truy cập nền tảng tại:

### https://oppocareer.com

---

<div align="center">

### 🚀 OpPo Career Platform

**Making job connections faster, smarter and more trustworthy.**

Built with React, AWS Serverless and Google Gemini AI.

</div>
