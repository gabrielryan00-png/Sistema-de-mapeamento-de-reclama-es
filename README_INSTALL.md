# Instalação e uso (Linux / macOS / Windows)

Este repositório contém um ecossistema de scripts para processamento de ouvidorias.
Este guia descreve como instalar e criar atalhos para facilitar uso interno.

## Requisitos
- Python 3.8+
- Em Linux/macOS: `make` (opcional)
- Em Windows: PowerShell (para o instalador)

## Linux / macOS (recomendado)
1. Crie e ative venv e instale dependências:

```bash
cd /path/to/ouvidoria_bot
make install
```

2. Instalar atalho no menu (usuário):

```bash
./install_desktop.sh
```

3. Executar launcher:

```bash
make run
# ou
python run.py gui
```

## Windows
1. Abra PowerShell como usuário e execute:

```powershell
cd C:\path\to\ouvidoria_bot
powershell -ExecutionPolicy Bypass -File .\install_windows.ps1
```

ou execute em CMD:

```cmd
cd C:\path\to\ouvidoria_bot
install_windows.bat
```

2. Use o atalho criado no Menu Iniciar: "Ouvidoria Ecosystem".

## Execução direta (sem atalho)
- Para executar a GUI da ouvidoria:

```bash
./venv/bin/python ouvidoriabot.py
```

- Para executar a GUI de cobrança:

```bash
./venv/bin/python cobranca_gui.py
```

- Para executar somente a rotina headless de cobrança:

```bash
./venv/bin/python run.py executar
```

## Notas
- O `Makefile` chama `install_desktop.sh` para instalar o .desktop (Linux). Em Windows, use os scripts PowerShell/Batch.
- Se preferir empacotar como um instalador ou criar pacotes, posso adicionar um `setup.py`/`pyproject.toml` e orientações para `pip install .`.
