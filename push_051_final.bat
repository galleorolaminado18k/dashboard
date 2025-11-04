@echo off
cd /d C:\Users\USUARIO\WebstormProjects\dashboard

echo Agregando archivos...
git add .

echo.
echo Creando commit...
git commit -m "✅ Script 051 final sin errores - Push automatico"

echo.
echo Subiendo a GitHub...
git push origin main

echo.
echo COMPLETADO
pause

