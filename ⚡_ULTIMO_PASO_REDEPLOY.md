# ⚡ ÚLTIMO PASO - HACER REDEPLOY AHORA

## ✅ API KEY YA ACTUALIZADA

Veo que **ya cambiaste la API Key** a `galle-whatsapp-key-2025` hace 37 minutos ✅

---

## ⚠️ PROBLEMA: FALTA REDEPLOY

**Las variables de entorno en Vercel NO aplican automáticamente**.

Necesitas hacer **REDEPLOY** para que Vercel use la nueva API Key.

---

## 🚀 SOLUCIÓN INMEDIATA (2 MINUTOS)

### PASO 1: Ir a Deployments

1. En Vercel, click en **"Deployments"** (pestaña arriba)

### PASO 2: Redeploy

1. Busca el deployment más reciente (el primero de la lista)
2. Click en los **3 puntos** (`...`) a la derecha
3. Click **"Redeploy"**
4. En el modal que aparece, click **"Redeploy"** nuevamente
5. **Espera 2-3 minutos** hasta que el status cambie a **"Ready"** ✅

---

## 🧪 PASO 3: PROBAR

Después de que el deployment diga "Ready":

1. Ve a tu app: `/configuracion`
2. Refresca la página (F5 o Ctrl+R)
3. Ingresa número: `3012439596`
4. Click **"Conectar WhatsApp"**

**Resultado esperado**:
- ✅ Spinner "Generando código QR..."
- ✅ QR aparece en 2-5 segundos
- ✅ NO más error 400
- ✅ Puedes escanear el QR

---

## 📋 VERIFICAR EN FUNCTION LOGS (OPCIONAL)

Si quieres confirmar que está usando la nueva API Key:

1. Después del redeploy, click en el deployment nuevo
2. Click en **"Function Logs"** (pestaña)
3. Ve a `/configuracion` y click "Conectar WhatsApp"
4. Busca en los logs:

**Deberías ver**:
```
[EVOLUTION] 🔑 API Key configurada: Sí
[EVOLUTION] 🔄 Creando instancia...
[EVOLUTION] ✅ Instancia creada
```

**Si ves error 401**:
- El redeploy no aplicó las variables
- Redeploy nuevamente

**Si ves error 400**:
- Vercel sigue usando código antiguo
- Redeploy nuevamente

---

## ✅ RESUMEN

| Estado | ✓ |
|--------|---|
| Evolution API funcionando en VPS | ✅ |
| API Key actualizada en Vercel | ✅ |
| Código corregido en GitHub | ✅ |
| **Redeploy hecho** | ⏳ **HACER AHORA** |

---

## 🎯 ACCIÓN INMEDIATA

**VE A VERCEL → DEPLOYMENTS → REDEPLOY** 👆

**Después del redeploy (2-3 min), prueba en `/configuracion` y el QR aparecerá** ✅

---

**TODO ESTÁ LISTO, SOLO FALTA EL REDEPLOY PARA QUE FUNCIONE** 🚀

