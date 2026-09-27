param(
    [string]$BaseUrl = 'http://127.0.0.1:8088',
    [string]$PlatformAdminKey = 'change-me-staging-platform-admin'
)

$ErrorActionPreference = 'Stop'
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
$merchant = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/platform/merchants" `
    -Headers @{ 'X-Platform-Admin-Key' = $PlatformAdminKey } -ContentType 'application/json' `
    -Body (@{ businessName = 'Concurrency Test'; email = "concurrency-$suffix@example.com" } | ConvertTo-Json)
$auth = @{ Authorization = "Bearer $($merchant.testSecretKey)"; 'Idempotency-Key' = "payment-$suffix" }
$intent = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payment_intents" -Headers $auth -ContentType 'application/json' `
    -Body (@{ amount = 104000; currency = 'VND' } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/checkout/$($intent.clientSecret)/sandbox/complete" -ContentType 'application/json' `
    -Body (@{ paymentMethodType = 'VIETQR'; scenario = 'success' } | ConvertTo-Json) | Out-Null
$settleHeaders = @{ Authorization = "Bearer $($merchant.testSecretKey)"; 'Idempotency-Key' = "settle-$suffix" }
Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/settlements" -Headers $settleHeaders -ContentType 'application/json' -Body '{"currency":"VND"}' | Out-Null

$jobs = 1..2 | ForEach-Object {
    $key = "payout-$suffix-$_"
    Start-Job -ScriptBlock {
        param($Url, $Secret, $IdempotencyKey)
        try {
            Invoke-RestMethod -Method Post -Uri "$Url/v1/payouts" `
                -Headers @{ Authorization = "Bearer $Secret"; 'Idempotency-Key' = $IdempotencyKey } `
                -ContentType 'application/json' -Body '{"amount":100000,"currency":"VND","destinationReference":"concurrency-test"}' | Out-Null
            200
        } catch { [int]$_.Exception.Response.StatusCode }
    } -ArgumentList $BaseUrl, $merchant.testSecretKey, $key
}
$statuses = $jobs | Receive-Job -Wait -AutoRemoveJob
if (@($statuses | Where-Object { $_ -eq 200 }).Count -ne 1) { throw "Expected exactly one successful payout, got: $statuses" }
if (@($statuses | Where-Object { $_ -ge 400 }).Count -ne 1) { throw "Expected exactly one rejected payout, got: $statuses" }

[pscustomobject]@{ statuses = $statuses; doubleSpendPrevented = $true } | ConvertTo-Json
