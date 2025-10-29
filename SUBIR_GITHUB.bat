@echo off
echo ================================================
echo   AUTO-PUSH A GITHUB - MEJORAS DE FACTURACION
echo ================================================
echo.

cd /d "%~dp0"

echo [INFO] Ejecutando script PowerShell...
echo.

powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0AutoPush.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo   EXITO: Cambios subidos a GitHub
    echo ================================================
) else (
    echo.
    echo ================================================
    echo   ERROR: Verifica el log anterior
    echo ================================================
)

echo.
pause

