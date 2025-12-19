@echo off
REM push_to_vps.bat - Ejecutar desde Windows local para enviar archivos al VPS y ejecutar setup
REM Ajusta las rutas, usuario y host si es necesario

set VPS=root@31.220.58.83
set REMOTE_DIR=/opt/dashboard-gateway

echo Copiando archivos al VPS %VPS%:%REMOTE_DIR% ...
REM Copia Dockerfile, gateway-audio-fix.cjs y server-setup.sh
scp %~dp0\gateway-audio-fix.cjs %VPS%:%REMOTE_DIR%/
scp %~dp0\Dockerfile %VPS%:%REMOTE_DIR%/
scp %~dp0\server-setup.sh %VPS%:%REMOTE_DIR%/
scp %~dp0\pm2-gateway.json %VPS%:%REMOTE_DIR%/

if %ERRORLEVEL% NEQ 0 (
  echo Error copiando archivos. Revisa la conexión SSH.
  pause
  exit /b 1
)

echo Ejecutando script remoto de configuración y despliegue...
ssh %VPS% "bash /opt/dashboard-gateway/server-setup.sh"

if %ERRORLEVEL% NEQ 0 (
  echo Error ejecutando script remoto.
  pause
  exit /b 1
)

echo Operación completada.
pause

