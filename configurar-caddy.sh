#!/bin/bash
# Script para actualizar Caddyfile con configuración correcta de headers

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 PASO 3: CONFIGURAR CADDY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /opt/baileys || exit 1

echo "📝 Respaldando Caddyfile actual..."
if [ -f Caddyfile ]; then
    cp Caddyfile Caddyfile.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup creado"
fi

echo ""
echo "📝 Creando nuevo Caddyfile con todos los headers..."

cat > Caddyfile << 'EOF'
wpp.galle18k.com {
  reverse_proxy waha-api:3000 {
    header_up X-Api-Key {>X-Api-Key}
    header_up x-api-key {>x-api-key}
    header_up Authorization {>Authorization}
    header_up Host {upstream_hostport}
  }
  encode gzip zstd
}
EOF

echo "✅ Caddyfile actualizado"
echo ""
echo "📄 Contenido del nuevo Caddyfile:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat Caddyfile
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔄 Reiniciando Caddy..."
docker-compose restart caddy

echo ""
echo "⏳ Esperando 5 segundos..."
sleep 5

echo ""
echo "📋 Verificando logs de Caddy..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker logs caddy --tail 20
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ PASO 3 COMPLETADO"
echo ""
echo "Caddy ahora reenvía estos headers:"
echo "  • X-Api-Key"
echo "  • x-api-key"
echo "  • Authorization"
echo ""

