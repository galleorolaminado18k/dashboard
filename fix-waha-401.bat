@echo off
echo ========================================
echo CORRIGIENDO WAHA - ERROR 401
echo ========================================
echo.

echo Conectando a VPS...
plink -batch -pw "S@ntiago" root@31.220.58.83 "cd /opt/waha && docker-compose down"

echo Subiendo configuracion corregida...
pscp -pw "S@ntiago" docker-compose-fixed.yml root@31.220.58.83:/opt/waha/docker-compose.yml

echo Iniciando WAHA corregido...
plink -batch -pw "S@ntiago" root@31.220.58.83 "cd /opt/waha && docker-compose up -d && sleep 30 && curl http://localhost:3000/health"

echo.
echo ========================================
echo VERIFICAR EN NAVEGADOR:
echo http://31.220.58.83:3000/health
echo ========================================
echo.
pause
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

