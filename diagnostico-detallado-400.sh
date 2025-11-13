#!/bin/bash
# Script para diagnosticar si el problema es CORS

echo "=========================================="
echo "  DIAGNÓSTICO DETALLADO - ERROR 400"
echo "=========================================="
echo ""

# Test 1: Verificar que Evolution esté corriendo
echo "[TEST 1] Verificando que Evolution esté corriendo..."
if docker ps | grep -q "evolution"; then
    echo "✅ Evolution está corriendo"
else
    echo "❌ Evolution NO está corriendo"
    echo "   Solución: docker-compose -f ~/docker-compose.evolution.yml up -d"
    exit 1
fi

echo ""

# Test 2: Verificar API Key
echo "[TEST 2] Verificando API Key..."
API_KEY=$(docker exec evolution printenv AUTHENTICATION_API_KEY 2>/dev/null)
echo "   API Key configurada: $API_KEY"

echo ""

# Test 3: Test directo POST (sin navegador, sin CORS)
echo "[TEST 3] POST directo a /instance/fetchInstances (sin CORS)..."
echo "   Este test simula una petición desde el servidor (NO desde navegador)"
echo ""
HTTP_CODE=$(curl -s -o /tmp/evo_response.txt -w "%{http_code}" \
  -X GET http://127.0.0.1:8080/instance/fetchInstances \
  -H "apikey: Galle_EVO_KEY_123" \
  -H "Content-Type: application/json")

echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" == "200" ]; then
    echo "   ✅ Evolution API funciona correctamente"
    echo "   ✅ API Key es válida"
    echo "   ✅ Headers son correctos"
    echo ""
    echo "   Respuesta: $(cat /tmp/evo_response.txt)"
else
    echo "   ❌ Evolution API rechazó la petición"
    echo "   Respuesta: $(cat /tmp/evo_response.txt)"
    exit 1
fi

echo ""
echo "=========================================="
echo "  PRUEBA CRÍTICA: CORS"
echo "=========================================="
echo ""

# Test 4: OPTIONS preflight (lo que hace el navegador)
echo "[TEST 4] Preflight OPTIONS (simula navegador desde Vercel)..."
echo "   Este test simula lo que hace el navegador ANTES de enviar POST"
echo ""

PREFLIGHT_RESPONSE=$(curl -i -X OPTIONS http://127.0.0.1:8080/instance/create \
  -H "Origin: https://dashboard-galle.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: apikey, content-type" \
  2>&1)

echo "$PREFLIGHT_RESPONSE" > /tmp/preflight_response.txt

# Extraer código HTTP
PREFLIGHT_CODE=$(echo "$PREFLIGHT_RESPONSE" | grep -oP "HTTP/[\d\.]+ \K\d+")

echo "   HTTP Status: $PREFLIGHT_CODE"
echo ""

# Verificar headers CORS
if echo "$PREFLIGHT_RESPONSE" | grep -qi "access-control-allow-origin"; then
    echo "   ✅ CORS CONFIGURADO - Headers encontrados:"
    echo "$PREFLIGHT_RESPONSE" | grep -i "access-control" | sed 's/^/      /'
    echo ""
    echo "   🎯 CONCLUSIÓN: CORS está configurado correctamente"
    echo "   ℹ️  El error 400 NO es por CORS"
    echo ""
    echo "   Posibles causas del error 400:"
    echo "   1. Body de la petición incorrecto"
    echo "   2. Evolution API requiere campos adicionales"
    echo "   3. Versión de Evolution incompatible"
else
    echo "   ❌ CORS NO CONFIGURADO - Headers CORS no encontrados"
    echo ""
    echo "   📋 Respuesta completa:"
    echo "$PREFLIGHT_RESPONSE" | head -20 | sed 's/^/      /'
    echo ""
    echo "   🎯 CONCLUSIÓN: Este es el problema!"
    echo ""
    echo "   ⚠️  El navegador envía OPTIONS y Evolution responde con $PREFLIGHT_CODE"
    echo "   ⚠️  Sin headers CORS, el navegador BLOQUEA la petición POST real"
    echo "   ⚠️  Por eso ves el error 400 en la consola del navegador"
    echo ""
    echo "   ✅ SOLUCIÓN:"
    echo "   Ejecuta el comando del archivo:"
    echo "   ⚡_SOLUCION_DEFINITIVA_CON_CORS.md (PASO 2)"
    echo ""
    echo "   Ese comando agrega estas variables al docker-compose:"
    echo "   - CORS_ORIGIN: \"*\""
    echo "   - CORS_METHODS: \"GET,POST,PUT,DELETE\""
    echo "   - CORS_CREDENTIALS: \"true\""
fi

echo ""
echo "=========================================="
echo "  TEST 5: POST a /instance/create"
echo "=========================================="
echo ""

echo "[TEST 5] POST directo a /instance/create (sin navegador)..."
echo ""

CREATE_RESPONSE=$(curl -i -X POST http://127.0.0.1:8080/instance/create \
  -H "apikey: Galle_EVO_KEY_123" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"test-diagnostic","token":"test123","qrcode":true}' \
  2>&1)

CREATE_CODE=$(echo "$CREATE_RESPONSE" | grep -oP "HTTP/[\d\.]+ \K\d+")

echo "   HTTP Status: $CREATE_CODE"
echo ""

if [ "$CREATE_CODE" == "201" ] || [ "$CREATE_CODE" == "200" ]; then
    echo "   ✅ Endpoint /instance/create funciona correctamente"
    echo "   ✅ El problema definitivamente es CORS"
    echo ""
    echo "   Evolution API acepta peticiones directas (desde servidor)"
    echo "   pero rechaza peticiones del navegador por falta de CORS"
else
    echo "   ⚠️  Endpoint /instance/create respondió: $CREATE_CODE"
    echo ""
    echo "   Respuesta:"
    echo "$CREATE_RESPONSE" | head -30 | sed 's/^/      /'
fi

echo ""
echo "=========================================="
echo "  RESUMEN DEL DIAGNÓSTICO"
echo "=========================================="
echo ""

if echo "$PREFLIGHT_RESPONSE" | grep -qi "access-control-allow-origin"; then
    echo "   ✅ CORS: Configurado"
    echo "   ✅ API: Funcionando"
    echo "   ✅ API Key: Válida"
    echo ""
    echo "   ℹ️  Si aún ves el error 400, el problema puede ser:"
    echo "   1. Caché del navegador"
    echo "   2. Vercel necesita redeploy"
    echo "   3. Body de la petición desde el frontend"
else
    echo "   ❌ CORS: NO configurado (ESTE ES EL PROBLEMA)"
    echo "   ✅ API: Funcionando"
    echo "   ✅ API Key: Válida"
    echo ""
    echo "   🎯 ACCIÓN REQUERIDA:"
    echo "   Ejecuta el comando del PASO 2 en:"
    echo "   ⚡_SOLUCION_DEFINITIVA_CON_CORS.md"
fi

echo ""
echo "=========================================="
echo ""

# Limpiar archivos temporales
rm -f /tmp/evo_response.txt /tmp/preflight_response.txt

