#!/bin/bash
# Script de corrección inmediata - Contenedores no iniciaron
# Ejecutar como root en el VPS

echo "=========================================="
echo "  CORRECCIÓN: CONTENEDORES NO INICIARON"
echo "=========================================="
echo ""

cd /opt/wpp || { echo "❌ Error: /opt/wpp no existe"; exit 1; }

echo "[1/5] Verificando archivos..."
ls -lh docker-compose.yml Caddyfile

echo ""
echo "[2/5] Deteniendo cualquier contenedor previo..."
docker-compose down 2>/dev/null
docker rm -f wppconnect caddy 2>/dev/null

echo ""
echo "[3/5] Verificando imágenes Docker..."
docker images | grep -E "wppconnect|caddy"

echo ""
echo "[4/5] Iniciando servicios con logs en tiempo real..."
docker-compose up -d

echo ""
echo "⏳ Esperando 10 segundos..."
sleep 10

echo ""
echo "[5/5] Verificando estado..."
docker ps -a

echo ""
echo "=========================================="
echo "  LOGS DE INICIO"
echo "=========================================="
echo ""

echo "📋 Logs WPPConnect (últimas 30 líneas):"
docker logs wppconnect --tail 30 2>&1 || echo "❌ Contenedor wppconnect no existe"

echo ""
echo "📋 Logs Caddy (últimas 20 líneas):"
docker logs caddy --tail 20 2>&1 || echo "❌ Contenedor caddy no existe"

echo ""
echo "=========================================="
echo "  DIAGNÓSTICO"
echo "=========================================="
echo ""

# Verificar contenedores
WPPCONNECT=$(docker ps -q -f name=wppconnect)
CADDY=$(docker ps -q -f name=caddy)

if [ -n "$WPPCONNECT" ]; then
    echo "✅ WPPConnect está corriendo"
else
    echo "❌ WPPConnect NO está corriendo"
    echo ""
    echo "Posibles causas:"
    echo "1. Error descargando la imagen"
    echo "2. Puerto 21465 en uso"
    echo "3. Falta memoria"
    echo ""
    echo "Verificar:"
    docker ps -a | grep wppconnect
    echo ""
    echo "Ver error completo:"
    echo "docker logs wppconnect"
fi

if [ -n "$CADDY" ]; then
    echo "✅ Caddy está corriendo"
else
    echo "❌ Caddy NO está corriendo"
    echo ""
    echo "Posibles causas:"
    echo "1. Puerto 80 o 443 en uso"
    echo "2. Caddyfile inválido"
    echo ""
    echo "Verificar:"
    docker ps -a | grep caddy
    echo ""
    echo "Ver error completo:"
    echo "docker logs caddy"
fi

echo ""
echo "=========================================="
echo "  PRUEBAS"
echo "=========================================="
echo ""

if [ -n "$WPPCONNECT" ]; then
    echo "🔍 Test local:"
    sleep 5
    curl -I http://127.0.0.1:21465/api-docs 2>&1 | head -5
fi

echo ""
echo "🔍 Puertos escuchando:"
netstat -tlnp | grep -E ":(80|443|21465) " || ss -tlnp | grep -E ":(80|443|21465) "

echo ""
echo "🔍 Memoria disponible:"
free -h

echo ""
echo "=========================================="
echo "  ACCIONES"
echo "=========================================="
echo ""

if [ -z "$WPPCONNECT" ] || [ -z "$CADDY" ]; then
    echo "⚠️  Algunos contenedores no iniciaron"
    echo ""
    echo "Ejecuta estos comandos para más info:"
    echo ""
    echo "# Ver estado detallado"
    echo "docker ps -a"
    echo ""
    echo "# Ver logs completos"
    echo "docker-compose logs"
    echo ""
    echo "# Ver logs en tiempo real"
    echo "docker-compose logs -f"
    echo ""
    echo "# Reintentar inicio"
    echo "docker-compose up -d --force-recreate"
else
    echo "✅ Ambos contenedores corriendo"
    echo ""
    echo "Espera 30 segundos más y prueba:"
    echo "curl http://127.0.0.1:21465/api-docs"
fi

echo ""

