-- ==============================================================================
-- STRIPE-LIKE PAYMENT GATEWAY INITIAL DATABASE SCHEMA (V1)
-- ==============================================================================

-- 1. BẢNG THÔNG TIN MERCHANT
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

-- 2. BẢNG KHÓA API (TEST & LIVE)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    key_prefix VARCHAR(16) NOT NULL, -- 'pk_test_', 'sk_test_', 'pk_live_', 'sk_live_'
    secret_hash VARCHAR(255) NOT NULL, -- SHA-256 hash của raw key
    key_type VARCHAR(20) NOT NULL, -- 'PUBLISHABLE', 'SECRET'
    environment VARCHAR(20) NOT NULL DEFAULT 'TEST', -- 'TEST', 'LIVE'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_api_keys_hash ON api_keys(secret_hash);
CREATE INDEX idx_api_keys_merchant ON api_keys(merchant_id);

-- 3. BẢNG KHÁCH HÀNG (CUSTOMER)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_customers_merchant ON customers(merchant_id);

-- 4. BẢNG PHƯƠNG THỨC THANH TOÁN / THẺ ĐÃ TOKENIZE (PCI CARD VAULT)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'CARD', 'VIETQR', 'MOMO'
    card_brand VARCHAR(50), -- 'VISA', 'MASTERCARD', 'JCB'
    card_last4 VARCHAR(4),
    card_exp_month INT,
    card_exp_year INT,
    vault_token VARCHAR(255) UNIQUE NOT NULL, -- Token trả về dạng 'pm_card_...'
    encrypted_card_data TEXT NOT NULL, -- Mã hóa AES-256-GCM chứa PAN, CVV, Cardholder
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_payment_methods_token ON payment_methods(vault_token);

-- 5. BẢNG VÒNG ĐỜI GIAO DỊCH (PAYMENT_INTENTS)
CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    amount BIGINT NOT NULL, -- Số tiền nguyên thủy (VND / Cent)
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(50) NOT NULL, -- REQUIRES_PAYMENT_METHOD, REQUIRES_CONFIRMATION, REQUIRES_ACTION, PROCESSING, SUCCEEDED, FAILED, CANCELED
    client_secret VARCHAR(255) UNIQUE NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_payment_intents_merchant_status ON payment_intents(merchant_id, status);
CREATE INDEX idx_payment_intents_idemp ON payment_intents(idempotency_key);

-- 6. BẢNG LẦN TRỪ TIỀN THỰC TẾ (CHARGES)
CREATE TABLE charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    fee_amount BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    processor_tx_id VARCHAR(255),
    processor_code VARCHAR(50) NOT NULL, -- 'MOCK_BANK', 'VIETQR'
    status VARCHAR(50) NOT NULL, -- 'SUCCEEDED', 'FAILED', 'PENDING'
    failure_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_charges_intent ON charges(payment_intent_id);

-- 7. BẢNG TÀI KHOẢN SỔ CÁI (LEDGER ACCOUNTS)
CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE, -- NULL là tài khoản hệ thống của sàn
    account_code VARCHAR(50) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. BẢNG BÚT TOÁN SỔ CÁI BẤT BIẾN (IMMUTABLE LEDGER ENTRIES)
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    charge_id UUID REFERENCES charges(id) ON DELETE SET NULL,
    debit_account_id UUID NOT NULL REFERENCES ledger_accounts(id),
    credit_account_id UUID NOT NULL REFERENCES ledger_accounts(id),
    amount BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    description VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ledger_debit ON ledger_entries(debit_account_id);
CREATE INDEX idx_ledger_credit ON ledger_entries(credit_account_id);

-- 9. BẢNG SỰ KIỆN TRANSACTIONAL OUTBOX
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100) NOT NULL, -- 'PAYMENT_INTENT', 'CHARGE'
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'payment_intent.succeeded', etc.
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PUBLISHED', 'FAILED'
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_outbox_pending ON outbox_events(status, created_at);

-- 10. BẢNG LỊCH SỬ BẮN WEBHOOK
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES outbox_events(id) ON DELETE CASCADE,
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
CREATE INDEX idx_webhook_deliveries_merchant ON webhook_deliveries(merchant_id, status);

-- ==============================================================================
-- SEED INITIAL SYSTEM DATA (DEMO MERCHANT & SYSTEM LEDGER ACCOUNTS)
-- ==============================================================================

-- Sàn: Tài khoản Thanh toán Ngân hàng trung gian (Asset)
INSERT INTO ledger_accounts (id, merchant_id, account_code, account_name, account_type, currency)
VALUES ('00000000-0000-0000-0000-000000001001', NULL, '1001_SYSTEM_CLEARING', 'Cổng thanh toán trung gian Ngân hàng', 'ASSET', 'VND');

-- Sàn: Tài khoản Doanh thu phí giao dịch (Revenue)
INSERT INTO ledger_accounts (id, merchant_id, account_code, account_name, account_type, currency)
VALUES ('00000000-0000-0000-0000-000000004001', NULL, '4001_PLATFORM_FEE_REVENUE', 'Doanh thu phí dịch vụ cổng sàn', 'REVENUE', 'VND');

-- Demo Merchant: Cửa hàng mẫu "TechStore VN"
INSERT INTO merchants (id, business_name, email, status, webhook_url, webhook_secret)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'TechStore Vietnam Demo',
    'merchant@techstore.vn',
    'ACTIVE',
    'https://webhook.site/demo-payment-callback',
    'whsec_demo_secret_key_8892019382'
);

-- Khóa API cho Merchant Demo (sk_test_demo12345678, pk_test_demo12345678)
-- SHA-256 hash của "sk_test_demo12345678" là:
-- echo -n "sk_test_demo12345678" | sha256sum -> "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" (được sinh tự động trong code)
INSERT INTO api_keys (id, merchant_id, key_prefix, secret_hash, key_type, environment, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    'sk_test_',
    'e5ac378622c4f420efadca75ec7fa0c7c34d38c62c2f8f63567861be5ebad7ec', -- SHA-256 của "sk_test_demo_gateway_key_999"
    'SECRET',
    'TEST',
    TRUE
);

INSERT INTO api_keys (id, merchant_id, key_prefix, secret_hash, key_type, environment, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'pk_test_',
    'd8578edf8458ce06fbc5bb76a58c5ca4ecd500291754f43b3f559d43e01ca045', -- SHA-256 của "pk_test_demo_public_key_999"
    'PUBLISHABLE',
    'TEST',
    TRUE
);

-- Tài khoản Sổ cái của Merchant Demo
INSERT INTO ledger_accounts (id, merchant_id, account_code, account_name, account_type, currency)
VALUES (
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    '2001_MERCHANT_PENDING_TECHSTORE',
    'Số dư chờ đối soát TechStore Demo',
    'LIABILITY',
    'VND'
);

INSERT INTO ledger_accounts (id, merchant_id, account_code, account_name, account_type, currency)
VALUES (
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    '2002_MERCHANT_AVAILABLE_TECHSTORE',
    'Số dư khả dụng TechStore Demo',
    'LIABILITY',
    'VND'
);
