# Payment Gateway Sandbox SDK

SDK bao phủ Payment Intents, Payment Links/VietQR, bank accounts và transaction read model,
organization/subscription, acquirer lifecycle và webhook nâng cao. Bank transaction inbox là API
dành cho connector ngân hàng; merchant SDK không tự tạo chữ ký callback ngân hàng.

Server-side usage with a secret key:

```js
import { GatewayServer } from '@gateway/sandbox-sdk';

const gateway = new GatewayServer({ apiKey: process.env.GATEWAY_SECRET_KEY });
const intent = await gateway.createPaymentIntent(
  { amount: 150000, currency: 'VND', description: 'ORDER-1001' },
  { idempotencyKey: 'ORDER-1001' },
);

// Move captured funds from pending to available, then create a sandbox payout.
await gateway.createSettlement({}, { idempotencyKey: 'settlement-2026-09-27' });
await gateway.createPayout(
  { amount: 100000, destinationReference: 'sandbox-bank-account-9704' },
  { idempotencyKey: 'payout-1001' },
);

const link = await gateway.createPaymentLink(
  { amount: 250000, currency: 'VND', description: 'ORDER-1002' },
  { idempotencyKey: 'ORDER-1002' },
);
```

Public Payment Link không cần API key:

```js
import { GatewayPublic } from '@gateway/sandbox-sdk';

const publicGateway = new GatewayPublic({ baseUrl: 'http://localhost:8080' });
const status = await publicGateway.getPaymentLink(link.slug);
const eventsUrl = publicGateway.paymentLinkEventsUrl(link.slug);
```

Browser-side sandbox tokenization uses `GatewaySandbox` with a test publishable key. Never expose a secret key in browser code. This package only creates sandbox tokens and does not accept real cardholder data.
