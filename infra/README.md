# Infrastructure

This directory contains the reproducible local and test infrastructure for the payment gateway.

## Development stack

Copy the example environment file, replace its placeholder secrets, and start the full stack:

```powershell
Copy-Item infra/environments/.env.dev.example infra/environments/.env.dev
docker compose --env-file infra/environments/.env.dev -f infra/compose/compose.dev.yml up -d --build
```

Services exposed to the host in development:

- Portal: `http://localhost:3000`
- Core API: `http://localhost:8080`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ management: `http://localhost:15672`

Application and data services are separated across `edge`, `app`, and `data` networks. All host ports bind to `127.0.0.1` by default; set `HOST_BIND_ADDRESS=0.0.0.0` only when another trusted device must reach the development stack. These host ports must not be copied to a production deployment.

## Ephemeral test dependencies

```powershell
docker compose -f infra/compose/compose.test.yml up -d
```

The test stack uses temporary storage and separate host ports, so it cannot overwrite development data.

## Observability stack

Copy the observability environment template and change the Grafana administrator password:

```powershell
Copy-Item infra/environments/.env.observability.example infra/environments/.env.observability

docker compose `
  --env-file infra/environments/.env.dev `
  --env-file infra/environments/.env.observability `
  -f infra/compose/compose.dev.yml `
  -f infra/compose/compose.observability.yml `
  up -d --build
```

Endpoints:

- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9091`
- Alertmanager: `http://localhost:9093`

Prometheus scrapes the backend management port at `backend:9090`; this port is deliberately not published to the host. Blackbox Exporter probes the portal and backend health endpoint. Grafana is provisioned with Prometheus and Loki datasources plus the **Payment Gateway Operations** dashboard.

Grafana Alloy reads container logs through the read-only Docker socket and forwards only Compose projects matching `payment-gateway.*` to Loki. Docker socket access is appropriate for this local single-host stack; production should run a node-level collector with the minimum platform-specific permissions.

Alertmanager stores, groups, inhibits, and displays alerts locally. Its default receiver intentionally sends no external notification. Configure email, PagerDuty, Slack, or a webhook through a secret-managed production configuration before relying on it for on-call notification.

Stop the full stack without deleting persistent data:

```powershell
docker compose `
  --env-file infra/environments/.env.dev `
  --env-file infra/environments/.env.observability `
  -f infra/compose/compose.dev.yml `
  -f infra/compose/compose.observability.yml `
  down
```

## Production configuration

Use the Spring profile `production`. Every database, broker, cache, origin, OIDC and portal secret in that profile is required and has no development fallback. The `.env.production.example` file is a schema only; real values belong in a managed secret store and must never be committed.

Production platform administration uses an OIDC JWT carrying `PLATFORM_ADMIN` or `PAYMENTS_PLATFORM_ADMIN`; `GATEWAY_PLATFORM_ADMIN_KEY` is sandbox/staging-only. Keep `GATEWAY_WEBHOOK_ALLOW_PRIVATE_ENDPOINTS=false` in production. Webhook delivery is enabled explicitly with `GATEWAY_WEBHOOK_DELIVERY_ENABLED=true`; route outbound traffic through controlled egress before accepting arbitrary merchant endpoints.

The production defaults deliberately select fail-closed live charge, payout and KMS placeholders. A deployment cannot be considered ready until contracted processor adapters and a real KMS/HSM-backed `PaymentMetadataVault` replace them.

Production enables Redis-backed request limits and fails closed by default. Tune the three per-minute limits from observed traffic, not by disabling the filter. `GATEWAY_WEBHOOK_REQUIRE_HTTPS=true` must remain enabled. The platform operations API should be reachable only from the operator network even though it also requires the administrator key.

The backend production management server listens on port `9090` and exposes only health, info, and Prometheus endpoints. Keep that port on a private monitoring network; never publish it directly to the internet.

## Local staging simulation

Use `infra/compose/compose.staging.yml` with `.env.staging.example` to exercise two backend instances behind Nginx, portal authentication, the bank sandbox processor and recovery scripts. This stack demonstrates stateless scaling but its single local PostgreSQL, Redis and RabbitMQ containers are not production HA. See `docs/staging-and-ha.md`.

Backups now include a SHA-256 sidecar which restore verifies before touching the database. After a restore, run `scripts/verify-ledger-invariants.ps1`; use `scripts/chaos-staging.ps1 -ConfirmChaos` to verify that either backend replica can be stopped without losing readiness.

`infra/k8s/base` provides the provider-neutral production baseline for the stateless services. It expects managed/external HA data services and a secret named `payment-gateway-runtime`; see `infra/k8s/README.md` before rendering it.
