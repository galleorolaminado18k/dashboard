# Script de Auto-Commit y Push a GitHub
# Este script detecta cambios, hace commit y push automáticamente

Write-Host "🔍 Verificando cambios en el repositorio..." -ForegroundColor Cyan

# Navegar al directorio del proyecto
Set-Location -Path $PSScriptRoot\..

# Verificar si hay cambios
$status = git status --porcelain

if ($status) {
    Write-Host "📝 Cambios detectados. Procesando..." -ForegroundColor Yellow

    # Agregar todos los cambios
    git add .
    Write-Host "✅ Archivos agregados al staging area" -ForegroundColor Green

    # Crear mensaje de commit automático con timestamp
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "Auto-commit: Actualización automática - $timestamp"

    # Hacer commit
    git commit -m $commitMessage
    Write-Host "✅ Commit creado: $commitMessage" -ForegroundColor Green

    # Obtener la rama actual
    $branch = git rev-parse --abbrev-ref HEAD

    # Push a GitHub
    git push origin $branch
    Write-Host "🚀 Cambios subidos a GitHub en la rama: $branch" -ForegroundColor Green
    Write-Host "✨ ¡Todo sincronizado exitosamente!" -ForegroundColor Cyan
} else {
    Write-Host "✅ No hay cambios para subir" -ForegroundColor Green
}

