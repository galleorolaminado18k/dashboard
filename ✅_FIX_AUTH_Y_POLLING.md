# ✅ FIX FINAL APLICADO - Evolution API con Autenticación

## 🎉 Problemas Resueltos

### 1. ✅ ReferenceError: startPollingQR is not defined
**Causa:** Función `startPollingQR` eliminada pero aún referenciada  
**Solución:** Removida llamada en `checkSessionStatus`

### 2. ✅ Sin soporte para autenticación Evolution API
**Causa:** Headers sin API Key ni Bearer token  
**Solución:** Helper `withAuth()` que agrega headers automáticamente

### 3. ✅ QR no se muestra en frontend
**Causa:** Frontend esperaba `data.ok` y solo leía `data.qr`  
**Solución:** Lectura flexible: `qrcode || qr || QR`

---

## 📝 Cambios Implementados

### Backend: `app/api/whatsapp/evolution/route.ts`

```typescript
// ✅ Nuevas variables de entorno
const EVO_API_KEY = process.env.EVO_API_KEY || ''
const EVO_BEARER = process.env.EVO_BEARER || ''

// ✅ Helper de autenticación
function withAuth(customHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...customHeaders }
  if (EVO_API_KEY) headers['apikey'] = EVO_API_KEY
  if (EVO_BEARER) headers['Authorization'] = `Bearer ${EVO_BEARER}`
  return headers
}

// ✅ Fetch centralizado con auth
async function evoFetch(path, init = {}) {
  return fetch(`${EVO_BASE_URL}${path}`, {
    ...init,
    headers: withAuth(init.headers),
    cache: 'no-store',
  })
}
```

**Todos los endpoints ahora usan `evoFetch()`:**
- ✅ POST - Iniciar sesión y obtener QR
- ✅ GET - Verificar estado
- ✅ DELETE - Eliminar sesión

### Frontend: `app/(dashboard)/configuracion/page.tsx`

```typescript
// ✅ Lectura flexible del QR
const qr = data.qrcode || data.qr || data.QR || ''

// ✅ Sin llamada a startPollingQR
const checkSessionStatus = async () => {
  // ... sin startPollingQR()
}
```

### Variables de entorno

**`.env.local`:**
```env
EVO_BASE_URL=http://31.220.58.83:8080
# EVO_API_KEY=tu-clave-si-activaste-auth
# EVO_BEARER=tu-bearer-si-activaste-auth
```

**`.env.production.example`:**
```env
EVO_BASE_URL=https://whats.tudominio.com
# EVO_API_KEY=tu-api-key-secreta
# EVO_BEARER=tu-bearer-token
```

---

## 🧪 Verificar Evolution API desde PC

### 1. Health Check
```bash
curl http://31.220.58.83:8080/
```

**Esperado:**
```json
{"status":200,"message":"Welcome to the Evolution API, it is working!"}
```

### 2. Iniciar Sesión
```bash
curl -X POST http://31.220.58.83:8080/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

**Esperado:** `200 OK` o `409 Conflict` (si ya existe - OK)

### 3. Obtener QR
```bash
curl http://31.220.58.83:8080/sessions/default/qrcode
```

**Esperado:**
```json
{"qrcode":"data:image/png;base64,iVBORw0KG..."}
```

### 4. Si Evolution tiene autenticación activa:

```bash
# Con API Key
curl -H "apikey: TU_API_KEY" http://31.220.58.83:8080/sessions/default/qrcode

# O con Bearer
curl -H "Authorization: Bearer TU_TOKEN" http://31.220.58.83:8080/sessions/default/qrcode
```

---

## 🚀 Desplegar en Vercel

### Paso 1: Verificar Variables de Entorno

**Ve a:** https://vercel.com → Tu proyecto → Settings → Environment Variables

**Debe existir:**
```
EVO_BASE_URL = http://31.220.58.83:8080
```

**Si Evolution tiene auth (verifica con curl):**
```
EVO_API_KEY = tu-api-key-secreta
```

O:
```
EVO_BEARER = tu-bearer-token
```

**Aplicar a:** Production, Preview, Development

### Paso 2: Deploy Automático

El push a GitHub ya triggeó el deploy automático.

**Monitorea:** https://vercel.com → Deployments

**Busca:**
```
✓ Building app...
✓ Compiled successfully
✓ Deployment ready
```

### Paso 3: Probar en Producción

```
https://tu-dashboard.vercel.app/configuracion
```

1. Pestaña: **CRM & WhatsApp**
2. Ingresa tu número
3. Click: **Conectar WhatsApp**
4. **Debe aparecer QR** ✅

---

## 🐛 Si Evolution tiene auth y sale 403

### Detectar si Evolution tiene auth:

```bash
# Test sin auth
curl http://31.220.58.83:8080/sessions/default/qrcode

# Si responde 403/401, tiene auth activa
```

### Solución 1: Obtener API Key

```bash
# Ver logs de Evolution API
ssh root@31.220.58.83
docker logs evolution-api | grep -i "api"
docker logs evolution-api | grep -i "key"
```

Busca líneas como:
```
API Key: abc123def456
apikey: tu-key-aqui
```

### Solución 2: Desactivar Auth (más simple)

```bash
ssh root@31.220.58.83
cd /root/evolution

# Editar docker-compose.yml
nano docker-compose.yml

# Agregar variable:
environment:
  - AUTHENTICATION=false

# Reiniciar
docker-compose restart evolution-api
```

### Solución 3: Configurar en Vercel

Si tienes la API Key:

1. Vercel → Settings → Environment Variables
2. Agregar: `EVO_API_KEY = tu-key-aqui`
3. Redeploy

---

## ✅ Checklist Final

- [x] Código actualizado con autenticación
- [x] startPollingQR removido
- [x] QR lectura flexible (qrcode/qr/QR)
- [x] Variables de entorno documentadas
- [x] Commit y push a GitHub
- [ ] **Pendiente:** Verificar Evolution API desde PC
- [ ] **Pendiente:** Configurar auth en Vercel (si necesario)
- [ ] **Pendiente:** Probar desde dashboard en producción

---

## 📊 Resumen de Cambios

| Componente | Antes | Después |
|------------|-------|---------|
| Backend Auth | ❌ Sin auth | ✅ Con EVO_API_KEY y EVO_BEARER |
| Helper fetch | ❌ fetch directo | ✅ evoFetch con auth |
| Frontend QR | ❌ Solo data.qr | ✅ qrcode/qr/QR |
| startPollingQR | ❌ ReferenceError | ✅ Removido |
| Variables env | ❌ Solo EVO_BASE_URL | ✅ + API_KEY + BEARER |

---

## 🎯 Próximos Pasos

### 1. Verificar Evolution API (desde tu PC)
```bash
curl http://31.220.58.83:8080/
curl -X POST http://31.220.58.83:8080/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
curl http://31.220.58.83:8080/sessions/default/qrcode
```

### 2. Si sale 403:
- Obtener API Key de Evolution
- O desactivar auth
- Configurar en Vercel

### 3. Esperar Deploy (ya en proceso)
- Monitorear en Vercel Dashboard
- ~2-3 minutos

### 4. Probar Dashboard
```
https://tu-dashboard.vercel.app/configuracion
→ Conectar WhatsApp
→ Ver QR ✅
→ Escanear con teléfono 📱
```

---

## 🎉 ¡Fix Completado!

### Lo que se arregló:
✅ ReferenceError de startPollingQR  
✅ Soporte para autenticación Evolution  
✅ Lectura flexible del QR  
✅ Código más robusto  

### Lo que falta:
⏳ Verificar Evolution API  
⏳ Configurar auth si es necesario  
⏳ Probar en producción  

**Tiempo estimado: 10 minutos** ⚡

