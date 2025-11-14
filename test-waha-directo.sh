#!/bin/bash
# Script de pruebas directas para WAHA
# Ejecutar en el VPS para verificar todos los endpoints

echo "=========================================="
echo "  PRUEBAS DIRECTAS WAHA"
echo "=========================================="
echo ""

# Cargar credenciales
if [ -f /opt/baileys/.env ]; then
    export $(grep -v '^#' /opt/baileys/.env | xargs)
    echo "✅ Credenciales cargadas"
else
    echo "❌ No se encontró /opt/baileys/.env"
    exit 1
fi

echo ""
echo "🔑 API Key: ${WAHA_API_KEY:0:10}..."
echo ""

# Test 1: Health (sin auth)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Health Check (sin autenticación)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ curl -i https://wpp.galle18k.com/health"
echo ""
curl -i https://wpp.galle18k.com/health
echo ""
echo ""

# Test 2: Version (con auth)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Server Version (con autenticación)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ curl -i -H \"X-Api-Key: \$WAHA_API_KEY\" https://wpp.galle18k.com/api/server/version"
echo ""
curl -i -H "X-Api-Key: $WAHA_API_KEY" https://wpp.galle18k.com/api/server/version
echo ""
echo ""

# Test 3: Start session
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Start Session (válidos: 200/201/409)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ curl -i -X POST -H \"X-Api-Key: \$WAHA_API_KEY\" https://wpp.galle18k.com/api/sessions/default/start"
echo ""
curl -i -X POST -H "X-Api-Key: $WAHA_API_KEY" https://wpp.galle18k.com/api/sessions/default/start
echo ""
echo ""

# Test 4: Session status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Session Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ curl -i -H \"X-Api-Key: \$WAHA_API_KEY\" https://wpp.galle18k.com/api/sessions/default/status"
echo ""
curl -i -H "X-Api-Key: $WAHA_API_KEY" https://wpp.galle18k.com/api/sessions/default/status
echo ""
echo ""

# Test 5: Get QR
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Get QR Code"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ curl -s -H \"X-Api-Key: \$WAHA_API_KEY\" https://wpp.galle18k.com/api/default/auth/qr"
echo ""
QR_RESPONSE=$(curl -s -H "X-Api-Key: $WAHA_API_KEY" https://wpp.galle18k.com/api/default/auth/qr)

# Check si hay qrcode
if echo "$QR_RESPONSE" | grep -q "qrcode"; then
    echo "✅ QR Code recibido (primeros 200 caracteres):"
    echo "$QR_RESPONSE" | head -c 200
    echo "..."
else
    echo "❌ No se recibió QR Code"
    echo "Respuesta completa:"
    echo "$QR_RESPONSE"
fi

echo ""
echo ""

# Test 6: List sessions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: List All Sessions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ curl -s -H \"X-Api-Key: \$WAHA_API_KEY\" https://wpp.galle18k.com/api/sessions"
echo ""
curl -s -H "X-Api-Key: $WAHA_API_KEY" https://wpp.galle18k.com/api/sessions | head -50
echo ""
echo ""

# Resumen
echo "=========================================="
echo "  RESUMEN"
echo "=========================================="
echo ""
echo "Si todos los tests responden correctamente:"
echo "  ✅ Test 1 (Health): 200 OK"
echo "  ✅ Test 2 (Version): 200 OK + JSON con versión"
echo "  ✅ Test 3 (Start): 200/201/409 (todos válidos)"
echo "  ✅ Test 4 (Status): 200 OK + JSON con estado"
echo "  ✅ Test 5 (QR): 200 OK + JSON con qrcode"
echo "  ✅ Test 6 (Sessions): 200 OK + Array de sesiones"
echo ""
echo "Si algún test falla:"
echo "  • 401 → API Key incorrecta"
echo "  • 404 → Endpoint incorrecto o Caddy no configurado"
echo "  • 503 → WAHA no está corriendo o Caddy no llega al contenedor"
echo "  • Timeout → Firewall o problema de red"
echo ""

