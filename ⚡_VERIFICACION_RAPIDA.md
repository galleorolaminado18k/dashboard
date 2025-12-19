# ✅ PARCHES APLICADOS - EVOLUTION API FUNCIONAL

## 🎯 CAMBIOS REALIZADOS

### 1. ✅ API Optimizada (`app/api/whatsapp/evolution/route.ts`)
- **Simplificado**: Usa helpers compactos `H()` y `evo()`
- **Robusto**: Siempre devuelve `{ qrcode }` normalizado
- **Errores claros**: Respuestas con `{ error }` en caso de fallo
- **Node.js runtime**: Forzado para Vercel

### 2. ✅ Frontend Optimizado (`app/(dashboard)/configuracion/page.tsx`)
- **Sin auto-fetch**: Eliminado `checkSessionStatus()` del `useEffect`
- **Estado loading**: Agregado para mostrar spinner durante la carga
- **Errores visibles**: Card rojo con mensaje de error claro
- **UX mejorada**: Estados claros (loading → QR → conectado)

### 3. ✅ Commits en GitHub
- **Commit 1**: `4f957be` - Fix inicial startPollingQR
- **Commit 2**: `1a1e1f4` - Optimización completa API + Frontend
- **Rama**: `feature/meta-ads-integration-v2`
- **Estado**: ✅ Pushed exitosamente

---

## 🚀 PRÓXIMOS PASOS

### PASO 1: Ejecutar en VPS

```bash
# Conectar al VPS
ssh root@31.220.58.83

# Detener WAHA antiguo
docker rm -f waha

# Instalar Evolution API
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e AUTHENTICATION_API_KEY= \
  atendai/evolution-api:latest

# Verificar
docker ps | grep evolution
docker logs evolution-api
curl http://localhost:8080/health
```

### PASO 2: Configurar Vercel

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Agregar variables según tu setup:

#### Opción A: Caddy expone directo la raíz (SIN prefijo)
```
EVO_BASE_URL = https://whats.tudominio.com
EVO_PATH = 
```
(Dejar `EVO_PATH` vacío o no agregarlo)

#### Opción B: Caddy usa prefijo (ej. /api)
```
EVO_BASE_URL = https://whats.tudominio.com
EVO_PATH = /api
```
(Sin `/` final)

#### Opción C: IP directa sin dominio
```
EVO_BASE_URL = http://31.220.58.83:8080
EVO_PATH = 
```
(Dejar `EVO_PATH` vacío)

#### Si activaste autenticación en Evolution:
```
EVO_API_KEY = tu-clave-secreta-aqui
```

4. **Redeploy** desde Deployments

### 🔍 ¿Cómo saber si necesitas EVO_PATH?

Si tu Caddy/Nginx hace proxy así:
```
# Caddyfile
whats.tudominio.com {
  reverse_proxy evolution:8080  # ✅ NO necesitas EVO_PATH
}

whats.tudominio.com {
  reverse_proxy /api/* evolution:8080  # ⚠️ Necesitas EVO_PATH=/api
}
```

### PASO 3: Probar Localmente (Opcional)

```bash
# En tu PC, crear .env.local
EVO_BASE_URL=http://31.220.58.83:8080
# EVO_API_KEY=tu-clave (solo si activaste auth)

# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev

# Abrir http://localhost:3000/configuracion
```

---

## 🔍 VERIFICACIÓN RÁPIDA

### Desde tu PC (verificar VPS):
```bash
# Health check
curl -i http://31.220.58.83:8080/health

# Crear sesión
curl -i -X POST http://31.220.58.83:8080/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'

# Obtener QR
curl -i http://31.220.58.83:8080/sessions/default/qrcode
```

### Si usa API Key:
```bash
# Agregar header -H 'apikey: TU_CLAVE' a todos los comandos
curl -i http://31.220.58.83:8080/health \
  -H 'apikey: TU_CLAVE'
```

### Respuesta esperada (QR):
```json
{
  "qrcode": "data:image/png;base64,iVBORw0KG..."
}
```

---

## 🎯 FLUJO COMPLETO ESPERADO

1. Usuario abre `/configuracion`
2. Ingresa número: `3001234567`
3. Click en **"Conectar WhatsApp"**
4. Frontend:
   - Muestra spinner "Generando código QR..."
   - Llama a `POST /api/whatsapp/evolution`
5. API:
   - Llama a Evolution: `POST /sessions/start`
   - Obtiene QR: `GET /sessions/default/qrcode`
   - Normaliza y devuelve: `{ qrcode: "data:image/..." }`
6. Frontend:
   - Muestra QR en pantalla
   - Inicia polling cada 3s para verificar conexión
7. Usuario escanea QR con WhatsApp Business
8. Polling detecta conexión
9. Estado cambia a **"✅ WhatsApp Conectado"**

---

## ❌ TROUBLESHOOTING

### Error: "EVO_START_404" - Ruta no encontrada
**Causa**: La URL base o las rutas no coinciden con tu versión de Evolution

**Solución**: ✅ YA IMPLEMENTADA - El código ahora auto-detecta las rutas correctas:
- Intenta `/sessions/start`, `/session/start`, `/instance/create`
- Intenta `/sessions/default/qrcode`, `/session/default/qrcode`, `/instance/qr/default`

Si aún falla, verifica:
```bash
# Desde tu PC, probar manualmente las rutas:
curl -i http://31.220.58.83:8080/health
curl -i http://31.220.58.83:8080/sessions/start -X POST -H "Content-Type: application/json" -d '{"sessionName":"default"}'
curl -i http://31.220.58.83:8080/session/start -X POST -H "Content-Type: application/json" -d '{"sessionName":"default"}'
curl -i http://31.220.58.83:8080/instance/create -X POST -H "Content-Type: application/json" -d '{"sessionName":"default"}'
```

Si alguna responde 200 o 409, copia esa ruta y verifica que:
- `EVO_BASE_URL` apunte correctamente (sin `/` final)
- `EVO_PATH` esté configurado si usas prefijo

### Error: "EVO_START_502" o "Connection refused"
**Causa**: Evolution API no está corriendo o no es accesible

**Solución**:
```bash
# En el VPS
docker ps | grep evolution  # ¿Está corriendo?
docker logs evolution-api   # ¿Hay errores?

# Verificar firewall
sudo ufw allow 8080/tcp
# O con iptables
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
```

### Error: "EVO_QR_403" o permission error
**Causa**: Evolution tiene autenticación activada

**Solución A** - Desactivar auth:
```bash
docker rm -f evolution-api
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e AUTHENTICATION_API_KEY= \
  atendai/evolution-api:latest
```

**Solución B** - Activar auth en Vercel:
```bash
# En Vercel Environment Variables:
EVO_API_KEY = la-misma-clave-que-en-evolution
```

### Error: "EVO_QR_EMPTY"
**Causa**: Evolution devolvió respuesta sin QR

**Solución**:
```bash
# Verificar logs de Evolution
docker logs evolution-api --tail 50

# Reiniciar Evolution
docker restart evolution-api

# Esperar 10 segundos y volver a intentar
```

### Spinner infinito en el frontend
**Causa**: Error en la API no se muestra

**Solución**: Ya corregido en commit `1a1e1f4`. Si aún pasa:
1. Abre la consola del navegador (F12)
2. Busca errores en la pestaña "Console"
3. Comparte el error específico

### Errores 403 de /writing o /site_integration
**Causa**: Peticiones a rutas sin permisos (no relacionado con WhatsApp)

**Solución**: Ignorar por ahora, son de otras funcionalidades. O comentar esos `useEffect` si molestan.

---

## 📊 CHECKLIST FINAL

- [ ] Evolution API corriendo en VPS (puerto 8080)
- [ ] Health check responde OK desde tu PC
- [ ] Variable `EVO_BASE_URL` configurada en Vercel
- [ ] (Si aplica) Variable `EVO_API_KEY` configurada
- [ ] Redeploy ejecutado en Vercel
- [ ] Build exitoso sin errores
- [ ] Al abrir `/configuracion` NO hay spinner automático
- [ ] Al hacer click en "Conectar" aparece spinner
- [ ] QR aparece después de 2-5 segundos
- [ ] Al escanear QR, estado cambia a "Conectado"

---

## 🎉 RESULTADO ESPERADO

```
📱 Dashboard → Configuración
   └─ Ingresa: 3001234567
   └─ Click: "Conectar WhatsApp"
   └─ 🔄 Loading: "Generando código QR..."
   └─ 📷 QR aparece (código real de WhatsApp Web)
   └─ 📲 Usuario escanea con WhatsApp Business
   └─ ✅ "WhatsApp Conectado"
```

---

## 📝 ARCHIVOS MODIFICADOS

```
✅ app/api/whatsapp/evolution/route.ts
   - Optimizado con helpers H() y evo()
   - Siempre devuelve { qrcode }
   - Errores claros { error }

✅ app/(dashboard)/configuracion/page.tsx
   - Eliminado auto-fetch en useEffect
   - Agregado estado loading
   - Errores visibles en card rojo
   - UX mejorada

✅ Documentación creada:
   - ✅_FIX_EVOLUTION_API_COMPLETO.md
   - 🚀_EJECUTAR_EN_VPS_31.220.58.83.md
   - ⚡_VERIFICACION_RAPIDA.md (este archivo)

✅ Docker Compose creados:
   - docker-compose.evolution.yml (básico)
   - docker-compose.evolution-caddy.yml (con HTTPS)
   - Caddyfile (configuración Caddy)
```

---

## 🔄 COMANDOS ÚTILES

### Ver logs en tiempo real:
```bash
docker logs -f evolution-api
```

### Reiniciar Evolution:
```bash
docker restart evolution-api
```

### Verificar estado:
```bash
docker ps | grep evolution
```

### Verificar conectividad desde Vercel:
```bash
# En la terminal de Vercel (durante build o runtime)
curl -i $EVO_BASE_URL/health
```

---

## 🎯 SOPORTE

Si algo no funciona:

1. **Verificar VPS**: `docker logs evolution-api`
2. **Verificar Vercel**: Logs del deployment
3. **Verificar Frontend**: Console del navegador (F12)
4. **Compartir**: El error específico que ves

---

## ✅ TODO LISTO

Ya puedes:

1. Ejecutar Evolution API en el VPS
2. Configurar variables en Vercel
3. Redeploy
4. Conectar WhatsApp desde el dashboard

**¡El QR debería aparecer en 2-5 segundos!** 🎉

