@echo off
echo ========================================
echo INSTALANDO WAHA EN VPS
echo ========================================
echo.

REM Crear script de instalacion en el VPS
echo Creando script de instalacion en VPS...

plink -batch -pw "S@ntiago" root@31.220.58.83 "cat > /tmp/install-waha.sh" < install-waha-vps-fixed.sh

echo Script creado. Ejecutando instalacion...

plink -batch -pw "S@ntiago" root@31.220.58.83 "chmod +x /tmp/install-waha.sh && /tmp/install-waha.sh"

echo.
echo ========================================
echo INSTALACION COMPLETADA
echo ========================================
echo.
echo URL de WAHA: http://31.220.58.83:3000
echo.
echo Configurar en Vercel:
echo WAHA_BASE_URL = http://31.220.58.83:3000
echo.
pause

