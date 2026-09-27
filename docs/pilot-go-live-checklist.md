# Project pilot and go-live review

This checklist simulates the gates a real payment platform would use. For the portfolio project, a checked item means the control was demonstrated locally or documented, not legally certified.

## Release gate

- [ ] CI is green for the exact commit and images are addressed by immutable SHA.
- [ ] Sandbox and live modes reject credentials from the other environment.
- [ ] Mock and bank-sandbox endpoints are unavailable in live mode.
- [ ] Portal OWNER, DEVELOPER, FINANCE and AUDITOR permissions pass the RBAC E2E script.
- [ ] Ledger, idempotency, settlement, payout, dispute and reconciliation smoke suites pass.
- [ ] Concurrent payout test allows one debit and rejects the competing debit.
- [ ] Load thresholds pass and no database pool, queue or JVM alerts fire.
- [ ] Backup was restored into a clean staging stack and balances reconciled.
- [ ] No critical vulnerability, committed secret or unresolved high-risk finding remains.
- [ ] `scripts/production-readiness.ps1` returns `ready: true` using secret-injected configuration.
- [ ] Live charge, reversal/refund and payout adapters passed counterparty UAT with deterministic operation IDs.
- [ ] KMS/HSM adapter rotation and decrypt-old/encrypt-new procedure passed in staging.
- [ ] OIDC MFA and emergency access were tested without enabling sandbox credentials.
- [ ] Independent approval artifacts exist under `evidence/production`; project-authored placeholders do not count.

## Simulated pilot

1. Use one synthetic merchant and a daily transaction cap.
2. Enable only `CARD` and `VIETQR` sandbox scenarios.
3. Reconcile every processor record and review every mismatch.
4. Keep payout manual and require OWNER plus FINANCE review.
5. Exercise processor timeout, duplicate callback, reversal, dispute and restore scenarios.
6. Stop the pilot if the ledger differs from processor totals or webhook/outbox failures accumulate.

## Exit report

Record commit SHA, configuration mode, test evidence, transaction counts, reconciliation result, incidents, restore duration and open risks. A real launch additionally requires contracts, licensing analysis, privacy review, PCI scope confirmation and named 24/7 operational ownership.
