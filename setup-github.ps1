# =============================================================================
#  Scronter — crea el repo privado en GitHub y sube el codigo.
#
#  USO:
#     powershell -ExecutionPolicy Bypass -File .\setup-github.ps1
#
#  Necesita un Personal Access Token con el scope "repo".
#  Lo lee del PORTAPAPELES: no se escribe en disco ni queda en el historial.
# =============================================================================

# NO usar $ErrorActionPreference = 'Stop' aca.
# En PowerShell 5.1, si un .exe nativo escribe en stderr y esa salida se
# redirige dentro de PowerShell, cada linea se envuelve en un ErrorRecord
# (NativeCommandError). Con 'Stop' eso aborta el script aunque el programa haya
# andado bien: `gh auth status` informa "no hay sesion" por stderr, que es una
# respuesta valida. Por eso todo se decide por $LASTEXITCODE.
$ErrorActionPreference = 'Continue'

$gh = 'C:\Program Files\GitHub CLI\gh.exe'
$proyecto = $PSScriptRoot
$nombreRepo = 'scronter'

function Salir($mensaje) {
  Write-Host ''
  Write-Host $mensaje -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $gh)) {
  Salir "No encuentro gh en $gh`nInstalalo con: winget install -e --id GitHub.cli"
}

Write-Host ''
Write-Host '--- Scronter: repo privado en GitHub ---' -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# 1. Leer el token del portapapeles
#
#    Por que del portapapeles y no de un prompt: en la consola clasica de
#    Windows, Ctrl+V dentro de un Read-Host no pega el contenido, inserta un
#    unico caracter de control (0x16). El token llega con un byte invalido y
#    GitHub responde "invalid header field value for Authorization", que parece
#    un problema del token cuando es de la consola.
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host 'Copia tu Personal Access Token (scope "repo") al portapapeles.' -ForegroundColor Cyan
Write-Host 'Si no tenes: github.com/settings/tokens/new' -ForegroundColor Gray
Write-Host ''
Write-Host 'NO lo pegues en esta ventana. Solo copialo y apreta Enter.' -ForegroundColor DarkYellow
Write-Host ''
Read-Host 'Cuando lo tengas copiado, apreta Enter' | Out-Null

$crudo = Get-Clipboard -Raw
if ($null -eq $crudo) { $crudo = '' }
$token = ([string]$crudo).Trim()

$largo = $token.Length
$prefijo = if ($largo -ge 4) { $token.Substring(0, 4) } else { $token }

Write-Host ''
Write-Host "Portapapeles: $largo caracteres, empieza con '$prefijo'" -ForegroundColor DarkGray

if ($largo -eq 0) {
  Salir 'El portapapeles esta vacio. Copia el token y volve a correr el script.'
}
if ($token -match '[\x00-\x1F\x7F]') {
  Salir 'El portapapeles tiene caracteres de control. Volve a copiarlo desde la pagina de GitHub.'
}
if ($token -match '\s') {
  Salir 'El portapapeles tiene espacios o saltos de linea. Copia SOLO el token.'
}
if ($token -notmatch '^(gh[a-z]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})$') {
  Salir "Eso no parece un token de GitHub (largo $largo, prefijo '$prefijo')."
}

# ---------------------------------------------------------------------------
# 2. Usar el token via GH_TOKEN en vez de `gh auth login --with-token`
#
#    Por que: `gh auth login --with-token` valida los scopes del token y exige
#    'read:org' ademas de 'repo'. Ese scope no hace falta para nada de lo que
#    hacemos aca (crear un repo y pushear), asi que pedirlo seria pedir mas
#    permisos de los necesarios. Con GH_TOKEN, gh usa el token directamente y
#    se saltea esa validacion.
#
#    GH_TOKEN vive solo en este proceso: no queda seteado en el sistema.
# ---------------------------------------------------------------------------
$env:GH_TOKEN = $token

Write-Host 'Verificando el token...' -ForegroundColor DarkGray
$usuario = & $gh api user --jq '.login' 2>&1
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($usuario) -or $usuario -match '\s') {
  $env:GH_TOKEN = $null
  Salir "GitHub rechazo el token. Revisa que tenga el scope 'repo' marcado y que no este expirado.`nRespuesta: $usuario"
}
$usuario = $usuario.Trim()
Write-Host "Token valido. Usuario: $usuario" -ForegroundColor Green

Remove-Variable token -ErrorAction SilentlyContinue

# ---------------------------------------------------------------------------
# 3. Crear el repo privado y subir
#
#    gh usa GH_TOKEN para autenticar tanto la creacion como el push, asi que
#    no hace falta configurar credenciales de git para este paso.
#
#    Para los push FUTUROS: Windows tiene el Administrador de credenciales
#    activado (credential.helper = manager), asi que la primera vez que hagas
#    `git push` desde una terminal te va a abrir una ventana del navegador para
#    autorizar, una sola vez, y despues queda guardado. Es una interaccion
#    normal y funciona bien; simplemente no la puedo hacer yo por vos.
# ---------------------------------------------------------------------------
Set-Location $proyecto

& $gh repo view "$usuario/$nombreRepo" 2>&1 | Out-Null
$repoExiste = ($LASTEXITCODE -eq 0)

if ($repoExiste) {
  Write-Host ''
  Write-Host "El repo $usuario/$nombreRepo ya existe. Solo hago push." -ForegroundColor Yellow
  if ((& git remote) -notcontains 'origin') {
    & git remote add origin "https://github.com/$usuario/$nombreRepo.git"
  }
  & git push -u origin main
  $codigo = $LASTEXITCODE
}
else {
  Write-Host ''
  Write-Host "Creando repo privado $usuario/$nombreRepo y subiendo..." -ForegroundColor Cyan
  & $gh repo create $nombreRepo --private --source . --remote origin --push --description 'Tienda online Scronter - ropa y accesorios de skate. Next.js + Flow.'
  $codigo = $LASTEXITCODE
}

$env:GH_TOKEN = $null

if ($codigo -ne 0) {
  Salir 'Fallo la creacion o el push. Copiame el error de arriba.'
}

# ---------------------------------------------------------------------------
# 4. Confirmar
# ---------------------------------------------------------------------------
$cantidad = (& git ls-files).Count
$rama = & git rev-parse --abbrev-ref HEAD
$envVersionado = [bool](& git ls-files | Where-Object { $_ -eq '.env.local' })

# Limpia el portapapeles: el token ya esta guardado donde tiene que estar.
Set-Clipboard -Value ' '

Write-Host ''
Write-Host '=================================================================' -ForegroundColor Green
Write-Host ' LISTO' -ForegroundColor Green
Write-Host '=================================================================' -ForegroundColor Green
Write-Host "Repo privado:      https://github.com/$usuario/$nombreRepo"
Write-Host "Archivos subidos:  $cantidad"
Write-Host "Rama:              $rama"
Write-Host ''

if ($envVersionado) {
  Write-Host 'PROBLEMA: .env.local esta en el repo. Avisame de inmediato.' -ForegroundColor Red
}
else {
  Write-Host 'OK: .env.local no se subio (tus claves de Flow quedaron solo en tu maquina).' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Portapapeles limpiado.' -ForegroundColor DarkGray
Write-Host 'Volve al chat y deci "listo" para el deploy en Vercel.' -ForegroundColor Cyan
