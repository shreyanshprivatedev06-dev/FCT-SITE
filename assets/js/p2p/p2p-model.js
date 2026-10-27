/* FCT demo — P2P control tower v2: calculation engine (pure; no DOM). Exposes window.P2PM.
   Every tile, chart, table and vendor profile on the P2P screens reads from here, so values reconcile by construction.
   Formulas and denominators: data/p2p/MODEL.md. Tests: node tools/p2p/test-model.js */
(function(){
  const D = window.FCT_DATA, X = D.p2px, C = X.config, FCT = window.FCT || {};
  const SNAP = C.snap, MS = C.mStart;
  const M = window.P2PM = { C, X, SNAP };
  const V = {}; X.vendors.forEach(v=> V[v.id] = v);
  const BU = {}; C.bus.forEach(b=> BU[b.id] = b);
  const CAT = {}; C.cats.forEach(c=> CAT[c.id] = c);
  const KPI = {}; C.kpis.forEach(k=> KPI[k.id] = k);
  const ETYPE = {}; C.exposureTypes.forEach(t=> ETYPE[t.id] = t);
  M.V = V; M.BU = BU; M.CAT = CAT; M.KPI = KPI; M.ETYPE = ETYPE;
  const LINE = {}; X.lines.forEach(l=> LINE[l.id] = l);
  const OPEN = {}; X.open.forEach(o=> OPEN[o.id] = o);
  const GRNI = {}; X.grni.forEach(g=> GRNI[g.id] = g);
  const CASE = {}; X.cases.forEach(c=> CASE[c.id] = c);
  const PRQ = {}; X.prs.forEach(p=> PRQ[p.id] = p);
  M.line = (id)=> LINE[id]; M.openLine = (id)=> OPEN[id]; M.grniLine = (id)=> GRNI[id]; M.case = (id)=> CASE[id];
  M.rec = (id)=> LINE[id] || OPEN[id] || GRNI[id] || CASE[id] || PRQ[id] || X.rejected.find(r=>r.id===id) || null;

  /* ---------- time ---------- */
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

  /* ---------- live state: case status overrides and drawer decisions ---------- */
  M.ver = ()=> (FCT.state? (FCT.state.seq + ':' + JSON.stringify((FCT.state.notes||{}).p2pCase||{})) : '0');
  const exDone = (id)=>{ if(!id || !FCT.ex) return false; const x = FCT.ex(id); return !!x && !FCT.isOpen(x); };
  const onResolve = { dup:'prevented', bank:'prevented', adv:'loss', uom:'nil', price:'disputed', ctl:'nil', sod:'inv', tol:'nil', qty:'disputed' };
  M.caseStatus = (c)=>{
    const ov = FCT.state && FCT.state.notes && FCT.state.notes.p2pCase && FCT.state.notes.p2pCase[c.id];
    if(ov) return ov.st;
    if(c.ex && exDone(c.ex) && onResolve[c.type]) return (c.type==='adv' && c.v==='V-100377')? c.st : onResolve[c.type];
    return c.st;
  };
  M.setCaseStatus = (id, st, note)=>{ const n = FCT.state.notes; n.p2pCase = n.p2pCase || {}; n.p2pCase[id] = { st, note:note||'', t:FCT.nowLabel? FCT.nowLabel() : '' }; FCT.save && FCT.save(); _cache = {}; };
  M.statusMeasure = (st)=> (C.caseStatus.find(s=>s.id===st)||{}).measure;
  M.statusName = (st)=> (C.caseStatus.find(s=>s.id===st)||{}).name || st;
  /* payment status at the snapshot, with drawer decisions applied */
  M.payStatus = (l)=>{
    if(l.cn) return 'Applied';
    if(l.ex==='PTP-BNK-05' && exDone('PTP-BNK-05')) return 'Held';
    if(l.ex==='PTP-DUP-03' && exDone('PTP-DUP-03')) return 'Blocked';
    if(l.ex==='PTP-LPR-09' && exDone('PTP-LPR-09')) return 'In run';
    if(l.pSt==='Scheduled') return l.run===X.runs.next.id? 'In run' : l.due > SNAP? 'Not yet due' : 'Scheduled later';
    return l.pSt;
  };
  M.unpaid = (l)=> !l.cn && (l.paid==null || l.paid > SNAP);
  M.onTime = (l)=> Math.floor(l.paid) <= Math.floor(l.due);

  /* ---------- issues: where in the chain each record breaks ---------- */
  M.issuesOf = (l)=>{
    const out = [];
    if(l.cn) return out;
    if(l.apr==='split') out.push('prSplit');
    if(l.prA!=null && l.prC!=null && l.prA - l.prC > C.slas.prApprovalDays) out.push('prSlow');
    if(l.apr==='after') out.push('aprAfter'); if(l.apr==='level') out.push('aprLevel'); if(l.apr==='none') out.push('aprNone');
    if(l.npo==='noncompliant') out.push('noPo');
    if(l.retro) out.push('retroPo');
    if(l.pv==='notLoaded') out.push('ctNotLoaded');
    if(l.pv==='expired') out.push('ctExpired');
    if(l.poD!=null && l.prA!=null && l.poD - l.prA > C.slas.reqToPoDays && !l.retro) out.push('poSlow');
    if(l.gk==='GR' && l.grPh!=null && ((l.grPs==null? SNAP : l.grPs) - l.grPh) > C.slas.grPostHours/24) out.push(l.grPs==null? 'grMissing' : 'grLate');
    if(l.qv) out.push('qtyVar');
    if(l.x1==='capture') out.push('capture'); if(l.x1==='coding') out.push('coding');
    if(l.pv==='above' || l.pv==='tol') out.push('priceVar');
    if(l.pv==='uom') out.push('uom');
    if(l.dupOf) out.push('dup');
    if(l.x1==='apprSla' || (l.iap && SNAP - l.iap.since > C.slas.invApprovalDays)) out.push('iapSla');
    if(l.pSt==='Blocked') out.push('blocked');
    if(l.paid!=null && l.paid<=SNAP){ if(!M.onTime(l)) out.push('payLate'); else if(l.due - l.paid > C.slas.earlyPayDays) out.push('payEarly'); }
    else if(l.due < SNAP) out.push('payOverdue');
    if(l.msme && ((l.paid!=null && l.paid<=SNAP? l.paid : SNAP) - l.rcv) > C.slas.msmeDays) out.push('msme');
    if(l.ex==='PTP-BNK-05') out.push('bankChg');
    if(l.ex==='CMP-SOD-01') out.push('sod');
    return out;
  };
  M.issuesOfOpen = (o)=>{ const out = []; if(o.apr==='split') out.push('prSplit'); if(o.apr==='after') out.push('aprAfter'); if(o.apr==='level') out.push('aprLevel'); if(o.apr==='none') out.push('aprNone');
    if(o.prA!=null && o.prA - o.prC > C.slas.prApprovalDays) out.push('prSlow');
    if(o.gate) out.push('grMissing'); if(o.st==='Delivery overdue' || (o.edd < SNAP && o.recvPct<1)) out.push('delLate'); if(o.poD < SNAP-180) out.push('stalePo'); return out; };
  M.issuesOfPr = (p)=> p.st==='Awaiting approval'? (p.age > C.slas.prApprovalDays? ['prSlow'] : []) : p.st==='Approved, awaiting PO'? (p.age > C.slas.reqToPoDays? ['poSlow'] : []) : ['prReturned'];
  /* extra codes not raised on invoice lines */
  Object.assign(C.issues, {
    poSlow:{ stage:'po', name:'PO released more than 5 days after approval', kind:'ops' },
    ctExpired:{ stage:'po', name:'Contract expired, no valid price', kind:'ctl' },
    payOverdue:{ stage:'pay', name:'Unpaid past due date', kind:'ops' },
    prReturned:{ stage:'pr', name:'Requisition returned as incomplete', kind:'ops' },
    grniAged:{ stage:'inv', name:'Received, not invoiced for over 90 days', kind:'ops' }
  });
  M.issue = (k)=> C.issues[k] || { stage:'inv', name:k, kind:'ops' };
  M.stage = (id)=> C.stages.find(s=>s.id===id);

  /* ---------- vendor location (illustrative): domestic vendors sit in a city of their buying BU's region, imports in their country's region ---------- */
  const FOREIGN_REGION = { USA:'North America', Germany:'Europe', China:'Asia Pacific' };
  X.vendors.forEach(v=>{ const ctry = v.foreign || v.country, reg = ctry? FOREIGN_REGION[ctry] || 'Asia Pacific' : (BU[v.bu]||{}).region;
    const ps = (window.FCT_DATA.places||{})[reg] || [], h = [...String(v.id)].reduce((a,ch)=> (a*31 + ch.charCodeAt(0)) >>> 0, 0), pl = ps[h % (ps.length||1)];
    v.geo = pl? { city:pl.city, region:reg, lat:pl.lat, lng:pl.lng } : null; });
  M.GEO_REGIONS = C.regions.concat(['Asia Pacific']).filter(r=> X.vendors.some(v=> v.geo && v.geo.region===r));

  /* ---------- filters ---------- */
  /* pRisk (comma list), pGeo and pSeg are the portfolio scope picked on Vendor profiles; they narrow every KPI on the control tower */
  M.defaults = { period:'Sep-26', bu:'All', region:'All', cat:'All', risk:'All', vendor:null, pRisk:'All', pGeo:'All', pSeg:'All' };
  M.fkey = (f)=> [f.period,f.bu,f.region,f.cat,f.risk,f.vendor||'',f.pRisk||'All',f.pGeo||'All',f.pSeg||'All'].join('|');
  M.dimKey = (f)=> [f.bu,f.region,f.cat,f.risk,f.vendor||'',f.pRisk||'All',f.pGeo||'All',f.pSeg||'All'].join('|');
  M.unscope = (f)=> Object.assign({}, f, { pRisk:'All', pGeo:'All', pSeg:'All' });
  M.active = (f)=> Object.keys(M.defaults).filter(k=> k!=='period' && f[k] && f[k]!=='All' && f[k]!==M.defaults[k]);
  const recOk = (f, v, e)=> (!f.vendor || v===f.vendor) && (f.cat==='All' || V[v].cat===f.cat) && (f.risk==='All' || M.risk(v).approved===f.risk)
    && (f.bu==='All' || e===f.bu) && (f.region==='All' || (BU[e]||{}).region===f.region)
    && (!f.pRisk || f.pRisk==='All' || f.pRisk.split(',').includes(M.risk(v).approved))
    && (!f.pGeo || f.pGeo==='All' || (V[v].geo && V[v].geo.region===f.pGeo))
    && (!f.pSeg || f.pSeg==='All' || M.segment(v)===f.pSeg);
  const vendorOk = (f, v)=> recOk(f, v.id, v.bu);
  M.recOk = recOk;

  /* ---------- vendor risk (trailing six months, independent of the period filter) ---------- */
  const vstat = {}; X.vendors.forEach(v=> vstat[v.id] = { n:0, spend:0, ctN:0, ctBad:0, ctl:0, lines:[] });
  const catSpend = {};
  X.lines.forEach(l=>{ const s = vstat[l.v]; if(l.m<0) return; s.lines.push(l); if(l.cn) { s.spend += l.amt; return; } s.n++; s.spend += l.amt; catSpend[l.cat] = (catSpend[l.cat]||0) + l.amt;
    if(l.cp!=null && l.pv!=='uom' && l.pv!=='tol' && !l.npo){ s.ctN++; if(l.pv==='above'||l.pv==='expired') s.ctBad++; }   /* FX tolerance is not a vendor behaviour */
    if(l.apr || l.npo==='noncompliant' || l.retro || l.dupOf) s.ctl++; });
  M.vlines = (id)=> vstat[id]? vstat[id].lines : [];
  const pop = { n:0, ctl:0, ctN:0, ctBad:0 }; Object.values(vstat).forEach(s=>{ pop.n += s.n; pop.ctl += s.ctl; pop.ctN += s.ctN; pop.ctBad += s.ctBad; });
  pop.ctlRate = pop.ctl/pop.n; pop.priceRate = pop.ctBad/pop.ctN; M.pop = pop;
  const riskCache = {};
  M.risk = (id)=>{
    if(riskCache[id]) return riskCache[id];
    const v = V[id], s = vstat[id], dd = v.dd||{}, F = {}, why = {};
    F.fin = v.fin; why.fin = dd.insolvency? dd.insolvency : dd.rating? 'Rating '+dd.rating : v.fin>=50? 'Elevated distress signals on credit bureau' : 'No material distress signals';
    if(v.dormant){ F.del = 60; why.del = 'No supply in 9+ months while an advance is outstanding'; }
    else { F.del = Math.round(clamp((95-v.otif)*6 + Math.max(0,v.rej-1)*12)); why.del = 'OTIF '+v.otif+'%, receipt rejections '+v.rej+'%'; }
    if(s.ctN>=5){ F.price = Math.round(clamp(s.ctBad/s.ctN/pop.priceRate*25)); why.price = s.ctBad+' of '+s.ctN+' contracted lines outside contract price ('+FCT.pct(s.ctBad/s.ctN*100,1)+' against '+FCT.pct(pop.priceRate*100,1)+' for all vendors)'; } else { F.price = null; why.price = 'Fewer than 5 contracted lines: not assessed'; }
    if(s.n>=5){ F.ctl = Math.round(clamp(s.ctl/s.n/pop.ctlRate*30)); why.ctl = s.ctl+' control exceptions in '+s.n+' invoices ('+FCT.pct(s.ctl/s.n*100,1)+' against '+FCT.pct(pop.ctlRate*100,1)+' for all vendors)'; } else { F.ctl = null; why.ctl = 'Fewer than 5 invoices: not assessed'; }
    const fails = C.mdChecks.filter(([k])=> (v.md||{})[k]===false);
    F.md = Math.round(clamp(fails.length/6*200 + (dd.insolvency?50:0) + (dd.gstr?25:0) + (dd.kyc?40:0)));
    why.md = (fails.length? fails.length+' master-data check'+(fails.length>1?'s':'')+' failing ('+fails.map(f=>f[1].toLowerCase()).join(', ')+')' : 'All 6 master-data checks pass') + (dd.gstr? '; '+dd.gstr : '') + (dd.kyc? '; '+dd.kyc : '');
    const share = catSpend[v.cat]? Math.max(0, s.spend)/catSpend[v.cat] : 0;
    F.dep = Math.round(clamp((v.sole? 70 : 0) + Math.min(30, share*150))); why.dep = (v.sole? 'Sole source for '+v.sole+'; ' : '') + FCT.pct(share*100,1)+' of '+CAT[v.cat].name.toLowerCase()+' spend';
    F.pay = v.bank && v.bank.pending? 100 : v.sodCreated? 70 : 0; why.pay = v.bank && v.bank.pending? 'Bank-detail change pending, no call-back' : v.sodCreated? 'Created by a user who also approves payments' : 'No bank changes in 6 months';
    const fs = C.risk.factors.filter(x=> F[x.id]!=null), wS = sum(fs, x=>x.w), avg = sum(fs, x=> x.w*F[x.id])/wS, mx = Math.max(...fs.map(x=>F[x.id]));
    let score = Math.round(.6*mx + .4*avg), esc = null;
    const floor = (min, why)=>{ if(score < min){ score = min; esc = why; } };
    if(dd.insolvency) floor(85, 'Insolvency petition sets a minimum score of 85');
    if(v.bank && v.bank.pending && !v.bank.callback) floor(88, 'Unverified bank-detail change sets a minimum score of 88');
    if(dd.gstr && /cancel/i.test(dd.gstr)) floor(80, 'Cancelled GST registration sets a minimum score of 80');
    if(v.sodCreated) floor(65, 'Vendor created through an SoD conflict sets a minimum score of 65');
    const model = C.risk.cats.find(c=> score>=c.min).id, approved = v.approved || model;
    const coverage = wS/100;
    return riskCache[id] = { score, model, approved, rereview: approved!==model, esc, coverage, share,
      factors: C.risk.factors.map(x=> ({ id:x.id, name:x.name, w:x.w, v:F[x.id], why:why[x.id], src:x.src, contrib: F[x.id]==null? null : x.w*F[x.id]/wS })) };
  };
  M.riskRank = { Critical:4, High:3, Medium:2, Low:1 };

  /* ---------- scope: per-month aggregates (one pass) and record sets ---------- */
  let _cache = {};
  const cache = (k, fn)=>{ const kk = M.ver()+'#'+k; if(!(kk in _cache)){ if(Object.keys(_cache).length>400) _cache = {}; _cache[kk] = fn(); } return _cache[kk]; };
  M.clearCache = ()=>{ _cache = {}; };
  const blank = ()=> ({ spend:0, inv:0, mE:0, mOk:0, mFp:0, mEv:0, mOkV:0, pE:0, pOk:0, pVar:0, pEv:0, gE:0, gOk:0, gNA:0, oE:0, oOk:0, oLateV:0, aE:0, aOk:0, aEv:0 });
  M.vari = (l)=> Math.max(0, l.amt*(1 - (l.pv==='notLoaded'? l.pp : l.cp)/l.ip));
  M.grOk = (l)=> l.grPs!=null && (l.grPs - l.grPh) <= C.slas.grPostHours/24;
  M.agg = (f)=> cache('agg|'+M.dimKey(f), ()=>{
    const A = []; for(let m=0;m<7;m++) A.push(blank());
    X.lines.forEach(l=>{
      if(!recOk(f, l.v, l.e)) return;
      if(l.m<0){ if(!l.cn && l.paid!=null && l.paid<=SNAP){ const pm = M.monthOf(l.paid); if(pm>=0){ A[pm].oE++; if(M.onTime(l)) A[pm].oOk++; else A[pm].oLateV += l.amt; } } return; }
      const a = A[l.m]; a.spend += l.amt; if(l.cn) return; a.inv++;
      if(!l.npo){ a.mE++; a.mEv += l.amt; if(l.mSt==='auto'||l.mSt==='fixed'){ a.mOk++; a.mOkV += l.amt; } if(l.mSt==='auto') a.mFp++; }
      if(l.cp!=null && l.pv!=='uom' && !l.npo){ a.pE++; a.pEv += l.amt; if(!(l.pv==='above'||l.pv==='tol'||l.pv==='expired')) a.pOk++; else a.pVar += l.pv==='expired'? 0 : M.vari(l); }
      if(l.gk==='GR'){ if(l.grPh==null){ if(l.grPs!=null){ const gm = M.monthOf(l.grPs); if(gm>=0) A[gm].gNA++; } }
        else { const gm = M.monthOf(l.grPh); if(gm>=0){ const late = (l.grPs==null? SNAP : l.grPs) - l.grPh > C.slas.grPostHours/24; if(l.grPs!=null || late){ A[gm].gE++; if(!late) A[gm].gOk++; } } } }
      if(l.paid!=null && l.paid<=SNAP){ const pm = M.monthOf(l.paid); if(pm>=0){ A[pm].oE++; if(M.onTime(l)) A[pm].oOk++; else A[pm].oLateV += l.amt; } }
      if(l.poD!=null){ const qm = M.monthOf(l.poD); if(qm>=0){ A[qm].aE++; A[qm].aEv += l.poVal; if(!l.apr) A[qm].aOk++; } }
    });
    X.open.forEach(o=>{ if(!recOk(f, o.v, o.e)) return; const qm = M.monthOf(o.poD); if(qm>=0){ A[qm].aE++; A[qm].aEv += o.poVal; if(!o.apr) A[qm].aOk++; }
      if(o.gate){ const gm = M.monthOf(o.gateT); if(gm>=0 && SNAP - o.gateT > C.slas.grPostHours/24){ A[gm].gE++; } } });
    return A;
  });
  const addA = (A, months)=>{ const t = blank(); months.forEach(m=> Object.keys(t).forEach(k=> t[k] += A[m][k])); return t; };
  M.periodAgg = (f, pid)=> addA(M.agg(f), M.period(pid||f.period).months);

  /* period KPI values from aggregates. null = no eligible records (N/A, never zero) */
  const rateOf = (id, a)=>{
    switch(id){
      case 'spend': return a.inv? a.spend : (a.spend||null);
      case 'match': return a.mE? a.mOk/a.mE*100 : null;
      case 'approval': return a.aE? a.aOk/a.aE*100 : null;
      case 'price': return a.pE? a.pOk/a.pE*100 : null;
      case 'grt': return a.gE? a.gOk/a.gE*100 : null;
      case 'otp': return a.oE? a.oOk/a.oE*100 : null;
    }
  };
  M.series = (id, f)=>{ const A = M.agg(f); return C.months.map((m,i)=> id==='health'? M.healthAt(f, [i]).score : rateOf(id, A[i])); };

  /* ---------- snapshot sets ---------- */
  M.overdue = (f)=> cache('od|'+M.dimKey(f), ()=> X.lines.filter(l=> M.unpaid(l) && l.due < SNAP && recOk(f, l.v, l.e)));
  M.odBucket = (l)=>{ const d = SNAP - l.due; return d<=30? '1–30 days' : d<=60? '31–60 days' : d<=90? '61–90 days' : 'Over 90 days'; };
  M.odBuckets = ['1–30 days','31–60 days','61–90 days','Over 90 days'];
  M.openPo = (f)=> cache('op|'+M.dimKey(f), ()=> X.open.filter(o=> o.rem>0 && recOk(f, o.v, o.e)));
  M.poAge = (o)=>{ const d = SNAP - o.poD; return d<=30? '0–30 days' : d<=90? '31–90 days' : d<=180? '91–180 days' : 'Over 180 days'; };
  M.poAges = ['0–30 days','31–90 days','91–180 days','Over 180 days'];
  M.grniSet = (f)=> cache('gr|'+M.dimKey(f), ()=> X.grni.filter(g=> recOk(f, g.v, g.e)));
  M.prSet = (f)=> cache('pr|'+M.dimKey(f), ()=> X.prs.filter(p=> recOk(f, p.v, p.e)));
  M.caseE = (c)=>{ const l = LINE[c.lines[0]]; return l? l.e : V[c.v].bu; };
  M.cases = (f)=> cache('cs|'+M.dimKey(f), ()=> X.cases.map(c=> Object.assign({}, c, { stNow:M.caseStatus(c), e:M.caseE(c) })).filter(c=> recOk(f, c.v, c.e)));
  M.vendorsIn = (f)=> cache('vi|'+M.dimKey(f), ()=> X.vendors.filter(v=> v.status==='Active' && vendorOk(f, v)));

  /* exposure split: potential (open + under investigation), disputed, confirmed loss — never added together */
  M.exposure = (cs)=>{
    const fin = cs.filter(c=> ETYPE[c.type].basis==='fin'), ctl = cs.filter(c=> ETYPE[c.type].basis==='ctl');
    const by = (m)=> fin.filter(c=> M.statusMeasure(c.stNow)===m);
    const pot = by('potential');
    return { potential:sum(pot, c=>c.est||0), potN:pot.length, disputed:sum(by('disputed'), c=>c.est||0), disN:by('disputed').length, loss:sum(by('loss'), c=>c.est||0), lossN:by('loss').length,
      closed:sum(by('closed'), c=>c.est||0), control:sum(ctl.filter(c=> M.statusMeasure(c.stNow)==='potential'), c=>c.affected||0), controlN:ctl.filter(c=> M.statusMeasure(c.stNow)==='potential').length,
      noEst:pot.filter(c=>c.est==null).length, items:pot };
  };

  /* ---------- KPI values (one entry per sheet row) ---------- */
  M.kpi = (id, f)=> cache('k|'+id+'|'+M.fkey(f), ()=>{
    const p = M.period(f.period), A = M.agg(f), a = addA(A, p.months), pr = p.prior? addA(A, M.period(p.prior).months) : null;
    const out = { id, def:KPI[id], time:KPI[id].time };
    if(['spend','match','approval','price','grt','otp'].includes(id)){
      out.v = rateOf(id, a); out.prior = pr? rateOf(id, pr) : null; out.series = M.series(id, f); out.a = a;
      if(id==='match'){ out.n = a.mE; out.bad = a.mE-a.mOk; out.fp = a.mE? a.mFp/a.mE*100 : null; out.val = a.mEv? a.mOkV/a.mEv*100 : null; }
      if(id==='approval'){ out.n = a.aE; out.bad = a.aE-a.aOk; }
      if(id==='price'){ out.n = a.pE; out.bad = a.pE-a.pOk; out.varCr = a.pVar; out.cov = a.inv? a.pE/a.inv*100 : null; }
      if(id==='grt'){ out.n = a.gE; out.bad = a.gE-a.gOk; out.na = a.gNA; out.cov = (a.gE+a.gNA)? a.gE/(a.gE+a.gNA)*100 : null; }
      if(id==='otp'){ out.n = a.oE; out.bad = a.oE-a.oOk; out.lateCr = a.oLateV; out.od = M.overdue(f).length; }
    }
    if(id==='health'){ const h = M.health(f); out.v = h.score; out.prior = p.prior? M.healthAt(f, M.period(p.prior).months).score : null; out.series = M.series('health', f); out.h = h; }
    if(id==='commit'){ const op = M.openPo(f); out.v = op.length? sum(op, o=>o.rem) : null; out.n = op.length; out.overdue = sum(op.filter(o=>o.edd<SNAP), o=>o.rem); out.grni = sum(M.grniSet(f), g=>g.val); out.stale = sum(op.filter(o=>o.poD<SNAP-180), o=>o.rem); }
    if(id==='overdue'){ const od = M.overdue(f); out.v = sum(od, l=>l.amt); out.n = od.length; out.blocked = sum(od.filter(l=>['Blocked','Disputed','Held'].includes(M.payStatus(l))), l=>l.amt); }
    if(id==='exposure'){ const e = M.exposure(M.cases(f)); out.v = e.potential; out.e = e; out.n = e.potN; }
    if(id==='riskmix'){ const vs = M.vendorsIn(f); out.n = vs.length; out.v = vs.length || null; out.mix = C.risk.cats.map(c=>({ id:c.id, n:vs.filter(v=>M.risk(v.id).approved===c.id).length })); out.rereview = vs.filter(v=>M.risk(v.id).rereview).length; }
    if(id==='topv'){ const t = M.topVendors(f); out.v = t.top5; out.top10 = t.top10; out.lead = t.rows[0]; out.n = t.rows.length; }
    if(id==='mdq'){ const vs = M.vendorsIn(f); const tot = vs.length*6, fail = sum(vs, v=> C.mdChecks.filter(([k])=>(v.md||{})[k]===false).length); out.v = tot? (tot-fail)/tot*100 : null; out.n = vs.length; out.bad = fail; }
    return out;
  });
  M.status = (id, v)=>{ const k = KPI[id]; if(v==null) return 'na'; if(id==='health') return v>=75? 'good' : v>=55? 'watch' : 'off';
    if(k.target==null) return 'neutral'; return v>=k.target? 'good' : v>=k.warn? 'watch' : 'off'; };

  /* health: weighted normalised components; missing components are excluded and lower coverage */
  M.healthAt = (f, months)=>{
    const a = addA(M.agg(f), months), isNow = months.join()===M.period(f.period).months.join();
    const comps = C.health.map(h=>{
      const v = h.kpi==='mdq'? (isNow? M.kpi('mdq', f).v : null) : rateOf(h.kpi, a);
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

  /* ---------- breakdowns ---------- */
  M.periodLines = (f)=> cache('pl|'+M.fkey(f), ()=>{ const p = M.period(f.period); return X.lines.filter(l=> M.inPeriod(l.m, p) && recOk(f, l.v, l.e)); });
  M.topVendors = (f)=> cache('tv|'+M.fkey(f), ()=>{
    const by = {}; M.periodLines(f).forEach(l=>{ by[l.v] = (by[l.v]||0) + l.amt; });
    const tot = sum(Object.values(by)), rows = Object.entries(by).map(([v,s])=>({ v, name:V[v].name, spend:s, share: tot? s/tot*100 : 0 })).sort((a,b)=>b.spend-a.spend);
    rows.forEach((r,i)=> r.rank = i+1);
    return { rows, total:tot, top5: sum(rows.slice(0,5), r=>r.share), top10: sum(rows.slice(0,10), r=>r.share) };
  });
  /* category budget: flat monthly plan per category. Group-level only, so it is not shown under BU, region, risk or vendor filters */
  M.budget = (f)=> cache('bd|'+M.fkey(f), ()=>{
    if(f.vendor || f.bu!=='All' || f.region!=='All' || f.risk!=='All') return null;
    const p = M.period(f.period), last = Math.max(...p.months), ytdM = C.months.map((m,i)=> i).filter(i=> i<=last);
    const act = {}, ytd = {}; X.lines.forEach(l=>{ if(!recOk(f, l.v, l.e)) return; const c = V[l.v].cat; if(M.inPeriod(l.m, p)) act[c] = (act[c]||0) + l.amt; if(l.m>=0 && l.m<=last) ytd[c] = (ytd[c]||0) + l.amt; });
    const rows = C.cats.filter(c=> f.cat==='All' || c.id===f.cat).map(c=>{ const bud = c.bud*p.months.length, a = act[c.id]||0, ya = ytd[c.id]||0, fy = c.bud*12;
      return { key:c.id, name:c.name, act:a, bud, used: bud? a/bud*100 : null, var:a-bud, ytdAct:ya, ytdBud:c.bud*ytdM.length, fy, left:fy-ya }; });
    const t = (k)=> sum(rows, r=> r[k]);
    return { rows, act:t('act'), bud:t('bud'), ytdAct:t('ytdAct'), ytdBud:t('ytdBud'), fy:t('fy'), left:t('left'), monthsLeft:12-ytdM.length,
      over:rows.filter(r=> r.var>0), overVal:sum(rows.filter(r=> r.var>0), r=> r.var) };
  });
  /* generic grouping: rows {key, label, n, val, ok, bad, badVal, rate} */
  M.group = (facts, keyFn, opt={})=>{
    const g = {};
    facts.forEach(x=>{ const k = keyFn(x); if(k==null) return; const r = g[k] = g[k] || { key:k, n:0, val:0, ok:0, bad:0, badVal:0, vendors:new Set() };
      r.n++; r.val += x.val||0; if(x.ok===true) r.ok++; if(x.ok===false){ r.bad++; r.badVal += x.val||0; } if(x.v) r.vendors.add(x.v); });
    const rows = Object.values(g).map(r=> Object.assign(r, { rate: r.ok+r.bad? r.ok/(r.ok+r.bad)*100 : null, nv:r.vendors.size, label: opt.label? opt.label(r.key) : r.key }));
    rows.forEach(r=> delete r.vendors);
    return rows.sort(opt.sort || ((a,b)=> (opt.rate? b.bad-a.bad : b.val-a.val)));
  };

  /* facts per KPI: the records behind each number, with their dimension keys. ok = true/false for rate KPIs */
  const L_DIMS = { cat:(x)=>CAT[x.cat].name, bu:(x)=>x.e, region:(x)=>(BU[x.e]||{}).region, vendor:(x)=>x.v, site:(x)=>x.site, month:(x)=>C.months[x.m] };
  M.dimLabel = (dim, k)=> dim==='vendor'? (V[k]? V[k].name : k) : dim==='bu'? k+' '+((BU[k]||{}).name||'') : dim==='component'? KPI[k].name : dim==='stage'? (M.stage(k)||{}).name : dim==='type'? (ETYPE[k]||{}).name || k : dim==='issue'? M.issue(k).name : k;
  const ruleName = (r)=> (C.doaRules.find(x=>x.id===r)||{}).name || 'Compliant';
  const levelName = (l)=> (C.doa.find(d=>d.lvl===l)||{}).name || '—';
  const reasonName = { grMissing:'Goods receipt missing', price:'Price variance', qty:'Quantity variance', uom:'Unit of measure', retro:'PO after invoice', tax:'Tax or IRN mismatch', dup:'Duplicate suspected' };
  const pvName = { above:'Price above contract', tol:'FX and tolerance', expired:'Contract expired', notLoaded:'Renewal not loaded (compliant)' };
  M.reasonName = reasonName; M.pvName = pvName; M.ruleName = ruleName; M.levelName = levelName;
  const lagBucket = (l)=>{ if(l.grPs==null) return 'Not posted'; const h = (l.grPs-l.grPh)*24; return h<=24? 'Within 24 h' : h<=48? '24–48 h' : h<=120? '2–5 days' : 'Over 5 days'; };
  const lateBucket = (l)=>{ const d = Math.floor(l.paid) - Math.floor(l.due); return d<=0? 'On time' : d<=7? '1–7 days late' : d<=30? '8–30 days late' : 'Over 30 days late'; };
  M.dims = {
    spend:['cat','bu','region','vendor','month'], commit:['age','status','cat','vendor','bu'], overdue:['bucket','status','vendor','bu','cat'],
    exposure:['type','status','stage','vendor','bu'], riskmix:['risk','cat','bu'], topv:['vendor'], match:['reason','status','vendor','site','cat'],
    approval:['rule','threshold','bu','vendor','cat'], price:['type','vendor','cat','bu'], grt:['site','lag','vendor','cat'], otp:['lateness','run','vendor','bu'],
    mdq:['check','vendor','cat'], health:['component']
  };
  M.dimName = { cat:'Spend category', bu:'Business unit', region:'Region', vendor:'Vendor', month:'Month', age:'PO age', status:'Status', bucket:'Days past due', type:'Type', stage:'Process stage',
    risk:'Vendor Risk Category', reason:'Mismatch type', site:'Site', rule:'DoA rule', threshold:'DoA threshold', lag:'Posting lag', lateness:'Payment timing', run:'Payment run', check:'Check', component:'Component', issue:'Issue' };
  M.facts = (id, f)=> cache('f|'+id+'|'+M.fkey(f), ()=>{
    const p = M.period(f.period), inP = (d)=> M.inPeriod(M.monthOf(d), p);
    const L = (x, extra)=> Object.assign({ rec:x, kind:'line', v:x.v, val:x.amt, g:{ cat:L_DIMS.cat(x), bu:x.e, region:L_DIMS.region(x), vendor:x.v, site:x.site, month:L_DIMS.month(x) } }, extra);
    switch(id){
      case 'spend': return M.periodLines(f).map(l=> L(l));
      case 'commit': return M.openPo(f).map(o=> ({ rec:o, kind:'open', v:o.v, val:o.rem, g:{ age:M.poAge(o), status:o.st, cat:CAT[o.cat].name, vendor:o.v, bu:o.e } }));
      case 'overdue': return M.overdue(f).map(l=> L(l, { g:Object.assign(L(l).g, { bucket:M.odBucket(l), status:M.payStatus(l) }) }));
      case 'exposure': return M.cases(f).filter(c=> ETYPE[c.type].basis==='fin' && M.statusMeasure(c.stNow)==='potential').map(c=> ({ rec:c, kind:'case', v:c.v, val:c.est||0, g:{ type:c.type, status:M.statusName(c.stNow), stage:ETYPE[c.type].stage, vendor:c.v, bu:c.e } }));
      case 'riskmix': { const tv = M.topVendors(f), sp = {}; tv.rows.forEach(r=> sp[r.v] = r.spend); return M.vendorsIn(f).map(v=> ({ rec:v, kind:'vendor', v:v.id, val:1, spend:sp[v.id]||0, g:{ risk:M.risk(v.id).approved, cat:CAT[v.cat].name, bu:v.bu } })); }
      case 'topv': return M.topVendors(f).rows.map(r=> ({ rec:V[r.v], kind:'vendor', v:r.v, val:r.spend, share:r.share, rank:r.rank, g:{ vendor:r.v } }));
      case 'match': return M.periodLines(f).filter(l=> !l.cn && !l.npo).map(l=>{ const ok = l.mSt==='auto'||l.mSt==='fixed';
        return L(l, { ok, g:Object.assign(L(l).g, { reason: ok? 'Matched' : reasonName[l.mr]||l.mr, status: l.mSt==='auto'? 'First pass' : l.mSt==='fixed'? 'Matched after correction' : l.mSt==='forced'? 'Forced (tolerance override)' : 'Open, blocked' }) }); });
      case 'approval': { const ls = X.lines.filter(l=> !l.cn && l.poD!=null && inP(l.poD) && recOk(f,l.v,l.e)).map(l=> L(l, { val:l.poVal }));
        const os = X.open.filter(o=> inP(o.poD) && recOk(f,o.v,o.e)).map(o=> ({ rec:o, kind:'open', v:o.v, val:o.poVal, g:{ cat:CAT[o.cat].name, bu:o.e, vendor:o.v } }));
        return ls.concat(os).map(x=> Object.assign(x, { ok:!x.rec.apr, g:Object.assign(x.g, { rule:ruleName(x.rec.apr), threshold:levelName(x.rec.lvlReq) }) })); }
      case 'price': return M.periodLines(f).filter(l=> !l.cn && l.cp!=null && l.pv!=='uom' && !l.npo).map(l=>{ const bad = l.pv==='above'||l.pv==='tol'||l.pv==='expired';
        return L(l, { ok:!bad, variance: bad && l.pv!=='expired'? M.vari(l) : 0, g:Object.assign(L(l).g, { type: bad? pvName[l.pv] : l.pv==='notLoaded'? pvName.notLoaded : 'Within contract' }) }); });
      case 'grt': { const ls = X.lines.filter(l=> l.gk==='GR' && l.grPh!=null && inP(l.grPh) && recOk(f,l.v,l.e)).map(l=>{ const late = (l.grPs==null? SNAP : l.grPs) - l.grPh > C.slas.grPostHours/24; return (l.grPs==null && !late)? null : L(l, { ok:!late, g:Object.assign(L(l).g, { lag:lagBucket(l) }) }); }).filter(Boolean);
        const os = X.open.filter(o=> o.gate && inP(o.gateT) && SNAP-o.gateT > C.slas.grPostHours/24 && recOk(f,o.v,o.e)).map(o=> ({ rec:o, kind:'open', v:o.v, val:o.val, ok:false, g:{ site:o.site, lag:'Not posted', vendor:o.v, cat:CAT[o.cat].name } }));
        return ls.concat(os); }
      case 'otp': return X.lines.filter(l=> !l.cn && l.paid!=null && l.paid<=SNAP && inP(l.paid) && recOk(f,l.v,l.e)).map(l=> L(l, { ok:M.onTime(l), g:Object.assign(L(l).g, { lateness:lateBucket(l), run:l.run }) }));
      case 'mdq': { const out = []; M.vendorsIn(f).forEach(v=> C.mdChecks.forEach(([k,n])=> out.push({ rec:v, kind:'vendor', v:v.id, val:1, ok:(v.md||{})[k]!==false, g:{ check:n, vendor:v.id, cat:CAT[v.cat].name } }))); return out; }
    }
    return [];
  });
  M.isRate = (id)=> ['match','approval','price','grt','otp','mdq'].includes(id);

  /* ---------- P2P process chain ---------- */
  M.chainScope = (f)=> cache('ch|'+M.fkey(f), ()=>{
    const ls = M.periodLines(f).filter(l=>!l.cn);
    const S = {}; C.stages.forEach(s=> S[s.id] = { id:s.id, vol:0, issues:{}, n:0, val:0, vendors:{} });
    /* a record counts once per stage in stage totals (it may raise several issues there); issue rows count each issue */
    const seen = {}; C.stages.forEach(s=> seen[s.id] = new Set());
    const hit = (code, x, val, kind)=>{ const st = M.issue(code).stage, s = S[st]; const r = s.issues[code] = s.issues[code] || { code, n:0, val:0, recs:[] }; r.n++; r.val += val; r.recs.push({ x, kind });
      if(!seen[st].has(x)){ seen[st].add(x); s.n++; s.val += val; s.vendors[x.v] = (s.vendors[x.v]||0) + val; s.vn = s.vn || {}; s.vn[x.v] = (s.vn[x.v]||0) + 1; } };
    /* requisition to invoice: invoices received in the period. Payment: payments made in the period, plus unpaid items at the snapshot */
    ls.forEach(l=>{ M.issuesOf(l).forEach(c=>{ if(M.issue(c).stage!=='pay') hit(c, l, l.amt, 'line'); }); });
    const p = M.period(f.period), paidP = X.lines.filter(l=> !l.cn && l.paid!=null && l.paid<=SNAP && M.inPeriod(M.monthOf(l.paid), p) && recOk(f,l.v,l.e));
    paidP.forEach(l=> M.issuesOf(l).forEach(c=>{ if(M.issue(c).stage==='pay') hit(c, l, l.amt, 'line'); }));
    M.overdue(f).forEach(l=> M.issuesOf(l).forEach(c=>{ if(M.issue(c).stage==='pay') hit(c, l, l.amt, 'line'); }));
    M.openPo(f).forEach(o=> M.issuesOfOpen(o).forEach(c=> hit(c, o, o.rem, 'open')));
    M.prSet(f).forEach(p=> M.issuesOfPr(p).forEach(c=> hit(c, p, p.val, 'pr')));
    M.grniSet(f).filter(g=> SNAP - g.grPs > 90).forEach(g=> hit('grniAged', g, g.val, 'grni'));
    const po = ls.filter(l=> l.poD!=null);
    S.pr.vol = po.length + M.prSet(f).length; S.apr.vol = po.length + M.prSet(f).filter(p=>p.st!=='Returned for correction').length; S.po.vol = po.length;
    S.gr.vol = ls.filter(l=> l.gk).length; S.inv.vol = ls.length; S.pay.vol = paidP.length;
    const ct = {
      pr: median(po.filter(l=>l.prA!=null).map(l=> l.prA-l.prC)), apr: median(po.filter(l=>l.prA!=null && !l.retro).map(l=> l.poD-l.prA)),
      po: median(po.filter(l=> l.grPs!=null && !l.retro).map(l=> l.grPs-l.poD)), gr: median(ls.filter(l=> l.grPh!=null && l.grPs!=null).map(l=> l.grPs-l.grPh)),
      inv: median(ls.map(l=> Math.max(l.mRes||0, l.iap? SNAP : 0, l.rcv+.3) - l.rcv)), pay: median(paidP.map(l=> l.paid-l.rcv))
    };
    const ctName = { pr:'Median requisition approval time', apr:'Median approval to PO release', po:'Median PO to receipt', gr:'Median gate to receipt posting', inv:'Median invoice receipt to ready for payment', pay:'Median invoice receipt to payment' };
    C.stages.forEach(s=>{ S[s.id].ct = ct[s.id]; S[s.id].ctName = ctName[s.id]; S[s.id].list = Object.values(S[s.id].issues).sort((a,b)=> b.val-a.val); });
    return S;
  });
  /* stages a case touches: the stage its type is raised at, plus every stage where its linked records carry an issue */
  M.caseStages = (c)=>{ const out = {}; const prim = ETYPE[c.type].stage; out[prim] = out[prim] || [];
    c.lines.forEach(id=>{ const l = LINE[id] || OPEN[id]; if(!l) return; (LINE[id]? M.issuesOf(l) : M.issuesOfOpen(l)).forEach(k=>{ const st = M.issue(k).stage; (out[st] = out[st] || []); if(out[st].indexOf(k)<0) out[st].push(k); }); });
    return { primary:prim, stages:out }; };
  /* vendor segmentation (Kraljic): impact = vendor is among those carrying the top 60% of six-month spend;
     supply risk = sole source, dependency factor 40+, or financial-distress / delivery factor 60+ */
  M.SEGS = [
    { id:'Strategic', desc:'High spend and hard to replace' }, { id:'Leverage', label:'Savings Opportunity', desc:'High spend, easy to negotiate' },
    { id:'Bottleneck', label:'Supply-Critical', desc:'Low spend, few alternatives' }, { id:'Transactional', desc:'Low spend, easy to replace' } ];
  M.segName = (id)=> (M.SEGS.find(s=> s.id===id)||{}).label || id;
  let _seg = null;
  M.segment = (id)=>{ if(!_seg){ _seg = {}; const vs = X.vendors.filter(v=> v.status==='Active'), sp = vs.map(v=> [v.id, sum(M.vlines(v.id), l=> l.amt)]).sort((a,b)=> b[1]-a[1]), tot = sum(sp, x=> x[1]);
      let acc = 0; const hi = new Set(); sp.forEach(([vid,v])=>{ if(acc < tot*.6) hi.add(vid); acc += v; });
      vs.forEach(v=>{ const f = {}; M.risk(v.id).factors.forEach(x=> f[x.id] = x.v); const risk = !!v.sole || (f.dep||0)>=40 || (f.fin||0)>=60 || (f.del||0)>=60;
        _seg[v.id] = hi.has(v.id)? (risk? 'Strategic' : 'Leverage') : (risk? 'Bottleneck' : 'Transactional'); }); }
    return _seg[id] || null; };
  /* one health component for one segment: record rate and how many of the segment's vendors have at least one exception */
  M.segComp = (kpi, f, seg)=> cache('sg|'+kpi+'|'+(seg||'')+'|'+M.fkey(f), ()=>{
    const fs = M.facts(kpi, f).filter(x=> !seg || M.segment(x.v)===seg), ok = fs.filter(x=> x.ok).length;
    const vAll = new Set(fs.map(x=> x.v)), vBad = new Set(fs.filter(x=> x.ok===false).map(x=> x.v));
    return { n:fs.length, bad:fs.length-ok, rate: fs.length? ok/fs.length*100 : null, vN:vAll.size, vBad:vBad.size, vPct: vAll.size? vBad.size/vAll.size*100 : null }; });
  M.segCount = (f, seg)=> M.vendorsIn(f).filter(v=> !seg || M.segment(v.id)===seg).length;
  /* vendor × stage matrix: issue value per vendor and stage */
  M.heat = (f, n=14)=>{ const S = M.chainScope(f), tot = {};
    C.stages.forEach(s=> Object.entries(S[s.id].vendors).forEach(([v,val])=>{ tot[v] = (tot[v]||0) + val; }));
    return Object.entries(tot).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([v,t])=>({ v, name:V[v].name, total:t, cells:C.stages.map(s=> ({ stage:s.id, val:S[s.id].vendors[v]||0, n:(S[s.id].vn||{})[v]||0 })) })); };

  /* ---------- vendor profile ---------- */
  M.vendor = (id, f)=> cache('vp|'+id+'|'+(f? M.fkey(f) : ''), ()=>{
    const v = V[id], rk = M.risk(id), ls = M.vlines(id), real = ls.filter(l=>!l.cn);
    const byM = C.months.map((m,i)=> sum(ls.filter(l=>l.m===i), l=>l.amt));
    const tv = f? M.topVendors(Object.assign({}, f, { vendor:null })) : null, rank = tv? tv.rows.find(r=>r.v===id) : null;
    const op = X.open.filter(o=>o.v===id && o.rem>0), gr = X.grni.filter(g=>g.v===id), od = real.filter(l=> M.unpaid(l) && l.due<SNAP);
    const unpaid = real.filter(M.unpaid), paid = real.filter(l=> l.paid!=null && l.paid<=SNAP);
    const stCount = {}; unpaid.forEach(l=>{ const s = M.payStatus(l); const r = stCount[s] = stCount[s] || { n:0, val:0 }; r.n++; r.val += l.amt; });
    const ct = real.filter(l=> l.cp!=null && l.pv!=='uom' && !l.npo), ctBad = ct.filter(l=> l.pv==='above'||l.pv==='tol'||l.pv==='expired');
    const grs = real.filter(l=> l.gk==='GR' && l.grPh!=null && (l.grPs!=null || SNAP-l.grPh>2));
    const issues = {}; real.forEach(l=> M.issuesOf(l).forEach(c=>{ const r = issues[c] = issues[c] || { code:c, n:0, val:0, months:[0,0,0,0,0,0], recs:[] }; r.n++; r.val += l.amt; if(l.m>=0 && l.m<6) r.months[l.m]++; r.recs.push(l.id); }));
    op.forEach(o=> M.issuesOfOpen(o).forEach(c=>{ const r = issues[c] = issues[c] || { code:c, n:0, val:0, months:[0,0,0,0,0,0], recs:[] }; r.n++; r.val += o.rem; r.recs.push(o.id); }));
    const stages = C.stages.map(s=>{ const its = Object.values(issues).filter(r=> M.issue(r.code).stage===s.id); return { id:s.id, name:s.name, n:sum(its,r=>r.n), val:sum(its,r=>r.val), issues:its.sort((a,b)=>b.val-a.val) }; });
    const cases = X.cases.filter(c=> c.v===id).map(c=> Object.assign({}, c, { stNow:M.caseStatus(c) }));
    const pair = v.dupPair? V[v.dupPair] : null;
    return { v, rk, byM, total:sum(byM), rank, catShare:rk.share, op, opVal:sum(op,o=>o.rem), opOver:sum(op.filter(o=>o.edd<SNAP),o=>o.rem), gr, grVal:sum(gr,g=>g.val),
      od, odVal:sum(od,l=>l.amt), unpaid, stCount, paid, otp: paid.length? paid.filter(M.onTime).length/paid.length*100 : null,
      ct, ctRate: ct.length? (ct.length-ctBad.length)/ct.length*100 : null, ctBad, ctVar:sum(ctBad.filter(l=>l.pv!=='expired'), M.vari),
      grt: grs.length? grs.filter(M.grOk).length/grs.length*100 : null, grN:grs.length, issues:Object.values(issues).sort((a,b)=>b.val-a.val), stages, cases, pair,
      lines: real.slice().sort((a,b)=> b.rcv-a.rcv) };
  });
  /* why a vendor surfaced in the current analysis: standing reasons + the path the user came by */
  M.why = (id, ctx)=>{
    const p = M.vendor(id), out = [];
    if(ctx && ctx.kpi && ctx.f){ const fs = M.facts(ctx.kpi, ctx.f).filter(x=> (ctx.groups||[]).every(g=> x.g[g.dim]===g.key));
      const mine = fs.filter(x=>x.v===id), k = KPI[ctx.kpi];
      if(M.isRate(ctx.kpi)){ const bad = fs.filter(x=>x.ok===false), mb = mine.filter(x=>x.ok===false); if(bad.length) out.push({ t:'ctx', text:`${mb.length} of ${bad.length} non-compliant records in this view (${FCT.pct(mb.length/bad.length*100,0)}), ${FCT.amt(sum(mb,x=>x.val))}`, kpi:k.name }); }
      else if(fs.length){ const tv = sum(fs,x=>x.val), mv = sum(mine,x=>x.val); out.push({ t:'ctx', text:`${FCT.amt(mv)} of ${FCT.amt(tv)} in this view (${FCT.pct(tv? mv/tv*100 : 0,1)})`, kpi:k.name }); } }
    if(p.rk.esc) out.push({ t:'risk', text:p.rk.esc });
    if(p.rk.rereview) out.push({ t:'risk', text:`Model score ${p.rk.score} (${p.rk.model}) differs from approved category ${p.rk.approved}: re-review proposed` });
    const openCases = p.cases.filter(c=> M.statusMeasure(c.stNow)==='potential');
    if(openCases.length) out.push({ t:'case', text:`${openCases.length} open case${openCases.length>1?'s':''}: ${[...new Set(openCases.map(c=>ETYPE[c.type].name))].slice(0,3).join('; ')}` });
    const worst = p.stages.slice().sort((a,b)=>b.val-a.val)[0]; if(worst && worst.n) out.push({ t:'stage', text:`Most issues arise at the ${worst.name} stage: ${worst.n} records, ${FCT.amt(worst.val)}` });
    if(p.v.sole) out.push({ t:'dep', text:'Sole source for '+p.v.sole });
    (p.v.notes||[]).forEach(n=> out.push({ t:'note', text:n }));
    return out;
  };

  /* ---------- document chain (one PO line from requisition to payment) ---------- */
  M.chain = (id)=>{
    const l = M.rec(id); if(!l) return null;
    const kind = LINE[id]? 'line' : OPEN[id]? 'open' : GRNI[id]? 'grni' : PRQ[id]? 'pr' : 'other';
    const iss = kind==='line'? M.issuesOf(l) : kind==='open'? M.issuesOfOpen(l) : kind==='pr'? M.issuesOfPr(l) : [];
    const has = (st)=> iss.filter(c=> M.issue(c).stage===st);
    const S = [];
    const step = (st, label, at, detail, state)=> S.push({ stage:st, label, at, detail, state: state || (has(st).length? 'issue' : at==null? 'na' : 'ok'), issues:has(st) });
    if(kind==='pr'){ step('pr','Requisition raised', l.created, l.id+' · '+FCT.amt(l.val)+(l.st==='Returned for correction'? ' · returned as incomplete' : ''));
      step('apr', l.approved!=null? 'Approved' : 'Awaiting approval', l.approved, 'Requires '+levelName(l.lvlReq)+(l.approved==null? ' · waiting '+M.dur(SNAP-l.created) : ''), l.approved!=null? undefined : 'wait');
      step('po','Purchase order', null, l.approved!=null? 'Not yet released · '+M.dur(SNAP-l.approved)+' since approval' : 'Not released: a requisition is not a commitment', 'wait'); return { kind, l, steps:S, iss }; }
    if(kind==='grni'){ step('gr','Goods receipt posted', l.grPs, l.gr+' · '+FCT.amt(l.val)); step('inv','Invoice', null, 'Not received: liability accrued as GRNI', 'wait'); return { kind, l, steps:S, iss }; }
    if(l.npo){ step('pr','Requisition', null, l.npo==='exempt'? 'PO-exempt category' : 'None raised', l.npo==='exempt'? 'na' : 'issue'); step('apr','PR approval', null, '—', l.npo==='exempt'? 'na' : 'issue'); step('po','Purchase order', null, l.npo==='exempt'? 'Not required for '+CAT[l.cat].name.toLowerCase() : 'No PO: '+CAT[l.cat].name.toLowerCase()+' requires one', l.npo==='exempt'? 'na' : 'issue'); step('gr','Receipt', null, 'No receipt without a PO', 'na'); }
    else {
      step('pr','Requisition raised', l.prC, (l.pr||'')+(l.prC!=null? '' : ''));
      step('apr','Requisition approved', l.prA, l.prA==null? 'No approval record' : levelName(l.lvlAppr)+(l.lvlAppr!==l.lvlReq? ' (required '+levelName(l.lvlReq)+')' : '')+(l.apr==='after'? ' · after PO release' : '')+' · '+M.dur(l.prA-l.prC));
      step('po','PO released', l.poD, l.po? l.po+'-'+(l.poLn||10)+' · '+FCT.amt(l.poVal)+(l.pp? ' · ₹'+FCT.n(l.pp)+' per '+(l.uom||'unit') : '') : 'Not yet raised (invoice arrived first)');
      if(kind==='open'){ step('gr', l.gate? 'At gate '+l.gate : 'Expected delivery', l.gate? l.gateT : l.edd, l.st+' · '+FCT.amt(l.rem)+' open', l.gate? 'issue' : l.edd<SNAP? 'issue' : 'wait'); return { kind, l, steps:S, iss }; }
      step('gr', l.gk==='SES'? 'Service confirmed' : 'Goods received', l.gk==='SES'? l.grPs : (l.grPh!=null? l.grPh : l.grPs), l.gk==='SES'? (l.gr||'Service entry sheet') : (l.gate? 'Gate '+l.gate+' · ' : l.grPh!=null? 'Gate entry · ' : C.noGateFeed.includes(l.site)? 'No gate feed at this site · ' : 'No gate entry yet · ')+(l.grPs!=null? (l.gr||'GR')+' posted '+M.dt(l.grPs)+(l.grPh!=null? ' ('+M.dur(l.grPs-l.grPh)+' after gate)' : '') : 'Receipt not posted'));
    }
    step('inv', 'Invoice received', l.rcv, l.ref+' · '+FCT.amt(l.amt)+' · '+(l.mSt==='auto'? 'matched first pass' : l.mSt==='fixed'? 'matched after '+(reasonName[l.mr]||'').toLowerCase()+' corrected' : l.mSt==='forced'? 'forced match ('+(reasonName[l.mr]||'').toLowerCase()+')' : l.mSt==='open'? 'blocked: '+(reasonName[l.mr]||'').toLowerCase() : 'non-PO')+(l.iap? ' · awaiting '+l.iap.who : ''));
    const ps = M.payStatus(l);
    step('pay', l.paid!=null && l.paid<=SNAP? 'Paid' : ps, l.paid!=null && l.paid<=SNAP? l.paid : null, 'Due '+M.date(l.due)+(l.paid!=null && l.paid<=SNAP? ' · '+l.run+(M.onTime(l)? ' · on time' : ' · '+(Math.floor(l.paid)-Math.floor(l.due))+' days late') : l.paid!=null? ' · '+l.run+' ('+M.dt(l.paid)+')' : ''), l.paid!=null && l.paid<=SNAP? undefined : (has('pay').length || ps==='Blocked' || ps==='Held' || ps==='Disputed')? 'issue' : 'wait');
    return { kind, l, steps:S, iss };
  };
  /* evidence references a record carries (documents the user can request; links are simulated) */
  M.evidence = (l)=>{
    const ev = [];
    if(l.pr) ev.push(['Requisition', l.pr, 'ERP MM']);
    if(l.prA!=null) ev.push(['Approval record', (l.pr||'')+' · '+levelName(l.lvlAppr), 'Workflow log']);
    if(l.po) ev.push(['Purchase order', l.po+'-'+(l.poLn||10), 'ERP MM']);
    if(l.ct) ev.push(['Contract', l.ct, 'Contract repository']);
    if(l.gate) ev.push(['Gate pass', l.gate, 'Gate entry system']);
    if(l.gr) ev.push([l.gk==='SES'? 'Service entry sheet' : 'Goods receipt', l.gr, 'ERP MM']);
    if(l.ref) ev.push(['Invoice image', l.ref+(l.irn? ' · IRN '+l.irn : ''), 'Invoice capture']);
    if(l.run && l.paid!=null && l.paid<=SNAP) ev.push(['Payment advice', l.run, 'Bank / ERP FI']);
    return ev;
  };

  /* ---------- navigation state (pure; shared by all three screens) ----------
     state {kpi, path:[node], sel}. node {t:'root'|'group'|'vendor'|'profile'|'doc'|'case', label, ...}.
     Drilling saves the current selection on the current node and appends; a crumb restores that node and its selection. */
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
    vendor: (s, f)=>{ for(let i=s.path.length-1;i>=0;i--){ const n = s.path[i]; if(n.t==='vendor'||n.t==='profile') return n.id; if(n.vendor) return n.vendor; } return f && f.vendor || null; },
    encode: (s)=> encodeURIComponent(JSON.stringify({ k:s.kpi, p:s.path.map(n=>{ const o = Object.assign({}, n); delete o.sel; return o; }) })),
    decode: (str, def)=>{ try{ if(!str) return null; if(/^kpi=/.test(str)) { const k = str.slice(4); return KPI[k] || k==='process'? M.nav.init(k) : null; } const o = JSON.parse(decodeURIComponent(str)); return o && o.k? M.nav.init(o.k, o.p) : null; } catch(e){ return null; } }
  };
})();
