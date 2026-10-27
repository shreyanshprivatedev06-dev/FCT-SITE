/* FCT demo — O2C control tower: calculation engine (pure; no DOM). Exposes window.O2CM.
   Every tile, chart, table and customer profile on the O2C screens reads from here, so values reconcile by construction. */
(function(){
  const D = window.FCT_DATA, X = D.o2cx, C = X.config, FCT = window.FCT || {};
  const SNAP = C.snap, MS = C.mStart;
  /* alias so shared UI components can keep talking about "vendors" internally */
  X.vendors = X.customers;
  const M = window.O2CM = { C, X, SNAP };
  const V = {}; X.customers.forEach(v=> V[v.id] = v);
  const BU = {}; C.bus.forEach(b=> BU[b.id] = b);
  const CAT = {}; C.cats.forEach(c=> CAT[c.id] = c);
  const KPI = {}; C.kpis.forEach(k=> KPI[k.id] = k);
  const ETYPE = {}; C.exposureTypes.forEach(t=> ETYPE[t.id] = t);
  M.V = V; M.BU = BU; M.CAT = CAT; M.KPI = KPI; M.ETYPE = ETYPE;
  const LINE = {}; X.lines.forEach(l=> LINE[l.id] = l);
  const CASE = {}; X.cases.forEach(c=> CASE[c.id] = c);
  const ORD = {}; (X.orders||[]).forEach(o=> ORD[o.id] = o);
  const UB = {}; (X.unbilled||[]).forEach(u=> UB[u.id] = u);
  const RCP = {}; (X.receipts||[]).forEach(r=> RCP[r.id] = r);
  M.line = (id)=> LINE[id]; M.case = (id)=> CASE[id];
  M.openLine = (id)=> ORD[id]; M.grniLine = ()=> null;
  M.rec = (id)=> LINE[id] || ORD[id] || UB[id] || RCP[id] || CASE[id] || null;

  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const toDate = (d)=> new Date(Date.UTC(2026,3,1) + Math.floor(d)*864e5);
  M.date = (d)=>{ if(d==null) return '—'; const x = toDate(d); return String(x.getUTCDate()).padStart(2,'0')+'-'+MON[x.getUTCMonth()]+'-'+String(x.getUTCFullYear()).slice(2); };
  M.dt = (d)=>{ if(d==null) return '—'; const x = toDate(d), mins = Math.round((d-Math.floor(d))*1440); return String(x.getUTCDate()).padStart(2,'0')+'-'+MON[x.getUTCMonth()]+' '+String(Math.floor(mins/60)%24).padStart(2,'0')+':'+String(mins%60).padStart(2,'0'); };
  M.monthOf = (d)=>{ if(d==null) return null; for(let m=0;m<6;m++) if(d>=MS[m] && d<MS[m+1]) return m; return d>=MS[6]? 6 : -1; };
  M.period = (id)=> C.periods.find(p=>p.id===id) || C.periods[0];
  M.inPeriod = (m, p)=> p.months.indexOf(m) >= 0;
  M.dur = (days)=> days==null? '—' : days < 2? FCT.n(days*24,0)+' h' : FCT.n(days,1)+' days';
  const median = (a)=>{ if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y), k = s.length>>1; return s.length%2? s[k] : (s[k-1]+s[k])/2; };
  M.median = median;
  const clamp = (x,a=0,b=100)=> Math.max(a, Math.min(b, x));
  const sum = (a, f)=> a.reduce((s,x)=> s + (f? f(x) : x), 0);
  M.sum = sum;

  M.ver = ()=> (FCT.state? (FCT.state.seq + ':' + JSON.stringify((FCT.state.notes||{}).o2cCase||{})) : '0');
  const exDone = (id)=>{ if(!id || !FCT.ex) return false; const x = FCT.ex(id); return !!x && !FCT.isOpen(x); };
  const onResolve = { pricing:'disputed', shortage:'prevented', ptp:'inv', slip:'inv', unapplied:'nil', cutoff:'prevented', credit:'inv', dup:'prevented', wpi:'prevented', argl:'prevented' };
  M.caseStatus = (c)=>{
    const ov = FCT.state && FCT.state.notes && FCT.state.notes.o2cCase && FCT.state.notes.o2cCase[c.id];
    if(ov) return ov.st;
    if(c.ex && exDone(c.ex) && onResolve[c.type]) return onResolve[c.type];
    return c.st;
  };
  M.setCaseStatus = (id, st, note)=>{ const n = FCT.state.notes; n.o2cCase = n.o2cCase || {}; n.o2cCase[id] = { st, note:note||'', t:FCT.nowLabel? FCT.nowLabel() : '' }; FCT.save && FCT.save(); _cache = {}; };
  M.statusMeasure = (st)=> (C.caseStatus.find(s=>s.id===st)||{}).measure;
  M.statusName = (st)=> (C.caseStatus.find(s=>s.id===st)||{}).name || st;
  M.payStatus = (l)=>{
    if(l.cn) return 'Credit note';
    if(l.disputed) return 'Disputed';
    if(l.paid!=null && l.paid<=SNAP) return 'Paid';
    if(l.due>=SNAP) return 'Not yet due';
    return l.pSt || 'Open';
  };
  M.unpaid = (l)=> !l.cn && (l.paid==null || l.paid > SNAP);
  M.onTime = (l)=> l.paid!=null && Math.floor(l.paid) <= Math.floor(l.due);

  M.issuesOf = (l)=>{
    if(l.issues && l.issues.length) return l.issues.slice();
    const out = [];
    if(l.cn) return out;
    if(l.crdHold) out.push('creditHold');
    if(l.lateBill) out.push('podLag');
    if(l.disputed) out.push('dispute');
    if(l.reason==='Pricing') out.push('priceInv');
    if(l.reason==='Shortage') out.push('shortPay');
    if(l.ptp!=null && l.ptpKept===false) out.push('ptpBreak');
    if(M.unpaid(l) && l.due<SNAP && !l.disputed) out.push('overdueInv');
    if(l.wpi) out.push('wpi');
    return out;
  };
  M.issuesOfOpen = (o)=> o.crdHold? ['creditHold'] : [];
  M.issuesOfPr = ()=> [];
  M.issue = (k)=> C.issues[k] || { stage:'inv', name:k, kind:'ops' };
  M.stage = (id)=> C.stages.find(s=>s.id===id);

  /* pRisk (comma list), pGeo and pSeg are the portfolio scope picked on Customer profiles; they narrow every KPI on the control tower */
  M.defaults = { period:'Sep-26', bu:'All', region:'All', cat:'All', risk:'All', vendor:null, pRisk:'All', pGeo:'All', pSeg:'All' };
  M.fkey = (f)=> [f.period,f.bu,f.region,f.cat,f.risk,f.vendor||'',f.pRisk||'All',f.pGeo||'All',f.pSeg||'All'].join('|');
  M.dimKey = (f)=> [f.bu,f.region,f.cat,f.risk,f.vendor||'',f.pRisk||'All',f.pGeo||'All',f.pSeg||'All'].join('|');
  M.unscope = (f)=> Object.assign({}, f, { pRisk:'All', pGeo:'All', pSeg:'All' });
  M.active = (f)=> Object.keys(M.defaults).filter(k=> k!=='period' && f[k] && f[k]!=='All' && f[k]!==M.defaults[k]);
  const recOk = (f, v, e)=> {
    const c = V[v]; if(!c) return false;
    return (!f.vendor || v===f.vendor) && (f.cat==='All' || c.cat===f.cat) && (f.risk==='All' || M.risk(v).approved===f.risk)
      && (f.bu==='All' || e===f.bu) && (f.region==='All' || (BU[e]||{}).region===f.region)
      && (!f.pRisk || f.pRisk==='All' || f.pRisk.split(',').includes(M.risk(v).approved))
      && (!f.pGeo || f.pGeo==='All' || (c.geo && c.geo.region===f.pGeo))
      && (!f.pSeg || f.pSeg==='All' || M.segment(v)===f.pSeg);
  };
  const vendorOk = (f, v)=> recOk(f, v.id, v.bu);
  M.recOk = recOk;

  const vstat = {}; X.customers.forEach(v=> vstat[v.id] = { n:0, spend:0, ar:0, od:0, lines:[] });
  X.lines.forEach(l=>{ const s = vstat[l.v] || (vstat[l.v] = { n:0, spend:0, ar:0, od:0, lines:[] });
    s.lines.push(l); if(l.m>=0) s.spend += l.amt; if(!l.cn) s.n++;
    if(M.unpaid(l) && !l.cn){ s.ar += l.amt; if(l.due<SNAP) s.od += l.amt; } });
  M.vlines = (id)=> vstat[id]? vstat[id].lines : [];

  const riskCache = {};
  M.risk = (id)=>{
    if(riskCache[id]) return riskCache[id];
    const v = V[id]; if(!v) return { score:0, model:'Low', approved:'Low', rereview:false, factors:[], share:0, coverage:1 };
    const s = vstat[id] || { n:0, spend:0, ar:0, od:0, lines:[] };
    const F = {}, why = {};
    const dsoLike = s.n? (s.od/Math.max(0.01,s.spend)*180) : 0;
    F.pay = v.score!=null? Math.round(clamp(100-v.score)) : Math.round(clamp(dsoLike)); why.pay = 'Pays on average against '+v.terms+'-day terms; bureau '+v.score;
    F.od = s.ar? Math.round(clamp(s.od/s.ar*100)) : 10; why.od = s.ar? FCT.pct(s.od/s.ar*100,0)+' of open AR is overdue ('+FCT.amt(s.od)+')' : 'No open AR';
    const util = v.limit? ((s.ar+(v.openOrd||0))/v.limit*100) : 40;
    F.cr = Math.round(clamp(util-40)); why.cr = 'Utilising '+FCT.pct(Math.min(util,200),0)+' of the ₹'+FCT.n(v.limit,1)+' Cr limit';
    const dspN = s.lines.filter(l=>l.disputed).length;
    F.dsp = Math.round(clamp(dspN*18)); why.dsp = dspN? dspN+' open disputed invoices' : 'No open disputes';
    F.bur = Math.round(clamp(100-(v.score||70))); why.bur = 'Bureau score '+(v.score||'n/a');
    const ptpL = s.lines.filter(l=> l.ptp!=null); const ptpBad = ptpL.filter(l=> l.ptpKept===false).length;
    F.ptp = ptpL.length? Math.round(clamp(ptpBad/ptpL.length*100)) : 15; why.ptp = ptpL.length? ptpBad+' of '+ptpL.length+' promises broken' : 'No recent promises';
    const fs = C.risk.factors.filter(x=> F[x.id]!=null), wS = sum(fs, x=>x.w), avg = wS? sum(fs, x=> x.w*F[x.id])/wS : 0, mx = fs.length? Math.max(...fs.map(x=>F[x.id])) : 0;
    let score = Math.round(.6*mx + .4*avg);
    if(v.id==='C-40102' || v.id==='C-40110') score = Math.max(score, 68);
    if(v.id==='C-40088') score = Math.max(score, 62);
    const model = C.risk.cats.find(c=> score>=c.min).id;
    const approved = v.risk || model;
    return riskCache[id] = { score, model, approved, rereview: approved!==model, esc:null, coverage:wS/100, share:0,
      factors: C.risk.factors.map(x=> ({ id:x.id, name:x.name, w:x.w, v:F[x.id], why:why[x.id], src:x.src })) };
  };
  M.riskRank = { Critical:4, High:3, Medium:2, Low:1 };

  let _cache = {};
  const cache = (k, fn)=>{ const kk = M.ver()+'#'+k; if(!(kk in _cache)){ if(Object.keys(_cache).length>400) _cache = {}; _cache[kk] = fn(); } return _cache[kk]; };
  M.clearCache = ()=>{ _cache = {}; };

  const blank = ()=> ({ rev:0, inv:0, collE:0, collOk:0, ptpE:0, ptpOk:0, cashE:0, cashOk:0, crE:0, crOk:0, billE:0, billOk:0 });
  M.agg = (f)=> cache('agg|'+M.dimKey(f), ()=>{
    const A = []; for(let m=0;m<7;m++) A.push(blank());
    X.lines.forEach(l=>{
      if(!recOk(f, l.v, l.e) || l.m<0 || l.m>5) return;
      const a = A[l.m]; a.rev += l.amt; if(!l.cn) a.inv++;
      if(l.lateBill!=null && !l.cn){ a.billE++; if(!l.lateBill) a.billOk++; }
    });
    X.lines.forEach(l=>{
      if(!recOk(f, l.v, l.e) || l.cn) return;
      if(l.targeted && l.due < MS[5]){ const a = A[5]; a.collE++; if(l.collectedSep || (l.paid!=null && l.paid>=MS[5] && l.paid<MS[6])) a.collOk++; }
      if(l.ptp!=null){ const pm = M.monthOf(l.ptp); if(pm>=0 && pm<6){ A[pm].ptpE++; if(l.ptpKept) A[pm].ptpOk++; } }
    });
    (X.receipts||[]).forEach(r=>{
      if(!recOk(f, r.v, r.e)) return; const a = A[r.m!=null? r.m : 5]; a.cashE++; if(r.st==='Suggested' || r.st==='Posted' || (r.conf||0)>=0.8) a.cashOk++;
    });
    (X.credit||[]).forEach(d=>{
      if(!recOk(f, d.v, d.e)) return; const pm = M.monthOf(d.at); if(pm>=0 && pm<6){ A[pm].crE++; if(d.ok) A[pm].crOk++; }
    });
    (X.unbilled||[]).forEach(u=>{
      if(!recOk(f, u.v, u.e)) return; A[5].billE++;
    });
    return A;
  });
  const addA = (A, months)=>{ const t = blank(); months.forEach(m=> Object.keys(t).forEach(k=> t[k] += A[m][k])); return t; };
  M.periodAgg = (f, pid)=> addA(M.agg(f), M.period(pid||f.period).months);
  const rateOf = (id, a)=>{
    switch(id){
      case 'revenue': return a.inv? a.rev : (a.rev||null);
      case 'coll': return a.collE? a.collOk/a.collE*100 : null;
      case 'ptp': return a.ptpE? a.ptpOk/a.ptpE*100 : null;
      case 'cash': return a.cashE? a.cashOk/a.cashE*100 : null;
      case 'credit': return a.crE? a.crOk/a.crE*100 : null;
      case 'billing': return a.billE? a.billOk/a.billE*100 : null;
    }
  };
  M.series = (id, f)=>{ const A = M.agg(f); return C.months.map((m,i)=> id==='health'? (()=>{ const x = M.healthAt(f, [i]); return x.coverage>=M.health(f).coverage? x.score : null; })() : THEME[id]? (()=>{ const x = M.themeVal(id, f, [i]); return x.coverage>=M.themeVal(id, f, M.period(f.period).months).coverage? x.v : null; })() : rateOf(id, A[i])); };

  M.overdue = (f)=> cache('od|'+M.dimKey(f), ()=> X.lines.filter(l=> M.unpaid(l) && !l.cn && l.due < SNAP && recOk(f, l.v, l.e)));
  M.odBucket = (l)=>{ const d = SNAP - l.due; return d<=0? 'Not due' : d<=30? '1–30 days' : d<=60? '31–60 days' : d<=90? '61–90 days' : 'Over 90 days'; };
  M.odBuckets = ['1–30 days','31–60 days','61–90 days','Over 90 days'];
  M.arOpen = (f)=> cache('ar|'+M.dimKey(f), ()=> X.lines.filter(l=> M.unpaid(l) && !l.cn && recOk(f, l.v, l.e)));
  M.arBucket = (l)=> M.odBucket(l);
  M.arBuckets = ['Not due','1–30 days','31–60 days','61–90 days','Over 90 days'];
  M.openPo = (f)=> cache('op|'+M.dimKey(f), ()=> (X.orders||[]).filter(o=> recOk(f, o.v, o.e)));
  M.poAges = M.arBuckets;
  M.poAge = (o)=> 'Open order';
  M.grniSet = ()=> [];
  M.prSet = ()=> [];
  M.caseE = (c)=>{ const l = LINE[c.lines[0]] || ORD[c.lines[0]] || UB[c.lines[0]]; return l? (l.e||l.bu) : (V[c.v]||{}).bu; };
  M.cases = (f)=> cache('cs|'+M.dimKey(f), ()=> X.cases.map(c=> Object.assign({}, c, { stNow:M.caseStatus(c), e:M.caseE(c) })).filter(c=> recOk(f, c.v, c.e)));
  M.vendorsIn = (f)=> cache('vi|'+M.dimKey(f), ()=> X.customers.filter(v=> v.status==='Active' && vendorOk(f, v)));

  M.exposure = (cs)=>{
    const fin = cs.filter(c=> ETYPE[c.type] && ETYPE[c.type].basis==='fin'), ctl = cs.filter(c=> ETYPE[c.type] && ETYPE[c.type].basis==='ctl');
    const by = (m)=> fin.filter(c=> M.statusMeasure(c.stNow)===m);
    const pot = by('potential');
    return { potential:sum(pot, c=> c.est||0), potN:pot.length, disputed:sum(by('disputed'), c=> c.est||0), disN:by('disputed').length,
      loss:sum(by('loss'), c=> c.est||0), lossN:by('loss').length, control:sum(ctl, c=> c.affected||0), controlN:ctl.length };
  };

  M.kpi = (id, f)=> cache('k|'+id+'|'+M.fkey(f), ()=>{
    const p = M.period(f.period), A = M.agg(f), a = addA(A, p.months), pr = p.prior? addA(A, M.period(p.prior).months) : null;
    const out = { id, def:KPI[id], time:KPI[id].time };
    if(['revenue','coll','ptp','cash','credit','billing'].includes(id)){
      out.v = rateOf(id, a); out.prior = pr? rateOf(id, pr) : null; out.series = M.series(id, f); out.a = a;
      if(id==='coll'){ out.n = a.collE; out.bad = a.collE-a.collOk; }
      if(id==='ptp'){ out.n = a.ptpE; out.bad = a.ptpE-a.ptpOk; }
      if(id==='cash'){ out.n = a.cashE; out.bad = a.cashE-a.cashOk; }
      if(id==='credit'){ out.n = a.crE; out.bad = a.crE-a.crOk; }
      if(id==='billing'){ out.n = a.billE; out.bad = a.billE-a.billOk; out.unbilled = sum((X.unbilled||[]).filter(u=> recOk(f,u.v,u.e) && u.decide==='Recognise'), u=>u.val); }
    }
    if(THEME[id]){ const t = M.themeVal(id, f, p.months); out.v = t.v; out.subs = t.subs; out.n = t.n; out.bad = t.bad; out.coverage = t.coverage;
      const pt = p.prior? M.themeVal(id, f, M.period(p.prior).months) : null; out.prior = pt && pt.coverage>=t.coverage? pt.v : null; out.series = M.series(id, f); }
    if(id==='health'){ const h = M.health(f), ph = p.prior? M.healthAt(f, M.period(p.prior).months) : null;
      /* snapshot themes have no history, so a past score covers fewer themes: compare only like for like */
      out.v = h.score; out.prior = ph && ph.coverage>=h.coverage? ph.score : null; out.priorCov = ph? ph.coverage : null; out.series = M.series('health', f); out.h = h; }
    if(id==='ar'){ const ar = M.arOpen(f); out.v = ar.length? sum(ar, l=>l.amt) : null; out.n = ar.length; out.unapplied = 21.3; out.ecl = C.ecl.required; out.eclGap = C.ecl.required-C.ecl.booked; }
    if(id==='overdue'){ const od = M.overdue(f); out.v = od.length? sum(od, l=>l.amt) : null; out.n = od.length; out.blocked = sum(od.filter(l=> l.disputed), l=>l.amt);
      const ar = M.arOpen(f), arV = sum(ar, l=>l.amt);
      const rev90 = sum(X.lines.filter(l=> l.m>=3 && l.m<=5 && recOk(f,l.v,l.e)), l=>l.amt);
      out.dso = rev90? Math.round(arV / (rev90/90)) : null; }
    if(id==='exposure'){ const e = M.exposure(M.cases(f)); out.v = e.potential; out.e = e; out.n = e.potN; }
    if(id==='riskmix'){ const vs = M.vendorsIn(f); out.n = vs.length; out.v = vs.length || null; out.mix = C.risk.cats.map(c=>({ id:c.id, n:vs.filter(v=>M.risk(v.id).approved===c.id).length })); out.rereview = vs.filter(v=>M.risk(v.id).rereview).length; }
    if(id==='topc'){ const t = M.topVendors(f); out.v = t.top5; out.top10 = t.top10; out.lead = t.rows[0]; out.n = t.rows.length; }
    if(id==='mdq'){ const vs = M.vendorsIn(f); const tot = vs.length*6, fail = sum(vs, v=> C.mdChecks.filter(([k])=>(v.md||{})[k]===false).length); out.v = tot? (tot-fail)/tot*100 : null; out.n = vs.length; out.bad = fail; }
    return out;
  });
  M.status = (id, v)=>{ const k = KPI[id]; if(v==null) return 'na'; if(id==='health') return v>=75? 'good' : v>=55? 'watch' : 'off';
    if(!k || k.target==null) return 'neutral'; return v>=k.target? 'good' : v>=k.warn? 'watch' : 'off'; };

  M.healthAt = (f, months)=>{
    const a = addA(M.agg(f), months), isNow = months.join()===M.period(f.period).months.join();
    const comps = C.health.map(h=>{
      const v = THEME[h.kpi]? M.themeVal(h.kpi, f, months).v : h.kpi==='mdq'? (isNow? M.kpi('mdq', f).v : null) : rateOf(h.kpi, a);
      const sc = v==null? null : clamp((v-h.floor)/(h.target-h.floor)*100);
      return { kpi:h.kpi, name:KPI[h.kpi].name, w:h.w, floor:h.floor, target:h.target, v, sc };
    });
    const have = comps.filter(c=>c.sc!=null), wS = sum(have, c=>c.w);
    const score = wS? Math.round(sum(have, c=>c.w*c.sc)/wS) : null;
    comps.forEach(c=>{ c.contrib = c.sc==null? null : c.w*c.sc/wS; c.lost = c.sc==null? null : c.w*(100-c.sc)/wS; });
    const band = score==null? null : C.healthBands.find(b=> score>=b.min);
    return { score, coverage:wS/100, comps, band };
  };
  M.health = (f)=> M.healthAt(f, M.period(f.period).months);

  M.periodLines = (f)=> cache('pl|'+M.fkey(f), ()=>{ const p = M.period(f.period); return X.lines.filter(l=> M.inPeriod(l.m, p) && recOk(f, l.v, l.e)); });
  M.topVendors = (f)=> cache('tv|'+M.fkey(f), ()=>{
    const by = {}; M.arOpen(f).forEach(l=>{ by[l.v] = (by[l.v]||0) + l.amt; });
    const tot = sum(Object.values(by)), rows = Object.entries(by).map(([v,s])=>({ v, name:(V[v]||{}).name||v, spend:s, share: tot? s/tot*100 : 0 })).sort((a,b)=>b.spend-a.spend);
    rows.forEach((r,i)=> r.rank = i+1);
    return { rows, total:tot, top5: sum(rows.slice(0,5), r=>r.share), top10: sum(rows.slice(0,10), r=>r.share) };
  });
  M.group = (facts, keyFn, opt={})=>{
    const g = {};
    facts.forEach(x=>{ const k = keyFn(x); if(k==null) return; const r = g[k] = g[k] || { key:k, n:0, val:0, ok:0, bad:0, badVal:0, vendors:new Set() };
      r.n++; r.val += x.val||0; if(x.ok===true) r.ok++; if(x.ok===false){ r.bad++; r.badVal += x.val||0; } if(x.v) r.vendors.add(x.v); });
    const rows = Object.values(g).map(r=> Object.assign(r, { rate: r.ok+r.bad? r.ok/(r.ok+r.bad)*100 : null, nv:r.vendors.size, label: opt.label? opt.label(r.key) : r.key }));
    rows.forEach(r=> delete r.vendors);
    return rows.sort(opt.sort || ((a,b)=> (opt.rate? b.bad-a.bad : b.val-a.val)));
  };

  const L_DIMS = { cat:(x)=> (CAT[x.cat]||{}).name || x.cat, bu:(x)=>x.e, region:(x)=>(BU[x.e]||{}).region, vendor:(x)=>x.v, month:(x)=>C.months[x.m], city:(x)=> ((V[x.v]||{}).geo||{}).city };
  M.dimLabel = (dim, k)=> (dim==='vendor'||dim==='customer')? (V[k]? V[k].name : k) : dim==='bu'? k+' '+((BU[k]||{}).name||'') : dim==='component'? (KPI[k]||{}).name : dim==='sub'? k : dim==='stage'? (M.stage(k)||{}).name : dim==='type'? (ETYPE[k]||{}).name || k : dim==='issue'? M.issue(k).name : dim==='seg'? k : k;
  M.dims = {
    revenue:['cat','bu','region','city','vendor','month'], ar:['bucket','vendor','bu','region','city','cat'], overdue:['bucket','status','vendor','bu','region','city','cat'],
    exposure:['type','status','stage','vendor','bu','region','city'], riskmix:['risk','cat','bu'], topc:['vendor'], coll:['seg','vendor','bu'],
    ptp:['status','vendor','bu'], cash:['status','vendor','bu'], credit:['kind','vendor','bu'], billing:['inco','vendor','bu'],
    mdq:['check','vendor','cat'], health:['component'],
    t_oc:['sub','seg','bu','vendor'], t_fd:['sub','seg','bu','vendor'], t_rb:['sub','seg','bu','vendor'], t_ar:['sub','seg','bu','vendor'], t_cc:['sub','seg','bu','vendor'], t_ci:['sub','seg','bu','vendor']
  };
  M.dimName = { cat:'Product line', bu:'Business unit', region:'Region', vendor:'Customer', customer:'Customer', month:'Month', bucket:'Days past due', status:'Status', type:'Type', stage:'Process stage',
    risk:'Customer Risk Category', kind:'Decision type', inco:'Incoterm', check:'Check', component:'Theme', sub:'Subtheme', issue:'Issue', seg:'Segment', city:'City' };
  M.facts = (id, f)=> cache('f|'+id+'|'+M.fkey(f), ()=>{
    if(THEME[id]) return M.themeFacts(id, f, M.period(f.period).months);
    const L = (x, extra)=> Object.assign({ rec:x, kind:'line', v:x.v, val:x.amt, g:{ cat:L_DIMS.cat(x), bu:x.e, region:L_DIMS.region(x), vendor:x.v, month:L_DIMS.month(x), city:L_DIMS.city(x) } }, extra);
    switch(id){
      case 'revenue': return M.periodLines(f).map(l=> L(l));
      case 'ar': return M.arOpen(f).map(l=> L(l, { g:Object.assign(L(l).g, { bucket:M.arBucket(l) }) }));
      case 'overdue': return M.overdue(f).map(l=> L(l, { g:Object.assign(L(l).g, { bucket:M.odBucket(l), status:M.payStatus(l) }) }));
      case 'exposure': return M.cases(f).filter(c=> ETYPE[c.type] && ETYPE[c.type].basis==='fin' && M.statusMeasure(c.stNow)==='potential').map(c=> ({ rec:c, kind:'case', v:c.v, val:c.est||0, g:{ type:c.type, status:M.statusName(c.stNow), stage:ETYPE[c.type].stage, vendor:c.v, bu:c.e, region:(BU[c.e]||{}).region, city:((V[c.v]||{}).geo||{}).city } }));
      case 'riskmix': { const tv = M.topVendors(f), sp = {}; tv.rows.forEach(r=> sp[r.v] = r.spend); return M.vendorsIn(f).map(v=> ({ rec:v, kind:'customer', v:v.id, val:1, spend:sp[v.id]||0, g:{ risk:M.risk(v.id).approved, cat:(CAT[v.cat]||{}).name, bu:v.bu } })); }
      case 'topc': return M.topVendors(f).rows.map(r=> ({ rec:V[r.v], kind:'customer', v:r.v, val:r.spend, share:r.share, rank:r.rank, g:{ vendor:r.v } }));
      case 'coll': return X.lines.filter(l=> l.targeted && recOk(f,l.v,l.e)).map(l=> L(l, { ok:!!(l.collectedSep || (l.paid!=null && l.paid>=MS[5] && l.paid<MS[6])), g:Object.assign(L(l).g, { seg:(V[l.v]||{}).seg, status: l.collectedSep? 'Collected' : 'Still open' }) }));
      case 'ptp': return X.lines.filter(l=> l.ptp!=null && recOk(f,l.v,l.e) && M.inPeriod(M.monthOf(l.ptp), M.period(f.period))).map(l=> L(l, { ok:!!l.ptpKept, g:Object.assign(L(l).g, { status: l.ptpKept? 'Kept' : 'Broken' }) }));
      case 'cash': return (X.receipts||[]).filter(r=> recOk(f,r.v,r.e)).map(r=> ({ rec:r, kind:'line', v:r.v, val:r.amt, ok: r.st==='Suggested' || r.st==='Posted' || (r.conf||0)>=0.8, g:{ status:r.st, vendor:r.v, bu:r.e, cat:(CAT[(V[r.v]||{}).cat]||{}).name } }));
      case 'credit': return (X.credit||[]).filter(d=> recOk(f,d.v,d.e) && M.inPeriod(M.monthOf(d.at), M.period(f.period))).map(d=> ({ rec:d, kind:'line', v:d.v, val:d.req||0, ok:!!d.ok, g:{ kind:d.kind, vendor:d.v, bu:d.e } }));
      case 'billing': { const billed = M.periodLines(f).filter(l=> !l.cn && l.lateBill!=null).map(l=> L(l, { ok:!l.lateBill, g:Object.assign(L(l).g, { inco:l.inco }) }));
        const ub = (X.unbilled||[]).filter(u=> recOk(f,u.v,u.e)).map(u=> ({ rec:u, kind:'open', v:u.v, val:u.val, ok:false, g:{ inco:u.inco, vendor:u.v, bu:u.e, cat:(CAT[u.cat]||{}).name } }));
        return billed.concat(ub); }
      case 'mdq': { const out = []; M.vendorsIn(f).forEach(v=> C.mdChecks.forEach(([k,n])=> out.push({ rec:v, kind:'customer', v:v.id, val:1, ok:(v.md||{})[k]!==false, g:{ check:n, vendor:v.id, cat:(CAT[v.cat]||{}).name } }))); return out; }
    }
    return [];
  });
  M.isRate = (id)=> ['coll','ptp','cash','credit','billing','mdq'].includes(id) || !!THEME[id];

  /* ---------- control-tower themes: subtheme pass/fail checks over the months given ----------
     Flow subthemes use records dated in those months; snapshot subthemes (balances, open orders, cases, master data)
     only exist at the snapshot, so they score when the months include the latest one (Sep) and are N/A before. */
  const THEME = {}, SUB = {}; (C.themes||[]).forEach(t=>{ THEME[t.id] = t; t.subs.forEach(s=> SUB[s.id] = Object.assign({ theme:t.id }, s)); });
  M.THEME = THEME; M.SUB = SUB;
  M.isTheme = (id)=> !!THEME[id];
  const nameOf = (sid)=> SUB[sid].name;
  M.themeFacts = (id, f, months)=> cache('tf|'+id+'|'+months.join()+'|'+M.dimKey(f), ()=>{
    const inM = (m)=> months.indexOf(m) >= 0, now = inM(5), out = [];
    const seg = (v)=> M.segment(v);
    const push = (sid, x)=>{ x.g = Object.assign({ sub:nameOf(sid), seg:seg(x.v), vendor:x.v, bu:x.rec.e || x.rec.bu, region:(BU[x.rec.e || x.rec.bu]||{}).region, check:x.g && x.g.check }, x.g); out.push(x); };
    const Ln = (sid, l, ok, val)=> push(sid, { rec:l, kind:'line', v:l.v, val: val!=null? val : Math.abs(l.amt), ok, g:{ cat:(CAT[l.cat]||{}).name } });
    const Cu = (sid, v, ok, val)=> push(sid, { rec:v, kind:'customer', v:v.id, val:val||0, ok, g:{ check:nameOf(sid), cat:(CAT[v.cat]||{}).name } });
    const lines = X.lines.filter(l=> inM(l.m) && recOk(f, l.v, l.e)), real = lines.filter(l=> !l.cn);
    const ords = (X.orders||[]).filter(o=> recOk(f, o.v, o.e)), custs = M.vendorsIn(f), arL = M.arOpen(f);
    const Or = (sid, o, ok)=> push(sid, { rec:o, kind:'open', v:o.v, val:o.val||o.rem||0, ok, g:{ cat:(CAT[o.cat]||{}).name } });
    switch(id){
      case 't_oc':
        real.forEach(l=> Ln('oc_val', l, l.reason!=='Pricing'));
        if(now) arL.filter(l=> !inM(l.m) && l.reason==='Pricing').forEach(l=> Ln('oc_val', l, false));
        if(now) ords.forEach(o=> Or('oc_val', o, !/pric/i.test(o.reason||'')));
        if(now) custs.forEach(v=>{ const c = M.credit(v.id); if(c.limit) Cu('oc_exp', v, c.util<=100, c.used); });
        (X.credit||[]).filter(d=> recOk(f, d.v, d.e) && inM(M.monthOf(d.at))).forEach(d=> push('oc_pol', { rec:d, kind:'line', v:d.v, val:d.req||0, ok:!!d.ok, g:{ kind:d.kind } }));
        break;
      case 't_fd':
        real.forEach(l=>{ if(l.soD!=null && l.dspD!=null) Ln('fd_ful', l, l.dspD - l.soD <= 7); });
        real.forEach(l=>{ if(/DAP|DDP/.test(l.inco||'') && l.pod!=null && l.dspD!=null) Ln('fd_dlv', l, l.pod - l.dspD <= 5); });
        if(now) ords.forEach(o=> Or('fd_bot', o, !o.crdHold && SNAP - o.soD <= 7));
        break;
      case 't_rb':
        real.forEach(l=>{ if(l.lateBill!=null) Ln('rb_tim', l, !l.lateBill); });
        if(now) (X.unbilled||[]).filter(u=> recOk(f, u.v, u.e) && u.decide==='Recognise').forEach(u=> push('rb_tim', { rec:u, kind:'open', v:u.v, val:u.val, ok:false, g:{ inco:u.inco, cat:(CAT[u.cat]||{}).name } }));
        lines.forEach(l=> Ln('rb_acc', l, !l.cn && l.reason!=='Pricing' && l.reason!=='Shortage'));
        real.forEach(l=> Ln('rb_rev', l, !l.wpi));
        break;
      case 't_ar': {
        if(!now) break;
        arL.forEach(l=> Ln('ar_age', l, SNAP - l.due <= 30));
        const by = {}; arL.forEach(l=>{ const r = by[l.v] = by[l.v] || { ar:0, od:0 }; r.ar += l.amt; if(l.due < SNAP) r.od += l.amt; });
        const tot = sum(Object.values(by), r=> r.ar), rev90 = {};
        X.lines.forEach(l=>{ if(l.m>=3 && l.m<=5) rev90[l.v] = (rev90[l.v]||0) + l.amt; });
        custs.filter(v=> by[v.id]).forEach(v=>{ const r = by[v.id], rk = M.risk(v.id).approved;
          Cu('ar_bad', v, !((rk==='High' || rk==='Critical') && r.od > 0), r.ar);
          const dso = rev90[v.id]? r.ar/(rev90[v.id]/90) : null;
          Cu('ar_wc', v, (tot? r.ar/tot*100 : 0) < 5 && (dso==null || dso <= (v.terms||45) + 30), r.ar); });
        break; }
      case 't_cc':
        if(now) X.lines.filter(l=> l.targeted && !l.cn && recOk(f, l.v, l.e)).forEach(l=> Ln('cc_eff', l, !!(l.collectedSep || (l.paid!=null && l.paid>=MS[5] && l.paid<MS[6]))));
        X.lines.filter(l=> l.ptp!=null && recOk(f, l.v, l.e) && inM(M.monthOf(l.ptp))).forEach(l=> Ln('cc_fup', l, !!l.ptpKept));
        (X.receipts||[]).filter(r=> recOk(f, r.v, r.e) && inM(r.m!=null? r.m : 5)).forEach(r=> push('cc_app', { rec:r, kind:'line', v:r.v, val:r.amt, ok: r.st==='Suggested' || r.st==='Posted', g:{ status:r.st } }));
        break;
      case 't_ci': {
        if(!now) break;
        arL.forEach(l=> Ln('ci_dsp', l, !l.disputed));
        const cs = M.cases(f).filter(c=> M.statusMeasure(c.stNow)==='potential'), ctl = new Set(cs.filter(c=> (ETYPE[c.type]||{}).basis==='ctl').map(c=> c.v));
        custs.forEach(v=> Cu('ci_fin', v, !ctl.has(v.id), (vstat[v.id]||{}).ar||0));
        custs.forEach(v=> C.mdChecks.forEach(([k,n])=> push('ci_dq', { rec:v, kind:'customer', v:v.id, val:0, ok:(v.md||{})[k]!==false, g:{ check:n, cat:(CAT[v.cat]||{}).name } })));
        cs.forEach(c=> push('ci_sla', { rec:c, kind:'case', v:c.v, val:c.est!=null? c.est : (c.affected||0), ok: SNAP - c.opened <= 14, g:{ type:c.type, status:M.statusName(c.stNow) } }));
        break; }
    }
    return out;
  });
  /* theme value = equal-weighted average of the subtheme pass rates that have records */
  M.themeVal = (id, f, months)=>{
    const fs = M.themeFacts(id, f, months), t = THEME[id];
    const subs = t.subs.map(s=>{ const xs = fs.filter(x=> x.g.sub===s.name), ok = xs.filter(x=> x.ok).length;
      return { id:s.id, name:s.name, basis:s.basis, n:xs.length, bad:xs.length-ok, rate: xs.length? ok/xs.length*100 : null, badVal:sum(xs.filter(x=> !x.ok), x=> x.val) }; });
    const have = subs.filter(s=> s.rate!=null);
    return { v: have.length? sum(have, s=> s.rate)/have.length : null, subs, n:fs.length, bad:sum(subs, s=> s.bad), coverage: t.subs.length? have.length/t.subs.length : 0 };
  };

  M.chainScope = (f)=> cache('ch|'+M.fkey(f), ()=>{
    const S = {}; C.stages.forEach(s=> S[s.id] = { id:s.id, vol:0, issues:{}, n:0, val:0, vendors:{} });
    const seen = {}; C.stages.forEach(s=> seen[s.id] = new Set());
    const hit = (code, x, val, kind)=>{ const st = (M.issue(code)||{}).stage || 'inv', s = S[st]; if(!s) return;
      const r = s.issues[code] = s.issues[code] || { code, n:0, val:0, recs:[] }; r.n++; r.val += val; r.recs.push({ x, kind });
      const xid = x.id || x.v; if(!seen[st].has(xid)){ seen[st].add(xid); s.n++; s.val += val; s.vendors[x.v] = (s.vendors[x.v]||0) + val; s.vn = s.vn || {}; s.vn[x.v] = (s.vn[x.v]||0) + 1; } };
    M.periodLines(f).filter(l=>!l.cn).forEach(l=> M.issuesOf(l).forEach(c=> hit(c, l, l.amt, 'line')));
    M.overdue(f).forEach(l=> M.issuesOf(l).forEach(c=> hit(c, l, l.amt, 'line')));
    (X.orders||[]).filter(o=> recOk(f,o.v,o.e)).forEach(o=> M.issuesOfOpen(o).forEach(c=> hit(c, o, o.val, 'open')));
    (X.unbilled||[]).filter(u=> recOk(f,u.v,u.e)).forEach(u=> hit('unbilled', u, u.val, 'open'));
    (X.receipts||[]).filter(r=> recOk(f,r.v,r.e) && r.st!=='Suggested' && r.st!=='Posted').forEach(r=> hit('unapplied', r, r.amt, 'line'));
    const ls = M.periodLines(f).filter(l=>!l.cn);
    S.ord.vol = ls.length + (X.orders||[]).length; S.crd.vol = ls.length + (X.orders||[]).length;
    S.dsp.vol = ls.length + (X.unbilled||[]).length; S.inv.vol = ls.length;
    S.col.vol = M.overdue(f).length; S.csh.vol = (X.receipts||[]).length;
    C.stages.forEach(s=>{ S[s.id].ct = null; S[s.id].ctName = ''; S[s.id].list = Object.values(S[s.id].issues).sort((a,b)=> b.val-a.val); });
    return S;
  });
  M.caseStages = (c)=>{ const out = {}; const prim = (ETYPE[c.type]||{}).stage || 'col'; out[prim] = out[prim] || [];
    (c.lines||[]).forEach(id=>{ const l = LINE[id] || ORD[id] || UB[id]; if(!l) return; (LINE[id]? M.issuesOf(l) : []).forEach(k=>{ const st = M.issue(k).stage; (out[st] = out[st] || []); if(out[st].indexOf(k)<0) out[st].push(k); }); });
    return { primary:prim, stages:out }; };

  M.GEO_METRICS = [
    { id:'ar', name:'Open receivables', short:'Open AR', basis:'Snapshot', add:true },
    { id:'overdue', name:'Overdue receivables', short:'Overdue', basis:'Snapshot', add:true },
    { id:'exposure', name:'Collections exposure', short:'Exposure', basis:'Snapshot', add:true },
    { id:'disputed', name:'Disputed overdue', short:'Disputed', basis:'Snapshot', add:true },
    { id:'revenue', name:'Billed revenue', short:'Billed', basis:'Period', add:true },
    { id:'dso', name:'Days sales outstanding', short:'DSO', basis:'Snapshot', add:false } ];
  M.geoAgg = (f, by)=> cache('geo|'+(by||'city')+'|'+M.fkey(f), ()=>{
    const per = {}, row = (v)=> per[v] = per[v] || { ar:0, overdue:0, exposure:0, disputed:0, revenue:0, rev90:0 };
    M.arOpen(f).forEach(l=> row(l.v).ar += l.amt);
    M.overdue(f).forEach(l=>{ const r = row(l.v); r.overdue += l.amt; if(l.disputed) r.disputed += l.amt; });
    M.facts('exposure', f).forEach(x=> row(x.v).exposure += x.val);
    M.periodLines(f).forEach(l=> row(l.v).revenue += l.amt);
    X.lines.forEach(l=>{ if(l.m>=3 && l.m<=5 && recOk(f, l.v, l.e)) row(l.v).rev90 += l.amt; });
    const key = (v)=>{ const g = (V[v]||{}).geo; return !g? null : by==='region'? g.region : g.region+'|'+g.city; };
    const G = {};
    Object.entries(per).forEach(([v, r])=>{ const k = key(v); if(!k) return; const g = V[v].geo;
      const e = G[k] = G[k] || { key:k, city: by==='region'? null : g.city, region:g.region, lat:g.lat, lng:g.lng, customers:new Set(), ar:0, overdue:0, exposure:0, disputed:0, revenue:0, rev90:0 };
      ['ar','overdue','exposure','disputed','revenue','rev90'].forEach(m=> e[m] += r[m]); e.customers.add(v); });
    M.customersIn(f).forEach(v=>{ const k = key(v.id); if(k && G[k]) G[k].customers.add(v.id); });
    const rows = Object.values(G).map(e=> Object.assign(e, { n:e.customers.size, ids:[...e.customers], dso: e.rev90? Math.round(e.ar/(e.rev90/90)) : null }));
    rows.forEach(e=> delete e.customers);
    const tot = { ar:sum(rows, r=>r.ar), overdue:sum(rows, r=>r.overdue), exposure:sum(rows, r=>r.exposure), disputed:sum(rows, r=>r.disputed), revenue:sum(rows, r=>r.revenue), rev90:sum(rows, r=>r.rev90) };
    tot.dso = tot.rev90? Math.round(tot.ar/(tot.rev90/90)) : null;
    return { rows, tot, per };
  });
  /* Location risk: where cash could stop coming in, and why. Uses the illustrative location seed in master.js.
     Scenario amounts (one hazard, public-sector owner, parent group) overlap and are never added together. */
  M.locRisk = (f)=> cache('loc|'+M.fkey(f), ()=>{
    const per = M.geoAgg(f).per, g = (id, m)=> (per[id]||{})[m]||0, LC = C.loc || { hazards:[], parents:[] };
    const vs = M.customersIn(f).filter(v=> v.geo && v.loc);
    const C2 = {};
    vs.forEach(v=>{ const k = v.geo.region+'|'+v.geo.city;
      const e = C2[k] = C2[k] || { key:k, city:v.geo.city, region:v.geo.region, lat:v.geo.lat, lng:v.geo.lng, state:v.loc.state, hazards:v.loc.hazards, ids:[], ar:0, overdue:0, pubAr:0 };
      e.ids.push(v.id); e.ar += g(v.id,'ar'); e.overdue += g(v.id,'overdue'); if(v.loc.owner!=='Private') e.pubAr += g(v.id,'ar'); });
    const tot = { ar:sum(vs, v=> g(v.id,'ar')), overdue:sum(vs, v=> g(v.id,'overdue')) };
    let cum = 0;
    const cities = Object.values(C2).sort((a,b)=> b.ar-a.ar).map((e,i)=>{ cum += e.ar;
      return Object.assign(e, { n:e.ids.length, rank:i, odPct: e.ar? e.overdue/e.ar*100 : null, share: tot.ar? e.ar/tot.ar*100 : null, cum: tot.ar? cum/tot.ar*100 : null }); });
    const top3 = tot.ar? sum(cities.slice(0,3), e=> e.ar)/tot.ar*100 : null;
    const hhi = tot.ar? Math.round(sum(cities, e=> Math.pow(e.ar/tot.ar*100, 2))) : null;
    const agg = (list)=> ({ ids:list.map(v=> v.id), n:list.length, ar:sum(list, v=> g(v.id,'ar')), overdue:sum(list, v=> g(v.id,'overdue')), cities:new Set(list.map(v=> v.geo.region+'|'+v.geo.city)).size });
    const hazards = LC.hazards.map(h=> Object.assign({ id:h.id, name:h.name }, agg(vs.filter(v=> v.loc.hazards.includes(h.id))))).filter(h=> h.n).sort((a,b)=> b.ar-a.ar);
    const pubL = vs.filter(v=> v.loc.owner!=='Private'), privL = vs.filter(v=> v.loc.owner==='Private');
    const states = {}; pubL.forEach(v=> (states[v.loc.state] = states[v.loc.state] || []).push(v));
    const pub = Object.assign(agg(pubL), { privOd: sum(privL, v=> g(v.id,'overdue')), privAr: sum(privL, v=> g(v.id,'ar')),
      byState: Object.entries(states).map(([st, l])=> Object.assign({ id:st, name:st, central:l.filter(v=> v.loc.owner==='Central government').length }, agg(l))).sort((a,b)=> b.ar-a.ar) });
    const parents = LC.parents.map(p=> Object.assign({ id:p.id, name:p.name }, agg(vs.filter(v=> v.loc.parent===p.id)),
      { keys:[...new Set(vs.filter(v=> v.loc.parent===p.id).map(v=> v.geo.region+'|'+v.geo.city))] })).filter(p=> p.n).sort((a,b)=> b.ar-a.ar);
    return { cities, tot, top3, hhi, hazards, pub, parents, illustrative:!!LC.illustrative };
  });
  /* ---------- credit utilisation: used = open AR + open sales orders, against the approved limit ----------
     Same basis as the risk factor 'Credit utilisation'. Status bands follow the usual credit-control view:
     over limit (>100%), about to exceed (90–100%), within limit, no limit set. Snapshot measure, not period. */
  M.CREDIT_BANDS = [
    { id:'over', name:'Over limit', short:'Over', min:100, tone:'crit' },
    { id:'near', name:'About to exceed', short:'90–100%', min:90, tone:'med' },
    { id:'ok', name:'Within limit', short:'Within', min:-1, tone:'pos' },
    { id:'none', name:'No limit set', short:'No limit', min:null, tone:'n' } ];
  const ordOf = {}; (X.orders||[]).forEach(o=>{ ordOf[o.v] = (ordOf[o.v]||0) + (o.rem||0); });
  const limitEvents = {}; (X.credit||[]).filter(d=> d.kind==='limit').forEach(d=> (limitEvents[d.v] = limitEvents[d.v] || []).push(d));
  M.creditBand = (util)=> util==null? 'none' : util>100? 'over' : util>=90? 'near' : 'ok';
  M.credit = (id)=> cache('cu|'+id, ()=>{
    const v = V[id] || {}, s = vstat[id] || { ar:0 }, ord = (v.openOrd||0) + (ordOf[id]||0), used = s.ar + ord, lim = v.limit || null;
    const util = lim? used/lim*100 : null;
    const changes = (limitEvents[id]||[]).slice().sort((a,b)=> a.at-b.at).map(d=> ({ id:d.id, at:d.at, old:d.cur, req:d.req, rec:d.rec, approved:d.ok, auto:!!d.auto, newL: d.ok? d.rec : d.cur }));
    return { id, limit:lim, req:v.reqLimit||null, ar:s.ar, ord, used, avail: lim!=null? lim-used : null, util, band:M.creditBand(util), changes };
  });
  /* Daily credit history, last 60 days. The invoice ledger can't supply it: its payment dates are set to hit the ageing
     anchors at the snapshot, so exposure read back in time swells far above any limit. Instead each customer's day-by-day
     new orders and payments are walked back from today's used figure with a seeded generator (own stream, so the ledger is
     untouched): today's numbers are exact, earlier days are illustrative. Customers over or near their limit drift up into
     it; the rest wander around today's level. The limit steps at each approved change and ends at today's limit. */
  M.CREDIT_DAYS = 60;
  const seed = (id)=>{ let h = 2166136261; for(const ch of id){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h>>>0; };
  const prng = (a)=> ()=>{ a = (a + 0x6D2B79F5)|0; let t = Math.imul(a ^ a>>>15, 1|a); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14)>>>0)/4294967296; };
  M.creditHist = (id)=> cache('ch|'+id, ()=>{
    const c = M.credit(id), D = M.CREDIT_DAYS, rnd = prng(seed(id)), day0 = Math.floor(SNAP);
    if(!c.limit && !c.used) return null;
    /* limit timeline: walk approved changes back from today's limit */
    const ev = c.changes.filter(x=> x.approved).sort((a,b)=> b.at-a.at), limAt = [];
    for(let k=D; k>=0; k--){ let L = c.limit; for(const x of ev){ if(day0-(D-k) < x.at) L = L ? L*x.old/x.newL : L; } limAt[k] = L; }
    const base = Math.max(c.used, (c.limit||c.used)*0.3), target = c.band==='over'? (c.limit||base)*0.82 : c.band==='near'? (c.limit||base)*0.78 : c.used;
    const used = []; used[D] = c.used; const so = [], pay = [];
    for(let k=D; k>=1; k--){ const t = day0-(D-k), wd = ((t%7)+7)%7, quiet = wd===5 || wd===6;
      const o = quiet? 0 : (rnd()<.7? base*(0.015 + rnd()*0.07) : 0);
      const pull = (target - used[k])*0.06, p = quiet? 0 : Math.max(0, o*(0.6 + rnd()*0.8) + pull + (rnd()-.5)*base*0.02);
      so[k] = o; pay[k] = p; used[k-1] = Math.max(0, used[k] - o + p); }
    const days = []; for(let k=0; k<=D; k++){ const t = day0-(D-k);
      days.push({ t, so:so[k]||0, pay:pay[k]||0, used:used[k], limit:limAt[k], avail: limAt[k]!=null? limAt[k]-used[k] : null, over: limAt[k]!=null && used[k]>limAt[k] }); }
    days[D].used = c.used; days[D].avail = c.avail;
    /* weekly roll-up for the consumption view: opening available, orders taken (−), payments received (+), closing available */
    const weeks = []; for(let k=1; k<=D; k+=7){ const span = days.slice(k, Math.min(k+7, D+1)), open = days[k-1];
      weeks.push({ from:span[0].t, to:span[span.length-1].t, open:open.avail, so:span.reduce((a,d)=> a+d.so, 0), pay:span.reduce((a,d)=> a+d.pay, 0),
        lim:span[span.length-1].limit - open.limit, close:span[span.length-1].avail }); }
    return { id, days, weeks, breachDays:days.filter(d=> d.over).length, illustrative:true };
  });
  /* share of credit exposure (used) sitting with customers over or about to exceed their limit */
  M.creditRisk = (rows)=>{ const lim = rows.filter(r=> r.limit), u = sum(lim, r=> r.used); return u? sum(lim.filter(r=> r.band==='over' || r.band==='near'), r=> r.used)/u*100 : null; };
  M.creditBook = (f)=> cache('cb|'+M.fkey(f), ()=>{
    const rows = M.customersIn(f).map(v=> Object.assign({ v:v.id, name:v.name, seg:M.segment(v.id) }, M.credit(v.id)));
    const over = (r)=> r.limit && r.used>r.limit? r.used-r.limit : 0;
    const bySeg = M.SEGS.map(sg=>{ const rs = rows.filter(r=> r.seg===sg.id), b = {}; M.CREDIT_BANDS.forEach(x=> b[x.id] = rs.filter(r=> r.band===x.id));
      return { seg:sg.id, n:rs.length, bands:b, limit:sum(rs, r=> r.limit||0), used:sum(rs, r=> r.used), over:sum(rs, over) }; }).filter(r=> r.n);
    const ords = (X.orders||[]).filter(o=> recOk(f, o.v, o.e));
    const overIds = new Set(rows.filter(r=> r.band==='over').map(r=> r.v));
    const risky = {
      ordOver: ords.filter(o=> overIds.has(o.v)), held: ords.filter(o=> o.crdHold),
      unbilled: (X.unbilled||[]).filter(u=> recOk(f, u.v, u.e) && u.decide==='Recognise'),
      unpaidOver: M.overdue(f).filter(l=> overIds.has(l.v)) };
    const tot = { limit:sum(rows, r=> r.limit||0), used:sum(rows.filter(r=> r.limit), r=> r.used), over:sum(rows, over) };
    tot.util = tot.limit? tot.used/tot.limit*100 : null;
    const changes = rows.flatMap(r=> r.changes.map(c=> Object.assign({ v:r.v, name:r.name }, c)));
    tot.risk = M.creditRisk(rows);
    const orders = ords.map(o=>{ const r = rows.find(x=> x.v===o.v) || {}; return Object.assign({ name:r.name, seg:r.seg, util:r.util, band:r.band, avail:r.avail }, o); });
    return { rows, bySeg, risky, tot, changes, orders };
  });
  M.SEGS = [
    { id:'Strategic', desc:'Hospital and key care networks' }, { id:'Distributor', desc:'Domestic distributors' },
    { id:'Export', desc:'Export wholesalers' }, { id:'Transactional', desc:'Smaller or occasional accounts' } ];
  M.segment = (id)=> (V[id]||{}).seg === 'Key account'? 'Strategic' : ((V[id]||{}).seg || 'Transactional');
  M.segComp = (kpi, f, seg)=> cache('sg|'+kpi+'|'+(seg||'')+'|'+M.fkey(f), ()=>{
    const fs = M.facts(kpi, f).filter(x=> !seg || M.segment(x.v)===seg), ok = fs.filter(x=> x.ok).length;
    const vAll = new Set(fs.map(x=> x.v)), vBad = new Set(fs.filter(x=> x.ok===false).map(x=> x.v));
    return { n:fs.length, bad:fs.length-ok, rate: fs.length? ok/fs.length*100 : null, vN:vAll.size, vBad:vBad.size, vPct: vAll.size? vBad.size/vAll.size*100 : null }; });
  M.segCount = (f, seg)=> M.vendorsIn(f).filter(v=> !seg || M.segment(v.id)===seg).length;
  M.heat = (f, n=14)=>{ const S = M.chainScope(f), tot = {};
    C.stages.forEach(s=> Object.entries(S[s.id].vendors).forEach(([v,val])=>{ tot[v] = (tot[v]||0) + val; }));
    return Object.entries(tot).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([v,t])=>({ v, name:(V[v]||{}).name||v, total:t, cells:C.stages.map(s=> ({ stage:s.id, val:S[s.id].vendors[v]||0, n:(S[s.id].vn||{})[v]||0 })) })); };

  M.vendor = (id, f)=> cache('vp|'+id+'|'+(f? M.fkey(f) : ''), ()=>{
    const v = V[id], rk = M.risk(id), ls = M.vlines(id), real = ls.filter(l=>!l.cn);
    const byM = C.months.map((m,i)=> sum(ls.filter(l=>l.m===i), l=>l.amt));
    const tv = f? M.topVendors(Object.assign({}, f, { vendor:null })) : null, rank = tv? tv.rows.find(r=>r.v===id) : null;
    const od = real.filter(l=> M.unpaid(l) && l.due<SNAP);
    const unpaid = real.filter(M.unpaid), paid = real.filter(l=> l.paid!=null && l.paid<=SNAP);
    const stCount = {}; unpaid.forEach(l=>{ const s = M.payStatus(l); const r = stCount[s] = stCount[s] || { n:0, val:0 }; r.n++; r.val += l.amt; });
    const issues = {}; real.forEach(l=> M.issuesOf(l).forEach(c=>{ const r = issues[c] = issues[c] || { code:c, n:0, val:0, months:[0,0,0,0,0,0], recs:[] }; r.n++; r.val += l.amt; if(l.m>=0 && l.m<6) r.months[l.m]++; r.recs.push(l.id); }));
    const stages = C.stages.map(s=>{ const its = Object.values(issues).filter(r=> M.issue(r.code).stage===s.id); return { id:s.id, name:s.name, n:sum(its,r=>r.n), val:sum(its,r=>r.val), issues:its.sort((a,b)=>b.val-a.val) }; });
    const cases = X.cases.filter(c=> c.v===id).map(c=> Object.assign({}, c, { stNow:M.caseStatus(c) }));
    const pair = v.dupPair? V[v.dupPair] : null;
    const op = (X.orders||[]).filter(o=>o.v===id);
    return { v, rk, byM, total:sum(byM), rank, catShare:0, op, opVal:sum(op,o=> o.val||o.rem||0), opOver:0, gr:[], grVal:0,
      od, odVal:sum(od,l=>l.amt), unpaid, stCount, paid, otp: paid.length? paid.filter(M.onTime).length/paid.length*100 : null,
      ct:[], ctRate:null, ctBad:[], ctVar:0, grt:null, grN:0, issues:Object.values(issues).sort((a,b)=>b.val-a.val), stages, cases, pair,
      lines: real.slice().sort((a,b)=> (b.invD||0)-(a.invD||0)) };
  });
  M.why = (id, ctx)=>{
    const p = M.vendor(id), out = [], v = p.v;
    if(ctx && ctx.kpi && ctx.f){ const fs = M.facts(ctx.kpi, ctx.f).filter(x=> (ctx.groups||[]).every(g=> x.g[g.dim]===g.key));
      const mine = fs.filter(x=>x.v===id), k = KPI[ctx.kpi];
      if(M.isRate(ctx.kpi)){ const bad = fs.filter(x=>x.ok===false), mb = mine.filter(x=>x.ok===false); if(bad.length) out.push({ t:'ctx', text:`${mb.length} of ${bad.length} non-compliant records in this view (${FCT.pct(mb.length/bad.length*100,0)}), ${FCT.amt(sum(mb,x=>x.val))}`, kpi:k.name }); }
      else if(fs.length){ const tv = sum(fs,x=>x.val), mv = sum(mine,x=>x.val); out.push({ t:'ctx', text:`${FCT.amt(mv)} of ${FCT.amt(tv)} in this view (${FCT.pct(tv? mv/tv*100 : 0,1)})`, kpi:k.name }); } }
    if(v.driver) out.push({ t:'risk', text:v.driver });
    if(v.window) out.push({ t:'risk', text:'Predicted payment: '+v.window });
    const openCases = p.cases.filter(c=> M.statusMeasure(c.stNow)==='potential');
    if(openCases.length) out.push({ t:'case', text:`${openCases.length} open case${openCases.length>1?'s':''}: ${[...new Set(openCases.map(c=> (ETYPE[c.type]||{}).name))].slice(0,3).join('; ')}` });
    if(p.odVal) out.push({ t:'stage', text:`${FCT.amt(p.odVal)} overdue across ${p.od.length} invoices` });
    (v.notes||[]).forEach(n=> out.push({ t:'note', text:n }));
    return out;
  };

  M.chain = (id)=>{
    const l = M.rec(id); if(!l) return null;
    const kind = LINE[id]? 'line' : ORD[id]? 'open' : UB[id]? 'open' : 'other';
    const iss = kind==='line'? M.issuesOf(l) : [];
    const has = (st)=> iss.filter(c=> M.issue(c).stage===st);
    const S = [];
    const step = (st, label, at, detail, state)=> S.push({ stage:st, label, at, detail, state: state || (has(st).length? 'issue' : at==null? 'na' : 'ok'), issues:has(st) });
    if(ORD[id]){ step('ord','Sales order', l.soD, l.id+' · '+FCT.amt(l.val)); step('crd', l.crdHold? 'Held for credit' : 'Credit released', l.soD, l.reason||'', l.crdHold? 'issue' : 'ok'); step('dsp','Dispatch', null, 'Not yet shipped', 'wait'); return { kind, l, steps:S, iss }; }
    if(UB[id]){ step('dsp','Dispatched', l.dspD, l.id+' · '+l.inco+' · '+FCT.amt(l.val)); step('inv','Invoice', null, l.decide==='Exclude'? 'Control not yet passed' : 'Not billed at 30-Sep', 'issue'); return { kind, l, steps:S, iss }; }
    step('ord','Sales order', l.soD, l.so||'');
    step('crd', l.crdOk? 'Credit released' : 'Credit hold', l.soD, l.crdHold? 'Held for credit review' : 'Within limit and terms');
    step('dsp','Dispatched', l.dspD, (l.inco||'')+(l.site? ' · '+l.site : ''));
    step('inv','Invoice raised', l.invD, (l.ref||'')+' · '+FCT.amt(l.amt)+(l.lateBill? ' · billed after POD' : '')+(l.wpi? ' · wrong period' : ''));
    const ps = M.payStatus(l);
    step('col', l.disputed? 'Disputed' : (l.ptp!=null? (l.ptpKept? 'Promise kept' : 'Promise broken') : ps), l.ptp, l.disputed? (l.reason||'Dispute') : (l.ptp!=null? 'Promise '+M.date(l.ptp) : 'Due '+M.date(l.due)));
    step('csh', l.paid!=null && l.paid<=SNAP? 'Cash application' : 'Unpaid', l.paid, l.paid!=null && l.paid<=SNAP? 'Paid '+M.date(l.paid) : 'Open');
    return { kind, l, steps:S, iss };
  };
  M.evidence = (l)=>{
    const ev = [];
    if(l.so) ev.push(['Sales order', l.so, 'ERP SD']);
    if(l.dspD!=null) ev.push(['Dispatch note', l.id || l.ref, 'TMS']);
    if(l.pod!=null) ev.push(['Proof of delivery', M.dt(l.pod), 'TMS POD']);
    if(l.ref) ev.push(['Invoice', l.ref, 'ERP SD / e-invoice']);
    if(l.paid!=null && l.paid<=SNAP) ev.push(['Receipt', M.date(l.paid), 'Bank / ERP FI']);
    if(l.ex) ev.push(['Exception', l.ex, 'FCT drawer']);
    return ev;
  };

  M.nav = {
    init: (kpi, path)=> ({ kpi, path: path && path.length? path : [{ t:'root', label:(KPI[kpi]||{}).name || kpi }], sel:null }),
    reduce: (s, a)=>{
      switch(a.t){
        case 'kpi': case 'kpiJump': return M.nav.init(a.kpi);
        case 'node': { const path = s.path.slice(); path[path.length-1] = Object.assign({}, path[path.length-1], a.v); return Object.assign({}, s, { path, sel:null }); }
        case 'sel': return Object.assign({}, s, { sel: s.sel && a.v && s.sel.key===a.v.key? null : a.v });
        case 'drill': { const path = s.path.slice(); path[path.length-1] = Object.assign({}, path[path.length-1], { sel:s.sel });
          const last = path[path.length-1]; if(last.t===a.node.t && last.id===a.node.id && last.key===a.node.key && last.dim===a.node.dim) return s;
          return Object.assign({}, s, { path:path.concat([a.node]), sel:null }); }
        case 'crumb': { const path = s.path.slice(0, a.i+1); return Object.assign({}, s, { path, sel: path[a.i].sel || null }); }
        case 'back': return s.path.length>1? M.nav.reduce(s, { t:'crumb', i:s.path.length-2 }) : s;
        case 'home': return M.nav.reduce(s, { t:'crumb', i:0 });
        default: return s;
      }
    },
    top: (s)=> s.path[s.path.length-1],
    groups: (s)=> s.path.filter(n=> n.t==='group'),
    vendor: (s, f)=>{ for(let i=s.path.length-1;i>=0;i--){ const n = s.path[i]; if(n.t==='vendor'||n.t==='customer'||n.t==='profile') return n.id; if(n.vendor||n.customer) return n.vendor||n.customer; } return f && (f.vendor||f.customer) || null; },
    encode: (s)=> encodeURIComponent(JSON.stringify({ k:s.kpi, p:s.path.map(n=>{ const o = Object.assign({}, n); delete o.sel; return o; }) })),
    decode: (str)=>{ try{ if(!str) return null; if(/^kpi=/.test(str)) { const k = str.slice(4); return KPI[k] || k==='process' || k==='customers'? M.nav.init(k) : null; } const o = JSON.parse(decodeURIComponent(str)); return o && o.k? M.nav.init(o.k, o.p) : null; } catch(e){ return null; } }
  };
  M.nav.customer = M.nav.vendor;
  M.customersIn = (...a)=> M.vendorsIn(...a);
  M.topCustomers = (...a)=> M.topVendors(...a);
  M.customer = (...a)=> M.vendor(...a);
  M.vari = (l)=> l && l.amt!=null && l.cp? Math.max(0, l.amt - (l.cp*(l.qty||1))/1e7) : 0;
  M.ruleName = (r)=> r || '';
})();
