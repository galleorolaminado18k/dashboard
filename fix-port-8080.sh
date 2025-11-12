#!/bin/bash

# ===================================================================
# SCRIPT DE SOLUCIÓN URGENTE - Puerto 8080 ocupado
# Ejecutar en: root@31.220.58.83
# ===================================================================

echo "======================================"
echo "  DIAGNOSTICO Y SOLUCION PUERTO 8080"
echo "======================================"
echo ""

echo "🔍 PASO 1: Identificando qué usa el puerto 8080..."
echo ""

# Ver qué proceso/contenedor usa el puerto 8080
echo "Procesos en puerto 8080:"
lsof -i :8080 2>/dev/null || netstat -tulpn | grep :8080 || ss -tulpn | grep :8080

echo ""
echo "Contenedores corriendo:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"

echo ""
echo "🛑 PASO 2: Deteniendo TODOS los contenedores en puerto 8080..."
echo ""

# Detener todos los contenedores que usen el puerto 8080
for container in $(docker ps -q --filter "publish=8080"); do
    echo "Deteniendo contenedor: $(docker ps --filter id=$container --format '{{.Names}}')"
    docker stop $container
    docker rm $container
done

# También detener por nombre común
docker stop evolution evolution-api evolution-postgres waha caddy 2>/dev/null || true
docker rm evolution evolution-api evolution-postgres waha caddy 2>/dev/null || true

echo ""
echo "✅ Contenedores detenidos"

# Esperar un momento
sleep 3

# Verificar que el puerto esté libre
echo ""
echo "🔍 Verificando que el puerto esté libre..."
if lsof -i :8080 2>/dev/null || netstat -tulpn | grep :8080 || ss -tulpn | grep :8080; then
    echo "⚠️  El puerto aún está en uso. Matando el proceso..."
    # Matar cualquier proceso en el puerto 8080
    fuser -k 8080/tcp 2>/dev/null || true
    sleep 2
fi

echo ""
echo "🚀 PASO 3: Levantando Evolution API..."
echo ""

docker run -d --name evolution --restart unless-stopped \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e SERVER_PORT=8080 \
  -e SERVER_HOST=0.0.0.0 \
  -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e DATABASE_ENABLED=false \
  atendai/evolution-api:latest

echo ""
echo "🔥 PASO 4: Configurando firewall..."
echo ""

ufw allow 8080/tcp 2>/dev/null || true
ufw reload 2>/dev/null || true

echo ""
echo "⏳ Esperando 25 segundos para que Evolution inicie..."
sleep 25

echo ""
echo "======================================"
echo "  VERIFICACION"
echo "======================================"
echo ""

echo "📊 Contenedores corriendo:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📜 Logs de Evolution:"
docker logs evolution --tail 30

echo ""
echo "======================================"
echo "  PRUEBAS DE CONECTIVIDAD"
echo "======================================"
echo ""

echo "🧪 PRUEBA 1: Localhost (127.0.0.1)"
HTTP_LOCAL=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/health 2>/dev/null)
if [ "$HTTP_LOCAL" = "200" ]; then
    echo "✅ Localhost: OK (200)"
else
    echo "❌ Localhost: FAIL (HTTP $HTTP_LOCAL)"
fi

echo ""
echo "🧪 PRUEBA 2: IP Pública (31.220.58.83)"
HTTP_PUBLIC=$(curl -s -o /dev/null -w "%{http_code}" http://31.220.58.83:8080/health 2>/dev/null)
if [ "$HTTP_PUBLIC" = "200" ]; then
    echo "✅ IP Pública: OK (200)"
else
    echo "❌ IP Pública: FAIL (HTTP $HTTP_PUBLIC)"
fi

echo ""
echo "🧪 PRUEBA 3: Con API Key"
HTTP_AUTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/health \
    -H "apikey: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb" 2>/dev/null)
if [ "$HTTP_AUTH" = "200" ]; then
    echo "✅ Con API Key: OK (200)"
else
    echo "❌ Con API Key: FAIL (HTTP $HTTP_AUTH)"
fi

echo ""
echo "======================================"
echo "  RESUMEN"
echo "======================================"
echo ""

if [ "$HTTP_LOCAL" = "200" ] && [ "$HTTP_PUBLIC" = "200" ]; then
    echo "🎉 ¡ÉXITO! Evolution API está funcionando correctamente"
    echo ""
    echo "📋 CONFIGURAR EN VERCEL:"
    echo ""
    echo "Name: EVO_BASE_URL"
    echo "Value: http://31.220.58.83:8080"
    echo ""
    echo "Name: EVO_API_KEY"
    echo "Value: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
    echo ""
    echo "Luego: Redeploy en Vercel"
else
    echo "⚠️  Hay problemas de conectividad"
    echo ""
    echo "Ver logs completos:"
    echo "docker logs evolution"
fi

echo ""

