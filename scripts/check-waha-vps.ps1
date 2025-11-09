# Script para verificar WAHA en VPS (Windows PowerShell)
# VERSIÓN CORREGIDA - Sin API Key, endpoints correctos
# Ejecutar: powershell scripts\check-waha-vps.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICACION WAHA EN VPS (CORREGIDO)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "31.220.58.83"

Write-Host "IMPORTANTE: WAHA CORE/WEBJS NO usa API Key" -ForegroundColor Yellow
Write-Host "Probando sin X-Api-Key header..." -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Test de salud (debe dar 200)..." -ForegroundColor Yellow
Write-Host "   curl http://$VPS_IP:3000/health" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:3000/health" -Method Get
    Write-Host "STATUS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "BODY: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "STATUS: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "2. Test /api/sessions/default/start (debe dar 200 o 409)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:3000/api/sessions/default/start" -Headers $headers -Method Post
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
Write-Host "3. Test /api/default/auth/qr (debe dar 200)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:3000/api/default/auth/qr" -Method Get
    Write-Host "STATUS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "BODY (primeros 100 caracteres): $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "STATUS: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "4. Test /api/sessions/default (debe dar 200)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${VPS_IP}:3000/api/sessions/default" -Method Get
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
Write-Host "  RESULTADOS ESPERADOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "/health: 200 OK" -ForegroundColor Green
Write-Host "/api/sessions/default/start: 200 OK o 409 (ya existe)" -ForegroundColor Green
Write-Host "/api/default/auth/qr: 200 OK con QR code" -ForegroundColor Green
Write-Host "/api/sessions/default: 200 OK con status de sesion" -ForegroundColor Green
Write-Host ""
Write-Host "Si ves 401/403/422: WAHA tiene API Key activada (no debe)" -ForegroundColor Red
Write-Host "Si ves timeout: WAHA no esta escuchando en 0.0.0.0" -ForegroundColor Red
Write-Host ""

