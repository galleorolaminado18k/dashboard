# 📱 Baileys WhatsApp API - Integración Dashboard Galle

Implementación de WhatsApp Business con Baileys (whiskeysockets) para el dashboard de ventas.

## 🎯 ¿Qué es esto?

Servidor API de WhatsApp usando **Baileys** corriendo en Docker con:
- ✅ **Node.js 20** Alpine (ligero)
- ✅ **Caddy** como reverse proxy con SSL automático
- ✅ **Persistencia** de sesión (no se pierde el login)
- ✅ **API REST** completa
- ✅ **QR Code** para conexión
- ✅ **Webhooks** (opcional)

## 🚀 Instalación en VPS

### Paso 1: Ejecutar script de instalación

En tu VPS (31.220.58.83):

```bash
curl -o baileys.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/instalar-baileys.sh
chmod +x baileys.sh
./baileys.sh
```

**Tiempo:** 3-4 minutos

### Paso 2: Configurar DNS

En Hostinger DNS Manager:

```
Tipo: A
Nombre: wpp
Valor: 31.220.58.83
TTL: 3600
```

### Paso 3: Esperar SSL

Caddy generará automáticamente el certificado SSL para `wpp.galle18k.com` en 1-2 minutos.

Verificar:

```bash
curl https://wpp.galle18k.com/health
```

Debe responder: `{"ok":true,"ready":false}`

## 📋 API Endpoints

### Health Check

```bash
GET /health
```

Respuesta:

```json
{
  "ok": true,
  "ready": false
}
```

### Iniciar Sesión (Generar QR)

```bash
POST /start
Headers:
  x-api-key: galle-baileys-secret-key-2025
```

Respuesta:

```json
{
  "ok": true
}
```

### Obtener QR Code

```bash
GET /qr
```

Respuestas:

```json
// QR disponible
{
  "ok": true,
  "qr": "data:image/png;base64,iVBORw0KG..."
}

// Ya está logueado
{
  "ok": false,
  "message": "LOGGED_IN"
}

// QR aún no generado
{
  "ok": false,
  "message": "QR_NOT_READY"
}
```

### Enviar Mensaje

```bash
POST /sendText
Headers:
  x-api-key: galle-baileys-secret-key-2025
  Content-Type: application/json
Body:
{
  "to": "3012439596",
  "text": "Hola desde Baileys!"
}
```

Respuesta:

```json
{
  "ok": true
}
```

## 🔧 Configuración Vercel

En Vercel → Settings → Environment Variables:

```
BAILEYS_BASE_URL=https://wpp.galle18k.com
BAILEYS_API_KEY=galle-baileys-secret-key-2025
```

Luego: **Redeploy**

## 💻 Cliente Next.js

Ya está implementado en `lib/whatsapp/baileys.ts`:

```typescript
import { startSession, getQR, sendText, health } from '@/lib/whatsapp/baileys';

// Iniciar sesión
await startSession();

// Obtener QR (polling cada 2s)
const { qr } = await getQR();

// Verificar estado
const { ready } = await health();

// Enviar mensaje
await sendText('3012439596', 'Hola!');
```

## 📂 Estructura de Archivos

```
/opt/baileys/
├── docker-compose.yml    # Servicios Docker
├── .env                  # Variables (API_KEY)
├── Caddyfile            # Config SSL/Proxy
├── app/
│   ├── package.json     # Dependencias
│   ├── index.js         # API Server
│   └── .gitignore
└── data/                # Sesión persistente
    └── default/         # Auth tokens
```

## 🔍 Comandos Útiles

### Ver logs

```bash
cd /opt/baileys
docker logs baileys-api -f
docker logs caddy -f
```

### Reiniciar

```bash
cd /opt/baileys
docker-compose restart
```

### Estado

```bash
docker ps
```

### Limpiar sesión (forzar nuevo QR)

```bash
cd /opt/baileys
rm -rf data/default/*
docker-compose restart baileys-api
```

### Test local

```bash
# Health
curl http://127.0.0.1:3001/health

# Iniciar (con API key)
curl -X POST \
  -H "x-api-key: galle-baileys-secret-key-2025" \
  http://127.0.0.1:3001/start

# QR
curl http://127.0.0.1:3001/qr

# Enviar mensaje
curl -X POST \
  -H "x-api-key: galle-baileys-secret-key-2025" \
  -H "Content-Type: application/json" \
  -d '{"to":"3012439596","text":"Test"}' \
  http://127.0.0.1:3001/sendText
```

## 🐛 Troubleshooting

### No se genera el QR

```bash
# Ver logs
docker logs baileys-api -f

# Reiniciar
docker-compose restart baileys-api
```

### SSL no funciona

```bash
# Ver logs de Caddy
docker logs caddy -f

# Debe aparecer:
# "Successfully obtained certificate for wpp.galle18k.com"
```

### Cloudflare bloquea

Si usas Cloudflare:
1. SSL/TLS → **Full** (no Flexible)
2. Temporalmente: nube **GRIS** (DNS only)
3. Espera certificado SSL
4. Vuelve a nube **NARANJA** (Proxied)

### Sesión se pierde

Verifica que el volumen `data` esté montado:

```bash
docker-compose down
docker-compose up -d
```

## 📊 Diferencias con WPPConnect/WAHA

| Característica | Baileys | WPPConnect/WAHA |
|---|---|---|
| Imagen Docker | ✅ Existe | ❌ No existe |
| Mantenimiento | ✅ Activo | ❌ Abandonado |
| Documentación | ✅ Completa | ⚠️ Limitada |
| Instalación | ✅ Simple | ❌ Compleja |

## 🔐 Seguridad

- ✅ API Key obligatoria
- ✅ HTTPS con SSL automático
- ✅ Sesión encriptada
- ✅ Sin credenciales hardcodeadas

## 📚 Documentación Baileys

- GitHub: https://github.com/WhiskeySockets/Baileys
- Wiki: https://whiskeysockets.github.io/
- NPM: https://www.npmjs.com/package/@whiskeysockets/baileys

## ✅ Checklist

- [ ] Script instalado en VPS
- [ ] DNS configurado (wpp.galle18k.com)
- [ ] SSL funcionando (https://wpp.galle18k.com/health)
- [ ] Variables en Vercel
- [ ] Redeploy en Vercel
- [ ] QR aparece en /configuracion
- [ ] WhatsApp conectado

---

**Creado para Dashboard Galle** 🚀

