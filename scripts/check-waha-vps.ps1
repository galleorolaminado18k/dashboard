# Script para verificar WAHA en VPS (Windows PowerShell)
# VERSIÓN ACTUALIZADA - Con API Key generada automáticamente por WAHA
# Ejecutar: powershell scripts\check-waha-vps.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICACION WAHA EN VPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "31.220.58.83"
$API_KEY = "1fecdcf9f5ec4dd885a2be7e22b27ff4"  # Generada automáticamente por WAHA

Write-Host "NOTA: WAHA generó API key automáticamente" -ForegroundColor Yellow
Write-Host "API Key: $API_KEY" -ForegroundColor Gray
Write-Host ""

Write-Host "1. Test de salud CON API Key (debe dar 200)..." -ForegroundColor Yellow
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
    if ($_.Exception.Response) {
        Write-Host "STATUS: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "2. Test /api/sessions/default/start CON API Key..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-Api-Key" = $API_KEY
        "Content-Type" = "application/json"
    }
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:3000/api/sessions/default/start" -Headers $headers -Method Post
    Write-Host "STATUS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "BODY: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "STATUS: $statusCode" -ForegroundColor $(if ($statusCode -eq 409) { "Green" } else { "Red" })
        if ($statusCode -eq 409) {
            Write-Host "409 = Sesión ya iniciada (esto es OK)" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "3. Test /api/default/auth/qr CON API Key..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-Api-Key" = $API_KEY
    }
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:3000/api/default/auth/qr" -Headers $headers -Method Get
    Write-Host "STATUS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "BODY (primeros 100 caracteres): $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "STATUS: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "4. Test /api/sessions/default CON API Key..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-Api-Key" = $API_KEY
    }
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:3000/api/sessions/default" -Headers $headers -Method Get
    Write-Host "STATUS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "BODY: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "STATUS: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESULTADOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si todos dan 200 OK: ✅ WAHA está funcionando correctamente" -ForegroundColor Green
Write-Host "Si ves 401: ❌ API Key incorrecta" -ForegroundColor Red
Write-Host "Si ves 409 en /start: ✅ Sesión ya iniciada (esto es OK)" -ForegroundColor Green
Write-Host ""

