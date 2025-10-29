@echo off
cd /d "c:\Users\USUARIO\WebstormProjects\dashboard"
git add EJECUTAR_ESTE_SQL_AHORA.sql
git commit -m "chore: Actualizar EJECUTAR_ESTE_SQL_AHORA.sql con migracion completa"
git push origin feature/meta-ads-integration-v2
echo.
echo Proceso completado!
pause

