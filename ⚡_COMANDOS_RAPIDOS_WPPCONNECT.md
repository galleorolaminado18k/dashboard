# ⚡ COMANDOS RÁPIDOS - WPPCONNECT

## 🎯 INSTALACIÓN EN VPS (UN SOLO COMANDO)

```bash
ssh root@31.220.58.83 << 'ENDSSH'
apt-get update -qq && apt-get install -y docker.io docker-compose-plugin curl && \
systemctl enable docker && systemctl start docker && \
docker ps --format '{{.Names}}' | grep -E 'evolution|waha' | xargs -r docker rm -f && \
mkdir -p /opt/wpp && cd /opt/wpp && \
cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  wppconnect:
    image: wppconnect/server:latest
    container_name: wppconnect
    restart: always
    shm_size: "1gb"
    environment:
      - SERVER_PORT=21465
      - ENABLE_PUBLIC_API=true
      - SECRET_KEY=super-secret-wpp-galle-2025
      - TOKEN=galle-wpp-token-secure-123
      - LOG_LEVEL=info
      - WEBHOOK_ENABLED=true
      - WEBHOOK_BASEURL=https://wpp.tudominio.com
      - WEBHOOK_PATH=/wpp/webhook
      - WEBHOOK_SECRET=wpp-webhook-secret-galle
      - AUTO_START=false
      - START_ALL_SESSIONS=false
      - MAX_CONCURRENT_SESSIONS=3
      - CHROME_ARGS=--no-sandbox,--disable-dev-shm-usage
    networks: [ net ]
  caddy:
    image: caddy:latest
    container_name: caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks: [ net ]
networks:
  net:
    driver: bridge
volumes:
  caddy_data:
  caddy_config:
EOF
cat > Caddyfile << 'EOF'
wpp.tudominio.com {
  encode zstd gzip
  reverse_proxy wppconnect:21465
}
EOF
docker compose up -d && sleep 40 && \
echo "✅ INSTALADO" && \
echo "📡 Test local:" && curl -s http://localhost:21465/api-docs | head -n 3 && \
echo "" && \
echo "⚠️  EDITA /opt/wpp/Caddyfile con tu dominio real y ejecuta: docker restart caddy"
ENDSSH
```

---

## 📝 EDITAR DOMINIO

```bash
ssh root@31.220.58.83
cd /opt/wpp
nano Caddyfile
# Reemplaza "tudominio.com" con tu dominio
# Ctrl+O, Enter, Ctrl+X
docker restart caddy
```

---

## 🧪 PRUEBAS

### Test local (VPS)
```bash
curl -s http://localhost:21465/api-docs | head -n 5
curl -s -H "Authorization: Bearer galle-wpp-token-secure-123" http://localhost:21465/api/sessions
```

### Test HTTPS (desde PC)
```bash
curl -s https://wpp.tudominio.com/api-docs | head -n 5
curl -s -H "Authorization: Bearer galle-wpp-token-secure-123" https://wpp.tudominio.com/api/sessions
```

---

## 📤 ENVIAR MENSAJE DE PRUEBA

```bash
SESSION=galle-3012439596

curl -X POST https://wpp.tudominio.com/api/$SESSION/send-message \
  -H "Authorization: Bearer galle-wpp-token-secure-123" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "573012439596",
    "message": "Hola desde WPPConnect ✅"
  }'
```

---

## 🔍 LOGS Y DEBUG

### Ver logs WPPConnect
```bash
docker logs wppconnect -f
```

### Ver logs Caddy
```bash
docker logs caddy -f
```

### Ver todas las sesiones activas
```bash
curl -s -H "Authorization: Bearer galle-wpp-token-secure-123" \
  https://wpp.tudominio.com/api/sessions | jq
```

### Verificar estado de una sesión
```bash
SESSION=galle-3012439596
curl -s -H "Authorization: Bearer galle-wpp-token-secure-123" \
  https://wpp.tudominio.com/api/$SESSION/status-session | jq
```

---

## 🔄 REINICIAR SERVICIOS

### Reiniciar WPPConnect
```bash
docker restart wppconnect
```

### Reiniciar Caddy
```bash
docker restart caddy
```

### Reiniciar ambos
```bash
cd /opt/wpp
docker compose restart
```

---

## 🗑️ LIMPIAR Y REINSTALAR

### Detener y eliminar todo
```bash
cd /opt/wpp
docker compose down
docker volume prune -f
```

### Reinstalar desde cero
```bash
cd /opt/wpp
docker compose up -d
```

---

## 📊 VERIFICACIÓN RÁPIDA

```bash
# Contenedores corriendo
docker ps --format "table {{.Names}}\t{{.Status}}"

# Puertos abiertos
netstat -tlnp | grep -E ':(80|443|21465)'

# Memoria y disco
free -h
df -h

# Logs recientes
docker logs wppconnect --tail 20
```

---

## ⚙️ VARIABLES EN VERCEL

```
WPP_BASE_URL=https://wpp.tudominio.com
WPP_TOKEN=galle-wpp-token-secure-123
WPP_WEBHOOK_SECRET=wpp-webhook-secret-galle
```

---

## 🎯 FLUJO COMPLETO DE PRUEBA

```bash
# 1. Verificar que WPPConnect esté corriendo
curl -s https://wpp.tudominio.com/api-docs | head -n 3

# 2. Listar sesiones
curl -s -H "Authorization: Bearer galle-wpp-token-secure-123" \
  https://wpp.tudominio.com/api/sessions

# 3. Ver swagger completo
firefox https://wpp.tudominio.com/api-docs
```

---

## 🔐 TOKENS Y SECRETOS

```bash
WPP_SECRET=super-secret-wpp-galle-2025
WPP_TOKEN=galle-wpp-token-secure-123
WPP_WEBHOOK_SECRET=wpp-webhook-secret-galle
```

**Estos valores deben ser iguales en:**
- VPS: `/opt/wpp/.env` o variables en docker-compose
- Vercel: Environment Variables

---

## 🚀 RESUMEN DE PASOS

```bash
# 1. Instalar en VPS (comando de arriba)
# 2. Editar Caddyfile con tu dominio
# 3. Reiniciar Caddy
# 4. Configurar variables en Vercel
# 5. Hacer Redeploy
# 6. Probar en /configuracion
```

**Tiempo total: 10-15 minutos** ⚡

