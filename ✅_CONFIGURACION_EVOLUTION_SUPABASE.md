# ✅ CONFIGURACIÓN COMPLETA - EVOLUTION API + SUPABASE

## 🎯 CONFIGURACIÓN APLICADA

**Conexión Supabase**:
- Host: `db.eyrdjtsgpubazdtgywiv.supabase.co`
- Puerto: `5432`
- Database: `postgres`
- Usuario: `postgres`
- Password: `TlERcbG6anQkmDFR`

**API Key Evolution**:
- `81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb`

---

## 📝 PASO 1: CREAR TABLAS EN SUPABASE

### 1. Ir a Supabase:
https://supabase.com/dashboard

### 2. SQL Editor → New query

### 3. Copiar y pegar el script:
Archivo: `supabase-evolution-tables.sql`

### 4. Run (Ctrl+Enter)

**Resultado esperado**: "Tablas de WhatsApp creadas exitosamente en Supabase" ✅

---

## 🚀 PASO 2: CONFIGURAR EVOLUTION API EN EL VPS

### OPCIÓN A: Con Supabase (usando Transaction Pooler) ✅ RECOMENDADO

⚠️ **IMPORTANTE**: Usa el **Transaction Pooler** de Supabase (puerto 6543).

**URI correcta del Transaction Pooler**:
```
postgresql://postgres.eyrdjtsgpubazdtgywiv:TlERcbG6anQkmDFR@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

**Comando completo**:
```bash
# Limpiar contenedor anterior
docker rm -f evolution-api

# Levantar Evolution API con Supabase Transaction Pooler
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI='postgresql://postgres.eyrdjtsgpubazdtgywiv:TlERcbG6anQkmDFR@aws-1-us-east-1.pooler.supabase.com:6543/postgres' \
  -e DATABASE_SAVE_DATA_INSTANCE=true \
  -e DATABASE_SAVE_DATA_NEW_MESSAGE=true \
  -e DATABASE_SAVE_DATA_CONTACTS=true \
  -e DATABASE_SAVE_DATA_CHATS=true \
  atendai/evolution-api:latest

# Esperar 30 segundos
echo "Esperando que Evolution inicie..."
sleep 30

# Ver logs
echo "Logs de Evolution:"
docker logs evolution-api --tail 60
```

### OPCIÓN B: Sin Supabase (más simple, recomendado)

Si tienes problemas con Supabase, usa esta configuración que guarda todo localmente:

```bash
# Limpiar contenedor anterior
docker rm -f evolution-api

# Levantar Evolution API sin base de datos externa
docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e DATABASE_ENABLED=false \
  atendai/evolution-api:latest

# Esperar 20 segundos
sleep 20

# Ver logs y probar
docker logs evolution-api --tail 30
curl -i http://localhost:8080/health
```

---

## 🔍 PASO 3: VERIFICAR QUE FUNCIONA

### Test 1: Health check
```bash
curl -i http://localhost:8080/health
```

**Esperado**: `HTTP/1.1 200 OK` ✅

### Test 2: Con API Key
```bash
curl -i http://localhost:8080/health \
  -H "apikey: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
```

**Esperado**: `HTTP/1.1 200 OK` ✅

### Test 3: Desde tu PC
```bash
curl -i http://31.220.58.83:8080/health \
  -H "apikey: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb"
```

**Esperado**: `HTTP/1.1 200 OK` ✅

---

## ⚙️ PASO 4: CONFIGURAR EN VERCEL

### Variables de entorno:

```
Name: EVO_BASE_URL
Value: http://31.220.58.83:8080

Name: EVO_API_KEY
Value: 81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb
```

### Pasos:
1. https://vercel.com/dashboard
2. Seleccionar tu proyecto
3. **Settings** → **Environment Variables**
4. Click **Add New**
5. Agregar ambas variables
6. Click **Save**
7. **Deployments** → Click en los 3 puntos del último deployment → **Redeploy**

---

## 📊 PASO 5: VERIFICAR DATOS EN SUPABASE

Una vez que conectes WhatsApp desde el dashboard, verifica en Supabase:

### SQL Editor → New query:

```sql
-- Ver todas las sesiones
SELECT * FROM whatsapp_sessions;

-- Ver mensajes recientes (últimos 10)
SELECT 
  message_id,
  from_number,
  to_number,
  message_body,
  created_at
FROM whatsapp_messages 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver eventos (últimos 10)
SELECT 
  event_type,
  event_data,
  created_at
FROM whatsapp_events 
ORDER BY created_at DESC 
LIMIT 10;

-- Estadísticas de mensajes
SELECT 
  session_name,
  COUNT(*) as total_messages,
  MAX(created_at) as last_message
FROM whatsapp_messages
GROUP BY session_name;
```

---

## 🎯 RESULTADO ESPERADO

### En el VPS:
- ✅ Evolution API corriendo en puerto 8080
- ✅ Conectado a Supabase PostgreSQL
- ✅ Health check responde 200 OK
- ✅ Logs sin errores de base de datos

### En Supabase:
- ✅ Tablas `whatsapp_sessions`, `whatsapp_messages`, `whatsapp_events` creadas
- ✅ RLS (Row Level Security) activado
- ✅ Políticas de acceso configuradas
- ✅ Índices creados para mejor rendimiento

### En Vercel:
- ✅ Variables `EVO_BASE_URL` y `EVO_API_KEY` configuradas
- ✅ Redeploy completado sin errores
- ✅ Logs muestran "API Key: Configurada ✅"

### En el Dashboard:
- ✅ `/configuracion` carga correctamente
- ✅ Al hacer click en "Conectar WhatsApp" aparece QR
- ✅ NO hay error 401 en consola
- ✅ QR aparece en 2-5 segundos
- ✅ Al escanear QR, WhatsApp se conecta
- ✅ Estado cambia a "✅ WhatsApp Conectado"

### En Supabase (después de conectar):
- ✅ Nueva fila en `whatsapp_sessions` con status 'connected'
- ✅ Mensajes se guardan en `whatsapp_messages`
- ✅ Eventos se registran en `whatsapp_events`

---

## 🐛 TROUBLESHOOTING

### Error: "Tenant or user not found" o "Can't reach database server"
**Causa**: URI de conexión incorrecta o usando puerto directo en lugar del Transaction Pooler

**Solución**: Usar Transaction Pooler de Supabase:

**✅ URI CORRECTA (Transaction Pooler)**:
```
postgresql://postgres.eyrdjtsgpubazdtgywiv:TlERcbG6anQkmDFR@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

**❌ URI INCORRECTA (Direct connection)**:
```
postgresql://postgres:TlERcbG6anQkmDFR@db.eyrdjtsgpubazdtgywiv.supabase.co:5432/postgres
```

**Comando corregido**:
```bash
docker rm -f evolution-api

docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI='postgresql://postgres.eyrdjtsgpubazdtgywiv:TlERcbG6anQkmDFR@aws-1-us-east-1.pooler.supabase.com:6543/postgres' \
  -e DATABASE_SAVE_DATA_INSTANCE=true \
  -e DATABASE_SAVE_DATA_NEW_MESSAGE=true \
  atendai/evolution-api:latest
```

### Error: "Database provider invalid"
**Causa**: Variable `DATABASE_CONNECTION_URI` incorrecta

**Solución**: Verificar que la URI tenga este formato:
```
postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Opción alternativa: Sin base de datos
Si los problemas de conexión persisten, usa Evolution sin Supabase:

```bash
docker rm -f evolution-api

docker run -d --name evolution-api --restart=always \
  -p 8080:8080 \
  -v ~/evolution-data:/evolution/store \
  -e API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e AUTHENTICATION_API_KEY=81207c5105d10ea3744af0e6a5ebdc480d851ea2f3eeb5b31a256f150d5267cb \
  -e DATABASE_ENABLED=false \
  atendai/evolution-api:latest
```

Esto guarda todo localmente en `/evolution/store` y es suficiente para conectar WhatsApp.

### No aparecen datos en Supabase
**Verificar**:
```bash
# Ver logs de Evolution
docker logs evolution-api | grep -i database

# Ver si hay errores de conexión
docker logs evolution-api | grep -i error
```

---

## 📁 ARCHIVOS RELACIONADOS

- `supabase-evolution-tables.sql` - Script SQL para crear tablas
- `🔑_OBTENER_Y_CONFIGURAR_API_KEY.md` - Guía de API Key
- `⚡_COMANDOS_RAPIDOS_VPS_AUTH.md` - Comandos rápidos para VPS

---

## ✅ CHECKLIST FINAL

### Antes de empezar:
- [ ] Acceso SSH al VPS (31.220.58.83)
- [ ] Acceso a Supabase Dashboard
- [ ] Acceso a Vercel Dashboard

### Supabase:
- [ ] Script SQL ejecutado sin errores
- [ ] Tablas creadas: `whatsapp_sessions`, `whatsapp_messages`, `whatsapp_events`
- [ ] Políticas RLS activas

### VPS:
- [ ] Evolution API corriendo
- [ ] `docker ps | grep evolution` muestra contenedor activo
- [ ] Logs sin errores: `docker logs evolution-api --tail 50`
- [ ] Health check OK: `curl http://localhost:8080/health`

### Vercel:
- [ ] Variable `EVO_BASE_URL` configurada
- [ ] Variable `EVO_API_KEY` configurada
- [ ] Redeploy completado
- [ ] Build exitoso sin errores

### Prueba final:
- [ ] Ir a `/configuracion`
- [ ] Ingresar número de WhatsApp
- [ ] Click en "Conectar WhatsApp"
- [ ] QR aparece en 2-5 segundos
- [ ] Escanear QR con WhatsApp
- [ ] Estado cambia a "Conectado"
- [ ] Verificar datos en Supabase

---

## 🎉 BENEFICIOS DE ESTA CONFIGURACIÓN

### ✅ Persistencia de datos:
- Sesiones de WhatsApp guardadas en Supabase
- Historial completo de mensajes
- Eventos y webhooks registrados

### ✅ Escalabilidad:
- Múltiples instancias pueden conectarse a la misma BD
- Datos accesibles desde cualquier lugar
- Backups automáticos de Supabase

### ✅ Análisis:
- Queries SQL para estadísticas
- Integración con herramientas BI
- API de Supabase para consultas

### ✅ Seguridad:
- RLS (Row Level Security) activado
- API Key en Evolution API
- Conexión cifrada a Supabase

---

**🚀 ¡Configuración completa! Evolution API + Supabase funcionando juntos!**

