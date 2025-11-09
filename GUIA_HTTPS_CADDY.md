# 🔐 Guía: Configurar HTTPS con Caddy para Evolution API

## 📋 Requisitos Previos

- ✅ Evolution API funcionando en VPS (31.220.58.83)
- ⚠️ Dominio propio o subdominio (ej: `whats.miempresa.com`)
- ⚠️ Acceso a configuración DNS de tu dominio

---

## 🎯 Paso 1: Configurar DNS

### Opción A: Si tienes dominio completo

En el panel de tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.):

```
Tipo: A
Nombre: whats
Valor: 31.220.58.83
TTL: 3600
```

**Resultado:** `whats.tudominio.com` → `31.220.58.83`

### Opción B: Si usas Cloudflare

1. Ve a tu dominio en Cloudflare
2. DNS → Add record
3. Configuración:
   ```
   Type: A
   Name: whats
   IPv4 address: 31.220.58.83
   Proxy status: DNS only (nube gris) ← IMPORTANTE
   TTL: Auto
   ```
4. Save

### Verificar DNS (espera 5-10 minutos)

```bash
# En tu PC local
nslookup whats.tudominio.com

# O
ping whats.tudominio.com

# Debe responder con: 31.220.58.83
```

---

## 🔧 Paso 2: Configurar Caddyfile

Edita el archivo `Caddyfile` local:

```bash
# En tu proyecto dashboard
notepad Caddyfile
```

Reemplaza `whats.tudominio.com` con tu dominio real:

```caddyfile
whats.miempresa.com {
    reverse_proxy evolution-api:8080
    
    header {
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
    }
    
    log {
        output file /var/log/caddy/evolution.log
        level INFO
    }
    
    encode gzip
}
```

---

## 🐳 Paso 3: Abrir Puertos en VPS

```bash
ssh root@31.220.58.83

# Abrir puertos 80 (HTTP) y 443 (HTTPS)
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
ufw status

# Verificar
netstat -tulpn | grep -E '80|443'
```

---

## 📦 Paso 4: Copiar Archivos al VPS

Desde tu PC local:

```bash
# Copiar Caddyfile
scp Caddyfile root@31.220.58.83:/root/evolution/

# Copiar docker-compose con Caddy
scp docker-compose.evolution-caddy.yml root@31.220.58.83:/root/evolution/docker-compose-caddy.yml
```

---

## 🚀 Paso 5: Detener Configuración Actual (sin HTTPS)

```bash
ssh root@31.220.58.83

cd /root/evolution

# Detener servicios actuales
docker-compose down

# Verificar que todo esté detenido
docker ps
```

---

## 🔐 Paso 6: Iniciar con Caddy (HTTPS)

```bash
# En VPS (ya conectado por SSH)
cd /root/evolution

# Verificar archivos
ls -lah
# Debe mostrar:
# - docker-compose-caddy.yml
# - Caddyfile
# - evolution-data/

# Iniciar servicios con Caddy
docker-compose -f docker-compose-caddy.yml up -d

# Ver logs en tiempo real
docker-compose -f docker-compose-caddy.yml logs -f
```

**Busca en los logs:**
```
caddy    | {"level":"info","msg":"certificate obtained successfully"}
caddy    | {"level":"info","msg":"serving initial configuration"}
```

Presiona `Ctrl+C` para salir de los logs.

---

## ✅ Paso 7: Verificar HTTPS

### Desde tu PC:

```bash
# Health check con HTTPS
curl https://whats.tudominio.com/

# Debe responder:
# {"status":200,"message":"Welcome to the Evolution API, it is working!","version":"2.2.3"...}
```

### En navegador:

```
https://whats.tudominio.com/manager
```

Debes ver el **Manager UI** de Evolution API con candado verde 🔒

---

## ⚙️ Paso 8: Actualizar .env.local

En tu proyecto local:

```env
# .env.local
EVO_BASE_URL=https://whats.tudominio.com
```

---

## 🚀 Paso 9: Probar Dashboard Local

```bash
# En tu proyecto
npm run dev

# Abrir navegador
http://localhost:3000/configuracion
```

1. Pestaña: **CRM & WhatsApp**
2. Ingresa tu número
3. Click: **Conectar WhatsApp**
4. Debe aparecer QR real ✅

---

## ☁️ Paso 10: Configurar Vercel

### En Vercel Dashboard:

1. Ve a: https://vercel.com
2. Selecciona tu proyecto
3. Settings → Environment Variables
4. Edita `EVO_BASE_URL`:
   ```
   EVO_BASE_URL = https://whats.tudominio.com
   ```
5. Apply to: **Production**, **Preview**, **Development**
6. Save
7. **Redeploy** (Deployments → ... → Redeploy)

Espera 2-3 minutos que termine el deploy.

---

## ✅ Verificación Final

### 1. VPS - Contenedores corriendo
```bash
ssh root@31.220.58.83
docker ps

# Debe mostrar:
# caddy              (running) → 80, 443
# evolution-api      (running) → 8080
# evolution-postgres (running) → 5432
```

### 2. HTTPS funcionando
```bash
curl https://whats.tudominio.com/
# {"status":200,"message":"Welcome to the Evolution API..."}
```

### 3. Certificado SSL válido
```bash
# Ver certificado
openssl s_client -connect whats.tudominio.com:443 -servername whats.tudominio.com < /dev/null 2>/dev/null | grep -A 2 "Verify return code"

# Debe decir:
# Verify return code: 0 (ok)
```

### 4. Dashboard en producción
```
https://tu-dashboard.vercel.app/configuracion
```
- Conectar WhatsApp
- Escanear QR ✅

---

## 🐛 Troubleshooting

### Error: "certificate obtain failed"

**Causa:** DNS no resuelve correctamente o puertos cerrados.

**Solución:**
```bash
# Verificar DNS
nslookup whats.tudominio.com

# Verificar puertos
ssh root@31.220.58.83
ufw status
netstat -tulpn | grep -E '80|443'

# Reintentar
docker-compose -f docker-compose-caddy.yml restart caddy
docker logs caddy -f
```

### Error: "connection refused" desde Vercel

**Causa:** Firewall bloqueando puerto 443.

**Solución:**
```bash
ssh root@31.220.58.83
ufw allow 443/tcp
ufw reload
```

### Caddy no inicia

**Ver logs:**
```bash
docker logs caddy --tail 50
```

**Problemas comunes:**
- Caddyfile mal formateado → revisar sintaxis
- Puerto 80/443 en uso → `netstat -tulpn | grep -E '80|443'`
- Dominio no resuelve → verificar DNS con `nslookup`

---

## 🔄 Comandos Útiles

### Ver logs de Caddy
```bash
ssh root@31.220.58.83
docker logs caddy -f
```

### Reiniciar solo Caddy
```bash
docker-compose -f docker-compose-caddy.yml restart caddy
```

### Ver certificados instalados
```bash
docker exec caddy ls -lah /data/caddy/certificates/
```

### Forzar renovación de certificado
```bash
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## 📊 Resumen de URLs

| Entorno | URL |
|---------|-----|
| **VPS sin HTTPS** | http://31.220.58.83:8080 |
| **VPS con HTTPS** | https://whats.tudominio.com |
| **Manager UI** | https://whats.tudominio.com/manager |
| **Dashboard Local** | http://localhost:3000/configuracion |
| **Dashboard Vercel** | https://tu-dashboard.vercel.app/configuracion |

---

## 🎉 ¡Configuración HTTPS Completada!

Ahora tienes:
- ✅ Evolution API con HTTPS
- ✅ Certificado SSL automático (Let's Encrypt)
- ✅ Renovación automática cada 90 días
- ✅ Compatible con Vercel (HTTPS → HTTPS)
- ✅ Seguro y profesional 🔒

**Siguiente paso:** Conecta WhatsApp desde tu dashboard en producción! 📱✨

