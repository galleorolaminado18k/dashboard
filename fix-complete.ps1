#!/usr/bin/env pwsh

Write-Host "🔧 SOLUCIONANDO ERROR 401 DEFINITIVAMENTE..." -ForegroundColor Cyan
Write-Host ""

# Configuración corregida
$dockerComposeContent = @"
version: '3.8'
services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha-production
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - WAHA_HTTP_API_HOST=0.0.0.0
      - WAHA_LICENSE_ACCEPT=true
      - WAHA_LOG_LEVEL=info
      - WAHA_MULTI_DEVICE=true
      - WAHA_SECURITY_ENABLE=false
"@

# Guardar archivo localmente
$dockerComposeContent | Out-File -FilePath "docker-compose.yml" -Encoding ASCII -NoNewline

Write-Host "✅ Archivo docker-compose.yml creado localmente" -ForegroundColor Green
Write-Host ""
Write-Host "📋 AHORA HAZ ESTO:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abre WinSCP o FileZilla" -ForegroundColor White
Write-Host "   - Server: 31.220.58.83" -ForegroundColor Gray
Write-Host "   - User: root" -ForegroundColor Gray
Write-Host "   - Password: S@ntiago" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Navega a: /opt/waha" -ForegroundColor White
Write-Host ""
Write-Host "3. Sube el archivo:" -ForegroundColor White
Write-Host "   $PWD\docker-compose.yml" -ForegroundColor Gray
Write-Host ""
Write-Host "4. En SSH ejecuta:" -ForegroundColor White
Write-Host "   cd /opt/waha" -ForegroundColor Gray
Write-Host "   docker-compose down" -ForegroundColor Gray
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "O EJECUTA TODO EN UNA LINEA SSH:" -ForegroundColor Yellow
Write-Host ""
Write-Host "ssh root@31.220.58.83" -ForegroundColor White
Write-Host "cd /opt/waha && docker-compose down && docker-compose up -d" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Presiona Enter cuando termines"

Write-Host ""
Write-Host "🧪 Verificando..." -ForegroundColor Yellow

# Test
try {
    $response = Invoke-WebRequest -Uri "http://31.220.58.83:3000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.Content -like "*ok*") {
        Write-Host "✅ WAHA FUNCIONANDO CORRECTAMENTE" -ForegroundColor Green
        Write-Host $response.Content -ForegroundColor Green
    } else {
        Write-Host "⚠️  Respuesta: $($response.Content)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error al verificar. Intenta: http://31.220.58.83:3000/health" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SIGUIENTE PASO: CONFIGURAR VERCEL" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Settings → Environment Variables" -ForegroundColor White
Write-Host "3. WAHA_BASE_URL = http://31.220.58.83:3000" -ForegroundColor Green
Write-Host ""

