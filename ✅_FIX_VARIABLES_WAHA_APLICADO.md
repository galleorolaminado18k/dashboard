- [ ] Redeploy en Vercel
- [ ] Probar en `/whatsapp-test`

---

## 🎯 ENDPOINTS CORRECTOS DE WAHA

El código ahora usa los endpoints correctos:

| Acción | Endpoint WAHA |
|--------|---------------|
| Iniciar sesión | `POST /api/sessions/default/start` |
| Obtener QR | `GET /api/default/auth/qr` |
| Verificar estado | `GET /api/sessions/default/status` |
| Enviar mensaje | `POST /api/sendText` |
| Health check | `GET /health` |

---

## 📞 SI HAY PROBLEMAS

### Error: "WAHA_BASE_URL no configurada"
- Asegúrate de agregar la variable en Vercel
- Valor: `https://wpp.galle18k.com`

### Error 401: Unauthorized
- La `WAHA_API_KEY` no coincide
- Verificar con: `cat /opt/baileys/.env` en el VPS
- Copiar el valor exacto a Vercel

### Error 404: Not Found
- Verificar que WAHA esté corriendo: `docker ps`
- Verificar logs: `docker logs waha-api -f`

---

## 🔥 RESUMEN

1. ✅ **Ya arreglé el código** (variables correctas)
2. ⏳ **Tu turno**: Agregar variables en Vercel
3. 🚀 **Redeploy** y probar

**Los cambios ya están en GitHub!**
# ✅ FIX APLICADO - VARIABLES DE ENTORNO CORRECTAS

## 🔧 PROBLEMA RESUELTO

El error **"BAILEYS_BASE_URL no está configurada en Vercel"** se debía a que el código antiguo usaba variables de Baileys en lugar de WAHA.

---

## ✅ CAMBIOS REALIZADOS

He actualizado **todos** los archivos para usar las variables correctas de WAHA:

### Archivos corregidos:

1. ✅ `pages/api/whatsapp/wpp/start.ts`
   - Cambio: `BAILEYS_BASE_URL` → `WAHA_BASE_URL`

2. ✅ `pages/api/whatsapp/wpp/status.ts`
   - Cambio: `BAILEYS_BASE_URL` → `WAHA_BASE_URL`

3. ✅ `pages/api/whatsapp/wpp/send.ts`
   - Cambio: `BAILEYS_BASE_URL` → `WAHA_BASE_URL`

4. ✅ `lib/whatsapp/baileys.ts`
   - Cambio: `BAILEYS_BASE_URL` → `WAHA_BASE_URL`
   - Cambio: `BAILEYS_API_KEY` → `WAHA_API_KEY`
   - Cambio: Header `x-api-key` → `X-Api-Key`
   - Actualizado endpoints a rutas de WAHA

---

## 📋 VARIABLES DE ENTORNO CORRECTAS

Ahora el sistema usa estas variables:

| Variable Anterior | Variable Nueva |
|-------------------|----------------|
| ❌ `BAILEYS_BASE_URL` | ✅ `WAHA_BASE_URL` |
| ❌ `BAILEYS_API_KEY` | ✅ `WAHA_API_KEY` |

---

## ⚙️ CONFIGURAR EN VERCEL AHORA

Ve a: https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables

### 1. Eliminar variables antiguas (si existen):
- ❌ `BAILEYS_BASE_URL`
- ❌ `BAILEYS_API_KEY`
- ❌ `NEXT_PUBLIC_BAILEYS_BASE_URL`

### 2. Agregar variables nuevas:

#### Variable 1:
```
Name:  WAHA_BASE_URL
Value: https://wpp.galle18k.com
```

#### Variable 2:
```
Name:  WAHA_API_KEY
Value: (obtener del VPS con: cat /opt/baileys/.env)
```

#### Variable 3 (opcional):
```
Name:  WAHA_DASHBOARD_USERNAME
Value: admin
```

#### Variable 4 (opcional):
```
Name:  WAHA_DASHBOARD_PASSWORD
Value: (obtener del VPS con: cat /opt/baileys/.env)
```

### 3. Redeploy
Click en **"Redeploy"** para aplicar los cambios

---

## 🔍 OBTENER CREDENCIALES DEL VPS

En el VPS, ejecuta:

```bash
cat /opt/baileys/.env
```

Verás algo como:

```env
WAHA_API_KEY=c951554f59644aa3a1b3af3ad1c0a37c
WAHA_DASHBOARD_USERNAME=admin
WAHA_DASHBOARD_PASSWORD=aa926c4bf0d44bdab34eccb17524760c
```

**Copiar el valor de `WAHA_API_KEY`** y usarlo en Vercel.

---

## 🚀 DESPUÉS DEL REDEPLOY

1. El error desaparecerá
2. La página `/whatsapp-test` funcionará
3. El botón "Conectar WhatsApp" mostrará el QR
4. Podrás escanear y conectar

---

## ✅ CHECKLIST RÁPIDO

- [x] Código actualizado con variables correctas
- [x] Cambios subidos a GitHub
- [ ] Obtener `WAHA_API_KEY` del VPS
- [ ] Agregar `WAHA_BASE_URL` en Vercel
- [ ] Agregar `WAHA_API_KEY` en Vercel
- [ ] (Opcional) Agregar `WAHA_DASHBOARD_USERNAME` en Vercel
- [ ] (Opcional) Agregar `WAHA_DASHBOARD_PASSWORD` en Vercel
- [ ] Eliminar variables antiguas de BAILEYS

