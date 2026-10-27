/* FCT demo — Map analytics card shared by every tower (manifest: data/manifests/maps/map-analytics.md).
   First built for O2C Customer profiles; generalised so P2P, SC, R2R and Compliance plug in their own records.
   Three tiers scope the map and the tower's control tower: Risk (multi-select), Geography (one region), and a tower segment.
   Classic script after the tower's UI kit; exposes window.FCTMap = { MapCard, MapSearch, places }.

   MapCard props
     P       tower UI kit (html, Card, Empty, Table, BarList, AI, RiskTag, RISK, load, store, Icon)
     items   records under the ribbon filter: [{ id, name, geo:{ city, region, lat, lng }, cat, score, seg, val, sub? }]
     cats    risk categories, worst first · regions  geography tiles, in display order · segs [{ id, desc }]
     scope   { pRisk, pGeo, pSeg } · setScope(o)
     noun / nounPl ('customer' / 'customers') · valShort ('open AR') · valName ('Open AR')
     fmt     value formatter · basis   sentence on what the value means (period or snapshot)
     segLabel tier-3 label · riskLabel optional legend word for the colour ('approved risk')
     onOpen(id) · onGroup(dim, key, label, risks) · found { id, t } from search · resetKey (ribbon filter key)
     storeKey localStorage key for the grouped / individual toggle */
(function(){
  const cssColor = (v)=>{
    const host = document.querySelector('.px-root') || document.body, probe = document.createElement('span');
    probe.style.color = v; host.appendChild(probe); const c = getComputedStyle(probe).color; probe.remove(); return c; };
  const esriLayers = (dark)=>{
    const base = dark? 'Canvas/World_Dark_Gray_Base' : 'Canvas/World_Light_Gray_Base', ref = dark? 'Canvas/World_Dark_Gray_Reference' : 'Canvas/World_Light_Gray_Reference';
    const url = (id)=> 'https://server.arcgisonline.com/ArcGIS/rest/services/'+id+'/MapServer/tile/{z}/{y}/{x}', opt = { attribution:'Tiles &copy; Esri', maxZoom:16, minZoom:2 };
    return [L.tileLayer(url(base), opt), L.tileLayer(url(ref), opt)]; };
  /* deterministic city for a record: a city of the region, picked from the id (stable across reloads) */
  const hash = (s)=>{ let h = 0; for(const ch of String(s)) h = (h*31 + ch.charCodeAt(0)) >>> 0; return h; };
  const placeFor = (id, region, places)=>{ const ps = (places || (window.FCT_DATA||{}).places || {})[region]; if(!ps || !ps.length) return null; const p = ps[hash(id) % ps.length]; return { city:p.city, region, lat:p.lat, lng:p.lng }; };

  /* tile counts for the three tiers, cross-filtered: risk counts inside the chosen geography and segment, geography inside the chosen
     risks and segment, segment inside the chosen risks and geography. Shared by the map card and any page-level lens bar. */
  const tiers = (items, cats, regions, segs, scope)=>{
    const riskOn = scope.pRisk && scope.pRisk!=='All'? scope.pRisk.split(',') : null, geo = scope.pGeo || 'All', seg = scope.pSeg || 'All';
    const all = items.filter(v=> v.geo), base = all.filter(v=> seg==='All' || v.seg===seg);
    const riskCount = {}; cats.forEach(c=> riskCount[c] = base.filter(v=> v.cat===c).length);
    const avail = cats.filter(c=> riskCount[c]>0), risks = (riskOn || avail).filter(c=> avail.includes(c)), allRisks = !riskOn || risks.length===avail.length;
    const inGeo = (v)=> geo==='All' || v.geo.region===geo, inRisk = (v)=> risks.includes(v.cat);
    const tile = (list)=> ({ n:list.length, val:list.reduce((t,v)=> t + (v.val||0), 0) });
    const rT = { All:tile(base.filter(inGeo)) }; cats.forEach(c=> rT[c] = tile(base.filter(v=> inGeo(v) && v.cat===c)));
    const gT = { All:tile(base.filter(inRisk)) }; regions.forEach(r=> gT[r] = tile(base.filter(v=> inRisk(v) && v.geo.region===r)));
    const sT = { All:tile(all.filter(v=> inGeo(v) && inRisk(v))) }; segs.forEach(g=> sT[g.id] = tile(all.filter(v=> inGeo(v) && inRisk(v) && v.seg===g.id)));
    return { riskOn, geo, seg, all, base, riskCount, avail, risks, allRisks, inGeo, inRisk, rT, gT, sT, shown:base.filter(v=> inRisk(v) && inGeo(v)) }; };
  /* risk tiles: All isolates nothing; the first pick isolates one category; later picks add or remove; picking every category resets */
  const nextRisk = (T, id)=>{ if(!T.riskCount[id]) return T.riskOn; const next = T.allRisks? [id] : T.risks.includes(id)? T.risks.filter(x=> x!==id) : T.risks.concat(id);
    return !next.length || next.length===T.avail.length? null : next; };

  function MapCard(props){
    const { P, items, cats, regions, segs, scope, setScope, noun, nounPl, valShort, valName, fmt, basis, segLabel, riskLabel, onOpen, onGroup, found, resetKey, storeKey } = props;
    const { html } = P, { useState, useEffect, useRef, Fragment } = React, FCT = window.FCT, pct = (v,d)=> FCT.pct(v,d);
    const a1 = (w)=> (/^[aeiou]/i.test(w)? 'an ' : 'a ')+w;
    const AI = P.AI || (({ children })=> html`<p class="px-ai"><i>${children}</i></p>`);
    const host = useRef(null), mapRef = useRef(null), layerRef = useRef(null);
    const riskOn = scope.pRisk && scope.pRisk!=='All'? scope.pRisk.split(',') : null, geo = scope.pGeo || 'All', seg = scope.pSeg || 'All';
    const setRiskOn = (x)=> setScope({ pRisk: x? x.join(',') : 'All' }), setGeo = (x)=> setScope({ pGeo:x }), setSeg = (x)=> setScope({ pSeg:x });
    const [cityKey, setCityKey] = useState(null), [asTable, setAsTable] = useState(false);
    useEffect(()=>{ setCityKey(null); }, [resetKey]);
    /* selection can be owned by the page (selId / onSel), so the map, a chart and a list share one selected record */
    const [hit0, setHit0] = useState(null), hit = props.onSel? props.selId || null : hit0, setHit = props.onSel || setHit0, [each, setEach0] = useState(()=> P.load(storeKey||'mapEach', !!props.eachDefault));
    const setEach = (x)=>{ setEach0(x); P.store(storeKey||'mapEach', x); setCityKey(null); if(!x) setHit(null); };
    const hitRef = useRef(null); hitRef.current = hit;
    const byId = {}; items.forEach(v=> byId[v.id] = v);
    /* a record found by search: clear the tiles, select its city, fly there and mark it in the list */
    useEffect(()=>{ const v = found && byId[found.id]; if(!v || !v.geo) return;
      setScope({ pRisk:'All', pGeo:'All', pSeg:'All' }); setAsTable(false); setHit(v.id); setCityKey(v.geo.region+'|'+v.geo.city);
      const t = setTimeout(()=>{ const map = mapRef.current; if(map) map.flyTo([v.geo.lat, v.geo.lng], 7, { duration:.7 });
        const card = host.current && host.current.closest('.px-cmap-card'); if(card) card.scrollIntoView({ behavior:'smooth', block:'start' }); }, 120);
      return ()=> clearTimeout(t); }, [found && found.t]);
    const T = tiers(items, cats, regions, segs, scope), { riskCount, avail, risks, allRisks, rT, gT, sT, shown } = T;
    const drill = (dim, key, label)=> onGroup && onGroup(dim, key, label, allRisks? null : risks.slice());
    const byCity = {};
    shown.forEach(v=>{ const k = v.geo.region+'|'+v.geo.city;
      const g = byCity[k] || (byCity[k] = { key:k, city:v.geo.city, region:v.geo.region, lat:v.geo.lat, lng:v.geo.lng, recs:[], val:0, mix:{} });
      g.recs.push(v); g.val += v.val||0; g.mix[v.cat] = (g.mix[v.cat]||0)+1; });
    const cities = Object.values(byCity).map(g=>{ g.parts = cats.filter(c=> g.mix[c]).map(c=> ({ cat:c, n:g.mix[c] })); g.recs.sort((a,b)=> (b.score||0)-(a.score||0)); return g; })
      .sort((a,b)=> b.val-a.val || b.recs.length-a.recs.length);
    const sel = cities.find(g=> g.key===cityKey) || null;
    const sig = cities.map(g=> [g.key, g.recs.length, g.val.toFixed(2), g.parts.map(p=> p.cat+p.n).join('.')].join(':')).join('|');
    const empty = !shown.length;
    const focusCity = (g)=>{ setCityKey(g.key); const map = mapRef.current; if(map) map.flyTo([g.lat, g.lng], Math.min(8, Math.max(map.getZoom(), 6)), { duration:.55 }); };
    useEffect(()=>{
      if(asTable || empty){ if(mapRef.current){ mapRef.current.remove(); mapRef.current = null; layerRef.current = null; } return; }
      if(mapRef.current || !host.current || !window.L) return;
      /* locked map: only the tiles, the side panel, search and the markers move it */
      const map = L.map(host.current, { zoomControl:false, minZoom:2, maxZoom:16, worldCopyJump:true, dragging:false, scrollWheelZoom:false, doubleClickZoom:false, touchZoom:false, boxZoom:false, keyboard:false }).setView([22.5, 79], 4);
      map.attributionControl.setPrefix(false);
      const paint = ()=>{ const dark = !document.body.classList.contains('theme-light'), key = dark? 'dark' : 'light'; if(map._fctUrl===key) return;
        (map._fctTiles||[]).forEach(l=> map.removeLayer(l)); map._fctUrl = key; map._fctTiles = esriLayers(dark); map._fctTiles.forEach(l=> l.addTo(map)); };
      paint(); const obs = new MutationObserver(paint); obs.observe(document.body, { attributes:true, attributeFilter:['class'] });
      mapRef.current = map; layerRef.current = L.layerGroup().addTo(map);
      const kick = ()=> map.invalidateSize(); kick(); const t = setTimeout(kick, 180); window.addEventListener('resize', kick);
      return ()=>{ clearTimeout(t); window.removeEventListener('resize', kick); obs.disconnect(); map.remove(); mapRef.current = null; layerRef.current = null; };
    }, [asTable, empty]);
    useEffect(()=>{
      const map = mapRef.current, layer = layerRef.current; if(!map || !layer || asTable || empty) return;
      layer.clearLayers();
      const maxV = Math.max(...cities.map(g=> g.val), 0.01), colors = {}; cats.forEach(c=> colors[c] = cssColor(P.RISK[c]));
      if(each){ const maxC = Math.max(...shown.map(v=> v.val||0), 0.01);
        cities.forEach(g=>{ const n = g.recs.length;
          g.recs.forEach((v,i)=>{ const d = Math.round(14 + Math.sqrt((v.val||0)/maxC)*18);
            const rad = n<2? 0 : 12 + n*3.2, ang = 2*Math.PI*i/Math.max(n,1) - Math.PI/2, dx = Math.cos(ang)*rad, dy = Math.sin(ang)*rad, on = hit===v.id;
            const icon = L.divIcon({ className:'leaflet-div-icon px-cmap-dot'+(on?' on':''), iconSize:[d,d], iconAnchor:[d/2 - dx, d/2 - dy], html:'<span style="background:'+colors[v.cat]+'"></span>' });
            const m = L.marker([g.lat, g.lng], { icon, keyboard:true, title:v.name, zIndexOffset: on? 1000 : Math.round(30-d) }); m._cityKey = g.key; m._vid = v.id;
            m.bindTooltip('<strong>'+FCT.esc(v.name)+'</strong><br>'+FCT.esc(v.id)+' · '+FCT.esc(g.city)+'<br>'+FCT.esc(v.cat)+(v.score!=null? ' '+v.score : '')+' · '+FCT.esc(fmt(v.val||0))+' '+FCT.esc(valShort)+'<br><span class="faint">'+(hit===v.id? 'Click again to open the profile' : 'Click to select; click again to open the profile')+'</span>', { direction:'top', offset:[dx, dy - d/2 - 2], opacity:1, className:'px-cmap-tip' });
            m.on('mousedown', (e)=>{ L.DomEvent.stop(e); if(hitRef.current===v.id) onOpen(v.id); else { setHit(v.id); setCityKey(g.key); } });
            m.addTo(layer); }); });
      } else cities.forEach(g=>{
        const d = Math.round(26 + Math.sqrt(g.val/maxV)*16), tot = g.parts.reduce((s,p)=> s+p.n, 0); let acc = 0;
        const stops = g.parts.map(p=>{ const a = acc/tot*360; acc += p.n; return colors[p.cat]+' '+a.toFixed(1)+'deg '+(acc/tot*360).toFixed(1)+'deg'; }).join(','), h = d + 11;
        const icon = L.divIcon({ className:'leaflet-div-icon px-cmap-pin'+(cityKey===g.key?' on':''), iconSize:[d, h], iconAnchor:[d/2, h-1],
          html:'<span class="seal" style="width:'+d+'px"><span class="name">'+FCT.esc(g.city)+'</span><span class="head" style="width:'+d+'px;height:'+d+'px;background:conic-gradient('+stops+')"><span class="well"><em>'+g.recs.length+'</em></span></span><span class="stem"></span></span>' });
        const marker = L.marker([g.lat, g.lng], { icon, keyboard:true, title:g.city, zIndexOffset: cityKey===g.key? 1000 : Math.round(40-d) }); marker._cityKey = g.key;
        marker.bindTooltip('<strong>'+FCT.esc(g.city)+'</strong><br>'+FCT.esc(g.region)+' · '+g.recs.length+' '+FCT.esc(g.recs.length===1? noun : nounPl)+'<br>'+FCT.esc(fmt(g.val))+' '+FCT.esc(valShort)+'<br>'+FCT.esc(g.parts.map(p=> p.cat+' '+p.n).join(' · ')),
          { direction:'top', offset:[0, -h-4], opacity:1, className:'px-cmap-tip' });
        marker.on('click', ()=>{ setHit(null); setCityKey(k=> k===g.key? null : g.key); }); marker.addTo(layer); });
      map.invalidateSize();
      if(cities.length && !hit) map.fitBounds(L.latLngBounds(cities.map(g=> [g.lat, g.lng])), { padding:[42,42], maxZoom: cities.length<3? 7 : 5, animate:true });
    }, [sig, asTable, empty, each]);
    useEffect(()=>{ if(!props.onSel || !hit) return; const v = byId[hit], map = mapRef.current; if(!v || !v.geo || !map) return;
      setCityKey(v.geo.region+'|'+v.geo.city); map.flyTo([v.geo.lat, v.geo.lng], Math.max(map.getZoom(), 6), { duration:.55 }); }, [props.onSel && hit]);
    useEffect(()=>{ const layer = layerRef.current; if(!layer) return;
      layer.eachLayer(m=>{ const el = m.getElement(); if(!el) return; const on = each? m._vid===hit : m._cityKey===cityKey; el.classList.toggle('on', on); m.setZIndexOffset(on? 1000 : 0); }); }, [cityKey, sig, hit, each]);
    const toggleRisk = (id)=>{ if(!riskCount[id]) return; setRiskOn(nextRisk(T, id)); setCityKey(null); };
    const tot = cities.reduce((s,g)=> s+g.val, 0), share = (v)=> tot? v/tot*100 : null;
    const regs = regions.map(r=>{ const cs = cities.filter(g=> g.region===r); return { key:r, region:r, n:cs.reduce((s,g)=> s+g.recs.length, 0), val:cs.reduce((s,g)=> s+g.val, 0), cities:cs.length }; }).filter(t=> t.n).sort((a,b)=> b.val-a.val);
    const rMax = Math.max(...regs.map(t=> t.val), 0.01);
    const note = regs.length && tot? regs[0].region+' holds '+pct(share(regs[0].val),0)+' of '+valShort+' ('+fmt(regs[0].val)+').'+(cities[0]? ' '+cities[0].city+' is the largest city at '+fmt(cities[0].val)+'.' : '') : null;
    const Tag = (v)=> html`<${P.RiskTag} cat=${v.cat} score=${v.score} small=${true}/>`;
    const recList = (rows0)=>{ const rows = rows0.slice().sort((a,b)=> (b.id===hit) - (a.id===hit)); return html`<ul>${rows.map(v=> html`<li key=${v.id} class=${hit===v.id? 'hit' : ''}><button type="button" onClick=${()=> props.onSel? pickRec(v) : onOpen(v.id)}>
      <span class="nm">${v.name}</span>${Tag(v)}<span class="vm">${v.id} · ${fmt(v.val||0)} ${valShort}${v.sub? ' · '+v.sub : ''}</span></button></li>`)}</ul>`; };
    const pickRec = (v)=>{ if(hit===v.id) return onOpen(v.id); setHit(v.id); setCityKey(v.geo.region+'|'+v.geo.city);
      const map = mapRef.current; if(map) map.flyTo([v.geo.lat, v.geo.lng], Math.max(map.getZoom(), 6), { duration:.55 }); };
    const hv = hit && shown.find(v=> v.id===hit);
    /* a page can render its own record detail beside the map for the selected record, in either marker mode */
    const detail = hv && props.renderDetail? props.renderDetail(hv, ()=>{ setHit(null); setCityKey(null); }) : null;
    const eachPanel = html`<div class="hd"><div><b>${hv? hv.name : nounPl[0].toUpperCase()+nounPl.slice(1)}</b><div class="faint">${hv? hv.id+' · '+hv.geo.city+', '+hv.geo.region+' · '+fmt(hv.val||0)+' '+valShort+(hv.sub? ' · '+hv.sub : '')
          : FCT.n(shown.length)+' '+nounPl+' · '+fmt(tot)+' '+valShort+'. Select '+a1(noun)+' to find it on the map; select again to open the profile.'}</div></div>
        ${hv && html`<span><button type="button" class="btn sm primary" onClick=${()=> onOpen(hv.id)}>Open profile</button> <button type="button" class="px-link sm" onClick=${()=>{ setHit(null); setCityKey(null); }}>Clear</button></span>`}</div>
      <ul>${shown.slice().sort((a,b)=> (b.val||0)-(a.val||0)).map(v=> html`<li key=${v.id} class=${hit===v.id? 'hit' : ''}><button type="button" onClick=${()=> pickRec(v)} onDoubleClick=${()=> onOpen(v.id)}>
        <span class="nm">${v.name}</span><span class="num">${fmt(v.val||0)}${tot? html` <small class="faint">${pct(share(v.val||0),0)}</small>` : ''}</span>
        <span class="vm">${v.id} · ${v.geo.city} · ${Tag(v)}</span></button></li>`)}</ul>`;
    const Nouns = nounPl[0].toUpperCase()+nounPl.slice(1), caption = shown.length+' '+nounPl+' in '+cities.length+(cities.length===1?' city':' cities')+' · '+fmt(tot)+' '+valShort;
    const tierRow = (label, aria, allOn, allN, onAll, list)=> html`<div class="px-seg" role="group" aria-label=${aria} style=${{fontSize:'12px'}}><span class="l">${label}</span>
      <button type="button" class=${allOn? 'on' : ''} aria-pressed=${allOn} onClick=${onAll}>All<small>${allN}</small></button>${list}</div>`;
    return html`<${P.Card} title="Map analytics" className="px-cmap-card" right=${html`<span class="px-cmap-tg"><span class="px-seg" role="radiogroup" aria-label="Map markers"><button type="button" role="radio" aria-checked=${!each} class=${!each? 'on' : ''} onClick=${()=> setEach(false)}>Grouped by city</button><button type="button" role="radio" aria-checked=${each} class=${each? 'on' : ''} onClick=${()=> setEach(true)}>Individual ${nounPl}</button></span>
        <button type="button" class="px-link sm" onClick=${()=> setAsTable(!asTable)}>${asTable? 'Show map' : 'Show as table'}</button></span>`}>
      <p class="px-p faint" style=${{marginTop:0}}>${each? 'Each dot is '+a1(noun)+', placed around its city: colour is '+(riskLabel||'risk')+', size is '+valShort+'. Click a dot to select it, click again to open the profile.' : 'Each marker is a city: colour is the '+(riskLabel||'risk')+' mix, size is '+valShort+'.'} Totals reconcile to the KPI sheet. ${basis} Locations are illustrative. Ribbon filters still apply.</p>
      ${!props.hideTiers && html`<div class="px-cmap-f px-cmap-hero">
        ${tierRow('Risk', 'Risk profile', allRisks, rT.All.n, ()=>{ setRiskOn(null); setCityKey(null); },
          cats.map(c=> html`<button key=${c} type="button" class=${!allRisks && risks.includes(c)? 'on' : ''} aria-pressed=${risks.includes(c)} disabled=${!rT[c].n && !(!allRisks && risks.includes(c))} onClick=${()=> toggleRisk(c)}><i class="dot" style=${{background:P.RISK[c]}}/>${c}<small>${rT[c].n}</small></button>`))}
        ${tierRow('Geography', 'Geography', geo==='All', gT.All.n, ()=>{ setGeo('All'); setCityKey(null); },
          regions.map(r=> html`<button key=${r} type="button" class=${geo===r? 'on' : ''} aria-pressed=${geo===r} disabled=${!gT[r].n && geo!==r} onClick=${()=>{ setGeo(r); setCityKey(null); }}>${r}<small>${gT[r].n}</small></button>`))}
        ${tierRow(segLabel, segLabel, seg==='All', sT.All.n, ()=>{ setSeg('All'); setCityKey(null); },
          segs.map(g=> html`<button key=${g.id} type="button" class=${seg===g.id? 'on' : ''} aria-pressed=${seg===g.id} title=${g.desc} disabled=${!sT[g.id].n && seg!==g.id} onClick=${()=>{ setSeg(g.id); setCityKey(null); }}>${g.label||g.id}<small>${sT[g.id].n}</small></button>`))}
      </div>
      <p class="px-p faint" style=${{margin:'4px 0 8px'}}>Risk, geography and ${segLabel.toLowerCase()} chosen here also scope every number on the scorecard.</p>`}
      ${empty? html`<${P.Empty} text=${'No '+nounPl+' match this risk, geography and '+segLabel.toLowerCase()+'.'}/>`
        : asTable? html`<${Fragment}><${P.Table} cols=${[{ k:'c', l:'City', fmt:(g)=> html`<b>${g.city}</b><div class="sub">${g.region}</div>`, sv:(g)=> g.city },
            { k:'n', l:Nouns, r:true, fmt:(g)=> FCT.n(g.recs.length), sv:(g)=> g.recs.length },
            { k:'k', l:'Risk mix', fmt:(g)=> html`<span class="px-cmap-mix">${g.parts.map(p=> html`<i key=${p.cat} title=${p.cat+' '+p.n} style=${{background:P.RISK[p.cat], flex:p.n}}/>`)}</span>` },
            { k:'m', l:valName, r:true, fmt:(g)=> fmt(g.val), sv:(g)=> g.val }, { k:'s', l:'Share', r:true, fmt:(g)=> share(g.val)==null? '—' : pct(share(g.val),0), sv:(g)=> g.val }]}
            rows=${cities} rowKey=${(g)=> g.key} caption=${Nouns+' by city'} onSelect=${(g)=> setCityKey(g.key)} onOpen=${(g)=> drill('city', g.key, g.city)} sel=${cityKey}/>
          ${sel && html`<div class="px-cmap-side" style=${{maxHeight:'240px',marginTop:'8px'}}><div class="hd"><div><b>${sel.city}</b><div class="faint">${sel.region} · ${fmt(sel.val)} ${valShort}</div></div></div>${recList(sel.recs)}</div>`}</${Fragment}>`
        : !window.L? html`<${P.Empty} text="The map could not be loaded."/>`
        : html`<div class="px-cmap-stage">
            <div class="px-cmap-map" ref=${host} role="application" aria-label=${'Map of '+nounPl+' by city'}></div>
            <aside class="px-cmap-side" aria-label=${each? Nouns : sel? sel.city+' '+nounPl : 'Cities'}>
              ${detail? detail : each? eachPanel : sel? html`<div class="hd"><div><b>${sel.city}</b><div class="faint">${sel.region} · ${FCT.n(sel.recs.length)} ${nounPl} · ${fmt(sel.val)} ${valShort}</div></div>
                  <span><button type="button" class="btn sm" onClick=${()=> drill('city', sel.key, sel.city)}>Drill in</button> <button type="button" class="px-link sm" onClick=${()=> setCityKey(null)}>All cities</button></span></div>${recList(sel.recs)}`
                : html`<div class="hd"><div><b>Cities</b><div class="faint">${caption}. Select a marker to list the ${nounPl}.</div></div></div>
                  <ul>${cities.map(g=> html`<li key=${g.key}><button type="button" onClick=${()=> focusCity(g)} onDoubleClick=${()=> drill('city', g.key, g.city)}>
                    <span class="nm">${g.city}</span><span class="num">${fmt(g.val)}${share(g.val)!=null? html` <small class="faint">${pct(share(g.val),0)}</small>` : ''}</span>
                    <span class="vm">${g.region} · ${g.recs.length} · ${g.parts.map(pt=> pt.cat[0]+pt.n).join(' ')}</span></button></li>`)}</ul>`}
            </aside></div>`}
      ${!empty && !props.hideFooter && html`<div class="px-cmap-reg">${note && html`<${AI}>${note}</${AI}>`}
        <${P.BarList} rows=${regs.map(t=> ({ key:t.region, label:t.region, val:t.val, sub:FCT.n(t.n)+' '+nounPl+' · '+t.cities+(t.cities===1?' city':' cities')+(share(t.val)!=null? ' · '+pct(share(t.val),0)+' of total' : '') }))}
          label=${valName+' by region'} fmt=${fmt} max=${rMax} sel=${geo==='All'? null : geo}
          onSelect=${(r)=>{ setGeo(geo===r.key? 'All' : r.key); setCityKey(null); }} onOpen=${(r)=> drill('region', r.key, r.key)}/></div>`}
    </${P.Card}>`;
  }

  /* search in the page header: name, id, city or extra text; Enter or click shows the record on the map */
  function MapSearch({ P, items, noun, onOpen, extra }){
    const { html } = P, { useState } = React, [q, setQ] = useState(''), [hi, setHi] = useState(0), t = q.trim().toLowerCase();
    const hits = !t? [] : items.filter(v=> [v.name, v.id, v.geo && v.geo.city, extra && extra(v)].some(x=> x && String(x).toLowerCase().includes(t)))
      .sort((a,b)=> (b.name.toLowerCase().startsWith(t)) - (a.name.toLowerCase().startsWith(t)) || a.name.localeCompare(b.name)).slice(0, 8);
    const go = (v)=>{ if(v){ setQ(''); onOpen(v.id); } };
    const key = (e)=>{ if(e.key==='ArrowDown'){ e.preventDefault(); setHi(Math.min(hi+1, hits.length-1)); } else if(e.key==='ArrowUp'){ e.preventDefault(); setHi(Math.max(hi-1, 0)); } else if(e.key==='Enter') go(hits[hi]); else if(e.key==='Escape') setQ(''); };
    return html`<div class="px-csearch" role="search"><${P.Icon} n="Search" size=${18}/>
      <input type="search" value=${q} placeholder=${'Find '+(/^[aeiou]/i.test(noun)? 'an ' : 'a ')+noun+' on the map'} aria-label=${'Search '+noun+'s'} aria-autocomplete="list" aria-expanded=${hits.length>0} onInput=${(e)=>{ setQ(e.target.value); setHi(0); }} onKeyDown=${key}/>
      ${t && html`<ul class="px-csearch-l" role="listbox">${hits.length? hits.map((v,i)=> html`<li key=${v.id} role="option" aria-selected=${i===hi}>
          <button type="button" class=${i===hi? 'on' : ''} onMouseEnter=${()=> setHi(i)} onClick=${()=> go(v)}><span class="nm">${v.name}</span><${P.RiskTag} cat=${v.cat} score=${v.score} small=${true}/>
          <span class="vm">${v.id} · ${v.geo? v.geo.city : ''}${extra && extra(v)? ' · '+extra(v) : ''}</span></button></li>`)
        : html`<li class="none">No ${noun} matches “${q}”.</li>`}</ul>`}</div>`;
  }

  /* scope helpers every tower model uses: pRisk (comma list), pGeo (region), pSeg */
  const scopeOk = (f, cat, region, seg)=> (!f.pRisk || f.pRisk==='All' || f.pRisk.split(',').includes(cat)) && (!f.pGeo || f.pGeo==='All' || region===f.pGeo) && (!f.pSeg || f.pSeg==='All' || seg===f.pSeg);
  window.FCTMap = { MapCard, MapSearch, placeFor, hash, scopeOk, tiers, nextRisk, SCOPE:{ pRisk:'All', pGeo:'All', pSeg:'All' } };
})();
