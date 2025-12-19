#!/bin/bash
# COMANDO DE UN SOLO PASO - COPIA Y PEGA ESTO EN EL VPS

echo "🔧 APLICANDO FIX CORS - UN SOLO COMANDO"
echo ""

# Detener Evolution
docker-compose -f ~/docker-compose.evolution.yml down 2>/dev/null
docker stop evolution evolution-redis evolution-postgres 2>/dev/null
docker rm evolution evolution-redis evolution-postgres 2>/dev/null

# Crear docker-compose con CORS
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
      SERVER_URL: "http://31.220.58.83:8080"
      SERVER_PORT: "8080"
      SERVER_HOST: "0.0.0.0"
      CORS_ORIGIN: "*"
      CORS_METHODS: "GET,POST,PUT,DELETE"
      CORS_CREDENTIALS: "true"
      AUTHENTICATION_TYPE: "apikey"
      AUTHENTICATION_API_KEY: "Galle_EVO_KEY_123"
      AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: "true"
      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: "postgresql"
      DATABASE_CONNECTION_URI: "postgresql://evolution:evolution123@postgres:5432/evolution"
      DATABASE_SAVE_DATA_INSTANCE: "true"
      DATABASE_SAVE_DATA_NEW_MESSAGE: "false"
      DATABASE_SAVE_DATA_MESSAGE_UPDATE: "false"
      DATABASE_SAVE_DATA_CONTACTS: "false"
      DATABASE_SAVE_DATA_CHATS: "false"
      REDIS_ENABLED: "true"
      REDIS_URI: "redis://redis:6379"
      CACHE_REDIS_ENABLED: "false"
      LOG_LEVEL: "ERROR,WARN,DEBUG,INFO"
      LOG_COLOR: "true"
      LOG_BAILEYS: "false"
      DEL_INSTANCE: "false"
      DEL_TEMP_INSTANCES: "true"
      QRCODE_LIMIT: "30"
      QRCODE_COLOR: "#198754"
      WEBHOOK_GLOBAL_ENABLED: "false"
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

# Iniciar
docker-compose -f ~/docker-compose.evolution.yml up -d

# Esperar
echo "⏳ Esperando 40 segundos..."
sleep 40

# Verificar
echo ""
echo "✅ VERIFICACIÓN:"
echo ""
echo "1. API Key:"
docker exec evolution printenv AUTHENTICATION_API_KEY
echo ""
echo "2. CORS_ORIGIN:"
docker exec evolution printenv CORS_ORIGIN
echo ""
echo "3. Test CORS (debe mostrar access-control-allow-origin):"
curl -i -X OPTIONS http://127.0.0.1:8080/instance/create -H "Origin: https://vercel.app" -H "Access-Control-Request-Method: POST" 2>&1 | grep -i "access-control"
echo ""
echo "4. Test API (debe mostrar HTTP/1.1 200):"
curl -i -H "apikey: Galle_EVO_KEY_123" http://127.0.0.1:8080/instance/fetchInstances 2>&1 | grep HTTP
echo ""
echo "✅ Si ves 'access-control-allow-origin: *' y 'HTTP/1.1 200', está listo!"
echo "   Ahora configura Vercel y haz Redeploy"

