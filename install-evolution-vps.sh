#!/bin/bash
# 🚀 Script de Instalación Evolution API en VPS
# Uso: bash install-evolution-vps.sh

set -e

echo "🚀 Instalando Evolution API en VPS..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Detener WAHA si existe
echo -e "${YELLOW}📦 Paso 1: Limpiando WAHA antiguo...${NC}"
cd ~ || true
if [ -d "waha" ]; then
  cd waha
  docker compose down 2>/dev/null || true
  cd ..
fi
docker rm -f waha 2>/dev/null || true
echo -e "${GREEN}✅ Limpieza completada${NC}"
echo ""

# 2. Configurar firewall
echo -e "${YELLOW}🔥 Paso 2: Configurando firewall...${NC}"
ufw allow 8080/tcp 2>/dev/null || echo "UFW no disponible, saltando..."
echo -e "${GREEN}✅ Puerto 8080 abierto${NC}"
echo ""

# 3. Crear directorio para Evolution
echo -e "${YELLOW}📁 Paso 3: Creando directorio...${NC}"
mkdir -p ~/evolution
cd ~/evolution
echo -e "${GREEN}✅ Directorio creado: ~/evolution${NC}"
echo ""

# 4. Instalar Evolution API
echo -e "${YELLOW}🐳 Paso 4: Instalando Evolution API...${NC}"
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v $PWD/evolution-data:/evolution/store \
  -e SERVER_PORT=8080 \
  -e LOG_LEVEL=INFO \
  atendai/evolution-api:latest

echo -e "${GREEN}✅ Evolution API instalado${NC}"
echo ""

# 5. Esperar que inicie
echo -e "${YELLOW}⏳ Esperando que Evolution API inicie (10s)...${NC}"
sleep 10

# 6. Verificar health
echo -e "${YELLOW}🏥 Paso 5: Verificando salud del servicio...${NC}"
HEALTH=$(curl -s http://localhost:8080/health || echo "error")

if [[ $HEALTH == *"ok"* ]]; then
  echo -e "${GREEN}✅ Evolution API está funcionando correctamente!${NC}"
else
  echo -e "${RED}❌ Error: Evolution API no responde${NC}"
  echo "Verificando logs..."
  docker logs evolution-api --tail 20
  exit 1
fi
echo ""

# 7. Obtener IP pública
echo -e "${YELLOW}🌐 Obteniendo IP pública...${NC}"
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "NO_DETECTADA")
echo -e "${GREEN}✅ IP Pública: ${PUBLIC_IP}${NC}"
echo ""

# 8. Resumen final
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 ¡Instalación Completada!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📍 Evolution API está corriendo en:"
echo "   http://${PUBLIC_IP}:8080"
echo ""
echo "🧪 Prueba el servicio:"
echo "   curl http://${PUBLIC_IP}:8080/health"
echo ""
echo "📝 Configura en Vercel:"
echo "   Variable: EVO_BASE_URL"
echo "   Valor: http://${PUBLIC_IP}:8080"
echo ""
echo "🔐 Para HTTPS con dominio:"
echo "   1. Configura DNS: whats.tudominio.com → ${PUBLIC_IP}"
echo "   2. Usa: docker compose -f docker-compose.evolution-caddy.yml up -d"
echo "   3. Luego: EVO_BASE_URL=https://whats.tudominio.com"
echo ""
echo "📊 Ver logs:"
echo "   docker logs evolution-api -f"
echo ""
echo "🔄 Reiniciar:"
echo "   docker restart evolution-api"
echo ""
echo "🗑️ Detener:"
echo "   docker stop evolution-api"
echo ""
echo "═══════════════════════════════════════════════════════════════"

