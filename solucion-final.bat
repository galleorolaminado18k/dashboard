@echo off
echo ========================================
echo SOLUCION FINAL - CORRIGIENDO WAHA
echo ========================================
echo.

echo Creando archivo de configuracion corregida...

(
echo version: '3.8'
echo services:
echo   waha:
echo     image: devlikeapro/waha:latest
echo     container_name: waha-production
echo     restart: unless-stopped
echo     ports:
echo       - "3000:3000"
echo     volumes:
echo       - ./data:/app/data
echo     environment:
echo       - WAHA_HTTP_API_HOST=0.0.0.0
echo       - WAHA_LICENSE_ACCEPT=true
echo       - WAHA_LOG_LEVEL=info
echo       - WAHA_MULTI_DEVICE=true
echo       - WAHA_SECURITY_ENABLE=false
) > docker-compose-corrected.yml

echo Archivo creado: docker-compose-corrected.yml
echo.

echo ========================================
echo INSTRUCCION FINAL
echo ========================================
echo.
echo Conecta SSH y ejecuta ESTE comando:
echo.
echo ssh root@31.220.58.83
echo Contraseña: S@ntiago
echo.
echo Luego ejecuta:
echo cd /opt/waha ^&^& docker-compose down ^&^& docker-compose up -d
echo.
echo ========================================
echo.

pause

