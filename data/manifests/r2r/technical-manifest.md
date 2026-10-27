# R2R Control Tower — Technical Manifest (v1, 21-Oct-2026)

## 1. Screens
| Screen | File | Overview (default) | Drill destination |
|---|---|---|---|
| Control tower | `screens/r2r/desk.html` | KPI sheet: 5 sections, 12 KPIs | KPI detail in place under the global breadcrumb |
| Entity profiles | `screens/r2r/entities.html` | Entity list + portfolio (progress heat by task group, close-risk mix, entity × stage heat, mapping gaps, IC pairs, all entities) | Entity Profile ▶ record or case |
| Close chain | `screens/r2r/process.html` | Six-stage chain, issues, fixes in the pipeline, entity × stage heat | Stage ▶ issue ▶ entity ▶ record |

## 2. Files
| File | Role |
|---|---|
| `data/r2r/master.js` | Config: periods (closes), entities (from `data/core.js` + region, class, controller, history, feeds, local accounts), group CoA with risk class, task groups → stage, journal sources and categories, stages, issue codes, case types and methods, statuses, close-risk factors, health weights, KPI catalogue, fixes. `D.r2rx`. |
| `data/r2r/ledger.js` | Seeded generator (seed 20261002), ~0.1 s: 2,835 close tasks, 7,704 reconciliations, ~23k journals, 861 IC items, 195 variances, 25 unmapped accounts, ~125 cases (Apr–Sep closes). |
| `assets/js/r2r/r2r-model.js` | Pure engine `window.R2RM` (also `window.TOWERM`): filters, facts per KPI, KPIs, health, entity close risk, entity classes, close chain, case stages, entity profile, why-surfaced, record chain, evidence, navigation reducer. |
| `assets/js/r2r/r2r-views.js` | R2R filter bar, KPI sheet, 13 KPI roots, group / entity / Entity Profile / record / case views, router. Sets `P.TOWER`, accents, icons, node labels. |
| `assets/js/r2r/load-r2r.js` | Loader (same vendored React stack as P2P). |
| `assets/js/p2p/p2p-ui.js` | Shared components, reused unchanged in behaviour: ribbon (`ScreenTabs` now reads `P.TOWER`), `Dropdown`, `GlobalCrumb` (`P.NODE` extendable), `PanelBody`, `Table`, `BarList`, `Trend`, `Donut` (`unit`), `Heat` (`rowLabel`), `Chain`, theme, user menu, nav and filter hooks (`P.SKEY` storage prefix). Engine handle: `window.TOWERM || window.P2PM`. |
| `assets/css/r2r.css` | R2R-only case statuses on top of `assets/css/p2p.css`. |
| `tools/r2r/test-model.js` | 113 checks. |

## 3. Data model and anchors
Records carry entity `e`, close month `m` and, where relevant, group account `acct`. Anchors (tests assert them): Sep tasks 486 / done 289 / plan 307 / behind 31 and per entity (`core.entities`); Sep reconciliations 1,284 / certified 1,040 / breaks 8 and per entity; the 12 named reconciliations; reconciling items 214 / 38 / 11 / 4; Sep journals 3,912 / manual 1,146 / AI 352 / exceptions 43 / anomalies 7 (named, with scores); 64 pending (58 low-risk ₹1.20 Cr + 6 named); 14 IN-07 AI drafts ₹2.71 Cr; IC pairs at their balances (IN-02↔US-01 ₹48.70 Cr, ₹3.10 Cr difference); 34 variances / 21 signed; mapping % per entity. Everything else emerges.

## 4. Navigation and state
Same reducer as P2P: `{ kpi, path, sel }`, node types root, group, entity, eprofile, doc, case; hash-mirrored; `#kpi=<id>` deep links. Filters: close, entity, region, entity class, account risk (sessionStorage `fct-r2r-f`). Theme and rail are shared with P2P.

**Live effects:** RTR-CLS-01 Take → 10 IN-07 tasks complete, IN-07 accruals post, IN-07 risk drops, misstatement −₹2.71 Cr; RTR-JNL-08 Take → 58 low-risk journals approved; RTR-PCK-11 Take → account 5418 mapped; drawer decisions move linked case statuses (`onResolve`). Case status changes are stored in `FCT.state.notes.r2rCase`.

## 5. Quality
- `node tools/r2r/test-model.js` (113 checks), `node tools/p2p/test-model.js` (74), `node tools/sc/test-model.js -s`.
- Browser QA (headless Chromium): all 3 screens load without console errors; every sheet card drills to a record; all cases and every record kind render; Entity Profiles; Close-chain drill; filters; drawer Take; no page scroll at 1280×720, 1440×900, 1920×1080; no horizontal scroll at 390 px.

## 6. Open assumptions
Close calendar (WD+4 target, 02-Oct holiday), ₹10 L reconciliation threshold, ₹2 Cr variance threshold, WD+2 cut-off for comparable rates, health weights / floors / targets, close-risk factor scaling, anomaly threshold 0.75, entity classes. Backend fields needed: close-task tool with planned and actual timestamps, reconciliation tool status history, journal approval log with attachments, IC hub confirmations, mapping table history, HRMS availability, connector health.
