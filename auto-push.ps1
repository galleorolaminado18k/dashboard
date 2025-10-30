# Auto Push to GitHub - Script PowerShell
# Este script se ejecuta automáticamente y sube cambios a GitHub

$ErrorActionPreference = "Continue"
Set-Location "C:\Users\USUARIO\WebstormProjects\dashboard"

Write-Host "🔄 AUTO-PUSH ACTIVADO" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si hay cambios
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "✅ No hay cambios pendientes" -ForegroundColor Green
    exit 0
}

Write-Host "📝 Cambios detectados:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Agregar todos los archivos
Write-Host "[1/4] Agregando archivos..." -ForegroundColor Yellow
git add .
Write-Host "✅ Archivos agregados" -ForegroundColor Green
Write-Host ""

# Crear commit con timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMsg = "auto: Cambios automáticos - $timestamp"

Write-Host "[2/4] Creando commit..." -ForegroundColor Yellow
git commit -m "$commitMsg" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit creado: $commitMsg" -ForegroundColor Green
} else {
    Write-Host "⚠️ No hay cambios para commit" -ForegroundColor Yellow
    exit 0
}
Write-Host ""

# Push a GitHub
Write-Host "[3/4] Subiendo a GitHub..." -ForegroundColor Yellow
$branch = git branch --show-current
git push origin $branch 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push exitoso a rama: $branch" -ForegroundColor Green
} else {
    Write-Host "❌ Error en push" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Mostrar último commit
Write-Host "[4/4] Último commit:" -ForegroundColor Yellow
git log --oneline -1
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ AUTO-PUSH COMPLETADO" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

