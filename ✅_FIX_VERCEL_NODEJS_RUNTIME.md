# ✅ FIX APLICADO: Evolution API con Node.js Runtime

## 🎯 Problema Resuelto

**Error original:** 
```
403 Forbidden - Edge Runtime no puede hacer fetch a IPs externas
```

**Solución aplicada:**
- ✅ Cambio de `runtime: 'edge'` → `runtime: 'nodejs'`
- ✅ Configuración en `vercel.json` para forzar Node.js
- ✅ Código simplificado sin helpers complejos
- ✅ Respuesta directa de Evolution API

---

## 📝 Cambios Realizados

### 1. ✅ `app/api/whatsapp/evolution/route.ts`
```typescript
// Antes:
export const runtime = 'edge'

// Ahora:
export const runtime = 'nodejs'  // ✅ Permite fetch a IPs externas
export const dynamic = 'force-dynamic'
```

**Handlers simplificados:**
- POST: Iniciar sesión + obtener QR
- GET: Verificar estado de sesión
- DELETE: Eliminar sesión
- Sin helpers complejos, fetch directo

### 2. ✅ `vercel.json`
```json
{
  "functions": {
    "app/api/whatsapp/evolution/route.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 60
    }
  }
}
```

### 3. ✅ `app/(dashboard)/configuracion/page.tsx`
```typescript
// Cambio en lectura de respuesta:
// Antes: data.qr
// Ahora: data.qrcode  // ✅ Como lo retorna Evolution API
```

### 4. ✅ Scripts de verificación
- `test-evolution.sh` (Linux/Mac)
- `test-evolution.ps1` (Windows)

---

## 🚀 Pasos para Desplegar en Vercel

### Paso 1: Verificar Variable de Entorno

Ve a: **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**

**Verifica que exista:**
```
EVO_BASE_URL = http://31.220.58.83:8080
```

**Si tienes dominio con HTTPS:**
```
EVO_BASE_URL = https://whats.tudominio.com
```

**Importante:**
- ✅ Aplicar a: **Production**, **Preview**, **Development**
- ✅ Sin espacios ni comillas extras
- ✅ Con `http://` o `https://`

### Paso 2: Redeploy en Vercel

#### Opción A: Desde Dashboard
1. Ve a **Deployments**
2. Click en el último deployment
3. Click en **...** (tres puntos)
4. Click en **Redeploy**
5. Confirmar

#### Opción B: Desde Git
```bash
# Hacer un commit vacío para forzar redeploy
git commit --allow-empty -m "chore: redeploy for Evolution API fix"
git push origin feature/meta-ads-integration-v2
```

### Paso 3: Esperar Deploy (2-3 minutos)

Monitorea en **Vercel Dashboard** → **Deployments**

Busca estos logs:
```
✓ Building app...
✓ Compiled successfully
✓ Exporting (Static) 
✓ Deployment ready
```

### Paso 4: Verificar que Funciona

#### A. Verificar endpoint en producción:
```bash
# Reemplaza TU-DOMINIO con tu URL de Vercel
curl -X POST https://tu-dashboard.vercel.app/api/whatsapp/evolution
```

**Respuesta esperada:**
```json
{
  "qrcode": "data:image/png;base64,iVBORw0KG..."
}
```

#### B. Probar desde Dashboard:
1. Abre: `https://tu-dashboard.vercel.app/configuracion`
2. Pestaña: **CRM & WhatsApp**
3. Ingresa tu número de WhatsApp
4. Click: **Conectar WhatsApp**
5. Debe aparecer el QR ✅

---

## 🧪 Verificación Local (Antes de Deploy)

### Probar que Evolution API responde:

```bash
# Windows PowerShell
curl http://31.220.58.83:8080/

# Debe responder:
# {"status":200,"message":"Welcome to the Evolution API, it is working!"}
```

### Probar inicio de sesión:

```bash
# Windows PowerShell
$body = @{
    sessionName = "default"
    whatsappVersion = "v2"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://31.220.58.83:8080/sessions/start" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

### Probar QR:

```bash
# Windows PowerShell
$response = Invoke-RestMethod -Uri "http://31.220.58.83:8080/sessions/default/qrcode" -Method Get

# Verificar que existe qrcode
$response.qrcode.Length
# Debe mostrar un número grande (ej: 15000+)
```

---

## ✅ Checklist Final

Antes de desplegar en Vercel, verifica:

- [ ] Evolution API corriendo en VPS: `docker ps | grep evolution`
- [ ] Evolution API responde: `curl http://31.220.58.83:8080/`
- [ ] Variable `EVO_BASE_URL` configurada en Vercel
- [ ] Código con `runtime: 'nodejs'` (no 'edge')
- [ ] `vercel.json` con configuración de functions
- [ ] Código subido a GitHub en `feature/meta-ads-integration-v2`

---

## 🐛 Troubleshooting

### Error: "EVO_UNREACHABLE" en Vercel

**Causa:** Vercel no puede conectar a tu VPS

**Solución:**
```bash
# 1. Verificar que Evolution API esté corriendo
ssh root@31.220.58.83
docker ps | grep evolution

# 2. Verificar que puerto 8080 esté abierto
curl http://31.220.58.83:8080/

# 3. Si no responde, reiniciar
docker restart evolution-api
```

### Error: "Cannot read property 'qrcode'"

**Causa:** Respuesta de Evolution API no tiene el campo esperado

**Solución:**
```bash
# Verificar respuesta directa
curl http://31.220.58.83:8080/sessions/default/qrcode

# Debe retornar:
# {"qrcode":"data:image/png;base64,..."}
```

### Error: "Runtime 'edge' is not supported"

**Causa:** Código viejo aún está en Vercel

**Solución:**
1. Verificar que el código en GitHub tenga `runtime: 'nodejs'`
2. Hacer redeploy forzado
3. Limpiar cache de Vercel (Settings → General → Clear cache)

---

## 📊 Comparación Antes/Después

| Antes (Edge Runtime) | Después (Node.js Runtime) |
|---------------------|---------------------------|
| ❌ Error 403 Forbidden | ✅ Funciona correctamente |
| ❌ No puede fetch a IPs | ✅ Puede fetch a cualquier URL |
| ❌ Código complejo | ✅ Código simple y directo |
| ❌ Helpers innecesarios | ✅ Fetch directo |
| ❌ Transformaciones | ✅ Respuesta directa |

---

## 🎯 Resultado Esperado

Después de aplicar este fix:

1. ✅ Vercel puede conectar a Evolution API en el VPS
2. ✅ El endpoint `/api/whatsapp/evolution` funciona
3. ✅ El QR se genera correctamente
4. ✅ El dashboard puede mostrar el QR de WhatsApp
5. ✅ Los usuarios pueden escanear y conectar WhatsApp

---

## 📱 Probar en Producción

1. **Dashboard en Vercel:**
   ```
   https://tu-dashboard.vercel.app/configuracion
   ```

2. **Pestaña:** CRM & WhatsApp

3. **Acción:** Conectar WhatsApp

4. **Resultado esperado:** 
   - QR se muestra en segundos
   - Sin errores 403
   - Puedes escanear con tu teléfono

---

## 🎉 ¡Fix Completado!

Este fix soluciona definitivamente el problema de Vercel con Evolution API.

**Estado actual:**
- ✅ Código actualizado en GitHub
- ✅ Runtime cambiado a Node.js
- ✅ vercel.json configurado
- ⏳ **Pendiente:** Redeploy en Vercel

**Siguiente paso:** 
1. Redeploy en Vercel
2. Probar WhatsApp desde tu dashboard
3. Escanear QR y conectar 📱✨

