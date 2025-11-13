#!/bin/bash
# Fix urgente - Cambiar imagen de WPPConnect a la correcta

echo "=========================================="
echo "  FIX URGENTE - IMAGEN CORRECTA"
echo "=========================================="
echo ""

cd /opt/wpp || exit 1

echo "[1/3] Limpiando contenedores y volúmenes..."
docker-compose down -v 2>/dev/null
docker rm -f wppconnect caddy 2>/dev/null

echo ""
echo "[2/3] Creando docker-compose.yml con imagen correcta..."

cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  wppconnect:
    image: orkestral/wppconnect-server:latest
    container_name: wppconnect
    restart: always
    shm_size: "1gb"
    ports:
      - "21465:21465"
    environment:
      - PORT=21465
      - SECRET_KEY=super-secret-wpp-galle-2025
      - TOKEN_SECRET=galle-wpp-token-secure-123
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

echo "✅ docker-compose.yml actualizado con imagen: orkestral/wppconnect-server"

echo ""
echo "[3/3] Iniciando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando 40 segundos a que WPPConnect inicie..."
sleep 40

echo ""
echo "=========================================="
echo "  VERIFICACIÓN"
echo "=========================================="
echo ""

docker ps

echo ""
echo "📋 Logs WPPConnect:"
docker logs wppconnect --tail 20

echo ""
echo "📋 Logs Caddy:"
docker logs caddy --tail 10

echo ""
echo "🔍 Test local:"
sleep 5
curl -I http://127.0.0.1:21465 2>&1 | head -5

echo ""
echo "=========================================="
echo "✅ Si ves los contenedores corriendo"
echo "   espera 2 minutos más y verifica:"
echo ""
echo "   curl http://127.0.0.1:21465"
echo "   curl https://wpp.galle18k.com"
echo "=========================================="

