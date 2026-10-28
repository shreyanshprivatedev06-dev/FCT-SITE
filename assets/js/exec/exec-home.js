/* FCT demo — Executive view (screens/home/desk.html): every tower on one screen, for senior finance.
   Same command bar, filter ribbon, cards and windows as the towers (P2P UI kit). One page, no scroll:
     enterprise and tower scores · where the exceptions are (map and globe) · what needs a decision now.
   Every click opens a window; anything inside a window opens the tower view it belongs to (scorecard component, profiles, process chain)
   or the shared decision drawer. Scores come live from the tower models (P2PM, O2CM, R2RM, SCM); Compliance from its readiness model. */
(function(){
  const P = window.P2P, FCT = window.FCT, D = window.FCT_DATA; if(!P || !FCT || !D) return;
  const { html, h, R, COL, Icon, cx } = P, { useState, useEffect, useRef, useMemo, Fragment } = React;
  const amt = (v)=> FCT.amt(v), n = (v,d)=> FCT.n(v,d||0), pct = (v,d)=> v==null? '—' : FCT.pct(v, d==null? 1 : d);

  /* ---------- towers and their models ---------- */
  const TW = [
    { id:'P2P', name:'Procure to pay', key:'p2p', M:()=> window.P2PM, kpi:['spend','Spend'], prof:['vendors','Vendor profiles'], icon:'Package', noun:'vendors' },
    { id:'O2C', name:'Order to cash', key:'o2c', M:()=> window.O2CM, kpi:['ar','Open receivables'], prof:['customers','Customer profiles'], icon:'Handshake', noun:'customers' },
    { id:'R2R', name:'Record to report', key:'r2r', M:()=> window.R2RM, kpi:['unrec','Unreconciled'], prof:['entities','Entity profiles'], icon:'Landmark', noun:'entities' },
    { id:'SC', name:'Supply chain', key:'sc', M:()=> window.SCM, kpi:['inv','Inventory'], prof:['materials','Material profiles'], icon:'Factory', noun:'materials' },
    { id:'CMP', name:'Compliance', key:'cmp', M:()=> null, prof:['entities','Entity profiles'], icon:'ShieldCheck', noun:'entities' } ];
  const TWB = {}; TW.forEach(t=> TWB[t.id] = t);
  const TCOL = ['#E0B25A','#4FB3A3','#7FA7D9','#C98C6B','#B58BD9'];
  const SEV = [['critical','Critical'],['high','High'],['medium','Medium'],['low','Low']], SEVC = { critical:'#ef6f6a', high:'#f2a45f', medium:'#e3b13a', low:'#7dc7b7' };
  const PERIODS = ['Apr-26','May-26','Jun-26','Jul-26','Aug-26','Sep-26'], SNAP = D.meta.period;
  const REGIONS = ['North India','West India','South India','North America','Europe'];
  const ENT = {}; (D.entities||[]).forEach(e=> ENT[e.id] = e);
  const href = (p)=> FCT.href(p);
  const userName = (id)=> ((D.users||[]).find(u=> u.id===id)||{}).name || id || '—';
  const exVal = (x)=> x.impact && typeof x.impact.valueCr==='number'? x.impact.valueCr : 0;
  const sevRank = { critical:4, high:3, medium:2, low:1 };
  const sortEx = (l)=> l.slice().sort((a,b)=> (sevRank[b.severity]||0)-(sevRank[a.severity]||0) || exVal(b)-exVal(a));
  const exLink = (x)=> href('screens/'+(TWB[x.tower]? (x.tower==='CMP'? 'cmp/executive' : TWB[x.tower].key+'/desk') : 'home/desk')+'.html')+'?x='+encodeURIComponent(x.id);
  const deskLink = (t, kpi, comp)=>{ const T = TWB[t], M = T.M(); if(!M || !M.nav) return href('screens/'+T.key+'/desk.html');
    let s = M.nav.init(kpi||'health'); if(comp) s = M.nav.reduce(s, { t:'drill', node:{ t:'group', dim:'component', key:comp, label:(M.dimLabel? M.dimLabel('component', comp) : comp) } });
    return href('screens/'+T.key+'/desk.html')+'#'+M.nav.encode(s); };
  const procLink = (t)=> href(t==='CMP'? 'screens/cmp/controls.html' : 'screens/'+TWB[t].key+'/process.html');
  const profLink = (t)=> href('screens/'+TWB[t].key+'/'+TWB[t].prof[0]+'.html');
  const go = (u)=> { location.href = u; };

  /* ---------- the filter ribbon: one state for the whole page ---------- */
  const F0 = { period:SNAP, entity:'All', region:'All', tower:'All', risk:'All' };
  /* a browser refresh starts from the unfiltered view, so a stale saved filter can never hide data */
  try{ const nv = performance.getEntriesByType('navigation')[0]; if(nv && nv.type==='reload') sessionStorage.removeItem('fct-exec-f'); }catch(e){}
  const loadF = ()=>{ try{ return Object.assign({}, F0, JSON.parse(sessionStorage.getItem('fct-exec-f')||'{}')); }catch(e){ return Object.assign({}, F0); } };
  const modelF = (T, F)=>{ const M = T.M(), f = Object.assign({}, M.defaults);
    if(M.C.periods.some(p=> p.id===F.period)) f.period = F.period;
    if(F.entity!=='All'){ if('bu' in f) f.bu = F.entity; else if('entity' in f) f.entity = F.entity; }
    if(F.region!=='All' && 'region' in f) f.region = F.region;
    return f; };

  /* ---------- scores ---------- */
  const CMPR = D.cmp && D.cmp.readiness || [];
  const health = (T, F)=>{
    if(T.id==='CMP'){ const sc = Math.round(CMPR.reduce((s,r)=> s+r[2], 0)), ser = (D.cmp.criTrend||{}).ready || [];
      return { score:sc, band:sc>=75? { label:'Healthy', cls:'pos' } : sc>=55? { label:'Watch', cls:'med' } : { label:'At risk', cls:'neg' }, series:ser.map(v=> v),
        comps:CMPR.map(r=> ({ kpi:r[0], name:r[0], w:r[1], v:r[2]/r[1]*100, sc:r[2]/r[1]*100, contrib:r[2], lost:r[1]-r[2], unit:'%' })), note:'Compliance readiness: five weighted components out of 100', kpis:[
          ['Audit readiness', n(FCT.v('audit.readiness'))+' / 90'], ['Failing controls', n(FCT.v('controls.failing'))], ['Overdue findings', n(FCT.v('findings.overdue'))], ['Open access conflicts', n(FCT.v('sod.open'))] ] }; }
    const M = T.M(); if(!M) return { score:null, comps:[], series:[] };
    try{
      const f = modelF(T, F), hl = M.health(f), ser = (M.series('health', f)||[]).map(x=> x==null? null : (x.v!=null? x.v : x));
      const k = M.kpi(T.kpi[0], f), ex = M.exposure? M.exposure(M.cases(f)) : null;
      return { score:hl.score, band:hl.band, series:ser, f, comps:(hl.comps||[]).map(c=> Object.assign({}, c, { name:(M.KPI[c.kpi]||{}).name || c.name })), cov:hl.coverage,
        head:[T.kpi[1], k && k.v!=null? amt(k.v) : '—'], expo:ex? ex.potential : null,
        kpis:[[T.kpi[1], k && k.v!=null? amt(k.v) : '—'], ex? ['Potential exposure', amt(ex.potential)] : null, ex && ex.control!=null? ['Control value at stake', amt(ex.control)] : null, ['Data coverage', hl.coverage!=null? pct(hl.coverage*100,0) : '—']].filter(Boolean) };
    }catch(e){ console.error('Executive view: '+T.id+' health failed', e); return { score:null, comps:[], series:[] }; } };
  const bandTone = (b)=> !b? 'na' : b.cls==='pos'? 'g' : b.cls==='med'? 'a' : 'r';
  const scoreCol = (sc)=> sc==null? 'var(--px-ink3)' : sc>=75? 'var(--px-pos)' : sc>=55? '#E0B25A' : 'var(--px-crit)';

  /* ---------- exceptions under the ribbon ---------- */
  const exOf = (F)=> FCT.openFor('ALL').filter(x=>{ const e = ENT[x.entity];
    return (F.tower==='All' || x.tower===F.tower || (x.also||[]).includes(F.tower)) && (F.entity==='All' || x.entity===F.entity)
      && (F.region==='All' || (e && e.region===F.region)) && (F.risk==='All' || x.severity===F.risk); });

  /* ---------- small pieces ---------- */
  const Spark = ({ data, color, w=96, ht=28 })=>{ const pts = data.map((v,i)=> [i,v]).filter(p=> p[1]!=null); if(pts.length<2) return html`<span class="xh-nospark">${pts.length? 'History from Sep-26' : ''}</span>`;
    const lo = Math.min(...pts.map(p=> p[1])), hi = Math.max(...pts.map(p=> p[1])), sx = (i)=> 2 + i/(data.length-1)*(w-4), sy = (v)=> ht-3-(hi===lo? .5 : (v-lo)/(hi-lo))*(ht-6);
    const d = pts.map((p,i)=> (i? 'L' : 'M')+sx(p[0]).toFixed(1)+' '+sy(p[1]).toFixed(1)).join(' '), last = pts[pts.length-1];
    return html`<svg class="xh-spark" width=${w} height=${ht} viewBox=${'0 0 '+w+' '+ht} aria-hidden="true"><path d=${d} fill="none" stroke=${color} stroke-width="1.8" stroke-linejoin="round"/><circle cx=${sx(last[0])} cy=${sy(last[1])} r="2.6" fill=${color}/></svg>`; };
  const Delta = ({ ser })=>{ const v = ser.filter(x=> x!=null); if(v.length<2) return html`<span class="xh-d faint">No prior month</span>`; const d = v[v.length-1]-v[v.length-2];
    return html`<span class=${'xh-d '+(d>0? 'up' : d<0? 'dn' : '')}>${d>0? '▲' : d<0? '▼' : '■'} ${n(Math.abs(d))} vs prior month</span>`; };
  const SevDots = ({ list })=> html`<span class="xh-sev">${SEV.map(([k,l])=>{ const c = list.filter(x=> x.severity===k).length; return c? html`<span key=${k}><i style=${{ background:SEVC[k] }}/>${c} ${l.toLowerCase()}</span>` : ''; })}</span>`;

  /* ---------- the command bar: the app's own, with the executive ribbon ---------- */
  P.TOWER = { code:'FCT', name:'Executive view', base:'screens/home/', tabs:[['desk','Executive view','Gauge']] };
  const Ribbon = ({ F, setF })=>{ const sel = (k, opts, lab)=> html`<${P.Dropdown} label=${lab} value=${F[k]} options=${opts} active=${F[k]!==F0[k]} onChange=${(v)=> setF(Object.assign({}, F, { [k]:v }))}/>`;
    return html`<div class="px-filters compact" role="search" aria-label="Executive filters">
      ${sel('period', PERIODS.map(p=> [p,p]), 'Period')}
      ${sel('entity', [['All','All']].concat((D.entities||[]).map(e=> [e.id, e.id+' '+e.name])), 'Entity')}
      ${sel('region', [['All','All']].concat(REGIONS.map(r=> [r,r])), 'Region')}
      ${sel('tower', [['All','All']].concat(TW.map(t=> [t.id, t.id+' · '+t.name])), 'Tower')}
      ${sel('risk', [['All','All']].concat(SEV.map(([k,l])=> [k,l])), 'Risk')}</div>`; };

  /* ---------- row 1: enterprise score and the five tower scores ---------- */
  const EntTile = ({ H, ex, onOpen })=>{ const sc = TW.map(t=> H[t.id].score).filter(v=> v!=null), avg = sc.length? Math.round(sc.reduce((a,b)=> a+b, 0)/sc.length) : null;
    const ser = PERIODS.map((p,i)=>{ const v = TW.map(t=> H[t.id].series[i]).filter(x=> x!=null); return v.length? v.reduce((a,b)=> a+b,0)/v.length : null; });
    const crit = ex.filter(x=> x.severity==='critical').length, val = ex.reduce((s,x)=> s+exVal(x), 0), due = ex.filter(x=> /WD\+?[0-4]|0[5-9]-Oct|Today/i.test(x.due||'')).length;
    return html`<button type="button" class="xh-tile xh-ent" onClick=${onOpen} aria-label="Enterprise score: open the breakdown">
      <span class="hd"><span class="nm">Enterprise score</span><span class="faint">Average of five tower scores</span></span>
      <span class="sc"><b class="num" style=${{ color:scoreCol(avg) }}>${avg==null? '—' : avg}</b><small>/100</small><${Spark} data=${ser} color=${scoreCol(avg)} w=${110} ht=${30}/></span>
      <span class="mx"><span><b class="num">${n(ex.length)}</b> open exceptions</span><span><b class="num xr">${n(crit)}</b> critical</span><span><b class="num">${amt(val)}</b> at source value</span><span><b class="num">${n(due)}</b> due this week</span></span></button>`; };
  const TowerTile = ({ T, H, ex, onOpen, dim })=>{ const worst = (H.comps||[]).filter(c=> c.sc!=null).sort((a,b)=> a.sc-b.sc)[0], mine = ex.filter(x=> x.tower===T.id || (x.also||[]).includes(T.id));
    return html`<button type="button" class=${'xh-tile xh-tw t-'+bandTone(H.band)+(dim? ' dim' : '')} onClick=${onOpen} aria-label=${T.name+' score: open the breakdown'}>
      <span class="hd"><span class="nm"><${Icon} n=${T.icon} size=${14}/>${T.id}</span>${H.band && html`<span class=${'xh-band b-'+bandTone(H.band)}>${H.band.label}</span>`}</span><span class="tn">${T.name}</span>
      <span class="sc"><b class="num" style=${{ color:scoreCol(H.score) }}>${H.score==null? '—' : Math.round(H.score)}</b><small>/100</small><${Spark} data=${H.series||[]} color=${scoreCol(H.score)}/></span>
      <${Delta} ser=${H.series||[]}/>
      <span class="ln"><span>${H.head? H.head[0] : 'Audit readiness'}</span><b class="num">${H.head? H.head[1] : n(FCT.v('audit.readiness'))+' / 90'}</b></span>
      <span class="ln"><span>Open exceptions</span><b class="num">${n(mine.length)}${mine.filter(x=> x.severity==='critical').length? html` <em class="xr">${mine.filter(x=> x.severity==='critical').length} critical</em>` : ''}</b></span>
      ${worst && html`<span class="wk"><span>Critical</span><b>${worst.name}</b><em class="num">${Math.round(worst.sc)}</em></span>`}</button>`; };

  /* ---------- row 2 left: where the exceptions are (map and globe, as before) ---------- */
  const place = (id)=>{ const e = ENT[id]; return e && e.site? { city:e.site.city, lat:e.site.lat, lng:e.site.lng, region:e.region } : null; };
  const relax = (items, pad, box)=>{ const clamp = (a)=>{ if(!box) return; a.x = Math.max(a.w/2+4, Math.min(box.w-a.w/2-4, a.x)); a.y = Math.max(a.h+4, Math.min(box.h-4, a.y)); };
    items.forEach(clamp); for(let it=0; it<160; it++){ let moved = false;
      for(let i=0;i<items.length;i++) for(let j=i+1;j<items.length;j++){ const a = items[i], b = items[j];
        let dx = b.x-a.x, dy = (b.y-b.h/2)-(a.y-a.h/2); const ox = (a.w+b.w)/2+pad-Math.abs(dx), oy = (a.h+b.h)/2+pad-Math.abs(dy);
        if(ox<=0 || oy<=0) continue; moved = true; if(dx===0 && dy===0){ dx = j%2? 1 : -1; dy = .01; }
        if(oy<=ox){ const s = (dy<0? -1 : 1)*oy/2; a.y -= s; b.y += s; } else { const s = (dx<0? -1 : 1)*ox/2; a.x -= s; b.x += s; } }
      items.forEach(clamp); if(!moved) break; } };
  /* the largest cities carry a label chip; the others show their marker and name it on hover, so labels never pile up */
  const pinHtml = (c, mode, sel, dim)=>{ const col = SEVC[c.worst], lbl = c.lab? '<span class="lb">'+FCT.esc(c.city)+'<em>'+(c.val? FCT.esc(amt(c.val))+' · ' : '')+(mode==='tower'? c.tw.length+(c.tw.length===1? ' tower · ' : ' towers · ') : '')+c.items.length+' open</em></span>' : '';
    const body = '<span class="dot" style="--pc:'+col+';width:'+c.d+'px;height:'+c.d+'px"><i>'+(mode==='tower'? c.tw.length : c.items.length)+'</i></span>';
    return '<div class="xg-pin'+(sel? ' sel' : '')+(dim? ' dim' : '')+'" style="--pc:'+col+'" title="'+FCT.esc(c.city+', '+c.items.length+' open')+'">'+lbl+body+'</div>'; };
  const pinSize = (c, mode)=>{ const lw = c.lab? Math.max(c.city.length*7.2, ((c.val? amt(c.val)+' · ' : '')+(mode==='tower'? c.tw.length+' towers · ' : '')+c.items.length+' open').length*6)+18 : 0;
    const bw = c.d; return { w:Math.ceil(Math.max(lw, bw)), h:(c.lab? 34 : 0) + c.d + 7 }; };


  /* layout: cards, then full-width map, then heatmap (left) with exception list sidebar (right) */
  (function(){ const st = document.createElement('style'); st.textContent =
    /* the page was a fixed one-screen grid; let it grow and scroll so the three sections stack */
    'html,body{height:auto!important;overflow-y:auto!important}'+
    '.px-scr.xh{height:auto!important;min-height:100vh;overflow:visible!important}'+
    '.xh-page{display:flex!important;flex-direction:column;height:auto!important;max-height:none!important;overflow:visible!important;gap:14px}'+
    '.xh-page>section{flex:none!important;height:auto!important;min-height:0}'+
    '.xh-row2.xh-stack{display:block!important}'+
    '.xh-row2 .xg{height:auto!important;overflow:visible!important}'+
    /* globe/map sized like the reference: 440px tall stage, 270px city panel, globe radius = 43% of the shorter side */
    '.xh-row2 .xg-b{display:grid!important;grid-template-columns:minmax(0,1fr) 270px;gap:10px;height:442px!important;min-height:0}'+
    '.xh-row2 .xg-mapw{position:relative;height:440px!important;min-height:0;min-width:0;overflow:hidden}'+
    '.xh-row2 .xg-map{height:440px!important;width:100%}'+
    '.xh-row2 .xg-side{max-height:442px;min-width:0;overflow:auto}'+
    '@media (max-width:760px){.xh-row2 .xg-b{grid-template-columns:1fr;height:auto!important}.xh-row2 .xg-mapw,.xh-row2 .xg-map{height:340px!important}}'+
    '.xh-row3{display:block!important;position:relative;z-index:0}'+
    '.xh-row3 .xa{height:auto!important;overflow:visible!important}'+
    /* light theme: the map, globe, pins, tooltips and legend follow the page instead of staying dark */
    'html.fct-light .xh-row2 .xg-mapw,html.fct-light .xh-row2 .xg-map,html.fct-light .xh-row2 .xg-map.leaflet-container,html.fct-light .geo-map,html.fct-light .geo-map-wrap,html.fct-light .geo-map .leaflet-container{background:#f4f6f5!important}'+
    'html.fct-light .leaflet-control-attribution{background:rgba(255,255,255,.8)!important;color:#5b6f6d!important}html.fct-light .leaflet-control-attribution a{color:#2f5b57!important}'+
    'html.fct-light .leaflet-bar a{background:#fff!important;color:#1f3a37!important;border-color:#cfdad8!important}html.fct-light .leaflet-bar a:hover{background:#eef3f2!important}'+
    'html.fct-light .geo-pin span{background:#fff!important;color:#142d29!important}'+
    ''+
    'html.fct-light .geo-tip,html.fct-light .geo-gtip{background:#fff!important;color:#142d29!important;border-color:#cfdad8!important}'+
    'html.fct-light .geo-empty,html.fct-light .geo-nomap{background:rgba(244,246,245,.7);color:#2f4a47}'+
    'html.fct-light .xg-twh:hover,html.fct-light .xg-twd.open>.xg-twh{background:rgba(20,45,41,.05)}'+
    'html.fct-light .xg-twd{border-bottom-color:rgba(20,45,41,.12)}'+
    '.xg-twd{border-bottom:1px solid var(--px-line,rgba(255,255,255,.1))}'+
    '.xg-twh{display:flex;align-items:center;gap:8px;width:100%;padding:11px 12px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}'+
    '.xg-twh:hover,.xg-twd.open>.xg-twh{background:rgba(255,255,255,.05)}'+
    '.xg-twh .n{display:flex;align-items:center;gap:7px;min-width:0}.xg-twh .n i{width:8px;height:8px;border-radius:50%;flex:none}.xg-twh .n small{opacity:.65;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
    '.xg-twh .m{margin-left:auto;font-size:11.5px;opacity:.8;white-space:nowrap}.xg-twh .c{flex:none;font-size:10px;opacity:.6;transition:transform .15s}.xg-twd.open>.xg-twh .c{transform:rotate(90deg)}'+
    '.xa-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:stretch;height:100%;grid-template-rows:minmax(0,1fr)}'+
'.xa-left{min-width:0;min-height:0;height:100%;display:flex;flex-direction:column;justify-content:center}'+
    '.xa-left .xa-heat{flex:none;display:flex!important;flex-direction:column;gap:6px;min-height:0}'+
    '.xa-left .xh-ch{margin-top:24px!important}'+
    '.xa-left .xa-heat .hr{flex:none;min-height:0;align-items:stretch!important}'+
    '.xa-left .xa-heat .hr.hh{flex:none;min-height:0;align-items:center!important}'+
    '.xa-left .xa-heat .hr>span[role=cell]{display:flex;min-width:0}'+
    '.xa-left .xa-heat .hr .c{width:100%;height:36px;min-height:0;font-size:14px;padding-top:0;padding-bottom:0}'+
    '.xa-left .xa-heat .hr .tn,.xa-left .xa-heat .hr .v{align-self:center}'+
    '.xa-side{min-width:0;min-height:0;height:auto;display:flex;flex-direction:column;gap:10px;border-left:1px solid var(--px-line,rgba(255,255,255,.12));padding-left:20px}'+
    '.xa-side .xa-l{flex:none;min-height:0;max-height:300px;overflow-y:auto;margin:0}'+
    /* filter rows span the full card width: label, then tiles that share the remaining space */
    '.xg-f .xg-row{display:flex!important;align-items:center;gap:6px;width:100%}'+
    '.xg-f .xg-row .l{flex:none;width:90px}'+
    '.xg-f .xg-row .xg-t{flex:1 1 0;min-width:0;justify-content:center}'+
    /* tower score window: Score components, Process chain and Open exceptions share one fixed height; each scrolls inside its card */
    '.xw2-g:not(.x):not(.two){align-items:start}'+
    '.xw2-g:not(.x):not(.two)>.xw2-p{box-sizing:border-box;height:clamp(380px,calc(100vh - 330px),640px);max-height:none;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:thin!important}'+
    '.xw2-g:not(.x):not(.two)>.xw2-p::-webkit-scrollbar{display:block!important;width:6px!important}'+
    '.xw2-g:not(.x):not(.two)>.xw2-p::-webkit-scrollbar-thumb{background:rgba(128,150,146,.45);border-radius:3px}'+
    '@media (max-width:900px){.xw2-g:not(.x):not(.two)>.xw2-p{height:auto;max-height:420px}}'+
    '@media (max-width:900px){.xa-split{grid-template-columns:1fr;height:auto}.xa-left .xa-heat{min-height:380px}.xa-side .xa-l{max-height:420px}.xa-side{border-left:0;padding-left:0}}';
    document.head.appendChild(st); })();
  /* keep the heatmap where it is; slide the "What needs a decision" heading down so it sits just above it */
  (function(){ const gapPx = 22;
    const fix = ()=>{ const hd = document.querySelector('.xa>.xh-ch'), hm = document.querySelector('.xa .xa-heat'); if(!hd || !hm) return;
      hd.style.position = 'relative'; hd.style.top = '0px';
      const bottom = hd.getBoundingClientRect().bottom, col = hm.querySelector('.hr.hh'), target = (col? col.getBoundingClientRect().top : hm.getBoundingClientRect().top) - gapPx;
      hd.style.top = Math.max(0, Math.round(target - bottom)) + 'px'; };
    window.addEventListener('resize', fix); window.addEventListener('load', fix);
    [300,1000,2500].forEach(t=> setTimeout(fix, t)); })();
  (function(){ const st = document.createElement('style'); st.textContent = '*{scrollbar-width:none;-ms-overflow-style:none}*::-webkit-scrollbar,html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;width:0;height:0}'; document.head.appendChild(st); })();
  /* the left rail is pinned on the left edge; keep score windows inside the content area to its right, so the rail is never covered or covering */
  (function(){ const fit = ()=>{ const rail = document.querySelector('[data-rail-pinned]'), rw = rail? Math.round(rail.getBoundingClientRect().width) : 64, gap = 16;
      document.querySelectorAll('.px-win-xl').forEach(w=>{ let el = w; for(; el && el !== document.body; el = el.parentElement){ if(getComputedStyle(el).position === 'fixed') break; } if(!el || el === document.body) return;
        const put = (k, v)=> el.style.setProperty(k, v, 'important'), r = el.getBoundingClientRect();
        if(window.innerWidth <= 700){ return; }
        if(r.width >= window.innerWidth - 2){ /* full-screen backdrop: start it at the rail edge, the window centres in what is left */
          put('left', rw+'px'); put('right', '0'); put('width', 'auto'); }
        else { /* the window itself */
          put('left', (rw+gap)+'px'); put('right', gap+'px'); put('width', 'auto'); put('max-width', 'none'); put('margin', '0'); put('transform', 'none'); put('translate', 'none'); put('inset-inline', (rw+gap)+'px '+gap+'px'); put('top', '24px'); put('bottom', '24px'); put('height', 'auto'); put('max-height', 'none'); } }); };
    new MutationObserver(fit).observe(document.body, { childList:true, subtree:true }); window.addEventListener('resize', fit); fit(); })();
  function GeoCard({ ex, onEx, F }){
    const [sev, setSev] = useState('All'), [reg, setReg] = useState('All'), [tw, setTw] = useState('All'), [mode, setMode] = useState('city'), [proj, setProj] = useState('globe'), [sel, setSel] = useState(null), [q, setQ] = useState(''), [twOpen, setTwOpen] = useState({});
    const host = useRef(null), wrap = useRef(null), M = useRef({}), canGlobe = !!(window.L && window.FCT_GEO_GLOBE && window.FCT_GEO_GLOBE.supported());
    const base = ex.map(x=> ({ x, p:place(x.entity) })).filter(r=> r.p), unmapped = ex.length - base.length;
    const pass = (r, skip)=> (skip==='sev' || sev==='All' || r.x.severity===sev) && (skip==='reg' || reg==='All' || r.p.region===reg) && (skip==='tw' || tw==='All' || r.x.tower===tw);
    const shown = base.filter(r=> pass(r)), by = {};
    shown.forEach(r=>{ const c = by[r.p.city] = by[r.p.city] || { city:r.p.city, lat:r.p.lat, lng:r.p.lng, region:r.p.region, items:[], val:0 }; c.items.push(r.x); c.val += exVal(r.x); });
    const maxV = Math.max(...Object.values(by).map(c=> c.val), .001);
    const cities = Object.values(by).map(c=>{ c.items = sortEx(c.items); c.worst = c.items[0].severity; const g = {}; c.items.forEach(x=>{ (g[x.tower] = g[x.tower] || []).push(x); });
      c.tw = Object.keys(g).map(t=> ({ t, items:g[t], worst:sortEx(g[t])[0].severity })); c.d = 26 + Math.round(Math.sqrt(c.val/maxV)*14); return c; }).sort((a,b)=> b.val-a.val || b.items.length-a.items.length);
    const ql = q.trim().toLowerCase(), match = (c)=> !ql || (c.city+' '+c.region).toLowerCase().includes(ql) || c.items.some(x=> (x.id+' '+x.title).toLowerCase().includes(ql));
    const tot = cities.reduce((s,c)=> s+c.val, 0), selC = cities.find(c=> c.city===sel);
    cities.forEach((c,i)=> c.lab = i<8 || c.city===sel);
    const sig = cities.map(c=> c.city+c.items.length+c.worst).join('|')+mode+(sel||'')+ql;
    /* the map is created once; pins repaint when the data, the mode or the selection change */
    useEffect(()=>{ if(!window.L || !host.current) return;
      const map = L.map(host.current, { minZoom:2, maxZoom:10, zoomSnap:.5, worldCopyJump:false, maxBounds:[[-75,-200],[85,200]], maxBoundsViscosity:.7, zoomControl:false }).setView([24,40], 2);
      L.control.zoom({ position:'bottomright' }).addTo(map); map.attributionControl.setPrefix(false);
      window.FCT_GEO_TILES(map);
      M.current.map = map; M.current.layer = L.layerGroup().addTo(map); M.current.fit = true;
      if(canGlobe) M.current.globe = window.FCT_GEO_GLOBE.create({ wrap:wrap.current, getMap:()=> map, onSelect:(city)=> setSel((s)=> s===city? null : city) });
      map.on('zoomend', ()=> M.current.paint && M.current.paint());
      const ro = window.ResizeObserver? new ResizeObserver(()=> map.invalidateSize()) : null; ro && ro.observe(host.current);
      return ()=>{ ro && ro.disconnect(); map.remove(); M.current = {}; }; }, []);
    useEffect(()=>{ const S = M.current; if(!S.map) return;
      S.paint = ()=>{ const map = S.map; S.layer.clearLayers(); const items = [];
        cities.forEach(c=>{ const sz = pinSize(c, mode), p0 = map.latLngToContainerPoint([c.lat, c.lng]); items.push({ c, x:p0.x, y:p0.y, x0:p0.x, y0:p0.y, w:sz.w, h:sz.h }); });
        const sz = map.getSize(); relax(items, 6, { w:sz.x, h:sz.y });
        const gdata = [];
        items.forEach(it=>{ const c = it.c, dim = !match(c), on = sel===c.city, ll = map.containerPointToLatLng([it.x, it.y]), moved = Math.hypot(it.x-it.x0, it.y-it.y0) > 8;
          if(moved) L.polyline([[c.lat, c.lng], ll], { color:'#cfe3df', weight:1.2, opacity:.75, interactive:false }).addTo(S.layer);
          L.circleMarker([c.lat, c.lng], { radius:3.5, color:'#0f1a1b', weight:1, fillColor:SEVC[c.worst], fillOpacity:1, interactive:false }).addTo(S.layer);
          const icon = L.divIcon({ className:'xg-wrap', iconSize:[it.w, it.h], iconAnchor:[it.w/2, it.h], html:pinHtml(c, mode, on, dim) });
          const m = L.marker(ll, { icon, keyboard:true, riseOnHover:true, zIndexOffset:on? 1000 : 0, title:c.city }).addTo(S.layer); m.on('click', ()=>{ window.FCT_GEO_RIPPLE && window.FCT_GEO_RIPPLE(map, ll, SEVC[c.worst]); setSel(sel===c.city? null : c.city); });
          gdata.push({ city:c.city, lat:c.lat, lng:c.lng, pins:[{ html:pinHtml(c, mode, on, dim), w:it.w, h:it.h, tip:'<b>'+FCT.esc(c.city)+'</b> · '+c.items.length+' open'+(c.val? ' · '+FCT.esc(amt(c.val)) : ''), label:c.city, mapOff:[it.x-it.x0, it.y-it.y0], ringIdx:0, ringN:1 }] }); });
        if(S.globe) S.globe.setData(gdata, { row:false }); };
      if(S.fit && cities.length){ S.map.invalidateSize(); S.map.fitBounds(cities.map(c=> [c.lat, c.lng]), { padding:[60,60], maxZoom:4 });
        if(S.globe && !S.init){ S.init = true; const mid = L.latLngBounds(cities.map(c=> [c.lat, c.lng])).getCenter(); if(proj==='globe') S.globe.startAsGlobe(mid.lat, mid.lng); } S.fit = false; }
      S.paint(); }, [sig]);
    /* switching to the flat map frames the cities again once the globe has unrolled */
    useEffect(()=>{ const S = M.current; if(!S.map) return; if(S.globe) S.globe.setView(proj);
      if(proj==='map'){ const t = setTimeout(()=>{ if(!cities.length) return; S.map.invalidateSize(); S.map.fitBounds(cities.map(c=> [c.lat, c.lng]), { padding:[70,90], maxZoom:4 }); S.paint && S.paint(); }, S.globe? 1900 : 0); return ()=> clearTimeout(t); } }, [proj]);
    useEffect(()=>{ M.current.fit = true; }, [sev, reg, tw]);
    useEffect(()=>{ setTwOpen({}); }, [sel, mode]);
    useEffect(()=>{ const S = M.current, c = cities.find(x=> x.city===sel); if(!S.map || !c) return; if(S.globe && S.globe.isGlobe()) S.globe.rotateTo(c.lat, c.lng); else S.map.flyTo([c.lat, c.lng], Math.max(S.map.getZoom(), 5), { duration:.6 }); }, [sel]);
    const tiles = (key, val, set, opts, dotOf)=> html`<div class="xg-row"><span class="l">${{ sev:'Risk', reg:'Geography', tw:'Tower' }[key]}</span>${opts.map(([k,l])=>{ const c = base.filter(r=> pass(r, key) && (k==='All' || (key==='sev'? r.x.severity : key==='reg'? r.p.region : r.x.tower)===k)).length;
      return html`<button key=${k} type="button" class=${'xg-t'+(val===k? ' on' : '')} aria-pressed=${val===k} disabled=${!c && val!==k} onClick=${()=>{ set(val===k && k!=='All'? 'All' : k); setSel(null); }}>${dotOf && k!=='All' && html`<i style=${{ background:dotOf(k) }}/>`}${l}<b class="num">${c}</b></button>`; })}</div>`;
    return html`<section class="xh-card xg" aria-label="Where the exceptions are">
      <header class="xh-ch"><div><h2>Where the exceptions are</h2></div>
        <div class="xg-tools"><label class="xg-find"><${Icon} n="Search" size=${13}/><input type="search" aria-label="Find a city or exception" placeholder="Find a city or exception" value=${q} onInput=${(e)=> setQ(e.target.value)}/></label>
          ${canGlobe && html`<${P.Seg} label="Projection" value=${proj} onChange=${setProj} options=${[['globe','Globe'],['map','Map']]}/>`}<${P.Seg} label="Markers" value=${mode} onChange=${(v)=>{ setMode(v); }} options=${[['city','By city'],['tower','By tower']]}/></div></header>
      <div class="xg-f">${tiles('sev', sev, setSev, [['All','All']].concat(SEV), (k)=> SEVC[k])}${tiles('reg', reg, setReg, [['All','All']].concat(REGIONS.map(r=> [r,r])))}${tiles('tw', tw, setTw, [['All','All']].concat(TW.map(t=> [t.id,t.id])))}</div>
      <div class="xg-b">
        <div class="xg-mapw geo-mapw" ref=${wrap}>${window.L? html`<div class="geo-map xg-map" ref=${host} role="img" aria-label=${'Map of '+cities.length+' cities with open exceptions'}/>` : html`<p class="faint" style=${{ padding:20 }}>The map library could not be loaded.</p>`}
          ${!cities.length && html`<div class="xg-empty">No open exceptions match these filters.</div>`}
          <div class="xg-lg" aria-hidden="true">${SEV.map(([k,l])=> html`<span key=${k}><i style=${{ background:SEVC[k] }}/>${l}</span>`)}<span class="faint">${mode==='tower'? 'Number: towers with open exceptions' : 'Number: open exceptions'}</span></div></div>
        <aside class="xg-side">${selC? html`<${Fragment}><div class="xg-sh"><button type="button" class="px-link sm" onClick=${()=> setSel(null)}>‹ All cities</button><b>${selC.city}</b><small>${selC.region} · ${mode==='tower'? selC.tw.length+(selC.tw.length===1? ' tower · ' : ' towers · ') : ''}${selC.items.length} open${selC.val? ' · '+amt(selC.val) : ''}</small></div>
            ${mode==='tower'? html`<div class="xg-twl">${selC.tw.map(g=>{ const on = !!twOpen[g.t], tv = g.items.reduce((a,x)=> a+exVal(x), 0);
              return html`<div key=${g.t} class=${'xg-twd'+(on? ' open' : '')}><button type="button" class="xg-twh" aria-expanded=${on} onClick=${()=> setTwOpen(Object.assign({}, twOpen, { [g.t]:!on }))}><span class="n"><i style=${{ background:SEVC[g.worst] }}/><b>${g.t}</b><small>${TWB[g.t]? TWB[g.t].name : ''}</small></span><span class="m num">${g.items.length} open${tv? ' · '+amt(tv) : ''}</span><span class="c" aria-hidden="true">▸</span></button>
                ${on && html`<ul class="xg-ex">${g.items.map(x=> html`<li key=${x.id}><button type="button" onClick=${()=> onEx(x.id)}><i style=${{ background:SEVC[x.severity] }}/><span><b>${x.title}</b><small>${x.id} · ${userName(x.owner)} · due ${x.due||'—'}</small></span><em class="num">${x.impact && x.impact.short || ''}</em></button></li>`)}</ul>`}</div>`; })}</div>` : html`<ul class="xg-ex">${selC.items.map(x=> html`<li key=${x.id}><button type="button" onClick=${()=> onEx(x.id)}><i style=${{ background:SEVC[x.severity] }}/><span><b>${x.title}</b><small>${x.tower} · ${x.id} · ${userName(x.owner)} · due ${x.due||'—'}</small></span><em class="num">${x.impact && x.impact.short || ''}</em></button></li>`)}</ul>`}</${Fragment}>`
          : html`<${Fragment}><div class="xg-sh"><b>Cities</b><small>${n(shown.length)} open in ${cities.length} ${cities.length===1? 'city' : 'cities'}${tot? ' · '+amt(tot) : ''}${unmapped? ' · '+unmapped+' group-level not mapped' : ''}</small></div>
            <ul class="xg-cl">${cities.filter(match).map(c=> html`<li key=${c.city}><button type="button" onClick=${()=> setSel(c.city)}><span class="nm"><i style=${{ background:SEVC[c.worst] }}/><b>${c.city}</b><small>${c.region}</small></span>
              <span class="v"><b class="num">${c.val? amt(c.val) : c.items.length+' open'}</b><small>${c.items.length} open · ${tot? Math.round(c.val/tot*100) : 0}%</small></span>
              <span class="tw">${c.tw.map(g=> html`<span key=${g.t} style=${{ '--tc':SEVC[g.worst] }}>${g.t} ${g.items.length}</span>`)}</span></button></li>`)}</ul></${Fragment}>`}</aside></div>
      ${F.period!==SNAP && html`<p class="xh-note">Exceptions are a ${SNAP} snapshot; the period filter changes the scores, not this map.</p>`}</section>`;
  }

  /* ---------- row 2 right: what needs a decision ---------- */
  function ActCard({ ex, onEx }){
    const [cell, setCell] = useState(null), [tab, setTab] = useState('all');
    const cross = ex.filter(x=> (x.also||[]).length);
    const list = sortEx((tab==='cross'? cross : ex).filter(x=> !cell || ((x.tower===cell.t || (x.also||[]).includes(cell.t)) && x.severity===cell.s)));
    const cnt = (t, s)=> ex.filter(x=> (x.tower===t || (x.also||[]).includes(t)) && x.severity===s);
    const mx = Math.max(...TW.flatMap(t=> SEV.map(([s])=> cnt(t.id, s).length)), 1);
    return html`<section class="xh-card xa" aria-label="What needs a decision">
      <header class="xh-ch"><div><h2>What needs a decision</h2><p>Open exceptions by tower and severity. Select a cell to filter the list; open a row for its context and decision.</p></div></header>
      <div class="xa-split"><div class="xa-left">
      <div class="xa-heat" role="table" aria-label="Open exceptions by tower and severity"><div class="hr hh" role="row"><span/>${SEV.map(([s,l])=> html`<span key=${s} role="columnheader">${l}</span>`)}<span role="columnheader">Value</span></div>
        ${TW.map(t=> html`<div key=${t.id} class="hr" role="row"><span role="rowheader" class="tn">${t.id}</span>${SEV.map(([s])=>{ const c = cnt(t.id, s).length, on = cell && cell.t===t.id && cell.s===s;
          return html`<span key=${s} role="cell"><button type="button" class=${'c'+(on? ' on' : '')} disabled=${!c} style=${{ '--a':c? .15 + .75*c/mx : 0, '--sc':SEVC[s] }} onClick=${()=> setCell(on? null : { t:t.id, s })}>${c || ''}</button></span>`; })}
          <span role="cell" class="v num">${amt(ex.filter(x=> x.tower===t.id).reduce((a,x)=> a+exVal(x), 0))}</span></div>`)}</div>
</div>
      <aside class="xa-side" aria-label="Exceptions shown">
      <div class="xa-tabs">
        ${cell && html`<button type="button" class="xp-tag" onClick=${()=> setCell(null)}>${cell.t} · ${cell.s}<${Icon} n="X" size=${12}/></button>`}</div>
      <ul class="xa-l">${list.map(x=> html`<li key=${x.id}><button type="button" onClick=${()=> onEx(x.id)}><i class=${'s-'+x.severity}/>
          <span class="t"><b>${x.title}</b><small><span class=${'xa-tw'}>${x.tower}${(x.also||[]).length? ' + '+x.also.join(', ') : ''}</span>${x.entity || 'Group'} · ${userName(x.owner)} · due ${x.due||'—'}</small></span>
          <span class="v"><b class="num">${x.impact && x.impact.short || '—'}</b><small>${x.severity}</small></span><${Icon} n="ChevronRight" size=${15}/></button></li>`)}
        ${!list.length && html`<li class="faint" style=${{ padding:12 }}>Nothing open under these filters.</li>`}</ul></aside></div></section>`;
  }

  /* ---------- deep links into the towers: scorecard, process chain (stage, issue, record), profile, case ---------- */
  const navLink = (T, page, kpi, root, nodes)=>{ const M = T.M(); if(!M || !M.nav) return href('screens/'+T.key+'/'+page+'.html');
    let s = M.nav.init(kpi, root? [{ t:'root', label:root }] : null); nodes.forEach(nd=>{ s = M.nav.reduce(s, { t:'drill', node:nd }); });
    return href('screens/'+T.key+'/'+page+'.html')+'#'+M.nav.encode(s); };
  const stNode = (M, st)=> ({ t:'group', dim:'stage', key:st, label:'Stage: '+M.stage(st).name });
  const isNode = (M, c)=> ({ t:'group', dim:'issue', key:c, label:'Issue: '+M.issue(c).name });
  const LK = {
    stage:(T, st)=> navLink(T, 'process', 'process', 'Process chain', [stNode(T.M(), st)]),
    issue:(T, st, c)=> navLink(T, 'process', 'process', 'Process chain', [stNode(T.M(), st), isNode(T.M(), c)]),
    rec:(T, st, id)=> navLink(T, 'process', 'process', 'Process chain', (st? [stNode(T.M(), st)] : []).concat([{ t:'doc', id, label:recLabel(T, id) }])),
    caseOf:(T, id)=> navLink(T, 'desk', T.id==='R2R'? 'adj' : 'exposure', null, [{ t:'case', id, label:id }]),
    prof:(T, v)=> navLink(T, T.prof[0], T.prof[0], { P2P:'Vendor portfolio', O2C:'Customer portfolio', R2R:'Entity portfolio', SC:'Material portfolio' }[T.id], [{ t:T.id==='R2R'? 'eprofile' : 'profile', id:v, label:cpName(T, v) }]) };
  const cpName = (T, v)=>{ const M = T.M(); return T.id==='R2R'? v+' '+((M.E[v]||{}).name||'') : T.id==='SC' && M.matLabel? M.matLabel(v) : (M.V[v]||{}).name || v; };
  const recLabel = (T, id)=>{ const r = T.M().rec(id); return !r? id : r.ref? r.ref : r.name? r.name : r.id || id; };
  const recValOf = (T, r, code)=>{ const M = T.M(); if(T.id==='R2R' && M.recVal) return M.recVal(r, code)||0; return r.amt!=null? r.amt : r.val!=null? r.val : r.rem!=null? r.rem : 0; };
  /* the tower's chain under the ribbon: each stage's records, records with issues and value, and its issues */
  const chainOf = (T, H)=>{ const M = T.M(); if(!M || !H.f) return null; let S; try{ S = M.chainScope(H.f); }catch(e){ return null; }
    const iss = []; M.C.stages.forEach(st=> Object.values(S[st.id].issues||{}).forEach(r=>{ const rs = (r.recs||[]).map(e=> e.x || e); iss.push({ code:r.code, st:st.id, n:rs.length, val:rs.reduce((a,x)=> a+recValOf(T, x, r.code), 0) }); }));
    return { stages:M.C.stages.map(st=> ({ id:st.id, name:st.name, short:st.short||st.name, vol:S[st.id].vol||0, n:S[st.id].n||0, val:S[st.id].val||0 })), iss:iss.sort((a,b)=> b.n-a.n) }; };
  /* an exception, traced to its tower case, stages and records where the tower ledger holds them */
  const traceOf = (x)=>{ const T = TWB[x.tower]; if(!T || !T.M()) return null; const M = T.M(), c = M.X.cases.find(k=> k.ex===x.id); if(!c) return { T };
    let cs = null; try{ cs = M.caseStages(c); }catch(e){}
    const recs = (c.lines||[]).map(id=>{ const r = M.rec(id), ch = M.chain? M.chain(id) : null; return r && { id, label:recLabel(T, id), iss:ch? ch.iss : [], val:recValOf(T, r, ch && ch.iss[0]), st:ch && ch.iss[0]? M.issue(ch.iss[0]).stage : cs && cs.primary }; }).filter(Boolean);
    return { T, c, cs, recs, cp:c.v || c.e }; };
  const Fig = ({ l, v, s, cls })=> html`<div class=${'xw-f'+(cls? ' '+cls : '')}><dt>${l}</dt><dd class="num">${v}</dd>${s && html`<small>${s}</small>`}</div>`;
  const Go = ({ to, children, cls })=> html`<a class=${'xw-go2'+(cls? ' '+cls : '')} href=${to}>${children}<${Icon} n="ArrowUpRight" size=${12}/></a>`;
  const rate = (a, b)=> b? a/b*100 : 0;

  /* ---------- windows ---------- */
  function TowerWin({ T, H, ex, onEx }){
    const mine = sortEx(ex.filter(x=> x.tower===T.id || (x.also||[]).includes(T.id))), ch = T.id==='CMP'? null : chainOf(T, H), crit = mine.filter(x=> x.severity==='critical').length;
    const comps = (H.comps||[]).slice().sort((a,b)=> (a.sc==null? 999 : a.sc)-(b.sc==null? 999 : b.sc)), worstSt = ch && ch.stages.slice().sort((a,b)=> rate(b.n,b.vol)-rate(a.n,a.vol))[0];
    const data = PERIODS.map((p,i)=> ({ m:p.slice(0,3), v:H.series[i]==null? null : Math.round(H.series[i]) })), mxR = ch? Math.max(...ch.stages.map(s=> rate(s.n, s.vol)), 1) : 1;
    const byP = T.id==='CMP'? (D.cmp.byProcess||[]) : [];
    return html`<div class="xw2">
      <header class=${'xw2-h t-'+bandTone(H.band)}>
        <div class="xw2-sc"><b class="num" style=${{ color:scoreCol(H.score) }}>${H.score==null? '—' : Math.round(H.score)}</b><span>/100</span>${H.band && html`<em class=${'xh-band b-'+bandTone(H.band)}>${H.band.label}</em>`}<${Delta} ser=${H.series||[]}/></div>
        <dl class="xw2-figs">${(H.kpis||[]).map(([l,v])=> html`<${Fig} key=${l} l=${l} v=${v}/>`)}<${Fig} l="Open exceptions" v=${n(mine.length)} s=${crit? crit+' critical' : 'none critical'} cls=${crit? 'bad' : ''}/>
          ${worstSt && html`<${Fig} l="Critical stage" v=${worstSt.short} s=${pct(rate(worstSt.n, worstSt.vol),1)+' of records with issues'}/>`}</dl>
        <div class="xw2-tr"><${R.ResponsiveContainer} width="100%" height=${62}><${R.AreaChart} data=${data} margin=${{ top:4, right:4, left:4, bottom:0 }}>
          <defs><linearGradient id=${'xg'+T.id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E0B25A" stopOpacity=${.4}/><stop offset="100%" stopColor="#E0B25A" stopOpacity=${0}/></linearGradient></defs>
          <${R.XAxis} dataKey="m" hide=${true}/><${R.YAxis} domain=${[0,100]} hide=${true}/><${R.Tooltip} formatter=${(v)=> v==null? '—' : v+' / 100'}/>
          <${R.Area} type="monotone" dataKey="v" name="Health score" stroke="#E0B25A" strokeWidth=${2} fill=${'url(#xg'+T.id+')'} connectNulls=${true} isAnimationActive=${false}/></${R.AreaChart}></${R.ResponsiveContainer}>
          <small>${data.filter(d=> d.v!=null).length<2? 'History starts Sep-26' : 'Score, Apr–Sep'}</small></div></header>
      <div class="xw2-g">
        <section class="xw2-p"><h4>Score components <span>open one on the ${T.id==='CMP'? 'Compliance story' : T.id+' scorecard'}</span></h4>
          <table class="xw2-t"><thead><tr><th>Component</th><th class="r">Value</th><th>Score</th><th class="r">Lost</th><th/></tr></thead><tbody>${comps.map(c=> html`<tr key=${c.kpi}>
            <td><a href=${T.id==='CMP'? href('screens/cmp/executive.html') : deskLink(T.id, 'health', c.kpi)}>${c.name}</a><small>weight ${c.w}</small></td><td class="r num">${c.v==null? '—' : pct(c.v)}</td>
            <td class="sb"><span class="trk"><i style=${{ width:(c.sc||0)+'%', background:scoreCol(c.sc) }}/></span><b class="num" style=${{ color:scoreCol(c.sc) }}>${c.sc==null? 'N/A' : Math.round(c.sc)}</b></td>
            <td class="r num faint">${c.lost==null? '—' : '−'+n(c.lost,1)}</td><td class="go"><a href=${T.id==='CMP'? href('screens/cmp/executive.html') : deskLink(T.id, 'health', c.kpi)} aria-label=${'Open '+c.name}><${Icon} n="ChevronRight" size=${14}/></a></td></tr>`)}</tbody></table></section>
        ${ch? html`<section class="xw2-p"><h4>Process chain <span>select a stage or issue to open it in the ${T.id} process chain</span></h4>
          <ol class="xw2-chain">${ch.stages.map((s,i)=> html`<li key=${s.id}><a href=${LK.stage(T, s.id)}><span class="ix num">${i+1}</span><span class="nm">${s.name}<small>${n(s.n)} of ${n(s.vol)} records with issues${s.val? ' · '+amt(s.val) : ''}</small></span>
            <span class="rt"><i style=${{ width:(rate(s.n, s.vol)/mxR*100)+'%', background:rate(s.n,s.vol)>=15? 'var(--px-crit)' : rate(s.n,s.vol)>=5? '#E0B25A' : 'var(--px-pos)' }}/></span><b class="num">${pct(rate(s.n, s.vol),1)}</b></a></li>`)}</ol>
          <h5>Most frequent issues</h5><ul class="xw2-iss">${ch.iss.slice(0,6).map(r=> html`<li key=${r.st+r.code}><a href=${LK.issue(T, r.st, r.code)}><span>${T.M().issue(r.code).name}<small>${T.M().stage(r.st).name}</small></span><b class="num">${n(r.n)}</b><em class="num">${r.val? amt(r.val) : ''}</em></a></li>`)}</ul></section>`
        : html`<section class="xw2-p"><h4>Controls by tower <span>open a tower's scorecard</span></h4><table class="xw2-t"><thead><tr><th>Tower</th><th class="r">Controls</th><th class="r">Automated</th><th class="r">Failing</th></tr></thead>
            <tbody>${byP.map(r=>{ const tt = TW.find(t=> t.id===r[0]); return html`<tr key=${r[0]}><td>${tt? html`<a href=${href('screens/'+tt.key+'/desk.html#sheet')}>${r[0]}</a>` : r[0]}</td><td class="r num">${r[1]}</td><td class="r num">${r[2]}</td><td class=${'r num'+(r[3]? ' bad' : '')}>${r[3]}</td></tr>`; })}</tbody></table>
            <p class="xw2-n">Control library: ${n(D.cmp.library.total)} controls, ${n(D.cmp.library.automated)} automated, ${n(D.cmp.library.key)} key.</p></section>`}
        <section class="xw2-p"><h4>Open exceptions <span>${mine.length} open · open one for its decision</span></h4>
          <ul class="xw2-ex">${mine.slice(0,10).map(x=> html`<li key=${x.id}><button type="button" onClick=${()=> onEx(x.id)}><i class=${'s-'+x.severity}/><span><b>${x.title}</b><small>${x.id} · ${x.entity||'Group'} · ${userName(x.owner)} · due ${x.due||'—'}</small></span><em class="num">${x.impact && x.impact.short || '—'}</em></button></li>`)}
            ${mine.length>10 && html`<li class="more"><a class="px-link sm" href=${T.id==='CMP'? href('screens/cmp/executive.html') : href('screens/'+T.key+'/desk.html#sheet')}>All ${mine.length} in the ${T.id==='CMP'? 'Compliance' : T.id} scorecard</a></li>`}</ul></section></div>
      <nav class="xw2-go"><${Go} to=${T.id==='CMP'? href('screens/cmp/executive.html') : href('screens/'+T.key+'/desk.html#sheet')} cls="pri">${T.id==='CMP'? 'Compliance story' : T.id+' scorecard'}<//>
        <${Go} to=${profLink(T.id)}>${T.prof[1]}<//><${Go} to=${procLink(T.id)}>${T.id==='CMP'? 'Controls' : 'Process chain'}<//></nav></div>`;
  }
  function EntWin({ H, ex, onTower }){
    const rows = TW.map(t=> ({ t, h:H[t.id], ex:ex.filter(x=> x.tower===t.id), ch:t.id==='CMP'? null : chainOf(t, H[t.id]) }));
    const sc = TW.map(t=> H[t.id].score).filter(v=> v!=null), avg = sc.length? Math.round(sc.reduce((a,b)=> a+b,0)/sc.length) : null;
    return html`<div class="xw2">
      <header class="xw2-h t-a"><div class="xw2-sc"><b class="num" style=${{ color:scoreCol(avg) }}>${avg==null? '—' : avg}</b><span>/100</span><em class="xh-band b-a">Enterprise</em></div>
        <dl class="xw2-figs"><${Fig} l="Open exceptions" v=${n(ex.length)} s=${ex.filter(x=> x.severity==='critical').length+' critical'}/><${Fig} l="Across towers" v=${n(ex.filter(x=> (x.also||[]).length).length)} s="shared with another tower"/>
          <${Fig} l="Source value" v=${amt(ex.reduce((a,x)=> a+exVal(x), 0))} s="not a reconciled exposure"/><${Fig} l="Towers on watch" v=${n(TW.filter(t=> H[t.id].band && H[t.id].band.label!=='Healthy').length)+' of 5'}/></dl></header>
      <section class="xw2-p"><h4>Tower scores <span>open a tower for its components, process chain and exceptions</span></h4>
        <table class="xw2-t"><thead><tr><th>Tower</th><th class="r">Score</th><th>Band</th><th>Trend</th><th>Critical component</th><th>Critical stage</th><th class="r">Open</th><th class="r">Critical</th><th class="r">Source value</th><th/></tr></thead>
          <tbody>${rows.map(({ t, h:hh, ex:e, ch })=>{ const w = (hh.comps||[]).filter(c=> c.sc!=null).sort((a,b)=> a.sc-b.sc)[0], ws = ch && ch.stages.slice().sort((a,b)=> rate(b.n,b.vol)-rate(a.n,a.vol))[0];
            return html`<tr key=${t.id}><td><button type="button" class="px-link" onClick=${()=> onTower(t.id)}>${t.id} · ${t.name}</button></td><td class="r num" style=${{ color:scoreCol(hh.score), fontWeight:700 }}>${hh.score==null? '—' : Math.round(hh.score)}</td>
              <td>${hh.band && html`<span class=${'xh-band b-'+bandTone(hh.band)}>${hh.band.label}</span>`}</td><td><${Spark} data=${hh.series||[]} color=${scoreCol(hh.score)} w=${80} ht=${22}/></td>
              <td>${w? html`<a href=${t.id==='CMP'? href('screens/cmp/executive.html') : deskLink(t.id, 'health', w.kpi)}>${w.name}</a> <span class="faint">${Math.round(w.sc)}</span>` : '—'}</td>
              <td>${ws? html`<a href=${LK.stage(t, ws.id)}>${ws.name}</a> <span class="faint">${pct(rate(ws.n, ws.vol),1)}</span>` : html`<a href=${procLink(t.id)}>Controls</a>`}</td>
              <td class="r num">${e.length}</td><td class=${'r num'+(e.filter(x=> x.severity==='critical').length? ' bad' : '')}>${e.filter(x=> x.severity==='critical').length}</td><td class="r num">${amt(e.reduce((a,x)=> a+exVal(x), 0))}</td>
              <td class="go"><button type="button" class="px-link sm" onClick=${()=> onTower(t.id)}>Open<${Icon} n="ChevronRight" size=${13}/></button></td></tr>`; })}</tbody></table></section>
      <div class="xw2-g two"><section class="xw2-p"><h4>Tower scores by month <span>O2C and SC history starts at the current snapshot</span></h4>
          <div style=${{ height:200 }}><${R.ResponsiveContainer} width="100%" height="100%"><${R.LineChart} data=${PERIODS.map((p,i)=> Object.assign({ m:p.slice(0,3) }, ...TW.map(t=> ({ [t.id]:H[t.id].series[i]==null? null : Math.round(H[t.id].series[i]) }))))} margin=${{ top:8, right:14, left:-6, bottom:0 }}>
            <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} domain=${[0,100]} ...${P.axis} width=${40}/><${R.Tooltip}/><${R.Legend} wrapperStyle=${{ fontSize:11.5 }}/>
            ${TW.map((t,i)=> html`<${R.Line} key=${t.id} type="monotone" dataKey=${t.id} stroke=${TCOL[i]} strokeWidth=${2} dot=${{ r:3 }} connectNulls=${true} isAnimationActive=${false}/>`)}</${R.LineChart}></${R.ResponsiveContainer}></div></section>
        <section class="xw2-p"><h4>Open exceptions by tower <span>stacked by severity; select a bar to open the tower</span></h4>
          <div style=${{ height:200 }}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${TW.map(t=> Object.assign({ t:t.id }, ...SEV.map(([k])=> ({ [k]:ex.filter(x=> x.tower===t.id && x.severity===k).length }))))} margin=${{ top:8, right:10, left:-6, bottom:0 }}>
            <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="t" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${40} allowDecimals=${false}/><${R.Tooltip} cursor=${{ fill:'rgba(255,255,255,.04)' }}/><${R.Legend} wrapperStyle=${{ fontSize:11.5 }}/>
            ${SEV.map(([k,l],i)=> html`<${R.Bar} key=${k} dataKey=${k} name=${l} stackId="s" fill=${SEVC[k]} radius=${i===3? [3,3,0,0] : 0} isAnimationActive=${false} style=${{ cursor:'pointer' }} onClick=${(d)=> onTower(d.t)}/>`)}</${R.BarChart}></${R.ResponsiveContainer}></div></section></div></div>`;
  }
  function ExWin({ id, onTower }){
    const x = FCT.ex(id), [, bump] = useState(0);
    useEffect(()=>{ const t = setInterval(()=> bump(k=> k+1), 1500); return ()=> clearInterval(t); }, []);
    if(!x) return html`<${P.Empty} text="Exception not found."/>`;
    const open = FCT.isOpen(x), ev = x.evidence||{}, plain = (t)=> String(t==null? '' : t).replace(/<[^>]+>/g, ''), tws = [x.tower].concat(x.also||[]).filter(t=> TWB[t]);
    const tr = traceOf(x), T = tr && tr.T, M = T && T.M(), touched = tr && tr.cs? tr.cs.stages : {}, prim = tr && tr.cs && tr.cs.primary;
    const caseName = tr && tr.c && M && (M.ETYPE? (M.ETYPE[tr.c.type]||{}).name : M.CT? (M.CT[tr.c.type]||{}).name : '') || '';
    return html`<div class="xw2">
      <header class=${'xw2-h xw2-x s-'+x.severity}>
        <div class="xw2-xt"><div class="k"><span class=${'xw2-sev s-'+x.severity}>${x.severity}</span>${x.id} · ${x.tower}${(x.also||[]).length? ' with '+x.also.join(', ') : ''} · ${x.entity? x.entity+' '+((ENT[x.entity]||{}).name||'') : 'Group'}</div>
          <h2>${x.title}</h2>${x.subject && html`<p>${x.subject}</p>`}</div>
        <dl class="xw2-figs"><${Fig} l="At stake" v=${x.impact && x.impact.short || 'Not quantified'} s=${x.impact && x.impact.label || ''} cls="bad"/><${Fig} l="Owner" v=${userName(x.owner)} s=${((D.users||[]).find(u=> u.id===x.owner)||{}).role || ''}/>
          <${Fig} l="Due" v=${x.due||'—'} s=${'Priority '+(x.priority||'—')}/><${Fig} l="Status" v=${open? 'Open' : 'Decided'} s=${x.ai && x.ai.confidence!=null? 'AI confidence '+Math.round(x.ai.confidence*100)+'%' : ''}/></dl></header>
      <div class="xw2-g x">
        <div class="xw2-col">
          <section class=${'xw2-p xw2-dec'+(open? ' need' : '')}><h4>${open? 'Decision needed' : 'Decided'} <span>${x.gate? plain(x.gate) : 'Owner '+userName(x.owner)}</span></h4>
            <p class="rec"><b>AI recommendation.</b> ${x.ai? plain(x.ai.text) : x.takeLabel || 'Review and record the outcome.'}</p>
            <div class="acts"><button type="button" class="btn primary" onClick=${()=> FCT.openDrawer(x.id)}><${Icon} n="Check" size=${14}/>${open? 'Decide' : 'View decision'}</button>
              ${tr && tr.c && html`<${Go} to=${LK.caseOf(T, tr.c.id)}>Case ${tr.c.id} on the ${T.id} scorecard<//>`}
              ${tr && tr.cp && html`<${Go} to=${LK.prof(T, tr.cp)}>${cpName(T, tr.cp)} profile<//>`}
              <${Go} to=${exLink(x)}>Open in ${x.tower==='CMP'? 'Compliance' : x.tower}<//></div></section>
          ${M && html`<section class="xw2-p"><h4>Where it sits in the ${T.id} process chain <span>${tr.c? caseName+(prim? ', raised at '+M.stage(prim).name : '') : 'not tied to single records'}</span></h4>
            <ol class="xw2-flow">${M.C.stages.map((s,i)=>{ const codes = touched[s.id] || [], on = codes.length>0;
              return html`<li key=${s.id} class=${(on? 'on' : '')+(s.id===prim? ' pri' : '')}><a href=${on && codes[0]? LK.issue(T, s.id, codes[0]) : LK.stage(T, s.id)} title=${'Open '+s.name+' in the process chain'}>
                <span class="ix num">${i+1}</span><b>${s.name}</b><small>${on? codes.map(c=> M.issue(c).name).join('; ') : 'no issue here'}</small></a></li>`; })}</ol>
            ${tr.recs && tr.recs.length? html`<table class="xw2-t"><thead><tr><th>Record</th><th>Issues</th><th class="r">Value</th><th/></tr></thead><tbody>${tr.recs.slice(0,6).map(r=> html`<tr key=${r.id}>
              <td><a href=${LK.rec(T, r.st, r.id)}>${r.label}</a></td><td>${r.iss.length? r.iss.map(c=> M.issue(c).name).join('; ') : '—'}</td><td class="r num">${r.val? amt(r.val) : '—'}</td>
              <td class="go"><a href=${LK.rec(T, r.st, r.id)} aria-label=${'Open '+r.label+' in the process chain'}><${Icon} n="ChevronRight" size=${14}/></a></td></tr>`)}</tbody></table>
              ${tr.recs.length>6 && html`<p class="xw2-n">${tr.recs.length-6} more records in <a href=${LK.caseOf(T, tr.c.id)}>case ${tr.c.id}</a>.</p>`}` : ''}</section>`}
          <section class="xw2-p"><h4>What happened</h4><p class="txt">${plain(x.what)}</p>${x.rootCause && html`<p class="txt"><b>Root cause.</b> ${plain(x.rootCause)}</p>`}
            ${ev.table && html`<table class="xw2-t"><thead><tr>${ev.table.cols.map((c,i)=> html`<th key=${i}>${c}</th>`)}</tr></thead><tbody>${ev.table.rows.slice(0,6).map((r,i)=> html`<tr key=${i}>${r.map((c,j)=> html`<td key=${j}>${plain(c)}</td>`)}</tr>`)}</tbody></table>`}
            ${(ev.bullets||[]).length? html`<ul class="txt">${ev.bullets.slice(0,5).map((b,i)=> html`<li key=${i}>${plain(b)}</li>`)}</ul>` : ''}</section></div>
        <div class="xw2-col">
          ${(x.chain||[]).length? html`<section class="xw2-p"><h4>How it unfolded</h4><ol class="xw2-tl">${x.chain.map((c,i)=> html`<li key=${i} class=${c[3]? 'ok' : 'bad'}><b>${c[0]}</b><span class="faint">${c[1]}</span><small>${plain(c[2])}</small></li>`)}</ol>
            ${x.chainNote && html`<p class="xw2-n">${plain(x.chainNote)}</p>`}</section>` : ''}
          <section class="xw2-p"><h4>Towers involved <span>score, scorecard and process chain</span></h4><ul class="xw2-tw">${tws.map(t=>{ const role = (x.towers||[]).find(r=> r[0]===t);
            return html`<li key=${t}><div><b>${t}</b> ${TWB[t].name}${role && html`<small>${plain(role[1])}</small>`}</div><span><button type="button" class="px-link sm" onClick=${()=> onTower(t)}>Score</button>
              <a class="px-link sm" href=${t==='CMP'? href('screens/cmp/executive.html') : href('screens/'+TWB[t].key+'/desk.html#sheet')}>${t==='CMP'? 'Story' : 'Scorecard'}</a><a class="px-link sm" href=${procLink(t)}>${t==='CMP'? 'Controls' : 'Process chain'}</a></span></li>`; })}</ul></section>
          ${(x.links||[]).length? html`<section class="xw2-p"><h4>Related views</h4><div class="xw2-lk">${x.links.map(([l,u],i)=> html`<${Go} key=${i} to=${href(u)}>${l}<//>`)}</div></section>` : ''}</div></div></div>`;
  }

  /* ---------- the page ---------- */
  function App(){
    const [F, setF0] = useState(loadF), setF = (n2)=>{ setF0(n2); try{ sessionStorage.setItem('fct-exec-f', JSON.stringify(n2)); }catch(e){} };
    const [win, setWin] = useState(null), [, tick] = useState(0);
    useEffect(()=>{ const t = setInterval(()=> tick(k=> k+1), 2500); return ()=> clearInterval(t); }, []);   /* decisions taken in the drawer show up without a reload */
    const H = useMemo(()=>{ const o = {}; TW.forEach(t=> o[t.id] = health(t, F)); return o; }, [F.period, F.entity, F.region]);
    const ex = exOf(F), tws = F.tower==='All'? TW : TW;
    const openEx = (id)=> setWin({ t:'ex', id }), openTw = (id)=> setWin({ t:'tw', id });
    const T = win && win.t==='tw'? TWB[win.id] : null, X = win && win.t==='ex'? FCT.ex(win.id) : null;
    return html`<div class="px-scr k-amber xh"><${P.ScreenTabs} on="desk" right=${html`<${Ribbon} F=${F} setF=${setF}/>`}/>
      <main class="xh-page" aria-label="Executive view">
        <h1 class="sr">Executive view: every tower on one screen</h1>
        <section class="xh-row1" aria-label="Scores">
          <${EntTile} H=${H} ex=${ex} onOpen=${()=> setWin({ t:'ent' })}/>
          ${tws.map(t=> html`<${TowerTile} key=${t.id} T=${t} H=${H[t.id]} ex=${ex} dim=${F.tower!=='All' && F.tower!==t.id} onOpen=${()=> openTw(t.id)}/>`)}</section>
        <section class="xh-row2 xh-stack"><${GeoCard} ex=${ex} onEx=${openEx} F=${F}/></section>
        <section class="xh-row3"><${ActCard} ex=${ex} onEx=${openEx}/></section>
      </main>
      <${P.Window} open=${!!win} onClose=${()=> setWin(null)} theme="k-amber px-win-xl" icon=${!win? 'Gauge' : win.t==='ex'? 'TriangleAlert' : 'Gauge'}
        title=${!win? '' : win.t==='ent'? 'Enterprise score' : win.t==='tw'? T.id+' · '+T.name : X? X.id : win.id}
        sub=${!win? '' : win.t==='ent'? 'Five towers, '+F.period : win.t==='tw'? 'Score, components, trend and open exceptions' : X? X.title : ''}>
        <div class="xw-wrap">${win && win.prev && html`<button type="button" class="px-link sm xw-back" onClick=${()=> setWin(win.prev)}>‹ Back to ${win.prev.t==='ent'? 'enterprise score' : win.prev.t==='tw'? win.prev.id : win.prev.id}</button>`}
        ${win && win.t==='ent' && html`<${EntWin} H=${H} ex=${ex} onTower=${(id)=> setWin({ t:'tw', id, prev:win })}/>`}
        ${win && win.t==='tw' && html`<${TowerWin} T=${T} H=${H[T.id]} ex=${ex} onEx=${(id)=> setWin({ t:'ex', id, prev:win })}/>`}
        ${win && win.t==='ex' && html`<${ExWin} key=${win.id} id=${win.id} onTower=${(id)=> setWin({ t:'tw', id, prev:win })}/>`}</div></${P.Window}></div>`;
  }

  /* ---------- Exception queue (screens/home/queue.html) ---------- */
  const ACT = { TAKE:'Took recommendation', OVERRIDE:'Overrode', HOLD:'Held', ASSIGN:'Reassigned', NUDGE:'Nudged', ESCALATE:'Escalated', BULK:'Approved in bulk', CERTIFY:'Certified', APPROVE:'Approved', DELEGATE:'Delegated', REJECT:'Rejected', MERGE:'Merged', UPLOAD:'Evidence uploaded', SIGN:'Signed', ATTEST:'Attested', SUBMIT:'Submitted' };
  const useWin = ()=>{ const [win, setWin] = useState(null), [F] = useState(loadF), H = useMemo(()=>{ const o = {}; TW.forEach(t=> o[t.id] = health(t, F)); return o; }, []);
    const view = html`<${P.Window} open=${!!win} onClose=${()=> setWin(null)} theme="k-amber px-win-xl" icon=${win && win.t==='ex'? 'TriangleAlert' : 'Gauge'}
        title=${!win? '' : win.t==='tw'? win.id+' · '+TWB[win.id].name : win.id} sub=${!win? '' : win.t==='ex'? (FCT.ex(win.id)||{}).title : 'Score, components, process chain and open exceptions'}>
      <div class="xw-wrap">${win && win.prev && html`<button type="button" class="px-link sm xw-back" onClick=${()=> setWin(win.prev)}>‹ Back to ${win.prev.id}</button>`}
        ${win && win.t==='tw' && html`<${TowerWin} T=${TWB[win.id]} H=${H[win.id]} ex=${FCT.openFor('ALL')} onEx=${(id)=> setWin({ t:'ex', id, prev:win })}/>`}
        ${win && win.t==='ex' && html`<${ExWin} key=${win.id} id=${win.id} onTower=${(id)=> setWin({ t:'tw', id, prev:win })}/>`}</div></${P.Window}>`;
    return [setWin, view]; };
  const Stat = ({ l, v, s, on, onClick, tone })=> html`<button type="button" class=${'xq-st'+(on? ' on' : '')+(tone? ' '+tone : '')} onClick=${onClick} aria-pressed=${!!on}><span>${l}</span><b class="num">${v}</b><small>${s}</small></button>`;
  function QueueApp(){
    const [F, setF0] = useState(loadF), setF = (n2)=>{ setF0(n2); try{ sessionStorage.setItem('fct-exec-f', JSON.stringify(n2)); }catch(e){} };
    const [st, setSt] = useState('open'), [q, setQ] = useState(''), [, tick] = useState(0), [setWin, winView] = useWin();
    useEffect(()=>{ const t = setInterval(()=> tick(k=> k+1), 2000); return ()=> clearInterval(t); }, []);
    const all = D.exceptions.filter(x=>{ const e = ENT[x.entity]; return (F.tower==='All' || x.tower===F.tower || (x.also||[]).includes(F.tower)) && (F.entity==='All' || x.entity===F.entity) && (F.region==='All' || (e && e.region===F.region)); });
    const open = all.filter(FCT.isOpen), sv = (s)=> open.filter(x=> x.severity===s).length;
    const ql = q.trim().toLowerCase();
    const rows = all.filter(x=> (st==='open'? FCT.isOpen(x) : st==='done'? !FCT.isOpen(x) : true) && (F.risk==='All' || x.severity===F.risk) && (!ql || (x.id+' '+x.title+' '+(x.subject||'')+' '+userName(x.owner)).toLowerCase().includes(ql)))
      .sort((a,b)=> (b.priority||0)-(a.priority||0));
    const val = rows.reduce((a,x)=> a+exVal(x), 0), setRisk = (r)=> setF(Object.assign({}, F, { risk:F.risk===r? 'All' : r }));
    return html`<div class="px-scr k-amber xh"><${P.ScreenTabs} on="queue" right=${html`<${Ribbon} F=${F} setF=${setF}/>`}/>
      <main class="xq-page" aria-label="Exception queue"><h1 class="sr">Exception queue</h1>
        <section class="xq-stats"><${Stat} l="Open" v=${n(open.length)} s=${'of '+all.length+' raised this close'} on=${F.risk==='All' && st==='open'} onClick=${()=>{ setSt('open'); setF(Object.assign({}, F, { risk:'All' })); }}/>
          <${Stat} l="Critical" v=${n(sv('critical'))} s="Cash loss, close or misstatement" tone="r" on=${F.risk==='critical'} onClick=${()=> setRisk('critical')}/>
          <${Stat} l="High" v=${n(sv('high'))} s="Above ₹1 Cr materiality or a key control" tone="a" on=${F.risk==='high'} onClick=${()=> setRisk('high')}/>
          <${Stat} l="Medium" v=${n(sv('medium'))} s="Process and efficiency risk" on=${F.risk==='medium'} onClick=${()=> setRisk('medium')}/>
          <${Stat} l="Low" v=${n(sv('low'))} s="Watch" on=${F.risk==='low'} onClick=${()=> setRisk('low')}/>
          <${Stat} l="Decided" v=${n(all.length-open.length)} s="Logged with evidence" tone="g" on=${st==='done'} onClick=${()=> setSt(st==='done'? 'open' : 'done')}/></section>
        <section class="xh-card xq-card"><header class="xh-ch"><div><h2>Ranked for today</h2><p>Severity is the business risk; priority is what to do first. Open a row for its context and decision.</p></div>
            <div class="xg-tools"><label class="xg-find"><${Icon} n="Search" size=${13}/><input type="search" aria-label="Search the queue" placeholder="Search ID, title or owner" value=${q} onInput=${(e)=> setQ(e.target.value)}/></label>
              <${P.Seg} label="Status" value=${st} onChange=${setSt} options=${[['open','Open'],['done','Decided'],['all','Everything']]}/><span class="faint xq-n">${rows.length} shown · ${amt(val)} quantified</span></div></header>
          <div class="xq-tw" role="group" aria-label="Tower">${[['All','All towers', open.length]].concat(TW.map(t=> [t.id, t.id+' · '+t.name, FCT.openFor(t.id).length])).map(([k,l,c])=> html`<button key=${k} type="button" class=${'xg-t'+(F.tower===k? ' on' : '')} onClick=${()=> setF(Object.assign({}, F, { tower:k }))}>${l}<b class="num">${c}</b></button>`)}</div>
          <div class="xq-scroll"><table class="xw2-t xq-t"><thead><tr><th class="r">Priority</th><th>Exception</th><th>Tower</th><th>Severity</th><th class="r">Impact</th><th>Due</th><th>AI suggests</th><th class="r">Conf.</th><th>Owner</th><th/></tr></thead>
            <tbody>${rows.map(x=> html`<tr key=${x.id} class="click" tabIndex="0" onClick=${()=> setWin({ t:'ex', id:x.id })} onKeyDown=${(e)=>{ if(e.key==='Enter') setWin({ t:'ex', id:x.id }); }}>
              <td class="r"><span class=${'xq-pr'+(x.priority>=75? ' hi' : '')}>${x.priority}</span></td><td><b>${x.title}</b><small>${x.id} · ${x.entity||'Group'}${x.subject? ' · '+x.subject : ''}</small></td>
              <td><span class="xa-tw">${x.tower}</span>${(x.also||[]).length? html`<small>with ${x.also.join(', ')}</small>` : ''}</td><td><span class=${'xw2-sev s-'+x.severity}>${x.severity}</span></td>
              <td class="r num">${x.impact && x.impact.short || '—'}</td><td class="nw">${x.due||'—'}</td><td>${x.ai && x.ai.short || '—'}</td><td class="r num">${x.ai && x.ai.confidence!=null? Math.round(x.ai.confidence*100)+'%' : '—'}</td>
              <td class="nw">${userName(x.owner)}</td><td class="nw" onClick=${(e)=> e.stopPropagation()}><button type="button" class=${'btn sm'+(FCT.isOpen(x)? ' primary' : '')} onClick=${()=> FCT.openDrawer(x.id)}>${FCT.isOpen(x)? 'Decide' : 'View'}</button></td></tr>`)}
              ${!rows.length && html`<tr><td colSpan="10" class="faint" style=${{ padding:14 }}>Nothing matches these filters.</td></tr>`}</tbody></table></div></section></main>${winView}</div>`;
  }

  /* ---------- Decisions and evidence (screens/home/log.html) ---------- */
  function LogApp(){
    const [tw, setTw] = useState('All'), [kind, setKind] = useState('all'), [sel, setSel] = useState(0), [, tick] = useState(0), [setWin, winView] = useWin();
    useEffect(()=>{ const t = setInterval(()=> tick(k=> k+1), 2000); return ()=> clearInterval(t); }, []);
    const S = FCT.state, res = ((S.notes||{}).res)||{}, ai = FCT.aiStats? FCT.aiStats() : { rate:null, accepted:0, total:0, overrides:0 };
    const cases = (S.log||[]).map(l=> Object.assign({ live:true, kind:'case' }, l)).concat((D.history||[]).map(l=> Object.assign({ kind:'case' }, l)));
    const recs = Object.keys(res).map(id=>{ const r = res[id]; return { kind:'rec', live:true, t:r.at, id, tower:r.tower||'—', title:(r.label2||id)+(r.ent? ', '+r.ent : ''), action:r.label, by:r.by, comment:r.note, reason:r.issue, owner:r.owner, due:r.due }; });
    const rows = (kind==='rec'? recs : kind==='case'? cases : recs.concat(cases)).filter(r=> tw==='All' || r.tower===tw);
    const r = rows[Math.min(sel, rows.length-1)] || null, x = r && r.kind==='case' && FCT.ex(r.id);
    const codeName = (c)=> ((D.codes.override||[]).concat(D.codes.hold||[]).find(k=> k[0]===c)||['',''])[1];
    return html`<div class="px-scr k-amber xh"><${P.ScreenTabs} on="log" right=${html`<span/>`}/>
      <main class="xq-page" aria-label="Decisions and evidence"><h1 class="sr">Decisions and evidence</h1>
        <section class="xq-stats">${[['Decided this session', n((S.log||[]).length), 'Decisions taken in this demo session', ''], ['Records resolved', n(recs.length), 'From the Resolve panel on any record', 'g'],
            ['AI recommendations accepted', pct(ai.rate,1), n(ai.accepted)+' of '+n(ai.total)+' this quarter', ''], ['Overrides today', n(ai.overrides), 'Each one retrains or recalibrates', ai.overrides? 'a' : ''], ['Evidence completeness', '99%', 'Required items present at decision', '']]
          .map(([l,v,s2,t])=> html`<div key=${l} class=${'xq-st static '+t}><span>${l}</span><b class="num">${v}</b><small>${s2}</small></div>`)}</section>
        <div class="xq-two">
          <section class="xh-card xq-card"><header class="xh-ch"><div><h2>Audit trail</h2><p>Every decision, by a person or accepted from the AI, with what the AI recommended, how confident it was, who decided and why.</p></div>
              <div class="xg-tools"><${P.Seg} label="Kind" value=${kind} onChange=${(v)=>{ setKind(v); setSel(0); }} options=${[['all','All'],['case','Decisions'],['rec','Record resolutions']]}/></div></header>
            <div class="xq-tw">${['All'].concat(TW.map(t=> t.id)).map(k=> html`<button key=${k} type="button" class=${'xg-t'+(tw===k? ' on' : '')} onClick=${()=>{ setTw(k); setSel(0); }}>${k==='All'? 'All towers' : k+' · '+TWB[k].name}</button>`)}</div>
            <div class="xq-scroll"><table class="xw2-t xq-t"><thead><tr><th>When</th><th>Record</th><th>Tower</th><th>Decision</th><th class="r">AI conf.</th><th>By</th></tr></thead>
              <tbody>${rows.map((rw,i)=> html`<tr key=${rw.kind+rw.id+i} class=${'click'+(r===rw? ' sel' : '')} tabIndex="0" onClick=${()=> setSel(i)} onKeyDown=${(e)=>{ if(e.key==='Enter') setSel(i); }}>
                <td class="nw">${rw.t}${rw.live && html`<small class="xq-live">This session</small>`}</td><td><b>${rw.title}</b><small>${rw.id}${rw.kind==='rec'? ' · record resolution' : ''}</small></td>
                <td><span class="xa-tw">${rw.tower}</span></td><td>${rw.kind==='rec'? rw.action : ACT[rw.action] || rw.action}${rw.reason && html`<small>${rw.kind==='rec'? rw.reason : rw.reason+' '+codeName(rw.reason)}</small>`}</td>
                <td class="r num">${rw.conf!=null? Math.round(rw.conf*100)+'%' : '—'}</td><td class="nw">${userName(rw.by)}</td></tr>`)}
                ${!rows.length && html`<tr><td colSpan="6" class="faint" style=${{ padding:14 }}>No decisions for this view yet. Decide on any exception, or resolve any record, and it appears here.</td></tr>`}</tbody></table></div></section>
          <section class="xh-card xq-card xq-ev"><header class="xh-ch"><div><h2>Evidence pack</h2><p>${r? 'What an auditor sees for this decision' : 'Select a decision'}</p></div></header>
            ${r && html`<${Fragment}><dl class="xq-kv"><div><dt>Record</dt><dd><b>${r.id}</b> <span class="xa-tw">${r.tower}</span></dd></div><div><dt>Subject</dt><dd>${r.title}</dd></div>
                <div><dt>Decision</dt><dd>${r.kind==='rec'? r.action : (ACT[r.action] || r.action)+(r.option? ': '+r.option : '')}</dd></div><div><dt>Decided by</dt><dd>${userName(r.by)} at ${r.t}</dd></div>
                ${r.reason && html`<div><dt>${r.kind==='rec'? 'Issue' : 'Reason code'}</dt><dd>${r.kind==='rec'? r.reason : r.reason+' '+codeName(r.reason)}</dd></div>`}
                ${r.comment && html`<div><dt>${r.kind==='rec'? 'Note' : 'Comment'}</dt><dd>“${r.comment}”</dd></div>`}${r.owner && html`<div><dt>Owner</dt><dd>${userName(r.owner)}${r.due? ' · due '+r.due : ''}</dd></div>`}
                ${r.amount!=null && !isNaN(r.amount) && html`<div><dt>Amount</dt><dd>${amt(r.amount)}</dd></div>`}</dl>
              ${r.aiRec && html`<div class="xq-ai"><span>AI recommendation${r.conf!=null? ' · '+Math.round(r.conf*100)+'% confidence' : ''}</span><p>${r.aiRec}</p>${r.model && html`<small>Model ${r.model}</small>`}</div>`}
              <h4 class="xq-h4">Evidence attached</h4><div class="xq-chips">${['Source records snapshot','Policy and threshold version','Model output and factors','Approval trail'].map(c=> html`<span key=${c}>${c}</span>`)}</div>
              <div class="xw2-go"><button type="button" class="btn sm primary" onClick=${()=> FCT.ui && FCT.ui.toast && FCT.ui.toast('Evidence pack for '+r.id+' exported as PDF (simulated)')}>Export evidence pack (PDF)</button>
                ${x && html`<button type="button" class="btn sm" onClick=${()=> setWin({ t:'ex', id:r.id })}>Open the exception</button>`}
                ${r.kind==='rec' && TWB[r.tower] && TWB[r.tower].M() && html`<a class="xw-go2" href=${LK.rec(TWB[r.tower], null, r.id)}>Open the record<${Icon} n="ArrowUpRight" size=${12}/></a>`}
                ${TWB[r.tower] && html`<a class="xw-go2" href=${procLink(r.tower)}>${r.tower==='CMP'? 'Compliance controls' : r.tower+' process chain'}<${Icon} n="ArrowUpRight" size=${12}/></a>`}</div></${Fragment}>`}</section></div></main>${winView}</div>`;
  }
  /* the page shell clips and fixes its height to one screen; walk up from the page and release every ancestor so the document scrolls */
  function unlockScroll(){ const pg = document.querySelector('.xh-page'); if(!pg) return;
    for(let el = pg; el && el !== document.documentElement; el = el.parentElement){ const cs = getComputedStyle(el), put = (k, v)=> el.style.setProperty(k, v, 'important');
      if(el !== document.body){ put('height', 'auto'); put('max-height', 'none'); put('overflow', 'visible'); if(cs.position==='fixed' || cs.position==='absolute') put('position', 'relative'); } }
    [document.documentElement, document.body].forEach(e=>{ e.style.setProperty('height', 'auto', 'important'); e.style.setProperty('min-height', '100vh', 'important'); e.style.setProperty('overflow-y', 'auto', 'important'); }); }
  /* the left rail was sized to its parent, which now grows with the page; pin it to the viewport so it always runs full height */
  function pinRail(){ const pg = document.querySelector('.xh-page'); if(!pg || window.scrollY>5) return;
    const all = document.body.querySelectorAll('aside, nav, div, header');
    for(const el of all){ if(el.contains(pg) || pg.contains(el)) continue; const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if(r.left<=2 && r.top<=2 && r.width>=50 && r.width<=160 && r.height>=window.innerHeight*.5 || el.dataset.railPinned){
        if(!el.dataset.railPinned && cs.display==='none') continue;
        const put = (k, v)=> el.style.setProperty(k, v, 'important');
        if(!el.dataset.railPinned){ const sp = document.createElement('div'); sp.setAttribute('aria-hidden','true'); sp.style.cssText = 'flex:none;width:'+r.width+'px;height:1px;pointer-events:none'; if(el.parentNode) el.parentNode.insertBefore(sp, el); }
        el.dataset.railPinned = '1';
        /* fixed to the viewport so it runs the full page height however far the content scrolls; a spacer keeps its place in the layout */
        put('position','fixed'); put('left','0'); put('top','0'); put('bottom','0'); put('height','100vh'); put('max-height','100vh'); put('z-index','50');
        put('overflow-x','hidden'); put('overflow-y','auto'); put('scrollbar-width','none'); put('-ms-overflow-style','none'); return; } } }
  [0, 50, 300, 1000].forEach(ms=> setTimeout(()=>{ unlockScroll(); pinRail(); }, ms)); window.addEventListener('resize', pinRail);
  [0, 50, 300, 1000].forEach(ms=> setTimeout(unlockScroll, ms)); window.addEventListener('resize', unlockScroll);
  const PAGE = document.body.dataset.page;
  P.mount(PAGE==='home/queue'? QueueApp : PAGE==='home/log'? LogApp : App);
})();


