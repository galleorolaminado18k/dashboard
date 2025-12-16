@echo off
cd /d C:\Users\USUARIO\WebstormProjects\dashboard
echo Agregando cambios...
git add -A
echo Haciendo commit...
git commit -m "feat-crm-webhook-integration"
echo Subiendo a GitHub...
git push
echo.
echo Listo!
pause

