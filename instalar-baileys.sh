#!/bin/bash
# Instalación Baileys WhatsApp API en VPS

echo "=========================================="
echo "  BAILEYS WHATSAPP API - INSTALACIÓN"
echo "  Solución definitiva con whiskeysockets"
echo "=========================================="
echo ""

# Limpiar todo anterior
echo "[1/6] Limpiando instalaciones previas..."
cd ~
docker-compose down -v 2>/dev/null
docker rm -f $(docker ps -aq) 2>/dev/null
docker network prune -f
docker volume prune -f
rm -rf /opt/wpp

echo "✅ Limpieza completada"
echo ""

# Crear estructura
echo "[2/6] Creando estructura en /opt/baileys..."
mkdir -p /opt/baileys/app
mkdir -p /opt/baileys/data
cd /opt/baileys

echo "✅ Estructura creada"
echo ""

# Crear .env
echo "[3/6] Creando .env..."
cat > .env << 'EOF'
API_KEY=galle-baileys-secret-key-2025
EOF

echo "✅ .env creado"
echo ""

# Crear docker-compose.yml
echo "[4/6] Creando docker-compose.yml..."
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
    command: sh -c "npm i && node index.js"
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

echo "✅ docker-compose.yml creado"
echo ""

# Crear package.json
echo "[5/6] Creando package.json y index.js..."
cat > app/package.json << 'EOF'
{
  "name": "baileys-api",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "qrcode": "^1.5.3",
    "@hapi/boom": "^10.0.1",
    "@whiskeysockets/baileys": "^6.5.0"
  }
}
EOF

# Crear index.js
curl -o app/index.js https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/vps-baileys/app/index.js

# Crear Caddyfile
cat > Caddyfile << 'EOF'
wpp.galle18k.com {
  encode zstd gzip
  reverse_proxy baileys:3001
}
EOF

echo "✅ Archivos creados"
echo ""

# Iniciar servicios
echo "[6/6] Iniciando servicios (esto tomará 2-3 minutos)..."
docker-compose up -d

echo ""
echo "⏳ Esperando 60 segundos a que npm instale dependencias..."
sleep 60

echo ""
echo "=========================================="
echo "  VERIFICACIÓN"
echo "=========================================="
echo ""

docker ps

echo ""
echo "📋 Logs Baileys (últimas 20 líneas):"
docker logs baileys-api --tail 20 2>&1

echo ""
echo "📋 Logs Caddy (últimas 10 líneas):"
docker logs caddy --tail 10 2>&1

echo ""
echo "🔍 Test local puerto 3001:"
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health)
echo "HTTP Status /health: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Baileys API está funcionando"
    curl -s http://127.0.0.1:3001/health
else
    echo "⚠️  Baileys API responde con código: $HTTP_CODE"
    echo ""
    echo "Ver logs completos:"
    echo "  docker logs baileys-api -f"
fi

echo ""
echo "=========================================="
echo "  RESUMEN"
echo "=========================================="
echo ""

BAILEYS_RUNNING=$(docker ps | grep baileys-api | wc -l)
CADDY_RUNNING=$(docker ps | grep caddy | wc -l)

if [ $BAILEYS_RUNNING -eq 1 ]; then
    echo "✅ Baileys API corriendo"
else
    echo "❌ Baileys API no está corriendo"
fi

if [ $CADDY_RUNNING -eq 1 ]; then
    echo "✅ Caddy corriendo"
else
    echo "❌ Caddy no está corriendo"
fi

echo ""
echo "=========================================="
echo "  SIGUIENTE PASO"
echo "=========================================="
echo ""

if [ $BAILEYS_RUNNING -eq 1 ] && [ $CADDY_RUNNING -eq 1 ]; then
    echo "✅ ÉXITO - SERVICIOS CORRIENDO"
    echo ""
    echo "API disponible en:"
    echo "  - Local: http://127.0.0.1:3001"
    echo "  - HTTPS: https://wpp.galle18k.com (espera 2 min para SSL)"
    echo ""
    echo "Configuración Vercel:"
    echo "  BAILEYS_BASE_URL=https://wpp.galle18k.com"
    echo "  BAILEYS_API_KEY=galle-baileys-secret-key-2025"
    echo ""
    echo "Endpoints:"
    echo "  GET  /health - Verificar estado"
    echo "  POST /start - Iniciar sesión (genera QR)"
    echo "  GET  /qr - Obtener QR code"
    echo "  POST /sendText - Enviar mensaje"
    echo ""
    echo "Prueba ahora:"
    echo "  curl http://127.0.0.1:3001/health"
    echo "  curl -X POST -H 'x-api-key: galle-baileys-secret-key-2025' http://127.0.0.1:3001/start"
    echo "  curl http://127.0.0.1:3001/qr"
else
    echo "❌ Algunos servicios no iniciaron"
    echo ""
    echo "Ver logs:"
    echo "  docker logs baileys-api -f"
    echo "  docker logs caddy -f"
fi

echo ""

