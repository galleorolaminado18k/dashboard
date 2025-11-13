#!/bin/bash
# Script de instalación de WPPConnect en VPS
# Ejecutar como root en: 31.220.58.83

set -e

echo "=================================================="
echo "  INSTALACIÓN WPPCONNECT - GALLE DASHBOARD"
echo "=================================================="
echo ""

# 1. Actualizar sistema e instalar Docker
echo "[1/7] Instalando Docker y Docker Compose..."
apt-get update -qq
apt-get install -y docker.io docker-compose-plugin curl

# Iniciar Docker
systemctl enable docker
systemctl start docker

echo "✅ Docker instalado"
echo ""

# 2. Detener Evolution/WAHA si existe
echo "[2/7] Limpiando contenedores previos (Evolution/WAHA)..."
docker ps --format '{{.Names}}' | grep -E 'evolution|waha' | xargs -r docker rm -f || true
docker-compose -f ~/docker-compose.evolution.yml down 2>/dev/null || true
docker volume prune -f

echo "✅ Contenedores previos eliminados"
echo ""

# 3. Crear directorio de trabajo
echo "[3/7] Creando directorio /opt/wpp..."
mkdir -p /opt/wpp
cd /opt/wpp

# 4. Crear docker-compose.yml
echo "[4/7] Creando docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  wppconnect:
    image: wppconnect/server:latest
    container_name: wppconnect
    restart: always
    shm_size: "1gb"
    environment:
      - SERVER_PORT=21465
      - ENABLE_PUBLIC_API=true
      - SECRET_KEY=${WPP_SECRET}
      - TOKEN=${WPP_TOKEN}
      - LOG_LEVEL=info
      - WEBHOOK_ENABLED=true
      - WEBHOOK_BASEURL=${WPP_WEBHOOK_BASEURL}
      - WEBHOOK_PATH=/wpp/webhook
      - WEBHOOK_SECRET=${WPP_WEBHOOK_SECRET}
      - AUTO_START=false
      - START_ALL_SESSIONS=false
      - MAX_CONCURRENT_SESSIONS=3
      - CHROME_ARGS=--no-sandbox,--disable-dev-shm-usage
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

echo "✅ docker-compose.yml creado"
echo ""

# 5. Crear .env
echo "[5/7] Creando .env..."
cat > .env << 'EOF'
WPP_SECRET=super-secret-wpp-galle-2025
WPP_TOKEN=galle-wpp-token-secure-123
WPP_WEBHOOK_BASEURL=https://wpp.tudominio.com
WPP_WEBHOOK_SECRET=wpp-webhook-secret-galle
EOF

echo "✅ .env creado"
echo ""

# 6. Crear Caddyfile (NOTA: El usuario debe reemplazar "tudominio.com")
echo "[6/7] Creando Caddyfile..."
cat > Caddyfile << 'EOF'
wpp.tudominio.com {
  encode zstd gzip
  reverse_proxy wppconnect:21465

  # Headers para debugging
  header {
    X-Powered-By "WPPConnect via Caddy"
  }

  # Logs
  log {
    output file /var/log/caddy/wpp-access.log
  }
}
EOF

echo "✅ Caddyfile creado"
echo ""
echo "⚠️  IMPORTANTE: Edita el Caddyfile y reemplaza 'tudominio.com' con tu dominio real"
echo "   Ejemplo: wpp.miempresa.com"
echo ""

# 7. Levantar servicios
echo "[7/7] Levantando servicios..."
docker compose up -d

echo ""
echo "⏳ Esperando 30 segundos a que WPPConnect inicie..."
sleep 30

echo ""
echo "=================================================="
echo "  VERIFICACIÓN"
echo "=================================================="
echo ""

# Verificar contenedores
echo "✅ Contenedores corriendo:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Variables de entorno configuradas:"
docker exec wppconnect printenv | grep WPP_ || echo "  (usando .env)"

echo ""
echo "=================================================="
echo "  PRUEBAS"
echo "=================================================="
echo ""

# Test local
echo "📡 Test local (Swagger):"
curl -s http://localhost:21465/api-docs | head -n 5

echo ""
echo "📡 Test local (Sesiones):"
curl -s -H "Authorization: Bearer galle-wpp-token-secure-123" http://localhost:21465/api/sessions

echo ""
echo "=================================================="
echo "  SIGUIENTE PASO"
echo "=================================================="
echo ""
echo "1. Configura tu dominio wpp.tudominio.com con:"
echo "   - A record → 31.220.58.83"
echo "   - Cloudflare Proxy ON (naranja)"
echo "   - SSL/TLS → Full"
echo ""
echo "2. Edita /opt/wpp/Caddyfile con tu dominio real"
echo ""
echo "3. Reinicia Caddy:"
echo "   docker restart caddy"
echo ""
echo "4. Prueba HTTPS:"
echo "   curl -s https://wpp.tudominio.com/api-docs | head -n 5"
echo ""
echo "5. Configura Vercel con:"
echo "   WPP_BASE_URL=https://wpp.tudominio.com"
echo "   WPP_TOKEN=galle-wpp-token-secure-123"
echo "   WPP_WEBHOOK_SECRET=wpp-webhook-secret-galle"
echo ""
echo "=================================================="
echo "  ✅ INSTALACIÓN COMPLETADA"
echo "=================================================="

