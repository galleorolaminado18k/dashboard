# ⚡ FIX ERROR 403 - PERMISSION ERROR

## 🔍 DIAGNÓSTICO DEL ERROR

Según la consola del navegador:
```
code: 403
message: "permission error"
httpStatus: 200
```

**Causa**: La API Key que está enviando tu app NO coincide con la que Evolution espera.

---

## ✅ SOLUCIÓN EN 3 PASOS

### PASO 1: Verificar API Key en el VPS

Ejecuta en el VPS:

```bash
docker exec evolution printenv AUTHENTICATION_API_KEY
```

**Resultado esperado**: `galle-whatsapp-key-2025`

Si muestra otra cosa o está vacío → **Ve al PASO 2**

---

### PASO 2: Verificar API Key en Vercel

1. Ve a Vercel → Tu proyecto
2. Click en **"Settings"** → **"Environment Variables"**
3. Busca `EVO_API_KEY`
4. Verifica que el valor sea: `galle-whatsapp-key-2025`

**Si NO existe o tiene otro valor**:
- Click **"Edit"** (o "Add New" si no existe)
- Name: `EVO_API_KEY`
- Value: `galle-whatsapp-key-2025`
- Click **"Save"**

---

### PASO 3A: Si la API Key en VPS está vacía o diferente

**Ejecuta en el VPS** (esto reconfigura Evolution con la API Key correcta):

```bash
docker-compose -f ~/docker-compose.evolution.yml down && \
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
docker-compose -f ~/docker-compose.evolution.yml up -d && \
echo "⏳ Esperando 30 segundos..." && sleep 30 && \
echo "=== VERIFICACIÓN ===" && \
docker exec evolution printenv AUTHENTICATION_API_KEY && \
echo "" && \
curl -i http://127.0.0.1:8080/health
```

**Espera 30 segundos** y deberías ver:
- ✅ `galle-whatsapp-key-2025` (API Key configurada)
- ✅ `HTTP/1.1 200 OK` (Evolution funcionando)

---

### PASO 3B: Si la API Key en VPS ya es correcta

**Entonces solo necesitas hacer REDEPLOY en Vercel**:

1. Ve a Vercel → **"Deployments"**
2. Click en el deployment más reciente
3. Click en los **3 puntos** (`...`) → **"Redeploy"**
4. En el modal, click **"Redeploy"** nuevamente
5. **Espera 2-3 minutos** hasta que diga "Ready" ✅

---

## 🧪 PASO 4: PROBAR

Después de completar PASO 3A o 3B:

1. Ve a tu dashboard: `/configuracion`
2. **Refresca la página** (F5 o Ctrl+R)
3. Ingresa el número: `3012439596`
4. Click **"Conectar WhatsApp"**

**Resultado esperado**:
- ✅ Spinner "Generando código QR..."
- ✅ QR aparece en 2-5 segundos
- ✅ NO más error 403
- ✅ Puedes escanear el QR

---

## 🔍 VERIFICACIÓN ADICIONAL (Si sigue fallando)

### A. Ver logs de Evolution en VPS:

```bash
docker logs evolution --tail 100
```

Busca líneas con:
- `AUTHENTICATION_API_KEY` → Debería mostrar la clave
- Error 403 → Indica qué está rechazando

### B. Verificar que Evolution acepte la API Key:

```bash
curl -i http://127.0.0.1:8080/instance/fetchInstances \
  -H "apikey: galle-whatsapp-key-2025"
```

**Resultado esperado**:
- ✅ `HTTP/1.1 200 OK` + lista de instancias (puede estar vacía `[]`)

**Si da error 403**:
- Evolution no está aceptando la API Key
- Ejecuta el comando del PASO 3A nuevamente

---

## 📋 CHECKLIST FINAL

| Item | Estado |
|------|--------|
| Evolution corriendo en VPS | ⏳ |
| `AUTHENTICATION_API_KEY` = `galle-whatsapp-key-2025` | ⏳ |
| `EVO_API_KEY` en Vercel = `galle-whatsapp-key-2025` | ⏳ |
| Redeploy hecho en Vercel | ⏳ |
| Prueba en `/configuracion` exitosa | ⏳ |

---

## 🎯 RESUMEN

**El error 403 "permission error" significa que la API Key NO coincide**.

**Solución**:
1. Verificar API Key en VPS: `docker exec evolution printenv AUTHENTICATION_API_KEY`
2. Verificar API Key en Vercel: Settings → Environment Variables → `EVO_API_KEY`
3. Si están diferentes → Configurar Evolution con el comando del PASO 3A
4. Hacer Redeploy en Vercel
5. Probar en `/configuracion`

**Después de estos pasos, el QR debería aparecer sin error 403** ✅

