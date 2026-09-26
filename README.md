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

### 1. Khởi động toàn bộ stack bằng Docker

```powershell
Copy-Item infra/environments/.env.dev.example infra/environments/.env.dev
# Thay các giá trị `change-me` và khóa vault mẫu trước khi dùng chung môi trường.
docker compose --env-file infra/environments/.env.dev -f infra/compose/compose.dev.yml up -d --build
```

- Portal: `http://localhost:3000`
- Backend Core: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`
- RabbitMQ Management: `http://localhost:15672`

Chi tiết cấu trúc container, mạng nội bộ và test dependencies nằm trong [`infra/README.md`](infra/README.md).

### 2. Chạy ứng dụng trực tiếp khi phát triển

Khởi động dependencies bằng `docker-compose.yml` ở thư mục gốc, sau đó chạy Backend Core:

```bash
cd backend-core
./mvnw spring-boot:run
```

Frontend Portal:

```bash
cd frontend-portal
npm install
npx prisma generate
npm run dev
```
### 3. Cấu hình môi trường

Frontend gọi Backend Core qua BFF để không đưa secret key xuống trình duyệt:

```env
# frontend-portal/.env
GATEWAY_CORE_URL=http://localhost:8080
GATEWAY_DEMO_SECRET_KEY=sk_test_demo_gateway_key_999
DATABASE_URL=postgresql://gateway_user:gateway_pass@localhost:5433/payment_gateway
```

Backend chỉ cho phép CORS từ portal đã khai báo (phân tách nhiều origin bằng dấu phẩy):

```env
GATEWAY_ALLOWED_ORIGINS=http://localhost:3000
```

Spring Boot mặc định dùng profile `local`. Container development dùng profile `docker`; production phải dùng profile `production`. Profile production không có fallback cho database, Redis, RabbitMQ, vault key hoặc allowed origins và sẽ từ chối khởi động nếu thiếu cấu hình bắt buộc. Không sử dụng file `.env.production.example` để lưu secret thật; secret production phải đến từ secret manager của môi trường triển khai.

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
