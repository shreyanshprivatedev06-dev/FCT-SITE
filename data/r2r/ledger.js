/* FCT demo — R2R control tower v2: seeded close ledger (illustrative, synthetic; same output on every load).
   Builds, from data/r2r/master.js and data/r2r.js: close tasks, balance-sheet reconciliations, journals, intercompany items,
   material variances, unmapped local accounts and R2R cases for the Apr-26 … Sep-26 closes. Sep-26 is in flight at WD+2.
   Calibration anchors (kept equal to data/core.js, data/r2r.js and the drawer exceptions):
   Sep tasks 486 / done 289 / plan to date 307 / behind plan 31 (per entity as core.entities) · Sep reconciliations 1,284 / certified 1,040 / breaks 8 ·
   Sep journals posted 3,912, manual 1,146 of which AI-drafted 352, exceptions 43 (3.8%), anomalies 7 · 64 journals pending (58 low-risk ₹1.20 Cr + 6 named) ·
   14 IN-07 AI accrual drafts ₹2.71 Cr · Sep material variances 34, 21 signed · IC IN-02↔US-01 break ₹3.10 Cr · mapping % per entity (D.r2r.settings.mapping). */
(function(){
const D = window.FCT_DATA, X = D.r2rx, C = X.config, R = X.rng(C.seed), RD = D.r2r;
const MS = C.mStart, SNAP = C.snap;
const U = (a,b)=> a + R()*(b-a);
const UI = (a,b)=> Math.floor(U(a,b+1));
const gauss = ()=>{ let u=0,v=0; while(!u) u=R(); while(!v) v=R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
const shuffle = (a)=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const pick = (a)=> a[Math.floor(R()*a.length)];
const r4 = (x)=> Math.round(x*1e4)/1e4;
const user = (id)=> id==='AI'? 'AI matcher' : ((D.users.find(u=>u.id===id)||{}).name || id);

/* ---------- working-day calendar: WD0 = last calendar day of the month; WD+k = k-th business day after it ---------- */
const biz = (d)=>{ const w = ((3+d)%7+7)%7; return w!==0 && w!==6 && !C.holidays.includes(d); };
const wd = (m, k)=>{ let d = MS[m+1]-1; if(k>0){ let n=0; while(n<k){ d++; if(biz(d)) n++; } } else if(k<0){ let n=0; while(n<-k){ d--; if(biz(d)) n++; } } return d; };
X.wd = wd;
const at = (m, k, h)=> wd(m, k) + h/24;          /* a working day at hour h */

const ents = X.ents, E = {}; ents.forEach(e=> E[e.id] = e);
const staff = { 'IN-01':['Arjun Rao','Divya Nair','Karan Gill'], 'IN-02':['Kiran Patel','Sneha Joshi','Rahul Bhat'], 'IN-03':['Pallavi Rane','Manoj Iyer'], 'IN-04':['Ritesh Shah','Nisha Kapoor'],
  'IN-05':['Farhan Qureshi','Gaurav Sinha'], 'IN-06':['Swati Kulkarni','Ajay Menon'], 'IN-07':['Rohan Mehta','Anjali Kulkarni'], 'IN-08':['Lata Krishnan','Vinod Rao'], 'US-01':['Tom Brennan','Lisa Chen'], 'EU-01':['Clara Weber','Jonas Fischer'] };
const ctlName = (e)=> user(E[e].ctl);
const prepOf = (e)=>{ const c = ctlName(e), xs = staff[e].filter(n=> n!==c); return pick(xs.length? xs : staff[e]); };   /* preparers exclude the reviewing controller */
X.staff = staff;

/* ---------- 1. close tasks ---------- */
/* Sep: behind plan per entity adds to 31 (close.lateTasks); done-early = done − (plan − behind) adds to 13 */
const behind = { 'IN-01':1, 'IN-02':3, 'IN-03':3, 'IN-04':1, 'IN-05':4, 'IN-06':0, 'IN-07':14, 'IN-08':2, 'US-01':2, 'EU-01':1 };
const GRP = { 'Sub-ledger':[.12,-1,1,['AP sub-ledger lock','AR sub-ledger lock','Inventory sub-ledger lock','Fixed-asset register lock','Payroll interface check']],
  'Accruals':[.16,-1,2,['Freight accrual','Utilities accrual','Professional fees accrual','Bonus accrual','Royalty accrual','Contract labour accrual']],
  'Journals':[.14,1,3,['Depreciation run','Prepaid amortisation','Recurring journals review','Reclass review','FX revaluation']],
  'Revenue':[.08,1,3,['Revenue cut-off review','Unbilled revenue','Sales returns provision','Rebates accrual']],
  'Recs':[.26,1,4,['Bank reconciliations','Receivables reconciliation','Payables reconciliation','GR/IR clearing review','Inventory reconciliation','Tax reconciliation']],
  'Certify':[.10,2,4,['Certify high-risk reconciliations','Certify medium-risk reconciliations','Controller sign-off']],
  'IC':[.06,1,3,['IC confirmations sent','IC balances agreed','IC recharges posted']],
  'Pack':[.08,3,4,['Trial balance lock','Management pack draft','Variance commentary','Disclosure checklist']] };
const gNames = Object.keys(GRP);
const namedLate = [ ['IN-07','IC','IC rec IN-07↔IN-01 (Sep)','RM','Not started',1,1], ['IN-07','Accruals','Accrual: clinical trial site costs (sites 1–5)','RM','AI draft',1,1], ['IN-07','Accruals','Accrual: clinical trial site costs (sites 6–9)','RM','AI draft',1,1],
  ['IN-07','Revenue','Revenue POC %: projects P-2207 to P-2219','AK','Blocked (PMO feed)',2,1], ['IN-05','Recs','GR/IR clearing review','IN05C','In progress',1,0], ['US-01','IC','IC rec IN-02↔US-01','US01C','Break ₹3.1 Cr',2,0],
  ['IN-02','Journals','Fixed-asset CWIP capitalisation','AR','In progress',1,0], ['IN-05','Accruals','Inventory provision review','IN05C','Awaiting controller',1,0], ['IN-05','Recs','Bank rec Axis ****2290','IN05C','2 items open',1,0],
  ['IN-02','Revenue','Revenue cut-off review','NI','Awaiting controller',2,0], ['IN-08','Recs','Suspense clearing GL 1999','IN08C','7 suggested',1,0], ['US-01','Journals','FX revaluation US-01','US01C','Rate table pending',1,0] ];
const T = [];
const lateRate = [.16,.145,.135,.125,.11];
for(let m=0;m<6;m++) ents.forEach(e=>{
  const n = m===5? e.tasks : e.tasks - UI(0,3), list = [];
  for(let i=0;i<n;i++){ let x = R(), g = gNames[0]; for(const k of gNames){ if(x < GRP[k][0]){ g = k; break; } x -= GRP[k][0]; }
    const [, a, b, names] = GRP[g]; list.push({ grp:g, due:UI(a,b), name:pick(names) }); }
  if(m===5){
    list.forEach(t=> t._k = R()); list.sort((x,y)=> x.due - y.due || x._k - y._k);   /* tie-break keys drawn first: same order in every JS engine */
    list.forEach((t,i)=>{ t.due = i < e.plan? Math.min(t.due, 2) : Math.max(t.due, 3); });
    const due = list.filter(t=> t.due<=2), later = list.filter(t=> t.due>2);
    const nb = behind[e.id], early = e.done - (e.plan - nb);
    shuffle(due).forEach((t,i)=>{ if(i < nb){ t.doneWD = null; } else { t.doneWD = t.due - (R()<.3? 1 : 0); } });
    later.forEach((t,i)=>{ t.doneWD = i < early? UI(1,2) : null; });
    /* the named late tasks (data/r2r.js lateTasks) replace the first behind-plan tasks of their entity */
    const lt = due.filter(t=> t.doneWD==null);
    namedLate.filter(x=> x[0]===e.id).forEach((x,i)=>{ const t = lt[i]; Object.assign(t, { grp:x[1], name:x[2], owner:user(x[3]), st:x[4], due:x[5], fixable:!!x[6] }); });
    /* the rest of IN-07's slipped tasks clear when the IC rec is reassigned and the drafted accruals are approved (RTR-CLS-01): 10 tasks in all */
    if(e.id==='IN-07'){ let k = lt.filter(t=> t.fixable).length; lt.forEach(t=>{ if(!t.fixable && k<10){ t.fixable = true; k++; } }); }
  } else {
    const lr = lateRate[m]*(e.id==='IN-07'? 2.2 : e.id==='IN-05'? 1.5 : e.id==='IN-06'? .4 : 1);
    list.forEach(t=>{ t.doneWD = t.due + (R()<lr? UI(1,2) : -(R()<.3? 1 : 0)); });
  }
  list.forEach((t,i)=> T.push({ id:'CT-'+e.id.replace('-','')+'-'+C.months[m].slice(0,3).toUpperCase()+'-'+String(i+1).padStart(3,'0'), kind:'task', e:e.id, m, grp:t.grp, stage:C.groups.find(g=>g[0]===t.grp)[1],
    name:t.name, owner:t.owner || (t.grp==='Certify'||t.grp==='Pack'? ctlName(e.id) : prepOf(e.id)), dueWD:t.due, doneWD:t.doneWD,
    doneAt: t.doneWD==null? null : at(m, t.doneWD, U(10,18)), st: t.st || (t.doneWD!=null? 'Done' : pick(['In progress','In progress','Not started','Awaiting review'])), fixable:!!t.fixable }));
});

/* ---------- 2. reconciliation units (stable across months) and monthly reconciliations ---------- */
const bsAccts = C.accts.filter(a=> a.cls==='BS'), wS = bsAccts.reduce((s,a)=>s+a.w,0);
const scale = { '1101':[2,45], '1310':[10,70], '1410':[20,90], '2010':[10,60], '1360':[3,50], '2260':[3,40], '1620':[20,120] };
const namedRec = RD.recs.map(r=>{ const n = r.acc.split(' ')[0]; const acct = n==='1365'? '1360' : n==='1120'? '1101' : n; return Object.assign({ acct }, r); });
const units = [];
ents.forEach(e=>{
  const mine = namedRec.filter(r=> r.entity===e.id), seq = {};
  mine.forEach(r=>{ seq[r.acct] = (seq[r.acct]||0)+1; units.push({ uid:e.id+'-'+r.acct+'-'+String(seq[r.acct]).padStart(2,'0'), e:e.id, acct:r.acct, name:r.acc, base:r.gl, named:r }); });
  for(let i=mine.length;i<e.recs;i++){ let x = R()*wS, a = bsAccts[0]; for(const b of bsAccts){ if(x < b.w){ a = b; break; } x -= b.w; }
    seq[a.id] = (seq[a.id]||0)+1; const s = scale[a.id] || [.4,18];
    units.push({ uid:e.id+'-'+a.id+'-'+String(seq[a.id]).padStart(2,'0'), e:e.id, acct:a.id, name:a.id+' '+a.name+(seq[a.id]>1? ' · '+seq[a.id] : ''), base:r4(Math.exp(Math.log(s[0])+R()*(Math.log(s[1])-Math.log(s[0])))) }); }
});
const ACCT = {}; C.accts.forEach(a=> ACCT[a.id] = a);
/* sub-ledger accounts tie to the towers that own them (data/xtower.js, generated from the P2P, O2C and SC ledgers). An entity with no
   such sub-ledger (no customers at IN-01, no stock at IN-01 or IN-07) carries those units as prepaid expenses instead; the unit keeps its
   original risk class, so due days, certification and breaks are drawn exactly as before */
const SL = (window.FCT_DATA||{}).subledger || null;
if(SL) units.forEach(u=>{ if(SL[u.acct] && !u.named && !(SL[u.acct][u.e] > 0)){ u.risk = ACCT[u.acct].risk; u.from = u.acct; u.acct = '1520';
  u.name = u.name.replace(/^\d{4} [^·]*/, '1520 '+ACCT['1520'].name+' '); } });
const dueFor = (risk)=> risk==='High'? UI(1,2) : risk==='Medium'? UI(2,3) : UI(3,4);
const Rc = [];
const breakDiff = { 'IN-02':[.42], 'IN-03':[.18], 'IN-04':[.26], 'IN-05':[.31], 'IN-07':[.57], 'US-01':[.22] };
const lateCert = [.09,.085,.08,.07,.06];
for(let m=0;m<6;m++){
  ents.forEach(e=>{
    const us = units.filter(u=> u.e===e.id), recs = us.map(u=>{ const risk = u.risk || ACCT[u.acct].risk, gl = r4(u.base*(1+gauss()*.06*(5-m)/5));
      return { id:'REC-'+u.uid+'-'+C.months[m].slice(0,3).toUpperCase(), kind:'rec', uid:u.uid, e:e.id, m, acct:u.acct, name:u.name, risk, gl, sub:gl, diff:0, expl:0, items:[0,0,0,0],
        dueWD:dueFor(risk), prep:prepOf(e.id), rev:ctlName(e.id), named:m===5? u.named : null }; });
    if(m<5){
      recs.forEach(r=>{ r.certWD = r.dueWD + (R()<lateCert[m]*(e.id==='IN-07'? 2 : 1)? 1 : -(R()<.4? 1 : 0)); r.st = 'Certified';
        if(R()<.25){ r.items = [UI(1,3),0,0,0]; r.expl = r4(r.gl*U(.002,.02)); r.sub = r4(r.gl - r.expl); } });
    } else {
      /* named reconciliations keep their data/r2r.js values; the rest fill each entity to its certified and break counts */
      const nm = recs.filter(r=> r.named), gen = recs.filter(r=> !r.named);
      nm.forEach(r=>{ const n = r.named; Object.assign(r, { gl:n.gl, sub:n.sub, diff:n.diff, st:n.status==='Open'? 'Open' : n.status, prep:user(n.prep), rev:user(n.rev), ex:n.ex, agedDays:n.aged,
        risk:n.risk, dueWD: n.status==='Certified'? 1 : n.risk==='High'? 1 : 2 }); if(n.status==='Certified') r.certWD = 1; });
      const nbr = e.open - nm.filter(r=> r.st==='Break').length;
      gen.forEach(r=> r._k = R()); gen.sort((a,b)=> a.dueWD - b.dueWD || a._k - b._k);
      const needCert = e.cert - nm.filter(r=> r.st==='Certified').length;
      const pool = gen.slice(); const certs = [];
      /* certified first from the earliest due, with a few certified after their due day; breaks from the remaining High-risk units */
      for(const r of pool){ if(certs.length>=needCert) break; if(R()<.93 || r.dueWD>2) certs.push(r); }
      for(const r of pool){ if(certs.length>=needCert) break; if(!certs.includes(r)) certs.push(r); }
      certs.forEach(r=>{ r.st = 'Certified'; r.certWD = Math.min(2, r.dueWD<=2 && R()<.06? r.dueWD+1 : Math.max(0, r.dueWD - (R()<.5? 1 : 0)));
        if(r.dueWD>2) r.certWD = UI(1,2); });   /* Sep reconciling items are placed below from the recAgeing anchor */
      const rest = gen.filter(r=> !certs.includes(r)); rest.forEach(r=> r._k = R()); rest.sort((a,b)=> (a.risk==='High'? 0 : 1) - (b.risk==='High'? 0 : 1) || a._k - b._k);
      rest.forEach((r,i)=>{ if(i < nbr){ const d = (breakDiff[e.id]||[.2])[i] || r4(U(.12,.4)); r.st = 'Break'; r.diff = d; r.sub = r4(r.gl - d); }
        else { r.st = pick(['Prepared','Prepared','AI pre-matched','In progress','In progress','Not started']);
          if(r.st==='In progress' && R()<.35){ r.diff = r4(U(.002,.06)); r.sub = r4(r.gl - r.diff); } } });
    }
    recs.forEach(r=>{ if(r.certWD!=null) r.certAt = at(m, r.certWD, U(10,19)); if(r.st!=='Not started') r.prepAt = at(m, Math.min(r.certWD!=null? r.certWD : 2, r.dueWD) - (R()<.5? 1 : 0), U(9,17)); });
    Rc.push(...recs);
  });
}
/* Sep reconciling items by age (data/r2r.js recAgeing: 214 / 38 / 11 / 4) placed on uncertified and certified Sep reconciliations */
/* the suspense account holds the nine items over 30 days of RTR-REC-07 (7 at 30–60 days, 2 at 60–90 days); the rest are placed on other reconciliations */
(()=>{ const sep = Rc.filter(r=> r.m===5), susp = sep.find(r=> r.named && r.acct==='1999'), open = sep.filter(r=> r.st!=='Certified' && r!==susp), any = sep.filter(r=> r!==susp);
  susp.items = [0,7,2,0];
  RD.recAgeing.forEach(([,n],b)=>{ for(let i=susp.items[b];i<n;i++){ const r = b>=2? pick(open.filter(x=> x.risk!=='Low')) : pick(R()<.55? open : any); r.items[b]++; } });
  sep.forEach(r=>{ const k = r.items[0]+r.items[1]+r.items[2]+r.items[3]; if(k && !r.expl && !r.named && r.st!=='Break'){ r.expl = r4(Math.min(r.gl*.03, k*U(.004,.03))); r.sub = r4(r.gl - r.expl - r.diff); } }); })();

/* GL and sub-ledger levels for 1310 / 1410 / 2010 / 2110: the Sep sub-ledger side sums to the tower balance for the entity, split across
   the entity's reconciliations by their seeded size (named reconciliations keep their stated figure unless it exceeds the tower balance).
   GL = sub-ledger + difference + explained items, so breaks and Unmatched Balances are unchanged. Earlier months scale by the same factor. */
if(SL) ents.forEach(e=> Object.keys(SL).forEach(acct=>{
  const V = SL[acct][e.id] || 0, sep = Rc.filter(r=> r.m===5 && r.e===e.id && r.acct===acct); if(!sep.length || !(V>0)) return;
  const nm = sep.filter(r=> r.named), gen = sep.filter(r=> !r.named), nmSub = nm.reduce((t,r)=> t+r.sub, 0);
  const nk = nmSub > V*.8? V*.6/nmSub : 1;   /* a named figure larger than the tower balance is scaled down (IN-05 GR/IR) */
  nm.forEach(r=>{ if(nk<1){ r.sub = r4(r.sub*nk); r.gl = r4(r.sub + r.diff + (r.expl||0)); } });
  const left = V - nm.reduce((t,r)=> t+r.sub, 0), w = gen.reduce((t,r)=> t+(r.sub||0), 0) || 1;
  gen.forEach(r=>{ const sub = r4(left*(r.sub||0)/w), k = r.sub? sub/r.sub : 1;
    Rc.filter(x=> x.uid===r.uid && x.m<5).forEach(x=>{ x.gl = r4(x.gl*k); x.sub = r4(x.sub*k); x.expl = r4((x.expl||0)*k); });
    r.sub = sub; r.gl = r4(sub + (r.diff||0) + (r.expl||0)); });
}));
/* units moved to prepaid expenses keep their pattern at prepaid scale (1% of the seeded inventory or receivable size) */
if(SL) Rc.filter(r=> units.find(u=> u.uid===r.uid && u.from)).forEach(r=>{ r.sub = r4(r.sub*.01); r.expl = r4((r.expl||0)*.01); r.gl = r4(r.sub + (r.diff||0) + r.expl); });
if(SL) ents.forEach(e=> Object.keys(SL).forEach(acct=>{ const V = SL[acct][e.id] || 0, sep = Rc.filter(r=> r.m===5 && r.e===e.id && r.acct===acct); if(!sep.length || !(V>0)) return;
  const gen = sep.filter(r=> !r.named);
  /* rounding: put the last paisa on the largest generated reconciliation */
  const d = r4(V - sep.reduce((t,r)=> t+r.sub, 0)), big = gen.slice().sort((a,b)=> b.sub-a.sub)[0];
  if(big && Math.abs(d)>0){ big.sub = r4(big.sub + d); big.gl = r4(big.gl + d); }
}));

/* ---------- 3. journals ---------- */
const JV = { tot:[3780,3805,3842,3866,3890,3912], man:[1218,1205,1196,1180,1162,1146], ai:[180,214,256,298,331,352], rev:[262,265,268,270,274,278],
  exc:[74,67,65,57,50,43], cor:[96,88,91,77,70,61] };
const jw = {}; ents.forEach(e=> jw[e.id] = e.tasks);
const jwS = Object.values(jw).reduce((a,b)=>a+b,0);
const entPick = ()=>{ let x = R()*jwS; for(const e of ents){ if(x < jw[e.id]) return e.id; x -= jw[e.id]; } return 'IN-01'; };
const jcat = {}; C.jcats.forEach(c=> jcat[c[0]] = c);
const drFor = { acc:['6100','6130','6210','6510','6900','2210'], rcl:['6900','6100','1610','5010'], cor:['6900','6100','6300','5010','2210'], fx:['6610'], dep:['6410'], ic:['1360','2260'], prv:['2510','6900'], rev:['4010','1310'], pay:['6300'], inv:['5010','1410'] };
const usedJ = new Set();
const jid = (e, d, n)=>{ const x = new Date(Date.UTC(2026,3,1)+Math.floor(d)*864e5); let id;
  do { id = 'JE-'+e.replace('-','')+'-'+String(x.getUTCMonth()+1).padStart(2,'0')+String(x.getUTCDate()).padStart(2,'0')+'-'+String(n==null? UI(1000,9999) : n).padStart(4,'0'); n = null; } while(usedJ.has(id)); usedJ.add(id); return id; };
const J = [];
const FL = ['noSupp','late','sod','anom','corr'];
for(let m=0;m<6;m++){
  const tot = JV.tot[m], man = JV.man[m], ai = JV.ai[m], rev = JV.rev[m], int = tot - man - rev;
  const mk = (src, n)=>{ for(let i=0;i<n;i++){ const e = entPick();
    const cat = src==='int'? pick(['dep','ic','pay','inv','inv','acc','fx']) : src==='rev'? 'acc' : src==='ai'? pick(['acc','acc','acc','dep','prv','pay']) : pick(['acc','rcl','prv','rev','inv','fx','ic','acc']);
    const k = src==='int'? U(-8,2) : src==='rev'? U(-1,1) : U(-2,2), post = at(m, Math.round(k), U(9,20)) + (src==='int'? U(-12,0) : 0);
    const val = r4(Math.min(9, Math.exp(gauss()*1.1)*(src==='int'? .32 : src==='rev'? .18 : .14)));
    const prep = src==='int'||src==='rev'? 'System' : src==='ai'? 'AI (reviewed by '+prepOf(e)+')' : prepOf(e);
    const appr = src==='int'||src==='rev'? null : ctlName(e);
    J.push({ id:jid(e, post), kind:'je', e, m, src, cat, acct:pick(drFor[cat]), acct2:jcat[cat][3], val, post, prep, appr, apprAt: appr? post - U(.05,1.2) : null, supp:true, score:r4(Math.pow(R(),3)*.7), st:'Posted', fl:[] });
  } };
  mk('int', int); mk('rev', rev); mk('ai', ai); mk('man', man - ai);
  /* corrections: the 'corrective' journal trend (data/r2r.js journals.trend) */
  const manual = J.filter(j=> j.m===m && (j.src==='man'));
  shuffle(manual).slice(0, JV.cor[m]).forEach(j=>{ j.cat = 'cor'; j.acct = pick(drFor.cor); j.acct2 = '2210'; });
}
/* exceptions on manual journals: Sep breakdown is anomalies 7 (named), no support 11 (IN-07), approved after posting 12, same user 5, corrected 8 = 43 */
const anomSep = RD.anomalies.map(([id,e,score,desc,ex],i)=> ({ id, e, score, desc, ex, val:[2.40,.38,.21,.27,.52,.99,.30][i] }));
for(let m=0;m<6;m++){
  const man = J.filter(j=> j.m===m && (j.src==='man'||j.src==='ai'));
  if(m===5){
    const pool = shuffle(man.slice());
    anomSep.forEach(a=>{ const j = pool.find(x=> x.e===a.e && !x.fl.length && x.src==='man'); usedJ.delete(j.id); Object.assign(j, { id:a.id, val:a.val, score:a.score, desc:a.desc, ex:a.ex, fl:['anom'], post:at(5, 0, U(18,23.8)) }); usedJ.add(a.id); });
    const inn = pool.filter(j=> j.e==='IN-07' && !j.fl.length).slice(0,11); inn.forEach(j=>{ j.fl.push('noSupp'); j.supp = false; });
    const fill = (fl, n)=> pool.filter(j=> !j.fl.length).slice(0,n).forEach(j=>{ j.fl.push(fl); if(fl==='late') j.apprAt = j.post + U(.2,2.5); if(fl==='sod') j.appr = j.prep; });
    fill('late',12); fill('sod',5); fill('corr',8);
  } else {
    const pool = shuffle(man.slice()), n = JV.exc[m];
    pool.slice(0, n).forEach((j,i)=>{ const fl = i < Math.round(n*.18)? 'anom' : pick(['noSupp','late','late','sod','corr','corr']); j.fl.push(fl);
      if(fl==='anom') j.score = r4(U(.75,.92)); if(fl==='late') j.apprAt = j.post + U(.2,2.5); if(fl==='sod') j.appr = j.prep; if(fl==='noSupp') j.supp = false; });
  }
}
/* named journals outside the generated mix */
J.push({ id:'JE-IN08-1002-0071', kind:'je', e:'IN-08', m:4, src:'man', cat:'rcl', acct:'6100', acct2:'2210', val:.42, post:184+11.5/24, prep:'fin_admin (superuser)', appr:null, apprAt:null, supp:false, score:.71, st:'Posted', fl:['perPost'],
  desc:'Freight dated 31-Aug posted on 02-Oct after the August lock', ex:'RTR-PER-10' });
J.push({ id:'JE-IN03-0831-2210', kind:'je', e:'IN-03', m:4, src:'man', cat:'acc', acct:'6210', acct2:'2210', val:.86, post:at(4,0,17), prep:'Pallavi Rane', appr:'Arjun Rao', apprAt:at(4,0,16), supp:true, score:.22, st:'Posted', fl:[],
  desc:'August contract-labour accrual posted without the auto-reverse flag', ex:'RTR-ACR-09' });
/* pending approval at the snapshot: 6 named (data/r2r.js journals.pending) + 58 low-risk worth ₹1.20 Cr; 14 IN-07 AI drafts not yet submitted */
RD.journals.pending.forEach(([id,e,desc,v,risk,src])=>{ usedJ.add(id); J.push({ id, kind:'je', e, m:5, src:src==='AI'? 'ai' : 'man', cat:/FX/.test(desc)? 'fx' : /Depreciation/.test(desc)? 'dep' : /Reclass/.test(desc)? 'rcl' : /Inventory/.test(desc)? 'inv' : 'acc',
  acct:/FX/.test(desc)? '6610' : /Depreciation/.test(desc)? '6410' : /Reclass/.test(desc)? '1610' : /Inventory/.test(desc)? '5010' : /Royalty/.test(desc)? '1310' : '6100', acct2:'2210', val:+v, post:null, sub:at(5, risk==='High'? 0 : 1, U(10,18)),
  prep:src==='AI'? 'AI (reviewed by '+staff[e][1]+')' : staff[e][0], appr:null, apprAt:null, supp:true, score:risk==='High'? .6 : .2, st:'Pending', risk, review:true, desc, fl:[] }); });   /* the 6 named journals are the ones routed to a reviewer (RTR-JNL-08) */
(()=>{ const w = []; for(let i=0;i<58;i++) w.push(Math.exp(gauss()*.8)); const s = w.reduce((a,b)=>a+b,0);
  w.forEach((x,i)=>{ const e = entPick(), sub = i<9? at(5,0,U(9,18)) : at(5, UI(1,2), U(8,9)); J.push({ id:jid(e, sub), kind:'je', e, m:5, src:i<26? 'ai' : 'man', cat:pick(['acc','acc','dep','pay','prv']),
    acct:pick(['6100','6210','6510','6900','6300']), acct2:'2210', val:r4(x/s*1.20), post:null, sub, prep:i<26? 'AI (reviewed by '+prepOf(e)+')' : prepOf(e), appr:null, apprAt:null, supp:true, score:r4(R()*.3), st:'Pending', risk:'Low', review:false, fl:[] }); }); })();
RD.journals.in07.forEach(([site,basis,v],i)=> J.push({ id:'JE-IN07-1002-'+String(5101+i), kind:'je', e:'IN-07', m:5, src:'ai', cat:'acc', acct:'6130', acct2:'2210', val:v, post:null, sub:null, drafted:184+14/24+i/1440,
  prep:'AI (for Rohan Mehta, on leave)', appr:null, apprAt:null, supp:true, score:.12, st:'Draft', risk:'Low', desc:'Clinical-trial accrual: '+site+' ('+basis+')', fl:[], in07:true }));

/* ---------- 4. intercompany items ---------- */
const IC = [];
RD.ic.pairs.forEach(([a,b,glA,glB,ccy,status,ex])=>{
  for(let m=0;m<6;m++){
    const n = a==='IN-07'? 8 : UI(22,34), w = []; for(let i=0;i<n;i++) w.push(Math.exp(gauss()*.7)); const s = w.reduce((x,y)=>x+y,0);
    const total = m===5? glA : glA*U(.8,1.15);
    w.forEach((x,i)=>{ const val = r4(x/s*total); let st = 'Agreed', diff = 0;
      if(m<5 && R()<.035){ st = pick(['Timing difference','FX difference','Not confirmed']); diff = r4(val*(st==='FX difference'? .02 : 1)); }
      IC.push({ id:'IC-'+a.replace('-','')+b.replace('-','')+'-'+C.months[m].slice(0,3).toUpperCase()+'-'+String(i+1).padStart(2,'0'), kind:'ic', m, a, b, pair:a+'↔'+b, ccy, val, st, diff, ref:a.replace('-','')+'/IC/'+String(2600+UI(1,999)) }); });
    if(m===5){ const its = IC.filter(x=> x.m===5 && x.pair===a+'↔'+b);
      if(a==='IN-02' && b==='US-01'){ const s0 = its.sort((x,y)=> y.val-x.val);
        /* the GIT invoice replaces part of the largest item so the pair still adds to ₹48.70 Cr */
        s0[0].val = r4(s0[0].val - 2.60); IC.push({ id:'IC-IN02US01-SEP-GIT', kind:'ic', m:5, a, b, pair:a+'↔'+b, ccy, val:2.60, st:'Timing difference', diff:2.60, ref:'IN02/EXP/26/1187', note:'Goods in transit: invoiced 29-Sep, received by US-01 on 03-Oct', ex });
        Object.assign(s0[1], { st:'FX difference', diff:.50, note:'US-01 translated at the September average rate, not the 30-Sep closing rate', ex }); }
      if(a==='IN-07') its.forEach(x=> Object.assign(x, { st:'Not confirmed', diff:x.val, note:'Confirmation not sent: owner on leave', ex }));
      if(a==='IN-04' && b==='US-01') Object.assign(its[0], { st:'Agreed (FX rounding)', diff:.08, note:'FX rounding ₹8 L, below the ₹10 L threshold' }); }
  }
});

/* ---------- 5. material variances (₹2 Cr or more against budget) ---------- */
const VA = [];
const vLines = ['Revenue, domestic','Revenue, exports','Raw material','Freight inward','Freight outward','Employee cost','Power and fuel','Packaging material','Royalty income','Clinical trial costs','Repairs and maintenance','Other opex','R&D consumables','FX gain'];
const signedAt2 = [.48,.50,.53,.55,.58];
const vDraft = (line, e, v, pct)=> line+' at '+e+' was ₹'+Math.abs(v).toFixed(1)+' Cr ('+pct+') '+(v<0? 'above' : 'below')+' budget.';
for(let m=0;m<6;m++){
  if(m===5){
    RD.variances.forEach(x=> VA.push({ id:x.id, kind:'var', m:5, e:x.entity==='Group'? 'IN-01' : x.entity, group:x.entity==='Group', line:x.line, v:x.var, pct:x.pct, st:x.status==='Edited'? 'Edited draft' : x.status==='Draft'? 'AI draft' : 'Signed',
      signedWD:x.status==='Signed'? UI(1,2) : null, ex:x.ex, draft:x.draft, conf:x.conf, drivers:x.drivers }));
    const st = ['Edited draft','Edited draft','Edited draft','AI draft','AI draft','AI draft','Not started','Not started'];
    for(let i=0;i<24;i++){ const e = pick(ents).id, v = r4((R()<.6? -1 : 1)*U(2,9)), p = (v<0? '+' : '−')+UI(3,14)+'%', s = i<16? 'Signed' : st[i-16];
      VA.push({ id:'V-'+String(11+i).padStart(2,'0'), kind:'var', m:5, e, line:pick(vLines), v, pct:p, st:s, signedWD:s==='Signed'? UI(1,2) : null, draft:s==='Not started'? null : vDraft('', e, v, p) }); }
  } else {
    /* the share signed by WD+2 follows the improvement trend exactly; all are signed by WD+4 */
    const n = UI(28,36), k = Math.round(n*signedAt2[m]);
    for(let i=0;i<n;i++){ const e = pick(ents).id, v = r4((R()<.6? -1 : 1)*U(2,9)), p = (v<0? '+' : '−')+UI(3,14)+'%';
      VA.push({ id:'V-'+C.months[m].slice(0,3).toUpperCase()+'-'+String(i+1).padStart(2,'0'), kind:'var', m, e, line:pick(vLines), v, pct:p, st:'Signed', signedWD: i<k? UI(1,2) : UI(3,4) }); }
  }
}
VA.forEach(x=>{ if(!x.draft && x.st!=='Not started') x.draft = vDraft(x.line, x.e, x.v, x.pct); });

/* ---------- 6. unmapped local accounts (snapshot; D.r2r.settings.mapping) ---------- */
const MAPQ = {}; RD.settings.mapping.forEach(([e,coa,p])=> MAPQ[e] = { coa, pct:p });
const UM = [];
const localNames = ['Sundry deposits','Misc. income','Staff welfare','Local levies','Scrap sales','Bank charges, local','Testing fees','Rent, guest house','Licence fees','Sample costs'];
ents.forEach(e=>{ const n = Math.round(e.local*(1 - MAPQ[e.id].pct/100));
  const named = RD.settings.unmapped.filter(u=> u[0]===e.id).map(([,acc,sug,conf])=> ({ local:acc, sugg:sug.replace('Suggested: ',''), conf, bal: acc.startsWith('6120')? .64 : acc.startsWith('5418')? 1.18 : .31 }));
  if(e.id==='IN-05') named.find(x=> x.local.startsWith('5418')).ex = 'RTR-PCK-11';
  for(let i=0;i<n;i++){ const x = named[i] || { local:String(UI(5100,7999))+' '+pick(localNames), sugg:pick(C.accts.filter(a=> a.cls==='PL')).id+' (no confident match)', conf:r4(U(.35,.65)), bal:r4(U(.01,.12)) };
    UM.push(Object.assign({ id:'UMA-'+e.id+'-'+String(i+1).padStart(2,'0'), kind:'acct', e:e.id }, x)); } });

/* ---------- 7. R2R cases: one estimate per case ---------- */
const CS = []; let cn = 26000;
const mkCase = (o)=> CS.push(Object.assign({ id:'RC-'+(++cn), conf:.8, st:'open', lines:[], est:null, affected:null }, o));
const sepRec = (e, a)=> Rc.find(r=> r.m===5 && r.e===e && r.acct===a && r.named);
/* Sep, linked to the drawer exceptions */
mkCase({ type:'icBreak', e:'US-01', m:5, est:3.10, conf:.84, ex:'RTR-REC-03', lines:IC.filter(x=> x.m===5 && x.pair==='IN-02↔US-01' && x.diff).map(x=>x.id).concat([sepRec('IN-02','1360').id]), opened:at(5,1,15), note:'Goods in transit ₹2.60 Cr and FX translation ₹0.50 Cr explain the full difference' });
mkCase({ type:'icBreak', e:'US-01', m:5, est:1.40, conf:.80, ex:'SC-URP-08', opened:at(5,1,11), note:'Unrealised profit on intra-group stock held by US-01 not yet eliminated (supply chain tower)' });
mkCase({ type:'anomJe', e:'IN-05', m:5, est:2.40, conf:.93, ex:'RTR-JNL-02', lines:['JE-IN05-0930-7781', sepRec('IN-05','1310').id], opened:at(5,0,23.9), note:'Revenue adjustment at 23:48 with no support; auto-reverses on 01-Oct' });
anomSep.slice(1).forEach(a=>{ if(a.id==='JE-IN03-0928-4410') mkCase({ type:'reclass', e:a.e, m:5, est:a.val, conf:a.score, lines:[a.id], opened:at(5,1,9), note:'Judgement JR-2026-12 open: capitalisation of R&D consumables' });
  else mkCase({ type:'anomJe', e:a.e, m:5, est:a.val, conf:a.score, lines:[a.id], opened:at(5,1,9), note:a.desc, st: a.score>=.78? 'inv' : 'open' }); });
mkCase({ type:'suspense', e:'IN-08', m:5, est:.80, conf:.70, ex:'RTR-REC-07', lines:[sepRec('IN-08','1999').id], opened:at(5,1,10), note:'Nine items over 30 days; offsets suggested for seven' });
mkCase({ type:'accrDup', e:'IN-03', m:5, est:.86, conf:.95, ex:'RTR-ACR-09', lines:['JE-IN03-0831-2210'], opened:at(5,1,16) });
mkCase({ type:'accrMiss', e:'Group', m:5, est:4.10, conf:.82, ex:'PTP-GRNI-01', opened:at(5,1,12), note:'Goods received not invoiced with no accrual, across plants (P2P tower)' });
mkCase({ type:'accrMiss', e:'IN-07', m:5, est:2.71, conf:.90, ex:'RTR-CLS-01', lines:J.filter(j=> j.in07).map(j=>j.id), opened:184+14.2/24, note:'14 clinical-trial accruals drafted by AI on 02-Oct, not reviewed: expense understated until booked' });
mkCase({ type:'cutoff', e:'IN-02', m:5, est:6.30, live:'cutoff.cr', conf:.85, ex:'O2C-BILL-04', opened:at(5,2,8.8), note:'37 dispatches with proof of delivery and no invoice (O2C tower)' });
mkCase({ type:'provision', e:'IN-05', m:5, est:2.90, conf:.78, ex:'SC-INV-01', opened:at(5,1,13), note:'Inventory provision proposal not yet booked (supply chain tower)' });
mkCase({ type:'provision', e:'IN-02', m:5, est:null, conf:.55, opened:at(5,1,14), note:'Judgement JR-2026-15: contract-manufacturing dispute; legal confirmation due 06-Oct (not yet quantified)' });
mkCase({ type:'fxReval', e:'US-01', m:5, est:.18, conf:.74, lines:['JE-US01-1002-0044'], opened:at(5,2,8), note:'30-Sep rate table not loaded; revaluation drafted at the 29-Sep rate' });
Rc.filter(r=> r.m===5 && r.st==='Break' && !r.named).forEach(r=> mkCase({ type:'recBreak', e:r.e, m:5, est:r.diff, conf:r4(U(.6,.85)), lines:[r.id], opened:at(5,1,U(10,18)), st:R()<.4? 'inv' : 'open' }));
mkCase({ type:'period', e:'IN-08', m:5, affected:.42, conf:.91, ex:'RTR-PER-10', lines:['JE-IN08-1002-0071'], opened:184+12/24 });
(()=>{ const ls = J.filter(j=> j.m===5 && j.e==='IN-07' && j.fl.includes('noSupp')); mkCase({ type:'nosupp', e:'IN-07', m:5, affected:r4(ls.reduce((s,j)=>s+j.val,0)), conf:.97, lines:ls.map(j=>j.id), opened:at(5,1,17), note:'Control CTL-R2R-021: 11 journals without support' }); })();
['IN-05','IN-07','US-01','IN-03'].forEach(e=>{ const us = UM.filter(u=> u.e===e); mkCase({ type:'mapping', e, m:5, affected:r4(us.reduce((s,u)=>s+u.bal,0)), conf:.9, ex: e==='IN-05'? 'RTR-PCK-11' : undefined, lines:us.map(u=>u.id), opened:at(5,1,11),
  note: e==='IN-05'? 'Account 5418 Catalyst regeneration not mapped: pack other opex ₹174.7 Cr against trial balance ₹175.9 Cr' : us.length+' local accounts not mapped to the group chart' }); });
/* earlier closes: mostly resolved; a few still under review */
for(let m=0;m<5;m++){
  const js = J.filter(j=> j.m===m && j.fl.includes('anom')), rb = shuffle(Rc.filter(r=> r.m===m && r.risk==='High')).slice(0, UI(4,6));
  js.forEach(j=> mkCase({ type:'anomJe', e:j.e, m, est:j.val, conf:j.score, lines:[j.id], opened:at(m,1,10), st: R()<.62? 'nil' : 'booked' }));
  rb.forEach(r=>{ const d = r4(U(.12,.9)); mkCase({ type:'recBreak', e:r.e, m, est:d, conf:r4(U(.6,.85)), lines:[r.id], opened:at(m,1,12), st: m===4 && R()<.4? 'inv' : pick(['booked','booked','nil','waived']) }); });
  /* accrual, cut-off, provision, FX and suspense cases link the manual journal or reconciliation that carried them */
  for(let i=0;i<UI(2,4);i++){ const e = pick(ents).id, type = pick(['accrMiss','accrDup','cutoff','provision','fxReval','suspense']);
    const want = { accrMiss:'acc', accrDup:'acc', cutoff:'rev', provision:'prv', fxReval:'fx' }[type];
    const link = type==='suspense'? Rc.find(r=> r.m===m && r.e===e && r.acct==='1999') : J.find(j=> j.m===m && j.e===e && j.src==='man' && j.cat===want) || J.find(j=> j.m===m && j.e===e && j.src==='man');
    mkCase({ type, e, m, est:r4(U(.1,1.6)), conf:r4(U(.6,.9)), lines: link? [link.id] : [], opened:at(m,1,14), st: m>=3 && R()<.25? 'proposed' : pick(['booked','booked','nil','waived']) }); }
}
X.tasks = T; X.recs = Rc; X.jes = J; X.ic = IC; X.vars = VA; X.unmapped = UM; X.cases = CS;
})();
