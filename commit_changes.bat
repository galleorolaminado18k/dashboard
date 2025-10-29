@echo off
cd /d "c:\Users\USUARIO\WebstormProjects\dashboard"
git add components\create-invoice-dialog.tsx
git add CONFIRMACION_SUBIDA_GITHUB.md
git commit -m "feat: Mejorar UX del dialogo de creacion de productos - Agregar mensaje 'Bienvenido Administrador' al ingresar codigo correcto - Reorganizar campos para mejor visualizacion - Campo de precio mas grande para valores altos (ej: $10.000.000) - Agregar vista previa con calculo de utilidad - Mejorar organizacion visual y espaciado - Campos deshabilitados hasta ingresar codigo correcto"
git log --oneline -1
echo.
echo Cambios listos para push automatico!

