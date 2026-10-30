/* FCT demo — Cash & close: the data behind the Cash attribution and Close calendar screens.
   Nothing here is new data: every figure is read from the tower engines already on the page —
   P2PM (blocked invoices, fixes in the pipeline), O2CM (open financial cases, fixes in the pipeline),
   R2RM (Sep-26 close tasks, entity forecasts and risk) — and from the decision queue (FCT.ex). Exposes window.FIN. */
(function(){
  const P2 = window.P2PM, O2 = window.O2CM, R2 = window.R2RM, D = window.FCT_DATA, FCT = window.FCT;
  const FIN = window.FIN = {};
  const sum = (a, f)=> a.reduce((s, x)=> s + (f? f(x) : x), 0);
  const top = (rows, key, val)=>{ const g = {}; rows.forEach(r=>{ const k = key(r); if(k!=null) g[k] = (g[k]||0) + val(r); }); const t = sum(Object.values(g)) || 1;
    return Object.entries(g).sort((a,b)=> b[1]-a[1]).map(([k,v])=> ({ key:k, pct:Math.round(v/t*100) })); };
  const mode = (a)=>{ const g = {}; a.forEach(x=>{ if(x) g[x] = (g[x]||0) + 1; }); return Object.keys(g).sort((x,y)=> g[y]-g[x])[0]; };
  FIN.user = (id)=> ((D.users||[]).find(u=> u.id===id)||{}).name || id;

  /* ---------- cash attribution: causes → pools ---------- */
  /* A fix in the pipeline (tower config.opps) is the cause's remediation row. Its status maps to the fix-status gutter. */
  const OPPS = [].concat(P2.C.opps.map(o=> Object.assign({ tower:'P2P' }, o)), O2.C.opps.map(o=> Object.assign({ tower:'O2C' }, o)));
  const STATE = { 'Live':'fixed-at-source', 'In delivery':'in-progress', 'Approved':'in-progress', 'Proposed':'identified' };
  FIN.STATUS_LABEL = { 'fixed-at-source':'Fix live', 'in-progress':'Fix in progress', identified:'Fix proposed', none:'No fix planned' };
  FIN.STATUS_NOTE = { 'fixed-at-source':'the fix is working, no new cases', 'in-progress':'fix approved and being put in place', identified:'fix suggested, work not started', none:'nobody is working on a fix' };
  FIN.statusColor = (s)=> ({ 'fixed-at-source':'var(--pos)', 'in-progress':'var(--px-medium)', identified:'var(--ink-3)', none:'var(--crit)' })[s];
  FIN.POOL = {
    ap:{ name:'Blocked invoices', tower:'P2P', sub:'invoices on hold, cannot be paid', next:'Also affects R2R: accruals too low', inside:['AP & tax'], href:'screens/p2p/process.html', color:'#E0B25A' },
    ar:{ name:'Revenue at risk', tower:'O2C', sub:'may not be collected in full', next:'Also affects: slower collections', inside:['Credit & collections','AR & cash application'], href:'screens/o2c/process.html', color:'#8ACFC3' } };

  /* P2P: invoices blocked for payment at the snapshot, by block reason (the ₹32.0 Cr behind PTP-BLK-02).
     Function = where the failure happens; the issue code names the cause in the tower's own words. */
  const AP_META = {
    grMissing:{ issue:'grMissing', fn:'Plants & stores', opp:'OPP-P2P-07' },
    price:    { issue:'priceVar',  fn:'Procurement',     opp:'OPP-P2P-10' },
    qty:      { issue:'qtyVar',    fn:'Plants & stores', opp:null },
    uom:      { issue:'uom',       fn:'Procurement',     opp:'OPP-P2P-05' },
    retro:    { issue:'retroPo',   fn:'Requesting departments', opp:'OPP-P2P-04' },
    tax:      { issue:null, name:'Tax code differs from PO', fn:'AP & tax', opp:null } };
  /* O2C: open financial cases still measured as potential exposure, by case type (Potential exposure on the O2C scorecard). */
  const AR_META = {
    pricing:  { fn:'Commercial',            opp:'OPP-O2C-01', ex:'O2C-DED-02' },
    shortage: { fn:'Logistics',             opp:'OPP-O2C-05', ex:'O2C-DED-02' },
    slip:     { fn:'Credit & collections',  opp:null,         ex:'O2C-DSO-01' },
    ptp:      { fn:'Credit & collections',  opp:'OPP-O2C-03', ex:'O2C-DSO-01' },
    cutoff:   { fn:'Logistics & billing',   opp:'OPP-O2C-02', ex:'O2C-BILL-04' },
    unapplied:{ fn:'AR & cash application', opp:'OPP-O2C-04', ex:'O2C-CASH-03' } };

  const vName = (id)=> (P2.X.vendors.find(v=> v.id===id)||{}).name || id;
  const custOf = (id)=> O2.X.customers.find(c=> c.id===id) || { name:id };
  const exOk = (id)=> id && FCT.ex(id)? id : null;

  FIN.causes = ()=>{
    const out = [];
    const blk = P2.X.lines.filter(l=> l.pSt==='Blocked');
    Object.keys(AP_META).forEach(k=>{ const m = AP_META[k], ls = blk.filter(l=> l.mr===k); if(!ls.length) return;
      const v = sum(ls, l=> l.amt);
      out.push({ key:'ap-'+k, pool:'ap', name:m.name || P2.C.issues[m.issue].name, fn:m.fn, value:v, n:ls.length, unit:'invoices',
        avgDays:sum(ls, l=> P2.SNAP - l.rcv)/ls.length, months:new Set(ls.map(l=> l.m)).size,
        where:top(ls, l=> l.site || l.e, l=> l.amt).slice(0,2).map(x=> ({ name:x.key, pct:x.pct })),
        cp:(()=>{ const t = top(ls, l=> l.v, l=> l.amt)[0]; return t && { name:vName(t.key), pct:t.pct, kind:'vendor' }; })(),
        ex:exOk(mode(ls.map(l=> l.ex).filter(exOk))) || exOk('PTP-BLK-02'), opp:OPPS.find(o=> o.id===m.opp) || null }); });
    const cs = O2.cases(Object.assign({}, O2.defaults)).filter(c=> O2.statusMeasure(c.stNow)==='potential' && AR_META[c.type]);
    const ETN = {}; O2.C.exposureTypes.forEach(t=> ETN[t.id] = t.name);
    Object.keys(AR_META).forEach(k=>{ const m = AR_META[k], ls = cs.filter(c=> c.type===k); if(!ls.length) return;
      out.push({ key:'ar-'+k, pool:'ar', name:ETN[k], fn:m.fn, value:sum(ls, c=> c.est||0), n:ls.length, unit:ls.length===1? 'case' : 'cases',
        avgDays:sum(ls, c=> O2.SNAP - (c.opened!=null? c.opened : O2.SNAP))/ls.length, months:new Set(ls.map(c=> O2.monthOf(c.opened))).size,
        where:top(ls, c=> custOf(c.v).bu, c=> c.est||0).slice(0,2).map(x=> ({ name:x.key, pct:x.pct })),
        cp:(()=>{ const t = top(ls, c=> c.v, c=> c.est||0)[0]; return t && { name:custOf(t.key).name, pct:t.pct, kind:'customer' }; })(),
        ex:exOk(mode(ls.map(c=> c.ex).filter(exOk))) || exOk(m.ex), opp:OPPS.find(o=> o.id===m.opp) || null }); });
    out.forEach(c=>{ c.state = c.opp? (STATE[c.opp.status] || 'identified') : 'none';
      const x = c.ex && FCT.ex(c.ex); c.exObj = x || null; c.conf = x && x.ai && x.ai.confidence!=null? Math.round(x.ai.confidence*100) : null;
      c.open = x? FCT.isOpen(x) : false; c.owner = c.opp? c.opp.owner : x? FIN.user(x.owner) : null;
      c.actions = [c.opp && c.opp.title, x && x.ai && x.ai.text, x && x.rca && x.rca.fix, x && x.rca && x.rca.prevent].filter(Boolean).filter((t,i,a)=> a.indexOf(t)===i).slice(0,3); });
    return out;
  };
  /* the headline anchors the causes reconcile to */
  FIN.anchors = ()=> ({ apBlocked:sum(P2.X.lines.filter(l=> l.pSt==='Blocked'), l=> l.amt),
    arPotential:O2.exposure(O2.cases(Object.assign({}, O2.defaults))).potential });
  FIN.CUTOFF_DAYS = 30;   /* older than one close cycle: the item has already missed a month-end */

  /* ---------- close calendar: Sep-26 close tasks per entity ---------- */
  const C = R2.C, TW = C.todayWD;
  FIN.entities = ()=> C.ents.map(e=> ({ id:e.id, name:(R2.E[e.id]||{}).name || e.id, risk:R2.risk(e.id).cat, score:R2.risk(e.id).score }));
  /* the AI agent on each task: a status and the reason behind it, read from the task's own state in the close ledger */
  const LANE = (t)=>{ const s = t.st || '';
    if(/AI draft/i.test(s)) return { state:'working', status:'Drafted', reason:'Journal drafted by AI; waiting for reviewer approval' };
    if(/suggested/i.test(s)) return { state:'working', status:'Suggested', reason:s.replace(/^(\d+) suggested/i, '$1 matches suggested by AI; waiting for confirmation') };
    if(/^Break/i.test(s)) return { state:'escalated', status:'Stopped', reason:'Reconciliation difference ('+s.replace(/^Break\s*/i,'')+') needs a person to investigate' };
    if(/Blocked/i.test(s)) return { state:'escalated', status:'Stopped', reason:'Source data missing: '+s.replace(/^Blocked\s*/,'').replace(/[()]/g,'')+' not updating' };
    if(/pending/i.test(s)) return { state:'escalated', status:'Stopped', reason:s+'; agent cannot proceed' };
    if(/Awaiting controller/i.test(s)) return { state:'never', status:'Manual', reason:'Waiting for controller approval' };
    if(t.stage==='rev' || /sign-off|Certify/i.test(t.name)) return { state:'never', status:'Manual', reason:'Review and sign-off are done by a person, not automated' };
    if(/Awaiting review/i.test(s)) return { state:'none', status:'Not used', reason:'Prepared by the owner; waiting for reviewer' };
    if(/Not started/i.test(s)) return { state:'none', status:'Not used', reason:'Owner has not started the task' };
    return { state:'none', status:'Not used', reason:'Task is being worked on by the owner' }; };
  FIN.close = (id)=>{
    const ts = R2.X.tasks.filter(t=> t.e===id && t.m===5), done = ts.filter(R2.taskDone), open = ts.filter(t=> !R2.taskDone(t));
    const rk = R2.risk(id), people = rk.factors.find(f=> f.id==='people'), feed = rk.factors.find(f=> f.id==='feed');
    const x = D.exceptions.find(e=> e.tower==='R2R' && e.entity===id && /CLS/.test(e.id)) || null;
    const decided = x && !FCT.isOpen(x), dec = x && FCT.state.dec[x.id];
    const tasks = open.map(t=>{
      const behind = R2.behind(t), odd = !/^(In progress|Not started|Awaiting review|Done)$/.test(t.st);
      const onLeave = people && people.v>0 && people.why && people.why.indexOf(t.owner)>=0;
      const blocker = onLeave? { name:'the owner is on leave', owner:'no backup is assigned' } : /Blocked|feed/i.test(t.st) && feed? { name:feed.why, owner:'waiting for the source system' } : odd? { name:t.st.toLowerCase(), owner:t.owner } : null;
      const crit = behind || t.stage==='cls' || t.stage==='rpt';
      const esc = !behind? null : decided? { state:'sent', when:dec.t, to:x? FIN.user(x.owner) : 'the controller', message:(x.ai && x.ai.short) || x.title, answered:true }
        : { state:'timer', when:x? x.due : 'WD+'+C.targetWD, to:x? FIN.user(x.owner) : 'the entity controller' };
      return { id:t.id, name:t.name, grp:t.grp, stage:t.stage, owner:t.owner, dueWD:t.dueWD, st:t.st, status:behind? 'blocked' : 'open', behind, blocker, onCriticalPath:crit, escalation:esc, agentLane:LANE(t) }; });
    const sgn = ts.filter(t=> t.stage==='rev'), sgnOpen = sgn.filter(t=> !R2.taskDone(t)), sgnLate = sgnOpen.filter(R2.behind);
    return { id, name:(R2.E[id]||{}).name || id, ex:x, risk:rk, total:ts.length, completeCount:done.length, openCount:open.length,
      blockerCount:tasks.filter(t=> t.behind).length, committedDay:C.targetWD, predictedDay:R2.forecast(id), todayWD:TW, tasks,
      signoff:{ n:sgn.length, done:sgn.length-sgnOpen.length, inFlight:sgnOpen.length, late:sgnLate.length, status:sgnLate.length? 'Overdue' : sgnOpen.length? 'In progress' : 'All signed' } };
  };
  FIN.wd = (n)=> n<=0? (n===0? 'WD0' : 'WD'+n) : 'WD+'+n;
})();
