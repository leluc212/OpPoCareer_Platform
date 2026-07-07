# Pre Sign-Up Lambda: Auto-link Google → Native Cognito Accounts

## Vấn đề cần giải quyết

Khi user đã có tài khoản email/password trong Cognito (ví dụ `abc@gmail.com`), rồi bấm
"Đăng nhập với Google" bằng đúng Google account có email `abc@gmail.com`, Cognito mặc định
**tạo ra một user mới hoàn toàn** (dạng `Google_1051234567890`) thay vì dùng lại tài khoản cũ.
Điều này khiến user mất hết dữ liệu liên kết với tài khoản gốc.

Lambda này giải quyết vấn đề đó bằng cách chạy **trước khi** Cognito tạo user mới.

---

## Cách hoạt động

```
User bấm "Đăng nhập Google"
        ↓
Cognito chuẩn bị tạo user "Google_xxx"
        ↓
[PRE SIGN-UP TRIGGER] Lambda này chạy
        ↓
Lambda tìm trong pool: có user native nào cùng email không?
        ↓
Có → Gọi AdminLinkProviderForUser → Google identity gắn vào user native
Không → Để Cognito tạo Google user mới bình thường
        ↓
User đăng nhập thành công với DỮ LIỆU CŨ CỦA HỌ
```

---

## Cấu trúc file

```
infra/lambda/pre-signup-link-accounts/
├── index.js        ← Lambda handler (Node.js, CommonJS)
├── package.json    ← Dependencies (@aws-sdk/client-cognito-identity-provider)
└── README.md       ← File này

amplify/backend/
├── deploy-pre-signup-link-accounts.ps1   ← Script deploy tự động
└── find-duplicate-google-users.js        ← Script tìm tài khoản trùng lặp cũ
```

---

## Deploy (khuyến nghị)

Chạy script PowerShell từ thư mục gốc project:

```powershell
cd d:\OpPoCareer_Platform
.\amplify\backend\deploy-pre-signup-link-accounts.ps1
```

Script sẽ tự động:
1. Cài npm dependencies trong thư mục lambda
2. Đóng gói thành file `.zip`
3. Tạo IAM Role với đúng permissions
4. Tạo / cập nhật Lambda function (Node.js 20.x)
5. Cấp quyền Cognito invoke Lambda
6. Gắn Lambda vào Pre sign-up trigger của User Pool `ap-southeast-1_ShCajkmJd`

---

## Deploy thủ công qua AWS Console (nếu không dùng script)

### Bước 1: Cài dependencies và đóng gói

```powershell
cd infra\lambda\pre-signup-link-accounts
npm install --production
# Chọn tất cả file trong thư mục (index.js + node_modules) → nén thành pre-signup-link-accounts.zip
Compress-Archive -Path ".\*" -DestinationPath "..\..\..\amplify\backend\pre-signup-link-accounts.zip" -Force
```

### Bước 2: Tạo IAM Role

Vào **IAM Console → Roles → Create role**:
- Trusted entity: **Lambda**
- Attach policy: `AWSLambdaBasicExecutionRole`
- Role name: `PreSignUpLinkAccountsRole`

Sau đó thêm Inline Policy (tên: `CognitoLinkAccounts`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "cognito-idp:ListUsers",
      "Resource": "arn:aws:cognito-idp:ap-southeast-1:<ACCOUNT_ID>:userpool/ap-southeast-1_ShCajkmJd"
    },
    {
      "Effect": "Allow",
      "Action": "cognito-idp:AdminLinkProviderForUser",
      "Resource": "arn:aws:cognito-idp:ap-southeast-1:<ACCOUNT_ID>:userpool/ap-southeast-1_ShCajkmJd"
    }
  ]
}
```

Thay `<ACCOUNT_ID>` bằng AWS Account ID thực tế.

### Bước 3: Tạo Lambda function

Vào **Lambda Console → Create function**:
- Function name: `PreSignUpLinkAccounts`
- Runtime: **Node.js 20.x**
- Architecture: x86_64
- Execution role: **Use an existing role** → `PreSignUpLinkAccountsRole`

Upload file zip vừa tạo ở bước 1. Đặt handler: `index.handler`. Timeout: 15s.

### Bước 4: Gắn Lambda vào User Pool

Vào **Cognito Console → User Pools → ap-southeast-1_ShCajkmJd → User pool properties → Lambda triggers**:
- Scroll xuống phần **Authentication**
- Chọn **Pre sign-up** → Chọn Lambda `PreSignUpLinkAccounts`
- Save

---

## Kiểm tra sau deploy

### Xem CloudWatch Logs

Lambda logs tại: `CloudWatch → Log groups → /aws/lambda/PreSignUpLinkAccounts`

Mỗi lần trigger chạy sẽ log:
- `[PreSignUp] Trigger fired. triggerSource: PreSignUp_ExternalProvider`
- `[PreSignUp] Searching for existing native user with email: ...`
- `[PreSignUp] Found existing native user: "..." — will link Google identity.`
- `[PreSignUp] ✅ Successfully linked Google_xxx → native user "..."`

Hoặc nếu không tìm thấy native user:
- `[PreSignUp] No existing native user found for ... New Google account will be created normally.`

### Test thực tế

1. Tạo một tài khoản email/password trên https://oppocareer.com với email test (ví dụ `test@example.com`)
2. Sign out
3. Bấm "Đăng nhập với Google" với đúng Google account có email `test@example.com`
4. Kiểm tra trong Cognito Console: user phải vẫn là 1 user duy nhất, **không xuất hiện `Google_xxx` mới**
5. Đảm bảo user có thể thấy dữ liệu cũ (hồ sơ, đơn ứng tuyển, v.v.)

---

## Xử lý tài khoản trùng lặp đã tạo trước đây

Chạy script sau để phát hiện các cặp trùng lặp đã tồn tại:

```powershell
cd d:\OpPoCareer_Platform
# Đảm bảo @aws-sdk/client-cognito-identity-provider đã cài
cd infra\lambda\pre-signup-link-accounts && npm install && cd ..\..\..
node amplify\backend\find-duplicate-google-users.js
```

Script sẽ in ra danh sách các cặp trùng lặp và các lệnh AWS CLI để merge thủ công.

---

## Lưu ý quan trọng

- Lambda này chỉ xử lý `PreSignUp_ExternalProvider` — các luồng đăng ký thường
  (email/password) **không bị ảnh hưởng**.
- Nếu link thất bại vì bất kỳ lý do gì, Lambda **không throw error** — user vẫn
  đăng nhập được (chỉ có thể tạo duplicate account mới). Fail-open là chủ đích để
  không bao giờ chặn user.
- Không cần sửa code Flutter/Amplify web — fix này nằm hoàn toàn ở tầng Cognito
  và áp dụng cho cả web lẫn mobile app chỉ bằng 1 lần deploy.
