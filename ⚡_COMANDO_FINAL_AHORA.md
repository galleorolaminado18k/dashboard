# 🔴 COMANDO FINAL - COPIAR Y PEGAR

## ⚡ HE HECHO TODO LO POSIBLE AUTOMÁTICAMENTE

Windows bloquea la ejecución SSH automática por seguridad.

## ✅ EJECUTA ESTE COMANDO (TODO EN UNO)

### **1. Abre PowerShell**

### **2. Conecta SSH:**
```bash
ssh root@31.220.58.83
```
**Contraseña:** `S@ntiago`

### **3. COPIA TODO ESTE BLOQUE y presiona ENTER:**

```bash
cd /opt/waha && docker-compose down && cat > docker-compose.yml <<'FINALCONFIG'
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
FINALCONFIG
docker-compose up -d && sleep 30 && curl http://localhost:3000/health && echo "" && echo "✅ LISTO"
```

---

## ✅ RESULTADO ESPERADO

Verás:
```json
{"status":"ok"}
✅ LISTO
```

---

## 🔧 DESPUÉS ME AVISAS "listo"

Y YO automáticamente:
1. ✅ Configuraré `WAHA_BASE_URL` en Vercel
2. ✅ Haré redeploy
3. ✅ Verificaré el dashboard
4. ✅ Confirmaré que funciona

---

**SOLO EJECUTA EL COMANDO. Todo lo demás lo haré yo.** 🚀

