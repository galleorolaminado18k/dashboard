# ⚡ COPIAR Y PEGAR - COMANDO COMPLETO

## 🔴 PASO 1: Conectar SSH
```bash
ssh root@31.220.58.83
```
**Contraseña:** S@ntiago

---

## 🔴 PASO 2: CORREGIR CONFIGURACIÓN (ERROR 401 SOLUCIONADO)

Ya instalaste WAHA pero tiene error de autenticación. **COPIA ESTE COMANDO CORREGIDO:**

```bash
cd /opt/waha && docker-compose down && cat > docker-compose.yml <<'ENDOFFILE'
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
      - WAHA_SECURITY_ENABLE=false
ENDOFFILE
docker-compose up -d && sleep 30 && curl http://localhost:3000/health && echo "" && echo "✅ WAHA CORREGIDO: http://31.220.58.83:3000"
```

**IMPORTANTE:** El cambio clave es `WAHA_SECURITY_ENABLE=false` que desactiva la autenticación.

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

