-- Stages 9-10: risk controls, settlement/payout, disputes and reconciliation.

CREATE TABLE risk_profiles (
    merchant_id UUID PRIMARY KEY REFERENCES merchants(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_transaction_amount BIGINT NOT NULL DEFAULT 50000000 CHECK (max_transaction_amount > 0),
    daily_volume_limit BIGINT NOT NULL DEFAULT 500000000 CHECK (daily_volume_limit > 0),
    velocity_limit_per_minute INT NOT NULL DEFAULT 20 CHECK (velocity_limit_per_minute > 0),
    review_score_threshold INT NOT NULL DEFAULT 50 CHECK (review_score_threshold BETWEEN 1 AND 100),
    block_score_threshold INT NOT NULL DEFAULT 80 CHECK (block_score_threshold BETWEEN 1 AND 100),
    blocked_email_domains TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO risk_profiles (merchant_id) SELECT id FROM merchants ON CONFLICT DO NOTHING;

CREATE TABLE risk_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
    decision VARCHAR(20) NOT NULL,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_risk_evaluations_merchant_created ON risk_evaluations(merchant_id, created_at DESC);
CREATE INDEX idx_risk_evaluations_intent ON risk_evaluations(payment_intent_id);

CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    gross_amount BIGINT NOT NULL DEFAULT 0,
    fee_amount BIGINT NOT NULL DEFAULT 0,
    refund_amount BIGINT NOT NULL DEFAULT 0,
    net_amount BIGINT NOT NULL DEFAULT 0 CHECK (net_amount >= 0),
    charge_count INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP WITH TIME ZONE
);
CREATE UNIQUE INDEX uq_settlements_merchant_idempotency ON settlements(merchant_id, idempotency_key);
CREATE INDEX idx_settlements_merchant_created ON settlements(merchant_id, created_at DESC);

CREATE TABLE settlement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    charge_id UUID NOT NULL REFERENCES charges(id),
    gross_amount BIGINT NOT NULL,
    fee_amount BIGINT NOT NULL,
    refund_amount BIGINT NOT NULL,
    net_amount BIGINT NOT NULL CHECK (net_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(charge_id)
);
CREATE INDEX idx_settlement_items_settlement ON settlement_items(settlement_id);

CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    settlement_id UUID REFERENCES settlements(id) ON DELETE SET NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(30) NOT NULL,
    destination_reference VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    processor_payout_id VARCHAR(255),
    idempotency_key VARCHAR(255) NOT NULL,
    failure_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);
CREATE UNIQUE INDEX uq_payouts_merchant_idempotency ON payouts(merchant_id, idempotency_key);
CREATE INDEX idx_payouts_merchant_created ON payouts(merchant_id, created_at DESC);

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    charge_id UUID NOT NULL REFERENCES charges(id),
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    evidence JSONB,
    source_account_id UUID NOT NULL REFERENCES ledger_accounts(id),
    due_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_disputes_merchant_created ON disputes(merchant_id, created_at DESC);
CREATE INDEX idx_disputes_charge ON disputes(charge_id);

CREATE TABLE reconciliation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    processor_code VARCHAR(50) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) NOT NULL,
    matched_count INT NOT NULL DEFAULT 0,
    mismatch_count INT NOT NULL DEFAULT 0,
    external_count INT NOT NULL DEFAULT 0,
    internal_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_reconciliation_runs_merchant_created ON reconciliation_runs(merchant_id, created_at DESC);

CREATE TABLE reconciliation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
    charge_id UUID REFERENCES charges(id) ON DELETE SET NULL,
    processor_tx_id VARCHAR(255),
    result VARCHAR(40) NOT NULL,
    internal_amount BIGINT,
    external_amount BIGINT,
    internal_status VARCHAR(50),
    external_status VARCHAR(50),
    details VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_reconciliation_items_run ON reconciliation_items(run_id, result);

ALTER TABLE ledger_entries
    ADD COLUMN settlement_id UUID REFERENCES settlements(id) ON DELETE SET NULL,
    ADD COLUMN payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
    ADD COLUMN dispute_id UUID REFERENCES disputes(id) ON DELETE SET NULL;
CREATE INDEX idx_ledger_settlement ON ledger_entries(settlement_id);
CREATE INDEX idx_ledger_payout ON ledger_entries(payout_id);
CREATE INDEX idx_ledger_dispute ON ledger_entries(dispute_id);

CREATE UNIQUE INDEX uq_webhook_delivery_event_endpoint
    ON webhook_deliveries(event_id, endpoint_id)
    WHERE endpoint_id IS NOT NULL;

CREATE OR REPLACE FUNCTION reject_financial_record_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION '% is append-only; % is not allowed', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_entries_append_only
    BEFORE UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();

CREATE TRIGGER audit_logs_append_only
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
