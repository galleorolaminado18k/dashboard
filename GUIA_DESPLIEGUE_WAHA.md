# 🚀 GUÍA DE DESPLIEGUE DE WAHA EN PRODUCCIÓN

## 📌 PROBLEMA ACTUAL

En **Vercel** (entorno serverless) **NO puedes** conectar con `localhost:3000` porque:
- ❌ Vercel ejecuta tu API en servidores remotos (no en tu laptop)
- ❌ `localhost:3000` solo existe en tu máquina local
- ❌ HTTPS (Vercel) no puede llamar a HTTP (WAHA local) → Mixed Content

**Solución:** Publicar WAHA con URL pública accesible desde Vercel.

---

## ✅ OPCIONES DE DESPLIEGUE

### **Opción 1: Railway (Recomendado - Más Fácil)** 🚂

**Ventajas:**
- ✅ Gratis hasta $5/mes de crédito
- ✅ Auto-deploy desde GitHub
- ✅ HTTPS automático
- ✅ Sin configurar SSL

**Pasos:**

1. **Crear cuenta en Railway.app**
   ```
   https://railway.app
   ```

2. **Crear nuevo proyecto → Deploy from GitHub**

3. **Crear archivo `railway.json` en tu repo:**
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "DOCKERFILE",
       "dockerfilePath": "Dockerfile.waha"
     },
     "deploy": {
       "startCommand": "npm start",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

4. **Crear `Dockerfile.waha`:**
   ```dockerfile
   FROM devlikeapro/waha:latest
   
   ENV WAHA_HTTP_API_HOST=0.0.0.0
   ENV WAHA_MULTI_DEVICE=true
   ENV PORT=3000
   
   EXPOSE 3000
   
   CMD ["node", "dist/server.js"]
   ```

5. **Configurar variables en Railway:**
   - `WAHA_HTTP_API_HOST` = `0.0.0.0`
   - `WAHA_MULTI_DEVICE` = `true`
   - `PORT` = `3000`

6. **Obtener URL pública:**
   - Railway te da: `https://waha-production.up.railway.app`

7. **Configurar en Vercel:**
   - Settings → Environment Variables
   - `WAHA_BASE_URL` = `https://waha-production.up.railway.app`

---

### **Opción 2: VPS propio (Digital Ocean / AWS / Hetzner)** 🖥️

**Ventajas:**
- ✅ Control total
- ✅ IP fija
- ✅ Más económico a largo plazo

**Pasos:**

1. **Crear VPS Ubuntu 22.04** (mínimo 1GB RAM)

2. **Instalar Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Subir `docker-compose.prod.yml`:**
   ```bash
   scp docker-compose.prod.yml user@tu-ip:/home/user/
   ```

4. **Iniciar WAHA:**
   ```bash
   ssh user@tu-ip
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Instalar Nginx + Certbot:**
   ```bash
   sudo apt update
   sudo apt install nginx certbot python3-certbot-nginx -y
   ```

6. **Configurar dominio:**
   - En tu proveedor DNS (Cloudflare/GoDaddy):
   - Crear registro A: `waha.tudominio.com` → IP de tu VPS

7. **Configurar Nginx:**
   ```bash
   sudo cp nginx-waha-ssl.conf /etc/nginx/sites-available/waha.conf
   sudo ln -s /etc/nginx/sites-available/waha.conf /etc/nginx/sites-enabled/
   sudo nano /etc/nginx/sites-available/waha.conf
   # Cambiar "waha.tudominio.com" por tu dominio real
   ```

8. **Obtener certificado SSL:**
   ```bash
   sudo certbot --nginx -d waha.tudominio.com
   ```

9. **Reiniciar Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Verificar:**
    ```bash
    curl https://waha.tudominio.com/health
    # Debe responder: {"status": "ok"}
    ```

11. **Configurar en Vercel:**
    - `WAHA_BASE_URL` = `https://waha.tudominio.com`

---

### **Opción 3: Render.com** 🎨

**Pasos:**

1. **Crear cuenta en Render.com**

2. **New → Web Service → Deploy from Docker**

3. **Configurar:**
   - **Docker Image:** `devlikeapro/waha:latest`
   - **Region:** Oregon (más barato)
   - **Instance Type:** Free
   - **Port:** 3000

4. **Variables de entorno:**
   ```
   WAHA_HTTP_API_HOST=0.0.0.0
   WAHA_MULTI_DEVICE=true
   ```

5. **Deploy** → Render te da URL pública

6. **Configurar en Vercel:**
   - `WAHA_BASE_URL` = `https://waha-abc123.onrender.com`

---

## 🧪 VERIFICACIÓN DESPUÉS DEL DESPLIEGUE

### 1. **Health Check**
```bash
curl https://waha.tudominio.com/health
# Debe responder: {"status": "ok"}
```

### 2. **Iniciar sesión**
```bash
curl -X POST https://waha.tudominio.com/api/session/default/start
# Debe responder: {"state": "STARTING", ...}
```

### 3. **Obtener QR**
```bash
curl https://waha.tudominio.com/api/session/default/qr
# Debe responder: {"qr": "data:image/png;base64,..."}
```

### 4. **Desde Vercel (tu dashboard):**
- Ir a: `https://dashboard-galle.vercel.app/configuracion`
- Ingresar número: `3012439596`
- Click "Conectar WhatsApp"
- ✅ Debe mostrar QR sin errores

---

## 📋 CHECKLIST FINAL

- [ ] WAHA desplegado con URL pública HTTPS
- [ ] Health check responde OK
- [ ] Variable `WAHA_BASE_URL` configurada en Vercel
- [ ] Test desde Vercel: QR aparece sin error 500
- [ ] Escanear QR con WhatsApp Business
- [ ] Verificar conexión exitosa

---

## 🆘 TROUBLESHOOTING

### Error: "fetch failed" en Vercel

**Causa:** `WAHA_BASE_URL` no está configurada o apunta a `localhost`

**Solución:**
```bash
# Vercel Dashboard → tu proyecto → Settings → Environment Variables
WAHA_BASE_URL = https://waha.tudominio.com
```

### Error: "Mixed Content" en navegador

**Causa:** Estás llamando HTTP desde página HTTPS

**Solución:** WAHA **debe** estar en HTTPS (usar Nginx con SSL o Railway/Render)

### Error: "Connection timeout"

**Causa:** Firewall bloqueando puerto 3000

**Solución (VPS):**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### Error: "CORS policy"

**Causa:** WAHA no permite tu dominio

**Solución:** Agregar en `docker-compose.prod.yml`:
```yaml
environment:
  WAHA_CORS_ORIGIN: "https://dashboard-galle.vercel.app"
```

---

## 💰 COSTOS ESTIMADOS

| Opción | Costo mensual | Pros | Contras |
|--------|---------------|------|---------|
| **Railway** | $0-5 | Fácil, auto HTTPS | Crédito limitado |
| **Render Free** | $0 | Gratis | Duerme después de 15min inactividad |
| **VPS Hetzner** | $4 | Siempre activo, IP fija | Configuración manual |
| **VPS DigitalOcean** | $6 | Documentación excelente | Más caro |

---

## 🎯 RECOMENDACIÓN FINAL

**Para DEMO/Desarrollo:** Railway (gratis, fácil)  
**Para PRODUCCIÓN real:** VPS propio con Nginx (estable, controlado)

---

**Última actualización:** 2025-11-06  
**Autor:** Copilot AI + Karla
version: '3.8'

# ✅ DOCKER COMPOSE PARA PRODUCCIÓN (VPS/Railway/Render)
# Uso: docker-compose -f docker-compose.prod.yml up -d

services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha-production
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - waha-sessions:/app/data
    environment:
      # API pública (escucha en todas las interfaces)
      WAHA_HTTP_API_HOST: 0.0.0.0
      WAHA_LICENSE_ACCEPT: "true"
      WAHA_LOG_LEVEL: info
      WAHA_MULTI_DEVICE: "true"
      
      # Seguridad (opcional - descomenta si quieres API key)
      # WAHA_API_KEY: ${WAHA_API_KEY}
      
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - web

volumes:
  waha-sessions:
    driver: local

networks:
  web:
    external: true

