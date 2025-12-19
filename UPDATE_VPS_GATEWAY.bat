@echo off
echo Actualizando Gateway en VPS...
echo.

REM Copiar archivo al VPS
scp C:\Users\USUARIO\WebstormProjects\dashboard\whatsapp-gateway\gateway-updated.js root@31.220.58.83:/root/whatsapp-gateway/index.js

echo.
echo Reiniciando servicio en VPS...
ssh root@31.220.58.83 "cd /root/whatsapp-gateway && pm2 restart all"

echo.
echo ¡Listo! El Gateway ha sido actualizado.
pause

