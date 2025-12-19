# ⚡ SOLUCIÓN RÁPIDA: Desactivar Autenticación Evolution API

## 🐛 Problema Detectado

Evolution API tiene autenticación activa (401 Unauthorized).

**Opciones:**
1. ✅ **Desactivar auth** (más simple) ← **RECOMENDADO**
2. Obtener/configurar API Key

---

## 🔧 Opción 1: Desactivar Autenticación (RECOMENDADO)

### Paso 1: Conectar al VPS

```bash
ssh root@31.220.58.83
```

### Paso 2: Editar docker-compose.yml

```bash
cd /root/evolution
nano docker-compose.yml
```

### Paso 3: Agregar estas líneas en `environment`:

Busca la sección `evolution` → `environment` y agrega al final:

```yaml
      - AUTHENTICATION_API_KEY=false
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=false
```

**El resultado final debe verse así:**

```yaml
  evolution:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    volumes:
      - ./evolution-data:/evolution/store
    environment:
      - SERVER_PORT=8080
      - LOG_LEVEL=INFO
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evolution:evolution_pass_2024@postgres:5432/evolution?schema=public
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - AUTHENTICATION_API_KEY=false
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=false
    networks:
      - evolution-net
```

### Paso 4: Guardar y salir

- Presiona `Ctrl + O` para guardar
- Presiona `Enter` para confirmar
- Presiona `Ctrl + X` para salir

### Paso 5: Reiniciar Evolution API

```bash
docker-compose down
docker-compose up -d
```

### Paso 6: Esperar y verificar (15 segundos)

```bash
sleep 15
curl http://localhost:8080/
```

**Debe responder:**
```json
{"status":200,"message":"Welcome to the Evolution API, it is working!"}
```

### Paso 7: Probar endpoint sin auth

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"default","qrcode":true}'
```

**Ahora debe funcionar SIN error 401** ✅

### Paso 8: Salir del VPS

```bash
exit
```

---

## 🧪 Verificar desde tu PC

```powershell
# Test crear instancia (debe funcionar ahora)
$body = @{
    instanceName = "default"
    qrcode = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://31.220.58.83:8080/instance/create" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

**Debe retornar datos de la instancia SIN error 401** ✅

---

## 🚀 Después de Desactivar Auth

### NO necesitas cambiar nada en Vercel

Las variables `EVO_API_KEY` y `EVO_BEARER` simplemente no se usarán.

### Tu configuración actual funciona:

```env
EVO_BASE_URL=http://31.220.58.83:8080
```

### El código ya está preparado:

Si no hay `EVO_API_KEY` o `EVO_BEARER`, el helper `withAuth()` simplemente no agrega esos headers. ✅

---

## ✅ Checklist

- [ ] SSH al VPS
- [ ] Editar docker-compose.yml
- [ ] Agregar `AUTHENTICATION_API_KEY=false`
- [ ] Reiniciar: `docker-compose down && docker-compose up -d`
- [ ] Esperar 15 segundos
- [ ] Verificar: `curl http://localhost:8080/`
- [ ] Probar desde PC
- [ ] Ver deploy en Vercel (ya debe funcionar)

---

## 🎯 Tiempo Estimado

- ⚡ Conectar y editar: **2 minutos**
- ⏳ Reiniciar servicios: **15 segundos**
- ⚡ Verificar: **1 minuto**

**Total: ~3-4 minutos** 🚀

---

## 📝 Comando Todo-en-Uno (Copy-Paste)

Si prefieres hacerlo todo de una vez:

```bash
ssh root@31.220.58.83 << 'ENDSSH'
cd /root/evolution
cp docker-compose.yml docker-compose.yml.backup
sed -i '/DATABASE_SAVE_DATA_NEW_MESSAGE=true/a\      - AUTHENTICATION_API_KEY=false\n      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=false' docker-compose.yml
docker-compose down
docker-compose up -d
sleep 15
curl http://localhost:8080/
ENDSSH
```

---

## 🔐 Opción 2: Usar API Key (si prefieres mantener auth)

Si prefieres NO desactivar auth:

1. Ver logs para encontrar la key:
```bash
ssh root@31.220.58.83
docker logs evolution-api 2>&1 | grep -i key
```

2. Configurar en Vercel:
```
EVO_API_KEY = la-key-que-encontraste
```

3. Redeploy

**Pero es más complejo**, por eso recomendamos desactivar auth para desarrollo.

---

## ✅ Después de Aplicar

El deploy actual de Vercel debería funcionar automáticamente una vez desactives la auth en Evolution API.

**No necesitas hacer redeploy en Vercel** - el código ya está preparado para funcionar sin auth. 🎉

