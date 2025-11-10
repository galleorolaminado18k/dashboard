# ✅ FIX EVOLUTION API COMPLETO

## 🎯 Cambios Realizados

### 1. ✅ Corregido error `ReferenceError: startPollingQR is not defined`
- **Archivo**: `app/(dashboard)/configuracion/page.tsx`
- **Cambio**: Renombrado función `startPollingStatus` → `startPollingForConnection`
- **Resultado**: Frontend ya no llama a función inexistente

### 2. ✅ Evolution API mejorada con Bearer Token
- **Archivo**: `app/api/whatsapp/evolution/route.ts`
- **Cambio**: Agregado soporte para `EVO_BEARER` token
- **Resultado**: Ahora soporta autenticación con API Key o Bearer Token

### 3. ✅ Cambios subidos a GitHub
- **Rama**: `feature/meta-ads-integration-v2`
- **Commit**: `4f957be`
- **Estado**: ✅ Pushed exitosamente

---

## 🚀 PASOS SIGUIENTES

### PASO 1: Configurar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel y agrega estas variables:

```
EVO_BASE_URL = http://31.220.58.83:8080
```

**IMPORTANTE**: Si activaste autenticación en Evolution API, agrega también:
```
EVO_API_KEY = tu-api-key-aqui
```
O si usas Bearer token:
```
EVO_BEARER = tu-bearer-token-aqui
```

### PASO 2: Redeploy en Vercel

Después de agregar las variables de entorno, haz redeploy:

1. Ve a tu proyecto en Vercel
2. Click en "Deployments"
3. Click en los 3 puntos del último deployment
4. Click en "Redeploy"
5. ✅ Marca "Use existing Build Cache" 

---

## 🔧 SOLUCIÓN PARA ERROR DE VERCEL BUILD

### Error actual:
```
Error: Function Runtimes must have a valid version, for example `now-php@1.0.0`.
```

### Causa:
Vercel está detectando un problema con la configuración de runtime en `vercel.json`

### Solución:

Verifica tu archivo `vercel.json` y asegúrate de que esté así:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ]
}
```

**O MEJOR AÚN**: Elimina completamente el archivo `vercel.json` si existe. Next.js 15 funciona mejor sin configuración personalizada en Vercel.

---

## 📋 CHECKLIST DE VERIFICACIÓN

### En tu VPS (31.220.58.83):
- [ ] Evolution API corriendo: `docker ps | grep evolution`
- [ ] Health check OK: `curl http://localhost:8080/health`
- [ ] Puerto 8080 abierto al exterior

### En Vercel:
- [ ] Variable `EVO_BASE_URL` configurada
- [ ] Si activaste auth: `EVO_API_KEY` o `EVO_BEARER` configurado
- [ ] Redeploy ejecutado
- [ ] Build exitoso

### Prueba Final:
1. Ve a: `https://tu-app.vercel.app/configuracion`
2. Ingresa número de WhatsApp
3. Click en "Conectar WhatsApp"
4. Debe aparecer QR REAL de WhatsApp Web
5. Escanear con WhatsApp Business
6. Estado debe cambiar a "Conectado"

---

## 🐛 TROUBLESHOOTING

### Si NO aparece el QR:

#### 1. Verifica Evolution API desde tu PC:
```bash
curl -i http://31.220.58.83:8080/health
curl -i -X POST http://31.220.58.83:8080/sessions/start -H "Content-Type: application/json" -d "{\"sessionName\":\"default\",\"whatsappVersion\":\"v2\"}"
curl -i http://31.220.58.83:8080/sessions/default/qrcode
```

#### 2. Si sale 403 (permission error):
Tu Evolution tiene auth activo. Necesitas:

**Opción A - Activar auth en .env.local (desarrollo)**:
```env
EVO_API_KEY=tu-clave-aqui
```

**Opción B - Desactivar auth en Evolution**:
```bash
docker rm -f evolution-api
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e AUTHENTICATION_API_KEY= \
  atendai/evolution-api:latest
```

#### 3. Si sale error de CORS:
Evolution está corriendo pero no acepta peticiones desde Vercel.

**Solución**: Usa un dominio HTTPS con Caddy (ver PASO 3 abajo)

---

## 🎯 PASO 3 (RECOMENDADO): VPS con Dominio HTTPS

### ¿Por qué?
- Vercel en HTTPS no puede llamar a HTTP directamente (Mixed Content)
- Evolution API necesita CORS configurado
- Mejor seguridad y estabilidad

### Implementación con Caddy:

#### 1. Crea `docker-compose.evolution-caddy.yml` en tu VPS:
```yaml
services:
  evolution:
    image: atendai/evolution-api:latest
    restart: always
    volumes:
      - ./evolution-data:/evolution/store
    expose:
      - "8080"
    environment:
      - AUTHENTICATION_API_KEY=

  caddy:
    image: caddy:latest
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - evolution

volumes:
  caddy_data:
  caddy_config:
```

#### 2. Crea `Caddyfile` en tu VPS:
```
whats.tudominio.com {
  reverse_proxy evolution:8080
}
```

#### 3. Levanta los servicios:
```bash
docker compose -f docker-compose.evolution-caddy.yml up -d
```

#### 4. Configura DNS:
Apunta `whats.tudominio.com` → `31.220.58.83`

#### 5. Actualiza Vercel:
```
EVO_BASE_URL = https://whats.tudominio.com
```

#### 6. Redeploy

---

## ✅ RESULTADO ESPERADO

Después de estos pasos deberías ver:

1. ✅ Build exitoso en Vercel
2. ✅ QR de WhatsApp aparece al hacer click
3. ✅ Al escanear QR, estado cambia a "Conectado"
4. ✅ No más errores 403 en consola

---

## 📞 SOPORTE

Si sigues teniendo problemas:

1. Revisa logs de Evolution API: `docker logs evolution-api`
2. Revisa logs de Vercel: En el dashboard → Logs
3. Revisa consola del navegador (F12)
4. Comparte los errores específicos

---

## 🎉 PRÓXIMOS PASOS

Una vez que WhatsApp esté conectado:

1. Configurar notificaciones automáticas
2. Integrar envío de mensajes desde el dashboard
3. Webhook para recibir mensajes entrantes
4. Automatizaciones con clientes

