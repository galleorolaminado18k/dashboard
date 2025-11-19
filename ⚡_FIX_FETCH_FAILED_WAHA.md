# ⚡ ERROR: fetch failed - WAHA no accesible

## 🔍 ERROR ACTUAL

```
Error: fetch failed
Error: WAHA_INTERNAL_ERROR
detail: "fetch failed"
```

---

## 🎯 CAUSA DEL PROBLEMA

El error **"fetch failed"** significa que Vercel **NO PUEDE CONECTAR** con tu servidor WAHA en `https://wpp.galle18k.com`.

**Posibles causas**:
1. ❌ WAHA no está corriendo en el VPS
2. ❌ El puerto 3000 no está accesible
3. ❌ Caddy no está reenviando correctamente
4. ❌ Firewall bloqueando conexiones
5. ❌ DNS no resuelve correctamente

---

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Verificar si WAHA está corriendo (VPS)

Ejecutar en el VPS:

```bash
docker ps
```

**Resultado esperado**:
Debes ver 2 contenedores corriendo:
- `waha-api` (puerto 3000)
- `caddy` (puertos 80 y 443)

**Si NO ves los contenedores** → Ir al PASO 2 (Ejecutar script de fix)

**Si ves los contenedores** → Ir al PASO 3 (Verificar conectividad)

---

### PASO 2: Ejecutar el script de fix completo (VPS)

Si WAHA no está corriendo o tiene problemas:

```bash
curl -o fix-docker.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/fix-docker-compose-completo.sh && chmod +x fix-docker.sh && ./fix-docker.sh
```

**Qué hace**:
- Limpia Docker completamente
- Instala Docker Compose v2
- Recrea WAHA desde cero
- Verifica con 3 tests
- Te da las credenciales

**Tiempo**: ~5 minutos

**Resultado esperado**:
```
✅✅✅ WAHA FUNCIONA CORRECTAMENTE ✅✅✅
🧪 TEST 1: Health... ✅ 200
🧪 TEST 2: Version... ✅ 200
🧪 TEST 3: Start... ✅ 200
```

---

### PASO 3: Verificar conectividad local (VPS)

```bash
# Test 1: Verificar que WAHA responde localmente
curl -i http://127.0.0.1:3000/health

# Test 2: Verificar con la API Key
export $(grep -v '^#' /opt/baileys/.env | xargs)
curl -s -H "X-Api-Key: $WAHA_API_KEY" http://127.0.0.1:3000/api/server/version
```

**Resultado esperado**:
```
HTTP/1.1 200 OK
{"status":"ok"}
```

**Si falla** → WAHA no está corriendo correctamente → Ir al PASO 2

---

### PASO 4: Verificar Caddy (VPS)

```bash
# Ver logs de Caddy
docker logs caddy --tail 50

# Verificar que Caddy está escuchando en puertos 80 y 443
docker ps | grep caddy
```

**Verificar el Caddyfile**:

```bash
cat /opt/baileys/Caddyfile
```

**Debe contener**:
```
wpp.galle18k.com {
  reverse_proxy waha-api:3000 {
    header_up X-Api-Key {>X-Api-Key}
    header_up x-api-key {>x-api-key}
    header_up Authorization {>Authorization}
    header_up Host {upstream_hostport}
  }
  encode gzip zstd
}
```

**Si no está correcto** → Ejecutar:

```bash
curl -o config-caddy.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/configurar-caddy.sh && chmod +x config-caddy.sh && ./config-caddy.sh
```

---

### PASO 5: Verificar acceso HTTPS desde internet

Desde tu PC (o cualquier lugar):

```bash
# Test 1: Health check público
curl -i https://wpp.galle18k.com/health

# Test 2: Con API Key (reemplaza con tu key)
curl -s -H "X-Api-Key: tu-api-key-aqui" https://wpp.galle18k.com/api/server/version
```

**Resultado esperado**:
```
HTTP/2 200
{"status":"ok"}
```

**Si falla con error de SSL** → Problema de certificado Caddy

**Si falla con timeout** → Firewall bloqueando puerto 443

**Si falla con 502** → Caddy no puede conectar con WAHA

---

### PASO 6: Verificar DNS

```bash
# Desde tu PC
nslookup wpp.galle18k.com

# O
ping wpp.galle18k.com
```

**Resultado esperado**:
Debe resolver a la IP de tu VPS.

**Si no resuelve** → Problema de DNS en Cloudflare/proveedor

---

### PASO 7: Verificar firewall (VPS)

```bash
# Ver reglas de firewall
sudo ufw status

# Si está activo, asegurar que permite puertos 80 y 443
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## 🔧 SOLUCIÓN RÁPIDA (RECOMENDADA)

Si no quieres hacer diagnóstico manual, ejecuta esto directamente:

### Comando único en VPS:

```bash
curl -o fix-docker.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/fix-docker-compose-completo.sh && chmod +x fix-docker.sh && ./fix-docker.sh
```

Este script:
1. ✅ Limpia y recrea WAHA
2. ✅ Verifica que funciona localmente
3. ✅ Te da las credenciales correctas
4. ✅ Toma ~5 minutos

**Después del script**, si los 3 tests pasan (200 OK), entonces:

### Verificar desde internet:

```bash
curl -i https://wpp.galle18k.com/health
```

- ✅ Si responde 200 → El problema era WAHA no corriendo
- ❌ Si sigue fallando → Problema de firewall o DNS

---

## 📊 DIAGNÓSTICO RÁPIDO

| Síntoma | Causa | Solución |
|---------|-------|----------|
| `docker ps` no muestra waha-api | WAHA no corriendo | Ejecutar script de fix |
| curl local funciona, HTTPS no | Caddy problema | Revisar logs de Caddy |
| curl local falla | WAHA no inició | Ver logs: `docker logs waha-api` |
| HTTPS timeout | Firewall | Abrir puertos 80/443 |
| DNS no resuelve | Configuración DNS | Verificar en Cloudflare |

---

## 🚨 CHECKLIST DE VERIFICACIÓN

Ejecutar esto en orden:

```bash
# 1. Ver contenedores
docker ps

# 2. Test local WAHA
curl http://127.0.0.1:3000/health

# 3. Ver logs WAHA
docker logs waha-api --tail 50

# 4. Ver logs Caddy
docker logs caddy --tail 50

# 5. Test HTTPS público
curl https://wpp.galle18k.com/health

# 6. DNS
nslookup wpp.galle18k.com
```

Si alguno falla, eso te dice dónde está el problema.

---

## ⚡ ACCIÓN INMEDIATA

**Ejecuta AHORA en el VPS**:

```bash
curl -o fix-docker.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/fix-docker-compose-completo.sh && chmod +x fix-docker.sh && ./fix-docker.sh
```

Espera a que termine (~5 minutos) y verifica que los 3 tests pasen.

Si pasan, el error "fetch failed" en tu dashboard desaparecerá automáticamente.

---

## 📞 SI SIGUE FALLANDO DESPUÉS DEL SCRIPT

Compartir:
1. Output completo del script
2. `docker ps`
3. `docker logs waha-api --tail 50`
4. `docker logs caddy --tail 50`
5. `curl https://wpp.galle18k.com/health` (desde tu PC)

---

**EL PROBLEMA ES QUE WAHA NO ESTÁ ACCESIBLE DESDE VERCEL** 🎯

La solución es ejecutar el script de fix en el VPS para asegurar que WAHA esté corriendo y accesible.

