<#
Run migrate devolucion script safely from PowerShell

Usage examples:
  # Interactive prompts (recommended)
  powershell -ExecutionPolicy Bypass -File .\scripts\run_migrate_devolucion.ps1

        # Provide connection details as parameters (be careful with password on command line)
        powershell -ExecutionPolicy Bypass -File .\scripts\run_migrate_devolucion.ps1 -PgHost db.abcd.supabase.co -User postgres -DatabaseName postgres

#> 

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)] [string]$PgHost,
    [Parameter(Mandatory=$false)] [string]$Port = '5432',
    [Parameter(Mandatory=$false)] [string]$User,
    [Parameter(Mandatory=$false, Position=0)] [string]$DatabaseName,
    # Plain password is allowed but discouraged. If omitted you'll be prompted securely.
    [Parameter(Mandatory=$false)] [string]$Password
)

$scriptPath = Join-Path (Get-Location) 'scripts\032_add_devolucion_state.sql'

if (-not (Test-Path $scriptPath)) {
    Write-Host "ERROR: migration script not found at $scriptPath" -ForegroundColor Red
    exit 1
}

# Basic validation: detect accidental VSCode content-ref invocation like '[run_migrate_devolucion.ps1](http://_vscodecontentref_/1)'
# Avoid accidental VSCode content-ref invocation
if ($PgHost -and ($PgHost -match '^\[.*\]\(|http' -or $PgHost -match '_vscodecontentref_')) {
    Write-Host "It looks like you invoked the script via a VSCode content-ref. Open a PowerShell terminal and run the script directly. Example:" -ForegroundColor Yellow
    Write-Host "  powershell -ExecutionPolicy Bypass -File .\scripts\run_migrate_devolucion.ps1 -PgHost <host> -User <user> -DatabaseName <db>" -ForegroundColor Cyan
    exit 2
}

# Prompt for any missing connection pieces
if (-not $PgHost) { $PgHost = Read-Host 'Postgres host (e.g. db.abcd1234.supabase.co)' }

# If the user pasted an entire connection string (postgres://... or postgresql://...), try to parse it
if ($PgHost -and $PgHost -match '^postgres') {
    try {
        $uri = [System.Uri]::new($PgHost)
        if ($uri.Scheme -match 'postgres') {
            # Extract userinfo (user:password) if present
            $ui = $uri.UserInfo
            if ($ui) {
                $parts = $ui.Split(':',2)
                if ($parts.Length -ge 1 -and -not [string]::IsNullOrWhiteSpace($parts[0])) { $User = $parts[0] }
                if ($parts.Length -ge 2 -and -not [string]::IsNullOrWhiteSpace($parts[1]) -and -not $Password) { $Password = $parts[1] }
            }
            # Host and port
            if ($uri.Host) { $PgHost = $uri.Host }
            if ($uri.Port -and $uri.Port -ne -1) { $Port = [string]$uri.Port }
            # Path may contain leading slash with db name
            $dbFromPath = $uri.AbsolutePath.TrimStart('/')
            if ($dbFromPath -and -not $DatabaseName) { $DatabaseName = $dbFromPath }

            Write-Host "Detected full connection string and parsed values:" -ForegroundColor Cyan
            Write-Host "  Host: $PgHost" -ForegroundColor Cyan
            Write-Host "  Port: $Port" -ForegroundColor Cyan
            if ($User) { Write-Host "  User: $User" -ForegroundColor Cyan }
            if ($DatabaseName) { Write-Host "  Database: $DatabaseName" -ForegroundColor Cyan }
            if ($Password) { Write-Host "  (Password was present in the URL; it will be used for this run)" -ForegroundColor Yellow }
        }
    } catch {
        # If parsing fails, do nothing and continue to prompt normally
    }
}
if (-not $Port) { $Port = Read-Host 'Postgres port (default 5432)'; if ([string]::IsNullOrWhiteSpace($Port)) { $Port = '5432' } }
if (-not $User) { $User = Read-Host 'Postgres user (e.g. postgres)' }
if (-not $DatabaseName) { $DatabaseName = Read-Host 'Postgres database name' }

# Check psql presence
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    Write-Host "psql not found in PATH. Please install PostgreSQL client or add psql to PATH." -ForegroundColor Yellow
    Write-Host "On Windows you can install Postgres (https://www.postgresql.org/download/windows/) or the psql client." -ForegroundColor Yellow
    Write-Host "You can also run the migration from the Supabase SQL editor if you prefer." -ForegroundColor Cyan
    Pause
    exit 1
}

# Acquire password securely if not provided
if (-not $Password) {
    $secure = Read-Host 'Postgres password (input hidden)' -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $pwd = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR) }
} else {
    # Convert plain password string into $pwd (caller-supplied; be careful - visible in process args)
    $pwd = $Password
}

# Set PGPASSWORD env var for psql (temporary, in-memory)
$env:PGPASSWORD = $pwd

# Build connection string (sslmode=require for Supabase)
$conn = "postgresql://$($User)@$($PgHost):$($Port)/$($DatabaseName)?sslmode=require"

Write-Host "Running migration script: $scriptPath" -ForegroundColor Cyan

# Run migration (stop on error)
$exitCode = 0
try {
    & psql $conn -v ON_ERROR_STOP=1 -f $scriptPath
} catch {
    Write-Host "ERROR: Migration failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    $exitCode = 1
}

if ($exitCode -eq 0) {
    Write-Host "Migration finished. Running verification queries..." -ForegroundColor Green

    # 1) Tipo de la columna status
    & psql $conn -c "SELECT column_name, udt_name, data_type FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'status';"

    # 2) Valores del enum conversation_status (si existe)
    & psql $conn -c "SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'conversation_status' ORDER BY e.enumsortorder;"

    # 3) Ver la vista devoluciones (primeras 10 filas)
    & psql $conn -c "SELECT * FROM devoluciones LIMIT 10;"

    Write-Host "Verification completed." -ForegroundColor Green
}

# Clean up secret
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
$pwd = $null

if ($exitCode -ne 0) { exit $exitCode }
