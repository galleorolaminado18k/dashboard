# ✅ SOLUCIÓN EVO_START_401 - AUTENTICACIÓN REQUERIDA

## 🎯 PROBLEMA IDENTIFICADO

**Error**: `EVO_START_401` - No autorizado

**Causa**: Evolution API está protegida con autenticación y no estamos enviando las credenciales correctas.

**Solución**: Configurar la misma clave en Evolution API (VPS) y en Vercel.

---

## 🔐 PASO 1: CONFIGURAR EVOLUTION API EN EL VPS

### Opción A: Usando Docker Compose (Recomendado)

#### 1. Crear/editar `docker-compose.evolution.yml` en el VPS:

```yaml
services:
  evolution:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - ./evolution-data:/evolution/store
    environment:
      # ✅ Define tu clave API personalizada
      API_KEY: galle-super-key          # ← Cambia esto por tu clave
      # O si tu versión usa otro nombre:
      # AUTHENTICATION_API_KEY: galle-super-key
```

#### 2. Detener contenedor anterior y levantar con la nueva configuración:

```bash
# Conectar al VPS
ssh root@31.220.58.83

# Detener contenedor anterior
docker rm -f evolution-api

# Levantar con docker-compose
docker compose -f docker-compose.evolution.yml up -d

# Verificar que esté corriendo
docker ps | grep evolution

# Ver logs para confirmar
docker logs evolution-api --tail 20
```

### Opción B: Usando Docker Run directamente

```bash
# Conectar al VPS
ssh root@31.220.58.83

# Detener contenedor anterior
docker rm -f evolution-api

# Levantar con API Key configurada
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=galle-super-key \
  atendai/evolution-api:latest

# Verificar
docker ps | grep evolution
docker logs evolution-api --tail 20
```

### 🔍 Verificar qué variable de entorno usa tu Evolution

```bash
# Ver todas las variables relacionadas con auth
docker exec evolution-api printenv | grep -Ei 'API|KEY|AUTH|TOKEN'
```

**Posibles nombres de variable**:
- `API_KEY`
- `AUTHENTICATION_API_KEY`
- `AUTH_KEY`
- `EVOLUTION_API_KEY`

**Anota el nombre exacto** que aparezca en los logs.

---

## ⚙️ PASO 2: CONFIGURAR VERCEL

### 1. Ve a tu proyecto en Vercel

**Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**

### 2. Agregar las variables de entorno:

#### Variables obligatorias:

```
EVO_BASE_URL = http://31.220.58.83:8080
```
(O tu dominio si usas Caddy: `https://whats.tudominio.com`)

```
EVO_API_KEY = galle-super-key
```
**⚠️ IMPORTANTE**: Debe ser **exactamente la misma clave** que configuraste en Evolution API.

#### Variables opcionales:

```
EVO_PATH = 
```
(Solo si usas prefijo como `/api`)

```
EVO_BEARER = tu-bearer-token
```
(Solo si tu versión de Evolution usa `Authorization: Bearer` en lugar de `apikey`)

### 3. Redeploy

- Ve a **Deployments**
- Click en los 3 puntos del último deployment
- Click en **Redeploy**

---

## 🧪 PASO 3: VERIFICACIÓN RÁPIDA (ANTES DE REDEPLOY)

### Desde tu PC, probar la API directamente:

#### A) Sin credenciales (debe fallar con 401):
```bash
curl -i http://31.220.58.83:8080/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

**Resultado esperado**: `401 Unauthorized` ❌

#### B) Con apikey (debe funcionar):
```bash
curl -i http://31.220.58.83:8080/sessions/start \
  -H "Content-Type: application/json" \
  -H "apikey: galle-super-key" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

**Resultado esperado**: `200 OK` o `409 Conflict` ✅

#### C) Probar QR con apikey:
```bash
curl -i http://31.220.58.83:8080/sessions/default/qrcode \
  -H "apikey: galle-super-key"
```

**Resultado esperado**: `200 OK` + JSON con QR ✅

### Si falla con 401 aún con apikey:

Puede que tu Evolution use `Authorization: Bearer` en lugar de `apikey`:

```bash
curl -i http://31.220.58.83:8080/sessions/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer galle-super-key" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

Si esto funciona, en Vercel configura:
```
EVO_BEARER = galle-super-key
```
(En lugar de `EVO_API_KEY`)

---

## 📋 CHECKLIST DE CONFIGURACIÓN

### En el VPS:
- [ ] Evolution API corriendo con `API_KEY` configurada
- [ ] `docker logs evolution-api` muestra que levantó sin errores
- [ ] Curl con `apikey` header responde 200/409 (no 401)

### En Vercel:
- [ ] Variable `EVO_BASE_URL` configurada
- [ ] Variable `EVO_API_KEY` configurada (misma clave que en VPS)
- [ ] (Opcional) Variable `EVO_BEARER` si aplica
- [ ] (Opcional) Variable `EVO_PATH` si usas prefijo
- [ ] Redeploy ejecutado

### Prueba final:
- [ ] Ir a `/configuracion`
- [ ] Ingresar número
- [ ] Click "Conectar WhatsApp"
- [ ] ✅ NO más error `EVO_START_401`
- [ ] ✅ QR aparece en 2-5 segundos

---

## 🎯 EJEMPLO COMPLETO: VPS CON IP DIRECTA

### 1. En el VPS (31.220.58.83):

```bash
# Conectar
ssh root@31.220.58.83

# Detener contenedor anterior
docker rm -f evolution-api

# Levantar con autenticación
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=miClaveSecreta2024 \
  atendai/evolution-api:latest

# Verificar logs
docker logs evolution-api
```

### 2. Probar desde tu PC:

```bash
# Sin auth (debe fallar)
curl -i http://31.220.58.83:8080/health

# Con auth (debe funcionar)
curl -i http://31.220.58.83:8080/health \
  -H "apikey: miClaveSecreta2024"

# Start session con auth
curl -i -X POST http://31.220.58.83:8080/sessions/start \
  -H "Content-Type: application/json" \
  -H "apikey: miClaveSecreta2024" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'

# QR con auth
curl http://31.220.58.83:8080/sessions/default/qrcode \
  -H "apikey: miClaveSecreta2024"
```

### 3. En Vercel:

```
EVO_BASE_URL = http://31.220.58.83:8080
EVO_API_KEY = miClaveSecreta2024
```

### 4. Redeploy y probar!

---

## 🐛 TROUBLESHOOTING

### Error persiste: 401 Unauthorized

**Causa 1**: La clave en Vercel no coincide con la del VPS

**Solución**:
```bash
# En el VPS, verificar la clave configurada
docker exec evolution-api printenv | grep -i key

# Asegurarse de que EVO_API_KEY en Vercel sea EXACTAMENTE la misma
```

**Causa 2**: Evolution usa nombre diferente de header

**Solución**: Probar con `Authorization: Bearer` en lugar de `apikey`:
```bash
curl -i http://31.220.58.83:8080/health \
  -H "Authorization: Bearer miClaveSecreta2024"
```

Si funciona, configurar en Vercel:
```
EVO_BEARER = miClaveSecreta2024
```

**Causa 3**: Evolution requiere ambos headers

**Solución**: Configurar ambos en Vercel:
```
EVO_API_KEY = miClaveSecreta2024
EVO_BEARER = miClaveSecreta2024
```

### Error: Health check funciona pero sessions/start no

**Causa**: Algunos endpoints requieren auth y otros no

**Solución**: Ya está implementado. El código envía las credenciales en todas las peticiones.

### Error: "apikey is not defined" en logs de Vercel

**Causa**: Variable de entorno no configurada

**Solución**:
1. Vercel → Settings → Environment Variables
2. Verificar que `EVO_API_KEY` esté creada
3. Redeploy (importante: redeploy después de agregar variables)

---

## 📊 COMPARACIÓN: ANTES vs AHORA

### ANTES ❌
```typescript
const H = () => ({
  'Content-Type': 'application/json',
  ...(APIKEY ? { apikey: APIKEY } : {})
})
```
**Problema**: Solo soportaba `apikey`, no `Bearer`

### AHORA ✅
```typescript
const H = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (APIKEY) headers['apikey'] = APIKEY
  if (BEARER) headers['Authorization'] = `Bearer ${BEARER}`
  return headers
}
```
**Ventaja**: Soporta ambos métodos de autenticación

---

## 🎉 RESULTADO ESPERADO

### Antes:
```
❌ EVO_START_401
❌ No autorizado
❌ Evolution rechaza las peticiones
```

### Después de configurar:
```
✅ Credenciales enviadas correctamente
✅ Evolution acepta las peticiones
✅ QR aparece sin error 401
✅ WhatsApp se puede conectar
```

---

## 🚀 CONFIGURACIONES RÁPIDAS

### Sin autenticación (desarrollo local):
```bash
# VPS
docker run -d --name evolution-api \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  atendai/evolution-api:latest

# Vercel (no agregar EVO_API_KEY)
EVO_BASE_URL = http://31.220.58.83:8080
```

### Con autenticación (producción recomendada):
```bash
# VPS
docker run -d --name evolution-api \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=TuClaveSegura2024 \
  atendai/evolution-api:latest

# Vercel
EVO_BASE_URL = http://31.220.58.83:8080
EVO_API_KEY = TuClaveSegura2024
```

### Con Caddy y autenticación:
```bash
# VPS (docker-compose.evolution-caddy.yml)
services:
  evolution:
    image: atendai/evolution-api:latest
    environment:
      API_KEY: TuClaveSegura2024
    # ... resto de config

# Vercel
EVO_BASE_URL = https://whats.tudominio.com
EVO_API_KEY = TuClaveSegura2024
```

---

## 📞 RESUMEN EJECUTIVO

### Lo que necesitas hacer AHORA:

1. **En el VPS**: Configurar `API_KEY` en Evolution API
2. **Probar**: Curl con `apikey` debe responder 200 (no 401)
3. **En Vercel**: Agregar `EVO_API_KEY` con la misma clave
4. **Redeploy**: Y probar en `/configuracion`

### Comandos rápidos:

```bash
# VPS
ssh root@31.220.58.83
docker rm -f evolution-api
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 -v ~/evolution-data:/evolution/store \
  -e API_KEY=MiClave123 atendai/evolution-api:latest

# Probar
curl -i http://31.220.58.83:8080/health -H "apikey: MiClave123"
```

```
# Vercel Environment Variables
EVO_BASE_URL = http://31.220.58.83:8080
EVO_API_KEY = MiClave123
```

**Redeploy → Probar → ✅ Listo!**

---

## ✅ COMMIT Y CAMBIOS

**Archivo modificado**: `app/api/whatsapp/evolution/route.ts`

**Cambios**:
- ✅ Agregada variable `EVO_BEARER`
- ✅ Helper `H()` ahora envía ambos headers: `apikey` y `Authorization: Bearer`
- ✅ Logs mejorados para mostrar si las credenciales están configuradas

**Próximo commit**: Se subirá este fix a GitHub automáticamente.

**🎯 El error EVO_START_401 se resolverá configurando las credenciales correctamente!**

