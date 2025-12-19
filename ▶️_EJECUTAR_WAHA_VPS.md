# ▶️ COMANDO ÚNICO - COPIAR Y PEGAR EN VPS

## 🎯 WAHA ESTÁ FUNCIONANDO

Según los logs, **WAHA está corriendo correctamente**. El script solo estaba probando el endpoint equivocado (`/api/health` en lugar de `/health`).

---

## ✅ VERIFICAR AHORA

### Opción 1: Script de Verificación Automática

```bash
curl -o verificar.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/verificar-waha.sh && chmod +x verificar.sh && ./verificar.sh
```

### Opción 2: Verificación Manual

```bash
# Cargar credenciales
cd /opt/baileys
export $(grep -v '^#' .env | xargs)

# Probar endpoint de salud (sin auth)
curl http://127.0.0.1:3001/health

# Probar endpoint con autenticación
curl -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3001/api/server/version

# Listar sesiones
curl -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3001/api/sessions
```

---

## 📋 VER CREDENCIALES GENERADAS

```bash
cat /opt/baileys/.env
```

Deberías ver algo como:

```env
WAHA_API_KEY=abc123def456...
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=xyz789...
WHATSAPP_SWAGGER_USERNAME=admin
WHATSAPP_SWAGGER_PASSWORD=xyz789...
```

---

## 📝 AGREGAR A VERCEL

1. Ve a: https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables

2. Agrega estas 3 variables:
   - `WAHA_API_KEY` = (copiar de .env)
   - `WAHA_DASHBOARD_USERNAME` = admin
   - `WAHA_DASHBOARD_PASSWORD` = (copiar de .env)

3. Redeploy

---

## 🌐 ACCESO

### API Local:
```bash
curl http://127.0.0.1:3001/health
```

### API Pública (HTTPS):
```bash
curl https://wpp.galle18k.com/health
```

### Dashboard WAHA:
- **URL**: https://wpp.galle18k.com/dashboard
- **Usuario**: admin
- **Password**: (el del archivo .env)

---

## 📊 ENDPOINTS PRINCIPALES

Según los logs de WAHA, estos son los endpoints disponibles:

### Sin autenticación:
- `GET /health` - Estado del servidor
- `GET /ping` - Ping básico

### Con autenticación (Header: `X-Api-Key`):
- `GET /api/server/version` - Versión de WAHA
- `GET /api/sessions` - Listar sesiones
- `POST /api/sessions/default/start` - Iniciar sesión de WhatsApp
- `GET /api/sessions/default/status` - Estado de la sesión
- `POST /api/sendText` - Enviar mensaje de texto
- `POST /api/sendImage` - Enviar imagen
- Y muchos más...

---

## 🔧 COMANDOS ÚTILES

### Ver logs en tiempo real:
```bash
docker logs waha-api -f
```

### Ver estado de contenedores:
```bash
docker ps
```

### Reiniciar WAHA:
```bash
cd /opt/baileys
docker-compose restart waha
```

### Detener todo:
```bash
cd /opt/baileys
docker-compose down
```

### Iniciar de nuevo:
```bash
cd /opt/baileys
docker-compose up -d
```

---

## 🚀 REINSTALAR CON SCRIPT ACTUALIZADO (Opcional)

Si quieres ejecutar el script actualizado que prueba los endpoints correctos:

```bash
curl -o waha.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/instalar-waha.sh && chmod +x waha.sh && ./waha.sh
```

---

## ✅ PRÓXIMOS PASOS

1. ✅ WAHA ya está funcionando
2. 📋 Ejecutar script de verificación o ver credenciales con `cat /opt/baileys/.env`
3. ⚙️ Agregar credenciales a Vercel
4. 🔄 Redeploy del dashboard
5. 🔗 Actualizar código para usar https://wpp.galle18k.com como base URL


