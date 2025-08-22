param(
  [Parameter(Mandatory=$true)][string]$Command,
  [Parameter(Mandatory=$true)][string]$OutPath
)

# Ensure folder exists
$dir = Split-Path $OutPath -Parent
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

# Run command and capture output
Write-Output "Running: $Command"
$proc = Start-Process -FilePath pwsh -ArgumentList "-NoProfile -Command $Command" -NoNewWindow -RedirectStandardOutput $OutPath -RedirectStandardError $OutPath -PassThru -Wait
Write-Output "Exit code: $($proc.ExitCode)"
Exit $proc.ExitCode
