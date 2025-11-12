# ⚡ ACCIÓN INMEDIATA REQUERIDA

## 🎯 CAMBIOS APLICADOS Y SUBIDOS A GITHUB

✅ **Commit**: `1af7cd6`  
✅ **Mensaje**: "fix: URGENTE - Aumentar timeout a 30s y mejorar logs - Fix EVO_TIMEOUT"  
✅ **Estado**: Pusheado a GitHub exitosamente

### Cambios en el código:
- ✅ Timeout aumentado: 10s → 30s
- ✅ Logs detallados con tiempo de respuesta
- ✅ Mejor manejo de errores
- ✅ Mensajes claros de troubleshooting

---

## 🚀 PASO 1: EJECUTAR EN EL VPS (AHORA)

**Conecta al VPS y ejecuta estos comandos** (copiar y pegar todo junto):

```bash
ssh root@31.220.58.83

docker stop evolution evolution-api 2>/dev/null || true
docker rm evolution evolution-api 2>/dev/null || true

docker run -d --name evolution --restart unless-stopped \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e SERVER_PORT=8080 \
  -e SERVER_HOST=0.0.0.0 \
  -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e DATABASE_ENABLED=false \
  atendai/evolution-api:latest

ufw allow 8080/tcp
ufw reload

sleep 20
docker logs evolution --tail 30

echo "===== PRUEBA 1: Localhost ====="
curl -i http://127.0.0.1:8080/health

echo "===== PRUEBA 2: IP Pública ====="
curl -i http://31.220.58.83:8080/health
```

**Resultado esperado**: Ambas pruebas deben responder `200 OK` ✅

---

## ⚙️ PASO 2: CONFIGURAR EN VERCEL

### A) Verificar variables de entorno:

https://vercel.com/dashboard → Tu proyecto → **Settings** → **Environment Variables**

**Debe existir**:
```
EVO_BASE_URL = http://31.220.58.83:8080
EVO_API_KEY = 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

**Si NO existen**:
1. Click "Add New"
2. Agregar ambas variables
3. Click "Save"

### B) Redeploy (OBLIGATORIO):

1. **Deployments** (pestaña)
2. Último deployment → **3 puntos** (`...`)
3. Click **"Redeploy"**
4. Esperar 2-3 minutos

---

## 🔍 PASO 3: VERIFICAR QUE FUNCIONA

### En Vercel Function Logs:

1. Deployments → Click en el último deployment
2. **Function Logs** (pestaña)
3. Ir a `/configuracion` en tu app
4. Click "Conectar WhatsApp"

**Deberías ver**:
```
[EVOLUTION] 🔗 Llamando: http://31.220.58.83:8080/health
[EVOLUTION] 📝 Método: GET
[EVOLUTION] 🔑 API Key presente: Sí
[EVOLUTION] ⏱️  Respuesta en 150ms - Status: 200
[EVOLUTION] ✅ Respuesta exitosa
[EVOLUTION] ✅ Health check OK
[EVOLUTION] ✅ Sesión iniciada: OK
[EVOLUTION] ✅ QR obtenido exitosamente!
```

### En el Dashboard:

1. Ve a: `https://tu-app.vercel.app/configuracion`
2. Ingresar número: `3001234567`
3. Click **"Conectar WhatsApp"**
4. Resultado esperado:
   - ✅ QR aparece en 2-5 segundos
   - ✅ NO hay error `EVO_TIMEOUT`
   - ✅ NO hay error `502 Bad Gateway`

---

## ⏰ TIEMPO ESTIMADO TOTAL

- VPS: 2 minutos
- Vercel Redeploy: 2-3 minutos
- **Total**: 5 minutos

---

## 🎯 CHECKLIST

- [ ] Ejecutaste comandos en VPS
- [ ] `curl http://127.0.0.1:8080/health` responde 200 OK
- [ ] `curl http://31.220.58.83:8080/health` responde 200 OK
- [ ] Variables en Vercel configuradas
- [ ] Redeploy ejecutado en Vercel
- [ ] Deployment muestra "Ready" ✅
- [ ] Function Logs muestran logs con ⏱️ y tiempos de respuesta
- [ ] Dashboard muestra QR sin errores

---

## 📊 QUÉ CAMBIÓ

### Antes (10s timeout):
```
❌ EVO_TIMEOUT después de 10 segundos
❌ Evolution no tenía tiempo suficiente
```

### Ahora (30s timeout):
```
✅ 30 segundos de espera
✅ Logs detallados con tiempos
✅ Mejor diagnóstico de problemas
✅ Mensajes claros de error
```

---

**🚨 EJECUTA LOS COMANDOS EN EL VPS AHORA!**

**Una vez que las pruebas curl respondan 200 OK, haz REDEPLOY en Vercel.**

**Vercel detectará el nuevo commit automáticamente, pero si no, fuerza el redeploy manualmente.**

