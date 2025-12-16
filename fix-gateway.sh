#!/bin/bash
# Script para reiniciar el gateway WhatsApp
# Ejecutar en VPS: bash fix-gateway.sh

echo "🛑 Deteniendo gateway..."
pm2 delete wa-gateway 2>/dev/null || true

echo "📁 Limpiando sesiones..."
cd /root/whatsapp-gateway
rm -rf auth_info_baileys bot_sessions node_modules/.cache

echo "🚀 Iniciando gateway..."
pm2 start index.js --name wa-gateway --no-autorestart

echo "⏳ Esperando 25 segundos..."
sleep 25

echo ""
echo "=== PM2 STATUS ==="
pm2 status

echo ""
echo "=== LOGS ==="
pm2 logs wa-gateway --lines 40 --nostream

echo ""
echo "=== HEALTH ==="
curl -s http://localhost:3010/health || echo "❌ No responde"

echo ""
echo "=== QR ==="
curl -s http://localhost:3010/qr | head -c 200 || echo "❌ No responde"

echo ""
echo "✅ Listo! Si ves hasQR:true, el gateway está funcionando."

