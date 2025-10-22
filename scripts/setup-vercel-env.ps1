<#
setup-vercel-env.ps1

Usage (PowerShell):
  # recommended: set env vars locally for token and project id
  $env:VERCEL_TOKEN = '<your_vercel_token>'
  $env:VERCEL_PROJECT_ID = '<your_vercel_project_id>'
  pwsh ./scripts/setup-vercel-env.ps1 -MetaAccessToken '<meta_token>' -MetaAdAccountId '<act_123>' -UseRealAds

Or pass parameters directly:
  pwsh ./scripts/setup-vercel-env.ps1 -VercelToken '<your_vercel_token>' -ProjectId '<your_project_id>' -MetaAccessToken '<meta_token>' -MetaAdAccountId '<act_123>' -UseRealAds

This script calls the Vercel API to create encrypted environment variables for the project
on targets: production, preview and development. It does NOT print or log secrets.

IMPORTANT: Never paste secrets into chat. Run this script locally on your machine.
#>

param(
  [string]$VercelToken = $env:VERCEL_TOKEN,
  [string]$ProjectId = $env:VERCEL_PROJECT_ID,
  [string]$MetaAccessToken,
  [string]$MetaAdAccountId,
  [switch]$UseRealAds
)

function Ensure-Param([string]$val, [string]$name) {
  if ([string]::IsNullOrEmpty($val)) {
    Write-Error "$name is required. Provide it as a parameter or set the corresponding environment variable."
    exit 1
  }
}

Ensure-Param $VercelToken 'VERCEL token (VercelToken)'
Ensure-Param $ProjectId 'VERCEL project id (ProjectId)'
Ensure-Param $MetaAccessToken 'META access token (MetaAccessToken)'
Ensure-Param $MetaAdAccountId 'META ad account id (MetaAdAccountId)'

$headers = @{ Authorization = "Bearer $VercelToken"; "Content-Type" = "application/json" }

$targets = @("production","preview","development")

function Add-EnvVar($key, $value) {
  foreach ($t in $targets) {
    $body = @{ key = $key; value = $value; target = @($t); type = "encrypted" } | ConvertTo-Json
    $uri = "https://api.vercel.com/v9/projects/$ProjectId/env"
    try {
      $resp = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body -ErrorAction Stop
      Write-Host "Added $key for target $t"
    } catch {
      # If the variable exists, Vercel returns 409; handle gracefully
      $err = $_.Exception.Response.StatusCode.Value__
      if ($err -eq 409) {
        Write-Host "Variable $key already exists for target $t, skipping"
      } else {
        Write-Error "Failed adding $key for target $t: $_"
      }
    }
  }
}

Write-Host "Setting values in Vercel project $ProjectId (targets: $($targets -join ','))"

Add-EnvVar -key 'META_ACCESS_TOKEN' -value $MetaAccessToken
Add-EnvVar -key 'META_AD_ACCOUNT_ID' -value $MetaAdAccountId

if ($UseRealAds) {
  Add-EnvVar -key 'USE_REAL_ADS' -value 'true'
} else {
  Add-EnvVar -key 'USE_REAL_ADS' -value 'false'
}

Write-Host "Done. Verify in Vercel dashboard that variables are set for project $ProjectId."
