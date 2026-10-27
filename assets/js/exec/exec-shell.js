/* FCT executive layer: page shell markup. Called by load-exec.js, which writes it into the body before the scripts run. */
window.FCT_EXEC_SHELL = String.raw`
<aside class="side open" id="side" aria-label="Main navigation">
  <div class="rail">
    <button class="xbtn" id="open" aria-label="Expand sidebar" aria-expanded="false">&raquo;</button>
    <div class="logo">FCT</div>
    <div class="me">PR</div>
    <a class="on sm" href="#top">All towers</a>
    <a data-tower="p2p" href="#">P2P</a>
    <a data-tower="o2c" href="#">O2C</a>
    <a data-tower="r2r" href="#">R2R</a>
    <a data-tower="sc" href="#">SC</a>
    <a data-tower="cmp" href="#">CMP</a>
  </div>
  <div class="full">
    <div class="fhead">
      <div><div class="logo">FCT</div><div class="sub2">Finance Control Tower</div></div>
      <button class="xbtn" id="close" aria-label="Collapse sidebar">&laquo;</button>
    </div>
    <div class="fuser"><div class="me">PR</div><div><b>Priya Raman</b><span>Group Financial Controller</span></div></div>
    <nav class="fnav" id="fnav"></nav>
    <div class="ffoot"><i></i><span id="connectorStatus">Loading connector status…</span></div>
  </div>
</aside>

<div class="main" id="top">
  <header class="top">
    <button class="burger" id="burger" aria-label="Toggle sidebar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg></button>
    <span class="brandmark"><b>Executive</b><small>Enterprise control tower</small></span>
    <nav class="tabs" aria-label="Executive screens">
      <a class="on" href="#top"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg><span>Control tower</span></a>
      <a href="#actions"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg><span>Decisions &amp; Alerts</span></a>
    </nav>
    <div class="sp"></div>
    <div class="filters">
    <div class="flt period-filter"><label for="filterPeriod">Period</label><select id="filterPeriod" aria-label="Period">
      <option>Apr-26</option><option>May-26</option><option>Jun-26</option><option>Jul-26</option><option>Aug-26</option><option>Sep-26</option>
    </select><svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></div>
    <div class="flt"><label for="filterBU">BU</label><select id="filterBU" aria-label="Business unit"><option value="All">All</option></select><svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></div>
    <div class="flt"><label for="filterRegion">Region</label><select id="filterRegion" aria-label="Region">
      <option value="All">All</option><option>North India</option><option>West India</option><option>South India</option><option>North America</option><option>Europe</option>
    </select><svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></div>
    <div class="flt"><label for="filterCategory">Category</label><select id="filterCategory" aria-label="Category (tower)">
      <option value="All">All</option><option value="P2P">P2P</option><option value="O2C">O2C</option><option value="R2R">R2R</option><option value="SC">SC</option><option value="CMP">CMP</option>
    </select><svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></div>
    <div class="flt"><label for="filterRisk">Risk</label><select id="filterRisk" aria-label="Risk">
      <option value="All">All</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
    </select><svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></div>
    </div>
    <button class="iconbtn" id="theme" title="Toggle light / dark theme" aria-label="Toggle theme">&#9728;</button>
    <div class="av">PR</div>
  </header>
  <div class="filter-status" id="filterStatus" role="status" aria-live="polite"></div>

  <div class="crumb">
    <a class="back" href="#top">&larr;</a>
    <div class="pill"><b id="crumbTitle">Financial health</b></div>
  </div>

  <nav class="sub section-tabs" role="tablist" aria-label="Executive dashboard sections">
    <button class="on" role="tab" aria-selected="true" data-panel="health" title="Enterprise KPIs, targets, performance status, cash and working capital">Financial health</button>
    <button role="tab" aria-selected="false" data-panel="twin" title="Interactive map of P2P, O2C, R2R, SC and Compliance with data flows and dependencies">Financial Command Centre</button>
    <button role="tab" aria-selected="false" data-panel="risk" title="Control effectiveness, critical failures, compliance status and risk heatmaps">Risk &amp; control</button>
    <button role="tab" aria-selected="false" data-panel="actions" title="Every open exception with severity, impact, owner, due date and status, filterable by tower">Decisions &amp; Alerts</button>
  </nav>

  <div class="head">
    <div>
      <h1>Are we financially healthy, and where do I need to look?</h1>
      <p id="executiveSubtitle">Five towers, one view. Reading shared FCT demo metrics and decisions.</p>
      <p id="tabDesc" hidden></p>
    </div>
    <div class="tags" id="executiveSummary">
    <span class="chip n">Loading shared tower data…</span>
    </div>
  </div>

  <!-- 1 -->
  <section id="health" class="tab-panel">
    <section class="geo-card card" id="geoCard" aria-labelledby="geoTitle">
      <div class="geo-top">
        <div class="geo-heading"><h2 id="geoTitle">Map analytics</h2><span class="chip n sq" id="geoPeriod">Sep-26 snapshot</span></div>
        <label class="geo-search"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="geoSearch" type="search" placeholder="Find a city or exception on the map" aria-label="Find a city or exception on the map" autocomplete="off"></label>
        <div class="geo-tools">
          <div class="geo-seg geo-viewseg" id="geoViewSeg" role="group" aria-label="Map or globe view" hidden><button type="button" data-geoview="map" aria-pressed="false"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>Map</button><button type="button" class="on" data-geoview="globe" aria-pressed="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>Globe</button></div>
          <div class="geo-seg" role="group" aria-label="Map grouping"><button type="button" class="on" data-geomode="city" aria-pressed="true">Grouped by city</button><button type="button" data-geomode="item" aria-pressed="false">By tower</button></div>
          <button type="button" class="geo-link" id="geoTableBtn" aria-pressed="false">Show as table</button>
        </div>
      </div>
      <p class="geo-sub" id="geoSub"></p>
      <div class="geo-filters" id="geoFilters" role="group" aria-label="Map filters"></div>
      <p class="geo-sub" id="geoScope"></p>
      <div class="geo-layout" id="geoMapView">
        <div class="geo-map-wrap"><div class="geo-map" id="geoMap" role="application" aria-label="Map of open exceptions by city across all five towers"></div></div>
        <aside class="geo-panel" id="geoPanel" aria-label="Cities"></aside>
      </div>
      <div class="geo-tableview" id="geoTableView" hidden></div>
      <p class="geo-insight" id="geoInsight"></p>
    </section>
    <div class="card">
      <div class="ch"><h2><span class="num">1</span>Enterprise financial health</h2><div class="r"><span class="chip n sq">Snapshot</span></div></div>
      <div class="qline">One card per tower with its health score out of 100. Select a card to open that tower’s health details and key KPIs. Towers without a source-defined score show their open-exception status and key indicators instead; no score is inferred.</div>
      <div class="kpis tower-health-grid" id="kpis"></div>
    </div>
  </section>

  <div class="briefing" id="executiveBriefing">
    <article class="brief-card primary">
      <div class="brief-label">Executive briefing · Sep-26</div>
      <div class="brief-title" id="briefHeadline">Loading shared tower data…</div>
      <p class="brief-copy" id="briefSummary">Reading current metrics and open exceptions from the FCT demo state.</p>
      <a class="brief-link" href="#actions" data-goto="actions">Review priority alerts →</a>
    </article>
    <article class="brief-card">
      <div class="brief-label">What is deteriorating</div>
      <div class="brief-title" id="briefRiskHeadline">Current tower risks</div>
      <p class="brief-copy" id="briefRiskSummary">Ranked from active shared tower exceptions.</p>
      <a class="brief-link" href="#risk" data-goto="risk">View risk &amp; control →</a>
    </article>
    <article class="brief-card">
      <div class="brief-label">Executive attention</div>
      <div class="brief-title" id="briefDecisionHeadline">Decisions pending</div>
      <p class="brief-copy" id="briefDecisionSummary">The decision queue is linked to the FCT exception state.</p>
      <a class="brief-link" href="#actions" data-goto="actions">Open decision queue →</a>
    </article>
  </div>

  <!-- Financial Command Centre Tab -->
  <section id="twin" class="tab-panel" hidden>
    <div class="head">
      <div>
        <h1>Financial Command Centre</h1>
        <p>A living model of the business around FCT Core. Each tower shows its financial health, active risks, control failures and open actions. Select a tower for its KPIs, risks and dependencies, or pick a verified issue to see its impact flow.</p>
      </div>
      <div class="tags">
        <span class="chip a">Highest priority</span>
        <span class="chip g" id="twinLive"><span class="dot twin-pulse"></span>Live model</span>
        <span class="chip n" id="twinIssueCount">0 verified issues</span>
      </div>
    </div>

    <div class="twin-container">
      <div class="twin-map-card">
        <div class="twin-svg-wrap">
        <svg class="twin-svg-canvas" viewBox="0 0 860 620" id="twinSvg" role="group" aria-label="Financial Command Centre map: five towers connected to FCT Core">
          <defs>
            <marker id="twin-arrow-r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--crit)"/></marker>
            <marker id="twin-arrow-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--a)"/></marker>
            <marker id="twin-arrow-n" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--mute)"/></marker>
          </defs>
          <g id="twinEdges"></g>
          <g id="twinFlow"></g>
          <g id="twinNodes"></g>
        </svg>
        </div>

        <div class="twin-legend" id="twinLegend"></div>

      </div>

      <div class="twin-detail-card">
        <div id="twinInspector"></div>
      </div>
    </div>

    <div class="card" id="twinLinked" style="margin-top:14px"></div>
  </section>

  <!-- 2 -->
  <section id="risk" class="tab-panel" hidden>
    <div class="two">
      <div class="card">
        <div class="ch"><h2><span class="num">3</span>Cross-tower risk &amp; control health</h2><div class="r"><span class="chip n sq">Open exceptions</span></div></div>
        <div class="qline">Open exceptions by tower and severity. Select a cell to see those exceptions in Decisions &amp; Alerts.</div>
        <table class="hm hx-grid" id="heat"></table>
        <div class="legend">
          <span><i style="background:var(--crit)"></i>Critical</span>
          <span><i style="background:var(--a)"></i>High</span>
          <span><i style="background:var(--g)"></i>Medium / low</span>
          <span>Darker = more open exceptions</span>
        </div>
        <div class="note" id="heatNote" style="margin-top:10px"></div>
      </div>
      <div class="card dd">
        <div class="ch"><h2><span class="num">&#8645;</span>Why we do not just add the towers</h2></div>
        <div class="step"><div class="bar" style="width:100%;background:var(--mute)">37</div><div class="lab"><b>Failures reported by towers</b><br>Raw sum, double counts shared incidents</div></div>
        <div class="step"><div class="bar" style="width:43%;background:var(--a)">16</div><div class="lab"><b>Unique failing controls</b><br>After deduplicating shared incidents</div></div>
        <div class="step"><div class="bar" style="width:38%;background:var(--crit)">14</div><div class="lab"><b>Key controls failing</b><br>Weighted 3x in the risk index</div></div>
        <div class="step"><div class="bar" style="width:62%;background:var(--crit)">94.2%</div><div class="lab"><b>Risk-weighted control effectiveness</b><br>Target 97%. Raw pass rate (96.1%) hides this gap</div></div>
        <div class="note">One duplicate-payment incident can show up in P2P, R2R and Compliance. Count it once, weight it by financial and regulatory impact.</div>
      </div>
    </div>
  </section>

  <!-- 6 -->
  <section id="actions" class="tab-panel" hidden>
    <div class="card">
      <div class="ch"><h2><span class="num">7</span>Decisions &amp; alerts</h2><div class="r"><span class="chip n">5 open</span></div></div>
      <div class="qline">What leadership needs to decide, what it is worth, and who owns it.</div>
      <table class="dec">
        <thead><tr><th>Decision or action</th><th>Expected impact</th><th>Owner</th><th>Due</th><th>Status</th><th>Escalation</th></tr></thead>
        <tbody id="declist"></tbody>
      </table>
    </div>
  </section>

  <div class="foot" id="executiveFoot">Figures are read from the shared FCT demo data and decision state. Source-tower exception amounts are not a reconciled enterprise exposure.</div>
</div>
`;
