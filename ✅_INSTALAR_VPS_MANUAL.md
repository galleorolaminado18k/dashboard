# ✅ SOLUCIÓN FINAL - EJECUTAR MANUALMENTE

## 🔴 PROBLEMA
Windows no permite pasar contraseñas por SSH automáticamente por seguridad.

## ✅ SOLUCIÓN MÁS SIMPLE

### **Opción 1: Ejecutar script guiado (RECOMENDADO)**

```powershell
# En PowerShell
cd C:\Users\USUARIO\WebstormProjects\dashboard
.\install-vps-guiado.ps1
```

Este script te guiará paso a paso mostrándote exactamente qué copiar y pegar.

---

### **Opción 2: Comandos directos (COPIAR Y PEGAR UNO POR UNO)**

**1. Conectar SSH:**
```bash
ssh root@31.220.58.83
```
**Contraseña:** `S@ntiago`

**2. Ejecutar TODO este bloque completo:**
```bash
apt update -y && \
apt install -y curl docker.io docker-compose ufw && \
systemctl start docker && \
systemctl enable docker && \
ufw allow 22/tcp && \
ufw allow 3000/tcp && \
echo "y" | ufw enable && \
mkdir -p /opt/waha && \
cd /opt/waha && \
cat > docker-compose.yml <<'WAHAEOF'
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
WAHAEOF

docker-compose up -d && \
sleep 30 && \
curl http://localhost:3000/health && \
echo "" && \
echo "✅ URL: http://$(curl -s ifconfig.me):3000"
```

**IMPORTANTE:** Copiar TODO el bloque completo desde `apt` hasta el final.

---

### **Opción 3: Usar PuTTY (Si prefieres interfaz gráfica)**

1. Descargar PuTTY: https://www.putty.org/
2. Abrir PuTTY
3. Host Name: `31.220.58.83`
4. Port: `22`
5. Click "Open"
6. Login: `root`
7. Password: `S@ntiago`
8. Copiar y pegar el comando del bloque completo arriba

---

## 📋 DESPUÉS DE INSTALAR

**Tu URL será:** `http://31.220.58.83:3000`

**Verificar:**
```bash
curl http://31.220.58.83:3000/health
```

**Configurar en Vercel:**
1. https://vercel.com/dashboard
2. Settings → Environment Variables
3. `WAHA_BASE_URL` = `http://31.220.58.83:3000`
4. Save

**Probar:**
1. https://dashboard-galle.vercel.app/configuracion
2. Conectar WhatsApp
3. ✅ QR debe aparecer

---

## 🆘 SI NECESITAS AYUDA

**Ver logs de WAHA:**
```bash
docker logs waha-production
```

**Reiniciar WAHA:**
```bash
docker restart waha-production
```

**Ver estado:**
```bash
docker ps
```

---

**Tiempo:** 10 minutos  
**Método recomendado:** Opción 2 (copiar bloque completo)

