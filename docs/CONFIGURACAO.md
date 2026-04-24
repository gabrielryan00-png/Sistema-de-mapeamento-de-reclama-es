# Configuração

## config.json

Copie `config.json.example` para `config.json` e preencha os campos:

```json
{
  "email":                  "ouvidoria@gmail.com",
  "senha_app":              "xxxx xxxx xxxx xxxx",
  "remetente_ouvidoria":    "",
  "pasta_base":             "ouvidorias",
  "prazo_dias":             "30",
  "tesseract_path":         "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
  "remover_arquivos_depois": false,
  "scheduler_enabled":      false,
  "scheduler_interval_min": 60
}
```

### Referência dos campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `email` | string | E-mail Gmail da caixa de ouvidoria |
| `senha_app` | string | Senha de app Google (16 caracteres) — **não é a senha da conta** |
| `remetente_ouvidoria` | string | Filtra e-mails por remetente específico. Deixe `""` para processar qualquer remetente |
| `pasta_base` | string | Pasta raiz onde os arquivos e a planilha serão salvos (relativa ao diretório do sistema) |
| `prazo_dias` | string | Prazo padrão em dias para resposta (padrão: `"30"` conforme Lei 13.460/2017) |
| `tesseract_path` | string | Caminho para o executável do Tesseract OCR. No Linux/macOS, deixe `""` (usa o PATH) |
| `remover_arquivos_depois` | bool | Se `true`, remove os PDFs do e-mail após processar |
| `scheduler_enabled` | bool | Habilita o agendador automático de processamento |
| `scheduler_interval_min` | int | Intervalo em minutos entre execuções automáticas |

---

## Como gerar a Senha de App Gmail

A senha de app é necessária para que o sistema acesse o Gmail via IMAP.  
**Não use a senha normal da conta Google.**

1. Acesse [myaccount.google.com](https://myaccount.google.com)
2. Segurança → **Verificação em duas etapas** (ative se ainda não tiver)
3. Segurança → **Senhas de app**
4. Selecione app: "Outro (nome personalizado)" → "Ouvidoria Bot"
5. Clique em **Gerar**
6. Copie os 16 caracteres gerados para o campo `senha_app` do `config.json`

---

## Banco de dados — e-mails das unidades

O arquivo `banco.py` armazena os e-mails institucionais de cada USF em um banco SQLite (`ouvidorias.db`). Esses e-mails são usados pelo módulo de cobranças para notificar os gestores de unidade.

### Configurar e-mails

1. Abra `banco.py`
2. Na função `inserir_unidades()`, preencha o e-mail de cada unidade:

```python
dados = {
    "USF Dr. Eduardo Nakamura":                    "email@unidade.gov.br",
    "USF Jardim Europa":                           "email@unidade.gov.br",
    # ... demais unidades
}
```

3. Execute para criar/atualizar o banco:

```bash
python banco.py
```

> ⚠️ `ouvidorias.db` está no `.gitignore` — os e-mails não são versionados.

---

## Estrutura de pastas gerada

Após a primeira execução, o sistema cria automaticamente:

```
ouvidorias/                    # pasta_base
├── ouvidorias.xlsx            # planilha principal de auditoria
├── ouvidorias/                # PDFs de ouvidorias processadas
├── respostas/                 # PDFs de respostas das unidades
└── indefinidos/               # documentos que precisam revisão manual
```

### Pasta `indefinidos/`

Documentos com sinais de ouvidoria (palavras-chave, nomes de unidades) mas sem dados suficientes para extração automática (protocolo ou unidade não identificados) são movidos para `indefinidos/`.

**Como tratar:**
1. Abra o PDF em `ouvidorias/indefinidos/`
2. Verifique os dados manualmente
3. Use o **formulário manual no dashboard** (`+ Nova Ouvidoria`) para registrar
4. Mova o arquivo para a pasta correta ou descarte

---

## Colunas da planilha Excel

| Coluna | Preenchimento |
|--------|---------------|
| Protocolo | Automático (OCR) ou manual |
| Unidade | Automático (OCR + catálogo) ou manual |
| Data Recebimento | Data do e-mail ou entrada manual |
| Prazo Resposta | Data Recebimento + `prazo_dias` |
| Assunto | Categoria detectada ou informada |
| Status | `PENDENTE` → `ENCAMINHADA` → `RESPONDIDA` → `FECHADA` |
| Data Respondida | Preenchido ao registrar resposta no dashboard |
| Arquivo | Nome do PDF original |
| Arquivo Resposta | Nome do PDF de resposta |
| Observações | Texto extraído por OCR ou relato manual |
| Data Última Cobrança | Controlado automaticamente pelo módulo de cobranças |
| Reclamante | Nome ou vazio (anônimo) |
| Canal | `E-mail`, `Presencial`, `Telefone 156`, `WhatsApp`, `Sistema` |

---

## Catálogo de USFs (`constantes.py`)

Cada USF tem um nome oficial e uma lista de aliases para normalização:

```python
CATALOGO_USF = [
    {
        "nome": "USF Vereador Marsal Lopes Rosa",
        "aliases": ["marsal rosa", "vila amorim", "usf vila amorim", ...]
    },
    ...
]
```

Para adicionar uma nova unidade ou alias, edite `CATALOGO_USF` em `constantes.py` e reinicie o sistema.

---

## Agendador automático

Com `scheduler_enabled: true`, o sistema processa e-mails automaticamente no intervalo definido em `scheduler_interval_min`.

O agendador também pode ser iniciado/parado manualmente na aba **⚙ Configurações** do aplicativo Tkinter.

> **Recomendação:** use intervalo mínimo de 30 minutos para evitar sobrecarga na API do Gmail.
