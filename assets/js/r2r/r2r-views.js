/* FCT demo — R2R control tower v2: views shared by the three R2R screens (Control tower, Entity profiles, Process chain).
   Built on the shared tower components in assets/js/p2p/p2p-ui.js (window.P2P) reading the R2R engine (window.R2RM).
   KpiBoard (KPI sheet) · Investigate (KPI detail router: root → group → entity → Entity Profile → record / case) · EntityProfile · DocView · CaseView. */
(function(){
  const P = window.P2P, { html, h, R, COL, Icon, cx } = P, M = window.R2RM, C = M.C, FCT = window.FCT, D = window.FCT_DATA;
  const { useState, useEffect, Fragment } = React;
  const { cr, amt, pct } = P;
  window.R2R = P;

  /* ---------- tower identity: command bar, storage, accents and icons for R2R KPIs, breadcrumb labels ---------- */
  P.TOWER = { code:'R2R', name:'Record to report', base:'screens/r2r/', tabs:[['entities','Entity profiles','Building2'],['desk','Scorecard','Gauge'],['process','Process chain','Layers']] };
  /* R2R view tabs: the KPI sheet and its three child screens; shown between the breadcrumb and the content on each of them */
  P.RViewTabs = ({ on, onSheet })=> html`<nav class="px-tabs" aria-label="R2R views" style=${{ margin:0 }}>${[['sheet', 'KPI sheet', 'Gauge', 'desk.html#sheet'], ['journals', 'Journals & anomalies', 'BookOpen', 'journals.html'], ['intercompany', 'Intercompany & consolidation', 'GitCompare', 'intercompany.html'], ['reporting', 'Reporting & sign-off', 'FileCheck', 'reporting.html']].map(([k, t, ic, href])=>
    html`<a key=${k} class=${on===k? 'on' : ''} aria-current=${on===k? 'page' : undefined} href=${FCT.href('screens/r2r/'+href)} onClick=${k==='sheet' && onSheet? (e)=>{ e.preventDefault(); onSheet(); } : undefined} style=${{ display:'inline-flex', alignItems:'center', gap:6 }}><${Icon} n=${ic} size=${14}/>${t}</a>`)}</nav>`;
  P.SKEY = 'fct-r2r-';
  Object.assign(P.KTHEME, { progress:'blue', jmix:'blue', topacc:'blue', jpend:'violet', unrec:'violet', adj:'amber', entmix:'amber', mapq:'amber', entities:'amber',
    tasks:'green', recs:'green', jnl:'green', ic:'green', var:'green' });
  Object.assign(P.KICON, { progress:'CalendarClock', jpend:'BookOpen', unrec:'GitCompare', adj:'TriangleAlert', entmix:'Building2', jmix:'Layers', topacc:'Landmark',
    tasks:'ListChecks', recs:'GitCompare', jnl:'BookOpen', ic:'Handshake', var:'FileCheck', mapq:'Link2', entities:'Building2' });
  Object.assign(P.NODE, { entity:['Building2','Entity'], eprofile:['Building2','Entity Profile'] });
  /* Lucide v0.441.0 icons used only by R2R (ISC licence) */
  Object.assign(window.SC_ICONS, {
    Database:[['ellipse',{cx:'12',cy:'5',rx:'9',ry:'3'}],['path',{d:'M3 5V19A9 3 0 0 0 21 19V5'}],['path',{d:'M3 12A9 3 0 0 0 21 12'}]],
    BookOpen:[['path',{d:'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'}],['path',{d:'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'}]],
    GitCompare:[['circle',{cx:'18',cy:'18',r:'3'}],['circle',{cx:'6',cy:'6',r:'3'}],['path',{d:'M13 6h3a2 2 0 0 1 2 2v7'}],['path',{d:'M11 18H8a2 2 0 0 1-2-2V9'}]],
    FileCheck:[['path',{d:'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'}],['path',{d:'M14 2v4a2 2 0 0 0 2 2h4'}],['path',{d:'m9 15 2 2 4-4'}]] });
  /* full names on R2R pages: visible text only; record and entity IDs (JE-IN05-…, IC-…, IN-05) are left as they are */
  const MONTHS = { Jan:'January', Feb:'February', Mar:'March', Apr:'April', May:'May', Jun:'June', Jul:'July', Aug:'August', Sep:'September', Oct:'October', Nov:'November', Dec:'December' };
  const ABBR = { 'R2R':'Record to Report', 'RTR':'Record to Report', 'P2P':'Procure to Pay', 'O2C':'Order to Cash', 'SC':'Supply Chain', 'KPIs':'key performance indicators', 'KPI':'key performance indicator',
    'JE':'Journal entry', 'JEs':'Journal entries', 'GL':'General ledger', 'IC':'Intercompany', 'FTR':'First-Time-Right', 'CoA':'chart of accounts', 'Recs':'Reconciliations', 'recs':'reconciliations', 'Rec':'Reconciliation',
    'AI':'Artificial intelligence', 'FX':'Foreign exchange', 'ERP':'Enterprise resource planning', 'ERP FI':'Enterprise resource planning (Finance)', 'FP&A':'Financial planning and analysis', 'AR':'Accounts receivable', 'AP':'Accounts payable',
    'P&L':'Profit and loss', 'HQ':'Headquarters', 'GRNI':'Goods received not invoiced', 'EBITDA':'Earnings before interest, tax, depreciation and amortisation', 'TB':'Trial balance', 'SoD':'Segregation of duties', 'DoA':'Delegation of authority',
    'CWIP':'Capital work in progress', 'GAAP':'Generally accepted accounting principles', 'NRV':'Net realisable value', 'SKUs':'stock keeping units', 'SKU':'stock keeping unit', 'USD':'United States dollar', 'INR':'Indian rupee', 'EUR':'Euro',
    'API':'Active pharmaceutical ingredient', 'POs':'Purchase orders', 'PO':'Purchase order', 'HRMS':'Human resource management system', 'TMS':'Treasury management system', 'ECL':'Expected credit loss', 'AMC':'Annual maintenance contract',
    'GIT':'Goods in transit', 'R&D':'Research and development', 'CRO':'Contract research organisation', 'POC':'Percentage of completion', 'vs':'versus', 'vs.':'versus', 'n.q.':'not quantified', 'N/A':'Not available', 'avg':'average', 'e.g.':'for example', 'approx.':'approximately', 'YTD':'Year to date', 'MTD':'Month to date', 'GR/IR':'Goods receipt / invoice receipt', 'SD/FI':'(Sales and distribution / Finance)', 'PMO':'Project management office' };
  const esc = (s)=> s.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&');
  const ABBR_RE = new RegExp('(?<![\\w/.\\-])('+Object.keys(ABBR).sort((a,b)=> b.length-a.length).map(esc).join('|')+')(?![\\w/&]|-[A-Z0-9])', 'g');
  const MRE = Object.keys(MONTHS).join('|');
  P.fullText = (s)=> s
    .replace(/\bWD\s?([+−-])\s?(\d+)\b/g, (_, sg, n)=> 'Working Day '+sg+n).replace(/\bWD\s?0\b/g, 'Working Day 0').replace(/\bWD\b/g, 'Working Day')
    .replace(/(\d)\s?Cr\b/g, '$1 crore').replace(/(\d)\s?L\b/g, '$1 lakh')
    .replace(new RegExp('\\b(\\d{1,2})-('+MRE+')-(\\d{4})\\b', 'g'), (_, d, m, y)=> d+' '+MONTHS[m]+' '+y)
    .replace(new RegExp('\\b(\\d{1,2})-('+MRE+')-(\\d{2})\\b', 'g'), (_, d, m, y)=> d+' '+MONTHS[m]+' 20'+y)
    .replace(new RegExp('\\b(\\d{1,2})-('+MRE+')\\b', 'g'), (_, d, m)=> d+' '+MONTHS[m])
    .replace(new RegExp('(?<![\\w-])('+MRE+')-(\\d{2})\\b', 'g'), (_, m, y)=> MONTHS[m]+' 20'+y)
    .replace(ABBR_RE, (m)=> ABBR[m])
    .replace(/(?<!\d{2}:\d{2} \()Working Day ([+−-]?)(\d+)(?! \(| · \d)/g, (all, sg, n)=>{ const k = (sg==='−' || sg==='-'? -1 : 1)*+n, d = P.wdCal(k); return d? all+' ('+d+')' : all; });
  /* calendar date of a working day for the close in view (records set P.wdMonth to their own close; default = latest close) */
  P.wdMonth = null;
  P.wdCal = (k)=>{ const M0 = window.R2RM; if(!M0 || !M0.X || !M0.X.wd) return null; const m = P.wdMonth!=null? P.wdMonth : M0.C.months.length-1, d = M0.X.wd(m, k); if(d==null) return null;
    const x = new Date(Date.UTC(2026, 3, 1) + d*864e5); return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][x.getUTCMonth()]+' '+x.getUTCDate(); };
  (function(){
    const run = ()=>{ const b = document.body; if(!b || !/^r2r\//.test(b.dataset.page||'')) return;
      const fix = (n)=>{ if(n.nodeType===3){ const p = n.parentNode; if(p && (/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName) || (p.closest && p.closest('.rail, [data-raw]')))) return; const v = n.nodeValue, x = P.fullText(v); if(x!==v) n.nodeValue = x; if(p && /inventor/i.test(n.nodeValue)) P.invTip(p); } else if(n.nodeType===1){ if(n.classList && n.classList.contains('rail')) return; for(let c = n.firstChild; c; c = c.nextSibling) fix(c); } };
      fix(b); document.title = P.fullText(document.title);
      new MutationObserver((ms)=> ms.forEach(m=> m.type==='characterData'? fix(m.target) : m.addedNodes.forEach(fix))).observe(b, { childList:true, subtree:true, characterData:true }); };
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', run); else run();
  })();
  /* "Inventory" hover: which stock is meant (materials, plant, book value at the latest month-end), taken from the nearest entity named around the word */
  const INV = { 'IN-01':[null,'Corporate office: no plant and no stock of its own'], 'IN-02':['API Manufacturing plant (North India)','Losartan and Valsartan active pharmaceutical ingredients, plus raw materials and work in progress'],
    'IN-03':['Formulations plant (North India)','Atorvastatin 20mg, Amlodipine 5mg and Pantoprazole 40mg tablets, plus packing material'], 'IN-04':['Life Science Ingredients plant (West India)','Vitamin B3 and choline chloride'],
    'IN-05':['Specialty Chemicals plant (West India)','Acetyl derivatives and pyridine bases; includes near-expiry stock under a provision review'], 'IN-06':['Nutrition plant (West India)','Whey blend and protein bars'],
    'IN-07':[null,'Contract research: lab consumables and trial materials only, no finished goods'], 'IN-08':['Distribution centre (South India)','Traded nutrition and over-the-counter products bought for resale'],
    'US-01':['US sales warehouse','US generics: ER tablets 500mg, Metformin XR 750mg, Valsartan 160mg'], 'EU-01':['Europe sales warehouse','Branded cardio and central nervous system range'] };
  const invBal = (e)=>{ const X = (window.R2RM||{}).X; if(!X || !X.recs) return null; const m = Math.max(...X.recs.map(r=> r.m)); const rs = X.recs.filter(r=> r.acct==='1410' && r.m===m && (!e || r.e===e)); return rs.length? rs.reduce((a,r)=> a+r.gl, 0) : null; };
  const invCr = (v)=> window.FCT && FCT.amt? FCT.amt(v) : '₹'+v.toFixed(2)+' crore';
  P.invHint = (e)=>{ const b = invBal(e);
    if(e && INV[e]){ const [site, what] = INV[e]; return 'Which inventory: '+e+(site? ' — '+site : '')+'\nMaterials: '+what+(b!=null? '\nBook value (account 1410 Inventory, latest month-end): '+invCr(b) : '\nNo inventory account balance'); }
    const ps = Object.keys(INV).filter(k=> INV[k][0]); return 'Which inventory: stock held across '+ps.length+' sites ('+ps.join(', ')+')\nMaterials: raw materials, work in progress, finished medicines, ingredients and traded goods'+(b!=null? '\nBook value (account 1410 Inventory, latest month-end, all entities): '+invCr(b) : '')+'\nOpen a row for one entity to see its plant and materials'; };
  const ENT_RE = /\b(IN-0[1-8]|US-01|EU-01)\b/;
  P.invTip = (el)=>{ let e = null; for(let a = el, i = 0; a && i < 10 && !e; a = a.parentElement, i++){ const t = a.textContent||''; if(t.length < 2500){ const m = t.match(ENT_RE); if(m) e = m[1]; } }
    if(!e){ const c = document.querySelector('.px-crumb, [class*="crumb"]'), m = c && (c.textContent||'').match(ENT_RE); if(m) e = m[1]; }
    const t = P.invHint(e); if(el.title !== t){ el.title = t; el.style.textDecoration = 'underline dotted'; el.style.cursor = 'help'; } };
  /* KPI glossary: a one-liner (what it means and what it contains) for every R2R KPI and headline stat; shown under board KPI names and on hover of any stat label */
  P.KLINE = { health:'One score out of 100 for the close, built from the six weighted KPIs below.',
    progress:'Close tasks done so far, against plan.',
    jpend:'Journals submitted but not yet approved, so they cannot post.',
    unrec:'Ledger balances not yet agreed to their support.',
    adj:'Estimated value that could be wrong in the books; not yet booked.',
    entmix:'Entities grouped by how likely they are to close late.',
    jmix:'Journals posted this close, by where they came from.',
    topacc:'Accounts receiving the most manual journal value.',
    tasks:'Share of close tasks finished on or before their planned working day.',
    recs:'Share of balance-sheet reconciliations certified on or before their due working day.',
    jnl:'Share of manual and AI-drafted journals posted with no control exception.',
    ic:'Share of intercompany items where both entities agree within ₹10 L.',
    var:'Share of material variances (₹2 Cr or more) with signed commentary by WD+2.',
    mapq:'Share of local accounts with a balance that are mapped to the group chart of accounts.' };
  P.KGLOSS = {
    'Data coverage':'Share of the health-score weight that has data; components without data are left out, not scored as perfect.', 'Band':'Health band from the score: Healthy 75+, Watch 55–74, At risk below 55.', 'Points lost':'100 minus the score: how far the close is from a perfect score.',
    'Tasks done':'Close tasks completed, out of all tasks for this close.', 'Behind plan':'Tasks past their planned day and not done.', 'Forecast close':'Working day the close is expected to finish, from progress so far.',
    'Journals waiting':'Journals submitted and waiting for approval.', 'Low-risk value':'Value of waiting journals the routing model rates safe for bulk approval.', 'AI drafts not submitted':'Journals drafted by AI that no one has submitted yet.',
    'Reconciliations open with a difference':'Uncertified reconciliations where ledger and support still differ.', 'Breaks above ₹10 L':'Reconciliations whose unexplained difference is above ₹10 L.', 'Certified':'Reconciliations signed off by a reviewer, out of all due.',
    'Adjustments proposed':'Case value proposed to the entity controller as an adjustment.', 'Adjustments booked':'Case value already booked as a journal.', 'Control value':'Value touched by control failures; not an adjustment estimate.', 'P&L decisions, all towers':'Profit-and-loss decisions waiting across all towers; overlaps, not added.',
    'Critical or high':'Entities in the critical or high close-risk categories.', 'Forecast after target':'Entities forecast to close after the target working day.',
    'Manual share':'Manual plus AI-drafted journals as a share of all journals posted.', 'AI-drafted':'Journals drafted by AI and posted.', 'Recurring candidates':'Manual journals that recur every month and could be automated.',
    'Top 10 share':'Share of manual journal value in the ten largest accounts.', 'Manual journal value':'Total value of manual and AI-drafted journals posted.', 'Largest':'Account with the most manual journal value.',
    'Denominator':'Number of records the rate is measured on.', 'Late or not certified':'Reconciliations certified after the due day, or still uncertified.', 'With an exception':'Journals with at least one control exception.', 'Close tasks due':'Close tasks planned to finish by the measurement day.', 'Late close tasks':'Close tasks still open past their planned day, or finished after it.', 'Journals reviewed':'Manual and AI-drafted journals posted this close, each checked against six controls.', 'Journals with a control failure':'Journals that failed at least one control: no support, approved after posting, self-approved, anomaly, corrected later or posted into a closed period.', 'Reconciliations not certified on time':'Reconciliations certified after their due day, or not certified at all.', 'Intercompany items':'Balances between two group entities in this close.', 'Unmatched intercompany items':'Items where the two entities do not agree within ₹10 L, or the counterparty has not confirmed.', 'Material variances':'Profit and loss lines that differ from budget by ₹2 Cr or more.', 'Unexplained variances':'Material variances with no signed commentary by WD+2.', 'Local accounts with a balance':'Entity-level accounts holding a balance this close.', 'Unmapped accounts':'Local accounts with no approved mapping to a group account.', 'Exceptions':'Records counted as failing this KPI.',
    'Not agreed':'Intercompany items where the two sides do not agree.', 'Not signed by WD+2':'Material variances without signed commentary by WD+2.', 'Not mapped':'Local accounts with a balance but no group mapping.', 'Local accounts':'Local accounts that hold a balance.',
    'Entities':'Entities in scope for these filters.', 'Close risk':'Close-risk category and score for this entity.', 'Records':'Records behind this view.', 'Reconciliations':'Reconciliations in scope.', 'Anomalies':'Journals scoring 0.75 or more on the anomaly model.',
    'Journal automation rate':'Share of journals posted without manual keying (interface or auto-reversal).', 'AI-drafted share of manual':'Share of manual journals that were first drafted by AI.', 'Anomaly rate':'Anomalous journals as a share of journals posted.',
    'Corrective journals':'Journals posted to correct earlier entries; fewer is better.', 'Pending approval':'Journals waiting for an approver.', 'Pending (top 6 sample)':'Largest journals waiting for approval.', 'Pending journals (top 6 sample)':'Largest journals waiting for approval.',
    'AI accrual drafts':'Accruals drafted by AI for review.', 'Anomalous journals':'Journals the anomaly model flagged for review.', 'Anomaly score':'Anomaly model score from 0 to 1; 0.75 or more is flagged.', 'Failing R2R controls':'Record-to-report controls that failed testing this close.',
    'IC pair agreement':'Share of intercompany pairs where both sides agree within ₹10 L; unconfirmed pairs count as not agreed.', 'IC pairs':'Intercompany entity pairs in the close.', 'Value agreed':'Share of intercompany value that both sides agree.',
    'Unexplained IC break':'Intercompany difference not explained by timing or exchange rates.', 'Unconfirmed balances':'Intercompany value the counterparty has not confirmed.', 'Consolidation progress':'Consolidation steps complete out of all steps.',
    'Net difference':'Receivable side minus payable side for the pair.', 'Receivable value':'Value the receiving entity has booked.', 'Receivable':'Value the receiving entity has booked.', 'Payable':'Value the paying entity has booked.', 'Difference':'Gap between the two sides or balances.',
    'EBITDA vs budget':'Earnings before interest, tax, depreciation and amortisation against budget.', 'EBITDA margin':'Earnings before interest, tax, depreciation and amortisation as a share of revenue.', 'Impact on EBITDA':'How much this item moves earnings before interest, tax, depreciation and amortisation.',
    'Variance commentary':'Share of material variances with signed commentary.', 'Variance vs budget':'Actual minus budget for this line.', 'Commentary':'State of the explanation for this variance.', 'Disclosure readiness':'Disclosure notes ready, out of all required.',
    'Open judgements':'Accounting judgements still waiting for a decision.', 'Pack readiness':'Reporting-pack checks passed, out of all checks.', 'Release gate':'Whether the pack can be released.', 'Bridge driver':'Budget-bridge driver this variance belongs to.',
    'Share of adverse drivers':'This driver\'s share of all adverse budget movements.', 'Share of the budget gap':'This item\'s share of the gap to budget.', 'Account mapping':'Share of local accounts mapped to the group chart of accounts.' };
  P.KLine = ({ id })=> P.KLINE[id]? html`<p class="px-kc-s" style=${{ margin:'2px 0 6px', fontSize:12 }} title=${P.fullText(M.KPI[id]? M.KPI[id].q+' Formula: '+M.KPI[id].formula : P.KLINE[id])}>${P.KLINE[id]}</p>` : null;
  P.khint = (id)=> M.KPI[id]? P.fullText(M.KPI[id].name+': '+P.KLINE[id]+' Formula: '+M.KPI[id].formula) : undefined;
  const MONEY = ['jpend','unrec','adj'];
  P.fmtKpi = (id, v)=>{ if(v==null) return 'N/A'; if(id==='health') return String(Math.round(v)); if(MONEY.includes(id)) return cr(v, v>=100? 1 : 2);
    if(id==='entmix' || id==='jmix') return FCT.n(v); return pct(v,1); };
  const ename = (id)=> id==='Group'? 'Group' : id+' '+((M.E[id]||{}).name||'');
  const anm = (a)=> a? a+' '+((M.A[a]||{}).name||'') : '—';
  const SHORT = { tasks:'1 · Sub-ledger Close', jnl:'2 · Journal Entry & Accruals', ic:'3 · Account Reconciliation', recs:'4 · Review & Certification', mapq:'5 · Intercompany & Consolidation', var:'6 · Management Reporting' };
  const lc = (t)=> String(t||'').split(' ').map(w=> /^[A-Z0-9]{2,}$/.test(w) || /^[A-Z]{2}-\d/.test(w)? w : w.toLowerCase()).join(' ');
  P.lc = lc;

  /* ---------- R2R global filters: period, entity, region, entity class, account risk (persist through drill-down) ---------- */
  P.RFilterBar = ({ f, setF, pending })=>{
    const sel = (k, opts, lab)=> html`<${P.Dropdown} label=${lab} value=${f[k]} options=${opts} active=${f[k]!==M.defaults[k]} onChange=${(v)=> setF(Object.assign({}, f, { [k]:v }))}/>`;
    const chips = M.active(f).map(k=> [k, k==='entity'? 'Entity: '+f.entity : k==='region'? 'Region: '+f.region : k==='seg'? 'Class: '+f.seg : k==='crisk'? 'Risk category: '+f.crisk : 'Account risk: '+f.risk]);
    return html`<div class="px-filters compact" role="search" aria-label="Global filters">
      ${sel('period', C.periods.filter(p=>!p.hidden).map(p=>[p.id,p.label]), 'Period')}
      ${sel('entity', [['All','All']].concat(M.X.ents.map(e=>[e.id, e.id+' '+e.name])), 'Entity')}
      ${sel('region', [['All','All']].concat(C.regions.map(r=>[r,r])), 'Region')}
      ${sel('seg', [['All','All']].concat(C.segs.map(s=>[s.id,s.id])), 'Class')}
      ${sel('risk', [['All','All']].concat(C.risks.map(r=>[r,r])), 'Account risk')}
      <div class="px-chips" aria-live="polite">${pending && html`<span class="px-busy" role="status"><i/>Updating</span>`}
        ${chips.map(([k,t])=> html`<button key=${k} type="button" class="px-chip" aria-label=${'Clear '+t} onClick=${()=> setF(Object.assign({}, f, { [k]:'All' }))}>${t}<${Icon} n="X" size=${12}/></button>`)}
        ${chips.length>0 && html`<button type="button" class="px-reset" onClick=${()=> setF(Object.assign({}, M.defaults, { period:f.period }))}><${Icon} n="RotateCcw" size=${13}/>Reset filters</button>`}</div></div>`;
  };

  /* ---------- node builders ---------- */
  const N = P.rnode = {
    group:(dim, key)=> dim==='entity'? N.entity(key) : { t:'group', dim, key, label:(dim==='component'? '' : M.dimName[dim]+': ')+M.dimLabel(dim, key) },
    entity:(id)=> ({ t:'entity', id, label:ename(id) }),
    profile:(id)=> ({ t:'eprofile', id, label:ename(id) }),
    doc:(id)=>{ const r = M.rec(id); return { t:'doc', id, label: !r? id : r.kind==='je'? 'Journal '+r.id : r.kind==='rec'? 'Reconciliation '+r.name : r.kind==='task'? 'Task '+r.name : r.kind==='ic'? 'IC item '+r.ref : r.kind==='var'? 'Variance '+r.line : 'Account '+r.local }; },
    case:(id)=> ({ t:'case', id, label:id }),
    rec:(x)=> x.kind==='case'? N.case(x.rec.id) : x.kind==='entity'? N.entity(x.rec.id) : x.rec.mappedStd? N.entity(x.e) : N.doc(x.rec.id),
    stage:(id)=> ({ t:'group', dim:'stage', key:id, label:'Stage: '+M.stage(id).name }),
    issue:(code)=> ({ t:'group', dim:'issue', key:code, label:'Issue: '+M.issue(code).name })
  };

  /* ---------- small pieces (same anatomy as the P2P sheet) ---------- */
  /* chart legend: one swatch per mark the chart draws. kinds: sq (bar or area), line, dash (target or plan line), dot (highlighted point) */
  P.RKey = ({ items, note, style })=> html`<div class="px-rkey" style=${Object.assign({ display:'flex', flexWrap:'wrap', gap:'4px 14px', alignItems:'center', fontSize:11.5, color:'var(--px-ink2)', marginTop:6 }, style||{})}>
    ${items.filter(Boolean).map(([k, c, l], i)=> html`<span key=${i} style=${{ display:'inline-flex', alignItems:'center', gap:6 }}>${
      k==='line'? html`<i style=${{ width:16, height:0, borderTop:'2px solid '+c }}/>` : k==='dash'? html`<i style=${{ width:16, height:0, borderTop:'2px dashed '+c }}/>`
      : k==='dot'? html`<i style=${{ width:9, height:9, borderRadius:9, background:c }}/>` : html`<i style=${{ width:11, height:11, borderRadius:2, background:c }}/>`}${l}</span>`)}
    ${note && html`<span class="faint">${note}</span>`}</div>`;
  /* the shared KPI trend with its legend: line = the KPI by month, larger dot = the close in the filter, dashed = target */
  P.RTrend = ({ id, f, height, bars })=>{ const k = M.KPI[id], per = M.period(f.period);
    return html`<${Fragment}><${P.Trend} id=${id} f=${f} height=${height} bars=${bars}/>
      <${P.RKey} items=${bars? [['sq', COL.kc, per.label], ['sq', COL.fade, 'Other closes']]
        : [['line', COL.kc, k.name+' at each month-end close'], ['dot', COL.brass, 'Close chosen in the filter ('+per.label+')'], k.target!=null && ['dash', COL.brass, 'Target '+k.target+(k.unit==='%'? '%' : '')]]}/></${Fragment}>`; };
  const Spark = ({ data, w=56, ht=16, target })=>{ const pts = data.map((v,i)=>[i,v]).filter(p=>p[1]!=null); if(pts.length<2) return null;
    const vs = pts.map(p=>p[1]).concat(target!=null? [target] : []), mn = Math.min(...vs), mx = Math.max(...vs), pad = (mx-mn)*.15 || 1;
    const X = (i)=> 1 + i*(w-3)/(data.length-1), Y = (v)=> ht-2 - (v-mn+pad)/(mx-mn+2*pad)*(ht-4);
    return html`<svg class="px-spark" width=${w} height=${ht} viewBox=${'0 0 '+w+' '+ht} preserveAspectRatio="none" aria-hidden="true">
      ${target!=null && html`<line x1="0" x2=${w} y1=${Y(target)} y2=${Y(target)} stroke=${COL.brass} stroke-width="1" stroke-dasharray="3 3"/>`}
      <path d=${pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1)).join('')} fill="none" stroke=${COL.brand2} stroke-width="1.8" stroke-linejoin="round"/>
      <circle cx=${X(pts[pts.length-1][0])} cy=${Y(pts[pts.length-1][1])} r="2.6" fill=${COL.brass}/></svg>`; };
  const Ring = ({ v, band })=>{ const r = 34, c = 2*Math.PI*r, tv = P.useTween(v||0), col = !band? COL.low : band.cls==='pos'? COL.pos : band.cls==='med'? '#B08A1E' : COL.crit;
    return html`<svg viewBox="0 0 84 84" class="px-ring" role="img" aria-label=${'Close health '+(v==null? 'N/A' : v)+' out of 100'}><circle cx="42" cy="42" r=${r} fill="none" stroke="var(--px-track)" stroke-width="7"/>
      <circle cx="42" cy="42" r=${r} fill="none" stroke=${col} stroke-width="8" stroke-linecap="round" stroke-dasharray=${c} stroke-dashoffset=${c*(1-(tv||0)/100)} transform="rotate(-90 42 42)"/>
      <text x="42" y="44" text-anchor="middle" class="n">${v==null? 'N/A' : Math.round(tv)}</text><text x="42" y="58" text-anchor="middle" class="u">/100</text></svg>`; };
  const Seg = ({ parts, label })=>{ const t = parts.reduce((s,p)=> s + Math.max(0,p.v), 0) || 1;
    return html`<div class="px-segbar" role="img" aria-label=${label}>${parts.map((p,i)=> p.v>0? html`<i key=${i} style=${{ flex:p.v/t, background:p.c }} title=${p.l+': '+(p.f? p.f(p.v) : p.v)}/>` : null)}</div>
      <div class="px-seglg">${parts.map((p,i)=> html`<span key=${i}><i style=${{background:p.c}}/>${p.l} <b>${p.f? p.f(p.v) : p.v}</b></span>`)}</div>`; };
  /* "i" button: a small round button that opens a short plain explanation under it. Used on every card and stat tile in R2R */
  const InfoI = ({ text, size=16 })=>{ const [o, setO] = useState(false), [hv, setHv] = useState(false);
    useEffect(()=>{ if(!o) return; const c = ()=> setO(false); const t = setTimeout(()=> document.addEventListener('click', c), 0); return ()=>{ clearTimeout(t); document.removeEventListener('click', c); }; }, [o]);
    if(!text) return null;
    return html`<span style=${{ position:'relative', display:'inline-flex', marginLeft:6, verticalAlign:'middle' }}>
      <span role="button" tabindex="0" aria-label="What this shows" aria-expanded=${o || hv}
        onMouseEnter=${()=> setHv(true)} onMouseLeave=${()=> setHv(false)} onFocus=${()=> setHv(true)} onBlur=${()=> setHv(false)}
        onClick=${(e)=>{ e.stopPropagation(); setO(!o); }} onKeyDown=${(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.stopPropagation(); setO(!o); } }}
        style=${{ width:size, height:size, borderRadius:size, border:'1px solid var(--px-ink3)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:size*.62, fontWeight:700, fontStyle:'italic', fontFamily:'Georgia, serif', cursor:'help', color: o? 'var(--px-bg, #0f1a19)' : 'var(--px-ink2)', background: o? 'var(--px-ink2)' : 'transparent', flex:'none' }}>i</span>
      ${(o || hv) && html`<span role="note" onClick=${(e)=> e.stopPropagation()} style=${{ position:'absolute', top:size+6, left:-8, zIndex:80, width:260, padding:'8px 10px', borderRadius:8, border:'1px solid var(--px-line)', background:'var(--px-card, var(--card, #16211f))', color:'var(--px-ink)', boxShadow:'0 8px 20px rgba(0,0,0,.35)', fontSize:12, fontWeight:400, fontStyle:'normal', lineHeight:1.45, textAlign:'left', whiteSpace:'normal', letterSpacing:0, textTransform:'none' }}>${P.fullText(text)}</span>`}</span>`; };
  P.InfoI = InfoI;
  /* short explanations for cards that have no subtitle of their own */
  const CINFO = [[/^Values$/, 'The key facts of this record: amounts, dates, owner and status.'], [/^Evidence$/, 'Source documents behind this record. Requests to see them are simulated.'],
    [/^Incident explained$/, 'What went wrong, when, how it was spotted and why it matters.'], [/^What happened$/, 'A plain summary of the case: what went wrong and how big it is.'],
    [/^Entity$/, 'The entity this case belongs to and how likely it is to close late.'], [/^Scope$/, 'Which entities this case covers.'], [/^Related exceptions$/, 'Other open items linked to this case.'],
    [/^Investigate$/, 'Write down what you found and move the case to its next status.'], [/^Process chain/, 'Where this record sits across the six steps of the close.'],
    [/surfaced/, 'Why this entity shows up here, taken from its own records.'], [/^Category definitions$|entities$/, 'What each close-risk category means and which entities are in it.'],
    [/^Why this matters$/, 'Why repeated manual journals on one account need attention.'], [/^Every intercompany item$/, 'Each tile is one intercompany invoice or charge between the two entities.'],
    [/^Manual journal value by close$/, 'Value of manual and AI-drafted journals in each month-end close.'], [/^Balances and mapping$/, 'Open balance problems for this entity and how many of its accounts are mapped to the group chart.'],
    [/^Variances and cases$/, 'Big budget differences and open cases for this entity.'], [/^Records and evidence$/, 'This entity\'s records for the close. Use Show to switch type.'],
    [/^Where our entities are$/, 'A map of entity sites, coloured by risk category. Use the filters to focus.'], [/cases/i, 'Open cases and the value that may need correcting in the books.']];
  const cardInfo = (title, sub)=> typeof sub==='string' && sub? sub : (()=>{ const t = typeof title==='string'? title : ''; const m = CINFO.find(([re])=> re.test(t)); return m? m[1] : t? 'Details for '+t.toLowerCase()+'.' : 'Details for this section.'; })();
  if(!P._cardWrapped){ P._cardWrapped = true; const Card0 = P.Card, Stat0 = P.Stat;
    P.Card = (pr)=> pr.title? h(Card0, Object.assign({}, pr, { title: html`<span style=${{ display:'inline-flex', alignItems:'center' }}>${pr.title}<${InfoI} text=${cardInfo(pr.title, pr.sub)}/></span>` })) : h(Card0, pr);
    P.Stat = (pr)=>{ const t = (P.KGLOSS && P.KGLOSS[pr.label]) || (typeof pr.sub==='string' && pr.sub? pr.label+': '+pr.sub : null); return h(Stat0, Object.assign({}, pr, { info: html`${pr.info}<${InfoI} size=${14} text=${t || 'How many '+String(pr.label).toLowerCase()+' there are for the current filters.'}/>` })); }; }
  const KCard = ({ id, kpi, pick, title, sub, right, children })=> html`<section class=${cx('px-kc', P.kc(id), kpi===id && 'on')} onClick=${()=> pick(id)} aria-label=${title}>
    <div class="px-kc-h"><button type="button" class="px-kc-t" title=${P.khint(id)} aria-pressed=${kpi===id} onClick=${(e)=>{ e.stopPropagation(); pick(id); }}><span class="px-kc-i"><${Icon} n=${P.KICON[id]} size=${15} strokeWidth=${1.6}/></span><span>${title}</span></button><${InfoI} text=${P.KLINE[id]}/>${right}</div>
    <${P.KLine} id=${id}/>${sub && html`<p class="px-kc-s">${sub}</p>`}${children}</section>`;
  const stop = (fn)=> (e)=>{ e.stopPropagation(); fn(); };
  const Sec = ({ c, icon, title, sub, right, children })=> html`<section class=${'px-sec s-'+c} aria-label=${title}>
    <div class="px-sec-h">${icon && html`<span class="px-sec-ic" aria-hidden="true"><${Icon} n=${icon} size=${20} strokeWidth=${1.7}/></span>`}<div class="px-sec-t"><h2>${title}</h2>${sub && html`<p>${sub}</p>`}</div>${right && html`<div class="px-sec-r">${right}</div>`}</div>${children}</section>`;
  const Pill = ({ tone, children, title })=> html`<span class=${'px-pill t-'+(tone||'n')} title=${title}>${children}</span>`;
  P.RPill = Pill;
  const DChip = ({ id, v, prior, mode })=>{
    if(v==null || prior==null || (mode==='pct' && !prior)) return null;
    const d = mode==='pct'? (v-prior)/Math.abs(prior)*100 : v-prior; if(Math.abs(d)<0.05) return html`<${Pill}>No change</${Pill}>`;
    const k = M.KPI[id], up = d>0, good = k.good==='up'? up : k.good==='down'? !up : null;
    return html`<${Pill} tone=${good==null? 'n' : good? 'g' : 'r'} title="Change against the prior close">${up? '▲' : '▼'} ${FCT.n(Math.abs(d),1)}${mode==='pct'? '%' : ' pts'}</${Pill}>`; };
  const Foot = ({ items })=> html`<dl class="px-rc-f">${items.filter(Boolean).map(([l,v,t],i)=> html`<div key=${i}><dt>${l}</dt><dd class=${t||''}>${v}</dd></div>`)}</dl>`;
  const AI = ({ children, cls })=> children? html`<p class=${cx('px-ai', cls)}><i>${children}</i></p>` : null;
  const MiniTab = ({ title, cols, rows })=> html`<div class="px-mt"><div class="px-mt-h">${title}</div>
    ${rows.length? html`<table><thead><tr>${cols.map((c,i)=> html`<th key=${i} class=${i? 'r' : ''}>${c}</th>`)}</tr></thead><tbody>
      ${rows.map(r=> html`<tr key=${r.key} title=${r.cells[0]}><td><span class="n">${r.cells[0]}</span><span class="trk"><i style=${{ width:r.w+'%' }}/></span></td>${r.cells.slice(1).map((c,i)=> html`<td key=${i} class=${cx('r num', i===0 && 'v')}>${c}</td>`)}</tr>`)}</tbody></table>`
    : html`<p class="faint">No records for these filters.</p>`}</div>`;
  const mtRows = (rows, cells)=>{ const mx = Math.max(...rows.map(r=> r.val), 0) || 1; return rows.map(r=> ({ key:r.key, w:r.val/mx*100, cells:cells(r) })); };
  const RCard = ({ id, kpi, pick, title, basis, value, tone, chip, viz, foot, top, note })=> html`<section class=${cx('px-kc px-rc px-rc3', P.kc(id), kpi===id && 'on')} onClick=${()=> pick(id)} aria-label=${title}>
    <div class="px-rc-h"><button type="button" class="px-kc-t" title=${P.khint(id)} aria-pressed=${kpi===id} onClick=${(e)=>{ e.stopPropagation(); pick(id); }}><span class="px-kc-i"><${Icon} n=${P.KICON[id]} size=${15} strokeWidth=${1.6}/></span><span>${title}</span></button><${InfoI} text=${P.KLINE[id]}/><span class="px-basis">${basis}</span></div><${P.KLine} id=${id}/>
    <div class="px-rc-v"><span class=${cx('v num', tone)}>${value}</span>${chip}</div>
    <div class="px-rc-viz">${viz}</div><${AI}>${note}</${AI}>${top}<${Foot} items=${foot}/></section>`;
  const scoreTone = (s)=> s==null? COL.fade : s>=75? 'var(--px-pos)' : s>=50? '#B08A1E' : 'var(--px-crit)';
  P.SRC_COL = { 'Sub-ledger interface':'#6E9BE0', 'Auto-reversal':'#8FB7C9', 'AI-drafted':'#A08BE0', 'Manual':'#E0B25A' };
  const prio = (c, v)=> M.CT[c.type].basis==='fin'? (v>=1? 'High' : v>=.25? 'Medium' : 'Low') : (v>=1? 'High' : v>=.3? 'Medium' : 'Low');
  const topOf = (facts, dim)=> M.group(facts.filter(x=> x.ok===false), (x)=> x.g[dim]).sort((a,b)=> b.n-a.n)[0] || null;

  /* plain-language note for one health component, from the records on screen */
  const compNote = (id, f, K, seg)=>{
    if(seg){ const g = M.segComp(id, f, seg); if(!g.n) return 'No '+seg.toLowerCase()+' entities have records here.';
      const all = (K[id]||{}).v, d = all==null || g.rate==null? null : g.rate - all;
      return seg+' entities score '+pct(g.rate,1)+(d==null? '.' : Math.abs(d)<0.1? ', the same as the group.' : ', '+FCT.n(Math.abs(d),1)+' points '+(d<0? 'worse' : 'better')+' than the group ('+pct(all,1)+').')+(g.bad? ' '+FCT.n(g.bad)+' of their '+FCT.n(g.n)+' records had a problem.' : ''); }
    const k = K[id]; if(!k || k.v==null) return 'No data for these filters.';
    if(!k.bad) return 'No problems in '+FCT.n(k.n)+' records.';
    const fs = M.facts(id, f), n = FCT.n(k.bad), sh = pct(k.bad/k.n*100,1), te = topOf(fs, 'entity'), tn = te? ', most at '+te.key+' ('+te.n+')' : '';
    return { tasks: n+' close tasks ('+sh+') ran late'+tn+'.',
      recs: n+' reconciliations ('+sh+') not certified on time'+tn+'.',
      jnl: (()=>{ const t = topOf(fs, 'flag'); return n+' journals ('+sh+') failed a control, mostly '+(t? lc(t.key)+' ('+t.n+')' : '—')+'.'; })(),
      ic: n+' intercompany items ('+sh+', '+amt(k.badVal)+') not agreed by both sides'+tn+'.',
      var: n+' of '+FCT.n(k.n)+' big variances unexplained at WD+2'+tn+'.',
      mapq: n+' local accounts not mapped to the group chart'+tn+'.' }[id]; };

  /* ---------- KPI sheet ---------- */
  P.KpiBoard = ({ f, kpi, pick, openCase })=>{
    const p = M.period(f.period), prior = p.prior? M.period(p.prior).label : null;
    const K = {}; C.sheet.concat(['mapq']).forEach(id=> K[id] = M.kpi(id, f));
    const hl = K.health.h, [tab, setTab] = useState('all'), [seg, setSeg] = useState(null), [info, setInfo] = useState(null);
    const prF = M.facts('progress', f), jpF = M.facts('jpend', f), urF = M.facts('unrec', f), adF = M.facts('adj', f), jmF = M.facts('jmix', f), ta = M.topAccts(f);
    const ex = K.adj.e, exBy = M.group(adF, (x)=> x.rec.type).slice(0,6).map(r=> ({ key:r.key, name:M.CT[r.key].name, v:r.val }));
    const src = M.group(jmF, (x)=> x.g.src).map(r=> ({ key:r.key, name:r.key, val:r.n, c:P.SRC_COL[r.key] || COL.fade })), srcT = M.sum(src, r=>r.val);
    const cs = M.cases(f).filter(c=> M.statusMeasure(c.stNow)==='potential');
    const rows = cs.filter(c=> tab==='all' || (tab==='fin'? M.CT[c.type].basis==='fin' : M.CT[c.type].basis==='ctl'))
      .map(c=> ({ c, val: c.est!=null? c.est : c.affected||0 })).sort((a,b)=> (M.CT[b.c.type].basis==='fin') - (M.CT[a.c.type].basis==='fin') || b.val-a.val).slice(0,8);
    const rates = ['tasks','jnl','recs','ic','var'], onT = rates.filter(id=> M.status(id, K[id].v)==='good').length;
    const mix = K.entmix.mix, es = M.ents(f), hiE = mix[0].n + mix[1].n;
    const lostTop = hl.comps.filter(c=>c.lost!=null).sort((a,b)=>b.lost-a.lost)[0];
    const bandTone = !hl.band? 'n' : hl.band.cls==='pos'? 'g' : hl.band.cls==='med'? 'a' : 'r';
    const stTone = { good:['g','On target'], watch:['a','Watch'], off:['r','Off target'], na:['n','No data'] };
    const rate = (id)=>{ const k = K[id], d = M.KPI[id], st = M.status(id, k.v), hc = C.health.find(x=>x.kpi===id), lo = hc? hc.floor-5 : 80;
      const P0 = (x)=> Math.max(0, Math.min(100, (x-lo)/(100-lo)*100));
      return html`<section key=${id} class=${cx('px-kc px-rate', P.kc(id), kpi===id && 'on')} onClick=${()=> pick(id)} aria-label=${d.name}>
        <div class="px-rc-h"><button type="button" class="px-kc-t" title=${P.khint(id)} aria-pressed=${kpi===id} onClick=${(e)=>{ e.stopPropagation(); pick(id); }}><span class="px-kc-i"><${Icon} n=${P.KICON[id]} size=${15} strokeWidth=${1.6}/></span><span>${SHORT[id]}</span></button></div><${P.KLine} id=${id}/>
        <div class="px-rc-v"><span class="v num">${pct(k.v)}</span><${Pill} tone=${stTone[st][0]}>${stTone[st][1]}</${Pill}></div>
        <div class="px-bullet" role="img" aria-label=${d.name+' '+pct(k.v)+' against target '+d.target+'%'}><i style=${{ width:P0(k.v==null? lo : k.v)+'%', background:scoreTone(st==='good'? 100 : st==='watch'? 60 : 0) }}/><b style=${{ left:P0(d.target)+'%' }} title=${'Target '+d.target+'%'}/></div>
        <div class="px-rate-s"><span class="faint">Target ${d.target}%</span><${DChip} id=${id} v=${k.v} prior=${k.prior}/></div>
        <${Spark} data=${k.series} w=${150} ht=${30} target=${d.target}/><${P.RKey} style=${{ marginTop:2, fontSize:10.5 }} items=${[['line', COL.brand2, 'Apr–Sep closes'], ['dash', COL.brass, 'Target']]}/>
        <${Foot} items=${[['Records', FCT.n(k.n)], ['Exceptions', FCT.n(k.bad)+' of '+FCT.n(k.n), k.bad? 'r' : ''], [prior? prior.replace(' close','') : 'Prior', pct(k.prior)]]}/></section>`; };
    const pr = K.progress, ent07 = M.group(prF.filter(x=> x.g.status==='Behind plan'), (x)=> x.e)[0];
    return html`<div class="px-board" aria-label="R2R KPI board"><div class="px-board-in">
      <${Sec} c="kpi" icon="Gauge" title="Headline KPIs" sub=${p.label+' · snapshot '+C.snapLabel}
        right=${html`<${Pill} tone=${bandTone}>Health ${K.health.v==null? 'N/A' : K.health.v} · ${hl.band? hl.band.label : ''}</${Pill}><${Pill} tone=${pr.forecast>C.targetWD? 'r' : 'g'}>Forecast ${M.wdl(pr.forecast)} · target WD+${C.targetWD}</${Pill}>`}>
        <div class="px-hero3">
          <section class=${cx('px-kc px-feat2', P.kc('health'), kpi==='health' && 'on')} onClick=${()=> pick('health')} aria-label="R2R Close Health Score">
            <div class="px-rc-h"><button type="button" class="px-kc-t" title=${P.khint('health')} aria-pressed=${kpi==='health'} onClick=${(e)=>{ e.stopPropagation(); pick('health'); }}><span class="px-kc-i"><${Icon} n="Gauge" size=${15} strokeWidth=${1.6}/></span><span>R2R Close Health Score</span></button><${InfoI} text=${P.KLINE.health}/>
              <div class="px-seg" role="radiogroup" aria-label="Entity class" onClick=${(e)=> e.stopPropagation()}>
                <span class="l">Entity class</span>${[null].concat(C.segs.map(x=> x.id)).map(g=> html`<button key=${g||'all'} type="button" role="radio" aria-checked=${seg===g} class=${cx(seg===g && 'on')}
                  title=${g? (C.segs.find(x=>x.id===g)||{}).desc : 'All entities'} onClick=${()=> setSeg(g)}>${g || 'All'}<small>${M.segCount(f, g)}</small></button>`)}</div>
              <span class="px-basis">${p.label}</span></div><${P.KLine} id="health"/>
            <div class="px-feat2-b">
              <div class="px-feat2-l"><div class="px-feat-b"><${Ring} v=${K.health.v} band=${hl.band}/>
                <div class="px-feat-s">${hl.band && html`<${Pill} tone=${bandTone}>${hl.band.label}</${Pill}>`}<${DChip} id="health" v=${K.health.v} prior=${K.health.prior}/>
                  <div class="px-feat-k"><span>Coverage</span><b>${pct(hl.coverage*100,0)}</b></div><div class="px-feat-k"><span>Points lost</span><b>${K.health.v==null? 'N/A' : 100-K.health.v}</b></div></div></div>
                <div class="px-feat-t"><span>Score at each close, Apr–Sep</span><${Spark} data=${K.health.series} w=${220} ht=${30}/></div>
                <${AI}>${K.health.v==null? null : 'The score is '+K.health.v+' out of 100'+(K.health.prior!=null? ', '+FCT.n(Math.abs(K.health.v-K.health.prior))+' points '+(K.health.v<K.health.prior? 'lower' : 'higher')+' than the '+prior : '')+'. '+(lostTop? SHORT[lostTop.kpi]+' is pulling it down the most.' : '')}</${AI}></div>
              <div class="px-feat2-c">${hl.comps.map(c=>{ const g = M.segComp(c.kpi, f, seg), hc = C.health.find(x=> x.kpi===c.kpi), val = seg? g.rate : c.v, sc = seg? (val==null? null : Math.max(0, Math.min(100, (val-hc.floor)/(hc.target-hc.floor)*100))) : c.sc;
                const tag = g.ePct==null? 'No entities' : pct(g.ePct,0)+' of '+(seg? seg.toLowerCase()+' ' : '')+'entities affected';
                return html`<button key=${c.kpi} type="button" class="px-cm2" onClick=${stop(()=> pick('health', { key:c.kpi, dim:'component' }))} title=${P.fullText(P.KLINE[c.kpi])+' '+c.name+': score '+(c.sc==null? 'N/A' : Math.round(c.sc))+' of 100, weight '+c.w}>
                <span class="hd"><span class="n">${SHORT[c.kpi]}</span>
                  <span role="button" tabindex="0" aria-label=${'About '+c.name} aria-expanded=${info===c.kpi} title=${P.fullText(P.KLINE[c.kpi])}
                    onClick=${stop(()=> setInfo(info===c.kpi? null : c.kpi))} onKeyDown=${(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.stopPropagation(); setInfo(info===c.kpi? null : c.kpi); } }}
                    style=${{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:18, height:18, borderRadius:9, border:'1px solid var(--px-ink3)', color: info===c.kpi? 'var(--px-bg, #0f1a19)' : 'var(--px-ink2)', background: info===c.kpi? 'var(--px-ink2)' : 'transparent', fontSize:11, fontWeight:700, fontStyle:'italic', fontFamily:'Georgia, serif', cursor:'help', flex:'none' }}>i</span>
                  <b class="v num" style=${{ marginLeft:'auto' }}>${val==null? 'N/A' : pct(val)}</b></span>
                ${info===c.kpi && (()=>{ const K0 = M.KPI[c.kpi], hc0 = C.health.find(x=> x.kpi===c.kpi);
                  return html`<span onClick=${(e)=> e.stopPropagation()} style=${{ display:'block', cursor:'default', border:'1px solid var(--px-line)', borderRadius:6, padding:'8px 10px', background:'var(--px-bg, transparent)', fontSize:12, lineHeight:1.45 }}>
                    <b style=${{ display:'block', marginBottom:4 }}>${K0.q}</b>
                    <span style=${{ display:'block' }}><b>Means: </b>${P.fullText(P.KLINE[c.kpi])}</span>
                    <span style=${{ display:'block' }}><b>How it is worked out: </b>${P.fullText(K0.formula)}</span>
                    <span style=${{ display:'block' }}><b>Target: </b>${K0.target}%${hc0? ' · counts '+hc0.w+' of 100 points in the health score' : ''}</span>
                    ${K0.excl && html`<span style=${{ display:'block' }} class="faint"><b>Note: </b>${P.fullText(K0.excl)}</span>`}
                    <span style=${{ display:'block', marginTop:4 }} class="faint">Owner: ${K0.owner} · click the card to investigate</span></span>`; })()}
                <span class="trk"><i style=${{ width:(sc||0)+'%', background:scoreTone(sc) }}/></span>
                <span class="px-vt"><span class=${cx('tg', g.ePct>=50? 'hi' : g.ePct>=20? 'md' : 'lo')}><${Icon} n="Building2" size=${12}/>${tag}</span><span class="faint">${g.eBad} of ${g.eN}</span></span>
                <${AI} cls="sm">${compNote(c.kpi, f, K, seg)}</${AI}></button>`; })}</div></div></section>
          <div class="px-hero3-g">
            <${RCard} id="progress" kpi=${kpi} pick=${pick} title="Close Progress" basis="Snapshot" value=${pct(pr.v,0)}
              chip=${html`<${Pill}>${FCT.n(pr.done)} of ${FCT.n(pr.n)} tasks</${Pill}>`}
              viz=${html`<${Seg} label="Close tasks by status" parts=${[['Done','#6CC18F'],['Behind plan','#E06A4E'],['Not yet due','var(--px-fade)']].map(([l,c])=> ({ l, v:prF.filter(x=> x.g.status===l).length, c }))}/>`}
              note=${pr.n? FCT.n(pr.done)+' of '+FCT.n(pr.n)+' tasks done (plan: '+FCT.n(pr.plan)+'); '+FCT.n(pr.behind)+' behind'+(ent07 && ent07.n>2? ', '+ent07.n+' at '+ent07.key : '')+'. Forecast '+M.wdl(pr.forecast)+' vs WD+'+C.targetWD+' target.' : null}
              top=${html`<${MiniTab} title="Entities furthest behind" cols=${['Entity','Behind','Done','Forecast']} rows=${mtRows(M.group(prF.filter(x=> x.g.status==='Behind plan'), (x)=> x.e).slice(0,4).map(r=> ({ key:r.key, val:r.n })),
                (r)=>{ const all = prF.filter(x=> x.e===r.key); return [ename(r.key), FCT.n(r.val), FCT.n(all.filter(x=> x.ok).length)+'/'+all.length, M.wdl(M.forecast(r.key))]; })}/>`}
              foot=${[['Plan to date', pct(pr.planPct,0)], ['Behind plan', FCT.n(pr.behind), pr.behind? 'r' : ''], ['Readiness', pr.readiness+'/90']]}/>
            <${RCard} id="jpend" kpi=${kpi} pick=${pick} title="Journals Pending" basis="Snapshot" value=${cr(K.jpend.v)}
              chip=${html`<${Pill} tone="a">${FCT.n(K.jpend.n)} journals</${Pill}>`}
              viz=${html`<${Seg} label="Pending journals by waiting time" parts=${['Under 1 day','1–2 days','Over 2 days'].map((a,i)=> ({ l:a, v:M.sum(jpF.filter(x=> x.g.age===a), x=>x.val), c:['#C9B8F0','#A08BE0','#6B53B8'][i], f:(v)=> cr(v) }))}/>`}
              note=${K.jpend.n? FCT.n(K.jpend.n)+' journals worth '+cr(K.jpend.v)+' await approval; '+FCT.n(K.jpend.n-K.jpend.review)+' low risk ('+cr(M.sum(jpF.filter(x=> !x.rec.review), x=>x.val))+'); '+K.jpend.review+' need review.'+(K.jpend.drafts? ' '+K.jpend.drafts+' AI drafts ('+cr(K.jpend.draftVal)+') not yet submitted.' : '') : 'No journals are waiting for approval.'}
              top=${html`<${MiniTab} title="Largest waiting" cols=${['Entity','Value','Journals','Oldest']} rows=${mtRows(M.group(jpF, (x)=> x.e).slice(0,4), (r)=>{ const ls = jpF.filter(x=> x.e===r.key);
                return [ename(r.key), amt(r.val), FCT.n(ls.length), M.dur(Math.max(...ls.map(x=> M.SNAP - x.rec.sub)))]; })}/>`}
              foot=${[['Low risk', FCT.n(K.jpend.n-K.jpend.review)], ['Need review', FCT.n(K.jpend.review), K.jpend.review? 'a' : ''], ['AI drafts', cr(K.jpend.draftVal)]]}/>
            <${RCard} id="unrec" kpi=${kpi} pick=${pick} title="Unreconciled Differences" basis="Snapshot" value=${cr(K.unrec.v)}
              chip=${html`<${Pill} tone="a">${FCT.n(K.unrec.n)} reconciliations</${Pill}>`}
              viz=${html`<div class="px-mini-bars">${M.group(urF, (x)=> x.g.status).slice(0,3).map(r=> html`<div key=${r.key}><span class="n" title=${r.key}>${r.key}</span><span class="trk"><i style=${{ width:(r.val/(K.unrec.v||1)*100)+'%' }}/></span><b class="num">${cr(r.val)}</b></div>`)}</div>`}
              note=${K.unrec.n? cr(K.unrec.v)+' not agreed to support; '+cr(K.unrec.breakVal)+' in '+K.unrec.breaks+' break'+(K.unrec.breaks===1?'':'s')+' above ₹10 L. '+FCT.n(K.unrec.cert)+' of '+FCT.n(K.unrec.total)+' certified.' : 'Every open reconciliation agrees to its support.'}
              top=${html`<${MiniTab} title="Largest open differences" cols=${['Account','Difference','Entity','Items']} rows=${mtRows(urF.slice().sort((a,b)=> b.val-a.val).slice(0,4).map(x=> ({ key:x.rec.id, val:x.val, x })),
                (r)=> [r.x.rec.name, amt(r.val), r.x.e, FCT.n(r.x.rec.items.reduce((s,n)=>s+n,0))])}/>`}
              foot=${[['Breaks', cr(K.unrec.breakVal), 'r'], ['Certified', pct(K.unrec.total? K.unrec.cert/K.unrec.total*100 : null,0)], ['Open', FCT.n(K.unrec.total-K.unrec.cert)]]}/>
            <${RCard} id="adj" kpi=${kpi} pick=${pick} title="Potential Adjustments" basis="Snapshot" value=${cr(ex.potential)} tone="crit"
              chip=${html`<${Pill} tone="r">${ex.potN} open cases</${Pill}>`}
              viz=${html`<div class="px-mini-bars">${exBy.slice(0,3).map(r=> html`<div key=${r.key}><span class="n" title=${r.name}>${r.name}</span><span class="trk"><i style=${{ width:(r.v/(exBy[0]? exBy[0].v : 1)*100)+'%' }}/></span><b class="num">${cr(r.v)}</b></div>`)}</div>`}
              note=${exBy[0]? cr(ex.potential)+' could be wrong in the books, mostly '+lc(exBy[0].name)+' ('+pct(exBy[0].v/ex.potential*100,0)+'). Not yet booked.' : null}
              top=${html`<${MiniTab} title="Entities with most at stake" cols=${['Entity','At stake','Share','Cases']} rows=${mtRows(M.group(adF, (x)=> x.e).slice(0,4), (r)=> [ename(r.key), amt(r.val), pct(r.val/(ex.potential||1)*100,0), FCT.n(r.n)])}/>`}
              foot=${[['Proposed', cr(ex.proposed)], ['Booked', cr(ex.booked)], ['Control', cr(ex.control)]]}/>
          </div></div></${Sec}>
      <${Sec} c="spend" icon="BookOpen" title="Journal KPIs" sub="Where journals come from, and where manual ones land."
        right=${html`<${Pill} tone="n">${FCT.n(K.jmix.v)} journals</${Pill}><${Pill} tone="a">${pct(K.jmix.share,0)} manual</${Pill}>`}><div class="px-brow">
        <${KCard} id="jmix" kpi=${kpi} pick=${pick} title="Journal Mix" sub=${'Posted journals by source, '+p.label}>
          <div class="px-catd"><div class="px-catd-c" style=${{height:132}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.PieChart}>
            <${R.Pie} data=${src} dataKey="val" nameKey="name" innerRadius="62%" outerRadius="96%" paddingAngle=${1} stroke=${COL.surface} strokeWidth=${2} isAnimationActive=${!P.useRM()} onClick=${(d,i,e)=>{ e && e.stopPropagation && e.stopPropagation(); pick('jmix', { key:d.key, dim:'src' }); }} style=${{cursor:'pointer'}}>
              ${src.map((r,i)=> h(R.Cell, { key:i, fill:r.c }))}</${R.Pie}><${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=> FCT.n(v)+' · '+pct(v/(srcT||1)*100) })}/></${R.PieChart}></${R.ResponsiveContainer}>
            <div class="px-donut-c"><b>${FCT.n(srcT)}</b><span>journals</span></div></div>
          <ul class="px-catl">${src.map(r=> html`<li key=${r.key}><button type="button" onClick=${stop(()=> pick('jmix', { key:r.key, dim:'src' }))} title=${r.name+': '+FCT.n(r.val)+' ('+pct(r.val/(srcT||1)*100)+')'}><i style=${{background:r.c}}/><span class="nm">${r.name}</span>
            <span class="sh"><em style=${{ width:(r.val/(src[0]? src[0].val : 1)*100)+'%', background:r.c }}/></span><b class="num">${FCT.n(r.val)}</b></button></li>`)}</ul></div></${KCard}>
        <${KCard} id="topacc" kpi=${kpi} pick=${pick} title="Manual Adjustments by Account" sub=${'Top 5 accounts hold '+pct(ta.top5)+' of '+cr(ta.total)+' manual journal value'}>
          <div class="px-topv">${ta.rows.slice(0,7).map((r,i)=> html`<button key=${r.acct} type="button" class="px-topv-r" onClick=${stop(()=> pick('topacc', { key:r.acct, dim:'acct' }))} title=${r.name+' · '+(M.A[r.acct]||{}).risk+' risk'}>
            <span class="rk num">${i+1}</span><span class="nm"><i style=${{ background:P.RISK[(M.A[r.acct]||{}).risk] }}/>${r.name}</span><span class="trk"><i style=${{ width:(r.val/ta.rows[0].val*100)+'%' }}/></span><b class="num">${cr(r.val,1)}</b><span class="num faint">${pct(r.share)}</span></button>`)}</div></${KCard}>
      </div></${Sec}>
      <${Sec} c="vendor" icon="Building2" title="Entity and Exposure KPIs" sub="Which entities risk a late close, and the value at stake."
        right=${html`<${Pill} tone="r">${mix[0].n} critical</${Pill}><${Pill} tone="a">${mix[1].n} high</${Pill}><${Pill}>${es.length} entities</${Pill}>`}><div class="px-brow">
        <${KCard} id="entmix" kpi=${kpi} pick=${pick} title="Entity Close Risk" sub=${es.length+' entities by close-risk category'}>
          <${Seg} label="Entity close risk" parts=${mix.map(m=> ({ l:m.id, v:m.n, c:P.RISK[m.id] }))}/>
          <div class="px-tiles h">
            <button type="button" class="px-tile" onClick=${stop(()=> pick('entmix', { key:'Critical', dim:'erisk' }))}><span class="i crit"><${Icon} n="TriangleAlert" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Critical or high</span><b>${hiE}</b><small>${es.filter(e=> M.risk(e.id).cat==='Critical').map(e=> e.id).join(', ') || 'none'}</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> pick('progress'))}><span class="i med"><${Icon} n="CalendarClock" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Forecast after target</span><b>${K.entmix.late}</b><small>entities beyond WD+${C.targetWD}</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> pick('health', { key:'mapq', dim:'component' }))}><span class="i ai"><${Icon} n="Link2" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Account mapping</span><b>${pct(K.mapq.v,1)}</b><small>${K.mapq.bad} unmapped</small></span></button>
            <button type="button" class="px-tile" onClick=${stop(()=> pick('unrec', { key:'Break', dim:'status' }))}><span class="i brand"><${Icon} n="GitCompare" size=${18} strokeWidth=${1.5}/></span><span class="tx"><span class="l">Reconciliation breaks</span><b>${K.unrec.breaks}</b><small>${cr(K.unrec.breakVal)} unexplained</small></span></button></div></${KCard}>
        <${KCard} id="adj" kpi=${kpi} pick=${pick} title="Potential adjustments by type" sub="Open and under-review estimates">
          <div class="px-xbars">${exBy.map(r=> html`<button key=${r.key} type="button" onClick=${stop(()=> pick('adj', { key:r.key, dim:'type' }))} title=${r.name+': '+cr(r.v)}>
            <span class="n">${r.name}</span><span class="trk"><i style=${{ width:(r.v/(exBy[0]? exBy[0].v : 1)*100)+'%' }}/></span><b class="num">${cr(r.v)}</b></button>`)}</div>
          <${Foot} items=${[['Potential', cr(ex.potential), 'r'], ['Proposed', cr(ex.proposed)], ['P&L decisions, all towers', K.adj.pnl? cr(K.adj.pnl.cr) : 'N/A']]}/></${KCard}>
      </div></${Sec}>
      <${Sec} c="exc" icon="Crosshair" title="Exceptions" sub="Open cases, largest value first."
        right=${html`<${Pill} tone="r">${cs.filter(c=>M.CT[c.type].basis==='fin').length} financial</${Pill}><${Pill}>${cs.filter(c=>M.CT[c.type].basis==='ctl').length} control</${Pill}>`}><section class="px-kc px-exc" aria-label="Open exceptions"><div class="px-kc-h"><span class="px-kc-t static"><span class="px-kc-i"><${Icon} n="Crosshair" size=${15} strokeWidth=${1.6}/></span><span>Open exceptions</span></span><${InfoI} text="Open cases, largest first. Financial cases may need a correcting entry in the books; control cases show where a check was missed."/>
          <${P.Seg} label="Exception type" value=${tab} onChange=${setTab} options=${[['all','All ('+cs.length+')'],['fin','Financial ('+cs.filter(c=>M.CT[c.type].basis==='fin').length+')'],['ctl','Control ('+cs.filter(c=>M.CT[c.type].basis==='ctl').length+')']]}/></div>
        <div class="px-tbl"><table class="t px-t dense"><caption class="sr">Open exceptions</caption><thead><tr><th>Priority</th><th>Type</th><th>Entity</th><th class="r">Amount</th><th class="r">Age</th><th>Status</th><th><span class="sr">Action</span></th></tr></thead>
          <tbody>${rows.map(({c,val})=>{ const pr = prio(c, val); return html`<tr key=${c.id} tabIndex="0" class="sel" onClick=${()=> openCase(c.id)} onKeyDown=${(e)=>{ if(e.key==='Enter') openCase(c.id); }}>
            <td><span class=${'px-prio p-'+pr.toLowerCase()}>${pr}</span></td><td>${M.CT[c.type].name}<div class="sub">${c.id}${c.ex? ' · '+c.ex : ''}${M.CT[c.type].basis==='ctl'? ' · value affected' : ''}</div></td><td>${ename(c.e)}</td>
            <td class="r num">${c.est==null && M.CT[c.type].basis==='fin'? html`<span class="faint">n.q.</span>` : amt(val)}</td><td class="r num">${Math.max(0, Math.floor(M.SNAP - c.opened))}d</td><td>${M.statusName(c.stNow)}</td>
            <td class="r"><button type="button" class="btn sm" onClick=${stop(()=> openCase(c.id))}>${c.ex && FCT.ex(c.ex)? 'Decide' : 'Investigate'}</button></td></tr>`; })}</tbody></table></div></section></${Sec}>
      <div class="px-board-f faint">${p.label} · snapshot ${C.snapLabel} · illustrative data.</div>
    </div></div>`;
  };

  /* ---------- helpers on the current navigation ---------- */
  P.rctx = (nav, f)=>{
    const groups = M.nav.groups(nav), comp = nav.kpi==='health'? groups.find(g=> g.dim==='component') : null, eff = comp? comp.key : nav.kpi;
    const gs = groups.filter(g=> g.dim!=='component'), ent = (()=>{ for(let i=nav.path.length-1;i>=0;i--) if(nav.path[i].t==='entity' || nav.path[i].t==='eprofile') return nav.path[i].id; return null; })();
    const facts = eff==='health'? [] : M.facts(eff, f).filter(x=> gs.every(g=> x.g[g.dim]===g.key) && (!ent || x.e===ent));
    return { eff, groups:gs, comp, entity:ent, facts };
  };
  const factSort = (id)=> (a,b)=> M.isRate(id)? ((a.ok===false?0:1)-(b.ok===false?0:1)) || (b.val-a.val) : (b.val-a.val);
  const RESULT = { tasks:'lag', recs:'status', jnl:'flag', ic:'status', var:'status', mapq:'entity' };
  const result = (id)=> ({ k:'res', l:'Why it fails', fmt:(x)=> x.ok? html`<span class="faint">${id==='mapq'? 'Mapped' : x.g[RESULT[id]]}</span>` : html`<span class="px-bad">${id==='mapq'? 'Not mapped' : x.g[RESULT[id]]}</span>`, sv:(x)=> x.ok? 1 : 0 });
  const issuesCell = (r)=>{ const is = M.issuesOf(r); return is.length? html`<span class="px-bad">${is.map(c=> M.issue(c).name).slice(0,2).join('; ')}</span>` : html`<span class="faint">None</span>`; };
  /* column sets per record kind; facts carry .rec */
  P.rcols = (id, kind)=>{
    const g = (f)=> (x)=> f(x.rec, x);
    const base = {
      task:[ { k:'n', l:'Task', w:'30%', fmt:g((t)=> html`<b class="nb">${t.name}</b><div class="sub">${t.id}</div>`), sv:g((t)=> t.name) }, { k:'e', l:'Entity', nx:true, fmt:g((t)=> t.e), sv:g((t)=> t.e) },
        { k:'gr', l:'Close activity', fmt:g((t)=> html`<span title=${M.grpDesc(t.grp)}>${M.grpName(t.grp)}</span>`) }, { k:'o', l:'Owner', nx:true, fmt:g((t)=> t.owner) }, { k:'d', l:'Planned', fmt:g((t)=> M.wdl(t.dueWD)+' · '+M.wdDate(t.m, t.dueWD)), sv:g((t)=> t.dueWD) },
        { k:'x', l:'Done', fmt:g((t)=>{ const d = M.taskDoneWD(t); return d==null? html`<span class=${t.m<5 || t.dueWD<=C.todayWD? 'px-bad' : 'faint'}>${t.st}</span>` : M.wdl(d); }), sv:g((t)=> M.taskDoneWD(t)==null? 99 : M.taskDoneWD(t)) } ],
      je:[ { k:'id', l:'Journal', w:'26%', fmt:g((j)=> html`<b>${j.id}</b><div class="sub">${j.desc || M.catName(j.cat)}${j.ex? ' · '+j.ex : ''}</div>`), sv:g((j)=> j.id) }, { k:'e', l:'Entity', nx:true, fmt:g((j)=> j.e), sv:g((j)=> j.e) },
        { k:'s', l:'Source', nx:true, fmt:g((j)=> M.srcName(j.src)) }, { k:'a', l:'Account', fmt:g((j)=> anm(j.acct)), sv:g((j)=> j.acct) },
        { k:'d', l: id==='jpend'? 'Submitted' : 'Posted', fmt:g((j)=> M.dt(j.post!=null? j.post : j.sub!=null? j.sub : j.drafted)), sv:g((j)=> j.post!=null? j.post : j.sub) }, { k:'v', l:'Value', r:true, fmt:g((j)=> amt(j.val)), sv:g((j)=> j.val) } ],
      rec:[ { k:'n', l:'Reconciliation', w:'30%', fmt:g((r)=> html`<b class="nb">${r.name}</b><div class="sub">${r.id}</div>`), sv:g((r)=> r.name) }, { k:'e', l:'Entity', nx:true, fmt:g((r)=> r.e), sv:g((r)=> r.e) },
        { k:'rk', l:'Risk', fmt:g((r)=> html`<${P.RiskTag} cat=${r.risk} small=${true}/>`), sv:g((r)=> M.riskRank[r.risk]) }, { k:'gl', l:'GL balance', r:true, nx:true, fmt:g((r)=> amt(r.gl)), sv:g((r)=> r.gl) },
        { k:'df', l:'Unexplained', r:true, fmt:g((r)=> r.diff? html`<span class=${r.st==='Break'? 'px-bad' : ''}>${amt(r.diff)}</span>` : html`<span class="faint">—</span>`), sv:g((r)=> r.diff) },
        { k:'du', l:'Due', fmt:g((r)=> M.wdl(r.dueWD)), sv:g((r)=> r.dueWD) }, { k:'st', l:'Status', fmt:g((r)=> r.st+(r.certWD!=null? ' '+M.wdl(r.certWD) : '')), sv:g((r)=> r.st) } ],
      ic:[ { k:'r', l:'IC item', fmt:g((x)=> html`<b>${x.ref}</b><div class="sub">${x.id}</div>`), sv:g((x)=> x.id) }, { k:'p', l:'Pair', fmt:g((x)=> x.pair), sv:g((x)=> x.pair) },
        { k:'v', l:'Value', r:true, fmt:g((x)=> amt(x.val)), sv:g((x)=> x.val) }, { k:'d', l:'Difference', r:true, fmt:g((x)=> x.diff? amt(x.diff) : html`<span class="faint">—</span>`), sv:g((x)=> x.diff) },
        { k:'s', l:'Status', fmt:g((x)=> M.agreed(x)? html`<span class="faint">${x.st}</span>` : html`<span class="px-bad">${x.st}</span>`), sv:g((x)=> x.st) } ],
      var:[ { k:'l', l:'P&L line', w:'30%', fmt:g((v)=> html`<b class="nb">${v.line}</b><div class="sub">${v.id}${v.ex? ' · '+v.ex : ''}</div>`), sv:g((v)=> v.line) }, { k:'e', l:'Entity', fmt:g((v)=> v.group? 'Group' : v.e), sv:g((v)=> v.e) },
        { k:'v', l:'Variance', r:true, fmt:g((v)=> html`<span class=${v.v<0? 'px-bad' : ''}>${(v.v<0? '−' : '+')+amt(Math.abs(v.v))}</span> <span class="faint">${v.pct}</span>`), sv:g((v)=> v.v) },
        { k:'s', l:'Commentary', fmt:g((v)=> v.st+(v.signedWD!=null? ' '+M.wdl(v.signedWD) : '')), sv:g((v)=> v.st) } ],
      acct:[ { k:'n', l:'Local account', fmt:g((u)=> u.mappedStd? html`<span class="faint">Mapped account</span>` : html`<b>${u.local}</b><div class="sub">${u.id}</div>`), sv:g((u)=> u.local||'') },
        { k:'e', l:'Entity', fmt:g((u)=> u.e) }, { k:'b', l:'Balance', r:true, fmt:g((u)=> u.bal==null? '—' : amt(u.bal)), sv:g((u)=> u.bal||0) }, { k:'s', l:'Suggested mapping', fmt:g((u)=> u.sugg? u.sugg+' ('+pct(u.conf*100,0)+')' : '—') } ],
      case:[ { k:'id', l:'Case', w:'14%', fmt:g((c)=> html`<b>${c.id}</b>${c.ex? html`<div class="sub">${c.ex}</div>` : ''}`), sv:g((c)=> c.id) }, { k:'t', l:'Type', w:'26%', fmt:g((c)=> M.CT[c.type].name), sv:g((c)=> c.type) },
        { k:'e', l:'Entity', fmt:g((c)=> ename(c.e)), sv:g((c)=> c.e) }, { k:'v', l:'Estimate', r:true, fmt:g((c)=> M.CT[c.type].basis==='ctl'? html`${amt(c.affected)} <span class="faint">affected</span>` : c.est==null? html`<span class="faint">n.q.</span>` : amt(c.est)), sv:(x)=> x.val },
        { k:'cf', l:'Conf.', r:true, nx:true, fmt:g((c)=> pct(c.conf*100,0)), sv:g((c)=> c.conf) }, { k:'s', l:'Status', fmt:g((c)=> M.statusName(c.stNow || M.caseStatus(c))) }, { k:'o', l:'Opened', nx:true, fmt:g((c)=> M.date(c.opened)), sv:g((c)=> c.opened) } ],
      entity:[ { k:'n', l:'Entity', fmt:g((e)=> html`<b>${e.id} ${e.name}</b><div class="sub">${e.type} · ${e.seg}</div>`), sv:g((e)=> e.id) },
        { k:'r', l:'Close risk', fmt:g((e)=>{ const r = M.risk(e.id); return html`<${P.RiskTag} cat=${r.cat} score=${r.score} small=${true}/>`; }), sv:g((e)=> M.risk(e.id).score) },
        { k:'f', l:'Forecast', fmt:g((e)=> M.wdl(M.forecast(e.id))+' · '+M.likelihood(e.id)+'%'), sv:g((e)=> M.forecast(e.id)) },
        { k:'d', l:'Tasks done', r:true, fmt:g((e)=>{ const p = M.entity(e.id); return p.done+' / '+p.ts.length; }) }, { k:'b', l:'Behind plan', r:true, fmt:g((e)=> M.entity(e.id).behind), sv:g((e)=> M.entity(e.id).behind) } ]
    }[kind] || [];
    if(M.isRate(id) && kind!=='case' && kind!=='entity') return base.concat([result(id)]);
    if(kind==='je' && id==='jpend') return base.concat([{ k:'rk', l:'Risk', fmt:(x)=> !x.rec.review? html`<span class="faint">${x.rec.risk} · bulk approve</span>` : html`<span class="px-bad">${x.rec.risk} · reviewer</span>` }]);
    if(kind==='je' || kind==='rec') return base.concat([{ k:'is', l:'Issues', fmt:(x)=> issuesCell(x.rec), sv:(x)=> M.issuesOf(x.rec).length }]);
    return base;
  };
  const KIND_T = { task:'Close tasks', je:'Journals', rec:'Reconciliations', ic:'Intercompany items', var:'Material variances', acct:'Local accounts', case:'Cases', entity:'Entities' };
  P.RRecords = ({ id, facts:all, onOpen, title, limit, of, sub, filters })=>{
    const [fv, setFv] = useState({});
    const facts = filters? all.filter(x=> filters.every(([l, fn])=> !fv[l] || fn(x)===fv[l])) : all, on = filters && filters.some(([l])=> fv[l]);
    const bar = filters && html`<div style=${{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }} onClick=${(e)=> e.stopPropagation()}>
      ${filters.map(([l, fn])=>{ const vals = [...new Set(all.map(fn).filter(Boolean))].sort(); return html`<${P.Pick} key=${l} label=${l} value=${fv[l]||''} onChange=${(v)=> setFv(Object.assign({}, fv, { [l]:v }))} options=${[['', 'All']].concat(vals.map(v=> [v, v+' ('+all.filter(x=> fn(x)===v).length+')']))}/>`; })}
      ${on && html`<button type="button" class="px-link sm" onClick=${()=> setFv({})}>Clear filters</button>`}</div>`;
    const groups = {}; facts.forEach(x=>{ (groups[x.kind]=groups[x.kind]||[]).push(x); });
    if(filters && !facts.length) return html`<${P.Card} title=${html`${title} <span class="px-count">0 of ${FCT.n(all.length)}</span>`} sub=${sub} right=${bar}><p class="px-p faint">No records match these filters.</p></${P.Card}>`;
    return html`<${Fragment}>${Object.keys(groups).map(k=> html`<${P.Card} key=${k} title=${html`${title || KIND_T[k]} <span class="px-count">${FCT.n(groups[k].length)}${on? ' of '+FCT.n(all.length) : of? ' of '+FCT.n(of) : ''}</span>`} sub=${sub} right=${bar} className="flush">
      <${P.Table} cols=${P.rcols(id, k)} rows=${groups[k].slice().sort(factSort(id))} rowKey=${(x)=> x.rec.id} caption=${title||KIND_T[k]} onOpen=${onOpen} limit=${limit||20}/></${P.Card}>`)}</${Fragment}>`;
  };
  /* filters on the late-close-task list: who, what activity, where it stands, owner */
  const RFILTERS = { tasks:[['Entity', (x)=> x.e], ['Close activity', (x)=> M.grpName(x.rec.grp)], ['Where it stands', (x)=> M.taskDoneWD(x.rec)!=null? 'Finished late' : x.rec.st], ['Owner', (x)=> x.rec.owner]] };
  const asFacts = (recs)=> recs.map(r=> ({ rec:r, kind:r.kind==='je'||r.kind==='rec'||r.kind==='task'||r.kind==='ic'||r.kind==='var'||r.kind==='acct'? r.kind : 'case', e:r.e||r.a, val: r.kind==='je'? r.val : r.kind==='rec'? Math.abs(r.diff) : r.kind==='var'? Math.abs(r.v) : r.kind==='ic'? r.val : r.kind==='acct'? r.bal : (r.est!=null? r.est : r.affected||0), g:{} }));
  P.asFacts = asFacts;

  /* breakdown rows for one dimension */
  P.rGroupRows = (id, facts, dim)=>{
    const rate = M.isRate(id);
    let rows = M.group(facts, (x)=> x.g[dim], { rate, label:(k)=> M.dimLabel(dim, k) });
    if(rate) rows = rows.filter(r=> r.bad>0);
    const cnt = id==='progress' || id==='jmix' || id==='entmix';
    return rows.map(r=> Object.assign(r, rate? { val:r.bad, sub: FCT.n(r.bad)+' of '+FCT.n(r.n)+(r.badVal && id!=='tasks'? ' · '+amt(r.badVal) : '')+(r.rate!=null? ' · '+pct(r.rate)+' '+(RATEW[id]||'passed') : '') }
      : cnt? { val:r.n, sub: (id==='progress'? FCT.n(r.ok)+' done · ' : '')+(r.ne>1 && dim!=='entity'? r.ne+' entities' : '') } : { sub: FCT.n(r.n)+' records'+(r.ne>1 && dim!=='entity'? ' · '+r.ne+' entities' : '') }));
  };
  const SelDetail = ({ id, facts, sel, dim, onDrill, onEntity })=>{
    if(!sel) return null;
    const fs = facts.filter(x=> x.g[dim]===sel.key), rate = M.isRate(id), bad = fs.filter(x=> x.ok===false), cnt = id==='progress' || id==='jmix' || id==='entmix';
    const ents = M.group(rate? bad : fs, (x)=> x.e).slice(0,5);
    return html`<div class="px-seld" aria-live="polite"><div class="hd"><b>${M.dimLabel(dim, sel.key)}</b><button type="button" class="btn sm primary" onClick=${onDrill}>Drill in<${Icon} n="ChevronRight" size=${14}/></button></div>
      <div class="px-kv">${rate? html`<div><span>Records</span><b>${FCT.n(fs.length)}</b></div><div><span>Exceptions</span><b>${FCT.n(bad.length)}${id!=='tasks'? ' · '+amt(M.sum(bad,x=>x.val)) : ''}</b></div><div><span>Rate</span><b>${pct(fs.length? (fs.length-bad.length)/fs.length*100 : null)}</b></div>`
        : html`<div><span>Records</span><b>${FCT.n(fs.length)}</b></div>${!cnt && html`<div><span>Value</span><b>${cr(M.sum(fs,x=>x.val))}</b></div>`}`}</div>
      ${dim!=='entity' && html`<div class="ct">Entities behind it</div>${ents.map(r=> html`<button key=${r.key} type="button" class="px-vrow" onClick=${()=> onEntity(r.key)}><span>${ename(r.key)}</span><span class="num">${cnt || id==='tasks'? FCT.n(r.n) : amt(r.val)}</span></button>`)}`}</div>`;
  };
  const Breakdown = ({ id, facts, nav, dispatch, title, sub, exclude })=>{
    const top = M.nav.top(nav), dims = (M.dims[id]||[]).filter(d=> !(exclude||[]).includes(d));
    if(!dims.length) return null;
    const dim = top.by && dims.includes(top.by)? top.by : dims[0], rows = P.rGroupRows(id, facts, dim), rate = M.isRate(id), cnt = id==='progress' || id==='jmix' || id==='entmix';
    const sel = nav.sel && nav.sel.dim===dim? nav.sel : null, drill = (r)=> dispatch({ t:'drill', node:N.group(dim, r.key) });
    return html`<${P.Card} title=${title || (rate? 'Exceptions by' : 'Breakdown')} sub=${sub}
        right=${dims.length>1 && html`<${P.Pick} label="By" value=${dim} onChange=${(d)=> dispatch({ t:'node', v:{ by:d } })} options=${dims.map(d=> [d, d==='status' && STATN[id]? STATN[id] : M.dimName[d]])}/>`}>
        <${P.BarList} rows=${rows} label=${'Breakdown by '+M.dimName[dim]} sel=${sel && sel.key} fmt=${rate || cnt? (v)=> FCT.n(v) : (v)=> cr(v)} rate=${rate}
          onSelect=${(r)=> dispatch({ t:'sel', v:{ key:r.key, dim } })} onOpen=${drill} emptyText=${rate? 'No exceptions in this view.' : undefined}/>
        <${SelDetail} id=${id} facts=${facts} sel=${sel} dim=${dim} onDrill=${()=> sel && drill(sel)} onEntity=${(e)=> dispatch({ t:'drill', node:N.entity(e) })}/></${P.Card}>`;
  };

  /* ---------- KPI detail roots ---------- */
  const Delta = ({ id, v, prior })=>{ if(v==null || prior==null) return html`<span class="px-d faint">${prior==null && v!=null? 'No comparable close' : ''}</span>`;
    const d = v - prior; if(Math.abs(d)<0.05) return html`<span class="px-d">No change</span>`; const k = M.KPI[id], up = d>0, good = k.good==='up'? up : k.good==='down'? !up : null;
    return html`<span class=${cx('px-d', good===true&&'up', good===false&&'down')}>${up?'▲':'▼'} ${MONEY.includes(id)? cr(Math.abs(d)) : id==='jmix'? FCT.n(Math.abs(d)) : FCT.n(Math.abs(d),1)+' pts'}</span>`; };
  const Head = ({ id, f, children })=>{
    const k = M.kpi(id, f), st = M.status(id, k.v), tv = P.useTween(k.v);
    return html`<div class="px-head"><div class="big"><div class="v num">${P.fmtKpi(id, tv)}${id==='health' && k.v!=null? html`<small>/100</small>` : ''}</div>
      <div class="m"><${P.StatusCue} st=${st}/><${Delta} id=${id} v=${k.v} prior=${k.prior}/>${k.prior!=null && html`<span class="faint">vs ${M.period(M.period(f.period).prior).label}</span>`}<${P.KpiDef} id=${id}/></div>
      ${k.v==null && html`<div class="px-na">N/A: no eligible records for these filters. Not shown as zero.</div>`}</div>
      <div class="px-stats">${children}</div></div>`;
  };
  const roots = {};
  const stageTone = (rate)=> rate==null? 'na' : rate>=.15? 'off' : rate>=.05? 'watch' : 'good';
  /* R2R chain: where in the record-to-report process the issues arise, scoped to one KPI's records (kinds) or all of them; same anatomy as the P2P chain */
  const KINDS = { tasks:['task'], progress:['task'], jnl:['je'], jpend:['je'], jmix:['je'], topacc:['je'], recs:['rec'], unrec:['rec'], ic:['ic'], var:['var'], mapq:['acct'] };
  P.RChain = ({ f, kinds, stg, setStage, list })=>{
    const S = M.chainScope(f, kinds), live = M.cases(f).filter(c=> M.statusMeasure(c.stNow)==='potential' && (!kinds || c.lines.some(id=>{ const r = M.rec(id); return r && kinds.includes(r.kind); })));
    const byStage = {}; C.stages.forEach(s=> byStage[s.id] = live.filter(c=> M.caseStages(c).stages[s.id]).length);
    const sel = stg && S[stg];
    return html`<${P.Card} title="Where in the R2R chain the issues arise" sub="At which step of the close? Click a step to see what went wrong there." className="px-chk-card"
        right=${html`<div class="px-chk-act">${stg && html`<button type="button" class="btn sm" onClick=${()=> setStage(null)}><${Icon} n="RotateCcw" size=${13}/>View all</button>`}<a class="btn sm" href=${FCT.href('screens/r2r/process.html')}><${Icon} n="Layers" size=${13}/>Process chain</a></div>`}>
        <ol class="px-chk" aria-label="R2R process steps: select one to see its issues">${C.stages.map((s,i)=>{ const x = S[s.id], rate = x.vol? x.n/x.vol : null, tone = stageTone(rate), on = stg===s.id;
          return html`<li key=${s.id}><button type="button" class=${cx('px-chk-b', 't-'+tone, on && 'on', stg && !on && 'dim')} aria-pressed=${on} disabled=${!x.vol} onClick=${()=> setStage(s.id)} title=${s.q+' '+FCT.n(x.n)+' of '+FCT.n(x.vol)+' records have an issue.'}>
            <span class="ic"><${Icon} n=${s.icon} size=${20} strokeWidth=${1.7}/></span>
            <span class="tx"><span class="nm">${i+1} · ${s.name}</span><span class="rt num">${rate==null? 'Not measured here' : pct(rate*100,1)+' with issues'}</span></span>
            <span class="ct"><b class="num">${FCT.n(byStage[s.id])}</b><small>open cases</small></span>
            <span class="ft">${!x.vol? '—' : FCT.n(x.n)+' of '+FCT.n(x.vol)+' records'}${x.val? ' · '+cr(x.val) : ''}</span></button>${i<5 && html`<span class="ar" aria-hidden="true"><${Icon} n="ChevronRight" size=${16}/></span>`}</li>`; })}</ol>
        <div class="px-chk-k" aria-hidden="true"><span><i class="t-good"/>Under 5% of records with issues</span><span><i class="t-watch"/>5–15%</span><span><i class="t-off"/>Over 15%</span></div>
        ${list && sel && html`<div style=${{ marginTop:12 }}><p class="px-p"><b>Issues at ${M.stage(stg).name}</b> <span class="faint">· ${FCT.n(sel.n)} of ${FCT.n(sel.vol)} records${sel.val? ' · '+amt(sel.val) : ''}</span></p>
          ${sel.list.length? sel.list.map(x=> html`<div key=${x.code} class="px-vrow" style=${{ cursor:'default', borderBottom:'1px solid var(--px-line)' }}><span><b>${M.issue(x.code).name}</b><br/><span class="faint">${M.issue(x.code).kind==='fin'? 'Financial' : M.issue(x.code).kind==='ctl'? 'Control' : 'Operational'} · top entities: ${Object.entries(x.recs.reduce((o,r)=>{ const e = r.kind==='ic'? r.a : r.e; o[e] = (o[e]||0)+1; return o; }, {})).sort((p,q)=> q[1]-p[1]).slice(0,3).map(([e,n])=> e+' ('+n+')').join(', ')}</span></span><span class="num">${FCT.n(x.n)}${x.val? ' · '+amt(x.val) : ''}</span></div>`)
            : html`<p class="px-p faint">No issues at this step.</p>`}</div>`}</${P.Card}>`;
  };
  roots.health = ({ f, nav, dispatch })=>{
    const hl = M.health(f), S = M.chainScope(f), ex = M.exposure(M.cases(f)), top = M.nav.top(nav), stg = top.stage || null;
    const sel = nav.sel && nav.sel.dim==='component'? nav.sel.key : null, comp = sel && hl.comps.find(c=> c.kpi===sel);
    const all = M.cases(f).filter(c=> M.statusMeasure(c.stNow)==='potential').map(c=> Object.assign(c, { cs:M.caseStages(c) }));
    const byStage = {}; C.stages.forEach(s=> byStage[s.id] = all.filter(c=> c.cs.stages[s.id]).length);
    const rows = all.filter(c=> !stg || c.cs.stages[stg]).map(c=> ({ rec:c, kind:'case', e:c.e, val: c.est!=null? c.est : (c.affected||0), g:{} }))
      .sort((a,b)=> (M.CT[b.rec.type].basis==='fin') - (M.CT[a.rec.type].basis==='fin') || (b.val*(b.rec.conf||1)) - (a.val*(a.rec.conf||1)));
    const setStage = (s)=> dispatch({ t:'node', v:{ stage: s===stg? null : s } });
    const cols = [
      { k:'id', l:'Case', w:'14%', fmt:(x)=> html`<b>${x.rec.id}</b><div class="sub">${x.rec.ex? x.rec.ex+' · ' : ''}${Math.max(0, Math.floor(M.SNAP - x.rec.opened))}d open</div>`, sv:(x)=> x.rec.opened },
      { k:'e', l:'Entity', w:'20%', fmt:(x)=> html`<b class="nb">${ename(x.e)}</b><div class="sub">${(M.E[x.e]||{}).seg||'Group-wide'}</div>`, sv:(x)=> x.e },
      { k:'val', l:'At stake', w:'13%', r:true, fmt:(x)=> html`<b>${x.rec.est==null && !x.rec.affected? 'n.q.' : amt(x.val)}</b><div class="sub">${M.CT[x.rec.type].basis==='fin'? 'estimate · '+pct(x.rec.conf*100,0) : 'value affected'}</div>`, sv:(x)=> x.val },
      { k:'t', l:'Investigation', w:'40%', fmt:(x)=>{ const codes = stg? (x.rec.cs.stages[stg]||[]) : [];
          return html`<b class="nb">${M.CT[x.rec.type].name}</b><div class="sub">At ${M.stage(x.rec.cs.primary).name}${codes.length? ' · here: '+codes.map(k=> M.issue(k).name).join('; ') : ''}</div>`; }, sv:(x)=> x.rec.type },
      { k:'st', l:'Status', w:'13%', fmt:(x)=> html`<span class=${'px-cst s-'+x.rec.stNow}>${M.statusName(x.rec.stNow)}</span><div class="sub">${M.CT[x.rec.type].basis==='fin'? 'Financial' : 'Control'}</div>`, sv:(x)=> x.rec.stNow } ];
    return html`<${Fragment}>
      <${Head} id="health" f=${f}><${P.Stat} label="Data coverage" value=${pct(hl.coverage*100,0)} sub=${hl.coverage<1? 'Components without data are excluded, not scored as perfect' : 'All six components have data'}/>
        <${P.Stat} label="Band" value=${hl.band? hl.band.label : 'N/A'} sub="Healthy 75+, Watch 55–74, At risk below 55"/>
        <${P.Stat} label="Points lost" value=${hl.score==null? 'N/A' : FCT.n(100-hl.score)} sub=${'Largest: '+(hl.comps.filter(c=>c.lost!=null).sort((a,b)=>b.lost-a.lost)[0]||{name:'—'}).name}/></${Head}>
      <div class="px-grid g-2">
        <${P.Card} title="Component contributions" sub="Normalised score = (value − floor) ÷ (target − floor). Select a component; drill in for entity, account and records.">
          <div class="px-comps" role="list">${hl.comps.map(c=> html`<div key=${c.kpi} role="listitem" class=${cx('px-comp', sel===c.kpi && 'on')} onDoubleClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}>
            <button type="button" class="b" aria-pressed=${sel===c.kpi} onClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}>
              <span class="n">${c.name}<small>weight ${c.w}</small></span><span class="v num">${c.v==null? 'N/A' : pct(c.v)}</span>
              <span class="trk" title=${'Score '+(c.sc==null? 'N/A' : Math.round(c.sc))}><i style=${{ width:(c.sc||0)+'%' }}/><em style=${{ left:'100%' }}/></span>
              <span class="p num">${c.contrib==null? '—' : '+'+FCT.n(c.contrib,1)}<small>${c.lost==null? '' : ' −'+FCT.n(c.lost,1)}</small></span></button>
            <button type="button" class="px-drill" aria-label=${'Drill in to '+c.name} onClick=${()=> dispatch({ t:'drill', node:N.group('component', c.kpi) })}><${Icon} n="ChevronRight" size=${14}/></button></div>`)}</div>
          ${comp && html`<div class="px-note">${comp.name}: ${comp.v==null? 'no data' : pct(comp.v)} against floor ${comp.floor}% and target ${comp.target}% gives ${Math.round(comp.sc)} of 100, worth ${FCT.n(comp.contrib,1)} of the score. ${comp.kpi!=='mapq' && html`<button type="button" class="px-link" onClick=${()=> dispatch({ t:'kpiJump', kpi:comp.kpi })}>Open ${comp.name}</button>`}</div>`}</${P.Card}>
        <${P.Card} title="Health by close" sub="Account mapping has no history before this snapshot, so earlier closes use five components (coverage 85%)."><${P.RTrend} id="health" f=${f}/></${P.Card}></div>
      <${P.RChain} f=${f} stg=${stg} setStage=${setStage}/>
      <${P.Card} className="flush px-cases" title=${html`${stg? 'Open cases touching '+M.stage(stg).name : 'All open cases'} <span class="px-count">${FCT.n(rows.length)}</span>`}
        right=${html`<span class="px-cases-s">${stg? html`<span class="px-pill t-a">Filtered: ${M.stage(stg).name}</span><button type="button" class="px-link sm" onClick=${()=> setStage(null)}>View all ${FCT.n(all.length)}</button>`
          : html`<span class="faint">Potential ${cr(ex.potential)} · proposed ${cr(ex.proposed)} · booked ${cr(ex.booked)}</span>`}</span>`}>
        <${P.Table} cols=${cols} rows=${rows} rowKey=${(x)=>x.rec.id} caption=${stg? 'Open cases at '+M.stage(stg).name : 'All open cases'} rowClick=${true} dense=${true}
          onOpen=${(x)=> dispatch({ t:'drill', node:N.case(x.rec.id) })} limit=${12}
          emptyText=${stg? 'No open cases touch '+M.stage(stg).name+' under these filters. Use View all to see every case.' : 'No open cases under these filters.'}/></${P.Card}></${Fragment}>`;
  };
  const openRec = (dispatch)=> (x)=> dispatch({ t:'drill', node:N.rec(x) });
  /* plain-language note under the headline of the four snapshot KPIs: what the number is made of, where most of it sits */
  const NoteFor = ({ id, f, facts })=>{ const k = M.kpi(id, f); if(k.v==null) return null;
    const topE = (fs, by)=>{ const g = M.group(fs, by || ((x)=> x.e)); return g[0]; };
    let t = '';
    if(id==='progress'){ const b = facts.filter(x=> x.g.status==='Behind plan'), te = topE(b), d = k.forecast - C.targetWD;
      t = FCT.n(k.done)+' of '+FCT.n(k.n)+' close tasks are done; the plan expected '+FCT.n(k.plan)+' by now. '+FCT.n(k.behind)+' are behind plan'+(te? ', most at '+te.key+' ('+te.n+')' : '')+'. The close is forecast to finish at WD+'+k.forecast+(d>0? ', '+d+' day'+(d===1? '' : 's')+' after the WD+'+C.targetWD+' target.' : ', on target.'); }
    if(id==='jpend'){ const old = facts.filter(x=> M.issuesOf(x.rec).includes('jePend')).length, te = topE(facts);
      t = FCT.n(k.n)+' journals worth '+amt(k.v)+' are waiting for approval'+(old? '; '+old+' have waited more than a day' : '')+'. '+FCT.n(k.n-k.review)+' are low risk and can be approved together; '+FCT.n(k.review)+' need a closer look'+(te? '. Most value waits at '+te.key+' ('+amt(te.val)+').' : '.'); }
    if(id==='unrec'){ const big = facts.slice().sort((a,b)=> b.val-a.val)[0];
      t = FCT.n(k.n)+' of '+FCT.n(k.total)+' reconciliations still have money that does not agree with its support, '+amt(k.v)+' in total. '+FCT.n(k.breaks)+' gaps are above ₹10 L ('+amt(k.breakVal)+')'+(big? '; the largest is '+big.rec.name+' at '+big.e+' ('+amt(big.val)+').' : '.'); }
    if(id==='adj'){ const tt = topE(facts, (x)=> x.g.type);
      t = FCT.n(facts.length)+' open cases could make the accounts wrong by about '+amt(k.v)+(tt? '. The biggest part is '+M.CT[tt.key].name.toLowerCase()+' ('+amt(tt.val)+')' : '')+'. These are estimates: none of these '+FCT.n(facts.length)+' cases has been booked as an adjustment yet.'; }
    return t? html`<${AI}>${t}</${AI}>` : null; };
  roots.progress = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('progress', f), B = D.r2r.burnup, rm = P.useRM();
    const bd = B.days.map((d,i)=> ({ d, plan:B.plan[i], actual: i===C.todayWD+2? k.done : B.actual[i] }));
    return html`<${Fragment}><${Head} id="progress" f=${f}><${P.Stat} label="Tasks done" value=${FCT.n(k.done)+' of '+FCT.n(k.n)} sub=${'The plan expected '+FCT.n(k.plan)+' by now'}/>
      <${P.Stat} label="Tasks behind plan" value=${FCT.n(k.behind)+' of '+FCT.n(k.n)} sub="Due by WD+2 and still not done"/><${P.Stat} label="Forecast close" value=${M.wdl(k.forecast)} sub=${'Target WD+'+C.targetWD}/></${Head}><${NoteFor} id="progress" f=${f} facts=${facts}/>
      <div class="px-grid g-2"><${P.Card} title="Close progress: planned vs actual" sub="Are we keeping up with the plan? Tasks done (solid) against tasks planned (dashed), by working day.">
        <${P.ChartBox} height=${180} label="Close burn-up: planned and actual tasks complete by working day" table=${P.mini(['Day','Plan','Actual'], bd.map(r=> [r.d, r.plan, r.actual==null? '—' : r.actual]))}>
          <${R.LineChart} data=${bd} margin=${{top:12,right:14,left:-6,bottom:0}}><${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="d" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${40}/>
            <${R.Tooltip} content=${h(P.Tip,{})}/><${R.Line} type="monotone" dataKey="plan" name="Planned tasks complete" stroke=${COL.brass} strokeDasharray="4 3" dot=${false} isAnimationActive=${!rm}/>
            <${R.Line} type="monotone" dataKey="actual" name="Actual tasks complete" stroke=${COL.kc} strokeWidth=${2} connectNulls=${false} isAnimationActive=${!rm}/></${R.LineChart}></${P.ChartBox}><${P.RKey} items=${[['line', COL.kc, 'Tasks done (actual)'], ['dash', COL.brass, 'Tasks planned to be done']]}/></${P.Card}>
        <${P.Card} title="Entities against plan" sub="Which entities are falling behind? Worst first." className="flush"><${P.Table} cols=${P.rcols('progress','entity')} rows=${M.ents(f).map(e=> ({ rec:e, kind:'entity', e:e.id, val:0, g:{} })).sort((a,b)=> M.entity(b.e).behind - M.entity(a.e).behind)} rowKey=${(x)=> x.e} caption="Entities" rowClick=${true} dense=${true} onOpen=${(x)=> dispatch({ t:'drill', node:N.entity(x.e) })} limit=${10}/></${P.Card}></div>
      <${P.RChain} f=${f} kinds=${KINDS['progress']} stg=${M.nav.top(nav).stage || null} setStage=${(x)=> dispatch({ t:'node', v:{ stage: x===M.nav.top(nav).stage? null : x } })} list=${true}/>
      <${Breakdown} id="progress" facts=${facts} nav=${nav} dispatch=${dispatch} title="Close tasks by" sub="Who and what is behind it? Bars count the September close tasks; click to see, double-click to open."/>
      <${P.RRecords} id="progress" facts=${facts.filter(x=> x.g.status==='Behind plan')} of=${facts.length} onOpen=${openRec(dispatch)} title="Tasks behind plan" sub="Which records? Open one to see the full story behind it."/></${Fragment}>`; };
  roots.jpend = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('jpend', f), dr = M.set('je', f).filter(j=> M.jSt(j)==='Draft');
    return html`<${Fragment}><${Head} id="jpend" f=${f}><${P.Stat} label="Journals waiting" value=${FCT.n(k.n)} sub=${(k.n-k.review)+' low risk, '+k.review+' need a closer look'}/>
      <${P.Stat} label="Safe to approve in bulk" value=${cr(M.sum(facts.filter(x=> !x.rec.review), x=>x.val))} sub="Low-risk journals the routing model clears"/><${P.Stat} label="AI drafts not submitted" value=${cr(k.draftVal)} sub=${k.drafts+' journals; not counted in the total'} tone="aside"/></${Head}><${NoteFor} id="jpend" f=${f} facts=${facts}/>
      ${FCT.ex('RTR-JNL-08') && html`<div class="px-ex"><span>Shared decision: <b>RTR-JNL-08</b> ${FCT.ex('RTR-JNL-08').title}</span><${P.Decide} id="RTR-JNL-08"/></div>`}
      <${P.RChain} f=${f} kinds=${KINDS['jpend']} stg=${M.nav.top(nav).stage || null} setStage=${(x)=> dispatch({ t:'node', v:{ stage: x===M.nav.top(nav).stage? null : x } })} list=${true}/>
      <${Breakdown} id="jpend" facts=${facts} nav=${nav} dispatch=${dispatch} title="Journals waiting by" sub="Who and what is waiting? Bars show value waiting; click to see, double-click to open."/>
      <${P.RRecords} id="jpend" facts=${facts} onOpen=${openRec(dispatch)} title="Journals waiting for approval" sub="Which records? Open one to see the full story behind it."/>
      ${dr.length>0 && html`<${P.RRecords} id="jpend" facts=${asFacts(dr)} onOpen=${openRec(dispatch)} title="AI drafts not yet submitted" sub="Drafted by AI; the preparer has not submitted them, so they are not in the total."/>`}</${Fragment}>`; };
  roots.unrec = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('unrec', f);
    return html`<${Fragment}><${Head} id="unrec" f=${f}><${P.Stat} label="Reconciliations with a gap" value=${FCT.n(k.n)+' of '+FCT.n(k.total)} sub="Not certified, with an unexplained difference"/>
      <${P.Stat} label="Gaps above ₹10 L" value=${cr(k.breakVal)} sub=${k.breaks+' reconciliations'}/><${P.Stat} label="Certified" value=${FCT.n(k.cert)+' of '+FCT.n(k.total)} sub="Certified ones are not counted"/></${Head}><${NoteFor} id="unrec" f=${f} facts=${facts}/>
      <${P.RChain} f=${f} kinds=${KINDS['unrec']} stg=${M.nav.top(nav).stage || null} setStage=${(x)=> dispatch({ t:'node', v:{ stage: x===M.nav.top(nav).stage? null : x } })} list=${true}/>
      <${Breakdown} id="unrec" facts=${facts} nav=${nav} dispatch=${dispatch} title="Unexplained gap by" sub="Where is the money that does not agree? Bars show the unexplained amount; click to see, double-click to open."/>
      <${P.RRecords} id="unrec" facts=${facts} onOpen=${openRec(dispatch)} title="Reconciliations with an unexplained gap" sub="Which records? Open one to see the full story behind it."/></${Fragment}>`; };
  roots.adj = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('adj', f), e = k.e;
    return html`<${Fragment}><${Head} id="adj" f=${f}><${P.Stat} label="Adjustments proposed" value=${cr(e.proposed)} sub=${e.propN+' case'+(e.propN===1? '' : 's')+' sent to the entity controller'} tone="aside"/>
      <${P.Stat} label="Adjustments booked" value=${cr(e.booked)} sub=${e.bookN+' cases already corrected, April–September'} tone="aside"/><${P.Stat} label="Control value" value=${cr(e.control)} sub=${e.controlN+' control cases; value touched, not added'} tone="aside"/>
      <${P.Stat} label="P&L decisions, all towers" value=${k.pnl? cr(k.pnl.cr) : 'N/A'} sub=${k.pnl? k.pnl.count+' decisions waiting; may overlap, not added' : ''} tone="aside"/></${Head}><${NoteFor} id="adj" f=${f} facts=${facts}/>
      <${P.RChain} f=${f} kinds=${KINDS['adj']} stg=${M.nav.top(nav).stage || null} setStage=${(x)=> dispatch({ t:'node', v:{ stage: x===M.nav.top(nav).stage? null : x } })} list=${true}/>
      <${Breakdown} id="adj" facts=${facts} nav=${nav} dispatch=${dispatch} title="Potential adjustments by" sub="What could be wrong, and where? Bars show the estimated value of open cases; click to see, double-click to open."/>
      <${P.RRecords} id="adj" facts=${facts} onOpen=${openRec(dispatch)} title="Open cases" sub="Which cases? Open one to see what happened and decide."/></${Fragment}>`; };
  roots.entmix = ({ f, nav, dispatch, facts })=>{
    const sel = nav.sel && nav.sel.dim==='erisk'? nav.sel.key : null, rows = C.risk.cats.map(c=>{ const fs = facts.filter(x=> x.g.erisk===c.id); return { key:c.id, n:fs.length, val:fs.length, share: facts.length? fs.length/facts.length*100 : 0 }; });
    return html`<${Fragment}><${Head} id="entmix" f=${f}><${P.Stat} label="Critical or high" value=${FCT.n(rows[0].n+rows[1].n)+' of '+FCT.n(M.sum(rows, r=> r.n))}/><${P.Stat} label="Forecast after target" value=${FCT.n(M.kpi('entmix', f).late)+' of '+FCT.n(M.sum(rows, r=> r.n))} sub=${'Beyond WD+'+C.targetWD}/></${Head}>
      <div class="px-grid g-2"><${P.Card} title="Entity Close Risk" sub=${'Count of entities (denominator: '+facts.length+')'}>
          <${P.Donut} rows=${rows} mode="count" unit="entities" sel=${sel} onSelect=${(k)=> dispatch({ t:'sel', v:{ key:k, dim:'erisk' } })} onOpen=${(k)=> dispatch({ t:'drill', node:N.group('erisk', k) })} centre=${html`<b>${facts.length}</b><span>entities</span>`}/>
          <div class="px-legend">${rows.map(r=> html`<button key=${r.key} type="button" class=${cx(sel===r.key && 'on')} onClick=${()=> dispatch({ t:'sel', v:{ key:r.key, dim:'erisk' } })} onDoubleClick=${()=> dispatch({ t:'drill', node:N.group('erisk', r.key) })}>
            <i style=${{background:P.RISK[r.key]}}/>${r.key}<b class="num">${r.n}</b><span class="faint">${pct(r.share,0)}</span></button>`)}</div></${P.Card}>
        <${P.Card} title=${sel? sel+' entities' : 'Category definitions'} right=${sel && html`<button type="button" class="btn sm primary" onClick=${()=> dispatch({ t:'drill', node:N.group('erisk', sel) })}>Drill in<${Icon} n="ChevronRight" size=${14}/></button>`}>
          ${sel? html`<p class="px-p">${C.risk.defs[sel]}</p>${facts.filter(x=> x.g.erisk===sel).sort((a,b)=> M.risk(b.e).score-M.risk(a.e).score).map(x=> html`<button key=${x.e} type="button" class="px-vrow" onClick=${()=> dispatch({ t:'drill', node:N.entity(x.e) })}><span>${ename(x.e)}</span><span class="num">${M.risk(x.e).score} · ${M.wdl(M.forecast(x.e))}</span></button>`)}`
            : html`<dl class="px-defs">${C.risk.cats.map(c=> html`<div key=${c.id}><dt><${P.RiskTag} cat=${c.id}/></dt><dd>${C.risk.defs[c.id]}</dd></div>`)}</dl>`}</${P.Card}></div>
      <${P.RRecords} id="entmix" facts=${facts.slice().sort((a,b)=> M.risk(b.e).score-M.risk(a.e).score)} onOpen=${openRec(dispatch)}/></${Fragment}>`; };
  /* stacked journals per close by source (counts, so no currency axis) */
  const JMixChart = ({ f })=>{ const rm = P.useRM(), per = M.period(f.period).months;
    const data = C.months.map((m,i)=>{ const fs = M.facts('jmix', Object.assign({}, f, { period:C.periods.find(p=> p.months.length===1 && p.months[0]===i).id })), o = { m:m.slice(0,3) };
      C.srcs.forEach(s=> o[s.name] = fs.filter(x=> x.rec.src===s.id).length); return o; });
    return html`<${P.ChartBox} height=${170} label="Posted journals by close and source" table=${P.mini(['Close'].concat(C.srcs.map(s=> s.name)), data.map(d=> [d.m].concat(C.srcs.map(s=> FCT.n(d[s.name])))))}>
      <${R.BarChart} data=${data} margin=${{top:10,right:8,left:-6,bottom:0}}><${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${44}/>
        <${R.Tooltip} cursor=${{fill:'rgba(127,127,127,.08)'}} content=${h(P.Tip,{ fmt:(v)=> FCT.n(v) })}/>
        ${C.srcs.map(s=> html`<${R.Bar} key=${s.id} dataKey=${s.name} stackId="a" fill=${P.SRC_COL[s.name]} maxBarSize=${34} isAnimationActive=${!rm}>${data.map((d,i)=> h(R.Cell, { key:i, fillOpacity: per.includes(i)? 1 : .45 }))}</${R.Bar}>`)}</${R.BarChart}></${P.ChartBox}><${P.RKey} items=${C.srcs.map(s=> ['sq', P.SRC_COL[s.name], s.name])} note="Faded bars = closes outside the filter"/>`; };
  roots.jmix = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('jmix', f);
    return html`<${Fragment}><${Head} id="jmix" f=${f}><${P.Stat} label="Manual share" value=${pct(k.share)} sub=${FCT.n(k.manual)+' manual or AI-drafted'}/><${P.Stat} label="AI-drafted" value=${FCT.n(k.ai)+' of '+FCT.n(k.manual)} sub="Recurring journals prepared by AI and reviewed by a person"/>
      <${P.Stat} label="Recurring candidates" value=${FCT.n(D.r2r.journals.recurringCandidates)} sub="RC-05: 30% of journals recur every month"/></${Head}>
      <${P.Card} title="Journals by close" sub="Posted journals by source; selected close highlighted."><${JMixChart} f=${f}/></${P.Card}>
      <${Breakdown} id="jmix" facts=${facts} nav=${nav} dispatch=${dispatch} sub="Count of posted journals."/></${Fragment}>`; };
  roots.topacc = ({ f, nav, dispatch, facts })=>{ const t = M.topAccts(f), sel = nav.sel && nav.sel.dim==='acct'? nav.sel.key : null;
    const rows = t.rows.slice(0,10).map(r=> ({ key:r.acct, label:r.name, val:r.val, sub:pct(r.share)+' of manual value · '+FCT.n(r.n)+' journals · '+(M.A[r.acct]||{}).risk+' risk', tone: sel===r.acct? COL.brass : P.RISK[(M.A[r.acct]||{}).risk] }));
    const others = t.rows.slice(10); if(others.length) rows.push({ key:'__others', label:'Others ('+others.length+' accounts)', val:M.sum(others, r=>r.val), sub:pct(M.sum(others, r=>r.share))+' of manual value', tone:COL.fade });
    const sf = sel? facts.filter(x=> x.g.acct===sel) : [];
    return html`<${Fragment}><${Head} id="topacc" f=${f}><${P.Stat} label="Top 10 share" value=${pct(t.top10)}/><${P.Stat} label="Manual journal value" value=${cr(t.total)} sub="Denominator"/>
      <${P.Stat} label="Largest" value=${t.rows[0]? t.rows[0].name : 'N/A'} sub=${t.rows[0]? pct(t.rows[0].share)+' of manual value' : ''}/></${Head}>
      <div class="px-grid g-2"><${P.Card} title="Manual adjustments by account" sub="Debited group account; bar colour is the account's risk class">
        <${P.BarList} rows=${rows} label="Manual adjustments by account" sel=${sel} onSelect=${(r)=> r.key!=='__others' && dispatch({ t:'sel', v:{ key:r.key, dim:'acct' } })} onOpen=${(r)=> r.key!=='__others' && dispatch({ t:'drill', node:N.group('acct', r.key) })}/></${P.Card}>
        ${sel? html`<${P.Card} title=${anm(sel)} right=${html`<button type="button" class="btn sm primary" onClick=${()=> dispatch({ t:'drill', node:N.group('acct', sel) })}>Drill in<${Icon} n="ChevronRight" size=${14}/></button>`}>
          <div class="px-kv"><div><span>Journals</span><b>${FCT.n(sf.length)}</b></div><div><span>Value</span><b>${cr(M.sum(sf, x=>x.val))}</b></div><div><span>With an exception</span><b>${FCT.n(sf.filter(x=> x.rec.fl.length).length)}</b></div></div>
          <div class="ct faint">Entities behind it</div>${M.group(sf, (x)=> x.e).slice(0,6).map(r=> html`<button key=${r.key} type="button" class="px-vrow" onClick=${()=> dispatch({ t:'drill', node:N.entity(r.key) })}><span>${ename(r.key)}</span><span class="num">${amt(r.val)}</span></button>`)}</${P.Card}>`
        : html`<${P.Card} title="Why this matters"><p class="px-p">Manual adjustments carry most of the judgement in a close. Accounts that attract repeated manual value are candidates for a standard journal, an automation rule or a root-cause fix (see Process chain: fixes in the pipeline).</p></${P.Card}>`}</div></${Fragment}>`; };
  /* heatmap: entities down the side, a second dimension across; darker = worse. Row labels open the entity, cells carry the exact figure on hover */
  /* R2R heatmap palette: one muted teal from the screen theme, deeper for more issues */
  P.ramp = ['transparent'].concat([16,30,46,64,84].map(a=> 'color-mix(in srgb, var(--px-mid) '+a+'%, transparent)'));
  P.RHeat = ({ rows, cols, cell, fmt, legend, onRow, max })=>{
    const all = []; rows.forEach(r=> cols.forEach(c=>{ const x = cell(r, c); if(x && x.v) all.push(x.v); })); const top = max || Math.max(1, ...all);
    const bg = (v)=> !v? 'transparent' : P.heatColor(v, top);
    return html`<div style=${{ overflowX:'auto' }}><table class="px-mini" style=${{ borderCollapse:'separate', borderSpacing:3, width:'100%' }}>
      <thead><tr><th/>${cols.map(c=> html`<th key=${c.k} class="r" style=${{ fontWeight:500, fontSize:11, whiteSpace:'nowrap' }} title=${c.t||c.l}>${c.l}</th>`)}</tr></thead>
      <tbody>${rows.map(r=> html`<tr key=${r}><th style=${{ textAlign:'left', fontWeight:500, whiteSpace:'nowrap' }}>${onRow? html`<button type="button" class="px-link" title=${ename(r)} onClick=${()=> onRow(r)}>${r}</button>` : r}</th>
        ${cols.map(c=>{ const x = cell(r, c) || {}; return html`<td key=${c.k} class="r num" title=${ename(r)+' · '+(c.t||c.l)+': '+(x.t || (x.v? fmt(x.v) : 'none'))} style=${{ background:bg(x.v), borderRadius:4, padding:'6px 4px', color: x.v && x.v/top>.3? '#fff' : x.v? 'var(--px-ink)' : 'var(--px-ink3)', fontSize:12 }}>${x.v? (x.txt || fmt(x.v)) : x.txt || '·'}</td>`; })}</tr>`)}</tbody></table>
      <div class="px-chk-k" aria-hidden="true" style=${{ marginTop:6 }}><span><i style=${{ background:bg(top*.1) }}/>Low (up to ${fmt(top*.33)})</span><span><i style=${{ background:bg(top*.5) }}/>Medium</span><span><i style=${{ background:bg(top) }}/>High (up to ${fmt(top)})</span><span class="faint">Darker = more ${legend}; blank = none</span></div></div>`;
  };
  const FSHORT = { 'Prepared and approved by the same user':'Self-approved', 'Anomalous journal (score 0.75+)':'Anomaly', 'Approved after posting':'Late approval', 'Journal posted without support':'No support', 'Corrected or reversed after posting':'Corrected', 'Posting into a closed period':'Closed period' };
  const entRows = (facts, score, n=10)=>{ const g = {}; facts.forEach(x=>{ g[x.e] = (g[x.e]||0) + score(x); }); return Object.keys(g).filter(e=> g[e]>0).sort((a,b)=> g[b]-g[a]).slice(0,n); };
  const goE = (dispatch)=> (e)=> dispatch({ t:'drill', node:N.entity(e) });
  /* plain finance vocabulary for the six health KPIs: what is measured, what the base is, what a failing record is called */
  const RATEW = { tasks:'on time', recs:'certified on time', jnl:'without a control failure', ic:'agreed', var:'explained by WD+2', mapq:'mapped' };
  const STATN = { recs:'Certification status', ic:'Match status', var:'Commentary status', unrec:'Reconciliation status', progress:'Task status' };
  P.VOCAB = { progress:{ measure:'Close tasks completed so far, against plan' }, jpend:{ measure:'Value of journals waiting for approval' }, unrec:{ measure:'Unexplained differences on reconciliations not yet certified' }, adj:{ measure:'Estimated value that could be wrong in the books' },tasks:{ measure:'On-time completion of close tasks', base:'Close tasks due', fail:'Late close tasks' }, jnl:{ measure:'Journals posted without a control failure', base:'Journals reviewed', fail:'Journals with a control failure' }, recs:{ measure:'Reconciliations certified by their due date', base:'Reconciliations due', fail:'Reconciliations not certified on time' }, ic:{ measure:'Intercompany balances agreed by both entities', base:'Intercompany items', fail:'Unmatched intercompany items' }, mapq:{ measure:'Local accounts mapped to the group chart of accounts', base:'Local accounts with a balance', fail:'Unmapped accounts' }, var:{ measure:'Material budget variances explained and signed off by WD+2', base:'Material variances', fail:'Unexplained variances' } };
  /* plain-language note under each health KPI's headline (P2P pillar 7): what happened, how far from target, and the biggest single place it happened */
  const HeadNote = ({ id, f })=>{ const k = M.kpi(id, f), K = M.KPI[id]; if(k.v==null) return null;
    const gap = K.target - k.v, base = compNote(id, f, { [id]:k }, null);
    return html`<${AI}>${base} ${gap>0.05? 'That leaves it '+FCT.n(gap,1)+' points short of the '+K.target+'% target.' : 'That meets the '+K.target+'% target.'}</${AI}>`; };
  /* intercompany map: every entity in a pair at its site, a line between the two entities that must agree each pair.
     Line colour = agreed (green) or not agreed (red, dashed); thickness = value. Leaflet + Esri canvas tiles, same look as the entity map */
  P.SITE = { 'IN-01':[77.2,28.6,'New Delhi'], 'IN-02':[76.8,30.7,'Chandigarh'], 'IN-03':[78.0,30.3,'Dehradun'], 'IN-04':[73.2,22.3,'Vadodara'], 'IN-05':[73.0,21.4,'Ankleshwar'],
    'IN-06':[73.9,18.5,'Pune'], 'IN-07':[77.6,13.0,'Bengaluru'], 'IN-08':[80.3,13.1,'Chennai'], 'US-01':[-74.4,40.2,'New Jersey'], 'EU-01':[4.9,52.4,'Amsterdam'] };
  P.cssColor = (v)=>{ const p = document.createElement('span'); p.style.color = v; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
  P.esriLayers = (dark)=>{ const u = (id)=> 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/'+id+'/MapServer/tile/{z}/{y}/{x}', o = { attribution:'Tiles &copy; Esri', maxZoom:16, minZoom:2 };
    return [L.tileLayer(u(dark? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base'), o), L.tileLayer(u(dark? 'World_Dark_Gray_Reference' : 'World_Light_Gray_Reference'), o)]; };
  /* great-circle arc between two points (the earth as a sphere), lifted a little so short hops still read as curves */
  const arc = (a, b, n=48)=>{ const R = Math.PI/180, [la1, lo1] = [a[0]*R, a[1]*R], [la2, lo2] = [b[0]*R, b[1]*R];
    const d = 2*Math.asin(Math.sqrt(Math.sin((la2-la1)/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin((lo2-lo1)/2)**2)); const pts = [];
    for(let i = 0; i<=n; i++){ const f = i/n; let la, lo;
      if(d<1e-6){ la = la1; lo = lo1; } else { const A = Math.sin((1-f)*d)/Math.sin(d), B = Math.sin(f*d)/Math.sin(d);
        const x = A*Math.cos(la1)*Math.cos(lo1) + B*Math.cos(la2)*Math.cos(lo2), y = A*Math.cos(la1)*Math.sin(lo1) + B*Math.cos(la2)*Math.sin(lo2), z = A*Math.sin(la1) + B*Math.sin(la2);
        la = Math.atan2(z, Math.sqrt(x*x+y*y)); lo = Math.atan2(y, x); }
      pts.push([la/R, lo/R]); }
    /* lift: bend the path sideways by up to 18% of its length, peaking mid-way */
    const dx = b[1]-a[1], dy = b[0]-a[0], len = Math.sqrt(dx*dx+dy*dy), k = Math.min(.18*len, 6);
    for(let i = 1; i<pts.length; i++){ if(pts[i][1]-pts[i-1][1] > 180) pts[i][1] -= 360; else if(pts[i][1]-pts[i-1][1] < -180) pts[i][1] += 360; }
    return pts.map((p,i)=>{ const f = i/n, h = Math.sin(Math.PI*f)*k; return len? [p[0] + h*(dx/len), p[1] - h*(dy/len)] : p; }); };
  (function(){ if(document.getElementById('rx-icmap-css')) return; const st = document.createElement('style'); st.id = 'rx-icmap-css';
    st.textContent = '.rx-flow{animation:rxflow 1.2s linear infinite}@keyframes rxflow{to{stroke-dashoffset:-16}}.rx-gap{background:rgba(15,26,25,.9);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:2px 8px;font:600 11px system-ui;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.4)}body.theme-light .rx-gap{background:#fff;color:#15211f;border-color:rgba(0,0,0,.15)}';
    (document.head||document.documentElement).appendChild(st); })();
  const ICMap = ({ facts, dispatch })=>{
    const host = React.useRef(null), S = React.useRef({}), SITE = P.SITE, [show, setShow] = useState('All'), [ent, setEnt] = useState('All'), isDark = ()=> !document.body.classList.contains('theme-light'), [dark, setDark] = useState(isDark);
    const all = Object.values(facts.reduce((g, x)=>{ const r = x.rec, k = r.pair, o = g[k] = g[k] || { k, a:r.a, b:r.b, n:0, bad:0, val:0, badVal:0, st:{} }; o.n++; o.val += r.val; if(!x.ok){ o.bad++; o.badVal += r.diff||0; o.st[r.st] = (o.st[r.st]||0)+1; } return g; }, {})).filter(p=> SITE[p.a] && SITE[p.b]);
    const pairs = all.filter(p=> (show==='All' || (show==='bad'? p.bad : !p.bad)) && (ent==='All' || p.a===ent || p.b===ent));
    const sig = pairs.map(p=> p.k+p.n+':'+p.bad).join('|')+'#'+ent+'#'+dark;
    useEffect(()=>{ if(!host.current || !window.L) return;
      const map = L.map(host.current, { minZoom:2, maxZoom:10, worldCopyJump:true, scrollWheelZoom:false }).setView([28, 40], 2); map.attributionControl.setPrefix(false);
      const paint = ()=>{ const dark = !document.body.classList.contains('theme-light'), key = dark? 'd' : 'l'; if(map._k===key) return; (map._t||[]).forEach(l=> map.removeLayer(l)); map._k = key; map._t = P.esriLayers(dark); map._t.forEach(l=> l.addTo(map)); setDark(isDark()); };
      paint(); const obs = new MutationObserver(paint); obs.observe(document.body, { attributes:true, attributeFilter:['class'] });
      S.current = { map, layer:L.layerGroup().addTo(map) }; const t = setTimeout(()=> map.invalidateSize(), 180);
      return ()=>{ clearTimeout(t); obs.disconnect(); map.remove(); S.current = {}; }; }, []);
    useEffect(()=>{ const { map, layer } = S.current; if(!map) return; layer.clearLayers();
      const good = P.cssColor('var(--px-pos)'), bad = P.cssColor('var(--px-crit)'), mx = Math.max(...all.map(p=> p.val), .01), ll = (e)=> [SITE[e][1], SITE[e][0]];
      pairs.forEach(p=>{ const ok = !p.bad, w = 1.5 + Math.sqrt(p.val/mx)*2.5, c = ok? good : bad, pts = arc(ll(p.a), ll(p.b)), lc = dark? '#ffffff' : c;
        L.polyline(pts, { color:c, weight:w+5, opacity:.15, interactive:false, lineCap:'round' }).addTo(layer);
        L.polyline(pts, { color:'#0b1413', weight:w+1.5, opacity: dark? .35 : .5, interactive:false, lineCap:'round' }).addTo(layer);
        const line = L.polyline(pts, { color:lc, weight:w, opacity:1, lineCap:'round', dashArray: ok? null : '8 8', className: ok? '' : 'rx-flow' }).addTo(layer);
        line.bindTooltip('<b>'+FCT.esc(p.k)+'</b><br>'+p.n+' items · '+FCT.esc(amt(p.val))+'<br>'+(ok? 'All agreed by both sides' : p.bad+' not agreed · '+FCT.esc(amt(p.badVal))+' gap<br>'+Object.keys(p.st).map(k=> FCT.esc(k)+' '+p.st[k]).join(' · '))+'<br><span style="opacity:.7">Click to open this pair</span>', { sticky:true });
        line.on('mouseover', ()=> line.setStyle({ weight:w+1.5 })).on('mouseout', ()=> line.setStyle({ weight:w })).on('click', ()=> dispatch({ t:'drill', node:N.group('pair', p.k) }));
        if(!ok){ const mid = pts[Math.floor(pts.length/2)];
          L.marker(mid, { icon:L.divIcon({ className:'', iconSize:null, html:'<span class="rx-gap">'+FCT.esc(amt(p.badVal))+' gap</span>' }), interactive:false }).addTo(layer); } });
      const ents = [...new Set(pairs.flatMap(p=> [p.a, p.b]))];
      ents.forEach(e=>{ const mine = pairs.filter(p=> p.a===e || p.b===e), nb = M.sum(mine, p=> p.bad), c = nb? bad : good, sel = e===ent;
        const icon = L.divIcon({ className:'', iconSize:[34,34], iconAnchor:[17,17], html:'<div style="width:34px;height:34px;border-radius:50%;background:'+c+';display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 '+(sel? 5 : 3)+'px rgba(255,255,255,'+(sel? .5 : .2)+'),0 3px 8px rgba(0,0,0,.5);border:2px solid #fff;font:700 9.5px system-ui;color:#fff">'+e.replace('-','')+'</div>' });
        L.marker(ll(e), { icon, zIndexOffset:500 }).bindTooltip('<b>'+FCT.esc(ename(e))+'</b> · '+FCT.esc(SITE[e][2])+'<br>'+mine.length+' pair'+(mine.length===1? '' : 's')+(nb? ' · '+nb+' items not agreed' : ' · all agreed')+'<br><span style="opacity:.7">Click to show only its pairs</span>', { direction:'top', offset:[0,-16] })
          .on('click', ()=> setEnt(ent===e? 'All' : e)).addTo(layer); });
      if(ents.length) map.fitBounds(L.latLngBounds(ents.map(ll)), { padding:[50,50], maxZoom:5 });
    }, [sig]);
    const nb = all.filter(p=> p.bad), es = [...new Set(all.flatMap(p=> [p.a, p.b]))].sort();
    return html`<${P.Card} title="Where the intercompany pairs are" sub="Each curved line joins the two entities that must agree an intercompany balance. Click a line to open that pair; click an entity to show only its pairs."
        right=${html`<div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <${P.Dropdown} label="Show" value=${show} active=${show!=='All'} onChange=${setShow} options=${[['All','All pairs ('+all.length+')'],['bad','Not agreed ('+nb.length+')'],['good','Agreed ('+(all.length-nb.length)+')']]}/>
          <${P.Dropdown} label="Entity" value=${ent} active=${ent!=='All'} onChange=${setEnt} options=${[['All','All entities']].concat(es.map(e=> [e, ename(e)]))}/></div>`}>
      ${!window.L? html`<${P.Empty} text="The map could not be loaded."/>` : html`<div ref=${host} style=${{ height:400, borderRadius:10, border:'1px solid var(--px-line)', overflow:'hidden', position:'relative', zIndex:0, isolation:'isolate' }} role="application" aria-label="Map of intercompany pairs"></div>`}
      ${!pairs.length && html`<p class="px-p faint">No pairs match this filter.</p>`}
      <div class="px-legend" style=${{ marginTop:8 }}><span><i style=${{ background:'var(--px-pos)' }}/>Agreed by both sides${dark? ' (solid line, green glow)' : ''}</span><span><i style=${{ background:'var(--px-crit)' }}/>Not agreed (moving dashes${dark? ', red glow' : ''}, gap shown on the line)</span><span class="faint">Thicker line = more value</span></div>
      <${AI}>${nb.length? nb.length+' of '+all.length+' entity pairs have items not agreed: '+nb.slice().sort((a,b)=> b.badVal-a.badVal).map(p=> p.k+' ('+amt(p.badVal)+')').join(', ')+'.' : 'Every entity pair agrees on both sides.'}</${AI}></${P.Card}>`;
  };
  const rateRoot = (id, statsFn, extra)=> ({ f, nav, dispatch, facts })=>{ const k = M.kpi(id, f);
    return html`<${Fragment}><${Head} id=${id} f=${f}>${statsFn(k, facts, f)}</${Head}><${HeadNote} id=${id} f=${f}/>${id==='ic' && html`<${ICMap} facts=${facts} dispatch=${dispatch}/>`}
      <div class="px-grid g-2"><${P.Card} title=${P.VOCAB[id].measure+': trend by month-end close'} sub="Is it getting better? One bar per month-end close; the brass line is the target."><${P.RTrend} id=${id} f=${f}/></${P.Card}>${extra? extra(k, facts, f, dispatch) : html`<div/>`}</div>
      <${P.RChain} f=${f} kinds=${KINDS[id]} stg=${M.nav.top(nav).stage || null} setStage=${(x)=> dispatch({ t:'node', v:{ stage: x===M.nav.top(nav).stage? null : x } })} list=${true}/>
      <${Breakdown} id=${id} facts=${facts} nav=${nav} dispatch=${dispatch} title=${P.VOCAB[id].fail+' by'} sub="Who and what is behind it? Click a bar to see it; double-click to open it."/>
      <${P.RRecords} id=${id} facts=${facts.filter(x=> x.ok===false)} of=${facts.length} onOpen=${openRec(dispatch)} title=${P.VOCAB[id].fail} sub="Which records? Open one to see why it failed and what it holds up." filters=${RFILTERS[id]}/></${Fragment}>`; };
  roots.tasks = rateRoot('tasks', (k)=> html`<${P.Stat} label="Close tasks due" value=${FCT.n(k.n)} sub="Planned to finish by the measurement day"/><${P.Stat} label="Late close tasks" value=${FCT.n(k.bad)+' of '+FCT.n(k.n)} sub="Still open, or finished after the planned day"/>`,
    (k, facts, f, dispatch)=>{ const late = facts.filter(x=> !x.ok), cols = C.groups.map(([g])=> ({ k:g, l:M.grpName(g), t:M.grpName(g)+': '+M.grpDesc(g) })).filter(c=> facts.some(x=> x.rec.grp===c.k));
      return html`<${P.Card} title="Where tasks run late" sub="Where is it happening? Darker = a bigger share of that entity's tasks were late.">
      <${P.RHeat} rows=${entRows(late, ()=> 1)} cols=${cols} fmt=${(v)=> pct(v,0)} legend="% of tasks late" onRow=${goE(dispatch)}
        cell=${(e, c)=>{ const fs = facts.filter(x=> x.e===e && x.rec.grp===c.k), b = fs.filter(x=> !x.ok).length; return fs.length? { v: b/fs.length*100, t: b+' of '+fs.length+' late' } : null; }}/></${P.Card}>`; });
  roots.recs = rateRoot('recs', (k)=> html`<${P.Stat} label="Reconciliations due" value=${FCT.n(k.n)} sub="Balance-sheet accounts due for certification"/><${P.Stat} label="Reconciliations not certified on time" value=${FCT.n(k.bad)+' of '+FCT.n(k.n)} sub="Certified late, or still uncertified"/>`,
    (k, facts, f, dispatch)=>{ const rs = M.set('rec', f).filter(r=> r.m===5), A = ['Under 30 days','30–60 days','60–90 days','Over 90 days'], rows = entRows(rs.map(r=> ({ e:r.e, r })), (x)=> x.r.items[2]+x.r.items[3]+x.r.items[1]*.01);
      return html`<${P.Card} title="Ageing of items not yet matched to support" sub="Where is it happening? Darker = more open items; items over 60 days usually mean a missing entry.">
      <${P.RHeat} rows=${rows} cols=${A.map((a,i)=> ({ k:i, l:a.replace(' days','d') }))} fmt=${(v)=> FCT.n(v)} legend="open items" onRow=${goE(dispatch)}
        cell=${(e, c)=>{ const v = M.sum(rs.filter(r=> r.e===e), r=> r.items[c.k]); return v? { v, t: FCT.n(v)+' items' } : null; }}/></${P.Card}>`; });
  roots.jnl = rateRoot('jnl', (k, facts)=> html`<${P.Stat} label="Journals reviewed" value=${FCT.n(k.n)} sub="Manual and AI-drafted journals posted"/><${P.Stat} label="Journals with a control failure" value=${FCT.n(k.bad)+' of '+FCT.n(k.n)} sub=${amt(k.badVal)+' of journal value'}/>
      <${P.Stat} label="Anomalies" value=${FCT.n(facts.filter(x=> x.rec.fl.includes('anom')).length)+' of '+FCT.n(k.n)} sub="Anomaly score 0.75 or more"/>`,
    (k, facts, f, dispatch)=>{ const bad = facts.filter(x=> !x.ok), types = M.group(bad, (x)=> x.g.flag).map(r=> r.key);
      return html`<${P.Card} title="Control failures by entity" sub="Where is it happening? Darker = more journals failed that control.">
      <${P.RHeat} rows=${entRows(bad, ()=> 1)} cols=${types.map(t=> ({ k:t, l:FSHORT[t] || t, t }))} fmt=${(v)=> FCT.n(v)} legend="journals" onRow=${goE(dispatch)}
        cell=${(e, c)=>{ const fs = bad.filter(x=> x.e===e && x.g.flag===c.k); return fs.length? { v: fs.length, t: fs.length+' journals · '+amt(M.sum(fs, x=> x.val)) } : null; }}/></${P.Card}>`; });
  roots.ic = rateRoot('ic', (k)=> html`<${P.Stat} label="Intercompany items" value=${FCT.n(k.n)} sub="Cross-entity balances in the close"/><${P.Stat} label="Unmatched intercompany items" value=${FCT.n(k.bad)+' of '+FCT.n(k.n)} sub=${amt(k.badVal)+' not agreed between entities'}/>`,
    (k, facts, f, dispatch)=>{ const bad = facts.filter(x=> !x.ok), A = [...new Set(facts.map(x=> x.rec.a))].sort(), B = [...new Set(facts.map(x=> x.rec.b))].sort();
      return html`<${P.Card} title="Unagreed intercompany balances" sub="Where is it happening? Rows booked the charge, columns are the other side; ✓ = fully agreed.">
      <${P.RHeat} rows=${A} cols=${B.map(b=> ({ k:b, l:b, t:ename(b) }))} fmt=${(v)=> cr(v)} legend="₹ not agreed" onRow=${goE(dispatch)}
        cell=${(a, c)=>{ const fs = facts.filter(x=> x.rec.a===a && x.rec.b===c.k), bs = bad.filter(x=> x.rec.a===a && x.rec.b===c.k), v = M.sum(bs, x=> Math.abs(x.rec.diff)); return fs.length? { v, txt: v? cr(v) : '✓', t: bs.length+' of '+fs.length+' unmatched · '+amt(v) } : null; }}/>
      ${FCT.ex('RTR-REC-03') && html`<div class="px-ex"><span><b>RTR-REC-03</b> ${FCT.ex('RTR-REC-03').title}</span><${P.Decide} id="RTR-REC-03"/></div>`}</${P.Card}>`; });
  roots.var = rateRoot('var', (k)=> html`<${P.Stat} label="Material variances" value=${FCT.n(k.n)} sub="Actual against budget, ₹2 Cr or more"/><${P.Stat} label="Unexplained variances" value=${FCT.n(k.bad)+' of '+FCT.n(k.n)} sub="No signed commentary by WD+2"/>`,
    (k, facts, f, dispatch)=>{ const bad = facts.filter(x=> !x.ok), lines = M.group(bad, (x)=> x.g.line).slice(0,6).map(r=> r.key);
      return html`<${P.Card} title="Unexplained variance by entity and line" sub="Where is it happening? Darker = more budget variance still unexplained at WD+2.">
      <${P.RHeat} rows=${entRows(bad, (x)=> x.val)} cols=${lines.map(l=> ({ k:l, l:l.split(/[ ,]/)[0], t:l }))} fmt=${(v)=> cr(v)} legend="₹ unexplained" onRow=${goE(dispatch)}
        cell=${(e, c)=>{ const fs = bad.filter(x=> x.e===e && x.g.line===c.k); return fs.length? { v: M.sum(fs, x=> x.val), t: fs.length+' variances · '+amt(M.sum(fs, x=> x.val)) } : null; }}/>
      ${FCT.ex('RTR-VAR-04') && html`<div class="px-ex"><span><b>RTR-VAR-04</b> ${FCT.ex('RTR-VAR-04').title}</span><${P.Decide} id="RTR-VAR-04"/></div>`}</${P.Card}>`; });
  roots.mapq = ({ f, nav, dispatch, facts })=>{ const k = M.kpi('mapq', f);
    return html`<${Fragment}><${Head} id="mapq" f=${f}><${P.Stat} label="Local accounts with a balance" value=${FCT.n(k.n)} sub="Entity-level general-ledger accounts"/><${P.Stat} label="Unmapped accounts" value=${FCT.n(k.bad)+' of '+FCT.n(k.n)} sub=${amt(k.badVal)+' balance not rolled into group lines'}/></${Head}><${HeadNote} id="mapq" f=${f}/>
      <${P.Card} title="Mapping coverage by entity" sub="Where is it happening? One tile per entity; red tiles still have unmapped accounts."><div style=${{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:8 }}>
        ${M.ents(f).map(e=>{ const fs = facts.filter(x=> x.e===e.id), b = fs.filter(x=> !x.ok), r = fs.length? (fs.length-b.length)/fs.length*100 : null, bv = M.sum(b, x=> x.val);
          return html`<button key=${e.id} type="button" onClick=${()=> dispatch({ t:'drill', node:N.entity(e.id) })} title=${ename(e.id)+': '+b.length+' unmapped of '+fs.length+(bv? ' · '+amt(bv) : '')}
            style=${{ textAlign:'left', border:'1px solid var(--px-line)', borderRadius:8, padding:'8px 10px', cursor:'pointer', color: b.length>=5? '#fff' : 'var(--px-ink)', background: !b.length? 'color-mix(in srgb, var(--px-pos) 18%, transparent)' : 'color-mix(in srgb, var(--px-crit) '+Math.min(90, 15+b.length*8)+'%, transparent)' }}>
            <b>${e.id}</b><div class="num" style=${{ fontSize:18, fontWeight:600 }}>${r==null? '—' : pct(r,1)}</div><small>${b.length? b.length+' unmapped · '+cr(bv) : 'All mapped'}</small></button>`; })}</div></${P.Card}>
      <${P.RChain} f=${f} kinds=${KINDS['mapq']} stg=${M.nav.top(nav).stage || null} setStage=${(x)=> dispatch({ t:'node', v:{ stage: x===M.nav.top(nav).stage? null : x } })} list=${true}/>
      <${Breakdown} id="mapq" facts=${facts} nav=${nav} dispatch=${dispatch} title="Unmapped accounts by" sub="Who and what is behind it? Click a bar to see it; double-click to open it."/><${P.RRecords} id="mapq" facts=${facts.filter(x=> !x.ok)} of=${facts.length} onOpen=${openRec(dispatch)} title="Unmapped accounts" sub="Which records? Open one to see why it failed and what it holds up."/></${Fragment}>`; };

  /* ---------- deeper views ---------- */
  /* split chart for a drilled group: one stacked bar per entity (or pair), records split into passed and each kind of failure */
  const SPLIT = {
    tasks:{ t:'How each entity\'s tasks ended', q:'Did the tasks finish on time, late, or are they still open?', by:(x)=> x.e, cls:(x)=> x.ok? 'On time' : M.taskDoneWD(x.rec)!=null? 'Finished late' : 'Still open', order:['On time','Finished late','Still open'] },
    recs:{ t:'How each entity\'s reconciliations stand', q:'Certified on time, certified late, or not certified yet?', by:(x)=> x.e, cls:(x)=> x.ok? 'Certified on time' : x.rec.certWD!=null? 'Certified late' : 'Not certified', order:['Certified on time','Certified late','Not certified'] },
    jnl:{ t:'Which controls each entity\'s journals failed', q:'How many journals passed, and which control did the others fail?', by:(x)=> x.e, cls:(x)=> x.ok? 'No control failure' : FSHORT[x.g.flag] || x.g.flag, order:null },
    ic:{ t:'How each entity pair\'s items stand', q:'Agreed, amounts differ, or the other side has not confirmed?', by:(x)=> x.g.pair, cls:(x)=> x.ok? 'Agreed' : x.rec.st==='Not confirmed'? 'Not confirmed' : 'Amount differs', order:['Agreed','Amount differs','Not confirmed'] },
    mapq:{ t:'Mapping by entity', q:'How many local accounts are mapped to the group chart?', by:(x)=> x.e, cls:(x)=> x.ok? 'Mapped' : 'Not mapped', order:['Mapped','Not mapped'] },
    var:{ t:'How each entity\'s variances were explained', q:'Explained by WD+2, explained late, or not explained?', by:(x)=> x.e, cls:(x)=> x.ok? 'Explained by WD+2' : x.rec.signedWD!=null? 'Explained late' : 'Not explained', order:['Explained by WD+2','Explained late','Not explained'] } };
  const SPLITC = ['var(--px-pos)', COL.high, COL.crit, COL.mid, COL.brass, COL.brand2, COL.light];
  const SplitChart = ({ id, facts, dispatch })=>{
    const d = SPLIT[id], rm = P.useRM(); if(!d) return null;
    const cats = d.order || ['No control failure'].concat(M.group(facts.filter(x=> !x.ok), (x)=> d.cls(x)).map(r=> r.key));
    const g = {}; facts.forEach(x=>{ const k = d.by(x), c = d.cls(x), r = g[k] = g[k] || { k, n:0, bad:0 }; r[c] = (r[c]||0) + 1; r.n++; if(!x.ok) r.bad++; });
    const rows = Object.values(g).sort((a,b)=> b.bad-a.bad || b.n-a.n).slice(0,10), used = cats.filter(c=> rows.some(r=> r[c]));
    const tot = (c)=> facts.filter(x=> d.cls(x)===c).length;
    return html`<${P.Card} title=${d.t} sub=${d.q+' One bar per '+(id==='ic'? 'entity pair' : 'entity')+'; click a bar to open it.'}>
      <div style=${{ height: 30*rows.length + 60 }}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${rows} layout="vertical" margin=${{ top:4, right:16, left:8, bottom:4 }}>
        <${R.CartesianGrid} stroke=${COL.grid} horizontal=${false}/><${R.XAxis} type="number" allowDecimals=${false} ...${P.axis}/><${R.YAxis} type="category" dataKey="k" width=${id==='ic'? 110 : 60} ...${P.axis}/>
        <${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=> FCT.n(v)+' records' })}/><${R.Legend} wrapperStyle=${{ fontSize:12 }}/>
        ${used.map((c,i)=> html`<${R.Bar} key=${c} dataKey=${c} name=${c} stackId="a" fill=${SPLITC[cats.indexOf(c) % SPLITC.length]} maxBarSize=${20} isAnimationActive=${!rm} cursor="pointer"
          onClick=${(r)=> id!=='ic' && r && r.k && dispatch({ t:'drill', node:N.entity(r.k) })}/>`)}</${R.BarChart}></${R.ResponsiveContainer}></div>
      <${AI}>Of all ${FCT.n(facts.length)} records here: ${cats.filter(c=> tot(c)).map(c=> FCT.n(tot(c))+' '+c.toLowerCase()).join(', ')}.</${AI}></${P.Card}>`;
  };
  /* the component view's analysis card (assets/js/shared/explore.js); task, reconciliation and journal themes are SPLIT's outcome classes */
  const EX = FCTExplore.make(P, M, { noVal:{ tasks:true }, theme:{ tasks:'grp', ic:'status', recs:'status', var:'status' }, themeOf:{ jnl:{ name:'Control failed', fn:(x)=> SPLIT.jnl.cls(x) } } });
  /* intercompany drill: the two books side by side, every item as a tile, and how long the gap has been there */
  const ICST = { 'Agreed':'var(--px-pos)', 'Timing difference':COL.mid, 'FX difference':COL.brass, 'Not confirmed':COL.crit };
  const ICSAY = { 'Agreed':'Agreed by both', 'Timing difference':'In transit (booked on different days)', 'FX difference':'Exchange-rate difference', 'Not confirmed':'Other side has not confirmed' };
  const ICView = ({ facts, dispatch })=>{
    const pairs = M.group(facts, (x)=> x.g.pair).map(r=> r.key).slice(0,4), rm = P.useRM();
    const side = (pr)=>{ const its = facts.filter(x=> x.g.pair===pr), a = its[0].rec.a, b = its[0].rec.b, booked = M.sum(its, x=> x.rec.val), gap = M.sum(its, x=> x.rec.diff||0);
      return { pr, a, b, booked, conf: booked-gap, gap, its }; };
    const S = pairs.map(side), mx = Math.max(...S.map(x=> x.booked), .01);
    const ms = C.months, hist = ms.map((mo,m)=>{ const r = { mo }; pairs.forEach(pr=>{ r[pr] = M.X.ic.filter(x=> x.pair===pr && x.m===m).reduce((a,x)=> a+(x.diff||0), 0); }); return r; });
    const PC = [COL.crit, COL.high, COL.brass, COL.mid];
    const bar = (w, c, t)=> html`<span title=${t} style=${{ display:'block', height:14, borderRadius:4, width:Math.max(0,w/mx*100)+'%', background:c }}/>`;
    return html`<${Fragment}>
      <${P.Card} title="Do both books agree?" sub="What one entity has booked as owed to it, against what the other entity has confirmed. The red part is the gap still to agree.">
        ${S.map(x=> html`<div key=${x.pr} style=${{ display:'grid', gridTemplateColumns:'minmax(140px,220px) 1fr', gap:'6px 12px', alignItems:'center', marginBottom:14 }}>
          <small><b>${x.a}</b> booked (receivable)</small><div>${bar(x.booked, COL.light, amt(x.booked))}</div>
          <small><b>${x.b}</b> confirmed (payable)</small><div style=${{ display:'flex' }}><span style=${{ width:(x.conf/mx*100)+'%' }}>${x.conf>0 && bar(mx, 'var(--px-pos)', amt(x.conf))}</span><span style=${{ width:(x.gap/mx*100)+'%' }}>${x.gap>0 && bar(mx, COL.crit, 'Gap '+amt(x.gap))}</span></div>
          <span/><small class="faint">${x.pr}: booked ${amt(x.booked)} · confirmed ${x.conf>.004? amt(x.conf) : "nothing yet"} · <b style=${{ color:x.gap? COL.crit : 'var(--px-pos)' }}>gap ${amt(x.gap)}</b></small></div>`)}
      </${P.Card}>
      <${P.Card} title="Every intercompany item">
        <p class="px-p faint" style=${{ margin:"0 0 10px" }}>Each tile is one invoice or charge that <b>${(facts[0]? facts[0].rec.a : 'One entity')}</b> has raised on <b>${(facts[0]? facts[0].rec.b : 'the other entity')}</b>, for goods, services or shared costs within the group. Together they make up the balance above. A bigger tile means a bigger amount; the colour says whether ${(facts[0]? facts[0].rec.b : 'the other entity')} has agreed it. Click a tile to see its details.</p>
        <div style=${{ display:'flex', flexWrap:'wrap', gap:6 }}>${facts.slice().sort((a,b)=> b.rec.val-a.rec.val).slice(0,60).map(x=>{ const r = x.rec, c = ICST[r.st] || COL.light, w = 90 + Math.sqrt(r.val/Math.max(...facts.map(y=> y.rec.val)))*140;
          return html`<button key=${r.id} type="button" onClick=${()=> openRec(dispatch)(x)} title=${r.id+' · '+(ICSAY[r.st]||r.st)+(r.note? ' · '+r.note : '')}
            style=${{ width:w, textAlign:'left', cursor:'pointer', border:'1px solid var(--px-line)', borderLeft:'4px solid '+c, borderRadius:6, padding:'6px 8px', background:'color-mix(in srgb, '+c+' 14%, transparent)', color:'var(--px-ink)' }}>
            <b class="num">${amt(r.val)}</b><small style=${{ display:'block' }} class="faint">${r.ref}</small><small style=${{ display:'block' }}>${ICSAY[r.st]||r.st}</small></button>`; })}</div>
        <div style=${{ display:'flex', gap:14, flexWrap:'wrap', marginTop:10 }}>${Object.keys(ICST).filter(k=> facts.some(x=> x.rec.st===k)).map(k=> html`<small key=${k}><i style=${{ display:'inline-block', width:10, height:10, borderRadius:2, background:ICST[k], marginRight:5 }}/>${ICSAY[k]} (${facts.filter(x=> x.rec.st===k).length})</small>`)}</div></${P.Card}>
      <${P.Card} title="Is this gap new?" sub="Value not agreed between the two entities at each month-end close. A gap that appears only this month points to a one-off; one that keeps coming back points to a process problem.">
        <div style=${{ height:200 }}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${hist} margin=${{ top:8, right:16, left:8, bottom:4 }}>
          <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="mo" ...${P.axis}/><${R.YAxis} ...${P.axis} tickFormatter=${(v)=> FCT.amt(v)}/>
          <${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=> FCT.amt(v)+' not agreed' })}/>
          ${pairs.map((pr,i)=> html`<${R.Bar} key=${pr} dataKey=${pr} name=${pr} fill=${PC[i]} maxBarSize=${34} isAnimationActive=${!rm}/>`)}</${R.BarChart}></${R.ResponsiveContainer}></div>
        <${P.RKey} items=${pairs.map((pr,i)=> ['sq', PC[i], 'Value not agreed at month-end: '+pr])} note="No bar = fully agreed that month"/>
        <${AI}>${pairs.map(pr=>{ const prev = hist.slice(0,-1).filter(r=> r[pr]>0).length; return pr+': '+(prev? 'a gap also existed in '+prev+' of the previous '+(ms.length-1)+' closes' : 'no gap in the previous '+(ms.length-1)+' closes, so this is new this month'); }).join('. ')}.</${AI}></${P.Card}></${Fragment}>`;
  };
  /* drill-level breakdown as a ranked table (the KPI page keeps the bar list): rank, name, one bar of failing out of total, "X of Y", share passed */
  const RankTable = ({ id, facts, nav, dispatch, exclude })=>{
    const top = M.nav.top(nav), dims = (M.dims[id]||[]).filter(d=> !(exclude||[]).includes(d)); if(!dims.length) return null;
    const dim = top.by && dims.includes(top.by)? top.by : dims[0], rows = P.rGroupRows(id, facts, dim).slice(0,12), V = P.VOCAB[id], mx = Math.max(1, ...rows.map(r=> r.bad));
    const dimN = (d)=> d==='status' && STATN[id]? STATN[id] : M.dimName[d], fail = V.fail.toLowerCase(), drill = (r)=> dispatch({ t:'drill', node:N.group(dim, r.key) });
    return html`<${P.Card} title=${'Where the '+fail+' are'} sub=${'Ranked by '+dimN(dim).toLowerCase()+', most first. Click a row to open it.'}
        right=${dims.length>1 && html`<${P.Pick} label="By" value=${dim} onChange=${(d)=> dispatch({ t:'node', v:{ by:d } })} options=${dims.map(d=> [d, d==='status' && STATN[id]? STATN[id] : M.dimName[d]])}/>`}>
      ${rows.length? html`<table class="px-mini" style=${{ width:'100%' }}><thead><tr><th class="r">#</th><th>${dimN(dim)}</th><th style=${{ width:'34%' }}>${V.fail}</th><th class="r">Count</th><th class="r">${RATEW[id]? RATEW[id][0].toUpperCase()+RATEW[id].slice(1) : 'Passed'}</th></tr></thead>
        <tbody>${rows.map((r,i)=> html`<tr key=${r.key} onClick=${()=> drill(r)} style=${{ cursor:'pointer' }} title=${'Open '+r.label}>
          <td class="r num faint">${i+1}</td><td><b>${r.label}</b></td>
          <td><span style=${{ display:'block', height:10, borderRadius:5, background:'var(--px-line)' }}><i style=${{ display:'block', height:10, borderRadius:5, width:(r.bad/mx*100)+'%', background: i===0? COL.crit : COL.high }}/></span></td>
          <td class="r num"><b>${FCT.n(r.bad)}</b> of ${FCT.n(r.n)}</td><td class="r num">${r.rate==null? '—' : pct(r.rate,0)}</td></tr>`)}</tbody></table>`
        : html`<p class="px-p faint">Nothing failing here.</p>`}</${P.Card}>`;
  };
  const GroupView = ({ f, nav, dispatch, cx:ctx })=>{
    const top = M.nav.top(nav), id = ctx.eff, facts = ctx.facts, rate = M.isRate(id), bad = facts.filter(x=> x.ok===false), cnt = id==='progress' || id==='jmix' || id==='entmix';
    if(id==='health') return html`<${P.Empty} text="Select a component."/>`;
    return html`<${Fragment}>
      <div class="px-head"><div class="big"><div class="v num">${rate? pct(facts.length? (facts.length-bad.length)/facts.length*100 : null) : cnt? FCT.n(facts.length) : cr(M.sum(facts,x=>x.val))}</div>
        <div class="m"><span class="faint">${M.KPI[id].name}${top.dim==='component'? ', '+(nav.kpi==='health'? 'a health component' : '') : ' for '+top.label.replace(/^[^:]+: /,'')}</span>${ctx.comp && html`<span class="px-tag">Health component</span>`}</div></div>
        <div class="px-stats"><${P.Stat} label="Records" value=${FCT.n(facts.length)}/>${rate && html`<${P.Stat} label="Exceptions" value=${FCT.n(bad.length)+' of '+FCT.n(facts.length)} sub=${id==='tasks'? '' : amt(M.sum(bad,x=>x.val))}/>`}<${P.Stat} label="Entities" value=${FCT.n(new Set(facts.map(x=> x.e)).size)}/></div></div>
      ${facts.length===0? html`<${P.Empty}/>` : rate? html`<${EX.Explore} id=${id} facts=${facts} exclude=${ctx.groups.map(g=> g.dim)} onDrill=${(d,k)=> dispatch({ t:'drill', node:N.group(d, k) })}
        renderRecords=${(fx, tags)=> html`${tags}${fx.length? html`<${P.RRecords} id=${id} facts=${fx.filter(x=> x.ok===false).concat(fx.filter(x=> x.ok!==false))} limit=${8} onOpen=${openRec(dispatch)}/>` : html`<${P.Empty} text="No records match these filters."/>`}`}/>`
        : id==='ic'? html`<${ICView} facts=${facts} dispatch=${dispatch}/>` : html`${SPLIT[id]? html`<${RankTable} id=${id} facts=${facts} nav=${nav} dispatch=${dispatch} exclude=${ctx.groups.map(g=> g.dim)}/>` : html`<${Breakdown} id=${id} facts=${facts} nav=${nav} dispatch=${dispatch} exclude=${ctx.groups.map(g=> g.dim)} title="Break it down further"/>`}
      ${SPLIT[id]? html`<${SplitChart} id=${id} facts=${facts} dispatch=${dispatch}/>` : html`<${P.RRecords} id=${id} facts=${rate? facts.filter(x=> x.ok===false).concat(facts.filter(x=> x.ok)) : facts} onOpen=${openRec(dispatch)}/>`}`}</${Fragment}>`;
  };
  const RiskFactors = ({ rk })=> html`<${P.Card} title="Close-risk factors" sub="Score = 60% worst factor + 40% weighted average">
    <div class="px-factors">${rk.factors.map(x=> html`<div key=${x.id} class="px-factor"><span class="n">${x.name}<small>weight ${x.w}</small></span>
      <span class="trk"><i style=${{ width:(x.v||0)+'%', background: x.v>=80? COL.crit : x.v>=60? COL.high : x.v>=40? '#B08A1E' : COL.light }}/></span><span class="v num">${x.v==null? 'N/A' : x.v}</span>
      <span class="w">${P.vt(x.why)}<small> · ${x.src}</small></span></div>`)}</div>
    <div class="px-note">Category <${P.RiskTag} cat=${rk.cat} score=${rk.score} small=${true}/> · forecast ${M.wdl(rk.fc)} (likelihood ${rk.lik}%) against target WD+${C.targetWD}.</div></${P.Card}>`;
  const EntityInKpi = ({ f, nav, dispatch, cx:ctx })=>{
    const id = ctx.entity, k = ctx.eff, facts = ctx.facts, why = M.why(id, { kpi:k==='health'? null : k, f, groups:ctx.groups }), p = M.entity(id), rate = M.isRate(k), bad = facts.filter(x=> x.ok===false);
    return html`<${Fragment}>
      <${P.Card} title=${'Why '+ename(id)+' surfaced'} right=${html`<button type="button" class="btn primary sm" onClick=${()=> dispatch({ t:'drill', node:N.profile(id) })}>Open full Entity Profile</button>`}>
        <ul class="px-why">${why.map((w,i)=> html`<li key=${i} class=${'w-'+w.t}>${w.kpi && html`<b>${w.kpi}: </b>`}${w.text}</li>`)}</ul></${P.Card}>
      <div class="px-stats row"><${P.Stat} label=${M.KPI[k]? M.KPI[k].name+' records' : 'Records'} value=${FCT.n(facts.length)}/>${rate && html`<${P.Stat} label="Exceptions" value=${FCT.n(bad.length)+' of '+FCT.n(facts.length)}/>`}
        <${P.Stat} label="Tasks done" value=${p.done+' of '+p.ts.length} sub=${p.behind+' behind plan'}/><${P.Stat} label="Close risk" value=${p.rk.score+' · '+p.rk.cat} sub=${'Forecast '+M.wdl(p.rk.fc)}/></div>
      ${k==='entmix'? html`<${RiskFactors} rk=${p.rk}/>` : facts.length? html`<${P.RRecords} id=${k} facts=${rate? bad.concat(facts.filter(x=> x.ok)) : facts} onOpen=${openRec(dispatch)}/>` : html`<${P.Empty} text="This entity has no records for this KPI under the current filters."/>`}</${Fragment}>`;
  };

  /* ---------- Entity Profile ---------- */
  P.EntityProfile = ({ id, f, ctx, onDoc, onCase })=>{
    const p = M.entity(id), e = p.e, rk = p.rk, why = M.why(id, ctx), [tab, setTab] = useState('tasks'), rm = P.useRM();
    const exs = D.exceptions.filter(x=> x.entity===id && (x.tower==='R2R' || (x.also||[]).includes('R2R')));
    const tabs = { tasks:asFacts(p.ts.filter(t=> M.behind(t))), recs:asFacts(p.rs.filter(r=> r.st!=='Certified')), jes:asFacts(p.js.filter(j=> j.m===5 && (M.jSt(j)!=='Posted' || j.fl.length))), ic:asFacts(p.ic), cases:asFacts(p.cases) };
    const trend = C.months.map((m,i)=> ({ m:m.slice(0,3), v:+p.manByM[i].toFixed(2), r:p.ftrByM[i]==null? null : +p.ftrByM[i].toFixed(1) }));
    return html`<div class="px-prof">
      <div class="px-id"><div><h2>${e.id} ${e.name}</h2><div class="faint">${[e.type, e.seg!==e.type? e.seg : null, e.region].filter(Boolean).join(' · ')} · controller ${(D.users.find(u=> u.id===e.ctl)||{}).name||e.ctl} · ${(D.r2r.settings.mapping.find(x=> x[0]===id)||[])[1]||''}</div>
          <div class="tags"><${P.RiskTag} cat=${rk.cat} score=${rk.score}/><span class=${cx('px-tag', rk.fc>C.targetWD && 'warn')}>Forecast ${M.wdl(rk.fc)} · ${rk.lik}%</span><span class="px-tag">Readiness ${id==='IN-07'? FCT.v('in07.readiness') : e.readiness}/90</span>${e.feed && html`<span class="px-tag warn">${e.feed}</span>`}</div></div>
        <div class="px-idk"><${P.Stat} label="Tasks done" value=${p.done+' of '+p.ts.length} sub=${p.behind+' behind plan'}/><${P.Stat} label="Reconciliations" value=${p.cert+' of '+p.rs.length} sub=${cr(p.unrec)+' unexplained'}/><${P.Stat} label="Journals waiting" value=${FCT.n(p.pend.length)} sub=${p.drafts.length? p.drafts.length+' AI drafts' : cr(M.sum(p.pend, j=>j.val))}/></div></div>
      <div class="px-grid g-2">
        <${P.Card} title="Why this entity surfaced"><ul class="px-why">${why.map((w,i)=> html`<li key=${i} class=${'w-'+w.t}>${w.kpi && html`<b>${w.kpi}: </b>`}${w.text}</li>`)}</ul>
          ${exs.length>0 && html`<div class="px-exs">${exs.map(x=> html`<div key=${x.id} class="px-ex"><span><b>${x.id}</b> ${x.title}</span><${P.Decide} id=${x.id}/></div>`)}</div>`}</${P.Card}>
        <${RiskFactors} rk=${rk}/></div>
      <${P.Card} title="Where in the process chain this entity has issues" sub="Sep-26 close: tasks, reconciliations, journals, IC items, variances and mapping.">
        <ol class="px-flow compact">${p.stages.map((s,i)=> html`<li key=${s.id}><div class="px-stage static"><span class="sh"><b>${s.name}</b></span><span class="sv num">${FCT.n(s.n)}<small> issues</small></span>
          <span class="sx">${amt(s.val)}</span><span class="st">${s.issues.slice(0,2).map(x=> M.issue(x.code).name+' ('+x.n+')').join('; ') || 'No issues'}</span></div>${i<5 && html`<span class="ar" aria-hidden="true">→</span>`}</li>`)}</ol></${P.Card}>
      <div class="px-grid g-3">
        <${P.Card} title="Manual journal value by close"><div style=${{height:150}}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${trend} margin=${{top:8,right:4,left:-18,bottom:0}}>
          <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="m" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${42}/><${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=>cr(v) })}/>
          <${R.Bar} dataKey="v" name="Manual journal value" fill=${COL.brand2} radius=${[3,3,0,0]} maxBarSize=${26} isAnimationActive=${!rm}/></${R.BarChart}></${R.ResponsiveContainer}></div>
          <${P.RKey} items=${[['sq', COL.brand2, 'Manual and AI-drafted journal value (₹) per close']]}/>
          <p class="px-p faint">First-time-right: ${trend.map(x=> x.r==null? 'N/A' : x.r+'%').join(' · ')}</p></${P.Card}>
        <${P.Card} title="Balances and mapping"><div class="px-kv"><div><span>Breaks above ₹10 L</span><b>${p.breaks.length} · ${amt(M.sum(p.breaks, r=> r.diff))}</b></div>
          <div><span>Reconciling items over 60 days</span><b>${FCT.n(M.sum(p.rs, r=> r.items[2]+r.items[3]))}</b></div><div><span>IC items not agreed</span><b>${p.ic.filter(x=> !M.agreed(x)).length} · ${amt(M.sum(p.ic.filter(x=> !M.agreed(x)), x=> x.diff))}</b></div>
          <div><span>Account mapping</span><b>${pct(p.mapPct,1)} of ${e.local}</b></div></div></${P.Card}>
        <${P.Card} title="Variances and cases"><div class="px-kv"><div><span>Material variances</span><b>${p.vs.length} · ${p.vs.filter(M.varSigned2).length} signed</b></div>
          <div><span>Open cases</span><b>${p.cases.filter(c=> M.statusMeasure(c.stNow)==='potential').length} · ${amt(M.sum(p.cases.filter(c=> M.statusMeasure(c.stNow)==='potential'), c=> c.est||0))}</b></div>
          <div><span>Adjustments booked</span><b>${amt(M.sum(p.cases.filter(c=> c.stNow==='booked'), c=> c.est||0))}</b></div><div><span>Average close day</span><b>WD+${e.avgClose.toFixed(1)}</b></div></div></${P.Card}></div>
      <${P.Card} title="Records and evidence" className="flush" right=${html`<${P.Seg} label="Show" value=${tab} onChange=${setTab} options=${[['tasks','Behind plan'],['recs','Open recs'],['jes','Journals'],['ic','IC items'],['cases','Cases']]}/>`}>
        <${P.Table} cols=${P.rcols('profile', { tasks:'task', recs:'rec', jes:'je', ic:'ic', cases:'case' }[tab])} rows=${tabs[tab]} rowKey=${(x)=> x.rec.id} caption="Entity records" limit=${12}
          onOpen=${(x)=> tab==='cases'? onCase(x.rec.id) : onDoc(x.rec.id)} emptyText="Nothing open here."/></${P.Card}></div>`;
  };

  /* ---------- incident explained: for each issue on a record, what / when / how (the rule that fired, with this record's numbers) / why (which KPI it moves), plus one chart ---------- */
  const TW = C.todayWD, kn = (k)=> (M.KPI[k]||{}).name || k, hrs = (d)=> d<1? Math.round(d*24)+' hours' : (Math.round(d*10)/10)+' days';
  const incident = (code, r)=>{
    const lock = r.m!=null? M.wdDate(r.m, 1) : '—', d = r.kind==='task'? M.taskDoneWD(r) : null;
    switch(code){
      case 'tkSub': case 'tkJnl': case 'tkRec': case 'tkRev': case 'tkCls': case 'tkRpt': return {
        what: r.name+' ('+M.grpName(r.grp).toLowerCase()+') ran behind plan.', when: 'Planned '+M.wdl(r.dueWD)+' ('+M.wdDate(r.m, r.dueWD)+'); '+(d!=null? 'done '+M.wdl(d)+'.' : 'still open at the snapshot ('+M.wdl(TW)+').'),
        how: d!=null? 'Done day '+M.wdl(d)+' is after planned day '+M.wdl(r.dueWD)+': '+(d-r.dueWD)+' working day'+(d-r.dueWD>1? 's' : '')+' late.' : 'Not done and its planned day has passed (or the month is closed).',
        why: 'Counts as late in '+kn('tasks')+'. Owner '+r.owner+'; later '+M.stage(r.stage).name.toLowerCase()+' steps wait on it.' };
      case 'feed': return { what: 'Upstream input not ready: '+r.st+'.', when: 'At the snapshot, '+M.wdl(TW)+'.', how: 'Task status names a stale feed or rate table and the task is not done.', why: 'Blocks the sub-ledger step, so '+kn('tasks')+' and every later stage slip.' };
      case 'jeNoSupp': return { what: 'Journal posted with no supporting document.', when: 'Posted '+M.dt(r.post)+'.', how: 'Support flag is empty on the posted journal.', why: 'Fails the '+kn('jnl')+' first-time-right check; '+amt(r.val)+' has no audit evidence.' };
      case 'jeLate': return { what: 'Approved after it was posted.', when: 'Posted '+M.dt(r.post)+', approved '+M.dt(r.apprAt)+'.', how: 'Approval came '+hrs(r.apprAt - r.post)+' after posting; approval must come first.', why: 'Fails the '+kn('jnl')+' first-time-right check: the preventive control did not operate.' };
      case 'jeSod': return { what: 'Same user prepared and approved.', when: 'Posted '+M.dt(r.post)+'.', how: 'Preparer '+r.prep+' = approver '+r.appr+'.', why: 'Fails the '+kn('jnl')+' first-time-right check: segregation of duties breached on '+amt(r.val)+'.' };
      case 'jeAnom': return { what: r.desc || 'Journal pattern differs from history.', when: 'Posted '+M.dt(r.post)+'.', how: 'Anomaly score '+r.score+' is at or above the 0.75 threshold.', why: 'Fails the '+kn('jnl')+' first-time-right check; full '+amt(r.val)+' sits in Potential Adjustments until support is reviewed.' };
      case 'jeCorr': return { what: 'Journal was corrected or reversed after posting.', when: 'Original posted '+M.dt(r.post)+'.', how: 'A correcting entry references this journal.', why: 'Fails the '+kn('jnl')+' first-time-right check: it was not right the first time.' };
      case 'perPost': return { what: 'Posted into a period that was already locked.', when: 'Lock '+lock+' (WD+1); posted '+M.dt(r.post)+'.', how: 'Posting date is after the period lock.', why: 'Fails the '+kn('jnl')+' first-time-right check; reported '+M.mon(r.m)+' numbers changed after sign-off.' };
      case 'jePend': return { what: 'Journal waiting for approval.', when: 'Submitted '+M.dt(r.sub)+'; snapshot '+C.snapLabel+'.', how: 'Waiting '+hrs(M.SNAP - r.sub)+', above the 1-day limit.', why: 'Adds '+amt(r.val)+' to '+kn('jpend')+'; the close cannot lock with it open.' };
      case 'recBreak': case 'recDiff': return { what: amt(r.diff)+' between GL and support is not explained.', when: r.m!=null? M.mon(r.m)+' close, due '+M.wdl(r.dueWD)+'.' : '—',
        how: 'GL '+amt(r.gl)+' − support '+amt(r.sub)+' − explained '+amt(r.expl)+' = '+amt(r.diff)+(code==='recBreak'? ', above ₹10 L.' : ', below ₹10 L.'), why: 'Adds to '+kn('unrec')+(code==='recBreak'? ' and opens a reconciliation break.' : '.') };
      case 'recAged': return { what: (r.items[2]+r.items[3])+' reconciling items are older than 60 days.', when: 'Ageing at the '+M.mon(r.m)+' close.', how: 'Items by age: '+r.items.join(' · ')+' (under 30 · 30–60 · 60–90 · over 90).', why: 'Old items usually mean a missing entry; it weakens the reconciliation even if it is certified.' };
      case 'recLate': return { what: 'Certified after its due day.', when: 'Due '+M.wdl(r.dueWD)+', certified '+M.wdl(r.certWD)+'.', how: 'Certified '+(r.certWD-r.dueWD)+' working day'+(r.certWD-r.dueWD>1? 's' : '')+' late.', why: 'Counts as not on time in '+kn('recs')+'.' };
      case 'recDue': return { what: 'Due but not certified.', when: 'Due '+M.wdl(r.dueWD)+'; snapshot '+M.wdl(TW)+'.', how: 'No certification date and the due day has passed.', why: 'Counts as not on time in '+kn('recs')+'. Reviewer '+r.rev+'.' };
      case 'selfRev': return { what: 'Preparer also reviewed it.', when: M.mon(r.m)+' close.', how: 'Preparer '+r.prep+' = reviewer '+r.rev+'.', why: 'The review is not independent, so the certification gives little assurance.' };
      case 'icUnm': return { what: r.pair+' does not agree: '+r.st+'.', when: M.mon(r.m)+' close; '+r.a+' booked it on WD0.', how: r.a+' booked '+amt(r.val)+'; '+r.b+' shows '+amt(r.val - r.diff)+'. Difference '+amt(r.diff)+(r.note? ' ('+r.note+').' : '.'), why: 'Counts as not matched in '+kn('ic')+'; it would not eliminate on consolidation.' };
      case 'icConf': return { what: r.b+' has not confirmed the balance.', when: 'Open at the snapshot, '+M.wdl(TW)+'.', how: 'Status is "Not confirmed".', why: 'An unconfirmed pair counts as not matched in '+kn('ic')+'.' };
      case 'varNoComm': return { what: r.line+' moved '+amt(r.v)+' ('+r.pct+') without signed commentary.', when: 'Sign-off deadline WD+2; '+(r.signedWD!=null? 'signed '+M.wdl(r.signedWD)+'.' : 'not signed (status: '+r.st+').'),
        how: r.signedWD!=null? 'Signed after WD+2.' : 'No sign-off date on a material variance.', why: 'Counts as missing in '+kn('var')+'; the pack cannot explain this line.' };
      case 'unmapped': return { what: r.local+' has no group chart-of-accounts mapping.', when: 'At the snapshot.', how: 'Suggested '+r.sugg.replace(/^Suggested:\s*/,'')+' at '+pct(r.conf*100,0)+' confidence; not yet approved.', why: 'Lowers '+kn('mapq')+'; '+amt(r.bal)+' cannot roll into group lines.' };
      case 'tieOut': return { what: 'Group pack does not tie to the trial balance.', when: 'At the snapshot.', how: amt(r.bal)+' sits in an unmapped account, so pack totals miss it.', why: 'Blocks the pack tie-out check in Reporting & sign-off.' };
      default: return { what: M.issue(code).name+'.', when: '—', how: '—', why: '—' };
    } };
  P.Incident = ({ r, codes })=>{
        return html`<div class="px-inc rx-full">${codes.map(c=>{ const x = incident(c, r), is = M.issue(c);
        return html`<div key=${c} class="px-inc-i" style=${{ borderLeft:'3px solid '+(is.kind==='fin'? COL.crit : is.kind==='ctl'? COL.high : COL.brand2), padding:'6px 0 6px 12px', marginBottom:12 }}>
          <div style=${{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}><b>${is.name}</b><span class="px-pill">${M.stage(is.stage).name}</span><span class="px-pill">${is.kind==='fin'? 'Financial' : is.kind==='ctl'? 'Control' : 'Operational'}</span></div>
          <div class="px-kv">${[['What', x.what], ['When', x.when], ['How we know', x.how], ['Why it matters', x.why]].map(([l,v])=> html`<div key=${l}><span>${l}</span><b style=${{ fontWeight:500, textAlign:'right' }}>${v}</b></div>`)}</div></div>`; })}
      </div>`;
  };

  /* ---------- incident story: why it happened, who was accountable, ripple effects downstream, and a one-look ripple chart (all from the ledger) ---------- */
  const STG = C.stages.map(s=> s.id);
  const sameMonth = (r)=>{ const e = r.kind==='ic'? r.a : r.e, m = r.m!=null? r.m : 5;
    return [].concat(X_(M.X.tasks), X_(M.X.recs), X_(M.X.jes), M.X.ic.filter(x=> x.m===m && (x.a===e || x.b===e)), X_(M.X.vars), M.X.unmapped.filter(u=> u.e===e));
    function X_(a){ return a.filter(x=> x.e===e && x.m===m); } };
  const storyOf = (r)=>{
    const e = r.kind==='ic'? r.a : r.e, m = r.m!=null? r.m : 5, recs = sameMonth(r), ch = M.chain(r.id), my = ch? ch.iss : [];
    const st0 = my.length? M.issue(my[0]).stage : 'cls', i0 = STG.indexOf(st0);
    const byStage = {}; STG.forEach(s=> byStage[s] = { n:0, val:0 }); recs.forEach(x=> M.issuesOf(x).forEach(c=>{ const s = byStage[M.issue(c).stage]; s.n++; s.val += M.recVal(x, c); }));
    const late = (t)=> M.issuesOf(t).some(c=> /^tk/.test(c));
    const upT = M.X.tasks.filter(t=> t.e===e && t.m===m && STG.indexOf(t.stage) < i0 && late(t));
    let why, who, pat;
    if(r.kind==='task'){ const s = r.st || '';
      why = /Awaiting review/i.test(s)? 'Work was prepared but sat in the review queue; the reviewer had not signed off by the planned day.' : /Not started/i.test(s)? 'The task was never started, so the slip is capacity or hand-off, not a technical blocker.' : /In progress/i.test(s)? 'Started but not finished by the planned day; the work took longer than the plan allowed.' : /feed|rate/i.test(s)? 'Blocked by an upstream input: '+s+'.' : 'Completed '+M.wdl(M.taskDoneWD(r))+' against a plan of '+M.wdl(r.dueWD)+'.';
      who = 'Owner '+r.owner+' ('+M.grpName(r.grp).toLowerCase()+').'; const mine = M.X.tasks.filter(t=> t.owner===r.owner && t.m===m && late(t)); pat = r.owner+' has '+mine.length+' late task'+(mine.length===1? '' : 's')+' in this close.'; }
    else if(r.kind==='rec'){ why = r.diff>0? amt(r.diff)+' of the GL balance is not backed by support or explained items' + (r.items[2]+r.items[3]? '; '+(r.items[2]+r.items[3])+' items are over 60 days old, so the gap is long-standing.' : '.') : r.certWD==null? 'Prepared but not yet certified by the reviewer.' : 'Certification came after the due day.';
      who = 'Prepared by '+r.prep+', reviewed by '+r.rev+(r.prep===r.rev? ' (same person).' : '.'); const mine = M.X.recs.filter(x=> x.rev===r.rev && x.m===m && (M.issuesOf(x).includes('recLate') || M.issuesOf(x).includes('recDue'))); pat = r.rev+' has '+mine.length+' late or uncertified reconciliation'+(mine.length===1? '' : 's')+' this close.'; }
    else if(r.kind==='je'){ const f = r.fl; why = f.includes('anom')? (r.desc || 'Value, account pair or timing is unusual for this entity.') : f.includes('noSupp')? 'Posted before the support was attached.' : f.includes('late')? 'Posted first and approved later, so approval was retrospective.' : f.includes('sod')? 'No second person approved it.' : f.includes('perPost')? 'Posted after the period lock.' : f.includes('corr')? 'The original entry was wrong and had to be corrected.' : 'Waiting in the approval queue.';
      who = 'Prepared by '+r.prep+(r.appr? ', approved by '+r.appr : ', not yet approved')+'. Source: '+M.srcName(r.src)+'.'; const mine = M.X.jes.filter(j=> j.prep===r.prep && j.m===r.m && j.fl.length); pat = r.prep+' prepared '+mine.length+' flagged journal'+(mine.length===1? '' : 's')+' in '+M.mon(r.m)+'.'; }
    else if(r.kind==='ic'){ why = r.note || (r.st==='Not confirmed'? r.b+' has not confirmed its side.' : 'The two sides booked different amounts ('+r.st.toLowerCase()+').');
      who = r.a+' booked the charge; '+r.b+' is the counterparty.'; const mine = M.X.ic.filter(x=> x.pair===r.pair && x.m===m && !M.agreed(x)); pat = mine.length+' item'+(mine.length===1? '' : 's')+' on '+r.pair+' are not agreed this close.'; }
    else if(r.kind==='var'){ why = r.st==='Not started'? 'No commentary was drafted.' : r.signedWD==null? 'Commentary exists ('+r.st+') but was not signed off.' : 'Commentary was signed after WD+2.';
      who = 'Entity controller of '+ename(e)+(r.drivers && r.drivers.length? '. Drivers: '+r.drivers.join(', ') : '')+'.'; const mine = M.X.vars.filter(v=> v.e===e && v.m===m && !M.varSigned2(v)); pat = mine.length+' variance'+(mine.length===1? '' : 's')+' at '+e+' lack signed commentary.'; }
    else { why = 'A local account was opened without a group mapping; the suggestion ('+pct(r.conf*100,0)+') awaits approval.'; who = ename(e)+' finance team (mapping owner).'; const mine = M.X.unmapped.filter(u=> u.e===e && !M.mapped(u)); pat = mine.length+' account'+(mine.length===1? '' : 's')+' at '+e+' are unmapped.'; }
    const causes = upT.slice(0,3).map(t=> ({ label:t.name, doc:t.id }));
    if(r.kind==='ic' && M.E[r.b]) causes.push({ label:ename(r.b)+' (counterparty)', ent:r.b });
    if(upT.length) why += ' Upstream: '+upT.length+' earlier-stage task'+(upT.length===1? ' was' : 's were')+' also late ('+upT.slice(0,2).map(t=> t.name).join(', ')+(upT.length>2? '…' : '')+').';
    /* ripple effect as one plain sentence: what gets stuck (and where most), which score drops, money at risk, and the close date */
    const down = STG.slice(i0+1).filter(s=> byStage[s].n), nDown = M.sum(down, s=> byStage[s].n), big = down.slice().sort((x,y)=> byStage[y].n - byStage[x].n)[0];
    const kp = { task:'tasks', rec:'recs', je:'jnl', ic:'ic', var:'var', acct:'mapq' }[r.kind], cs = M.X.cases.filter(c=> c.lines.includes(r.id)), cv = M.sum(cs, c=> c.est!=null? c.est : c.affected||0);
    const rk = M.E[e]? M.risk(e) : null, slip = rk? rk.fc - C.targetWD : 0, parts = [];
    if(nDown) parts.push(nDown+' item'+(nDown===1? '' : 's')+' in later steps at '+e+' '+(nDown===1? 'stays' : 'stay')+' stuck'+(big? ' (mostly in '+M.stage(big).short.toLowerCase()+')' : ''));
    parts.push('the '+kn(kp)+' score stays low');
    if(cv) parts.push(amt(cv)+' in the books may be wrong');
    if(rk && slip>0) parts.push(e+' could close '+slip+' day'+(slip===1? '' : 's')+' late');
    const list = parts.length>1? parts.slice(0,-1).join(', ')+' and '+parts[parts.length-1] : parts[0];
    const rip = 'Until this is fixed, '+list+(rk && slip<=0? '; '+e+' should still close on time.' : '.');
    return { e, m, why, who, pat, rip, causes, rows: STG.map((s,i)=> ({ n:M.stage(s).short, v:byStage[s].n, c: i===i0? COL.crit : i>i0? COL.high : COL.light })) };
  };
  (function(){ if(document.getElementById('rx-full-css')) return; const st = document.createElement('style'); st.id = 'rx-full-css';
    st.textContent = '.rx-full .px-kv span,.rx-full .px-kv b{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}.rx-full .px-kv > div{align-items:flex-start}.rx-full .px-kv > div > span{flex:none;min-width:110px}';
    (document.head||document.documentElement).appendChild(st); })();
  /* AI recommendations for one record: plain next steps built from the record, its owner's workload, the downstream ripple and any linked case */
  const ctlOf = (e)=>{ const x = M.E[e], u = x && ((window.FCT_DATA||{}).users||[]).find(u=> u.id===x.ctl); return u? u.name : 'the entity controller'; };
  const recoOf = (r)=>{
    const s = storyOf(r), e = s.e, out = [], ctl = ctlOf(e), add = (t, why)=> out.push({ t, why });
    if(r.kind==='task'){ const st = r.st || '', mine = M.X.tasks.filter(t=> t.owner===r.owner && t.m===s.m && M.issuesOf(t).some(c=> /^tk/.test(c))).length;
      const cu = ((window.FCT_DATA||{}).users||[]).find(u=> u.name===ctl), away = cu && cu.availability && cu.availability.status==='On leave';
      if(/Awaiting review/i.test(st)) add(away? 'Name a back-up reviewer to sign off this task today.' : 'Ask '+ctl+' to review and sign off this task today.', away? 'The usual reviewer, '+ctl+', is on leave until '+cu.availability.to+'; the work itself is done.' : 'The work is already done; only the sign-off is missing.');
      else if(/Not started/i.test(st)) add('Give this task to a colleague who has time this week.', r.owner+' has not started it and the planned day has passed.');
      else if(/Blocked/i.test(st)) add('Fix what is blocking the task first, then agree a new finish day with '+r.owner+'.', 'The task cannot move until the input it waits for arrives.');
      else if(/AI draft/i.test(st)) add('Review the AI draft and submit it if the figures look right.', 'A draft is ready; it only needs a person to check and submit it.');
      else add('Agree a firm finish time with '+r.owner+' for today.', 'The task is started but past its planned day.');
      if(mine>3) add('Move some of '+r.owner+'\'s '+mine+' late tasks to other team members.', 'One person holds too many late tasks, so the delays will repeat.');
      const onLeave = ((window.FCT_DATA||{}).users||[]).find(u=> u.name===r.owner && u.availability && u.availability.status==='On leave');
      if(onLeave) add('Assign a back-up owner while '+r.owner+' is on leave.', 'The owner is away until '+onLeave.availability.to+'.'); }
    else if(r.kind==='rec'){
      if(r.diff>0) add('Find and explain the '+amt(r.diff)+' gap between the ledger and its support.', 'Until it is explained, the balance in the books may be wrong.');
      if(r.items && r.items[2]+r.items[3]) add('Clear or write off the '+(r.items[2]+r.items[3])+' items older than 60 days.', 'Old open items rarely resolve on their own.');
      if(r.certWD==null) add('Ask '+r.rev+' to certify the reconciliation once the gap is explained.', 'It counts as late until it is certified.');
      if(r.certWD!=null && r.certWD>r.dueWD) add('Plan the review of this reconciliation earlier next month so it is certified by '+M.wdl(r.dueWD)+'.', 'It was certified late, on '+M.wdl(r.certWD)+'.');
      if(r.prep===r.rev) add('Have someone other than '+r.prep+' review it.', 'The same person prepared and reviewed it, which weakens the check.'); }
    else if(r.kind==='je'){ const f = r.fl||[];
      if(f.includes('anom')) add('Check the support for this journal and confirm the amount with '+r.prep+'.', 'Its amount or account pair is unusual for '+e+'.'), add('Reverse the journal if the support does not back it.', 'If the support does not back it, the journal may need an adjustment of '+amt(r.val)+'.');
      if(f.includes('noSupp')) add('Attach the invoice or calculation that supports this journal.', 'Auditors will ask for it; without it the posting cannot be defended.');
      if(f.includes('late')) add('Record the approval properly and remind approvers to approve before posting.', 'It was approved only after it was posted.');
      if(f.includes('sod')) add('Get a second person to approve this journal.', r.prep+' both prepared and approved it.');
      if(f.includes('corr')) add('Find out why the journal had to be corrected and fix the cause.', 'Repeated corrections point to a process or data problem.');
      if(!r.post) add('Approve or reject the journal so it does not hold up the close.', 'It is still waiting and cannot post.'); }
    else if(r.kind==='ic'){
      if(r.st==='Not confirmed') add('Ask '+r.b+' to confirm item '+r.ref+' ('+amt(r.val)+') in the intercompany system.', r.b+' has not accepted it, so the two books do not agree.');
      else if(r.st==='Timing difference') add('Book the item as goods or services in transit at '+r.b+'.', 'Both sides are right; they booked it on different days.');
      else if(r.st==='FX difference') add('Use the group month-end exchange rate on both sides.', 'The gap comes only from different exchange rates.');
      add('Agree the balance with '+r.b+' before consolidation starts.', 'Unagreed items cannot be eliminated in the group accounts.'); }
    else if(r.kind==='var'){
      if(r.signedWD!=null) add('Get next month\'s explanation signed by Working Day +2.', 'This one was signed late, on '+M.wdl(r.signedWD)+'.');
      else add(r.st==='Not started'? 'Write the variance explanation, starting from the AI draft.' : 'Ask '+ctl+' to sign off the existing explanation.', 'Big budget differences need a signed reason by Working Day +2.');
      if(r.drivers && r.drivers.length) add('Check the main drivers named: '+r.drivers.slice(0,2).join(', ')+'.', 'These explain most of the '+amt(Math.abs(r.v))+' difference.'); }
    else { const weak = /no confident/i.test(r.sugg||'') || r.conf<.6;
      add(weak? 'Choose the right group account for '+r.local+' by hand.' : 'Approve the suggested group account '+r.sugg+' for '+r.local+'.', (weak? 'The system could not find a confident match ('+pct(r.conf*100,0)+').' : 'The system is '+pct(r.conf*100,0)+' sure of this match.')+' Until it is mapped, '+amt(r.bal)+' is left out of the group report.'); }
    const cs = M.X.cases.filter(c=> c.lines.includes(r.id)); cs.forEach(c=>{ if(c.est!=null) add('Decide whether to book an adjustment of '+amt(c.est)+' (case '+c.id+').', 'This is the estimated amount the books could be wrong by.'); });
    const down = s.rows.filter((x,i)=> x.c===COL.high).reduce((a,x)=> a+x.v, 0);
    if(down) add('Fix this before the later close steps at '+e+'.', down+' items in later steps are waiting on this part of the close.');
    if(!out.length) add('No action is needed on this record now; keep it on watch for the next close.', 'It has no open problem that needs fixing today.');
    return out.slice(0,5);
  };
  P.recoOf = (r)=> recoOf(r);
  /* Decide: closes the "Incident explained" card and opens the shared decision drawer (same template as every tower).
     A record without a shared decision gets one built from its own data: what happened, evidence, AI recommendation and the decision bar. */
  const SEVK = { fin:'high', ctl:'medium', ops:'medium' };
  const exOf = (r)=>{
    const D0 = window.FCT_DATA, id = 'R2R-'+r.id; let x = FCT.ex(id); if(x) return x;
    const s = storyOf(r), ch = M.chain(r.id), codes = ch? ch.iss : [], c0 = codes[0], is = c0? M.issue(c0) : { name:'Exception', kind:'ops' }, inc = c0? incident(c0, r) : {};
    const kp = { task:'tasks', rec:'recs', je:'jnl', ic:'ic', var:'var', acct:'mapq' }[r.kind], recs = recoOf(r), e = s.e, rk = M.E[e]? M.risk(e) : null;
    const val = c0? M.recVal(r, c0) : 0, users = D0.users||[], uid = (n)=> (users.find(u=> u.name===n)||{}).id;
    const owner = uid(r.owner) || uid(r.rev) || uid(r.prep) || (M.E[e]||{}).ctl || 'AR';
    const slip = rk? rk.fc - C.targetWD : 0, sev = rk && rk.cat==='Critical'? 'critical' : SEVK[is.kind] || 'medium';
    x = { id, tower:'R2R', entity:e, severity:sev, priority: Math.min(99, Math.round((rk? rk.score : 50)*.6 + (val>1? 25 : val>.1? 15 : 8))),
      title: is.name+': '+N.doc(r.id).label, subject: ename(e)+' · '+kn(kp),
      impact: r.kind==='task'? { short: slip>0? '+'+slip+' close day'+(slip===1? '' : 's') : 'On plan', label: slip>0? e+' forecast '+M.wdl(rk.fc)+' vs WD+'+C.targetWD : 'Close forecast' }
        : { valueCr: val || null, short: val? null : 'Not quantified', label: is.kind==='fin'? 'Could be wrong in the books' : 'Value affected' },
      due:'Today 18:00', owner,
      trigger: 'R2R scorecard check: '+is.name.toLowerCase()+' ('+kn(kp)+')',
      what: FCT.esc(s.why)+'<br><br><b>Ripple effect:</b> '+FCT.esc(s.rip),
      evidence:{ table:{ cols:['Question','Answer'], right:[], rows:[['What', inc.what||'—'], ['When', inc.when||'—'], ['How we know', inc.how||'—'], ['Why it matters', inc.why||'—'], ['Who', s.who], ['Pattern', s.pat]] } },
      ai:{ short: recs[0]? recs[0].t : '', text: recs.map((y,i)=> (i+1)+') '+FCT.esc(y.t)).join(' '), reasoning: recs.map(y=> FCT.esc(y.why)), model:'R2R recommendation rules' },
      takeForm:{ checks: recs.map(y=> y.t) }, takeLabel:'Take the recommended steps',
      override:[{ label:'Accept as is and keep it open for audit' }, { label:'Take a different action (describe in comment)' }],
      activity:[{ t: C.snapLabel, text:'Raised by the R2R scorecard: '+is.name.toLowerCase(), ai:true }],
      links:[[kn(kp)+' KPI', 'screens/r2r/desk.html#kpi='+kp]] };
    (D0.exceptions = D0.exceptions || []).push(x); return x;
  };
  P.exOf = exOf;
  const DecideBlock = ({ r })=>{
    const shared = r.ex && FCT.ex(r.ex), [, tick] = useState(0);
    const x = shared || FCT.ex('R2R-'+r.id), st = x && FCT.status(x), done = x && !FCT.isOpen(x);
    useEffect(()=>{ const t = setInterval(()=> tick(n=> n+1), 1500); return ()=> clearInterval(t); }, []);
    const open = ()=>{ const y = shared || exOf(r); FCT.openDrawer(y.id); };
    return html`<div style=${{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--px-line)' }}>
      ${shared && html`<p class="px-p" style=${{ margin:'0 0 8px' }}>Shared decision <b>${r.ex}</b>: ${shared.title}</p>`}
      <div style=${{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <button type="button" class="btn primary" style=${{ minWidth:160, justifyContent:'center' }} onClick=${open}>${done? 'View decision' : 'Decide'}</button>
        <span class="faint" style=${{ fontSize:12 }}>${done? 'Decision recorded: '+st.replace(/-/g,' ')+'.' : 'Opens the decision panel with the AI recommendation, evidence and actions.'}</span></div></div>`;
  };
  P.IncidentStory = ({ r, onDoc, onEntity })=>{
    const rm = P.useRM(), s = storyOf(r);
    return html`<div class="px-inc-s rx-full" style=${{ marginTop:16 }}>
      <div class="px-kv">${[['Why it happened', s.why], ['Who', s.who], ['Pattern', s.pat]].map(([l,v])=> html`<div key=${l}><span>${l}</span><b style=${{ fontWeight:500, textAlign:'right', maxWidth:'70%' }}>${v}</b></div>`)}</div>
      <p class="px-p" style=${{ margin:'12px 0 4px' }}><b>Ripple effect: </b>${s.rip}</p>
      <p class="px-p faint" style=${{ margin:'12px 0 4px' }}>Problems at each step of the close at ${s.e} (${M.mon(s.m)}).</p>
      <div style=${{ height:220 }}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${s.rows} margin=${{ top:16, right:8, left:0, bottom:4 }}>
        <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="n" ...${P.axis}/><${R.YAxis} ...${P.axis} width=${32} allowDecimals=${false}/><${R.Tooltip} content=${h(P.Tip,{ fmt:(v)=> v+' exceptions' })}/>
        <${R.Bar} dataKey="v" name="Exceptions" radius=${[3,3,0,0]} maxBarSize=${40} isAnimationActive=${!rm} label=${{ position:'top', fontSize:11, fill:'var(--px-ink2)' }}>${s.rows.map((x,i)=> html`<${R.Cell} key=${i} fill=${x.c}/>`)}</${R.Bar}></${R.BarChart}></${R.ResponsiveContainer}></div>
      <${P.RKey} items=${[['sq', COL.crit, 'This step (where this record sits)'], ['sq', COL.high, 'Later steps that can be held up'], ['sq', COL.light, 'Earlier steps (not affected)']]} note="Bar height = records with an issue at that step"/></div>`;
  };

  /* ---------- one record: where it sits in the process chain, its values, issues, cases and evidence ---------- */
  P.RDocView = ({ id, onEntity, onCase, onDoc })=>{
    const r = M.rec(id); if(!r) return html`<${P.Empty} text="This record is not in the demo ledger."/>`;
    P.wdMonth = r.m!=null? r.m : null; useEffect(()=> ()=>{ P.wdMonth = null; }, []);
    const ch = M.chain(id), e = r.kind==='ic'? r.a : r.e, cases = M.X.cases.filter(c=> c.lines.includes(id));
    const kv = r.kind==='je'? [['Value', amt(r.val)], ['Source', M.srcName(r.src)], ['Category', M.catName(r.cat)], ['Debit / credit', anm(r.acct)+' / '+anm(r.acct2)], ['Status', M.jSt(r)], ['Prepared by', r.prep], ['Approved by', r.appr || '—'], ['Support', r.supp? 'Attached' : 'Missing'], ['Anomaly score', String(r.score)]]
      : r.kind==='rec'? [['GL balance', amt(r.gl)], ['Support balance', amt(r.sub)], ['Explained items', amt(r.expl)], ['Unexplained', amt(r.diff)], ['Risk class', r.risk], ['Due / certified', M.wdl(r.dueWD)+' / '+(r.certWD==null? 'not certified' : M.wdl(r.certWD))], ['Preparer / reviewer', r.prep+' / '+r.rev], ['Items by age', r.items.join(' · ')+' (under 30 · 30–60 · 60–90 · over 90 days)']]
      : r.kind==='task'? [['Close activity', M.grpName(r.grp)], ['Owner', r.owner], ['Planned', M.wdl(r.dueWD)+' · '+M.wdDate(r.m, r.dueWD)], ['Done', M.taskDoneWD(r)==null? r.st : M.wdl(M.taskDoneWD(r))]]
      : r.kind==='ic'? [['Pair', r.pair], ['Value', amt(r.val)+' · '+r.ccy], ['Status', r.st], ['Difference', amt(r.diff)], ['Note', r.note || '—']]
      : r.kind==='var'? [['Line', r.line], ['Variance', amt(r.v)+' ('+r.pct+')'], ['Commentary', r.st+(r.signedWD!=null? ' '+M.wdl(r.signedWD) : '')], ['Drivers', (r.drivers||[]).join('; ') || '—'], ['AI confidence', r.conf? pct(r.conf*100,0) : '—']]
      : [['Local account', r.local], ['Balance', amt(r.bal)], ['Suggested', r.sugg], ['Confidence', pct(r.conf*100,0)], ['Status', M.mapped(r)? 'Mapped' : 'Not mapped']];
    return html`<div class="px-grid g-doc">
      <div class="px-col"><${P.Card} title=${N.doc(id).label} sub=${ename(e)+(r.m!=null? ' · '+M.mon(r.m)+' close' : '')}>
        ${ch && html`<${P.Chain} ch=${ch}/>`}${r.kind==='var' && r.draft && html`<${AI}>${r.draft}</${AI}>`}${r.desc && html`<p class="px-p">${r.desc}</p>`}${ch && (ch.iss.length>0? html`<${P.IncidentStory} r=${r} onDoc=${onDoc} onEntity=${onEntity}/>` : html`<div class="px-inc-s" style=${{ marginTop:16 }}><p class="px-p" style=${{ margin:'0 0 4px' }}><b>Ripple effect: </b>${r.kind==='task'? (M.taskDoneWD(r)!=null? 'Finished on time, so nothing later in the close is waiting on it.' : 'Not due yet, so nothing is held up by it today.') : 'No exception on this record, so nothing later in the close is held up by it.'}</p></div>`)}</${P.Card}></div>
      <div class="px-col"><${P.Card} title="Values"><div class="px-kv">${kv.map(([l,v])=> html`<div key=${l}><span>${l}</span><b>${v}</b></div>`)}</div></${P.Card}>
        <${P.Card} title="Incident explained" sub="What happened, when, how it was detected and which KPI it moves.">${ch && ch.iss.length? html`<${P.Incident} r=${r} codes=${ch.iss}/>` : html`<p class="px-p faint">No issues raised.</p>`}
          ${cases.map(c=> html`<button key=${c.id} type="button" class="px-vrow" onClick=${()=> onCase(c.id)}><span>Case ${c.id}: ${M.CT[c.type].name}</span><span class="num">${c.est==null? (c.affected!=null? 'affected '+amt(c.affected) : 'n.q.') : amt(c.est)}</span></button>`)}
</${P.Card}>
        <${P.Card} title="Evidence" sub="Source documents; requests are simulated and logged."><ul class="px-ev">${M.evidence(r).map(([t,ref,sys],i)=> html`<li key=${i}><${Icon} n="FileText" size=${14}/><span><b>${t}</b> ${ref}<small> · ${sys}</small></span><button type="button" class="px-link sm" onClick=${()=> FCT.ui.toast(t+' '+ref+' requested from '+sys+' (simulated)')}>View</button></li>`)}</ul></${P.Card}></div></div>`;
  };

  /* ---------- case: investigation workspace (same template as P2P; What happened adapts to the case type) ---------- */
  const TICON = { accrMiss:'CalendarClock', accrDup:'Layers', cutoff:'CalendarClock', anomJe:'TriangleAlert', reclass:'Scale', recBreak:'GitCompare', icBreak:'Handshake', suspense:'FileWarning', fxReval:'Scale', provision:'Landmark', period:'Lock', nosupp:'BookOpen', mapping:'Link2' };
  const caseSum = (c, recs, ex)=>{ const n = recs.length, t = M.CT[c.type], first = recs[0];
    switch(c.type){
      case 'icBreak': return c.ex==='RTR-REC-03'? 'IN-02 shows '+amt(48.70)+' receivable from US-01; US-01 shows '+amt(45.60)+' payable. Goods in transit ('+amt(2.60)+') and FX translation ('+amt(.50)+') explain the full '+amt(c.est)+'.' : (c.note||'')+'. Estimate '+amt(c.est)+'.';
      case 'anomJe': case 'reclass': return first? 'Journal '+first.id+' ('+amt(first.val)+', '+M.catName(first.cat).toLowerCase()+') at '+first.e+' scored '+first.score+' on the journal anomaly model: '+(first.desc||'pattern differs from history')+'. The estimate is its full value until support is reviewed.' : c.note;
      case 'recBreak': return first? first.name+' at '+first.e+' has '+amt(first.diff)+' unexplained between GL ('+amt(first.gl)+') and support ('+amt(first.sub)+'), above the ₹10 L threshold.' : c.note;
      case 'suspense': return first? first.name+' at '+first.e+' holds '+amt(first.diff)+' with '+(first.items[2]+first.items[3])+' items older than 60 days. '+(c.note||'') : c.note;
      case 'accrDup': return first? first.desc+'. The September invoice has been booked as well, so expense is overstated by '+amt(c.est)+'.' : c.note;
      case 'nosupp': case 'mapping': return (c.note||'')+'. '+n+' records, '+amt(c.affected)+' affected. This is value affected, not an adjustment estimate.';
      case 'period': return first? first.desc+' by '+first.prep+'. '+amt(c.affected)+' moved between periods after August was reported.' : c.note;
      default: return (c.note||t.name)+(c.est!=null? '. Estimate '+amt(c.est)+'.' : '. Not yet quantified.')+(ex? ' Linked to '+ex.id+' ('+FCT.towerName(ex.tower)+').' : '');
    } };
  const CASE_REC = {
    accrMiss:['Book the missing accrual before the close and reverse it next month.', 'proposed', 'accrual proposed', 'Propose accrual', 'AR'],
    accrDup:['Reverse the prior-month accrual so the expense is not counted twice.', 'proposed', 'reversal proposed', 'Propose reversal', 'AR'],
    cutoff:['Move the revenue or expense to the right period with a cut-off adjustment.', 'proposed', 'cut-off adjustment proposed', 'Propose adjustment', 'AR'],
    anomJe:['Review the journal with its preparer and reverse it if the support does not hold.', 'inv', 'journal under review', 'Review journal', 'AR'],
    reclass:['Reclassify the amount to the right account and tighten the capitalisation check.', 'proposed', 'reclass proposed', 'Propose reclass', 'AR'],
    recBreak:['Investigate the unexplained difference and clear it before certification.', 'inv', 'difference under investigation', 'Investigate difference', 'AR'],
    icBreak:['Agree the balance with the counterparty and post the eliminating entry.', 'inv', 'agreement requested from counterparty', 'Agree with counterparty', 'HV'],
    suspense:['Clear the aged suspense items to the right accounts, or write them off.', 'proposed', 'clearance proposed', 'Propose clearance', 'AR'],
    fxReval:['Re-run the revaluation with the correct rate table.', 'proposed', 'revaluation correction proposed', 'Propose correction', 'HV'],
    provision:['Update the provision to the current estimate and record the basis.', 'proposed', 'provision update proposed', 'Propose update', 'KS'],
    period:['Reverse the back-posting and repost it in the open period.', 'inv', 'referred to the controller', 'Refer to controller', 'PR'],
    nosupp:['Attach the support, or reverse the journal before the close.', 'inv', 'support requested from preparer', 'Request support', 'AR'],
    mapping:['Map the local accounts to the group chart and re-run the pack tie-out.', 'proposed', 'mapping fix proposed', 'Propose mapping', 'HV'] };
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
  P.RCaseView = ({ id, onDoc, onEntity, onCase })=>{
    const c0 = M.case(id); if(!c0) return html`<${P.Empty} text="Case not found."/>`;
    const st = M.caseStatus(c0), t = M.CT[c0.type], meas = M.statusMeasure(st), ex = c0.ex && FCT.ex(c0.ex);
    const [note,setNote] = useState(''); const [why,setWhy] = useState('');
    useEffect(()=>{ P.dirty = !!note; return ()=>{ P.dirty = false; }; }, [note]);
    const set = (s, label)=>{ if(s==='booked' && !why.trim()){ FCT.ui.toast('Enter the journal reference or basis before booking an adjustment'); return; }
      M.setCaseStatus(id, s, note || why); FCT.applyEffects([{ event:'Case '+id+' ('+t.name.toLowerCase()+', '+c0.e+'): '+label, tower:'R2R' }]); FCT.save(); setNote(''); P.dirty = false; FCT.ui.toast('Case '+id+': '+label); FCT.onChange && FCT.onChange(); };
    const recs = c0.lines.map(x=> M.rec(x)).filter(Boolean), cs = M.caseStages(c0), age = Math.max(0, Math.floor(M.SNAP - c0.opened));
    const isEnt = !!M.E[c0.e], pv = isEnt? M.entity(c0.e) : null;
    const others = M.X.cases.filter(x=> x.e===c0.e && x.id!==id).map(x=> Object.assign({}, x, { stNow:M.caseStatus(x) }));
    const sameType = M.X.cases.filter(x=> x.type===c0.type && x.id!==id && M.statusMeasure(M.caseStatus(x))==='potential');
    const ev = []; const seen = {}; recs.forEach(r=> M.evidence(r).forEach(e=>{ const k = e[0]+e[1]; if(!seen[k]){ seen[k] = 1; ev.push(e); } }));
    if(ex) ev.unshift(['Drawer evidence', ex.id+' · '+(ex.trigger||ex.subject||''), FCT.towerName(ex.tower)+' tower']);
    const prim = recs.find(r=> r.kind!=='acct') || recs[0];
    const kinds = {}; recs.forEach(r=>{ (kinds[r.kind] = kinds[r.kind] || []).push(r); });
    const fs = [['At stake', t.basis==='fin'? (c0.est==null? 'Not quantified' : amt(c0.est)) : amt(c0.affected), t.basis==='fin'? (meas==='booked'? 'Booked as an adjustment' : meas==='proposed'? 'Proposed adjustment' : 'Estimate, not a booked adjustment') : 'Value affected; no adjustment expected'],
      ['Confidence', pct(c0.conf*100,0), M.statusName(st)], ['Open for', age+' days', 'Opened '+M.date(c0.opened)], ['Records', FCT.n(recs.length), Object.keys(kinds).map(k=> kinds[k].length+' '+KIND_T[k].toLowerCase()).join(', ') || 'none linked'],
      ['Close', M.mon(c0.m), c0.m<5? 'Earlier close' : 'Close in flight'], ['Counts in', meas==='potential'? (t.basis==='fin'? 'Potential Adjustments' : 'Control value') : meas==='proposed'? 'Adjustments proposed' : meas==='booked'? 'Adjustments booked' : 'Closed', 'Raised at '+M.stage(cs.primary).name]];
    return html`<div class="px-case">
      <section class=${'px-case-h '+P.kc('adj')}><span class="ic"><${Icon} n=${TICON[c0.type]||'Crosshair'} size=${22} strokeWidth=${1.6}/></span>
        <div class="tt"><div class="k">Case ${id}${c0.ex? ' · '+c0.ex : ''}</div><h2>${t.name}</h2><div class="m"><span class=${'px-cst s-'+st}>${M.statusName(st)}</span><span class="px-pill">${M.stage(cs.primary).name}</span><span class="px-pill">${t.basis==='fin'? 'Financial' : 'Control'}</span>${isEnt? html`<button type="button" class="px-link sm" onClick=${()=> onEntity(c0.e)}>${ename(c0.e)}</button>` : html`<span class="px-pill">Group-wide</span>`}</div></div>
        <dl class="px-case-f">${fs.map(([l,val,s])=> html`<div key=${l}><dt>${l}</dt><dd>${val}</dd><small>${s}</small></div>`)}</dl></section>
      ${(()=>{ const rec = CASE_REC[c0.type] || ['Review and record the outcome.', 'inv', 'under review', 'Review', 'AR'], owner = ex? userName(ex.owner) : userName(rec[4]);
        return html`<${DecPanel} need=${meas==='potential'} decided=${ex && !FCT.isOpen(ex)} owner=${owner} due=${ex? ex.due : dueOf(age)} rec=${ex && ex.ai? ex.ai.text : rec[0]}
          stake=${t.basis==='fin'? (c0.est==null? 'Not quantified yet' : amt(c0.est)+' potential adjustment') : amt(c0.affected||0)+' affected by a control breach'} conf=${pct((c0.conf||0)*100,0)} raised=${M.stage(cs.primary).name} exId=${ex && c0.ex} status=${M.statusName(st)}
          actions=${[{ label:rec[3], primary:true, onClick:()=> set(rec[1], rec[2]) }, { label:'Assign to '+owner.split(' ')[0], disabled:st==='inv', onClick:()=> set('inv', 'assigned for review to '+owner) }, { label:'Close: no issue', onClick:()=> set('nil', 'closed, no issue') }]}/>`; })()}
      <${AI}>${caseSum(c0, recs, ex)}</${AI}>
      <div class="px-calc"><b>Method.</b> ${t.method}.${c0.note? html` <b>Note.</b> ${c0.note}.` : ''}${Object.keys(cs.stages).length>1 && html` <b>Stages touched.</b> ${Object.keys(cs.stages).map(k=> M.stage(k).name).join(', ')}.`}</div>
      <div class="px-case-g"><div class="px-col">
        <${P.Card} title="What happened" className="px-case-w">
          ${ex && ex.evidence && ex.evidence.table && html`<table class="px-mini"><thead><tr>${ex.evidence.table.cols.map((c,i)=> html`<th key=${i} class=${(ex.evidence.table.right||[]).includes(i)? 'r' : ''}>${c}</th>`)}</tr></thead><tbody>
            ${ex.evidence.table.rows.map((r,i)=> html`<tr key=${i}>${r.map((v,j)=> html`<td key=${j} class=${(ex.evidence.table.right||[]).includes(j)? 'r num' : ''}>${v}</td>`)}</tr>`)}</tbody>
            ${ex.evidence.table.foot && html`<tfoot><tr>${ex.evidence.table.foot.map((v,j)=> html`<td key=${j} class=${(ex.evidence.table.right||[]).includes(j)? 'r num' : ''}><b>${v}</b></td>`)}</tr></tfoot>`}</table>`}
          ${Object.keys(kinds).map(k=> html`<${P.Table} key=${k} cols=${P.rcols('case', k)} rows=${asFacts(kinds[k])} rowKey=${(x)=> x.rec.id} caption=${KIND_T[k]} rowClick=${true} dense=${true} onOpen=${(x)=> onDoc(x.rec.id)} limit=${8}/>`)}
          ${!recs.length && !(ex && ex.evidence) && html`<p class="px-p faint">No ledger record is linked; this case comes from ${ex? 'the '+FCT.towerName(ex.tower)+' tower' : 'a judgement register'}.</p>`}</${P.Card}>
        <${P.Card} title=${prim? 'Process chain: '+N.doc(prim.id).label : 'Process chain'}>${prim && M.chain(prim.id)? html`<${P.Chain} ch=${M.chain(prim.id)}/>` : html`<p class="px-p faint">No transaction record is linked.</p>`}</${P.Card}></div>
        <div class="px-col">${isEnt? html`<${P.Card} title="Entity" className="px-case-v" right=${html`<button type="button" class="btn sm" onClick=${()=> onEntity(c0.e)}>Entity Profile</button>`}>
          <div class="px-case-vh"><b>${ename(c0.e)}</b><span class="faint">${[pv.e.type, pv.e.seg!==pv.e.type? pv.e.seg : null, pv.e.region].filter(Boolean).join(' · ')}</span>
            <div class="m"><${P.RiskTag} cat=${pv.rk.cat} score=${pv.rk.score} small=${true}/><span class="px-tag">Forecast ${M.wdl(pv.rk.fc)}</span></div></div>
          <div class="px-case-rf">${pv.rk.factors.slice().sort((a,b)=> b.v-a.v).slice(0,3).map(x=> html`<div key=${x.id} title=${x.why}><span>${x.name}</span><span class="trk"><i style=${{ width:x.v+'%', background: x.v>=80? COL.crit : x.v>=60? COL.high : x.v>=40? 'var(--px-medium)' : COL.light }}/></span><b class="num">${x.v}</b></div>`)}</div>
          <div class="px-kv"><div><span>Tasks done</span><b>${pv.done} / ${pv.ts.length}</b></div><div><span>Unexplained</span><b>${amt(pv.unrec)}</b></div><div><span>Journals waiting</span><b>${pv.pend.length}</b></div><div><span>Other cases</span><b>${others.length} (${others.filter(x=> M.statusMeasure(x.stNow)==='potential').length} open)</b></div></div></${P.Card}>`
          : html`<${P.Card} title="Scope"><p class="px-p">Group-wide case: it spans several entities and is shown only when no entity, region or class filter is set.</p></${P.Card}>`}
          <${P.Card} title="Related exceptions">
            ${ex && html`<div class="px-ex"><span>${ex.tower==='R2R'? 'Shared decision: ' : FCT.towerName(ex.tower)+' tower: '}<b>${ex.id}</b> ${ex.title}</span><${P.Decide} id=${ex.id}/></div>`}
            ${others.length? others.filter(x=> M.statusMeasure(x.stNow)==='potential').concat(others.filter(x=> M.statusMeasure(x.stNow)!=='potential')).slice(0,5).map(x=> html`<button key=${x.id} type="button" class="px-vrow" onClick=${()=> onCase && onCase(x.id)}><span>${x.id} · ${M.CT[x.type].name}</span><span class="num">${x.est!=null? amt(x.est) : x.affected!=null? amt(x.affected) : 'n.q.'} · ${M.statusName(x.stNow)}</span></button>`)
              : html`<p class="px-p faint">No other cases for this entity.</p>`}
            <p class="px-p faint">${FCT.n(sameType.length)} other open ${t.name.toLowerCase()} cases across the group, ${amt(M.sum(sameType, x=> x.est!=null? x.est : x.affected||0))}.</p></${P.Card}>
          <${P.Card} title="Evidence"><ul class="px-ev">${ev.slice(0,8).map(([tt,ref,sys],i)=> html`<li key=${i}><${Icon} n="FileText" size=${14}/><span><b>${tt}</b> ${ref}<small> · ${sys}</small></span><button type="button" class="px-link sm" onClick=${()=> FCT.ui.toast(tt+' requested from '+sys+' (simulated)')}>View</button></li>`)}
            ${!ev.length && html`<li class="faint">No source documents linked.</li>`}</ul></${P.Card}></div></div>
      <${P.Card} title="Investigate" className="px-case-act">
        ${!c0.ex? html`<div class="px-acts">
          <button type="button" class="btn sm" disabled=${st==='inv'} onClick=${()=> set('inv','assigned for review to Arjun Rao')}>Assign reviewer</button>
          <button type="button" class="btn sm" disabled=${st==='proposed'} onClick=${()=> set('proposed','adjustment proposed to the entity controller')}>Propose adjustment</button>
          <button type="button" class="btn sm primary" disabled=${st==='booked'} onClick=${()=> set('booked','adjustment booked: '+why)}>Book adjustment</button>
          <button type="button" class="btn sm" disabled=${st==='nil'} onClick=${()=> set('nil','closed, no issue')}>Close: no issue</button>
          <button type="button" class="btn sm" disabled=${st==='waived'} onClick=${()=> set('waived','waived below materiality')}>Waive: below materiality</button>
          ${st!==c0.st && html`<button type="button" class="px-link sm" onClick=${()=> set(c0.st,'reopened')}>Reopen</button>`}</div>
          <div class="px-grid g-2"><label class="field"><span>Journal reference or basis (required to book)</span><input value=${why} onInput=${(e)=>setWhy(e.target.value)} placeholder="e.g. JE-IN05-1005-0012 posted; reviewed by the entity controller"/></label>
          <label class="field"><span>Investigation note</span><textarea value=${note} onInput=${(e)=>setNote(e.target.value)} placeholder="Unsaved notes are confirmed before you switch KPI"/></label></div>`
        : html`<div class="px-ex"><span>This case is decided through the shared decision drawer (<b>${c0.ex}</b>) so the decision, gate and audit trail stay in one place. Its status here follows that decision.</span><${P.Decide} id=${c0.ex}/></div>`}</${P.Card}></div>`;
  };

  /* entity marker: the entity in focus and the way into its full profile */
  P.EntityMarker = ({ id, onOpen, onClear, isProfile })=>{
    if(!id || !M.E[id]) return null; const e = M.E[id], r = M.risk(id);
    return html`<div class="px-vmark" role="status" aria-label=${'Current entity '+e.name}><span class="av" aria-hidden="true">${id.replace('-','').slice(0,4)}</span>
      <span class="nm"><b>${ename(id)}</b><small>${e.seg!==e.type? e.type+' · '+e.seg : e.type}</small></span><${P.RiskTag} cat=${r.cat} score=${r.score} small=${true}/>
      ${!isProfile && onOpen && html`<button type="button" class="btn sm" onClick=${onOpen}>Open Entity Profile</button>`}${onClear && html`<button type="button" class="px-link sm" onClick=${onClear}>Clear entity</button>`}</div>`;
  };

  /* ---------- KPI detail router (in place, under the global breadcrumb) ---------- */
  P.RInvestigate = ({ nav, dispatch, f, setF })=>{
    const top = M.nav.top(nav), ctx = P.rctx(nav, f), k = ctx.comp && top.t==='group' && top.dim==='component' && M.KPI[ctx.comp.key]? M.KPI[ctx.comp.key] : M.KPI[nav.kpi], ent = M.nav.entity(nav, f);
    const goDoc = (id)=> dispatch({ t:'drill', node:N.doc(id) }), goCase = (id)=> dispatch({ t:'drill', node:N.case(id) }), goE = (id)=> dispatch({ t:'drill', node:N.entity(id) });
    let body;
    if(top.t==='root'){ const V = roots[nav.kpi], stg = top.stage || null, setStage = (x)=> dispatch({ t:'node', v:{ stage: x===stg? null : x } });
      body = V? html`<${V} f=${f} nav=${nav} dispatch=${dispatch} facts=${ctx.facts}/>${nav.kpi!=='health' && !M.isRate(nav.kpi) && !['progress','jpend','unrec','adj'].includes(nav.kpi) && html`<${P.RChain} f=${f} kinds=${KINDS[nav.kpi]} stg=${stg} setStage=${setStage} list=${true}/>`}` : html`<${P.Empty}/>`; }
    else if(top.t==='group') body = html`<${GroupView} f=${f} nav=${nav} dispatch=${dispatch} cx=${ctx}/>`;
    else if(top.t==='entity') body = html`<${EntityInKpi} f=${f} nav=${nav} dispatch=${dispatch} cx=${ctx}/>`;
    else if(top.t==='eprofile') body = html`<${P.EntityProfile} id=${top.id} f=${f} ctx=${{ kpi:ctx.eff==='health'? null : ctx.eff, f, groups:ctx.groups }} onDoc=${goDoc} onCase=${goCase}/>`;
    else if(top.t==='doc') body = html`<${P.RDocView} id=${top.id} onEntity=${goE} onCase=${goCase} onDoc=${goDoc}/>`;
    else if(top.t==='case') body = html`<${P.RCaseView} id=${top.id} onDoc=${goDoc} onEntity=${goE} onCase=${goCase}/>`;
    const p = M.period(f.period), act = M.active(f);
    return html`<section class=${'px-panel px-detail '+P.kc(nav.kpi)} aria-labelledby="px-ph">
      <header class="px-ph"><div class="px-pt"><div class="px-pt-t"><h1 id="px-ph"><span class="px-h-i"><${Icon} n=${P.KICON[nav.kpi]} size=${20} strokeWidth=${1.6}/></span>${k.name}${P.VOCAB[nav.kpi] && html`<small style=${{ fontWeight:400, fontSize:'0.6em', marginLeft:10, opacity:.75 }}>${P.VOCAB[nav.kpi].measure}</small>`}</h1><p>${k.q}</p></div>
        <div class="px-pm"><span class="px-tag">${k.time==='Snapshot'? 'Snapshot '+C.snapLabel : p.label}</span>${act.length>0 && html`<span class="faint">${act.length} filter${act.length>1?'s':''}</span>`}<${P.KpiDef} id=${nav.kpi}/></div></div>
        <${P.EntityMarker} id=${ent} isProfile=${top.t==='eprofile'} onOpen=${()=> dispatch({ t:'drill', node:N.profile(ent) })} onClear=${f.entity===ent? ()=> setF(Object.assign({}, f, { entity:'All' })) : null}/></header>
      <${P.PanelBody} depth=${nav.path.length} sig=${nav.kpi+':'+nav.path.length+':'+top.t+':'+(top.id||top.key||'')} reset=${M.fkey(f)+nav.path.length}>${body}</${P.PanelBody}></section>`;
  };
})();

/* every record view opens with the action bar (assets/js/shared/act.js): status, AI recommendation, owner, Resolve */
(function(){
  const P = window.R2R, M = window.R2RM; if(!P || !P.RDocView || !window.FCTAct) return;
  const { html, h } = P, N = P.rnode, Body = P.RDocView;
  const ACT = P.ACT = FCTAct.make(P, { tower:'r2r', towerName:'R2R', issue:(c)=> M.issue(c) });
  P.RDocView = (pr)=>{ const r = M.rec(pr.id); if(!r) return h(Body, pr); const ch = M.chain(pr.id), e = r.kind==='ic'? r.a : r.e, cases = M.X.cases.filter(c=> c.lines.includes(pr.id));
    let label = pr.id; try{ label = N.doc(pr.id).label; }catch(e2){}
    return html`<div class="px-docwrap"><${ACT.ActionBar} key=${pr.id} id=${pr.id} codes=${ch? ch.iss : []} label=${label} ent=${e+' '+((M.E[e]||{}).name||'')} val=${M.recVal? M.recVal(r, (ch && ch.iss[0])||'') : r.val} ex=${r.ex}
      cases=${cases.map(c=> ({ id:c.id, name:(M.CT[c.type]||{}).name || c.type }))} onCase=${pr.onCase} ctx=${pr.act} theme=${pr.theme}/>${h(Body, pr)}</div>`; };
})();
