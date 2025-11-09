# ⚡ CONFIGURAR HTTPS - Pasos Rápidos

## 🎯 Requisito: Tener un dominio

**¿No tienes dominio?** Puedes usar el HTTP actual: `http://31.220.58.83:8080`

**¿Tienes dominio?** Sigue estos pasos:

---

## 📝 PASO 1: Configurar DNS (5 minutos)

En tu proveedor de dominio (GoDaddy, Cloudflare, etc.):

```
Tipo: A
Nombre: whats
Valor: 31.220.58.83
TTL: 3600
```

**Verificar después de 10 minutos:**
```bash
nslookup whats.tudominio.com
# Debe responder: 31.220.58.83
```

---

## 🔧 PASO 2: Editar Caddyfile Local

Abre el archivo y reemplaza el dominio:

```bash
notepad Caddyfile
```

Cambia:
```
whats.tudominio.com
```
Por:
```
whats.TUDOMINIO-REAL.com
```

Guarda y cierra.

---

## 🚀 PASO 3: Copiar Archivos al VPS

```bash
scp Caddyfile root@31.220.58.83:/root/evolution/
scp docker-compose.evolution-caddy.yml root@31.220.58.83:/root/evolution/docker-compose-caddy.yml
```

---

## 🐳 PASO 4: Activar HTTPS en VPS

```bash
ssh root@31.220.58.83

# Abrir puertos
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# Cambiar a carpeta
cd /root/evolution

# Detener configuración actual
docker-compose down

# Iniciar con Caddy (HTTPS)
docker-compose -f docker-compose-caddy.yml up -d

# Ver logs (espera el certificado SSL)
docker-compose -f docker-compose-caddy.yml logs -f caddy
```

**Busca en logs:**
```
"certificate obtained successfully"
```

Presiona `Ctrl+C` para salir.

---

## ✅ PASO 5: Verificar HTTPS

```bash
curl https://whats.tudominio.com/
```

Debe responder:
```json
{"status":200,"message":"Welcome to the Evolution API, it is working!"}
```

---

## ⚙️ PASO 6: Actualizar .env.local

```env
EVO_BASE_URL=https://whats.tudominio.com
```

---

## ☁️ PASO 7: Configurar Vercel

1. https://vercel.com → Tu proyecto
2. Settings → Environment Variables
3. Editar `EVO_BASE_URL`:
   ```
   https://whats.tudominio.com
   ```
4. Save
5. Redeploy

---

## 🎉 ¡LISTO!

- ✅ HTTPS funcionando
- ✅ Certificado SSL automático
- ✅ Dashboard en Vercel conectado

**Pruébalo:**
```
https://tu-dashboard.vercel.app/configuracion
```

---

## 🐛 Problemas

### "Certificate obtain failed"
```bash
# Verificar DNS
nslookup whats.tudominio.com

# Ver logs de Caddy
ssh root@31.220.58.83
docker logs caddy --tail 50
```

### "Connection refused"
```bash
# Verificar puertos
ssh root@31.220.58.83
ufw status
netstat -tulpn | grep -E '80|443'
```

---

## 📚 Guía Completa

Lee: `GUIA_HTTPS_CADDY.md` para más detalles.

---

## 🔙 Volver a HTTP (sin dominio)

Si no tienes dominio o quieres volver a HTTP:

```bash
ssh root@31.220.58.83
cd /root/evolution
docker-compose -f docker-compose-caddy.yml down
docker-compose up -d
```

Y en Vercel:
```
EVO_BASE_URL = http://31.220.58.83:8080
```

