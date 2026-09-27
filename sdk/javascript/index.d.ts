export type SandboxScenario = 'success' | 'declined' | 'insufficient_funds' | 'requires_action' | 'timeout';
export type PaymentMethodType = 'CARD' | 'VIETQR';

export interface ClientOptions {
  baseUrl?: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
  timeout?: number;
}

export class GatewayError extends Error {
  status: number;
  code?: string;
  requestId?: string;
}

export class GatewayServer {
  constructor(options: ClientOptions);
  createPaymentIntent(params: { amount: number; currency: string; description?: string; metadata?: Record<string, unknown> }, options?: { idempotencyKey?: string }): Promise<Record<string, unknown>>;
  confirmPaymentIntent(id: string, params: { paymentMethodId?: string; paymentMethodType?: PaymentMethodType; scenario?: SandboxScenario }, options?: { idempotencyKey?: string }): Promise<Record<string, unknown>>;
  createRefund(chargeId: string, params?: { amount?: number; reason?: string }, options?: { idempotencyKey?: string }): Promise<Record<string, unknown>>;
  getBalance(): Promise<Record<string, unknown>>;
  createSettlement(params?: { cutoff?: string; currency?: string }, options?: { idempotencyKey?: string }): Promise<Record<string, unknown>>;
  listSettlements(): Promise<Record<string, unknown>[]>;
  createPayout(params: { amount: number; currency?: string; destinationReference: string; description?: string }, options?: { idempotencyKey?: string }): Promise<Record<string, unknown>>;
  listPayouts(): Promise<Record<string, unknown>[]>;
  getRiskProfile(): Promise<Record<string, unknown>>;
  updateRiskProfile(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  listDisputes(): Promise<Record<string, unknown>[]>;
  submitDisputeEvidence(id: string, evidence: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export class GatewaySandbox {
  constructor(options: ClientOptions);
  createPaymentMethod(params?: { type?: PaymentMethodType; scenario?: SandboxScenario; holderName?: string }): Promise<Record<string, unknown>>;
}
