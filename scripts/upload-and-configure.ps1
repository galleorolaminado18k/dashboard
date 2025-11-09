o14# MÉTODO MÁS SIMPLE: Subir archivo y ejecutar

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR WAHA - MÉTODO SIMPLE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "31.220.58.83"

Write-Host "1. Subiendo docker-compose.yml al VPS..." -ForegroundColor Yellow
scp docker-compose-vps-final.yml root@${VPS_IP}:/root/waha/docker-compose.yml

Write-Host "2. Reiniciando WAHA en VPS..." -ForegroundColor Yellow
ssh root@$VPS_IP "cd /root/waha && docker-compose down && docker-compose up -d"

Write-Host ""
Write-Host "3. Esperando 5 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "4. Verificando logs..." -ForegroundColor Yellow
ssh root@$VPS_IP "docker logs waha --tail 15"

Write-Host ""
Write-Host "5. Verificando health..." -ForegroundColor Yellow
ssh root@$VPS_IP "curl -i http://localhost:3000/health"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Verifica desde tu PC con:" -ForegroundColor Cyan
Write-Host "powershell scripts\check-waha-vps.ps1" -ForegroundColor White
Write-Host ""

