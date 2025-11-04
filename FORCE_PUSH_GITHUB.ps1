Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FORZANDO PUSH A GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "C:\Users\USUARIO\WebstormProjects\dashboard"

Write-Host "[1/5] Verificando estado actual..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "Cambios pendientes encontrados:" -ForegroundColor Green
    Write-Host $status
} else {
    Write-Host "No hay cambios pendientes" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2/5] Agregando todos los archivos..." -ForegroundColor Yellow
git add -A
Write-Host "✓ Archivos agregados" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Creando commit..." -ForegroundColor Yellow
$commitMessage = "✅ AUTO-PUSH: Modal facturación mejorado + Fix ventas/page.tsx corrupto"
git commit -m $commitMessage
Write-Host "✓ Commit creado" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Verificando rama actual..." -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "Rama: $branch" -ForegroundColor Cyan

Write-Host ""
Write-Host "[5/5] HACIENDO PUSH A GITHUB..." -ForegroundColor Yellow
Write-Host "Ejecutando: git push origin $branch" -ForegroundColor Gray
$pushResult = git push origin $branch 2>&1
Write-Host $pushResult

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ PUSH EXITOSO A GITHUB" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifica en: https://github.com/galleorolaminado18k/dashboard/tree/$branch" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ ERROR EN EL PUSH" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Código de error: $LASTEXITCODE" -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

