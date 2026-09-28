import http from 'k6/http';
import crypto from 'k6/crypto';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    payment_link_reads: { executor: 'constant-vus', exec: 'paymentLinkReads', vus: 20, duration: '30s' },
    bank_inbox_writes: { executor: 'constant-arrival-rate', exec: 'bankInboxWrites', rate: 5, timeUnit: '1s', duration: '30s', preAllocatedVUs: 5, maxVUs: 20 },
  },
  thresholds: { 'http_req_failed{operation:payment_link}': ['rate<0.01'], 'http_req_duration{operation:payment_link}': ['p(95)<400'], 'http_req_duration{operation:bank_inbox}': ['p(95)<800'] },
};
const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:8080';
const slug = __ENV.PAYMENT_LINK_SLUG;
const accountId = __ENV.BANK_ACCOUNT_ID;
const paymentCode = __ENV.PAYMENT_CODE || 'LOADTEST';
const callbackSecret = __ENV.BANK_CALLBACK_SECRET || 'project-callback-secret';
const bankCode = __ENV.BANK_CODE || 'ACB';

export function paymentLinkReads() {
  if (!slug) return;
  const response = http.get(`${baseUrl}/v1/payment_links/public/${encodeURIComponent(slug)}`, { tags: { operation: 'payment_link' } });
  check(response, { 'payment link 200': (result) => result.status === 200 }); sleep(0.15);
}
export function bankInboxWrites() {
  if (!accountId) return;
  const reference = `LOAD-${__VU}-${__ITER}-${Date.now()}`;
  const payload = JSON.stringify({ bankAccountId: accountId, externalReference: reference, direction: 'IN', amount: 999999999, currency: 'VND', description: paymentCode, counterpartyAccount: 'LOADTEST', occurredAt: new Date().toISOString() });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.hmac('sha256', callbackSecret, `${timestamp}.${payload}`, 'hex');
  const response = http.post(`${baseUrl}/v1/bank_transactions/inbox/${bankCode}`, payload, { headers: { 'Content-Type': 'application/json', 'X-Bank-Signature': `t=${timestamp},v1=${signature}` }, tags: { operation: 'bank_inbox' } });
  check(response, { 'bank inbox accepted': (result) => result.status === 200 });
}
