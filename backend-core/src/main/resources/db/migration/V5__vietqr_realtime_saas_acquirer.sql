-- Stages 20-25: VietQR core, bank transaction matching, webhook policies,
-- SaaS controls and the persistent acquirer lifecycle boundary.

ALTER TABLE merchants
    ADD COLUMN onboarding_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN kyb_status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    ADD COLUMN legal_name VARCHAR(255);

CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    bank_code VARCHAR(30) NOT NULL,
    bank_bin VARCHAR(6) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'BUSINESS',
    connection_mode VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    connection_reference VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bank_account_number UNIQUE (merchant_id, bank_code, account_number),
    CONSTRAINT ck_bank_account_status CHECK (status IN ('PENDING', 'ACTIVE', 'DISCONNECTED', 'DISABLED'))
);
CREATE INDEX idx_bank_accounts_merchant_status ON bank_accounts(merchant_id, status);
CREATE UNIQUE INDEX uq_bank_account_default ON bank_accounts(merchant_id)
    WHERE is_default AND status = 'ACTIVE';

CREATE TABLE payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    payment_intent_id UUID NOT NULL UNIQUE REFERENCES payment_intents(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    slug VARCHAR(80) NOT NULL UNIQUE,
    payment_code VARCHAR(40) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_payment_link_status CHECK (status IN ('OPEN', 'PAID', 'EXPIRED', 'CANCELED'))
);
CREATE INDEX idx_payment_links_match ON payment_links(bank_account_id, status, expires_at);

CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    external_reference VARCHAR(255) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    description VARCHAR(500),
    payment_code VARCHAR(40),
    counterparty_account VARCHAR(100),
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    raw_payload JSONB NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    match_status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
    payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE SET NULL,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    matched_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_bank_transaction_reference UNIQUE (bank_account_id, external_reference),
    CONSTRAINT ck_bank_transaction_direction CHECK (direction IN ('IN', 'OUT')),
    CONSTRAINT ck_bank_transaction_match CHECK (match_status IN ('RECEIVED', 'MATCHED', 'UNMATCHED', 'DUPLICATE', 'REVIEW'))
);
CREATE INDEX idx_bank_transactions_merchant_received ON bank_transactions(merchant_id, received_at DESC);
CREATE INDEX idx_bank_transactions_match ON bank_transactions(bank_account_id, amount, match_status);

ALTER TABLE webhook_endpoints
    ADD COLUMN auth_type VARCHAR(30) NOT NULL DEFAULT 'HMAC_SHA256',
    ADD COLUMN auth_config_encrypted TEXT,
    ADD COLUMN previous_signing_secret VARCHAR(255),
    ADD COLUMN previous_secret_valid_until TIMESTAMP WITH TIME ZONE,
    ADD COLUMN bank_code_filter TEXT NOT NULL DEFAULT '*',
    ADD COLUMN account_id_filter TEXT NOT NULL DEFAULT '*',
    ADD COLUMN direction_filter TEXT NOT NULL DEFAULT '*',
    ADD COLUMN payment_code_prefix_filter TEXT NOT NULL DEFAULT '*',
    ADD COLUMN consecutive_failures INT NOT NULL DEFAULT 0,
    ADD COLUMN alert_channel VARCHAR(30),
    ADD COLUMN alert_destination VARCHAR(500),
    ADD CONSTRAINT ck_webhook_auth_type CHECK (auth_type IN ('HMAC_SHA256', 'API_KEY', 'OAUTH2'));

CREATE TABLE webhook_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    delivery_id UUID REFERENCES webhook_deliveries(id) ON DELETE SET NULL,
    channel VARCHAR(30) NOT NULL,
    destination VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    message VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_webhook_alerts_status ON webhook_alerts(status, created_at);

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'INVITED',
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_organization_member UNIQUE (merchant_id, email),
    CONSTRAINT ck_organization_role CHECK (role IN ('OWNER', 'DEVELOPER', 'FINANCE', 'AUDITOR')),
    CONSTRAINT ck_organization_member_status CHECK (status IN ('INVITED', 'ACTIVE', 'DISABLED'))
);

CREATE TABLE plans (
    code VARCHAR(30) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    monthly_price BIGINT NOT NULL DEFAULT 0,
    monthly_payment_limit INT NOT NULL,
    bank_account_limit INT NOT NULL,
    webhook_endpoint_limit INT NOT NULL,
    retention_days INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO plans(code, display_name, monthly_price, monthly_payment_limit, bank_account_limit, webhook_endpoint_limit, retention_days)
VALUES ('FREE', 'Free Sandbox', 0, 1000, 2, 2, 30),
       ('GROWTH', 'Growth', 499000, 50000, 10, 10, 180),
       ('SCALE', 'Scale', 1999000, 500000, 100, 100, 730);

CREATE TABLE merchant_subscriptions (
    merchant_id UUID PRIMARY KEY REFERENCES merchants(id) ON DELETE CASCADE,
    plan_code VARCHAR(30) NOT NULL REFERENCES plans(code),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', CURRENT_TIMESTAMP),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '1 month',
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_subscription_status CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'))
);
INSERT INTO merchant_subscriptions(merchant_id, plan_code)
SELECT id, 'FREE' FROM merchants ON CONFLICT DO NOTHING;

INSERT INTO organization_members(merchant_id, email, display_name, role, status, joined_at)
SELECT id, email, business_name || ' Owner', 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP
FROM merchants ON CONFLICT DO NOTHING;

CREATE TABLE acquirer_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE SET NULL,
    parent_operation_id UUID REFERENCES acquirer_operations(id),
    operation_type VARCHAR(30) NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    processor_code VARCHAR(60) NOT NULL,
    processor_reference VARCHAR(255) NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(30) NOT NULL,
    three_ds_version VARCHAR(20),
    action_url VARCHAR(500),
    failure_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_acquirer_operation UNIQUE (merchant_id, idempotency_key),
    CONSTRAINT ck_acquirer_operation_type CHECK (operation_type IN ('AUTHORIZE', 'CAPTURE', 'VOID', 'REFUND', 'DISPUTE'))
);
CREATE INDEX idx_acquirer_operations_intent ON acquirer_operations(payment_intent_id, created_at);

ALTER TABLE charges
    ADD COLUMN authorization_reference VARCHAR(255),
    ADD COLUMN captured_amount BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN capture_mode VARCHAR(20) NOT NULL DEFAULT 'AUTOMATIC',
    ADD COLUMN voided_at TIMESTAMP WITH TIME ZONE;

INSERT INTO bank_accounts(id, merchant_id, bank_code, bank_bin, account_number, account_name, account_type, status, is_default)
VALUES ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111',
        'ACB', '970416', '24550721', 'TECHSTORE VIETNAM DEMO', 'BUSINESS', 'ACTIVE', TRUE)
ON CONFLICT DO NOTHING;

CREATE TRIGGER bank_transactions_no_delete
    BEFORE DELETE ON bank_transactions
    FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
