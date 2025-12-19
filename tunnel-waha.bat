@echo off
REM ⚡ SCRIPT AUTOMÁTICO - Iniciar Cloudflare Tunnel para WAHA
REM Ejecutar: .\tunnel-waha.bat

echo.
echo ========================================
echo    CLOUDFLARE TUNNEL - WAHA
echo ========================================
echo.

REM Verificar que WAHA esté corriendo
echo [1/4] Verificando WAHA...
docker ps | findstr waha > nul
if %errorlevel% neq 0 (
    echo ❌ WAHA no está corriendo
    echo.
    echo Iniciando WAHA...
    docker-compose -f docker-compose.waha.yml up -d
    timeout /t 10 /nobreak > nul
)
echo ✅ WAHA está corriendo

REM Verificar health
echo.
echo [2/4] Verificando health...
curl -s http://127.0.0.1:3000/health | findstr "ok" > nul
if %errorlevel% neq 0 (
    echo ❌ WAHA no responde
    echo Por favor verifica manualmente: curl http://127.0.0.1:3000/health
    pause
    exit /b 1
)
echo ✅ WAHA responde OK

REM Verificar cloudflared
echo.
echo [3/4] Verificando cloudflared...
cloudflared --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ cloudflared no está instalado
    echo.
    echo Instala con: winget install --id Cloudflare.cloudflared
    echo O descarga desde: https://github.com/cloudflare/cloudflared/releases/latest
    pause
    exit /b 1
)
echo ✅ cloudflared instalado

REM Iniciar túnel
echo.
echo [4/4] Iniciando túnel HTTPS público...
echo.
echo ========================================
echo  COPIAR LA URL QUE APARECE ABAJO
echo  Ejemplo: https://abc123xyz.trycloudflare.com
echo ========================================
echo.
echo 📋 SIGUIENTE PASO:
echo    1. Copiar la URL del túnel
echo    2. Ir a: https://vercel.com/dashboard
echo    3. Settings → Environment Variables
echo    4. WAHA_BASE_URL = [PEGAR URL]
echo    5. Redeploy
echo.
echo ⚠️  MANTENER ESTA VENTANA ABIERTA
echo.

cloudflared tunnel --url http://127.0.0.1:3000

