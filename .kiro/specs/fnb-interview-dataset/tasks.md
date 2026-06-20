# Implementation Plan: Bộ dataset phỏng vấn F&B cho AI Interviewer

## Overview

Triển khai theo từng bước tăng dần: trước tiên dựng module dữ liệu thuần `backend/app/fnb_interview_dataset.py` (hằng số, 23 vị trí FnbRole, role resolver, các hàm dựng khối prompt), sau đó nhúng có chọn lọc vào 3 điểm tích hợp trong `backend/app/ai_recruitment.py` với cơ chế suy giảm an toàn, cuối cùng kiểm chứng bằng property-based test và test tích hợp. Mỗi bước kế thừa kết quả bước trước và kết thúc bằng việc gắn kết (wiring) vào luồng phỏng vấn hiện có, không để lại code mồ côi.

## Tasks

- [ ] 1. Khởi tạo Dataset_Module và hằng số nền tảng
  - [x] 1.1 Tạo khung module `backend/app/fnb_interview_dataset.py` với hằng số và fallback
    - Tạo file mới chỉ dùng dữ liệu tĩnh + thư viện chuẩn Python (không phụ thuộc ngoài)
    - Định nghĩa hằng số text `COMMUNICATION_STYLE_GUIDE` mô tả đúng 3 bước theo thứ tự: (1) công nhận/đồng cảm → (2) diễn giải lại ý → (3) câu hỏi đào sâu
    - Định nghĩa hằng số text `SCORING_RUBRIC` mô tả tiêu chí chấm điểm theo 4 trục năng lực
    - Định nghĩa `GENERIC_FALLBACK_ROLE` là một FnbRole hợp lệ (đủ `id`, `name`, `keywords`, `question_bank`, `fewshot`)
    - Khai báo cấu trúc/typed dict `FnbRole` theo Data Models trong design
    - _Requirements: 3.5, 8.2_

  - [x] 1.2 Định nghĩa 23 FnbRole đầy đủ theo nhóm
    - Khai báo danh sách `FNB_ROLES` gồm đúng 23 vị trí với `id` duy nhất, bao phủ: front of house, pha chế & bar, bếp, vệ sinh & hỗ trợ, giao hàng & ngoài quán, quản lý & giám sát
    - Mỗi role có `keywords` chứa ít nhất một biến thể tiếng Việt có dấu, tiếng Việt không dấu và tiếng Anh
    - Mỗi role có `question_bank` theo các nhóm năng lực (experience, situation, operations, hygiene, teamwork, service_attitude)
    - Mỗi role có `fewshot` với ví dụ hội thoại (question + answers good/fair/weak kèm `ai_reply` minh hoạ phong cách 3 bước)
    - _Requirements: 1.8, 1.9_

  - [ ]* 1.3 Viết unit test cho định nghĩa role
    - Kiểm tra đúng 23 role, `id` duy nhất, đủ các nhóm; mỗi role có đủ 3 biến thể keyword (có dấu/không dấu/tiếng Anh)
    - _Requirements: 1.8, 1.9_

- [x] 2. Triển khai Role_Resolver an toàn
  - [x] 2.1 Implement `get_role_for_title(job_title)`
    - Chuẩn hóa chuỗi: trim, lowercase, bỏ dấu; so khớp với `keywords`
    - Khớp nhiều role → chọn keyword khớp dài nhất; bằng nhau → role đầu tiên theo thứ tự định nghĩa
    - Input None/rỗng/chỉ khoảng trắng hoặc không khớp → trả `GENERIC_FALLBACK_ROLE`
    - Đảm bảo deterministic (cùng input → cùng role) và không bao giờ ném ngoại lệ
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 2.2 Viết property test cho Role_Resolver
    - **Property 2: Role resolver luôn an toàn**
    - **Validates: Requirements 1.5, 1.6, 1.7**

  - [ ]* 2.3 Viết unit test cho luật khớp keyword
    - Kiểm tra longest-match, tie-break theo thứ tự, chuẩn hóa dấu, và tính nhất quán giữa các lần gọi
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Triển khai các hàm dựng khối prompt trong Dataset_Module
  - [x] 3.1 Implement `build_fewshot_block(role, max_examples=3)`
    - Render tối đa `max_examples` ví dụ (mặc định 3, phạm vi hợp lệ 1–10); nếu role có ít ví dụ hơn thì chỉ chèn số thực có, không báo lỗi
    - Kèm chú thích "chỉ học phong cách, không lặp lại nguyên văn"
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 3.2 Implement `build_question_hints(role)`
    - Sinh từ 1 đến 5 gợi ý câu hỏi cho mỗi nhóm năng lực để AI biến tấu thay vì lặp câu cố định
    - _Requirements: 2.5_

  - [x] 3.3 Thêm cơ chế kiểm soát ngân sách token cho phần nội dung chèn thêm
    - Giữ tổng phần chèn (style guide + few-shot + hints) trong giới hạn token cấu hình được (mặc định 2000)
    - Khi vượt giới hạn: cắt giảm theo thứ tự few-shot trước rồi đến hints, luôn giữ `COMMUNICATION_STYLE_GUIDE`
    - _Requirements: 2.7_

  - [ ]* 3.4 Viết property test cho ngân sách token
    - **Property 4: Ngân sách token có kiểm soát**
    - **Validates: Requirements 2.2, 2.7**

- [x] 4. Tích hợp Dataset_Module vào `ai_recruitment.py` với suy giảm an toàn
  - [x] 4.1 Nhúng style guide + few-shot + hints vào `_get_interview_system_instruction`
    - Import Dataset_Module được bọc try/except ở cấp module; lỗi import → fallback prompt cũ và ghi log dấu hiệu lỗi
    - Gọi `get_role_for_title(job_title)`, chèn `COMMUNICATION_STYLE_GUIDE` + `build_fewshot_block(role)` + `build_question_hints(role)` vào CUỐI prompt hiện có, không sửa nội dung prompt gốc
    - Giữ nguyên chữ ký hàm; bọc try/except quanh lời gọi dataset để bỏ qua nội dung dataset khi có ngoại lệ
    - _Requirements: 2.1, 2.6, 2.8, 8.1, 8.4, 8.5_

  - [x] 4.2 Thêm chỉ dẫn đồng cảm + lắng nghe phản chiếu vào `_get_turn_instruction`
    - Khi Session đã có ít nhất một câu trả lời trước: thêm chỉ dẫn nhận xét đồng cảm + diễn giải lại ý câu trả lời gần nhất rồi đặt đúng 1 câu hỏi đào sâu
    - Lượt đầu tiên (chưa có câu trả lời): bỏ phần phản chiếu, chỉ thêm chỉ dẫn đặt đúng 1 câu hỏi mở đầu
    - Giữ nguyên các nhánh Custom/Technical/Salary/Wrap-up và không thay đổi cấu trúc turns
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.3_

  - [x] 4.3 Gắn `SCORING_RUBRIC` vào `_generate_interview_report`
    - Chỉ chèn rubric khi ở chế độ AI thật (không phải Mock_Mode), trước khi gọi mô hình
    - Giữ nguyên schema `InterviewReport` và cơ chế parse JSON; khi parse thất bại trả `InterviewReport` hợp lệ đủ 4 trường điểm + ghi chú điểm yếu chỉ ra lỗi chấm điểm
    - Bọc try/except quanh dataset; giữ nguyên vòng lặp `get_fallback_models()` và xử lý quota/429
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.3, 8.4, 8.6_

- [x] 5. Checkpoint - Đảm bảo toàn bộ test pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Kiểm chứng tính bất biến của hợp đồng và phiên
  - [ ]* 6.1 Viết property test cho API contract
    - **Property 1: Giữ nguyên API contract**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ]* 6.2 Viết property test cho Mock_Mode bất biến
    - **Property 3: Mock mode bất biến**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 6.3 Viết property test cho cấu trúc phiên không đổi
    - **Property 5: Cấu trúc phiên không đổi**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [ ]* 6.4 Viết test tích hợp smoke cho luồng phỏng vấn
    - Smoke test import module + `get_role_for_title` cho "Phục vụ", "Barista trà sữa", "Tạp vụ", "Bếp trưởng", "Nhân viên lạ" (→ fallback)
    - Chạy `start_interview`/`respond_interview` ở Mock_Mode đảm bảo không lỗi và không yêu cầu `GEMINI_API_KEY`
    - _Requirements: 6.3, 8.1, 8.4_

- [x] 7. Checkpoint cuối - Đảm bảo toàn bộ test pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Các task gắn dấu `*` là tùy chọn (test) và có thể bỏ qua để ra MVP nhanh hơn
- Mỗi task tham chiếu tới các sub-requirement cụ thể để truy vết
- Checkpoint đảm bảo kiểm chứng tăng dần
- Property test kiểm chứng các thuộc tính đúng đắn phổ quát (Property 1–5 trong design)
- Unit test/integration test kiểm chứng ví dụ cụ thể và các trường hợp biên
- Mọi thay đổi tuân thủ ràng buộc: không phá vỡ API contract, Mock_Mode, cấu trúc session, hay `models.py`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "1.3"] },
    { "id": 3, "tasks": ["3.1", "2.2", "2.3"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.3"] },
    { "id": 6, "tasks": ["4.1", "3.4"] },
    { "id": 7, "tasks": ["4.2"] },
    { "id": 8, "tasks": ["4.3"] },
    { "id": 9, "tasks": ["6.1", "6.2", "6.3", "6.4"] }
  ]
}
```
