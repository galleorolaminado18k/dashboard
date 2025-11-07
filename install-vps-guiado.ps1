# ========================================
# INSTALACIÓN MANUAL GUIADA - PASO A PASO
# ========================================

Write-Host @"
========================================
🚀 INSTALACIÓN WAHA EN VPS
========================================

VPS IP: 31.220.58.83
Usuario: root
Contraseña: S@ntiago

========================================
INSTRUCCIONES
========================================

Voy a mostrarte EXACTAMENTE qué copiar y pegar.
Abre otra ventana de PowerShell y sigue los pasos.

"@ -ForegroundColor Cyan

Write-Host "`n🔴 PASO 1: Conectar SSH`n" -ForegroundColor Yellow
Write-Host "Copiar y pegar esto:" -ForegroundColor White
Write-Host "ssh root@31.220.58.83`n" -ForegroundColor Green

Read-Host "Presiona Enter cuando hayas conectado"

Write-Host "`n🔴 PASO 2: Actualizar sistema`n" -ForegroundColor Yellow
Write-Host "Copiar y pegar esto:" -ForegroundColor White
Write-Host "apt update -y`n" -ForegroundColor Green

Read-Host "Presiona Enter cuando termine"

Write-Host "`n🔴 PASO 3: Instalar paquetes`n" -ForegroundColor Yellow
Write-Host "Copiar y pegar esto:" -ForegroundColor White
Write-Host "apt install -y curl docker.io docker-compose ufw`n" -ForegroundColor Green

Read-Host "Presiona Enter cuando termine"

Write-Host "`n🔴 PASO 4: Iniciar Docker`n" -ForegroundColor Yellow
Write-Host "Copiar y pegar esto:" -ForegroundColor White
Write-Host @"
systemctl start docker
systemctl enable docker

"@ -ForegroundColor Green

Read-Host "Presiona Enter cuando termine"

Write-Host "`n🔴 PASO 5: Configurar firewall`n" -ForegroundColor Yellow
Write-Host "Copiar y pegar esto:" -ForegroundColor White
Write-Host @"
ufw allow 22/tcp
ufw allow 3000/tcp
echo "y" | ufw enable

"@ -ForegroundColor Green

Read-Host "Presiona Enter cuando termine"

Write-Host "`n🔴 PASO 6: Crear directorio`n" -ForegroundColor Yellow
Write-Host "Copiar y pegar esto:" -ForegroundColor White
Write-Host @"
mkdir -p /opt/waha
cd /opt/waha

"@ -ForegroundColor Green

Read-Host "Presiona Enter cuando termine"

Write-Host "`n🔴 PASO 7: Crear docker-compose.yml`n" -ForegroundColor Yellow
Write-Host "⚠️  IMPORTANTE: Copiar TODO el bloque siguiente:" -ForegroundColor Red
Write-Host @"
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

"@ -ForegroundColor Green

Read-Host "Presiona Enter cuando termine"

Write-Host "`n🔴 PASO 8: Iniciar WAHA`n" -ForegroundColor Yellow
Write-Host "Copiar y pegar esto:" -ForegroundColor White
Write-Host "docker-compose up -d`n" -ForegroundColor Green

Read-Host "Presiona Enter cuando termine"

Write-Host "`n🔴 PASO 9: Esperar y verificar`n" -ForegroundColor Yellow
Write-Host "Copiar y pegar esto:" -ForegroundColor White
Write-Host @"
sleep 30
curl http://localhost:3000/health

"@ -ForegroundColor Green

Read-Host "Presiona Enter cuando veas {`"status`":`"ok`"}"

Write-Host "`n🔴 PASO 10: Ver URL pública`n" -ForegroundColor Yellow
Write-Host "Copiar y pegar esto:" -ForegroundColor White
Write-Host 'echo "URL: http://$(curl -s ifconfig.me):3000"' -ForegroundColor Green
Write-Host ""

Read-Host "Presiona Enter cuando veas la URL"

Write-Host @"

========================================
✅ INSTALACIÓN COMPLETADA
========================================

📍 URL de WAHA: http://31.220.58.83:3000

🔧 SIGUIENTE PASO:

1. Ir a: https://vercel.com/dashboard
2. Tu proyecto → Settings → Environment Variables
3. Add New:
   Name: WAHA_BASE_URL
   Value: http://31.220.58.83:3000
4. Save
5. Esperar 2 minutos

🧪 PROBAR:
https://dashboard-galle.vercel.app/configuracion
→ Conectar WhatsApp
→ ✅ QR debe aparecer

========================================

"@ -ForegroundColor Green

Read-Host "Presiona Enter para salir"

