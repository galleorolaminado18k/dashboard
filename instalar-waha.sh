#!/bin/bash
# Instalación de WAHA - Alternativa estable a Baileys

echo "=========================================="
echo "  INSTALACIÓN WAHA (WhatsApp HTTP API)"
echo "  Alternativa estable sin código 405"
echo "=========================================="
echo ""

cd /opt/baileys || exit 1

echo "[1/5] Deteniendo Baileys..."
docker-compose down

echo ""
echo "[2/5] Generando credenciales..."

# Generar credenciales aleatorias
API_KEY=$(openssl rand -hex 16)
DASHBOARD_USER="admin"
DASHBOARD_PASS=$(openssl rand -hex 16)

# Guardar en archivo .env
cat > .env << EOF
WAHA_API_KEY=${API_KEY}
WAHA_DASHBOARD_USERNAME=${DASHBOARD_USER}
WAHA_DASHBOARD_PASSWORD=${DASHBOARD_PASS}
WHATSAPP_SWAGGER_USERNAME=${DASHBOARD_USER}
WHATSAPP_SWAGGER_PASSWORD=${DASHBOARD_PASS}
EOF

echo "✅ Credenciales generadas y guardadas en .env"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 CREDENCIALES IMPORTANTES - COPIAR AHORA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "WAHA_API_KEY=${API_KEY}"
echo "WAHA_DASHBOARD_USERNAME=${DASHBOARD_USER}"
echo "WAHA_DASHBOARD_PASSWORD=${DASHBOARD_PASS}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "[3/5] Creando docker-compose.yml con WAHA..."

cat > docker-compose.yml << 'EOF'
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
    environment:
      - WHATSAPP_HOOK_URL=
      - WHATSAPP_HOOK_EVENTS=*
      - WAHA_PRINT_QR=false
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
EOF

echo "✅ docker-compose.yml actualizado con WAHA"

echo ""
echo "[4/5] Actualizando Caddyfile..."

cat > Caddyfile << 'EOF'
wpp.galle18k.com {
  encode zstd gzip
  reverse_proxy waha-api:3000
}
EOF

echo "✅ Caddyfile actualizado"

echo ""
echo "[5/5] Iniciando WAHA..."
docker-compose up -d

echo ""
echo "⏳ Esperando 60 segundos a que WAHA inicie..."
sleep 60

echo ""
echo "=========================================="
echo "  VERIFICACIÓN"
echo "=========================================="
echo ""

docker ps

echo ""
echo "📋 Logs WAHA (últimas 20 líneas):"
docker logs waha-api --tail 20

echo ""
echo "🔍 Test local con autenticación:"
sleep 5

# Probar endpoint /health (sin autenticación)
HTTP_CODE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health)
echo "HTTP Status /health: $HTTP_CODE_HEALTH"

# Probar endpoint /api/server/version (con autenticación)
HTTP_CODE_API=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Api-Key: ${API_KEY}" http://127.0.0.1:3001/api/server/version)
echo "HTTP Status /api/server/version: $HTTP_CODE_API"

if [ "$HTTP_CODE_HEALTH" = "200" ] || [ "$HTTP_CODE_API" = "200" ]; then
    echo "✅ ÉXITO - WAHA API funcionando"
    echo ""
    echo "Versión de WAHA:"
    curl -s -H "X-Api-Key: ${API_KEY}" http://127.0.0.1:3001/api/server/version 2>/dev/null | head -5
else
    echo "⚠️  Códigos: Health=$HTTP_CODE_HEALTH, API=$HTTP_CODE_API"
    echo ""
    echo "Ver logs completos:"
    echo "  docker logs waha-api -f"
fi

echo ""
echo "=========================================="
echo "  RESULTADO"
echo "=========================================="
echo ""

if [ "$HTTP_CODE_HEALTH" = "200" ] || [ "$HTTP_CODE_API" = "200" ]; then
    echo "✅ TODO FUNCIONA"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 CREDENCIALES - GUARDAR EN VERCEL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "WAHA_API_KEY=${API_KEY}"
    echo "WAHA_DASHBOARD_USERNAME=${DASHBOARD_USER}"
    echo "WAHA_DASHBOARD_PASSWORD=${DASHBOARD_PASS}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "API disponible:"
    echo "  - Local: http://127.0.0.1:3001"
    echo "  - HTTPS: https://wpp.galle18k.com"
    echo ""
    echo "Dashboard WAHA:"
    echo "  - URL: https://wpp.galle18k.com/dashboard"
    echo "  - Usuario: ${DASHBOARD_USER}"
    echo "  - Password: ${DASHBOARD_PASS}"
    echo ""
    echo "IMPORTANTE: Actualizar código en Vercel"
    echo "Los endpoints de WAHA son diferentes:"
    echo ""
    echo "  POST /api/sessions/default/start"
    echo "  GET  /api/sessions/default/status"
    echo "  POST /api/sendText"
    echo ""
    echo "Header requerido en todas las peticiones:"
    echo "  X-Api-Key: ${API_KEY}"
    echo ""
    echo "Archivo .env creado en /opt/baileys/.env"
else
    echo "❌ Aún no funciona"
    echo ""
    echo "Ver logs en tiempo real:"
    echo "  docker logs waha-api -f"
    echo ""
    echo "Credenciales guardadas en: /opt/baileys/.env"
fi

echo ""

