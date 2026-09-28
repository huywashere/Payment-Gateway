# Four-bank sandbox routing

This project supports four simulated bank profiles: `ACB`, `BIDV`, `VIETINBANK` and `NCB`. They exercise routing, OAuth-style token caching, signed callbacks, reversals and reconciliation locally. They do not send money and are not a claim of bank certification or production connectivity.

## Run and select a bank

Set `GATEWAY_PROCESSOR_MODE=bank-sandbox`. Checkout requests accept `bankCode`:

```json
{
  "paymentMethodType": "VIETQR",
  "bankCode": "BIDV",
  "scenario": "success"
}
```

The processor emits references such as `bidv_txn_...` and processor codes such as `BIDV_SANDBOX_VIETQR`. `GET /v1/sandbox/bank/providers` returns the enabled profiles and capabilities.

Callbacks may use the generic endpoint or the bank-specific endpoint:

```text
POST /v1/sandbox/bank/BIDV/callbacks
X-Bank-Signature: t=<unix-seconds>,v1=<hmac-sha256>
```

The signature is computed over `<timestamp>.<raw-json-body>`. The service rejects a callback when its path bank, transaction prefix and stored charge processor disagree. Reversals infer the route from the original transaction reference and remain deterministic for an operation ID.

## Credentials

Generic `BANK_SANDBOX_*` values are development fallbacks. Per-bank `ACB_SANDBOX_*`, `BIDV_SANDBOX_*`, `VIETINBANK_SANDBOX_*` and `NCB_SANDBOX_*` values override them. Never use the sample values for a shared or live environment.

## External UAT boundary

The four profiles intentionally remain local simulations until each bank supplies approved sandbox credentials, certificates and the exact OpenAPI contract. Current public onboarding references are:

- BIDV Open API: https://openapi.bidv.com.vn/devportal/vi/product/6937
- VietinBank Open API: https://openapi.vietinbank.vn/
- NCB developer onboarding: https://develop.ncb-bank.vn/vi/bat-dau
- ACB developer sandbox: https://developer.acb.com.vn/acb/open/en/getting-started

Production activation must use a separate live adapter and environment. It must not be enabled by changing a sandbox URL or reusing these simulated credentials.
