@echo off
REM 🧪 SCRIPT DE VERIFICACIÓN RÁPIDA (Windows)
REM Verifica que WAHA esté funcionando correctamente

echo 🔍 Verificando WAHA...
echo.

REM Detectar URL de WAHA
if defined WAHA_BASE_URL (
  set WAHA_URL=%WAHA_BASE_URL%
) else if defined WAHA_URL (
  set WAHA_URL=%WAHA_URL%
) else (
  set WAHA_URL=http://127.0.0.1:3000
)

echo 📍 URL de WAHA: %WAHA_URL%
echo.

REM Test 1: Health Check
echo ✅ Test 1: Health Check
curl -s "%WAHA_URL%/health"
echo.
echo.

REM Test 2: Iniciar sesión
echo ✅ Test 2: Iniciar Sesión
curl -s -X POST "%WAHA_URL%/api/session/default/start"
echo.
echo.

REM Esperar 3 segundos
timeout /t 3 /nobreak > nul

REM Test 3: Estado de sesión
echo ✅ Test 3: Estado de Sesión
curl -s "%WAHA_URL%/api/session/default/state"
echo.
echo.

REM Test 4: QR Code
echo ✅ Test 4: QR Code disponible
curl -s "%WAHA_URL%/api/session/default/qr" | findstr /C:"qr" > nul
if %errorlevel% == 0 (
  echo ✅ QR disponible
) else (
  echo ⚠️  QR no disponible aún
)
echo.

echo 🎉 Verificación completa!
pause
#!/bin/bash

# 🧪 SCRIPT DE VERIFICACIÓN RÁPIDA
# Verifica que WAHA esté funcionando correctamente

echo "🔍 Verificando WAHA..."
echo ""

# Detectar URL de WAHA
if [ ! -z "$WAHA_BASE_URL" ]; then
  WAHA_URL="$WAHA_BASE_URL"
elif [ ! -z "$WAHA_URL" ]; then
  WAHA_URL="$WAHA_URL"
else
  WAHA_URL="http://127.0.0.1:3000"
fi

echo "📍 URL de WAHA: $WAHA_URL"
echo ""

# Test 1: Health Check
echo "✅ Test 1: Health Check"
curl -s "$WAHA_URL/health" | python -m json.tool || echo "❌ Error: WAHA no responde"
echo ""

# Test 2: Iniciar sesión
echo "✅ Test 2: Iniciar Sesión"
curl -s -X POST "$WAHA_URL/api/session/default/start" | python -m json.tool || echo "❌ Error al iniciar sesión"
echo ""

# Esperar 3 segundos
sleep 3

# Test 3: Estado de sesión
echo "✅ Test 3: Estado de Sesión"
curl -s "$WAHA_URL/api/session/default/state" | python -m json.tool || echo "❌ Error al obtener estado"
echo ""

# Test 4: QR Code (solo muestra si existe)
echo "✅ Test 4: QR Code"
QR_RESPONSE=$(curl -s "$WAHA_URL/api/session/default/qr")
if echo "$QR_RESPONSE" | grep -q "qr"; then
  echo "✅ QR disponible (data:image/png;base64,...)"
else
  echo "⚠️  QR no disponible aún (espera unos segundos)"
fi
echo ""

echo "🎉 Verificación completa!"

