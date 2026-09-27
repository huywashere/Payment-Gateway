# Production hardening boundary

The repository now separates controls that can be implemented and tested in a
project from controls that require a bank, cloud KMS, licensed operator or
independent assessor. It intentionally fails closed instead of pretending those
external controls exist.

## Implemented in code

- Production startup rejects sandbox mode, non-TLS dependencies, HTTP origins,
  disabled webhook/rate-limit controls, active demo data and unattested external controls.
- `LiveProcessorPlaceholder`, `LivePayoutProcessorPlaceholder` and
  `KmsVaultServicePlaceholder` prevent a live deployment until concrete adapters replace them.
- Portal live mode uses OIDC Authorization Code with PKCE, signed JWKS validation,
  state, nonce, role claims and an MFA `amr` requirement. Demo passwords are sandbox-only.
- Platform administration uses OIDC JWT roles in production; the static admin key
  remains only for local/staging exercises.
- PAN/CVC has no database field. Live requests reject raw card payloads and accept
  only opaque processor payment-method tokens.
- Customer contact data is encrypted behind `PaymentMetadataVault`; erasure removes
  PII while retaining financial records and audit evidence.
- PostgreSQL stores durable idempotency responses and a processor callback inbox.
  Redis is an acceleration/locking layer, not the sole replay record.
- Processor charge, refund/reversal and payout calls receive deterministic operation
  identifiers. Database rollback followed by retry therefore reuses the same external operation.
- Ledger checks enforce positive amounts, different debit/credit accounts, currency
  format, unique logical postings and append-only history. Financial rows cannot be deleted.
- Signed bank callbacks validate exact raw bytes, reject payload changes for a reused
  event ID, lock the matching charge and update intent, charge, ledger and outbox atomically.
- Webhook signatures are redacted at rest and response bodies are disabled by default.
- Security headers, correlation IDs, business metrics, alerts, checksum-verified backups,
  ledger verification and replica-failure drills are included.
- Kubernetes manifests provide a non-root, read-only, multi-replica baseline with
  probes, PDBs, HPA, TLS ingress and default-deny network policy.

## Mandatory external implementations

The following are hard blockers, not TODOs that can honestly be completed inside
this repository:

1. Replace both live processor placeholders with adapters certified in bank/acquirer UAT.
2. Replace the KMS placeholder with the chosen provider's envelope-encryption/HSM adapter.
3. Supply production OIDC, WAF/DDoS, managed HA database/cache/broker and immutable log storage.
4. Remove/suspend demo merchant data and inject secrets through a secret manager.
5. Obtain legal/contract approval, PCI scope approval, an independent penetration test
   and a documented disaster-recovery drill.

`scripts/production-readiness.ps1` validates configuration and requires evidence
files under `evidence/production`. The production profile also repeats the critical
checks at application startup. Passing either mechanism is not a legal or PCI
certification; both are safeguards against accidental launch with project defaults.

## Verification sequence

1. Run Maven `verify` against the disposable PostgreSQL/Redis/RabbitMQ test stack.
2. Run frontend lint and production build.
3. Start staging, run stage 6-10 smoke suites, RBAC E2E and concurrency tests.
4. Run `verify-ledger-invariants.ps1`, backup/restore, then `chaos-staging.ps1`.
5. Run k6 load/soak tests and review Prometheus alerts.
6. Run the readiness script using a secret-injected production environment file.
7. Conduct the external reviews and attach their real evidence; never fabricate approvals.
