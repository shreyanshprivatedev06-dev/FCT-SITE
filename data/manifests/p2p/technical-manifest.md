# P2P Control Tower — Technical Manifest (v2, 21-Oct-2026)

How the P2P tower is built: screens, data, engine, navigation and tests. Shared tower rules are in `general-design.md` and P2P design intent is in `p2p-design-principles.md`; KPI meanings are in `kpi-catalogue.md`. Code-level formulas and calibration anchors are in `data/p2p/MODEL.md`. All data is synthetic and labelled "Illustrative".

## 1. Scope and status
- **Screens:** the P2P tower is **3 screens**, which replaced the 9 earlier pages. Approvals, invoices, payment risk, balances, audit and improvement were folded into these three.
- **Other towers:** keep their own screens. They share the shell, the decision drawer and the collapsible rail.
- **Status:** built and validated. 74 model checks pass; all 44 pages load without console errors; there is no page-level scroll at 1280–2000px widths and no horizontal scroll at 390px.

| Screen | File | Overview (default) | Drill destination |
|---|---|---|---|
| Control tower | `screens/p2p/desk.html` | **KPI sheet**: 5 sections, 12 KPIs | The KPI's detail screen, in place, under the global breadcrumb |
| Vendor profiles | `screens/p2p/vendors.html` | Vendor list and portfolio (spend vs risk, mix, chain breaks by risk, master data, re-reviews, duplicates, onboarding) | Vendor Profile ▶ document or case |
| Process chain | `screens/p2p/process.html` | Six-stage chain, issues, fixes, vendor × stage heat grid | Stage ▶ issue ▶ vendor ▶ document |

## 2. Stack
- **No build step:** static HTML and CSS with classic scripts. Pages run from `node server.js` (http://localhost:8765). Safari blocks `file://` cross-folder scripts, so use the server.
- **Libraries:** React 18.3.1, htm 3.1.1, Recharts 2.12.7, Framer Motion 11.3.31 and prop-types, vendored in `assets/vendor/`. Icons are a Lucide subset in `assets/js/sc/icons.js`, plus extras in `p2p-ui.js`.
- **Font:** Inter (Google Fonts), loaded by `assets/js/p2p/load-p2p.js`.
- **Shell:** `assets/js/fct-core.js` and `fct-ui.js` provide auth, rail, decision drawer and state. P2P pages hide the shell's top bar and close clock (`body.px-full`).

## 3. Files
| File | Role |
|---|---|
| `data/p2p/master.js` | Config: periods, BUs, regions and sites, categories, DoA, SLAs, risk factors, health weights, stages, issue codes, exposure types, case statuses, **KPI catalogue**, opportunities. Also the vendors: 33 named plus generated ones (151 records, 148 active). |
| `data/p2p/ledger.js` | Seeded generator (seed 20261005), run at page load. Produces about 96k invoice lines, each with its full PR → approval → PO → receipt → invoice → payment chain; 16k open PO lines; GRNI; open requisitions; rejected duplicates; 949 cases. |
| `assets/js/p2p/p2p-model.js` | Pure engine (`window.P2PM`): KPIs, facts, breakdowns, health, exposure split, vendor risk, **vendor segments**, process chain, `caseStages`, document chain, evidence, **navigation reducer**. |
| `assets/js/p2p/p2p-ui.js` | Components: ribbon, filter dropdowns, theme toggle, global breadcrumb, tables, bar lists, charts, flow, heat grid, chain timeline, error boundary, mount. |
| `assets/js/p2p/p2p-views.js` | KPI sheet, investigation router, 12 KPI detail views, Vendor Profile, document view, case view. |
| `assets/css/p2p.css` | P2P styles and theme tokens (`--pg`, `--card`, `--kc` and others); Decide-drawer theming scoped to `body.px-full`. |
| `tools/p2p/test-model.js` | 74 checks: determinism, anchors, KPI reconciliation, health maths, exposure separation, filters, navigation, vendor and chain, terminology. |

## 4. Data model
- **Universe:** Jubilant demo, 10 entities (IN-01 … IN-08, US-01, EU-01), 9 spend categories, Apr–Sep 2026 (FY27 H1). Demo clock: Mon 05-Oct-2026 09:10 IST.
- **Records:**
  - **Invoice line:** vendor, BU, site, amount, the PR/approval/PO/gate/GR/invoice/match/payment fields, and issue flags.
  - **Open PO line:** remaining value, expected delivery, status.
  - **Case:** type, vendor, linked records, estimate or value affected, confidence, status.
- **Vendor:** master data, contracts, due-diligence flags, bank-change state, advance, MSME and sole-source flags. Risk score: 60% worst factor + 40% weighted average of seven factors, with escalation floors. The approved category may differ from the model category; a difference triggers a re-review.
- **Calibration anchors:** these keep the drawer exceptions and the SC tower consistent:
  - Sep invoices **14,620**
  - blocked **376 / ₹32.0 Cr**
  - PR-20261006 **1,128 / ₹186.4 Cr**
  - 42 approvals past SLA / ₹6.80 Cr
  - GRNI ₹24.0 Cr
  - 142 gate passes / ₹6.4 Cr
  - no-PO ₹14.7 Cr
  - Sep approval **96.4%**, OTP **87.0%**
  - Q2 spend of the 8 SC suppliers

  Everything else emerges from the generator.
- **Relationships used by the UI:** a case's stages are its type's stage plus the stages of issues on its linked records (`M.caseStages`). A vendor's chain footprint is its issues by stage. The document chain is one PO line from requisition to payment.

## 5. Navigation and state
- **Nav state:** `{ kpi, path:[node], sel }` via `P2PM.nav.reduce`.
  - **Node types:** root, group (dimension and key), vendor, profile, doc, case.
  - **Actions:** `kpi`, `drill`, `crumb`, `back`, `home`, `sel`, `node` (stores view choices such as the breakdown dimension, donut mode and checkpoint filter on the current step).
- **URL hash:** mirrors the path, so links and reloads restore the view. `#kpi=<id>` deep-links from other towers; `#sheet` is the KPI sheet.
- **Filters:** period, BU, region, category, risk and vendor. They are kept in sessionStorage and persist through drill-down.
- **Remembered per viewer:** theme in `localStorage['fct-p2p-theme']`; rail state in `localStorage['fct-rail']`.
- **Live effects:**
  - **Drawer decisions:** recorded in the shared `FCT.state`; the model reads them, e.g. taking PTP-DUP-03 moves exposure from ₹9.19 Cr to ₹8.71 Cr.
  - **Case status changes:** stored in `FCT.state.notes.p2pCase`.
  - **Unsaved notes:** an unsaved investigation note prompts for confirmation before the KPI changes.

## 6. Interaction contract (implemented)
- **Board:** clicking a card or any element on it opens that KPI's detail, pre-selected.
- **Inside details:** click selects; double-click, Enter or › drills; whole-row click opens cases.
- **Breadcrumb:** each step restores its view.
- **Health detail:** checkpoints filter the case table in place; View all resets; the Process chain button navigates.
- **Case screen:** a fixed layout whose content adapts to the 12 case types (see `p2p-design-principles.md` §7).
- **Decide panel:** the shared drawer, themed; its behaviour is unchanged.

## 7. Quality and checks
- **Run:**
  - `node tools/p2p/test-model.js` (74 checks)
  - `node tools/sc/test-model.js -s` (SC regression)
- **Browser QA:** Playwright with WebKit, scripts in the session scratchpad: load every page, click through every card, slice, tile and row, check breadcrumb back and crumb steps, render all case types, measure no-scroll at four sizes and 390px width.
- **Performance:** the page is ready in about 2 s including the seeded ledger; a filter change recomputes in about 40 ms.

## 8. Extending to other towers
- **Reuse as-is:** ribbon, global breadcrumb, `PanelBody`, table and bar-list components, theme tokens and the nav reducer.
- **Replace per tower:** master config, generator and engine.
- **Required:** keep the honesty rules (N/A not zero, exposure ≠ loss, one estimate per case) and the KPI-accent mapping.

## 9. Open assumptions to confirm with the client
- **Thresholds:**
  - DoA limits (₹10 L / ₹1 Cr / ₹5 Cr)
  - 48 h receipt SLA
  - ±2% price tolerance
  - health weights, floors and targets
  - risk weights and escalation floors
  - MSME interest 19.5% p.a.
  - segment thresholds (60% spend; risk factor cut-offs)
- **Backend fields needed:**
  - PR and approval timestamps with approver authority
  - PO release time
  - gate-entry times per site
  - contract price lists with validity and units
  - IRN, capture confidence and match history
  - payment-run and bank-change logs
  - credit, MCA and GST feeds
  - KYC and sanctions dates
  - budget feed
