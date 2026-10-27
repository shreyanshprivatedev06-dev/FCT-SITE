/* FCT demo — P2P control tower v2: investigation views shared by the three P2P screens.
   KpiSheet (fixed left index) · Investigate (right panel router: root → group → vendor → profile → document / case) · VendorProfile · DocView · CaseView. */
(function(){
  const { html, h, R, M, COL, Icon, cx } = P2P, P = P2P, FCT = window.FCT;
  const { useState, useEffect, useRef, Fragment, useMemo } = React;
  const { cr, amt, pct } = P;
  const C = M.C;
  const vname = (id)=> (M.V[id]||{}).name || id;

  /* ---------- node builders (breadcrumb labels carry the full text; CSS truncates) ---------- */
  const N = P.node = {
    group:(dim, key)=> dim==='vendor'? N.vendor(key) : { t:'group', dim, key, label:(dim==='component'? '' : M.dimName[dim]+': ')+M.dimLabel(dim, key) },
    vendor:(id)=> ({ t:'vendor', id, label:vname(id) }),
    profile:(id)=> ({ t:'profile', id, label:vname(id) }),
    rec:(x)=> x.kind==='case'? N.case(x.rec.id) : x.kind==='vendor'? N.vendor(x.rec.id) : N.doc(x.rec.id),
    doc:(id)=>{ const r = M.rec(id); return { t:'doc', id, label: !r? id : M.line(id)? (r.cn? 'Credit note ' : 'Invoice ')+r.ref : M.openLine(id)? 'PO '+r.po+'-'+r.poLn : M.grniLine(id)? 'GRNI '+r.po : r.id }; },
    case:(id)=> ({ t:'case', id, label:id }),
    stage:(id)=> ({ t:'group', dim:'stage', key:id, label:'Stage: '+M.stage(id).name }),
    issue:(code)=> ({ t:'group', dim:'issue', key:code, label:'Issue: '+M.issue(code).name })
  };

  /* ---------- KPI board (left): every KPI called out with its own visual; any card, slice, bar or row opens it on the right ---------- */
  const Spark = ({ data, w=56, ht=16, target })=>{ const pts = data.map((v,i)=>[i,v]).filter(p=>p[1]!=null); if(pts.length<2) return null;
    const vs = pts.map(p=>p[1]).concat(target!=null? [target] : []), mn = Math.min(...vs), mx = Math.max(...vs), pad = (mx-mn)*.15 || 1;
    const X = (i)=> 1 + i*(w-3)/(data.length-1), Y = (v)=> ht-2 - (v-mn+pad)/(mx-mn+2*pad)*(ht-4);
    return html`<svg class="px-spark" width=${w} height=${ht} viewBox=${'0 0 '+w+' '+ht} preserveAspectRatio="none" aria-hidden="true">
      ${target!=null && html`<line x1="0" x2=${w} y1=${Y(target)} y2=${Y(target)} stroke=${COL.brass} stroke-width="1" stroke-dasharray="3 3"/>`}
      <path d=${pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join('')} fill="none" stroke=${COL.brand2} stroke-width="1.8" stroke-linejoin="round"/>
      <circle cx=${X(pts[pts.length-1][0])} cy=${Y(pts[pts.length-1][1])} r="2.6" fill=${COL.brass}/></svg>`; };
  const AreaSpark = ({ data, color=COL.brand2, height=46 })=>{ const rm = P.useRM(); const d = data.map((v,i)=>({ i, v }));
    return html`<div style=${{height}} aria-hidden="true"><${R.ResponsiveContainer} width="100%" height="100%"><${R.AreaChart} data=${d} margin=${{top:4,right:2,left:2,bottom:0}}>
      <${R.Area} type="monotone" dataKey="v" stroke=${color} strokeWidth=${2} fill=${color} fillOpacity=${.12} isAnimationActive=${!rm} connectNulls=${false} dot=${false}/></${R.AreaChart}></${R.ResponsiveContainer}></div>`; };
  const Ring = ({ v, band })=>{ const r = 34, c = 2*Math.PI*r, tv = P.useTween(v||0), col = !band? COL.low : band.cls==='pos'? COL.pos : band.cls==='med'? '#B08A1E' : COL.crit;
    return html`<svg viewBox="0 0 84 84" class="px-ring" role="img" aria-label=${'Health '+(v==null? 'N/A' : v)+' out of 100'}><circle cx="42" cy="42" r=${r} fill="none" stroke="var(--px-track)" stroke-width="7"/>
      <circle cx="42" cy="42" r=${r} fill="none" stroke=${col} stroke-width="8" stroke-linecap="round" stroke-dasharray=${c} stroke-dashoffset=${c*(1-(tv||0)/100)} transform="rotate(-90 42 42)"/>
      <text x="42" y="44" text-anchor="middle" class="n">${v==null? 'N/A' : Math.round(tv)}</text><text x="42" y="58" text-anchor="middle" class="u">/100</text></svg>`; };
  const pctChg = (v, prior)=>{ if(v==null || prior==null || !prior) return null; return (v-prior)/Math.abs(prior)*100; };
  const Chg = ({ id, v, prior, label })=>{ const d = pctChg(v, prior); if(d==null) return html`<span class="px-d faint">No comparable period</span>`;
    const k = M.KPI[id], up = d>0, good = k.good==='up'? up : k.good==='down'? !up : null;
    return html`<span class=${cx('px-d', good===true&&'up', good===false&&'down')}>${up?'▲':'▼'} ${FCT.n(Math.abs(d),1)}%</span><span class="faint"> vs ${label}</span>`; };
  const Seg = ({ parts, label })=>{ const t = parts.reduce((s,p)=> s + Math.max(0,p.v), 0) || 1;
    return html`<div class="px-segbar" role="img" aria-label=${label}>${parts.map((p,i)=> p.v>0? html`<i key=${i} style=${{ flex:p.v/t, background:p.c }} title=${p.l+': '+(p.f? p.f(p.v) : p.v)}/>` : null)}</div>
      <div class="px-seglg">${parts.map((p,i)=> html`<span key=${i}><i style=${{background:p.c}}/>${p.l} <b>${p.f? p.f(p.v) : p.v}</b></span>`)}</div>`; };
  P.CAT_COL = ['#4FB3A3','#6E9BE0','#E0B25A','#A08BE0','#6CC18F','#E58A6B','#D17BAE','#8FB7C9','#B8C27A'];

  const KCard = ({ id, kpi, pick, title, icon, sub, right, children, className, label })=> html`<section class=${cx('px-kc', P.kc(id), kpi===id && 'on', className)} onClick=${()=> pick(id)} aria-label=${label||title}>
    <div class="px-kc-h"><button type="button" class="px-kc-t" aria-pressed=${kpi===id} onClick=${(e)=>{ e.stopPropagation(); pick(id); }}><span class="px-kc-i"><${Icon} n=${icon || P.KICON[id]} size=${15} strokeWidth=${1.6}/></span><span>${title}</span></button>${right}</div>
    ${sub && html`<p class="px-kc-s">${sub}</p>`}${children}</section>`;
  const stop = (fn)=> (e)=>{ e.stopPropagation(); fn(); };

  /* colour-coded board section: one accent per subject; the right side carries a live summary */
  const Sec = ({ c, icon, title, sub, right, children })=> html`<section class=${'px-sec s-'+c} aria-label=${title}>
    <div class="px-sec-h">${icon && html`<span class="px-sec-ic" aria-hidden="true"><${Icon} n=${icon} size=${20} strokeWidth=${1.7}/></span>`}<div class="px-sec-t"><h2>${title}</h2>${sub && html`<p>${sub}</p>`}</div>${right && html`<div class="px-sec-r">${right}</div>`}</div>${children}</section>`;
  const Pill = ({ tone, children, title })=> html`<span class=${'px-pill t-'+(tone||'n')} title=${title}>${children}</span>`;
  /* change chip: coloured by whether the move is good for this KPI */
  const DChip = ({ id, v, prior, mode })=>{
    if(v==null || prior==null || (mode==='pct' && !prior)) return null;
    const d = mode==='pct'? (v-prior)/Math.abs(prior)*100 : v-prior; if(Math.abs(d)<0.05) return html`<${Pill}>No change</${Pill}>`;
    const k = M.KPI[id], up = d>0, good = k.good==='up'? up : k.good==='down'? !up : null;
    return html`<${Pill} tone=${good==null? 'n' : good? 'g' : 'r'} title="Change against the prior period">${up? '▲' : '▼'} ${FCT.n(Math.abs(d),1)}${mode==='pct'? '%' : ' pts'}</${Pill}>`; };
  const Foot = ({ items })=> html`<dl class="px-rc-f">${items.filter(Boolean).map(([l,v,t],i)=> html`<div key=${i}><dt>${l}</dt><dd class=${t||''}>${v}</dd></div>`)}</dl>`;
  /* rich KPI card: header with basis, value with change chip, a visual, a three-figure footer */
  /* ranked contributors: three rows with a bar in the KPI's accent */
  const Top = ({ title, rows, fmt=(v)=> cr(v,1) })=>{ const mx = Math.max(...rows.map(r=>r.val), 0) || 1;
    return rows.length? html`<div class="px-rc-l"><div class="h">${title}</div>${rows.map(r=> html`<div key=${r.key} class="rw" title=${r.label+': '+fmt(r.val)}><span class="n">${r.label}</span><span class="trk"><i style=${{ width:(r.val/mx*100)+'%' }}/></span><b class="num">${fmt(r.val)}</b></div>`)}</div>` : null; };
  const top3 = (facts, key, label)=> M.group(facts, key).sort((a,b)=> b.val-a.val).slice(0,4).map(r=> ({ key:r.key, label:label(r.key), val:r.val }));
  const RCard = ({ id, kpi, pick, title, basis, value, tone, chip, viz, foot, top, note })=> html`<section class=${cx('px-kc px-rc px-rc3', P.kc(id), kpi===id && 'on')} onClick=${()=> pick(id)} aria-label=${title}>
    <div class="px-rc-h"><button type="button" class="px-kc-t" aria-pressed=${kpi===id} onClick=${(e)=>{ e.stopPropagation(); pick(id); }}><span class="px-kc-i"><${Icon} n=${P.KICON[id]} size=${15} strokeWidth=${1.6}/></span><span>${title}</span></button><span class="px-basis">${basis}</span></div>
    <div class="px-rc-v"><span class=${cx('v num', tone)}>${value}</span>${chip}</div>
    <div class="px-rc-viz">${viz}</div><${AI}>${note}</${AI}>${top}<${Foot} items=${foot}/></section>`;
  /* plain-language context line, generated from the data on screen */
  const AI = ({ children, cls })=> children? html`<p class=${cx('px-ai', cls)}><i>${children}</i></p>` : null;
  P.AI = AI;
  /* contributors as a small boxed table inside the card: name with a bar, then up to three figures */
  const MiniTab = ({ title, cols, rows })=> html`<div class="px-mt"><div class="px-mt-h">${title}</div>
    ${rows.length? html`<table><thead><tr>${cols.map((c,i)=> html`<th key=${i} class=${i? 'r' : ''}>${c}</th>`)}</tr></thead><tbody>
      ${rows.map(r=> html`<tr key=${r.key} title=${r.cells[0]}><td><span class="n">${r.cells[0]}</span><span class="trk"><i style=${{ width:r.w+'%' }}/></span></td>${r.cells.slice(1).map((c,i)=> html`<td key=${i} class=${cx('r num', i===0 && 'v')}>${c}</td>`)}</tr>`)}</tbody></table>`
    : html`<p class="faint">No records for these filters.</p>`}</div>`;
  const mtRows = (rows, cells)=>{ const mx = Math.max(...rows.map(r=> r.val), 0) || 1; return rows.map(r=> ({ key:r.key, w:r.val/mx*100, cells:cells(r) })); };
  const scoreTone = (s)=> s==null? COL.fade : s>=75? 'var(--px-pos)' : s>=50? '#B08A1E' : 'var(--px-crit)';
  const SHORT = { match:'Invoice match', approval:'Approval', price:'Contract price', grt:'Receipt timeliness', otp:'On-time payment' };

  /* lower-case for running text, keeping acronyms (PO, GR, IRN, PAN, GSTIN, MSME) */
  const lc = (t)=> String(t||'').split(' ').map(w=> /^[A-Z0-9]{2,}$/.test(w)? w : w.toLowerCase()).join(' ');
  P.lc = lc;
  const topOf = (facts, dim)=>{ const r = M.group(facts.filter(x=>x.ok===false), (x)=> x.g[dim]).sort((a,b)=> b.n-a.n)[0]; return r || null; };
  const compNote = (id, f, K, seg)=>{
    if(seg){ const g = M.segComp(id, f, seg); if(!g.n) return 'No '+seg.toLowerCase()+' vendors have records here.';
      const all = (K[id]||{}).v, d = all==null || g.rate==null? null : g.rate - all;
      return seg+' vendors score '+pct(g.rate,1)+' here'+(d==null? '.' : Math.abs(d)<0.1? ', the same as all vendors.' : ', '+FCT.n(Math.abs(d),1)+' points '+(d<0? 'worse' : 'better')+' than all vendors ('+pct(all,1)+').')+(g.bad? ' '+FCT.n(g.bad)+' of their '+FCT.n(g.n)+' records had a problem.' : ''); }
    const k = K[id]; if(!k || k.v==null) return 'No data for these filters.';
    if(id==='mdq'){ const t = topOf(M.facts('mdq', f), 'check'); return k.bad? FCT.n(k.bad)+' vendor details are missing or out of date. The most common gap: '+(t? lc(t.key)+' ('+t.n+')' : '—')+'.' : 'Every vendor record is complete.'; }
    if(!k.bad) return 'No problems in '+FCT.n(k.n)+' records.';
    const fs = M.facts(id, f), t = topOf(fs, { approval:'rule', match:'reason', price:'type', grt:'site', otp:'lateness' }[id]), n = FCT.n(k.bad), sh = pct(k.bad/k.n*100,1), tn = t? ' ('+FCT.n(t.n)+')' : '';
    return { approval: n+' orders ('+sh+') went out without the right sign-off. Most were signed off only after the order was placed'+tn+'.',
      match: n+' bills ('+sh+') did not match what was ordered or received. Most often the delivery was never recorded'+tn+'.',
      price: n+' bill lines ('+sh+') charged more than the agreed price'+(t && /above/i.test(t.key)? tn : '')+'.',
      grt: n+' deliveries ('+sh+') were logged more than 2 days after they arrived. '+(t? t.key+' is the slowest'+tn : '')+'.',
      otp: n+' bills ('+sh+') were paid after their due date, most of them '+(t? lc(t.key) : 'late')+tn+'.' }[id]; };
  P.compNote = compNote;
  P.KpiBoard = ({ f, kpi, pick, openCase })=>{
    const p = M.period(f.period), prior = p.prior? M.period(p.prior).label : null;
    const K = {}; C.sheet.concat(['mdq']).forEach(id=> K[id] = M.kpi(id, f));
    const hl = K.health.h;
    const spF = M.facts('spend', f), sp = M.group(spF, (x)=> x.rec.cat).map((r,i)=> ({ key:r.key, name:M.CAT[r.key].name, val:r.val }));
    const spT = M.sum(sp, r=>r.val); sp.forEach((r,i)=> r.c = P.CAT_COL[i % P.CAT_COL.length]);
    const tv = M.topVendors(f);
    const ex = K.exposure.e, exF = M.facts('exposure', f), exBy = M.group(exF, (x)=> x.rec.type).slice(0,6).map(r=> ({ key:r.key, name:M.ETYPE[r.key].name, v:+r.val.toFixed(2) }));
    const odF = M.facts('overdue', f), od = M.group(odF, (x)=> x.g.bucket), cm = M.group(M.facts('commit', f), (x)=> x.g.age);
    const vs = M.vendorsIn(f), dup = vs.filter(v=> v.dupPair && M.V[v.dupPair] && M.V[v.dupPair].status==='Active').length/2;
    const cs = M.cases(f).filter(c=> M.statusMeasure(c.stNow)==='potential');
    const [tab, setTab] = useState('all'), [seg0, setSeg] = useState(null), seg = f.pSeg && f.pSeg!=='All'? null : seg0;
    const rows = cs.filter(c=> tab==='all' || (tab==='fin'? M.ETYPE[c.type].basis==='fin' : M.ETYPE[c.type].basis==='ctl'))
      .map(c=> ({ c, val: c.est!=null? c.est : c.affected||0 })).sort((a,b)=> (M.ETYPE[b.c.type].basis==='fin') - (M.ETYPE[a.c.type].basis==='fin') || b.val-a.val).slice(0,7);
    const prio = (c, v)=> M.ETYPE[c.type].basis==='fin'? (v>=.5? 'High' : v>=.1? 'Medium' : 'Low') : (v>=2? 'High' : v>=.5? 'Medium' : 'Low');
    const mix = K.riskmix.mix, hi = mix[0].n + mix[1].n;
    const lostTop = hl.comps.filter(c=>c.lost!=null).sort((a,b)=>b.lost-a.lost)[0];
    const bandTone = !hl.band? 'n' : hl.band.cls==='pos'? 'g' : hl.band.cls==='med'? 'a' : 'r';
    const stTone = { good:['g','On target'], watch:['a','Watch'], off:['r','Off target'], na:['n','No data'] };
    const stCol = { good:'var(--px-pos)', watch:'#B08A1E', off:'var(--px-crit)', na:COL.fade };
    const onT = hl.comps.filter(c=> M.status(c.kpi, c.v)==='good').length;
    /* health component: control rate against target (bullet, trend, change), vendors affected and a one-line reason */
    const comp = (c)=>{ const id = c.kpi, d = M.KPI[id], k = K[id], g = M.segComp(id, f, seg), val = seg? g.rate : c.v, st = M.status(id, val), lo = c.floor-5;
      const P0 = (x)=> Math.max(0, Math.min(100, (x-lo)/(100-lo)*100)), vtag = g.vPct==null? 'No vendors' : pct(g.vPct,0)+' of '+(seg? seg.toLowerCase()+' ' : '')+'vendors affected';
      return html`<button key=${id} type="button" class=${cx('px-cm2 px-cm3', 'st-'+st)} onClick=${stop(()=> pick('health', { key:id, dim:'component' }))} title=${c.name+': score '+(c.sc==null? 'N/A' : Math.round(c.sc))+' of 100, weight '+c.w}>
        <span class="hd"><span class="px-kc-i cm-i" aria-hidden="true"><${Icon} n=${P.KICON[id]} size=${14} strokeWidth=${1.7}/></span><span class="n">${SHORT[id] || 'Master data'}</span><${Pill} tone=${stTone[st][0]}>${stTone[st][1]}</${Pill}><b class="v num">${val==null? 'N/A' : pct(val)}</b></span>
        <span class="px-bullet" role="img" aria-label=${d.name+' '+pct(val)+' against target '+d.target+'%'}><i style=${{ width:P0(val==null? lo : val)+'%', background:stCol[st] }}/><b style=${{ left:P0(d.target)+'%' }}/></span>
        <span class="cm-m"><span class="faint">Target ${d.target}%</span>${!seg && html`<${DChip} id=${id} v=${k.v} prior=${k.prior}/>`}<span class="sp">${!seg && k.series && html`<${Spark} data=${k.series} w=${90} ht=${20} target=${d.target}/>`}</span></span>
        <span class="px-vt"><span class=${cx('tg', g.vPct>=50? 'hi' : g.vPct>=20? 'md' : 'lo')}><${Icon} n="Users" size=${12}/>${vtag}</span><span class="faint"><b class=${g.bad? 'bad' : ''}>${FCT.n(g.bad)}</b> of ${FCT.n(g.n)} ${id==='mdq'? 'checks' : 'records'}</span></span>
        <${AI} cls="sm">${compNote(id, f, K, seg)}</${AI}></button>`; };
    /* spend against the category budget, and vendor concentration */
    const bd = M.budget(f), bdBy = {}; (bd? bd.rows : []).forEach(r=> bdBy[r.key] = r);
    const tvP = p.prior? M.topVendors(Object.assign({}, f, { period:p.prior })) : null, tvPrior = {}; (tvP? tvP.rows : []).forEach(r=> tvPrior[r.v] = r.spend);
    const top10 = tv.rows.slice(0,10), riskTop = top10.filter(r=> ['Critical','High'].includes(M.risk(r.v).approved)).length, soleTop = top10.filter(r=> M.V[r.v].sole).length;
    const Stat = ({ l, v, s, tone })=> html`<div class=${cx('px-bst', tone && 't-'+tone)}><span class="l">${l}</span><b class="num">${v}</b>${s && html`<small>${s}</small>`}</div>`;
    const signed = (v)=> (v>0? '+' : v<0? '−' : '')+cr(Math.abs(v),1);
    return html`<div class="px-board" aria-label="P2P KPI board"><div class="px-board-in">
      <${Sec} c="kpi" icon="Gauge" title="Headline key performance indicators" sub=${'Spend for '+p.label+'. Commitments, payables and exposure as at '+C.snapLabel+'.'}
        right=${html`<${Pill} tone=${bandTone}>Health ${K.health.v==null? 'N/A' : K.health.v} · ${hl.band? hl.band.label : ''}</${Pill}><${Pill} tone=${onT>=5? 'g' : onT>=3? 'a' : 'r'}>${onT} of ${hl.comps.length} on target</${Pill}><${Pill} tone="r">${cr(ex.potential)} exposure</${Pill}>`}>
        <div class="px-hero3">
          <section class=${cx('px-kc px-feat2', P.kc('health'), kpi==='health' && 'on')} onClick=${()=> pick('health')} aria-label="P2P Health Score">
            <div class="px-rc-h"><button type="button" class="px-kc-t" aria-pressed=${kpi==='health'} onClick=${(e)=>{ e.stopPropagation(); pick('health'); }}><span class="px-kc-i"><${Icon} n=${P.KICON.health} size=${15} strokeWidth=${1.6}/></span><span>P2P Health Score</span></button>
              ${f.pSeg && f.pSeg!=='All'? html`<span class="px-pill t-a" title="Set on Vendor profiles; clear the Segment chip to compare segments here">${M.segName(f.pSeg)} vendors only</span>` : html`<div class="px-seg" role="radiogroup" aria-label="Vendor segment" onClick=${(e)=> e.stopPropagation()}>
                <span class="l">Vendor segment</span>${[null].concat(M.SEGS.map(x=> x.id)).map(g=> html`<button key=${g||'all'} type="button" role="radio" aria-checked=${seg===g} class=${cx(seg===g && 'on', g && 'g-'+g.toLowerCase())}
                  title=${g? (M.SEGS.find(x=>x.id===g)||{}).desc : 'All active vendors'} onClick=${()=> setSeg(g)}>${g? M.segName(g) : 'All'}<small>${M.segCount(f, g)}</small></button>`)}</div>`}
              <span class="px-basis">${p.label}</span></div>
            <div class="px-feat2-b">
              <div class="px-feat2-l px-hs">
                <div class="px-hs-top"><${Ring} v=${K.health.v} band=${hl.band}/>
                  <div class="px-hs-s"><div class="px-hs-p">${hl.band && html`<${Pill} tone=${bandTone}>${hl.band.label}</${Pill}>`}<${DChip} id="health" v=${K.health.v} prior=${K.health.prior}/></div>
                    <div class="px-hs-tr"><span>Apr–Sep trend</span><${Spark} data=${K.health.series} w=${170} ht=${34}/></div></div></div>
                <div class="px-hs-k"><div><b class="num">${onT}<small>/${hl.comps.length}</small></b><span>On target</span></div><div><b class="num">${K.health.v==null? 'N/A' : 100-K.health.v}</b><span>Points lost</span></div><div><b class="num">${pct(hl.coverage*100,0)}</b><span>Data coverage</span></div></div>
                ${K.health.v!=null && html`<div class="px-hs-lost"><div class="h">Where the ${100-K.health.v} points went</div>
                  <${Seg} label="Points lost by component" parts=${hl.comps.filter(c=> c.lost>0.5).sort((a,b)=> b.lost-a.lost).map(c=> ({ l:SHORT[c.kpi] || 'Master data', v:Math.round(c.lost), c:stCol[M.status(c.kpi, c.v)] }))}/></div>`}
                <${AI}>${K.health.v==null? null : 'The score is '+K.health.v+' out of 100'+(K.health.prior!=null? ', '+FCT.n(Math.abs(K.health.v-K.health.prior))+' points '+(K.health.v<K.health.prior? 'lower' : 'higher')+' than '+prior : '')+'. '+(lostTop? (SHORT[lostTop.kpi]||'Master data')+' is pulling it down the most.' : '')}</${AI}></div>
              <div class="px-feat2-c">${hl.comps.map(comp)}</div></div></section>
          <div class="px-hero3-g">
            <${RCard} id="spend" kpi=${kpi} pick=${pick} title="Total Spend" basis=${p.label} value=${cr(K.spend.v,1)}
              chip=${html`<${DChip} id="spend" v=${K.spend.v} prior=${K.spend.prior} mode="pct"/>`} viz=${html`<${AreaSpark} data=${K.spend.series} height=${44}/>`}
              note=${(()=>{ const npo = M.sum(spF.filter(x=>x.rec.npo==='noncompliant'),x=>x.val); return 'We spent '+cr(K.spend.v,0)+' this month'+(K.spend.prior? ', '+pct(Math.abs((K.spend.v-K.spend.prior)/K.spend.prior*100),1)+(K.spend.v>=K.spend.prior? ' more' : ' less')+' than '+prior : '')+'. '+cr(npo,1)+' was bought without a purchase order.'; })()}
              top=${html`<${MiniTab} title="Top business units" cols=${['Business unit','Spend','Share','Change']} rows=${(()=>{ const pf = p.prior? M.facts('spend', Object.assign({}, f, { period:p.prior })) : [];
                return mtRows(top3(spF, (x)=> x.rec.e, (k)=> k+' '+((M.BU[k]||{}).name||'')), (r)=>{ const pv = M.sum(pf.filter(x=>x.rec.e===r.key), x=>x.val); return [r.label, cr(r.val,0), pct(r.val/K.spend.v*100,0), pv? (r.val>=pv? '▲ ' : '▼ ')+pct(Math.abs((r.val-pv)/pv*100),0) : '—']; }); })()}/>`}
              foot=${[['Invoices', FCT.n(spF.filter(x=>!x.rec.cn).length)], ['Without PO', cr(M.sum(spF.filter(x=>x.rec.npo==='noncompliant'),x=>x.val),1), 'r'], ['Top 5 share', pct(tv.top5,0)]]}/>
            <${RCard} id="commit" kpi=${kpi} pick=${pick} title="Open Commitments" basis="Snapshot" value=${cr(K.commit.v,0)}
              chip=${html`<${Pill}>${FCT.n(K.commit.n)} lines</${Pill}>`} viz=${html`<${Seg} label="Open commitments by PO age" parts=${M.poAges.map((a,i)=> ({ l:a.replace(' days','d').replace('Over ','>'), v:(cm.find(r=>r.key===a)||{val:0}).val, c:P.ramp[2+i], f:(v)=> cr(v,0) }))}/>`}
              note=${K.commit.v? cr(K.commit.v,0)+' has been ordered but not yet delivered. '+cr(K.commit.overdue,0)+' of it ('+pct(K.commit.overdue/K.commit.v*100,0)+') is running late.' : null}
              top=${html`<${MiniTab} title="Largest open vendors" cols=${['Vendor','Open','Share','Late']} rows=${mtRows(top3(M.facts('commit', f), (x)=> x.v, (k)=> M.V[k].name), (r)=>{ const ls = M.facts('commit', f).filter(x=>x.v===r.key);
                return [r.label, cr(r.val,1), pct(r.val/K.commit.v*100,0), FCT.n(ls.filter(x=> x.rec.edd < M.SNAP).length)]; })}/>`}
              foot=${[['Late delivery', cr(K.commit.overdue,0), 'a'], ['Over 180d', cr(K.commit.stale,0)], ['GRNI', cr(K.commit.grni,1)]]}/>
            <${RCard} id="overdue" kpi=${kpi} pick=${pick} title="Overdue Payables" basis="Snapshot" value=${cr(K.overdue.v,1)}
              chip=${html`<${Pill} tone="a">${FCT.n(K.overdue.n)} invoices</${Pill}>`} viz=${html`<${Seg} label="Overdue payables by days past due" parts=${M.odBuckets.map((a,i)=> ({ l:a.replace(' days','d').replace('Over ','>'), v:(od.find(r=>r.key===a)||{val:0}).val, c:['#F2C2A6','#EE9A72','#E06A4E','#B8402E'][i], f:(v)=> cr(v,1) }))}/>`}
              note=${K.overdue.v? (()=>{ const run = M.sum(odF.filter(x=>x.g.status==='In run'),x=>x.val); return cr(K.overdue.v,1)+' of bills are past their due date. '+cr(run,0)+' will be paid in the next run; '+cr(K.overdue.blocked,1)+' is on hold.'; })() : null}
              top=${html`<${MiniTab} title="Most overdue vendors" cols=${['Vendor','Overdue','Bills','Oldest']} rows=${mtRows(top3(odF, (x)=> x.v, (k)=> M.V[k].name), (r)=>{ const ls = odF.filter(x=>x.v===r.key);
                return [r.label, amt(r.val), FCT.n(ls.length), Math.max(...ls.map(x=> Math.floor(M.SNAP - x.rec.due)))+'d']; })}/>`}
              foot=${[['In run', cr(M.sum(odF.filter(x=>x.g.status==='In run'),x=>x.val),1)], ['Blocked', cr(K.overdue.blocked,1), 'r'], ['Over 30d', cr(M.sum(odF.filter(x=>x.g.bucket!=='1–30 days'),x=>x.val),1)]]}/>
            <${RCard} id="exposure" kpi=${kpi} pick=${pick} title="Potential Exposure" basis="Snapshot" value=${cr(ex.potential)} tone="crit"
              chip=${html`<${Pill} tone="r">${ex.potN} open cases</${Pill}>`} viz=${html`<div class="px-mini-bars">${exBy.slice(0,3).map(r=> html`<div key=${r.key}><span class="n" title=${r.name}>${r.name}</span><span class="trk"><i style=${{ width:(r.v/(exBy[0]? exBy[0].v : 1)*100)+'%' }}/></span><b class="num">${cr(r.v)}</b></div>`)}</div>`}
              note=${exBy[0]? cr(ex.potential)+' could be at risk and needs checking. The biggest source is '+lc(exBy[0].name)+' ('+pct(exBy[0].v/ex.potential*100,0)+'). Nothing is confirmed lost yet'+(ex.loss>0.005? ' beyond '+cr(ex.loss) : '')+'.' : null}
              top=${html`<${MiniTab} title="Vendors with most exposure" cols=${['Vendor','At risk','Share','Cases']} rows=${mtRows(top3(exF, (x)=> x.v, (k)=> M.V[k].name), (r)=> [r.label, amt(r.val), pct(r.val/ex.potential*100,0), FCT.n(exF.filter(x=>x.v===r.key).length)])}/>`}
              foot=${[['Disputed', cr(ex.disputed)], ['Loss', cr(ex.loss)], ['Control', cr(ex.control,1)]]}/>
          </div></div></${Sec}>
      <${Sec} c="spend" icon="IndianRupee" title="Spend KPIs" sub=${'Posted spend in '+p.label+' by category and vendor. Dots show approved risk.'}
        right=${html`<${Pill} tone="n">${cr(K.spend.v,1)}</${Pill}><${DChip} id="spend" v=${K.spend.v} prior=${K.spend.prior} mode="pct"/>`}><div class="px-brow">
        <${KCard} id="spend" kpi=${kpi} pick=${pick} title="Spend by category" sub=${'Posted spend against the FY27 category budget, '+p.label}>
          ${bd? html`<div class="px-bstrip">
            <${Stat} l="Budget used" v=${pct(bd.bud? bd.act/bd.bud*100 : null,0)} s=${cr(bd.act,0)+' of '+cr(bd.bud,0)} tone=${bd.act>bd.bud? 'r' : bd.act>bd.bud*.95? 'a' : 'g'}/>
            <${Stat} l="Over budget" v=${bd.over.length+' of '+bd.rows.length} s=${bd.over.length? signed(bd.overVal)+' above plan' : 'All within plan'} tone=${bd.over.length? 'r' : 'g'}/>
            <${Stat} l="Year to date" v=${pct(bd.ytdBud? bd.ytdAct/bd.ytdBud*100 : null,0)} s=${cr(bd.ytdAct,0)+' of '+cr(bd.ytdBud,0)} tone=${bd.ytdAct>bd.ytdBud? 'r' : 'g'}/>
            <${Stat} l="FY27 remaining" v=${cr(bd.left,0)} s=${pct(bd.left/bd.fy*100,0)+' left, '+bd.monthsLeft+' months'}/></div>`
          : html`<p class="px-bnote faint">Budgets are held by category for the group. Clear the BU, region, risk and vendor filters to compare spend with budget.</p>`}
          <div class="px-catd"><div class="px-catd-c" style=${{height:150}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.PieChart}>
            <${R.Pie} data=${sp} dataKey="val" nameKey="name" innerRadius="62%" outerRadius="96%" paddingAngle=${1} stroke=${COL.surface} strokeWidth=${2} isAnimationActive=${!P.useRM()} onClick=${(d,i,e)=>{ e && e.stopPropagation && e.stopPropagation(); pick('spend', { key:M.CAT[d.key].name, dim:'cat' }); }} style=${{cursor:'pointer'}}>
              ${sp.map((r,i)=> h(R.Cell, { key:i, fill:r.c }))}</${R.Pie}><${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=> cr(v)+' · '+pct(v/spT*100) })}/></${R.PieChart}></${R.ResponsiveContainer}>
            <div class="px-donut-c"><b>${cr(spT,0)}</b><span>${sp.length} categories</span></div></div>
          <div class="px-catb"><div class=${cx('px-catb-h', !bd && 'nb')}><span>Category</span><span class="r">Spend</span><span class="r">Share</span>${bd && html`<span>Budget used</span><span class="r">Variance</span>`}</div>
            ${sp.map(r=>{ const b = bdBy[r.key], u = b && b.used;
              return html`<button key=${r.key} type="button" class=${cx('px-catb-r', !bd && 'nb')} onClick=${stop(()=> pick('spend', { key:M.CAT[r.key].name, dim:'cat' }))} title=${r.name+': '+cr(r.val)+(b? ' against a budget of '+cr(b.bud,0)+' ('+pct(u,0)+' used)' : '')}>
              <span class="nm"><i style=${{background:r.c}}/><span class="tx">${r.name}</span></span><b class="num">${cr(r.val,0)}</b><span class="num faint r">${pct(r.val/spT*100,0)}</span>
              ${bd && html`<span class="bu"><span class=${cx('px-bub', u>100? 'over' : u>95? 'near' : '')}><i style=${{ width:Math.min(100, (u||0)/1.25)+'%' }}/><b/></span><span class="num">${b? pct(u,0) : '—'}</span></span>
                <span class=${cx('num r', b && b.var>0? 'neg' : 'pos')}>${b? signed(b.var) : '—'}</span>`}</button>`; })}</div></div>
          ${bd && bd.over.length? html`<${AI}>${bd.over.slice().sort((a,b)=> b.var-a.var).slice(0,2).map(r=> r.name+' is '+pct(r.used-100,0)+' over budget ('+signed(r.var)+')').join('; ')+'. '+cr(bd.left,0)+' of the FY27 budget is left for the remaining '+bd.monthsLeft+' months, about '+cr(bd.left/bd.monthsLeft,0)+' a month against '+cr(bd.fy/12,0)+' planned.'}</${AI}>` : null}</${KCard}>
        <${KCard} id="topv" kpi=${kpi} pick=${pick} title="Top Vendors by Spend" sub=${'Ranked by posted spend, '+p.label+(prior? '; change against '+prior : '')}>
          <div class="px-bstrip">
            <${Stat} l="Top 5 share" v=${pct(tv.top5,0)} s=${cr(M.sum(tv.rows.slice(0,5), r=> r.spend),0)+' of '+cr(tv.total,0)}/>
            <${Stat} l="Top 10 share" v=${pct(tv.top10,0)} s=${tv.rows.length+' vendors paid'}/>
            <${Stat} l="High risk in top 10" v=${riskTop} s="Critical or high approved risk" tone=${riskTop? 'r' : 'g'}/>
            <${Stat} l="Sole source in top 10" v=${soleTop} s="No qualified second source" tone=${soleTop? 'a' : 'g'}/></div>
          <div class="px-topv"><div class="px-topv-r px-topv-h"><span/><span>Vendor</span><span/><span class="r">Spend</span><span class="r">Share</span><span class="r">Change</span></div>
            ${top10.map((r,i)=>{ const pv = tvPrior[r.v], ch = pv? (r.spend-pv)/pv*100 : null, rk = M.risk(r.v).approved;
              return html`<button key=${r.v} type="button" class="px-topv-r" onClick=${stop(()=> pick('topv', { key:r.v, dim:'vendor' }))} title=${r.name+' · '+rk+' risk'+(M.V[r.v].sole? ' · sole source for '+M.V[r.v].sole : '')}>
              <span class="rk num">${i+1}</span><span class="nm"><i style=${{ background:P.RISK[rk] }}/><span class="tx">${r.name}</span>${M.V[r.v].sole && html`<em class="tag">Sole</em>`}</span><span class="trk"><i style=${{ width:(r.spend/tv.rows[0].spend*100)+'%' }}/></span><b class="num">${cr(r.spend,1)}</b><span class="num faint">${pct(r.share)}</span>
              <span class=${cx('num ch', ch==null? 'faint' : ch>=0? 'up' : 'down')}>${ch==null? 'New' : (ch>=0? '▲ ' : '▼ ')+pct(Math.abs(ch),0)}</span></button>`; })}</div></${KCard}>
      </div></${Sec}>
      <${Sec} c="vendor" icon="Users" title="Vendor and Exposure KPIs" sub="Approved risk, master-data quality and value tied to open cases."
        right=${html`<${Pill} tone="r">${mix[0].n} critical</${Pill}><${Pill} tone="a">${mix[1].n} high</${Pill}><${Pill}>${vs.length} active</${Pill}>`}><div class="px-brow">
        <${KCard} id="riskmix" kpi=${kpi} pick=${pick} title="Vendor risk and compliance" sub=${vs.length+' active vendors by approved category'}>
          <${Seg} label="Vendor Risk Mix" parts=${mix.map(m=> ({ l:m.id, v:m.n, c:P.RISK[m.id] }))}/>
          <div class="px-tiles h">
            <button type="button" class="px-tile" onClick=${stop(()=> pick('riskmix', { key:'High', dim:'risk' }))}><span class="i crit"><${Icon} n="TriangleAlert" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">High-risk vendors</span><b>${hi}</b><small>${pct(vs.length? hi/vs.length*100 : null,0)} of active</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> pick('riskmix'))}><span class="i med"><${Icon} n="Eye" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Re-review proposed</span><b>${K.riskmix.rereview}</b><small>model differs</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> pick('health', { key:'mdq', dim:'component' }))}><span class="i ai"><${Icon} n="ListChecks" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Master-data quality</span><b>${pct(K.mdq.v,0)}</b><small>${K.mdq.bad} failing checks</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> location.href = FCT.href('screens/p2p/vendors.html'))}><span class="i brand"><${Icon} n="Link2" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Duplicate records</span><b>${dup}</b><small>same PAN or bank</small></span></button></div></${KCard}>
        <${KCard} id="exposure" kpi=${kpi} pick=${pick} title="Potential exposure by type" sub="Open and under-investigation estimates">
          <div class="px-xbars">${exBy.map(r=> html`<button key=${r.key} type="button" onClick=${stop(()=> pick('exposure', { key:r.key, dim:'type' }))} title=${r.name+': '+cr(r.v)}>
            <span class="n">${r.name}</span><span class="trk"><i style=${{ width:(r.v/(exBy[0]? exBy[0].v : 1)*100)+'%' }}/></span><b class="num">${cr(r.v)}</b></button>`)}</div>
          <${Foot} items=${[['Potential', cr(ex.potential), 'r'], ['Disputed', cr(ex.disputed)], ['Confirmed loss', cr(ex.loss)]]}/></${KCard}>
      </div></${Sec}>
      <${Sec} c="exc" icon="Crosshair" title="Exceptions" sub="Open cases by value: estimates for financial cases, value affected for control cases."
        right=${html`<${Pill} tone="r">${cs.filter(c=>M.ETYPE[c.type].basis==='fin').length} financial</${Pill}><${Pill}>${cs.filter(c=>M.ETYPE[c.type].basis==='ctl').length} control</${Pill}>`}><section class="px-kc px-exc" aria-label="Open exceptions"><div class="px-kc-h"><span class="px-kc-t static"><span class="px-kc-i"><${Icon} n="Crosshair" size=${15} strokeWidth=${1.6}/></span><span>Open exceptions</span></span>
          <${P.Seg} label="Exception type" value=${tab} onChange=${setTab} options=${[['all','All ('+cs.length+')'],['fin','Financial ('+cs.filter(c=>M.ETYPE[c.type].basis==='fin').length+')'],['ctl','Control ('+cs.filter(c=>M.ETYPE[c.type].basis==='ctl').length+')']]}/></div>
        <div class="px-tbl"><table class="t px-t dense"><caption class="sr">Open exceptions</caption><thead><tr><th>Priority</th><th>Type</th><th>Vendor</th><th class="r">Amount</th><th class="r">Age</th><th>Status</th><th><span class="sr">Action</span></th></tr></thead>
          <tbody>${rows.map(({c,val})=>{ const pr = prio(c, val); return html`<tr key=${c.id} tabIndex="0" class="sel" onClick=${()=> openCase(c.id)} onKeyDown=${(e)=>{ if(e.key==='Enter') openCase(c.id); }}>
            <td><span class=${'px-prio p-'+pr.toLowerCase()}>${pr}</span></td><td>${M.ETYPE[c.type].name}<div class="sub">${c.id}${M.ETYPE[c.type].basis==='ctl'? ' · value affected' : ''}</div></td><td>${M.V[c.v].name}</td>
            <td class="r num">${amt(val)}</td><td class="r num">${Math.max(0, Math.floor(M.SNAP - c.opened))}d</td><td>${M.statusName(c.stNow)}</td>
            <td class="r"><button type="button" class="btn sm" onClick=${stop(()=> openCase(c.id))}>${c.ex? 'Decide' : 'Investigate'}</button></td></tr>`; })}</tbody></table></div></section></${Sec}>
      <div class="px-board-f faint">Flows: ${p.label}. Balances at ${C.snapLabel}. Illustrative data.</div>
    </div></div>`;
  };

  /* ---------- helpers on the current navigation ---------- */
  P.ctx = (nav, f)=>{
    const groups = M.nav.groups(nav);
    const comp = nav.kpi==='health'? groups.find(g=>g.dim==='component') : null;
    const eff = comp? comp.key : nav.kpi;
    const gs = groups.filter(g=> g.dim!=='component');
    const vendor = (()=>{ for(let i=nav.path.length-1;i>=0;i--) if(nav.path[i].t==='vendor' || nav.path[i].t==='profile') return nav.path[i].id; return null; })();
    const facts = (eff==='health')? [] : M.facts(eff, f).filter(x=> gs.every(g=> x.g[g.dim]===g.key) && (!vendor || x.v===vendor));
    return { eff, groups:gs, comp, vendor, facts };
  };
  const factSort = (id)=> (a,b)=> M.isRate(id)? ((a.ok===false?0:1)-(b.ok===false?0:1)) || (b.val-a.val) : (b.val-a.val);

  /* column sets for record tables */
  const statusCol = (id)=> ({
    match:{ l:'Match status', fmt:(x)=> x.ok? x.g.status : html`<span class="px-bad">${x.g.reason}</span>` },
    approval:{ l:'DoA result', fmt:(x)=> x.ok? html`<span class="faint">Compliant · ${x.g.threshold}</span>` : html`<span class="px-bad">${x.g.rule}</span>` },
    price:{ l:'Price check', fmt:(x)=> x.ok? html`<span class="faint">${x.g.type}</span>` : html`<span class="px-bad">${x.g.type}${x.variance? ' · '+amt(x.variance) : ''}</span>` },
    grt:{ l:'Posting lag', fmt:(x)=> x.ok? x.g.lag : html`<span class="px-bad">${x.g.lag}</span>` },
    otp:{ l:'Payment timing', fmt:(x)=> x.ok? html`<span class="faint">On time · ${x.rec.run}</span>` : html`<span class="px-bad">${x.g.lateness}</span>` },
    overdue:{ l:'Status', fmt:(x)=> html`<span>${x.g.status}</span> <span class="faint">${x.g.bucket}</span>` },
    spend:{ l:'Category', fmt:(x)=> x.g.cat },
    mdq:{ l:'Check', fmt:(x)=> x.ok? html`<span class="faint">${x.g.check}: pass</span>` : html`<span class="px-bad">${x.g.check}: fails</span>` }
  })[id] || { l:'Status', fmt:(x)=> '' };
  P.factCols = (id, kind)=>{
    if(kind==='case') return [ { k:'id', l:'Case', w:'14%', fmt:(x)=> html`<b>${x.rec.id}</b>${x.rec.ex? html`<span class="sub">${x.rec.ex}</span>` : ''}`, sv:(x)=>x.rec.id },
      { k:'type', l:'Type', w:'26%', fmt:(x)=> M.ETYPE[x.rec.type].name, sv:(x)=>x.rec.type }, { k:'v', l:'Vendor', w:'26%', fmt:(x)=> vname(x.v), sv:(x)=>vname(x.v) },
      { k:'val', l:'Estimate', w:'13%', r:true, fmt:(x)=> x.rec.est==null? html`<span class="faint">n.q.</span>` : amt(x.rec.est), sv:(x)=>x.val },
      { k:'conf', l:'Conf.', w:'9%', r:true, nx:true, fmt:(x)=> pct(x.rec.conf*100,0), sv:(x)=>x.rec.conf }, { k:'st', l:'Status', w:'15%', fmt:(x)=> M.statusName(x.rec.stNow), sv:(x)=>x.rec.stNow },
      { k:'op', l:'Opened', w:'12%', nx:true, fmt:(x)=> M.date(x.rec.opened), sv:(x)=>x.rec.opened } ];
    if(kind==='vendor') return [ { k:'v', l:'Vendor', fmt:(x)=> html`<b>${x.rec.name}</b><div class="sub">${x.rec.id}</div>`, sv:(x)=>x.rec.name },
      { k:'cat', l:'Category', fmt:(x)=> M.CAT[x.rec.cat].name, sv:(x)=>x.rec.cat }, { k:'risk', l:'Risk', fmt:(x)=>{ const r = M.risk(x.v); return html`<${P.RiskTag} cat=${r.approved} score=${r.score} small=${true}/>${r.rereview? html` <span class="px-tag warn" title=${'Model suggests '+r.model}>Re-review</span>` : ''}`; }, sv:(x)=>M.risk(x.v).score },
      { k:'val', l: id==='topv'? 'Spend' : id==='mdq'? 'Check' : 'Period spend', r:true, fmt:(x)=> id==='topv'? html`${cr(x.val)} <span class="faint">${pct(x.share)}</span>` : id==='mdq'? (x.ok? 'Pass' : html`<span class="px-bad">Fails</span>`) : cr(x.spend||0), sv:(x)=> x.spend!=null? x.spend : x.val } ];
    if(kind==='open') return [ { k:'id', l:'PO line', fmt:(x)=> html`<b>${x.rec.po}-${x.rec.poLn}</b>${x.rec.gate? html`<div class="sub">Gate ${x.rec.gate}</div>` : ''}`, sv:(x)=>x.rec.po },
      { k:'v', l:'Vendor', w:'28%', fmt:(x)=> vname(x.v), sv:(x)=>vname(x.v) }, { k:'e', l:'BU', nx:true, w:'9%', fmt:(x)=> x.rec.e }, { k:'d', l:'PO date', nx:true, fmt:(x)=> M.date(x.rec.poD), sv:(x)=>x.rec.poD },
      { k:'edd', l:'Expected', fmt:(x)=> M.date(x.rec.edd), sv:(x)=>x.rec.edd }, { k:'st', l: id==='approval'? 'DoA result' : 'Status', fmt:(x)=> id==='approval'? (x.ok? html`<span class="faint">Compliant</span>` : html`<span class="px-bad">${x.g.rule}</span>`) : x.rec.st },
      { k:'val', l: id==='approval'? 'PO value' : 'Open value', r:true, fmt:(x)=> amt(x.val), sv:(x)=>x.val } ];
    const sc = statusCol(id);
    return [ { k:'id', l:'Invoice', w:'24%', fmt:(x)=> html`<b>${x.rec.ref}</b><div class="sub">${x.rec.id}${x.rec.ex? ' · '+x.rec.ex : ''}</div>`, sv:(x)=>x.rec.id },
      { k:'v', l:'Vendor', w:'30%', fmt:(x)=> vname(x.v), sv:(x)=>vname(x.v) }, { k:'e', l:'BU', nx:true, w:'9%', fmt:(x)=> x.rec.e, sv:(x)=>x.rec.e },
      { k:'d', w:'15%', l: id==='otp'? 'Paid' : id==='approval'? 'PO released' : id==='grt'? 'Gate entry' : id==='overdue'? 'Due' : 'Received', fmt:(x)=> M.date(id==='otp'? x.rec.paid : id==='approval'? x.rec.poD : id==='grt'? x.rec.grPh : id==='overdue'? x.rec.due : x.rec.rcv), sv:(x)=> id==='otp'? x.rec.paid : x.rec.rcv },
      { k:'val', w:'14%', l: id==='approval'? 'PO value' : 'Value', r:true, fmt:(x)=> amt(x.val), sv:(x)=>x.val }, { k:'st', l:sc.l, fmt:sc.fmt, sv:(x)=> x.ok===false? 0 : 1 } ];
  };
  const kindOf = (facts)=> facts.length? facts[0].kind : 'line';
  P.Records = ({ id, facts, onOpen, sel, onSelect, title, limit })=>{
    const groups = {}; facts.forEach(x=>{ (groups[x.kind]=groups[x.kind]||[]).push(x); });
    const kinds = Object.keys(groups);
    return html`<${Fragment}>${kinds.map(k=> html`<${P.Card} key=${k} title=${html`${title || (k==='case'? 'Cases' : k==='vendor'? 'Vendors' : k==='open'? 'Open PO lines' : 'Transactions')} <span class="px-count">${FCT.n(groups[k].length)}</span>`} className="flush">
      <${P.Table} cols=${P.factCols(id, k)} rows=${groups[k].slice().sort(factSort(id))} rowKey=${(x)=> x.rec.id + (x.g.check||'')} caption=${title||'Records'}
        sel=${sel} onSelect=${onSelect} onOpen=${onOpen} limit=${limit||20}/></${P.Card}>`)}</${Fragment}>`;
  };

  /* group facts by a dimension into BarList rows */
  P.groupRows = (id, facts, dim)=>{
    const rate = M.isRate(id);
    let rows = M.group(facts, (x)=> x.g[dim], { rate, label:(k)=> M.dimLabel(dim, k) });
    if(rate) rows = rows.filter(r=> r.bad>0 || dim==='component');
    return rows.map(r=> Object.assign(r, rate? { val:r.bad, sub: FCT.n(r.bad)+' of '+FCT.n(r.n)+' · '+amt(r.badVal)+(r.rate!=null? ' · rate '+pct(r.rate) : '') }
      : { sub: FCT.n(r.n)+' records'+(r.nv>1 && dim!=='vendor'? ' · '+r.nv+' vendors' : '') }));
  };
  const rateFmt = (v,r)=> FCT.n(v);
  const DimSwitch = ({ id, dim, onChange, exclude })=> html`<${P.Pick} label="By" value=${dim} onChange=${onChange}
    options=${(M.dims[id]||[]).filter(d=> !(exclude||[]).includes(d)).map(d=> [d, M.dimName[d]])}/>`;

  /* selected-group detail (single click on a bar): local analysis without navigating */
  const SelDetail = ({ id, facts, sel, dim, onDrill, onVendor })=>{
    if(!sel) return null;
    const fs = facts.filter(x=> x.g[dim]===sel.key), rate = M.isRate(id);
    const vend = M.group(fs, (x)=> x.v, { rate }).slice(0,5);
    const bad = fs.filter(x=>x.ok===false);
    return html`<div class="px-seld" aria-live="polite"><div class="hd"><b>${M.dimLabel(dim, sel.key)}</b><button type="button" class="btn sm primary" onClick=${onDrill}>Drill in<${Icon} n="ChevronRight" size=${14}/></button></div>
      <div class="px-kv">${rate? html`<div><span>Records</span><b>${FCT.n(fs.length)}</b></div><div><span>Non-compliant</span><b>${FCT.n(bad.length)} · ${amt(M.sum(bad,x=>x.val))}</b></div><div><span>Rate</span><b>${pct(fs.length? (fs.length-bad.length)/fs.length*100 : null)}</b></div>`
        : html`<div><span>Records</span><b>${FCT.n(fs.length)}</b></div><div><span>Value</span><b>${cr(M.sum(fs,x=>x.val))}</b></div>`}</div>
      ${dim!=='vendor' && html`<div class="ct">Vendors behind it</div>${vend.map(v=> html`<button key=${v.key} type="button" class="px-vrow" onClick=${()=>onVendor(v.key)}><span>${vname(v.key)}</span><span class="num">${rate? FCT.n(v.bad)+' · '+amt(v.badVal) : amt(v.val)}</span></button>`)}`}</div>`;
  };

  /* generic breakdown block: bar list by a dimension + selected detail */
  const Breakdown = ({ id, facts, nav, dispatch, title, sub, exclude, valFmt })=>{
    const top = M.nav.top(nav), dims = (M.dims[id]||[]).filter(d=> !(exclude||[]).includes(d));
    const dim = top.by && dims.includes(top.by)? top.by : dims[0];
    const rows = P.groupRows(id, facts, dim), rate = M.isRate(id);
    const sel = nav.sel && nav.sel.dim===dim? nav.sel : null;
    const drill = (r)=> dispatch({ t:'drill', node:N.group(dim, r.key) });
    return html`<${P.Card} title=${title || (rate? 'Non-compliant records' : 'Breakdown')} sub=${sub}
        right=${dims.length>1 && html`<${DimSwitch} id=${id} dim=${dim} exclude=${exclude} onChange=${(d)=> dispatch({ t:'node', v:{ by:d } })}/>`}>
        <${P.BarList} rows=${rows} label=${'Breakdown by '+M.dimName[dim]} sel=${sel && sel.key} fmt=${valFmt || (rate? rateFmt : (v)=>cr(v))} rate=${rate}
          onSelect=${(r)=> dispatch({ t:'sel', v:{ key:r.key, dim } })} onOpen=${drill} emptyText=${rate? 'No non-compliant records in this view.' : undefined}/>
        <${SelDetail} id=${id} facts=${facts} sel=${sel} dim=${dim} onDrill=${()=> sel && drill(sel)} onVendor=${(v)=> dispatch({ t:'drill', node:N.vendor(v) })}/></${P.Card}>`;
  };

  /* ---------- KPI root views ---------- */
  const Head = ({ id, f, children })=>{
    const k = M.kpi(id, f), d = M.KPI[id], st = M.status(id, k.v), tv = P.useTween(k.v);
    return html`<div class="px-head"><div class="big"><div class="v num">${P.fmtKpi(id, tv)}${id==='health' && k.v!=null? html`<small>/100</small>` : ''}</div>
      <div class="m"><${P.StatusCue} st=${st}/><${P.Delta} id=${id} v=${k.v} prior=${k.prior}/>${k.prior!=null && html`<span class="faint">vs ${M.period(M.period(f.period).prior).label}</span>`}<${P.KpiDef} id=${id}/></div>
      ${k.v==null && html`<div class="px-na">N/A: no eligible records for these filters. Not shown as zero.</div>`}</div>
      <div class="px-stats">${children}</div></div>`;
  };
  /* the component view's analysis card (assets/js/shared/explore.js) */
  const EX = FCTExplore.make(P, M, { theme:{ grt:'lag' } });
  const roots = {};
  /* P2P Health Score detail: checkpoints filter the open-case table in place; rows open the case */
  const stageTone = (rate)=> rate==null? 'na' : rate>=.15? 'off' : rate>=.05? 'watch' : 'good';
  roots.health = ({ f, nav, dispatch })=>{
    const hl = M.health(f), S = M.chainScope(f), ex = M.exposure(M.cases(f)), top = M.nav.top(nav), stg = top.stage || null;
    const sel = nav.sel && nav.sel.dim==='component'? nav.sel.key : null;
    const comp = sel && hl.comps.find(c=>c.kpi===sel);
    const all = M.cases(f).filter(c=> M.statusMeasure(c.stNow)==='potential').map(c=> Object.assign(c, { cs:M.caseStages(c) }));
    const byStage = {}; C.stages.forEach(s=> byStage[s.id] = all.filter(c=> c.cs.stages[s.id]).length);
    const rows = all.filter(c=> !stg || c.cs.stages[stg]).map(c=> ({ rec:c, kind:'case', v:c.v, val: c.est!=null? c.est : (c.affected||0), g:{} }))
      .sort((a,b)=> (M.ETYPE[b.rec.type].basis==='fin') - (M.ETYPE[a.rec.type].basis==='fin') || (b.val*(b.rec.conf||1)) - (a.val*(a.rec.conf||1)));
    const setStage = (s)=> dispatch({ t:'node', v:{ stage: s===stg? null : s } });
    const cols = [
      { k:'id', l:'Case', w:'14%', fmt:(x)=> html`<b>${x.rec.id}</b><div class="sub">${x.rec.ex? x.rec.ex+' · ' : ''}${M.date(x.rec.opened)} · ${Math.max(0, Math.floor(M.SNAP - x.rec.opened))}d open</div>`, sv:(x)=> x.rec.opened },
      { k:'v', l:'Vendor and business', w:'22%', fmt:(x)=> html`<b class="nb">${vname(x.v)}</b><div class="sub">${x.rec.e} · ${(M.CAT[(M.V[x.v]||{}).cat]||{}).name||''}</div>`, sv:(x)=> vname(x.v) },
      { k:'val', l:'Exposure', w:'13%', r:true, fmt:(x)=> html`<b>${amt(x.val)}</b><div class="sub">${x.rec.est!=null? 'estimate · '+pct(x.rec.conf*100,0) : 'value affected'}</div>`, sv:(x)=> x.val },
      { k:'t', l:'Investigation', w:'37%', fmt:(x)=>{ const codes = stg? (x.rec.cs.stages[stg]||[]) : [];
          return html`<b class="nb">${M.ETYPE[x.rec.type].name}</b><div class="sub">At ${M.stage(x.rec.cs.primary).name}${codes.length? ' · here: '+codes.map(k=> M.issue(k).name).join('; ') : ''}</div>`; }, sv:(x)=> x.rec.type },
      { k:'st', l:'Status', w:'11%', fmt:(x)=> html`<span class=${'px-cst s-'+x.rec.stNow}>${M.statusName(x.rec.stNow)}</span><div class="sub">${M.ETYPE[x.rec.type].basis==='fin'? 'Financial' : 'Control'}</div>`, sv:(x)=> x.rec.stNow } ];
    return html`<${Fragment}>
      <${Head} id="health" f=${f}><${P.Stat} label="Data coverage" value=${pct(hl.coverage*100,0)} sub=${hl.coverage<1? 'Components without data are excluded, not scored as perfect' : 'All six components have data'}/>
        <${P.Stat} label="Band" value=${hl.band? hl.band.label : 'N/A'} sub="Healthy 75+, Watch 55–74, At risk below 55"/>
        <${P.Stat} label="Points lost" value=${hl.score==null? 'N/A' : FCT.n(100-hl.score)} sub=${'Largest: '+(hl.comps.filter(c=>c.lost!=null).sort((a,b)=>b.lost-a.lost)[0]||{name:'—'}).name}/></${Head}>
      <div class="px-grid g-2">
        <${P.Card} title="Component contributions" sub="Normalised score = (value − floor) ÷ (target − floor). Select a component; drill in for business unit, vendor and evidence.">
          <div class="px-comps" role="list">${hl.comps.map(c=> html`<div key=${c.kpi} role="listitem" class=${cx('px-comp', sel===c.kpi && 'on')} onDoubleClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}>
            <button type="button" class="b" aria-pressed=${sel===c.kpi} onClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}>
              <span class="n">${c.name}<small>weight ${c.w}</small></span><span class="v num">${c.v==null? 'N/A' : pct(c.v)}</span>
              <span class="trk" title=${'Score '+(c.sc==null? 'N/A' : Math.round(c.sc))}><i style=${{ width:(c.sc||0)+'%' }}/><em style=${{ left:'100%' }}/></span>
              <span class="p num">${c.contrib==null? '—' : '+'+FCT.n(c.contrib,1)}<small>${c.lost==null? '' : ' −'+FCT.n(c.lost,1)}</small></span></button>
            <button type="button" class="px-drill" aria-label=${'Drill in to '+c.name} onClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}><${Icon} n="ChevronRight" size=${14}/></button></div>`)}</div>
          ${comp && html`<div class="px-note">${comp.name}: ${comp.v==null? 'no data' : pct(comp.v)} against floor ${comp.floor}% and target ${comp.target}% gives ${Math.round(comp.sc)} of 100, worth ${FCT.n(comp.contrib,1)} of the score. <button type="button" class="px-link" onClick=${()=> dispatch({ t:'kpiJump', kpi:comp.kpi })}>Open ${comp.name}</button></div>`}</${P.Card}>
        <${P.Card} title="Health trend" sub="Master-data quality has no history before this snapshot, so earlier months use five components (coverage 85%)."><${P.Trend} id="health" f=${f}/></${P.Card}></div>
      <${P.Card} title="Where in the P2P chain the issues arise" className="px-chk-card"
        right=${html`<div class="px-chk-act">${stg && html`<button type="button" class="btn sm" onClick=${()=> setStage(null)}><${Icon} n="RotateCcw" size=${13}/>View all</button>`}<a class="btn sm" href=${FCT.href('screens/p2p/process.html')}><${Icon} n="Layers" size=${13}/>Process chain</a></div>`}>
        <ol class="px-chk" aria-label="P2P checkpoints: select one to filter the open cases below">${C.stages.map((s,i)=>{ const x = S[s.id], rate = x.vol? x.n/x.vol : null, tone = stageTone(rate), on = stg===s.id;
          return html`<li key=${s.id}><button type="button" class=${cx('px-chk-b', 't-'+tone, on && 'on', stg && !on && 'dim')} aria-pressed=${on} onClick=${()=> setStage(s.id)}
              title=${s.q+' '+FCT.n(x.n)+' of '+FCT.n(x.vol)+' records have an issue.'}>
            <span class="ic"><${Icon} n=${s.icon} size=${20} strokeWidth=${1.7}/></span>
            <span class="tx"><span class="nm">${s.name}</span><span class="rt num">${rate==null? 'No data' : pct(rate*100,1)+' with issues'}</span></span>
            <span class="ct"><b class="num">${FCT.n(byStage[s.id])}</b><small>open cases</small></span>
            <span class="ft">${FCT.n(x.n)} records · ${amt(x.val)}</span></button>${i<5 && html`<span class="ar" aria-hidden="true"><${Icon} n="ChevronRight" size=${16}/></span>`}</li>`; })}</ol>
        <div class="px-chk-k" aria-hidden="true"><span><i class="t-good"/>Under 5% of records with issues</span><span><i class="t-watch"/>5–15%</span><span><i class="t-off"/>Over 15%</span></div></${P.Card}>
      <${P.Card} className="flush px-cases" title=${html`${stg? 'Open cases touching '+M.stage(stg).name : 'All open cases'} <span class="px-count">${FCT.n(rows.length)}</span>`}
        right=${html`<span class="px-cases-s">${stg? html`<span class="px-pill t-a">Filtered: ${M.stage(stg).name}</span><button type="button" class="px-link sm" onClick=${()=> setStage(null)}>View all ${FCT.n(all.length)}</button>`
          : html`<span class="faint">Potential ${cr(ex.potential)} · disputed ${cr(ex.disputed)} · loss ${cr(ex.loss)}</span>`}</span>`}>
        <${P.Table} cols=${cols} rows=${rows} rowKey=${(x)=>x.rec.id} caption=${stg? 'Open cases at '+M.stage(stg).name : 'All open cases'} rowClick=${true} dense=${true}
          onOpen=${(x)=> dispatch({ t:'drill', node:N.case(x.rec.id) })} limit=${12}
          emptyText=${stg? 'No open cases touch '+M.stage(stg).name+' under these filters. Use View all to see every case.' : 'No open cases under these filters.'}/></${P.Card}></${Fragment}>`;
  };
  roots.spend = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('spend', f), tv = M.topVendors(f), cn = M.sum(facts.filter(x=>x.rec.cn), x=>x.val);
    return html`<${Fragment}><${Head} id="spend" f=${f}><${P.Stat} label="Invoices posted" value=${FCT.n(facts.filter(x=>!x.rec.cn).length)} sub=${'Credit notes '+cr(cn)}/>
      <${P.Stat} label="Spend without a PO" value=${cr(M.sum(facts.filter(x=>x.rec.npo==='noncompliant'),x=>x.val))} sub="Included in spend; see Approval Compliance"/><${P.Stat} label="Top 5 vendors" value=${pct(tv.top5)} sub=${'Top 10 '+pct(tv.top10)}/></${Head}>
      <${P.Card} title="Spend by month" sub="Posted spend net of credit notes"><${P.Trend} id="spend" f=${f} bars=${true} height=${150}/></${P.Card}>
      <${Breakdown} id="spend" facts=${facts} nav=${nav} dispatch=${dispatch}/></${Fragment}>`; };
  roots.commit = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('commit', f);
    return html`<${Fragment}><${Head} id="commit" f=${f}><${P.Stat} label="Open PO lines" value=${FCT.n(k.n)} sub="Released, not fully received"/>
      <${P.Stat} label="Delivery overdue" value=${cr(k.overdue)} sub="Expected date passed"/><${P.Stat} label="Older than 180 days" value=${cr(k.stale)} sub="Candidates to close or confirm"/>
      <${P.Stat} label="Received, not invoiced" value=${cr(k.grni)} sub="GRNI liability: shown beside, not added" tone="aside"/></${Head}>
      <${Breakdown} id="commit" facts=${facts} nav=${nav} dispatch=${dispatch} sub="Open value at the snapshot. Budget comparison is not shown: no reliable budget feed in the demo."/></${Fragment}>`; };
  roots.overdue = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('overdue', f), by = M.group(facts, (x)=>x.g.status);
    return html`<${Fragment}><${Head} id="overdue" f=${f}><${P.Stat} label="Invoices past due" value=${FCT.n(k.n)}/>
      <${P.Stat} label="Blocked, disputed or held" value=${cr(k.blocked)} sub="Inside the total; not payable until cleared"/><${P.Stat} label="In tomorrow's run" value=${cr(M.sum(facts.filter(x=>x.g.status==='In run'),x=>x.val))} sub=${M.X.runs.next.id+', '+M.X.runs.next.label}/></${Head}>
      <${P.Card} title="By status" sub="Not-yet-due invoices are excluded."><div class="px-split">${by.map(r=> html`<div key=${r.key}><span>${r.key}</span><b class="num">${cr(r.val)}</b><small>${r.n} invoices</small></div>`)}</div></${P.Card}>
      <${Breakdown} id="overdue" facts=${facts} nav=${nav} dispatch=${dispatch}/></${Fragment}>`; };
  roots.exposure = ({ f, nav, dispatch, facts })=>{ const e = M.exposure(M.cases(f));
    return html`<${Fragment}><${Head} id="exposure" f=${f}><${P.Stat} label="Disputed" value=${cr(e.disputed)} sub=${e.disN+(e.disN===1?' case':' cases')+': separate measure'} tone="aside"/>
      <${P.Stat} label="Confirmed loss" value=${cr(e.loss)} sub=${e.lossN+(e.lossN===1?' case':' cases')+' validated under policy'} tone="aside"/><${P.Stat} label="Control value" value=${cr(e.control)} sub=${e.controlN+' approval and no-PO cases: shown beside, never added'} tone="aside"/></${Head}>
      <${Breakdown} id="exposure" facts=${facts} nav=${nav} dispatch=${dispatch} title="Potential exposure by" sub="Estimated value of open and under-investigation cases."/>
      <${P.Records} id="exposure" facts=${facts} onOpen=${(x)=> dispatch({ t:'drill', node:N.case(x.rec.id) })} title="Open cases"/></${Fragment}>`; };
  roots.riskmix = ({ f, nav, dispatch, facts })=>{
    const top = M.nav.top(nav), mode = top.mode || 'count', tot = facts.length, sp = M.sum(facts, x=>x.spend||0);
    const rows = C.risk.cats.map(c=>{ const fs = facts.filter(x=>x.g.risk===c.id), s = M.sum(fs, x=>x.spend||0); return { key:c.id, n:fs.length, spend:s, val: mode==='spend'? s : fs.length, share: mode==='spend'? (sp? s/sp*100 : 0) : (tot? fs.length/tot*100 : 0) }; });
    const sel = nav.sel && nav.sel.dim==='risk'? nav.sel.key : null, rr = facts.filter(x=> M.risk(x.v).rereview);
    return html`<${Fragment}><${Head} id="riskmix" f=${f}><${P.Stat} label="High or Critical" value=${FCT.n(rows[0].n+rows[1].n)} sub=${pct(sp? (rows[0].spend+rows[1].spend)/sp*100 : null)+' of period spend'}/>
      <${P.Stat} label="Re-review proposed" value=${FCT.n(rr.length)} sub="Model score differs from approved category"/></${Head}>
      <div class="px-grid g-2"><${P.Card} title="Vendor Risk Mix" sub=${mode==='spend'? 'Share of period spend (denominator: '+cr(sp)+')' : 'Count of active vendors (denominator: '+tot+')'}
          right=${html`<${P.Seg} label="Measure" value=${mode} onChange=${(m)=> dispatch({ t:'node', v:{ mode:m } })} options=${[['count','Vendor count'],['spend','Spend']]}/>`}>
          <${P.Donut} rows=${rows} mode=${mode} sel=${sel} onSelect=${(k)=> dispatch({ t:'sel', v:{ key:k, dim:'risk' } })} onOpen=${(k)=> dispatch({ t:'drill', node:N.group('risk', k) })}
            centre=${html`<b>${mode==='spend'? cr(sp,0) : tot}</b><span>${mode==='spend'? 'spend' : 'vendors'}</span>`}/>
          <div class="px-legend">${rows.map(r=> html`<button key=${r.key} type="button" class=${cx(sel===r.key && 'on')} onClick=${()=> dispatch({ t:'sel', v:{ key:r.key, dim:'risk' } })} onDoubleClick=${()=> dispatch({ t:'drill', node:N.group('risk', r.key) })}>
            <i style=${{background:P.RISK[r.key]}}/>${r.key}<b class="num">${mode==='spend'? cr(r.spend) : r.n}</b><span class="faint">${pct(r.share,0)}</span></button>`)}</div></${P.Card}>
        <${P.Card} title=${sel? sel+' vendors' : 'Category definitions'} right=${sel && html`<button type="button" class="btn sm primary" onClick=${()=> dispatch({ t:'drill', node:N.group('risk', sel) })}>Drill in<${Icon} n="ChevronRight" size=${14}/></button>`}>
          ${sel? html`<p class="px-p">${C.risk.defs[sel]}</p>${facts.filter(x=>x.g.risk===sel).sort((a,b)=> M.risk(b.v).score-M.risk(a.v).score).slice(0,8).map(x=> html`<button key=${x.v} type="button" class="px-vrow" onClick=${()=> dispatch({ t:'drill', node:N.vendor(x.v) })}><span>${x.rec.name}</span><span class="num">${M.risk(x.v).score} · ${cr(x.spend||0)}</span></button>`)}`
            : html`<dl class="px-defs">${C.risk.cats.map(c=> html`<div key=${c.id}><dt><${P.RiskTag} cat=${c.id}/></dt><dd>${C.risk.defs[c.id]}</dd></div>`)}</dl>`}</${P.Card}></div>
      ${rr.length>0 && html`<${P.Records} id="riskmix" facts=${rr} onOpen=${(x)=> dispatch({ t:'drill', node:N.vendor(x.v) })} title="Re-review proposed"/>`}</${Fragment}>`;
  };
  roots.topv = ({ f, nav, dispatch, facts })=>{ const tv = M.topVendors(f), sel = nav.sel && nav.sel.dim==='vendor'? nav.sel.key : null;
    const rows = facts.slice(0,10).map(x=>({ key:x.v, label:x.rec.name, val:x.val, sub:pct(x.share)+' of spend · '+M.risk(x.v).approved, tone: sel===x.v? COL.brass : P.RISK[M.risk(x.v).approved] }));
    const others = facts.slice(10); if(others.length) rows.push({ key:'__others', label:'Others ('+others.length+' vendors)', val:M.sum(others,x=>x.val), sub:pct(M.sum(others,x=>x.share))+' of spend', tone:COL.fade });
    return html`<${Fragment}><${Head} id="topv" f=${f}><${P.Stat} label="Top 10 share" value=${pct(tv.top10)}/><${P.Stat} label="Total Spend" value=${cr(tv.total)} sub="Denominator"/>
      <${P.Stat} label="Largest vendor" value=${facts[0]? facts[0].rec.name : 'N/A'} sub=${facts[0]? pct(facts[0].share)+' of spend' : ''}/></${Head}>
      <div class="px-grid"><${P.Card} title="Top Vendors by Spend" sub="Ranked by posted spend; bar colour is approved risk category">
        <${P.BarList} rows=${rows} label="Top vendors by spend" sel=${sel} onSelect=${(r)=> r.key!=='__others' && dispatch({ t:'sel', v:{ key:r.key, dim:'vendor' } })} onOpen=${(r)=> r.key!=='__others' && dispatch({ t:'drill', node:N.vendor(r.key) })}/></${P.Card}>
        ${sel && html`<${P.Card} title="Selection" className="px-selcard"><${VendorMini} id=${sel} f=${f} onOpen=${()=> dispatch({ t:'drill', node:N.vendor(sel) })}/></${P.Card}>`}</div></${Fragment}>`; };
  const VendorMini = ({ id, f, onOpen })=>{ const p = M.vendor(id, f), rk = p.rk;
    return html`<div class="px-seld"><div class="hd"><b>${p.v.name}</b><button type="button" class="btn sm primary" onClick=${onOpen}>Drill in<${Icon} n="ChevronRight" size=${14}/></button></div>
      <div class="px-kv"><div><span>Risk</span><b><${P.RiskTag} cat=${rk.approved} score=${rk.score} small=${true}/></b></div><div><span>Six-month spend</span><b>${cr(p.total)}</b></div><div><span>Open commitments</span><b>${cr(p.opVal)}</b></div></div>
      <div style=${{height:90}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${C.months.map((m,i)=>({ m:m.slice(0,3), v:+p.byM[i].toFixed(2) }))} margin=${{top:6,right:4,left:-22,bottom:0}}>
        <${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${40}/><${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=>cr(v) })}/><${R.Bar} dataKey="v" name="Spend" fill=${COL.brand2} radius=${[2,2,0,0]}/></${R.BarChart}></${R.ResponsiveContainer}></div></div>`; };
  const rateRoot = (id, statsFn, extra)=> ({ f, nav, dispatch, facts })=>{ const k = M.kpi(id, f);
    return html`<${Fragment}><${Head} id=${id} f=${f}>${statsFn(k, facts, f)}</${Head}>
      <div class="px-grid g-2"><${P.Card} title=${M.KPI[id].name+' by month'} sub="Target line in brass; selected period highlighted. Months with no eligible records are gaps, not zero."><${P.Trend} id=${id} f=${f}/></${P.Card}>${extra? extra(k, facts, f, dispatch) : html`<div/>`}</div>
      <${Breakdown} id=${id} facts=${facts} nav=${nav} dispatch=${dispatch}/></${Fragment}>`; };
  roots.match = rateRoot('match', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="PO invoices received"/><${P.Stat} label="Not matched" value=${FCT.n(k.bad)} sub="Open (blocked) or forced"/>
    <${P.Stat} label="First-pass match" value=${pct(k.fp)} sub="No exception at all"/><${P.Stat} label="Value-weighted" value=${pct(k.val)} sub="Count-weighted is the headline"/>`,
    (k, facts)=>{ const st = M.group(facts, (x)=>x.g.status); return html`<${P.Card} title="How invoices reached a match" sub="Count of PO invoices in the period"><div class="px-split col">${st.map(r=> html`<div key=${r.key}><span>${r.key}</span><b class="num">${FCT.n(r.n)}</b><small>${cr(r.val)}</small></div>`)}</div></${P.Card}>`; });
  roots.approval = rateRoot('approval', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="PO lines released (invoiced or open)"/><${P.Stat} label="Non-compliant" value=${FCT.n(k.bad)} sub="Approved late, too low, split or missing"/>`,
    (k, facts)=> html`<${P.Card} title="Delegation of Authority" sub="Required level by line value; commitment event = PO release"><table class="px-mini"><thead><tr><th>Level</th><th class="r">Up to</th><th class="r">Lines</th><th class="r">Breaches</th></tr></thead><tbody>
      ${C.doa.map(d=>{ const fs = facts.filter(x=> x.rec.lvlReq===d.lvl); return html`<tr key=${d.lvl}><td>${d.name}</td><td class="r num">${d.upTo===Infinity? 'Above ₹5 Cr' : amt(d.upTo)}</td><td class="r num">${FCT.n(fs.length)}</td><td class="r num">${FCT.n(fs.filter(x=>x.ok===false).length)}</td></tr>`; })}</tbody></table></${P.Card}>`);
  roots.price = rateRoot('price', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="Contracted invoice lines"/><${P.Stat} label="Non-compliant" value=${FCT.n(k.bad)}/>
    <${P.Stat} label="Price variance" value=${cr(k.varCr)} sub="Value-weighted, above contract and tolerance"/><${P.Stat} label="Contract coverage" value=${pct(k.cov)} sub="Lines with no contract are excluded"/>`,
    (k, facts)=>{ const exp = M.X.vendors.filter(v=> (v.ct||[]).some(c=> /Expired|not loaded/i.test(c.status))); return html`<${P.Card} title="Contract validity" sub="Contracts that change the price check"><table class="px-mini"><thead><tr><th>Vendor</th><th>Contract</th><th>Status</th></tr></thead><tbody>${exp.map(v=> v.ct.map(c=> html`<tr key=${c.id}><td>${v.name}</td><td>${c.id} · ${c.item}</td><td>${c.status}</td></tr>`))}</tbody></table></${P.Card}>`; });
  roots.grt = rateRoot('grt', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="Receipts with a gate-entry time"/><${P.Stat} label="Late or not posted" value=${FCT.n(k.bad)}/>
    <${P.Stat} label="Data coverage" value=${pct(k.cov)} sub=${FCT.n(k.na)+' receipts at sites with no gate feed: N/A'}/>`,
    (k, facts, f)=>{ const un = M.openPo(f).filter(o=>o.gate).concat(M.X.lines.filter(l=> l.gate && l.grPs==null && M.recOk(f,l.v,l.e)));
      return html`<${P.Card} title="Received at the gate, receipt not posted" sub="Snapshot. A missing ERP receipt is not proof goods did not arrive."><div class="px-split col">${['IN-02 Plant A','IN-02 Plant B','IN-05 Plant','IN-04 Plant'].map(s=>{ const xs = un.filter(x=>x.site===s); return xs.length? html`<div key=${s}><span>${s}</span><b class="num">${xs.length} passes</b><small>${cr(M.sum(xs, x=> x.amt!=null? x.amt : x.val))}</small></div>` : null; })}</div>
</${P.Card}>`; });
  roots.otp = rateRoot('otp', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="Invoices paid in the period"/><${P.Stat} label="Paid late" value=${FCT.n(k.bad)} sub=${cr(k.lateCr)}/>
    <${P.Stat} label="Unpaid and overdue" value=${FCT.n(k.od)} sub="Not in the rate: see Overdue Payables" tone="aside"/>`,
    (k, facts, f, dispatch)=> html`<${P.Card} title="Unpaid past due (separate)" sub="These have not been paid, so they cannot be on time or late yet."><div class="px-split col">${M.group(M.facts('overdue', f), (x)=>x.g.status).map(r=> html`<div key=${r.key}><span>${r.key}</span><b class="num">${FCT.n(r.n)}</b><small>${cr(r.val)}</small></div>`)}</div>
      <button type="button" class="px-link sm" onClick=${()=> dispatch({ t:'kpiJump', kpi:'overdue' })}>Open Overdue Payables</button></${P.Card}>`);

  /* ---------- deeper views ---------- */
  const GroupView = ({ f, nav, dispatch, cx:ctx })=>{
    const top = M.nav.top(nav), id = ctx.eff, facts = ctx.facts, rate = M.isRate(id);
    if(id==='health') return html`<${P.Empty} text="Select a component."/>`;
    const bad = facts.filter(x=> x.ok===false), used = ctx.groups.map(g=>g.dim);
    return html`<${Fragment}>
      <div class="px-head"><div class="big"><div class="v num">${rate? pct(facts.length? (facts.length-bad.length)/facts.length*100 : null) : cr(M.sum(facts,x=>x.val))}</div>
        <div class="m"><span class="faint">${M.KPI[id].name}${top.dim==='component'? ', '+(nav.kpi==='health'? 'a health component' : '') : ' for '+top.label.replace(/^[^:]+: /,'')}</span>${ctx.comp && html`<span class="px-tag">Health component</span>`}</div></div>
        <div class="px-stats"><${P.Stat} label="Records" value=${FCT.n(facts.length)}/>${rate && html`<${P.Stat} label="Non-compliant" value=${FCT.n(bad.length)} sub=${amt(M.sum(bad,x=>x.val))}/>`}<${P.Stat} label="Vendors" value=${FCT.n(new Set(facts.map(x=>x.v)).size)}/></div></div>
      ${facts.length===0? html`<${P.Empty}/>` : html`<${EX.Explore} id=${id} facts=${facts} exclude=${used} onDrill=${(d,k)=> dispatch({ t:'drill', node:N.group(d, k) })}
        renderRecords=${(fx, tags)=> html`${tags}${fx.length? html`<${P.Records} id=${id} facts=${fx} limit=${8} onOpen=${(x)=> dispatch({ t:'drill', node:N.rec(x) })}/>` : html`<${P.Empty} text="No records match these filters."/>`}`}/>`}</${Fragment}>`;
  };
  const VendorInKpi = ({ f, nav, dispatch, cx:ctx })=>{
    const id = ctx.vendor, k = ctx.eff, facts = ctx.facts, why = M.why(id, { kpi:k==='health'? null : k, f, groups:ctx.groups }), p = M.vendor(id, f);
    const rate = M.isRate(k), bad = facts.filter(x=>x.ok===false);
    return html`<${Fragment}>
      <${P.Card} title=${'Why '+p.v.name+' surfaced'} right=${html`<button type="button" class="btn primary sm" onClick=${()=> dispatch({ t:'drill', node:N.profile(id) })}>Open full Vendor Profile</button>`}>
        <ul class="px-why">${why.map((w,i)=> html`<li key=${i} class=${'w-'+w.t} title=${P.vt(w.text)}>${w.kpi && html`<b>${w.kpi}: </b>`}${P.vt(w.text)}</li>`)}</ul></${P.Card}>
      <div class="px-stats row"><${P.Stat} label=${M.KPI[k]? M.KPI[k].name+' records' : 'Records'} value=${FCT.n(facts.length)}/>${rate && html`<${P.Stat} label="Non-compliant" value=${FCT.n(bad.length)} sub=${amt(M.sum(bad,x=>x.val))}/>`}
        <${P.Stat} label="Six-month spend" value=${cr(p.total)} sub=${p.rank? 'Rank '+p.rank.rank+' · '+pct(p.rank.share)+' of period spend' : ''}/><${P.Stat} label="Open cases" value=${FCT.n(p.cases.filter(c=>M.statusMeasure(c.stNow)==='potential').length)}/></div>
      ${k==='riskmix'? html`<${RiskFactors} p=${p}/>` : facts.length? html`<${P.Records} id=${k} facts=${facts} onOpen=${(x)=> dispatch({ t:'drill', node:N.rec(x) })} title=${'Records for '+p.v.name}/>` : html`<${P.Empty} text="This vendor has no records for this KPI under the current filters."/>`}</${Fragment}>`;
  };

  const RiskFactors = ({ p })=> html`<${P.Card} title="Risk factors" sub=${'Score = 60% worst factor + 40% weighted average of assessed factors'+(p.rk.coverage<1? ' (coverage '+pct(p.rk.coverage*100,0)+')' : '')}>
    <div class="px-factors">${p.rk.factors.map(x=> html`<div key=${x.id} class="px-factor"><span class="n">${x.name}<small>weight ${x.w}</small></span>
      <span class="trk"><i style=${{ width:(x.v||0)+'%', background: x.v>=80? COL.crit : x.v>=60? COL.high : x.v>=40? '#B08A1E' : COL.light }}/></span><span class="v num">${x.v==null? 'N/A' : x.v}</span>
      <span class="w">${x.why}<small> · ${x.src}</small></span></div>`)}</div>
    ${p.rk.esc && html`<div class="px-note"><${Icon} n="TriangleAlert" size=${14}/> ${p.rk.esc}.</div>`}
    <div class="px-note">Approved category <${P.RiskTag} cat=${p.rk.approved} small=${true}/> · model score ${p.rk.score} (${p.rk.model})${p.rk.rereview? ': re-review proposed' : ''}. Last review ${p.v.lastReview || '15-Sep-2026'}.</div></${P.Card}>`;

  /* ---------- Vendor Profile (deep destination) ---------- */
  P.VendorProfile = ({ id, f, ctx, onDoc, onCase })=>{
    const p = M.vendor(id, f), v = p.v, rk = p.rk, why = M.why(id, ctx);
    const [tab,setTab] = useState('docs');
    const dd = v.dd||{}, bank = v.bank;
    const st = p.stCount;
    return html`<div class="px-prof">
      <div class="px-id"><div><h2>${v.name}</h2><div class="faint">${v.id} · ${M.CAT[v.cat].name} · ${v.bu} ${(M.BU[v.bu]||{}).name||''} · buyer ${v.buyer} · ${v.status}${v.since? ' since '+v.since : ''}</div>
          <div class="tags"><${P.RiskTag} cat=${rk.approved} score=${rk.score}/>${rk.rereview && html`<span class="px-tag warn">Model suggests ${rk.model}: re-review</span>`}${v.msme && html`<span class="px-tag">MSME (45-day terms)</span>`}${v.sole && html`<span class="px-tag warn">Sole source: ${v.sole}</span>`}${v.foreign && html`<span class="px-tag">Import: ${v.foreign}</span>`}<span class="px-tag">Terms ${v.terms} days</span></div></div>
        <div class="px-idk"><${P.Stat} label="Six-month spend" value=${cr(p.total)} sub=${pct(p.catShare*100)+' of category'}/><${P.Stat} label="Open commitments" value=${cr(p.opVal)} sub=${cr(p.opOver)+' delivery overdue'}/><${P.Stat} label="Overdue payables" value=${cr(p.odVal)} sub=${p.od.length+' invoices'}/></div></div>
      <div class="px-grid g-2">
        <${P.Card} title="Why this vendor surfaced"><ul class="px-why">${why.map((w,i)=> html`<li key=${i} class=${'w-'+w.t} title=${P.vt(w.text)}>${w.kpi && html`<b>${w.kpi}: </b>`}${P.vt(w.text)}</li>`)}</ul>
          ${(v.ex||[]).length>0 && html`<div class="px-exs">${v.ex.map(e=>{ const x = FCT.ex(e); return x? html`<div key=${e} class="px-ex"><span><b>${e}</b> ${P.vt(x.title)}</span><${P.Decide} id=${e}/></div>` : null; })}</div>`}</${P.Card}>
        <${RiskFactors} p=${p}/></div>
      <${P.Card} title="Where in the P2P chain this vendor causes issues" sub="Six months of invoices plus open PO lines. Each stage shows records with issues and the value they carry.">
        <ol class="px-flow compact">${p.stages.map((s,i)=> html`<li key=${s.id}><div class="px-stage static"><span class="sh"><b>${s.name}</b></span><span class="sv num">${FCT.n(s.n)}<small> records</small></span>
          <span class="sx">${amt(s.val)}</span><span class="st">${s.issues.slice(0,2).map(x=> M.issue(x.code).name+' ('+x.n+')').join('; ') || 'No issues'}</span></div>${i<5 && html`<span class="ar" aria-hidden="true">→</span>`}</li>`)}</ol>
        ${p.issues.length>0 && html`<table class="px-mini rec"><thead><tr><th>Issue</th><th>Stage</th>${C.months.map(m=> html`<th key=${m} class="r">${m.slice(0,3)}</th>`)}<th class="r">Records</th><th class="r">Value</th></tr></thead><tbody>
          ${p.issues.slice(0,10).map(r=> html`<tr key=${r.code}><td>${M.issue(r.code).name}</td><td class="faint">${M.stage(M.issue(r.code).stage).name}</td>${r.months.map((n,i)=> html`<td key=${i} class="r num" style=${{ background: n? P.heatColor(n, Math.max(...r.months)) : null, color: n && n/Math.max(...r.months)>.5? '#fff' : null }}>${n||''}</td>`)}<td class="r num">${r.n}</td><td class="r num">${amt(r.val)}</td></tr>`)}</tbody></table>
`}</${P.Card}>
      <div class="px-grid g-3">
        <${P.Card} title="Spend by month"><div style=${{height:150}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${C.months.map((m,i)=>({ m:m.slice(0,3), v:+p.byM[i].toFixed(2) }))} margin=${{top:8,right:4,left:-18,bottom:0}}>
          <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${42}/><${R.Tooltip} cursor=${{fill:'rgba(15,59,58,.05)'}} content=${h(P.Tip,{ fmt:(v)=>cr(v) })}/>
          <${R.Bar} dataKey="v" name="Spend posted" fill=${COL.brand2} radius=${[3,3,0,0]} maxBarSize=${26}/></${R.BarChart}></${R.ResponsiveContainer}></div>
          <p class="px-p faint">${p.rank? 'Rank '+p.rank.rank+' · '+pct(p.rank.share)+' of '+M.period(f.period).label+' spend' : 'No spend in '+M.period(f.period).label}</p></${P.Card}>
        <${P.Card} title="Delivery, quality and payment"><div class="px-kv">
          <div><span>OTIF (6 months)</span><b>${v.dormant? 'N/A (no supply)' : v.otif+'%'}</b></div><div><span>Receipt rejections</span><b>${v.dormant? 'N/A' : v.rej+'%'}</b></div>
          <div><span>Receipts posted ≤48 h</span><b>${pct(p.grt)}${p.grN? html`<small> of ${p.grN}</small>` : ''}</b></div><div><span>Invoices paid on time</span><b>${pct(p.otp)}${p.paid.length? html`<small> of ${p.paid.length}</small>` : ''}</b></div>
          <div><span>Contract-price compliance</span><b>${pct(p.ctRate)}${p.ct.length? html`<small> of ${p.ct.length} lines</small>` : ''}</b></div><div><span>Price variance</span><b>${cr(p.ctVar)}</b></div></div></${P.Card}>
        <${P.Card} title="Open items"><div class="px-kv">${Object.entries(st).sort((a,b)=>b[1].val-a[1].val).map(([k,r])=> html`<div key=${k}><span>${k}</span><b>${r.n} · ${amt(r.val)}</b></div>`)}
          <div><span>Open PO lines</span><b>${p.op.length} · ${amt(p.opVal)}</b></div><div><span>Received, not invoiced</span><b>${p.gr.length} · ${amt(p.grVal)}</b></div>
          ${v.adv && html`<div><span>Advance ${v.adv.id}</span><b>${amt(v.adv.cr)} · ${v.adv.ageM} months${v.adv.secured? '' : ', unsecured'}</b></div>`}</div></${P.Card}></div>
      <div class="px-grid g-2">
        <${P.Card} title="Contracts and agreed prices">${(v.ct||[]).length? html`<table class="px-mini"><thead><tr><th>Contract</th><th>Item</th><th>Agreed price</th><th>Valid</th><th>Status</th></tr></thead><tbody>${v.ct.map(c=> html`<tr key=${c.id}><td>${c.id}</td><td>${c.item}</td><td>${c.price}</td><td class="num">${c.from} → ${c.to}</td><td class=${/Expired|not loaded/.test(c.status)? 'px-bad' : ''}>${c.status}</td></tr>`)}</tbody></table>`
          : html`<p class="px-p faint">${p.ct.length? p.ct.length+' contracted lines priced from rate cards in the contract repository; no contract header loaded in the demo.' : 'No contract on file. Lines are excluded from Contract-Price Compliance (not counted as compliant).'}</p>`}</${P.Card}>
        <${P.Card} title="Due diligence and master data"><ul class="px-checks">${C.mdChecks.map(([k,n])=> html`<li key=${k} class=${(v.md||{})[k]===false? 'fail' : 'pass'}><${Icon} n=${(v.md||{})[k]===false? 'TriangleAlert' : 'Check'} size=${13}/>${n}</li>`)}
          <li class=${dd.insolvency? 'fail' : 'pass'}><${Icon} n=${dd.insolvency? 'TriangleAlert' : 'Check'} size=${13}/>${dd.insolvency || 'No insolvency filings (MCA21, e-courts)'}</li>
          <li class=${dd.gstr? 'fail' : 'pass'}><${Icon} n=${dd.gstr? 'TriangleAlert' : 'Check'} size=${13}/>${dd.gstr || 'GST returns filed on time'}</li>
          ${dd.kyc && html`<li class="fail"><${Icon} n="TriangleAlert" size=${13}/>${dd.kyc}</li>`}
          <li class=${bank && bank.pending? 'fail' : 'pass'}><${Icon} n=${bank && bank.pending? 'TriangleAlert' : 'Check'} size=${13}/>${bank && bank.pending? 'Bank change requested '+bank.at+': '+bank.from+' → '+bank.to+'; call-back not done' : 'Bank account verified; no changes in 6 months'}</li>
          ${p.pair && html`<li class="fail"><${Icon} n="Link2" size=${13}/>Possible duplicate record: ${p.pair.id} ${p.pair.name}</li>`}</ul>
</${P.Card}></div>
      <${P.Card} title="Records and evidence" className="flush" right=${html`<${P.Seg} label="Show" value=${tab} onChange=${setTab} options=${[['docs','Invoices'],['po','Open POs'],['cases','Cases']]}/>`}>
        ${tab==='docs'? html`<${P.Table} cols=${[{ k:'ref', l:'Invoice', fmt:(l)=> html`<b>${l.ref}</b><div class="sub">${l.id}</div>` }, { k:'rcv', l:'Received', fmt:(l)=> M.date(l.rcv), sv:(l)=>l.rcv }, { k:'po', l:'PO', fmt:(l)=> l.po || html`<span class="px-bad">${l.npo==='exempt'? 'PO-exempt' : 'No PO'}</span>` },
            { k:'amt', l:'Value', r:true, fmt:(l)=> amt(l.amt) }, { k:'st', l:'Status', fmt:(l)=> M.payStatus(l) }, { k:'iss', l:'Issues', fmt:(l)=>{ const is = M.issuesOf(l); return is.length? html`<span class="px-bad">${is.map(c=>M.issue(c).name).slice(0,2).join('; ')}</span>` : html`<span class="faint">None</span>`; }, sv:(l)=> M.issuesOf(l).length }]}
            rows=${p.lines} rowKey=${(l)=>l.id} caption="Vendor invoices" onOpen=${(l)=> onDoc(l.id)} limit=${12}/>`
        : tab==='po'? html`<${P.Table} cols=${P.factCols('commit','open')} rows=${p.op.map(o=>({ rec:o, kind:'open', v:o.v, val:o.rem, g:{} }))} rowKey=${(x)=>x.rec.id} caption="Open PO lines" onOpen=${(x)=> onDoc(x.rec.id)} limit=${12} emptyText="No open PO lines."/>`
        : html`<${P.Table} cols=${P.factCols('exposure','case')} rows=${p.cases.map(c=>({ rec:c, kind:'case', v:c.v, val:c.est||0, g:{} }))} rowKey=${(x)=>x.rec.id} caption="Cases" onOpen=${(x)=> onCase(x.rec.id)} limit=${12} emptyText="No cases for this vendor."/>`}</${P.Card}></div>`;
  };

  /* ---------- document (one P2P chain) ---------- */
  P.DocView = ({ id, onVendor, onCase })=>{
    const ch = M.chain(id), l = M.rec(id); if(!l) return html`<${P.Empty} text="This record is not in the demo ledger."/>`;
    const cases = M.X.cases.filter(c=> c.lines.includes(id)), isLine = !!M.line(id);
    return html`<div class="px-grid g-doc">
      <${P.Card} title=${isLine? 'Invoice '+l.ref : M.openLine(id)? 'PO line '+l.po+'-'+l.poLn : 'Received, not invoiced '+l.po} sub=${vname(l.v)+' · '+l.e+' · '+(l.site||'')}
        right=${html`<button type="button" class="btn sm" onClick=${()=> onVendor(l.v)}>Vendor</button>`}><${P.Chain} ch=${ch}/></${P.Card}>
      <div class="px-col">
        ${isLine && html`<${P.Card} title="Values"><div class="px-kv">
          <div><span>Invoice value</span><b>${amt(l.amt)}</b></div><div><span>PO value</span><b>${amt(l.poVal)}</b></div>
          ${l.ip!=null && l.qty>1 && html`<div><span>Unit price: invoice / PO / contract</span><b class="num">₹${FCT.n(l.ip)} / ${l.pp!=null? '₹'+FCT.n(l.pp) : '—'} / ${l.cp!=null? '₹'+FCT.n(l.cp) : 'no contract'}${l.uomI? ' (invoice per '+l.uomI+', PO per '+l.uom+')' : ''}</b></div>
          <div><span>Quantity invoiced / received</span><b class="num">${FCT.n(l.qty)} / ${l.qtyR!=null? FCT.n(l.qtyR) : '—'} ${l.uom||''}</b></div>`}
          ${l.pv && l.pv!=='uom' && l.pv!=='expired' && html`<div><span>Variance (estimate)</span><b>${amt(M.vari(l))}</b></div>`}
          <div><span>Terms · due</span><b>${l.terms} days · ${M.date(l.due)}</b></div><div><span>Payment status</span><b>${M.payStatus(l)}${l.disp? ' · '+l.disp : ''}${l.hold? ' · '+l.hold : ''}</b></div>
          ${l.note && html`<div><span>Note</span><b>${l.note}</b></div>`}</div></${P.Card}>`}
        <${P.Card} title="Issues on this record">${ch && ch.iss.length? html`<ul class="px-ul">${ch.iss.map(c=> html`<li key=${c}><b>${M.stage(M.issue(c).stage).name}:</b> ${M.issue(c).name}</li>`)}</ul>` : html`<p class="px-p faint">No issues raised.</p>`}
          ${cases.map(c=> html`<button key=${c.id} type="button" class="px-vrow" onClick=${()=> onCase(c.id)}><span>Case ${c.id}: ${M.ETYPE[c.type].name}</span><span class="num">${c.est==null? 'value affected '+amt(c.affected) : amt(c.est)}</span></button>`)}</${P.Card}>
        ${isLine && html`<${P.Card} title="Evidence" sub="Source documents; requests are simulated and logged."><ul class="px-ev">${M.evidence(l).map(([t,ref,sys],i)=> html`<li key=${i}><${Icon} n="FileText" size=${14}/><span><b>${t}</b> ${ref}<small> · ${sys}</small></span><button type="button" class="px-link sm" onClick=${()=> FCT.ui.toast(t+' '+ref+' requested from '+sys+' (simulated)')}>View</button></li>`)}</ul></${P.Card}>`}</div></div>`;
  };

  /* ---------- investigation case (potential exposure kept apart from disputed and loss) ---------- */
  /* ---------- investigation case: everything needed to judge one event, adapted to the case type ---------- */
  const TICON = { price:'Scale', ctl:'ClipboardCheck', tol:'Scale', uom:'Scale', dup:'Link2', qty:'Boxes', bank:'Landmark', adv:'IndianRupee', msme:'Clock', sod:'Lock', apr:'ShieldCheck', nopo:'FileWarning' };
  const recVal = (r)=> r.amt!=null? r.amt : r.val!=null? r.val : r.rem!=null? r.rem : 0;
  const ByMonth = ({ rows, label, fmt=(v)=> amt(v) })=>{ const rm = P.useRM(), d0 = C.months.map((m,i)=> ({ m:m.slice(0,3), v:M.sum(rows.filter(r=>r.m===i), r=>r.v) }));
    if(!d0.some(x=>x.v)) return null;
    const lakh = Math.max(...d0.map(x=>x.v)) < 1, d = d0.map(x=> ({ m:x.m, v:+(lakh? x.v*100 : x.v).toFixed(2) })); label = label+(lakh? ', ₹ L' : ', ₹ Cr'); fmt = (v)=> '₹'+FCT.n(v, v<10? 2 : 1)+(lakh? ' L' : ' Cr');
    return html`<div class="px-case-ch"><div class="h">${label}</div><div style=${{height:120}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${d} margin=${{top:6,right:4,left:-14,bottom:0}}>
      <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${46} tickFormatter=${(v)=> FCT.n(v, v && v<10? 1 : 0)}/>
      <${R.Tooltip} cursor=${{fill:'rgba(127,127,127,.08)'}} content=${h(P.Tip,{ fmt })}/><${R.Bar} dataKey="v" name=${label} fill=${COL.kc} radius=${[3,3,0,0]} maxBarSize=${30} isAnimationActive=${!rm}/></${R.BarChart}></${R.ResponsiveContainer}></div></div>`; };
  /* type-specific: summary sentence, record table columns, chart series */
  const caseDetail = (c, lines, v)=>{
    const n = lines.length, sumA = M.sum(lines, l=> l.amt||0), blocked = lines.filter(l=> M.payStatus(l)==='Blocked').length, paid = lines.filter(l=> l.paid!=null && l.paid<=M.SNAP).length;
    const inv = { k:'ref', l:'Invoice', w:'17%', fmt:(l)=> html`<b>${l.ref}</b><div class="sub">${l.id}</div>`, sv:(l)=> l.rcv };
    const dt = { k:'d', l:'Received', fmt:(l)=> M.date(l.rcv), sv:(l)=> l.rcv };
    const val = { k:'a', l:'Value', r:true, fmt:(l)=> amt(l.amt), sv:(l)=> l.amt };
    const pst = { k:'s', l:'Payment', fmt:(l)=> M.payStatus(l), sv:(l)=> M.payStatus(l) };
    const price = (x)=> x==null? '—' : '₹'+FCT.n(x);
    const amtSeries = lines.map(l=> ({ m:l.m, v:l.amt||0 }));
    switch(c.type){
      case 'price': case 'ctl': case 'tol': { const avg = n? M.sum(lines, l=> (l.ip/((c.type==='ctl'? l.pp : l.cp)||l.ip)-1)*100)/n : 0;
        return { sum: n+' invoice line'+(n!==1?'s':'')+' from '+v.name+' carry a price '+(c.type==='ctl'? 'above the PO, where a renewed contract exists' : 'above the valid contract')+' (average +'+FCT.n(avg,1)+'%). Estimated variance '+amt(c.est)+'; '+blocked+' blocked, '+paid+' already paid.'+(c.type==='ctl'? ' This usually resolves to nil once the renewal is loaded.' : ''),
          cols:[inv, dt, { k:'q', l:'Qty', r:true, fmt:(l)=> FCT.n(l.qty)+' '+(l.uom||''), sv:(l)=> l.qty }, { k:'ip', l:'Invoice', r:true, fmt:(l)=> price(l.ip), sv:(l)=> l.ip }, { k:'pp', l:'PO', r:true, fmt:(l)=> price(l.pp) },
            { k:'cp', l:'Contract', r:true, fmt:(l)=> price(l.cp) }, { k:'va', l:'Variance', r:true, fmt:(l)=> amt(M.vari(l)), sv:(l)=> M.vari(l) }, pst],
          series: lines.map(l=> ({ m:l.m, v:M.vari(l) })), chart:'Variance by month' }; }
      case 'uom': return { sum: n+' invoices from '+v.name+' are priced per '+(lines[0]&&lines[0].uomI||'kg')+' while their POs are per '+(lines[0]&&lines[0].uom||'bag')+'; '+blocked+' are blocked in matching. After conversion the residual difference is estimated at '+amt(c.est)+'.',
          cols:[inv, dt, { k:'u', l:'Invoice / PO unit', fmt:(l)=> (l.uomI||'—')+' / '+(l.uom||'—') }, val, { k:'m', l:'Match', fmt:(l)=> l.mSt==='open'? 'Blocked' : l.mSt||'—' }, pst], series:amtSeries, chart:'Invoice value by month' };
      case 'dup': { const [b, a] = c.lines.map(x=> M.rec(x)); const A = a||{}, B = b||{};
        return { sum: 'Invoice '+(B.ref||c.lines[0])+' ('+amt(B.amt)+') matches '+(A.ref||'an earlier invoice')+(A.amt!=null? ' ('+amt(A.amt)+')' : '')+(A.po && A.po===B.po? ' on the same PO '+A.po : '')+(A.irn && A.irn===B.irn? ' with the same IRN' : '')+'. '+(A.paid!=null && A.paid<=M.SNAP? 'The first was paid on '+M.date(A.paid)+'.' : 'Neither has been paid.'),
          compare:[['Vendor', vname(A.v), vname(B.v)], ['Invoice number', A.ref, B.ref], ['Invoice date', M.date(A.invD), M.date(B.invD)], ['Received', M.date(A.rcv), M.date(B.rcv)], ['Amount', amt(A.amt), amt(B.amt)], ['PO / GR', (A.po||'—')+' / '+(A.gr||'—'), (B.po||'—')+' / '+(B.gr||'—')], ['IRN', A.irn||'—', B.irn||'—'], ['Channel', P.vt(A.channel)||'—', P.vt(B.channel)||'—'], ['Payment', A.id? M.payStatus(A) : '—', B.id? M.payStatus(B) : (B.st||'—')]].filter(r=> r[1]!==undefined),
          series:[], chart:null }; }
      case 'qty': return { sum: n+' invoice'+(n!==1?'s':'')+' from '+v.name+' bill more than was received (average +'+FCT.n(n? M.sum(lines, l=> (l.qty/l.qtyR-1)*100)/n : 0,1)+'%). Excess value estimated at '+amt(c.est)+'; '+blocked+' blocked.',
          cols:[inv, dt, { k:'qi', l:'Invoiced', r:true, fmt:(l)=> FCT.n(l.qty) }, { k:'qr', l:'Received', r:true, fmt:(l)=> FCT.n(l.qtyR) }, { k:'x', l:'Excess', r:true, fmt:(l)=> pct((l.qty/l.qtyR-1)*100,1) },
            { k:'xv', l:'Excess value', r:true, fmt:(l)=> amt(l.amt*(1-l.qtyR/l.qty)), sv:(l)=> l.amt*(1-l.qtyR/l.qty) }, pst], series: lines.map(l=> ({ m:l.m, v:l.amt*(1-l.qtyR/l.qty) })), chart:'Excess value by month' };
      case 'msme': { const days = (l)=> Math.floor(l.paid - l.rcv);
        return { sum: n+' invoices to '+v.name+' (MSME) were paid after the 45-day limit, on average '+FCT.n(n? M.sum(lines, days)/n : 0,0)+' days after receipt. Statutory interest is estimated at '+amt(c.est)+'.',
          cols:[inv, dt, { k:'p', l:'Paid', fmt:(l)=> M.date(l.paid), sv:(l)=> l.paid }, { k:'dy', l:'Days', r:true, fmt:(l)=> days(l), sv:days }, { k:'ov', l:'Beyond 45', r:true, fmt:(l)=> days(l)-45 },
            val, { k:'in', l:'Interest', r:true, fmt:(l)=> amt(l.amt*.195*(days(l)-45)/365) }], series: lines.map(l=> ({ m:l.m, v:l.amt*.195*(days(l)-45)/365 })), chart:'Estimated interest by invoice month' }; }
      case 'apr': return { sum: n+' PO line'+(n!==1?'s':'')+' worth '+amt(c.affected)+' were committed outside DoA: '+P.lc(M.ruleName(c.rule))+'. This is value affected, not a loss estimate.',
          cols:[{ k:'po', l:'PO line', fmt:(l)=> html`<b>${l.po}-${l.poLn||10}</b><div class="sub">${l.pr||''}</div>`, sv:(l)=> l.poD }, { k:'c', l:'PR raised', fmt:(l)=> M.date(l.prC) }, { k:'ap', l:'Approved', fmt:(l)=> l.prA==null? html`<span class="px-bad">None</span>` : M.date(l.prA) },
            { k:'rl', l:'PO released', fmt:(l)=> M.date(l.poD) }, { k:'lv', l:'Required / approver', fmt:(l)=> 'L'+l.lvlReq+' / '+(l.lvlAppr==null? '—' : 'L'+l.lvlAppr) }, { k:'pv', l:'PO value', r:true, fmt:(l)=> amt(l.poVal), sv:(l)=> l.poVal }],
          series: lines.map(l=> ({ m:M.monthOf(l.poD), v:l.poVal||0 })), chart:'Value committed by month' };
      case 'nopo': return { sum: n+' invoice'+(n!==1?'s':'')+' from '+v.name+' ('+amt(sumA)+') arrived without a PO in '+(M.CAT[v.cat]||{}).name.toLowerCase()+', a category that requires one.',
          cols:[inv, dt, { k:'c', l:'Category', fmt:(l)=> M.CAT[l.cat].name }, val, pst], series:amtSeries, chart:'Value without a PO by month' };
      case 'bank': return { sum: v.bank? 'Bank details change requested '+v.bank.at+': from '+v.bank.from+' to '+v.bank.to+'. '+amt(sumA)+' is scheduled to this vendor; call-back '+(v.bank.callback? 'completed' : 'not recorded')+'.' : 'Bank-detail change before payment.',
          cols:[inv, dt, val, { k:'du', l:'Due', fmt:(l)=> M.date(l.due) }, { k:'r', l:'Payment run', fmt:(l)=> l.run||'—' }, pst], series:[], chart:null };
      case 'sod': return { sum: (v.dd&&v.dd.kyc? v.dd.kyc+'. ' : '')+'The vendor was paid '+amt(sumA)+(lines[0] && lines[0].paid? ' on '+M.date(lines[0].paid) : '')+' with creation and payment approval by the same user.',
          cols:[inv, dt, val, { k:'p', l:'Paid', fmt:(l)=> M.date(l.paid) }, { k:'r', l:'Payment run', fmt:(l)=> l.run||'—' }], series:[], chart:null };
      case 'adv': { const vl = M.vlines(c.v).filter(l=> !l.cn), last = vl.length? Math.max(...vl.map(l=> l.rcv)) : null;
        return { sum: (v.adv? amt(v.adv.cr)+' advance '+v.adv.id+' is '+v.adv.ageM+' months old and '+(v.adv.secured? 'secured' : 'unsecured')+'. ' : '')+(last==null? v.name+' has no invoices in the six-month ledger.' : 'Last invoice received '+M.date(last)+'.')+(v.adv && v.adv.note? ' '+v.adv.note+'.' : ''),
          adv: v.adv, last, series:[], chart:null }; }
    }
    return { sum:'', cols:[inv, dt, val, pst], series:amtSeries, chart:'Value by month' };
  };
  /* what to do with an open case of each type: recommendation, the action that carries it out, and who owns it */
  const CASE_REC = {
    price:['Raise a debit note for the amount above contract, and correct the price on open PO lines.', 'disputed', 'debit note raised with vendor', 'Raise debit note', 'SD'],
    ctl:['Load the renewed contract price so future invoices match, then re-run the match on blocked invoices.', 'prevented', 'renewed price loaded; invoices re-matched', 'Load renewed price', 'SD'],
    tol:['Accept within tolerance if FX explains the difference; otherwise dispute the excess.', 'nil', 'accepted within tolerance', 'Accept within tolerance', 'VS'],
    uom:['Correct the unit of measure on the PO and ask the vendor for a revised invoice.', 'disputed', 'revised invoice requested', 'Request revised invoice', 'VS'],
    dup:['Block the later invoice before the payment run and recover it if it was paid.', 'prevented', 'duplicate blocked before payment', 'Block duplicate', 'VS'],
    qty:['Hold payment for the quantity not received and ask the plant to confirm the receipt.', 'disputed', 'payment held for quantity not received', 'Hold excess quantity', 'VS'],
    bank:['Hold payments to this vendor until the bank change is verified by call-back to a known contact.', 'inv', 'payments held pending call-back', 'Hold and call back', 'MG'],
    adv:['Ask the vendor to deliver or refund, and provide for the advance if neither happens by month end.', 'inv', 'recovery requested from vendor', 'Request recovery', 'VS'],
    msme:['Pay the MSME vendor now to stop the interest, and accrue the interest already due.', 'prevented', 'paid; interest accrued', 'Pay now and accrue', 'VS'],
    sod:['Review the payment with Internal Audit and remove the conflicting access.', 'inv', 'referred to Internal Audit', 'Refer to Internal Audit', 'PJ'],
    apr:['Get retrospective approval at the right level and remind the requester of the DoA.', 'inv', 'retrospective approval requested', 'Request approval', 'SD'],
    nopo:['Raise the missing PO, and set up a framework PO if the vendor bills regularly.', 'inv', 'PO requested from buyer', 'Request PO', 'SD'] };
  const userName = (id)=> ((window.FCT_DATA.users||[]).find(u=> u.id===id)||{}).name || id;
  P.CaseView = ({ id, onDoc, onVendor, onCase })=>{
    const c0 = M.case(id); if(!c0) return html`<${P.Empty} text="Case not found."/>`;
    const st = M.caseStatus(c0), t = M.ETYPE[c0.type], meas = M.statusMeasure(st);
    const [note,setNote] = useState(''); const [why,setWhy] = useState('');
    useEffect(()=>{ P.dirty = !!note; return ()=>{ P.dirty = false; }; }, [note]);
    const set = (s, label)=>{ if(s==='loss' && !why.trim()){ FCT.ui.toast('Enter the validation basis before confirming a loss'); return; }
      M.setCaseStatus(id, s, note || why); FCT.applyEffects([{ event:'Case '+id+' ('+t.name.toLowerCase()+', '+vname(c0.v)+'): '+label, tower:'P2P' }]); FCT.save(); setNote(''); P.dirty = false; FCT.ui.toast('Case '+id+': '+label); FCT.onChange && FCT.onChange(); };
    const v = M.V[c0.v], pv = M.vendor(c0.v), rk = pv.rk;
    const lines = c0.lines.map(x=> M.line(x)).filter(Boolean), opens = c0.lines.map(x=> M.openLine(x)).filter(Boolean);
    const det = caseDetail(c0, lines, v), cs = M.caseStages(c0);
    const unpaid = lines.filter(M.unpaid), outstanding = c0.type==='adv' && v.adv? v.adv.cr : M.sum(unpaid, l=> l.amt);
    const oldest = unpaid.filter(l=> l.due < M.SNAP).map(l=> Math.floor(M.SNAP - l.due)), age = Math.max(0, Math.floor(M.SNAP - c0.opened));
    const others = M.X.cases.filter(x=> x.v===c0.v && x.id!==id).map(x=> Object.assign({}, x, { stNow:M.caseStatus(x) }));
    const sameType = M.X.cases.filter(x=> x.type===c0.type && x.id!==id && M.statusMeasure(M.caseStatus(x))==='potential');
    const ev = []; const seen = {}; lines.concat(opens).forEach(l=> M.evidence(l).forEach(e=>{ const k = e[0]+e[1]; if(!seen[k]){ seen[k] = 1; ev.push(e); } }));
    if(c0.type==='adv' && v.adv) ev.unshift(['Advance payment voucher', v.adv.id, 'ERP FI']);
    if(c0.type==='bank' && v.bank) ev.unshift(['Bank change request', v.bank.at, 'Vendor master change log']);
    if(v.dd && v.dd.insolvency) ev.push(['Insolvency filing', v.dd.insolvency, 'MCA21, e-courts']);
    if(v.dd && v.dd.gstr) ev.push(['GST record', v.dd.gstr, 'GSTN']);
    const prim = lines[0] || opens[0];
    const fs = [['Exposure', t.basis==='fin'? (c0.est==null? 'Not quantified' : amt(c0.est)) : amt(c0.affected), t.basis==='fin'? 'Estimate, not a loss' : 'Value affected, not a loss'],
      ['Confidence', pct(c0.conf*100,0), M.statusName(st)], ['Open for', age+' days', 'Opened '+M.date(c0.opened)],
      ['Records', FCT.n(c0.lines.length), lines.length+' invoice, '+opens.length+' PO lines'], ['Outstanding', outstanding? amt(outstanding) : '—', c0.type==='adv'? 'Advance balance' : oldest.length? 'Oldest '+Math.max(...oldest)+' days past due' : unpaid.length? 'Not yet due' : 'Nothing unpaid'],
      ['Counts in', meas==='potential'? (t.basis==='fin'? 'Potential Exposure' : 'Control value') : meas==='disputed'? 'Disputed amount' : meas==='loss'? 'Confirmed loss' : 'Closed', 'Raised at '+M.stage(cs.primary).name]];
    return html`<div class="px-case">
      <section class=${'px-case-h '+P.kc('exposure')}><span class="ic"><${Icon} n=${TICON[c0.type]||'Crosshair'} size=${22} strokeWidth=${1.6}/></span>
        <div class="tt"><div class="k">Case ${id}${c0.ex? ' · '+c0.ex : ''}</div><h2>${t.name}</h2><div class="m"><span class=${'px-cst s-'+st}>${M.statusName(st)}</span><span class="px-pill">${M.stage(cs.primary).name}</span><span class="px-pill">${t.basis==='fin'? 'Financial' : 'Control'}</span><button type="button" class="px-link sm" onClick=${()=> onVendor(c0.v)}>${v.name}</button></div></div>
        <dl class="px-case-f">${fs.map(([l,val,s])=> html`<div key=${l}><dt>${l}</dt><dd>${val}</dd><small>${s}</small></div>`)}</dl></section>
      ${(()=>{ /* the decision: is one needed, what is recommended, who owns it, by when, what is at stake */
        const ex = c0.ex && FCT.ex(c0.ex), rec = CASE_REC[c0.type] || ['Investigate and record the outcome.', 'inv', 'assigned for investigation', 'Assign investigator', 'VS'];
        const need = meas==='potential', stake = t.basis==='fin'? (c0.est==null? 'Not quantified yet' : amt(c0.est)+' potential exposure') : amt(c0.affected)+' of spend affected by a control breach';
        const owner = ex? userName(ex.owner) : userName(rec[4]), due = ex? ex.due : (age>14? 'Overdue: open '+age+' days, target 14' : 'Within '+(14-age)+' days (14-day target)');
        return html`<section class=${'px-dec'+(need? ' need' : '')} aria-label="Decision">
          <div class="px-dec-h"><span class="px-dec-st">${need? (ex && !FCT.isOpen(ex)? 'Decided' : 'Decision needed') : 'No decision needed'}</span>
            <span class="faint">${need? 'Owner '+owner+' · '+due : 'Status: '+M.statusName(st)+(st!==c0.st? ' (changed in this session)' : '')}</span></div>
          <div class="px-dec-b"><div class="px-dec-r"><span class="l">Recommended</span><p>${ex && ex.ai? P.vt(ex.ai.text) : rec[0]}</p>
              <dl><div><dt>At stake</dt><dd>${stake}</dd></div><div><dt>Confidence</dt><dd>${pct(c0.conf*100,0)}${ex && ex.ai && ex.ai.confidence? ' · AI '+pct(ex.ai.confidence*100,0) : ''}</dd></div><div><dt>Raised at</dt><dd>${M.stage(cs.primary).name}</dd></div></dl></div>
            ${need && html`<div class="px-dec-a">${ex? html`<${P.Decide} id=${c0.ex}/><small class="faint">Decided through the shared decision ${c0.ex}, so the gate and audit trail stay in one place.</small>`
              : html`<button type="button" class="btn primary" onClick=${()=> set(rec[1], rec[2])}>${rec[3]}</button>
                <button type="button" class="btn sm" disabled=${st==='inv'} onClick=${()=> set('inv','assigned for investigation to '+owner)}>Assign to ${owner.split(' ')[0]}</button>
                <button type="button" class="btn sm" onClick=${()=> set('nil','closed, no issue')}>Close: no issue</button>
                <small class="faint">Every action is logged with this case.</small>`}</div>`}</div></section>`; })()}
      <${AI}>${det.sum}</${AI}>
      <div class="px-calc"><b>Method.</b> ${t.method}.${c0.note? html` <b>Note.</b> ${c0.note}.` : ''}${c0.rule? html` <b>DoA rule.</b> ${M.ruleName(c0.rule)}.` : ''}
        ${Object.keys(cs.stages).length>1 && html` <b>Stages touched.</b> ${Object.keys(cs.stages).map(k=> M.stage(k).name).join(', ')}.`}</div>
      <div class="px-case-g"><div class="px-col">
        <${P.Card} title="What happened" className="px-case-w">
          ${det.compare? html`<table class="px-mini px-cmp"><thead><tr><th/><th>Original</th><th>Candidate duplicate</th></tr></thead><tbody>${det.compare.map(r=> html`<tr key=${r[0]} class=${r[1]===r[2] && r[0]!=='Payment'? 'same' : ''}><td>${r[0]}</td><td>${r[1]||'—'}</td><td>${r[2]||'—'}</td></tr>`)}</tbody></table>`
          : det.adv? html`<div class="px-kv"><div><span>Advance</span><b>${det.adv.id} · ${amt(det.adv.cr)}</b></div><div><span>Age</span><b>${det.adv.ageM} months</b></div><div><span>Security</span><b>${det.adv.secured? 'Secured' : 'Unsecured'}</b></div>
              <div><span>Last invoice from vendor</span><b>${det.last==null? 'None in six months' : M.date(det.last)}</b></div><div><span>Open PO lines</span><b>${pv.op.length} · ${amt(pv.opVal)}</b></div><div><span>Vendor status</span><b>${v.status}${v.dormant? ', no supply' : ''}</b></div></div>
              ${pv.op.length>0 && html`<div class="px-case-ch"><div class="h">Vendor's open PO lines</div></div><${P.Table} cols=${P.factCols('commit','open')} rows=${pv.op.map(o=>({ rec:o, kind:'open', v:o.v, val:o.rem, g:{} }))} rowKey=${(x)=> x.rec.id} caption="Open PO lines" rowClick=${true} dense=${true} onOpen=${(x)=> onDoc(x.rec.id)} limit=${6}/>`}`
          : html`<${ByMonth} rows=${det.series} label=${det.chart}/>`}
          ${det.cols && lines.length>0 && html`<${P.Table} cols=${det.cols} rows=${lines} rowKey=${(l)=> l.id} caption="Case records" rowClick=${true} dense=${true} onOpen=${(l)=> onDoc(l.id)} limit=${8}/>`}
          ${opens.length>0 && html`<${P.Table} cols=${P.factCols('commit','open')} rows=${opens.map(o=>({ rec:o, kind:'open', v:o.v, val:o.rem, g:{} }))} rowKey=${(x)=> x.rec.id} caption="Open PO lines" rowClick=${true} dense=${true} onOpen=${(x)=> onDoc(x.rec.id)} limit=${6}/>`}</${P.Card}>
        <${P.Card} title=${prim? 'Process chain: '+(prim.ref||prim.po) : 'Process chain'}>${prim? html`<${P.Chain} ch=${M.chain(prim.id)}/>` : html`<p class="px-p faint">No transaction record is linked; this case concerns ${c0.type==='adv'? 'an advance payment' : 'the vendor record'}.</p>`}</${P.Card}></div>
        <div class="px-col"><${P.Card} title="Vendor" className="px-case-v" right=${html`<button type="button" class="btn sm" onClick=${()=> onVendor(c0.v)}>Vendor Profile</button>`}>
          <div class="px-case-vh"><b>${v.name}</b><span class="faint">${v.id} · ${(M.CAT[v.cat]||{}).name} · ${v.bu} · since ${v.since}</span>
            <div class="m"><${P.RiskTag} cat=${rk.approved} score=${rk.score} small=${true}/>${rk.rereview && html`<span class="px-tag warn">Model ${rk.model}</span>`}${v.msme && html`<span class="px-tag">MSME</span>`}${v.sole && html`<span class="px-tag warn">Sole source</span>`}<span class="px-tag">${v.status}</span></div></div>
          <div class="px-case-rf">${rk.factors.filter(x=> x.v!=null).sort((a,b)=> b.v-a.v).slice(0,3).map(x=> html`<div key=${x.id} title=${x.why}><span>${x.name}</span><span class="trk"><i style=${{ width:x.v+'%', background: x.v>=80? COL.crit : x.v>=60? COL.high : x.v>=40? 'var(--px-medium)' : COL.light }}/></span><b class="num">${x.v}</b></div>`)}</div>
          <${ByMonth} rows=${M.vlines(c0.v).map(l=> ({ m:l.m, v:l.amt }))} label="Spend by month"/>
          <div class="px-kv"><div><span>Six-month spend</span><b>${cr(pv.total)}</b></div><div><span>Open commitments</span><b>${amt(pv.opVal)}</b></div><div><span>Overdue payables</span><b>${amt(pv.odVal)} · ${pv.od.length}</b></div>
            ${v.adv && html`<div><span>Advance</span><b>${amt(v.adv.cr)} · ${v.adv.ageM} mo</b></div>`}<div><span>Other cases</span><b>${others.length} (${others.filter(x=> M.statusMeasure(x.stNow)==='potential').length} open)</b></div></div></${P.Card}>
          <${P.Card} title="Related exceptions">
            ${c0.ex && FCT.ex(c0.ex) && html`<div class="px-ex"><span>${/^SC-/.test(c0.ex)? 'Supply chain tower: ' : 'Shared decision: '}<b>${c0.ex}</b> ${P.vt(FCT.ex(c0.ex).title)}</span><${P.Decide} id=${c0.ex}/></div>`}
            ${others.length? others.slice(0,5).map(x=> html`<button key=${x.id} type="button" class="px-vrow" onClick=${()=> onCase && onCase(x.id)}><span>${x.id} · ${M.ETYPE[x.type].name}</span><span class="num">${x.est!=null? amt(x.est) : amt(x.affected)} · ${M.statusName(x.stNow)}</span></button>`)
              : html`<p class="px-p faint">No other cases for this vendor.</p>`}
            <p class="px-p faint">${FCT.n(sameType.length)} other open ${t.name.toLowerCase()} cases across all vendors, ${amt(M.sum(sameType, x=> x.est!=null? x.est : x.affected||0))}.</p></${P.Card}>
          <${P.Card} title="Evidence"><ul class="px-ev">${ev.slice(0,8).map(([tt,ref,sys],i)=> html`<li key=${i}><${Icon} n="FileText" size=${14}/><span><b>${tt}</b> ${ref}<small> · ${sys}</small></span><button type="button" class="px-link sm" onClick=${()=> FCT.ui.toast(tt+' '+ref+' requested from '+sys+' (simulated)')}>View</button></li>`)}
            ${!ev.length && html`<li class="faint">No source documents linked.</li>`}</ul></${P.Card}></div></div>
      <${P.Card} title="Investigate" className="px-case-act">
        ${!c0.ex? html`<div class="px-acts">
          <button type="button" class="btn sm" disabled=${st==='inv'} onClick=${()=> set('inv','assigned for investigation to Vikram Shah')}>Assign investigator</button>
          <button type="button" class="btn sm" disabled=${st==='disputed'} onClick=${()=> set('disputed','dispute raised with vendor')}>Raise dispute with vendor</button>
          <button type="button" class="btn sm" disabled=${st==='nil'} onClick=${()=> set('nil','closed, no issue')}>Close: no issue</button>
          <button type="button" class="btn sm" disabled=${st==='prevented'} onClick=${()=> set('prevented','prevented or recovered')}>Mark recovered</button>
          <button type="button" class="btn sm danger" disabled=${st==='loss'} onClick=${()=> set('loss','loss confirmed: '+why)}>Confirm loss</button>
          ${st!==c0.st && html`<button type="button" class="px-link sm" onClick=${()=> set(c0.st,'reopened')}>Reopen</button>`}</div>
          <div class="px-grid g-2"><label class="field"><span>Validation basis (required to confirm a loss)</span><input value=${why} onInput=${(e)=>setWhy(e.target.value)} placeholder="e.g. vendor refused credit note; written off under policy FP-07"/></label>
          <label class="field"><span>Investigation note</span><textarea value=${note} onInput=${(e)=>setNote(e.target.value)} placeholder="Unsaved notes are confirmed before you switch KPI"/></label></div>`
        : html`<div class="px-ex"><span>This case is decided through the shared decision drawer (<b>${c0.ex}</b>) so the decision, gate and audit trail stay in one place. Its status here follows that decision.</span><${P.Decide} id=${c0.ex}/></div>`}</${P.Card}></div>`;
  };

  /* ---------- right-panel router ---------- */
  P.Investigate = ({ nav, dispatch, f, setF, pending, noFilters, wide, onWide, page })=>{
    const top = M.nav.top(nav), ctx = P.ctx(nav, f), k = ctx.comp && top.t==='group' && top.dim==='component' && M.KPI[ctx.comp.key]? M.KPI[ctx.comp.key] : M.KPI[nav.kpi];
    const vend = M.nav.vendor(nav, f);
    const goDoc = (id)=> dispatch({ t:'drill', node:N.doc(id) }), goCase = (id)=> dispatch({ t:'drill', node:N.case(id) }), goV = (id)=> dispatch({ t:'drill', node:N.vendor(id) });
    let body;
    if(top.t==='root'){ const V = roots[nav.kpi]; body = V? html`<${V} f=${f} nav=${nav} dispatch=${dispatch} facts=${ctx.facts}/>` : html`<${P.Empty}/>`; }
    else if(top.t==='group') body = html`<${GroupView} f=${f} nav=${nav} dispatch=${dispatch} cx=${ctx}/>`;
    else if(top.t==='vendor') body = html`<${VendorInKpi} f=${f} nav=${nav} dispatch=${dispatch} cx=${ctx}/>`;
    else if(top.t==='profile') body = html`<${P.VendorProfile} id=${top.id} f=${f} ctx=${{ kpi:ctx.eff==='health'? null : ctx.eff, f, groups:ctx.groups }} onDoc=${goDoc} onCase=${goCase}/>`;
    else if(top.t==='doc') body = html`<${P.DocView} id=${top.id} onVendor=${goV} onCase=${goCase}/>`;
    else if(top.t==='case') body = html`<${P.CaseView} id=${top.id} onDoc=${goDoc} onVendor=${goV} onCase=${goCase}/>`;
    const p = M.period(f.period), act = M.active(f);
    /* page mode: the KPI's own detail screen under the global breadcrumb (no panel trail) */
    if(page) return html`<section class=${'px-panel px-detail '+P.kc(nav.kpi)} aria-labelledby="px-ph">
      <header class="px-ph"><div class="px-pt"><div class="px-pt-t"><h1 id="px-ph"><span class="px-h-i"><${Icon} n=${P.KICON[nav.kpi]} size=${20} strokeWidth=${1.6}/></span>${k.name}</h1><p>${k.q}</p></div>
        <div class="px-pm"><span class="px-tag">${k.time==='Snapshot'? 'Snapshot '+C.snapLabel : p.label}</span>${act.length>0 && html`<span class="faint">${act.length} filter${act.length>1?'s':''}</span>`}<${P.KpiDef} id=${nav.kpi}/></div></div>
        <${P.VendorMarker} id=${vend} isProfile=${top.t==='profile'} onOpen=${()=> dispatch({ t:'drill', node:N.profile(vend) })} onClear=${f.vendor && f.vendor===vend? ()=> setF(Object.assign({}, f, { vendor:null })) : null}/></header>
      <${P.PanelBody} depth=${nav.path.length} sig=${nav.kpi+':'+nav.path.length+':'+top.t+':'+(top.id||top.key||'')} reset=${M.fkey(f)+nav.path.length}>${body}</${P.PanelBody}></section>`;
    return html`<section class=${'px-panel dark '+P.kc(nav.kpi)} aria-labelledby="px-ph">
      <header class="px-ph"><${P.Crumbs} nav=${nav} dispatch=${dispatch} rootLabel=${'Return to '+k.short}/>
        <div class="px-pt"><h1 id="px-ph" title=${k.q}><span class="px-h-i"><${Icon} n=${P.KICON[nav.kpi]} size=${16} strokeWidth=${1.6}/></span>${k.name}</h1>
        <div class="px-pm"><span class="px-tag">${k.time==='Snapshot'? 'Snapshot '+C.snapLabel : p.label}</span>${act.length>0 && html`<span class="faint">${act.length} filter${act.length>1?'s':''}</span>`}
          ${onWide && html`<button type="button" class="btn sm" aria-pressed=${!!wide} onClick=${onWide} title=${wide? 'Show the KPI board again' : 'Give the investigation the full width'}>${wide? 'Show KPI board' : 'Expand'}</button>`}</div></div>
        ${!noFilters && html`<${P.FilterBar} f=${f} setF=${setF} pending=${pending} compact=${true}/>`}
        <${P.VendorMarker} id=${vend} isProfile=${top.t==='profile'} onOpen=${()=> dispatch({ t:'drill', node:N.profile(vend) })} onClear=${f.vendor && f.vendor===vend? ()=> setF(Object.assign({}, f, { vendor:null })) : null}/></header>
      <${P.PanelBody} depth=${nav.path.length} sig=${nav.kpi+':'+nav.path.length+':'+top.t+':'+(top.id||top.key||'')} reset=${M.fkey(f)+nav.path.length}>${body}</${P.PanelBody}></section>`;
  };
})();

/* every record view opens with the action bar (assets/js/shared/act.js): status, AI recommendation, owner, Resolve */
(function(){
  const P = window.P2P, M = window.P2PM; if(!P || !P.DocView || !window.FCTAct) return;
  const { html, h } = P, N = P.node, Body = P.DocView;
  const ACT = P.ACT = FCTAct.make(P, { tower:'p2p', towerName:'P2P', issue:(c)=> M.issue(c) });
  const valOf = (l)=> l.amt!=null? l.amt : l.val!=null? l.val : l.rem!=null? l.rem : 0;
  P.DocView = (pr)=>{ const l = M.rec(pr.id); if(!l) return h(Body, pr); const ch = M.chain(pr.id), cases = M.X.cases.filter(c=> c.lines.includes(pr.id));
    let label = pr.id; try{ label = N.doc(pr.id).label; }catch(e){}
    return html`<div class="px-docwrap"><${ACT.ActionBar} key=${pr.id} id=${pr.id} codes=${ch? ch.iss : []} label=${label} ent=${(M.V[l.v]||{}).name || l.v} val=${valOf(l)} ex=${l.ex}
      cases=${cases.map(c=> ({ id:c.id, name:(M.ETYPE[c.type]||{}).name || c.type }))} onCase=${pr.onCase} ctx=${pr.act} theme=${pr.theme}/>${h(Body, pr)}</div>`; };
})();
