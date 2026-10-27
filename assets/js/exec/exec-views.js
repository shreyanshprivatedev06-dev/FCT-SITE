/* FCT executive layer: data, filters, twin and rendering. */
(function(){
  if(!window.FCT||!FCT_DATA||!FCT.requireAuth())return;

  var D=FCT_DATA;
  var FILTER_KEY="fct-executive-filters-v1";
  var PERIODS=["Apr-26","May-26","Jun-26","Jul-26","Aug-26","Sep-26"];
  var ENTITY_REGIONS={"IN-01":"North India","IN-02":"North India","IN-03":"North India",
    "IN-04":"West India","IN-05":"West India","IN-06":"West India",
    "IN-07":"South India","IN-08":"South India","US-01":"North America","EU-01":"Europe"};
  var FILTERS={period:D.meta.period,bu:"All",region:"All",category:"All",risk:"All"};
  try{
    var savedFilters=JSON.parse(localStorage.getItem(FILTER_KEY)||"null");
    if(savedFilters&&typeof savedFilters==="object"){
      FILTERS.period=PERIODS.indexOf(savedFilters.period)>-1?savedFilters.period:FILTERS.period;
      FILTERS.bu=savedFilters.bu==="All"||D.entities.some(function(x){return x.id===savedFilters.bu;})?savedFilters.bu:"All";
      FILTERS.region=savedFilters.region==="All"||Object.keys(ENTITY_REGIONS).some(function(id){return ENTITY_REGIONS[id]===savedFilters.region;})?savedFilters.region:"All";
      FILTERS.category=["All","P2P","O2C","R2R","SC","CMP"].indexOf(savedFilters.category)>-1?savedFilters.category:"All";
      FILTERS.risk=["All","critical","high","medium","low"].indexOf(savedFilters.risk)>-1?savedFilters.risk:"All";
    }
  }catch(e){}
  var TOWERS=[
    {id:"P2P",key:"p2p",name:"Procure to Pay",url:"../p2p/desk.html"},
    {id:"O2C",key:"o2c",name:"Order to Cash",url:"../o2c/desk.html"},
    {id:"R2R",key:"r2r",name:"Record to Report",url:"../r2r/desk.html"},
    {id:"SC",key:"sc",name:"Supply Chain",url:"../sc/desk.html"},
    {id:"CMP",key:"cmp",name:"Compliance",url:"../cmp/executive.html"}
  ];
  var LINKS={p2p:"../p2p/desk.html",o2c:"../o2c/desk.html",r2r:"../r2r/desk.html",sc:"../sc/desk.html",cmp:"../cmp/executive.html"};
  var TOWER_BY_ID={};
  TOWERS.forEach(function(t){TOWER_BY_ID[t.id]=t;});
  var CONNECTIONS=[
    {a:"SC",b:"P2P",label:"Procurement and goods-receipt-to-invoice",rel:"continuity"},
    {a:"SC",b:"O2C",label:"Inventory and order fulfilment",rel:"continuity"},
    {a:"SC",b:"R2R",label:"Inventory valuation, cost of sales and provisions",rel:"controls"},
    {a:"P2P",b:"R2R",label:"Payables and expense accounting",rel:"controls"},
    {a:"O2C",b:"R2R",label:"Revenue and receivables accounting",rel:"controls"},
    {a:"CMP",b:"P2P",label:"Supplier and purchase compliance",rel:"controls"},
    {a:"CMP",b:"O2C",label:"Customer, billing and output-tax compliance",rel:"controls"},
    {a:"CMP",b:"SC",label:"Trade, product and supplier compliance",rel:"controls"},
    {a:"CMP",b:"R2R",label:"Tax reconciliation and statutory reporting",rel:"controls"}
  ];
  var CORE_CONNECTIONS=TOWERS.map(function(t){
    return {a:t.id,b:"FCT",label:t.name+" ↔ FCT Core",rel:t.id==="P2P"||t.id==="O2C"?"cash":"controls"};
  });
  function esc(v){return FCT.esc(v==null?"":v);}
  function n(v,d){return FCT.n(v,d==null?0:d);}
  function money(v){return FCT.amt(v);}
  function hasCurrentSnapshot(){return FILTERS.period===D.meta.period;}
  function exceptionMatches(x){
    if(!hasCurrentSnapshot())return false;
    if(FILTERS.bu!=="All"&&x.entity!==FILTERS.bu)return false;
    if(FILTERS.region!=="All"&&ENTITY_REGIONS[x.entity]!==FILTERS.region)return false;
    if(FILTERS.category!=="All"&&x.tower!==FILTERS.category)return false;
    if(FILTERS.risk!=="All"&&x.severity!==FILTERS.risk)return false;
    return true;
  }
  function openAll(){return FCT.openFor("ALL").filter(exceptionMatches);}
  function openForTower(tower){return openAll().filter(function(x){return x.tower===tower||(x.also||[]).indexOf(tower)>-1;});}
  function primaryOpen(tower){return openAll().filter(function(x){return x.tower===tower;});}
  function updateFilterStatus(){
    var el=document.getElementById("filterStatus");
    if(!el)return;
    var scope=[];
    if(FILTERS.bu!=="All")scope.push("BU "+FILTERS.bu);
    if(FILTERS.region!=="All")scope.push(FILTERS.region);
    if(FILTERS.category!=="All")scope.push(FILTERS.category+" category");
    if(FILTERS.risk!=="All")scope.push(FILTERS.risk+" risk");
    var historical=hasCurrentSnapshot()?"":" Exception and KPI snapshots are available for Sep-26 only; tower health scores are available for Apr–Sep where the tower defines one.";
    el.textContent=(scope.length?"Exception and linked-risk views scoped to "+scope.join(" · ")+". ":"")+
      ((FILTERS.bu!=="All"||FILTERS.region!=="All")?"Group-level exceptions without an entity/region are excluded. ":"")+
      historical.replace(/^ /,"");
    el.hidden=!el.textContent;
  }
  function initFilters(){
    var bu=document.getElementById("filterBU");
    D.entities.forEach(function(entity){
      var option=document.createElement("option");
      option.value=entity.id;option.textContent=entity.id+" · "+entity.name;bu.appendChild(option);
    });
    var controls={period:"filterPeriod",bu:"filterBU",region:"filterRegion",category:"filterCategory",risk:"filterRisk"};
    Object.keys(controls).forEach(function(key){
      var select=document.getElementById(controls[key]);
      select.value=FILTERS[key];
      select.addEventListener("change",function(){
        FILTERS[key]=select.value;
        try{localStorage.setItem(FILTER_KEY,JSON.stringify(FILTERS));}catch(e){}
        updateFilterStatus();
        renderAll();
        refreshTwin();
      });
    });
    updateFilterStatus();
  }
  function impactAmount(items){return items.reduce(function(total,x){var v=x.impact&&x.impact.valueCr;return typeof v==="number"?total+v:total;},0);}
  function severityTone(items){
    if(items.some(function(x){return x.severity==="critical";}))return "r";
    if(items.some(function(x){return x.severity==="high";}))return "a";
    if(items.length)return "a";
    return "g";
  }
  function towerName(id){return TOWER_BY_ID[id]?TOWER_BY_ID[id].name:id;}
  function userName(id){
    var u=(D.users||[]).find(function(x){return x.id===id;});
    return u?u.name:(id||"Unassigned");
  }
  function destination(tower){
    var item=TOWER_BY_ID[tower];
    return item?item.url:"#health";
  }
  /* link to one exception inside its tower: the tower pages already read ?x=<exception id> to open that exception for action */
  function exceptionLink(x){
    var base=destination(x.tower);
    return base.charAt(0)==="#"?base:base+(base.indexOf("?")>-1?"&":"?")+"x="+encodeURIComponent(x.id);
  }
  function statusLabel(items){
    var highest=items.find(function(x){return x.severity==="critical";})||
      items.find(function(x){return x.severity==="high";});
    return highest?highest.severity:"No open critical/high item";
  }

  /* ---------- Tower health: one model feeds both the cards and the modal, so they cannot drift apart ---------- */
  var MONTHS6=["Apr-26","May-26","Jun-26","Jul-26","Aug-26","Sep-26"];
  function isNum(v){return typeof v==="number"&&isFinite(v);}
  function fmtUnit(v,unit,d){
    if(!isNum(v))return "—";
    var s=n(v,d==null?1:d);
    return unit==="%"?s+"%":unit==="days"?s+" days":unit==="₹ Cr"?s+" Cr":s;
  }
  function filterScopeText(){
    var parts=[];
    if(FILTERS.bu!=="All")parts.push("BU "+FILTERS.bu);
    if(FILTERS.region!=="All")parts.push(FILTERS.region);
    return parts.join(" · ");
  }
  function p2pFilterFor(scoped){
    return {period:FILTERS.period,bu:scoped?FILTERS.bu:"All",region:scoped?FILTERS.region:"All",cat:"All",risk:"All",vendor:null};
  }
  /* each tower with a source-defined score exposes the same model API (health / series / segComp / segCount / facts) */
  var MODEL_GET={P2P:function(){return window.P2PM;},O2C:function(){return window.O2CM;},R2R:function(){return window.R2RM;},SC:function(){return window.SCM;}};
  var SCORE_SCOPED={P2P:true,O2C:true,R2R:true,SC:false}; /* towers whose score follows the BU / region filters */
  var TOWER_NOUN={P2P:{seg:"Vendor segment",pl:"vendors"},O2C:{seg:"Customer segment",pl:"customers"},R2R:{seg:"Entity class",pl:"entities"},SC:{seg:"Material class",pl:"materials"}};
  function modelFor(id){var g=MODEL_GET[id];return g?g():null;}
  /* the O2C page keeps its filters in sessionStorage ("fct-o2c-f", see o2c-ui.js P.useFilters); the executive card follows them so both pages show the same score.
     Period always comes from the executive filter. */
  function o2cSavedFilters(){
    var M=modelFor("O2C"),out={};
    if(!M)return out;
    try{
      var raw=sessionStorage.getItem("fct-o2c-f"),saved=raw?JSON.parse(raw):null;
      if(!saved||typeof saved!=="object")return out;
      Object.keys(M.defaults).forEach(function(k){
        if(k==="period")return;
        var v=saved[k];
        if(v==null||v===M.defaults[k])return;
        if(k==="vendor"&&!(M.V&&M.V[v]))return;
        out[k]=v;
      });
    }catch(e){}
    return out;
  }
  function scopeEntries(id){
    var e=[];
    if(id==="O2C"){var sv=o2cSavedFilters();Object.keys(sv).forEach(function(k){e.push([k,sv[k]]);});}
    if(SCORE_SCOPED[id]){
      if(FILTERS.bu!=="All")e.push(["bu",FILTERS.bu]);
      if(FILTERS.region!=="All")e.push(["region",FILTERS.region]);
    }
    return e;
  }
  var SCOPE_LABEL={bu:"BU",region:"Region",cat:"Category",risk:"Risk",vendor:"Customer",pRisk:"Portfolio risk",pGeo:"Geography",pSeg:"Segment"};
  function scopeText(id){
    var seen={};
    scopeEntries(id).forEach(function(p){seen[p[0]]=p[1];});
    return Object.keys(seen).map(function(k){return (SCOPE_LABEL[k]||k)+" "+String(seen[k]).split(",").join(", ");}).join(" · ");
  }
  function modelFilter(id,scoped){
    if(id==="P2P")return p2pFilterFor(scoped);
    var M=modelFor(id),f=Object.assign({},M.defaults,{period:FILTERS.period});
    if(scoped){
      if(id==="O2C")Object.assign(f,o2cSavedFilters());
      if(FILTERS.bu!=="All")f[id==="R2R"?"entity":"bu"]=FILTERS.bu;
      if(FILTERS.region!=="All")f.region=FILTERS.region;
    }
    return f;
  }
  function bandFor(id,score){
    if(!isNum(score))return null;
    var M=modelFor(id),bands=M&&M.C&&M.C.healthBands;
    if(bands){var band=bands.filter(function(b){return score>=b.min;})[0];if(band)return band.label||band.name||band.id;}
    return score>=75?"Healthy":score>=55?"Watch":"At risk";
  }
  function bandTone(band){
    if(!band)return "n";
    return /healthy|good|strong|on track/i.test(band)?"g":/watch|attention|fair|moderate|caution/i.test(band)?"a":"r";
  }

  /* a tower whose model throws still gets a card (no score) instead of blanking the whole row; the error is logged */
  function healthSpec(id){
    try{return healthSpecRaw(id);}
    catch(err){
      console.error("Health score for "+id+" failed:",err);
      return {tower:id,pi:PERIODS.indexOf(FILTERS.period),hasScore:false,score:null,series:[],coverage:null,band:null,components:[],scopeNote:"The "+id+" health model returned an error; see the browser console.",source:id};
    }
  }
  function healthSpecRaw(id){
    var pi=PERIODS.indexOf(FILTERS.period);
    var spec={tower:id,pi:pi,hasScore:false,score:null,series:[],coverage:null,band:null,components:[],scopeNote:"",source:id};
    if(MODEL_GET[id]){
      var M=modelFor(id);
      if(!M||!M.health){
        console.warn("The "+id+" model script is not loaded on this page, so no "+id+" health score can be calculated.");
        spec.scopeNote="The "+id+" health model is not loaded on this page.";
      }else{
        var wantScope=SCORE_SCOPED[id]&&scopeEntries(id).length>0;
        var f=modelFilter(id,wantScope),h=M.health(f);
        if(wantScope&&!isNum(h.score)){
          f=modelFilter(id,false);h=M.health(f);
          spec.scopeNote="The "+id+" health model has no result for this scope ("+scopeText(id)+"), so group-level values are shown.";
        }else if(wantScope){
          spec.scopeNote="Scoped to "+scopeText(id)+(id==="O2C"?" (same filters as the O2C page)":"")+" using the "+id+" health model.";spec.scopeLabel=scopeText(id);
        }
        var valid=M.C.months.indexOf(FILTERS.period)>-1;
        spec.score=valid&&isNum(h.score)?h.score:null;
        spec.series=M.series("health",f)||[];
        spec.f=f;spec.model=M;spec.rawComps=h.comps||[];
        spec.coverage=h.coverage;
        spec.components=(h.comps||[]).map(function(c){
          var def=(M.KPI&&M.KPI[c.kpi])||{};
          return {name:c.name,value:c.v,pts:c.sc,lost:c.lost,unit:id==="P2P"?"%":(def.unit||"%")};
        });
        spec.source=id+" weighted health score";
      }
    }
    spec.hasScore=isNum(spec.score);
    spec.band=spec.hasScore?bandFor(id,spec.score):null;
    return spec;
  }
  function scoreRing(score,tone){
    var color=tone==="g"?"var(--g)":tone==="a"?"var(--a)":tone==="r"?"var(--crit)":"var(--line-strong)";
    var offset=score==null?100:100-score;
    return '<svg viewBox="0 0 42 42" role="img" aria-label="'+(score==null?"No source-defined health score":n(score)+" out of 100")+'"><circle cx="21" cy="21" r="17" fill="none" stroke="var(--line)" stroke-width="3.5"></circle><circle cx="21" cy="21" r="17" fill="none" stroke="'+color+'" stroke-width="3.5" pathLength="100" stroke-dasharray="100" stroke-dashoffset="'+offset+'" transform="rotate(-90 21 21)"></circle></svg>';
  }

  function cardComponents(k){
    return k.components.slice().sort(function(a,b){return (b.lost||0)-(a.lost||0);}).slice(0,3);
  }
  function scoreRing(score,tone){
    var color=tone==="g"?"var(--g)":tone==="a"?"var(--a)":tone==="r"?"var(--crit)":"var(--line-strong)";
    var offset=score==null?100:100-score;
    return '<svg viewBox="0 0 42 42" role="img" aria-label="'+(score==null?"No source-defined health score":n(score)+" out of 100")+'"><circle cx="21" cy="21" r="17" fill="none" stroke="var(--line)" stroke-width="3.5"></circle><circle cx="21" cy="21" r="17" fill="none" stroke="'+color+'" stroke-width="3.5" pathLength="100" stroke-dasharray="100" stroke-dashoffset="'+offset+'" transform="rotate(-90 21 21)"></circle></svg>';
  }
  function cardSpark(series,index){
    var points=series.slice(0,index+1).map(function(v,i){return isNum(v)?{v:v,i:i}:null;}).filter(Boolean);
    if(points.length<2)return "";
    var coords=points.map(function(p){return (4+p.i*76/Math.max(index,1)).toFixed(1)+","+(24-p.v/100*18).toFixed(1);});
    var last=coords[coords.length-1].split(",");
    return '<svg viewBox="0 0 84 28" role="img" aria-label="'+esc(FILTERS.period)+' health score trend"><line x1="3" x2="81" y1="10.5" y2="10.5" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 3"></line><polyline fill="none" stroke="var(--brand-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="'+coords.join(" ")+'"></polyline><circle cx="'+last[0]+'" cy="'+last[1]+'" r="2.5" fill="var(--brass)"></circle></svg>';
  }

  var healthView="cards"; /* "cards" (default) or "table" */
  function healthTableHtml(){
    var rows=TOWERS.map(function(t){
      try{
        var k=healthSpec(t.id),pi=k.pi,prior=pi>0?k.series[pi-1]:null;
        var delta=k.hasScore&&isNum(prior)?k.score-prior:null;
        var tt=delta==null?"na":delta>0?"good":delta<0?"bad":"na";
        var tx=delta==null?"—":delta===0?"No change":(delta>0?"▲ ":"▼ ")+n(Math.abs(delta))+" pts vs "+MONTHS6[pi-1];
        var tm=!k.hasScore&&hasCurrentSnapshot()?towerModel(k.tower):null;
        var tone=k.hasScore?bandTone(k.band):tm?tm.tone:"n";
        var status=k.hasScore?k.band:tm?toneWord(tm.tone):"No snapshot";
        var drivers=k.hasScore?cardComponents(k).map(function(c){return [c.name,fmtUnit(c.value,c.unit,1)];}):
          (tm?towerKpis(k.tower).slice(0,3).map(function(c){return [c[0],c[1]];}):[]);
        return '<tr class="ht-row" tabindex="0" role="button" data-health-tower="'+esc(t.id)+'" aria-label="View '+esc(t.id)+' health and key KPIs: '+esc(status)+'">'+
          '<td class="ht-tower"><b>'+esc(t.id)+'</b><small>'+esc(t.name)+'</small></td>'+
          '<td><span class="chip '+tone+'"><span class="dot"></span>'+esc(status)+'</span></td>'+
          '<td class="ht-num">'+(k.hasScore?'<b>'+n(k.score)+'</b><small> / 100</small>':'—')+'</td>'+
          '<td><span class="trend-copy '+tt+'">'+esc(tx)+'</span></td>'+
          '<td class="ht-drv">'+(drivers.length?drivers.map(function(d){return '<span><i>'+esc(d[0])+'</i> <b>'+esc(d[1])+'</b></span>';}).join(""):'<span class="no-score">'+(hasCurrentSnapshot()?"Source-defined score; open for the KPI breakdown":"No snapshot for "+esc(FILTERS.period))+'</span>')+'</td>'+
          '<td class="ht-src">'+esc(k.source)+(k.scopeLabel?' · '+esc(k.scopeLabel):'')+'</td></tr>';
      }catch(err){
        console.error("Health row for "+t.id+" failed:",err);
        return '<tr class="ht-row" data-health-tower="'+esc(t.id)+'"><td class="ht-tower"><b>'+esc(t.id)+'</b></td><td colspan="5"><span class="no-score">Health details could not be drawn. See the browser console.</span></td></tr>';
      }
    }).join("");
    return '<div class="health-table-wrap" style="grid-column:1/-1"><table class="health-table"><thead><tr><th>Tower</th><th>Status</th><th>Health score</th><th>Trend</th><th>Key drivers</th><th>Source</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  }
  function renderKpis(){
    var available=hasCurrentSnapshot();
    var healthPeriod=document.querySelector("#health .ch .r");
    if(healthPeriod){
      healthPeriod.innerHTML='<span class="chip n sq">'+esc(FILTERS.period)+(available?" · current tower scores":" · source history where available")+'</span>'+
        '<span class="health-view" role="group" aria-label="Health view"><button type="button" data-hview="table" class="'+(healthView==="table"?"on":"")+'" aria-pressed="'+(healthView==="table")+'">Table</button><button type="button" data-hview="cards" class="'+(healthView==="cards"?"on":"")+'" aria-pressed="'+(healthView==="cards")+'">Cards</button></span>';
      if(!healthPeriod.dataset.bound){
        healthPeriod.dataset.bound="1";
        healthPeriod.addEventListener("click",function(e){
          var b=e.target.closest("[data-hview]");if(!b||b.dataset.hview===healthView)return;
          healthView=b.dataset.hview;renderKpis();
        });
      }
    }
    if(healthView==="table"){document.getElementById("kpis").innerHTML=healthTableHtml();return;}
    document.getElementById("kpis").innerHTML=TOWERS.map(function(t){
      try{return healthCardHtml(healthSpec(t.id));}
      catch(err){
        console.error("Health card for "+t.id+" failed:",err);
        return '<a class="kpi tower-health-card n" href="'+destination(t.id)+'" data-health-tower="'+esc(t.id)+'"><div class="t"><span>'+esc(t.id)+'</span><span class="chip n"><span class="dot"></span>Unavailable</span></div><div class="tower-health-details"><span class="no-score">Health details could not be drawn. See the browser console.</span></div></a>';
      }
    }).join("");
  }
  function healthCardHtml(k){
    var pi=k.pi;
    var prior=pi>0?k.series[pi-1]:null;
    var delta=k.hasScore&&isNum(prior)?k.score-prior:null;
    var trendTone=delta==null?"na":delta>0?"good":delta<0?"bad":"na";
    var trendText=delta==null?"No comparable trend":delta===0?"No change":(delta>0?"▲ ":"▼ ")+n(Math.abs(delta))+" pts vs "+MONTHS6[pi-1];
    var tm=!k.hasScore&&hasCurrentSnapshot()?towerModel(k.tower):null;
    var tone=k.hasScore?bandTone(k.band):tm?tm.tone:"n";
    var status=k.hasScore?k.band:tm?toneWord(tm.tone):"No snapshot";
    var comps=k.hasScore?cardComponents(k):[];
    var detail=k.hasScore?'<div class="driver-heading">'+"Top KPI drivers"+'</div>'+
      comps.map(function(c){return '<div class="driver"><span>'+esc(c.name)+'</span><b>'+esc(fmtUnit(c.value,c.unit,1))+'</b></div>';}).join("")+
      (comps.length?"":'<span class="no-score">Source-defined score from tower KPIs. Select the card for the full KPI breakdown.</span>'):
      (tm?'<div class="driver-heading">Key indicators</div>'+towerKpis(k.tower).slice(0,3).map(function(c){return '<div class="driver"><span>'+esc(c[0])+'</span><b>'+esc(c[1])+'</b></div>';}).join(""):'<span class="no-score">No snapshot for '+esc(FILTERS.period)+'.</span>');
    var chart=k.hasScore?cardSpark(k.series,pi):"";
    return '<a class="kpi tower-health-card '+tone+'" href="'+destination(k.tower)+'" data-health-tower="'+esc(k.tower)+'" aria-haspopup="dialog" aria-label="View '+esc(k.tower)+' health and key KPIs: '+esc(status)+(k.hasScore?", health score "+n(k.score)+" out of 100":"")+'">'+
      '<div class="t"><span>'+esc(k.tower)+'</span><span class="chip '+tone+'"><span class="dot"></span>'+esc(status)+'</span></div>'+
      '<div class="tower-health-score">'+scoreRing(k.hasScore?k.score:null,tone)+'<div><div class="score">'+(k.hasScore?n(k.score):"—")+'<small> / 100</small></div><div class="score-meta"><b>'+esc(k.hasScore?k.band:status)+'</b><span>'+esc(k.hasScore?(isNum(k.coverage)?n(k.coverage*100)+"% component coverage":"Source-defined score"):"No source-defined /100 score")+'</span></div></div></div>'+
      '<div class="tower-health-trend">'+(chart?chart+'<span class="trend-copy '+trendTone+'">'+esc(trendText)+'</span>':'<span class="trend-copy na">'+(k.hasScore?"No trend available":"No source-defined score")+'</span>')+'</div>'+
      '<div class="tower-health-details">'+detail+'</div>'+
      '<div class="src">Source: '+esc(k.source)+(k.scopeLabel?' · '+esc(k.scopeLabel):'')+' · View health details →</div></a>';
  }

  /* ---------- Tower health modal ---------- */
  var HM={open:false,tower:"P2P",back:null,dialog:null,returnTower:null,seg:"All",lf:{},lshown:10,lall:false};

  function trendSvg(vals,idx){
    var pts=[],i;
    for(i=0;i<=idx&&i<vals.length;i++)if(isNum(vals[i]))pts.push({i:i,v:vals[i]});
    if(pts.length<2)return "";
    var mn=Math.min.apply(null,pts.map(function(p){return p.v;})),mx=Math.max.apply(null,pts.map(function(p){return p.v;}));
    var pad=(mx-mn)||1;mn-=pad*.2;mx+=pad*.2;
    var W=220,H=60,span=Math.max(idx,1);
    var coords=pts.map(function(p){return (6+p.i*(W-12)/span).toFixed(1)+","+(H-8-(p.v-mn)/(mx-mn)*(H-16)).toFixed(1);});
    var last=coords[coords.length-1].split(",");
    return '<svg class="hm-trend" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Trend from '+esc(MONTHS6[pts[0].i]||"")+' to '+esc(FILTERS.period)+'"><polyline fill="none" stroke="var(--brand-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="'+coords.join(" ")+'"></polyline><circle cx="'+last[0]+'" cy="'+last[1]+'" r="3.2" fill="var(--brass)"></circle></svg>'+
      '<div class="hm-trend-ends"><span>'+n(pts[0].v,1)+'</span><span>'+n(pts[pts.length-1].v,1)+'</span></div>';
  }
  function trendSeriesFor(id,spec){
    if(spec.hasScore)return {vals:spec.series,label:"Health score"};
    if(id==="O2C")return {vals:(D.o2c&&D.o2c.ptpTrend&&D.o2c.ptpTrend.dso)||[],label:"Days sales outstanding"};
    if(id==="CMP")return {vals:(D.cmp&&D.cmp.criTrend&&D.cmp.criTrend.cri)||[],label:"Compliance risk index"};
    return {vals:[],label:""};
  }
  function narrativeFor(spec){
    var pi=spec.pi,s="The score is "+n(spec.score)+" out of 100";
    var prior=pi>0&&isNum(spec.series[pi-1])?spec.series[pi-1]:null;
    if(prior!=null){
      var d=spec.score-prior;
      s+=d===0?", unchanged from "+MONTHS6[pi-1]:", "+n(Math.abs(d),1)+" point"+(Math.abs(d)===1?"":"s")+(d>0?" higher":" lower")+" than "+MONTHS6[pi-1];
    }
    s+=".";
    if(spec.rawComps){
      var top=spec.components.slice().sort(function(a,b){return (b.lost||0)-(a.lost||0);})[0];
      if(top&&top.lost>0)s+=" "+top.name+" is pulling it down the most.";
    }else if(spec.components.length){
      s+=" Largest KPI driver: "+spec.components[0].name+".";
    }
    return s;
  }
  function compCardHtml(c,tone,share){
    var showBar=c.unit==="%"&&isNum(c.value);
    var chipText=isNum(c.lost)?n(c.lost,1)+" pts lost":isNum(c.pts)?n(c.pts,1)+" pts":"";
    return '<div class="hm-comp"><div class="hm-ct"><b>'+esc(c.name)+'</b><span>'+esc(fmtUnit(c.value,c.unit,1))+'</span></div>'+
      (showBar?'<div class="hm-bar"><i class="'+tone+'" style="width:'+Math.max(0,Math.min(100,c.value))+'%"></i></div>':'')+
      '<div class="hm-cm">'+(chipText?'<span class="chip '+tone+'">'+esc(chipText)+'</span>':'')+(share!=null?'<small>'+n(share)+'% of points lost</small>':'')+'</div></div>';
  }
  function kpiCardHtml(k){
    return '<div class="hm-comp"><div class="hm-ct"><b>'+esc(k[0])+'</b></div><div class="hm-big">'+esc(k[1])+'</div>'+
      (k[2]?'<div class="hm-cm"><small>'+esc(k[2])+'</small></div>':'')+'<div class="hm-cm">'+prov(k[3])+'</div></div>';
  }
  function ageingHtml(){
    var ageing=(D.o2c&&D.o2c.ageing)||[];
    var rows=ageing.filter(function(r){return !/not due/i.test(r[0]);});
    var total=rows.reduce(function(s,r){return s+r[1];},0);
    if(!rows.length||!total)return "";
    function tone(r){return /over 90/i.test(r[0])?"r":/1–30|1-30/i.test(r[0])?"g":"a";}
    return '<div class="hm-comp hm-wide"><div class="hm-ct"><b>Overdue receivables by age</b><span>'+esc(money(total))+'</span></div>'+
      '<div class="stack">'+rows.map(function(r){return '<i title="'+esc(r[0])+': '+esc(money(r[1]))+'" style="width:'+(r[1]/total*100)+'%;background:var(--'+(tone(r)==="r"?"crit":tone(r)==="g"?"g":"a")+')"></i>';}).join("")+'</div>'+
      '<div class="legend">'+rows.map(function(r){return '<span><i style="background:var(--'+(tone(r)==="r"?"crit":tone(r)==="g"?"g":"a")+')"></i>'+esc(r[0])+': '+esc(money(r[1]))+'</span>';}).join("")+'</div></div>';
  }

  /* ---------- P2P health modal body: same model calls as the P2P tower page (P2PM.segComp / segCount / facts) ---------- */
  var P2P_MIX={
    approval:{apr:{after:"signed off only after the order was placed",level:"approved at too low a level",none:"never approved",split:"split to stay under the approval limit"}},
    match:{mr:{grMissing:"the delivery was never recorded",price:"the price differed",qty:"the quantity differed",uom:"the unit of measure differed",retro:"the PO was raised after the invoice",tax:"tax or IRN details did not match",dup:"a duplicate was suspected"}}
  };
  function mixTop(list,fn){
    var c={},best=null;
    list.forEach(function(x){var k=fn(x);if(k==null)return;c[k]=(c[k]||0)+1;if(!best||c[k]>c[best])best=k;});
    return best==null?null:{k:best,n:c[best]};
  }
  function p2pText(kpi,f,seg,sg){
    if(!sg.n)return "No eligible records in this segment for "+f.period+".";
    var fs=P2PM.facts(kpi,f).filter(function(x){return !seg||P2PM.segment(x.v)===seg;});
    var bad=fs.filter(function(x){return x.ok===false;}),b=sg.bad,pct=n(b/sg.n*100,1),t;
    if(!b)return "All "+n(sg.n)+" records are compliant.";
    if(kpi==="approval"){
      t=mixTop(bad,function(x){return x.rec.apr;});
      return n(b)+" orders ("+pct+"%) went out without the right sign-off."+(t?" Most were "+(P2P_MIX.approval.apr[t.k]||String(t.k))+" ("+n(t.n)+").":"");
    }
    if(kpi==="match"){
      t=mixTop(bad,function(x){return x.rec.mr;});
      return n(b)+" bills ("+pct+"%) did not match what was ordered or received."+(t?" Most often "+(P2P_MIX.match.mr[t.k]||String(t.k))+" ("+n(t.n)+").":"");
    }
    if(kpi==="price"){
      t=mixTop(bad,function(x){return x.g.type;});
      return n(b)+" bill lines ("+pct+"%) were outside the agreed price."+(t?" Most common: "+String(t.k).toLowerCase()+" ("+n(t.n)+").":"");
    }
    if(kpi==="mdq"){
      t=mixTop(bad,function(x){return x.g.check;});
      return n(b)+" vendor details are missing or out of date."+(t?" The most common gap: "+String(t.k).toLowerCase()+" ("+n(t.n)+").":"");
    }
    if(kpi==="grt"){
      t=mixTop(bad,function(x){return x.g.site;});
      return n(b)+" deliveries ("+pct+"%) were logged more than "+n(P2PM.C.slas.grPostHours/24)+" days after they arrived."+(t?" "+t.k+" is the slowest ("+n(t.n)+").":"");
    }
    if(kpi==="otp"){
      t=mixTop(bad,function(x){return x.g.lateness;});
      return n(b)+" bills ("+pct+"%) were paid after their due date"+(t?", most of them "+String(t.k).toLowerCase()+" ("+n(t.n)+").":".");
    }
    return "";
  }
  function inSeg(M,x,seg){return !seg||(M.segOk?M.segOk(x.v,seg):M.segment(x.v)===seg);}
  function genericText(M,kpi,f,seg,sg){
    if(!sg.n)return "No eligible records in this segment for "+f.period+".";
    if(!sg.bad)return "All "+n(sg.n)+" records are compliant.";
    var out=n(sg.bad)+" of "+n(sg.n)+" records ("+n(sg.bad/sg.n*100,1)+"%) did not pass this check.";
    try{
      var dims=((M.dims&&M.dims[kpi])||[]).filter(function(d){return d!=="vendor"&&d!=="material"&&d!=="customer"&&d!=="month";});
      if(dims.length){
        var bad=M.facts(kpi,f).filter(function(x){return inSeg(M,x,seg)&&!x.ok;});
        var t=mixTop(bad,function(x){return x.g?x.g[dims[0]]:null;});
        if(t)out+=" Most by "+String((M.dimName&&M.dimName[dims[0]])||dims[0]).toLowerCase()+": "+t.k+" ("+n(t.n)+").";
      }
    }catch(e){}
    return out;
  }
  function towerText(id,M,kpi,f,seg,sg){return id==="P2P"?p2pText(kpi,f,seg,sg):genericText(M,kpi,f,seg,sg);}
  /* segment tabs: P2P Kraljic vendor segments, O2C customer segments, SC ABC/XYZ material classes */
  function segDefs(id,M){
    if(id==="SC"&&M.SEGS&&M.SEGS.abc)return M.SEGS.abc.map(function(s){return {key:"abc:"+s.id,label:s.id,title:s.name,seg:{a:s.id}};})
      .concat(M.SEGS.xyz.map(function(s){return {key:"xyz:"+s.id,label:s.id,title:s.name,seg:{x:s.id}};}));
    return (M.SEGS||[]).map(function(s){return {key:s.id,label:s.id,title:s.desc,seg:s.id};});
  }
  function p2pToneOf(sc){return sc==null?"n":sc>=85?"g":sc>=50?"a":"r";}
  function modalParts(spec,trendBlock){
    var id=spec.tower,P=spec.model,f=spec.f,noun=TOWER_NOUN[id],defs=segDefs(id,P);
    var cur=HM.seg==="All"?null:defs.filter(function(d){return d.key===HM.seg;})[0]||null,seg=cur?cur.seg:null;
    var rows=spec.rawComps.map(function(c){
      var sg=P.segComp(c.kpi,f,seg),v,sc;
      if(!seg){v=c.v;sc=c.sc;}
      else{v=sg.rate;sc=v==null?null:Math.max(0,Math.min(100,(v-c.floor)/(c.target-c.floor)*100));}
      return {c:c,sg:sg,v:v,sc:sc};
    });
    var have=rows.filter(function(r){return r.sc!=null;}),wS=have.reduce(function(s,r){return s+r.c.w;},0);
    rows.forEach(function(r){r.lost=r.sc==null||!wS?null:r.c.w*(100-r.sc)/wS;});
    var score=!seg?spec.score:wS?Math.round(have.reduce(function(s,r){return s+r.c.w*r.sc;},0)/wS):null;
    var band=score==null?null:bandFor(id,score),tone=bandTone(band),cover=!seg?spec.coverage:wS/100;
    var prior=!seg&&spec.pi>0&&isNum(spec.series[spec.pi-1])?spec.series[spec.pi-1]:null,delta=prior==null||score==null?null:score-prior;
    var tabs='<div class="hm-seg" role="group" aria-label="'+esc(noun.seg)+'"><span>'+esc(noun.seg)+'</span>'+
      [{key:"All",label:"All",seg:null}].concat(defs).map(function(d){
        return '<button type="button" data-hm-seg="'+esc(d.key)+'" class="'+(HM.seg===d.key?"on":"")+'" aria-pressed="'+(HM.seg===d.key)+'"'+(d.title?' title="'+esc(d.title)+'"':'')+'>'+esc(d.label)+' <i>'+n(P.segCount(f,d.seg))+'</i></button>';
      }).join("")+'</div>';
    var worst=rows.filter(function(r){return r.lost>0;}).sort(function(a,b){return b.lost-a.lost;})[0];
    var segName=cur?(id==="SC"?"class "+cur.label:cur.label+" "+noun.pl):"";
    var narr=score==null?"No eligible records in this segment for "+f.period+".":
      !seg?narrativeFor(spec):"For "+segName+" the score is "+n(score)+" out of 100."+(worst?" "+worst.c.name+" is pulling it down the most.":"");
    var left=score==null?'<p class="hm-narr">'+esc(narr)+'</p>':
      '<div class="hm-ringrow"><div class="hm-ring">'+scoreRing(score,tone)+'<div class="hm-ringnum"><b>'+n(score)+'</b><small>/100</small></div></div>'+
      '<div class="hm-meta"><span class="chip '+tone+'">'+esc(band)+'</span>'+
      (delta!=null&&delta!==0?'<span class="chip '+(delta>0?"g":"r")+'">'+(delta>0?"▲ ":"▼ ")+n(Math.abs(delta),1)+' pts</span>':'')+
      '<div class="hm-kv"><span>Coverage</span><b>'+n(cover*100)+'%</b></div><div class="hm-kv"><span>Points lost</span><b>'+n(100-score)+'</b></div></div></div>'+
      (seg?'<div class="hm-trendbox"><div class="hm-sub">Trend</div><div class="note">The Apr–Sep trend is shown for all '+esc(noun.pl)+'.</div></div>':trendBlock)+
      '<p class="hm-narr">'+esc(narr)+'</p>';
    var right=rows.map(function(r){
      var t=p2pToneOf(r.sc),sg=r.sg;
      return '<div class="hm-comp"><div class="hm-ct"><b>'+esc(r.c.name)+'</b><span>'+(r.v==null?"—":esc(fmtUnit(r.v,"%",1)))+'</span></div>'+
        '<div class="hm-bar"><i class="'+t+'" style="width:'+(r.v==null?0:Math.max(0,Math.min(100,r.v)))+'%"></i></div>'+
        '<div class="hm-cm">'+(sg.vN?'<span class="chip '+t+'">'+n(sg.vPct)+'% of '+esc(noun.pl)+' affected</span><small>'+n(sg.vBad)+' of '+n(sg.vN)+'</small>':'<small>No eligible '+esc(noun.pl)+'</small>')+'</div>'+
        '<p class="hm-txt">'+esc(towerText(id,P,r.c.kpi,f,seg,sg))+'</p></div>';
    }).join("");
    return {tabs:tabs,left:left,right:right,seg:seg,segLabel:cur?(id==="SC"?cur.label:cur.label):""};
  }

  /* ---------- tower-specific list under the health modal (replaces the generic exceptions list) ---------- */
  function riskTone(r){return /crit|high/i.test(r||"")?"r":/med|moder/i.test(r||"")?"a":"g";}
  /* list filters (same pill style as the vendor-segment tabs) and paging (10 first, +5 at a time, or all) */
  function lfGet(k){return HM.lf[k]||"All";}
  function lfBar(groups){
    return '<div class="hm-lfs">'+groups.map(function(g){
      return '<div class="hm-seg" role="group" aria-label="'+esc(g.label)+'"><span>'+esc(g.label)+'</span>'+g.opts.map(function(o){
        var on=lfGet(g.key)===o[0];
        return '<button type="button" data-hm-lf="'+esc(g.key)+'" data-hm-lv="'+esc(o[0])+'" class="'+(on?"on":"")+'" aria-pressed="'+on+'">'+esc(o[1])+' <i>'+n(o[2])+'</i></button>';
      }).join("")+'</div>';
    }).join("")+'</div>';
  }
  /* defs: [{key,label,val:function(item),order:[...],labelOf:function(v)}]; counts on each option respect the other filters */
  function lfApply(items,defs){
    function pass(x,skip){return defs.every(function(d){return d.key===skip||lfGet(d.key)==="All"||d.val(x)===lfGet(d.key);});}
    var groups=defs.map(function(d){
      var seen={};items.forEach(function(x){seen[d.val(x)]=1;});
      var vals=Object.keys(seen);vals=d.order?d.order.filter(function(v){return seen[v];}):vals.sort();
      if(lfGet(d.key)!=="All"&&vals.indexOf(lfGet(d.key))<0)HM.lf[d.key]="All"; /* value no longer present in this list */
      return {key:d.key,label:d.label,vals:vals,d:d};
    });
    groups.forEach(function(g){
      g.opts=[["All","All",items.filter(function(x){return pass(x,g.key);}).length]].concat(g.vals.map(function(v){
        return [v,g.d.labelOf?g.d.labelOf(v):v,items.filter(function(x){return g.d.val(x)===v&&pass(x,g.key);}).length];
      }));
    });
    var filtered=items.filter(function(x){return pass(x);});
    return {items:filtered,all:items.length,bar:groups.length&&items.length?lfBar(groups):""};
  }
  function listShell(title,kind,thead,fl,rowFn,note){
    var items=fl.items,shown=HM.lall?items.length:Math.min(HM.lshown,items.length),canMore=!HM.lall&&items.length>shown;
    var rows=items.slice(0,shown).map(rowFn);
    var ctl=items.length>10&&(canMore||HM.lall)?'<div class="dec-more"><span class="dec-more-n">Showing '+n(shown)+' of '+n(items.length)+'</span>'+
      (canMore?'<button type="button" class="twin-flt-btn" data-hm-lmore>Show more +'+n(Math.min(5,items.length-shown))+'</button><button type="button" class="twin-flt-btn" data-hm-lall>Show all ('+n(items.length)+')</button>':
        '<button type="button" class="twin-flt-btn" data-hm-lless>Show less</button>')+'</div>':'';
    return '<div class="hm-ex"><div class="ch"><h2>'+esc(title)+' ('+n(items.length)+')</h2><div class="r">'+prov(kind)+'</div></div>'+fl.bar+
      (rows.length?'<div class="hm-tblw"><table class="hm-tbl"><thead><tr>'+thead.map(function(c){return '<th'+(c[1]?' class="num"':'')+'>'+esc(c[0])+'</th>';}).join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table></div>':
        '<div class="note">'+(fl.all?'Nothing matches the selected filters.':note)+'</div>')+ctl+
      (rows.length&&note?'<div class="note">'+note+'</div>':'')+'</div>';
  }
  function plainShell(title,count,kind,msg){
    return '<div class="hm-ex"><div class="ch"><h2>'+esc(title)+' ('+count+')</h2><div class="r">'+prov(kind)+'</div></div><div class="note">'+msg+'</div></div>';
  }
  function segOf(id,M,v){
    try{return M.segment(v)||"";}catch(e){return "";}
  }
  /* records that failed a health-score check, rolled up per vendor / customer from the same facts the score uses */
  function entityRowsFor(spec,seg){
    var M=spec.model,f=spec.f,by={},val={};
    spec.rawComps.forEach(function(c){
      var fs=[];try{fs=M.facts(c.kpi,f);}catch(e){}
      fs.forEach(function(x){
        if(!x.v||!inSeg(M,x,seg))return;
        var r=by[x.v]||(by[x.v]={v:x.v,n:0,bad:0});
        r.n++;if(x.ok===false)r.bad++;
      });
    });
    try{M.topVendors(f).rows.forEach(function(r){val[r.v]=r.spend;});}catch(e){}
    return Object.keys(by).map(function(k){by[k].val=val[k];return by[k];}).filter(function(r){return r.bad>0;})
      .sort(function(a,b){return b.bad-a.bad||b.n-a.n;});
  }
  var LIST_CFG={
    P2P:{h:"Vendors driving the score",pl:"vendors",one:"Vendor",seg:"Segment",val:"Spend",risk:"Risk"},
    O2C:{h:"Customers driving the score",pl:"customers",one:"Customer",seg:"Segment",val:"Open receivables",risk:"Credit risk"}
  };
  function modelListHtml(id,spec,seg){
    var cfg=LIST_CFG[id],M=spec.model,all=entityRowsFor(spec,seg);
    var fl={items:all,all:all.length,bar:""};
    return listShell(cfg.h+(seg&&spec.segLabel?" · "+spec.segLabel:""),"calc",
      [[cfg.one],[cfg.seg],["Failed checks",1],[cfg.val,1],[cfg.risk]],fl,function(r){
        var name=M.dimLabel?M.dimLabel("vendor",r.v):r.v,risk="";
        try{risk=M.risk(r.v).approved||"";}catch(e){}
        return '<tr><td><b>'+esc(name)+'</b><small>'+esc(r.v)+'</small></td><td>'+esc(segOf(id,M,r.v)||"—")+'</td>'+
          '<td class="num"><b>'+n(r.bad)+'</b> of '+n(r.n)+'<small>'+n(r.bad/r.n*100,1)+'% failed</small></td>'+
          '<td class="num">'+(isNum(r.val)?esc(money(r.val)):"—")+'</td>'+
          '<td>'+(risk?'<span class="chip '+riskTone(risk)+'">'+esc(risk)+'</span>':"—")+'</td></tr>';
      },all.length?'Ranked by failed records across the health components. Use the '+esc(TOWER_NOUN[id].seg.toLowerCase())+' tabs above to narrow the list.':'No '+esc(cfg.pl)+' have failed checks in this view.');
  }
  function r2rListHtml(current){
    if(!current)return plainShell("Entities","—","live","No exception snapshot for "+esc(FILTERS.period)+".");
    var ex=openForTower("R2R"),by={};
    (D.entities||[]).forEach(function(e){
      if(FILTERS.bu!=="All"&&e.id!==FILTERS.bu)return;
      if(FILTERS.region!=="All"&&ENTITY_REGIONS[e.id]!==FILTERS.region)return;
      by[e.id]={e:e,n:0,crit:0,high:0,val:0};
    });
    var loose=0;
    ex.forEach(function(x){
      var r=by[x.entity];if(!r){loose++;return;}
      r.n++;if(x.severity==="critical")r.crit++;if(x.severity==="high")r.high++;
      var v=x.impact&&x.impact.valueCr;if(typeof v==="number")r.val+=v;
    });
    var list=Object.keys(by).map(function(k){return by[k];}).sort(function(a,b){return b.n-a.n||b.crit-a.crit||String(a.e.id).localeCompare(String(b.e.id));});
    var fl=lfApply(list,[
      {key:"region",label:"Region",val:function(r){return ENTITY_REGIONS[r.e.id]||r.e.region||"Other";}},
      {key:"exposure",label:"Exposure",order:["Critical","High","Medium / low","None"],val:function(r){return r.crit?"Critical":r.high?"High":r.n?"Medium / low":"None";}}]);
    return listShell("Entities","live",[["Entity"],["Region"],["Open exceptions",1],["Critical / high",1],["Impact",1]],fl,function(r){
      var tone=r.crit?"r":r.n?"a":"g";
      return '<tr><td><b>'+esc(r.e.id)+'</b><small>'+esc(r.e.name||"")+'</small></td><td>'+esc(ENTITY_REGIONS[r.e.id]||r.e.region||"—")+'</td>'+
        '<td class="num"><span class="chip '+tone+'">'+n(r.n)+'</span></td><td class="num">'+n(r.crit)+' / '+n(r.high)+'</td><td class="num">'+(r.val?esc(money(r.val)):"—")+'</td></tr>';
    },'Open R2R-linked exceptions per entity.'+(loose?' '+n(loose)+' group-level exception'+(loose===1?'':'s')+' not tied to an entity '+(loose===1?'is':'are')+' excluded.':''));
  }
  /* CMP and SC: failing controls, picked from the tower's open exceptions */
  function controlsListHtml(id,current){
    if(!current)return plainShell("Failing controls","—","live","No exception snapshot for "+esc(FILTERS.period)+".");
    var all=sortEx(openForTower(id)),ctl=all.filter(isControlItem),useC=ctl.length>0,list=useC?ctl:all;
    var fl=lfApply(list,[
      {key:"sev",label:"Severity",order:["critical","high","medium","low"],labelOf:function(v){return v.charAt(0).toUpperCase()+v.slice(1);},val:function(x){return x.severity;}},
      {key:"ent",label:"Entity",val:function(x){return x.entity||"Group-level";}}]);
    return listShell(useC?"Failing controls":"Open exceptions","live",[["Control"],["Entity"],["Severity"],["Owner"],["Due"]],fl,function(x){
      var tone=x.severity==="critical"?"r":x.severity==="high"?"a":"g";
      return '<tr><td><a href="'+esc(exceptionLink(x))+'"><b>'+esc(x.title)+'</b></a><small>'+esc(x.id)+(x.tower!==id?' · from '+esc(x.tower):'')+'</small></td><td>'+esc(x.entity||"—")+'</td>'+
        '<td><span class="chip '+tone+'">'+esc(x.severity)+'</span></td><td>'+esc(userName(x.owner))+'</td><td>'+esc(x.due||"—")+'</td></tr>';
    },useC?'Controls are identified from open '+esc(id)+'-linked exceptions.':'No open exception is classed as a control failure, so all open '+esc(id)+'-linked exceptions are listed.');
  }
  function exceptionsListHtml(id,current){
    var ex=sortEx(openForTower(id));
    return '<div class="hm-ex"><div class="ch"><h2>Open exceptions ('+(current?n(ex.length):"—")+')</h2><div class="r">'+prov("live")+'</div></div>'+
      (current?(ex.length?ex.slice(0,3).map(function(x){return exItem(x,x.tower!==id);}).join("")+(ex.length>3?'<div class="twin-note">+'+(ex.length-3)+' more in the tower.</div>':''):'<div class="note">No open exception linked to '+esc(id)+' in the current filters.</div>'):'<div class="note">No exception snapshot for '+esc(FILTERS.period)+'.</div>')+'</div>';
  }
  function towerListHtml(id,spec,seg,segLabel,current){
    spec.segLabel=segLabel||"";
    if(LIST_CFG[id]&&spec.hasScore&&spec.model&&spec.rawComps&&spec.f)return modelListHtml(id,spec,seg);
    if(id==="R2R")return r2rListHtml(current);
    if(id==="CMP"||id==="SC")return controlsListHtml(id,current);
    return exceptionsListHtml(id,current);
  }

  function healthModalHtml(id){
    var T=TOWER_BY_ID[id],spec=healthSpec(id),m=towerModel(id),current=hasCurrentSnapshot();
    var h='<div class="hm-head"><h2 id="hmTitle">'+esc(id)+' health &amp; KPIs</h2>'+
      '<a class="btn hm-open" href="'+esc(T.url)+'">Open '+esc(id)+' tower →</a>'+
      '<span class="chip n sq">'+esc(FILTERS.period)+'</span>'+
      '<button type="button" class="hm-x" data-hm-close aria-label="Close health details">&times;</button></div>';

    var left,right,listSeg=null,listSegLabel="";
    var tr=trendSeriesFor(id,spec),trendHtml=trendSvg(tr.vals,spec.pi);
    var trendBlock='<div class="hm-trendbox"><div class="hm-sub">'+esc(MONTHS6[0].slice(0,3))+'–'+esc(FILTERS.period.slice(0,3))+' trend'+(tr.label&&!spec.hasScore?' · '+esc(tr.label):'')+'</div>'+(trendHtml||'<div class="note">No trend history for this tower.</div>')+'</div>';

    if(spec.hasScore){
      var tone=bandTone(spec.band),prior=spec.pi>0&&isNum(spec.series[spec.pi-1])?spec.series[spec.pi-1]:null;
      var delta=prior==null?null:spec.score-prior;
      left='<div class="hm-ringrow"><div class="hm-ring">'+scoreRing(spec.score,tone)+'<div class="hm-ringnum"><b>'+n(spec.score)+'</b><small>/100</small></div></div>'+
        '<div class="hm-meta"><span class="chip '+tone+'">'+esc(spec.band)+'</span>'+
        (delta!=null&&delta!==0?'<span class="chip '+(delta>0?"g":"r")+'">'+(delta>0?"▲ ":"▼ ")+n(Math.abs(delta),1)+' pts</span>':'')+
        '<div class="hm-kv"><span>Coverage</span><b>'+(isNum(spec.coverage)?n(spec.coverage*100)+"%":"—")+'</b></div>'+
        '<div class="hm-kv"><span>Points lost</span><b>'+n(100-spec.score)+'</b></div></div></div>'+
        trendBlock+'<p class="hm-narr">'+esc(narrativeFor(spec))+'</p>';
      right=spec.components.length?spec.components.map(function(c){
        var tone=c.lost==null?"n":c.lost<=0?"g":"a";
        return compCardHtml(c,tone,null);
      }).join(""):'<div class="hm-comp hm-wide"><div class="note">The tower score is available for '+esc(FILTERS.period)+', but its component breakdown is not included in the available source data.</div></div>';
    }else{
      var tone2=current?m.tone:"n";
      left='<div class="hm-ringrow"><div class="hm-ring">'+scoreRing(null,"n")+'<div class="hm-ringnum"><b>—</b><small>/100</small></div></div>'+
        '<div class="hm-meta"><span class="chip '+tone2+'">'+(current?esc(toneWord(m.tone)):"No snapshot")+'</span>'+
        '<div class="hm-kv"><span>Weighted score</span><b>Not defined</b></div>'+
        '<div class="hm-kv"><span>Open exceptions</span><b>'+(current?n(m.linked.length):"—")+'</b></div></div></div>'+
        trendBlock+
        '<p class="hm-narr">'+esc(id)+' has no source-defined /100 health score, so none is inferred. Status uses the same rule as the Financial Command Centre: the worse of the highest open exception severity and the tower KPI position.</p>'+
        (current&&m.reasons.length?'<ul class="twin-why">'+m.reasons.map(function(r){return '<li>'+esc(r.text)+'</li>';}).join("")+'</ul>':'');
      right=towerKpis(id).map(kpiCardHtml).join("")+(id==="O2C"&&current?ageingHtml():"");
    }

    if(spec.hasScore&&spec.rawComps&&spec.f&&spec.model){
      var pm=modalParts(spec,trendBlock);
      h=h.replace('<span class="chip n sq">',pm.tabs+'<span class="chip n sq">');
      left=pm.left;right=pm.right;listSeg=pm.seg;listSegLabel=pm.segLabel;
    }
    right='<div class="hm-data-heading">'+(spec.hasScore?"Weighted health components":"Key KPIs")+'</div>'+right;
    var exHtml=towerListHtml(id,spec,listSeg,listSegLabel,current);

    var scope=['Period '+FILTERS.period,'BU '+FILTERS.bu,'Region '+FILTERS.region,'Risk '+FILTERS.risk].join(' · ');
    var foot='<div class="hm-foot"><div class="note">'+esc(scope)+'. Lists follow the same filters as the score; '+(SCORE_SCOPED[id]?'the '+esc(id)+' score follows BU and region':'tower KPI snapshots are group-level')+'. '+esc(spec.scopeNote)+' Figures are read from the same shared FCT data and tower model as the '+esc(id)+' page.</div></div>';

    return h+'<div class="hm-body"><div class="hm-left">'+left+'</div><div class="hm-right">'+right+'</div></div>'+exHtml+foot;
  }

  function ensureHealthModal(){
    if(HM.back)return;
    var back=document.createElement("div");
    back.className="hm-back";back.id="healthModal";
    back.innerHTML='<div class="hm-dialog" role="dialog" aria-modal="true" aria-labelledby="hmTitle" tabindex="-1"></div>';
    document.body.appendChild(back);
    HM.back=back;HM.dialog=back.firstChild;
    back.addEventListener("mousedown",function(e){if(e.target===back)closeHealth();});
    HM.dialog.addEventListener("click",function(e){
      if(e.target.closest("[data-hm-close]")){closeHealth();return;}
      var sb=e.target.closest("[data-hm-seg]");
      var lb=e.target.closest("[data-hm-lf],[data-hm-lmore],[data-hm-lall],[data-hm-lless]");
      if(lb){
        var kind=lb.hasAttribute("data-hm-lf")?"lf":lb.hasAttribute("data-hm-lmore")?"lmore":lb.hasAttribute("data-hm-lall")?"lall":"lless",fk=lb.dataset.hmLf,fv=lb.dataset.hmLv;
        if(kind==="lf"){HM.lf[fk]=fv;HM.lshown=10;HM.lall=false;}
        else if(kind==="lmore")HM.lshown+=5;
        else if(kind==="lall")HM.lall=true;
        else{HM.lshown=10;HM.lall=false;}
        renderHealthModal();
        var nb=null;
        [].slice.call(HM.dialog.querySelectorAll(kind==="lf"?"[data-hm-lf]":".dec-more button")).some(function(b){
          if(kind==="lf"?(b.dataset.hmLf===fk&&b.dataset.hmLv===fv):b.hasAttribute("data-hm-"+kind)){nb=b;return true;}return false;});
        if(!nb)nb=HM.dialog.querySelector(".dec-more button");
        if(nb)nb.focus();
        return;
      }
      if(sb){HM.seg=sb.dataset.hmSeg;HM.lshown=10;HM.lall=false;renderHealthModal();var again=HM.dialog.querySelector('[data-hm-seg="'+HM.seg+'"]');if(again)again.focus();return;}
    });
    document.addEventListener("keydown",function(e){
      if(!HM.open)return;
      if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closeHealth();return;}
      if(e.key!=="Tab")return;
      var f=[].slice.call(HM.dialog.querySelectorAll("button,a[href]")).filter(function(el){return el.offsetParent!==null;});
      if(!f.length)return;
      var first=f[0],last=f[f.length-1];
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===HM.dialog)){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    },true);
  }
  function renderHealthModal(){
    if(!HM.open)return;
    var keep=HM.back.scrollTop;
    HM.dialog.innerHTML=healthModalHtml(HM.tower);
    HM.back.scrollTop=keep;
  }
  function openHealth(id){
    ensureHealthModal();
    HM.tower=id;HM.returnTower=id;HM.open=true;HM.seg="All";HM.lf={};HM.lshown=10;HM.lall=false;
    HM.back.classList.add("open");
    document.body.classList.add("modal-open");
    renderHealthModal();
    var x=HM.dialog.querySelector("[data-hm-close]");if(x)x.focus();
  }
  function closeHealth(){
    if(!HM.open)return;
    HM.open=false;HM.back.classList.remove("open");
    document.body.classList.remove("modal-open");
    var back=document.querySelector('[data-health-tower="'+HM.returnTower+'"]');
    if(back)back.focus();
  }
  function refreshHealthModal(){if(HM.open)renderHealthModal();}
  function bindHealthCards(){
    document.getElementById("kpis").addEventListener("keydown",function(e){
      var r=e.target.closest("tr[data-health-tower]");
      if(r&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openHealth(r.dataset.healthTower);}
    });
    document.getElementById("kpis").addEventListener("click",function(e){
      var a=e.target.closest("[data-health-tower]");
      if(!a)return;
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button===1)return; /* let power users open the tower page directly */
      e.preventDefault();
      openHealth(a.dataset.healthTower);
    });
  }

  function towerMeasure(t){
    if(!hasCurrentSnapshot())return "No snapshot for "+FILTERS.period;
    if(t.id==="P2P")return "Audit readiness "+n(FCT.v("p2p.auditReady"))+"%";
    if(t.id==="O2C")return "DSO "+n(FCT.v("o2c.dso"))+" days";
    if(t.id==="R2R")return "Close readiness "+n(FCT.v("close.readiness"))+"/90";
    if(t.id==="SC")return "Inventory "+n(FCT.v("sc.gross"),1)+" Cr";
    return "Audit readiness "+n(FCT.v("audit.readiness"))+"/90";
  }
  var HEAT_SEVS=[["critical","Critical","crit"],["high","High","a"],["medium","Medium","g"],["low","Low","g"]];
  function renderHeat(){
    var table=document.getElementById("heat");
    var ok=hasCurrentSnapshot();
    var all=ok?openAll():[];
    var rows=TOWERS.map(function(t){
      var list=ok?forTower(t.id):[];   /* same rule as the tower pages: exceptions the tower originates or is linked to */
      var c={};HEAT_SEVS.forEach(function(v){c[v[0]]=list.filter(function(x){return x.severity===v[0];}).length;});
      return {t:t,c:c,total:list.length};
    });
    var max=1;rows.forEach(function(r){HEAT_SEVS.forEach(function(v){max=Math.max(max,r.c[v[0]]);});});
    function cell(tid,sev,count,col){
      if(!ok)return '<td><span class="hx hx0">—</span></td>';
      if(!count)return '<td><span class="hx hx0">0</span></td>';
      var pct=Math.round(18+count/max*62);
      return '<td><button type="button" class="hx" data-heat-tower="'+esc(tid)+'" data-heat-sev="'+esc(sev)+'" style="background:color-mix(in srgb,var(--'+col+') '+pct+'%,var(--well))" title="Show '+n(count)+' '+esc(sev)+' exception'+(count===1?"":"s")+' for '+esc(tid)+'">'+n(count)+'</button></td>';
    }
    table.innerHTML="<thead><tr><th></th>"+HEAT_SEVS.map(function(v){return "<th>"+v[1]+"</th>";}).join("")+"<th>Total</th></tr></thead><tbody>"+
      rows.map(function(r){
        return '<tr><td class="rowh"><button type="button" class="hx-row" data-heat-tower="'+esc(r.t.id)+'" data-heat-sev="All">'+esc(r.t.id)+'<small>'+esc(r.t.name)+'</small></button></td>'+
          HEAT_SEVS.map(function(v){return cell(r.t.id,v[0],r.c[v[0]],v[2]);}).join("")+
          '<td><span class="hx-total">'+(ok?n(r.total):"—")+'</span></td></tr>';
      }).join("")+
      '<tr class="hx-foot"><td class="rowh"><button type="button" class="hx-row" data-heat-tower="All" data-heat-sev="All">All towers<small>each exception once</small></button></td>'+
        HEAT_SEVS.map(function(v){var k=ok?all.filter(function(x){return x.severity===v[0];}).length:0;return '<td><span class="hx-total">'+(ok?n(k):"—")+'</span></td>';}).join("")+
        '<td><span class="hx-total">'+(ok?n(all.length):"—")+'</span></td></tr></tbody>';
    table.onclick=function(e){
      var b=e.target.closest("[data-heat-tower]");if(!b)return;
      twin.decTower=b.dataset.heatTower;twin.decSev=b.dataset.heatSev;decReset();
      renderActions();
      goActions();
    };
    var note=document.getElementById("heatNote");
    if(note)note.textContent=ok?"Each tower row counts every open exception that originates in, or is linked to, that tower, as its tower page does. An exception shared by several towers therefore appears in each of their rows. The bottom row counts every exception once.":"Exception snapshots are available for Sep-26 only.";
  }
  /* Risk & control and Decisions & alerts share one page: the decisions list sits directly under the heatmap */
  function riskHost(){var h=document.getElementById("heat");return h?(h.closest("section.tab-panel")||h.closest("section")):null;}
  function riskTab(){var host=riskHost();return host&&host.id?document.querySelector('.section-tabs [data-panel="'+host.id+'"]'):null;}
  function mergeDecisions(){
    var act=document.getElementById("actions"),host=riskHost();
    if(!act||!host||host===act||act.dataset.merged)return;
    act.dataset.merged="1";
    act.classList.remove("tab-panel");act.hidden=false;act.removeAttribute("hidden");
    act.style.marginTop="18px";
    host.appendChild(act);
    if(window.MutationObserver)new MutationObserver(function(){if(act.hidden)act.hidden=false;}).observe(act,{attributes:true,attributeFilter:["hidden"]});
    var old=document.querySelector('.section-tabs [data-panel="actions"]');
    if(old){old.hidden=true;old.style.display="none";}
    var rt=riskTab();if(rt)rt.textContent="Risk, control & decisions";
  }
  /* section tabs live in the top navbar instead of the middle of the page */
  function tabsToNavbar(){
    var tabs=document.querySelector(".section-tabs"),top=document.querySelector(".top");
    if(!tabs||!top||top.contains(tabs))return;
    tabs.classList.add("in-navbar");
    var sp=top.querySelector(".sp");
    if(sp)top.insertBefore(tabs,sp);else top.appendChild(tabs);
  }
  /* navbar: Control tower and Decisions & Alerts links are removed (kept removed even if the page re-draws the bar) */
  function isDroppedNavLink(a){
    var label=(a.textContent||"").replace(/\s+/g," ").trim(),href=a.getAttribute("href")||"";
    return /#(top|actions)$/.test(href)||/^control tower$/i.test(label)||/^decisions\s*(&|and)\s*alerts$/i.test(label);
  }
  function tidyNavLinks(){
    [].slice.call(document.querySelectorAll(".top a, nav a, header a")).forEach(function(a){
      if(isDroppedNavLink(a))a.remove();
    });
  }
  function watchNavLinks(){
    tidyNavLinks();
    if(!window.MutationObserver)return;
    var pending=false;
    new MutationObserver(function(){
      if(pending)return;pending=true;
      setTimeout(function(){pending=false;tidyNavLinks();},0);
    }).observe(document.body,{childList:true,subtree:true});
  }
  /* executive briefing cards and the filter footnote are no longer shown */
  function hideBriefing(){
    [].slice.call(document.querySelectorAll(".briefing")).forEach(function(b){b.style.display="none";});
    var f=document.getElementById("executiveFoot");
    if(f){f.style.display="none";var p=f.parentElement;if(p&&p.classList.contains("foot"))p.style.display="none";}
  }
  function goActions(){
    var rt=riskTab();if(rt&&!rt.classList.contains("on"))rt.click();
    var a=document.getElementById("actions");if(a)a.scrollIntoView({behavior:"smooth",block:"start"});
  }
  function forTower(id){return sortEx(FCT.openFor(id).filter(exceptionMatches));}
  /* column filters for the decisions table: Impact, Owner, Due, Status, Source */
  var DEC_COLS=[["owner","Owner"],["due","Due"],["status","Status"],["source","Source"]];
  var IMPACT_ORDER=["\u20b910 Cr and above","\u20b91\u201310 Cr","Under \u20b91 Cr","Not quantified"];
  function decVal(x,k){
    if(k==="impact")return x.subject||"Not specified"; /* same wording as the exception's own subject */
    if(k==="owner")return userName(x.owner);
    if(k==="due")return x.due||"No due date";
    if(k==="status")return FCT.status(x);
    return x.tower;
  }
  function decColOk(x,skip){return DEC_COLS.every(function(c){return c[0]===skip||twin.decCol[c[0]]==="All"||decVal(x,c[0])===twin.decCol[c[0]];});}
  function decActive(){return DEC_COLS.some(function(c){return twin.decCol[c[0]]!=="All";});}
  function decReset(){twin.decShown=10;twin.decAll=false;}
  function decSortVals(k,list){
    return list.sort(function(a,b){
      if(k==="due"){var da=Date.parse(a),db=Date.parse(b);if(isFinite(da)&&isFinite(db))return da-db;if(isFinite(da))return -1;if(isFinite(db))return 1;}
      return String(a).localeCompare(String(b));
    });
  }
  function renderActions(){
    var every=sortEx(openAll());                  /* executive view: every open exception, critical > high > med/low, no cap */
    var available=hasCurrentSnapshot();
    var sel=twin.decTower;
    /* tower lists and counts come from the same shared call the tower pages use, FCT.openFor(tower), so the numbers match those pages */
    function sevOk(x){return twin.decSev==="All"||(twin.decSev==="medlow"?(x.severity==="medium"||x.severity==="low"):x.severity===twin.decSev);}
    var base=(sel==="All"?every:forTower(sel)).filter(sevOk);
    var colVals={};
    DEC_COLS.forEach(function(c){
      var seen={};base.forEach(function(x){seen[decVal(x,c[0])]=1;});
      colVals[c[0]]=decSortVals(c[0],Object.keys(seen));
      if(twin.decCol[c[0]]!=="All"&&colVals[c[0]].indexOf(twin.decCol[c[0]])<0)twin.decCol[c[0]]="All"; /* a value that no longer exists in this view */
    });
    var items=base.filter(function(x){return decColOk(x);});
    var header=document.querySelector("#actions .ch");
    var chipText=available?((sel==="All"&&twin.decSev==="All"&&!decActive())?n(every.length)+' open':n(items.length)+' of '+n(every.length)+' open'):'Snapshot unavailable for '+esc(FILTERS.period);
    var sev={critical:0,high:0,medium:0,low:0};
    items.forEach(function(x){if(sev[x.severity]!=null)sev[x.severity]++;});
    var sevChips=available?'<span class="chip r">'+n(sev.critical)+' critical</span><span class="chip a">'+n(sev.high)+' high</span><span class="chip g">'+n(sev.medium+sev.low)+' medium / low</span>':'';
    if(header)header.innerHTML='<h2><span class="num">7</span>Decisions &amp; alerts</h2>';
    var q=document.querySelector("#actions .qline");
    if(q)q.textContent="Every current open exception, ranked by severity, with its owner, due date and live FCT decision status. Filter by tower: each tower\u2019s list and count come from the same data as its tower page (tower counts include exceptions linked from other towers, so they add up to more than the total of "+n(every.filter(sevOk).filter(function(x){return decColOk(x);}).length)+"; each exception is counted once in All).";
    var tbl=document.querySelector("#actions .dec");
    var bar=document.getElementById("decFilter");
    if(!bar&&tbl){bar=document.createElement("div");bar.id="decFilter";bar.className="twin-filter-bar";tbl.parentNode.insertBefore(bar,tbl);}
    if(bar){
      bar.setAttribute("role","group");bar.setAttribute("aria-label","Filter open exceptions by tower");
      bar.hidden=!(available&&every.length);
      bar.innerHTML='<label>Tower:</label>'+["All"].concat(TOWERS.map(function(t){return t.id;})).map(function(id){
        var c=(id==="All"?every:forTower(id)).filter(sevOk).filter(function(x){return decColOk(x);}).length;
        return '<button type="button" class="twin-flt-btn'+(id===sel?" active":"")+'" data-dectower="'+esc(id)+'" aria-pressed="'+(id===sel)+'">'+esc(id)+' <span class="lt-n">'+n(c)+'</span></button>';
      }).join("")+(twin.decSev!=="All"?'<button type="button" class="twin-flt-btn active" data-decsev="All" title="Clear severity filter">Severity: '+esc(twin.decSev==="medlow"?"Med/Low":twin.decSev)+' &times;</button>':'');
      bar.onclick=function(e){
        var cs=e.target.closest("[data-decsev]");
        if(cs){twin.decSev="All";decReset();renderActions();return;}
        var f=e.target.closest("[data-dectower]");if(!f)return;
        twin.decTower=f.dataset.dectower;decReset();renderActions();
        var again=document.querySelector('#decFilter [data-dectower="'+twin.decTower+'"]');if(again)again.focus();
      };
    }
    var cols=document.getElementById("decCols");
    if(!cols&&bar){cols=document.createElement("div");cols.id="decCols";cols.className="twin-filter-bar dec-cols";bar.parentNode.insertBefore(cols,bar.nextSibling);
      cols.addEventListener("change",function(e){
        var sl=e.target.closest("[data-deccol]");if(!sl)return;
        twin.decCol[sl.dataset.deccol]=sl.value;decReset();renderActions();
        var again=document.getElementById("decCol-"+sl.dataset.deccol);if(again)again.focus();
      });
      cols.addEventListener("click",function(e){
        if(!e.target.closest("[data-deccol-clear]"))return;
        DEC_COLS.forEach(function(c){twin.decCol[c[0]]="All";});decReset();renderActions();
      });
    }
    if(cols){
      cols.setAttribute("role","group");cols.setAttribute("aria-label","Filter open exceptions by column");
      cols.hidden=!(available&&every.length);
      cols.innerHTML='<label>Filter by:</label>'+DEC_COLS.map(function(c){
        var k=c[0];
        return '<label class="dec-col"><span>'+esc(c[1])+'</span><select id="decCol-'+k+'" data-deccol="'+k+'"'+(twin.decCol[k]!=="All"?' class="on"':'')+'><option value="All">All</option>'+
          colVals[k].map(function(v){
            var cnt=base.filter(function(x){return decVal(x,k)===v&&decColOk(x,k);}).length;
            return '<option value="'+esc(v)+'"'+(twin.decCol[k]===v?' selected':'')+'>'+esc(v)+' ('+n(cnt)+')</option>';
          }).join("")+'</select></label>';
      }).join("")+(decActive()?'<button type="button" class="twin-flt-btn active" data-deccol-clear>Clear filters &times;</button>':'');
    }
    var table=document.querySelector("#actions .dec thead tr");
    if(table)table.innerHTML="<th>Exception / action</th><th>Owner</th><th>Due</th><th>Status</th><th>Source</th>";
    document.getElementById("declist").innerHTML=!available?'<tr><td colspan="5">Decision snapshots are available for Sep-26 only.</td></tr>':items.slice(0,twin.decAll?items.length:twin.decShown).map(function(x){
      var tone=x.severity==="critical"?"r":x.severity==="high"?"a":"g";
      var also=(x.also||[]).length?'<small>also '+esc(x.also.join(", "))+'</small>':'';
      return '<tr class="'+tone+'"><td><span class="chip '+tone+' dec-sev">'+esc(x.severity)+'</span><b>'+esc(x.title)+'</b><small>'+esc(x.id)+' · '+esc(x.subject||"")+'</small></td>'+
        '<td>'+esc(userName(x.owner))+'</td><td>'+esc(x.due||"—")+'</td>'+
        '<td><span class="chip n">'+esc(FCT.status(x))+'</span></td><td><a href="'+esc(exceptionLink(x))+'" title="Open '+esc(x.id)+' in '+esc(x.tower)+'">'+esc(x.tower)+' →</a>'+also+'</td></tr>';
    }).join("")||'<tr><td colspan="5">'+(base.length?"No exception matches the selected column filters.":sel==="All"?"No open decisions.":"No open exception for "+esc(sel)+" in the current filters.")+'</td></tr>';
    /* "Show more +5" adds five at a time and stays until every exception is on screen; "Show all" opens the full list; "Show less" returns to ten */
    var more=document.getElementById("decMore");
    if(!more&&tbl){
      more=document.createElement("div");more.id="decMore";more.className="dec-more";
      tbl.parentNode.insertBefore(more,tbl.nextSibling);
      more.addEventListener("click",function(e){
        var b=e.target.closest("[data-dec-more],[data-dec-all],[data-dec-less]");if(!b)return;
        var which=b.hasAttribute("data-dec-all")?"all":b.hasAttribute("data-dec-less")?"less":"more";
        if(which==="more")twin.decShown+=5;else if(which==="all")twin.decAll=true;else decReset();
        renderActions();
        var again=document.querySelector("#decMore [data-dec-"+which+"]")||document.querySelector("#decMore button");if(again)again.focus();
      });
    }
    if(more){
      var shown=twin.decAll?items.length:Math.min(twin.decShown,items.length);
      var canMore=!twin.decAll&&items.length>shown;
      more.hidden=!(available&&items.length>10&&(canMore||twin.decAll));
      more.innerHTML=more.hidden?"":'<span class="dec-more-n">Showing '+n(shown)+' of '+n(items.length)+'</span>'+
        (canMore?'<button type="button" class="twin-flt-btn" data-dec-more>Show more +'+n(Math.min(5,items.length-shown))+'</button><button type="button" class="twin-flt-btn" data-dec-all>Show all ('+n(items.length)+')</button>':
          '<button type="button" class="twin-flt-btn" data-dec-less>Show less</button>');
    }
  }

  /* ---------- Financial Command Centre ---------- */
  var TWIN_POS={FCT:{x:430,y:300,r:70},P2P:{x:190,y:92},O2C:{x:670,y:92},SC:{x:100,y:330},CMP:{x:760,y:330},R2R:{x:430,y:536}};
  var NODE_W=180,NODE_H=90;
  /* SC-R2R bows down and left so it does not run alongside the CMP-SC curve where both leave the SC node */
  var EDGE_BEND={"CMP-SC":[0,150],"CMP-P2P":[0,-70],"SC-R2R":[-40,40]};
  var SEV_RANK={critical:4,high:3,medium:2,low:1};
  var twin={insSev:null,tower:"FCT",issue:null,filter:"all",illus:false,touched:false,linkTower:"All",linkShown:10,linkAll:false,decTower:"All",decSev:"All",decShown:10,decAll:false,decCol:{impact:"All",owner:"All",due:"All",status:"All",source:"All"}};
  var TWIN_EDGES=[];
  var NS="http://www.w3.org/2000/svg";

  function prov(kind,label){
    var l=label||(kind==="live"?"Live":kind==="calc"?"Calculated":"Illustrative");
    return '<span class="prov '+kind+'">'+esc(l)+'</span>';
  }
  function tRank(t){return t==="r"?3:t==="a"?2:t==="g"?1:0;}
  function tWorst(a,b){return tRank(a)>=tRank(b)?a:b;}
  function toneWord(t){return t==="r"?"Critical":t==="a"?"Attention":"On track";}
  function sevTone(s){return s==="critical"?"r":s==="high"?"a":"g";}
  function sevRank(x){return SEV_RANK[x.severity]||0;}
  function exVal(x){return x.impact&&typeof x.impact.valueCr==="number"?x.impact.valueCr:0;}
  function sortEx(list){return list.slice().sort(function(a,b){return sevRank(b)-sevRank(a)||exVal(b)-exVal(a);});}
  function isControlItem(x){
    var s=[x.type,x.category,x.kind,x.title,x.what,x.trigger].filter(Boolean).join(" ");
    return /control|duplicate|segregation|\bsod\b|access conflict|override|bypass|unreconciled|threshold|failed test/i.test(s);
  }
  function over90Cr(){
    return ((D.o2c&&D.o2c.ageing)||[]).filter(function(r){return /over 90/i.test(r[0]);}).reduce(function(s,r){return s+r[1];},0);
  }
  function overdueCr(){
    return ((D.o2c&&D.o2c.ageing)||[]).filter(function(r){return !/not due/i.test(r[0]);}).reduce(function(s,r){return s+r[1];},0);
  }

  /* ----- verified issues: open exceptions whose shared record links more than one tower ----- */
  function verifiedIssues(){
    return openAll().map(function(x){
      var aff=(x.also||[]).map(function(a){return String(a).toUpperCase();})
        .filter(function(a,i,arr){return TOWER_BY_ID[a]&&a!==x.tower&&arr.indexOf(a)===i;});
      return {id:x.id,x:x,title:x.title,source:x.tower,affects:aff,value:exVal(x),sev:x.severity,tone:sevTone(x.severity)};
    }).filter(function(i){return TOWER_BY_ID[i.source]&&i.affects.length;})
      .sort(function(a,b){return (SEV_RANK[b.sev]||0)-(SEV_RANK[a.sev]||0)||b.value-a.value;});
  }
  function edgeBetween(a,b,kind){
    return TWIN_EDGES.filter(function(e){
      return (e.a===a&&e.b===b||e.a===b&&e.b===a)&&(!kind||e.kind===kind);
    })[0]||null;
  }
  function issueHops(iss){
    var hops=[],routes=[];
    iss.affects.forEach(function(b){
      var direct=edgeBetween(iss.source,b,"designed");
      var hs=direct?[[iss.source,b]]:[[iss.source,"FCT"],["FCT",b]];
      routes.push({to:b,direct:!!direct,hops:hs,label:direct?direct.label:"No direct designed relationship; routed through FCT Core"});
      hs.forEach(function(h){
        if(!hops.some(function(k){return k[0]===h[0]&&k[1]===h[1];}))hops.push(h);
      });
    });
    return {hops:hops,routes:routes};
  }
  function currentIssue(){
    return verifiedIssues().filter(function(i){return i.id===twin.issue;})[0]||null;
  }

  /* ----- tower model ----- */
  function towerModel(id){
    var isCore=id==="FCT";
    var linked=isCore?openAll():openForTower(id);
    var primary=isCore?openAll():primaryOpen(id);
    var crit=linked.filter(function(x){return x.severity==="critical";}).length;
    var high=linked.filter(function(x){return x.severity==="high";}).length;
    var medlow=linked.filter(function(x){return x.severity==="medium"||x.severity==="low";}).length; /* same list the tower pages and heatmap read: FCT.openFor(tower) */
    var reasons=[],kt="g";
    function flag(tone,text){kt=tWorst(kt,tone);reasons.push({tone:tone,text:text});}
    if(hasCurrentSnapshot()&&(id==="R2R"||isCore)){
      var f=FCT.v("close.forecastWD"),tg=D.meta.closeTargetWD;
      if(f>tg)flag("r","Close forecast "+FCT.wd(f)+" is later than target "+FCT.wd(tg));
      else if(FCT.v("close.readiness")<80)flag("a","Close readiness "+n(FCT.v("close.readiness"))+" / 90 is below 80");
    }
    if(hasCurrentSnapshot()&&(id==="CMP"||isCore)){
      var au=FCT.v("audit.readiness");
      if(au<80)flag("r","Audit readiness "+n(au)+" / 90 is below 80");
      else if(au<90)flag("a","Audit readiness "+n(au)+" / 90 is below the 90 target");
    }
    if(hasCurrentSnapshot()&&id==="O2C"&&over90Cr()>0)flag("a","Receivables over 90 days: "+money(over90Cr()));
    if(hasCurrentSnapshot()&&id==="P2P"&&FCT.v("pay.pendingCount")>0)flag("a",n(FCT.v("pay.pendingCount"))+" payment item(s) awaiting decision ("+money(FCT.v("pay.pendingCr"))+")");
    var et=severityTone(linked);
    if(linked.length)reasons.unshift({tone:et,text:n(linked.length)+" open exception(s): "+n(crit)+" critical, "+n(high)+" high"});
    var tone=tWorst(et,kt);
    var ctl=hasCurrentSnapshot()?(isCore?FCT.v("controls.failing"):linked.filter(isControlItem).length):null;
    return {id:id,isCore:isCore,linked:linked,primary:primary,crit:crit,high:high,tone:tone,reasons:reasons,
      risks:primary.length,actions:linked.length,ctl:+ctl||0,medlow:medlow,value:impactAmount(primary)};
  }
  function exposureFlow(id){
    var out=0,inn=0;
    verifiedIssues().forEach(function(i){
      if(i.source===id)out+=i.value;
      if(i.affects.indexOf(id)>-1)inn+=i.value;
    });
    return {out:out,inn:inn};
  }
  /* numbers the tower models can calculate come from the tower itself (same filters as the score); the shared executive dataset is only the fallback */
  function o2cLive(){
    var M=modelFor("O2C");if(!M||!M.kpi)return null;
    try{
      var f=modelFilter("O2C",scopeEntries("O2C").length>0),ar=M.kpi("ar",f),od=M.kpi("overdue",f);
      if(ar.v==null)return null;
      var o90=M.overdue(f).filter(function(l){return M.odBucket(l)==="Over 90 days";}).reduce(function(t,l){return t+l.amt;},0);
      return {ar:ar.v,overdue:od.v||0,over90:o90,dso:od.dso};
    }catch(e){return null;}
  }
  function scLive(){
    var M=modelFor("SC");if(!M||!M.kpi)return null;
    try{var k=M.kpi("inv",modelFilter("SC",false));return k.v==null?null:{gross:k.v,prov:k.prov};}catch(e){return null;}
  }
  /* console check: where the executive dataset and a tower model disagree, so a mismatch is visible instead of silent */
  var reconciled={};
  function reconcile(){
    if(reconciled[FILTERS.period]||!hasCurrentSnapshot())return;
    reconciled[FILTERS.period]=1;
    var rows=[],o=o2cLive(),sc=scLive();
    function add(name,exec,tower){if(isNum(exec)&&isNum(tower))rows.push({number:name,executive_dataset:exec,tower_model:tower,differs:Math.abs(exec-tower)>Math.max(0.5,Math.abs(tower)*0.005)});}
    if(o){add("O2C trade receivables (Cr)",D.o2c&&D.o2c.ar,o.ar);add("O2C overdue (Cr)",overdueCr(),o.overdue);add("O2C over 90 days (Cr)",over90Cr(),o.over90);add("O2C DSO (days)",FCT.v("o2c.dso"),o.dso);}
    if(sc){add("SC inventory at cost (Cr)",FCT.v("sc.gross"),sc.gross);}
    if(rows.some(function(r){return r.differs;}))console.warn("Executive numbers that differ from their tower model (the tower model value is now shown):");
    if(rows.length)console.table(rows);
  }
  function towerKpis(id){
    if(!hasCurrentSnapshot())return [["Snapshot availability","—","No tower KPI snapshot for "+FILTERS.period,"calc"]];
    var m=towerModel(id);
    if(id==="P2P")return [
      ["Payments awaiting decision",money(FCT.v("pay.pendingCr")),n(FCT.v("pay.pendingCount"))+" item(s) · run "+D.meta.paymentRun,"live"],
      ["P2P audit readiness",n(FCT.v("p2p.auditReady"))+"%","","live"],
      ["Linked open exceptions",n(m.linked.length),n(m.crit)+" critical · "+n(m.high)+" high","live"],
      ["Open value at source",money(m.value),"Sum of record values; not additive","calc"]];
    if(id==="O2C"){
      var lv=o2cLive(),ar=lv?lv.ar:D.o2c.ar,od=lv?lv.overdue:overdueCr(),o90=lv?lv.over90:over90Cr(),dso=lv&&lv.dso!=null?lv.dso:FCT.v("o2c.dso");
      return [
      ["Trade receivables",money(ar),lv?"Open AR from the O2C ledger":"AR balance","live"],
      ["Days sales outstanding",n(dso)+" days","","live"],
      ["Overdue receivables",money(od),lv?"Past-due open AR from the O2C ledger":"Sum of overdue ageing buckets","calc"],
      ["Over 90 days",money(o90),(ar?n(o90/ar*100,1)+"% of receivables":""),"calc"]];
    }
    if(id==="R2R")return [
      ["Close readiness",n(FCT.v("close.readiness"))+" / 90","","live"],
      ["Close forecast",FCT.wd(FCT.v("close.forecastWD")),"Target "+FCT.wd(D.meta.closeTargetWD),"live"],
      ["Failing controls",n(FCT.v("controls.failing")),"Shared CMP / R2R metric","live"],
      ["Linked open exceptions",n(m.linked.length),n(m.crit)+" critical · "+n(m.high)+" high","live"]];
    if(id==="SC"){
      var sl=scLive(),g=sl?sl.gross:FCT.v("sc.gross"),p=sl&&isNum(sl.prov)?sl.prov:FCT.v("sc.prov");
      return [
      ["Inventory at cost",money(g),"","live"],
      ["Inventory provision",money(p),"","live"],
      ["Provision cover",g?n(p/g*100,1)+"%":"n/a","Provision ÷ cost","calc"],
      ["Linked open exceptions",n(m.linked.length),n(m.crit)+" critical · "+n(m.high)+" high","live"]];
    }
    if(id==="CMP")return [
      ["Audit readiness",n(FCT.v("audit.readiness"))+" / 90","Target 90","live"],
      ["Compliance risk index",n(FCT.v("cmp.cri")),"","live"],
      ["Failing controls",n(FCT.v("controls.failing")),"Shared CMP / R2R metric","live"],
      ["Linked open exceptions",n(m.linked.length),n(m.crit)+" critical · "+n(m.high)+" high","live"]];
    return [
      ["Open exceptions",n(m.linked.length),n(m.crit)+" critical · "+n(m.high)+" high","live"],
      ["Close readiness",n(FCT.v("close.readiness"))+" / 90","Forecast "+FCT.wd(FCT.v("close.forecastWD")),"live"],
      ["Audit readiness",n(FCT.v("audit.readiness"))+" / 90","Target 90","live"],
      ["Sum of source values",money(impactAmount(openAll())),"Not additive or reconciled","calc"]];
  }
  function connectionsOf(id){
    if(id==="FCT")return CORE_CONNECTIONS.map(function(c){return {other:c.a,label:c.label,kind:"core",rel:c.rel};});
    var out=[];
    CONNECTIONS.forEach(function(c){
      if(c.a===id)out.push({other:c.b,label:c.label,kind:"designed",rel:c.rel});
      else if(c.b===id)out.push({other:c.a,label:c.label,kind:"designed",rel:c.rel});
    });
    out.push({other:"FCT",label:"Performance, risk, controls, exposure and decisions",kind:"core",rel:id==="P2P"||id==="O2C"?"cash":"controls"});
    return out;
  }
  function issuesBetween(a,b){
    return verifiedIssues().filter(function(i){
      return i.source===a&&i.affects.indexOf(b)>-1||i.source===b&&i.affects.indexOf(a)>-1;
    });
  }

  /* ----- geometry ----- */
  function boundary(id,tx,ty){
    var c=TWIN_POS[id],dx=tx-c.x,dy=ty-c.y,len=Math.sqrt(dx*dx+dy*dy)||1,d;
    if(id==="FCT")d=c.r+5;
    else{
      var hw=NODE_W/2+5,hh=NODE_H/2+5;
      d=Math.min(Math.abs(dx)>1e-6?hw/Math.abs(dx):Infinity,Math.abs(dy)>1e-6?hh/Math.abs(dy):Infinity)*len;
    }
    return [c.x+dx/len*d,c.y+dy/len*d];
  }
  function geom(a,b){
    var A=TWIN_POS[a],B=TWIN_POS[b];
    var e=edgeBetween(a,b),bend=(e&&EDGE_BEND[e.a+"-"+e.b])||[0,0];
    var c=[(A.x+B.x)/2+bend[0],(A.y+B.y)/2+bend[1]];
    return {p0:boundary(a,c[0],c[1]),c:c,p1:boundary(b,c[0],c[1])};
  }
  function pt(p){return Math.round(p[0]*10)/10+" "+Math.round(p[1]*10)/10;}
  function dOf(g){return "M"+pt(g.p0)+" Q"+pt(g.c)+" "+pt(g.p1);}
  function at(g,t){
    var u=1-t;
    return [u*u*g.p0[0]+2*u*t*g.c[0]+t*t*g.p1[0],u*u*g.p0[1]+2*u*t*g.c[1]+t*t*g.p1[1]];
  }
  function tag(name,attrs,parent){
    var el=document.createElementNS(NS,name);
    Object.keys(attrs||{}).forEach(function(k){el.setAttribute(k,attrs[k]);});
    if(parent)parent.appendChild(el);
    return el;
  }
  function trunc(s,max){return s.length>max?s.slice(0,max-1)+"…":s;}

  /* ----- build static SVG ----- */
  function buildTwin(){
    TWIN_EDGES=CONNECTIONS.map(function(c){return {a:c.a,b:c.b,label:c.label,rel:c.rel,kind:"designed"};})
      .concat(CORE_CONNECTIONS.map(function(c){return {a:c.a,b:c.b,label:c.label,rel:c.rel,kind:"core"};}));
    var edgesG=document.getElementById("twinEdges"),nodesG=document.getElementById("twinNodes");
    edgesG.innerHTML="";nodesG.innerHTML="";
    var issues=verifiedIssues();
    TWIN_EDGES.forEach(function(e){
      var p=tag("path",{d:dOf(geom(e.a,e.b)),"data-rel":e.rel,"data-a":e.a,"data-b":e.b,id:"edge-"+(e.a+"-"+e.b).toLowerCase()},edgesG);
      p.setAttribute("class","twin-edge "+e.kind);
      e.el=p;
    });
    var all=["FCT"].concat(TOWERS.map(function(t){return t.id;}));
    all.forEach(function(id){
      var m=towerModel(id),pos=TWIN_POS[id];
      var g=tag("g",{"class":"twin-node-group"+(id==="FCT"?" twin-center-node":""),"data-node":id,tabindex:"0",role:"button"},nodesG);
      var name=id==="FCT"?"FCT Core":TOWER_BY_ID[id].name;
      g.setAttribute("aria-label",hasCurrentSnapshot()?name+": "+toneWord(m.tone)+", "+m.crit+" critical, "+m.high+" high, "+m.medlow+" medium or low exceptions. Select to inspect.":name+": no snapshot for "+FILTERS.period+". Select to inspect available tower history.");
      if(id==="FCT"){
        tag("circle",{cx:pos.x,cy:pos.y,r:pos.r,"class":"twin-node-bg"},g);
        tag("text",{x:pos.x,y:pos.y-34,"class":"twin-t-id"},g).textContent="FCT CORE";
        tag("text",{x:pos.x,y:pos.y-20,"class":"twin-t-name"},g).textContent="Executive hub";
        if(hasCurrentSnapshot()){
          [[m.crit,"Critical"],[m.high,"High"],[m.medlow,"Med/Low"]].forEach(function(s,i){
            var cx=pos.x+(i-1)*44;
            tag("text",{x:cx,y:pos.y+4,"class":"twin-t-val"},g).textContent=n(s[0]);
            tag("text",{x:cx,y:pos.y+16,"class":"twin-t-lab"},g).textContent=s[1];
          });
        }else{
          tag("text",{x:pos.x,y:pos.y+2,"class":"twin-t-val"},g).textContent="—";
          tag("text",{x:pos.x,y:pos.y+13,"class":"twin-t-lab"},g).textContent="no snapshot";
          tag("text",{x:pos.x,y:pos.y+29,"class":"twin-t-name"},g).textContent="Historical data unavailable";
        }
        tag("text",{x:pos.x,y:pos.y+48,"class":"twin-t-health fill-"+m.tone,style:"text-anchor:middle"},g).textContent=hasCurrentSnapshot()?toneWord(m.tone):"No snapshot";
        tag("text",{x:pos.x,y:pos.y-pos.r-8,"class":"twin-t-flag","data-flag":id,style:"text-anchor:middle"},g);
        return;
      }
      var x=pos.x-NODE_W/2,y=pos.y-NODE_H/2;
      tag("rect",{x:x,y:y,width:NODE_W,height:NODE_H,rx:12,"class":"twin-node-bg"},g);
      tag("circle",{cx:x+16,cy:y+21,r:5.5,"class":"fill-"+m.tone},g);
      tag("text",{x:x+28,y:y+26,"class":"twin-t-id"},g).textContent=id;
      tag("text",{x:x+NODE_W-10,y:y+25,"class":"twin-t-health fill-"+m.tone},g).textContent=hasCurrentSnapshot()?toneWord(m.tone):"No snapshot";
      tag("text",{x:x+16,y:y+42,"class":"twin-t-name"},g).textContent=TOWER_BY_ID[id].name;
      [[hasCurrentSnapshot()?m.crit:"—","Critical",m.crit?"bad":""],[hasCurrentSnapshot()?m.high:"—","High",m.high?"warn":""],[hasCurrentSnapshot()?m.medlow:"—","Med/Low","good"]].forEach(function(s,i){
        var cx=x+NODE_W*(0.17+i*0.33);
        tag("text",{x:cx,y:y+66,"class":"twin-t-val "+s[2]},g).textContent=n(s[0]);
        tag("text",{x:cx,y:y+77,"class":"twin-t-lab"},g).textContent=s[1];
      });
      tag("text",{x:x+NODE_W-8,y:y-6,"class":"twin-t-flag","data-flag":id},g);
    });
    var key=document.getElementById("twinLegend");
    key.innerHTML='<span><i></i>Connection</span><span><i class="lr"></i>Critical</span><span><i class="la"></i>High</span><span><i class="lg"></i>Low or healthy</span><span><i class="flow"></i>Impact flow for selected issue</span><span>Select a tower to colour its connections by severity.</span>';
  }

  /* Edge colour: every edge is neutral until a tower (or an issue) is selected. Then the selected tower's
     connections take the severity of what flows through them: red critical, amber high, green low or healthy. */
  function edgeTone(e,iss,pathHops){
    if(!hasCurrentSnapshot())return null;
    if(pathHops&&pathHops.some(function(h){return (e.a===h[0]&&e.b===h[1])||(e.a===h[1]&&e.b===h[0]);}))
      return iss.tone==="r"?"r":"a";
    if(!twin.touched||!twin.tower)return null;
    var t=twin.tower;
    if(t==="FCT")return e.kind==="core"?towerModel(e.a==="FCT"?e.b:e.a).tone:null;
    if(e.a!==t&&e.b!==t)return null;
    if(e.kind==="core")return towerModel(t).tone;
    var top=0;
    issuesBetween(e.a,e.b).forEach(function(i){top=Math.max(top,SEV_RANK[i.sev]||0);});
    return top>=4?"r":top===3?"a":top>0?"g":null;
  }
  /* ----- repaint dynamic state ----- */
  function paintTwin(){
    var iss=currentIssue();
    var path=iss?issueHops(iss):null;
    var affected=iss?iss.affects:[];
    document.querySelectorAll("#twinNodes .twin-node-group").forEach(function(g){
      var id=g.dataset.node;
      g.classList.toggle("active",id===twin.tower);
      g.classList.toggle("src",!!iss&&iss.source===id);
      g.classList.toggle("hit",!!iss&&affected.indexOf(id)>-1);
      var flag=g.querySelector("[data-flag]");
      if(flag){
        flag.textContent=iss&&iss.source===id?"ORIGIN":iss&&affected.indexOf(id)>-1?"AFFECTED":"";
        flag.setAttribute("class","twin-t-flag "+(iss&&iss.source===id?"fill-r":"fill-a"));
      }
    });
    var pathHops=path?path.hops:null;
    TWIN_EDGES.forEach(function(e){
      var c=e.el.classList;
      var tone=edgeTone(e,iss,pathHops);
      ["sev-r","sev-a","sev-g"].forEach(function(k){c.remove(k);});
      if(tone)c.add("sev-"+tone);
      var match=twin.filter==="all"||e.rel===twin.filter;
      c.toggle("fltr",twin.filter!=="all"&&match&&!tone);
      c.toggle("dim",!match);
    });
    var fg=document.getElementById("twinFlow");
    fg.innerHTML="";
    var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
    function drawFlow(hops,tone,illus,value){
      var labelled={};
      hops.forEach(function(h){
        var g=geom(h[0],h[1]);
        var cls="twin-flow-line "+(illus?"illus":"tone-"+tone);
        var p=tag("path",{d:dOf(g),"class":cls,"marker-end":"url(#twin-arrow-"+(illus?"n":tone)+")"},fg);
        if(value>0&&h[0]===(illus?twin.tower:iss.source)&&!labelled[h[0]]){
          labelled[h[0]]=1;
          var m=at(g,0.38),txt=money(value),w=txt.length*6.8+14;
          var ag=tag("g",{"class":"twin-amt tone-"+tone,transform:"translate("+pt(m).replace(" ",",")+")"},fg);
          tag("rect",{x:-w/2,y:-10,width:w,height:20,rx:10},ag);
          tag("text",{x:0,y:4},ag).textContent=txt;
        }
      });
      if(!reduce){
        var gs=hops.map(function(h){return geom(h[0],h[1]);});
        gs.forEach(function(g,i){
          var dot=tag("circle",{r:5,fill:illus?"var(--mute)":"var(--"+(tone==="r"?"crit":"a")+")"},fg);
          tag("animateMotion",{dur:"2.4s",repeatCount:"indefinite",path:dOf(g),begin:(i%2?"1.2s":"0s")},dot);
        });
      }
    }
    if(iss)drawFlow(path.hops,iss.tone==="r"?"r":"a",false,iss.value);
    else if(twin.illus&&twin.tower&&twin.tower!=="FCT"){
      var hs=connectionsOf(twin.tower).filter(function(c){return c.kind==="designed";}).map(function(c){return [twin.tower,c.other];});
      var top=sortEx(towerModel(twin.tower).primary)[0];
      drawFlow(hs,"a",true,top?exVal(top):0);
    }
    paintIssueBar();paintInspector();syncTraceButtons();
  }
  function paintIssueBar(){
    var list=verifiedIssues();
    document.getElementById("twinIssueCount").textContent=hasCurrentSnapshot()?list.length+" verified issue"+(list.length===1?"":"s"):"No "+FILTERS.period+" snapshot";
  }
  function paintInspector(){
    var id=twin.tower||"FCT",m=towerModel(id),isCore=id==="FCT";
    var name=isCore?"FCT Core":TOWER_BY_ID[id].name+" ("+id+")";
    var dotCol="var(--"+(m.tone==="r"?"crit":m.tone==="a"?"a":"g")+")";
    var h='<div class="ch"><h2><span class="num" style="background:'+dotCol+';color:#fff">●</span>'+esc(name)+'</h2><div class="r"><span class="chip '+m.tone+'">'+(hasCurrentSnapshot()?toneWord(m.tone):"No snapshot")+'</span></div></div>'+
      '<p class="qline">'+(!hasCurrentSnapshot()?"Historical snapshot data is not available for "+esc(FILTERS.period)+".":isCore?"The hub that reads all five towers. Its figures roll up the same shared records.":"Tower snapshot from the shared FCT data and open exception register.")+'</p>';
    var ok=hasCurrentSnapshot(),all=sortEx(m.linked);
    var SEVS=[["critical","Critical","r"],["high","High","a"],["medlow","Med/Low","g"]];
    function inSev(x,k){return k==="medlow"?(x.severity==="medium"||x.severity==="low"):x.severity===k;}
    var cnt={critical:m.crit,high:m.high,medlow:m.medlow};
    h+='<div class="twin-sec"><div class="twin-kpis"><div class="twin-kpi" style="grid-column:1/-1"><span class="k">Linked open exceptions</span><strong>'+(ok?n(m.linked.length):"—")+'</strong>'+
      (ok?'<small>'+n(m.crit)+' critical · '+n(m.high)+' high</small>':'')+prov("live")+'</div></div></div>';
    h+='<div class="twin-sec"><div class="twin-kpis three">'+SEVS.map(function(v){
      var on=ok&&twin.insSev===v[0];
      return '<button type="button" class="twin-kpi twin-sevtile '+v[2]+(on?' active':'')+'" data-inssev="'+v[0]+'" aria-pressed="'+on+'"'+(ok?'':' disabled')+'><span class="k">'+v[1]+'</span><strong>'+(ok?n(cnt[v[0]]):"—")+'</strong>'+prov("live")+'</button>';
    }).join("")+'</div></div>';
    if(ok&&twin.insSev){
      var sv=SEVS.filter(function(v){return v[0]===twin.insSev;})[0],list=all.filter(function(x){return inSev(x,twin.insSev);});
      h+='<div class="twin-sec"><h3><span>'+esc(sv[1])+' exceptions ('+n(list.length)+')</span></h3>'+
        (list.length?'<div class="twin-sevlist">'+list.map(function(x){return exItem(x,!isCore&&x.tower!==id);}).join("")+'</div>':'<div class="twin-note" style="margin:0">No '+esc(sv[1].toLowerCase())+' exceptions open'+(isCore?'':' for this tower')+'.</div>')+
        '<div style="margin-top:8px"><button type="button" class="btn" data-actsev="'+esc(twin.insSev)+'" data-acttower="'+esc(isCore?"All":id)+'">Go to Actions →</button></div></div>';
    }
    document.getElementById("twinInspector").innerHTML=h;
  }
  function exItem(x,showFrom){
    var t=sevTone(x.severity);
    return '<div class="twin-item '+t+'"><div><b>'+esc(x.title)+'</b><small>'+esc(x.id)+(showFrom?" · from "+esc(x.tower):"")+' · '+esc(userName(x.owner))+' · due '+esc(x.due||"n/a")+' · '+esc(FCT.status(x))+'</small>'+
      (x.impact&&x.impact.short?'<small>'+esc(x.impact.short)+'</small>':'')+'</div><span class="chip '+t+'" style="align-self:flex-start">'+esc(x.severity)+'</span></div>';
  }
  function resetTwin(){
    if(!twin.touched&&twin.tower==="FCT"&&!twin.issue&&!twin.illus)return;
    twin.tower="FCT";twin.insSev=null;twin.touched=false;twin.issue=null;twin.illus=false;
    paintTwin();
  }
  function selectTower(id){
    twin.tower=id;twin.insSev=null;twin.touched=true;twin.issue=null;
    if(twin.illus&&id==="FCT")twin.illus=false;
    paintTwin();
  }
  function refreshTwin(){
    var list=verifiedIssues();
    if(!list.some(function(i){return i.id===twin.issue;}))twin.issue=null;
    buildTwin();
    renderTwinLinked();
    var live=document.getElementById("twinLive");
    if(live)live.innerHTML='<span class="dot twin-pulse"></span>'+esc(FILTERS.period===D.meta.period?"Live model · "+FILTERS.period:"History through "+FILTERS.period);
    paintTwin();
  }
  /* mark which "Trace flow on map" button is driving the map, so it can be found again after scrolling */
  function syncTraceButtons(){
    var el=document.getElementById("twinLinked");
    if(!el)return;
    [].slice.call(el.querySelectorAll("[data-trace]")).forEach(function(b){
      var on=!!twin.issue&&b.dataset.trace===twin.issue;
      b.classList.toggle("on",on);
      b.setAttribute("aria-pressed",on?"true":"false");
      b.textContent=on?"Tracing on map ✓":"Trace flow on map";
      var row=b.closest(".sig");if(row)row.classList.toggle("tracing",on);
    });
  }
  function renderTwinLinked(){
    var el=document.getElementById("twinLinked");
    if(!el)return;
    var all=verifiedIssues(),sel=twin.linkTower;
    var list=sel==="All"?all:all.filter(function(i){return i.source===sel||i.affects.indexOf(sel)>-1;});
    /* ranked critical > high > med/low (verifiedIssues sorts by severity, then value); first 10, then +5 at a time, or all */
    var total=list.length,shown=twin.linkAll?list:list.slice(0,twin.linkShown);
    var counts={};
    TOWERS.forEach(function(t){counts[t.id]=all.filter(function(i){return i.source===t.id||i.affects.indexOf(t.id)>-1;}).length;});
    var bar='<div class="twin-filter-bar" role="group" aria-label="Filter linked exceptions by tower"><label>Tower:</label>'+
      ["All"].concat(TOWERS.map(function(t){return t.id;})).map(function(id){
        var c=id==="All"?all.length:counts[id];
        return '<button type="button" class="twin-flt-btn'+(id===sel?" active":"")+'" data-linktower="'+esc(id)+'" aria-pressed="'+(id===sel)+'">'+esc(id)+' <span class="lt-n">'+n(c)+'</span></button>';
      }).join("")+'</div>';
    var chip=hasCurrentSnapshot()?(sel==="All"?n(all.length)+' shared':n(list.length)+' of '+n(all.length)+' shared')+(shown.length<total?' · showing '+n(shown.length):''):'No '+esc(FILTERS.period)+' snapshot';
    var empty=hasCurrentSnapshot()?(all.length?"No cross-tower exception involves "+esc(sel)+" in the current filters.":"No active cross-tower exception records."):"No historical exception snapshot for "+esc(FILTERS.period)+".";
    el.innerHTML='<div class="ch"><h2><span class="num">&#8596;</span>Open exceptions linked to multiple towers</h2><div class="r"><span class="chip n">'+chip+'</span></div></div>'+
      '<p class="qline">This list includes only exceptions linked to more than one tower. Tower node counts include every open exception, so node totals will be higher.</p>'+
      (hasCurrentSnapshot()&&all.length?bar:'')+
      (list.length?shown.map(function(i){
        var tn=i.tone,sevName=i.sev==="medium"||i.sev==="low"?"Med/Low":i.sev.charAt(0).toUpperCase()+i.sev.slice(1);
        return '<div class="sig"><div><span class="chip '+tn+'" style="margin-right:8px"><span class="dot"></span>'+esc(sevName)+'</span><b>'+esc(i.source+" ↔ "+i.affects.join(", "))+'</b><small>'+esc(i.id+" · "+i.title+" · "+((i.x.impact&&i.x.impact.short)||"No quantified impact"))+'</small></div>'+
          '<span style="display:flex;gap:6px;flex-wrap:wrap">'+'<button type="button" class="btn" data-trace="'+esc(i.id)+'">Trace flow on map</button><a class="btn" href="'+esc(exceptionLink(i.x))+'" title="Open '+esc(i.id)+' for action in '+esc(i.source)+'">Open source tower →</a></span></div>';
      }).join("")+(total>10?'<div class="twin-more" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0"><span class="twin-note" style="margin:0">Showing '+n(shown.length)+' of '+n(total)+', ordered critical, high, then med/low.</span>'+
          (shown.length<total?'<button type="button" class="btn" data-linkmore="5">Show '+n(Math.min(5,total-shown.length))+' more</button><button type="button" class="btn" data-linkmore="all">Show all '+n(total)+'</button>':'')+
          (shown.length>10?'<button type="button" class="btn" data-linkmore="less">Show top 10</button>':'')+'</div>':''):'<div class="note">'+empty+'</div>')+
      '<div class="dep-footnote">A shared exception is linked in the source data. It is not proof that one tower caused another tower’s outcome. Validate transactions, timing and ownership before attributing impact.</div>';
    syncTraceButtons();
    el.onclick=function(e){
      var f=e.target.closest("[data-linktower]");
      if(f){
        twin.linkTower=f.dataset.linktower;twin.linkShown=10;twin.linkAll=false;renderTwinLinked();
        var again=el.querySelector('[data-linktower="'+twin.linkTower+'"]');if(again)again.focus();
        return;
      }
      var mo=e.target.closest("[data-linkmore]");
      if(mo){
        var k=mo.dataset.linkmore;
        if(k==="all")twin.linkAll=true;else if(k==="less"){twin.linkAll=false;twin.linkShown=10;}else twin.linkShown+=5;
        renderTwinLinked();
        var nb=el.querySelector('[data-linkmore]');if(nb)nb.focus();
        return;
      }
      var b=e.target.closest("[data-trace]");if(!b)return;
      twin.issue=b.dataset.trace;twin.illus=false;paintTwin();
      document.getElementById("twinSvg").scrollIntoView({behavior:"smooth",block:"center"});
    };
  }
  function renderTwin(){
    buildTwin();
    renderTwinLinked();
    var list=verifiedIssues();
    twin.issue=null;
    var live=document.getElementById("twinLive");
    if(live)live.innerHTML='<span class="dot twin-pulse"></span>'+esc(FILTERS.period===D.meta.period?"Live model · "+FILTERS.period:"History through "+FILTERS.period);
    var svg=document.getElementById("twinSvg");
    svg.addEventListener("click",function(e){
      var node=e.target.closest(".twin-node-group");
      if(node)selectTower(node.dataset.node);
    });
    /* a click anywhere on the map card that is not a node (empty canvas, a line, the card padding) returns to the default view */
    var mapCard=svg.closest(".twin-map-card");
    if(mapCard)mapCard.addEventListener("click",function(e){
      if(e.target.closest(".twin-node-group"))return;
      resetTwin();
    });
    svg.addEventListener("keydown",function(e){
      var node=e.target.closest(".twin-node-group");
      if(node&&(e.key==="Enter"||e.key===" ")){e.preventDefault();selectTower(node.dataset.node);}
    });
    document.getElementById("twinInspector").addEventListener("click",function(e){
      var g=e.target.closest("[data-goto]");
      if(g){e.preventDefault();if(g.dataset.goto==="actions")goActions();else location.hash=g.dataset.goto;return;}
      var st=e.target.closest("[data-inssev]");
      if(st){twin.insSev=twin.insSev===st.dataset.inssev?null:st.dataset.inssev;paintInspector();return;}
      var ab=e.target.closest("[data-actsev]");
      if(ab){
        twin.decTower=ab.dataset.acttower;twin.decSev=ab.dataset.actsev;decReset();renderActions();
        goActions();
        return;
      }
      var b=e.target.closest("[data-go]");if(b)selectTower(b.dataset.go);
    });
    paintTwin();
  }

  function renderBriefing(){
    var items=openAll();
    var available=hasCurrentSnapshot();
    var critical=items.filter(function(x){return x.severity==="critical";}).length;
    var high=items.filter(function(x){return x.severity==="high";}).length;
    var first=items[0];
    var exp=impactAmount(openAll());
    document.querySelector(".brief-label").textContent="Executive briefing · "+FILTERS.period;
    document.getElementById("executiveSummary").innerHTML=available?
      '<span class="chip '+(critical?"r":"g")+'"><span class="dot"></span>'+n(critical)+' critical</span>'+
      '<span class="chip a"><span class="dot"></span>'+n(high)+' high</span>'+
      '<span class="chip n">'+n(items.length)+' open decisions</span>':
      '<span class="chip n">No exception snapshot for '+esc(FILTERS.period)+'</span>';
    document.getElementById("executiveSubtitle").textContent=D.meta.client+" · "+FILTERS.period+" · shared tower data; exception values are not a reconciled enterprise exposure.";
    document.getElementById("briefHeadline").textContent=!available?"No exception snapshot for "+FILTERS.period:first?first.title:"No open exceptions are waiting for review";
    document.getElementById("briefSummary").textContent=!available?
      "The shared data has historical trends for some measures, but no exception or enterprise KPI snapshot for this period.":first?
      towerName(first.tower)+" · "+(first.impact&&first.impact.short||"Impact not quantified")+" · "+(first.subject||first.what||"Review the source exception for supporting detail."):
      "The shared FCT decision state has no open exceptions.";
    document.getElementById("briefRiskHeadline").textContent=!available?"Historical risk snapshot unavailable":critical?critical+" critical exception(s) need attention":high?high+" high-severity exception(s) need attention":"No critical or high-severity exceptions";
    document.getElementById("briefRiskSummary").textContent=!available?
      "Only the trend charts with source history can be compared for "+FILTERS.period+".":first?
      "Highest-priority open item: "+first.id+" in "+towerName(first.tower)+". The open amount shown across towers is not additive.":
      "Current alert counts use the selected shared exception scope.";
    document.getElementById("briefDecisionHeadline").textContent=available?n(items.length)+" open exception(s) in the shared queue":"Historical decision snapshot unavailable";
    document.getElementById("briefDecisionSummary").textContent=available?"Close readiness "+n(FCT.v("close.readiness"))+"/90 · audit readiness "+n(FCT.v("audit.readiness"))+"/90 · total source-tower open exception values "+money(exp)+" (not reconciled).":"The exception and decision register has no historical snapshots before Sep-26.";
  }

  function renderRiskAndDependencies(){
    var dd=document.querySelector("#risk .dd");
    if(dd){
      var items=openAll();
      dd.innerHTML='<div class="ch"><h2><span class="num">↔</span>Shared exception counting</h2></div>'+
        '<div class="step"><div class="bar" style="width:100%;background:var(--a)">'+(hasCurrentSnapshot()?n(items.length):"—")+'</div><div class="lab"><b>Open exception records</b><br>'+(hasCurrentSnapshot()?"Unique IDs in the shared FCT exception register":"No snapshot for "+esc(FILTERS.period))+'</div></div>'+
        '<div class="step"><div class="bar" style="width:65%;background:var(--crit)">'+(hasCurrentSnapshot()?n(items.filter(function(x){return x.severity==="critical";}).length):"—")+'</div><div class="lab"><b>Critical severity</b><br>Current exception status, not a control-test count</div></div>'+
        '<div class="step"><div class="bar" style="width:55%;background:var(--a)">'+(hasCurrentSnapshot()?n(FCT.v("controls.failing")):"—")+'</div><div class="lab"><b>Failing controls</b><br>'+(hasCurrentSnapshot()?"Shared CMP/R2R metric":"No historical snapshot supplied")+'</div></div>';
    }
  }

  /* ---------- home-page geographic map: open exceptions from all five towers, placed by business-unit city ---------- */
  var GEO_FALLBACK={"IN-01":["Gurugram",28.4595,77.0266],"IN-02":["Lucknow",26.8467,80.9462],"IN-03":["Dehradun",30.3165,78.0322],
    "IN-04":["Pune",18.5204,73.8567],"IN-05":["Ahmedabad",23.0225,72.5714],"IN-06":["Surat",21.1702,72.8311],
    "IN-07":["Hyderabad",17.385,78.4867],"IN-08":["Kochi",9.9312,76.2673],"US-01":["New York",40.7128,-74.006],"EU-01":["Frankfurt",50.1109,8.6821]};
  var GEO_REGIONS=["North India","West India","South India","North America","Europe"];
  var GEO_SEVS=[["critical","Critical","c"],["high","High","h"],["medium","Medium","m"],["low","Low","lo"]];
  var GEO_COL={critical:"#ef6f6a",high:"#f2a45f",medium:"#e3b13a",low:"#7dc7b7"};
  var geo={sev:"All",region:"All",tower:"All",mode:"city",table:false,sel:null,selTower:null,twOpen:{},q:"",map:null,layer:null,globe:null,projection:"globe",viewInit:false,bound:false,fit:true,view:{cities:[],list:[]}};

  function entityPlace(id){
    var e0=(D.entities||[]).filter(function(x){return x.id===id;})[0]||{},e=e0.site?{lat:e0.site.lat,lng:e0.site.lng,city:e0.site.city,region:e0.region}:e0,f=GEO_FALLBACK[id]||[];
    var lat=isNum(e.lat)?e.lat:isNum(e.latitude)?e.latitude:f[1];
    var lng=isNum(e.lng)?e.lng:isNum(e.lon)?e.lon:isNum(e.longitude)?e.longitude:f[2];
    var city=e.city||f[0];
    if(!id||!city||!isNum(lat)||!isNum(lng))return null;
    return {city:city,lat:lat,lng:lng,region:ENTITY_REGIONS[id]||e.region||"Other",entity:id};
  }
  function geoRows(){
    var out=[],unmapped=0;
    openAll().forEach(function(x){var p=entityPlace(x.entity);if(p)out.push({x:x,p:p});else unmapped++;});
    return {rows:out,unmapped:unmapped};
  }
  function geoVal(r,key){return key==="sev"?r.x.severity:key==="region"?r.p.region:r.x.tower;}
  function geoPass(r,skip){
    return (skip==="sev"||geo.sev==="All"||r.x.severity===geo.sev)&&
           (skip==="region"||geo.region==="All"||r.p.region===geo.region)&&
           (skip==="tower"||geo.tower==="All"||r.x.tower===geo.tower);
  }
  function geoGroup(rows){
    var by={};
    rows.forEach(function(r){
      var c=by[r.p.city]||(by[r.p.city]={city:r.p.city,lat:r.p.lat,lng:r.p.lng,region:r.p.region,items:[],val:0,sev:{critical:0,high:0,medium:0,low:0}});
      c.items.push(r.x);c.val+=exVal(r.x);if(c.sev[r.x.severity]!=null)c.sev[r.x.severity]++;
    });
    return Object.keys(by).map(function(k){
      var c=by[k];c.worst=(GEO_SEVS.filter(function(s){return c.sev[s[0]];})[0]||["low"])[0];c.items=sortEx(c.items);return c;
    }).sort(function(a,b){return b.val-a.val||b.items.length-a.items.length;});
  }
  function geoSevText(c){
    return GEO_SEVS.filter(function(s){return c.sev[s[0]];}).map(function(s){return '<span class="'+s[2]+'">'+s[1].charAt(0)+c.sev[s[0]]+'</span>';}).join(" ");
  }
  function geoMatch(c){
    var q=geo.q;if(!q)return true;
    if((c.city+" "+c.region).toLowerCase().indexOf(q)>-1)return true;
    return c.items.some(function(x){return (x.id+" "+x.title+" "+(x.subject||"")).toLowerCase().indexOf(q)>-1;});
  }

  function geoFilterRows(base){
    var rows=[
      {key:"sev",label:"Risk",opts:[["All","All"]].concat(GEO_SEVS.map(function(s){return [s[0],s[1]];}))},
      {key:"region",label:"Geography",opts:[["All","All"]].concat(GEO_REGIONS.map(function(r){return [r,r];}))},
      {key:"tower",label:"Tower",opts:[["All","All"]].concat(TOWERS.map(function(t){return [t.id,t.id];}))}
    ];
    document.getElementById("geoFilters").innerHTML=rows.map(function(row){
      var tiles=row.opts.map(function(o){
        var cnt=base.filter(function(r){return geoPass(r,row.key)&&(o[0]==="All"||geoVal(r,row.key)===o[0]);}).length;
        var dot=row.key==="sev"&&o[0]!=="All"?'<i style="background:'+GEO_COL[o[0]]+'"></i>':"";
        return '<button type="button" class="geo-tile'+(geo[row.key]===o[0]?" on":"")+'" data-gkey="'+row.key+'" data-gval="'+esc(o[0])+'" aria-pressed="'+(geo[row.key]===o[0])+'"><span class="gl">'+dot+esc(o[1])+'</span><b>'+n(cnt)+'</b></button>';
      }).join("");
      return '<div class="geo-row"><div class="geo-rl">'+row.label+'</div><div class="geo-tiles" style="--n:'+(row.opts.length-1)+'">'+tiles+'</div></div>';
    }).join("");
  }

  /* pin markup is shared by the Leaflet markers and the globe's pin layer, so both views draw identical pins */
  function geoPinHtml(c,d,sel,dim){
    return '<div class="geo-pin'+(sel?" sel":"")+(dim?" dim":"")+'" style="--pc:'+GEO_COL[c.worst]+';width:'+d+'px;height:'+d+'px"><span>'+n(geo.mode==="item"?geoTowerGroups(c).length:c.items.length)+'</span></div>';
  }
  function geoItemHtml(x,sel,dim){
    return '<div class="geo-pin item'+(sel?" sel":"")+(dim?" dim":"")+'" style="--pc:'+GEO_COL[x.severity]+';width:32px;height:32px"><span>'+esc(x.tower)+'</span></div>';
  }
  /* "By tower" view: one pill per tower in each city, labelled like SC-4 (tower, open exceptions), coloured by its worst severity */
  var GEO_TW_W=54,GEO_CL_H=34,GEO_CL_STACK=46;
  /* width of one city container holding k tower pills */
  function geoClusterW(k){return k*GEO_TW_W+(k-1)*4+10+22;}
  /* a city is shown collapsed (just "N towers") until it is selected; selecting it expands it into its tower pills */
  var GEO_COLLAPSED_W=68,GEO_COLLAPSED_H=26;
  function geoCityH(c){return geoExpanded(c)?GEO_CL_H:GEO_COLLAPSED_H;}
  function geoExpanded(c){return geo.mode==="item"&&geo.sel===c.city;}
  function geoCityW(c){return geoExpanded(c)?geoClusterW(geoTowerGroups(c).length):GEO_COLLAPSED_W;}
  function geoTowerGroups(c){
    var by={};
    c.items.forEach(function(x){
      var g=by[x.tower]||(by[x.tower]={tower:x.tower,items:[],sev:{critical:0,high:0,medium:0,low:0}});
      g.items.push(x);if(g.sev[x.severity]!=null)g.sev[x.severity]++;
    });
    var order=TOWERS.map(function(t){return t.id;});
    Object.keys(by).forEach(function(t){if(order.indexOf(t)<0)order.push(t);});
    return order.filter(function(t){return by[t];}).map(function(t){
      var g=by[t];g.worst=(GEO_SEVS.filter(function(v){return g.sev[v[0]];})[0]||["low"])[0];return g;
    });
  }
  /* "By tower" view: ONE container per city, holding one pill per tower (P2P-2, O2C-4, ...). Each pill is coloured by that tower's worst severity and is clickable on its own. */
  function geoPillTitle(c,g){
    return c.city+" · "+g.tower+" · "+n(g.items.length)+" open: "+GEO_SEVS.filter(function(v){return g.sev[v[0]];}).map(function(v){return g.sev[v[0]]+" "+v[0];}).join(" · ");
  }
  function geoClusterHtml(c,tg,sel,dim){
    var cls=(sel?" sel":"")+(dim?" dim":"");
    if(!geoExpanded(c))
      return '<div class="geo-cl collapsed'+cls+'" style="--pc:'+GEO_COL[c.worst]+';width:'+GEO_COLLAPSED_W+'px;height:'+GEO_COLLAPSED_H+'px" title="'+esc(c.city+" · "+tg.length+" tower"+(tg.length===1?"":"s")+" · "+n(c.items.length)+" open")+'"><span class="geo-cl-sum">'+tg.length+' tower'+(tg.length===1?'':'s')+'</span></div>';
    return '<div class="geo-cl'+cls+'" style="width:'+geoClusterW(tg.length)+'px;height:'+GEO_CL_H+'px">'+tg.map(function(g){
      var on=geo.selTower===g.tower;
      return '<span class="geo-tw-pill'+(on?" on":"")+'" data-gtower="'+esc(g.tower)+'" style="--pc:'+GEO_COL[g.worst]+'" title="'+esc(geoPillTitle(c,g))+'">'+esc(g.tower)+'-'+n(g.items.length)+'</span>';
    }).join("")+'<span class="geo-cl-x" data-gcollapse title="Collapse" aria-label="Collapse">&times;</span></div>';
  }
  function geoClusterIcon(c,tg,sel,dim){
    var w=geoCityW(c);
    return L.divIcon({className:"geo-pin-wrap",iconSize:[w,geoCityH(c)+8],iconAnchor:[w/2,geoCityH(c)+8],html:geoClusterHtml(c,tg,sel,dim)});
  }
  function geoClusterTip(c,tg){
    return '<b>'+esc(c.city)+'</b> · '+n(c.items.length)+' open<br>'+tg.map(function(g){return esc(g.tower)+' '+n(g.items.length);}).join(' · ');
  }
  function geoPinIcon(c,d,sel,dim){
    return L.divIcon({className:"geo-pin-wrap",iconSize:[d,d+8],iconAnchor:[d/2,d+8],html:geoPinHtml(c,d,sel,dim)});
  }
  /* push overlapping pins apart along the axis of least overlap, so each pin stays as close as it can to its true position.
     items: {x,y,w,h} with (x,y) the bottom-centre anchor; result is written back into x,y. clampFn(item) may pull a pin back inside bounds. */
  function relaxPins(items,pad,clampFn){
    for(var it=0;it<120;it++){
      var moved=false;
      for(var i=0;i<items.length;i++)for(var j=i+1;j<items.length;j++){
        var a=items[i],b=items[j];
        var dx=(b.x)-(a.x),dy=(b.y-b.h/2)-(a.y-a.h/2);
        var ox=(a.w+b.w)/2+pad-Math.abs(dx),oy=(a.h+b.h)/2+pad-Math.abs(dy);
        if(ox<=0||oy<=0)continue;
        moved=true;
        if(dx===0&&dy===0){dx=(j%2?1:-1)*.01;dy=.01;}
        if(oy<=ox){var sy=(dy<0?-1:1)*oy/2;a.y-=sy;b.y+=sy;}
        else{var sx=(dx<0?-1:1)*ox/2;a.x-=sx;b.x+=sx;}
      }
      if(clampFn)items.forEach(clampFn);
      if(!moved)break;
    }
  }
  function geoSpreadPositions(cities,minDistance,row){
    if(row){
      /* "by tower": every city keeps its own pin; only pins that would overlap are nudged apart */
      var items=cities.map(function(city){var pt=geo.map.latLngToLayerPoint([city.lat,city.lng]);return {x:pt.x,y:pt.y,w:geoCityW(city),h:geoCityH(city)+8,city:city};});
      relaxPins(items,6);
      var out={};
      items.forEach(function(it){out[it.city.city]=geo.map.layerPointToLatLng(L.point(it.x,it.y));});
      return out;
    }
    var groups=[];
    cities.forEach(function(city){
      var point=geo.map.latLngToLayerPoint([city.lat,city.lng]);
      var group=row?null:groups.filter(function(g){
        var dx=point.x-g.x,dy=point.y-g.y;
        return Math.sqrt(dx*dx+dy*dy)<minDistance;
      })[0];
      if(!group){group={cities:[],x:point.x,y:point.y};groups.push(group);}
      group.cities.push({city:city,point:point});
      group.w=Math.max(group.w||0,geoCityW(city));
      group.x=group.cities.reduce(function(sum,item){return sum+item.point.x;},0)/group.cities.length;
      group.y=group.cities.reduce(function(sum,item){return sum+item.point.y;},0)/group.cities.length;
    });
    /* in "by tower" mode a row of cities is wide, so rows that would touch are merged into one longer row */
    if(row){
      var merged=true;
      while(merged){
        merged=false;
        outer:for(var i=0;i<groups.length;i++)for(var j=i+1;j<groups.length;j++){
          var a=groups[i],b=groups[j],dx=a.x-b.x,dy=a.y-b.y;
          /* containers are wide: merge two groups when their boxes would overlap, then stack them vertically */
          if(Math.abs(dx)<(a.w+b.w)/2+8&&Math.abs(dy)<GEO_CL_STACK*(a.cities.length+b.cities.length)/2+4){
            a.w=Math.max(a.w,b.w);
            a.cities=a.cities.concat(b.cities);
            a.x=a.cities.reduce(function(sum,item){return sum+item.point.x;},0)/a.cities.length;
            a.y=a.cities.reduce(function(sum,item){return sum+item.point.y;},0)/a.cities.length;
            groups.splice(j,1);merged=true;break outer;
          }
        }
      }
    }
    var positions={};
    groups.forEach(function(group){
      var count=group.cities.length;
      var members=row?group.cities.slice().sort(function(a,b){return a.point.y-b.point.y;}):group.cities;
      members.forEach(function(item,index){
        if(count===1){positions[item.city.city]=[item.city.lat,item.city.lng];return;}
        if(row){positions[item.city.city]=geo.map.layerPointToLatLng(L.point(group.x,group.y+(index-(count-1)/2)*GEO_CL_STACK));return;}
        var radius=Math.max(minDistance*.72,minDistance/(2*Math.sin(Math.PI/count)));
        var angle=index/count*Math.PI*2-Math.PI/2;
        positions[item.city.city]=geo.map.layerPointToLatLng(L.point(group.x+Math.cos(angle)*radius,group.y+Math.sin(angle)*radius));
      });
    });
    return positions;
  }
  function geoItemIcon(x,sel,dim){
    return L.divIcon({className:"geo-pin-wrap",iconSize:[32,40],iconAnchor:[16,40],html:geoItemHtml(x,sel,dim)});
  }
  /* globe view: created once the Leaflet map exists; null if d3 could not be loaded */
  function geoGlobe(){
    if(geo.globe)return geo.globe;
    if(!geo.map||!window.FCT_GEO_GLOBE||!window.FCT_GEO_GLOBE.supported())return null;
    geo.globe=window.FCT_GEO_GLOBE.create({
      wrap:document.getElementById("geoMap").parentNode,
      getMap:function(){return geo.map;},
      onSelect:function(city,tower,action){geoSelect(city,true,tower,action);}
    });
    return geo.globe;
  }
  function geoCanGlobe(){return !!(window.L&&window.FCT_GEO_GLOBE&&window.FCT_GEO_GLOBE.supported());}
  function geoSetProjection(v){
    if(v!=="globe")v="map";
    if(geo.table){geo.table=false;renderGeo(false);}
    if(!geoEnsureMap())return;
    var g=geoGlobe();if(!g)return;
    geo.projection=v;g.setView(v);geoSyncView();
  }
  function geoSyncView(){
    var seg=document.getElementById("geoViewSeg");if(!seg)return;
    seg.hidden=!geoCanGlobe();
    [].forEach.call(seg.querySelectorAll("[data-geoview]"),function(b){
      var on=b.dataset.geoview===(geoCanGlobe()?geo.projection:"map");b.classList.toggle("on",on);b.setAttribute("aria-pressed",on?"true":"false");
    });
  }
  function geoEnsureMap(){
    if(geo.map)return true;
    var el=document.getElementById("geoMap");
    if(!window.L){el.innerHTML='<div class="geo-nomap">The map library could not be loaded (network or content blocker).</div>';return false;}
    geo.map=L.map(el,{minZoom:2,maxZoom:10,zoomSnap:.5,worldCopyJump:false,maxBounds:[[-75,-200],[85,200]],maxBoundsViscosity:.7,attributionControl:true}).setView([24,40],2);
    geo.map.attributionControl.setPrefix(false);
    window.FCT_GEO_TILES(geo.map);
    geo.layer=L.layerGroup().addTo(geo.map);
    var wrap=el.parentNode,empty=document.createElement("div");empty.className="geo-empty";empty.id="geoEmpty";wrap.appendChild(empty);
    geo.map.on("zoomend",function(){if(geo.view.cities.length)geoPaintMap(geo.view.cities,hasCurrentSnapshot());});
    if(window.ResizeObserver)new ResizeObserver(function(){if(geo.map)geo.map.invalidateSize();}).observe(el);
    window.addEventListener("resize",function(){if(geo.map)geo.map.invalidateSize();});
    return true;
  }
  function geoPaintMap(cities,available){
    if(!geoEnsureMap())return;
    geo.layer.clearLayers();
    var empty=document.getElementById("geoEmpty"),pts=[];
    if(empty){empty.className="geo-empty"+(cities.length?"":" show");empty.textContent=!available?"No exception snapshot for "+FILTERS.period+".":"No open exceptions match the selected filters.";}
    var maxV=cities.reduce(function(m,c){return Math.max(m,c.val);},0);
    var positions=geoSpreadPositions(cities,48,false);
    var gdata=[];
    /* where a pin sits relative to its city's true position on the flat map (after overlap spreading), in pixels */
    function mapOff(ll,c){var a=geo.map.latLngToContainerPoint(ll),b=geo.map.latLngToContainerPoint([c.lat,c.lng]);return [a.x-b.x,a.y-b.y];}
    cities.forEach(function(c){
      var dim=!geoMatch(c),sel=geo.sel===c.city;
      var gc={city:c.city,lat:c.lat,lng:c.lng,pins:[]};gdata.push(gc);
      pts.push([c.lat,c.lng]);
      if(true){
        var d=28+Math.round((maxV?Math.sqrt(c.val/maxV):0)*16);
        var m=L.marker(positions[c.city],{icon:geoPinIcon(c,d,sel,dim),title:c.city,keyboard:true,riseOnHover:true}).addTo(geo.layer);
        var ntw=geoTowerGroups(c).length,tip='<b>'+esc(c.city)+'</b> · '+(geo.mode==="item"?n(ntw)+' tower'+(ntw===1?'':'s')+' · ':'')+n(c.items.length)+' open'+(c.val?' · '+esc(money(c.val)):'');
        m.bindTooltip(tip,{direction:"top",offset:[0,-d-6],className:"geo-tip"});
        m.on("click",function(){if(window.FCT_GEO_RIPPLE)window.FCT_GEO_RIPPLE(geo.map,positions[c.city],GEO_COL[c.worst]);geoSelect(c.city,true);});
        gc.pins.push({html:geoPinHtml(c,d,sel,dim),w:d,h:d+8,tip:tip,label:c.city+", "+(geo.mode==="item"?n(ntw)+" tower"+(ntw===1?"":"s")+", ":"")+n(c.items.length)+" open",mapOff:mapOff(positions[c.city],c),ringIdx:0,ringN:1});
      }else{
        var tg=geoTowerGroups(c),ll=positions[c.city],cw=geoCityW(c);
        /* leader: a dot on the city's true position, and a line to the pin when the pin had to move aside */
        var trueLL=L.latLng(c.lat,c.lng),a0=geo.map.latLngToLayerPoint(trueLL),b0=geo.map.latLngToLayerPoint(ll);
        if((a0.x-b0.x)*(a0.x-b0.x)+(a0.y-b0.y)*(a0.y-b0.y)>64)L.polyline([trueLL,ll],{color:"#b9cfcb",weight:1.4,opacity:.8,interactive:false}).addTo(geo.layer);
        L.circleMarker(trueLL,{radius:4,color:"#0f1a1b",weight:1.2,fillColor:GEO_COL[c.worst],fillOpacity:1,interactive:false}).addTo(geo.layer);
        var m=L.marker(ll,{icon:geoClusterIcon(c,tg,sel,dim),title:c.city,keyboard:true,riseOnHover:true,zIndexOffset:sel?1000:0}).addTo(geo.layer);
        /* a click on one pill selects that tower in this city; a click on the container selects the city */
        m.on("click",function(ev){
          var tg0=ev.originalEvent&&ev.originalEvent.target,t=tg0&&tg0.closest?tg0.closest("[data-gtower]"):null,x=tg0&&tg0.closest?tg0.closest("[data-gcollapse]"):null;
          geoSelect(c.city,true,t?t.getAttribute("data-gtower"):null,x?"collapse":null);
        });
        gc.pins.push({html:geoClusterHtml(c,tg,sel,dim),w:cw,h:geoCityH(c)+8,color:GEO_COL[c.worst],tip:geoClusterTip(c,tg),label:c.city+", "+tg.map(function(g){return g.tower+" "+n(g.items.length);}).join(", ")+" open",mapOff:mapOff(ll,c),ringIdx:0,ringN:1});
      }
    });
    var globe=geoGlobe();
    if(globe)globe.setData(gdata,{row:false});
    var mid0=pts.length?L.latLngBounds(pts).getCenter():{lat:24,lng:40};
    /* the card opens on the globe (the default view); the toggle switches to the flat map */
    if(globe&&!geo.viewInit){geo.viewInit=true;if(geo.projection==="globe")globe.startAsGlobe(mid0.lat,mid0.lng);}
    var spin=geo.fit&&globe&&globe.isGlobe();
    if(geo.fit&&pts.length){
      geo.map.invalidateSize();
      geo.map.fitBounds(pts,{padding:[50,50],maxZoom:4});
      /* on the globe, "fit" means turning to face the same area the flat map would frame */
      if(spin){var mid=L.latLngBounds(pts).getCenter();globe.rotateTo(mid.lat,mid.lng);}
    }else if(geo.fit){geo.map.setView([24,40],2);if(spin)globe.rotateTo(24,40);}
    geo.fit=false;
  }
  function geoPanelHtml(cities,available,totalVal,totalN){
    var sel=geo.sel&&cities.filter(function(c){return c.city===geo.sel;})[0];
    if(sel&&geo.mode==="item"){
      /* By tower: one dropdown per tower in this city; opening it lists that tower's exceptions */
      var tgs=geoTowerGroups(sel);
      return '<div class="geo-ph"><button type="button" class="geo-back" data-geoback>← All cities</button><b>'+esc(sel.city)+'</b><small>'+esc(sel.region)+' · '+n(tgs.length)+' tower'+(tgs.length===1?"":"s")+' · '+n(sel.items.length)+' open exception'+(sel.items.length===1?"":"s")+(sel.val?' · '+esc(money(sel.val))+' source value':'')+'</small></div>'+
        '<div class="geo-list">'+tgs.map(function(g){
          var open=!!geo.twOpen[g.tower],tv=g.items.reduce(function(a,x){return a+exVal(x);},0);
          return '<div class="geo-tw'+(open?" open":"")+'"><button type="button" class="geo-tw-h" data-gtowtoggle="'+esc(g.tower)+'" aria-expanded="'+open+'"><span class="geo-tw-n"><i style="background:'+GEO_COL[g.worst]+'"></i><b>'+esc(g.tower)+'</b></span><span class="geo-tw-m">'+n(g.items.length)+' open'+(tv?' · '+esc(money(tv)):'')+'<em>'+geoSevText(g)+'</em></span><span class="geo-tw-c" aria-hidden="true">▸</span></button>'+
            (open?'<div class="geo-tw-body">'+g.items.map(function(x){
              var t=sevTone(x.severity);
              return '<a class="geo-ex '+t+'" href="'+esc(exceptionLink(x))+'" title="Open '+esc(x.id)+' in '+esc(x.tower)+'"><b>'+esc(x.title)+'</b><small><span class="chip '+t+'">'+esc(x.severity)+'</span>'+esc(x.id)+' · '+esc(userName(x.owner))+' · due '+esc(x.due||"n/a")+'</small><small>'+esc(x.impact&&x.impact.short||"Not quantified")+'</small></a>';
            }).join("")+'</div>':'')+'</div>';
        }).join("")+'</div>';
    }
    if(sel){
      /* with a tower pill selected, only that tower's exceptions in this city are listed */
      var sItems=geo.selTower?sel.items.filter(function(x){return x.tower===geo.selTower;}):sel.items;
      var sVal=sItems.reduce(function(s,x){return s+exVal(x);},0);
      return '<div class="geo-ph"><button type="button" class="geo-back" data-geoback>← All cities</button>'+(geo.selTower?'<button type="button" class="geo-back" style="margin-left:10px" data-geotower-clear>All towers in '+esc(sel.city)+'</button>':'')+'<b>'+esc(sel.city)+(geo.selTower?' · '+esc(geo.selTower):'')+'</b><small>'+esc(sel.region)+' · '+n(sItems.length)+' open exception'+(sItems.length===1?"":"s")+(sVal?' · '+esc(money(sVal))+' source value':'')+'</small></div>'+
        '<div class="geo-list">'+sItems.map(function(x){
          var t=sevTone(x.severity);
          return '<a class="geo-ex '+t+'" href="'+esc(exceptionLink(x))+'" title="Open '+esc(x.id)+' in '+esc(x.tower)+'"><b>'+esc(x.title)+'</b><small><span class="chip '+t+'">'+esc(x.severity)+'</span>'+esc(x.tower)+' · '+esc(x.id)+' · '+esc(userName(x.owner))+' · due '+esc(x.due||"n/a")+'</small><small>'+esc(x.impact&&x.impact.short||"Not quantified")+'</small></a>';
        }).join("")+'</div>';
    }
    var list=cities.filter(geoMatch);
    var head='<div class="geo-ph"><b>Cities</b><small>'+(available?n(totalN)+' open exception'+(totalN===1?"":"s")+' in '+n(cities.length)+' cit'+(cities.length===1?"y":"ies")+(totalVal?' · '+esc(money(totalVal))+' source value':'')+'. Select a marker to list its exceptions.':'No exception snapshot for '+esc(FILTERS.period)+'.')+'</small></div>';
    return head+'<div class="geo-list">'+(list.length?list.map(function(c){
      var share=totalVal?Math.round(c.val/totalVal*100):Math.round(c.items.length/(totalN||1)*100);
      return '<button type="button" class="geo-city'+(c.city===geo.sel?" sel":"")+'" data-geocity="'+esc(c.city)+'"><div class="l1"><b>'+esc(c.city)+'</b><span>'+(c.val?esc(money(c.val)):n(c.items.length)+' open')+'<em>'+share+'%</em></span></div><div class="l2">'+esc(c.region)+' · '+(geo.mode==="item"?n(geoTowerGroups(c).length)+' tower'+(geoTowerGroups(c).length===1?'':'s'):n(c.items.length))+' · '+geoSevText(c)+'</div></button>';
    }).join(""):'<div class="geo-none">'+(geo.q?"No city or exception matches “"+esc(geo.q)+"”.":"No open exceptions match the selected filters.")+'</div>')+'</div>';
  }
  function geoTableHtml(cities,available){
    if(!available)return '<div class="geo-none">No exception snapshot for '+esc(FILTERS.period)+'.</div>';
    if(!cities.length)return '<div class="geo-none">No open exceptions match the selected filters.</div>';
    if(geo.mode==="item"){
      var rows=[];cities.filter(geoMatch).forEach(function(c){c.items.forEach(function(x){rows.push({c:c,x:x});});});
      rows.sort(function(a,b){return sevRank(b.x)-sevRank(a.x)||exVal(b.x)-exVal(a.x);});
      return '<table class="geo-table"><thead><tr><th>Exception</th><th>City</th><th>Tower</th><th>Severity</th><th>Impact</th><th>Owner</th><th>Due</th></tr></thead><tbody>'+rows.map(function(r){
        var x=r.x,t=sevTone(x.severity);
        return '<tr><td><a href="'+esc(exceptionLink(x))+'">'+esc(x.title)+'</a><small>'+esc(x.id)+'</small></td><td>'+esc(r.c.city)+'<small>'+esc(r.c.region)+'</small></td><td>'+esc(x.tower)+'</td><td><span class="chip '+t+'" style="text-transform:capitalize">'+esc(x.severity)+'</span></td><td>'+esc(x.impact&&x.impact.short||"Not quantified")+'</td><td>'+esc(userName(x.owner))+'</td><td>'+esc(x.due||"—")+'</td></tr>';
      }).join("")+'</tbody></table>';
    }
    return '<table class="geo-table"><thead><tr><th>City</th><th>Region</th><th class="num">Open</th><th class="num">Critical</th><th class="num">High</th><th class="num">Medium / low</th><th class="num">Source value</th></tr></thead><tbody>'+cities.filter(geoMatch).map(function(c){
      return '<tr><td><b>'+esc(c.city)+'</b></td><td>'+esc(c.region)+'</td><td class="num">'+n(c.items.length)+'</td><td class="num">'+n(c.sev.critical)+'</td><td class="num">'+n(c.sev.high)+'</td><td class="num">'+n(c.sev.medium+c.sev.low)+'</td><td class="num">'+(c.val?esc(money(c.val)):"—")+'</td></tr>';
    }).join("")+'</tbody></table>';
  }
  function geoSelect(city,fly,tower,action){
    var prevSel=geo.sel;
    if(action==="collapse"){geo.sel=null;geo.selTower=null;geo.fit=false;renderGeo(false);return;}
    geo.sel=geo.sel===city&&!fly?null:city;
    geo.selTower=null;if(geo.sel!==prevSel)geo.twOpen={};
    renderGeo(false);
    if(fly&&geo.map&&geo.sel){
      var c=geo.view.cities.filter(function(x){return x.city===geo.sel;})[0];
      if(c&&geo.globe&&geo.globe.isGlobe())geo.globe.rotateTo(c.lat,c.lng);
      else if(c)geo.map.flyTo([c.lat,c.lng],Math.max(geo.map.getZoom(),5),{duration:.6});
    }
  }
  function geoBind(){
    if(geo.bound)return;geo.bound=true;
    var card=document.getElementById("geoCard");
    card.addEventListener("click",function(e){
      var t=e.target.closest("[data-gkey]");
      if(t){geo[t.dataset.gkey]=t.dataset.gval;geo.sel=null;geo.fit=true;renderGeo(true);return;}
      var v=e.target.closest("[data-geoview]");
      if(v){geoSetProjection(v.dataset.geoview);return;}
      var m=e.target.closest("[data-geomode]");
      if(m){geo.mode=m.dataset.geomode;geo.selTower=null;geo.twOpen={};renderGeo(false);return;}
      var tt=e.target.closest("[data-gtowtoggle]");
      if(tt){
        var tk=tt.dataset.gtowtoggle,lst=document.querySelector("#geoPanel .geo-list"),st=lst?lst.scrollTop:0;
        geo.twOpen[tk]=!geo.twOpen[tk];renderGeo(false);
        lst=document.querySelector("#geoPanel .geo-list");if(lst)lst.scrollTop=st;
        var again=document.querySelector('#geoPanel [data-gtowtoggle="'+tk+'"]');if(again)again.focus();
        return;
      }
      if(e.target.closest("[data-geotower-clear]")){geo.selTower=null;renderGeo(false);return;}
      if(e.target.closest("#geoTableBtn")){geo.table=!geo.table;renderGeo(false);return;}
      if(e.target.closest("[data-geoback]")){geo.sel=null;geo.fit=true;renderGeo(false);return;}
      var c=e.target.closest("[data-geocity]");
      if(c)geoSelect(c.dataset.geocity,true);
    });
    var input=document.getElementById("geoSearch");
    input.addEventListener("input",function(){geo.q=input.value.trim().toLowerCase();geo.sel=null;geo.fit=true;renderGeo(false);});
    input.addEventListener("keydown",function(e){
      if(e.key!=="Enter")return;
      var first=geo.view.cities.filter(geoMatch)[0];
      if(first&&geo.q)geoSelect(first.city,true);
    });
  }
  function renderTowerAtlas(){
    if(!document.getElementById("geoCard"))return;
    geoBind();
    var available=hasCurrentSnapshot(),all=available?geoRows():{rows:[],unmapped:0};
    var base=all.rows;
    var shown=base.filter(function(r){return geoPass(r);});
    var cities=geoGroup(shown);
    geo.view.cities=cities;
    if(geo.sel&&!cities.some(function(c){return c.city===geo.sel;}))geo.sel=null;
    if(!geo.sel)geo.selTower=null;
    else if(geo.selTower){var selC=cities.filter(function(c){return c.city===geo.sel;})[0];if(!selC||!selC.items.some(function(x){return x.tower===geo.selTower;}))geo.selTower=null;}
    var totalVal=cities.reduce(function(s,c){return s+c.val;},0),totalN=shown.length;
    document.getElementById("geoPeriod").textContent=FILTERS.period+(available?" · current snapshot":" · history");
    document.getElementById("geoSub").textContent=(geo.mode==="item"?"Each marker is a city; the number is how many towers have open exceptions there, and colour is the worst open severity. Select a marker to open its towers in the side panel.":"Each marker is a city: colour is the worst open severity, size is the source value of its open exceptions.")+" Totals reconcile to the Risk & control sheet. Snapshot "+FILTERS.period+". Ribbon filters still apply.";
    document.getElementById("geoScope").textContent="Risk, geography and tower chosen here scope only this map."+(all.unmapped?" "+n(all.unmapped)+" group-level exception"+(all.unmapped===1?"":"s")+" without a business unit city are not shown.":"")+" Cities are placed by business unit; the map does not locate individual transactions.";
    geoFilterRows(base);
    var tbtn=document.getElementById("geoTableBtn");
    tbtn.textContent=geo.table?"Show map":"Show as table";tbtn.setAttribute("aria-pressed",geo.table?"true":"false");
    [].forEach.call(document.querySelectorAll("[data-geomode]"),function(b){var on=b.dataset.geomode===geo.mode;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on?"true":"false");});
    geoSyncView();
    document.getElementById("geoMapView").hidden=geo.table;
    var tv=document.getElementById("geoTableView");tv.hidden=!geo.table;
    if(geo.table)tv.innerHTML=geoTableHtml(cities,available);
    document.getElementById("geoPanel").innerHTML=geoPanelHtml(cities,available,totalVal,totalN);
    if(!geo.table)geoPaintMap(cities,available);
    var ins="";
    if(available&&cities.length){
      var reg={};cities.forEach(function(c){reg[c.region]=(reg[c.region]||0)+(totalVal?c.val:c.items.length);});
      var top=Object.keys(reg).sort(function(a,b){return reg[b]-reg[a];})[0],tc=cities[0];
      var tot=Object.keys(reg).reduce(function(s,k){return s+reg[k];},0)||1;
      ins=top+" holds "+Math.round(reg[top]/tot*100)+"% of the open "+(totalVal?"source value ("+money(reg[top])+")":"exceptions")+". "+tc.city+" is the largest city at "+(totalVal?money(tc.val):n(tc.items.length)+" open exception"+(tc.items.length===1?"":"s"))+". Source values come from different towers and are not a reconciled exposure.";
    }
    document.getElementById("geoInsight").textContent=ins;
    document.getElementById("geoInsight").hidden=!ins;
  }
  function renderGeo(fitHint){renderTowerAtlas();}

  function renderAll(){
    /* each section renders on its own, so one failure cannot leave the others stale */
    [["map",renderTowerAtlas],["briefing",renderBriefing],["health cards",renderKpis],["heatmap",renderHeat],["actions",renderActions],["risk",renderRiskAndDependencies],["health modal",refreshHealthModal]].forEach(function(s){
      try{s[1]();}catch(err){console.error("Executive "+s[0]+" failed to render:",err);}
    });
    try{reconcile();}catch(err){}
  }


  document.querySelectorAll("[data-tower]").forEach(function(a){a.href=LINKS[a.dataset.tower];});
  var towerNav=document.querySelectorAll("#fnav .ni a.nrow");
  TOWERS.forEach(function(t,i){if(towerNav[i])towerNav[i].href=t.url;});
  document.querySelector(".fuser b").textContent=D.persona.name;
  document.querySelector(".fuser span").textContent=D.persona.title;
  document.querySelectorAll(".me,.av").forEach(function(el){el.textContent=D.persona.initials;});
  document.querySelector(".brief-label").textContent="Executive briefing · "+FILTERS.period;
  initFilters();
  document.getElementById("connectorStatus").textContent=(D.connectors||[]).length+" systems connected, "+(D.connectors||[]).filter(function(c){return c.status==="Degraded";}).length+" degraded";
  document.getElementById("executiveFoot").textContent="Filters persist in this browser. BU, region, category and risk scope exception records; period selects the month for tower health scores. Enterprise KPI snapshots are available only for Sep-26 and remain group-level because historical/entity-level breakdowns are not in the shared demo data.";

  hideBriefing();
  watchNavLinks();
  tabsToNavbar();
  mergeDecisions();
  try{renderTwin();}catch(err){
    console.error("Financial Command Centre failed to render:",err);
    var ti=document.getElementById("twinInspector");
    if(ti)ti.innerHTML='<div class="note"><b>The Financial Command Centre could not be drawn.</b><br>'+esc(err&&err.message||err)+'</div>';
  }
  bindHealthCards();
  renderAll();
  window.addEventListener("storage",function(e){
    if(e.key==="fct-demo-v1"||e.key===FILTER_KEY)location.reload();
  });
  window.addEventListener("pageshow",function(e){
    if(e.persisted)location.reload();
  });
})();
