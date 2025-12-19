# ⚡ INSTALACIÓN CORREGIDA - EJECUTAR AHORA

## 🔴 EL PROBLEMA

El comando estaba en una sola línea y causaba error de sintaxis.

---

## ✅ SOLUCIÓN: 3 OPCIONES

### **OPCIÓN 1: Script desde GitHub (RECOMENDADO)**

```bash
# Conectar a VPS
ssh root@31.220.58.83

# Descargar y ejecutar script
curl -o install.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/install-waha-vps-fixed.sh && chmod +x install.sh && ./install.sh
```

---

### **OPCIÓN 2: Comando por comando (MÁS SEGURO)**

Conectar SSH:
```bash
ssh root@31.220.58.83
```

Luego ejecutar **uno por uno**:

```bash
# 1. Actualizar sistema
apt update -y

# 2. Instalar paquetes
apt install -y curl docker.io docker-compose ufw

# 3. Iniciar Docker
systemctl start docker
systemctl enable docker

# 4. Configurar firewall
ufw allow 22/tcp
ufw allow 3000/tcp
echo "y" | ufw enable

# 5. Crear directorio
mkdir -p /opt/waha
cd /opt/waha

# 6. Crear docker-compose.yml (COPIAR TODO DESDE AQUÍ)
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

# 7. Iniciar WAHA
docker-compose up -d

# 8. Esperar
sleep 30

# 9. Verificar
curl http://localhost:3000/health

# 10. Ver URL pública
echo "URL: http://$(curl -s ifconfig.me):3000"
```

---

### **OPCIÓN 3: Crear archivo manualmente**

```bash
# En el VPS
nano install.sh

# Copiar el contenido del archivo install-waha-vps-fixed.sh
# Guardar: Ctrl+X, Y, Enter

chmod +x install.sh
./install.sh
```

---

## 🧪 VERIFICAR INSTALACIÓN

```bash
# 1. Ver estado de Docker
docker ps

# 2. Ver logs de WAHA
docker logs waha-production

# 3. Test health
curl http://localhost:3000/health

# 4. Test desde internet
curl http://31.220.58.83:3000/health
```

---

## 📋 CONFIGURAR EN VERCEL

**URL de WAHA:** `http://31.220.58.83:3000`

1. https://vercel.com/dashboard
2. Proyecto → Settings → Environment Variables
3. Add New:
   - Name: `WAHA_BASE_URL`
   - Value: `http://31.220.58.83:3000`
4. Save
5. Esperar 2 min (redeploy)

---

## ✅ PROBAR DASHBOARD

1. https://dashboard-galle.vercel.app/configuracion
2. Conectar WhatsApp
3. ✅ QR debe aparecer
4. Escanear
5. ✅ Funciona 24/7

---

## 🆘 SI SIGUE FALLANDO

**Ver el error exacto:**
```bash
# Ejecutar comando por comando y ver dónde falla
# Compartir el mensaje de error
```

**Verificar Docker:**
```bash
systemctl status docker
```

**Reinstalar Docker si es necesario:**
```bash
apt remove -y docker.io docker-compose
apt install -y docker.io docker-compose
systemctl start docker
```

---

**Tiempo:** 10 minutos  
**Método recomendado:** OPCIÓN 2 (comando por comando)
#!/bin/bash

# ========================================
# 🚀 INSTALACIÓN WAHA - SCRIPT CORREGIDO
# ========================================

set -e  # Salir si hay error

echo "======================================"
echo "🚀 Instalando WAHA en VPS"
echo "======================================"
echo ""

# Paso 1: Actualizar e instalar paquetes
echo "📦 [1/6] Instalando paquetes necesarios..."
apt update -y
apt install -y curl docker.io docker-compose ufw

# Paso 2: Iniciar Docker
echo "🐋 [2/6] Iniciando Docker..."
systemctl start docker
systemctl enable docker

# Paso 3: Configurar firewall
echo "🔥 [3/6] Configurando firewall..."
ufw allow 22/tcp
ufw allow 3000/tcp
echo "y" | ufw enable

# Paso 4: Crear directorio
echo "📁 [4/6] Creando directorio..."
mkdir -p /opt/waha
cd /opt/waha

# Paso 5: Crear docker-compose.yml
echo "📝 [5/6] Creando docker-compose.yml..."
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

# Paso 6: Iniciar WAHA
echo "🚀 [6/6] Iniciando WAHA..."
docker-compose up -d

# Esperar a que inicie
echo "⏳ Esperando 30 segundos a que WAHA inicie..."
sleep 30

# Verificar
echo ""
echo "🧪 Verificando instalación..."
curl -s http://localhost:3000/health

echo ""
echo ""
echo "======================================"
echo "✅ INSTALACIÓN COMPLETADA"
echo "======================================"
echo ""
echo "📍 URL de WAHA:"
echo "   http://$(curl -s ifconfig.me):3000"
echo ""
echo "🔧 Configurar en Vercel:"
echo "   WAHA_BASE_URL = http://$(curl -s ifconfig.me):3000"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs:     docker logs -f waha-production"
echo "   Reiniciar:    docker restart waha-production"
echo "   Estado:       docker ps"
echo ""
echo "======================================"

