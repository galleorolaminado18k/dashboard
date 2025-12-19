# 🚀 MIGRACIÓN A WPPCONNECT - GUÍA COMPLETA

## ✅ PASO 1: PREPARAR VPS (10 minutos)

### 1.1 Configurar dominio

**Antes de empezar, configura tu dominio:**

1. Ve a tu DNS provider (Cloudflare recomendado)
2. Crea un A record:
   ```
   Tipo: A
   Nombre: wpp
   Contenido: 31.220.58.83
   Proxy: ✅ ON (naranja en Cloudflare)
   TTL: Auto
   ```
3. Espera 2-5 minutos a que propague

### 1.2 Configurar SSL en Cloudflare (si usas Cloudflare)

1. SSL/TLS → Overview
2. Modo: **Full** (no Full Strict)
3. Edge Certificates → Always Use HTTPS: **ON**

### 1.3 Ejecutar instalación en VPS

**Conéctate al VPS:**
```bash
ssh root@31.220.58.83
```

**Descarga el script de instalación:**
```bash
curl -o install-wpp.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/vps-wppconnect/install-wppconnect.sh
chmod +x install-wpp.sh
```

**Ejecuta:**
```bash
./install-wpp.sh
```

El script:
- ✅ Instala Docker y Docker Compose
- ✅ Limpia Evolution/WAHA anteriores
- ✅ Crea docker-compose.yml
- ✅ Crea .env con tokens
- ✅ Crea Caddyfile
- ✅ Levanta WPPConnect + Caddy
- ✅ Verifica que funcione

**Debes ver al final:**
```
✅ INSTALACIÓN COMPLETADA
```

### 1.4 Configurar dominio en Caddyfile

**Edita el Caddyfile:**
```bash
cd /opt/wpp
nano Caddyfile
```

**Reemplaza `tudominio.com` con tu dominio real:**
```
wpp.miempresa.com {
  encode zstd gzip
  reverse_proxy wppconnect:21465
  ...
}
```

**Guarda:** Ctrl+O, Enter, Ctrl+X

**Reinicia Caddy:**
```bash
docker restart caddy
```

### 1.5 Verificar instalación

**Test local:**
```bash
curl -s http://localhost:21465/api-docs | head -n 5
```

**Test HTTPS:**
```bash
curl -s https://wpp.tudominio.com/api-docs | head -n 5
```

**Ambos deben responder con HTML de Swagger.**

---

## ✅ PASO 2: CONFIGURAR VERCEL (3 minutos)

### 2.1 Agregar variables de entorno

1. Ve a https://vercel.com
2. Tu proyecto → **Settings** → **Environment Variables**
3. Agrega estas 3 variables:

```
WPP_BASE_URL = https://wpp.tudominio.com
WPP_TOKEN = galle-wpp-token-secure-123
WPP_WEBHOOK_SECRET = wpp-webhook-secret-galle
```

**Para cada una:**
- Name: (nombre de la variable)
- Value: (valor correspondiente)
- Environments: ✅ Production, ✅ Preview, ✅ Development
- Click **Save**

### 2.2 Eliminar variables antiguas (opcional)

Si existen, puedes eliminarlas:
- `EVO_BASE_URL`
- `EVO_API_KEY`
- `WAHA_BASE_URL`
- `WAHA_API_KEY`

### 2.3 Verificar variables

Deberías ver:
```
✅ WPP_BASE_URL = https://wpp.tudominio.com
✅ WPP_TOKEN = galle-wpp-token-secure-123
✅ WPP_WEBHOOK_SECRET = wpp-webhook-secret-galle
```

---

## ✅ PASO 3: HACER PUSH Y REDEPLOY (5 minutos)

### 3.1 Verificar cambios locales

Los cambios ya están en tu repositorio local. Voy a hacer commit y push.

### 3.2 Hacer Redeploy en Vercel

**Después del push automático:**

1. Ve a Vercel → **Deployments**
2. Espera a que aparezca el nuevo deployment (1-2 minutos)
3. O haz redeploy manual:
   - Click en el último deployment
   - **...** → **Redeploy**
   - Espera 2-3 minutos

---

## ✅ PASO 4: PROBAR (5 minutos)

### 4.1 Limpiar caché del navegador

**Importante para evitar ver la versión antigua:**

1. Abre DevTools (F12)
2. Click derecho en botón refresh del navegador
3. **"Empty Cache and Hard Reload"**

O:
- Ctrl + Shift + Delete
- Selecciona "Cached images and files"
- Clear data

### 4.2 Probar conexión WhatsApp

1. Ve a `/configuracion` en tu dashboard
2. Refresca la página (F5)
3. Ingresa número: `3012439596`
4. Click: **"Conectar WhatsApp"**

**Resultado esperado:**
- ✅ Spinner "Generando código QR..."
- ✅ QR aparece en 2-5 segundos
- ✅ Puedes escanearlo con WhatsApp
- ✅ Después de escanear, se conecta automáticamente

### 4.3 Probar envío de mensaje (opcional)

**Desde terminal en tu PC:**

```bash
curl -X POST https://wpp.tudominio.com/api/galle-3012439596/send-message \
  -H "Authorization: Bearer galle-wpp-token-secure-123" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "573012439596",
    "message": "Hola desde WPPConnect ✅"
  }'
```

Debes recibir el mensaje en WhatsApp.

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: WPP_UNREACHABLE

**Síntomas:** No se puede conectar a WPPConnect

**Soluciones:**
1. Verifica que los contenedores estén corriendo:
   ```bash
   docker ps
   ```
   Debes ver: `wppconnect` y `caddy`

2. Verifica logs:
   ```bash
   docker logs wppconnect --tail 50
   docker logs caddy --tail 50
   ```

3. Test local en VPS:
   ```bash
   curl http://localhost:21465/api-docs
   ```

### Error: WPP_HTTP_401 / WPP_HTTP_403

**Síntomas:** Error de autenticación

**Soluciones:**
1. Verifica que el token en Vercel sea correcto
2. En VPS:
   ```bash
   cd /opt/wpp
   cat .env | grep WPP_TOKEN
   ```
3. Debe coincidir con `WPP_TOKEN` en Vercel

### Error: WPP_TIMEOUT

**Síntomas:** Timeout al conectar

**Soluciones:**
1. Aumenta memoria de Puppeteer (ya configurado en docker-compose)
2. Verifica recursos del VPS:
   ```bash
   free -h
   df -h
   ```
3. Si es necesario, reinicia WPPConnect:
   ```bash
   docker restart wppconnect
   ```

### QR no aparece

**Soluciones:**
1. Verifica que el número sea válido (solo dígitos, sin +57)
2. Espera 5-10 segundos después de click
3. Verifica logs en Vercel:
   - Vercel → Deployments → Último → View Function Logs
   - Busca `[WPP]`
4. Verifica logs en VPS:
   ```bash
   docker logs wppconnect -f
   ```

### Error 522 en Cloudflare

**Soluciones:**
1. Verifica que Caddy esté corriendo:
   ```bash
   docker ps | grep caddy
   ```
2. Verifica que el puerto 80 y 443 estén abiertos:
   ```bash
   netstat -tlnp | grep -E ':(80|443)'
   ```
3. En Cloudflare:
   - SSL/TLS → **Full** (no Full Strict)
   - Crea regla: Cache → Bypass para `wpp.*`

### Sesión se desconecta

**Soluciones:**
1. Configura `AUTO_START=true` en docker-compose si quieres que se inicie automáticamente
2. Implementa keepalive en el frontend (polling cada 30 segundos)

---

## 📊 CHECKLIST COMPLETO

### VPS
- [ ] Dominio configurado (A record)
- [ ] Cloudflare Proxy ON (si usas Cloudflare)
- [ ] SSL/TLS en Full
- [ ] Script de instalación ejecutado
- [ ] Caddyfile editado con dominio real
- [ ] Caddy reiniciado
- [ ] Test local funciona
- [ ] Test HTTPS funciona

### Vercel
- [ ] Variables agregadas (WPP_BASE_URL, WPP_TOKEN, WPP_WEBHOOK_SECRET)
- [ ] Variables antiguas eliminadas (opcional)
- [ ] Push a GitHub completado
- [ ] Redeploy completado
- [ ] Deployment en estado "Ready"

### Pruebas
- [ ] Caché del navegador limpiado
- [ ] QR aparece en /configuracion
- [ ] QR se puede escanear
- [ ] Sesión se conecta correctamente
- [ ] (Opcional) Mensaje de prueba enviado

---

## 🎯 RESUMEN

**Tiempo total estimado:** 20-25 minutos

**Lo que hicimos:**
1. ✅ Instalamos WPPConnect + Caddy en VPS con HTTPS
2. ✅ Configuramos variables en Vercel
3. ✅ Migramos código de Evolution → WPPConnect
4. ✅ Probamos conexión y envío de mensajes

**Ventajas de WPPConnect:**
- ✅ Más estable que Evolution
- ✅ Mejor documentación
- ✅ API más simple
- ✅ Menos errores 400/403/502
- ✅ HTTPS nativo con Caddy
- ✅ Puppeteer optimizado

---

## 📚 REFERENCIAS

- WPPConnect GitHub: https://github.com/wppconnect-team/wppconnect-server
- Documentación: https://wppconnect.io/
- Swagger (después de instalar): https://wpp.tudominio.com/api-docs

---

**¿Listo para empezar? Ejecuta el PASO 1 en tu VPS.** 🚀

