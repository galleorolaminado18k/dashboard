#!/bin/bash
# Script para actualizar el gateway en el VPS
# Ejecutar: bash EJECUTAR_EN_VPS.sh

echo "=========================================="
echo "ACTUALIZANDO GATEWAY CON WEBHOOK"
echo "=========================================="
echo ""

# 1. Hacer backup
echo "[1/5] Haciendo backup del archivo actual..."
cp /root/whatsapp-gateway/index.js /root/whatsapp-gateway/index.js.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup creado"

# 2. Reemplazar archivo
echo ""
echo "[2/5] Reemplazando index.js..."
if [ -f /root/whatsapp-gateway/index-webhook.js ]; then
    mv /root/whatsapp-gateway/index-webhook.js /root/whatsapp-gateway/index.js
    echo "✅ Archivo reemplazado"
else
    echo "❌ No se encontró index-webhook.js"
    exit 1
fi

# 3. Instalar node-fetch si es necesario
echo ""
echo "[3/5] Verificando node-fetch..."
cd /root/whatsapp-gateway
if ! grep -q "node-fetch" package.json; then
    echo "Instalando node-fetch..."
    npm install node-fetch@2
else
    echo "✅ node-fetch ya está instalado"
fi

# 4. Reiniciar PM2
echo ""
echo "[4/5] Reiniciando gateway con PM2..."
pm2 restart whatsapp-gateway || pm2 start index.js --name whatsapp-gateway
echo "✅ Gateway reiniciado"

# 5. Ver logs
echo ""
echo "[5/5] Mostrando logs (Ctrl+C para salir)..."
echo "=========================================="
pm2 logs whatsapp-gateway --lines 30
