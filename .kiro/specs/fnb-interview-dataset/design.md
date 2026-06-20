# Design — Bộ dataset phỏng vấn F&B cho AI Interviewer

## Overview

Nâng chất lượng cuộc phỏng vấn AI (Vòng 2) trong `backend/app/ai_recruitment.py` để AI:
- Giao tiếp tự nhiên, ấm áp, có cảm xúc như một quản lý/chủ quán F&B thực thụ.
- Hiểu và diễn giải lại lời ứng viên (lắng nghe phản chiếu) trước khi hỏi tiếp.
- Đặt câu hỏi và phản hồi chi tiết, đúng bối cảnh từng vị trí F&B.
- Chấm điểm/báo cáo nhất quán hơn theo 4 trục năng lực sẵn có.

Đạt được bằng cách bổ sung một **thư viện dataset F&B** (ngân hàng câu hỏi + few-shot hội thoại mẫu + rubric + style guide) rồi **nhúng có chọn lọc** vào các prompt hiện có.

**Phạm vi & ràng buộc (KHÔNG phá vỡ tính năng/flow khác):**
- Chỉ tác động tới luồng phỏng vấn AI trong `ai_recruitment.py`.
- Thêm 1 file mới `backend/app/fnb_interview_dataset.py` (thuần dữ liệu + hàm chọn lọc, không side-effect).
- Không sửa `models.py`; giữ nguyên schema và 4 trục điểm.
- Không đổi API contract (`/api/v1/interview/start`, `/respond`), tên trường, cấu trúc `turns`/session.
- Giữ nguyên Mock mode và cơ chế fallback model. Dataset chỉ làm giàu prompt cho chế độ Gemini thật.
- Không đụng `screen_cv` (Vòng 1).
- An toàn token: chọn ví dụ theo vị trí, không nhồi toàn bộ dataset.

## Architecture

```
ai_recruitment.py
  ├─ start_interview()                   ──┐
  ├─ respond_interview()                 ──┤ gọi
  ├─ _get_interview_system_instruction() ──┼─> fnb_interview_dataset.py
  ├─ _get_turn_instruction()             ──┤      - get_role_for_title(job_title)
  └─ _generate_interview_report()        ──┘      - build_fewshot_block(role)
                                                  - build_question_hints(role)
                                                  - COMMUNICATION_STYLE_GUIDE
                                                  - SCORING_RUBRIC
```

Điểm tích hợp:
1. `_get_interview_system_instruction` ← thêm style guide + few-shot theo vị trí + quy tắc lắng nghe phản chiếu.
2. `_get_turn_instruction` ← thêm chỉ dẫn đồng cảm + câu hỏi đào sâu (probing) cho từng lượt.
3. `_generate_interview_report` ← gắn rubric để báo cáo chi tiết, có chiều sâu.

Luồng không đổi: frontend → `/interview/start` → `start_interview` (sinh câu hỏi đầu) → `/interview/respond` → `respond_interview` (câu hỏi kế / báo cáo). Dataset chỉ chen vào khâu dựng prompt.

## Components and Interfaces

### Module mới `fnb_interview_dataset.py` (thuần, không side-effect)

- `get_role_for_title(job_title: str) -> dict` — chuẩn hóa (lowercase, bỏ dấu) rồi so khớp `keywords`; không khớp trả `GENERIC_FALLBACK_ROLE`.
- `build_fewshot_block(role: dict, max_examples: int = 3) -> str` — render vài ví dụ hội thoại thành text gọn cho prompt (giới hạn token), kèm chú thích "chỉ học phong cách, không lặp nguyên văn".
- `build_question_hints(role: dict) -> str` — gợi ý câu hỏi theo nhóm năng lực để AI biến tấu, tránh lặp.
- `COMMUNICATION_STYLE_GUIDE: str`, `SCORING_RUBRIC: str` — hằng số text.

### Thay đổi tại `ai_recruitment.py`

- `_get_interview_system_instruction(...)`: gọi `role = get_role_for_title(job_title)`, chèn thêm `COMMUNICATION_STYLE_GUIDE` + `build_fewshot_block(role)` + `build_question_hints(role)` vào cuối prompt hiện có. Không đổi chữ ký hàm.
- `_get_turn_instruction(current_idx, turns)`: bổ sung dòng "nhận xét đồng cảm + diễn giải lại ý ứng viên + 1 câu hỏi đào sâu". Giữ nguyên phân nhánh Custom/Technical/Salary/Wrap-up.
- `_generate_interview_report(session)`: thêm `SCORING_RUBRIC` vào prompt sinh báo cáo. Giữ nguyên schema `InterviewReport` và cách parse JSON.

### Thư viện vị trí (23 vị trí, theo nhóm)

- Front of house: phục vụ bàn, lễ tân/đón khách, thu ngân, order, chạy món, set up bàn tiệc.
- Pha chế & bar: pha chế/barista, bartender, phụ pha chế (bar back).
- Bếp: phụ bếp, đầu bếp/bếp chính, bếp trưởng, bếp bánh/thợ làm bánh, sơ chế.
- Vệ sinh & hỗ trợ: dọn dẹp/tạp vụ, rửa chén/steward, phụ kho/nhận hàng, bảo vệ/giữ xe.
- Giao hàng & ngoài quán: shipper, đóng gói mang đi.
- Quản lý & giám sát: trưởng ca, quản lý cửa hàng, giám sát khu vực.

Mỗi vị trí có `keywords` cả tiếng Việt có dấu/không dấu và tiếng Anh để map ổn định.

## Data Models

Không thay đổi `models.py`. Cấu trúc dữ liệu nội bộ của module mới:

```python
FnbRole = {
    "id": str,                  # vd "waiter"
    "name": str,                # "Phục vụ bàn"
    "keywords": list[str],      # từ khóa map từ job_title
    "question_bank": {
        "experience": list[str],        # kinh nghiệm
        "situation": list[str],         # xử lý tình huống
        "operations": list[str],        # quy trình/vận hành
        "hygiene": list[str],           # vệ sinh ATTP
        "teamwork": list[str],          # phối hợp nhóm
        "service_attitude": list[str],  # thái độ phục vụ
    },
    "fewshot": [
        {
            "question": str,
            "answers": {
                "good": {"text": str, "ai_reply": str},
                "fair": {"text": str, "ai_reply": str},
                "weak": {"text": str, "ai_reply": str},
            }
        }
    ],
}
```

`ai_reply` minh hoạ phong cách: **công nhận/đồng cảm → diễn giải lại ý → câu hỏi đào sâu**. Báo cáo vẫn dùng nguyên 4 trường: `past_experience_score`, `situation_handling_score`, `operations_score`, `custom_questions_score`.

## Correctness Properties

### Property 1: Giữ nguyên API contract
API response schema của `/interview/start` và `/interview/respond` không đổi (các trường JSON trước/sau khi sửa là như nhau).

### Property 2: Role resolver luôn an toàn
`get_role_for_title` với mọi input (kể cả rỗng/None) luôn trả về một role hợp lệ (khớp keywords hoặc `GENERIC_FALLBACK_ROLE`) và không bao giờ ném lỗi.

### Property 3: Mock mode bất biến
Khi không có `GEMINI_API_KEY`, kết quả mock mode giống hệt trước khi thay đổi (dataset không can thiệp).

### Property 4: Ngân sách token có kiểm soát
Prompt sau khi nhúng chỉ thêm tối đa `max_examples` ví dụ few-shot + hints theo nhóm, giữ kích thước prompt trong giới hạn hợp lý.

### Property 5: Cấu trúc phiên không đổi
Số lượng và thứ tự `turns` trong session giữ nguyên so với hiện tại.

## Error Handling

- Import module mới được bọc try/except trong `ai_recruitment.py`; nếu lỗi, fallback về hành vi prompt cũ (degrade an toàn, không sập luồng).
- `get_role_for_title` với input rỗng/None → trả `GENERIC_FALLBACK_ROLE`.
- Vẫn giữ nguyên vòng lặp `get_fallback_models()` và xử lý quota/429 hiện có.
- Không thêm dependency mới (chỉ dữ liệu tĩnh + thư viện chuẩn).

## Testing Strategy

1. Smoke test import module và `get_role_for_title` với job_title: "Phục vụ", "Barista trà sữa", "Tạp vụ", "Bếp trưởng", "Nhân viên lạ" (→ fallback).
2. Chạy `start_interview` (mock) đảm bảo không lỗi và contract giữ nguyên.
3. Nếu có `GEMINI_API_KEY`: chạy 1 phiên start→respond→report cho 2-3 vị trí, kiểm tra câu hỏi/phản hồi tự nhiên và báo cáo JSON hợp lệ.
4. So sánh các trường JSON trả về trước/sau để xác nhận không phá vỡ schema.

## Việc cần ở phía bạn

Mở `d:\AppOpPo\OppoApp` làm workspace trong Kiro (File → Open Folder / Add Folder to Workspace) để tôi chỉnh sửa bằng công cụ chuẩn. Sau khi mở, tôi sẽ tạo `fnb_interview_dataset.py`, sửa 3 điểm tích hợp ở `ai_recruitment.py`, rồi chạy kiểm thử.
