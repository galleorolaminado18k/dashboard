@echo off
:: Git Watcher - Observador automático de cambios
:: Ejecuta este archivo y déjalo corriendo en segundo plano

cd /d "%~dp0"

echo.
echo ========================================
echo   GIT AUTO-PUSH WATCHER
echo ========================================
echo.
echo Este proceso monitoreara cambios cada 5 minutos
echo y los subira automaticamente a GitHub.
echo.
echo Dejalo corriendo en segundo plano.
echo Presiona Ctrl+C para detener.
echo.
echo ========================================
echo.

powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0git-watcher.ps1"

