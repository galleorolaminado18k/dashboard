#!/bin/bash
# Script de instalación WPPConnect para galle18k.com
# Ejecutar como root en el VPS

echo "======================================"
echo "  INSTALANDO WPPCONNECT"
echo "======================================"
echo ""

# Instalar Docker y Docker Compose
echo "[1/6] Instalando Docker..."
apt-get update -qq
apt-get install -y docker.io docker-compose curl
systemctl enable docker
systemctl start docker
echo "✅ Docker instalado"
echo ""

# Limpiar contenedores antiguos
echo "[2/6] Limpiando contenedores antiguos..."
docker ps -a --format '{{.Names}}' | grep -E 'evolution|waha' | xargs -r docker rm -f
echo "✅ Limpieza completada"
echo ""

# Crear directorio
echo "[3/6] Creando directorio /opt/wpp..."
mkdir -p /opt/wpp
cd /opt/wpp
echo "✅ Directorio creado"
echo ""

# Crear docker-compose.yml
echo "[4/6] Creando docker-compose.yml..."
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
      - SECRET_KEY=super-secret-wpp-galle-2025
      - TOKEN=galle-wpp-token-secure-123
      - LOG_LEVEL=info
      - WEBHOOK_ENABLED=true
      - WEBHOOK_BASEURL=https://wpp.galle18k.com
      - WEBHOOK_PATH=/wpp/webhook
      - WEBHOOK_SECRET=wpp-webhook-secret-galle
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

# Crear Caddyfile
echo "[5/6] Creando Caddyfile..."
cat > Caddyfile << 'EOF'
wpp.galle18k.com {
  encode zstd gzip
  reverse_proxy wppconnect:21465
  header {
    X-Powered-By "WPPConnect via Caddy"
  }
  log {
    output file /var/log/caddy/wpp-access.log
  }
}
EOF
echo "✅ Caddyfile creado"
echo ""

# Iniciar servicios
echo "[6/6] Iniciando servicios..."
docker-compose up -d
echo "✅ Servicios iniciados"
echo ""

# Esperar a que inicien
echo "⏳ Esperando 40 segundos a que los servicios inicien..."
sleep 40

# Verificación
echo ""
echo "======================================"
echo "  VERIFICACIÓN"
echo "======================================"
echo ""

echo "📊 Contenedores corriendo:"
docker ps --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "📡 Test local (WPPConnect):"
curl -s http://localhost:21465/api-docs | head -n 3

echo ""
echo "⏳ Esperando 30 segundos más para SSL..."
sleep 30

echo ""
echo "📡 Test HTTPS:"
curl -s https://wpp.galle18k.com/api-docs | head -n 3

echo ""
echo "======================================"
echo "  ✅ INSTALACIÓN COMPLETADA"
echo "======================================"
echo ""
echo "🌐 URL: https://wpp.galle18k.com"
echo "🔑 Token: galle-wpp-token-secure-123"
echo "📚 Swagger: https://wpp.galle18k.com/api-docs"
echo ""
echo "Siguiente paso:"
echo "1. Configura Vercel con las variables de entorno"
echo "2. Haz Redeploy"
echo "3. Prueba en /configuracion"
echo ""

