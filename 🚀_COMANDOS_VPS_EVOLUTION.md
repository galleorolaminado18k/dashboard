# 🚀 COMANDOS VPS - EVOLUTION API CON HTTP/HTTPS

## 🎯 MÉTODO RECOMENDADO: Usar scripts automatizados

### Opción 1: Script completo (MÁS FÁCIL) ⭐

```bash
# 1. Conectar al VPS
ssh root@31.220.58.83

# 2. Descargar y ejecutar script
curl -o setup-evolution-vps.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/setup-evolution-vps.sh
chmod +x setup-evolution-vps.sh
bash setup-evolution-vps.sh
```

El script automáticamente:
- ✅ Detiene contenedores anteriores
- ✅ Crea docker-compose.yml con configuración correcta
- ✅ Levanta Evolution API
- ✅ Configura firewall
- ✅ Ejecuta pruebas de conectividad
- ✅ Te dice exactamente qué configurar en Vercel

---

## 🎯 OPCIÓN A: HTTP Simple (Manual - Paso a paso)

### 1. Levantar Evolution API:

```bash
# Conectar al VPS
ssh root@31.220.58.83

# Detener contenedores anteriores
docker stop evolution-api evolution 2>/dev/null || true
docker rm evolution-api evolution 2>/dev/null || true

# Levantar Evolution con configuración correcta
docker run -d --name evolution --restart unless-stopped \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e SERVER_PORT=8080 \
  -e SERVER_HOST=0.0.0.0 \
  -e AUTHENTICATION=true \
  -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e DATABASE_ENABLED=false \
  atendai/evolution-api:latest

# Abrir firewall
ufw allow 8080/tcp
ufw reload

# Verificar
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker logs evolution --tail 30
```

### 2. Probar desde el VPS (CRÍTICO):

```bash
# ✅ PRUEBA 1: Desde localhost (127.0.0.1)
curl -i http://127.0.0.1:8080/health

# ✅ PRUEBA 2: Desde IP pública (31.220.58.83)
curl -i http://31.220.58.83:8080/health

# ✅ PRUEBA 3: Con API Key
curl -i http://127.0.0.1:8080/health \
  -H "apikey: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"

# ✅ PRUEBA 4: Start session
curl -i -X POST http://127.0.0.1:8080/sessions/start \
  -H "Content-Type: application/json" \
  -H "apikey: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb" \
  -d '{"sessionName":"default","whatsappVersion":"v2"}'
```

**TODAS las pruebas DEBEN responder `200 OK` o `409 Conflict`** ✅

**Si PRUEBA 1 funciona pero PRUEBA 2 NO**:
- ❌ Problema de firewall o Security Groups
- 🔧 Solución: Usar HTTPS con Caddy (ver Opción B)

### 3. Probar desde tu PC (Windows):

```bash
# Desde tu PowerShell/CMD
curl.exe -i http://31.220.58.83:8080/health
```

**Debe responder `200 OK`** ✅

### 4. Configurar en Vercel (CRÍTICO - Sin esto no funciona):

**⚠️ IMPORTANTE**: Después de agregar las variables, DEBES hacer Redeploy

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. **Settings** → **Environment Variables**
4. Click **Add New**
5. Agregar:

```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_API_KEY
Value: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

6. Click **Save**
7. **Deployments** → Click en los 3 puntos del último deployment → **Redeploy**
8. Esperar 2-3 minutos

### 5. Verificar en logs de Vercel:

1. **Deployments** → Click en el último deployment
2. **Function Logs** (pestaña)
3. Buscar líneas como:

```
[EVOLUTION] 🚀 Iniciando sesión de WhatsApp...
[EVOLUTION] 🔗 Llamando: http://31.220.58.83:8080/health
[EVOLUTION] ✅ Health check OK
```

**Si ves `EVO_UNREACHABLE`**: Evolution no es accesible desde Vercel
- 🔧 Solución: Usar HTTPS con Caddy (ver Opción B abajo)

---

## 🌐 OPCIÓN B: HTTPS con Caddy (Recomendado para producción)

### 1. Configurar DNS:

En tu proveedor de dominio, crear registro A:
```
Tipo: A
Nombre: api (o el subdominio que quieras)
Valor: 31.220.58.83
TTL: 300
```

### 2. Crear Caddyfile en el VPS:

```bash
ssh root@31.220.58.83
cd ~

cat > Caddyfile << 'EOF'
# Reemplaza con tu dominio real
api.galle.tu-dominio.com {
  reverse_proxy 127.0.0.1:8080
  header Access-Control-Allow-Origin *
  header Access-Control-Allow-Methods "GET, POST, DELETE, OPTIONS"
  header Access-Control-Allow-Headers "Content-Type, Authorization, apikey"
}
EOF
```

### 3. Levantar Evolution + Caddy:

```bash
# Levantar Evolution (puerto 8080)
docker compose -f docker-compose.evolution.yml up -d

# Levantar Caddy (puertos 80 y 443)
docker run -d --name caddy \
  --restart unless-stopped \
  --network host \
  -v ~/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  -v caddy_config:/config \
  caddy:2

# Abrir puertos
ufw allow 80/tcp
ufw allow 443/tcp

# Verificar logs
docker logs caddy --tail 30
docker logs evolution --tail 30
```

### 4. Probar:

```bash
# Debe responder con HTTPS automático
curl -i https://api.galle.tu-dominio.com/health
```

### 5. Configurar en Vercel:

```
Name: EVO_BASE_URL
Value: https://api.galle.tu-dominio.com

Name: EVO_API_KEY
Value: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

**Redeploy** en Vercel

---

## ✅ VERIFICACIÓN

### En el VPS:

```bash
# Ver contenedores corriendo
docker ps

# Ver logs de Evolution
docker logs evolution --tail 50

# Ver logs de Caddy (si usas HTTPS)
docker logs caddy --tail 50

# Probar health
curl -i http://127.0.0.1:8080/health
```

### Desde tu PC:

```bash
# HTTP
curl -i http://31.220.58.83:8080/health \
  -H "apikey: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"

# HTTPS (si configuraste Caddy)
curl -i https://api.galle.tu-dominio.com/health \
  -H "apikey: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
```

---

## 🐛 TROUBLESHOOTING

### Error: Connection refused

```bash
# Verificar que Evolution esté corriendo
docker ps | grep evolution

# Ver logs
docker logs evolution --tail 50

# Reiniciar
docker restart evolution
```

### Error: 401 Unauthorized

```bash
# Verificar API Key
docker exec evolution printenv | grep API_KEY

# Debe mostrar:
# API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

### Error: Timeout desde Vercel

```bash
# Verificar firewall
sudo ufw status

# Abrir puertos
sudo ufw allow 8080/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## 🎯 RESULTADO ESPERADO

Después de configurar:

- ✅ Evolution API corriendo en puerto 8080
- ✅ Firewall permite conexiones
- ✅ `curl` desde PC responde 200 OK
- ✅ Vercel puede conectarse sin error `EVO_UNREACHABLE`
- ✅ Dashboard muestra QR en 2-5 segundos

---

## 📝 COMANDOS ÚTILES

```bash
# Reiniciar Evolution
docker restart evolution

# Ver logs en tiempo real
docker logs -f evolution

# Detener todo
docker stop evolution caddy
docker rm evolution caddy

# Limpiar y empezar de nuevo
docker stop evolution caddy
docker rm evolution caddy
docker compose -f docker-compose.evolution.yml up -d
```

