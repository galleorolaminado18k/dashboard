#!/bin/bash
# 🧪 Script de Verificación Evolution API

echo "🧪 Verificando Evolution API..."
echo ""

# Obtener la URL base desde .env.local o usar default
EVO_URL="${EVO_BASE_URL:-http://31.220.58.83:8080}"

echo "📍 URL a verificar: $EVO_URL"
echo ""

# Test 1: Health check básico
echo "1️⃣ Test: Health Check (GET /)"
curl -s "$EVO_URL/" | head -n 1
echo ""
echo ""

# Test 2: Iniciar sesión
echo "2️⃣ Test: Iniciar Sesión (POST /sessions/start)"
curl -s -X POST "$EVO_URL/sessions/start" \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}' \
  | head -n 5
echo ""
echo ""

# Test 3: Obtener QR
echo "3️⃣ Test: Obtener QR (GET /sessions/default/qrcode)"
RESPONSE=$(curl -s "$EVO_URL/sessions/default/qrcode")
if echo "$RESPONSE" | grep -q "qrcode"; then
  echo "✅ QR obtenido correctamente"
  echo "Longitud de respuesta: ${#RESPONSE} caracteres"
else
  echo "❌ Error obteniendo QR:"
  echo "$RESPONSE"
fi
echo ""
echo ""

# Test 4: Estado de sesión
echo "4️⃣ Test: Estado de Sesión (GET /sessions/default/status)"
curl -s "$EVO_URL/sessions/default/status" | head -n 5
echo ""
echo ""

echo "✅ Verificación completada"
echo ""
echo "📝 Siguiente paso:"
echo "   Si todos los tests pasan, configura en Vercel:"
echo "   EVO_BASE_URL=$EVO_URL"

