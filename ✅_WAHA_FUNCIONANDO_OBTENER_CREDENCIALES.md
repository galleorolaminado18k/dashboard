# ✅ WAHA ESTÁ FUNCIONANDO - VERIFICAR Y OBTENER CREDENCIALES

## 🎯 SITUACIÓN ACTUAL

Según los logs que compartiste, **WAHA está corriendo perfectamente**. Solo necesitas:

1. Obtener las credenciales del archivo `.env`
2. Verificar que funciona correctamente
3. Agregar las credenciales a Vercel

---

## 📋 PASO 1: VER CREDENCIALES

Ejecuta esto en el VPS:

```bash
cat /opt/baileys/.env
```

Deberías ver algo como:

```
WAHA_API_KEY=c951554f59644aa3a1b3af3ad1c0a37c
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=aa926c4bf0d44bdab34eccb17524760c
WHATSAPP_SWAGGER_USERNAME=admin
WHATSAPP_SWAGGER_PASSWORD=aa926c4bf0d44bdab34eccb17524760c
```

**¡COPIAR ESTAS CREDENCIALES!**

---

## ✅ PASO 2: VERIFICAR QUE FUNCIONA

### Opción A: Script automático (RECOMENDADO)

```bash
curl -o verificar.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/verificar-waha.sh && chmod +x verificar.sh && ./verificar.sh
```

Este script te mostrará:
- ✅ Si WAHA responde correctamente
- 📋 Las credenciales formateadas para copiar
- 🔗 Las URLs disponibles

### Opción B: Verificación manual rápida

```bash
# Test endpoint sin autenticación
curl http://127.0.0.1:3001/health

# Debería responder algo como:
# {"status":"ok"}
```

---

## 📝 PASO 3: AGREGAR A VERCEL

1. Ve a: https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables

2. Agrega estas **3 variables de entorno**:

   ```
   WAHA_API_KEY = c951554f59644aa3a1b3af3ad1c0a37c
   WAHA_DASHBOARD_USERNAME = admin
   WAHA_DASHBOARD_PASSWORD = aa926c4bf0d44bdab34eccb17524760c
   ```

   *(Usa los valores de tu archivo `.env`)*

3. Click en **Save**

4. Haz **Redeploy** del dashboard en Vercel

---

## 🌐 PASO 4: PROBAR DESDE INTERNET

Una vez que tengas las credenciales en Vercel, prueba desde cualquier lugar:

```bash
# Reemplaza YOUR_API_KEY con tu WAHA_API_KEY
curl https://wpp.galle18k.com/health

# Debería responder: {"status":"ok"}
```

---

## 📊 INFORMACIÓN ÚTIL

### URLs disponibles:

- **API Base**: https://wpp.galle18k.com
- **Dashboard WAHA**: https://wpp.galle18k.com/dashboard
- **Swagger Docs**: https://wpp.galle18k.com/swagger

### Endpoints principales:

```
POST /api/sessions/default/start    → Iniciar sesión WhatsApp
GET  /api/sessions/default/status   → Ver estado de sesión
POST /api/sendText                  → Enviar mensaje texto
POST /api/sendImage                 → Enviar imagen
GET  /api/sessions                  → Listar todas las sesiones
```

### Header requerido:

Todas las peticiones a `/api/*` requieren:

```
X-Api-Key: <tu-waha-api-key>
```

---

## 🔧 COMANDOS ÚTILES

### Ver logs de WAHA:
```bash
docker logs waha-api -f
```

### Ver contenedores corriendo:
```bash
docker ps
```

### Reiniciar WAHA:
```bash
cd /opt/baileys && docker-compose restart waha
```

### Ver todo el archivo .env:
```bash
cat /opt/baileys/.env
```

---

## 🚀 RESUMEN - CHECKLIST

- [ ] Ver credenciales: `cat /opt/baileys/.env`
- [ ] Ejecutar script de verificación
- [ ] Copiar WAHA_API_KEY
- [ ] Copiar WAHA_DASHBOARD_PASSWORD
- [ ] Agregar las 3 variables a Vercel
- [ ] Redeploy del dashboard
- [ ] Probar desde internet: `curl https://wpp.galle18k.com/health`

---

## ❓ SI NECESITAS REINSTALAR

Si por alguna razón quieres reinstalar con el script actualizado:

```bash
curl -o waha.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/instalar-waha.sh && chmod +x waha.sh && ./waha.sh
```

Pero **NO es necesario** - WAHA ya está funcionando! ✅

