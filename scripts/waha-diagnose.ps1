<#
Script de diagnóstico WAHA para PowerShell
Uso: .\scripts\waha-diagnose.ps1 -WahaUrl http://127.0.0.1:3000 -ApiKey mykey
#>
param(
  [string]$WahaUrl = $null,
  [string]$ApiKey = $null
)

# Fallbacks: prefer env vars si no se pasan como parámetros
if (-not $WahaUrl -or $WahaUrl -eq '') {
  if ($env:WAHA_BASE_URL -and $env:WAHA_BASE_URL -ne '') { $WahaUrl = $env:WAHA_BASE_URL } else { $WahaUrl = 'http://127.0.0.1:3000' }
}
if (-not $ApiKey -or $ApiKey -eq '') {
  if ($env:WAHA_API_KEY -and $env:WAHA_API_KEY -ne '') { $ApiKey = $env:WAHA_API_KEY } else { $ApiKey = '' }
}

Write-Host "=== WAHA DIAGNOSIS (PowerShell) ==="
Write-Host "WAHA_URL = $WahaUrl"
Write-Host "WAHA_API_KEY present: $(if ($ApiKey -and $ApiKey -ne '') { 'YES' } else { 'NO' })"

Function Invoke-CurlShow {
  param(
    [Parameter(Mandatory=$true)][ValidateSet('GET','POST','PUT','DELETE')][string]$Method,
    [Parameter(Mandatory=$true)][string]$Url
  )

  $headers = @{}
  if ($ApiKey -and $ApiKey -ne '') { $headers['X-Api-Key'] = $ApiKey }
  Write-Host "`n>> $Method $Url"
  try {
    # Usamos Invoke-RestMethod para obtener objetos decodificados cuando sea posible
    $response = Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -ErrorAction Stop -UseBasicParsing
    $status = 200
    try { $body = $response | ConvertTo-Json -Depth 5 } catch { $body = "$response" }
  } catch {
    # Intentar extraer el status y el body de la excepción HTTP
    $status = 0
    $body = $_.Exception.Message
    try {
      $resp = $_.Exception.Response
      if ($resp) {
        $status = $resp.StatusCode.value__
        $stream = $resp.GetResponseStream()
        if ($stream) {
          $reader = New-Object System.IO.StreamReader($stream)
          $body = $reader.ReadToEnd()
        }
      }
    } catch {
      # ignore
    }
  }
  Write-Host "HTTP_STATUS: $status"
  if ($body) {
    # Pretty print JSON if posible
    try {
      $parsed = $body | ConvertFrom-Json -ErrorAction Stop
      $pretty = $parsed | ConvertTo-Json -Depth 6
      Write-Host "BODY (JSON):`n$pretty"
    } catch {
      Write-Host "BODY (raw):`n$body"
    }
  } else {
    Write-Host "BODY: <empty>"
  }
}

# Steps
Invoke-CurlShow -Method GET -Url "$WahaUrl/health"
Invoke-CurlShow -Method GET -Url "$WahaUrl/api/server/version"
Invoke-CurlShow -Method GET -Url "$WahaUrl/api/sessions"
Invoke-CurlShow -Method GET -Url "$WahaUrl/api/sessions/default"
Invoke-CurlShow -Method POST -Url "$WahaUrl/api/sessions/default/start"
Start-Sleep -Seconds 2
Invoke-CurlShow -Method GET -Url "$WahaUrl/api/sessions/default"
Invoke-CurlShow -Method GET -Url "$WahaUrl/api/sessions/default/auth/qr"

Write-Host "`n=== FIN DIAGNOSTICO ==="
Write-Host "Notas: Si WAHA responde 401/403 verifica WAHA_API_KEY en el contenedor. Si WAHA no responde desde Vercel, asegura WAHA_BASE_URL sea pública HTTPS (no localhost)."
