# 🔍 DIAGNÓSTICO - Encontrar ruta correcta

## ❌ PROBLEMA IDENTIFICADO

Evolution API está corriendo PERO `/health` no existe (404).

## ✅ PROBAR RUTAS ALTERNATIVAS

**EJECUTA ESTOS COMANDOS EN EL VPS** (uno por uno):

```bash
# Probar ruta raíz
curl -i http://127.0.0.1:8080/

# Probar /manager
curl -i http://127.0.0.1:8080/manager

# Probar /instance/status
curl -i http://127.0.0.1:8080/instance/status

# Probar /instance
curl -i http://127.0.0.1:8080/instance

# Probar sin ruta (solo el puerto)
curl -i http://127.0.0.1:8080
```

---

## 🎯 MIENTRAS TANTO - ACTUALIZAR VERCEL

**La API ESTÁ FUNCIONANDO**, solo necesitamos la ruta correcta.

### Configurar en Vercel AHORA:

1. Ve a: https://vercel.com/dashboard
2. Tu proyecto → **Settings** → **Environment Variables**
3. Agregar/Actualizar:

```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_API_KEY  
Value: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

4. **Deployments** → Último → **Redeploy** (OBLIGATORIO)

---

## ✅ PROBABLEMENTE YA FUNCIONA

Evolution API v2.2.3 puede no tener endpoint `/health` pero SÍ tiene las rutas de WhatsApp.

**DESPUÉS DEL REDEPLOY**:

1. Ve a: `/configuracion` en tu app
2. Ingresa número: `3012439596`
3. Click **"Conectar WhatsApp"**
4. **El QR debería aparecer** ✅

---

## 🔧 SI NO FUNCIONA

Ejecuta los comandos de prueba arriba y **pega el resultado** para encontrar la ruta correcta.

---

**🚀 CONFIGURA VERCEL Y HAZ REDEPLOY AHORA MIENTRAS PRUEBAS LAS RUTAS!**

