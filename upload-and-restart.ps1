#!/usr/bin/env pwsh

Write-Host "🚀 COPIANDO CONFIGURACIÓN CORREGIDA AL VPS..." -ForegroundColor Cyan
Write-Host ""

$vps = "31.220.58.83"
$user = "root"
$localFile = "docker-compose-corrected.yml"
$remotePath = "/opt/waha/docker-compose.yml"

Write-Host "Archivo local: $localFile" -ForegroundColor Gray
Write-Host "Destino: $user@${vps}:$remotePath" -ForegroundColor Gray
Write-Host ""

# Intentar con SCP
Write-Host "📤 Copiando archivo..." -ForegroundColor Yellow

$scpCommand = "scp -o StrictHostKeyChecking=no $localFile ${user}@${vps}:$remotePath"

Write-Host "Ejecutando: $scpCommand" -ForegroundColor Gray
Write-Host "Contraseña: S@ntiago" -ForegroundColor Gray
Write-Host ""

# Ejecutar SCP
& scp -o StrictHostKeyChecking=no $localFile "${user}@${vps}:$remotePath"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Archivo copiado exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Reiniciando WAHA..." -ForegroundColor Yellow

    # Reiniciar WAHA
    ssh -o StrictHostKeyChecking=no $user@$vps "cd /opt/waha && docker-compose down && docker-compose up -d"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ WAHA reiniciado" -ForegroundColor Green
        Write-Host ""
        Write-Host "⏳ Esperando 30 segundos..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30

        Write-Host "🧪 Verificando..." -ForegroundColor Yellow
        ssh -o StrictHostKeyChecking=no $user@$vps "curl -s http://localhost:3000/health"
    }
} else {
    Write-Host "❌ Error al copiar archivo" -ForegroundColor Red
    Write-Host ""
    Write-Host "ALTERNATIVA: Copia manualmente el archivo con WinSCP o ejecuta:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ssh root@31.220.58.83" -ForegroundColor White
    Write-Host "cd /opt/waha && docker-compose down && cat > docker-compose.yml <<'EOF'" -ForegroundColor White
    Get-Content $localFile | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    Write-Host "EOF" -ForegroundColor White
    Write-Host "docker-compose up -d" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICAR EN NAVEGADOR:" -ForegroundColor Yellow
Write-Host "http://31.220.58.83:3000/health" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

