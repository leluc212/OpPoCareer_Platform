# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cho bộ dataset phỏng vấn F&B nhằm làm giàu các prompt của AI Interviewer (Vòng 2) trong `backend/app/ai_recruitment.py`. Tính năng bổ sung một module dữ liệu thuần `backend/app/fnb_interview_dataset.py` gồm: bộ giải vị trí (role resolver), khối ví dụ few-shot, gợi ý câu hỏi theo nhóm năng lực, hướng dẫn phong cách giao tiếp và rubric chấm điểm.

Mục tiêu là giúp AI giao tiếp tự nhiên, ấm áp, biết lắng nghe phản chiếu và đặt câu hỏi đúng bối cảnh từng vị trí F&B, đồng thời chấm điểm/báo cáo nhất quán hơn — mà KHÔNG phá vỡ API contract hiện có, chế độ Mock, cấu trúc phiên (session/turns), hay `models.py`.

## Glossary

- **Dataset_Module**: Module mới `backend/app/fnb_interview_dataset.py`, chứa dữ liệu tĩnh và các hàm chọn lọc thuần (không side-effect).
- **Role_Resolver**: Hàm `get_role_for_title(job_title)` trong Dataset_Module, ánh xạ tiêu đề công việc sang một vị trí F&B.
- **FnbRole**: Cấu trúc dữ liệu vị trí F&B (id, name, keywords, question_bank, fewshot).
- **GENERIC_FALLBACK_ROLE**: Vị trí F&B mặc định được trả về khi không khớp keyword nào.
- **Prompt_Builder**: Tập các hàm dựng prompt trong `ai_recruitment.py` (`_get_interview_system_instruction`, `_get_turn_instruction`).
- **Report_Generator**: Hàm `_generate_interview_report(session)` trong `ai_recruitment.py`.
- **Interview_API**: Các endpoint `/api/v1/interview/start` và `/api/v1/interview/respond`.
- **Mock_Mode**: Chế độ chạy khi không có `GEMINI_API_KEY`, trả kết quả giả lập.
- **Communication_Style_Guide**: Hằng số text hướng dẫn phong cách giao tiếp (công nhận/đồng cảm → diễn giải lại ý → câu hỏi đào sâu).
- **Scoring_Rubric**: Hằng số text mô tả tiêu chí chấm điểm theo 4 trục năng lực.
- **Session**: Đối tượng phiên phỏng vấn chứa danh sách `turns`.
- **AI_Interviewer**: Luồng phỏng vấn AI Vòng 2 trong `ai_recruitment.py`.

## Requirements

### Requirement 1: Giải vị trí an toàn từ tiêu đề công việc

**User Story:** Là người vận hành tuyển dụng F&B, tôi muốn hệ thống tự nhận diện vị trí F&B từ tiêu đề công việc, để AI có thể đặt câu hỏi đúng bối cảnh mà không bao giờ bị lỗi.

#### Acceptance Criteria

1. WHEN một `job_title` không rỗng (sau khi loại bỏ khoảng trắng đầu/cuối có ít nhất 1 ký tự) được cung cấp, THE Role_Resolver SHALL chuẩn hóa chuỗi (loại bỏ khoảng trắng đầu/cuối, chuyển chữ thường, bỏ dấu) rồi so khớp với `keywords` của các FnbRole.
2. WHEN nhiều FnbRole cùng khớp với `job_title` đã chuẩn hóa, THE Role_Resolver SHALL trả về FnbRole có `keyword` khớp dài nhất (số ký tự lớn nhất); nếu vẫn bằng nhau, SHALL trả về FnbRole đầu tiên theo thứ tự định nghĩa trong Dataset_Module.
3. WHEN đúng một FnbRole khớp với `job_title` đã chuẩn hóa, THE Role_Resolver SHALL trả về FnbRole đó.
4. THE Role_Resolver SHALL trả về cùng một FnbRole cho cùng một giá trị `job_title` ở mọi lần gọi.
5. IF không có FnbRole nào khớp với `job_title`, THEN THE Role_Resolver SHALL trả về GENERIC_FALLBACK_ROLE.
6. IF `job_title` là None, là chuỗi rỗng, hoặc chỉ gồm khoảng trắng, THEN THE Role_Resolver SHALL trả về GENERIC_FALLBACK_ROLE.
7. THE Role_Resolver SHALL trả về một FnbRole hợp lệ cho mọi đầu vào và SHALL hoàn tất mà không ném ngoại lệ.
8. THE Dataset_Module SHALL định nghĩa đúng 23 FnbRole, mỗi FnbRole có định danh duy nhất, bao phủ các nhóm: front of house, pha chế & bar, bếp, vệ sinh & hỗ trợ, giao hàng & ngoài quán, quản lý & giám sát.
9. THE Dataset_Module SHALL cung cấp cho mỗi FnbRole một danh sách `keywords` chứa ít nhất một biến thể cho mỗi loại: tiếng Việt có dấu, tiếng Việt không dấu và tiếng Anh.

### Requirement 2: Làm giàu system prompt với phong cách, few-shot và gợi ý câu hỏi trong giới hạn token

**User Story:** Là người vận hành tuyển dụng, tôi muốn prompt hệ thống được bổ sung phong cách giao tiếp và ví dụ theo vị trí, để AI hỏi tự nhiên và đúng ngữ cảnh mà không làm prompt phình to quá mức.

#### Acceptance Criteria

1. WHEN dựng system instruction, THE Prompt_Builder SHALL gọi Role_Resolver với `job_title` rồi chèn Communication_Style_Guide, khối few-shot và gợi ý câu hỏi của FnbRole đó vào cuối prompt hiện có mà không sửa đổi nội dung prompt gốc.
2. THE Dataset_Module SHALL giới hạn khối few-shot ở tối đa `max_examples` ví dụ (mặc định 3, phạm vi hợp lệ 1–10) cho mỗi lần dựng prompt.
3. IF số ví dụ few-shot khả dụng của FnbRole nhỏ hơn `max_examples`, THEN THE Dataset_Module SHALL chỉ chèn số ví dụ thực tế hiện có mà không báo lỗi.
4. THE Dataset_Module SHALL kèm chú thích trong khối few-shot rằng AI chỉ học phong cách và không lặp lại nguyên văn.
5. THE Dataset_Module SHALL sinh từ 1 đến 5 gợi ý câu hỏi cho mỗi nhóm năng lực để AI biến tấu thay vì lặp lại câu hỏi cố định.
6. IF không tìm thấy FnbRole khớp (Role_Resolver trả về GENERIC_FALLBACK_ROLE), THEN THE Prompt_Builder SHALL vẫn chèn nội dung của GENERIC_FALLBACK_ROLE và giữ nguyên prompt gốc.
7. THE Dataset_Module SHALL giữ tổng phần nội dung chèn thêm (style guide + few-shot + gợi ý câu hỏi) trong giới hạn token cấu hình được (mặc định 2000 token); khi vượt giới hạn, SHALL cắt giảm theo thứ tự few-shot trước rồi đến gợi ý câu hỏi, đồng thời luôn giữ Communication_Style_Guide.
8. THE Prompt_Builder SHALL giữ nguyên chữ ký hàm `_get_interview_system_instruction`.

### Requirement 3: Phản hồi đồng cảm và lắng nghe phản chiếu theo từng lượt

**User Story:** Là ứng viên F&B, tôi muốn AI ghi nhận và diễn giải lại câu trả lời của tôi trước khi hỏi tiếp, để buổi phỏng vấn cảm thấy tự nhiên và được lắng nghe.

#### Acceptance Criteria

1. WHEN dựng chỉ dẫn cho một lượt phỏng vấn mà Session đã chứa ít nhất một câu trả lời trước đó của ứng viên, THE Prompt_Builder SHALL thêm chỉ dẫn yêu cầu AI đưa ra một nhận xét đồng cảm và diễn giải lại ý của câu trả lời gần nhất của ứng viên trước khi đặt câu hỏi tiếp theo.
2. WHEN dựng chỉ dẫn cho một lượt phỏng vấn, THE Prompt_Builder SHALL thêm chỉ dẫn yêu cầu AI đặt đúng một (1) câu hỏi đào sâu trong lượt đó.
3. IF đang dựng chỉ dẫn cho lượt phỏng vấn đầu tiên (Session chưa chứa câu trả lời nào của ứng viên), THEN THE Prompt_Builder SHALL bỏ qua phần diễn giải phản chiếu và chỉ thêm chỉ dẫn đặt đúng một (1) câu hỏi mở đầu.
4. THE Prompt_Builder SHALL giữ nguyên các nhánh xử lý lượt hiện có (Custom, Technical, Salary, Wrap-up).
5. THE Communication_Style_Guide SHALL mô tả trình tự phong cách gồm đúng ba bước theo thứ tự: (1) công nhận/đồng cảm → (2) diễn giải lại ý → (3) câu hỏi đào sâu.

### Requirement 4: Báo cáo chấm điểm theo rubric với 4 trục năng lực không đổi

**User Story:** Là nhà tuyển dụng, tôi muốn báo cáo phỏng vấn chi tiết và nhất quán theo rubric, để đánh giá ứng viên đáng tin cậy hơn.

#### Acceptance Criteria

1. WHEN sinh báo cáo phỏng vấn ở chế độ AI (không phải Mock_Mode), THE Report_Generator SHALL chèn toàn bộ nội dung Scoring_Rubric vào prompt trước khi gọi mô hình.
2. THE Report_Generator SHALL trả về báo cáo chứa đúng 4 trường điểm số nguyên trong khoảng 0–100: `past_experience_score`, `situation_handling_score`, `operations_score`, `custom_questions_score`.
3. THE Report_Generator SHALL giữ nguyên schema `InterviewReport` (không thêm, xóa, hay đổi tên trường) và cơ chế parse JSON hiện có.
4. IF việc parse JSON của báo cáo từ mô hình thất bại, THEN THE Report_Generator SHALL trả về một `InterviewReport` hợp lệ với đầy đủ 4 trường điểm và một ghi chú điểm yếu chỉ ra lỗi chấm điểm của AI.

### Requirement 5: Giữ nguyên API contract của Interview_API

**User Story:** Là kỹ sư tích hợp frontend, tôi muốn API phỏng vấn không thay đổi cấu trúc dữ liệu, để các tính năng phía client tiếp tục hoạt động không cần sửa.

#### Acceptance Criteria

1. WHEN client gọi `/api/v1/interview/start`, THE Interview_API SHALL trả về response giữ nguyên tập tên trường JSON, kiểu dữ liệu từng trường và cấu trúc lồng nhau như trước khi áp dụng dataset (không thêm, không xóa, không đổi tên trường).
2. WHEN client gọi `/api/v1/interview/respond`, THE Interview_API SHALL trả về response giữ nguyên tập tên trường JSON, kiểu dữ liệu từng trường và cấu trúc lồng nhau như trước khi áp dụng dataset (không thêm, không xóa, không đổi tên trường).
3. IF một lỗi xảy ra trong khi xử lý request, THEN THE Interview_API SHALL trả về cấu trúc response lỗi giống như trước khi áp dụng dataset.
4. THE AI_Interviewer SHALL không thêm, xóa, hay đổi tên bất kỳ trường nào trong các cấu trúc dữ liệu của `models.py`.

### Requirement 6: Bất biến của Mock_Mode

**User Story:** Là kỹ sư phát triển, tôi muốn chế độ Mock cho kết quả y như trước, để có thể phát triển và kiểm thử mà không cần khóa Gemini.

#### Acceptance Criteria

1. WHILE biến môi trường `GEMINI_API_KEY` không tồn tại hoặc rỗng, THE AI_Interviewer SHALL kích hoạt Mock_Mode và trả về phản hồi có cùng tập trường JSON và cùng cấu trúc với phản hồi Mock_Mode trước khi bổ sung dataset.
2. WHILE Mock_Mode đang hoạt động, THE AI_Interviewer SHALL sinh nội dung phản hồi mà không gọi Dataset_Module và không chèn Communication_Style_Guide, khối few-shot, gợi ý câu hỏi hay Scoring_Rubric vào nội dung trả về.
3. WHILE Mock_Mode đang hoạt động, THE AI_Interviewer SHALL hoàn tất các endpoint `/api/v1/interview/start` và `/api/v1/interview/respond` mà không ném ngoại lệ và không yêu cầu `GEMINI_API_KEY`.

### Requirement 7: Giữ nguyên cấu trúc phiên phỏng vấn

**User Story:** Là nhà tuyển dụng, tôi muốn số lượng và thứ tự các lượt phỏng vấn không đổi, để trải nghiệm phỏng vấn nhất quán với hiện tại.

#### Acceptance Criteria

1. WHEN khởi tạo và tiến hành một phiên phỏng vấn, THE AI_Interviewer SHALL tạo ra số lượng `turns` trong Session bằng đúng số lượng `turns` được tạo bởi luồng phỏng vấn trước khi tích hợp Dataset_Module, không thêm và không bớt bất kỳ lượt nào.
2. WHEN tiến hành một phiên phỏng vấn, THE AI_Interviewer SHALL sắp xếp các loại lượt (Custom, Technical, Salary, Wrap-up) trong Session theo đúng thứ tự của luồng phỏng vấn trước khi tích hợp Dataset_Module.
3. THE Dataset_Module SHALL không thêm, xóa, hợp nhất, hay sắp xếp lại bất kỳ `turn` nào trong Session.

### Requirement 8: Suy giảm an toàn khi gặp lỗi và không thêm phụ thuộc

**User Story:** Là người vận hành hệ thống, tôi muốn luồng phỏng vấn vẫn chạy ngay cả khi dataset gặp sự cố, để dịch vụ không bị gián đoạn.

#### Acceptance Criteria

1. IF việc import Dataset_Module thất bại, THEN THE AI_Interviewer SHALL dựng prompt theo hành vi cũ (prompt không chứa nội dung dataset) và tiếp tục luồng phỏng vấn mà không ném ngoại lệ ra Interview_API.
2. THE Dataset_Module SHALL chỉ sử dụng dữ liệu tĩnh và thư viện chuẩn của Python, và SHALL không khai báo hoặc yêu cầu bất kỳ phụ thuộc bên ngoài mới nào.
3. THE AI_Interviewer SHALL giữ nguyên vòng lặp `get_fallback_models()` hiện có.
4. IF một hàm bất kỳ của Dataset_Module ném ngoại lệ trong khi dựng prompt hoặc sinh báo cáo, THEN THE AI_Interviewer SHALL bỏ qua nội dung dataset cho lần gọi đó, tiếp tục bằng prompt cũ, và SHALL không ném ngoại lệ ra Interview_API.
5. IF việc import Dataset_Module hoặc một hàm của nó thất bại, THEN THE AI_Interviewer SHALL ghi nhận một dấu hiệu lỗi (log) chỉ ra nguyên nhân suy giảm cho người vận hành mà không làm gián đoạn phản hồi trả về cho ứng viên.
6. THE AI_Interviewer SHALL giữ nguyên cơ chế xử lý quota/lỗi 429 hiện có khi gọi mô hình.
