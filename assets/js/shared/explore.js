/* FCT demo — "Break it down further": the component view's analysis card, shared by every tower's control tower.
   One card: parameter tabs across the top (every breakdown the KPI has), the exception themes as chips, then
     themes × parameter (stacked bars) · theme mix (donut) · themes by month (when the records carry a month).
   A theme chip, a bar or a donut slice filters the records below; the filters show as tags that can be removed one by one.
   The records are drawn by the tower (renderRecords), top 8 of each table.
   Classic script after the tower's UI kit and model; exposes window.FCTExplore = { make }. */
(function(){
  const make = (P, M, cfg)=>{
    cfg = cfg || {};
    const { html, R, COL, Icon } = P, FCT = window.FCT, { useState, useEffect, Fragment } = React;
    const amt = P.amt || ((v)=> P.cr(v)), pct = P.pct || ((v,d)=> FCT.pct(v,d));
    const PAL = [COL.crit, COL.high, '#D9B65A', '#4FB3A3', '#7FA7D9', '#B58BD9', '#C98C6B', '#8FA39E', '#6FA06A', '#D97FA6'];
    const label = (dim, k)=>{ try{ const l = M.dimLabel(dim, k); return l==null || l===''? String(k) : String(l); }catch(e){ return String(k); } };
    const dimName = (d)=> (M.dimName||{})[d] || d;
    const lc1 = (s)=> /^[A-Z][a-z]/.test(s)? s[0].toLowerCase()+s.slice(1) : s;
    const short = (s, n)=> s.length>n? s.slice(0, n-1)+'…' : s;
    const sum = (a)=> a.reduce((t,x)=> t+(x.val||0), 0);

    /* the exceptions grouped two ways; rows past the top eight fold into "Others" */
    const cross = (bad, tk, V, dim, themes, keep)=>{
      const by = {}; bad.forEach(x=>{ const k = x.g[dim]==null? '—' : x.g[dim]; const r = by[k] = by[k] || { key:k, n:0, val:0, t:{} }; r.n++; r.val += V(x); const t = tk(x); r.t[t] = (r.t[t]||0)+1; });
      let rows = Object.values(by).sort((a,b)=> b.n-a.n || b.val-a.val);
      if(rows.length > keep){ const rest = rows.slice(keep), o = { key:'__o', n:0, val:0, t:{}, other:rest.length }; rest.forEach(r=>{ o.n += r.n; o.val += r.val; Object.keys(r.t).forEach(t=> o.t[t] = (o.t[t]||0)+r.t[t]); }); rows = rows.slice(0, keep).concat([o]); }
      return rows.map(r=> Object.assign(r, { name: r.key==='__o'? 'Others ('+r.other+')' : label(dim, r.key) }, ...themes.map(t=> ({ ['t_'+t.i]: r.t[t.key]||0 }))));
    };

    function Explore({ id, facts, exclude, onDrill, renderRecords, title }){
      const rate = M.isRate? M.isRate(id) : true;
      const dims = ((M.dims||{})[id]||[]).filter(d=> !(exclude||[]).includes(d));
      const tf = (cfg.themeOf||{})[id];   /* a tower can name the theme with a function instead of a dimension */
      const themeDim = tf? null : dims.length>1? ((cfg.theme||{})[id] && dims.includes(cfg.theme[id])? cfg.theme[id] : dims[0]) : null;
      const V = (cfg.noVal||{})[id]? ()=> 0 : (x)=> x.val||0;   /* count-only KPIs (tasks) carry no amount */
      const tk = (x)=> tf? tf.fn(x) : themeDim? x.g[themeDim] : '_', tDim = tf? tf.name : themeDim? dimName(themeDim) : 'Theme';
      const params = dims.filter(d=> d!==themeDim);
      const [tab, setTab] = useState(params[0]), dim = params.includes(tab)? tab : params[0];
      const [fT, setFT] = useState(null), [fP, setFP] = useState(null), [meas, setMeas] = useState('n');
      useEffect(()=>{ setFT(null); setFP(null); }, [id, facts.length]);
      const bad = rate? facts.filter(x=> x.ok===false) : facts;
      const tby = {}; bad.forEach(x=>{ const k = tk(x); const r = tby[k] = tby[k] || { key:k, n:0, val:0 }; r.n++; r.val += V(x); });
      const themes = Object.values(tby).sort((a,b)=> b.n-a.n).map((t,i)=> Object.assign(t, { i, color:PAL[i % PAL.length], name: tf? String(t.key) : themeDim? label(themeDim, t.key) : 'Exceptions' }));
      const tOf = (k)=> themes.find(t=> t.key===k);
      const rows = dim? cross(bad, tk, V, dim, themes, 8) : [];
      const all = {}; if(rate && dim) facts.forEach(x=>{ const k = x.g[dim]; const r = all[k] = all[k] || { n:0, ok:0 }; r.n++; if(x.ok!==false) r.ok++; });
      const rateOf = (k)=> all[k] && all[k].n? all[k].ok/all[k].n*100 : null, overall = rate && facts.length? (facts.length-bad.length)/facts.length*100 : null;
      const months = facts.some(x=> x.g.month!=null)? [...new Set(bad.map(x=> x.g.month))].filter(m=> m!=null).sort((a,b)=> a>b? 1 : -1) : [];
      const mrows = months.map(m=>{ const xs = bad.filter(x=> x.g.month===m), r = { name:label('month', m) }; themes.forEach(t=> r['t_'+t.i] = xs.filter(x=> tk(x)===t.key).length); return r; });
      const shown = facts.filter(x=> (!fT || (x.ok===false && tk(x)===fT)) && (!fP || (fP.key==='__o'? !fP.top.has(x.g[fP.dim]) : x.g[fP.dim]===fP.key)));
      const tTop = themes[0], rTop = rows.filter(r=> r.key!=='__o')[0], badVal = bad.reduce((t,x)=> t+V(x), 0);
      const toggleT = (k)=> setFT(fT===k? null : k), toggleP = (k)=> setFP(fP && fP.key===k && fP.dim===dim? null : { dim, key:k, name: k==='__o'? 'Others' : label(dim, k), top:new Set(rows.filter(r=> r.key!=='__o').map(r=> r.key)) });
      const tagBar = html`<div class="xp-tags" role="group" aria-label="Filters on the records below">
        <span class="l">Showing</span>${!fT && !fP? html`<span class="xp-tag all">All records</span>` : ''}
        ${fT && html`<button type="button" class="xp-tag" onClick=${()=> setFT(null)} aria-label=${'Remove filter '+tOf(fT).name}><i style=${{ background:tOf(fT).color }}/>${tDim}: ${tOf(fT).name}<${Icon} n="X" size=${12}/></button>`}
        ${fP && html`<button type="button" class="xp-tag" onClick=${()=> setFP(null)} aria-label=${'Remove filter '+fP.name}>${dimName(fP.dim)}: ${fP.name}<${Icon} n="X" size=${12}/></button>`}
        ${(fT || fP) && html`<button type="button" class="px-link sm" onClick=${()=>{ setFT(null); setFP(null); }}>Clear all</button>`}
        <span class="n faint">${FCT.n(shown.length)} of ${FCT.n(facts.length)} records${fT || fP? '' : ', exceptions first'}</span>
        ${fP && fP.key!=='__o' && onDrill && html`<button type="button" class="btn sm" onClick=${()=> onDrill(fP.dim, fP.key)}>Open ${fP.name} as a view<${Icon} n="ChevronRight" size=${13}/></button>`}</div>`;
      if(!bad.length) return html`<${Fragment}><${P.Card} title=${title || 'Break it down further'} sub="No exceptions in this view."><p class="faint" style=${{margin:0}}>Every record passes this check.</p></${P.Card}>${renderRecords(facts, tagBar)}</${Fragment}>`;
      const Tip = ({ active, payload, label:l })=> active && payload && payload.length? html`<div class="px-ctip"><div class="h">${l}</div>${payload.filter(p=> p.value).map(p=> html`<div key=${p.dataKey} class="r"><span><i class="xp-dot" style=${{ background:p.color }}/>${p.name}</span><b>${FCT.n(p.value)}</b></div>`)}</div>` : null;
      const dimmed = (t)=> fT && fT!==t.key;
      return html`<${Fragment}><section class="px-kc xp" aria-label=${title || 'Break it down further'}>
        <header class="xp-h"><div><h3>${title || 'Break it down further'}</h3><p class="faint">${rate? FCT.n(bad.length)+' of '+FCT.n(facts.length)+' records fail this check'+(badVal? ' · '+amt(badVal)+' affected' : '')+' · pass rate '+pct(overall) : FCT.n(facts.length)+' records'}. Select a theme, bar or slice to filter the records below.</p></div>
          ${params.length>0 && html`<nav class="xp-tabs" aria-label="Break down by">${params.map(d=> html`<button key=${d} type="button" class=${d===dim? 'on' : ''} aria-pressed=${d===dim} onClick=${()=> setTab(d)}>${dimName(d)}</button>`)}</nav>`}</header>
        <div class="xp-themes" role="group" aria-label=${tDim+': select to filter'}>${themes.map(t=> html`<button key=${String(t.key)} type="button" class=${'xp-th'+(fT===t.key? ' on' : '')+(dimmed(t)? ' dim' : '')} aria-pressed=${fT===t.key} onClick=${()=> toggleT(t.key)}>
          <span class="nm"><i style=${{ background:t.color }}/>${t.name}</span><b class="num">${FCT.n(t.n)}</b><small>${pct(t.n/bad.length*100,0)} of exceptions${t.val? ' · '+amt(t.val) : ''}</small><span class="bar"><em style=${{ width:(t.n/themes[0].n*100)+'%', background:t.color }}/></span></button>`)}</div>
        ${P.AI && html`<${P.AI}>${tTop.name} is ${pct(tTop.n/bad.length*100,0)} of the exceptions${tTop.val? ' ('+amt(tTop.val)+')' : ''}.${rTop? ' '+label(dim, rTop.key)+' carries '+pct(rTop.n/bad.length*100,0)+' of them'+(rate && rateOf(rTop.key)!=null? ', with a pass rate of '+pct(rateOf(rTop.key))+' against '+pct(overall)+' overall' : '')+'.' : ''}</${P.AI}>`}
        <div class=${'xp-viz'+(mrows.length>1? ' three' : '')}>
          ${dim && html`<div class="xp-p wide"><div class="xp-ph"><h4>${tf || themeDim? tDim : 'Exceptions'} by ${lc1(dimName(dim))}</h4><span class="faint">Records; select a bar to filter</span></div>
            <div style=${{ height: Math.max(170, rows.length*30 + 30) }}><${R.ResponsiveContainer} width="100%" height="100%">
              <${R.BarChart} data=${rows} layout="vertical" margin=${{ top:4, right:44, left:6, bottom:4 }} barCategoryGap=${6}>
                <${R.XAxis} type="number" hide=${true}/><${R.YAxis} type="category" dataKey="name" width=${Math.min(260, 24 + 6.6*Math.max(8, ...rows.map(r=> r.name.length)))} tick=${{ fill:'var(--px-ink2)', fontSize:11.5 }} tickLine=${false} axisLine=${false}/>
                <${R.Tooltip} cursor=${{ fill:'color-mix(in srgb, var(--px-ink) 6%, transparent)' }} content=${h2(Tip)}/>
                ${themes.map((t,i)=> html`<${R.Bar} key=${t.i} dataKey=${'t_'+t.i} name=${t.name} stackId="a" fill=${t.color} fillOpacity=${dimmed(t)? .18 : .9} isAnimationActive=${false} style=${{ cursor:'pointer' }}
                  onClick=${(d)=> toggleP(d.key)} radius=${i===themes.length-1? [0,3,3,0] : 0}>
                  ${i===themes.length-1 && html`<${R.LabelList} dataKey="n" position="right" style=${{ fill:'var(--px-ink2)', fontSize:11 }} formatter=${(v)=> FCT.n(v)}/>`}</${R.Bar}>`)}
              </${R.BarChart}></${R.ResponsiveContainer}></div>
            ${rate && html`<div class="xp-rates">${rows.filter(r=> r.key!=='__o').slice(0,8).map(r=>{ const rr = rateOf(r.key), on = fP && fP.key===r.key && fP.dim===dim;
              return html`<button key=${String(r.key)} type="button" class=${'xp-rate'+(on? ' on' : '')} onClick=${()=> toggleP(r.key)} title=${label(dim, r.key)+': pass rate '+pct(rr)}>
                <span class="nm">${label(dim, r.key)}</span><span class=${'v num'+(rr!=null && overall!=null && rr < overall? ' bad' : '')}>${pct(rr)}</span><small>${FCT.n(all[r.key].n)} records${r.val? ' · '+amt(r.val) : ''}</small></button>`; })}</div>`}</div>`}
          <div class="xp-p"><div class="xp-ph"><h4>Theme mix</h4><${P.Seg} label="Measure" value=${meas} onChange=${setMeas} options=${[['n','Count'],['val','Value']]}/></div>
            <div class="xp-donut"><${R.ResponsiveContainer} width="100%" height=${190}><${R.PieChart}>
              <${R.Pie} data=${themes} dataKey=${meas} nameKey="name" innerRadius=${56} outerRadius=${82} paddingAngle=${2} isAnimationActive=${false} onClick=${(d)=> toggleT(d.key)} style=${{ cursor:'pointer' }}>
                ${themes.map(t=> html`<${R.Cell} key=${t.i} fill=${t.color} fillOpacity=${dimmed(t)? .2 : .92} stroke="var(--card, var(--surface))"/>`)}</${R.Pie}>
              <${R.Tooltip} formatter=${(v)=> meas==='val'? amt(v) : FCT.n(v)}/></${R.PieChart}></${R.ResponsiveContainer}>
              <div class="c"><b class="num">${meas==='val'? amt(badVal) : FCT.n(bad.length)}</b><span>${rate? 'exceptions' : 'records'}</span></div></div>
            <ul class="xp-lg">${themes.slice(0,6).map(t=> html`<li key=${String(t.key)}><button type="button" class=${fT===t.key? 'on' : ''} onClick=${()=> toggleT(t.key)}><i style=${{ background:t.color }}/><span>${t.name}</span><b class="num">${meas==='val'? amt(t.val) : pct(t.n/bad.length*100,0)}</b></button></li>`)}</ul></div>
          ${mrows.length>1 && html`<div class="xp-p"><div class="xp-ph"><h4>When they happened</h4><span class="faint">Exceptions by month</span></div>
            <div style=${{ height:230 }}><${R.ResponsiveContainer} width="100%" height="100%"><${R.BarChart} data=${mrows} margin=${{ top:8, right:6, left:-18, bottom:0 }}>
              <${R.CartesianGrid} stroke=${COL.grid} vertical=${false}/><${R.XAxis} dataKey="name" ...${P.axis}/><${R.YAxis} ...${P.axis} allowDecimals=${false}/>
              <${R.Tooltip} cursor=${{ fill:'color-mix(in srgb, var(--px-ink) 6%, transparent)' }} content=${h2(Tip)}/>
              ${themes.map((t,i)=> html`<${R.Bar} key=${t.i} dataKey=${'t_'+t.i} name=${t.name} stackId="m" fill=${t.color} fillOpacity=${dimmed(t)? .18 : .9} isAnimationActive=${false} radius=${i===themes.length-1? [3,3,0,0] : 0}/>`)}
            </${R.BarChart}></${R.ResponsiveContainer}></div></div>`}
        </div></section>
        ${renderRecords(shown, tagBar)}</${Fragment}>`;
    }
    const h2 = (C)=> (props)=> React.createElement(C, props);
    return { Explore };
  };
  window.FCTExplore = { make };
})();
