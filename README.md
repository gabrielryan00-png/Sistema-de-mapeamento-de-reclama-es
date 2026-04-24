# Sistema de Mapeamento de Reclamações

![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-black?logo=flask)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/Licença-Uso%20Interno-lightgrey)
![Status](https://img.shields.io/badge/Status-Ativo-brightgreen)

> **Ferramenta de controle gerencial e auditoria territorial de reclamações e elogios das Unidades de Saúde da Família (USF) — Prefeitura Municipal de Suzano · SP**

Sistema que automatiza o ciclo completo de uma ouvidoria pública de saúde: captura de e-mails com documentos anexos, extração por OCR, registro auditável em planilha Excel e dashboard web interativo com visão territorial.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Instalação Rápida](#instalação-rápida)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [Dashboard Web](#dashboard-web)
- [API REST](#api-rest)
- [Documentação Completa](#documentação-completa)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Stack](#stack)

---

## Visão Geral

```
E-mail Gmail ──► Extração OCR ──► ouvidorias.xlsx ──► Dashboard Web
                 (PDF + imagem)     (auditoria)       localhost:7731
                      │                  ▲
                      │                  │ API REST
                      └─ Formulário manual (quando OCR falha)
```

O sistema funciona em dois modos:

| Modo | Descrição |
|------|-----------|
| **Automático** | Lê e-mails, extrai dados de PDFs/imagens por OCR, classifica e grava na planilha |
| **Manual** | Dashboard web com formulário para entrada quando o OCR falha ou para registros diretos |

---

## Funcionalidades

### 🔄 Processamento automático
- Leitura de caixa de entrada Gmail via **IMAP**
- Extração de dados de **PDFs e imagens** (pdfplumber + pytesseract)
- Classificação automática: **ouvidoria nova** vs **resposta da unidade**
- Normalização de nomes de USF via catálogo com aliases configuráveis
- Gravação automática em `ouvidorias.xlsx` com formatação institucional

### 📊 Dashboard web — `localhost:7731`
- **Command Center** — KPIs globais, ranking por unidade, tabela filtrável com exportação CSV
- **Triagem** — Inbox priorizado por urgência legal (vencido → crítico → atenção → no prazo)
- **Mapa territorial** — Mapa esquemático de Suzano com 12 pins coloridos por status
- **Histórico** — Tabela de respondidas com tempo de resposta e indicador de prazo

### ⚖️ Controle de prazos — Lei 13.460/2017
| Tier | Critério | Visual |
|------|----------|--------|
| Vencida | Prazo expirado | Vermelho pulsante |
| Urgente | ≤ 3 dias restantes | Vermelho |
| Atenção | ≤ 10 dias restantes | Amarelo |
| No prazo | > 10 dias | Verde |
| Resolvida | Respondida / Fechada | Cinza |

### 🛠️ Ações de gestão (dashboard)
- **Nova ouvidoria** — Formulário completo com protocolo automático
- **Encaminhar** — Muda status para `ENCAMINHADA` com confirmação
- **Registrar resposta** — Registra data e muda status para `RESPONDIDA`
- **Editar** — Altera qualquer campo de ouvidoria existente
- **Exportar CSV** — Exporta lista filtrada atual

### 📧 Agendador de cobranças
- Envio automático de e-mails de cobrança aos gestores de unidade
- Intervalo mínimo configurável entre cobranças (evita spam)
- Log completo de cobranças enviadas

---

## Arquitetura

```
ouvidoria_bot/
│
├── ouvidoriabot.py          # ► App principal Tkinter (3 abas)
├── dashboard_server.py      # ► Servidor Flask porta 7731 (API + frontend)
├── constantes.py            # ► Catálogo USFs, colunas Excel, classificadores
├── banco.py                 # ► SQLite — e-mails dos gestores
├── ouvidoriagmail.py        # ► Leitor IMAP/Gmail
├── cobrar.py                # ► Motor de cobranças por e-mail
├── cobranca_gui.py          # ► Interface de cobranças
├── run.py                   # ► Ponto de entrada CLI
│
├── dashboard/               # ► Frontend React (sem build step)
│   ├── data.jsx             #   Camada de dados e API client
│   ├── command-center.jsx   #   Painel KPIs + tabela gerencial
│   ├── split-triagem.jsx    #   Inbox + formulários + histórico
│   └── mapa-unidades.jsx    #   Mapa territorial com pins
│
├── docs/                    # ► Documentação
│   ├── INSTALACAO.md
│   ├── CONFIGURACAO.md
│   ├── USO.md
│   └── API.md
│
├── icons/                   # ► Ícones do aplicativo
├── scripts/                 # ► Utilitários (geração de ícones)
├── config.json.example      # ► Template de configuração
└── requirements.txt         # ► Dependências Python
```

---

## Instalação Rápida

```bash
# 1. Clonar
git clone https://github.com/gabrielryan00-png/Sistema-de-mapeamento-de-reclama-es.git
cd Sistema-de-mapeamento-de-reclama-es

# 2. Instalar tudo (Linux/macOS)
make install

# 3. Configurar
cp config.json.example config.json
# Edite config.json com seu e-mail e senha de app

# 4. Iniciar
python ouvidoriabot.py
```

> **Windows:** veja [docs/INSTALACAO.md](docs/INSTALACAO.md)  
> **Tesseract OCR** e **Poppler** precisam ser instalados separadamente — instruções em [docs/INSTALACAO.md](docs/INSTALACAO.md)

---

## Configuração

Copie `config.json.example` para `config.json` e preencha:

```json
{
  "email":               "ouvidoria@exemplo.gov.br",
  "senha_app":           "xxxx xxxx xxxx xxxx",
  "remetente_ouvidoria": "",
  "pasta_base":          "ouvidorias",
  "prazo_dias":          "30",
  "tesseract_path":      "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
  "remover_arquivos_depois": false,
  "scheduler_enabled":   false,
  "scheduler_interval_min": 60
}
```

> ⚠️ `config.json` está no `.gitignore` — **nunca versionar credenciais**

Documentação completa: [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md)

---

## Como Usar

1. Inicie o sistema: `python ouvidoriabot.py`
2. O servidor do dashboard sobe automaticamente em `http://localhost:7731`
3. Use a aba **Processar** para buscar e-mails no período desejado
4. Clique em **🌐 Dashboard Web** para abrir o painel no navegador
5. Use o botão **+ Nova Ouvidoria** para inserir manualmente quando o OCR falhar

Guia completo: [docs/USO.md](docs/USO.md)

---

## Dashboard Web

O dashboard é uma aplicação React servida pelo Flask, acessível em `http://localhost:7731`.

| Vista | Acesso | Descrição |
|-------|--------|-----------|
| Command Center | Aba Dashboard | KPIs, gráficos, tabela gerencial |
| Triagem | Aba Triagem | Inbox priorizado por urgência |
| Mapa | Botão ⊕ Mapa | Mapa de Suzano com pins das USFs |
| Histórico | Segmento Resolvidas | Tabela de ouvidorias respondidas |

O painel atualiza os dados automaticamente a cada 60 segundos.

---

## API REST

Servidor local em `http://localhost:7731/api`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/ouvidorias` | Lista todas as ouvidorias |
| `POST` | `/api/ouvidorias` | Cria nova ouvidoria |
| `PATCH` | `/api/ouvidorias/{protocolo}` | Atualiza campos |

Documentação completa: [docs/API.md](docs/API.md)

---

## Documentação Completa

| Documento | Conteúdo |
|-----------|----------|
| [docs/INSTALACAO.md](docs/INSTALACAO.md) | Instalação detalhada Linux, macOS e Windows |
| [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md) | Todas as opções de config.json e banco de dados |
| [docs/USO.md](docs/USO.md) | Guia de uso completo: OCR, dashboard, cobranças |
| [docs/API.md](docs/API.md) | Referência completa da API REST |

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
| Interface desktop | Python · Tkinter · tkcalendar |
| OCR e extração | pdfplumber · pytesseract · pdf2image · Pillow |
| E-mail | imapclient · pyzmail · smtplib |
| Dados | openpyxl · SQLite3 |
| Servidor web | Flask · flask-cors |
| Agendamento | APScheduler |
| Dashboard | React 18 · Babel standalone · CSS oklch |

---

## Segurança

- `config.json` está no `.gitignore` — credenciais nunca versionadas
- `ouvidorias/` e `ouvidorias.db` estão no `.gitignore` — dados de cidadãos nunca versionados
- O servidor Flask escuta apenas em `127.0.0.1` — não exposto na rede local
- Reclamantes anônimos tratados sem armazenar nome

---

*Desenvolvido para a Coordenação de Atenção Básica — Secretaria Municipal de Saúde de Suzano · SP*
