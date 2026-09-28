const DEFAULT_TIMEOUT = 10_000;

class GatewayError extends Error {
  constructor(message, status, code, requestId) {
    super(message);
    this.name = 'GatewayError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

class BaseClient {
  constructor({ baseUrl = 'http://localhost:8080', apiKey, fetchImpl = globalThis.fetch, timeout = DEFAULT_TIMEOUT }) {
    if (!apiKey) throw new TypeError('apiKey is required');
    if (typeof fetchImpl !== 'function') throw new TypeError('A Fetch API implementation is required');
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl;
    this.timeout = timeout;
  }

  async request(path, { method = 'GET', body, idempotencyKey } = {}) {
    const headers = { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new GatewayError(
        payload?.error?.message || `Gateway request failed with HTTP ${response.status}`,
        response.status,
        payload?.error?.code,
        response.headers.get('x-request-id'),
      );
    }
    return payload;
  }
}

export class GatewayServer extends BaseClient {
  createPaymentIntent(params, { idempotencyKey = crypto.randomUUID() } = {}) {
    return this.request('/v1/payment_intents', { method: 'POST', body: params, idempotencyKey });
  }

  confirmPaymentIntent(id, params, { idempotencyKey = crypto.randomUUID() } = {}) {
    return this.request(`/v1/payment_intents/${encodeURIComponent(id)}/confirm`, {
      method: 'POST', body: params, idempotencyKey,
    });
  }

  createRefund(chargeId, params = {}, { idempotencyKey = crypto.randomUUID() } = {}) {
    return this.request(`/v1/charges/${encodeURIComponent(chargeId)}/refunds`, {
      method: 'POST', body: params, idempotencyKey,
    });
  }

  getBalance() {
    return this.request('/v1/balance');
  }

  createSettlement(params = {}, { idempotencyKey = crypto.randomUUID() } = {}) {
    return this.request('/v1/settlements', { method: 'POST', body: params, idempotencyKey });
  }

  listSettlements() {
    return this.request('/v1/settlements');
  }

  createPayout(params, { idempotencyKey = crypto.randomUUID() } = {}) {
    return this.request('/v1/payouts', { method: 'POST', body: params, idempotencyKey });
  }

  listPayouts() {
    return this.request('/v1/payouts');
  }

  getRiskProfile() {
    return this.request('/v1/risk/profile');
  }

  updateRiskProfile(params) {
    return this.request('/v1/risk/profile', { method: 'PUT', body: params });
  }

  listDisputes() {
    return this.request('/v1/disputes');
  }

  submitDisputeEvidence(id, evidence) {
    return this.request(`/v1/disputes/${encodeURIComponent(id)}/evidence`, {
      method: 'POST', body: { evidence },
    });
  }

  createPaymentLink(params, { idempotencyKey = crypto.randomUUID() } = {}) { return this.request('/v1/payment_links', { method: 'POST', body: params, idempotencyKey }); }
  listPaymentLinks() { return this.request('/v1/payment_links'); }
  getPaymentLink(id) { return this.request(`/v1/payment_links/${encodeURIComponent(id)}`); }
  listBankAccounts() { return this.request('/v1/bank_accounts'); }
  createBankAccount(params) { return this.request('/v1/bank_accounts', { method: 'POST', body: params }); }
  setDefaultBankAccount(id) { return this.request(`/v1/bank_accounts/${encodeURIComponent(id)}/default`, { method: 'POST' }); }
  disableBankAccount(id) { return this.request(`/v1/bank_accounts/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
  listBankTransactions({ limit = 50 } = {}) { return this.request(`/v1/bank_transactions?limit=${limit}`); }
  getBankTransaction(id) { return this.request(`/v1/bank_transactions/${encodeURIComponent(id)}`); }
  listOrganizationMembers() { return this.request('/v1/organization/members'); }
  inviteOrganizationMember(params) { return this.request('/v1/organization/members', { method: 'POST', body: params }); }
  updateOrganizationMember(id, params) { return this.request(`/v1/organization/members/${encodeURIComponent(id)}`, { method: 'PUT', body: params }); }
  getSubscription() { return this.request('/v1/organization/subscription'); }
  listPlans() { return this.request('/v1/organization/plans'); }
  changePlan(plan) { return this.request('/v1/organization/subscription', { method: 'PUT', body: { plan } }); }
  executeAcquirerOperation(params, { idempotencyKey = crypto.randomUUID() } = {}) { return this.request('/v1/acquirer/operations', { method: 'POST', body: params, idempotencyKey }); }
  listAcquirerOperations(paymentIntentId) { return this.request(`/v1/acquirer/operations?paymentIntentId=${encodeURIComponent(paymentIntentId)}`); }
  completeThreeDs(id, successful = true) { return this.request(`/v1/acquirer/operations/${encodeURIComponent(id)}/3ds`, { method: 'POST', body: { successful } }); }
  getHostedFieldsConfig() { return this.request('/v1/acquirer/hosted-fields/config'); }
  createWebhookEndpoint(params) { return this.request('/v1/webhooks/endpoints', { method: 'POST', body: params }); }
  listWebhookEndpoints() { return this.request('/v1/webhooks/endpoints'); }
  testWebhookEndpoint(id) { return this.request(`/v1/webhooks/endpoints/${encodeURIComponent(id)}/test`, { method: 'POST' }); }
  testWebhookAlert(id) { return this.request(`/v1/webhooks/endpoints/${encodeURIComponent(id)}/test-alert`, { method: 'POST' }); }
  rotateWebhookSecret(id) { return this.request(`/v1/webhooks/endpoints/${encodeURIComponent(id)}/rotate-secret`, { method: 'POST' }); }
  listWebhookDeliveries({ limit = 25 } = {}) { return this.request(`/v1/webhooks/deliveries?limit=${limit}`); }
  replayWebhookDelivery(id) { return this.request(`/v1/webhooks/deliveries/${encodeURIComponent(id)}/replay`, { method: 'POST' }); }
  listWebhookAlerts() { return this.request('/v1/webhooks/alerts'); }
}

export class GatewaySandbox extends BaseClient {
  createPaymentMethod({ type = 'CARD', scenario = 'success', holderName } = {}) {
    return this.request('/v1/payment_methods', {
      method: 'POST', body: { type, scenario, holderName },
    });
  }
}

export class GatewayPublic {
  constructor({ baseUrl = 'http://localhost:8080', fetchImpl = globalThis.fetch, timeout = DEFAULT_TIMEOUT } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); this.fetchImpl = fetchImpl; this.timeout = timeout;
  }
  async getPaymentLink(slug) {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/payment_links/public/${encodeURIComponent(slug)}`, { signal: AbortSignal.timeout(this.timeout) });
    if (!response.ok) throw new GatewayError(`Gateway request failed with HTTP ${response.status}`, response.status);
    return response.json();
  }
  paymentLinkEventsUrl(slug) { return `${this.baseUrl}/v1/payment_links/public/${encodeURIComponent(slug)}/events`; }
  paymentLinkQrUrl(slug, size = 360) { return `${this.baseUrl}/v1/payment_links/public/${encodeURIComponent(slug)}/qr.svg?size=${size}`; }
}

export { GatewayError };
