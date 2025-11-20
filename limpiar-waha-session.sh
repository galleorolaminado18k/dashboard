#!/bin/bash
# Script para limpiar completamente la sesión de WAHA
# Ejecutar en el VPS

API_KEY="bb841979e8b66e6a0f563235b5df3d9a"
BASE_URL="https://wpp.galle18k.com"

echo "🧹 Limpiando sesión de WAHA completamente..."
echo ""

# 1. Eliminar la sesión completamente
echo "1️⃣ Eliminando sesión 'default'..."
curl -i -s -X DELETE -H "X-Api-Key: $API_KEY" "$BASE_URL/api/sessions/default"
echo ""
sleep 2

# 2. Verificar que no haya sesiones
echo "2️⃣ Verificando sesiones..."
curl -i -s -H "X-Api-Key: $API_KEY" "$BASE_URL/api/sessions"
echo ""
sleep 2

# 3. Reiniciar el contenedor de WAHA
echo "3️⃣ Reiniciando contenedor WAHA..."
docker restart waha-api || true
echo ""

# 4. Esperar 30 segundos
echo "⏳ Esperando 30 segundos a que WAHA reinicie..."
sleep 30

# 5. Verificar logs
echo "4️⃣ Logs de WAHA:"
docker logs waha-api --tail 20 || true
echo ""

# 6. Crear sesión nueva
echo "5️⃣ Creando sesión nueva..."
curl -i -s -X POST -H "X-Api-Key: $API_KEY" -H "Content-Type: application/json" \
  "$BASE_URL/api/sessions" \
  -d '{"name":"default","config":{}}'
echo ""
sleep 2

# 7. Iniciar sesión
echo "6️⃣ Iniciando sesión..."
curl -i -s -X POST -H "X-Api-Key: $API_KEY" "$BASE_URL/api/sessions/default/start"
echo ""
sleep 5

# 8. Verificar estado
echo "7️⃣ Estado de la sesión:"
curl -i -s -H "X-Api-Key: $API_KEY" "$BASE_URL/api/sessions/default"
echo ""
sleep 2

# 9. Obtener QR
echo "8️⃣ Obteniendo QR..."
QR_RESPONSE=$(curl -s -H "X-Api-Key: $API_KEY" "$BASE_URL/api/default/auth/qr")
echo "$QR_RESPONSE"
echo ""

# Verificar si hay qrcode
if echo "$QR_RESPONSE" | grep -q "qrcode\|qr"; then
    echo "✅ ¡QR OBTENIDO EXITOSAMENTE!"
else
    echo "❌ No se pudo obtener QR"
    echo "Logs adicionales:"
    docker logs waha-api --tail 50 || true
fi
