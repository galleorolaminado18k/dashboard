# 🔍 DIAGNÓSTICO ERROR 403 - Permission Error

## ❌ ERROR IDENTIFICADO

```
Error: EVO_HTTP_400 (en realidad es 403)
message: "permission error"
```

**Causa**: Evolution API está rechazando la petición por problemas de autenticación.

---

## ✅ SOLUCIÓN EN 3 PASOS

### PASO 1: Verificar API Key en Evolution (VPS)

**Ejecuta en el VPS**:

```bash
# Ver la API Key configurada en Evolution
docker exec evolution printenv | grep -i key

# Debería mostrar algo como:
# AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

**Si NO aparece la API Key**:

```bash
# Recrear Evolution SIN autenticación (más simple)
docker-compose -f ~/docker-compose.evolution.yml down

# Editar docker-compose para DESHABILITAR autenticación
cat > ~/docker-compose.evolution.yml << 'EOF'
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: evolution-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - evolution-net
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
      SERVER_URL: "http://localhost:8080"
      SERVER_PORT: "8080"
      AUTHENTICATION: "false"
      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: "postgresql"
      DATABASE_CONNECTION_URI: "postgresql://evolution:evolution123@postgres:5432/evolution"
      DATABASE_CONNECTION_CLIENT_NAME: "evolution"
      DATABASE_SAVE_DATA_INSTANCE: "true"
      DATABASE_SAVE_DATA_NEW_MESSAGE: "false"
      DATABASE_SAVE_DATA_MESSAGE_UPDATE: "false"
      DATABASE_SAVE_DATA_CONTACTS: "false"
      DATABASE_SAVE_DATA_CHATS: "false"
      REDIS_ENABLED: "true"
      REDIS_URI: "redis://redis:6379"
      REDIS_PREFIX: "evolution"
      CACHE_REDIS_ENABLED: "false"
    depends_on:
      - redis
      - postgres
    networks:
      - evolution-net
networks:
  evolution-net:
    driver: bridge
volumes:
  redis_data:
  postgres_data:
EOF

# Levantar Evolution SIN autenticación
docker-compose -f ~/docker-compose.evolution.yml up -d

# Esperar y probar
sleep 30
curl -i http://127.0.0.1:8080/instance/fetchInstances
```

---

### PASO 2: Actualizar Vercel

#### Opción A: Si DESHABILITASTE autenticación (recomendado):

1. Vercel → Settings → Environment Variables
2. **ELIMINAR** `EVO_API_KEY` (ya no se necesita)
3. **Mantener** `EVO_BASE_URL = http://31.220.58.83:8080`
4. Redeploy

#### Opción B: Si mantienes autenticación:

1. Verificar que `EVO_API_KEY` en Vercel sea EXACTAMENTE igual a `AUTHENTICATION_API_KEY` en Evolution
2. Copiar exactamente del VPS:
   ```bash
   docker exec evolution printenv AUTHENTICATION_API_KEY
   ```
3. Pegar ese valor EXACTO en Vercel
4. Redeploy

---

### PASO 3: Código actualizado con múltiples headers

**Ya actualicé el código** para enviar la API Key en múltiples formatos:
- `apikey: KEY`
- `api-key: KEY`
- `x-api-key: KEY`
- `Authorization: Bearer KEY`

Esto asegura compatibilidad con cualquier versión de Evolution.

---

## 🚀 RECOMENDACIÓN FINAL

**Usa Evolution SIN autenticación** (más simple y funciona igual):

1. Ejecuta el comando del PASO 1 para deshabilitar auth
2. En Vercel, elimina `EVO_API_KEY`
3. Mantén solo `EVO_BASE_URL`
4. Redeploy
5. Prueba en `/configuracion`

---

## 📋 COMANDO RÁPIDO (TODO EN UNO)

```bash
# VPS: Recrear Evolution SIN autenticación
docker-compose -f ~/docker-compose.evolution.yml down && cat > ~/docker-compose.evolution.yml << 'EOF'
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: evolution-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - evolution-net
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
      SERVER_URL: "http://localhost:8080"
      SERVER_PORT: "8080"
      AUTHENTICATION: "false"
      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: "postgresql"
      DATABASE_CONNECTION_URI: "postgresql://evolution:evolution123@postgres:5432/evolution"
      DATABASE_SAVE_DATA_INSTANCE: "true"
      DATABASE_SAVE_DATA_NEW_MESSAGE: "false"
      DATABASE_SAVE_DATA_MESSAGE_UPDATE: "false"
      DATABASE_SAVE_DATA_CONTACTS: "false"
      DATABASE_SAVE_DATA_CHATS: "false"
      REDIS_ENABLED: "true"
      REDIS_URI: "redis://redis:6379"
      CACHE_REDIS_ENABLED: "false"
    depends_on:
      - redis
      - postgres
    networks:
      - evolution-net
networks:
  evolution-net:
    driver: bridge
volumes:
  redis_data:
  postgres_data:
EOF
docker-compose -f ~/docker-compose.evolution.yml up -d && sleep 35 && echo "=== PRUEBA ===" && curl -i http://127.0.0.1:8080/instance/fetchInstances
```

**Luego en Vercel**:
- Elimina `EVO_API_KEY`
- Redeploy
- Prueba en `/configuracion`

---

**🚀 EJECUTA EL COMANDO EN EL VPS Y ACTUALIZA VERCEL!**

