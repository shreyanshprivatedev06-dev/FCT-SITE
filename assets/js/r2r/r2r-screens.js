/* FCT demo — R2R sidebar screens: Journals & anomalies · Intercompany & consolidation · Reporting & sign-off.
   Child screens of the R2R control tower: same command bar, breadcrumb (rooted at the control tower), drill panel, Entity Profile,
   record and case views. Every KPI and every drill joins records already in FCT_DATA.r2r (data/r2r.js) or the R2R close ledger;
   nothing is invented. Mount with R2R.mountScreen('journals'|'intercompany'|'reporting'). */
(function(){
  const P = window.R2R, M = window.R2RM, { html, h, COL, Icon, cx } = P, FCT = window.FCT, D = window.FCT_DATA, R = D.r2r, Rc = Recharts;
  const { Fragment, useEffect, useReducer } = React;
  const sum = (xs, f)=> xs.reduce((s, x)=> s + f(x), 0);
  const pc = (v, d=1)=> FCT.pct(v, d), cr = (v, d=2)=> FCT.cr(v, d), amt = FCT.amt;
  const sgn = (v, f)=> (v>0? '+' : v<0? '−' : '')+f(Math.abs(v));
  const ename = (id)=> M.E[id]? id+' '+M.E[id].name : id;
  const isEnt = (id)=> !!M.E[id];

  /* drill node types for these screens; shown in the shared breadcrumb with an icon and a kind */
  Object.assign(P.NODE, { xroot:['Layers','R2R screen'], xjnl:['BookOpen','Journal'], xent:['Building2','Entity'], xsrc:['Filter','Journal source'],
    xpair:['GitCompare','IC pair'], xres:['Filter','IC result'], xvar:['TrendingDown','Variance'], xdrv:['Scale','Bridge driver'], xchk:['ListChecks','Pack check'], xjr:['Scale','Judgement'] });
  const X = {
    jnl:(id)=> ({ t:'xjnl', id, label:id }), ent:(id)=> ({ t:'xent', id, label:ename(id) }), src:(k)=> ({ t:'xsrc', id:k, label:k }),
    pair:(id)=> ({ t:'xpair', id, label:id.replace('|',' ↔ ') }), res:(k)=> ({ t:'xres', id:k, label:k }),
    vr:(id)=> ({ t:'xvar', id, label:id+' '+R.variances.find(v=> v.id===id).line }), drv:(k)=> ({ t:'xdrv', id:k, label:k }),
    chk:(k)=> ({ t:'xchk', id:k, label:R.packItems.find(p=> p[1]===k)[0] }), jr:(id)=> ({ t:'xjr', id, label:id })
  };

  /* ---------- small pieces in the control tower's anatomy ---------- */
  const Pill = ({ tone, children })=> html`<span class=${'px-pill t-'+tone}>${children}</span>`;
  const Tone = ({ tone, children })=> html`<span style=${{ color: tone==='r'? COL.crit : tone==='a'? COL.high : tone==='g'? COL.pos : null }}>${children}</span>`;
  const Stat = ({ label, value, sub, tone, title })=> html`<div title=${title}><${P.Stat} label=${label} value=${html`<${Tone} tone=${tone}>${value}</${Tone}>`} sub=${sub}/></div>`;
  const Stats = ({ children })=> html`<div class="px-stats row" style=${{ marginBottom:14 }}>${children}</div>`;
  const Sub = ({ children })=> html`<p class="px-p faint" style=${{ marginTop:0, marginBottom:8 }}>${children}</p>`;
  const Open = ({ id, label })=> id && FCT.ex(id)? html`<span onClick=${(e)=> e.stopPropagation()}><${P.Decide} id=${id} label=${label || 'Decide'}/></span>` : null;
  const axis = { stroke:COL.ink3, tick:{ fontSize:11, fill:COL.ink3 }, tickLine:false, axisLine:{ stroke:COL.line } };
  const tip = { contentStyle:{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:8, fontSize:12 }, labelStyle:{ color:'var(--ink)' } };
  const Chart = ({ height=200, children })=> html`<div style=${{ height, width:'100%' }}><${Rc.ResponsiveContainer} width="100%" height="100%">${children}</${Rc.ResponsiveContainer}></div>`;
  const Grid = ({ cls='g-2', children })=> html`<div class=${'px-grid '+cls} style=${{ marginBottom:14 }}>${children}</div>`;
  /* list rows: [title, sub, right, onOpen?] — rows with onOpen drill like the control tower's px-vrow */
  const List = ({ rows, empty })=> rows.length? html`<div>${rows.map((r, i)=> r[3]?
      html`<button key=${i} type="button" class="px-vrow" style=${{ alignItems:'center', borderBottom:'1px solid var(--px-line)' }} onClick=${r[3]}><span><b>${r[0]}</b>${r[1] && html`<br/><span class="faint">${r[1]}</span>`}</span><span style=${{ display:'flex', gap:6, alignItems:'center' }}>${r[2]}<${Icon} n="ChevronRight" size=${14}/></span></button>`
      : html`<div key=${i} class="px-vrow" style=${{ cursor:'default', alignItems:'center', borderBottom:'1px solid var(--px-line)' }}><span><b>${r[0]}</b>${r[1] && html`<br/><span class="faint">${r[1]}</span>`}</span><span>${r[2]}</span></div>`)}</div>`
    : html`<${P.Empty} text=${empty || 'Nothing in this view.'}/>`;
  const EntBtn = ({ id, go })=> isEnt(id)? html`<button type="button" class="px-link" onClick=${(e)=>{ e.stopPropagation(); go(id); }}>${id}</button>` : html`<span>${id}</span>`;
  const riskTone = (r)=> r==='High'? 'r' : r==='Medium'? 'a' : 'n';

  /* ---------- shared joins on data/r2r.js ---------- */
  const anomOpen = (a)=> !a[4] || FCT.isOpen(FCT.ex(a[4]));
  const allJnl = ()=> R.anomalies.map(a=> ({ id:a[0], e:a[1], kind:'anomaly', score:a[2], why:a[3], ex:a[4] }))
    .concat(R.journals.pending.map(p=> ({ id:p[0], e:p[1], kind:'pending', desc:p[2], val:+p[3], risk:p[4], src:p[5] })));
  const recsOf = (e)=> R.recs.filter(r=> r.entity===e), tasksOf = (e)=> R.lateTasks.filter(t=> t.entity===e), ctlsOf = (e)=> R.failing.filter(c=> c[2]===e && /^CTL-R2R/.test(c[0]));
  const icPairs = ()=> R.ic.pairs.map(p=>{ const diff = +(p[2]-p[3]).toFixed(2), unconf = /not reconciled/i.test(p[5]);
    return { id:p[0]+'|'+p[1], a:p[0], b:p[1], ar:p[2], ap:p[3], ccy:p[4], note:p[5], ex:p[6], diff, unconf, agreed: !unconf && Math.abs(diff)<=0.10 }; });
  const resOf = (p)=> p.agreed? 'Agreed' : p.unconf? 'Unconfirmed' : 'Break';
  const MAT = 2.0, matVars = ()=> R.variances.filter(v=> Math.abs(v.var)>=MAT);
  const recCases = ()=> R.recs.filter(r=> r.ex && FCT.ex(r.ex) && FCT.isOpen(FCT.ex(r.ex)));
  const driverOf = (v)=> R.bridge.slice(1, -1).find(b=> v.line.toLowerCase().includes(b[0].toLowerCase()));

  const RecList = ({ e, go })=> html`<${List} empty="No reconciliations for this entity in the close sample." rows=${recsOf(e).map(r=> [r.acc, r.risk+' risk · GL '+cr(r.gl)+(r.diff? ' · unexplained '+amt(r.diff) : '')+(r.aged? ' · '+r.aged+'d aged' : ''),
    html`<${Fragment}><${Pill} tone=${r.status==='Certified'? 'g' : r.status==='Break'? 'r' : 'a'}>${r.status}</${Pill}><${Open} id=${r.ex}/></${Fragment}>`])}/>`;
  const TaskList = ({ e })=> html`<${List} empty="No late or at-risk close tasks for this entity." rows=${tasksOf(e).map(t=> [t.task, 'Due '+t.due+' · owner '+t.owner+' · '+t.action, html`<${Pill} tone=${t.late? 'r' : 'a'}>${t.status}</${Pill}>`])}/>`;
  const CtlList = ({ rows })=> html`<${List} empty="No failing R2R controls." rows=${rows.map(c=> [c[0]+' '+c[1], c[2]+' · '+c[3], c[4]? html`<${Open} id=${c[4]}/>` : html`<${Pill} tone="r">Failing</${Pill}>`])}/>`;
  const ProfileBtn = ({ id, go })=> isEnt(id)? html`<button type="button" class="btn sm primary" onClick=${()=> go(id)}>Open full Entity Profile</button>` : null;

  /* ======================= Journals & anomalies ======================= */
  const JournalsRoot = ({ go })=>{
    const J = R.journals, A = R.anomalies, T = J.trend, nPend = D.metrics['r2r.jePending'];
    const autoRate = (J.total-J.manual)/J.total*100, aiShare = J.aiDrafted/J.manual*100, anomRate = A.length/J.manual*100;
    const c0 = T.corrective[0], c1 = T.corrective[T.corrective.length-1], cChg = (c1-c0)/c0*100;
    const pendVal = sum(J.pending, p=> +p[3]), pendHi = J.pending.filter(p=> p[4]==='High'), in07 = sum(J.in07, x=> x[2]), open = A.filter(anomOpen);
    const mix = [['Interface and auto-reversal', J.total-J.manual, COL.brand2, null], ['Manual (people)', J.manual-J.aiDrafted, COL.high, 'Manual'], ['AI-drafted', J.aiDrafted, COL.brass, 'AI']]
      .map(([label, n, tone, src])=> ({ key:label, label, val:n, sub:pc(n/J.total*100)+' of journals'+(src? '' : ' · system-posted, no review queue'), tone, src }));
    const trend = T.months.map((m, i)=> ({ m, Recurring:T.recurring[i], Corrective:T.corrective[i] }));
    return html`<${Fragment}>
      <${Stats}>
        <${Stat} label="Journal automation rate" value=${pc(autoRate)} sub=${FCT.n(J.total-J.manual)+' of '+FCT.n(J.total)+' from interfaces or auto-reversal'} title="(total − manual) ÷ total journals"/>
        <${Stat} label="AI-drafted share of manual" value=${pc(aiShare)} sub=${J.aiDrafted+' of '+FCT.n(J.manual)+' manual journals'} title="AI-drafted ÷ manual journals"/>
        <${Stat} label="Anomaly rate" value=${pc(anomRate,2)} tone=${open.length? 'a' : 'g'} sub=${A.length+' scored ≥ 0.75 · '+open.length+' unresolved'} title="Anomalous journals ÷ manual journals"/>
        <${Stat} label="Corrective journals" value=${FCT.n(c1)} tone=${cChg<0? 'g' : 'r'} sub=${sgn(cChg, v=> pc(v,0))+' vs '+T.months[0]+' ('+c0+')'} title="Journals correcting earlier postings, per month"/>
        <${Stat} label="Pending approval" value=${FCT.n(nPend)} tone=${pendHi.length? 'a' : null} sub=${'Top '+J.pending.length+': '+cr(pendVal)+' · '+pendHi.length+' high-risk'}/>
      </${Stats}>
      <${Grid}>
        <${P.Card} title="Anomalous journals" className="flush"><${Sub}>Anomaly score 0.75 or above, highest first. Select a row to drill in.</${Sub}>
          <${P.Table} rows=${A.slice().sort((a,b)=> b[2]-a[2])} rowKey=${(a)=> a[0]} caption="Anomalous journals" dense=${true} rowClick=${true} onOpen=${(a)=> go(X.jnl(a[0]))} cols=${[
            { k:'j', l:'Journal', w:'46%', fmt:(a)=> html`<b class="nb">${a[0]}</b><div class="sub">${a[3]}</div>`, sv:(a)=> a[0] },
            { k:'e', l:'Entity', fmt:(a)=> html`<${EntBtn} id=${a[1]} go=${(e)=> go(X.ent(e))}/>`, sv:(a)=> a[1] },
            { k:'s', l:'Score', r:true, fmt:(a)=> html`<${Tone} tone=${a[2]>=0.9? 'r' : a[2]>=0.8? 'a' : null}>${a[2].toFixed(2)}</${Tone}>`, sv:(a)=> a[2] },
            { k:'st', l:'Status', fmt:(a)=> a[4]? (FCT.isOpen(FCT.ex(a[4]))? html`<${Pill} tone="r">Open case</${Pill}>` : html`<${Pill} tone="g">Resolved</${Pill}>`) : html`<${Pill} tone="a">Review</${Pill}>` } ]}/></${P.Card}>
        <div class="px-grid" style=${{ alignContent:'start' }}>
          <${P.Card} title="Journal mix, September"><${P.BarList} rows=${mix} fmt=${(v)=> FCT.n(v)} label="Journal mix" onSelect=${(r)=> r.src && go(X.src(r.src))} onOpen=${(r)=> r.src && go(X.src(r.src))}/>
            <p class="px-note">${J.recurringCandidates} recurring journals are automation candidates (RC-05). Automating them lifts the automation rate to ${pc((J.total-J.manual+J.recurringCandidates)/J.total*100)}.</p></${P.Card}>
          <${P.Card} title="Recurring vs corrective journals"><${Sub}>Apr–Sep. Recurring volume is flat; corrective volume is falling.</${Sub}>
            <${Chart} height=${170}><${Rc.LineChart} data=${trend} margin=${{ top:8, right:12, left:-12, bottom:0 }}>
              <${Rc.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${Rc.XAxis} dataKey="m" ...${axis}/><${Rc.YAxis} ...${axis} width=${44}/><${Rc.Tooltip} ...${tip}/><${Rc.Legend} wrapperStyle=${{ fontSize:11 }}/>
              <${Rc.Line} type="monotone" dataKey="Recurring" stroke=${COL.brand2} strokeWidth=${2} dot=${{ r:3 }}/><${Rc.Line} type="monotone" dataKey="Corrective" stroke=${COL.high} strokeWidth=${2} dot=${{ r:3 }}/></${Rc.LineChart}></${Chart}></${P.Card}>
        </div></${Grid}>
      <${Grid}>
        <${P.Card} title=${'Waiting for approval · '+J.pending.length+' largest of '+nPend} className="flush">
          <${P.Table} rows=${J.pending} rowKey=${(p)=> p[0]} caption="Journals waiting for approval" dense=${true} rowClick=${true} onOpen=${(p)=> go(X.jnl(p[0]))} cols=${[
            { k:'j', l:'Journal', w:'46%', fmt:(p)=> html`<b class="nb">${p[0]}</b><div class="sub">${p[2]}</div>`, sv:(p)=> p[0] },
            { k:'e', l:'Entity', fmt:(p)=> html`<${EntBtn} id=${p[1]} go=${(e)=> go(X.ent(e))}/>`, sv:(p)=> p[1] },
            { k:'s', l:'Source', fmt:(p)=> html`<${Pill} tone=${p[5]==='AI'? 'g' : 'n'}>${p[5]}</${Pill}>` },
            { k:'r', l:'Risk', fmt:(p)=> html`<${Pill} tone=${riskTone(p[4])}>${p[4]}</${Pill}>`, sv:(p)=> ({ High:3, Medium:2, Low:1 })[p[4]] },
            { k:'v', l:'₹ Cr', r:true, fmt:(p)=> p[3], sv:(p)=> +p[3] } ]}/>
          <p class="px-note" style=${{ padding:'0 12px 10px' }}>Total of these ${J.pending.length}: <b>${cr(pendVal)}</b></p></${P.Card}>
        <${P.Card} title=${'IN-07 clinical-trial accruals (AI-drafted) · '+cr(in07)} className="flush">
          <${P.Table} rows=${J.in07} rowKey=${(x)=> x[0]} caption="IN-07 accrual drafts" dense=${true} limit=${8} rowClick=${true} onOpen=${()=> go(X.ent('IN-07'))} cols=${[
            { k:'s', l:'Site or service', w:'48%', fmt:(x)=> html`<b class="nb">${x[0]}</b>`, sv:(x)=> x[0] },
            { k:'b', l:'Basis', fmt:(x)=> x[1] }, { k:'v', l:'₹ Cr', r:true, fmt:(x)=> x[2].toFixed(2), sv:(x)=> x[2] } ]}/></${P.Card}>
      </${Grid}></${Fragment}>`;
  };
  /* one journal: what flagged it or what it waits for, and everything else on file for its entity */
  const JournalView = ({ id, go })=>{
    const j = allJnl().find(x=> x.id===id); if(!j) return html`<${P.Empty} text="Journal not found."/>`;
    const same = allJnl().filter(x=> x.e===j.e && x.id!==j.id), ctls = ctlsOf(j.e).filter(c=> /journal|suspense/i.test(c[1]));
    const thr = R.thresholds.find(t=> /anomaly/i.test(t[0]));
    return html`<${Fragment}>
      <${Stats}>
        <${Stat} label="Entity" value=${j.e} sub=${(M.E[j.e]||{}).name}/>
        ${j.kind==='anomaly'? html`<${Stat} label="Anomaly score" value=${j.score.toFixed(2)} tone=${j.score>=0.9? 'r' : 'a'} sub=${'Flag threshold '+thr[1]+' (set '+thr[2]+')'}/>
          <${Stat} label="Status" value=${j.ex? (FCT.isOpen(FCT.ex(j.ex))? 'Open case' : 'Resolved') : 'For review'} tone=${anomOpen([0,0,0,0,j.ex])? 'a' : 'g'} sub=${j.ex || 'No case raised'}/>`
        : html`<${Stat} label="Value" value=${cr(j.val)} sub="Waiting for approval"/><${Stat} label="Risk" value=${j.risk} tone=${riskTone(j.risk)} sub=${j.risk==='High'? 'Needs a named reviewer' : 'Eligible for bulk approval'}/><${Stat} label="Source" value=${j.src==='AI'? 'AI-drafted' : 'Manual'}/>`}
      </${Stats}>
      <${Grid}>
        <${P.Card} title=${j.kind==='anomaly'? 'Why it was flagged' : 'What it books'}><p class="px-p" style=${{ marginTop:0 }}>${j.kind==='anomaly'? j.why : j.desc}</p>
          <div class="px-note">${j.ex && html`<${Open} id=${j.ex}/>`}<${ProfileBtn} id=${j.e} go=${(e)=> go({ t:'eprofile', id:e, label:ename(e) })}/>
            <button type="button" class="btn sm" onClick=${()=> go(X.ent(j.e))}>All ${j.e} journals</button></div></${P.Card}>
        <${P.Card} title=${'Other journals on file for '+j.e}><${List} empty="No other anomalous or pending journals for this entity." rows=${same.map(x=> [x.id, x.kind==='anomaly'? 'Anomaly '+x.score.toFixed(2)+' · '+x.why : 'Pending · '+x.desc+' · '+cr(x.val), html`<${Pill} tone=${x.kind==='anomaly'? 'a' : 'n'}>${x.kind==='anomaly'? 'Anomaly' : 'Pending'}</${Pill}>`, ()=> go(X.jnl(x.id))])}/></${P.Card}>
      </${Grid}>
      ${ctls.length>0 && html`<${P.Card} title=${'Journal controls failing at '+j.e}><${CtlList} rows=${ctls}/></${P.Card}>`}</${Fragment}>`;
  };
  const JournalEntity = ({ id, go })=>{
    const js = allJnl().filter(x=> x.e===id), an = js.filter(x=> x.kind==='anomaly'), pe = js.filter(x=> x.kind==='pending'), in07 = id==='IN-07'? R.journals.in07 : [];
    return html`<${Fragment}>
      <${Stats}><${Stat} label="Anomalous journals" value=${an.length} tone=${an.length? 'a' : 'g'} sub=${an.filter(x=> anomOpen([0,0,0,0,x.ex])).length+' unresolved'}/>
        <${Stat} label="Pending (top 6 sample)" value=${pe.length} sub=${cr(sum(pe, x=> x.val))}/>
        ${in07.length>0 && html`<${Stat} label="AI accrual drafts" value=${in07.length} sub=${cr(sum(in07, x=> x[2]))+' awaiting review'}/>`}
        <${Stat} label="Failing R2R controls" value=${ctlsOf(id).length} tone=${ctlsOf(id).length? 'r' : 'g'}/></${Stats}>
      <${Grid}>
        <${P.Card} title="Journals"><${List} empty="No anomalous or pending journals for this entity." rows=${js.map(x=> [x.id, x.kind==='anomaly'? x.why : x.desc+' · '+cr(x.val), html`<${Pill} tone=${x.kind==='anomaly'? 'a' : 'n'}>${x.kind==='anomaly'? 'Anomaly '+x.score.toFixed(2) : 'Pending'}</${Pill}>`, ()=> go(X.jnl(x.id))])}/>
          <div class="px-note"><${ProfileBtn} id=${id} go=${(e)=> go({ t:'eprofile', id:e, label:ename(e) })}/></div></${P.Card}>
        <${P.Card} title="Failing R2R controls"><${CtlList} rows=${ctlsOf(id)}/></${P.Card}>
      </${Grid}>
      ${in07.length>0 && html`<${P.Card} title="Clinical-trial accrual drafts" className="flush"><${P.Table} rows=${in07} rowKey=${(x)=> x[0]} caption="Accrual drafts" dense=${true} cols=${[{ k:'s', l:'Site or service', fmt:(x)=> html`<b class="nb">${x[0]}</b>` }, { k:'b', l:'Basis', fmt:(x)=> x[1] }, { k:'v', l:'₹ Cr', r:true, fmt:(x)=> x[2].toFixed(2), sv:(x)=> x[2] }]}/></${P.Card}>`}</${Fragment}>`;
  };
  const SourceView = ({ id, go })=>{
    const pe = allJnl().filter(x=> x.kind==='pending' && x.src===id), extra = id==='AI'? R.journals.in07 : [];
    return html`<${Fragment}>
      <${Stats}><${Stat} label="Pending journals (top 6 sample)" value=${pe.length} sub=${cr(sum(pe, x=> x.val))}/>${id==='AI' && html`<${Stat} label="AI accrual drafts, IN-07" value=${extra.length} sub=${cr(sum(extra, x=> x[2]))}/><${Stat} label="Recurring candidates" value=${R.journals.recurringCandidates} sub="RC-05 automation pipeline"/>`}</${Stats}>
      <${P.Card} title=${(id==='AI'? 'AI-drafted' : 'Manual')+' journals waiting for approval'}><${List} rows=${pe.map(x=> [x.id, x.e+' · '+x.desc, html`<${Fragment}><${Pill} tone=${riskTone(x.risk)}>${x.risk}</${Pill}> <b class="num">${cr(x.val)}</b></${Fragment}>`, ()=> go(X.jnl(x.id))])}/></${P.Card}></${Fragment}>`;
  };

  /* ======================= Intercompany & consolidation ======================= */
  const IntercompanyRoot = ({ go })=>{
    const I = R.ic, pairs = icPairs();
    const ok = pairs.filter(p=> p.agreed), bad = pairs.filter(p=> !p.agreed), gross = sum(pairs, p=> p.ar), okVal = sum(ok, p=> p.ar);
    const brk = pairs.filter(p=> !p.unconf && !p.agreed), breakVal = sum(brk, p=> Math.abs(p.diff)), unconfVal = sum(pairs.filter(p=> p.unconf), p=> p.ar);
    const steps = I.consol, done = steps.filter(s=> s[2]==='Done').length;
    const fx = I.fx.map(r=> ({ pair:r[0], open:+r[1], close:+r[2], chg:(r[2]-r[1])/r[1]*100 }));
    const byRes = [['Agreed', okVal, COL.pos, ok.length], ['Unconfirmed', unconfVal, COL.high, pairs.filter(p=> p.unconf).length], ['Break', sum(brk, p=> p.ar), COL.crit, brk.length]]
      .map(([k, v, tone, n])=> ({ key:k, label:k, val:v, tone, sub:n+(n===1? ' pair' : ' pairs') }));
    return html`<${Fragment}>
      <${Stats}>
        <${Stat} label="IC pair agreement" value=${pc(ok.length/pairs.length*100)} tone=${bad.length? 'a' : 'g'} sub=${ok.length+' of '+pairs.length+' pairs within ₹10 L'} title="Pairs confirmed and within threshold ÷ all pairs"/>
        <${Stat} label="Value agreed" value=${pc(okVal/gross*100)} sub=${cr(okVal)+' of '+cr(gross)} title="Receivable value of agreed pairs ÷ all IC receivables"/>
        <${Stat} label="Unexplained IC break" value=${amt(breakVal)} tone=${breakVal? 'r' : 'g'} sub="Differences above ₹10 L"/>
        <${Stat} label="Unconfirmed balances" value=${amt(unconfVal)} tone=${unconfVal? 'a' : 'g'} sub="Counterparty has not reconciled"/>
        <${Stat} label="Consolidation progress" value=${done+' of '+steps.length} tone=${done<steps.length? 'a' : 'g'} sub=${pc(done/steps.length*100,0)+' of steps done'}/>
      </${Stats}>
      <${Grid}>
        <${P.Card} title="IC pairs, September" className="flush"><${Sub}>Receivable side vs payable side, ₹ Cr. Unconfirmed pairs count as not agreed. Select a pair to drill in.</${Sub}>
          <${P.Table} rows=${pairs.slice().sort((x,y)=> x.agreed-y.agreed || y.ar-x.ar)} rowKey=${(p)=> p.id} caption="IC pairs" dense=${true} rowClick=${true} onOpen=${(p)=> go(X.pair(p.id))} cols=${[
            { k:'p', l:'Pair', fmt:(p)=> html`<b class="nb">${p.a} ↔ ${p.b}</b><div class="sub">${p.ccy}</div>`, sv:(p)=> p.id },
            { k:'ar', l:'Receivable', r:true, fmt:(p)=> p.ar.toFixed(2), sv:(p)=> p.ar }, { k:'ap', l:'Payable', r:true, fmt:(p)=> p.ap.toFixed(2), sv:(p)=> p.ap },
            { k:'d', l:'Difference', r:true, fmt:(p)=> p.diff? html`<${Tone} tone=${!p.agreed && !p.unconf? 'r' : null}>${p.diff.toFixed(2)}</${Tone}>` : html`<span class="faint">—</span>`, sv:(p)=> p.diff },
            { k:'n', l:'Reason', fmt:(p)=> p.note },
            { k:'s', l:'Result', fmt:(p)=> html`<${Pill} tone=${p.agreed? 'g' : p.unconf? 'a' : 'r'}>${resOf(p)}</${Pill}>` } ]}/></${P.Card}>
        <div class="px-grid" style=${{ alignContent:'start' }}>
          <${P.Card} title="Consolidation steps"><${List} rows=${steps.map(s=> [s[0], s[1], html`<${Pill} tone=${s[2]==='Done'? 'g' : 'a'}>${s[2]}</${Pill}>`, /IC eliminations/.test(s[0])? ()=> go(X.res('Not agreed')) : null])}/>
            <p class="px-note">The tracker counts 5 of 6 pairs matched on amount. IN-07 ↔ IN-01 agrees on amount but is unconfirmed (owner on leave), so it is not agreed for elimination.</p></${P.Card}>
          <${P.Card} title="Translation rates"><${List} rows=${fx.map(r=> [r.pair, r.open.toFixed(2)+' → '+r.close.toFixed(2)+' (closing)', html`<b class="num">${sgn(r.chg, v=> pc(v,2))}</b>`])}/>
            <p class="px-note">The rupee weakened in September, lifting the INR value of foreign-currency IC balances; part of the IN-02 ↔ US-01 break is timing and FX.</p></${P.Card}>
        </div></${Grid}>
      <${Grid}>
        <${P.Card} title="IC value by result"><${P.BarList} rows=${byRes} fmt=${(v)=> cr(v)} label="IC value by result" onSelect=${(r)=> go(X.res(r.key))} onOpen=${(r)=> go(X.res(r.key))}/></${P.Card}>
        <${P.Card} title="What blocks elimination"><${List} empty="All pairs agreed." rows=${bad.map(p=> [p.a+' ↔ '+p.b, p.note+' · '+amt(p.unconf? p.ar : Math.abs(p.diff)), p.ex? html`<${Open} id=${p.ex}/>` : html`<${Pill} tone="a">Chase</${Pill}>`, ()=> go(X.pair(p.id))])}/></${P.Card}>
      </${Grid}></${Fragment}>`;
  };
  const PairView = ({ id, go })=>{
    const p = icPairs().find(x=> x.id===id); if(!p) return html`<${P.Empty} text="Pair not found."/>`;
    const ccy = (p.ccy.match(/^(USD|EUR)/)||[])[1], fx = ccy && R.ic.fx.find(r=> r[0].startsWith(ccy));
    const recs = R.recs.filter(r=> /IC receivable/.test(r.acc) && (r.entity===p.a || r.entity===p.b));
    const tasks = R.lateTasks.filter(t=> /^IC rec/.test(t.task) && t.task.includes(p.a) && t.task.includes(p.b));
    const ctls = R.failing.filter(c=> /IC/.test(c[1]) && (c[2]===p.a || c[2]===p.b));
    const step = R.ic.consol.find(s=> /IC eliminations/.test(s[0]));
    return html`<${Fragment}>
      <${Stats}><${Stat} label="Receivable" value=${cr(p.ar)} sub=${p.a+' books'}/><${Stat} label="Payable" value=${cr(p.ap)} sub=${p.b+' books'}/>
        <${Stat} label="Difference" value=${p.diff? amt(Math.abs(p.diff)) : 'None'} tone=${!p.agreed && !p.unconf? 'r' : null} sub="Threshold ₹10 L"/>
        <${Stat} label="Result" value=${resOf(p)} tone=${p.agreed? 'g' : p.unconf? 'a' : 'r'} sub=${p.note}/>
        ${fx && html`<${Stat} label=${fx[0]+' closing'} value=${fx[2]} sub=${'Opening '+fx[1]+' · balance '+p.ccy}/>`}</${Stats}>
      <${Grid}>
        <${P.Card} title="Both sides"><${List} rows=${[[ename(p.a), 'Receivable side · '+cr(p.ar), html`<${Pill} tone="n">Entity</${Pill}>`, isEnt(p.a)? ()=> go({ t:'eprofile', id:p.a, label:ename(p.a) }) : null],
            [ename(p.b), 'Payable side · '+cr(p.ap), html`<${Pill} tone="n">Entity</${Pill}>`, isEnt(p.b)? ()=> go({ t:'eprofile', id:p.b, label:ename(p.b) }) : null]]}/>
          <div class="px-note">${p.ex && html`<${Open} id=${p.ex}/>`}<span class="faint">Elimination step: ${step[1]} (${step[2]}).</span></div></${P.Card}>
        <${P.Card} title="IC reconciliations"><${List} empty="No IC reconciliation for this pair in the close sample." rows=${recs.map(r=> [r.acc+' · '+r.entity, 'GL '+cr(r.gl)+' · sub-ledger '+cr(r.sub)+(r.diff? ' · unexplained '+amt(r.diff) : '')+' · preparer '+r.prep, html`<${Fragment}><${Pill} tone=${r.status==='Break'? 'r' : 'a'}>${r.status}</${Pill}><${Open} id=${r.ex}/></${Fragment}>`])}/></${P.Card}>
      </${Grid}>
      <${Grid}>
        <${P.Card} title="Close tasks for this pair"><${List} empty="No late IC reconciliation task for this pair." rows=${tasks.map(t=> [t.task, 'Due '+t.due+' · owner '+t.owner+' · '+t.action, html`<${Pill} tone=${t.late? 'r' : 'a'}>${t.status}</${Pill}>`])}/></${P.Card}>
        <${P.Card} title="IC controls failing"><${CtlList} rows=${ctls}/></${P.Card}>
      </${Grid}></${Fragment}>`;
  };
  const ResultView = ({ id, go })=>{
    const ps = icPairs().filter(p=> id==='Not agreed'? !p.agreed : resOf(p)===id);
    return html`<${Fragment}><${Stats}><${Stat} label="Pairs" value=${ps.length}/><${Stat} label="Receivable value" value=${cr(sum(ps, p=> p.ar))}/><${Stat} label="Net difference" value=${amt(Math.abs(sum(ps, p=> p.diff)))}/></${Stats}>
      <${P.Card} title=${id+' pairs'}><${List} rows=${ps.map(p=> [p.a+' ↔ '+p.b, p.note+' · '+p.ccy, html`<${Pill} tone=${p.agreed? 'g' : p.unconf? 'a' : 'r'}>${resOf(p)}</${Pill}>`, ()=> go(X.pair(p.id))])}/></${P.Card}></${Fragment}>`;
  };
  const IcEntity = ({ id, go })=>{
    const ps = icPairs().filter(p=> p.a===id || p.b===id), mp = R.settings.mapping.find(m=> m[0]===id), um = R.settings.unmapped.filter(u=> u[0]===id);
    return html`<${Fragment}><${Stats}><${Stat} label="IC pairs" value=${ps.length} sub=${ps.filter(p=> p.agreed).length+' agreed'}/><${Stat} label="Account mapping" value=${mp? pc(mp[2]) : 'N/A'} sub=${mp? mp[1] : ''}/><${Stat} label="Failing R2R controls" value=${ctlsOf(id).length} tone=${ctlsOf(id).length? 'r' : 'g'}/></${Stats}>
      <${Grid}><${P.Card} title="IC pairs"><${List} rows=${ps.map(p=> [p.a+' ↔ '+p.b, p.note+' · '+cr(p.ar), html`<${Pill} tone=${p.agreed? 'g' : p.unconf? 'a' : 'r'}>${resOf(p)}</${Pill}>`, ()=> go(X.pair(p.id))])}/>
          <div class="px-note"><${ProfileBtn} id=${id} go=${(e)=> go({ t:'eprofile', id:e, label:ename(e) })}/></div></${P.Card}>
        <${P.Card} title="Unmapped accounts"><${List} empty="All accounts mapped." rows=${um.map(u=> [u[1], u[2], html`<b class="num">${pc(u[3]*100,0)}</b>`])}/></${P.Card}></${Grid}></${Fragment}>`;
  };

  /* ======================= Reporting & sign-off ======================= */
  const packState = ()=>{
    const mat = matVars(), unsigned = mat.filter(v=> v.status!=='Signed'), disc = R.disclosure, discDone = disc.filter(d=> d[2]==='Done').length;
    const pairs = icPairs(), icOk = pairs.filter(p=> p.agreed).length, tie = FCT.ex('RTR-PCK-11'), tieOpen = !!tie && FCT.isOpen(tie), an = R.anomalies.filter(anomOpen).length, rc = recCases();
    return { tb:[true, '10 of 10 entity trial balances received'], tie:[!tieOpen, tieOpen? '₹1.18 Cr break on other opex (RTR-PCK-11)' : 'Ties to trial balance'],
      var:[!unsigned.length, (mat.length-unsigned.length)+' of '+mat.length+' material variances signed'], jnl:[!an, an+' of '+R.anomalies.length+' anomalous journals unresolved'],
      ic:[icOk===pairs.length, icOk+' of '+pairs.length+' IC pairs agreed'], bal:[!rc.length, rc.length+' reconciliation cases awaiting a decision'], disc:[discDone===disc.length, discDone+' of '+disc.length+' disclosures done'] };
  };
  const ReportingRoot = ({ go })=>{
    const line = (n)=> R.pnl.find(r=> r[0]===n), eb = line('EBITDA'), rev = line('Revenue');   // [line, actual, budget, prior year]
    const ebVsBud = eb[1]-eb[2], ebVsPy = (eb[1]-eb[3])/eb[3]*100, margin = eb[1]/rev[1]*100, marginBud = eb[2]/rev[2]*100;
    const drivers = R.bridge.slice(1, -1), gap = +(R.bridge[R.bridge.length-1][1]-R.bridge[0][1]-sum(drivers, d=> d[1])).toFixed(2);
    const mat = matVars(), signed = mat.filter(v=> v.status==='Signed'), disc = R.disclosure, discDone = disc.filter(d=> d[2]==='Done').length, judg = R.judgements, jOpen = judg.filter(j=> j[4]==='Open');
    const pack = packState(), ready = R.packItems.filter(p=> pack[p[1]][0]).length;
    let run = R.bridge[0][1];
    const wf = R.bridge.map((b, i)=>{ const end = i===0 || i===R.bridge.length-1; if(end) return { n:b[0], base:0, v:b[1], d:b[1], c:COL.brand2, end };
      const s = run; run += b[1]; return { n:b[0], base:Math.min(s, run), v:Math.abs(b[1]), d:b[1], c: b[1]<0? COL.crit : COL.pos }; });
    const COST = (n)=> !['Revenue','Gross margin','EBITDA'].includes(n);
    return html`<${Fragment}>
      <${Stats}>
        <${Stat} label="EBITDA vs budget" value=${sgn(ebVsBud/eb[2]*100, v=> pc(v))} tone=${ebVsBud<0? 'a' : 'g'} sub=${cr(eb[1],1)+' vs '+cr(eb[2],1)+' · '+sgn(ebVsPy, v=> pc(v))+' vs PY'}/>
        <${Stat} label="EBITDA margin" value=${pc(margin)} tone=${margin<marginBud? 'a' : 'g'} sub=${'Budget '+pc(marginBud)+' · '+sgn((margin-marginBud)*100, v=> FCT.n(v,0))+' bps'} title="EBITDA ÷ revenue"/>
        <${Stat} label="Variance commentary" value=${pc(signed.length/mat.length*100)} tone=${signed.length/mat.length<0.9? 'r' : 'g'} sub=${signed.length+' of '+mat.length+' variances ≥ ₹2 Cr signed'} title="Signed material variances ÷ material variances"/>
        <${Stat} label="Disclosure readiness" value=${pc(discDone/disc.length*100,0)} tone=${discDone<disc.length? 'a' : 'g'} sub=${discDone+' of '+disc.length+' Ind AS items done'}/>
        <${Stat} label="Open judgements" value=${FCT.n(jOpen.length)} tone=${jOpen.length? 'a' : 'g'} sub=${'of '+judg.length+' this quarter'}/>
        <${Stat} label="Pack readiness" value=${ready+' of '+R.packItems.length} tone=${ready<R.packItems.length? 'r' : 'g'} sub="Checks clear before release"/>
      </${Stats}>
      <${Grid}>
        <${P.Card} title="EBITDA bridge: budget to actual"><${Sub}>₹ Cr. Drivers sum to ${cr(sum(drivers, d=> d[1]),1)}; ${gap===0? 'the bridge reconciles with no unexplained gap.' : 'unexplained gap '+cr(gap,1)+'.'} Select a driver to drill in.</${Sub}>
          <${Chart} height=${250}><${Rc.BarChart} data=${wf} margin=${{ top:8, right:8, left:-4, bottom:0 }}>
            <${Rc.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${Rc.XAxis} dataKey="n" ...${axis} interval=${0} tick=${{ fontSize:10.5, fill:COL.ink3 }}/><${Rc.YAxis} ...${axis} width=${44} domain=${[440, 'auto']} allowDataOverflow=${true}/>
            <${Rc.Tooltip} ...${tip} formatter=${(v, k, p)=> k==='base'? [null, null] : [(p.payload.end? '' : p.payload.d>0? '+' : '')+p.payload.d.toFixed(1)+' Cr', 'Value']}/>
            <${Rc.Bar} dataKey="base" stackId="w" fill="transparent"/><${Rc.Bar} dataKey="v" stackId="w" radius=${[3,3,0,0]} cursor="pointer" onClick=${(d)=> d && !d.end && go(X.drv(d.n))}>${wf.map((d, i)=> h(Rc.Cell, { key:i, fill:d.c }))}</${Rc.Bar}></${Rc.BarChart}></${Chart}>
          <div class="px-legend" style=${{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>${drivers.map(d=> html`<button key=${d[0]} type="button" class="px-link sm" onClick=${()=> go(X.drv(d[0]))}>${d[0]} ${sgn(d[1], x=> x.toFixed(1))}</button>`)}</div></${P.Card}>
        <${P.Card} title=${'Management pack checklist · '+ready+' of '+R.packItems.length+' clear'}>
          <${List} rows=${R.packItems.map(p=>{ const s = pack[p[1]]; return [p[0], s[1], html`<${Pill} tone=${s[0]? 'g' : 'r'}>${s[0]? 'Clear' : 'Open'}</${Pill}>`, ()=> go(X.chk(p[1]))]; })}/></${P.Card}>
      </${Grid}>
      <${Grid}>
        <${P.Card} title="Material variances" className="flush"><${Sub}>Variance against budget of ₹2 Cr or more, ₹ Cr. Select a row to drill in.</${Sub}>
          <${P.Table} rows=${mat.slice().sort((a,b)=> (a.status==='Signed')-(b.status==='Signed') || Math.abs(b.var)-Math.abs(a.var))} rowKey=${(v)=> v.id} caption="Material variances" dense=${true} rowClick=${true} onOpen=${(v)=> go(X.vr(v.id))} cols=${[
            { k:'l', l:'Line', w:'40%', fmt:(v)=> html`<b class="nb">${v.line}</b><div class="sub">${v.id} · ${v.entity}</div>`, sv:(v)=> v.line },
            { k:'v', l:'Variance', r:true, fmt:(v)=> html`<${Tone} tone=${v.var<0? 'r' : null}>${sgn(v.var, x=> x.toFixed(1))}</${Tone}> <span class="faint">${v.pct}</span>`, sv:(v)=> v.var },
            { k:'s', l:'Commentary', fmt:(v)=> html`<${Pill} tone=${v.status==='Signed'? 'g' : v.status==='Edited'? 'a' : 'r'}>${v.status}</${Pill}>${v.conf? html` <span class="faint">AI ${Math.round(v.conf*100)}%</span>` : ''}`, sv:(v)=> v.status } ]}/></${P.Card}>
        <${P.Card} title="P&L, September" className="flush"><${Sub}>₹ Cr. Adverse movements in red.</${Sub}>
          <${P.Table} rows=${R.pnl} rowKey=${(r)=> r[0]} caption="P&L" dense=${true} cols=${[
            { k:'l', l:'Line', fmt:(r)=> ['Gross margin','EBITDA'].includes(r[0])? html`<b>${r[0]}</b>` : r[0] },
            { k:'a', l:'Actual', r:true, fmt:(r)=> r[1].toFixed(1), sv:(r)=> r[1] }, { k:'b', l:'Budget', r:true, fmt:(r)=> r[2].toFixed(1), sv:(r)=> r[2] },
            { k:'d', l:'vs budget', r:true, fmt:(r)=>{ const d = r[1]-r[2], bad = COST(r[0])? d>0 : d<0; return html`<${Tone} tone=${bad? 'r' : 'g'}>${sgn(d, x=> x.toFixed(1))}</${Tone}>`; }, sv:(r)=> r[1]-r[2] },
            { k:'p', l:'Prior year', r:true, fmt:(r)=> r[3].toFixed(1), sv:(r)=> r[3] } ]}/></${P.Card}>
      </${Grid}>
      <${Grid}>
        <${P.Card} title=${'Ind AS disclosure checklist · '+discDone+' of '+disc.length+' done'}><${List} rows=${disc.map(d=> [d[0], d[1], html`<${Pill} tone=${d[2]==='Done'? 'g' : 'a'}>${d[2]}</${Pill}>`])}/></${P.Card}>
        <${P.Card} title=${'Accounting judgements · '+jOpen.length+' open'}><${List} rows=${judg.slice().sort((a,b)=> (a[4]==='Closed')-(b[4]==='Closed')).map(j=> [j[1], j[0]+' · '+j[2]+' · '+j[3], html`<${Pill} tone=${j[4]==='Open'? 'a' : 'g'}>${j[4]}</${Pill}>`, ()=> go(X.jr(j[0]))])}/></${P.Card}>
      </${Grid}></${Fragment}>`;
  };
  const VarianceView = ({ id, go })=>{
    const v = R.variances.find(x=> x.id===id), drv = driverOf(v), rcs = v.ex? R.rootCauses.filter(r=> r.linked.includes(v.ex)) : [];
    const thr = R.thresholds.find(t=> /variance/i.test(t[0])), peers = R.variances.filter(x=> x.entity===v.entity && x.id!==v.id);
    return html`<${Fragment}>
      <${Stats}><${Stat} label="Variance vs budget" value=${sgn(v.var, x=> cr(x,1))} tone=${v.var<0? 'r' : 'g'} sub=${v.pct+' against budget'}/>
        <${Stat} label="Entity" value=${v.entity} sub=${isEnt(v.entity)? M.E[v.entity].name : 'Group-level line'}/>
        <${Stat} label="Commentary" value=${v.status} tone=${v.status==='Signed'? 'g' : 'a'} sub=${Math.abs(v.var)>=MAT? 'Material: ≥ '+thr[1] : 'Below '+thr[1]+', no sign-off needed'}/>
        ${drv && html`<${Stat} label="Bridge driver" value=${drv[0]} sub=${sgn(drv[1], x=> cr(x,1))+' of EBITDA bridge'}/>`}</${Stats}>
      <${Grid}>
        <${P.Card} title="Commentary">${v.draft? html`<p class="px-p" style=${{ marginTop:0 }}>${v.draft}</p><${List} rows=${v.drivers.map(d=> [d, '', html`<${Pill} tone="n">Driver</${Pill}>`])}/><p class="px-note">AI draft, confidence ${Math.round(v.conf*100)}%. Not counted as explained until signed.</p>`
            : html`<p class="px-p" style=${{ marginTop:0 }}>${v.status==='Signed'? 'Commentary signed by the line owner.' : v.status==='Edited'? 'Draft edited by the owner and awaiting signature.' : 'Draft awaiting the owner.'}</p>`}
          <div class="px-note">${v.ex && html`<${Open} id=${v.ex}/>`}<${ProfileBtn} id=${v.entity} go=${(e)=> go({ t:'eprofile', id:e, label:ename(e) })}/>${drv && html`<button type="button" class="btn sm" onClick=${()=> go(X.drv(drv[0]))}>Bridge driver: ${drv[0]}</button>`}</div></${P.Card}>
        <${P.Card} title="Root causes linked to this variance"><${List} empty="No root cause is linked to this variance." rows=${rcs.map(r=> [r.id+' '+r.cause, r.impact+' · owner '+r.owner+' · fix: '+r.fix, html`<${Pill} tone="a">${r.status}</${Pill}>`])}/></${P.Card}>
      </${Grid}>
      ${peers.length>0 && html`<${P.Card} title=${'Other variances at '+v.entity}><${List} rows=${peers.map(x=> [x.id+' '+x.line, sgn(x.var, y=> cr(y,1))+' · '+x.pct, html`<${Pill} tone=${x.status==='Signed'? 'g' : 'a'}>${x.status}</${Pill}>`, ()=> go(X.vr(x.id))])}/></${P.Card}>`}</${Fragment}>`;
  };
  const DriverView = ({ id, go })=>{
    const d = R.bridge.find(b=> b[0]===id), vs = R.variances.filter(v=> driverOf(v) && driverOf(v)[0]===id);
    const drivers = R.bridge.slice(1, -1), adverse = sum(drivers.filter(x=> x[1]<0), x=> x[1]);
    return html`<${Fragment}><${Stats}><${Stat} label="Impact on EBITDA" value=${sgn(d[1], x=> cr(x,1))} tone=${d[1]<0? 'r' : 'g'}/>
        ${d[1]<0 && html`<${Stat} label="Share of adverse drivers" value=${pc(d[1]/adverse*100,0)} sub=${'of '+cr(adverse,1)+' adverse'}/>`}
        <${Stat} label="Share of the budget gap" value=${pc(d[1]/(R.bridge[R.bridge.length-1][1]-R.bridge[0][1])*100,0)} sub="Positive means it widens the gap"/></${Stats}>
      <${P.Card} title="Variances explaining this driver"><${List} empty="No line-level variance is named after this driver in the data; it is explained at bridge level only." rows=${vs.map(v=> [v.id+' '+v.line, v.entity+' · '+sgn(v.var, y=> cr(y,1)), html`<${Pill} tone=${v.status==='Signed'? 'g' : 'a'}>${v.status}</${Pill}>`, ()=> go(X.vr(v.id))])}/></${P.Card}></${Fragment}>`;
  };
  const CheckView = ({ id, go })=>{
    const s = packState()[id], pairs = icPairs();
    const body = {
      tb: html`<${List} rows=${R.ic.consol.filter(c=> /trial balance|TB/i.test(c[0])).map(c=> [c[0], c[1], html`<${Pill} tone=${c[2]==='Done'? 'g' : 'a'}>${c[2]}</${Pill}>`])}/>`,
      tie: html`<${List} rows=${[['RTR-PCK-11 Pack does not tie to trial balance', FCT.ex('RTR-PCK-11').what, html`<${Open} id="RTR-PCK-11"/>`]]}/>`,
      var: html`<${List} empty="All material variances signed." rows=${matVars().filter(v=> v.status!=='Signed').map(v=> [v.id+' '+v.line, v.entity+' · '+sgn(v.var, y=> cr(y,1)), html`<${Pill} tone="a">${v.status}</${Pill}>`, ()=> go(X.vr(v.id))])}/>`,
      jnl: html`<${List} empty="All anomalous journals resolved." rows=${R.anomalies.filter(anomOpen).map(a=> [a[0], a[1]+' · '+a[3], html`<b class="num">${a[2].toFixed(2)}</b>`])}/><p class="px-note"><a class="btn sm" href=${FCT.href('screens/r2r/journals.html')}>Open Journals & anomalies</a></p>`,
      ic: html`<${List} empty="All IC pairs agreed." rows=${pairs.filter(p=> !p.agreed).map(p=> [p.a+' ↔ '+p.b, p.note, html`<${Pill} tone=${p.unconf? 'a' : 'r'}>${resOf(p)}</${Pill}>`])}/><p class="px-note"><a class="btn sm" href=${FCT.href('screens/r2r/intercompany.html')}>Open Intercompany & consolidation</a></p>`,
      bal: html`<${List} empty="No reconciliation case awaits a decision." rows=${recCases().map(r=> [r.acc+' · '+r.entity, 'Unexplained '+amt(r.diff)+' · '+FCT.ex(r.ex).title, html`<${Open} id=${r.ex}/>`])}/>`,
      disc: html`<${List} rows=${R.disclosure.filter(d=> d[2]!=='Done').map(d=> [d[0], d[1], html`<${Pill} tone="a">${d[2]}</${Pill}>`])}/>`
    }[id];
    return html`<${Fragment}><${Stats}><${Stat} label="Status" value=${s[0]? 'Clear' : 'Open'} tone=${s[0]? 'g' : 'r'} sub=${s[1]}/><${Stat} label="Release gate" value="Controller" sub=${R.gates.find(g=> /pack release/.test(g))}/></${Stats}>
      <${P.Card} title=${s[0]? 'Evidence' : 'What keeps this check open'}>${body}</${P.Card}></${Fragment}>`;
  };
  const JudgementView = ({ id })=>{
    const j = R.judgements.find(x=> x[0]===id), others = R.judgements.filter(x=> x[2]===j[2] && x[0]!==id), gate = R.gates.find(g=> /judgements/.test(g));
    return html`<${Fragment}><${Stats}><${Stat} label="Standard" value=${j[2]}/><${Stat} label="Owner" value=${j[3]}/><${Stat} label="Status" value=${j[4]} tone=${j[4]==='Open'? 'a' : 'g'}/>${j[5] && html`<${Stat} label="Linked to" value=${j[5]}/>`}</${Stats}>
      <${P.Card} title=${j[1]}><p class="px-p" style=${{ marginTop:0 }}>Decision gate: ${gate}. ${j[4]==='Open'? 'This judgement must be decided before the pack is released.' : 'Decided and documented.'}</p>
        ${others.length>0 && html`<${List} rows=${others.map(x=> [x[0]+' '+x[1], x[3], html`<${Pill} tone=${x[4]==='Open'? 'a' : 'g'}>${x[4]}</${Pill}>`])}/>`}</${P.Card}></${Fragment}>`;
  };

  /* ---------- screens, navigation and mount ---------- */
  const SCREENS = {
    journals:{ Root:JournalsRoot, title:'Journals & anomalies', icon:'BookOpen', lead:'How much of the September ledger is posted by hand, how clean those journals are, and what still waits for approval.',
      views:{ xjnl:JournalView, xent:JournalEntity, xsrc:SourceView } },
    intercompany:{ Root:IntercompanyRoot, title:'Intercompany & consolidation', icon:'GitCompare', lead:'Do both sides of every intercompany balance agree, and is the group ready to consolidate?',
      views:{ xpair:PairView, xres:ResultView, xent:IcEntity } },
    reporting:{ Root:ReportingRoot, title:'Reporting & sign-off', icon:'FileCheck', lead:'Are the September results explained, disclosed and ready to release?',
      views:{ xvar:VarianceView, xdrv:DriverView, xchk:CheckView, xjr:JudgementView } }
  };
  P.mountScreen = (key)=>{ const S = SCREENS[key];
    const fresh = ()=> ({ kpi:key, path:[{ t:'xroot', label:S.title }], sel:null });
    const init = ()=>{ const s = M.nav.decode(location.hash.slice(1)); return s && s.kpi===key && s.path[0] && s.path[0].t==='xroot'? s : fresh(); };
    function App(){
      const [nav, dispatch] = useReducer(M.nav.reduce, null, init), f = M.defaults;
      useEffect(()=>{ try{ history.replaceState(null, '', location.pathname + location.search + '#' + M.nav.encode(nav)); }catch(e){} }, [nav]);
      const top = M.nav.top(nav), go = (node)=> dispatch({ t:'drill', node });
      const goDoc = (id)=> go(P.rnode.doc(id)), goCase = (id)=> go(P.rnode.case(id)), goE = (id)=> go(P.rnode.profile(id));
      const V = S.views[top.t], detail = nav.path.length>1;
      let body = null;
      if(V) body = html`<${V} id=${top.id} go=${go}/>`;
      else if(top.t==='eprofile') body = html`<${P.EntityProfile} id=${top.id} f=${f} ctx=${null} onDoc=${goDoc} onCase=${goCase}/>`;
      else if(top.t==='doc') body = html`<${P.RDocView} id=${top.id} onEntity=${goE} onCase=${goCase} onDoc=${goDoc}/>`;
      else if(top.t==='case') body = html`<${P.RCaseView} id=${top.id} onDoc=${goDoc} onEntity=${goE} onCase=${goCase}/>`;
      const icon = (P.NODE[top.t]||[])[0] || S.icon;
      return html`<div class="px-scr k-teal"><${P.ScreenTabs} on=${key}/>
        <${P.GlobalCrumb} root=${{ kind:'Overview', label:'KPI sheet', icon:'Gauge', go:()=>{ location.href = FCT.href('screens/r2r/desk.html#sheet'); } }} nav=${nav} dispatch=${dispatch} show=${true}/>
        <${P.RViewTabs} on=${key}/>
        ${detail? html`<section class="px-panel px-detail k-teal" aria-label=${top.label}><header class="px-ph"><div class="px-pt"><div class="px-pt-t"><h1><span class="px-h-i"><${Icon} n=${icon} size=${20} strokeWidth=${1.6}/></span>${top.label}</h1><p>${S.title} · Sep-26 close</p></div>
              <div class="px-pm"><span class="px-tag">Sep-26</span><a class="px-link sm" href=${FCT.href('screens/r2r/desk.html#sheet')}>R2R scorecard</a></div></div></header>
            <${P.PanelBody} depth=${nav.path.length} sig=${nav.path.length+':'+top.t+':'+(top.id||'')} reset=${nav.path.length}>${body}</${P.PanelBody}></section>`
          : html`<main class="px-page wide k-teal" aria-label=${'R2R '+S.title}><div class="px-page-h"><h1>${S.title}</h1><p>${S.lead+' Sep-26 close; illustrative data. Part of the R2R scorecard: select any row, bar or check to drill in.'}</p></div>
            <${S.Root} go=${go}/></main>`}</div>`;
    }
    P.mount(App);
  };
})();
