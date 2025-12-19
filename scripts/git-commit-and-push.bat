@echo off
REM Script para commit & push en Windows (cmd.exe)
REM Uso: abrir cmd.exe en la raíz del repo y ejecutar: scripts\git-commit-and-push.bat "mensaje opcional"
setlocal enabledelayedexpansion

:: Obtener mensaje de commit del primer argumento o usar default
if "%~1"=="" (
  set "MSG=chore: cambios automáticos %DATE% %TIME%"
) else (
  set "MSG=%~1"
)

:: Detectar branch actual
for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set BRANCH=%%b
if "%BRANCH%"=="" (
  echo No se pudo determinar la rama actual. Asegurate de estar en la raíz del repo y que git esté instalado.
  exit /b 1
)

necho Rama actual: %BRANCH%

necho Añadiendo cambios...
git add -A

necho Haciendo commit...
git commit -m "%MSG%" || (
  echo No hay cambios para commitear.
  exit /b 0
)

necho Pusheando a origin/%BRANCH%...
git push origin %BRANCH%

necho Hecho.
endlocal

