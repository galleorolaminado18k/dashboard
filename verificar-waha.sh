#!/bin/bash
# Script de verificación rápida para WAHA

echo "=========================================="
echo "  VERIFICACIÓN RÁPIDA DE WAHA"
echo "=========================================="
echo ""

# Cargar API_KEY del archivo .env
if [ -f /opt/baileys/.env ]; then
    export $(grep -v '^#' /opt/baileys/.env | xargs)
    echo "✅ Credenciales cargadas desde /opt/baileys/.env"
else
    echo "❌ No se encontró /opt/baileys/.env"
    exit 1
fi

echo ""
echo "🔍 Probando endpoints..."
echo ""

# 1. Endpoint de salud (sin autenticación)
echo "1. GET /health (sin auth)"
HTTP_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health)
echo "   Status: $HTTP_HEALTH"
if [ "$HTTP_HEALTH" = "200" ]; then
    curl -s http://127.0.0.1:3001/health 2>/dev/null | head -3
fi

echo ""

# 2. Endpoint de versión (con autenticación)
echo "2. GET /api/server/version (con auth)"
HTTP_VERSION=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3001/api/server/version)
echo "   Status: $HTTP_VERSION"
if [ "$HTTP_VERSION" = "200" ]; then
    curl -s -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3001/api/server/version 2>/dev/null
fi

echo ""

# 3. Listar sesiones (con autenticación)
echo "3. GET /api/sessions (con auth)"
HTTP_SESSIONS=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3001/api/sessions)
echo "   Status: $HTTP_SESSIONS"
if [ "$HTTP_SESSIONS" = "200" ]; then
    curl -s -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3001/api/sessions 2>/dev/null
fi

echo ""
echo "=========================================="
echo "  RESUMEN"
echo "=========================================="
echo ""

if [ "$HTTP_HEALTH" = "200" ] && [ "$HTTP_VERSION" = "200" ]; then
    echo "✅ WAHA FUNCIONA CORRECTAMENTE"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 CREDENCIALES PARA VERCEL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "WAHA_API_KEY=$WAHA_API_KEY"
    echo "WAHA_DASHBOARD_USERNAME=$WAHA_DASHBOARD_USERNAME"
    echo "WAHA_DASHBOARD_PASSWORD=$WAHA_DASHBOARD_PASSWORD"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "URLs disponibles:"
    echo "  - API: https://wpp.galle18k.com"
    echo "  - Dashboard: https://wpp.galle18k.com/dashboard"
    echo ""
    echo "Endpoints principales:"
    echo "  POST /api/sessions/default/start"
    echo "  GET  /api/sessions/default/status"
    echo "  POST /api/sendText"
    echo ""
    echo "Todas las peticiones deben incluir:"
    echo "  Header: X-Api-Key: $WAHA_API_KEY"
else
    echo "❌ WAHA NO RESPONDE CORRECTAMENTE"
    echo ""
    echo "Estados:"
    echo "  /health: $HTTP_HEALTH (esperado: 200)"
    echo "  /api/server/version: $HTTP_VERSION (esperado: 200)"
    echo ""
    echo "Ver logs:"
    echo "  docker logs waha-api -f"
fi

echo ""

