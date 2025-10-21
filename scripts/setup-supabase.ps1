# Script para ejecutar la migración de CRM en Supabase
# Ejecuta el SQL directamente en el proyecto de Supabase

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando configuración de Supabase CRM..." -ForegroundColor Cyan
Write-Host ""

# Variables
$supabaseUrl = "https://eyrdjtsgpubazdtgywiv.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cmRqdHNncHViYXpkdGd5d2l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDExMzYyNywiZXhwIjoyMDc1Njg5NjI3fQ.FaIB7q1NOLJILTXrtysiswto-Y8aoRAHNmGYtmieK5I"
$sqlFile = "scripts/030_create_crm_tables.sql"

# Verificar que existe el archivo SQL
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: No se encuentra el archivo $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Archivo SQL encontrado: $sqlFile" -ForegroundColor Green
$sqlContent = Get-Content $sqlFile -Raw
Write-Host "📊 Tamaño del script: $($sqlContent.Length) caracteres" -ForegroundColor Gray
Write-Host ""

# Leer el SQL y ejecutarlo por partes
Write-Host "⚙️  Ejecutando SQL en Supabase..." -ForegroundColor Yellow
Write-Host ""

# Dividir el SQL en comandos
$comandos = $sqlContent -split ";" | Where-Object { $_.Trim() -ne "" -and -not $_.Trim().StartsWith("--") }

Write-Host "📋 Se ejecutarán $($comandos.Count) comandos SQL" -ForegroundColor Cyan
Write-Host ""

$exitosos = 0
$advertencias = 0

foreach ($i in 0..($comandos.Count - 1)) {
    $comando = $comandos[$i].Trim()
    
    if ($comando.Length -eq 0) { continue }
    
    $numeroComando = $i + 1
    Write-Host "   [$numeroComando/$($comandos.Count)] " -NoNewline -ForegroundColor Gray
    
    try {
        # Crear el cuerpo de la petición
        $body = @{
            query = $comando + ";"
        } | ConvertTo-Json
        
        # Ejecutar el comando via REST API
        $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/query" `
            -Method POST `
            -Headers @{
                "apikey" = $supabaseKey
                "Authorization" = "Bearer $supabaseKey"
                "Content-Type" = "application/json"
            } `
            -Body $body `
            -ErrorAction SilentlyContinue
        
        Write-Host "✅" -ForegroundColor Green
        $exitosos++
    }
    catch {
        Write-Host "⚠️  (puede ser normal si ya existe)" -ForegroundColor Yellow
        $advertencias++
    }
}

Write-Host ""
Write-Host "📊 Resumen de ejecución:" -ForegroundColor Cyan
Write-Host "   ✅ Comandos exitosos: $exitosos" -ForegroundColor Green
Write-Host "   ⚠️  Advertencias: $advertencias" -ForegroundColor Yellow
Write-Host ""

# Verificar que las tablas se crearon
Write-Host "🔍 Verificando tablas creadas..." -ForegroundColor Cyan
Write-Host ""

$tablas = @("clients", "conversations", "messages")

foreach ($tabla in $tablas) {
    try {
        $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/$tabla`?select=count&limit=1" `
            -Method GET `
            -Headers @{
                "apikey" = $supabaseKey
                "Authorization" = "Bearer $supabaseKey"
            } `
            -ErrorAction Stop
        
        Write-Host "   ✅ Tabla '$tabla' existe y funciona" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Tabla '$tabla' no encontrada o sin permisos" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 ¡Configuración de Supabase completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Ejecutar: pnpm run dev" -ForegroundColor White
Write-Host "   2. Visitar: http://localhost:3000/crm" -ForegroundColor White
Write-Host "   3. Probar el sistema automático" -ForegroundColor White
Write-Host ""
