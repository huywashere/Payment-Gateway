# PCI DSS v4.0.1 project gap assessment

This repository demonstrates payment architecture; it is not PCI DSS certified. The current sandbox accepts test PAN/CVC values, so it must never be exposed as a real card-data environment.

| Area | Project control | Remaining real-world gap |
| --- | --- | --- |
| Network boundary | Private Compose data network and limited host ports | Segmented CDE, firewall evidence, WAF and quarterly scope confirmation |
| Account data | No PAN/CVC database field, raw-card rejection in live mode, opaque processor tokens and encrypted non-card metadata | Processor-hosted fields, concrete HSM/KMS adapter, rotation ceremony and validated retention evidence |
| Access control | Signed portal session, OIDC Authorization Code + PKCE, MFA claim enforcement and RBAC | Production IdP configuration, phishing-resistant policy, joiner/mover/leaver process and access reviews |
| Secure development | CI, CodeQL, dependency review and image scan | Threat models, DAST, ASV scans, remediation SLA and independent penetration test |
| Logging | Correlation IDs, Loki, append-only database audit records and redacted webhook secrets | Central immutable/WORM retention, alert evidence, time synchronization and daily review |
| Payment page | Same-origin checkout project UI | Script inventory, authorization/integrity controls and tamper/change detection |
| Incident response | Operations runbook | Named responders, evidence handling, card-brand/acquirer notification and annual exercise |

For a real card integration, prefer processor-hosted fields so PAN and CVC never enter this application. If the application handles account data, engage a QSA before architecture freeze and determine the required ROC/SAQ scope with the acquiring bank.
