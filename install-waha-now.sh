#!/bin/bash
# Script de instalación completo WAHA

echo "Instalando WAHA..."
apt update -y
apt install -y curl docker.io docker-compose ufw
systemctl start docker
systemctl enable docker
ufw --force enable
ufw allow 22/tcp
ufw allow 3000/tcp
mkdir -p /opt/waha
cd /opt/waha

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
EOF

docker-compose up -d
sleep 30
curl http://localhost:3000/health
echo ""
echo "✅ WAHA instalado en: http://$(curl -s ifconfig.me):3000"

