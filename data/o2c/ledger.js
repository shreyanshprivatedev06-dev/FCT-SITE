/* FCT demo — O2C control tower: seeded ledger (illustrative; same output on every load).
   Builds invoices with Order → Credit → Dispatch → Invoice → Collection → Cash chain,
   open orders, unbilled dispatches, unapplied receipts and investigation cases.
   Snapshot AR ageing and named-customer balances match data/o2c.js / BUILD_PLAN. */
(function(){
const D = window.FCT_DATA, X = D.o2cx, C = X.config, R = X.rng(C.seed);
const SNAP = C.snap, MS = C.mStart;
const U = (a,b)=> a + R()*(b-a);
const r2 = (x)=> Math.round(x*100)/100;
const r5 = (x)=> Math.round(x*1e5)/1e5;
const shuffle = (a)=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const pick = (a)=> a[Math.floor(R()*a.length)];
const V = {}; X.customers.forEach(c=> V[c.id]=c);
const cat = {}; C.cats.forEach(c=> cat[c.id]=c);
const active = X.customers.filter(c=> c.status==='Active');
const namedIds = new Set(['C-40102','C-40088','C-40110','C-50021','C-40240','C-60014','C-40188','C-40155','C-40302','C-40118','C-40410','C-40440']);

const L = []; let nseq = 0;
const mkId = ()=> 'INV-'+(260000 + (++nseq));
const refFor = (e, n)=> 'INV-'+e.replace('-','')+'-'+(80000+n);
const incoterms = ['EXW','FCA','FOB','CIF','DAP','DDP'];
const siteFor = (e)=> ({ 'IN-02':'IN-02 Plant A','IN-03':'IN-03 Plant','IN-04':'IN-04 Plant','IN-05':'IN-05 Plant','IN-06':'IN-06 Plant','IN-08':'IN-08 Central DC','US-01':'US-01 3PL','EU-01':'EU-01 3PL','IN-01':'IN-01 HQ','IN-07':'IN-07 Labs' }[e] || e);

/* ---------- 1. billed invoices (paid or still open) per month ---------- */
const byCust = {};
active.forEach(c=>{ const w = (c.ar||0.4) + (namedIds.has(c.id)? 3 : 0.2+R()); byCust[c.id] = w; });
const wS = Object.values(byCust).reduce((s,x)=>s+x,0);

C.revenueM.forEach((target, m)=>{
  const n = 420 + m*18; let left = target;
  for(let i=0;i<n;i++){
    let x = R()*wS, id = active[0].id;
    for(const c of active){ x -= byCust[c.id]; if(x<=0){ id=c.id; break; } }
    const v = V[id], last = i===n-1;
    const amt = last? r5(Math.max(0.01, left)) : r5(Math.max(0.02, target/n * U(0.35, 2.1)));
    left -= amt;
    const invD = MS[m] + R()*(MS[m+1]-MS[m]-0.2);
    const terms = v.terms || 45;
    const due = invD + terms;
    const soD = invD - U(4, 18);
    const crdHold = (v.seg==='Distributor' && R()<.08) || (v.limit && (v.ar||0)>(v.limit*0.95) && R()<.35);
    const dspD = soD + U(1, 8);
    const inco = v.foreign? pick(['FOB','CIF','DAP','DDP']) : pick(['EXW','FCA','FOB','DAP']);
    const pod = /DAP|DDP/.test(inco)? dspD + U(1, 6) : dspD;
    const billLag = pod + (R()<0.11? U(2.1, 8) : U(0.1, 1.8));
    L.push({ id:mkId(), ref:refFor(v.bu, nseq), v:id, cat:v.cat, e:v.bu, site:siteFor(v.bu), m, invD, due, amt, terms, cn:false,
      so:'SO-'+v.bu+'-'+(21000+nseq), soD, crdHold, crdOk:!crdHold, dspD, inco, pod, billed:billLag, lateBill: billLag-pod > 2,
      paid:null, pSt:'Open', disputed:false, ptp:null });
  }
});
L.forEach(l=>{ if(R()<.007){ l.cn = true; l.amt = -r5(Math.abs(l.amt)*U(0.2,0.6)); l.pSt = 'Credit note'; } });

/* ---------- 2. pay most invoices; leave a pool to become snapshot AR ---------- */
const paidShare = { 0:.92, 1:.90, 2:.88, 3:.84, 4:.78, 5:.62 };
L.forEach(l=>{
  if(l.cn) return;
  const payBy = l.due + (R()<0.78? U(-8, 2) : U(1, 35));
  if(payBy < SNAP && R() < (paidShare[l.m]||.7) && !(namedIds.has(l.v) && l.m>=4 && R()<.55)){
    l.paid = Math.min(payBy, SNAP-0.2); l.pSt = 'Paid';
  }
});

/* ---------- 3. snapshot AR: force ageing totals, then pin named customers ---------- */
const BUCKETS = [
  { id:'current', name:'Not due', lo:-1e9, hi:0, target:C.arAnchor.current },
  { id:'d30', name:'1–30 days', lo:0, hi:30, target:C.arAnchor.d30 },
  { id:'d60', name:'31–60 days', lo:30, hi:60, target:C.arAnchor.d60 },
  { id:'d90', name:'61–90 days', lo:60, hi:90, target:C.arAnchor.d90 },
  { id:'d90p', name:'Over 90 days', lo:90, hi:1e9, target:C.arAnchor.d90p }
];
const odDays = (l)=> SNAP - l.due;
const bucketOf = (l)=>{ const d = odDays(l); return BUCKETS.find(b=> d>b.lo && d<=b.hi) || BUCKETS[0]; };

const namedAR = [
  { id:'C-40102', current:2.1, d30:0, d60:0, d90:3.1, d90p:0 },
  { id:'C-40088', current:8.0, d30:1.8, d60:0, d90:0, d90p:0 },
  { id:'C-40110', current:0, d30:0, d60:3.3, d90:0, d90p:0 },
  { id:'C-50021', current:1.45, d30:0.9, d60:0, d90:0, d90p:0 },
  { id:'C-40240', current:1.4, d30:0.5, d60:0, d90:0, d90p:0 },
  { id:'C-60014', current:0.7, d30:0.7, d60:0, d90:0, d90p:0 },
  { id:'C-40188', current:2.18, d30:0.42, d60:0, d90:0, d90p:0 },
  { id:'C-40155', current:0.99, d30:0, d60:0.31, d90:0, d90p:0 },
  { id:'C-40302', current:0.53, d30:0.27, d60:0, d90:0, d90p:0 },
  { id:'C-40118', current:0.62, d30:0, d60:0, d90:0, d90p:0 }
];

function placeOpen(vid, bucketId, amt, extra){
  const b = BUCKETS.find(x=>x.id===bucketId);
  const v = V[vid]; if(!v || amt<=0.001) return null;
  const due = bucketId==='current'? SNAP + U(5, v.terms||45) : SNAP - U(b.lo+1, Math.min(b.hi===1e9? 140 : b.hi, b.lo+28));
  const invD = due - (v.terms||45);
  const m = invD<0? 0 : Math.min(5, C.mStart.reduce((acc,s,i)=> invD>=s? i : acc, 0));
  const l = Object.assign({ id:mkId(), ref:refFor(v.bu, nseq), v:vid, cat:v.cat, e:v.bu, site:siteFor(v.bu), m, invD, due, amt:r5(amt), terms:v.terms||45, cn:false,
    so:'SO-'+v.bu+'-'+(21000+nseq), soD:invD-U(6,16), crdHold:false, crdOk:true, dspD:invD-U(2,8), inco:v.foreign? 'DAP':'FCA',
    pod:invD-U(0.5,4), billed:invD, lateBill:false, paid:null, pSt:'Open', disputed:false, ptp:null, pin:!!(extra&&extra.pin) }, extra||{});
  L.push(l); return l;
}

namedAR.forEach(row=>{
  BUCKETS.forEach(b=>{ const a = row[b.id]; if(a) placeOpen(row.id, b.id, a, { pin:true }); });
});
/* Meridian 9 disputed invoices */
(()=>{ const ls = L.filter(l=> l.v==='C-40102' && l.pSt==='Open' && odDays(l)>60); ls.slice(0,9).forEach(l=>{ l.disputed = true; l.reason = 'Pricing'; l.pSt = 'Disputed'; }); })();
(()=>{ const l = L.find(l=> l.v==='C-40240' && l.pSt==='Open' && odDays(l)>0); if(l){ l.disputed = true; l.reason = 'Shortage'; l.pSt = 'Disputed'; l.ex = 'O2C-DED-10'; l.ref = 'INV-IN04-31144'; } })();
(()=>{ const l = L.find(l=> l.v==='C-40110' && l.pSt==='Open'); if(l){ l.ptp = 183; l.ptpKept = false; l.ex = 'O2C-PTP-08'; } })();

const usedNamed = namedAR.reduce((s,r)=> s + BUCKETS.reduce((t,b)=> t+(r[b.id]||0), 0), 0);
const restCust = active.filter(c=> !namedAR.some(r=>r.id===c.id));
BUCKETS.forEach(b=>{
  const namedSum = namedAR.reduce((s,r)=> s+(r[b.id]||0), 0);
  let left = b.target - namedSum;
  const n = b.id==='current'? 86 : b.id==='d30'? 40 : b.id==='d60'? 22 : 14;
  for(let i=0;i<n && left>0.02;i++){
    const v = restCust[Math.floor(R()*restCust.length)];
    const a = i===n-1? left : Math.min(left, (left/(n-i))*U(0.4,1.8));
    placeOpen(v.id, b.id, a); left -= a;
  }
  if(left>0.02) placeOpen(restCust[0].id, b.id, left);
});

/* first pass: scale non-pinned open invoices in each bucket toward the anchor */
BUCKETS.forEach(b=>{
  const ls = L.filter(l=> !l.cn && (l.paid==null || l.paid>SNAP) && bucketOf(l).id===b.id);
  const pinned = ls.filter(l=> l.pin), free = ls.filter(l=> !l.pin);
  const need = b.target - pinned.reduce((s,l)=>s+l.amt,0);
  const freeSum = free.reduce((s,l)=>s+l.amt,0) || 1;
  if(need <= 0){ free.forEach(l=>{ l.paid = SNAP-0.5; l.pSt = 'Paid'; }); return; }
  free.forEach(l=>{ l.amt = r5(Math.max(0.01, l.amt/freeSum*need)); });
});

/* ---------- 4. collections targeting + promises (Sep) ---------- */
const overdueAtSep = L.filter(l=> !l.cn && l.pSt!=='Credit note' && l.due < MS[5] && (l.paid==null || l.paid>=MS[5]));
overdueAtSep.forEach(l=>{
  l.targeted = namedIds.has(l.v) || l.amt>0.08 || R()<.55;
  if(l.targeted && l.paid!=null && l.paid>=MS[5] && l.paid<MS[6]) l.collectedSep = true;
});
/* promises due in Sep */
const promises = [];
L.filter(l=> !l.cn && l.m>=3 && l.amt>0.05).forEach(l=>{
  if(R()>.12 && !l.ptp) return;
  const dueP = (l.ptp!=null? l.ptp : MS[5] + U(2, 28));
  if(dueP<MS[5] || dueP>=MS[6]) return;
  const kept = l.v==='C-40110'? false : R()<0.71;
  l.ptp = dueP; l.ptpKept = kept;
  if(kept && l.paid==null){ l.paid = dueP + U(0, 1.5); if(l.paid<SNAP) l.pSt = 'Paid'; }
  promises.push(l);
});
X.promises = promises;

/* calibrate collection success to 78% */
(()=>{
  const tgt = overdueAtSep.filter(l=> l.targeted);
  const want = Math.round(tgt.length * 0.78);
  let got = tgt.filter(l=> l.collectedSep || (l.paid!=null && l.paid>=MS[5] && l.paid<MS[6])).length;
  const unpaid = shuffle(tgt.filter(l=> l.paid==null && !namedIds.has(l.v) && !l.disputed));
  const paid = shuffle(tgt.filter(l=> l.paid!=null && l.paid>=MS[5] && l.paid<MS[6] && !namedIds.has(l.v)));
  while(got < want && unpaid.length){ const l = unpaid.pop(); l.paid = MS[5]+U(2,28); l.pSt='Paid'; l.collectedSep=true; got++; }
  while(got > want && paid.length){ const l = paid.pop(); l.paid = null; l.pSt='Open'; l.collectedSep=false; got--; }
})();
/* calibrate promises kept to 71% */
(()=>{
  const due = L.filter(l=> l.ptp!=null && l.ptp>=MS[5] && l.ptp<MS[6]);
  const want = Math.round(due.length * 0.71);
  let got = due.filter(l=> l.ptpKept).length;
  const broken = shuffle(due.filter(l=> !l.ptpKept && l.v!=='C-40110'));
  const kept = shuffle(due.filter(l=> l.ptpKept && l.v!=='C-40110'));
  while(got < want && broken.length){ const l = broken.pop(); l.ptpKept = true; got++; }
  while(got > want && kept.length){ const l = kept.pop(); l.ptpKept = false; got--; }
})();

/* re-pin snapshot AR after collection/promise payments moved balances */
BUCKETS.forEach(b=>{
  const isOpen = (l)=> !l.cn && (l.paid==null || l.paid>SNAP);
  const inB = ()=> L.filter(l=> isOpen(l) && bucketOf(l).id===b.id);
  const pinnedSum = inB().filter(l=> l.pin).reduce((s,l)=> s+l.amt, 0);
  const need = b.target - pinnedSum;
  inB().filter(l=> !l.pin).forEach(l=>{ l.paid = MS[5]+U(4, 26); l.pSt = 'Paid'; if(l.targeted) l.collectedSep = true; });
  if(need <= 0.01) return;
  let left = need; const n = b.id==='current'? 48 : b.id==='d30'? 22 : 12;
  for(let i=0;i<n && left>0.01;i++){
    const v = restCust[i % restCust.length];
    const a = i===n-1? left : Math.min(left, (left/(n-i))*U(0.5,1.6));
    placeOpen(v.id, b.id, a); left -= a;
  }
  if(left>0.01) placeOpen(restCust[0].id, b.id, left);
});

/* billed revenue follows C.revenueM: AR shaping and the re-pin above resize and add open invoices, so paid invoices of the month absorb the difference
   (open AR, its ageing and the named customers are untouched). No random draws here. */
C.revenueM.forEach((target, m)=>{
  const ls = L.filter(l=> l.m===m), billed = ls.reduce((s,l)=> s+l.amt, 0);
  const paid = ls.filter(l=> !l.cn && l.paid!=null && l.paid<=SNAP && !l.pin && !namedIds.has(l.v)), pS = paid.reduce((s,l)=> s+l.amt, 0);
  if(!pS) return; const k = Math.max(0.05, (pS + target - billed)/pS);
  paid.forEach(l=>{ l.amt = r5(Math.max(0.01, l.amt*k)); });
});

/* ---------- 5. cash application receipts ---------- */
const RCP = [];
const matchN = 138, lowN = 8, noneN = 6;
const sepPaid = L.filter(l=> !l.cn && l.paid!=null && l.paid>=MS[5] && l.paid<SNAP);
for(let i=0;i<matchN+lowN+noneN;i++){
  const high = i<matchN, low = i>=matchN && i<matchN+lowN;
  const inv = sepPaid[i % Math.max(1, sepPaid.length)] || L[i];
  const conf = high? U(0.82, 0.99) : low? U(0.50, 0.72) : U(0.20, 0.45);
  RCP.push({ id:'RCP-'+(1000+i), v:inv? inv.v : pick(active).id, e:inv? inv.e : 'IN-02', date: SNAP - U(1, 18),
    amt: inv? inv.amt : r5(U(0.2, 2.4)), ref: high? (inv? inv.ref : 'SEP PYMT') : (low? 'SEP PYMT' : '—'),
    conf:+conf.toFixed(2), st: high? 'Suggested' : low? 'Low confidence' : 'Remittance needed',
    lines: inv? [inv.id] : [], m:5 });
}
RCP[matchN] = Object.assign(RCP[matchN]||{}, { id:'RCP-1004-0331', v:'C-40088', e:'IN-02', amt:1.84, ref:'SEP PYMT', conf:0.64, st:'Low confidence', ex:'O2C-CSH-11', date:SNAP-1 });
X.receipts = RCP;

/* ---------- 6. unbilled dispatches (cut-off) + wrong-period ---------- */
const UB = [];
const dispRows = [
  ['DSP-IN02-77812','C-40088','IN-02','FCA',0.62,'Recognise'],
  ['DSP-IN02-77830','C-40110','IN-02','EXW',0.41,'Recognise'],
  ['DSP-IN04-31144','C-40240','IN-04','DAP',0.38,'Recognise'],
  ['DSP-IN02-77801','C-40102','IN-02','DAP',0.55,'Recognise'],
  ['DSP-IN02-77819','C-40188','IN-02','FCA',0.29,'Recognise'],
  ['DSP-IN04-31150','C-40302','IN-04','FOB',0.33,'Recognise'],
  ['DSP-IN04-31158','C-40302','IN-04','DAP',0.27,'Exclude'],
  ['DSP-IN02-77841','C-40088','IN-02','DDP',0.33,'Exclude'],
  ['DSP-IN02-77846','C-60014','IN-02','CIF',0.48,'Recognise'],
  ['DSP-IN04-31161','C-40240','IN-04','DAP',0.12,'Exclude']
];
dispRows.forEach((d,i)=>{
  const v = V[d[1]]; const dspD = 182 - (i%4)*0.6;
  UB.push({ id:d[0], v:d[1], e:d[2], cat:v.cat, site:siteFor(d[2]), dspD, inco:d[3], val:d[4], decide:d[5],
    pod: d[5]==='Recognise'? ( /DAP|DDP/.test(d[3])? 182.7 : dspD) : 184+i*0.4, billed:null, m:5 });
});
let ubLeft = 5.40 - dispRows.filter(d=>d[5]==='Recognise').reduce((s,d)=>s+d[4],0);
for(let i=0;i<21;i++){
  const v = pick(active); const val = r5(i===20? Math.max(0.05, ubLeft) : U(0.08, 0.35)); ubLeft -= val;
  UB.push({ id:'DSP-IN'+v.bu.slice(-2)+'-77'+(900+i), v:v.id, e:v.bu, cat:v.cat, site:siteFor(v.bu), dspD:181+R()*2, inco:pick(incoterms),
    val, decide:'Recognise', pod:181.5+R()*1.5, billed:null, m:5 });
}
X.unbilled = UB;
/* wrong-period invoice */
const wpi = { id:mkId(), ref:'INV-IN04-31170', v:'C-40302', cat:'lsi', e:'IN-04', site:siteFor('IN-04'), m:5, invD:182.8, due:212, amt:1.12, terms:30, cn:false,
  so:'SO-IN04-22051', soD:176, crdOk:true, crdHold:false, dspD:182.7, inco:'DAP', pod:186.4, billed:182.8, lateBill:false, paid:null, pSt:'Open',
  disputed:false, wpi:true, ex:'O2C-WPI-12' };
L.push(wpi);

/* ---------- 7. open sales orders (credit stage) ---------- */
const ORD = [
  { id:'SO-IN02-22901', v:'C-40088', e:'IN-02', cat:'frm', val:7.4, soD:SNAP-4, crdHold:true, reason:'Limit request in flight', ex:'O2C-CRL-07' },
  { id:'SO-EU01-1044', v:'C-50021', e:'EU-01', cat:'dst', val:0.35, soD:SNAP-2, crdHold:true, reason:'Over limit ₹35 L', ex:'O2C-CRD-05' },
  { id:'SO-IN08-4412', v:'C-40188', e:'IN-08', cat:'frm', val:0.4, soD:SNAP-1, crdHold:false, reason:'Within auto-approval' }
];
for(let i=0;i<24;i++){
  const v = pick(active);
  ORD.push({ id:'SO-'+v.bu+'-'+(23000+i), v:v.id, e:v.bu, cat:v.cat, val:r5(U(0.08, 1.6)), soD:SNAP-U(0.5, 12), crdHold:R()<.12, reason: R()<.12? 'Credit review':'Released' });
}
ORD.forEach(o=>{ o.rem = o.val; o.po = o.id; o.poLn = ''; o.poD = o.soD; o.edd = o.soD; o.st = o.reason; });
X.orders = ORD;

/* ---------- 7b. credit limits calibrated to exposure ----------
   The master file carries indicative limits; here each active customer's limit is set against what it actually uses at the
   snapshot (open AR + open orders), so utilisation reads like a real credit book. A hash of the id picks the utilisation
   band, so the random stream (and every other seeded number) is untouched. Named stories are pinned:
   Helvetia is over its limit by ₹35 L; Medilink is near its limit with an increase requested at 1.5×. */
const usedAt = {}; L.forEach(l=>{ if(!l.cn && (l.paid==null || l.paid>SNAP)) usedAt[l.v] = (usedAt[l.v]||0) + l.amt; });
ORD.forEach(o=> usedAt[o.v] = (usedAt[o.v]||0) + o.rem);
const hash01 = (id)=>{ let h = 2166136261; for(const ch of id){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h>>>0) % 10000)/10000; };
const roundLim = (x)=> x>=5? Math.round(x*2)/2 : Math.max(0.1, Math.round(x*20)/20);
const UTIL_PIN = { 'C-40088':96, 'C-40102':104, 'C-40110':93, 'C-40440':108, 'C-40188':71, 'C-40155':82, 'C-40240':64, 'C-60014':58, 'C-40302':41 };
X.customers.filter(v=> v.status==='Active').forEach(v=>{
  const used = (usedAt[v.id]||0) + (v.openOrd||0); if(used<=0) return;
  const reqRatio = v.reqLimit && v.limit? v.reqLimit/v.limit : null;
  if(v.id==='C-50021'){ v.limit = r2(used - 0.35); return; }
  const h = hash01(v.id), weak = (v.score||70) < 62;
  const util = UTIL_PIN[v.id] || (h < (weak? .16 : .07)? 101 + h*150 : h < (weak? .34 : .2)? 90 + (h*1000 % 10) : 35 + (h*1000 % 53));
  v.limit = roundLim(used/(util/100));
  if(reqRatio) v.reqLimit = roundLim(v.limit*reqRatio);
});

/* ---------- 8. credit decisions in the period ---------- */
const CR = [
  { id:'CR-40088', v:'C-40088', e:'IN-02', kind:'limit', ok:false, req:V['C-40088'].reqLimit, rec:roundLim(V['C-40088'].limit*1.25), cur:V['C-40088'].limit, score:66, ex:'O2C-CRL-07', at:SNAP-3 },
  { id:'CR-50021', v:'C-50021', e:'EU-01', kind:'hold', ok:true, req:2, rec:2, cur:2, score:61, ex:'O2C-CRD-05', at:SNAP-2 },
  { id:'CR-40188', v:'C-40188', e:'IN-08', kind:'limit', ok:true, req:V['C-40188'].reqLimit, rec:V['C-40188'].limit, cur:roundLim(V['C-40188'].limit/1.1), score:78, auto:true, at:SNAP-5 },
  { id:'CR-40155', v:'C-40155', e:'IN-03', kind:'limit', ok:true, req:V['C-40155'].reqLimit, rec:V['C-40155'].limit, cur:roundLim(V['C-40155'].limit/1.15), score:70, auto:true, at:SNAP-6 }
];
for(let i=0;i<40;i++){
  const v = pick(active); const ok = R()<0.93, kind = pick(['limit','terms','release']), a = U(1,1.3), b = U(1,1.2), lim = v.limit||1;
  /* an approved limit change ends at today's limit, so the limit timeline and the change list agree */
  const up = kind==='limit' && ok;
  CR.push({ id:'CR-'+(4100+i), v:v.id, e:v.bu, kind, ok, req:r2(up? lim*Math.max(a,b)/b : lim*a), rec:up? lim : r2(lim*b), cur:up? r2(lim/b) : lim, score:v.score, auto:ok && R()<.5, at:MS[5]+U(1,28) });
}
/* US-01 credit-limit overrides without a second approval (Compliance CTL-O2C-011, CMP-FND-11): each customer's last override ends at its current limit */
CR.push(
  { id:'CL-OVR-2611', v:'C-41255', e:'US-01', kind:'limit', ok:false, req:43.0, rec:38.0, cur:38.0, score:V['C-41255'].score, override:'tbrown.us01', at:93.4 },
  { id:'CL-OVR-2614', v:'C-41357', e:'US-01', kind:'limit', ok:false, req:38.5, rec:34.0, cur:34.0, score:V['C-41357'].score, override:'tbrown.us01', at:112.5 },
  { id:'CL-OVR-2618', v:'C-41578', e:'US-01', kind:'limit', ok:false, req:36.0, rec:31.0, cur:31.0, score:V['C-41578'].score, override:'tbrown.us01', at:132.4 },
  { id:'CL-OVR-2620', v:'C-41255', e:'US-01', kind:'limit', ok:false, req:47.0, rec:43.0, cur:43.0, score:V['C-41255'].score, override:'tbrown.us01', at:150.6 },
  { id:'CL-OVR-2623', v:'C-41544', e:'US-01', kind:'limit', ok:false, req:57.0, rec:42.0, cur:42.0, score:V['C-41544'].score, override:'tbrown.us01', at:164.5 },
  { id:'CL-OVR-2627', v:'C-41357', e:'US-01', kind:'limit', ok:false, req:41.0, rec:38.5, cur:38.5, score:V['C-41357'].score, override:'tbrown.us01', at:178.4 }
);
X.credit = CR;

/* ---------- 9. document chain attributes + issues ---------- */
L.forEach(l=>{
  if(l.cn) return;
  l.issues = [];
  if(l.crdHold) l.issues.push('creditHold');
  if(l.lateBill) l.issues.push('podLag');
  if(l.disputed && l.reason==='Pricing') l.issues.push('priceInv','dispute');
  if(l.disputed && l.reason==='Shortage') l.issues.push('shortPay','dispute');
  if(l.ptp!=null && l.ptpKept===false) l.issues.push('ptpBreak');
  if(!l.paid && l.due < SNAP && !l.disputed) l.issues.push('overdueInv');
  if(l.wpi) l.issues.push('wpi');
});
/* order entry: a sales order keyed off the customer's contract price is held at the Order stage (priceHold).
   Deterministic: one in 22 invoiced lines of customers on contract pricing (a contract, or a Strategic, Distributor or Export segment), picked by a hash of the line id (no random draw, same on every engine). */
const idHash = (t)=>{ let h = 7; for(let i=0;i<t.length;i++) h = (h*31 + t.charCodeAt(i)) >>> 0; return h; };
L.forEach(l=>{ if(l.cn) return; const c = V[l.v]; if(c && ((c.ct||[]).length || c.seg!=='Transactional') && idHash(l.id)%22===0){ l.priceHold = true; l.issues.unshift('priceHold'); } });
UB.forEach(u=>{ u.issues = ['unbilled']; });
RCP.filter(r=> r.st!=='Suggested' && r.st!=='Posted').forEach(r=>{ r.issues = ['unapplied']; });

/* ---------- 10. cases ---------- */
const CS = [];
const caseOf = (o)=>{ o.id = o.id || ('CX-'+String(26040 + CS.length + 1)); o.opened = o.opened!=null? o.opened : SNAP-U(2, 20); o.st = o.st || 'open'; CS.push(o); return o; };
const linesOf = (vid, pred)=> L.filter(l=> l.v===vid && !l.cn && (pred? pred(l) : l.pSt!=='Paid')).map(l=>l.id);

caseOf({ type:'pricing', v:'C-40102', lines:linesOf('C-40102', l=>l.disputed), est:1.12, conf:.86, st:'open', opened:SNAP-34, ex:'O2C-STR-09', note:'Nine invoices on hold after the July contract renewal was not loaded into the price master' });
caseOf({ type:'shortage', v:'C-40240', lines:linesOf('C-40240', l=>l.ex==='O2C-DED-10'), est:0.46, conf:.81, st:'open', opened:SNAP-19, ex:'O2C-DED-10', note:'Customer deducted 120 cartons; POD and weighbridge show a full delivery' });
caseOf({ type:'ptp', v:'C-40110', lines:linesOf('C-40110'), est:3.30, conf:.83, st:'open', opened:SNAP-5, ex:'O2C-PTP-08', note:'Promised 18-Sep to pay ₹3.3 Cr by 30-Sep; second miss this year' });
caseOf({ type:'slip', v:'C-40088', lines:linesOf('C-40088', l=>l.pSt!=='Paid'), est:4.10, conf:.68, st:'open', opened:SNAP-8, ex:'O2C-CRL-07', note:'Near limit; model predicts 20–35 days late without a credit decision' });
caseOf({ type:'slip', v:'C-50021', lines:linesOf('C-50021'), est:2.60, conf:.61, st:'open', opened:SNAP-6, ex:'O2C-CRD-05' });
caseOf({ type:'slip', v:'C-60014', lines:linesOf('C-60014'), est:1.40, conf:.52, st:'inv', opened:SNAP-10 });
caseOf({ type:'unapplied', v:'C-40088', lines:['RCP-1004-0331'], est:1.84, conf:.64, st:'open', opened:SNAP-1, ex:'O2C-CSH-11', note:'Two invoice combinations match ₹1.84 Cr exactly' });
caseOf({ type:'cutoff', v:'C-40088', lines:UB.filter(u=>u.decide==='Recognise').map(u=>u.id), est:5.40, conf:.9, st:'open', opened:SNAP-5, ex:'O2C-BILL-04', note:'37 dispatches left the plants by 30-Sep without an invoice; ₹5.40 Cr control had passed' });
caseOf({ type:'credit', v:'C-40088', lines:['SO-IN02-22901'], est:null, affected:6.0, conf:.79, st:'open', opened:SNAP-3, ex:'O2C-CRL-07', note:'Requested limit ₹'+V['C-40088'].reqLimit+' Cr against policy cap 125% of ₹'+V['C-40088'].limit+' Cr' });
caseOf({ type:'credit', v:'C-50021', lines:['SO-EU01-1044'], est:null, affected:0.35, conf:.7, st:'open', opened:SNAP-2, ex:'O2C-CRD-05' });
caseOf({ type:'dup', v:'CON-1182', lines:[], est:null, affected:1.5, conf:.92, st:'open', opened:SNAP-4, ex:'O2C-ONB-06', note:'PAN and GSTIN match existing C-40118' });
caseOf({ type:'wpi', v:'C-40302', lines:[wpi.id], est:null, affected:1.12, conf:.92, st:'open', opened:SNAP-2, ex:'O2C-WPI-12', note:'DAP delivery 03-Oct; invoice dated 30-Sep' });
caseOf({ type:'argl', v:'C-40188', lines:[], est:null, affected:0.94, conf:.87, st:'open', opened:SNAP-3, ex:'O2C-ARGL-13', note:'AR sub-ledger ₹1,537.00 Cr vs GL ₹1,537.94 Cr; three reconciling items' });

/* additional financial cases from remaining disputes so the sheet is not only the named eight */
['Pricing','Shortage','Promotion','Damage','Tax'].forEach((reason,i)=>{
  const pool = L.filter(l=> !l.cn && l.pSt==='Open' && !namedIds.has(l.v) && l.amt>0.08 && odDays(l)>10);
  const l = pool[i*3]; if(!l) return;
  l.disputed = true; l.reason = reason; l.pSt = 'Disputed';
  caseOf({ type: reason==='Shortage'||reason==='Damage'? 'shortage' : 'pricing', v:l.v, lines:[l.id], est:r5(l.amt*(reason==='Pricing'?0.18:0.4)), conf:.7, st:'open', opened:l.due+2 });
});

X.lines = L; X.cases = CS; X.unbilled = UB; X.orders = ORD; X.receipts = RCP; X.credit = CR;
X.ecl = C.ecl;
L.forEach(l=>{ delete l.fix; });
})();
