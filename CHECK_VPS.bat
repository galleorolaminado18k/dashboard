0
3@echo off
echo ========================================
echo VERIFICANDO GATEWAY EN VPS
echo ========================================
echo.
echo 1. Estado del gateway:
ssh root@31.220.58.83 "curl -s http://localhost:3010/status"
echo.
echo.
echo 2. Ultimos 30 logs:
ssh root@31.220.58.83 "pm2 logs wa-gateway --lines 30 --nostream"
echo.
echo ========================================
pause

