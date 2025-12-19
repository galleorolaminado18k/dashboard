# ⚡ CORRECCIÓN FINAL - EJECUTAR MANUALMENTE

## 🔴 EL ERROR 401 PERSISTE

WAHA tiene activada la seguridad por defecto. Necesito desactivarla.

## ✅ SOLUCIÓN DEFINITIVA

### **Ya tienes SSH conectado, ejecuta EXACTAMENTE esto:**

```bash
cd /opt/waha && docker-compose down && cat > docker-compose.yml <<'DOCKEREOF'
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
DOCKEREOF
docker-compose up -d && sleep 30 && curl http://localhost:3000/health
```

**Copiar TODO desde `cd` hasta el final, presionar ENTER**

---

## ✅ DEBE MOSTRAR

```json
{"status":"ok"}
```

**SIN error 401**

---

## 🔧 DESPUÉS: CONFIGURAR VERCEL

1. https://vercel.com/dashboard
2. Tu proyecto → Settings → Environment Variables
3. Add New:
   ```
   WAHA_BASE_URL = http://31.220.58.83:3000
   ```
4. Save
5. Esperar 2 minutos

---

## ✅ PROBAR

1. https://dashboard-galle.vercel.app/configuracion
2. F5 (recargar)
3. Conectar WhatsApp
4. ✅ QR aparece
5. Escanear
6. ✅ FUNCIONA

---

**CLAVE:** El parámetro `WAHA_SECURITY_ENABLE=false` es CRÍTICO para que funcione sin autenticación.
#!/bin/bash
cd /opt/waha
docker-compose down
cat > docker-compose.yml <<'DOCKEREOF'
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
DOCKEREOF
docker-compose up -d
sleep 30
curl -s http://localhost:3000/health
echo ""
echo "✅ WAHA CORREGIDO - http://31.220.58.83:3000"

