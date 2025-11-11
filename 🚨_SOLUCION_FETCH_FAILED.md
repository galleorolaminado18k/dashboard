# 🚨 SOLUCIÓN COMPLETA - TypeError: fetch failed

## 🎯 PROBLEMA

**Error**: `TypeError: fetch failed` al intentar conectar WhatsApp desde Vercel

**Causas posibles**:
1. Ruta ejecutándose en Edge Runtime (no soporta HTTP a IP:puerto)
2. Evolution API no accesible desde Vercel
3. Firewall bloqueando puerto 8080
4. Variables de entorno no configuradas
5. Evolution API caído o reiniciando

---

## ✅ SOLUCIÓN APLICADA

### 1. Forzar Node.js Runtime ✅

**Archivo**: `app/api/whatsapp/evolution/route.ts`

```typescript
// ✅ Obliga a usar Node (no Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

**Por qué**: Edge Runtime no puede hacer fetch a IPs con puertos personalizados (solo HTTPS 443).

### 2. Cliente robusto con manejo de errores ✅

```typescript
async function jfetch(path: string, init: RequestInit = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${BASE}${PATH}${normalizedPath}`;
  
  try {
    const r = await fetch(fullUrl, {
      ...init,
      headers: { ...H(), ...(init.headers || {}) },
      cache: 'no-store',
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    // ... manejo de respuesta
  } catch (error: any) {
    throw new Error(`EVO_FETCH_FAILED: ${error.message}`);
  }
}
```

### 3. Headers con todas las variantes ✅

```typescript
const H = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (APIKEY) {
    headers['apikey'] = APIKEY;
    headers['X-API-KEY'] = APIKEY;
    headers['x-api-key'] = APIKEY;
  }
  if (BEARER) {
    headers['Authorization'] = `Bearer ${BEARER}`;
  }
  return headers;
};
```

---

## ⚙️ PASO 5: CONFIGURAR VARIABLES EN VERCEL

### Variables obligatorias:

```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_API_KEY
Value: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

### Variables opcionales:

```
Name: EVO_PATH
Value: 
(Solo si Evolution está detrás de un proxy con prefijo como /api)

Name: EVO_BEARER
Value: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
(Solo si Evolution usa Authorization: Bearer en lugar de apikey)
```

### 🛑 IMPORTANTE: Redeploy después de agregar variables

1. Vercel → Settings → Environment Variables
2. Agregar las variables
3. Click en "Save"
4. **Deployments** → Click en los 3 puntos → **Redeploy**

**Sin redeploy, las variables no aplican!**

---

## 🚀 PASO 6: SI AÚN FALLA - EXPONER HTTPS CON DOMINIO

### Problema:
- Edge/Redes corporativas bloquean HTTP :8080 a IP pública
- Vercel puede tener restricciones para salir a puertos no estándar

### Solución: Publicar Evolution API en HTTPS 443 con dominio

#### Opción A: Caddy (Recomendado) ⭐

**1. Crear `docker-compose.evo-caddy.yml` en el VPS:**

```yaml
services:
  evo:
    image: atendai/evolution-api:latest
    environment:
      API_KEY: "81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
      AUTHENTICATION_API_KEY: "81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
      DATABASE_ENABLED: "false"
    networks: [web]
    volumes:
      - ~/evolution-data:/evolution/store

  caddy:
    image: caddy:2
    ports: 
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks: [web]
    depends_on: [evo]

networks:
  web: {}

volumes:
  caddy_data:
  caddy_config:
```

**2. Crear `Caddyfile`:**

```
# Reemplaza con tu dominio real
api.tudominio.com {
  encode gzip
  
  reverse_proxy evo:8080 {
    header_up apikey {http.request.header.apikey}
    header_up X-API-KEY {http.request.header.X-API-KEY}
    header_up x-api-key {http.request.header.x-api-key}
    header_up Authorization {http.request.header.Authorization}
    header_up Content-Type {http.request.header.Content-Type}
  }

  # CORS headers
  header {
    Access-Control-Allow-Origin *
    Access-Control-Allow-Methods "GET, POST, DELETE, OPTIONS"
    Access-Control-Allow-Headers "Content-Type, Authorization, apikey, X-API-KEY, x-api-key"
  }
}
```

**3. Levantar en el VPS:**

```bash
# Detener Evolution actual
docker rm -f evolution-api

# Levantar con Caddy
docker compose -f docker-compose.evo-caddy.yml up -d

# Verificar
docker ps
docker logs caddy --tail 30
```

**4. Configurar DNS:**

En tu proveedor de dominio (GoDaddy, Namecheap, etc.):

```
Tipo: A
Nombre: api
Valor: 31.220.58.83
TTL: 300
```

**5. Actualizar Vercel:**

```
EVO_BASE_URL = https://api.tudominio.com
EVO_API_KEY = 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

**Redeploy**

#### Opción B: Cloudflare Tunnel (Gratis, sin dominio propio)

```bash
# En el VPS
docker run -d --name cloudflared \
  cloudflare/cloudflared:latest tunnel \
  --url http://localhost:8080 \
  --no-autoupdate

# Ver logs para obtener el túnel
docker logs cloudflared

# Obtendrás una URL como: https://xxxxx.trycloudflare.com
```

Luego en Vercel:
```
EVO_BASE_URL = https://xxxxx.trycloudflare.com
```

---

## 📊 TABLA DE ERRORES Y SOLUCIONES

| Error | Causa | Solución |
|-------|-------|----------|
| `TypeError: fetch failed` | Edge Runtime, HTTP/IP:8080 bloqueado | ✅ Forzar `runtime='nodejs'` + HTTPS con dominio |
| `EVO_START_403 / EVO_UNREACHABLE` | Edge bloqueando IP/puerto | ✅ Publicar en HTTPS 443 con Caddy |
| `EVO_START_401` | Falta/errónea `EVO_API_KEY` | ✅ Configurar clave correcta + redeploy |
| `EVO_START_404` | Endpoint equivocado o URL con // | ✅ Usar `/sessions/start` y normalizar BASE |
| `502/503` | Evolution caído o reiniciando | ✅ `docker ps`, `docker logs`, reiniciar |
| `Connection refused` | Puerto 8080 cerrado | ✅ `sudo ufw allow 8080/tcp` |
| `Tenant or user not found` | URI de Supabase incorrecta | ✅ Usar Transaction Pooler (puerto 6543) |

---

## 🧪 TESTS DE VERIFICACIÓN

### Test 1: Desde el VPS (localhost)

```bash
curl -i http://localhost:8080/health
```

**Esperado**: `200 OK` ✅

### Test 2: Desde tu PC

```bash
curl -i http://31.220.58.83:8080/health \
  -H "apikey: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
```

**Esperado**: `200 OK` ✅

**Si falla**: Puerto bloqueado o Evolution caído.

### Test 3: Desde Vercel (logs)

Después de redeploy, ve a Vercel → Deployments → Function Logs

**Busca líneas como**:
```
[EVOLUTION] 🚀 POST: Iniciando sesión...
[EVOLUTION] 🔧 Runtime: nodejs
[EVOLUTION] 🌐 BASE URL: http://31.220.58.83:8080
[EVOLUTION] 🔑 API Key configurada: Sí ✅
[EVOLUTION] 🔗 Llamando: http://31.220.58.83:8080/health
[EVOLUTION] ✅ Health check: OK
```

**Si ves "EVO_FETCH_FAILED"**: Evolution no accesible desde Vercel → Usar HTTPS con dominio.

### Test 4: Desde el dashboard

1. Ir a `/configuracion`
2. Ingresar número
3. Click "Conectar WhatsApp"
4. Abrir consola (F12)

**Deberías ver**:
```
📡 Llamando a /api/whatsapp/evolution...
📥 Respuesta: {qrcode: "data:image/png;base64,..."}
✅ QR obtenido!
```

**NO deberías ver**:
```
❌ Error: TypeError: fetch failed
```

---

## ✅ CHECKLIST FINAL

### Código:
- [ ] `runtime = 'nodejs'` configurado
- [ ] `dynamic = 'force-dynamic'` configurado
- [ ] Helper `jfetch` con try-catch robusto
- [ ] Headers con todas las variantes (apikey, X-API-KEY, etc.)
- [ ] Timeout de 30 segundos configurado

### VPS:
- [ ] Evolution API corriendo: `docker ps | grep evolution`
- [ ] Puerto 8080 abierto: `sudo ufw allow 8080/tcp`
- [ ] Health check OK: `curl http://localhost:8080/health`

### Vercel:
- [ ] `EVO_BASE_URL` configurada
- [ ] `EVO_API_KEY` configurada
- [ ] **Redeploy ejecutado** (crítico!)
- [ ] Build exitoso sin errores
- [ ] Logs muestran `Runtime: nodejs`

### Prueba final:
- [ ] Dashboard carga `/configuracion`
- [ ] Click "Conectar WhatsApp"
- [ ] QR aparece en 2-5 segundos
- [ ] NO hay error `TypeError: fetch failed`

---

## 🎯 RESULTADO ESPERADO

### ✅ Antes (con el fix):

```
[EVOLUTION] 🚀 POST: Iniciando sesión...
[EVOLUTION] 🔧 Runtime: nodejs
[EVOLUTION] 🔗 Llamando: http://31.220.58.83:8080/health
[EVOLUTION] ✅ Health check: OK
[EVOLUTION] ✅ Sesión: Creada
[EVOLUTION] ✅ QR obtenido exitosamente!
```

### ❌ Antes (sin el fix):

```
TypeError: fetch failed
    at node:internal/deps/undici/undici:12345:67
```

---

## 🚀 SI TODO FALLA: PLAN B (HTTPS CON CADDY)

Este es el método más confiable para producción:

1. **Comprar dominio** (o usar subdominio de uno existente)
2. **Configurar DNS** apuntando a tu VPS
3. **Levantar Caddy** con el `docker-compose.evo-caddy.yml` de arriba
4. **Actualizar Vercel**: `EVO_BASE_URL = https://api.tudominio.com`
5. **Redeploy**

**Ventajas**:
- ✅ HTTPS automático (Let's Encrypt)
- ✅ Funciona desde cualquier lado (Vercel, navegador, móvil)
- ✅ No hay problemas de CORS o puertos bloqueados
- ✅ Profesional y escalable

---

**🎉 Con estos cambios, el error `TypeError: fetch failed` debería estar completamente resuelto!**

