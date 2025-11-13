# ⚡ EJECUTAR ESTO EN TU VPS AHORA

## Copia y pega este comando completo en la terminal de tu VPS:

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
docker-compose up -d && sleep 30 && docker ps && echo "" && echo "✅ INSTALACIÓN COMPLETADA" && echo "📡 Verifica en: https://wpp.galle18k.com/api-docs (espera 1-2 min para SSL)"
```

---

## ¿Qué pasará?

1. ⏳ Instalará paquetes (30 seg)
2. ⏳ Descargará imágenes Docker (1-2 min)
3. ⏳ Iniciará servicios
4. ✅ Mostrará contenedores corriendo
5. ✅ Mensaje "INSTALACIÓN COMPLETADA"

---

## Después de ejecutar:

### 1. Configurar subdominio en Hostinger (si no lo has hecho):

Ve al DNS Manager y agrega:
```
Tipo: A
Nombre: wpp
Valor: 31.220.58.83
```

### 2. Espera 2 minutos para que SSL se genere

### 3. Verifica:

```bash
curl https://wpp.galle18k.com/api-docs
```

Debe responder con HTML.

### 4. Configura Vercel:

```
WPP_BASE_URL = https://wpp.galle18k.com
WPP_TOKEN = galle-wpp-token-secure-123
WPP_WEBHOOK_SECRET = wpp-webhook-secret-galle
```

### 5. Redeploy en Vercel

### 6. Prueba en tu dashboard:

- Ve a `/configuracion`
- Ingresa: `3012439596`
- Click: "Conectar WhatsApp"
- ✅ Ver QR

---

**Ejecuta el comando en tu VPS y avísame cuando termine.** ⚡

