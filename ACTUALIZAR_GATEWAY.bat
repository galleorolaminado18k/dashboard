@echo off
echo ================================================
echo ACTUALIZANDO GATEWAY CON URL CORRECTA
echo ================================================
echo.
echo La URL del webhook ahora apunta a:
echo https://dashboard-galle-galleaprobaciones-9369s-projects.vercel.app/api/webhook-public
echo.
echo Subiendo archivo...
scp "C:\Users\USUARIO\WebstormProjects\dashboard\whatsapp-gateway\gateway-updated.js" root@31.220.58.83:/root/whatsapp-gateway/index.js
echo.
echo Reiniciando gateway...
ssh root@31.220.58.83 "pm2 restart wa-gateway && pm2 logs wa-gateway --lines 10 --nostream"
echo.
echo ================================================
echo LISTO! Ahora envia un mensaje de WhatsApp para probar
echo ================================================
pause

