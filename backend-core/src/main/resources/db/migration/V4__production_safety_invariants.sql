-- Production safety invariants: remove card-data-at-rest semantics and make
-- financial postings structurally idempotent at the database boundary.

ALTER TABLE payment_methods
    ADD COLUMN processor_token VARCHAR(255),
    ADD COLUMN encrypted_metadata TEXT;

UPDATE payment_methods
SET processor_token = vault_token,
    encrypted_metadata = encrypted_card_data;

ALTER TABLE payment_methods
    ALTER COLUMN processor_token SET NOT NULL,
    ALTER COLUMN encrypted_metadata SET NOT NULL,
    DROP COLUMN encrypted_card_data;

COMMENT ON COLUMN payment_methods.processor_token IS
    'Opaque sandbox/acquirer token. PAN and CVC must never be stored here.';
COMMENT ON COLUMN payment_methods.encrypted_metadata IS
    'Non-sensitive processor metadata only. PAN, PIN, track data and CVC are prohibited.';

ALTER TABLE customers
    ADD COLUMN encrypted_pii TEXT,
    ADD COLUMN email_domain VARCHAR(255),
    ADD COLUMN pii_erased_at TIMESTAMP WITH TIME ZONE;

UPDATE customers
SET email_domain = CASE WHEN email LIKE '%@%'
    THEN lower(substring(email from position('@' in email) + 1)) ELSE NULL END;

-- Existing project/demo PII is deliberately discarded rather than copied in
-- plaintext. New records are encrypted by the application vault adapter.
ALTER TABLE customers
    DROP COLUMN email,
    DROP COLUMN full_name,
    DROP COLUMN phone;

COMMENT ON COLUMN customers.encrypted_pii IS
    'Encrypted customer contact metadata; never contains payment credentials.';

ALTER TABLE ledger_entries
    ADD COLUMN entry_type VARCHAR(50);

-- V3 already protects this table from UPDATE/DELETE. Temporarily suspend only
-- that named trigger for this one-time, transactional classification backfill.
ALTER TABLE ledger_entries DISABLE TRIGGER ledger_entries_append_only;

UPDATE ledger_entries
SET entry_type = CASE
    WHEN refund_id IS NOT NULL THEN 'REFUND'
    WHEN settlement_id IS NOT NULL THEN 'SETTLEMENT'
    WHEN payout_id IS NOT NULL THEN 'PAYOUT'
    WHEN dispute_id IS NOT NULL AND description LIKE 'Funds reserved%' THEN 'DISPUTE_HOLD'
    WHEN dispute_id IS NOT NULL AND description LIKE 'Dispute resolved WON%' THEN 'DISPUTE_RELEASE'
    WHEN dispute_id IS NOT NULL THEN 'DISPUTE_LOSS'
    WHEN charge_id IS NOT NULL AND description LIKE 'Platform gateway processing fee%' THEN 'PAYMENT_FEE'
    WHEN charge_id IS NOT NULL THEN 'PAYMENT_GROSS'
    ELSE 'LEGACY'
END;

ALTER TABLE ledger_entries ENABLE TRIGGER ledger_entries_append_only;

ALTER TABLE ledger_entries
    ALTER COLUMN entry_type SET NOT NULL,
    ADD CONSTRAINT ck_ledger_amount_positive CHECK (amount > 0),
    ADD CONSTRAINT ck_ledger_distinct_accounts CHECK (debit_account_id <> credit_account_id),
    ADD CONSTRAINT ck_ledger_currency_format CHECK (currency ~ '^[A-Z]{3}$');

CREATE UNIQUE INDEX uq_ledger_charge_entry_type
    ON ledger_entries(charge_id, entry_type)
    WHERE charge_id IS NOT NULL AND refund_id IS NULL AND dispute_id IS NULL;
CREATE UNIQUE INDEX uq_ledger_refund_entry_type
    ON ledger_entries(refund_id, entry_type)
    WHERE refund_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ledger_settlement_entry_type
    ON ledger_entries(settlement_id, entry_type)
    WHERE settlement_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ledger_payout_entry_type
    ON ledger_entries(payout_id, entry_type)
    WHERE payout_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ledger_dispute_entry_type
    ON ledger_entries(dispute_id, entry_type)
    WHERE dispute_id IS NOT NULL;

CREATE UNIQUE INDEX uq_charge_processor_reference
    ON charges(processor_code, processor_tx_id)
    WHERE processor_tx_id IS NOT NULL;

ALTER TABLE charges
    ADD CONSTRAINT ck_charge_amount_positive CHECK (amount > 0),
    ADD CONSTRAINT ck_charge_fee_non_negative CHECK (fee_amount >= 0),
    ADD CONSTRAINT ck_charge_fee_not_above_amount CHECK (fee_amount <= amount);

CREATE TABLE idempotency_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(255) NOT NULL,
    request_hash VARCHAR(64),
    response_type VARCHAR(255) NOT NULL,
    response_payload TEXT,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_idempotency_record UNIQUE (merchant_id, idempotency_key),
    CONSTRAINT ck_idempotency_status CHECK (status IN ('IN_PROGRESS', 'COMPLETED'))
);
CREATE INDEX idx_idempotency_records_created ON idempotency_records(created_at);

CREATE TABLE processor_callbacks (
    event_id VARCHAR(255) PRIMARY KEY,
    processor_tx_id VARCHAR(255) NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    processing_status VARCHAR(30) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_processor_callback_status CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'UNMATCHED'))
);
CREATE INDEX idx_processor_callbacks_transaction ON processor_callbacks(processor_tx_id);

-- Financial history is never physically deleted. Corrections are represented by
-- new ledger postings and lifecycle status changes.
CREATE TRIGGER charges_no_delete
    BEFORE DELETE ON charges FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
CREATE TRIGGER refunds_no_delete
    BEFORE DELETE ON refunds FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
CREATE TRIGGER settlements_no_delete
    BEFORE DELETE ON settlements FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
CREATE TRIGGER settlement_items_no_delete
    BEFORE DELETE ON settlement_items FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
CREATE TRIGGER payouts_no_delete
    BEFORE DELETE ON payouts FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
CREATE TRIGGER disputes_no_delete
    BEFORE DELETE ON disputes FOR EACH ROW EXECUTE FUNCTION reject_financial_record_mutation();
