# PowerShell script para commit y push
# Uso: Ejecutar en PowerShell desde la raíz del repo: .\scripts\git-commit-and-push.ps1 -Message "mensaje"
param(
  [string]$Message = $("chore: cambios automáticos $(Get-Date -Format 'yyyy-MM-dd_HH:mm:ss')")
)

$branch = git rev-parse --abbrev-ref HEAD 2>$null
if (-not $branch) {
  Write-Error "No se pudo determinar la rama actual. Asegurate de estar en la raíz del repo y que git esté instalado."
  exit 1
}
Write-Host "Rama actual: $branch"

git add -A
try {
  git commit -m "$Message" | Write-Host
} catch {
  Write-Host "No hay cambios para commitear."; exit 0
}

git push origin $branch
Write-Host "Hecho."

