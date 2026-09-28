param(
    [string]$PortalUrl = "http://localhost:3000",
    [string]$Email = "owner@apipay.local",
    [string]$Password = "ProjectDemo!2026",
    [string]$MfaCode = "246810"
)

$ErrorActionPreference = "Stop"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginBody = @{ email = $Email; password = $Password; mfaCode = $MfaCode } | ConvertTo-Json
$login = Invoke-WebRequest -UseBasicParsing -WebSession $session -Uri "$PortalUrl/api/auth/login" `
    -Method POST -ContentType "application/json" -Body $loginBody
if ($login.StatusCode -ne 200) { throw "Portal login failed" }

$checks = @(
    "/dashboard",
    "/banks",
    "/billing",
    "/audit-logs",
    "/api/gateway/v1/dashboard/overview?days=30",
    "/api/gateway/v1/notifications?limit=8",
    "/api/gateway/v1/billing/invoices",
    "/api/gateway/v1/billing/subscription-events",
    "/api/gateway/v1/audit_logs?limit=5"
)

foreach ($path in $checks) {
    $response = Invoke-WebRequest -UseBasicParsing -WebSession $session -Uri "$PortalUrl$path" -TimeoutSec 15
    if ($response.StatusCode -ne 200) { throw "$path returned $($response.StatusCode)" }
    Write-Host "PASS $path"
}

$overview = Invoke-RestMethod -UseBasicParsing -WebSession $session -Uri "$PortalUrl/api/gateway/v1/dashboard/overview?days=30"
if ($overview.range_days -ne 30 -or $null -eq $overview.daily -or $null -eq $overview.success_rate) {
    throw "Dashboard overview contract is incomplete"
}
Write-Host "Stage 27 portal E2E passed"
