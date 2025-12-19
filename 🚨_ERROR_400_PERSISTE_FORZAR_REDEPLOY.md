# 🚨 ERROR 400 PERSISTE - VERCEL NO HA HECHO DEPLOY

## ❌ PROBLEMA ACTUAL

El error 400 persiste porque **Vercel NO ha detectado los cambios de GitHub** o **está usando el deployment antiguo**.

**Cambios subidos a GitHub**: ✅ Commit `cda3fa7`  
**Vercel con código actualizado**: ❌ NO (sigue usando código antiguo)

---

## ✅ SOLUCIÓN INMEDIATA - FORZAR REDEPLOY EN VERCEL

### PASO 1: Ir a Vercel Deployments

1. Ve a: https://vercel.com/dashboard
2. Tu proyecto
3. Click en **"Deployments"** (pestaña arriba)

### PASO 2: Verificar último deployment

Busca el deployment más reciente. Debe decir:
- **"Ready"** (verde) - Deployment exitoso
- **Fecha**: Hoy, hace X minutos

**¿Qué ves?**

#### Opción A: El último deployment es de HOY (hace minutos)
→ Vercel YA detectó los cambios  
→ Ve al **PASO 3** (cambiar API Key)

#### Opción B: El último deployment es de AYER o hace horas
→ Vercel NO detectó los cambios  
→ Necesitas **forzar redeploy manual**:

1. Click en el deployment más reciente
2. Click en los **3 puntos** (`...`) arriba a la derecha
3. Click **"Redeploy"**
4. En el modal, click **"Redeploy"** nuevamente
5. **Espera 2-3 minutos** hasta que diga "Ready" ✅

---

### PASO 3: CAMBIAR API KEY EN VERCEL (CRÍTICO)

**Incluso con el código nuevo, seguirá fallando si la API Key es incorrecta**

1. Settings → Environment Variables
2. Variable `EVO_API_KEY`
3. Click **3 puntos** (`...`) → **Edit**
4. Cambiar valor de:
   ```
   81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
   ```
   A:
   ```
   galle-whatsapp-key-2025
   ```
5. Marcar: **Production**, **Preview**, **Development**
6. Click **"Save"**

### PASO 4: REDEPLOY NUEVAMENTE (DESPUÉS DE CAMBIAR LA KEY)

**Las variables solo aplican después de redeploy**

1. Deployments
2. Último deployment → **3 puntos** → **Redeploy**
3. Espera 2-3 minutos
4. Prueba en `/configuracion`

---

## 🔍 VERIFICAR SI EL CÓDIGO NUEVO ESTÁ EN VERCEL

### En los Function Logs (después del redeploy):

1. Deployments → Click en el último deployment
2. **Function Logs** (pestaña)
3. Ve a `/configuracion` y click "Conectar WhatsApp"
4. Busca en los logs:

**Si ves el código NUEVO** (correcto):
```
[EVOLUTION] 🔄 Creando instancia...
```

**Si ves el código VIEJO** (incorrecto):
```
[EVOLUTION] 🔄 Iniciando sesión...
```

Si ves el código viejo → Vercel NO actualizó → Redeploy manual nuevamente

---

## 📊 CHECKLIST COMPLETO

- [ ] Verifiqué que los cambios están en GitHub (commit `cda3fa7`)
- [ ] Fui a Vercel Deployments
- [ ] El último deployment es de HOY (o hice redeploy manual)
- [ ] Esperé 2-3 minutos hasta "Ready"
- [ ] Cambié `EVO_API_KEY` a `galle-whatsapp-key-2025`
- [ ] Hice redeploy DESPUÉS de cambiar la key
- [ ] Esperé 2-3 minutos nuevamente
- [ ] Verifiqué Function Logs (debe decir "Creando instancia")
- [ ] Probé en `/configuracion`
- [ ] QR apareció ✅

---

## 🎯 RESUMEN DE POR QUÉ SIGUE FALLANDO

| Razón | Solución |
|-------|----------|
| Vercel no detectó cambios de GitHub | Redeploy manual |
| Vercel usa deployment antiguo | Redeploy manual |
| API Key sigue siendo la incorrecta | Cambiar a `galle-whatsapp-key-2025` |
| Variables no aplican sin redeploy | Redeploy después de cambiar key |
| Cache de Vercel | Hard refresh (Ctrl+Shift+R) |

---

## ⚡ COMANDO RÁPIDO (SI NADA FUNCIONA)

### Verificar en el VPS que Evolution funciona:

```bash
curl -i -H "apikey: galle-whatsapp-key-2025" -X POST http://127.0.0.1:8080/instance/create -H "Content-Type: application/json" -d '{"instanceName":"default","token":"default","qrcode":true}'
```

**Debe responder**: `200 OK` o `409 Conflict` (si ya existe)

Si responde 200/409 → Evolution funciona ✅  
Si responde 400 → Hay problema en Evolution

---

## 🚀 ACCIÓN INMEDIATA

1. **VE A VERCEL → DEPLOYMENTS**
2. **VERIFICA SI HAY DEPLOYMENT NUEVO DE HOY**
3. **SI NO → REDEPLOY MANUAL**
4. **CAMBIA API KEY**
5. **REDEPLOY NUEVAMENTE**
6. **PRUEBA**

---

**El código está correcto en GitHub. Solo falta que Vercel lo use y que cambies la API Key** ✅

