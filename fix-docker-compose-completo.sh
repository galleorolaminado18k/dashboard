#!/bin/bash
# Fix definitivo para KeyError ContainerConfig en Docker Compose
# Este script limpia completamente Docker y recrea WAHA desde cero

set -e  # Detener si hay errores

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 FIX DEFINITIVO: KeyError ContainerConfig"
echo "  Limpieza completa de Docker y recreación de WAHA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Paso 0: Ir al directorio de WAHA
echo "[PASO 0/6] Verificando directorio de WAHA..."
echo ""

if [ -d "/opt/baileys" ]; then
    WAHA_DIR="/opt/baileys"
    echo "✅ Usando directorio: /opt/baileys"
elif [ -d "/root/waha" ]; then
    WAHA_DIR="/root/waha"
    echo "✅ Usando directorio: /root/waha"
else
    echo "⚠️  No se encontró directorio de WAHA"
    echo "   Creando /opt/baileys..."
    mkdir -p /opt/baileys
    WAHA_DIR="/opt/baileys"
fi

cd "$WAHA_DIR" || exit 1
echo "📂 Directorio actual: $(pwd)"
echo ""

# Paso 1: Limpieza completa
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[PASO 1/6] Limpieza completa de Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🗑️  Deteniendo y eliminando contenedores existentes..."
docker-compose down --rmi all --volumes --remove-orphans 2>/dev/null || true
docker rm -f waha waha-api caddy 2>/dev/null || true

echo "🗑️  Limpiando redes..."
docker network prune -f

echo "🗑️  Limpiando volúmenes..."
docker volume prune -f

echo "🗑️  Limpiando sistema Docker..."
docker system prune -f

echo ""
echo "✅ Limpieza completa"
echo ""

# Paso 2: Instalar Docker Compose v2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[PASO 2/6] Verificando Docker Compose v2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if docker compose version 2>/dev/null; then
    echo "✅ Docker Compose v2 ya está instalado"
    COMPOSE_CMD="docker compose"
else
    echo "⚠️  Docker Compose v2 no encontrado"
    echo "📦 Instalando Docker Compose v2..."

    apt-get update -y
    apt-get install -y docker-compose-plugin

    if docker compose version 2>/dev/null; then
        echo "✅ Docker Compose v2 instalado correctamente"
        COMPOSE_CMD="docker compose"
    else
        echo "⚠️  Usando docker-compose v1 como fallback"
        COMPOSE_CMD="docker-compose"
    fi
fi

echo ""
echo "🔧 Usando comando: $COMPOSE_CMD"
echo ""

# Paso 3: Crear archivo .env con las credenciales correctas
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[PASO 3/6] Creando archivo .env con credenciales"
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

echo "✅ Archivo .env creado"
echo ""
echo "📋 Credenciales configuradas:"
echo "   WAHA_API_KEY=bb841979e8b66e6a0f563235b5df3d9a"
echo "   WAHA_DASHBOARD_USERNAME=admin"
echo "   WAHA_DASHBOARD_PASSWORD=3e15bf389c14df504b858886b30b03a7"
echo ""

# Paso 4: Crear docker-compose.yml correcto
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[PASO 4/6] Creando docker-compose.yml"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  waha:
    image: devlikeapro/waha
    container_name: waha-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./data:/app/.wwebjs_auth
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
      - waha

networks:
  net:
    driver: bridge

volumes:
  caddy_data:
  caddy_config:
EOF

echo "✅ docker-compose.yml creado"
echo ""

# Crear Caddyfile si no existe
if [ ! -f "Caddyfile" ]; then
    echo "📝 Creando Caddyfile..."
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
fi

echo ""

# Paso 5: Levantar contenedores desde cero
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[PASO 5/6] Levantando WAHA desde cero"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🚀 Iniciando contenedores..."
$COMPOSE_CMD up -d

echo ""
echo "⏳ Esperando 30 segundos a que WAHA inicie completamente..."
sleep 30

echo ""
echo "📋 Estado de contenedores:"
docker ps --filter "name=waha" --filter "name=caddy"

echo ""

# Paso 6: Verificación
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[PASO 6/6] Verificación de funcionamiento"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cargar variables del .env
export $(grep -v '^#' .env | xargs)

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
    echo "   $VERSION_BODY"
fi

echo ""
echo "🧪 TEST 3: Start Session (con API Key)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
START_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3000/api/sessions/default/start 2>&1)
START_BODY=$(echo "$START_RESPONSE" | head -n -1)
START_STATUS=$(echo "$START_RESPONSE" | tail -n 1)

if [ "$START_STATUS" = "200" ] || [ "$START_STATUS" = "201" ] || [ "$START_STATUS" = "409" ]; then
    echo "✅ Start Session: OK (Status $START_STATUS)"
else
    echo "⚠️  Start Session: Status $START_STATUS"
    echo "   $START_BODY"
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
else
    echo "❌ ALGUNOS TESTS FALLARON"
    echo ""
    echo "📋 Ver logs completos de WAHA:"
    echo "   docker logs waha-api --tail 100"
    echo ""
    echo "📋 Ver logs de Caddy:"
    echo "   docker logs caddy --tail 50"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  COMANDOS ÚTILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ver logs de WAHA en tiempo real:"
echo "  docker logs -f waha-api"
echo ""
echo "Ver logs de Caddy:"
echo "  docker logs -f caddy"
echo ""
echo "Reiniciar WAHA:"
echo "  cd $WAHA_DIR && $COMPOSE_CMD restart waha"
echo ""
echo "Ver estado de contenedores:"
echo "  docker ps"
echo ""
echo "Ver credenciales:"
echo "  cat $WAHA_DIR/.env"
echo ""

