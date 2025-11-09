# 🧪 Script de Verificación Evolution API (Windows PowerShell)

Write-Host "🧪 Verificando Evolution API..." -ForegroundColor Cyan
Write-Host ""

# Obtener la URL base desde .env.local o usar default
$EVO_URL = if ($env:EVO_BASE_URL) { $env:EVO_BASE_URL } else { "http://31.220.58.83:8080" }

Write-Host "📍 URL a verificar: $EVO_URL" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health check básico
Write-Host "1️⃣ Test: Health Check (GET /)" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$EVO_URL/" -Method Get
    Write-Host "✅ Respuesta: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Iniciar sesión
Write-Host "2️⃣ Test: Iniciar Sesión (POST /sessions/start)" -ForegroundColor Green
try {
    $body = @{
        sessionName = "default"
        whatsappVersion = "v2"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$EVO_URL/sessions/start" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Sesión iniciada o ya existe" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "✅ Sesión ya existe (409 - OK)" -ForegroundColor Green
    } else {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Obtener QR
Write-Host "3️⃣ Test: Obtener QR (GET /sessions/default/qrcode)" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$EVO_URL/sessions/default/qrcode" -Method Get
    if ($response.qrcode) {
        Write-Host "✅ QR obtenido correctamente" -ForegroundColor Green
        Write-Host "   Longitud: $($response.qrcode.Length) caracteres" -ForegroundColor Gray
        Write-Host "   Tipo: $($response.qrcode.Substring(0, 30))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ QR no disponible en respuesta" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error obteniendo QR: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Estado de sesión
Write-Host "4️⃣ Test: Estado de Sesión (GET /sessions/default/status)" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$EVO_URL/sessions/default/status" -Method Get
    Write-Host "✅ Estado: $($response.state)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "⚠️  Sesión no existe aún (404)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "✅ Verificación completada" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Siguiente paso:" -ForegroundColor Yellow
Write-Host "   Si todos los tests pasan, configura en Vercel:" -ForegroundColor White
Write-Host "   EVO_BASE_URL=$EVO_URL" -ForegroundColor Cyan

