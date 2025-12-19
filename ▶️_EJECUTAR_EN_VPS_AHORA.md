# ⚡ SOLUCIÓN ERROR 503 - PASO A PASO

## 🔴 Error: No se puede conectar a WPPConnect (503)

Esto significa que el dominio llega, pero Caddy no puede hablar con WPPConnect o hay problema con SSL/Cloudflare.

---

## 📋 PASO 1: DIAGNÓSTICO AUTOMÁTICO

Ejecuta este script de diagnóstico:

```bash
cd /opt/wpp
curl -o diagnostico.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/diagnostico-503-wppconnect.sh
chmod +x diagnostico.sh
./diagnostico.sh
```

El script hará TODO el diagnóstico y te dirá exactamente qué está mal.

---

## 📋 PASO 2: DIAGNÓSTICO MANUAL (si prefieres hacerlo tú)

### 2.1 Verificar contenedores

```bash
cd /opt/wpp
docker ps
docker logs --tail 50 wppconnect
docker logs --tail 50 caddy
```

**Busca errores en los logs.**

### 2.2 Verificar que WPPConnect responda localmente

```bash
curl -I http://127.0.0.1:21465/api-docs
```

**Debe responder: `HTTP/1.1 200 OK`**

Si NO responde 200:
- ❌ WPPConnect no está funcionando
- Solución: Ver logs y reiniciar

Si responde 200:
- ✅ WPPConnect funciona
- ❌ Problema es Caddy o SSL

---

## 📋 PASO 3: PUBLICAR PUERTO (Para diagnóstico)

Si WPPConnect no responde localmente, publica el puerto:

```bash
cd /opt/wpp

# Backup
cp docker-compose.yml docker-compose.yml.backup

# Editar docker-compose.yml
nano docker-compose.yml
```

En la sección `wppconnect`, agrega antes de `environment`:

```yaml
    ports:
      - "21465:21465"
```

Guarda (Ctrl+O, Enter, Ctrl+X) y reinicia:

```bash
docker-compose down
docker-compose up -d
sleep 30
curl -I http://127.0.0.1:21465/api-docs
```

---

## 📋 PASO 4: VERIFICAR CLOUDFLARE SSL

Si WPPConnect funciona local pero HTTPS da 503:

### En Cloudflare:

1. Ve a **SSL/TLS** → **Overview**
2. Cambia a **Full** (no Flexible, no Full Strict)
3. Guarda

### Temporalmente, desactiva Proxy:

1. En **DNS**
2. Click en el registro `wpp`
3. Pon la nube en **GRIS** (DNS only)
4. Espera 2 minutos

### Verifica certificado SSL:

```bash
docker logs caddy -f
```

**Busca:** `Successfully obtained certificate for wpp.galle18k.com`

Cuando veas ese mensaje:

1. Vuelve a Cloudflare
2. Activa Proxy (nube NARANJA)
3. Espera 1 minuto

### Prueba HTTPS:

```bash
curl -I https://wpp.galle18k.com/api-docs
```

**Debe responder: `HTTP/2 200`**

---

## 📋 PASO 5: VERIFICAR CADDYFILE

```bash
cat /opt/wpp/Caddyfile
```

Debe contener:

```
wpp.galle18k.com {
  encode zstd gzip
  reverse_proxy wppconnect:21465
}
```

Si está mal, corrígelo:

```bash
cat > /opt/wpp/Caddyfile << 'EOF'
wpp.galle18k.com {
  encode zstd gzip
  reverse_proxy wppconnect:21465
}
EOF

docker restart caddy
```

---

## 📋 PASO 6: VERIFICAR CONEXIÓN ENTRE SERVICIOS

Verifica que ambos estén en la misma red:

```bash
docker network inspect opt_wpp_net
```

Debes ver `wppconnect` y `caddy` en la lista.

Si no están:

```bash
docker-compose down
docker-compose up -d
```

---

## 📋 PASO 7: PRUEBA FINAL

```bash
# Test local
curl -I http://127.0.0.1:21465/api-docs

# Test HTTPS
curl -I https://wpp.galle18k.com/api-docs

# Test API
curl -I -H "Authorization: Bearer galle-wpp-token-secure-123" https://wpp.galle18k.com/api/sessions
```

**Todos deben responder 200.**

---

## 📋 PASO 8: CONFIGURAR VERCEL

Una vez que HTTPS funcione:

1. Ve a Vercel → Settings → Environment Variables
2. Agrega:

```
WPP_BASE_URL = https://wpp.galle18k.com
WPP_TOKEN = galle-wpp-token-secure-123
WPP_WEBHOOK_SECRET = wpp-webhook-secret-galle
```

3. Deployments → Redeploy
4. Espera 2-3 minutos

---

## 📋 PASO 9: PROBAR EN DASHBOARD

1. Ve a `/configuracion`
2. Limpia caché (F12 → Empty Cache and Hard Reload)
3. Ingresa: `3012439596`
4. Click: "Conectar WhatsApp"
5. ✅ **QR debe aparecer**

---

## 🔍 COMANDOS DE DIAGNÓSTICO RÁPIDO

```bash
# Ver estado de contenedores
docker ps

# Ver logs en tiempo real
docker logs wppconnect -f
docker logs caddy -f

# Test local
curl http://127.0.0.1:21465/api-docs

# Test HTTPS
curl https://wpp.galle18k.com/api-docs

# Reiniciar servicios
docker-compose restart

# Reiniciar todo
docker-compose down && docker-compose up -d
```

---

## 🎯 CHECKLIST DE VERIFICACIÓN

- [ ] Contenedores corriendo (`docker ps`)
- [ ] WPPConnect responde local (curl 127.0.0.1:21465)
- [ ] Puerto 21465 publicado en compose
- [ ] Cloudflare SSL en "Full"
- [ ] Certificado SSL obtenido (logs de Caddy)
- [ ] HTTPS funciona (curl wpp.galle18k.com)
- [ ] Variables en Vercel configuradas
- [ ] Redeploy en Vercel completado
- [ ] QR aparece en /configuracion

---

## ⚠️ PROBLEMAS COMUNES

### WPPConnect se reinicia constantemente

**Causa:** Falta memoria compartida

**Solución:**
```bash
# Verifica que docker-compose.yml tenga:
shm_size: "1gb"

# Reinicia
docker-compose restart wppconnect
```

### Caddy no obtiene certificado SSL

**Causa:** Puerto 80/443 bloqueado o Cloudflare en Flexible

**Solución:**
1. Verifica firewall: `ufw allow 80/tcp && ufw allow 443/tcp`
2. Cambia Cloudflare a "Full"
3. Temporalmente: nube gris (DNS only)

### HTTPS da 502/503 pero local funciona

**Causa:** Caddy no puede conectar a WPPConnect

**Solución:**
```bash
# Verificar red
docker network ls
docker network inspect opt_wpp_net

# Ambos contenedores deben estar ahí
```

---

**Ejecuta el script de diagnóstico del PASO 1 y avísame qué resultado te da.** 🚀



