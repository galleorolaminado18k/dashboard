@echo off
echo ============================================
echo SUBIENDO MEJORAS DE FACTURACION A GITHUB
echo ============================================
echo.

cd /d "c:\Users\USUARIO\WebstormProjects\dashboard"

echo [1/4] Agregando archivos modificados...
git add components\create-invoice-dialog.tsx
git add docs\MEJORAS_FACTURACION_BALINES_FECHA.md

echo.
echo [2/4] Verificando cambios...
git status --short

echo.
echo [3/4] Creando commit...
git commit -m "feat: Mejoras en facturacion - BALINES/BALINERIA solo precio mayor - Autocompletado completo de productos - Fecha vencimiento solo para credito - Categoria BALINERIA agregada - Validaciones especificas por categoria"

echo.
echo [4/4] Subiendo a GitHub...
git push origin feature/meta-ads-integration-v2

echo.
echo ============================================
echo  PROCESO COMPLETADO
echo ============================================
echo.
echo Los cambios se han subido a GitHub exitosamente!
echo Vercel detectara el cambio automaticamente.
echo.
pause

