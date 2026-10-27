/* Calculation, reconciliation, filter and navigation tests for the R2R control tower model.  Run: node tools/r2r/test-model.js [-v]
   Loads the same data files and engine the browser loads, in a sandbox with a fake window. */
const load = require('./load.js');
const FILES = ['data/core.js','data/exceptions.js','data/p2p.js','data/o2c.js','data/r2r.js','data/sc.js','data/cmp.js','data/sc/demand.js','data/sc/anomalies.js','data/xtower.js','assets/js/fct-core.js','data/r2r/master.js','data/r2r/ledger.js','assets/js/r2r/r2r-model.js'];
const ctx = load(FILES);
const { R2RM:M, FCT, FCT_DATA:D } = ctx, X = M.X, C = M.C; const V = process.argv.includes('-v');
let fails = 0, n = 0; const ok = (c, msg)=>{ n++; if(!c){ fails++; console.log('FAIL', msg); } else if(V) console.log('ok  ', msg); };
const near = (a, b, t=0.005)=> a!=null && b!=null && Math.abs(a-b) <= t;
const sum = (a, f)=> a.reduce((s,x)=> s + f(x), 0);
const f0 = Object.assign({}, M.defaults);

/* 1. determinism and stable ids */
const again = load(FILES.slice(0, FILES.indexOf('data/r2r/ledger.js')+1)).FCT_DATA.r2rx;
ok(again.jes.length===X.jes.length && again.jes[9000].id===X.jes[9000].id && again.jes[9000].val===X.jes[9000].val, 'ledger is deterministic (same seed, same ids and values)');
['tasks','recs','jes','ic','vars','unmapped','cases'].forEach(k=> ok(new Set(X[k].map(r=>r.id)).size===X[k].length, k+' ids are unique'));

/* 2. calibration anchors (data/core.js, data/r2r.js, drawer exceptions) */
const sepT = X.tasks.filter(t=> t.m===5);
ok(sepT.length===486 && sepT.filter(t=> t.doneWD!=null).length===289 && sepT.filter(t=> t.dueWD<=2).length===307, 'Sep tasks 486, done 289, plan to date 307');
ok(sepT.filter(t=> t.dueWD<=2 && t.doneWD==null).length===FCT.v('close.lateTasks'), 'behind plan = close.lateTasks (31)');
D.entities.forEach(e=>{ const ts = sepT.filter(t=> t.e===e.id); ok(ts.length===e.tasks && ts.filter(t=> t.doneWD!=null).length===e.done && ts.filter(t=> t.dueWD<=2).length===e.plan, e.id+' tasks / done / plan match core.entities'); });
const sepR = X.recs.filter(r=> r.m===5);
ok(sepR.length===FCT.v('recs.total') && sepR.filter(r=> r.st==='Certified').length===FCT.v('recs.cert'), 'Sep reconciliations 1,284, certified 1,040 (recs.total / recs.cert)');
D.entities.forEach(e=>{ const rs = sepR.filter(r=> r.e===e.id); ok(rs.length===e.recs && rs.filter(r=> r.st==='Certified').length===e.cert && rs.filter(r=> r.st==='Break').length===e.open, e.id+' recs / certified / breaks match core.entities'); });
/* named reconciliations keep their data/r2r.js values, except where the figure exceeds the tower sub-ledger (data/xtower.js): then the
   sub-ledger side is 60% of the tower balance and the difference is kept (IN-05 GR/IR against P2P GRNI) */
D.r2r.recs.forEach(r=>{ const x = sepR.find(y=> y.name===r.acc && y.e===r.entity), acct = r.acc.split(' ')[0], V = D.subledger && D.subledger[acct] && D.subledger[acct][r.entity];
  const scaled = V!=null && r.sub > V*.8;
  ok(x && x.diff===r.diff && (scaled? near(x.sub, V*.6, .01) && near(x.gl, x.sub + r.diff, .001) : x.gl===r.gl && x.sub===r.sub), 'named reconciliation '+r.acc+(scaled? ' scaled to the tower sub-ledger' : ' keeps its values')); });
ok(D.r2r.recAgeing.every(([,k],i)=> sum(sepR, r=> r.items[i])===k), 'reconciling items by age = data/r2r.js recAgeing (214 / 38 / 11 / 4)');
const sepJ = X.jes.filter(j=> j.m===5 && j.st==='Posted'), man = sepJ.filter(j=> j.src==='man'||j.src==='ai');
ok(sepJ.length===D.r2r.journals.total && man.length===D.r2r.journals.manual && man.filter(j=> j.src==='ai').length===D.r2r.journals.aiDrafted, 'Sep journals 3,912, manual 1,146, AI-drafted 352');
ok(man.filter(j=> j.fl.length).length===43 && near(man.filter(j=> j.fl.length).length/man.length*100, FCT.v('r2r.jeExcRate'), .05), 'Sep journal exceptions 43 (3.8%)');
ok(man.filter(j=> j.fl.includes('anom')).length===D.r2r.journals.anomalies && D.r2r.anomalies.every(a=> sepJ.find(j=> j.id===a[0] && j.score===a[2])), 'Sep anomalies = the 7 named journals with their scores');
ok(X.jes.filter(j=> j.st==='Pending').length===FCT.v('r2r.jePending'), '64 journals pending approval');
ok(near(sum(X.jes.filter(j=> j.st==='Pending' && !j.review), j=>j.val), 1.20) && X.jes.filter(j=> j.st==='Pending' && j.review).length===6, '58 low-risk pending = ₹1.20 Cr; 6 named to review');
ok(X.jes.filter(j=> j.st==='Draft').length===14 && near(sum(X.jes.filter(j=> j.st==='Draft'), j=>j.val), 2.71, .02), '14 IN-07 AI accrual drafts, ₹2.71 Cr (RTR-CLS-01)');
const ic = X.ic.filter(x=> x.m===5 && x.pair==='IN-02↔US-01');
ok(near(sum(ic, x=>x.val), 48.70) && near(sum(ic, x=>x.diff), 3.10), 'IC IN-02↔US-01 = ₹48.70 Cr with ₹3.10 Cr difference (RTR-REC-03)');
D.r2r.ic.pairs.forEach(p=> ok(near(sum(X.ic.filter(x=> x.m===5 && x.a===p[0] && x.b===p[1]), x=>x.val), p[2]), 'IC pair '+p[0]+'↔'+p[1]+' adds to ₹'+p[2]+' Cr'));
const sepV = X.vars.filter(v=> v.m===5);
ok(sepV.length===FCT.v('var.total') && sepV.filter(v=> v.st==='Signed').length===FCT.v('var.signed'), 'Sep material variances 34, signed 21');
D.r2r.settings.mapping.forEach(([e,,p])=>{ const E = M.E[e], u = X.unmapped.filter(x=> x.e===e).length; ok(near((E.local-u)/E.local*100, p, .06), e+' mapping '+p+'%'); });

/* 3. KPI formulas reconcile with the records behind them */
const k = (id, f)=> M.kpi(id, f||f0);
ok(near(k('tasks').v, 89.9, .05), 'Sep task timeliness = 276 ÷ 307 = 89.9%');
ok(near(k('jnl').v, 96.25, .01), 'Sep journal first-time-right = 1,103 ÷ 1,146');
ok(near(k('var').v, 21/34*100, 1e-9), 'Sep variance commentary coverage = 21 ÷ 34');
ok(near(k('progress').v, 289/486*100, 1e-9) && k('progress').plan===307 && k('progress').behind===31, 'close progress 289 ÷ 486; plan 307; behind 31');
['tasks','recs','jnl','ic','var','mapq'].forEach(id=>{ const fs = M.facts(id, f0); ok(fs.length===k(id).n && near(fs.filter(x=>x.ok).length/fs.length*100, k(id).v, 1e-9), id+': rate = compliant facts ÷ facts ('+fs.length+')'); });
['jpend','unrec','adj'].forEach(id=> ok(near(sum(M.facts(id, f0), x=>x.val), k(id).v, 1e-9), id+' = Σ fact values'));
ok(near(k('jpend').v, 9.33, .01), 'journals pending ₹9.33 Cr (RTR-JNL-08)');
ok(sum(k('entmix').mix, m=> m.n)===10, 'entity close-risk counts add to 10 entities');
const ta = M.topAccts(f0); ok(near(sum(ta.rows, r=>r.share), 100, 1e-6) && near(ta.total, sum(M.facts('topacc', f0), x=>x.val), 1e-9), 'manual value by account adds to total; shares add to 100%');
['jpend','unrec','adj'].forEach(id=>{ const rows = M.group(M.facts(id, f0), (x)=> x.e); ok(near(sum(rows, r=>r.val), k(id).v, 1e-9), id+': entity breakdown adds to the KPI'); });
ok(k('jmix').v===sepJ.length, 'journal mix counts every posted Sep journal');

/* 4. health score: weights, normalisation, missing data */
const h = M.health(f0);
ok(sum(C.health, c=> c.w)===100, 'health weights add to 100');
ok(Math.round(sum(h.comps, c=> c.contrib))===h.score, 'health = Σ component contributions');
ok(h.coverage===1 && M.healthAt(f0, [2]).coverage===0.85, 'earlier closes exclude account mapping (coverage 85%, not scored as perfect)');
ok(h.band && h.band.label==='Watch', 'Sep health is in the Watch band ('+h.score+')');
const ser = M.series('health', f0); ok(ser.every(v=> v!=null) && ser[5] > ser[0], 'health improves Apr → Sep ('+ser.join(', ')+')');

/* 5. measures kept apart */
const e = k('adj').e;
ok(e.items.every(c=> M.CT[c.type].basis==='fin' && M.statusMeasure(c.stNow)==='potential'), 'potential misstatement holds only open financial cases');
ok(X.cases.every(c=> (M.CT[c.type].basis==='fin') === (c.affected==null)), 'financial cases carry an estimate; control cases carry value affected only');
ok(near(e.potential + e.proposed + e.booked + sum(M.cases(f0).filter(c=> M.CT[c.type].basis==='fin' && M.statusMeasure(c.stNow)==='closed'), c=> c.est||0), sum(X.cases.filter(c=> M.CT[c.type].basis==='fin'), c=> c.est||0), 1e-9), 'every financial case counts in exactly one measure');
ok(new Set(X.cases.filter(c=> c.ex).map(c=> c.ex)).size===X.cases.filter(c=> c.ex && c.type!=='mapping' && c.type!=='icBreak').length + new Set(X.cases.filter(c=> c.ex && (c.type==='mapping'||c.type==='icBreak')).map(c=> c.ex)).size, 'one case per drawer exception');
ok(X.cases.filter(c=> c.ex).every(c=> FCT.ex(c.ex)), 'every linked drawer exception exists');

/* 6. filters */
const fE = Object.assign({}, f0, { entity:'IN-07' });
ok(M.facts('jnl', fE).every(x=> x.e==='IN-07') && M.facts('adj', fE).every(x=> x.e==='IN-07'), 'entity filter applies to every KPI');
ok(!M.facts('adj', fE).some(x=> x.e==='Group'), 'group-wide cases are hidden under an entity filter');
const fR = Object.assign({}, f0, { risk:'High' });
ok(M.facts('recs', fR).every(x=> x.rec.risk==='High') && k('tasks', fR).v===null, 'account-risk filter keeps records with an account; tasks become N/A, not zero');
const fS = Object.assign({}, f0, { seg:'Overseas sales' });
ok(M.ents(fS).length===2 && M.facts('ic', fS).every(x=> ['US-01','EU-01'].includes(x.rec.a) || ['US-01','EU-01'].includes(x.rec.b)), 'entity class filter: overseas sales = US-01, EU-01');
ok(near(sum(C.segs, s=> M.segComp('jnl', f0, s.id).n), k('jnl').n, 0), 'entity classes partition the journal facts');
const fQ = Object.assign({}, f0, { period:'Q2' }); ok(k('jnl', fQ).n === sum([3,4,5], m=> M.facts('jnl', Object.assign({}, f0, { period:C.months[m] })).length), 'quarter = sum of its closes');

/* 7. live drawer decisions */
const r0 = M.risk('IN-07').score, d0 = k('progress').done, p0 = k('adj').v;
const take = (id)=>{ const x = FCT.ex(id); FCT.decide(id, { action:'TAKE', status:'resolved' }); FCT.applyEffects(x.onTake||[]); M.clearCache(); };
take('RTR-CLS-01');
ok(k('progress').done===d0+10, 'RTR-CLS-01 take: 10 IN-07 tasks complete (289 → 299)');
ok(M.risk('IN-07').score < r0, 'RTR-CLS-01 take lowers IN-07 close risk ('+r0+' → '+M.risk('IN-07').score+')');
ok(near(k('adj').v, p0 - 2.71, 1e-6), 'RTR-CLS-01 take books the IN-07 accrual case: misstatement −₹2.71 Cr');
const j0 = k('jpend').n; take('RTR-JNL-08'); ok(k('jpend').n===j0-58, 'RTR-JNL-08 take approves the 58 low-risk journals');
M.setCaseStatus(M.facts('adj', f0)[0].rec.id, 'nil', 'test'); ok(M.facts('adj', f0).length===k('adj').n, 'case status change recalculates the KPI');

/* 8. navigation */
let s = M.nav.init('unrec'); s = M.nav.reduce(s, { t:'sel', v:{ key:'1360', dim:'acct' } }); s = M.nav.reduce(s, { t:'drill', node:{ t:'group', dim:'acct', key:'1360', label:'Account: 1360' } });
s = M.nav.reduce(s, { t:'drill', node:{ t:'entity', id:'IN-02', label:'IN-02' } }); ok(s.path.length===3 && M.nav.entity(s)==='IN-02', 'drill appends group and entity');
s = M.nav.reduce(s, { t:'crumb', i:0 }); ok(s.path.length===1 && s.sel && s.sel.key==='1360', 'crumb restores the root and its selection');
ok(M.nav.decode(M.nav.encode(s)).kpi==='unrec' && M.nav.decode('kpi=recs').kpi==='recs', 'URL hash round-trips; #kpi= deep links work');

/* 9. terminology */
ok(!JSON.stringify(C.kpis).match(/vendor|supplier/i), 'R2R KPI copy uses entity and account terms, not vendor');

console.log(fails? `${fails} of ${n} checks FAILED` : `All ${n} R2R model checks pass`);
process.exit(fails? 1 : 0);
