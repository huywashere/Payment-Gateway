param(
    [string]$BaseUrl = 'http://127.0.0.1:8080',
    [string]$PlatformAdminKey = 'platform_dev_admin_change_me'
)

$ErrorActionPreference = 'Stop'
function Assert-That([bool]$Condition, [string]$Message) { if (-not $Condition) { throw $Message } }

$suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
$platform = @{ 'X-Platform-Admin-Key' = $PlatformAdminKey }
$merchant = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/platform/merchants" -Headers $platform `
    -ContentType 'application/json' -Body (@{ businessName = 'Stage 910 Smoke'; email = "ops-$suffix@example.com" } | ConvertTo-Json)
$auth = @{ Authorization = "Bearer $($merchant.testSecretKey)" }

$createHeaders = $auth.Clone(); $createHeaders['Idempotency-Key'] = "ops-payment-$suffix"
$intent = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payment_intents" -Headers $createHeaders `
    -ContentType 'application/json' -Body (@{ amount = 200000; currency = 'VND'; description = 'OPS-SMOKE' } | ConvertTo-Json)
$paid = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/checkout/$($intent.clientSecret)/sandbox/complete" `
    -ContentType 'application/json' -Body (@{ paymentMethodType = 'VIETQR'; scenario = 'success' } | ConvertTo-Json)
Assert-That ($paid.status -eq 'SUCCEEDED') 'Payment did not succeed'
$charge = Invoke-RestMethod -Uri "$BaseUrl/v1/charges/$($paid.latestChargeId)" -Headers $auth
Assert-That ([bool]$charge.processorTransactionId) 'Charge did not expose its processor transaction reference'
$balanceCaptured = Invoke-RestMethod -Uri "$BaseUrl/v1/balance" -Headers $auth
Assert-That ($balanceCaptured.pending_balance -eq 195000 -and $balanceCaptured.available_balance -eq 0) 'Captured funds were not held in pending'

$settlementHeaders = $auth.Clone(); $settlementHeaders['Idempotency-Key'] = "ops-settlement-$suffix"
$settlement = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/settlements" -Headers $settlementHeaders `
    -ContentType 'application/json' -Body (@{ currency = 'VND' } | ConvertTo-Json)
$settlementReplay = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/settlements" -Headers $settlementHeaders `
    -ContentType 'application/json' -Body (@{ currency = 'VND' } | ConvertTo-Json)
Assert-That ($settlement.id -eq $settlementReplay.id -and $settlement.netAmount -eq 195000) 'Settlement or replay is incorrect'
$balanceSettled = Invoke-RestMethod -Uri "$BaseUrl/v1/balance" -Headers $auth
Assert-That ($balanceSettled.pending_balance -eq 0 -and $balanceSettled.available_balance -eq 195000) 'Settlement did not move pending to available'

$payoutHeaders = $auth.Clone(); $payoutHeaders['Idempotency-Key'] = "ops-payout-$suffix"
$payoutBody = @{ amount = 50000; currency = 'VND'; destinationReference = 'sandbox-bank-account-9704' } | ConvertTo-Json
$payout = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payouts" -Headers $payoutHeaders -ContentType 'application/json' -Body $payoutBody
$payoutReplay = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payouts" -Headers $payoutHeaders -ContentType 'application/json' -Body $payoutBody
Assert-That ($payout.id -eq $payoutReplay.id -and $payout.status -eq 'PAID') 'Payout or payout replay is incorrect'
$balancePaidOut = Invoke-RestMethod -Uri "$BaseUrl/v1/balance" -Headers $auth
Assert-That ($balancePaidOut.available_balance -eq 145000) 'Payout did not reduce available balance'

$dispute = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/platform/disputes" -Headers $platform `
    -ContentType 'application/json' -Body (@{ merchantId = $merchant.id; chargeId = $charge.id; amount = 30000; reason = 'fraudulent' } | ConvertTo-Json)
$balanceReserved = Invoke-RestMethod -Uri "$BaseUrl/v1/balance" -Headers $auth
Assert-That ($balanceReserved.available_balance -eq 115000 -and $balanceReserved.dispute_reserve -eq 30000) 'Dispute reserve ledger movement is incorrect'
$evidence = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/disputes/$($dispute.id)/evidence" -Headers $auth `
    -ContentType 'application/json' -Body (@{ evidence = @{ orderId = 'OPS-SMOKE'; customerConfirmed = $true } } | ConvertTo-Json -Depth 5)
Assert-That ($evidence.status -eq 'UNDER_REVIEW') 'Dispute evidence did not move to review'
$resolved = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/platform/disputes/$($dispute.id)/resolve" -Headers $platform `
    -ContentType 'application/json' -Body (@{ outcome = 'WON' } | ConvertTo-Json)
$balanceResolved = Invoke-RestMethod -Uri "$BaseUrl/v1/balance" -Headers $auth
Assert-That ($resolved.status -eq 'WON' -and $balanceResolved.available_balance -eq 145000 -and $balanceResolved.dispute_reserve -eq 0) 'Won dispute did not restore available funds'

$risk = Invoke-RestMethod -Method Put -Uri "$BaseUrl/v1/risk/profile" -Headers $auth -ContentType 'application/json' `
    -Body (@{ enabled = $true; maxTransactionAmount = 100000; dailyVolumeLimit = 10000000; velocityLimitPerMinute = 100; reviewScoreThreshold = 50; blockScoreThreshold = 80 } | ConvertTo-Json)
$blockedHeaders = $auth.Clone(); $blockedHeaders['Idempotency-Key'] = "ops-risk-$suffix"
$blockedIntent = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payment_intents" -Headers $blockedHeaders `
    -ContentType 'application/json' -Body (@{ amount = 200000; currency = 'VND'; description = 'RISK-BLOCK' } | ConvertTo-Json)
$blocked = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/checkout/$($blockedIntent.clientSecret)/sandbox/complete" `
    -ContentType 'application/json' -Body (@{ paymentMethodType = 'CARD'; scenario = 'success' } | ConvertTo-Json)
Assert-That ($blocked.status -eq 'FAILED' -and $blocked.failureCode -eq 'risk_blocked') 'Risk policy did not block the oversized payment'

$periodStart = (Get-Date).ToUniversalTime().AddHours(-1).ToString('o')
$periodEnd = (Get-Date).ToUniversalTime().AddHours(1).ToString('o')
$reconciliation = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/platform/reconciliation_runs" -Headers $platform `
    -ContentType 'application/json' -Body (@{
        merchantId = $merchant.id; processorCode = $charge.processorCode; periodStart = $periodStart; periodEnd = $periodEnd
        records = @(
            @{ processorTxId = $charge.processorTransactionId; amount = $charge.amount; status = $charge.status },
            @{ processorTxId = "external-only-$suffix"; amount = 12000; status = 'SUCCEEDED' }
        )
    } | ConvertTo-Json -Depth 6)
Assert-That ($reconciliation.matchedCount -eq 1 -and $reconciliation.mismatchCount -eq 1 -and $reconciliation.status -eq 'REQUIRES_REVIEW') 'Reconciliation results are incorrect'
$readiness = Invoke-RestMethod -Uri "$BaseUrl/v1/platform/operations/readiness" -Headers $platform
Assert-That ($readiness.failed_outbox_events -eq 0 -and $readiness.open_disputes -eq 0 -and $readiness.reconciliation_runs_requiring_review -ge 1) 'Operations readiness summary is incorrect'

[pscustomobject]@{
    payment = $paid.status
    capturedPending = $balanceCaptured.pending_balance
    settlementReplay = $settlement.id -eq $settlementReplay.id
    settledAvailable = $balanceSettled.available_balance
    payoutReplay = $payout.id -eq $payoutReplay.id
    availableAfterPayout = $balancePaidOut.available_balance
    dispute = "$($evidence.status) -> $($resolved.status)"
    riskDecision = $blocked.failureCode
    reconciliation = "$($reconciliation.matchedCount) matched / $($reconciliation.mismatchCount) review"
    readiness = $readiness.status
} | ConvertTo-Json
