-- Stages 6-8: payment correctness, merchant control plane and sandbox checkout.

ALTER TABLE payment_intents
    ADD COLUMN request_hash VARCHAR(64),
    ADD COLUMN last_error_code VARCHAR(100),
    ADD COLUMN canceled_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE payment_intents DROP CONSTRAINT IF EXISTS payment_intents_idempotency_key_key;
CREATE UNIQUE INDEX uq_payment_intents_merchant_idempotency
    ON payment_intents(merchant_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

ALTER TABLE charges ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    charge_id UUID NOT NULL REFERENCES charges(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL,
    reason VARCHAR(255),
    processor_refund_id VARCHAR(255),
    idempotency_key VARCHAR(255),
    failure_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_refunds_charge ON refunds(charge_id, status);
CREATE UNIQUE INDEX uq_refunds_merchant_idempotency
    ON refunds(merchant_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

ALTER TABLE ledger_entries ADD COLUMN refund_id UUID REFERENCES refunds(id) ON DELETE SET NULL;
CREATE INDEX idx_ledger_refund ON ledger_entries(refund_id);

ALTER TABLE api_keys
    ADD COLUMN display_name VARCHAR(100) NOT NULL DEFAULT 'Default key',
    ADD COLUMN scopes TEXT NOT NULL DEFAULT '*',
    ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    description VARCHAR(255),
    signing_secret VARCHAR(255) NOT NULL,
    subscribed_events TEXT NOT NULL DEFAULT '*',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_webhook_endpoints_merchant ON webhook_endpoints(merchant_id, status);

INSERT INTO webhook_endpoints (merchant_id, url, description, signing_secret, subscribed_events)
SELECT id, webhook_url, 'Migrated default endpoint', webhook_secret, '*'
FROM merchants
WHERE webhook_url IS NOT NULL;

ALTER TABLE webhook_deliveries
    ADD COLUMN endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE SET NULL,
    ADD COLUMN next_attempt_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN error_message TEXT;
CREATE INDEX idx_webhook_deliveries_due ON webhook_deliveries(status, next_attempt_at);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
    actor_type VARCHAR(30) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    request_id VARCHAR(100),
    ip_address VARCHAR(64),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_merchant_created ON audit_logs(merchant_id, created_at DESC);

