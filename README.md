# Payment Gateway & FinTech Platform (Stripe & ApiPay Architecture)

Một hệ thống Cổng Thanh Toán Phân Tán (Distributed Payment Gateway) được thiết kế theo tiêu chuẩn FinTech quốc tế (lấy cảm hứng từ kiến trúc cốt lõi của **Stripe** và giao diện ngân hàng mở **[ApiPay.vn](https://apipay.vn/)**).

---

## 🌟 Tính Năng Cốt Lõi

1. **Kiến trúc Sạch (Clean Architecture & DDD):**
   - Độc lập giữa Domain, Application và Infrastructure.
   - Quản lý vòng đời thanh toán qua Finite State Machine (`PaymentIntent`: `REQUIRES_PAYMENT_METHOD` ➔ `PROCESSING` ➔ `SUCCEEDED` / `FAILED`).

2. **Sổ Cái Kép Bất Biến (Double-Entry Bookkeeping Ledger):**
   - Tuân thủ nguyên lý kế toán tài chính: $\sum \text{Debit} = \sum \text{Credit}$.
   - Append-only (không bao giờ UPDATE số dư trực tiếp), chống tuyệt đối Race condition và lưu vết kiểm toán (Audit Trail) bất biến.

3. **Khiên Chống Trùng Lặp (Idempotency Shield):**
   - Sử dụng **Redis 7 & Redisson Distributed Lock** dựa trên header `Idempotency-Key`.
   - Replay cache 24h trả về kết quả ngay lập tức khi nhận request trùng lặp, chống trừ tiền 2 lần (Double-charge).

4. **Bảo Mật Dữ Liệu Thẻ (PCI-DSS Tokenization Vault):**
   - Mã hóa phong bì (Envelope Encryption) bằng thuật toán **AES-256-GCM** với Auth Tag 128-bit.
   - Cô lập thông tin thẻ nhạy cảm, chỉ lưu `token` và `last4` hiển thị.

5. **Xử Lý Sự Kiện Bất Đồng Bộ (Transactional Outbox & RabbitMQ):**
   - Bảng `outbox_events` được lưu trong cùng Database Transaction ACID với đơn thanh toán để giải quyết triệt để **Dual-Write Problem**.
   - Outbox Worker đẩy sự kiện lên **RabbitMQ Topic Exchange** (`payment.events.exchange`).
   - Webhook Consumer lắng nghe, ký chữ ký số **HMAC-SHA256** và dispatch về URL của Merchant kèm Dead Letter Queue (DLQ).

6. **Next.js BFF & Prisma ORM:**
   - Frontend Next.js 16 tích hợp **Prisma ORM** kết nối trực tiếp vào PostgreSQL để truy vấn số dư và giao dịch thời gian thực.
   - Giao diện Dark Mode Isometric Clone chuẩn thiết kế `apipay.vn` với logo ngân hàng vector sắc nét (MB, ACB, BIDV, VCB, TPBank...) và trình giả lập VietQR Napas 24/7.

---

## 🛠 Tech Stack

| Thành Phần | Công Nghệ & Phiên Bản |
| :--- | :--- |
| **Backend Core** | Java 23 + Spring Boot 3.3.4 (Virtual Threads / Project Loom) |
| **Frontend Portal** | Next.js 16 (App Router) + TypeScript + Vanilla CSS + Prisma ORM 6 |
| **Database** | PostgreSQL 16 (Flyway Database Migration, JSONB, UUID v4) |
| **Distributed Cache & Lock** | Redis 7 + Redisson 3.34 |
| **Message Broker** | RabbitMQ 3.13 (AMQP + Management UI) |
| **Containerization** | Docker & Docker Compose |

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Khởi động Hạ tầng Docker (PostgreSQL, Redis, RabbitMQ)
```bash
docker compose up -d
```
- PostgreSQL: `localhost:5433` (DB: `payment_gateway`, User: `gateway_user`, Pass: `gateway_pass`)
- Redis: `localhost:6379`
- RabbitMQ: `localhost:5672` (Management Dashboard: `http://localhost:15672` - User/Pass: `gateway_user`/`gateway_pass`)

### 2. Khởi chạy Backend Core (Spring Boot)
```bash
cd backend-core
./mvnw spring-boot:run
```
- Server chạy tại: `http://localhost:8080`
- Swagger OpenAPI Docs: `http://localhost:8080/swagger-ui.html`

### 3. Khởi chạy Frontend Portal (Next.js & Prisma)
```bash
cd frontend-portal
npm install
npx prisma generate
npm run dev
```
- Truy cập Cổng thanh toán: `http://localhost:3000`
- Merchant Dashboard: `http://localhost:3000/dashboard`
- Hosted Checkout: `http://localhost:3000/checkout`
- Demo Store: `http://localhost:3000/store`
- Prisma Overview API: `http://localhost:3000/api/prisma/overview`

---

## 🔑 Thông Tin Môi Trường Sandbox Test

- **Merchant ID:** `11111111-1111-1111-1111-111111111111`
- **Secret Key:** `sk_test_demo_gateway_key_999`
- **Publishable Key:** `pk_test_demo_public_key_999`
- **Thẻ Test Thành Công:** `4242 4242 4242 4242` | Hạn: `12/28` | CVC: `123`
- **Thẻ Hết Tiền (Insufficient):** `4000 0000 0000 0002`
- **Thẻ Bị Khóa (Declined):** `4000 0000 0000 0005`
- **Thẻ Xác Thực 3DS:** `4000 0000 0000 3000`

---

## 📜 Giấy Phép
Dự án được xây dựng và phát triển dưới giấy phép MIT.
