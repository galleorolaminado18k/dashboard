# 🚀 COMANDOS RÁPIDOS - CONFIGURAR EVOLUTION API CON AUTENTICACIÓN

## Para ejecutar en el VPS (31.220.58.83)

### ⚡ OPCIÓN 1: Docker Run (Rápido)

```bash
# Conectar al VPS
ssh root@31.220.58.83

# Detener contenedor anterior (si existe)
docker rm -f evolution-api waha

# Levantar Evolution API con autenticación
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=galle-super-key \
  atendai/evolution-api:latest

# Verificar que esté corriendo
docker ps | grep evolution

# Ver logs (últimas 30 líneas)
docker logs evolution-api --tail 30

# Ver logs en tiempo real
docker logs -f evolution-api
```

### ⚡ OPCIÓN 2: Docker Compose (Recomendado)

```bash
# Conectar al VPS
ssh root@31.220.58.83

# Crear directorio para el proyecto
mkdir -p ~/evolution-api && cd ~/evolution-api

# Crear archivo docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  evolution:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - ./evolution-data:/evolution/store
    environment:
      API_KEY: galle-super-key
EOF

# Detener contenedor anterior
docker rm -f evolution-api waha

# Levantar con docker-compose
docker compose up -d

# Verificar
docker ps
docker logs evolution-api --tail 30
```

---

## 🧪 PROBAR DESDE TU PC

### 1. Health Check (sin auth - puede fallar con 401)
```bash
curl -i http://31.220.58.83:8080/health
```

### 2. Health Check (con auth - debe funcionar)
```bash
curl -i http://31.220.58.83:8080/health \
  -H "apikey: galle-super-key"
```

### 3. Start Session (debe responder 200 o 409)
```bash
curl -i -X POST http://31.220.58.83:8080/sessions/start \
  -H "Content-Type: application/json" \
  -H "apikey: galle-super-key" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

### 4. Get QR (debe responder 200 con JSON)
```bash
curl -i http://31.220.58.83:8080/sessions/default/qrcode \
  -H "apikey: galle-super-key"
```

### 5. Si falla con 401, probar con Bearer token
```bash
curl -i http://31.220.58.83:8080/health \
  -H "Authorization: Bearer galle-super-key"
```

---

## ⚙️ CONFIGURAR EN VERCEL

### 1. Ir a tu proyecto en Vercel:
```
https://vercel.com/dashboard
```

### 2. Settings → Environment Variables

### 3. Agregar variables:

**Para IP directa**:
```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_API_KEY
Value: galle-super-key
```

**Para dominio con Caddy**:
```
Name: EVO_BASE_URL
Value: https://whats.tudominio.com

Name: EVO_API_KEY
Value: galle-super-key
```

**Si tu Evolution usa Bearer en lugar de apikey**:
```
Name: EVO_BEARER
Value: galle-super-key
```

### 4. Redeploy
- Ve a **Deployments**
- Click en los 3 puntos del último deployment
- Click en **Redeploy**
- ✅ Espera que termine el build

---

## 🔍 VERIFICAR EN EL VPS

### Ver qué variable de entorno usa tu Evolution:
```bash
docker exec evolution-api printenv | grep -Ei 'API|KEY|AUTH|TOKEN'
```

### Posibles resultados:
```
API_KEY=galle-super-key                    # ✅ Usa apikey header
AUTHENTICATION_API_KEY=galle-super-key     # ✅ Usa apikey header
AUTH_TOKEN=galle-super-key                 # ⚠️ Puede usar Bearer
```

### Ver logs de Evolution en tiempo real:
```bash
docker logs -f evolution-api
```

### Reiniciar Evolution si hiciste cambios:
```bash
docker restart evolution-api
```

### Detener Evolution:
```bash
docker stop evolution-api
docker rm evolution-api
```

---

## 🎯 CHECKLIST RÁPIDO

### En el VPS:
- [ ] `docker ps | grep evolution` → muestra el contenedor corriendo
- [ ] `curl -i http://localhost:8080/health -H "apikey: galle-super-key"` → 200 OK
- [ ] `docker logs evolution-api` → sin errores críticos

### Desde tu PC:
- [ ] `curl -i http://31.220.58.83:8080/health -H "apikey: galle-super-key"` → 200 OK
- [ ] `curl -i -X POST http://31.220.58.83:8080/sessions/start -H "Content-Type: application/json" -H "apikey: galle-super-key" -d '{"sessionName":"default"}'` → 200 o 409

### En Vercel:
- [ ] Variable `EVO_BASE_URL` configurada
- [ ] Variable `EVO_API_KEY` configurada (misma clave que en VPS)
- [ ] Redeploy completado sin errores

### En el Dashboard:
- [ ] Ir a `/configuracion`
- [ ] Ingresar número: `3001234567`
- [ ] Click "Conectar WhatsApp"
- [ ] ✅ NO más error `EVO_START_401`
- [ ] ✅ QR aparece en 2-5 segundos

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Error: "Connection refused"
```bash
# Verificar que Evolution esté corriendo
docker ps | grep evolution

# Ver logs
docker logs evolution-api --tail 50

# Verificar firewall
sudo ufw allow 8080/tcp
```

### Error: 401 aún con apikey
```bash
# Verificar la clave configurada
docker exec evolution-api printenv | grep -i key

# Probar con Bearer
curl -i http://31.220.58.83:8080/health \
  -H "Authorization: Bearer galle-super-key"

# Si Bearer funciona, configurar EVO_BEARER en Vercel
```

### Error: "apikey is not defined" en Vercel
```bash
# Asegurarse de que la variable esté configurada
# Vercel → Settings → Environment Variables
# Verificar que EVO_API_KEY exista

# IMPORTANTE: Redeploy después de agregar variables
```

---

## ✅ RESULTADO ESPERADO

Después de seguir estos pasos:

```
✅ Evolution API corriendo con autenticación
✅ Curl desde tu PC responde 200 (no 401)
✅ Vercel tiene las credenciales configuradas
✅ Dashboard en /configuracion muestra QR sin error 401
✅ WhatsApp se puede conectar escaneando el QR
```

---

## 🚀 COPIAR Y PEGAR (TODO EN UNO)

```bash
# ========================================
# EJECUTAR EN EL VPS (31.220.58.83)
# ========================================

# Conectar
ssh root@31.220.58.83

# Limpiar contenedores anteriores
docker rm -f evolution-api waha

# Levantar Evolution API con autenticación
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=galle-super-key \
  atendai/evolution-api:latest

# Verificar
docker ps | grep evolution
docker logs evolution-api --tail 30

# Esperar 10 segundos
sleep 10

# Probar desde el mismo VPS
curl -i http://localhost:8080/health -H "apikey: galle-super-key"
```

```bash
# ========================================
# PROBAR DESDE TU PC (Windows/Mac/Linux)
# ========================================

# Health check
curl -i http://31.220.58.83:8080/health -H "apikey: galle-super-key"

# Start session
curl -i -X POST http://31.220.58.83:8080/sessions/start \
  -H "Content-Type: application/json" \
  -H "apikey: galle-super-key" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'

# Get QR
curl http://31.220.58.83:8080/sessions/default/qrcode \
  -H "apikey: galle-super-key"
```

```
# ========================================
# CONFIGURAR EN VERCEL
# ========================================

EVO_BASE_URL = http://31.220.58.83:8080
EVO_API_KEY = galle-super-key

Luego: Redeploy
```

**🎉 ¡Listo! El error 401 debe desaparecer y el QR debe aparecer en el dashboard!**

