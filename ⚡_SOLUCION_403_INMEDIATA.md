# ⚡ SOLUCIÓN INMEDIATA - Error 403 Permission

## 🎯 ERROR IDENTIFICADO

**Línea por línea del error**:
```
code: 403
data: {code: 403, msg: 'permission error'}
httpStatus: 200
message: "permission error"
```

**Causa raíz**: Evolution API tiene `AUTHENTICATION: "true"` pero rechaza la API Key.

---

## ✅ SOLUCIÓN: Configurar autenticación global en Evolution v2.2.3

**PROBLEMA IDENTIFICADO**: Evolution v2.2.3 SIEMPRE requiere autenticación y `AUTHENTICATION: "false"` no funciona.

**SOLUCIÓN**: Usar `AUTHENTICATION_TYPE: "apikey"` con una clave global.

**EJECUTA ESTE COMANDO EN EL VPS** (copia TODO):

```bash
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
      AUTHENTICATION_TYPE: "apikey"
      AUTHENTICATION_API_KEY: "galle-whatsapp-key-2025"
      AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: "true"
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
docker-compose -f ~/docker-compose.evolution.yml up -d && sleep 35 && echo "=== LOGS ===" && docker logs evolution --tail 30 && echo "" && echo "=== PRUEBA SIN AUTH ===" && curl -i http://127.0.0.1:8080/instance/fetchInstances && echo "" && echo "=== PRUEBA CON AUTH ===" && curl -i -H "apikey: galle-whatsapp-key-2025" http://127.0.0.1:8080/instance/fetchInstances
```

---

## 📋 DESPUÉS DE EJECUTAR EN EL VPS

### EN VERCEL:

1. Ve a: https://vercel.com/dashboard
2. Tu proyecto → **Settings** → **Environment Variables**
3. **ACTUALIZAR/AGREGAR** estas variables:

```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_API_KEY
Value: galle-whatsapp-key-2025
```

4. **Deployments** → **Redeploy** (OBLIGATORIO)

---

## ✅ RESULTADO ESPERADO

```
=== LOGS ===
[LOG] - Server started on port 8080
[LOG] - Database connected
[LOG] - Redis connected

=== PRUEBA SIN AUTH ===
HTTP/1.1 401 Unauthorized
{"status":401,"error":"Unauthorized"}

=== PRUEBA CON AUTH ===
HTTP/1.1 200 OK
content-type: application/json

[]  (o array con instancias)
```

**Correcto**: Sin auth = 401, Con auth = 200 ✅

---

## 🧪 PROBAR EN LA APP

1. Ve a `/configuracion`
2. Ingresa número: `3012439596`
3. Click **"Conectar WhatsApp"**
4. **QR debe aparecer** en 2-5 segundos ✅

---

## 📊 CAMBIOS APLICADOS

**Commit**: `49d36da`

### En Evolution (VPS):
- ✅ `AUTHENTICATION_TYPE: "apikey"` - Autenticación con API key global
- ✅ `AUTHENTICATION_API_KEY: "galle-whatsapp-key-2025"` - Clave simple y segura
- ✅ `AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: "true"` - Permite listar instancias

### En Vercel:
- ✅ `EVO_API_KEY = galle-whatsapp-key-2025` - Misma clave que en Evolution
- ✅ Código con múltiples headers de autenticación
- ✅ Mejor logging de errores 403/401

---

**🚀 EJECUTA EL COMANDO EN EL VPS, ACTUALIZA VERCEL Y PRUEBA!**

