"""Classificação de documentos de ouvidoria via LLM.

Backends suportados (gratuitos, sem tokens Claude):
  - ollama  : LLM local via Ollama (llama3.2, mistral, gemma3, etc.)
              Instalar: https://ollama.com  →  ollama pull llama3.2
  - groq    : API Groq gratuita (30 req/min, 14.400/dia)
              Criar conta: https://console.groq.com → gerar API key

Configurar em config.json:
  "llm_backend"         : "ollama" | "groq" | "disabled"
  "llm_model"           : "llama3.2"              (ollama) ou
                          "llama-3.1-8b-instant"  (groq)
  "ollama_url"          : "http://localhost:11434" (padrão)
  "groq_api_key"        : "<sua-chave>"            (só groq)
  "llm_confianca_minima": 0.6                      (0.0–1.0)
"""
import json
import os
import re
from datetime import date
from typing import Optional

_BASE     = os.path.dirname(os.path.abspath(__file__))
_CFG_FILE = os.path.join(_BASE, 'config.json')

_MESES = {
    'janeiro':1,'fevereiro':2,'março':3,'marco':3,'abril':4,
    'maio':5,'junho':6,'julho':7,'agosto':8,'setembro':9,
    'outubro':10,'novembro':11,'dezembro':12,
}

_PROMPT = """\
Você é um especialista em ouvidorias municipais de saúde (Suzano/SP).

Analise o texto extraído de um PDF e retorne APENAS um JSON válido com:
  "tipo"       : "OUVIDORIA" (manifestação de cidadão/Controladoria) ou
                 "RESPOSTA"  (resposta institucional da unidade de saúde)
  "protocolo"  : número do protocolo (ex: "000123/2026"), ou null
  "reclamante" : nome completo do cidadão reclamante, ou null
  "data"       : data do documento em "DD/MM/AAAA", ou null
  "assunto"    : resumo do assunto em até 80 chars, ou null
  "confianca"  : número 0.0–1.0 (sua confiança na classificação)

Dicas de classificação:
- OUVIDORIA: vem de cidadão ou Controladoria; contém "EMENTA DA DEMANDA",
  "Lei 13.460", número de P.O., data de protocolo.
- RESPOSTA: vem da unidade de saúde; contém assinatura de enfermeira/gerente,
  "Resposta à Manifestação de Ouvidoria", agradecimento ao paciente.

TEXTO DO DOCUMENTO:
{texto}

Retorne SOMENTE o JSON, sem markdown, sem explicações."""


def _load_cfg() -> dict:
    try:
        with open(_CFG_FILE, encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def _parse_json(raw: str) -> Optional[dict]:
    raw = raw.strip()
    if raw.startswith('```'):
        raw = raw.split('\n', 1)[-1].rsplit('```', 1)[0].strip()
    try:
        return json.loads(raw)
    except Exception:
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            try:
                return json.loads(m.group())
            except Exception:
                pass
    return None


def parse_data(valor: Optional[str]) -> Optional[date]:
    """Converte 'DD/MM/AAAA' retornado pelo LLM em objeto date."""
    if not valor:
        return None
    m = re.match(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', str(valor).strip())
    if m:
        try:
            return date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        except ValueError:
            pass
    m = re.search(r'(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})', str(valor), re.I)
    if m:
        mes = _MESES.get(m.group(2).lower())
        if mes:
            try:
                return date(int(m.group(3)), mes, int(m.group(1)))
            except ValueError:
                pass
    return None


def _ollama(prompt: str, cfg: dict) -> Optional[dict]:
    try:
        import requests as _req
        model = cfg.get('llm_model', 'llama3.2')
        base  = cfg.get('ollama_url', 'http://localhost:11434').rstrip('/')
        resp  = _req.post(f'{base}/api/generate', json={
            'model':   model,
            'prompt':  prompt,
            'format':  'json',
            'stream':  False,
            'options': {'temperature': 0.1, 'num_predict': 400},
        }, timeout=60)
        resp.raise_for_status()
        return _parse_json(resp.json().get('response', ''))
    except Exception as e:
        print(f'[LLM/Ollama] {e}')
        return None


def _groq(prompt: str, cfg: dict) -> Optional[dict]:
    try:
        import requests as _req
        api_key = cfg.get('groq_api_key', '').strip()
        if not api_key:
            print('[LLM/Groq] groq_api_key não configurado em config.json')
            return None
        model = cfg.get('llm_model', 'llama-3.1-8b-instant')
        resp  = _req.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={'Authorization': f'Bearer {api_key}'},
            json={
                'model':       model,
                'messages':    [{'role': 'user', 'content': prompt}],
                'temperature': 0.1,
                'max_tokens':  400,
            },
            timeout=20,
        )
        resp.raise_for_status()
        content = resp.json()['choices'][0]['message']['content']
        return _parse_json(content)
    except Exception as e:
        print(f'[LLM/Groq] {e}')
        return None


def classificar(texto: str, cfg: Optional[dict] = None) -> Optional[dict]:
    """Classifica um documento via LLM.

    Retorna dict com: tipo, protocolo, reclamante, data, assunto, confianca.
    Retorna None se o backend estiver desativado ou falhar (use regex como fallback).
    """
    if cfg is None:
        cfg = _load_cfg()

    backend = cfg.get('llm_backend', 'disabled')
    if not backend or backend == 'disabled':
        return None

    # Limita texto para não exceder contexto do modelo
    limite = 6000 if backend == 'groq' else 4000
    prompt = _PROMPT.format(texto=texto[:limite])

    result = None
    if backend == 'ollama':
        result = _ollama(prompt, cfg)
    elif backend == 'groq':
        result = _groq(prompt, cfg)
    else:
        print(f'[LLM] Backend desconhecido: {backend!r}')
        return None

    if result is None:
        return None

    # Normaliza tipo
    tipo = str(result.get('tipo', '')).upper().strip()
    if tipo not in ('OUVIDORIA', 'RESPOSTA'):
        tipo = 'OUVIDORIA'
    result['tipo'] = tipo

    confianca = float(result.get('confianca', 0))
    minima    = float(cfg.get('llm_confianca_minima', 0.6))
    if confianca < minima:
        print(f'[LLM] Confiança baixa ({confianca:.2f} < {minima}) — usando fallback regex')
        return None

    return result
