@echo off
REM Script de Auto-Commit para CMD
echo Verificando cambios en el repositorio...

cd /d "%~dp0\.."

REM Verificar si hay cambios
git diff --quiet
if %errorlevel% neq 0 (
    echo Cambios detectados. Subiendo a GitHub...

    REM Agregar todos los cambios
    git add .

    REM Crear commit con timestamp
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)

    git commit -m "Auto-commit: Actualizacion automatica - %mydate% %mytime%"

    REM Push a GitHub (obtiene rama actual)
    for /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD') do set branch=%%i
    git push origin %branch%

    echo Cambios subidos exitosamente a GitHub!
) else (
    echo No hay cambios para subir
)

pause

