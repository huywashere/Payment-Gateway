param(
    [string]$BaseUrl = 'http://127.0.0.1:8080',
    [string]$SecretKey = 'sk_test_demo_gateway_key_999',
    [string]$BankCallbackSecret = 'project-callback-secret'
)
$ErrorActionPreference = 'Stop'
$auth = @{ Authorization = "Bearer $SecretKey" }
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 10)

function Bank-Signature([string]$Payload) {
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($BankCallbackSecret))
    $hex = [Convert]::ToHexString($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$timestamp.$Payload"))).ToLowerInvariant()
    "t=$timestamp,v1=$hex"
}

# Concurrent matching: the same signed bank event must be deduplicated and settle one link once.
$accounts = Invoke-RestMethod -Uri "$BaseUrl/v1/bank_accounts" -Headers $auth
$account = @($accounts) | Where-Object defaultAccount | Select-Object -First 1
$linkHeaders = $auth.Clone(); $linkHeaders['Idempotency-Key'] = "concurrency-link-$suffix"
$link = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payment_links" -Headers $linkHeaders -ContentType 'application/json' -Body (@{
    amount = 381000; currency = 'VND'; description = 'Concurrent bank match'; bankAccountId = $account.id; expiresInMinutes = 20; paymentCodePrefix = 'CC'
} | ConvertTo-Json -Compress)
$raw = [ordered]@{ bankAccountId = $account.id; externalReference = "CONCURRENT-BANK-$suffix"; direction = 'IN'; amount = 381000; currency = 'VND'; description = $link.paymentCode; counterpartyAccount = '0987654321'; occurredAt = [DateTimeOffset]::UtcNow.ToString('o') } | ConvertTo-Json -Compress
$signature = Bank-Signature $raw
$matchJobs = 1..2 | ForEach-Object {
    Start-Job -ScriptBlock {
        param($Url, $AccountBank, $Payload, $Signature)
        try {
            $result = Invoke-RestMethod -Method Post -Uri "$Url/v1/bank_transactions/inbox/$AccountBank" -Headers @{ 'X-Bank-Signature' = $Signature } -ContentType 'application/json' -Body $Payload
            [pscustomobject]@{ status = 200; id = $result.id; match = $result.matchStatus }
        } catch { [pscustomobject]@{ status = [int]$_.Exception.Response.StatusCode; id = ''; match = '' } }
    } -ArgumentList $BaseUrl,$account.bankCode,$raw,$signature
}
$matchResults = @($matchJobs | Receive-Job -Wait -AutoRemoveJob)
if (@($matchResults | Where-Object status -eq 200).Count -ne 2) { throw "Concurrent bank inbox failed: $($matchResults | ConvertTo-Json -Compress)" }
if (@($matchResults.id | Select-Object -Unique).Count -ne 1 -or @($matchResults | Where-Object match -eq 'MATCHED').Count -ne 2) { throw 'Concurrent matching was not idempotent' }

# Concurrent capture: only one 70k capture may consume a 100k authorization.
$intentHeaders = $auth.Clone(); $intentHeaders['Idempotency-Key'] = "concurrency-intent-$suffix"
$intent = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payment_intents" -Headers $intentHeaders -ContentType 'application/json' -Body '{"amount":100000,"currency":"VND","description":"Acquirer concurrency"}'
$authorizeHeaders = $auth.Clone(); $authorizeHeaders['Idempotency-Key'] = "concurrency-auth-$suffix"
$authorization = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/acquirer/operations" -Headers $authorizeHeaders -ContentType 'application/json' -Body (@{ paymentIntentId = $intent.id; operationType = 'AUTHORIZE'; amount = 100000; currency = 'VND'; scenario = 'success'; requestThreeDs = $false } | ConvertTo-Json)
$captureJobs = 1..2 | ForEach-Object {
    $key = "concurrency-capture-$suffix-$_"
    Start-Job -ScriptBlock { param($Url,$Secret,$Parent,$Key) try { Invoke-RestMethod -Method Post -Uri "$Url/v1/acquirer/operations" -Headers @{ Authorization="Bearer $Secret"; 'Idempotency-Key'=$Key } -ContentType 'application/json' -Body (@{ parentOperationId=$Parent; operationType='CAPTURE'; amount=70000; currency='VND'; scenario='success'; requestThreeDs=$false }|ConvertTo-Json) | Out-Null; 201 } catch { [int]$_.Exception.Response.StatusCode } } -ArgumentList $BaseUrl,$SecretKey,$authorization.id,$key
}
$captureStatuses = @($captureJobs | Receive-Job -Wait -AutoRemoveJob)
if (@($captureStatuses | Where-Object { $_ -eq 201 }).Count -ne 1 -or @($captureStatuses | Where-Object { $_ -ge 400 }).Count -ne 1) { throw "Expected one capture and one rejection, got $captureStatuses" }

# Concurrent refund: only one 40k refund may consume the remaining amount of the 70k capture.
$operations = Invoke-RestMethod -Uri "$BaseUrl/v1/acquirer/operations?paymentIntentId=$($intent.id)" -Headers $auth
$capture = $operations | Where-Object { $_.operationType -eq 'CAPTURE' -and $_.status -eq 'CAPTURED' } | Select-Object -First 1
$refundJobs = 1..2 | ForEach-Object {
    $key = "concurrency-refund-$suffix-$_"
    Start-Job -ScriptBlock { param($Url,$Secret,$Parent,$Key) try { Invoke-RestMethod -Method Post -Uri "$Url/v1/acquirer/operations" -Headers @{ Authorization="Bearer $Secret"; 'Idempotency-Key'=$Key } -ContentType 'application/json' -Body (@{ parentOperationId=$Parent; operationType='REFUND'; amount=40000; currency='VND'; scenario='success'; requestThreeDs=$false }|ConvertTo-Json) | Out-Null; 201 } catch { [int]$_.Exception.Response.StatusCode } } -ArgumentList $BaseUrl,$SecretKey,$capture.id,$key
}
$refundStatuses = @($refundJobs | Receive-Job -Wait -AutoRemoveJob)
if (@($refundStatuses | Where-Object { $_ -eq 201 }).Count -ne 1 -or @($refundStatuses | Where-Object { $_ -ge 400 }).Count -ne 1) { throw "Expected one refund and one rejection, got $refundStatuses" }

[pscustomobject]@{
    matching = 'deduplicated'; transactionId = $matchResults[0].id
    captureStatuses = $captureStatuses; refundStatuses = $refundStatuses
    overCapturePrevented = $true; overRefundPrevented = $true
} | ConvertTo-Json
