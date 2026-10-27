/* Cross-tower sync checks: one entity and site master, one vendor master, R2R reconciliations tied to the tower sub-ledgers,
   map totals equal to the KPI sheets, O2C billing on plan and Compliance texts equal to the tower ledgers.
   Every tower loads the same data files the browser loads (assets/js/load.js).  Run: node tools/fct/test-sync.js [-v] */
const fs = require('fs'), path = require('path');
const load = require('../p2p/load.js');
const { balances } = require('./sync-balances.js');
const ROOT = path.join(__dirname, '../..'), V = process.argv.includes('-v');
let fails = 0, n = 0; const ok = (c, msg)=>{ n++; if(!c){ fails++; console.log('FAIL', msg); } else if(V) console.log('ok  ', msg); };
const near = (a, b, t=0.01)=> a!=null && b!=null && Math.abs(a-b) <= t;
const sum = (a, f)=> a.reduce((s,x)=> s + (f? f(x) : x), 0);

/* the browser's data list, read from assets/js/load.js so the test can never drift from the pages */
const BASE = fs.readFileSync(path.join(ROOT, 'assets/js/load.js'), 'utf8').match(/root\+'(data\/[^']+\.js)'/g).map(x=> x.replace(/^root\+'|'$/g, '')).concat(['assets/js/fct-core.js']);
const T = { P2PM:['data/p2p/master.js','data/p2p/ledger.js','assets/js/p2p/p2p-model.js'], O2CM:['data/o2c/master.js','data/o2c/ledger.js','assets/js/o2c/o2c-model.js'],
  R2RM:['data/r2r/master.js','data/r2r/ledger.js','assets/js/r2r/r2r-model.js'], SCM:['data/sc/master.js','data/sc/ledger.js','assets/js/sc/sc-model.js'] };
const M = {}, D = load(BASE).FCT_DATA; Object.entries(T).forEach(([g, fs2])=> M[g] = load(BASE.concat(fs2))[g]);
const { P2PM:P, O2CM:O, R2RM:R, SCM:S } = M, f0 = (X)=> Object.assign({}, X.defaults);

/* 1. entity and site master */
D.entities.forEach(e=> ok(e.region && e.cls && e.site && typeof e.site.lat==='number' && typeof e.site.lng==='number', e.id+' has region, class and site'));
const reg = {}; D.entities.forEach(e=> reg[e.id] = e.region);
[['P2P', P.C.bus], ['O2C', O.C.bus]].forEach(([t, bus])=> bus.forEach(b=> ok(b.region===reg[b.id], t+' '+b.id+' region = master ('+b.region+')')));
R.X.ents.forEach(e=> ok(e.region===reg[e.id], 'R2R '+e.id+' region = master'));
S.C.bus.forEach(b=> ok(b.name===D.entities.find(e=> e.id===b.id).name, 'SC '+b.id+' name = master'));
ok(Object.keys(D.places).every(r=> D.places[r].every(p=> typeof p.lat==='number')), 'shared places carry coordinates');

/* 2. one vendor master: every external SC supplier is a P2P vendor with spend */
S.X.suppliers.filter(s=> !s.ic).forEach(s=>{ const v = P.V[s.id]; ok(v && v.name===s.name, 'SC supplier '+s.id+' '+s.name+' is a P2P vendor');
  ok(v && P.X.lines.some(l=> l.v===s.id), 'P2P has spend with '+s.name); });

/* 3. R2R reconciliations tie to the tower sub-ledgers */
const fresh = balances(), file = D.subledger;
ok(JSON.stringify(fresh)===JSON.stringify(file), 'data/xtower.js is current (else run node tools/fct/sync-balances.js)');
const sep = R.X.recs.filter(r=> r.m===5);
Object.keys(file).forEach(acct=> D.entities.forEach(e=>{ const V0 = file[acct][e.id]||0, rs = sep.filter(r=> r.e===e.id && r.acct===acct);
  ok(near(sum(rs, r=> r.sub), V0) && (V0>0 || !rs.length), 'R2R '+acct+' '+e.id+' sub-ledger = tower ('+V0+')'); }));
ok(near(sum(Object.values(file['1310'])), O.kpi('ar', f0(O)).v, .05), 'receivables (1310) = O2C open AR');
ok(near(sum(Object.values(file['1410'])), S.kpi('inv', f0(S)).v, .05), 'inventory (1410) = SC inventory');
ok(near(sum(Object.values(file['2110'])), P.kpi('commit', f0(P)).grni, .05), 'GR/IR (2110) = P2P GRNI');

/* 4. map totals reconcile to the KPI sheets (what each map card sums) */
const spend = {}; P.topVendors(f0(P)).rows.forEach(r=> spend[r.v] = r.spend);
ok(near(sum(P.vendorsIn(f0(P)).filter(v=> v.geo), v=> spend[v.id]||0), P.kpi('spend', f0(P)).v), 'P2P map spend = Total Spend');
ok(P.vendorsIn(f0(P)).every(v=> v.geo), 'every active P2P vendor has a location');
const per = O.geoAgg(f0(O)).per; ok(near(sum(O.customersIn(f0(O)), c=> (per[c.id]||{}).ar||0), O.kpi('ar', f0(O)).v), 'O2C map AR = Open receivables');
ok(near(sum(S.materialsIn(f0(S)).filter(v=> v.geo), v=> S.stock(v.id)), S.kpi('inv', f0(S)).v), 'SC map stock = Inventory');
ok(S.materialsIn(f0(S)).every(v=> v.geo), 'every active SC material-plant has a location');
ok(near(sum(R.X.ents, e=> R.kpi('unrec', Object.assign(f0(R), { entity:e.id })).v||0), R.kpi('unrec', f0(R)).v), 'R2R map unreconciled = Unmatched Balances');
/* the three scope tiers narrow the control tower */
const seg = P.SEGS[0].id; ok(P.kpi('spend', Object.assign(f0(P), { pSeg:seg })).v < P.kpi('spend', f0(P)).v, 'P2P vendor-segment scope narrows spend');
ok(S.kpi('inv', Object.assign(f0(S), { pSeg:'A' })).v < S.kpi('inv', f0(S)).v, 'SC value-class scope narrows inventory');
ok(near(sum(P.GEO_REGIONS, r=> P.kpi('spend', Object.assign(f0(P), { pGeo:r })).v), P.kpi('spend', f0(P)).v), 'P2P geography tiers partition spend');

/* 5. O2C billing follows the monthly plan; spend is a plausible share of revenue */
O.C.revenueM.forEach((t, m)=>{ const pid = O.C.periods.find(p=> p.months.length===1 && p.months[0]===m).id;
  ok(near(O.kpi('revenue', Object.assign(f0(O), { period:pid })).v, t, 2), 'O2C '+pid+' billing ≈ plan ₹'+t+' Cr'); });
const ratio = P.kpi('spend', f0(P)).v / O.kpi('revenue', f0(O)).v; ok(ratio>.4 && ratio<.6, 'Sep spend is '+(ratio*100).toFixed(0)+'% of billed revenue (40–60%)');

/* 6. Compliance texts equal the tower ledgers */
const cmp = fs.readFileSync(path.join(ROOT, 'assets/js/cmp/cmp-preview.js'), 'utf8') + fs.readFileSync(path.join(ROOT, 'data/cmp.js'), 'utf8');
const noSupp = R.X.jes.filter(j=> j.e==='IN-07' && j.m===5 && j.st!=='Draft' && j.supp===false).length;
ok(cmp.includes("'"+noSupp+" September journals without support"), 'CTL-R2R-021 cites '+noSupp+' journals (R2R)');
const ic7 = R.X.ic.filter(x=> x.m===5 && (x.a==='IN-07' || x.b==='IN-07') && x.st==='Not confirmed');
ok(cmp.includes(ic7.length+' items, ₹'+sum(ic7, x=> x.val).toFixed(2)+' Cr'), 'CTL-R2R-017 cites '+ic7.length+' IC items, ₹'+sum(ic7, x=> x.val).toFixed(2)+' Cr (R2R)');
const ovr = O.X.credit.filter(d=> d.override && !d.ok && d.e==='US-01');
ok(ovr.length===6 && cmp.includes('6 Q2 limit overrides'), 'CTL-O2C-011: 6 US-01 overrides in O2C and in Compliance');
ovr.forEach(d=>{ const c = O.V[d.v]; ok(cmp.includes(c.name+" limit raised ₹"+d.cur+" Cr → ₹"+d.req+" Cr"), 'override '+d.id+' text matches O2C ('+c.name+')'); });
ovr.forEach(d=> ok(!ovr.some(x=> x.v===d.v && x.at>d.at) ? near(d.req, O.V[d.v].limit, 0.001) : true, 'last override for '+O.V[d.v].name+' ends at the current limit'));

console.log(`${n-fails}/${n} cross-tower sync checks passed`); if(fails) process.exit(1);
