/* FCT demo — Supply chain control tower: seeded ledger (illustrative; same output on every load).
   Builds stock lots (calibrated to the 30-Sep book: ₹642.0 Cr by category and ageing), forecast records (from data/sc/demand.js),
   PO lines, goods receipts, gate receipts and in-transit shipments not booked, cycle counts, production batches, dispatches,
   and one investigation case per named SC exception (data/sc.js, data/exceptions.js, data/sc/anomalies.js). */
(function(){
const D = window.FCT_DATA, X = D.sc3, C = X.config, R = X.rng(C.seed);
const SNAP = C.snap, MS = C.mStart;
const U = (a,b)=> a + R()*(b-a);
const r5 = (x)=> Math.round(x*1e5)/1e5;
const pick = (a)=> a[Math.floor(R()*a.length)];
const shuffle = (a)=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const PL = {}; C.plants.forEach(p=> PL[p.id] = p);
const V = {}; X.materials.forEach(m=>{ m.e = PL[m.plant].e; m.ex = m.exs || []; V[m.id] = m; });
const mats = X.materials;
const wpick = (pool)=>{ const t = pool.reduce((s,m)=> s+m.w, 0); let x = R()*t; for(const m of pool){ x -= m.w; if(x<=0) return m; } return pool[pool.length-1]; };
const base = (m)=> ({ v:m.id, e:m.e, plant:m.plant });

/* ---------- 1. stock lots, calibrated to category and ageing anchors ---------- */
const LOT = []; let lseq = 0;
const ageDays = [[5,88],[95,178],[190,360],[372,520]];
const mkLot = (m, cat, a, w, extra)=>{ const d = U(ageDays[a][0], ageDays[a][1]);
  const l = Object.assign({ id:'LOT-'+(70000 + (++lseq)), kind:'lot' }, base(m), { cat, age:a, w, rcv: Math.max(-200, 182 - d), days:Math.round(d), batch:'B-'+(4000+lseq), exp:null, reviewed:true }, extra||{});
  LOT.push(l); return l; };
mats.forEach(m=>{
  if(m.slow){ mkLot(m, m.cat, 3, m.w*.75); mkLot(m, m.cat, 2, m.w*.25); return; }
  if(m.expiry){ mkLot(m, m.cat, 1, m.w*.4, { exp:m.expiry }); mkLot(m, m.cat, 0, m.w*.6); return; }
  const n = 1 + Math.floor(R()*3);
  for(let i=0;i<n;i++){ const x = R(), a = m.cat==='wip'? (x<.9? 0 : 1) : x<.7? 0 : x<.85? 1 : x<.95? 2 : 3; mkLot(m, m.cat, a, m.w/n * U(.6,1.4)); }
  if(m.cat==='rm' && m.sup && /^V-300|V-100377|V-101144|V-100118/.test(m.sup)) mkLot(m, 'git', 0, 2 + m.w*.15);
});
/* near-expiry lots on named materials (provision bands) and an aged slice of US finished goods (NRV) */
mats.filter(m=> m.nrv).forEach(m=> mkLot(m, 'fg', 2, m.w*.3));
(function ipf(){
  const cats = C.cats, ages = C.ages;
  LOT.forEach(l=> l.val = l.w);
  for(let it=0; it<60; it++){
    cats.forEach(c=>{ const ls = LOT.filter(l=> l.cat===c.id), s = ls.reduce((t,l)=> t+l.val, 0); if(s) ls.forEach(l=> l.val *= c.anchor/s); });
    ages.forEach((a,i)=>{ const ls = LOT.filter(l=> l.age===i), s = ls.reduce((t,l)=> t+l.val, 0); if(s) ls.forEach(l=> l.val *= a.anchor/s); });
  }
  LOT.forEach(l=>{ l.val = r5(l.val); delete l.w; });
})();
const stockOf = {}; LOT.forEach(l=> stockOf[l.v] = (stockOf[l.v]||0) + l.val);
mats.forEach(m=>{
  const s = stockOf[m.id] || 0; m.stock = s;
  if(m.excess > s*.8) m.excess = r5(s*.8);
  m.cover = m.cover!=null? m.cover : m.excess>0? Math.round(m.maxD * s/Math.max(.01, s - m.excess)) : Math.round(U(m.minD+2, m.maxD-2));
  /* six months of consumption for XYZ: CoV close to the material's variability */
  const b = s / Math.max(1, m.cover) * 30, k = Math.sqrt(3)*m.cv;
  m.cons = C.months.map(()=> r5(Math.max(0.001, b*(1 + U(-k, k)))));
});

/* ---------- 2. forecast records (Apr–Sep) from the demand file ---------- */
const FC = []; const famMp = {}; mats.forEach(m=>{ if(m.fam) famMp[m.fam] = m; });
const dm = (D.scx && D.scx.demand) || { months:[], records:[] };
dm.records.forEach(r=>{ const m = C.months.indexOf(r.period), mp = famMp[r.material]; if(m<0 || !mp) return;
  const err = Math.abs(r.forecast - r.actual);
  FC.push(Object.assign({ id:'FC-'+r.material+'-'+r.period, kind:'fc' }, base(mp), { m, fam:r.family, fc:r.forecast, act:r.actual, val:r5(err), bias:r.forecast-r.actual, ok: err/r.actual <= 0.2 })); });

/* ---------- 3. PO lines (OTIF) ---------- */
const buyers = mats.filter(m=> m.sup && !/^V-9/.test(m.sup));
const PO = []; let pseq = 0;
const priceSup = { 'V-100512':[82,91], 'V-102208':[1180,1260], 'V-103310':[1030,1090], 'V-101144':[14200,15100], 'V-100118':[2340,2410] };
C.months.forEach((mo, m)=>{
  const n = 110 + m*4, ls = [];
  for(let i=0;i<n;i++){ const mp = (m>=3 && i<4)? V['KSM-17@IN-02A'] : (i===4 && m===5)? V['CAT-PDC@IN-05'] : wpick(buyers);
    const due = MS[m] + R()*(MS[m+1]-MS[m]-0.5);
    const l = Object.assign({ id:'PO-45001'+String(88000 + (++pseq)).slice(-5)+'-'+(10*(1+i%3)), kind:'po' }, base(mp), { sup:mp.sup, m, due, val:r5(U(0.01, 0.22) * (mp.w>8? 1.6 : 1)), ok:true });
    const p = priceSup[mp.sup]; if(p && m>=4 && R()<.5){ l.cp = p[0]; l.ip = p[1]; l.price = true; }
    ls.push(l); }
  const bad = n - Math.round(n * C.cal.otif[m]/100);
  const tk = new Map(ls.map(l=> [l, R()]));   /* tie-break keys drawn first: same order in every JS engine */
  const order = ls.slice().sort((a,b)=> ((b.sup==='V-100377' && m>=3) - (a.sup==='V-100377' && m>=3)) || ((b.sup==='V-101144') - (a.sup==='V-101144')) || (tk.get(a) - tk.get(b)));
  order.slice(0, bad).forEach(l=>{ l.ok = false; l.slip = Math.round(U(2, 16)); l.short = R()<.35; });
  ls.forEach(l=>{ l.del = l.ok? l.due - U(0, 1.5) : l.due + (l.slip||3); });
  PO.push(...ls);
});

/* ---------- 4. receipts: goods receipts posted, gate entries without a GR, in-transit shipments ---------- */
const GR = []; let gseq = 0;
C.months.forEach((mo, m)=>{
  const n = 520, ls = [];
  for(let i=0;i<n;i++){ const mp = wpick(buyers); ls.push(Object.assign({ id:'GR-50'+String(410000 + (++gseq)), kind:'gr' }, base(mp), { sup:mp.sup, m, at:MS[m] + R()*(MS[m+1]-MS[m]-0.2), lag:Math.round(U(3, 40)), val:r5(U(0.004, 0.05)), ok:true })); }
  const bad = m===5? (n + 142) - Math.round((n + 142) * C.cal.rcpt[m]/100) - 142 : n - Math.round(n * C.cal.rcpt[m]/100);
  const plantBias = (l)=> ({ 'IN-02A':3, 'IN-05':2, 'IN-04':1.5 }[l.plant] || 1);
  ls.slice().sort((a,b)=> plantBias(b)*R() - plantBias(a)*R()).slice(0, Math.max(0, bad)).forEach(l=>{ l.ok = false; l.lag = Math.round(U(52, 160)); });
  GR.push(...ls);
});
const GATE = [];
const gateNamed = [
  ['GP-A-30917','KSM-17@IN-02A','MH-04-KT-2210',181.9,'4500188120','KSM-17, 8.2 t','Invoice posted, blocked',0.62],
  ['GP-A-30911','SOLV-TOL@IN-02A','GJ-06-AX-8812',181.75,'4500187994','Toluene, 24 kL','Invoice posted, blocked',0.21],
  ['GP-05-2288','CAT-PDC@IN-05','MH-43-BK-0921',180.69,'4500188002','Pd/C catalyst, 40 kg','No invoice',0.38],
  ['GP-04-1172','RM-EXC-12@IN-04','KA-01-MN-4410',181.47,'4500187720','Excipient blend, 6 t','Invoice posted, blocked',0.18]
];
gateNamed.forEach(g=>{ const mp = V[g[1]]; GATE.push(Object.assign({ id:g[0], kind:'gate' }, base(mp), { sup:mp.sup, m:5, at:g[3], truck:g[2], po:g[4], what:g[5], inv:g[6], val:g[7], ok:false })); });
[['IN-02A',71,3.70,2.90],['IN-05',43,1.60,1.20],['IN-04',28,1.10,0.80]].forEach(([plant, n, tot, blocked])=>{
  const have = GATE.filter(g=> g.plant===plant), pool = buyers.filter(m=> m.plant===plant);
  let bLeft = blocked - have.filter(g=> g.inv!=='No invoice').reduce((s,g)=> s+g.val, 0), nLeft = (tot - blocked) - have.filter(g=> g.inv==='No invoice').reduce((s,g)=> s+g.val, 0);
  const k = n - have.length, nb = Math.round(k * .7);
  for(let i=0;i<k;i++){ const isB = i<nb, left = isB? bLeft : nLeft, rem = isB? nb-i : k-i;
    const val = r5(rem===1? left : Math.max(0.002, left/rem * U(.5, 1.5))); if(isB) bLeft -= val; else nLeft -= val;
    const mp = wpick(pool);
    GATE.push(Object.assign({ id:'GP-'+plant.replace('IN-','')+'-'+(3000+GATE.length), kind:'gate' }, base(mp), { sup:mp.sup, m:5, at:180 + R()*2.9, truck:'', po:'45001'+(87000+GATE.length), what:mp.name, inv:isB? 'Invoice posted, blocked' : 'No invoice', val, ok:false })); }
});
const GIT = [];
const gitNamed = [
  ['BL-MSCU-77120','KSM-17@IN-02A','V-100377','CIF Nhava Sheva',175,191,1.84,'Recognise'],
  ['BL-HLCU-55018','SOLV-DMF@IN-02A','V-300210','FOB Qingdao',178,196,0.96,'Recognise'],
  ['BL-MAEU-33091','INT-551@IN-02A','V-300230','CIF Mundra',171,188,1.42,'Recognise'],
  ['BL-ONEY-11872','CAT-PDC@IN-05','V-101144','FOB Busan',176,194,0.74,'Recognise'],
  ['AWB-176-4410','CAT-14@IN-05','V-300260','DAP Mumbai',182,185,0.62,'Exclude'],
  ['BL-CMDU-90021','KSM-04@IN-02A','V-300244','CFR Nhava Sheva',174,190,1.18,'Recognise']
];
gitNamed.forEach(g=>{ const mp = V[g[1]]; GIT.push(Object.assign({ id:g[0], kind:'git' }, base(mp), { sup:g[2], inco:g[3], bl:g[4], eta:g[5], val:g[6], decide:g[7], m:5, ok:false })); });
const imp = mats.filter(m=> m.git || (m.cat==='rm' && m.sup && /^V-300/.test(m.sup)));
let recLeft = C.rnbAnchor.git - GIT.filter(g=> g.decide==='Recognise').reduce((s,g)=> s+g.val, 0), exLeft = C.rnbAnchor.dapExcl - GIT.filter(g=> g.decide==='Exclude').reduce((s,g)=> s+g.val, 0);
for(let i=0;i<17;i++){ const isR = i<14, rem = isR? 14-i : 17-i, left = isR? recLeft : exLeft;
  const val = r5(rem===1? left : left/rem * U(.6, 1.4)); if(isR) recLeft -= val; else exLeft -= val;
  const mp = pick(imp), inco = isR? pick(['FOB Qingdao','CIF Nhava Sheva','CFR Mundra','FOB Shanghai']) : pick(['DAP Mumbai','DDP Pune']);
  GIT.push(Object.assign({ id:(isR? 'BL-' : 'AWB-')+pick(['MSCU','HLCU','MAEU','ONEY','CMDU'])+'-'+(60000+i*37), kind:'git' }, base(mp), { sup:mp.sup, inco, bl:170 + R()*12, eta:186 + R()*12, val, decide:isR? 'Recognise' : 'Exclude', m:5, ok:false }));
}

/* ---------- 5. cycle counts (record accuracy) ---------- */
const CNT = []; let cseq = 0;
const counted = mats.filter(m=> m.plant!=='JW');
C.months.forEach((mo, m)=>{
  const n = 250, ls = [];
  for(let i=0;i<n;i++){ const mp = wpick(counted); ls.push(Object.assign({ id:'CC-'+mp.plant.replace('-','')+'-'+(5000 + (++cseq)), kind:'count' }, base(mp), { m, at:MS[m] + R()*(MS[m+1]-MS[m]-0.2), val:r5(U(0.01, 0.12)), varPct:+U(-0.4, 0.4).toFixed(2), ok:true })); }
  const bad = n - Math.round(n * C.cal.ira[m]/100);
  const forced = m===5? ['CAT-PDC@IN-05','CAT-PDC@IN-05','CAT-14@IN-05','TR-DIS-02@IN-08','TR-DIS-02@IN-08'] : [];
  shuffle(ls.slice()).slice(0, bad).forEach((l,i)=>{ if(forced[i]){ const mp = V[forced[i]]; Object.assign(l, base(mp)); }
    l.ok = false; l.varPct = +(forced[i] && /CAT/.test(forced[i])? -U(9, 16) : (R()<.8? -1 : 1)*U(0.8, 4.5)).toFixed(2); l.custodian = forced[i]==='CAT-PDC@IN-05'; });
  CNT.push(...ls);
});

/* ---------- 6. production batches (yield) ---------- */
const BAT = []; let bseq = 0;
const makers = mats.filter(m=> PL[m.plant].make && (m.cat==='wip' || m.cat==='fg'));
const lsy = (D.sc && D.sc.batches) || { labels:[], yields:[] };
C.months.forEach((mo, m)=>{
  for(let i=0;i<18;i++){ const mp = wpick(makers), y = +U(84.6, 90.2).toFixed(1);
    BAT.push(Object.assign({ id:'BT-'+mp.plant.replace('-','')+'-'+(7000 + (++bseq)), kind:'batch' }, base(mp), { m, at:MS[m] + R()*(MS[m+1]-MS[m]-0.2), yld:y, std:88, val:r5(U(0.15, 1.2)), ok:y>=84 })); }
});
lsy.labels.forEach((lab, i)=>{ const mo = lab.slice(2,4)==='07'? 3 : lab.slice(2,4)==='08'? 4 : 5, y = lsy.yields[i], mp = V['API-L71@IN-02A'];
  BAT.push(Object.assign({ id:lab, kind:'batch' }, base(mp), { m:mo, at:MS[mo] + (+lab.slice(4))-0.5, yld:y, std:88, val:r5(y<80? 1.05 : U(.6, 1.1)), ok:y>=84 })); });

/* ---------- 7. dispatches (cut-off and 3PL) ---------- */
const SHP = []; let sseq = 0;
const sellers = mats.filter(m=> m.cat==='fg');
C.months.forEach((mo, m)=>{
  for(let i=0;i<26;i++){ const mp = wpick(sellers), at = MS[m] + R()*(MS[m+1]-MS[m]-0.3), inco = pick(['EXW','FCA','DAP','CIF']);
    SHP.push(Object.assign({ id:'DSP-'+mp.plant.replace('-','')+'-'+(80000 + (++sseq)), kind:'ship' }, base(mp), { m, at, inco, dlv: at + (/DAP|CIF/.test(inco)? U(1,6) : 0), val:r5(U(0.05, 0.6)), ok:true })); }
});
[0.71,0.58,0.62,0.39].forEach((v,i)=>{ const mp = V['FG-IN-2290@IN-03']; SHP.push(Object.assign({ id:'DSP-IN03-8'+(9101+i), kind:'ship' }, base(mp), { m:5, at:182.6 + i*.05, inco:'DAP', dlv:184 + i*.4, val:v, ok:false, iss:'cutoff', ex:'SC-CUT-28' })); });
(function(){ const mp = V['FG-EU-1204@EU-01']; SHP.push(Object.assign({ id:'3PL-EU01-0930', kind:'ship' }, base(mp), { m:5, at:182.9, inco:'Stock report', dlv:null, val:0.64, ok:false, iss:'tpl', ex:'SC-3PL-26' })); })();

/* ---------- 8. valuation review scope ---------- */
const forcedOpen = new Set(['CAT-14@IN-05','INT-332@IN-05','RM-881@IN-05','FG-US-4471@US-01']);
const scope = LOT.filter(l=> l.age>=2 || (l.exp!=null && l.exp<=180) || (V[l.v].nrv && l.cat==='fg'));
scope.forEach(l=>{ l.inScope = true; l.reason = l.exp!=null && l.exp<=180? 'Expiring within 180 days' : V[l.v].nrv && l.cat==='fg'? 'NRV test (held for sale abroad)' : 'Over 180 days old'; l.reviewed = !forcedOpen.has(l.v); });
(function(){ const want = Math.round(scope.length * .84); let ok = scope.filter(l=> l.reviewed).length;
  shuffle(scope.filter(l=> l.reviewed)).forEach(l=>{ if(ok>want){ l.reviewed = false; ok--; } }); })();

/* ---------- 9. issues on records ---------- */
FC.forEach(r=>{ r.issues = r.ok? [] : [r.bias>0? 'fcOver' : 'fcUnder']; });
PO.forEach(l=>{ l.issues = []; if(!l.ok) l.issues.push('late'); if(l.price) l.issues.push('price'); });
GR.forEach(l=>{ l.issues = l.ok? [] : ['grLate']; });
GATE.forEach(g=>{ g.issues = ['noGr']; });
GIT.forEach(g=>{ g.issues = g.decide==='Recognise'? ['git'] : []; });
CNT.forEach(c=>{ c.issues = c.ok? [] : ['cnt']; });
BAT.forEach(b=>{ b.issues = b.ok? [] : ['yield']; });
SHP.forEach(s=>{ s.issues = s.iss? [s.iss] : []; });
LOT.forEach(l=>{ const m = V[l.v]; l.issues = [];
  if(l.age>=2) l.issues.push('slow'); if(l.exp!=null && l.exp<=180) l.issues.push('nearExp'); if(m.nrv && l.cat==='fg' && !l.reviewed) l.issues.push('nrv'); });

/* ---------- 10. cases: one per named SC exception, one estimate each ---------- */
const CS = [];
const meta = (D.scx && D.scx.meta) || {};
const ids = (arr)=> arr.map(x=> x.id);
const caseMap = [
  ['SC-INV-01','expiry','CAT-14@IN-05', ()=> ids(LOT.filter(l=> l.exp!=null && l.exp<=180))],
  ['SC-SUP-02','supplier','KSM-17@IN-02A', ()=> ids(PO.filter(l=> l.sup==='V-100377' && !l.ok).slice(-6))],
  ['SC-GIT-06','git','KSM-17@IN-02A', ()=> ids(GIT)],
  ['SC-GRL-10','gr','KSM-17@IN-02A', ()=> ids(GATE)],
  ['SC-CNT-04','count','CAT-PDC@IN-05', ()=> ids(CNT.filter(c=> !c.ok && c.plant==='IN-05' && c.m===5))],
  ['SC-ADJ-12','adjust','TR-DIS-01@IN-08', ()=> []],
  ['SC-JWK-05','jobwork','JW-DEC-01@JW', ()=> ids(LOT.filter(l=> l.plant==='JW'))],
  ['SC-NRV-03','nrv','FG-US-4471@US-01', ()=> ids(LOT.filter(l=> l.issues.includes('nrv')))],
  ['SC-VAR-13','yield','API-L71@IN-02A', ()=> ids(BAT.filter(b=> !b.ok && b.v==='API-L71@IN-02A'))],
  ['SC-URP-08','urp','FG-US-4402@US-01', ()=> ids(LOT.filter(l=> l.plant==='US-01').slice(0,6))],
  ['SC-DPS-14','stmt','FG-IN-2210@IN-03', ()=> []],
  ['SC-PPV-07','price','SOLV-TOL@IN-02A', ()=> ids(PO.filter(l=> l.price))],
  ['SC-NPO-09','nopo','STS-MNT@IN-03', ()=> []],
  ['SC-EXC-11','excess','KSM-04@IN-02A', ()=> ids(LOT.filter(l=> V[l.v].excess>0 && l.cat!=='git'))],
  ['SC-FCB-15','forecast','FG-US-4471@US-01', ()=> ids(FC.filter(r=> r.fam==='USG' && r.m>=3))],
  ['SC-FCB-16','forecast','API-V12@IN-02A', ()=> ids(FC.filter(r=> r.fam==='API' && r.m>=3))],
  ['SC-SHT-22','shortage','FG-EU-1180@EU-01', ()=> ids(FC.filter(r=> r.fam==='EUB' && r.m>=4))],
  ['SC-FCB-17','forecast','SC-ACX-11@IN-05', ()=> ids(FC.filter(r=> r.fam==='SPC' && r.m>=3))],
  ['SC-MRP-20','mrp','FG-US-4519@US-01', ()=> []],
  ['SC-FCB-18','override','FG-IN-2290@IN-03', ()=> ids(FC.filter(r=> r.fam==='INF' && r.m===5))],
  ['SC-FCB-19','override','FG-NUT-310@IN-06', ()=> []],
  ['SC-SFT-21','ss','FG-IN-2314@IN-03', ()=> []],
  ['SC-NEG-23','negstk','TR-DIS-02@IN-08', ()=> ids(CNT.filter(c=> !c.ok && c.v==='TR-DIS-02@IN-08'))],
  ['SC-3PL-26','tpl','FG-EU-1204@EU-01', ()=> ['3PL-EU01-0930']],
  ['SC-CNT-25','cntcov','FG-IN-2210@IN-03', ()=> []],
  ['SC-CON-40','consign','TR-DIS-01@IN-08', ()=> []],
  ['SC-BTC-24','batch','LSI-VIT-03@IN-04', ()=> ids(LOT.filter(l=> l.v==='LSI-VIT-03@IN-04'))],
  ['SC-RTV-27','rtv','RM-881@IN-05', ()=> []],
  ['SC-CUT-28','cutoff','FG-IN-2290@IN-03', ()=> ids(SHP.filter(s=> s.ex==='SC-CUT-28'))],
  ['SC-GRN-29','grqty','RM-EXC-12@IN-04', ()=> ids(GR.filter(g=> g.v==='RM-EXC-12@IN-04' && g.m===5).slice(0,9))],
  ['SC-ASN-30','asn','RM-EXC-12@IN-04', ()=> []],
  ['SC-STD-31','cost','KSM-04@IN-02A', ()=> []],
  ['SC-OVH-32','cost','SC-PYR-04@IN-05', ()=> ids(BAT.filter(b=> b.v==='SC-PYR-04@IN-05' && b.m===5))],
  ['SC-SCR-33','cost','API-L71@IN-02A', ()=> []],
  ['SC-SLW-39','slow','INT-332@IN-05', ()=> ids(LOT.filter(l=> l.age>=2 && l.plant==='IN-05'))],
  ['SC-FX-34','fx','FG-EU-1180@EU-01', ()=> ids(LOT.filter(l=> l.plant==='EU-01').slice(0,4))],
  ['SC-SUP-35','supplier','CAT-PDC@IN-05', ()=> ids(PO.filter(l=> l.sup==='V-101144' && !l.ok))],
  ['SC-SUP-36','supplier','PM-HDPE@IN-02A', ()=> []],
  ['SC-SUP-37','coa','PM-LDPE@IN-06', ()=> []],
  ['SC-ADV-38','advance','INT-551@IN-02A', ()=> []]
];
const TY = {}; C.exposureTypes.forEach(t=> TY[t.id] = t);
caseMap.forEach(([ex, type, v, linesFn], i)=>{
  const x = (D.exceptions||[]).find(e=> e.id===ex); if(!x || !V[v]) return;
  const parts = (meta[ex] && meta[ex].exp) || [], s = (b)=> parts.filter(p=> b.includes(p[2])).reduce((t,p)=> t+p[1], 0);
  const ce = s(['c','e']), p = s(['p']), fin = TY[type].basis==='fin';
  CS.push({ id:'CS-'+ex.slice(3), type, v, ex, lines:linesFn(), parts,
    est: fin? (ce>0? r5(ce) : null) : null, contingent: p>0? r5(p) : null, affected: fin? null : (ce+p>0? r5(ce+p) : null),
    conf: (x.ai && x.ai.confidence) || .75, st:'open', opened: SNAP - (2 + (i*7)%26) - R(), note: x.subject || '' });
});

X.lots = LOT; X.fc = FC; X.po = PO; X.gr = GR; X.gate = GATE; X.git = GIT; X.counts = CNT; X.batches = BAT; X.ships = SHP; X.cases = CS;
X.lines = [].concat(LOT, FC, PO, GR, GATE, GIT, CNT, BAT, SHP);
})();
