/* Calculation and reconciliation tests for the O2C control tower. Run: node tools/o2c/test-model.js [-v] */
const load = require('../p2p/load.js');
const files = ['data/core.js','data/exceptions.js','data/p2p.js','data/o2c.js','data/r2r.js','data/sc.js','data/cmp.js','data/sc/demand.js','data/sc/anomalies.js','data/xtower.js',
  'data/o2c/master.js','data/o2c/ledger.js','assets/js/fct-core.js','assets/js/o2c/o2c-model.js'];
const ctx = load(files);
const { O2CM:M, FCT_DATA:D } = ctx, X = M.X, C = M.C; const V = process.argv.includes('-v');
let fails = 0, n = 0; const ok = (c, msg)=>{ n++; if(!c){ fails++; console.log('FAIL', msg); } else if(V) console.log('ok  ', msg); };
const near = (a, b, t=0.05)=> a!=null && b!=null && Math.abs(a-b) <= t;
const sum = (a, f)=> a.reduce((s,x)=> s + f(x), 0);
const f0 = Object.assign({}, M.defaults);
const fBu0 = ()=> Object.assign({}, f0, { bu:'IN-03' });

const again = load(['data/core.js','data/exceptions.js','data/o2c.js','data/o2c/master.js','data/o2c/ledger.js']).FCT_DATA.o2cx;
ok(again.lines.length===X.lines.length && again.lines[100].id===X.lines[100].id && again.lines[100].amt===X.lines[100].amt, 'ledger is deterministic');
ok(new Set(X.lines.map(l=>l.id)).size===X.lines.length, 'invoice ids are unique');
ok(new Set(X.cases.map(c=>c.id)).size===X.cases.length, 'case ids are unique');
ok(X.customers.some(c=> c.id==='C-40102' && c.name==='Meridian Health Systems'), 'named customer Meridian is present');
const buRegion = {}; C.bus.forEach(b=> buRegion[b.id] = b.region);
ok(X.customers.every(c=> c.geo && c.geo.city && c.geo.region===buRegion[c.bu] && typeof c.geo.lat==='number' && typeof c.geo.lng==='number'), 'every customer has a city inside its business-unit region');
ok(X.customers.find(c=>c.id==='C-40102').geo.city==='Delhi' && X.customers.find(c=>c.id==='C-50021').geo.city==='Basel' && X.customers.find(c=>c.id==='C-60014').geo.region==='North America', 'named customers sit in Delhi, Basel and North America');

const ar = M.arOpen(f0), od = M.overdue(f0);
ok(near(sum(ar, l=>l.amt), C.arAnchor.total, 2), 'open AR near ₹1,537 Cr anchor (ledger calibration)');
ok(sum(od, l=>l.amt) > 0 && sum(od, l=>l.amt) < sum(ar, l=>l.amt), 'overdue is a subset of open AR');
ok(near(M.kpi('ar', f0).v, sum(ar, l=>l.amt), 1e-6), 'Open Receivables = Σ unpaid invoice amounts');
ok(near(M.kpi('overdue', f0).v, sum(od, l=>l.amt), 1e-6), 'Overdue Receivables = Σ past-due unpaid invoices');
ok(near(sum(M.facts('revenue', f0), x=>x.val), M.kpi('revenue', f0).v, 1e-6), 'Billed Revenue = Σ fact values');
ok(near(sum(M.facts('exposure', f0), x=>x.val), M.kpi('exposure', f0).v, 1e-6), 'Collections Exposure = Σ open financial case estimates');

const tv = M.topCustomers(f0);
ok(near(sum(tv.rows, r=>r.spend), M.kpi('ar', f0).v, 1e-6) && near(sum(tv.rows, r=>r.share), 100, 1e-6), 'top customers add to Open Receivables; shares add to 100%');
const mix = M.kpi('riskmix', f0);
ok(sum(mix.mix, m=>m.n)===mix.n, 'risk mix counts add to active customers');

C.sheet.concat(['mdq']).forEach(id=>{ const k = M.kpi(id, f0); ok(k && (k.v==null || typeof k.v==='number'), id+' KPI returns a number or N/A'); });
['coll','ptp','cash','credit','billing'].forEach(id=>{ const k = M.kpi(id, f0), fs = M.facts(id, f0);
  if(!fs.length || k.v==null){ ok(true, id+': no records → N/A allowed'); return; }
  const good = fs.filter(x=>x.ok).length;
  ok(near(good/fs.length*100, k.v, 0.6), id+': rate ≈ compliant facts ÷ facts'); });

const h = M.health(f0), w = C.health.reduce((s,c)=> s + c.w, 0);
ok(w===100, 'health weights add to 100');
ok(h.score==null || (h.score>=0 && h.score<=100), 'health score is 0–100 or N/A');
ok(h.coverage>0 && h.coverage<=1, 'health coverage is between 0 and 1');
ok(C.health.length===6 && C.health.every(c=> M.isTheme(c.kpi)), 'health score is built from the six control-tower themes');
C.themes.forEach(t=>{ const k = M.kpi(t.id, f0), fs = M.facts(t.id, f0), have = k.subs.filter(s=> s.rate!=null);
  ok(k.v!=null && near(k.v, have.reduce((a,s)=> a+s.rate, 0)/have.length, 1e-9), t.id+': theme value = average of subtheme pass rates');
  ok(fs.every(x=> t.subs.some(s=> s.name===x.g.sub) && x.g.seg && typeof x.ok==='boolean'), t.id+': every fact carries a subtheme, segment and pass/fail');
  ok(k.subs.every(s=> s.n===fs.filter(x=> x.g.sub===s.name).length), t.id+': drilling into a subtheme returns exactly its records');
  ok(M.dims[t.id][0]==='sub', t.id+': first drill level is the subtheme'); });
ok(M.kpi('t_ar', Object.assign({}, f0, { period:'Aug-26' })).v==null, 'snapshot-only themes are N/A for past months, not scored');
ok(M.kpi('health', f0).series.every((v,i)=> v==null || i===5), 'health trend never compares a past month on fewer themes');
ok(M.facts('t_rb', f0).filter(x=> x.kind==='open').every(x=> x.rec.decide==='Recognise'), 'in-transit DAP/DDP (control not passed) is excluded from billing timeliness');
ok(M.facts('t_oc', fBu0()).every(x=> (x.rec.e||x.rec.bu)==='IN-03'), 'business-unit filter applies to theme records');
ok(C.stages.map(s=>s.id).join()==='ord,crd,dsp,inv,col,csh', 'O2C stages are Order → Credit → Dispatch → Invoice → Collection → Cash');

const e = M.exposure(M.cases(f0));
ok(e.potential>0, 'potential exposure exists');
ok(!M.cases(f0).some(c=> M.ETYPE[c.type].basis==='ctl' && M.facts('exposure', f0).some(x=> x.rec.id===c.id)), 'control cases never add to Collections Exposure');
ok(X.cases.some(c=> c.ex==='O2C-STR-09'), 'Meridian pricing case is linked to the drawer exception');

const fBu = Object.assign({}, f0, { bu:'IN-03' });
ok(M.facts('revenue', fBu).every(x=> x.rec.e==='IN-03'), 'business-unit filter applies to billed revenue');
ok(M.nav.decode('kpi=overdue').kpi==='overdue', 'deep link kpi=overdue restores Overdue Receivables');

const geo = M.geoAgg(f0), geoR = M.geoAgg(f0, 'region');
ok(near(geo.tot.ar, M.kpi('ar', f0).v, 1e-6) && near(geoR.tot.ar, M.kpi('ar', f0).v, 1e-6), 'map: open AR by city and by region adds to Open Receivables');
ok(near(geo.tot.overdue, M.kpi('overdue', f0).v, 1e-6) && near(geo.tot.exposure, M.kpi('exposure', f0).v, 1e-6) && near(geo.tot.revenue, M.kpi('revenue', f0).v, 1e-6), 'map: overdue, exposure and billed revenue reconcile to the KPI sheet');
ok(geo.tot.dso===M.kpi('overdue', f0).dso, 'map: total DSO equals the sheet DSO');
ok(near(sum(M.facts('overdue', f0).filter(x=> x.g.city==='Delhi'), x=>x.val), (geo.rows.find(r=> r.city==='Delhi')||{overdue:0}).overdue, 1e-6), 'map: city breakdown on Overdue matches the map city');
const fW = Object.assign({}, f0, { region:'West India' });
ok(M.geoAgg(fW, 'region').rows.every(r=> r.region==='West India'), 'map: ribbon region filter applies');

const loc = M.locRisk(f0);
ok(near(loc.tot.ar, M.kpi('ar', f0).v, 1e-6) && near(sum(loc.cities, c=> c.ar), loc.tot.ar, 1e-6), 'location risk: city AR adds to Open Receivables');
ok(loc.hazards.length>0 && loc.hazards.every(h=> h.ar<=loc.tot.ar+1e-9), 'location risk: each hazard scenario is a part of open AR, never more');
ok(loc.pub.n>0 && near(loc.pub.ar + loc.pub.privAr, loc.tot.ar, 1e-6), 'location risk: public plus private AR is the whole book');
ok(loc.parents.length>0 && loc.parents.every(p=> p.n>=2 && p.cities>=1), 'location risk: parent groups link several customers');
ok(loc.top3>0 && loc.top3<=100 && loc.cities[loc.cities.length-1].cum>99.999, 'location risk: concentration shares run to 100%');
ok(M.locRisk(fW).cities.every(c=> c.region==='West India'), 'location risk: ribbon region filter applies');

/* credit utilisation */
const cb = M.creditBook(f0);
ok(cb.rows.length===M.customersIn(f0).length && cb.bySeg.reduce((a,r)=> a + Object.values(r.bands).reduce((b,x)=> b + x.length, 0), 0)===cb.rows.length, 'credit: every active customer sits in exactly one band');
ok(cb.rows.every(r=> near(r.used, r.ar + r.ord, 1e-6) && (r.limit? near(r.util, r.used/r.limit*100, 1e-6) : r.util==null)), 'credit: used = open AR + open orders, utilisation = used / limit');
ok(near(M.credit('C-50021').used - M.credit('C-50021').limit, 0.35, 0.011), 'credit: Helvetia is over its limit by ₹35 L');
ok(M.credit('C-40088').band==='near' && M.credit('C-40088').req > M.credit('C-40088').limit, 'credit: Medilink is near its limit with an increase requested');
ok(cb.rows.filter(r=> r.band==='over').length < cb.rows.length*0.25, 'credit: over-limit customers are a minority (limits calibrated to exposure)');
const hs = cb.rows.filter(r=> r.limit).map(r=> [r, M.creditHist(r.v)]);
ok(hs.every(([r,h])=> h.days.length===M.CREDIT_DAYS+1 && near(h.days[h.days.length-1].used, r.used, 1e-9) && near(h.days[h.days.length-1].limit, r.limit, 1e-9)), 'credit history ends exactly at today\'s used and limit');
ok(hs.every(([r,h])=> h.days.every(d=> d.used>=0)) && hs.every(([r,h])=> near(h.weeks[h.weeks.length-1].close, r.avail, 1e-9)), 'credit history: never negative; last week closes at today\'s available');
ok(hs.every(([r,h])=> h.weeks.every(w=> near(w.open - w.so + w.pay + w.lim, w.close, 1e-6))), 'credit consumption: opening − orders + payments + limit change = closing available');
ok(JSON.stringify(M.creditHist('C-40088').days)===JSON.stringify(M.creditHist('C-40088').days) && cb.tot.risk>0 && cb.tot.risk<100, 'credit risk share is between 0 and 100%');
ok(X.credit.filter(d=> d.kind==='limit' && d.ok).every(d=> near(d.rec, M.V[d.v].limit, 1e-9)), 'approved limit changes end at the current limit');
ok(cb.orders.length===X.orders.length, 'open sales order summary lists every open order');

console.log(fails? fails+' failed of '+n : n+' checks passed');
process.exit(fails? 1 : 0);
