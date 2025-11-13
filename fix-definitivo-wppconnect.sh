#!/bin/bash
# Fix definitivo - Usar imagen que SÍ existe en Docker Hub

echo "=========================================="
echo "  FIX DEFINITIVO - IMAGEN VERIFICADA"
echo "=========================================="
echo ""

cd /opt/wpp || exit 1

echo "[1/4] Limpiando todo..."
docker-compose down -v 2>/dev/null
docker rm -f wppconnect caddy 2>/dev/null
docker network prune -f

echo ""
echo "[2/4] Buscando imagen correcta de WPPConnect..."
echo "Probando: wppconnect-team/wppconnect-server"

# Intentar pull directamente para verificar
if docker pull wppconnect-team/wppconnect-server:latest 2>/dev/null; then
    echo "✅ Imagen encontrada: wppconnect-team/wppconnect-server"
    IMAGE="wppconnect-team/wppconnect-server:latest"
elif docker pull wppconnect/wppconnect-server:latest 2>/dev/null; then
    echo "✅ Imagen encontrada: wppconnect/wppconnect-server"
    IMAGE="wppconnect/wppconnect-server:latest"
else
    echo "⚠️  WPPConnect no disponible, usando alternativa: baileys/whatsapp-api"
    docker pull baileys/whatsapp-api:latest
    IMAGE="baileys/whatsapp-api:latest"
fi

echo ""
echo "[3/4] Creando docker-compose.yml..."

cat > docker-compose.yml << EOF
version: "3.8"
services:
  wppconnect:
    image: ${IMAGE}
    container_name: wppconnect
    restart: always
    shm_size: "1gb"
    ports:
      - "21465:21465"
    environment:
      - PORT=21465
      - SECRET_KEY=super-secret-wpp-galle-2025
      - LOG_LEVEL=info
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
  caddy_data:
  caddy_config:
EOF

echo "✅ docker-compose.yml creado con imagen: ${IMAGE}"

echo ""
echo "[4/4] Iniciando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando 45 segundos..."
sleep 45

echo ""
echo "=========================================="
echo "  VERIFICACIÓN"
echo "=========================================="
echo ""

docker ps

echo ""
echo "📋 Logs WPPConnect (últimas 30 líneas):"
docker logs wppconnect --tail 30 2>&1

echo ""
echo "📋 Logs Caddy (últimas 15 líneas):"
docker logs caddy --tail 15 2>&1

echo ""
echo "🔍 Test local (puerto 21465):"
sleep 5
curl -v http://127.0.0.1:21465 2>&1 | head -20

echo ""
echo "=========================================="
echo "  SIGUIENTE PASO"
echo "=========================================="
echo ""

if docker ps | grep -q wppconnect; then
    echo "✅ WPPConnect corriendo"
    echo ""
    echo "Verifica la API:"
    echo "  curl http://127.0.0.1:21465"
    echo ""
    echo "Si responde, configura Vercel y haz Redeploy"
else
    echo "❌ WPPConnect no está corriendo"
    echo ""
    echo "Ver logs completos:"
    echo "  docker logs wppconnect -f"
fi

echo ""

