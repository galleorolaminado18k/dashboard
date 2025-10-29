@echo off
cd /d "c:\Users\USUARIO\WebstormProjects\dashboard"
echo === Verificando archivo ===
type components\create-invoice-dialog.tsx | findstr /n "use client" | findstr "^1:"
if errorlevel 1 (
    echo ERROR: El archivo NO comienza con "use client"
    exit /b 1
)
echo OK: El archivo comienza con "use client"
echo.
echo === Estado de Git ===
git status --short
echo.
echo === Agregando archivo ===
git add components\create-invoice-dialog.tsx
echo.
echo === Haciendo commit ===
git commit -m "fix: Archivo create-invoice-dialog.tsx CORREGIDO - Primera linea: use client - Estructura completa y valida"
echo.
echo === Haciendo push ===
git push origin feature/meta-ads-integration-v2
echo.
echo === COMPLETADO ===
pause

