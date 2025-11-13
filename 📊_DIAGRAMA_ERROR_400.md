# 📊 DIAGRAMA VISUAL DEL ERROR 400

## 🔴 FLUJO ACTUAL (CON ERROR)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO                                  │
│                    (En Vercel *.vercel.app)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 1. Click "Conectar WhatsApp"
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      NAVEGADOR                                   │
│  Detecta: Cross-Origin Request                                  │
│  Origen: https://dashboard-*.vercel.app                         │
│  Destino: http://31.220.58.83:8080                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 2. Envía OPTIONS (preflight)
                            │    Origin: https://dashboard-*.vercel.app
                            │    Access-Control-Request-Method: POST
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   EVOLUTION API (VPS)                            │
│                   http://31.220.58.83:8080                      │
│                                                                  │
│  ❌ NO tiene CORS configurado                                   │
│  ❌ NO reconoce petición OPTIONS                                │
│  ❌ Responde: HTTP 400 Bad Request                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 3. Responde: 400 Bad Request
                            │    (sin headers Access-Control-*)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      NAVEGADOR                                   │
│  ⚠️  Recibe 400 en OPTIONS                                      │
│  ⚠️  BLOQUEA la petición POST real                              │
│  ⚠️  No deja que llegue al servidor                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 4. Error: EVO_HTTP_400
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                             │
│  ❌ Error: EVO_HTTP_400                                         │
│  ❌ No se genera QR                                             │
│  ❌ Usuario ve error en pantalla                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🟢 FLUJO CORRECTO (CON CORS CONFIGURADO)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO                                  │
│                    (En Vercel *.vercel.app)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 1. Click "Conectar WhatsApp"
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      NAVEGADOR                                   │
│  Detecta: Cross-Origin Request                                  │
│  Origen: https://dashboard-*.vercel.app                         │
│  Destino: http://31.220.58.83:8080                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 2. Envía OPTIONS (preflight)
                            │    Origin: https://dashboard-*.vercel.app
                            │    Access-Control-Request-Method: POST
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   EVOLUTION API (VPS)                            │
│                   http://31.220.58.83:8080                      │
│                                                                  │
│  ✅ CORS configurado:                                           │
│     CORS_ORIGIN: "*"                                            │
│     CORS_METHODS: "GET,POST,PUT,DELETE"                         │
│     CORS_CREDENTIALS: "true"                                    │
│                                                                  │
│  ✅ Responde: HTTP 204 No Content                               │
│     Access-Control-Allow-Origin: *                              │
│     Access-Control-Allow-Methods: GET,POST,PUT,DELETE           │
│     Access-Control-Allow-Credentials: true                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 3. Responde: 204 No Content
                            │    CON headers Access-Control-*
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      NAVEGADOR                                   │
│  ✅ Recibe 204 en OPTIONS                                       │
│  ✅ Ve headers CORS correctos                                   │
│  ✅ PERMITE la petición POST real                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 4. Envía POST /instance/create
                            │    apikey: Galle_EVO_KEY_123
                            │    Body: { instanceName, token, qrcode }
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   EVOLUTION API (VPS)                            │
│  ✅ Recibe POST                                                 │
│  ✅ Valida API Key                                              │
│  ✅ Crea instancia                                              │
│  ✅ Genera QR code                                              │
│  ✅ Responde: HTTP 200 OK                                       │
│     { qrcode: "data:image/png;base64,..." }                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 5. Responde: 200 OK + QR code
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                      NAVEGADOR                                   │
│  ✅ Recibe 200 OK                                               │
│  ✅ Tiene el QR code                                            │
│  ✅ Pasa el QR al frontend                                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 6. QR code recibido
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                             │
│  ✅ QR code mostrado                                            │
│  ✅ Usuario puede escanearlo                                    │
│  ✅ Conexión exitosa                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 COMPARACIÓN TÉCNICA

### Sin CORS (Actual - ❌)

```
REQUEST 1 (Preflight):
OPTIONS /instance/create HTTP/1.1
Origin: https://dashboard-*.vercel.app
Access-Control-Request-Method: POST
Access-Control-Request-Headers: apikey, content-type

RESPONSE 1:
HTTP/1.1 400 Bad Request    ← PROBLEMA AQUÍ
(sin headers CORS)

RESULTADO:
→ Navegador BLOQUEA la petición POST
→ Error 400 en consola
→ No se genera QR
```

### Con CORS (Solución - ✅)

```
REQUEST 1 (Preflight):
OPTIONS /instance/create HTTP/1.1
Origin: https://dashboard-*.vercel.app
Access-Control-Request-Method: POST
Access-Control-Request-Headers: apikey, content-type

RESPONSE 1:
HTTP/1.1 204 No Content     ← CORRECTO
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PUT,DELETE
Access-Control-Allow-Credentials: true

REQUEST 2 (Real):
POST /instance/create HTTP/1.1
apikey: Galle_EVO_KEY_123
Content-Type: application/json
Body: {"instanceName":"default","token":"default","qrcode":true}

RESPONSE 2:
HTTP/1.1 200 OK             ← CORRECTO
Content-Type: application/json
Body: {"qrcode":"data:image/png;base64,..."}

RESULTADO:
→ Navegador permite la petición POST
→ Evolution procesa correctamente
→ QR se genera y se muestra ✅
```

---

## 🎯 RESUMEN VISUAL

### El Error 400 ocurre porque:

```
┌─────────────┐         ┌─────────────┐
│  NAVEGADOR  │────────→│  EVOLUTION  │
│             │ OPTIONS │             │
│ (Vercel)    │         │   (VPS)     │
└─────────────┘         └─────────────┘
                              ↓
                        ❌ Sin CORS
                              ↓
                        HTTP 400
                              ↓
                    NAVEGADOR BLOQUEA
                              ↓
                         ERROR 400
```

### La Solución es:

```
┌─────────────┐         ┌─────────────┐
│  NAVEGADOR  │────────→│  EVOLUTION  │
│             │ OPTIONS │             │
│ (Vercel)    │         │   (VPS)     │
└─────────────┘         └─────────────┘
                              ↓
                        ✅ Con CORS
                        CORS_ORIGIN: "*"
                              ↓
                        HTTP 204
                        + Headers CORS
                              ↓
                    NAVEGADOR PERMITE
                              ↓
                    POST → 200 OK + QR ✅
```

---

## 📋 VARIABLES QUE SOLUCIONAN EL PROBLEMA

```yaml
# En docker-compose.evolution.yml
environment:
  # ... otras variables ...
  
  # ESTAS 3 LÍNEAS RESUELVEN EL ERROR 400:
  CORS_ORIGIN: "*"
  CORS_METHODS: "GET,POST,PUT,DELETE"
  CORS_CREDENTIALS: "true"
```

---

## 🔍 CÓMO VERIFICAR SI EL PROBLEMA ES CORS

### Comando de prueba:

```bash
# En el VPS
curl -i -X OPTIONS http://127.0.0.1:8080/instance/create \
  -H "Origin: https://vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

### Resultado SIN CORS (problema actual):
```
HTTP/1.1 400 Bad Request    ← ERROR
Content-Type: application/json

{"statusCode":400,"message":"Bad Request"}
```

### Resultado CON CORS (después de la solución):
```
HTTP/1.1 204 No Content     ← CORRECTO
access-control-allow-origin: *
access-control-allow-methods: GET,POST,PUT,DELETE
access-control-allow-credentials: true
```

---

## ✅ ACCIÓN REQUERIDA

**Ejecuta el comando del PASO 2 en:**
`⚡_SOLUCION_DEFINITIVA_CON_CORS.md`

Ese comando agrega las variables CORS faltantes y reinicia Evolution.

**Después de eso:**
- ✅ OPTIONS responderá 204
- ✅ Navegador permitirá POST
- ✅ QR se generará correctamente
- ✅ Error 400 desaparecerá

---

**EL ERROR 400 ES POR FALTA DE CORS. LA SOLUCIÓN ESTÁ EN EL ARCHIVO ABIERTO.** 🚀

