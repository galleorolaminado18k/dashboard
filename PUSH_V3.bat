@echo off
echo ========================================
echo EJECUTANDO COMMIT Y PUSH - VERSION v3.0
echo ========================================
echo.

echo [1/3] Agregando archivos...
git add .

echo.
echo [2/3] Haciendo commit...
git commit -m "Add version indicators v3.0-FIXED - Build 2025-11-04 15:25 - Cache busting"

echo.
echo [3/3] Pushing a GitHub...
git push origin feature/meta-ads-integration-v2

echo.
echo ========================================
echo COMPLETADO - Esperando deployment en Vercel
echo ========================================
echo.
echo Espera 3-4 minutos y luego:
echo 1. Abre modo incognito (Ctrl + Shift + N)
echo 2. Ve a: https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app/entregas
echo 3. Busca "v3.0-FIXED" en el titulo
echo.
pause

