# ⚡ PLAN QUIRÚRGICO - FIX 401 DEFINITIVO

## 🎯 OBJETIVO

Resolver el error 401 Unauthorized de manera definitiva siguiendo un plan quirúrgico de 5 pasos.

---

## 📋 PASO 1: PRUEBA DIRECTA A WAHA (VPS)

### Ejecutar en el VPS:

```bash
curl -o test-p1.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/test-paso-1-directo.sh && chmod +x test-p1.sh && ./test-p1.sh
```

### Qué hace:
1. Carga `WAHA_API_KEY` del archivo `.env`
2. Prueba `POST /api/sessions/default/start` (debe dar 200/201/409)
3. Prueba `GET /api/default/auth/qr` (debe dar 200 + qrcode)

### Resultado esperado:
```
✅ Start Session: OK (Status 200/201/409)
✅ Get QR: OK (Status 200)
✅ QR Code presente en respuesta
```

### Si sale 401:
❌ La API Key NO es válida

**Solución**:
```bash
grep WAHA_API_KEY /opt/baileys/.env
```
Copiar ese valor EXACTO y usarlo en Vercel (Paso 2).

---

## 📋 PASO 2: ENDPOINT DE DIAGNÓSTICO (VERCEL)

### Ya creado:
✅ `app/api/diag/waha/route.ts`

### Después del redeploy:

Ir a: `https://tu-dashboard.vercel.app/api/diag/waha`

### Resultado esperado:
```json
{
  "env": {
    "HAS_KEY": true,
    "KEY_SAMPLE": "c95155…0a37",
    "KEY_LENGTH": 32,
    "RUNTIME": "nodejs"
  },
  "waha": {
    "status": 200,
    "body": { "version": "..." }
  },
  "interpretation": {
    "diagnosis": "✅ TODO CORRECTO - WAHA responde OK"
  }
}
```

### Si HAS_KEY: false:
❌ `WAHA_API_KEY` no está configurada en Vercel

**Solución**:
1. Ir a: https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables
2. Agregar/Actualizar:
   - Name: `WAHA_API_KEY`
   - Value: (el del VPS, Paso 1)
   - Environments: **All**
3. **Redeploy**

### Si waha.status: 401:
❌ La API Key en Vercel NO coincide con la del VPS

**Solución**: Revisar que sea EXACTAMENTE igual (mayúsculas/minúsculas, sin espacios).

---

## 📋 PASO 3: CONFIGURAR CADDY (VPS)

### Ejecutar en el VPS:

```bash
curl -o config-caddy.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/configurar-caddy.sh && chmod +x config-caddy.sh && ./config-caddy.sh
```

### Qué hace:
1. Respalda el Caddyfile actual
2. Crea nuevo Caddyfile con todos los headers:
   - `X-Api-Key`
   - `x-api-key`
   - `Authorization`
3. Reinicia Caddy
4. Muestra los logs

### Resultado esperado:
```
✅ Caddyfile actualizado
✅ Caddy reiniciado
✅ Logs muestran: "Caddy serving"
```

### Alternativa manual:

```bash
cd /opt/baileys

cat > Caddyfile << 'EOF'
wpp.galle18k.com {
  reverse_proxy waha-api:3000 {
    header_up X-Api-Key {>X-Api-Key}
    header_up x-api-key {>x-api-key}
    header_up Authorization {>Authorization}
    header_up Host {upstream_hostport}
  }
  encode gzip zstd
}
EOF

docker-compose restart caddy
docker logs caddy --tail 20
```

---

## 📋 PASO 4: ACTUALIZAR CÓDIGO (YA HECHO)

✅ Ya actualicé el código con:

1. **Función `H()`** que genera headers con 3 variantes:
   - `X-Api-Key` (mayúsculas)
   - `x-api-key` (minúsculas)
   - `Authorization: Api-Key ...` (fallback)

2. **Runtime forzado a nodejs**

3. **Todas las llamadas fetch usan `H()`**

### Archivos actualizados:
- ✅ `app/api/whatsapp/wpp/start/route.ts`
- ✅ `app/api/diag/waha/route.ts` (nuevo)

---

## 📋 PASO 5: VERIFICACIÓN COMPLETA

### 5.1 Verificar variables en Vercel (debug)

```
GET https://tu-dashboard.vercel.app/api/diag/waha
```

Debe mostrar:
- `HAS_KEY: true`
- `waha.status: 200`
- `diagnosis: "✅ TODO CORRECTO"`

### 5.2 Verificar WAHA directo (VPS)

```bash
./test-p1.sh
```

Debe mostrar:
- ✅ Start Session: OK
- ✅ Get QR: OK

### 5.3 Verificar desde dashboard

1. Ir a página de WhatsApp
2. Click "Conectar WhatsApp"
3. Debe aparecer QR

---

## 🔍 ERRORES TÍPICOS Y SOLUCIONES

### Error 1: 401 en pruebas directas (Paso 1)
**Causa**: API Key incorrecta
**Solución**:
```bash
grep WAHA_API_KEY /opt/baileys/.env
```
Usar ESE valor en Vercel.

### Error 2: HAS_KEY: false (Paso 2)
**Causa**: Variable no configurada en Vercel
**Solución**: Agregar en Vercel → Environment Variables → All Environments → Redeploy

### Error 3: waha.status: 401 (Paso 2)
**Causa**: API Key en Vercel ≠ API Key en VPS
**Solución**: Comparar ambas, deben ser EXACTAMENTE iguales

### Error 4: waha.status: 0 (Paso 2)
**Causa**: No puede conectar a WAHA
**Solución**: Verificar `WAHA_BASE_URL` y que WAHA esté corriendo (`docker ps`)

### Error 5: Llave se regenera al reiniciar contenedor
**Causa**: WAHA no persiste `.env`
**Solución**: Ya está configurado en `/opt/baileys/.env` con `env_file` en docker-compose

---

## ✅ CHECKLIST COMPLETO

- [ ] **Paso 1**: Ejecutar `test-paso-1-directo.sh` en VPS
- [ ] **Paso 1**: Copiar `WAHA_API_KEY` correcta
- [ ] **Paso 2**: Agregar `WAHA_API_KEY` en Vercel
- [ ] **Paso 2**: Guardar en "All Environments"
- [ ] **Paso 2**: Redeploy en Vercel
- [ ] **Paso 2**: Verificar `/api/diag/waha` (HAS_KEY: true, status: 200)
- [ ] **Paso 3**: Ejecutar `configurar-caddy.sh` en VPS
- [ ] **Paso 3**: Verificar logs de Caddy
- [ ] **Paso 4**: ✅ Código ya actualizado
- [ ] **Paso 5**: Test completo - QR debe aparecer en dashboard

---

## 📊 DIAGNÓSTICO RÁPIDO

| Síntoma | Causa | Paso a revisar |
|---------|-------|----------------|
| 401 en VPS directo | API Key incorrecta | Paso 1 |
| HAS_KEY: false | Var no en Vercel | Paso 2 |
| status: 401 en diag | Keys no coinciden | Paso 1 + 2 |
| status: 0 en diag | No conecta a WAHA | BASE_URL o Docker |
| 200 en diag, 401 en app | Caddy bloquea headers | Paso 3 |

---

## 🚀 ORDEN DE EJECUCIÓN

1. **VPS**: Ejecutar test-paso-1-directo.sh
2. **Copiar**: WAHA_API_KEY del resultado
3. **Vercel**: Agregar variable → Redeploy
4. **Browser**: Abrir /api/diag/waha
5. **VPS**: Ejecutar configurar-caddy.sh
6. **Browser**: Probar dashboard

**Tiempo total estimado: 10 minutos**

---

## 📞 SI SIGUE FALLANDO

Compartir:
1. Resultado de `test-paso-1-directo.sh`
2. JSON completo de `/api/diag/waha`
3. Logs: `docker logs waha-api --tail 50`
4. Logs: `docker logs caddy --tail 20`

