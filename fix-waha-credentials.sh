#!/bin/bash
# Script para regenerar y forzar credenciales en WAHA

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 FIX: REGENERAR CREDENCIALES WAHA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /opt/baileys || exit 1

echo "[1/5] Deteniendo WAHA..."
docker-compose stop waha

echo ""
echo "[2/5] Generando nuevas credenciales..."

# Generar nuevas credenciales
NEW_API_KEY=$(openssl rand -hex 16)
DASHBOARD_USER="admin"
DASHBOARD_PASS=$(openssl rand -hex 16)

# Guardar en .env
cat > .env << EOF
WAHA_API_KEY=${NEW_API_KEY}
WAHA_DASHBOARD_USERNAME=${DASHBOARD_USER}
WAHA_DASHBOARD_PASSWORD=${DASHBOARD_PASS}
WHATSAPP_SWAGGER_USERNAME=${DASHBOARD_USER}
WHATSAPP_SWAGGER_PASSWORD=${DASHBOARD_PASS}
EOF

echo "✅ Nuevas credenciales generadas"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 COPIAR ESTAS CREDENCIALES AHORA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "WAHA_API_KEY=${NEW_API_KEY}"
echo "WAHA_DASHBOARD_USERNAME=${DASHBOARD_USER}"
echo "WAHA_DASHBOARD_PASSWORD=${DASHBOARD_PASS}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "[3/5] Verificando docker-compose.yml..."

# Asegurar que el docker-compose.yml usa env_file
if ! grep -q "env_file:" docker-compose.yml; then
    echo "⚠️  docker-compose.yml no tiene env_file, actualizando..."

    # Backup
    cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)

    # Actualizar docker-compose.yml
    cat > docker-compose.yml << 'DOCKER_EOF'
version: "3.8"
services:
  waha:
    image: devlikeapro/waha
    container_name: waha-api
    restart: unless-stopped
    ports:
      - "3001:3000"
    env_file:
      - .env
    volumes:
      - ./data:/app/.wwebjs_auth
    networks: [ net ]

  caddy:
    image: caddy:latest
    container_name: caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks: [ net ]
    depends_on:
      - waha

networks:
  net:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
DOCKER_EOF

    echo "✅ docker-compose.yml actualizado"
else
    echo "✅ docker-compose.yml ya tiene env_file"
fi

echo ""
echo "[4/5] Iniciando WAHA con nuevas credenciales..."
docker-compose up -d waha

echo ""
echo "⏳ Esperando 30 segundos a que WAHA inicie..."
sleep 30

echo ""
echo "[5/5] Verificando que WAHA acepta la nueva API Key..."

export $(grep -v '^#' .env | xargs)

echo ""
echo "🧪 Test 1: Health check (sin auth)..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health)
echo "Status: $HEALTH_STATUS"

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Health OK"
else
    echo "⚠️  Health: $HEALTH_STATUS"
fi

echo ""
echo "🧪 Test 2: Server version (con nueva API Key)..."
VERSION_RESPONSE=$(curl -s -w "\n%{http_code}" -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3001/api/server/version)
VERSION_BODY=$(echo "$VERSION_RESPONSE" | head -n -1)
VERSION_STATUS=$(echo "$VERSION_RESPONSE" | tail -n 1)

echo "Status: $VERSION_STATUS"

if [ "$VERSION_STATUS" = "200" ]; then
    echo "✅ API Key funciona correctamente"
    echo "Respuesta: $VERSION_BODY"
else
    echo "❌ API Key no funciona (Status: $VERSION_STATUS)"
    echo "Respuesta: $VERSION_BODY"
fi

echo ""
echo "🧪 Test 3: Start session..."
START_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3001/api/sessions/default/start)
echo "Status: $START_STATUS"

if [ "$START_STATUS" = "200" ] || [ "$START_STATUS" = "201" ] || [ "$START_STATUS" = "409" ]; then
    echo "✅ Start session OK"
else
    echo "❌ Start session failed (Status: $START_STATUS)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESULTADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$VERSION_STATUS" = "200" ] && ([ "$START_STATUS" = "200" ] || [ "$START_STATUS" = "201" ] || [ "$START_STATUS" = "409" ]); then
    echo "✅ WAHA FUNCIONA CORRECTAMENTE"
    echo ""
    echo "🔑 API Key activa:"
    echo "   ${WAHA_API_KEY:0:10}...${WAHA_API_KEY: -4}"
    echo ""
    echo "📝 SIGUIENTE PASO:"
    echo "   1. Copiar la API Key de arriba"
    echo "   2. Agregarla en Vercel"
    echo "   3. Redeploy"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  📋 CREDENCIALES COMPLETAS (copiar)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "WAHA_API_KEY=${WAHA_API_KEY}"
    echo "WAHA_DASHBOARD_USERNAME=${DASHBOARD_USER}"
    echo "WAHA_DASHBOARD_PASSWORD=${DASHBOARD_PASS}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ WAHA NO RESPONDE CORRECTAMENTE"
    echo ""
    echo "Ver logs:"
    echo "  docker logs waha-api -f"
fi

echo ""

