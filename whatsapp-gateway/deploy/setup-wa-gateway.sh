#!/usr/bin/env bash
set -euo pipefail

# Script para configurar firewall y nginx proxy en VPS para whatsapp-gateway
# USO: chmod +x setup-wa-gateway.sh && sudo ./setup-wa-gateway.sh

echo "1) Habilitando UFW y abriendo puerto 3001"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 3001/tcp || true
  sudo ufw allow 'Nginx Full' || true
  sudo ufw reload || true
  sudo ufw status | sed -n '1,200p'
else
  echo "UFW no encontrado; continua sin cambiar firewall"
fi

echo "2) Instalando nginx"
sudo apt update -y
sudo apt install -y nginx

# Deploy Nginx site
SITENAME=/etc/nginx/sites-available/wa-gateway
if [ ! -f "$SITENAME" ]; then
  echo "Creando archivo $SITENAME"
  sudo mkdir -p /etc/nginx/sites-available
  sudo tee $SITENAME > /dev/null <<'NGINX'
server {
    listen 80;
    server_name 31.220.58.83;

    access_log /var/log/nginx/wa-gateway.access.log;
    error_log /var/log/nginx/wa-gateway.error.log;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
  sudo ln -sf /etc/nginx/sites-available/wa-gateway /etc/nginx/sites-enabled/wa-gateway
fi

sudo nginx -t
sudo systemctl reload nginx

echo "3) Reiniciar pm2 process whatsapp-gateway (si existe)"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart whatsapp-gateway || pm2 start index.js --name whatsapp-gateway
  pm2 save || true
fi

echo "Listo. Prueba en: http://$(curl -s ipinfo.io/ip)/status"

