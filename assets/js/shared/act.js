/* FCT demo — the action layer for a single record (a document, line, journal, reconciliation or compliance item).
   Every screen that shows one record opens with an action bar: is action needed, what the AI recommends, who owns it, and a
   Resolve button that slides in the Resolve panel (the record-level counterpart of the Decide drawer used for cases).
   A record with no issue still offers "Take action" (flag for review, request a document, add a note, open an investigation).
   Resolutions are kept in the demo state (FCT.state.notes.res) and logged with the record.
   Classic script after the tower's UI kit and assets/js/shared/playbook.js; exposes window.FCTAct = { make, RES }. */
(function(){
  const RES = ()=>{ const S = window.FCT.state, n = S.notes = S.notes || {}; return n.res = n.res || {}; };
  const userName = (uid)=> ((window.FCT_DATA.users||[]).find(u=> u.id===uid)||{}).name || uid || '—';
  const KIND = { ctl:'Control breach', fin:'Financial', ops:'Operational' };

  const make = (P, cfg)=>{
    cfg = cfg || {};
    const { html, Icon } = P, FCT = window.FCT, { useState, useEffect, useRef, Fragment } = React;
    const amt = P.amt || ((v)=> FCT.amt(v));
    const issue = (c)=> (cfg.issue && cfg.issue(c)) || { name:c };
    const play = (c)=> window.FCTPlay? FCTPlay.get(cfg.tower, c) : { rec:'Review the record with its owner and record the outcome.', action:'Assign for review', owner:'PR' };
    const conf = (c)=>{ const k = issue(c).kind; return k==='fin'? 86 : k==='ctl'? 82 : 74; };

    /* the side panel; mode 'issue' resolves an anomaly, mode 'none' acts on a record with no issue */
    function Resolve({ q, onClose, onDone }){
      const none = !q.code, pl = none? { rec:'No control flagged this record. Act on it if something looks wrong to you.', action:'Flag for review', owner:'PR' } : play(q.code);
      const users = (window.FCT_DATA.users||[]).filter(u=> !/\(/.test(u.name));
      const OPTS = none? [ { id:'rec', label:'Flag for review', tag:'Most used', desc:'Send it to an owner to check, with a due date.' },
          { id:'doc', label:'Request a supporting document', desc:'Ask the owner for the document behind the record; the request is logged.' },
          { id:'note', label:'Add a note', desc:'Record an observation on the record without changing its status.' },
          { id:'case', label:'Open an investigation', desc:'Open a case so it is tracked with an exposure estimate and a decision.' } ]
        : [ { id:'rec', label:pl.action, tag:'Recommended', desc:pl.rec },
          { id:'assign', label:'Assign to an owner', desc:'Send it to an owner with a due date. It stays open until they close it.' },
          { id:'accept', label:'Accept as a valid exception', desc:'The record is right as it is. A reason is required, and the record leaves the open list.' },
          { id:'case', label:'Escalate to an investigation', desc:'Open a case so it is tracked with an exposure estimate and a decision.' } ];
      const [opt, setOpt] = useState('rec'), [owner, setOwner] = useState(pl.owner), [due, setDue] = useState('3'), [note, setNote] = useState(''), ref = useRef(null);
      useEffect(()=>{ const k = (e)=>{ if(e.key==='Escape'){ e.stopPropagation(); onClose(); } }; document.addEventListener('keydown', k, true); const t = setTimeout(()=> ref.current && ref.current.focus(), 30);
        return ()=>{ document.removeEventListener('keydown', k, true); clearTimeout(t); }; }, []);
      const o = OPTS.find(x=> x.id===opt), dueL = { '0':'today', '3':'in 3 days', '7':'in 7 days' }[due], needNote = opt==='accept' || opt==='note';
      const go = ()=>{ if(needNote && !note.trim()){ FCT.ui && FCT.ui.toast && FCT.ui.toast(opt==='note'? 'Write the note first' : 'Give the reason before accepting the exception'); return; }
        const label = opt==='assign'? 'Assigned to '+userName(owner) : opt==='rec' && none? 'Flagged for review by '+userName(owner) : o.label;
        if(opt!=='note') RES()[q.id] = { opt, label, owner, due: opt==='accept'? null : dueL, note:note.trim(), at:FCT.nowLabel(), by:'PR', code:q.code||null, tower:cfg.towerName||null, label2:q.label||q.id, ent:q.ent||'', issue:q.code? issue(q.code).name : 'No issue raised' };
        FCT.applyEffects([{ event:(q.label||q.id)+(q.code? ' ('+issue(q.code).name.toLowerCase()+')' : '')+': '+label+(note.trim()? ' · '+note.trim() : ''), tower:cfg.towerName||'FCT' }]); FCT.save();
        FCT.ui && FCT.ui.toast && FCT.ui.toast((q.label||q.id)+': '+label.toLowerCase()); onDone(); };
      const c = q.ctx;
      return html`<${Fragment}><div class="scrim rs-scrim" onClick=${onClose}/>
        <aside class="drawer rs" role="dialog" aria-modal="true" aria-label=${(none? 'Act on ' : 'Resolve ')+(q.label||q.id)}>
          <div class="drawer-h"><button ref=${ref} type="button" class="drawer-x" aria-label="Close" onClick=${onClose}>×</button>
            <div class="meta"><span class="rs-pill">${none? 'Take action' : 'Resolve'}</span><span>${q.label||q.id}</span>${q.theme && html`<span>· ${q.theme}</span>`}</div>
            <h2>${none? 'No issue raised on this record' : issue(q.code).name}</h2><div class="subj">${q.ent||''}${q.val? ' · '+amt(q.val) : ''}</div></div>
          <div class="drawer-b">
            <section class="rs-ai"><h3>AI recommendation${none? '' : html` <span class="faint">· ${conf(q.code)}% confidence</span>`}</h3><p>${pl.rec}</p>
              <ul>${c && c.atRec!=null && html`<li>${FCT.n(c.atRec)} record${c.atRec===1? '' : 's'} with this issue at this ${c.n1}</li>`}${c && c.same!=null && html`<li>${FCT.n(c.same)} across ${FCT.n(c.nEnt)} ${c.nP} in the current scope</li>`}
                ${(q.codes||[]).length>1 && html`<li>Also on this record: ${q.codes.filter(x=> x!==q.code).map(x=> issue(x).name).join('; ')}</li>`}<li>Suggested owner: ${userName(pl.owner)}</li></ul></section>
            <section><h3>What do you want to do?</h3><div class="rs-opts" role="radiogroup" aria-label="Action">${OPTS.map(x=> html`<label key=${x.id} class=${'rs-opt'+(opt===x.id? ' on' : '')}>
              <input type="radio" name="rs-opt" value=${x.id} checked=${opt===x.id} onChange=${()=> setOpt(x.id)}/>
              <span><b>${x.label}</b>${x.tag && html`<em>${x.tag}</em>`}<small>${x.desc}</small></span></label>`)}</div></section>
            ${opt!=='accept' && opt!=='note' && html`<section class="rs-row"><label><span>Owner</span><select value=${owner} onChange=${(e)=> setOwner(e.target.value)}>${users.map(u=> html`<option key=${u.id} value=${u.id}>${u.name} · ${u.role}</option>`)}</select></label>
              <label><span>Due</span><select value=${due} onChange=${(e)=> setDue(e.target.value)}><option value="0">Today</option><option value="3">In 3 days</option><option value="7">In 7 days</option></select></label></section>`}
            <section><h3>${opt==='accept'? 'Reason (required)' : opt==='note'? 'Note (required)' : 'Note (optional)'}</h3><textarea rows="3" value=${note} onInput=${(e)=> setNote(e.target.value)} placeholder=${opt==='accept'? 'Why the record is correct as it is' : 'Anything the owner should know'}></textarea></section></div>
          <div class="drawer-f rs-f"><button type="button" class="btn" onClick=${onClose}>Cancel</button><button type="button" class="btn primary" onClick=${go}>${opt==='assign'? 'Assign' : opt==='accept'? 'Accept exception' : opt==='case'? (none? 'Open investigation' : 'Escalate') : opt==='doc'? 'Request document' : opt==='note'? 'Save note' : none? 'Flag for review' : 'Resolve'}</button></div></aside></${Fragment}>`;
    }

    /* the action bar at the top of a record: status, recommendation, owner, and the buttons to act */
    function ActionBar({ id, codes, label, ent, val, ex, cases, onCase, ctx, theme }){
      const [open, setOpen] = useState(false), [, bump] = useState(0), res = RES()[id];
      const cs = (codes||[]).filter(Boolean), code = cs[0] || null, pl = code? play(code) : null, x = ex && FCT.ex && FCT.ex(ex);
      const q = { id, code, codes:cs, label, ent, val, ctx, theme };
      return html`<section class=${'px-dec act'+(res || !code? '' : ' need')} aria-label="Action on this record">
        <div class="px-dec-h"><span class="px-dec-st">${res? 'Resolved' : code? 'Action needed' : 'No issue raised'}</span>
          ${cs.map(c=> html`<span key=${c} class=${'px-pill act-k k-'+(issue(c).kind||'ops')}>${issue(c).name}</span>`)}
          <span class="faint act-o">${res? res.label+' · '+userName(res.by)+' · '+res.at+(res.due? ' · due '+res.due : '') : code? 'Owner '+userName(pl.owner)+' · resolve within 3 days' : 'Nothing flagged by the controls'}</span></div>
        <div class="px-dec-b"><div class="px-dec-r"><span class="l">${code? 'AI recommendation' : 'What you can do'}</span><p>${code? pl.rec : 'No control flagged this record. If something looks wrong, flag it for review, request a document, add a note or open an investigation.'}</p>
            ${code && html`<dl><div><dt>Recommended action</dt><dd>${pl.action}</dd></div><div><dt>Confidence</dt><dd>${conf(code)}%</dd></div><div><dt>Type</dt><dd>${KIND[issue(code).kind]||'Operational'}</dd></div>${val? html`<div><dt>Value</dt><dd>${amt(val)}</dd></div>` : ''}</dl>`}
            ${res && res.note && html`<p class="faint act-note"><b>Note.</b> ${res.note}</p>`}</div>
          <div class="px-dec-a">${res? html`<button type="button" class="btn sm" onClick=${()=>{ delete RES()[id]; FCT.save(); bump(n=> n+1); }}>Reopen</button>`
              : html`<button type="button" class="btn primary" onClick=${()=> setOpen(true)}><${Icon} n="Check" size=${15}/>${code? 'Resolve' : 'Take action'}</button>`}
            ${x && html`<div class="act-ex"><span>Shared decision <b>${ex}</b></span><${P.Decide} id=${ex}/></div>`}
            ${(cases||[]).map(c=> html`<button key=${c.id} type="button" class="btn sm" onClick=${()=> onCase && onCase(c.id)}>Open case ${c.id}: ${c.name}</button>`)}
            <small class="faint">${res? 'Logged with this record.' : 'Opens the side panel: choose the action, owner and due date; it is logged with this record.'}</small></div></div>
        ${open && ReactDOM.createPortal(html`<${Resolve} q=${q} onClose=${()=> setOpen(false)} onDone=${()=>{ setOpen(false); bump(n=> n+1); }}/>`, document.body)}</section>`;
    }
    return { ActionBar, Resolve, RES, userName };
  };
  window.FCTAct = { make, RES, userName };
})();
