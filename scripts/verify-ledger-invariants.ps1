param(
    [string]$EnvFile = "infra/environments/.env.staging.example"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$composeFile = Join-Path $repoRoot "infra/compose/compose.staging.yml"
$resolvedEnv = (Resolve-Path (Join-Path $repoRoot $EnvFile)).Path
$query = @"
WITH violations AS (
  SELECT 'invalid_posting' AS kind, count(*) AS total
  FROM ledger_entries
  WHERE amount <= 0 OR debit_account_id = credit_account_id OR currency !~ '^[A-Z]{3}$'
  UNION ALL
  SELECT 'duplicate_business_posting', count(*)
  FROM (
    SELECT charge_id, refund_id, settlement_id, payout_id, dispute_id, entry_type
    FROM ledger_entries
    GROUP BY charge_id, refund_id, settlement_id, payout_id, dispute_id, entry_type
    HAVING count(*) > 1
  ) duplicates
  UNION ALL
  SELECT 'unbalanced_currency', count(*)
  FROM (
    SELECT currency,
           sum(CASE WHEN side = 'DEBIT' THEN amount ELSE 0 END) AS debits,
           sum(CASE WHEN side = 'CREDIT' THEN amount ELSE 0 END) AS credits
    FROM (
      SELECT currency, amount, 'DEBIT' AS side FROM ledger_entries
      UNION ALL
      SELECT currency, amount, 'CREDIT' AS side FROM ledger_entries
    ) postings
    GROUP BY currency
    HAVING sum(CASE WHEN side = 'DEBIT' THEN amount ELSE 0 END)
        <> sum(CASE WHEN side = 'CREDIT' THEN amount ELSE 0 END)
  ) unbalanced
)
SELECT coalesce(sum(total), 0) FROM violations;
"@

$result = docker compose --env-file $resolvedEnv -f $composeFile exec -T postgres `
    psql -U gateway_staging -d payment_gateway_staging -Atc $query
if ($LASTEXITCODE -ne 0) { throw "Ledger invariant query failed." }
$violations = [int](($result | Select-Object -Last 1).Trim())
[pscustomobject]@{ ledgerInvariantViolations = $violations; passed = $violations -eq 0 } | ConvertTo-Json
if ($violations -ne 0) { exit 2 }
