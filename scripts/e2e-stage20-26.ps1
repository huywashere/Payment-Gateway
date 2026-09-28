param(
    [string]$BaseUrl = 'http://127.0.0.1:8080',
    [string]$SecretKey = 'sk_test_demo_gateway_key_999',
    [string]$BankCallbackSecret = 'project-callback-secret'
)
$ErrorActionPreference = 'Stop'
function Assert-That([bool]$Condition, [string]$Message) { if (-not $Condition) { throw $Message } }
function Bank-Signature([string]$Payload) {
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($BankCallbackSecret))
    $hex = [Convert]::ToHexString($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$timestamp.$Payload"))).ToLowerInvariant()
    "t=$timestamp,v1=$hex"
}
$auth = @{ Authorization = "Bearer $SecretKey" }
$accounts = Invoke-RestMethod -Uri "$BaseUrl/v1/bank_accounts" -Headers $auth
$account = @($accounts) | Where-Object defaultAccount | Select-Object -First 1
Assert-That ($null -ne $account) 'Default bank account is missing'
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$linkHeaders = $auth.Clone(); $linkHeaders['Idempotency-Key'] = "e2e-link-$suffix"
$linkBody = @{ amount = 286000; currency = 'VND'; description = "E2E-$suffix"; bankAccountId = $account.id; expiresInMinutes = 30; paymentCodePrefix = 'PAY' } | ConvertTo-Json -Compress
$link = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payment_links" -Headers $linkHeaders -ContentType 'application/json' -Body $linkBody
$replay = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/payment_links" -Headers $linkHeaders -ContentType 'application/json' -Body $linkBody
Assert-That ($link.id -eq $replay.id) 'Payment Link idempotency failed'
$public = Invoke-RestMethod -Uri "$BaseUrl/v1/payment_links/public/$($link.slug)"
Assert-That ($public.status -eq 'OPEN' -and $public.qrPayload.Contains('A000000727')) 'Public VietQR payload is invalid'
$qr = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/v1/payment_links/public/$($link.slug)/qr.svg?size=240"
$qrContentType = ($qr.Headers['Content-Type'] -join ',')
Assert-That ($qr.StatusCode -eq 200 -and $qrContentType.Contains('image/svg+xml')) 'QR rendering failed'
$raw = [ordered]@{ bankAccountId = $account.id; externalReference = "E2E-BANK-$suffix"; direction = 'IN'; amount = 286000; currency = 'VND'; description = $link.paymentCode; counterpartyAccount = '0123456789'; occurredAt = [DateTimeOffset]::UtcNow.ToString('o') } | ConvertTo-Json -Compress
$transaction = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/bank_transactions/inbox/$($account.bankCode)" -Headers @{ 'X-Bank-Signature' = (Bank-Signature $raw) } -ContentType 'application/json' -Body $raw
$duplicate = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/bank_transactions/inbox/$($account.bankCode)" -Headers @{ 'X-Bank-Signature' = (Bank-Signature $raw) } -ContentType 'application/json' -Body $raw
$paid = Invoke-RestMethod -Uri "$BaseUrl/v1/payment_links/public/$($link.slug)"
Assert-That ($transaction.matchStatus -eq 'MATCHED' -and $transaction.id -eq $duplicate.id) 'Bank inbox matching or dedup failed'
Assert-That ($paid.status -eq 'PAID') 'Payment Link did not become PAID'
[pscustomobject]@{ link = $link.id; qr = 'valid'; transaction = $transaction.id; match = $transaction.matchStatus; status = $paid.status; idempotent = $true } | ConvertTo-Json
