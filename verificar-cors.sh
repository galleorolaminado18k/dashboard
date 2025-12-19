#!/bin/bash
# Script para verificar configuración CORS de Evolution API

echo "=========================================="
echo "  VERIFICACIÓN CORS - EVOLUTION API"
echo "=========================================="
echo ""

echo "[1/4] Verificando que Evolution esté corriendo..."
if docker ps | grep -q "evolution"; then
    echo "✅ Evolution está corriendo"
else
    echo "❌ Evolution NO está corriendo"
    echo "   Ejecuta: docker-compose -f ~/docker-compose.evolution.yml up -d"
    exit 1
fi

echo ""
echo "[2/4] Verificando API Key configurada..."
API_KEY=$(docker exec evolution printenv AUTHENTICATION_API_KEY 2>/dev/null)
if [ "$API_KEY" == "Galle_EVO_KEY_123" ]; then
    echo "✅ API Key correcta: $API_KEY"
else
    echo "❌ API Key incorrecta o no configurada: $API_KEY"
fi

echo ""
echo "[3/4] Probando endpoint SIN API Key (debe dar 401/403)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/instance/fetchInstances)
if [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "403" ]; then
    echo "✅ Autenticación funcionando - HTTP $HTTP_CODE"
else
    echo "⚠️  Respuesta inesperada - HTTP $HTTP_CODE"
fi

echo ""
echo "[4/4] Probando endpoint CON API Key y verificando CORS..."
echo ""
echo "=== HEADERS DE RESPUESTA ==="
curl -i -H "Origin: https://vercel.app" \
     -H "apikey: Galle_EVO_KEY_123" \
     http://127.0.0.1:8080/instance/fetchInstances 2>&1 | head -20

echo ""
echo "=========================================="
echo "  VERIFICACIÓN COMPLETADA"
echo "=========================================="
echo ""
echo "Busca estas líneas en la respuesta:"
echo "  ✅ HTTP/1.1 200 OK"
echo "  ✅ access-control-allow-origin: *"
echo "  ✅ access-control-allow-methods: GET,POST,PUT,DELETE"
echo ""
echo "Si NO ves los headers CORS, Evolution necesita reiniciarse con"
echo "la configuración actualizada."
echo ""

