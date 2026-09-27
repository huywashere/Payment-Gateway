param(
    [Parameter(Mandatory = $true)][string]$BackupFile,
    [string]$EnvFile = "infra/environments/.env.staging",
    [switch]$ConfirmRestore
)

$ErrorActionPreference = "Stop"
if (-not $ConfirmRestore) { throw "Restore replaces staging data. Re-run with -ConfirmRestore." }

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$composeFile = Join-Path $repoRoot "infra/compose/compose.staging.yml"
$resolvedEnv = (Resolve-Path (Join-Path $repoRoot $EnvFile)).Path
$resolvedBackup = (Resolve-Path $BackupFile).Path
if ([IO.Path]::GetExtension($resolvedBackup) -ne ".dump") { throw "Expected a .dump backup file." }

$checksumFile = "$resolvedBackup.sha256"
if (-not (Test-Path -LiteralPath $checksumFile)) { throw "Backup checksum file is missing: $checksumFile" }
$expectedChecksum = ((Get-Content -LiteralPath $checksumFile -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
$actualChecksum = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolvedBackup).Hash.ToLowerInvariant()
if ($expectedChecksum -ne $actualChecksum) { throw "Backup checksum verification failed." }

$container = docker compose --env-file $resolvedEnv -f $composeFile ps -q postgres
if (-not $container) { throw "The staging PostgreSQL container is not running." }

$containerFile = "/tmp/payment-gateway-restore.dump"
docker cp $resolvedBackup "${container}:$containerFile"
docker compose --env-file $resolvedEnv -f $composeFile exec -T postgres sh -c "pg_restore -U `$POSTGRES_USER -d `$POSTGRES_DB --clean --if-exists --no-owner $containerFile"
if ($LASTEXITCODE -ne 0) { throw "pg_restore failed." }
docker compose --env-file $resolvedEnv -f $composeFile exec -T postgres rm -f $containerFile
Write-Output "Staging restore completed. Run the smoke suites before continuing."
