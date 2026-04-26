// command-center.jsx – KPIs no topo + painel ranking lateral + tabela densa.

const CC = {
  bg:        'oklch(0.18 0.005 80)',
  surface:   'oklch(0.21 0.006 80)',
  surface2:  'oklch(0.24 0.006 80)',
  border:    'oklch(0.30 0.006 80)',
  borderSoft:'oklch(0.26 0.006 80)',
  text:      'oklch(0.94 0.005 80)',
  textDim:   'oklch(0.70 0.008 80)',
  textMute:  'oklch(0.55 0.008 80)',
  accent:    'oklch(0.72 0.15 230)',
  accentSoft:'oklch(0.32 0.08 230)',
  ok:        'oklch(0.72 0.13 150)',
  warn:      'oklch(0.78 0.15 80)',
  crit:      'oklch(0.70 0.18 28)',
  violet:    'oklch(0.68 0.13 300)',
  fontSans:  '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontMono:  '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

function CCChip({ children, bg, fg, border, style }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 8px',
      borderRadius:999, background:bg||'transparent', color:fg||CC.text,
      border: border ? `1px solid ${border}` : 'none',
      fontSize:11, fontWeight:500, letterSpacing:0.2, whiteSpace:'nowrap', ...style }}>
      {children}
    </span>
  );
}

function CCStatusDot({ color, size = 6 }) {
  return <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:color }} />;
}

function CCUrgencyBar({ item }) {
  const tier  = urgencyTier(item.diasRestantes, item.status);
  const colors = TIER_COLORS[tier];
  const total  = 30;
  const usado  = Math.min(Math.max(total - item.diasRestantes, 0), total);
  const pct    = Math.min(100, (usado / total) * 100);
  const barColor = tier === 'resolvido' ? CC.textMute
    : tier === 'vencido' || tier === 'critico' ? CC.crit
    : tier === 'alerta' ? CC.warn : CC.ok;
  const label = tier === 'resolvido'   ? 'Resolvido'
    : tier === 'vencido'               ? `${Math.abs(item.diasRestantes)}d em atraso`
    : `${item.diasRestantes}d restantes`;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:120 }}>
      <div style={{ height:6, borderRadius:3, background:CC.surface2, overflow:'hidden',
        position:'relative', border:`1px solid ${CC.borderSoft}` }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`, background:barColor,
          boxShadow: tier==='critico'||tier==='vencido' ? `0 0 8px ${barColor}` : 'none' }}/>
      </div>
      <div style={{ fontFamily:CC.fontMono, fontSize:10.5,
        color: tier==='resolvido' ? CC.textMute : colors.fg, letterSpacing:0.3 }}>{label}</div>
    </div>
  );
}

function CCStatusPill({ s }) {
  const st  = STATUS_FLUXO.find(x => x.key === s);
  const map = {
    nova:        { bg:'oklch(0.28 0.09 230)', fg:'oklch(0.82 0.13 230)' },
    encaminhada: { bg:'oklch(0.28 0.09 290)', fg:'oklch(0.82 0.13 290)' },
    respondida:  { bg:'oklch(0.28 0.08 155)', fg:'oklch(0.82 0.13 155)' },
    fechada:     { bg:'oklch(0.26 0.01 80)',  fg:'oklch(0.72 0.01 80)'  },
    reaberta:    { bg:'oklch(0.28 0.10 30)',  fg:'oklch(0.82 0.16 30)'  },
  };
  const c = map[s] || map.fechada;
  return (
    <CCChip bg={c.bg} fg={c.fg}>
      <CCStatusDot color={c.fg}/>{st?.label || s}
    </CCChip>
  );
}

function CCKpiCard({ label, value, sub, tone = 'neutral', accent, bars }) {
  const toneBorder = {
    neutral: CC.borderSoft,
    good:    'oklch(0.40 0.08 150)',
    warn:    'oklch(0.42 0.11 80)',
    crit:    'oklch(0.42 0.12 28)',
  }[tone];
  return (
    <div style={{ background:CC.surface, border:`1px solid ${toneBorder}`, borderRadius:10,
      padding:'14px 16px 16px', display:'flex', flexDirection:'column', gap:10,
      minWidth:0, position:'relative', overflow:'hidden' }}>
      <div style={{ fontSize:11, letterSpacing:0.8, textTransform:'uppercase', color:CC.textDim, fontWeight:600 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
        <div style={{ fontFamily:CC.fontMono, fontSize:32, fontWeight:500, color:accent||CC.text, lineHeight:1,
          fontVariantNumeric:'tabular-nums' }}>{value}</div>
        {sub && <div style={{ fontSize:12, color:CC.textDim }}>{sub}</div>}
      </div>
      {bars && (
        <div style={{ display:'flex', gap:3, height:26, alignItems:'flex-end' }}>
          {bars.map((b,i) => (
            <div key={i} style={{ flex:1, height:`${Math.max(6, b.v*100)}%`,
              background:b.color, borderRadius:2, opacity:0.92 }} title={b.t}/>
          ))}
        </div>
      )}
    </div>
  );
}

function CCRankingItem({ unidade, count, max, tierCounts }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ padding:'10px 14px', borderBottom:`1px solid ${CC.borderSoft}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
        <div style={{ fontSize:12.5, color:CC.text, fontWeight:500 }}>{unidade.replace('USF ','')}</div>
        <div style={{ fontFamily:CC.fontMono, fontSize:13, color:CC.text, fontVariantNumeric:'tabular-nums' }}>{count}</div>
      </div>
      <div style={{ display:'flex', height:5, borderRadius:3, overflow:'hidden', background:CC.surface2 }}>
        <div style={{ width:`${pct}%`, display:'flex' }}>
          <div style={{ flex:tierCounts.crit,     background:CC.crit }}/>
          <div style={{ flex:tierCounts.alerta,   background:CC.warn }}/>
          <div style={{ flex:tierCounts.ok,       background:CC.ok }}/>
          <div style={{ flex:tierCounts.resolvido, background:CC.textMute, opacity:0.5 }}/>
        </div>
      </div>
    </div>
  );
}

// ── CommandCenter ──────────────────────────────────────────────────────────────
function CommandCenter({ standalone = false }) {
  const v = useOuvVersion();
  const [view,          setView]          = React.useState('dashboard');
  const [filtroUnidade, setFiltroUnidade] = React.useState('all');
  const [filtroStatus,  setFiltroStatus]  = React.useState('all');
  const [filtroAssunto, setFiltroAssunto] = React.useState('all');
  const [filtroPrazo,   setFiltroPrazo]   = React.useState('all');
  const [busca,         setBusca]         = React.useState('');
  const [sort,          setSort]          = React.useState({ col:'diasRestantes', dir:'asc' });
  const [sel,           setSel]           = React.useState(null);
  const [showLembretes, setShowLembretes] = React.useState(false);

  const filtered = React.useMemo(() => {
    let arr = DATASET;
    if (filtroUnidade !== 'all') arr = arr.filter(x => x.unidadeId === filtroUnidade);
    if (filtroStatus  !== 'all') arr = arr.filter(x => x.status === filtroStatus);
    if (filtroAssunto !== 'all') arr = arr.filter(x => x.assuntoKey === filtroAssunto);
    if (filtroPrazo   !== 'all') {
      arr = arr.filter(x => {
        const t = urgencyTier(x.diasRestantes, x.status);
        if (filtroPrazo === 'abertos') return t !== 'resolvido';
        if (filtroPrazo === 'vencido') return t === 'vencido';
        if (filtroPrazo === 'critico') return t === 'critico';
        if (filtroPrazo === 'alerta')  return t === 'alerta';
        return true;
      });
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      arr = arr.filter(x =>
        x.protocolo.toLowerCase().includes(q) ||
        (x.reclamante||'').toLowerCase().includes(q) ||
        x.unidade.toLowerCase().includes(q) ||
        x.assunto.toLowerCase().includes(q)
      );
    }
    return [...arr].sort((a,b) => {
      const k = sort.col;
      let va = a[k], vb = b[k];
      if (k === 'dataEntrada' || k === 'dataPrazo') { va = va.getTime(); vb = vb.getTime(); }
      if (k === 'reclamante') { va = va||'zzz'; vb = vb||'zzz'; }
      const r = va < vb ? -1 : va > vb ? 1 : 0;
      return sort.dir === 'asc' ? r : -r;
    });
  }, [filtroUnidade, filtroStatus, filtroAssunto, filtroPrazo, busca, sort, v]);

  const kpis = React.useMemo(() => {
    const abertas    = DATASET.filter(x => !['respondida','fechada'].includes(x.status));
    const noPrazo    = abertas.filter(x => x.diasRestantes >= 0).length;
    const foraPrazo  = abertas.filter(x => x.diasRestantes < 0).length;
    const resolvidas = DATASET.filter(x => ['respondida','fechada'].includes(x.status));
    const tempoMedio = resolvidas.length
      ? resolvidas.reduce((s,x) => s + (30 - x.diasRestantes), 0) / resolvidas.length : 0;
    const bars = Array.from({length:14}, (_,i) => ({
      v: 0.35 + 0.5 * Math.abs(Math.sin((i+1)*0.9)),
      color: i < 10 ? CC.accentSoft : CC.accent, t: `sem -${13-i}`,
    }));
    const porAssunto = {};
    DATASET.forEach(x => { porAssunto[x.assuntoKey] = (porAssunto[x.assuntoKey]||0) + 1; });
    const entries = Object.entries(porAssunto);
    const topA = entries.length ? entries.sort((a,b) => b[1]-a[1])[0] : ['outros', 0];
    const topAssunto = ASSUNTOS.find(a => a.key === topA[0]) || ASSUNTOS[0];
    return {
      total: DATASET.length, abertas: abertas.length,
      noPrazo, foraPrazo, tempoMedio, bars,
      topAssunto: topAssunto.label,
      topAssuntoPct: DATASET.length ? Math.round((topA[1]/DATASET.length)*100) : 0,
    };
  }, [v]);

  const ranking = React.useMemo(() => {
    const map = {};
    UNIDADES.forEach(u => { map[u.id] = { unidade:u.nome, count:0, tierCounts:{crit:0,alerta:0,ok:0,resolvido:0} }; });
    DATASET.forEach(x => {
      const t = urgencyTier(x.diasRestantes, x.status);
      if (map[x.unidadeId]) {
        map[x.unidadeId].count++;
        if (t === 'critico' || t === 'vencido') map[x.unidadeId].tierCounts.crit++;
        else if (t === 'alerta')   map[x.unidadeId].tierCounts.alerta++;
        else if (t === 'ok')       map[x.unidadeId].tierCounts.ok++;
        else                       map[x.unidadeId].tierCounts.resolvido++;
      }
    });
    return Object.values(map).sort((a,b) => b.count - a.count);
  }, [v]);
  const maxRank = ranking[0]?.count || 1;

  function exportCSV() {
    const rows = [
      ['Protocolo','Unidade','Data Entrada','Assunto','Reclamante','Status','Prazo','Dias restantes','Canal'],
      ...filtered.map(x => [
        x.protocolo, x.unidade, fmtDate(x.dataEntrada), x.assunto,
        x.reclamante||'Anônimo', x.statusLabel, fmtDate(x.dataPrazo), x.diasRestantes, x.canal,
      ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `ouvidorias-suzano-${fmtDate(new Date()).replaceAll('/','-')}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const toggleSort = col => setSort(p =>
    p.col === col ? { col, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { col, dir:'asc' }
  );

  const TH = ({ col, children, align='left', width }) => (
    <th onClick={() => toggleSort(col)} style={{ textAlign:align, padding:'10px 12px', cursor:'pointer',
      color:CC.textDim, fontWeight:600, fontSize:11, letterSpacing:0.6, textTransform:'uppercase',
      borderBottom:`1px solid ${CC.border}`, userSelect:'none', whiteSpace:'nowrap', width, background:CC.surface }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
        {children}
        <span style={{ opacity: sort.col===col ? 1 : 0.25, fontSize:9, color: sort.col===col ? CC.accent : CC.textMute }}>
          {sort.col===col ? (sort.dir==='asc' ? '▲' : '▼') : '↕'}
        </span>
      </span>
    </th>
  );

  const w = standalone ? '100%' : 1480;
  const h = standalone ? '100%' : 960;

  return (
    <div style={{ width:w, height:h, background:CC.bg, color:CC.text,
      fontFamily:CC.fontSans, display:'flex', flexDirection:'column',
      position:'relative', overflow:'hidden', flex: standalone ? 1 : 'none' }}>

      {/* Top bar */}
      <div style={{ height:56, borderBottom:`1px solid ${CC.border}`,
        display:'flex', alignItems:'center', padding:'0 22px', gap:18,
        background:`linear-gradient(180deg, oklch(0.20 0.006 80), oklch(0.18 0.005 80))`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:26, height:26, borderRadius:6,
            background:`linear-gradient(135deg, ${CC.accent}, oklch(0.55 0.14 240))`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:CC.fontMono, fontSize:13, fontWeight:700, color:'oklch(0.15 0.01 230)' }}>O</div>
          <div style={{ display:'flex', flexDirection:'column', lineHeight:1.15 }}>
            <div style={{ fontSize:13.5, fontWeight:600, letterSpacing:0.2 }}>Ouvidoria · Atenção Básica</div>
            <div style={{ fontSize:10.5, color:CC.textDim, letterSpacing:0.3, fontFamily:CC.fontMono }}>
              PMS · SUZANO / SP — 12 UNIDADES DE SAÚDE DA FAMÍLIA
            </div>
          </div>
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:CC.fontMono, fontSize:11, color:CC.textDim }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:CC.ok, boxShadow:`0 0 8px ${CC.ok}` }}/>
          <span>ATUALIZADO · {fmtDateTime(new Date())}</span>
        </div>
        <button onClick={exportCSV} style={{ background:'transparent', color:CC.text,
          border:`1px solid ${CC.border}`, borderRadius:6, padding:'6px 12px',
          fontSize:12, cursor:'pointer', fontFamily:CC.fontSans, letterSpacing:0.2 }}>Exportar CSV</button>
        <button onClick={() => setShowLembretes(true)} style={{
          background:`oklch(0.28 0.08 230)`, color:CC.accent,
          border:`1px solid oklch(0.38 0.10 230)`, borderRadius:6, padding:'6px 12px',
          fontSize:12, cursor:'pointer', fontFamily:CC.fontSans, letterSpacing:0.2, fontWeight:500 }}>
          📧 Enviar Lembretes
        </button>
      </div>

      {/* Abas */}
      <div style={{ display:'flex', alignItems:'stretch', borderBottom:`1px solid ${CC.border}`,
        background:'oklch(0.19 0.005 80)', flexShrink:0, padding:'0 22px' }}>
        <CCViewTab active={view==='dashboard'} onClick={() => setView('dashboard')}>
          ⊞ Visão geral
        </CCViewTab>
        <CCViewTab active={view==='triagem'} onClick={() => setView('triagem')}>
          ⊕ Triagem avançada de ouvidorias
        </CCViewTab>
      </div>

      {view === 'triagem' ? (
        <div style={{ flex:1, minHeight:0, display:'flex' }}>
          <SplitTriagem embedded/>
        </div>
      ) : (
        <DashboardView
          kpis={kpis} ranking={ranking} maxRank={maxRank}
          filtered={filtered}
          filtroUnidade={filtroUnidade} setFiltroUnidade={setFiltroUnidade}
          filtroStatus={filtroStatus}   setFiltroStatus={setFiltroStatus}
          filtroAssunto={filtroAssunto} setFiltroAssunto={setFiltroAssunto}
          filtroPrazo={filtroPrazo}     setFiltroPrazo={setFiltroPrazo}
          busca={busca} setBusca={setBusca}
          TH={TH} sel={sel} setSel={setSel}
        />
      )}
      {showLembretes && <LembretesModal onClose={() => setShowLembretes(false)} />}
    </div>
  );
}

function LembretesModal({ onClose }) {
  // Derivar unidades com ouvidorias abertas (PENDENTE ou ENCAMINHADA) do DATASET global
  const unidadesDisponiveis = React.useMemo(() => {
    const map = {};
    DATASET.forEach(x => {
      const s = (x.status || '').toUpperCase();
      if (s !== 'RESPONDIDA' && s !== 'FECHADA') {
        if (!map[x.unidade]) map[x.unidade] = { nome: x.unidade, count: 0, vencidas: 0 };
        map[x.unidade].count++;
        if (x.diasRestantes < 0) map[x.unidade].vencidas++;
      }
    });
    return Object.values(map).sort((a, b) => b.vencidas - a.vencidas || b.count - a.count);
  }, []);

  const [selecionadas, setSelecionadas] = React.useState(() => new Set(unidadesDisponiveis.map(u => u.nome)));
  const [fase, setFase]         = React.useState('select'); // select | loading | result
  const [resultado, setResultado] = React.useState(null);
  const [logLines, setLogLines]   = React.useState([]);

  const todasMarcadas = selecionadas.size === unidadesDisponiveis.length;

  function toggleUnidade(nome) {
    setSelecionadas(prev => {
      const next = new Set(prev);
      next.has(nome) ? next.delete(nome) : next.add(nome);
      return next;
    });
  }

  function toggleTodas() {
    setSelecionadas(todasMarcadas ? new Set() : new Set(unidadesDisponiveis.map(u => u.nome)));
  }

  async function enviar() {
    if (selecionadas.size === 0) return;
    setFase('loading');
    try {
      const body = { unidades: Array.from(selecionadas) };
      const res  = await fetch('/api/cobrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setResultado(json);
      setLogLines((json.log || []).slice(-30));
      setFase('result');
    } catch (e) {
      setResultado({ ok: false, error: String(e) });
      setFase('result');
    }
  }

  const overlay = {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.70)', zIndex:9000,
    display:'flex', alignItems:'center', justifyContent:'center',
  };
  const box = {
    background:CC.surface, border:`1px solid ${CC.border}`, borderRadius:12,
    padding:'28px 32px', width:580, maxWidth:'94vw', maxHeight:'88vh',
    display:'flex', flexDirection:'column', gap:18,
    boxShadow:'0 24px 60px rgba(0,0,0,0.55)',
  };
  const btnPrimary = {
    background: selecionadas.size === 0 ? CC.surface2 : CC.accent,
    color: selecionadas.size === 0 ? CC.textMute : 'oklch(0.15 0.01 230)',
    border:'none', borderRadius:6, padding:'9px 20px', fontSize:13,
    fontWeight:600, cursor: selecionadas.size === 0 ? 'not-allowed' : 'pointer',
    fontFamily:CC.fontSans,
  };
  const btnSec = {
    background:'transparent', color:CC.textDim, border:`1px solid ${CC.border}`,
    borderRadius:6, padding:'9px 20px', fontSize:13, cursor:'pointer',
    fontFamily:CC.fontSans,
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:15, fontWeight:600, letterSpacing:0.2 }}>📧 Enviar Lembretes</span>
          <button onClick={onClose} style={{ background:'transparent', border:'none',
            color:CC.textDim, cursor:'pointer', fontSize:16 }}>✕</button>
        </div>

        {/* Seleção de unidades */}
        {fase === 'select' && (
          <>
            <div style={{ fontSize:12, color:CC.textDim, lineHeight:1.5 }}>
              Selecione as unidades que receberão o e-mail de cobrança.
              Apenas ouvidorias <strong style={{color:CC.warn}}>abertas/encaminhadas</strong> serão consideradas.
            </div>

            {unidadesDisponiveis.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:CC.textMute, fontSize:13 }}>
                Nenhuma ouvidoria aberta no momento.
              </div>
            ) : (
              <>
                {/* Selecionar todas */}
                <div style={{ display:'flex', alignItems:'center', gap:10, paddingBottom:8,
                  borderBottom:`1px solid ${CC.border}` }}>
                  <input type="checkbox" id="cb-todas" checked={todasMarcadas}
                    onChange={toggleTodas}
                    style={{ accentColor:CC.accent, width:15, height:15, cursor:'pointer' }}/>
                  <label htmlFor="cb-todas" style={{ fontSize:12, fontWeight:600,
                    color:CC.text, cursor:'pointer', userSelect:'none' }}>
                    Selecionar todas ({unidadesDisponiveis.length})
                  </label>
                  <span style={{ marginLeft:'auto', fontSize:11, color:CC.textMute }}>
                    {selecionadas.size} selecionada{selecionadas.size !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Lista de unidades */}
                <div style={{ overflowY:'auto', maxHeight:280, display:'flex',
                  flexDirection:'column', gap:4 }}>
                  {unidadesDisponiveis.map(u => (
                    <label key={u.nome} style={{ display:'flex', alignItems:'center', gap:10,
                      padding:'8px 10px', borderRadius:7, cursor:'pointer',
                      background: selecionadas.has(u.nome) ? CC.surface2 : 'transparent',
                      border:`1px solid ${selecionadas.has(u.nome) ? CC.borderSoft : 'transparent'}`,
                      transition:'background 0.1s' }}>
                      <input type="checkbox" checked={selecionadas.has(u.nome)}
                        onChange={() => toggleUnidade(u.nome)}
                        style={{ accentColor:CC.accent, width:14, height:14, cursor:'pointer', flexShrink:0 }}/>
                      <span style={{ flex:1, fontSize:12.5, color:CC.text }}>{u.nome}</span>
                      <span style={{ fontSize:11, fontFamily:CC.fontMono, color: u.vencidas > 0 ? CC.crit : CC.textDim }}>
                        {u.count} ouv.{u.vencidas > 0 ? ` · ${u.vencidas} vencida${u.vencidas>1?'s':''}` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button style={btnSec} onClick={onClose}>Cancelar</button>
              <button style={btnPrimary} onClick={enviar}
                disabled={selecionadas.size === 0}>
                Enviar para {selecionadas.size} unidade{selecionadas.size !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}

        {fase === 'loading' && (
          <div style={{ textAlign:'center', padding:'28px 0', color:CC.textDim, fontSize:13 }}>
            <div style={{ fontSize:28, marginBottom:14 }}>⏳</div>
            Enviando e-mails de cobrança…
          </div>
        )}

        {fase === 'result' && resultado && (
          <>
            {resultado.ok ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    ['Enviados',     resultado.stats?.total_enviadas,    CC.ok],
                    ['Sem e-mail',   resultado.stats?.sem_email,         CC.warn],
                    ['Erros envio',  resultado.stats?.erros_envio,       CC.crit],
                    ['Já cobrados',  resultado.stats?.recobranca_pulada, CC.textDim],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ background:CC.surface2, borderRadius:8,
                      padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:12, color:CC.textDim }}>{label}</span>
                      <span style={{ fontSize:20, fontWeight:700, color, fontFamily:CC.fontMono }}>{val ?? 0}</span>
                    </div>
                  ))}
                </div>
                {logLines.length > 0 && (
                  <div style={{ background:'oklch(0.14 0.004 80)', borderRadius:6, padding:'10px 12px',
                    fontSize:11, fontFamily:CC.fontMono, color:CC.textDim, maxHeight:180,
                    overflowY:'auto', lineHeight:1.8, whiteSpace:'pre-wrap' }}>
                    {logLines.join('\n')}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize:13, color:CC.crit }}>❌ {resultado.error}</p>
            )}
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button style={{...btnPrimary, background:CC.accent, color:'oklch(0.15 0.01 230)', cursor:'pointer'}}
                onClick={onClose}>Fechar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CCViewTab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ background:'transparent', border:'none', cursor:'pointer',
      padding:'10px 16px', color: active ? CC.text : CC.textDim,
      fontSize:13, fontWeight: active ? 600 : 500, fontFamily:CC.fontSans,
      borderBottom: active ? `2px solid ${CC.accent}` : `2px solid transparent`,
      marginBottom:-1, letterSpacing:0.2, display:'inline-flex', alignItems:'center', gap:8 }}>
      {children}
    </button>
  );
}

function DashboardView({ kpis, ranking, maxRank, filtered,
  filtroUnidade, setFiltroUnidade, filtroStatus, setFiltroStatus,
  filtroAssunto, setFiltroAssunto, filtroPrazo, setFiltroPrazo,
  busca, setBusca, TH, sel, setSel }) {

  return (
    <>
      {/* KPI grid */}
      <div style={{ padding:'16px 22px 14px', display:'grid',
        gridTemplateColumns:'repeat(5, 1fr)', gap:12, flexShrink:0 }}>
        <CCKpiCard label="Ouvidorias abertas" value={kpis.abertas} sub={`de ${kpis.total} totais`} bars={kpis.bars}/>
        <CCKpiCard label="No prazo"           value={kpis.noPrazo}    sub="≤ 30 dias"            tone="good"    accent={CC.ok}/>
        <CCKpiCard label="Fora do prazo"      value={kpis.foraPrazo}  sub="exige resposta imediata" tone="crit" accent={CC.crit}/>
        <CCKpiCard label="Tempo médio resposta" value={kpis.tempoMedio.toFixed(1)} sub="dias úteis" tone="warn" accent={CC.warn}/>
        <CCKpiCard label="Assunto + frequente" value={`${kpis.topAssuntoPct}%`}  sub={kpis.topAssunto.toLowerCase()} accent={CC.violet}/>
      </div>

      {/* Filtros */}
      <div style={{ padding:'10px 22px', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap',
        borderTop:`1px solid ${CC.borderSoft}`, borderBottom:`1px solid ${CC.borderSoft}`,
        background:'oklch(0.19 0.005 80)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:CC.surface,
          border:`1px solid ${CC.border}`, borderRadius:6, padding:'0 10px', height:32, minWidth:240 }}>
          <span style={{ color:CC.textMute, fontSize:12 }}>⌕</span>
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar protocolo, nome, unidade…"
            style={{ background:'transparent', border:'none', outline:'none',
              color:CC.text, fontSize:12, fontFamily:CC.fontSans, width:'100%' }}/>
        </div>
        <CCSelect value={filtroUnidade} onChange={setFiltroUnidade} label="Unidade" options={[
          {v:'all', t:'Todas'}, ...UNIDADES.map(u => ({v:u.id, t:u.nome.replace('USF ','')}))
        ]}/>
        <CCSelect value={filtroStatus} onChange={setFiltroStatus} label="Status" options={[
          {v:'all', t:'Todos'}, ...STATUS_FLUXO.map(s => ({v:s.key, t:s.label}))
        ]}/>
        <CCSelect value={filtroAssunto} onChange={setFiltroAssunto} label="Assunto" options={[
          {v:'all', t:'Todos'}, ...ASSUNTOS.map(a => ({v:a.key, t:a.label}))
        ]}/>
        <CCSelect value={filtroPrazo} onChange={setFiltroPrazo} label="Prazo" options={[
          {v:'all',     t:'Todos os prazos'},
          {v:'abertos', t:'Em andamento'},
          {v:'critico', t:'Urgente (≤ 3d)'},
          {v:'alerta',  t:'Atenção (≤ 10d)'},
          {v:'vencido', t:'Vencidos'},
        ]}/>
        <div style={{ flex:1 }}/>
        <div style={{ fontFamily:CC.fontMono, fontSize:11, color:CC.textDim, letterSpacing:0.3 }}>
          {filtered.length} registros
        </div>
      </div>

      {/* Grid principal */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 320px', minHeight:0 }}>
        {/* Tabela */}
        <div style={{ overflow:'auto', borderRight:`1px solid ${CC.borderSoft}` }}>
          {filtered.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:CC.textMute, fontSize:13 }}>
              Nenhuma ouvidoria encontrada com os filtros atuais.
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
              <thead style={{ position:'sticky', top:0, zIndex:1 }}>
                <tr>
                  <TH col="protocolo">Protocolo</TH>
                  <TH col="unidade">Unidade</TH>
                  <TH col="dataEntrada">Entrada</TH>
                  <TH col="assunto">Assunto</TH>
                  <TH col="reclamante">Reclamante</TH>
                  <TH col="status">Status</TH>
                  <TH col="diasRestantes" width="170">Prazo</TH>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const isSel   = sel === item.id;
                  const assunto = ASSUNTOS.find(a => a.key === item.assuntoKey) || ASSUNTOS[0];
                  return (
                    <tr key={item.id} onClick={() => setSel(isSel ? null : item.id)}
                      style={{ background: isSel ? CC.accentSoft : (i%2===0 ? 'transparent' : 'oklch(0.195 0.005 80)'), cursor:'pointer' }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='oklch(0.23 0.005 80)'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background= i%2===0 ? 'transparent' : 'oklch(0.195 0.005 80)'; }}>
                      <td style={cellSt}><span style={{ fontFamily:CC.fontMono, color:CC.text, fontSize:11.5 }}>{item.protocolo}</span></td>
                      <td style={cellSt}><span style={{ color:CC.text }}>{item.unidade.replace('USF ','')}</span></td>
                      <td style={{ ...cellSt, fontFamily:CC.fontMono, fontSize:11.5, color:CC.textDim }}>{fmtDate(item.dataEntrada)}</td>
                      <td style={cellSt}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                          <span style={{ width:7, height:7, borderRadius:'50%', background:assunto.cor, display:'inline-block' }}/>
                          {item.assunto}
                        </span>
                      </td>
                      <td style={cellSt}>
                        {item.anonimo
                          ? <span style={{ color:CC.textMute, fontStyle:'italic' }}>— Anônimo —</span>
                          : <span style={{ color:CC.text }}>{item.reclamante}</span>}
                      </td>
                      <td style={cellSt}><CCStatusPill s={item.status}/></td>
                      <td style={cellSt}><CCUrgencyBar item={item}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Painel direito: mapa + ranking */}
        <CCRightRail ranking={ranking} maxRank={maxRank}/>
      </div>

      {/* Drawer de detalhe */}
      {sel && <CCDetail
        item={DATASET.find(x => x.id === sel)}
        onClose={() => setSel(null)}
        onVerHistorico={() => { setSel(null); setView('triagem'); }}
      />}
    </>
  );
}

const cellSt = { padding:'11px 12px', borderBottom:`1px solid ${CC.borderSoft}`, verticalAlign:'middle' };

function CCSelect({ value, onChange, label, options }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, background:CC.surface,
      border:`1px solid ${CC.border}`, borderRadius:6, padding:'0 10px', height:32 }}>
      <span style={{ fontSize:11, color:CC.textDim, textTransform:'uppercase', letterSpacing:0.6, fontWeight:600 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background:'transparent', border:'none', outline:'none',
          color:CC.text, fontSize:12, fontFamily:CC.fontSans, cursor:'pointer',
          appearance:'none', paddingRight:14 }}>
        {options.map(o => <option key={o.v} value={o.v} style={{ background:CC.surface }}>{o.t}</option>)}
      </select>
      <span style={{ fontSize:9, color:CC.textMute, marginLeft:-12, pointerEvents:'none' }}>▾</span>
    </div>
  );
}

function CCDetail({ item, onClose, onVerHistorico }) {
  const [showResposta, setShowResposta] = React.useState(false);
  if (!item) return null;
  const assunto       = ASSUNTOS.find(a => a.key === item.assuntoKey) || ASSUNTOS[0];
  const tier          = urgencyTier(item.diasRestantes, item.status);
  const tierColor     = TIER_COLORS[tier];
  const isRespondida  = ['respondida', 'fechada'].includes(item.status);
  const events    = [
    { dt: item.dataEntrada, label:'Ouvidoria registrada', by:item.canal, done:true },
    { dt: new Date(item.dataEntrada.getTime() + 1*24*3600*1000), label:'Encaminhada à unidade',
      by:'Coordenação · Ouvidoria', done: ['encaminhada','respondida','fechada','reaberta'].includes(item.status) },
    { dt: new Date(item.dataEntrada.getTime() + 4*24*3600*1000), label:'Resposta da unidade',
      by:item.unidade, done: ['respondida','fechada','reaberta'].includes(item.status) },
    { dt: item.dataPrazo, label:'Prazo legal (Lei 13.460)', by:'30 dias corridos', done:false, isPrazo:true },
  ];

  return (
    <div style={{ position:'absolute', right:0, top:56, bottom:0, width:460,
      background:'oklch(0.20 0.006 80)', borderLeft:`1px solid ${CC.border}`,
      boxShadow:'-20px 0 40px rgba(0,0,0,0.35)', display:'flex', flexDirection:'column', zIndex:10 }}>
      <div style={{ padding:'16px 18px', borderBottom:`1px solid ${CC.border}`,
        display:'flex', alignItems:'flex-start', gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:CC.fontMono, fontSize:11, color:CC.textDim, letterSpacing:0.4 }}>{item.protocolo}</div>
          <div style={{ fontSize:15, fontWeight:600, marginTop:4, color:CC.text }}>{item.assunto}</div>
          <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
            <CCChip bg={tierColor.bg} fg={tierColor.fg}>{tierColor.label}</CCChip>
            <CCStatusPill s={item.status}/>
            <CCChip bg={CC.surface2} fg={CC.textDim}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:assunto.cor, display:'inline-block' }}/>
              {assunto.label}
            </CCChip>
          </div>
        </div>
        <button onClick={onClose}
          style={{ background:'transparent', border:`1px solid ${CC.border}`, color:CC.textDim,
            width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14 }}>✕</button>
      </div>

      <div style={{ padding:'14px 18px', overflow:'auto', flex:1 }}>
        <CField label="Unidade">{item.unidade}</CField>
        <CField label="Reclamante">
          {item.anonimo ? <span style={{ color:CC.textMute, fontStyle:'italic' }}>Anônimo</span> : item.reclamante}
        </CField>
        <CField label="Canal">{item.canal}</CField>
        <CField label="Data de entrada">{fmtDateTime(item.dataEntrada)}</CField>
        <CField label="Prazo para resposta">
          {fmtDate(item.dataPrazo)} · {item.diasRestantes >= 0 ? `${item.diasRestantes} dias restantes` : `${Math.abs(item.diasRestantes)} dias em atraso`}
        </CField>

        {item.detalhe && (
          <div style={{ marginTop:18, padding:14, background:CC.surface, borderRadius:8, border:`1px solid ${CC.borderSoft}` }}>
            <div style={{ fontSize:10.5, color:CC.textDim, textTransform:'uppercase', letterSpacing:0.8, fontWeight:600, marginBottom:8 }}>
              Relato
            </div>
            <div style={{ fontSize:13, lineHeight:1.55, color:CC.text }}>{item.detalhe}</div>
          </div>
        )}

        <div style={{ marginTop:18 }}>
          <div style={{ fontSize:10.5, color:CC.textDim, textTransform:'uppercase', letterSpacing:0.8, fontWeight:600, marginBottom:10 }}>
            Linha do tempo
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14, position:'relative' }}>
            {events.map((e,i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, marginTop:4,
                  background: e.isPrazo ? 'transparent' : (e.done ? CC.accent : CC.textMute),
                  border: e.isPrazo ? `1.5px dashed ${CC.warn}` : 'none',
                  boxShadow: e.done && !e.isPrazo ? `0 0 0 3px ${CC.accentSoft}` : 'none' }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12.5, color: e.done ? CC.text : CC.textDim, fontWeight:500 }}>{e.label}</div>
                  <div style={{ fontSize:11, color:CC.textMute, marginTop:2, fontFamily:CC.fontMono }}>
                    {fmtDateTime(e.dt)} · {e.by}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'12px 18px', borderTop:`1px solid ${CC.border}`, display:'flex', gap:8 }}>
        <button onClick={() => { onClose(); if (onVerHistorico) onVerHistorico(); }} style={ccBtnSec}>
          Ver histórico completo
        </button>
        <button
          onClick={() => { if (!isRespondida) setShowResposta(true); }}
          style={{ ...ccBtnPri,
            background: isRespondida ? 'oklch(0.28 0.08 155)' : ccBtnPri.background,
            color:      isRespondida ? 'oklch(0.82 0.13 155)' : ccBtnPri.color,
            cursor:     isRespondida ? 'default' : 'pointer',
          }}>
          {isRespondida ? '✓ Respondida' : 'Registrar resposta'}
        </button>
      </div>

      {showResposta && <STRespostaModal item={item} onClose={() => setShowResposta(false)}/>}
    </div>
  );
}

function CField({ label, children }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0',
      borderBottom:`1px solid ${CC.borderSoft}`, gap:12 }}>
      <div style={{ fontSize:11.5, color:CC.textDim, textTransform:'uppercase', letterSpacing:0.5, fontWeight:500 }}>{label}</div>
      <div style={{ fontSize:12.5, color:CC.text, textAlign:'right' }}>{children}</div>
    </div>
  );
}

const ccBtnPri = { flex:1, background:CC.accent, color:'oklch(0.15 0.01 230)', border:'none',
  borderRadius:6, padding:'9px 12px', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:CC.fontSans };
const ccBtnSec = { flex:1, background:'transparent', color:CC.text, border:`1px solid ${CC.border}`,
  borderRadius:6, padding:'9px 12px', fontSize:12.5, fontWeight:500, cursor:'pointer', fontFamily:CC.fontSans };

function CCRightRail({ ranking, maxRank }) {
  const [tab, setTab] = React.useState('mapa');
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:0, background:'oklch(0.19 0.005 80)' }}>
      <div style={{ padding:'12px 14px 0', borderBottom:`1px solid ${CC.borderSoft}` }}>
        <div style={{ display:'flex', gap:4 }}>
          <CCTabBtn active={tab==='mapa'}    onClick={() => setTab('mapa')}>Mapa</CCTabBtn>
          <CCTabBtn active={tab==='ranking'} onClick={() => setTab('ranking')}>Ranking</CCTabBtn>
        </div>
      </div>
      {tab === 'mapa' ? (
        <div style={{ flex:1, minHeight:0, position:'relative' }}>
          <MapaUnidades compact/>
        </div>
      ) : (
        <>
          <div style={{ padding:'12px 16px 10px', borderBottom:`1px solid ${CC.borderSoft}` }}>
            <div style={{ fontSize:10.5, color:CC.textMute, fontFamily:CC.fontMono }}>volume · últimos 28 dias</div>
            <div style={{ display:'flex', gap:10, marginTop:8, fontSize:10, color:CC.textMute, flexWrap:'wrap' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><CCStatusDot color={CC.crit} size={6}/>Urgente</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><CCStatusDot color={CC.warn} size={6}/>Atenção</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><CCStatusDot color={CC.ok}   size={6}/>No prazo</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><CCStatusDot color={CC.textMute} size={6}/>Resolvido</span>
            </div>
          </div>
          <div style={{ overflow:'auto', flex:1 }}>
            {ranking.map(r => <CCRankingItem key={r.unidade} {...r} max={maxRank}/>)}
          </div>
        </>
      )}
    </div>
  );
}

function CCTabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ background:'transparent', border:'none', cursor:'pointer',
      padding:'8px 12px', color: active ? CC.text : CC.textDim,
      fontSize:12, fontWeight:600, fontFamily:CC.fontSans,
      borderBottom: active ? `2px solid ${CC.accent}` : `2px solid transparent`,
      marginBottom:-1, letterSpacing:0.3 }}>{children}</button>
  );
}

Object.assign(window, { CommandCenter });
