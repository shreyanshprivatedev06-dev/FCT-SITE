/* Calculation and reconciliation tests for the SC control tower. Run: node tools/sc/test-model.js [-v] */
const load = require('../p2p/load.js');
const files = ['data/core.js','data/exceptions.js','data/p2p.js','data/o2c.js','data/r2r.js','data/sc.js','data/cmp.js','data/sc/demand.js','data/sc/anomalies.js','data/xtower.js',
  'data/sc/master.js','data/sc/ledger.js','assets/js/fct-core.js','assets/js/sc/sc-model.js'];
const ctx = load(files);
const { SCM:M, FCT_DATA:D } = ctx, X = M.X, C = M.C; const V = process.argv.includes('-v');
let fails = 0, n = 0; const ok = (c, msg)=>{ n++; if(!c){ fails++; console.log('FAIL', msg); } else if(V) console.log('ok  ', msg); };
const near = (a, b, t=0.05)=> a!=null && b!=null && Math.abs(a-b) <= t;
const sum = (a, f)=> a.reduce((s,x)=> s + f(x), 0);
const f0 = Object.assign({}, M.defaults);

/* determinism and identity */
const again = load(['data/core.js','data/exceptions.js','data/sc.js','data/sc/demand.js','data/sc/anomalies.js','data/sc/master.js','data/sc/ledger.js']).FCT_DATA.sc3;
ok(again.lines.length===X.lines.length && again.lines[300].id===X.lines[300].id && again.lines[300].val===X.lines[300].val, 'ledger is deterministic');
ok(new Set(X.lines.map(l=>l.id)).size===X.lines.length, 'record ids are unique');
ok(new Set(X.materials.map(m=>m.id)).size===X.materials.length, 'material-plant ids are unique');
ok(new Set(X.cases.map(c=>c.id)).size===X.cases.length, 'case ids are unique');
ok(X.cases.length===40 && X.cases.every(c=> D.exceptions.some(x=> x.id===c.ex)), 'every named SC exception has one case linked to its drawer exception');

/* book anchors (data/sc.js) */
const inv = M.kpi('inv', f0);
ok(near(inv.v, C.invAnchor.gross, 0.02), 'Inventory Value = ₹642.0 Cr book anchor');
ok(near(inv.v, sum(M.facts('inv', f0), x=>x.val), 1e-6), 'Inventory Value = Σ lot values');
C.cats.forEach(c=> ok(near(sum(X.lots.filter(l=>l.cat===c.id), l=>l.val), c.anchor, 0.02), 'category '+c.name+' = ₹'+c.anchor+' Cr'));
C.ages.forEach((a,i)=> ok(near(sum(X.lots.filter(l=>l.age===i), l=>l.val), a.anchor, 0.02), 'ageing '+a.name+' = ₹'+a.anchor+' Cr'));
ok(near(M.kpi('excess', f0).v, C.excessAnchor.total, 0.02), 'Excess Stock = ₹38.5 Cr');
ok(near(sum(X.materials.filter(m=>m.plant==='IN-02A'), m=>m.excess), C.excessAnchor['IN-02A'], 0.02) && near(sum(X.materials.filter(m=>m.plant==='IN-03'), m=>m.excess), C.excessAnchor['IN-03'], 0.02), 'excess by plant: IN-02A ₹21.2 Cr, IN-03 ₹9.8 Cr');
ok(X.materials.every(m=> !m.excess || m.excess < m.stock), 'excess never exceeds stock');
const rnb = M.kpi('rnb', f0);
ok(near(rnb.v, 19.0, 0.02) && near(rnb.git, 12.6, 0.02) && near(rnb.gate, 6.4, 0.02), 'Receipts Not Booked = ₹12.6 Cr in transit + ₹6.4 Cr at the gate = ₹19.0 Cr');
ok(rnb.gitN===19 && rnb.gateN===142, '19 shipments and 142 gate receipts');
ok(near(rnb.blocked, 4.9, 0.02) && near(rnb.noInv, 1.5, 0.02) && near(rnb.excluded, 2.1, 0.02), 'gate split ₹4.9 Cr blocked / ₹1.5 Cr no invoice; ₹2.1 Cr DAP excluded');

/* forecast formulas */
const fcA = M.kpi('fcAcc', f0), fs = M.facts('fcAcc', f0);
ok(near(fcA.v, 79.1, 0.06) && near(fcA.bias, 9.6, 0.06), 'Sep forecast accuracy 79.1%, bias +9.6% (data/sc/demand.js)');
ok(near(fcA.v, (1 - sum(fs, x=>x.val)/sum(fs, x=>x.act))*100, 1e-6), 'Forecast Accuracy = 1 − Σ|F−A| ÷ ΣA over facts');
['ira','rcpt','otif','valc','mdq'].forEach(id=>{ const k = M.kpi(id, f0), fx = M.facts(id, f0);
  if(!fx.length || k.v==null){ ok(true, id+': no records → N/A allowed'); return; }
  ok(near(fx.filter(x=>x.ok).length/fx.length*100, k.v, 0.01), id+': rate = compliant facts ÷ facts'); });
ok(near(M.kpi('ira', f0).v, 97.2, 0.25), 'record accuracy ≈ 97.2% anchor');
ok(near(M.kpi('otif', f0).v, 87.4, 0.5), 'supplier OTIF ≈ 87.4% anchor');
ok(near(M.kpi('rcpt', f0).v, 71, 0.3), 'receipt timeliness ≈ 71% (gate receipts without a GR count as late)');

/* exposure honesty */
const e = M.exposure(M.cases(f0));
ok(e.potential>0 && near(e.potential, sum(M.facts('exposure', f0), x=>x.val), 1e-6), 'Material Exposure = Σ open financial case estimates');
ok(!M.facts('exposure', f0).some(x=> M.ETYPE[x.rec.type].basis==='ctl'), 'control cases never add to Material Exposure');
ok(!M.facts('exposure', f0).some(x=> x.rec.est==null), 'unquantified cases are not counted as ₹0');
ok(near(sum(X.cases.filter(c=>c.ex==='SC-SUP-02'), c=>c.est), 12.0, 1e-6) && near(X.cases.find(c=>c.ex==='SC-SUP-02').contingent, 14.1, 1e-6), 'Kaveri: one estimate ₹12.0 Cr; ₹14.1 Cr revenue at risk kept contingent');
ok(e.contingent>0 && e.control>0, 'contingent and control values are reported beside exposure');

/* totals reconcile */
const tv = M.topMaterials(f0);
ok(near(sum(tv.rows, r=>r.spend), inv.v, 1e-6) && near(sum(tv.rows, r=>r.share), 100, 1e-6), 'top materials add to Inventory Value; shares add to 100%');
const mix = M.kpi('riskmix', f0); ok(sum(mix.mix, m=>m.n)===mix.n, 'risk mix counts add to active material-plants');
ok(['A','B','C'].every(a=> X.materials.some(m=> M.abc(m.id)===a)) && ['X','Y','Z'].every(z=> X.materials.some(m=> M.xyz(m.id)===z)), 'ABC and XYZ classes are all populated');
const segA = M.segComp('ira', f0, { a:'A' }), segAll = M.segComp('ira', f0, null);
ok(segA.n < segAll.n && segAll.n===M.facts('ira', f0).length, 'segment rescopes a Health component to its slice');
C.sheet.concat(['mdq']).forEach(id=>{ const k = M.kpi(id, f0); ok(k && (k.v==null || typeof k.v==='number'), id+' KPI returns a number or N/A'); });

const h = M.health(f0);
ok(sum(C.health, c=>c.w)===100, 'health weights add to 100');
ok(h.score!=null && h.score>=0 && h.score<=100 && near(h.coverage, 1, 1e-9), 'health 0–100 with full coverage for Sep');
ok(C.health.length===6 && C.health.every(c=> M.isTheme(c.kpi)), 'health score is built from the six control-tower themes');
C.themes.forEach(t=>{ const k = M.kpi(t.id, f0), fs = M.facts(t.id, f0), have = k.subs.filter(x=> x.rate!=null);
  ok(k.v!=null && near(k.v, have.reduce((a,x)=> a+x.rate, 0)/have.length, 1e-9), t.id+': theme value = average of subtheme pass rates');
  ok(fs.every(x=> t.subs.some(s=> s.name===x.g.sub) && x.g.plant && typeof x.ok==='boolean'), t.id+': every fact carries a subtheme, plant and pass/fail');
  ok(k.subs.every(s=> s.n===fs.filter(x=> x.g.sub===s.name).length), t.id+': drilling into a subtheme returns exactly its records');
  ok(M.dims[t.id][0]==='sub', t.id+': first drill level is the subtheme'); });
ok(M.kpi('t_ct', Object.assign({}, f0, { period:'Aug-26' })).v==null, 'snapshot-only themes are N/A for past months');
ok(M.kpi('health', f0).series.every((v,i)=> v==null || i===5) && M.kpi('health', f0).prior==null, 'health trend and prior never compare on fewer themes');
ok(M.healthAt(f0, [2]).coverage<1, 'months without valuation-review or master-data history show reduced coverage');
ok(C.stages.map(s=>s.id).join()==='fct,pln,prc,rcv,prd,shp', 'SC stages are Forecast → Plan → Procure → Receive → Produce → Ship');
const S = M.chainScope(f0); ok(C.stages.every(s=> S[s.id].vol>0 && S[s.id].n>0), 'every stage has volume and issues');

/* filters */
const fP = Object.assign({}, f0, { plant:'IN-05' });
ok(M.facts('inv', fP).every(x=> x.rec.plant==='IN-05') && M.kpi('inv', fP).v < inv.v, 'plant filter applies to inventory');
const fC = Object.assign({}, f0, { cat:'git' });
ok(near(M.kpi('inv', fC).v, 22.8, 0.02), 'category filter: booked goods in transit ₹22.8 Cr');
const fV = Object.assign({}, f0, { vendor:'KSM-17@IN-02A' });
ok(M.facts('otif', fV).every(x=> x.v==='KSM-17@IN-02A') && M.kpi('otif', fV).v < M.kpi('otif', f0).v, 'material filter: KSM-17 OTIF below the portfolio');

/* navigation */
ok(M.nav.decode('kpi=rnb').kpi==='rnb', 'deep link kpi=rnb restores Receipts Not Booked');
ok(M.nav.decode('kpi=nope')===null, 'unknown deep link is ignored');
let s = M.nav.init('inv'); s = M.nav.reduce(s, { t:'drill', node:{ t:'group', dim:'plant', key:'IN-05 Plant', label:'Plant: IN-05 Plant' } }); s = M.nav.reduce(s, { t:'drill', node:{ t:'material', id:'CAT-PDC@IN-05', label:'Pd/C' } });
ok(s.path.length===3 && M.nav.material(s)==='CAT-PDC@IN-05', 'drill appends breadcrumb steps and finds the material');
ok(M.nav.reduce(s, { t:'crumb', i:0 }).path.length===1, 'breadcrumb restores the KPI root');
ok(M.nav.decode(M.nav.encode(s)).path.length===3, 'navigation round-trips through the URL hash');
ok(M.chain(X.gate[0].id).steps.some(st=> st.state==='issue'), 'document chain flags the gate receipt');

/* decisions move the numbers */
const st = ctx.FCT.state; st.dec = st.dec || {}; st.dec['SC-GIT-06'] = { status:'taken' }; st.seq = (st.seq||0) + 1; M.clearCache();
ok(near(M.kpi('rnb', f0).v, 6.4, 0.02) && near(M.kpi('inv', f0).v, 654.6, 0.02), 'deciding SC-GIT-06 books ₹12.6 Cr: not booked 6.4, inventory 654.6');
ok(M.caseStatus(X.cases.find(c=>c.ex==='SC-GIT-06'))==='prevented', 'case follows the drawer decision');

console.log(fails? fails+' failed of '+n : n+' checks passed');
process.exit(fails? 1 : 0);
