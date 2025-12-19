#!/bin/bash
# Script de pruebas rápidas para verificar WAHA

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🧪 PRUEBAS WAHA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cargar API KEY
if [ -f /opt/baileys/.env ]; then
    export $(grep -v '^#' /opt/baileys/.env | xargs)
    echo "✅ API Key cargada: ${WAHA_API_KEY:0:10}..."
else
    echo "❌ No se encontró /opt/baileys/.env"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 1: Start Session (debe dar 200/201/409)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ curl -i https://wpp.galle18k.com/api/sessions/default/start \\"
echo "    -H \"X-Api-Key: \$WAHA_API_KEY\" -X POST"
echo ""

curl -i https://wpp.galle18k.com/api/sessions/default/start \
  -H "X-Api-Key: $WAHA_API_KEY" \
  -X POST

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TEST 2: Get QR Code (debe dar 200 + qrcode)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ curl -s https://wpp.galle18k.com/api/default/auth/qr \\"
echo "    -H \"X-Api-Key: \$WAHA_API_KEY\""
echo ""

QR_RESPONSE=$(curl -s https://wpp.galle18k.com/api/default/auth/qr \
  -H "X-Api-Key: $WAHA_API_KEY")

if echo "$QR_RESPONSE" | grep -q "qrcode"; then
    echo "✅ QR Code recibido"
    echo "$QR_RESPONSE" | head -c 200
    echo "..."
else
    echo "❌ No se recibió QR Code"
    echo "$QR_RESPONSE"
fi

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Si Test 1 da 401:"
echo "  → El header X-Api-Key no llega a WAHA"
echo "  → Revisar configuración de Caddy (Paso 4)"
echo ""
echo "Si Test 1 da 200/201/409 pero Test 2 da 401:"
echo "  → El endpoint de QR requiere el header también"
echo "  → Asegurar que Caddy reenvía todos los headers"
echo ""
echo "Si ambos dan 200:"
echo "  ✅ WAHA está configurado correctamente"
echo "  ✅ Ahora Vercel también debe funcionar"
echo ""

