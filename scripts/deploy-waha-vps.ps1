# Script para configurar WAHA en VPS - VERSIÓN CORREGIDA
# Basado en logs reales de WAHA

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR WAHA EN VPS (CORREGIDO)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "31.220.58.83"

Write-Host "CAMBIOS IMPORTANTES:" -ForegroundColor Yellow
Write-Host "1. WAHA_HTTP_API_HOST=0.0.0.0 (no ::1)" -ForegroundColor White
Write-Host "2. Sin WAHA_API_KEY (no funciona en CORE/WEBJS)" -ForegroundColor White
Write-Host "3. Proteger con firewall en su lugar" -ForegroundColor White
Write-Host ""

Write-Host "Creando docker-compose.yml corregido..." -ForegroundColor Green
Write-Host ""

$dockerCompose = @"
version: '3.8'

services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha
    restart: always
    environment:
      # CRITICAL: Escuchar en 0.0.0.0 (no en [::1])
      WAHA_HTTP_API_HOST: "0.0.0.0"
      WAHA_LICENSE_ACCEPT: "true"
      WAHA_LOG_LEVEL: "info"
      WAHA_MULTI_DEVICE: "true"

      # NO USAR API KEY - WAHA CORE/WEBJS devuelve 422
      # Solo funciona en WAHA Plus
      # Proteger con firewall en su lugar

    ports:
      - "3000:3000"
    volumes:
      - ./waha-data:/app/data
"@

Write-Host "Contenido del docker-compose.yml:" -ForegroundColor Cyan
Write-Host $dockerCompose -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMANDOS PARA EJECUTAR EN VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "# 1. Conectar al VPS" -ForegroundColor Yellow
Write-Host "ssh root@$VPS_IP" -ForegroundColor White
Write-Host ""

Write-Host "# 2. Crear directorio y archivo" -ForegroundColor Yellow
Write-Host "mkdir -p /root/waha && cd /root/waha" -ForegroundColor White
Write-Host "cat > docker-compose.yml << 'EOF'" -ForegroundColor White
Write-Host $dockerCompose -ForegroundColor Gray
Write-Host "EOF" -ForegroundColor White
Write-Host ""

Write-Host "# 3. Reiniciar WAHA" -ForegroundColor Yellow
Write-Host "docker-compose down" -ForegroundColor White
Write-Host "docker-compose up -d" -ForegroundColor White
Write-Host ""

Write-Host "# 4. Ver logs (IMPORTANTE: Debe decir 0.0.0.0:3000, NO [::1]:3000)" -ForegroundColor Yellow
Write-Host "docker logs waha" -ForegroundColor White
Write-Host ""

Write-Host "# Resultado esperado en logs:" -ForegroundColor Green
Write-Host "WAHA HTTP API listening on http://0.0.0.0:3000" -ForegroundColor White
Write-Host ""

Write-Host "# 5. Probar sin API Key" -ForegroundColor Yellow
Write-Host "curl -i http://localhost:3000/health" -ForegroundColor White
Write-Host "# Debe dar: 200 OK" -ForegroundColor Green
Write-Host ""

Write-Host "curl -i -X POST http://localhost:3000/api/sessions/default/start" -ForegroundColor White
Write-Host "# Debe dar: 200 OK o 409 (si ya existe)" -ForegroundColor Green
Write-Host ""

Write-Host "curl -i http://localhost:3000/api/default/auth/qr" -ForegroundColor White
Write-Host "# Debe dar: 200 OK con JSON del QR" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ENDPOINTS CORRECTOS (SEGUN LOGS)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "START:   POST /api/sessions/default/start" -ForegroundColor White
Write-Host "QR:      GET  /api/default/auth/qr" -ForegroundColor White
Write-Host "SESSION: GET  /api/sessions/default" -ForegroundColor White
Write-Host "HEALTH:  GET  /health" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIREWALL (PROTECCION)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Permitir solo desde IPs especificas" -ForegroundColor Yellow
Write-Host "ufw allow from TU_IP to any port 3000" -ForegroundColor White
Write-Host "ufw allow from VERCEL_IP to any port 3000" -ForegroundColor White
Write-Host ""

Write-Host "Presiona Enter para continuar..." -ForegroundColor Yellow
Read-Host

