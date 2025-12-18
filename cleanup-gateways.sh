#!/bin/bash
# Script para limpiar gateways duplicados y dejar solo el correcto

echo "=== Deteniendo gateways duplicados ==="
pm2 stop whatsapp-gateway
pm2 delete whatsapp-gateway
pm2 delete 0

echo "=== Estado final ==="
pm2 list

echo "=== Verificando logs del gateway activo ==="
pm2 logs gateway --lines 20 --nostream
