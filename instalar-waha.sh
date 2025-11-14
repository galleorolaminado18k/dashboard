#!/bin/bash
# Instalación de WAHA - Alternativa estable a Baileys

echo "=========================================="
echo "  INSTALACIÓN WAHA (WhatsApp HTTP API)"
echo "  Alternativa estable sin código 405"
echo "=========================================="
echo ""

cd /opt/baileys || exit 1

echo "[1/4] Deteniendo Baileys..."
docker-compose down

echo ""
echo "[2/4] Creando docker-compose.yml con WAHA..."

cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  waha:
    image: devlikeapro/waha
    container_name: waha-api
    restart: unless-stopped
    ports:
      - "3001:3000"
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
echo "[3/4] Actualizando Caddyfile..."

cat > Caddyfile << 'EOF'
wpp.galle18k.com {
  encode zstd gzip
  reverse_proxy waha-api:3000
}
EOF

echo "✅ Caddyfile actualizado"

echo ""
echo "[4/4] Iniciando WAHA..."
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
echo "🔍 Test local:"
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/health)
echo "HTTP Status /api/health: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ ÉXITO - WAHA API funcionando"
    curl -s http://127.0.0.1:3001/api/health
else
    echo "⚠️  Código: $HTTP_CODE"
    echo ""
    echo "Ver logs completos:"
    echo "  docker logs waha-api -f"
fi

echo ""
echo "=========================================="
echo "  RESULTADO"
echo "=========================================="
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ TODO FUNCIONA"
    echo ""
    echo "API disponible:"
    echo "  - Local: http://127.0.0.1:3001"
    echo "  - HTTPS: https://wpp.galle18k.com"
    echo ""
    echo "IMPORTANTE: Actualizar código en Vercel"
    echo "Los endpoints de WAHA son diferentes:"
    echo ""
    echo "  POST /api/sessions/default/start"
    echo "  GET  /api/sessions/default/status"
    echo "  POST /api/sendText"
    echo ""
    echo "Se requiere actualizar el código del dashboard"
else
    echo "❌ Aún no funciona"
    echo ""
    echo "Ver logs en tiempo real:"
    echo "  docker logs waha-api -f"
fi

echo ""

