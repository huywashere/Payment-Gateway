# Payment Gateway Operations Runbook

## First response

1. Open Grafana at `http://localhost:3001` and select **Payment Gateway Operations**.
2. Check firing alerts in Alertmanager at `http://localhost:9093`.
3. Correlate the failure window with Loki logs. Search by `compose_service` and then by the `request_id` returned in the API `X-Request-ID` response header.
4. Check current container health:

```powershell
docker compose `
  --env-file infra/environments/.env.dev `
  --env-file infra/environments/.env.observability `
  -f infra/compose/compose.dev.yml `
  -f infra/compose/compose.observability.yml `
  ps
```

Do not restart databases or delete volumes before collecting logs and confirming the affected project name.

## Alert actions

### PaymentGatewayBackendDown

- Confirm the backend container state and inspect its last 200 log lines.
- Check PostgreSQL, Redis, and RabbitMQ health before restarting the backend.
- Verify Flyway migration errors and required environment variables.
- If dependencies are healthy, restart only the backend service and confirm the readiness probe recovers.

### PaymentGatewayPortalDown

- Confirm the frontend container is healthy and that the backend is reachable.
- Check for missing `GATEWAY_CORE_URL`, `GATEWAY_DEMO_SECRET_KEY`, or `DATABASE_URL`.
- Inspect Next.js server logs and test `/api/prisma/overview`.

### PaymentGatewayHighErrorRate

- Use the dashboard to identify the start of the 5xx increase.
- Filter backend logs by the same time window and group failures by request ID.
- Check database pool saturation, Redis timeouts, and RabbitMQ connection failures.
- Do not retry payment mutation requests without their original `Idempotency-Key`.

### PaymentGatewayHighP95Latency

- Compare HTTP latency with Hikari active, idle, and pending connections.
- Check slow database queries and dependency latency.
- Review recent deployments before increasing connection pool or instance size.

### PaymentGatewayDatabasePoolSaturated

- Check PostgreSQL connection count and long-running transactions.
- Find and fix leaked or slow transactions before increasing the pool.
- Scale the pool only within the database connection budget.

### PaymentGatewayHighJvmHeap

- Confirm whether usage falls after garbage collection.
- Capture a heap dump only in an access-controlled environment with enough disk capacity.
- Check traffic changes and recent deployments before increasing the memory limit.

## Verification after recovery

- All Compose services report `healthy`.
- Prometheus target `backend` is up.
- Frontend and backend blackbox probes equal `1`.
- No critical alert remains firing.
- A sandbox payment can be created with an idempotency key and its ledger entries remain balanced.

## Production notes

- Route Alertmanager to a real on-call receiver using secret-managed credentials.
- Keep Grafana, Prometheus, Loki, Alertmanager, Alloy, and backend port `9090` on private networks.
- Back up Grafana configuration, Prometheus rules, and application databases; metrics and logs should follow the retention and compliance policy for the deployment.
- Restrict Docker socket access. In Kubernetes, use the platform-native Alloy deployment instead of mounting a host Docker socket.
