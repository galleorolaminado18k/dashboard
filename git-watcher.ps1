# Git Auto-Push Watcher
# Este script observa cambios y hace push automático cada 5 minutos

$ErrorActionPreference = "Continue"
$projectPath = "C:\Users\USUARIO\WebstormProjects\dashboard"
Set-Location $projectPath

Write-Host "🔍 GIT AUTO-PUSH WATCHER INICIADO" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "📁 Directorio: $projectPath" -ForegroundColor Cyan
Write-Host "⏰ Intervalo: 5 minutos" -ForegroundColor Cyan
Write-Host "🔄 Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

$interval = 300 # 5 minutos en segundos
$counter = 0

while ($true) {
    $counter++
    $timestamp = Get-Date -Format "HH:mm:ss"

    Write-Host "[$timestamp] Verificando cambios... (Ciclo #$counter)" -ForegroundColor Cyan

    # Verificar si hay cambios
    $status = git status --porcelain

    if (![string]::IsNullOrEmpty($status)) {
        Write-Host "📝 Cambios detectados:" -ForegroundColor Yellow
        git status --short
        Write-Host ""

        Write-Host "🚀 Ejecutando auto-push..." -ForegroundColor Green
        & "$projectPath\auto-push.ps1"
        Write-Host ""
    } else {
        Write-Host "✅ No hay cambios pendientes" -ForegroundColor Green
        Write-Host ""
    }

    Write-Host "⏳ Esperando $interval segundos hasta la próxima verificación..." -ForegroundColor Gray
    Write-Host "---" -ForegroundColor DarkGray
    Write-Host ""

    Start-Sleep -Seconds $interval
}

