# Staging and high-availability model

The project staging stack runs two stateless backend instances behind Nginx while PostgreSQL, Redis and RabbitMQ retain persistent data. It is a local architecture demonstration, not a claim of production high availability.

## Start staging

```powershell
Copy-Item infra/environments/.env.staging.example infra/environments/.env.staging
docker compose --env-file infra/environments/.env.staging -f infra/compose/compose.staging.yml up -d --build
```

- Portal: `http://localhost:3008`
- Load-balanced API: `http://localhost:8088`
- The database, cache, broker and management endpoints are not published to the host.

## Backup and restore drill

```powershell
./scripts/backup-staging.ps1
./scripts/restore-staging.ps1 -BackupFile ./backups/payment-gateway-staging-YYYYMMDD-HHMMSS.dump -ConfirmRestore
```

Run both smoke suites after every restore. Backups under `backups/` are ignored by Git and should be encrypted when copied elsewhere.

## Real deployment target

For a real environment replace the single local data services with managed multi-zone PostgreSQL plus PITR, Redis replication/failover and a quorum RabbitMQ cluster. Put the edge behind TLS, WAF and DDoS protection; store credentials in KMS-backed secret management; keep management ports private. Define and rehearse an RPO of 15 minutes and an RTO of 60 minutes before a pilot.

Use rolling or blue/green application deployment. Flyway migrations must be backward compatible for at least one application version, and rollback must deploy the prior image rather than reverse an already-applied financial migration.
