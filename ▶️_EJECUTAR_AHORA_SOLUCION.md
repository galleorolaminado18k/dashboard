# 🚀 EJECUTAR AHORA - Solución Error 500 Vercel

## ⚡ ACCIÓN INMEDIATA (5 minutos)

### 1️⃣ **Deploy WAHA en Railway** (GRATIS)

```bash
# Ir a: https://railway.app
# 1. Sign up with GitHub
# 2. New Project → Deploy from GitHub
# 3. Seleccionar: dashboard
# 4. Esperar deploy automático
# 5. Copiar URL pública (ej: https://waha-production.up.railway.app)
```

### 2️⃣ **Configurar Variable en Vercel**

```bash
# Ir a: https://vercel.com/dashboard
# 1. Seleccionar tu proyecto
# 2. Settings → Environment Variables
# 3. Agregar nueva variable:
#    Name: WAHA_BASE_URL
#    Value: https://waha-production.up.railway.app
# 4. Click "Save"
```

### 3️⃣ **Redeploy en Vercel**

```bash
# En Vercel Dashboard:
# 1. Deployments → último deploy
# 2. Click "..." → Redeploy
# O simplemente haz un nuevo commit:
git add .
git commit -m "fix: configurar WAHA_BASE_URL para producción"
git push
```

### 4️⃣ **Verificar**

```bash
# Esperar 1-2 minutos al deploy
# Ir a: https://dashboard-galle.vercel.app/configuracion
# Ingresar número: 3012439596
# Click: "Conectar WhatsApp"
# ✅ Debe mostrar QR sin error 500
```

---

## 📋 CAMBIOS REALIZADOS

✅ **APIs actualizadas:**
- `/api/whatsapp/session` → lee `WAHA_BASE_URL`
- `/api/whatsapp/qr` → lee `WAHA_BASE_URL`
- `/api/whatsapp/health` → lee `WAHA_BASE_URL`

✅ **Archivos creados:**
- `docker-compose.prod.yml` - Config producción
- `Dockerfile.waha` - Imagen Docker
- `railway.json` - Config Railway
- `nginx-waha-ssl.conf` - Config Nginx SSL
- `.env.production.example` - Variables ejemplo
- `GUIA_DESPLIEGUE_WAHA.md` - Guía completa
- `scripts/test-waha.sh` - Script verificación (Linux/Mac)
- `scripts/test-waha.bat` - Script verificación (Windows)

✅ **Documentación:**
- `✅_SOLUCION_ERROR_500_VERCEL.md` - Solución completa

---

## 🎯 ¿POR QUÉ FALLABA?

**Antes:**
```
Vercel → llama a → http://localhost:3000 ❌
(No existe en servidores de Vercel)
```

**Ahora:**
```
Vercel → llama a → https://waha-production.up.railway.app ✅
(WAHA público accesible desde internet)
```

---

## 💡 ALTERNATIVAS

Si no quieres usar Railway:

### **Render.com** (también gratis)
```
1. Crear cuenta en render.com
2. New → Web Service → Docker
3. Image: devlikeapro/waha:latest
4. Deploy
5. Copiar URL
6. Configurar en Vercel
```

### **VPS propio** (para producción seria)
```
Ver: GUIA_DESPLIEGUE_WAHA.md
```

---

## 🧪 VERIFICACIÓN LOCAL (opcional)

Si quieres probar en local primero:

```bash
# Terminal 1
docker-compose -f docker-compose.waha.yml up -d

# Terminal 2
pnpm dev

# Navegador
http://localhost:3001/configuracion
```

**NO necesitas** configurar variables en local.

---

## 🆘 SI ALGO FALLA

### Railway no deploy:

**Solución:** Hacer commit de archivos nuevos primero:
```bash
git add Dockerfile.waha railway.json docker-compose.prod.yml
git commit -m "feat: agregar config Railway para WAHA"
git push
```

### Vercel sigue dando error 500:

**Verificar:**
1. ✅ Variable `WAHA_BASE_URL` configurada
2. ✅ Redeploy realizado (cambios de env requieren redeploy)
3. ✅ WAHA responde: `curl https://tu-url.railway.app/health`

### Railway da error de build:

**Solución temporal:** Usar imagen pre-construida:
```json
// En railway.json cambiar:
"build": {
  "builder": "NIXPACKS"
}
```

---

## 📞 CONTACTO

Si nada funciona:
1. Compartir logs de Vercel (Runtime Logs)
2. Compartir logs de Railway (View Logs)
3. Verificar health check: `https://tu-waha.railway.app/health`

---

**Última actualización:** 2025-11-06 20:15  
**Prioridad:** 🔴 URGENTE - Fix crítico para producción

