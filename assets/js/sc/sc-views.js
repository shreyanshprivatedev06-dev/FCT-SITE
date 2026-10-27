/* FCT demo — Supply chain control tower: investigation views shared by the three SC screens.
   KPI sheet · Investigate (root → group → material → profile → document / case) · MaterialProfile · DocView · CaseView.
   Same probing model as P2P and O2C (data/manifests/p2p/general-design.md); the subject is inventory. */
(function(){
  const { html, h, R, M, COL, Icon, cx } = SC, P = SC, FCT = window.FCT;
  const { useState, useEffect, Fragment } = React;
  const { cr, amt, pct } = P;
  const C = M.C;
  const vname = (id)=> M.matLabel(id);
  const sname = (id)=> (M.V[id]||{}).name || id;

  /* ---------- node builders (breadcrumb labels carry the full text; CSS truncates) ---------- */
  const KLAB = { lot:'Lot ', fc:'Forecast ', po:'PO line ', gr:'Goods receipt ', gate:'Gate entry ', git:'Shipment ', count:'Count ', batch:'Batch ', ship:'Dispatch ' };
  const N = P.node = {
    group:(dim, key)=> (dim==='vendor'||dim==='material')? N.material(key) : { t:'group', dim, key, label:(dim==='component'? '' : M.dimName[dim]+': ')+M.dimLabel(dim, key) },
    material:(id)=> ({ t:'material', id, label:vname(id) }),
    profile:(id)=> ({ t:'profile', id, label:vname(id) }),
    rec:(x)=> x.kind==='case'? N.case(x.rec.id) : (x.kind==='material'||x.kind==='vendor')? N.material(x.rec.id) : N.doc(x.rec.id),
    doc:(id)=>{ const r = M.rec(id); return { t:'doc', id, label: !r? id : (r.kind==='batch'||r.kind==='lot'? (KLAB[r.kind]||'')+(r.kind==='lot'? r.batch : r.id) : (KLAB[r.kind]||'')+r.id) }; },
    case:(id)=> ({ t:'case', id, label:id }),
    stage:(id)=> ({ t:'group', dim:'stage', key:id, label:'Stage: '+M.stage(id).name }),
    issue:(code)=> ({ t:'group', dim:'issue', key:code, label:'Issue: '+M.issue(code).name })
  };
  N.vendor = N.material;

  /* ---------- small visuals ---------- */
  const Spark = ({ data, w=56, ht=16, target })=>{ const pts = data.map((v,i)=>[i,v]).filter(p=>p[1]!=null); if(pts.length<2) return html`<span class="faint" style=${{fontSize:11}}>No history before this snapshot</span>`;
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
  const Seg = ({ parts, label })=>{ const t = parts.reduce((s,p)=> s + Math.max(0,p.v), 0) || 1;
    return html`<div class="px-segbar" role="img" aria-label=${label}>${parts.map((p,i)=> p.v>0? html`<i key=${i} style=${{ flex:p.v/t, background:p.c }} title=${p.l+': '+(p.f? p.f(p.v) : p.v)}/>` : null)}</div>
      <div class="px-seglg">${parts.map((p,i)=> html`<span key=${i}><i style=${{background:p.c}}/>${p.l} <b>${p.f? p.f(p.v) : p.v}</b></span>`)}</div>`; };
  P.CAT_COL = ['#4FB3A3','#6E9BE0','#E0B25A','#A08BE0','#6CC18F','#E58A6B','#D17BAE','#8FB7C9','#B8C27A'];
  const KCard = ({ id, kpi, pick, title, icon, sub, right, children, className, label })=> html`<section class=${cx('px-kc', P.kc(id), kpi===id && 'on', className)} onClick=${()=> pick(id)} aria-label=${label||title}>
    <div class="px-kc-h"><button type="button" class="px-kc-t" aria-pressed=${kpi===id} onClick=${(e)=>{ e.stopPropagation(); pick(id); }}><span class="px-kc-i"><${Icon} n=${icon || P.KICON[id]} size=${15} strokeWidth=${1.6}/></span><span>${title}</span></button><${P.KpiDef} id=${id}/>${right}</div>
    ${sub && html`<p class="px-kc-s">${sub}</p>`}${children}</section>`;
  const stop = (fn)=> (e)=>{ e.stopPropagation(); fn(); };
  const Sec = ({ c, icon, title, sub, right, children })=> html`<section class=${'px-sec s-'+c} aria-label=${title}>
    <div class="px-sec-h">${icon && html`<span class="px-sec-ic" aria-hidden="true"><${Icon} n=${icon} size=${20} strokeWidth=${1.7}/></span>`}<div class="px-sec-t"><h2>${title}</h2>${sub && html`<p>${sub}</p>`}</div>${right && html`<div class="px-sec-r">${right}</div>`}</div>${children}</section>`;
  const Pill = ({ tone, children, title })=> html`<span class=${'px-pill t-'+(tone||'n')} title=${title}>${children}</span>`;
  const DChip = ({ id, v, prior, mode })=>{
    if(v==null || prior==null || (mode==='pct' && !prior)) return null;
    const d = mode==='pct'? (v-prior)/Math.abs(prior)*100 : v-prior; if(Math.abs(d)<0.05) return html`<${Pill}>No change</${Pill}>`;
    const k = M.KPI[id], up = d>0, good = k.good==='up'? up : k.good==='down'? !up : null;
    return html`<${Pill} tone=${good==null? 'n' : good? 'g' : 'r'} title="Change against the prior period">${up? '▲' : '▼'} ${FCT.n(Math.abs(d),1)}${mode==='pct'? '%' : ' pts'}</${Pill}>`; };
  const Foot = ({ items })=> html`<dl class="px-rc-f">${items.filter(Boolean).map(([l,v,t],i)=> html`<div key=${i}><dt>${l}</dt><dd class=${t||''}>${v}</dd></div>`)}</dl>`;
  const AI = ({ children, cls })=> children? html`<p class=${cx('px-ai', cls)}><i>${children}</i></p>` : null;
  P.AI = AI;
  const RCard = ({ id, kpi, pick, title, basis, value, tone, chip, viz, foot, top, note })=> html`<section class=${cx('px-kc px-rc px-rc3', P.kc(id), kpi===id && 'on')} onClick=${()=> pick(id)} aria-label=${title}>
    <div class="px-rc-h"><button type="button" class="px-kc-t" aria-pressed=${kpi===id} onClick=${(e)=>{ e.stopPropagation(); pick(id); }}><span class="px-kc-i"><${Icon} n=${P.KICON[id]} size=${15} strokeWidth=${1.6}/></span><span>${title}</span></button><${P.KpiDef} id=${id}/><span class="px-basis">${basis}</span></div>
    <div class="px-rc-v"><span class=${cx('v num', tone)}>${value}</span>${chip}</div>
    <div class="px-rc-viz">${viz}</div><${AI}>${note}</${AI}>${top}<${Foot} items=${foot}/></section>`;
  const MiniTab = ({ title, cols, rows })=> html`<div class="px-mt"><div class="px-mt-h">${title}</div>
    ${rows.length? html`<table><thead><tr>${cols.map((c,i)=> html`<th key=${i} class=${i? 'r' : ''}>${c}</th>`)}</tr></thead><tbody>
      ${rows.map(r=> html`<tr key=${r.key} title=${r.cells[0]}><td><span class="n">${r.cells[0]}</span><span class="trk"><i style=${{ width:r.w+'%' }}/></span></td>${r.cells.slice(1).map((c,i)=> html`<td key=${i} class=${cx('r num', i===0 && 'v')}>${c}</td>`)}</tr>`)}</tbody></table>`
    : html`<p class="faint">No records for these filters.</p>`}</div>`;
  const mtRows = (rows, cells)=>{ const mx = Math.max(...rows.map(r=> r.val), 0) || 1; return rows.map(r=> ({ key:r.key, w:r.val/mx*100, cells:cells(r) })); };
  const top4 = (facts, key, label)=> M.group(facts, key).sort((a,b)=> b.val-a.val).slice(0,4).map(r=> ({ key:r.key, label:label(r.key), val:r.val }));
  const scoreTone = (s)=> s==null? COL.fade : s>=75? 'var(--px-pos)' : s>=50? '#B08A1E' : 'var(--px-crit)';
  const SHORT = { fcAcc:'Forecast accuracy', ira:'Record accuracy', rcpt:'Receipt timeliness', valc:'Valuation review', otif:'Supplier OTIF', mdq:'Master data',
    t_dp:'Demand & supply assurance', t_pr:'Procurement & sourcing', t_sp:'Supplier performance & risk', t_iv:'Inventory & availability', t_lg:'Production, warehousing & logistics', t_ct:'Controls, cost & data' };
  const lc = (t)=> String(t||'').split(' ').map(w=> /^[A-Z0-9-]{2,}$/.test(w)? w : w.toLowerCase()).join(' ');
  P.lc = lc;
  const topOf = (facts, dim)=>{ const r = M.group(facts.filter(x=>x.ok===false), (x)=> x.g[dim]).sort((a,b)=> b.n-a.n)[0]; return r || null; };
  const compNote = (id, f, K, seg)=>{
    const sl = M.segLabel(seg);
    if(sl){ const g = M.segComp(id, f, seg); if(!g.n) return 'No '+sl+' materials have records here.';
      const all = (K[id]||{}).v, d = all==null || g.rate==null? null : g.rate - all;
      return sl+' materials score '+pct(g.rate,1)+' here'+(d==null? '.' : Math.abs(d)<0.1? ', the same as all materials.' : ', '+FCT.n(Math.abs(d),1)+' points '+(d<0? 'worse' : 'better')+' than all materials ('+pct(all,1)+').')+(g.bad? ' '+FCT.n(g.bad)+' of their '+FCT.n(g.n)+' records had a problem.' : ''); }
    const k = K[id]; if(!k || k.v==null) return 'No data for these filters.';
    if(M.isTheme(id)){ const subs = (k.subs||[]).filter(x=> x.rate!=null).sort((a,b)=> a.rate-b.rate), w = subs[0];
      return !k.bad? 'Every check passed across '+FCT.n(k.n)+' records.' : 'Critical: '+lc(w.name)+' at '+pct(w.rate,1)+' ('+FCT.n(w.bad)+' of '+FCT.n(w.n)+' failed).'; }
    if(id==='mdq'){ const t = topOf(M.facts('mdq', f), 'check'); return k.bad? FCT.n(k.bad)+' material master settings are missing or out of date. Most common: '+(t? lc(t.key)+' ('+t.n+')' : '—')+'.' : 'Every material record is complete.'; }
    if(id==='fcAcc') return 'Forecast missed actual demand by '+pct(100-k.v,1)+' of value. Bias is '+(k.bias>0? '+' : '')+FCT.n(k.bias,1)+'%, so we '+(k.bias>0? 'over' : 'under')+'-forecast.'+(k.bad? ' '+k.bad+' of '+k.n+' monthly material forecasts were more than 20% off.' : '');
    if(!k.bad) return 'No problems in '+FCT.n(k.n)+' records.';
    const fs = M.facts(id, f), t = topOf(fs, { ira:'plant', rcpt:'plant', otif:'sup', valc:'reason' }[id]), n = FCT.n(k.bad), sh = pct(k.bad/k.n*100,1), tn = t? ' ('+FCT.n(t.n)+')' : '';
    return { ira: n+' counts ('+sh+') were outside the 0.5% tolerance'+(t? ', most at '+t.key+tn : '')+'.',
      rcpt: n+' receipts ('+sh+') were not booked within 48 hours'+(t? ', most at '+t.key+tn : '')+'.',
      otif: n+' PO lines ('+sh+') arrived late or short'+(t? '. '+t.key+' missed most'+tn : '')+'.',
      valc: n+' at-risk lots ('+sh+') have no current review'+(t? ', mostly '+lc(t.key)+tn : '')+'.' }[id]; };
  P.compNote = compNote;

  /* ---------- KPI sheet ---------- */
  P.KpiBoard = ({ f, kpi, pick, openCase })=>{
    const p = M.period(f.period), prior = p.prior? M.period(p.prior).label : null;
    const K = {}; C.sheet.concat(['mdq'], C.health.map(h=> h.kpi)).forEach(id=> K[id] = M.kpi(id, f));
    const hl = K.health.h;
    const invF = M.facts('inv', f), byCat = M.group(invF, (x)=> x.g.cat).map((r,i)=> ({ key:r.key, name:r.key, val:r.val, c:P.CAT_COL[i % P.CAT_COL.length] })), invT = M.sum(byCat, r=>r.val);
    const byAge = C.ages.map((a,i)=> ({ l:a.name.replace(' days','d').replace('Over ','>'), v:M.sum(invF.filter(x=> x.g.age===a.name), x=>x.val), c:P.ramp[Math.min(5,i+1)], f:(v)=> cr(v,0) }));
    const tv = M.topMaterials(f);
    const ex = K.exposure.e, exF = M.facts('exposure', f), exBy = M.group(exF, (x)=> x.rec.type).slice(0,6).map(r=> ({ key:r.key, name:M.ETYPE[r.key].name, v:+r.val.toFixed(2) }));
    const xsF = M.facts('excess', f), rnbF = M.facts('rnb', f);
    const vs = M.materialsIn(f), below = vs.filter(v=> v.cover<v.minD).length;
    const cs = M.cases(f).filter(c=> M.statusMeasure(c.stNow)==='potential');
    const [tab, setTab] = useState('all'), [seg, setSeg] = useState({ a:null, x:null });
    const valOf = (c)=> c.est!=null? c.est : c.affected!=null? c.affected : c.contingent||0;
    const rows = cs.filter(c=> tab==='all' || (tab==='fin'? M.ETYPE[c.type].basis==='fin' : M.ETYPE[c.type].basis==='ctl'))
      .map(c=> ({ c, val:valOf(c) })).sort((a,b)=> (M.ETYPE[b.c.type].basis==='fin') - (M.ETYPE[a.c.type].basis==='fin') || b.val-a.val).slice(0,8);
    const prio = (c, v)=> M.ETYPE[c.type].basis==='fin'? (v>=5? 'High' : v>=1? 'Medium' : 'Low') : (v>=10? 'High' : v>=1? 'Medium' : 'Low');
    const rates = C.health.map(h=> h.kpi), onT = rates.filter(id=> M.status(id, K[id].v)==='good').length;
    const mix = K.riskmix.mix, hi = mix[0].n + mix[1].n;
    const lostTop = hl.comps.filter(c=>c.lost!=null).sort((a,b)=>b.lost-a.lost)[0];
    const bandTone = !hl.band? 'n' : hl.band.cls==='pos'? 'g' : hl.band.cls==='med'? 'a' : 'r';
    const stTone = { good:['g','On target'], watch:['a','Watch'], off:['r','Off target'], na:['n','No data'] };
    const hComp = (kpi)=> C.health.find(h=>h.kpi===kpi);
    const norm = (kpi, v)=> v==null? null : Math.max(0, Math.min(100, (v - hComp(kpi).floor)/(hComp(kpi).target - hComp(kpi).floor)*100));
    const segOn = !!(seg.a || seg.x);
    const rate = (id)=>{ const k = K[id], d = M.KPI[id], st = M.status(id, k.v), hh = hComp(id), lo = hh? hh.floor-5 : 80;
      const P0 = (x)=> Math.max(0, Math.min(100, (x-lo)/(100-lo)*100));
      return html`<section key=${id} class=${cx('px-kc px-rate', P.kc(id), kpi===id && 'on')} onClick=${()=> pick(id)} aria-label=${d.name}>
        <div class="px-rc-h"><button type="button" class="px-kc-t" aria-pressed=${kpi===id} onClick=${(e)=>{ e.stopPropagation(); pick(id); }}><span class="px-kc-i"><${Icon} n=${P.KICON[id]} size=${15} strokeWidth=${1.6}/></span><span>${SHORT[id]}</span></button>${d.time==='Snapshot' && html`<span class="px-basis">Snapshot</span>`}</div>
        <div class="px-rc-v"><span class="v num">${pct(k.v)}</span><${Pill} tone=${stTone[st][0]}>${stTone[st][1]}</${Pill}></div>
        <div class="px-bullet" role="img" aria-label=${d.name+' '+pct(k.v)+' against target '+d.target+'%'}><i style=${{ width:P0(k.v||lo)+'%', background:scoreTone(st==='good'? 100 : st==='watch'? 60 : 0) }}/><b style=${{ left:P0(d.target)+'%' }} title=${'Target '+d.target+'%'}/></div>
        <div class="px-rate-s"><span class="faint">Target ${d.target}%</span><${DChip} id=${id} v=${k.v} prior=${k.prior}/></div>
        <${Spark} data=${k.series} w=${150} ht=${30} target=${d.target}/>
        <${Foot} items=${id==='fcAcc'? [['Bias', (k.bias>0?'+':'')+FCT.n(k.bias,1)+'%', Math.abs(k.bias)>5? 'r' : ''], ['Out by 20%+', FCT.n(k.bad), k.bad? 'r' : ''], [prior || 'Prior', pct(k.prior)]]
          : [['Records', FCT.n(k.n)], ['Exceptions', FCT.n(k.bad), k.bad? 'r' : ''], d.time==='Snapshot'? ['Value', cr(k.badVal||0,1)] : [prior || 'Prior', pct(k.prior)]]}/></section>`; };
    const chip = (axis, g, list)=> html`<button key=${axis+(g||'all')} type="button" role="radio" aria-checked=${seg[axis]===g} class=${cx(seg[axis]===g && 'on')}
      title=${g? g+' · '+list.find(x=>x.id===g).name+': '+list.find(x=>x.id===g).desc : 'All classes'} onClick=${()=> setSeg(Object.assign({}, seg, { [axis]:g }))}>${g? list.find(x=>x.id===g).name.replace(/ (value|demand)$/,'') : 'All'}<small>${M.segCount(f, g? { [axis]:g } : null)}</small></button>`;
    return html`<div class="px-board" aria-label="Supply chain KPI board"><div class="px-board-in">
      <${Sec} c="kpi" icon="Gauge" title="Headline KPIs" sub=${'Control rates for '+p.label+'. Inventory, excess, receipts and exposure as at '+C.snapLabel+' (book date '+C.bookDate+').'}
        right=${html`<${Pill} tone=${bandTone}>Health ${K.health.v==null? 'N/A' : K.health.v} · ${hl.band? hl.band.label : ''}</${Pill}><${Pill} tone="r">${cr(ex.potential)} exposure</${Pill}>`}>
        <div class="px-hero3">
          <section class=${cx('px-kc px-feat2', P.kc('health'), kpi==='health' && 'on')} onClick=${()=> pick('health')} aria-label="SC Health Score">
            <div class="px-rc-h"><button type="button" class="px-kc-t" aria-pressed=${kpi==='health'} onClick=${(e)=>{ e.stopPropagation(); pick('health'); }}><span class="px-kc-i"><${Icon} n=${P.KICON.health} size=${15} strokeWidth=${1.6}/></span><span>SC Health Score</span></button><${P.KpiDef} id="health"/>
              <div class="px-seg" role="radiogroup" aria-label="Value class (ABC)" onClick=${(e)=> e.stopPropagation()}><span class="l" title="ABC: share of inventory value">Value</span>${[null,'A','B','C'].map(g=> chip('a', g, C.abc))}</div>
              <div class="px-seg" role="radiogroup" aria-label="Demand pattern (XYZ)" onClick=${(e)=> e.stopPropagation()}><span class="l" title="XYZ: how steady monthly consumption is">Demand</span>${[null,'X','Y','Z'].map(g=> chip('x', g, C.xyz))}</div>
              <span class="px-basis">${p.label}</span></div>
            <div class="px-feat2-b">
              <div class="px-feat2-l"><div class="px-feat-b"><${Ring} v=${K.health.v} band=${hl.band}/>
                <div class="px-feat-s">${hl.band && html`<${Pill} tone=${bandTone}>${hl.band.label}</${Pill}>`}<${DChip} id="health" v=${K.health.v} prior=${K.health.prior}/>
                  <div class="px-feat-k"><span>Coverage</span><b>${pct(hl.coverage*100,0)}</b></div><div class="px-feat-k"><span>Points lost</span><b>${K.health.v==null? 'N/A' : 100-K.health.v}</b></div></div></div>
                <div class="px-feat-t"><span>Apr–Sep trend</span><${Spark} data=${K.health.series} w=${220} ht=${30}/></div>
                <${AI}>${K.health.v==null? null : 'The score is '+K.health.v+' out of 100'+(K.health.prior!=null? ', '+FCT.n(Math.abs(K.health.v-K.health.prior))+' points '+(K.health.v<K.health.prior? 'lower' : 'higher')+' than '+prior : '')+'. '+(lostTop? (SHORT[lostTop.kpi]||lostTop.name)+' is pulling it down the most.' : '')+(segOn? ' Tiles show '+M.segLabel(seg)+' only; the score stays for all materials.' : '')}</${AI}></div>
              <div class="px-feat2-c">${hl.comps.map(c=>{ const g = M.segComp(c.kpi, f, segOn? seg : null), sl = M.segLabel(seg), vtag = g.vPct==null? 'No materials' : pct(g.vPct,0)+' of '+(sl? sl+' ' : '')+'materials affected', val = segOn? g.rate : c.v, sc = segOn? norm(c.kpi, val) : c.sc;
                return html`<button key=${c.kpi} type="button" class="px-cm2" onClick=${stop(()=> pick('health', { key:c.kpi, dim:'component' }))} title=${c.name+': score '+(c.sc==null? 'N/A' : Math.round(c.sc))+' of 100, weight '+c.w}>
                <span class="hd"><span class="n">${SHORT[c.kpi] || c.name}<${P.KpiDef} id=${c.kpi} inline=${true}/></span><b class="v num">${val==null? 'N/A' : pct(val)}</b></span>
                <span class="trk"><i style=${{ width:(sc||0)+'%', background:scoreTone(sc) }}/></span>
                <span class="px-vt"><span class=${cx('tg', g.vPct>=50? 'hi' : g.vPct>=20? 'md' : 'lo')}><${Icon} n="Package" size=${12}/>${vtag}</span><span class="faint">${g.vBad} of ${g.vN}</span></span>
                <${AI} cls="sm">${compNote(c.kpi, f, K, segOn? seg : null)}</${AI}></button>`; })}</div></div></section>
          <div class="px-hero3-g">
            <${RCard} id="inv" kpi=${kpi} pick=${pick} title="Inventory Value" basis="Snapshot" value=${cr(K.inv.v,1)}
              chip=${html`<${Pill}>${FCT.n(K.inv.n)} lots</${Pill}>`} viz=${html`<${Seg} label="Inventory by age" parts=${byAge}/>`}
              note=${K.inv.v? cr(K.inv.v,0)+' of stock is on the books. '+cr(K.inv.aged,1)+' of it is over 180 days old. DIO is '+FCT.n(K.inv.dio,1)+' days ('+FCT.n(K.inv.turns,1)+' turns a year).' : null}
              top=${html`<${MiniTab} title="Largest plants" cols=${['Plant','Value','Share','Aged']} rows=${mtRows(top4(invF, (x)=> x.g.plant, (k)=> k), (r)=>{ const ls = invF.filter(x=> x.g.plant===r.key);
                return [r.label, cr(r.val,1), pct(r.val/K.inv.v*100,0), cr(M.sum(ls.filter(x=> x.rec.age>=2), x=>x.val),1)]; })}/>`}
              foot=${[['Provision', cr(K.inv.prov,1)], ['DIO', FCT.n(K.inv.dio,1)+' d'], ['Turns', FCT.n(K.inv.turns,1)+'×']]}/>
            <${RCard} id="excess" kpi=${kpi} pick=${pick} title="Excess Stock" basis="Snapshot" value=${cr(K.excess.v,1)}
              chip=${html`<${Pill} tone="a">${FCT.n(K.excess.n)} materials</${Pill}>`} viz=${html`<${Seg} label="Excess by plant" parts=${M.group(xsF, (x)=> x.g.plant).slice(0,4).map((r,i)=> ({ l:r.key.replace(' Plant',''), v:r.val, c:['#E0B25A','#C9973C','#A57A2B','#7F5E22'][i], f:(v)=> cr(v,1) }))}/>`}
              note=${K.excess.v? cr(K.excess.v,1)+' of cash is tied up above policy cover. '+cr(K.excess.strategic,1)+' of it is an approved strategic buy. '+FCT.n(K.excess.below)+' materials are below minimum cover.' : null}
              top=${html`<${MiniTab} title="Most excess" cols=${['Material','Excess','Cover','Max']} rows=${mtRows(xsF.slice().sort((a,b)=>b.val-a.val).slice(0,4).map(x=> ({ key:x.v, label:sname(x.v), val:x.val })), (r)=> [r.label, cr(r.val,1), M.V[r.key].cover+'d', M.V[r.key].maxD+'d'])}/>`}
              foot=${[['Strategic', cr(K.excess.strategic,1)], ['Slow on watch', cr(K.excess.slowWatch,1)], ['Over 365d', cr(K.excess.over365,1)]]}/>
            <${RCard} id="rnb" kpi=${kpi} pick=${pick} title="Receipts Not Booked" basis="Snapshot" value=${cr(K.rnb.v,1)}
              chip=${html`<${Pill} tone="a">${FCT.n(K.rnb.n)} receipts</${Pill}>`} viz=${html`<${Seg} label="Not booked by type" parts=${[{ l:'In transit', v:K.rnb.git, c:'#A08BE0', f:(v)=> cr(v,1) }, { l:'At the gate', v:K.rnb.gate, c:'#6E9BE0', f:(v)=> cr(v,1) }]}/>`}
              note=${K.rnb.v? 'We own '+cr(K.rnb.v,1)+' of goods that are not in the books. '+cr(K.rnb.blocked,1)+' of supplier invoices are blocked only because the goods receipt is missing.' : 'Everything owned at 30-Sep is in the books.'}
              top=${html`<${MiniTab} title="By plant" cols=${['Plant','Value','Receipts','Blocked']} rows=${mtRows(top4(rnbF, (x)=> x.g.plant, (k)=> k), (r)=>{ const ls = rnbF.filter(x=> x.g.plant===r.key);
                return [r.label, cr(r.val,2), FCT.n(ls.length), cr(M.sum(ls.filter(x=> x.rec.inv==='Invoice posted, blocked'), x=>x.val),2)]; })}/>`}
              foot=${[['In transit', cr(K.rnb.git,1)], ['At the gate', cr(K.rnb.gate,1)], ['DAP excluded', cr(K.rnb.excluded,1)]]}/>
            <${RCard} id="exposure" kpi=${kpi} pick=${pick} title="Material Exposure" basis="Snapshot" value=${cr(ex.potential)} tone="crit"
              chip=${html`<${Pill} tone="r">${ex.potN} open cases</${Pill}>`} viz=${html`<div class="px-mini-bars">${exBy.slice(0,3).map(r=> html`<div key=${r.key}><span class="n" title=${r.name}>${r.name}</span><span class="trk"><i style=${{ width:(r.v/(exBy[0]? exBy[0].v : 1)*100)+'%' }}/></span><b class="num">${cr(r.v)}</b></div>`)}</div>`}
              note=${exBy[0]? cr(ex.potential)+' is at risk and needs a decision. The biggest source is '+lc(exBy[0].name)+' ('+pct(exBy[0].v/ex.potential*100,0)+'). '+cr(ex.contingent)+' more is contingent and not added.' : null}
              top=${html`<${MiniTab} title="Materials with most exposure" cols=${['Material','At risk','Share','Cases']} rows=${mtRows(top4(exF, (x)=> x.v, (k)=> sname(k)), (r)=> [r.label, amt(r.val), pct(r.val/ex.potential*100,0), FCT.n(exF.filter(x=>x.v===r.key).length)])}/>`}
              foot=${[['Contingent', cr(ex.contingent)], ['Control value', cr(ex.control,1)], ['Loss', cr(ex.loss)]]}/>
          </div></div></${Sec}>
      <${Sec} c="revenue" icon="Warehouse" title="Inventory KPIs" sub=${'Book inventory at '+C.bookDate+' by category and material-plant.'}
        right=${html`<${Pill} tone="n">${cr(K.inv.v,1)}</${Pill}><${Pill}>DIO ${FCT.n(K.inv.dio,1)} d</${Pill}>`}><div class="px-brow">
        <${KCard} id="inv" kpi=${kpi} pick=${pick} title="Inventory by category" sub=${'Gross at standard cost; provision '+cr(K.inv.prov,1)+' shown beside'}>
          <div class="px-catd"><div class="px-catd-c" style=${{height:132}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.PieChart}>
            <${R.Pie} data=${byCat} dataKey="val" nameKey="name" innerRadius="62%" outerRadius="96%" paddingAngle=${1} stroke=${COL.surface} strokeWidth=${2} isAnimationActive=${!P.useRM()} onClick=${(d,i,e)=>{ e && e.stopPropagation && e.stopPropagation(); pick('inv', { key:d.key||d.name, dim:'cat' }); }} style=${{cursor:'pointer'}}>
              ${byCat.map((r,i)=> h(R.Cell, { key:i, fill:r.c }))}</${R.Pie}><${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=> cr(v)+' · '+pct(v/invT*100) })}/></${R.PieChart}></${R.ResponsiveContainer}>
            <div class="px-donut-c"><b>${cr(invT,0)}</b><span>${byCat.length} categories</span></div></div>
          <ul class="px-catl">${byCat.map(r=> html`<li key=${r.key}><button type="button" onClick=${stop(()=> pick('inv', { key:r.key, dim:'cat' }))} title=${r.name+': '+cr(r.val)+' ('+pct(r.val/invT*100)+')'}><i style=${{background:r.c}}/><span class="nm">${r.name}</span>
            <span class="sh"><em style=${{ width:(r.val/byCat[0].val*100)+'%', background:r.c }}/></span><b class="num">${cr(r.val,0)}</b></button></li>`)}</ul></div></${KCard}>
        <${KCard} id="topm" kpi=${kpi} pick=${pick} title="Top Materials by Value" sub=${'Top 5 hold '+pct(tv.top5)+' · top 10 '+pct(tv.top10)}>
          <div class="px-topv">${tv.rows.slice(0,7).map((r,i)=> html`<button key=${r.v} type="button" class="px-topv-r" onClick=${stop(()=> pick('topm', { key:r.v, dim:'vendor' }))} title=${r.name+' · '+M.plantName(M.V[r.v].plant)+' · '+M.risk(r.v).approved+' risk'}>
            <span class="rk num">${i+1}</span><span class="nm"><i style=${{ background:P.RISK[M.risk(r.v).approved] }}/>${sname(r.v)} <span class="faint">${M.V[r.v].plant}</span></span><span class="trk"><i style=${{ width:(r.spend/tv.rows[0].spend*100)+'%' }}/></span><b class="num">${cr(r.spend,1)}</b><span class="num faint">${pct(r.share)}</span></button>`)}</div></${KCard}>
      </div></${Sec}>
      <${Sec} c="customer" icon="Package" title="Material and Exposure KPIs" sub="Inventory risk, material data quality and the value of open cases."
        right=${html`<${Pill} tone="r">${mix[0].n} critical</${Pill}><${Pill} tone="a">${mix[1].n} high</${Pill}><${Pill}>${vs.length} material-plants</${Pill}>`}><div class="px-brow">
        <${KCard} id="riskmix" kpi=${kpi} pick=${pick} title="Material risk and master data" sub=${vs.length+' active material-plants by approved inventory-risk category'}>
          <${Seg} label="Material Risk Mix" parts=${mix.map(m=> ({ l:m.id, v:m.n, c:P.RISK[m.id] }))}/>
          <div class="px-tiles h">
            <button type="button" class="px-tile" onClick=${stop(()=> pick('riskmix', { key:'High', dim:'risk' }))}><span class="i crit"><${Icon} n="TriangleAlert" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">High-risk materials</span><b>${hi}</b><small>${pct(vs.length? hi/vs.length*100 : null,0)} of active</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> pick('riskmix'))}><span class="i med"><${Icon} n="Eye" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Re-review proposed</span><b>${K.riskmix.rereview}</b><small>model differs</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> pick('health', { key:'mdq', dim:'component' }))}><span class="i ai"><${Icon} n="ListChecks" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Master-data quality</span><b>${pct(K.mdq.v,0)}</b><small>${K.mdq.bad} failing checks</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> location.href = FCT.href('screens/sc/materials.html'))}><span class="i brand"><${Icon} n="Target" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Below minimum cover</span><b>${below}</b><small>stock-out risk</small></span></button></div></${KCard}>
        <${KCard} id="exposure" kpi=${kpi} pick=${pick} title="Material exposure by type" sub="Estimated impact of open cases, by type">
          <div class="px-xbars">${exBy.map(r=> html`<button key=${r.key} type="button" onClick=${stop(()=> pick('exposure', { key:r.key, dim:'type' }))} title=${r.name+': '+cr(r.v)}>
            <span class="n">${r.name}</span><span class="trk"><i style=${{ width:(r.v/(exBy[0]? exBy[0].v : 1)*100)+'%' }}/></span><b class="num">${cr(r.v)}</b></button>`)}</div>
          <${Foot} items=${[['Potential', cr(ex.potential), 'r'], ['Contingent', cr(ex.contingent)], ['Confirmed loss', cr(ex.loss)]]}/></${KCard}>
      </div></${Sec}>
      <${Sec} c="ctl" icon="ShieldCheck" title="Control KPIs" sub="Five control measures against target; the marker on each bar shows the target."
        right=${html`<${Pill} tone=${onT>=4? 'g' : onT>=2? 'a' : 'r'}>${onT} of 5 on target</${Pill}>`}><div class="px-rates">${rates.map(id=> rate(id))}</div></${Sec}>
      <${Sec} c="exc" icon="Crosshair" title="Exceptions" sub="Open cases, largest first. Financial cases show the estimated impact; control cases show the value involved; contingent where not yet estimated."
        right=${html`<${Pill} tone="r">${cs.filter(c=>M.ETYPE[c.type].basis==='fin').length} financial</${Pill}><${Pill}>${cs.filter(c=>M.ETYPE[c.type].basis==='ctl').length} control</${Pill}>`}><section class="px-kc px-exc" aria-label="Open exceptions"><div class="px-kc-h"><span class="px-kc-t static"><span class="px-kc-i"><${Icon} n="Crosshair" size=${15} strokeWidth=${1.6}/></span><span>Open exceptions</span></span>
          <${P.Seg} label="Exception type" value=${tab} onChange=${setTab} options=${[['all','All ('+cs.length+')'],['fin','Financial ('+cs.filter(c=>M.ETYPE[c.type].basis==='fin').length+')'],['ctl','Control ('+cs.filter(c=>M.ETYPE[c.type].basis==='ctl').length+')']]}/></div>
        <div class="px-tbl"><table class="t px-t dense"><caption class="sr">Open exceptions</caption><thead><tr><th>Priority</th><th>Type</th><th>Material</th><th class="r">Amount</th><th class="r">Age</th><th>Status</th><th><span class="sr">Action</span></th></tr></thead>
          <tbody>${rows.map(({c,val})=>{ const pr = prio(c, val), basis = c.est!=null? '' : c.affected!=null? ' · value affected' : c.contingent!=null? ' · contingent' : ' · not quantified'; return html`<tr key=${c.id} tabIndex="0" class="sel" onClick=${()=> openCase(c.id)} onKeyDown=${(e)=>{ if(e.key==='Enter') openCase(c.id); }}>
            <td><span class=${'px-prio p-'+pr.toLowerCase()}>${pr}</span></td><td>${M.ETYPE[c.type].name}<div class="sub">${c.ex}${basis}</div></td><td>${sname(c.v)}<div class="sub">${M.plantName(M.V[c.v].plant)}</div></td>
            <td class="r num">${val? amt(val) : 'N/A'}</td><td class="r num">${Math.max(0, Math.floor(M.SNAP - c.opened))}d</td><td>${M.statusName(c.stNow)}</td>
            <td class="r"><button type="button" class="btn sm" onClick=${stop(()=> openCase(c.id))}>Decide</button></td></tr>`; })}</tbody></table></div></section></${Sec}>
      <div class="px-board-f faint">Flows: ${p.label}. Balances at book date ${C.bookDate}, as at ${C.snapLabel}. Illustrative data.</div>
    </div></div>`;
  };

  /* ---------- helpers on the current navigation ---------- */
  P.ctx = (nav, f)=>{
    const groups = M.nav.groups(nav);
    const comp = nav.kpi==='health'? groups.find(g=>g.dim==='component') : null;
    const eff = comp? comp.key : nav.kpi;
    const gs = groups.filter(g=> g.dim!=='component');
    const material = (()=>{ for(let i=nav.path.length-1;i>=0;i--) if(['material','vendor','profile'].includes(nav.path[i].t)) return nav.path[i].id; return null; })();
    const facts = (eff==='health')? [] : M.facts(eff, f).filter(x=> gs.every(g=> x.g[g.dim]===g.key) && (!material || x.v===material));
    return { eff, groups:gs, comp, material, customer:material, facts };
  };
  const factSort = (id)=> (a,b)=> M.isRate(id)? ((a.ok===false?0:1)-(b.ok===false?0:1)) || (b.val-a.val) : (b.val-a.val);

  /* ---------- record tables, one column set per record kind ---------- */
  const matCol = { k:'v', l:'Material', w:'26%', fmt:(x)=> html`<b class="nb">${sname(x.v)}</b><div class="sub">${M.V[x.v].mat} · ${M.plantName(M.V[x.v].plant)}</div>`, sv:(x)=> sname(x.v) };
  const valCol = (l)=> ({ k:'val', l:l||'Value', w:'12%', r:true, fmt:(x)=> amt(x.val), sv:(x)=> x.val });
  const okCol = (l, good, bad)=> ({ k:'st', l, fmt:(x)=> x.ok===false? html`<span class="px-bad">${bad(x)}</span>` : html`<span class="faint">${good(x)}</span>`, sv:(x)=> x.ok===false? 0 : 1 });
  P.factCols = (id, kind)=>{
    if(kind==='case') return [ { k:'id', l:'Case', w:'14%', fmt:(x)=> html`<b>${x.rec.id}</b><span class="sub">${x.rec.ex}</span>`, sv:(x)=>x.rec.id },
      { k:'type', l:'Type', w:'24%', fmt:(x)=> M.ETYPE[x.rec.type].name, sv:(x)=>x.rec.type }, matCol,
      { k:'val', l:'Estimate', w:'13%', r:true, fmt:(x)=> x.rec.est!=null? amt(x.rec.est) : x.rec.affected!=null? html`<span class="faint">${amt(x.rec.affected)} affected</span>` : x.rec.contingent!=null? html`<span class="faint">${amt(x.rec.contingent)} contingent</span>` : html`<span class="faint">n.q.</span>`, sv:(x)=>x.val },
      { k:'conf', l:'Conf.', w:'8%', r:true, nx:true, fmt:(x)=> pct(x.rec.conf*100,0), sv:(x)=>x.rec.conf }, { k:'st', l:'Status', w:'13%', fmt:(x)=> M.statusName(x.rec.stNow||M.caseStatus(x.rec)), sv:(x)=>x.rec.stNow } ];
    if(kind==='material' || kind==='vendor') return [ { k:'v', l:'Material', fmt:(x)=> html`<b>${x.rec.mat} · ${x.rec.name}</b><div class="sub">${M.plantName(x.rec.plant)} · ${M.CAT[x.rec.cat].name} · ${M.cls(x.v)}</div>`, sv:(x)=>x.rec.name },
      { k:'risk', l:'Risk', fmt:(x)=>{ const r = M.risk(x.v); return html`<${P.RiskTag} cat=${r.approved} score=${r.score} small=${true}/>${r.rereview? html` <span class="px-tag warn" title=${'Model suggests '+r.model}>Re-review</span>` : ''}`; }, sv:(x)=>M.risk(x.v).score },
      { k:'cov', l:'Cover', r:true, fmt:(x)=> html`${x.rec.cover}d <span class="faint">${x.rec.minD}–${x.rec.maxD}</span>`, sv:(x)=> x.rec.cover },
      M.isTheme(id)? okCol('Check', (x)=> x.g.check+': pass', (x)=> x.g.check+': fails') : { k:'val', l: id==='excess'? 'Excess' : id==='mdq'? 'Check' : 'Stock', r:true, fmt:(x)=> id==='topm'? html`${cr(x.val)} <span class="faint">${pct(x.share)}</span>` : id==='mdq'? (x.ok? 'Pass' : html`<span class="px-bad">Fails</span>`) : id==='excess'? cr(x.val) : cr(M.stock(x.v)), sv:(x)=> id==='excess'||id==='topm'? x.val : M.stock(x.v) } ];
    if(kind==='lot') return [ { k:'id', l:'Lot', w:'16%', fmt:(x)=> html`<b>${x.rec.batch}</b><div class="sub">${x.rec.id}</div>`, sv:(x)=> x.rec.id }, matCol,
      { k:'cat', l:'Category', fmt:(x)=> M.CAT[x.rec.cat].name, sv:(x)=> x.rec.cat }, { k:'age', l:'Age', r:true, fmt:(x)=> x.rec.days+'d'+(x.rec.exp!=null? ' · exp '+x.rec.exp+'d' : ''), sv:(x)=> x.rec.days },
      valCol(), M.isTheme(id)? okCol('Check', (x)=> x.g.sub+': pass', (x)=> x.g.sub+': fails') : id==='valc'? okCol('Review', ()=> 'Reviewed', (x)=> 'Not reviewed · '+lc(x.rec.reason)) : { k:'iss', l:'Issues', fmt:(x)=> x.rec.issues.length? html`<span class="px-bad">${x.rec.issues.map(c=> M.issue(c).name).join('; ')}</span>` : html`<span class="faint">None</span>`, sv:(x)=> x.rec.issues.length } ];
    if(kind==='fc') return [ { k:'id', l:'Material-month', w:'18%', fmt:(x)=> html`<b>${C.months[x.rec.m]}</b><div class="sub">${x.rec.id}</div>`, sv:(x)=> x.rec.m }, matCol,
      { k:'fc', l:'Forecast', r:true, fmt:(x)=> cr(x.rec.fc,2), sv:(x)=> x.rec.fc }, { k:'act', l:'Actual', r:true, fmt:(x)=> cr(x.rec.act,2), sv:(x)=> x.rec.act },
      { k:'val', l:'Error', r:true, fmt:(x)=> html`${cr(x.val,2)} <span class="faint">${pct(x.val/x.rec.act*100,0)}</span>`, sv:(x)=> x.val },
      okCol('Direction', ()=> 'Within 20%', (x)=> x.rec.bias>0? 'Over-forecast' : 'Under-forecast') ];
    if(kind==='po') return [ { k:'id', l:'PO line', w:'18%', fmt:(x)=> html`<b>${x.rec.id}</b><div class="sub">${M.supName(x.rec.sup)}</div>`, sv:(x)=> x.rec.id }, matCol,
      { k:'d', l:'Due', fmt:(x)=> M.date(x.rec.due), sv:(x)=> x.rec.due }, valCol(),
      okCol('Delivery', ()=> 'On time, in full', (x)=> (x.rec.short? 'Short' : 'Late')+(x.rec.slip? ' · '+x.rec.slip+'d' : '')) ];
    if(kind==='gr' || kind==='gate' || kind==='git') return [ { k:'id', l:'Receipt', w:'18%', fmt:(x)=> html`<b>${x.rec.id}</b><div class="sub">${kind==='gate'? 'Gate entry' : kind==='git'? x.rec.inco : 'Goods receipt'}</div>`, sv:(x)=> x.rec.id }, matCol,
      { k:'sup', l:'Supplier', fmt:(x)=> M.supName(x.rec.sup), sv:(x)=> M.supName(x.rec.sup) }, { k:'d', l: kind==='git'? 'BL date' : 'Arrived', fmt:(x)=> M.date(kind==='git'? x.rec.bl : x.rec.at), sv:(x)=> x.rec.at||x.rec.bl }, valCol(),
      okCol('Status', (x)=> x.kind==='git'? (x.rec.decide==='Recognise'? 'Booked' : 'Seller holds title') : 'GR within 48 h', (x)=> x.kind==='gate'? 'No GR · '+lc(x.rec.inv) : x.kind==='git'? 'Not booked' : 'GR after '+x.rec.lag+' h') ];
    if(kind==='count') return [ { k:'id', l:'Count', w:'18%', fmt:(x)=> html`<b>${x.rec.id}</b>${x.rec.custodian? html`<div class="sub px-bad">Counted by custodian</div>` : ''}`, sv:(x)=> x.rec.id }, matCol,
      { k:'d', l:'Counted', fmt:(x)=> M.date(x.rec.at), sv:(x)=> x.rec.at }, valCol('Book value'),
      okCol('Variance', (x)=> (x.rec.varPct>0?'+':'')+FCT.n(x.rec.varPct,2)+'%', (x)=> (x.rec.varPct>0?'+':'')+FCT.n(x.rec.varPct,2)+'%') ];
    if(kind==='batch') return [ { k:'id', l:'Batch', w:'18%', fmt:(x)=> html`<b>${x.rec.id}</b>`, sv:(x)=> x.rec.id }, matCol,
      { k:'d', l:'Made', fmt:(x)=> M.date(x.rec.at), sv:(x)=> x.rec.at }, valCol(), okCol('Yield', (x)=> FCT.n(x.rec.yld,1)+'%', (x)=> FCT.n(x.rec.yld,1)+'% vs '+x.rec.std+'%') ];
    if(kind==='ship') return [ { k:'id', l:'Dispatch', w:'18%', fmt:(x)=> html`<b>${x.rec.id}</b><div class="sub">${x.rec.inco}</div>`, sv:(x)=> x.rec.id }, matCol,
      { k:'d', l:'Dispatched', fmt:(x)=> M.date(x.rec.at), sv:(x)=> x.rec.at }, valCol(), okCol('Status', ()=> 'Clean', (x)=> M.issue(x.rec.iss).name) ];
    return [ { k:'id', l:'Record', fmt:(x)=> x.rec.id }, matCol, valCol() ];
  };
  const KNAME = { case:'Cases', material:'Materials', vendor:'Materials', lot:'Stock lots', fc:'Forecast records', po:'PO lines', gr:'Goods receipts', gate:'Gate entries without a GR', git:'Shipments in transit', count:'Cycle counts', batch:'Batches', ship:'Dispatches' };
  P.Records = ({ id, facts, onOpen, sel, onSelect, title, limit })=>{
    const groups = {}; facts.forEach(x=>{ (groups[x.kind]=groups[x.kind]||[]).push(x); });
    return html`<${Fragment}>${Object.keys(groups).map(k=> html`<${P.Card} key=${k} title=${html`${title && Object.keys(groups).length===1? title : KNAME[k] || 'Records'} <span class="px-count">${FCT.n(groups[k].length)}</span>`} className="flush">
      <${P.Table} cols=${P.factCols(id, k)} rows=${groups[k].slice().sort(factSort(id))} rowKey=${(x)=> x.rec.id + (x.g.check||'')} caption=${title||KNAME[k]||'Records'}
        sel=${sel} onSelect=${onSelect} onOpen=${onOpen} limit=${limit||20}/></${P.Card}>`)}</${Fragment}>`;
  };

  P.groupRows = (id, facts, dim)=>{
    const rate = M.isRate(id);
    let rows = M.group(facts, (x)=> x.g[dim], { rate, label:(k)=> M.dimLabel(dim, k) });
    if(rate) rows = rows.filter(r=> r.bad>0 || dim==='component');
    return rows.map(r=> Object.assign(r, rate? { val:r.bad, sub: FCT.n(r.bad)+' of '+FCT.n(r.n)+(id==='fcAcc'? ' · error '+cr(r.badVal,2) : ' · '+amt(r.badVal))+(r.rate!=null? (id==='fcAcc'? ' · accuracy ' : ' · rate ')+pct(r.rate) : '') }
      : { sub: FCT.n(r.n)+' records'+(r.nv>1 && dim!=='vendor'? ' · '+r.nv+' materials' : '') }));
  };
  const DimSwitch = ({ id, dim, onChange, exclude })=> html`<${P.Pick} label="By" value=${dim} onChange=${onChange}
    options=${(M.dims[id]||[]).filter(d=> !(exclude||[]).includes(d)).map(d=> [d, M.dimName[d]])}/>`;
  const SelDetail = ({ id, facts, sel, dim, onDrill, onMaterial })=>{
    if(!sel) return null;
    const fs = facts.filter(x=> x.g[dim]===sel.key), rate = M.isRate(id);
    const vend = M.group(fs, (x)=> x.v, { rate }).slice(0,5), bad = fs.filter(x=>x.ok===false);
    return html`<div class="px-seld" aria-live="polite"><div class="hd"><b>${M.dimLabel(dim, sel.key)}</b><button type="button" class="btn sm primary" onClick=${onDrill}>Drill in<${Icon} n="ChevronRight" size=${14}/></button></div>
      <div class="px-kv">${rate? html`<div><span>Records</span><b>${FCT.n(fs.length)}</b></div><div><span>Exceptions</span><b>${FCT.n(bad.length)} · ${amt(M.sum(bad,x=>x.val))}</b></div><div><span>${id==='fcAcc'? 'Accuracy' : 'Rate'}</span><b>${pct(M.group(fs, ()=> 'k')[0].rate)}</b></div>`
        : html`<div><span>Records</span><b>${FCT.n(fs.length)}</b></div><div><span>Value</span><b>${cr(M.sum(fs,x=>x.val))}</b></div>`}</div>
      ${dim!=='vendor' && html`<div class="ct">Materials behind it</div>${vend.map(v=> html`<button key=${v.key} type="button" class="px-vrow" onClick=${()=>onMaterial(v.key)}><span>${vname(v.key)}</span><span class="num">${rate? FCT.n(v.bad)+' · '+amt(v.badVal) : amt(v.val)}</span></button>`)}`}</div>`;
  };
  const Breakdown = ({ id, facts, nav, dispatch, title, sub, exclude, valFmt })=>{
    const top = M.nav.top(nav), dims = (M.dims[id]||[]).filter(d=> !(exclude||[]).includes(d));
    const dim = top.by && dims.includes(top.by)? top.by : dims[0];
    const rows = P.groupRows(id, facts, dim), rate = M.isRate(id);
    const sel = nav.sel && nav.sel.dim===dim? nav.sel : null;
    const drill = (r)=> dispatch({ t:'drill', node:N.group(dim, r.key) });
    return html`<${P.Card} title=${title || (rate? 'Exceptions by' : 'Breakdown')} sub=${sub}
        right=${dims.length>1 && html`<${DimSwitch} id=${id} dim=${dim} exclude=${exclude} onChange=${(d)=> dispatch({ t:'node', v:{ by:d } })}/>`}>
        <${P.BarList} rows=${rows} label=${'Breakdown by '+M.dimName[dim]} sel=${sel && sel.key} fmt=${valFmt || (rate? (v)=> FCT.n(v) : (v)=>cr(v))} rate=${rate}
          onSelect=${(r)=> dispatch({ t:'sel', v:{ key:r.key, dim } })} onOpen=${drill} emptyText=${rate? 'No exceptions in this view.' : undefined}/>
        <${SelDetail} id=${id} facts=${facts} sel=${sel} dim=${dim} onDrill=${()=> sel && drill(sel)} onMaterial=${(v)=> dispatch({ t:'drill', node:N.material(v) })}/></${P.Card}>`;
  };

  /* ---------- KPI root views ---------- */
  const Head = ({ id, f, children })=>{
    const k = M.kpi(id, f), st = M.status(id, k.v), tv = P.useTween(k.v);
    return html`<div class="px-head"><div class="big"><div class="v num">${P.fmtKpi(id, tv)}${id==='health' && k.v!=null? html`<small>/100</small>` : ''}</div>
      <div class="m"><${P.StatusCue} st=${st}/><${P.Delta} id=${id} v=${k.v} prior=${k.prior}/>${k.prior!=null && html`<span class="faint">vs ${M.period(M.period(f.period).prior).label}</span>`}<${P.KpiDef} id=${id}/></div>
      ${k.v==null && html`<div class="px-na">N/A: no eligible records for these filters. Not shown as zero.</div>`}</div>
      <div class="px-stats">${children}</div></div>`;
  };
  /* the component view's analysis card (assets/js/shared/explore.js) */
  const EX = FCTExplore.make(P, M, {});
  const roots = {};
  const stageTone = (rate)=> rate==null? 'na' : rate>=.15? 'off' : rate>=.05? 'watch' : 'good';
  const caseVal = (c)=> c.est!=null? c.est : c.affected!=null? c.affected : c.contingent||0;
  roots.health = ({ f, nav, dispatch })=>{
    const hl = M.health(f), S = M.chainScope(f), ex = M.exposure(M.cases(f)), top = M.nav.top(nav), stg = top.stage || null;
    const sel = nav.sel && nav.sel.dim==='component'? nav.sel.key : null, comp = sel && hl.comps.find(c=>c.kpi===sel);
    const all = M.cases(f).filter(c=> M.statusMeasure(c.stNow)==='potential').map(c=> Object.assign(c, { cs:M.caseStages(c) }));
    const byStage = {}; C.stages.forEach(s=> byStage[s.id] = all.filter(c=> c.cs.stages[s.id]).length);
    const rows = all.filter(c=> !stg || c.cs.stages[stg]).map(c=> ({ rec:c, kind:'case', v:c.v, val:caseVal(c), g:{} }))
      .sort((a,b)=> (M.ETYPE[b.rec.type].basis==='fin') - (M.ETYPE[a.rec.type].basis==='fin') || b.val - a.val);
    const setStage = (s)=> dispatch({ t:'node', v:{ stage: s===stg? null : s } });
    const cols = [
      { k:'id', l:'Case', w:'14%', fmt:(x)=> html`<b>${x.rec.id}</b><div class="sub">${x.rec.ex} · ${Math.max(0, Math.floor(M.SNAP - x.rec.opened))}d open</div>`, sv:(x)=> x.rec.opened },
      { k:'v', l:'Material and plant', w:'24%', fmt:(x)=> html`<b class="nb">${sname(x.v)}</b><div class="sub">${M.V[x.v].mat} · ${M.plantName(M.V[x.v].plant)}</div>`, sv:(x)=> sname(x.v) },
      { k:'val', l:'Exposure', w:'13%', r:true, fmt:(x)=> html`<b>${x.val? amt(x.val) : 'N/A'}</b><div class="sub">${x.rec.est!=null? 'estimate · '+pct(x.rec.conf*100,0) : x.rec.affected!=null? 'value affected' : x.rec.contingent!=null? 'contingent' : 'not quantified'}</div>`, sv:(x)=> x.val },
      { k:'t', l:'Investigation', w:'36%', fmt:(x)=>{ const codes = stg? (x.rec.cs.stages[stg]||[]) : [];
          return html`<b class="nb">${M.ETYPE[x.rec.type].name}</b><div class="sub">At ${M.stage(x.rec.cs.primary).name}${codes.length? ' · here: '+codes.map(k=> M.issue(k).name).join('; ') : ''}</div>`; }, sv:(x)=> x.rec.type },
      { k:'st', l:'Status', w:'11%', fmt:(x)=> html`<span class=${'px-cst s-'+x.rec.stNow}>${M.statusName(x.rec.stNow)}</span><div class="sub">${M.ETYPE[x.rec.type].basis==='fin'? 'Financial' : 'Control'}</div>`, sv:(x)=> x.rec.stNow } ];
    return html`<${Fragment}>
      <${Head} id="health" f=${f}><${P.Stat} label="Data coverage" value=${pct(hl.coverage*100,0)} sub=${hl.coverage<1? 'Themes without data are excluded, not scored as perfect' : 'All six themes have data'}/>
        <${P.Stat} label="Band" value=${hl.band? hl.band.label : 'N/A'} sub="Healthy 75+, Watch 50–74, At risk below 50"/>
        <${P.Stat} label="Points lost" value=${hl.score==null? 'N/A' : FCT.n(100-hl.score)} sub=${'Largest: '+(hl.comps.filter(c=>c.lost!=null).sort((a,b)=>b.lost-a.lost)[0]||{name:'—'}).name}/></${Head}>
      <div class="px-grid g-2">
        <${P.Card} title="Theme contributions" sub="Each theme’s value is the average pass rate of its checks, scored 0 at the floor and 100 at the target. Select a theme to see its checks, plants, materials and evidence.">
          <div class="px-comps" role="list">${hl.comps.map(c=> html`<div key=${c.kpi} role="listitem" class=${cx('px-comp', sel===c.kpi && 'on')} onDoubleClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}>
            <button type="button" class="b" aria-pressed=${sel===c.kpi} onClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}>
              <span class="n">${c.name}<small>weight ${c.w}</small></span><span class="v num">${c.v==null? 'N/A' : pct(c.v)}</span>
              <span class="trk" title=${'Score '+(c.sc==null? 'N/A' : Math.round(c.sc))}><i style=${{ width:(c.sc||0)+'%' }}/><em style=${{ left:'100%' }}/></span>
              <span class="p num">${c.contrib==null? '—' : '+'+FCT.n(c.contrib,1)}<small>${c.lost==null? '' : ' −'+FCT.n(c.lost,1)}</small></span></button>
            <button type="button" class="px-drill" aria-label=${'Drill in to '+c.name} onClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}><${Icon} n="ChevronRight" size=${14}/></button></div>`)}</div>
          ${comp && html`<div class="px-note">${comp.name}: ${comp.v==null? 'no data' : pct(comp.v)} against floor ${comp.floor}% and target ${comp.target}% gives ${Math.round(comp.sc)} of 100, worth ${FCT.n(comp.contrib,1)} of the score. <button type="button" class="px-link" onClick=${()=> dispatch({ t:'kpiJump', kpi:comp.kpi })}>Open ${comp.name}</button></div>`}</${P.Card}>
        <${P.Card} title="Health trend" sub="Checks based on reporting-date balances (stock, cover, cases, master data) have no earlier history, so previous months are not scored."><${P.Trend} id="health" f=${f}/></${P.Card}></div>
      <${P.Card} title="Where in the supply chain the issues arise" className="px-chk-card"
        right=${html`<div class="px-chk-act">${stg && html`<button type="button" class="btn sm" onClick=${()=> setStage(null)}><${Icon} n="RotateCcw" size=${13}/>View all</button>`}<a class="btn sm" href=${FCT.href('screens/sc/process.html')}><${Icon} n="Layers" size=${13}/>Process chain</a></div>`}>
        <ol class="px-chk" aria-label="Supply chain checkpoints: select one to filter the open cases below">${C.stages.map((s,i)=>{ const x = S[s.id], rate = x.vol? x.n/x.vol : null, tone = stageTone(rate), on = stg===s.id;
          return html`<li key=${s.id}><button type="button" class=${cx('px-chk-b', 't-'+tone, on && 'on', stg && !on && 'dim')} aria-pressed=${on} onClick=${()=> setStage(s.id)}
              title=${s.q+' '+FCT.n(x.n)+' of '+FCT.n(x.vol)+' records have an issue.'}>
            <span class="ic"><${Icon} n=${s.icon} size=${20} strokeWidth=${1.7}/></span>
            <span class="tx"><span class="nm">${s.name}</span><span class="rt num">${rate==null? 'No data' : pct(rate*100,1)+' with issues'}</span></span>
            <span class="ct"><b class="num">${FCT.n(byStage[s.id])}</b><small>open cases</small></span>
            <span class="ft">${FCT.n(x.n)} records · ${amt(x.val)}</span></button>${i<5 && html`<span class="ar" aria-hidden="true"><${Icon} n="ChevronRight" size=${16}/></span>`}</li>`; })}</ol>
        <div class="px-chk-k" aria-hidden="true"><span><i class="t-good"/>Under 5% of records with issues</span><span><i class="t-watch"/>5–15%</span><span><i class="t-off"/>Over 15%</span></div></${P.Card}>
      <${P.Card} className="flush px-cases" title=${html`${stg? 'Open cases touching '+M.stage(stg).name : 'All open cases'} <span class="px-count">${FCT.n(rows.length)}</span>`}
        right=${html`<span class="px-cases-s">${stg? html`<span class="px-pill t-a">Filtered: ${M.stage(stg).name}</span><button type="button" class="px-link sm" onClick=${()=> setStage(null)}>View all ${FCT.n(all.length)}</button>`
          : html`<span class="faint">Potential ${cr(ex.potential)} · contingent ${cr(ex.contingent)} · control ${cr(ex.control)}</span>`}</span>`}>
        <${P.Table} cols=${cols} rows=${rows} rowKey=${(x)=>x.rec.id} caption=${stg? 'Open cases at '+M.stage(stg).name : 'All open cases'} rowClick=${true} dense=${true}
          onOpen=${(x)=> dispatch({ t:'drill', node:N.case(x.rec.id) })} limit=${12}
          emptyText=${stg? 'No open cases touch '+M.stage(stg).name+' under these filters. Use View all to see every case.' : 'No open cases under these filters.'}/></${P.Card}></${Fragment}>`;
  };
  roots.inv = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('inv', f);
    const dio = C.months.map((m,i)=> ({ m:m.slice(0,3), v:k.dioSeries[i] }));
    return html`<${Fragment}><${Head} id="inv" f=${f}><${P.Stat} label="Stock lots" value=${FCT.n(facts.length)} sub=${'Book date '+C.bookDate}/>
      <${P.Stat} label="Provision" value=${cr(k.prov)} sub="Shown separately, not deducted" tone="aside"/><${P.Stat} label="Over 180 days" value=${cr(k.aged)} sub=${'Over 365 days '+cr(k.over365)}/>
      <${P.Stat} label="DIO · turns" value=${FCT.n(k.dio,1)+' d · '+FCT.n(k.turns,1)+'×'} sub="Days of stock held, group level (from finance)"/></${Head}>
      ${k.booked>0 && html`<div class="px-note">${cr(k.booked)} of receipts booked by a decision today are included (goods in transit or goods receipts).</div>`}
      <div class="px-grid g-2"><${P.Card} title="Days inventory outstanding" sub="Month-end, group level; filters do not apply"><${P.ChartBox} height=${150} label="DIO by month" table=${P.mini(['Month','DIO'], dio.map(d=>[d.m, FCT.n(d.v,1)]))}>
        <${R.LineChart} data=${dio} margin=${{top:14,right:14,left:-6,bottom:0}}><${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${40} domain=${['auto','auto']}/>
          <${R.ReferenceLine} y=${40} stroke=${COL.brass} strokeDasharray="4 3" label=${{ value:'Target 40 d', position:'insideTopRight', fontSize:10.5, fill:COL.brass }}/><${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=> FCT.n(v,1)+' days' })}/>
          <${R.Line} type="monotone" dataKey="v" name="Days inventory outstanding" stroke=${COL.kc} strokeWidth=${2}/></${R.LineChart}></${P.ChartBox}></${P.Card}>
        <${P.Card} title="By ageing" sub="Days since the stock was received"><div class="px-split col">${C.ages.map(a=>{ const xs = facts.filter(x=> x.g.age===a.name); return html`<div key=${a.id}><span>${a.name}</span><b class="num">${cr(M.sum(xs,x=>x.val))}</b><small>${xs.length} lots</small></div>`; })}</div></${P.Card}></div>
      <${Breakdown} id="inv" facts=${facts} nav=${nav} dispatch=${dispatch} sub="Book value at standard cost. Goods owned but not yet recorded are shown under Receipts Not Booked."/></${Fragment}>`; };
  roots.excess = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('excess', f);
    return html`<${Fragment}><${Head} id="excess" f=${f}><${P.Stat} label="Materials above maximum" value=${FCT.n(k.n)}/>
      <${P.Stat} label="Approved strategic buy" value=${cr(k.strategic)} sub="Included in the total and labelled"/><${P.Stat} label="Slow-moving on watch" value=${cr(k.slowWatch)} sub="Possible future provision; not added" tone="aside"/>
      <${P.Stat} label="Below minimum cover" value=${FCT.n(k.below)} sub="Risk of running out; shown separately" tone="aside"/></${Head}>
      <${Breakdown} id="excess" facts=${facts} nav=${nav} dispatch=${dispatch} sub="Stock value above the maximum days of cover allowed by policy."/>
      <${P.Records} id="excess" facts=${facts} onOpen=${(x)=> dispatch({ t:'drill', node:N.material(x.v) })} title="Materials above policy"/></${Fragment}>`; };
  roots.rnb = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('rnb', f);
    return html`<${Fragment}><${Head} id="rnb" f=${f}><${P.Stat} label="In transit, title passed" value=${cr(k.git)} sub=${k.gitN+' shipments (FOB, CFR, CIF)'}/>
      <${P.Stat} label="At the gate, no GR" value=${cr(k.gate)} sub=${k.gateN+' receipts'}/><${P.Stat} label="Invoices blocked" value=${cr(k.blocked)} sub="Cleared once the goods receipt is posted" tone="aside"/>
      <${P.Stat} label="DAP / DDP excluded" value=${cr(k.excluded)} sub="Still owned by the supplier" tone="aside"/></${Head}>
      <${Breakdown} id="rnb" facts=${facts} nav=${nav} dispatch=${dispatch} sub="Goods we owned at 30-Sep but have not recorded. Inventory and payables are both understated; no profit impact."/>
      <${P.Records} id="rnb" facts=${facts} onOpen=${(x)=> dispatch({ t:'drill', node:N.doc(x.rec.id) })}/></${Fragment}>`; };
  roots.exposure = ({ f, nav, dispatch, facts })=>{ const e = M.exposure(M.cases(f));
    return html`<${Fragment}><${Head} id="exposure" f=${f}><${P.Stat} label="Contingent" value=${cr(e.contingent)} sub="Revenue at risk and slow-moving stock on watch: reported separately" tone="aside"/>
      <${P.Stat} label="Confirmed loss" value=${cr(e.loss)} sub=${e.lossN+(e.lossN===1?' case':' cases')} tone="aside"/><${P.Stat} label="Control value" value=${cr(e.control)} sub=${e.controlN+' control cases: shown beside, never added'} tone="aside"/></${Head}>
      <${Breakdown} id="exposure" facts=${facts} nav=${nav} dispatch=${dispatch} title="Material exposure by" sub="Estimated impact of open financial cases (confirmed plus estimated), counted once per case."/>
      <${P.Records} id="exposure" facts=${facts} onOpen=${(x)=> dispatch({ t:'drill', node:N.case(x.rec.id) })} title="Open cases"/></${Fragment}>`; };
  roots.riskmix = ({ f, nav, dispatch, facts })=>{
    const top = M.nav.top(nav), mode = top.mode || 'count', tot = facts.length, sp = M.sum(facts, x=>x.spend||0);
    const rows = C.risk.cats.map(c=>{ const fs = facts.filter(x=>x.g.risk===c.id), s = M.sum(fs, x=>x.spend||0); return { key:c.id, n:fs.length, spend:s, val: mode==='revenue'? s : fs.length, share: mode==='revenue'? (sp? s/sp*100 : 0) : (tot? fs.length/tot*100 : 0) }; });
    const sel = nav.sel && nav.sel.dim==='risk'? nav.sel.key : null, rr = facts.filter(x=> M.risk(x.v).rereview);
    return html`<${Fragment}><${Head} id="riskmix" f=${f}><${P.Stat} label="High or Critical" value=${FCT.n(rows[0].n+rows[1].n)} sub=${pct(sp? (rows[0].spend+rows[1].spend)/sp*100 : null)+' of inventory value'}/>
      <${P.Stat} label="Re-review proposed" value=${FCT.n(rr.length)} sub="Model score differs from the approved category; re-review due"/><${P.Stat} label="Not the same as ABC/XYZ" value="Risk" sub="Value class (ABC) and demand variability (XYZ) are not the same as risk"/></${Head}>
      <div class="px-grid g-2"><${P.Card} title="Material Risk Mix" sub=${mode==='revenue'? 'Share of inventory value (denominator: '+cr(sp)+')' : 'Count of active material-plants (denominator: '+tot+')'}
          right=${html`<${P.Seg} label="Measure" value=${mode} onChange=${(m)=> dispatch({ t:'node', v:{ mode:m } })} options=${[['count','Material count'],['revenue','Inventory value']]}/>`}>
          <${P.Donut} rows=${rows} mode=${mode} sel=${sel} onSelect=${(k)=> dispatch({ t:'sel', v:{ key:k, dim:'risk' } })} onOpen=${(k)=> dispatch({ t:'drill', node:N.group('risk', k) })}
            centre=${html`<b>${mode==='revenue'? cr(sp,0) : tot}</b><span>${mode==='revenue'? 'inventory' : 'materials'}</span>`}/>
          <div class="px-legend">${rows.map(r=> html`<button key=${r.key} type="button" class=${cx(sel===r.key && 'on')} onClick=${()=> dispatch({ t:'sel', v:{ key:r.key, dim:'risk' } })} onDoubleClick=${()=> dispatch({ t:'drill', node:N.group('risk', r.key) })}>
            <i style=${{background:P.RISK[r.key]}}/>${r.key}<b class="num">${mode==='revenue'? cr(r.spend) : r.n}</b><span class="faint">${pct(r.share,0)}</span></button>`)}</div></${P.Card}>
        <${P.Card} title=${sel? sel+' materials' : 'Category definitions'} right=${sel && html`<button type="button" class="btn sm primary" onClick=${()=> dispatch({ t:'drill', node:N.group('risk', sel) })}>Drill in<${Icon} n="ChevronRight" size=${14}/></button>`}>
          ${sel? html`<p class="px-p">${C.risk.defs[sel]}</p>${facts.filter(x=>x.g.risk===sel).sort((a,b)=> M.risk(b.v).score-M.risk(a.v).score).slice(0,8).map(x=> html`<button key=${x.v} type="button" class="px-vrow" onClick=${()=> dispatch({ t:'drill', node:N.material(x.v) })}><span>${vname(x.v)}</span><span class="num">${M.risk(x.v).score} · ${cr(x.spend||0)}</span></button>`)}`
            : html`<dl class="px-defs">${C.risk.cats.map(c=> html`<div key=${c.id}><dt><${P.RiskTag} cat=${c.id}/></dt><dd>${C.risk.defs[c.id]}</dd></div>`)}</dl>`}</${P.Card}></div>
      ${rr.length>0 && html`<${P.Records} id="riskmix" facts=${rr} onOpen=${(x)=> dispatch({ t:'drill', node:N.material(x.v) })} title="Re-review proposed"/>`}</${Fragment}>`;
  };
  roots.topm = ({ f, nav, dispatch, facts })=>{ const tv = M.topMaterials(f), sel = nav.sel && nav.sel.dim==='vendor'? nav.sel.key : null;
    const rows = facts.slice(0,10).map(x=>({ key:x.v, label:vname(x.v), val:x.val, sub:pct(x.share)+' of inventory · '+M.plantName(x.rec.plant)+' · '+M.risk(x.v).approved, tone: sel===x.v? COL.brass : P.RISK[M.risk(x.v).approved] }));
    const others = facts.slice(10); if(others.length) rows.push({ key:'__others', label:'Others ('+others.length+' material-plants)', val:M.sum(others,x=>x.val), sub:pct(M.sum(others,x=>x.share))+' of inventory', tone:COL.fade });
    return html`<${Fragment}><${Head} id="topm" f=${f}><${P.Stat} label="Top 5 share" value=${pct(tv.top5)}/><${P.Stat} label="Inventory Value" value=${cr(tv.total)} sub="Number of records measured"/>
      <${P.Stat} label="Largest" value=${facts[0]? sname(facts[0].v) : 'N/A'} sub=${facts[0]? pct(facts[0].share)+' of inventory' : ''}/></${Head}>
      <div class="px-grid"><${P.Card} title="Top Materials by Value" sub="Ranked by book value; bar colour shows the approved risk category">
        <${P.BarList} rows=${rows} label="Top materials by value" sel=${sel} onSelect=${(r)=> r.key!=='__others' && dispatch({ t:'sel', v:{ key:r.key, dim:'vendor' } })} onOpen=${(r)=> r.key!=='__others' && dispatch({ t:'drill', node:N.material(r.key) })}/></${P.Card}>
        ${sel && html`<${P.Card} title="Selection" className="px-selcard"><${MaterialMini} id=${sel} f=${f} onOpen=${()=> dispatch({ t:'drill', node:N.material(sel) })}/></${P.Card}>`}</div></${Fragment}>`; };
  const MaterialMini = ({ id, f, onOpen })=>{ const p = M.material(id, f), rk = p.rk;
    return html`<div class="px-seld"><div class="hd"><b>${p.v.mat} · ${p.v.name}</b><button type="button" class="btn sm primary" onClick=${onOpen}>Drill in<${Icon} n="ChevronRight" size=${14}/></button></div>
      <div class="px-kv"><div><span>Risk</span><b><${P.RiskTag} cat=${rk.approved} score=${rk.score} small=${true}/></b></div><div><span>Stock</span><b>${cr(p.stock)}</b></div><div><span>Cover</span><b>${p.v.cover} d (${p.v.minD}–${p.v.maxD})</b></div><div><span>Class</span><b>${M.clsName(p.abc+p.xyz)}</b></div></div>
      <div style=${{height:90}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${C.months.map((m,i)=>({ m:m.slice(0,3), v:+(p.byM[i]||0).toFixed(2) }))} margin=${{top:6,right:4,left:-22,bottom:0}}>
        <${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${40}/><${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=>cr(v) })}/><${R.Bar} dataKey="v" name="Consumption" fill=${COL.brand2} radius=${[2,2,0,0]}/></${R.BarChart}></${R.ResponsiveContainer}></div></div>`; };
  const rateRoot = (id, statsFn, extra)=> ({ f, nav, dispatch, facts })=>{ const k = M.kpi(id, f);
    return html`<${Fragment}><${Head} id=${id} f=${f}>${statsFn(k, facts, f)}</${Head}>
      <div class="px-grid g-2"><${P.Card} title=${M.KPI[id].name+' by month'} sub=${M.KPI[id].time==='Snapshot'? 'No history before this snapshot; only the current point is shown.' : 'Target line in brass; selected period highlighted. Months with no eligible records are gaps, not zero.'}><${P.Trend} id=${id} f=${f}/></${P.Card}>${extra? extra(k, facts, f, dispatch) : html`<div/>`}</div>
      <${Breakdown} id=${id} facts=${facts} nav=${nav} dispatch=${dispatch}/></${Fragment}>`; };
  const split = (rows, fmtN, fmtV)=> html`<div class="px-split col">${rows.map(r=> html`<div key=${r.key}><span>${r.key}</span><b class="num">${fmtN(r)}</b><small>${fmtV(r)}</small></div>`)}</div>`;
  roots.fcAcc = rateRoot('fcAcc', (k)=> html`<${P.Stat} label="Bias" value=${(k.bias>0?'+':'')+FCT.n(k.bias,1)+'%'} sub=${k.bias>0? 'Over-forecast: excess stock risk' : 'Under-forecast: shortage risk'} tone=${Math.abs(k.bias)>5? 'aside' : ''}/>
    <${P.Stat} label="Material-months" value=${FCT.n(k.n)} sub="Measured against actual demand value"/><${P.Stat} label="Out by more than 20%" value=${FCT.n(k.bad)}/>`,
    (k, facts)=> html`<${P.Card} title="By product family" sub="Accuracy and bias (over- or under-forecast), weighted by value">${split(M.group(facts, (x)=> x.g.fam), (r)=> pct(r.rate), (r)=>{ const fs = facts.filter(x=> x.g.fam===r.key), A = M.sum(fs, x=>x.act), F = M.sum(fs, x=> x.rec.fc); return 'bias '+(F>=A?'+':'')+FCT.n((F-A)/A*100,1)+'% · '+cr(A,1)+' actual'; })}</${P.Card}>`);
  roots.ira = rateRoot('ira', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="Cycle counts in the period"/><${P.Stat} label="Outside tolerance" value=${FCT.n(k.bad)} sub="Book and physical differ by more than 0.5%"/>`,
    (k, facts)=> html`<${P.Card} title="By plant" sub="Counts and differences found">${split(M.group(facts, (x)=> x.g.plant).slice(0,8), (r)=> FCT.n(r.n), (r)=> FCT.n(r.bad)+' outside · '+pct(r.rate))}</${P.Card}>`);
  roots.rcpt = rateRoot('rcpt', (k, facts)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="Gate entries in the period"/><${P.Stat} label="Late or missing GR" value=${FCT.n(k.bad)}/>
    <${P.Stat} label="Still without a GR" value=${FCT.n(facts.filter(x=> x.kind==='gate').length)} sub=${cr(M.sum(facts.filter(x=> x.kind==='gate'), x=>x.val))+' not in the books'} tone="aside"/>`,
    (k, facts)=> html`<${P.Card} title="By plant" sub="Deliveries and goods receipts posted after 48 hours">${split(M.group(facts, (x)=> x.g.plant).slice(0,8), (r)=> FCT.n(r.n), (r)=> FCT.n(r.bad)+' late · '+pct(r.rate))}</${P.Card}>`);
  roots.otif = rateRoot('otif', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="PO lines due in the period"/><${P.Stat} label="Late or short" value=${FCT.n(k.bad)}/>`,
    (k, facts)=> html`<${P.Card} title="Critical suppliers" sub="Suppliers with the lowest on-time, in-full delivery">${split(M.group(facts, (x)=> x.g.sup, { rate:true }).filter(r=>r.bad).slice(0,6), (r)=> pct(r.rate), (r)=> FCT.n(r.bad)+' of '+FCT.n(r.n)+' lines missed')}</${P.Card}>`);
  roots.valc = rateRoot('valc', (k)=> html`<${P.Stat} label="Lots in scope" value=${FCT.n(k.n)} sub="Older than 180 days, near expiry, or export stock needing a selling-value test"/><${P.Stat} label="Not reviewed" value=${FCT.n(k.bad)} sub=${cr(k.badVal)+' of stock'}/>
    <${P.Stat} label="Provision booked" value=${cr(M.prov())} sub="A pending decision does not count as reviewed" tone="aside"/>`,
    (k, facts)=> html`<${P.Card} title="By reason" sub="Why the lot needs a provision review">${split(M.group(facts, (x)=> x.g.reason), (r)=> pct(r.rate), (r)=> FCT.n(r.bad)+' of '+FCT.n(r.n)+' not reviewed · '+cr(r.val,1))}</${P.Card}>`);

  /* control-tower theme: subthemes are the first drill level, each a pass/fail check with its own basis */
  const themeRoot = (id)=> ({ f, nav, dispatch, facts })=>{ const k = M.kpi(id, f), t = M.THEME[id], hc = C.health.find(h=> h.kpi===id) || {};
    return html`<${Fragment}><${Head} id=${id} f=${f}><${P.Stat} label="Checks" value=${FCT.n(k.n)} sub=${t.obj}/><${P.Stat} label="Failed" value=${FCT.n(k.bad)} sub=${'Poor health means: '+lc(t.poor)}/>
        <${P.Stat} label="Subthemes with data" value=${(k.subs||[]).filter(x=> x.rate!=null).length+' of '+t.subs.length} sub=${'Health weight '+hc.w+' · floor '+hc.floor+'% · target '+hc.target+'%'}/></${Head}>
      <${P.Card} title="Subthemes" sub="The theme value is the average of these pass rates. Select a check to see plants, suppliers, materials and the failing records.">
        <div class="px-comps" role="list">${k.subs.map(x=>{ const sb = M.SUBT[x.id], go = ()=> dispatch({ t:'drill', node:N.group('sub', x.name) });
          return html`<div key=${x.id} role="listitem" class="px-comp" onDoubleClick=${go}>
            <button type="button" class="b" onClick=${go} title=${sb.desc+' '+sb.test}>
              <span class="n">${x.name}<small>${sb.basis} · ${sb.test}</small></span><span class="v num">${x.rate==null? 'N/A' : pct(x.rate)}</span>
              <span class="trk"><i style=${{ width:(x.rate||0)+'%', background:scoreTone(x.rate==null? null : (x.rate-hc.floor)/(hc.target-hc.floor)*100) }}/></span>
              <span class="p num">${x.n? FCT.n(x.bad)+' of '+FCT.n(x.n) : 'no data'}<small>${x.bad? ' · '+amt(x.badVal) : ''}</small></span></button>
            <button type="button" class="px-drill" aria-label=${'Drill in to '+x.name} onClick=${go}><${Icon} n="ChevronRight" size=${14}/></button></div>`; })}</div></${P.Card}>
      <div class="px-grid g-2"><${P.Card} title=${M.KPI[id].name+' by month'} sub="Earlier months are shown only where the same checks applied.">${(k.series||[]).filter(v=> v!=null).length>1? html`<${P.Trend} id=${id} f=${f}/>` : html`<p class="faint">No comparable history: this theme includes snapshot subthemes that only exist at the book date, so earlier months are not scored.</p>`}</${P.Card}>
        <${P.Card} title="What it covers"><p class="faint">${t.obj}</p><p class="faint">Poor health indicates: ${lc(t.poor)}</p></${P.Card}></div>
      <${Breakdown} id=${id} facts=${facts} nav=${nav} dispatch=${dispatch}/></${Fragment}>`; };
  (C.themes||[]).forEach(t=> roots[t.id] = themeRoot(t.id));

  /* ---------- deeper views ---------- */
  const GroupView = ({ f, nav, dispatch, cx:ctx })=>{
    const top = M.nav.top(nav), id = ctx.eff, facts = ctx.facts, rate = M.isRate(id);
    if(id==='health') return html`<${P.Empty} text="Select a theme."/>`;
    const bad = facts.filter(x=> x.ok===false), used = ctx.groups.map(g=>g.dim);
    return html`<${Fragment}>
      <div class="px-head"><div class="big"><div class="v num">${rate? pct(facts.length? M.group(facts, ()=> 'k')[0].rate : null) : cr(M.sum(facts,x=>x.val))}</div>
        <div class="m"><span class="faint">${M.KPI[id].name}${top.dim==='component'? ', '+(nav.kpi==='health'? 'a health component' : '') : ' for '+top.label.replace(/^[^:]+: /,'')}</span>${ctx.comp && html`<span class="px-tag">Health theme</span>`}</div>${(()=>{ const sg = ctx.groups.find(g=> g.dim==='sub'), sb = sg && Object.values(M.SUBT).find(x=> x.name===sg.key); return sb? html`<p class="faint">${sb.desc} ${sb.test} <span class="px-tag">${sb.basis}</span></p>` : null; })()}</div>
        <div class="px-stats"><${P.Stat} label="Records" value=${FCT.n(facts.length)}/>${rate && html`<${P.Stat} label="Exceptions" value=${FCT.n(bad.length)} sub=${amt(M.sum(bad,x=>x.val))}/>`}<${P.Stat} label="Materials" value=${FCT.n(new Set(facts.map(x=>x.v)).size)}/></div></div>
      ${facts.length===0? html`<${P.Empty}/>` : html`<${EX.Explore} id=${id} facts=${facts} exclude=${used} onDrill=${(d,k)=> dispatch({ t:'drill', node:N.group(d, k) })}
        renderRecords=${(fx, tags)=> html`${tags}${fx.length? html`<${P.Records} id=${id} facts=${fx} limit=${8} onOpen=${(x)=> dispatch({ t:'drill', node:N.rec(x) })}/>` : html`<${P.Empty} text="No records match these filters."/>`}`}/>`}</${Fragment}>`;
  };
  const MaterialInKpi = ({ f, nav, dispatch, cx:ctx })=>{
    const id = ctx.material, k = ctx.eff, facts = ctx.facts, why = M.why(id, { kpi:k==='health'? null : k, f, groups:ctx.groups }), p = M.material(id, f);
    const rate = M.isRate(k), bad = facts.filter(x=>x.ok===false);
    return html`<${Fragment}>
      <${P.Card} title=${'Why '+p.v.name+' surfaced'} right=${html`<button type="button" class="btn primary sm" onClick=${()=> dispatch({ t:'drill', node:N.profile(id) })}>Open full Material Profile</button>`}>
        <ul class="px-why">${why.map((w,i)=> html`<li key=${i} class=${'w-'+w.t} title=${P.vt(w.text)}>${w.kpi && html`<b>${w.kpi}: </b>`}${P.vt(w.text)}</li>`)}</ul></${P.Card}>
      <div class="px-stats row"><${P.Stat} label=${M.KPI[k]? M.KPI[k].name+' records' : 'Records'} value=${FCT.n(facts.length)}/>${rate && html`<${P.Stat} label="Exceptions" value=${FCT.n(bad.length)} sub=${amt(M.sum(bad,x=>x.val))}/>`}
        <${P.Stat} label="Stock" value=${cr(p.stock)} sub=${p.rank? 'Rank '+p.rank.rank+' · '+pct(p.rank.share)+' of inventory' : ''}/><${P.Stat} label="Open cases" value=${FCT.n(p.cases.filter(c=>M.statusMeasure(c.stNow)==='potential').length)}/></div>
      ${k==='riskmix'? html`<${RiskFactors} p=${p}/>` : facts.length? html`<${P.Records} id=${k} facts=${facts} onOpen=${(x)=> dispatch({ t:'drill', node:N.rec(x) })} title=${'Records for '+p.v.name}/>` : html`<${P.Empty} text="This material has no records for this KPI under the current filters."/>`}</${Fragment}>`;
  };
  const RiskFactors = ({ p })=> html`<${P.Card} title="Inventory risk factors" sub=${'Score = 60% worst factor + 40% weighted average of assessed factors'+(p.rk.coverage<1? ' (coverage '+pct(p.rk.coverage*100,0)+')' : '')}>
    <div class="px-factors">${p.rk.factors.map(x=> html`<div key=${x.id} class="px-factor"><span class="n">${x.name}<small>weight ${x.w}</small></span>
      <span class="trk"><i style=${{ width:(x.v||0)+'%', background: x.v>=80? COL.crit : x.v>=60? COL.high : x.v>=40? '#B08A1E' : COL.light }}/></span><span class="v num">${x.v==null? 'N/A' : x.v}</span>
      <span class="w">${x.why}<small> · ${x.src}</small></span></div>`)}</div>
    <div class="px-note">Approved category <${P.RiskTag} cat=${p.rk.approved} small=${true}/> · model score ${p.rk.score} (${p.rk.model})${p.rk.rereview? ': re-review proposed' : ''}. Class (${M.clsName(p.abc+p.xyz)}) describes value and demand pattern, not risk.</div></${P.Card}>`;

  /* ---------- Material Profile (deep destination) ---------- */
  P.VendorProfile = P.MaterialProfile = ({ id, f, ctx, onDoc, onCase })=>{
    const p = M.material(id, f), v = p.v, rk = p.rk, why = M.why(id, ctx);
    const [tab,setTab] = useState('lots');
    const asF = (rows, kind)=> rows.map(r=> ({ rec:r, kind:r.kind||kind, v:r.v, val:r.val, ok:r.ok, g:{} }));
    const tables = { lots:['lot', p.lots], rcv:['rcv', p.receipts.concat(p.po)], prd:['prd', p.counts.concat(p.batches)], fc:['fc', p.fc], ship:['ship', p.ships] };
    const recs = tabs=> tabs;
    return html`<div class="px-prof">
      <div class="px-id"><div><h2>${v.mat} · ${v.name}</h2><div class="faint">${M.plantName(v.plant)} · ${v.e} ${(M.BU[v.e]||{}).name||''} · ${M.CAT[v.cat].name} · supplier ${M.supName(v.sup)} · ${v.status}</div>
          <div class="tags"><${P.RiskTag} cat=${rk.approved} score=${rk.score}/>${rk.rereview && html`<span class="px-tag warn">Model suggests ${rk.model}: re-review</span>`}<span class="px-tag" title=${"ABC/XYZ class "+p.abc+p.xyz}>${M.clsName(p.abc+p.xyz)}</span>${v.sole && html`<span class="px-tag warn">Sole source</span>`}<span class="px-tag">Policy ${v.minD}–${v.maxD} days</span></div></div>
        <div class="px-idk"><${P.Stat} label="Stock" value=${cr(p.stock)} sub=${p.rank? 'Rank '+p.rank.rank+' · '+pct(p.rank.share)+' of inventory' : p.lots.length+' lots'}/><${P.Stat} label="Cover" value=${v.cover+' days'} sub=${v.cover>v.maxD? 'Above maximum' : v.cover<v.minD? 'Below minimum' : 'Inside policy'}/><${P.Stat} label="Excess" value=${cr(v.excess)} sub=${v.excess? 'Above '+v.maxD+' days' : 'None'}/></div></div>
      <div class="px-grid g-2">
        <${P.Card} title="Why this material surfaced"><ul class="px-why">${why.map((w,i)=> html`<li key=${i} class=${'w-'+w.t} title=${P.vt(w.text)}>${w.kpi && html`<b>${w.kpi}: </b>`}${P.vt(w.text)}</li>`)}</ul>
          ${(v.ex||[]).length>0 && html`<div class="px-exs">${v.ex.map(e=>{ const x = FCT.ex(e); return x? html`<div key=${e} class="px-ex"><span><b>${e}</b> ${P.vt(x.title)}</span><${P.Decide} id=${e}/></div>` : null; })}</div>`}</${P.Card}>
        <${RiskFactors} p=${p}/></div>
      <${P.Card} title="Where in the supply chain this material has issues" sub="Six months of forecasts, orders, receipts, counts, batches and dispatches, plus stock and policy levels at the reporting date.">
        <ol class="px-flow compact">${p.stages.map((s,i)=> html`<li key=${s.id}><div class="px-stage static"><span class="sh"><b>${s.name}</b></span><span class="sv num">${FCT.n(s.n)}<small> records</small></span>
          <span class="sx">${amt(s.val)}</span><span class="st">${s.issues.slice(0,2).map(x=> M.issue(x.code).name+' ('+x.n+')').join('; ') || 'No issues'}</span></div>${i<5 && html`<span class="ar" aria-hidden="true">→</span>`}</li>`)}</ol>
        ${p.issues.length>0 && html`<table class="px-mini rec"><thead><tr><th>Issue</th><th>Stage</th>${C.months.map(m=> html`<th key=${m} class="r">${m.slice(0,3)}</th>`)}<th class="r">Records</th><th class="r">Value</th></tr></thead><tbody>
          ${p.issues.slice(0,10).map(r=> html`<tr key=${r.code}><td>${M.issue(r.code).name}</td><td class="faint">${M.stage(M.issue(r.code).stage).name}</td>${r.months.map((n,i)=> html`<td key=${i} class="r num" style=${{ background: n? P.heatColor(n, Math.max(...r.months)) : null, color: n && n/Math.max(...r.months)>.5? '#fff' : null }}>${n||''}</td>`)}<td class="r num">${r.n}</td><td class="r num">${amt(r.val)}</td></tr>`)}</tbody></table>`}</${P.Card}>
      <div class="px-grid g-3">
        <${P.Card} title="Consumption by month"><div style=${{height:150}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${C.months.map((m,i)=>({ m:m.slice(0,3), v:+(p.byM[i]||0).toFixed(2) }))} margin=${{top:8,right:4,left:-18,bottom:0}}>
          <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${42}/><${R.Tooltip} cursor=${{fill:'rgba(15,59,58,.05)'}} content=${h(P.Tip,{ fmt:(v)=>cr(v) })}/>
          <${R.Bar} dataKey="v" name="Consumption" fill=${COL.brand2} radius=${[3,3,0,0]} maxBarSize=${26}/></${R.BarChart}></${R.ResponsiveContainer}></div>
          <p class="px-p faint">Variability (CoV) ${FCT.n(p.cov,2)}: ${M.clsPart(p.xyz).toLowerCase()} (${p.xyz}). ${M.clsPart(p.abc)} (${p.abc}) by share of inventory value.</p></${P.Card}>
        <${P.Card} title="Supply and demand"><div class="px-kv">
          <div><span>Supplier</span><b>${M.supName(v.sup)}${v.sole? html`<small> · sole source</small>` : ''}</b></div>
          <div><span>Supplier OTIF (six months)</span><b>${pct(p.otif)}${p.po.length? html`<small> of ${p.po.length} lines</small>` : ''}</b></div>
          <div><span>Forecast accuracy</span><b>${pct(p.acc)}${p.bias!=null? html`<small> · bias ${(p.bias>0?'+':'')+FCT.n(p.bias,1)}%</small>` : ''}</b></div>
          <div><span>Record accuracy</span><b>${pct(p.ira)}${p.counts.length? html`<small> of ${p.counts.length} counts</small>` : ''}</b></div>
          ${p.sup && p.sup.distress && html`<div><span>Supplier signal</span><b class="px-bad">${p.sup.distress}</b></div>`}</div></${P.Card}>
        <${P.Card} title="Stock by age"><div class="px-kv">${C.ages.map((a,i)=> html`<div key=${a.id}><span>${a.name}</span><b>${amt(p.byAge[i])}</b></div>`)}
          <div><span>Lots in provision scope</span><b>${p.lots.filter(l=> l.inScope).length} · ${p.lots.filter(l=> l.inScope && !l.reviewed).length} not reviewed</b></div></div></${P.Card}></div>
      <${P.Card} title="Planning and master data"><ul class="px-checks">${C.mdChecks.map(([k,n])=> html`<li key=${k} class=${(v.md||{})[k]===false? 'fail' : 'pass'}><${Icon} n=${(v.md||{})[k]===false? 'TriangleAlert' : 'Check'} size=${13}/>${n}</li>`)}
        <li class=${v.cover<v.minD || v.cover>v.maxD? 'fail' : 'pass'}><${Icon} n=${v.cover<v.minD || v.cover>v.maxD? 'TriangleAlert' : 'Check'} size=${13}/>Cover ${v.cover} days against policy ${v.minD}–${v.maxD}</li></ul></${P.Card}>
      <${P.Card} title="Records and evidence" className="flush" right=${html`<${P.Seg} label="Show" value=${tab} onChange=${setTab} options=${[['lots','Lots'],['rcv','Receipts and POs'],['prd','Counts and batches'],['fc','Forecast'],['ship','Dispatches'],['cases','Cases']]}/>`}>
        ${tab==='cases'? html`<${P.Table} cols=${P.factCols('exposure','case')} rows=${p.cases.map(c=>({ rec:c, kind:'case', v:c.v, val:c.est||0, g:{} }))} rowKey=${(x)=>x.rec.id} caption="Cases" onOpen=${(x)=> onCase(x.rec.id)} limit=${12} emptyText="No cases for this material."/>`
          : (()=>{ const rows = asF(tables[tab][1]); if(!rows.length) return html`<${P.Empty} text="No records of this kind for this material."/>`;
              const kinds = [...new Set(rows.map(r=> r.kind))];
              return kinds.map(kk=> html`<${P.Table} key=${kk} cols=${P.factCols(kk==='lot'? 'inv' : kk, kk)} rows=${rows.filter(r=> r.kind===kk)} rowKey=${(x)=>x.rec.id} caption=${KNAME[kk]} onOpen=${(x)=> onDoc(x.rec.id)} limit=${10}/>`); })()}</${P.Card}></div>`;
  };

  /* ---------- document (one record in the chain) ---------- */
  P.DocView = ({ id, onMaterial, onCase })=>{
    const ch = M.chain(id), l = M.rec(id); if(!l) return html`<${P.Empty} text="This record is not in the demo ledger."/>`;
    const cases = M.X.cases.filter(c=> c.lines.includes(id));
    const kv = { lot:[['Value', amt(l.val)], ['Category', (M.CAT[l.cat]||{}).name], ['Age', l.days+' days'], ['Expiry', l.exp!=null? l.exp+' days' : '—'], ['Provision review', l.inScope? (l.reviewed? 'Reviewed' : 'Not reviewed ('+lc(l.reason)+')') : 'Out of scope']],
      po:[['Value', amt(l.val)], ['Supplier', M.supName(l.sup)], ['Due', M.date(l.due)], ['Delivered', M.date(l.del)], ['Price', l.price? '₹'+FCT.n(l.ip)+' invoiced vs ₹'+FCT.n(l.cp)+' contract' : 'At contract']],
      gr:[['Value', amt(l.val)], ['Supplier', M.supName(l.sup)], ['Arrived', M.dt(l.at)], ['GR lag', l.lag+' hours']],
      gate:[['Value', amt(l.val)], ['Supplier', M.supName(l.sup)], ['Arrived', M.dt(l.at)], ['Load', l.what||'—'], ['Invoice', l.inv], ['Booked', M.booked(l)? 'Yes, by decision' : 'No']],
      git:[['Value', amt(l.val)], ['Supplier', M.supName(l.sup)], ['Incoterm', l.inco], ['Bill of lading', M.date(l.bl)], ['ETA', M.date(l.eta)], ['Treatment', l.decide==='Recognise'? (M.booked(l)? 'Booked as goods in transit' : 'Recognise: title passed') : 'Exclude: seller holds title']],
      count:[['Book value', amt(l.val)], ['Variance', (l.varPct>0?'+':'')+FCT.n(l.varPct,2)+'%'], ['Counted', M.dt(l.at)], ['Counter', l.custodian? 'Custodian (not independent)' : 'Independent']],
      batch:[['Batch value', amt(l.val)], ['Yield', FCT.n(l.yld,1)+'%'], ['Standard', l.std+'%'], ['Made', M.date(l.at)]],
      ship:[['Value', amt(l.val)], ['Incoterm', l.inco], ['Dispatched', M.dt(l.at)], ['Delivered', l.dlv!=null? M.date(l.dlv) : '—']],
      fc:[['Forecast', cr(l.fc,2)], ['Actual', cr(l.act,2)], ['Error', cr(l.val,2)+' ('+pct(l.val/l.act*100,0)+')'], ['Month', C.months[l.m]]] }[l.kind] || [];
    return html`<div class="px-grid g-doc">
      <${P.Card} title=${(KLAB[l.kind]||'')+(l.kind==='lot'? l.batch : l.id)} sub=${vname(l.v)+' · '+M.plantName(l.plant)}
        right=${html`<button type="button" class="btn sm" onClick=${()=> onMaterial(l.v)}>Material</button>`}><${P.Chain} ch=${ch}/></${P.Card}>
      <div class="px-col">
        <${P.Card} title="Values"><div class="px-kv">${kv.map(([a,b])=> html`<div key=${a}><span>${a}</span><b>${b}</b></div>`)}</div></${P.Card}>
        <${P.Card} title="Issues on this record">${ch && ch.iss.length? html`<ul class="px-ul">${ch.iss.map(c=> html`<li key=${c}><b>${M.stage(M.issue(c).stage).name}:</b> ${M.issue(c).name}</li>`)}</ul>` : html`<p class="px-p faint">No issues raised.</p>`}
          ${cases.map(c=> html`<button key=${c.id} type="button" class="px-vrow" onClick=${()=> onCase(c.id)}><span>Case ${c.id}: ${M.ETYPE[c.type].name}</span><span class="num">${c.est!=null? amt(c.est) : c.affected!=null? 'value affected '+amt(c.affected) : 'not quantified'}</span></button>`)}</${P.Card}>
        <${P.Card} title="Evidence" sub="Supporting documents; requests are simulated and logged."><ul class="px-ev">${M.evidence(l).map(([t,ref,sys],i)=> html`<li key=${i}><${Icon} n="FileText" size=${14}/><span><b>${t}</b> ${ref}<small> · ${sys}</small></span><button type="button" class="px-link sm" onClick=${()=> FCT.ui.toast(t+' '+ref+' requested from '+sys+' (simulated)')}>View</button></li>`)}</ul></${P.Card}></div></div>`;
  };

  /* ---------- investigation case: one estimate per case; contingent, disputed, loss and value affected kept apart ---------- */
  const TICON = { forecast:'TrendingUp', override:'TrendingUp', excess:'Boxes', mrp:'Target', ss:'Target', expiry:'CalendarClock', slow:'Clock', shortage:'TriangleAlert', supplier:'Handshake', price:'Scale',
    advance:'Landmark', nopo:'FileWarning', coa:'FileWarning', git:'Ship', gr:'Package', rtv:'Truck', grqty:'Scale', asn:'Truck', batch:'ListChecks', count:'ClipboardCheck', adjust:'ShieldCheck', cntcov:'ClipboardCheck',
    jobwork:'Factory', yield:'Factory', cost:'IndianRupee', stmt:'Landmark', negstk:'Warehouse', tpl:'Warehouse', consign:'Warehouse', cutoff:'CalendarClock', nrv:'IndianRupee', urp:'IndianRupee', fx:'IndianRupee' };
  const strip = (s)=> String(s||'').replace(/<[^>]+>/g, '');
  const ByMonth = ({ rows, label })=>{ const rm = P.useRM(), d0 = C.months.map((m,i)=> ({ m:m.slice(0,3), v:M.sum(rows.filter(r=>r.m===i), r=>r.v) }));
    if(!d0.some(x=>x.v)) return null;
    const lakh = Math.max(...d0.map(x=>x.v)) < 1, d = d0.map(x=> ({ m:x.m, v:+(lakh? x.v*100 : x.v).toFixed(2) })), lab = label+(lakh? ', ₹ L' : ', ₹ Cr'), fmt = (v)=> '₹'+FCT.n(v, v<10? 2 : 1)+(lakh? ' L' : ' Cr');
    return html`<div class="px-case-ch"><div class="h">${lab}</div><div style=${{height:120}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${d} margin=${{top:6,right:4,left:-14,bottom:0}}>
      <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${46} tickFormatter=${(v)=> FCT.n(v, v && v<10? 1 : 0)}/>
      <${R.Tooltip} cursor=${{fill:'rgba(127,127,127,.08)'}} content=${h(P.Tip,{ fmt })}/><${R.Bar} dataKey="v" name=${lab} fill=${COL.kc} radius=${[3,3,0,0]} maxBarSize=${30} isAnimationActive=${!rm}/></${R.BarChart}></${R.ResponsiveContainer}></div></div>`; };
  /* the decision, first: is one needed, what is recommended, who owns it, by when, what is at stake (same panel on every tower) */
  const userName = (id)=> ((window.FCT_DATA.users||[]).find(u=> u.id===id)||{}).name || id || '—';
  const DecPanel = ({ need, decided, owner, due, rec, stake, conf, raised, exId, actions, status })=> html`<section class=${'px-dec'+(need? ' need' : '')} aria-label="Decision">
    <div class="px-dec-h"><span class="px-dec-st">${need? (decided? 'Decided' : 'Decision needed') : 'No decision needed'}</span>
      <span class="faint">${need? 'Owner '+owner+(due? ' · '+due : '') : 'Status: '+status}</span></div>
    <div class="px-dec-b"><div class="px-dec-r"><span class="l">Recommended</span><p>${rec}</p>
        <dl><div><dt>At stake</dt><dd>${stake}</dd></div>${conf && html`<div><dt>Confidence</dt><dd>${conf}</dd></div>`}${raised && html`<div><dt>Raised at</dt><dd>${raised}</dd></div>`}</dl></div>
      ${need && html`<div class="px-dec-a">${exId? html`<${P.Decide} id=${exId}/><small class="faint">Decided through the shared decision ${exId}, so the gate and audit trail stay in one place.</small>`
        : html`${actions.map((a,i)=> html`<button key=${i} type="button" class=${'btn'+(a.primary? ' primary' : ' sm')} disabled=${a.disabled} onClick=${a.onClick}>${a.label}</button>`)}<small class="faint">Every action is logged with this case.</small>`}</div>`}</div></section>`;
  const dueOf = (age)=> age>14? 'Overdue: open '+age+' days, target 14' : 'Within '+(14-age)+' days (14-day target)';
  P.CaseView = ({ id, onDoc, onMaterial, onCase })=>{
    const c0 = M.case(id); if(!c0) return html`<${P.Empty} text="Case not found."/>`;
    const st = M.caseStatus(c0), t = M.ETYPE[c0.type], meas = M.statusMeasure(st), x = FCT.ex(c0.ex) || {};
    const v = M.V[c0.v], pv = M.material(c0.v), rk = pv.rk;
    const recs = c0.lines.map(r=> M.rec(r)).filter(Boolean), age = Math.max(0, Math.floor(M.SNAP - c0.opened));
    const others = M.X.cases.filter(o=> o.v===c0.v && o.id!==id).map(o=> Object.assign({}, o, { stNow:M.caseStatus(o) }));
    const sameType = M.X.cases.filter(o=> o.type===c0.type && o.id!==id && M.statusMeasure(M.caseStatus(o))==='potential');
    const ev = []; const seen = {}; recs.slice(0,12).forEach(l=> M.evidence(l).forEach(e=>{ const k = e[0]+e[1]; if(!seen[k]){ seen[k] = 1; ev.push(e); } }));
    ((x.evidence||{}).bullets||[]).forEach(b=> ev.push(['Note', strip(b), 'Exception evidence']));
    const cs = M.caseStages(c0), kinds = [...new Set(recs.map(r=> r.kind))];
    const fs = [['Exposure', t.basis==='fin'? (c0.est==null? 'Not estimated' : amt(c0.est)) : c0.affected==null? 'Not quantified' : amt(c0.affected), t.basis==='fin'? 'Estimate, not a loss' : 'Value affected, not a loss'],
      ['Contingent', c0.contingent!=null? amt(c0.contingent) : '—', 'Shown beside, never added'],
      ['Confidence', pct(c0.conf*100,0), M.statusName(st)], ['Open for', age+' days', 'Opened '+M.date(c0.opened)], ['Records', FCT.n(recs.length), kinds.map(k=> KNAME[k]).join(', ') || 'Material record'],
      ['Counts in', meas==='potential'? (t.basis==='fin'? (c0.est!=null? 'Material Exposure' : 'Contingent only') : 'Control value') : meas==='disputed'? 'Disputed amount' : meas==='loss'? 'Confirmed loss' : 'Closed', 'Raised at '+M.stage(cs.primary).name]];
    const breakdown = (c0.parts||[]).map(pp=> [pp[0], amt(pp[1]), { c:'Confirmed', e:'Estimated', p:'Contingent' }[pp[2]]]);
    return html`<div class="px-case">
      <section class=${'px-case-h '+P.kc('exposure')}><span class="ic"><${Icon} n=${TICON[c0.type]||'Crosshair'} size=${22} strokeWidth=${1.6}/></span>
        <div class="tt"><div class="k">Case ${id} · ${c0.ex}</div><h2>${t.name}</h2><div class="m"><span class=${'px-cst s-'+st}>${M.statusName(st)}</span><span class="px-pill">${M.stage(cs.primary).name}</span><span class="px-pill">${t.basis==='fin'? 'Financial' : 'Control'}</span><button type="button" class="px-link sm" onClick=${()=> onMaterial(c0.v)}>${vname(c0.v)}</button></div></div>
        <dl class="px-case-f">${fs.map(([l,val,s])=> html`<div key=${l}><dt>${l}</dt><dd>${val}</dd><small>${s}</small></div>`)}</dl></section>
      <${DecPanel} need=${meas==='potential'} decided=${!!c0.ex && !!FCT.ex(c0.ex) && !FCT.isOpen(FCT.ex(c0.ex))} owner=${userName(x.owner)} due=${x.due? 'due '+x.due : dueOf(age)}
        rec=${x.ai? strip(x.ai.text) : 'Investigate and record the outcome.'} stake=${t.basis==='fin'? (c0.est==null? 'Not estimated yet' : amt(c0.est)+' potential exposure') : (c0.affected==null? 'Not quantified' : amt(c0.affected)+' affected')}
        conf=${pct(c0.conf*100,0)} raised=${M.stage(cs.primary).name} exId=${c0.ex && FCT.ex(c0.ex)? c0.ex : null} status=${M.statusName(st)} actions=${[]}/>
      <${AI}>${(x.title? x.title+'. ' : '')+strip(x.what)}</${AI}>
      <div class="px-calc"><b>Method.</b> ${t.method}.${breakdown.length? html` <b>Parts.</b> ${breakdown.map(b=> b[0]+' '+b[1]+' ('+b[2].toLowerCase()+')').join('; ')}.` : ' Not quantified: shown as N/A, never ₹0.'}
        ${Object.keys(cs.stages).length>1 && html` <b>Stages touched.</b> ${Object.keys(cs.stages).map(k=> M.stage(k).name).join(', ')}.`}</div>
      <div class="px-case-g"><div class="px-col">
        <${P.Card} title="What happened" className="px-case-w">
          ${x.evidence && x.evidence.table && html`<table class="px-mini"><thead><tr>${x.evidence.table.cols.map((cc,i)=> html`<th key=${i} class=${(x.evidence.table.right||[]).includes(i)? 'r' : ''}>${cc}</th>`)}</tr></thead>
            <tbody>${x.evidence.table.rows.map((r,i)=> html`<tr key=${i}>${r.map((cc,j)=> html`<td key=${j} class=${(x.evidence.table.right||[]).includes(j)? 'r num' : ''}>${cc}</td>`)}</tr>`)}${x.evidence.table.foot && html`<tr>${x.evidence.table.foot.map((cc,j)=> html`<td key=${j} class=${(x.evidence.table.right||[]).includes(j)? 'r num' : ''}><b>${cc}</b></td>`)}</tr>`}</tbody></table>`}
          <${ByMonth} rows=${recs.filter(r=> r.m!=null).map(r=> ({ m:r.m, v:r.val||0 }))} label="Case records by month"/>
          ${kinds.map(k=> html`<${P.Table} key=${k} cols=${P.factCols(k==='lot'? 'inv' : k, k)} rows=${recs.filter(r=> r.kind===k).map(r=> ({ rec:r, kind:k, v:r.v, val:r.val, ok:r.ok, g:{} }))} rowKey=${(r)=> r.rec.id} caption=${KNAME[k]} rowClick=${true} dense=${true} onOpen=${(r)=> onDoc(r.rec.id)} limit=${8}/>`)}
          ${!recs.length && !(x.evidence && x.evidence.table) && html`<p class="px-p faint">No transaction records are linked; this case concerns the material and its settings.</p>`}</${P.Card}>
        <${P.Card} title=${recs[0]? 'Process chain: '+recs[0].id : 'Process chain'}>${recs[0]? html`<${P.Chain} ch=${M.chain(recs[0].id)}/>` : html`<p class="px-p faint">No transaction record is linked.</p>`}</${P.Card}></div>
        <div class="px-col"><${P.Card} title="Material" className="px-case-v" right=${html`<button type="button" class="btn sm" onClick=${()=> onMaterial(c0.v)}>Material Profile</button>`}>
          <div class="px-case-vh"><b>${v.mat} · ${v.name}</b><span class="faint">${M.plantName(v.plant)} · ${M.CAT[v.cat].name} · ${M.supName(v.sup)}</span>
            <div class="m"><${P.RiskTag} cat=${rk.approved} score=${rk.score} small=${true}/>${rk.rereview && html`<span class="px-tag warn">Model ${rk.model}</span>`}${v.sole && html`<span class="px-tag warn">Sole source</span>`}<span class="px-tag" title=${"ABC/XYZ class "+pv.abc+pv.xyz}>${M.clsName(pv.abc+pv.xyz)}</span></div></div>
          <div class="px-case-rf">${rk.factors.filter(f=> f.v!=null).sort((a,b)=> b.v-a.v).slice(0,3).map(f=> html`<div key=${f.id} title=${f.why}><span>${f.name}</span><span class="trk"><i style=${{ width:f.v+'%', background: f.v>=80? COL.crit : f.v>=60? COL.high : f.v>=40? 'var(--px-medium)' : COL.light }}/></span><b class="num">${f.v}</b></div>`)}</div>
          <div class="px-kv"><div><span>Stock</span><b>${cr(pv.stock)}</b></div><div><span>Cover</span><b>${v.cover} d (${v.minD}–${v.maxD})</b></div><div><span>Excess</span><b>${amt(v.excess)}</b></div>
            <div><span>Other cases</span><b>${others.length} (${others.filter(o=> M.statusMeasure(o.stNow)==='potential').length} open)</b></div></div></${P.Card}>
          <${P.Card} title="Related exceptions">
            ${others.length? others.slice(0,5).map(o=> html`<button key=${o.id} type="button" class="px-vrow" onClick=${()=> onCase && onCase(o.id)}><span>${o.id} · ${M.ETYPE[o.type].name}</span><span class="num">${o.est!=null? amt(o.est) : o.affected!=null? amt(o.affected) : 'n.q.'} · ${M.statusName(o.stNow)}</span></button>`)
              : html`<p class="px-p faint">No other cases for this material.</p>`}
            <p class="px-p faint">${FCT.n(sameType.length)} other open ${t.name.toLowerCase()} cases across all materials.</p></${P.Card}>
          <${P.Card} title="Evidence"><ul class="px-ev">${ev.slice(0,8).map(([tt,ref,sys],i)=> html`<li key=${i}><${Icon} n="FileText" size=${14}/><span><b>${tt}</b> ${ref}<small> · ${sys}</small></span><button type="button" class="px-link sm" onClick=${()=> FCT.ui.toast(tt+' requested from '+sys+' (simulated)')}>View</button></li>`)}
            ${!ev.length && html`<li class="faint">No source documents linked.</li>`}</ul></${P.Card}></div></div></div>`;
  };

  /* ---------- detail router ---------- */
  P.Investigate = ({ nav, dispatch, f, setF, pending, noFilters, page })=>{
    const top = M.nav.top(nav), ctx = P.ctx(nav, f), k = ctx.comp && top.t==='group' && top.dim==='component' && M.KPI[ctx.comp.key]? M.KPI[ctx.comp.key] : M.KPI[nav.kpi];
    const mat = M.nav.material(nav, f);
    const goDoc = (id)=> dispatch({ t:'drill', node:N.doc(id) }), goCase = (id)=> dispatch({ t:'drill', node:N.case(id) }), goM = (id)=> dispatch({ t:'drill', node:N.material(id) });
    let body;
    if(top.t==='root'){ const V = roots[nav.kpi]; body = V? html`<${V} f=${f} nav=${nav} dispatch=${dispatch} facts=${ctx.facts}/>` : html`<${P.Empty}/>`; }
    else if(top.t==='group') body = html`<${GroupView} f=${f} nav=${nav} dispatch=${dispatch} cx=${ctx}/>`;
    else if(top.t==='material' || top.t==='vendor') body = html`<${MaterialInKpi} f=${f} nav=${nav} dispatch=${dispatch} cx=${ctx}/>`;
    else if(top.t==='profile') body = html`<${P.MaterialProfile} id=${top.id} f=${f} ctx=${{ kpi:ctx.eff==='health'? null : ctx.eff, f, groups:ctx.groups }} onDoc=${goDoc} onCase=${goCase}/>`;
    else if(top.t==='doc') body = html`<${P.DocView} id=${top.id} onMaterial=${goM} onCase=${goCase}/>`;
    else if(top.t==='case') body = html`<${P.CaseView} id=${top.id} onDoc=${goDoc} onMaterial=${goM} onCase=${goCase}/>`;
    const p = M.period(f.period), act = M.active(f);
    return html`<section class=${'px-panel px-detail '+P.kc(nav.kpi)} aria-labelledby="px-ph">
      <header class="px-ph"><div class="px-pt"><div class="px-pt-t"><h1 id="px-ph"><span class="px-h-i"><${Icon} n=${P.KICON[nav.kpi]} size=${20} strokeWidth=${1.6}/></span>${k.name}</h1><p>${k.q}</p></div>
        <div class="px-pm"><span class="px-tag">${k.time==='Snapshot'? 'Snapshot '+C.snapLabel : p.label}</span>${act.length>0 && html`<span class="faint">${act.length} filter${act.length>1?'s':''}</span>`}<${P.KpiDef} id=${nav.kpi}/></div></div>
        ${!noFilters && html`<${P.FilterBar} f=${f} setF=${setF} pending=${pending} compact=${true}/>`}
        <${P.MaterialMarker} id=${mat} isProfile=${top.t==='profile'} onOpen=${()=> dispatch({ t:'drill', node:N.profile(mat) })} onClear=${f.vendor && f.vendor===mat? ()=> setF(Object.assign({}, f, { vendor:null })) : null}/></header>
      <${P.PanelBody} depth=${nav.path.length} sig=${nav.kpi+':'+nav.path.length+':'+top.t+':'+(top.id||top.key||'')} reset=${M.fkey(f)+nav.path.length}>${body}</${P.PanelBody}></section>`;
  };
})();

/* every record view opens with the action bar (assets/js/shared/act.js): status, AI recommendation, owner, Resolve */
(function(){
  const P = window.SC, M = window.SCM; if(!P || !P.DocView || !window.FCTAct) return;
  const { html, h } = P, N = P.node, Body = P.DocView;
  const ACT = P.ACT = FCTAct.make(P, { tower:'sc', towerName:'SC', issue:(c)=> M.issue(c) });
  const valOf = (l)=> l.amt!=null? l.amt : l.val!=null? l.val : l.rem!=null? l.rem : 0;
  P.DocView = (pr)=>{ const l = M.rec(pr.id); if(!l) return h(Body, pr); const ch = M.chain(pr.id), cases = M.X.cases.filter(c=> c.lines.includes(pr.id));
    let label = pr.id; try{ label = N.doc(pr.id).label; }catch(e){}
    return html`<div class="px-docwrap"><${ACT.ActionBar} key=${pr.id} id=${pr.id} codes=${ch? ch.iss : []} label=${label} ent=${(M.V[l.v]||{}).name || l.v} val=${valOf(l)} ex=${l.ex}
      cases=${cases.map(c=> ({ id:c.id, name:(M.ETYPE[c.type]||{}).name || c.type }))} onCase=${pr.onCase} ctx=${pr.act} theme=${pr.theme}/>${h(Body, pr)}</div>`; };
})();
