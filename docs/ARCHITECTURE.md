# HỆ THỐNG CỔNG THANH TOÁN PHÂN TÁN (STRIPE-LIKE PAYMENT GATEWAY)
## TÀI LIỆU THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE SPECIFICATION)
**Role:** Senior FinTech Solutions Architect  
**Phiên bản:** 1.0.0  
**Trạng thái:** Approved for Implementation  

---

## 1. MỤC TIÊU & NGUYÊN LÝ THIẾT KẾ (DESIGN PRINCIPLES)

Hệ thống được thiết kế theo các tiêu chuẩn kiến trúc phần mềm tài chính quốc tế, đảm bảo 5 trụ cột:
1. **Tính nhất quán tuyệt đối (Strict Consistency):** Tiền không bao giờ tự sinh ra hoặc mất đi. Số dư không lưu dưới dạng mutable value mà được tính toán dựa trên **Double-Entry Bookkeeping (Sổ cái kế toán kép)**.
2. **Nguyên tắc Idempotency (Chống trừ tiền trùng lặp):** Bất kỳ request nào từ Merchant hoặc phía khách hàng có thể bị gửi lại nhiều lần do mạng lag/retry đều phải đảm bảo chỉ thực thi duy nhất 1 lần.
3. **Bảo mật & Cô lập phạm vi PCI-DSS (Zero-Trust Tokenization):** Hệ thống chính không lưu trữ số thẻ thô (PAN) và CVV dạng plain-text. Tách biệt tầng **Card Vault** mã hóa bằng chuẩn AES-256-GCM.
4. **Phân tách Ranh giới Rõ ràng (Domain-Driven Design - DDD):** Áp dụng kiến trúc Clean Architecture / Hexagonal Architecture để Domain Logic độc lập hoàn toàn với Framework, Database và UI.
5. **Giao tiếp Bất đồng bộ Tin cậy (Reliable Asynchronous Messaging):** Sử dụng **Transactional Outbox Pattern** kết hợp RabbitMQ để đảm bảo Webhook và Event kế toán không bao giờ bị mất (At-least-once Delivery).

---

## 2. KIẾN TRÚC TỔNG THỂ (C4 MODEL - LEVEL 1 & 2)

### 2.1. C4 Level 1: System Context Diagram

```mermaid
flowchart TB
    CUST([Khách hàng / Người mua])
    MERCHANT([Hệ thống Merchant / E-Commerce])
    ADMIN([Quản trị viên / Kế toán sàn])

    subgraph SYSTEM ["Hệ Thống Cổng Thanh Toán (Payment Gateway Engine)"]
        CORE["Core Payment & Ledger Platform"]
    end

    subgraph EXTERNAL ["Đối tác Thanh toán & Ngân hàng"]
        BANK_SIM["Mock Bank Simulator (Visa/Mastercard)"]
        VIETQR["Cổng VietQR / Napas247"]
        WALLETS["Ví điện tử (MoMo / ZaloPay)"]
    end

    CUST -->|1. Thanh toán qua Checkout UI / SDK| CORE
    MERCHANT -->|2. Gọi REST API (Tạo PaymentIntent, Webhook)| CORE
    ADMIN -->|3. Đối soát, Cấu hình phí qua Dashboard| CORE
    CORE -->|4. Ủy quyền & Trừ tiền| BANK_SIM
    CORE -->|4. Tạo mã QR & Nhận IPN| VIETQR
    CORE -->|4. Giao dịch ví| WALLETS
    CORE -.->|5. Bắn Webhook trạng thái đơn hàng| MERCHANT
```

---

### 2.2. C4 Level 2: Container Diagram (Kiến trúc các Khối Triển khai)

```mermaid
flowchart TD
    subgraph Client_Tier ["Client & Presentation Tier"]
        FE_DASH["Merchant Dashboard\n(Next.js 14 + Tailwind CSS)"]
        FE_CHECKOUT["Drop-in Checkout SDK\n(HTML5 / Iframe / JS SDK)"]
    end

    subgraph Gateway_Tier ["API Gateway & Security Layer"]
        SPRING_SEC["Spring Security Filter Chain\n- API Key Authentication (sk_test_...)\n- Request Signing (HMAC-SHA256)\n- Rate Limiting (Redis Token Bucket)"]
    end

    subgraph App_Tier ["Backend Core Engine (Java 23 / Spring Boot 3.3)"]
        INTENT_SVC["Payment Intent State Machine"]
        IDEM_MGR["Idempotency Lock Manager"]
        VAULT_SVC["Card Vault & Tokenization Engine (AES-256-GCM)"]
        LEDGER_SVC["Double-Entry Ledger Engine"]
        ROUTER_SVC["Payment Processor SPI Router"]
        OUTBOX_SVC["Transactional Outbox Publisher"]
        WORKER_SVC["Background Event & Webhook Worker"]
    end

    subgraph Storage_Tier ["Data & Message Infrastructure"]
        PG[(PostgreSQL 16+\n- Transactions\n- Ledgers\n- Outbox Events\n- Audit Logs)]
        REDIS[(Redis 7+\n- Distributed Lock\n- Idempotency Cache\n- Rate Limit State)]
        RMQ[[RabbitMQ 3.13+\n- Exchanges: payment.events\n- Queues: webhook.dispatch, ledger.sync\n- Dead Letter Exchanges]]
    end

    FE_DASH -->|REST / HTTPS| SPRING_SEC
    FE_CHECKOUT -->|REST / HTTPS| SPRING_SEC
    SPRING_SEC --> IDEM_MGR
    IDEM_MGR <--> REDIS
    IDEM_MGR --> INTENT_SVC

    INTENT_SVC --> VAULT_SVC
    INTENT_SVC --> ROUTER_SVC
    INTENT_SVC --> PG
    INTENT_SVC -.->|Write Outbox Event| PG

    PG -.->|Poll / CDC| OUTBOX_SVC
    OUTBOX_SVC --> RMQ
    RMQ --> WORKER_SVC
    WORKER_SVC --> LEDGER_SVC
    WORKER_SVC -->|HTTP POST Signed Webhook| MERCHANT_SERVER([Merchant Server])

    LEDGER_SVC --> PG
```

---

## 3. THIẾT KẾ CÁC PHÂN HỆ CỐT LÕI (CORE SUBSYSTEMS)

### 3.1. Phân hệ Quản lý Vòng đời Giao dịch (PaymentIntent State Machine)

Giao dịch tuân theo chuẩn hữu hạn trạng thái (Deterministic Finite State Machine - FSM):

```
                        ┌───────────────────────────────┐
                        │    REQUIRES_PAYMENT_METHOD    │
                        └───────────────┬───────────────┘
                                        │ (Gắn thẻ / Chọn QR)
                                        ▼
                        ┌───────────────────────────────┐
                        │     REQUIRES_CONFIRMATION     │
                        └───────┬───────────────┬───────┘
                                │               │
          (Cần 3DS / OTP ngân hàng)             │ (Không cần xác thực thêm)
                                ▼               ▼
┌────────────────────────┐  ┌───────────────────────────┐
│    REQUIRES_ACTION     │  │        PROCESSING         │
└───────────┬────────────┘  └───────────┬───────────────┘
            │                           │
            │ (Xác thực xong)           │
            └───────────────────────────┤
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        ┌───────────────────────┐               ┌───────────────────────┐
        │       SUCCEEDED       │               │        FAILED         │
        └───────────┬───────────┘               └───────────────────────┘
                    │ (Hoàn tiền một phần / toàn phần)
                    ▼
        ┌───────────────────────┐
        │   REFUNDED / PARTIAL  │
        └───────────────────────┘
```

### 3.2. Giao thức Chống Trùng Lặp 2 Pha (Two-Phase Idempotency Protocol)

Mỗi request POST thay đổi trạng thái (như `POST /v1/payment_intents`) bắt buộc phải truyền header:  
`Idempotency-Key: <UUIDv4>`

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Merchant API Client
    participant Filter as Idempotency Filter
    participant Redis as Redis (Distributed Cache)
    participant Core as Core Payment Service
    participant DB as PostgreSQL

    Merchant->>Filter: POST /v1/payment_intents (Header: Idempotency-Key)
    Filter->>Redis: SET lock:idemp:{key} "PROCESSING" NX EX 30s
    alt Key đã tồn tại và status = COMPLETED
        Redis-->>Filter: Trả về Cache Response
        Filter-->>Merchant: 200 OK (Replay Payload cũ)
    else Key đang bị Lock (Đang có luồng khác chạy cùng lúc)
        Filter-->>Merchant: 409 Conflict ("Request in progress, please wait")
    else Lock thành công (Request mới)
        Filter->>Core: Cho phép xử lý logic nghiệp vụ
        Core->>DB: Thực thi trong 1 Database Transaction
        DB-->>Core: Commit thành công
        Core->>Redis: SET result:idemp:{key} {response_payload} EX 86400s
        Core->>Redis: DEL lock:idemp:{key}
        Core-->>Merchant: 201 Created (Response mới)
    end
```

---

### 3.3. Hệ thống Sổ cái Kép (Double-Entry Ledger Subsystem)

Toàn bộ tài chính vận hành theo nguyên lý cân bằng kế toán:
$$\sum \text{Debit} = \sum \text{Credit}$$

#### Danh mục tài khoản (Chart of Accounts):
1. **Asset Accounts (Tài sản):**
   - `1001 - Clearing Account (VietQR/Bank)`: Tiền đang chờ nhận từ ngân hàng.
   - `1002 - Vault Processing Account`: Tiền thanh toán thẻ đang giữ.
2. **Liability Accounts (Công nợ với Merchant):**
   - `2001 - Merchant Pending Balance`: Số dư chờ đối soát của Merchant.
   - `2002 - Merchant Available Balance`: Số dư khả dụng Merchant có thể rút (Payout).
3. **Revenue Accounts (Doanh thu của Sàn):**
   - `4001 - Platform Processing Fee Revenue`: Doanh thu phí giao dịch sàn thu.

#### Ví dụ hạch toán khi Merchant A bán đơn 1,000,000 VND (Phí sàn 2% = 20,000 VND):
* **Bút toán 1 (Thu tiền từ khách):**
  - `DEBIT` tài khoản `1001 (Bank Clearing)`: **+1,000,000 VND**
  - `CREDIT` tài khoản `2001 (Merchant A Pending)`: **+1,000,000 VND**
* **Bút toán 2 (Trừ phí dịch vụ sàn):**
  - `DEBIT` tài khoản `2001 (Merchant A Pending)`: **+20,000 VND**
  - `CREDIT` tài khoản `4001 (Platform Revenue)`: **+20,000 VND**
* **Kết quả:** Merchant A có `980,000 VND` khả dụng; Sàn thu `20,000 VND`. Tổng Nợ = Tổng Có = `1,020,000 VND`. Không một xu nào bị lệch.

---

### 3.4. Mô hình Transactional Outbox & Webhook Dispatcher

```mermaid
sequenceDiagram
    autonumber
    participant App as Payment Service
    participant DB as PostgreSQL (ACID)
    participant Worker as Outbox Polling Worker
    participant RMQ as RabbitMQ Exchange
    participant WebhookWorker as Webhook Consumer
    actor MerchantServer as Merchant Webhook Endpoint

    App->>DB: BEGIN TRANSACTION
    App->>DB: UPDATE payment_intents SET status = 'SUCCEEDED'
    App->>DB: INSERT INTO ledger_entries (...)
    App->>DB: INSERT INTO outbox_events (event_type, payload, status='PENDING')
    App->>DB: COMMIT TRANSACTION (Tất cả thành công đồng thời)

    Worker->>DB: SELECT * FROM outbox_events WHERE status = 'PENDING' FOR UPDATE SKIP LOCKED
    Worker->>RMQ: Publish message vào exchange "payment.events"
    Worker->>DB: UPDATE outbox_events SET status = 'PUBLISHED'

    RMQ->>WebhookWorker: Nhận Event "payment_intent.succeeded"
    WebhookWorker->>WebhookWorker: Tạo HMAC-SHA256 Signature với Merchant Webhook Secret
    WebhookWorker->>MerchantServer: POST https://merchant.com/webhook (Header: X-Gateway-Signature)
    alt Merchant phản hồi 200 OK
        WebhookWorker->>DB: Ghi log WebhookDelivery (Status: SUCCESS)
    else Merchant phản hồi 5xx hoặc Timeout
        WebhookWorker->>RMQ: Nack & Đẩy vào Retry Queue (Delay 10s, 30s, 2m, 10m...)
        WebhookWorker->>DB: Ghi log WebhookDelivery (Status: RETRYING, attempt = n)
    end
```

---

## 4. CHI TIẾT THIẾT KẾ DATABASE SCHEMA (POSTGRESQL DDL)

Hệ thống sử dụng các kiểu dữ liệu tối ưu:
- **`UUIDv7`**: ID khóa chính tuần tự theo thời gian, chống đoán ID, index B-Tree nhanh như `BIGINT`.
- **`BIGINT`**: Toàn bộ số tiền (amount) đều lưu dưới dạng đơn vị nhỏ nhất (VND tính bằng đồng, USD tính bằng cent - không bao giờ dùng `FLOAT` / `DOUBLE`).

```sql
-- 1. BẢNG QUẢN LÝ MERCHANT
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG KHÓA API (TEST & LIVE SEPARATION)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    key_prefix VARCHAR(16) NOT NULL, -- 'pk_test_', 'sk_test_', 'pk_live_', 'sk_live_'
    secret_hash VARCHAR(255) NOT NULL, -- SHA-256 hash của API key (Không bao giờ lưu raw secret)
    key_type VARCHAR(20) NOT NULL, -- 'PUBLISHABLE', 'SECRET'
    environment VARCHAR(20) NOT NULL, -- 'TEST', 'LIVE'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_api_keys_hash ON api_keys(secret_hash);

-- 3. BẢNG KHÁCH HÀNG (CUSTOMER)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    email VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. BẢNG THẺ ĐÃ TOKENIZE (PCI-DSS CARD VAULT)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    type VARCHAR(50) NOT NULL, -- 'CARD', 'VIETQR', 'MOMO'
    card_brand VARCHAR(50), -- 'VISA', 'MASTERCARD'
    card_last4 VARCHAR(4),
    card_exp_month INT,
    card_exp_year INT,
    vault_token VARCHAR(255) UNIQUE NOT NULL, -- Token trả về cho client (pm_card_...)
    encrypted_card_data TEXT NOT NULL, -- Mã hóa AES-256-GCM chứa PAN, Holder Name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG VÒNG ĐỜI GIAO DỊCH (PAYMENT_INTENTS)
CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    customer_id UUID REFERENCES customers(id),
    amount BIGINT NOT NULL, -- Số tiền nguyên thủy
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(50) NOT NULL, -- REQUIRES_PAYMENT_METHOD, REQUIRES_CONFIRMATION, REQUIRES_ACTION, PROCESSING, SUCCEEDED, FAILED, CANCELED
    client_secret VARCHAR(255) UNIQUE NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE,
    payment_method_id UUID REFERENCES payment_methods(id),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_payment_intents_merchant ON payment_intents(merchant_id, status);

-- 6. BẢNG LẦN TRỪ TIỀN THỰC TẾ (CHARGES)
CREATE TABLE charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    amount BIGINT NOT NULL,
    fee_amount BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    processor_tx_id VARCHAR(255), -- Mã giao dịch từ Ngân hàng / Visa / VietQR
    processor_code VARCHAR(50) NOT NULL, -- 'MOCK_BANK', 'VIETQR_NAPAS'
    status VARCHAR(50) NOT NULL, -- 'SUCCEEDED', 'FAILED', 'PENDING'
    failure_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. BẢNG TÀI KHOẢN SỔ CÁI (LEDGER ACCOUNTS)
CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id), -- NULL nếu là tài khoản của Hệ thống sàn
    account_code VARCHAR(50) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. BẢNG BÚT TOÁN SỔ CÁI BẤT BIẾN (IMMUTABLE LEDGER ENTRIES)
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    charge_id UUID REFERENCES charges(id),
    debit_account_id UUID NOT NULL REFERENCES ledger_accounts(id),
    credit_account_id UUID NOT NULL REFERENCES ledger_accounts(id),
    amount BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    description VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. BẢNG SỰ KIỆN OUTBOX (TRANSACTIONAL OUTBOX)
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100) NOT NULL, -- 'PAYMENT_INTENT', 'CHARGE', 'REFUND'
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'payment_intent.succeeded', 'charge.refunded'
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PUBLISHED', 'FAILED'
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_outbox_pending ON outbox_events(status, created_at);

-- 10. BẢNG LỊCH SỬ BẮN WEBHOOK (WEBHOOK DELIVERIES)
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    event_id UUID NOT NULL REFERENCES outbox_events(id),
    endpoint_url VARCHAR(500) NOT NULL,
    request_headers JSONB,
    request_payload JSONB,
    response_status INT,
    response_body TEXT,
    duration_ms INT,
    attempt INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'FAILED', 'RETRYING'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. THIẾT KẾ CẤU TRÚC CODE SPRING BOOT 3 (CLEAN ARCHITECTURE)

Dự án được tổ chức theo các gói (packages) rõ ràng, bảo vệ tuyệt đối Domain Logic:

```
com.paymentgateway/
├── domain/                      <-- Không phụ thuộc vào Spring hay Hibernate
│   ├── model/
│   │   ├── payment/             <-- PaymentIntent, Charge, Money, Currency
│   │   ├── ledger/              <-- LedgerAccount, LedgerEntry, AccountType
│   │   ├── merchant/            <-- Merchant, ApiKey, Environment
│   │   └── vault/               <-- CardToken, PaymentMethod
│   ├── event/                   <-- PaymentSucceededEvent, RefundCreatedEvent
│   └── exception/               <-- InsufficientFundsException, IdempotencyConflictException
│
├── application/                 <-- Use Cases & Orchestration
│   ├── port/
│   │   ├── in/                  <-- CreatePaymentIntentUseCase, ConfirmPaymentUseCase
│   │   └── out/                 <-- PaymentRepositoryPort, BankProcessorPort, VaultPort
│   ├── service/                 <-- PaymentIntentApplicationService, WebhookService
│   └── dto/                     <-- Request / Response DTOs
│
├── infrastructure/              <-- Triển khai kỹ thuật (Spring, JPA, Redis, RabbitMQ)
│   ├── adapter/
│   │   ├── persistence/         <-- Spring Data JPA Repositories & PostgreSQL Mappings
│   │   ├── redis/               <-- RedissonDistributedLockAdapter, IdempotencyRedisAdapter
│   │   ├── rabbitmq/            <-- RabbitMqOutboxPublisher, WebhookMessageConsumer
│   │   ├── processor/           <-- MockBankProcessorAdapter, VietQrProcessorAdapter
│   │   └── security/            <-- AesGcmCardVaultAdapter, HmacSignatureUtil
│   └── config/                  <-- SecurityConfig, RedisConfig, RabbitMqConfig, OpenApiConfig
│
└── presentation/                <-- Tầng tiếp nhận Request từ ngoài vào
    ├── rest/
    │   ├── v1/                  <-- PaymentIntentController, CustomerController, WebhookController
    │   └── admin/               <-- AdminDashboardController, MerchantAccountController
    ├── filter/                  <-- ApiKeyAuthFilter, IdempotencyFilter, RequestLoggingFilter
    └── advice/                  <-- GlobalRestExceptionHandler (Format lỗi chuẩn Stripe JSON)
```

---

## 6. ĐẶC TẢ API CHUẨN RESTFUL (STRIPE-COMPLIANT ERROR & PAYLOADS)

### 6.1. Tạo PaymentIntent (`POST /v1/payment_intents`)
**Header:**
```http
Authorization: Bearer sk_test_51MzxyzFakeSecretKey
Idempotency-Key: e4a70656-7fa9-4458-9419-747f3df3e488
Content-Type: application/json
```
**Request Body:**
```json
{
  "amount": 250000,
  "currency": "VND",
  "payment_method_types": ["card", "vietqr"],
  "description": "Thanh toán đơn hàng #ORD-88219",
  "metadata": {
    "order_id": "ORD-88219",
    "customer_id": "cust_01j7xyz"
  }
}
```
**Response (201 Created):**
```json
{
  "id": "pi_01j79abc12345678",
  "object": "payment_intent",
  "amount": 250000,
  "currency": "VND",
  "status": "requires_payment_method",
  "client_secret": "pi_01j79abc12345678_secret_xyz890",
  "created": 1727354400,
  "metadata": {
    "order_id": "ORD-88219"
  }
}
```

### 6.2. Định dạng Lỗi Chuẩn Hóa (Standard Error Response)
```json
{
  "error": {
    "type": "card_error",
    "code": "insufficient_funds",
    "message": "Thẻ của bạn không đủ số dư để thực hiện giao dịch.",
    "param": "payment_method",
    "doc_url": "https://gateway.dev/docs/error-codes#insufficient_funds"
  }
}
```

---

## 7. MOCK BANK SIMULATOR (DÀNH CHO DEMO & TEST)

Để phục vụ báo cáo đồ án và kiểm thử, hệ thống cung cấp **Simulator** tích hợp sẵn:

| Số thẻ Test | Tên chủ thẻ | CVV / Hạn | Hành vi giả lập | Trạng thái PaymentIntent |
| :--- | :--- | :--- | :--- | :--- |
| `4242 4242 4242 4242` | NGUYEN VAN A | Bất kỳ | Thanh toán thành công ngay lập tức | `SUCCEEDED` |
| `4000 0000 0000 0002` | LE VAN B | Bất kỳ | Thẻ hết tiền (`insufficient_funds`) | `FAILED` |
| `4000 0000 0000 0005` | TRAN VAN C | Bất kỳ | Thẻ bị khóa (`card_declined`) | `FAILED` |
| `4000 0000 0000 3000` | HOANG VAN D | Bất kỳ | Kích hoạt 3D-Secure / OTP giả lập | `REQUIRES_ACTION` |
| `4000 0000 0000 5000` | PHAM VAN E | Bất kỳ | Giả lập đối tác ngân hàng Timeout | `PROCESSING` (Sau đó Reconcile) |

---

## 8. LỘ TRÌNH TRIỂN KHAI KỸ THUẬT (ACTIONABLE ROADMAP)

1. **Sprint 1 (Infrastructure & Domain Foundations):**
   - Viết `docker-compose.yml` (PostgreSQL 16, Redis 7, RabbitMQ 3.13).
   - Khởi tạo Spring Boot 3.3 skeleton với Clean Architecture.
   - Viết DDL migration (Flyway) thiết lập 10 bảng dữ liệu.
2. **Sprint 2 (Idempotency, Auth & Card Vault):**
   - Cài đặt `ApiKeyAuthFilter` và `IdempotencyFilter` (Redisson Distributed Lock).
   - Cài đặt thuật toán mã hóa AES-256-GCM cho Card Vault & sinh Token.
3. **Sprint 3 (Payment Engine & Mock Banking Processor):**
   - Hoàn thiện State Machine của `PaymentIntent` (`create`, `confirm`, `process`).
   - Tích hợp Mock Bank Simulator xử lý các kịch bản test thẻ.
4. **Sprint 4 (Double-Entry Ledger & Transactional Outbox):**
   - Cài đặt cơ chế ghi bút toán sổ cái bất biến khi thanh toán thành công.
   - Worker đọc Outbox và bắn Webhook với HMAC-SHA256 signature kèm cơ chế Exponential Retry.
5. **Sprint 5 (Frontend Dashboard & Checkout SDK Demo):**
   - Xây dựng Merchant Portal (Next.js 14) xem biểu đồ doanh thu, danh sách transactions, Webhook logs.
   - Xây dựng 1 trang E-commerce demo tích hợp Checkout SDK để test end-to-end.
