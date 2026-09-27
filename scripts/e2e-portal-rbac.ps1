param(
    [string]$PortalUrl = 'http://127.0.0.1:3008',
    [string]$Password = 'ProjectDemo!2026',
    [string]$MfaCode = '246810'
)

$ErrorActionPreference = 'Stop'
function Login([string]$Email) {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    Invoke-RestMethod -Method Post -Uri "$PortalUrl/api/auth/login" -WebSession $session `
        -ContentType 'application/json' -Body (@{ email = $Email; password = $Password; mfaCode = $MfaCode } | ConvertTo-Json) | Out-Null
    return $session
}

$owner = Login 'owner@apipay.local'
$ownerSession = Invoke-RestMethod -Uri "$PortalUrl/api/auth/session" -WebSession $owner
if ($ownerSession.session.role -ne 'OWNER') { throw 'Owner session was not created.' }

$developer = Login 'developer@apipay.local'
$denied = $false
try {
    Invoke-WebRequest -Method Post -Uri "$PortalUrl/api/gateway/v1/payouts" -WebSession $developer `
        -ContentType 'application/json' -Headers @{ 'Idempotency-Key' = [guid]::NewGuid().ToString() } `
        -Body (@{ amount = 1000; currency = 'VND'; destinationReference = 'rbac-test' } | ConvertTo-Json) | Out-Null
} catch {
    $denied = $_.Exception.Response.StatusCode -eq 403
}
if (-not $denied) { throw 'Developer role was not denied access to payouts.' }

Invoke-RestMethod -Method Post -Uri "$PortalUrl/api/auth/logout" -WebSession $owner | Out-Null
$loggedOut = $false
try { Invoke-WebRequest -Uri "$PortalUrl/api/auth/session" -WebSession $owner | Out-Null }
catch { $loggedOut = $_.Exception.Response.StatusCode -eq 401 }
if (-not $loggedOut) { throw 'Logout did not invalidate the portal session.' }

[pscustomobject]@{ ownerAuthenticated = $true; developerPayoutDenied = $denied; logoutVerified = $loggedOut } | ConvertTo-Json
