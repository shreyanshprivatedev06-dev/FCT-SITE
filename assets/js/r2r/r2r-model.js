/* FCT demo — R2R control tower v2: calculation engine (pure; no DOM). Exposes window.R2RM (and window.TOWERM so the shared
   P2P components in assets/js/p2p/p2p-ui.js read this engine). Every tile, chart, table and entity profile on the R2R screens reads from here,
   so values reconcile by construction. Formulas and denominators: data/r2r/MODEL.md. Tests: node tools/r2r/test-model.js */
(function(){
  const D = window.FCT_DATA, X = D.r2rx, C = X.config, FCT = window.FCT || {};
  const SNAP = C.snap, MS = C.mStart, TW = C.todayWD;
  const M = window.R2RM = window.TOWERM = { C, X, SNAP };
  const E = {}; X.ents.forEach(e=> E[e.id] = e);
  const A = {}; C.accts.forEach(a=> A[a.id] = a);
  const KPI = {}; C.kpis.forEach(k=> KPI[k.id] = k);
  const CT = {}; C.caseTypes.forEach(t=> CT[t.id] = t);
  M.E = E; M.V = E; M.A = A; M.KPI = KPI; M.CT = CT;
  const IDX = {}; [X.tasks, X.recs, X.jes, X.ic, X.vars, X.unmapped, X.cases].forEach(a=> a.forEach(r=> IDX[r.id] = r));
  M.rec = (id)=> IDX[id] || null;
  M.case = (id)=> X.cases.find(c=> c.id===id) || null;
  const sum = (a, f)=> a.reduce((s,x)=> s + (f? f(x) : x), 0);
  const clamp = (x,a=0,b=100)=> Math.max(a, Math.min(b, x));
  M.sum = sum;

  /* ---------- time ---------- */
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const toDate = (d)=> new Date(Date.UTC(2026,3,1) + Math.floor(d)*864e5);
  M.date = (d)=>{ if(d==null) return '—'; const x = toDate(d); return String(x.getUTCDate()).padStart(2,'0')+'-'+MON[x.getUTCMonth()]+'-'+String(x.getUTCFullYear()).slice(2); };
  M.dt = (d)=>{ if(d==null) return '—'; const x = toDate(d), mins = Math.round((d-Math.floor(d))*1440); return String(x.getUTCDate()).padStart(2,'0')+'-'+MON[x.getUTCMonth()]+' '+String(Math.floor(mins/60)%24).padStart(2,'0')+':'+String(mins%60).padStart(2,'0'); };
  M.dur = (days)=> days==null? '—' : days < 2? FCT.n(days*24,0)+' h' : FCT.n(days,1)+' days';
  M.wdl = (k)=> k==null? '—' : k===0? 'WD0' : (k>0? 'WD+' : 'WD−')+Math.abs(k);
  M.wdDate = (m, k)=> M.date(X.wd(m, k));
  M.period = (id)=> C.periods.find(p=>p.id===id) || C.periods[0];
  M.inPeriod = (m, p)=> p.months.indexOf(m) >= 0;
  M.mon = (m)=> C.months[m];

  /* ---------- live state: drawer decisions, case status overrides, flags ---------- */
  const flag = (k)=> !!(FCT.flag && FCT.flag(k));
  const exDone = (id)=>{ if(!id || !FCT.ex) return false; const x = FCT.ex(id); return !!x && !FCT.isOpen(x); };
  M.exDone = exDone;
  M.ver = ()=> (FCT.state? (FCT.state.seq + ':' + JSON.stringify((FCT.state.notes||{}).r2rCase||{}) + ':' + JSON.stringify(FCT.state.flags||{})) : '0');
  const onResolve = { accrDup:'booked', accrMiss:'booked', cutoff:'booked', provision:'booked', suspense:'booked', period:'booked', mapping:'nil', icBreak:'proposed', anomJe:'inv' };
  M.caseStatus = (c)=>{
    const ov = FCT.state && FCT.state.notes && FCT.state.notes.r2rCase && FCT.state.notes.r2rCase[c.id];
    if(ov) return ov.st;
    if(c.ex && exDone(c.ex) && onResolve[c.type]) return onResolve[c.type];
    return c.st;
  };
  M.setCaseStatus = (id, st, note)=>{ const n = FCT.state.notes; n.r2rCase = n.r2rCase || {}; n.r2rCase[id] = { st, note:note||'', t:FCT.nowLabel? FCT.nowLabel() : '' }; FCT.save && FCT.save(); _cache = {}; };
  M.statusMeasure = (st)=> (C.caseStatus.find(s=>s.id===st)||{}).measure;
  M.statusName = (st)=> (C.caseStatus.find(s=>s.id===st)||{}).name || st;
  /* tasks, journals and mapping move with the drawer: RTR-CLS-01 clears IN-07's slipped tasks and posts its accruals; RTR-JNL-08 approves the 58 low-risk journals */
  M.taskDone = (t)=> t.doneWD!=null || (t.fixable && (flag('in07.fixed') || exDone('RTR-CLS-01')));
  M.taskDoneWD = (t)=> t.doneWD!=null? t.doneWD : M.taskDone(t)? TW : null;
  M.jSt = (j)=>{ if(j.st==='Pending' && !j.review && exDone('RTR-JNL-08')) return 'Posted'; if(j.in07 && (flag('in07.jes') || exDone('RTR-CLS-01'))) return 'Posted'; return j.st; };
  M.mapped = (u)=> !!(u.ex && exDone(u.ex));

  /* ---------- issues ---------- */
  const TK = { sub:'tkSub', jnl:'tkJnl', rec:'tkRec', rev:'tkRev', cls:'tkCls', rpt:'tkRpt' };
  const JF = { noSupp:'jeNoSupp', late:'jeLate', sod:'jeSod', anom:'jeAnom', corr:'jeCorr', perPost:'perPost' };
  M.behind = (t)=>{ const d = M.taskDoneWD(t); return d!=null? d > t.dueWD : (t.m<5 || t.dueWD<=TW); };
  M.agreed = (x)=> x.st==='Agreed' || x.st==='Agreed (FX rounding)';
  M.recOnTime = (r)=> r.certWD!=null && r.certWD<=r.dueWD;
  M.recDue = (r)=> r.m<5 || r.dueWD<=TW;
  M.varSigned2 = (v)=> v.signedWD!=null && v.signedWD<=TW;
  M.issuesOf = (r)=>{ const out = [];
    switch(r.kind){
      case 'task': if(M.behind(r)) out.push(TK[r.stage]); if(/feed|Rate table/i.test(r.st) && !M.taskDone(r)) out.push('feed'); break;
      case 'je': r.fl.forEach(f=> out.push(JF[f])); if(M.jSt(r)==='Pending' && r.sub!=null && SNAP - r.sub > 1) out.push('jePend'); break;
      case 'rec': if(r.st==='Break') out.push('recBreak'); else if(r.diff>0) out.push('recDiff'); if(r.items[2]+r.items[3]>0) out.push('recAged');
        if(r.certWD!=null && r.certWD>r.dueWD) out.push('recLate'); if(r.certWD==null && M.recDue(r)) out.push('recDue'); if(r.prep===r.rev) out.push('selfRev'); break;
      case 'ic': if(!M.agreed(r)) out.push('icUnm'); if(r.st==='Not confirmed') out.push('icConf'); break;
      case 'var': if(!M.varSigned2(r)) out.push('varNoComm'); break;
      case 'acct': if(!M.mapped(r)){ out.push('unmapped'); if(r.ex) out.push('tieOut'); } break;
    }
    return out; };
  M.issue = (k)=> C.issues[k] || { stage:'jnl', name:k, kind:'ops' };
  M.stage = (id)=> C.stages.find(s=>s.id===id);
  M.recVal = (r, code)=> r.kind==='je'? r.val : r.kind==='rec'? (/recBreak|recDiff/.test(code||'')? Math.abs(r.diff) : Math.abs(r.gl)) : r.kind==='ic'? (code==='icUnm'? r.diff : r.val) : r.kind==='var'? Math.abs(r.v) : r.kind==='acct'? r.bal : 0;

  /* ---------- filters ---------- */
  M.defaults = { period:'Sep-26', entity:'All', region:'All', seg:'All', risk:'All', crisk:'All' };
  M.fkey = (f)=> [f.period,f.entity,f.region,f.seg,f.risk,f.crisk].join('|');
  M.dimKey = (f)=> [f.entity,f.region,f.seg,f.risk,f.crisk].join('|');
  M.active = (f)=> Object.keys(M.defaults).filter(k=> k!=='period' && f[k] && f[k]!=='All');
  /* an account-risk filter keeps only records that carry an account; records of 'Group' scope pass only with no entity, region or segment filter */
  const recOk = (f, e, acct)=>{
    if(e==='Group') return f.entity==='All' && f.region==='All' && f.seg==='All' && f.risk==='All' && (f.crisk||'All')==='All';
    const x = E[e]; if(!x) return false;
    return (f.entity==='All' || e===f.entity) && (f.region==='All' || x.region===f.region) && (f.seg==='All' || x.seg===f.seg) && (f.risk==='All' || (acct && A[acct] && A[acct].risk===f.risk)) && (!f.crisk || f.crisk==='All' || f.crisk.split(',').includes(M.risk(e).cat));
  };
  M.recOk = recOk;

  let _cache = {};
  const cache = (k, fn)=>{ const kk = M.ver()+'#'+k; if(!(kk in _cache)){ if(Object.keys(_cache).length>400) _cache = {}; _cache[kk] = fn(); } return _cache[kk]; };
  M.clearCache = ()=>{ _cache = {}; };
  const acctOf = (r)=> r.kind==='ic'? '1360' : r.acct;
  M.set = (kind, f)=> cache('set|'+kind+'|'+M.dimKey(f), ()=>{
    const src = { task:X.tasks, rec:X.recs, je:X.jes, ic:X.ic, var:X.vars, acct:X.unmapped, case:X.cases }[kind];
    /* a reconciliation carries its own risk class (named ones from data/r2r.js); other records take the class of their account */
    if(kind==='rec') return src.filter(r=> recOk(Object.assign({}, f, { risk:'All' }), r.e, r.acct) && (f.risk==='All' || r.risk===f.risk));
    return src.filter(r=> kind==='ic'? recOk(f, r.a, '1360') || recOk(f, r.b, '2260') : recOk(f, r.e, kind==='task' || kind==='var' || kind==='case'? (f.risk==='All'? 'x' : null) : acctOf(r)));
  });
  M.ents = (f)=> X.ents.filter(e=> recOk(f, e.id, f.risk==='All'? 'x' : null));

  /* ---------- facts per KPI: the records behind each number, with their dimension keys. ok = true/false for rates ---------- */
  M.dimName = { grp:'Close activity', entity:'Entity', owner:'Task owner', lag:'How late', status:'Status', risk:'Account risk class', acct:'Account', age:'Waiting', src:'Journal source', cat:'Journal type', month:'Close',
    flag:'Control failure', pair:'Entity pair', line:'P&L line', type:'Type', stage:'Close stage', erisk:'Close risk', seg:'Entity class', region:'Region', component:'Component', issue:'Issue' };
  M.dims = { progress:['grp','entity','status','owner'], jpend:['age','risk','entity','src'], unrec:['acct','entity','status','risk'], adj:['type','status','stage','entity'],
    entmix:['erisk','seg','region'], jmix:['src','entity','cat','month'], topacc:['acct'], tasks:['grp','entity','owner','lag'], recs:['risk','acct','entity','status'],
    jnl:['flag','entity','src','cat'], ic:['pair','status','entity'], var:['status','entity','line'], mapq:['entity'], health:['component'] };
  const SRC = {}; C.srcs.forEach(s=> SRC[s.id] = s.name);
  const JCAT = {}; C.jcats.forEach(c=> JCAT[c[0]] = c[1]);
  M.srcName = (s)=> SRC[s] || s; M.catName = (c)=> JCAT[c] || c;
  /* close-task groups: the data keys are short ('Recs', 'Revenue', 'IC', 'Pack'); these are the names shown, with what each group actually contains */
  const GRPN = { 'Sub-ledger':['Sub-ledger lock','Locking the accounts-payable, accounts-receivable, inventory and fixed-asset sub-ledgers and checking the payroll interface'],
    'Accruals':['Expense accruals','Accruing expenses incurred but not yet invoiced: freight, utilities, professional fees, bonus, royalty, contract labour'],
    'Journals':['Period-end journals','Depreciation run, prepaid amortisation, recurring journals, reclassifications and foreign-exchange revaluation'],
    'Revenue':['Revenue cut-off','Checking revenue sits in the right month: cut-off review, unbilled revenue, sales-returns provision, rebate accrual'],
    'Recs':['Balance-sheet reconciliations','Preparing reconciliations of bank, receivables, payables, goods-received-not-invoiced, inventory and tax balances to their support'],
    'Certify':['Reconciliation sign-off','Reviewer certification of high- and medium-risk reconciliations, and the controller sign-off'],
    'IC':['Intercompany confirmations','Sending intercompany confirmations, agreeing balances with counterparties and posting recharges'],
    'Pack':['Reporting pack','Locking the trial balance, drafting the management pack, variance commentary and the disclosure checklist'] };
  M.grpName = (g)=> (GRPN[g]||[g])[0];
  M.grpDesc = (g)=> (GRPN[g]||[g,g])[1];
  M.dimLabel = (dim, k)=> dim==='entity'? k+' '+((E[k]||{}).name||'') : dim==='acct'? k+' '+((A[k]||{}).name||'') : dim==='component'? (KPI[k]||{}).name : dim==='stage'? (M.stage(k)||{}).name : dim==='type'? (CT[k]||{}).name || k : dim==='issue'? M.issue(k).name : dim==='grp'? M.grpName(k) : k;
  const lag = (t)=>{ const d = M.taskDoneWD(t); return d==null? 'Not done' : d<=t.dueWD? 'On time' : d-t.dueWD===1? '1 day late' : '2+ days late'; };
  const waitB = (j)=>{ const w = SNAP - j.sub; return w<1? 'Under 1 day' : w<=2? '1–2 days' : 'Over 2 days'; };
  const flagName = (j)=> j.fl.length? M.issue(JF[j.fl[0]]).name : 'No exception';
  M.cases = (f)=> cache('cs|'+M.dimKey(f), ()=> M.set('case', f).map(c=> Object.assign({}, c, { stNow:M.caseStatus(c) })));
  M.facts = (id, f)=> cache('f|'+id+'|'+M.fkey(f), ()=>{
    const p = M.period(f.period), inP = (m)=> M.inPeriod(m, p);
    const F = (r, val, ok, g)=> ({ rec:r, kind:r.kind, e:r.e, val, ok, g:Object.assign({ entity:r.e }, g) });
    switch(id){
      case 'progress': return M.set('task', f).filter(t=> t.m===5).map(t=> F(t, 1, M.taskDone(t), { grp:t.grp, owner:t.owner, status: M.taskDone(t)? 'Done' : t.dueWD<=TW? 'Behind plan' : 'Not yet due' }));
      case 'jpend': return M.set('je', f).filter(j=> M.jSt(j)==='Pending').map(j=> F(j, j.val, null, { age:waitB(j), risk:j.risk, src:M.srcName(j.src) }));
      case 'unrec': return M.set('rec', f).filter(r=> r.m===5 && r.st!=='Certified' && Math.abs(r.diff)>0).map(r=> F(r, Math.abs(r.diff), null, { acct:r.acct, status:r.st, risk:r.risk }));
      case 'adj': return M.cases(f).filter(c=> CT[c.type].basis==='fin' && M.statusMeasure(c.stNow)==='potential').map(c=> ({ rec:c, kind:'case', e:c.e, val:c.est||0, g:{ type:c.type, status:M.statusName(c.stNow), stage:CT[c.type].stage, entity:c.e } }));
      case 'entmix': return M.ents(f).map(e=> ({ rec:e, kind:'entity', e:e.id, val:1, g:{ erisk:M.risk(e.id).cat, seg:e.seg, region:e.region, entity:e.id } }));
      case 'jmix': return M.set('je', f).filter(j=> M.jSt(j)==='Posted' && inP(j.m)).map(j=> F(j, 1, null, { src:M.srcName(j.src), cat:M.catName(j.cat), month:C.months[j.m] }));
      case 'topacc': return M.set('je', f).filter(j=> M.jSt(j)==='Posted' && inP(j.m) && (j.src==='man'||j.src==='ai')).map(j=> F(j, j.val, null, { acct:j.acct }));
      case 'tasks': return M.set('task', f).filter(t=> inP(t.m) && (t.m<5 || t.dueWD<=TW)).map(t=> F(t, 1, !M.behind(t), { grp:t.grp, owner:t.owner, lag:lag(t) }));
      case 'recs': return M.set('rec', f).filter(r=> inP(r.m) && M.recDue(r)).map(r=> F(r, Math.abs(r.gl), M.recOnTime(r), { risk:r.risk, acct:r.acct, status: M.recOnTime(r)? 'Certified on time' : r.certWD!=null? 'Certified late' : 'Not certified' }));
      case 'jnl': return M.set('je', f).filter(j=> inP(j.m) && M.jSt(j)==='Posted' && j.post!=null && (j.src==='man'||j.src==='ai')).map(j=> F(j, j.val, !j.fl.length, { flag:flagName(j), src:M.srcName(j.src), cat:M.catName(j.cat) }));
      case 'ic': return M.set('ic', f).filter(x=> inP(x.m)).map(x=> ({ rec:x, kind:'ic', e:x.a, val:x.val, ok:M.agreed(x), g:{ pair:x.pair, status:x.st, entity:x.a } }));
      case 'var': return M.set('var', f).filter(v=> inP(v.m)).map(v=> F(v, Math.abs(v.v), M.varSigned2(v), { status: M.varSigned2(v)? 'Signed by WD+2' : v.m<5? 'Signed after WD+2' : v.st, line:v.line }));
      case 'mapq': { const out = []; M.ents(f).forEach(e=>{ const um = X.unmapped.filter(u=> u.e===e.id);
          um.forEach(u=> out.push(F(u, u.bal, M.mapped(u), {}))); for(let i=um.length;i<e.local;i++) out.push({ rec:{ id:e.id+'-L'+i, kind:'acct', e:e.id, mappedStd:true }, kind:'acct', e:e.id, val:0, ok:true, g:{ entity:e.id } }); });
        return f.risk==='All'? out : []; }
    }
    return [];
  });
  M.isRate = (id)=> ['tasks','recs','jnl','ic','var','mapq'].includes(id);
  /* generic grouping: rows {key, label, n, val, ok, bad, badVal, rate, ne} */
  M.group = (facts, keyFn, opt={})=>{
    const g = {};
    facts.forEach(x=>{ const k = keyFn(x); if(k==null) return; const r = g[k] = g[k] || { key:k, n:0, val:0, ok:0, bad:0, badVal:0, es:new Set() };
      r.n++; r.val += x.val||0; if(x.ok===true) r.ok++; if(x.ok===false){ r.bad++; r.badVal += x.val||0; } if(x.e) r.es.add(x.e); });
    const rows = Object.values(g).map(r=> Object.assign(r, { rate: r.ok+r.bad? r.ok/(r.ok+r.bad)*100 : null, ne:r.es.size, label: opt.label? opt.label(r.key) : r.key }));
    rows.forEach(r=> delete r.es);
    return rows.sort(opt.sort || ((a,b)=> (opt.rate? b.bad-a.bad : b.val-a.val)));
  };

  /* ---------- KPI values ---------- */
  const rateOf = (fs)=> fs.length? fs.filter(x=> x.ok).length/fs.length*100 : null;
  const monthFacts = (id, f, m)=> M.facts(id, Object.assign({}, f, { period:C.periods.find(p=> p.months.length===1 && p.months[0]===m).id }));
  M.series = (id, f)=> C.months.map((x,m)=> id==='health'? M.healthAt(f, [m]).score : id==='jmix'? monthFacts('jmix', f, m).length || null : M.isRate(id)? rateOf(monthFacts(id, f, m)) : null);
  M.exposure = (cs)=>{
    const fin = cs.filter(c=> CT[c.type].basis==='fin'), ctl = cs.filter(c=> CT[c.type].basis==='ctl');
    const by = (m)=> fin.filter(c=> M.statusMeasure(c.stNow)===m), pot = by('potential');
    const ctlOpen = ctl.filter(c=> M.statusMeasure(c.stNow)==='potential');
    return { potential:sum(pot, c=>c.est||0), potN:pot.length, proposed:sum(by('proposed'), c=>c.est||0), propN:by('proposed').length, booked:sum(by('booked'), c=>c.est||0), bookN:by('booked').length,
      control:sum(ctlOpen, c=>c.affected||0), controlN:ctlOpen.length, noEst:pot.filter(c=>c.est==null).length, items:pot };
  };
  M.kpi = (id, f)=> cache('k|'+id+'|'+M.fkey(f), ()=>{
    const p = M.period(f.period), out = { id, def:KPI[id], time:KPI[id].time };
    const prior = p.prior? Object.assign({}, f, { period:p.prior }) : null;
    if(M.isRate(id) && id!=='mapq'){ const fs = M.facts(id, f); out.v = rateOf(fs); out.n = fs.length; out.bad = fs.filter(x=> x.ok===false).length; out.badVal = sum(fs.filter(x=> x.ok===false), x=>x.val);
      out.prior = prior? rateOf(M.facts(id, prior)) : null; out.series = M.series(id, f); }
    if(id==='mapq'){ const fs = M.facts('mapq', f); out.v = rateOf(fs); out.n = fs.length; out.bad = fs.filter(x=> x.ok===false).length; out.badVal = sum(fs.filter(x=> x.ok===false), x=>x.val); }
    if(id==='health'){ const h = M.health(f); out.v = h.score; out.prior = p.prior? M.healthAt(f, M.period(p.prior).months).score : null; out.series = M.series('health', f); out.h = h; }
    if(id==='progress'){ const fs = M.facts('progress', f); out.n = fs.length; out.done = fs.filter(x=> x.ok).length; out.v = fs.length? out.done/fs.length*100 : null;
      out.plan = fs.filter(x=> x.rec.dueWD<=TW).length; out.behind = fs.filter(x=> x.g.status==='Behind plan').length; out.planPct = fs.length? out.plan/fs.length*100 : null;
      out.forecast = FCT.v? FCT.v('close.forecastWD') : 5; out.readiness = FCT.v? FCT.v('close.readiness') : 84; }
    if(id==='jpend'){ const fs = M.facts('jpend', f); out.v = fs.length? sum(fs, x=>x.val) : null; out.n = fs.length; out.review = fs.filter(x=> x.rec.review).length;
      const dr = M.set('je', f).filter(j=> M.jSt(j)==='Draft'); out.drafts = dr.length; out.draftVal = sum(dr, j=>j.val); }
    if(id==='unrec'){ const fs = M.facts('unrec', f); out.v = sum(fs, x=>x.val); out.n = fs.length; const br = fs.filter(x=> x.rec.st==='Break'); out.breaks = br.length; out.breakVal = sum(br, x=>x.val);
      const sep = M.set('rec', f).filter(r=> r.m===5); out.total = sep.length; out.cert = sep.filter(r=> r.st==='Certified').length; }
    if(id==='adj'){ const e = M.exposure(M.cases(f)); out.v = e.potential; out.e = e; out.n = e.potN; out.pnl = FCT.pnlPending? FCT.pnlPending() : null; }
    if(id==='entmix'){ const es = M.ents(f); out.n = es.length; out.v = es.length || null; out.mix = C.risk.cats.map(c=> ({ id:c.id, n:es.filter(e=> M.risk(e.id).cat===c.id).length })); out.late = es.filter(e=> M.forecast(e.id) > C.targetWD).length; }
    if(id==='jmix'){ const fs = M.facts('jmix', f); out.v = fs.length || null; out.n = fs.length; out.manual = fs.filter(x=> x.rec.src==='man'||x.rec.src==='ai').length; out.ai = fs.filter(x=> x.rec.src==='ai').length;
      out.share = fs.length? out.manual/fs.length*100 : null; out.prior = prior? M.facts('jmix', prior).length : null; out.series = M.series('jmix', f); }
    if(id==='topacc'){ const t = M.topAccts(f); out.v = t.top5; out.top10 = t.top10; out.total = t.total; out.lead = t.rows[0]; out.n = t.rows.length; }
    return out;
  });
  M.status = (id, v)=>{ const k = KPI[id]; if(v==null) return 'na'; if(id==='health') return v>=75? 'good' : v>=55? 'watch' : 'off';
    if(k.target==null) return 'neutral'; return v>=k.target? 'good' : v>=k.warn? 'watch' : 'off'; };
  M.topAccts = (f)=> cache('ta|'+M.fkey(f), ()=>{
    const g = M.group(M.facts('topacc', f), (x)=> x.g.acct), tot = sum(g, r=>r.val);
    const rows = g.map((r,i)=> ({ acct:r.key, name:M.dimLabel('acct', r.key), val:r.val, n:r.n, share: tot? r.val/tot*100 : 0, rank:i+1 }));
    return { rows, total:tot, top5:sum(rows.slice(0,5), r=>r.share), top10:sum(rows.slice(0,10), r=>r.share) };
  });

  /* health: weighted normalised components; missing components are excluded and lower coverage. Mapping quality is a snapshot: earlier closes run on five components */
  M.healthAt = (f, months)=>{
    const isNow = months.join()===M.period(f.period).months.join();
    const per = C.periods.find(p=> p.months.join()===months.join()) || M.period(f.period), ff = Object.assign({}, f, { period:per.id });
    const comps = C.health.map(h=>{
      const v = h.kpi==='mapq'? (isNow? M.kpi('mapq', f).v : null) : rateOf(M.facts(h.kpi, ff));
      const sc = v==null? null : clamp((v-h.floor)/(h.target-h.floor)*100);
      return { kpi:h.kpi, name:KPI[h.kpi].name, w:h.w, floor:h.floor, target:h.target, v, sc };
    });
    const have = comps.filter(c=> c.sc!=null), wS = sum(have, c=>c.w);
    const score = wS? Math.round(sum(have, c=> c.w*c.sc)/wS) : null;
    comps.forEach(c=>{ c.contrib = c.sc==null? null : c.w*c.sc/wS; c.lost = c.sc==null? null : c.w*(100-c.sc)/wS; });
    return { score, coverage:wS/100, comps, band: score==null? null : C.healthBands.find(b=> score>=b.min) };
  };
  M.health = (f)=> M.healthAt(f, M.period(f.period).months);
  /* one health component for one entity class: record rate and how many of the class's entities have at least one exception */
  M.segComp = (kpi, f, seg)=> cache('sg|'+kpi+'|'+(seg||'')+'|'+M.fkey(f), ()=>{
    const fs = M.facts(kpi, f).filter(x=> !seg || (E[x.e]||{}).seg===seg), ok = fs.filter(x=> x.ok).length;
    const eAll = new Set(fs.map(x=> x.e)), eBad = new Set(fs.filter(x=> x.ok===false).map(x=> x.e));
    return { n:fs.length, bad:fs.length-ok, rate: fs.length? ok/fs.length*100 : null, eN:eAll.size, eBad:eBad.size, ePct: eAll.size? eBad.size/eAll.size*100 : null }; });
  M.segCount = (f, seg)=> M.ents(f).filter(e=> !seg || e.seg===seg).length;

  /* ---------- entity close risk (Sep close, live) ---------- */
  M.forecast = (id)=> id==='IN-07' && FCT.v? FCT.v('in07.forecastWD') : E[id].forecast;
  M.likelihood = (id)=> id==='IN-07' && FCT.v? FCT.v('in07.lik') : E[id].lik;
  M.risk = (id)=> cache('rk|'+id, ()=>{
    const e = E[id], ts = X.tasks.filter(t=> t.e===id && t.m===5), due = ts.filter(t=> t.dueWD<=TW), bh = due.filter(t=> !M.taskDone(t));
    const rs = X.recs.filter(r=> r.e===id && r.m===5), br = rs.filter(r=> r.st==='Break'), rdue = rs.filter(r=> r.dueWD<=TW), rnc = rdue.filter(r=> r.certWD==null);
    const js = X.jes.filter(j=> j.e===id && j.m===5), pend = js.filter(j=> M.jSt(j)==='Pending'), dr = js.filter(j=> M.jSt(j)==='Draft'), an = js.filter(j=> j.fl.includes('anom'));
    /* an IC item counts against the side that must act: the sender for an unconfirmed item, the receiver for a timing or FX difference */
    const ic = X.ic.filter(x=> x.m===5 && !M.agreed(x) && (x.st==='Not confirmed'? x.a===id : x.b===id)), icV = sum(ic, x=> x.diff), conf = ic.some(x=> x.st==='Not confirmed');
    const fixed = flag('in07.fixed') || exDone('RTR-CLS-01');
    const onLeave = D.users.filter(u=> u.availability && u.availability.status==='On leave' && ts.some(t=> t.owner===u.name && !M.taskDone(t)));
    const F = {}, why = {};
    F.tasks = Math.round(clamp(due.length? bh.length/due.length*250 : 0)); why.tasks = bh.length+' of '+due.length+' tasks due to date are behind plan';
    F.recs = Math.round(clamp(br.length*22 + (rdue.length? rnc.length/rdue.length*150 : 0))); why.recs = br.length+' break'+(br.length===1?'':'s')+' above ₹10 L; '+rnc.length+' of '+rdue.length+' due reconciliations not certified';
    F.jnl = Math.round(clamp(pend.length*1.5 + dr.length*4 + an.length*12)); why.jnl = pend.length+' pending, '+dr.length+' AI drafts unreviewed, '+an.length+' anomal'+(an.length===1?'y':'ies');
    F.ic = Math.round(clamp(icV*12 + (conf? 40 : 0))); why.ic = ic.length? ic.length+' IC items not agreed ('+FCT.amt(icV)+')'+(conf? '; confirmation not sent' : '') : 'All IC items agreed';
    F.people = onLeave.length && !fixed? 85 : 0; why.people = onLeave.length && !fixed? onLeave.map(u=> u.name+' on leave '+u.availability.from+'–'+u.availability.to).join('; ')+', no backup named' : 'Task owners available';
    F.feed = e.feed? (id==='IN-07'? (fixed? 30 : 70) : 45) : 0; why.feed = e.feed? e.feed+(id==='IN-07' && fixed? ' (manual extract requested)' : '') : 'All feeds healthy';
    F.hist = Math.round(clamp((e.avgClose-3)*30)); why.hist = 'Average close day WD+'+e.avgClose.toFixed(1)+' over the last three closes';
    const fs = C.risk.factors, avg = sum(fs, x=> x.w*F[x.id])/100, mx = Math.max(...fs.map(x=> F[x.id]));
    const score = Math.round(.6*mx + .4*avg), cat = C.risk.cats.find(c=> score>=c.min).id;
    return { score, cat, fc:M.forecast(id), lik:M.likelihood(id), factors: fs.map(x=> ({ id:x.id, name:x.name, w:x.w, v:F[x.id], why:why[x.id], src:x.src, contrib:x.w*F[x.id]/100 })) };
  });
  M.riskRank = { Critical:4, High:3, Medium:2, Low:1 };
  M.SEGS = C.segs;

  /* ---------- process chain ---------- */
  M.chainScope = (f, kinds)=> cache('ch|'+M.fkey(f)+'|'+(kinds||'all'), ()=>{ const K = (k)=> !kinds || kinds.includes(k);
    const p = M.period(f.period), inP = (m)=> M.inPeriod(m, p);
    const S = {}; C.stages.forEach(s=> S[s.id] = { id:s.id, vol:0, issues:{}, n:0, val:0, ents:{}, en:{} });
    const seen = {}; C.stages.forEach(s=> seen[s.id] = new Set());
    const hit = (code, r)=>{ const st = M.issue(code).stage, s = S[st], val = M.recVal(r, code); const x = s.issues[code] = s.issues[code] || { code, n:0, val:0, recs:[] }; x.n++; x.val += val; x.recs.push(r);
      if(!seen[st].has(r.id)){ seen[st].add(r.id); s.n++; s.val += val; const e = r.kind==='ic'? r.a : r.e; s.ents[e] = (s.ents[e]||0) + val; s.en[e] = (s.en[e]||0) + 1; } };
    const ts = K('task')? M.set('task', f).filter(t=> inP(t.m)) : [], rs = K('rec')? M.set('rec', f).filter(r=> inP(r.m)) : [], js = K('je')? M.set('je', f).filter(j=> inP(j.m) && j.src!=='int' && j.src!=='rev') : [],
      ic = K('ic')? M.set('ic', f).filter(x=> inP(x.m)) : [], vs = K('var')? M.set('var', f).filter(v=> inP(v.m)) : [], um = inP(5) && K('acct')? M.set('acct', f) : [];
    [ts, rs, js, ic, vs, um].forEach(a=> a.forEach(r=> M.issuesOf(r).forEach(c=> hit(c, r))));
    const tc = (st)=> ts.filter(t=> t.stage===st).length;
    S.sub.vol = tc('sub'); S.jnl.vol = tc('jnl') + js.length; S.rec.vol = tc('rec') + rs.length + ic.length; S.rev.vol = tc('rev') + rs.filter(M.recDue).length;
    S.cls.vol = tc('cls') + (inP(5) && K('acct')? sum(M.ents(f), e=> e.local) : 0) + ic.length; S.rpt.vol = tc('rpt') + vs.length + um.filter(u=> u.ex).length;
    C.stages.forEach(s=>{ S[s.id].list = Object.values(S[s.id].issues).sort((a,b)=> b.n-a.n || b.val-a.val); });
    /* cycle-time indicator per stage: median working day the stage's tasks finished on */
    const med = (a)=>{ if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y); return s[s.length>>1]; };
    C.stages.forEach(s=>{ S[s.id].ct = med(ts.filter(t=> t.stage===s.id && M.taskDoneWD(t)!=null).map(M.taskDoneWD)); S[s.id].ctName = 'Median finish day'; });
    return S;
  });
  M.caseStages = (c)=>{ const out = {}; const prim = CT[c.type].stage; out[prim] = [];
    c.lines.forEach(id=>{ const r = IDX[id]; if(!r) return; M.issuesOf(r).forEach(k=>{ const st = M.issue(k).stage; out[st] = out[st] || []; if(out[st].indexOf(k)<0) out[st].push(k); }); });
    return { primary:prim, stages:out }; };
  M.heat = (f, n=10)=>{ const S = M.chainScope(f), tot = {}, cnt = {};
    C.stages.forEach(s=> Object.keys(S[s.id].en).forEach(e=>{ tot[e] = (tot[e]||0) + S[s.id].ents[e]; cnt[e] = (cnt[e]||0) + S[s.id].en[e]; }));
    return Object.keys(cnt).filter(e=> E[e]).sort((a,b)=> cnt[b]-cnt[a]).slice(0,n).map(e=> ({ v:e, name:e+' '+E[e].name, total:tot[e], cells:C.stages.map(s=> ({ stage:s.id, val:S[s.id].ents[e]||0, n:S[s.id].en[e]||0 })) })); };

  /* ---------- entity profile ---------- */
  M.entity = (id)=> cache('ep|'+id, ()=>{
    const e = E[id], rk = M.risk(id);
    const ts = X.tasks.filter(t=> t.e===id && t.m===5), rs = X.recs.filter(r=> r.e===id && r.m===5), js = X.jes.filter(j=> j.e===id), ic = X.ic.filter(x=> x.m===5 && (x.a===id||x.b===id));
    const vs = X.vars.filter(v=> v.e===id && v.m===5), um = X.unmapped.filter(u=> u.e===id);
    const cases = X.cases.filter(c=> c.e===id).map(c=> Object.assign({}, c, { stNow:M.caseStatus(c) }));
    const issues = {}; ts.concat(rs, js.filter(j=> j.m===5), ic, vs, um).forEach(r=> M.issuesOf(r).forEach(c=>{ const x = issues[c] = issues[c] || { code:c, n:0, val:0, recs:[] }; x.n++; x.val += M.recVal(r, c); x.recs.push(r.id); }));
    const stages = C.stages.map(s=>{ const its = Object.values(issues).filter(r=> M.issue(r.code).stage===s.id); return { id:s.id, name:s.name, n:sum(its,r=>r.n), val:sum(its,r=>r.val), issues:its.sort((a,b)=> b.n-a.n) }; });
    const manByM = C.months.map((x,m)=> sum(js.filter(j=> j.m===m && j.st==='Posted' && (j.src==='man'||j.src==='ai')), j=>j.val));
    const ftrByM = C.months.map((x,m)=>{ const a = js.filter(j=> j.m===m && j.st==='Posted' && (j.src==='man'||j.src==='ai')); return a.length? a.filter(j=> !j.fl.length).length/a.length*100 : null; });
    const done = ts.filter(M.taskDone).length, due = ts.filter(t=> t.dueWD<=TW).length, behind = ts.filter(t=> t.dueWD<=TW && !M.taskDone(t)).length;
    return { e, rk, ts, rs, js, ic, vs, um, cases, issues:Object.values(issues).sort((a,b)=> b.n-a.n), stages, manByM, ftrByM, done, due, behind,
      cert:rs.filter(r=> r.st==='Certified').length, breaks:rs.filter(r=> r.st==='Break'), unrec:sum(rs.filter(r=> r.st!=='Certified'), r=> Math.abs(r.diff)),
      pend:js.filter(j=> M.jSt(j)==='Pending'), drafts:js.filter(j=> M.jSt(j)==='Draft'), mapPct: e.local? (e.local - um.filter(u=> !M.mapped(u)).length)/e.local*100 : null };
  });
  /* why an entity surfaced in the current analysis: the path the user came by + standing reasons */
  M.why = (id, ctx)=>{
    const p = M.entity(id), out = [];
    if(ctx && ctx.kpi && ctx.f && KPI[ctx.kpi]){ const fs = M.facts(ctx.kpi, ctx.f).filter(x=> (ctx.groups||[]).every(g=> x.g[g.dim]===g.key)), mine = fs.filter(x=> x.e===id), k = KPI[ctx.kpi];
      if(M.isRate(ctx.kpi)){ const bad = fs.filter(x=> x.ok===false), mb = mine.filter(x=> x.ok===false); if(bad.length) out.push({ t:'ctx', text:`${mb.length} of ${bad.length} exceptions in this view (${FCT.pct(mb.length/bad.length*100,0)})`, kpi:k.name }); }
      else if(fs.length){ const tv = sum(fs,x=>x.val), mv = sum(mine,x=>x.val); out.push({ t:'ctx', text: ctx.kpi==='progress'||ctx.kpi==='jmix'? `${mine.length} of ${fs.length} records in this view` : `${FCT.amt(mv)} of ${FCT.amt(tv)} in this view (${FCT.pct(tv? mv/tv*100 : 0,1)})`, kpi:k.name }); } }
    out.push({ t:'risk', text:`Close risk ${p.rk.score} (${p.rk.cat}); forecast ${M.wdl(p.rk.fc)} against target WD+${C.targetWD}, likelihood ${p.rk.lik}%` });
    const top = p.rk.factors.slice().sort((a,b)=> b.v-a.v)[0]; if(top && top.v>=40) out.push({ t:'risk', text:top.name+': '+top.why });
    if(p.behind && !(top && top.v>=40 && top.id==='tasks')) out.push({ t:'stage', text:`${p.behind} of ${p.due} tasks due to date are behind plan` });
    if(p.breaks.length) out.push({ t:'case', text:`${p.breaks.length} reconciliation break${p.breaks.length>1?'s':''}: ${FCT.amt(sum(p.breaks, r=> r.diff))} unexplained` });
    const open = p.cases.filter(c=> M.statusMeasure(c.stNow)==='potential'); if(open.length) out.push({ t:'case', text:`${open.length} open case${open.length>1?'s':''}: ${[...new Set(open.map(c=> CT[c.type].name))].slice(0,3).join('; ')}` });
    if(p.e.feed) out.push({ t:'note', text:p.e.feed });
    return out;
  };

  /* ---------- document chain: where one record sits in Sub-ledger → Journal → Reconciliation → Review → Close → Report ---------- */
  M.chain = (id)=>{
    const r = IDX[id]; if(!r || r.kind==='case') return null;
    const iss = M.issuesOf(r), has = (st)=> iss.filter(c=> M.issue(c).stage===st), S = [];
    const step = (st, label, atD, detail, state)=> S.push({ stage:st, label, at:atD, detail, state: state || (has(st).length? 'issue' : atD==null? 'na' : 'ok'), issues:has(st) });
    const m = r.m!=null? r.m : 5;
    if(r.kind==='je'){ const st = M.jSt(r), rec = X.recs.find(x=> x.m===r.m && x.e===r.e && x.acct===r.acct);
      step('sub', r.src==='int'? 'Sub-ledger interface' : r.src==='rev'? 'Auto-reversal' : 'Source and support', r.src==='int'||r.src==='rev'? r.post : (r.sub||r.drafted||r.post), r.src==='int'? 'Generated from the sub-ledger' : r.supp? 'Support attached' : 'No support attached', r.supp? undefined : 'issue');
      step('jnl', st==='Posted'? 'Prepared, approved, posted' : st==='Draft'? 'AI draft, not submitted' : 'Awaiting approval', r.post, 'Prepared by '+r.prep+(r.appr? ' · approved by '+r.appr+(r.apprAt!=null? ' '+M.dt(r.apprAt) : '') : st==='Posted'? ' · no approver recorded' : '')+' · '+FCT.amt(r.val), st==='Posted'? undefined : 'wait');
      step('rec', rec? 'Account reconciled' : 'Account reconciliation', rec && rec.certAt, rec? rec.name+' · '+rec.st : 'No reconciliation unit for this account', rec? (rec.st==='Certified'? 'ok' : 'wait') : 'na');
      step('rev', 'Reviewed', rec && rec.certAt, rec? 'Reviewer '+rec.rev : '—', rec? undefined : 'na');
      step('cls', 'Period lock', X.wd(m, 1), 'Locked '+M.wdDate(m,1)+(r.fl.includes('perPost')? ' · posted after the lock' : ''), r.fl.includes('perPost')? 'issue' : m<5? 'ok' : 'wait');
      step('rpt', 'In the pack', m<5? X.wd(m, 4) : null, A[r.acct]? A[r.acct].name+' line' : '—', m<5? 'ok' : 'wait');
      return { kind:'je', l:r, steps:S, iss }; }
    if(r.kind==='rec'){ const js = X.jes.filter(j=> j.m===r.m && j.e===r.e && j.acct===r.acct && j.st==='Posted');
      step('sub', 'Support: '+(A[r.acct]||{}).sub, X.wd(m, 1), 'Support balance '+FCT.amt(r.sub));
      step('jnl', 'Journals to the account', js.length? Math.max(...js.map(j=> j.post)) : null, js.length+' journals posted · '+FCT.amt(sum(js, j=>j.val)), js.length? undefined : 'na');
      step('rec', 'Prepared', r.prepAt, 'GL '+FCT.amt(r.gl)+' · support '+FCT.amt(r.sub)+' · explained '+FCT.amt(r.expl)+' · unexplained '+FCT.amt(r.diff)+' · preparer '+r.prep, r.prepAt==null? 'wait' : undefined);
      step('rev', r.certAt!=null? 'Certified' : 'Not certified', r.certAt, 'Due '+M.wdl(r.dueWD)+(r.certWD!=null? ' · certified '+M.wdl(r.certWD) : '')+' · reviewer '+r.rev, r.certAt==null? (has('rev').length? 'issue' : 'wait') : undefined);
      step('cls', 'Period lock', X.wd(m, 1), 'Locked '+M.wdDate(m,1), m<5? 'ok' : 'wait');
      step('rpt', 'Balance in the pack', m<5? X.wd(m, 4) : null, (A[r.acct]||{}).name+' line', m<5? 'ok' : 'wait');
      return { kind:'rec', l:r, steps:S, iss }; }
    if(r.kind==='task'){ const d = M.taskDoneWD(r);
      step(r.stage, r.name, d!=null? X.wd(m, d) : null, M.grpName(r.grp)+' · owner '+r.owner+' · planned '+M.wdl(r.dueWD)+(d!=null? ' · done '+M.wdl(d) : ' · '+r.st), d==null? (has(r.stage).length? 'issue' : 'wait') : undefined);
      return { kind:'task', l:r, steps:S, iss }; }
    if(r.kind==='ic'){ step('jnl', 'Charge booked by '+r.a, X.wd(m, 0), r.ref+' · '+FCT.amt(r.val)+' · '+r.ccy); step('rec', 'Matched with '+r.b, M.agreed(r)? X.wd(m, 1) : null, r.st+(r.diff? ' · difference '+FCT.amt(r.diff) : '')+(r.note? ' · '+r.note : ''), M.agreed(r)? undefined : 'issue');
      step('cls', 'Eliminated on consolidation', m<5? X.wd(m, 3) : null, m<5? 'Eliminated' : 'Pending IC agreement', m<5? 'ok' : 'wait'); return { kind:'ic', l:r, steps:S, iss }; }
    if(r.kind==='var'){ step('rpt', r.st, r.signedWD!=null? X.wd(m, r.signedWD) : null, r.line+' · '+FCT.amt(r.v)+' ('+r.pct+') · '+(r.signedWD!=null? 'signed '+M.wdl(r.signedWD) : 'not signed'), r.signedWD==null? 'wait' : undefined); return { kind:'var', l:r, steps:S, iss }; }
    if(r.kind==='acct'){ step('cls', 'Mapping to group CoA', null, r.local+' · balance '+FCT.amt(r.bal)+' · suggested '+r.sugg+' ('+FCT.pct(r.conf*100,0)+')', M.mapped(r)? 'ok' : 'issue'); return { kind:'acct', l:r, steps:S, iss }; }
    return null;
  };
  M.evidence = (r)=>{ const ev = [];
    if(r.kind==='je'){ ev.push(['Journal', r.id, 'ERP FI']); if(r.supp) ev.push(['Support', r.id+' attachment', 'Document store']); if(r.appr) ev.push(['Approval log', r.appr+(r.apprAt!=null? ' · '+M.dt(r.apprAt) : ''), 'Workflow log']); if(r.score>=.75) ev.push(['Anomaly score', String(r.score), 'Journal analytics JNA-v1.4']); }
    if(r.kind==='rec'){ ev.push(['Reconciliation workpaper', r.id, 'Reconciliation tool']); ev.push(['Support', (A[r.acct]||{}).sub, 'Source system']); if(r.certAt!=null) ev.push(['Certification', r.rev+' · '+M.dt(r.certAt), 'Reconciliation tool']); }
    if(r.kind==='ic'){ ev.push(['IC invoice', r.ref, 'ERP SD/FI']); ev.push(['Counterparty confirmation', r.pair, 'IC hub']); }
    if(r.kind==='var'){ ev.push(['Variance workings', r.id, 'FP&A model']); }
    if(r.kind==='acct'){ ev.push(['Mapping table', r.e+' '+r.local, 'Group reporting']); }
    if(r.kind==='task'){ ev.push(['Close checklist', r.id, 'Close manager']); }
    return ev; };

  /* ---------- navigation state (same reducer as the P2P tower; node types root, group, entity, eprofile, doc, case) ---------- */
  M.nav = {
    init: (kpi, path)=> ({ kpi, path: path && path.length? path : [{ t:'root', label:(KPI[kpi]||{}).name || kpi }], sel:null }),
    reduce: (s, a)=>{
      switch(a.t){
        case 'kpi': case 'kpiJump': return M.nav.init(a.kpi);
        case 'node': { const path = s.path.slice(); path[path.length-1] = Object.assign({}, path[path.length-1], a.v); return Object.assign({}, s, { path, sel:null }); }
        case 'sel': return Object.assign({}, s, { sel: s.sel && a.v && s.sel.key===a.v.key? null : a.v });
        case 'drill': { const path = s.path.slice(); path[path.length-1] = Object.assign({}, path[path.length-1], { sel:s.sel });
          const last = path[path.length-1]; if(last.t===a.node.t && last.id===a.node.id && last.key===a.node.key && last.dim===a.node.dim) return s;
          return Object.assign({}, s, { path:path.concat([a.node]), sel:null }); }
        case 'crumb': { const path = s.path.slice(0, a.i+1); return Object.assign({}, s, { path, sel: path[a.i].sel || null }); }
        case 'back': return s.path.length>1? M.nav.reduce(s, { t:'crumb', i:s.path.length-2 }) : s;
        case 'home': return M.nav.reduce(s, { t:'crumb', i:0 });
        default: return s;
      }
    },
    top: (s)=> s.path[s.path.length-1],
    groups: (s)=> s.path.filter(n=> n.t==='group'),
    entity: (s, f)=>{ for(let i=s.path.length-1;i>=0;i--){ const n = s.path[i]; if(n.t==='entity'||n.t==='eprofile') return n.id; } return f && f.entity!=='All'? f.entity : null; },
    encode: (s)=> encodeURIComponent(JSON.stringify({ k:s.kpi, p:s.path.map(n=>{ const o = Object.assign({}, n); delete o.sel; return o; }) })),
    decode: (str)=>{ try{ if(!str) return null; if(/^kpi=/.test(str)){ const k = str.slice(4); return KPI[k] || k==='process' || k==='entities'? M.nav.init(k) : null; } const o = JSON.parse(decodeURIComponent(str)); return o && o.k? M.nav.init(o.k, o.p) : null; } catch(e){ return null; } }
  };
  M.nav.vendor = M.nav.entity;
})();
