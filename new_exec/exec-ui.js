/* FCT executive layer: section tabs and static panels. */
/* ---------- executive section tabs: switch panels instead of scrolling ---------- */
(function(){
  var tabs=[].slice.call(document.querySelectorAll(".section-tabs [data-panel]"));
  /* each tab prints its own page title (and description where it has one) in the page header */
  var HEAD={
    health:{t:"Are we financially healthy, and where do I need to look?",d:"",chips:true},
    twin:{t:"Financial Command Centre",d:"A living model of the business around FCT Core. Each tower shows its financial health, active risks, control failures and open actions. Select a tower for its KPIs, risks and dependencies, or pick a verified issue to see its impact flow.",chips:false},
    risk:{t:"Risk & control",d:"",chips:false},
    actions:{t:"Decisions & Alerts",d:"",chips:false}
  };
  var panels=["health","twin","risk","actions"].map(function(id){return document.getElementById(id)}).filter(Boolean);
  function activate(id,updateHash){
    tabs.forEach(function(t){
      var active=t.dataset.panel===id;
      t.classList.toggle("on",active);
      t.setAttribute("aria-selected",active?"true":"false");
      t.setAttribute("tabindex",active?"0":"-1");
    });
    panels.forEach(function(p){p.hidden=p.id!==id;});
    var crumb=document.getElementById("crumbTitle"),cur=tabs.filter(function(t){return t.dataset.panel===id})[0];
    if(crumb&&cur)crumb.textContent=cur.textContent;
    var brief=document.getElementById("executiveBriefing");
    if(brief) brief.hidden=(id!=="health");
    var hd=HEAD[id]||HEAD.health,ttl=document.querySelector(".main>.head h1"),desc=document.getElementById("tabDesc"),chips=document.querySelector(".main>.head .tags");
    if(ttl)ttl.textContent=hd.t;
    if(desc){desc.textContent=hd.d;desc.hidden=!hd.d;}
    if(chips)chips.hidden=!hd.chips;
    if(updateHash && history.replaceState) history.replaceState(null,"","#"+id);
    window.scrollTo({top:0,behavior:"smooth"});
    // Re-render responsive SVG charts after their panel becomes visible.
    setTimeout(function(){window.dispatchEvent(new Event("resize"));},30);
  }
  tabs.forEach(function(i){
    i.addEventListener("click",function(){activate(i.dataset.panel,true)});
    i.addEventListener("keydown",function(e){
      if(e.key==="ArrowRight"||e.key==="ArrowLeft"){
        e.preventDefault();
        var j=(tabs.indexOf(i)+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
        tabs[j].focus();activate(tabs[j].dataset.panel,true);
      }
    });
  });
  document.querySelectorAll("[data-goto]").forEach(function(a){
    a.addEventListener("click",function(e){e.preventDefault();activate(a.dataset.goto,true)});
  });
  // Start from a valid tab if the URL contains one.
  var initial=location.hash.slice(1);if(initial==="alerts")initial="actions";
  if(!["health","twin","risk","actions"].includes(initial))initial="health";
  activate(initial,false);
  window.addEventListener("hashchange",function(){
    var id=location.hash.slice(1);if(id==="alerts")id="actions";
    if(["health","twin","risk","actions"].includes(id))activate(id,false);
  });
})();

/* ---------- config: change links and data here ---------- */
var LINKS={p2p:"../p2p/executive.html",o2c:"../o2c/executive.html",r2r:"../r2r/executive.html",sc:"../sc/executive.html",cmp:"../cmp/executive.html"};
function css(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
function tw(t){return '<span class="chip n sq tw">'+t.toUpperCase()+'</span>'}

/* ---------- theme ---------- */
(function(){
  var root=document.documentElement,saved=null;
  try{saved=localStorage.getItem("fct-theme")}catch(e){}
  if(saved)root.setAttribute("data-theme",saved);
  document.getElementById("theme").onclick=function(){
    var n=root.getAttribute("data-theme")==="dark"?"light":"dark";
    root.setAttribute("data-theme",n);
    try{localStorage.setItem("fct-theme",n)}catch(e){}
  };
  document.querySelectorAll("[data-tower]").forEach(function(a){a.href=LINKS[a.dataset.tower]});

  /* ---------- sidebar: collapsed rail, expands on button, collapses on main click ---------- */
  var side=document.getElementById("side"),openBtn=document.getElementById("open");
  function setOpen(v){side.classList.toggle("open",v);openBtn.setAttribute("aria-expanded",v?"true":"false")}
  openBtn.onclick=function(e){e.stopPropagation();setOpen(true)};
  document.getElementById("close").onclick=function(e){e.stopPropagation();setOpen(false)};
  document.getElementById("burger").onclick=function(e){e.stopPropagation();setOpen(!side.classList.contains("open"))};
  document.querySelector(".main").addEventListener("click",function(){
    if(window.matchMedia("(max-width:700px)").matches&&side.classList.contains("open"))setOpen(false);
  });
  document.addEventListener("keydown",function(e){if(e.key==="Escape")setOpen(false)});

  var NAV=[["home","Controller home","All towers"],["p2p","Procure to pay","P2P"],["o2c","Order to cash","O2C"],["r2r","Record to report","R2R"],["sc","Supply chain","SC"],["cmp","Compliance","CMP"]];
  var SUB={
    home:[["Executive layer","../home/desk.html"],["Financial health","#health"],["Financial Command Centre","#twin"],["Risk &amp; control","#risk"],["Decisions &amp; Alerts","#actions"]],
    cmp:[["Audit readiness","#audit",22],["Controls","#controls"],["Investigations","#investigations"],["Findings","#findings"],["Evidence pack","#evidence"],["Entity profiles","#entities"]]
  };
  var fnav=document.getElementById("fnav");
  fnav.innerHTML=NAV.map(function(n){
    var inner='<span><span class="tt">'+n[1]+'</span><span class="cc">'+n[2]+'</span></span><span class="chev">&#9654;</span>';
    var cls="ni"+(n[0]==="home"?" cur exp":"");
    if(SUB[n[0]]){
      var base=n[0]==="home"?"":LINKS[n[0]];
      return '<div class="'+cls+'"><button class="nrow" data-toggle>'+inner+'</button><div class="subs">'+
        SUB[n[0]].map(function(s){return '<a href="'+base+s[1]+'">'+s[0]+(s[2]?'<span class="badge">'+s[2]+'</span>':'')+'</a>'}).join("")+'</div></div>';
    }
    return '<div class="'+cls+'"><a class="nrow" href="'+LINKS[n[0]]+'">'+inner+'</a></div>';
  }).join("");
  fnav.querySelectorAll("[data-toggle]").forEach(function(b){b.onclick=function(){b.parentNode.classList.toggle("exp")}});
  var executiveNav=fnav.querySelector('.subs a[href="../home/desk.html"]');
  if(executiveNav)executiveNav.classList.add("act");
  fnav.querySelectorAll(".subs a,a.nrow").forEach(function(a){a.addEventListener("click",function(e){
    var href=a.getAttribute("href")||"";
    if(href.charAt(0)==="#"){
      e.preventDefault();
      var id=href.slice(1),tab=document.querySelector('.section-tabs [data-panel="'+id+'"]');
      if(tab)tab.click();
      setOpen(false);
    }
  })});
})();


document.querySelectorAll('a[href^="#"]').forEach(function(a){
  if(a.closest(".section-tabs") || a.hasAttribute("data-goto")) return;
  var id=(a.getAttribute("href")||"").slice(1);
  if(["health","twin","risk","actions"].includes(id)){
    a.addEventListener("click",function(e){
      e.preventDefault();
      var t=document.querySelector('.section-tabs [data-panel="'+id+'"]');
      if(t)t.click();
    });
  }
});

/* ---------- 2. heatmap ---------- */
var COLS=["Financial exposure","Control failures","Compliance risk","Overdue actions"];
var HEAT=[
 {n:"P2P",d:"Procure to pay",k:"p2p",c:[["r","7.1 Cr","dup. payments"],["r","10","7 key"],["a","Medium","2 audit items"],["a","6","2 overdue 14d+"]]},
 {n:"O2C",d:"Order to cash",k:"o2c",c:[["r","20.4 Cr","overdue risk"],["a","2","0 key"],["g","Low","-"],["r","9","5 overdue 14d+"]]},
 {n:"R2R",d:"Record to report",k:"r2r",c:[["g","1.1 Cr","close delay"],["a","3","2 key"],["g","Low","-"],["g","2","0 overdue"]]},
 {n:"SC",d:"Supply chain",k:"sc",c:[["a","5.3 Cr","excess stock"],["g","1","0 key"],["g","Low","-"],["a","4","1 overdue"]]},
 {n:"CMP",d:"Compliance",k:"cmp",c:[["a","2.2 Cr","penalty risk"],["r","16","14 key, 10 from P2P"],["r","High","8 open findings"],["r","4","of 8 findings"]]}
];
document.getElementById("heat").innerHTML='<tr><th></th>'+COLS.map(function(c){return '<th>'+c+'</th>'}).join("")+'</tr>'+
 HEAT.map(function(r){
  return '<tr><td class="rowh">'+r.n+'<small>'+r.d+'</small></td>'+r.c.map(function(c){
   return '<td><a class="cell '+c[0]+'" href="'+LINKS[r.k]+'" title="Open '+r.n+' tower">'+c[1]+'<small>'+c[2]+'</small></a></td>';
  }).join("")+'</tr>';
 }).join("");

/* ---------- 6. decisions ---------- */
var DEC=[
 {s:"r",d:"Approve payment block on flagged suppliers until duplicate-payment review is complete",i:"4.2 Cr avoided",o:"Head of AP",due:"24-Oct",st:"Awaiting approval",esc:"CFO",el:"r"},
 {s:"r",d:"Approve credit hold and escalation for 6 customers with balances over 90 days",i:"18.6 Cr at risk",o:"Head of Credit",due:"28-Oct",st:"Open",esc:"CFO",el:"r"},
 {s:"a",d:"Fund remediation of 4 overdue audit findings and remove 3 access conflicts",i:"2.2 Cr penalty risk; readiness to 90.5",o:"Chief Compliance Officer",due:"30-Oct",st:"In progress",esc:"Audit committee",el:"a"},
 {s:"a",d:"Approve temporary close support for Oct close and clear 14 ageing reconciliations",i:"1.1 Cr",o:"Corporate Controller",due:"31-Oct",st:"Pending",esc:"CFO",el:"a"},
 {s:"g",d:"Approve markdown or release plan for excess resin and finished-goods stock",i:"2.3 Cr savings",o:"COO",due:"05-Nov",st:"Open",esc:"None",el:"g"}
];
document.getElementById("declist").innerHTML=DEC.map(function(x){
 var money=/saving|avoided/.test(x.i);
 return '<tr class="'+x.s+'"><td><b>'+x.d+'</b></td><td class="'+(money?"pos":"")+'">'+x.i+'</td><td>'+x.o+'</td><td>'+x.due+'</td><td><span class="chip n">'+x.st+'</span></td><td><span class="chip '+x.el+'">'+x.esc+'</span></td></tr>';
}).join("");

/* ---------- filter fields: highlight a narrowed filter (visual only) ---------- */
(function(){
  var ids=["filterBU","filterRegion","filterCategory","filterRisk"];
  function sync(){ ids.forEach(function(id){ var s=document.getElementById(id); if(s&&s.parentNode) s.parentNode.classList.toggle("on",s.value!=="All"); }); }
  ids.forEach(function(id){ var s=document.getElementById(id); if(s) s.addEventListener("change",sync); });
  window.addEventListener("load",sync); setTimeout(sync,0);
})();
