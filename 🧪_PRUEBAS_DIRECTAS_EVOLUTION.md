# 🧪 PRUEBAS DIRECTAS - EVOLUTION API

## Objetivo
Identificar qué rutas usa tu instancia de Evolution API antes de configurar Vercel.

---

## 📋 PASO 1: Identificar tu URL base

### Si usas IP directa:
```bash
BASE="http://31.220.58.83:8080"
```

### Si usas dominio con Caddy (sin prefijo):
```bash
BASE="https://whats.tudominio.com"
```

### Si usas dominio con prefijo /api:
```bash
BASE="https://whats.tudominio.com/api"
```

---

## 🔍 PASO 2: Probar Health Check

```bash
# Reemplaza $BASE con tu URL real
curl -i $BASE/health
```

**Resultado esperado**: 
- ✅ `200 OK` - Evolution está corriendo
- ❌ `404 Not Found` - Verifica que la URL sea correcta
- ❌ `Connection refused` - Evolution no está corriendo o el puerto está bloqueado

---

## 🚀 PASO 3: Probar Start Session (3 variantes)

### Variante 1: /sessions/start (más común)
```bash
curl -i -X POST $BASE/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

### Variante 2: /session/start (singular)
```bash
curl -i -X POST $BASE/session/start \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

### Variante 3: /instance/create
```bash
curl -i -X POST $BASE/instance/create \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default"}'
```

**Resultado esperado**:
- ✅ `200 OK` o `201 Created` - Sesión creada
- ✅ `409 Conflict` - Sesión ya existe (normal)
- ❌ `404 Not Found` - Esa ruta no existe en tu versión

**✅ Anota cuál variante funcionó** (la usaremos para configurar)

---

## 📷 PASO 4: Probar Get QR (3 variantes)

### Variante 1: /sessions/default/qrcode (más común)
```bash
curl -i $BASE/sessions/default/qrcode
```

### Variante 2: /session/default/qrcode (singular)
```bash
curl -i $BASE/session/default/qrcode
```

### Variante 3: /instance/qr/default
```bash
curl -i $BASE/instance/qr/default
```

**Resultado esperado**:
- ✅ `200 OK` + JSON con `{"qrcode":"data:image/png;base64,..."}`
- ❌ `404 Not Found` - Esa ruta no existe en tu versión
- ❌ `503 Service Unavailable` - La sesión no está lista, espera 5 segundos

**✅ Anota cuál variante funcionó**

---

## 🔐 PASO 5: Si usas API Key

Si configuraste `AUTHENTICATION_API_KEY` en Evolution, agrega el header:

```bash
# Ejemplo con health check
curl -i $BASE/health \
  -H "apikey: TU_CLAVE_SECRETA"

# Ejemplo con start session
curl -i -X POST $BASE/sessions/start \
  -H "Content-Type: application/json" \
  -H "apikey: TU_CLAVE_SECRETA" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

**Resultado esperado**:
- ✅ `200 OK` - La clave es correcta
- ❌ `401 Unauthorized` o `403 Forbidden` - La clave es incorrecta o falta

---

## ✅ PASO 6: Configurar Vercel según resultados

### Caso A: Funcionó /sessions/start y /sessions/default/qrcode (IP directa)
```
EVO_BASE_URL = http://31.220.58.83:8080
EVO_PATH = 
EVO_API_KEY = (si usas auth)
```

### Caso B: Funcionó /sessions/start y /sessions/default/qrcode (Dominio sin prefijo)
```
EVO_BASE_URL = https://whats.tudominio.com
EVO_PATH = 
EVO_API_KEY = (si usas auth)
```

### Caso C: Funcionó pero solo con prefijo /api
```
EVO_BASE_URL = https://whats.tudominio.com
EVO_PATH = /api
EVO_API_KEY = (si usas auth)
```

### Caso D: Funcionaron las variantes singulares o /instance/*
✅ **No te preocupes** - El código ahora detecta automáticamente todas las variantes.
Solo configura:
```
EVO_BASE_URL = tu-url-base
EVO_PATH = (prefijo si aplica)
EVO_API_KEY = (si usas auth)
```

---

## 🎯 RESUMEN DE RUTAS SOPORTADAS

El código ahora intenta automáticamente estas rutas en orden:

### Start Session:
1. `POST /sessions/start` ← Más común (Evolution v1/v2)
2. `POST /session/start` ← Algunas builds
3. `POST /instance/create` ← Versiones antiguas

### Get QR:
1. `GET /sessions/default/qrcode` ← Más común (Evolution v1/v2)
2. `GET /session/default/qrcode` ← Algunas builds
3. `GET /instance/qr/default` ← Versiones antiguas

### Get Status:
1. `GET /sessions/default/status` ← Más común
2. `GET /session/default/status` ← Algunas builds
3. `GET /instance/status/default` ← Versiones antiguas

### Delete Session:
1. `DELETE /sessions/default` ← Más común
2. `DELETE /session/default` ← Algunas builds
3. `DELETE /instance/delete/default` ← Versiones antiguas

---

## 🐛 EJEMPLOS DE ERRORES Y SOLUCIONES

### Error: `curl: (7) Failed to connect`
**Problema**: Evolution no está corriendo o el puerto está bloqueado

**Solución**:
```bash
# Verificar que Evolution esté corriendo
docker ps | grep evolution

# Si no está, levantarlo
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e AUTHENTICATION_API_KEY= \
  atendai/evolution-api:latest

# Verificar firewall
sudo ufw allow 8080/tcp
```

### Error: `404 Not Found` en todas las rutas
**Problema**: La URL base está mal o Evolution usa rutas completamente diferentes

**Solución**:
```bash
# Verificar logs de Evolution
docker logs evolution-api | tail -50

# Verificar la versión
docker inspect evolution-api | grep Image

# Si es una versión muy antigua, actualizar:
docker rm -f evolution-api
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  atendai/evolution-api:latest
```

### Error: `401 Unauthorized` o `403 Forbidden`
**Problema**: Evolution tiene autenticación activada y no pasaste la API key

**Solución**:
```bash
# Agregar header apikey a todos los comandos
curl -i $BASE/health -H "apikey: TU_CLAVE"

# O desactivar auth en Evolution
docker rm -f evolution-api
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e AUTHENTICATION_API_KEY= \
  atendai/evolution-api:latest
```

---

## ✅ CHECKLIST DE PRUEBAS

Antes de configurar Vercel, asegúrate de que:

- [ ] Health check responde 200 OK
- [ ] Al menos UNA variante de start session funciona (200 o 409)
- [ ] Al menos UNA variante de get QR funciona (200)
- [ ] Si usas auth, los comandos funcionan con header `apikey`
- [ ] Puedes acceder desde tu PC (no solo desde localhost del VPS)

Si TODOS los checks pasan, ya puedes configurar Vercel y redeploy! 🎉

---

## 🚀 SIGUIENTE PASO

Una vez que hayas identificado las URLs correctas:

1. Ve a Vercel → Settings → Environment Variables
2. Configura `EVO_BASE_URL`, `EVO_PATH` (si aplica), `EVO_API_KEY` (si aplica)
3. Redeploy
4. Ve a `/configuracion` y prueba "Conectar WhatsApp"
5. ✅ El QR debería aparecer en 2-5 segundos

**El código ahora auto-detecta las rutas, así que ya no deberías ver más errores 404!** 🎯

