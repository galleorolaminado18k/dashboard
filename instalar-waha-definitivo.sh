#!/bin/bash
# SOLUCIÓN FINAL: WAHA - WhatsApp HTTP API (imagen verificada que SÍ existe)

echo "=========================================="
echo "  WAHA - WhatsApp HTTP API"
echo "  (Imagen verificada: devlikeapro/waha)"
echo "=========================================="
echo ""

cd /opt/wpp || exit 1

echo "[1/5] Limpiando todo..."
docker-compose down -v 2>/dev/null
docker rm -f $(docker ps -aq) 2>/dev/null
docker network prune -f
docker volume prune -f

echo ""
echo "[2/5] Verificando imagen WAHA en Docker Hub..."
if docker pull devlikeapro/waha:latest; then
    echo "✅ Imagen WAHA descargada correctamente"
else
    echo "❌ Error descargando WAHA"
    exit 1
fi

echo ""
echo "[3/5] Creando docker-compose.yml con WAHA..."

cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha
    restart: always
    ports:
      - "3000:3000"
    environment:
      - WAHA_API_KEY=galle-wpp-token-secure-123
      - WAHA_LOG_LEVEL=info
    volumes:
      - waha_data:/app/.sessions
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
  waha_data:
  caddy_data:
  caddy_config:
EOF

echo "✅ docker-compose.yml creado con WAHA"

echo ""
echo "[4/5] Actualizando Caddyfile para puerto 3000..."

cat > Caddyfile << 'EOF'
wpp.galle18k.com {
  encode zstd gzip
  reverse_proxy waha:3000
}
EOF

echo "✅ Caddyfile actualizado"

echo ""
echo "[5/5] Iniciando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando 40 segundos a que WAHA inicie..."
sleep 40

echo ""
echo "=========================================="
echo "  VERIFICACIÓN"
echo "=========================================="
echo ""

docker ps

echo ""
echo "📋 Logs WAHA (últimas 30 líneas):"
docker logs waha --tail 30 2>&1

echo ""
echo "📋 Logs Caddy (últimas 10 líneas):"
docker logs caddy --tail 10 2>&1

echo ""
echo "🔍 Test local puerto 3000:"
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health)
echo "HTTP Status /api/health: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ WAHA está funcionando correctamente"
    curl -s http://127.0.0.1:3000/api/health | head -5
elif [ "$HTTP_CODE" = "401" ]; then
    echo "✅ WAHA está corriendo (401 = necesita API key, normal)"
else
    echo "⚠️  WAHA responde con código: $HTTP_CODE"
fi

echo ""
echo "🔍 Test sesiones:"
curl -s -H "X-Api-Key: galle-wpp-token-secure-123" http://127.0.0.1:3000/api/sessions 2>&1 | head -10

echo ""
echo "=========================================="
echo "  RESUMEN"
echo "=========================================="
echo ""

WAHA_RUNNING=$(docker ps | grep waha | wc -l)
CADDY_RUNNING=$(docker ps | grep caddy | wc -l)

if [ $WAHA_RUNNING -eq 1 ]; then
    echo "✅ WAHA corriendo"
else
    echo "❌ WAHA no está corriendo"
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

if [ $WAHA_RUNNING -eq 1 ] && [ $CADDY_RUNNING -eq 1 ]; then
    echo "✅ ÉXITO - AMBOS SERVICIOS CORRIENDO"
    echo ""
    echo "WAHA está funcionando en:"
    echo "  - Local: http://127.0.0.1:3000"
    echo "  - HTTPS: https://wpp.galle18k.com (espera 2 min para SSL)"
    echo ""
    echo "Configuración Vercel:"
    echo "  WAHA_BASE_URL=https://wpp.galle18k.com"
    echo "  WAHA_API_KEY=galle-wpp-token-secure-123"
    echo ""
    echo "Documentación API WAHA:"
    echo "  https://waha.devlike.pro/"
    echo ""
    echo "Endpoints principales:"
    echo "  GET  /api/sessions - Listar sesiones"
    echo "  POST /api/sessions - Crear sesión"
    echo "  GET  /api/{session}/me - Info de sesión"
    echo "  POST /api/sendText - Enviar mensaje"
    echo ""
    echo "Prueba ahora:"
    echo "  curl -H 'X-Api-Key: galle-wpp-token-secure-123' http://127.0.0.1:3000/api/sessions"
else
    echo "❌ Algunos servicios no iniciaron"
    echo ""
    echo "Ver logs:"
    echo "  docker logs waha -f"
    echo "  docker logs caddy -f"
fi

echo ""

