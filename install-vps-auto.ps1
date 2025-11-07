# Script de instalación automática WAHA en VPS
# PowerShell

$password = "S@ntiago"
$vpsIP = "31.220.58.83"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTALANDO WAHA EN VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Crear script de instalación
$installScript = @'
#!/bin/bash
set -e
echo "📦 Instalando paquetes..."
apt install -y curl docker.io docker-compose ufw 2>&1

echo "🐋 Iniciando Docker..."
systemctl start docker
systemctl enable docker

echo "🔥 Configurando firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 3000/tcp

echo "📁 Creando directorio..."
mkdir -p /opt/waha
cd /opt/waha

echo "📝 Creando docker-compose.yml..."
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

echo "🚀 Iniciando WAHA..."
docker-compose up -d

echo "⏳ Esperando 30 segundos..."
sleep 30

echo "🧪 Verificando..."
curl -s http://localhost:3000/health

echo ""
echo "✅ INSTALACIÓN COMPLETADA"
echo "URL: http://$(curl -s ifconfig.me):3000"
'@

# Guardar script temporalmente
$installScript | Out-File -FilePath "install-temp.sh" -Encoding ASCII -NoNewline

Write-Host "📤 Subiendo script al VPS..." -ForegroundColor Yellow

# Subir script usando SCP
$scpCommand = "scp"
$scpArgs = @("-o", "StrictHostKeyChecking=no", "install-temp.sh", "root@${vpsIP}:/tmp/install-waha.sh")

$env:SSHPASS = $password
& $scpCommand $scpArgs

Write-Host "🚀 Ejecutando instalación en VPS..." -ForegroundColor Yellow
Write-Host ""

# Ejecutar script
$sshCommand = "ssh"
$sshArgs = @("-o", "StrictHostKeyChecking=no", "root@${vpsIP}", "chmod +x /tmp/install-waha.sh && /tmp/install-waha.sh")

& $sshCommand $sshArgs

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ INSTALACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URL de WAHA: http://31.220.58.83:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Configurar en Vercel:" -ForegroundColor Yellow
Write-Host "   WAHA_BASE_URL = http://31.220.58.83:3000" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Verificar:" -ForegroundColor Yellow
Write-Host "   http://31.220.58.83:3000/health" -ForegroundColor White
Write-Host ""

# Limpiar archivo temporal
Remove-Item "install-temp.sh" -ErrorAction SilentlyContinue

Read-Host "Presiona Enter para continuar"

