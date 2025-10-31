@echo off
setlocal enabledelayedexpansion

cd /d "C:\Users\USUARIO\WebstormProjects\dashboard"

color 0A
echo.
echo ============================================
echo    SUBIENDO CAMBIOS A GITHUB
echo ============================================
echo.

echo [1/3] Agregando archivos...
git add -A
if %errorlevel% == 0 (
    echo [OK] Archivos agregados
) else (
    echo [ERROR] No se pudieron agregar archivos
    pause
    exit /b 1
)
echo.

echo [2/3] Creando commit...
git commit -m "fix: API ventas Supabase + evidencia fotografica + scripts SQL"
if %errorlevel% == 0 (
    echo [OK] Commit creado
) else (
    echo [INFO] No hay cambios nuevos o commit ya existente
)
echo.

echo [3/3] Subiendo a GitHub...
git push origin feature/meta-ads-integration-v2
if %errorlevel% == 0 (
    echo [OK] Push completado exitosamente!
) else (
    echo [ERROR] Error al hacer push
    pause
    exit /b 1
)
echo.

echo ============================================
echo    PUSH COMPLETADO CON EXITO!
echo ============================================
echo.
echo Los cambios estan en GitHub.
echo Vercel desplegara automaticamente en 2-3 min.
echo.
pause

