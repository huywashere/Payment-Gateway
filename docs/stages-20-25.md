# Giai đoạn 20-25: VietQR, realtime, webhook SaaS và acquirer

Tài liệu này mô tả phần đã triển khai cho môi trường project/sandbox và ranh giới bắt buộc trước khi thay bằng kết nối tài chính thật.

## 20 - VietQR Core

- `bank_accounts` quản lý tài khoản nhận tiền theo merchant, tài khoản mặc định và quota theo plan.
- `payment_links` tạo PaymentIntent, mã thanh toán duy nhất, thời hạn và public URL.
- Payload QR dùng TLV EMVCo, GUID VietQR `A000000727`, mã dịch vụ `QRIBFTTA`, tiền tệ `704` và CRC16-CCITT.
- `GET /v1/payment_links/public/{slug}` và `qr.svg` không yêu cầu secret; dữ liệu trả về chỉ đủ để thanh toán.
- Portal `/payment-links` tạo/quản lý link; `/pay/{slug}` polling trạng thái 2 giây một lần.

## 21 - Realtime Payment

- `POST /v1/bank_transactions/inbox/{bankCode}` nhận raw callback ký HMAC với timestamp, chống replay 5 phút.
- Unique `(bank_account_id, external_reference)` và SHA-256 raw payload chống ghi nhận hai lần hoặc tái sử dụng reference khác payload.
- Matching ưu tiên `payment_code + amount + currency`, sau đó chỉ auto-match theo amount khi có đúng một ứng viên.
- Mơ hồ được đưa vào `REVIEW`; không khẳng định thanh toán từ `return_url`.
- Khi match, PaymentIntent, ledger, outbox và Payment Link được cập nhật trong cùng transaction.

## 22 - Webhook Platform

- Endpoint hỗ trợ `HMAC_SHA256`, `API_KEY`, `OAUTH2 client_credentials`; thông tin xác thực được mã hóa bằng vault.
- Bộ lọc theo event, bank, bank account, chiều tiền và tiền tố payment code.
- Có test delivery, log request/response đã che secret, exponential retry, `DEAD_LETTER`, replay và xoay signing secret với grace period 24 giờ.
- Sau ba lỗi liên tiếp, cảnh báo Email/Slack/Telegram được ghi vào `webhook_alerts` ở trạng thái `PENDING`. Project không gửi ra dịch vụ ngoài khi chưa cấu hình adapter cảnh báo.

## 23 - SaaS Management

- Organization members có OWNER/DEVELOPER/FINANCE/AUDITOR và vòng đời INVITED/ACTIVE/DISABLED.
- FREE/GROWTH/SCALE có quota payment, bank account, webhook endpoint và retention.
- Subscription API, onboarding/KYB status, platform admin, audit và báo cáo giao dịch CSV đã có boundary riêng.
- Billing ở đây là mô phỏng gói dịch vụ; chưa tự động trừ phí định kỳ ngoài đời.

## 24 - Acquirer SPI

- `AcquirerProcessor` tách processor khỏi application service.
- Sandbox triển khai AUTHORIZE, 3DS 2.2 simulator, CAPTURE, VOID, REFUND và DISPUTE.
- Mỗi operation có idempotency key, processor reference, parent operation và kiểm tra tổng capture/refund không vượt amount gốc.
- Hosted-fields endpoint chỉ công bố contract tokenization; live không được gửi PAN/CVC qua merchant backend.
- Profile production fail-closed nếu `LiveAcquirerPlaceholder` chưa được thay.

## 25 - External UAT

Không giả mạo trạng thái tích hợp thật. Một adapter ngân hàng/NAPAS/acquirer chỉ được coi là hoàn tất sau khi có credentials và đạt toàn bộ checklist sau:

1. Lưu client secret, certificate/private key trong secret manager; không commit vào repository.
2. Pin issuer/audience, IP allowlist hoặc mTLS theo hợp đồng của provider.
3. Lập bảng mapping provider status/error sang trạng thái nội bộ; unknown status phải fail closed hoặc manual review.
4. Xác minh chữ ký trên raw body trước parse, timestamp/nonce chống replay và key rotation.
5. Chạy UAT success, decline, timeout, duplicate, out-of-order callback, reversal, partial capture/refund và chargeback.
6. So khớp statement/settlement tổng và từng transaction; chạy recovery khi webhook bị mất.
7. Đặt timeout, bounded retry, circuit breaker, rate limit và quan sát latency/error theo provider.
8. Có bằng chứng sandbox/UAT do provider cấp, approval của risk/security/finance và phương án rollback trước cutover.

### Ma trận adapter

| Boundary | Project hiện tại | Điều kiện để live |
| --- | --- | --- |
| Bank transfer | `BankSandboxProcessor`, signed transaction inbox | Adapter API ngân hàng/NAPAS, certificate và UAT credentials |
| QR payload | EMVCo/VietQR payload + CRC | Merchant bank account thật và xác nhận tương thích provider |
| Card acquirer | `SandboxAcquirerProcessor` | Hosted fields/tokenization + 3DS server/acquirer theo hợp đồng |
| Vault | AES-GCM local | KMS/HSM adapter thật |
| Alerts | Durable pending alert | Email/Slack/Telegram sender với credential và retry riêng |

### Smoke flow local

1. Đăng nhập portal sandbox, mở `/payment-links`, tạo link.
2. Mở `/pay/{slug}` và kiểm tra QR, account, amount, payment code, expiry.
3. Gửi signed bank transaction vào inbox với đúng payment code; link phải chuyển `PAID` và PaymentIntent `SUCCEEDED`.
4. Gửi lại cùng reference/payload: kết quả phải idempotent; đổi payload cùng reference: phải bị từ chối.
5. Tạo webhook test, xem delivery log/replay; delivery ngoài mặc định tắt ở local.
6. Chạy authorize có 3DS, complete 3DS, capture và partial refund qua `/v1/acquirer/operations`.
