# install-uclaude.ps1 -- install the "uclaude" launcher into PowerShell profiles.
# Run from the U-disk copy  (drive letter does not matter):
#   powershell -ExecutionPolicy Bypass -File X:\claude\install-uclaude.ps1
# uclaude locates claude.bat by scanning drives for X:\claude\claude.bat.
# Safe to re-run: it replaces only the block marked by the banner comment.

$ErrorActionPreference = 'Stop'

# --- the function we install (pure ASCII, works on PS 5.1 and 7) ------------------
$fn = @'
function uclaude {
  $bat = $null
  foreach ($d in 'C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z') {
    $p = "${d}:\claude\claude.bat"
    if (Test-Path $p -ErrorAction SilentlyContinue) { $bat = $p; break }
  }
  if (-not $bat) {
    Write-Host 'uclaude: portable Claude not found.' -ForegroundColor Red
    return
  }
  & $bat @args
}
'@

$banner = '# Portable Claude Code launcher (U-disk edition)'

$docs = [Environment]::GetFolderPath('MyDocuments')
$targets = @(
  (Join-Path $docs 'WindowsPowerShell\Microsoft.PowerShell_profile.ps1'),
  (Join-Path $docs 'PowerShell\Microsoft.PowerShell_profile.ps1')
)

# UTF-8 with BOM: readable on both PS 5.1 and PS 7, keeps CJK intact.
$enc = New-Object System.Text.UTF8Encoding($true)

foreach ($t in $targets) {
  $dir = Split-Path $t -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

  $body = ''
  if (Test-Path $t) { $body = [System.IO.File]::ReadAllText($t, [System.Text.Encoding]::UTF8) }

  $idx = $body.IndexOf($banner)
  if ($idx -ge 0) { $body = $body.Substring(0, $idx) }   # drop old launcher block

  $body = $body.TrimEnd() + "`r`n`r`n" + $banner + "`r`n" + $fn + "`r`n"

  [System.IO.File]::WriteAllText($t, $body, $enc)
  Write-Host ("uclaude installed -> {0}" -f $t)
}

Write-Host ''
Write-Host 'Done. Open a NEW terminal and type:  uclaude'