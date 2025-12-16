@echo off
echo ========================================
echo Actualizando Gateway en VPS
echo ========================================
echo.
echo Copiando archivo...
scp "C:\Users\USUARIO\WebstormProjects\dashboard\whatsapp-gateway\gateway-updated.js" root@31.220.58.83:/root/whatsapp-gateway/index.js
echo.
echo Reiniciando servicio...
ssh root@31.220.58.83 "cd /root/whatsapp-gateway && pm2 restart all"
echo.
echo ========================================
echo LISTO - Gateway actualizado
echo ========================================
pause

