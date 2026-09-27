# Stages 11-15: project production simulation

## Stage 11 - Environment boundary and portal access

- `GATEWAY_MODE` separates sandbox and live credentials.
- Backend API-key authentication rejects TEST keys in live mode and LIVE keys in sandbox mode.
- Sandbox payment-method and checkout completion paths are disabled outside sandbox.
- The portal uses an HMAC-signed, HttpOnly, SameSite session with an eight-hour lifetime.
- Sandbox login uses the project MFA code. Live mode requires OIDC Authorization Code + PKCE and an MFA claim.
- OWNER, DEVELOPER, FINANCE and AUDITOR permissions are enforced again inside the BFF.

Local demo credentials are `owner@apipay.local`, `developer@apipay.local`, `finance@apipay.local` and `auditor@apipay.local`, with the password and MFA code from the environment example. Production mode has no credential fallback.

## Stage 12 - Bank sandbox SPI

Select `GATEWAY_PROCESSOR_MODE=bank-sandbox` to use a processor that obtains a short-lived OAuth-style token, emits bank-style transaction references and supports idempotent reversals. Signed callbacks use the same timestamped HMAC envelope as merchant webhooks, persist an inbox record and atomically update charge, intent, ledger and outbox. `live` selects fail-closed charge and payout placeholders until contracted adapters exist.

## Stage 13 - Staging and recovery

`infra/compose/compose.staging.yml` runs two backend instances behind Nginx. The data tier remains private. Backup and guarded restore scripts support a local recovery drill. See `docs/staging-and-ha.md` for the real HA target and limitations.

## Stage 14 - Verification

- Unit tests cover bank OAuth caching, transaction references, concurrent reversal idempotency, fee calculation and ledger postings.
- `scripts/e2e-portal-rbac.ps1` verifies authentication, authorization and logout.
- `scripts/concurrency-payout-test.ps1` proves competing payouts cannot overdraw the same balance.
- `scripts/load-test.js` defines local k6 latency and error-rate thresholds.
- `docs/pci-gap-assessment.md` records the controls that remain outside project scope.

## Stage 15 - Operational simulation

Synthetic KYB/AML rules and the limited-pilot/go-live evidence checklist are documented separately. They deliberately make no compliance or certification claim.

Further production hardening and the deliberately unresolved external gates are documented in `docs/production-hardening.md`.
