#!/bin/bash

# ===================================================================
# SCRIPT COMPLETO - CONFIGURAR EVOLUTION API EN VPS
# Ejecutar en: root@31.220.58.83
# ===================================================================

set -e  # Detener si hay algún error

echo "======================================"
echo "  PASO 1: LEVANTAR EVOLUTION API"
echo "======================================"
echo ""

# 1.1 Detener contenedores anteriores
echo "🛑 Deteniendo contenedores anteriores..."
docker stop evolution-api evolution 2>/dev/null || true
docker rm evolution-api evolution 2>/dev/null || true

# 1.2 Crear directorio para docker-compose
echo "📁 Preparando directorio..."
cd ~
mkdir -p evolution-setup
cd evolution-setup

# 1.3 Crear docker-compose.evolution.yml
echo "📝 Creando docker-compose.evolution.yml..."
cat > docker-compose.evolution.yml << 'EOF'
services:
  evolution:
    image: atendai/evolution-api:latest
    container_name: evolution
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ~/evolution-data:/evolution/store
    environment:
      # Server configuration - Escuchar en todas las interfaces
      SERVER_PORT: "8080"
      SERVER_HOST: "0.0.0.0"

      # Authentication
      AUTHENTICATION: "true"
      API_KEY: "81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
      AUTHENTICATION_API_KEY: "81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"

      # Database (disabled)
      DATABASE_ENABLED: "false"
EOF

# 1.4 Pull de la imagen más reciente
echo "⬇️  Descargando última versión de Evolution API..."
docker compose -f docker-compose.evolution.yml pull

# 1.5 Levantar Evolution API
echo "🚀 Levantando Evolution API..."
docker compose -f docker-compose.evolution.yml up -d

# 1.6 Verificar que levantó
echo ""
echo "⏳ Esperando 15 segundos para que Evolution inicie..."
sleep 15

echo ""
echo "📊 Contenedores corriendo:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "======================================"
echo "  PASO 2: CONFIGURAR FIREWALL"
echo "======================================"
echo ""

# 2.1 Verificar si UFW está activo
if command -v ufw &> /dev/null; then
    echo "🔥 Configurando UFW..."

    # Permitir puertos
    ufw allow 8080/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Recargar
    ufw reload

    echo ""
    echo "📋 Estado del firewall:"
    ufw status numbered
else
    echo "⚠️  UFW no está instalado, saltando configuración de firewall"
fi

echo ""
echo "======================================"
echo "  PASO 3: PRUEBAS DE CONECTIVIDAD"
echo "======================================"
echo ""

# 3.1 Ver logs de Evolution
echo "📜 Últimos logs de Evolution:"
docker logs evolution --tail 30
echo ""

# 3.2 Prueba desde localhost
echo "🧪 Prueba 1: Health check desde localhost (127.0.0.1)..."
LOCALHOST_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/health 2>/dev/null || echo "FAIL")

if [ "$LOCALHOST_RESULT" = "200" ]; then
    echo "✅ Localhost: OK (200)"
else
    echo "❌ Localhost: FAIL (HTTP $LOCALHOST_RESULT)"
fi

# 3.3 Prueba desde IP pública interna
echo ""
echo "🧪 Prueba 2: Health check desde IP pública (31.220.58.83)..."
PUBLIC_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://31.220.58.83:8080/health 2>/dev/null || echo "FAIL")

if [ "$PUBLIC_RESULT" = "200" ]; then
    echo "✅ IP Pública: OK (200)"
else
    echo "❌ IP Pública: FAIL (HTTP $PUBLIC_RESULT)"
    echo "⚠️  Esto puede indicar problema de firewall o configuración de red"
fi

# 3.4 Prueba con API Key
echo ""
echo "🧪 Prueba 3: Health check con API Key..."
AUTH_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/health \
    -H "apikey: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb" 2>/dev/null || echo "FAIL")

if [ "$AUTH_RESULT" = "200" ]; then
    echo "✅ Con API Key: OK (200)"
else
    echo "❌ Con API Key: FAIL (HTTP $AUTH_RESULT)"
fi

# 3.5 Prueba de start session
echo ""
echo "🧪 Prueba 4: Start session..."
SESSION_RESULT=$(curl -s -X POST http://127.0.0.1:8080/sessions/start \
    -H "Content-Type: application/json" \
    -H "apikey: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb" \
    -d '{"sessionName":"default","whatsappVersion":"v2"}' \
    -w "\nHTTP_CODE:%{http_code}" 2>/dev/null | tail -1)

if [[ "$SESSION_RESULT" == *"200"* ]] || [[ "$SESSION_RESULT" == *"409"* ]]; then
    echo "✅ Start session: OK"
else
    echo "❌ Start session: FAIL"
fi

echo ""
echo "======================================"
echo "  PASO 4: VERIFICACIÓN FINAL"
echo "======================================"
echo ""

# 4.1 Verificar puerto escuchando
echo "🔍 Puertos escuchando:"
netstat -tlnp | grep :8080 || ss -tlnp | grep :8080

echo ""
echo "======================================"
echo "  RESUMEN Y PRÓXIMOS PASOS"
echo "======================================"
echo ""

if [ "$LOCALHOST_RESULT" = "200" ] && [ "$PUBLIC_RESULT" = "200" ]; then
    echo "✅ ¡ÉXITO! Evolution API está corriendo correctamente"
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
elif [ "$LOCALHOST_RESULT" = "200" ] && [ "$PUBLIC_RESULT" != "200" ]; then
    echo "⚠️  Evolution funciona localmente pero NO desde IP pública"
    echo ""
    echo "POSIBLES CAUSAS:"
    echo "1. Firewall del proveedor (Security Groups)"
    echo "2. UFW bloqueando puerto 8080"
    echo "3. Necesitas configurar HTTPS con Caddy"
    echo ""
    echo "SOLUCIÓN RECOMENDADA:"
    echo "Configura HTTPS con Caddy (ver archivo Caddyfile.evolution)"
else
    echo "❌ Evolution API no está respondiendo correctamente"
    echo ""
    echo "TROUBLESHOOTING:"
    echo "1. Ver logs: docker logs evolution --tail 50"
    echo "2. Verificar contenedor: docker ps"
    echo "3. Reiniciar: docker restart evolution"
fi

echo ""
echo "======================================"
echo "  COMANDOS ÚTILES"
echo "======================================"
echo ""
echo "# Ver logs en tiempo real:"
echo "docker logs -f evolution"
echo ""
echo "# Reiniciar Evolution:"
echo "docker restart evolution"
echo ""
echo "# Ver estado:"
echo "docker ps"
echo ""
echo "# Probar health:"
echo "curl -i http://127.0.0.1:8080/health"
echo ""

