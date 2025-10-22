# Run the devolucion test against a Postgres database using psql
# Usage (PowerShell):
#   $env:PG_CONN='postgresql://user:pass@host:5432/db'; ./scripts/run_test_devolucion.ps1

if (-not $env:PG_CONN) {
  Write-Error "Please set environment variable PG_CONN with the Postgres connection string (psql compatible)."
  exit 1
}

$scriptPath = Join-Path $PSScriptRoot 'test_devolucion_temp.sql'
Write-Host "Running test script: $scriptPath against $($env:PG_CONN)"

# Use psql if available
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  Write-Error 'psql command not found. Install PostgreSQL client or run this script inside Supabase SQL editor instead.'
  exit 1
}

# Execute
& psql $env:PG_CONN -f $scriptPath
if ($LASTEXITCODE -ne 0) {
  Write-Error "psql returned exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}
Write-Host 'Test script executed.'
