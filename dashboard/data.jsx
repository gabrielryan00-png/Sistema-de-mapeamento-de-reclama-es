// data.jsx – camada de dados integrada com a API do servidor Flask

const UNIDADES = [
  { id: 'u1',  nome: 'USF Vereador Marsal Lopes Rosa',           bairro: 'Vila Amorim',        x: 42, y: 58 },
  { id: 'u2',  nome: 'USF Recanto São José',                     bairro: 'Recanto São José',   x: 28, y: 70 },
  { id: 'u3',  nome: 'USF Jardim do Lago',                       bairro: 'Jardim do Lago',     x: 58, y: 46 },
  { id: 'u4',  nome: 'USF Marcelino Maria Rodrigues',            bairro: 'Jardim Brasil',      x: 48, y: 40 },
  { id: 'u5',  nome: 'USF Maria Jose Lima Souza',                bairro: 'Jardim Ikeda',       x: 66, y: 60 },
  { id: 'u6',  nome: 'USF Dr. Eduardo Nakamura',                 bairro: 'Cidade Boa Vista',   x: 36, y: 30 },
  { id: 'u7',  nome: 'USF Jardim Europa',                        bairro: 'Jardim Europa',      x: 72, y: 32 },
  { id: 'u8',  nome: 'USF Jardim Revista',                       bairro: 'Jardim Revista',     x: 22, y: 42 },
  { id: 'u9',  nome: 'USF Vereador Gregório Bonifácio da Silva', bairro: 'Vila Fátima',        x: 55, y: 68 },
  { id: 'u10', nome: 'USF Onesia Benedita Miguel',               bairro: 'Jardim Suzanópolis', x: 78, y: 70 },
  { id: 'u11', nome: 'USF Antonio Marques de Carvalho',          bairro: 'Jardim Maité',       x: 18, y: 58 },
  { id: 'u12', nome: 'USF Manuel Evangelista de Oliveira',       bairro: 'Jardim São José',    x: 45, y: 75 },
];

const ASSUNTOS = [
  { key: 'demora',       label: 'Demora no atendimento',      cor: 'oklch(0.70 0.15 50)'  },
  { key: 'medicamentos', label: 'Falta de medicamentos',      cor: 'oklch(0.65 0.17 25)'  },
  { key: 'conduta',      label: 'Conduta do profissional',    cor: 'oklch(0.62 0.14 310)' },
  { key: 'agendamento',  label: 'Agendamento de consultas',   cor: 'oklch(0.68 0.13 220)' },
  { key: 'exames',       label: 'Marcação de exames',         cor: 'oklch(0.70 0.12 180)' },
  { key: 'elogio',       label: 'Sugestão / elogio',          cor: 'oklch(0.72 0.13 150)' },
  { key: 'outros',       label: 'Outros',                     cor: 'oklch(0.65 0.08 240)' },
];

const STATUS_FLUXO = [
  { key: 'nova',        label: 'Nova',        cor: 'oklch(0.72 0.15 230)' },
  { key: 'encaminhada', label: 'Encaminhada', cor: 'oklch(0.72 0.13 280)' },
  { key: 'respondida',  label: 'Respondida',  cor: 'oklch(0.75 0.13 155)' },
  { key: 'fechada',     label: 'Fechada',     cor: 'oklch(0.65 0.02 90)'  },
  { key: 'reaberta',    label: 'Reaberta',    cor: 'oklch(0.68 0.16 30)'  },
];

// NOW é dinâmico (data real)
const NOW = new Date();

// DATASET é mutável — populado pela API
const DATASET = [];

// ── Helpers de formatação ──────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d || !(d instanceof Date) || isNaN(d)) return '--/--/----';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function fmtDateTime(d) {
  if (!d || !(d instanceof Date) || isNaN(d)) return '--/--/----';
  return `${fmtDate(d)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function urgencyTier(dias, status) {
  if (status === 'respondida' || status === 'fechada') return 'resolvido';
  if (dias < 0)   return 'vencido';
  if (dias <= 3)  return 'critico';
  if (dias <= 10) return 'alerta';
  return 'ok';
}
const TIER_COLORS = {
  ok:        { bg: 'oklch(0.32 0.06 155)', fg: 'oklch(0.82 0.15 155)', label: 'No prazo'  },
  alerta:    { bg: 'oklch(0.34 0.08 80)',  fg: 'oklch(0.85 0.16 85)',  label: 'Atenção'   },
  critico:   { bg: 'oklch(0.34 0.10 30)',  fg: 'oklch(0.78 0.18 30)',  label: 'Urgente'   },
  vencido:   { bg: 'oklch(0.30 0.11 15)',  fg: 'oklch(0.72 0.20 15)',  label: 'Vencido'   },
  resolvido: { bg: 'oklch(0.28 0.02 240)', fg: 'oklch(0.65 0.02 240)', label: 'Resolvido' },
};

// ── Parsers internos ───────────────────────────────────────────────────────────
function _parseDate(str) {
  if (!str) return new Date();
  const s = String(str).trim();
  // DD/MM/YYYY
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1]);
  // YYYY-MM-DD
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]);
  const d = new Date(s);
  return isNaN(d) ? new Date() : d;
}

function _matchUnidade(nome) {
  if (!nome) return UNIDADES[0];
  const n  = String(nome).trim();
  const exact = UNIDADES.find(u => u.nome === n);
  if (exact) return exact;
  const nl = n.toLowerCase();
  const partial = UNIDADES.find(u =>
    u.nome.toLowerCase().includes(nl) ||
    nl.includes(u.nome.toLowerCase().replace('usf ', ''))
  );
  return partial || { id: `u_ext_${n.slice(0,8)}`, nome: n, bairro: '', x: 50, y: 50 };
}

function _matchAssunto(str) {
  if (!str) return ASSUNTOS[0];
  const s = String(str).toLowerCase();
  for (const a of ASSUNTOS) {
    const words = a.label.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    if (words.some(w => s.includes(w))) return a;
  }
  return ASSUNTOS.find(a => a.key === 'outros');
}

const _STATUS_MAP = {
  'PENDENTE':    'nova',
  'NOVA':        'nova',
  'ENCAMINHADA': 'encaminhada',
  'RESPONDIDA':  'respondida',
  'FECHADA':     'fechada',
  'REABERTA':    'reaberta',
};

function _convertRow(row, idx) {
  const protocolo = String(row['Protocolo'] || '').trim();
  if (!protocolo) return null;

  const unidadeNome   = String(row['Unidade']          || '');
  const assuntoStr    = String(row['Assunto']           || '');
  const statusStr     = String(row['Status']            || 'PENDENTE').toUpperCase();
  const statusKey     = _STATUS_MAP[statusStr] || 'nova';
  const statusObj     = STATUS_FLUXO.find(s => s.key === statusKey) || STATUS_FLUXO[0];
  const unidade       = _matchUnidade(unidadeNome);
  const assunto       = _matchAssunto(assuntoStr);
  const dataEntrada    = _parseDate(row['Data Recebimento']);
  const dataPrazo      = _parseDate(row['Prazo Resposta']);
  const dataRespondida = row['Data Respondida'] && String(row['Data Respondida']).trim()
    ? _parseDate(row['Data Respondida']) : null;
  const now            = new Date();
  const diasRestantes  = Math.round((dataPrazo - now) / (24 * 3600 * 1000));
  const reclamante     = row['Reclamante'] ? String(row['Reclamante']).trim() || null : null;

  return {
    id:            `row_${idx}_${protocolo}`,
    protocolo,
    unidadeId:     unidade.id,
    unidade:       unidadeNome || unidade.nome,
    assuntoKey:    assunto.key,
    assunto:       assuntoStr || assunto.label,
    status:        statusKey,
    statusLabel:   statusObj.label,
    reclamante,
    anonimo:       !reclamante,
    dataEntrada,
    dataPrazo,
    dataRespondida,
    diasRestantes,
    detalhe:       String(row['Observações'] || row['Observacoes'] || ''),
    canal:         String(row['Canal'] || 'Sistema'),
    _raw:          row,
  };
}

// ── API ────────────────────────────────────────────────────────────────────────
async function _fetchDataset() {
  try {
    const resp = await fetch('/api/ouvidorias');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const rows = await resp.json();
    if (Array.isArray(rows)) {
      const converted = rows.map((r, i) => _convertRow(r, i)).filter(Boolean);
      DATASET.splice(0, DATASET.length, ...converted);
    }
  } catch (e) {
    console.warn('[OUV] API indisponível:', e.message);
  }
  window.dispatchEvent(new CustomEvent('ouv-data-updated'));
}

async function _createOuvidoria(data) {
  try {
    const r = await fetch('/api/ouvidorias', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (r.ok) { await _fetchDataset(); return true; }
    return false;
  } catch (e) {
    console.error('[OUV] create:', e);
    return false;
  }
}

async function _updateOuvidoria(proto, updates) {
  try {
    const r = await fetch(`/api/ouvidorias/${encodeURIComponent(proto)}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updates),
    });
    if (r.ok) { await _fetchDataset(); return true; }
    return false;
  } catch (e) {
    console.error('[OUV] update:', e);
    return false;
  }
}

window._OUV_FETCH  = _fetchDataset;
window._OUV_CREATE = _createOuvidoria;
window._OUV_UPDATE = _updateOuvidoria;

// Hook que re-renderiza o componente quando os dados mudam, sem remontar
function useOuvVersion() {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const h = () => setV(n => n + 1);
    window.addEventListener('ouv-data-updated', h);
    return () => window.removeEventListener('ouv-data-updated', h);
  }, []);
  return v;
}

Object.assign(window, {
  UNIDADES, ASSUNTOS, STATUS_FLUXO, DATASET, NOW,
  fmtDate, fmtDateTime, urgencyTier, TIER_COLORS, useOuvVersion,
});
