# ⚡ GUÍA RÁPIDA - EJECUTA ESTO AHORA

## 🎯 API KEY ÚNICA PARA TODO

```
Galle_EVO_KEY_123
```

**Esta clave debe estar en VPS Y en Vercel**

---

## 📋 PASO 1: VPS (Copia y pega en SSH)

Conéctate al VPS:
```bash
ssh root@31.220.58.83
```

Luego ejecuta este comando completo (copia TODO):

```bash
docker-compose -f ~/docker-compose.evolution.yml down 2>/dev/null && \
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
      SERVER_URL: "http://31.220.58.83:8080"
      SERVER_PORT: "8080"
      SERVER_HOST: "0.0.0.0"
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
docker-compose -f ~/docker-compose.evolution.yml up -d && \
sleep 30 && \
echo "=== API KEY ===" && \
docker exec evolution printenv AUTHENTICATION_API_KEY && \
echo "" && \
echo "=== PRUEBA CON API KEY ===" && \
curl -i -H "apikey: Galle_EVO_KEY_123" http://127.0.0.1:8080/instance/fetchInstances 2>&1 | head -15
```

**Resultado esperado:**
```
API KEY === 
Galle_EVO_KEY_123

=== PRUEBA CON API KEY ===
HTTP/1.1 200 OK
```

---

## 📋 PASO 2: VERCEL (Hazlo en el navegador)

1. **Abre**: https://vercel.com
2. **Selecciona** tu proyecto
3. **Settings** → **Environment Variables**

### Agregar/Editar Variables:

#### Variable 1:
- **Name**: `EVO_BASE_URL`
- **Value**: `http://31.220.58.83:8080` (SIN slash final)
- **Environments**: ✅ Todos
- **Save**

#### Variable 2:
- **Name**: `EVO_API_KEY`
- **Value**: `Galle_EVO_KEY_123` (EXACTA)
- **Environments**: ✅ Todos
- **Save**

---

## 📋 PASO 3: REDEPLOY

**En Vercel:**
1. **Deployments** (menú lateral)
2. Click en el deployment más reciente
3. Click **"..."** → **"Redeploy"**
4. Confirmar
5. Esperar 2-3 minutos

---

## 📋 PASO 4: PROBAR

1. Ve a tu app: `/configuracion`
2. Número: `3012439596`
3. Click: **"Conectar WhatsApp"**

**Debe aparecer el QR sin errores** ✅

---

## 🔍 VERIFICACIÓN RÁPIDA

### En VPS:
```bash
# API Key configurada
docker exec evolution printenv AUTHENTICATION_API_KEY

# Debe dar 200
curl -i -H "apikey: Galle_EVO_KEY_123" http://127.0.0.1:8080/instance/fetchInstances
```

### En Vercel:
```
Settings → Environment Variables
✅ EVO_BASE_URL = http://31.220.58.83:8080
✅ EVO_API_KEY = Galle_EVO_KEY_123
```

---

## ⚠️ IMPORTANTE

- ✅ La API Key debe ser **EXACTAMENTE IGUAL** en VPS y Vercel
- ✅ La URL **NO debe terminar** en `/`
- ✅ Usar **mayúsculas/minúsculas** correctas: `Galle_EVO_KEY_123`

---

## 🎯 CHECKLIST

- [ ] Ejecutar comando en VPS
- [ ] Ver `HTTP/1.1 200 OK` en la prueba
- [ ] Agregar variables en Vercel
- [ ] Hacer Redeploy
- [ ] Probar en `/configuracion`
- [ ] Ver QR sin errores

---

**Tiempo estimado: 10-15 minutos**

**Si ves HTTP/1.1 200 en VPS y configuras Vercel, el error desaparecerá** ✅

