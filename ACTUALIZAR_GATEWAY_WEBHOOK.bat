@echo off
echo ========================================
echo ACTUALIZANDO GATEWAY CON WEBHOOK
echo ========================================
echo.

echo [1/3] Subiendo index.js al VPS...
scp whatsapp-gateway/index.js root@31.220.58.83:/root/whatsapp-gateway/index.js

echo.
echo [2/3] Reiniciando el gateway en el VPS...
ssh root@31.220.58.83 "cd /root/whatsapp-gateway && pm2 restart whatsapp-gateway || pm2 start index.js --name whatsapp-gateway"

echo.
echo [3/3] Verificando logs...
ssh root@31.220.58.83 "pm2 logs whatsapp-gateway --lines 20"

echo.
echo ========================================
echo ACTUALIZACION COMPLETADA
echo ========================================
echo.
echo Ahora envia un mensaje de prueba desde tu telefono
echo y verifica que aparezca en el CRM
echo.
pause
