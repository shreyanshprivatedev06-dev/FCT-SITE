/* FCT demo — O2C control tower: investigation views shared by the three O2C screens.
   KPI sheet · Investigate (root → group → customer → profile → document / case) · CustomerProfile · DocView · CaseView. */
(function(){
  const { html, h, R, M, COL, Icon, cx } = O2C, P = O2C, FCT = window.FCT;
  const { useState, useEffect, useRef, Fragment, useMemo } = React;
  const { cr, amt, pct } = P;
  const C = M.C;
  const vname = (id)=> (M.V[id]||{}).name || id;

  /* ---------- node builders (breadcrumb labels carry the full text; CSS truncates) ---------- */
  const N = P.node = {
    group:(dim, key)=> dim==='customer'? N.customer(key) : { t:'group', dim, key, label:(dim==='component'? '' : M.dimName[dim]+': ')+M.dimLabel(dim, key) },
    customer:(id)=> ({ t:'customer', id, label:vname(id) }),
    profile:(id)=> ({ t:'profile', id, label:vname(id) }),
    rec:(x)=> x.kind==='case'? N.case(x.rec.id) : (x.kind==='customer'||x.kind==='vendor')? N.customer(x.rec.id) : N.doc(x.rec.id),
    doc:(id)=>{ const r = M.rec(id); return { t:'doc', id, label: !r? id : M.line(id)? (r.cn? 'Credit note ' : 'Invoice ')+r.ref : M.openLine(id)? 'Order '+(r.id||r.so||r.po) : M.grniLine(id)? 'Unbilled '+(r.id||r.po) : r.id }; },
    case:(id)=> ({ t:'case', id, label:id }),
    stage:(id)=> ({ t:'group', dim:'stage', key:id, label:'Stage: '+M.stage(id).name }),
    issue:(code)=> ({ t:'group', dim:'issue', key:code, label:'Issue: '+M.issue(code).name })
  };
  N.vendor = N.customer;

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
    <div class="px-kc-h"><button type="button" class="px-kc-t" aria-pressed=${kpi===id} onClick=${(e)=>{ e.stopPropagation(); pick(id); }}><span class="px-kc-i"><${Icon} n=${icon || P.KICON[id]} size=${15} strokeWidth=${1.6}/></span><span>${title}</span></button><${P.KpiDef} id=${id}/>${right}</div>
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
    <div class="px-rc-h"><button type="button" class="px-kc-t" aria-pressed=${kpi===id} onClick=${(e)=>{ e.stopPropagation(); pick(id); }}><span class="px-kc-i"><${Icon} n=${P.KICON[id]} size=${15} strokeWidth=${1.6}/></span><span>${title}</span></button><${P.KpiDef} id=${id}/><span class="px-basis">${basis}</span></div>
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
  const SHORT = { cash:'Cash auto-match', credit:'Credit within policy', ptp:'Payment commitments met', billing:'On-time invoicing', coll:'Overdue AR collected', mdq:'Master data accuracy',
    t_oc:'Order & credit controls', t_fd:'Fulfilment & delivery', t_rb:'Revenue & billing integrity', t_ar:'Receivables & working capital', t_cc:'Collections & cash application', t_ci:'Control compliance & data' };

  /* lower-case for running text, keeping acronyms (PO, GR, IRN, PAN, GSTIN, MSME) */
  const lc = (t)=> String(t||'').split(' ').map(w=> /^[A-Z0-9]{2,}$/.test(w)? w : w.toLowerCase()).join(' ');
  P.lc = lc;
  const topOf = (facts, dim)=>{ const r = M.group(facts.filter(x=>x.ok===false), (x)=> x.g[dim]).sort((a,b)=> b.n-a.n)[0]; return r || null; };
  const compNote = (id, f, K, seg)=>{
    if(seg){ const g = M.segComp(id, f, seg); if(!g.n) return 'No '+seg.toLowerCase()+' customers have records here.';
      const all = (K[id]||{}).v, d = all==null || g.rate==null? null : g.rate - all;
      return seg+' customers score '+pct(g.rate,1)+' here'+(d==null? '.' : Math.abs(d)<0.1? ', the same as all customers.' : ', '+FCT.n(Math.abs(d),1)+' points '+(d<0? 'worse' : 'better')+' than all customers ('+pct(all,1)+').')+(g.bad? ' '+FCT.n(g.bad)+' of their '+FCT.n(g.n)+' records had a problem.' : ''); }
    const k = K[id]; if(!k || k.v==null) return 'No data for these filters.';
    if(id==='mdq'){ const t = topOf(M.facts('mdq', f), 'check'); return k.bad? FCT.n(k.bad)+' customer details are missing or out of date. The most common gap: '+(t? lc(t.key)+' ('+t.n+')' : '—')+'.' : 'Every customer record is complete.'; }
    if(M.isTheme(id)){ const subs = (k.subs||[]).filter(x=> x.rate!=null).sort((a,b)=> a.rate-b.rate), w = subs[0];
      return !k.bad? 'Every check passed across '+FCT.n(k.n)+' records.' : 'Critical: '+lc(w.name)+' at '+pct(w.rate,1)+' ('+FCT.n(w.bad)+' of '+FCT.n(w.n)+' failed).'+(k.coverage<1? ' '+(k.subs.length-subs.length)+' subtheme'+(k.subs.length-subs.length>1? 's have' : ' has')+' no data.' : ''); }
    if(!k.bad) return 'No problems in '+FCT.n(k.n)+' records.';
    const fs = M.facts(id, f), t = topOf(fs, { credit:'kind', cash:'status', ptp:'status', billing:'inco', coll:'seg' }[id]), n = FCT.n(k.bad), sh = pct(k.bad/k.n*100,1), tn = t? ' ('+FCT.n(t.n)+')' : '';
    return { credit: n+' credit decisions ('+sh+') were outside policy'+tn+'.',
      cash: n+' receipts ('+sh+') did not match invoices cleanly. Most often '+lc(t? t.key : 'a missing remittance')+tn+'.',
      ptp: n+' promises ('+sh+') were broken'+(t? ', mostly '+lc(t.key)+tn : '')+'.',
      billing: n+' shipments ('+sh+') were billed more than 2 days after control passed'+(t? '. '+t.key+' is the slowest'+tn : '')+'.',
      coll: n+' targeted overdue invoices ('+sh+') were not collected in the period'+(t? ', most in '+lc(t.key)+tn : '')+'.' }[id]; };
  P.compNote = compNote;
  P.KpiBoard = ({ f, kpi, pick, openCase })=>{
    const p = M.period(f.period), prior = p.prior? M.period(p.prior).label : null;
    const K = {}; C.sheet.concat(['mdq'], C.health.map(h=> h.kpi)).forEach(id=> K[id] = M.kpi(id, f));
    const hl = K.health.h;
    const spF = M.facts('revenue', f), sp = M.group(spF, (x)=> x.rec.cat).map((r,i)=> ({ key:r.key, name:M.CAT[r.key].name, val:r.val }));
    const spT = M.sum(sp, r=>r.val); sp.forEach((r,i)=> r.c = P.CAT_COL[i % P.CAT_COL.length]);
    const tv = M.topCustomers(f);
    const ex = K.exposure.e, exF = M.facts('exposure', f), exBy = M.group(exF, (x)=> x.rec.type).slice(0,6).map(r=> ({ key:r.key, name:M.ETYPE[r.key].name, v:+r.val.toFixed(2) }));
    const odF = M.facts('overdue', f), od = M.group(odF, (x)=> x.g.bucket), cm = M.group(M.facts('ar', f), (x)=> x.g.bucket);
    const vs = M.customersIn(f), dup = vs.filter(v=> v.dupPair && M.V[v.dupPair] && M.V[v.dupPair].status==='Active').length/2;
    const cs = M.cases(f).filter(c=> M.statusMeasure(c.stNow)==='potential');
    const [tab, setTab] = useState('all'), seg = null;
    const rows = cs.filter(c=> tab==='all' || (tab==='fin'? M.ETYPE[c.type].basis==='fin' : M.ETYPE[c.type].basis==='ctl'))
      .map(c=> ({ c, val: c.est!=null? c.est : c.affected||0 })).sort((a,b)=> (M.ETYPE[b.c.type].basis==='fin') - (M.ETYPE[a.c.type].basis==='fin') || b.val-a.val).slice(0,7);
    const prio = (c, v)=> M.ETYPE[c.type].basis==='fin'? (v>=.5? 'High' : v>=.1? 'Medium' : 'Low') : (v>=2? 'High' : v>=.5? 'Medium' : 'Low');
    const rates = C.health.map(h=> h.kpi), onT = rates.filter(id=> M.status(id, K[id].v)==='good').length;
    const mix = K.riskmix.mix, hi = mix[0].n + mix[1].n;
    const lostTop = hl.comps.filter(c=>c.lost!=null).sort((a,b)=>b.lost-a.lost)[0];
    const bandTone = !hl.band? 'n' : hl.band.cls==='pos'? 'g' : hl.band.cls==='med'? 'a' : 'r';
    const stTone = { good:['g','On target'], watch:['a','Watch'], off:['r','Off target'], na:['n','No data'] };
    return html`<div class="px-board" aria-label="O2C KPI board"><div class="px-board-in">
      <${Sec} c="kpi" icon="Gauge" title="Headline key performance indicators" sub=${'Billed revenue for '+p.label+'. Receivables, overdue and collections exposure as at '+C.snapLabel+'.'}
        right=${html`<${Pill} tone=${bandTone}>Health ${K.health.v==null? 'N/A' : K.health.v} · ${hl.band? hl.band.label : ''}</${Pill}><${Pill} tone=${onT>=4? 'g' : onT>=2? 'a' : 'r'}>${onT} of ${rates.length} themes on target</${Pill}><${Pill} tone="r">${cr(ex.potential)} exposure</${Pill}>`}>
        <div class="px-hero3">
          <section class=${cx('px-kc px-feat2', P.kc('health'), kpi==='health' && 'on')} onClick=${()=> pick('health')} aria-label="O2C Health Score">
            <div class="px-rc-h"><button type="button" class="px-kc-t" aria-pressed=${kpi==='health'} onClick=${(e)=>{ e.stopPropagation(); pick('health'); }}><span class="px-kc-i"><${Icon} n=${P.KICON.health} size=${15} strokeWidth=${1.6}/></span><span>O2C Health Score</span></button><${P.KpiDef} id="health"/>
              <span class="px-basis">${p.label}</span></div>
            <div class="px-feat2-b">
              <div class="px-feat2-l px-hs">
                <div class="px-hs-top"><${Ring} v=${K.health.v} band=${hl.band}/>
                  <div class="px-hs-s"><div class="px-hs-p">${hl.band && html`<${Pill} tone=${bandTone}>${hl.band.label}</${Pill}>`}<${DChip} id="health" v=${K.health.v} prior=${K.health.prior}/></div>
                    <div class="px-hs-tr"><span>Apr–Sep trend</span>${(K.health.series||[]).filter(v=> v!=null).length>1? html`<${Spark} data=${K.health.series} w=${170} ht=${34}/>` : html`<small class="faint">First scored this month; no earlier months to compare</small>`}</div></div></div>
                <div class="px-hs-k"><div><b class="num">${onT}<small>/${rates.length}</small></b><span>On target</span></div><div><b class="num">${K.health.v==null? 'N/A' : 100-K.health.v}</b><span>Points lost</span></div><div><b class="num">${pct(hl.coverage*100,0)}</b><span>Data coverage</span></div></div>
                ${K.health.v!=null && html`<div class="px-hs-lost"><div class="h">Where the ${100-K.health.v} points went</div>
                  <${Seg} label="Points lost by theme" parts=${hl.comps.filter(c=> c.lost>0.5).sort((a,b)=> b.lost-a.lost).map(c=> ({ l:SHORT[c.kpi] || c.name, v:Math.round(c.lost), c:scoreTone(c.sc) }))}/></div>`}
                <${AI}>${K.health.v==null? null : 'The score is '+K.health.v+' out of 100'+(K.health.prior!=null? ', '+FCT.n(Math.abs(K.health.v-K.health.prior))+' points '+(K.health.v<K.health.prior? 'lower' : 'higher')+' than '+prior : '')+'. '+(lostTop? (SHORT[lostTop.kpi]||lostTop.name)+' is pulling it down the most.' : '')}</${AI}></div>
              <div class="px-feat2-c">${hl.comps.map(c=>{ const g = M.segComp(c.kpi, f, seg), vtag = g.vPct==null? 'No customers' : pct(g.vPct,0)+' of '+(seg? seg.toLowerCase()+' ' : '')+'customers affected', val = seg? g.rate : c.v;
                const k = K[c.kpi] || {}, isRate = rates.includes(c.kpi), tgt = (M.KPI[c.kpi]||{}).target ?? (C.health.find(h=>h.kpi===c.kpi)||{}).target, st = isRate? M.status(c.kpi, k.v) : null;
                return html`<button key=${c.kpi} type="button" class=${cx('px-cm2', kpi===c.kpi && 'on')} onClick=${stop(()=> pick('health', { key:c.kpi, dim:'component' }))} title=${c.name+': score '+(c.sc==null? 'N/A' : Math.round(c.sc))+' of 100, weight '+c.w+(isRate? '. Click to open the KPI.' : '')}>
                <span class="hd"><span class="n">${SHORT[c.kpi] || c.name}<${P.KpiDef} id=${c.kpi} inline=${true}/></span><b class="v num">${val==null? 'N/A' : pct(val)}</b></span>
                <span class="px-cm2-m"><span class="faint">Target ${tgt!=null? tgt+'%' : 'N/A'}</span>${st && stTone[st] && html`<${Pill} tone=${stTone[st][0]}>${stTone[st][1]}</${Pill}>`}<${DChip} id=${c.kpi} v=${k.v} prior=${k.prior}/>${k.series && html`<${Spark} data=${k.series} w=${70} ht=${16} target=${tgt}/>`}</span>
                <span class="trk"><i style=${{ width:(seg? Math.max(0, Math.min(100, (val - C.health.find(h=>h.kpi===c.kpi).floor)/(C.health.find(h=>h.kpi===c.kpi).target - C.health.find(h=>h.kpi===c.kpi).floor)*100)) : (c.sc||0))+'%', background:scoreTone(seg? (val==null? null : (val - C.health.find(h=>h.kpi===c.kpi).floor)/(C.health.find(h=>h.kpi===c.kpi).target - C.health.find(h=>h.kpi===c.kpi).floor)*100) : c.sc) }}/></span>
                <span class="px-vt"><span class=${cx('tg', g.vPct>=50? 'hi' : g.vPct>=20? 'md' : 'lo')}><${Icon} n="Users" size=${12}/>${vtag}</span><span class="faint">${g.vBad} of ${g.vN}</span></span>
                <${AI} cls="sm">${compNote(c.kpi, f, K, seg)}</${AI}></button>`; })}</div></div></section>
          <div class="px-hero3-g">
            <${RCard} id="revenue" kpi=${kpi} pick=${pick} title="Billed Revenue" basis=${p.label} value=${cr(K.revenue.v,1)}
              chip=${html`<${DChip} id="revenue" v=${K.revenue.v} prior=${K.revenue.prior} mode="pct"/>`} viz=${html`<${AreaSpark} data=${K.revenue.series} height=${44}/>`}
              note=${K.revenue.v? 'We billed '+cr(K.revenue.v,0)+' this month'+(K.revenue.prior? ', '+pct(Math.abs((K.revenue.v-K.revenue.prior)/K.revenue.prior*100),1)+(K.revenue.v>=K.revenue.prior? ' more' : ' less')+' than '+prior : '')+'.' : null}
              top=${html`<${MiniTab} title="Top business units" cols=${['Business unit','Revenue','Share','Change']} rows=${(()=>{ const pf = p.prior? M.facts('revenue', Object.assign({}, f, { period:p.prior })) : [];
                return mtRows(top3(spF, (x)=> x.rec.e, (k)=> k+' '+((M.BU[k]||{}).name||'')), (r)=>{ const pv = M.sum(pf.filter(x=>x.rec.e===r.key), x=>x.val); return [r.label, cr(r.val,0), pct(r.val/K.revenue.v*100,0), pv? (r.val>=pv? '▲ ' : '▼ ')+pct(Math.abs((r.val-pv)/pv*100),0) : '—']; }); })()}/>`}
              foot=${[['Invoices', FCT.n(spF.filter(x=>!x.rec.cn).length)], ['Credit notes', cr(M.sum(spF.filter(x=>x.rec.cn),x=>x.val),1)], ['Top 5 AR', pct(tv.top5,0)]]}/>
            <${RCard} id="ar" kpi=${kpi} pick=${pick} title="Open Receivables" basis="Snapshot" value=${cr(K.ar.v,0)}
              chip=${html`<${Pill}>${FCT.n(K.ar.n)} invoices</${Pill}>`} viz=${html`<${Seg} label="Open receivables by ageing" parts=${M.arBuckets.map((a,i)=> ({ l:a.replace(' days','d').replace('Over ','>').replace('Not due','Not due'), v:(cm.find(r=>r.key===a)||{val:0}).val, c:P.ramp[Math.min(5,i)], f:(v)=> cr(v,0) }))}/>`}
              note=${K.ar.v? cr(K.ar.v,0)+' is open on the sub-ledger. '+cr(K.overdue.v,0)+' of it is past due. ECL required is '+cr(K.ar.ecl,1)+' against '+cr(C.ecl.booked,1)+' booked.' : null}
              top=${html`<${MiniTab} title="Largest open customers" cols=${['Customer','AR','Share','Overdue']} rows=${mtRows(top3(M.facts('ar', f), (x)=> x.v, (k)=> M.V[k].name), (r)=>{ const ls = M.facts('ar', f).filter(x=>x.v===r.key);
                return [r.label, cr(r.val,1), pct(r.val/K.ar.v*100,0), cr(M.sum(ls.filter(x=> x.rec.due < M.SNAP), x=>x.val),1)]; })}/>`}
              foot=${[['Overdue', cr(K.overdue.v,0), 'a'], ['ECL required', cr(K.ar.ecl,1)], ['Unapplied cash', cr(K.ar.unapplied,1)]]}/>
            <${RCard} id="overdue" kpi=${kpi} pick=${pick} title="Overdue Receivables" basis="Snapshot" value=${cr(K.overdue.v,1)}
              chip=${html`<${Pill} tone="a">${FCT.n(K.overdue.n)} invoices</${Pill}>`} viz=${html`<${Seg} label="Overdue receivables by days past due" parts=${M.odBuckets.map((a,i)=> ({ l:a.replace(' days','d').replace('Over ','>'), v:(od.find(r=>r.key===a)||{val:0}).val, c:['#F2C2A6','#EE9A72','#E06A4E','#B8402E'][i], f:(v)=> cr(v,1) }))}/>`}
              note=${K.overdue.v? cr(K.overdue.v,1)+' of invoices are past due. DSO is '+(K.overdue.dso!=null? K.overdue.dso+' days' : 'N/A')+'. '+cr(K.overdue.blocked,1)+' is disputed and sitting inside the total.' : null}
              top=${html`<${MiniTab} title="Most overdue customers" cols=${['Customer','Overdue','Bills','Oldest']} rows=${mtRows(top3(odF, (x)=> x.v, (k)=> M.V[k].name), (r)=>{ const ls = odF.filter(x=>x.v===r.key);
                return [r.label, amt(r.val), FCT.n(ls.length), Math.max(...ls.map(x=> Math.floor(M.SNAP - x.rec.due)))+'d']; })}/>`}
              foot=${[['DSO', K.overdue.dso!=null? K.overdue.dso+' d' : 'N/A'], ['Disputed', cr(K.overdue.blocked,1), 'r'], ['Over 30d', cr(M.sum(odF.filter(x=>x.g.bucket!=='1–30 days'),x=>x.val),1)]]}/>
            <${RCard} id="exposure" kpi=${kpi} pick=${pick} title="Collections Exposure" basis="Snapshot" value=${cr(ex.potential)} tone="crit"
              chip=${html`<${Pill} tone="r">${ex.potN} open cases</${Pill}>`} viz=${html`<div class="px-mini-bars">${exBy.slice(0,3).map(r=> html`<div key=${r.key}><span class="n" title=${r.name}>${r.name}</span><span class="trk"><i style=${{ width:(r.v/(exBy[0]? exBy[0].v : 1)*100)+'%' }}/></span><b class="num">${cr(r.v)}</b></div>`)}</div>`}
              note=${exBy[0]? cr(ex.potential)+' could be at risk and needs checking. The biggest source is '+lc(exBy[0].name)+' ('+pct(exBy[0].v/ex.potential*100,0)+'). Nothing is confirmed lost yet'+(ex.loss>0.005? ' beyond '+cr(ex.loss) : '')+'.' : null}
              top=${html`<${MiniTab} title="Customers with most exposure" cols=${['Customer','At risk','Share','Cases']} rows=${mtRows(top3(exF, (x)=> x.v, (k)=> M.V[k].name), (r)=> [r.label, amt(r.val), pct(r.val/ex.potential*100,0), FCT.n(exF.filter(x=>x.v===r.key).length)])}/>`}
              foot=${[['Disputed', cr(ex.disputed)], ['Loss', cr(ex.loss)], ['Control', cr(ex.control,1)]]}/>
          </div></div></${Sec}>
      <${Sec} c="revenue" icon="IndianRupee" title="Revenue KPIs" sub=${'Billed revenue in '+p.label+' by category and customer. Dots show approved risk.'}
        right=${html`<${Pill} tone="n">${cr(K.revenue.v,1)}</${Pill}><${DChip} id="revenue" v=${K.revenue.v} prior=${K.revenue.prior} mode="pct"/>`}><div class="px-brow">
        <${KCard} id="revenue" kpi=${kpi} pick=${pick} title="Revenue by product line" sub=${'Billed revenue, '+p.label}>
          <div class="px-catd"><div class="px-catd-c" style=${{height:132}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.PieChart}>
            <${R.Pie} data=${sp} dataKey="val" nameKey="name" innerRadius="62%" outerRadius="96%" paddingAngle=${1} stroke=${COL.surface} strokeWidth=${2} isAnimationActive=${!P.useRM()} onClick=${(d,i,e)=>{ e && e.stopPropagation && e.stopPropagation(); pick('revenue', { key:M.CAT[d.key].name, dim:'cat' }); }} style=${{cursor:'pointer'}}>
              ${sp.map((r,i)=> h(R.Cell, { key:i, fill:r.c }))}</${R.Pie}><${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=> cr(v)+' · '+pct(v/spT*100) })}/></${R.PieChart}></${R.ResponsiveContainer}>
            <div class="px-donut-c"><b>${cr(spT,0)}</b><span>${sp.length} categories</span></div></div>
          <ul class="px-catl">${sp.map(r=> html`<li key=${r.key}><button type="button" onClick=${stop(()=> pick('revenue', { key:M.CAT[r.key].name, dim:'cat' }))} title=${r.name+': '+cr(r.val)+' ('+pct(r.val/spT*100)+')'}><i style=${{background:r.c}}/><span class="nm">${r.name}</span>
            <span class="sh"><em style=${{ width:(r.val/sp[0].val*100)+'%', background:r.c }}/></span><b class="num">${cr(r.val,0)}</b></button></li>`)}</ul></div></${KCard}>
        <${KCard} id="topc" kpi=${kpi} pick=${pick} title="Top Customers by AR" sub=${'Top 5 hold '+pct(tv.top5)+' · top 10 '+pct(tv.top10)}>
          <div class="px-topv">${tv.rows.slice(0,7).map((r,i)=> html`<button key=${r.v} type="button" class="px-topv-r" onClick=${stop(()=> pick('topc', { key:r.v, dim:'vendor' }))} title=${r.name+' · '+M.risk(r.v).approved+' risk'}>
            <span class="rk num">${i+1}</span><span class="nm"><i style=${{ background:P.RISK[M.risk(r.v).approved] }}/>${r.name}</span><span class="trk"><i style=${{ width:(r.spend/tv.rows[0].spend*100)+'%' }}/></span><b class="num">${cr(r.spend,1)}</b><span class="num faint">${pct(r.share)}</span></button>`)}</div></${KCard}>
      </div></${Sec}>
      <${Sec} c="customer" icon="Users" title="Customer and Exposure KPIs" sub="Approved risk, master-data quality and value tied to open cases."
        right=${html`<${Pill} tone="r">${mix[0].n} critical</${Pill}><${Pill} tone="a">${mix[1].n} high</${Pill}><${Pill}>${vs.length} active</${Pill}>`}><div class="px-brow">
        <${KCard} id="riskmix" kpi=${kpi} pick=${pick} title="Customer risk and compliance" sub=${vs.length+' active customers by approved category'}>
          <${Seg} label="Customer Risk Mix" parts=${mix.map(m=> ({ l:m.id, v:m.n, c:P.RISK[m.id] }))}/>
          <div class="px-tiles h">
            <button type="button" class="px-tile" onClick=${stop(()=> pick('riskmix', { key:'High', dim:'risk' }))}><span class="i crit"><${Icon} n="TriangleAlert" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">High-risk customers</span><b>${hi}</b><small>${pct(vs.length? hi/vs.length*100 : null,0)} of active</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> pick('riskmix'))}><span class="i med"><${Icon} n="Eye" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Re-review proposed</span><b>${K.riskmix.rereview}</b><small>model differs</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> pick('health', { key:'mdq', dim:'component' }))}><span class="i ai"><${Icon} n="ListChecks" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Master-data quality</span><b>${pct(K.mdq.v,0)}</b><small>${K.mdq.bad} failing checks</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> location.href = FCT.href('screens/o2c/customers.html'))}><span class="i brand"><${Icon} n="Link2" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Duplicate records</span><b>${dup}</b><small>same PAN or GSTIN</small></span></button></div></${KCard}>
        <${KCard} id="exposure" kpi=${kpi} pick=${pick} title="Potential exposure by type" sub="Open and under-investigation estimates">
          <div class="px-xbars">${exBy.map(r=> html`<button key=${r.key} type="button" onClick=${stop(()=> pick('exposure', { key:r.key, dim:'type' }))} title=${r.name+': '+cr(r.v)}>
            <span class="n">${r.name}</span><span class="trk"><i style=${{ width:(r.v/(exBy[0]? exBy[0].v : 1)*100)+'%' }}/></span><b class="num">${cr(r.v)}</b></button>`)}</div>
          <${Foot} items=${[['Potential', cr(ex.potential), 'r'], ['Disputed', cr(ex.disputed)], ['Confirmed loss', cr(ex.loss)]]}/></${KCard}>
      </div></${Sec}>
      <${Sec} c="exc" icon="Crosshair" title="Exceptions" sub="Open cases by value: estimates for financial cases, value affected for control cases."
        right=${html`<${Pill} tone="r">${cs.filter(c=>M.ETYPE[c.type].basis==='fin').length} financial</${Pill}><${Pill}>${cs.filter(c=>M.ETYPE[c.type].basis==='ctl').length} control</${Pill}>`}><section class="px-kc px-exc" aria-label="Open exceptions"><div class="px-kc-h"><span class="px-kc-t static"><span class="px-kc-i"><${Icon} n="Crosshair" size=${15} strokeWidth=${1.6}/></span><span>Open exceptions</span></span>
          <${P.Seg} label="Exception type" value=${tab} onChange=${setTab} options=${[['all','All ('+cs.length+')'],['fin','Financial ('+cs.filter(c=>M.ETYPE[c.type].basis==='fin').length+')'],['ctl','Control ('+cs.filter(c=>M.ETYPE[c.type].basis==='ctl').length+')']]}/></div>
        <div class="px-tbl"><table class="t px-t dense"><caption class="sr">Open exceptions</caption><thead><tr><th>Priority</th><th>Type</th><th>Customer</th><th class="r">Amount</th><th class="r">Age</th><th>Status</th><th><span class="sr">Action</span></th></tr></thead>
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
    const customer = (()=>{ for(let i=nav.path.length-1;i>=0;i--) if(nav.path[i].t==='customer' || nav.path[i].t==='vendor' || nav.path[i].t==='profile') return nav.path[i].id; return null; })();
    const facts = (eff==='health')? [] : M.facts(eff, f).filter(x=> gs.every(g=> x.g[g.dim]===g.key) && (!customer || x.v===customer));
    return { eff, groups:gs, comp, customer, facts };
  };
  const factSort = (id)=> (a,b)=> M.isRate(id)? ((a.ok===false?0:1)-(b.ok===false?0:1)) || (b.val-a.val) : (b.val-a.val);

  /* column sets for record tables */
  const statusCol = (id)=> ({
    cash:{ l:'Match', fmt:(x)=> x.ok? html`<span class="faint">${x.g.status}</span>` : html`<span class="px-bad">${x.g.status||'Unapplied'}</span>` },
    credit:{ l:'Decision', fmt:(x)=> x.ok? html`<span class="faint">${x.g.kind}: inside policy</span>` : html`<span class="px-bad">${x.g.kind}: outside policy</span>` },
    ptp:{ l:'Promise', fmt:(x)=> x.ok? html`<span class="faint">Kept</span>` : html`<span class="px-bad">Broken</span>` },
    billing:{ l:'Billing lag', fmt:(x)=> x.ok? html`<span class="faint">On time</span>` : html`<span class="px-bad">${x.rec.lateBill? 'Billed after POD' : 'Unbilled'}</span>` },
    coll:{ l:'Collection', fmt:(x)=> x.ok? html`<span class="faint">Collected</span>` : html`<span class="px-bad">${x.g.status||'Still open'}</span>` },
    overdue:{ l:'Status', fmt:(x)=> html`<span>${x.g.status}</span> <span class="faint">${x.g.bucket}</span>` },
    revenue:{ l:'Category', fmt:(x)=> x.g.cat },
    ar:{ l:'Ageing', fmt:(x)=> x.g.bucket },
    mdq:{ l:'Check', fmt:(x)=> x.ok? html`<span class="faint">${x.g.check}: pass</span>` : html`<span class="px-bad">${x.g.check}: fails</span>` }
  })[id] || (M.isTheme(id) && { l:'Check', fmt:(x)=> x.ok? html`<span class="faint">${x.g.sub}: pass</span>` : html`<span class="px-bad">${x.g.sub}: fails</span>` }) || { l:'Status', fmt:(x)=> x.g && x.g.status || '' };
  P.factCols = (id, kind)=>{
    if(kind==='case') return [ { k:'id', l:'Case', w:'14%', fmt:(x)=> html`<b>${x.rec.id}</b>${x.rec.ex? html`<span class="sub">${x.rec.ex}</span>` : ''}`, sv:(x)=>x.rec.id },
      { k:'type', l:'Type', w:'26%', fmt:(x)=> M.ETYPE[x.rec.type].name, sv:(x)=>x.rec.type }, { k:'v', l:'Customer', w:'26%', fmt:(x)=> vname(x.v), sv:(x)=>vname(x.v) },
      { k:'val', l:'Estimate', w:'13%', r:true, fmt:(x)=> x.rec.est==null? html`<span class="faint">n.q.</span>` : amt(x.rec.est), sv:(x)=>x.val },
      { k:'conf', l:'Conf.', w:'9%', r:true, nx:true, fmt:(x)=> pct(x.rec.conf*100,0), sv:(x)=>x.rec.conf }, { k:'st', l:'Status', w:'15%', fmt:(x)=> M.statusName(x.rec.stNow), sv:(x)=>x.rec.stNow },
      { k:'op', l:'Opened', w:'12%', nx:true, fmt:(x)=> M.date(x.rec.opened), sv:(x)=>x.rec.opened } ];
    if(kind==='customer' || kind==='vendor') return [ { k:'v', l:'Customer', fmt:(x)=> html`<b>${x.rec.name}</b><div class="sub">${x.rec.id}</div>`, sv:(x)=>x.rec.name },
      { k:'cat', l:'Category', fmt:(x)=> M.CAT[x.rec.cat].name, sv:(x)=>x.rec.cat }, { k:'risk', l:'Risk', fmt:(x)=>{ const r = M.risk(x.v); return html`<${P.RiskTag} cat=${r.approved} score=${r.score} small=${true}/>${r.rereview? html` <span class="px-tag warn" title=${'Model suggests '+r.model}>Re-review</span>` : ''}`; }, sv:(x)=>M.risk(x.v).score },
      { k:'val', l: id==='topc'? 'Open AR' : id==='mdq'? 'Check' : 'Open AR', r:true, fmt:(x)=> id==='topc'? html`${cr(x.val)} <span class="faint">${pct(x.share)}</span>` : id==='mdq'? (x.ok? 'Pass' : html`<span class="px-bad">Fails</span>`) : cr(x.spend||0), sv:(x)=> x.spend!=null? x.spend : x.val } ];
    if(kind==='open') return [ { k:'id', l:'Sales order', fmt:(x)=> html`<b>${x.rec.id || x.rec.po}</b>${x.rec.reason? html`<div class="sub">${x.rec.reason}</div>` : ''}`, sv:(x)=>x.rec.id },
      { k:'v', l:'Customer', w:'28%', fmt:(x)=> vname(x.v), sv:(x)=>vname(x.v) }, { k:'e', l:'BU', nx:true, w:'9%', fmt:(x)=> x.rec.e }, { k:'d', l:'Order date', nx:true, fmt:(x)=> M.date(x.rec.soD || x.rec.poD), sv:(x)=>x.rec.soD || x.rec.poD },
      { k:'st', l:'Credit', fmt:(x)=> x.rec.crdHold? html`<span class="px-bad">Held</span>` : (x.rec.st || 'Released') },
      { k:'val', l:'Open value', r:true, fmt:(x)=> amt(x.val), sv:(x)=>x.val } ];
    const sc = statusCol(id);
    return [ { k:'id', l:'Invoice', w:'24%', fmt:(x)=> html`<b>${x.rec.ref}</b><div class="sub">${x.rec.id}${x.rec.ex? ' · '+x.rec.ex : ''}</div>`, sv:(x)=>x.rec.id },
      { k:'v', l:'Customer', w:'30%', fmt:(x)=> vname(x.v), sv:(x)=>vname(x.v) }, { k:'e', l:'BU', nx:true, w:'9%', fmt:(x)=> x.rec.e, sv:(x)=>x.rec.e },
      { k:'d', w:'15%', l: M.isTheme(id)? 'Date' : id==='coll'? 'Due' : id==='credit'? 'Decided' : id==='billing'? 'Control passed' : id==='overdue'? 'Due' : id==='cash'? 'Received' : 'Invoice date', fmt:(x)=> M.date(id==='coll'? x.rec.due : id==='credit'? x.rec.at : id==='billing'? (x.rec.pod||x.rec.dspD) : id==='overdue'? x.rec.due : id==='cash'? x.rec.at : M.isTheme(id)? (x.rec.invD!=null? x.rec.invD : x.rec.at!=null? x.rec.at : x.rec.date!=null? x.rec.date : x.rec.dspD!=null? x.rec.dspD : x.rec.soD) : x.rec.invD), sv:(x)=> x.rec.invD || x.rec.at || x.rec.due },
      { k:'val', w:'14%', l:'Value', r:true, fmt:(x)=> amt(x.val), sv:(x)=>x.val }, { k:'st', l:sc.l, fmt:sc.fmt, sv:(x)=> x.ok===false? 0 : 1 } ];
  };
  const kindOf = (facts)=> facts.length? facts[0].kind : 'line';
  P.Records = ({ id, facts, onOpen, sel, onSelect, title, limit })=>{
    const groups = {}; facts.forEach(x=>{ (groups[x.kind]=groups[x.kind]||[]).push(x); });
    const kinds = Object.keys(groups);
    return html`<${Fragment}>${kinds.map(k=> html`<${P.Card} key=${k} title=${html`${title || (k==='case'? 'Cases' : k==='customer'||k==='vendor'? 'Customers' : k==='open'? 'Open orders' : 'Transactions')} <span class="px-count">${FCT.n(groups[k].length)}</span>`} className="flush">
      <${P.Table} cols=${P.factCols(id, k)} rows=${groups[k].slice().sort(factSort(id))} rowKey=${(x)=> x.rec.id + (x.g.check||'')} caption=${title||'Records'}
        sel=${sel} onSelect=${onSelect} onOpen=${onOpen} limit=${limit||20}/></${P.Card}>`)}</${Fragment}>`;
  };

  /* group facts by a dimension into BarList rows */
  P.groupRows = (id, facts, dim)=>{
    const rate = M.isRate(id);
    let rows = M.group(facts, (x)=> x.g[dim], { rate, label:(k)=> M.dimLabel(dim, k) });
    if(rate) rows = rows.filter(r=> r.bad>0 || dim==='component');
    return rows.map(r=> Object.assign(r, rate? { val:r.bad, sub: FCT.n(r.bad)+' of '+FCT.n(r.n)+' · '+amt(r.badVal)+(r.rate!=null? ' · rate '+pct(r.rate) : '') }
      : { sub: FCT.n(r.n)+' records'+(r.nv>1 && dim!=='customer' && dim!=='vendor'? ' · '+r.nv+' customers' : '') }));
  };
  const rateFmt = (v,r)=> FCT.n(v);
  const DimSwitch = ({ id, dim, onChange, exclude })=> html`<${P.Pick} label="By" value=${dim} onChange=${onChange}
    options=${(M.dims[id]||[]).filter(d=> !(exclude||[]).includes(d)).map(d=> [d, M.dimName[d]])}/>`;

  /* selected-group detail (single click on a bar): local analysis without navigating */
  const SelDetail = ({ id, facts, sel, dim, onDrill, onCustomer })=>{
    if(!sel) return null;
    const fs = facts.filter(x=> x.g[dim]===sel.key), rate = M.isRate(id);
    const vend = M.group(fs, (x)=> x.v, { rate }).slice(0,5);
    const bad = fs.filter(x=>x.ok===false);
    return html`<div class="px-seld" aria-live="polite"><div class="hd"><b>${M.dimLabel(dim, sel.key)}</b><button type="button" class="btn sm primary" onClick=${onDrill}>Drill in<${Icon} n="ChevronRight" size=${14}/></button></div>
      <div class="px-kv">${rate? html`<div><span>Records</span><b>${FCT.n(fs.length)}</b></div><div><span>Non-compliant</span><b>${FCT.n(bad.length)} · ${amt(M.sum(bad,x=>x.val))}</b></div><div><span>Rate</span><b>${pct(fs.length? (fs.length-bad.length)/fs.length*100 : null)}</b></div>`
        : html`<div><span>Records</span><b>${FCT.n(fs.length)}</b></div><div><span>Value</span><b>${cr(M.sum(fs,x=>x.val))}</b></div>`}</div>
      ${dim!=='customer' && dim!=='vendor' && html`<div class="ct">Customers behind it</div>${vend.map(v=> html`<button key=${v.key} type="button" class="px-vrow" onClick=${()=>onCustomer(v.key)}><span>${vname(v.key)}</span><span class="num">${rate? FCT.n(v.bad)+' · '+amt(v.badVal) : amt(v.val)}</span></button>`)}`}</div>`;
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
        <${SelDetail} id=${id} facts=${facts} sel=${sel} dim=${dim} onDrill=${()=> sel && drill(sel)} onCustomer=${(v)=> dispatch({ t:'drill', node:N.customer(v) })}/></${P.Card}>`;
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
  const EX = FCTExplore.make(P, M, {});
  const roots = {};
  /* O2C Health Score detail: checkpoints filter the open-case table in place; rows open the case */
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
      { k:'v', l:'Customer and business', w:'22%', fmt:(x)=> html`<b class="nb">${vname(x.v)}</b><div class="sub">${x.rec.e} · ${(M.CAT[(M.V[x.v]||{}).cat]||{}).name||''}</div>`, sv:(x)=> vname(x.v) },
      { k:'val', l:'Exposure', w:'13%', r:true, fmt:(x)=> html`<b>${amt(x.val)}</b><div class="sub">${x.rec.est!=null? 'estimate · '+pct(x.rec.conf*100,0) : 'value affected'}</div>`, sv:(x)=> x.val },
      { k:'t', l:'Investigation', w:'37%', fmt:(x)=>{ const codes = stg? (x.rec.cs.stages[stg]||[]) : [];
          return html`<b class="nb">${M.ETYPE[x.rec.type].name}</b><div class="sub">At ${M.stage(x.rec.cs.primary).name}${codes.length? ' · here: '+codes.map(k=> M.issue(k).name).join('; ') : ''}</div>`; }, sv:(x)=> x.rec.type },
      { k:'st', l:'Status', w:'11%', fmt:(x)=> html`<span class=${'px-cst s-'+x.rec.stNow}>${M.statusName(x.rec.stNow)}</span><div class="sub">${M.ETYPE[x.rec.type].basis==='fin'? 'Financial' : 'Control'}</div>`, sv:(x)=> x.rec.stNow } ];
    return html`<${Fragment}>
      <${Head} id="health" f=${f}><${P.Stat} label="Data coverage" value=${pct(hl.coverage*100,0)} sub=${hl.coverage<1? 'Themes without data are excluded, not scored as perfect' : 'All six themes have data'}/>
        <${P.Stat} label="Band" value=${hl.band? hl.band.label : 'N/A'} sub="Healthy 75+, Watch 55–74, At risk below 55"/>
        <${P.Stat} label="Points lost" value=${hl.score==null? 'N/A' : FCT.n(100-hl.score)} sub=${'Largest: '+(hl.comps.filter(c=>c.lost!=null).sort((a,b)=>b.lost-a.lost)[0]||{name:'—'}).name}/></${Head}>
      <div class="px-grid g-2">
        <${P.Card} title="Theme contributions" sub="Theme value = average of its subtheme pass rates. Normalised score = (value − floor) ÷ (target − floor). Drill in for subtheme, segment, customer and evidence.">
          <div class="px-comps" role="list">${hl.comps.map(c=> html`<div key=${c.kpi} role="listitem" class=${cx('px-comp', sel===c.kpi && 'on')} onDoubleClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}>
            <button type="button" class="b" aria-pressed=${sel===c.kpi} onClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}>
              <span class="n">${c.name}<small>weight ${c.w}</small></span><span class="v num">${c.v==null? 'N/A' : pct(c.v)}</span>
              <span class="trk" title=${'Score '+(c.sc==null? 'N/A' : Math.round(c.sc))}><i style=${{ width:(c.sc||0)+'%' }}/><em style=${{ left:'100%' }}/></span>
              <span class="p num">${c.contrib==null? '—' : '+'+FCT.n(c.contrib,1)}<small>${c.lost==null? '' : ' −'+FCT.n(c.lost,1)}</small></span></button>
            <button type="button" class="px-drill" aria-label=${'Drill in to '+c.name} onClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}><${Icon} n="ChevronRight" size=${14}/></button></div>`)}</div>
          ${comp && html`<div class="px-note">${comp.name}: ${comp.v==null? 'no data' : pct(comp.v)} against floor ${comp.floor}% and target ${comp.target}% gives ${Math.round(comp.sc)} of 100, worth ${FCT.n(comp.contrib,1)} of the score. <button type="button" class="px-link" onClick=${()=> dispatch({ t:'kpiJump', kpi:comp.kpi })}>Open ${comp.name}</button></div>`}</${P.Card}>
        <${P.Card} title="Health trend" sub="Receivables, control and snapshot subthemes have no history before this snapshot, so earlier months are not scored rather than compared on fewer themes."><${P.Trend} id="health" f=${f}/></${P.Card}></div>
      <${P.Card} title="Where in the O2C chain the issues arise" className="px-chk-card"
        right=${html`<div class="px-chk-act">${stg && html`<button type="button" class="btn sm" onClick=${()=> setStage(null)}><${Icon} n="RotateCcw" size=${13}/>View all</button>`}<a class="btn sm" href=${FCT.href('screens/o2c/process.html')}><${Icon} n="Layers" size=${13}/>Process chain</a></div>`}>
        <ol class="px-chk" aria-label="O2C checkpoints: select one to filter the open cases below">${C.stages.map((s,i)=>{ const x = S[s.id], rate = x.vol? x.n/x.vol : null, tone = stageTone(rate), on = stg===s.id;
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
  roots.revenue = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('revenue', f), tv = M.topCustomers(f), cn = M.sum(facts.filter(x=>x.rec.cn), x=>x.val);
    return html`<${Fragment}><${Head} id="revenue" f=${f}><${P.Stat} label="Invoices posted" value=${FCT.n(facts.filter(x=>!x.rec.cn).length)} sub=${'Credit notes '+cr(cn)}/>
      <${P.Stat} label="Credit notes" value=${cr(cn)} sub="Net of billed revenue"/><${P.Stat} label="Top 5 customers by AR" value=${pct(tv.top5)} sub=${'Top 10 '+pct(tv.top10)}/></${Head}>
      <${P.Card} title="Billed revenue by month" sub="Posted invoices net of credit notes"><${P.Trend} id="revenue" f=${f} bars=${true} height=${150}/></${P.Card}>
      <${Breakdown} id="revenue" facts=${facts} nav=${nav} dispatch=${dispatch}/></${Fragment}>`; };
  roots.ar = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('ar', f);
    return html`<${Fragment}><${Head} id="ar" f=${f}><${P.Stat} label="Open invoices" value=${FCT.n(k.n)} sub="Unpaid at the snapshot"/>
      <${P.Stat} label="ECL required" value=${cr(k.ecl)} sub=${'Booked '+cr(C.ecl.booked)+' · gap '+cr(k.eclGap)}/><${P.Stat} label="Unapplied cash" value=${cr(k.unapplied)} sub="Shown beside, not netted" tone="aside"/>
      <${P.Stat} label="Overdue inside AR" value=${cr(M.kpi('overdue', f).v)} sub="Past due at the snapshot"/></${Head}>
      <${Breakdown} id="ar" facts=${facts} nav=${nav} dispatch=${dispatch} sub="Open invoice value at the snapshot. Unapplied cash is not netted until matched."/></${Fragment}>`; };
  roots.overdue = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('overdue', f), by = M.group(facts, (x)=>x.g.status);
    return html`<${Fragment}><${Head} id="overdue" f=${f}><${P.Stat} label="Invoices past due" value=${FCT.n(k.n)}/>
      <${P.Stat} label="Disputed, inside the total" value=${cr(k.blocked)} sub="Not collected until cleared"/><${P.Stat} label="DSO" value=${k.dso!=null? k.dso+' days' : 'N/A'} sub="AR ÷ last-90-days billed × 90"/></${Head}>
      <${P.Card} title="By status" sub="Not-yet-due invoices are excluded."><div class="px-split">${by.map(r=> html`<div key=${r.key}><span>${r.key}</span><b class="num">${cr(r.val)}</b><small>${r.n} invoices</small></div>`)}</div></${P.Card}>
      <${Breakdown} id="overdue" facts=${facts} nav=${nav} dispatch=${dispatch}/></${Fragment}>`; };
  roots.exposure = ({ f, nav, dispatch, facts })=>{ const e = M.exposure(M.cases(f));
    return html`<${Fragment}><${Head} id="exposure" f=${f}><${P.Stat} label="Disputed" value=${cr(e.disputed)} sub=${e.disN+(e.disN===1?' case':' cases')+': separate measure'} tone="aside"/>
      <${P.Stat} label="Confirmed loss" value=${cr(e.loss)} sub=${e.lossN+(e.lossN===1?' case':' cases')+' validated under policy'} tone="aside"/><${P.Stat} label="Control value" value=${cr(e.control)} sub=${e.controlN+' credit and cut-off cases: shown beside, never added'} tone="aside"/></${Head}>
      <${Breakdown} id="exposure" facts=${facts} nav=${nav} dispatch=${dispatch} title="Potential exposure by" sub="Estimated value of open and under-investigation cases."/>
      <${P.Records} id="exposure" facts=${facts} onOpen=${(x)=> dispatch({ t:'drill', node:N.case(x.rec.id) })} title="Open cases"/></${Fragment}>`; };
  roots.riskmix = ({ f, nav, dispatch, facts })=>{
    const top = M.nav.top(nav), mode = top.mode || 'count', tot = facts.length, sp = M.sum(facts, x=>x.spend||0);
    const rows = C.risk.cats.map(c=>{ const fs = facts.filter(x=>x.g.risk===c.id), s = M.sum(fs, x=>x.spend||0); return { key:c.id, n:fs.length, spend:s, val: mode==='revenue'? s : fs.length, share: mode==='revenue'? (sp? s/sp*100 : 0) : (tot? fs.length/tot*100 : 0) }; });
    const sel = nav.sel && nav.sel.dim==='risk'? nav.sel.key : null, rr = facts.filter(x=> M.risk(x.v).rereview);
    return html`<${Fragment}><${Head} id="riskmix" f=${f}><${P.Stat} label="High or Critical" value=${FCT.n(rows[0].n+rows[1].n)} sub=${pct(sp? (rows[0].spend+rows[1].spend)/sp*100 : null)+' of open AR'}/>
      <${P.Stat} label="Re-review proposed" value=${FCT.n(rr.length)} sub="Model score differs from approved category"/></${Head}>
      <div class="px-grid g-2"><${P.Card} title="Customer Risk Mix" sub=${mode==='revenue'? 'Share of open AR (denominator: '+cr(sp)+')' : 'Count of active customers (denominator: '+tot+')'}
          right=${html`<${P.Seg} label="Measure" value=${mode} onChange=${(m)=> dispatch({ t:'node', v:{ mode:m } })} options=${[['count','Customer count'],['revenue','AR']]}/>`}>
          <${P.Donut} rows=${rows} mode=${mode} sel=${sel} onSelect=${(k)=> dispatch({ t:'sel', v:{ key:k, dim:'risk' } })} onOpen=${(k)=> dispatch({ t:'drill', node:N.group('risk', k) })}
            centre=${html`<b>${mode==='revenue'? cr(sp,0) : tot}</b><span>${mode==='revenue'? 'revenue' : 'customers'}</span>`}/>
          <div class="px-legend">${rows.map(r=> html`<button key=${r.key} type="button" class=${cx(sel===r.key && 'on')} onClick=${()=> dispatch({ t:'sel', v:{ key:r.key, dim:'risk' } })} onDoubleClick=${()=> dispatch({ t:'drill', node:N.group('risk', r.key) })}>
            <i style=${{background:P.RISK[r.key]}}/>${r.key}<b class="num">${mode==='revenue'? cr(r.spend) : r.n}</b><span class="faint">${pct(r.share,0)}</span></button>`)}</div></${P.Card}>
        <${P.Card} title=${sel? sel+' customers' : 'Category definitions'} right=${sel && html`<button type="button" class="btn sm primary" onClick=${()=> dispatch({ t:'drill', node:N.group('risk', sel) })}>Drill in<${Icon} n="ChevronRight" size=${14}/></button>`}>
          ${sel? html`<p class="px-p">${C.risk.defs[sel]}</p>${facts.filter(x=>x.g.risk===sel).sort((a,b)=> M.risk(b.v).score-M.risk(a.v).score).slice(0,8).map(x=> html`<button key=${x.v} type="button" class="px-vrow" onClick=${()=> dispatch({ t:'drill', node:N.customer(x.v) })}><span>${x.rec.name}</span><span class="num">${M.risk(x.v).score} · ${cr(x.spend||0)}</span></button>`)}`
            : html`<dl class="px-defs">${C.risk.cats.map(c=> html`<div key=${c.id}><dt><${P.RiskTag} cat=${c.id}/></dt><dd>${C.risk.defs[c.id]}</dd></div>`)}</dl>`}</${P.Card}></div>
      ${rr.length>0 && html`<${P.Records} id="riskmix" facts=${rr} onOpen=${(x)=> dispatch({ t:'drill', node:N.customer(x.v) })} title="Re-review proposed"/>`}</${Fragment}>`;
  };
  roots.topc = ({ f, nav, dispatch, facts })=>{ const tv = M.topCustomers(f), sel = nav.sel && (nav.sel.dim==='customer'||nav.sel.dim==='vendor')? nav.sel.key : null;
    const rows = facts.slice(0,10).map(x=>({ key:x.v, label:x.rec.name, val:x.val, sub:pct(x.share)+' of AR · '+M.risk(x.v).approved, tone: sel===x.v? COL.brass : P.RISK[M.risk(x.v).approved] }));
    const others = facts.slice(10); if(others.length) rows.push({ key:'__others', label:'Others ('+others.length+' customers)', val:M.sum(others,x=>x.val), sub:pct(M.sum(others,x=>x.share))+' of AR', tone:COL.fade });
    return html`<${Fragment}><${Head} id="topc" f=${f}><${P.Stat} label="Top 10 share" value=${pct(tv.top10)}/><${P.Stat} label="Open Receivables" value=${cr(tv.total)} sub="Denominator"/>
      <${P.Stat} label="Largest customer" value=${facts[0]? facts[0].rec.name : 'N/A'} sub=${facts[0]? pct(facts[0].share)+' of AR' : ''}/></${Head}>
      <div class="px-grid"><${P.Card} title="Top Customers by AR" sub="Ranked by open receivables; bar colour is approved risk category">
        <${P.BarList} rows=${rows} label="Top customers by AR" sel=${sel} onSelect=${(r)=> r.key!=='__others' && dispatch({ t:'sel', v:{ key:r.key, dim:'vendor' } })} onOpen=${(r)=> r.key!=='__others' && dispatch({ t:'drill', node:N.customer(r.key) })}/></${P.Card}>
        ${sel && html`<${P.Card} title="Selection" className="px-selcard"><${CustomerMini} id=${sel} f=${f} onOpen=${()=> dispatch({ t:'drill', node:N.customer(sel) })}/></${P.Card}>`}</div></${Fragment}>`; };
  const CustomerMini = ({ id, f, onOpen })=>{ const p = M.customer(id, f), rk = p.rk;
    return html`<div class="px-seld"><div class="hd"><b>${p.v.name}</b><button type="button" class="btn sm primary" onClick=${onOpen}>Drill in<${Icon} n="ChevronRight" size=${14}/></button></div>
      <div class="px-kv"><div><span>Risk</span><b><${P.RiskTag} cat=${rk.approved} score=${rk.score} small=${true}/></b></div><div><span>Six-month billed</span><b>${cr(p.total)}</b></div><div><span>Open AR</span><b>${cr(p.odVal + (p.unpaid? M.sum(p.unpaid.filter(l=> l.due>=M.SNAP), l=>l.amt) : 0))}</b></div></div>
      <div style=${{height:90}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${C.months.map((m,i)=>({ m:m.slice(0,3), v:+p.byM[i].toFixed(2) }))} margin=${{top:6,right:4,left:-22,bottom:0}}>
        <${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${40}/><${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=>cr(v) })}/><${R.Bar} dataKey="v" name="Billed revenue" fill=${COL.brand2} radius=${[2,2,0,0]}/></${R.BarChart}></${R.ResponsiveContainer}></div></div>`; };
  const rateRoot = (id, statsFn, extra)=> ({ f, nav, dispatch, facts })=>{ const k = M.kpi(id, f);
    return html`<${Fragment}><${Head} id=${id} f=${f}>${statsFn(k, facts, f)}</${Head}>
      <div class="px-grid g-2"><${P.Card} title=${M.KPI[id].name+' by month'} sub="Target line in brass; selected period highlighted. Months with no eligible records are gaps, not zero."><${P.Trend} id=${id} f=${f}/></${P.Card}>${extra? extra(k, facts, f, dispatch) : html`<div/>`}</div>
      <${Breakdown} id=${id} facts=${facts} nav=${nav} dispatch=${dispatch}/></${Fragment}>`; };
  roots.cash = rateRoot('cash', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="Receipts loaded in the period"/><${P.Stat} label="Not matched" value=${FCT.n(k.bad)} sub="On-account or low confidence"/>`,
    (k, facts)=>{ const st = M.group(facts, (x)=>x.g.status); return html`<${P.Card} title="How receipts were applied" sub="Count of receipts in the period"><div class="px-split col">${st.map(r=> html`<div key=${r.key}><span>${r.key}</span><b class="num">${FCT.n(r.n)}</b><small>${cr(r.val)}</small></div>`)}</div></${P.Card}>`; });
  /* ---------- credit limit utilisation (credit-control view) ----------
     Used = open AR + open sales orders against the approved limit, as at the snapshot. Bands: over limit, about to exceed (90–100%),
     within, no limit. Shown on the Credit policy KPI and, for one customer, on the Customer Profile. */
  const BAND = {}; M.CREDIT_BANDS.forEach(b=> BAND[b.id] = b);
  const bandCol = { over:'var(--crit)', near:'var(--med)', ok:'var(--pos)', none:'var(--ink-3)' };
  const UtilBar = ({ util, w })=>{ const u = util==null? 0 : Math.min(util, 130), sc = (x)=> x/130*100;
    return html`<span class="px-ubar" style=${w? {width:w} : null} role="img" aria-label=${util==null? 'No limit' : pct(util,0)+' of limit used'}>
      <i style=${{ width:sc(u)+'%', background:bandCol[M.creditBand(util)] }}/><span class="mk" style=${{ left:sc(90)+'%' }} title="90%: about to exceed"/><span class="mk l" style=${{ left:sc(100)+'%' }} title="100%: limit"/></span>`; };
  const riskTone = (v)=> v==null? 'var(--ink-3)' : v>=40? 'var(--crit)' : v>=20? 'var(--med)' : 'var(--pos)';
  /* % credit risk: share of used credit sitting with customers over or about to exceed their limit */
  const RiskGauge = ({ v })=> html`<div class="px-cgauge" title="Share of credit in use that sits with customers over or about to exceed their limit">
    <span class="l">Credit at risk</span><b class="num" style=${{color:riskTone(v)}}>${pct(v,0)}</b>
    <span class="tr" role="img" aria-label=${pct(v,0)+' of credit in use is at risk'}><i style=${{ width:Math.min(100, v||0)+'%', background:riskTone(v) }}/></span>
    <span class="ax"><span>0</span><span>50</span><span>100</span></span><small>of credit in use is with customers at or near their limit</small></div>`;
  const dd = (t)=> M.date(t).replace(/-\d{2}$/, ''), crAx = (v)=> (v<0? '−' : '')+cr(Math.abs(v), Math.abs(v)<10? 1 : 0);
  const catName = {}; C.cats.forEach(c=> catName[c.id] = c.name);
  /* daily used credit against the limit (bars red on breach days) and the limit as a step line */
  const CreditTrend = ({ H, height=190 })=>{ const rm = P.useRM();
    const d = H.days.map(x=> ({ t:dd(x.t), used:+x.used.toFixed(2), limit:x.limit!=null? +x.limit.toFixed(2) : null, over:x.over }));
    return html`<div style=${{height}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.ComposedChart} data=${d} margin=${{top:6,right:6,left:0,bottom:0}}>
      <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="t" ...${P.axis} interval=${9} minTickGap=${8}/><${R.YAxis} ...${P.axis} width=${62} tickFormatter=${crAx}/>
      <${R.Tooltip} cursor=${{fill:'rgba(127,127,127,.08)'}} content=${h(P.Tip,{ fmt:(v)=> cr(v) })}/>
      <${R.Bar} dataKey="used" name="Credit used" maxBarSize=${9} isAnimationActive=${!rm}>${d.map((x,i)=> h(R.Cell, { key:i, fill:x.over? 'var(--crit)' : COL.brand2 }))}</${R.Bar}>
      <${R.Line} type="stepAfter" dataKey="limit" name="Credit limit" stroke=${COL.brass} strokeWidth=${2} strokeDasharray="5 4" dot=${false} isAnimationActive=${!rm}/></${R.ComposedChart}></${R.ResponsiveContainer}></div>`; };
  /* weekly consumption: orders taken use the limit (down), payments free it (up), limit changes, closing available as a line */
  const CreditFlow = ({ H, height=190 })=>{ const rm = P.useRM();
    const d = H.weeks.map(w=> ({ t:'w/c '+dd(w.from), so:-+w.so.toFixed(2), pay:+w.pay.toFixed(2), lim:w.lim? +w.lim.toFixed(2) : null, avail:w.close!=null? +w.close.toFixed(2) : null }));
    return html`<div style=${{height}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.ComposedChart} data=${d} margin=${{top:6,right:6,left:0,bottom:0}} stackOffset="sign">
      <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="t" ...${P.axis} interval=${0} tick=${{fontSize:10, fill:COL.ink3}}/><${R.YAxis} ...${P.axis} width=${62} tickFormatter=${crAx}/>
      <${R.ReferenceLine} y=${0} stroke=${COL.line}/>
      <${R.Tooltip} cursor=${{fill:'rgba(127,127,127,.08)'}} content=${h(P.Tip,{ fmt:(v)=> (v<0? '−' : '')+cr(Math.abs(v)) })}/>
      <${R.Legend} wrapperStyle=${{fontSize:11}} iconSize=${9}/>
      <${R.Bar} dataKey="so" name="Orders taken" fill="var(--crit)" maxBarSize=${16} isAnimationActive=${!rm}/>
      <${R.Bar} dataKey="pay" name="Payments received" fill="var(--pos)" maxBarSize=${16} isAnimationActive=${!rm}/>
      <${R.Bar} dataKey="lim" name="Credit limit change" fill=${COL.brass} maxBarSize=${16} isAnimationActive=${!rm}/>
      <${R.Line} type="monotone" dataKey="avail" name="Credit available at week end" stroke=${COL.brand} strokeWidth=${2} dot=${{r:3}} isAnimationActive=${!rm}/></${R.ComposedChart}></${R.ResponsiveContainer}></div>`; };
  /* limit changes by date: increase requested and increase granted (0 when declined) */
  const ChangeTimeline = ({ changes, dispatch })=>{ const rm = P.useRM(), byDay = {};
    changes.forEach(c=>{ const k = Math.floor(c.at), x = byDay[k] = byDay[k] || { k, t:dd(c.at), req:0, got:0, n:0, v:c.v }; x.req += (c.req||c.old) - c.old; x.got += c.newL - c.old; x.n++; });
    const d = Object.values(byDay).sort((a,b)=> a.k-b.k).map(x=> ({ t:x.t, req:+x.req.toFixed(2), got:+x.got.toFixed(2), v:x.v, n:x.n }));
    return html`<div style=${{height:330}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.LineChart} data=${d} margin=${{top:8,right:8,left:0,bottom:0}}
        onClick=${(e)=>{ const x = e && e.activePayload && e.activePayload[0] && e.activePayload[0].payload; if(x && x.n===1) dispatch({ t:'drill', node:N.profile(x.v) }); }}>
      <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="t" ...${P.axis} minTickGap=${10}/><${R.YAxis} ...${P.axis} width=${62} tickFormatter=${crAx}/>
      <${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=> cr(v) })}/><${R.Legend} wrapperStyle=${{fontSize:11}} iconSize=${9}/>
      <${R.Line} type="linear" dataKey="req" name="Increase requested" stroke=${COL.ink3} strokeDasharray="4 3" dot=${{r:3}} isAnimationActive=${!rm}/>
      <${R.Line} type="linear" dataKey="got" name="Increase granted" stroke=${COL.brand2} strokeWidth=${2} dot=${{r:4, cursor:'pointer'}} isAnimationActive=${!rm}/></${R.LineChart}></${R.ResponsiveContainer}></div>`; };
  P.CreditBook = ({ f, dispatch })=>{
    const B = M.creditBook(f), [band, setBand] = useState(null), [seg, setSeg] = useState(null), [allCh, setAllCh] = useState(false), [who, setWho] = useState(null);
    const rows = B.rows.filter(r=> (!band || r.band===band) && (!seg || r.seg===seg)).sort((a,b)=> (b.util??-1) - (a.util??-1));
    const cnt = (id)=> B.rows.filter(r=> r.band===id && (!seg || r.seg===seg)).length;
    const pick = (b, sg)=>{ setBand(band===b && seg===sg? null : b); setSeg(band===b && seg===sg? null : sg); };
    const tiles = [
      ['Orders on over-limit customers', B.risky.ordOver, (x)=> x.rem, 'Open sales orders for customers already over limit', 'crit'],
      ['Orders on credit hold', B.risky.held, (x)=> x.rem, 'Blocked at the credit check, waiting for a decision', 'med'],
      ['Shipped, not invoiced', B.risky.unbilled, (x)=> x.val, 'Control passed at 30-Sep with no invoice; adds to exposure once billed', 'med'],
      ['Overdue on over-limit customers', B.risky.unpaidOver, (x)=> x.amt, 'Invoiced and past due while the customer is over limit', 'crit'] ];
    const totOver = B.tot.over, segOver = B.bySeg.filter(r=> r.over>0).sort((a,b)=> b.over-a.over);
    const top = rows[0], nOver = B.rows.filter(r=> r.band==='over').length, nNear = B.rows.filter(r=> r.band==='near').length;
    const changes = B.changes.slice().sort((a,b)=> b.at-a.at);
    const pickable = B.rows.filter(r=> r.limit).sort((a,b)=> (b.util??-1) - (a.util??-1)), cur = (who && pickable.find(r=> r.v===who)) || rows.find(r=> r.limit) || pickable[0], H = cur && M.creditHist(cur.v);
    const sos = B.orders.filter(o=> (!band || o.band===band) && (!seg || o.seg===seg)).sort((a,b)=> (b.util??-1) - (a.util??-1) || b.soD-a.soD);
    const chMax = Math.max(...changes.map(c=> Math.max(c.old, c.req||0, c.newL)), 0.01);
    return html`<${Fragment}>
      <${P.Card} title="Credit limit utilisation" sub=${'Open AR plus open sales orders against the approved limit, as at '+C.snapLabel+'. Not a period measure, so it does not change with the period filter.'}
        right=${html`<${Pill} tone="r">${nOver} over limit</${Pill}><${Pill} tone="a">${nNear} about to exceed</${Pill}><${Pill}>${pct(B.tot.util,0)} of total limits used</${Pill}>`}>
        <div class="px-crisk"><${RiskGauge} v=${B.tot.risk}/>${tiles.map(([l, xs, val, d, t])=> html`<div key=${l} class=${'px-crisk-t '+(xs.length? t : '')} title=${d}><span class="l">${l}</span><b class="num">${FCT.n(xs.length)}</b><small>${xs.length? cr(M.sum(xs, val)) : 'None'}</small></div>`)}</div>
        <${AI}>${nOver? nOver+' customers are over their limit by '+cr(totOver)+' in total'+(segOver[0]? '; '+segOver[0].seg.toLowerCase()+' customers carry '+pct(segOver[0].over/totOver*100,0)+' of it' : '')+'. '+(top && top.util>100? top.name+' is the furthest over at '+pct(top.util,0)+' of a '+cr(top.limit)+' limit.' : '') : 'No customer is over its limit.'}</${AI}>
        <div class="px-grid g-2" style=${{marginTop:'12px'}}>
          <div><div class="px-cu-h">Limit status by segment <span class="faint">select a band to list the customers</span></div>
            <div class="px-cu-seg">${B.bySeg.map(r=> html`<div key=${r.seg} class="row"><span class="n">${r.seg}<small>${r.n}</small></span><span class="bar">${M.CREDIT_BANDS.map(b=>{ const k = r.bands[b.id].length; return k? html`<button key=${b.id} type="button" class=${cx(band===b.id && seg===r.seg && 'on')} style=${{ flex:k, background:bandCol[b.id] }} title=${r.seg+' · '+b.name+': '+k} onClick=${()=> pick(b.id, r.seg)}>${k}</button>` : null; })}</span></div>`)}</div>
            <div class="px-cu-lg">${M.CREDIT_BANDS.filter(b=> B.rows.some(r=> r.band===b.id)).map(b=> html`<button key=${b.id} type="button" class=${cx(band===b.id && !seg && 'on')} onClick=${()=> pick(b.id, null)}><i style=${{background:bandCol[b.id]}}/>${b.name}<b class="num">${cnt(b.id)}</b></button>`)}</div></div>
          <div><div class="px-cu-h">Amount over limit by segment <span class="faint">share of the ${cr(totOver)} above approved limits</span></div>
            ${segOver.length? html`<${P.BarList} rows=${segOver.map(r=> ({ key:r.seg, label:r.seg, val:r.over, tone:'var(--crit)', sub:pct(r.over/totOver*100,0)+' · '+r.bands.over.length+' over limit · '+pct(r.limit? r.used/r.limit*100 : null,0)+' of segment limits used' }))} label="Over limit" fmt=${(v)=> cr(v)} sel=${seg} onSelect=${(r)=> pick('over', r.key)}/>` : html`<${P.Empty} text="Nothing is above an approved limit."/>`}</div></div></${P.Card}>
      <${P.Card} title=${(band? BAND[band].name : 'All customers')+(seg? ' · '+seg : '')} sub="Sorted by utilisation. The bar marks 90% (about to exceed) and 100% (the limit). Open a row for the Customer Profile."
        right=${(band || seg) && html`<button type="button" class="px-link sm" onClick=${()=>{ setBand(null); setSeg(null); }}>Show all ${B.rows.length}</button>`}>
        <${P.Table} rows=${rows} rowKey=${(r)=> r.v} caption="Credit utilisation by customer" rowClick=${true} dense=${true} limit=${15}
          onOpen=${(r)=> dispatch({ t:'drill', node:N.profile(r.v) })}
          cols=${[{ k:'name', l:'Customer', fmt:(r)=> html`<b>${r.name}</b><div class="sub">${r.v} · ${r.seg}</div>` },
            { k:'limit', l:'Limit', r:true, fmt:(r)=> r.limit? cr(r.limit) : '—', sv:(r)=> r.limit||0 },
            { k:'ar', l:'Open AR', r:true, fmt:(r)=> cr(r.ar), sv:(r)=> r.ar }, { k:'ord', l:'Open orders', r:true, fmt:(r)=> r.ord? cr(r.ord) : '—', sv:(r)=> r.ord },
            { k:'avail', l:'Available', r:true, fmt:(r)=> r.avail==null? '—' : html`<span class=${r.avail<0? 'px-bad' : ''}>${r.avail<0? '−'+cr(-r.avail) : cr(r.avail)}</span>`, sv:(r)=> r.avail ?? -1e9 },
            { k:'util', l:'Utilisation', fmt:(r)=> html`<span class="px-cu-u"><${UtilBar} util=${r.util}/><b class="num">${r.util==null? '—' : pct(r.util,0)}</b></span>`, sv:(r)=> r.util ?? -1 },
            { k:'band', l:'Status', fmt:(r)=> html`<${Pill} tone=${{over:'r',near:'a',ok:'g',none:'n'}[r.band]}>${BAND[r.band].name}</${Pill}>`, sv:(r)=> ['none','ok','near','over'].indexOf(r.band) }]}/></${P.Card}>
      ${H && html`<${P.Card} title=${'Credit history · '+cur.name} sub=${'Last '+M.CREDIT_DAYS+' days. Today\'s figures are exact; earlier days are reconstructed from order and payment flows and are illustrative.'}
        right=${html`<${P.Pick} label="Customer" value=${cur.v} options=${pickable.map(r=> [r.v, r.name+' · '+pct(r.util,0)])} onChange=${setWho}/><button type="button" class="px-link sm" onClick=${()=> dispatch({ t:'drill', node:N.profile(cur.v) })}>Open profile</button>`}>
        <div class="px-grid g-2">
          <div><div class="px-cu-h">Credit validity trend <span class="faint">${H.breachDays? H.breachDays+' of '+(M.CREDIT_DAYS+1)+' days over limit' : 'never over limit in the window'}</span></div><${CreditTrend} H=${H}/>
            <div class="px-cu-lg static"><span><i style=${{background:COL.brand2}}/>Used</span><span><i style=${{background:'var(--crit)'}}/>Used, over limit</span><span><i class="dash" style=${{borderColor:COL.brass}}/>Credit limit</span></div></div>
          <div><div class="px-cu-h">Credit limit consumption by week <span class="faint">orders use the limit, payments free it</span></div><${CreditFlow} H=${H}/></div></div></${P.Card}>`}
      <div class="px-grid g-2"><${P.Card} title="Change in credit limit by customer" sub="Limit before, amount requested and the limit now in force. Declined requests keep the old limit. Open a row for the profile.">
        ${changes.length? html`<div class="px-lchg">${(allCh? changes : changes.slice(0,6)).map(c=> html`<button key=${c.id} type="button" class="row" onClick=${()=> dispatch({ t:'drill', node:N.profile(c.v) })} title=${c.id}>
          <span class="n">${c.name}<small>${c.v} · ${M.date(c.at)}</small></span>
          <span class="bars"><span><i class="old" style=${{ width:(c.old/chMax*100)+'%' }}/><em>Before ${cr(c.old)}</em></span><span><i class="req" style=${{ width:((c.req||0)/chMax*100)+'%' }}/><em>Requested ${cr(c.req||0)}</em></span><span><i class=${c.approved? 'new' : 'kept'} style=${{ width:(c.newL/chMax*100)+'%' }}/><em>Now ${cr(c.newL)}</em></span></span>
          <${Pill} tone=${c.approved? 'g' : 'r'}>${c.approved? (c.auto? 'Auto-approved' : 'Approved') : 'Declined'}</${Pill}></button>`)}</div>
          ${changes.length>6 && html`<button type="button" class="px-link sm" onClick=${()=> setAllCh(!allCh)}>${allCh? 'Show latest 6' : 'Show all '+changes.length}</button>`}` : html`<${P.Empty} text="No limit changes for these filters."/>`}</${P.Card}>
      <${P.Card} title="Change in credit limit by date" sub="Total increase requested and granted on each day. Select a single-customer point to open its profile.">
        ${changes.length? html`<${ChangeTimeline} changes=${changes} dispatch=${dispatch}/>` : html`<${P.Empty} text="No limit changes for these filters."/>`}</${P.Card}></div>
      <${P.Card} title=${'Open sales orders'+(band? ' · '+BAND[band].name : '')+(seg? ' · '+seg : '')} sub="Every open order with the customer's credit position. Follows the band and segment selected above. Open a row for the profile."
        right=${html`<${Pill}>${FCT.n(sos.length)} orders · ${cr(M.sum(sos, (o)=> o.rem||o.val))}</${Pill}>`}>
        <${P.Table} rows=${sos} rowKey=${(o)=> o.id} caption="Open sales orders and credit position" rowClick=${true} dense=${true} limit=${12}
          onOpen=${(o)=> dispatch({ t:'drill', node:N.profile(o.v) })}
          cols=${[{ k:'id', l:'Sales order', fmt:(o)=> html`<b>${o.id}</b><div class="sub">${M.date(o.soD)} · ${o.e}</div>`, sv:(o)=> o.soD },
            { k:'name', l:'Customer', fmt:(o)=> html`${o.name}<div class="sub">${o.v} · ${o.seg}</div>` },
            { k:'cat', l:'Category', fmt:(o)=> catName[o.cat] || o.cat },
            { k:'rem', l:'Open value', r:true, fmt:(o)=> cr(o.rem||o.val), sv:(o)=> o.rem||o.val },
            { k:'chk', l:'Credit check', fmt:(o)=> html`<${Pill} tone=${o.crdHold? 'a' : 'g'}>${o.crdHold? 'On hold' : 'Released'}</${Pill}>${o.reason && o.reason!=='Released' && html`<div class="sub">${o.reason}</div>`}`, sv:(o)=> o.crdHold? 1 : 0 },
            { k:'util', l:'Customer utilisation', fmt:(o)=> html`<span class="px-cu-u"><${UtilBar} util=${o.util}/><b class="num">${o.util==null? '—' : pct(o.util,0)}</b></span>`, sv:(o)=> o.util ?? -1 },
            { k:'avail', l:'Available', r:true, fmt:(o)=> o.avail==null? '—' : html`<span class=${o.avail<0? 'px-bad' : ''}>${o.avail<0? '−'+cr(-o.avail) : cr(o.avail)}</span>`, sv:(o)=> o.avail ?? -1e9 }]}/></${P.Card}></${Fragment}>`;
  };
  P.CreditCard = ({ id })=>{ const c = M.credit(id), H = M.creditHist(id); if(!c.limit) return html`<${P.Card} title="Credit utilisation"><${P.Empty} text="No credit limit is set for this customer."/></${P.Card}>`;
    const nd = M.vlines(id).filter(l=> M.unpaid(l) && l.due>=M.SNAP).reduce((a,l)=> a+l.amt, 0), od = c.ar - nd, scale = Math.max(c.limit, c.used);
    const parts = [['Not yet due', nd, 'var(--brand2,#4FB3A3)'], ['Overdue', od, 'var(--med)'], ['Open orders', c.ord, 'var(--ink-3)']].filter(x=> x[1]>0.0001);
    return html`<${P.Card} title="Credit utilisation" sub=${'Open AR plus open orders against the approved limit, as at '+C.snapLabel+'.'} right=${html`<${Pill} tone=${{over:'r',near:'a',ok:'g',none:'n'}[c.band]}>${BAND[c.band].name}</${Pill}>`}>
      <div class="px-cu-big"><b class="num">${pct(c.util,0)}</b><span>of ${cr(c.limit)} used</span><${UtilBar} util=${c.util}/></div>
      <div class="px-cu-stack" role="img" aria-label="Limit consumption">${parts.map(([l,v,col])=> html`<i key=${l} style=${{ width:(v/scale*100)+'%', background:col }} title=${l+': '+cr(v)}/>`)}<span class="mk" style=${{ left:(c.limit/scale*100)+'%' }} title=${'Limit '+cr(c.limit)}/></div>
      <div class="px-kv">${parts.map(([l,v,col])=> html`<div key=${l}><span><i class="px-sw" style=${{background:col}}/>${l}</span><b>${cr(v)}</b></div>`)}
        <div><span>${c.avail<0? 'Over limit by' : 'Available'}</span><b class=${c.avail<0? 'px-bad' : ''}>${cr(Math.abs(c.avail))}</b></div>
        ${c.req && html`<div><span>Limit requested</span><b>${cr(c.req)}</b></div>`}</div>
      ${H && html`<div class="px-cu-h" style=${{marginTop:'12px'}}>Last ${M.CREDIT_DAYS} days <span class="faint">${H.breachDays? H.breachDays+' days over limit · ' : ''}earlier days illustrative</span></div><${CreditTrend} H=${H} height=${150}/>`}
      ${c.changes.length>0 && html`<div class="px-cu-ch">${c.changes.map(ch=> html`<div key=${ch.id}><span>${ch.id}</span><span>${cr(ch.old)} → requested ${cr(ch.req)}</span><${Pill} tone=${ch.approved? 'g' : 'r'}>${ch.approved? 'Approved at '+cr(ch.newL) : 'Declined'}</${Pill}></div>`)}</div>`}</${P.Card}>`; };
  const creditRoot = rateRoot('credit', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="Credit decisions in the period"/><${P.Stat} label="Outside policy" value=${FCT.n(k.bad)} sub="Limit, terms or security exceptions"/>`,
    (k, facts)=>{ const by = M.group(facts, (x)=>x.g.kind); return html`<${P.Card} title="By decision type" sub="Limit changes, holds and new accounts"><div class="px-split col">${by.map(r=> html`<div key=${r.key}><span>${r.key}</span><b class="num">${FCT.n(r.n)}</b><small>${FCT.n(r.bad)} outside policy</small></div>`)}</div></${P.Card}>`; });
  roots.credit = (props)=> html`<${Fragment}><${creditRoot} ...${props}/><${P.CreditBook} f=${props.f} dispatch=${props.dispatch}/></${Fragment}>`;
  roots.ptp = rateRoot('ptp', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="Promises due in the period"/><${P.Stat} label="Broken" value=${FCT.n(k.bad)}/>`,
    (k, facts)=>{ const by = M.group(facts, (x)=>x.g.status); return html`<${P.Card} title="Promises in the period"><div class="px-split col">${by.map(r=> html`<div key=${r.key}><span>${r.key}</span><b class="num">${FCT.n(r.n)}</b><small>${cr(r.val)}</small></div>`)}</div></${P.Card}>`; });
  roots.billing = rateRoot('billing', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="Dispatches where control passed"/><${P.Stat} label="Late or unbilled" value=${FCT.n(k.bad)}/>
    <${P.Stat} label="Unbilled at cut-off" value=${cr(k.unbilled)} sub="Control passed, no invoice" tone="aside"/>`,
    (k, facts, f)=>{ const ub = (M.X.unbilled||[]).filter(u=> M.recOk(f,u.v,u.e));
      return html`<${P.Card} title="Shipped, not invoiced" sub="Snapshot at 30-Sep. In-transit DAP/DDP is excluded from the late rate."><div class="px-split col">${['Recognise','Exclude'].map(d=>{ const xs = ub.filter(x=>x.decide===d); return xs.length? html`<div key=${d}><span>${d}</span><b class="num">${xs.length} dispatches</b><small>${cr(M.sum(xs, x=> x.val))}</small></div>` : null; })}</div>
</${P.Card}>`; });
  /* control-tower theme: subthemes are the first drill level, each a pass/fail check with its own basis */
  const themeRoot = (id)=> ({ f, nav, dispatch, facts })=>{ const k = M.kpi(id, f), t = M.THEME[id];
    const hc = C.health.find(h=> h.kpi===id) || {};
    return html`<${Fragment}><${Head} id=${id} f=${f}><${P.Stat} label="Checks" value=${FCT.n(k.n)} sub=${'O2C steps: '+t.steps}/><${P.Stat} label="Failed" value=${FCT.n(k.bad)}/>
        <${P.Stat} label="Subthemes with data" value=${(k.subs||[]).filter(x=> x.rate!=null).length+' of '+t.subs.length} sub=${'Health weight '+hc.w+' · floor '+hc.floor+'% · target '+hc.target+'%'}/></${Head}>
      <${P.Card} title="Subthemes" sub="Theme value = average of these pass rates. Select one to drill into segment, business unit, customer and the failing records.">
        <div class="px-comps" role="list">${k.subs.map(x=>{ const sb = M.SUB[x.id], go = ()=> dispatch({ t:'drill', node:N.group('sub', x.name) });
          return html`<div key=${x.id} role="listitem" class="px-comp" onDoubleClick=${go}>
            <button type="button" class="b" onClick=${go} title=${sb.desc+' '+sb.test}>
              <span class="n">${x.name}<small>${sb.basis} · ${sb.test}</small></span><span class="v num">${x.rate==null? 'N/A' : pct(x.rate)}</span>
              <span class="trk"><i style=${{ width:(x.rate||0)+'%', background:scoreTone(x.rate==null? null : (x.rate-hc.floor)/(hc.target-hc.floor)*100) }}/></span>
              <span class="p num">${x.n? FCT.n(x.bad)+' of '+FCT.n(x.n) : 'no data'}<small>${x.bad? ' · '+amt(x.badVal) : ''}</small></span></button>
            <button type="button" class="px-drill" aria-label=${'Drill in to '+x.name} onClick=${go}><${Icon} n="ChevronRight" size=${14}/></button></div>`; })}</div></${P.Card}>
      <div class="px-grid g-2"><${P.Card} title=${M.KPI[id].name+' by month'} sub="Earlier months are shown only when they cover the same subthemes as the current period.">${(k.series||[]).filter(v=> v!=null).length>1? html`<${P.Trend} id=${id} f=${f}/>` : html`<p class="faint">No comparable history: this theme includes snapshot subthemes that only exist at the book date, so earlier months are not scored.</p>`}</${P.Card}>
        <${P.Card} title="What it covers"><p class="faint">${M.KPI[id].formula}</p><p class="faint">${M.KPI[id].excl}</p></${P.Card}></div>
      <${Breakdown} id=${id} facts=${facts} nav=${nav} dispatch=${dispatch}/></${Fragment}>`; };
  (C.themes||[]).forEach(t=> roots[t.id] = themeRoot(t.id));
  roots.coll = rateRoot('coll', (k)=> html`<${P.Stat} label="Denominator" value=${FCT.n(k.n)} sub="Overdue targeted at period start"/><${P.Stat} label="Not collected" value=${FCT.n(k.bad)}/>`,
    (k, facts, f, dispatch)=> html`<${P.Card} title="Still overdue (separate)" sub="These remain open, so they are not collected."><div class="px-split col">${M.group(M.facts('overdue', f), (x)=>x.g.status).map(r=> html`<div key=${r.key}><span>${r.key}</span><b class="num">${FCT.n(r.n)}</b><small>${cr(r.val)}</small></div>`)}</div>
      <button type="button" class="px-link sm" onClick=${()=> dispatch({ t:'kpiJump', kpi:'overdue' })}>Open Overdue Receivables</button></${P.Card}>`);

  /* ---------- deeper views ---------- */
  const GroupView = ({ f, nav, dispatch, cx:ctx })=>{
    const top = M.nav.top(nav), id = ctx.eff, facts = ctx.facts, rate = M.isRate(id);
    if(id==='health') return html`<${P.Empty} text="Select a theme."/>`;
    const bad = facts.filter(x=> x.ok===false), used = ctx.groups.map(g=>g.dim);
    return html`<${Fragment}>
      <div class="px-head"><div class="big"><div class="v num">${rate? pct(facts.length? (facts.length-bad.length)/facts.length*100 : null) : cr(M.sum(facts,x=>x.val))}</div>
        <div class="m"><span class="faint">${M.KPI[id].name}${top.dim==='component'? ', '+(nav.kpi==='health'? 'a health component' : '') : ' for '+top.label.replace(/^[^:]+: /,'')}</span>${ctx.comp && html`<span class="px-tag">Health theme</span>`}</div>${(()=>{ const sg = ctx.groups.find(g=> g.dim==='sub'), sb = sg && Object.values(M.SUB).find(x=> x.name===sg.key); return sb? html`<p class="faint">${sb.desc} ${sb.test} <span class="px-tag">${sb.basis}</span></p>` : null; })()}</div>
        <div class="px-stats"><${P.Stat} label="Records" value=${FCT.n(facts.length)}/>${rate && html`<${P.Stat} label="Non-compliant" value=${FCT.n(bad.length)} sub=${amt(M.sum(bad,x=>x.val))}/>`}<${P.Stat} label="Customers" value=${FCT.n(new Set(facts.map(x=>x.v)).size)}/></div></div>
      ${facts.length===0? html`<${P.Empty}/>` : html`<${EX.Explore} id=${id} facts=${facts} exclude=${used} onDrill=${(d,k)=> dispatch({ t:'drill', node:N.group(d, k) })}
        renderRecords=${(fx, tags)=> html`${tags}${fx.length? html`<${P.Records} id=${id} facts=${fx} limit=${8} onOpen=${(x)=> dispatch({ t:'drill', node:N.rec(x) })}/>` : html`<${P.Empty} text="No records match these filters."/>`}`}/>`}</${Fragment}>`;
  };
  const CustomerInKpi = ({ f, nav, dispatch, cx:ctx })=>{
    const id = ctx.customer, k = ctx.eff, facts = ctx.facts, why = M.why(id, { kpi:k==='health'? null : k, f, groups:ctx.groups }), p = M.customer(id, f);
    const rate = M.isRate(k), bad = facts.filter(x=>x.ok===false);
    return html`<${Fragment}>
      <${P.Card} title=${'Why '+p.v.name+' surfaced'} right=${html`<button type="button" class="btn primary sm" onClick=${()=> dispatch({ t:'drill', node:N.profile(id) })}>Open full Customer Profile</button>`}>
        <ul class="px-why">${why.map((w,i)=> html`<li key=${i} class=${'w-'+w.t} title=${P.vt(w.text)}>${w.kpi && html`<b>${w.kpi}: </b>`}${P.vt(w.text)}</li>`)}</ul></${P.Card}>
      <div class="px-stats row"><${P.Stat} label=${M.KPI[k]? M.KPI[k].name+' records' : 'Records'} value=${FCT.n(facts.length)}/>${rate && html`<${P.Stat} label="Non-compliant" value=${FCT.n(bad.length)} sub=${amt(M.sum(bad,x=>x.val))}/>`}
        <${P.Stat} label="Six-month billed" value=${cr(p.total)} sub=${p.rank? 'Rank '+p.rank.rank+' · '+pct(p.rank.share)+' of open AR' : ''}/><${P.Stat} label="Open cases" value=${FCT.n(p.cases.filter(c=>M.statusMeasure(c.stNow)==='potential').length)}/></div>
      ${k==='riskmix'? html`<${RiskFactors} p=${p}/>` : facts.length? html`<${P.Records} id=${k} facts=${facts} onOpen=${(x)=> dispatch({ t:'drill', node:N.rec(x) })} title=${'Records for '+p.v.name}/>` : html`<${P.Empty} text="This customer has no records for this KPI under the current filters."/>`}</${Fragment}>`;
  };

  const RiskFactors = ({ p })=> html`<${P.Card} title="Risk factors" sub=${'Score = 60% worst factor + 40% weighted average of assessed factors'+(p.rk.coverage<1? ' (coverage '+pct(p.rk.coverage*100,0)+')' : '')}>
    <div class="px-factors">${p.rk.factors.map(x=> html`<div key=${x.id} class="px-factor"><span class="n">${x.name}<small>weight ${x.w}</small></span>
      <span class="trk"><i style=${{ width:(x.v||0)+'%', background: x.v>=80? COL.crit : x.v>=60? COL.high : x.v>=40? '#B08A1E' : COL.light }}/></span><span class="v num">${x.v==null? 'N/A' : x.v}</span>
      <span class="w">${x.why}<small> · ${x.src}</small></span></div>`)}</div>
    ${p.rk.esc && html`<div class="px-note"><${Icon} n="TriangleAlert" size=${14}/> ${p.rk.esc}.</div>`}
    <div class="px-note">Approved category <${P.RiskTag} cat=${p.rk.approved} small=${true}/> · model score ${p.rk.score} (${p.rk.model})${p.rk.rereview? ': re-review proposed' : ''}. Last review ${p.v.lastReview || '15-Sep-2026'}.</div></${P.Card}>`;

  /* ---------- Customer Profile (deep destination) ---------- */
  P.VendorProfile = P.CustomerProfile = ({ id, f, ctx, onDoc, onCase })=>{
    const p = M.customer(id, f), v = p.v, rk = p.rk, why = M.why(id, ctx);
    const [tab,setTab] = useState('docs');
    const dd = v.dd||{}, bank = v.bank;
    const st = p.stCount;
    return html`<div class="px-prof">
      <div class="px-id"><div><h2>${v.name}</h2><div class="faint">${v.id}${v.geo? ' · '+v.geo.city+', '+v.geo.region : ''} · ${M.CAT[v.cat].name} · ${v.bu} ${(M.BU[v.bu]||{}).name||''} · ${v.seg||''}${v.collector? ' · collector '+v.collector : ''} · ${v.status}${v.since? ' since '+v.since : ''}</div>
          <div class="tags"><${P.RiskTag} cat=${rk.approved} score=${rk.score}/>${rk.rereview && html`<span class="px-tag warn">Model suggests ${rk.model}: re-review</span>`}${v.foreign && html`<span class="px-tag">Export: ${v.foreign}</span>`}<span class="px-tag">Terms ${v.terms} days</span>${v.limit!=null && html`<span class="px-tag">Limit ${cr(v.limit)}</span>`}</div></div>
        <div class="px-idk"><${P.Stat} label="Six-month billed" value=${cr(p.total)} sub=${pct(p.catShare*100)+' of category'}/><${P.Stat} label="Open orders" value=${cr(p.opVal)} sub=${p.op.length+' sales orders'}/><${P.Stat} label="Overdue AR" value=${cr(p.odVal)} sub=${p.od.length+' invoices'}/></div></div>
      <div class="px-grid g-2">
        <${P.Card} title="Why this customer surfaced"><ul class="px-why">${why.map((w,i)=> html`<li key=${i} class=${'w-'+w.t} title=${P.vt(w.text)}>${w.kpi && html`<b>${w.kpi}: </b>`}${P.vt(w.text)}</li>`)}</ul>
          ${(v.ex||[]).length>0 && html`<div class="px-exs">${v.ex.map(e=>{ const x = FCT.ex(e); return x? html`<div key=${e} class="px-ex"><span><b>${e}</b> ${P.vt(x.title)}</span><${P.Decide} id=${e}/></div>` : null; })}</div>`}</${P.Card}>
        <${RiskFactors} p=${p}/></div>
      <${P.Card} title="Where in the O2C chain this customer causes issues" sub="Six months of invoices plus open sales orders. Each stage shows records with issues and the value they carry.">
        <ol class="px-flow compact">${p.stages.map((s,i)=> html`<li key=${s.id}><div class="px-stage static"><span class="sh"><b>${s.name}</b></span><span class="sv num">${FCT.n(s.n)}<small> records</small></span>
          <span class="sx">${amt(s.val)}</span><span class="st">${s.issues.slice(0,2).map(x=> M.issue(x.code).name+' ('+x.n+')').join('; ') || 'No issues'}</span></div>${i<5 && html`<span class="ar" aria-hidden="true">→</span>`}</li>`)}</ol>
        ${p.issues.length>0 && html`<table class="px-mini rec"><thead><tr><th>Issue</th><th>Stage</th>${C.months.map(m=> html`<th key=${m} class="r">${m.slice(0,3)}</th>`)}<th class="r">Records</th><th class="r">Value</th></tr></thead><tbody>
          ${p.issues.slice(0,10).map(r=> html`<tr key=${r.code}><td>${M.issue(r.code).name}</td><td class="faint">${M.stage(M.issue(r.code).stage).name}</td>${r.months.map((n,i)=> html`<td key=${i} class="r num" style=${{ background: n? P.heatColor(n, Math.max(...r.months)) : null, color: n && n/Math.max(...r.months)>.5? '#fff' : null }}>${n||''}</td>`)}<td class="r num">${r.n}</td><td class="r num">${amt(r.val)}</td></tr>`)}</tbody></table>
`}</${P.Card}>
      <div class="px-grid g-3">
        <${P.Card} title="Billed revenue by month"><div style=${{height:150}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${C.months.map((m,i)=>({ m:m.slice(0,3), v:+p.byM[i].toFixed(2) }))} margin=${{top:8,right:4,left:-18,bottom:0}}>
          <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${42}/><${R.Tooltip} cursor=${{fill:'rgba(15,59,58,.05)'}} content=${h(P.Tip,{ fmt:(v)=>cr(v) })}/>
          <${R.Bar} dataKey="v" name="Billed revenue" fill=${COL.brand2} radius=${[3,3,0,0]} maxBarSize=${26}/></${R.BarChart}></${R.ResponsiveContainer}></div>
          <p class="px-p faint">${p.rank? 'Rank '+p.rank.rank+' · '+pct(p.rank.share)+' of open AR' : 'No billed revenue in '+M.period(f.period).label}</p></${P.Card}>
        <${P.Card} title="Credit, billing and payment"><div class="px-kv">
          <div><span>Paid on time</span><b>${pct(p.otp)}${p.paid.length? html`<small> of ${p.paid.length}</small>` : ''}</b></div>
          <div><span>Overdue AR</span><b>${cr(p.odVal)}<small> · ${p.od.length} invoices</small></b></div>
          <div><span>Credit limit</span><b>${v.limit!=null? cr(v.limit) : 'N/A'}${v.reqLimit? html`<small> request ${cr(v.reqLimit)}</small>` : ''}</b></div>
          <div><span>Payment terms</span><b>${v.terms} days</b></div>
          <div><span>Predicted window</span><b>${v.window || 'N/A'}</b></div>
          <div><span>Segment</span><b>${v.seg||'—'}</b></div></div></${P.Card}>
        <${P.CreditCard} id=${id}/>
        <${P.Card} title="Open items"><div class="px-kv">${Object.entries(st).sort((a,b)=>b[1].val-a[1].val).map(([k,r])=> html`<div key=${k}><span>${k}</span><b>${r.n} · ${amt(r.val)}</b></div>`)}
          <div><span>Open sales orders</span><b>${p.op.length} · ${amt(p.opVal)}</b></div>
          <div><span>Unbilled dispatches</span><b>${p.gr.length} · ${amt(p.grVal)}</b></div>
          ${v.adv && html`<div><span>Advance ${v.adv.id}</span><b>${amt(v.adv.cr)} · ${v.adv.ageM} months${v.adv.secured? '' : ', unsecured'}</b></div>`}</div></${P.Card}></div>
      <div class="px-grid g-2">
        <${P.Card} title="Contracts and agreed prices">${(v.ct||[]).length? html`<table class="px-mini"><thead><tr><th>Contract</th><th>Item</th><th>Agreed price</th><th>Valid</th><th>Status</th></tr></thead><tbody>${v.ct.map(c=> html`<tr key=${c.id}><td>${c.id}</td><td>${c.item}</td><td>${c.price}</td><td class="num">${c.from} → ${c.to}</td><td class=${/Expired|not loaded/.test(c.status)? 'px-bad' : ''}>${c.status}</td></tr>`)}</tbody></table>`
          : html`<p class="px-p faint">${p.ct.length? p.ct.length+' contracted lines priced from rate cards in the contract repository; no contract header loaded in the demo.' : 'No contract on file.'}</p>`}</${P.Card}>
        <${P.Card} title="Due diligence and master data"><ul class="px-checks">${C.mdChecks.map(([k,n])=> html`<li key=${k} class=${(v.md||{})[k]===false? 'fail' : 'pass'}><${Icon} n=${(v.md||{})[k]===false? 'TriangleAlert' : 'Check'} size=${13}/>${n}</li>`)}
          <li class=${dd.insolvency? 'fail' : 'pass'}><${Icon} n=${dd.insolvency? 'TriangleAlert' : 'Check'} size=${13}/>${dd.insolvency || 'No insolvency filings (MCA21, e-courts)'}</li>
          <li class=${dd.gstr? 'fail' : 'pass'}><${Icon} n=${dd.gstr? 'TriangleAlert' : 'Check'} size=${13}/>${dd.gstr || 'GST returns filed on time'}</li>
          ${dd.kyc && html`<li class="fail"><${Icon} n="TriangleAlert" size=${13}/>${dd.kyc}</li>`}
          <li class=${bank && bank.pending? 'fail' : 'pass'}><${Icon} n=${bank && bank.pending? 'TriangleAlert' : 'Check'} size=${13}/>${bank && bank.pending? 'Bank change requested '+bank.at+': '+bank.from+' → '+bank.to+'; call-back not done' : 'Bank account verified; no changes in 6 months'}</li>
          ${p.pair && html`<li class="fail"><${Icon} n="Link2" size=${13}/>Possible duplicate record: ${p.pair.id} ${p.pair.name}</li>`}</ul>
</${P.Card}></div>
      <${P.Card} title="Records and evidence" className="flush" right=${html`<${P.Seg} label="Show" value=${tab} onChange=${setTab} options=${[['docs','Invoices'],['po','Open orders'],['cases','Cases']]}/>`}>
        ${tab==='docs'? html`<${P.Table} cols=${[{ k:'ref', l:'Invoice', fmt:(l)=> html`<b>${l.ref}</b><div class="sub">${l.id}</div>` }, { k:'invD', l:'Invoice date', fmt:(l)=> M.date(l.invD!=null? l.invD : l.rcv), sv:(l)=>l.invD!=null? l.invD : l.rcv }, { k:'so', l:'Order', fmt:(l)=> l.so || l.po || html`<span class="faint">—</span>` },
            { k:'amt', l:'Value', r:true, fmt:(l)=> amt(l.amt) }, { k:'st', l:'Status', fmt:(l)=> M.payStatus(l) }, { k:'iss', l:'Issues', fmt:(l)=>{ const is = M.issuesOf(l); return is.length? html`<span class="px-bad">${is.map(c=>M.issue(c).name).slice(0,2).join('; ')}</span>` : html`<span class="faint">None</span>`; }, sv:(l)=> M.issuesOf(l).length }]}
            rows=${p.lines} rowKey=${(l)=>l.id} caption="Customer invoices" onOpen=${(l)=> onDoc(l.id)} limit=${12}/>`
        : tab==='po'? html`<${P.Table} cols=${P.factCols('ar','open')} rows=${p.op.map(o=>({ rec:o, kind:'open', v:o.v, val:o.rem, g:{} }))} rowKey=${(x)=>x.rec.id} caption="Open orders" onOpen=${(x)=> onDoc(x.rec.id)} limit=${12} emptyText="No open sales orders."/>`
        : html`<${P.Table} cols=${P.factCols('exposure','case')} rows=${p.cases.map(c=>({ rec:c, kind:'case', v:c.v, val:c.est||0, g:{} }))} rowKey=${(x)=>x.rec.id} caption="Cases" onOpen=${(x)=> onCase(x.rec.id)} limit=${12} emptyText="No cases for this customer."/>`}</${P.Card}></div>`;
  };

  /* ---------- document (one O2C chain) ---------- */
  P.DocView = ({ id, onCustomer, onCase })=>{
    const ch = M.chain(id), l = M.rec(id); if(!l) return html`<${P.Empty} text="This record is not in the demo ledger."/>`;
    const cases = M.X.cases.filter(c=> c.lines.includes(id)), isLine = !!M.line(id);
    return html`<div class="px-grid g-doc">
      <${P.Card} title=${isLine? 'Invoice '+(l.ref||l.id) : M.openLine(id)? 'Sales order '+(l.id||l.po) : 'Unbilled '+ (l.id||'')} sub=${vname(l.v)+' · '+l.e+' · '+(l.site||'')}
        right=${html`<button type="button" class="btn sm" onClick=${()=> onCustomer(l.v)}>Customer</button>`}><${P.Chain} ch=${ch}/></${P.Card}>
      <div class="px-col">
        ${isLine && html`<${P.Card} title="Values"><div class="px-kv">
          <div><span>Invoice value</span><b>${amt(l.amt)}</b></div>${l.poVal!=null && html`<div><span>Order value</span><b>${amt(l.poVal)}</b></div>`}
          ${l.ip!=null && l.qty>1 && html`<div><span>Unit price: invoice / order / contract</span><b class="num">₹${FCT.n(l.ip)} / ${l.pp!=null? '₹'+FCT.n(l.pp) : '—'} / ${l.cp!=null? '₹'+FCT.n(l.cp) : 'no contract'}</b></div>
          <div><span>Quantity invoiced / dispatched</span><b class="num">${FCT.n(l.qty)} / ${l.qtyR!=null? FCT.n(l.qtyR) : '—'} ${l.uom||''}</b></div>`}
          ${l.pv && l.pv!=='uom' && l.pv!=='expired' && html`<div><span>Variance (estimate)</span><b>${amt(M.vari(l))}</b></div>`}
          <div><span>Terms · due</span><b>${l.terms} days · ${M.date(l.due)}</b></div><div><span>Payment status</span><b>${M.payStatus(l)}${l.disp? ' · '+l.disp : ''}${l.hold? ' · '+l.hold : ''}</b></div>
          ${l.note && html`<div><span>Note</span><b>${l.note}</b></div>`}</div></${P.Card}>`}
        <${P.Card} title="Issues on this record">${ch && ch.iss.length? html`<ul class="px-ul">${ch.iss.map(c=> html`<li key=${c}><b>${M.stage(M.issue(c).stage).name}:</b> ${M.issue(c).name}</li>`)}</ul>` : html`<p class="px-p faint">No issues raised.</p>`}
          ${cases.map(c=> html`<button key=${c.id} type="button" class="px-vrow" onClick=${()=> onCase(c.id)}><span>Case ${c.id}: ${M.ETYPE[c.type].name}</span><span class="num">${c.est==null? 'value affected '+amt(c.affected) : amt(c.est)}</span></button>`)}</${P.Card}>
        ${isLine && html`<${P.Card} title="Evidence" sub="Source documents; requests are simulated and logged."><ul class="px-ev">${M.evidence(l).map(([t,ref,sys],i)=> html`<li key=${i}><${Icon} n="FileText" size=${14}/><span><b>${t}</b> ${ref}<small> · ${sys}</small></span><button type="button" class="px-link sm" onClick=${()=> FCT.ui.toast(t+' '+ref+' requested from '+sys+' (simulated)')}>View</button></li>`)}</ul></${P.Card}>`}</div></div>`;
  };

  /* ---------- investigation case (potential exposure kept apart from disputed and loss) ---------- */
  /* ---------- investigation case: everything needed to judge one event, adapted to the case type ---------- */
  const TICON = { pricing:'Scale', shortage:'Boxes', ptp:'Handshake', slip:'Clock', unapplied:'Landmark', cutoff:'FileWarning', credit:'ShieldCheck', dup:'Link2', wpi:'CalendarClock', argl:'ClipboardCheck' };
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
      case 'pricing': return { sum: n+' invoice'+(n!==1?'s':'')+' from '+(v? v.name : 'this customer')+' are on hold because invoiced prices do not match the contract. Estimated difference '+amt(c.est)+'.',
          cols:[inv, dt, val, { k:'rs', l:'Reason', fmt:(l)=> l.reason||'Pricing' }, pst], series:amtSeries, chart:'Disputed value by month' };
      case 'shortage': return { sum: (v? v.name : 'The customer')+' deducted '+amt(c.est)+' claiming shortage or damage. Proof of delivery is on the evidence list.',
          cols:[inv, dt, val, { k:'rs', l:'Claim', fmt:(l)=> l.reason||'Shortage' }, pst], series:amtSeries, chart:'Deducted value by month' };
      case 'ptp': return { sum: (v? v.name : 'The customer')+' promised '+amt(c.est)+' and missed the date. This is the collections case, not a write-off.',
          cols:[inv, { k:'du', l:'Due', fmt:(l)=> M.date(l.due) }, { k:'pt', l:'Promise', fmt:(l)=> l.ptp!=null? M.date(l.ptp) : '—' }, val, pst], series:amtSeries, chart:'Promised invoices' };
      case 'slip': return { sum: (v? v.name : 'This account')+' is predicted to pay late ('+(v && v.window? v.window : 'see the driver')+'). Open AR in the case is '+amt(c.est)+'.',
          cols:[inv, { k:'du', l:'Due', fmt:(l)=> M.date(l.due) }, val, pst], series:amtSeries, chart:'Open AR by invoice month' };
      case 'unapplied': return { sum: 'Receipt '+((c.lines&&c.lines[0])||'')+' of '+amt(c.est)+' did not match invoices cleanly. Posting the wrong combination would distort overdue and credit.',
          cols:[inv, dt, val, pst], series:[], chart:null };
      case 'cutoff': return { sum: n+' dispatch'+(n!==1?'es':'')+' left the plants by 30-Sep without an invoice. Estimated unbilled where control had passed: '+amt(c.est)+'.',
          cols:[inv, dt, val, { k:'in', l:'Incoterm', fmt:(l)=> l.inco||'—' }], series:amtSeries, chart:'Unbilled by month' };
      case 'credit': return { sum: (v? v.name : 'The customer')+' is outside the approved credit policy. Value affected '+amt(c.affected)+' (not a loss).',
          cols:[inv, dt, val, pst], series:[], chart:null };
      case 'dup': return { sum: (v? v.name+' ('+v.id+')' : 'This onboarding request')+' matches an existing customer on PAN or GSTIN. Opening a second account would double the credit available.',
          cols:[], series:[], chart:null };
      case 'wpi': return { sum: 'Invoice dated in September for goods where control passed after period end. Value affected '+amt(c.affected)+'.',
          cols:[inv, { k:'id', l:'Invoice date', fmt:(l)=> M.date(l.invD) }, { k:'pd', l:'POD', fmt:(l)=> M.date(l.pod) }, val], series:[], chart:null };
      case 'argl': return { sum: 'AR sub-ledger does not agree to the receivables control accounts by '+amt(c.affected)+'. Three reconciling items explain the difference.',
          cols:[], series:[], chart:null };
    }
    return { sum:'', cols:[inv, dt, val, pst], series:amtSeries, chart:'Value by month' };
  };
  const CASE_REC = {
    pricing:['Agree the contract price with the customer and issue a credit note or a corrected invoice.', 'disputed', 'pricing taken up with customer', 'Take up with customer', 'RS'],
    shortage:['Check the deduction against proof of delivery and recover it if the claim is not supported.', 'disputed', 'deduction disputed with customer', 'Dispute deduction', 'NI'],
    ptp:['Escalate the broken promise to the account owner and put new orders on credit review.', 'inv', 'escalated to the account owner', 'Escalate', 'NI'],
    slip:['Call the customer before the due date and agree a payment plan.', 'inv', 'pre-due call scheduled', 'Schedule pre-due call', 'NI'],
    unapplied:['Match the receipt to open invoices, or ask the customer for remittance details.', 'prevented', 'receipt applied', 'Apply receipt', 'NI'],
    cutoff:['Accrue revenue for goods delivered before month end and invoice them now.', 'prevented', 'cut-off accrual booked', 'Book cut-off accrual', 'DB'],
    credit:['Hold new orders until the higher limit is approved or exposure falls below it.', 'inv', 'orders held for credit review', 'Hold new orders', 'NI'],
    dup:['Merge the duplicate customer record and move open items to the surviving account.', 'prevented', 'duplicate merged', 'Merge records', 'AM'],
    wpi:['Re-date the invoice to the period of delivery and reverse the early revenue.', 'prevented', 'invoice re-dated', 'Re-date invoice', 'DB'],
    argl:['Reconcile the AR sub-ledger to GL and post the correcting entry.', 'inv', 'reconciliation assigned', 'Assign reconciliation', 'AR'] };
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
  P.CaseView = ({ id, onDoc, onCustomer, onCase })=>{
    const c0 = M.case(id); if(!c0) return html`<${P.Empty} text="Case not found."/>`;
    const st = M.caseStatus(c0), t = M.ETYPE[c0.type], meas = M.statusMeasure(st);
    const [note,setNote] = useState(''); const [why,setWhy] = useState('');
    useEffect(()=>{ P.dirty = !!note; return ()=>{ P.dirty = false; }; }, [note]);
    const set = (s, label)=>{ if(s==='loss' && !why.trim()){ FCT.ui.toast('Enter the validation basis before confirming a loss'); return; }
      M.setCaseStatus(id, s, note || why); FCT.applyEffects([{ event:'Case '+id+' ('+t.name.toLowerCase()+', '+vname(c0.v)+'): '+label, tower:'O2C' }]); FCT.save(); setNote(''); P.dirty = false; FCT.ui.toast('Case '+id+': '+label); FCT.onChange && FCT.onChange(); };
    const v = M.V[c0.v], pv = M.customer(c0.v), rk = pv.rk;
    const lines = c0.lines.map(x=> M.line(x)).filter(Boolean), opens = c0.lines.map(x=> M.openLine(x)).filter(Boolean);
    const det = caseDetail(c0, lines, v), cs = M.caseStages(c0);
    const unpaid = lines.filter(M.unpaid), outstanding = c0.type==='adv' && v.adv? v.adv.cr : M.sum(unpaid, l=> l.amt);
    const oldest = unpaid.filter(l=> l.due < M.SNAP).map(l=> Math.floor(M.SNAP - l.due)), age = Math.max(0, Math.floor(M.SNAP - c0.opened));
    const others = M.X.cases.filter(x=> x.v===c0.v && x.id!==id).map(x=> Object.assign({}, x, { stNow:M.caseStatus(x) }));
    const sameType = M.X.cases.filter(x=> x.type===c0.type && x.id!==id && M.statusMeasure(M.caseStatus(x))==='potential');
    const ev = []; const seen = {}; lines.concat(opens).forEach(l=> M.evidence(l).forEach(e=>{ const k = e[0]+e[1]; if(!seen[k]){ seen[k] = 1; ev.push(e); } }));
    if(c0.type==='adv' && v.adv) ev.unshift(['Advance payment voucher', v.adv.id, 'ERP FI']);
    if(c0.type==='bank' && v.bank) ev.unshift(['Bank change request', v.bank.at, 'Customer master change log']);
    if(v.dd && v.dd.insolvency) ev.push(['Insolvency filing', v.dd.insolvency, 'MCA21, e-courts']);
    if(v.dd && v.dd.gstr) ev.push(['GST record', v.dd.gstr, 'GSTN']);
    const prim = lines[0] || opens[0];
    const fs = [['Exposure', t.basis==='fin'? (c0.est==null? 'Not quantified' : amt(c0.est)) : amt(c0.affected), t.basis==='fin'? 'Estimate, not a loss' : 'Value affected, not a loss'],
      ['Confidence', pct(c0.conf*100,0), M.statusName(st)], ['Open for', age+' days', 'Opened '+M.date(c0.opened)],
      ['Records', FCT.n(c0.lines.length), lines.length+' invoice, '+opens.length+' sales orders'], ['Outstanding', outstanding? amt(outstanding) : '—', c0.type==='adv'? 'Advance balance' : oldest.length? 'Oldest '+Math.max(...oldest)+' days past due' : unpaid.length? 'Not yet due' : 'Nothing unpaid'],
      ['Counts in', meas==='potential'? (t.basis==='fin'? 'Collections Exposure' : 'Control value') : meas==='disputed'? 'Disputed amount' : meas==='loss'? 'Confirmed loss' : 'Closed', 'Raised at '+M.stage(cs.primary).name]];
    return html`<div class="px-case">
      <section class=${'px-case-h '+P.kc('exposure')}><span class="ic"><${Icon} n=${TICON[c0.type]||'Crosshair'} size=${22} strokeWidth=${1.6}/></span>
        <div class="tt"><div class="k">Case ${id}${c0.ex? ' · '+c0.ex : ''}</div><h2>${t.name}</h2><div class="m"><span class=${'px-cst s-'+st}>${M.statusName(st)}</span><span class="px-pill">${M.stage(cs.primary).name}</span><span class="px-pill">${t.basis==='fin'? 'Financial' : 'Control'}</span><button type="button" class="px-link sm" onClick=${()=> onCustomer(c0.v)}>${v.name}</button></div></div>
        <dl class="px-case-f">${fs.map(([l,val,s])=> html`<div key=${l}><dt>${l}</dt><dd>${val}</dd><small>${s}</small></div>`)}</dl></section>
      ${(()=>{ const ex = c0.ex && FCT.ex(c0.ex), rec = CASE_REC[c0.type] || ['Investigate and record the outcome.', 'inv', 'assigned for investigation', 'Assign investigator', 'NI'], owner = ex? userName(ex.owner) : userName(rec[4]);
        return html`<${DecPanel} need=${meas==='potential'} decided=${ex && !FCT.isOpen(ex)} owner=${owner} due=${ex? ex.due : dueOf(age)} rec=${ex && ex.ai? ex.ai.text : rec[0]}
          stake=${t.basis==='fin'? (c0.est==null? 'Not quantified yet' : amt(c0.est)+' potential exposure') : amt(c0.affected||0)+' affected by a control breach'} conf=${pct(c0.conf*100,0)} raised=${M.stage(cs.primary).name} exId=${ex && c0.ex} status=${M.statusName(st)}
          actions=${[{ label:rec[3], primary:true, onClick:()=> set(rec[1], rec[2]) }, { label:'Assign to '+owner.split(' ')[0], disabled:st==='inv', onClick:()=> set('inv', 'assigned for investigation to '+owner) }, { label:'Close: no issue', onClick:()=> set('nil', 'closed, no issue') }]}/>`; })()}
      <${AI}>${det.sum}</${AI}>
      <div class="px-calc"><b>Method.</b> ${t.method}.${c0.note? html` <b>Note.</b> ${c0.note}.` : ''}${c0.rule? html` <b>DoA rule.</b> ${M.ruleName(c0.rule)}.` : ''}
        ${Object.keys(cs.stages).length>1 && html` <b>Stages touched.</b> ${Object.keys(cs.stages).map(k=> M.stage(k).name).join(', ')}.`}</div>
      <div class="px-case-g"><div class="px-col">
        <${P.Card} title="What happened" className="px-case-w">
          ${det.compare? html`<table class="px-mini px-cmp"><thead><tr><th/><th>Original</th><th>Candidate duplicate</th></tr></thead><tbody>${det.compare.map(r=> html`<tr key=${r[0]} class=${r[1]===r[2] && r[0]!=='Payment'? 'same' : ''}><td>${r[0]}</td><td>${r[1]||'—'}</td><td>${r[2]||'—'}</td></tr>`)}</tbody></table>`
          : det.adv? html`<div class="px-kv"><div><span>Advance</span><b>${det.adv.id} · ${amt(det.adv.cr)}</b></div><div><span>Age</span><b>${det.adv.ageM} months</b></div><div><span>Security</span><b>${det.adv.secured? 'Secured' : 'Unsecured'}</b></div>
              <div><span>Last invoice from customer</span><b>${det.last==null? 'None in six months' : M.date(det.last)}</b></div><div><span>Open orders</span><b>${pv.op.length} · ${amt(pv.opVal)}</b></div><div><span>Customer status</span><b>${v.status}${v.dormant? ', no supply' : ''}</b></div></div>
              ${pv.op.length>0 && html`<div class="px-case-ch"><div class="h">Customer's open sales orders</div></div><${P.Table} cols=${P.factCols('ar','open')} rows=${pv.op.map(o=>({ rec:o, kind:'open', v:o.v, val:o.rem, g:{} }))} rowKey=${(x)=> x.rec.id} caption="Open orders" rowClick=${true} dense=${true} onOpen=${(x)=> onDoc(x.rec.id)} limit=${6}/>`}`
          : html`<${ByMonth} rows=${det.series} label=${det.chart}/>`}
          ${det.cols && lines.length>0 && html`<${P.Table} cols=${det.cols} rows=${lines} rowKey=${(l)=> l.id} caption="Case records" rowClick=${true} dense=${true} onOpen=${(l)=> onDoc(l.id)} limit=${8}/>`}
          ${opens.length>0 && html`<${P.Table} cols=${P.factCols('ar','open')} rows=${opens.map(o=>({ rec:o, kind:'open', v:o.v, val:o.rem, g:{} }))} rowKey=${(x)=> x.rec.id} caption="Open orders" rowClick=${true} dense=${true} onOpen=${(x)=> onDoc(x.rec.id)} limit=${6}/>`}</${P.Card}>
        <${P.Card} title=${prim? 'Process chain: '+(prim.ref||prim.po) : 'Process chain'}>${prim? html`<${P.Chain} ch=${M.chain(prim.id)}/>` : html`<p class="px-p faint">No transaction record is linked; this case concerns ${c0.type==='adv'? 'an advance payment' : 'the customer record'}.</p>`}</${P.Card}></div>
        <div class="px-col"><${P.Card} title="Customer" className="px-case-v" right=${html`<button type="button" class="btn sm" onClick=${()=> onCustomer(c0.v)}>Customer Profile</button>`}>
          <div class="px-case-vh"><b>${v.name}</b><span class="faint">${v.id} · ${(M.CAT[v.cat]||{}).name} · ${v.bu} · since ${v.since}</span>
            <div class="m"><${P.RiskTag} cat=${rk.approved} score=${rk.score} small=${true}/>${rk.rereview && html`<span class="px-tag warn">Model ${rk.model}</span>`}${v.msme && html`<span class="px-tag">MSME</span>`}${v.sole && html`<span class="px-tag warn">Sole source</span>`}<span class="px-tag">${v.status}</span></div></div>
          <div class="px-case-rf">${rk.factors.filter(x=> x.v!=null).sort((a,b)=> b.v-a.v).slice(0,3).map(x=> html`<div key=${x.id} title=${x.why}><span>${x.name}</span><span class="trk"><i style=${{ width:x.v+'%', background: x.v>=80? COL.crit : x.v>=60? COL.high : x.v>=40? 'var(--px-medium)' : COL.light }}/></span><b class="num">${x.v}</b></div>`)}</div>
          <${ByMonth} rows=${M.vlines(c0.v).map(l=> ({ m:l.m, v:l.amt }))} label="Billed by month"/>
          <div class="px-kv"><div><span>Six-month billed</span><b>${cr(pv.total)}</b></div><div><span>Open orders</span><b>${amt(pv.opVal)}</b></div><div><span>Overdue AR</span><b>${amt(pv.odVal)} · ${pv.od.length}</b></div>
            ${v.adv && html`<div><span>Advance</span><b>${amt(v.adv.cr)} · ${v.adv.ageM} mo</b></div>`}<div><span>Other cases</span><b>${others.length} (${others.filter(x=> M.statusMeasure(x.stNow)==='potential').length} open)</b></div></div></${P.Card}>
          <${P.Card} title="Related exceptions">
            ${c0.ex && FCT.ex(c0.ex) && html`<div class="px-ex"><span>${/^SC-/.test(c0.ex)? 'Supply chain tower: ' : 'Shared decision: '}<b>${c0.ex}</b> ${P.vt(FCT.ex(c0.ex).title)}</span><${P.Decide} id=${c0.ex}/></div>`}
            ${others.length? others.slice(0,5).map(x=> html`<button key=${x.id} type="button" class="px-vrow" onClick=${()=> onCase && onCase(x.id)}><span>${x.id} · ${M.ETYPE[x.type].name}</span><span class="num">${x.est!=null? amt(x.est) : amt(x.affected)} · ${M.statusName(x.stNow)}</span></button>`)
              : html`<p class="px-p faint">No other cases for this customer.</p>`}
            <p class="px-p faint">${FCT.n(sameType.length)} other open ${t.name.toLowerCase()} cases across all customers, ${amt(M.sum(sameType, x=> x.est!=null? x.est : x.affected||0))}.</p></${P.Card}>
          <${P.Card} title="Evidence"><ul class="px-ev">${ev.slice(0,8).map(([tt,ref,sys],i)=> html`<li key=${i}><${Icon} n="FileText" size=${14}/><span><b>${tt}</b> ${ref}<small> · ${sys}</small></span><button type="button" class="px-link sm" onClick=${()=> FCT.ui.toast(tt+' '+ref+' requested from '+sys+' (simulated)')}>View</button></li>`)}
            ${!ev.length && html`<li class="faint">No source documents linked.</li>`}</ul></${P.Card}></div></div>
      <${P.Card} title="Investigate" className="px-case-act">
        ${!c0.ex? html`<div class="px-acts">
          <button type="button" class="btn sm" disabled=${st==='inv'} onClick=${()=> set('inv','assigned for investigation to Neha Iyer')}>Assign investigator</button>
          <button type="button" class="btn sm" disabled=${st==='disputed'} onClick=${()=> set('disputed','dispute raised with customer')}>Raise dispute with customer</button>
          <button type="button" class="btn sm" disabled=${st==='nil'} onClick=${()=> set('nil','closed, no issue')}>Close: no issue</button>
          <button type="button" class="btn sm" disabled=${st==='prevented'} onClick=${()=> set('prevented','prevented or recovered')}>Mark recovered</button>
          <button type="button" class="btn sm danger" disabled=${st==='loss'} onClick=${()=> set('loss','loss confirmed: '+why)}>Confirm loss</button>
          ${st!==c0.st && html`<button type="button" class="px-link sm" onClick=${()=> set(c0.st,'reopened')}>Reopen</button>`}</div>
          <div class="px-grid g-2"><label class="field"><span>Validation basis (required to confirm a loss)</span><input value=${why} onInput=${(e)=>setWhy(e.target.value)} placeholder="e.g. customer refused credit note; written off under policy FP-07"/></label>
          <label class="field"><span>Investigation note</span><textarea value=${note} onInput=${(e)=>setNote(e.target.value)} placeholder="Unsaved notes are confirmed before you switch KPI"/></label></div>`
        : html`<div class="px-ex"><span>This case is decided through the shared decision drawer (<b>${c0.ex}</b>) so the decision, gate and audit trail stay in one place. Its status here follows that decision.</span><${P.Decide} id=${c0.ex}/></div>`}</${P.Card}></div>`;
  };

  /* ---------- right-panel router ---------- */
  P.Investigate = ({ nav, dispatch, f, setF, pending, noFilters, wide, onWide, page })=>{
    const top = M.nav.top(nav), ctx = P.ctx(nav, f), k = ctx.comp && top.t==='group' && top.dim==='component' && M.KPI[ctx.comp.key]? M.KPI[ctx.comp.key] : M.KPI[nav.kpi];
    const vend = M.nav.customer(nav, f);
    const goDoc = (id)=> dispatch({ t:'drill', node:N.doc(id) }), goCase = (id)=> dispatch({ t:'drill', node:N.case(id) }), goV = (id)=> dispatch({ t:'drill', node:N.customer(id) });
    let body;
    if(top.t==='root'){ const V = roots[nav.kpi]; body = V? html`<${V} f=${f} nav=${nav} dispatch=${dispatch} facts=${ctx.facts}/>` : html`<${P.Empty}/>`; }
    else if(top.t==='group') body = html`<${GroupView} f=${f} nav=${nav} dispatch=${dispatch} cx=${ctx}/>`;
    else if(top.t==='customer' || top.t==='vendor') body = html`<${CustomerInKpi} f=${f} nav=${nav} dispatch=${dispatch} cx=${ctx}/>`;
    else if(top.t==='profile') body = html`<${P.CustomerProfile} id=${top.id} f=${f} ctx=${{ kpi:ctx.eff==='health'? null : ctx.eff, f, groups:ctx.groups }} onDoc=${goDoc} onCase=${goCase}/>`;
    else if(top.t==='doc') body = html`<${P.DocView} id=${top.id} onCustomer=${goV} onCase=${goCase}/>`;
    else if(top.t==='case') body = html`<${P.CaseView} id=${top.id} onDoc=${goDoc} onCustomer=${goV} onCase=${goCase}/>`;
    const p = M.period(f.period), act = M.active(f);
    /* page mode: the KPI's own detail screen under the global breadcrumb (no panel trail) */
    if(page) return html`<section class=${'px-panel px-detail '+P.kc(nav.kpi)} aria-labelledby="px-ph">
      <header class="px-ph"><div class="px-pt"><div class="px-pt-t"><h1 id="px-ph"><span class="px-h-i"><${Icon} n=${P.KICON[nav.kpi]} size=${20} strokeWidth=${1.6}/></span>${k.name}</h1><p>${k.q}</p></div>
        <div class="px-pm"><span class="px-tag">${k.time==='Snapshot'? 'Snapshot '+C.snapLabel : p.label}</span>${act.length>0 && html`<span class="faint">${act.length} filter${act.length>1?'s':''}</span>`}<${P.KpiDef} id=${nav.kpi}/></div></div>
        <${P.CustomerMarker} id=${vend} isProfile=${top.t==='profile'} onOpen=${()=> dispatch({ t:'drill', node:N.profile(vend) })} onClear=${f.vendor && f.vendor===vend? ()=> setF(Object.assign({}, f, { vendor:null })) : null}/></header>
      <${P.PanelBody} depth=${nav.path.length} sig=${nav.kpi+':'+nav.path.length+':'+top.t+':'+(top.id||top.key||'')} reset=${M.fkey(f)+nav.path.length}>${body}</${P.PanelBody}></section>`;
    return html`<section class=${'px-panel dark '+P.kc(nav.kpi)} aria-labelledby="px-ph">
      <header class="px-ph"><${P.Crumbs} nav=${nav} dispatch=${dispatch} rootLabel=${'Return to '+k.short}/>
        <div class="px-pt"><h1 id="px-ph" title=${k.q}><span class="px-h-i"><${Icon} n=${P.KICON[nav.kpi]} size=${16} strokeWidth=${1.6}/></span>${k.name}</h1>
        <div class="px-pm"><span class="px-tag">${k.time==='Snapshot'? 'Snapshot '+C.snapLabel : p.label}</span>${act.length>0 && html`<span class="faint">${act.length} filter${act.length>1?'s':''}</span>`}
          ${onWide && html`<button type="button" class="btn sm" aria-pressed=${!!wide} onClick=${onWide} title=${wide? 'Show the KPI board again' : 'Give the investigation the full width'}>${wide? 'Show KPI board' : 'Expand'}</button>`}</div></div>
        ${!noFilters && html`<${P.FilterBar} f=${f} setF=${setF} pending=${pending} compact=${true}/>`}
        <${P.CustomerMarker} id=${vend} isProfile=${top.t==='profile'} onOpen=${()=> dispatch({ t:'drill', node:N.profile(vend) })} onClear=${f.vendor && f.vendor===vend? ()=> setF(Object.assign({}, f, { vendor:null })) : null}/></header>
      <${P.PanelBody} depth=${nav.path.length} sig=${nav.kpi+':'+nav.path.length+':'+top.t+':'+(top.id||top.key||'')} reset=${M.fkey(f)+nav.path.length}>${body}</${P.PanelBody}></section>`;
  };
})();

/* every record view opens with the action bar (assets/js/shared/act.js): status, AI recommendation, owner, Resolve */
(function(){
  const P = window.O2C, M = window.O2CM; if(!P || !P.DocView || !window.FCTAct) return;
  const { html, h } = P, N = P.node, Body = P.DocView;
  const ACT = P.ACT = FCTAct.make(P, { tower:'o2c', towerName:'O2C', issue:(c)=> M.issue(c) });
  const valOf = (l)=> l.amt!=null? l.amt : l.val!=null? l.val : l.rem!=null? l.rem : 0;
  /* a credit decision (limit change or override) is a record too: its terms, and the same action bar */
  const CreditView = (pr)=>{ const d = M.X.credit.find(x=> x.id===pr.id), v = M.V[d.v]||{}, code = d.override? 'overLimit' : 'creditHold';
    const kv = [['Customer', (v.name||d.v)+' · '+d.v], ['Business unit', d.e], ['Decision', d.kind==='limit'? 'Credit limit change' : d.kind], ['Current limit', d.cur!=null? P.cr(d.cur,2) : '—'], ['Requested', d.req!=null? P.cr(d.req,2) : '—'],
      ['Model recommendation', d.rec!=null? P.cr(d.rec,2) : '—'], ['Credit score', d.score!=null? d.score : '—'], ['Approved by', d.auto? 'Automatic, inside policy' : d.by || 'Credit committee'], ['Within policy', d.ok? 'Yes' : 'No: above the model recommendation'+(d.override? ', overridden' : '')]];
    return html`<div class="px-docwrap"><${ACT.ActionBar} key=${d.id} id=${d.id} codes=${d.ok? [] : [code]} label=${'Credit decision '+d.id} ent=${v.name||d.v} val=${d.req!=null && d.rec!=null? Math.max(0, d.req-d.rec) : 0} ex=${d.ex} onCase=${pr.onCase} ctx=${pr.act} theme=${pr.theme}/>
      <div class="px-grid g-doc"><${P.Card} title=${'Credit decision '+d.id} sub=${(v.name||d.v)+' · '+d.e} right=${pr.onCustomer && html`<button type="button" class="btn sm" onClick=${()=> pr.onCustomer(d.v)}>Customer</button>`}>
        <div class="px-kv">${kv.map(([a,b])=> html`<div key=${a}><span>${a}</span><b>${b}</b></div>`)}</div></${P.Card}>
        <${P.Card} title="Why it is flagged"><p class="px-p">${d.ok? 'The decision sits inside the credit policy; no control flagged it.' : 'The limit was raised to '+P.cr(d.req,2)+' against a model recommendation of '+P.cr(d.rec,2)+(d.override? ' through an override' : '')+'. Exposure above the recommended limit is not covered by the credit model.'}</p></${P.Card}></div></div>`; };
  P.DocView = (pr)=>{ const l = M.rec(pr.id); if(!l) return M.X.credit.some(x=> x.id===pr.id)? h(CreditView, pr) : h(Body, pr); const ch = M.chain(pr.id), cases = M.X.cases.filter(c=> c.lines.includes(pr.id));
    let label = pr.id; try{ label = N.doc(pr.id).label; }catch(e){}
    return html`<div class="px-docwrap"><${ACT.ActionBar} key=${pr.id} id=${pr.id} codes=${ch? ch.iss : []} label=${label} ent=${(M.V[l.v]||{}).name || l.v} val=${valOf(l)} ex=${l.ex}
      cases=${cases.map(c=> ({ id:c.id, name:(M.ETYPE[c.type]||{}).name || c.type }))} onCase=${pr.onCase} ctx=${pr.act} theme=${pr.theme}/>${h(Body, pr)}</div>`; };
})();
