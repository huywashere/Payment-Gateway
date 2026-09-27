# Giai đoạn 9-10: Money Operations và Production Hardening

## Giai đoạn 9 - Vận hành dòng tiền

### Risk engine

Mỗi lần confirm `PaymentIntent` được chấm điểm trước khi gọi processor. Các tín hiệu mặc định gồm giới hạn giao dịch, tổng volume trong ngày, velocity một phút và email domain bị chặn. Kết quả `ALLOW`, `REVIEW` hoặc `BLOCK` được lưu vào `risk_evaluations`; giao dịch `BLOCK` kết thúc với `failureCode=risk_blocked`.

Merchant quản lý chính sách qua `GET/PUT /v1/risk/profile` và xem lịch sử tại `GET /v1/risk/evaluations`.

### Settlement và payout

Tiền charge thành công được ghi vào `2001_MERCHANT_PENDING`. `POST /v1/settlements` gom các charge chưa đối soát tới cutoff, trừ fee/refund và chuyển đúng net amount sang `2002_MERCHANT_AVAILABLE`. Một charge chỉ thuộc một settlement nhờ unique constraint.

`POST /v1/payouts` chỉ sử dụng available balance, bắt buộc `Idempotency-Key`, che destination reference và tạo bút toán giảm liability/clearing. Processor payout hiện vẫn là sandbox.

### Dispute

Platform tạo dispute sau settlement bằng `POST /v1/platform/disputes`. Số tiền bị chuyển từ available sang `2003_MERCHANT_DISPUTE_RESERVE`. Merchant nộp evidence; platform resolve `WON` để hoàn available hoặc `LOST` để giảm clearing.

### Reconciliation

`POST /v1/platform/reconciliation_runs` nhập báo cáo processor theo transaction. Engine trả từng kết quả `MATCHED`, `MISSING_INTERNAL`, `MISSING_PROCESSOR`, `AMOUNT_MISMATCH` hoặc `STATUS_MISMATCH`. Merchant có quyền đọc nhưng không thể tự tạo/resolve báo cáo đối soát.

## Giai đoạn 10 - Hardening vận hành

- Redis fixed-window rate limiting theo credential/IP; production fail-closed khi lớp bảo vệ không hoạt động.
- Platform endpoints tách bằng `X-Platform-Admin-Key`; production cần thêm mTLS/network policy.
- Webhook URL được kiểm tra lại DNS ngay trước delivery, chặn private/link-local/multicast và bắt buộc HTTPS ở production.
- Outbox và webhook worker dùng `FOR UPDATE SKIP LOCKED` để nhiều instance không cùng lấy một record.
- Unique event/endpoint ngăn materialize webhook trùng trong mô hình at-least-once.
- PostgreSQL trigger cấm `UPDATE/DELETE` trên `ledger_entries` và `audit_logs`.
- `GET /v1/platform/operations/readiness` tổng hợp failed outbox, failed webhook, open dispute và reconciliation cần review.
- Portal `/operations` cho merchant thao tác settlement, payout, risk và theo dõi dispute/reconciliation.

## Trình tự kiểm thử

```powershell
.\scripts\smoke-stages-9-10.ps1 -BaseUrl http://127.0.0.1:8080
```

Smoke test thực hiện onboarding, payment, settlement, payout, risk block, dispute reserve/evidence/resolve, reconciliation match/mismatch và readiness.

## Ranh giới production

Các giai đoạn này hoàn thiện nền tảng kỹ thuật sandbox nhưng không tự tạo giấy phép trung gian thanh toán, kết nối acquiring/settlement bank, KYC/KYB/AML workflow, PCI DSS certification hoặc quy trình chargeback chính thức. Payout và dispute processor adapter phải được thay bằng hợp đồng ngân hàng/đối tác trước khi dùng tiền thật. DNS validation trong ứng dụng không thay thế outbound proxy có DNS pinning và firewall egress.
