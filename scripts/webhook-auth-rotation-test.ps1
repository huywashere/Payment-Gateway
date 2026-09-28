param([string]$BaseUrl = 'http://127.0.0.1:8080', [string]$SecretKey = 'sk_test_demo_gateway_key_999')
$ErrorActionPreference = 'Stop'
$auth = @{ Authorization = "Bearer $SecretKey"; 'Content-Type' = 'application/json' }
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
$listedEndpoints = Invoke-RestMethod -Uri "$BaseUrl/v1/webhooks/endpoints" -Headers @{ Authorization="Bearer $SecretKey" }
$existingEndpoints = @($listedEndpoints)
foreach ($endpoint in @($existingEndpoints) | Where-Object status -eq 'ACTIVE') {
    Invoke-RestMethod -Method Delete -Uri "$BaseUrl/v1/webhooks/endpoints/$($endpoint.id)" -Headers @{ Authorization="Bearer $SecretKey" } | Out-Null
}
$apiKeyEndpoint = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/webhooks/endpoints" -Headers $auth -Body (@{ url="https://example.com/webhook/$suffix"; subscribedEvents=@('payment_intent.succeeded'); authType='API_KEY'; authConfig=@{headerName='X-Api-Key';value="secret-$suffix"}; bankCodes=@('ACB'); directions=@('IN'); paymentCodePrefixes=@('PAY'); alertChannel='EMAIL'; alertDestination="ops-$suffix@example.com" } | ConvertTo-Json -Depth 5)
$oauthEndpoint = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/webhooks/endpoints" -Headers $auth -Body (@{ url="https://example.org/webhook/$suffix"; subscribedEvents=@('*'); authType='OAUTH2'; authConfig=@{tokenUrl='https://example.org/oauth/token';clientId="client-$suffix";clientSecret="secret-$suffix";scope='payments'} } | ConvertTo-Json -Depth 5)
$rotated = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/webhooks/endpoints/$($apiKeyEndpoint.id)/rotate-secret" -Headers @{ Authorization="Bearer $SecretKey" }
Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/webhooks/endpoints/$($apiKeyEndpoint.id)/test-alert" -Headers @{ Authorization="Bearer $SecretKey" } | Out-Null
Start-Sleep -Seconds 4
$listed = Invoke-RestMethod -Uri "$BaseUrl/v1/webhooks/endpoints" -Headers @{ Authorization="Bearer $SecretKey" }
$alerts = Invoke-RestMethod -Uri "$BaseUrl/v1/webhooks/alerts" -Headers @{ Authorization="Bearer $SecretKey" }
if (-not $rotated.signingSecret.StartsWith('whsec_')) { throw 'Secret rotation failed' }
if (($listed | Where-Object id -eq $apiKeyEndpoint.id).signingSecret) { throw 'List endpoint exposed signing secret' }
if (-not ($alerts | Where-Object { $_.endpointId -eq $apiKeyEndpoint.id -and $_.status -eq 'SENT' })) { throw 'Mock alert was not delivered' }
[pscustomobject]@{ apiKey=$apiKeyEndpoint.authType; oauth=$oauthEndpoint.authType; rotation=$true; mockAlert='SENT' } | ConvertTo-Json
