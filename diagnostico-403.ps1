# Script de diagnóstico rápido para error 403
# Ejecuta esto en PowerShell desde Windows

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  DIAGNÓSTICO ERROR 403 - PERMISSION ERROR" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar conexión al VPS
Write-Host "[1/4] Verificando conexión al VPS..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://31.220.58.83:8080/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  ✅ VPS responde (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ❌ VPS no responde - Verifica que Evolution esté corriendo" -ForegroundColor Red
    Write-Host "     Ejecuta en VPS: docker ps | grep evolution" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# 2. Probar API Key actual
Write-Host "[2/4] Probando API Key: galle-whatsapp-key-2025..." -ForegroundColor Yellow

$headers = @{
    "apikey" = "galle-whatsapp-key-2025"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "http://31.220.58.83:8080/instance/fetchInstances" -Method GET -Headers $headers -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  ✅ API Key CORRECTA - Evolution la acepta" -ForegroundColor Green
    Write-Host "     Instancias: $($response.Content)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "  ❌ API Key INCORRECTA - Evolution la rechaza (403)" -ForegroundColor Red
        Write-Host "" -ForegroundColor Red
        Write-Host "  🔧 SOLUCIÓN:" -ForegroundColor Yellow
        Write-Host "     1. Conéctate al VPS" -ForegroundColor White
        Write-Host "     2. Ejecuta: docker exec evolution printenv AUTHENTICATION_API_KEY" -ForegroundColor White
        Write-Host "     3. Si no es 'galle-whatsapp-key-2025', ejecuta el comando completo" -ForegroundColor White
        Write-Host "        del archivo: ⚡_FIX_403_PERMISSION_ERROR_AHORA.md (PASO 3A)" -ForegroundColor White
        exit 1
    } else {
        Write-Host "  ⚠️  Error inesperado: HTTP $statusCode" -ForegroundColor Yellow
    }
}

Write-Host ""

# 3. Verificar variables de entorno en .env.local
Write-Host "[3/4] Verificando .env.local..." -ForegroundColor Yellow

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw

    if ($envContent -match 'EVO_API_KEY=([^\r\n]+)') {
        $localApiKey = $matches[1].Trim()
        if ($localApiKey -eq "galle-whatsapp-key-2025") {
            Write-Host "  ✅ EVO_API_KEY correcta en .env.local" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  EVO_API_KEY diferente: '$localApiKey'" -ForegroundColor Yellow
            Write-Host "     Debería ser: 'galle-whatsapp-key-2025'" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠️  EVO_API_KEY no encontrada en .env.local" -ForegroundColor Yellow
        Write-Host "     Agrega: EVO_API_KEY=galle-whatsapp-key-2025" -ForegroundColor Gray
    }

    if ($envContent -match 'EVO_BASE_URL=([^\r\n]+)') {
        $baseUrl = $matches[1].Trim()
        Write-Host "  ✅ EVO_BASE_URL: $baseUrl" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  EVO_BASE_URL no encontrada en .env.local" -ForegroundColor Yellow
        Write-Host "     Agrega: EVO_BASE_URL=http://31.220.58.83:8080" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠️  Archivo .env.local no existe" -ForegroundColor Yellow
    Write-Host "     Créalo con:" -ForegroundColor Gray
    Write-Host "       EVO_BASE_URL=http://31.220.58.83:8080" -ForegroundColor Gray
    Write-Host "       EVO_API_KEY=galle-whatsapp-key-2025" -ForegroundColor Gray
}

Write-Host ""

# 4. Recordatorio sobre Vercel
Write-Host "[4/4] Variables en Vercel (producción)..." -ForegroundColor Yellow
Write-Host "  ℹ️  Verifica en Vercel → Settings → Environment Variables:" -ForegroundColor Cyan
Write-Host "     - EVO_BASE_URL = http://31.220.58.83:8080" -ForegroundColor White
Write-Host "     - EVO_API_KEY = galle-whatsapp-key-2025" -ForegroundColor White
Write-Host ""
Write-Host "  ⚠️  Si cambiaste variables, haz REDEPLOY:" -ForegroundColor Yellow
Write-Host "     1. Vercel → Deployments" -ForegroundColor White
Write-Host "     2. Click en último deployment → ... → Redeploy" -ForegroundColor White

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Si todo está ✅ arriba pero sigue el error 403:" -ForegroundColor White
Write-Host "  → Verifica Vercel y haz Redeploy" -ForegroundColor White
Write-Host ""
Write-Host "  Si hay ❌ en la prueba de API Key:" -ForegroundColor White
Write-Host "  → Ejecuta el comando del PASO 3A en el VPS" -ForegroundColor White
Write-Host "     (Ver archivo: ⚡_FIX_403_PERMISSION_ERROR_AHORA.md)" -ForegroundColor White
Write-Host ""

