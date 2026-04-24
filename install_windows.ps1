# PowerShell installer for Windows
# - creates a virtualenv in ./venv
# - installs requirements
# - creates a Start Menu shortcut to run the launcher

param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# Check python
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Error "Python não encontrado. Instale Python 3.8+ e habilite 'Add Python to PATH'."
    exit 1
}

# Create venv
Write-Host "Criando virtualenv em $root\\venv ..."
python -m venv venv

# Upgrade pip
& .\venv\Scripts\pip.exe install --upgrade pip setuptools

# Install requirements
if (Test-Path requirements.txt) {
    Write-Host "Instalando dependências..."
    & .\venv\Scripts\pip.exe install -r requirements.txt
} else {
    Write-Warning "requirements.txt não encontrado. Pulei instalação de pacotes."
}

# Create Start Menu shortcut
$WshShell = New-Object -ComObject WScript.Shell
$startMenu = [Environment]::GetFolderPath("Programs")

$lnkPath = Join-Path $startMenu "Ouvidoria Ecosystem.lnk"
$target = Join-Path $root "venv\Scripts\python.exe"
$args = "\"" + (Join-Path $root 'run.py') + "\" gui"

# copy icon if exists
$iconSrc = Join-Path $root "icons\ouvidoria_icon.ico"
$iconDest = Join-Path $root "ouvidoria_icon.ico"
if (Test-Path $iconSrc) {
    Copy-Item -Path $iconSrc -Destination $iconDest -Force
}

$shortcut = $WshShell.CreateShortcut($lnkPath)
$shortcut.TargetPath = $target
$shortcut.Arguments = $args
$shortcut.WorkingDirectory = $root
$shortcut.WindowStyle = 1
if (Test-Path $iconDest) { $shortcut.IconLocation = $iconDest }
$shortcut.Save()

Write-Host "Instalado. Atalho criado em: $lnkPath"
Write-Host "Use o menu Iniciar para procurar 'Ouvidoria Ecosystem' ou execute: $target $args"
