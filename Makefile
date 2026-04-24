# Makefile para ambiente de desenvolvimento/instalação
# Suporta Linux/macOS via Make e Windows via scripts PowerShell / Batch

PYTHON ?= python3
VENV_DIR := venv
PIP := $(VENV_DIR)/bin/pip
PY := $(VENV_DIR)/bin/python
REQ := requirements.txt

.PHONY: help venv requirements install desktop-install uninstall-desktop run run-ouvidoria run-cobranca clean install-windows
.PHONY: generate-icon dist-zip package-windows

help:
	@echo "Usage: make <target>"
	@echo "Targets:"
	@echo "  venv             - criar virtualenv local ($(VENV_DIR))"
	@echo "  requirements     - instalar dependências (após venv)"
	@echo "  install          - criar venv + instalar requirements"
	@echo "  desktop-install  - instalar .desktop (Linux)"
	@echo "  uninstall-desktop- remover atalho do menu (Linux)"
	@echo "  run              - executar o launcher (run.py) usando venv python"
	@echo "  run-ouvidoria    - abrir ouvidoriabot GUI"
	@echo "  run-cobranca     - abrir cobranca GUI"
	@echo "  install-windows  - executar o instalador PowerShell (Windows)"
	@echo "  clean            - remove venv and caches"

venv:
	@echo "Creating virtualenv in $(VENV_DIR) using $(PYTHON)"
	$(PYTHON) -m venv $(VENV_DIR)
	@echo "Upgrading pip..."
	$(VENV_DIR)/bin/pip install --upgrade pip setuptools || true

requirements: venv
	@if [ -f $(REQ) ]; then \
		$(VENV_DIR)/bin/pip install -r $(REQ); \
	else \
		echo "No $(REQ) found"; exit 1; \
	fi

install: requirements
	@echo "Install complete. Use 'make run' to start."


desktop-install:
	@echo "Installing desktop entry (Linux user)"
	@if [ -x ./install_desktop.sh ]; then \
		./install_desktop.sh; \
	else \
		echo "install_desktop.sh not found or not executable"; exit 1; \
	fi

uninstall-desktop:
	@echo "Removing desktop entry (Linux user)"
	@if [ -x ./uninstall_desktop.sh ]; then \
		./uninstall_desktop.sh; \
	else \
		echo "uninstall_desktop.sh not found or not executable"; exit 1; \
	fi

run: venv
	@echo "Running launcher..."
	$(VENV_DIR)/bin/python run.py

run-ouvidoria: venv
	@echo "Launching ouvidoriabot GUI"
	$(VENV_DIR)/bin/python run.py ouvidoria

run-cobranca: venv
	@echo "Launching cobranca GUI"
	$(VENV_DIR)/bin/python run.py cobranca

install-windows:
	@echo "Running Windows installer (PowerShell)"
	@powershell -ExecutionPolicy Bypass -File ./install_windows.ps1 || powershell.exe -ExecutionPolicy Bypass -File ./install_windows.ps1

generate-icon: venv
	@echo "Generating icon (PNG + ICO)"
	@$(PY) scripts/generate_icon.py

dist-zip: generate-icon
	@echo "Creating distributable ZIP in ./dist"
	@mkdir -p dist
	@rm -f dist/ouvidoria-*.zip
	@DATE=`git describe --tags --always 2>/dev/null || date +%Y%m%d`; \
	zip -r dist/ouvidoria-$$DATE.zip . -x "venv/*" "*.pyc" "__pycache__/*" ".git/*" "dist/*" || true; \
	echo "Created: dist/ouvidoria-$$DATE.zip"

package-windows: generate-icon
	@echo "Creating Windows package ZIP"
	@mkdir -p dist
	@DATE=`git describe --tags --always 2>/dev/null || date +%Y%m%d`; \
	zip -r dist/ouvidoria-windows-$$DATE.zip run.py *.py scripts install_windows.* install_windows.bat install_windows.ps1 icons/*.ico icons/*.png requirements.txt README_INSTALL.md -x "venv/*" "*.pyc" "__pycache__/*" ".git/*" || true; \
	echo "Created: dist/ouvidoria-windows-$$DATE.zip"

clean:
	@echo "Removing virtualenv and caches..."
	rm -rf $(VENV_DIR) __pycache__ || true
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@echo "Clean complete"
