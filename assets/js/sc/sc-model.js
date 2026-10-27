/* FCT demo — Supply chain control tower: calculation engine (pure; no DOM). Exposes window.SCM.
   Every tile, chart, table and material profile on the SC screens reads from here, so values reconcile by construction.
   The main entity is a material at a plant. Internal keys keep the shared "vendor" names (filter key, fact dimension)
   so the UI stays close to P2P/O2C; visible copy always says material. */
(function(){
  const D = window.FCT_DATA, X = D.sc3, C = X.config, FCT = window.FCT || {};
  const SNAP = C.snap, MS = C.mStart;
  X.vendors = X.materials;
  const M = window.SCM = { C, X, SNAP };
  const V = {}; X.materials.forEach(v=> V[v.id] = v);
  const BU = {}; C.bus.forEach(b=> BU[b.id] = b);
  const PL = {}; C.plants.forEach(p=> PL[p.id] = p);
  const CAT = {}; C.cats.forEach(c=> CAT[c.id] = c);
  const KPI = {}; C.kpis.forEach(k=> KPI[k.id] = k);
  const ETYPE = {}; C.exposureTypes.forEach(t=> ETYPE[t.id] = t);
  const SUP = {}; X.suppliers.forEach(s=> SUP[s.id] = s);
  M.V = V; M.BU = BU; M.PL = PL; M.CAT = CAT; M.KPI = KPI; M.ETYPE = ETYPE; M.SUP = SUP;
  const REC = {}; X.lines.forEach(l=> REC[l.id] = l);
  const CASE = {}; X.cases.forEach(c=> CASE[c.id] = c);
  M.line = (id)=> REC[id]; M.case = (id)=> CASE[id]; M.openLine = ()=> null; M.grniLine = ()=> null;
  M.rec = (id)=> REC[id] || CASE[id] || null;
  M.supName = (id)=> id? (SUP[id]||{}).name || id : 'Made in-house';
  M.plantName = (id)=> (PL[id]||{}).name || id;
  M.matLabel = (id)=>{ const v = V[id]; return v? v.mat+' · '+v.name : id; };

  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const toDate = (d)=> new Date(Date.UTC(2026,3,1) + Math.floor(d)*864e5);
  M.date = (d)=>{ if(d==null) return '—'; const x = toDate(d); return String(x.getUTCDate()).padStart(2,'0')+'-'+MON[x.getUTCMonth()]+'-'+String(x.getUTCFullYear()).slice(2); };
  M.dt = (d)=>{ if(d==null) return '—'; const x = toDate(d), mins = Math.round((d-Math.floor(d))*1440); return String(x.getUTCDate()).padStart(2,'0')+'-'+MON[x.getUTCMonth()]+' '+String(Math.floor(mins/60)%24).padStart(2,'0')+':'+String(mins%60).padStart(2,'0'); };
  M.monthOf = (d)=>{ if(d==null) return null; for(let m=0;m<6;m++) if(d>=MS[m] && d<MS[m+1]) return m; return d>=MS[6]? 6 : -1; };
  M.period = (id)=> C.periods.find(p=>p.id===id) || C.periods[0];
  M.inPeriod = (m, p)=> p.months.indexOf(m) >= 0;
  M.dur = (days)=> days==null? '—' : days < 2? FCT.n(days*24,0)+' h' : FCT.n(days,1)+' days';
  const clamp = (x,a=0,b=100)=> Math.max(a, Math.min(b, x));
  const sum = (a, f)=> a.reduce((s,x)=> s + (f? f(x) : x), 0);
  M.sum = sum; M.median = (a)=>{ if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y), k = s.length>>1; return s.length%2? s[k] : (s[k-1]+s[k])/2; };

  /* ---------- case status follows the shared drawer ---------- */
  M.ver = ()=> (FCT.state? (FCT.state.seq + ':' + JSON.stringify((FCT.state.notes||{}).scCase||{})) : '0');
  const exDone = (id)=>{ if(!id || !FCT.ex) return false; const x = FCT.ex(id); return !!x && !FCT.isOpen(x); };
  M.exDone = exDone;
  M.caseStatus = (c)=>{
    const ov = FCT.state && FCT.state.notes && FCT.state.notes.scCase && FCT.state.notes.scCase[c.id];
    if(ov) return ov.st;
    if(c.ex && exDone(c.ex)) return 'prevented';
    return c.st;
  };
  M.setCaseStatus = (id, st, note)=>{ const n = FCT.state.notes; n.scCase = n.scCase || {}; n.scCase[id] = { st, note:note||'', t:FCT.nowLabel? FCT.nowLabel() : '' }; FCT.save && FCT.save(); _cache = {}; };
  M.statusMeasure = (st)=> (C.caseStatus.find(s=>s.id===st)||{}).measure;
  M.statusName = (st)=> (C.caseStatus.find(s=>s.id===st)||{}).name || st;
  /* receipts become booked when their decision is taken (goods in transit, gate receipts) */
  M.booked = (r)=> r.kind==='git'? exDone('SC-GIT-06') : r.kind==='gate'? exDone('SC-GRL-10') : true;

  M.issuesOf = (l)=> (l && l.issues) ? l.issues.slice() : [];
  M.issue = (k)=> C.issues[k] || { stage:'pln', name:k, kind:'ops' };
  M.stage = (id)=> C.stages.find(s=>s.id===id);
  M.ageName = (i)=> C.ages[i].name;

  /* ---------- classes: ABC by stock value, XYZ by consumption variability ---------- */
  const stockAll = {}; X.lots.forEach(l=> stockAll[l.v] = (stockAll[l.v]||0) + l.val);
  const ABC = {}; (()=>{ const rows = X.materials.map(v=> [v.id, stockAll[v.id]||0]).sort((a,b)=> b[1]-a[1]), tot = sum(rows, r=>r[1]); let cum = 0;
    rows.forEach(([id, s])=>{ const before = cum/tot*100; cum += s; ABC[id] = before < C.abc[0].cut? 'A' : before < C.abc[1].cut? 'B' : 'C'; }); })();
  const XYZ = {}, COV = {}; X.materials.forEach(v=>{ const c = v.cons||[], mu = sum(c)/(c.length||1), sd = Math.sqrt(sum(c, x=> (x-mu)*(x-mu))/(c.length||1));
    COV[v.id] = mu? sd/mu : 0; XYZ[v.id] = C.xyz.find(z=> COV[v.id] < z.max).id; });
  M.abc = (id)=> ABC[id]; M.xyz = (id)=> XYZ[id]; M.cov = (id)=> COV[id];
  /* plain-language class names: 'A' → 'High value', 'X' → 'Steady demand'; clsName('AX') → 'High value · Steady demand' */
  const CLS = {}; C.abc.concat(C.xyz).forEach(c=> CLS[c.id] = c.name);
  M.clsPart = (k)=> CLS[k] || k;
  M.clsName = (k)=> k? M.clsPart(k[0])+' · '+M.clsPart(k[1]) : '';
  M.cls = (id)=> M.clsName(ABC[id]+XYZ[id]);

  /* plant locations come from the entity site master (data/core.js); job-workers sit in a West India city picked from the material id */
  const ENT = {}; (D.entities||[]).forEach(e=> ENT[e.id] = e);
  const PLOC = {}; C.plants.forEach(p=>{ const e = ENT[p.e]||{}, st = e.site;
    if(p.id==='JW'){ PLOC[p.id] = null; return; }
    PLOC[p.id] = st? { city:st.city, region:e.region, lat:st.lat, lng:st.lng } : null; });
  const jwPlaces = ((D.places||{})['West India']||[]);
  X.materials.forEach(v=>{ if(v.plant!=='JW'){ v.geo = PLOC[v.plant] || null; return; }
    const h = [...String(v.id)].reduce((a,ch)=> (a*31 + ch.charCodeAt(0)) >>> 0, 0), p = jwPlaces[h % (jwPlaces.length||1)];
    v.geo = p? { city:p.city, region:'West India', lat:p.lat, lng:p.lng } : null; });
  M.region = (e)=> (ENT[e]||{}).region || null;
  M.GEO_REGIONS = ['North India','West India','South India','North America','Europe'].filter(r=> X.materials.some(v=> v.geo && v.geo.region===r));
  /* value class (ABC) is the tower segment on the map: High, Medium and Low value */
  M.MAP_SEGS = C.abc.map(c=> ({ id:c.id, label:c.name, desc:c.desc }));

  /* pRisk (comma list), pGeo and pSeg (ABC class) are the portfolio scope picked on Material profiles; they narrow every KPI on the control tower */
  M.defaults = { period:'Sep-26', bu:'All', plant:'All', cat:'All', risk:'All', vendor:null, pRisk:'All', pGeo:'All', pSeg:'All' };
  M.fkey = (f)=> [f.period,f.bu,f.plant,f.cat,f.risk,f.vendor||'',f.pRisk||'All',f.pGeo||'All',f.pSeg||'All'].join('|');
  M.dimKey = (f)=> [f.bu,f.plant,f.cat,f.risk,f.vendor||'',f.pRisk||'All',f.pGeo||'All',f.pSeg||'All'].join('|');
  M.unscope = (f)=> Object.assign({}, f, { pRisk:'All', pGeo:'All', pSeg:'All' });
  M.active = (f)=> Object.keys(M.defaults).filter(k=> k!=='period' && f[k] && f[k]!=='All' && f[k]!==M.defaults[k]);
  /* cat: the record's own inventory category where it has one (a lot in transit), else the material's */
  const recOk = (f, v, cat)=>{ const m = V[v]; if(!m) return false;
    return (!f.vendor || v===f.vendor) && (f.bu==='All' || m.e===f.bu) && (f.plant==='All' || m.plant===f.plant)
      && (f.cat==='All' || (cat||m.cat)===f.cat) && (f.risk==='All' || M.risk(v).approved===f.risk)
      && (!f.pRisk || f.pRisk==='All' || f.pRisk.split(',').includes(M.risk(v).approved))
      && (!f.pGeo || f.pGeo==='All' || (m.geo && m.geo.region===f.pGeo))
      && (!f.pSeg || f.pSeg==='All' || ABC[v]===f.pSeg); };
  M.recOk = recOk;
  M.vlines = (id)=> X.lines.filter(l=> l.v===id);

  /* ---------- inventory risk of a material-plant ---------- */
  const riskCache = {};
  M.risk = (id)=>{
    if(riskCache[id]) return riskCache[id];
    const v = V[id]; if(!v) return { score:0, model:'Low', approved:'Low', rereview:false, factors:[], coverage:1 };
    const F = {}, why = {}, s = stockAll[id]||0, lots = X.lots.filter(l=> l.v===id);
    F.cov = v.cover>v.maxD? Math.round(clamp((v.cover-v.maxD)/v.maxD*140)) : v.cover<v.minD? Math.round(clamp(30 + (v.minD-v.cover)/v.minD*220)) : 10;
    why.cov = v.cover+' days of cover against a policy of '+v.minD+'–'+v.maxD+' days';
    const aged = sum(lots.filter(l=> l.age>=2), l=>l.val), near = lots.filter(l=> l.exp!=null && l.exp<=180);
    F.age = Math.round(clamp((s? aged/s*160 : 0) + near.length*35)); why.age = (s? FCT.pct(aged/s*100,0) : '0%')+' of stock over 180 days'+(near.length? '; '+near.length+' lot expiring within 180 days' : '');
    const sp = SUP[v.sup];
    F.sup = !sp? 15 : Math.round(clamp((v.sole? 45 : 0) + (100-sp.otif)*1.6 + (sp.score>=70? 25 : 0))); why.sup = !sp? 'Made in-house' : sp.name+(v.sole? ' (sole source)' : '')+' · OTIF '+sp.otif+'%';
    const badC = X.counts.filter(c=> c.v===id && !c.ok).length; F.cnt = Math.round(clamp(badC*28)); why.cnt = badC? badC+' counts outside tolerance in six months' : 'No count variances';
    const unrev = lots.filter(l=> l.inScope && !l.reviewed).length; F.val = Math.round(clamp((unrev? 55 : 8) + (v.nrv? 25 : 0) + ((v.md||{}).std===false? 30 : 0)));
    why.val = (unrev? unrev+' lot'+(unrev>1?'s':'')+' awaiting a provision or NRV review' : 'Valuation reviews current')+((v.md||{}).std===false? '; standard cost out of date' : '');
    const fcs = X.fc.filter(r=> r.v===id);
    if(fcs.length){ const A = sum(fcs, r=>r.act), Fc = sum(fcs, r=>r.fc), b = A? (Fc-A)/A*100 : 0; F.fc = Math.round(clamp(Math.abs(b)*4)); why.fc = 'Six-month bias '+(b>0?'+':'')+FCT.n(b,1)+'%'; }
    else { F.fc = null; why.fc = 'No forecast for this material'; }
    const fs = C.risk.factors.filter(x=> F[x.id]!=null), wS = sum(fs, x=>x.w), avg = wS? sum(fs, x=> x.w*F[x.id])/wS : 0, mx = fs.length? Math.max(...fs.map(x=>F[x.id])) : 0;
    const score = Math.round(.6*mx + .4*avg);
    const model = C.risk.cats.find(c=> score>=c.min).id, approved = v.risk || model;
    return riskCache[id] = { score, model, approved, rereview: approved!==model, coverage:wS/100,
      factors: C.risk.factors.map(x=> ({ id:x.id, name:x.name, w:x.w, v:F[x.id], why:why[x.id], src:x.src })) };
  };
  M.riskRank = { Critical:4, High:3, Medium:2, Low:1 };

  let _cache = {};
  const cache = (k, fn)=>{ const kk = M.ver()+'#'+k; if(!(kk in _cache)){ if(Object.keys(_cache).length>400) _cache = {}; _cache[kk] = fn(); } return _cache[kk]; };
  M.clearCache = ()=>{ _cache = {}; };

  /* ---------- monthly aggregates for the period KPIs ---------- */
  const blank = ()=> ({ act:0, fc:0, err:0, fcN:0, cE:0, cOk:0, rE:0, rOk:0, oE:0, oOk:0 });
  M.agg = (f)=> cache('agg|'+M.dimKey(f), ()=>{
    const A = []; for(let m=0;m<6;m++) A.push(blank());
    X.fc.forEach(r=>{ if(!recOk(f, r.v)) return; const a = A[r.m]; a.act += r.act; a.fc += r.fc; a.err += r.val; a.fcN++; });
    X.counts.forEach(c=>{ if(!recOk(f, c.v)) return; const a = A[c.m]; a.cE++; if(c.ok) a.cOk++; });
    X.gr.forEach(g=>{ if(!recOk(f, g.v)) return; const a = A[g.m]; a.rE++; if(g.ok) a.rOk++; });
    X.gate.forEach(g=>{ if(!recOk(f, g.v)) return; A[g.m].rE++; });
    X.po.forEach(l=>{ if(!recOk(f, l.v)) return; const a = A[l.m]; a.oE++; if(l.ok) a.oOk++; });
    return A;
  });
  const addA = (A, months)=>{ const t = blank(); months.forEach(m=> Object.keys(t).forEach(k=> t[k] += A[m][k])); return t; };
  M.periodAgg = (f, pid)=> addA(M.agg(f), M.period(pid||f.period).months);
  const rateOf = (id, a)=>{
    switch(id){
      case 'fcAcc': return a.act? Math.max(0, (1 - a.err/a.act)*100) : null;
      case 'bias': return a.act? (a.fc - a.act)/a.act*100 : null;
      case 'ira': return a.cE? a.cOk/a.cE*100 : null;
      case 'rcpt': return a.rE? a.rOk/a.rE*100 : null;
      case 'otif': return a.oE? a.oOk/a.oE*100 : null;
    }
    return null;
  };
  M.rateOf = rateOf;
  M.series = (id, f)=>{ const A = M.agg(f); return C.months.map((m,i)=>{
    if(id==='health'){ const x = M.healthAt(f, [i]); return x.coverage>=M.health(f).coverage? x.score : null; }
    if(THEME[id]){ const x = M.themeVal(id, f, [i]); return x.coverage>=M.themeVal(id, f, M.period(f.period).months).coverage? x.v : null; }
    return rateOf(id, A[i]); }); };

  /* ---------- snapshot sets ---------- */
  M.lotsIn = (f)=> cache('lots|'+M.dimKey(f), ()=> X.lots.filter(l=> recOk(f, l.v, l.cat)));
  M.bookedRcpt = (f)=> cache('br|'+M.dimKey(f), ()=> X.git.filter(g=> g.decide==='Recognise').concat(X.gate).filter(r=> M.booked(r) && recOk(f, r.v, r.kind==='git'? 'git' : null)));
  M.rnbSet = (f)=> cache('rnb|'+M.dimKey(f), ()=> X.git.filter(g=> g.decide==='Recognise').concat(X.gate).filter(r=> !M.booked(r) && recOk(f, r.v)));
  M.caseE = (c)=> (V[c.v]||{}).e;
  M.cases = (f)=> cache('cs|'+M.dimKey(f), ()=> X.cases.map(c=> Object.assign({}, c, { stNow:M.caseStatus(c), e:M.caseE(c), plant:(V[c.v]||{}).plant })).filter(c=> recOk(f, c.v)));
  M.vendorsIn = (f)=> cache('vi|'+M.dimKey(f), ()=> X.materials.filter(v=> v.status==='Active' && recOk(f, v.id)));
  M.stock = (id)=> stockAll[id]||0;

  M.exposure = (cs)=>{
    const fin = cs.filter(c=> ETYPE[c.type] && ETYPE[c.type].basis==='fin'), ctl = cs.filter(c=> ETYPE[c.type] && ETYPE[c.type].basis==='ctl');
    const by = (m)=> fin.filter(c=> M.statusMeasure(c.stNow)===m);
    const pot = by('potential');
    return { potential:sum(pot, c=> c.est||0), potN:pot.filter(c=> c.est!=null).length, contingent:sum(cs.filter(c=> M.statusMeasure(c.stNow)==='potential'), c=> c.contingent||0),
      disputed:sum(by('disputed'), c=> c.est||0), disN:by('disputed').length, loss:sum(by('loss'), c=> c.est||0), lossN:by('loss').length,
      control:sum(ctl.filter(c=> M.statusMeasure(c.stNow)==='potential'), c=> c.affected||0), controlN:ctl.filter(c=> M.statusMeasure(c.stNow)==='potential').length };
  };

  M.prov = ()=> FCT.v? FCT.v('sc.prov', C.invAnchor.prov) : C.invAnchor.prov;
  M.dio = ()=> FCT.v? FCT.v('sc.dio', C.dio[5]) : C.dio[5];
  M.kpi = (id, f)=> cache('k|'+id+'|'+M.fkey(f), ()=>{
    const p = M.period(f.period), A = M.agg(f), a = addA(A, p.months), pr = p.prior? addA(A, M.period(p.prior).months) : null;
    const out = { id, def:KPI[id], time:KPI[id].time };
    if(['fcAcc','ira','rcpt','otif'].includes(id)){
      out.v = rateOf(id, a); out.prior = pr? rateOf(id, pr) : null; out.series = M.series(id, f); out.a = a;
      const fs = M.facts(id, f); out.n = fs.length; out.bad = fs.filter(x=> x.ok===false).length;
      if(id==='fcAcc'){ out.bias = rateOf('bias', a); out.biasPrior = pr? rateOf('bias', pr) : null; out.biasSeries = M.series('bias', f); }
    }
    if(THEME[id]){ const t = M.themeVal(id, f, p.months), pt = p.prior? M.themeVal(id, f, M.period(p.prior).months) : null;
      out.v = t.v; out.subs = t.subs; out.n = t.n; out.bad = t.bad; out.coverage = t.coverage; out.prior = pt && pt.coverage>=t.coverage? pt.v : null; out.series = M.series(id, f); }
    if(id==='health'){ const h = M.health(f), ph = p.prior? M.healthAt(f, M.period(p.prior).months) : null;
      /* snapshot themes have no history, so a past score covers fewer themes: compare only like for like */
      out.v = h.score; out.prior = ph && ph.coverage>=h.coverage? ph.score : null; out.series = M.series('health', f); out.h = h; }
    if(id==='inv'){ const fs = M.facts('inv', f); out.v = fs.length? sum(fs, x=>x.val) : null; out.n = fs.length; out.prov = M.prov(); out.net = out.v==null? null : out.v - (f.vendor||M.active(f).length? 0 : out.prov);
      out.dio = M.dio(); out.turns = out.dio? 365/out.dio : null; out.aged = sum(fs.filter(x=> x.rec.age>=2), x=>x.val); out.over365 = sum(fs.filter(x=> x.rec.age===3), x=>x.val);
      out.booked = sum(fs.filter(x=> x.kind!=='lot'), x=>x.val); out.dioSeries = C.dio.slice(); }
    if(id==='excess'){ const fs = M.facts('excess', f); out.v = fs.length? sum(fs, x=>x.val) : (M.vendorsIn(f).length? 0 : null); out.n = fs.length;
      out.strategic = sum(fs.filter(x=> x.g.reason==='Approved strategic buy'), x=>x.val); out.over365 = sum(M.lotsIn(f).filter(l=> l.age===3), l=>l.val);
      const sl = M.cases(f).find(c=> c.type==='slow'); out.slowWatch = sl && M.statusMeasure(sl.stNow)==='potential'? sl.contingent : 0;
      out.below = M.vendorsIn(f).filter(v=> v.cover<v.minD).length; }
    if(id==='rnb'){ const fs = M.facts('rnb', f); out.v = sum(fs, x=>x.val); out.n = fs.length;
      out.git = sum(fs.filter(x=>x.kind==='git'), x=>x.val); out.gitN = fs.filter(x=>x.kind==='git').length;
      out.gate = sum(fs.filter(x=>x.kind==='gate'), x=>x.val); out.gateN = fs.filter(x=>x.kind==='gate').length;
      out.blocked = sum(fs.filter(x=> x.rec.inv==='Invoice posted, blocked'), x=>x.val); out.noInv = sum(fs.filter(x=> x.rec.inv==='No invoice'), x=>x.val);
      out.excluded = sum(X.git.filter(g=> g.decide==='Exclude' && recOk(f, g.v)), g=>g.val); }
    if(id==='exposure'){ const e = M.exposure(M.cases(f)); out.v = e.potential; out.e = e; out.n = e.potN; }
    if(id==='riskmix'){ const vs = M.vendorsIn(f); out.n = vs.length; out.v = vs.length || null; out.mix = C.risk.cats.map(c=>({ id:c.id, n:vs.filter(v=>M.risk(v.id).approved===c.id).length })); out.rereview = vs.filter(v=>M.risk(v.id).rereview).length; }
    if(id==='topm'){ const t = M.topVendors(f); out.v = t.top10; out.top5 = t.top5; out.top10 = t.top10; out.lead = t.rows[0]; out.n = t.rows.length; }
    if(id==='valc'){ const fs = M.facts('valc', f); out.v = fs.length? fs.filter(x=>x.ok).length/fs.length*100 : null; out.n = fs.length; out.bad = fs.filter(x=> !x.ok).length; out.badVal = sum(fs.filter(x=>!x.ok), x=>x.val); out.prior = null; out.series = C.months.map((m,i)=> i===5? out.v : null); }
    if(id==='mdq'){ const vs = M.vendorsIn(f); const tot = vs.length*C.mdChecks.length, fail = sum(vs, v=> C.mdChecks.filter(([k])=>(v.md||{})[k]===false).length); out.v = tot? (tot-fail)/tot*100 : null; out.n = vs.length; out.bad = fail; out.prior = null; out.series = C.months.map((m,i)=> i===5? out.v : null); }
    return out;
  });
  M.status = (id, v)=>{ const k = KPI[id]; if(v==null) return 'na'; if(id==='health') return v>=75? 'good' : v>=50? 'watch' : 'off';
    if(!k || k.target==null) return 'neutral'; return v>=k.target? 'good' : v>=k.warn? 'watch' : 'off'; };

  /* valuation review and master data have no history before this snapshot: earlier months score four components */
  M.healthAt = (f, months)=>{
    const a = addA(M.agg(f), months), isNow = months.join()===M.period(f.period).months.join() || months.join()==='5';
    const comps = C.health.map(h=>{
      const v = THEME[h.kpi]? M.themeVal(h.kpi, f, months).v : (h.kpi==='mdq' || h.kpi==='valc')? (isNow? M.kpi(h.kpi, f).v : null) : rateOf(h.kpi, a);
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

  M.topVendors = (f)=> cache('tv|'+M.fkey(f), ()=>{
    const by = {}; M.facts('inv', f).forEach(x=>{ by[x.v] = (by[x.v]||0) + x.val; });
    const tot = sum(Object.values(by)), rows = Object.entries(by).map(([v,s])=>({ v, name:M.matLabel(v), spend:s, share: tot? s/tot*100 : 0 })).sort((a,b)=>b.spend-a.spend);
    rows.forEach((r,i)=> r.rank = i+1);
    return { rows, total:tot, top5: sum(rows.slice(0,5), r=>r.share), top10: sum(rows.slice(0,10), r=>r.share) };
  });
  /* fcAcc groups carry actual demand, so the group rate is 1 − WMAPE rather than a record count */
  M.group = (facts, keyFn, opt={})=>{
    const g = {};
    facts.forEach(x=>{ const k = keyFn(x); if(k==null) return; const r = g[k] = g[k] || { key:k, n:0, val:0, ok:0, bad:0, badVal:0, act:0, vendors:new Set() };
      r.n++; r.val += x.val||0; if(x.act!=null) r.act += x.act; if(x.ok===true) r.ok++; if(x.ok===false){ r.bad++; r.badVal += x.val||0; } if(x.v) r.vendors.add(x.v); });
    const rows = Object.values(g).map(r=> Object.assign(r, { rate: r.act? Math.max(0, (1 - r.val/r.act)*100) : r.ok+r.bad? r.ok/(r.ok+r.bad)*100 : null, nv:r.vendors.size, label: opt.label? opt.label(r.key) : r.key }));
    rows.forEach(r=> delete r.vendors);
    return rows.sort(opt.sort || ((a,b)=> (opt.rate? b.bad-a.bad : b.val-a.val)));
  };

  M.dimLabel = (dim, k)=> (dim==='vendor'||dim==='material')? M.matLabel(k) : dim==='bu'? k+' '+((BU[k]||{}).name||'') : dim==='component'? (KPI[k]||{}).name : dim==='sub'? k : dim==='stage'? (M.stage(k)||{}).name : dim==='type'? (ETYPE[k]||{}).name || k : dim==='issue'? M.issue(k).name : dim==='abc'? M.clsPart(k)+' ('+k+')' : k;
  M.dims = {
    inv:['cat','age','plant','abc','vendor','sup'], excess:['plant','reason','cat','abc','vendor'], rnb:['type','plant','sup','inv','vendor'],
    exposure:['type','status','stage','vendor','plant'], riskmix:['risk','abc','plant'], topm:['vendor'],
    fcAcc:['fam','dir','plant','vendor','month'], ira:['plant','cat','vendor','month'], rcpt:['plant','sup','vendor','month'], otif:['sup','miss','plant','vendor','month'],
    valc:['reason','plant','vendor'], mdq:['check','vendor','plant'], health:['component'],
    t_dp:['sub','plant','abc','vendor'], t_pr:['sub','sup','plant','vendor'], t_sp:['sub','sup','plant','vendor'], t_iv:['sub','plant','cat','abc','vendor'], t_lg:['sub','plant','vendor'], t_ct:['sub','plant','vendor']
  };
  M.dimName = { cat:'Category', age:'Ageing', plant:'Plant', bu:'Entity', abc:'Value class', vendor:'Material', material:'Material', sup:'Supplier', month:'Month', reason:'Reason',
    type:'Type', status:'Status', stage:'Process stage', risk:'Inventory Risk Category', fam:'Product family', dir:'Forecast error', miss:'Delivery', inv:'Invoice status',
    check:'Check', component:'Theme', sub:'Subtheme', issue:'Issue', seg:'Segment' };
  const famName = {}; ((D.scx && D.scx.demand && D.scx.demand.families)||[]).forEach(fm=> famName[fm.id] = fm.name);
  const G = (v, extra)=> Object.assign({ plant:M.plantName(V[v].plant), bu:V[v].e, cat:CAT[V[v].cat].name, vendor:v, abc:ABC[v], sup:M.supName(V[v].sup) }, extra||{});
  M.facts = (id, f)=> cache('f|'+id+'|'+M.fkey(f), ()=>{
    const p = M.period(f.period), inP = (m)=> M.inPeriod(m, p);
    if(THEME[id]) return M.themeFacts(id, f, p.months);
    switch(id){
      case 'inv': return M.lotsIn(f).map(l=> ({ rec:l, kind:'lot', v:l.v, val:l.val, g:G(l.v, { cat:CAT[l.cat].name, age:M.ageName(l.age) }) }))
        .concat(M.bookedRcpt(f).map(r=> ({ rec:r, kind:r.kind, v:r.v, val:r.val, g:G(r.v, { cat: r.kind==='git'? CAT.git.name : CAT[V[r.v].cat].name, age:M.ageName(0) }) })));
      case 'excess': return M.vendorsIn(f).filter(v=> v.excess>0).map(v=> ({ rec:v, kind:'material', v:v.id, val:v.excess, g:G(v.id, { reason: v.id==='KSM-04@IN-02A'? 'Approved strategic buy' : 'Above policy maximum' }) }));
      case 'rnb': return M.rnbSet(f).map(r=> ({ rec:r, kind:r.kind, v:r.v, val:r.val, g:G(r.v, { type: r.kind==='git'? 'In transit, title passed' : 'At the gate, no GR', inv: r.inv || 'Invoice not yet due', sup:M.supName(r.sup) }) }));
      case 'exposure': return M.cases(f).filter(c=> ETYPE[c.type] && ETYPE[c.type].basis==='fin' && M.statusMeasure(c.stNow)==='potential' && c.est!=null).map(c=> ({ rec:c, kind:'case', v:c.v, val:c.est||0, g:{ type:c.type, status:M.statusName(c.stNow), stage:ETYPE[c.type].stage, vendor:c.v, plant:M.plantName(V[c.v].plant) } }));
      case 'riskmix': return M.vendorsIn(f).map(v=> ({ rec:v, kind:'material', v:v.id, val:1, spend:stockAll[v.id]||0, g:G(v.id, { risk:M.risk(v.id).approved }) }));
      case 'topm': return M.topVendors(f).rows.map(r=> ({ rec:V[r.v], kind:'material', v:r.v, val:r.spend, share:r.share, rank:r.rank, g:{ vendor:r.v } }));
      case 'fcAcc': return X.fc.filter(r=> inP(r.m) && recOk(f, r.v)).map(r=> ({ rec:r, kind:'fc', v:r.v, val:r.val, act:r.act, ok:r.ok, g:G(r.v, { fam:famName[r.fam]||r.fam, month:C.months[r.m], dir: r.ok? 'Within 20%' : r.bias>0? 'Over-forecast' : 'Under-forecast' }) }));
      case 'ira': return X.counts.filter(c=> inP(c.m) && recOk(f, c.v)).map(c=> ({ rec:c, kind:'count', v:c.v, val:c.val, ok:c.ok, g:G(c.v, { month:C.months[c.m] }) }));
      case 'rcpt': return X.gr.concat(X.gate).filter(r=> inP(r.m) && recOk(f, r.v)).map(r=> ({ rec:r, kind:r.kind, v:r.v, val:r.val, ok:r.ok, g:G(r.v, { sup:M.supName(r.sup), month:C.months[r.m] }) }));
      case 'otif': return X.po.filter(l=> inP(l.m) && recOk(f, l.v)).map(l=> ({ rec:l, kind:'po', v:l.v, val:l.val, ok:l.ok, g:G(l.v, { sup:M.supName(l.sup), month:C.months[l.m], miss: l.ok? 'On time, in full' : l.short? 'Short' : 'Late' }) }));
      case 'valc': return M.lotsIn(f).filter(l=> l.inScope).map(l=> ({ rec:l, kind:'lot', v:l.v, val:l.val, ok:l.reviewed, g:G(l.v, { reason:l.reason }) }));
      case 'mdq': { const out = []; M.vendorsIn(f).forEach(v=> C.mdChecks.forEach(([k,n])=> out.push({ rec:v, kind:'material', v:v.id, val:1, ok:(v.md||{})[k]!==false, g:G(v.id, { check:n }) }))); return out; }
    }
    return [];
  });
  M.isRate = (id)=> ['fcAcc','ira','rcpt','otif','valc','mdq'].includes(id) || !!THEME[id];

  /* ---------- control-tower themes: subtheme pass/fail checks over the months given ----------
     Period subthemes use records dated in those months; snapshot subthemes (stock, cover, cases, master data, receipts
     at the gate) only exist at the book date, so they score when the months include Sep and are N/A before. */
  const THEME = {}, SUBT = {}; (C.themes||[]).forEach(t=>{ THEME[t.id] = t; t.subs.forEach(x=> SUBT[x.id] = Object.assign({ theme:t.id }, x)); });
  M.THEME = THEME; M.SUBT = SUBT; M.isTheme = (id)=> !!THEME[id];
  const PROC_CASES = ['price','nopo','advance','coa'];
  M.themeFacts = (id, f, months)=> cache('tf|'+id+'|'+months.join()+'|'+M.dimKey(f), ()=>{
    const inM = (m)=> months.indexOf(m) >= 0, now = inM(5), out = [];
    const put = (sid, rec, kind, ok, val, extra)=> out.push({ rec, kind, v:rec.v || rec.id, val:val!=null? val : (rec.val||0), ok:!!ok,
      g:G(rec.v || rec.id, Object.assign({ sub:SUBT[sid].name, check:SUBT[sid].name }, extra||{})) });
    const mats = M.vendorsIn(f), bought = mats.filter(v=> v.sup && SUP[v.sup]);
    const recs = (arr)=> arr.filter(r=> inM(r.m) && recOk(f, r.v));
    const open = M.cases(f).filter(c=> M.statusMeasure(c.stNow)==='potential');
    switch(id){
      case 't_dp':
        recs(X.fc).forEach(r=> put('dp_fc', r, 'fc', r.ok, r.val, { month:C.months[r.m] }));
        if(now) mats.forEach(v=> put('dp_cov', v, 'material', v.cover >= v.minD, stockAll[v.id]||0));
        if(now) mats.forEach(v=> put('dp_par', v, 'material', (v.md||{}).rop!==false && (v.md||{}).ss!==false, stockAll[v.id]||0));
        break;
      case 't_pr': {
        recs(X.po).forEach(l=> put('pr_price', l, 'po', !l.price, l.val, { sup:M.supName(l.sup) }));
        const pc = new Set(open.filter(c=> PROC_CASES.includes(c.type)).map(c=> c.v));
        if(now) bought.forEach(v=> put('pr_ctl', v, 'material', !pc.has(v.id), stockAll[v.id]||0));
        break; }
      case 't_sp':
        recs(X.po).forEach(l=> put('sp_otif', l, 'po', l.ok, l.val, { sup:M.supName(l.sup) }));
        if(now) bought.forEach(v=> put('sp_dep', v, 'material', !(v.sole && SUP[v.sup].otif < 90), stockAll[v.id]||0));
        if(now) bought.forEach(v=> put('sp_risk', v, 'material', SUP[v.sup].score < 70 && !SUP[v.sup].distress, stockAll[v.id]||0));
        break;
      case 't_iv':
        if(now) mats.forEach(v=> put('iv_exc', v, 'material', !(v.excess>0), v.excess>0? v.excess : stockAll[v.id]||0));
        if(now) M.lotsIn(f).forEach(l=> put('iv_age', l, 'lot', l.age<2 && !(l.exp!=null && l.exp<=180), l.val, { age:M.ageName(l.age) }));
        recs(X.counts).forEach(c=> put('iv_ira', c, 'count', c.ok, c.val, { month:C.months[c.m] }));
        if(now) M.lotsIn(f).filter(l=> l.inScope).forEach(l=> put('iv_val', l, 'lot', l.reviewed, l.val, { reason:l.reason }));
        break;
      case 't_lg':
        recs(X.batches).forEach(b=> put('lg_yld', b, 'batch', b.ok, b.val, { month:C.months[b.m] }));
        recs(X.gr.concat(X.gate)).forEach(r=> put('lg_rcv', r, r.kind, r.ok, r.val, { sup:M.supName(r.sup) }));
        recs(X.ships).forEach(x=> put('lg_shp', x, 'ship', x.ok, x.val, { month:C.months[x.m] }));
        break;
      case 't_ct': {
        if(!now) break;
        const cc = new Set(open.filter(c=> (ETYPE[c.type]||{}).basis==='ctl').map(c=> c.v));
        mats.forEach(v=> put('ct_ctl', v, 'material', !cc.has(v.id), stockAll[v.id]||0));
        X.git.filter(g=> recOk(f, g.v, 'git')).forEach(g=> put('ct_rec', g, 'git', g.decide!=='Recognise' || M.booked(g), g.val, { sup:M.supName(g.sup) }));
        mats.forEach(v=> C.mdChecks.forEach(([k,n])=> put('ct_md', v, 'material', (v.md||{})[k]!==false, 0, { check:n })));
        open.forEach(c=> put('ct_sla', c, 'case', SNAP - c.opened <= 14, c.est!=null? c.est : c.affected!=null? c.affected : c.contingent||0, { type:c.type, status:M.statusName(c.stNow) }));
        break; }
    }
    return out;
  });
  M.themeVal = (id, f, months)=>{
    const fs = M.themeFacts(id, f, months), t = THEME[id];
    const subs = t.subs.map(x=>{ const xs = fs.filter(r=> r.g.sub===x.name), ok = xs.filter(r=> r.ok).length;
      return { id:x.id, name:x.name, basis:x.basis, n:xs.length, bad:xs.length-ok, rate: xs.length? ok/xs.length*100 : null, badVal:sum(xs.filter(r=> !r.ok), r=> r.val) }; });
    const have = subs.filter(x=> x.rate!=null);
    return { v: have.length? sum(have, x=> x.rate)/have.length : null, subs, n:fs.length, bad:sum(subs, x=> x.bad), coverage: have.length/t.subs.length };
  };

  /* ---------- process chain: Forecast → Plan → Procure → Receive → Produce → Ship ---------- */
  M.matIssues = (v)=>{ const out = []; if(v.excess>0) out.push('excess'); if(v.cover<v.minD) out.push('short'); if((v.md||{}).rop===false || (v.md||{}).ss===false) out.push('mdGap'); return out; };
  M.chainScope = (f)=> cache('ch|'+M.fkey(f), ()=>{
    const S = {}; C.stages.forEach(s=> S[s.id] = { id:s.id, vol:0, issues:{}, n:0, val:0, vendors:{}, vn:{} });
    const seen = {}; C.stages.forEach(s=> seen[s.id] = new Set());
    const hit = (code, x, val, kind)=>{ const st = M.issue(code).stage, s = S[st]; if(!s) return;
      const r = s.issues[code] = s.issues[code] || { code, n:0, val:0, recs:[] }; r.n++; r.val += val; r.recs.push({ x, kind });
      const xid = x.id; if(!seen[st].has(xid)){ seen[st].add(xid); s.n++; s.val += val; const vk = x.v || x.id; s.vendors[vk] = (s.vendors[vk]||0) + val; s.vn[vk] = (s.vn[vk]||0) + 1; } };
    const p = M.period(f.period), inP = (m)=> M.inPeriod(m, p);
    const fc = X.fc.filter(r=> inP(r.m) && recOk(f, r.v)), mats = M.vendorsIn(f), lots = M.lotsIn(f);
    const po = X.po.filter(l=> inP(l.m) && recOk(f, l.v)), gr = X.gr.filter(l=> inP(l.m) && recOk(f, l.v)), rnb = M.rnbSet(f);
    const bt = X.batches.filter(b=> inP(b.m) && recOk(f, b.v)), cn = X.counts.filter(c=> inP(c.m) && recOk(f, c.v)), sh = X.ships.filter(s=> inP(s.m) && recOk(f, s.v));
    fc.forEach(r=> r.issues.forEach(c=> hit(c, r, r.val, 'fc')));
    mats.forEach(v=> M.matIssues(v).forEach(c=> hit(c, v, c==='excess'? v.excess : (stockAll[v.id]||0), 'material')));
    lots.forEach(l=> l.issues.forEach(c=> hit(c, l, l.val, 'lot')));
    po.forEach(l=> l.issues.forEach(c=> hit(c, l, l.val, 'po')));
    gr.forEach(l=> l.issues.forEach(c=> hit(c, l, l.val, 'gr')));
    rnb.forEach(r=> r.issues.forEach(c=> hit(c, r, r.val, r.kind)));
    bt.forEach(b=> b.issues.forEach(c=> hit(c, b, b.val, 'batch')));
    cn.forEach(c=> c.issues.forEach(k=> hit(k, c, c.val, 'count')));
    sh.forEach(s=> s.issues.forEach(c=> hit(c, s, s.val, 'ship')));
    S.fct.vol = fc.length; S.pln.vol = mats.length + lots.length; S.prc.vol = po.length; S.rcv.vol = gr.length + rnb.length; S.prd.vol = bt.length + cn.length; S.shp.vol = sh.length;
    C.stages.forEach(s=>{ S[s.id].ct = null; S[s.id].ctName = ''; S[s.id].list = Object.values(S[s.id].issues).sort((a,b)=> b.val-a.val); });
    return S;
  });
  M.caseStages = (c)=>{ const out = {}; const prim = (ETYPE[c.type]||{}).stage || 'pln'; out[prim] = [];
    (c.lines||[]).forEach(id=>{ const l = REC[id]; if(!l) return; M.issuesOf(l).forEach(k=>{ const st = M.issue(k).stage; (out[st] = out[st] || []); if(out[st].indexOf(k)<0) out[st].push(k); }); });
    return { primary:prim, stages:out }; };

  /* ---------- segmentation on the Health card: ABC × XYZ (not inventory risk) ---------- */
  M.SEGS = { abc:C.abc, xyz:C.xyz };
  M.segOk = (v, seg)=> !seg || ((!seg.a || ABC[v]===seg.a) && (!seg.x || XYZ[v]===seg.x));
  const segK = (seg)=> seg? (seg.a||'')+(seg.x||'') : '';
  M.segLabel = (seg)=> !seg || (!seg.a && !seg.x)? null : [seg.a? 'Class '+seg.a : null, seg.x? 'class '+seg.x : null].filter(Boolean).join(', ');
  M.segComp = (kpi, f, seg)=> cache('sg|'+kpi+'|'+segK(seg)+'|'+M.fkey(f), ()=>{
    const fs = M.facts(kpi, f).filter(x=> M.segOk(x.v, seg)), ok = fs.filter(x=> x.ok).length;
    const vAll = new Set(fs.map(x=> x.v)), vBad = new Set(fs.filter(x=> x.ok===false).map(x=> x.v));
    const act = sum(fs, x=> x.act||0), rate = !fs.length? null : kpi==='fcAcc'? (act? Math.max(0,(1 - sum(fs, x=>x.val)/act)*100) : null) : ok/fs.length*100;
    return { n:fs.length, bad:fs.length-ok, rate, vN:vAll.size, vBad:vBad.size, vPct: vAll.size? vBad.size/vAll.size*100 : null }; });
  M.segCount = (f, seg)=> M.vendorsIn(f).filter(v=> M.segOk(v.id, seg)).length;
  M.heat = (f, n=14)=>{ const S = M.chainScope(f), tot = {};
    C.stages.forEach(s=> Object.entries(S[s.id].vendors).forEach(([v,val])=>{ tot[v] = (tot[v]||0) + val; }));
    return Object.entries(tot).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([v,t])=>({ v, name:M.matLabel(v), total:t, cells:C.stages.map(s=> ({ stage:s.id, val:S[s.id].vendors[v]||0, n:S[s.id].vn[v]||0 })) })); };

  /* ---------- Material Profile ---------- */
  M.vendor = (id, f)=> cache('vp|'+id+'|'+(f? M.fkey(f) : ''), ()=>{
    const v = V[id], rk = M.risk(id), recs = M.vlines(id);
    const lots = recs.filter(l=> l.kind==='lot'), stock = stockAll[id]||0;
    const byAge = C.ages.map((a,i)=> sum(lots.filter(l=> l.age===i), l=>l.val));
    const tv = f? M.topVendors(Object.assign({}, f, { vendor:null })) : null, rank = tv? tv.rows.find(r=>r.v===id) : null;
    const issues = {}; recs.forEach(l=> M.issuesOf(l).forEach(c=>{ const r = issues[c] = issues[c] || { code:c, n:0, val:0, months:[0,0,0,0,0,0], recs:[] }; r.n++; r.val += l.val||0; if(l.m!=null && l.m>=0 && l.m<6) r.months[l.m]++; r.recs.push(l.id); }));
    M.matIssues(v).forEach(c=>{ issues[c] = issues[c] || { code:c, n:1, val: c==='excess'? v.excess : stock, months:[0,0,0,0,0,1], recs:[] }; });
    const stages = C.stages.map(s=>{ const its = Object.values(issues).filter(r=> M.issue(r.code).stage===s.id); return { id:s.id, name:s.name, n:sum(its,r=>r.n), val:sum(its,r=>r.val), issues:its.sort((a,b)=>b.val-a.val) }; });
    const cases = X.cases.filter(c=> c.v===id).map(c=> Object.assign({}, c, { stNow:M.caseStatus(c) }));
    const po = recs.filter(l=> l.kind==='po'), fc = recs.filter(l=> l.kind==='fc'), counts = recs.filter(l=> l.kind==='count');
    const fA = sum(fc, r=>r.act), fF = sum(fc, r=>r.fc), fE = sum(fc, r=>r.val);
    return { v, rk, stock, byAge, rank, total:stock, byM:v.cons, lots, issues:Object.values(issues).sort((a,b)=>b.val-a.val), stages, cases,
      po, otif: po.length? po.filter(l=>l.ok).length/po.length*100 : null, fc, acc: fA? (1-fE/fA)*100 : null, bias: fA? (fF-fA)/fA*100 : null,
      counts, ira: counts.length? counts.filter(c=>c.ok).length/counts.length*100 : null,
      receipts: recs.filter(l=> l.kind==='gr' || l.kind==='gate' || l.kind==='git'), batches: recs.filter(l=> l.kind==='batch'), ships: recs.filter(l=> l.kind==='ship'),
      sup: SUP[v.sup] || null, abc:ABC[id], xyz:XYZ[id], cov:COV[id],
      lines: recs.filter(l=> l.kind!=='fc').sort((a,b)=> (b.val||0)-(a.val||0)) };
  });
  M.why = (id, ctx)=>{
    const p = M.vendor(id), out = [], v = p.v;
    if(ctx && ctx.kpi && ctx.f){ const fs = M.facts(ctx.kpi, ctx.f).filter(x=> (ctx.groups||[]).every(g=> x.g[g.dim]===g.key));
      const mine = fs.filter(x=>x.v===id), k = KPI[ctx.kpi];
      if(M.isRate(ctx.kpi)){ const bad = fs.filter(x=>x.ok===false), mb = mine.filter(x=>x.ok===false); if(bad.length) out.push({ t:'ctx', text:`${mb.length} of ${bad.length} exceptions in this view (${FCT.pct(mb.length/bad.length*100,0)})`, kpi:k.name }); }
      else if(fs.length){ const tv = sum(fs,x=>x.val), mv = sum(mine,x=>x.val); out.push({ t:'ctx', text:`${FCT.amt(mv)} of ${FCT.amt(tv)} in this view (${FCT.pct(tv? mv/tv*100 : 0,1)})`, kpi:k.name }); } }
    if(v.driver) out.push({ t:'risk', text:v.driver });
    if(v.excess>0) out.push({ t:'stage', text:`${FCT.amt(v.excess)} above the policy maximum; ${v.cover} days of cover against ${v.maxD}` });
    else if(v.cover<v.minD) out.push({ t:'stage', text:`${v.cover} days of cover, below the ${v.minD}-day policy minimum` });
    const openCases = p.cases.filter(c=> M.statusMeasure(c.stNow)==='potential');
    if(openCases.length) out.push({ t:'case', text:`${openCases.length} open case${openCases.length>1?'s':''}: ${[...new Set(openCases.map(c=> (ETYPE[c.type]||{}).name))].slice(0,3).join('; ')}` });
    if(p.sup && p.sup.distress) out.push({ t:'risk', text:'Supplier '+p.sup.name+': '+p.sup.distress });
    (v.notes||[]).forEach(n=> out.push({ t:'note', text:n }));
    return out;
  };

  /* one record's place in the chain, with the material's context at the other stages */
  M.chain = (id)=>{
    const l = M.rec(id); if(!l || !V[l.v]) return null;
    const v = V[l.v], iss = M.issuesOf(l), S = [];
    const step = (stage, label, at, detail, state, codes)=> S.push({ stage, label, at, detail, state, issues:codes||[] });
    const mine = (st)=> iss.filter(c=> M.issue(c).stage===st);
    const fcs = X.fc.filter(r=> r.v===v.id && r.m===(l.m!=null? Math.min(5,l.m) : 5))[0];
    step('fct', fcs? 'Forecast '+C.months[fcs.m] : 'No forecast', fcs? MS[fcs.m] : null, fcs? 'Forecast ₹'+FCT.n(fcs.fc,2)+' Cr · actual ₹'+FCT.n(fcs.act,2)+' Cr' : 'Material not in the demand plan', fcs? (fcs.ok? 'ok' : 'issue') : 'na', fcs? fcs.issues : []);
    const mi = M.matIssues(v);
    step('pln', 'Cover '+v.cover+' days', null, 'Policy '+v.minD+'–'+v.maxD+' days'+(v.excess? ' · '+FCT.amt(v.excess)+' above maximum' : ''), mi.length || mine('pln').length? 'issue' : 'ok', mi.concat(mine('pln')));
    if(l.kind==='po'){ step('prc', l.ok? 'Delivered on time, in full' : l.short? 'Delivered short' : 'Delivered late', l.del, l.id+' · '+M.supName(l.sup)+' · '+FCT.amt(l.val)+(l.price? ' · invoiced ₹'+FCT.n(l.ip)+' vs contract ₹'+FCT.n(l.cp) : ''), mine('prc').length? 'issue' : 'ok', mine('prc'));
      step('rcv', 'Goods receipt', l.del, 'Due '+M.date(l.due), 'ok'); }
    else if(l.kind==='gr' || l.kind==='gate' || l.kind==='git'){
      step('prc', 'Purchase order', null, (l.po? l.po+' · ' : '')+M.supName(l.sup), 'ok');
      step('rcv', l.kind==='gate'? 'At the gate, no GR' : l.kind==='git'? (l.decide==='Exclude'? 'In transit, seller holds title' : 'In transit, title passed') : l.ok? 'GR within 48 hours' : 'GR after '+l.lag+' hours', l.at!=null? l.at : l.bl,
        l.kind==='gate'? (l.what||'')+' · '+l.inv+' · '+FCT.amt(l.val) : l.kind==='git'? l.inco+' · ETA '+M.date(l.eta)+' · '+FCT.amt(l.val) : l.id+' · '+FCT.amt(l.val), mine('rcv').length? 'issue' : (l.kind==='git' && l.decide==='Exclude')? 'wait' : 'ok', mine('rcv')); }
    else if(l.kind==='lot'){ step('rcv', 'Received into stock', l.rcv, l.batch+' · '+l.days+' days old', 'ok');
      step('prd', 'Held at '+M.plantName(l.plant), null, CAT[l.cat].name+' · '+FCT.amt(l.val)+(l.exp!=null? ' · expires in '+l.exp+' days' : ''), mine('pln').length? 'issue' : 'ok', []); }
    else if(l.kind==='count'){ step('prd', l.ok? 'Count within tolerance' : 'Count variance', l.at, 'Book vs physical '+(l.varPct>0?'+':'')+FCT.n(l.varPct,2)+'%'+(l.custodian? ' · counted by the custodian' : ''), l.ok? 'ok' : 'issue', mine('prd')); }
    else if(l.kind==='batch'){ step('prd', 'Batch '+l.id, l.at, 'Yield '+FCT.n(l.yld,1)+'% against standard '+l.std+'% · '+FCT.amt(l.val), l.ok? 'ok' : 'issue', mine('prd')); }
    else if(l.kind==='ship'){ step('prd', 'Picked from stock', l.at, M.plantName(l.plant), 'ok');
      step('shp', l.iss==='cutoff'? 'Removed before delivery' : l.iss==='tpl'? '3PL report differs' : 'Dispatched', l.at, l.inco+(l.dlv!=null? ' · delivered '+M.date(l.dlv) : '')+' · '+FCT.amt(l.val), l.ok? 'ok' : 'issue', mine('shp')); }
    else if(l.kind==='fc'){ step('prd', 'Production plan', null, 'Planned from this forecast', 'ok'); }
    if(l.kind==='lot') step('shp', v.nrv? (l.reviewed? 'NRV tested' : 'NRV test pending') : 'Available to sell', null, v.nrv? 'Held for sale abroad' : '—', mine('shp').length? 'issue' : 'ok', mine('shp'));
    return { kind:l.kind, l, steps:S, iss };
  };
  M.evidence = (l)=>{
    const ev = [];
    if(l.kind==='po') ev.push(['Purchase order line', l.id, 'ERP MM'], ['Goods receipt', M.date(l.del), 'ERP MM']);
    if(l.kind==='gate') ev.push(['Gate entry', l.id+(l.truck? ' · '+l.truck : ''), 'Gate system'], ['Weighbridge slip', M.dt(l.at), 'Weighbridge'], ['Purchase order', l.po, 'ERP MM']);
    if(l.kind==='git') ev.push(['Bill of lading', l.id, 'Freight forwarder'], ['Commercial invoice', l.inco, 'Supplier']);
    if(l.kind==='gr') ev.push(['Goods receipt', l.id, 'ERP MM'], ['Gate entry', M.dt(l.at), 'Gate system']);
    if(l.kind==='count') ev.push(['Count sheet', l.id, 'WMS cycle count']);
    if(l.kind==='batch') ev.push(['Batch record', l.id, 'MES'], ['Yield report', FCT.n(l.yld,1)+'%', 'MES']);
    if(l.kind==='ship') ev.push(['Delivery note', l.id, 'ERP SD'], ['Proof of delivery', l.dlv!=null? M.date(l.dlv) : 'pending', 'TMS']);
    if(l.kind==='lot') ev.push(['Stock lot', l.id+' · '+l.batch, 'ERP MM'], ['Ageing report', l.days+' days', 'ERP MM']);
    if(l.kind==='fc') ev.push(['Forecast snapshot', C.months[l.m], 'APS'], ['Actual sales', C.months[l.m], 'ERP SD']);
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
    vendor: (s, f)=>{ for(let i=s.path.length-1;i>=0;i--){ const n = s.path[i]; if(n.t==='vendor'||n.t==='material'||n.t==='profile') return n.id; if(n.vendor) return n.vendor; } return f && f.vendor || null; },
    encode: (s)=> encodeURIComponent(JSON.stringify({ k:s.kpi, p:s.path.map(n=>{ const o = Object.assign({}, n); delete o.sel; return o; }) })),
    decode: (str)=>{ try{ if(!str) return null; if(/^kpi=/.test(str)) { const k = str.slice(4); return KPI[k] || k==='process' || k==='materials'? M.nav.init(k) : null; } const o = JSON.parse(decodeURIComponent(str)); return o && o.k? M.nav.init(o.k, o.p) : null; } catch(e){ return null; } }
  };
  M.nav.material = M.nav.vendor;
  M.materialsIn = (...a)=> M.vendorsIn(...a);
  M.topMaterials = (...a)=> M.topVendors(...a);
  M.material = (...a)=> M.vendor(...a);
})();
