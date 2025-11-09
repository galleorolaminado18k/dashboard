#!/bin/bash
# Script para configurar WAHA correctamente SIN API KEY

cd /root/waha

# Crear docker-compose.yml correcto
cat > docker-compose.yml << 'HEREDOC'
version: '3.8'

services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha
    restart: always
    environment:
      # Binding en todas las interfaces
      WHATSAPP_API_HOSTNAME: "0.0.0.0"
      WAHA_HTTP_API_HOST: "0.0.0.0"

      # Desactivar COMPLETAMENTE autenticación
      WAHA_SECURITY_API_KEY_ENABLED: "false"
      WAHA_SECURITY_DASHBOARD_ENABLED: "false"
      WAHA_SECURITY_SWAGGER_ENABLED: "false"

      # Configuración básica
      WAHA_MULTI_DEVICE: "true"
      WAHA_LOG_LEVEL: "info"
    ports:
      - "3000:3000"
    volumes:
      - ./waha-data:/app/data
HEREDOC

echo "docker-compose.yml creado"
cat docker-compose.yml

echo ""
echo "Reiniciando WAHA..."
docker-compose down
docker-compose up -d

echo ""
echo "Esperando 8 segundos..."
sleep 8

echo ""
echo "=== LOGS WAHA ==="
docker logs waha --tail 15

echo ""
echo "=== VERIFICANDO (debe decir 0.0.0.0:3000) ==="
docker logs waha 2>&1 | grep "running on"

echo ""
echo "=== TEST HEALTH SIN API KEY ==="
curl -i http://localhost:3000/health

echo ""
echo "=== TEST START SIN API KEY ==="
curl -i -X POST http://localhost:3000/api/sessions/default/start

echo ""
echo "Configuracion completada!"

