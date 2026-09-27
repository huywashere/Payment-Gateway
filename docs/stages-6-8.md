# Giai đoạn 6-8: Payment Core, Merchant Platform và Sandbox

Tài liệu này mô tả phạm vi đã triển khai trước khi kết nối ngân hàng thật. Toàn bộ processor hiện tại là sandbox; tuyệt đối không dùng để thu thập hoặc xử lý dữ liệu thẻ thật.

## Giai đoạn 6 - Payment Core tin cậy

- `PaymentIntent` có state machine, optimistic locking và trạng thái lỗi rõ ràng.
- Mọi thao tác tạo intent/refund bắt buộc `Idempotency-Key`. Cùng key nhưng payload khác bị trả `409`.
- Charge thành công ghi sổ kép; refund tạo bút toán đảo và không hoàn lại phí xử lý.
- Transactional outbox phát sự kiện `payment_intent.*` và `refund.succeeded`.
- Webhook delivery lưu trạng thái, ký HMAC-SHA256, retry exponential tối đa 5 lần và hỗ trợ replay.
- Endpoint webhook chặn loopback/private network theo mặc định để giảm rủi ro SSRF.

## Giai đoạn 7 - Merchant và bảo mật truy cập

- `POST /v1/platform/merchants` dùng `X-Platform-Admin-Key` để onboarding merchant.
- Secret/publishable key sinh ngẫu nhiên, chỉ hiện raw key đúng một lần; database chỉ lưu SHA-256 hash.
- API key có scope, hạn dùng, last-used, rotate và revoke.
- Audit log lưu hành động quản trị của merchant.
- Trang `/developers` quản lý API key, webhook endpoint và xem hoạt động gần đây.

Các scope hiện có: `payments:read`, `payments:write`, `refunds:write`, `balance:read`, `payment_methods:write`, `keys:write`, `webhooks:write`, `audit:read` và wildcard `*`.

## Giai đoạn 8 - Sandbox và SDK

- Hosted checkout hỗ trợ sandbox CARD, VietQR và luồng `requires_action` giả lập 3DS.
- Publishable key chỉ được phép tạo sandbox payment-method token; secret key dùng ở server.
- JavaScript SDK ở `sdk/javascript` cung cấp `GatewayServer`, `GatewaySandbox` và lỗi chuẩn hóa.
- Không lưu PAN/CVC trong vault sandbox. Payload mã hóa chỉ chứa scenario và tên giả lập.

Các scenario hỗ trợ: `success`, `declined`, `insufficient_funds`, `requires_action`, `timeout`.

## Luồng kiểm thử API tối thiểu

1. Onboard merchant bằng platform admin key và giữ lại secret key được trả về.
2. Tạo `PaymentIntent` với một `Idempotency-Key` duy nhất.
3. Confirm bằng CARD/VIETQR sandbox hoặc mở checkout qua `clientSecret`.
4. Đọc `latestChargeId`, tạo partial/full refund với idempotency key mới.
5. Kiểm tra `/v1/balance`, `/v1/audit_logs` và `/v1/webhooks/deliveries`.

Khi core đang chạy local, có thể chạy toàn bộ luồng trên bằng:

```powershell
.\scripts\smoke-stages-6-8.ps1 -BaseUrl http://127.0.0.1:8080
```

## Ranh giới trước production

Giai đoạn này chưa thay thế kết nối acquiring bank, PCI DSS assessment, KYC/KYB, AML, fraud engine, settlement/payout, reconciliation ngân hàng, dispute/chargeback và quy trình vận hành 24/7. Webhook delivery phải qua egress proxy/DNS pinning ở môi trường production; platform admin key phải nằm trong secret manager và endpoint platform cần thêm network policy hoặc mTLS.
