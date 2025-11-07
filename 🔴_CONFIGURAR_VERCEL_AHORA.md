# 🔴 PROBLEMA: VERCEL NO TIENE EL WAHA_BASE_URL CONFIGURADO

## 🔍 DIAGNÓSTICO ACTUAL

Los logs muestran que las peticiones llegan a WAHA pero dan **401 Unauthorized**:
```
[06:00:30.981] request completed {"url":"/api/session/default/start","statusCode":401}
```

Esto significa que:
1. ✅ VPS está funcionando
2. ✅ WAHA está corriendo
3. ✅ El código con API KEY está en GitHub
4. ❌ **Vercel NO tiene configurada la variable WAHA_BASE_URL**

---

## ✅ SOLUCIÓN INMEDIATA

### **Configurar variables en Vercel:**

1. **Ir a:** https://vercel.com/dashboard
2. **Seleccionar** tu proyecto (dashboard-galle...)
3. **Settings** → **Environment Variables**
4. **Add New** y agregar estas 2 variables:

#### Variable 1:
```
Name:  WAHA_BASE_URL
Value: http://31.220.58.83:3000
Environment: ☑ Production ☑ Preview ☑ Development
```

#### Variable 2:
```
Name:  WAHA_API_KEY
Value: 4876d997cc954b7d8b966b9fd4863f73
Environment: ☑ Production ☑ Preview ☑ Development
```

5. **Click "Save"**
6. **Esperar 2-3 minutos** (redeploy automático)

---

## 🧪 VERIFICAR DESPUÉS

1. https://dashboard-galle.vercel.app/configuracion
2. Click "Conectar WhatsApp"
3. ✅ QR debe aparecer

---

## 📋 ALTERNATIVA: Configurar desde CLI

```bash
vercel env add WAHA_BASE_URL production
# Pegar: http://31.220.58.83:3000

vercel env add WAHA_API_KEY production
# Pegar: 4876d997cc954b7d8b966b9fd4863f73
```

---

**EL CÓDIGO YA ESTÁ CORRECTO. SOLO FALTA CONFIGURAR LAS VARIABLES EN VERCEL.** ✅

