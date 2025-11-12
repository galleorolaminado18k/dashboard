# 🚨 SOLUCIÓN FINAL - PostgreSQL local con Docker Compose

## ❌ PROBLEMA

Evolution API solo acepta `postgresql` o `mysql` como proveedores de base de datos. SQLite no está soportado en esta versión.

## ✅ SOLUCIÓN: PostgreSQL local con Docker Compose

Vamos a levantar PostgreSQL local + Evolution juntos.

---

## 🚀 PASO 1: Crear docker-compose.yml

**Ejecuta estos comandos en el VPS**:

```bash
# Detener todo
docker stop $(docker ps -q) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null

# Crear archivo docker-compose
cat > ~/docker-compose.evolution.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: evolution-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: evolution123
      POSTGRES_DB: evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - evolution-net

  evolution:
    image: atendai/evolution-api:latest
    container_name: evolution
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ~/evolution-data:/evolution/store
    environment:
      SERVER_URL: http://localhost:8080
      SERVER_PORT: 8080
      AUTHENTICATION_API_KEY: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
      DATABASE_ENABLED: true
      DATABASE_PROVIDER: postgresql
      DATABASE_CONNECTION_URI: postgresql://evolution:evolution123@postgres:5432/evolution
      DATABASE_CONNECTION_CLIENT_NAME: evolution
      DATABASE_SAVE_DATA_INSTANCE: true
      DATABASE_SAVE_DATA_NEW_MESSAGE: false
      DATABASE_SAVE_DATA_MESSAGE_UPDATE: false
      DATABASE_SAVE_DATA_CONTACTS: false
      DATABASE_SAVE_DATA_CHATS: false
    depends_on:
      - postgres
    networks:
      - evolution-net

networks:
  evolution-net:
    driver: bridge

volumes:
  postgres_data:
EOF

echo "Archivo creado exitosamente"
```

---

## 🚀 PASO 2: Levantar los servicios

```bash
cd ~
docker compose -f docker-compose.evolution.yml up -d

echo "Esperando 40 segundos para que todo inicie..."
sleep 40

echo "=== CONTENEDORES ==="
docker ps

echo ""
echo "=== LOGS POSTGRES ==="
docker logs evolution-postgres --tail 20

echo ""
echo "=== LOGS EVOLUTION ==="
docker logs evolution --tail 30

echo ""
echo "=== PRUEBA ==="
curl -i http://127.0.0.1:8080/health
```

---

## ✅ RESULTADO ESPERADO:

```
=== CONTENEDORES ===
evolution          Up 30 seconds   0.0.0.0:8080->8080/tcp
evolution-postgres Up 35 seconds   5432/tcp

=== PRUEBA ===
HTTP/1.1 200 OK
content-type: application/json

{"status":"ok"}
```

---

## 📋 COMANDOS ÚTILES:

```bash
# Ver logs en tiempo real
docker logs -f evolution

# Reiniciar todo
docker compose -f ~/docker-compose.evolution.yml restart

# Detener todo
docker compose -f ~/docker-compose.evolution.yml down

# Ver estado
docker compose -f ~/docker-compose.evolution.yml ps
```

---

## 🔥 SI FALLA, REVISAR LOGS:

```bash
# Logs detallados de Evolution
docker logs evolution

# Logs de PostgreSQL
docker logs evolution-postgres

# Verificar red
docker network inspect evolution_evolution-net
```

---

## ✅ DESPUÉS DEL 200 OK:

1. **Abrir firewall**:
```bash
ufw allow 8080/tcp
ufw reload
```

2. **Probar IP pública**:
```bash
curl -i http://31.220.58.83:8080/health
```

3. **Configurar en Vercel**:
```
EVO_BASE_URL = http://31.220.58.83:8080
EVO_API_KEY = 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

4. **Redeploy** en Vercel

5. **Probar** en `/configuracion`

---

## 🎯 POR QUÉ ESTO FUNCIONA:

- ✅ PostgreSQL corre en un contenedor separado
- ✅ Evolution se conecta a PostgreSQL por red interna Docker
- ✅ No requiere configuración externa
- ✅ Todo está aislado y funcionando localmente
- ✅ Los datos persisten en volúmenes Docker

---

**🚀 EJECUTA LOS COMANDOS DEL PASO 1 Y PASO 2 EN EL VPS AHORA!**

**Esta es la configuración DEFINITIVA que usaremos** ✅

