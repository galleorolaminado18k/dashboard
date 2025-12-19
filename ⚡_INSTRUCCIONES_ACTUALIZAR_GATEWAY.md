# ⚡ ACTUALIZAR GATEWAY CON WEBHOOK - URGENTE

**Problema**: El gateway Baileys NO está enviando webhooks al dashboard

**Solución**: Actualizar `index.js` en el VPS para que envíe mensajes al webhook

---

## 🚀 OPCIÓN 1: Script Automático (Windows)

**Ejecuta**:
```bash
ACTUALIZAR_GATEWAY_WEBHOOK.bat
```

---

## 🔧 OPCIÓN 2: Manual (SSH)

### PASO 1: Conectar al VPS

```bash
ssh root@31.220.58.83
```

### PASO 2: Editar el archivo index.js

```bash
cd /root/whatsapp-gateway
nano index.js
```

### PASO 3: Buscar la línea 24 (o cerca de ella)

Busca esto:
```javascript
// Flujo mínimo requerido
const welcomeFlow = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx) => {
        console.log(`📩 Mensaje de ${ctx.from}: ${ctx.body}`)
    })
```

### PASO 4: Reemplazar por esto:

```javascript
// URL del webhook para enviar mensajes al dashboard
const WEBHOOK_URL = process.env.WEBHOOK_URL || "https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app/api/whatsapp/webhook"

// Función para enviar mensajes al webhook
async function sendToWebhook(messageData) {
    try {
        console.log(`📤 Enviando al webhook:`, WEBHOOK_URL)
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(messageData)
        })
        const result = await response.json()
        console.log(`✅ Webhook respondió:`, result)
    } catch (error) {
        console.error(`❌ Error enviando al webhook:`, error.message)
    }
}

// Flujo mínimo requerido - AHORA CON WEBHOOK
const welcomeFlow = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic }) => {
        console.log(`📩 Mensaje de ${ctx.from}: ${ctx.body}`)

        // Enviar al webhook del dashboard
        await sendToWebhook({
            event: "message",
            session: "default",
            payload: {
                message: {
                    from: ctx.from,
                    body: ctx.body,
                    pushName: ctx.pushName || ctx.name || "Usuario",
                    type: "text",
                    timestamp: Date.now(),
                    fromMe: false
                }
            }
        })
    })
```

### PASO 5: Guardar y salir

- Presiona `Ctrl + O` (guardar)
- Presiona `Enter` (confirmar)
- Presiona `Ctrl + X` (salir)

### PASO 6: Reiniciar el gateway

```bash
pm2 restart whatsapp-gateway
```

**O si no está corriendo**:
```bash
pm2 start index.js --name whatsapp-gateway
```

### PASO 7: Ver logs en tiempo real

```bash
pm2 logs whatsapp-gateway --lines 50
```

---

## 🧪 VERIFICAR QUE FUNCIONA

### 1. Enviar mensaje de prueba

Desde tu teléfono, envía un mensaje al número WhatsApp conectado:
```
Hola, prueba webhook 2025-12-17
```

### 2. Ver logs del gateway (VPS)

Debes ver algo como:
```
📩 Mensaje de 573001234567@s.whatsapp.net: Hola, prueba webhook 2025-12-17
📤 Enviando al webhook: https://...
✅ Webhook respondió: { ok: true }
```

### 3. Ver logs en Vercel

Ve a: https://vercel.com → Logs → Buscar `/api/whatsapp/webhook`

Debes ver:
```
📩 Webhook recibido: { event: 'message', session: 'default' }
💬 Mensaje entrante para CRM:
  from: 573001234567 (normalizado)
  original: 573001234567@s.whatsapp.net
📋 Conversación CRM: { id: ..., phone: 573001234567 }
✅ Mensaje guardado en CRM
```

### 4. Verificar en Supabase

```sql
SELECT phone, client_name, last_message, created_at
FROM crm_conversations
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado**: Nueva conversación con número válido `573XXXXXXXXX`

---

## ❓ SOLUCIÓN DE PROBLEMAS

### Problema: "fetch is not defined"

**Solución**: Agregar import de node-fetch:

```bash
cd /root/whatsapp-gateway
npm install node-fetch
```

Luego agregar al inicio de `index.js`:
```javascript
import fetch from "node-fetch"
```

### Problema: "pm2: command not found"

**Solución**: Instalar PM2:
```bash
npm install -g pm2
```

### Problema: El webhook no responde

**Solución**: Verificar que Vercel esté desplegado:
```bash
curl https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app/api/whatsapp/webhook
```

Debe responder:
```json
{
  "status": "ok",
  "message": "WhatsApp Webhook activo",
  "timestamp": "2025-12-17T..."
}
```

---

## 🎯 RESULTADO ESPERADO

Después de actualizar el gateway:

✅ Mensajes recibidos en WhatsApp se envían automáticamente al webhook
✅ Webhook procesa y guarda en `crm_conversations` con número válido
✅ Aparecen en el CRM del dashboard en tiempo real
✅ Puedes responder desde el CRM y el mensaje se envía correctamente

---

**Desarrollado por**: Claude Code Assistant
**Fecha**: 2025-12-17
