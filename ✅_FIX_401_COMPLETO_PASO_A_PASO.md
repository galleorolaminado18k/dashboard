# ✅ FIX COMPLETO PARA ERROR 401 - EJECUTAR PASO A PASO

## 🎯 PROBLEMA

Error **401 Unauthorized** al hacer POST a `/api/whatsapp/wpp/start`

**Causa**: WAHA no recibe el header `X-Api-Key` correctamente o la API Key no coincide.

---

## 📋 SOLUCIÓN EN 4 PASOS

### ✅ PASO 1: Obtener WAHA_API_KEY del VPS

Ejecutar en el VPS:

```bash
grep WAHA_API_KEY /opt/baileys/.env
```

**Copiar el valor completo** (ejemplo: `c951554f59644aa3a1b3af3ad1c0a37c`)

---

### ✅ PASO 2: Configurar Variables en Vercel

1. Ir a: https://vercel.com/galleorolaminado18ks-projects/dashboard/settings/environment-variables

2. **Eliminar** variables antiguas (si existen):
   - ❌ `BAILEYS_BASE_URL`
   - ❌ `BAILEYS_API_KEY`

3. **Agregar/Actualizar** estas variables:

   **Variable 1:**
   ```
   Name:  WAHA_BASE_URL
   Value: https://wpp.galle18k.com
   ```

   **Variable 2:**
   ```
   Name:  WAHA_API_KEY
   Value: (el valor del Paso 1)
   ```

4. Guardar en **"All Environments"**

5. Click en **"Redeploy"**

---

### ✅ PASO 3: Actualizar Código (YA HECHO)

✅ Ya actualicé el código con:
- `export const runtime = 'nodejs'` - Fuerza Node.js en lugar de Edge
- `export const dynamic = 'force-dynamic'` - Sin cache
- Headers con `X-Api-Key` case-sensitive exacto
- Validación de variables de entorno
- Reintentos automáticos para obtener QR
- Endpoint GET para debug

**Archivo creado**: `app/api/whatsapp/wpp/start/route.ts`

---

### ✅ PASO 4: Configurar Caddy en VPS

Ejecutar en el VPS:

```bash
# 1. Actualizar Caddyfile
cat > /opt/baileys/Caddyfile << 'EOF'
wpp.galle18k.com {
  reverse_proxy waha-api:3000 {
    header_up X-Api-Key {>X-Api-Key}
    header_up Host {upstream_hostport}
  }
  encode gzip zstd
}
EOF

# 2. Reiniciar Caddy
cd /opt/baileys
docker-compose restart caddy

# 3. Verificar logs
docker logs caddy --tail 20
```

---

## 🧪 PRUEBAS DE VERIFICACIÓN

### Prueba 1: Verificar configuración de Vercel (Debug)

Después del redeploy, ir a:
```
https://tu-dashboard.vercel.app/api/whatsapp/wpp/start
```

Método: **GET**

Debe responder:
```json
{
  "hasKey": true,
  "hasBase": true,
  "base": "https://wpp.galle18k.com",
  "keyLength": 32
}
```

Si `hasKey: false` → La variable no está configurada en Vercel

---

### Prueba 2: Test directo a WAHA desde VPS

Ejecutar en el VPS:

```bash
curl -o test401.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/test-waha-401.sh && chmod +x test401.sh && ./test401.sh
```

**Resultado esperado:**
- Test 1 (Start): HTTP 200, 201 o 409 ✅
- Test 2 (QR): HTTP 200 + JSON con qrcode ✅

**Si da 401:**
- El header `X-Api-Key` no llega a WAHA
- Revisar configuración de Caddy (Paso 4)

---

### Prueba 3: Test desde el Dashboard

1. Ir a la página de WhatsApp en tu dashboard
2. Click en "Conectar WhatsApp"
3. Debe aparecer el código QR

**Si no funciona:**
- Abrir DevTools (F12) → Console
- Ver errores en rojo
- Si dice `WAHA_CONFIG_MISSING` → Revisar Paso 2
- Si dice `WAHA_START_401` → Revisar Paso 4

---

## 📊 CHECKLIST COMPLETO

- [ ] **Paso 1**: Obtener `WAHA_API_KEY` del VPS
- [ ] **Paso 2**: Agregar variables en Vercel
- [ ] **Paso 2**: Eliminar variables antiguas BAILEYS
- [ ] **Paso 2**: Guardar en "All Environments"
- [ ] **Paso 2**: Redeploy en Vercel
- [ ] **Paso 3**: ✅ Código ya actualizado y subido a GitHub
- [ ] **Paso 4**: Actualizar Caddyfile en VPS
- [ ] **Paso 4**: Reiniciar Caddy
- [ ] **Prueba 1**: Verificar debug endpoint (hasKey: true)
- [ ] **Prueba 2**: Test directo a WAHA (200 OK)
- [ ] **Prueba 3**: Test desde dashboard (QR aparece)

---

## 🔧 TROUBLESHOOTING

### Error: "hasKey: false" en debug endpoint
**Causa**: Variable `WAHA_API_KEY` no configurada en Vercel
**Solución**: Repetir Paso 2

### Error: 401 en pruebas directas a WAHA
**Causa**: Caddy no reenvía el header `X-Api-Key`
**Solución**: Repetir Paso 4

### Error: "WAHA_CONFIG_MISSING" en dashboard
**Causa**: Variables no están en el entorno correcto
**Solución**: Asegurar que están en "All Environments" y redeploy

### Error: QR no aparece después de varios segundos
**Causa**: WAHA tarda en generar el QR
**Solución**: Ya implementado con reintentos automáticos (3 intentos)

---

## 📁 ARCHIVOS CREADOS

1. ✅ `app/api/whatsapp/wpp/start/route.ts` - API Route corregida
2. ✅ `test-waha-401.sh` - Script de pruebas VPS
3. ✅ `⚡_PASO_1_OBTENER_KEY_VPS.md` - Guía Paso 1
4. ✅ `⚡_PASO_2_CONFIGURAR_VERCEL.md` - Guía Paso 2
5. ✅ `⚡_PASO_4_CONFIGURAR_CADDY.md` - Guía Paso 4
6. ✅ Este documento resumen

---

## 🚀 CAMBIOS YA SUBIDOS A GITHUB

✅ Commit: `fix: Corregir error 401 con runtime nodejs y headers X-Api-Key correctos`

Todo el código está en la rama `feature/meta-ads-integration-v2`

---

## 📞 SI SIGUES CON PROBLEMAS

Compartir:
1. Respuesta de GET `/api/whatsapp/wpp/start` (debug)
2. Resultado del script `test-waha-401.sh` en VPS
3. Logs de Vercel (Functions)
4. Screenshot del error en el dashboard

---

**RESUMEN**: Solo necesitas ejecutar los Pasos 1, 2 y 4. El Paso 3 (código) ya está hecho y en GitHub.

**Tiempo estimado**: 5-7 minutos

