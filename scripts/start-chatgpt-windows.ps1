$ErrorActionPreference = 'Stop'
foreach ($taskCommand in @('node', 'npm.cmd', 'mkcert')) {
    if (-not (Get-Command $taskCommand -ErrorAction SilentlyContinue)) {
        throw "Missing $taskCommand. Follow AI_CONNECTIONS.md first."
    }
}
$taskNpmRoot = (& npm.cmd root -g).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot find the global npm packages directory' }
$taskCodexBinary = & node (Join-Path $PSScriptRoot 'resolve-codex.mjs') $taskNpmRoot
if ($LASTEXITCODE -ne 0) { throw 'Cannot find the official Codex executable' }
$env:LABELCRAFT_CODEX_BIN = $taskCodexBinary.Trim()
& $env:LABELCRAFT_CODEX_BIN --version
if ($LASTEXITCODE -ne 0) { throw 'Codex cannot start' }
& $env:LABELCRAFT_CODEX_BIN login
if ($LASTEXITCODE -ne 0) { throw 'Codex login failed' }
$taskLocalDir = Join-Path ([Environment]::GetFolderPath('ApplicationData')) 'LabelCraft'
$taskCertDir = Join-Path $taskLocalDir 'tls'
New-Item -ItemType Directory -Force -Path $taskCertDir | Out-Null
# Restrict local secrets to the current Windows account (SID survives localized names).
$taskSid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls $taskLocalDir /inheritance:r /grant:r "*${taskSid}:(OI)(CI)F" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Cannot protect the local configuration directory' }
& mkcert -install
if ($LASTEXITCODE -ne 0) { throw 'Cannot install the local certificate authority' }
$env:API_TLS_CERT = Join-Path $taskCertDir 'localhost.pem'
$env:API_TLS_KEY = Join-Path $taskCertDir 'localhost-key.pem'
if (-not (Test-Path $env:API_TLS_CERT) -or -not (Test-Path $env:API_TLS_KEY)) {
    & mkcert -cert-file $env:API_TLS_CERT -key-file $env:API_TLS_KEY localhost 127.0.0.1 ::1
    if ($LASTEXITCODE -ne 0) { throw 'Cannot create a trusted localhost certificate' }
}
$env:API_LISTEN = '127.0.0.1:28172'
Write-Host 'Connector URL: https://localhost:28172'
& (Join-Path $PSScriptRoot 'labelcraft-connector.exe') -local
if ($LASTEXITCODE -ne 0) { throw 'LabelCraft connector stopped with an error' }
