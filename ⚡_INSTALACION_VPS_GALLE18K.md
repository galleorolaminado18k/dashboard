# ⚡ INSTALACIÓN WPPCONNECT - GALLE18K.COM

## 🎯 PASO 1: CONFIGURAR SUBDOMINIO (2 MINUTOS)

### En el DNS Manager de Hostinger:

1. Ve a **Administrador de DNS** (ya estás ahí según la captura)
2. Click en **"Editar DNS"** para galle18k.com
3. Agrega un nuevo registro A:

```
Tipo: A
Nombre: wpp
Valor: 31.220.58.83
TTL: 14400 (o el predeterminado)
```

4. Guarda los cambios
5. Espera 2-5 minutos para que propague

---

## 🎯 PASO 2: EJECUTAR INSTALACIÓN EN VPS

### ⚠️ COMANDO CORREGIDO (copia este):

```bash
apt-get update -qq && apt-get install -y docker.io docker-compose curl && systemctl enable docker && systemctl start docker && docker ps -a | grep -E 'evolution|waha' | awk '{print $1}' | xargs -r docker rm -f && mkdir -p /opt/wpp && cd /opt/wpp && cat > docker-compose.yml << 'EOF'
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
      - WEBHOOK_BASEURL=https://wpp.galle18k.com
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
wpp.galle18k.com {
  encode zstd gzip
  reverse_proxy wppconnect:21465
}
EOF
docker-compose up -d && sleep 30 && echo "✅ INSTALADO - Verifica con: docker ps"
```

### O usa el script preparado:

```bash
curl -o install.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/vps-wppconnect/install-wppconnect-galle18k.sh
chmod +x install.sh
./install.sh
```

Este comando hace TODO automáticamente:
1. ✅ Instala Docker
2. ✅ Limpia contenedores antiguos (Evolution/WAHA)
3. ✅ Crea docker-compose con tu dominio
4. ✅ Crea Caddyfile con SSL automático
5. ✅ Inicia servicios
6. ✅ Verifica que funcione

---

## 🎯 PASO 3: CONFIGURAR VERCEL

1. Ve a https://vercel.com
2. Tu proyecto → **Settings** → **Environment Variables**
3. Agrega:

```
WPP_BASE_URL = https://wpp.galle18k.com
WPP_TOKEN = galle-wpp-token-secure-123
WPP_WEBHOOK_SECRET = wpp-webhook-secret-galle
```

4. **Deployments** → **Redeploy**

---

## 🎯 PASO 4: PROBAR

1. Espera 2-3 minutos a que termine el Redeploy
2. Ve a tu dashboard: `/configuracion`
3. Limpia caché del navegador (F12 → Empty Cache and Hard Reload)
4. Ingresa: `3012439596`
5. Click: **"Conectar WhatsApp"**
6. ✅ **QR debe aparecer**

---

## 📊 VERIFICACIÓN

### Después de ejecutar el comando, debes ver:

```
✅ INSTALACIÓN COMPLETADA
📡 Verificando servicios...
wppconnect    Up
caddy         Up

📡 Test local:
<!doctype html>...

📡 Test HTTPS:
<!doctype html>...

✅ TODO LISTO
```

---

## 🔍 SI HAY PROBLEMAS

### Ver logs:
```bash
cd /opt/wpp
docker logs wppconnect -f
docker logs caddy -f
```

### Verificar contenedores:
```bash
docker ps
```

### Reiniciar servicios:
```bash
docker-compose restart
```

---

## 🔑 DATOS IMPORTANTES

**Tu dominio WPPConnect:**
```
https://wpp.galle18k.com
```

**Token de autenticación:**
```
galle-wpp-token-secure-123
```

**Swagger (documentación interactiva):**
```
https://wpp.galle18k.com/api-docs
```

---

## ⏱️ TIEMPO TOTAL

- Configurar subdominio: 2 min
- Ejecutar instalación: 2 min
- Esperar servicios: 1 min
- Configurar Vercel: 2 min
- Redeploy: 2-3 min
- **TOTAL: ~10 minutos**

---

**¿Listo? Ejecuta el comando del PASO 2 en la terminal de tu VPS.** 🚀

