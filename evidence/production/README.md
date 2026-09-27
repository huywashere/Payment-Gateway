# Production evidence gate

This directory intentionally contains no approval placeholders. Production is
blocked until independent or counterparty evidence is copied here using the
exact filenames checked by `scripts/production-readiness.ps1`:

- `bank-uat-approval.md`
- `legal-and-contract-approval.md`
- `pci-scope-approval.md`
- `independent-pentest.md`
- `disaster-recovery-drill.md`

Each file must identify the reviewer, scope, date, result, unresolved findings
and a link or checksum for the original signed artifact. Do not mark a project
document as an external approval.
