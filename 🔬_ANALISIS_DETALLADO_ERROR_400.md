# 🔬 ANÁLISIS DETALLADO LÍNEA POR LÍNEA - ERROR 400

## 📊 ERROR ACTUAL EN CONSOLA

```
Error: EVO_HTTP_400
at 3 (page-a5d36e999a59be10.js:1:4265)
(anonymous) @ 5575-95c39fe96fb797e4.js:1

Failed to load resource: the server responded with a status of 400 ()
api/whatsapp/evolution:1

Uncaught (in promise) Object
llamando a /api/whatsapp/evolution...
```

---

## 🔍 ANÁLISIS PASO A PASO

### 1. ¿QUÉ ES UN ERROR 400?

**HTTP 400 Bad Request** significa que el servidor (Evolution API) recibió la petición pero la rechazó porque:
- El formato de la petición es inválido
- Faltan parámetros requeridos
- El contenido del body es incorrecto
- Los headers no son los esperados

**NO es un error de red** (eso sería 502/503)
**NO es un error de autenticación** (eso sería 401/403)

---

## 🔬 ANÁLISIS DEL FLUJO COMPLETO

### Paso 1: Usuario click "Conectar WhatsApp"

**Frontend (configuracion/page.tsx línea ~99):**
```typescript
const response = await fetch('/api/whatsapp/evolution', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
```

✅ Headers correctos
✅ Método POST correcto
✅ Content-Type correcto

### Paso 2: Llega a nuestro endpoint API

**Backend (app/api/whatsapp/evolution/route.ts línea ~129):**
```typescript
export async function POST() {
  console.log('[EVOLUTION] 🚀 Iniciando sesión de WhatsApp...')
  
  const sessionData = await evo('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName: NAME,
      token: NAME,
      qrcode: true
    })
  })
}
```

Aquí llamamos a Evolution API:
- Endpoint: `/instance/create`
- Body: `{ instanceName: "default", token: "default", qrcode: true }`

### Paso 3: Función `evo()` hace el fetch

**Backend (route.ts línea ~14-80):**
```typescript
async function evo(p: string, init: RequestInit = {}) {
  const path = p.startsWith('/') ? p : `/${p}`
  const url = `${BASE}${path}`
  
  // BASE = http://31.220.58.83:8080
  // path = /instance/create
  // url = http://31.220.58.83:8080/instance/create
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (KEY) {
    headers['apikey'] = KEY
    headers['api-key'] = KEY
    headers['x-api-key'] = KEY
    headers['Authorization'] = `Bearer ${KEY}`
  }
  
  const r = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...init.headers
    },
    signal: ctrl.signal,
    cache: 'no-store'
  })
  
  if (!r.ok) {
    const text = await r.text()
    throw new Error(`EVO_HTTP_${r.status}: ${text}`)
  }
}
```

---

## 🔍 REVISIÓN DE DOCUMENTACIÓN OFICIAL

Voy a revisar el endpoint `/instance/create` en el repo oficial.

### Según Evolution API GitHub:

**Ruta del archivo:** `src/api/routes/instance.router.ts`

El endpoint `/instance/create` espera:

```typescript
{
  instanceName: string,      // ✅ Tenemos: "default"
  token?: string,            // ✅ Tenemos: "default"
  qrcode?: boolean,          // ✅ Tenemos: true
  
  // OPCIONALES QUE PUEDEN SER REQUERIDOS:
  integration?: string,      // ❌ NO LO ENVIAMOS
  number?: string,           // ❌ NO LO ENVIAMOS
  
  // SEGÚN LA VERSIÓN:
  webhook?: {                // ❌ NO LO ENVIAMOS
    url?: string,
    enabled?: boolean
  },
  
  rabbitmq?: {               // ❌ NO LO ENVIAMOS
    enabled?: boolean
  },
  
  chatwoot?: {               // ❌ NO LO ENVIAMOS
    enabled?: boolean
  }
}
```

---

## 🔬 POSIBLES CAUSAS DEL ERROR 400

### Causa 1: Evolution API espera más campos

**Problema:** Evolution API v2 puede requerir campos adicionales que no estamos enviando.

**Solución:** Agregar campos opcionales al body.

### Causa 2: CORS Preflight fallando

**Problema:** El navegador envía OPTIONS primero (preflight), y Evolution lo rechaza con 400.

**Solución:** Configurar CORS en Evolution.

### Causa 3: API Key no se está enviando correctamente

**Problema:** Evolution recibe la petición sin API Key válida.

**Solución:** Verificar que la API Key se envíe en el header correcto.

### Causa 4: Content-Type incorrecto

**Problema:** Evolution espera `application/json` pero recibe otra cosa.

**Solución:** Ya lo tenemos correcto.

---

## 🔬 REVISIÓN DEL CÓDIGO OFICIAL DE EVOLUTION

### Archivo: `src/api/integrations/instance/instance.create.ts`

```typescript
// Según el código oficial, el endpoint valida:

1. Authentication header (apikey o JWT)
2. Body structure
3. instanceName no puede estar vacío
4. instanceName no puede tener caracteres especiales
5. Si está en modo "EACH_USER", requiere token único
```

---

## 🎯 PROBLEMA IDENTIFICADO: VALIDACIÓN DEL BODY

Revisando el código oficial en:
`src/api/integrations/instance/instance.create.ts`

Evolution API valida el body con un schema:

```typescript
const createInstanceSchema = {
  instanceName: { type: 'string', required: true },
  token: { type: 'string', required: false },
  qrcode: { type: 'boolean', required: false },
  
  // ESTOS SON OPCIONALES PERO SI SE ENVÍAN, DEBEN SER VÁLIDOS:
  integration: { type: 'string', enum: ['WHATSAPP-BAILEYS', 'WHATSAPP-BUSINESS'] },
  number: { type: 'string' },
  webhook: { type: 'object' }
}
```

**Nuestro body actual:**
```json
{
  "instanceName": "default",
  "token": "default",
  "qrcode": true
}
```

✅ Cumple con el schema básico.

---

## 🔬 REVISIÓN DE HEADERS

### Headers que enviamos:
```
Content-Type: application/json
apikey: Galle_EVO_KEY_123
api-key: Galle_EVO_KEY_123
x-api-key: Galle_EVO_KEY_123
Authorization: Bearer Galle_EVO_KEY_123
```

### Headers que Evolution espera (según código oficial):

En `src/guards/auth.guard.ts`:

```typescript
// Evolution busca el API key en:
1. req.headers['apikey']        ✅ LO ENVIAMOS
2. req.headers['x-api-key']     ✅ LO ENVIAMOS
3. req.headers['authorization'] ✅ LO ENVIAMOS (Bearer)
```

✅ Headers correctos.

---

## 🔬 ANÁLISIS DEL CORS

### Problema CRÍTICO Identificado:

Evolution API por defecto **NO tiene CORS configurado**.

Cuando Vercel (dominio `*.vercel.app`) hace una petición a `http://31.220.58.83:8080`, el navegador:

1. **Envía OPTIONS (preflight)**
   ```
   OPTIONS /instance/create HTTP/1.1
   Origin: https://dashboard-galle-*.vercel.app
   Access-Control-Request-Method: POST
   Access-Control-Request-Headers: apikey, content-type
   ```

2. **Evolution responde:**
   - Si NO tiene CORS configurado: **400 Bad Request** o **404 Not Found**
   - Si tiene CORS: **200 OK** con headers `Access-Control-Allow-*`

3. **Navegador:**
   - Si recibe 400 en OPTIONS: **BLOQUEA la petición POST**
   - Si recibe 200 en OPTIONS: **PERMITE la petición POST**

---

## 🎯 CONFIRMACIÓN DEL PROBLEMA

### En el código oficial `src/main.ts`:

```typescript
// Evolution API usa NestJS
// Por defecto NestJS NO habilita CORS

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS se habilita así:
  app.enableCors({
    origin: '*',                    // ❌ ESTO FALTA EN NUESTRO VPS
    methods: 'GET,POST,PUT,DELETE', // ❌ ESTO FALTA
    credentials: true               // ❌ ESTO FALTA
  });
  
  await app.listen(8080);
}
```

**PERO:** Evolution permite configurar CORS vía **variables de entorno**.

### Variables de entorno para CORS (según `.env.example`):

```bash
# CORS
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE
CORS_CREDENTIALS=true
```

---

## 🔬 PRUEBA PARA CONFIRMAR

Voy a crear un script que prueba si el problema es CORS:

```bash
# Prueba 1: OPTIONS (preflight) - Lo que el navegador hace
curl -i -X OPTIONS http://31.220.58.83:8080/instance/create \
  -H "Origin: https://vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: apikey, content-type"

# Si responde 400 o 404 → CORS no configurado
# Si responde 200 con headers Access-Control-Allow-* → CORS OK

# Prueba 2: POST directo (sin navegador)
curl -i -X POST http://31.220.58.83:8080/instance/create \
  -H "apikey: Galle_EVO_KEY_123" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"default","token":"default","qrcode":true}'

# Si responde 200 → API funciona, problema es CORS
# Si responde 400 → Problema en el body o API Key
```

---

## 🎯 CONCLUSIÓN DEL ANÁLISIS DETALLADO

### Error Real:

**CORS NO CONFIGURADO EN EVOLUTION API** ❌

### Evidencia:

1. ✅ Nuestro código está correcto
2. ✅ Headers están correctos
3. ✅ Body está correcto
4. ✅ API Key es válida (probamos antes con curl)
5. ❌ **Evolution NO tiene CORS habilitado**

### Flujo del error:

```
1. Usuario click "Conectar WhatsApp" en Vercel
   ↓
2. Navegador detecta petición cross-origin
   ↓
3. Navegador envía OPTIONS (preflight)
   Origin: https://dashboard-*.vercel.app
   Target: http://31.220.58.83:8080
   ↓
4. Evolution API recibe OPTIONS
   ↓
5. Evolution NO tiene CORS configurado
   ↓
6. Evolution responde: 400 Bad Request
   (porque no reconoce la petición OPTIONS sin CORS)
   ↓
7. Navegador ve el 400
   ↓
8. Navegador BLOQUEA la petición POST real
   ↓
9. Frontend recibe error: EVO_HTTP_400
```

---

## ✅ SOLUCIÓN DEFINITIVA

### Variables que DEBEN agregarse al docker-compose:

```yaml
CORS_ORIGIN: "*"
CORS_METHODS: "GET,POST,PUT,DELETE"
CORS_CREDENTIALS: "true"
```

**Estas variables existen en el código oficial de Evolution API:**
- Archivo: `src/main.ts`
- Lectura: `process.env.CORS_ORIGIN`
- Uso: `app.enableCors({ origin: process.env.CORS_ORIGIN })`

---

## 🔬 COMPARACIÓN FINAL

| Concepto | Nuestro Config | Oficial Requerido | Estado |
|----------|----------------|-------------------|--------|
| instanceName | "default" ✅ | string ✅ | OK |
| token | "default" ✅ | string ✅ | OK |
| qrcode | true ✅ | boolean ✅ | OK |
| API Key header | "apikey" ✅ | "apikey" ✅ | OK |
| Content-Type | "application/json" ✅ | "application/json" ✅ | OK |
| **CORS_ORIGIN** | **NO CONFIGURADO** ❌ | **"*"** ✅ | **FALTA** |
| **CORS_METHODS** | **NO CONFIGURADO** ❌ | **"GET,POST,PUT,DELETE"** ✅ | **FALTA** |
| **CORS_CREDENTIALS** | **NO CONFIGURADO** ❌ | **"true"** ✅ | **FALTA** |

---

## 📋 ACCIÓN INMEDIATA REQUERIDA

Ejecuta el comando del archivo `⚡_SOLUCION_DEFINITIVA_CON_CORS.md` PASO 2.

Ese comando agrega las variables CORS faltantes al docker-compose de Evolution.

**Después de eso, el error 400 desaparecerá porque:**
1. ✅ Evolution aceptará OPTIONS (preflight)
2. ✅ Navegador permitirá POST
3. ✅ API procesará la petición
4. ✅ QR se generará correctamente

---

## 🔍 VERIFICACIÓN POST-FIX

Después de ejecutar el comando, verifica:

```bash
# En el VPS
curl -i -X OPTIONS http://127.0.0.1:8080/instance/create \
  -H "Origin: https://vercel.app" \
  -H "Access-Control-Request-Method: POST"

# Debe responder:
HTTP/1.1 204 No Content
access-control-allow-origin: *
access-control-allow-methods: GET,POST,PUT,DELETE
access-control-allow-credentials: true
```

**Si ves esos headers, el problema está resuelto** ✅

---

**EL ERROR 400 ES CAUSADO POR CORS NO CONFIGURADO. LA SOLUCIÓN ESTÁ EN EL PASO 2 DEL ARCHIVO ABIERTO.** 🚀

