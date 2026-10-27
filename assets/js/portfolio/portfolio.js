/* FCT demo — the profile-screen portfolio shared by every tower (first built for P2P Vendor portfolio).
   One scope (risk · geography · a tower tier) drives the page, top to bottom:
     chain strip → pinned scope with search → records in view beside their map and risk chart → records × stages heat map →
     region → issue theme → record → anomalies and records; a record's detailed view and any case open in one window.
   A tower plugs in through an adapter T (see make() below for the fields it must provide). Classic script after the tower's
   UI kit and assets/js/map/map-card.js; exposes window.FCTPortfolio = { make }. */
(function(){
  const make = (P, T)=>{
    const { html, h, R, COL, Icon } = P, FCT = window.FCT, { useState, useEffect, useRef, Fragment } = React, ReactDOM = window.ReactDOM;
    const cr = P.cr, amt = P.amt || ((v)=> P.cr(v)), pct = P.pct || ((v,d)=> FCT.pct(v,d));
    const RISKS = T.riskCats, HI = (cat)=> cat==='Critical' || cat==='High';
    const n1 = T.noun, nP = T.nounPl, Nn = nP[0].toUpperCase()+nP.slice(1), Ns = n1[0].toUpperCase()+n1.slice(1);
    const a1 = (w)=> (/^[aeiou]/i.test(w)? 'an ' : 'a ')+w;
    const pl = (n)=> FCT.n(n)+' '+(n===1? n1 : nP);
    const fv = T.fmtVal || ((v,d)=> cr(v,d)), fsec = T.fmtSec || amt, rv = T.fmtRec || ((v)=> v? amt(v) : ''), EXN = T.exName || 'Open exposure';
    const lab = (q)=> q.id? (T.recLabel? T.recLabel(q.id) : q.id) : '';   /* record labels resolved at render time, not for every record */

    /* everything the page needs for one scope, computed once per filter */
    const view = (fs)=>{
      const vs = T.recs(fs), ids = new Set(vs.map(v=> v.id)), sp = T.val(fs), ex = T.exposure(fs), od = T.sec(fs), st = T.stages(fs, ids);
      const iss = T.issueRecs(fs), md = T.mdFails? T.mdFails(fs) : [];
      const themes = T.themes.map(t=>{ const byV = {}, seen = new Set(); let n = 0, val = 0;
        /* a record counts once per theme, however many of the theme's issue codes it raises */
        const add = (vid, rec)=>{ const r = byV[vid] = byV[vid] || { v:vid, n:0, val:0, recs:[], codes:{} }; r.codes[rec.code] = (r.codes[rec.code]||0)+1;
          if(rec.id && seen.has(rec.id)){ const prev = r.recs.find(q=> q.id===rec.id); if(prev) prev.name += '; '+rec.name.toLowerCase(); return; } if(rec.id) seen.add(rec.id);
          r.n++; r.val += rec.val; r.recs.push(Object.assign({ ent:vid }, rec)); n++; val += rec.val; };
        if(t.md) md.forEach(x=> add(x.ent, { code:'md', name:x.name, val:0, id:null }));
        else iss.filter(x=> t.codes.includes(x.code)).forEach(x=> add(x.ent, { code:x.code, name:x.name, val:x.val, id:x.id }));
        const list = Object.values(byV).filter(r=> ids.has(r.v)).sort((a,b)=> b.val-a.val || b.n-a.n);
        return Object.assign({}, t, { n, val, vendors:list, nv:list.length }); });
      const tot = vs.reduce((s,v)=> s+(sp[v.id]||0), 0), hiV = vs.filter(v=> HI(T.risk(v.id).cat)), hiSp = hiV.reduce((s,v)=> s+(sp[v.id]||0), 0);
      return { vs, ids, sp, ex, od, st, themes, tot, hiV, hiSp };
    };
    /* records for the scope tiles, with location, risk, tier and value (unscoped, so the tiles can cross-count) */
    const tileItems = (f)=>{ const sp = T.val(f); return T.recs(f).filter(v=> v.geo).map(v=>{ const r = T.risk(v.id); return { id:v.id, name:v.name, geo:v.geo, cat:r.cat, score:r.score, seg:T.seg(v.id), val:sp[v.id]||0, sub:T.sub(v) }; }); };
    const scopeOf = (fs)=> T.getScope(fs);
    const topThemeOf = (V0)=>{ const o = {}; V0.themes.filter(t=> !t.md).forEach(t=> t.vendors.forEach(x=>{ const c = o[x.v]; if(!c || x.n > c.n) o[x.v] = { name:t.name, n:x.n }; })); return o; };

    /* where the chain breaks for the records in scope; a stage opens the Process chain screen */
    function ChainStrip({ V0 }){
      const rows = V0.st, mx = Math.max(...rows.map(r=> r.val), .01);
      return html`<nav class="vp-chain" aria-label=${'Where these '+nP+' break the chain'}>
        ${rows.map(r=> html`<a key=${r.id} class="vp-stage" href=${FCT.href(T.processHref)} title=${r.q||r.name} style=${{ '--w':(r.val/mx) }}>
          <span class="nm">${r.name}</span><b class="num">${T.fmtStage? T.fmtStage(r) : cr(r.val,1)}</b><span class="sub">${FCT.n(r.n)} ${T.stageUnit||'records'} · ${pl(r.nv)}</span><i class="bar"/></a>`)}</nav>`;
    }

    /* the pinned scope: search, then three aligned rows of square tiles (risk, geography, tower tier), cross-counted */
    function LensBar({ items, fs, setScope, V0, onFind }){
      const sc = scopeOf(fs), T2 = FCTMap.tiers(items, RISKS, T.regions, T.segs, sc), any = ['pRisk','pGeo','pSeg'].some(k=> sc[k] && sc[k]!=='All');
      const sent = useRef(null), [stuck, setStuck] = useState(false);
      useEffect(()=>{ const el = sent.current; if(!el || !window.IntersectionObserver) return; const io = new IntersectionObserver(([e])=> setStuck(!e.isIntersecting), { threshold:0 }); io.observe(el); return ()=> io.disconnect(); }, []);
      const tile = (key, on, n, label, onClick, dot, title)=> html`<button key=${key} type="button" class=${'vp-tile'+(on? ' on' : '')} aria-pressed=${on} disabled=${!n && !on} title=${title} onClick=${onClick}>
        <span class="t">${dot && html`<i style=${{ background:dot }}/>`}${label}</span><b class="num">${n}</b></button>`;
      const row = (label, list)=> html`<div class="vp-row" role="group" aria-label=${label}><span class="l">${label}</span>${list}</div>`;
      return html`<${Fragment}><div ref=${sent} class="vp-sent" aria-hidden="true"/>
        <div class=${'vp-lens'+(stuck? ' stuck' : '')} role="region" aria-label=${Ns+' scope'}>
          <div class="vp-lens-top"><${FCTMap.MapSearch} P=${P} items=${items} noun=${n1} onOpen=${onFind} extra=${(v)=> v.sub}/>
            <div class="vp-lens-sum"><span><b class="num">${FCT.n(V0.vs.length)}</b> ${V0.vs.length===1? n1 : nP}</span><span><b class="num">${fv(V0.tot,0)}</b> ${T.valShort}${T.valWhen? ', '+T.valWhen(fs) : ''}</span>
              <span><b class="num">${FCT.n(V0.hiV.length)}</b> high or critical</span>
              ${any && html`<button type="button" class="btn sm" onClick=${()=> setScope({ pRisk:'All', pGeo:'All', pSeg:'All' })}>Clear scope</button>`}</div></div>
          ${row('Risk', [tile('all', T2.allRisks, T2.rT.All.n, 'All', ()=> setScope({ pRisk:'All' }))].concat(RISKS.map(c=> tile(c, !T2.allRisks && T2.risks.includes(c), T2.rT[c].n, c, ()=>{ const nx = FCTMap.nextRisk(T2, c); setScope({ pRisk: nx? nx.join(',') : 'All' }); }, P.RISK[c], (T.riskDefs||{})[c]))))}
          ${row('Geography', [tile('all', T2.geo==='All', T2.gT.All.n, 'All', ()=> setScope({ pGeo:'All' }))].concat(T.regions.map(r=> tile(r, T2.geo===r, T2.gT[r].n, r, ()=> setScope({ pGeo: T2.geo===r? 'All' : r })))))}
          ${row(T.segLabel, [tile('all', T2.seg==='All', T2.sT.All.n, 'All', ()=> setScope({ pSeg:'All' }))].concat(T.segs.map(g=> tile(g.id, T2.seg===g.id, T2.sT[g.id].n, g.label||g.id, ()=> setScope({ pSeg: T2.seg===g.id? 'All' : g.id }), null, g.desc))))}
        </div></${Fragment}>`;
    }

    const Tags = ({ id, big })=>{ const r = T.risk(id), seg = T.seg(id), segL = (T.segs.find(g=> g.id===seg)||{}).label || seg;
      return html`<${Fragment}><${P.RiskTag} cat=${r.cat} score=${r.score} small=${!big}/>${seg && html`<span class="px-pill">${segL}</span>`}${(T.tags? T.tags(id) : []).map(([l,tn])=> html`<span key=${l} class=${'px-pill'+(tn? ' t-'+tn : '')}>${l}</span>`)}</${Fragment}>`; };
    const Figs = ({ id, fs, V0, cases })=> html`<dl class="figs"><div><dt>${T.valName}${T.valWhen? ', '+T.valWhen(fs) : ''}</dt><dd class="num">${fv(V0.sp[id]||0,1)}</dd></div>
      ${cases==null? html`<div><dt>Share of scope</dt><dd class="num">${pct(V0.tot? (V0.sp[id]||0)/V0.tot*100 : 0,1)}</dd></div>` : ''}
      <div><dt>${EXN}</dt><dd class=${'num'+(V0.ex[id]? ' bad' : '')}>${V0.ex[id]? amt(V0.ex[id]) : '—'}</dd></div><div><dt>${T.secName}</dt><dd class="num">${fsec(V0.od[id]||0)}</dd></div>
      ${cases!=null? html`<div><dt>Open cases</dt><dd class="num">${cases}</dd></div>` : ''}</dl>`;

    /* one record at a glance: shown in place under its row */
    function Brief({ id, fs, V0, onOpen, onDetail, onClose }){
      const v = T.byId(id), r = T.risk(id), mine = V0.themes.map(t=> ({ t, r:t.vendors.find(x=> x.v===id) })).filter(x=> x.r).sort((a,b)=> b.r.n-a.r.n).slice(0,3);
      const cases = T.cases(id, fs).filter(c=> c.measure==='potential');
      return html`<div class="vp-brief">
        <div class="hd"><div><b>${v.name}</b><div class="faint">${v.id} · ${T.sub(v)}</div></div>${onClose && html`<button type="button" class="px-link sm" onClick=${onClose}>Clear</button>`}</div>
        <div class="tags"><${Tags} id=${id} big=${true}/></div>
        <${Figs} id=${id} fs=${fs} V0=${V0}/>
        <div class="why"><span class="l">Why it matters</span>${r.why || 'No material concern'}</div>
        ${mine.length? html`<ul class="iss">${mine.map(({ t, r:x })=> html`<li key=${t.id}><span>${t.name}</span><b class="num">${t.md? x.n+' checks' : x.n+' records'}</b></li>`)}</ul>` : html`<p class="faint" style=${{margin:'6px 0'}}>No issues in this period.</p>`}
        <div class="act">${onDetail && html`<button type="button" class="btn sm primary" onClick=${()=> onDetail(id)}>Open detailed view</button>`}
          <button type="button" class="btn sm" onClick=${()=> onOpen(id)}>${T.profileLabel}</button>${cases.length? html`<span class="faint">${cases.length} open case${cases.length>1? 's' : ''}</span>` : ''}</div></div>`;
    }

    /* resolutions recorded in the Resolve panel, kept with the demo state so they survive a reload */
    const RES = ()=> window.FCTAct? FCTAct.RES() : {}, userName = (uid)=> window.FCTAct? FCTAct.userName(uid) : uid;
    const KIND = { ctl:'Control breach', fin:'Financial', ops:'Operational' };
    const playOf = (code)=> window.FCTPlay? FCTPlay.get(T.tower, code) : { rec:'Review the record with its owner and record the outcome.', action:'Assign for review', owner:'PR' };
    const confOf = (code)=>{ const k = T.issueKind? T.issueKind(code) : null; return k==='fin'? 86 : k==='ctl'? 82 : 74; };
    const facOf = (v)=> v>=80? COL.crit : v>=60? COL.high : v>=40? '#D9B65A' : 'var(--px-brand2, #4FB3A3)';
    const recsOfTheme = (V0, code)=> V0.themes.flatMap(t=> t.vendors.flatMap(r=> r.recs)).filter(r=> r.code===code);

    /* detailed view (window): who the record is, how it compares with the scope, what drives its risk, its trend,
       then its issue themes with the anomalies and cases behind the chosen one. An anomaly opens in the same window. */
    function Detail({ id, fs, V0, onRec, onCase, onProfile }){
      const v = T.byId(id), r = T.risk(id), mine = V0.themes.map(t=> ({ t, x:t.vendors.find(q=> q.v===id) })).filter(q=> q.x);
      const [t0, setT] = useState(null), cur = mine.find(q=> q.t.id===t0) || mine.slice().sort((a,b)=> b.x.n-a.x.n)[0];
      const cases = T.cases(id, fs).filter(c=> c.measure!=='closed'), caseVal = cases.reduce((s,c)=> s+(c.amount||0), 0);
      const ranked = V0.vs.slice().sort((a,b)=> (V0.sp[b.id]||0)-(V0.sp[a.id]||0)), rank = ranked.findIndex(x=> x.id===id)+1;
      const scores = V0.vs.map(x=> T.risk(x.id).score).sort((a,b)=> a-b), med = scores.length? scores[Math.floor(scores.length/2)] : null;
      const nIss = mine.filter(q=> !q.t.md).reduce((s,q)=> s+q.x.n, 0), fac = (T.factors? T.factors(id)||[] : []).filter(x=> x.v!=null).sort((a,b)=> b.v-a.v).slice(0,6);
      const tr = T.trend? T.trend(id, fs) : null, res = RES(), mx = Math.max(...mine.map(q=> q.x.n), 1);
      const pts = V0.vs.map(x=> ({ id:x.id, n:x.name, x:+(V0.sp[x.id]||0).toFixed(2), y:T.risk(x.id).score, me:x.id===id }));
      const fig = (l, val, s, cls)=> html`<div class=${'d2-fig'+(cls? ' '+cls : '')}><span class="l">${l}</span><b class="num">${val}</b><small>${s||''}</small></div>`;
      return html`<div class="vp-det2">
        <header class="d2-h"><div class="d2-id"><div class="tags"><${Tags} id=${id} big=${true}/></div><h2>${v.name}</h2><p class="faint">${v.id} · ${T.sub(v)}</p></div>
          <div class="d2-why"><span class="l">Why it matters</span><p>${r.why || 'No material concern'}</p><button type="button" class="btn sm" onClick=${()=> onProfile(id)}>Open full ${T.profileLabel.toLowerCase()}<${Icon} n="ArrowUpRight" size=${13}/></button></div></header>
        <div class="d2-figs">
          ${fig(T.valName+(T.valWhen? ', '+T.valWhen(fs) : ''), fv(V0.sp[id]||0,1), '#'+rank+' of '+FCT.n(V0.vs.length)+' · '+pct(V0.tot? (V0.sp[id]||0)/V0.tot*100 : 0,1)+' of scope')}
          ${fig('Risk score', r.score, med!=null? 'Scope median '+med : '', 'risk r-'+String(r.cat).toLowerCase())}
          ${fig(EXN, V0.ex[id]? amt(V0.ex[id]) : '—', V0.ex[id]? 'Potential, under investigation' : 'No open exposure', V0.ex[id]? 'bad' : '')}
          ${fig(T.secName, V0.od[id]? fsec(V0.od[id]) : '—', '')}
          ${fig('Records with issues', FCT.n(nIss), mine.length+' theme'+(mine.length===1? '' : 's'))}
          ${fig('Open cases', FCT.n(cases.length), !cases.length? 'None open' : T.noCaseSum? 'Largest '+amt(Math.max(...cases.map(c=> c.amount||0))) : caseVal? amt(caseVal)+' at stake' : '')}</div>
        <div class="d2-viz">
          <section class="d2-p"><div class="d2-ph"><h4>Risk drivers</h4><span class="faint">0–100, higher is riskier</span></div>
            ${fac.length? html`<ul class="d2-fac d2-scroll">${fac.map(x=> html`<li key=${x.id||x.name}><span class="nm">${x.name}</span><span class="trk"><i style=${{ width:x.v+'%', background:facOf(x.v) }}/></span><b class="num">${x.v}</b><small>${x.why||''}</small></li>`)}</ul>`
              : html`<p class="faint">No factor breakdown for this ${n1}.</p>`}</section>
          <section class="d2-p"><div class="d2-ph"><h4>${T.peerChart? 'Risk vs '+T.valShort+': peer comparison' : 'Against the scope'}</h4><span class="faint">${T.peerChart? 'Across: '+T.valName+' ('+(T.valAxis||'₹ Cr')+') · Up: risk score (0–100)' : T.valName+' and risk score'}</span></div>
            <div class="d2-chart"><${R.ResponsiveContainer} width="100%" height="100%"><${R.ScatterChart} margin=${{ top:8, right:12, left:-6, bottom:4 }}>
              <${R.ReferenceArea} y1=${60} y2=${100} fill="var(--px-crit)" fillOpacity=${.07}/>
              <${R.CartesianGrid} stroke=${COL.grid}/><${R.XAxis} type="number" dataKey="x" scale="sqrt" ...${P.axis} tickFormatter=${(x)=> T.valAxis? x : '₹'+x}/><${R.YAxis} type="number" dataKey="y" domain=${[0,100]} ...${P.axis} width=${36}/>
              <${R.Tooltip} cursor=${false} content=${({active,payload})=> active && payload && payload.length? html`<div class="px-ctip"><div class="h">${payload[0].payload.n}</div><div class="r"><span>${T.valName}</span><b>${fv(payload[0].payload.x)}</b></div><div class="r"><span>Risk</span><b>${payload[0].payload.y}</b></div></div>` : null}/>
              <${R.Scatter} data=${pts.filter(p=> !p.me)} fill=${COL.ink3} fillOpacity=${.35} isAnimationActive=${false}/>
              <${R.Scatter} data=${pts.filter(p=> p.me)} fill="var(--kc, #E0B25A)" stroke="#fff" strokeWidth=${2} isAnimationActive=${false} shape=${(pp)=> h('circle', { cx:pp.cx, cy:pp.cy, r:8, fill:'var(--kc, #E0B25A)', stroke:'#fff', strokeWidth:2 })}/>
            </${R.ScatterChart}></${R.ResponsiveContainer}></div>
            ${T.peerChart && html`<div class="d2-lg"><span><i class="me"/>${v.name}</span><span><i class="pe"/>Other ${nP} in scope</span><span><i class="hz"/>High and Critical risk (60+)</span></div>`}
            <p class="d2-note faint">${v.name} is #${rank} of ${FCT.n(V0.vs.length)} by ${T.valShort}${med!=null? ', risk '+r.score+' against a median of '+med : ''}.</p></section>
          ${tr && tr.data && tr.data.length? html`<section class="d2-p"><div class="d2-ph"><h4>${tr.name}</h4><span class="faint">${tr.sub||'Last six months'}</span></div>
            <div class="d2-chart"><${R.ResponsiveContainer} width="100%" height="100%"><${R.AreaChart} data=${tr.data} margin=${{ top:10, right:8, left:-12, bottom:0 }}>
              <defs><linearGradient id=${'d2g'+id.replace(/[^a-z0-9]/gi,'')} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--kc, #E0B25A)" stopOpacity=${.45}/><stop offset="100%" stopColor="var(--kc, #E0B25A)" stopOpacity=${0}/></linearGradient></defs>
              <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${44} tickFormatter=${(x)=> tr.tick? tr.tick(x) : FCT.n(x)}/>
              <${R.Tooltip} formatter=${(x)=> tr.fmt? tr.fmt(x) : FCT.n(x)}/>
              <${R.Area} type="monotone" dataKey="v" name=${tr.name} stroke="var(--kc, #E0B25A)" strokeWidth=${2} fill=${'url(#d2g'+id.replace(/[^a-z0-9]/gi,'')+')'} isAnimationActive=${false}/></${R.AreaChart}></${R.ResponsiveContainer}></div></section>` : ''}</div>
        <div class="d2-low">
          <section class="d2-col"><div class="d2-ph"><h4>Issue themes</h4><span class="faint">${mine.length? 'Records with issues'+(T.valWhen? ', '+T.valWhen(fs) : '') : 'No issues in the period'}</span></div>
            <ul class="vp-tl d2-tl d2-scroll">${mine.map(({ t, x })=> html`<li key=${t.id}><button type="button" class=${cur && cur.t.id===t.id? 'on' : ''} aria-pressed=${cur && cur.t.id===t.id} onClick=${()=> setT(t.id)}>
              <span class="nm">${t.name}<small>${t.md? x.recs.map(q=> q.name).join(', ') : Object.keys(x.codes).map(c=> T.issueName(c)).slice(0,2).join('; ')}</small></span>
              <span class="fig"><b class="num">${t.md? x.n+' checks' : x.n}</b><small>${t.md? '' : rv(x.val)}</small></span>${!t.md && html`<i class="bar" style=${{ width:(x.n/mx*100)+'%' }}/>`}</button></li>`)}</ul></section>
          <section class="d2-col vp-recs">${cur? html`<${Fragment}><div class="d2-ph"><h4>${cur.t.name}</h4><span class="faint">${cur.t.why}</span></div><div class="d2-scroll">
              ${cases.filter(c=> T.caseTheme[c.type]===cur.t.id).length? html`<h5>Open anomalies</h5><ul class="vp-anl">${cases.filter(c=> T.caseTheme[c.type]===cur.t.id).map(c=> html`<li key=${c.id} class="vp-an"><button type="button" class="an-main" onClick=${()=> onCase(c.id)}>
                <span class="nm"><span class="id num">${c.id}</span>${c.typeName}<small>${c.stName}</small></span><b class="num">${c.amount? amt(c.amount) : ''}</b></button>
                <button type="button" class="go" aria-label=${'Open case '+c.id} onClick=${()=> onCase(c.id)}><${Icon} n="ChevronRight" size=${16}/></button></li>`)}</ul>` : ''}
              ${cur.t.md? html`<h5>Failing checks</h5><ul class="vp-rl">${cur.x.recs.map((q,i)=> html`<li key=${i}><span class="nm">${q.name}<small>Failing master-data check</small></span></li>`)}</ul>`
              : html`${cur.x.recs.some(q=> !(T.recCase && T.recCase(q)))? html`<h5>Records with this issue</h5>` : ''}<ul class="vp-anl">${cur.x.recs.filter(q=> !(T.recCase && T.recCase(q))).slice().sort((a,b)=> b.val-a.val).slice(0,40).map((q,i)=>{ const done = q.id && res[q.id];
                return html`<li key=${i} class="vp-an"><button type="button" class="an-main" onClick=${()=> q.id && onRec(Object.assign({ ent:id }, q), cur.t)}>
                  <span class="nm"><span class="id num">${lab(q)}</span>${q.name}<small>${done? html`<span class="d2-done">Resolved: ${done.label}</span>` : T.issueKind? KIND[T.issueKind(q.code)]||'' : ''}</small></span><b class="num">${rv(q.val)}</b></button>
                  <button type="button" class="go" aria-label=${'Open '+lab(q)} onClick=${()=> q.id && onRec(Object.assign({ ent:id }, q), cur.t)}><${Icon} n="ChevronRight" size=${16}/></button></li>`; })}
                ${cur.x.recs.length>40 && html`<li class="faint more">${cur.x.recs.length-40} more in the ${T.profileLabel.toLowerCase()}</li>`}</ul>`}
              ${cases.filter(c=> T.caseTheme[c.type]!==cur.t.id).length? html`<h5>Other open cases</h5><ul class="vp-rl">${cases.filter(c=> T.caseTheme[c.type]!==cur.t.id).map(c=> html`<li key=${c.id}><button type="button" onClick=${()=> onCase(c.id)}>
                <span class="nm">${c.typeName}<small>${c.id} · ${c.stName}</small></span><b class="num">${c.amount? amt(c.amount) : ''}</b></button></li>`)}</ul>` : ''}</div></${Fragment}>`
            : html`<p class="faint">Nothing open for this ${n1}.</p>`}</section></div></div>`;
    }

    /* one anomaly on one record: full context, the recommendation, and the Resolve panel; the tower's document view follows */
    function DocWin({ q, th, fs, V0, onCase, onRec, onFull }){
      const res = RES()[q.id];
      const play = playOf(q.code), kind = T.issueKind? T.issueKind(q.code) : null, v = T.byId(q.ent), same = recsOfTheme(V0, q.code), atRec = same.filter(x=> x.ent===q.ent);
      const cases = T.cases(q.ent, fs).filter(c=> c.measure!=='closed' && T.caseLines && T.caseLines(c.id).includes(T.rawId? T.rawId(q.id) : q.id));
      const stage = T.issueStage? T.issueStage(q.code) : null;
      return html`<div class="dw">
        <section class=${'px-case-h dw-h'+(kind==='fin'? ' fin' : kind==='ctl'? ' ctl' : '')}><span class="ic"><${Icon} n="FileWarning" size=${22} strokeWidth=${1.6}/></span>
          <div class="tt"><div class="k">Anomaly · ${lab(q)}</div><h2>${T.issueName(q.code)}</h2><div class="m">${kind && html`<span class="px-pill">${KIND[kind]}</span>`}${th && html`<span class="px-pill">${th.name}</span>`}${stage && html`<span class="px-pill">${stage}</span>`}
            ${v && html`<button type="button" class="px-link sm" onClick=${()=> onRec(q.ent)}>${v.name}</button>`}</div></div>
          <dl class="px-case-f"><div><dt>Value</dt><dd>${q.val? amt(q.val) : '—'}</dd><small>This record</small></div><div><dt>At this ${n1}</dt><dd>${FCT.n(atRec.length)}</dd><small>records with this issue</small></div>
            <div><dt>Across the scope</dt><dd>${FCT.n(same.length)}</dd><small>${FCT.n(new Set(same.map(x=> x.ent)).size)} ${nP}</small></div><div><dt>Owner</dt><dd>${userName(res? res.owner : play.owner).split(' ')[0]}</dd><small>${userName(res? res.owner : play.owner)}</small></div></dl></section>
        ${P.AI && html`<${P.AI}>${(v? v.name+' has '+FCT.n(atRec.length)+' record'+(atRec.length===1? '' : 's')+' with this issue' : FCT.n(atRec.length)+' records have this issue')+(same.length>atRec.length? ', and '+FCT.n(same.length-atRec.length)+' more sit with other '+nP+' in scope' : '')+'. '+(kind==='ctl'? 'It is a control breach, so it counts against the health score until it is resolved or accepted.' : kind==='fin'? 'It carries money at risk, so act before the next payment or posting run.' : 'It slows the process; resolving it clears the queue behind it.')}</${P.AI}>`}
        <div class="dw-doc">${T.docView? T.docView(q.id, { onCase, onRec, theme:th && th.name, act:{ atRec:atRec.length, same:same.length, nEnt:new Set(same.map(x=> x.ent)).size, n1, nP } }) : ''}</div></div>`;
    }

    /* the full profile page: why the record surfaced, its issue themes, and the anomalies in every theme. Dense, nothing truncated. */
    function Profile({ id, f, onDoc, onCase }){
      const V0 = view(f), v = T.byId(id); if(!v) return html`<${P.Empty} text=${'This '+n1+' is not in the current scope.'}/>`;
      const r = T.risk(id), cases = T.cases(id, f).filter(c=> c.measure!=='closed'), res = RES();
      const mine = V0.themes.map(t=> ({ t, x:t.vendors.find(q=> q.v===id) })).filter(q=> q.x).sort((a,b)=> (a.t.md? 1 : 0)-(b.t.md? 1 : 0) || b.x.n-a.x.n);
      const ranked = V0.vs.slice().sort((a,b)=> (V0.sp[b.id]||0)-(V0.sp[a.id]||0)), rank = ranked.findIndex(x=> x.id===id)+1;
      const scores = V0.vs.map(x=> T.risk(x.id).score).sort((a,b)=> a-b), med = scores.length? scores[Math.floor(scores.length/2)] : null;
      const nIss = mine.filter(q=> !q.t.md).reduce((s2,q)=> s2+q.x.n, 0), top = mine.filter(q=> !q.t.md)[0];
      const fac = (T.factors? T.factors(id)||[] : []).filter(x=> x.v!=null && x.v>=40).sort((a,b)=> b.v-a.v).slice(0,3);
      const potential = cases.reduce((s2,c)=> s2+(c.amount||0), 0), [more, setMore] = useState({});
      const why = [
        { k:'risk', tone:r.cat, h:r.cat+' risk, score '+r.score, d:(r.why? r.why+'. ' : '')+(med!=null? 'Scope median '+med+'.' : ''), m:r.score },
        ...fac.map(x=> ({ k:'f'+(x.id||x.name), tone: x.v>=80? 'Critical' : x.v>=60? 'High' : 'Medium', h:x.name, d:x.why||'', m:x.v })),
        top && { k:'iss', tone:'High', h:FCT.n(nIss)+' records with issues in '+mine.filter(q=> !q.t.md).length+' theme'+(mine.filter(q=> !q.t.md).length===1? '' : 's'), d:'Most in '+top.t.name.toLowerCase()+': '+FCT.n(top.x.n)+' records'+(top.x.val? ', '+amt(top.x.val) : '')+'.', m:nIss },
        cases.length && { k:'cases', tone:'Critical', h:FCT.n(cases.length)+' open case'+(cases.length===1? '' : 's'), d:cases.slice(0,3).map(c=> c.typeName+(c.amount? ' '+amt(c.amount) : '')).join('; ')+(cases.length>3? '; and '+(cases.length-3)+' more' : '')+'.', m:T.noCaseSum? null : potential? amt(potential) : null },
        { k:'val', tone:'Low', h:'#'+rank+' of '+FCT.n(V0.vs.length)+' by '+T.valShort, d:fv(V0.sp[id]||0,1)+' '+T.valShort+(T.valWhen? ', '+T.valWhen(f) : '')+', '+pct(V0.tot? (V0.sp[id]||0)/V0.tot*100 : 0,1)+' of the scope.'+(V0.od[id]? ' '+T.secName+' '+fsec(V0.od[id])+'.' : ''), m:fv(V0.sp[id]||0,1) } ].filter(Boolean);
      const go = (q)=> q.id && onDoc(q.id), rowsOf = (t, x)=>{ const cs = cases.filter(c=> T.caseTheme[c.type]===t.id), rs = t.md? [] : x.recs.filter(q=> !(T.recCase && T.recCase(q))).slice().sort((a,b)=> b.val-a.val);
        return cs.map(c=> ({ case:true, key:c.id, id:c.id, label:c.id, name:c.typeName, val:c.amount, st:c.stName, go:()=> onCase(c.id) }))
          .concat(rs.map(q=> ({ key:q.id || q.name, id:q.id, label:lab(q), name:q.name, val:q.val, code:q.code, st: res[q.id]? 'Resolved' : 'Open · '+((T.issueKind? KIND[T.issueKind(q.code)] : '') || 'Operational'), done:!!res[q.id], go:()=> go(q) }))); };
      return html`<div class="pf">
        <header class="pf-h"><div class="pf-id"><p class="pf-sub"><b>${v.name}</b> · ${v.id} · ${T.sub(v)}</p><div class="tags"><${Tags} id=${id} big=${true}/></div></div>
          <dl class="pf-figs"><div><dt>${T.valName}${T.valWhen? ', '+T.valWhen(f) : ''}</dt><dd class="num">${fv(V0.sp[id]||0,1)}</dd></div><div><dt>${EXN}</dt><dd class=${'num'+(V0.ex[id]? ' bad' : '')}>${V0.ex[id]? amt(V0.ex[id]) : '—'}</dd></div>
            <div><dt>${T.secName}</dt><dd class="num">${V0.od[id]? fsec(V0.od[id]) : '—'}</dd></div><div><dt>Open cases</dt><dd class="num">${FCT.n(cases.length)}</dd></div><div><dt>Records with issues</dt><dd class="num">${FCT.n(nIss)}</dd></div></dl></header>
        <section class="pf-sec"><h3>Why ${v.name} surfaced</h3>
          <ul class="pf-why">${why.map(w=> html`<li key=${w.k}><i style=${{ background:P.RISK[w.tone] || 'var(--px-brand2)' }}/><div><b>${w.h}</b><span>${w.d}</span></div>${w.m!=null && html`<em class="num">${w.m}</em>`}</li>`)}</ul></section>
        <${Anoms} mine=${mine} rowsOf=${rowsOf}/></div>`;
    }
    /* the profile's anomalies: themes on the left, the chosen theme's anomalies on the right, filterable by issue type */
    function Anoms({ mine, rowsOf }){
      const [sel, setSel] = useState(null), [code, setCode] = useState(null), [all, setAll] = useState(false);
      const cur = mine.find(q=> q.t.id===sel) || mine[0];
      useEffect(()=>{ setCode(null); setAll(false); }, [cur && cur.t.id]);
      if(!cur) return html`<section class="pf-sec"><h3>Issue themes and anomalies</h3><p class="faint" style=${{ margin:0 }}>No issues for this ${n1} in the period.</p></section>`;
      const rows = rowsOf(cur.t, cur.x), codes = Object.entries(cur.x.codes||{}).sort((a,b)=> b[1]-a[1]);
      const fr = code? rows.filter(rw=> !rw.case && rw.code===code) : rows, shown = all? fr : fr.slice(0,10), mxV = Math.max(...fr.map(rw=> rw.val||0), .0001);
      const mxN = Math.max(...mine.map(q=> q.x.n), 1), nCase = rows.filter(rw=> rw.case).length, nDone = rows.filter(rw=> rw.done).length;
      const owner = (c)=> c && window.FCTPlay? userName(FCTPlay.get(T.tower, c).owner) : '—';
      return html`<section class="pf-sec pf-an"><h3>Issue themes and their anomalies <span class="faint">Choose a theme; open a row to see the record and act on it</span></h3>
        <div class="pf-an-b">
          <nav class="pf-an-nav" role="tablist" aria-label="Issue themes">${mine.map(({ t, x })=>{ const on = t.id===cur.t.id;
            return html`<button key=${t.id} type="button" role="tab" aria-selected=${on} class=${on? 'on' : ''} onClick=${()=> setSel(t.id)}>
              <span class="nm">${t.name}</span><b class="num">${t.md? x.n+(x.n===1? ' check' : ' checks') : FCT.n(x.n)}</b>
              <small>${t.md? 'Master-data checks failing' : (x.val? amt(x.val) : 'No value')+' · '+Object.keys(x.codes).length+' issue type'+(Object.keys(x.codes).length===1? '' : 's')}</small>
              ${!t.md && html`<span class="bar"><em style=${{ width:(x.n/mxN*100)+'%' }}/></span>`}</button>`; })}</nav>
          <div class="pf-an-d" role="tabpanel" aria-label=${cur.t.name}>
            <header><div><h4>${cur.t.name}</h4><p>${cur.t.why}.</p></div>
              <dl>${!cur.t.md && html`<div><dt>Records</dt><dd class="num">${FCT.n(cur.x.n)}</dd></div><div><dt>Value</dt><dd class="num">${cur.x.val? amt(cur.x.val) : '—'}</dd></div>`}
                <div><dt>Open cases</dt><dd class="num">${FCT.n(nCase)}</dd></div><div><dt>Resolved</dt><dd class=${'num'+(nDone? ' ok' : '')}>${FCT.n(nDone)}</dd></div></dl></header>
            ${cur.t.md? html`<ul class="pf-md">${cur.x.recs.map((q,i)=> html`<li key=${i}>${q.name}</li>`)}</ul>` : html`<${Fragment}>
            <div class="pf-codes" role="group" aria-label="Filter by issue type"><button type="button" class=${!code? 'on' : ''} onClick=${()=> setCode(null)}>All <b class="num">${FCT.n(rows.length)}</b></button>
              ${codes.map(([c,n])=> html`<button key=${c} type="button" class=${code===c? 'on' : ''} onClick=${()=> setCode(code===c? null : c)}><i class=${'k-'+((T.issueKind && T.issueKind(c))||'ops')}/>${T.issueName(c)} <b class="num">${FCT.n(n)}</b></button>`)}</div>
            <table class="pf-t pf-t2"><thead><tr><th class="r">#</th><th>Record</th><th>Issue</th><th class="r">Value</th><th>Status</th><th>Owner</th><th><span class="sr">Open</span></th></tr></thead>
              <tbody>${shown.map((rw,i)=> html`<tr key=${rw.key} class=${rw.case? 'case' : rw.done? 'done' : ''} tabIndex="0" onClick=${rw.go} onKeyDown=${(e)=>{ if(e.key==='Enter'){ e.preventDefault(); rw.go(); } }}>
                <td class="r num faint">${i+1}</td><td class="num rec">${rw.case && html`<span class="pf-c">Case</span>`}${rw.label}</td><td>${rw.name}</td>
                <td class="r val"><span class="num">${rw.val? amt(rw.val) : '—'}</span>${rw.val? html`<i class="vb"><em style=${{ width:(rw.val/mxV*100)+'%' }}/></i>` : ''}</td>
                <td class="st"><span class=${'pf-st '+(rw.done? 's-ok' : rw.case? 's-case' : 's-'+((rw.code && T.issueKind && T.issueKind(rw.code))||'ops'))}>${rw.st}</span></td>
                <td class="ow">${rw.case? '—' : owner(rw.code)}</td><td class="go"><span class="btn sm">Open<${Icon} n="ChevronRight" size=${13}/></span></td></tr>`)}</tbody></table>
            ${fr.length>10 && html`<button type="button" class="px-link sm pf-more" onClick=${()=> setAll(!all)}>${all? 'Show the top 10' : 'Show all '+FCT.n(fr.length)}</button>`}</${Fragment}>`}</div></div></section>`;
    }

    /* records × columns heat, for a tower whose columns are not its UI kit's chain stages (T.heatCols) */
    const HeatG = ({ rows, onRow })=>{ if(!rows.length) return html`<${P.Empty}/>`; const mx = Math.max(...rows.flatMap(r=> r.cells.map(c=> c.val))) || 1, cs = T.heatCols;
      return html`<div class="px-heat" role="table" aria-label=${'Open items by '+n1+' and '+(T.heatColName||'column')}>
        <div class="hr hh" role="row"><span role="columnheader">${Ns}</span>${cs.map(c=> html`<span key=${c.id} role="columnheader" title=${c.name}>${c.short}</span>`)}<span role="columnheader" class="r">Total</span></div>
        ${rows.map(r=> html`<div key=${r.v} class="hr" role="row"><span role="rowheader"><button type="button" class="px-link" onClick=${()=> onRow(r.v)}>${r.name}</button></span>
          ${r.cells.map(c=> html`<span key=${c.stage} role="cell"><button type="button" class="cell" disabled=${!c.n} style=${{ background:P.heatColor(c.val, mx), color:c.val/mx > .3? '#fff' : COL.ink }}
            title=${c.n+' '+(T.stageUnit||'records')} aria-label=${r.name+', '+(cs.find(x=> x.id===c.stage)||{}).name+': '+c.n} onClick=${()=> onRow(r.v)}>${c.n? FCT.n(c.n) : ''}</button></span>`)}
          <span role="cell" class="r num">${fv(r.total)}</span></div>`)}
        <div class="px-heat-k" aria-hidden="true"><span>Fewer</span>${(P.ramp||[]).map((c,i)=> html`<i key=${i} style=${{background:c}}/>`)}<span>More</span></div></div>`; };

    /* where the records in scope are: the map fits the scope — the world on All, a region when chosen, a city when picked.
       World view: one bubble per region. Zoomed in: one point per record around its city, with a detail tooltip. */
    const esri = (dark)=>{ const u = (id)=> 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/'+id+'/MapServer/tile/{z}/{y}/{x}', o = { attribution:'Tiles &copy; Esri', maxZoom:12, minZoom:1 };
      return [L.tileLayer(u(dark? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'), o)]; };
    const tone = (hi)=> hi>=.4? 'var(--px-crit)' : hi>=.15? 'var(--px-high)' : 'var(--px-brand2, #4FB3A3)';
    const toneOf = (el, v)=>{ const p = document.createElement('span'); p.style.color = v; el.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    const spot = (c, i, n, z)=>{ if(n<2) return [c.lat, c.lng]; const px = 360/(256*Math.pow(2, z||5)), a = i*2.399963, d = (8 + 7.5*Math.sqrt(i))*px;   /* spacing in screen pixels at this zoom */
      return [c.lat + d*Math.sin(a), c.lng + d*Math.cos(a)/Math.cos(c.lat*Math.PI/180)]; };
    const RISKC = { Critical:'var(--px-crit)', High:'var(--px-high)', Medium:'var(--px-medium, #D9B65A)', Low:'var(--px-lowc, #8FA39E)' };
    function Geo({ V0, fs, city, setCity, sel, setSel }){
      const host = useRef(null), mapRef = useRef(null), layerRef = useRef(null), [zoom, setZoom] = useState(2), topTheme = topThemeOf(V0);
      const cities = {}; V0.vs.forEach(v=>{ if(!v.geo) return; const k = v.geo.city, c = cities[k] = cities[k] || { city:k, region:v.geo.region, lat:v.geo.lat, lng:v.geo.lng, n:0, sp:0, hi:0, vs:[] };
        const s2 = V0.sp[v.id]||0; c.n++; c.sp += s2; c.vs.push(v); if(HI(T.risk(v.id).cat)) c.hi += s2; });
      const cityList = Object.values(cities), regs0 = {};
      cityList.forEach(c=>{ const r = regs0[c.region] = regs0[c.region] || { city:c.region, region:c.region, isReg:true, lat:0, lng:0, n:0, sp:0, hi:0, k:0 };
        r.n += c.n; r.sp += c.sp; r.hi += c.hi; r.lat += c.lat*c.n; r.lng += c.lng*c.n; r.k += c.n; });
      Object.values(regs0).forEach(r=>{ r.lat /= r.k; r.lng /= r.k; });
      const points = zoom >= 4, byRegion = !points && Object.keys(regs0).length>1, list = byRegion? Object.values(regs0) : cityList;
      const mx = Math.max(...list.map(c=> c.sp), .01), vmx = Math.max(...V0.vs.map(v=> V0.sp[v.id]||0), .01), selCity = sel && T.byId(sel) && T.byId(sel).geo? T.byId(sel).geo.city : null;
      const sig = (points? 'p'+Math.round(zoom) : byRegion? 'r' : 'c')+'#'+cityList.map(c=> c.city+':'+c.n+':'+c.sp.toFixed(1)).join('|')+'#'+(city||'')+'#'+(sel||'');
      const fitSig = cityList.map(c=> c.city).join('|')+'#'+(city||'');
      const fit = ()=>{ const map = mapRef.current; if(!map || !cityList.length) return; const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const focus = city? cityList.filter(c=> c.city===city || c.region===city) : null;
        if(focus && focus.length===1) return map.flyTo([focus[0].lat, focus[0].lng], 8, { duration: rm? 0 : .8 });
        map.flyToBounds(L.latLngBounds((focus && focus.length? focus : cityList).map(c=> [c.lat, c.lng])), { padding:[30,30], maxZoom:6, duration: rm? 0 : .8 }); };
      useEffect(()=>{ if(!host.current || !window.L) return;
        const map = L.map(host.current, { zoomControl:false, worldCopyJump:false, scrollWheelZoom:false, doubleClickZoom:false, boxZoom:false, keyboard:false, minZoom:1, maxZoom:10 }).setView([20, 40], 1.6);
        L.control.zoom({ position:'bottomright' }).addTo(map); map.attributionControl.setPrefix(false);
        const paint = ()=>{ const dark = !document.body.classList.contains('theme-light'), k = dark? 'd' : 'l'; if(map._k===k) return; (map._t||[]).forEach(l=> map.removeLayer(l)); map._k = k; map._t = esri(dark); map._t.forEach(l=> l.addTo(map)); };
        paint(); const obs = new MutationObserver(paint); obs.observe(document.body, { attributes:true, attributeFilter:['class'] });
        map.on('zoomend', ()=> setZoom(map.getZoom()));
        mapRef.current = map; layerRef.current = L.layerGroup().addTo(map);
        const kick = ()=> map.invalidateSize(); const t = setTimeout(()=>{ kick(); fit(); }, 160); window.addEventListener('resize', kick);
        return ()=>{ clearTimeout(t); window.removeEventListener('resize', kick); obs.disconnect(); map.remove(); mapRef.current = null; };
      }, []);
      useEffect(()=>{ fit(); }, [fitSig]);
      const tipV = (v)=>{ const r = T.risk(v.id), tt = topTheme[v.id], sp = V0.sp[v.id]||0;
        return '<div class="vp-tip"><b>'+FCT.esc(v.name)+'</b><span class="sub">'+FCT.esc(v.id)+' · '+FCT.esc(v.geo.city)+(T.seg(v.id)? ' · '+FCT.esc((T.segs.find(g=> g.id===T.seg(v.id))||{}).label || T.seg(v.id)) : '')+'</span>'
          +'<span class="row"><span>Risk</span><b style="color:'+toneOf(host.current, RISKC[r.cat])+'">'+FCT.esc(r.cat)+' '+r.score+'</b></span>'
          +'<span class="row"><span>'+FCT.esc(T.valName)+'</span><b>'+FCT.esc(fv(sp,1))+' · '+FCT.esc(pct(V0.tot? sp/V0.tot*100 : 0,1))+'</b></span>'
          +'<span class="row"><span>'+FCT.esc(EXN)+'</span><b>'+FCT.esc(V0.ex[v.id]? amt(V0.ex[v.id]) : '—')+'</b></span>'
          +(tt? '<span class="row"><span>Most frequent issue</span><b>'+FCT.esc(tt.name)+'</b></span>' : '')+'<span class="hint">Click to select in the list</span></div>'; };
      const tipC = (c)=> '<div class="vp-tip"><b>'+FCT.esc(c.city)+'</b><span class="sub">'+(c.isReg? 'Region' : FCT.esc(c.region))+'</span>'
        +'<span class="row"><span>'+Nn+'</span><b>'+c.n+'</b></span><span class="row"><span>'+FCT.esc(T.valName)+'</span><b>'+FCT.esc(fv(c.sp,1))+'</b></span>'
        +'<span class="row"><span>High-risk share</span><b>'+Math.round((c.sp? c.hi/c.sp : 0)*100)+'%</b></span><span class="hint">Click to zoom in</span></div>';
      useEffect(()=>{ const map = mapRef.current, layer = layerRef.current; if(!map || !layer) return; layer.clearLayers();
        const kc = toneOf(host.current, 'var(--kc, #E0B25A)');
        if(points){
          cityList.forEach(c=> c.vs.slice().sort((a,b)=> (V0.sp[b.id]||0)-(V0.sp[a.id]||0)).forEach((v,i)=>{ const r = T.risk(v.id), col = toneOf(host.current, RISKC[r.cat]), on = sel===v.id;
            const m = L.circleMarker(spot(c, i, c.vs.length, zoom), { radius:(on? 2 : 0) + 4 + Math.sqrt((V0.sp[v.id]||0)/vmx)*9, color:on? kc : 'rgba(255,255,255,.75)', weight:on? 3 : 1, fillColor:col, fillOpacity:.9 });
            m.bindTooltip(tipV(v), { direction:'auto', className:'px-cmap-tip vp-tipw', opacity:1, offset:[6,0] });
            m.on('click', ()=> setSel(v.id)); m.addTo(layer); if(on) m.bringToFront(); }));
        } else list.slice().sort((a,b)=> b.sp-a.sp).forEach(c=>{ const r = (c.isReg? 9 : 5) + Math.sqrt(c.sp/mx)*(c.isReg? 22 : 17), hh = c.sp? c.hi/c.sp : 0, col = toneOf(host.current, tone(hh)), on = city===c.city || selCity===c.city, dim = city && city!==c.city && city!==c.region;
          const m = L.circleMarker([c.lat, c.lng], { radius:r, color:on? kc : col, weight:on? 3 : 1.2, opacity:.95, fillColor:col, fillOpacity: dim? .1 : .32 });
          m.bindTooltip(tipC(c), { direction:'auto', className:'px-cmap-tip vp-tipw', opacity:1, offset:[6,0] });
          m.on('click', ()=> setCity(city===c.city? null : c.city)); m.addTo(layer); });
      }, [sig]);
      return html`<div class="vp-geo"><div class="hd"><h3>Where they are</h3>${city? html`<button type="button" class="px-link sm" onClick=${()=> setCity(null)}>Show all</button>`
          : html`<span class="faint">${Object.keys(regs0).length} region${Object.keys(regs0).length===1? '' : 's'} · ${cityList.length} cit${cityList.length===1? 'y' : 'ies'}</span>`}</div>
        ${window.L? html`<div class="vp-geo-map" ref=${host} role="img" aria-label=${'Map of '+cityList.length+' cities with '+nP+' in scope'}/>` : html`<${P.Empty} text="The map could not be loaded."/>`}
        <div class="vp-geo-k" aria-hidden="true">${points? html`${RISKS.map(c=> html`<span key=${c}><i style=${{ background:RISKC[c] }}/>${c}</span>`)}<span class="faint">Each point is ${a1(n1)}; size is ${T.valShort}</span>`
          : html`<span><i style=${{ background:tone(0) }}/>Mostly low risk</span><span><i style=${{ background:tone(.2) }}/>15–40% high risk</span><span><i style=${{ background:tone(.5) }}/>40%+ high risk</span><span class="faint">Size is ${T.valShort} · zoom in for ${nP}</span>`}</div></div>`;
    }

    /* the map stage (opt-in with T.mapStage): a full-width MapLibre map under the command bar, with the scope, the record explorer and the
       legend laid over it. One selection is shared by the explorer, the map and the brief; picking a record flies the map to it.
       World view clusters records by place (sized by value, coloured by high-risk share); zooming in breaks clusters into records. */
    const STYLE = (light)=> 'https://basemaps.cartocdn.com/gl/'+(light? 'positron' : 'dark-matter')+'-gl-style/style.json';
    const FONT = ['Montserrat SemiBold','Open Sans Bold','Noto Sans Regular','Noto Sans CJK JP Regular'];
    const isLight = ()=> document.body.classList.contains('theme-light');
    const EASE = (t)=> t<.5? 4*t*t*t : 1-Math.pow(-2*t+2, 3)/2;   /* ease-in-out cubic for every camera move */
    /* the base map re-tinted to the app's palette: teal-black land, deep teal water, amber borders, teal roads */
    const TINT = { d:{ bg:'#0C1615', land:'#0F1B1A', water:'#0A2329', way:'#1C4650', bdr:'rgba(224,178,90,.42)', bdrGlow:'rgba(79,179,163,.10)', state:'rgba(79,179,163,.22)',
        road:'rgba(79,179,163,.30)', roadMin:'rgba(79,179,163,.14)', txt:'#C9DCD8', txt2:'#7FA39C', halo:'#0A1312', sea:'#3D6E77' },
      l:{ bg:'#EEF3F1', land:'#E9F0EE', water:'#CBE2E5', way:'#A9CDD3', bdr:'rgba(163,123,44,.55)', bdrGlow:'rgba(46,127,116,.10)', state:'rgba(46,127,116,.28)',
        road:'rgba(46,127,116,.28)', roadMin:'rgba(46,127,116,.12)', txt:'#2F4441', txt2:'#5E7773', halo:'#F6F9F8', sea:'#6F9CA3' } };
    const tint = (map, light)=>{ const P2 = TINT[light? 'l' : 'd'], set = (id, k, v)=>{ try{ map.setPaintProperty(id, k, v); }catch(e){} };
      (map.getStyle().layers||[]).forEach(l=>{ const id = l.id;
        if(l.type==='background') set(id, 'background-color', P2.bg);
        else if(l.type==='fill' && /^(landcover|landuse|park)/.test(id)) set(id, 'fill-color', P2.land);
        else if(l.type==='fill' && id==='water') set(id, 'fill-color', P2.water);
        else if(id==='waterway') set(id, 'line-color', P2.way);
        else if(id==='boundary_country_inner'){ set(id, 'line-color', P2.bdr); set(id, 'line-dasharray', [3, 2]); }
        else if(id==='boundary_country_outline'){ set(id, 'line-color', P2.bdrGlow); set(id, 'line-opacity', 1); }
        else if(id==='boundary_state') set(id, 'line-color', P2.state);
        else if(l.type==='line' && /^(road|bridge|tunnel)_(pri|trunk|mot|sec)_fill/.test(id)) set(id, 'line-color', P2.road);
        else if(l.type==='line' && /^(road|bridge|tunnel)_(minor|service)_fill/.test(id)) set(id, 'line-color', P2.roadMin);
        else if(l.type==='symbol' && /^watername_(ocean|sea)/.test(id)) set(id, 'text-color', P2.sea);
        else if(l.type==='symbol' && /^place_(country|continent|state)/.test(id)){ set(id, 'text-color', P2.txt2); set(id, 'text-halo-color', P2.halo); }
        else if(l.type==='symbol' && /^place_/.test(id)){ set(id, 'text-color', P2.txt); set(id, 'text-halo-color', P2.halo); set(id, 'text-halo-width', 1.2); } }); };
    const jitter = (c, i, n)=>{ if(n<2) return [c.lng, c.lat]; const a = i*2.399963, d = .03*Math.sqrt(i+1);   /* a golden-angle spiral, about 20 px apart at zoom 10 */
      return [c.lng + d*Math.cos(a)/Math.cos(c.lat*Math.PI/180), c.lat + d*Math.sin(a)]; };
    const MSORT = [['val', T.valName],['risk','Risk'],['exposure','Exposure']];
    function MapStage({ items, fs, setScope, V0, sel, setSel, onFind, onOpen, onDetail }){
      const host = useRef(null), mapRef = useRef(null), dataRef = useRef(null), popRef = useRef(null), selPop = useRef(null), listRef = useRef(null), selRef = useRef(sel);
      const [ready, setReady] = useState(false), [err, setErr] = useState(!window.maplibregl), [sort, setSort] = useState('val'), [hide, setHide] = useState(false), [globe, setGlobe] = useState(false);
      const globeRef = useRef(globe); globeRef.current = globe;
      const [hud, setHud] = useState({ n:0, labels:[], ret:null }), [moving, setMoving] = useState(true), [at, setAt] = useState(null), needRef = useRef(true), hudRef = useRef(null), meas = useRef(null);
      const sc = scopeOf(fs), T2 = FCTMap.tiers(items, RISKS, T.regions, T.segs, sc), any = ['pRisk','pGeo','pSeg'].some(k=> sc[k] && sc[k]!=='All');
      const topTheme = topThemeOf(V0), vmx = Math.max(...V0.vs.map(v=> V0.sp[v.id]||0), .01);
      const key = { val:(v)=> -(V0.sp[v.id]||0), risk:(v)=> -T.risk(v.id).score, exposure:(v)=> -(V0.ex[v.id]||0) };
      const rows = V0.vs.slice().sort((a,b)=> key[sort](a)-key[sort](b)), mx = Math.max(...rows.map(v=> V0.sp[v.id]||0), .01);
      selRef.current = sel;
      /* one feature per record, spread around its city so records in the same place can be told apart */
      const geo = ()=>{ const byC = {}; V0.vs.forEach(v=>{ if(v.geo) (byC[v.geo.city] = byC[v.geo.city] || []).push(v); });
        const feats = []; Object.values(byC).forEach(list=> list.sort((a,b)=> (V0.sp[b.id]||0)-(V0.sp[a.id]||0)).forEach((v,i)=>{ const r = T.risk(v.id), s2 = V0.sp[v.id]||0;
          feats.push({ type:'Feature', geometry:{ type:'Point', coordinates:jitter(v.geo, i, list.length) },
            properties:{ id:v.id, name:v.name, cat:r.cat, score:r.score, sp:s2, w:Math.sqrt(s2/vmx), hi:HI(r.cat)? s2 : 0, city:v.geo.city, region:v.geo.region } }); }));
        return { type:'FeatureCollection', features:feats }; };
      const fc = geo(); dataRef.current = fc;
      const where = (id)=>{ const f2 = dataRef.current.features.find(x=> x.properties.id===id); return f2 && f2.geometry.coordinates; };
      /* the overlays cover the map's edges: keep the camera inside the clear part */
      const pad = ()=>{ const el = host.current; if(!el || hide || el.clientWidth < 900) return { top:70, bottom:50, left:50, right:50 };
        const sp2 = el.parentNode.querySelector('.ms-scope'), lp = el.parentNode.querySelector('.ms-list');
        return { top:(sp2? sp2.offsetHeight : 0) + 40, bottom:64, left:50, right:(lp? lp.offsetWidth : 0) + 50 }; };
      const rm = ()=> matchMedia('(prefers-reduced-motion: reduce)').matches;
      const fit = ()=>{ const map = mapRef.current, fs2 = dataRef.current.features; if(!map || !fs2.length) return;
        const b = new maplibregl.LngLatBounds(); fs2.forEach(x=> b.extend(x.geometry.coordinates));
        map.fitBounds(b, { padding:pad(), maxZoom:5.5, linear:false, curve:1.3, duration: rm()? 0 : 1600, easing:EASE }); };
      const project = (map)=>{ try{ map.setProjection({ type:globeRef.current? 'globe' : 'mercator' }); }catch(e){} };
      const flyTo = (id)=>{ const map = mapRef.current, c = where(id); if(!map || !c) return;
        map.flyTo({ center:c, zoom:Math.max(9.6, map.getZoom()), padding:pad(), curve:1.5, duration: rm()? 0 : 2200, easing:EASE }); };
      const tip = (p)=>{ const tt = topTheme[p.id];
        return '<div class="vp-tip"><b>'+FCT.esc(p.name)+'</b><span class="sub">'+FCT.esc(p.id)+' · '+FCT.esc(p.city)+', '+FCT.esc(p.region)+'</span>'
          +'<span class="row"><span>Risk</span><b>'+FCT.esc(p.cat)+' '+p.score+'</b></span><span class="row"><span>'+FCT.esc(T.valName)+'</span><b>'+FCT.esc(fv(p.sp,1))+'</b></span>'
          +'<span class="row"><span>'+FCT.esc(EXN)+'</span><b>'+FCT.esc(V0.ex[p.id]? amt(V0.ex[p.id]) : '—')+'</b></span>'+(tt? '<span class="row"><span>Most frequent issue</span><b>'+FCT.esc(tt.name)+'</b></span>' : '')
          +'<span class="hint">Click to select</span></div>'; };
      const tipCl = (p)=> '<div class="vp-tip"><b>'+FCT.n(p.point_count)+' '+FCT.esc(nP)+'</b><span class="row"><span>'+FCT.esc(T.valName)+'</span><b>'+FCT.esc(fv(p.sp,1))+'</b></span>'
        +'<span class="row"><span>High-risk share</span><b>'+Math.round((p.sp? p.hi/p.sp : 0)*100)+'%</b></span><span class="hint">Click to zoom in</span></div>';
      const tipRef = useRef(tip); tipRef.current = tip;
      /* layers go on after every style load (first load and each light/dark switch) */
      const addLayers = (map)=>{ const col = (v)=> toneOf(host.current, v), kc = col('var(--kc, #E0B25A)'), ink = isLight()? '#0E1B19' : '#E8EFED', halo = isLight()? 'rgba(255,255,255,.92)' : 'rgba(6,11,10,.9)';
        const rc = ['match', ['get','cat']].concat(...RISKS.map(c=> [c, col(RISKC[c])]), [col(RISKC.Low)]);
        const share = ['/', ['get','hi'], ['max', ['get','sp'], .0001]], tc = ['step', share, col(tone(0)), .15, col(tone(.2)), .4, col(tone(.5))];
        project(map); tint(map, isLight());
        /* accents under the data: a spend-density glow (teal to amber to red as value and risk build up) and a soft halo on high-risk vendors */
        map.addSource('recs-h', { type:'geojson', data:dataRef.current });
        map.addLayer({ id:'heat', type:'heatmap', source:'recs-h', maxzoom:11, paint:{
          'heatmap-weight':['+', ['*', .6, ['get','w']], ['case', ['>', ['get','hi'], 0], .5, 0]], 'heatmap-intensity':['interpolate', ['linear'], ['zoom'], 1, .9, 9, 1.6],
          'heatmap-radius':['interpolate', ['linear'], ['zoom'], 1, 22, 5, 38, 9, 70], 'heatmap-opacity':['interpolate', ['linear'], ['zoom'], 1, .75, 8, .55, 11, 0],
          'heatmap-color':['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', .15, isLight()? 'rgba(46,127,116,.16)' : 'rgba(79,179,163,.18)',
            .45, isLight()? 'rgba(46,127,116,.32)' : 'rgba(79,179,163,.34)', .7, isLight()? 'rgba(176,138,30,.40)' : 'rgba(224,178,90,.42)', 1, isLight()? 'rgba(180,35,24,.42)' : 'rgba(242,139,128,.5)'] } });
        map.addSource('recs', { type:'geojson', data:dataRef.current, cluster:true, clusterMaxZoom:7, clusterRadius:44, clusterProperties:{ sp:['+', ['get','sp']], hi:['+', ['get','hi']] } });
        const rad = (lo, hi2)=> ['interpolate', ['linear'], ['sqrt', ['get','sp']], 0, lo, 30, hi2, 120, hi2*1.6];
        map.addLayer({ id:'cl-halo', type:'circle', source:'recs', filter:['has','point_count'], paint:{ 'circle-color':tc, 'circle-opacity':.18, 'circle-radius':rad(18, 40), 'circle-blur':.35 } });
        map.addLayer({ id:'cl', type:'circle', source:'recs', filter:['has','point_count'], paint:{ 'circle-color':tc, 'circle-opacity':.85, 'circle-radius':rad(11, 24), 'circle-stroke-color':halo, 'circle-stroke-width':1.5 } });
        map.addLayer({ id:'cl-n', type:'symbol', source:'recs', filter:['has','point_count'], layout:{ 'text-field':['to-string', ['get','point_count']], 'text-font':FONT, 'text-size':12.5, 'text-allow-overlap':true },
          paint:{ 'text-color':isLight()? '#FFFFFF' : '#0B1211' } });
        map.addLayer({ id:'pt-glow', type:'circle', source:'recs', filter:['all', ['!', ['has','point_count']], ['in', ['get','cat'], ['literal', ['Critical','High']]]],
          paint:{ 'circle-color':rc, 'circle-opacity':.28, 'circle-blur':.8, 'circle-radius':['interpolate', ['linear'], ['zoom'], 4, ['+', 10, ['*', 8, ['get','w']]], 10, ['+', 18, ['*', 18, ['get','w']]]] } });
        map.addLayer({ id:'pt', type:'circle', source:'recs', filter:['!', ['has','point_count']], paint:{ 'circle-color':rc, 'circle-opacity':.92,
          'circle-radius':['interpolate', ['linear'], ['zoom'], 4, ['+', 3.5, ['*', 6, ['get','w']]], 10, ['+', 6, ['*', 13, ['get','w']]]], 'circle-stroke-color':halo, 'circle-stroke-width':1.2 } });
        map.addLayer({ id:'pt-sel', type:'circle', source:'recs', filter:['==', ['get','id'], selRef.current||''], paint:{ 'circle-color':'rgba(0,0,0,0)', 'circle-stroke-color':kc, 'circle-stroke-width':3,
          'circle-radius':['interpolate', ['linear'], ['zoom'], 4, ['+', 8, ['*', 6, ['get','w']]], 10, ['+', 11, ['*', 13, ['get','w']]]] } });
        };
      useEffect(()=>{ if(!host.current || !window.maplibregl) return;
        let map; try{ map = new maplibregl.Map({ container:host.current, style:STYLE(isLight()), center:[60, 18], zoom:1.5, minZoom:1, maxZoom:13, attributionControl:{ compact:true }, cooperativeGestures:true }); }
        catch(e){ setErr(true); return; }
        map.addControl(new maplibregl.NavigationControl({ visualizePitch:false, showCompass:false }), 'bottom-right');
        /* smooth zooms: the + and − buttons and double-click glide instead of stepping; the wheel (with Ctrl or ⌘) zooms in finer steps */
        ['zoomIn','zoomOut'].forEach(k=>{ const f0 = map[k].bind(map); map[k] = (o, e)=> f0(Object.assign({ duration: rm()? 0 : 650, easing:EASE }, o||{}), e); });
        const zt = map.zoomTo.bind(map); map.zoomTo = (z, o, e)=> zt(z, Object.assign({ duration: rm()? 0 : 650, easing:EASE }, o||{}), e);
        map.scrollZoom.setWheelZoomRate(1/650); map.scrollZoom.setZoomRate(1/160);
        let first = true;
        map.on('style.load', ()=>{ addLayers(map); setReady(true); needRef.current = true; map.triggerRepaint(); if(first){ first = false; fit(); } });
        map.on('movestart', ()=> setMoving(true));
        map.on('moveend', ()=>{ needRef.current = true; const c = map.getCenter(); setAt({ lat:c.lat, lng:c.lng, z:map.getZoom() }); });
        map.on('idle', ()=>{ if(!needRef.current) return; needRef.current = false; hudRef.current && hudRef.current(); setMoving(false); });
        map.on('error', (e)=>{ if(!map.isStyleLoaded() && /style|Failed to fetch/i.test(String(e && e.error && e.error.message))) setErr(true); });
        const pop = popRef.current = new maplibregl.Popup({ closeButton:false, closeOnClick:false, className:'ms-pop', offset:12, maxWidth:'300px' });
        /* the hover card opens toward the clear part of the map, away from the explorer and the scope band */
        const aim = (pt)=>{ const el = host.current, W = el.clientWidth, H = el.clientHeight, lp = el.parentNode.querySelector('.ms-list'), sp2 = el.parentNode.querySelector('.ms-scope');
          const right = W - (lp && lp.offsetParent? lp.offsetWidth + 24 : 0), top = sp2 && sp2.offsetParent? sp2.offsetHeight + 24 : 0;
          return (pt.y - top < 190? 'top' : pt.y > H - 190? 'bottom' : '') + (pt.x > right - 320? (pt.y - top < 190 || pt.y > H - 190? '-right' : 'right') : (pt.y - top < 190 || pt.y > H - 190? '-left' : 'left')); };
        const show = (f2, htm)=>{ map.getCanvas().style.cursor = 'pointer'; pop.options.anchor = aim(map.project(f2.geometry.coordinates)); pop.setLngLat(f2.geometry.coordinates).setHTML(htm).addTo(map); };
        map.on('mousemove', 'pt', (e)=> show(e.features[0], tipRef.current(e.features[0].properties)));
        map.on('mousemove', 'cl', (e)=> show(e.features[0], tipCl(e.features[0].properties)));
        ['pt','cl'].forEach(l=> map.on('mouseleave', l, ()=>{ map.getCanvas().style.cursor = ''; pop.remove(); }));
        map.on('click', 'pt', (e)=>{ pop.remove(); setSel(e.features[0].properties.id); });
        map.on('click', 'cl', async (e)=>{ pop.remove(); const f2 = e.features[0], src = map.getSource('recs');
          try{ const z = await src.getClusterExpansionZoom(f2.properties.cluster_id); map.flyTo({ center:f2.geometry.coordinates, zoom:z+.3, curve:1.2, duration: rm()? 0 : 1300, easing:EASE }); }catch(x){} });
        const obs = new MutationObserver(()=>{ const k = isLight()? 'l' : 'd'; if(map._fk===k) return; map._fk = k; map.setStyle(STYLE(k==='l'), { diff:false }); });
        map._fk = isLight()? 'l' : 'd'; obs.observe(document.body, { attributes:true, attributeFilter:['class'] });
        mapRef.current = map; const kick = ()=> map.resize(); window.addEventListener('resize', kick);
        return ()=>{ window.removeEventListener('resize', kick); obs.disconnect(); map.remove(); mapRef.current = null; };
      }, []);
      /* data and camera follow the scope; the camera follows the selection */
      const sig = fc.features.map(x=> x.properties.id+':'+x.properties.sp.toFixed(2)).join('|'), fitSig = fc.features.map(x=> x.properties.id).join('|');
      useEffect(()=>{ const map = mapRef.current, src = map && ready && map.getSource('recs'); if(src){ src.setData(dataRef.current); map.getSource('recs-h') && map.getSource('recs-h').setData(dataRef.current); needRef.current = true; map.triggerRepaint(); } }, [sig, ready]);
      useEffect(()=>{ const map = mapRef.current; if(map && ready){ needRef.current = true; map.triggerRepaint(); } }, [hide]);
      /* the HUD: callout labels with leader lines for the records and clusters in view, placed greedily by value so they never overlap
         each other or the panels; the selected record gets a lock-on reticle and a full readout. Recomputed when the camera settles. */
      const tw = (t, font)=>{ const c = meas.current = meas.current || document.createElement('canvas').getContext('2d'); c.font = font; return c.measureText(t).width; };
      /* a cluster is named by its city when it holds one city, else by its region (plus its biggest city when that region is already named) */
      const placeOf = (c, z, used)=>{ const rad = 46*360/(512*Math.pow(2, z)), by = {}; let reg = null, d = 1e9;
        dataRef.current.features.forEach(x=>{ const g = x.geometry.coordinates, e = Math.hypot(g[0]-c[0], g[1]-c[1]); if(e<d){ d = e; reg = x.properties.region; }
          if(e <= rad*1.6) by[x.properties.city] = (by[x.properties.city]||0) + x.properties.sp; });
        const cs = Object.entries(by).sort((a,b)=> b[1]-a[1]); if(cs.length===1) return cs[0][0];
        return used.has(reg) && cs.length? reg+' · '+cs[0][0] : reg; };
      hudRef.current = ()=>{ const map = mapRef.current, el = host.current; if(!map || !el || !map.getLayer('pt')) return;
        const W = el.clientWidth, H = el.clientHeight, bx = el.getBoundingClientRect();
        const obst = [...el.parentNode.querySelectorAll('.ms-pane, .ms-tools, .maplibregl-ctrl-bottom-right .maplibregl-ctrl')].filter(n=> n.offsetParent).map(n=>{ const r = n.getBoundingClientRect();
          return { x:r.left-bx.left-8, y:r.top-bx.top-8, w:r.width+16, h:r.height+16 }; }).filter(o=> o.w < W*.9 || o.h < H*.9);
        const hit = (a, b)=> a.x < b.x+b.w && b.x < a.x+a.w && a.y < b.y+b.h && b.y < a.y+a.h;
        const free = (p)=> p.x>=8 && p.y>=8 && p.x<=W-8 && p.y<=H-8 && !obst.some(o=> hit({ x:p.x, y:p.y, w:1, h:1 }, o));
        const seen = new Set(), cand = [];
        map.queryRenderedFeatures({ layers:['pt','cl'] }).forEach(f2=>{ const q = f2.properties, k = q.cluster? 'c'+q.cluster_id : q.id; if(seen.has(k)) return; seen.add(k);
          const pt = map.project(f2.geometry.coordinates); if(!free(pt)) return;
          cand.push({ k, cl:!!q.cluster, q, c:f2.geometry.coordinates, x:pt.x, y:pt.y, sel:q.id && q.id===selRef.current, pri: q.id && q.id===selRef.current? 1e9 : q.cluster? 1e6+q.sp : q.sp }); });
        cand.sort((a,b)=> b.pri-a.pri);
        const taken = cand.map(c=> ({ x:c.x-7, y:c.y-7, w:14, h:14, k:c.k })), placed = [], max = map.getZoom() >= 8? 16 : 12, labels = []; let ret = null;
        const DIRS = [[1,-1,1],[-1,-1,1],[1,1,1],[-1,1,1],[1,-1,2.8],[-1,-1,2.8],[1,1,2.8],[-1,1,2.8]], usedN = new Set();   /* near slots first, then longer leaders */
        for(const c of cand){ if(labels.length >= max && !c.sel) break;
          const q = c.q, big = c.sel, ex = !c.cl && V0.ex[q.id];
          let w, h, d;
          if(c.cl){ const t0 = placeOf(c.c, map.getZoom(), usedN) || 'Cluster'; usedN.add(t0.split(' · ')[0]); d = { t:t0, n:q.point_count, a:fv(q.sp,0), b:Math.round((q.sp? q.hi/q.sp : 0)*100)+'% high-risk '+T.valShort, tone:tone(q.sp? q.hi/q.sp : 0) };
            w = Math.max(tw(d.t,'600 12px Inter')*1.08+48, tw(d.a+'   '+d.b,'500 11px Inter')*1.08)+28; h = 42; }
          else if(big){ w = 256; h = 184; }
          else { d = { a:fv(q.sp,1), b:ex? amt(ex)+' at risk' : 'No exposure' }; w = Math.max(tw(q.name,'600 12px Inter')*1.08+48, tw(d.a+'   '+d.b,'500 11px Inter')*1.08)+28; h = 42; }
          w = Math.ceil(Math.min(w, 280)); const dx = big? 34 : 18, dy = big? 30 : 16;
          let pick = null;
          for(const [sx, sy, m] of DIRS){ if(big && m>1) break; const ex2 = c.x+sx*dx, ey = c.y+sy*dy*m, r = { x:sx>0? ex2+8 : ex2-8-w, y:sy<0? ey-h+12 : ey-12, w, h };
            if(r.x < 6 || r.y < 6 || r.x+r.w > W-6 || r.y+r.h > H-6) continue;
            if(obst.some(o=> hit(r, o)) || placed.some(o=> hit(r, o)) || taken.some(o=> o.k!==c.k && hit(r, o))) continue;
            pick = { r, sx, sy, ex:ex2, ey }; break; }
          if(!pick && big){ const sx = c.x > W/2? -1 : 1, sy = c.y > H/2? -1 : 1, ex2 = c.x+sx*dx, ey = c.y+sy*dy;
            pick = { r:{ x:Math.max(6, Math.min(W-w-6, sx>0? ex2+8 : ex2-8-w)), y:Math.max(6, Math.min(H-h-6, sy<0? ey-h+12 : ey-12)), w, h }, sx, sy, ex:ex2, ey }; }
          if(!pick) continue;
          placed.push(pick.r); if(big) ret = { x:c.x, y:c.y };
          labels.push({ k:c.k, kind:c.cl? 'c' : big? 's' : 'v', q, d, c:c.c, x:c.x, y:c.y, r:pick.r, sx:pick.sx, ex:pick.ex, ey:pick.ey }); }
        setHud((o)=> ({ n:o.n+1, labels, ret })); };
      const zoomCluster = async (l)=>{ const map = mapRef.current, src = map && map.getSource('recs'); if(!src) return;
        try{ const z = await src.getClusterExpansionZoom(l.q.cluster_id); map.flyTo({ center:l.c, zoom:z+.3, curve:1.2, duration: rm()? 0 : 1300, easing:EASE }); }catch(x){} };
      const Hud = ()=>{ const sv = sel && T.byId(sel), sr = sv && T.risk(sel), st = sel && topTheme[sel];
        return html`<div key=${hud.n} class=${'hud'+(moving? ' mv' : '')} aria-hidden="true">
          <svg class="hud-ln" width="100%" height="100%">${hud.labels.map((l,i)=> html`<g key=${l.k} style=${{ '--i':i }} class=${'hl k-'+l.kind}>
              <polyline points=${l.x+','+l.y+' '+l.ex+','+l.ey+' '+(l.ex+l.sx*8)+','+l.ey}/>${l.kind!=='s' && html`<circle cx=${l.x} cy=${l.y} r="2.6"/>`}</g>`)}
            ${hud.ret && html`<g class="ret" transform=${'translate('+hud.ret.x+','+hud.ret.y+')'}><circle class="r1" r="19"/><g class="spin"><circle class="r2" r="26"/>
              ${[0,90,180,270].map(a=> html`<line key=${a} x1="0" y1="-30" x2="0" y2="-36" transform=${'rotate('+a+')'}/>`)}</g></g>`}</svg>
          ${hud.labels.map((l,i)=>{ const st2 = { left:l.r.x, top:l.r.y, width:l.r.w, '--i':i };
            if(l.kind==='c') return html`<div key=${l.k} class="hud-l c" style=${Object.assign(st2, { '--rc':l.d.tone })} onClick=${()=> zoomCluster(l)}>
              <span class="nm"><span>${l.d.t}</span><b class="sc num">${l.d.n}</b></span><span class="vl"><b class="num">${l.d.a}</b><span>${l.d.b}</span></span></div>`;
            if(l.kind==='v') return html`<div key=${l.k} class="hud-l v" style=${Object.assign(st2, { '--rc':RISKC[l.q.cat] })} onClick=${()=> setSel(l.q.id)}>
              <span class="nm"><span>${l.q.name}</span><b class="sc num">${l.q.score}</b></span><span class="vl"><b class="num">${l.d.a}</b><span class=${V0.ex[l.q.id]? 'bad' : ''}>${l.d.b}</span></span></div>`;
            if(!sv) return null;
            return html`<div key=${l.k} class="hud-l s" style=${Object.assign(st2, { height:l.r.h, '--rc':RISKC[sr.cat] })} onClick=${()=> onDetail(sel)} title="Open the detailed view">
              <span class="tg"><span>Selected ${n1}</span><span class="num">${sel}</span></span><span class="nm"><span>${sv.name}</span></span>
              <span class="mt"><span class="tk"><i style=${{ width:sr.score+'%' }}/></span><b class="num">${sr.cat} ${sr.score}</b></span>
              <dl class="rd"><div><dt>${T.valName}</dt><dd class="num">${fv(V0.sp[sel]||0,1)}</dd></div><div><dt>Share</dt><dd class="num">${pct(V0.tot? (V0.sp[sel]||0)/V0.tot*100 : 0,1)}</dd></div>
                <div><dt>At risk</dt><dd class=${'num'+(V0.ex[sel]? ' bad' : '')}>${V0.ex[sel]? amt(V0.ex[sel]) : '—'}</dd></div><div><dt>${T.secShort||T.secName}</dt><dd class="num">${V0.od[sel]? fsec(V0.od[sel]) : '—'}</dd></div></dl>
              <span class="is">${st? st.name+' · '+st.n+' records' : 'No issues this period'}</span></div>`; })}</div>`; };
      useEffect(()=>{ if(ready && !selRef.current) fit(); }, [fitSig, ready]);
      useEffect(()=>{ const map = mapRef.current; if(!map || !ready) return; if(map.getLayer('pt-sel')) map.setFilter('pt-sel', ['==', ['get','id'], sel||'']); needRef.current = true; map.triggerRepaint();
        if(sel){ flyTo(sel);
          const el = listRef.current && listRef.current.querySelector('[data-v="'+sel+'"]'); el && el.scrollIntoView({ block:'nearest', behavior:'smooth' }); }
      }, [sel, ready]);
      useEffect(()=>{ const t = setTimeout(()=>{ if(mapRef.current && ready) sel? flyTo(sel) : fit(); }, 40); return ()=> clearTimeout(t); }, [hide]);
      useEffect(()=>{ const map = mapRef.current; if(!map || !ready) return; project(map); if(globe && !sel) map.easeTo({ center:[78, 22], zoom:1.9, padding:pad(), duration: rm()? 0 : 1800, easing:EASE }); else if(!globe) sel? flyTo(sel) : fit(); }, [globe]);
      const chip = (k, on, n, label, onClick, dot, title)=> html`<button key=${k} type="button" class=${'vp-chip'+(on? ' on' : '')} aria-pressed=${on} disabled=${!n && !on} title=${title} onClick=${onClick}>
        ${dot && html`<i style=${{ background:dot }}/>`}${label}<small>${n}</small></button>`;
      const row = (label, list)=> html`<div class="ms-row" role="group" aria-label=${label}><span class="l">${label}</span><div class="cs">${list}</div></div>`;
      const nCity = new Set(V0.vs.filter(v=> v.geo).map(v=> v.geo.city)).size, nReg = new Set(V0.vs.filter(v=> v.geo).map(v=> v.geo.region)).size;
      const tools = html`<div class="ms-tools"><button type="button" class="btn sm" onClick=${()=>{ setSel(null); fit(); }}><${Icon} n="Layers" size=${14}/>Whole scope</button>
        <button type="button" class="btn sm" aria-pressed=${globe} onClick=${()=> setGlobe(!globe)}><${Icon} n="Globe" size=${14}/>${globe? 'Flat map' : 'Globe'}</button>
        <button type="button" class="btn sm" aria-pressed=${hide} onClick=${()=> setHide(!hide)}><${Icon} n=${hide? 'PanelLeftOpen' : 'PanelLeftClose'} size=${14}/>${hide? 'Show panels' : 'Map only'}</button></div>`;
      return html`<section class=${'ms'+(hide? ' bare' : '')} aria-label=${Nn+' on the map'}>
        <div class="ms-map" ref=${host} role="application" aria-label=${'Map of '+pl(V0.vs.length)+' in '+nCity+' cities. Use the explorer on the right to select '+a1(n1)+'.'}/>
        ${!err && ready && html`<${Hud}/>`}<div class="ms-frame" aria-hidden="true"><i/><i/><i/><i/></div>
        ${err && html`<div class="ms-err"><b>The map could not load.</b><span>The base map comes from CARTO over the internet. The scope and the explorer still work.</span></div>`}
        ${!hide && html`<div class="ms-pane ms-scope" role="region" aria-label=${Ns+' scope'}>
          <div class="ms-top"><${FCTMap.MapSearch} P=${P} items=${items} noun=${n1} onOpen=${onFind} extra=${(v)=> v.sub}/>
          <div class="ms-sum"><span><b class="num">${FCT.n(V0.vs.length)}</b> ${V0.vs.length===1? n1 : nP}</span><span><b class="num">${fv(V0.tot,0)}</b> ${T.valShort}${T.valWhen? ', '+T.valWhen(fs) : ''}</span>
            <span><b class="num">${FCT.n(V0.hiV.length)}</b> high or critical</span>${any && html`<button type="button" class="px-link sm" onClick=${()=> setScope({ pRisk:'All', pGeo:'All', pSeg:'All' })}>Clear scope</button>`}</div></div>${tools}
          ${row('Risk', [chip('all', T2.allRisks, T2.rT.All.n, 'All', ()=> setScope({ pRisk:'All' }))].concat(RISKS.map(c=> chip(c, !T2.allRisks && T2.risks.includes(c), T2.rT[c].n, c, ()=>{ const nx = FCTMap.nextRisk(T2, c); setScope({ pRisk: nx? nx.join(',') : 'All' }); }, P.RISK[c], (T.riskDefs||{})[c]))))}
          ${row('Geography', [chip('all', T2.geo==='All', T2.gT.All.n, 'All', ()=> setScope({ pGeo:'All' }))].concat(T.regions.map(r=> chip(r, T2.geo===r, T2.gT[r].n, r, ()=> setScope({ pGeo: T2.geo===r? 'All' : r })))))}
          ${row(T.segLabel, [chip('all', T2.seg==='All', T2.sT.All.n, 'All', ()=> setScope({ pSeg:'All' }))].concat(T.segs.map(g=> chip(g.id, T2.seg===g.id, T2.sT[g.id].n, g.label||g.id, ()=> setScope({ pSeg: T2.seg===g.id? 'All' : g.id }), null, g.desc))))}
</div>
        <aside class="ms-pane ms-list" aria-label=${Ns+' explorer'}>
          <div class="ms-lh"><div><h3>${Ns} explorer</h3><p class="faint">${pl(rows.length)} in ${nReg} region${nReg===1? '' : 's'}, ${nCity} cit${nCity===1? 'y' : 'ies'}. Select one to fly to it.</p></div>
            <${P.Seg} label="Sort by" value=${sort} onChange=${setSort} options=${MSORT}/></div>
          ${sel && T.byId(sel) && html`<div class="ms-brief"><${Brief} id=${sel} fs=${fs} V0=${V0} onOpen=${onOpen} onDetail=${onDetail} onClose=${()=> setSel(null)}/></div>`}
          <ul class="ms-l" ref=${listRef}>${rows.map((v,i)=>{ const r = T.risk(v.id), s2 = V0.sp[v.id]||0, on = sel===v.id, tt = topTheme[v.id];
            return html`<li key=${v.id} data-v=${v.id}><button type="button" class=${on? 'on' : ''} aria-pressed=${on} onClick=${()=> setSel(on? null : v.id)}>
              <span class="sn num">${i+1}</span><span class="nm"><b>${v.name}</b><small>${v.id} · ${v.geo? v.geo.city : '—'}${tt? ' · '+tt.name : ''}</small></span>
              <span class="rk"><${P.RiskTag} cat=${r.cat} score=${r.score} small=${true}/></span>
              <span class="fig"><b class="num">${fv(s2,1)}</b><i class="bar"><em style=${{ width:(s2/mx*100)+'%' }}/></i><small class=${V0.ex[v.id]? 'bad' : 'faint'}>${V0.ex[v.id]? amt(V0.ex[v.id])+' at risk' : 'No exposure'}</small></span></button></li>`; })}
            ${!rows.length && html`<li><${P.Empty} text=${'No '+n1+' in scope.'}/></li>`}</ul></aside>
        <div class="ms-pane ms-key" aria-hidden="true"><span class="h">Clusters</span><span><i style=${{ background:tone(0) }}/>Mostly low risk</span><span><i style=${{ background:tone(.2) }}/>15–40% high risk</span><span><i style=${{ background:tone(.5) }}/>40%+ high risk</span>
          <span class="h">${Nn}</span>${RISKS.map(c=> html`<span key=${c}><i style=${{ background:RISKC[c] }}/>${c}</span>`)}<span class="faint">Size is ${T.valShort}. Ctrl or ⌘ and scroll to zoom.</span>
          ${at && html`<span class="ms-at num">${Math.abs(at.lat).toFixed(2)}° ${at.lat>=0? 'N' : 'S'} · ${Math.abs(at.lng).toFixed(2)}° ${at.lng>=0? 'E' : 'W'} · zoom ${at.z.toFixed(1)}</span>`}</div>`}
        ${hide && tools}</section>`;
    }

    /* once the map scrolls away, a slim pinned line keeps the scope in sight and leads back to it */
    function ScopeTag({ fs, V0, setScope }){
      const [show, setShow] = useState(false), sc = scopeOf(fs);
      useEffect(()=>{ const el = document.querySelector('.ms'); if(!el || !window.IntersectionObserver) return; const io = new IntersectionObserver(([e])=> setShow(e.intersectionRatio < .12), { threshold:[0, .12, .5] }); io.observe(el); return ()=> io.disconnect(); }, []);
      const on = [['pRisk','Risk'],['pGeo','Geography'],['pSeg',T.segLabel]].filter(([k])=> sc[k] && sc[k]!=='All');
      return html`<div class=${'ms-tag'+(show? ' on' : '')} aria-hidden=${!show}><div class="in">
        <span><b class="num">${FCT.n(V0.vs.length)}</b> ${nP} · <b class="num">${fv(V0.tot,0)}</b> ${T.valShort} · <b class="num">${FCT.n(V0.hiV.length)}</b> high or critical</span>
        ${on.length? on.map(([k,l])=> html`<button key=${k} type="button" class="vp-chip on" tabIndex=${show? 0 : -1} onClick=${()=> setScope({ [k]:'All' })}>${l}: ${String(sc[k]).split(',').join(', ')} <span aria-hidden="true">×</span></button>`) : html`<span class="faint">Whole portfolio</span>`}
        <button type="button" class="px-link sm" tabIndex=${show? 0 : -1} onClick=${()=>{ const el = document.querySelector('.ms'); el && el.scrollIntoView({ block:'start', behavior:'smooth' }); }}>Back to the map</button></div></div>`;
    }

    /* value against risk; bubble = open potential exposure */
    function Scatter({ fs, V0, sel, onSelect, onOpen, height=220 }){
      const rm = P.useRM? P.useRM() : false;
      const pts = V0.vs.map(v=>{ const r = T.risk(v.id); return { id:v.id, n:v.name, x:+(V0.sp[v.id]||0).toFixed(2), y:r.score, z:Math.max(.05, V0.ex[v.id]||0), exp:V0.ex[v.id]||0, cat:r.cat }; });
      return html`<${P.ChartBox} height=${height} label=${Nn+' by '+T.valShort+' and risk score; bubble size is open potential exposure'} table=${P.mini([Ns, T.valName, 'Score', EXN], pts.slice().sort((a,b)=>b.y-a.y).slice(0,30).map(p=>[p.n, fv(p.x), p.y, amt(p.exp)]))}>
        <${R.ScatterChart} margin=${{top:10,right:18,left:-4,bottom:14}}>
          <${R.ReferenceArea} y1=${60} y2=${100} fill="var(--px-crit)" fillOpacity=${.08} label=${{ value:'High and Critical (60+)', position:'insideTopRight', fontSize:10.5, fill:COL.crit }}/>
          <${R.CartesianGrid} stroke=${COL.grid}/><${R.XAxis} type="number" dataKey="x" name=${T.valName} scale="sqrt" ...${P.axis} tickFormatter=${T.valAxis? (v)=> v : (v)=>'₹'+v} label=${T.noAxisLabel? undefined : { value:T.valName+(T.valAxis? ' '+T.valAxis : ', ₹ Cr')+' (square-root scale)', position:'insideBottom', offset:-8, fontSize:11, fill:COL.ink3 }}/>
          <${R.YAxis} type="number" dataKey="y" name="Risk score" domain=${[0,100]} ...${P.axis} width=${40}/><${R.ZAxis} type="number" dataKey="z" range=${[40,700]}/>
          <${R.Tooltip} cursor=${{strokeDasharray:'3 3'}} content=${({active,payload})=> active && payload && payload.length? html`<div class="px-ctip"><div class="h">${payload[0].payload.n}</div><div class="r"><span>Risk</span><b>${payload[0].payload.y} · ${payload[0].payload.cat}</b></div><div class="r"><span>${T.valName}</span><b>${fv(payload[0].payload.x)}</b></div><div class="r"><span>${EXN}</span><b>${payload[0].payload.exp? amt(payload[0].payload.exp) : '—'}</b></div></div>` : null}/>
          <${R.Scatter} data=${pts} isAnimationActive=${!rm} onClick=${(d)=> onSelect(d.id)} onDoubleClick=${(d)=> onOpen(d.id)} style=${{cursor:'pointer'}}>
            ${pts.map((p,i)=> h(R.Cell, { key:i, fill:P.RISK[p.cat], fillOpacity: sel && sel!==p.id? .25 : .75, stroke: sel===p.id? COL.brass : COL.surface, strokeWidth: sel===p.id? 3 : 1 }))}</${R.Scatter}>
        </${R.ScatterChart}></${P.ChartBox}>`;
    }

    /* records in view: numbered, with ID; a row opens its summary in place, and the detailed view in a window */
    const SORTS = [['val', T.valName],['risk','Risk'],['exposure','Exposure'],['name','Name']];
    function Table({ fs, V0, city, setCity, sel, setSel, onOpen, onDetail }){
      const [sort, setSort] = useState('val'), topTheme = topThemeOf(V0);
      const key = { val:(v)=> -(V0.sp[v.id]||0), risk:(v)=> -T.risk(v.id).score, exposure:(v)=> -(V0.ex[v.id]||0), name:(v)=> v.name };
      const rows = V0.vs.filter(v=> !city || (v.geo && (v.geo.city===city || v.geo.region===city))).sort((a,b)=>{ const x = key[sort](a), y = key[sort](b); return x>y? 1 : x<y? -1 : 0; });
      const mx = Math.max(...rows.map(v=> V0.sp[v.id]||0), .01), tot = rows.reduce((s2,v)=> s2+(V0.sp[v.id]||0), 0), listRef = useRef(null);
      useEffect(()=>{ if(!sel || !listRef.current) return; const el = listRef.current.querySelector('[data-v="'+sel+'"]'); el && el.scrollIntoView({ block:'nearest', behavior:'smooth' }); }, [sel]);
      return html`<div class="vp-vt" aria-label=${Nn+' in view'}>
        <div class="hd"><div><h3>${Nn} in view</h3><p class="faint">${pl(rows.length)} · ${fv(tot,1)} ${T.valShort}${city? ' · '+city : ''}. Select ${a1(n1)} for its summary.</p></div>
          <div class="tools">${city && html`<button type="button" class="vp-chip on" onClick=${()=> setCity(null)}>${city} <span aria-hidden="true">×</span></button>`}
            <${P.Seg} label="Sort by" value=${sort} onChange=${setSort} options=${SORTS}/></div></div>
        <div class="vp-vt-h" aria-hidden="true"><span class="r">#</span><span>${T.idLabel}</span><span>${Ns}</span><span>Risk</span><span class="r">${T.valName}</span><span class="r">${EXN}</span><span class="r">${T.secShort||T.secName}</span><span>Most frequent issue</span></div>
        <ul class="vp-vt-l" ref=${listRef}>${rows.map((v,i)=>{ const r = T.risk(v.id), sp = V0.sp[v.id]||0, on = sel===v.id, tt = topTheme[v.id];
          return html`<li key=${v.id} data-v=${v.id} class=${on? 'on' : ''}><button type="button" class="row" aria-expanded=${on} onClick=${()=> setSel(on? null : v.id)}>
              <span class="sn num">${i+1}</span><span class="vid num">${T.shortId? T.shortId(v) : v.id}</span>
              <span class="nm"><b>${v.name}</b><small>${T.sub(v)}</small></span>
              <span><${P.RiskTag} cat=${r.cat} score=${r.score} small=${true}/></span>
              <span class="sp"><b class="num">${fv(sp,1)}</b><i class="bar"><em style=${{ width:(sp/mx*100)+'%' }}/></i></span>
              <span class=${'r num'+(V0.ex[v.id]? ' bad' : ' faint')}>${V0.ex[v.id]? amt(V0.ex[v.id]) : '—'}</span>
              <span class=${'r num'+(V0.od[v.id]? '' : ' faint')}>${V0.od[v.id]? fsec(V0.od[v.id]) : '—'}</span>
              <span class="iss">${tt? tt.name : html`<span class="faint">None</span>`}${tt? html`<small>${tt.n} records</small>` : ''}</span></button>
            ${on && html`<div class="vp-vt-d"><${Brief} id=${v.id} fs=${fs} V0=${V0} onOpen=${onOpen} onDetail=${onDetail} onClose=${()=> setSel(null)}/></div>`}</li>`; })}
          ${!rows.length && html`<li><${P.Empty} text=${'No '+n1+' in scope'+(city? ' in '+city : '')+'.'}/></li>`}</ul></div>`;
    }

    /* region → issue theme → record → anomalies: a left-to-right drill-down sized to the screen; each stage scrolls on its own */
    const Stage = ({ n, title, ctx, tools, children, cls })=> html`<div class=${'vp-stg'+(cls? ' '+cls : '')}>
      <header class="vp-stg-h"><span class="n num" aria-hidden="true">${n}</span><div class="tt"><h3>${title}</h3><p>${ctx}</p></div></header>
      ${tools && html`<div class="vp-stg-t">${tools}</div>`}<div class="vp-stg-b">${children}</div></div>`;
    const Find = ({ value, onChange, label, ph })=> html`<label class="vp-find"><${Icon} n="Search" size=${14}/><input type="search" aria-label=${label} placeholder=${ph} value=${value} onInput=${(e)=> onChange(e.target.value)}/></label>`;
    function Flow({ fs, V0, onDoc, onRec, onCase, onProfile }){
      const by = {}; V0.vs.forEach(v=>{ if(!v.geo) return; const r = by[v.geo.region] = by[v.geo.region] || { region:v.geo.region, n:0, sp:0, hi:0 };
        const s2 = V0.sp[v.id]||0; r.n++; r.sp += s2; if(HI(T.risk(v.id).cat)) r.hi += s2; });
      const regs = Object.values(by).sort((a,b)=> b.sp-a.sp), avg = V0.tot? V0.hiSp/V0.tot : 0;
      const [reg0, setReg] = useState('All'), reg = reg0==='All' || by[reg0]? reg0 : 'All';
      const RV = reg==='All'? V0 : view(T.setScope(fs, { pGeo:reg }));
      const ts = RV.themes, [t0, setT] = useState(null), [v0, setV] = useState(null), [qv, setQv] = useState(''), [qa, setQa] = useState('');
      const fin = ts.filter(t=> !t.md), t = ts.find(x=> x.id===t0 && x.n) || fin.slice().sort((a,b)=> b.n-a.n)[0];
      const vlist = t? t.vendors.filter(x=> !qv.trim() || (T.byId(x.v).name+' '+x.v).toLowerCase().includes(qv.trim().toLowerCase())) : [];
      const vr = t && (vlist.find(x=> x.v===v0) || vlist[0]);
      useEffect(()=>{ setV(null); setQa(''); }, [t && t.id, reg, T.fkey(fs)]);
      useEffect(()=>{ setQa(''); }, [vr && vr.v]);
      const mxV = Math.max(...fin.map(x=> x.n), 1);
      const trend = (r)=>{ const s3 = r.sp? r.hi/r.sp : 0, d = s3 - avg; return Math.abs(d) < .02? ['flat','—'] : d>0? ['up','↑'] : ['down','↓']; };
      const allCases = vr? T.cases(vr.v, fs).filter(c=> c.measure!=='closed') : [];
      const q = qa.trim().toLowerCase(), hit = (txt)=> !q || txt.toLowerCase().includes(q);
      const inT = (c)=> t && T.caseTheme[c.type]===t.id;
      const tCases = allCases.filter(c=> inT(c) && hit(c.id+' '+c.typeName)), oCases = allCases.filter(c=> !inT(c) && hit(c.id+' '+c.typeName));
      const recs = vr && !t.md? vr.recs.filter(r=> hit((r.id||'')+' '+lab(r)+' '+r.name)).sort((a,b)=> b.val-a.val) : [];
      const caseRow = (c)=> html`<li key=${c.id} class="vp-an"><button type="button" class="an-main" onClick=${()=> onCase(c.id)}>
          <span class="nm"><span class="id num">${c.id}</span>${c.typeName}<small>${c.stName}${c.age!=null? ' · open '+c.age+' days' : ''}${c.ex && c.ex!==c.id? ' · decision '+c.ex : ''}</small></span>
          <b class="num">${c.amount? amt(c.amount) : ''}</b></button>
        <button type="button" class="go" aria-label=${'Open case '+c.id+' in detail'} title="Open the case in detail" onClick=${()=> onCase(c.id)}><${Icon} n="ChevronRight" size=${16}/></button></li>`;
      return html`<section class="vp-sec vp-flow" aria-label="Drill-down from region to anomaly">
        <${Stage} n="1" title="Region" ctx=${'High-risk share of '+T.valShort+' in scope: '+pct(avg*100,0)}>
          <ul class="vp-rgl"><li><button type="button" class=${reg==='All'? 'on' : ''} aria-pressed=${reg==='All'} onClick=${()=> setReg('All')}><span class="nm">All regions<small>${FCT.n(V0.vs.length)} ${nP}</small></span><span class="fig"><b class="num">${fv(V0.tot,0)}</b></span></button></li>
            ${regs.map(r=>{ const tr = trend(r); return html`<li key=${r.region}><button type="button" class=${reg===r.region? 'on' : ''} aria-pressed=${reg===r.region} onClick=${()=> setReg(r.region)}>
              <span class="nm">${r.region}<small><span class=${'vp-tr '+tr[0]}>${tr[1]}</span> ${pct(r.sp? r.hi/r.sp*100 : 0,0)} high-risk ${T.valShort}</small></span><span class="fig"><b class="num">${fv(r.sp,0)}</b><small>${pl(r.n)} · ${pct(V0.tot? r.sp/V0.tot*100 : 0,0)}</small></span></button></li>`; })}</ul></${Stage}>
        <${Stage} n="2" title="Issue theme" ctx=${(reg==='All'? 'All regions' : reg)+' · records with issues; a record can sit in more than one theme'}>
          <ul class="vp-tl">${ts.map(x=> html`<li key=${x.id}><button type="button" class=${t===x? 'on' : ''} aria-pressed=${t===x} disabled=${!x.n} onClick=${()=> setT(x.id)}>
            <span class="nm">${x.name}<small>${x.why}</small></span><span class="fig"><b class="num">${x.md? FCT.n(x.n)+' checks' : FCT.n(x.n)}</b><small>${pl(x.nv)}</small></span>
            ${!x.md && html`<i class="bar" style=${{ width:(x.n/mxV*100)+'%' }}/>`}</button></li>`)}</ul></${Stage}>
        <${Stage} n="3" title=${Ns} ctx=${t? t.name+' · '+pl(t.nv)+', '+(t.md? FCT.n(t.n)+' failing checks' : FCT.n(t.n)+' records') : 'Select a theme'}
          tools=${html`<${Find} value=${qv} onChange=${setQv} label=${'Search '+nP+' in this theme'} ph=${'Search '+n1+' name or ID'}/>`}>
          ${vlist.length? html`<ul class="vp-vl">${vlist.map(x=>{ const r = T.risk(x.v), topC = Object.entries(x.codes).sort((a,b)=> b[1]-a[1])[0];
            return html`<li key=${x.v}><button type="button" class=${vr===x? 'on' : ''} aria-pressed=${vr===x} onClick=${()=> setV(x.v)}>
              <span class="nm">${T.byId(x.v).name}<small>${x.v} · ${t.md? x.recs.map(q2=> q2.name).join(', ') : T.issueName(topC[0])}</small></span>
              <${P.RiskTag} cat=${r.cat} small=${true}/><span class="fig"><b class="num">${x.n}</b><small>${t.md? 'checks' : rv(x.val)}</small></span></button></li>`; })}</ul>`
            : html`<${P.Empty} text=${qv? 'No '+n1+' matches “'+qv+'”.' : 'No '+n1+' in this region raises this theme.'}/>`}</${Stage}>
        <${Stage} n="4" title="Anomalies and records" cls="vp-recs" ctx=${vr? T.byId(vr.v).name+' · '+(t.md? vr.n+' failing checks' : vr.n+' records'+(vr.val? ', '+rv(vr.val) : '')) : 'Select '+a1(n1)}
          tools=${vr && html`<${Find} value=${qa} onChange=${setQa} label="Search by anomaly ID" ph=${'Search anomaly ID (e.g. '+T.caseIdEg+') or record'}/><button type="button" class="px-link sm" onClick=${()=> onProfile(vr.v)}>${T.profileLabel}</button>`}>
          ${!vr? html`<p class="faint">Select a theme and ${a1(n1)}.</p>` : html`<${Fragment}>
            ${tCases.length? html`<h4>Open anomalies in ${t.name.toLowerCase()}</h4><ul class="vp-anl">${tCases.map(caseRow)}</ul>` : ''}
            ${t.md? html`<h4>Failing checks</h4><ul class="vp-rl">${vr.recs.map((q2,i)=> html`<li key=${i}><span class="nm">${q2.name}<small>Fix in master data, then re-verify</small></span></li>`)}</ul>`
              : html`<h4>Outstanding records</h4>${recs.length? html`<ul class="vp-rl">${recs.slice(0,25).map((q2,i)=> html`<li key=${i}><button type="button" onClick=${()=> q2.id && onRec(Object.assign({ ent:vr.v }, q2), t)}>
                <span class="nm">${lab(q2)}<small>${q2.name}${RES()[q2.id]? ' · resolved' : ''}</small></span><b class="num">${rv(q2.val)}</b></button></li>`)}${recs.length>25 && html`<li class="faint more">${recs.length-25} more in the ${T.profileLabel.toLowerCase()}</li>`}</ul>`
                : html`<p class="faint">No record matches “${qa}”.</p>`}`}
            ${oCases.length? html`<h4>Other open anomalies for this ${n1}</h4><ul class="vp-anl">${oCases.map(caseRow)}</ul>` : ''}
            ${q && !tCases.length && !oCases.length && !recs.length && html`<p class="faint">Nothing matches “${qa}”.</p>`}</${Fragment}>`}</${Stage}></section>`;
    }

    /* the page body: everything below the command bar */
    function Portfolio({ f, fs, setF, onProfile, onDoc }){
      const items = tileItems(f), V0 = view(fs), setScope = (o)=>{ setF(T.setScope(fs, o)); setCity(null); };
      const [selV, setSelV] = useState(null), sel = selV && V0.ids.has(selV)? selV : null, [city, setCity] = useState(null), [win, setWin] = useState(null);
      /* one detail window: a record's detailed view, or a single case (anomaly) with its full context and decision */
      const setDet = (id)=> setWin(id? { t:'rec', id } : null), showCase = (id)=> setWin({ t:'case', id }), showDoc = (q, th)=>{ const cid = T.recCase && T.recCase(q); setWin(cid? { t:'case', id:cid } : { t:'doc', q, th }); };
      const goDoc = (id)=>{ setWin(null); onDoc(id); };
      const find = (id)=>{ if(!V0.ids.has(id)) setF(T.setScope(fs, { pRisk:'All', pGeo:'All', pSeg:'All' })); setCity(null); setSelV(id); };
      const scrollUp = ()=>{ const el = document.querySelector('.ms'); el && el.scrollIntoView({ block:'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches? 'auto' : 'smooth' }); };
      const pickCity = (c)=>{ setCity(c); const g = sel && T.byId(sel).geo; if(sel && c && (!g || (g.city!==c && g.region!==c))) setSelV(null); };
      const wc = win && win.t==='case'? T.caseInfo(win.id) : null, stage = T.mapStage && window.FCTMap;
      return html`<${Fragment}>
        ${stage? html`<${Fragment}><${MapStage} items=${items} fs=${fs} setScope=${setScope} V0=${V0} sel=${sel} setSel=${setSelV} onFind=${find} onOpen=${onProfile} onDetail=${setDet}/>
          <${ScopeTag} fs=${fs} V0=${V0} setScope=${setScope}/><${ChainStrip} V0=${V0}/></${Fragment}>`
        : html`<${Fragment}><${ChainStrip} V0=${V0}/><${LensBar} items=${items} fs=${fs} setScope=${setScope} V0=${V0} onFind=${find}/></${Fragment}>`}
        ${V0.vs.length && stage? html`<${Fragment}>
          <section class="vp-sec vp-pair" aria-label=${T.valName+' against risk, and '+nP+' by stage'}>
            <div class="vp-sc"><div class="hd"><h3>${T.scatterTitle || T.valName+' against risk'}</h3><span class="faint">Bubble size is ${EXN.toLowerCase()}. Select ${a1(n1)} to find it on the map.</span></div>
              <${Scatter} fs=${fs} V0=${V0} sel=${sel} onSelect=${(id)=>{ setSelV(id); scrollUp(); }} onOpen=${(id)=> setDet(id)} height=${400}/></div>
            <div class="vp-hm"><h3>${T.heatTitle || Nn+' with the most issue value, by stage'}</h3><p class="faint">${T.heatSub || 'Records with issues by chain stage.'} Select ${a1(n1)} to open its detailed view.</p>
              ${T.heatCols? html`<${HeatG} rows=${T.heat(fs)} onRow=${(id)=> setDet(id)}/>` : html`<${P.Heat} rows=${T.heat(fs)} rowLabel=${Ns} onVendor=${(id)=> setDet(id)} onCell=${(id)=> setDet(id)}/>`}</div></section>
          <${Flow} fs=${fs} V0=${V0} onDoc=${onDoc} onRec=${showDoc} onCase=${showCase} onProfile=${onProfile}/></${Fragment}>`
        : V0.vs.length? html`<${Fragment}>
          <section class="vp-sec vp-main" aria-label=${Nn+' in view'}>
            <${Table} fs=${fs} V0=${V0} city=${city} setCity=${pickCity} sel=${sel} setSel=${setSelV} onOpen=${onProfile} onDetail=${setDet}/>
            <div class="vp-viz">
              <${Geo} V0=${V0} fs=${fs} city=${city} setCity=${pickCity} sel=${sel} setSel=${(id)=>{ setCity(null); setSelV(id); }}/>
              <div class="vp-sc"><div class="hd"><h3>${T.scatterTitle || T.valName+' against risk'}</h3><span class="faint">Bubble size is ${EXN.toLowerCase()}</span></div>
                <${Scatter} fs=${fs} V0=${V0} sel=${sel} onSelect=${(id)=>{ setCity(null); setSelV(id); }} onOpen=${(id)=> setDet(id)} height=${220}/></div></div></section>
          <section class="vp-sec" aria-label=${Nn+' with the most issue value'}><h3>${T.heatTitle || Nn+' with the most issue value, by stage'}</h3><p class="faint">${T.heatSub || 'Records with issues by chain stage.'} Select ${a1(n1)} to open its detailed view.</p>
            ${T.heatCols? html`<${HeatG} rows=${T.heat(fs)} onRow=${(id)=> setDet(id)}/>` : html`<${P.Heat} rows=${T.heat(fs)} rowLabel=${Ns} onVendor=${(id)=> setDet(id)} onCell=${(id)=> setDet(id)}/>`}</section>
          <${Flow} fs=${fs} V0=${V0} onDoc=${onDoc} onRec=${showDoc} onCase=${showCase} onProfile=${onProfile}/></${Fragment}>`
        : html`<${P.Empty} text=${'No '+nP+' match this scope. Clear part of the scope above.'} onReset=${()=> setScope({ pRisk:'All', pGeo:'All', pSeg:'All' })}/>`}
          <${P.Window} open=${!!win} onClose=${()=> setWin(null)} title=${!win? '' : win.t==='case'? 'Case '+win.id : win.t==='doc'? 'Anomaly '+lab(win.q) : T.byId(win.id).name}
            sub=${!win? '' : win.t==='case'? (wc? wc.typeName+' · '+wc.recName : '') : win.t==='doc'? T.issueName(win.q.code)+' · '+((T.byId(win.q.ent)||{}).name||'') : 'Detailed view'} icon=${win && win.t==='case'? 'Crosshair' : win && win.t==='doc'? 'FileWarning' : 'Building2'} theme="k-amber px-win-xl">
            ${win && win.t==='rec' && html`<${Detail} key=${win.id} id=${win.id} fs=${fs} V0=${V0} onRec=${showDoc} onCase=${showCase} onProfile=${(id)=>{ setWin(null); onProfile(id); }}/>`}
            ${win && win.t==='doc' && html`<div class="vp-casewin">${T.byId(win.q.ent) && html`<button type="button" class="px-link sm" onClick=${()=> setWin({ t:'rec', id:win.q.ent })}>‹ ${T.byId(win.q.ent).name}: detailed view</button>`}
              <${DocWin} key=${win.q.id} q=${win.q} th=${win.th} fs=${fs} V0=${V0} onCase=${showCase} onRec=${(id)=> setWin({ t:'rec', id })} onFull=${T.noFullDoc? null : goDoc}/></div>`}
            ${win && win.t==='case' && wc && html`<div class="vp-casewin">${wc.rec && T.byId(wc.rec) && html`<button type="button" class="px-link sm" onClick=${()=> setWin({ t:'rec', id:wc.rec })}>‹ ${T.byId(wc.rec).name}: detailed view</button>`}
              ${T.caseView(win.id, { onDoc:goDoc, onRec:(id)=> setWin({ t:'rec', id }), onCase:showCase })}</div>`}</${P.Window}></${Fragment}>`;
    }
    return { Portfolio, Profile, view };
  };
  window.FCTPortfolio = { make };
})();
