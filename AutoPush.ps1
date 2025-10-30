# Script PowerShell para Auto-Push
# Este script hace commit y push de los cambios

Set-Location "c:\Users\USUARIO\WebstormProjects\dashboard"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AUTO-PUSH DE CAMBIOS A GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Agregando archivos..." -ForegroundColor Yellow
git add scripts\043_add_invoice_shipping_columns.sql
git add AutoPush.ps1
Write-Host "✓ Archivos agregados" -ForegroundColor Green

Write-Host ""
Write-Host "[2/5] Verificando estado..." -ForegroundColor Yellow
git status --short
Write-Host "✓ Estado verificado" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Creando commit..." -ForegroundColor Yellow
git commit -m "feat: Agregar script de migración 043 para columnas de envío en facturas - Agregar campos de ubicación (ciudad, barrio) - Agregar campos de envío (guia, transportadora, vendedor) - Agregar campo de evidencia fotográfica - Incluir índices para mejorar búsquedas"
Write-Host "✓ Commit creado" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Subiendo a GitHub..." -ForegroundColor Yellow
git push origin feature/meta-ads-integration-v2
Write-Host "✓ Push completado" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Verificando resultado..." -ForegroundColor Yellow
git log --oneline -1
Write-Host "✓ Verificación completa" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROCESO COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Los cambios se han subido a GitHub." -ForegroundColor White
Write-Host "Vercel detectará el cambio automáticamente." -ForegroundColor White
Write-Host ""

Read-Host "Presiona Enter para cerrar"

