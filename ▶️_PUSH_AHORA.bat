@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  PUSH CAMBIOS - FIX ARCHIVOS Y AUDIO CRM                 ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo [1/3] Agregando archivos...
git add -A

echo [2/3] Creando commit...
git commit -m "fix: soporte base64 para envio de archivos y audio en CRM"

echo [3/3] Subiendo a GitHub...
git push

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  PUSH COMPLETADO                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo IMPORTANTE: Ahora debes actualizar el gateway en el VPS.
echo.
echo 1. Abre una terminal y conectate al VPS:
echo    ssh root@31.220.58.83
echo.
echo 2. Ejecuta estos comandos:
echo    cd /root/whatsapp-gateway
echo    pm2 stop gateway
echo    nano gateway-updated.js
echo    (pega el contenido del archivo local y guarda)
echo    pm2 start gateway-updated.js --name gateway
echo.
echo 3. Verifica que funcione:
echo    curl http://localhost:3010/health
echo.
pause

