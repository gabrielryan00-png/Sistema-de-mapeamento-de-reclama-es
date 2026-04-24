# API REST

Servidor local em `http://localhost:7731/api`

O Flask escuta apenas em `127.0.0.1` — não é acessível pela rede local.

---

## Autenticação

Nenhuma. A API é local e não requer autenticação.

---

## Formato de datas

Todas as datas são retornadas e aceitas no formato `DD/MM/AAAA`.

---

## Endpoints

### `GET /api/ouvidorias`

Retorna todas as ouvidorias registradas.

**Resposta**

```json
[
  {
    "protocolo":        "OUV-2024-001",
    "unidade":          "USF Jardim Europa",
    "dataRecebimento":  "05/03/2024",
    "prazoResposta":    "04/04/2024",
    "assunto":          "Atendimento",
    "status":           "PENDENTE",
    "dataRespondida":   null,
    "arquivo":          "ouvidoria_001.pdf",
    "arquivoResposta":  "",
    "observacoes":      "Reclamação sobre tempo de espera.",
    "dataCobranca":     null,
    "reclamante":       "João Silva",
    "canal":            "E-mail"
  }
]
```

**Campos**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `protocolo` | string | Identificador único da ouvidoria |
| `unidade` | string | Nome oficial da USF |
| `dataRecebimento` | string | Data de entrada (`DD/MM/AAAA`) |
| `prazoResposta` | string | Prazo legal de resposta (`DD/MM/AAAA`) |
| `assunto` | string | Categoria da ocorrência |
| `status` | string | `PENDENTE`, `ENCAMINHADA`, `RESPONDIDA` ou `FECHADA` |
| `dataRespondida` | string \| null | Data em que a resposta foi registrada |
| `arquivo` | string | Nome do PDF original |
| `arquivoResposta` | string | Nome do PDF de resposta (se houver) |
| `observacoes` | string | Relato completo extraído por OCR ou inserido manualmente |
| `dataCobranca` | string \| null | Data da última cobrança enviada à unidade |
| `reclamante` | string | Nome do reclamante ou vazio se anônimo |
| `canal` | string | Canal de entrada da manifestação |

---

### `POST /api/ouvidorias`

Cria uma nova ouvidoria.

**Body (JSON)**

```json
{
  "protocolo":       "OUV-2024-099",
  "unidade":         "USF Jardim do Lago",
  "dataRecebimento": "15/04/2024",
  "assunto":         "Infraestrutura",
  "observacoes":     "Relato sobre infiltração no teto.",
  "reclamante":      "",
  "canal":           "Presencial"
}
```

Campos obrigatórios: `protocolo`, `unidade`, `dataRecebimento`.

Campos opcionais omitidos recebem valores padrão:
- `assunto` → `""`
- `observacoes` → `""`
- `reclamante` → `""` (anônimo)
- `canal` → `"E-mail"`
- `prazoResposta` → calculado automaticamente como `dataRecebimento + prazo_dias`
- `status` → `"PENDENTE"`

**Resposta de sucesso — `201 Created`**

```json
{ "ok": true, "protocolo": "OUV-2024-099" }
```

**Resposta de erro — `400 Bad Request`**

```json
{ "error": "protocolo já existe" }
```

---

### `PATCH /api/ouvidorias/{protocolo}`

Atualiza campos de uma ouvidoria existente.

**Parâmetro de rota**

| Parâmetro | Descrição |
|-----------|-----------|
| `protocolo` | Protocolo exato da ouvidoria (ex: `OUV-2024-001`) |

**Body (JSON)**

Envie apenas os campos que deseja atualizar:

```json
{
  "Status":         "RESPONDIDA",
  "Data Respondida": "20/04/2024"
}
```

Os nomes dos campos correspondem às colunas da planilha Excel (com espaços):

| Chave JSON | Coluna Excel |
|------------|-------------|
| `Status` | Status |
| `Data Respondida` | Data Respondida |
| `Assunto` | Assunto |
| `Observações` | Observações |
| `Unidade` | Unidade |
| `Reclamante` | Reclamante |
| `Canal` | Canal |

**Resposta de sucesso — `200 OK`**

```json
{ "ok": true }
```

**Resposta de erro — `404 Not Found`**

```json
{ "error": "protocolo não encontrado" }
```

---

## Exemplos com curl

### Listar todas as ouvidorias

```bash
curl http://localhost:7731/api/ouvidorias
```

### Criar nova ouvidoria

```bash
curl -X POST http://localhost:7731/api/ouvidorias \
  -H "Content-Type: application/json" \
  -d '{
    "protocolo": "OUV-2024-099",
    "unidade": "USF Jardim do Lago",
    "dataRecebimento": "15/04/2024",
    "assunto": "Infraestrutura",
    "observacoes": "Infiltração no teto da sala de espera.",
    "canal": "Presencial"
  }'
```

### Encaminhar ouvidoria

```bash
curl -X PATCH http://localhost:7731/api/ouvidorias/OUV-2024-099 \
  -H "Content-Type: application/json" \
  -d '{"Status": "ENCAMINHADA"}'
```

### Registrar resposta

```bash
curl -X PATCH http://localhost:7731/api/ouvidorias/OUV-2024-099 \
  -H "Content-Type: application/json" \
  -d '{"Status": "RESPONDIDA", "Data Respondida": "20/04/2024"}'
```

---

## Códigos de status HTTP

| Código | Significado |
|--------|-------------|
| `200` | Atualização bem-sucedida |
| `201` | Ouvidoria criada com sucesso |
| `400` | Dados inválidos ou protocolo duplicado |
| `404` | Protocolo não encontrado |
| `500` | Erro interno (verifique se `ouvidorias.xlsx` está acessível) |

---

## Notas

- A API lê e grava diretamente em `ouvidorias.xlsx` — nenhum banco de dados intermediário.
- Requisições `POST` e `PATCH` adquirem um lock de arquivo para evitar gravações concorrentes.
- O dashboard consome esta API via `fetch` no browser e atualiza o estado global `DATASET`.
