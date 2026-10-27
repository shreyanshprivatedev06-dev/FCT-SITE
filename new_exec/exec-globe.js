/* FCT executive layer: globe view for the home-page map.
   Draws the world on a canvas above the Leaflet map and morphs it between the flat Web Mercator map and an
   orthographic globe, so the flat map appears to wrap around itself into a sphere (and unroll again).
   Pins are DOM elements that follow the same projection, so every marker stays on its city throughout.
   Needs d3-geo (window.d3). Land outlines come from world-atlas and need window.topojson; without them the
   globe still works with a graticule and the pins. Loaded by load-exec.js before exec-views.js. */
(function(){
  "use strict";
  var D2R=Math.PI/180;
  var LAND_URL="https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
  var COL_DARK={bg:"#161c1d",sea:"#1b2627",land:"#2b3a3b",border:"#41585a",grat:"rgba(190,220,215,.075)",rim:"#3a5254"};
  var COL_LIGHT={bg:"#f4f6f5",sea:"#dce8ea",land:"#fbfcfb",border:"#b4c5c4",grat:"rgba(30,70,70,.11)",rim:"#9fb5b4"};
  /* the page's real theme is read from what is painted: if the page background is light, the map goes light; otherwise it stays dark */
  function pageLight(){
    var el=document.querySelector(".px-scr")||document.body;
    while(el){var m=(getComputedStyle(el).backgroundColor||"").match(/[\d.]+/g);
      if(m&&m.length>=3&&(m.length<4||parseFloat(m[3])>0.5)){return (0.2126*m[0]+0.7152*m[1]+0.0722*m[2])>140;}
      el=el.parentElement;}
    return false;}
  function syncTheme(){var l=pageLight(),c=document.documentElement.classList;if(c.contains("fct-light")!==l){c.toggle("fct-light",l);}}
  function isDark(){return !document.documentElement.classList.contains("fct-light");}
  syncTheme();
  setInterval(syncTheme,400);
  var COL=isDark()?COL_DARK:COL_LIGHT;
  /* Esri basemap: dark gray in the dark theme, light gray in the light theme; swapped live when the theme button is pressed */
  window.FCT_GEO_TILES=function(map,attr){
    var esri="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
    function u(k){return esri+(isDark()?"World_Dark_Gray_":"World_Light_Gray_")+k+"/MapServer/tile/{z}/{y}/{x}";}
    var base=L.tileLayer(u("Base"),{maxNativeZoom:16,attribution:attr===false?"":"Tiles \u00a9 Esri"}).addTo(map);
    var ref=L.tileLayer(u("Reference"),{maxNativeZoom:16}).addTo(map);
    var last=isDark();setInterval(function(){syncTheme();var d=isDark();if(d!==last){last=d;base.setUrl(u("Base"));ref.setUrl(u("Reference"));}},400);
  };
  /* globes register a redraw here; a resize event is not enough because measure() ignores an unchanged size */
    var themeRedraws=[];
    var lastC=isDark();
    function themeTick(){
      syncTheme();
      var d=isDark();
      if(d!==lastC){
        lastC=d;
        COL=d?COL_DARK:COL_LIGHT;
        themeRedraws.forEach(function(f){try{f();}catch(e){}});
      }
    }
    setInterval(themeTick,400);
    /* react immediately when the theme button flips data-theme, instead of waiting for the next poll */
    if(window.MutationObserver)new MutationObserver(function(){setTimeout(themeTick,0);})
      .observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","class"]});
  var MERC_MAX=85.0511287798*D2R;

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function ease(p){return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;}
  function supported(){var d=window.d3;return !!(d&&d.geoProjectionMutator&&d.geoClipCircle&&d.geoClipAntimeridian&&d.geoPath&&d.geoDistance&&d.geoGraticule10);}
  function el(tag,cls){var e=document.createElement(tag);e.className=cls;return e;}

  /* sonar ripple shown when a pin is clicked. It lives outside the pin nodes on purpose: selecting a city repaints
     every pin, which would cut an animation running inside a pin short. */
  var NO_MOTION=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var RIPPLE_HTML="<i></i><i></i><i></i>",RIPPLE_MS=2000;
  /* flat map: a Leaflet marker added to the map itself (not the pins layer, which is cleared on every repaint),
     so the ripple stays on its spot while the map pans or zooms. color is optional. */
  window.FCT_GEO_RIPPLE=function(map,latlng,color){
    if(NO_MOTION||!map||!window.L||!latlng)return;
    try{
      var m=L.marker(latlng,{icon:L.divIcon({className:"geo-ripple",html:RIPPLE_HTML,iconSize:[0,0],iconAnchor:[0,0]}),interactive:false,keyboard:false,zIndexOffset:-1000}).addTo(map);
      if(color&&m.getElement())m.getElement().style.setProperty("--rc",color);
      setTimeout(function(){try{map.removeLayer(m);}catch(e){}},RIPPLE_MS);
    }catch(e){}
  };

  /* radius (degrees) of the part of the world still visible at morph position t. Above t=.5 the flat map starts to
     fold over at its far edges; cutting the world at this circle removes exactly the part that would fold, so the
     edges look like they curl away behind the globe. At t=1 it is 90 degrees: the visible hemisphere. */
  function capDeg(t){return t<=.5?180:Math.acos(clamp(-(1-t)/t,-1,1))/D2R;}

  function create(opts){
    var d3=window.d3,wrap=opts.wrap;
    var canvas=el("canvas","geo-globe-canvas"),layer=el("div","geo-globe-pins"),tip=el("div","geo-gtip");
    canvas.setAttribute("aria-hidden","true");
    wrap.appendChild(canvas);wrap.appendChild(layer);layer.appendChild(tip);
    var ctx=canvas.getContext("2d");
    var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var S={view:"map",t:0,target:0,anim:null,rotAnim:null,rot:[0,20],s0:163,s1:180,w:0,h:0,dpr:1,
           cities:[],pins:[],land:null,drag:null,raf:0};

    var mutate=d3.geoProjectionMutator(function(t){
      return function(l,p){
        var q=clamp(p,-MERC_MAX,MERC_MAX),mx=l,my=Math.log(Math.tan(Math.PI/4+q/2));
        var cp=Math.cos(p),ox=cp*Math.sin(l),oy=Math.sin(p);
        return [mx+(ox-mx)*t,my+(oy-my)*t];
      };
    });
    var proj=mutate(0),path=d3.geoPath(proj,ctx);
    var SPHERE={type:"Sphere"},GRAT=d3.geoGraticule10();

    /* ---------- land outlines (optional) ---------- */
    function setLand(topo){
      try{
        if(topo&&topo.fill){S.land=topo;}
        else if(topo&&window.topojson){
          var o=topo.objects.countries||topo.objects.land;
          S.land={fill:window.topojson.feature(topo,o),borders:topo.objects.countries?window.topojson.mesh(topo,topo.objects.countries,function(a,b){return a!==b;}):null};
        }
      }catch(e){console.error("Globe land data could not be read:",e);}
      draw();
    }
    if(opts.landData)setLand(opts.landData);
    else if(window.fetch&&window.topojson)fetch(opts.landUrl||LAND_URL).then(function(r){return r.json();}).then(setLand).catch(function(){});

    themeRedraws.push(function(){COL=isDark()?COL_DARK:COL_LIGHT;draw();});

    /* ---------- sizing ---------- */
    function measure(){
      var w=wrap.clientWidth,h=wrap.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);
      if(w===S.w&&h===S.h&&dpr===S.dpr)return;
      S.w=w;S.h=h;S.dpr=dpr;
      canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(h*dpr));
      S.s1=Math.min(w,h)*.43;
      layoutGlobe();draw();
    }
    if(window.ResizeObserver)new ResizeObserver(measure).observe(wrap);
    else window.addEventListener("resize",measure);

    /* ---------- pins ---------- */
    /* On the flat map the host already spread overlapping cities apart (mapOff, in pixels from the true position).
       On the globe we do the same here with offsets that do not depend on rotation, and blend the two while morphing. */
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
    function cityW(c){return c.pins&&c.pins[0]?c.pins[0].w:60;}
    function layoutGlobe(){
      /* groups are found in screen space for the current rotation, because near the globe's edge cities that are far apart
         on the surface can land on top of each other on screen. This runs whenever the globe comes to rest. */
      var minD=S.row?120:48,groups=[],pts=[];
      if(S.w&&S.h&&S.cities.length){
        apply(1);
        var r=proj.rotate(),centre=[-r[0],-r[1]];
        S.cities.forEach(function(c){
          c._off=[0,0];
          var pt=proj([c.lng,c.lat]);
          if(!pt||d3.geoDistance([c.lng,c.lat],centre)>Math.PI/2)return;
          pts.push({c:c,x:pt[0],y:pt[1]});
        });
      }
      if(S.row&&pts.length){
        /* "by tower": keep each pin at its city and only nudge overlapping pins apart, never past the edge of the globe */
        var cx0=S.w/2,cy0=S.h/2,lim=S.s1-46;
        var items=pts.map(function(q){var p0=q.c.pins&&q.c.pins[0];return {x:q.x,y:q.y,w:p0?p0.w:84,h:p0?p0.h:42,q:q};});
        relaxPins(items,6,function(it){
          var dx=it.x-cx0,dy=(it.y-it.h/2)-cy0,d=Math.sqrt(dx*dx+dy*dy);
          if(d>lim&&d>0){it.x=cx0+dx/d*lim;it.y=cy0+dy/d*lim+it.h/2;}
        });
        items.forEach(function(it){it.q.c._off=[it.x-it.q.x,it.y-it.q.y];});
        pts=[];
      }
      pts.forEach(function(q){
        var g=S.row?null:groups.filter(function(g){var dx=q.x-g.x,dy=q.y-g.y;return Math.sqrt(dx*dx+dy*dy)<minD;})[0];
        if(!g){g={m:[],x:q.x,y:q.y,w:0};groups.push(g);}
        g.m.push(q);g.w=Math.max(g.w,cityW(q.c));
        g.x=g.m.reduce(function(s,v){return s+v.x;},0)/g.m.length;
        g.y=g.m.reduce(function(s,v){return s+v.y;},0)/g.m.length;
      });
      /* a row of several cities is wide, so rows that would touch are merged into one longer row */
      if(S.row){
        var merged=true;
        while(merged){
          merged=false;
          outer:for(var i=0;i<groups.length;i++)for(var j=i+1;j<groups.length;j++){
            var a=groups[i],b=groups[j],dx=a.x-b.x,dy=a.y-b.y;
            if(Math.abs(dx)<(a.w+b.w)/2+8&&Math.abs(dy)<46*(a.m.length+b.m.length)/2+4){
              a.w=Math.max(a.w,b.w);
              a.m=a.m.concat(b.m);
              a.x=a.m.reduce(function(s,v){return s+v.x;},0)/a.m.length;
              a.y=a.m.reduce(function(s,v){return s+v.y;},0)/a.m.length;
              groups.splice(j,1);merged=true;break outer;
            }
          }
        }
      }
      groups.forEach(function(g){
        var n=g.m.length;if(n===1)return;
        var list=S.row?g.m.slice().sort(function(a,b){return a.y-b.y;}):g.m;
        list.forEach(function(q,i){
          /* "by tower" containers are wide, so overlapping cities are stacked in a column */
          if(S.row){q.c._off=[g.x-q.x,g.y+(i-(n-1)/2)*46-q.y];return;}
          var rad=Math.max(minD*.72,minD/(2*Math.sin(Math.PI/n))),a=i/n*Math.PI*2-Math.PI/2;
          q.c._off=[g.x+Math.cos(a)*rad-q.x,g.y+Math.sin(a)*rad-q.y];
        });
      });
      S.pins.forEach(function(p){
        var c=p.city,ring=[0,0];
        if(p.ringN>1&&p.stack)ring=[0,(p.ringIdx-(p.ringN-1)/2)*p.stack];
        else if(p.ringN>1){var rr=Math.max(36,36/(2*Math.sin(Math.PI/p.ringN))),a=p.ringIdx/p.ringN*Math.PI*2-Math.PI/2;ring=[Math.cos(a)*rr,Math.sin(a)*rr];}
        p.globeOff=[(c._off?c._off[0]:0)+ring[0],(c._off?c._off[1]:0)+ring[1]];
      });
    }
    function setData(cities,o){
      S.cities=cities||[];S.row=!!(o&&o.row);
      [].slice.call(layer.querySelectorAll(".geo-gpin")).forEach(function(n){layer.removeChild(n);});
      S.pins=[];
      S.cities.forEach(function(c){
        c.pins.forEach(function(p){
          var node=el("div","geo-pin-wrap geo-gpin");
          node.innerHTML=p.html;node.style.width=p.w+"px";node.style.height=p.h+"px";
          node.tabIndex=0;node.setAttribute("role","button");node.setAttribute("aria-label",p.label||c.city);
          var pin={city:c,lat:c.lat,lng:c.lng,w:p.w,h:p.h,tip:p.tip,mapOff:p.mapOff||[0,0],ringIdx:p.ringIdx||0,ringN:p.ringN||1,stack:p.stack||0,node:node,x:0,y:0,op:1};
          node.addEventListener("click",function(e){
            ripple(pin);
            var t=e.target&&e.target.closest?e.target.closest("[data-gtower]"):null;
            var x=e.target&&e.target.closest?e.target.closest("[data-gcollapse]"):null;
            if(opts.onSelect)opts.onSelect(c.city,t?t.getAttribute("data-gtower"):null,x?"collapse":null);
          });
          node.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();ripple(pin);if(opts.onSelect)opts.onSelect(c.city);}});
          node.addEventListener("mouseenter",function(){showTip(pin);});
          node.addEventListener("mouseleave",hideTip);
          node.addEventListener("focus",function(){showTip(pin);});
          node.addEventListener("blur",hideTip);
          layer.appendChild(node);S.pins.push(pin);
        });
      });
      layoutGlobe();draw();
    }
    var tipPin=null;
    function showTip(p){tipPin=p;tip.innerHTML=p.tip||"";tip.classList.add("on");placeTip();}
    function hideTip(){tipPin=null;tip.classList.remove("on");}
    function placeTip(){if(!tipPin)return;tip.style.transform="translate("+tipPin.x+"px,"+(tipPin.y-tipPin.h-8)+"px) translate(-50%,-100%)";}

    /* ---------- click ripple ---------- */
    /* each ripple remembers its city and pin offset, and is re-projected on every draw, so it stays on its spot while the globe turns */
    var ripples=[];
    function ripple(p){
      if(NO_MOTION||!S.w)return;
      var n=el("div","geo-ripple"),col="";
      try{var pe=p.node.querySelector(".geo-pin,.xg-pin");if(pe)col=getComputedStyle(pe).getPropertyValue("--pc").trim();}catch(e){}
      if(col)n.style.setProperty("--rc",col);
      n.innerHTML=RIPPLE_HTML;layer.appendChild(n);
      var rp={n:n,lat:p.lat,lng:p.lng,mo:p.mapOff||[0,0],go:p.globeOff||[0,0]};
      ripples.push(rp);placeRipples(S.t);
      setTimeout(function(){var i=ripples.indexOf(rp);if(i>=0)ripples.splice(i,1);if(n.parentNode)n.parentNode.removeChild(n);},RIPPLE_MS);
    }
    function placeRipples(t){
      if(!ripples.length)return;
      var r=proj.rotate(),centre=[-r[0],-r[1]],cap=capDeg(t)*D2R;
      ripples.forEach(function(q){
        var pt=proj([q.lng,q.lat]);
        if(!pt){q.n.style.visibility="hidden";return;}
        var op=t>.5?clamp((cap-d3.geoDistance([q.lng,q.lat],centre))/.14,0,1):1;
        q.n.style.visibility=op<=.01?"hidden":"visible";
        q.n.style.opacity=op.toFixed(3);
        q.n.style.transform="translate("+(pt[0]+q.mo[0]*(1-t)+q.go[0]*t).toFixed(1)+"px,"+(pt[1]+q.mo[1]*(1-t)+q.go[1]*t).toFixed(1)+"px)";
      });
    }

    /* ---------- drawing ---------- */
    function apply(t){
      mutate(t);
      var s=S.s0+(S.s1-S.s0)*t;
      proj.scale(s).translate([S.w/2,S.h/2]).rotate([-S.rot[0],-S.rot[1]*t]).center([0,S.rot[1]*(1-t)]);
      /* once it is a full globe use d3's standard horizon clip; chaining the antimeridian clip with the circle clip
         is only needed while the flat map is still folding, and it can flip the fill of polygons that wrap the
         poles or cross the antimeridian (Antarctica, Russia, Fiji) as the globe rotates */
      if(t>=1)proj.clipAngle(90);
      else if(t<=.5)proj.preclip(d3.geoClipAntimeridian);
      else{var cc=d3.geoClipCircle(capDeg(t)*D2R);proj.preclip(function(st){return d3.geoClipAntimeridian(cc(st));});}
    }
    function draw(){
      if(!S.w||!S.h||!(S.t>0||S.anim))return;
      var t=S.t,w=S.w,h=S.h;
      apply(t);
      ctx.setTransform(S.dpr,0,0,S.dpr,0,0);
      ctx.clearRect(0,0,w,h);
      COL=isDark()?COL_DARK:COL_LIGHT;ctx.fillStyle=COL.bg;ctx.fillRect(0,0,w,h);
      /* sphere, with a soft glow that grows as it closes into a globe */
      ctx.save();
      ctx.shadowColor="rgba(110,200,185,"+(.28*t*t).toFixed(3)+")";ctx.shadowBlur=26*t*t;
      ctx.beginPath();path(SPHERE);ctx.fillStyle=COL.sea;ctx.fill();
      ctx.restore();
      ctx.beginPath();path(GRAT);ctx.strokeStyle=COL.grat;ctx.lineWidth=1;ctx.stroke();
      if(S.land){
        ctx.beginPath();path(S.land.fill);ctx.fillStyle=COL.land;ctx.fill();
        if(S.land.borders){ctx.beginPath();path(S.land.borders);ctx.strokeStyle=COL.border;ctx.lineWidth=.6;ctx.stroke();}
      }
      /* light falloff: brighter top-left, darker towards the edge */
      if(t>.35){
        var a=clamp((t-.35)/.65,0,1);a=a*a;
        ctx.save();ctx.beginPath();path(SPHERE);ctx.clip();
        var cx=w/2,cy=h/2,R=S.s1,g=ctx.createRadialGradient(cx-R*.35,cy-R*.4,R*.1,cx,cy,R*1.05);
        g.addColorStop(0,"rgba(255,255,255,"+((isDark()?.07:.35)*a).toFixed(3)+")");g.addColorStop(.6,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,"+((isDark()?.42:.1)*a).toFixed(3)+")");
        ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.restore();
      }
      ctx.beginPath();path(SPHERE);ctx.strokeStyle=COL.rim;ctx.lineWidth=1;ctx.stroke();
      placePins(t);
    }
    function placePins(t){
      var r=proj.rotate(),centre=[-r[0],-r[1]],cap=capDeg(t)*D2R;
      S.pins.forEach(function(p){
        var pt=proj([p.lng,p.lat]);
        if(!pt){p.node.style.opacity=0;p.node.style.pointerEvents="none";return;}
        var dist=d3.geoDistance([p.lng,p.lat],centre);
        var op=t>.5?clamp((cap-dist)/.14,0,1):1;
        p.x=pt[0]+p.mapOff[0]*(1-t)+p.globeOff[0]*t;
        p.y=pt[1]+p.mapOff[1]*(1-t)+p.globeOff[1]*t;
        p.op=op;
        p.node.style.transform="translate("+(p.x-p.w/2).toFixed(1)+"px,"+(p.y-p.h).toFixed(1)+"px)";
        p.node.style.opacity=op.toFixed(3);
        p.node.style.pointerEvents=op>.5?"auto":"none";
        p.node.style.visibility=op<=.01?"hidden":"visible";
        p.node.style.zIndex=String(Math.round(1000+p.y));
      });
      placeRipples(t);
      placeTip();
    }

    /* ---------- morph between map and globe ---------- */
    function mapState(){
      var m=opts.getMap&&opts.getMap();if(!m)return false;
      var c=m.getCenter();S.rot=[c.lng,c.lat];S.s0=256*Math.pow(2,m.getZoom())/(2*Math.PI);return true;
    }
    function setView(view){
      if(!supported())return;
      measure();
      var to=view==="globe"?1:0;
      if(S.view===view&&S.target===to&&(S.anim||S.t===to))return;
      var m=opts.getMap&&opts.getMap();
      if(to===1&&S.t===0){if(!mapState())return;layoutGlobe();}
      if(to===0){
        /* land the flat map exactly where the globe is looking, so the hand-over to the tiles is seamless */
        if(m){m.setView([clamp(S.rot[1],-70,80),S.rot[0]],m.getZoom(),{animate:false});mapState();}
      }
      S.view=view;S.target=to;
      wrap.classList.add("geo-3d");
      wrap.classList.toggle("geo-globe",to===1);
      layer.style.display="block";
      cancelAnimationFrame(S.raf);clearTimeout(S.hide);
      var from=S.t,dur=reduce?0:Math.max(350,1700*Math.abs(to-from)),t0=null;
      S.anim=true;hideTip();
      function step(ts){
        if(t0===null)t0=ts;
        var p=dur?clamp((ts-t0)/dur,0,1):1;
        S.t=from+(to-from)*ease(p);
        draw();
        if(p<1)S.raf=requestAnimationFrame(step);
        else{S.t=to;S.anim=false;finish();}
      }
      S.raf=requestAnimationFrame(step);
      if(opts.onViewChange)opts.onViewChange(view);
    }
    function finish(){
      if(S.t===0){
        /* tiles fade back in underneath; keep the pins and canvas for that fade so nothing blinks */
        wrap.classList.remove("geo-3d");wrap.classList.remove("geo-globe");
        S.hide=setTimeout(function(){if(S.t===0){layer.style.display="none";ctx.clearRect(0,0,S.w,S.h);}},420);
      }else draw();
    }

    /* ---------- rotating the globe ---------- */
    function normLng(l){return ((l+540)%360)-180;}
    function rotateTo(lat,lng,ms){
      if(S.t<1||S.anim)return false;
      cancelAnimationFrame(S.rotAnim);
      var from=S.rot.slice(),dl=normLng(lng-from[0]),dp=clamp(lat,-70,80)-from[1],t0=null,dur=reduce?0:(ms||800);
      function step(ts){
        if(t0===null)t0=ts;
        var p=dur?clamp((ts-t0)/dur,0,1):1,e=ease(p);
        S.rot=[normLng(from[0]+dl*e),from[1]+dp*e];draw();
        if(p<1)S.rotAnim=requestAnimationFrame(step);else layoutGlobe();
      }
      S.rotAnim=requestAnimationFrame(step);return true;
    }
    canvas.addEventListener("pointerdown",function(e){
      if(S.t<1||S.anim)return;
      cancelAnimationFrame(S.rotAnim);
      S.drag={x:e.clientX,y:e.clientY,rot:S.rot.slice()};
      try{canvas.setPointerCapture(e.pointerId);}catch(x){}
      wrap.classList.add("geo-drag");hideTip();
    });
    canvas.addEventListener("pointermove",function(e){
      if(!S.drag)return;
      var k=1/(S.s1*D2R);
      S.rot=[normLng(S.drag.rot[0]-(e.clientX-S.drag.x)*k),clamp(S.drag.rot[1]+(e.clientY-S.drag.y)*k,-70,80)];
      draw();
    });
    function endDrag(){if(!S.drag)return;S.drag=null;wrap.classList.remove("geo-drag");layoutGlobe();draw();}
    canvas.addEventListener("pointerup",endDrag);
    canvas.addEventListener("pointercancel",endDrag);

    /* open directly as a globe (no animation), facing lat/lng */
    function startAsGlobe(lat,lng){
      if(!supported())return;
      measure();
      var m=opts.getMap&&opts.getMap();if(!m)return;
      mapState();S.rot=[lng,clamp(lat,-70,80)];
      S.view="globe";S.target=1;S.t=1;S.anim=false;
      wrap.classList.add("geo-3d","geo-globe");layer.style.display="block";
      layoutGlobe();draw();
    }
    return {
      setData:setData,
      startAsGlobe:startAsGlobe,
      setView:setView,
      rotateTo:rotateTo,
      isGlobe:function(){return S.view==="globe";},
      active:function(){return S.t>0||!!S.anim;},
      rotation:function(){return S.rot.slice();},
      /* test hook: draw the morph at a fixed position without animating */
      _show:function(t,rot,s0){measure();S.t=t;if(rot)S.rot=rot;if(s0)S.s0=s0;wrap.classList.add("geo-3d");layer.style.display="block";draw();}
    };
  }

  window.FCT_GEO_GLOBE={create:create,supported:supported};
})();
