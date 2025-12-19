#!/bin/bash
# Script para configurar Evolution API con la API Key correcta

echo "======================================"
echo "  PASO 1: CONFIGURAR EVOLUTION API"
echo "======================================"
echo ""

# Detener contenedores existentes
echo "[1/5] Deteniendo contenedores existentes..."
docker-compose -f ~/docker-compose.evolution.yml down 2>/dev/null || true
docker stop evolution evolution-redis evolution-postgres 2>/dev/null || true
docker rm evolution evolution-redis evolution-postgres 2>/dev/null || true

echo ""
echo "[2/5] Creando docker-compose.evolution.yml..."

# Crear archivo docker-compose
cat > ~/docker-compose.evolution.yml << 'EOF'
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: evolution-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - evolution-net

  postgres:
    image: postgres:15-alpine
    container_name: evolution-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: evolution123
      POSTGRES_DB: evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - evolution-net

  evolution:
    image: atendai/evolution-api:latest
    container_name: evolution
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ~/evolution-data:/evolution/store
    environment:
      # SERVER
      SERVER_URL: "http://31.220.58.83:8080"
      SERVER_PORT: "8080"
      SERVER_HOST: "0.0.0.0"

      # CORS - CRÍTICO PARA VERCEL
      CORS_ORIGIN: "*"
      CORS_METHODS: "GET,POST,PUT,DELETE"
      CORS_CREDENTIALS: "true"

      # AUTHENTICATION
      AUTHENTICATION_TYPE: "apikey"
      AUTHENTICATION_API_KEY: "Galle_EVO_KEY_123"
      AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: "true"

      # DATABASE
      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: "postgresql"
      DATABASE_CONNECTION_URI: "postgresql://evolution:evolution123@postgres:5432/evolution"
      DATABASE_SAVE_DATA_INSTANCE: "true"
      DATABASE_SAVE_DATA_NEW_MESSAGE: "false"
      DATABASE_SAVE_DATA_MESSAGE_UPDATE: "false"
      DATABASE_SAVE_DATA_CONTACTS: "false"
      DATABASE_SAVE_DATA_CHATS: "false"

      # REDIS
      REDIS_ENABLED: "true"
      REDIS_URI: "redis://redis:6379"
      CACHE_REDIS_ENABLED: "false"

      # LOGS
      LOG_LEVEL: "ERROR,WARN,DEBUG,INFO"
      LOG_COLOR: "true"
      LOG_BAILEYS: "false"

      # INSTANCE
      DEL_INSTANCE: "false"
      DEL_TEMP_INSTANCES: "true"

      # QRCODE
      QRCODE_LIMIT: "30"
      QRCODE_COLOR: "#198754"

      # WEBHOOK GLOBAL
      WEBHOOK_GLOBAL_ENABLED: "false"

      # WHATSAPP
      WA_BUSINESS_NAME: "GALLE"
      WA_BUSINESS_DESCRIPTION: "Sistema de Gestion de Ventas"

    depends_on:
      - redis
      - postgres
    networks:
      - evolution-net

networks:
  evolution-net:
    driver: bridge

volumes:
  redis_data:
  postgres_data:
EOF

echo "✅ Archivo creado"
echo ""

echo "[3/5] Iniciando contenedores..."
docker-compose -f ~/docker-compose.evolution.yml up -d

echo ""
echo "[4/5] Esperando 30 segundos a que Evolution inicie..."
sleep 30

echo ""
echo "[5/5] Verificando estado..."
echo ""
echo "=== CONTENEDORES ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== PUERTO 8080 ==="
ss -ltnp | grep 8080 || netstat -tlnp | grep 8080

echo ""
echo "=== API KEY CONFIGURADA ==="
docker exec evolution printenv AUTHENTICATION_API_KEY

echo ""
echo "=== PRUEBA SIN API KEY (debe dar 401/403) ==="
curl -i http://127.0.0.1:8080/instance/fetchInstances 2>&1 | head -20

echo ""
echo "=== PRUEBA CON API KEY (debe dar 200) ==="
curl -i -H "apikey: Galle_EVO_KEY_123" http://127.0.0.1:8080/instance/fetchInstances 2>&1 | head -20

echo ""
echo "======================================"
echo "  ✅ CONFIGURACIÓN COMPLETADA"
echo "======================================"
echo ""
echo "API KEY: Galle_EVO_KEY_123"
echo ""
echo "Si la prueba con API Key dio 200, continúa al PASO 2:"
echo "  - Configurar Vercel con EVO_API_KEY=Galle_EVO_KEY_123"
echo ""

