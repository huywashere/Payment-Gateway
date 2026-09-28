import test from 'node:test';
import assert from 'node:assert/strict';
import { GatewayError, GatewayPublic, GatewayServer } from '../src/index.js';

test('sends authorization and idempotency headers', async () => {
  let captured;
  const client = new GatewayServer({
    apiKey: 'sk_test_example',
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return new Response(JSON.stringify({ id: 'pi_123' }), { status: 201, headers: { 'content-type': 'application/json' } });
    },
  });
  const result = await client.createPaymentIntent({ amount: 1000, currency: 'VND' }, { idempotencyKey: 'order-1' });
  assert.equal(result.id, 'pi_123');
  assert.equal(captured.init.headers.Authorization, 'Bearer sk_test_example');
  assert.equal(captured.init.headers['Idempotency-Key'], 'order-1');
});

test('supports payment links, acquirer and advanced webhook routes', async () => {
  const requests = [];
  const client = new GatewayServer({ apiKey: 'sk_test_example', fetchImpl: async (url, init) => {
    requests.push({ url, init });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }});
  await client.createPaymentLink({ amount: 1000, currency: 'VND' }, { idempotencyKey: 'plink-1' });
  await client.executeAcquirerOperation({ operationType: 'AUTHORIZE', amount: 1000, currency: 'VND' }, { idempotencyKey: 'acq-1' });
  await client.rotateWebhookSecret('endpoint-1');
  assert.equal(requests[0].init.headers['Idempotency-Key'], 'plink-1');
  assert.match(requests[1].url, /acquirer\/operations$/);
  assert.match(requests[2].url, /rotate-secret$/);
});

test('builds public payment link URLs without an API key', () => {
  const client = new GatewayPublic({ baseUrl: 'https://gateway.example' });
  assert.equal(client.paymentLinkEventsUrl('plink_123'), 'https://gateway.example/v1/payment_links/public/plink_123/events');
  assert.equal(client.paymentLinkQrUrl('plink_123', 420), 'https://gateway.example/v1/payment_links/public/plink_123/qr.svg?size=420');
});

test('maps API error envelopes to GatewayError', async () => {
  const client = new GatewayServer({
    apiKey: 'sk_test_example',
    fetchImpl: async () => new Response(JSON.stringify({ error: { code: 'state_invalid', message: 'Bad state' } }), {
      status: 409, headers: { 'content-type': 'application/json', 'x-request-id': 'req_123' },
    }),
  });
  await assert.rejects(() => client.getBalance(), (error) => {
    assert.ok(error instanceof GatewayError);
    assert.equal(error.status, 409);
    assert.equal(error.code, 'state_invalid');
    assert.equal(error.requestId, 'req_123');
    return true;
  });
});
