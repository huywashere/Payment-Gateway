param(
    [string]$EnvFile = "infra/environments/.env.staging",
    [string]$OutputDirectory = "backups"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$composeFile = Join-Path $repoRoot "infra/compose/compose.staging.yml"
$resolvedEnv = (Resolve-Path (Join-Path $repoRoot $EnvFile)).Path
$targetDirectory = Join-Path $repoRoot $OutputDirectory
New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null

$container = docker compose --env-file $resolvedEnv -f $composeFile ps -q postgres
if (-not $container) { throw "The staging PostgreSQL container is not running." }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$filename = "payment-gateway-staging-$stamp.dump"
$containerFile = "/tmp/$filename"
docker compose --env-file $resolvedEnv -f $composeFile exec -T postgres sh -c "pg_dump -U `$POSTGRES_USER -d `$POSTGRES_DB -F c -f $containerFile"
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }
docker cp "${container}:$containerFile" (Join-Path $targetDirectory $filename)
docker compose --env-file $resolvedEnv -f $composeFile exec -T postgres rm -f $containerFile
$backupPath = Join-Path $targetDirectory $filename
$checksum = (Get-FileHash -Algorithm SHA256 -LiteralPath $backupPath).Hash.ToLowerInvariant()
Set-Content -LiteralPath "$backupPath.sha256" -Value "$checksum  $filename" -Encoding ascii -NoNewline
Write-Output $backupPath
