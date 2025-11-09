# OPCIÓN 1: Ejecutar directamente desde PowerShell
# Este script crea un archivo temporal y lo ejecuta en el VPS

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR WAHA EN VPS (WINDOWS)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "31.220.58.83"

# Crear archivo temporal con los comandos
$tempScript = @"
#!/bin/bash
cd /root
mkdir -p waha
cd waha

cat > docker-compose.yml << 'ENDOFFILE'
version: '3.8'

services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha
    restart: always
    environment:
      WAHA_HTTP_API_HOST: "0.0.0.0"
      WAHA_LICENSE_ACCEPT: "true"
      WAHA_LOG_LEVEL: "info"
      WAHA_MULTI_DEVICE: "true"
    ports:
      - "3000:3000"
    volumes:
      - ./waha-data:/app/data
ENDOFFILE

echo "docker-compose.yml creado"
docker-compose down 2>/dev/null || true
docker-compose up -d

echo ""
echo "Esperando 5 segundos..."
sleep 5

echo ""
echo "=== LOGS WAHA ==="
docker logs waha --tail 10

echo ""
echo "=== VERIFICANDO HEALTH ==="
curl -i http://localhost:3000/health

echo ""
echo "=== VERIFICANDO START ==="
curl -i -X POST http://localhost:3000/api/sessions/default/start

echo ""
echo "=== VERIFICANDO QR ==="
curl -i http://localhost:3000/api/default/auth/qr
"@

# Guardar script temporal
$tempFile = "$env:TEMP\configure-waha.sh"
$tempScript | Out-File -FilePath $tempFile -Encoding ASCII

Write-Host "1. Subiendo script al VPS..." -ForegroundColor Yellow
scp $tempFile root@${VPS_IP}:/tmp/configure-waha.sh

Write-Host "2. Ejecutando script en VPS..." -ForegroundColor Yellow
ssh root@$VPS_IP "bash /tmp/configure-waha.sh"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Limpiar
Remove-Item $tempFile

Write-Host "Verifica ahora con:" -ForegroundColor Cyan
Write-Host "powershell scripts\check-waha-vps.ps1" -ForegroundColor White
Write-Host ""

