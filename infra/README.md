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

## Production configuration

Use the Spring profile `production`. Every database, broker, cache, vault, origin, and portal secret in that profile is required and has no development fallback. The `.env.production.example` file is a schema only; real values belong in a managed secret store and must never be committed.
