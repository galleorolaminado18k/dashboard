#!/usr/bin/env bash
set -euo pipefail

# ================================================================
# Script de despliegue para WhatsApp Gateway (BuilderBot)
# ================================================================
# USO: chmod +x setup-wa-gateway.sh && sudo ./setup-wa-gateway.sh
# ================================================================

PORT=3010
SITENAME="wa-gateway"
APP_DIR="/root/whatsapp-gateway"

echo "================================================"
echo "🤖 WhatsApp Gateway - BuilderBot Setup"
echo "================================================"

# 1) Instalar Node.js si no existe
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2) Instalar PM2 si no existe
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# 3) Firewall
echo "🔥 Configurando firewall..."
if command -v ufw &>/dev/null; then
    sudo ufw allow $PORT/tcp || true
    sudo ufw allow 'Nginx Full' || true
    sudo ufw --force enable || true
    sudo ufw reload || true
fi

# 4) Crear directorio de la app
echo "📁 Configurando directorio de la aplicación..."
mkdir -p $APP_DIR
cd $APP_DIR

# 5) Verificar si existe package.json (si no, clonar o copiar)
if [ ! -f "package.json" ]; then
    echo "⚠️  No se encontró package.json en $APP_DIR"
    echo "   Por favor copia los archivos del gateway primero:"
    echo "   scp -r whatsapp-gateway/* root@IP_VPS:$APP_DIR/"
    exit 1
fi

# 6) Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# 7) Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "PORT=$PORT" > .env
    echo "✅ Archivo .env creado"
fi

# 8) Instalar nginx si no existe
echo "🌐 Configurando Nginx..."
if ! command -v nginx &>/dev/null; then
    sudo apt update -y
    sudo apt install -y nginx
fi

# 9) Crear configuración nginx
NGINX_CONF="/etc/nginx/sites-available/$SITENAME"
sudo tee $NGINX_CONF > /dev/null <<NGINX
server {
    listen 80;
    server_name _;

    access_log /var/log/nginx/wa-gateway.access.log;
    error_log /var/log/nginx/wa-gateway.error.log;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts extendidos para conexiones WebSocket
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX

# 10) Habilitar site
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/$SITENAME
sudo nginx -t
sudo systemctl reload nginx

# 11) Configurar PM2
echo "🚀 Iniciando aplicación con PM2..."
pm2 delete $SITENAME 2>/dev/null || true
pm2 start index.js --name $SITENAME
pm2 save
pm2 startup || true

# 12) Mostrar estado
echo ""
echo "================================================"
echo "✅ WhatsApp Gateway desplegado exitosamente!"
echo "================================================"
echo ""
echo "📊 Estado:"
pm2 status
echo ""
echo "🌐 Endpoints:"
IP=$(curl -s ipinfo.io/ip || echo "TU_IP")
echo "   - Health:  http://$IP/health"
echo "   - QR:      http://$IP/qr"
echo "   - Status:  http://$IP/status"
echo ""
echo "📱 Configura en Vercel:"
echo "   BAILEYS_GATEWAY_URL=http://$IP"
echo ""
echo "📝 Comandos útiles:"
echo "   pm2 logs $SITENAME    # Ver logs"
echo "   pm2 restart $SITENAME # Reiniciar"
echo "   pm2 stop $SITENAME    # Detener"
echo ""
