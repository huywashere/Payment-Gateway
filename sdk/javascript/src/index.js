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
}

export class GatewaySandbox extends BaseClient {
  createPaymentMethod({ type = 'CARD', scenario = 'success', holderName } = {}) {
    return this.request('/v1/payment_methods', {
      method: 'POST', body: { type, scenario, holderName },
    });
  }
}

export { GatewayError };
