import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const waha = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'NOT_CONFIGURED'
  const apiKey = process.env.WAHA_API_KEY || 'NOT_CONFIGURED'

  return NextResponse.json({
    ok: true,
    waha_url: waha,
    has_api_key: apiKey !== 'NOT_CONFIGURED',
    environment: process.env.NODE_ENV || 'unknown'
  })
}
# 🔴 DIAGNÓSTICO COMPLETO - PROBLEMA ENCONTRADO

## ✅ LO QUE FUNCIONA

1. ✅ **VPS WAHA funcionando:** http://31.220.58.83:3000
2. ✅ **API Key correcto:** 4876d997cc954b7d8b966b9fd4863f73
3. ✅ **Accesible desde internet:** Status 200 OK
4. ✅ **Código actualizado en GitHub:** Headers con X-Api-Key

## ❌ EL PROBLEMA

**Vercel NO tiene las variables configuradas.**

Cuando Vercel ejecuta el código, usa:
```typescript
const WAHA = process.env.WAHA_BASE_URL || 'http://127.0.0.1:3000'  // ← Usa localhost
```

Como `WAHA_BASE_URL` no está en Vercel, intenta conectar a `127.0.0.1:3000` (localhost de Vercel), que obviamente falla → **WAHA_UNREACHABLE**.

---

## ✅ SOLUCIÓN DEFINITIVA

### **DEBES configurar estas variables en Vercel:**

1. **Ir a:** https://vercel.com/dashboard
2. Seleccionar tu proyecto
3. **Settings** → **Environment Variables**
4. **Add New:**

```
Name:  WAHA_BASE_URL
Value: http://31.220.58.83:3000
Environment: ☑ Production ☑ Preview ☑ Development
```

**Save**

```
Name:  WAHA_API_KEY
Value: 4876d997cc954b7d8b966b9fd4863f73
Environment: ☑ Production ☑ Preview ☑ Development
```

**Save**

5. **Vercel hará redeploy automático (2-3 minutos)**

---

## 🧪 CÓMO VERIFICAR SI ESTÁ CONFIGURADO

Después de configurar, ve a:
```
https://dashboard-galle.vercel.app/api/whatsapp/health
```

Debe mostrar:
```json
{"ok": true, "waha": "http://31.220.58.83:3000"}
```

Si muestra `http://127.0.0.1:3000` → Las variables NO están configuradas.

---

## 📊 ESTADO ACTUAL

| Componente | Estado | Verificado |
|-----------|--------|------------|
| VPS WAHA | ✅ Funcionando | `curl http://31.220.58.83:3000/api/server/status` |
| API Key | ✅ Correcto | Status 200 con header |
| Acceso público | ✅ Abierto | Test desde PC OK |
| Código GitHub | ✅ Actualizado | Commit 0715dc0 |
| **Variables Vercel** | ❌ **FALTA** | **← ESTO ES EL PROBLEMA** |

---

## 🎯 ACCIÓN INMEDIATA

**CONFIGURA LAS 2 VARIABLES EN VERCEL AHORA.**

Sin esas variables, Vercel intentará conectar a `localhost` en lugar de tu VPS.

El código está perfecto, solo falta la configuración.

