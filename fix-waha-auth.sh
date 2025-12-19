#!/bin/bash

echo "🔧 Corrigiendo configuración de WAHA..."

cd /opt/waha

# Detener WAHA actual
docker-compose down

# Crear nueva configuración SIN autenticación
cat > docker-compose.yml <<'EOF'
version: '3.8'
services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha-production
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - WAHA_HTTP_API_HOST=0.0.0.0
      - WAHA_LICENSE_ACCEPT=true
      - WAHA_LOG_LEVEL=info
      - WAHA_MULTI_DEVICE=true
      - WAHA_SECURITY_ENABLE=false
EOF

# Reiniciar WAHA
docker-compose up -d

echo "⏳ Esperando 30 segundos..."
sleep 30

echo "🧪 Verificando..."
curl -s http://localhost:3000/health

echo ""
echo "✅ WAHA corregido"
echo "URL: http://$(curl -s ifconfig.me):3000"

