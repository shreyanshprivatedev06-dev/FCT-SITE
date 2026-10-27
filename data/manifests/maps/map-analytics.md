# Map Analytics — tower-agnostic manifest (v1, 23-Oct-2026)

**What this is:** everything needed to build the "Map analytics" card, with no other file required. It covers what the card does, when a tower should have one, the data it needs, the complete code (JS and CSS), the behaviour rules, tests and known pitfalls.

**Where it came from:** first built for the O2C tower on the Customer portfolio screen (`screens/o2c/customers.html`). There it maps customers by city, coloured by approved risk and sized by open AR. This manifest generalises that build. In the text, **entity** means the tower's main record (customer, vendor, plant, warehouse, legal entity) and **value** means the tower's headline amount (open AR, spend, inventory value).

---

## 1. What the card does

One card with four parts, top to bottom:

1. **Header row.** Title "Map analytics" on the left. On the right, a two-way toggle (**Grouped by city / Individual <entities>**) and a "Show as table" link.
2. **Selector tiles (the hero of the card).** These are two rows of large tiles.
   - **Risk** row: All, then one tile per risk category.
   - **Geography** row: All, then one tile per region.
   - Each tile shows the label, a large count and "₹X <value>" underneath.
   - **The tiles cross-filter.** Risk tiles count inside the selected geography; geography tiles count inside the selected risks.
   - The tiles are the **only** way to move the map.
3. **Stage.** A locked map (about 75% of the width) next to a side panel (220–260px).
   - **Grouped mode:** one pin per city. The pin is a ring split by risk mix, with the entity count in the centre; its size scales with value. The side panel lists cities by value; selecting a city lists its entities, with "Drill in" and "All cities" buttons.
   - **Individual mode:** one dot per entity, arranged in a ring around its city. Colour is the entity's risk and size is its value. The side panel lists entities by value with their share of the total.
     - **First click** on a dot or a list row selects it: the dot is highlighted and the map flies to it.
     - **Second click** opens the entity profile. Double-clicking a row or pressing "Open profile" does the same.
     - "Clear" deselects.
4. **Footer.**
   - **AI note.** One sentence: the largest region and its share, then the largest city.
   - **Value-by-region bar list.** Clicking a bar selects that geography; opening it drills to a region group.

**Search** sits in the page header, right-aligned and about 340px wide, with the placeholder "Find a <entity> on the map". It matches name, ID, city and parent group. Choosing a result does four things:
- resets the tiles to All;
- selects the entity and its city;
- flies the map to zoom 7;
- scrolls the card into view.

From there the user drills down as usual.

**Drill-down.** "Drill in" on a city, or opening a region bar, dispatches a group node. The node carries the selected risks, so the next screen shows exactly what the tiles showed. Its breadcrumb label reads, for example, `Region: West India · Critical risk`.

---

## 2. Should your tower have one? (decision guide)

Add a map only when **location changes a decision**. Use these checks:

| Question | If yes |
|---|---|
| Does the main entity have a meaningful physical location (site, ship-to, plant, warehouse, office)? | Required. Without coordinates there is no map. |
| Do controllers act regionally (regional collection teams, regional plants, state tax)? | Strong case. |
| Is concentration by place a risk (one city holds 30% of exposure; hazard zone; jurisdiction)? | Strong case. |
| Are there fewer than about 5 distinct places? | Do not build a map; a bar list is clearer. |
| Is "where" only a label with no consequence? | Do not build a map. |

Suggested fit for each tower (each tower should confirm its own):

| Tower | Entity on the map | Value (size) | Colour | Verdict |
|---|---|---|---|---|
| O2C (built) | Customer | Open AR | Approved credit risk | Built |
| P2P | Vendor | Spend or open payables | Vendor risk / Kraljic class | Good fit: supplier concentration and sourcing regions |
| Supply Chain | Plant / warehouse | Inventory value | Excess or slow-stock severity | Good fit: few sites but high value; consider individual mode as the default |
| R2R | Legal entity | Unreconciled balance | Close status | Usually weak: few entities; use a list unless there are many |
| Compliance | Site / entity | Open issues | Control criticality | Fit only where controls are site-based |

**Things that stay fixed** (do not change them): the tile row look, a locked map, the toggle, how the side panel behaves, search to map to drill, and the honesty rules.

**Things each tower defines:** the entity, the value measure, the colour dimension and its categories, the regions, the city coordinates, and the drill target.

---

## 3. Data contract

The card needs only four things from the tower's model, so any tower can plug in:

```js
// 1. Entities in the current ribbon filter, each with a location
entities(f) → [{ id, name, geo:{ city, region, lat, lng }, parentName? }]

// 2. Value per entity under the current filter (reconciles to the KPI sheet)
value(f) → { [entityId]: number }     // ₹ Cr in the FCT demo

// 3. Colour category per entity
cat(id) → { approved:'Critical'|'High'|'Medium'|'Low', score:number }

// 4. Config
CATS    = ['Critical','High','Medium','Low']      // ordered worst → best
COLOURS = { Critical:'var(--bad)', ... }          // CSS colours or tokens
REGIONS = ['North India','West India', ...]       // ordered for display
```

**Seeding locations (demo data).**
- Keep a `PLACES` table of real cities with lat/lng for each region.
- Pick an entity's city **deterministically from its ID** (for example, a hash of the ID modulo the list length). This means the ledger seed never changes and reloads are stable.
- Example rows:

```js
const PLACES = {
  'North India': [ { city:'Delhi', lat:28.6139, lng:77.2090 }, { city:'Jaipur', lat:26.9124, lng:75.7873 } ],
  'West India':  [ { city:'Mumbai', lat:19.0760, lng:72.8777 }, { city:'Pune', lat:18.5204, lng:73.8567 } ],
  'South India': [ { city:'Bengaluru', lat:12.9716, lng:77.5946 }, { city:'Hyderabad', lat:17.3850, lng:78.4867 } ],
  'East India':  [ { city:'Kolkata', lat:22.5726, lng:88.3639 } ],
  'Europe':      [ { city:'Basel', lat:47.5596, lng:7.5886 }, { city:'Zurich', lat:47.3769, lng:8.5417 } ]
};
// entity.geo = { city, region, lat, lng }  — the region comes from the entity's business unit
```

**Rules for the value measure.**
- It must be **additive**, because tiles, the side panel and region bars all sum it.
- Ratio measures (DSO, % overdue) must **not** be summed. If one is ever needed, compute it from the summed parts (for example, AR ÷ (rev90/90)).
- Totals must reconcile to the KPI sheet under the same filter. Test this (section 7).

---

## 4. Stack and assets

- **React 18 + htm** with no build step: `const html = htm.bind(React.createElement)`.
- **Leaflet 1.9.4, vendored locally:** `assets/vendor/leaflet/leaflet.css`, `leaflet.js` and the `images/` folder. Do not use a CDN; the demo must run offline-first.
  ```html
  <link rel="stylesheet" href="../../assets/vendor/leaflet/leaflet.css">
  <script src="../../assets/vendor/leaflet/leaflet.js"></script>
  ```
- **Basemap: Esri Canvas tiles.** They need no API key, and there are light and dark variants (base + reference labels):
  `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_{Dark|Light}_Gray_{Base|Reference}/MapServer/tile/{z}/{y}/{x}`. Attribution is "Tiles © Esri".
- **Theme:** the body has the class `theme-light` or not. A `MutationObserver` on `body.class` swaps the tile set live.
- **Fallback:** if `window.L` is missing, show an empty state ("The map could not be loaded"). The table view still works.

---

## 5. Reference implementation (copy and adapt)

This is a generic version of the O2C code. Replace the `D.*` adapter with your tower's model (section 3). It assumes the shared UI kit `P` (`P.Card`, `P.Empty`, `P.Table`, `P.BarList`, `P.AI`, `P.RiskTag`, `P.load/P.store`) and formatters `cr` (₹ Cr) and `pct`. If your tower has no `P`, those are a card wrapper, an empty state, a sortable table, a horizontal bar list, an "insight" callout, a coloured tag and localStorage helpers.

```js
const { useState, useEffect, useRef, Fragment } = React;

/* ---- adapter: the only tower-specific part ---- */
const D = {
  entities: (f)=> M.customersIn(f),                 // [{id,name,geo,...}]
  value:    (f)=> { const per = M.geoAgg(f).per; return (id)=> (per[id]||{}).ar || 0; },
  cat:      (id)=> M.risk(id),                      // {approved, score}
  CATS:     C.risk.cats.map(c=> c.id),
  COLOUR:   P.RISK,                                  // {cat: cssColour}
  REGIONS:  C.regions,
  noun:     'customers', valueLabel:'open AR'
};

function cssColor(v){                     // resolve CSS vars for Leaflet HTML/gradients
  const host = document.querySelector('.px-root') || document.body, s = document.createElement('span');
  s.style.color = v; host.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c;
}
function esriLayers(dark){
  const t = dark? 'Dark' : 'Light', url = (id)=> 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_'+t+'_Gray_'+id+'/MapServer/tile/{z}/{y}/{x}';
  const opt = { attribution:'Tiles &copy; Esri', maxZoom:16, minZoom:2 };
  return [L.tileLayer(url('Base'), opt), L.tileLayer(url('Reference'), opt)];
}

function EntityMap({ f, onOpen, onGroup, found }){
  const host = useRef(null), mapRef = useRef(null), layerRef = useRef(null);
  const [riskOn, setRiskOn] = useState(null), [geo, setGeo] = useState('All');
  const [cityKey, setCityKey] = useState(null), [asTable, setAsTable] = useState(false);
  const [hit, setHit] = useState(null), hitRef = useRef(null); hitRef.current = hit;
  const [each, setEach0] = useState(()=> P.load('mapEach', false));
  const setEach = (x)=>{ setEach0(x); P.store('mapEach', x); setCityKey(null); if(!x) setHit(null); };
  const val = D.value(f);

  useEffect(()=>{ setRiskOn(null); setGeo('All'); setCityKey(null); }, [M.fkey(f)]);   // ribbon change resets local chips

  // search result: reset chips, select, fly, scroll
  useEffect(()=>{ const v = found && D.entities(f).find(x=> x.id===found.id); if(!v || !v.geo) return;
    setRiskOn(null); setGeo('All'); setAsTable(false); setHit(v.id); setCityKey(v.geo.region+'|'+v.geo.city);
    const t = setTimeout(()=>{ const map = mapRef.current; if(map) map.flyTo([v.geo.lat, v.geo.lng], 7, { duration:.7 });
      const card = map && map.getContainer().closest('.px-cmap-card'); if(card) card.scrollIntoView({ behavior:'smooth', block:'start' }); }, 120);
    return ()=> clearTimeout(t); }, [found && found.t]);

  /* ---- tiles: cross-filtered counts and values ---- */
  const base = D.entities(f), cats = D.CATS;
  const catOf = (v)=> D.cat(v.id).approved;
  const avail = cats.filter(c=> base.some(v=> catOf(v)===c));
  const risks = (riskOn || avail).filter(c=> avail.includes(c));
  const allRisks = !riskOn || risks.length===avail.length;
  const inGeo = (v)=> geo==='All' || (v.geo && v.geo.region===geo), inRisk = (v)=> risks.includes(catOf(v));
  const tile = (list)=> ({ n:list.length, val:list.reduce((t,v)=> t + val(v.id), 0) });
  const rT = { All:tile(base.filter(inGeo)) };  cats.forEach(c=> rT[c] = tile(base.filter(v=> inGeo(v) && catOf(v)===c)));
  const gT = { All:tile(base.filter(inRisk)) }; D.REGIONS.forEach(r=> gT[r] = tile(base.filter(v=> inRisk(v) && v.geo && v.geo.region===r)));
  const drill = (dim, key, label)=> onGroup(dim, key, label, allRisks? null : risks.slice());
  const toggleRisk = (id)=>{ const next = allRisks? [id] : risks.includes(id)? risks.filter(x=> x!==id) : risks.concat(id);
    setRiskOn(!next.length || next.length===avail.length? null : next); setCityKey(null); };

  /* ---- what is on the map ---- */
  const shown = base.filter(v=> v.geo && inRisk(v) && inGeo(v));
  const byCity = {};
  shown.forEach(v=>{ const k = v.geo.region+'|'+v.geo.city;
    const g = byCity[k] || (byCity[k] = { key:k, city:v.geo.city, region:v.geo.region, lat:v.geo.lat, lng:v.geo.lng, items:[], val:0, mix:{} });
    g.items.push(v); g.val += val(v.id); g.mix[catOf(v)] = (g.mix[catOf(v)]||0) + 1; });
  const cities = Object.values(byCity).map(g=>{ g.parts = cats.filter(c=> g.mix[c]).map(c=> ({ cat:c, n:g.mix[c] }));
      g.items.sort((a,b)=> D.cat(b.id).score - D.cat(a.id).score); return g; })
    .sort((a,b)=> b.val - a.val || b.items.length - a.items.length);
  const total = cities.reduce((t,g)=> t + g.val, 0);
  const sel = cities.find(g=> g.key===cityKey) || null, empty = !shown.length;
  const sig = cities.map(g=> [g.key, g.items.length, g.val.toFixed(2), g.parts.map(p=> p.cat+p.n).join('.')].join(':')).join('|');

  /* ---- create / destroy the locked map ---- */
  useEffect(()=>{
    if(asTable || empty){ if(mapRef.current){ mapRef.current.remove(); mapRef.current = null; layerRef.current = null; } return; }
    if(mapRef.current || !host.current || !window.L) return;
    const map = L.map(host.current, { zoomControl:false, minZoom:2, maxZoom:16, worldCopyJump:true,
      dragging:false, scrollWheelZoom:false, doubleClickZoom:false, touchZoom:false, boxZoom:false, keyboard:false }).setView([22.5, 79], 4);
    map.attributionControl.setPrefix(false);
    const paint = ()=>{ const dark = !document.body.classList.contains('theme-light'), k = dark? 'dark' : 'light';
      if(map._fctUrl===k) return; (map._fctTiles||[]).forEach(l=> map.removeLayer(l));
      map._fctUrl = k; map._fctTiles = esriLayers(dark); map._fctTiles.forEach(l=> l.addTo(map)); };
    paint(); const obs = new MutationObserver(paint); obs.observe(document.body, { attributes:true, attributeFilter:['class'] });
    mapRef.current = map; layerRef.current = L.layerGroup().addTo(map);
    const kick = ()=> map.invalidateSize(); kick(); const t = setTimeout(kick, 180); window.addEventListener('resize', kick);
    return ()=>{ clearTimeout(t); window.removeEventListener('resize', kick); obs.disconnect(); map.remove(); mapRef.current = null; layerRef.current = null; };
  }, [asTable, empty]);

  /* ---- draw markers ---- */
  useEffect(()=>{
    const map = mapRef.current, layer = layerRef.current; if(!map || !layer || asTable || empty) return;
    layer.clearLayers();
    const colors = {}; cats.forEach(c=> colors[c] = cssColor(D.COLOUR[c]));
    if(each){
      const maxV = Math.max(...shown.map(v=> val(v.id)), 0.01);
      cities.forEach(g=>{ const n = g.items.length;
        g.items.forEach((v,i)=>{
          const r = D.cat(v.id), a = val(v.id), d = Math.round(14 + Math.sqrt(a/maxV)*18);       // dot 14–32px
          const rad = n<2? 0 : 12 + n*3.2, ang = 2*Math.PI*i/n - Math.PI/2;                     // ring around the city
          const dx = Math.cos(ang)*rad, dy = Math.sin(ang)*rad, on = hit===v.id;
          const icon = L.divIcon({ className:'leaflet-div-icon px-cmap-dot'+(on?' on':''), iconSize:[d,d], iconAnchor:[d/2-dx, d/2-dy],
            html:'<span style="background:'+colors[r.approved]+'"></span>' });
          const m = L.marker([g.lat, g.lng], { icon, title:v.name, zIndexOffset: on? 1000 : Math.round(30-d) });
          m._cityKey = g.key; m._vid = v.id;
          m.bindTooltip('<strong>'+FCT.esc(v.name)+'</strong><br>'+FCT.esc(v.id)+' · '+FCT.esc(g.city)+'<br>'+FCT.esc(r.approved)+' '+r.score+' · '+FCT.esc(cr(a))+' '+D.valueLabel,
            { direction:'top', offset:[dx, dy-d/2-2], opacity:1, className:'px-cmap-tip' });
          // mousedown, not click: Leaflet retargets click to the marker pane when z-order changes between down and up
          m.on('mousedown', (e)=>{ L.DomEvent.stop(e); if(hitRef.current===v.id) onOpen(v.id); else { setHit(v.id); setCityKey(g.key); } });
          m.addTo(layer);
        });
      });
    } else {
      const maxV = Math.max(...cities.map(g=> g.val), 0.01);
      cities.forEach(g=>{
        const d = Math.round(26 + Math.sqrt(g.val/maxV)*16), h = d + 11;                        // pin 26–42px + stem
        const tot = g.parts.reduce((s,p)=> s+p.n, 0); let acc = 0;
        const stops = g.parts.map(p=>{ const a = acc/tot*360; acc += p.n; return colors[p.cat]+' '+a.toFixed(1)+'deg '+(acc/tot*360).toFixed(1)+'deg'; }).join(',');
        const icon = L.divIcon({ className:'leaflet-div-icon px-cmap-pin'+(cityKey===g.key?' on':''), iconSize:[d,h], iconAnchor:[d/2, h-1],
          html:'<span class="seal" style="width:'+d+'px"><span class="name">'+FCT.esc(g.city)+'</span><span class="head" style="width:'+d+'px;height:'+d+'px;background:conic-gradient('+stops+')"><span class="well"><em>'+g.items.length+'</em></span></span><span class="stem"></span></span>' });
        const m = L.marker([g.lat, g.lng], { icon, title:g.city, zIndexOffset: cityKey===g.key? 1000 : Math.round(40-d) });
        m._cityKey = g.key;
        m.bindTooltip('<strong>'+FCT.esc(g.city)+'</strong><br>'+FCT.esc(g.region)+' · '+g.items.length+' '+D.noun+'<br>'+FCT.esc(cr(g.val))+' '+D.valueLabel+'<br>'+FCT.esc(g.parts.map(p=> p.cat+' '+p.n).join(' · ')),
          { direction:'top', offset:[0, -h-4], opacity:1, className:'px-cmap-tip' });
        m.on('click', ()=>{ setHit(null); setCityKey(k=> k===g.key? null : g.key); });
        m.addTo(layer);
      });
    }
    map.invalidateSize();
    if(cities.length && !hit) map.fitBounds(L.latLngBounds(cities.map(g=> [g.lat, g.lng])), { padding:[42,42], maxZoom: cities.length<3? 7 : 5, animate:true });
  }, [sig, asTable, empty, each]);

  /* ---- selection highlight without redrawing ---- */
  useEffect(()=>{ const layer = layerRef.current; if(!layer) return;
    layer.eachLayer(m=>{ const el = m.getElement(); if(!el) return;
      const on = each? m._vid===hit : m._cityKey===cityKey; el.classList.toggle('on', on); m.setZIndexOffset(on? 1000 : 0); });
  }, [cityKey, sig, hit, each]);

  const flyTo = (lat, lng)=>{ const map = mapRef.current; if(map) map.flyTo([lat, lng], Math.min(8, Math.max(map.getZoom(), 6)), { duration:.55 }); };
  const focusCity = (g)=>{ setCityKey(g.key); flyTo(g.lat, g.lng); };
  const pick = (v)=>{ if(hit===v.id) return onOpen(v.id); setHit(v.id); setCityKey(v.geo.region+'|'+v.geo.city); flyTo(v.geo.lat, v.geo.lng); };

  /* ---- side panel: follows the toggle ---- */
  const tag = (v)=>{ const r = D.cat(v.id); return html`<${P.RiskTag} cat=${r.approved} score=${r.score} small=${true}/>`; };
  const cityList = (rows)=> html`<ul>${rows.slice().sort((a,b)=> (b.id===hit)-(a.id===hit)).map(v=> html`<li key=${v.id} class=${hit===v.id?'hit':''}>
      <button type="button" onClick=${()=> onOpen(v.id)}><span class="nm">${v.name}</span>${tag(v)}<span class="vm">${v.id} · ${cr(val(v.id))} ${D.valueLabel}</span></button></li>`)}</ul>`;
  const hv = hit && shown.find(v=> v.id===hit);
  const entityPanel = html`<div class="hd"><div><b>${hv? hv.name : 'All '+D.noun}</b><div class="faint">${hv? hv.id+' · '+hv.geo.city+', '+hv.geo.region+' · '+cr(val(hv.id))+' '+D.valueLabel
        : shown.length+' '+D.noun+' · '+cr(total)+' '+D.valueLabel+'. Select one to find it on the map; select again to open its profile.'}</div></div>
      ${hv && html`<span><button type="button" class="btn sm primary" onClick=${()=> onOpen(hv.id)}>Open profile</button> <button type="button" class="px-link sm" onClick=${()=>{ setHit(null); setCityKey(null); }}>Clear</button></span>`}</div>
    <ul>${shown.slice().sort((a,b)=> val(b.id)-val(a.id)).map(v=> html`<li key=${v.id} class=${hit===v.id?'hit':''}>
      <button type="button" onClick=${()=> pick(v)} onDoubleClick=${()=> onOpen(v.id)}><span class="nm">${v.name}</span>
        <span class="num">${cr(val(v.id))} <small class="faint">${pct(total? val(v.id)/total*100 : 0, 0)}</small></span>
        <span class="vm">${v.id} · ${v.geo.city} · ${tag(v)}</span></button></li>`)}</ul>`;
  const cityPanel = sel
    ? html`<div class="hd"><div><b>${sel.city}</b><div class="faint">${sel.region} · ${sel.items.length} ${D.noun} · ${cr(sel.val)} ${D.valueLabel}</div></div>
        <span><button type="button" class="btn sm" onClick=${()=> drill('city', sel.key, sel.city)}>Drill in</button> <button type="button" class="px-link sm" onClick=${()=> setCityKey(null)}>All cities</button></span></div>${cityList(sel.items)}`
    : html`<div class="hd"><div><b>Cities</b><div class="faint">${shown.length} ${D.noun} in ${cities.length} cities · ${cr(total)} ${D.valueLabel}</div></div></div>
        <ul>${cities.map(g=> html`<li key=${g.key}><button type="button" onClick=${()=> focusCity(g)} onDoubleClick=${()=> drill('city', g.key, g.city)}>
          <span class="nm">${g.city}</span><span class="num">${cr(g.val)} <small class="faint">${pct(total? g.val/total*100 : 0, 0)}</small></span>
          <span class="vm">${g.region} · ${g.items.length} · ${g.parts.map(p=> p.cat[0]+p.n).join(' ')}</span></button></li>`)}</ul>`;

  /* ---- region footer ---- */
  const regs = D.REGIONS.map(r=>{ const cs = cities.filter(g=> g.region===r);
      return { key:r, label:r, n:cs.reduce((t,g)=> t+g.items.length, 0), cities:cs.length, val:cs.reduce((t,g)=> t+g.val, 0) }; })
    .filter(t=> t.n).sort((a,b)=> b.val-a.val);
  const note = regs.length && total? regs[0].label+' holds '+pct(regs[0].val/total*100,0)+' of '+D.valueLabel+' ('+cr(regs[0].val)+'). '+cities[0].city+' is the largest city at '+cr(cities[0].val)+'.' : null;

  const tsub = (t)=> html`<em class="ar">${cr(t.val)} ${D.valueLabel}</em>`;
  return html`<${P.Card} title="Map analytics" className="px-cmap-card" right=${html`<span class="px-cmap-tg">
      <span class="px-seg" role="radiogroup" aria-label="Map markers">
        <button type="button" role="radio" aria-checked=${!each} class=${!each?'on':''} onClick=${()=> setEach(false)}>Grouped by city</button>
        <button type="button" role="radio" aria-checked=${each} class=${each?'on':''} onClick=${()=> setEach(true)}>Individual ${D.noun}</button></span>
      <button type="button" class="px-link sm" onClick=${()=> setAsTable(!asTable)}>${asTable? 'Show map' : 'Show as table'}</button></span>`}>
    <div class="px-cmap-f px-cmap-hero">
      <div class="px-seg" role="group" aria-label="Risk"><span class="l">Risk</span>
        <button type="button" class=${allRisks?'on':''} aria-pressed=${allRisks} onClick=${()=>{ setRiskOn(null); setCityKey(null); }}>All<small>${rT.All.n}</small>${tsub(rT.All)}</button>
        ${cats.map(c=> html`<button key=${c} type="button" class=${!allRisks && risks.includes(c)?'on':''} aria-pressed=${risks.includes(c)}
            disabled=${!rT[c].n && !(!allRisks && risks.includes(c))} onClick=${()=> toggleRisk(c)}><i class="dot" style=${{background:D.COLOUR[c]}}/>${c}<small>${rT[c].n}</small>${tsub(rT[c])}</button>`)}</div>
      <div class="px-seg" role="group" aria-label="Geography"><span class="l">Geography</span>
        <button type="button" class=${geo==='All'?'on':''} aria-pressed=${geo==='All'} onClick=${()=>{ setGeo('All'); setCityKey(null); }}>All<small>${gT.All.n}</small>${tsub(gT.All)}</button>
        ${D.REGIONS.map(r=> html`<button key=${r} type="button" class=${geo===r?'on':''} aria-pressed=${geo===r} disabled=${!gT[r].n && geo!==r}
            onClick=${()=>{ setGeo(r); setCityKey(null); }}>${r}<small>${gT[r].n}</small>${tsub(gT[r])}</button>`)}</div>
    </div>
    ${empty? html`<${P.Empty} text=${'No '+D.noun+' match this risk and geography.'}/>`
      : asTable? html`<${P.Table} rows=${cities} rowKey=${(g)=> g.key} caption=${D.noun+' by city'} sel=${cityKey}
          onSelect=${(g)=> setCityKey(g.key)} onOpen=${(g)=> drill('city', g.key, g.city)}
          cols=${[{ k:'c', l:'City', fmt:(g)=> html`<b>${g.city}</b><div class="sub">${g.region}</div>`, sv:(g)=> g.city },
                  { k:'n', l:'Count', r:true, fmt:(g)=> g.items.length, sv:(g)=> g.items.length },
                  { k:'k', l:'Risk mix', fmt:(g)=> html`<span class="px-cmap-mix">${g.parts.map(p=> html`<i key=${p.cat} style=${{background:D.COLOUR[p.cat], flex:p.n}}/>`)}</span>` },
                  { k:'v', l:D.valueLabel, r:true, fmt:(g)=> cr(g.val), sv:(g)=> g.val },
                  { k:'s', l:'Share', r:true, fmt:(g)=> pct(total? g.val/total*100 : 0, 0), sv:(g)=> g.val }]}/>`
      : !window.L? html`<${P.Empty} text="The map could not be loaded."/>`
      : html`<div class="px-cmap-stage">
          <div class="px-cmap-map" ref=${host} role="application" aria-label=${'Map of '+D.noun+' by city'}></div>
          <aside class="px-cmap-side" aria-label=${each? D.noun : sel? sel.city : 'Cities'}>${each? entityPanel : cityPanel}</aside></div>`}
    ${!empty && html`<div class="px-cmap-reg">${note && html`<${P.AI}>${note}</${P.AI}>`}
      <${P.BarList} rows=${regs.map(t=> ({ key:t.key, label:t.label, val:t.val, sub:t.n+' '+D.noun+' · '+t.cities+' cities · '+pct(t.val/total*100,0)+' of total' }))}
        label=${D.valueLabel+' by region'} fmt=${cr} max=${Math.max(...regs.map(t=> t.val), 0.01)} sel=${geo==='All'? null : geo}
        onSelect=${(r)=>{ setGeo(geo===r.key? 'All' : r.key); setCityKey(null); }} onOpen=${(r)=> drill('region', r.key, r.key)}/></div>`}
  </${P.Card}>`;
}
```

### Search (page header)

```js
function EntitySearch({ f, onOpen }){
  const [q, setQ] = useState(''), [hi, setHi] = useState(0), t = q.trim().toLowerCase();
  const hits = !t? [] : D.entities(f).filter(v=> [v.name, v.id, v.geo && v.geo.city, v.parentName].some(x=> x && x.toLowerCase().includes(t)))
    .sort((a,b)=> b.name.toLowerCase().startsWith(t) - a.name.toLowerCase().startsWith(t) || a.name.localeCompare(b.name)).slice(0, 8);
  const go = (v)=>{ if(v){ setQ(''); onOpen(v.id); } };
  const key = (e)=>{ if(e.key==='ArrowDown'){ e.preventDefault(); setHi(Math.min(hi+1, hits.length-1)); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); setHi(Math.max(hi-1, 0)); } else if(e.key==='Enter') go(hits[hi]); else if(e.key==='Escape') setQ(''); };
  return html`<div class="px-csearch" role="search"><${Icon} n="Search" size=${18}/>
    <input type="search" value=${q} placeholder=${'Find a '+D.noun.replace(/s$/,'')+' on the map'} aria-label="Search" aria-autocomplete="list" aria-expanded=${hits.length>0}
      onInput=${(e)=>{ setQ(e.target.value); setHi(0); }} onKeyDown=${key}/>
    ${t && html`<ul class="px-csearch-l" role="listbox">${hits.length? hits.map((v,i)=> html`<li key=${v.id} role="option" aria-selected=${i===hi}>
        <button type="button" class=${i===hi?'on':''} onMouseEnter=${()=> setHi(i)} onClick=${()=> go(v)}>
          <span class="nm">${v.name}</span><span class="vm">${v.id} · ${v.geo? v.geo.city : ''}</span></button></li>`)
      : html`<li class="none">No match for “${q}”.</li>`}</ul>`}</div>`;
}
```

### Wiring on the screen

```js
// in App: const [found, setFound] = useState(null);
html`<div class="px-page-h px-page-hs"><h1>${screenTitle}</h1>
  <${EntitySearch} f=${f} onOpen=${(id)=> setFound({ id, t:Date.now() })}/></div>`   // t forces a re-fly when the same entity is searched twice

const GL = { city:'City: ', region:'Region: ' };
const onGroup = (dim, key, label, risks)=> dispatch({ t:'drill', node:{ t:'group', dim, key, risks:risks||undefined,
  label: GL[dim]+label+(risks? ' · '+risks.join(', ')+' risk' : '') } });
html`<${EntityMap} f=${f} onOpen=${(id)=> dispatch({ t:'drill', node:{ t:'profile', id } })} onGroup=${onGroup} found=${found}/>`

// group screen must honour the risks carried in the node:
let rows = entities(f).filter(v=> top.dim==='city'? v.geo.region+'|'+v.geo.city===top.key : v.geo.region===top.key);
if(top.risks) rows = rows.filter(v=> top.risks.includes(D.cat(v.id).approved));
```

### CSS (complete)

These rules rely on theme tokens: `--card --card-line --well --line --line-strong --surface --hover --ink --ink-2 --ink-3 --kc` (the tower accent) and `--brass`. A light theme is selected with `body.theme-light`.

```css
.px-cmap-card .px-ch{margin-bottom:2px}
.px-cmap-f{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:8px 0 12px}
.px-cmap-f .px-seg{margin:0}
.px-cmap-f .px-seg button:disabled{opacity:.38;cursor:not-allowed}
.px-cmap-stage{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,260px);gap:12px;align-items:stretch}
.px-cmap-map.leaflet-container{height:520px;border-radius:12px;overflow:hidden;border:1px solid var(--card-line);background:#2b2b2b;z-index:0}
body.theme-light .px-cmap-map.leaflet-container{background:#e6e4df}
.px-cmap-map,.px-cmap-map .leaflet-container{cursor:default}
.px-cmap-map .leaflet-control-attribution{background:color-mix(in srgb,var(--card) 82%,transparent);color:var(--ink-3);font-size:10px;max-width:70%}
.px-cmap-map .leaflet-control-attribution a{color:var(--ink-2)}
/* city pin */
.leaflet-div-icon.px-cmap-pin{background:transparent;border:0;overflow:visible}
.px-cmap-pin .seal{position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer}
.px-cmap-pin .name{position:absolute;left:50%;bottom:calc(100% + 4px);transform:translateX(-50%);display:none;padding:2px 7px 3px;border-radius:4px;background:#1C1916;color:#F3EEE4;font-size:11px;font-weight:500;line-height:1.3;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.35)}
.px-cmap-pin.on .name,.px-cmap-pin:hover .name{display:block}
.px-cmap-pin .head{display:flex;align-items:center;justify-content:center;border-radius:50%;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 5px 10px rgba(0,0,0,.32)}
.px-cmap-pin .well{width:58%;height:58%;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#161311;box-shadow:inset 0 1px 1px rgba(255,255,255,.14)}
.px-cmap-pin .well em{font-style:normal;font-weight:600;font-size:11px;line-height:1;font-variant-numeric:tabular-nums;color:#F3EEE4;pointer-events:none}
.px-cmap-pin .stem{width:2px;height:7px;margin-top:-1px;border-radius:1px;background:#E8E2D6;position:relative}
.px-cmap-pin .stem:after{content:"";position:absolute;left:50%;bottom:-2px;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:#E8E2D6;box-shadow:0 2px 3px rgba(0,0,0,.45)}
.px-cmap-pin.on .head,.px-cmap-pin:focus-visible .head{box-shadow:0 0 0 2px var(--brass,#E0B25A),inset 0 1px 0 rgba(255,255,255,.28),0 8px 16px rgba(0,0,0,.4)}
body.theme-light .px-cmap-pin .name{background:#fff;color:#15211F;box-shadow:0 4px 12px rgba(20,40,36,.16)}
body.theme-light .px-cmap-pin .well{background:#fff;box-shadow:inset 0 0 0 1px rgba(21,33,31,.08)}
body.theme-light .px-cmap-pin .well em{color:#15211F}
body.theme-light .px-cmap-pin .stem,body.theme-light .px-cmap-pin .stem:after{background:#3E4C48;box-shadow:none}
@media (prefers-reduced-motion:no-preference){.px-cmap-pin .seal{transition:transform .16s ease}.px-cmap-pin:hover .seal{transform:translateY(-3px)}}
/* individual dot */
.leaflet-div-icon.px-cmap-dot{background:none;border:0}
.px-cmap-dot span{display:block;width:100%;height:100%;border-radius:50%;border:1.5px solid rgba(255,255,255,.85);box-shadow:0 1px 4px rgba(0,0,0,.45);opacity:.92;transition:transform .15s}
.px-cmap-dot:hover span{transform:scale(1.15)}
.px-cmap-dot.on span{border:3px solid #fff;outline:3px solid var(--kc,#4FB3A3);transform:scale(1.35);opacity:1}
/* tooltip */
.leaflet-tooltip.px-cmap-tip{background:var(--card);color:var(--ink);border:1px solid var(--card-line);border-radius:8px;box-shadow:0 10px 28px rgba(0,0,0,.32);padding:8px 10px;font:12px/1.45 inherit}
.leaflet-tooltip.px-cmap-tip strong{font-weight:600}
.leaflet-tooltip-top.px-cmap-tip::before{border-top-color:var(--card)}
/* side panel */
.px-cmap-side{background:var(--well);border:1px solid var(--card-line);border-radius:10px;min-height:0;max-height:520px;overflow:auto;display:flex;flex-direction:column}
.px-cmap-side .hd{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;padding:10px 12px;border-bottom:1px solid var(--card-line);position:sticky;top:0;background:var(--well);z-index:1}
.px-cmap-side .hd b{font-size:13px}
.px-cmap-side .hd .faint{font-size:11px;margin-top:2px}
.px-cmap-side ul{list-style:none;margin:0;padding:0}
.px-cmap-side li button{display:flex;flex-wrap:wrap;gap:2px 8px;align-items:center;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line);padding:8px 12px;cursor:pointer;font:inherit;color:inherit}
.px-cmap-side li button:hover{background:var(--hover)}
.px-cmap-side li.hit>button{background:color-mix(in srgb,var(--kc,#4FB3A3) 18%,transparent);box-shadow:inset 3px 0 0 var(--kc,#4FB3A3)}
.px-cmap-side .nm{flex:1;min-width:0;font-weight:600;font-size:12px}
.px-cmap-side .vm{flex:1 0 100%;font-size:11px;color:var(--ink-3)}
.px-cmap-side .num small{font-weight:500}
.px-cmap-mix{display:flex;height:8px;width:88px;border-radius:4px;overflow:hidden;gap:1px}
.px-cmap-mix i{display:block;min-width:3px}
@media (max-width:900px){.px-cmap-stage{grid-template-columns:1fr}.px-cmap-map.leaflet-container{height:420px}.px-cmap-side{max-height:260px}}
.px-cmap-reg{margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}
.px-cmap-reg .px-ai{margin:0 0 10px}
/* hero tiles */
.px-cmap-hero{display:grid;grid-template-columns:1fr;gap:12px;margin:10px 0 16px}
.px-cmap-hero .px-seg{background:none;display:grid;grid-template-columns:96px repeat(auto-fit,minmax(112px,1fr));gap:8px;border:0;border-radius:0;overflow:visible;align-items:stretch}
.px-cmap-hero .px-seg .l{align-self:center;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)}
.px-cmap-hero .px-seg button{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:10px 14px 11px;border:1px solid var(--line-strong);border-radius:8px;background:var(--surface);font-size:13px;font-weight:500;color:var(--ink-2);text-align:left;transition:border-color .15s,background .15s,transform .15s}
.px-cmap-hero .px-seg button small{background:none;padding:0;margin:0;font-size:24px;line-height:1;font-weight:600;color:inherit;font-variant-numeric:tabular-nums}
.px-cmap-hero .px-seg button .dot{width:10px;height:10px;border-radius:3px;margin-right:6px;display:inline-block;vertical-align:-1px}
.px-cmap-hero .px-seg button em.ar{font-style:normal;font-size:11.5px;font-weight:500;opacity:.8;font-variant-numeric:tabular-nums}
.px-cmap-hero .px-seg button:hover:not(:disabled){transform:translateY(-1px)}
.px-cmap-hero .px-seg button.on{background:var(--kc,#4FB3A3);border-color:transparent;color:#06201D;font-weight:600}
body.theme-light .px-cmap-hero .px-seg button.on{color:#fff}
@media (max-width:700px){.px-cmap-hero .px-seg{grid-template-columns:repeat(2,1fr)}.px-cmap-hero .px-seg .l{grid-column:1/-1}}
.px-cmap-tg{display:inline-flex;align-items:center;gap:12px}
/* header search */
.px-page-hs{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.px-csearch{position:relative;display:flex;align-items:center;gap:8px;width:min(340px,100%);padding:0 10px;border:1px solid var(--line-strong);border-radius:7px;background:var(--surface);color:var(--ink-2)}
.px-csearch:focus-within{border-color:var(--kc,#4FB3A3)}
.px-csearch input{flex:1;min-width:0;border:0;outline:0;background:none;color:var(--ink);font-size:13px;padding:7px 0}
.px-csearch-l{position:absolute;right:0;top:calc(100% + 4px);width:min(380px,92vw);z-index:1200;list-style:none;margin:0;padding:4px;border:1px solid var(--line-strong);border-radius:10px;background:var(--surface);box-shadow:0 12px 28px rgba(0,0,0,.35);max-height:360px;overflow:auto}
.px-csearch-l button{display:grid;grid-template-columns:1fr auto;gap:2px 10px;width:100%;text-align:left;padding:8px 10px;border:0;border-radius:6px;background:none;color:var(--ink);cursor:pointer}
.px-csearch-l button.on{background:color-mix(in srgb,var(--kc,#4FB3A3) 14%,transparent)}
.px-csearch-l .nm{font-weight:600}.px-csearch-l .vm{grid-column:1/-1;font-size:11.5px;color:var(--ink-2)}
.px-csearch-l .none{padding:10px;color:var(--ink-2);font-size:13px}
```

---

## 6. Behaviour rules (the contract)

1. **The map is locked.** No drag, wheel, double-click, touch or box zoom, keyboard, or zoom control. Only the tiles, the side panel, search and markers move it. This is deliberate: it is a controlled analytic view, not a GIS tool.
2. **The view auto-fits** to the visible cities after any tile change: padding 42, max zoom 5 (7 when there are fewer than 3 cities). Exception: while an entity is selected (`hit`), keep the user's focus.
3. **Selecting a city** (pin or list) flies to zoom `clamp(current, 6, 8)`. Search flies to zoom 7.
4. **The tiles are the filter.** Selecting a risk tile when All is active isolates it; later clicks add or remove categories; selecting every category again resets to All. Geography is single-select. Any tile change clears the city selection.
5. **Cross-filtering is required.** No tile may show a number that differs from what the map and panel show for the same selection.
6. **The ribbon filters still apply** and reset the local tiles when they change.
7. **The side panel follows the toggle.** Grouped mode lists cities, then entities. Individual mode lists entities. The toggle is remembered (`P.store('mapEach')`). Switching clears the city selection; switching to grouped also clears the entity selection.
8. **Two-step open** in individual mode: select first, then open. This avoids accidental navigation on a dense map.
9. **Drill-down carries the context.** A group node includes `risks` when not all are selected, and its label says so. The group screen filters by those risks.
10. **The table view** ("Show as table") gives the same cities as a sortable table, for accessibility and export.

## 7. Honesty and accessibility

- **Label demo locations as illustrative.** They are seeded from IDs, not real addresses.
- **Totals must reconcile to the KPI sheet.** The caption says "Totals reconcile to the KPI sheet" only when a test proves it.
- **Never sum ratios** (section 3).
- **Never sum scenario or alternative amounts.**
- **Colour is never the only signal.** Tooltips and lists name the category, and the table view shows the mix as labelled bars.
- **Markers have `title`s; the map has `role="application"` and an `aria-label`.** Tiles use `aria-pressed`, the toggle uses `role="radio"`, and search uses `role="listbox"`.

## 8. Tests (definition of done)

Model tests (node):
- The sum of `value` over all mapped entities equals the KPI-sheet headline under the same filter, to within 0.01.
- Every entity in `entities(f)` has `geo.lat` and `geo.lng`; none fall outside the configured regions.
- City assignment is stable: the same ID gives the same city across reloads.

Browser checks (Playwright against a local server):
- **Tile cross-filter.** Pick one region and one risk. The risk tile's count and value equal the side-panel header and the number of markers.
- **Locked map.** A wheel event and a mouse drag leave `map.getCenter()` and `getZoom()` unchanged.
- **Small region.** Selecting a region with 2 cities (for example Europe) zooms to those cities.
- **Toggle.** In grouped mode, side-panel rows = number of cities. In individual mode, rows = number of entities. In individual mode, choose a region, check the count and value, then select an entity: the dot gets class `on`. Select it again and the profile opens.
- **Search.** Type part of a name, press Enter: the map flies there, the city is selected, and the profile is one click away.
- **Drill.** "Drill in" with a risk filter, then reload: the breadcrumb and rows still match.
- There are no console errors in either theme.

## 9. Pitfalls already hit (do not repeat)

| Symptom | Cause | Fix |
|---|---|---|
| White squares behind dots | Leaflet's default `.leaflet-div-icon` background | `.leaflet-div-icon.px-cmap-dot{background:none;border:0}` (higher specificity) |
| Clicking a dot opened the wrong entity | Z-order changed between mousedown and mouseup, so Leaflet retargeted `click` | Handle `mousedown` with `L.DomEvent.stop` and read the selection from a ref (`hitRef`), not stale state |
| Double-click to open was unreliable | Same retargeting | Two-step select-then-open |
| Selected tile lost the tower colour | A new base rule overrode the theme's `.on` | Set `.on` background explicitly to `var(--kc)` |
| Map rendered grey or half-size | The container was sized after Leaflet initialised | `invalidateSize()` now, again after 180ms, and on resize |
| The map fitted the whole world | A single far-away outlier city | Fit to the cities shown (the region tiles narrow it), with a capped max zoom |
| Leaflet could not read colours | CSS variables do not resolve in HTML strings or conic gradients | `cssColor()` resolves tokens to rgb before building icons |
| A seeded high-risk segment showed ₹0 overdue | A seed artefact, not a code bug | Check seed distributions when a tile looks wrong |

## 10. Optional extension: location-risk lenses

O2C built and then **removed from screen** a "Location risk" model. It is still in `M.locRisk(f)` in `assets/js/o2c/o2c-model.js`, and `config.loc` in `data/o2c/master.js` provides the data. A future tower can revive it as extra tile rows or map colourings:

- **City concentration:** each city's share of value, a cumulative curve, top-3 share, and HHI = Σ share². Above 0.25 is concentrated.
- **Collection by place:** overdue ÷ value per city. Only cities with at least 2% share qualify, so tiny bases do not show 100%.
- **Hazard exposure:** each city is tagged with flood, cyclone, quake, heat or fire; the measure is the value in each hazard zone.
- **Public-sector / SOE share:** value with state or central government owners, broken down by state.
- **Parent-group concentration:** value rolled up to the ultimate parent.

All of these are illustrative tags. Label them that way, and never add up exposures across hazards, because one city can carry several hazards.
