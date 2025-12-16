#!/bin/bash
# Script para actualizar el gateway de WhatsApp en el VPS
# Ejecutar como: bash update-gateway.sh

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ACTUALIZANDO GATEWAY DE WHATSAPP                        ║"
echo "╚══════════════════════════════════════════════════════════╝"

cd /root/whatsapp-gateway || { echo "Error: No existe /root/whatsapp-gateway"; exit 1; }

echo ""
echo "[1/4] Deteniendo gateway actual..."
pm2 stop gateway 2>/dev/null || true

echo ""
echo "[2/4] Haciendo backup..."
cp gateway-updated.js gateway-backup-$(date +%Y%m%d%H%M%S).js 2>/dev/null || true

echo ""
echo "[3/4] Descargando nuevo gateway..."
# Intentar descargar desde GitHub
REPO_URL="https://raw.githubusercontent.com/galleaprobaciones/dashboard/main/whatsapp-gateway/gateway-updated.js"

if curl -sL "$REPO_URL" -o gateway-new.js && [ -s gateway-new.js ]; then
    # Verificar que tenga mediaData
    if grep -q "mediaData" gateway-new.js; then
        mv gateway-new.js gateway-updated.js
        echo "✓ Gateway descargado correctamente"
    else
        echo "⚠ El archivo descargado no tiene los cambios. Usando archivo actual."
        rm -f gateway-new.js
    fi
else
    echo "⚠ No se pudo descargar. Verifica que el repo sea público o usa el contenido manual."
    rm -f gateway-new.js
fi

echo ""
echo "[4/4] Iniciando gateway..."
pm2 delete gateway 2>/dev/null || true
pm2 start gateway-updated.js --name gateway

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  VERIFICANDO...                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

sleep 3

# Verificar que esté corriendo
if pm2 list | grep -q "gateway.*online"; then
    echo "✓ Gateway está corriendo"

    # Verificar health
    HEALTH=$(curl -s http://localhost:3010/health)
    echo "Health: $HEALTH"

    # Verificar que tenga soporte para mediaData
    if grep -q "mediaData" gateway-updated.js; then
        echo "✓ Soporte para mediaData (base64) habilitado"
    else
        echo "⚠ Falta soporte para mediaData"
    fi
else
    echo "✗ Error: Gateway no está corriendo"
    echo "Logs:"
    pm2 logs gateway --lines 20
fi

echo ""
echo "Para ver logs en tiempo real: pm2 logs gateway"

