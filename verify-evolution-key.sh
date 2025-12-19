#!/bin/bash

# ===================================================
# SCRIPT: Verificar API Key de Evolution API
# Copiar y pegar en el VPS
# ===================================================

echo "======================================"
echo "  VERIFICACIÓN EVOLUTION API"
echo "======================================"
echo ""

echo "1️⃣  Verificando si Evolution está corriendo..."
if docker ps | grep -q evolution-api; then
    echo "✅ Evolution API está corriendo"
    echo ""
else
    echo "❌ Evolution API NO está corriendo"
    echo ""
    echo "Para levantarlo con autenticación, ejecuta:"
    echo ""
    echo "docker run -d --name evolution-api --restart=always \\"
    echo "  -p 8080:8080 \\"
    echo "  -v ~/evolution-data:/evolution/store \\"
    echo "  -e API_KEY=galle-super-key \\"
    echo "  -e AUTHENTICATION=true \\"
    echo "  atendai/evolution-api:latest"
    echo ""
    exit 1
fi

echo "2️⃣  Buscando API Key configurada..."
echo ""

API_KEY=$(docker exec evolution-api printenv 2>/dev/null | grep -E '^API_KEY=' | cut -d'=' -f2)
AUTH_API_KEY=$(docker exec evolution-api printenv 2>/dev/null | grep -E '^AUTHENTICATION_API_KEY=' | cut -d'=' -f2)

if [ -n "$API_KEY" ]; then
    echo "✅ API_KEY encontrada:"
    echo ""
    echo "   API_KEY=$API_KEY"
    echo ""
    echo "📋 COPIAR ESTA CLAVE PARA VERCEL:"
    echo ""
    echo "   Variable Name:  EVO_API_KEY"
    echo "   Variable Value: $API_KEY"
    echo ""
elif [ -n "$AUTH_API_KEY" ]; then
    echo "✅ AUTHENTICATION_API_KEY encontrada:"
    echo ""
    echo "   AUTHENTICATION_API_KEY=$AUTH_API_KEY"
    echo ""
    echo "📋 COPIAR ESTA CLAVE PARA VERCEL:"
    echo ""
    echo "   Variable Name:  EVO_API_KEY"
    echo "   Variable Value: $AUTH_API_KEY"
    echo ""
else
    echo "⚠️  NO se encontró ninguna API Key configurada"
    echo ""
    echo "Esto significa que Evolution NO tiene autenticación activa."
    echo ""
    echo "OPCIÓN 1 (Sin autenticación - solo para desarrollo):"
    echo "  En Vercel, configurar SOLO:"
    echo "    EVO_BASE_URL = http://31.220.58.83:8080"
    echo ""
    echo "OPCIÓN 2 (Con autenticación - RECOMENDADO):"
    echo "  1. Detener Evolution:"
    echo "     docker rm -f evolution-api"
    echo ""
    echo "  2. Levantar con API Key:"
    echo "     docker run -d --name evolution-api --restart=always \\"
    echo "       -p 8080:8080 \\"
    echo "       -v ~/evolution-data:/evolution/store \\"
    echo "       -e API_KEY=galle-super-key \\"
    echo "       -e AUTHENTICATION=true \\"
    echo "       atendai/evolution-api:latest"
    echo ""
    echo "  3. En Vercel, configurar:"
    echo "     EVO_BASE_URL = http://31.220.58.83:8080"
    echo "     EVO_API_KEY = galle-super-key"
    echo ""
fi

echo "3️⃣  Probando conexión..."
echo ""

if [ -n "$API_KEY" ] || [ -n "$AUTH_API_KEY" ]; then
    KEY="${API_KEY:-$AUTH_API_KEY}"
    echo "Probando con autenticación..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health -H "apikey: $KEY")

    if [ "$RESPONSE" = "200" ]; then
        echo "✅ Health check exitoso (200 OK)"
        echo ""
        echo "🎉 TODO LISTO PARA CONFIGURAR EN VERCEL"
        echo ""
        echo "======================================"
        echo "  CONFIGURACIÓN PARA VERCEL"
        echo "======================================"
        echo ""
        echo "Name: EVO_BASE_URL"
        echo "Value: http://31.220.58.83:8080"
        echo ""
        echo "Name: EVO_API_KEY"
        echo "Value: $KEY"
        echo ""
        echo "Después de agregar estas variables:"
        echo "1. Guarda los cambios"
        echo "2. Redeploy el proyecto"
        echo "3. Prueba en /configuracion"
        echo ""
    else
        echo "⚠️  Health check falló (HTTP $RESPONSE)"
        echo ""
        echo "Posibles causas:"
        echo "- Evolution no está completamente iniciado (espera 30 segundos)"
        echo "- La clave no es correcta"
        echo "- Evolution usa otro método de autenticación"
        echo ""
    fi
else
    echo "Probando sin autenticación..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)

    if [ "$RESPONSE" = "200" ]; then
        echo "✅ Health check exitoso (200 OK)"
        echo "⚠️  Evolution está corriendo SIN autenticación"
        echo ""
        echo "======================================"
        echo "  CONFIGURACIÓN PARA VERCEL"
        echo "======================================"
        echo ""
        echo "Name: EVO_BASE_URL"
        echo "Value: http://31.220.58.83:8080"
        echo ""
        echo "(NO agregar EVO_API_KEY)"
        echo ""
    elif [ "$RESPONSE" = "401" ]; then
        echo "❌ Health check falló (401 Unauthorized)"
        echo ""
        echo "Evolution tiene autenticación ACTIVA pero no pudimos detectar la clave."
        echo ""
        echo "Para ver todas las variables:"
        echo "docker exec evolution-api printenv | grep -i auth"
        echo ""
    else
        echo "❌ Health check falló (HTTP $RESPONSE)"
        echo ""
        echo "Ver logs:"
        echo "docker logs evolution-api --tail 50"
        echo ""
    fi
fi

echo "======================================"
echo ""

