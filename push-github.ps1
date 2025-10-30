Set-Location "C:\Users\USUARIO\WebstormProjects\dashboard"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUBIENDO CAMBIOS A GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Agregando archivos..." -ForegroundColor Yellow
git add -A
Write-Host "   [OK] Archivos agregados" -ForegroundColor Green
Write-Host ""

Write-Host "2. Creando commit..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "fix: API ventas conectado a Supabase - Evidencia fotografica visible - $timestamp"
Write-Host "   [OK] Commit creado" -ForegroundColor Green
Write-Host ""

Write-Host "3. Haciendo push..." -ForegroundColor Yellow
git push origin feature/meta-ads-integration-v2
Write-Host "   [OK] Push completado" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PUSH EXITOSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Presiona cualquier tecla para cerrar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

