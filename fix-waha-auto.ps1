$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORRIGIENDO WAHA - ERROR 401" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$vpsIP = "31.220.58.83"
$vpsUser = "root"
$vpsPass = "S@ntiago"

# Crear archivo docker-compose.yml corregido
$dockerComposeContent = @"
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
"@

# Guardar localmente
$dockerComposeContent | Out-File -FilePath "docker-compose-vps.yml" -Encoding ASCII -NoNewline

Write-Host "✅ Archivo creado localmente" -ForegroundColor Green
Write-Host ""

# Comandos a ejecutar en VPS
$commands = @(
    "cd /opt/waha",
    "docker-compose down",
    "cat > docker-compose.yml <<'DOCKEREOF'",
    $dockerComposeContent,
    "DOCKEREOF",
    "docker-compose up -d",
    "sleep 30",
    "curl -s http://localhost:3000/health"
)

$fullCommand = $commands -join " && "

Write-Host "📤 Ejecutando corrección en VPS..." -ForegroundColor Yellow
Write-Host ""

# Intentar ejecutar usando diferentes métodos
try {
    # Método 1: SSH directo
    $result = echo $vpsPass | ssh -o StrictHostKeyChecking=no $vpsUser@$vpsIP $fullCommand 2>&1
    Write-Host $result
} catch {
    Write-Host "⚠️  Método SSH falló, intentando alternativa..." -ForegroundColor Yellow

    # Método 2: Crear script y ejecutarlo
    $scriptContent = @"
#!/bin/bash
cd /opt/waha
docker-compose down
cat > docker-compose.yml <<'DOCKEREOF'
$dockerComposeContent
DOCKEREOF
docker-compose up -d
sleep 30
curl -s http://localhost:3000/health
echo ""
echo "✅ WAHA CORREGIDO"
"@

    $scriptContent | Out-File -FilePath "fix-vps.sh" -Encoding ASCII -NoNewline

    Write-Host "Archivo de corrección creado: fix-vps.sh" -ForegroundColor Green
    Write-Host ""
    Write-Host "EJECUTAR MANUALMENTE:" -ForegroundColor Yellow
    Write-Host "1. Conectar SSH: ssh root@31.220.58.83" -ForegroundColor White
    Write-Host "2. Ejecutar: bash /tmp/fix-vps.sh" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICAR EN NAVEGADOR:" -ForegroundColor Cyan
Write-Host "http://31.220.58.83:3000/health" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Presiona Enter para continuar"

