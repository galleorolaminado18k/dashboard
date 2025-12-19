#!/bin/bash

# ===================================================================
# SCRIPT - CONFIGURAR HTTPS CON CADDY PARA EVOLUTION API
# Ejecutar DESPUÉS de setup-evolution-vps.sh
# Requiere: Dominio apuntando a 31.220.58.83
# ===================================================================

set -e

echo "======================================"
echo "  CONFIGURAR HTTPS CON CADDY"
echo "======================================"
echo ""

# Verificar que Evolution esté corriendo
if ! docker ps | grep -q evolution; then
    echo "❌ Error: Evolution no está corriendo"
    echo "Ejecuta primero: bash setup-evolution-vps.sh"
    exit 1
fi

echo "✅ Evolution está corriendo"
echo ""

# Solicitar dominio
read -p "Ingresa tu dominio (ej: api.tudominio.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Debes ingresar un dominio"
    exit 1
fi

echo ""
echo "📝 Configurando Caddy para: $DOMAIN"
echo ""

# Crear Caddyfile
cat > ~/Caddyfile << EOF
# Configuración HTTPS automática para Evolution API
$DOMAIN {
  # Reverse proxy a Evolution API local
  reverse_proxy 127.0.0.1:8080 {
    # Timeouts generosos para WhatsApp
    transport http {
      dial_timeout   10s
      read_timeout   90s
      write_timeout  90s
    }
  }

  # Headers CORS
  header {
    Access-Control-Allow-Origin *
    Access-Control-Allow-Methods "GET, POST, DELETE, OPTIONS"
    Access-Control-Allow-Headers "Content-Type, Authorization, apikey"
  }

  # Logs
  log {
    output file /var/log/caddy/evolution.log
    level INFO
  }
}
EOF

echo "✅ Caddyfile creado"
echo ""

# Detener Caddy si ya existe
docker stop caddy 2>/dev/null || true
docker rm caddy 2>/dev/null || true

# Levantar Caddy
echo "🚀 Levantando Caddy..."
docker run -d --name caddy \
  --restart unless-stopped \
  --network host \
  -v ~/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  -v caddy_config:/config \
  caddy:2

echo "⏳ Esperando 10 segundos para que Caddy inicie..."
sleep 10

# Verificar logs
echo ""
echo "📜 Logs de Caddy:"
docker logs caddy --tail 20

echo ""
echo "======================================"
echo "  VERIFICAR DNS"
echo "======================================"
echo ""

# Resolver DNS
echo "🔍 Verificando DNS de $DOMAIN..."
RESOLVED_IP=$(dig +short $DOMAIN | tail -1)

if [ -z "$RESOLVED_IP" ]; then
    echo "❌ DNS no está configurado todavía"
    echo ""
    echo "CONFIGURA EN TU PROVEEDOR DE DOMINIO:"
    echo "Tipo: A"
    echo "Nombre: $(echo $DOMAIN | cut -d'.' -f1)"
    echo "Valor: 31.220.58.83"
    echo "TTL: 300"
    echo ""
    echo "Espera 5-10 minutos y vuelve a ejecutar este script"
elif [ "$RESOLVED_IP" = "31.220.58.83" ]; then
    echo "✅ DNS configurado correctamente: $DOMAIN → $RESOLVED_IP"
else
    echo "⚠️  DNS apunta a otra IP: $RESOLVED_IP"
    echo "Debe apuntar a: 31.220.58.83"
fi

echo ""
echo "======================================"
echo "  CONFIGURAR FIREWALL"
echo "======================================"
echo ""

if command -v ufw &> /dev/null; then
    echo "🔥 Abriendo puertos 80 y 443..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw reload

    echo ""
    echo "📋 Estado del firewall:"
    ufw status numbered
else
    echo "⚠️  UFW no instalado"
fi

echo ""
echo "======================================"
echo "  PRUEBAS"
echo "======================================"
echo ""

# Probar HTTP (debe redirigir a HTTPS)
echo "🧪 Probando HTTP (debe redirigir a HTTPS)..."
curl -I http://$DOMAIN/health 2>/dev/null | head -3

echo ""

# Probar HTTPS
echo "🧪 Probando HTTPS..."
sleep 5
HTTPS_RESULT=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health 2>/dev/null || echo "FAIL")

if [ "$HTTPS_RESULT" = "200" ]; then
    echo "✅ HTTPS funcionando correctamente!"
elif [ "$HTTPS_RESULT" = "000" ]; then
    echo "⚠️  Esperando certificado SSL..."
    echo "Esto puede tardar 1-2 minutos la primera vez"
    echo ""
    echo "Verifica los logs: docker logs caddy"
else
    echo "❌ HTTPS falló (HTTP $HTTPS_RESULT)"
    echo ""
    echo "Ver logs: docker logs caddy"
fi

echo ""
echo "======================================"
echo "  CONFIGURAR EN VERCEL"
echo "======================================"
echo ""

if [ "$HTTPS_RESULT" = "200" ]; then
    echo "✅ Todo listo! Configura en Vercel:"
    echo ""
    echo "Name: EVO_BASE_URL"
    echo "Value: https://$DOMAIN"
    echo ""
    echo "Name: EVO_API_KEY"
    echo "Value: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
    echo ""
    echo "Luego: Redeploy"
else
    echo "⚠️  Espera unos minutos y verifica:"
    echo ""
    echo "curl -i https://$DOMAIN/health"
    echo ""
    echo "Si el DNS está bien, Caddy generará el certificado automáticamente"
fi

echo ""
echo "======================================"
echo "  COMANDOS ÚTILES"
echo "======================================"
echo ""
echo "# Ver logs de Caddy:"
echo "docker logs -f caddy"
echo ""
echo "# Ver logs de Evolution:"
echo "docker logs -f evolution"
echo ""
echo "# Reiniciar Caddy:"
echo "docker restart caddy"
echo ""
echo "# Ver certificados:"
echo "docker exec caddy caddy list-certificates"
echo ""

