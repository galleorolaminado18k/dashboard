# ⚡ FIX INMEDIATO - ERROR 400

## 🎯 EL ERROR SIGUE PORQUE CORS NO ESTÁ CONFIGURADO

---

## ▶️ PASO 1: VPS (5 MINUTOS)

### Conéctate:
```bash
ssh root@31.220.58.83
```

### Copia y pega este comando COMPLETO:

```bash
docker-compose -f ~/docker-compose.evolution.yml down 2>/dev/null && docker stop evolution evolution-redis evolution-postgres 2>/dev/null && docker rm evolution evolution-redis evolution-postgres 2>/dev/null && cat > ~/docker-compose.evolution.yml << 'EOF'
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
      SERVER_URL: "http://31.220.58.83:8080"
      SERVER_PORT: "8080"
      SERVER_HOST: "0.0.0.0"
      CORS_ORIGIN: "*"
      CORS_METHODS: "GET,POST,PUT,DELETE"
      CORS_CREDENTIALS: "true"
      AUTHENTICATION_TYPE: "apikey"
      AUTHENTICATION_API_KEY: "Galle_EVO_KEY_123"
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
      LOG_LEVEL: "ERROR,WARN,DEBUG,INFO"
      LOG_COLOR: "true"
      LOG_BAILEYS: "false"
      DEL_INSTANCE: "false"
      DEL_TEMP_INSTANCES: "true"
      QRCODE_LIMIT: "30"
      QRCODE_COLOR: "#198754"
      WEBHOOK_GLOBAL_ENABLED: "false"
      WA_BUSINESS_NAME: "GALLE"
      WA_BUSINESS_DESCRIPTION: "Sistema de Gestion de Ventas"
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
docker-compose -f ~/docker-compose.evolution.yml up -d && sleep 40 && echo "✅ VERIFICACIÓN:" && echo "" && echo "CORS_ORIGIN:" && docker exec evolution printenv CORS_ORIGIN && echo "" && echo "Test CORS:" && curl -i -X OPTIONS http://127.0.0.1:8080/instance/create -H "Origin: https://vercel.app" -H "Access-Control-Request-Method: POST" 2>&1 | grep -i "access-control-allow"
```

### Debes ver:
```
CORS_ORIGIN:
*

Test CORS:
access-control-allow-origin: *
access-control-allow-methods: GET,POST,PUT,DELETE
```

**Si ves eso → Continúa al PASO 2** ✅

---

## ▶️ PASO 2: VERCEL (2 MINUTOS)

1. https://vercel.com → Tu proyecto
2. **Settings** → **Environment Variables**
3. Busca o agrega:

```
EVO_API_KEY = Galle_EVO_KEY_123
EVO_BASE_URL = http://31.220.58.83:8080
```

(Sin slash al final)

4. **Save**

---

## ▶️ PASO 3: REDEPLOY (2 MINUTOS)

1. **Deployments**
2. Click en el último
3. **...** → **Redeploy**
4. Espera 2-3 minutos

---

## ▶️ PASO 4: PROBAR (1 MINUTO)

1. Ve a `/configuracion`
2. Refresca (F5)
3. Click **"Conectar WhatsApp"**

**Debe aparecer el QR sin error 400** ✅

---

## 🔴 SI SIGUE EL ERROR

### Limpiar caché del navegador:

**Chrome/Edge:**
- F12 → Console
- Click derecho en el botón refresh
- **"Empty Cache and Hard Reload"**

**O:**
- Ctrl + Shift + Delete
- Borrar caché
- Recargar

---

## 📊 RESUMEN

**Problema:** CORS no configurado en Evolution
**Solución:** Agregar 3 variables CORS
**Tiempo:** 10 minutos total

**El comando del PASO 1 hace TODO automáticamente** ✅

