# Giai đoạn 28 — Open Banking Ingest, Telegram Alerting và Hệ Sinh Thái E-Commerce

Tài liệu này ghi nhận các tính năng mở rộng thực chiến của NovaGate nhằm đưa nền tảng từ kiến trúc mẫu sang vận hành thực tế không cần giấy phép trung gian thanh toán và tích hợp trực tiếp vào sàn TMĐT thương mại.

---

## 1. Open Banking Webhook Ingest (Nhận tiền thật qua SePay & PayOS)

### Bài toán
Để nhận tiền thật từ tài khoản ngân hàng của chính bạn tại Việt Nam (Vietcombank, MB, ACB, Techcombank...) mà không cần giấy phép trung gian thanh toán 50 tỷ, NovaGate bổ sung các adapter Ingest biến động số dư theo chuẩn mở.

### Endpoint đã triển khai
* `POST /v1/open_banking/webhook/sepay`: Nhận webhook từ SePay khi có biến động số dư vào tài khoản thụ hưởng.
* `POST /v1/open_banking/webhook/payos`: Nhận webhook chuẩn PayOS VietQR.

### Cơ chế hoạt động
1. Webhook gửi đến kèm `Authorization: Apikey <token>` hoặc header `X-Api-Key`.
2. `OpenBankingWebhookService` trích xuất `accountNumber`, tìm `BankAccountEntity` đang active trong hệ thống hoặc dùng tài khoản mặc định.
3. Chuyển đổi payload thành `BankTransactionIngestRequest` và gọi `BankTransactionService.ingestDirect`.
4. Tìm kiếm ứng viên `PaymentLinkEntity` khớp `paymentCode` và `amount`.
5. Khi khớp:
   - Settle `PaymentIntent` thành `SUCCEEDED`.
   - Ghi nhận bút toán kế toán kép bất biến (Double-Entry Ledger).
   - Đánh dấu Payment Link là `PAID`.
   - Dispatch sự kiện Outbox lên RabbitMQ để báo Webhook về cho Merchant.

---

## 2. Telegram Webhook Alert Worker (Giám sát Realtime)

### Vấn đề
Trong `ProductionReadinessValidator`, thuộc tính `gateway.webhooks.alert-provider` trước đây bị đánh dấu là `placeholder` (chỉ ghi vào DB).

### Triển khai
* `TelegramWebhookAlertWorker` lắng nghe các cảnh báo trong bảng `webhook_alerts` khi một merchant webhook bị lỗi liên tiếp quá 3 lần (vào Dead Letter Queue).
* Tự động format tin nhắn Markdown đẹp mắt kèm emoji cảnh báo `🚨`, Merchant ID, Endpoint ID, thời gian và lý do lỗi.
* Gửi trực tiếp về nhóm Telegram của đội kỹ thuật qua Telegram Bot API (`https://api.telegram.org/bot<TOKEN>/sendMessage`).

---

## 3. Tích hợp Thực Chiến với Sàn TMĐT TITAN TECH (`E-com-project`)

NovaGate đã được tích hợp làm phương thức thanh toán ưu tiên số 1 tại trang Checkout của sàn TMĐT đồ công nghệ cao cấp TITAN TECH:
* **Giao diện đặt hàng**: Tùy chọn thanh toán **Cổng NovaGate (VietQR Napas 24/7)** với huy hiệu `KHUYÊN DÙNG` • `0% PHÍ`.
* **Interactive VietQR Modal**: Hiển thị mã QR VietQR động (chuẩn EMVCo Napas), thông tin tài khoản ACB, bộ đếm ngược 15 phút và nút mô phỏng khớp lệnh thời gian thực.
* **Đồng bộ Quản trị**: Đơn hàng thanh toán qua NovaGate được gắn huy hiệu `⚡ NovaGate VietQR` tại trang quản trị Admin và hiển thị rõ ràng tại trang xác nhận đơn hàng thành công (`order-success`).

---

## 4. Bộ Sưu Tập Postman API Collection

Thư mục `postman/` cung cấp bộ test tự động:
* `NovaGate_Environment.json`: Chứa các biến môi trường (`base_url`, `api_key`, `edge_url`, `merchant_id`...).
* `NovaGate_API_Collection.json`: Có sẵn Pre-request Script tự động sinh `Idempotency-Key` (UUIDv4) và timestamp cho mỗi request, bao gồm đầy đủ luồng từ Health, FSM Payment Intent, VietQR Link, Open Banking Webhook đến Sổ cái và Refund.

---

## 5. Script 1-Click Bootstrap cho Developer (`scripts/bootstrap-dev.ps1`)

* Kiểm tra tự động Docker daemon.
* Tự động sinh `.env.dev` từ template nếu chưa có.
* Bật toàn bộ cụm container (Postgres 16, Redis 7, RabbitMQ 3.13, Gateway Core, Go Edge, Prometheus, Grafana).
* Healthcheck polling đến khi hệ thống sẵn sàng và in ra Dashboard bảng điều khiển hoàn chỉnh.
