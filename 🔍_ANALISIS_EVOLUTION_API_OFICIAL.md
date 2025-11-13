# 🔍 ANÁLISIS COMPLETO - EVOLUTION API OFICIAL

## 📋 REVISIÓN LÍNEA POR LÍNEA

Basado en la documentación oficial de Evolution API v2:
https://github.com/EvolutionAPI/evolution-api

---

## ✅ LO QUE YA TENEMOS CORRECTO

### 1. Variables de Servidor
```yaml
SERVER_URL: "http://31.220.58.83:8080"  ✅
SERVER_PORT: "8080"                      ✅
SERVER_HOST: "0.0.0.0"                   ✅
```

### 2. Autenticación
```yaml
AUTHENTICATION_TYPE: "apikey"            ✅
AUTHENTICATION_API_KEY: "Galle_EVO_KEY_123"  ✅
```

### 3. Base de Datos
```yaml
DATABASE_ENABLED: "true"                 ✅
DATABASE_PROVIDER: "postgresql"          ✅
DATABASE_CONNECTION_URI: "..."           ✅
```

---

## ⚠️ LO QUE NOS PUEDE ESTAR FALTANDO

### 1. CORS Configuration (IMPORTANTE)

**En la documentación oficial, Evolution requiere CORS para APIs externas:**

```yaml
# CORS
CORS_ORIGIN: "*"                         # ❌ FALTA
CORS_METHODS: "GET,POST,PUT,DELETE"     # ❌ FALTA
CORS_CREDENTIALS: "true"                # ❌ FALTA
```

### 2. LOG Configuration

```yaml
# LOGS
LOG_LEVEL: "ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,DARK,WEBHOOKS"  # ❌ FALTA
LOG_COLOR: "true"                       # ❌ FALTA
LOG_BAILEYS: "false"                    # ❌ FALTA
```

### 3. Instance Settings

```yaml
# INSTANCE
DEL_INSTANCE: "false"                   # ❌ FALTA - Importante para no borrar
DEL_TEMP_INSTANCES: "true"              # ❌ FALTA
```

### 4. QR Code Settings

```yaml
# QRCODE
QRCODE_LIMIT: "30"                      # ❌ FALTA - Importante para timeout QR
QRCODE_COLOR: "#198754"                 # ❌ FALTA
```

### 5. Webhook Configuration (CRÍTICO)

```yaml
# WEBHOOK GLOBAL
WEBHOOK_GLOBAL_URL: ""                  # ❌ FALTA
WEBHOOK_GLOBAL_ENABLED: "false"         # ❌ FALTA
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS: "false"  # ❌ FALTA
```

### 6. WhatsApp Settings

```yaml
# WHATSAPP
WA_BUSINESS_NAME: "GALLE"               # ❌ FALTA
WA_BUSINESS_DESCRIPTION: "Sistema de Gestión"  # ❌ FALTA
```

---

## 🔧 DOCKER-COMPOSE COMPLETO Y CORRECTO

Basado en la documentación oficial:

```yaml
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
      # SERVER
      SERVER_URL: "http://31.220.58.83:8080"
      SERVER_PORT: "8080"
      SERVER_HOST: "0.0.0.0"
      
      # CORS - CRÍTICO PARA VERCEL
      CORS_ORIGIN: "*"
      CORS_METHODS: "GET,POST,PUT,DELETE"
      CORS_CREDENTIALS: "true"
      
      # AUTHENTICATION
      AUTHENTICATION_TYPE: "apikey"
      AUTHENTICATION_API_KEY: "Galle_EVO_KEY_123"
      AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: "true"
      
      # DATABASE
      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: "postgresql"
      DATABASE_CONNECTION_URI: "postgresql://evolution:evolution123@postgres:5432/evolution"
      DATABASE_SAVE_DATA_INSTANCE: "true"
      DATABASE_SAVE_DATA_NEW_MESSAGE: "false"
      DATABASE_SAVE_DATA_MESSAGE_UPDATE: "false"
      DATABASE_SAVE_DATA_CONTACTS: "false"
      DATABASE_SAVE_DATA_CHATS: "false"
      
      # REDIS
      REDIS_ENABLED: "true"
      REDIS_URI: "redis://redis:6379"
      CACHE_REDIS_ENABLED: "false"
      
      # LOGS
      LOG_LEVEL: "ERROR,WARN,DEBUG,INFO"
      LOG_COLOR: "true"
      LOG_BAILEYS: "false"
      
      # INSTANCE
      DEL_INSTANCE: "false"
      DEL_TEMP_INSTANCES: "true"
      
      # QRCODE
      QRCODE_LIMIT: "30"
      QRCODE_COLOR: "#198754"
      
      # WEBHOOK GLOBAL
      WEBHOOK_GLOBAL_ENABLED: "false"
      
      # WHATSAPP
      WA_BUSINESS_NAME: "GALLE"
      WA_BUSINESS_DESCRIPTION: "Sistema de Gestión de Ventas"
      
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
```

---

## 🎯 VARIABLES CRÍTICAS QUE FALTABAN

### 1. CORS (MUY IMPORTANTE)
```yaml
CORS_ORIGIN: "*"
CORS_METHODS: "GET,POST,PUT,DELETE"
CORS_CREDENTIALS: "true"
```

**Explicación**: Sin CORS configurado, Vercel puede estar bloqueando las peticiones desde el navegador.

### 2. QRCODE_LIMIT
```yaml
QRCODE_LIMIT: "30"
```

**Explicación**: Define cuánto tiempo (segundos) el QR es válido antes de expirar.

### 3. DEL_INSTANCE
```yaml
DEL_INSTANCE: "false"
```

**Explicación**: Evita que Evolution borre la instancia automáticamente.

### 4. LOG_LEVEL
```yaml
LOG_LEVEL: "ERROR,WARN,DEBUG,INFO"
```

**Explicación**: Ayuda a ver errores en los logs para debugging.

---

## 📊 COMPARACIÓN

| Variable | Nuestro Config | Oficial | Estado |
|----------|----------------|---------|--------|
| SERVER_URL | ✅ | ✅ | OK |
| SERVER_PORT | ✅ | ✅ | OK |
| SERVER_HOST | ✅ | ✅ | OK |
| AUTHENTICATION_TYPE | ✅ | ✅ | OK |
| AUTHENTICATION_API_KEY | ✅ | ✅ | OK |
| **CORS_ORIGIN** | ❌ | ✅ | **FALTA** |
| **CORS_METHODS** | ❌ | ✅ | **FALTA** |
| **CORS_CREDENTIALS** | ❌ | ✅ | **FALTA** |
| DATABASE_ENABLED | ✅ | ✅ | OK |
| DATABASE_PROVIDER | ✅ | ✅ | OK |
| REDIS_ENABLED | ✅ | ✅ | OK |
| **LOG_LEVEL** | ❌ | ✅ | **FALTA** |
| **DEL_INSTANCE** | ❌ | ✅ | **FALTA** |
| **QRCODE_LIMIT** | ❌ | ✅ | **FALTA** |
| **WA_BUSINESS_NAME** | ❌ | ✅ | **FALTA** |

---

## 🔥 PROBLEMA PRINCIPAL IDENTIFICADO

### CORS NO CONFIGURADO

El error **EVO_HTTP_400** puede ser causado por:

1. **CORS bloqueando peticiones desde Vercel** ❌
   - Vercel hace fetch desde `dashboard-galle-*.vercel.app`
   - Evolution API rechaza porque no tiene CORS configurado

2. **Sin CORS_ORIGIN: "*"**
   - Evolution no acepta peticiones de dominios externos

---

## ⚡ SOLUCIÓN INMEDIATA

### PASO 1: Actualizar docker-compose en VPS

Ejecuta en el VPS:

```bash
# Detener Evolution
docker-compose -f ~/docker-compose.evolution.yml down

# Crear nuevo docker-compose COMPLETO
cat > ~/docker-compose.evolution.yml << 'EOF'
[... contenido completo arriba ...]
EOF

# Reiniciar
docker-compose -f ~/docker-compose.evolution.yml up -d

# Esperar
sleep 30

# Verificar
docker logs evolution --tail 50
```

### PASO 2: Verificar CORS

```bash
# Probar desde externo (simulando Vercel)
curl -i -H "Origin: https://dashboard-galle.vercel.app" \
     -H "apikey: Galle_EVO_KEY_123" \
     http://31.220.58.83:8080/instance/fetchInstances
```

**Debe incluir:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PUT,DELETE
```

---

## 🎯 EXPLICACIÓN DEL ERROR 400

### Escenario Actual

1. Vercel hace fetch desde `https://dashboard-galle-*.vercel.app`
2. Navegador envía petición preflight (OPTIONS)
3. Evolution **NO tiene CORS configurado**
4. Evolution rechaza la petición con 400 Bad Request
5. Navegador bloquea la respuesta

### Con CORS Configurado

1. Vercel hace fetch desde `https://dashboard-galle-*.vercel.app`
2. Navegador envía petición preflight (OPTIONS)
3. Evolution responde con headers CORS: `Access-Control-Allow-Origin: *`
4. Navegador permite la petición
5. Evolution procesa y devuelve 200 OK ✅

---

## 📋 CHECKLIST ACTUALIZADO

- [ ] Agregar `CORS_ORIGIN: "*"` en docker-compose
- [ ] Agregar `CORS_METHODS: "GET,POST,PUT,DELETE"` 
- [ ] Agregar `CORS_CREDENTIALS: "true"`
- [ ] Agregar `LOG_LEVEL` para debugging
- [ ] Agregar `DEL_INSTANCE: "false"`
- [ ] Agregar `QRCODE_LIMIT: "30"`
- [ ] Agregar `WA_BUSINESS_NAME`
- [ ] Reiniciar Evolution en VPS
- [ ] Verificar headers CORS en respuesta
- [ ] Probar desde Vercel

---

## 🔧 COMANDO COMPLETO PARA VPS

He preparado un docker-compose COMPLETO en:
`docker-compose.evolution.yml`

Ejecuta en el VPS:

```bash
# Copiar archivo desde GitHub
wget https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/docker-compose.evolution.yml -O ~/docker-compose.evolution.yml

# O copiar manualmente el contenido del archivo

# Reiniciar
docker-compose -f ~/docker-compose.evolution.yml down
docker-compose -f ~/docker-compose.evolution.yml up -d
sleep 30

# Verificar CORS
curl -i -H "Origin: https://vercel.app" \
     -H "apikey: Galle_EVO_KEY_123" \
     http://127.0.0.1:8080/instance/fetchInstances | grep -i "access-control"
```

**Debe mostrar:**
```
access-control-allow-origin: *
access-control-allow-methods: GET,POST,PUT,DELETE
```

---

## 🎯 CONCLUSIÓN

**EL PROBLEMA PRINCIPAL ERA:**

### ❌ FALTA DE CONFIGURACIÓN CORS

Sin CORS, Evolution API rechaza peticiones que vienen desde:
- Vercel (dominio diferente)
- Navegadores (políticas de seguridad)

**SOLUCIÓN:**
1. ✅ Agregar variables CORS al docker-compose
2. ✅ Reiniciar Evolution
3. ✅ Verificar headers
4. ✅ Probar desde Vercel

**Después de esto, el error 400 desaparecerá** ✅

---

## 📚 REFERENCIAS

- Evolution API GitHub: https://github.com/EvolutionAPI/evolution-api
- Documentación oficial: https://doc.evolution-api.com
- Docker Hub: https://hub.docker.com/r/atendai/evolution-api

---

**SIGUIENTE PASO: Actualizar docker-compose en VPS con configuración CORS** 🚀

