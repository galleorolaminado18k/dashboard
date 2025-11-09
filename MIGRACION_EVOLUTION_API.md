# 🚀 Guía de Migración: WAHA → Evolution API

## ¿Por qué migrar?

- **Evolution API** es más estable y moderno
- Mejor documentación y comunidad más activa
- API más limpia y predecible
- Soporte nativo para múltiples sesiones
- Mejor integración con WhatsApp Web

---

## 📋 Pre-requisitos

- Docker instalado en VPS o local
- Acceso a variables de entorno en Vercel
- (Opcional) Dominio con DNS configurado

---

## 🔧 Paso 1: Detener WAHA (si está corriendo)

### En VPS o Local:

```bash
# Navegar a directorio de WAHA
cd ~/waha || cd /path/to/waha

# Detener contenedores
docker compose down

# O forzar eliminación
docker rm -f waha

# Abrir puerto 8080 (si usas firewall)
ufw allow 8080/tcp
```

---

## 🐳 Paso 2: Instalar Evolution API

### Opción A: Docker Compose (Recomendado)

#### Para desarrollo local (HTTP):

```bash
cd ~/evolution  # o tu directorio preferido
docker compose -f docker-compose.evolution.yml up -d
```

#### Para producción con HTTPS (Caddy):

```bash
# 1. Editar Caddyfile con tu dominio real
nano Caddyfile
# Reemplaza: whats.tudominio.com con tu dominio

# 2. Levantar servicios
docker compose -f docker-compose.evolution-caddy.yml up -d

# 3. Verificar logs
docker compose logs -f
```

### Opción B: Docker Run Simple

```bash
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v $PWD/evolution-data:/evolution/store \
  atendai/evolution-api:latest
```

### Verificar instalación:

```bash
# Health check
curl http://localhost:8080/health
# O con IP pública
curl http://TU_IP:8080/health

# Respuesta esperada:
# {"status":"ok"}
```

---

## 🔑 Paso 3: Configurar Variables de Entorno

### Desarrollo Local (.env.local):

```env
EVO_BASE_URL=http://127.0.0.1:8080
```

### Producción en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega:

```env
# Opción 1: Con dominio y Caddy (RECOMENDADO)
EVO_BASE_URL=https://whats.tudominio.com

# Opción 2: Solo con IP (no recomendado para producción)
EVO_BASE_URL=http://TU_IP:8080
```

4. **Redeploy** tu aplicación en Vercel

---

## 🧪 Paso 4: Probar Endpoints (Opcional)

### Crear/Iniciar sesión:

```bash
curl -X POST http://localhost:8080/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "sessionName": "default",
    "whatsappVersion": "v2"
  }'
```

### Obtener QR:

```bash
curl http://localhost:8080/sessions/default/qrcode
```

**Respuesta esperada:**
```json
{
  "qrcode": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

### Verificar estado:

```bash
curl http://localhost:8080/sessions/default/status
```

**Respuesta esperada:**
```json
{
  "state": "connecting"  // o "open" cuando está conectado
}
```

---

## 🎨 Paso 5: Usar en el Dashboard

1. Abre tu dashboard: `http://localhost:3000/configuracion`
2. Ve a la pestaña "CRM & WhatsApp"
3. Ingresa tu número de WhatsApp Business (sin +57)
4. Click en **"Conectar WhatsApp"**
5. Escanea el QR con tu WhatsApp Business

**El QR es REAL de WhatsApp Web** - Evolution actúa como puente.

---

## 🌐 Paso 6: Configurar Webhooks (Opcional)

Para recibir mensajes entrantes en tu CRM:

```bash
curl -X POST http://localhost:8080/sessions/default/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tu-dashboard.vercel.app/api/webhooks/evolution",
    "events": ["message", "message:ack", "qrcode.updated"]
  }'
```

---

## 🧹 Paso 7: Limpiar Referencias a WAHA

### En tu proyecto local:

1. Elimina archivos viejos de WAHA:
```bash
# Opcional - mantener como backup
mkdir _old_waha
mv docker-compose.waha*.yml _old_waha/
```

2. Verifica que no haya referencias a `WAHA_BASE_URL`:
```bash
grep -r "WAHA_BASE_URL" . --exclude-dir=node_modules
grep -r "WAHA_API_KEY" . --exclude-dir=node_modules
```

3. Si encuentras referencias, reemplázalas por `EVO_BASE_URL`

---

## 📤 Paso 8: Subir cambios a GitHub

```bash
git add .
git commit -m "feat: migrar de WAHA a Evolution API para WhatsApp"
git push origin main
```

Vercel hará auto-deploy. Espera ~2-3 minutos.

---

## ✅ Verificación Final

### Local:
1. `docker ps` - debe mostrar `evolution-api` corriendo
2. `curl http://localhost:8080/health` - debe responder `{"status":"ok"}`
3. Abre `http://localhost:3000/configuracion` y prueba conectar WhatsApp

### Producción (Vercel):
1. Ve a tu URL de producción: `https://tu-dashboard.vercel.app/configuracion`
2. Conecta WhatsApp y escanea QR
3. Verifica logs en Vercel Dashboard si hay errores

---

## 🐛 Troubleshooting

### Error: "EVO_UNREACHABLE"
- **Causa**: Evolution API no está corriendo o URL incorrecta
- **Solución**: 
  ```bash
  docker ps  # verificar que evolution-api esté corriendo
  docker logs evolution-api  # ver logs
  ```

### Error: "QR no disponible"
- **Causa**: La sesión ya está conectada
- **Solución**: Desconecta primero desde el dashboard

### Error: CORS en Vercel
- **Causa**: Vercel (HTTPS) no puede llamar a HTTP
- **Solución**: Usar Caddy para HTTPS o configurar dominio

### Puerto 8080 no accesible
```bash
# En VPS
ufw allow 8080/tcp
ufw reload
ufw status

# Verificar
netstat -tulpn | grep 8080
```

---

## 📚 Recursos

- [Evolution API - GitHub](https://github.com/EvolutionAPI/evolution-api)
- [Evolution API - Documentación](https://doc.evolution-api.com/)
- [Caddy - Reverse Proxy](https://caddyserver.com/docs/)

---

## 🎉 ¡Listo!

Ahora tienes Evolution API funcionando con:
- ✅ QR real de WhatsApp Web
- ✅ Sesiones persistentes
- ✅ API moderna y estable
- ✅ Compatible con Vercel (con URL HTTPS)

¿Problemas? Revisa los logs:
```bash
# Evolution API
docker logs evolution-api -f

# Vercel (en dashboard)
Vercel → Deployment → Functions logs
```

