S@ntiago1430
#!/bin/bash

# ========================================
# INSTALACIÓN AUTOMÁTICA WAHA
# Ejecutar: bash install-vps-remote.sh
# ========================================

VPS_IP="31.220.58.83"
VPS_USER="root"
VPS_PASS="S@ntiago"

echo "========================================"
echo "🚀 INSTALANDO WAHA EN VPS"
echo "========================================"
echo ""

# Función para ejecutar comando en VPS
run_ssh() {
    sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "$1"
}

# Función para copiar archivo
copy_file() {
    sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no "$1" "$VPS_USER@$VPS_IP:$2"
}

echo "📦 [1/7] Actualizando sistema..."
run_ssh "apt update -y"

echo "📦 [2/7] Instalando paquetes..."
run_ssh "DEBIAN_FRONTEND=noninteractive apt install -y curl docker.io docker-compose ufw"

echo "🐋 [3/7] Iniciando Docker..."
run_ssh "systemctl start docker && systemctl enable docker"

echo "🔥 [4/7] Configurando firewall..."
run_ssh "ufw --force enable && ufw allow 22/tcp && ufw allow 3000/tcp"

echo "📁 [5/7] Creando directorio..."
run_ssh "mkdir -p /opt/waha"

echo "📝 [6/7] Creando docker-compose.yml..."
cat > /tmp/docker-compose-waha.yml <<'EOF'
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

copy_file "/tmp/docker-compose-waha.yml" "/opt/waha/docker-compose.yml"

echo "🚀 [7/7] Iniciando WAHA..."
run_ssh "cd /opt/waha && docker-compose up -d"

echo "⏳ Esperando 30 segundos..."
sleep 30

echo "🧪 Verificando instalación..."
run_ssh "curl -s http://localhost:3000/health"

echo ""
echo "========================================"
echo "✅ INSTALACIÓN COMPLETADA"
echo "========================================"
echo ""

VPS_PUBLIC_IP=$(run_ssh "curl -s ifconfig.me")
echo "📍 URL de WAHA: http://$VPS_PUBLIC_IP:3000"
echo ""
echo "🔧 Configurar en Vercel:"
echo "   WAHA_BASE_URL = http://$VPS_PUBLIC_IP:3000"
echo ""
echo "========================================"

