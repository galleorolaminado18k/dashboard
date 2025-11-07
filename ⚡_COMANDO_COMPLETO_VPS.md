# ⚡ COPIAR Y PEGAR - COMANDO COMPLETO

## 🔴 PASO 1: Conectar SSH
```bash
ssh root@31.220.58.83
```
**Contraseña:** S@ntiago

---

## 🔴 PASO 2: COPIAR TODO ESTE COMANDO

```bash
apt update -y && apt install -y curl docker.io docker-compose ufw && systemctl start docker && systemctl enable docker && ufw --force enable && ufw allow 22/tcp && ufw allow 3000/tcp && mkdir -p /opt/waha && cd /opt/waha && cat > docker-compose.yml <<'ENDOFFILE'
version: '3.8'
services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha-production
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - WAHA_HTTP_API_HOST=0.0.0.0
      - WAHA_LICENSE_ACCEPT=true
      - WAHA_LOG_LEVEL=info
      - WAHA_MULTI_DEVICE=true
ENDOFFILE
docker-compose up -d && sleep 30 && curl http://localhost:3000/health && echo "" && echo "✅ URL: http://31.220.58.83:3000"
```

Presionar ENTER y esperar 5-10 minutos.

---

## ✅ VERIFICAR
```
http://31.220.58.83:3000/health
```
Debe mostrar: `{"status":"ok"}`

---

## 🔧 CONFIGURAR VERCEL

1. https://vercel.com/dashboard
2. Settings → Environment Variables
3. `WAHA_BASE_URL` = `http://31.220.58.83:3000`
4. Save
5. Esperar 2 min

---

## ✅ PROBAR

https://dashboard-galle.vercel.app/configuracion
→ Conectar WhatsApp
→ ✅ QR APARECE
→ Escanear
→ ✅ FUNCIONA 24/7

