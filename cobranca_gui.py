# =============================================================================
# INTERFACE TKINTER PARA COBRANÇAS DE OUVIDORIAS
# =============================================================================
import os
import sys
import threading
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime
import json

from cobrar import executar_cobranca, LOG_DIR

# ─────────────────────────────────────────────────────────────────────────────
# CORES E ESTILOS (consistente com ouvidoriabot.py)
# ─────────────────────────────────────────────────────────────────────────────
COR_AZUL    = "#2B5597"
COR_BRANCO  = "#FFFFFF"
COR_CINZA   = "#F4F6FA"
COR_TEXTO   = "#1A1A2E"
COR_VERDE   = "#4CAF50"
COR_LARANJA = "#FF6B35"
COR_BORDA   = "#D0D7E8"

CONFIG_COBRANCA = os.path.join(os.path.dirname(__file__), "config_cobranca.json")

CONFIG_PADRAO_COBRANCA = {
    "dias_minimos_cobranca": 3,
    "dias_entre_cobracas": 7,
}

def _fonte(size=10, bold=False):
    return ("Segoe UI", size, "bold" if bold else "normal")

def carregar_config_cobranca():
    if os.path.exists(CONFIG_COBRANCA):
        try:
            with open(CONFIG_COBRANCA, encoding="utf-8") as f:
                cfg = json.load(f)
            for k, v in CONFIG_PADRAO_COBRANCA.items():
                cfg.setdefault(k, v)
            return cfg
        except Exception:
            pass
    return dict(CONFIG_PADRAO_COBRANCA)

def salvar_config_cobranca(cfg: dict):
    with open(CONFIG_COBRANCA, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)

# =============================================================================
# APLICAÇÃO PRINCIPAL
# =============================================================================
class CobrancaApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.cfg = carregar_config_cobranca()
        self.rodando = False

        self.title("Sistema de Cobranças — Prefeitura de Suzano")
        self.geometry("880x700")
        self.minsize(800, 600)
        self.configure(bg=COR_CINZA)
        self.resizable(True, True)

        self._build_ui()

    # ── Layout UI ────────────────────────────────────────────────────────────
    def _build_ui(self):
        # ── Cabeçalho ──
        header = tk.Frame(self, bg=COR_AZUL, height=64)
        header.pack(fill="x")
        tk.Label(header, text="📧  Sistema de Cobranças de Ouvidorias", font=_fonte(16, True),
                 bg=COR_AZUL, fg=COR_BRANCO).pack(side="left", padx=20, pady=14)
        tk.Label(header, text="Prefeitura Municipal de Suzano",
                 font=_fonte(9), bg=COR_AZUL, fg="#B0C4DE").pack(side="left", pady=18)

        # ── Notebook (abas) ──
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TNotebook",        background=COR_CINZA, borderwidth=0)
        style.configure("TNotebook.Tab",    font=_fonte(10), padding=[16,6],
                        background=COR_BORDA, foreground=COR_TEXTO)
        style.map("TNotebook.Tab",          background=[("selected", COR_AZUL)],
                                            foreground=[("selected", COR_BRANCO)])
        style.configure("TEntry",           font=_fonte(10))
        style.configure("TSpinbox",         font=_fonte(10))

        nb = ttk.Notebook(self)
        nb.pack(fill="both", expand=True, padx=12, pady=8)

        self._aba_cobracas(nb)
        self._aba_configuracoes(nb)
        self._aba_logs(nb)

        # ── Barra de Status ──
        bar = tk.Frame(self, bg=COR_BORDA, height=28)
        bar.pack(fill="x", side="bottom")
        self.lbl_status = tk.Label(bar, text="Pronto.", font=_fonte(9),
                                   bg=COR_BORDA, fg=COR_TEXTO)
        self.lbl_status.pack(side="left", padx=10)

    # ── Aba Cobranças ────────────────────────────────────────────────────────
    def _aba_cobracas(self, nb):
        frm = tk.Frame(nb, bg=COR_CINZA)
        nb.add(frm, text="  ▶  Executar Cobranças  ")

        # Painel de controle
        pnl = tk.LabelFrame(frm, text=" Controle de Cobranças ", font=_fonte(10, True),
                             bg=COR_CINZA, fg=COR_AZUL, bd=1, relief="groove")
        pnl.pack(fill="x", padx=16, pady=(14,6))

        tk.Label(pnl, text="Selecione a ação desejada:", font=_fonte(10), 
                 bg=COR_CINZA, fg=COR_TEXTO).pack(anchor="w", padx=12, pady=10)

        btn_frm = tk.Frame(pnl, bg=COR_CINZA)
        btn_frm.pack(fill="x", padx=12, pady=10)

        self.btn_run = tk.Button(btn_frm, text="▶  Executar Ciclo de Cobranças",
                                 font=_fonte(11, True), bg=COR_VERDE, fg=COR_BRANCO,
                                 activebackground="#388E3C", cursor="hand2",
                                 relief="flat", padx=18, pady=8,
                                 command=self._iniciar_cobrancas)
        self.btn_run.pack(side="left", padx=(0,10))

        tk.Button(btn_frm, text="📊  Abrir Planilha",
                  font=_fonte(10), bg=COR_AZUL, fg=COR_BRANCO,
                  activebackground="#1A3A7A", cursor="hand2",
                  relief="flat", padx=14, pady=8,
                  command=self._abrir_planilha).pack(side="left", padx=(0,10))

        tk.Button(btn_frm, text="🗑  Limpar Log",
                  font=_fonte(10), bg="#888", fg=COR_BRANCO,
                  activebackground="#555", cursor="hand2",
                  relief="flat", padx=14, pady=8,
                  command=self._limpar_log).pack(side="left")

        # Barra de progresso
        self.progress = ttk.Progressbar(frm, mode="indeterminate", length=300)
        self.progress.pack(fill="x", padx=16, pady=(4,0))

        # Painel de resumo (estatísticas)
        res_frm = tk.LabelFrame(frm, text=" Última Execução ", font=_fonte(10, True),
                                bg=COR_CINZA, fg=COR_AZUL, bd=1, relief="groove")
        res_frm.pack(fill="x", padx=16, pady=8)

        self.stats_frame = tk.Frame(res_frm, bg=COR_CINZA)
        self.stats_frame.pack(fill="both", expand=True, padx=12, pady=10)

        self._reset_stats()

        # Log de execução
        log_frm = tk.LabelFrame(frm, text=" Log de Execução ", font=_fonte(10, True),
                                 bg=COR_CINZA, fg=COR_AZUL, bd=1, relief="groove")
        log_frm.pack(fill="both", expand=True, padx=16, pady=10)

        self.txt_log = tk.Text(log_frm, font=("Consolas", 9), bg="#0D1117",
                               fg="#C9D1D9", insertbackground=COR_BRANCO,
                               relief="flat", wrap="word", state="disabled",
                               padx=10, pady=8)
        sc = ttk.Scrollbar(log_frm, command=self.txt_log.yview)
        self.txt_log.configure(yscrollcommand=sc.set)
        sc.pack(side="right", fill="y")
        self.txt_log.pack(fill="both", expand=True)

        self.txt_log.tag_configure("ok",    foreground="#58D68D")
        self.txt_log.tag_configure("erro",  foreground="#EC7063")
        self.txt_log.tag_configure("aviso", foreground="#F7DC6F")
        self.txt_log.tag_configure("info",  foreground="#85C1E9")

    def _reset_stats(self):
        """Limpa e reseta painel de estatísticas."""
        for widget in self.stats_frame.winfo_children():
            widget.destroy()
        stats_texto = [
            ("Cobranças Enviadas", "0", COR_VERDE),
            ("Indeterminadas Puladas", "0", COR_LARANJA),
            ("Recobrança Pulada", "0", "#FFC107"),
            ("Erros de Envio", "0", "#EC7063"),
        ]

        # Criar explicitamente cada linha e manter referência aos labels de valor
        frm = tk.Frame(self.stats_frame, bg=COR_CINZA)
        frm.pack(fill="x", pady=4)
        tk.Label(frm, text="Cobranças Enviadas:", font=_fonte(10),
                 bg=COR_CINZA, fg=COR_TEXTO, width=25, anchor="w").pack(side="left")
        val_enviadas = tk.Label(frm, text="0", font=_fonte(11, True), bg=COR_CINZA, fg=COR_VERDE)
        val_enviadas.pack(side="left", padx=(10,0))

        frm = tk.Frame(self.stats_frame, bg=COR_CINZA)
        frm.pack(fill="x", pady=4)
        tk.Label(frm, text="Indeterminadas Puladas:", font=_fonte(10),
                 bg=COR_CINZA, fg=COR_TEXTO, width=25, anchor="w").pack(side="left")
        val_indeterminadas = tk.Label(frm, text="0", font=_fonte(11, True), bg=COR_CINZA, fg=COR_LARANJA)
        val_indeterminadas.pack(side="left", padx=(10,0))

        frm = tk.Frame(self.stats_frame, bg=COR_CINZA)
        frm.pack(fill="x", pady=4)
        tk.Label(frm, text="Recobrança Pulada:", font=_fonte(10),
                 bg=COR_CINZA, fg=COR_TEXTO, width=25, anchor="w").pack(side="left")
        val_recobranca = tk.Label(frm, text="0", font=_fonte(11, True), bg=COR_CINZA, fg="#FFC107")
        val_recobranca.pack(side="left", padx=(10,0))

        frm = tk.Frame(self.stats_frame, bg=COR_CINZA)
        frm.pack(fill="x", pady=4)
        tk.Label(frm, text="Erros de Envio:", font=_fonte(10),
                 bg=COR_CINZA, fg=COR_TEXTO, width=25, anchor="w").pack(side="left")
        val_erros = tk.Label(frm, text="0", font=_fonte(11, True), bg=COR_CINZA, fg="#EC7063")
        val_erros.pack(side="left", padx=(10,0))

        self.stats_labels = {
            "enviadas": val_enviadas,
            "indeterminadas": val_indeterminadas,
            "recobranca": val_recobranca,
            "erros": val_erros,
        }

    # ── Aba Configurações ────────────────────────────────────────────────────
    def _aba_configuracoes(self, nb):
        frm = tk.Frame(nb, bg=COR_CINZA)
        nb.add(frm, text="  ⚙  Configurações  ")

        pnl = tk.LabelFrame(frm, text=" Parâmetros de Cobrança ", font=_fonte(10, True),
                             bg=COR_CINZA, fg=COR_AZUL, bd=1, relief="groove")
        pnl.pack(fill="x", padx=20, pady=(18,8))

        campos = [
            ("Dias mínimos vencido para cobrar:", "dias_minimos_cobranca", 3, 30),
            ("Dias mínimos entre cobranças:", "dias_entre_cobracas", 1, 30),
        ]

        self._entries_cfg = {}
        for i, (label, key, min_val, max_val) in enumerate(campos):
            tk.Label(pnl, text=label, font=_fonte(10), bg=COR_CINZA, anchor="e").grid(
                row=i, column=0, padx=14, pady=8, sticky="e")
            var = tk.IntVar(value=self.cfg.get(key, min_val))
            sb = ttk.Spinbox(pnl, from_=min_val, to=max_val, textvariable=var, width=10)
            sb.grid(row=i, column=1, padx=8, pady=8, sticky="w")
            self._entries_cfg[key] = var

        tk.Button(frm, text="💾  Salvar Configurações",
                  font=_fonte(11, True), bg=COR_AZUL, fg=COR_BRANCO,
                  activebackground="#1A3A7A", cursor="hand2",
                  relief="flat", padx=18, pady=8,
                  command=self._salvar_cfg).pack(pady=16)

        self.lbl_cfg_ok = tk.Label(frm, text="", font=_fonte(10), bg=COR_CINZA)
        self.lbl_cfg_ok.pack()

    # ── Aba Logs ─────────────────────────────────────────────────────────────
    def _aba_logs(self, nb):
        frm = tk.Frame(nb, bg=COR_CINZA)
        nb.add(frm, text="  📋  Histórico de Logs  ")

        info = tk.Label(frm, text=f"Pasta de logs: {LOG_DIR}", 
                       font=_fonte(10), bg=COR_CINZA, fg=COR_TEXTO)
        info.pack(padx=16, pady=16, anchor="w")

        btn = tk.Button(frm, text="📁  Abrir Pasta de Logs",
                       font=_fonte(10), bg=COR_AZUL, fg=COR_BRANCO,
                       activebackground="#1A3A7A", cursor="hand2",
                       relief="flat", padx=14, pady=8,
                       command=self._abrir_logs).pack(padx=16, pady=8, anchor="w")

        # Lista de logs
        list_frm = tk.LabelFrame(frm, text=" Arquivos de Log ", font=_fonte(10, True),
                                 bg=COR_CINZA, fg=COR_AZUL, bd=1, relief="groove")
        list_frm.pack(fill="both", expand=True, padx=16, pady=(8,16))

        self.listbox_logs = tk.Listbox(list_frm, font=_fonte(9), bg="#0D1117",
                                       fg="#C9D1D9", relief="flat", height=12)
        sc = ttk.Scrollbar(list_frm, command=self.listbox_logs.yview)
        self.listbox_logs.configure(yscrollcommand=sc.set)
        sc.pack(side="right", fill="y")
        self.listbox_logs.pack(fill="both", expand=True, padx=10, pady=8)

        self._atualizar_lista_logs()

    # ── Ações ────────────────────────────────────────────────────────────────
    def _log(self, msg: str):
        """Escreve no log de forma thread-safe."""
        def _write():
            self.txt_log.configure(state="normal")
            tag = "info"
            if any(x in msg for x in ["✅","OK","Cobrado"]):         tag = "ok"
            elif any(x in msg for x in ["❌","Erro","ERRO"]):        tag = "erro"
            elif any(x in msg for x in ["⚠️","Aviso","aviso","⏭️"]):  tag = "aviso"
            self.txt_log.insert("end", msg+"\n", tag)
            self.txt_log.see("end")
            self.txt_log.configure(state="disabled")
            self.lbl_status.configure(text=msg[:80])
        self.after(0, _write)

    def _limpar_log(self):
        self.txt_log.configure(state="normal")
        self.txt_log.delete("1.0","end")
        self.txt_log.configure(state="disabled")

    def _abrir_planilha(self):
        pasta = os.path.join(os.path.dirname(__file__), "ouvidorias")
        relat = os.path.join(pasta, "ouvidorias.xlsx")
        if os.path.exists(relat):
            os.startfile(relat) if sys.platform == "win32" else os.system(f"xdg-open '{relat}'")
        else:
            messagebox.showinfo("Arquivo não encontrado",
                                f"Planilha não encontrada em:\n{relat}\n\n"
                                "Execute o processamento de ouvidorias primeiro.")

    def _abrir_logs(self):
        if os.path.exists(LOG_DIR):
            os.startfile(LOG_DIR) if sys.platform == "win32" else os.system(f"xdg-open '{LOG_DIR}'")
        else:
            messagebox.showinfo("Pasta não encontrada", f"Pasta de logs: {LOG_DIR}")

    def _atualizar_lista_logs(self):
        self.listbox_logs.delete(0, tk.END)
        if os.path.exists(LOG_DIR):
            try:
                logs = sorted([f for f in os.listdir(LOG_DIR) if f.endswith(".log")], reverse=True)
                for log in logs:
                    self.listbox_logs.insert(tk.END, log)
            except Exception as e:
                self.listbox_logs.insert(tk.END, f"Erro ao listar logs: {e}")

    def _salvar_cfg(self):
        for key, var in self._entries_cfg.items():
            self.cfg[key] = var.get()
        salvar_config_cobranca(self.cfg)
        self.lbl_cfg_ok.configure(text="✅ Configurações salvas!", fg=COR_VERDE)
        self.after(3000, lambda: self.lbl_cfg_ok.configure(text=""))

    def _iniciar_cobrancas(self):
        if self.rodando:
            messagebox.showwarning("Aguarde", "Ciclo de cobranças em andamento...")
            return

        self.rodando = True
        self.btn_run.configure(state="disabled", text="⏳  Executando...")
        self.progress.start(12)
        self._limpar_log()
        self._reset_stats()
        self._log(f"\n{'─'*50}")
        self._log(f"Iniciando ciclo de cobranças — {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")

        def _run():
            try:
                stats = executar_cobranca(log_func=self._log)
                
                # Atualizar painel de estatísticas
                self.after(0, lambda: self._atualizar_stats(stats))
            except Exception as e:
                self._log(f"❌ Erro inesperado: {e}")
            finally:
                self.after(0, self._finalizar)
                self._atualizar_lista_logs()

        threading.Thread(target=_run, daemon=True).start()

    def _atualizar_stats(self, stats):
        """Atualiza painel de estatísticas com resultados."""
        if "total_enviadas" in stats:
            # Encontrar labels e atualizar
            labels_stats = self.stats_frame.winfo_children()
            if len(labels_stats) >= 8:
                labels_stats[1].configure(text=str(stats.get("total_enviadas", 0)))
                labels_stats[3].configure(text=str(stats.get("indeterminadas_puladas", 0)))
                labels_stats[5].configure(text=str(stats.get("recobranca_pulada", 0)))
                labels_stats[7].configure(text=str(stats.get("erros_envio", 0)))

    def _finalizar(self):
        self.rodando = False
        self.progress.stop()
        self.btn_run.configure(state="normal", text="▶  Executar Ciclo de Cobranças")
        self.lbl_status.configure(text="Ciclo concluído.")


# =============================================================================
# ENTRY POINT
# =============================================================================
if __name__ == "__main__":
    app = CobrancaApp()
    app.mainloop()
