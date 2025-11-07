# ⚡ EJECUTAR EN TU VPS - COPIAR Y PEGAR

## 🎯 PASO 1: Conectar SSH

Abre **PowerShell** o **CMD** en Windows y ejecuta:

```bash
ssh root@31.220.58.83
```

**Contraseña:** `S@ntiago`

---

## 🎯 PASO 2: Ejecutar este comando (TODO EN UNO)

**COPIAR Y PEGAR ESTO COMPLETO:**

```bash
apt update -y && apt install -y curl docker.io docker-compose ufw && systemctl start docker && systemctl enable docker && ufw allow 22/tcp && ufw allow 3000/tcp && echo "y" | ufw enable && mkdir -p /opt/waha && cd /opt/waha && cat > docker-compose.yml <<'EOF'
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
      - WAHA_HTTP_API_HOST=0.0.0.0
      - WAHA_LICENSE_ACCEPT=true
      - WAHA_LOG_LEVEL=info
      - WAHA_MULTI_DEVICE=true
EOF
docker-compose up -d && sleep 30 && curl http://localhost:3000/health && echo "" && echo "✅ WAHA instalado en: http://$(curl -s ifconfig.me):3000"
```

**Presionar ENTER y esperar 5 minutos**

---

## 🎯 PASO 3: Verificar que funciona

En el VPS, ejecutar:

```bash
curl http://localhost:3000/health
```

**Debe responder:** `{"status":"ok"}`

---

## 🎯 PASO 4: Configurar en Vercel

**Tu URL de WAHA será:** `http://31.220.58.83:3000`

1. Ir a: https://vercel.com/dashboard
2. Tu proyecto → Settings → Environment Variables
3. Add New:
   - Name: `WAHA_BASE_URL`
   - Value: `http://31.220.58.83:3000`
4. Save
5. Esperar 2 minutos (redeploy)

---

## 🎯 PASO 5: Probar Dashboard

1. Ir a: https://dashboard-galle.vercel.app/configuracion
2. Ingresar: +57 3012439596
3. Click: "Conectar WhatsApp"
4. ✅ **QR APARECE**
5. Escanear con WhatsApp
6. ✅ **FUNCIONA 24/7**

---

## 📊 Comandos útiles después

```bash
# Ver logs
docker logs -f waha-production

# Reiniciar
docker restart waha-production

# Estado
docker ps

# Detener
docker stop waha-production

# Iniciar
docker start waha-production
```

---

## 🆘 Si algo falla

**Ver logs:**
```bash
docker logs waha-production
```

**Reiniciar todo:**
```bash
cd /opt/waha
docker-compose down
docker-compose up -d
```

**Verificar firewall:**
```bash
ufw status
```

**Abrir puerto si está cerrado:**
```bash
ufw allow 3000/tcp
```

---

**Tiempo total:** 5-10 minutos  
**Resultado:** WAHA funcionando 24/7 en `http://31.220.58.83:3000`
#!/bin/bash

# ========================================
# 🚀 INSTALACIÓN WAHA - VERSIÓN SIMPLIFICADA
# ========================================

echo "======================================"
echo "🚀 Instalando WAHA en VPS"
echo "======================================"

# Actualizar sistema
echo "📦 Actualizando sistema..."
apt update -y && apt upgrade -y

# Instalar Docker
echo "🐋 Instalando Docker..."
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# Configurar firewall
echo "🔥 Configurando firewall..."
apt install -y ufw
ufw allow 22/tcp
ufw allow 3000/tcp
echo "y" | ufw enable

# Crear directorio
echo "📁 Creando directorios..."
mkdir -p /opt/waha
cd /opt/waha

# Crear docker-compose.yml
echo "📝 Creando configuración..."
cat > docker-compose.yml <<'EOF'
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
      - WAHA_HTTP_API_HOST=0.0.0.0
      - WAHA_LICENSE_ACCEPT=true
      - WAHA_LOG_LEVEL=info
      - WAHA_MULTI_DEVICE=true
EOF

# Iniciar WAHA
echo "🚀 Iniciando WAHA..."
docker compose up -d

# Esperar
echo "⏳ Esperando 30 segundos..."
sleep 30

# Verificar
echo "🧪 Verificando instalación..."
curl -s http://localhost:3000/health

echo ""
echo "======================================"
echo "✅ INSTALACIÓN COMPLETA"
echo "======================================"
echo ""
echo "URL: http://$(curl -s ifconfig.me):3000"
echo ""
echo "Configurar en Vercel:"
echo "WAHA_BASE_URL = http://$(curl -s ifconfig.me):3000"
echo ""
echo "======================================"

