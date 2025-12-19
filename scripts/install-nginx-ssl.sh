#!/bin/bash

# ========================================
# 🔒 INSTALACIÓN NGINX + SSL (Let's Encrypt)
# ========================================

echo "========================================="
echo "🔒 Instalando Nginx + SSL para WAHA"
echo "========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Solicitar dominio
echo "🌐 Ingresa tu dominio (ej: waha.tudominio.com):"
read -r DOMAIN

if [ -z "$DOMAIN" ]; then
    log_error "Dominio requerido"
    exit 1
fi

echo ""
log_warning "IMPORTANTE: Antes de continuar, configura tu DNS:"
echo "   - Crear registro A en tu proveedor DNS"
echo "   - Nombre: $DOMAIN"
echo "   - IP: $(curl -s ifconfig.me)"
echo "   - Esperar propagación (5-10 minutos)"
echo ""
read -p "¿DNS configurado? (y/n): " DNS_READY

if [ "$DNS_READY" != "y" ]; then
    log_warning "Configura el DNS primero y vuelve a ejecutar este script"
    exit 0
fi

# ========================================
# PASO 1: Instalar Nginx
# ========================================
echo ""
echo "📦 [1/4] Instalando Nginx..."

apt update -y
apt install -y nginx

systemctl start nginx
systemctl enable nginx

log_success "Nginx instalado"

# ========================================
# PASO 2: Configurar Nginx para WAHA
# ========================================
echo ""
echo "⚙️  [2/4] Configurando Nginx..."

cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuración
nginx -t

if [ $? -ne 0 ]; then
    log_error "Error en configuración de Nginx"
    exit 1
fi

systemctl reload nginx

log_success "Nginx configurado"

# ========================================
# PASO 3: Instalar Certbot
# ========================================
echo ""
echo "🔐 [3/4] Instalando Let's Encrypt..."

apt install -y certbot python3-certbot-nginx

log_success "Certbot instalado"

# ========================================
# PASO 4: Obtener certificado SSL
# ========================================
echo ""
echo "📜 [4/4] Obteniendo certificado SSL..."

echo "Ingresa tu email para notificaciones de Let's Encrypt:"
read -r EMAIL

certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

if [ $? -eq 0 ]; then
    log_success "Certificado SSL obtenido"
else
    log_error "Error obteniendo certificado SSL"
    log_warning "Verifica que el DNS esté configurado correctamente"
    exit 1
fi

# Auto-renovación
systemctl enable certbot.timer
systemctl start certbot.timer

# ========================================
# INFORMACIÓN FINAL
# ========================================
echo ""
echo "========================================="
echo "✅ NGINX + SSL CONFIGURADO"
echo "========================================="
echo ""
echo "🌐 URL HTTPS: https://$DOMAIN"
echo "🔒 SSL: Activo (Let's Encrypt)"
echo "🔄 Renovación automática: Habilitada"
echo ""
echo "🧪 Verificar:"
echo "   curl https://$DOMAIN/health"
echo "   # Debe responder: {\"status\":\"ok\"}"
echo ""
echo "⚙️  Configurar en Vercel:"
echo "   WAHA_BASE_URL = https://$DOMAIN"
echo ""
echo "========================================="

