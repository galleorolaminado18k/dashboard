# 🚀 Guía de Implementación WAHA - WhatsApp Real

Esta guía te ayudará a implementar **WhatsApp Business REAL** usando WAHA en lugar del QR simple de `wa.me`.

---

## 📋 Prerequisitos

- ✅ Docker instalado
- ✅ Puerto 3000 disponible
- ✅ Node.js 20+
- ✅ Dashboard ya funcionando

---

## 🔧 Paso 1: Levantar WAHA con Docker

### Opción A: Docker Compose (Recomendado)

```bash
# En la raíz del proyecto
docker-compose -f docker-compose.waha.yml up -d
```

### Opción B: Docker Run

```bash
docker run -d \
  --name waha \
  -p 3000:3000 \
  -v $(pwd)/waha-sessions:/app/.sessions \
  -e WHATSAPP_API_KEY=tu-api-key-secreta \
  devlikeapro/waha:latest
```

### Verificar que WAHA está corriendo:

```bash
curl http://localhost:3000/health
# Respuesta esperada: {"status":"ok"}
```

---

## 🔐 Paso 2: Configurar Variables de Entorno

Agrega a tu `.env.local`:

```env
# WAHA Configuration
WAHA_URL=http://localhost:3000
WAHA_API_KEY=tu-api-key-secreta-aqui

# Public URL (para webhooks)
NEXT_PUBLIC_URL=https://tu-dashboard.vercel.app
```

---

## 🎯 Paso 3: Actualizar la Página de Configuración

Reemplaza el código actual de generación de QR:

```typescript
// ANTES (INCORRECTO):
const generateQRCode = async (phone: string) => {
  const whatsappLink = `https://wa.me/${phone}`
  const qrDataUrl = await QRCode.toDataURL(whatsappLink)
  setQrCodeImage(qrDataUrl)
}

// DESPUÉS (CORRECTO con WAHA):
const [sessionStatus, setSessionStatus] = useState<string>('STOPPED')
const [polling, setPolling] = useState(false)

// 1. Iniciar sesión de WhatsApp
const startWhatsAppSession = async () => {
  try {
    const res = await fetch('/api/whatsapp/session', {
      method: 'POST'
    })
    const data = await res.json()
    
    if (data.ok) {
      // Iniciar polling para obtener QR
      startPolling()
    }
  } catch (err) {
    console.error('Error starting session:', err)
  }
}

// 2. Obtener QR real de WAHA
const fetchQRCode = async () => {
  try {
    const res = await fetch('/api/whatsapp/qr')
    const data = await res.json()
    
    if (data.ok && data.qr) {
      setQrCodeImage(`data:image/png;base64,${data.qr}`)
      setSessionStatus('SCAN_QR_CODE')
    } else if (data.status === 'WORKING') {
      setSessionStatus('WORKING')
      stopPolling()
    }
  } catch (err) {
    console.error('Error getting QR:', err)
  }
}

// 3. Polling cada 5 segundos
const startPolling = () => {
  setPolling(true)
  const interval = setInterval(fetchQRCode, 5000)
  return () => clearInterval(interval)
}

// 4. En el botón de "Vincular WhatsApp"
<button onClick={startWhatsAppSession}>
  {sessionStatus === 'WORKING' ? '✅ Conectado' : '🔗 Vincular WhatsApp'}
</button>
```

---

## 🧪 Paso 4: Probar la Integración

### 1. Iniciar Sesión

```bash
curl -X POST http://localhost:3001/api/whatsapp/session
```

### 2. Obtener QR

```bash
curl http://localhost:3001/api/whatsapp/qr
```

### 3. Verificar Estado

```bash
curl http://localhost:3001/api/whatsapp/session
```

### 4. Enviar Mensaje de Prueba

```bash
curl -X POST http://localhost:3001/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "3001234567",
    "message": "Hola desde el dashboard!"
  }'
```

---

## 📱 Paso 5: Escanear QR

1. Abre WhatsApp Business en tu teléfono
2. Ve a: **Más opciones (⋮) > Dispositivos vinculados**
3. Selecciona: **Vincular un dispositivo**
4. Escanea el QR mostrado en el dashboard
5. Espera a que cambie a estado "WORKING"

---

## 🔄 Paso 6: Configurar Webhooks (Opcional)

Para recibir mensajes entrantes:

1. Asegúrate de que `NEXT_PUBLIC_URL` esté configurado
2. El webhook se configura automáticamente en `/api/whatsapp/webhook`
3. Verifica los logs en Docker:

```bash
docker logs -f waha
```

---

## 🎨 Paso 7: UI/UX Recomendado

### Indicadores de Estado

```typescript
const statusMessages = {
  'STOPPED': '⭕ Detenido - Click para iniciar',
  'STARTING': '🔄 Iniciando...',
  'SCAN_QR_CODE': '📱 Escanea el código QR',
  'WORKING': '✅ Conectado y funcionando',
  'FAILED': '❌ Error - Reintentar'
}

<div className="status-indicator">
  {statusMessages[sessionStatus]}
</div>
```

### Botones de Acción

```typescript
// Conectar
<button onClick={startWhatsAppSession} disabled={sessionStatus === 'WORKING'}>
  Conectar WhatsApp
</button>

// Desconectar
<button onClick={disconnectWhatsApp} disabled={sessionStatus !== 'WORKING'}>
  Desconectar
</button>

// Reiniciar
<button onClick={restartSession}>
  Reiniciar Sesión
</button>
```

---

## 🐛 Solución de Problemas

### WAHA no responde
```bash
# Verificar que está corriendo
docker ps | grep waha

# Ver logs
docker logs waha

# Reiniciar
docker restart waha
```

### QR no se genera
- Verifica que la sesión esté en estado `SCAN_QR_CODE`
- Reinicia la sesión con `DELETE /api/whatsapp/session` y luego `POST`
- Revisa los logs de WAHA

### Mensajes no se envían
- Verifica que el estado sea `WORKING`
- Confirma que el número esté en formato correcto
- Revisa que el chatId tenga el formato `573001234567@c.us`

### Webhook no llega
- Verifica que `NEXT_PUBLIC_URL` esté correcto
- Asegúrate de que sea HTTPS en producción
- Revisa los logs del webhook con `docker logs waha`

---

## 📊 Monitoreo

### Health Check

```bash
curl http://localhost:3000/health
```

### Estado de Sesión

```bash
curl http://localhost:3000/api/sessions/default
```

### Logs en Tiempo Real

```bash
docker logs -f waha
```

---

## 🚀 Despliegue a Producción

### 1. Servidor Dedicado

```bash
# En tu servidor (ej: DigitalOcean, AWS, etc)
git clone tu-repo
cd dashboard
docker-compose -f docker-compose.waha.yml up -d
```

### 2. Variables de Entorno

```env
WAHA_URL=http://waha:3000  # Dentro de Docker network
WAHA_API_KEY=api-key-produccion-segura
NEXT_PUBLIC_URL=https://dashboard.tuempresa.com
```

### 3. Nginx Reverse Proxy (Opcional)

```nginx
# /etc/nginx/sites-available/dashboard

# Redirigir /waha a WAHA container
location /waha/ {
  proxy_pass http://localhost:3000/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
}
```

---

## 🔒 Seguridad

### API Key
- Genera una API key segura
- Nunca la expongas en el frontend
- Úsala solo en server-side APIs

### Webhooks
- Valida la firma de los webhooks
- Usa HTTPS en producción
- Filtra IPs permitidas

### Rate Limiting
- Implementa límites de envío
- Máximo 100 mensajes/hora
- Delays aleatorios entre mensajes

---

## 📝 Checklist Final

- [ ] WAHA corriendo en Docker
- [ ] Variables de entorno configuradas
- [ ] APIs creadas (`/session`, `/qr`, `/send`, `/webhook`)
- [ ] Frontend actualizado con polling
- [ ] QR escaneado y sesión conectada
- [ ] Mensaje de prueba enviado exitosamente
- [ ] Webhook recibiendo eventos
- [ ] Logs monitoreados
- [ ] Documentación actualizada

---

## 🎯 Resultado Esperado

**Antes (wa.me):**
- ❌ Solo link a chat
- ❌ No envía mensajes
- ❌ No recibe mensajes
- ❌ No persistente

**Después (WAHA):**
- ✅ QR real de WhatsApp Web
- ✅ Envía mensajes programáticamente
- ✅ Recibe mensajes via webhook
- ✅ Sesión persistente
- ✅ Producción-ready

---

## 📞 Soporte

- **Documentación WAHA**: https://waha.devlike.pro/docs/
- **GitHub WAHA**: https://github.com/devlikeapro/waha
- **Discord**: https://discord.gg/waha

---

**Última actualización**: 2025-11-06  
**Versión**: 2.0.0-WAHA  
**Estado**: ✅ Implementación completa y funcional

