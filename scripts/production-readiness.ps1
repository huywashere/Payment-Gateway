param(
    [string]$EnvFile = "infra/environments/.env.production",
    [string]$EvidenceDirectory = "evidence/production"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$resolvedEnv = (Resolve-Path (Join-Path $repoRoot $EnvFile)).Path
$values = @{}
Get-Content -LiteralPath $resolvedEnv | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $name, $value = $line.Split("=", 2)
        $values[$name.Trim()] = $value.Trim()
    }
}

$blockers = [System.Collections.Generic.List[string]]::new()
function Require-Value([string]$Name) {
    if (-not $values.ContainsKey($Name) -or [string]::IsNullOrWhiteSpace($values[$Name])) {
        $blockers.Add("Missing environment value: $Name")
    }
}
function Require-Equal([string]$Name, [string]$Expected) {
    Require-Value $Name
    if ($values.ContainsKey($Name) -and $values[$Name] -ne $Expected) {
        $blockers.Add("$Name must be $Expected")
    }
}

@(
    "GATEWAY_LIVE_SECRET_KEY",
    "GATEWAY_LIVE_PROCESSOR_ADAPTER", "GATEWAY_LIVE_PAYOUT_ADAPTER", "GATEWAY_KMS_ADAPTER",
    "PORTAL_SESSION_SECRET", "PORTAL_OIDC_ISSUER", "GATEWAY_PLATFORM_OIDC_ISSUER", "PORTAL_OIDC_CLIENT_ID",
    "PORTAL_OIDC_CLIENT_SECRET", "GATEWAY_ALLOWED_ORIGINS", "DATABASE_URL",
    "SPRING_DATASOURCE_URL", "SPRING_DATASOURCE_USERNAME", "SPRING_DATASOURCE_PASSWORD",
    "SPRING_REDIS_HOST", "SPRING_REDIS_PASSWORD", "SPRING_RABBITMQ_HOST",
    "SPRING_RABBITMQ_USERNAME", "SPRING_RABBITMQ_PASSWORD"
) | ForEach-Object { Require-Value $_ }
Require-Equal "GATEWAY_MODE" "live"
Require-Equal "GATEWAY_PROCESSOR_MODE" "live"
Require-Equal "GATEWAY_VAULT_PROVIDER" "kms"
Require-Equal "GATEWAY_EXTERNAL_CONTROLS_ATTESTED" "true"
Require-Equal "GATEWAY_WEBHOOK_DELIVERY_ENABLED" "true"
Require-Equal "GATEWAY_RATE_LIMIT_ENABLED" "true"
Require-Equal "GATEWAY_RATE_LIMIT_FAIL_OPEN" "false"
Require-Equal "SPRING_REDIS_SSL_ENABLED" "true"
Require-Equal "SPRING_RABBITMQ_SSL_ENABLED" "true"
Require-Equal "PORTAL_AUTH_MODE" "oidc"
Require-Equal "PORTAL_SECURE_COOKIES" "true"

if ($values["GATEWAY_LIVE_PROCESSOR_ADAPTER"] -eq "placeholder") {
    $blockers.Add("A real live processor adapter must replace the placeholder")
}
if ($values["GATEWAY_LIVE_PAYOUT_ADAPTER"] -eq "placeholder") {
    $blockers.Add("A real live payout adapter must replace the placeholder")
}
if ($values["GATEWAY_KMS_ADAPTER"] -eq "placeholder") {
    $blockers.Add("A real KMS/HSM vault adapter must replace the placeholder")
}
if ($values["PORTAL_OIDC_ISSUER"] -and -not $values["PORTAL_OIDC_ISSUER"].StartsWith("https://")) {
    $blockers.Add("PORTAL_OIDC_ISSUER must use HTTPS")
}
if ($values["GATEWAY_PLATFORM_OIDC_ISSUER"] -and -not $values["GATEWAY_PLATFORM_OIDC_ISSUER"].StartsWith("https://")) {
    $blockers.Add("GATEWAY_PLATFORM_OIDC_ISSUER must use HTTPS")
}
if ($values["DATABASE_URL"] -and $values["DATABASE_URL"] -notmatch "sslmode=(require|verify-full)") {
    $blockers.Add("DATABASE_URL must enforce PostgreSQL TLS")
}
if ($values["SPRING_DATASOURCE_URL"] -and $values["SPRING_DATASOURCE_URL"] -notmatch "sslmode=(require|verify-full)") {
    $blockers.Add("SPRING_DATASOURCE_URL must enforce PostgreSQL TLS")
}

$sensitiveNames = @("GATEWAY_LIVE_SECRET_KEY", "PORTAL_SESSION_SECRET", "PORTAL_OIDC_CLIENT_SECRET")
foreach ($name in $sensitiveNames) {
    $value = $values[$name]
    if ($value -match "(?i)(change-me|demo|development|project-secret|replace)") {
        $blockers.Add("$name contains a demo/development marker")
    }
}

foreach ($name in @("GATEWAY_ALLOWED_ORIGINS", "PORTAL_OIDC_ISSUER", "GATEWAY_PLATFORM_OIDC_ISSUER", "DATABASE_URL", "SPRING_DATASOURCE_URL")) {
    $value = $values[$name]
    if ($value -match "(?i)(example\.(com|internal)|replace)") {
        $blockers.Add("$name still contains an example placeholder")
    }
}

$evidenceRoot = Join-Path $repoRoot $EvidenceDirectory
$requiredEvidence = @(
    "bank-uat-approval.md",
    "legal-and-contract-approval.md",
    "pci-scope-approval.md",
    "independent-pentest.md",
    "disaster-recovery-drill.md"
)
foreach ($evidence in $requiredEvidence) {
    if (-not (Test-Path -LiteralPath (Join-Path $evidenceRoot $evidence))) {
        $blockers.Add("Missing external evidence: $evidence")
    }
}

[pscustomobject]@{
    ready = $blockers.Count -eq 0
    checkedAt = [DateTimeOffset]::UtcNow.ToString("O")
    environment = $EnvFile
    blockerCount = $blockers.Count
    blockers = $blockers
} | ConvertTo-Json -Depth 4

if ($blockers.Count -gt 0) { exit 2 }
