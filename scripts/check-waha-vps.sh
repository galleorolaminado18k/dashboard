# Script para verificar WAHA en VPS
# Ejecutar: bash scripts/check-waha-vps.sh

echo "========================================"
echo "  VERIFICACION WAHA EN VPS"
echo "========================================"
echo ""

VPS_IP="31.220.58.83"
API_KEY="d8c776b78aee40d4b9bf75c633d175c8"

echo "1. Verificando contenedor WAHA..."
echo "   Comando: ssh root@$VPS_IP 'docker ps | grep waha'"
echo ""

echo "2. Verificando variables de entorno..."
echo "   Comando: ssh root@$VPS_IP 'docker exec waha env | grep WAHA_'"
echo ""

echo "3. Test de salud CON API Key..."
echo "   curl -i -H \"X-Api-Key: $API_KEY\" http://$VPS_IP:3000/health"
curl -i -H "X-Api-Key: $API_KEY" "http://$VPS_IP:3000/health"
echo ""

echo "4. Test de salud SIN API Key (debe dar 401/403)..."
echo "   curl -i http://$VPS_IP:3000/health"
curl -i "http://$VPS_IP:3000/health"
echo ""

echo "========================================"
echo "  RESULTADOS ESPERADOS"
echo "========================================"
echo "Con header: 200 OK"
echo "Sin header: 401/403 Unauthorized"
echo ""
echo "Si con header da 403:"
echo "  - La clave no coincide"
echo "  - WAHA tiene el hash mal configurado"
echo ""

