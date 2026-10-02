const ids = {
  merchant: '11111111-1111-1111-1111-111111111111',
  bank: '22222222-2222-2222-2222-222222222222',
  payment: '33333333-3333-3333-3333-333333333333',
  endpoint: '44444444-4444-4444-4444-444444444444',
  delivery: '55555555-5555-5555-5555-555555555555',
};

const iso = (daysAgo = 0) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

const transactions = [
  { id: ids.payment, amount: 79000, currency: 'VND', status: 'SUCCEEDED', description: 'Sony WH-1000XM5', createdAt: iso(0) },
  { id: '33333333-3333-3333-3333-333333333334', amount: 49000, currency: 'VND', status: 'SUCCEEDED', description: 'Keychron Q1 Pro', createdAt: iso(1) },
  { id: '33333333-3333-3333-3333-333333333335', amount: 29000, currency: 'VND', status: 'PROCESSING', description: 'Logitech MX Master 3S', createdAt: iso(2) },
];

const bankAccounts = [{
  id: ids.bank, bankCode: 'ACB', accountNumberMasked: '**** 6688', accountNumber: '1234566688',
  accountName: 'NOVAGATE DEMO', accountType: 'BUSINESS', connectionMode: 'SANDBOX', status: 'ACTIVE',
  defaultAccount: true, lastSyncedAt: iso(), createdAt: iso(30),
}];

const paymentLinks = [{
  id: '66666666-6666-6666-6666-666666666666', slug: 'demo-novagate', paymentCode: 'PAY24092601',
  amount: 129000, currency: 'VND', description: 'Đơn hàng NovaGate Demo', status: 'OPEN', bankCode: 'ACB',
  bankName: 'ACB', accountNumber: '1234566688', accountName: 'NOVAGATE DEMO',
  qrPayload: '00020101021238570010A00000072701270006970416011312345666880208QRIBFTTA530370454061290005802VN6304DEMO',
  expiresAt: iso(-1), paymentUrl: '/pay/demo-novagate',
}];

const subscription = {
  plan: 'STARTUP', plan_name: 'Startup', status: 'ACTIVE', monthly_price: 96000,
  payment_usage: 36, payment_limit: 180, bank_account_usage: 1, bank_account_limit: 3,
  webhook_endpoint_usage: 1, webhook_endpoint_limit: 5, period_end: iso(-30),
};

const webhookEndpoints = [{
  id: ids.endpoint, url: 'https://example.com/webhooks/novagate', description: 'Portfolio demo endpoint',
  subscribedEvents: ['payment_intent.succeeded', 'refund.succeeded'], status: 'ACTIVE', authType: 'HMAC_SHA256',
  bankCodes: ['*'], accountIds: ['*'], directions: ['IN'], paymentCodePrefixes: ['PAY'],
  consecutiveFailures: 0, alertChannel: 'EMAIL', alertDestination: 'ops@example.com',
}];

function analytics(days: number) {
  const daily = Array.from({ length: Math.min(days, 14) }, (_, index) => {
    const date = new Date(Date.now() - (Math.min(days, 14) - index - 1) * 86_400_000);
    return { date: date.toISOString().slice(0, 10), count: 2 + index % 4, amount: 120000 + index * 17000 };
  });
  return {
    generated_at: iso(), range_days: days, gross_volume: daily.reduce((sum, item) => sum + item.amount, 0),
    payment_count: 42, succeeded_count: 39, failed_count: 3, success_rate: 92.9,
    available_balance: 4286000, pending_balance: 318000, unread_notifications: 2, daily,
  };
}

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { 'cache-control': 'no-store', 'x-novagate-demo': 'portfolio' },
});

export function portfolioPrismaOverview() {
  return {
    success: true,
    engine: 'Portfolio demo snapshot',
    merchant: { id: ids.merchant, businessName: 'TechStore Vietnam', email: 'owner@novagate.local', apiKeysCount: 1 },
    ledgerAccounts: [
      { accountCode: 'CASH_AVAILABLE', accountName: 'Số dư khả dụng', balance: 4286000 },
      { accountCode: 'CASH_PENDING', accountName: 'Số dư chờ', balance: 318000 },
    ],
    stats: { totalIntents: 42, totalOutboxEvents: 3, totalWebhookDeliveries: 39 },
    transactions,
    deliveries: [],
  };
}

export async function portfolioGatewayResponse(pathname: string, request: Request): Promise<Response | null> {
  if (process.env.PORTFOLIO_DEMO_MODE !== 'true') return null;

  const method = request.method;
  const url = new URL(request.url);
  const days = Math.max(7, Math.min(90, Number(url.searchParams.get('days') || 30)));

  if (pathname === 'v1/dashboard/events' && method === 'GET') {
    return new Response(`retry: 60000\nevent: snapshot\ndata: ${JSON.stringify(analytics(30))}\n\n`, {
      headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store', 'x-novagate-demo': 'portfolio' },
    });
  }
  if (pathname === 'v1/balance' && method === 'GET') return json({ pending_balance: 318000, available_balance: 4286000, dispute_reserve: 120000, total_balance: 4724000 });
  if (pathname === 'v1/dashboard/overview' && method === 'GET') return json(analytics(days));
  if (pathname === 'v1/notifications' && method === 'GET') return json({ unread_count: 2, items: [
    { id: '77777777-7777-7777-7777-777777777777', severity: 'SUCCESS', title: 'Thanh toán thành công', message: 'PAY24092601 đã được đối soát.', readAt: null, createdAt: iso() },
    { id: '77777777-7777-7777-7777-777777777778', severity: 'INFO', title: 'Sandbox sẵn sàng', message: 'Portfolio demo đang sử dụng dữ liệu mô phỏng.', readAt: null, createdAt: iso(1) },
  ] });
  if (/^v1\/notifications\/(?:read-all|[0-9a-f-]+\/read)$/.test(pathname) && method === 'POST') return json({ success: true });
  if (pathname === 'v1/bank_accounts' && method === 'GET') return json(bankAccounts);
  if (pathname === 'v1/payment_links' && method === 'GET') return json(paymentLinks);
  if (pathname === 'v1/bank_transactions' && method === 'GET') return json([{ id: '88888888-8888-8888-8888-888888888888', bankCode: 'ACB', bankAccountId: ids.bank, externalReference: 'ACB-DEMO-2609', direction: 'IN', amount: 129000, currency: 'VND', description: 'PAY24092601', paymentCode: 'PAY24092601', matchStatus: 'MATCHED', paymentIntentId: ids.payment, occurredAt: iso(), receivedAt: iso() }]);
  if (pathname === 'v1/organization/subscription' && method === 'GET') return json(subscription);
  if (pathname === 'v1/organization/plans' && method === 'GET') return json([
    { code: 'FREE', displayName: 'Free', monthlyPrice: 0, monthlyPaymentLimit: 50, bankAccountLimit: 1, webhookEndpointLimit: 1, retentionDays: 7 },
    { code: 'STARTUP', displayName: 'Startup', monthlyPrice: 96000, monthlyPaymentLimit: 180, bankAccountLimit: 3, webhookEndpointLimit: 5, retentionDays: 90 },
  ]);
  if (pathname === 'v1/organization/members' && method === 'GET') return json([{ id: '99999999-9999-9999-9999-999999999999', email: 'owner@novagate.local', displayName: 'Nguyen Phu Huy', role: 'OWNER', status: 'ACTIVE', invitedAt: iso(60) }]);
  if (pathname === 'v1/webhooks/endpoints' && method === 'GET') return json(webhookEndpoints);
  if (pathname === 'v1/api_keys' && method === 'GET') return json([{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', displayName: 'Portfolio sandbox key', keyPrefix: 'sk_test_demo', environment: 'TEST', scopes: ['*'], active: true }]);
  if (pathname === 'v1/webhooks/deliveries' && method === 'GET') return json([{ id: ids.delivery, endpointId: ids.endpoint, endpointUrl: webhookEndpoints[0].url, requestPayload: '{"type":"payment_intent.succeeded"}', responseStatus: 200, responseBody: 'OK', durationMs: 84, attempt: 1, status: 'DELIVERED', createdAt: iso() }]);
  if (pathname === 'v1/webhooks/alerts' && method === 'GET') return json([]);
  if (pathname === 'v1/payment_intents' && method === 'GET') return json(transactions);
  if (pathname === 'v1/settlements' && method === 'GET') return json([{ id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', status: 'COMPLETED', netAmount: 4218000, feeAmount: 68000, refundAmount: 0, chargeCount: 39 }]);
  if (pathname === 'v1/payouts' && method === 'GET') return json([{ id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', amount: 3500000, status: 'PAID', destinationReference: 'ACB ****6688' }]);
  if (pathname === 'v1/disputes' && method === 'GET') return json([]);
  if (pathname === 'v1/risk/profile' && method === 'GET') return json({ enabled: true, maxTransactionAmount: 50000000, dailyVolumeLimit: 500000000, velocityLimitPerMinute: 30, reviewScoreThreshold: 60, blockScoreThreshold: 85 });
  if (pathname === 'v1/risk/evaluations' && method === 'GET') return json([{ id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', decision: 'APPROVE', score: 12 }]);
  if (pathname === 'v1/reconciliation_runs' && method === 'GET') return json([{ id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', status: 'COMPLETED', matchedCount: 39, mismatchCount: 0 }]);
  if (pathname === 'v1/audit_logs' && method === 'GET') return json([{ id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', actorType: 'PORTAL_USER', actorId: 'owner@novagate.local', action: 'DEMO_SESSION_STARTED', resourceType: 'PORTFOLIO', ipAddress: 'redacted', details: 'Read-only portfolio snapshot', createdAt: iso() }]);
  if (pathname === 'v1/billing/invoices' && method === 'GET') return json([{ id: '12121212-1212-1212-1212-121212121212', invoiceNumber: 'INV-DEMO-0926', periodStart: iso(30), periodEnd: iso(), planCode: 'STARTUP', total: 96000, currency: 'VND', status: 'PAID', issuedAt: iso() }]);
  if (pathname === 'v1/billing/subscription-events' && method === 'GET') return json([{ id: '13131313-1313-1313-1313-131313131313', previousPlan: 'FREE', newPlan: 'STARTUP', reason: 'Portfolio demo upgrade', createdAt: iso(14) }]);
  if (pathname === 'v1/acquirer/hosted-fields/config' && method === 'GET') return json({ mode: 'sandbox', tokenizationEndpoint: '/v1/payment_methods', allowedFields: ['number', 'expMonth', 'expYear', 'cvc'], rawCardDataMustNotReachMerchantServer: true, threeDsVersions: ['2.2.0'] });
  if (pathname === 'v1/acquirer/operations' && method === 'GET') return json([]);
  if (pathname === 'v1/platform/merchants' && method === 'GET') return json([{ id: ids.merchant, businessName: 'TechStore Vietnam', legalName: 'TechStore Vietnam Demo', email: 'owner@novagate.local', status: 'ACTIVE', onboardingStatus: 'COMPLETED', kybStatus: 'VERIFIED', plan: 'STARTUP', createdAt: iso(90) }]);
  if (pathname === 'v1/platform/operations/readiness' && method === 'GET') return json({ mode: 'portfolio-demo', database: 'simulated', bankProcessor: 'sandbox', externalControlsAttested: false, productionReady: false });

  const publicLink = pathname.match(/^v1\/payment_links\/public\/([^/]+)$/);
  if (publicLink && method === 'GET') return json(paymentLinks[0]);
  if (/^v1\/payment_links\/public\/[^/]+\/events$/.test(pathname) && method === 'GET') return new Response(`retry: 60000\nevent: status\ndata: ${JSON.stringify({ status: 'OPEN' })}\n\n`, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store' } });
  if (/^v1\/payment_links\/public\/[^/]+\/qr\.svg$/.test(pathname) && method === 'GET') return new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" fill="white"/><path d="M12 12h48v48H12zm88 0h48v48h-48zM12 100h48v48H12zm68-20h16v16H80zm24 0h16v40h-16zm24 0h20v16h-20zM80 104h16v44H80zm48 24h20v20h-20z" fill="#001b2b"/><rect x="24" y="24" width="24" height="24" fill="white"/><rect x="112" y="24" width="24" height="24" fill="white"/><rect x="24" y="112" width="24" height="24" fill="white"/></svg>', { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' } });
  if (/^v1\/checkout\/[^/]+$/.test(pathname) && method === 'GET') return json({ id: ids.payment, amount: 79000, currency: 'VND', description: 'Đơn hàng NovaGate Portfolio', status: 'REQUIRES_PAYMENT_METHOD' });
  if (/^v1\/checkout\/[^/]+\/(?:pay|sandbox\/complete|sandbox\/action)$/.test(pathname) && method === 'POST') return json({ id: ids.payment, status: 'SUCCEEDED', amount: 79000, currency: 'VND' });

  if (method === 'POST' || method === 'PUT' || method === 'DELETE') return json({ success: true, demo: true, id: crypto.randomUUID(), secret: 'sk_test_portfolio_once', signingSecret: 'whsec_portfolio_once' });
  return null;
}
