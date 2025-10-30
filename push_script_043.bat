@echo off
echo ================================================
echo   SUBIR SCRIPT 043 A GITHUB
echo ================================================
echo.

cd /d "C:\Users\USUARIO\WebstormProjects\dashboard"

echo [1/5] Agregando archivos...
git add scripts\043_add_invoice_shipping_columns.sql
git add scripts\044_fix_client_email_column.sql
git add app\api\invoices\route.ts
git add components\create-invoice-dialog.tsx
git add docs\FIX_EMAIL_OPCIONAL.md
git add AutoPush.ps1
git add PUSH_CAMBIOS_SCRIPT_043.md
git add push_script_043.bat
echo.

echo [2/5] Verificando estado...
git status --short
echo.

echo [3/5] Creando commit...
git commit -m "fix: Hacer campo email opcional en facturas y agregar scripts de migracion - Script 043: Agregar columnas de envio (ciudad, barrio, guia, transportadora, vendedor, evidencia) - Script 044: Verificar y asegurar columna client_email opcional - API: Manejar campos opcionales correctamente (email, nit, telefono, direccion) - Frontend: Indicador visual (Opcional) en campo email - Resolver error de schema cache en Supabase"
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

