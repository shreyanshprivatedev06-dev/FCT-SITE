/* FCT Compliance: entity map analytics (same pattern as the O2C customer map: Leaflet, Esri canvas tiles, seal pins, filter rows,
   side list, region bars, map or table) and the risk-profile groups. Classic script after cmp-preview.js; exposes CMPV.GeoMap. */
(function(){
  const C = window.CMPV, P = window.P2P; if(!C || !P) return;
  const html = P.html, { useState, useEffect, useRef, Fragment } = React;

  /* operating sites and regions come from the shared entity master (data/core.js), so every tower places an entity in the same city */
  const RK = { 'North India':'N', 'West India':'W', 'South India':'S', 'North America':'NA', 'Europe':'EU' };
  const REG = { N:'North India', W:'West India', S:'South India', NA:'North America', EU:'Europe' }, REGK = ['N','W','S','NA','EU'];
  const SITES = {}; ((window.FCT_DATA||{}).entities||[]).forEach(x=>{ if(x.site) SITES[x.id] = { city:x.site.city, state:x.site.state, lat:x.site.lat, lng:x.site.lng, reg:RK[x.region]||'EU' }; });
  const isAbroad = (r)=> r==='NA' || r==='EU';

  /* every figure is a count from the entity row, never an amount */
  const MET = [['items','Open items',(x)=> x.items.reduce((t,it)=> t+(it.n||1), 0)]];   /* the entity's open-items list; late filings are history, not open */
  const items = MET[0][2];
  const SEVW = { critical:4, high:3, medium:2, low:1 }, SEVS = ['critical','high','medium','low'];
  const SEVC = { critical:'var(--px-crit)', high:'var(--px-high)', medium:'var(--px-medium)', low:'var(--px-lowc, var(--px-ink3))', none:'color-mix(in srgb, var(--px-ink) 28%, transparent)' };
  const casesOf = (x)=> x.items.filter(it=> it.type==='Case');
  const worstSev = (x)=> casesOf(x).reduce((w, it)=> (SEVW[it.sev]||0) > (SEVW[w]||0)? it.sev : w, null);
  const sevKey = (x)=> worstSev(x) || 'none';
  const esc = (s)=> FCT.esc(s);

  /* Esri canvas tiles, as on the O2C map; repainted when the theme changes */
  const INDIA = [[7.5,68.5],[33.5,92.5]];
  const cssColor = (v)=>{ const el = document.createElement('span'); el.style.color = v; (document.querySelector('.px-root') || document.body).appendChild(el); const c = getComputedStyle(el).color; el.remove(); return c; };
  const esriLayers = (dark)=>{ const b = dark? 'Canvas/World_Dark_Gray_Base' : 'Canvas/World_Light_Gray_Base', r = dark? 'Canvas/World_Dark_Gray_Reference' : 'Canvas/World_Light_Gray_Reference';
    const url = (id)=> 'https://server.arcgisonline.com/ArcGIS/rest/services/'+id+'/MapServer/tile/{z}/{y}/{x}', opt = { attribution:'Tiles &copy; Esri', maxZoom:16, minZoom:2 };
    return [L.tileLayer(url(b), opt), L.tileLayer(url(r), opt)]; };
  /* pin, side list and filter styles; the O2C map uses the same class names */
  (function(){ if(document.getElementById('cmp-cmap-css')) return; const st = document.createElement('style'); st.id = 'cmp-cmap-css'; st.textContent = [
    /* one compact control bar: three small selects on the left, marker and view toggles on the right */
    '.px-cmap-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 10px;padding:6px;border:1px solid var(--line);border-radius:10px;background:color-mix(in srgb,var(--px-ink) 3%,var(--surface))}',
    '.px-cmap-bar .grow{flex:1 1 auto}',
    '.px-cmap-sel{position:relative;display:inline-flex;align-items:center}',
    '.px-cmap-sel select{appearance:none;-webkit-appearance:none;font:inherit;font-size:12px;color:var(--px-ink);background:var(--surface);border:1px solid var(--line);border-radius:7px;padding:5px 26px 5px 10px;cursor:pointer;max-width:200px}',
    '.px-cmap-sel select:hover{border-color:color-mix(in srgb,var(--px-brand2) 45%,var(--line))}',
    '.px-cmap-sel select:focus-visible{outline:2px solid var(--px-brand2);outline-offset:1px}',
    '.px-cmap-sel.on select{border-color:var(--px-brand2);background:color-mix(in srgb,var(--px-brand2) 9%,var(--surface));font-weight:600}',
    '.px-cmap-sel::after{content:"";position:absolute;right:10px;top:50%;width:6px;height:6px;margin-top:-5px;border-right:1.5px solid var(--px-ink3);border-bottom:1.5px solid var(--px-ink3);transform:rotate(45deg);pointer-events:none}',
    '.px-cmap-bar .px-seg{margin:0}.px-cmap-bar .px-seg button{font-size:12px}',
    '.px-cmap-map{height:480px;border:1px solid var(--line);border-radius:10px;overflow:hidden;z-index:0;background:var(--surface)}',
    '@media (max-width:700px){.px-cmap-map{height:360px}.px-cmap-bar .grow{display:none}.px-cmap-sel{flex:1 1 140px}.px-cmap-sel select{max-width:none;width:100%}}',
    '.px-cmap-wrap{position:relative}',
    /* entity strip above the map: one wrapped chip per entity, dot = worst open case */
    '.px-cmap-ents{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}',
    '.px-cmap-ents button{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:12px;color:var(--px-ink);background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:4px 10px;cursor:pointer}',
    '.px-cmap-ents button:hover{border-color:color-mix(in srgb,var(--px-brand2) 45%,var(--line))}',
    '.px-cmap-ents button.on{border-color:var(--px-brand2);background:color-mix(in srgb,var(--px-brand2) 12%,var(--surface))}',
    '.px-cmap-ents i{width:8px;height:8px;border-radius:50%;flex:none}.px-cmap-ents em{font-style:normal;font-weight:700}.px-cmap-ents small{color:var(--px-ink3)}',
    /* below the map: the side list and the region bars share one row, stacking on narrow screens */
    '.px-cmap-below{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin-top:12px;align-items:start}',
    '@media (max-width:900px){.px-cmap-below{grid-template-columns:1fr}}',
    '.px-cmap-side{border:1px solid var(--line);border-radius:10px;max-height:340px;overflow:auto;background:var(--surface)}',
    '.px-cmap-side .hd{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--surface);z-index:1;font-size:12.5px}',
    '.px-cmap-side .hd .faint{font-size:11.5px;margin-top:2px}',
    '.px-cmap-side ul{list-style:none;margin:0;padding:0}.px-cmap-side li:last-child button{border-bottom:0}',
    '.px-cmap-side li button{display:grid;grid-template-columns:1fr auto;gap:2px 8px;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line);padding:8px 12px;cursor:pointer;color:inherit;font:inherit;transition:background .12s}',
    '.px-cmap-side li button:hover,.px-cmap-side li.hit button{background:color-mix(in srgb,var(--px-brand2) 9%,transparent)}',
    '.px-cmap-side li.hit button{box-shadow:inset 3px 0 0 var(--px-brand2)}',
    '.px-cmap-side .nm{font-weight:600;font-size:12.5px}.px-cmap-side .num{font-weight:650;font-variant-numeric:tabular-nums;text-align:right}',
    '.px-cmap-side .vm{grid-column:1/-1;font-size:11px;color:var(--px-ink3)}',
    '.px-cmap-side .it{padding:8px 12px;border-bottom:1px solid var(--line);font-size:12px}',
    '.px-cmap-regs>*+*{margin-top:12px}',
    '.leaflet-div-icon.px-cmap-pin,.leaflet-div-icon.px-cmap-dot{background:none;border:0}',
    '.cmp-geo .px-cmap-pin .seal{display:flex;flex-direction:column;align-items:center;position:relative;cursor:pointer}',
    '.cmp-geo .px-cmap-pin .name{position:absolute;bottom:100%;margin-bottom:3px;font-size:11px;font-weight:650;white-space:nowrap;color:var(--px-ink);text-shadow:0 0 3px var(--surface),0 0 3px var(--surface),0 0 3px var(--surface)}',
    '.cmp-geo .px-cmap-pin .halo{position:absolute;left:50%;transform:translate(-50%,-50%);border-radius:50%;opacity:.28;pointer-events:none;z-index:0}',
    '.cmp-geo .px-cmap-pin .head,.px-cmap-pin .stem{position:relative;z-index:1}.px-cmap-pin .name{z-index:2}',
    '.cmp-geo .px-cmap-pin .head{border-radius:50%;display:grid;place-items:center;box-shadow:0 0 0 2px var(--surface),0 3px 8px rgba(0,0,0,.3);transition:transform .15s}',
    '.cmp-geo .px-cmap-pin .well{width:62%;height:62%;border-radius:50%;background:var(--surface);display:grid;place-items:center}',
    '.cmp-geo .px-cmap-pin em{font-style:normal;font-weight:700;font-size:12px;color:var(--px-ink)}',
    '.cmp-geo .px-cmap-pin .stem{width:2px;height:10px;background:var(--px-ink2)}',
    '.px-cmap-pin:hover .head{transform:scale(1.1)}.px-cmap-pin.on .head{outline:3px solid var(--px-brand2);outline-offset:2px}',
    '.px-cmap-tip{font-size:12px;line-height:1.45;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.18);padding:8px 10px;color:var(--px-ink);background:var(--surface);border:1px solid var(--line)}',
    '.px-cmap-tip .faint{color:var(--px-ink3)}',
    '.px-cmap-lg{position:absolute;left:10px;bottom:10px;z-index:500;max-width:calc(100% - 20px);background:color-mix(in srgb,var(--surface) 90%,transparent);backdrop-filter:blur(4px);border:1px solid var(--line);border-radius:8px;padding:6px 10px;font-size:11px;line-height:1.6;color:var(--px-ink2);pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.12)}',
    '.px-cmap-lg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 4px 0 8px;vertical-align:0}.px-cmap-lg i:first-of-type{margin-left:0}.px-cmap-lg b{color:var(--px-ink)}',
    '.px-cmap-bd{display:flex;height:10px;border-radius:5px;overflow:hidden;margin:8px 0 6px;gap:2px}.px-cmap-bd i{display:block}',
    '.px-cmap-bg>div{cursor:pointer;padding:6px 8px;margin:-6px -8px;border-radius:8px}.px-cmap-bg>div:hover{background:color-mix(in srgb,var(--px-brand2) 8%,transparent)}.px-cmap-bg>div.on{background:color-mix(in srgb,var(--px-brand2) 14%,transparent);box-shadow:inset 0 0 0 1px var(--px-brand2)}.px-cmap-bg>div:focus-visible{outline:2px solid var(--px-brand2)}',
    '.px-cmap-todo{margin:0 0 12px;border:1px solid var(--line);border-radius:10px;padding:10px 12px}.px-cmap-todo .hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}',
    '.px-cmap-bg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:6px}.px-cmap-bg div{display:grid;gap:2px;align-content:start}.px-cmap-bg b{display:flex;align-items:center;gap:6px;font-size:24px;font-weight:650;font-variant-numeric:tabular-nums}.px-cmap-bg span{font-size:11.5px;color:var(--px-ink3)}.px-cmap-bg em{display:block;font-style:normal;font-size:12.5px;font-weight:600;color:var(--px-ink)}.px-cmap-bg i{width:8px;height:8px;border-radius:2px;flex:none}',
    '.px-cmap-bl{display:flex;flex-wrap:wrap;gap:3px 12px;font-size:11.5px;color:var(--px-ink2)}.px-cmap-bl b{color:var(--px-ink);font-variant-numeric:tabular-nums}.px-cmap-bl i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px}',
    '.px-cmap-kpi{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px;margin:2px 0 12px}',
    '@media (max-width:900px){.px-cmap-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.px-cmap-kpi>div{border:1px solid var(--line);border-radius:10px;padding:10px 14px;min-width:0;background:linear-gradient(180deg,color-mix(in srgb,var(--px-brand2) 6%,var(--surface)),var(--surface))}',
    '.px-cmap-kpi .k{font-size:11.5px;color:var(--px-ink3)}.px-cmap-kpi .v{font-size:26px;font-weight:700;line-height:1.15;margin:2px 0;font-variant-numeric:tabular-nums;color:var(--px-ink)}.px-cmap-kpi .s{font-size:11.5px;color:var(--px-ink2)}',
    '.px-cmap-kpi>div.tap{cursor:pointer}.px-cmap-kpi>div.tap:hover{border-color:color-mix(in srgb,var(--px-brand2) 45%,var(--line))}.px-cmap-kpi>div.tap.on{border-color:var(--px-brand2);box-shadow:inset 0 0 0 1px var(--px-brand2)}.px-cmap-kpi>div.tap:focus-visible{outline:2px solid var(--px-brand2)}',
    '.px-cmap-kpi .crit .v{color:var(--px-crit)}.px-cmap-kpi>div.crit{border-color:color-mix(in srgb,var(--px-crit) 35%,var(--line))}',
    '@keyframes cmpPulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--px-crit) 55%,transparent)}70%{box-shadow:0 0 0 14px color-mix(in srgb,var(--px-crit) 0%,transparent)}100%{box-shadow:0 0 0 0 transparent}}',
    '.cmp-geo .px-cmap-pin.crit .head{animation:cmpPulse 2.2s ease-out infinite}',
    '@media (prefers-reduced-motion:reduce){.px-cmap-pin.crit .head{animation:none}}',
    '.px-cmap-mix{display:flex;height:8px;border-radius:4px;overflow:hidden;min-width:80px}.px-cmap-mix i{display:block}',
    /* last: the shared map card styles pins differently (assets/css/p2p.css); these keep the Compliance seal */
    '.cmp-geo .px-cmap-pin .name{display:block;left:auto;transform:none;padding:0;border-radius:0;background:none;box-shadow:none;line-height:normal;letter-spacing:normal}',
    '.cmp-geo .px-cmap-pin .well{display:flex;align-items:center;justify-content:center;flex:none;width:62%;height:62%;box-shadow:none;background:var(--surface)}',
    '.cmp-geo .px-cmap-pin .head{display:flex;align-items:center;justify-content:center}',
    '.cmp-geo .px-cmap-pin .stem:after{display:none}'].join(''); document.head.appendChild(st); })();

  /* severity mix of an entity's (or region's) open cases as a conic ring */
  const mixOf = (xs)=>{ const m = {}; xs.forEach(x=> casesOf(x).forEach(it=> m[it.sev] = (m[it.sev]||0)+1)); return SEVS.filter(s=> m[s]).map(s=> ({ s, n:m[s] })); };
  const ring = (parts)=>{ const tot = parts.reduce((t,p)=> t+p.n, 0); if(!tot) return SEVC.none; let acc = 0;
    return 'conic-gradient('+parts.map(p=>{ const a = acc/tot*360; acc += p.n; return SEVC[p.s]+' '+a.toFixed(1)+'deg '+(acc/tot*360).toFixed(1)+'deg'; }).join(',')+')'; };
  const mixTxt = (parts)=> parts.length? parts.map(p=> p.n+' '+p.s).join(' · ') : 'no open case';

  /* ---------- map analytics ---------- */
  C.GeoMap = ({ E, open, onRegion })=>{
    const host = useRef(null), mapRef = useRef(null), layerRef = useRef(null);
    const [sev, setSev] = useState(null), [geo, setGeo] = useState('All'), [grp, setGrp] = useState('All'), [each, setEach] = useState(false), [asTable, setAsTable] = useState(false);
    const [selKey, setSelKey] = useState(null), [todo, setTodo] = useState(null);   /* todo: the Decide / Fix / File group listed under the tiles */
    const ents = E.map(x=> Object.assign({ site:SITES[x.e] }, x)).filter(x=> x.site);
    const G = C.ENT_GROUPS, sevAll = ['critical','high','medium','low','none'];
    /* filter rows cross-count like O2C: each row counts inside the other two */
    const inSev = (x)=> !sev || sev.includes(sevKey(x)), inGeo = (x)=> geo==='All' || x.site.reg===geo, inGrp = (x)=> grp==='All' || groupOf(x)[0]===grp;
    const sT = { All:ents.filter(x=> inGeo(x) && inGrp(x)).length }; sevAll.forEach(s=> sT[s] = ents.filter(x=> inGeo(x) && inGrp(x) && sevKey(x)===s).length);
    const gT = { All:ents.filter(x=> inSev(x) && inGrp(x)).length }; REGK.forEach(r=> gT[r] = ents.filter(x=> inSev(x) && inGrp(x) && x.site.reg===r).length);
    const pT = { All:ents.filter(x=> inSev(x) && inGeo(x)).length }; G.forEach(g=> pT[g[0]] = ents.filter(x=> inSev(x) && inGeo(x) && groupOf(x)===g).length);
    const shown = ents.filter(x=> inSev(x) && inGeo(x) && inGrp(x));
    const regs = REGK.map(k=>{ const m = shown.filter(x=> x.site.reg===k); return { k, name:REG[k], m, v:m.reduce((t,x)=> t+items(x), 0), parts:mixOf(m),
      lat:m.length? m.reduce((t,x)=> t+x.site.lat, 0)/m.length : 0, lng:m.length? m.reduce((t,x)=> t+x.site.lng, 0)/m.length : 0 }; }).filter(r=> r.m.length);
    const pins = each? shown.map(x=> ({ key:x.e, label:x.e+' '+x.site.city, lat:x.site.lat, lng:x.site.lng, v:items(x), parts:mixOf([x]), x }))
      : regs.filter(r=> !isAbroad(r.k)).map(r=> ({ key:r.k, label:r.name, lat:r.lat, lng:r.lng, v:r.v, parts:r.parts, r })).concat(shown.filter(x=> isAbroad(x.site.reg)).map(x=> ({ key:x.e, label:x.e+' '+x.site.city, lat:x.site.lat, lng:x.site.lng, v:items(x), parts:mixOf([x]), x })));
    const tot = shown.reduce((t,x)=> t+items(x), 0), maxV = Math.max(1, ...pins.map(p=> p.v));
    const sel = pins.find(p=> p.key===selKey) || null, selX = (sel && sel.x) || shown.find(x=> x.e===selKey) || null, selR = !selX && sel && sel.r;   /* an entity can be picked from a region's list too */
    const sig = (each? 'e' : 'r')+'#'+pins.map(p=> p.key+':'+p.v+':'+p.parts.map(q=> q.s+q.n).join('.')).join('|');
    const empty = !shown.length;
    useEffect(()=>{ setSelKey(null); }, [sev && sev.join(), geo, grp, each]);

    /* the Leaflet map, created once per mount of the map stage */
    useEffect(()=>{
      if(asTable || empty || !window.L){ if(mapRef.current){ mapRef.current.remove(); mapRef.current = null; layerRef.current = null; } return; }
      if(mapRef.current || !host.current) return;
      const map = L.map(host.current, { zoomControl:false, zoomSnap:0.25, zoomDelta:0.5, minZoom:2, maxZoom:12, worldCopyJump:true, scrollWheelZoom:false, keyboard:true }).setView([22.5, 79], 4);
      L.control.zoom({ position:'topright' }).addTo(map);
      map.attributionControl.setPrefix(false);
      const paint = ()=>{ const dark = !document.body.classList.contains('theme-light'), key = dark? 'dark' : 'light'; if(map._fctUrl===key) return;
        (map._fctTiles||[]).forEach(l=> map.removeLayer(l)); map._fctUrl = key; map._fctTiles = esriLayers(dark); map._fctTiles.forEach(l=> l.addTo(map)); };
      paint(); const obs = new MutationObserver(paint); obs.observe(document.body, { attributes:true, attributeFilter:['class'] });
      mapRef.current = map; layerRef.current = L.layerGroup().addTo(map);
      /* full-width map: re-measure whenever its box changes (window, sidebar, card) */
      const kick = ()=> map.invalidateSize(); kick(); const t = setTimeout(kick, 180); window.addEventListener('resize', kick);
      const ro = window.ResizeObserver? new ResizeObserver(kick) : null; ro && ro.observe(host.current);
      return ()=>{ clearTimeout(t); ro && ro.disconnect(); window.removeEventListener('resize', kick); obs.disconnect(); map.remove(); mapRef.current = null; layerRef.current = null; };
    }, [asTable, empty]);
    /* pins: a seal per entity (or per region), ring = severity mix of open cases, number = open items */
    useEffect(()=>{ const map = mapRef.current, layer = layerRef.current; if(!map || !layer) return; layer.clearLayers();
      /* a soft halo under each pin: size is open items, colour the most severe case, so hotspots read before the numbers */
      pins.slice().sort((a,b)=> a.v-b.v).forEach(p=>{ const d = Math.round(30 + Math.sqrt(p.v/maxV)*20), h = d+11;
        const icon = L.divIcon({ className:'leaflet-div-icon px-cmap-pin'+(selKey===p.key? ' on' : '')+(p.parts[0] && p.parts[0].s==='critical'? ' crit' : ''), iconSize:[d, h], iconAnchor:[d/2, h-1],
          html:'<span class="seal" style="width:'+d+'px">'+(p.v? (()=>{ const w = p.parts[0]? p.parts[0].s : 'none', z = Math.round(d + 26 + Math.sqrt(p.v/maxV)*44); return '<span class="halo" style="width:'+z+'px;height:'+z+'px;top:'+(d/2)+'px;background:radial-gradient(circle,'+SEVC[w]+' 0%,transparent 68%)"></span>'; })() : '')+'<span class="name">'+esc(p.label)+'</span><span class="head" style="width:'+d+'px;height:'+d+'px;background:'+ring(p.parts)+'"><span class="well"><em>'+p.v+'</em></span></span><span class="stem"></span></span>' });
        const m = L.marker([p.lat, p.lng], { icon, keyboard:true, title:p.label, riseOnHover:true }); m._key = p.key;
        m.bindTooltip('<strong>'+esc(p.x? p.x.e+' '+p.x.name : p.r.name)+'</strong><br>'+esc(p.x? p.x.site.city+', '+p.x.site.state : p.r.m.length+' entities: '+p.r.m.map(y=> y.e).join(', '))
          +'<br>'+p.v+' open items · cases: '+esc(mixTxt(p.parts))+(p.x && p.x.big? '<br>Largest case '+esc(p.x.bigTxt) : '')+'<br><span class="faint">'+(p.x? 'Click to see its cases; click again to open the profile' : 'Click to list its entities; click again to show each entity')+'</span>',
          { direction:'top', offset:[0, -h-4], opacity:1, className:'px-cmap-tip' });
        m.on('click', ()=>{ setSelKey(k=>{ if(k===p.key){ p.x? open({ kind:'Entity', label:p.x.e, x:E.find(y=> y.e===p.x.e) }) : (setEach(true), setGeo(p.key)); return k; } return p.key; });
          map.flyTo([p.lat, p.lng], Math.min(7, Math.max(map.getZoom(), p.x? 6 : 5)), { duration:.55 }); });
        m.addTo(layer); });
      map.invalidateSize();
      const home = pins.filter(p=> !isAbroad(p.x? p.x.site.reg : p.key));   /* India first; overseas pins fit only when they are all that is shown */
      if(geo==='All' && home.length) map.fitBounds(INDIA, { padding:[4,4], animate:false });
      else { const fit = home.length? home : pins; if(fit.length) map.fitBounds(L.latLngBounds(fit.map(p=> [p.lat, p.lng])), { padding:[70,70], maxZoom:6, animate:true }); }
    }, [sig, asTable, empty]);
    useEffect(()=>{ const layer = layerRef.current; if(!layer) return; layer.eachLayer(m=>{ if(!m._key) return; const el = m.getElement(); if(el){ el.classList.toggle('on', m._key===selKey); m.setZIndexOffset(m._key===selKey? 1000 : 0); } }); }, [selKey, sig]);

    /* drill into a region on the map itself: select it, zoom to it and list its entities beside the map */
    const drillReg = (k)=>{ const card = host.current && host.current.closest('.px-cmap-card'); card && card.scrollIntoView({ behavior:'smooth', block:'start' });
      setAsTable(false); setSelKey(null); setEach(true); setGeo(k); };   /* the map then shows only that region, one pin per entity, and the side list names them */
    const focus = (p)=>{ setSelKey(p.key); const map = mapRef.current; if(map) map.flyTo([p.lat, p.lng], Math.min(7, Math.max(map.getZoom(), 5)), { duration:.55 }); };
    const top = regs.slice().sort((a,b)=> b.v-a.v)[0], topE = shown.slice().sort((a,b)=> items(b)-items(a))[0];
    const note = top && tot? top.name+' has '+Math.round(top.v/tot*100)+'% of open items ('+top.v+' of '+tot+', across '+top.m.length+' entities); '+(topE? topE.e+' '+topE.site.city+' has the most open items of any single entity ('+items(topE)+').' : '') : null;
    const rowOf = (x)=> html`<li key=${x.e} class=${selKey===x.e? 'hit' : ''}><button type="button" onClick=${()=> selKey===x.e? open({ kind:'Entity', label:x.e, x:E.find(y=> y.e===x.e) }) : focus(pins.find(p=> p.key===x.e) || { key:x.e, lat:x.site.lat, lng:x.site.lng })}>
      <span class="nm">${x.e} ${x.site.city}</span><span class="num">${items(x)}${tot? html` <small class="faint" title="Share of the open items shown on the map">${Math.round(items(x)/tot*100)}% of ${geo==='All'? 'all' : REG[geo]}</small>` : ''}</span>
      <span class="vm">${x.name} · ${x.site.state} · ${mixTxt(mixOf([x]))}</span></button></li>`;
    const side = selX? html`<div class="hd"><div><b>${selX.e} ${selX.name}</b><div class="faint">${selX.site.city}, ${selX.site.state} · ${items(selX)} open items · cases: ${mixTxt(mixOf([selX]))}</div></div>
          <span style=${{display:'flex', gap:'6px', flexShrink:0}}><button type="button" class="btn sm primary" onClick=${()=> open({ kind:'Entity', label:selX.e, x:E.find(y=> y.e===selX.e) })}>Open profile</button><button type="button" class="px-link sm" onClick=${()=> setSelKey(null)}>Clear</button></span></div>
        ${casesOf(selX).sort((a,b)=> (SEVW[b.sev]||0)-(SEVW[a.sev]||0) || (b.money||0)-(a.money||0)).slice(0,5).map(it=> html`<div key=${it.ref} class="it"><span style=${{display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', background:SEVC[it.sev], marginRight:'6px'}}/>${it.title}<div class="faint" style=${{fontSize:'11px'}}>${it.ref} · ${it.sev}${it.amt? ' · '+it.amt : ''}</div></div>`)}
        ${!casesOf(selX).length && html`<div class="it faint">No open case.</div>`}
        ${(()=>{ const n = {}; selX.items.filter(it=> it.type!=='Case').forEach(it=> n[it.type] = (n[it.type]||0)+(it.n||1)); const t = Object.keys(n);
          return t.length? html`<div class="it faint">Also open: ${t.map(k=> n[k]+' '+k.toLowerCase()+(n[k]>1 && !/evidence$/.test(k)? 's' : '')).join(' · ')}. The profile lists each one.</div>` : null; })()}`
      : selR? html`<div class="hd"><div><b>${selR.name}</b><div class="faint">${selR.m.length} entities · ${selR.v} open items · cases: ${mixTxt(selR.parts)}</div></div>
          <span style=${{display:'flex', gap:'6px', flexShrink:0}}>${onRegion && html`<button type="button" class="btn sm" onClick=${()=> onRegion(selR.k)}>Show in table ↓</button>`}<button type="button" class="px-link sm" onClick=${()=> setSelKey(null)}>All regions</button></span></div>
        <ul>${selR.m.slice().sort((a,b)=> items(b)-items(a)).map(rowOf)}</ul>`
      : html`<div class="hd"><div><b>${geo!=='All'? REG[geo]+': its entities' : each? 'Entities' : 'Regions'}</b><div class="faint">${shown.length} entities · ${tot} open items. Select a pin or a row to see its cases; select again to open the profile.</div></div>
          ${geo!=='All' && html`<span style=${{display:'flex', gap:'6px'}}>${onRegion && html`<button type="button" class="btn sm" onClick=${()=> onRegion(geo)}>Show in table ↓</button>`}<button type="button" class="px-link sm" onClick=${()=>{ setGeo('All'); setEach(false); }}>← All regions</button></span>`}</div>
        ${each? html`<ul>${shown.slice().sort((a,b)=> items(b)-items(a) || a.e.localeCompare(b.e)).map(rowOf)}</ul>`
          : html`<ul>${pins.map(p=> html`<li key=${p.key}><button type="button" onClick=${()=> focus(p)}><span class="nm">${p.label}</span><span class="num">${p.v}</span><span class="vm">${p.r? p.r.m.map(y=> y.e).join(', ') : p.x.name} · ${mixTxt(p.parts)}</span></button></li>`)}</ul>`}`;

    return html`<${P.Card} className="px-cmap-card cmp-geo">
      ${(()=>{ const crit = shown.filter(x=> worstSev(x)==='critical'), topR = regs.slice().sort((a,b)=> b.v-a.v)[0], topX = shown.slice().sort((a,b)=> items(b)-items(a))[0], abroad = shown.filter(x=> isAbroad(x.site.reg));
        /* the open items grouped by what someone has to do; one hue in steps, severity colours stay reserved for severity */
        const nT = (t)=> shown.reduce((s2,x)=> s2+x.items.filter(it=> it.type===t).reduce((a,it)=> a+(it.n||1), 0), 0);
        const G = [['Decide', [['Case','cases'],['Anomaly','anomalies'],['Contract exception','contracts'],['Access conflict','access']], 'var(--px-brand2)'],
          ['Fix', [['Failing control','controls'],['Finding','findings']], 'color-mix(in srgb, var(--px-brand2) 60%, var(--surface))'],
          ['File', [['Missing evidence','documents']], 'color-mix(in srgb, var(--px-brand2) 30%, var(--surface))']]
          .map(([l,ts,c])=>{ const parts = ts.map(([t,w])=> [nT(t), w]).filter(([n])=> n); return [l, parts.reduce((t,[n])=> t+n, 0), c, parts, ts.map(([t])=> t)]; }).filter(([,n])=> n);
        const sel = G.find(g=> g[0]===todo);
        /* the three summary tiles open the rows behind their number, so every figure can be traced to items */
        const tap = (k, cls)=> ({ role:'button', tabindex:0, class:[cls, 'tap', todo===k && 'on'].filter(Boolean).join(' '), title:'Show the items behind this figure', onClick:()=> setTodo(todo===k? null : k), onKeyDown:(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); setTodo(todo===k? null : k); } } });
        const act = ({ x, it })=> it.decide? C.decide(it.decide) : it.type==='Anomaly'? html`<a class="btn sm" href="investigation.html">Review</a>`
          : html`<button type="button" class="btn sm" onClick=${()=> open({ kind:'Entity', label:x.e, x:E.find(y=> y.e===x.e) })}>Open ${x.e}</button>`;
        const brk = (x)=>{ const n = {}; x.items.forEach(it=> n[it.type] = (n[it.type]||0)+(it.n||1)); return Object.keys(n).sort((a,b)=> n[b]-n[a]).map(k=>{ const w = k.toLowerCase(); return n[k]+' '+(n[k]>1 && !/evidence$/.test(w)? w.replace(/y$/, 'ie')+'s' : w); }).join(' · '); };
        const panel = (head, body)=> html`<div class="px-cmap-todo"><div class="hd"><b>${head}</b><button type="button" class="px-link sm" onClick=${()=> setTodo(null)}>Close</button></div><div class="px-tbl">${body}</div></div>`;
        return html`<div class="px-cmap-kpi" aria-label="Map summary">
          <div><div class="k">Work outstanding at ${shown.filter(x=> items(x)).length} of ${shown.length} entities</div>
            <div class="px-cmap-bg">${G.map(([l,n,c,parts])=> html`<div key=${l} role="button" tabindex="0" class=${todo===l? 'on' : ''} title=${'List the '+n+' items to '+l.toLowerCase()} onClick=${()=> setTodo(todo===l? null : l)} onKeyDown=${(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); setTodo(todo===l? null : l); } }}><b><i style=${{background:c}}/>${n}</b><span><em>to ${l.toLowerCase()}</em>${l==='File'? 'missing evidence' : parts.map(([k,w])=> k+' '+w).join(' · ')}</span></div>`)}</div></div>
          <div ...${tap('crit', crit.length? 'crit' : '')}><div class="k">Entities with a critical case</div><div class="v">${crit.length}</div><div class="s">${crit.length? crit.map(x=> x.e).join(', ') : 'none'}</div></div>
          ${regs.length>1? html`<div ...${tap('hot')}><div class="k">Hotspot region</div><div class="v">${topR && tot? Math.round(topR.v/tot*100)+'%' : '—'}</div><div class="s">${topR? 'of open items in '+topR.name+' ('+topR.v+' of '+tot+')' : ''}</div></div>`
            : html`<div ...${tap('hot')}><div class="k">Region</div><div class="v" style=${{fontSize:'20px'}}>${topR? topR.name : '—'}</div><div class="s">${topR? topR.m.length+' entities · '+topR.v+' open items' : ''}</div></div>`}
          <div ...${tap('big')}><div class="k">Largest entity</div><div class="v">${topX? topX.e : '—'}</div><div class="s">${topX? topX.site.city+' · '+items(topX)+' open items' : ''}</div></div></div>
          ${todo==='crit' && panel(crit.length? 'Critical cases open at '+crit.map(x=> x.e).join(', ') : 'No entity has a critical case open', crit.length? html`<table class="t px-t dense"><thead><tr><th>Entity</th><th>Case</th><th class="r">Amount</th><th>Other cases here</th><th><span class="sr">Action</span></th></tr></thead>
            <tbody>${crit.flatMap(x=> casesOf(x).filter(it=> it.sev==='critical').map(it=> ({ x, it }))).sort((a,b)=> (b.it.money||0)-(a.it.money||0)).map((r,i)=> html`<tr key=${i}><td><b>${r.x.e}</b><div class="sub">${r.x.name} · ${r.x.site.city}</div></td>
              <td style=${{whiteSpace:'normal', minWidth:'260px'}}>${r.it.title}<div class="sub">${r.it.ref}</div></td><td class="r num">${r.it.amt || '—'}</td><td>${mixTxt(mixOf([r.x]))}</td><td class="r">${act(r)}</td></tr>`)}</tbody></table>` : null)}
          ${todo==='hot' && topR && panel(topR.name+': '+topR.v+' of '+tot+' open items ('+Math.round(topR.v/(tot||1)*100)+'%) across '+topR.m.length+' entities', html`<table class="t px-t dense"><thead><tr><th>Entity</th><th>What is open</th><th class="r" style=${{whiteSpace:'nowrap', paddingLeft:'16px'}}>Open items</th><th class="r" style=${{whiteSpace:'nowrap', paddingLeft:'16px'}}>Share of region</th><th class="r" style=${{whiteSpace:'nowrap', paddingLeft:'16px'}}>Share of all</th><th><span class="sr">Action</span></th></tr></thead>
            <tbody>${topR.m.slice().sort((a,b)=> items(b)-items(a)).map(x=> html`<tr key=${x.e}><td><b>${x.e}</b><div class="sub">${x.name} · ${x.site.city}, ${x.site.state}</div></td><td style=${{whiteSpace:'normal'}}>${brk(x) || 'nothing open'}</td>
              <td class="r num">${items(x)}</td><td class="r num">${topR.v? Math.round(items(x)/topR.v*100)+'%' : '—'}</td><td class="r num">${tot? Math.round(items(x)/tot*100)+'%' : '—'}</td><td class="r"><button type="button" class="btn sm" onClick=${()=> open({ kind:'Entity', label:x.e, x:E.find(y=> y.e===x.e) })}>Open ${x.e}</button></td></tr>`)}
            <tr><td><b>${topR.name}</b></td><td class="faint">Other regions: ${regs.filter(r=> r.k!==topR.k).map(r=> r.name+' '+r.v).join(' · ')}</td><td class="r num"><b>${topR.v}</b></td><td class="r num">100%</td><td class="r num"><b>${Math.round(topR.v/(tot||1)*100)}%</b></td><td/></tr></tbody></table>`)}
          ${todo==='big' && topX && panel(topX.e+' '+topX.name+' ('+topX.site.city+'): '+items(topX)+' open items', html`<table class="t px-t dense"><thead><tr><th>Type</th><th>Item</th><th class="r">Count</th><th><span class="sr">Action</span></th></tr></thead>
            <tbody>${topX.items.slice().sort((a,b)=> (SEVW[b.sev]||0)-(SEVW[a.sev]||0) || (b.money||0)-(a.money||0)).map((it,i)=> html`<tr key=${i}><td style=${{whiteSpace:'nowrap'}}>${it.type}${it.sev? html`<div class="sub">${it.sev}</div>` : null}</td>
              <td style=${{whiteSpace:'normal', minWidth:'260px'}}>${it.title}<div class="sub">${it.ref}${it.amt? ' · '+it.amt : ''}</div></td><td class="r num">${it.n||1}</td><td class="r">${act({ x:topX, it })}</td></tr>`)}
            <tr><td><b>Total</b></td><td class="faint">Next largest: ${shown.filter(x=> x!==topX).sort((a,b)=> items(b)-items(a)).slice(0,2).map(x=> x.e+' '+items(x)).join(' · ') || '—'}</td><td class="r num"><b>${items(topX)}</b></td><td/></tr></tbody></table>`)}
          ${sel && (()=>{ const rows = []; shown.forEach(x=> x.items.filter(it=> sel[4].includes(it.type)).forEach(it=> rows.push({ x, it })));
            rows.sort((a,b)=> (SEVW[b.it.sev]||0)-(SEVW[a.it.sev]||0) || (b.it.money||0)-(a.it.money||0) || a.x.e.localeCompare(b.x.e));
            return html`<div class="px-cmap-todo"><div class="hd"><b>${sel[1]} to ${sel[0].toLowerCase()}</b><button type="button" class="px-link sm" onClick=${()=> setTodo(null)}>Close</button></div>
              <div class="px-tbl"><table class="t px-t dense"><thead><tr><th>Entity</th><th>Type</th><th>Item</th>${sel[0]==='File' && html`<th class="r">Documents</th>`}<th><span class="sr">Action</span></th></tr></thead>
              <tbody>${rows.map((r,i)=> html`<tr key=${i}><td><b>${r.x.e}</b><div class="sub">${r.x.site.city}</div></td><td style=${{whiteSpace:'nowrap'}}>${r.it.type}${r.it.sev? html`<div class="sub">${r.it.sev}</div>` : null}</td>
                <td style=${{whiteSpace:'normal', minWidth:'260px'}}>${r.it.title}<div class="sub">${r.it.ref}</div></td>${sel[0]==='File' && html`<td class="r num">${r.it.n||1}</td>`}<td class="r">${act(r)}</td></tr>`)}</tbody></table></div></div>`; })()}`; })()}
      <div class="px-cmap-f px-cmap-hero">
        <div class="px-seg" role="group" aria-label="Risk profile" style=${{fontSize:'12px'}}><span class="l">Risk</span>
          <button type="button" class=${!sev? 'on' : ''} aria-pressed=${!sev} onClick=${()=> setSev(null)}>All<small>${sT.All}</small></button>
          ${sevAll.map(v=> html`<button key=${v} type="button" class=${sev && sev.includes(v)? 'on' : ''} aria-pressed=${!!(sev && sev.includes(v))} disabled=${!sT[v] && !(sev && sev.includes(v))}
            onClick=${()=>{ const nx = !sev? [v] : sev.includes(v)? sev.filter(y=> y!==v) : sev.concat(v); setSev(!nx.length || nx.length===sevAll.length? null : nx); }}><i class="dot" style=${{background:SEVC[v]}}/>${v==='none'? 'No open case' : v[0].toUpperCase()+v.slice(1)}<small>${sT[v]}</small></button>`)}</div>
        <div class="px-seg" role="group" aria-label="Geography" style=${{fontSize:'12px'}}><span class="l">Geography</span>
          <button type="button" class=${geo==='All'? 'on' : ''} aria-pressed=${geo==='All'} onClick=${()=> setGeo('All')}>All<small>${gT.All}</small></button>
          ${REGK.map(r=> html`<button key=${r} type="button" class=${geo===r? 'on' : ''} aria-pressed=${geo===r} disabled=${!gT[r] && geo!==r} onClick=${()=> setGeo(r)}>${REG[r]}<small>${gT[r]}</small></button>`)}</div>
        <div class="px-seg" role="group" aria-label="Risk group" style=${{fontSize:'12px'}}><span class="l">Risk group</span>
          <button type="button" class=${grp==='All'? 'on' : ''} aria-pressed=${grp==='All'} onClick=${()=> setGrp('All')}>All<small>${pT.All}</small></button>
          ${G.map(g=> html`<button key=${g[0]} type="button" class=${grp===g[0]? 'on' : ''} aria-pressed=${grp===g[0]} disabled=${!pT[g[0]] && grp!==g[0]} onClick=${()=> setGrp(g[0])}><i class="dot" style=${{background:g[2]}}/>${g[1]}<small>${pT[g[0]]}</small></button>`)}</div>
      </div>
      <div class="px-cmap-bar" role="toolbar" aria-label="Map view">
        ${(sev || geo!=='All' || grp!=='All') && html`<button type="button" class="px-link sm" onClick=${()=>{ setSev(null); setGeo('All'); setGrp('All'); }}>Reset tiles</button>`}
        <span class="grow"/>
        ${!asTable && html`<span class="px-seg" role="radiogroup" aria-label="Map markers"><button type="button" role="radio" aria-checked=${!each} class=${!each? 'on' : ''} onClick=${()=> setEach(false)}>Regions</button><button type="button" role="radio" aria-checked=${each} class=${each? 'on' : ''} onClick=${()=> setEach(true)}>Entities</button></span>`}
        <span class="px-seg" role="radiogroup" aria-label="View"><button type="button" role="radio" aria-checked=${!asTable} class=${!asTable? 'on' : ''} onClick=${()=> setAsTable(false)}>Map</button><button type="button" role="radio" aria-checked=${asTable} class=${asTable? 'on' : ''} onClick=${()=> setAsTable(true)}>Table</button></span>
      </div>
      ${!empty && html`<div class="px-cmap-ents" aria-label="Entities">${shown.slice().sort((a,b)=> items(b)-items(a)).map(x=>{ const w = mixOf([x])[0]; return html`<button key=${x.e} type="button" class=${selKey===x.e? 'on' : ''} title=${x.name+' · '+x.site.city+', '+x.site.state+' · cases: '+mixTxt(mixOf([x]))+(selKey===x.e? ' · click again to open the profile' : '')}
          onClick=${()=> selKey===x.e? open({ kind:'Entity', label:x.e, x:E.find(y=> y.e===x.e) }) : (setAsTable(false), focus(pins.find(p=> p.key===x.e) || { key:x.e, lat:x.site.lat, lng:x.site.lng }))}>
          <i style=${{background:SEVC[w? w.s : 'none']}}/><b>${x.e}</b> <small>${x.site.city}</small> <em>${items(x)}</em></button>`; })}</div>`}
      ${empty? html`<${P.Empty} text="No entity matches this severity, geography and risk group."/>`
        : asTable? html`<${P.Table} cols=${[{ k:'e', l:'Entity', fmt:(x)=> html`<b>${x.e}</b> ${x.name}<div class="sub">${x.site.city}, ${x.site.state}</div>`, sv:(x)=> x.e },
            { k:'r', l:'Region', fmt:(x)=> REG[x.site.reg], sv:(x)=> x.site.reg }, { k:'k', l:'Case severity mix', fmt:(x)=> { const pt = mixOf([x]); return pt.length? html`<span class="px-cmap-mix" title=${mixTxt(pt)}>${pt.map(q=> html`<i key=${q.s} style=${{background:SEVC[q.s], flex:q.n}}/>`)}</span>` : html`<span class="faint">no open case</span>`; } },
            { k:'c', l:'Cases', r:true, fmt:(x)=> x.cases, sv:(x)=> x.cases }, { k:'n', l:'Open items', r:true, fmt:(x)=> items(x), sv:(x)=> items(x) }, { k:'s', l:'Share', r:true, fmt:(x)=> tot? Math.round(items(x)/tot*100)+'%' : '—', sv:(x)=> items(x) }]}
            rows=${shown.slice().sort((a,b)=> items(b)-items(a))} rowKey=${(x)=> x.e} caption="Entities by site" onOpen=${(x)=> open({ kind:'Entity', label:x.e, x:E.find(y=> y.e===x.e) })}/>`
        : !window.L? html`<${P.Empty} text="The map could not be loaded."/>`
        : html`<div class="px-cmap-wrap"><div class="px-cmap-map" ref=${host} role="application" aria-label="Map of entities by site"></div>
              <div class="px-cmap-lg" aria-hidden="true"><b>Ring</b><i style=${{background:SEVC.critical}}/>critical<i style=${{background:SEVC.high}}/>high<i style=${{background:SEVC.medium}}/>medium<i style=${{background:SEVC.none}}/>no case<br/><b>Number</b> open items · <b>halo</b> grows with open items · <b>pulse</b> critical case open · ${each? 'one pin per entity' : 'one pin per region; overseas entities keep their own'} · sites illustrative</div></div>
          ${geo==='All' && shown.some(x=> isAbroad(x.site.reg)) && html`<p class="px-p faint" style=${{margin:'6px 0 0', fontSize:'12px'}}>Map opens on India. Outside India: ${shown.filter(x=> isAbroad(x.site.reg)).map(x=> x.e+' '+x.site.city+' ('+items(x)+')').join(', ')}. <button type="button" class="px-link sm" onClick=${()=> setGeo('O')}>Show outside India</button></p>`}`}
      ${!empty && html`<div class="px-cmap-below">
        ${!asTable && window.L && html`<aside class="px-cmap-side" aria-label=${selX? selX.e : selR? selR.name : 'Entities'}>${side}</aside>`}
        <div class="px-cmap-regs">
          ${note && html`<${C.AI}>${note}</${C.AI}>`}
          <${P.BarList} rows=${regs.map(r=> ({ key:r.k, label:r.name, val:r.v, sub:r.m.length+(r.m.length===1? ' entity' : ' entities')+' · '+Math.round(r.v/(tot||1)*100)+'% of open items'+(r.parts.filter(q=> q.s==='critical' || q.s==='high').length? ' · '+r.parts.filter(q=> q.s==='critical' || q.s==='high').map(q=> q.n+' '+q.s).join(', ') : ''), tone:geo===r.k || (selR && selR.k===r.k)? 'var(--px-brand2)' : 'color-mix(in srgb, var(--px-ink) 30%, transparent)' }))}
            label="Open items by region" fmt=${(v)=> FCT.n(v)} sel=${selR? selR.k : geo==='All'? null : geo} onSelect=${(r)=> drillReg(r.key)} onOpen=${(r)=> drillReg(r.key)}/></div></div>`}
    </${P.Card}>`; };

  /* ---------- risk profile: entity × reason matrix; each entity sits in the first group whose reason it meets ---------- */
  const DRV = [
    ['crit','Critical case', (x)=> worstSev(x)==='critical', (x)=> { const c = casesOf(x).filter(it=> it.sev==='critical'); return c.map(it=> it.ref).join(', '); }],
    ['sod','Access conflict', (x)=> !!x.sod, (x)=> x.sodUsed? 'used' : 'not used'],
    ['fnd','Open finding', (x)=> !!x.fnd, (x)=> C.pl(x.fnd,'finding')],
    ['fail','3+ failing controls', (x)=> x.fail>=3, (x)=> x.fail+' failing'],
    ['miss','5+ missing evidence', (x)=> x.miss>=5, (x)=> x.miss+' missing'],
    ['other','Other open items', (x)=> x.items.length>0, (x)=> MET[0][2](x)+' open']];
  const GRP = [
    ['crit','Critical cases open','var(--px-crit)', ['crit']],
    ['ctl','Access and findings','var(--px-high)', ['sod','fnd','fail']],
    ['evd','Evidence gaps','var(--px-brand2)', ['miss']],
    ['watch','Watch','var(--px-medium)', ['other']],
    ['clear','Clear','var(--px-ink3)', []]];
  const groupOf = (x)=> GRP.find(g=> !g[3].length || g[3].some(d=> DRV.find(v=> v[0]===d)[2](x)));

  /* the reason that placed an entity in its group, in exact words (used by the headline and the profile) */
  const WHY = { crit:(x)=> C.pl(casesOf(x).filter(it=> it.sev==='critical').length,'critical case')+' ('+DRV[0][3](x)+')', sod:(x)=> (x.sodUsed? 'a used' : 'an unused')+' access conflict',
    fnd:(x)=> C.pl(x.fnd,'open finding'), fail:(x)=> x.fail+' failing controls', miss:(x)=> x.miss+' missing evidence items', other:(x)=> MET[0][2](x)+' open items, no case' };
  C.ENT_GROUPS = GRP; C.entGroup = groupOf; C.entSite = (e)=> SITES[e] || { city:'—', state:'', reg:'EU' }; C.ENT_REG = REG;
  C.entWhy = (x)=>{ const g = groupOf(x), d = g[3].find(k=> DRV.find(v=> v[0]===k)[2](x)); return d? WHY[d](x) : 'nothing open'; };
})();
