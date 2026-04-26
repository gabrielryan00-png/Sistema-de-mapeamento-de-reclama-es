// split-triagem.jsx – Painel esquerdo: inbox priorizado. Direito: detalhe + ações.
// Inclui modal para criação e edição manual de ouvidorias.

const ST = {
  bg:        'oklch(0.16 0.007 260)',
  surface:   'oklch(0.20 0.008 260)',
  surface2:  'oklch(0.23 0.008 260)',
  surfaceHi: 'oklch(0.26 0.010 260)',
  border:    'oklch(0.30 0.010 260)',
  borderSoft:'oklch(0.26 0.008 260)',
  text:      'oklch(0.96 0.005 260)',
  textDim:   'oklch(0.72 0.010 260)',
  textMute:  'oklch(0.55 0.010 260)',
  accent:    'oklch(0.72 0.15 200)',
  accent2:   'oklch(0.60 0.17 200)',
  ok:        'oklch(0.74 0.14 150)',
  warn:      'oklch(0.80 0.16 85)',
  crit:      'oklch(0.72 0.19 28)',
  violet:    'oklch(0.70 0.14 300)',
  fontSans:  '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontMono:  '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

// ── Componentes base ───────────────────────────────────────────────────────────
function STDot({ color, size = 6 }) {
  return <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:color, flexShrink:0 }} />;
}

function STTierBadge({ tier }) {
  const map = {
    vencido:   { bg:'oklch(0.28 0.12 20)',  fg:'oklch(0.80 0.19 25)',  label:'VENCIDO'   },
    critico:   { bg:'oklch(0.30 0.10 35)',  fg:'oklch(0.82 0.17 35)',  label:'URGENTE'   },
    alerta:    { bg:'oklch(0.30 0.09 85)',  fg:'oklch(0.85 0.15 85)',  label:'ATENÇÃO'   },
    ok:        { bg:'oklch(0.27 0.07 155)', fg:'oklch(0.80 0.14 155)', label:'NO PRAZO'  },
    resolvido: { bg:'oklch(0.26 0.01 260)', fg:'oklch(0.65 0.01 260)', label:'RESOLVIDO' },
  };
  const c = map[tier] || map.ok;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'2px 7px', borderRadius:4,
      background:c.bg, color:c.fg,
      fontFamily:ST.fontMono, fontSize:9.5, fontWeight:600, letterSpacing:0.8,
    }}>{c.label}</span>
  );
}

function STInboxItem({ item, selected, onClick }) {
  const tier = urgencyTier(item.diasRestantes, item.status);
  const assunto = ASSUNTOS.find(a => a.key === item.assuntoKey) || ASSUNTOS[0];
  const tierBarColor = tier === 'resolvido' ? ST.textMute
    : tier === 'vencido' || tier === 'critico' ? ST.crit
    : tier === 'alerta' ? ST.warn : ST.ok;

  return (
    <div onClick={onClick} style={{
      padding:'12px 14px 12px 16px',
      borderBottom:`1px solid ${ST.borderSoft}`,
      background: selected ? 'oklch(0.25 0.03 200)' : 'transparent',
      cursor:'pointer', position:'relative', transition:'background .12s',
    }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = ST.surface2; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:tierBarColor,
        boxShadow: (tier==='critico'||tier==='vencido') ? `0 0 6px ${tierBarColor}` : 'none' }}/>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <STTierBadge tier={tier}/>
        <span style={{ fontFamily:ST.fontMono, fontSize:10.5, color:ST.textMute, letterSpacing:0.3 }}>
          {item.protocolo}
        </span>
        <span style={{ flex:1 }}/>
        <span style={{ fontFamily:ST.fontMono, fontSize:10.5, color:ST.textMute }}>
          {fmtDate(item.dataEntrada)}
        </span>
      </div>

      <div style={{ fontSize:13, fontWeight:500, color:ST.text, marginBottom:4,
        display:'-webkit-box', WebkitBoxOrient:'vertical', WebkitLineClamp:1, overflow:'hidden' }}>
        {item.detalhe || item.assunto}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:ST.textDim }}>
        <STDot color={assunto.cor} size={7}/>
        <span>{item.assunto}</span>
        <span style={{ color:ST.textMute }}>·</span>
        <span style={{ color:ST.textDim }}>{item.unidade.replace('USF ','')}</span>
        <span style={{ flex:1 }}/>
        <span style={{
          fontFamily:ST.fontMono,
          color: tier==='vencido' ? ST.crit : tier==='critico' ? ST.crit : tier==='alerta' ? ST.warn : ST.textDim,
          fontWeight:500,
        }}>
          {tier === 'resolvido' ? '✓' : tier === 'vencido' ? `-${Math.abs(item.diasRestantes)}d` : `${item.diasRestantes}d`}
        </span>
      </div>
    </div>
  );
}

function STSeg({ active, onClick, count, children, tone }) {
  const toneColor = { all:ST.text, crit:ST.crit, warn:ST.warn, ok:ST.ok, resol:ST.textMute }[tone] || ST.text;
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:7,
      padding:'6px 12px', borderRadius:6,
      background: active ? ST.surfaceHi : 'transparent',
      border: active ? `1px solid ${ST.border}` : `1px solid transparent`,
      color: active ? ST.text : ST.textDim,
      fontSize:12, fontWeight:500, cursor:'pointer',
      fontFamily:ST.fontSans, letterSpacing:0.1,
    }}>
      <STDot color={toneColor} size={6}/>
      {children}
      <span style={{
        fontFamily:ST.fontMono, fontSize:10.5,
        color: active ? ST.text : ST.textMute,
        background: active ? ST.surface : ST.surface2,
        padding:'1px 6px', borderRadius:3, fontWeight:600,
      }}>{count}</span>
    </button>
  );
}

function STMiniSelect({ value, onChange, options }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, background:ST.surface,
      border:`1px solid ${ST.border}`, borderRadius:5, padding:'0 8px', height:28 }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background:'transparent', border:'none', outline:'none',
        color:ST.text, fontSize:11.5, fontFamily:ST.fontSans, cursor:'pointer',
        appearance:'none', paddingRight:14,
      }}>
        {options.map(o => <option key={o.v} value={o.v} style={{ background:ST.surface }}>{o.t}</option>)}
      </select>
      <span style={{ fontSize:9, color:ST.textMute, marginLeft:-12, pointerEvents:'none' }}>▾</span>
    </div>
  );
}

// ── KPI Strip ──────────────────────────────────────────────────────────────────
function STKpiStrip() {
  const v = useOuvVersion();
  const k = React.useMemo(() => {
    const abertas    = DATASET.filter(x => !['respondida','fechada'].includes(x.status));
    const foraPrazo  = abertas.filter(x => x.diasRestantes < 0).length;
    const noPrazo    = abertas.filter(x => x.diasRestantes >= 0).length;
    const resolvidas = DATASET.filter(x => ['respondida','fechada'].includes(x.status));
    const tempoMedio = resolvidas.length
      ? resolvidas.reduce((s,x) => s + (30 - x.diasRestantes), 0) / resolvidas.length
      : 0;
    const porUnidade = {};
    UNIDADES.forEach(u => { porUnidade[u.id] = { nome: u.nome, count: 0 }; });
    DATASET.forEach(x => { if (porUnidade[x.unidadeId]) porUnidade[x.unidadeId].count++; });
    const ranking    = Object.values(porUnidade).sort((a,b) => b.count - a.count);
    const porAssunto = {};
    DATASET.forEach(x => { porAssunto[x.assuntoKey] = (porAssunto[x.assuntoKey]||0) + 1; });
    const entries = Object.entries(porAssunto);
    const topA    = entries.length ? entries.sort((a,b) => b[1]-a[1])[0] : ['outros', 0];
    return { noPrazo, foraPrazo, tempoMedio, ranking, total: DATASET.length, topAssuntoKey: topA[0] };
  }, [v]);

  return (
    <div style={{
      padding:'14px 20px',
      display:'grid',
      gridTemplateColumns:'1.1fr 1.1fr 1.1fr 1.6fr 1.4fr',
      gap:10, borderBottom:`1px solid ${ST.borderSoft}`,
      flexShrink:0, background:'oklch(0.17 0.007 260)',
    }}>
      <STKpi label="No prazo"      value={k.noPrazo}              accent={ST.ok}   sub={`de ${k.total} ouvidorias`}/>
      <STKpi label="Fora do prazo" value={k.foraPrazo}            accent={ST.crit} sub="vencidas — ação imediata"/>
      <STKpi label="Tempo médio"   value={k.tempoMedio.toFixed(1)} unit="dias" accent={ST.warn} sub="resposta da unidade"/>
      <STRankingStrip ranking={k.ranking}/>
      <STAssuntoStrip/>
    </div>
  );
}

function STKpi({ label, value, unit, accent, sub }) {
  return (
    <div style={{ background:ST.surface, border:`1px solid ${ST.borderSoft}`, borderRadius:8,
      padding:'10px 14px', display:'flex', flexDirection:'column', gap:4, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:accent, opacity:0.7 }}/>
      <div style={{ fontSize:10, letterSpacing:0.7, textTransform:'uppercase', color:ST.textDim, fontWeight:600 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
        <div style={{ fontFamily:ST.fontMono, fontSize:28, fontWeight:500, color:accent, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{value}</div>
        {unit && <div style={{ fontSize:11, color:ST.textDim }}>{unit}</div>}
      </div>
      <div style={{ fontSize:10.5, color:ST.textMute }}>{sub}</div>
    </div>
  );
}

function STRankingStrip({ ranking }) {
  const max  = ranking[0]?.count || 1;
  const top5 = ranking.slice(0, 5);
  return (
    <div style={{ background:ST.surface, border:`1px solid ${ST.borderSoft}`, borderRadius:8, padding:'10px 14px',
      display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ fontSize:10, letterSpacing:0.7, textTransform:'uppercase', color:ST.textDim, fontWeight:600 }}>
        Ranking por unidade <span style={{ color:ST.textMute, marginLeft:4 }}>top 5</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:3, marginTop:2 }}>
        {top5.map(r => (
          <div key={r.nome} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11 }}>
            <div style={{ color:ST.text, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {r.nome.replace('USF ','')}
            </div>
            <div style={{ flex:1.4, height:5, background:ST.surface2, borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:`${(r.count/max)*100}%`, height:'100%', background:ST.accent }}/>
            </div>
            <div style={{ fontFamily:ST.fontMono, color:ST.text, width:22, textAlign:'right', fontSize:11 }}>{r.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function STAssuntoStrip() {
  const v = useOuvVersion();
  const data = React.useMemo(() => {
    const map = {};
    ASSUNTOS.forEach(a => { map[a.key] = { ...a, count: 0 }; });
    DATASET.forEach(x => { if (map[x.assuntoKey]) map[x.assuntoKey].count++; });
    return Object.values(map).sort((a,b) => b.count - a.count);
  }, [v]);
  const total = data.reduce((s,x) => s + x.count, 0) || 1;
  return (
    <div style={{ background:ST.surface, border:`1px solid ${ST.borderSoft}`, borderRadius:8, padding:'10px 14px',
      display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ fontSize:10, letterSpacing:0.7, textTransform:'uppercase', color:ST.textDim, fontWeight:600 }}>
        Distribuição · assuntos
      </div>
      <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', background:ST.surface2, marginTop:2 }}>
        {data.map(a => (
          <div key={a.key} style={{ flex:a.count, background:a.cor }} title={`${a.label}: ${a.count}`}/>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2, marginTop:2 }}>
        {data.slice(0,4).map(a => (
          <div key={a.key} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10.5, color:ST.textDim, overflow:'hidden' }}>
            <STDot color={a.cor} size={6}/>
            <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.label}</span>
            <span style={{ fontFamily:ST.fontMono, color:ST.text }}>{Math.round((a.count/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Detail View ────────────────────────────────────────────────────────────────
function STDetailView({ item, onEdit }) {
  const [showResposta,   setShowResposta]   = React.useState(false);
  const [showEncaminhar, setShowEncaminhar] = React.useState(false);
  const [showDelete,     setShowDelete]     = React.useState(false);
  const assunto        = ASSUNTOS.find(a => a.key === item.assuntoKey) || ASSUNTOS[0];
  const tier           = urgencyTier(item.diasRestantes, item.status);
  const isRespondida   = ['respondida', 'fechada'].includes(item.status);
  const isEncaminhada  = ['encaminhada', 'respondida', 'fechada'].includes(item.status);
  const tierBarColor = tier === 'resolvido' ? ST.textMute
    : tier === 'vencido' || tier === 'critico' ? ST.crit
    : tier === 'alerta' ? ST.warn : ST.ok;
  const prazoPct = Math.min(100, Math.max(0, ((30 - item.diasRestantes) / 30) * 100));

  return (
    <>
    <div style={{ padding:'28px 36px 36px', maxWidth:860 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <STTierBadge tier={tier}/>
            <span style={{ fontFamily:ST.fontMono, fontSize:11.5, color:ST.textDim, letterSpacing:0.5 }}>
              {item.protocolo}
            </span>
            <span style={{ color:ST.textMute }}>·</span>
            <span style={{ fontSize:11.5, color:ST.textDim }}>{item.canal}</span>
          </div>
          <div style={{ fontSize:22, fontWeight:600, color:ST.text, lineHeight:1.25, letterSpacing:-0.2 }}>
            {item.assunto}
          </div>
          <div style={{ fontSize:13, color:ST.textDim, marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
            <STDot color={assunto.cor} size={7}/>
            {item.unidade} ·{' '}
            {item.anonimo
              ? <span style={{ fontStyle:'italic', color:ST.textMute }}>Reclamante anônimo</span>
              : <span>{item.reclamante}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
          {onEdit && (
            <button onClick={() => onEdit(item)} style={stBtnEdit}>✏ Editar</button>
          )}
          <button
            onClick={() => { if (!isEncaminhada) setShowEncaminhar(true); }}
            style={{ ...stBtnSecondary,
              color:   isEncaminhada ? 'oklch(0.70 0.13 280)' : stBtnSecondary.color,
              borderColor: isEncaminhada ? 'oklch(0.40 0.10 280)' : undefined,
              cursor:  isEncaminhada ? 'default' : 'pointer',
            }}>
            {isEncaminhada ? '↗ Encaminhada' : 'Encaminhar'}
          </button>
          <button
            onClick={() => { if (!isRespondida) setShowResposta(true); }}
            style={{ ...stBtnPrimary,
              background: isRespondida ? 'oklch(0.30 0.08 155)' : stBtnPrimary.background,
              color: isRespondida ? ST.ok : stBtnPrimary.color,
              cursor: isRespondida ? 'default' : 'pointer',
              opacity: 1,
            }}>
            {isRespondida ? '✓ Respondida' : 'Registrar resposta'}
          </button>
          <button onClick={() => setShowDelete(true)} style={{
            background:'transparent', color:ST.crit, border:`1px solid ${ST.crit}`,
            borderRadius:6, padding:'7px 12px', fontSize:12, cursor:'pointer',
            fontFamily:ST.fontSans }}>🗑</button>
        </div>
      </div>

      {/* Barra de prazo */}
      <div style={{ background:ST.surface, border:`1px solid ${ST.borderSoft}`, borderRadius:10, padding:'16px 18px', marginBottom:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <div style={{ fontSize:11, letterSpacing:0.7, textTransform:'uppercase', color:ST.textDim, fontWeight:600 }}>
            Prazo legal · Lei 13.460/2017
          </div>
          <div style={{ fontFamily:ST.fontMono, fontSize:13, color:tierBarColor, fontWeight:600 }}>
            {tier === 'resolvido' ? 'Resolvido'
              : item.diasRestantes >= 0
                ? `${item.diasRestantes} dias restantes`
                : `${Math.abs(item.diasRestantes)} dias em atraso`}
          </div>
        </div>
        <div style={{ height:10, borderRadius:5, background:ST.surface2, overflow:'hidden', position:'relative', border:`1px solid ${ST.borderSoft}` }}>
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${prazoPct}%`,
            background:`linear-gradient(90deg, ${ST.ok}, ${ST.warn} 60%, ${ST.crit})` }}/>
          <div style={{ position:'absolute', left:`${prazoPct}%`, top:-3, bottom:-3, width:2,
            background:ST.text, boxShadow:'0 0 8px rgba(255,255,255,0.4)' }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:7,
          fontFamily:ST.fontMono, fontSize:10.5, color:ST.textMute }}>
          <span>entrada · {fmtDate(item.dataEntrada)}</span>
          <span>prazo final · {fmtDate(item.dataPrazo)}</span>
        </div>
      </div>

      {/* Relato + metadados */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:14, marginBottom:18 }}>
        <div style={{ background:ST.surface, border:`1px solid ${ST.borderSoft}`, borderRadius:10, padding:'16px 18px' }}>
          <div style={{ fontSize:11, letterSpacing:0.7, textTransform:'uppercase', color:ST.textDim, fontWeight:600, marginBottom:10 }}>
            Relato do cidadão
          </div>
          <div style={{ fontSize:14, lineHeight:1.65, color:ST.text }}>
            {item.detalhe || <span style={{ color:ST.textMute, fontStyle:'italic' }}>Sem relato registrado.</span>}
          </div>
          <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${ST.borderSoft}`,
            fontSize:11.5, color:ST.textMute, fontFamily:ST.fontMono }}>
            Registrado em {fmtDateTime(item.dataEntrada)} via {item.canal}
          </div>
        </div>

        <div style={{ background:ST.surface, border:`1px solid ${ST.borderSoft}`, borderRadius:10, padding:'4px 0' }}>
          <STMeta label="Protocolo"    value={item.protocolo}                                         mono/>
          <STMeta label="Unidade"      value={item.unidade}/>
          <STMeta label="Status"       value={<STStatusChip s={item.status}/>}/>
          <STMeta label="Assunto"      value={item.assunto}/>
          <STMeta label="Reclamante"   value={item.anonimo ? <span style={{color:ST.textMute,fontStyle:'italic'}}>Anônimo</span> : item.reclamante}/>
          <STMeta label="Canal"        value={item.canal}/>
          <STMeta label="Data entrada" value={fmtDate(item.dataEntrada)}                                mono/>
          <STMeta label="Prazo final"  value={fmtDate(item.dataPrazo)}                                 mono/>
          <STMeta label="Respondida em" value={item.dataRespondida ? fmtDate(item.dataRespondida) : <span style={{color:ST.textMute,fontStyle:'italic'}}>—</span>} mono last/>
        </div>
      </div>

      {/* Linha do tempo */}
      <div style={{ background:ST.surface, border:`1px solid ${ST.borderSoft}`, borderRadius:10, padding:'16px 20px' }}>
        <div style={{ fontSize:11, letterSpacing:0.7, textTransform:'uppercase', color:ST.textDim, fontWeight:600, marginBottom:14 }}>
          Linha do tempo
        </div>
        <STTimeline item={item}/>
      </div>
    </div>

    {showResposta    && <STRespostaModal   item={item} onClose={() => setShowResposta(false)}/>}
    {showEncaminhar  && <STEncaminharModal item={item} onClose={() => setShowEncaminhar(false)}/>}
    {showDelete      && <STDeleteModal     proto={item.protocolo} onClose={() => setShowDelete(false)}
                          onDeleted={() => { window._OUV_FETCH && window._OUV_FETCH(); setShowDelete(false); }}/>}
    </>
  );
}

function STMeta({ label, value, mono, last }) {
  return (
    <div style={{ padding:'10px 16px', borderBottom: last ? 'none' : `1px solid ${ST.borderSoft}`,
      display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
      <div style={{ fontSize:10.5, color:ST.textDim, textTransform:'uppercase', letterSpacing:0.6, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:12, color:ST.text, textAlign:'right', fontFamily: mono ? ST.fontMono : ST.fontSans }}>{value}</div>
    </div>
  );
}

function STStatusChip({ s }) {
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
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:c.bg, color:c.fg,
      padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:500 }}>
      <STDot color={c.fg} size={5}/>{st?.label || s}
    </span>
  );
}

function STTimeline({ item }) {
  const events = [
    { dt: item.dataEntrada,
      label:'Ouvidoria registrada', by:item.canal, done:true },
    { dt: new Date(item.dataEntrada.getTime() + 1*24*3600*1000),
      label:'Triagem · Coord. Ouvidoria', by:'Classificação e encaminhamento',
      done: ['encaminhada','respondida','fechada','reaberta'].includes(item.status) },
    { dt: new Date(item.dataEntrada.getTime() + 4*24*3600*1000),
      label:`Resposta · ${item.unidade}`, by:'Gestor de unidade',
      done: ['respondida','fechada','reaberta'].includes(item.status) },
    { dt: item.dataPrazo, label:'Prazo legal de 30 dias', by:'Lei 13.460/2017', isPrazo:true, done:false },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, position:'relative' }}>
      {events.map((e, i) => (
        <div key={i} style={{ display:'flex', gap:14, paddingBottom:14, position:'relative' }}>
          {i < events.length - 1 && (
            <div style={{ position:'absolute', left:5, top:14, bottom:0, width:1, background:ST.borderSoft }}/>
          )}
          <div style={{ width:11, height:11, borderRadius:'50%', marginTop:3, flexShrink:0,
            background: e.isPrazo ? 'transparent' : (e.done ? ST.accent : ST.textMute),
            border: e.isPrazo ? `1.5px dashed ${ST.warn}` : 'none',
            boxShadow: e.done && !e.isPrazo ? `0 0 0 3px oklch(0.22 0.06 200)` : 'none' }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color: e.done || e.isPrazo ? ST.text : ST.textDim, fontWeight:500 }}>{e.label}</div>
            <div style={{ fontSize:11, color:ST.textMute, marginTop:2, fontFamily:ST.fontMono }}>
              {fmtDateTime(e.dt)} · {e.by}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Estilos de botão ───────────────────────────────────────────────────────────
const stBtnPrimary = {
  background:ST.accent, color:'oklch(0.18 0.03 200)',
  border:'none', borderRadius:6, padding:'7px 14px',
  fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:ST.fontSans,
};
const stBtnSecondary = {
  background:'transparent', color:ST.text,
  border:`1px solid ${ST.border}`, borderRadius:6, padding:'7px 12px',
  fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:ST.fontSans,
};
const stBtnEdit = {
  background:'oklch(0.26 0.06 260)', color:ST.text,
  border:`1px solid ${ST.border}`, borderRadius:6, padding:'7px 12px',
  fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:ST.fontSans,
};

// ── Modal de formulário ────────────────────────────────────────────────────────
const CANAIS_OPTS = ['Telefone 156','Presencial','E-mail','Formulário web','WhatsApp','Sistema'];

function _dateToInput(d) {
  if (!d || !(d instanceof Date) || isNaN(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function _inputToFmt(s) {
  if (!s) return '';
  const [y,m,d] = s.split('-');
  return `${d}/${m}/${y}`;
}
function _addDays(inputVal, days) {
  if (!inputVal) return '';
  const d = new Date(inputVal);
  d.setDate(d.getDate() + days);
  return _dateToInput(d);
}

function STFormModal({ item, onClose }) {
  const isEdit = !!item;
  const hoje   = new Date();

  const [form, setForm] = React.useState(() => isEdit ? {
    protocolo:        item.protocolo,
    reclamante:       item.reclamante || '',
    unidade:          item.unidade,
    dataRecebimento:  _dateToInput(item.dataEntrada),
    prazo:            _dateToInput(item.dataPrazo),
    assunto:          item.assunto,
    detalhe:          item.detalhe || (item._raw && item._raw['Observações']) || '',
    canal:            item.canal || 'Formulário web',
    status:           item.status,
  } : {
    protocolo:        '',
    reclamante:       '',
    unidade:          UNIDADES[0].nome,
    dataRecebimento:  _dateToInput(hoje),
    prazo:            _addDays(_dateToInput(hoje), 30),
    assunto:          '',
    detalhe:          '',
    canal:            'Formulário web',
    status:           'nova',
  });

  const [saving, setSaving] = React.useState(false);
  const [err,    setErr]    = React.useState('');

  const field = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleDataChange = v => {
    field('dataRecebimento', v);
    if (v) field('prazo', _addDays(v, 30));
  };

  const handleSave = async () => {
    if (!form.assunto.trim())  { setErr('O campo Assunto é obrigatório.'); return; }
    if (!form.unidade.trim())  { setErr('O campo Unidade é obrigatório.'); return; }
    setErr(''); setSaving(true);

    const statusMap = {
      nova:'PENDENTE', encaminhada:'ENCAMINHADA',
      respondida:'RESPONDIDA', fechada:'FECHADA', reaberta:'REABERTA',
    };

    const payload = {
      'Protocolo':       form.protocolo.trim() || `MANUAL-${Date.now()}`,
      'Reclamante':      form.reclamante.trim(),
      'Unidade':         form.unidade,
      'Data Recebimento':_inputToFmt(form.dataRecebimento),
      'Prazo Resposta':  _inputToFmt(form.prazo),
      'Assunto':         form.assunto.trim(),
      'Observações':     form.detalhe.trim(),
      'Canal':           form.canal,
      'Status':          statusMap[form.status] || 'PENDENTE',
    };

    try {
      const ok = isEdit
        ? await window._OUV_UPDATE(item.protocolo, payload)
        : await window._OUV_CREATE(payload);

      if (ok) {
        onClose();
      } else {
        setErr('Erro ao salvar. Verifique se o servidor está ativo.');
      }
    } catch (e) {
      setErr('Erro de conexão: ' + e.message);
    }
    setSaving(false);
  };

  // Fundo + container
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200,
      background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:ST.fontSans }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width:560, maxHeight:'92vh', overflowY:'auto',
        background:ST.surface, border:`1px solid ${ST.border}`,
        borderRadius:12, padding:'28px 32px',
        boxShadow:'0 24px 60px rgba(0,0,0,0.6)' }}>

        {/* Título */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:24 }}>
          <div style={{ fontSize:17, fontWeight:600, color:ST.text }}>
            {isEdit ? '✏ Editar Ouvidoria' : '+ Nova Ouvidoria'}
          </div>
          <div style={{ flex:1 }}/>
          <button onClick={onClose}
            style={{ background:'transparent', border:'none', color:ST.textMute,
              cursor:'pointer', fontSize:20, lineHeight:1, padding:'0 4px' }}>✕</button>
        </div>

        {/* Protocolo */}
        <FField label="Protocolo" hint="Deixe em branco para gerar automaticamente">
          <FInput value={form.protocolo} onChange={v => field('protocolo', v)}
            placeholder="Ex: 2026-SZN-123456"/>
        </FField>

        {/* Reclamante */}
        <FField label="Reclamante" hint="Opcional — deixe vazio para anônimo">
          <FInput value={form.reclamante} onChange={v => field('reclamante', v)}
            placeholder="Nome completo do reclamante"/>
        </FField>

        {/* Unidade */}
        <FField label="Unidade de Saúde *">
          <FSelect value={form.unidade} onChange={v => field('unidade', v)}
            options={UNIDADES.map(u => ({ v: u.nome, t: u.nome }))}/>
        </FField>

        {/* Datas */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <FField label="Data de Recebimento *">
            <FDate value={form.dataRecebimento} onChange={handleDataChange}/>
          </FField>
          <FField label="Prazo de Resposta *">
            <FDate value={form.prazo} onChange={v => field('prazo', v)}/>
          </FField>
        </div>

        {/* Assunto */}
        <FField label="Assunto *">
          <FInput value={form.assunto} onChange={v => field('assunto', v)}
            placeholder="Descreva brevemente o assunto da ouvidoria"/>
        </FField>

        {/* Detalhe */}
        <FField label="Relato / Descrição">
          <textarea value={form.detalhe} onChange={e => field('detalhe', e.target.value)} rows={4}
            style={{ width:'100%', background:ST.bg, border:`1px solid ${ST.border}`,
              borderRadius:6, padding:'8px 10px', color:ST.text, fontSize:13,
              fontFamily:ST.fontSans, resize:'vertical', outline:'none', boxSizing:'border-box' }}/>
        </FField>

        {/* Canal + Status */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <FField label="Canal">
            <FSelect value={form.canal} onChange={v => field('canal', v)}
              options={CANAIS_OPTS.map(c => ({ v:c, t:c }))}/>
          </FField>
          <FField label="Status">
            <FSelect value={form.status} onChange={v => field('status', v)}
              options={STATUS_FLUXO.map(s => ({ v:s.key, t:s.label }))}/>
          </FField>
        </div>

        {/* Erro */}
        {err && (
          <div style={{ padding:'8px 12px', background:'oklch(0.28 0.12 20)',
            color:'oklch(0.80 0.19 25)', borderRadius:6, fontSize:12, marginTop:8 }}>{err}</div>
        )}

        {/* Botões */}
        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={onClose} style={{ ...stBtnSecondary, flex:1 }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            style={{ ...stBtnPrimary, flex:2, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar ouvidoria'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Registrar Resposta ───────────────────────────────────────────────────
function STRespostaModal({ item, onClose }) {
  const [dataRespondida, setDataRespondida] = React.useState(_dateToInput(new Date()));
  const [saving, setSaving] = React.useState(false);
  const [err,    setErr]    = React.useState('');

  const handleSave = async () => {
    if (!dataRespondida) { setErr('Informe a data em que a resposta foi dada.'); return; }
    setSaving(true); setErr('');
    const ok = await window._OUV_UPDATE(item.protocolo, {
      'Status':          'RESPONDIDA',
      'Data Respondida': _inputToFmt(dataRespondida),
    });
    if (ok) {
      onClose();
    } else {
      setErr('Erro ao salvar. Verifique se o servidor está ativo.');
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300,
      background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:ST.fontSans }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:420, background:ST.surface, border:`1px solid ${ST.border}`,
        borderRadius:12, padding:'28px 32px', boxShadow:'0 24px 60px rgba(0,0,0,0.6)' }}>

        {/* Título */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:600, color:ST.text }}>✓ Registrar Resposta</div>
          <div style={{ flex:1 }}/>
          <button onClick={onClose} style={{ background:'transparent', border:'none',
            color:ST.textMute, cursor:'pointer', fontSize:20, lineHeight:1, padding:'0 4px' }}>✕</button>
        </div>

        {/* Resumo da ouvidoria */}
        <div style={{ background:ST.bg, border:`1px solid ${ST.borderSoft}`, borderRadius:8,
          padding:'10px 14px', marginBottom:20 }}>
          <div style={{ fontFamily:ST.fontMono, fontSize:11, color:ST.textMute, marginBottom:4 }}>
            {item.protocolo}
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:ST.text, marginBottom:2 }}>{item.assunto}</div>
          <div style={{ fontSize:12, color:ST.textDim }}>{item.unidade}</div>
        </div>

        {/* Data respondida */}
        <FField label="Data em que foi respondida *">
          <FDate value={dataRespondida} onChange={setDataRespondida}/>
        </FField>

        {/* Erro */}
        {err && (
          <div style={{ padding:'8px 12px', background:'oklch(0.28 0.12 20)',
            color:'oklch(0.80 0.19 25)', borderRadius:6, fontSize:12, marginTop:8 }}>{err}</div>
        )}

        {/* Botões */}
        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={onClose} style={{ ...stBtnSecondary, flex:1 }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            style={{ ...stBtnPrimary, flex:2, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Salvando…' : 'Confirmar resposta'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Encaminhar ──────────────────────────────────────────────────────────
function STEncaminharModal({ item, onClose }) {
  const [saving, setSaving] = React.useState(false);
  const [err,    setErr]    = React.useState('');

  const handleSave = async () => {
    setSaving(true); setErr('');
    const ok = await window._OUV_UPDATE(item.protocolo, { 'Status': 'ENCAMINHADA' });
    if (ok) {
      onClose();
    } else {
      setErr('Erro ao salvar. Verifique se o servidor está ativo.');
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300,
      background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', fontFamily:ST.fontSans }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:420, background:ST.surface, border:`1px solid ${ST.border}`,
        borderRadius:12, padding:'28px 32px', boxShadow:'0 24px 60px rgba(0,0,0,0.6)' }}>

        {/* Título */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:600, color:ST.text }}>↗ Encaminhar Ouvidoria</div>
          <div style={{ flex:1 }}/>
          <button onClick={onClose} style={{ background:'transparent', border:'none',
            color:ST.textMute, cursor:'pointer', fontSize:20, lineHeight:1, padding:'0 4px' }}>✕</button>
        </div>

        {/* Resumo */}
        <div style={{ background:ST.bg, border:`1px solid ${ST.borderSoft}`, borderRadius:8,
          padding:'10px 14px', marginBottom:16 }}>
          <div style={{ fontFamily:ST.fontMono, fontSize:11, color:ST.textMute, marginBottom:4 }}>{item.protocolo}</div>
          <div style={{ fontSize:13, fontWeight:600, color:ST.text, marginBottom:2 }}>{item.assunto}</div>
          <div style={{ fontSize:12, color:'oklch(0.70 0.13 280)' }}>→ {item.unidade}</div>
        </div>

        <div style={{ fontSize:13, color:ST.textDim, marginBottom:20, lineHeight:1.6 }}>
          O status será alterado para{' '}
          <strong style={{ color:'oklch(0.75 0.13 280)' }}>Encaminhada</strong>
          {' '}e a ouvidoria ficará aguardando resposta da unidade.
        </div>

        {err && (
          <div style={{ padding:'8px 12px', background:'oklch(0.28 0.12 20)',
            color:'oklch(0.80 0.19 25)', borderRadius:6, fontSize:12, marginBottom:12 }}>{err}</div>
        )}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ ...stBtnSecondary, flex:1 }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            style={{ background:'oklch(0.35 0.12 280)', color:'oklch(0.90 0.05 280)',
              border:'none', borderRadius:6, padding:'7px 14px', fontSize:12,
              fontWeight:600, cursor: saving ? 'default' : 'pointer',
              fontFamily:ST.fontSans, flex:2, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Encaminhando…' : 'Confirmar encaminhamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Histórico de Respondidas ───────────────────────────────────────────────────
function STHistoricoView({ items }) {
  if (items.length === 0) {
    return (
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        flexDirection:'column', gap:12, color:ST.textMute, padding:40 }}>
        <div style={{ fontSize:36 }}>📂</div>
        <div style={{ fontWeight:600, fontSize:14, color:ST.textDim }}>Nenhuma ouvidoria respondida ainda</div>
        <div style={{ fontSize:12 }}>Ouvidorias marcadas como Respondida aparecerão aqui.</div>
      </div>
    );
  }

  const COLS = ['Protocolo', 'Unidade', 'Assunto', 'Entrada', 'Respondida', 'Prazo', 'Tempo'];

  return (
    <div style={{ flex:1, overflow:'auto', padding:'20px 28px' }}>
      <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ fontSize:15, fontWeight:600, color:ST.text }}>
          Histórico de Ouvidorias Respondidas
        </div>
        <div style={{ fontFamily:ST.fontMono, fontSize:11, color:ST.textMute,
          background:ST.surface, border:`1px solid ${ST.border}`, borderRadius:4, padding:'2px 8px' }}>
          {items.length} registro{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
        <thead>
          <tr style={{ background:ST.surface, borderBottom:`2px solid ${ST.border}` }}>
            {COLS.map(h => (
              <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:600,
                color:ST.textDim, fontSize:10.5, letterSpacing:0.5, textTransform:'uppercase',
                whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const diasResposta = item.dataRespondida
              ? Math.round((item.dataRespondida - item.dataEntrada) / (86400000))
              : null;
            const noPrazo = item.dataRespondida && item.dataRespondida <= item.dataPrazo;
            return (
              <tr key={item.id}
                style={{ borderBottom:`1px solid ${ST.borderSoft}`,
                  background: i % 2 === 0 ? 'transparent' : 'oklch(0.17 0.007 260 / 0.5)' }}>
                <td style={{ padding:'11px 12px', fontFamily:ST.fontMono, color:ST.textDim, fontSize:11.5, whiteSpace:'nowrap' }}>
                  {item.protocolo}
                </td>
                <td style={{ padding:'11px 12px', color:ST.text, whiteSpace:'nowrap', maxWidth:180,
                  overflow:'hidden', textOverflow:'ellipsis' }}>
                  {item.unidade.replace('USF ', '')}
                </td>
                <td style={{ padding:'11px 12px', color:ST.text, maxWidth:220,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {item.assunto}
                </td>
                <td style={{ padding:'11px 12px', fontFamily:ST.fontMono, color:ST.textMute, fontSize:12, whiteSpace:'nowrap' }}>
                  {fmtDate(item.dataEntrada)}
                </td>
                <td style={{ padding:'11px 12px', fontFamily:ST.fontMono, fontSize:12, whiteSpace:'nowrap',
                  color: item.dataRespondida ? ST.ok : ST.textMute }}>
                  {item.dataRespondida ? fmtDate(item.dataRespondida) : '—'}
                </td>
                <td style={{ padding:'11px 12px', fontFamily:ST.fontMono, color:ST.textMute, fontSize:12, whiteSpace:'nowrap' }}>
                  {fmtDate(item.dataPrazo)}
                </td>
                <td style={{ padding:'11px 12px', whiteSpace:'nowrap' }}>
                  {diasResposta !== null ? (
                    <span style={{ fontFamily:ST.fontMono, fontSize:12.5, fontWeight:600,
                      color: noPrazo ? ST.ok : ST.crit }}>
                      {diasResposta}d {noPrazo ? '✓' : '⚠'}
                    </span>
                  ) : <span style={{ color:ST.textMute }}>—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Sub-componentes de formulário
function FField({ label, hint, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:6 }}>
        <label style={{ fontSize:11, fontWeight:600, color:ST.textDim,
          textTransform:'uppercase', letterSpacing:0.6 }}>{label}</label>
        {hint && <span style={{ fontSize:10.5, color:ST.textMute }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
function FInput({ value, onChange, placeholder }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width:'100%', background:ST.bg, border:`1px solid ${ST.border}`, borderRadius:6,
        padding:'8px 10px', color:ST.text, fontSize:13, fontFamily:ST.fontSans, outline:'none', boxSizing:'border-box' }}/>
  );
}
function FSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width:'100%', background:ST.surface2, border:`1px solid ${ST.border}`, borderRadius:6,
        padding:'8px 10px', color:ST.text, fontSize:13, fontFamily:ST.fontSans,
        outline:'none', cursor:'pointer', boxSizing:'border-box' }}>
      {options.map(o => <option key={o.v} value={o.v} style={{ background:ST.surface2 }}>{o.t}</option>)}
    </select>
  );
}
function FDate({ value, onChange }) {
  return (
    <input type="date" value={value} onChange={e => onChange(e.target.value)}
      style={{ width:'100%', background:ST.bg, border:`1px solid ${ST.border}`, borderRadius:6,
        padding:'8px 10px', color:ST.text, fontSize:13, fontFamily:ST.fontMono,
        outline:'none', boxSizing:'border-box' }}/>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
function SplitTriagem({ embedded = false }) {
  const v = useOuvVersion();
  const [segmento,      setSegmento]      = React.useState('all');
  const [filtroUnidade, setFiltroUnidade] = React.useState('all');
  const [filtroAssunto, setFiltroAssunto] = React.useState('all');
  const [sort,          setSort]          = React.useState('urgencia');
  const [busca,         setBusca]         = React.useState('');
  const [sel,           setSel]           = React.useState(null);
  const [showMap,       setShowMap]       = React.useState(false);
  const [showForm,      setShowForm]      = React.useState(false);
  const [editItem,      setEditItem]      = React.useState(null);

  const openCreate = () => { setEditItem(null); setShowForm(true); };
  const openEdit   = item => { setEditItem(item); setShowForm(true); };
  const closeForm  = () => { setShowForm(false); setEditItem(null); };

  const filtered = React.useMemo(() => {
    let arr = DATASET;
    if (segmento !== 'all') {
      arr = arr.filter(x => {
        const t = urgencyTier(x.diasRestantes, x.status);
        if (segmento === 'vencidos')   return t === 'vencido';
        if (segmento === 'urgente')    return t === 'critico' || t === 'vencido';
        if (segmento === 'atencao')    return t === 'alerta';
        if (segmento === 'resolvidas') return t === 'resolvido';
        return true;
      });
    }
    if (filtroUnidade !== 'all') arr = arr.filter(x => x.unidadeId === filtroUnidade);
    if (filtroAssunto !== 'all') arr = arr.filter(x => x.assuntoKey === filtroAssunto);
    if (busca.trim()) {
      const q = busca.toLowerCase();
      arr = arr.filter(x =>
        x.protocolo.toLowerCase().includes(q) ||
        (x.reclamante||'').toLowerCase().includes(q) ||
        x.unidade.toLowerCase().includes(q) ||
        x.assunto.toLowerCase().includes(q) ||
        x.detalhe.toLowerCase().includes(q)
      );
    }
    return [...arr].sort((a,b) => {
      if (sort === 'urgencia') {
        const order = ['vencido','critico','alerta','ok','resolvido'];
        const ta = order.indexOf(urgencyTier(a.diasRestantes, a.status));
        const tb = order.indexOf(urgencyTier(b.diasRestantes, b.status));
        if (ta !== tb) return ta - tb;
        return a.diasRestantes - b.diasRestantes;
      }
      return b.dataEntrada - a.dataEntrada;
    });
  }, [segmento, filtroUnidade, filtroAssunto, busca, sort, v]);

  React.useEffect(() => {
    if (!sel && filtered.length > 0) setSel(filtered[0].id);
    if (sel && !filtered.find(x => x.id === sel) && filtered.length > 0) setSel(filtered[0].id);
  }, [filtered.length]);

  const segCounts = React.useMemo(() => {
    const c = { all: DATASET.length, vencidos:0, urgente:0, atencao:0, resolvidas:0 };
    DATASET.forEach(x => {
      const t = urgencyTier(x.diasRestantes, x.status);
      if (t === 'vencido')  { c.vencidos++; c.urgente++; }
      else if (t === 'critico')  c.urgente++;
      else if (t === 'alerta')   c.atencao++;
      else if (t === 'resolvido') c.resolvidas++;
    });
    return c;
  }, [v]);

  const selected = DATASET.find(x => x.id === sel);

  function exportCSV() {
    const rows = [
      ['Protocolo','Unidade','Data Entrada','Assunto','Reclamante','Status','Prazo','Dias restantes'],
      ...filtered.map(x => [
        x.protocolo, x.unidade, fmtDate(x.dataEntrada), x.assunto,
        x.reclamante || 'Anônimo', x.statusLabel, fmtDate(x.dataPrazo), x.diasRestantes,
      ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `triagem-ouvidorias-${fmtDate(new Date()).replaceAll('/','-')}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const BtnNova = () => (
    <button onClick={openCreate} style={{
      background:ST.accent, color:'oklch(0.18 0.03 200)',
      border:'none', borderRadius:6, padding:'5px 14px',
      fontSize:12, fontWeight:600, cursor:'pointer', height:30,
      display:'inline-flex', alignItems:'center', gap:6, fontFamily:ST.fontSans,
    }}>+ Nova Ouvidoria</button>
  );

  return (
    <div style={{
      width: embedded ? '100%' : 1480,
      height: embedded ? '100%' : 960,
      background:ST.bg, color:ST.text,
      fontFamily:ST.fontSans, display:'flex', flexDirection:'column',
      position:'relative', overflow:'hidden',
      flex: embedded ? 1 : 'none', minHeight:0,
    }}>
      {/* Top bar (standalone) */}
      {!embedded && (
        <div style={{ height:52, borderBottom:`1px solid ${ST.border}`,
          display:'flex', alignItems:'center', padding:'0 20px', gap:14,
          background:ST.surface, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:24, height:24, borderRadius:5, background:ST.accent,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:ST.fontMono, fontSize:12, fontWeight:700, color:'oklch(0.18 0.03 200)' }}>T</div>
            <div style={{ fontSize:13.5, fontWeight:600 }}>Triagem de Ouvidorias</div>
            <span style={{ fontSize:11, color:ST.textMute, fontFamily:ST.fontMono, marginLeft:4 }}>
              / SUZANO · 12 USF
            </span>
          </div>
          <div style={{ flex:1 }}/>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:ST.bg,
            border:`1px solid ${ST.border}`, borderRadius:6, padding:'0 10px', height:30, minWidth:280 }}>
            <span style={{ color:ST.textMute, fontSize:12 }}>⌕</span>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar relatos, protocolos, nomes…"
              style={{ background:'transparent', border:'none', outline:'none',
                color:ST.text, fontSize:12, fontFamily:ST.fontSans, width:'100%' }}/>
          </div>
          <BtnNova/>
          <button onClick={() => setShowMap(v => !v)} style={{
            background: showMap ? ST.accent : 'transparent',
            color: showMap ? 'oklch(0.18 0.03 200)' : ST.text,
            border:`1px solid ${showMap ? ST.accent : ST.border}`, borderRadius:6,
            padding:'5px 12px', fontSize:12, cursor:'pointer', height:30,
            display:'inline-flex', alignItems:'center', gap:6,
          }}>⊕ Mapa</button>
          <button onClick={exportCSV} style={{ background:'transparent', color:ST.text,
            border:`1px solid ${ST.border}`, borderRadius:6, padding:'5px 12px',
            fontSize:12, cursor:'pointer', height:30 }}>Exportar</button>
        </div>
      )}

      {/* Quick actions (embedded) */}
      {embedded && (
        <div style={{ padding:'8px 20px', borderBottom:`1px solid ${ST.borderSoft}`,
          display:'flex', alignItems:'center', gap:10, flexShrink:0, background:ST.surface }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:ST.bg,
            border:`1px solid ${ST.border}`, borderRadius:6, padding:'0 10px',
            height:30, flex:1, maxWidth:360 }}>
            <span style={{ color:ST.textMute, fontSize:12 }}>⌕</span>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar relatos, protocolos, nomes…"
              style={{ background:'transparent', border:'none', outline:'none',
                color:ST.text, fontSize:12, fontFamily:ST.fontSans, width:'100%' }}/>
          </div>
          <span style={{ flex:1 }}/>
          <BtnNova/>
          <button onClick={() => setShowMap(v => !v)} style={{
            background: showMap ? ST.accent : 'transparent',
            color: showMap ? 'oklch(0.18 0.03 200)' : ST.text,
            border:`1px solid ${showMap ? ST.accent : ST.border}`, borderRadius:6,
            padding:'5px 12px', fontSize:12, cursor:'pointer', height:30,
            display:'inline-flex', alignItems:'center', gap:6,
          }}>⊕ Mapa</button>
          <button onClick={exportCSV} style={{ background:'transparent', color:ST.text,
            border:`1px solid ${ST.border}`, borderRadius:6, padding:'5px 12px',
            fontSize:12, cursor:'pointer', height:30 }}>Exportar</button>
        </div>
      )}

      {/* KPI strip */}
      <STKpiStrip/>

      {/* Segmentos + filtros */}
      <div style={{ padding:'10px 20px', display:'flex', alignItems:'center', gap:6,
        borderBottom:`1px solid ${ST.borderSoft}`,
        background:'oklch(0.18 0.007 260)', flexShrink:0 }}>
        <STSeg tone="all"   active={segmento==='all'}        onClick={() => setSegmento('all')}        count={segCounts.all}>Todas</STSeg>
        <STSeg tone="crit"  active={segmento==='vencidos'}   onClick={() => setSegmento('vencidos')}   count={segCounts.vencidos}>Vencidas</STSeg>
        <STSeg tone="crit"  active={segmento==='urgente'}    onClick={() => setSegmento('urgente')}    count={segCounts.urgente}>Urgente (≤3d)</STSeg>
        <STSeg tone="warn"  active={segmento==='atencao'}    onClick={() => setSegmento('atencao')}    count={segCounts.atencao}>Atenção</STSeg>
        <STSeg tone="resol" active={segmento==='resolvidas'} onClick={() => setSegmento('resolvidas')} count={segCounts.resolvidas}>Resolvidas</STSeg>
        <span style={{ flex:1 }}/>
        <STMiniSelect value={filtroUnidade} onChange={setFiltroUnidade} options={[
          {v:'all', t:'Todas as unidades'},
          ...UNIDADES.map(u => ({v:u.id, t:u.nome.replace('USF ','')})),
        ]}/>
        <STMiniSelect value={filtroAssunto} onChange={setFiltroAssunto} options={[
          {v:'all', t:'Todos os assuntos'},
          ...ASSUNTOS.map(a => ({v:a.key, t:a.label})),
        ]}/>
        <STMiniSelect value={sort} onChange={setSort} options={[
          {v:'urgencia', t:'Ordem: urgência'},
          {v:'data',     t:'Ordem: mais recentes'},
        ]}/>
      </div>

      {/* Painel principal */}
      {segmento === 'resolvidas' ? (
        /* Histórico full-width */
        <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>
          <STHistoricoView items={filtered}/>
        </div>
      ) : (
        /* Painel dividido */
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'450px 1fr', minHeight:0 }}>
          {/* Inbox */}
          <div style={{ borderRight:`1px solid ${ST.borderSoft}`, overflow:'auto', background:'oklch(0.175 0.007 260)' }}>
            {DATASET.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:ST.textMute, fontSize:13 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
                <div style={{ fontWeight:600, marginBottom:8 }}>Nenhuma ouvidoria encontrada</div>
                <div style={{ fontSize:12 }}>Processe e-mails ou clique em <strong>+ Nova Ouvidoria</strong> para adicionar manualmente.</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:ST.textMute, fontSize:13 }}>
                Nenhuma ouvidoria corresponde aos filtros.
              </div>
            ) : (
              filtered.map(item => (
                <STInboxItem key={item.id} item={item}
                  selected={sel === item.id}
                  onClick={() => setSel(item.id)}/>
              ))
            )}
          </div>

          {/* Painel de detalhe ou mapa */}
          <div style={{ overflow:'auto', position:'relative' }}>
            {showMap ? (
              <div style={{ width:'100%', height:'100%' }}>
                <MapaUnidades/>
              </div>
            ) : (
              selected && <STDetailView item={selected} onEdit={openEdit}/>
            )}
          </div>
        </div>
      )}

      {/* Modal de formulário */}
      {showForm && <STFormModal item={editItem} onClose={closeForm}/>}
    </div>
  );
}

function STDeleteModal({ proto, onClose, onDeleted }) {
  const [fase, setFase] = React.useState('confirm');
  const [erro, setErro] = React.useState('');

  async function confirmar() {
    setFase('loading');
    try {
      const res = await fetch(`/api/ouvidorias/${encodeURIComponent(proto)}`, { method: 'DELETE' });
      if (res.ok) { setFase('done'); setTimeout(() => { onDeleted(); }, 800); }
      else { const j = await res.json(); setErro(j.detail||'Erro ao excluir'); setFase('confirm'); }
    } catch (e) { setErro(String(e)); setFase('confirm'); }
  }

  const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.70)',
    zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center' };
  const box = { background:ST.surface, border:`1px solid ${ST.crit}`, borderRadius:12,
    padding:'28px 32px', width:380, maxWidth:'90vw', display:'flex', flexDirection:'column', gap:18,
    boxShadow:'0 24px 60px rgba(0,0,0,0.5)' };

  return (
    <div style={overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ fontSize:15, fontWeight:600, color:ST.crit }}>🗑 Excluir ouvidoria</div>
        {fase === 'done' ? (
          <div style={{ textAlign:'center', color:ST.ok, fontSize:14, padding:'8px 0' }}>✓ Excluída</div>
        ) : (
          <>
            <p style={{ fontSize:13, color:ST.textDim, lineHeight:1.6 }}>
              Excluir <strong style={{color:ST.text,fontFamily:ST.fontMono}}>{proto}</strong>?
              {' '}<strong style={{color:ST.crit}}>Esta ação não pode ser desfeita.</strong>
            </p>
            {erro && <p style={{ fontSize:12, color:ST.crit }}>{erro}</p>}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={onClose} style={{ background:'transparent', color:ST.textDim,
                border:`1px solid ${ST.border}`, borderRadius:6, padding:'8px 16px',
                fontSize:13, cursor:'pointer' }}>Cancelar</button>
              <button onClick={confirmar} disabled={fase==='loading'} style={{
                background:ST.crit, color:'#fff', border:'none', borderRadius:6,
                padding:'8px 16px', fontSize:13, fontWeight:600,
                cursor:fase==='loading'?'wait':'pointer' }}>
                {fase==='loading' ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SplitTriagem });
