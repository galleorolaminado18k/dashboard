#!/bin/bash
# Fix rápido: Actualizar docker-compose.yml con git

cd /opt/baileys || exit 1

echo "=========================================="
echo "  FIX: Agregando git y build tools"
echo "=========================================="
echo ""

echo "[1/3] Deteniendo contenedores..."
docker-compose down

echo ""
echo "[2/3] Actualizando docker-compose.yml..."

cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  baileys:
    image: node:20-alpine
    container_name: baileys-api
    working_dir: /app
    volumes:
      - ./app:/app
      - ./data:/data
    environment:
      - PORT=3001
      - API_KEY=${API_KEY}
      - SESSION_NAME=default
      - STORE_DIR=/data
      - ORIGIN=*
    command: sh -c "apk add --no-cache git python3 make g++ && npm i && node index.js"
    ports:
      - "3001:3001"
    restart: unless-stopped
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
      - baileys

networks:
  net:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
EOF

echo "✅ docker-compose.yml actualizado"

echo ""
echo "[3/3] Iniciando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando 90 segundos a que instale git + dependencias..."
sleep 90

echo ""
echo "=========================================="
echo "  VERIFICACIÓN"
echo "=========================================="
echo ""

docker ps

echo ""
echo "📋 Logs Baileys (últimas 30 líneas):"
docker logs baileys-api --tail 30

echo ""
echo "🔍 Test local:"
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health)
echo "HTTP Status /health: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ ÉXITO - Baileys API funcionando"
    curl -s http://127.0.0.1:3001/health
else
    echo "⚠️  Código: $HTTP_CODE"
    echo ""
    echo "Si aún falla, ver logs completos:"
    echo "  docker logs baileys-api -f"
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
    echo "Configura Vercel:"
    echo "  BAILEYS_BASE_URL=https://wpp.galle18k.com"
    echo "  BAILEYS_API_KEY=galle-baileys-secret-key-2025"
    echo ""
    echo "Luego haz Redeploy y prueba en /configuracion"
else
    echo "❌ Aún no funciona"
    echo ""
    echo "Ver logs en tiempo real:"
    echo "  docker logs baileys-api -f"
fi

echo ""

