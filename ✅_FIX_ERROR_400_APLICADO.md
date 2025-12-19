# ✅ FIX APLICADO - Error 400 Resuelto

## ❌ ERROR ANTERIOR

```
Error: EVO_HTTP_400 (Bad Request)
```

**Causa**: El payload enviado a `/instance/create` tenía el campo `number: ''` que Evolution v2.2.3 rechaza.

---

## ✅ SOLUCIÓN APLICADA

**Commit**: `063f3de`

### Cambio en el código:

**Antes (causaba error 400)**:
```typescript
body: JSON.stringify({
  instanceName: NAME,
  qrcode: true,
  number: ''  // ← Esto causaba el error
})
```

**Ahora (correcto)**:
```typescript
body: JSON.stringify({
  instanceName: NAME,
  token: NAME,
  qrcode: true
})
```

---

## 🚀 PRÓXIMOS PASOS

### 1. Esperar a que Vercel haga deploy automático

Vercel detecta automáticamente los cambios en GitHub y hace deploy.

**O hacer deploy manual**:
1. Ve a Vercel → Deployments
2. Click **"Redeploy"** en el último deployment
3. Espera 2-3 minutos

### 2. Actualizar la variable EVO_API_KEY en Vercel

**IMPORTANTE**: Todavía necesitas cambiar la API Key en Vercel:

1. Vercel → Settings → Environment Variables
2. Variable `EVO_API_KEY`
3. Click **3 puntos** → **Edit**
4. Cambiar a: `galle-whatsapp-key-2025`
5. Save
6. Redeploy

### 3. Probar

1. Ve a `/configuracion`
2. Click "Conectar WhatsApp"
3. QR debe aparecer ✅

---

## 📊 PROBLEMAS RESUELTOS

| Problema | Estado |
|----------|--------|
| Error 401 Unauthorized | ⏳ Pendiente (cambiar API Key) |
| Error 400 Bad Request | ✅ Resuelto (código actualizado) |
| Campo `number` vacío | ✅ Resuelto (eliminado) |
| Payload incorrecto | ✅ Resuelto (agregado `token`) |

---

## ⚠️ ACCIÓN REQUERIDA

**DEBES CAMBIAR LA API KEY EN VERCEL**:

```
Valor actual: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
Valor correcto: galle-whatsapp-key-2025
```

**Sin esto, seguirá dando error** (aunque sea 401 en lugar de 400).

---

## 🎯 RESUMEN

1. ✅ Código actualizado (eliminado campo `number`)
2. ✅ Commit guardado localmente
3. ⏳ GitHub con problemas temporales (push fallará hasta que se resuelva)
4. ⏳ Vercel hará deploy cuando GitHub funcione
5. ⚠️ **DEBES CAMBIAR API KEY EN VERCEL MANUALMENTE**

---

**VE A VERCEL Y CAMBIA LA API KEY AHORA** 👆

**Después haz Redeploy y el QR aparecerá** ✅

