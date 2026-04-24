#!/usr/bin/env python3
"""
Entry point for the ouvidoria ecosystem.

Usage:
  python run.py gui         # Open a simple launcher window to run apps
  python run.py ouvidoria   # Run the ouvidoriabot GUI
  python run.py cobranca    # Run the cobranca GUI
  python run.py executar    # Execute cobrar.executar_cobranca() (headless)
  python run.py --help

This script spawns subprocesses for GUI apps (keeps processes isolated).
"""
import sys
import os
import argparse
import subprocess
import pathlib

ROOT = pathlib.Path(__file__).parent.resolve()
PY = sys.executable

def spawn(script_name):
    path = ROOT / script_name
    if not path.exists():
        print(f"Arquivo não encontrado: {path}")
        return 2
    print(f"Abrindo {path}...")
    return subprocess.Popen([PY, str(path)])

def executar_headless():
    # Import and run the headless cobrar execution
    try:
        from cobrar import executar_cobranca
    except Exception as e:
        print(f"Erro ao importar cobrar: {e}")
        return 2
    def simple_log(m):
        print(m)
    stats = executar_cobranca(log_func=simple_log)
    print("Resumo:")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    return 0

# Minimal Tk launcher
def launcher():
    try:
        import tkinter as tk
        from tkinter import ttk, messagebox
    except Exception as e:
        print("Tkinter não disponível:", e)
        return 2

    root = tk.Tk()
    root.title("Launcher — Ouvidoria Ecosystem")
    root.geometry("420x180")

    frm = ttk.Frame(root, padding=16)
    frm.pack(fill="both", expand=True)

    ttk.Label(frm, text="Escolha um componente para executar:", font=(None, 12)).pack(pady=(0,10))

    def _run_ouvidoria():
        spawn('ouvidoriabot.py')
        messagebox.showinfo('Lançado', 'ouvidoriabot.py iniciado em novo processo')

    def _run_cobranca():
        spawn('cobranca_gui.py')
        messagebox.showinfo('Lançado', 'cobranca_gui.py iniciado em novo processo')

    ttk.Button(frm, text="▶ Ouvidoria (GUI)", command=_run_ouvidoria).pack(fill='x', pady=6)
    ttk.Button(frm, text="▶ Cobrança (GUI)", command=_run_cobranca).pack(fill='x', pady=6)
    ttk.Button(frm, text="✖ Fechar", command=root.destroy).pack(pady=(8,0))

    root.mainloop()
    return 0


def main():
    p = argparse.ArgumentParser(description="Launcher para o ecossistema de Ouvidoria")
    p.add_argument('action', nargs='?', default='gui', help='acao: gui | ouvidoria | cobranca | executar')
    args = p.parse_args()

    action = args.action.lower()
    if action in ('gui', 'launcher'):
        return launcher()
    if action in ('ouvidoria', 'ouvidoriabot'):
        spawn('ouvidoriabot.py')
        return 0
    if action in ('cobranca', 'cobranca_gui'):
        spawn('cobranca_gui.py')
        return 0
    if action in ('executar', 'headless'):
        return executar_headless()

    print('Ação desconhecida:', action)
    return 2

if __name__ == '__main__':
    sys.exit(main())
