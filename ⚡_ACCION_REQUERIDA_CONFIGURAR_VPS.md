# ⚠️ ACCIÓN REQUERIDA: CONFIGURAR WAHA EN VPS

## 🎯 PROBLEMA DETECTADO

El script de verificación muestra que **WAHA en el VPS está devolviendo 401** incluso con la API key.

```
Con API Key: ❌ 401 Unauthorized (INCORRECTO - debería ser 200)
Sin API Key: ❌ 401 Unauthorized (correcto)
```

**Causa**: La API key enviada (`d8c776b78aee40d4b9bf75c633d175c8`) NO coincide con el hash configurado en WAHA en el VPS.

---

## ✅ SOLUCIÓN: 3 PASOS RÁPIDOS

### PASO 1: Conectar al VPS y configurar WAHA

```bash
# Conectar
ssh root@31.220.58.83

# Crear directorio
mkdir -p /root/waha && cd /root/waha

# Crear docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha
    restart: always
    ports:
      - "3000:3000"
    environment:
      - WAHA_HTTP_API_HOST=0.0.0.0
      - WAHA_LICENSE_ACCEPT=true
      - WAHA_LOG_LEVEL=info
      - WAHA_MULTI_DEVICE=true
      - WAHA_API_KEY=sha512:402d5e20c143748ded38e13e72c543b200bd75615944ba033b44e1d718eb920128f14b6dd886c6440d9513ffb1dd530dbc426f46f29c26cc2c23aaf3f6fc50ec
    volumes:
      - ./waha-data:/app/data
EOF

# Reiniciar WAHA
docker-compose down
docker-compose up -d

# Ver logs (esperar "listening on port 3000")
docker logs waha -f
# Presionar Ctrl+C cuando veas el mensaje
```

### PASO 2: Verificar que funcione

```bash
# Desde el VPS:
# Con API key (debe dar 200)
curl -i -H "X-Api-Key: d8c776b78aee40d4b9bf75c633d175c8" http://localhost:3000/health

# Sin API key (debe dar 401)
curl -i http://localhost:3000/health
```

**Resultado esperado:**
```
Con API key: HTTP/1.1 200 OK
Sin API key: HTTP/1.1 401 Unauthorized
```

### PASO 3: Verificar desde Windows

```powershell
# Desde tu PC Windows:
cd C:\Users\USUARIO\WebstormProjects\dashboard
powershell scripts\check-waha-vps.ps1
```

**Resultado esperado:**
```
3. Test de salud CON API Key...
STATUS: 200
BODY: {"status":"ok"}

4. Test de salud SIN API Key...
STATUS: 401

5. Test /api/session/default/start...
STATUS: 200 o 409 (ya iniciada)

6. Test /api/session/default/qr...
STATUS: 200
```

---

## 🚀 SI TODO FUNCIONA: Probar el Dashboard

```bash
# Terminal
npm run dev

# Navegador
http://localhost:3000/configuracion

# Click "Conectar WhatsApp"
# ✅ Debería conectarse al VPS y mostrar QR
```

---

## 📋 CONFIGURACIÓN COMPLETA

### VPS (docker-compose.yml):
```yaml
WAHA_API_KEY=sha512:402d5e20c143748ded38e13e72c543b200bd75615944ba033b44e1d718eb920128f14b6dd886c6440d9513ffb1dd530dbc426f46f29c26cc2c23aaf3f6fc50ec
```

### .env.local (ya actualizado):
```bash
WAHA_BASE_URL=http://31.220.58.83:3000
WAHA_API_KEY=d8c776b78aee40d4b9bf75c633d175c8
```

### Vercel (cuando despliegues):
```bash
WAHA_BASE_URL=http://31.220.58.83:3000
WAHA_API_KEY=d8c776b78aee40d4b9bf75c633d175c8
```

---

## 🔧 TROUBLESHOOTING

### Si sigue dando 401:

```bash
# Ver variables exactas en el contenedor
docker exec waha env | grep WAHA_

# Debe mostrar:
# WAHA_API_KEY=sha512:402d5e20c143748ded38e13e72c543b200bd75615944ba033b44e1d718eb920128f14b6dd886c6440d9513ffb1dd530dbc426f46f29c26cc2c23aaf3f6fc50ec
```

### Si NO está el hash correcto:

```bash
# Editar docker-compose.yml
nano /root/waha/docker-compose.yml

# Asegurarse que dice exactamente:
- WAHA_API_KEY=sha512:402d5e20c143748ded38e13e72c543b200bd75615944ba033b44e1d718eb920128f14b6dd886c6440d9513ffb1dd530dbc426f46f29c26cc2c23aaf3f6fc50ec

# Guardar: Ctrl+X, Y, Enter

# Reiniciar
docker-compose down
docker-compose up -d
```

---

## 📊 FLUJO DE AUTENTICACIÓN

```
Dashboard (.env.local)
  ├─ WAHA_API_KEY=d8c776b78aee40d4b9bf75c633d175c8
  └─ Envía: X-Api-Key: d8c776b78aee40d4b9bf75c633d175c8
           │
           ▼
VPS WAHA (docker-compose.yml)
  ├─ WAHA_API_KEY=sha512:402d5e20c143748...
  ├─ Recibe: X-Api-Key: d8c776b78aee40d4b9bf75c633d175c8
  ├─ Calcula: sha512(d8c776b78aee40d4b9bf75c633d175c8)
  ├─ Compara con el hash guardado
  │
  ├─ ✅ Si coincide: 200 OK
  └─ ❌ Si NO coincide: 401 Unauthorized
```

---

## ✅ CHECKLIST

- [ ] Conectar a VPS: `ssh root@31.220.58.83`
- [ ] Crear docker-compose.yml con el hash correcto
- [ ] Reiniciar WAHA: `docker-compose down && docker-compose up -d`
- [ ] Verificar logs: `docker logs waha`
- [ ] Test con curl en VPS (debe dar 200)
- [ ] Test con script PowerShell (debe dar 200)
- [ ] Iniciar dashboard: `npm run dev`
- [ ] Abrir `/configuracion` y probar

---

## 🎯 PRÓXIMO PASO

**EJECUTA ESTE COMANDO EN TU VPS:**

```bash
ssh root@31.220.58.83 << 'ENDSSH'
mkdir -p /root/waha && cd /root/waha
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha
    restart: always
    ports: ["3000:3000"]
    environment:
      - WAHA_HTTP_API_HOST=0.0.0.0
      - WAHA_LICENSE_ACCEPT=true
      - WAHA_MULTI_DEVICE=true
      - WAHA_API_KEY=sha512:402d5e20c143748ded38e13e72c543b200bd75615944ba033b44e1d718eb920128f14b6dd886c6440d9513ffb1dd530dbc426f46f29c26cc2c23aaf3f6fc50ec
    volumes: ["./waha-data:/app/data"]
EOF
docker-compose down 2>/dev/null
docker-compose up -d
echo "Esperando 5 segundos..."
sleep 5
docker logs waha --tail 20
ENDSSH
```

**Después ejecuta:**

```powershell
powershell scripts\check-waha-vps.ps1
```

---

**Si ves ✅ 200 OK**: Todo funcionó, ejecuta `npm run dev` y prueba.  
**Si ves ❌ 401**: Copia el output y mándalo para revisar.

