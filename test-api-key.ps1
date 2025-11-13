$headers = @{
    "apikey" = "galle-whatsapp-key-2025"
}

Write-Host "Probando API Key en Evolution..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://31.220.58.83:8080/instance/fetchInstances" -Method GET -Headers $headers
    Write-Host "EXITO - API Key correcta" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Respuesta: $($response.Content)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "ERROR - Status Code: $statusCode" -ForegroundColor Red

    if ($statusCode -eq 403) {
        Write-Host "" -ForegroundColor Red
        Write-Host "La API Key NO es aceptada por Evolution" -ForegroundColor Red
        Write-Host "" -ForegroundColor Yellow
        Write-Host "SOLUCION:" -ForegroundColor Yellow
        Write-Host "1. Conectate al VPS (31.220.58.83)" -ForegroundColor White
        Write-Host "2. Ejecuta: docker exec evolution printenv AUTHENTICATION_API_KEY" -ForegroundColor White
        Write-Host "3. Si no muestra 'galle-whatsapp-key-2025', reconfigura Evolution" -ForegroundColor White
        Write-Host "   Usa el comando del archivo: FIX_403_PERMISSION_ERROR_AHORA.md" -ForegroundColor White
    }
}

