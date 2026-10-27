/* FCT demo — UI components and the shared decision drawer. */
(function(){
  const D = window.FCT_DATA, FCT = window.FCT, S = ()=>FCT.state, esc = FCT.esc;
  const ui = FCT.ui = {};

  /* ---------- small pieces ---------- */
  ui.sev = (s)=> `<span class="pill ${s}">${s? s[0].toUpperCase()+s.slice(1):''}</span>`;
  ui.prio = (p)=> `<span class="prio ${p>=70?'p-hi':p>=50?'p-md':''}" title="Priority score">${p}</span>`;
  ui.tw = (t)=> `<span class="tw-tag">${t}</span>`;
  ui.conf = (c)=> c==null?'':`<span class="conf">${Math.round(c*100)}%</span>`;
  ui.status = (st)=>{
    const m={open:['low','Open'],held:['medium','Held'],escalated:['high','Escalated'],resolved:['pos','Resolved'],'resolved-overridden':['pos','Overridden'],
      Supported:['pos','Supported'],Watch:['medium','Watch'],Action:['critical','Action'],Signed:['pos','Signed'],Draft:['ai','AI draft'],Edited:['brand','Edited'],
      Effective:['pos','Effective'],Failing:['critical','Failing'],Pending:['medium','Pending'],Approved:['pos','Approved'],Rejected:['critical','Rejected'],
      Overdue:['critical','Overdue'],Blocked:['pos','Blocked'],Merged:['pos','Merged'],'Merge requested':['brand','Merge requested'],'Not a duplicate':['low','Not a duplicate'],'Rejected new':['pos','New request rejected'],Activated:['pos','Activated'],Decided:['pos','Decided'],Delegated:['brand','Delegated'],Escalated:['high','Escalated'],'In progress':['brand','In progress'],Planned:['low','Planned'],Done:['pos','Done'],Closed:['pos','Closed'],Certified:['pos','Certified']};
    const v=m[st]||['low',st]; return `<span class="pill ${v[0]}">${v[1]}</span>`;
  };
  ui.who = (id)=>{ const u=D.users.find(u=>u.id===id); return u? u.name : id; };
  ui.bar = (pct, cls='')=> `<div class="bar ${cls}"><i style="width:${Math.max(0,Math.min(100,pct))}%"></i></div>`;
  ui.meter = (pct, cls='', label)=> `<div class="meter">${ui.bar(pct,cls)}<span class="num" style="min-width:42px;text-align:right">${label!=null?label:FCT.pct(pct,0)}</span></div>`;
  ui.gate = (t)=> `<div class="gate">${FCT.ICON.lock}<div>${esc(t)}</div></div>`;
  ui.delta = (v, good='up', fmt=(x)=>x)=>{ if(v==null||v===0) return ''; const up=v>0; const ok=(up&&good==='up')||(!up&&good==='down'); return `<span class="${ok?'up':'down'}">${up?'▲':'▼'} ${fmt(Math.abs(v))}</span>`; };

  /* KPI band: [{l,v,s,href,cls,title}] */
  ui.band = (ks)=> `<div class="band">${ks.map(k=>{
    const tag = k.href? 'a':'div';
    return `<${tag} class="k ${k.cls||''}" ${k.href?`href="${k.href}"`:''} ${k.title?`title="${esc(k.title)}"`:''}><div class="kl">${k.l}</div><div class="kval">${k.v}</div>${k.s?`<div class="ks">${k.s}</div>`:''}</${tag}>`;
  }).join('')}</div>`;

  ui.panel = (o)=> `<section class="panel ${o.cls||''}" ${o.id?`id="${o.id}"`:''}>${o.title?`<div class="panel-h"><div><h2>${o.title}</h2>${o.sub?`<div class="sub">${o.sub}</div>`:''}</div>${o.actions?`<div class="btn-row">${o.actions}</div>`:''}</div>`:''}<div class="panel-b ${o.flush?'flush':''}">${o.body||''}</div></section>`;
  ui.head = (title, lead, actions)=> `<div class="page-head"><div><h1>${title}</h1>${lead?`<div class="lead">${lead}</div>`:''}</div>${actions?`<div class="page-actions">${actions}</div>`:''}</div>`;
  ui.aiCard = (ai, opts={})=> !ai?'':`<div class="ai-card"><div class="ai-h"><span>AI recommendation</span>${ai.confidence!=null?`<span>Confidence ${Math.round(ai.confidence*100)}%</span>`:''}</div>
     <div class="ai-t">${ai.text}</div>
     ${ai.reasoning&&ai.reasoning.length?`<details ${opts.open?'open':''}><summary>How the AI reached this</summary><ul>${ai.reasoning.map(r=>`<li>${r}</li>`).join('')}</ul></details>`:''}
     ${ai.model?`<div class="model">Model ${esc(ai.model)}${ai.id?', recommendation '+esc(ai.id):''}</div>`:''}</div>`;
  ui.feed = (evs, n=12)=> `<ul class="feed">${evs.slice(0,n).map(e=>`<li><span class="t">${esc(e.t)}</span><div>${e.tower?ui.tw(e.tower)+' ':''}<span class="${e.ai?'ai':''}">${e.link?`<a href="#" data-x="${esc(e.link)}">${esc(e.text)}</a>`:esc(e.text)}</span>${e.human?' <span class="faint em">by you</span>':''}</div></li>`).join('')}</ul>`;
  ui.events = (tower)=>{ const all = S().events.concat(D.events); return tower? all.filter(e=>!e.tower||e.tower===tower||e.tower==='FCT') : all; };

  /* table: cols [{k,l,r,fmt(row),w}] rows[] opts {click:'x'|fn, id, max, foot, sel} */
  ui.table = (cols, rows, opts={})=>{
    const max = opts.max||rows.length;
    const body = rows.slice(0,max).map((r,i)=>{
      const xid = opts.rowX? opts.rowX(r) : (opts.click==='x'? r.id : null);
      const cls = [xid||opts.rowHref?'click':'', opts.rowCls?opts.rowCls(r):''].join(' ');
      return `<tr class="${cls}" ${xid?`data-x="${esc(xid)}"`:''} ${opts.rowHref?`data-go="${esc(opts.rowHref(r))}"`:''} ${opts.rowData?opts.rowData(r):''}>${cols.map(c=>`<td class="${c.r?'r num':''} ${c.cls||''}">${c.fmt? c.fmt(r,i) : esc(r[c.k])}</td>`).join('')}</tr>`;
    }).join('');
    const more = rows.length>max ? `<button class="more" data-more="${opts.id||''}">Show all ${rows.length}</button>` : '';
    return `<div class="tbl-wrap"><table class="t" ${opts.id?`id="${opts.id}"`:''}><thead><tr>${cols.map(c=>`<th class="${c.r?'r':''}" ${c.w?`style="width:${c.w}"`:''}>${c.l}</th>`).join('')}</tr></thead><tbody>${body||`<tr><td colspan="${cols.length}"><div class="empty">${opts.empty||'Nothing here right now.'}</div></td></tr>`}</tbody>${opts.foot?`<tfoot><tr>${opts.foot.map(f=>`<td class="${f.r?'r num':''}">${f.v==null?'':f.v}</td>`).join('')}</tr></tfoot>`:''}</table></div>${more}`;
  };

  /* standard exception queue table */
  ui.queue = (xs, opts={})=> opts.compact ? ui.table([
      {l:'Priority', fmt:x=>ui.prio(x.priority), w:'64px'},
      {l:'Exception', fmt:x=>`<div class="title">${esc(x.title)}</div><div class="sub2">${ui.tw(x.tower)} ${x.id}, ${x.entity}</div><div class="ai-s">AI: ${esc(x.ai?x.ai.short||'':'')}${x.ai&&x.ai.confidence?' ('+Math.round(x.ai.confidence*100)+'%)':''}</div>`},
      {l:'Severity', fmt:x=>ui.sev(x.severity)},
      {l:'Impact', r:true, fmt:x=>`<span class="stat">${x.impact.short||FCT.amt(x.impact.valueCr)}</span>`},
      {l:'Due', fmt:x=>`<span class="nowrap">${esc(x.due)}</span>`}
    ], xs, Object.assign({click:'x', empty:'Nothing waiting on you here.'}, opts)) : ui.table([
      {l:'Priority', fmt:x=>ui.prio(x.priority), w:'64px'},
      {l:'Exception', fmt:x=>`<div class="title">${esc(x.title)}</div><div class="sub2">${x.id}, ${x.entity}${x.subject?', '+esc(x.subject):''}</div>`},
      ...(opts.tower===false?[]:[{l:'Tower', fmt:x=>ui.tw(x.tower)}]),
      {l:'Severity', fmt:x=>ui.sev(x.severity)},
      {l:'Impact', r:true, fmt:x=>`<span class="stat">${x.impact.short||FCT.amt(x.impact.valueCr)}</span>`},
      {l:'Due', fmt:x=>`<span class="nowrap">${esc(x.due)}</span>`},
      {l:'AI suggests', fmt:x=>`<div style="max-width:300px">${esc(x.ai?x.ai.short||x.ai.text:'')}</div>`},
      {l:'Conf.', r:true, fmt:x=>ui.conf(x.ai&&x.ai.confidence)},
      {l:'Owner', fmt:x=>`<span class="nowrap">${esc(ui.who(x.owner))}</span>`},
      ...(opts.showStatus?[{l:'Status', fmt:x=>ui.status(FCT.status(x))}]:[])
    ], xs, Object.assign({click:'x', empty:'Nothing waiting on you here.'}, opts));

  /* tower desk: standard layout shared by the five tower desks */
  ui.towerDesk = (el, o)=>{
    const open = FCT.openFor(o.tower);
    const decided = FCT.exFor(o.tower).filter(x=>!FCT.isOpen(x)).length;
    const mat = open.filter(x=>x.impact.valueCr && FCT.sevRank[x.severity]>=3).reduce((s,x)=>s+x.impact.valueCr,0);
    el.innerHTML = ui.head(o.title, o.lead, `<a class="btn" href="${FCT.href('screens/home/desk.html')}">Executive view</a>`) +
      ui.band([{l:'Material exposure', v:FCT.cr(mat), s:`${open.filter(x=>FCT.sevRank[x.severity]>=3).length} critical or high items`, cls:mat?'alert':'good'}].concat(o.kpis)) +
      `<div class="grid g-8-4"><div class="stack">${ui.panel({title:'Waiting on you', sub:`${open.length} open, ${decided} decided today. Ranked by priority.`, flush:true, body:ui.queue(open,{compact:true, empty:'Nothing open in this tower. Every item has been decided.'})})}${o.left||''}</div>
       <div class="stack">${o.right||''}${ui.panel({title:'Recent activity', flush:true, body:ui.feed(ui.events(o.tower),7)})}</div></div>`;
  };

  /* ---------- charts ---------- */
  ui.charts = {};
  ui.chart = (id, cfg)=>{
    const el = document.getElementById(id); if(!el) return;
    if(!window.Chart){ el.parentElement.innerHTML = '<div class="empty">Chart library unavailable offline; figures are in the table.</div>'; return; }
    if(ui.charts[id]) ui.charts[id].destroy();
    Chart.defaults.font.family = '"IBM Plex Sans", system-ui, sans-serif'; Chart.defaults.font.size = 12; Chart.defaults.color = '#475652';
    Chart.defaults.borderColor = '#E4E8E6';
    const o = cfg.options||{}; o.plugins = Object.assign({legend:{display:false}}, o.plugins||{});
    cfg.options = Object.assign({responsive:true, maintainAspectRatio:false, animation:false}, o);
    ui.charts[id] = new Chart(el, cfg);
  };
  ui.C = { brand:'#0F3B3A', brand2:'#1D5C59', teal3:'#7FA9A4', brass:'#A37B2C', crit:'#B42318', high:'#C2560C', med:'#C9A227', pos:'#2C6E49', low:'#9AA6A2', ai:'#4C47A6', line:'#DCE1DF' };

  /* ---------- toast & modal ---------- */
  ui.toast = (msg, link)=>{
    let box=document.querySelector('.toasts'); if(!box){ box=document.createElement('div'); box.className='toasts'; box.setAttribute('role','status'); document.body.appendChild(box); }
    const t=document.createElement('div'); t.className='toast'; t.innerHTML = esc(msg) + (link?` <a href="${link}">View in log</a>`:''); box.appendChild(t);
    setTimeout(()=>t.remove(), 4500);
  };
  /* modal({title, body, ok, cancel, wide, onOk(root) -> false to keep open}) */
  ui.modal = (o)=>{
    const w=document.createElement('div'); w.className='modal-wrap';
    w.innerHTML=`<div class="modal ${o.wide?'wide':''}" role="dialog" aria-modal="true"><div class="modal-h"><h3>${o.title}</h3><button class="drawer-x" data-close aria-label="Close">×</button></div><div class="modal-b">${o.body}</div>
      <div class="modal-f">${o.cancel===false?'':`<button class="btn" data-close>${o.cancel||'Cancel'}</button>`}${o.ok?`<button class="btn primary" data-ok>${o.ok}</button>`:''}</div></div>`;
    document.body.appendChild(w);
    const close=()=>{ w.remove(); document.removeEventListener('keydown',k); };
    const k=(e)=>{ if(e.key==='Escape') close(); };
    document.addEventListener('keydown',k);
    w.addEventListener('click',e=>{ if(e.target===w||e.target.hasAttribute('data-close')) close(); });
    const ok=w.querySelector('[data-ok]'); if(ok) ok.addEventListener('click',()=>{ if(!o.onOk || o.onOk(w)!==false) close(); });
    if(o.onOpen) o.onOpen(w);
    const f=w.querySelector('input,select,textarea,[data-ok]'); if(f) f.focus();
    return w;
  };
  /* simulated file attach used by evidence workflows */
  ui.fileField = (label='Attach evidence')=> `<div class="field"><label>${label}</label><input type="file" data-file><span class="hint">The file stays in this browser; the demo records its name against the evidence pack.</span></div>`;

  /* simple human workflow: records a decision against a pseudo-id and applies effects */
  ui.act = (id, rec, effects, msg)=>{
    const t = FCT.decide(id, rec);
    FCT.applyEffects(effects, t); FCT.save();
    if(msg) ui.toast(msg);
    FCT.onChange && FCT.onChange();
  };

  /* ---------- decision drawer ---------- */
  let current = null;
  const reasons = (list)=> list.map(r=>`<option value="${r[0]}">${r[0]} ${esc(r[1])}</option>`).join('');
  function evidenceHTML(x){
    const ev = x.evidence||{}; let h='';
    if(ev.indicators) h += `<table class="ind">${ev.indicators.map(i=>`<tr class="${i.hit?'':'miss'}"><td>${i.hit?'':'<span class="faint">Not present: </span>'}${esc(i.label)}</td><td class="pts">${i.points?(i.hit?'+':'')+i.points:''}</td></tr>`).join('')}${ev.score!=null?`<tr><td><b>Risk score</b> <span class="faint">(threshold ${ev.threshold||60})</span></td><td class="pts">${ev.score}</td></tr>`:''}</table>`;
    if(ev.kv) h += `<dl class="kv">${ev.kv.map(p=>`<dt>${esc(p[0])}</dt><dd>${p[1]}</dd>`).join('')}</dl>`;
    if(ev.compare) h += `<div class="compare"><div><h5>${esc(ev.compare.a.title)}</h5><dl class="kv">${ev.compare.rows.map(r=>`<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl></div><div><h5>${esc(ev.compare.b.title)}</h5><dl class="kv">${ev.compare.rows.map(r=>`<dt>${esc(r[0])}</dt><dd class="${r[1]===r[2]?'':'diff'}">${esc(r[2])}</dd>`).join('')}</dl></div></div>`;
    if(ev.table) h += ui.table(ev.table.cols.map((c,i)=>({l:c, r:(ev.table.right||[]).includes(i), fmt:r=>r[i]})), ev.table.rows, {foot:ev.table.foot?ev.table.foot.map((v,i)=>({v, r:(ev.table.right||[]).includes(i)})):null});
    if(ev.bullets) h += `<ul style="margin:8px 0 0;padding-left:18px;font-size:13px">${ev.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>`;
    if(ev.docs) h += `<div style="margin-top:10px">${ev.docs.map(d=>`<span class="chip">${esc(d)}</span>`).join('')}</div>`;
    return h;
  }
  function entryHTML(je){
    if(!je) return '';
    return `<table class="je"><thead><tr><th>Account</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>${je.lines.map(l=>`<tr><td>${esc(l[0])}</td><td class="r num">${l[1]?FCT.amt(l[1]):''}</td><td class="r num">${l[2]?FCT.amt(l[2]):''}</td></tr>`).join('')}</tbody></table>${je.note?`<div class="faint" style="font-size:12px;margin-top:6px">${esc(je.note)}</div>`:''}`;
  }
  function resolvedBanner(x){
    const d=S().dec[x.id]; if(!d) return '';
    const st=d.status; const cls= st==='held'?'held': st==='escalated'?'esc':'';
    const verb = {TAKE:'Recommendation taken',OVERRIDE:'Overridden',HOLD:'Held',ESCALATE:'Escalated',ASSIGN:'Reassigned',NUDGE:'Reminder sent',BULK:'Approved in bulk',LINKED:'Resolved by a linked decision'}[d.action]||d.action;
    return `<div class="resolved ${cls}">${verb} by ${ui.who(d.by)} at ${esc(d.t)}${d.optionLabel?': '+esc(d.optionLabel):''}${d.reason?' ('+esc(d.reason)+')':''}${st==='held'&&d.until?', follow up '+esc(d.until):''}${d.target?', to '+esc(d.target):''}</div>`;
  }
  function drawerHTML(x){
    const st = FCT.status(x); const done = !FCT.isOpen(x);
    const imp = x.impact||{};
    const cells = [[imp.short||FCT.amt(imp.valueCr), imp.label||'Financial impact'], [x.due, 'Due'], [ui.who(x.owner), 'Owner']];
    const trail = (x.activity||[]).concat(S().log.filter(l=>l.id===x.id).reverse().map(l=>({t:l.t, text:`${l.action==='TAKE'?'Took recommendation':l.action==='OVERRIDE'?'Overrode: '+l.option:l.action==='HOLD'?'Held':l.action==='ESCALATE'?'Escalated':l.action==='ASSIGN'?'Reassigned':l.action==='NUDGE'?'Nudged owner':l.action}${l.reason?' ('+l.reason+')':''}${l.comment?': "'+l.comment+'"':''}`, human:true})));
    return `<div class="drawer-h"><button class="drawer-x" data-dclose aria-label="Close">×</button>
      <div class="meta">${ui.tw(x.tower)} ${ui.sev(x.severity)} <span>Priority <b class="stat">${x.priority}</b></span><span>${x.id}</span><span>${x.entity}</span>${ui.status(st)}</div>
      <h2>${esc(x.title)}</h2>${x.subject?`<div class="subj">${esc(x.subject)}</div>`:''}</div>
    <div class="drawer-b">
      ${done?`<section>${resolvedBanner(x)}</section>`:(st==='held'?`<section>${resolvedBanner(x)}</section>`:'')}
      <section><div class="impact">${cells.map(c=>`<div><div class="v">${esc(c[0])}</div><div class="l">${esc(c[1])}</div></div>`).join('')}</div></section>
      <section><h3>What happened</h3><div style="font-size:13.5px">${x.what||''}</div>${x.trigger?`<div class="faint" style="font-size:12px;margin-top:6px">Detected by: ${esc(x.trigger)}</div>`:''}</section>
      ${x.rca?`<section><h3>Root cause analysis</h3><div style="font-size:13.5px;line-height:1.5">${esc(x.rca.summary)}</div></section>`:''}
      ${!x.rca&&x.rootCause?`<section><h3>Root cause</h3><div style="font-size:13.5px">${x.rootCause}</div></section>`:''}
      ${x.chain?`<section><h3>Process chain</h3><div style="display:flex;flex-wrap:wrap;align-items:stretch;gap:4px;flex-wrap:nowrap">${x.chain.map((c,i)=>`${i?'<div style="align-self:center;opacity:.55;font-size:13px;flex:0 0 auto">→</div>':''}<div style="flex:1 1 0;min-width:90px;max-width:190px;padding:7px 8px;border-radius:8px;border:1px solid ${c[3]?'rgba(229,72,77,.85)':'rgba(140,160,155,.35)'};background:${c[3]?'rgba(229,72,77,.12)':'rgba(140,160,155,.06)'}"><div style="font-weight:600;font-size:12.5px">${c[3]?'⚠ ':''}${esc(c[0])}</div><div class="faint" style="font-size:11.5px;margin-top:2px">${esc(c[1])}</div><div style="font-size:11.5px;margin-top:2px">${esc(c[2])}</div></div>`).join('')}</div>${x.chainNote?`<div style="font-size:12.5px;margin-top:8px;color:rgba(229,72,77,.95)">⚠ ${esc(x.chainNote)}</div>`:''}</section>`:''}
      ${x.evidence?`<section><h3>Evidence</h3>${evidenceHTML(x)}</section>`:''}
      ${x.ai?`<section>${ui.aiCard(x.ai,{open:false})}</section>`:''}
      ${x.entry?`<section><h3>What it does to the books</h3>${entryHTML(x.entry)}</section>`:''}
      ${x.gate?`<section>${ui.gate(x.gate)}</section>`:''}
      ${x.towers&&x.towers.length?`<section><h3>Towers involved</h3><div style="display:grid;gap:6px">${x.towers.map(t=>`<div style="display:flex;gap:10px;align-items:baseline;font-size:13px">${ui.tw(t[0])}<span style="flex:1">${esc(t[1])}</span>${/\/cmp\//.test(location.pathname)?'':`<a class="chip" href="${FCT.href(t[2])}">Open in ${esc(t[0])} ↗</a>`}</div>`).join('')}</div></section>`:''}
      ${x.links&&x.links.length?`<section><h3>Related</h3>${x.links.map(l=>`<a class="chip" href="${FCT.href(l[1])}">${esc(l[0])}</a>`).join('')}</section>`:''}
      <section><h3>Activity</h3>${trail.length? '' : '<div class="faint" style="font-size:12.5px">No actions recorded yet.</div>'}<ul class="timeline">${trail.map(a=>`<li class="${a.ai?'ai':''} ${a.human?'human':''}"><span class="t">${esc(a.t)}</span><br>${a.ai?'<span class="ai-mark">AI</span> ':''}${esc(a.text)}</li>`).join('')}</ul></section>
    </div>
    <div class="drawer-f" id="dbar">${done? `<div class="btn-row"><span class="faint" style="font-size:13px">Decision recorded with this case.</span></div>` : barHTML(x)}</div>`;
  }
  function barHTML(x){
    const A = x.actions || ['TAKE','HOLD','OVERRIDE','ASSIGN','NUDGE','ESCALATE'];
    const b = (k,l,cls='')=> A.includes(k)?`<button class="btn ${cls}" data-a="${k}">${l}</button>`:'';
    return `<div class="btn-row">${b('TAKE', x.takeLabel||'Take recommendation','primary')}${b('HOLD','Hold')}${b('OVERRIDE','Override')}${b('ASSIGN','Assign')}${b('NUDGE','Nudge')}${b('ESCALATE','Escalate')}</div><div id="dpop"></div>`;
  }
  function popHTML(x, a){
    const users = D.users.filter(u=>u.id!=='PR').map(u=>`<option value="${u.id}">${esc(u.name)}, ${esc(u.role)}${u.availability&&u.availability.status!=='Available'?' ('+u.availability.status+')':''}</option>`).join('');
    if(a==='TAKE'){
      const f = x.takeForm;
      return `<div class="pop"><h4>${esc(x.takeLabel||'Take recommendation')}</h4>
        ${f&&f.checks?`<div class="radio-list">${f.checks.map((c,i)=>`<label><input type="checkbox" checked data-chk="${i}"> <span>${esc(c)}</span></label>`).join('')}</div>`:''}
        ${f&&f.amount?`<div class="field"><label>${esc(f.amount.label)}</label><input type="number" step="0.01" value="${f.amount.v}" data-amt><span class="hint">${esc(f.amount.hint||'Changing the amount is logged as an edit of the AI proposal.')}</span></div>`:''}
        <div class="field"><label>Comment (optional)</label><textarea data-cmt placeholder="Visible in the evidence pack">${esc(x.takeComment||'')}</textarea></div>
        <div class="btn-row"><button class="btn primary" data-ok>Confirm</button><button class="btn ghost" data-cancel>Cancel</button></div></div>`;
    }
    if(a==='HOLD') return `<div class="pop"><h4>Hold this decision</h4><div class="field"><label>Reason</label><select data-rsn>${reasons(D.codes.hold)}</select></div>
        <div class="field"><label>Follow up on</label><input type="date" value="2026-10-06" data-until></div><div class="field"><label>Comment</label><textarea data-cmt></textarea></div>
        <div class="btn-row"><button class="btn primary" data-ok>Hold</button><button class="btn ghost" data-cancel>Cancel</button></div></div>`;
    if(a==='OVERRIDE'){
      const opts = (x.override||[{id:'alt',label:'Take a different action (describe in comment)'}]);
      return `<div class="pop"><h4>Override the recommendation</h4><div class="radio-list">${opts.map((o,i)=>`<label class="${o.disabled?'dis':''}" title="${esc(o.why||'')}"><input type="radio" name="ovr" value="${i}" ${o.disabled?'disabled':''} ${i===opts.findIndex(z=>!z.disabled)?'checked':''}><span>${esc(o.label)}${o.disabled?`<br><span class="faint" style="font-size:12px">${esc(o.why)}</span>`:''}</span></label>`).join('')}</div>
        ${opts.some(o=>o.amount)?`<div class="field"><label>Amount (₹ Cr)</label><input type="number" step="0.01" data-amt value="${(opts.find(o=>o.amount)||{}).amount||''}"></div>`:''}
        <div class="field"><label>Reason code</label><select data-rsn>${reasons(D.codes.override)}</select></div>
        <div class="field"><label>Comment</label><textarea data-cmt placeholder="Required for OVR-99"></textarea></div>
        <div class="btn-row"><button class="btn primary" data-ok>Override</button><button class="btn ghost" data-cancel>Cancel</button></div><div class="faint" style="font-size:12px;margin-top:8px">Overrides are logged and used to retrain and recalibrate the AI.</div></div>`;
    }
    if(a==='ASSIGN') return `<div class="pop"><h4>Assign</h4><div class="field"><label>New owner</label><select data-usr>${users}</select></div><div class="field"><label>Note to owner</label><textarea data-cmt></textarea></div>
        <div class="btn-row"><button class="btn primary" data-ok>Assign</button><button class="btn ghost" data-cancel>Cancel</button></div></div>`;
    if(a==='ESCALATE') return `<div class="pop"><h4>Escalate</h4><div class="field"><label>Escalate to</label><select data-tgt>${['Group CFO','Compliance','Internal Audit','Entity head'].map(t=>`<option>${t}</option>`).join('')}</select></div><div class="field"><label>Comment</label><textarea data-cmt></textarea></div>
        <div class="btn-row"><button class="btn primary" data-ok>Escalate</button><button class="btn ghost" data-cancel>Cancel</button></div></div>`;
    return '';
  }
  function wireBar(x, root){
    root.querySelectorAll('[data-a]').forEach(btn=>btn.addEventListener('click',()=>{
      const a=btn.dataset.a; const pop=root.querySelector('#dpop');
      if(a==='NUDGE'){ FCT.decide(x.id,{action:'NUDGE', status:FCT.status(x)}); ui.toast(`Reminder sent to ${ui.who(x.owner)} on Teams (simulated)`); render(); return; }
      pop.innerHTML = popHTML(x,a);
      pop.querySelector('[data-cancel]').addEventListener('click',()=>pop.innerHTML='');
      pop.querySelector('[data-ok]').addEventListener('click',()=>{
        const g=(s)=>pop.querySelector(s); const cmt=g('[data-cmt]')?g('[data-cmt]').value.trim():'';
        let t, effects=[], msg='';
        if(a==='TAKE'){
          const amt = g('[data-amt]')? parseFloat(g('[data-amt]').value) : null;
          const edited = x.takeForm&&x.takeForm.amount && amt!==x.takeForm.amount.v;
          t = FCT.decide(x.id,{action:'TAKE', status:'resolved', comment:cmt, amount:amt, edited});
          effects = (x.onTake||[]).map(e=> (e.amountKey && amt!=null)? Object.assign({},e,{v: e.sign? e.sign*amt : amt}) : e);
          msg = x.takeToast || 'Recommendation taken and logged';
        } else if(a==='HOLD'){
          t = FCT.decide(x.id,{action:'HOLD', status:'held', reason:g('[data-rsn]').value, until:g('[data-until]').value, comment:cmt});
          msg = 'Held until '+g('[data-until]').value;
        } else if(a==='OVERRIDE'){
          const opts=(x.override||[{label:'Alternative action'}]); const r=pop.querySelector('input[name=ovr]:checked'); const o=opts[r?+r.value:0];
          const rsn=g('[data-rsn]').value; if(rsn==='OVR-99' && !cmt){ g('[data-cmt]').focus(); g('[data-cmt]').style.borderColor='var(--crit)'; return; }
          const amt = g('[data-amt]')? parseFloat(g('[data-amt]').value) : null;
          t = FCT.decide(x.id,{action:'OVERRIDE', status:'resolved-overridden', reason:rsn, comment:cmt, optionLabel:o.label, amount:amt});
          effects = (o.effects||[]).map(e=> (e.amountKey && amt!=null)? Object.assign({},e,{v:e.sign?e.sign*amt:amt}) : e).concat([{add:'ai.overrides', v:1}]);
          msg = 'Overridden. Reason logged as training data';
        } else if(a==='ASSIGN'){
          const u=g('[data-usr]').value; t=FCT.decide(x.id,{action:'ASSIGN', status:'open', owner:u, comment:cmt}); x.owner=u;
          (S().notes.owner=S().notes.owner||{})[x.id]=u; msg=`Assigned to ${ui.who(u)}. Teams notification sent (simulated)`;
        } else if(a==='ESCALATE'){
          const tg=g('[data-tgt]').value; t=FCT.decide(x.id,{action:'ESCALATE', status:'escalated', target:tg, comment:cmt}); effects=x.onEscalate||[];
          msg=`Escalated to ${tg}. Case ${x.escalateCase||'ESC-'+(2026100+S().seq)} opened`;
        }
        FCT.applyEffects(effects, t); FCT.save();
        ui.toast(msg);
        render(); FCT.onChange && FCT.onChange();
      });
    }));
  }
  function render(){
    if(!current) return; const x=FCT.ex(current); const dr=document.querySelector('.drawer'); if(!dr) return;
    dr.innerHTML = drawerHTML(x); dr.querySelector('[data-dclose]').addEventListener('click', FCT.closeDrawer);
    wireBar(x, dr);
  }
  FCT.openDrawer = (id)=>{
    const x = FCT.ex(id); if(!x){ ui.toast('Record '+id+' is not part of this demo'); return; }
    const own=(S().notes.owner||{})[id]; if(own) x.owner=own;
    FCT.closeDrawer(true); current=id;
    const sc=document.createElement('div'); sc.className='scrim'; sc.addEventListener('click',()=>FCT.closeDrawer());
    const dr=document.createElement('aside'); dr.className='drawer'; dr.setAttribute('role','dialog'); dr.setAttribute('aria-modal','true'); dr.setAttribute('aria-label',x.title);
    document.body.appendChild(sc); document.body.appendChild(dr); render();
    const u=new URL(location.href); u.searchParams.set('x',id); history.replaceState(null,'',u);
    dr.querySelector('.drawer-x').focus();
  };
  FCT.closeDrawer = (silent)=>{
    document.querySelectorAll('.drawer,.scrim').forEach(e=>e.remove()); current=null;
    if(silent!==true){ const u=new URL(location.href); u.searchParams.delete('x'); history.replaceState(null,'',u); }
  };
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && current && !document.querySelector('.modal-wrap')) FCT.closeDrawer(); });

  /* global delegation: [data-x] opens drawer, [data-go] navigates, [data-more] expands table */
  document.addEventListener('click',e=>{
    const x=e.target.closest('[data-x]'); if(x && !e.target.closest('input,button:not([data-x]),a:not([data-x])')){ e.preventDefault(); const v=x.dataset.x; if(v.startsWith('#')||v.includes('.html')) location.href=FCT.href(v.replace(/^#\//,'')); else FCT.openDrawer(v.replace(/^\?x=/,'')); return; }
    const g=e.target.closest('[data-go]'); if(g && !e.target.closest('input,button,a')){ location.href=FCT.href(g.dataset.go); return; }
    const m=e.target.closest('[data-more]'); if(m){ const t=m.previousElementSibling.querySelector('table'); FCT.ui._expand = FCT.ui._expand||{}; FCT.ui._expand[m.dataset.more]=true; FCT._render&&FCT._render(); }
  });
  ui.max = (id, n)=> (FCT.ui._expand&&FCT.ui._expand[id]) ? 9999 : n;

  /* tabs helper: returns html; wire with ui.wireTabs(el, key, onChange) */
  ui.tabState = {};
  ui.tabs = (key, list, def)=>{ const cur = ui.tabState[key]||def||list[0][0]; return `<div class="tabs" data-tabs="${key}" role="tablist">${list.map(t=>`<button role="tab" class="${t[0]===cur?'on':''}" data-t="${t[0]}">${t[1]}${t[2]!=null?`<span class="n">${t[2]}</span>`:''}</button>`).join('')}</div>`; };
  ui.tab = (key, def)=> ui.tabState[key]||def;
  document.addEventListener('click',e=>{ const b=e.target.closest('[data-tabs] [data-t]'); if(!b) return; const k=b.closest('[data-tabs]').dataset.tabs; ui.tabState[k]=b.dataset.t; FCT._render&&FCT._render(); });
})();
