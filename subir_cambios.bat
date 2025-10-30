@echo off
cd /d C:\Users\USUARIO\WebstormProjects\dashboard

echo ========================================
echo SUBIENDO CAMBIOS A GITHUB
echo ========================================
echo.

echo [1/3] Agregando archivos...
git add .
echo Archivos agregados
echo.

echo [2/3] Creando commit...
git commit -m "fix: Hacer campo email opcional en facturas - Script 044: Verificar columna client_email - API: Manejar campos opcionales - Frontend: Indicador visual (Opcional)"
echo.

echo [3/3] Subiendo a GitHub...
git push origin feature/meta-ads-integration-v2
echo.

echo ========================================
echo COMPLETADO
echo ========================================
echo.

git log --oneline -1
echo.
pause

