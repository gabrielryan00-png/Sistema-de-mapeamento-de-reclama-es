// mapa-unidades.jsx – Mapa esquemático de Suzano com pins das USFs.

const MAP = {
  bg:       'oklch(0.18 0.006 260)',
  land:     'oklch(0.22 0.008 260)',
  landEdge: 'oklch(0.30 0.010 260)',
  river:    'oklch(0.35 0.05 220)',
  road:     'oklch(0.32 0.006 260)',
  railway:  'oklch(0.45 0.08 60)',
  grid:     'oklch(0.24 0.008 260)',
  text:     'oklch(0.94 0.005 260)',
  textDim:  'oklch(0.70 0.010 260)',
  textMute: 'oklch(0.55 0.010 260)',
  pin:      'oklch(0.72 0.15 200)',
  pinCrit:  'oklch(0.72 0.19 28)',
  pinWarn:  'oklch(0.80 0.16 85)',
  pinOk:    'oklch(0.74 0.14 150)',
  fontSans: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  fontMono: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
};

function MapaUnidades({ compact = false }) {
  const v = useOuvVersion();
  const [hover,    setHover]    = React.useState(null);
  const [selected, setSelected] = React.useState(null);

  const dados = React.useMemo(() => {
    const map = {};
    UNIDADES.forEach(u => {
      map[u.id] = { ...u, total:0, abertas:0, vencidas:0, urgentes:0, atencao:0, resolvidas:0 };
    });
    DATASET.forEach(x => {
      const d = map[x.unidadeId];
      if (!d) return;
      d.total++;
      const t = urgencyTier(x.diasRestantes, x.status);
      if      (t === 'vencido')  { d.vencidas++; d.abertas++; }
      else if (t === 'critico')  { d.urgentes++; d.abertas++; }
      else if (t === 'alerta')   { d.atencao++;  d.abertas++; }
      else if (t === 'ok')       { d.abertas++; }
      else                         d.resolvidas++;
    });
    return Object.values(map);
  }, [v]);

  const maxTotal = Math.max(...dados.map(d => d.total), 1);
  const info = hover ? dados.find(d => d.id === hover) : (selected ? dados.find(d => d.id === selected) : null);

  return (
    <div style={{ width:'100%', height:'100%', background:MAP.bg, color:MAP.text,
      fontFamily:MAP.fontSans, position:'relative', overflow:'hidden' }}>

      {/* SVG do mapa */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke={MAP.grid} strokeWidth="0.08"/>
          </pattern>
          <radialGradient id="landglow" cx="50%" cy="50%" r="65%">
            <stop offset="0%"   stopColor="oklch(0.26 0.010 260)"/>
            <stop offset="100%" stopColor="oklch(0.20 0.008 260)"/>
          </radialGradient>
        </defs>

        <path d="M 8 35 Q 12 18, 28 15 Q 44 10, 58 14 Q 74 16, 86 22 Q 95 30, 93 48 Q 94 66, 86 78 Q 76 88, 58 89 Q 40 92, 24 86 Q 10 78, 6 62 Q 4 48, 8 35 Z"
          fill="url(#landglow)" stroke={MAP.landEdge} strokeWidth="0.2"/>
        <rect width="100" height="100" fill="url(#grid)"/>

        {/* Rio Tietê */}
        <path d="M 0 12 Q 20 8, 40 10 Q 60 12, 80 9 Q 95 8, 100 10"
          fill="none" stroke={MAP.river} strokeWidth="0.8" opacity="0.55"/>
        <text x="12" y="7" fill={MAP.textMute} fontSize="1.6" fontFamily={MAP.fontMono} opacity="0.7">RIO TIETÊ</text>

        {/* CPTM */}
        <path d="M 4 52 L 96 48" fill="none" stroke={MAP.railway} strokeWidth="0.35" strokeDasharray="1.2 0.6" opacity="0.7"/>
        <text x="78" y="46" fill={MAP.textMute} fontSize="1.5" fontFamily={MAP.fontMono} opacity="0.7">CPTM · LINHA 11</text>

        {/* Vias principais */}
        <path d="M 20 20 L 80 80" stroke={MAP.road} strokeWidth="0.45" opacity="0.55"/>
        <path d="M 50 10 L 55 90" stroke={MAP.road} strokeWidth="0.45" opacity="0.55"/>
        <path d="M 10 60 Q 40 55, 90 65" stroke={MAP.road} strokeWidth="0.35" opacity="0.45" fill="none"/>

        {/* Contorno */}
        <path d="M 8 35 Q 12 18, 28 15 Q 44 10, 58 14 Q 74 16, 86 22 Q 95 30, 93 48 Q 94 66, 86 78 Q 76 88, 58 89 Q 40 92, 24 86 Q 10 78, 6 62 Q 4 48, 8 35 Z"
          fill="none" stroke={MAP.landEdge} strokeWidth="0.35" strokeDasharray="0.8 0.4" opacity="0.6"/>

        {/* Centro */}
        <circle cx="50" cy="50" r="0.4" fill={MAP.textMute}/>
        <text x="52" y="51.5" fill={MAP.textMute} fontSize="1.4" fontFamily={MAP.fontMono} opacity="0.75">CENTRO</text>
      </svg>

      {/* Pins */}
      {dados.map(d => {
        const size     = 14 + (d.total / maxTotal) * 28;
        const isHot    = d.vencidas > 0 || d.urgentes > 2;
        const isWarn   = !isHot && (d.urgentes > 0 || d.atencao > 2);
        const pinColor = isHot ? MAP.pinCrit : (isWarn ? MAP.pinWarn : MAP.pinOk);
        const isActive = hover === d.id || selected === d.id;

        return (
          <div key={d.id}
            onMouseEnter={() => setHover(d.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => setSelected(selected === d.id ? null : d.id)}
            style={{ position:'absolute', left:`${d.x}%`, top:`${d.y}%`,
              transform:'translate(-50%, -50%)', cursor:'pointer', zIndex: isActive ? 10 : 2 }}>
            {/* halo */}
            <div style={{ position:'absolute', left:'50%', top:'50%', width:size*1.8, height:size*1.8,
              borderRadius:'50%', background:pinColor, opacity:0.12, transform:'translate(-50%,-50%)',
              animation: isHot ? 'mpulse 2.2s ease-out infinite' : 'none' }}/>
            {/* pin */}
            <div style={{ width:size, height:size, borderRadius:'50%', background:pinColor,
              border:`2px solid ${isActive ? '#fff' : MAP.bg}`,
              boxShadow: isActive ? `0 0 0 3px ${pinColor}, 0 6px 18px rgba(0,0,0,0.5)` : `0 2px 8px rgba(0,0,0,0.5)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:MAP.fontMono, fontSize: size>26 ? 12 : 10, fontWeight:700,
              color:'oklch(0.15 0.01 260)', transition:'transform .15s',
              transform: isActive ? 'scale(1.08)' : 'scale(1)' }}>
              {d.total}
            </div>
            {/* rótulo */}
            {!compact && (
              <div style={{ position:'absolute', left:'50%', top:'100%', transform:'translate(-50%, 6px)',
                fontSize:10, color: isActive ? MAP.text : MAP.textDim,
                fontFamily:MAP.fontSans, fontWeight: isActive ? 600 : 500,
                whiteSpace:'nowrap', pointerEvents:'none',
                textShadow:'0 1px 4px rgba(0,0,0,0.7)', letterSpacing:0.1 }}>
                {d.nome.replace('USF ','')}
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes mpulse {
          0%   { transform:translate(-50%,-50%) scale(0.8); opacity:0.35; }
          100% { transform:translate(-50%,-50%) scale(2);   opacity:0;    }
        }
      `}</style>

      {/* Legenda */}
      <div style={{ position:'absolute', left:14, bottom:14,
        background:'oklch(0.20 0.008 260 / 0.85)', backdropFilter:'blur(6px)',
        border:`1px solid ${MAP.landEdge}`, borderRadius:8, padding:'10px 12px',
        fontSize:10.5, color:MAP.textDim }}>
        <div style={{ fontSize:10, letterSpacing:0.7, textTransform:'uppercase', color:MAP.textMute, fontWeight:600, marginBottom:8 }}>
          Legenda
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <LegendItem color={MAP.pinCrit} label="Unidade com ouvidoria vencida"/>
          <LegendItem color={MAP.pinWarn} label="Volume de atenção"/>
          <LegendItem color={MAP.pinOk}   label="Fluxo dentro do prazo"/>
        </div>
        <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${MAP.landEdge}`,
          display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8,  height:8,  borderRadius:'50%', background:MAP.textDim }}/>
            <div style={{ width:14, height:14, borderRadius:'50%', background:MAP.textDim }}/>
          </div>
          <span>tamanho = volume de ouvidorias</span>
        </div>
      </div>

      {/* Tooltip de detalhe */}
      {info && (
        <div style={{ position:'absolute', right:14, top:14, width:280,
          background:'oklch(0.22 0.008 260 / 0.95)', backdropFilter:'blur(8px)',
          border:`1px solid ${MAP.landEdge}`, borderRadius:10, padding:'14px 16px',
          boxShadow:'0 10px 30px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize:10.5, color:MAP.textMute, letterSpacing:0.5, fontFamily:MAP.fontMono, textTransform:'uppercase' }}>
            {info.bairro}
          </div>
          <div style={{ fontSize:15, fontWeight:600, color:MAP.text, marginTop:2 }}>{info.nome}</div>
          <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <MapStat value={info.total}                     label="total"     color={MAP.text}/>
            <MapStat value={info.abertas}                   label="abertas"   color={MAP.pin}/>
            <MapStat value={info.urgentes + info.vencidas}  label="urgentes"  color={MAP.pinCrit}/>
            <MapStat value={info.resolvidas}                label="resolvidas" color={MAP.pinOk}/>
          </div>
          {info.vencidas > 0 && (
            <div style={{ marginTop:10, padding:'6px 10px', borderRadius:6,
              background:'oklch(0.28 0.12 20)', color:'oklch(0.80 0.19 25)',
              fontSize:11, fontWeight:600, fontFamily:MAP.fontMono, letterSpacing:0.3 }}>
              ⚠ {info.vencidas} OUVIDORIA{info.vencidas>1?'S':''} VENCIDA{info.vencidas>1?'S':''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
      <div style={{ width:10, height:10, borderRadius:'50%', background:color, boxShadow:`0 0 0 2px ${MAP.bg}` }}/>
      <span>{label}</span>
    </div>
  );
}

function MapStat({ value, label, color }) {
  return (
    <div>
      <div style={{ fontFamily:MAP.fontMono, fontSize:20, fontWeight:500, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, color:MAP.textMute, textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>{label}</div>
    </div>
  );
}

Object.assign(window, { MapaUnidades });
