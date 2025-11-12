# 🚨 SOLUCIÓN URGENTE - EVO_TIMEOUT

## ❌ ERROR ACTUAL

```
Error: EVO_TIMEOUT
Evolution API no respondió en 10 segundos
```

## ✅ SOLUCIÓN APLICADA

1. ✅ Timeout aumentado de 10s a 30s
2. ✅ Logs mejorados para debugging
3. ✅ Mejor manejo de errores

---

## 🚀 EJECUTAR AHORA EN EL VPS (COPIAR Y PEGAR)

```bash
# Conectar al VPS
ssh root@31.220.58.83

# Detener Evolution actual
docker stop evolution evolution-api 2>/dev/null || true
docker rm evolution evolution-api 2>/dev/null || true

# Levantar Evolution con configuración correcta
docker run -d --name evolution --restart unless-stopped \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e SERVER_PORT=8080 \
  -e SERVER_HOST=0.0.0.0 \
  -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e DATABASE_ENABLED=false \
  atendai/evolution-api:latest

# Abrir firewall
ufw allow 8080/tcp
ufw reload

# Esperar 20 segundos
echo "Esperando 20 segundos para que Evolution inicie..."
sleep 20

# Ver logs
docker logs evolution --tail 30

# Probar desde localhost
echo -e "\n===== PRUEBA 1: Localhost ====="
curl -i http://127.0.0.1:8080/health

# Probar desde IP pública
echo -e "\n===== PRUEBA 2: IP Pública ====="
curl -i http://31.220.58.83:8080/health

# Probar con API Key
echo -e "\n===== PRUEBA 3: Con API Key ====="
curl -i http://127.0.0.1:8080/health \
  -H "apikey: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
```

**TODAS las pruebas deben responder `200 OK`** ✅

---

## ⚙️ DESPUÉS DE EJECUTAR EN VPS

### 1. Subir cambios a GitHub:

Ya tengo los cambios listos, voy a subirlos ahora.

### 2. En Vercel - Verificar variables:

https://vercel.com/dashboard → Tu proyecto → Settings → Environment Variables

**Debe existir**:
```
EVO_BASE_URL = http://31.220.58.83:8080
EVO_API_KEY = 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

### 3. Redeploy:

Deployments → 3 puntos → **Redeploy**

---

## 🔍 VERIFICAR QUE FUNCIONA

1. Esperar 2-3 minutos después del redeploy
2. Ir a: `/configuracion`
3. Ingresar número
4. Click "Conectar WhatsApp"
5. Ver Function Logs en Vercel:

**Deberías ver**:
```
[EVOLUTION] 🔗 Llamando: http://31.220.58.83:8080/health
[EVOLUTION] ⏱️  Respuesta en 150ms - Status: 200
[EVOLUTION] ✅ Respuesta exitosa
[EVOLUTION] ✅ Health check OK
```

**NO deberías ver**:
```
❌ EVO_TIMEOUT
❌ EVO_UNREACHABLE
```

---

## 🎯 CAMBIOS APLICADOS

### En el código:
- ✅ Timeout aumentado: 10s → 30s
- ✅ Logs detallados con timestamps
- ✅ Mejor descripción de errores
- ✅ Mensajes claros de troubleshooting

### En VPS (debes ejecutar):
- ✅ Evolution con SERVER_HOST=0.0.0.0
- ✅ Puerto 8080 abierto en firewall
- ✅ API Key configurada
- ✅ DATABASE_ENABLED=false (más rápido)

---

**🚨 EJECUTA LOS COMANDOS EN EL VPS AHORA Y LUEGO VUELVE PARA REDEPLOY!**

