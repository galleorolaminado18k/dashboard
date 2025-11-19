#!/bin/bash
# Fix definitivo para WAHA - Compatible con cualquier versión de Docker Compose

set -e  # Detener si hay errores

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 FIX DEFINITIVO: WAHA Limpio y Funcionando"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Paso 0: Ir al directorio de WAHA
echo "[PASO 0/5] Verificando directorio de WAHA..."
echo ""

if [ -d "/opt/baileys" ]; then
    WAHA_DIR="/opt/baileys"
elif [ -d "/root/waha" ]; then
    WAHA_DIR="/root/waha"
else
    WAHA_DIR="/opt/baileys"
    mkdir -p "$WAHA_DIR"
fi

cd "$WAHA_DIR" || exit 1
echo "✅ Usando directorio: $WAHA_DIR"
echo ""

# Paso 1: Limpieza completa
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[PASO 1/5] Limpieza completa de Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🗑️  Deteniendo contenedores..."
docker stop waha-api caddy 2>/dev/null || true
docker rm -f waha-api caddy 2>/dev/null || true

echo "🗑️  Limpiando redes y volúmenes..."
docker network prune -f
docker volume prune -f

echo "✅ Limpieza completa"
echo ""

# Paso 2: Crear .env con credenciales
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[PASO 2/5] Creando credenciales"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > .env << 'EOF'
WAHA_API_KEY=bb841979e8b66e6a0f563235b5df3d9a
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=3e15bf389c14df504b858886b30b03a7
WHATSAPP_SWAGGER_USERNAME=admin
WHATSAPP_SWAGGER_PASSWORD=3e15bf389c14df504b858886b30b03a7
EOF

chmod 600 .env

echo "✅ Credenciales creadas"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 COPIAR ESTAS CREDENCIALES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "WAHA_API_KEY=bb841979e8b66e6a0f563235b5df3d9a"
echo "WAHA_DASHBOARD_USERNAME=admin"
echo "WAHA_DASHBOARD_PASSWORD=3e15bf389c14df504b858886b30b03a7"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Paso 3: Crear archivos de configuración
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[PASO 3/5] Creando archivos de configuración"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Caddyfile
cat > Caddyfile << 'EOF'
wpp.galle18k.com {
  reverse_proxy waha-api:3000 {
    header_up X-Api-Key {>X-Api-Key}
    header_up x-api-key {>x-api-key}
    header_up Authorization {>Authorization}
    header_up Host {upstream_hostport}
  }
  encode gzip zstd
}
EOF

echo "✅ Caddyfile creado"
echo ""

# Paso 4: Iniciar WAHA directamente con Docker
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[PASO 4/5] Iniciando WAHA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Crear red si no existe
docker network create waha_net 2>/dev/null || true

# Cargar variables del .env
export $(grep -v '^#' .env | xargs)

echo "🚀 Iniciando WAHA..."
docker run -d \
  --name waha-api \
  --network waha_net \
  --restart unless-stopped \
  -p 3000:3000 \
  -e WAHA_API_KEY="$WAHA_API_KEY" \
  -e WAHA_DASHBOARD_USERNAME="$WAHA_DASHBOARD_USERNAME" \
  -e WAHA_DASHBOARD_PASSWORD="$WAHA_DASHBOARD_PASSWORD" \
  -v "$WAHA_DIR/data:/app/.wwebjs_auth" \
  devlikeapro/waha

echo "🚀 Iniciando Caddy..."
docker run -d \
  --name caddy \
  --network waha_net \
  --restart always \
  -p 80:80 \
  -p 443:443 \
  -v "$WAHA_DIR/Caddyfile:/etc/caddy/Caddyfile" \
  -v caddy_data:/data \
  -v caddy_config:/config \
  caddy:latest

echo ""
echo "⏳ Esperando 30 segundos a que WAHA inicie..."
sleep 30

echo ""
echo "📋 Estado de contenedores:"
docker ps --filter "name=waha" --filter "name=caddy" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""

# Paso 5: Verificación
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[PASO 5/5] Verificación de funcionamiento"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Health
echo "🧪 TEST 1: Health Check (sin autenticación)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH_RESPONSE=$(curl -s -i http://127.0.0.1:3000/health 2>&1)
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep -i "HTTP/" | awk '{print $2}')

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Health: OK (Status 200)"
else
    echo "⚠️  Health: Status $HEALTH_STATUS"
fi

echo ""

# Test 2: Version
echo "🧪 TEST 2: Server Version (con API Key)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
VERSION_RESPONSE=$(curl -s -w "\n%{http_code}" -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3000/api/server/version 2>&1)
VERSION_BODY=$(echo "$VERSION_RESPONSE" | head -n -1)
VERSION_STATUS=$(echo "$VERSION_RESPONSE" | tail -n 1)

if [ "$VERSION_STATUS" = "200" ]; then
    echo "✅ Version: OK (Status 200)"
    echo "   $VERSION_BODY"
else
    echo "⚠️  Version: Status $VERSION_STATUS"
fi

echo ""

# Test 3: Start session
echo "🧪 TEST 3: Start Session (con API Key)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
START_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3000/api/sessions/default/start 2>&1)
START_STATUS=$(echo "$START_RESPONSE" | tail -n 1)

if [ "$START_STATUS" = "200" ] || [ "$START_STATUS" = "201" ] || [ "$START_STATUS" = "409" ]; then
    echo "✅ Start Session: OK (Status $START_STATUS)"
else
    echo "⚠️  Start Session: Status $START_STATUS"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESULTADO FINAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$HEALTH_STATUS" = "200" ] && [ "$VERSION_STATUS" = "200" ] && ([ "$START_STATUS" = "200" ] || [ "$START_STATUS" = "201" ] || [ "$START_STATUS" = "409" ]); then
    echo "✅✅✅ WAHA FUNCIONA CORRECTAMENTE ✅✅✅"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  📋 CREDENCIALES PARA VERCEL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "WAHA_BASE_URL=https://wpp.galle18k.com"
    echo "WAHA_API_KEY=bb841979e8b66e6a0f563235b5df3d9a"
    echo "WAHA_DASHBOARD_USERNAME=admin"
    echo "WAHA_DASHBOARD_PASSWORD=3e15bf389c14df504b858886b30b03a7"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 SIGUIENTE PASO:"
    echo "   1. Copiar las credenciales de arriba"
    echo "   2. Agregarlas en Vercel"
    echo "   3. Redeploy"
    echo ""
    echo "🌐 URLs disponibles:"
    echo "   • API: https://wpp.galle18k.com"
    echo "   • Dashboard: https://wpp.galle18k.com/dashboard"
    echo ""
else
    echo "❌ ALGUNOS TESTS FALLARON"
    echo ""
    echo "📋 Ver logs completos:"
    echo "   docker logs waha-api --tail 100"
    echo "   docker logs caddy --tail 50"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  COMANDOS ÚTILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ver logs en tiempo real:"
echo "  docker logs -f waha-api"
echo "  docker logs -f caddy"
echo ""
echo "Reiniciar contenedores:"
echo "  docker restart waha-api caddy"
echo ""
echo "Ver estado:"
echo "  docker ps"
echo ""

