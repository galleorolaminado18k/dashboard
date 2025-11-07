#!/usr/bin/env pwsh

$password = "S@ntiago"
$server = "31.220.58.83"

Write-Host "🔧 Corrigiendo WAHA automáticamente..." -ForegroundColor Cyan

# Crear script de corrección
$fixScript = @'
#!/bin/bash
cd /opt/waha
docker-compose down
cat > docker-compose.yml << 'EOF'
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
      - WAHA_SECURITY_ENABLE=false
EOF
docker-compose up -d
sleep 30
curl -s http://localhost:3000/health
'@

# Guardar script
$fixScript | Out-File -FilePath "fix_waha.sh" -Encoding ASCII -NoNewline

Write-Host "📤 Conectando a VPS..." -ForegroundColor Yellow

# Usar plink si está disponible, sino SSH
# Método directo: ejecutar comandos via SSH
Write-Host "Ejecutando corrección via SSH..." -ForegroundColor Green

$sshCommands = @"
cd /opt/waha && docker-compose down && cat > docker-compose.yml <<'DOCKEREOF'
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
      - WAHA_SECURITY_ENABLE=false
DOCKEREOF
docker-compose up -d && sleep 30 && curl -s http://localhost:3000/health
"@

# Ejecutar via SSH (requiere ingreso manual de contraseña)
ssh -o StrictHostKeyChecking=no root@$server $sshCommands

Write-Host "`n✅ Corrección aplicada" -ForegroundColor Green
Write-Host "Verificar: http://31.220.58.83:3000/health" -ForegroundColor Cyan

Remove-Item fix_waha.sh -ErrorAction SilentlyContinue
Host vps-waha
    HostName 31.220.58.83
    User root
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null

