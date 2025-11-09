# Script para generar API Key segura para WAHA
# Segun documentacion oficial: https://waha.devlike.pro/docs/how-to/security/

Write-Host "Generando API Key segura para WAHA..." -ForegroundColor Cyan
Write-Host ""

# 1. Generar UUID sin guiones
$uuid = [System.Guid]::NewGuid().ToString("N")
Write-Host "OK API Key generada: $uuid" -ForegroundColor Green
Write-Host ""

# 2. Calcular hash SHA-512
$stringAsStream = [System.IO.MemoryStream]::new()
$writer = [System.IO.StreamWriter]::new($stringAsStream)
$writer.write($uuid)
$writer.Flush()
$stringAsStream.Position = 0

$sha512 = [System.Security.Cryptography.SHA512]::Create()
$hash = $sha512.ComputeHash($stringAsStream)
$hashString = [System.BitConverter]::ToString($hash).Replace('-', '').ToLower()

Write-Host "OK Hash SHA-512 generado" -ForegroundColor Green
Write-Host ""

# 3. Guardar en archivos
$configPath = "waha-config"
if (-not (Test-Path $configPath)) {
    New-Item -ItemType Directory -Path $configPath | Out-Null
}

# Guardar API key (para Vercel)
$uuid | Out-File -FilePath "$configPath/api-key.txt" -NoNewline -Encoding utf8
Write-Host "GUARDADO: API Key en $configPath/api-key.txt" -ForegroundColor Yellow

# Guardar hash (para docker-compose)
"sha512:$hashString" | Out-File -FilePath "$configPath/api-key-hash.txt" -NoNewline -Encoding utf8
Write-Host "GUARDADO: Hash en $configPath/api-key-hash.txt" -ForegroundColor Yellow
Write-Host ""

# 4. Mostrar resumen
Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host "  CONFIGURACION WAHA - GUARDA ESTO DE FORMA SEGURA" -ForegroundColor Magenta
Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "PARA DOCKER-COMPOSE (docker-compose.waha.yml):" -ForegroundColor Cyan
Write-Host "WAHA_API_KEY=sha512:$hashString" -ForegroundColor White
Write-Host ""

Write-Host "PARA VERCEL (Environment Variables):" -ForegroundColor Cyan
Write-Host "WAHA_API_KEY=$uuid" -ForegroundColor White
Write-Host ""

Write-Host "PARA TU .env.local:" -ForegroundColor Cyan
Write-Host "WAHA_API_KEY=$uuid" -ForegroundColor White
Write-Host ""

Write-Host "IMPORTANTE:" -ForegroundColor Red
Write-Host "   - Docker usa el HASH (sha512:...)" -ForegroundColor Yellow
Write-Host "   - Vercel/Cliente usa la KEY en TEXTO" -ForegroundColor Yellow
Write-Host "   - NO subas estos archivos a GitHub" -ForegroundColor Yellow
Write-Host ""

# 5. Crear archivo .env.local
$envContent = @"
# Configuración para Desarrollo Local
# ⚠️ NO SUBIR A GITHUB - Este archivo es privado

# WAHA (WhatsApp HTTP API)
WAHA_BASE_URL=http://127.0.0.1:3000
WAHA_URL=http://127.0.0.1:3000

# API Key (usa la clave en TEXTO, NO el hash)
WAHA_API_KEY=$uuid

# Supabase (ya configuradas)
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8
Write-Host "OK Archivo .env.local actualizado con la API Key" -ForegroundColor Green
Write-Host ""

Write-Host "Proximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Copia el hash SHA-512 al docker-compose.waha.yml" -ForegroundColor White
Write-Host "   2. Inicia WAHA: docker-compose -f docker-compose.waha.yml up -d" -ForegroundColor White
Write-Host "   3. Para Vercel: Configura WAHA_API_KEY con la clave en texto" -ForegroundColor White
Write-Host ""

