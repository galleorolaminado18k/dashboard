# ⚡ SOLUCIÓN ERROR 400 - CONFIGURACIÓN VERCEL REQUERIDA

## 🔍 PROBLEMA IDENTIFICADO

El error **EVO_HTTP_400** en producción (Vercel) indica que:
1. ✅ Evolution API está corriendo en el VPS
2. ✅ La API Key es correcta localmente
3. ❌ **Vercel NO tiene la variable `EVO_API_KEY` configurada**

---

## ✅ SOLUCIÓN APLICADA AL CÓDIGO

He actualizado el código para:
1. ✅ Usar endpoints correctos de Evolution API v2
2. ✅ Mejorar mensajes de error
3. ✅ Manejo robusto de autenticación

**Archivos modificados:**
- `app/api/whatsapp/evolution/route.ts`

---

## ⚡ CONFIGURAR VERCEL (OBLIGATORIO)

### PASO 1: Acceder a Vercel

1. Ve a: https://vercel.com
2. Login con tu cuenta
3. Selecciona tu proyecto **dashboard**

### PASO 2: Configurar Variables de Entorno

1. Click en **"Settings"** (en el menú lateral)
2. Click en **"Environment Variables"**
3. Busca si existe `EVO_API_KEY`

**Si NO existe:**
- Click en **"Add New"**
- Name: `EVO_API_KEY`
- Value: `galle-whatsapp-key-2025`
- Environments: ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

**Si ya existe pero tiene otro valor:**
- Click en los **3 puntos** (`...`) → **"Edit"**
- Cambia Value a: `galle-whatsapp-key-2025`
- Click **"Save"**

### PASO 3: Verificar también EVO_BASE_URL

Busca la variable `EVO_BASE_URL`:

**Si NO existe:**
- Click en **"Add New"**
- Name: `EVO_BASE_URL`
- Value: `http://31.220.58.83:8080`
- Environments: ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

**Si ya existe:**
- Verifica que el valor sea: `http://31.220.58.83:8080`

---

## 🚀 SUBIR CAMBIOS Y REDEPLOY

### PASO 1: Subir cambios a GitHub

En tu terminal de Windows:

```cmd
git add -A
git commit -m "fix: Corregir endpoints Evolution API v2 y manejo de errores"
git push
```

### PASO 2: Hacer Redeploy en Vercel

**Opción A - Redeploy automático** (si tienes auto-deploy habilitado):
- Espera 1-2 minutos
- Vercel detectará el push y hará deploy automáticamente

**Opción B - Redeploy manual**:
1. Ve a Vercel → **"Deployments"**
2. Click en el deployment más reciente
3. Click en los **3 puntos** (`...`) → **"Redeploy"**
4. En el modal, click **"Redeploy"** nuevamente
5. **Espera 2-3 minutos** hasta que diga "Ready" ✅

---

## 🧪 VERIFICAR DESPUÉS DEL DEPLOY

1. Ve a tu app en producción: `https://tu-app.vercel.app/configuracion`
2. Refresca la página (F5)
3. Ingresa: `3012439596`
4. Click: **"Conectar WhatsApp"**

**Resultado esperado:**
- ✅ Spinner "Generando código QR..."
- ✅ QR aparece en 2-5 segundos
- ✅ NO más error 400
- ✅ Puedes escanear el QR

**Si sigue fallando:**
- Ve a Vercel → Deployments → Click en el último → **"View Function Logs"**
- Busca líneas con `[EVOLUTION]`
- Envíame el error para investigar

---

## 📋 CHECKLIST

| Item | Estado |
|------|--------|
| Código corregido localmente | ✅ |
| `EVO_API_KEY` en Vercel | ⏳ **HACER AHORA** |
| `EVO_BASE_URL` en Vercel | ⏳ **VERIFICAR** |
| Push a GitHub | ⏳ **HACER AHORA** |
| Redeploy en Vercel | ⏳ Después del push |
| Prueba en producción | ⏳ Después del deploy |

---

## 🎯 RESUMEN DE ACCIONES

**1. CONFIGURAR VERCEL** (5 minutos):
   - Agrega `EVO_API_KEY=galle-whatsapp-key-2025`
   - Verifica `EVO_BASE_URL=http://31.220.58.83:8080`

**2. SUBIR CAMBIOS** (1 minuto):
   ```cmd
   git add -A
   git commit -m "fix: Corregir endpoints Evolution API v2"
   git push
   ```

**3. ESPERAR DEPLOY** (2-3 minutos):
   - Vercel hará deploy automáticamente
   - O haz Redeploy manual

**4. PROBAR** (1 minuto):
   - Ve a `/configuracion`
   - Conectar WhatsApp
   - ✅ Debería aparecer el QR

---

## 🔑 API KEY CORRECTA

```
EVO_API_KEY=galle-whatsapp-key-2025
```

**Esta es la clave que Evolution API espera. Debe estar en Vercel.**

---

**El código ya está corregido. Solo falta configurar Vercel y hacer push.** 🚀

