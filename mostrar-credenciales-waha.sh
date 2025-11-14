#!/bin/bash
# Script para mostrar credenciales de WAHA formateadas para Vercel

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 CREDENCIALES WAHA PARA VERCEL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f /opt/baileys/.env ]; then
    echo "❌ No se encontró /opt/baileys/.env"
    exit 1
fi

# Cargar variables
export $(grep -v '^#' /opt/baileys/.env | xargs)

echo "Copiar estas 4 variables a Vercel:"
echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│ Variable 1                                      │"
echo "├─────────────────────────────────────────────────┤"
echo "│ Name:  WAHA_BASE_URL                           │"
echo "│ Value: https://wpp.galle18k.com                │"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│ Variable 2                                      │"
echo "├─────────────────────────────────────────────────┤"
echo "│ Name:  WAHA_API_KEY                            │"
echo "│ Value: $WAHA_API_KEY"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│ Variable 3 (Opcional)                          │"
echo "├─────────────────────────────────────────────────┤"
echo "│ Name:  WAHA_DASHBOARD_USERNAME                 │"
echo "│ Value: $WAHA_DASHBOARD_USERNAME"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│ Variable 4 (Opcional)                          │"
echo "├─────────────────────────────────────────────────┤"
echo "│ Name:  WAHA_DASHBOARD_PASSWORD                 │"
echo "│ Value: $WAHA_DASHBOARD_PASSWORD"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Ir a Vercel:"
echo "   https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables"
echo ""
echo "📝 Pasos:"
echo "   1. Agregar cada variable (Name + Value)"
echo "   2. Click en 'Save'"
echo "   3. Redeploy el proyecto"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   • Eliminar variables antiguas BAILEYS_* si existen"
echo "   • Las variables 3 y 4 son opcionales (solo para dashboard)"
echo ""

