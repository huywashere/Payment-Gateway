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
  createPaymentLink(params: Record<string, unknown>, options?: { idempotencyKey?: string }): Promise<Record<string, unknown>>;
  listPaymentLinks(): Promise<Record<string, unknown>[]>;
  getPaymentLink(id: string): Promise<Record<string, unknown>>;
  listBankAccounts(): Promise<Record<string, unknown>[]>;
  createBankAccount(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  setDefaultBankAccount(id: string): Promise<Record<string, unknown>>;
  disableBankAccount(id: string): Promise<Record<string, unknown>>;
  syncBankAccount(id: string): Promise<Record<string, unknown>>;
  listBankTransactions(options?: { limit?: number }): Promise<Record<string, unknown>[]>;
  getBankTransaction(id: string): Promise<Record<string, unknown>>;
  listOrganizationMembers(): Promise<Record<string, unknown>[]>;
  inviteOrganizationMember(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateOrganizationMember(id: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
  getSubscription(): Promise<Record<string, unknown>>;
  listPlans(): Promise<Record<string, unknown>[]>;
  changePlan(plan: string): Promise<Record<string, unknown>>;
  executeAcquirerOperation(params: Record<string, unknown>, options?: { idempotencyKey?: string }): Promise<Record<string, unknown>>;
  listAcquirerOperations(paymentIntentId: string): Promise<Record<string, unknown>[]>;
  completeThreeDs(id: string, successful?: boolean): Promise<Record<string, unknown>>;
  getHostedFieldsConfig(): Promise<Record<string, unknown>>;
  createWebhookEndpoint(params: Record<string, unknown>): Promise<Record<string, unknown>>;
  listWebhookEndpoints(): Promise<Record<string, unknown>[]>;
  testWebhookEndpoint(id: string): Promise<Record<string, unknown>>;
  testWebhookAlert(id: string): Promise<Record<string, unknown>>;
  rotateWebhookSecret(id: string): Promise<Record<string, unknown>>;
  listWebhookDeliveries(options?: { limit?: number }): Promise<Record<string, unknown>[]>;
  replayWebhookDelivery(id: string): Promise<Record<string, unknown>>;
  listWebhookAlerts(): Promise<Record<string, unknown>[]>;
  getDashboardOverview(options?: { days?: 7 | 30 | 90 }): Promise<Record<string, unknown>>;
  listNotifications(options?: { limit?: number }): Promise<Record<string, unknown>>;
  markNotificationRead(id: string): Promise<Record<string, unknown>>;
  markAllNotificationsRead(): Promise<Record<string, unknown>>;
  listBillingInvoices(): Promise<Record<string, unknown>[]>;
  listSubscriptionEvents(): Promise<Record<string, unknown>[]>;
  listAuditLogs(options?: { limit?: number; query?: string }): Promise<Record<string, unknown>[]>;
}

export class GatewaySandbox {
  constructor(options: ClientOptions);
  createPaymentMethod(params?: { type?: PaymentMethodType; scenario?: SandboxScenario; holderName?: string }): Promise<Record<string, unknown>>;
}

export class GatewayPublic {
  constructor(options?: Omit<ClientOptions, 'apiKey'>);
  getPaymentLink(slug: string): Promise<Record<string, unknown>>;
  paymentLinkEventsUrl(slug: string): string;
  paymentLinkQrUrl(slug: string, size?: number): string;
}
