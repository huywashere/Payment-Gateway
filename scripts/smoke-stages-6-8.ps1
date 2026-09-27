param(
    [string]$BaseUrl = 'http://127.0.0.1:8080',
    [string]$PlatformAdminKey = 'platform_dev_admin_change_me'
)

$ErrorActionPreference = 'Stop'

function Assert-That([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}

$suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
$merchant = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/platform/merchants" `
    -Headers @{ 'X-Platform-Admin-Key' = $PlatformAdminKey } -ContentType 'application/json' `
    -Body (@{ businessName = 'Stage 678 Smoke Merchant'; email = "smoke-$suffix@example.com" } | ConvertTo-Json)
Assert-That ([bool]$merchant.testSecretKey) 'Onboarding did not return a one-time secret key'
$auth = @{ Authorization = "Bearer $($merchant.testSecretKey)" }
$endpoint = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/webhooks/endpoints" -Headers $auth `
    -ContentType 'application/json' -Body (@{
        url = 'https://example.com/gateway-smoke'
        description = 'Smoke endpoint'
        subscribedEvents = @('payment_intent.succeeded', 'refund.succeeded')
    } | ConvertTo-Json)

$createHeaders = $auth.Clone()
$createHeaders['Idempotency-Key'] = "smoke-create-$suffix"
$intentBody = @{ amount = 150000; currency = 'VND'; description = 'SMOKE-ORDER-001' } | ConvertTo-Json
$intent = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payment_intents" -Headers $createHeaders `
    -ContentType 'application/json' -Body $intentBody
$replay = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payment_intents" -Headers $createHeaders `
    -ContentType 'application/json' -Body $intentBody
Assert-That ($replay.id -eq $intent.id) 'Idempotent replay returned a different PaymentIntent'

$conflict = Invoke-WebRequest -SkipHttpErrorCheck -Method Post -Uri "$BaseUrl/v1/payment_intents" `
    -Headers $createHeaders -ContentType 'application/json' `
    -Body (@{ amount = 151000; currency = 'VND' } | ConvertTo-Json)
Assert-That ($conflict.StatusCode -eq 409) "Expected idempotency conflict 409, got $($conflict.StatusCode)"

$paid = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/checkout/$($intent.clientSecret)/sandbox/complete" `
    -ContentType 'application/json' -Body (@{ paymentMethodType = 'VIETQR'; scenario = 'success' } | ConvertTo-Json)
Assert-That ($paid.status -eq 'SUCCEEDED' -and [bool]$paid.latestChargeId) 'VietQR sandbox payment failed'
$balanceAfterPay = Invoke-RestMethod -Uri "$BaseUrl/v1/balance" -Headers $auth
Assert-That ($balanceAfterPay.pending_balance -eq 145750 -and $balanceAfterPay.available_balance -eq 0) `
    "Unexpected payment balances pending=$($balanceAfterPay.pending_balance), available=$($balanceAfterPay.available_balance)"

$refundHeaders = $auth.Clone()
$refundHeaders['Idempotency-Key'] = "smoke-refund-$suffix"
$refundBody = @{ amount = 50000; reason = 'requested_by_customer' } | ConvertTo-Json
$refund = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/charges/$($paid.latestChargeId)/refunds" `
    -Headers $refundHeaders -ContentType 'application/json' -Body $refundBody
$refundReplay = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/charges/$($paid.latestChargeId)/refunds" `
    -Headers $refundHeaders -ContentType 'application/json' -Body $refundBody
Assert-That ($refund.id -eq $refundReplay.id) 'Refund replay returned a different refund'
$balanceAfterRefund = Invoke-RestMethod -Uri "$BaseUrl/v1/balance" -Headers $auth
Assert-That ($balanceAfterRefund.pending_balance -eq 95750) "Unexpected refund balance $($balanceAfterRefund.pending_balance)"

$threeDsHeaders = $auth.Clone()
$threeDsHeaders['Idempotency-Key'] = "smoke-3ds-$suffix"
$threeDsIntent = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payment_intents" -Headers $threeDsHeaders `
    -ContentType 'application/json' `
    -Body (@{ amount = 100000; currency = 'VND'; description = 'SMOKE-3DS' } | ConvertTo-Json)
$beforeAction = Invoke-RestMethod -Method Post `
    -Uri "$BaseUrl/v1/checkout/$($threeDsIntent.clientSecret)/sandbox/complete" -ContentType 'application/json' `
    -Body (@{ paymentMethodType = 'CARD'; scenario = 'requires_action' } | ConvertTo-Json)
Assert-That ($beforeAction.status -eq 'REQUIRES_ACTION') "Expected REQUIRES_ACTION, got $($beforeAction.status)"
$afterAction = Invoke-RestMethod -Method Post `
    -Uri "$BaseUrl/v1/checkout/$($threeDsIntent.clientSecret)/sandbox/action" -ContentType 'application/json' `
    -Body (@{ success = $true } | ConvertTo-Json)
Assert-That ($afterAction.status -eq 'SUCCEEDED') 'Sandbox 3DS completion failed'

$newKey = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/api_keys" -Headers $auth -ContentType 'application/json' `
    -Body (@{ displayName = 'Smoke read key'; keyType = 'SECRET'; environment = 'TEST'; scopes = @('payments:read', 'balance:read') } | ConvertTo-Json)
Assert-That ([bool]$newKey.secret) 'API key creation did not return its one-time secret'
$listedKeys = Invoke-RestMethod -Uri "$BaseUrl/v1/api_keys" -Headers $auth
$listedNewKey = $listedKeys.Where({ $_.id -eq $newKey.id }, 'First')
Assert-That (($null -ne $listedNewKey) -and [string]::IsNullOrEmpty([string]$listedNewKey.secret)) `
    'API key list leaked or omitted key metadata'

$audits = Invoke-RestMethod -Uri "$BaseUrl/v1/audit_logs?limit=100" -Headers $auth
Assert-That ($audits.Count -ge 4) "Expected at least four audit records, got $($audits.Count)"
$deliveries = @()
for ($attempt = 0; $attempt -lt 15; $attempt++) {
    Start-Sleep -Seconds 1
    $deliveries = Invoke-RestMethod -Uri "$BaseUrl/v1/webhooks/deliveries?limit=25" -Headers $auth
    $notDisabled = @($deliveries | Where-Object status -ne 'DISABLED')
    if ($deliveries.Count -ge 3 -and $notDisabled.Count -eq 0) { break }
}
Assert-That ($deliveries.Count -ge 3) "Expected webhook deliveries from the outbox, got $($deliveries.Count)"
Assert-That (($deliveries | Where-Object status -ne 'DISABLED').Count -eq 0) `
    'Webhook delivery should be safely disabled in this smoke environment'
$replayedDelivery = $deliveries[0]
Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/webhooks/deliveries/$($replayedDelivery.id)/replay" -Headers $auth
Start-Sleep -Seconds 3
$deliveryAfterReplay = (Invoke-RestMethod -Uri "$BaseUrl/v1/webhooks/deliveries?limit=25" -Headers $auth).Where(
    { $_.id -eq $replayedDelivery.id }, 'First')
Assert-That ($deliveryAfterReplay.status -eq 'DISABLED') 'Webhook replay was not picked up by the delivery worker'

[pscustomobject]@{
    idempotentReplay = $true
    conflictStatus = $conflict.StatusCode
    vietQr = $paid.status
    pendingAfterPay = $balanceAfterPay.pending_balance
    refundReplay = $true
    pendingAfterRefund = $balanceAfterRefund.pending_balance
    threeDs = "$($beforeAction.status) -> $($afterAction.status)"
    oneTimeSecret = $true
    listedSecretHidden = -not [bool]$listedNewKey.secret
    webhookEndpoint = [bool]$endpoint.id
    webhookDeliveries = $deliveries.Count
    webhookReplay = $deliveryAfterReplay.status
    auditCount = $audits.Count
} | ConvertTo-Json
