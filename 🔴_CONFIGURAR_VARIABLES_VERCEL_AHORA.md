# 🔴 ERROR WAHA_UNREACHABLE - SOLUCIÓN DEFINITIVA

## ❌ EL PROBLEMA ACTUAL

```
Error al iniciar sesión: WAHA_UNREACHABLE
Failed to load resource: the server responded with a status of 404 ()
Failed to load resource: the server responded with a status of 502 ()
```

## 🎯 LA CAUSA

**LAS VARIABLES DE ENTORNO NO ESTÁN CONFIGURADAS EN VERCEL**

Cuando el código se ejecuta en Vercel:
```typescript
const WAHA = process.env.WAHA_BASE_URL || 'http://127.0.0.1:3000'
```

Como `WAHA_BASE_URL` **NO EXISTE** en Vercel, usa `localhost` → ❌ FALLA

---

## ✅ SOLUCIÓN (HACER AHORA - 2 MINUTOS)

### **PASO 1: Ir a Vercel Dashboard**

1. Abre: **https://vercel.com/dashboard**
2. **Inicia sesión** con tu cuenta
3. Busca y haz click en tu proyecto: **"dashboard"** o **"galle"**

---

### **PASO 2: Ir a Settings → Environment Variables**

1. En el proyecto, click en la pestaña **"Settings"** (arriba)
2. En el menú lateral izquierdo, click en **"Environment Variables"**

---

### **PASO 3: Agregar la primera variable**

Click en **"Add New"** o **"Add Variable"**

**Variable 1:**
```
Key (Name):     WAHA_BASE_URL
Value:          http://31.220.58.83:3000

Environment:
☑ Production
☑ Preview  
☑ Development
```

Click **"Save"**

---

### **PASO 4: Agregar la segunda variable**

Click en **"Add New"** nuevamente

**Variable 2:**
```
Key (Name):     WAHA_API_KEY
Value:          4876d997cc954b7d8b966b9fd4863f73

Environment:
☑ Production
☑ Preview
☑ Development
```

Click **"Save"**

---

### **PASO 5: Forzar Redeploy**

1. Ve a la pestaña **"Deployments"** (arriba)
2. En el último deployment, click en los **3 puntos** (⋮)
3. Click en **"Redeploy"**
4. Confirma **"Redeploy"**

**Tiempo:** 2-3 minutos

---

## ✅ VERIFICACIÓN

Después del redeploy:

1. Ve a: **https://dashboard-galle.vercel.app/configuracion**
2. Click en **"Conectar WhatsApp"**
3. ✅ **Debe aparecer el QR REAL** (sin error WAHA_UNREACHABLE)

---

## 📊 CHECKLIST

- [ ] Variables agregadas en Vercel
- [ ] Redeploy ejecutado
- [ ] WhatsApp conectado

---

## 🔴 SI NO LO HACES

**El error persistirá indefinidamente** porque Vercel no sabe dónde está WAHA.

El código está **100% correcto**. Solo falta la configuración.

---

## 📸 CAPTURAS DE REFERENCIA

**Settings → Environment Variables debe mostrar:**
```
WAHA_BASE_URL     http://31.220.58.83:3000     Production, Preview, Development
WAHA_API_KEY      4876...f73                   Production, Preview, Development
```

---

**¡HAZLO AHORA! Son solo 2 minutos.** 🚀

