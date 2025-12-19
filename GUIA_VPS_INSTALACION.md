# 🚀 GUÍA: CONFIGURAR WAHA EN TU VPS

## 📋 INFORMACIÓN DE TU VPS

**IP:** 31.220.58.83  
**SO:** Ubuntu 24.04 LTS  
**Usuario:** root  
**Contraseña:** S@ntiago  
**Acceso SSH:** `ssh root@31.220.58.83`

---

## ⚡ INSTALACIÓN RÁPIDA (5 MINUTOS)

### **Paso 1: Conectar por SSH**

```bash
# Desde tu PC Windows (PowerShell o CMD)
ssh root@31.220.58.83

# Cuando pida contraseña: S@ntiago
# (la contraseña no se ve al escribir, es normal)
```

### **Paso 2: Subir script de instalación**

**Opción A: Copiar y pegar directo (RECOMENDADO)**

```bash
# En el VPS, ejecutar:
curl -o install-waha.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/scripts/install-waha-vps.sh

chmod +x install-waha.sh
./install-waha.sh
```

**Opción B: Crear archivo manualmente**

```bash
# En el VPS:
nano install-waha.sh

# Copiar el contenido del archivo:
# scripts/install-waha-vps.sh

# Guardar: Ctrl+X, Y, Enter

chmod +x install-waha.sh
./install-waha.sh
```

### **Paso 3: Esperar instalación**

El script hará automáticamente:
- ✅ Actualizar sistema
- ✅ Instalar Docker
- ✅ Configurar firewall
- ✅ Descargar e iniciar WAHA
- ✅ Verificar funcionamiento

**Tiempo:** ~5 minutos

### **Paso 4: Verificar WAHA funcionando**

```bash
# Test desde el VPS
curl http://localhost:3000/health

# Debe responder: {"status":"ok"}
```

### **Paso 5: Obtener URL pública**

```bash
# Desde el VPS
curl ifconfig.me

# Te dará: 31.220.58.83
```

**URL completa de WAHA:** `http://31.220.58.83:3000`

---

## 🔧 CONFIGURAR EN VERCEL

### **Paso 1: Ir a Vercel**
```
https://vercel.com/dashboard
```

### **Paso 2: Variables de entorno**
```
1. Seleccionar proyecto: dashboard-galle
2. Settings → Environment Variables
3. Add New:

   Name:  WAHA_BASE_URL
   Value: http://31.220.58.83:3000

   Apply to:
   ☑ Production
   ☑ Preview
   ☑ Development

4. Save
```

### **Paso 3: Redeploy**
```
Vercel hace redeploy automático al guardar variables
Esperar 2-3 minutos
```

### **Paso 4: Probar**
```
1. https://dashboard-galle.vercel.app/configuracion
2. Ingresar: +57 3012439596
3. Click: "Conectar WhatsApp"
4. ✅ Debe aparecer QR SIN ERROR
5. Escanear con WhatsApp Business
6. ✅ FUNCIONA 24/7
```

---

## 🔒 CONFIGURAR HTTPS (RECOMENDADO)

⚠️ **IMPORTANTE:** HTTP funciona, pero HTTPS es más seguro y evita problemas con Mixed Content.

### **Opción 1: Con dominio propio**

**Requisitos:**
- Tener un dominio (ej: tudominio.com)
- Acceso al panel DNS

**Pasos:**

1. **Configurar DNS:**
   ```
   En tu proveedor DNS (Cloudflare, GoDaddy, etc):
   
   Tipo: A
   Nombre: waha (o subdomain que quieras)
   IP: 31.220.58.83
   TTL: Auto
   ```

2. **Esperar propagación:** 5-10 minutos

3. **Ejecutar script SSL en VPS:**
   ```bash
   ssh root@31.220.58.83
   
   curl -o install-ssl.sh https://raw.githubusercontent.com/galleorolaminado18k/dashboard/feature/meta-ads-integration-v2/scripts/install-nginx-ssl.sh
   
   chmod +x install-ssl.sh
   ./install-ssl.sh
   
   # Cuando pregunte dominio: waha.tudominio.com
   # Cuando pregunte email: tu@email.com
   ```

4. **Configurar en Vercel:**
   ```
   WAHA_BASE_URL = https://waha.tudominio.com
   ```

### **Opción 2: Con Cloudflare Tunnel (GRATIS, SIN DOMINIO)**

```bash
# En el VPS
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
mv cloudflared /usr/local/bin/

# Iniciar túnel
cloudflared tunnel --url http://localhost:3000

# Copiar URL que aparece (ej: https://abc123.trycloudflare.com)
# Configurar en Vercel: WAHA_BASE_URL = esa URL
```

⚠️ **Nota:** Con túnel, debes mantener el comando corriendo. Para hacerlo permanente, crear servicio systemd.

---

## 📊 COMANDOS ÚTILES

### **Ver logs de WAHA:**
```bash
docker logs -f waha-production
```

### **Reiniciar WAHA:**
```bash
docker restart waha-production
```

### **Detener WAHA:**
```bash
docker stop waha-production
```

### **Iniciar WAHA:**
```bash
docker start waha-production
```

### **Ver estado:**
```bash
docker ps
```

### **Actualizar WAHA:**
```bash
cd /opt/waha
docker compose pull
docker compose up -d
```

---

## 🆘 TROUBLESHOOTING

### **Error: Connection refused al conectar SSH**
```bash
# Verificar que el VPS esté encendido
# Verificar IP correcta: 31.220.58.83
# Verificar firewall local no bloquea puerto 22
```

### **Error: WAHA no responde**
```bash
# Ver logs
docker logs waha-production

# Verificar Docker corriendo
systemctl status docker

# Reiniciar WAHA
docker restart waha-production
```

### **Error: Vercel sigue WAHA_UNREACHABLE**
```bash
# Verificar firewall VPS permite puerto 3000
sudo ufw status

# Si no permite:
sudo ufw allow 3000/tcp

# Test desde internet
curl http://31.220.58.83:3000/health

# Debe responder: {"status":"ok"}
```

### **Error: Puerto 3000 bloqueado**
```bash
# Abrir puerto en firewall
sudo ufw allow 3000/tcp
sudo ufw reload

# Verificar
sudo ufw status
```

---

## 🔐 SEGURIDAD

### **Cambiar contraseña root (RECOMENDADO):**
```bash
passwd root
# Ingresar nueva contraseña segura
```

### **Crear usuario no-root:**
```bash
adduser admin
usermod -aG sudo admin
```

### **Configurar autenticación por clave SSH:**
```bash
# En tu PC local, generar clave
ssh-keygen -t ed25519

# Copiar clave al VPS
ssh-copy-id root@31.220.58.83

# Deshabilitar login con contraseña
nano /etc/ssh/sshd_config
# Cambiar: PasswordAuthentication no
systemctl restart sshd
```

---

## 💰 COSTOS

**Tu VPS:**
- Costo depende de tu proveedor
- Mantener corriendo 24/7: Sin cargo adicional
- WAHA: Gratis (open source)
- Let's Encrypt SSL: Gratis

---

## 📋 CHECKLIST FINAL

- [ ] VPS corriendo y accesible por SSH
- [ ] Docker instalado
- [ ] WAHA corriendo en Docker
- [ ] Puerto 3000 abierto en firewall
- [ ] Health check responde OK
- [ ] `WAHA_BASE_URL` configurada en Vercel
- [ ] Redeploy Vercel completado
- [ ] QR aparece sin error en UI
- [ ] WhatsApp conectado exitosamente
- [ ] ✅ Sistema funcionando 24/7

---

## 🎯 RESUMEN

**Tu configuración final será:**

```
VPS (31.220.58.83)
  ↓
Docker + WAHA
  ↓
http://31.220.58.83:3000 (o https con dominio)
  ↓
Vercel (WAHA_BASE_URL)
  ↓
Dashboard funcionando 24/7
```

---

**Última actualización:** 2025-11-06  
**Autor:** GitHub Copilot  
**Soporte:** Ver documentación en /scripts/
#!/bin/bash

# ========================================
# 🚀 INSTALACIÓN AUTOMÁTICA WAHA EN VPS
# ========================================

echo "========================================="
echo "🚀 Instalando WAHA en VPS Ubuntu 24.04"
echo "========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para logs
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ========================================
# PASO 1: Actualizar sistema
# ========================================
echo "📦 [1/7] Actualizando sistema..."
apt update -y && apt upgrade -y
log_success "Sistema actualizado"

# ========================================
# PASO 2: Instalar Docker
# ========================================
echo ""
echo "🐋 [2/7] Instalando Docker..."

# Remover versiones antiguas
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Instalar dependencias
apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Agregar GPG key de Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Agregar repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt update -y
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Iniciar Docker
systemctl start docker
systemctl enable docker

log_success "Docker instalado y funcionando"

# ========================================
# PASO 3: Configurar Firewall
# ========================================
echo ""
echo "🔥 [3/7] Configurando firewall..."

# Instalar UFW si no está
apt install -y ufw

# Permitir SSH (IMPORTANTE)
ufw allow 22/tcp
ufw allow OpenSSH

# Permitir puerto 3000 (WAHA)
ufw allow 3000/tcp

# Permitir HTTP/HTTPS (para Nginx después)
ufw allow 80/tcp
ufw allow 443/tcp

# Habilitar firewall
echo "y" | ufw enable

log_success "Firewall configurado"

# ========================================
# PASO 4: Crear directorio para WAHA
# ========================================
echo ""
echo "📁 [4/7] Creando directorios..."

mkdir -p /opt/waha/data
chmod 755 /opt/waha
chmod 777 /opt/waha/data

log_success "Directorios creados"

# ========================================
# PASO 5: Crear docker-compose.yml
# ========================================
echo ""
echo "📝 [5/7] Creando configuración Docker..."

cat > /opt/waha/docker-compose.yml <<'EOF'
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
      # API Configuration
      - WAHA_HTTP_API_HOST=0.0.0.0
      - WAHA_LICENSE_ACCEPT=true
      - WAHA_LOG_LEVEL=info
      - WAHA_MULTI_DEVICE=true
      # Opcional: descomentar para autenticación
      # - WAHA_API_KEY=tu-api-key-secreta-aqui
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  default:
    name: waha-network
EOF

log_success "Configuración creada"

# ========================================
# PASO 6: Iniciar WAHA
# ========================================
echo ""
echo "🚀 [6/7] Iniciando WAHA..."

cd /opt/waha
docker compose pull
docker compose up -d

# Esperar a que inicie
echo "⏳ Esperando a que WAHA inicie (30 segundos)..."
sleep 30

log_success "WAHA iniciado"

# ========================================
# PASO 7: Verificar instalación
# ========================================
echo ""
echo "🧪 [7/7] Verificando instalación..."

# Test health endpoint
HEALTH_CHECK=$(curl -s http://localhost:3000/health 2>/dev/null)

if echo "$HEALTH_CHECK" | grep -q "ok"; then
    log_success "WAHA está funcionando correctamente"
else
    log_error "WAHA no responde al health check"
    echo "Ver logs: docker logs waha-production"
fi

# ========================================
# INFORMACIÓN FINAL
# ========================================
echo ""
echo "========================================="
echo "✅ INSTALACIÓN COMPLETADA"
echo "========================================="
echo ""
echo "📋 Información del servidor:"
echo "   URL pública: http://$(curl -s ifconfig.me):3000"
echo "   Health check: http://$(curl -s ifconfig.me):3000/health"
echo "   API Base: http://$(curl -s ifconfig.me):3000/api"
echo ""
echo "🔧 Comandos útiles:"
echo "   Ver logs:     docker logs -f waha-production"
echo "   Reiniciar:    docker restart waha-production"
echo "   Detener:      docker stop waha-production"
echo "   Estado:       docker ps"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Configurar Nginx con SSL (recomendado)"
echo "   2. Agregar dominio con Let's Encrypt"
echo "   3. Configurar WAHA_BASE_URL en Vercel"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Guarda esta IP: $(curl -s ifconfig.me)"
echo "   - Configura en Vercel: WAHA_BASE_URL=http://$(curl -s ifconfig.me):3000"
echo "   - Para HTTPS, instala Nginx + Certbot (ver script adicional)"
echo ""
echo "========================================="

