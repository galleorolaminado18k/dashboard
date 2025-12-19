#!/bin/bash
# Script de verificación de WAHA en VPS

echo "=========================================="
echo "  VERIFICACIÓN WAHA - VPS"
echo "=========================================="
echo ""

# Obtener última API key de los logs
API_KEY=$(docker logs waha 2>&1 | grep "WAHA_API_KEY=" | tail -1 | sed 's/WAHA_API_KEY=//')

if [ -z "$API_KEY" ]; then
  echo "❌ No se pudo obtener API key de los logs"
  echo "Ejecuta: docker logs waha | grep WAHA_API_KEY"
  exit 1
fi

echo "✅ API Key encontrada: $API_KEY"
echo ""

echo "1️⃣ Test: /health CON API Key"
curl -i -H "X-Api-Key: $API_KEY" http://localhost:3000/health 2>&1 | head -15
echo ""

echo "2️⃣ Test: /health SIN API Key"
curl -i http://localhost:3000/health 2>&1 | head -15
echo ""

echo "3️⃣ Test: POST /api/sessions/default/start CON API Key"
curl -i -H "X-Api-Key: $API_KEY" -X POST http://localhost:3000/api/sessions/default/start 2>&1 | head -15
echo ""

echo "4️⃣ Test: GET /api/default/auth/qr CON API Key"
curl -i -H "X-Api-Key: $API_KEY" http://localhost:3000/api/default/auth/qr 2>&1 | head -15
echo ""

echo "=========================================="
echo "  RESUMEN"
echo "=========================================="
echo "Si ves 200 OK en todos: ✅ WAHA funcionando"
echo "Si ves 401 sin API key: ✅ Autenticación activa"
echo "Si ves 401 con API key: ❌ API key incorrecta"
echo "Si ves 422: ❌ Feature no disponible en CORE"
echo ""
echo "API Key actual: $API_KEY"
echo "Configurar en Vercel:"
echo "  WAHA_BASE_URL=http://31.220.58.83:3000"
echo "  WAHA_API_KEY=$API_KEY"

