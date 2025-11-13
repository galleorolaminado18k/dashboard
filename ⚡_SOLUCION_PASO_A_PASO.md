
---

## ⚡ PASO 2: CONFIGURAR VERCEL (5 minutos)

### 2.1 Acceder a Vercel

1. Ve a: https://vercel.com
2. Login con tu cuenta
3. Selecciona tu proyecto **dashboard**

### 2.2 Configurar Variables de Entorno

1. Click en **"Settings"** (menú lateral)
2. Click en **"Environment Variables"**
3. **Busca o agrega** estas variables:

#### Variable 1: EVO_BASE_URL

**Si NO existe:**
- Click **"Add New"**
- Name: `EVO_BASE_URL`
- Value: `http://31.220.58.83:8080` ⚠️ **SIN SLASH AL FINAL**
- Environments: ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

**Si existe:**
- Click **"Edit"** (ícono de lápiz)
- Verifica que sea: `http://31.220.58.83:8080`
- ⚠️ **NO debe terminar en /**
- Click **"Save"**

#### Variable 2: EVO_API_KEY

**Si NO existe:**
- Click **"Add New"**
- Name: `EVO_API_KEY`
- Value: `Galle_EVO_KEY_123` ⚠️ **EXACTAMENTE IGUAL QUE EN VPS**
- Environments: ✅ Production, ✅ Preview, ✅ Development
- Click **"Save"**

**Si existe:**
- Click **"Edit"**
- Cambia Value a: `Galle_EVO_KEY_123`
- Click **"Save"**

### 2.3 Verificar Variables

Deberías ver:

```
EVO_BASE_URL = http://31.220.58.83:8080
EVO_API_KEY = Galle_EVO_KEY_123
```

Con puntitos verdes al lado ✅

---

## ⚡ PASO 3: PUSH Y REDEPLOY (2 minutos)

### 3.1 Push a GitHub

**Ya lo hice por ti**, pero si necesitas verificar:

```cmd
git status
git log --oneline -1
```

### 3.2 Redeploy en Vercel

**Opción A - Automático:**
1. Vercel detecta el push automáticamente
2. Ve a **"Deployments"**
3. Espera a que el indicador cambie a **"Ready"** (2-3 minutos)

**Opción B - Manual:**
1. Ve a **"Deployments"**
2. Click en el deployment más reciente
3. Click en **"..."** (tres puntos)
4. Click **"Redeploy"**
5. Confirma en el modal
6. Espera 2-3 minutos

---

## ⚡ PASO 4: PROBAR (1 minuto)

### 4.1 Acceder a tu app

1. Ve a: `https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app/configuracion`
2. O click en **"Visit"** desde Vercel

### 4.2 Conectar WhatsApp

1. En la sección **"Número de WhatsApp Business"**
2. Número: `3012439596` (solo 10 dígitos, sin +57)
3. Click: **"Conectar WhatsApp"**

### 4.3 Resultado Esperado

- ✅ Spinner "Generando código QR..."
- ✅ QR aparece en 2-5 segundos
- ✅ **NO más error EVO_HTTP_400**
- ✅ **NO más error "permission error"**
- ✅ Puedes escanear el QR desde WhatsApp

---

## 🔍 PASO 5: DIAGNÓSTICO (Si sigue fallando)

### 5.1 Ver logs de Vercel

1. Ve a **"Deployments"**
2. Click en el último deployment
3. Click en **"View Function Logs"**
4. Busca líneas que empiecen con `[EVOLUTION]`

**Copia y envíame:**
- Las líneas que muestren el URL llamado
- El código de error HTTP
- El mensaje de error

### 5.2 Verificar VPS

En el VPS, ejecuta:

```bash
# Ver logs de Evolution
docker logs evolution --tail 100

# Probar endpoint
curl -i -H "apikey: Galle_EVO_KEY_123" http://127.0.0.1:8080/instance/fetchInstances
```

**Debe dar HTTP/1.1 200 OK**

### 5.3 Verificar Variables Vercel

En Vercel → Settings → Environment Variables:

```
✅ EVO_BASE_URL = http://31.220.58.83:8080 (sin /)
✅ EVO_API_KEY = Galle_EVO_KEY_123 (exacta)
```

---

## 📊 CHECKLIST COMPLETO

| Paso | Acción | Estado |
|------|--------|--------|
| 1.1 | Conectar a VPS | ⏳ |
| 1.2 | Crear script | ⏳ |
| 1.3 | Ejecutar script | ⏳ |
| 1.4 | Verificar 200 OK con API Key | ⏳ |
| 2.1 | Acceder a Vercel | ⏳ |
| 2.2 | Configurar variables | ⏳ |
| 2.3 | Verificar variables | ⏳ |
| 3.1 | Push a GitHub | ✅ |
| 3.2 | Redeploy Vercel | ⏳ |
| 4.1 | Acceder a app | ⏳ |
| 4.2 | Conectar WhatsApp | ⏳ |
| 4.3 | QR aparece | ⏳ |

---

## 🔑 VALORES EXACTOS

**En VPS (docker-compose.evolution.yml):**
```yaml
AUTHENTICATION_API_KEY: "Galle_EVO_KEY_123"
```

**En Vercel (Environment Variables):**
```
EVO_BASE_URL=http://31.220.58.83:8080
EVO_API_KEY=Galle_EVO_KEY_123
```

**En .env.local (desarrollo):**
```
EVO_BASE_URL=http://31.220.58.83:8080
EVO_API_KEY=Galle_EVO_KEY_123
```

---

## ⚠️ ERRORES COMUNES

### Error: "permission error" (403)
- ✅ API Key diferente entre VPS y Vercel
- ✅ Solución: Usar `Galle_EVO_KEY_123` en ambos

### Error: "Bad Request" (400)
- ✅ URL con slash final: `http://31.220.58.83:8080/`
- ✅ Solución: Sin slash: `http://31.220.58.83:8080`

### Error: "Not Found" (404)
- ✅ Endpoint incorrecto
- ✅ Solución: Ya está corregido en el código

### Error: No responde (timeout)
- ✅ Evolution no está corriendo
- ✅ Solución: Ejecutar script del PASO 1

---

## 🎯 RESUMEN

1. **VPS**: Configurar Evolution con `Galle_EVO_KEY_123`
2. **Vercel**: Agregar variables con la misma clave
3. **Redeploy**: Hacer deploy en Vercel
4. **Probar**: Conectar WhatsApp y ver QR

**Tiempo total**: 15-20 minutos

**Después de estos pasos, el QR debería aparecer sin errores** ✅
# 🎯 SOLUCIÓN ERROR 400 - PASO A PASO

## 📋 RESUMEN

El error **EVO_HTTP_400** ocurre porque:
1. ❌ La API Key no coincide entre VPS y Vercel
2. ❌ La URL puede tener slash final
3. ❌ La autenticación no está configurada correctamente

**Solución**: Configurar la misma API Key en VPS y Vercel.

---

## ⚡ PASO 1: CONFIGURAR VPS (10 minutos)

### 1.1 Conectarse al VPS

```bash
ssh root@31.220.58.83
```

### 1.2 Crear script de configuración

```bash
curl -o setup-evolution.sh https://raw.githubusercontent.com/tu-repo/dashboard/feature/meta-ads-integration-v2/setup-evolution-api-key.sh
chmod +x setup-evolution.sh
```

**O copiar y pegar directamente:**

```bash
cat > setup-evolution.sh << 'SCRIPT_END'
#!/bin/bash
echo "Configurando Evolution API..."

# Detener contenedores
docker-compose -f ~/docker-compose.evolution.yml down 2>/dev/null || true

# Crear docker-compose con API Key
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

# Iniciar
docker-compose -f ~/docker-compose.evolution.yml up -d

echo "Esperando 30 segundos..."
sleep 30

echo ""
echo "=== VERIFICACIÓN ==="
docker exec evolution printenv AUTHENTICATION_API_KEY
echo ""
echo "Prueba SIN API Key (debe dar 401/403):"
curl -i http://127.0.0.1:8080/instance/fetchInstances 2>&1 | grep HTTP
echo ""
echo "Prueba CON API Key (debe dar 200):"
curl -i -H "apikey: Galle_EVO_KEY_123" http://127.0.0.1:8080/instance/fetchInstances 2>&1 | grep HTTP
echo ""
echo "✅ Si la última línea muestra HTTP/1.1 200, continúa al PASO 2"
SCRIPT_END

chmod +x setup-evolution.sh
```

### 1.3 Ejecutar script

```bash
./setup-evolution.sh
```

### 1.4 Verificar resultados

Deberías ver:

```
AUTHENTICATION_API_KEY=Galle_EVO_KEY_123
Prueba SIN API Key: HTTP/1.1 401 Unauthorized (o 403)
Prueba CON API Key: HTTP/1.1 200 OK
```

**✅ Si ves HTTP/1.1 200 OK con la API Key, continúa al PASO 2**

