# Sistema de Mapeamento de Reclamações

![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/Licença-Uso%20Interno-lightgrey)
![Status](https://img.shields.io/badge/Status-Ativo-brightgreen)

> **Ferramenta de controle gerencial e auditoria territorial de reclamações e elogios das Unidades de Saúde da Família (USF) — Prefeitura Municipal de Suzano · SP**

Sistema que automatiza o ciclo completo de uma ouvidoria pública de saúde: leitura autônoma de e-mails via agente LLM, extração por OCR, classificação inteligente, registro auditável em planilha Excel e dashboard web interativo com visão territorial.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Agente Autônomo](#agente-autônomo)
- [Classificação LLM](#classificação-llm)
- [Arquitetura](#arquitetura)
- [Instalação Rápida](#instalação-rápida)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [Dashboard Web](#dashboard-web)
- [API REST](#api-rest)
- [Agendamento](#agendamento)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Stack](#stack)

---

## Visão Geral

```
Gmail (IMAP)
     │
     ▼
Agente Autônomo (LLM)  ◄──  Groq API (llama-3.3-70b)
     │  ├─ Classifica: OUVIDORIA vs RESPOSTA
     │  ├─ Extrai: protocolo, unidade, reclamante, data, assunto
     │  └─ Vincula respostas a ouvidorias existentes
     ▼
ouvidorias.xlsx  ──►  Dashboard Web (localhost:7731)
                           React 18 · FastAPI
```

| Modo | Descrição |
|------|-----------|
| **Agente autônomo** | LLM raciocina sobre cada e-mail, classifica e registra autonomamente |
| **Cron diário 08h** | Executa automaticamente todo dia das 8h, processa e-mails novos |
| **Dashboard manual** | Formulários para entrada e edição quando necessário |
| **Busca manual** | Botão "Buscar E-mails" com seleção de período no dashboard |

---

## Funcionalidades

### 🤖 Agente autônomo
- Agente LLM com **Groq function calling** (llama-3.3-70b-versatile)
- Raciocínio contextual: identifica se uma resposta corresponde a uma ouvidoria existente
- Executa ferramentas: listar e-mails, baixar PDFs, salvar, vincular, mover para labels Gmail
- Retry automático em rate limit · Compactação de histórico para contextos longos

### 🔍 OCR + Extração
- Leitura de **PDFs e imagens** (pdfplumber + pytesseract)
- Fallback automático para OCR forçado quando texto digital é insuficiente
- Extrai: protocolo (P.O. XXXXX/AAAA), unidade, reclamante, data, assunto

### 🧠 Classificação LLM
- **Groq API** (gratuita, 14.400 req/dia) com llama-3.1-8b-instant
- Alternativa: **Ollama** local (zero custo, zero internet)
- Fallback automático para regex se confiança < 0.6 ou LLM indisponível
- Classifica OUVIDORIA vs RESPOSTA com confiança 0–1

### 📊 Dashboard web — `localhost:7731`
- **Command Center** — KPIs globais, ranking por unidade, tabela filtrável, exportação CSV
- **Triagem** — Inbox priorizado por urgência legal (vencido → crítico → atenção → no prazo)
- **Mapa territorial** — Mapa esquemático de Suzano com 12 pins coloridos por status
- Auto-refresh a cada 60 segundos

### ⚖️ Controle de prazos — Lei 13.460/2017
| Tier | Critério | Visual |
|------|----------|--------|
| Vencida | Prazo expirado | Vermelho pulsante |
| Urgente | ≤ 3 dias restantes | Vermelho |
| Atenção | ≤ 10 dias restantes | Amarelo |
| No prazo | > 10 dias | Verde |
| Resolvida | Respondida / Fechada | Cinza |

### 🛠️ Ações no dashboard
- **Nova ouvidoria** — formulário completo
- **Buscar e-mails** — busca com seleção de período e log em tempo real
- **Enviar lembretes** — e-mails de cobrança para gestores de unidades selecionadas
- **Deletar** — remoção com confirmação
- **Encaminhar / Registrar resposta / Editar** — gestão de ciclo de vida
- **Auto-scan** — indicador de status do scheduler no toolbar

### 📧 Cobranças automáticas
- Envio de e-mails de cobrança para gestores de unidade com ouvidorias pendentes
- Filtro por unidade · Intervalo mínimo entre cobranças · Log completo

---

## Agente Autônomo

O agente `agente_ouvidoria.py` usa **Groq function calling** para processar e-mails de forma autônoma:

```bash
# Processar e-mails novos (não lidos)
python agente_ouvidoria.py

# Reprocessar todos os e-mails (INBOX + labels Ouvidorias)
python agente_ouvidoria.py --reprocessar
```

**Ferramentas disponíveis para o agente:**

| Ferramenta | Descrição |
|-----------|-----------|
| `listar_emails_pendentes` | Lista e-mails com PDF relacionados a ouvidorias |
| `baixar_e_ler_pdf` | Baixa PDF e extrai texto (OCR se necessário) |
| `buscar_ouvidoria_por_protocolo` | Consulta Excel por número de protocolo |
| `salvar_ouvidoria` | Grava nova ouvidoria no Excel e move PDF |
| `vincular_resposta` | Atualiza registro existente com a resposta |
| `mover_e_marcar_processado` | Aplica labels Gmail corretas |

**Fluxo de decisão do agente:**
```
listar_emails_pendentes
    └─ para cada e-mail com PDF:
        baixar_e_ler_pdf
            ├─ É OUVIDORIA? → salvar_ouvidoria
            └─ É RESPOSTA?  → buscar_ouvidoria_por_protocolo
                                  └─ vincular_resposta
        mover_e_marcar_processado
```

---

## Classificação LLM

Configurar em `config.json`:

```json
{
  "llm_backend":          "groq",
  "llm_model":            "llama-3.1-8b-instant",
  "groq_api_key":         "<sua-chave-gratuita>",
  "llm_confianca_minima": 0.6
}
```

**Opção local (sem internet):**
```bash
# Instalar Ollama: https://ollama.com
ollama pull llama3.2

# config.json:
# "llm_backend": "ollama"
# "llm_model":   "llama3.2"
```

> Groq gratuito: [console.groq.com](https://console.groq.com) — 14.400 req/dia, sem cartão de crédito.

---

## Arquitetura

```
ouvidoria_bot/
│
├── agente_ouvidoria.py      # ► Agente autônomo LLM (Groq function calling)
├── classificador_llm.py     # ► Classificação via Groq ou Ollama
├── dashboard_server.py      # ► Servidor FastAPI porta 7731 (API + frontend)
├── ouvidoriagmail.py        # ► Leitor IMAP/Gmail + pipeline OCR
├── ouvidoriabot.py          # ► App principal Tkinter
├── constantes.py            # ► Catálogo USFs, colunas Excel, classificadores
├── cobrar.py                # ► Motor de cobranças por e-mail
├── banco.py                 # ► SQLite — e-mails dos gestores
│
├── dashboard/               # ► Frontend React (sem build step)
│   ├── data.jsx             #   Camada de dados e API client
│   ├── command-center.jsx   #   KPIs + busca e-mails + scheduler + deletar
│   ├── split-triagem.jsx    #   Inbox + formulários + histórico + deletar
│   └── mapa-unidades.jsx    #   Mapa territorial com pins
│
├── agente.log               # ► Log do agente (gerado em runtime, gitignore)
├── config.json              # ► Credenciais e opções (gitignore)
├── config.json.example      # ► Template de configuração
└── requirements.txt         # ► Dependências Python
```

---

## Instalação Rápida

```bash
# 1. Clonar
git clone https://github.com/ryandelima27/Sistema-de-mapeamento-de-reclama-es.git
cd Sistema-de-mapeamento-de-reclama-es

# 2. Criar ambiente virtual e instalar dependências
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Configurar
cp config.json.example config.json
# Edite config.json com seu e-mail, senha de app e chave Groq

# 4. Iniciar o dashboard
python dashboard_server.py
# Acesse http://localhost:7731
```

> **Tesseract OCR** e **Poppler** precisam ser instalados separadamente.  
> Linux: `sudo apt install tesseract-ocr poppler-utils`  
> Windows: veja [README_INSTALL.md](README_INSTALL.md)

---

## Configuração

```json
{
  "email":                  "ouvidoria@exemplo.gov.br",
  "senha_app":              "xxxx xxxx xxxx xxxx",
  "remetente_ouvidoria":    "",
  "pasta_base":             "ouvidorias",
  "prazo_dias":             "10",
  "tesseract_path":         "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
  "remover_arquivos_depois": true,

  "usar_agente":            true,
  "scheduler_enabled":      false,
  "scheduler_interval_min": 20,

  "llm_backend":            "groq",
  "llm_model":              "llama-3.1-8b-instant",
  "groq_api_key":           "<sua-chave>",
  "ollama_url":             "http://localhost:11434",
  "llm_confianca_minima":   0.6
}
```

| Campo | Descrição |
|-------|-----------|
| `usar_agente` | `true` usa o agente LLM · `false` usa pipeline regex |
| `scheduler_enabled` | Liga o scheduler interno do dashboard |
| `llm_backend` | `"groq"`, `"ollama"` ou `"disabled"` |
| `llm_confianca_minima` | Abaixo desse valor, cai no fallback regex |

> ⚠️ `config.json` está no `.gitignore` — **nunca versionar credenciais**

---

## Como Usar

### Dashboard web
```bash
python dashboard_server.py
# Acesse http://localhost:7731
```

### Agente manual
```bash
python agente_ouvidoria.py              # e-mails novos
python agente_ouvidoria.py --reprocessar  # todos os e-mails
```

### Acompanhar log do agente
```bash
tail -f agente.log
```

---

## Dashboard Web

Acessível em `http://localhost:7731`

| Funcionalidade | Localização |
|----------------|-------------|
| KPIs + tabela gerencial | Aba "Visão geral" |
| Triagem por urgência | Aba "Triagem avançada" |
| Mapa de Suzano | Botão no toolbar |
| Buscar e-mails (com log) | Botão 📥 no toolbar |
| Enviar lembretes | Botão 📧 no toolbar |
| Status auto-scan | Indicador ● no toolbar |
| Deletar ouvidoria | Botão 🗑 no detalhe |

---

## API REST

Servidor em `http://localhost:7731/api`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/ouvidorias` | Lista todas as ouvidorias |
| `POST` | `/api/ouvidorias` | Cria nova ouvidoria |
| `PATCH` | `/api/ouvidorias/{protocolo}` | Atualiza campos |
| `DELETE` | `/api/ouvidorias/{protocolo}` | Remove ouvidoria |
| `POST` | `/api/processar-emails` | Inicia busca de e-mails (background job) |
| `GET` | `/api/jobs/{job_id}` | Status e log de um job em execução |
| `POST` | `/api/cobrar` | Dispara e-mails de cobrança |
| `GET` | `/api/scheduler/status` | Status do scheduler automático |
| `POST` | `/api/scheduler/start` | Ativa scheduler com intervalo configurável |
| `POST` | `/api/scheduler/stop` | Desativa scheduler |
| `POST` | `/api/scheduler/executar-agora` | Executa ciclo imediatamente |

---

## Agendamento

O agente roda automaticamente via **cron** todo dia às **08h**:

```bash
# Ver agendamento atual
crontab -l

# Acompanhar execução
tail -f /home/<usuario>/ouvidoria_bot/agente.log
```

Cron configurado:
```
0 8 * * * /path/to/venv/bin/python /path/to/agente_ouvidoria.py >> agente.log 2>&1
```

---

## Unidades Cadastradas

12 USFs do município de Suzano, SP:

| Unidade | Bairro |
|---------|--------|
| USF Vereador Marsal Lopes Rosa | Vila Amorim |
| USF Recanto São José | Recanto São José |
| USF Jardim do Lago | Jardim do Lago |
| USF Marcelino Maria Rodrigues | Jardim Brasil |
| USF Maria Jose Lima Souza | Jardim Ikeda |
| USF Dr. Eduardo Nakamura | Cidade Boa Vista |
| USF Jardim Europa | Jardim Europa |
| USF Jardim Revista | Jardim Revista |
| USF Vereador Gregório Bonifácio da Silva | Vila Fátima |
| USF Onesia Benedita Miguel | Jardim Suzanópolis |
| USF Antonio Marques de Carvalho | Jardim Maité |
| USF Manuel Evangelista de Oliveira | Jardim São José |

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Agente LLM | Groq API · llama-3.3-70b-versatile · function calling |
| Classificação | Groq API · llama-3.1-8b-instant · Ollama (local) |
| OCR e extração | pdfplumber · pytesseract · pdf2image · Pillow |
| E-mail | imapclient · pyzmail · smtplib |
| Servidor web | FastAPI · uvicorn · APScheduler |
| Dashboard | React 18 · Babel standalone · CSS oklch |
| Dados | openpyxl · SQLite3 |
| Interface desktop | Python · Tkinter · tkcalendar |
| HTTP client | requests |

---

## Segurança

- `config.json` no `.gitignore` — credenciais nunca versionadas
- `ouvidorias/` e `ouvidorias.db` no `.gitignore` — dados de cidadãos nunca versionados
- Servidor FastAPI escuta apenas em `127.0.0.1` — não exposto na rede
- Chave Groq lida em tempo de execução do `config.json`

---

*Desenvolvido para a Coordenação de Atenção Básica — Secretaria Municipal de Saúde de Suzano · SP*
