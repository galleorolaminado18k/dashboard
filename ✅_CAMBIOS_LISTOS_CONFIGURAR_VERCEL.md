# ✅ CAMBIOS SUBIDOS - CONFIGURAR VERCEL INMEDIATAMENTE

## 📦 Commit Info

**Commit**: `1709cf1`  
**Mensaje**: `fix: Corregir endpoints Evolution API v2 - GET/POST/DELETE + mejor manejo errores`  
**Estado**: ✅ Subido a GitHub

---

## ⚡ ACCIÓN INMEDIATA REQUERIDA

### 🎯 El error 400 se debe a que **VERCEL NO TIENE LA API KEY**

---

## 📋 PASOS A SEGUIR (10 MINUTOS)

### PASO 1: Configurar Vercel (5 min)

1. **Abre**: https://vercel.com
2. **Login** con tu cuenta
3. **Selecciona** tu proyecto
4. Click en **"Settings"** (menú lateral izquierdo)
5. Click en **"Environment Variables"**

### PASO 2: Agregar EVO_API_KEY

**Busca si existe `EVO_API_KEY`:**

#### Si NO existe:
1. Click en **"Add New"**
2. Completa:
   - **Name**: `EVO_API_KEY`
   - **Value**: `galle-whatsapp-key-2025`
   - **Environments**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Click **"Save"**

#### Si ya existe:
1. Click en los **3 puntos** (`...`)
2. Click **"Edit"**
3. Cambia **Value** a: `galle-whatsapp-key-2025`
4. Click **"Save"**

### PASO 3: Verificar EVO_BASE_URL

**Busca `EVO_BASE_URL` y verifica que sea:**
```
http://31.220.58.83:8080
```

Si no existe, agrégala igual que el paso anterior.

### PASO 4: Hacer Redeploy

#### Opción A - Automático:
- Vercel detectará el push de GitHub
- Espera 2-3 minutos
- Ve a **"Deployments"** y espera a que diga **"Ready"**

#### Opción B - Manual:
1. Ve a **"Deployments"**
2. Click en el deployment más reciente
3. Click en **"..."** → **"Redeploy"**
4. Confirma en el modal
5. Espera 2-3 minutos

---

## 🧪 VERIFICAR (Después del deploy)

1. Ve a tu app en producción
2. Navega a `/configuracion`
3. Ingresa el número: `3012439596`
4. Click: **"Conectar WhatsApp"**

**Resultado esperado:**
- ✅ QR aparece en 2-5 segundos
- ✅ NO error 400
- ✅ NO error 403
- ✅ Puedes escanearlo

---

## 🔍 Si sigue fallando

### Ver logs en Vercel:
1. Ve a **"Deployments"**
2. Click en el último deployment
3. Click en **"View Function Logs"**
4. Busca líneas con `[EVOLUTION]`
5. Copia el error completo

### Verificar variables:
```
Settings → Environment Variables
```

Debe tener:
- ✅ `EVO_API_KEY` = `galle-whatsapp-key-2025`
- ✅ `EVO_BASE_URL` = `http://31.220.58.83:8080`

---

## 📊 Cambios Realizados

### En el código:
1. ✅ Corregido GET: `/instance/fetchInstances`
2. ✅ Corregido DELETE: `/instance/delete/${NAME}`
3. ✅ Mejorado manejo de errores con códigos específicos
4. ✅ Mensajes más claros para debugging

### Endpoints Evolution API v2 correctos:
- ✅ POST `/instance/create` - Crear instancia
- ✅ GET `/instance/fetchInstances` - Ver estado
- ✅ GET `/instance/connect/${NAME}` - Obtener QR
- ✅ DELETE `/instance/delete/${NAME}` - Eliminar

---

## 🎯 RESUMEN

| Tarea | Estado |
|-------|--------|
| Código corregido | ✅ |
| Push a GitHub | ✅ |
| Variables en Vercel | ⏳ **HACER AHORA** |
| Redeploy en Vercel | ⏳ Automático/Manual |
| Prueba en producción | ⏳ Después del deploy |

---

## 🔑 VARIABLES REQUERIDAS EN VERCEL

```env
EVO_BASE_URL=http://31.220.58.83:8080
EVO_API_KEY=galle-whatsapp-key-2025
```

**SIN ESTAS VARIABLES, LA APP NO FUNCIONARÁ EN PRODUCCIÓN**

---

## ⚡ SIGUIENTE PASO INMEDIATO

**Ve a Vercel AHORA y configura las variables.**

Después del deploy, el error 400 desaparecerá y el QR aparecerá correctamente.

---

**Todo listo en el código. Solo falta configurar Vercel.** 🚀

