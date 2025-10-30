@echo off
cd /d C:\Users\USUARIO\WebstormProjects\dashboard

echo Agregando archivos...
git add -A

echo Creando commit...
git commit -m "fix: API ventas conectado a Supabase - Evidencia fotografica visible - Facturas aparecen automaticamente"

echo Haciendo push...
git push origin feature/meta-ads-integration-v2

echo.
echo ========================================
echo PUSH COMPLETADO
echo ========================================
pause

