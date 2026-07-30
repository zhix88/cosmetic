param()

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$port = 4174
$vitePath = Join-Path $projectRoot 'node_modules\vite\bin\vite.js'
$h5Root = Join-Path $projectRoot 'apps\h5'

$nodeCandidates = @(
  (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
  (Join-Path $env:LOCALAPPDATA '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
$nodePath = $nodeCandidates | Select-Object -First 1

if (-not $nodePath) { throw 'Node runtime not found. Install Node.js or make node.exe available on PATH.' }
if (-not (Test-Path -LiteralPath $vitePath)) { throw "Vite entry not found: $vitePath" }

while ($true) {
  $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener) {
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
    if ($owner.CommandLine -match [regex]::Escape('vite.js')) { exit 0 }
    throw "Port $port is occupied by an unrelated process (PID $($listener.OwningProcess))."
  }

  Set-Location -LiteralPath $h5Root
  & $nodePath $vitePath --host 127.0.0.1 --port $port --strictPort
  Start-Sleep -Seconds 3
}
