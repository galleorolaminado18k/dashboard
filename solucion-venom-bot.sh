#!/bin/bash
# Solución definitiva - Usar Venom Bot (alternativa probada a WPPConnect)

echo "=========================================="
echo "  SOLUCIÓN: VENOM BOT + API"
echo "  (Alternativa a WPPConnect que SÍ existe)"
echo "=========================================="
echo ""

cd /opt/wpp || exit 1

echo "[1/5] Limpiando todo..."
docker-compose down -v 2>/dev/null
docker rm -f wppconnect caddy venom-api 2>/dev/null
docker network prune -f

echo ""
echo "[2/5] Descargando imagen de Venom Bot..."
docker pull orkestral/venom-bot:latest

echo ""
echo "[3/5] Creando docker-compose.yml con Venom Bot..."

cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  venom-api:
    image: orkestral/venom-bot:latest
    container_name: venom-api
    restart: always
    ports:
      - "21465:21465"
    environment:
      - PORT=21465
      - HOST=0.0.0.0
    volumes:
      - venom_tokens:/app/tokens
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

networks:
  net:
    driver: bridge

volumes:
  venom_tokens:
  caddy_data:
  caddy_config:
EOF

echo "✅ docker-compose.yml creado con Venom Bot"

echo ""
echo "[4/5] Actualizando Caddyfile..."

cat > Caddyfile << 'EOF'
wpp.galle18k.com {
  encode zstd gzip
  reverse_proxy venom-api:21465
}
EOF

echo "✅ Caddyfile actualizado"

echo ""
echo "[5/5] Iniciando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando 30 segundos a que Venom Bot inicie..."
sleep 30

echo ""
echo "=========================================="
echo "  VERIFICACIÓN"
echo "=========================================="
echo ""

docker ps

echo ""
echo "📋 Logs Venom API (últimas 30 líneas):"
docker logs venom-api --tail 30 2>&1

echo ""
echo "📋 Logs Caddy (últimas 10 líneas):"
docker logs caddy --tail 10 2>&1

echo ""
echo "🔍 Test local (puerto 21465):"
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:21465)
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "✅ Venom API está respondiendo"
    curl -v http://127.0.0.1:21465 2>&1 | head -15
else
    echo "⚠️  Venom API no responde aún (código: $HTTP_CODE)"
fi

echo ""
echo "=========================================="
echo "  RESUMEN"
echo "=========================================="
echo ""

if docker ps | grep -q venom-api; then
    echo "✅ Venom API corriendo"
else
    echo "❌ Venom API no está corriendo"
fi

if docker ps | grep -q caddy; then
    echo "✅ Caddy corriendo"
else
    echo "❌ Caddy no está corriendo"
fi

echo ""
echo "=========================================="
echo "  SIGUIENTE PASO"
echo "=========================================="
echo ""

if docker ps | grep -q venom-api && docker ps | grep -q caddy; then
    echo "✅ AMBOS SERVICIOS CORRIENDO"
    echo ""
    echo "Espera 2 minutos más y verifica:"
    echo ""
    echo "1. Test local:"
    echo "   curl http://127.0.0.1:21465"
    echo ""
    echo "2. Test HTTPS (después de 2-3 min):"
    echo "   curl https://wpp.galle18k.com"
    echo ""
    echo "3. Configura Vercel:"
    echo "   WPP_BASE_URL=https://wpp.galle18k.com"
    echo "   WPP_TOKEN=galle-wpp-token-secure-123"
    echo ""
    echo "4. Adapta el código para usar Venom Bot API"
    echo "   (La API es similar a WPPConnect)"
else
    echo "❌ Algunos servicios no iniciaron"
    echo ""
    echo "Ver logs:"
    echo "  docker logs venom-api -f"
    echo "  docker logs caddy -f"
fi

echo ""

