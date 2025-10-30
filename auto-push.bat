@echo off
:: Auto Push Git - Ejecutar cada vez que quieras subir cambios
:: Este archivo se puede ejecutar con doble clic

cd /d "%~dp0"

echo.
echo ========================================
echo   AUTO PUSH A GITHUB
echo ========================================
echo.

powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0auto-push.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   CAMBIOS SUBIDOS EXITOSAMENTE
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   ERROR AL SUBIR CAMBIOS
    echo ========================================
)

echo.
echo Presiona cualquier tecla para cerrar...
pause > nul

