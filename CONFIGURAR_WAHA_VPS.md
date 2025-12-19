# 🚀 CONFIGURAR WAHA EN VPS - PASO A PASO

## ⚠️ PROBLEMA DETECTADO

El VPS está devolviendo **401 Unauthorized** incluso con la API key.

**Causa**: La API key enviada NO coincide con el hash configurado en WAHA en el VPS.

---

## ✅ SOLUCIÓN: Configurar WAHA en VPS

### PASO 1: Conectar al VPS

```bash
ssh root@31.220.58.83
```

### PASO 2: Verificar estado actual de WAHA

```bash
# Ver si está corriendo
docker ps | grep waha

# Ver variables de entorno
docker exec waha env | grep WAHA_
```

### PASO 3: Crear docker-compose.yml con la API key correcta

```bash
cd /root
mkdir -p waha
cd waha
nano docker-compose.yml
```

**Contenido del archivo:**

```yaml
version: '3.8'

services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha
    restart: always
    ports:
      - "3000:3000"
    environment:
      # API Configuration
      - WAHA_HTTP_API_HOST=0.0.0.0
      - WAHA_LICENSE_ACCEPT=true
      - WAHA_LOG_LEVEL=info
      - WAHA_MULTI_DEVICE=true
      
      # Security: API Key con hash SHA-512
      # Hash generado de: d8c776b78aee40d4b9bf75c633d175c8
      - WAHA_API_KEY=sha512:402d5e20c143748ded38e13e72c543b200bd75615944ba033b44e1d718eb920128f14b6dd886c6440d9513ffb1dd530dbc426f46f29c26cc2c23aaf3f6fc50ec
      
    volumes:
      - ./waha-data:/app/data
```

**Guardar**: `Ctrl+X`, `Y`, `Enter`

### PASO 4: Detener contenedor actual (si existe)

```bash
docker stop waha 2>/dev/null || true
docker rm waha 2>/dev/null || true
```

### PASO 5: Iniciar WAHA con la nueva configuración

```bash
cd /root/waha
docker-compose up -d
```

### PASO 6: Verificar que esté corriendo

```bash
# Ver logs
docker logs waha -f

# Esperar a ver:
# "WAHA HTTP API listening on port 3000"

# Presionar Ctrl+C para salir de los logs
```

### PASO 7: Probar autenticación

```bash
# Con API Key (debe dar 200 OK)
curl -i -H "X-Api-Key: d8c776b78aee40d4b9bf75c633d175c8" http://localhost:3000/health

# Sin API Key (debe dar 401)
curl -i http://localhost:3000/health
```

**Resultado esperado:**
```
# Con API key:
HTTP/1.1 200 OK
{"status":"ok"}

# Sin API key:
HTTP/1.1 401 Unauthorized
```

### PASO 8: Abrir firewall (si está cerrado)

```bash
# Ubuntu/Debian con ufw
ufw allow 3000/tcp
ufw reload

# CentOS/RHEL con firewalld
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

---

## 🧪 VERIFICACIÓN DESDE TU PC

Después de configurar el VPS, ejecuta desde Windows:

```powershell
powershell scripts\check-waha-vps.ps1
```

**Resultado esperado:**
- Test con API Key: ✅ 200 OK
- Test sin API Key: ❌ 401 Unauthorized
- /api/session/default/start: ✅ 200 OK o 409 (si ya existe)
- /api/session/default/qr: ✅ 200 OK (con QR code)

---

## 📋 DATOS DE CONFIGURACIÓN

### Para VPS (docker-compose.yml):
```
WAHA_API_KEY=sha512:402d5e20c143748ded38e13e72c543b200bd75615944ba033b44e1d718eb920128f14b6dd886c6440d9513ffb1dd530dbc426f46f29c26cc2c23aaf3f6fc50ec
```

### Para Vercel (Environment Variables):
```
WAHA_BASE_URL=http://31.220.58.83:3000
WAHA_API_KEY=d8c776b78aee40d4b9bf75c633d175c8
```

### Para .env.local (ya configurado):
```
WAHA_BASE_URL=http://31.220.58.83:3000
WAHA_API_KEY=d8c776b78aee40d4b9bf75c633d175c8
```

---

## 🔧 TROUBLESHOOTING

### Si sigue dando 401:

1. **Verificar hash en VPS:**
   ```bash
   docker exec waha env | grep WAHA_API_KEY
   ```
   Debe mostrar: `sha512:402d5e20c143748ded38e13e72c543b200bd75615944ba033b44e1d718eb920128f14b6dd886c6440d9513ffb1dd530dbc426f46f29c26cc2c23aaf3f6fc50ec`

2. **Verificar que el contenedor se haya reiniciado:**
   ```bash
   docker ps
   docker logs waha --tail 50
   ```

3. **Reiniciar completamente:**
   ```bash
   cd /root/waha
   docker-compose down
   docker-compose up -d
   ```

### Si da 403 en lugar de 401:

Significa que WAHA está recibiendo el header pero la clave no coincide. Verifica que:
- El hash en docker-compose sea exactamente: `sha512:402d5e20c143748...`
- La clave enviada sea exactamente: `d8c776b78aee40d4b9bf75c633d175c8`

---

## 🎯 SIGUIENTE PASO

Una vez que el script `check-waha-vps.ps1` muestre:
- ✅ Con API Key: 200 OK
- ✅ Sin API Key: 401 Unauthorized
- ✅ /start: 200 OK
- ✅ /qr: 200 OK

Entonces ejecuta:
```bash
npm run dev
```

Y abre:
```
http://localhost:3000/configuracion
```

**Click en "Conectar WhatsApp"** y funcionará con el VPS.

