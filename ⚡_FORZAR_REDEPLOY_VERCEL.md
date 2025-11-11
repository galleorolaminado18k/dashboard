# ⚡ FORZAR REDEPLOY EN VERCEL - INSTRUCCIONES PASO A PASO

## 🎯 SITUACIÓN ACTUAL

Los cambios están en GitHub en la rama `feature/meta-ads-integration-v2`, pero Vercel no ha hecho redeploy automático.

**Commit actual**: `f03d83c` - Scripts automatizados completos para VPS

---

## 🚀 PASO 1: FORZAR REDEPLOY MANUALMENTE

### Opción A: Desde el Dashboard de Vercel (MÁS FÁCIL) ⭐

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto (dashboard)
3. Click en la pestaña **"Deployments"**
4. Busca el último deployment
5. Click en los **3 puntos** (`...`) a la derecha
6. Click en **"Redeploy"**
7. En el modal, asegúrate de que diga:
   - **Branch**: `feature/meta-ads-integration-v2`
   - **Use existing Build Cache**: ✅ (marcado)
8. Click en **"Redeploy"**

### Opción B: Hacer un commit vacío para forzar redeploy

Si la Opción A no funciona:

```bash
git commit --allow-empty -m "chore: Forzar redeploy en Vercel"
git push origin feature/meta-ads-integration-v2
```

Esto creará un commit vacío que forzará a Vercel a hacer redeploy.

---

## ⚙️ PASO 2: VERIFICAR VARIABLES DE ENTORNO EN VERCEL

**ANTES** de hacer redeploy, asegúrate de que estas variables estén configuradas:

1. Ve a: https://vercel.com/dashboard
2. Tu proyecto → **Settings** → **Environment Variables**
3. Verificar que existan:

```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080
(O https://tu-dominio.com si usas Caddy)

Name: EVO_API_KEY
Value: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

4. Si NO existen, agrégalas:
   - Click **"Add New"**
   - Ingresar Name y Value
   - Click **"Save"**

5. **DESPUÉS** de agregar variables, hacer redeploy (Paso 1)

---

## 🔍 PASO 3: MONITOREAR EL DEPLOYMENT

1. En **Deployments**, click en el deployment que se está ejecutando
2. Verás:
   - **Building** (1-2 minutos)
   - **Deploying** (30 segundos)
   - **Ready** ✅

3. Si hay errores:
   - Click en **"Build Logs"** para ver errores de compilación
   - Click en **"Function Logs"** para ver errores de runtime

---

## ✅ PASO 4: VERIFICAR QUE FUNCIONA

### A) Verificar en los logs de Vercel:

1. Deployments → Click en el último deployment
2. **Function Logs** (pestaña)
3. Ir a `/configuracion` en tu app
4. Click en "Conectar WhatsApp"
5. Los logs deberían mostrar:

```
[EVOLUTION] 🚀 Iniciando sesión de WhatsApp...
[EVOLUTION] 🔗 Llamando: http://31.220.58.83:8080/health
[EVOLUTION] ✅ Health check OK
[EVOLUTION] ✅ Sesión iniciada: OK
[EVOLUTION] ✅ QR obtenido exitosamente!
```

### B) Verificar en el dashboard:

1. Ve a: `https://tu-app.vercel.app/configuracion`
2. Ingresar número: `3001234567`
3. Click **"Conectar WhatsApp"**
4. Deberías ver:
   - ✅ Spinner "Generando código QR..."
   - ✅ QR aparece en 2-5 segundos
   - ✅ **NO** hay error `EVO_UNREACHABLE`
   - ✅ **NO** hay error `502 Bad Gateway`

---

## 🐛 SI EL REDEPLOY FALLA

### Error: "Build failed"

**Ver logs**:
1. Deployments → Click en el deployment fallido
2. **Build Logs**

**Causas comunes**:
- Error de sintaxis en el código
- Dependencias faltantes
- Problemas con TypeScript

**Solución**:
- Revisar los logs de error
- Corregir el archivo indicado
- Hacer commit y push

### Error: "Function Invocation Failed"

**Causa**: Error en runtime (cuando se ejecuta la API)

**Solución**:
1. Ver **Function Logs**
2. Buscar el error específico
3. Verificar que Evolution API esté corriendo en el VPS

### No aparece el nuevo deployment

**Causa**: Vercel no está detectando el push

**Solución**:
1. Verificar que estés en la rama correcta: `feature/meta-ads-integration-v2`
2. Verificar configuración de Vercel:
   - Settings → Git
   - Verificar que la rama esté conectada
3. Hacer commit vacío (Opción B del Paso 1)

---

## 🔄 ALTERNATIVA: USAR VERCEL CLI

Si el dashboard no funciona, usa la CLI:

```bash
# Instalar Vercel CLI (si no lo tienes)
npm install -g vercel

# Login
vercel login

# Ir al directorio del proyecto
cd C:\Users\USUARIO\WebstormProjects\dashboard

# Deployar manualmente
vercel --prod
```

---

## 📋 CHECKLIST FINAL

Antes de considerar que el redeploy está completo:

- [ ] Vercel muestra "Ready" en el último deployment
- [ ] Variables `EVO_BASE_URL` y `EVO_API_KEY` están configuradas
- [ ] Build Logs no muestran errores
- [ ] Function Logs muestran `[EVOLUTION] ✅ Health check OK`
- [ ] Dashboard en `/configuracion` muestra QR sin errores
- [ ] NO hay error `EVO_UNREACHABLE` en consola del navegador

---

## 🎯 RESUMEN RÁPIDO (COPIAR Y PEGAR)

### Si tienes las variables configuradas:

1. Vercel Dashboard → Tu proyecto → Deployments
2. Último deployment → 3 puntos → **Redeploy**
3. Esperar 2-3 minutos
4. Verificar en `/configuracion`

### Si NO tienes las variables:

1. Vercel → Settings → Environment Variables
2. Agregar:
   ```
   EVO_BASE_URL = http://31.220.58.83:8080
   EVO_API_KEY = 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
   ```
3. Deployments → Redeploy
4. Verificar en `/configuracion`

---

## 💡 NOTA IMPORTANTE

**Vercel NO redeploya automáticamente cuando:**
- Solo cambias variables de entorno (necesitas redeploy manual)
- Solo cambias archivos markdown (`.md`)
- Estás en una rama que no está configurada para auto-deploy

**Vercel SÍ redeploya automáticamente cuando:**
- Haces push de cambios en archivos `.ts`, `.tsx`, `.js`, `.jsx`
- La rama está configurada para auto-deploy en Settings → Git

---

**🚀 Ahora ve a Vercel y haz el redeploy manual siguiendo el Paso 1!**

