@echo off
echo ================================================
echo   SUBIR SCRIPT 043 A GITHUB
echo ================================================
echo.

cd /d "C:\Users\USUARIO\WebstormProjects\dashboard"

echo [1/5] Agregando archivos...
git add scripts\043_add_invoice_shipping_columns.sql
git add AutoPush.ps1
git add PUSH_CAMBIOS_SCRIPT_043.md
git add push_script_043.bat
echo.

echo [2/5] Verificando estado...
git status --short
echo.

echo [3/5] Creando commit...
git commit -m "feat: Agregar script de migracion 043 para columnas de envio en facturas - Agregar campos de ubicacion (ciudad, barrio) - Agregar campos de envio (guia, transportadora, vendedor) - Agregar campo de evidencia fotografica - Incluir indices para mejorar busquedas"
echo.

echo [4/5] Subiendo a GitHub...
git push origin feature/meta-ads-integration-v2
echo.

echo [5/5] Verificando resultado...
git log --oneline -1
echo.

echo ================================================
echo   PROCESO COMPLETADO
echo ================================================
echo.
pause

