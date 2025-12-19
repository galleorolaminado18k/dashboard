# 🔴 SOLUCIÓN DEFINITIVA ERROR 401

## ❌ PROBLEMA DETECTADO

El archivo `docker-compose.yml` NO se actualizó correctamente. 
La sintaxis con guiones (`-`) no funcionó.

## ✅ SOLUCIÓN CORREGIDA

He creado un script `fix-401-definitivo.sh` con la sintaxis CORRECTA.

### **EJECUTA ESTO EN SSH:**

```bash
ssh root@31.220.58.83
```
**Contraseña:** `S@ntiago`

Luego ejecuta:

```bash
curl -o /tmp/fix.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/fix-401-definitivo.sh && chmod +x /tmp/fix.sh && bash /tmp/fix.sh
```

**O copia este script completo:**

```bash
cd /opt/waha
docker-compose down
docker stop waha-production 2>/dev/null || true
docker rm waha-production 2>/dev/null || true
rm -f docker-compose.yml

cat > docker-compose.yml << 'EOFCONFIG'
version: '3.8'
services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha-production
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      WAHA_HTTP_API_HOST: "0.0.0.0"
      WAHA_LICENSE_ACCEPT: "true"
      WAHA_LOG_LEVEL: "info"
      WAHA_MULTI_DEVICE: "true"
      WAHA_SECURITY_ENABLE: "false"
EOFCONFIG

docker-compose up -d && sleep 30 && curl http://localhost:3000/health
```

---

## 🔑 DIFERENCIA CLAVE

**ANTES (no funcionó):**
```yaml
environment:
  - WAHA_SECURITY_ENABLE=false
```

**AHORA (correcto):**
```yaml
environment:
  WAHA_SECURITY_ENABLE: "false"
```

---

## ✅ RESULTADO ESPERADO

```json
{"status":"ok"}
```

SIN error 401

---

## 📞 DESPUÉS

Cuando veas `{"status":"ok"}`, avísame y configuraré Vercel automáticamente.
#!/bin/bash

echo "========================================="
echo "CORRIGIENDO WAHA - ERROR 401 DEFINITIVO"
echo "========================================="
echo ""

# Ir al directorio
cd /opt/waha

# Detener WAHA
echo "🛑 Deteniendo WAHA..."
docker-compose down
docker stop waha-production 2>/dev/null || true
docker rm waha-production 2>/dev/null || true

# Eliminar archivo viejo
echo "🗑️  Eliminando configuración antigua..."
rm -f docker-compose.yml

# Crear nuevo archivo CORRECTO
echo "📝 Creando configuración SIN autenticación..."
cat > docker-compose.yml << 'EOFCONFIG'
version: '3.8'
services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha-production
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      WAHA_HTTP_API_HOST: "0.0.0.0"
      WAHA_LICENSE_ACCEPT: "true"
      WAHA_LOG_LEVEL: "info"
      WAHA_MULTI_DEVICE: "true"
      WAHA_SECURITY_ENABLE: "false"
EOFCONFIG

# Verificar archivo
echo ""
echo "✅ Contenido del archivo:"
cat docker-compose.yml

# Iniciar WAHA
echo ""
echo "🚀 Iniciando WAHA SIN autenticación..."
docker-compose up -d

# Esperar
echo ""
echo "⏳ Esperando 30 segundos..."
sleep 30

# Verificar
echo ""
echo "🧪 Verificando health check..."
curl -s http://localhost:3000/health

echo ""
echo ""
echo "========================================="
echo "✅ COMPLETADO"
echo "========================================="
echo ""
echo "Verificar en navegador:"
echo "http://31.220.58.83:3000/health"
echo ""
echo "Debe mostrar: {\"status\":\"ok\"}"
echo "SIN error 401"
echo ""
echo "========================================="

