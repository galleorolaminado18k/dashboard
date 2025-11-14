# ⚡ PASO 1 Y 2 - EJECUTAR EN VPS AHORA

## 📋 PASO 1: Copiar Credenciales

Ejecuta esto en el VPS:

```bash
cat /opt/baileys/.env
```

Deberías ver algo como:

```env
WAHA_API_KEY=c951554f59644aa3a1b3af3ad1c0a37c
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=aa926c4bf0d44bdab34eccb17524760c
WHATSAPP_SWAGGER_USERNAME=admin
WHATSAPP_SWAGGER_PASSWORD=aa926c4bf0d44bdab34eccb17524760c
```

**¡COPIAR ESTAS 3 LÍNEAS!**

---

## ⚙️ PASO 2: Agregar a Vercel

### 2.1 Ve a Vercel Environment Variables

https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables

### 2.2 Agrega estas 4 variables:

| Name | Value |
|------|-------|
| `WAHA_BASE_URL` | `https://wpp.galle18k.com` |
| `WAHA_API_KEY` | (copiar de .env) |
| `WAHA_DASHBOARD_USERNAME` | `admin` |
| `WAHA_DASHBOARD_PASSWORD` | (copiar de .env) |

### 2.3 Redeploy

Click en **"Redeploy"** en Vercel

---

## ✅ Checklist

- [ ] Ejecutar `cat /opt/baileys/.env` en VPS
- [ ] Copiar `WAHA_API_KEY`
- [ ] Copiar `WAHA_DASHBOARD_PASSWORD`
- [ ] Agregar `WAHA_BASE_URL` en Vercel
- [ ] Agregar `WAHA_API_KEY` en Vercel
- [ ] Agregar `WAHA_DASHBOARD_USERNAME` en Vercel
- [ ] Agregar `WAHA_DASHBOARD_PASSWORD` en Vercel
- [ ] Redeploy en Vercel

---

## 🔍 Verificación Rápida (Opcional)

Mientras Vercel hace redeploy, prueba desde el VPS:

```bash
# Cargar credenciales
cd /opt/baileys
export $(grep -v '^#' .env | xargs)

# Test 1: Health (sin auth) - debe responder 200
curl -i https://wpp.galle18k.com/health

# Test 2: Version (con auth) - debe responder 200
curl -i -H "X-Api-Key: $WAHA_API_KEY" https://wpp.galle18k.com/api/server/version

# Test 3: Start session (con auth) - debe responder 200/201/409
curl -i -X POST -H "X-Api-Key: $WAHA_API_KEY" https://wpp.galle18k.com/api/sessions/default/start

# Test 4: Get QR (con auth) - debe responder con qrcode
curl -s -H "X-Api-Key: $WAHA_API_KEY" https://wpp.galle18k.com/api/default/auth/qr | head -20
```

---

## 🚀 Siguiente Paso

Una vez completado esto, el código ya está listo en el dashboard (Paso 3, 4 y 5 ya los estoy implementando).

