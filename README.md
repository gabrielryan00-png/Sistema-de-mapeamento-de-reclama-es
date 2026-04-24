# Sistema de Ouvidoria — Atenção Básica Suzano

> Ferramenta de controle gerencial e auditoria territorial de reclamações e elogios das Unidades de Saúde da Família (USF) do município de Suzano — SP.

---

## Visão geral

O sistema automatiza o ciclo completo de uma ouvidoria de saúde: desde a **captura por e-mail e OCR** até o **controle de prazos legais**, o **encaminhamento às unidades** e o **registro das respostas** — tudo com rastreabilidade auditável em planilha Excel e dashboard web em tempo real.

```
Gmail / Sistema  →  OCR / Extração  →  Excel (auditoria)  →  Dashboard web
                                           ↑ PATCH API ↑
                                     Formulário manual
```

---

## Funcionalidades

### Processamento automático
- Leitura de e-mails recebidos via **IMAP/Gmail**
- Extração de dados de **PDFs e imagens** com `pdfplumber` + `pytesseract`
- Classificação automática como **ouvidoria** ou **resposta da unidade**
- Normalização de nomes de USF por catálogo com aliases configuráveis
- Geração e atualização da planilha `ouvidorias.xlsx`
- Agendador de cobranças automáticas por e-mail ao gestor de unidade

### Dashboard web (`localhost:7731`)
Painel dark-mode servido localmente via Flask, sem dependência de servidor externo.

| Aba | Descrição |
|-----|-----------|
| **Dashboard** | KPIs, ranking por unidade, tabela filtrável, linha do tempo |
| **Triagem** | Inbox priorizado por urgência (vencido → crítico → atenção → ok) |
| **Mapa** | Mapa esquemático de Suzano com pins coloridos por status |
| **Histórico** | Tabela de ouvidorias respondidas com tempo de resposta |

### Controle de prazos (Lei 13.460/2017)
- Prazo padrão de 30 dias corridos
- Classificação automática: **No prazo** · **Atenção (≤10d)** · **Urgente (≤3d)** · **Vencida**
- Alerta visual e pulso animado nas unidades com ouvidorias vencidas

### Formulário manual
Quando o OCR falha ou para entrada manual, o dashboard oferece formulário completo:
- Protocolo (gerado automaticamente se omitido: `MANUAL-{timestamp}`)
- Reclamante / anônimo
- Unidade (select com as 12 USFs cadastradas)
- Data de recebimento + prazo automático (+30 dias)
- Assunto, relato, canal, status

### Ações de gestão
- **Encaminhar** → muda status para `ENCAMINHADA` com confirmação
- **Registrar resposta** → registra data de resposta, muda status para `RESPONDIDA`
- **Editar** → edita qualquer campo de ouvidoria existente
- **Exportar CSV** → exporta a lista filtrada atual

---

## Arquitetura

```
ouvidoria_bot/
├── ouvidoriabot.py          # App Tkinter principal (3 abas: Processar, Planilha, Config)
├── dashboard_server.py      # Servidor Flask (porta 7731) — API REST + serve dashboard
├── constantes.py            # Catálogo de USFs, colunas Excel, regras de classificação
├── banco.py                 # SQLite com e-mails dos gestores de unidade
├── cobrar.py                # Motor de cobranças por e-mail
├── cobranca_gui.py          # Interface de cobranças
├── ouvidoriagmail.py        # Leitor IMAP/Gmail
├── run.py                   # Ponto de entrada alternativo
│
└── dashboard/               # Frontend React (Babel standalone, sem build step)
    ├── data.jsx             # Camada de dados: DATASET global, API fetch/create/update
    ├── command-center.jsx   # Painel de KPIs, tabela gerencial, ranking
    ├── split-triagem.jsx    # Inbox de triagem, formulários, histórico
    ├── mapa-unidades.jsx    # Mapa esquemático com pins de status
    └── design-canvas.jsx    # Wrapper visual (compat)
```

### Fluxo da API REST

| Método | Rota | Ação |
|--------|------|------|
| `GET` | `/api/ouvidorias` | Lista todas as ouvidorias da planilha |
| `POST` | `/api/ouvidorias` | Cria nova ouvidoria (append na planilha) |
| `PATCH` | `/api/ouvidorias/{protocolo}` | Atualiza campos de ouvidoria existente |

---

## Pré-requisitos

| Componente | Versão mínima |
|------------|---------------|
| Python | 3.9+ |
| Tesseract OCR | 5.x |
| Poppler (`pdf2image`) | qualquer |

---

## Instalação

### Linux / macOS
```bash
# 1. Clonar o repositório
git clone https://github.com/<org>/ouvidoria-bot.git
cd ouvidoria-bot

# 2. Ambiente virtual
python3 -m venv venv
source venv/bin/activate

# 3. Dependências Python
pip install -r requirements.txt

# 4. Tesseract
sudo apt install tesseract-ocr tesseract-ocr-por poppler-utils   # Debian/Ubuntu
brew install tesseract poppler                                     # macOS

# 5. Configuração
cp config.json.example config.json
# Edite config.json com suas credenciais de e-mail
```

### Windows
```powershell
# Instalar Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
# Instalar Poppler: https://github.com/oschwartz10612/poppler-windows

python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy config.json.example config.json
# Editar config.json — ajustar tesseract_path para o caminho correto
```

---

## Configuração (`config.json`)

```jsonc
{
  "email": "ouvidoria@exemplo.gov.br",   // Conta Gmail da ouvidoria
  "senha_app": "xxxx xxxx xxxx xxxx",    // Senha de app (não a senha da conta)
  "remetente_ouvidoria": "",             // Filtro de remetente (vazio = todos)
  "pasta_base": "ouvidorias",            // Pasta raiz dos dados
  "prazo_dias": "30",                    // Prazo padrão em dias
  "tesseract_path": "C:\\...\\tesseract.exe",
  "remover_arquivos_depois": false,
  "scheduler_enabled": false,            // Agendador automático
  "scheduler_interval_min": 60
}
```

**Senha de app Gmail:** Conta Google → Segurança → Verificação em duas etapas → Senhas de app.

---

## Execução

```bash
# Ativar venv
source venv/bin/activate   # Linux/macOS
venv\Scripts\activate      # Windows

# Iniciar o sistema
python ouvidoriabot.py
```

O dashboard web sobe automaticamente em `http://localhost:7731`.
Clique no botão **Dashboard Web** na interface Tkinter para abrir no navegador.

---

## Unidades cadastradas

O sistema contempla as 12 USFs do município de Suzano:

| ID | Unidade | Bairro |
|----|---------|--------|
| u1 | USF Vereador Marsal Lopes Rosa | Vila Amorim |
| u2 | USF Recanto São José | Recanto São José |
| u3 | USF Jardim do Lago | Jardim do Lago |
| u4 | USF Marcelino Maria Rodrigues | Jardim Brasil |
| u5 | USF Maria Jose Lima Souza | Jardim Ikeda |
| u6 | USF Dr. Eduardo Nakamura | Cidade Boa Vista |
| u7 | USF Jardim Europa | Jardim Europa |
| u8 | USF Jardim Revista | Jardim Revista |
| u9 | USF Vereador Gregório Bonifácio da Silva | Vila Fátima |
| u10 | USF Onesia Benedita Miguel | Jardim Suzanópolis |
| u11 | USF Antonio Marques de Carvalho | Jardim Maité |
| u12 | USF Manuel Evangelista de Oliveira | Jardim São José |

---

## Estrutura de dados (`ouvidorias.xlsx`)

| Coluna | Descrição |
|--------|-----------|
| Protocolo | Identificador único (ex: `2026-SZN-000123`) |
| Unidade | Nome oficial da USF |
| Data Recebimento | Data de entrada da ouvidoria |
| Prazo Resposta | Prazo legal (recebimento + 30 dias) |
| Assunto | Categoria da reclamação/elogio |
| Status | `PENDENTE` · `ENCAMINHADA` · `RESPONDIDA` · `FECHADA` · `REABERTA` |
| Data Respondida | Data em que a unidade respondeu |
| Arquivo | Nome do PDF original |
| Arquivo Resposta | Nome do PDF de resposta |
| Observações | Relato completo |
| Data Última Cobrança | Controle de cobranças enviadas |
| Reclamante | Nome (ou vazio para anônimo) |
| Canal | `E-mail` · `Presencial` · `Telefone 156` · `WhatsApp` · `Sistema` |

---

## Segurança e privacidade

- `config.json` está no `.gitignore` — **nunca versionar credenciais**
- `ouvidorias/` e `ouvidorias.db` estão no `.gitignore` — dados de cidadãos não versionados
- O servidor Flask escuta apenas em `127.0.0.1` (loopback) — não exposto na rede
- Reclamantes anônimos são tratados sem armazenar nome

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Desktop | Python 3 · Tkinter · tkcalendar |
| OCR | pdfplumber · pytesseract · pdf2image · Pillow |
| E-mail | imapclient · pyzmail · smtplib |
| Dados | openpyxl · SQLite |
| API | Flask · flask-cors |
| Agendador | APScheduler |
| Frontend | React 18 · Babel standalone · CSS (oklch) |

---

## Licença

Uso interno — Prefeitura Municipal de Suzano · Secretaria Municipal de Saúde
Desenvolvido para a Coordenação de Atenção Básica
