@echo off
REM Batch installer for Windows (cmd)
SET ROOT=%~dp0
PUSHD %ROOT%

python -m venv venv
call venv\Scripts\pip.exe install --upgrade pip setuptools
if exist requirements.txt (
  call venv\Scripts\pip.exe install -r requirements.txt
) else (
  echo requirements.txt not found; skipping pip install
)

REM Create shortcut via powershell
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Ouvidoria Ecosystem.lnk'); $s.TargetPath='%CD%\\venv\\Scripts\\python.exe'; $s.Arguments='"%CD%\\run.py" gui'; $s.WorkingDirectory='%CD%'; if (Test-Path '%CD%\\icons\\ouvidoria_icon.ico') { $s.IconLocation='%CD%\\icons\\ouvidoria_icon.ico' } else { $s.IconLocation='%CD%\\venv\\Scripts\\python.exe' }; $s.Save();"

POPD
echo Installed. Use Start Menu to run 'Ouvidoria Ecosystem'.
