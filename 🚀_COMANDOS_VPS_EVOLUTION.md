# 🚀 COMANDOS VPS - EVOLUTION API CON HTTP/HTTPS

## 🎯 OPCIÓN A: HTTP Simple (Más rápido)

### 1. Levantar Evolution API:

```bash
# Conectar al VPS
ssh root@31.220.58.83

# Crear docker-compose.evolution.yml
cd ~
docker compose -f docker-compose.evolution.yml up -d

# Abrir firewall
ufw allow 8080/tcp

# Verificar
docker ps
docker logs evolution --tail 30
```

### 2. Probar desde el VPS:

```bash
curl -i http://127.0.0.1:8080/health
curl -i http://31.220.58.83:8080/health
```

**Resultado esperado**: `200 OK` ✅

### 3. Configurar en Vercel:

```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_API_KEY
Value: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

**Redeploy** en Vercel

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

