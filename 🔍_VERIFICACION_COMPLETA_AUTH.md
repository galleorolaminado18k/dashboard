# 🔍 VERIFICACIÓN PASO A PASO - EVOLUTION API AUTH

## PASO 0: Verificar la clave real del servidor en el VPS

### Conectar al VPS:
```bash
ssh root@31.220.58.83
```

### Ver logs de autenticación:
```bash
docker logs evolution-api 2>&1 | grep -Ei 'auth|api.*key|token'
```

### Ver variables de entorno configuradas:
```bash
docker exec evolution-api printenv | grep -Ei 'API|KEY|AUTH|TOKEN'
```

**Deberías ver algo como**:
```
API_KEY=galle-super-key
```
O:
```
AUTHENTICATION_API_KEY=galle-super-key
```

**Si no aparece ninguna variable, arrancar Evolution con autenticación explícita:**

```bash
# Detener contenedor actual
docker rm -f evolution-api

# Levantar con autenticación
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=galle-super-key \
  -e AUTHENTICATION=true \
  atendai/evolution-api:latest

# Verificar logs
docker logs evolution-api --tail 30
```

---

## PASO 1: Probar la autenticación desde el VPS (localhost)

### Test 1: Health check sin autenticación (debe fallar con 401 si auth está activo)
```bash
curl -i http://localhost:8080/health
```

**Resultado esperado**: `401 Unauthorized` ❌

### Test 2: Health check CON apikey header (debe funcionar)
```bash
curl -i http://localhost:8080/health \
  -H "apikey: galle-super-key"
```

**Resultado esperado**: `200 OK` ✅

### Test 3: Start session con apikey header
```bash
curl -i -X POST http://localhost:8080/sessions/start \
  -H "Content-Type: application/json" \
  -H "apikey: galle-super-key" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

**Resultado esperado**: `200 OK` o `409 Conflict` ✅

---

## PASO 2: Probar desde tu PC (verificar que el puerto esté abierto)

### Test 1: Health check con apikey
```bash
curl -i http://31.220.58.83:8080/health \
  -H "apikey: galle-super-key"
```

**Resultado esperado**: `200 OK` ✅

**Si falla con "Connection refused"**: Puerto 8080 está bloqueado
```bash
# En el VPS, abrir puerto
sudo ufw allow 8080/tcp
```

### Test 2: Start session con headers
```bash
curl -i -X POST http://31.220.58.83:8080/sessions/start \
  -H "Content-Type: application/json" \
  -H "apikey: galle-super-key" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

**Resultado esperado**: `200 OK` o `409 Conflict` ✅

### Test 3: Probar con Bearer token (si apikey no funciona)
```bash
curl -i http://31.220.58.83:8080/health \
  -H "Authorization: Bearer galle-super-key"
```

**Si esto funciona**, tu Evolution usa Bearer en lugar de apikey.

### Test 4: Probar con apikey en query string (fallback)
```bash
curl -i "http://31.220.58.83:8080/sessions/start?apikey=galle-super-key" \
  -H "Content-Type: application/json" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

### Test 5: Probar con X-API-KEY header (otra variante)
```bash
curl -i http://31.220.58.83:8080/health \
  -H "X-API-KEY: galle-super-key"
```

---

## PASO 3: Configurar Vercel con las credenciales

### 1. Ir a Vercel Dashboard:
```
https://vercel.com/dashboard
```

### 2. Tu proyecto → Settings → Environment Variables

### 3. Agregar variables (según lo que funcionó en los tests):

#### Si funcionó con header `apikey`:
```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_API_KEY
Value: galle-super-key
```

#### Si funcionó con `Authorization: Bearer`:
```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_BEARER
Value: galle-super-key
```

#### Si ambos funcionaron (agregar ambas para máxima compatibilidad):
```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_API_KEY
Value: galle-super-key

Name: EVO_BEARER
Value: galle-super-key
```

### 4. Redeploy

---

## PASO 4: Verificar el deploy en Vercel

### 1. Ver logs del deployment:
- Vercel Dashboard → Tu proyecto → Deployments
- Click en el último deployment
- Ver "Build Logs"

**Buscar líneas como**:
```
[EVOLUTION] API Key: Configurada ✅
[EVOLUTION] Bearer Token: Configurado ✅
```

### 2. Ver logs de runtime:
- Vercel Dashboard → Tu proyecto → Logs (pestaña Function Logs)

**Cuando hagas click en "Conectar WhatsApp" deberías ver**:
```
[EVOLUTION] Llamando: http://31.220.58.83:8080/sessions/start
[EVOLUTION] ✅ Sesión iniciada con /sessions/start (headers)
```

---

## PASO 5: Probar en el dashboard

### 1. Ir a tu app en Vercel:
```
https://tu-app.vercel.app/configuracion
```

### 2. Ingresar número de WhatsApp:
```
3001234567
```

### 3. Click en "Conectar WhatsApp"

### 4. Abrir consola del navegador (F12 → Console)

**Deberías ver logs como**:
```
📡 Llamando a /api/whatsapp/evolution...
📥 Respuesta: {qrcode: "data:image/png;base64,..."}
✅ QR obtenido!
```

**NO deberías ver**:
```
❌ Error: EVO_START_401
```

### 5. Resultado esperado:
- ✅ Spinner "Generando código QR..." aparece
- ✅ QR aparece en 2-5 segundos
- ✅ Puedes escanear el QR con WhatsApp Business
- ✅ Estado cambia a "Conectado"

---

## 🐛 TROUBLESHOOTING POR ERROR

### Error: 401 Unauthorized desde el VPS (localhost)

**Causa**: Evolution no tiene la variable de entorno configurada

**Solución**:
```bash
# Ver qué variables están configuradas
docker exec evolution-api printenv | grep -i key

# Si no aparece nada, recrear el contenedor
docker rm -f evolution-api

docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=galle-super-key \
  atendai/evolution-api:latest
```

### Error: 401 desde tu PC pero funciona en localhost del VPS

**Causa**: Firewall bloqueando el puerto

**Solución**:
```bash
# En el VPS
sudo ufw status
sudo ufw allow 8080/tcp
sudo ufw reload

# Verificar que el puerto esté abierto
sudo netstat -tlnp | grep 8080
```

### Error: 401 en Vercel pero curl desde tu PC funciona

**Causa**: Variables de entorno no configuradas en Vercel

**Solución**:
```bash
# Verificar en Vercel Settings → Environment Variables
# Debe existir: EVO_API_KEY con el valor correcto

# Después de agregar/modificar variables: REDEPLOY obligatorio
```

### Error: Header apikey no funciona, pero Bearer sí

**Solución**: Configurar `EVO_BEARER` en lugar de `EVO_API_KEY`:
```
EVO_BEARER = galle-super-key
```

### Error: Ningún método de autenticación funciona

**Causa**: Tu versión de Evolution puede usar otro método

**Solución**: Verificar documentación de tu versión:
```bash
# Ver versión de Evolution
docker inspect evolution-api | grep -i image

# Verificar documentación oficial
# https://github.com/EvolutionAPI/evolution-api
```

---

## ✅ CHECKLIST COMPLETO

### VPS:
- [ ] Evolution API corriendo: `docker ps | grep evolution`
- [ ] Variable API_KEY configurada: `docker exec evolution-api printenv | grep API_KEY`
- [ ] Logs sin errores: `docker logs evolution-api --tail 50`
- [ ] Health check local funciona: `curl -i http://localhost:8080/health -H "apikey: galle-super-key"` → 200
- [ ] Puerto abierto: `sudo ufw status` muestra 8080 ALLOW

### Desde tu PC:
- [ ] Health check funciona: `curl -i http://31.220.58.83:8080/health -H "apikey: galle-super-key"` → 200
- [ ] Start session funciona: `curl -i -X POST http://31.220.58.83:8080/sessions/start -H "apikey: galle-super-key" -H "Content-Type: application/json" -d '{"sessionName":"default"}'` → 200/409

### Vercel:
- [ ] Variable `EVO_BASE_URL` configurada
- [ ] Variable `EVO_API_KEY` configurada (misma que en VPS)
- [ ] (Opcional) Variable `EVO_BEARER` configurada si aplica
- [ ] Redeploy completado sin errores de build
- [ ] Logs muestran "API Key: Configurada ✅"

### Dashboard:
- [ ] `/configuracion` carga sin errores
- [ ] Al ingresar número y hacer click aparece spinner
- [ ] NO hay error 401 en consola (F12)
- [ ] QR aparece en 2-5 segundos
- [ ] Puedes escanear el QR con WhatsApp

---

## 📊 TABLA DE DIAGNÓSTICO

| Síntoma | Causa Probable | Solución Rápida |
|---------|----------------|-----------------|
| 401 en localhost VPS | API_KEY no configurada | `docker run ... -e API_KEY=clave` |
| 401 desde PC pero OK en VPS | Firewall | `sudo ufw allow 8080/tcp` |
| 401 en Vercel | EVO_API_KEY no en Vercel | Agregar variable + redeploy |
| Connection refused | Evolution no corriendo | `docker ps` y levantar si falta |
| 401 con apikey pero OK con Bearer | Evolution usa Bearer | Configurar `EVO_BEARER` |
| QR no aparece después de fix 401 | Error diferente (404, 500) | Ver logs de Vercel + consola |

---

## 🚀 COMANDO COMPLETO PARA VPS (COPIAR Y PEGAR)

```bash
# ===================================================
# EJECUTAR EN EL VPS - SETUP COMPLETO
# ===================================================

ssh root@31.220.58.83

# Limpiar contenedores anteriores
docker rm -f evolution-api waha

# Levantar Evolution API con autenticación
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=galle-super-key \
  -e AUTHENTICATION=true \
  atendai/evolution-api:latest

# Abrir firewall
sudo ufw allow 8080/tcp

# Esperar 10 segundos
sleep 10

# Verificar logs
docker logs evolution-api --tail 30

# Probar localmente
echo "Probando sin auth (debe dar 401):"
curl -i http://localhost:8080/health

echo -e "\nProbando con auth (debe dar 200):"
curl -i http://localhost:8080/health -H "apikey: galle-super-key"

echo -e "\nProbando start session:"
curl -i -X POST http://localhost:8080/sessions/start \
  -H "Content-Type: application/json" \
  -H "apikey: galle-super-key" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

---

## 🎯 RESULTADO FINAL ESPERADO

```
✅ Evolution API: Corriendo con API_KEY=galle-super-key
✅ VPS: curl con apikey responde 200
✅ PC: curl con apikey responde 200
✅ Vercel: EVO_API_KEY configurada + redeploy
✅ Dashboard: QR aparece sin error 401
✅ WhatsApp: Se puede conectar escaneando el QR
```

**🎉 Si todos los checks pasan, el error 401 está completamente resuelto!**

