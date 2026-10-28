/* FCT demo — core: formatting, state, auth, navigation, shell. Classic script; exposes window.FCT. */
(function(){
  const D = window.FCT_DATA;
  const FCT = window.FCT = window.FCT || {};
  const KEY = 'fct-demo-v1';
  FCT.AUTH = { email:'admin', password:'FCT@towers#2026' };

  /* ---------- formatting ---------- */
  const nf = (d)=> new Intl.NumberFormat('en-IN',{minimumFractionDigits:d,maximumFractionDigits:d});
  FCT.n = (v,d=0)=> v==null||isNaN(v) ? '—' : nf(d).format(v);
  FCT.cr = (v,d=2)=> v==null ? '—' : (v<0?'−':'')+'₹'+nf(d).format(Math.abs(v))+' Cr';
  FCT.crs = (v,d=2)=> v==null ? '—' : (v>0?'+':v<0?'−':'')+'₹'+nf(d).format(Math.abs(v))+' Cr';
  FCT.lakh = (v,d=1)=> '₹'+nf(d).format(v)+' L';
  /* value in Cr → smart: < 1 Cr shown in lakh */
  FCT.amt = (vCr)=> vCr==null ? '—' : Math.abs(vCr) < 1 ? (vCr<0?'−':'')+FCT.lakh(Math.abs(vCr)*100) : FCT.cr(vCr);
  FCT.pct = (v,d=1)=> v==null ? '—' : nf(d).format(v)+'%';
  FCT.esc = (s)=> String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  FCT.wd = (n)=> n<=0 ? (n===0?'WD0':'WD'+n) : 'WD+'+n;

  /* ---------- state ---------- */
  const seed = ()=>({ v:1, auth:null, persona:null, dec:{}, set:{}, add:{}, log:[], events:[], seq:0, flags:{}, notes:{} });
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch(e){ S = seed(); }
  if(!S || S.v!==1) S = seed();
  FCT.state = S;
  FCT.save = ()=>{ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} };
  FCT.reset = ()=>{ const a=S.auth, p=S.persona; try{ localStorage.removeItem(KEY); }catch(e){} S=FCT.state=seed(); S.auth=a; S.persona=p; FCT.save(); location.reload(); };

  /* metric read: base value (data) overridden by state set, plus accumulated deltas */
  FCT.v = (key, base)=>{
    if(base===undefined) base = D.metrics ? D.metrics[key] : undefined;
    let val = (key in S.set) ? S.set[key] : base;
    if(typeof val==='number' && S.add[key]) val = Math.round((val + S.add[key])*1e6)/1e6;
    return val;
  };
  FCT.flag = (k)=> !!S.flags[k];
  FCT.setFlag = (k,v=true)=>{ S.flags[k]=v; FCT.save(); };

  /* clock: frozen demo time + one minute per decision */
  const NOW = new Date('2026-10-05T09:10:00+05:30');
  FCT.nowLabel = (offset)=>{
    const d = new Date(NOW.getTime() + (offset==null? S.seq : offset)*60000 + 2*60000);
    const ist = new Date(d.getTime() + (330 + d.getTimezoneOffset())*60000);
    const hh = String(ist.getHours()).padStart(2,'0'), mm=String(ist.getMinutes()).padStart(2,'0');
    return '05-Oct '+hh+':'+mm;
  };
  FCT.tick = ()=>{ S.seq++; return FCT.nowLabel(S.seq-1); };

  /* apply a list of effects: {set:key,v} | {add:key,v} | {flag:key} | {event:text,tower,sev} | {status:{id,status}} */
  FCT.applyEffects = (effects, t)=>{
    (effects||[]).forEach(e=>{
      if(e.set) S.set[e.set]=e.v;
      else if(e.add) S.add[e.add]=(S.add[e.add]||0)+e.v;
      else if(e.flag) S.flags[e.flag]=e.v===undefined?true:e.v;
      else if(e.event) S.events.unshift({t:t||FCT.nowLabel(), tower:e.tower||'FCT', sev:e.sev||'low', text:e.event, human:true, link:e.link});
      else if(e.resolve) S.dec[e.resolve] = Object.assign({}, S.dec[e.resolve]||{}, {status:'resolved', action:'LINKED', by:'PR', t:t||FCT.nowLabel(), linked:true});
    });
  };

  /* ---------- exceptions ---------- */
  FCT.ex = (id)=> D.exceptions.find(x=>x.id===id);
  FCT.status = (x)=> (S.dec[x.id] && S.dec[x.id].status) || x.status || 'open';
  FCT.isOpen = (x)=>{ const s=FCT.status(x); return s==='open' || s==='held'; };
  FCT.exFor = (tower)=> D.exceptions.filter(x=> !tower || tower==='ALL' || x.tower===tower || (x.also||[]).includes(tower));
  FCT.openFor = (tower)=> FCT.exFor(tower).filter(FCT.isOpen).sort((a,b)=>b.priority-a.priority);
  FCT.decide = (id, rec)=>{
    const x = FCT.ex(id) || {tower:rec.tower||'FCT', title:rec.title||id}; const t = FCT.tick();
    S.dec[id] = Object.assign({}, S.dec[id]||{}, rec, {t, by:'PR'});
    S.log.unshift({ t, id, tower:x.tower, title:x.title, action:rec.action, status:rec.status, reason:rec.reason||'', comment:rec.comment||'',
      option:rec.optionLabel||'', aiRec:x.ai?x.ai.text:'', conf:x.ai?x.ai.confidence:null, model:x.ai?x.ai.model:'', by:'PR', amount:rec.amount });
    FCT.save();
    return t;
  };
  FCT.sevRank = {critical:4, high:3, medium:2, low:1};
  /* AI acceptance = quarter base + live decisions (Take counts as accepted; Override as reviewed, not accepted) */
  FCT.aiStats = ()=>{
    const t=S.log.filter(l=>l.action==='TAKE'||l.action==='BULK').length, o=S.log.filter(l=>l.action==='OVERRIDE').length;
    const acc=FCT.v('ai.accepted')+t, tot=FCT.v('ai.decisions')+t+o;
    return { accepted:acc, total:tot, rate:acc/tot*100, overrides:o, today:t+o };
  };

  /* ---------- auth & routing ---------- */
  FCT.root = ()=> document.body.getAttribute('data-root') || './';
  FCT.href = (p)=> FCT.root() + p;
  FCT.requireAuth = (needPersona=true)=>{
    if(!S.auth){ location.replace(FCT.href('screens/login.html')); return false; }
    if(needPersona && !S.persona){ location.replace(FCT.href('screens/persona.html')); return false; }
    return true;
  };
  FCT.login = (email, pw)=>{
    if(String(email).trim().toLowerCase()===FCT.AUTH.email && pw===FCT.AUTH.password){ S.auth={email:FCT.AUTH.email, at:Date.now()}; FCT.save(); return true; }
    return false;
  };
  FCT.logout = ()=>{ S.auth=null; S.persona=null; FCT.save(); location.href=FCT.href('screens/login.html'); };

  /* ---------- navigation model ---------- */
  FCT.NAV = [
    { id:'HOME', label:'Controller home', q:'Across all five towers', items:[
      ['home/desk','Executive view'],/* ['home/kpi-tree','KPI tree'], hidden from navigation, page kept */['home/kpi-stack','KPI stack'] ]},
    { id:'P2P', label:'Procure to pay', q:'Are we paying right, and are liabilities complete?', items:[
      ['p2p/vendors','Vendor profiles'],['p2p/desk','P2P scorecard'],['p2p/process','Process chain'] ]},
    { id:'O2C', label:'Order to cash', q:'Is revenue right and is cash coming in?', items:[
      ['o2c/customers','Customer profiles'],['o2c/desk','O2C scorecard'],['o2c/process','Process chain'] ]},
    { id:'R2R', label:'Record to report', q:'Will we close on time, and are the numbers right?', items:[
      ['r2r/entities','Entity profiles'],['r2r/desk','R2R scorecard'],['r2r/process','Process chain'] ]},
    { id:'SC', label:'Supply chain', q:'Is inventory stated right, and is cash tied up?', items:[
      ['sc/materials','Material profiles'],['sc/desk','SC scorecard'],['sc/process','Process chain'] ]},
    { id:'CMP', label:'Compliance', q:'Are controls working, and are we audit-ready?', items:[
      ['cmp/entities','Entity profiles'],['cmp/executive','Compliance story'] ]}
  ];
  FCT.towerName = (id)=> (FCT.NAV.find(n=>n.id===id)||{}).label || id;
  FCT.built = (p)=> (D.built||[]).includes(p);

  /* ---------- shell ---------- */
  const ICON = {
    search:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    lock:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  };
  FCT.ICON = ICON;

  /* tower icons for the rail (24px stroke icons, Lucide-style) */
  const NAV_ICON = {
    HOME:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
    P2P:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    O2C:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
    R2R:'<path d="M4 4.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h6z"/>',
    SC:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
    CMP:'<path d="M12 3 4.5 6v6c0 4.4 3.2 7.6 7.5 9 4.3-1.4 7.5-4.6 7.5-9V6z"/><path d="m8.8 12 2.2 2.2 4.3-4.4"/>' };
  const navIcon = (id)=> `<svg class="ni" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NAV_ICON[id]||NAV_ICON.HOME}</svg>`;
  function railHTML(page){
    const curTower = page.split('/')[0].toUpperCase();
    const p = D.persona;
    const groups = FCT.NAV.map(g=>{
      const cur = g.id===curTower || (curTower==='HOME' && g.id==='HOME'), open = cur;
      const code = g.id==='HOME'? 'Home' : g.id==='SC'? 'SCM' : g.id;
      const items = g.items.map(([path,label])=> `<a href="${FCT.href('screens/'+path+'.html')}" class="${path===page?'active':''}"${path===page?' aria-current="page"':''}>${label}</a>`).join('');
      /* the group body doubles as the flyout in the slim rail: same links, same order */
      return `<div class="nav-group${open?' open':''}${cur?' cur':''}" data-g="${g.id}">
        <button class="nav-head" type="button" aria-expanded="${open}" data-first="${FCT.href('screens/'+g.items[0][0]+'.html')}" title="${g.label}">
          ${navIcon(g.id)}<span class="tw"><span class="lb">${g.label}</span><span class="cd">${code}</span></span>
          <span class="chev" aria-hidden="true">▸</span></button>
        <div class="nav-items"><div class="nav-in"><div class="fly-h">${g.label}<small>${g.q}</small></div>${items}</div></div></div>`;
    }).join('');
    const deg = D.connectors.some(c=>c.status!=='Live');
    return `<aside class="rail">
      <div class="rail-brand"><button class="rail-menu" type="button" onclick="this.closest('.rail').classList.toggle('show')">Menu</button><button class="rail-collapse" type="button" aria-label="Collapse or expand navigation" title="Collapse or expand navigation"><span aria-hidden="true">«</span></button><div class="mark">FCT</div><div class="full">Finance Control Tower</div></div>
      <div class="rail-persona"><div class="avatar">${p.initials}</div><div><div class="who">${p.name}</div><div class="role">${p.title}</div></div></div>
      <nav class="nav" aria-label="Towers">${groups}</nav>
      <div class="rail-foot"><span class="dot ${deg?'amber':''}"></span>${D.connectors.length} systems connected${deg?', 1 degraded':''}</div>
    </aside>`;
  }

  function clockHTML(){
    const m = D.meta;
    const fc = FCT.v('close.forecastWD');
    const span = [0,1,2,3,4,5,6];
    const pos = (n)=> (n/6*100);
    const ticks = span.map(n=>`<div class="tick${n===m.todayWD?' today':''}" style="left:${pos(n)}%"><i></i>${FCT.wd(n)}<br><span class="faint" style="font-weight:400">${m.calendar[FCT.wd(n)]}</span></div>`).join('');
    const fcCls = fc>m.closeTargetWD ? 'fc-amber' : 'fc-green';
    const fcPos = pos(Math.min(fc,6));
    const tgtPos = pos(m.closeTargetWD);
    const sameSpot = fc===m.closeTargetWD;
    const pnl = FCT.pnlPending();
    const payHeld = FCT.v('pay.pendingCr'); const payN = FCT.v('pay.pendingCount');
    return `<div class="clock" role="region" aria-label="Close status">
      <div class="clock-title"><div class="p">${m.period} close</div><div class="s">${m.fyLabel}, day ${m.todayWD} of ${m.closeTargetWD}</div></div>
      <div class="track" title="Working-day track: today, target and live forecast">
        <div class="rule"></div><div class="fill" style="width:${pos(m.todayWD)}%"></div>
        ${ticks}
        <div class="pin target" style="left:${tgtPos}%"></div>
        <div class="flag target" style="left:${tgtPos}%;${sameSpot?'top:-4px;transform:translateX(-105%)':''}">Target ${FCT.wd(m.closeTargetWD)}</div>
        <div class="pin ${fcCls}" style="left:${fcPos}%"></div>
        <div class="flag ${fcCls}" style="left:${fcPos}%;${sameSpot?'transform:translateX(5%)':''}">Forecast ${FCT.wd(fc)}</div>
      </div>
      <div class="clock-stats">
        <div><a href="${FCT.href('screens/r2r/desk.html#kpi=progress')}"><div class="v">${FCT.v('close.readiness')}<span class="faint" style="font-weight:400">/90</span></div><div class="l">Close readiness</div></a></div>
        <div><a href="${FCT.href('screens/r2r/desk.html#kpi=adj')}"><div class="v">${FCT.cr(pnl.cr)}</div><div class="l">P&amp;L decisions pending</div></a></div>
        <div><a href="${FCT.href('screens/p2p/desk.html#kpi=overdue')}"><div class="v">${payN>0?FCT.amt(payHeld)+' to decide':'All decided'}</div><div class="l">Payment run in ${m.paymentRunIn}</div></a></div>
      </div></div>`;
  }

  /* P&L judgement pending: open exceptions flagged pnl, value = pnlCr */
  FCT.pnlPending = ()=>{
    const xs = D.exceptions.filter(x=>x.pnlCr && FCT.isOpen(x) && !x.pnlExclude);
    return { cr: Math.round(xs.reduce((s,x)=>s+x.pnlCr,0)*100)/100, count: xs.length, items: xs };
  };

  function topbarHTML(page){
    const g = FCT.NAV.find(n=>n.items.some(i=>i[0]===page));
    const it = g ? g.items.find(i=>i[0]===page) : null;
    return `<header class="topbar">
      <div class="crumbs">${D.meta.client} <span class="faint">/</span> Financial controller <span class="faint">/</span> ${g?g.label:''} <span class="faint">/</span> <b>${it?it[1]:''}</b></div>
      <div class="search">${ICON.search}<input id="fct-search" type="search" placeholder="Search vendors, customers, IDs" autocomplete="off" aria-label="Search"><div class="search-results hide" id="fct-sr"></div></div>
      <div class="menu"><button class="iconbtn" id="fct-um" type="button"><span class="avatar sm">${D.persona.initials}</span>${D.persona.firstName}</button>
        <div class="menu-pop hide" id="fct-ump">
          <a href="${FCT.href('screens/persona.html')}">Switch persona</a>
          <hr><button type="button" id="fct-reset">Reset demo data</button>
          <button type="button" id="fct-out">Sign out</button></div></div>
    </header>`;
  }

  /* collapsible rail: a slim strip of tower codes; the choice is remembered per viewer (P2P, O2C and Supply Chain start slim) */
  const railPref = ()=>{ try{ return localStorage.getItem('fct-rail'); }catch(e){ return null; } };
  FCT.railMin = (on)=>{ document.body.classList.toggle('rail-min', on); try{ localStorage.setItem('fct-rail', on? 'min' : 'full'); }catch(e){} };
  function wireRail(root){
    root.querySelectorAll('.nav-head').forEach(b=>b.addEventListener('click',()=>{
      if(document.body.classList.contains('rail-min') && innerWidth>860){ location.href = b.dataset.first; return; }
      const g=b.parentElement; g.classList.toggle('open'); b.setAttribute('aria-expanded', g.classList.contains('open')); }));
    const c = root.querySelector('.rail-collapse'); if(c) c.addEventListener('click',()=> FCT.railMin(!document.body.classList.contains('rail-min')));
  }
  FCT.renderShell = ()=>{
    const pref = railPref(); document.body.classList.toggle('rail-min', pref? pref==='min' : /^(p2p|o2c|sc)\//.test(document.body.getAttribute('data-page')||''));
    const page = document.body.getAttribute('data-page');
    const app = document.getElementById('app');
    const content = app.innerHTML;
    app.className='app';
    app.innerHTML = railHTML(page) + `<div class="main">${topbarHTML(page)}<div id="fct-clock">${clockHTML()}</div><main class="page" id="page">${content}</main>
      <footer class="foot">Demonstration prototype. All data, entities, people and system connections are simulated for the ${D.meta.client} working session.</footer></div>`;
    wireRail(app);
    const um=document.getElementById('fct-um'), ump=document.getElementById('fct-ump');
    um.addEventListener('click',e=>{ e.stopPropagation(); ump.classList.toggle('hide'); });
    document.addEventListener('click',()=>ump.classList.add('hide'));
    document.getElementById('fct-out').addEventListener('click',FCT.logout);
    document.getElementById('fct-reset').addEventListener('click',()=>{ if(confirm('Reset all demo decisions and return to the 09:10 starting position?')) FCT.reset(); });
    wireSearch();
  };
  FCT.refreshShell = ()=>{
    const c=document.getElementById('fct-clock'); if(c) c.innerHTML=clockHTML();
    const page = document.body.getAttribute('data-page');
    const rail=document.querySelector('.rail');
    if(rail){ const open=[...rail.querySelectorAll('.nav-group.open')].map(g=>g.dataset.g); const tmp=document.createElement('div'); tmp.innerHTML=railHTML(page); const nr=tmp.firstElementChild;
      nr.querySelectorAll('.nav-group').forEach(g=>g.classList.toggle('open', open.includes(g.dataset.g)));
      rail.replaceWith(nr); wireRail(nr.parentElement); }
  };

  function wireSearch(){
    const inp=document.getElementById('fct-search'), box=document.getElementById('fct-sr');
    const idx = [];
    D.exceptions.forEach(x=> idx.push({k:(x.id+' '+x.title+' '+(x.subject||'')+' '+x.entity).toLowerCase(), label:x.id+'  '+x.title, sub:FCT.towerName(x.tower)+', '+x.entity, go:()=>FCT.openDrawer && FCT.openDrawer(x.id)}));
    D.entities.forEach(e=> idx.push({k:(e.id+' '+e.name).toLowerCase(), label:e.id+'  '+e.name, sub:'Entity, close readiness '+e.readiness, href:FCT.href('screens/r2r/entities.html#'+encodeURIComponent(JSON.stringify({k:'entities',p:[{t:'root',label:'Entity portfolio'},{t:'eprofile',id:e.id,label:e.id+' '+e.name}]})))}));
    (D.searchExtra||[]).forEach(s=> idx.push({k:s.k.toLowerCase(), label:s.label, sub:s.sub, href:FCT.href(s.href)}));
    inp.addEventListener('input',()=>{
      const q=inp.value.trim().toLowerCase(); if(q.length<2){box.classList.add('hide');return;}
      const hits=idx.filter(i=>i.k.includes(q)).slice(0,10);
      box.innerHTML = hits.length ? hits.map((h,i)=>`<a href="${h.href||'#'}" data-i="${i}">${FCT.esc(h.label)}<small>${FCT.esc(h.sub)}</small></a>`).join('') : '<div class="empty">No match. Try a vendor, customer, entity or exception ID.</div>';
      box.classList.remove('hide');
      box.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{ const h=hits[+a.dataset.i]; if(h.go){ e.preventDefault(); box.classList.add('hide'); h.go(); } }));
    });
    document.addEventListener('click',e=>{ if(!box.contains(e.target) && e.target!==inp) box.classList.add('hide'); });
  }

  /* page bootstrap: FCT.page({render}) — render(el) draws #page content; rerun after decisions */
  FCT.page = (opts)=>{
    if(!FCT.requireAuth(true)) return;
    FCT.renderShell();
    FCT._render = ()=>{ const el=document.getElementById('page'); el.innerHTML=''; opts.render(el); };
    FCT._render();
    FCT.onChange = ()=>{ FCT.refreshShell(); FCT._render(); };
    const q = new URLSearchParams(location.search); if(q.get('x') && FCT.openDrawer) FCT.openDrawer(q.get('x'));
  };
})();
