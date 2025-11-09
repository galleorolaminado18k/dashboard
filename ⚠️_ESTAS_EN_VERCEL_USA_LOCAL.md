# ⚠️ IMPORTANTE - ESTÁS VIENDO VERCEL (NO LOCAL)

## 🔍 El Problema Actual

El error que ves es porque **estás accediendo a la URL de Vercel** (producción):
```
dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app
```

En Vercel, **WAHA no está configurado** porque:
1. Docker no funciona en Vercel
2. No tienes WAHA desplegado en un servidor externo
3. El código intenta conectar a `localhost` que no existe en Vercel

## ✅ Solución Inmediata

### Opción 1: Usar en Local (RECOMENDADO - Funciona Ya)

```bash
# 1. Inicia WAHA con Docker (en tu máquina)
docker-compose -f docker-compose.waha.yml up -d

# 2. Verifica que esté corriendo
docker ps
# Deberías ver: waha-whatsapp ... Up ... 0.0.0.0:3000->3000/tcp

# 3. Inicia el dashboard LOCALMENTE
npm run dev

# 4. Abre en navegador LOCAL (NO Vercel):
http://localhost:3000/configuracion

# 5. Click "Conectar WhatsApp"
# ✅ AHORA FUNCIONARÁ porque WAHA está en tu máquina
```

### Opción 2: Esperar Deploy de Vercel

Los cambios que acabamos de subir a GitHub **aún no están desplegados en Vercel**. 

1. Ve a: https://vercel.com/dashboard
2. Busca tu proyecto
3. Espera a que termine el build (unos 2-3 minutos)
4. Una vez desplegado, verás un **mensaje más claro** explicando que WAHA no está configurado

## 📊 Diferencias

| Ubicación | URL | WAHA | Funciona |
|-----------|-----|------|----------|
| **Local** | `localhost:3000` | Docker local | ✅ SI |
| **Vercel** | `.vercel.app` | ❌ No existe | ❌ NO |

## 🎯 Por Qué el Error en Vercel

El código en Vercel (versión anterior) intenta:
```typescript
// En Vercel, esto NO existe:
fetch('http://127.0.0.1:3000/api/sessions/default/start')
// ❌ Error 403/404 porque no hay WAHA corriendo
```

La nueva versión (recién subida) detectará esto y mostrará:
```
🚨 WAHA NO ESTÁ CONFIGURADO EN VERCEL

Estás en Vercel intentando conectar a localhost que no existe.

Solución:
1. Local: docker-compose up y abre localhost:3000
2. Producción: Despliega WAHA en Railway/VPS
```

## 🚀 Para Probar AHORA (Sin Esperar Vercel)

### Terminal 1: WAHA
```bash
cd C:\Users\USUARIO\WebstormProjects\dashboard
docker-compose -f docker-compose.waha.yml up -d
```

### Terminal 2: Dashboard
```bash
cd C:\Users\USUARIO\WebstormProjects\dashboard
npm run dev
```

### Navegador
```
http://localhost:3000/configuracion
```

**NO uses la URL de Vercel** hasta que:
1. Despliegues WAHA en Railway/VPS
2. Configures `WAHA_BASE_URL` en Vercel

## 🔧 Para Usar en Producción (Vercel)

### Paso 1: Desplegar WAHA en Railway

1. Ve a: https://railway.app
2. Click "Start a New Project"
3. Elige "Deploy from GitHub repo"
4. Busca: `devlikeapro/waha`
5. Railway te dará una URL como: `https://waha-production.up.railway.app`

### Paso 2: Configurar en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Settings → Environment Variables
4. Agrega:
   ```
   WAHA_BASE_URL=https://waha-production.up.railway.app
   ```
5. Redeploy

### Paso 3: Probar en Vercel

Ahora sí funcionará en:
```
https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app/configuracion
```

## 📋 Checklist

- [x] Código actualizado con verificación de WAHA
- [x] Subido a GitHub
- [ ] **PENDIENTE**: Esperando deploy de Vercel (2-3 min)
- [ ] **PENDIENTE**: Probar en LOCAL (docker-compose up + npm run dev)
- [ ] **OPCIONAL**: Desplegar WAHA en Railway para producción

## ⚡ Acción Inmediata

**EJECUTA ESTO AHORA para probar localmente:**

```bash
# Terminal 1
docker-compose -f docker-compose.waha.yml up -d

# Terminal 2
npm run dev

# Navegador
http://localhost:3000/configuracion
```

**NO intentes usar la URL de Vercel todavía** - necesitas:
1. Esperar que termine el build en Vercel
2. O configurar WAHA externo

---

**TL;DR**: Estás viendo Vercel sin WAHA. Usa `localhost:3000` con Docker para que funcione ya.

