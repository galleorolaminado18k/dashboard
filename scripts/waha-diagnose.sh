#!/usr/bin/env bash
# Script de diagnóstico WAHA para VPS
# Uso: ./scripts/waha-diagnose.sh [WAHA_URL] [WAHA_API_KEY]
# Ejemplo: ./scripts/waha-diagnose.sh http://127.0.0.1:3000 myapikey
set -euo pipefail

WAHA_URL="${1:-${WAHA_BASE_URL:-http://127.0.0.1:3000}}"
WAHA_API_KEY="${2:-${WAHA_API_KEY:-}}"

echo "=== WAHA DIAGNOSIS ==="
echo "WAHA_URL = $WAHA_URL"
echo "WAHA_API_KEY present: ${WAHA_API_KEY:+YES}
"
# 1) Docker: contenedores
echo "[STEP 1] Docker containers (docker ps)"
if command -v docker >/dev/null 2>&1; then
  docker ps --format "table {{.Names}}	{{.Status}}	{{.Image}}" | sed -n '1,200p'
else
  echo "docker no está instalado o no está en PATH"
fi

# Try to detect WAHA container name
WAHA_CONTAINER=$(docker ps --format "{{.Names}}" 2>/dev/null | grep -Ei "waha|waha-api|waha-whatsapp|wpp|baileys" | head -n1 || true)
if [ -n "$WAHA_CONTAINER" ]; then
  echo "\n[INFO] WAHA container detectado: $WAHA_CONTAINER"
  echo "[STEP 1.1] Últimas 80 líneas de logs de $WAHA_CONTAINER"
  docker logs --tail 80 "$WAHA_CONTAINER" || true
  echo "\n[STEP 1.2] Variables de entorno dentro del contenedor (grep WAHA):"
  docker exec "$WAHA_CONTAINER" /bin/sh -c 'printenv | grep WAHA || true' || docker exec "$WAHA_CONTAINER" /bin/bash -c 'printenv | grep WAHA || true' || true
else
  echo "\n[WARN] No se detectó un contenedor WAHA por nombre. Usa 'docker ps' para localizarlo."
fi

# small helper to perform curl and show status+body
function curl_show() {
  local method=$1; shift
  local url=$1; shift
  local hdr=""
  if [ -n "$WAHA_API_KEY" ]; then
    hdr=( -H "X-Api-Key: $WAHA_API_KEY" )
  fi
  echo "\n>> $method $url"
  # capture body and code
  HTTP_RESPONSE=$(curl -sS -w "\n%{http_code}" -X "$method" "${hdr[@]}" "$url" "$@" 2>&1) || true
  # split
  HTTP_BODY=$(echo "$HTTP_RESPONSE" | sed '$d')
  HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -n1)
  echo "HTTP_STATUS: $HTTP_CODE"
  echo "BODY:"
  echo "$HTTP_BODY" | sed -n '1,200p'
}

# 2) Health
curl_show GET "$WAHA_URL/health"
# Also server version endpoint if exists
curl_show GET "$WAHA_URL/api/server/version"

# 3) List sessions
curl_show GET "$WAHA_URL/api/sessions"

# 4) Get default session (may return 404/422)
curl_show GET "$WAHA_URL/api/sessions/default"

# 5) Start session (POST)
curl_show POST "$WAHA_URL/api/sessions/default/start"

# 6) Get session status after start
sleep 2
curl_show GET "$WAHA_URL/api/sessions/default"

# 7) Try to get QR
curl_show GET "$WAHA_URL/api/sessions/default/auth/qr"

# 8) Additional helpful checks
echo "\n[STEP X] Comprobar Caddy/Nginx (si existe): revisar si hay configuracion de proxy y header_up X-Api-Key"
if [ -f /etc/caddy/Caddyfile ]; then
  echo "\n--- /etc/caddy/Caddyfile ---"
  sed -n '1,200p' /etc/caddy/Caddyfile || true
fi
if [ -f /etc/nginx/nginx.conf ]; then
  echo "\n--- /etc/nginx/nginx.conf ---"
  sed -n '1,200p' /etc/nginx/nginx.conf || true
fi

echo "\n=== FIN DIAGNOSTICO ==="

echo "Notas: \n- Si WAHA responde 401/403, verifica que WAHA_API_KEY coincida con la variable en el .env del contenedor.\n- Si WAHA no responde desde Vercel, asegúrate que WAHA_BASE_URL en Vercel apunte a una URL pública HTTPS y que no sea localhost."

