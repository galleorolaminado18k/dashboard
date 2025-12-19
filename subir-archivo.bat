@echo off
setlocal enabledelayedexpansion

echo ========================================
echo SUBIENDO ARCHIVO AL VPS
echo ========================================
echo.

set VPS=31.220.58.83
set USER=root
set PASS=S@ntiago
set FILE=docker-compose-final.yml

echo Archivo: %FILE%
echo Destino: %USER%@%VPS%:/opt/waha/docker-compose.yml
echo.

echo Intentando metodo 1: SCP con sshpass...
where sshpass >nul 2>&1
if %errorlevel% == 0 (
    sshpass -p "%PASS%" scp -o StrictHostKeyChecking=no %FILE% %USER%@%VPS%:/opt/waha/docker-compose.yml
    if %errorlevel% == 0 goto reiniciar
)

echo Intentando metodo 2: PSCP (PuTTY)...
where pscp >nul 2>&1
if %errorlevel% == 0 (
    echo %PASS%| pscp -pw %PASS% -batch %FILE% %USER%@%VPS%:/opt/waha/docker-compose.yml
    if %errorlevel% == 0 goto reiniciar
)

echo.
echo ========================================
echo NO SE PUDO SUBIR AUTOMATICAMENTE
echo ========================================
echo.
echo SUBE EL ARCHIVO MANUALMENTE:
echo.
echo 1. Descarga WinSCP: https://winscp.net/
echo 2. Conecta a %VPS% con usuario root
echo 3. Sube: %FILE%
echo 4. Destino: /opt/waha/docker-compose.yml
echo.
echo O ejecuta estos comandos en SSH:
echo.
echo ssh %USER%@%VPS%
echo cd /opt/waha
echo docker-compose down
echo.
echo Luego pega el contenido del archivo docker-compose-final.yml
echo.
pause
exit /b

:reiniciar
echo.
echo Archivo subido exitosamente!
echo.
echo Reiniciando WAHA...
ssh -o StrictHostKeyChecking=no %USER%@%VPS% "cd /opt/waha && docker-compose down && docker-compose up -d && sleep 30 && curl http://localhost:3000/health"

echo.
echo ========================================
echo VERIFICAR:
echo http://31.220.58.83:3000/health
echo ========================================
pause

