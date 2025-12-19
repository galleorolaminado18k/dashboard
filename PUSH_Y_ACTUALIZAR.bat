@echo off
echo ========================================
echo Subiendo cambios a GitHub...
echo ========================================
cd /d C:\Users\USUARIO\WebstormProjects\dashboard
git add -A
git commit -m "fix: soporte base64 para envio de archivos y audio en CRM"
git push
echo.
echo ========================================
echo LISTO! Ahora actualiza el gateway en el VPS
echo ========================================
echo.
echo Conectate al VPS con:
echo   ssh root@31.220.58.83
echo.
echo Y ejecuta:
echo   cd /root/whatsapp-gateway
echo   pm2 stop gateway
echo   curl -sL "https://raw.githubusercontent.com/galleaprobaciones/dashboard/main/whatsapp-gateway/gateway-updated.js" -o gateway-updated.js
echo   pm2 restart gateway
echo.
pause

