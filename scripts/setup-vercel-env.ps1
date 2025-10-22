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
  [string]$MetaAccessToken = $env:META_ACCESS_TOKEN,
  [string]$MetaAdAccountId = $env:META_AD_ACCOUNT_ID,
  [string]$MetaAdAccountIds = $env:META_AD_ACCOUNT_IDS, # comma-separated list or env var
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

# Normalize ad account ids: allow either a single -MetaAdAccountId or a comma-separated -MetaAdAccountIds
$adIds = @()
if (-not [string]::IsNullOrEmpty($MetaAdAccountIds)) {
  $adIds = $MetaAdAccountIds -split ',' | ForEach-Object { $_.Trim() } | Where-Object { -not [string]::IsNullOrEmpty($_) }
} elseif (-not [string]::IsNullOrEmpty($MetaAdAccountId)) {
  $adIds = @($MetaAdAccountId)
}

if ($adIds.Count -eq 0) {
  Write-Error "Meta ad account id is required: provide -MetaAdAccountId or -MetaAdAccountIds (comma-separated)"
  exit 1
}

$headers = @{ Authorization = "Bearer $VercelToken"; "Content-Type" = "application/json" }

$targets = @("production","preview","development")

function Add-EnvVar($key, $value) {
  foreach ($t in $targets) {
    $body = @{ key = $key; value = $value; target = @($t); type = "encrypted" } | ConvertTo-Json
    $uri = "https://api.vercel.com/v9/projects/$ProjectId/env"
    try {
          $resp = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body -ErrorAction Stop
          Write-Host "Added $($key) for target $($t)"
    } catch {
      # Try to detect HTTP 409 (already exists). If not available, print the full error.
      $status = $null
      if ($_.Exception -and $_.Exception.Response -and $_.Exception.Response.StatusCode) {
        try { $status = $_.Exception.Response.StatusCode.Value__ } catch { $status = $null }
      }
      if ($status -eq 409) {
        Write-Host "Variable $($key) already exists for target $($t), skipping"
      } else {
        Write-Error "Failed adding $($key) for target $($t): $($_)"
      }
    }
  }
}

Write-Host "Setting values in Vercel project $ProjectId (targets: $($targets -join ','))"

Add-EnvVar -key 'META_ACCESS_TOKEN' -value $MetaAccessToken

# Add one or more ad account ids. The first id is stored as META_AD_ACCOUNT_ID, additional ids as META_AD_ACCOUNT_ID_2, _3, ...
for ($i = 0; $i -lt $adIds.Count; $i++) {
  $key = if ($i -eq 0) { 'META_AD_ACCOUNT_ID' } else { "META_AD_ACCOUNT_ID_$($i+1)" }
  Add-EnvVar -key $key -value $adIds[$i]
}

if ($UseRealAds) {
  Add-EnvVar -key 'USE_REAL_ADS' -value 'true'
} else {
  Add-EnvVar -key 'USE_REAL_ADS' -value 'false'
}

Write-Host "Done. Verify in Vercel dashboard that variables are set for project $ProjectId."
