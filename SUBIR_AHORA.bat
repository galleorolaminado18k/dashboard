@echo off
SETLOCAL EnableDelayedExpansion

:: Ir al directorio del proyecto
cd /d "C:\Users\USUARIO\WebstormProjects\dashboard"

cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║         🚀 SUBIENDO CAMBIOS A GITHUB                  ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo.

:: Verificar si hay cambios
git status --short > temp_status.txt
set /p HAS_CHANGES=<temp_status.txt
del temp_status.txt

if "!HAS_CHANGES!"=="" (
    echo ✅ No hay cambios pendientes
    echo.
    goto END
)

echo 📝 Cambios detectados:
echo ────────────────────────
git status --short
echo.
echo.

:: Paso 1: Git Add
echo [1/4] Agregando archivos...
git add . 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Archivos agregados
) else (
    echo ❌ Error al agregar archivos
    goto ERROR
)
echo.

:: Paso 2: Git Commit
echo [2/4] Creando commit...
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set mytime=%%a:%%b)
git commit -m "auto: Cambios automaticos - !mydate! !mytime!" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Commit creado
) else (
    echo ❌ Error al crear commit
    goto ERROR
)
echo.

:: Paso 3: Git Push
echo [3/4] Subiendo a GitHub...
for /f %%i in ('git branch --show-current') do set BRANCH=%%i
git push origin !BRANCH! 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Push exitoso a rama: !BRANCH!
) else (
    echo ❌ Error al hacer push
    goto ERROR
)
echo.

:: Paso 4: Mostrar último commit
echo [4/4] Ultimo commit:
git log --oneline -1
echo.
echo.

echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║         ✅ CAMBIOS SUBIDOS EXITOSAMENTE               ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo.
goto END

:ERROR
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║         ❌ ERROR AL SUBIR CAMBIOS                     ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Posibles soluciones:
echo 1. Ejecutar como administrador
echo 2. Verificar conexion a Internet
echo 3. Ejecutar: git pull origin !BRANCH!
echo.

:END
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul

