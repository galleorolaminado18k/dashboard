#!/bin/bash
# Prueba directa contra WAHA para validar que la API Key funciona

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔍 PASO 1: PRUEBA DIRECTA A WAHA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cargar API KEY
if [ -f /opt/baileys/.env ]; then
    export $(grep -v '^#' /opt/baileys/.env | xargs)
    echo "✅ API Key cargada: ${WAHA_API_KEY:0:10}...${WAHA_API_KEY: -4}"
else
    echo "❌ No se encontró /opt/baileys/.env"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 1.1: Start Session"
echo "  Debe responder: 200, 201 o 409"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ curl -i https://wpp.galle18k.com/api/sessions/default/start \\"
echo "    -H \"X-Api-Key: \$WAHA_API_KEY\" -X POST"
echo ""

START_RESPONSE=$(curl -s -i https://wpp.galle18k.com/api/sessions/default/start \
  -H "X-Api-Key: $WAHA_API_KEY" \
  -X POST)

START_STATUS=$(echo "$START_RESPONSE" | grep -i "HTTP/" | awk '{print $2}')

echo "$START_RESPONSE"
echo ""

if [ "$START_STATUS" = "200" ] || [ "$START_STATUS" = "201" ] || [ "$START_STATUS" = "409" ]; then
    echo "✅ Start Session: OK (Status $START_STATUS)"
else
    echo "❌ Start Session: FAILED (Status $START_STATUS)"
    echo ""
    echo "🔍 Si es 401:"
    echo "   → La API Key NO es válida"
    echo "   → Verificar: grep WAHA_API_KEY /opt/baileys/.env"
    echo "   → Usar ese MISMO valor en Vercel"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 1.2: Get QR Code"
echo "  Debe responder: 200 + JSON con qrcode"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ curl -s https://wpp.galle18k.com/api/default/auth/qr \\"
echo "    -H \"X-Api-Key: \$WAHA_API_KEY\""
echo ""

QR_RESPONSE=$(curl -s -w "\n%{http_code}" https://wpp.galle18k.com/api/default/auth/qr \
  -H "X-Api-Key: $WAHA_API_KEY")

QR_BODY=$(echo "$QR_RESPONSE" | head -n -1)
QR_STATUS=$(echo "$QR_RESPONSE" | tail -n 1)

if [ "$QR_STATUS" = "200" ]; then
    echo "✅ Get QR: OK (Status $QR_STATUS)"
    if echo "$QR_BODY" | grep -q "qrcode"; then
        echo "✅ QR Code presente en respuesta"
        echo ""
        echo "Primeros 200 caracteres de la respuesta:"
        echo "$QR_BODY" | head -c 200
        echo "..."
    else
        echo "⚠️  Status 200 pero sin qrcode en JSON"
        echo "$QR_BODY"
    fi
else
    echo "❌ Get QR: FAILED (Status $QR_STATUS)"
    echo "$QR_BODY"
fi

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESULTADO PASO 1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$START_STATUS" = "401" ] || [ "$QR_STATUS" = "401" ]; then
    echo "❌ ERROR 401 en pruebas directas"
    echo ""
    echo "La API Key que estás usando NO es válida."
    echo ""
    echo "🔧 SOLUCIÓN:"
    echo "   1. Ver la key correcta:"
    echo "      grep WAHA_API_KEY /opt/baileys/.env"
    echo ""
    echo "   2. Usar ESA MISMA key en Vercel"
    echo "      (debe ser EXACTAMENTE igual)"
    echo ""
    exit 1
fi

if [ "$START_STATUS" = "200" ] || [ "$START_STATUS" = "201" ] || [ "$START_STATUS" = "409" ]; then
    if [ "$QR_STATUS" = "200" ]; then
        echo "✅ TODAS LAS PRUEBAS PASARON"
        echo ""
        echo "La API Key es válida y WAHA responde correctamente."
        echo ""
        echo "Si aún tienes 401 en Vercel, el problema es:"
        echo "  → La env var no está configurada en Vercel"
        echo "  → O el proxy Caddy está bloqueando el header"
        echo ""
        echo "Continuar con PASO 2 (crear endpoint de diagnóstico)"
    fi
fi

echo ""

