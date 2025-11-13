#!/bin/bash
# Instalación completa WPPConnect para galle18k.com
# Ejecutar como root en el VPS

echo "=========================================="
echo "  INSTALACIÓN COMPLETA WPPCONNECT"
echo "  galle18k.com"
echo "=========================================="
echo ""

# PASO 1: Instalar Docker y dependencias
echo "[1/8] Instalando Docker y dependencias..."
apt-get update -qq
apt-get install -y docker.io docker-compose curl
systemctl enable docker
systemctl start docker
echo "✅ Docker instalado"
echo ""

# PASO 2: Limpiar contenedores antiguos
echo "[2/8] Limpiando contenedores antiguos..."
docker ps -a | grep -E 'evolution|waha' | awk '{print $1}' | xargs -r docker rm -f
echo "✅ Limpieza completada"
echo ""

# PASO 3: Crear directorio
echo "[3/8] Creando directorio /opt/wpp..."
mkdir -p /opt/wpp
cd /opt/wpp
echo "✅ Directorio creado: $(pwd)"
echo ""

# PASO 4: Crear docker-compose.yml
echo "[4/8] Creando docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  wppconnect:
    image: wppconnect/server:latest
    container_name: wppconnect
    restart: always
    shm_size: "1gb"
    ports:
      - "21465:21465"
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

# PASO 5: Crear Caddyfile
echo "[5/8] Creando Caddyfile..."
cat > Caddyfile << 'EOF'
wpp.galle18k.com {
  encode zstd gzip
  reverse_proxy wppconnect:21465
}
EOF
echo "✅ Caddyfile creado"
echo ""

# PASO 6: Iniciar servicios
echo "[6/8] Iniciando servicios..."
docker-compose up -d
echo "✅ Servicios iniciados"
echo ""

# PASO 7: Esperar a que inicien
echo "[7/8] Esperando 40 segundos a que los servicios inicien..."
sleep 40

# PASO 8: Diagnóstico
echo ""
echo "[8/8] Ejecutando diagnóstico..."
echo ""
echo "=========================================="
echo "  DIAGNÓSTICO"
echo "=========================================="
echo ""

echo "📊 Contenedores corriendo:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📡 Test HTTP local (puerto 21465):"
LOCAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:21465/api-docs)
echo "HTTP Status: $LOCAL_RESPONSE"
if [ "$LOCAL_RESPONSE" = "200" ]; then
    echo "✅ WPPConnect responde correctamente"
    curl -I http://127.0.0.1:21465/api-docs 2>&1 | head -5
else
    echo "❌ WPPConnect no responde (código: $LOCAL_RESPONSE)"
    echo ""
    echo "Ver logs:"
    docker logs wppconnect --tail 20
fi

echo ""
echo "📡 Test HTTPS externo (wpp.galle18k.com):"
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://wpp.galle18k.com/api-docs)
echo "HTTP Status: $HTTPS_RESPONSE"
if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo "✅ HTTPS funciona correctamente"
elif [ "$HTTPS_RESPONSE" = "000" ]; then
    echo "⚠️  No se puede conectar (DNS o Firewall)"
    echo ""
    echo "Verifica:"
    echo "1. DNS configurado: dig wpp.galle18k.com"
    echo "2. Firewall: ufw status"
else
    echo "⚠️  HTTPS responde pero con error $HTTPS_RESPONSE"
    echo ""
    echo "Posibles causas:"
    echo "1. SSL aún generándose (espera 2 minutos más)"
    echo "2. Cloudflare SSL en 'Flexible' (debe ser 'Full')"
    echo "3. Caddy no puede conectar a WPPConnect"
fi

echo ""
echo "🔍 Logs de Caddy (últimas 10 líneas):"
docker logs caddy --tail 10

echo ""
echo "=========================================="
echo "  RESUMEN"
echo "=========================================="
echo ""

WPPCONNECT_RUNNING=$(docker ps | grep wppconnect | wc -l)
CADDY_RUNNING=$(docker ps | grep caddy | wc -l)

echo "✓ WPPConnect corriendo: $([ $WPPCONNECT_RUNNING -eq 1 ] && echo '✅ Sí' || echo '❌ No')"
echo "✓ Caddy corriendo: $([ $CADDY_RUNNING -eq 1 ] && echo '✅ Sí' || echo '❌ No')"
echo "✓ HTTP local (127.0.0.1:21465): $([ "$LOCAL_RESPONSE" = "200" ] && echo '✅ 200 OK' || echo "❌ $LOCAL_RESPONSE")"
echo "✓ HTTPS externo (wpp.galle18k.com): $([ "$HTTPS_RESPONSE" = "200" ] && echo '✅ 200 OK' || echo "❌ $HTTPS_RESPONSE")"

echo ""
echo "=========================================="
echo "  SIGUIENTE PASO"
echo "=========================================="
echo ""

if [ "$LOCAL_RESPONSE" = "200" ] && [ "$HTTPS_RESPONSE" = "200" ]; then
    echo "✅ TODO FUNCIONA CORRECTAMENTE"
    echo ""
    echo "Configura Vercel con estas variables:"
    echo ""
    echo "WPP_BASE_URL=https://wpp.galle18k.com"
    echo "WPP_TOKEN=galle-wpp-token-secure-123"
    echo "WPP_WEBHOOK_SECRET=wpp-webhook-secret-galle"
    echo ""
    echo "Luego haz Redeploy y prueba en /configuracion"
elif [ "$LOCAL_RESPONSE" = "200" ] && [ "$HTTPS_RESPONSE" != "200" ]; then
    echo "⚠️  WPPConnect funciona pero HTTPS tiene problemas"
    echo ""
    echo "1. Verifica que el subdominio wpp.galle18k.com esté configurado en DNS:"
    echo "   - Tipo: A"
    echo "   - Nombre: wpp"
    echo "   - Valor: 31.220.58.83"
    echo ""
    echo "2. Si usas Cloudflare:"
    echo "   - SSL/TLS debe estar en 'Full' (no Flexible)"
    echo "   - Temporalmente pon la nube en GRIS (DNS only)"
    echo "   - Espera 2 minutos a que SSL se genere"
    echo "   - Vuelve a poner nube NARANJA (Proxied)"
    echo ""
    echo "3. Ver logs de Caddy en tiempo real:"
    echo "   docker logs caddy -f"
    echo ""
    echo "4. Busca este mensaje:"
    echo "   'Successfully obtained certificate for wpp.galle18k.com'"
else
    echo "❌ WPPConnect no está respondiendo"
    echo ""
    echo "Ver logs completos:"
    echo "docker logs wppconnect -f"
    echo ""
    echo "Verificar memoria:"
    echo "free -h"
    echo ""
    echo "Reiniciar si es necesario:"
    echo "cd /opt/wpp && docker-compose restart"
fi

echo ""
echo "=========================================="
echo "  COMANDOS ÚTILES"
echo "=========================================="
echo ""
echo "Ver logs:"
echo "  docker logs wppconnect -f"
echo "  docker logs caddy -f"
echo ""
echo "Reiniciar:"
echo "  cd /opt/wpp"
echo "  docker-compose restart"
echo ""
echo "Probar local:"
echo "  curl http://127.0.0.1:21465/api-docs"
echo ""
echo "Probar HTTPS:"
echo "  curl https://wpp.galle18k.com/api-docs"
echo ""

