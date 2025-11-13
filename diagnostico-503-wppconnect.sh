#!/bin/bash
# Script de diagnóstico y corrección WPPConnect - Error 503
# Ejecutar como root en el VPS

echo "=========================================="
echo "  DIAGNÓSTICO Y CORRECCIÓN - ERROR 503"
echo "=========================================="
echo ""

# PASO 1: Verificar contenedores
echo "[PASO 1/6] Verificando contenedores..."
cd /opt/wpp 2>/dev/null || { echo "❌ Directorio /opt/wpp no existe"; exit 1; }

echo ""
echo "📊 Contenedores corriendo:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📋 Todos los contenedores (incluidos detenidos):"
docker ps -a --format "table {{.Names}}\t{{.Status}}"

# PASO 2: Ver logs
echo ""
echo "[PASO 2/6] Revisando logs..."
echo ""
echo "🔍 Últimas 50 líneas de WPPConnect:"
docker logs --tail 50 wppconnect 2>&1 | tail -20

echo ""
echo "🔍 Últimas 50 líneas de Caddy:"
docker logs --tail 50 caddy 2>&1 | tail -20

# PASO 3: Verificar docker-compose.yml
echo ""
echo "[PASO 3/6] Verificando configuración..."
echo ""
echo "📄 docker-compose.yml existe:"
ls -lh docker-compose.yml

echo ""
echo "📄 Verificando shm_size en compose:"
grep -A 2 "shm_size" docker-compose.yml || echo "⚠️  shm_size NO está configurado"

# PASO 4: Publicar puerto para prueba local
echo ""
echo "[PASO 4/6] Publicando puerto 21465 para diagnóstico..."

# Backup del compose original
cp docker-compose.yml docker-compose.yml.backup

# Agregar publicación de puerto si no existe
if ! grep -q "21465:21465" docker-compose.yml; then
    echo "Agregando publicación de puerto..."

    # Crear nuevo docker-compose con puerto publicado
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

    echo "✅ Puerto agregado"
else
    echo "✅ Puerto ya está publicado"
fi

# Reiniciar servicios
echo ""
echo "🔄 Reiniciando servicios..."
docker-compose down
docker-compose up -d

echo ""
echo "⏳ Esperando 30 segundos a que WPPConnect inicie..."
sleep 30

# PASO 5: Probar conectividad local
echo ""
echo "[PASO 5/6] Probando conectividad local..."
echo ""
echo "📡 Test HTTP local (puerto 21465):"
curl -I http://127.0.0.1:21465/api-docs 2>&1 | head -5

echo ""
echo "📡 Test sesiones local:"
curl -I -H "Authorization: Bearer galle-wpp-token-secure-123" http://127.0.0.1:21465/api/sessions 2>&1 | head -5

# PASO 6: Verificar Caddyfile y SSL
echo ""
echo "[PASO 6/6] Verificando Caddy y SSL..."
echo ""
echo "📄 Caddyfile:"
cat Caddyfile

echo ""
echo "🔍 Logs de Caddy (buscando certificado SSL):"
docker logs caddy 2>&1 | grep -i "certificate" | tail -5

echo ""
echo "📡 Test HTTPS externo:"
curl -I https://wpp.galle18k.com/api-docs 2>&1 | head -10

echo ""
echo "=========================================="
echo "  RESUMEN DEL DIAGNÓSTICO"
echo "=========================================="
echo ""

# Verificaciones
WPPCONNECT_RUNNING=$(docker ps | grep wppconnect | wc -l)
CADDY_RUNNING=$(docker ps | grep caddy | wc -l)
LOCAL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:21465/api-docs)
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://wpp.galle18k.com/api-docs)

echo "✓ WPPConnect corriendo: $([ $WPPCONNECT_RUNNING -eq 1 ] && echo '✅ Sí' || echo '❌ No')"
echo "✓ Caddy corriendo: $([ $CADDY_RUNNING -eq 1 ] && echo '✅ Sí' || echo '❌ No')"
echo "✓ HTTP local (127.0.0.1:21465): $([ $LOCAL_RESPONSE -eq 200 ] && echo '✅ 200 OK' || echo "❌ $LOCAL_RESPONSE")"
echo "✓ HTTPS externo (wpp.galle18k.com): $([ $HTTPS_RESPONSE -eq 200 ] && echo '✅ 200 OK' || echo "❌ $HTTPS_RESPONSE")"

echo ""
echo "=========================================="
echo "  ACCIONES RECOMENDADAS"
echo "=========================================="
echo ""

if [ $LOCAL_RESPONSE -ne 200 ]; then
    echo "❌ PROBLEMA: WPPConnect no responde localmente"
    echo ""
    echo "Solución:"
    echo "1. Ver logs completos: docker logs wppconnect -f"
    echo "2. Verificar memoria: free -h"
    echo "3. Reintentar: docker-compose restart wppconnect"
    echo ""
fi

if [ $LOCAL_RESPONSE -eq 200 ] && [ $HTTPS_RESPONSE -ne 200 ]; then
    echo "❌ PROBLEMA: WPPConnect funciona local pero no HTTPS"
    echo ""
    echo "Solución:"
    echo "1. Verifica DNS: dig wpp.galle18k.com"
    echo "2. Verifica Cloudflare SSL: debe ser 'Full' (no Flexible)"
    echo "3. Temporalmente, pon Cloudflare en 'DNS only' (nube gris)"
    echo "4. Ver logs de Caddy: docker logs caddy -f"
    echo "5. Espera a ver 'Successfully obtained certificate'"
    echo "6. Vuelve a Cloudflare 'Proxied' (nube naranja)"
    echo ""
fi

if [ $LOCAL_RESPONSE -eq 200 ] && [ $HTTPS_RESPONSE -eq 200 ]; then
    echo "✅ TODO FUNCIONA CORRECTAMENTE"
    echo ""
    echo "Siguiente paso:"
    echo "1. Configura Vercel:"
    echo "   WPP_BASE_URL=https://wpp.galle18k.com"
    echo "   WPP_TOKEN=galle-wpp-token-secure-123"
    echo "   WPP_WEBHOOK_SECRET=wpp-webhook-secret-galle"
    echo ""
    echo "2. Haz Redeploy en Vercel"
    echo ""
    echo "3. Prueba en /configuracion"
    echo ""
fi

echo "=========================================="

