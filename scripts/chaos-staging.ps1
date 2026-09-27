param(
    [string]$EnvFile = "infra/environments/.env.staging.example",
    [string]$ReadinessUrl = "http://127.0.0.1:8088/actuator/health/readiness",
    [switch]$ConfirmChaos
)

$ErrorActionPreference = "Stop"
if (-not $ConfirmChaos) { throw "This drill restarts staging replicas. Re-run with -ConfirmChaos." }
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$composeFile = Join-Path $repoRoot "infra/compose/compose.staging.yml"
$resolvedEnv = (Resolve-Path (Join-Path $repoRoot $EnvFile)).Path

function Assert-Ready {
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $ReadinessUrl -TimeoutSec 2
            if ($response.StatusCode -eq 200) { return }
        } catch {}
        Start-Sleep -Seconds 1
    }
    throw "Gateway did not remain ready during the replica failure drill."
}

foreach ($service in @("backend-a", "backend-b")) {
    docker compose --env-file $resolvedEnv -f $composeFile stop $service
    if ($LASTEXITCODE -ne 0) { throw "Could not stop $service." }
    try {
        Assert-Ready
    } finally {
        docker compose --env-file $resolvedEnv -f $composeFile start $service
        if ($LASTEXITCODE -ne 0) { throw "Could not restart $service." }
    }
    Assert-Ready
}

[pscustomobject]@{ passed = $true; replicasTested = 2; readinessUrl = $ReadinessUrl } | ConvertTo-Json
