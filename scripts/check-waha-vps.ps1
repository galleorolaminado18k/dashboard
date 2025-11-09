# Script para verificar WAHA en VPS (Windows PowerShell)
# Ejecutar: powershell scripts\check-waha-vps.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICACION WAHA EN VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "31.220.58.83"
$API_KEY = "d8c776b78aee40d4b9bf75c633d175c8"

Write-Host "3. Test de salud CON API Key..." -ForegroundColor Yellow
Write-Host "   curl -H 'X-Api-Key: $API_KEY' http://$VPS_IP:3000/health" -ForegroundColor Gray
Write-Host ""

try {
    $headers = @{
        "X-Api-Key" = $API_KEY
    }
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:3000/health" -Headers $headers -Method Get
    Write-Host "STATUS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "BODY: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "STATUS: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Test de salud SIN API Key (debe dar 401/403)..." -ForegroundColor Yellow
Write-Host "   curl http://$VPS_IP:3000/health" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:3000/health" -Method Get
    Write-Host "STATUS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "BODY: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "STATUS: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESULTADOS ESPERADOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Con header: 200 OK" -ForegroundColor Green
Write-Host "Sin header: 401/403 Unauthorized" -ForegroundColor Yellow
Write-Host ""
Write-Host "Si con header da 403:" -ForegroundColor Red
Write-Host "  - La clave no coincide" -ForegroundColor White
Write-Host "  - WAHA tiene el hash mal configurado" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRUEBAS DE ENDPOINTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "5. Test /api/session/default/start..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-Api-Key" = $API_KEY
        "Content-Type" = "application/json"
    }
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:3000/api/session/default/start" -Headers $headers -Method Post
    Write-Host "STATUS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "BODY: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "STATUS: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "BODY: $body" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "6. Test /api/session/default/qr..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-Api-Key" = $API_KEY
    }
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:3000/api/session/default/qr" -Headers $headers -Method Get
    Write-Host "STATUS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "BODY (primeros 100 caracteres): $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "STATUS: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificacion completada" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

