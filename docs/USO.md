# Guia de Uso

## Iniciando o sistema

```bash
python ouvidoriabot.py
# ou
make run
```

O aplicativo abre a janela principal Tkinter com 3 abas:

| Aba | Função |
|-----|--------|
| **Processar** | Busca e processa e-mails do Gmail |
| **Cobranças** | Gerencia cobranças às unidades |
| **⚙ Configurações** | Edita configurações e controla o agendador |

O servidor do dashboard sobe automaticamente em `http://localhost:7731`.

---

## Aba Processar

### Processar e-mails manualmente

1. Selecione a **data inicial** e **data final** do período desejado
2. Clique em **Processar E-mails**
3. Aguarde — a barra de progresso mostra os e-mails encontrados
4. Ao finalizar, a tabela exibe os registros processados naquela sessão

### Abrir o dashboard

Clique no botão **🌐 Dashboard Web** para abrir o painel no navegador padrão.

### O que acontece durante o processamento

```
E-mail recebido
   └── Há PDF ou imagem anexada?
         ├── Sim → OCR (pdfplumber + pytesseract)
         │         ├── Protocolo e unidade identificados? → grava em ouvidorias.xlsx
         │         ├── Sinais de ouvidoria mas dados incompletos → move para indefinidos/
         │         └── Nenhum sinal de ouvidoria → ignora
         └── Não → ignora
```

---

## Dashboard Web — `http://localhost:7731`

O dashboard é atualizado automaticamente a cada 60 segundos.

### Abas principais

| Aba | Conteúdo |
|-----|----------|
| **Dashboard** | Command Center — KPIs, gráficos, tabela gerencial |
| **Triagem** | Inbox de ouvidorias pendentes/encaminhadas |
| **Mapa** | Mapa territorial de Suzano com pins das USFs |

---

## Command Center (aba Dashboard)

### KPIs

Exibidos no topo da tela:

- **Total de ouvidorias** cadastradas
- **Pendentes** — aguardando encaminhamento
- **Encaminhadas** — enviadas à unidade, aguardando resposta
- **Respondidas / Fechadas** — concluídas
- **Vencidas** — prazo expirado sem resposta

### Tabela gerencial

- **Filtrar** por unidade, status ou texto livre
- **Ordenar** por qualquer coluna (clique no cabeçalho)
- **Exportar CSV** — exporta os registros filtrados atualmente visíveis
- **Ver detalhes** — clique em qualquer linha para abrir o painel lateral

### Painel de detalhes (CCDetail)

Ao clicar em uma ouvidoria:

| Botão | Ação |
|-------|------|
| **Encaminhar** | Muda status para `ENCAMINHADA` (com confirmação) |
| **Registrar resposta** | Pede a data de resposta e muda status para `RESPONDIDA` |
| **Ver histórico completo** | Abre a aba Triagem no segmento Resolvidas |

---

## Triagem

O inbox prioriza ouvidorias pela urgência legal:

| Cor | Critério |
|-----|----------|
| 🔴 Vermelho pulsante | Prazo **vencido** |
| 🔴 Vermelho | ≤ 3 dias restantes |
| 🟡 Amarelo | ≤ 10 dias restantes |
| 🟢 Verde | > 10 dias restantes |
| ⚫ Cinza | Respondida / Fechada |

### Segmentos

- **Pendentes** — `PENDENTE` e `ENCAMINHADA`
- **Resolvidas** — `RESPONDIDA` e `FECHADA` — exibe tabela com tempo de resposta

### Ações no painel de detalhe

Selecione uma ouvidoria na lista para abrir o painel lateral:

- **Encaminhar** → muda status para `ENCAMINHADA`
- **Registrar resposta** → abre modal pedindo a data; muda status para `RESPONDIDA`

---

## Registrar uma nova ouvidoria manualmente

Quando o OCR falhar ou o documento chegar por outro canal (presencial, WhatsApp, etc.):

1. No dashboard, clique em **+ Nova Ouvidoria**
2. Preencha os campos:
   - **Protocolo** — gerado automaticamente ou informado manualmente
   - **Unidade** — selecione na lista de USFs cadastradas
   - **Assunto** — categoria da ocorrência
   - **Canal** — E-mail, Presencial, Telefone 156, WhatsApp, Sistema
   - **Reclamante** — nome ou deixe vazio para anônimo
   - **Observações** — relato completo
3. Clique em **Salvar**

O registro é gravado imediatamente em `ouvidorias.xlsx`.

---

## Documentos indefinidos

Documentos com sinais de ouvidoria mas dados insuficientes para extração automática são colocados em `ouvidorias/indefinidos/`.

**Como tratar:**
1. Abra o PDF na pasta `ouvidorias/indefinidos/`
2. Leia o documento e identifique protocolo e unidade
3. Use **+ Nova Ouvidoria** para registrar manualmente
4. Mova o arquivo para a pasta correta ou descarte

---

## Mapa territorial

O mapa exibe um esquema do município de Suzano com pins coloridos por status de cada USF.

- **Clique num pin** para ver o resumo da unidade (total de ouvidorias, pendências, vencidas)
- Cores seguem o mesmo critério de urgência da Triagem

---

## Aba Cobranças

O módulo de cobranças envia e-mails de follow-up às unidades com ouvidorias pendentes.

### Configurar

1. Certifique-se de que os e-mails das unidades estão no banco ([ver CONFIGURACAO.md](CONFIGURACAO.md#banco-de-dados--e-mails-das-unidades))
2. Edite `config_cobranca.json` se necessário (intervalo mínimo entre cobranças)

### Enviar cobranças

1. Na aba **Cobranças**, selecione as unidades ou use **Selecionar todas**
2. Clique em **Enviar cobranças**
3. O sistema verifica o intervalo mínimo e envia apenas às unidades elegíveis
4. O log exibe o resultado de cada envio

---

## Aba Configurações

| Campo | Descrição |
|-------|-----------|
| **E-mail** | Caixa de ouvidoria Gmail |
| **Senha de app** | Senha de app Google (16 chars) |
| **Remetente** | Filtra por remetente (deixe vazio para qualquer) |
| **Prazo dias** | Prazo padrão em dias (padrão: 30) |
| **Remover arquivos** | Se marcado, remove PDFs do e-mail após processar |

### Agendador automático

- **Habilitar agendador** — processa e-mails automaticamente no intervalo configurado
- **Intervalo (min)** — mínimo recomendado: 30 minutos
- **Iniciar / Parar** — controla o agendador sem reiniciar o aplicativo

---

## Ciclo de vida de uma ouvidoria

```
PENDENTE → ENCAMINHADA → RESPONDIDA → FECHADA
```

| Status | Descrição |
|--------|-----------|
| `PENDENTE` | Recebida, não encaminhada à unidade |
| `ENCAMINHADA` | Enviada à unidade responsável |
| `RESPONDIDA` | Unidade enviou resposta; data registrada |
| `FECHADA` | Encerrada administrativamente |

---

## Exportar dados

### CSV pelo dashboard
- No Command Center, aplique os filtros desejados
- Clique em **Exportar CSV**
- O arquivo é baixado pelo navegador

### Planilha Excel completa
- O arquivo `ouvidorias/ouvidorias.xlsx` é a fonte de verdade
- Pode ser aberto diretamente no Excel / LibreOffice Calc
- Não edite manualmente colunas-chave (Protocolo, Status) — use sempre o dashboard

---

## Resolução de problemas

| Sintoma | Causa provável | Solução |
|---------|---------------|---------|
| Dashboard não abre | Flask não iniciou | Verifique se `flask` está instalado: `pip install flask flask-cors` |
| OCR não extrai dados | Tesseract não encontrado | Configure `tesseract_path` no config.json ou instale via PATH |
| E-mails não chegam | Credenciais inválidas | Verifique e-mail e senha de app no config.json |
| Unidade não reconhecida | Nome fora do catálogo | Adicione alias em `CATALOGO_USF` em `constantes.py` |
| Documento vai para indefinidos | OCR falhou na extração | Registre manualmente via `+ Nova Ouvidoria` |
