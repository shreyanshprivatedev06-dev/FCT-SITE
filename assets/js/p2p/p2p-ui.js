/* FCT demo — P2P control tower v2: shared components (React 18 + htm, Recharts, Lucide subset from assets/js/sc/icons.js).
   Every number comes from window.P2PM (p2p-model.js). Shell, rail, close clock and the decision drawer stay in fct-core.js / fct-ui.js.
   Interaction contract: single click selects (updates local detail), double click or the explicit "Drill in" control appends a breadcrumb. */
(function(){
  const { createElement:h, useState, useEffect, useRef, useMemo, Fragment } = React;
  const html = htm.bind(h);
  const R = Recharts, { motion, MotionConfig, useReducedMotion, AnimatePresence } = Motion;
  /* the tower engine: P2P by default; another tower (R2R) sets window.TOWERM before this file loads and reuses these components */
  const M = window.TOWERM || window.P2PM, FCT = window.FCT;
  const P = window.P2P = { html, h, R, M };
  ['Line','Bar','Pie','Area'].forEach(k=>{ if(R[k]) R[k].defaultProps = Object.assign({}, R[k].defaultProps, { animationDuration:450, animationEasing:'ease-out' }); });
  const cx = (...a)=> a.filter(Boolean).join(' ');
  P.cx = cx;

  /* ---------- tokens ---------- */
  /* colours resolve through CSS variables so the same chart reads on the light board and the dark drill-down panel (assets/css/p2p.css) */
  const COL = P.COL = { ink:'var(--px-ink)', ink2:'var(--px-ink2)', ink3:'var(--px-ink3)', line:'var(--px-line)', grid:'var(--px-grid)', brand:'var(--px-brand)', brand2:'var(--px-brand2)', mid:'var(--px-mid)', light:'var(--px-light)', brass:'var(--px-brass)',
    crit:'var(--px-crit)', high:'var(--px-high)', med:'#8A6A00', pos:'var(--px-pos)', low:'#7F9490', sel:'var(--px-brass)', surface:'var(--surface)', fade:'var(--px-fade)', kc:'var(--kc, var(--px-brand2))' };
  P.RISK = { Critical:'var(--px-crit)', High:'var(--px-high)', Medium:'var(--px-medium)', Low:'var(--px-lowc)' };
  /* one accent and one icon per KPI, used identically on the board card, the panel title and the breadcrumb */
  P.KTHEME = { health:'teal', spend:'blue', topv:'blue', commit:'violet', overdue:'violet', exposure:'amber', riskmix:'amber', mdq:'amber', vendors:'amber',
    match:'green', approval:'green', price:'green', grt:'green', otp:'green', process:'teal' };
  P.KICON = { health:'Gauge', spend:'IndianRupee', topv:'TrendingUp', commit:'ClipboardCheck', overdue:'CalendarClock', exposure:'TriangleAlert', riskmix:'Users', mdq:'ListChecks',
    match:'Link2', approval:'ShieldCheck', price:'Scale', grt:'Warehouse', otp:'Clock', vendors:'Users', process:'Layers' };
  P.kc = (id)=> 'k-'+(P.KTHEME[id] || 'teal');
  P.ramp = [0,1,2,3,4,5].map(i=> 'var(--px-r'+i+')');
  P.heatColor = (v, max)=> !v? P.ramp[0] : P.ramp[Math.min(5, 1 + Math.floor(Math.sqrt(v/max)*4.999))];

  /* ---------- format ---------- */
  const cr = (v,d)=> v==null? 'N/A' : FCT.cr(v, d==null? (Math.abs(v)>=100? 1 : 2) : d);
  const amt = (v)=> v==null? 'N/A' : FCT.amt(v);
  const pct = (v,d=1)=> v==null? 'N/A' : FCT.pct(v,d);
  P.cr = cr; P.amt = amt; P.pct = pct;
  P.fmtKpi = (id, v)=>{ if(v==null) return 'N/A';
    if(id==='health') return String(Math.round(v)); if(['spend','commit','overdue','exposure'].includes(id)) return cr(v, v>=100? 1 : 2);
    if(id==='riskmix') return FCT.n(v); if(id==='topv') return pct(v,1); return pct(v,1); };
  P.n = (v)=> v==null? 'N/A' : FCT.n(v);

  /* ---------- motion ---------- */
  const useRM = ()=> !!useReducedMotion();
  P.useRM = useRM;
  function useTween(v, ms=420){
    const rm = useRM(); const [x,setX] = useState(v); const from = useRef(v);
    useEffect(()=>{ if(rm || v==null || from.current==null){ setX(v); from.current = v; return; }
      const a = from.current, t0 = performance.now(); let raf;
      const step = (t)=>{ const k = Math.min(1,(t-t0)/ms), e = 1-Math.pow(1-k,3); setX(a+(v-a)*e); if(k<1) raf = requestAnimationFrame(step); else from.current = v; };
      raf = requestAnimationFrame(step); return ()=>{ cancelAnimationFrame(raf); from.current = v; }; },[v,rm]);
    return x;
  }
  P.useTween = useTween;

  /* ---------- icons ---------- */
  const EXTRA = { ArrowLeft:[['path',{d:'m12 19-7-7 7-7'}],['path',{d:'M19 12H5'}]], Search:[['circle',{cx:'11',cy:'11',r:'8'}],['path',{d:'m21 21-4.3-4.3'}]],
    CornerDownRight:[['polyline',{points:'15 10 20 15 15 20'}],['path',{d:'M4 4v7a4 4 0 0 0 4 4h12'}]], Menu:[['line',{x1:'4',x2:'20',y1:'6',y2:'6'}],['line',{x1:'4',x2:'20',y1:'12',y2:'12'}],['line',{x1:'4',x2:'20',y1:'18',y2:'18'}]],
    FileText:[['path',{d:'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'}],['path',{d:'M14 2v4a2 2 0 0 0 2 2h4'}],['path',{d:'M10 13H8'}],['path',{d:'M16 17H8'}]], Home:[['path',{d:'m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'}]], ChevronDown:[['path',{d:'m6 9 6 6 6-6'}]],
    Sun:[['circle',{cx:'12',cy:'12',r:'4'}],['path',{d:'M12 2v2'}],['path',{d:'M12 20v2'}],['path',{d:'m4.93 4.93 1.41 1.41'}],['path',{d:'m17.66 17.66 1.41 1.41'}],['path',{d:'M2 12h2'}],['path',{d:'M20 12h2'}],['path',{d:'m6.34 17.66-1.41 1.41'}],['path',{d:'m19.07 4.93-1.41 1.41'}]],
    Moon:[['path',{d:'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'}]], Square:[['rect',{x:'4',y:'4',width:'16',height:'16',rx:'1.5'}]],
    Restore:[['rect',{x:'8',y:'8',width:'13',height:'13',rx:'1.5'}],['path',{d:'M4 16V5a1 1 0 0 1 1-1h11'}]],
    Globe:[['circle',{cx:'12',cy:'12',r:'10'}],['path',{d:'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'}],['path',{d:'M2 12h20'}]],
    PanelLeftClose:[['rect',{x:'3',y:'3',width:'18',height:'18',rx:'2'}],['path',{d:'M9 3v18'}],['path',{d:'m16 15-3-3 3-3'}]],
    PanelLeftOpen:[['rect',{x:'3',y:'3',width:'18',height:'18',rx:'2'}],['path',{d:'M9 3v18'}],['path',{d:'m14 9 3 3-3 3'}]] };
  function Icon({ n, size=16, label, className, strokeWidth=1.75 }){
    const node = (window.SC_ICONS||{})[n] || EXTRA[n]; if(!node) return null;
    return h('svg', { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth, strokeLinecap:'round', strokeLinejoin:'round',
      className:cx('ic',className), 'aria-hidden': label? undefined : true, role: label? 'img' : undefined, 'aria-label': label }, label? h('title',null,label) : null, ...node.map(([t,a],i)=> h(t, Object.assign({key:i}, a))));
  }
  P.Icon = Icon;

  /* click-or-focus info popover (never hover-only) */
  function InfoTip({ children, label='About this measure', align }){
    const [o,setO] = useState(false); const ref = useRef();
    useEffect(()=>{ if(!o) return; const f = (e)=>{ if(ref.current && !ref.current.contains(e.target)) setO(false); }; const k = (e)=>{ if(e.key==='Escape') setO(false); };
      document.addEventListener('mousedown',f); document.addEventListener('keydown',k); return ()=>{ document.removeEventListener('mousedown',f); document.removeEventListener('keydown',k); }; },[o]);
    return html`<span class="px-tip" ref=${ref}><button type="button" class="px-tip-b" aria-label=${label} aria-expanded=${o} onClick=${(e)=>{ e.stopPropagation(); setO(!o); }}><${Icon} n="CircleHelp" size=${14}/></button>
      ${o && html`<span class=${cx('px-tip-p', align==='right'&&'r')} role="note">${children}</span>`}</span>`;
  }
  P.InfoTip = InfoTip;

  /* definition card for a KPI: formula, denominator, exclusions, time basis, owner, cadence, drill path */
  P.KpiDef = ({ id })=>{ const k = M.KPI[id]; return html`<${InfoTip} label=${'How '+k.name+' is calculated'}>
    <b>${k.name}</b><br/>${k.formula}${k.denom && k.denom!=='—' && html`<br/><i>Denominator:</i> ${k.denom}`}<br/><i>Excludes:</i> ${k.excl}<br/><i>Basis:</i> ${k.time==='Snapshot'? 'snapshot at '+M.C.snapLabel : 'activity in the selected period'} · <i>Owner:</i> ${k.owner} · <i>Refresh:</i> ${k.cadence}<br/><i>Drill path:</i> ${k.drill}<br/><span class="faint">Illustrative demo data.</span></${InfoTip}>`; };

  /* ---------- small pieces ---------- */
  P.RiskTag = ({ cat, score, small })=> cat? html`<span class=${cx('px-risk', 'r-'+cat.toLowerCase(), small&&'sm')}><i aria-hidden="true"/>${cat}${score!=null && html`<b>${score}</b>`}</span>` : null;
  const ST_TONE = { good:['Check','On target','good'], watch:['CircleDot','Watch','watch'], off:['TriangleAlert','Off target','off'], na:['Info','No data','na'] };
  P.StatusCue = ({ st })=>{ const s = ST_TONE[st]; return s? html`<span class=${'px-st '+s[2]}><${Icon} n=${s[0]} size=${12}/>${s[1]}</span>` : null; };
  P.Delta = ({ id, v, prior, unit })=>{
    if(v==null || prior==null) return html`<span class="px-d faint">${prior==null && v!=null? 'No comparable period' : ''}</span>`;
    const d = v - prior, k = M.KPI[id]; if(Math.abs(d)<0.05) return html`<span class="px-d">No change</span>`;
    const up = d>0, good = k.good==='up'? up : k.good==='down'? !up : null;
    const mag = ['spend','commit','overdue','exposure'].includes(id)? cr(Math.abs(d)) : FCT.n(Math.abs(d),1)+(id==='health'? ' pts' : ' pts');
    return html`<span class=${cx('px-d', good===true&&'up', good===false&&'down')}>${up?'▲':'▼'} ${mag}${unit? ' '+unit : ''}</span>`;
  };
  P.Card = ({ title, sub, right, children, className, id })=> html`<section class=${cx('px-card', className)} id=${id} aria-label=${typeof title==='string'? title : undefined}>
    ${(title||right) && html`<div class="px-ch"><div class="px-ch-t">${title && html`<h3 title=${typeof sub==='string'? sub : undefined}>${title}</h3>`}</div>${right}</div>`}${children}</section>`;
  P.Stat = ({ label, value, sub, tone, info })=> html`<div class=${cx('px-stat', tone)} title=${typeof sub==='string'? label+': '+sub : undefined}><div class="l">${P.KGLOSS && P.KGLOSS[label]? html`<span title=${P.fullText? P.fullText(P.KGLOSS[label]) : P.KGLOSS[label]} style=${{ borderBottom:'1px dotted currentColor', cursor:'help' }}>${label}</span>` : label}${info}</div><div class="v">${value}</div>${sub && html`<div class="s">${sub}</div>`}</div>`;
  P.Empty = ({ text, onReset })=> html`<div class="px-empty" role="status"><${Icon} n="Info" size=${18}/><div>${text || 'No records match these filters.'}${onReset && html` <button type="button" class="px-link" onClick=${onReset}>Reset filters</button>`}</div></div>`;
  P.Decide = ({ id, label='Decide' })=>{ const x = FCT.ex(id); if(!x) return null; return FCT.isOpen(x)? html`<button type="button" class="btn sm primary" onClick=${(e)=>{ e.stopPropagation(); FCT.openDrawer(id); }}>${label}</button>` : html`<span dangerouslySetInnerHTML=${{__html:FCT.ui.status(FCT.status(x))}}/>`; };
  /* compact dropdown for dimension choices (never wraps) */
  P.Pick = ({ value, options, onChange, label })=> html`<label class="px-pick"><span class="sr">${label}</span><select aria-label=${label} value=${value} onChange=${(e)=>onChange(e.target.value)}>${options.map(([v,t])=> html`<option key=${v} value=${v}>${label}: ${t}</option>`)}</select></label>`;
  P.Seg = ({ value, options, onChange, label })=> html`<div class="px-seg" role="radiogroup" aria-label=${label}>${options.map(([v,t])=> html`<button key=${v} type="button" role="radio" aria-checked=${value===v} class=${value===v? 'on' : ''} onClick=${()=>onChange(v)}>${t}</button>`)}</div>`;
  P.Illustrative = ()=> html`<span class="px-illus" title="All values are generated demo data">Illustrative data</span>`;

  /* ---------- charts ---------- */
  const axis = { tick:{ fontSize:11, fill:COL.ink3 }, axisLine:{ stroke:COL.line }, tickLine:false };
  P.axis = axis;
  function Tip({ active, payload, label, fmt }){
    if(!active || !payload || !payload.length) return null;
    return html`<div class="px-ctip"><div class="h">${label}</div>${payload.filter(p=>p.value!=null).map((p,i)=> html`<div key=${i} class="r"><i style=${{background:p.color||p.fill}}/><span>${p.name}</span><b>${fmt? fmt(p.value,p) : p.value}</b></div>`)}</div>`;
  }
  P.Tip = Tip;
  const mini = (cols, rows)=> html`<table class="px-mini"><thead><tr>${cols.map((c,i)=> html`<th key=${i} class=${i?'r':''}>${c}</th>`)}</tr></thead><tbody>${rows.map((r,i)=> html`<tr key=${i}>${r.map((v,j)=> html`<td key=${j} class=${j?'r num':''}>${v}</td>`)}</tr>`)}</tbody></table>`;
  P.mini = mini;
  function ChartBox({ height=200, label, table, legend, children }){
    const [t,setT] = useState(false);
    return html`<figure class="px-chart" aria-label=${label}>
      ${t && table? html`<div class="px-ctab">${table}</div>` : html`<div style=${{height}} role="img" aria-label=${label}><${R.ResponsiveContainer} width="100%" height="100%">${children}</${R.ResponsiveContainer}></div>`}
      ${legend && !t && html`<div class="px-clg">${legend.map((l,i)=> html`<span key=${i}><i class=${l[2]||''} style=${{ background:l[0], borderColor:l[0] }}/>${l[1]}</span>`)}</div>`}
      ${table && html`<button type="button" class="px-link sm" onClick=${()=>setT(!t)}>${t? 'Show chart' : 'Show as table'}</button>`}</figure>`;
  }
  P.ChartBox = ChartBox;
  /* six-month trend; null months stay gaps (N/A), never zero */
  P.Trend = ({ id, f, height=170, bars })=>{
    const rm = useRM(), k = M.KPI[id], s = M.series(id, f), per = M.period(f.period).months;
    const data = M.C.months.map((m,i)=> ({ m:m.slice(0,3), v: s[i]==null? null : +s[i].toFixed(id==='health'?0:2), on: per.includes(i) }));
    const fmt = (v)=> P.fmtKpi(id, v);
    const legend = (bars? [[COL.kc, 'Selected period'], [COL.fade, 'Other months']] : [[COL.kc, k.name+' (monthly)', 'ln']]).concat(!bars && k.target!=null? [[COL.brass, 'Target '+k.target+(k.unit==='%'?'%':''), 'dash']] : []);
    return html`<${ChartBox} height=${height} legend=${legend} label=${k.name+' by month, April to September 2026'} table=${mini(['Month',k.name], data.map(d=>[d.m, fmt(d.v)]))}>
      ${bars? html`<${R.BarChart} data=${data} margin=${{top:14,right:8,left:-6,bottom:0}}>
          <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${axis}/><${R.YAxis} ...${axis} width=${46} tickFormatter=${(v)=>'₹'+v}/>
          <${R.Tooltip} cursor=${{fill:'rgba(15,59,58,.05)'}} content=${h(Tip,{ fmt })}/>
          <${R.Bar} dataKey="v" name=${k.short} radius=${[3,3,0,0]} maxBarSize=${34} isAnimationActive=${!rm}>${data.map((d,i)=> h(R.Cell,{ key:i, fill: d.on? COL.kc : COL.fade }))}</${R.Bar}></${R.BarChart}>`
      : html`<${R.LineChart} data=${data} margin=${{top:14,right:14,left:-6,bottom:0}}>
          <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${axis}/><${R.YAxis} ...${axis} width=${40} domain=${['auto','auto']}/>
          ${k.target!=null && html`<${R.ReferenceLine} y=${k.target} stroke=${COL.brass} strokeDasharray="4 3" label=${{ value:'Target '+k.target+(k.unit==='%'?'%':''), position:'insideTopRight', fontSize:10.5, fill:COL.brass }}/>`}
          <${R.Tooltip} content=${h(Tip,{ fmt })}/>
          <${R.Line} type="monotone" dataKey="v" name=${k.short} stroke=${COL.kc} strokeWidth=${2} connectNulls=${false} isAnimationActive=${!rm}
            dot=${(p)=> h('circle', { key:p.index, cx:p.cx, cy:p.cy, r: data[p.index] && data[p.index].on? 4 : 2.5, fill: data[p.index] && data[p.index].on? COL.brass : COL.kc, stroke:COL.surface, strokeWidth:1.5 })}/></${R.LineChart}>`}
    </${ChartBox}>`;
  };
  /* donut with an explicit count / spend toggle (different denominators) */
  P.Donut = ({ rows, mode, sel, onSelect, onOpen, height=200, centre, unit='vendors' })=>{
    const rm = useRM(); const data = rows.filter(r=> r.val>0);
    return html`<div class="px-donut"><div style=${{height, width:'100%'}} role="img" aria-label=${'Risk mix by '+(mode==='spend'? 'share of value' : unit.replace(/s$/,'')+' count')}>
      <${R.ResponsiveContainer} width="100%" height="100%"><${R.PieChart}>
        <${R.Pie} data=${data} dataKey="val" nameKey="key" innerRadius="58%" outerRadius="90%" paddingAngle=${1.5} stroke=${COL.surface} strokeWidth=${2} isAnimationActive=${!rm}
          onClick=${(d)=> onSelect && onSelect(d.key)} onDoubleClick=${(d)=> onOpen && onOpen(d.key)} style=${{cursor:'pointer'}}>
          ${data.map((d,i)=> h(R.Cell, { key:i, fill:P.RISK[d.key], fillOpacity: sel && sel!==d.key? .35 : 1 }))}</${R.Pie}>
        <${R.Tooltip} content=${({active,payload})=> active && payload && payload.length? html`<div class="px-ctip"><div class="h">${payload[0].payload.key}</div><div class="r"><b>${mode==='spend'? cr(payload[0].payload.spend)+' · '+pct(payload[0].payload.share) : payload[0].payload.n+' '+unit+' · '+pct(payload[0].payload.share)}</b></div></div>` : null}/>
      </${R.PieChart}></${R.ResponsiveContainer}></div>${centre && html`<div class="px-donut-c">${centre}</div>`}</div>`;
  };

  /* accessible horizontal bar list. rows {key,label,val,sub,tone,extra}. click selects, double click / button drills */
  P.BarList = ({ rows, fmt=(v)=>cr(v), sel, onSelect, onOpen, max, label, valLabel, emptyText, limit=12, rate })=>{
    const [all,setAll] = useState(false);
    if(!rows.length) return html`<${P.Empty} text=${emptyText}/>`;
    const mx = max || Math.max(...rows.map(r=> Math.abs(r.val)||0)) || 1, shown = all? rows : rows.slice(0, limit);
    return html`<div class="px-bars" role="list" aria-label=${label}>
      ${shown.map(r=> html`<div key=${r.key} role="listitem" class=${cx('px-bar', sel===r.key && 'on')} onDoubleClick=${()=> onOpen && onOpen(r)}>
        <button type="button" class="px-bar-b" aria-pressed=${sel===r.key} onClick=${()=> onSelect && onSelect(r)} onKeyDown=${(e)=>{ if(e.key==='Enter' && e.shiftKey && onOpen){ e.preventDefault(); onOpen(r); } }}
          title=${r.label+': '+fmt(r.val, r)}>
          <span class="lab"><span class="t">${r.label}</span>${r.sub && html`<span class="s">${r.sub}</span>`}</span>
          <span class="trk"><i style=${{width: Math.max(1.5, Math.abs(r.val)/mx*100)+'%', background: r.tone || (sel===r.key? COL.brass : rate? COL.high : COL.kc)}}/></span>
          <span class="v num">${fmt(r.val, r)}</span></button>
        ${onOpen && html`<button type="button" class="px-drill" aria-label=${'Drill in to '+r.label} title="Drill in (or double-click)" onClick=${()=>onOpen(r)}><${Icon} n="ChevronRight" size=${15}/></button>`}</div>`)}
      ${rows.length>limit && html`<button type="button" class="px-link sm" onClick=${()=>setAll(!all)}>${all? 'Show top '+limit : 'Show all '+rows.length}</button>`}
    </div>`;
  };

  /* data table: click or Space selects, double click / Enter / button opens. cols {k,l,r,fmt,w} */
  P.Table = ({ cols, rows, rowKey, sel, onSelect, onOpen, caption, limit=25, emptyText, dense, rowClick })=>{
    const [n,setN] = useState(limit); const [sort,setSort] = useState(null);
    useEffect(()=> setN(limit), [rows]);
    if(!rows.length) return html`<${P.Empty} text=${emptyText}/>`;
    let rs = rows; if(sort){ const c = cols.find(c=>c.k===sort.k); const v = c.sv || ((r)=> r[c.k]); rs = rows.slice().sort((a,b)=>{ const x=v(a), y=v(b); return (x>y?1:x<y?-1:0)*(sort.d); }); }
    return html`<div class="px-tbl"><table class=${cx('t px-t', dense&&'dense')}><caption class="sr">${caption}</caption>
      <thead><tr>${cols.map(c=> html`<th key=${c.k} class=${cx(c.r&&'r', 'sortable', c.nx&&'nx')} style=${c.w? {width:c.w} : null} aria-sort=${sort&&sort.k===c.k? (sort.d>0?'ascending':'descending') : 'none'}>
        <button type="button" class="px-th" onClick=${()=> setSort(sort && sort.k===c.k? { k:c.k, d:-sort.d } : { k:c.k, d: c.r? -1 : 1 })}>${c.l}${sort && sort.k===c.k? (sort.d>0? ' ▲' : ' ▼') : ''}</button></th>`)}${onOpen && html`<th class="r px-th-go"><span class="sr">Open</span></th>`}</tr></thead>
      <tbody>${rs.slice(0,n).map(r=>{ const k = rowKey(r); return html`<tr key=${k} tabIndex="0" class=${cx(sel===k && 'on', (onSelect || rowClick) && 'sel', rowClick && 'go')} aria-selected=${sel===k}
          onClick=${()=> rowClick || !onSelect? onOpen && onOpen(r) : onSelect(r)} onDoubleClick=${()=> onOpen && onOpen(r)}
          onKeyDown=${(e)=>{ if(e.key==='Enter' && onOpen){ e.preventDefault(); onOpen(r); } else if(e.key===' ' && onSelect){ e.preventDefault(); onSelect(r); } else if(e.key==='ArrowDown'){ e.preventDefault(); e.currentTarget.nextElementSibling && e.currentTarget.nextElementSibling.focus(); } else if(e.key==='ArrowUp'){ e.preventDefault(); e.currentTarget.previousElementSibling && e.currentTarget.previousElementSibling.focus(); } }}>
        ${cols.map(c=> html`<td key=${c.k} class=${cx(c.r&&'r num', c.nx&&'nx')}>${c.fmt? c.fmt(r) : r[c.k]}</td>`)}
        ${onOpen && html`<td class="r"><button type="button" class="px-drill sm" tabIndex="-1" aria-label="Drill in" onClick=${(e)=>{ e.stopPropagation(); onOpen(r); }}><${Icon} n="ChevronRight" size=${14}/></button></td>`}</tr>`; })}</tbody></table>
      ${rs.length>n && html`<div class="px-more"><span class="faint">Showing ${n} of ${FCT.n(rs.length)}</span><button type="button" class="px-link sm" onClick=${()=>setN(n+50)}>Show 50 more</button></div>`}</div>`;
  };

  /* shadcn-style select: trigger (label, value, chevron) and a popover list with check marks; full keyboard support */
  P.Dropdown = ({ label, value, options, onChange, active })=>{
    const [o, setO] = useState(false), [hi, setHi] = useState(0), ref = useRef(), list = useRef();
    const cur = options.find(x=> x[0]===value) || options[0];
    useEffect(()=>{ if(!o) return; setHi(Math.max(0, options.findIndex(x=> x[0]===value)));
      const f = (e)=>{ if(ref.current && !ref.current.contains(e.target)) setO(false); }; document.addEventListener('mousedown', f); return ()=> document.removeEventListener('mousedown', f); }, [o]);
    useEffect(()=>{ if(o && list.current){ const el = list.current.children[hi]; el && el.scrollIntoView({ block:'nearest' }); } }, [hi, o]);
    const choose = (v)=>{ onChange(v); setO(false); ref.current && ref.current.querySelector('.px-dd-t').focus(); };
    const key = (e)=>{
      if(!o && (e.key==='ArrowDown' || e.key==='Enter' || e.key===' ')){ e.preventDefault(); setO(true); return; }
      if(!o) return;
      if(e.key==='Escape'){ e.preventDefault(); setO(false); }
      else if(e.key==='ArrowDown'){ e.preventDefault(); setHi(Math.min(options.length-1, hi+1)); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); setHi(Math.max(0, hi-1)); }
      else if(e.key==='Enter'){ e.preventDefault(); choose(options[hi][0]); } };
    return html`<div class=${cx('px-dd', active && 'on', o && 'open')} ref=${ref}>
      <button type="button" class="px-dd-t" aria-haspopup="listbox" aria-expanded=${o} aria-label=${label+': '+cur[1]} onClick=${()=> setO(!o)} onKeyDown=${key}>
        <span class="l">${label}</span><span class="v">${cur[1]}</span><${Icon} n="ChevronDown" size=${14}/></button>
      ${o && html`<ul class="px-dd-p" role="listbox" aria-label=${label} ref=${list} onKeyDown=${key}>${options.map(([v,t],i)=> html`<li key=${v} role="option" aria-selected=${v===value}>
        <button type="button" class=${cx(i===hi && 'hi')} onMouseEnter=${()=> setHi(i)} onClick=${()=> choose(v)}><span>${t}</span>${v===value && html`<${Icon} n="Check" size=${14}/>`}</button></li>`)}</ul>`}</div>`;
  };

  /* ---------- global filters (persist through drill-down; vendor selection never clears the others) ---------- */
  P.FilterBar = ({ f, setF, pending, compact, search })=>{
    const C = M.C, [q,setQ] = useState(''), [open,setOpen] = useState(false);
    if(search) return P.CaseSearchBar({ f, setF, pending, compact, search, sel:(k, opts, lab)=> html`<${P.Dropdown} label=${lab} value=${f[k]} options=${opts} active=${f[k]!==M.defaults[k]} onChange=${(v)=> setF(Object.assign({}, f, { [k]:v }))}/>` });
    const hits = q.length>=2? M.X.vendors.filter(v=> (v.name+' '+v.id).toLowerCase().includes(q.toLowerCase())).slice(0,8) : [];
    const sel = (k, opts, lab)=> html`<${P.Dropdown} label=${lab} value=${f[k]} options=${opts} active=${f[k]!==M.defaults[k]} onChange=${(v)=> setF(Object.assign({}, f, { [k]:v }))}/>`;
    const chips = M.active(f).map(k=> [k, k==='vendor'? 'Vendor: '+M.V[f.vendor].name : k==='bu'? 'BU: '+f.bu : k==='cat'? 'Category: '+M.CAT[f.cat].name : k==='risk'? 'Risk: '+f.risk : k==='pRisk'? 'Portfolio risk: '+f.pRisk.split(',').join(', ') : k==='pGeo'? 'Geography: '+f.pGeo : k==='pSeg'? 'Segment: '+M.segName(f.pSeg) : 'Region: '+f.region]);
    return html`<div class=${cx('px-filters', compact&&'compact')} role="search" aria-label="Global filters">
      ${sel('period', C.periods.filter(p=>!p.hidden).map(p=>[p.id,p.label]), 'Period')}
      ${sel('bu', [['All','All']].concat(C.bus.map(b=>[b.id, b.id+' '+b.name])), 'BU')}
      ${sel('region', [['All','All']].concat(C.regions.map(r=>[r,r])), 'Region')}
      ${sel('cat', [['All','All']].concat(C.cats.map(c=>[c.id,c.name])), 'Category')}
      ${sel('risk', [['All','All']].concat(C.risk.cats.map(c=>[c.id,c.id])), 'Risk')}
      <div class=${cx('px-f px-vs', f.vendor && 'on')}><span class=${compact? 'sr' : ''}>Vendor</span><div class="px-vs-w"><${Icon} n="Search" size=${14}/>
        <input type="search" role="combobox" aria-expanded=${open && hits.length>0} aria-controls="px-vs-l" aria-autocomplete="list" aria-label="Vendor search" placeholder=${f.vendor? M.V[f.vendor].name : 'Search vendor'} value=${q}
          onChange=${(e)=>{ setQ(e.target.value); setOpen(true); }} onKeyDown=${(e)=>{ if(e.key==='Enter' && hits[0]){ setF(Object.assign({}, f, { vendor:hits[0].id })); setQ(''); setOpen(false); } if(e.key==='Escape') setOpen(false); }}/>
        ${open && hits.length>0 && html`<ul class="px-vs-l" id="px-vs-l" role="listbox">${hits.map(v=> html`<li key=${v.id} role="option"><button type="button" onMouseDown=${(e)=>{ e.preventDefault(); setF(Object.assign({}, f, { vendor:v.id })); setQ(''); setOpen(false); }}>${v.name}<small>${v.id} · ${v.status}</small></button></li>`)}</ul>`}</div></div>
      <div class="px-chips" aria-live="polite">${pending && html`<span class="px-busy" role="status"><i/>Updating</span>`}
        ${chips.map(([k,t])=> html`<button key=${k} type="button" class="px-chip" aria-label=${'Clear '+t} onClick=${()=> setF(Object.assign({}, f, { [k]: k==='vendor'? null : 'All' }))}>${t}<${Icon} n="X" size=${12}/></button>`)}
        ${chips.length>0 && html`<button type="button" class="px-reset" onClick=${()=> setF(Object.assign({}, M.defaults, { period:f.period }))}><${Icon} n="RotateCcw" size=${13}/>Reset filters</button>`}</div>
    </div>`;
  };

  /* filter bar with a case search in place of the vendor search (Compliance screens) */
  P.CaseSearchBar = ({ f, setF, pending, compact, search, sel })=> html`<${P.CaseSearchBarC} f=${f} setF=${setF} pending=${pending} compact=${compact} search=${search} sel=${sel}/>`;
  P.CaseSearchBarC = ({ f, setF, pending, compact, search, sel })=>{
    const C = M.C, [q,setQ] = useState(''), [open,setOpen] = useState(false), hits = q.trim().length>=2? search.find(q.trim()).slice(0,8) : [];
    const pick = (h)=>{ setQ(''); setOpen(false); h.go(); };
    return html`<div class=${cx('px-filters', compact&&'compact')} role="search" aria-label="Global filters">
      ${sel('period', C.periods.filter(p=>!p.hidden).map(p=>[p.id,p.label]), 'Period')}
      ${sel('bu', [['All','All']].concat(C.bus.map(b=>[b.id, b.id+' '+b.name])), 'Entity')}
      <div class="px-f px-vs"><span class="sr">Case search</span><div class="px-vs-w"><${Icon} n="Search" size=${14}/>
        <input type="search" role="combobox" style=${{width:'250px', maxWidth:'250px'}} aria-expanded=${open && hits.length>0} aria-controls="px-cs-l" aria-autocomplete="list" aria-label="Search cases" placeholder=${search.placeholder} value=${q}
          onChange=${(e)=>{ setQ(e.target.value); setOpen(true); }} onBlur=${()=> setTimeout(()=> setOpen(false), 150)} onKeyDown=${(e)=>{ if(e.key==='Enter' && hits[0]) pick(hits[0]); if(e.key==='Escape') setOpen(false); }}/>
        ${open && q.trim().length>=2 && html`<ul class="px-vs-l" id="px-cs-l" role="listbox" style=${{left:'auto', right:0, minWidth:'420px', maxHeight:'420px', overflowY:'auto'}}>${hits.length? hits.map(h=> html`<li key=${h.key} role="option"><button type="button" onMouseDown=${(e)=>{ e.preventDefault(); pick(h); }}><span><b>${h.key}</b> · ${h.label}</span><small>${h.sub}</small></button></li>`)
          : html`<li class="faint" style=${{padding:'6px 8px', fontSize:'11.5px'}}>No case matches “${q.trim()}”. Try a case ID, vendor, PO, contract or entity.</li>`}</ul>`}</div></div>
      <div class="px-chips" aria-live="polite">${pending && html`<span class="px-busy" role="status"><i/>Updating</span>`}</div>
    </div>`;
  };

  /* ---------- breadcrumb: actual navigation state; every ancestor restores its context ---------- */
  const NODE = P.NODE = { root:['Gauge','KPI'], group:['Filter','Breakdown'], vendor:['Users','Vendor'], profile:['Building2','Vendor Profile'], entity:['Building2','Entity'], doc:['FileText','Document'], case:['Crosshair','Case'] };
  P.Crumbs = ({ nav, dispatch, rootLabel })=>{
    const n = nav.path.length, ref = useRef();
    useEffect(()=>{ const el = ref.current; if(el) el.scrollTo({ left:el.scrollWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches? 'auto' : 'smooth' }); }, [n, nav.path[n-1] && nav.path[n-1].label]);
    return html`<nav class="px-trail" aria-label="Breadcrumb">
      <button type="button" class="px-back" disabled=${n<2} onClick=${()=>dispatch({t:'back'})} aria-label="Back one level" title="Back one level"><${Icon} n="ArrowLeft" size=${15}/></button>
      <ol ref=${ref}>${nav.path.map((node,i)=>{ const cur = i===n-1, [ic, kind] = NODE[node.t] || ['CircleDot','Step'];
        const icn = node.t==='root' && P.KICON[nav.kpi]? P.KICON[nav.kpi] : ic;
        const k = node.t==='group'? (M.dimName[node.dim] || kind) : node.t==='root' && nav.kpi==='vendors'? 'Portfolio' : node.t==='root' && nav.kpi==='process'? 'Chain' : kind;
        const v = node.t==='group'? node.label.replace(/^[^:]+: /,'') : node.label;
        const body = html`<${Icon} n=${icn} size=${14}/><span class="tx"><span class="k">${k}</span><span class="v">${v}</span></span>`;
        return html`<li key=${i} class=${cur? 'cur' : ''}>${i>0 && html`<span class="sep" aria-hidden="true"><${Icon} n="ChevronRight" size=${14}/></span>`}
          ${cur? html`<span class="step" aria-current="page" title=${node.label}>${body}</span>` : html`<button type="button" class="step" title=${'Back to '+node.label} onClick=${()=>dispatch({t:'crumb', i})}>${body}</button>`}</li>`; })}</ol>
      ${n>1 && html`<button type="button" class="px-home" title=${rootLabel || 'Return to KPI'} aria-label=${rootLabel || 'Return to KPI'} onClick=${()=>dispatch({t:'home'})}><${Icon} n="Home" size=${15}/></button>`}</nav>`;
  };
  /* global breadcrumb: the screen's overview first (KPI sheet, Vendor portfolio, Process chain), then every level opened.
     Arrow-shaped segments; the current level is filled with the KPI's accent. from = index of the first nav node shown. */
  P.GlobalCrumb = ({ root, nav, dispatch, from=0, show })=>{
    const items = [Object.assign({ i:-1 }, root)];
    if(show) nav.path.slice(from).forEach((node, j)=>{ const i = j + from, [ic, kind] = NODE[node.t] || ['CircleDot','Step'];
      items.push({ i, kind: node.t==='group'? (M.dimName[node.dim] || kind) : node.t==='root'? 'KPI' : kind,
        label: node.t==='group'? node.label.replace(/^[^:]+: /,'') : node.label, icon: node.t==='root' && P.KICON[nav.kpi]? P.KICON[nav.kpi] : ic }); });
    const n = items.length, ref = useRef();
    useEffect(()=>{ const el = ref.current; if(el) el.scrollTo({ left:el.scrollWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches? 'auto' : 'smooth' }); }, [n, items[n-1].label]);
    const go = (it)=> it.i<0? root.go() : dispatch({ t:'crumb', i:it.i });
    const back = ()=> n<=1? null : go(items[n-2]);
    return html`<nav class="px-gc" aria-label="Breadcrumb">
      <button type="button" class="px-gc-back" disabled=${n<2} onClick=${back} aria-label="Back one level" title="Back"><${Icon} n="ArrowLeft" size=${17}/></button>
      <ol ref=${ref}>${items.map((it,k)=>{ const cur = k===n-1;
        const body = html`<span class="px-gc-ic"><${Icon} n=${it.icon} size=${17} strokeWidth=${1.7}/></span><span class="px-gc-tx"><small>${it.kind}</small><b>${it.label}</b></span>`;
        return html`<li key=${k} class=${cx(cur && 'cur', k===0 && 'first')}>${cur? html`<span class="px-gc-s" aria-current="page" title=${it.label}>${body}</span>`
          : html`<button type="button" class="px-gc-s" title=${'Back to '+it.label} onClick=${()=> go(it)}>${body}</button>`}</li>`; })}</ol></nav>`;
  };
  /* panel body: slides in from the right when drilling deeper, from the left when going back */
  P.PanelBody = ({ depth, sig, reset, children })=>{
    const prev = useRef(depth), dir = depth >= prev.current? 1 : -1, rm = useRM();
    useEffect(()=>{ prev.current = depth; });
    return html`<${motion.div} key=${sig} className="px-pb" initial=${rm? false : { opacity:0, x:22*dir }} animate=${{ opacity:1, x:0 }} transition=${{ duration:.26, ease:[.2,.7,.2,1] }}>
      <${Boundary} reset=${reset}>${children}</${Boundary}></${motion.div}>`;
  };
  /* current-vendor marker: name, risk category and the way into the full Vendor Profile */
  P.VendorMarker = ({ id, onOpen, onClear, isProfile })=>{
    if(!id) return null; const v = M.V[id], r = M.risk(id);
    return html`<div class="px-vmark" role="status" aria-label=${'Current vendor '+v.name}>
      <span class="av" aria-hidden="true">${v.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</span>
      <span class="nm"><b>${v.name}</b><small>${v.id} · ${M.CAT[v.cat].name}</small></span><${P.RiskTag} cat=${r.approved} score=${r.score} small=${true}/>
      ${!isProfile && onOpen && html`<button type="button" class="btn sm" onClick=${onOpen}>Open Vendor Profile</button>`}
      ${onClear && html`<button type="button" class="px-link sm" onClick=${onClear}>Clear vendor</button>`}</div>`;
  };

  /* ---------- P2P process flow: Requisition → Approval → PO → Receipt → Invoice → Payment ---------- */
  P.Flow = ({ S, sel, onSelect, onOpen, compact })=>{
    const mx = Math.max(...M.C.stages.map(s=> S[s.id].val)) || 1;
    return html`<ol class=${cx('px-flow', compact&&'compact')} aria-label="P2P process chain">
      ${M.C.stages.map((s,i)=>{ const x = S[s.id], top = x.list[0];
        return html`<li key=${s.id} class=${cx(sel===s.id && 'on')}>
          <button type="button" class="px-stage" aria-pressed=${sel===s.id} onClick=${()=>onSelect && onSelect(s.id)} onDoubleClick=${()=>onOpen && onOpen(s.id)}>
            <span class="sh"><${Icon} n=${s.icon} size=${15}/><b>${s.name}</b></span>
            <span class="sv num">${FCT.n(x.n)}<small> records with issues</small></span>
            <span class="sb" aria-hidden="true"><i style=${{width: Math.max(2, x.val/mx*100)+'%', background:P.heatColor(x.val, mx)}}/></span>
            <span class="sx">${amt(x.val)} affected${!compact && x.ct!=null? html` · <span title=${x.ctName}>${M.dur(x.ct)} median</span>` : ''}</span>
            ${!compact && html`<span class="st">${top? M.issue(top.code).name : 'No issues'}</span>`}</button>
          ${onOpen && html`<button type="button" class="px-drill" aria-label=${'Drill in to '+s.name} onClick=${()=>onOpen(s.id)}><${Icon} n="ChevronRight" size=${14}/></button>`}
          ${i<5 && html`<span class="ar" aria-hidden="true">→</span>`}</li>`; })}</ol>`;
  };
  /* vendor × stage heat grid */
  P.Heat = ({ rows, sel, onCell, onVendor, rowLabel='Vendor' })=>{
    if(!rows.length) return html`<${P.Empty}/>`;
    const mx = Math.max(...rows.flatMap(r=> r.cells.map(c=>c.val))) || 1;
    return html`<div class="px-heat" role="table" aria-label=${'Issue value by '+rowLabel.toLowerCase()+' and process stage'}>
      <div class="hr hh" role="row"><span role="columnheader">${rowLabel}</span>${M.C.stages.map(s=> html`<span key=${s.id} role="columnheader" title=${s.name}>${s.short}</span>`)}<span role="columnheader" class="r">Total</span></div>
      ${rows.map(r=> html`<div key=${r.v} class="hr" role="row"><span role="rowheader"><button type="button" class="px-link" onClick=${()=>onVendor && onVendor(r.v)}>${r.name}</button></span>
        ${r.cells.map(c=> html`<span key=${c.stage} role="cell"><button type="button" class=${cx('cell', sel && sel.v===r.v && sel.stage===c.stage && 'on')} disabled=${!c.n}
          style=${{ background:P.heatColor(c.val, mx), color: c.val/mx > .3? '#fff' : COL.ink }} aria-label=${r.name+', '+M.stage(c.stage).name+': '+c.n+' records, '+amt(c.val)}
          title=${c.n+' records · '+amt(c.val)} onClick=${()=> onCell && onCell(r.v, c.stage)}>${c.n? FCT.n(c.n) : ''}</button></span>`)}
        <span role="cell" class="r num">${amt(r.total)}</span></div>`)}
      <div class="px-heat-k" aria-hidden="true"><span>Fewer</span>${P.ramp.map((c,i)=> html`<i key=${i} style=${{background:c}}/>`)}<span>More value affected</span></div></div>`;
  };

  /* ---------- document chain timeline ---------- */
  P.Chain = ({ ch })=>{
    if(!ch) return html`<${P.Empty} text="This record is not available in the demo ledger."/>`;
    return html`<ol class="px-chain" aria-label="Document chain">${ch.steps.map((s,i)=> html`<li key=${i} class=${'s-'+s.state}>
      <span class="dot" aria-hidden="true"><${Icon} n=${s.state==='issue'? 'TriangleAlert' : s.state==='ok'? 'Check' : s.state==='wait'? 'Clock' : 'CircleDot'} size=${12}/></span>
      <div><div class="hd"><b>${s.label}</b><span class="faint">${M.stage(s.stage).name}</span><span class="when num">${s.at!=null? M.dt(s.at) : s.state==='na'? 'N/A' : '—'}</span></div>
        <div class="dt">${s.detail}</div>${s.issues.map(c=> html`<span key=${c} class="px-iss">${M.issue(c).name}</span>`)}</div></li>`)}</ol>`;
  };

  /* ---------- honest error state ---------- */
  class Boundary extends React.Component {
    constructor(p){ super(p); this.state = { err:null }; }
    static getDerivedStateFromError(err){ return { err }; }
    componentDidCatch(err){ console.error('P2P view error', err); }
    componentDidUpdate(prev){ if(prev.reset !== this.props.reset && this.state.err) this.setState({ err:null }); }
    render(){ return this.state.err? html`<div class="px-error" role="alert"><${Icon} n="TriangleAlert" size=${18}/><div><b>This view could not be calculated.</b><br/>No values are shown rather than partial ones. <button type="button" class="px-link" onClick=${()=>this.setState({err:null})}>Try again</button></div></div>` : this.props.children; }
  }
  P.Boundary = Boundary;

  /* ---------- session convenience (per-viewer only; works without storage) ---------- */
  P.SKEY = 'fct-p2p-';
  P.load = (k, def)=>{ try{ const v = sessionStorage.getItem(P.SKEY+k); return v? JSON.parse(v) : def; } catch(e){ return def; } };
  P.store = (k, v)=>{ try{ sessionStorage.setItem(P.SKEY+k, JSON.stringify(v)); } catch(e){} };
  /* navigation state mirrored in the URL hash so links and reloads restore the view */
  P.useNav = (defKpi, valid, rootLabel)=>{
    const fresh = ()=> M.nav.init(defKpi, rootLabel? [{ t:'root', label:rootLabel }] : null);
    const init = ()=>{ const s = M.nav.decode(location.hash.slice(1)); return s && (!valid || valid.includes(s.kpi))? s : fresh(); };
    const [nav, dispatch] = React.useReducer(M.nav.reduce, null, init);
    useEffect(()=>{ try{ history.replaceState(null, '', location.pathname + location.search + '#' + M.nav.encode(nav)); } catch(e){} }, [nav]);
    return [nav, dispatch];
  };
  P.useFilters = (key)=>{
    const [f, setF0] = useState(()=> Object.assign({}, M.defaults, P.load(key||'f', {})));
    const [pending, start] = React.useTransition();
    const setF = (n)=> start(()=>{ if(n.vendor && !M.V[n.vendor]) n.vendor = null; setF0(n); P.store(key||'f', n); });
    return [f, setF, pending];
  };

  /* vendor terminology in all visible P2P copy, including text that comes from other towers' records */
  P.vt = (s)=> String(s==null? '' : s).replace(/\b(S|s)uppliers\b/g, (m,c)=> c==='S'? 'Vendors' : 'vendors').replace(/\b(S|s)upplier\b/g, (m,c)=> c==='S'? 'Vendor' : 'vendor');
  /* the three P2P screens */
  /* one command bar replaces the shell's top bar and close clock on P2P screens: screens, filters, data label, user menu */
  P.ScreenTabs = ({ on, right })=>{
    useEffect(()=>{ document.body.classList.add('px-full'); return ()=> document.body.classList.remove('px-full'); }, []);
    /* a tower may set P.TOWER = { code, name, base, tabs } to reuse this command bar */
    const T = P.TOWER || { code:'P2P', name:'Procure to pay', base:'screens/p2p/', tabs:[['vendors','Vendor profiles','Users'],['desk','Scorecard','Gauge'],['process','Process chain','Layers']] }, tabs = T.tabs;
    return html`<header class="px-cmd">
      <button type="button" class="px-railbtn" aria-label="Collapse or expand the tower navigation" title="Collapse or expand navigation" onClick=${()=> FCT.railMin(!document.body.classList.contains('rail-min'))}><${Icon} n="Menu" size=${16}/></button>
      <span class="px-brandmark"><b>${T.code}</b><small>${T.name}</small></span>
      <nav class="px-tabs" aria-label=${T.code+' screens'}>${tabs.map(([k,t,ic])=> html`<a key=${k} class=${on===k? 'on' : ''} aria-current=${on===k? 'page' : undefined} href=${FCT.href(T.base+k+'.html')}>
        ${on===k && html`<span class="px-tab-bg" aria-hidden="true"/>`}<${Icon} n=${ic} size=${15}/><span>${t}</span></a>`)}</nav>
      <div class="px-cmd-r">${right}<${P.ThemeToggle}/><${P.UserMenu}/></div></header>`; };
  /* light / dark theme for the P2P workspace; remembered per viewer */
  const themeNow = ()=>{ try{ return localStorage.getItem('fct-p2p-theme') || 'dark'; }catch(e){ return 'dark'; } };
  P.applyTheme = (t)=>{ document.body.classList.toggle('theme-light', t==='light'); try{ localStorage.setItem('fct-p2p-theme', t); }catch(e){} };
  P.ThemeToggle = ()=>{ const [t, setT] = useState(themeNow());
    useEffect(()=>{ P.applyTheme(t); }, [t]);
    return html`<button type="button" class="px-theme" aria-label=${t==='dark'? 'Switch to light theme' : 'Switch to dark theme'} title=${t==='dark'? 'Light theme' : 'Dark theme'} onClick=${()=> setT(t==='dark'? 'light' : 'dark')}><${Icon} n=${t==='dark'? 'Sun' : 'Moon'} size=${16}/></button>`; };
  /* detail window: a classic title bar with maximise and close; Esc or the backdrop also closes it */
  P.Window = ({ open, onClose, title, icon, theme, sub, children })=>{
    const [max, setMax] = useState(false), ref = useRef(), rm = useRM();
    useEffect(()=>{ if(!open) return;
      const k = (e)=>{ if(e.key==='Escape' && !document.querySelector('.drawer') && !document.querySelector('.px-dd.open') && !document.querySelector('.modal-wrap')){ e.preventDefault(); onClose(); } };
      document.addEventListener('keydown', k); const t = setTimeout(()=>{ const x = ref.current && ref.current.querySelector('.px-win-x'); x && x.focus(); }, 40);
      return ()=>{ document.removeEventListener('keydown', k); clearTimeout(t); }; }, [open]);
    return html`<${AnimatePresence}>${open && html`<${Fragment} key="win">
      <${motion.div} key="scrim" className="px-scrim" initial=${{ opacity:0 }} animate=${{ opacity:1 }} exit=${{ opacity:0 }} transition=${{ duration: rm? 0 : .18 }} onClick=${onClose}/>
      <${motion.div} key="window" ref=${ref} className=${cx('px-win', theme, max && 'max')} role="dialog" aria-modal="true" aria-label=${title}
        initial=${rm? false : { opacity:0, scale:.965, y:14 }} animate=${{ opacity:1, scale:1, y:0 }} exit=${rm? { opacity:0 } : { opacity:0, scale:.975, y:8 }} transition=${{ duration:.22, ease:[.2,.7,.2,1] }}>
        <div class="px-win-bar" onDoubleClick=${()=> setMax(!max)}>
          ${icon && html`<span class="px-win-i"><${Icon} n=${icon} size=${15} strokeWidth=${1.8}/></span>`}<span class="t">${title}</span>${sub && html`<span class="s">${sub}</span>`}<span class="sp"/>
          <button type="button" class="px-win-b" aria-label=${max? 'Restore window' : 'Maximise window'} title=${max? 'Restore' : 'Maximise'} onClick=${()=> setMax(!max)}><${Icon} n=${max? 'Restore' : 'Square'} size=${13} strokeWidth=${2}/></button>
          <button type="button" class="px-win-b px-win-x" aria-label="Close" title="Close (Esc)" onClick=${onClose}><${Icon} n="X" size=${15} strokeWidth=${2}/></button></div>
        <div class="px-win-c">${children}</div></${motion.div}></${Fragment}>`}</${AnimatePresence}>`;
  };
  P.UserMenu = ()=>{ const [o,setO] = useState(false), ref = useRef(), D = window.FCT_DATA;
    useEffect(()=>{ if(!o) return; const f = (e)=>{ if(ref.current && !ref.current.contains(e.target)) setO(false); }; document.addEventListener('mousedown', f); return ()=> document.removeEventListener('mousedown', f); }, [o]);
    return html`<div class="px-um" ref=${ref}><button type="button" class="px-um-b" aria-expanded=${o} aria-label="User menu" onClick=${()=>setO(!o)}><span class="av">${D.persona.initials}</span></button>
      ${o && html`<div class="px-um-p" role="menu"><div class="who"><b>${D.persona.name}</b><small>${D.persona.title}</small></div>
        <a role="menuitem" href=${FCT.href('screens/persona.html')}>Switch persona</a>
        <button type="button" role="menuitem" onClick=${()=>{ if(confirm('Reset all demo decisions and return to the 09:10 starting position?')) FCT.reset(); }}>Reset demo data</button>
        <button type="button" role="menuitem" onClick=${()=> FCT.logout()}>Sign out</button></div>`}</div>`; };
  /* fit a workspace to the viewport below it, so the KPI sheet never needs its own scroll on desktop */
  P.useFit = ()=>{ const ref = useRef();
    useEffect(()=>{ const fit = ()=>{ const el = ref.current; if(!el) return; if(innerWidth<=980 || document.body.classList.contains('px-full')){ el.style.height = ''; return; } const top = el.getBoundingClientRect().top + scrollY; el.style.height = Math.max(600, innerHeight - top - 14) + 'px'; };
      fit(); addEventListener('resize', fit); const t = setTimeout(fit, 300); return ()=>{ removeEventListener('resize', fit); clearTimeout(t); }; }, []);
    return ref; };
  /* guard KPI switches when an investigation note is unsaved */
  P.guard = (dispatch)=> (a)=>{ if((a.t==='kpi'||a.t==='kpiJump') && P.dirty && !confirm('Discard the unsaved investigation note?')) return; if(a.t==='kpi'||a.t==='kpiJump') P.dirty = false; dispatch(a); };

  /* ---------- mount inside the FCT shell; re-render on every drawer decision ---------- */
  P._v = 0;
  P.mount = (App)=>{
    let root = null, box = null;
    FCT.page({ render(el){
      if(!box){ box = document.createElement('div'); box.className = 'px-root'; root = ReactDOM.createRoot(box); }
      el.appendChild(box); P._v++; M.clearCache();
      root.render(h(MotionConfig, { reducedMotion:'user' }, h(Boundary, { reset:P._v }, h(App, { v:P._v }))));
    }});
  };
})();
