# Script para configurar WAHA en VPS desde Windows PowerShell
# Ejecutar: powershell scripts\configure-waha-vps-windows.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR WAHA EN VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "31.220.58.83"

Write-Host "Conectando al VPS y configurando WAHA..." -ForegroundColor Yellow
Write-Host ""

# Comando SSH con heredoc compatible
$commands = @"
mkdir -p /root/waha && cd /root/waha
cat > docker-compose.yml << 'HEREDOC'
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
HEREDOC
docker-compose down 2>/dev/null || true
docker-compose up -d
sleep 5
echo ""
echo "=== LOGS WAHA ==="
docker logs waha --tail 10
echo ""
echo "=== TEST HEALTH ==="
curl -i http://localhost:3000/health
echo ""
echo "=== TEST START ==="
curl -i -X POST http://localhost:3000/api/sessions/default/start
"@

Write-Host "Ejecutando comandos en VPS..." -ForegroundColor Green
Write-Host ""

# Ejecutar via SSH
ssh root@$VPS_IP $commands

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACION COMPLETADA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora verifica con:" -ForegroundColor Yellow
Write-Host "powershell scripts\check-waha-vps.ps1" -ForegroundColor White
Write-Host ""

