# Giai đoạn 26 - Trải nghiệm demo hoàn chỉnh

Giai đoạn này hoàn thiện lớp trải nghiệm cho project sandbox. Nó không biến các adapter mô phỏng thành kết nối ngân hàng/acquirer thật.

## Portal

| Đường dẫn | Chức năng |
| --- | --- |
| `/payment-links` | Tạo, xem danh sách và mở Payment Link công khai |
| `/payment-links/{id}` | Chi tiết QR, mã thanh toán, hạn dùng và trạng thái |
| `/transactions/{id}` | Chi tiết bank transaction và kết quả matching |
| `/developers` | API key, webhook filter/auth, test, replay, DLQ, secret rotation và alert |
| `/organization` | Thành viên, vai trò, gói dịch vụ và quota |
| `/acquirer` | Authorize, 3DS, capture, void, refund và dispute sandbox |
| `/platform` | Merchant, KYB, onboarding, khóa/mở tài khoản và soft reset sandbox |

Portal yêu cầu đăng nhập và kiểm tra RBAC tại cả middleware lẫn BFF. Platform Admin chỉ nhận platform key phía server; key không được đưa xuống trình duyệt.

## Realtime và cảnh báo

- `GET /v1/payment_links/public/{slug}/events` phát `payment_link.status` qua SSE sau khi transaction commit.
- Public Payment Link dùng SSE làm kênh chính và polling 15 giây làm kênh dự phòng.
- `MockWebhookAlertWorker` mô phỏng gửi Email/Slack/Telegram, che địa chỉ trong log và chuyển alert từ `PENDING` sang `SENT`.
- Profile production mặc định dùng `placeholder` và bị readiness gate từ chối cho tới khi cấu hình một alert provider thật.

## Reset sandbox

`POST /v1/sandbox/reset` là soft reset dành cho OWNER. Nó đóng Payment Link đang mở, tắt webhook và lời mời chưa nhận. Bank transaction, ledger, charge, refund và audit log không bị xóa để giữ tính bất biến tài chính.

## Kiểm thử

```powershell
# Unit/integration
cd backend-core
.\mvnw.cmd test

cd ..\frontend-portal
pnpm lint
pnpm build

cd ..\sdk\javascript
npm test

# Backend phải chạy trên cổng 8080
cd ..\..
.\scripts\e2e-stage20-26.ps1
.\scripts\concurrency-acquirer-test.ps1
.\scripts\webhook-auth-rotation-test.ps1
```

Load test cần k6:

```powershell
$env:PAYMENT_LINK_SLUG='<slug>'
$env:BANK_ACCOUNT_ID='<uuid>'
k6 run .\scripts\load-stage20-26.js
```

## Ranh giới

- VietQR, bank callback, 3DS và acquirer hiện là sandbox/simulator.
- Mock alert không gửi ra dịch vụ bên ngoài.
- Để chạy production thật vẫn cần credentials, hợp đồng, adapter ngân hàng/acquirer, KMS/HSM, alert provider, PCI assessment và quy trình vận hành được phê duyệt.
