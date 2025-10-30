@echo off
chcp 65001 > nul
cls
echo ========================================
echo   SUBIENDO CAMBIOS FINALES A GITHUB
echo ========================================
echo.

cd /d "C:\Users\USUARIO\WebstormProjects\dashboard"

echo [1/3] Agregando todos los archivos...
git add -A
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudieron agregar archivos
    pause
    exit /b 1
)

echo [2/3] Haciendo commit...
git commit -m "fix: mover campo costo envio entre items y totales + todos los cambios pendientes"
if %ERRORLEVEL% NEQ 0 (
    echo NOTA: No hay cambios para commit o ya se hizo commit
)

echo [3/3] Subiendo a GitHub...
git push origin feature/meta-ads-integration-v2
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudo hacer push
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUBIDA COMPLETADA CON EXITO
echo ========================================
echo.
echo Verifica en GitHub:
echo https://github.com/galleorolaminado18k/dashboard/tree/feature/meta-ads-integration-v2
echo.
pause

