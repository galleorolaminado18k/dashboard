# 🚀 VPS GRATUITO PERMANENTE - Railway.app

## ✅ SOLUCIÓN DEFINITIVA (SIN TÚNELES TEMPORALES)

**Problema:** Cloudflare Tunnel requiere PC encendida.  
**Solución:** Railway.app - VPS gratuito permanente con HTTPS automático.

---

## 🎯 PASO 1: Preparar Archivos (YA LISTO)

Los siguientes archivos ya están en el repo:

✅ `Dockerfile.waha` - Imagen Docker para Railway  
✅ `railway.json` - Configuración Railway  
✅ `docker-compose.prod.yml` - Para VPS manual

---

## 🚀 PASO 2: Deploy en Railway.app (5 MINUTOS)

### **2.1 Crear Cuenta**
```
1. Ir a: https://railway.app
2. Sign up with GitHub
3. Autorizar acceso al repo
```

### **2.2 Crear Nuevo Proyecto**
```
1. Dashboard → New Project
2. Deploy from GitHub repo
3. Seleccionar: galleorolaminado18k/dashboard
4. Railway detecta automáticamente Dockerfile.waha
```

### **2.3 Configurar Variables de Entorno**
```
En Railway Dashboard:

Variables → Add Variable:

WAHA_HTTP_API_HOST = 0.0.0.0
WAHA_MULTI_DEVICE = true
WAHA_LOG_LEVEL = info
PORT = 3000
```

### **2.4 Generar Dominio Público**
```
1. Settings → Networking
2. Generate Domain
3. Copiar URL (ej: waha-production.up.railway.app)
```

### **2.5 Esperar Deploy**
```
Deployments → View Logs
Esperar: "Server started on port 3000"
(tarda 2-3 minutos)
```

---

## 🧪 PASO 3: Verificar WAHA en Railway

```bash
# Test 1: Health Check
curl https://waha-production.up.railway.app/health
# ✅ Debe: {"status": "ok"}

# Test 2: Session State
curl https://waha-production.up.railway.app/api/session/default/state
# ✅ Debe: {"state": "STOPPED"} o similar

# Test 3: Start Session
curl -X POST https://waha-production.up.railway.app/api/session/default/start
# ✅ Debe: {"state": "STARTING"}
```

---

## 🔧 PASO 4: Configurar en Vercel

```
1. Ir a: https://vercel.com/dashboard
2. Seleccionar: dashboard-galle
3. Settings → Environment Variables
4. Add New:

   Name:  WAHA_BASE_URL
   Value: https://waha-production.up.railway.app
   
   ☑ Production
   ☑ Preview
   ☑ Development

5. Save
6. Redeploy automático
```

---

## ✅ PASO 5: Verificar Todo Funciona

### **Test 1: API de Vercel**
```bash
curl https://dashboard-galle.vercel.app/api/whatsapp/health
# ✅ Debe: {"ok": true, "waha": "healthy"}
```

### **Test 2: UI**
```
1. https://dashboard-galle.vercel.app/configuracion
2. Ingresar: +57 3012439596
3. Click: "Conectar WhatsApp"
4. ✅ Ver QR sin error
5. Escanear con WhatsApp Business
6. ✅ Conexión exitosa
```

---

## 💰 COSTO Y LÍMITES

### **Railway.app Plan Gratuito:**
- ✅ $5 USD crédito mensual
- ✅ 500 horas ejecución/mes
- ✅ 1GB RAM
- ✅ 1GB storage
- ✅ HTTPS automático
- ✅ Dominio público gratis

### **Consumo estimado WAHA:**
```
WAHA corriendo 24/7:
- RAM: ~200-300 MB ✅
- CPU: Bajo (solo al enviar mensajes)
- Horas: 730/mes (500 gratis + $0.01/hora extra)
- Costo: ~$2.30/mes (230 horas extras × $0.01)
```

**Alternativa:** Apagar WAHA cuando no se use:
```bash
# Pausar servicio (ahorra crédito)
Railway Dashboard → Settings → Sleep Service

# Despertar cuando necesites
Settings → Wake Service
```

---

## 🔄 ALTERNATIVAS GRATUITAS 100%

### **Opción A: Render.com**
```
Plan gratuito:
- ✅ 750 horas/mes
- ✅ HTTPS automático
- ⚠️ Duerme después de 15 min inactividad
- ⚠️ Tarda 30s en despertar

Setup:
1. https://render.com → Sign up
2. New → Web Service → Docker
3. Image: devlikeapro/waha:latest
4. Environment: WAHA_HTTP_API_HOST=0.0.0.0
5. Deploy
```

### **Opción B: Fly.io**
```
Plan gratuito:
- ✅ 3GB RAM total
- ✅ 160GB tráfico/mes
- ✅ HTTPS automático
- ✅ No duerme

Setup:
1. https://fly.io → Sign up
2. fly launch (desde carpeta del proyecto)
3. Deploy automático
```

### **Opción C: Oracle Cloud (Siempre Gratis)**
```
Plan gratuito PERMANENTE:
- ✅ 2 VM AMD (1GB RAM c/u)
- ✅ 4 ARM Ampere (24GB RAM total)
- ✅ 200GB storage
- ✅ Sin límite de tiempo
- ⚠️ Requiere tarjeta (no cobra)

Setup:
1. https://cloud.oracle.com
2. Crear VM Ubuntu
3. Instalar Docker
4. docker run devlikeapro/waha:latest
5. Configurar firewall puerto 3000
```

---

## 🎯 RECOMENDACIÓN

### **Para este proyecto:**

**Railway.app** (MEJOR OPCIÓN)
- ✅ Setup más fácil (5 min)
- ✅ HTTPS automático
- ✅ Deploy desde GitHub
- ✅ $2-3/mes (muy barato)
- ✅ Siempre activo

### **Si quieres 100% gratis:**

**Oracle Cloud** (MEJOR GRATIS)
- ✅ Realmente gratis para siempre
- ✅ Más potente (24GB RAM ARM)
- ⚠️ Setup más complejo (30 min)

---

## 📊 COMPARACIÓN

| Servicio | Costo | Setup | Uptime | HTTPS | Mejor para |
|----------|-------|-------|--------|-------|------------|
| **Railway** | $2-3/mes | 5 min | 100% | Auto | ⭐ Producción fácil |
| **Render** | $0 | 5 min | ~95% | Auto | Testing |
| **Fly.io** | $0 | 10 min | 100% | Auto | Producción gratis |
| **Oracle** | $0 | 30 min | 100% | Manual | Producción avanzada |
| **Tunnel** | $0 | 2 min | Requiere PC | Auto | Solo desarrollo |

---

## 🚀 EJECUTAR AHORA

### **Opción 1: Railway (RECOMENDADO)**
```
1. https://railway.app → Sign up
2. New Project → Deploy from GitHub
3. Seleccionar repo: dashboard
4. Esperar deploy (3 min)
5. Generate Domain
6. Copiar URL
7. Configurar en Vercel: WAHA_BASE_URL
```

### **Opción 2: Oracle Cloud (GRATIS 100%)**
```
Ver guía detallada:
GUIA_ORACLE_CLOUD_GRATIS.md (crear a continuación)
```

---

## 🆘 TROUBLESHOOTING

### **Railway: Build falla**
```
Ver: Deployments → View Logs
Buscar: "Error" o "Failed"

Fix común:
1. Verificar Dockerfile.waha existe
2. Verificar railway.json existe
3. Redeploy manual
```

### **Railway: WAHA no responde**
```
1. Deployments → Ver que esté "Active"
2. View Logs → Buscar "Server started"
3. Variables configuradas correctamente
4. Generar nuevo dominio si es necesario
```

### **Vercel: Sigue 502**
```
1. Variable WAHA_BASE_URL configurada
2. URL correcta (https://)
3. Redeploy realizado
4. Test: curl https://tu-waha.railway.app/health
```

---

## 📞 SOPORTE

**Railway Docs:** https://docs.railway.app/  
**WAHA Docs:** https://waha.devlike.pro/docs/  
**Community:** Railway Discord

---

**Tiempo total:** 5-10 minutos  
**Costo:** $2-3/mes (o $0 con Oracle)  
**Resultado:** ✅ WAHA siempre activo, sin depender de tu PC

---

**Última actualización:** 2025-11-06  
**Prioridad:** 🔴 EJECUTAR AHORA para solución permanente

