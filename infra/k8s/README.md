# Kubernetes production baseline

`base/` is a provider-neutral deployment baseline for the stateless backend and
portal. It deliberately does not deploy PostgreSQL, Redis, RabbitMQ, KMS, WAF or
certificates; production should use HA managed/external services for those.

Before applying it:

1. Replace both image references with immutable digests produced by CI.
2. Replace the example hostnames and configure an ingress/WAF and certificate manager.
3. Create `payment-gateway-runtime` from a secret manager/External Secrets operator.
4. Restrict NetworkPolicy egress to the actual database, cache, broker, OIDC and bank CIDRs.
5. Set topology labels and confirm replicas span failure domains.
6. Run `scripts/production-readiness.ps1` and attach all independent evidence.

Render without changing a cluster:

```bash
kubectl kustomize infra/k8s/base
```

The manifests include non-root/read-only containers, resource limits, startup,
readiness and liveness probes, disruption budgets, horizontal scaling, TLS-only
ingress and default-deny network policy. They are a baseline, not proof that a
specific cluster is compliant or highly available.
