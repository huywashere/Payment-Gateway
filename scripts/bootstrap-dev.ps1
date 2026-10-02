param(
    [switch]$Build,
    [switch]$SkipWait
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  _   _                 ____       _       " -ForegroundColor Cyan
Write-Host " | \ | | _____   ____ _|  _ \ __ _| |_ ___ " -ForegroundColor Cyan
Write-Host " |  \| |/ _ \ \ / / _` | |_) / _` | __/ _ \" -ForegroundColor Cyan
Write-Host " | |\  | (_) \ V / (_| |  __/ (_| | ||  __/" -ForegroundColor Cyan
Write-Host " |_| \_|\___/ \_/ \__,_|_|   \__,_|\__\___|" -ForegroundColor Cyan
Write-Host " === NovaGate FinTech Distributed Payment Gateway === " -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Check Docker Daemon
Write-Host "[1/4] Checking Docker daemon status..." -ForegroundColor Yellow
try {
    $null = docker info 2>&1
    Write-Host "  -> Docker daemon is running." -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Docker is not running or not accessible. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# 2. Check and initialize .env.dev
Write-Host "[2/4] Verifying local development environment configuration..." -ForegroundColor Yellow
$envDevPath = Join-Path $repoRoot "infra\environments\.env.dev"
$envDevExamplePath = Join-Path $repoRoot "infra\environments\.env.dev.example"

if (-not (Test-Path -LiteralPath $envDevPath)) {
    if (Test-Path -LiteralPath $envDevExamplePath) {
        Copy-Item -LiteralPath $envDevExamplePath -Destination $envDevPath
        Write-Host "  -> Created .env.dev from .env.dev.example successfully." -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Missing .env.dev.example template." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  -> .env.dev already exists. Using current settings." -ForegroundColor Green
}

# 3. Launch Docker Compose Stack
Write-Host "[3/4] Starting NovaGate FinTech stack via Docker Compose..." -ForegroundColor Yellow
$composeArgs = @(
    "compose",
    "--env-file", "infra/environments/.env.dev",
    "-f", "infra/compose/compose.dev.yml",
    "up", "-d"
)
if ($Build) {
    $composeArgs += "--build"
}

Push-Location $repoRoot
try {
    & docker @composeArgs
    Write-Host "  -> Containers started." -ForegroundColor Green
} finally {
    Pop-Location
}

# 4. Wait for services to be ready
if (-not $SkipWait) {
    Write-Host "[4/4] Waiting for services to become healthy..." -ForegroundColor Yellow

    function Wait-Url([string]$Url, [string]$ServiceName, [int]$TimeoutSeconds = 60) {
        $start = [System.DateTime]::Now
        Write-Host -NoNewline "  Waiting for $ServiceName ($Url) "
        while (([System.DateTime]::Now - $start).TotalSeconds -lt $TimeoutSeconds) {
            try {
                $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
                if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
                    Write-Host " [READY]" -ForegroundColor Green
                    return $true
                }
            } catch {
                # Keep waiting
            }
            Write-Host -NoNewline "."
            Start-Sleep -Seconds 2
        }
        Write-Host " [TIMEOUT]" -ForegroundColor Yellow
        return $false
    }

    $null = Wait-Url "http://localhost:8080/actuator/health" "Backend Core" 60
    $null = Wait-Url "http://localhost:8090/healthz" "Infra Gateway Go Edge" 20
}

# Print Access Dashboard
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "       🚀 NOVAGATE PLATFORM IS READY FOR DEVELOPERS!       " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Service               | URL / Endpoint" -ForegroundColor White
Write-Host "  ----------------------+------------------------------------------------" -ForegroundColor Gray
Write-Host "  Merchant Portal       | http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend Core API      | http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Swagger UI Docs       | http://localhost:8080/swagger-ui/index.html" -ForegroundColor Cyan
Write-Host "  Open Banking Webhook  | http://localhost:8080/v1/open_banking/webhook/sepay" -ForegroundColor Cyan
Write-Host "  High-Throughput Edge  | http://localhost:8090" -ForegroundColor Cyan
Write-Host "  RabbitMQ Management   | http://localhost:15672 (guest / guest)" -ForegroundColor Cyan
Write-Host "  Grafana Observability | http://localhost:3001 (admin / admin)" -ForegroundColor Cyan
Write-Host "  Prometheus Metrics    | http://localhost:9090" -ForegroundColor Cyan
Write-Host ""
Write-Host "  💡 Tip: Postman collection is ready at: postman/NovaGate_API_Collection.json" -ForegroundColor Magenta
Write-Host "  💡 Run test suite: pwsh scripts/smoke-stages-6-8.ps1" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Green
