#!/bin/bash

# ===================================================================
# DIAGNÓSTICO COMPLETO Y SOLUCIÓN DEFINITIVA
# Ejecutar: bash diagnostico-completo.sh
# ===================================================================

echo "======================================"
echo "  DIAGNÓSTICO EVOLUTION API"
echo "======================================"
echo ""

echo "🔍 1. Ver contenedores corriendo:"
docker ps -a | grep -E 'evolution|postgres|caddy|waha' || echo "No hay contenedores relacionados"

echo ""
echo "🔍 2. Ver qué usa el puerto 8080:"
netstat -tulpn | grep :8080 || ss -tulpn | grep :8080 || echo "Puerto 8080 libre"

echo ""
echo "🛑 3. LIMPIEZA TOTAL - Deteniendo TODO:"
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
fuser -k 8080/tcp 2>/dev/null || true

echo ""
echo "⏳ Esperando 5 segundos..."
sleep 5

echo ""
echo "🚀 4. Levantando Evolution API (versión mínima):"
docker run -d \
  --name evolution \
  --restart unless-stopped \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e SERVER_URL=http://localhost:8080 \
  -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  atendai/evolution-api:latest

echo ""
echo "⏳ Esperando 30 segundos para que Evolution inicie..."
sleep 30

echo ""
echo "======================================"
echo "  LOGS DE EVOLUTION"
echo "======================================"
docker logs evolution --tail 50

echo ""
echo "======================================"
echo "  PRUEBAS DE CONECTIVIDAD"
echo "======================================"

echo ""
echo "🧪 PRUEBA 1: Health desde localhost"
curl -i http://127.0.0.1:8080/health 2>&1 | head -15

echo ""
echo "🧪 PRUEBA 2: Health desde IP pública"
curl -i http://31.220.58.83:8080/health 2>&1 | head -15

echo ""
echo "======================================"
echo "  ESTADO DEL FIREWALL"
echo "======================================"
ufw status | grep 8080 || echo "Puerto 8080 NO está abierto en UFW"

echo ""
echo "======================================"
echo "  RESUMEN"
echo "======================================"
echo ""
echo "Si las pruebas responden 200 OK:"
echo "✅ Configurar en Vercel:"
echo "   EVO_BASE_URL = http://31.220.58.83:8080"
echo "   EVO_API_KEY = 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
echo ""
echo "Si las pruebas NO responden:"
echo "❌ Ver logs arriba y ejecutar:"
echo "   docker logs evolution"
echo ""

