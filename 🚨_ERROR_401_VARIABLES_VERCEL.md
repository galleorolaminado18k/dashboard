# 🚨 ERROR EVO_HTTP_401 - VARIABLES NO CONFIGURADAS EN VERCEL

## ❌ ERROR ACTUAL

```
Error: EVO_HTTP_401
```

**Causa**: Las variables de entorno `EVO_BASE_URL` y `EVO_API_KEY` **NO están configuradas en Vercel** o **NO se hizo redeploy**.

---

## ✅ SOLUCIÓN INMEDIATA

### ❌ PROBLEMA DETECTADO:

**La variable `EVO_API_KEY` en Vercel tiene el valor INCORRECTO**

```
Valor actual: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
Valor correcto: galle-whatsapp-key-2025
```

**Las claves NO coinciden** entre Vercel y Evolution API. Por eso da error 401.

---

### PASO 1: ACTUALIZAR LA VARIABLE EN VERCEL

1. En Vercel → Settings → Environment Variables
2. Busca la variable `EVO_API_KEY`
3. Click en los **3 puntos** (`...`) a la derecha
4. Click **"Edit"**
5. **Cambiar el valor** a:
   ```
   galle-whatsapp-key-2025
   ```
6. Asegúrate que esté marcado: **Production**, **Preview**, **Development**
7. Click **"Save"**

**IMPORTANTE**: `EVO_BASE_URL` está correcto, NO lo toques.

---

### PASO 2: REDEPLOY (OBLIGATORIO)

**Las variables solo aplican después de hacer redeploy**

1. Click en **"Deployments"** (pestaña arriba)
2. Busca el deployment más reciente (debe decir "Ready")
3. Click en los **3 puntos** (`...`) a la derecha
4. Click **"Redeploy"**
5. En el modal, click **"Redeploy"** nuevamente
6. **ESPERA 2-3 MINUTOS** hasta que diga "Ready" ✅

---

### PASO 3: VERIFICAR EN FUNCTION LOGS

1. Después del redeploy, click en el deployment nuevo
2. Click en **"Function Logs"** (pestaña)
3. Ve a `/configuracion` y click "Conectar WhatsApp"
4. Busca en los logs:

**Deberías ver**:
```
[EVOLUTION] 🌐 Base URL: http://31.220.58.83:8080
[EVOLUTION] 🔑 API Key: Configurada ✅
```

**Si ves**:
```
[EVOLUTION] 🔑 API Key: No configurada ⚠️
```
→ Las variables NO se agregaron correctamente o NO marcaste "Production"

---

## 🔍 DIAGNÓSTICO RÁPIDO

### Problema 1: Variables no existen
**Solución**: Agregar las 2 variables (PASO 1)

### Problema 2: Variables existen pero no aplican
**Solución**: Hacer redeploy (PASO 2)

### Problema 3: Redeploy hecho pero sigue error
**Posibles causas**:
- No marcaste "Production" al agregar las variables
- El deployment antiguo sigue activo
- Las variables tienen errores de escritura

**Solución**:
1. Borra las variables
2. Agrégalas nuevamente asegurándote de marcar **Production**
3. Redeploy nuevamente

---

## ⚠️ IMPORTANTE

**Las variables de entorno en Vercel**:
- ✅ Solo aplican después de REDEPLOY
- ✅ Deben tener "Production" marcado
- ✅ Los valores deben ser EXACTOS (sin espacios)

---

## 📋 VALORES EXACTOS (COPIAR Y PEGAR)

```
EVO_BASE_URL
http://31.220.58.83:8080

EVO_API_KEY
galle-whatsapp-key-2025
```

**IMPORTANTE**: No agregues espacios antes o después de los valores

---

## 🎯 CHECKLIST

- [ ] Abrí Vercel Dashboard
- [ ] Fui a Settings → Environment Variables
- [ ] Agregué `EVO_BASE_URL` con valor exacto
- [ ] Agregué `EVO_API_KEY` con valor exacto
- [ ] Marqué "Production" en ambas variables
- [ ] Fui a Deployments
- [ ] Hice click en Redeploy
- [ ] Esperé 2-3 minutos hasta "Ready"
- [ ] Verifiqué Function Logs
- [ ] Probé en `/configuracion`

---

## 🚀 RESUMEN

1. **Agrega las 2 variables** (si no existen)
2. **Marca "Production"** en ambas
3. **Redeploy** (obligatorio)
4. **Espera 2-3 minutos**
5. **Prueba** en `/configuracion`

---

**VE A VERCEL AHORA Y CONFIGURA LAS VARIABLES** 👆

**El error 401 desaparecerá después del redeploy con las variables configuradas** ✅

