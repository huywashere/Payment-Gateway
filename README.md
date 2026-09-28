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

4. **Giảm Phạm Vi Dữ Liệu Thẻ:**
   - Không có cột lưu PAN/CVC; production chỉ nhận opaque token từ hosted fields/acquirer.
   - Sandbox mã hóa metadata không nhạy cảm bằng **AES-256-GCM**; live bắt buộc thay adapter KMS/HSM.
   - Chỉ lưu token processor, brand, hạn thẻ và `last4` phục vụ hiển thị.

5. **Xử Lý Sự Kiện Bất Đồng Bộ (Transactional Outbox & RabbitMQ):**
   - Bảng `outbox_events` được lưu trong cùng Database Transaction ACID với đơn thanh toán để giải quyết triệt để **Dual-Write Problem**.
   - Outbox Worker đẩy sự kiện lên **RabbitMQ Topic Exchange** (`payment.events.exchange`).
   - Webhook Consumer lắng nghe, ký chữ ký số **HMAC-SHA256** và dispatch về URL của Merchant kèm Dead Letter Queue (DLQ).

6. **Next.js BFF & Prisma ORM:**
   - Frontend Next.js 16 tích hợp **Prisma ORM** kết nối trực tiếp vào PostgreSQL để truy vấn số dư và giao dịch thời gian thực.
   - Giao diện Dark Mode Isometric Clone chuẩn thiết kế `apipay.vn` với logo ngân hàng vector sắc nét (MB, ACB, BIDV, VCB, TPBank...) và trình giả lập VietQR Napas 24/7.

7. **Merchant Platform & Sandbox Developer Experience:**
   - Onboarding merchant, scoped API key, rotate/revoke, audit log và quản lý webhook endpoint.
   - Refund một phần/toàn phần, retry/replay webhook và bộ JavaScript SDK cho server/browser sandbox.
   - Hosted checkout giả lập CARD, VietQR và luồng 3DS `requires_action` mà không lưu PAN/CVC.

8. **Money Operations & Production Controls:**
   - Risk scoring trước processor, settlement pending → available, payout có idempotency và dispute reserve.
   - Reconciliation cấp transaction, operational readiness, Redis rate limit và worker multi-instance `SKIP LOCKED`.
   - Ledger/audit append-only ở tầng PostgreSQL và webhook HTTPS/SSRF policy được kiểm tra lại khi delivery.

9. **Project Production Simulation:**
   - Tách sandbox/live, sandbox có MFA giả lập; live dùng OIDC + MFA claim và RBAC bốn vai trò.
   - Bank sandbox processor mô phỏng OAuth, callback ký HMAC và reversal idempotent.
   - Staging hai backend, backup/restore drill, load/concurrency test và bộ tài liệu PCI/KYB/pilot.

10. **Production Safety Boundary:**
   - Live portal dùng OIDC + PKCE + MFA claim; platform admin dùng JWT role thay cho demo key.
   - Không có cột PAN/CVC, live từ chối raw card, PII khách hàng được mã hóa/xóa độc lập với lịch sử tài chính.
   - Durable idempotency, processor callback inbox, deterministic operation ID và database ledger constraints.
   - Live charge/payout/KMS placeholders cố ý chặn khởi động cho tới khi adapter thật được cung cấp.
   - Kubernetes HA baseline và production evidence gate không cho checklist giả được xem là phê duyệt thật.

11. **VietQR, Payment Links & SaaS Simulation:**
   - Payload EMVCo/VietQR có CRC, mã thanh toán riêng, expiry, public payment page, SSE realtime và polling dự phòng.
   - Signed bank transaction inbox, matching engine IPN-first, dedup và trạng thái manual review khi mơ hồ.
   - Webhook HMAC/API key/OAuth2, filter, test delivery, secret rotation, retry/DLQ và durable alert queue.
   - Organization members, plan/quota, report CSV và acquirer SPI với 3DS/capture/void/refund/dispute sandbox.

12. **Portal quản trị và trải nghiệm demo hoàn chỉnh:**
   - UI webhook nâng cao: filter, HMAC/API Key/OAuth2, test delivery/alert, replay, DLQ và xoay secret.
   - UI tổ chức/gói/quota, Platform Admin merchant/KYB/lock và Acquirer Playground đầy đủ vòng đời.
   - Trang chi tiết Payment Link/giao dịch, empty/loading/error/toast dùng chung và soft reset sandbox giữ lịch sử tài chính.
   - JavaScript SDK bao phủ Payment Link, bank inbox, organization, acquirer và webhook nâng cao.

---

## 🛠 Tech Stack

| Thành Phần | Công Nghệ & Phiên Bản |
| :--- | :--- |
| **Backend Core** | Java 21 + Spring Boot 3.5.16 (Virtual Threads / Project Loom) |
| **Frontend Portal** | Next.js 16 (App Router) + TypeScript + Vanilla CSS + Prisma ORM 6 |
| **Database** | PostgreSQL 16 (Flyway Database Migration, JSONB, UUID v4) |
| **Distributed Cache & Lock** | Redis 7 + Redisson 3.34 |
| **Message Broker** | RabbitMQ 3.13 (AMQP + Management UI) |
| **Containerization** | Docker & Docker Compose |
| **Observability** | Prometheus + Grafana + Loki + Grafana Alloy + Alertmanager |
| **CI/CD & Security** | GitHub Actions + CodeQL + Trivy + GHCR |

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

### Khởi động kèm monitoring và centralized logging

```powershell
Copy-Item infra/environments/.env.observability.example infra/environments/.env.observability

docker compose `
  --env-file infra/environments/.env.dev `
  --env-file infra/environments/.env.observability `
  -f infra/compose/compose.dev.yml `
  -f infra/compose/compose.observability.yml `
  up -d --build
```

- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9091`
- Alertmanager: `http://localhost:9093`

Dashboard **Payment Gateway Operations** và hai datasource Prometheus/Loki được provision tự động.

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

Spring Boot mặc định dùng profile `local`. Container development dùng profile `docker`; production phải dùng profile `production`. Profile production không có fallback cho database, Redis, RabbitMQ, OIDC hoặc allowed origins; nó còn từ chối khởi động nếu charge, payout hay KMS vẫn là adapter placeholder. Không sử dụng file `.env.production.example` để lưu secret thật; secret production phải đến từ secret manager của môi trường triển khai.

---

## CI/CD và vận hành

Mỗi pull request chạy Maven test với dependencies thật, frontend lint/build, Docker Compose validation, image build, dependency review, Trivy image scan và CodeQL. Trivy đưa toàn bộ cảnh báo `HIGH`/`CRITICAL` lên GitHub Security và chặn phát hành khi còn lỗ hổng `CRITICAL` đã có bản vá. Commit trên `main` vượt toàn bộ quality gate sẽ phát hành hai image lên GitHub Container Registry với tag `latest`, `sha-<commit>`, SBOM và provenance attestation.

Runbook xử lý sự cố và ý nghĩa cảnh báo nằm trong [`docs/operations-runbook.md`](docs/operations-runbook.md).
Phạm vi và cách kiểm thử giai đoạn 6-8 nằm trong [`docs/stages-6-8.md`](docs/stages-6-8.md).
Money operations và hardening giai đoạn 9-10 nằm trong [`docs/stages-9-10.md`](docs/stages-9-10.md).
Phạm vi production simulation giai đoạn 11-15 nằm trong [`docs/stages-11-15.md`](docs/stages-11-15.md).
VietQR, realtime matching, webhook SaaS, acquirer SPI và checklist External UAT nằm trong [`docs/stages-20-25.md`](docs/stages-20-25.md).
Portal quản trị, SSE, mock alert, SDK và bộ test demo nằm trong [`docs/stage-26-demo-experience.md`](docs/stage-26-demo-experience.md).
Ranh giới hardening và các blocker bên ngoài nằm trong [`docs/production-hardening.md`](docs/production-hardening.md).

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
