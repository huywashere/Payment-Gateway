-- Merchant portal operations: actionable notifications, invoices and plan history.

CREATE TABLE portal_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    resource_type VARCHAR(80),
    resource_id VARCHAR(255),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_portal_notification_severity CHECK (severity IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR'))
);
CREATE INDEX idx_portal_notifications_merchant_created
    ON portal_notifications(merchant_id, created_at DESC);
CREATE INDEX idx_portal_notifications_unread
    ON portal_notifications(merchant_id, read_at) WHERE read_at IS NULL;

CREATE TABLE billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    plan_code VARCHAR(30) NOT NULL REFERENCES plans(code),
    subtotal BIGINT NOT NULL DEFAULT 0,
    transaction_fee BIGINT NOT NULL DEFAULT 0,
    total BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(30) NOT NULL DEFAULT 'PAID',
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_billing_invoice_status CHECK (status IN ('DRAFT', 'OPEN', 'PAID', 'VOID', 'OVERDUE'))
);
CREATE INDEX idx_billing_invoices_merchant_issued
    ON billing_invoices(merchant_id, issued_at DESC);

CREATE TABLE subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    previous_plan VARCHAR(30),
    new_plan VARCHAR(30) NOT NULL,
    reason VARCHAR(255) NOT NULL DEFAULT 'PORTAL_CHANGE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_subscription_events_merchant_created
    ON subscription_events(merchant_id, created_at DESC);

INSERT INTO portal_notifications(merchant_id, type, severity, title, message)
SELECT id, 'SYSTEM_READY', 'SUCCESS', 'Sandbox đã sẵn sàng',
       'Gateway Core, VietQR, webhook và đối soát đang hoạt động.'
FROM merchants;

INSERT INTO portal_notifications(merchant_id, type, severity, title, message)
SELECT id, 'SANDBOX_NOTICE', 'WARNING', 'Bạn đang ở chế độ Sandbox',
       'Giao dịch trong môi trường này chỉ phục vụ mô phỏng và kiểm thử.'
FROM merchants;

INSERT INTO billing_invoices(merchant_id, invoice_number, period_start, period_end, plan_code,
                             subtotal, transaction_fee, total, status, due_at, paid_at)
SELECT ms.merchant_id,
       'INV-' || to_char(CURRENT_DATE, 'YYYYMM') || '-' || upper(substr(ms.merchant_id::text, 1, 8)),
       ms.current_period_start,
       ms.current_period_end,
       ms.plan_code,
       p.monthly_price,
       0,
       p.monthly_price,
       'PAID',
       ms.current_period_start + INTERVAL '7 days',
       CURRENT_TIMESTAMP
FROM merchant_subscriptions ms
JOIN plans p ON p.code = ms.plan_code
ON CONFLICT DO NOTHING;

INSERT INTO subscription_events(merchant_id, previous_plan, new_plan, reason)
SELECT merchant_id, NULL, plan_code, 'INITIAL_SUBSCRIPTION'
FROM merchant_subscriptions;
