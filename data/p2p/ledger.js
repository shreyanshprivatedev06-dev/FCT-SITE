/* FCT demo — P2P control tower v2: seeded transaction ledger (illustrative, synthetic; same output on every load).
   Builds, from data/p2p/master.js: invoice lines with their requisition → approval → PO → receipt → invoice → payment chain,
   open PO lines, received-not-invoiced lines, open requisitions, rejected duplicates and investigation cases.
   Calibration anchors (kept equal to the drawer exceptions in data/exceptions.js and data/p2p.js, and to data/sc.js):
   Sep-26 invoices 14,620 · blocked at snapshot 376 / ₹32.0 Cr · payment run PR-20261006 1,128 / ₹186.4 Cr · 42 approvals past SLA / ₹6.80 Cr ·
   GRNI ₹24.0 Cr · 142 gate passes not receipted / ₹6.4 Cr · Sep spend without a PO ₹14.7 Cr · advances over 180 days ₹3.6 Cr ·
   Sep approval compliance 96.4% · Sep on-time payment 87.0% · Q2 spend of the 8 SC suppliers. See data/p2p/MODEL.md. */
(function(){
const D = window.FCT_DATA, X = D.p2px, C = X.config, R = X.rng(C.seed);
const SNAP = C.snap, MS = C.mStart;
const U = (a,b)=> a + R()*(b-a);
const gauss = ()=>{ let u=0,v=0; while(!u) u=R(); while(!v) v=R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
const shuffle = (a)=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const r5 = (x)=> Math.round(x*1e5)/1e5;
const day = (dd, mon)=> (mon==='Oct'? 183 : MS[['Apr','May','Jun','Jul','Aug','Sep'].indexOf(mon)]) + dd - 1;
const isRun = (d)=>{ const w=(((3+d)%7)+7)%7; return w===2 || w===5; };       /* payment runs Tue and Fri, 11:00 */
const runOnOrAfter = (d)=>{ let x=Math.ceil(d); while(!isRun(x)) x++; return x; };
const runOnOrBefore = (d)=>{ let x=Math.floor(d); while(!isRun(x)) x--; return x; };
const RUN_T = 11/24;
const cat = {}; C.cats.forEach(c=> cat[c.id]=c);
const bu = {}; C.bus.forEach(b=> bu[b.id]=b);
const V = {}; X.vendors.forEach(v=> V[v.id]=v);
const active = X.vendors.filter(v=> v.status==='Active' && !v.dormant);
const named = new Set(['V-100118','V-100377','V-100512','V-102208','V-101144','V-103310','V-300210','V-104401','V-301776','V-100482','V-207115','V-100961','V-102877','V-101530','V-101773','V-206602','V-103320','V-104980','V-102455','V-104410','V-209981','V-101890','V-118802','V-310992','V-300455','V-300512','V-300618','V-108812','V-108990','V-109204']);

/* vendor size and price */
const bigNamed = { 'V-100118':9, 'V-100377':7, 'V-100512':5, 'V-300210':4, 'V-100961':3.5, 'V-102208':1.8, 'V-103310':1.6, 'V-101144':1.4, 'V-104410':2.5, 'V-102877':2, 'V-101530':2.2, 'V-108812':2.5, 'V-104401':.2, 'V-100482':1.5, 'V-207115':.5, 'V-109204':1.2 };
const unitBase = { ksm:[1500,7000], sol:[60,160], pkg:[900,1300], utl:[12,22], log:[15000,60000], mro:[400,20000] };
bigNamed['V-310992'] = .25; bigNamed['V-206602'] = .4; bigNamed['V-209981'] = .4;
active.forEach(v=>{ v._w = bigNamed[v.id] || (named.has(v.id)? 1 : Math.min(2.6, Math.exp(gauss()*0.8))); const ub = unitBase[v.cat]; v._p = ub? Math.round(U(ub[0],ub[1])) : null; });
const months = { n:[13180,13420,13760,14030,14310,14620], s:[588,596,604,615,628,642], f:[1.35,1.27,1.2,1.12,1.06,1.0] };
const lead = { ksm:[20,60], sol:[8,30], pkg:[8,25], utl:[5,20], log:[1,8], cap:[30,120], lab:[5,40], itp:[15,90], mro:[3,20] };
const lateSite = { 'IN-02 Plant A':[.14,.15,.17,.19,.21,.24], 'IN-02 Plant B':[.10,.11,.12,.13,.15,.16], 'IN-05 Plant':[.12,.13,.14,.16,.18,.20], 'IN-04 Plant':[.10,.11,.12,.13,.15,.17] };
const otpBase = [.80,.82,.835,.85,.86,.87], aprBase = [.941,.946,.952,.956,.960,.964];
const lvlFor = (cr)=> C.doa.find(d=> cr<=d.upTo).lvl;
const siteFor = (e)=> { const s = bu[e].sites; return s.length>1? (R()<.65? s[0] : s[1]) : s[0]; };

/* ---------- 1. invoice lines ---------- */
/* month −1 = Mar-26: opening invoices, kept only if paid on or after 01-Apr (so April payment measures are complete) */
const ms = (m)=> m===-2? -59 : m===-1? -31 : MS[m];
const L = [];
for(let m=-1;m<6;m++){
  const nM = m<0? 13000 : months.n[m]; let left = nM;
  C.cats.forEach((c,ci)=>{
    const n = ci===C.cats.length-1? left : Math.round(nM*c.cnt); left -= n;
    const vs = active.filter(v=>v.cat===c.id), cw = vs.map(v=>Math.pow(v._w,.6)), cwS = cw.reduce((a,b)=>a+b,0);
    const raw = [];
    for(let i=0;i<n;i++){
      let x=R()*cwS, k=0; while(x>cw[k] && k<vs.length-1){ x-=cw[k]; k++; }
      raw.push({ v:vs[k], a:Math.exp(gauss()*0.9)*Math.pow(vs[k]._w,.4) });
    }
    const tot = raw.reduce((s,r)=>s+r.a,0), target = (m<0? 580 : months.s[m])*c.share;
    raw.forEach(r=>{
      const v = r.v, rcv = ms(m) + R()*(ms(m+1)-ms(m)) - 1e-3;
      const e = R()<.85? v.bu : (c.id==='log'||c.id==='mro'? ['IN-02','IN-03','IN-04','IN-05','IN-08'][Math.floor(R()*5)] : v.bu);
      L.push({ v:v.id, cat:c.id, e, site:siteFor(e), m, rcv, invD:rcv-U(.2,5), amt:r5(r.a/tot*target), cn:false });
    });
  });
}
/* credit notes: 0.6% of lines, 30% of a typical value, negative */
L.forEach(l=>{ if(R()<.006){ l.cn = true; l.amt = -r5(Math.abs(l.amt)*.3); } });

/* ---------- 2. chain attributes ---------- */
const mkChain = (l, f, m)=>{
  const c = cat[l.cat], v = V[l.v];
  l.msme = !!v.msme; l.terms = v.msme? Math.min(45, v.terms) : v.terms;
  if(l.cn){ l.npo = 'cn'; return; }
  l.npo = c.po? null : (R()<.7? 'exempt' : null);
  if(c.po && R()<.026*f*(m<5?1:0) && Math.abs(l.amt)<.25) l.npo = 'noncompliant';   /* Sep set exactly by calibration */
  /* price and quantity */
  const ub = v._p; l.uom = c.uom;
  l.ip = ub? Math.round(ub*U(.97,1.03)) : null; l.qty = ub? Math.max(1, Math.round(l.amt*1e7/l.ip)) : 1; if(!ub) l.ip = Math.round(l.amt*1e7);
  l.pp = l.ip; l.cp = null; l.pv = null;
  if(R()<c.ct){ l.cp = l.ip; l.ct = 'RC-'+l.cat.toUpperCase()+'-'+v.id.slice(-4);
    if(v.foreign && R()<.2){ l.pv='tol'; l.ip = Math.round(l.cp*U(1.022,1.04)); l.pp = l.ip; }
    else if(R()<.022*f){ l.pv='above'; l.ip = Math.round(l.cp*U(1.03,1.12)); l.pp = R()<.6? l.cp : l.ip; } }
  if(l.npo) { l.pp = null; return; }
  /* PO and requisition (commitment event = PO release) */
  const ld = lead[l.cat];
  l.retro = R()<.026*f;
  l.poD = l.retro? l.rcv + U(.5,9) : l.invD - U(ld[0],ld[1]);
  l.poVal = r5(Math.abs(l.amt)*U(1,1.12));
  setPr(l, m, f);
  /* receipt: GR at the gate for goods, service confirmation (SES) for services */
  l.gk = c.goods? 'GR' : 'SES';
  const ahead = R()<.12, t = Math.min(ahead? l.rcv + U(-1,4) : l.rcv - U(1,8), SNAP-3);
  if(l.gk==='GR'){
    const pl = (lateSite[l.site]||[.05,.05,.05,.05,.05,.05])[Math.max(0,m)];
    const lag = R()<pl? U(50,200) : Math.exp(Math.log(16)+gauss()*.6);
    l.grPh = C.noGateFeed.includes(l.site)? null : t; l.grPs = Math.min(t + Math.min(lag,47.5+ (lag>48? lag-47.5 : 0))/24, SNAP-.05);
    l._t = t;
  } else { l.grPh = null; l.grPs = Math.min(t + U(.2,3), SNAP-.05); l._t = t; }
  l.qtyR = l.qty;
  if(l.gk==='GR' && R()<.014*f){ l.qv = true; l.qty = Math.round(l.qtyR*U(1.02,1.10)); }
};
function setPr(o, m, f){
  const reqToPo = Math.exp(Math.log(2.2)+gauss()*.55), apprT = R()<.08? U(2.05,7) : Math.exp(Math.log(.7)+gauss()*.5);
  o.prA = o.poD - Math.min(reqToPo, 14); o.prC = o.prA - Math.min(apprT, 1.99 + (apprT>2? apprT-1.99 : 0));
  o.lvlReq = lvlFor(o.poVal); o.lvlAppr = o.lvlReq; o.apr = null;
  if(R() > aprBase[m==null? 5 : Math.max(0,m)]) breach(o);
}
function breach(o, type){
  type = type || (()=>{ const x=R(); return x<.45? 'after' : x<.70? 'level' : x<.88? 'split' : 'none'; })();
  if(type==='level' && o.lvlReq<2) type = 'after';
  o.apr = type;
  if(type==='after') o.prA = o.poD + U(.3,6);
  if(type==='level') o.lvlAppr = o.lvlReq===5? 3 : o.lvlReq-1;
  if(type==='none'){ o.prA = null; o.lvlAppr = null; }
}
function unbreach(o){ o.apr = null; o.lvlAppr = o.lvlReq; o.prA = o.poD - U(.5,3); if(o.prC > o.prA) o.prC = o.prA - U(.2,1.5); }
const mf = (m)=> m<0? 1.4 : months.f[m];
L.forEach(l=> mkChain(l, mf(l.m), l.m));

/* first-pass processing, resolution, invoice approval */
const processInv = (l, f)=>{
  l.mr = null; l.mSt = null; l.mRes = null; l.x1 = null; l.man = false; l.iapT = null;
  if(l.cn) return;
  if(!l.npo){
    if(l.retro) l.mr = 'retro';
    else if(l.gk && l.grPs > l.rcv + .25) l.mr = 'grMissing';
    else if(l.pv && l.pp!==l.ip) l.mr = 'price';
    else if(l.qv) l.mr = 'qty';
  }
  if(l.mr){
    l.x1 = 'match';
    const res = { retro:()=> l.poD + .2, grMissing:()=> l.grPs + U(.1,1), price:()=> l.rcv + U(2,12), qty:()=> l.rcv + U(2,10) }[l.mr]();
    l.mSt = (l.mr==='price' && R()<.2) || (l.mr==='qty' && R()<.15) ? 'forced' : 'fixed';
    l.mRes = Math.min(res, SNAP - U(.05,1.5));
    if(l.qv && l.mSt==='fixed'){ l.qty = l.qtyR; }               /* corrected by credit note or receipt adjustment */
    if(l.mr==='price' && l.mSt==='fixed' && l.pv==='above'){ l.ip = l.cp; l.pp = l.cp; l.pv = null; }  /* vendor re-billed at contract */
  } else {
    l.mSt = l.npo? null : 'auto';
    if(R()<.028*f) l.x1 = 'capture'; else if(R()<.027*f) l.x1 = 'coding';
  }
  l.man = Math.abs(l.amt) >= .10 || !!l.npo;
  if(l.man){ const t = R()<.09? U(3.05,9) : Math.exp(Math.log(1.1)+gauss()*.6); l.iapT = Math.min(t, 3 + (t>3? t-3 : 0)); if(l.iapT>3 && !l.x1) l.x1 = 'apprSla'; }
};
L.forEach(l=> processInv(l, mf(l.m)));

/* payment */
const payInv = (l, m)=>{
  l.due = l.invD + l.terms; l.paid = null; l.run = null; l.pSt = null;
  if(l.cn){ l.paid = l.rcv + .5; l.pSt = 'Applied'; return; }
  const ready = Math.max(l.rcv + .3, l.mRes||0, l.man? l.rcv + .3 + l.iapT : 0);
  let rd;
  if(R() < (m<0? .92 : otpBase[m])){
    if(R()<.03) rd = runOnOrAfter(ready);
    else { rd = runOnOrBefore(l.due); if(rd < ready) rd = runOnOrAfter(ready); }
  } else rd = runOnOrAfter(Math.max(ready, l.due + U(1,18)));
  setPaid(l, rd);
};
function setPaid(l, rd){ l.run = 'PR-2026'+ymd(rd); l.paid = rd + RUN_T; l._rd = rd; }
function ymd(d){ const x = new Date(Date.UTC(2026,3,1) + d*864e5); return String(x.getUTCMonth()+1).padStart(2,'0')+String(x.getUTCDate()).padStart(2,'0'); }
L.forEach(l=> payInv(l, l.m));
(()=>{ let k=0; for(let i=0;i<L.length;i++){ const l=L[i]; if(!(l.m<0 && l.paid!=null && l.paid<0)) L[k++]=l; } L.length=k; })();

/* ---------- 3. scenario lines (named drawer stories) ---------- */
const fixed = (l)=>{ l.fix = true; return l; };
const take = (pred, n, from)=>{ const a = shuffle((from||L).filter(l=> !l.fix && !l.cn && pred(l))); return a.slice(0,n); };
const forVendor = (l, vid, keepSite)=>{ const v = V[vid]; l.v = vid; l.cat = v.cat; if(!keepSite){ l.e = v.bu; l.site = siteFor(v.bu); } l.msme = !!v.msme; l.terms = v.msme? Math.min(45,v.terms):v.terms; return l; };
const setAmt = (ls, total)=>{ const s = ls.reduce((a,l)=>a+Math.abs(l.amt),0); let acc = 0; ls.forEach((l,i)=>{ l.amt = i===ls.length-1? r5(total-acc) : r5(Math.abs(l.amt)/s*total); acc += l.amt; rescaleUnits(l); }); return ls; };
function rescaleUnits(l){ if(l.cn) return; if(l.qtyR!=null && unitBase[l.cat]){ const q = Math.max(1, Math.round(l.amt*1e7/l.ip)); const k = l.qtyR/l.qty; l.qty = q; l.qtyR = Math.round(q*k); } else { l.ip = Math.round(l.amt*1e7); if(l.pp!=null && !l.pv) l.pp = l.ip; if(l.cp!=null && !l.pv) l.cp = l.ip; } if(l.poVal!=null) l.poVal = r5(Math.max(l.poVal, l.amt)); }
const scaleKey = (ls, k, total)=>{ const s = ls.reduce((a,o)=>a+o[k],0); let acc=0; ls.forEach((o,i)=>{ o[k] = i===ls.length-1? r5(total-acc) : r5(o[k]/s*total); acc += o[k]; }); return ls; };
const asPoLine = (l, m)=>{ if(l.npo){ l.npo=null; l.retro=false; const ld=lead[l.cat]; l.poD = l.invD - U(ld[0],ld[1]); l.poVal = r5(Math.abs(l.amt)*1.05); setPr(l, l.m); l.gk = cat[l.cat].goods? 'GR':'SES'; l.qtyR = l.qty; if(l.gk==='GR' && !C.noGateFeed.includes(l.site)) l.grPh = l.rcv - U(1,5); l.grPs = l.rcv - U(.2,1); l.uom = cat[l.cat].uom; if(l.ip==null) l.ip = Math.round(l.amt*1e7); l.pp = l.ip; } return l; };
const blockLine = (l, mr)=>{ l.mr = mr; l.x1 = 'match'; l.mSt = 'open'; l.mRes = null; l.paid = null; l.run = null; l.pSt = 'Blocked'; l.man = l.man || Math.abs(l.amt)>=.10; return fixed(l); };
const recent = (l)=> l.rcv >= 140 && l.rcv < 183;
const cur = (l)=> l.m>=0;
const sep = (l)=> l.m===5;
const goodsAt = (site)=> (l)=> recent(l) && l.site===site && cat[l.cat].goods && !l.npo;

/* 3a. blocked at snapshot — 376 invoices, ₹32.0 Cr (PTP-BLK-02) */
const BLK = [];
const gpSeq = { 'IN-02 Plant A':30880, 'IN-05 Plant':2240, 'IN-04 Plant':1130 }, gpPre = { 'IN-02 Plant A':'GP-A-', 'IN-05 Plant':'GP-05-', 'IN-04 Plant':'GP-04-' };
const gate = (l)=>{ const s = l.site; l.gate = gpPre[s] + (++gpSeq[s]); l.grPh = U(Math.max(l.rcv-3,170), SNAP-.3); l.grPs = null; l.gk='GR'; return l; };
/* GR missing, goods physically at the gate (SC-GRL-10 overlap ₹4.9 Cr) */
[['IN-02 Plant A',56,2.90],['IN-05 Plant',32,1.20],['IN-04 Plant',21,0.80]].forEach(([s,n,cr])=>{
  const ls = take(goodsAt(s), n).map(l=> gate(asPoLine(l)));
  setAmt(ls, cr).forEach(l=> BLK.push(blockLine(l,'grMissing')));
});
/* named gate passes from data/sc.js receiptRows */
(()=>{ const A = BLK.filter(l=>l.site==='IN-02 Plant A' && l.gate), B4 = BLK.filter(l=>l.site==='IN-04 Plant' && l.gate);
  const solV = active.find(v=> v.cat==='sol' && !named.has(v.id) && v.bu==='IN-02') || active.find(v=> v.cat==='sol' && !named.has(v.id));
  Object.assign(forVendor(A[0],'V-100377',true), { gate:'GP-A-30917', note:'KSM-17, 8.2 t', grPh:day(30,'Sep')+21.67/24, amt:.62 });
  Object.assign(forVendor(A[1],solV.id,true), { gate:'GP-A-30911', note:'Toluene, 24 kL', grPh:day(30,'Sep')+18.08/24, amt:.21 });
  Object.assign(B4[0], { gate:'GP-04-1172', note:'Excipient blend, 6 t', grPh:day(30,'Sep')+11.25/24, amt:.18 });
  [A[0],A[1],B4[0]].forEach(rescaleUnits); setAmt(A.slice(2), 2.90-.83); setAmt(B4.slice(1), .80-.18); })();
/* GR missing, no gate entry (invoice ahead of goods; service entry sheet missing) */
[['IN-02',40,6.0,['IN-02 Plant A','IN-02 Plant B']],['IN-05',28,4.4,['IN-05 Plant']],['IN-04',19,3.3,['IN-04 Plant']]].forEach(([e,n,cr,sites])=>{
  let ls = take((l)=> recent(l) && sites.includes(l.site) && !l.npo, n);
  if(e==='IN-05'){ const o = forVendor(ls[0],'V-102877'); o.cat='cap'; o.ref='OPE/26/2219'; o.note='Reactor lining assembly; delivery not yet at gate'; }
  ls.forEach(l=>{ asPoLine(l); l.grPh = null; l.grPs = null; });
  if(e==='IN-05'){ ls[0].amt = 1.36; setAmt(ls.slice(1), 4.4-1.36); rescaleUnits(ls[0]); } else setAmt(ls, cr);
  ls.forEach(l=> BLK.push(blockLine(l,'grMissing')));
});
/* price variance ₹7.0 Cr: overcharge 2.30 (Sunrise, Meghna, Coastal), renewed price not loaded 3.90, FX and tolerance 0.80 (SC-PPV-07) */
const genericWith = (cats, n)=> shuffle(active.filter(v=>!named.has(v.id) && cats.includes(v.cat))).slice(0,n);
const notLoadedOthers = genericWith(['ksm','sol'],3);
const priceBlk = [ ['V-100512',9,1.24,'above',82,91], ['V-102208',7,0.61,'above',1180,1260], ['V-103310',6,0.45,'above',1030,1090],
  ['V-101144',6,1.38,'notLoaded',14200,15100], ['V-100118',5,1.10,'notLoaded',2340,2410],
  [notLoadedOthers[0].id,3,0.62,'notLoaded'], [notLoadedOthers[1].id,2,0.48,'notLoaded'], [notLoadedOthers[2].id,2,0.32,'notLoaded'],
  ['V-300210',4,0.36,'tol'], ['V-300455',3,0.26,'tol'], ['V-300618',2,0.18,'tol'] ];
notLoadedOthers.forEach(v=>{ v.ct = [{ id:'RC-'+v.cat.toUpperCase()+'-'+v.id.slice(-4), item: v.cat==='ksm'? 'Intermediate grade A':'Process solvent', price:'Renewed Jul–Aug', from:'01-Aug-2026', to:'31-Jul-2027', status:'Renewed, not loaded' }]; });
priceBlk.forEach(([vid,n,cr,pv,oldP,newP])=>{
  const v = V[vid]; let ls = take((l)=> recent(l) && l.v===vid, n);
  if(ls.length<n) ls = ls.concat(take((l)=> recent(l) && l.cat===v.cat && !named.has(l.v), n-ls.length).map(l=>forVendor(l,vid)));
  ls.forEach(l=>{ asPoLine(l); l.ct = (v.ct&&v.ct[0]&&v.ct[0].id) || ('RC-'+v.cat.toUpperCase()+'-'+vid.slice(-4)); });
  setAmt(ls, cr).forEach(l=>{
    const base = l.ip || 1000, o = oldP || base, nw = newP || Math.round(base*U(1.04,1.08)), ratio = nw/o;
    if(pv==='above'){ l.cp = o; l.pp = o; l.ip = nw; }
    else if(pv==='notLoaded'){ l.cp = nw; l.pp = o; l.ip = nw; }
    else { l.cp = base; l.pp = base; l.ip = Math.round(base*U(1.022,1.035)); }
    l.pv = pv; l.qty = Math.max(1, Math.round(l.amt*1e7/l.ip)); l.qtyR = l.qty; l._ratio = ratio;
    BLK.push(blockLine(l,'price'));
  });
});
/* quantity above receipt ₹3.5 Cr */
setAmt(take((l)=> recent(l) && cat[l.cat].goods && !named.has(l.v) && !l.npo, 42).map(asPoLine), 3.5).forEach(l=>{ l.qv = true; l.qtyR = Math.round(l.qty/U(1.03,1.09)); BLK.push(blockLine(l,'qty')); });
/* other ₹2.9 Cr: unit-of-measure 61 invoices ₹2.30 Cr from 4 packaging vendors (PTP-MAT-08); awaiting PO 0.38; tax/IRN 0.22 */
const uomV = [['V-103310',18],['V-100482',15],['V-102208',14],['V-109204',14]]; const uomLs = [];
uomV.forEach(([vid,n])=>{ let ls = take((l)=> recent(l) && l.v===vid, n); if(ls.length<n) ls = ls.concat(take((l)=> recent(l) && l.cat==='pkg' && !named.has(l.v), n-ls.length).map(l=>forVendor(l,vid))); ls.forEach(l=>{ asPoLine(l); uomLs.push(l); }); });
setAmt(uomLs, 2.30).forEach(l=>{ l.uom='bag'; l.uomI='kg'; l.pv='uom'; l.cp = l.cp || l.pp; l.ex='PTP-MAT-08'; BLK.push(blockLine(l,'uom')); });
(()=>{ const c = uomLs.find(l=>l.v==='V-103310'); c.ref='CP-88341'; c.amt=0.0412; c.note='₹41.20 per kg on invoice; PO priced per 25 kg bag'; rescaleUnits(c); setAmt(uomLs.filter(l=>l!==c), 2.30-0.0412); })();
setAmt(take((l)=> recent(l) && !named.has(l.v) && cat[l.cat].po && !l.npo, 16), .38).forEach(l=>{ l.retro = true; l.poD = null; l.po = null; l.prA = l.prA; BLK.push(blockLine(l,'retro')); });
setAmt(take((l)=> recent(l) && !named.has(l.v) && !l.npo, 12), .22).forEach(l=> BLK.push(blockLine(l,'tax')));
BLK.forEach(l=>{ l.ex = l.ex || 'PTP-BLK-02'; if(l.mr==='grMissing' && !l.gate) l.grPh = null; });

/* 3b. invoices waiting for approval: 42 past the 3-day SLA, ₹6.80 Cr (PTP-APR-07), plus 58 within SLA */
const pend = (l, who, lvl, since)=>{ l.iap = { who, lvl, since }; l.man = true; l.iapT = null; l.paid = null; l.run = null; l.pSt = 'Approval pending'; if(l.mr && l.mSt!=='fixed'){ l.mSt='fixed'; l.mRes = Math.min(l.mRes||l.rcv+1, since-.1); } if(SNAP-since>3) l.x1 = l.x1 || 'apprSla'; return fixed(l); };
const ster = forVendor(take((l)=> l.m===5 && l.cat==='utl', 1)[0], 'V-100961');
Object.assign(ster, { amt:2.14, ref:'INV-SG-2209', rcv:day(29,'Sep')+10.2/24, invD:day(8,'Sep'), po:'4500186650', gr:'5000921144', ex:'PTP-LPR-09', note:'Nitrogen supply, IN-02; approver on leave 29-Sep to 09-Oct (HRMS)' });
asPoLine(ster); ster.npo=null; ster.gk='GR'; ster.grPh = day(28,'Sep')+.4; ster.grPs = day(28,'Sep')+.9; ster.mr=null; ster.mSt='auto'; ster.terms = 30; ster.lvlReq = 3; ster.poVal = 2.30; rescaleUnits(ster);
pend(ster, 'Plant head IN-02', 3, ster.rcv + 9/1440);
const pick42 = [ ['QC manager IN-03',1,31,1.92,'IN-03',[day(27,'Sep')+.4, day(1,'Oct')+.1]], ['Plant head IN-02',3,3,0.47,'IN-02',[day(29,'Sep'), day(1,'Oct')]],
  ['Ops head IN-04',2,5,1.84,'IN-04',[day(30,'Sep'), day(1,'Oct')+.3]], ['Function heads (other)',2,2,0.43,'IN-05',[day(30,'Sep'), day(1,'Oct')+.5]] ];
pick42.forEach(([who,lvl,n,cr,e,[a,b]])=>{
  const ls = take((l)=> l.m===5 && l.e===e && !l.npo && l.rcv>day(20,'Sep') && l.rcv<SNAP-3.3 && (e!=='IN-03' || ['lab','mro','pkg'].includes(l.cat)) && !named.has(l.v), n);
  if(who==='QC manager IN-03'){ const me = forVendor(ls[0],'V-101773'); me.ref='MI/2526/322'; me.amt=.18; const bh = forVendor(ls[1],'V-103320'); bh.ref='BE-1102'; bh.amt=.07; setAmt(ls.slice(2), cr-.25); [me,bh].forEach(rescaleUnits); }
  else if(who==='Ops head IN-04'){ const dc = forVendor(ls[0],'V-101530'); dc.ref='DPS/INV-4471'; dc.amt=.94; dc.note='Contract manufacturing; service entry sheet posted 30-Sep'; setAmt(ls.slice(1), cr-.94); rescaleUnits(dc); }
  else setAmt(ls, cr);
  ls.forEach((l,i)=>{ const since = who==='QC manager IN-03' && i===0? day(27,'Sep')+.42 : who==='QC manager IN-03' && i===1? day(28,'Sep')+.5 : U(a,b); pend(l, who, lvl, Math.max(l.rcv+.05, Math.min(since, SNAP-3.05))); });
});
take((l)=> l.m===5 && l.rcv > SNAP-6 && Math.abs(l.amt)>=.10 && !l.npo, 58).forEach(l=> pend(l, ['Function head','Cost-centre owner','Plant head'][Math.floor(R()*3)]+' '+l.e, lvlFor(Math.abs(l.amt)), U(SNAP-2.9, SNAP-.1)));

/* 3c. payment-run stories: Narmada ₹7.80 Cr (CFO), Apex ₹1.124 Cr (bank change), Shree duplicate pair ₹48.6 L */
const nar = fixed(forVendor(take((l)=> l.m===5 && l.v==='V-100118', 1)[0], 'V-100118'));
Object.assign(nar, { amt:7.80, ref:'NOL/2526/1184', invD:day(6,'Sep')+.5, rcv:day(9,'Sep')+.4, ex:'PTP-PAY-06', note:'KSM-04; single payment above ₹5 Cr needs CFO authorisation' }); nar.terms = 30; asPoLine(nar); nar.poVal=8.10; nar.lvlReq=5; nar.lvlAppr=5; nar.apr=null; nar.prA = nar.poD-1.5; nar.prC = nar.prA-.8; nar.mr=null; nar.mSt='auto'; nar.pv=null; nar.cp = nar.pp = nar.ip; rescaleUnits(nar);
const apx = fixed(forVendor(take((l)=> l.m===5 && l.cat==='sol' && l.rcv<day(20,'Sep'), 1)[0], 'V-301776'));
Object.assign(apx, { amt:1.124, ref:'ACI/26-27/0412', invD:day(6,'Sep'), rcv:day(8,'Sep')+.45, ex:'PTP-BNK-05', note:'Solvents; payee bank changed by email request on 03-Oct' }); apx.terms=30; asPoLine(apx); apx.mr=null; apx.mSt='auto'; rescaleUnits(apx);
const shA = fixed(forVendor(take((l)=> l.m===5 && l.cat==='pkg' && l.rcv<day(14,'Sep'), 1)[0], 'V-100482'));
Object.assign(shA, { amt:.4862, ref:'SPI/2526/0918', invD:day(12,'Sep'), rcv:day(13,'Sep')+.4, po:'4500183321', gr:'5000917743', irn:'…a91f3c', channel:'Email' }); asPoLine(shA); shA.mr=null; shA.mSt='auto'; shA.terms=17; setPaid(shA, day(30,'Sep')); rescaleUnits(shA);
const shB = fixed(forVendor(take((l)=> l.m===5 && l.cat==='pkg' && l.rcv>day(15,'Sep') && l.rcv<day(17,'Sep')+1, 1)[0] || take((l)=>l.m===5 && l.cat==='pkg',1)[0], 'V-207115'));
Object.assign(shB, { amt:.4862, ref:'SPI-2526-918', invD:day(15,'Sep'), rcv:day(16,'Sep')+10.03/24, po:'4500183321', gr:'5000917743', irn:'…a91f3c', channel:'Supplier portal', dupOf:shA, ex:'PTP-DUP-03', note:'Same IRN, PO, GRN and amount as SPI/2526/0918, paid 30-Sep' }); shB.e = shA.e; shB.site = shA.site; asPoLine(shB); shB.mr=null; shB.mSt='auto'; shB.terms=21; shB.poD = shA.poD; shB.prA = shA.prA; shB.prC = shA.prC; shB.grPh = shA.grPh; shB.grPs = shA.grPs; shB.ct = shA.ct; shB.cp = shA.cp; shB.pp = shA.pp; shB.ip = shA.ip; shB.qty = shA.qty; shB.qtyR = shA.qtyR; shB.pv = shA.pv;
/* Sai Enterprises ₹18.7 L paid 22-Sep through an SoD conflict (CMP-SOD-01) */
const sai = fixed(forVendor(take((l)=> l.m===5 && l.cat==='pkg' && l.rcv<day(18,'Sep'), 1)[0], 'V-310992'));
Object.assign(sai, { amt:.187, ref:'SE/26/014', invD:day(16,'Sep'), rcv:day(17,'Sep')+.4, ex:'CMP-SOD-01', note:'Packing material; vendor created 14-Sep and payment approved 22-Sep by the same user (pnair.in03)' }); asPoLine(sai); sai.mr=null; sai.mSt='auto'; setPaid(sai, day(22,'Sep')); rescaleUnits(sai);

/* 3d. Kaveri contract expired 31-Aug (extension letter not filed): Sep lines have no valid contract price */
V['V-100377'].ct[0].to = '31-Aug-2026'; V['V-100377'].ct[0].status = 'Expired 31-Aug; extension letter not filed';
L.filter(l=> l.v==='V-100377' && l.m===5 && !l.cn).forEach(l=>{ asPoLine(l); l.cp = l.cp || l.ip; l.ct = 'RC-KSM17-25'; if(!l.pv) l.pv = 'expired'; });
/* Meghna: billed ₹1,260 against ₹1,180 contract since April; POs raised at invoice price, so matching passed */
L.filter(l=> l.v==='V-102208' && l.m>=0 && !l.cn && !l.fix && !l.npo).forEach(l=>{ if(R()<.7){ l.cp=1180; l.pp=1260; l.ip=1260; l.pv='above'; l.ct='RC-PKG-HDPE'; l.qty = l.qtyR = Math.max(1,Math.round(l.amt*1e7/1260)); } });
/* disputes and holds at the snapshot */
const unpaidAt = (l)=> !l.fix && !l.cn && l.paid!=null && l.paid > SNAP;
take((l)=> unpaidAt(l) && ['V-102208','V-100512','V-209981'].includes(l.v), 12).concat(take((l)=> unpaidAt(l) && !named.has(l.v) && l.qv!==true, 22))
  .forEach(l=>{ l.paid=null; l.run=null; l.pSt='Disputed'; l.disp = ['Quality rejection at receipt','Rate dispute','Short supply','Freight surcharge not agreed'][Math.floor(R()*4)]; fixed(l); });
/* aged tail: older invoices still unpaid because of long-running disputes (31–90 days past due) and legal or recovery holds (over 90) */
take((l)=> l.m>=1 && l.m<=3 && l.due > MS[6]-95 && l.due < MS[6]-32 && l.paid!=null && l.paid < MS[5] && !named.has(l.v) && !l.npo, 46)
  .forEach(l=>{ l.paid=null; l.run=null; l.pSt='Disputed'; l.disp = ['Rate dispute','Quality rejection at receipt','Short supply','Freight surcharge not agreed'][Math.floor(R()*4)]; fixed(l); });
take((l)=> l.m>=0 && l.m<=1 && l.due < MS[6]-92 && l.paid!=null && l.paid < MS[5] && !named.has(l.v) && !l.npo, 14)
  .forEach(l=>{ l.paid=null; l.run=null; l.pSt='Held'; l.hold = ['Payment hold: legal notice from vendor','Payment hold: recovery of excess billing pending','Payment hold: vendor KYC refresh overdue'][Math.floor(R()*3)]; fixed(l); });
L.filter(l=> unpaidAt(l) && ((l.v==='V-100377' && l.rcv>=day(28,'Sep')) || l.v==='V-310992')).forEach(l=>{ l.paid=null; l.run=null; l.pSt='Held'; l.hold = l.v==='V-100377'? 'Payment hold: vendor risk review (insolvency petition)' : 'Payment hold: SoD review'; fixed(l); });

/* ---------- 4. spend calibration: Q2 spend of the 8 SC suppliers (data/sc.js suppliers) ---------- */
X.vendors.filter(v=>v.q2!=null).forEach(v=>{
  let q2 = L.filter(l=> l.v===v.id && l.m>=3);
  if(!q2.length){ take((l)=> l.m>=3 && l.cat===v.cat && !named.has(l.v), 3).forEach(l=> forVendor(l, v.id)); q2 = L.filter(l=> l.v===v.id && l.m>=3); }
  [[q2, v.q2], [L.filter(l=> l.v===v.id && l.m>=0 && l.m<3), v.q2*.93]].forEach(([ls, target])=>{
    const fx = ls.filter(l=> l.fix || l.cn).reduce((s,l)=>s+l.amt,0), free = ls.filter(l=> !l.fix && !l.cn);
    if(free.length) setAmt(free, target - fx);
  });
});

/* ---------- 5. Sep spend without a PO = ₹14.7 Cr (SC-NPO-09; data/sc.js noPo) ---------- */
[['mro',5.8],['log',4.1],['lab',2.6],['pkg',1.3],['itp',0.9]].forEach(([c,cr])=>{
  L.filter(l=> l.m===5 && l.cat===c && l.npo==='noncompliant' && !l.fix).forEach(l=>{ l.npo=null; asPoLine(Object.assign(l,{npo:'x'})); });
  const ls = []; let acc = 0;
  shuffle(L.filter(l=> l.m===5 && l.cat===c && !l.fix && !l.cn && !named.has(l.v) && Math.abs(l.amt)<.2 && !l.mr)).some(l=>{ ls.push(l); acc += l.amt; return acc >= cr; });
  setAmt(ls, cr).forEach(l=>{ Object.assign(l, { npo:'noncompliant', po:null, poD:null, poVal:null, prA:null, prC:null, apr:null, lvlReq:null, lvlAppr:null, gk:null, grPh:null, grPs:null, retro:false, mr:null, mSt:null, pp:null, man:true }); fixed(l); });
});

/* ---------- 6. ids, numbering ---------- */
const pfx = {};
L.sort((a,b)=> a.rcv-b.rcv);
L.forEach((l,i)=>{ l.id = (l.cn? 'CN-26-' : 'INV-26-') + String(100001+i); if(!l.ref) l.ref = vendorRef(l, i); });
function vendorRef(l, i){ const p = pfx[l.v] || (pfx[l.v] = V[l.v].name.split(' ').map(w=>w[0]).join('').replace(/[^A-Z]/g,'').slice(0,3) || 'INV'); return p + '/26/' + String((i*7919)%9000+1000); }
let poSeq = 0; const poBy = L.filter(l=> l.poD!=null).sort((a,b)=> a.poD-b.poD);
poBy.forEach(l=>{ if(!l.po) l.po = '4500' + String(170000 + (++poSeq)); l.poLn = 10; l.pr = 'PR-' + String(1100000 + poSeq*3); });
L.forEach(l=>{ if(l.gk && l.grPs!=null && !l.gr) l.gr = (l.gk==='GR'? '50009' : 'SES-') + String(10000 + Math.floor(R()*89999)); });

/* ---------- 7. open PO lines (commitments), received-not-invoiced (GRNI), open requisitions ---------- */
const OP = [];
const spendOf = {}, cntOf = {}; L.forEach(l=>{ spendOf[l.v] = (spendOf[l.v]||0) + l.amt; cntOf[l.v] = (cntOf[l.v]||0) + 1; });
active.filter(v=> cat[v.cat].po || R()<.3).forEach(v=>{
  const mAvg = (spendOf[v.id]||0)/6; if(mAvg<=0) return;
  const openVal = mAvg*1.85*U(.6,1.4), avg = Math.max(.02, mAvg/Math.max(1, (cntOf[v.id]||0)/6)*1.3);
  const n = Math.max(1, Math.min(160, Math.round(openVal/avg)));
  const ls = [];
  for(let i=0;i<n;i++){
    const x = R(), age = x<.90? -Math.log(1-R()*.95)*30 : x<.97? U(91,180) : U(181,330);
    const ld = lead[v.cat], poD = SNAP - age; let edd = poD + U(ld[0],ld[1]); if(edd < SNAP && age<=180 && R()<.8) edd = SNAP + U(1,45);
    const o = { po:'4500'+String(170000 + (++poSeq)), poLn:10, v:v.id, cat:v.cat, e:v.bu, site:siteFor(v.bu), poD, edd, val:Math.exp(gauss()*.8), recvPct:0 };
    if(edd < SNAP){ o.recvPct = R()<.28? U(.2,.8) : 0; } else if(R()<.1) o.recvPct = U(.2,.6);
    ls.push(o);
  }
  scaleKey(ls, 'val', openVal).forEach(o=> OP.push(o));
});
/* Kaveri: ₹9.6 Cr of open orders (SC-SUP-02), 4 of 6 lines overdue */
OP.filter(o=>o.v==='V-100377').forEach(o=>{ OP.splice(OP.indexOf(o),1); });
[[2.4,40,-6],[1.9,34,-9],[1.6,28,-3],[1.5,22,-12],[1.2,12,8],[1.0,6,20]].forEach(([val,age,dd])=> OP.push({ po:'4500'+String(170000 + (++poSeq)), poLn:10, v:'V-100377', cat:'ksm', e:'IN-02', site:'IN-02 Plant A', poD:SNAP-age, edd:SNAP+dd, val, recvPct: dd<0 && val<1.6? .35 : 0, note:'KSM-17' }));
/* gate passes received but not receipted, no invoice yet (₹1.5 Cr; SC-GRL-10) */
[['IN-02 Plant A',15,0.80],['IN-05 Plant',11,0.40],['IN-04 Plant',7,0.30]].forEach(([s,n,cr])=>{
  const ls = shuffle(OP.filter(o=> o.site===s && cat[o.cat].goods && o.recvPct===0 && !o.gate && o.v!=='V-100377')).slice(0,n);
  scaleKey(ls, 'val', cr).forEach(o=>{ o.gate = gpPre[s] + (++gpSeq[s]); o.gateT = U(SNAP-6, SNAP-.2); o.edd = Math.min(o.edd, o.gateT+1); });
});
OP.forEach(o=>{
  o.recv = r5(o.val*o.recvPct); o.rem = r5(o.val - o.recv); o.poVal = o.val;
  o.st = o.gate? 'At gate, receipt not posted' : o.recvPct>0? 'Partially received' : o.edd < SNAP? 'Delivery overdue' : 'Not yet due';
  setPr(o, o.poD>=MS[5] && o.poD<MS[6]? 5 : Math.max(0,Math.min(5, Math.floor((o.poD+1)/30.5))), 1);
  o.id = o.po+'-'+o.poLn; o.pr = 'PR-'+String(1100000 + parseInt(o.po.slice(-6))*3 % 900000);
});
/* GRNI: goods receipted, invoice not yet received — ₹24.0 Cr by age 9.6 / 3.9 / 1.3 / 9.2 (PTP-GRNI-01) */
const GR = [];
const grniV = active.filter(v=> cat[v.cat].po), gw = grniV.map(v=> Math.pow(v._w,.8)), gwS = gw.reduce((a,b)=>a+b,0);
[[0,30,330,9.6],[31,60,130,3.9],[61,90,60,1.3],[91,260,120,9.2]].forEach(([a,b,n,cr],bi)=>{
  const ls = [];
  for(let i=0;i<n;i++){ let x=R()*gwS, k=0; while(x>gw[k] && k<grniV.length-1){ x-=gw[k]; k++; } const v = grniV[k];
    ls.push({ v:v.id, cat:v.cat, e:v.bu, site:siteFor(v.bu), grPs: SNAP - U(a,b+.99), val:Math.exp(gauss()*.8), bucket:bi }); }
  if(bi===0){ const cf = ls[0]; Object.assign(cf, { v:'V-104410', cat:'log', e:'IN-02', site:'IN-02 Plant A', note:'Invoice dated ≤30-Sep received 1–3 Oct; accrual line in PTP-GRNI-01' }); cf.val = 1.12; scaleKey(ls.slice(1), 'val', cr-1.12); }
  else scaleKey(ls, 'val', cr);
  ls.forEach(g=>{ g.po = '4500'+String(170000 + (++poSeq)); g.gr = (cat[g.cat].goods?'50009':'SES-')+String(10000+Math.floor(R()*89999)); g.id = g.po+'-10'; GR.push(g); });
});
/* open requisitions (not commitments) */
const PRQ = [];
[['Awaiting approval',180,[0,9]],['Approved, awaiting PO',140,[0,20]],['Returned for correction',38,[1,14]]].forEach(([st,n,[a,b]])=>{
  for(let i=0;i<n;i++){ const v = active[Math.floor(R()*active.length)]; const age = st==='Awaiting approval' && R()<.78? U(0,2) : U(a,b);
    const val = r5(Math.exp(Math.log(.08)+gauss()*1.1));
    PRQ.push({ id:'PR-'+String(1300000 + PRQ.length*7), v:v.id, cat:v.cat, e:v.bu, site:siteFor(v.bu), st, val, created: st==='Approved, awaiting PO'? SNAP-age-U(.3,2) : SNAP-age, approved: st==='Approved, awaiting PO'? SNAP-age : null, lvlReq:lvlFor(val), age }); }
});

/* ---------- 8. calibration: payment run PR-20261006 = 1,128 invoices, ₹186.4 Cr ---------- */
const RUN = day(6,'Oct'), RUN2 = day(9,'Oct');
L.forEach(l=>{ if(!l.cn) l.due = l.invD + l.terms; });
const eligible = L.filter(l=> !l.cn && l.paid!=null && l.paid > SNAP);
const must = [nar, apx, shB];
must.forEach(l=>{ l.due = l.invD + l.terms; });
const pool = eligible.filter(l=> !must.includes(l) && !l.fix && !named.has(l.v) && l.due <= RUN2+4).sort((a,b)=> b.amt-a.amt);
const need = 1128 - must.length, mustSum = must.reduce((s,l)=>s+l.amt,0), target = 186.4 - mustSum;
let j = 0, pickRun = null;
for(j=0;j<=need;j++){ const s = pool.slice(0,j).concat(pool.slice(pool.length-(need-j))); const sum = s.reduce((a,l)=>a+l.amt,0); if(sum >= target){ pickRun = s; break; } }
if(!pickRun) pickRun = pool.slice(0,need);
const free = pickRun.filter(l=>!named.has(l.v)); const fxs = pickRun.filter(l=>named.has(l.v)).reduce((s,l)=>s+l.amt,0);
setAmt(free, target - fxs);
eligible.forEach(l=>{ if(l._rd===RUN && !pickRun.includes(l) && !must.includes(l)) setPaid(l, RUN2); });
pickRun.concat(must).forEach(l=>{ setPaid(l, RUN); l.inRun = true; fixed(l); });
L.forEach(l=>{ if(l.cn) return; if(l.paid!=null && l.paid > SNAP) l.pSt = 'Scheduled'; else if(l.paid!=null) l.pSt = 'Paid'; });

/* ---------- 9. calibration: Sep approval compliance 96.4% (PO lines released in Sep, invoiced or open) ---------- */
const relSep = L.filter(l=> l.poD!=null && l.poD>=MS[5] && l.poD<MS[6] && !l.cn).concat(OP.filter(o=> o.poD>=MS[5] && o.poD<MS[6]));
const nb = Math.round(relSep.length*(1-.964)); let br = relSep.filter(o=>o.apr);
if(br.length > nb) shuffle(br.filter(o=>!o.fix)).slice(0, br.length-nb).forEach(unbreach);
else if(br.length < nb) shuffle(relSep.filter(o=>!o.apr && !o.fix)).slice(0, nb-br.length).forEach(o=> breach(o));

/* ---------- 10. calibration: Sep on-time payment 87.0% (invoices paid in Sep) ---------- */
const paidSep = ()=> L.filter(l=> !l.cn && l.paid!=null && l.paid>=MS[5] && l.paid<MS[6]);
const onTime = (l)=> Math.floor(l.paid) <= Math.floor(l.due);
(()=>{ const P = paidSep(), tgt = Math.round(P.length*.87); let ot = P.filter(onTime);
  if(ot.length > tgt) shuffle(ot.filter(l=> !l.fix && l.due < MS[6]-8)).slice(0, ot.length-tgt).forEach(l=> setPaid(l, Math.min(runOnOrAfter(l.due+U(1,6)), runOnOrBefore(MS[6]-1))));
  else if(ot.length < tgt){ shuffle(P.filter(l=> !onTime(l) && !l.fix)).filter(l=>{ const r = runOnOrBefore(l.due); return r>=MS[5] && r>=l.rcv+.3; }).slice(0, tgt-ot.length).forEach(l=> setPaid(l, runOnOrBefore(l.due))); }
})();

/* ---------- 11. rejected duplicates (not posted, not spend) ---------- */
const REJ = [];
[['V-102455',.061,day(30,'Sep'),'RL/0926/4412',98],['V-103310',.212,day(18,'Sep'),'CP-88120',91],['V-101773',.094,day(4,'Sep'),'MI/2526/301',88],['V-101890',.387,day(21,'Aug'),'SIG-7731',95]].forEach(([vid,amt,d,ref,score],i)=>{
  const a = L.filter(l=> l.v===vid && !l.cn && l.rcv < d).sort((x,y)=> y.rcv-x.rcv)[0];
  REJ.push({ id:'RJ-26-'+(4410+i), v:vid, cat:V[vid].cat, e:a? a.e : V[vid].bu, ref, amt, rcv:d, score, orig:a? a.id : null, st:'Blocked before payment' });
});

/* ---------- 12. investigation cases ---------- */
const CS = []; let cseq = 0;
const caseOf = (o)=>{ o.id = 'PX-'+String(26000 + (++cseq)); CS.push(o); return o; };
const byV = (ls)=>{ const g = {}; ls.forEach(l=>{ (g[l.v]=g[l.v]||[]).push(l); }); return g; };
const statusFor = (ls, planted)=>{ if(planted) return planted; const lm = Math.max(...ls.map(l=>l.m)), x = R();
  return lm<=2? (x<.4?'prevented': x<.7?'nil': x<.85?'loss':'disputed') : (x<.5?'open': x<.8?'inv': x<.92?'disputed':'nil'); };
const vari = (l)=> Math.max(0, l.amt*(1 - (l.pv==='notLoaded'? l.pp : l.cp)/l.ip));
const pv = (t)=> L.filter(l=> !l.cn && l.m>=0 && l.pv===t);
Object.entries(byV(pv('above'))).forEach(([vid,ls])=>{ const planted = ['V-100512','V-102208','V-103310'].includes(vid)? (vid==='V-102208'?'inv':'open') : null;
  caseOf({ type:'price', v:vid, lines:ls.map(l=>l.id), est:r5(ls.reduce((s,l)=>s+vari(l),0)), conf: planted? .9 : .75, st:statusFor(ls, planted), opened: Math.max(...ls.map(l=>l.rcv))+1, ex: planted? 'SC-PPV-07' : null }); });
Object.entries(byV(pv('notLoaded'))).forEach(([vid,ls])=> caseOf({ type:'ctl', v:vid, lines:ls.map(l=>l.id), est:r5(ls.reduce((s,l)=>s+vari(l),0)), conf:.25, st:'inv', opened:Math.min(...ls.map(l=>l.rcv))+2, ex:'SC-PPV-07' }));
Object.entries(byV(pv('tol').filter(l=> l.mSt==='open'))).forEach(([vid,ls])=> caseOf({ type:'tol', v:vid, lines:ls.map(l=>l.id), est:r5(ls.reduce((s,l)=>s+vari(l),0)), conf:.4, st:'open', opened:Math.min(...ls.map(l=>l.rcv))+1 }));
Object.entries(byV(pv('uom'))).forEach(([vid,ls],i)=> caseOf({ type:'uom', v:vid, lines:ls.map(l=>l.id), est:r5(ls[0].amt*.035), conf:.9, st:'open', opened:day(1,'Oct'), ex:'PTP-MAT-08', note:'After kg-to-bag conversion one invoice per vendor still differs by about 3.5%' }));
Object.entries(byV(L.filter(l=> !l.cn && l.m>=0 && l.qv && l.mSt!=='fixed'))).forEach(([vid,ls])=> caseOf({ type:'qty', v:vid, lines:ls.map(l=>l.id), est:r5(ls.reduce((s,l)=> s + l.amt*(1-l.qtyR/l.qty),0)), conf:.8, st:statusFor(ls, ls.some(l=>l.mSt==='open')? 'open' : null), opened:Math.min(...ls.map(l=>l.rcv))+1 }));
caseOf({ type:'dup', v:'V-207115', lines:[shB.id, shA.id], est:.4862, conf:.96, st:'open', opened:day(5,'Oct')+8.5/24, ex:'PTP-DUP-03', note:'Invoice B in PR-20261006 duplicates invoice A paid 30-Sep' });
REJ.forEach(r=> caseOf({ type:'dup', v:r.v, lines:[r.id].concat(r.orig?[r.orig]:[]), est:r.amt, conf:r.score/100, st:'prevented', opened:r.rcv, note:'Blocked before payment ('+r.score+'% match)' }));
(()=>{ const a = L.filter(l=> l.v==='V-104410' && l.m===3 && !l.cn)[0], b = L.filter(l=> l.v==='V-209981' && l.m===3 && !l.cn && !l.fix)[0] || forVendor(take((l)=>l.m===3 && l.cat==='log' && !named.has(l.v),1)[0],'V-209981');
  if(a && b){ b.amt = a.amt; b.ref = a.ref; b.dupOf = a; b.note = 'Paid twice: same invoice under duplicate vendor record V-209981'; caseOf({ type:'dup', v:'V-209981', lines:[b.id, a.id], est:r5(a.amt), conf:.94, st:'disputed', opened:day(12,'Aug'), note:'Recovery claimed from vendor; credit note promised' }); } })();
take((l)=> l.m===5 && l.pSt==='Scheduled' && !named.has(l.v) && !l.inRun && l.amt<.3, 2).forEach(b=>{ const a = L.filter(x=> x.v===b.v && !x.cn && x.rcv < b.rcv - 3)[0]; if(!a) return; b.amt = a.amt; b.dupOf = a; fixed(b); caseOf({ type:'dup', v:b.v, lines:[b.id, a.id], est:r5(b.amt), conf:.74, st:'open', opened:b.rcv+1, note:'Same amount and PO within 30 days; different invoice number' }); });
caseOf({ type:'bank', v:'V-301776', lines:[apx.id], est:1.124, conf:.91, st:'open', opened:day(3,'Oct')+16.7/24, ex:'PTP-BNK-05', note:'Change request 03-Oct 16:42 to Emirates NBD, Dubai; no call-back recorded' });
[['V-105512',.42],['V-107730',.28],['V-106221',.20]].forEach(([vid,est])=> caseOf({ type:'adv', v:vid, lines:[V[vid].adv.id], est, conf:.76, st:'open', opened:day(1,'Oct'), ex:'PTP-ADV-04', note:V[vid].adv.note }));
caseOf({ type:'adv', v:'V-100377', lines:['ADV-0818'], est:2.40, conf:.62, st:'inv', opened:day(2,'Oct'), ex:'SC-SUP-02', note:'Unsecured advance; failure probability 62% over 90 days' });
Object.entries(byV(L.filter(l=> l.msme && !l.cn && l.paid!=null && l.m>=3 && (l.paid - l.rcv) > C.slas.msmeDays))).forEach(([vid,ls])=>{
  const est = r5(ls.reduce((s,l)=> s + l.amt*.195*(l.paid-l.rcv-C.slas.msmeDays)/365, 0)); if(est>=.001) caseOf({ type:'msme', v:vid, lines:ls.map(l=>l.id), est, conf:.95, st:'open', opened:Math.max(...ls.map(l=>l.paid))+1 }); });
caseOf({ type:'sod', v:'V-310992', lines:[sai.id], est:.187, conf:.7, st:'inv', opened:day(2,'Oct'), ex:'CMP-SOD-01', note:'Vendor created and payment approved by pnair.in03' });
/* control cases (value affected, never added to exposure): Q2 approval breaches and spend without a PO, by vendor and month */
const grpVM = (ls)=>{ const g = {}; ls.forEach(l=>{ const k = l.v+'|'+l.m; (g[k]=g[k]||[]).push(l); }); return g; };
Object.values(grpVM(L.filter(l=> l.apr && l.m>=3 && !l.cn))).forEach(ls=> caseOf({ type:'apr', v:ls[0].v, lines:ls.map(l=>l.id), est:null, affected:r5(ls.reduce((s,l)=>s+l.poVal,0)), conf:.99, st:statusFor(ls), opened:Math.max(...ls.map(l=>l.rcv))+1, rule:ls[0].apr }));
Object.values(grpVM(L.filter(l=> l.npo==='noncompliant' && l.m>=3))).forEach(ls=> caseOf({ type:'nopo', v:ls[0].v, lines:ls.map(l=>l.id), est:null, affected:r5(ls.reduce((s,l)=>s+l.amt,0)), conf:.99, st:ls[0].m===5? 'open' : statusFor(ls), opened:MS[ls[0].m+1]+1 }));

X.lines = L; X.open = OP; X.grni = GR; X.prs = PRQ; X.rejected = REJ; X.cases = CS;
X.runs = { next:{ id:'PR-20261006', day:RUN, label:'Tue 06-Oct 11:00' }, after:{ id:'PR-20261009', day:RUN2, label:'Fri 09-Oct 11:00' } };
L.forEach(l=>{ if(l.dupOf && typeof l.dupOf==='object') l.dupOf = l.dupOf.id; delete l._t; delete l._rd; delete l._ratio; delete l.fix; });
})();
