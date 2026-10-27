/* Calculation, reconciliation, filter and navigation tests for the P2P control tower model.  Run: node tools/p2p/test-model.js [-v]
   Loads the same data files and engine the browser loads, in a sandbox with a fake window. */
const load = require('./load.js');
const ctx = load(['data/core.js','data/exceptions.js','data/p2p.js','data/o2c.js','data/r2r.js','data/sc.js','data/cmp.js','data/sc/demand.js','data/sc/anomalies.js','data/xtower.js',
  'data/p2p/master.js','data/p2p/ledger.js','assets/js/fct-core.js','assets/js/p2p/p2p-model.js']);
const { P2PM:M, FCT, FCT_DATA:D } = ctx, X = M.X, C = M.C, SNAP = M.SNAP; const V = process.argv.includes('-v');
let fails = 0, n = 0; const ok = (c, msg)=>{ n++; if(!c){ fails++; console.log('FAIL', msg); } else if(V) console.log('ok  ', msg); };
const near = (a, b, t=0.005)=> a!=null && b!=null && Math.abs(a-b) <= t;
const sum = (a, f)=> a.reduce((s,x)=> s + f(x), 0);
const f0 = Object.assign({}, M.defaults);

/* 1. determinism and stable ids */
const again = load(['data/core.js','data/exceptions.js','data/p2p.js','data/p2p/master.js','data/p2p/ledger.js']).FCT_DATA.p2px;
ok(again.lines.length===X.lines.length && again.lines[5000].id===X.lines[5000].id && again.lines[5000].amt===X.lines[5000].amt, 'ledger is deterministic (same seed, same ids and values)');
ok(new Set(X.lines.map(l=>l.id)).size===X.lines.length, 'invoice ids are unique');
ok(new Set(X.cases.map(c=>c.id)).size===X.cases.length, 'case ids are unique');

/* 2. calibration anchors shared with the drawer exceptions and other towers */
const sep = X.lines.filter(l=> l.m===5);
ok(sep.length===14620, 'Sep-26 invoices = 14,620');
const blk = X.lines.filter(l=> l.pSt==='Blocked');
ok(blk.length===376 && near(sum(blk,l=>l.amt), 32.0), 'blocked at snapshot = 376 invoices, ₹32.0 Cr (PTP-BLK-02)');
ok(near(sum(blk.filter(l=>l.mr==='grMissing'),l=>l.amt), 18.6) && near(sum(blk.filter(l=>l.mr==='price'),l=>l.amt), 7.0) && near(sum(blk.filter(l=>l.mr==='qty'),l=>l.amt), 3.5), 'blocked split: GR missing 18.6, price 7.0, quantity 3.5');
ok(blk.filter(l=>l.mr==='uom').length===61 && near(sum(blk.filter(l=>l.mr==='uom'),l=>l.amt), 2.30), 'unit-of-measure: 61 invoices, ₹2.30 Cr (PTP-MAT-08)');
const run = X.lines.filter(l=> l.run===X.runs.next.id && l.paid > SNAP);
ok(run.length===1128 && near(sum(run,l=>l.amt), 186.4), 'payment run PR-20261006 = 1,128 invoices, ₹186.4 Cr');
const pend = X.lines.filter(l=> l.iap && SNAP - l.iap.since > 3);
ok(pend.length===42 && near(sum(pend,l=>l.amt), 6.80), '42 invoice approvals past SLA, ₹6.80 Cr (PTP-APR-07)');
ok(near(sum(X.grni,g=>g.val), 24.0), 'GRNI = ₹24.0 Cr (PTP-GRNI-01)');
const gate = X.lines.filter(l=> l.gate && l.grPs==null), gateOpen = X.open.filter(o=> o.gate);
ok(gate.length + gateOpen.length===142 && near(sum(gate,l=>l.amt) + sum(gateOpen,o=>o.val), 6.4) && near(sum(gate,l=>l.amt), 4.9), '142 gate passes not receipted = ₹6.4 Cr, ₹4.9 Cr invoiced and blocked (SC-GRL-10)');
ok(near(sum(sep.filter(l=>l.npo==='noncompliant'),l=>l.amt), 14.7), 'Sep spend without a PO = ₹14.7 Cr (SC-NPO-09)');
D.sc.suppliers.forEach(s=> ok(near(sum(X.lines.filter(l=> l.v===s.id && l.m>=3), l=>l.amt), s.spend), `Q2 spend ${s.n} = ₹${s.spend} Cr (data/sc.js)`));
ok(near(sum(X.vendors.filter(v=> v.adv && v.adv.ageM>=6), v=>v.adv.cr), 3.6), 'advances older than 180 days = ₹3.6 Cr (PTP-ADV-04)');
const ster = X.lines.find(l=> l.ex==='PTP-LPR-09');
ok(ster && ster.amt===2.14 && M.date(ster.due)==='08-Oct-26' && ster.pSt==='Approval pending', 'Sterling INV-SG-2209 ₹2.14 Cr due 08-Oct, approval pending');

/* 3. KPI formulas reconcile with the records behind them */
const k = (id, f)=> M.kpi(id, f||f0);
ok(near(k('approval').v, 96.4, .05), 'Sep approval compliance = 96.4%');
ok(near(k('otp').v, 87.0, .05), 'Sep on-time payment = 87.0%');
['match','approval','price','grt','otp'].forEach(id=>{ const fs = M.facts(id, f0), good = fs.filter(x=>x.ok).length;
  ok(fs.length===k(id).n && near(good/fs.length*100, k(id).v, 1e-9), `${id}: rate = compliant facts ÷ facts (${fs.length} records)`); });
ok(near(sum(M.facts('spend', f0), x=>x.val), k('spend').v, 1e-6), 'Total Spend = Σ fact values');
ok(near(sum(M.facts('commit', f0), x=>x.val), k('commit').v, 1e-6), 'Open Commitments = Σ open PO line values');
ok(near(sum(M.facts('overdue', f0), x=>x.val), k('overdue').v, 1e-6), 'Overdue Payables = Σ overdue invoices');
ok(near(sum(M.facts('exposure', f0), x=>x.val), k('exposure').v, 1e-6), 'Potential Exposure = Σ open case estimates');
const tv = M.topVendors(f0); ok(near(sum(tv.rows, r=>r.spend), k('spend').v, 1e-6) && near(sum(tv.rows, r=>r.share), 100, 1e-6), 'vendor spend adds to Total Spend; shares add to 100%');
const mix = k('riskmix'); ok(sum(mix.mix, m=>m.n)===mix.n, 'risk mix counts add to active vendors');
const spendByRisk = C.risk.cats.map(c=> sum(M.facts('riskmix', f0).filter(x=>x.g.risk===c.id), x=>x.spend||0));
ok(near(sum(spendByRisk, x=>x), k('spend').v, 1e-6), 'risk-mix spend adds to Total Spend (separate denominator from vendor count)');
['spend','commit','overdue'].forEach(id=>{ const rows = M.group(M.facts(id, f0), x=> x.g.bu); ok(near(sum(rows, r=>r.val), k(id).v, 1e-6), `${id}: business-unit breakdown adds to the KPI`); });

/* 4. health score: weights, normalisation, missing data */
const h = M.health(f0), w = C.health.reduce((s,c)=> s + c.w, 0);
ok(w===100, 'health weights add to 100');
ok(Math.round(h.comps.reduce((s,c)=> s + c.contrib, 0))===h.score, 'health = Σ component contributions');
ok(h.coverage===1 && M.healthAt(f0, [2]).coverage===0.85, 'history months exclude master-data quality (coverage 85%, not scored as perfect)');
const fNoGate = Object.assign({}, f0, { bu:'IN-06' });
ok(k('grt', fNoGate).v===null, 'GR timeliness at a site with no gate feed is N/A, not 0 or 100');
const hNo = M.health(fNoGate); ok(hNo.coverage < 1 && hNo.comps.find(c=>c.kpi==='grt').sc===null, 'missing component lowers health coverage');

/* 5. exposure kept apart from disputed amounts and confirmed loss */
const e = M.exposure(M.cases(f0));
ok(e.potential > 0 && e.disputed >= 0 && e.control > 0, 'exposure split exists');
ok(!M.cases(f0).some(c=> M.ETYPE[c.type].basis==='ctl' && M.facts('exposure', f0).some(x=> x.rec.id===c.id)), 'control cases never add to Potential Exposure');
const c1 = M.cases(f0).find(c=> c.stNow==='open' && !c.ex && c.est>0);
M.setCaseStatus(c1.id, 'disputed', 'test'); const e2 = M.exposure(M.cases(f0));
ok(near(e.potential - e2.potential, c1.est, 1e-6) && near(e2.disputed - e.disputed, c1.est, 1e-6), 'raising a dispute moves the estimate from potential to disputed (no double count)');
M.setCaseStatus(c1.id, 'open'); ok(near(M.exposure(M.cases(f0)).potential, e.potential, 1e-6), 'reopening restores potential exposure');
FCT.state.notes.p2pCase = {}; M.clearCache();

/* 6. filters */
const fBu = Object.assign({}, f0, { bu:'IN-03' });
ok(M.facts('spend', fBu).every(x=> x.rec.e==='IN-03'), 'business-unit filter applies to records');
ok(near(sum(C.bus, b=> k('spend', Object.assign({}, f0, { bu:b.id })).v || 0), k('spend').v, 1e-6), 'spend across all business units adds to the unfiltered total');
const fV = Object.assign({}, f0, { vendor:'V-100377' }); ok(M.facts('spend', fV).every(x=> x.v==='V-100377') && k('spend', fV).v > 0, 'vendor filter keeps only that vendor');
const fNone = Object.assign({}, f0, { bu:'IN-06', cat:'ksm' }); ok(k('match', fNone).v===null && k('spend', fNone).v===null, 'no matching records gives N/A, never a fabricated zero');
ok(M.fkey(Object.assign({}, f0, { vendor:'V-100377' }))!==M.fkey(f0), 'filters are part of the cache key');

/* 7. navigation: breadcrumb appends, ancestors restore, KPI switch resets */
let s = M.nav.init('exposure');
s = M.nav.reduce(s, { t:'sel', v:{ key:'price', dim:'type' } });
s = M.nav.reduce(s, { t:'drill', node:{ t:'group', dim:'type', key:'price', label:'Type: Price' } });
s = M.nav.reduce(s, { t:'drill', node:{ t:'vendor', id:'V-100512', label:'Sunrise Solvents' } });
s = M.nav.reduce(s, { t:'drill', node:{ t:'doc', id:X.lines[0].id, label:'Invoice' } });
ok(s.path.length===4 && s.path.map(p=>p.t).join()==='root,group,vendor,doc', 'drilling appends a node per level');
ok(M.nav.vendor(s)==='V-100512', 'current vendor is kept through vendor → transaction');
const r0 = M.nav.reduce(s, { t:'crumb', i:0 }); ok(r0.path.length===1 && r0.sel && r0.sel.key==='price', 'root crumb restores the root view and its selection');
const r1 = M.nav.reduce(s, { t:'back' }); ok(r1.path.length===3 && M.nav.top(r1).t==='vendor', 'back returns one level');
ok(M.nav.reduce(s, { t:'drill', node:s.path[3] })===s, 'drilling into the current node does not duplicate it');
const kk = M.nav.reduce(s, { t:'kpi', kpi:'otp' }); ok(kk.kpi==='otp' && kk.path.length===1, 'KPI switch resets the breadcrumb root');
const enc = M.nav.decode(M.nav.encode(s)); ok(enc.path.length===4 && enc.path[2].id==='V-100512', 'navigation survives URL encode/decode');
ok(M.nav.decode('kpi=otp').kpi==='otp', 'deep link #kpi=otp opens that KPI');
const nd = M.nav.reduce(M.nav.init('spend'), { t:'node', v:{ by:'vendor' } }); ok(M.nav.top(nd).by==='vendor', 'view choice is stored on its breadcrumb node');

/* 8. vendor profile and document chain */
const p = M.vendor('V-100377', f0);
ok(p.rk.approved==='Critical' && p.rk.score>=85 && p.rk.factors.every(x=> x.why), 'Kaveri: Critical (insolvency floor 85) with an explanation per factor');
ok(M.risk('V-105512').esc && /GST/.test(M.risk('V-105512').esc), 'Prakash: cancelled GST registration escalation is explained');
ok(M.risk('V-301776').rereview && M.risk('V-301776').model==='Critical', 'Apex: bank-change signal proposes a re-review to Critical');
ok(near(sum(p.byM, x=>x), sum(X.lines.filter(l=> l.v==='V-100377' && l.m>=0), l=>l.amt), 1e-6), 'profile spend trend = Σ vendor invoices');
ok(p.stages.reduce((s,x)=> s + x.n, 0)===p.issues.reduce((s,x)=> s + x.n, 0), 'profile stage footprint = Σ issues');
const ch = M.chain(ster.id); ok(ch.steps.map(s=>s.stage).join()==='pr,apr,po,gr,inv,pay', 'document chain covers requisition to payment');
ok(M.chain(X.prs[0].id).steps[0].stage==='pr', 'open requisitions open as documents');
ok(M.why('V-100377', { kpi:'match', f:f0, groups:[] }).length > 0, 'why-surfaced explanation exists');

/* 9. process chain */
const S = M.chainScope(f0);
ok(C.stages.every(st=> S[st.id].n <= S[st.id].list.reduce((a,r)=> a + r.n, 0)), 'stage totals count each record once per stage');
const heat = M.heat(f0, 10); ok(heat.length===10 && heat.every(r=> near(r.total, r.cells.reduce((a,c)=> a + c.val, 0), 1e-6)), 'heat-grid rows add across stages');

/* 10. vendor terminology */
const visible = JSON.stringify([C.kpis, C.issues, C.exposureTypes, C.stages, C.opps, C.risk, X.vendors.map(v=>v.notes)]);
ok(!/supplier/i.test(visible), 'P2P configuration copy uses vendor terminology only');
ok(!D.exceptions.filter(x=> /^PTP-/.test(x.id)).some(x=> /supplier/i.test(JSON.stringify(x))), 'P2P drawer exceptions use vendor terminology only');

/* 11. category budget */
['Sep-26','Q2','H1'].forEach(pid=>{ const f = Object.assign({}, f0, { period:pid }), b = M.budget(f);
  ok(b && near(b.act, M.kpi('spend', f).v, 0.01), 'budget actual reconciles to Total Spend ('+pid+')');
  ok(b && near(b.bud, sum(C.cats, c=> c.bud)*M.period(pid).months.length), 'period budget = monthly plan × months ('+pid+')'); });
ok(M.budget(Object.assign({}, f0, { bu:'IN-02' }))===null, 'budget is hidden under a BU filter');

console.log(`${n-fails}/${n} P2P model checks passed`); if(fails) process.exit(1);
