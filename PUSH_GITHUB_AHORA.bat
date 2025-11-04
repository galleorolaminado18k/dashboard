@echo off
cd /d "C:\Users\USUARIO\WebstormProjects\dashboard"
echo ========================================
echo INICIANDO PUSH AUTOMATICO A GITHUB
echo ========================================
echo.

echo [1/4] Agregando archivos...
git add -A
if errorlevel 1 (
    echo ERROR al agregar archivos
    pause
    exit /b 1
)
echo OK - Archivos agregados

echo.
echo [2/4] Haciendo commit...
git commit -m "✅ AUTO-PUSH: Modal facturacion mejorado - SKU, letra pequeña, centrado, sin ESTADO"
if errorlevel 1 (
    echo Sin cambios para hacer commit o commit exitoso
)

echo.
echo [3/4] Verificando rama...
git branch --show-current
echo.

echo [4/4] Haciendo push a GitHub...
git push origin feature/meta-ads-integration-v2
if errorlevel 1 (
    echo ERROR al hacer push
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ PUSH COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo Verifica en: https://github.com/galleorolaminado18k/dashboard
echo.
pause

