# Project KYB and AML simulation

This workflow is synthetic and exists to demonstrate product and operations design. It does not perform legal identity verification or sanctions screening.

## Merchant onboarding states

`DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED | REJECTED -> SUSPENDED`

The project evidence packet contains a generated business registration number, legal name, registered address, representative, beneficial-owner declaration, expected monthly volume, business category and settlement account fingerprint. Never place real identity documents in the repository.

## Review rules

- Reject incomplete identity and beneficial-owner data.
- Route high-risk business categories and unusual expected volume to manual review.
- Record reviewer, reason codes, timestamps and evidence hashes in the audit trail.
- Require OWNER plus FINANCE approval before enabling payouts.
- Re-review when ownership, bank destination or expected volume changes.

## Transaction-monitoring scenarios

- Sudden velocity or daily-volume increase.
- Repeated cards or customer identities across unrelated merchants.
- Refund or dispute ratio above the project threshold.
- Rapid payout immediately after first settlement.
- Structuring into repeated amounts below a configured threshold.

The risk engine may label these events `ALLOW`, `REVIEW` or `BLOCK`. A project case record should contain rule IDs and synthetic evidence only. No generated result should be represented as an actual KYC, AML, sanctions or PEP decision.
