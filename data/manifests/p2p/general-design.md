# FCT Tower Design Guide — General Rules for Every Tower (v1, 21-Oct-2026)

**Who this is for:** teams building the O2C, R2R, Supply Chain and Compliance towers. It holds the UI/UX rules every tower follows so that all five feel like one product and probe data the same way. P2P is the reference implementation: see `p2p-design-principles.md` for how P2P applies these rules, and `technical-manifest.md` for code you can reuse.

**The split, in one sentence:** *how* a user probes (layout, breadcrumb, clicks, card anatomy, visual system, honesty rules) is **the same in every tower**; *what* they probe (KPIs, sections, breakdowns, entities, case types, process stages, segments) is **specific to each tower**.

## 1. What is shared vs. what each tower defines
| Shared, do not change | Each tower defines its own |
|---|---|
| Shell: collapsible rail, ribbon, global breadcrumb, content area | The KPIs on its sheet, with formulas, targets and bases |
| The probing model and click grammar (sections 2 and 5) | Sheet sections and their order |
| KPI card anatomy and the composite "health" card pattern | Breakdown dimensions (e.g. customer, ageing, GL account, plant) |
| Detail-screen and case-screen templates | The main entity (vendor, customer, account, material, control) and its profile |
| Breadcrumb look and behaviour | Case types and what "What happened" shows for each |
| Visual system: Inter, themes, status colours, motion | KPI accent colours (picked from the shared palette) and icons |
| Honesty rules (section 8) | Process stages (e.g. Order → Credit → Dispatch → Invoice → Cash) |
| Filters behave globally and persist | Which filters it offers and which segmentation it uses |

Examples of tower-specific content (illustrative; each tower confirms its own):

| Tower | Main entity | Example headline KPIs | Example process stages | Example segmentation |
|---|---|---|---|---|
| P2P (built) | Vendor | Health, Spend, Open Commitments, Overdue Payables, Potential Exposure | PR → Approval → PO → Receipt → Invoice → Payment | Kraljic: Strategic, Leverage, Bottleneck, Transactional |
| O2C | Customer | Health, Revenue, Receivables, Overdue AR / DSO, Credit exposure | Order → Credit check → Dispatch → Invoice → Collection → Cash applied | Customer tier or risk class |
| R2R | Entity / GL account | Close health, Journals pending, Unreconciled balances, P&L adjustments | Sub-ledger → Journal → Reconciliation → Review → Close → Report | Entity or materiality class |
| Supply Chain | Material / plant | Health, Inventory value, Excess / slow stock, Material exposure | Forecast → Plan → Procure → Receive → Produce → Ship | ABC/XYZ class |
| Compliance | Control | Control health, Failing controls, Open issues, Audit readiness | Design → Operate → Test → Issue → Remediate → Close | Control criticality |

## 2. The probing model (identical in every tower)
**Overview first, detail on demand, and always know where you are.**
```
KPI sheet ──click a KPI──▶ KPI detail ──drill──▶ breakdown ──drill──▶ entity ──▶ Entity Profile
                                                                         └──▶ record / case ──▶ evidence
```
- **The overview is the default screen.** In a tower it is the KPI sheet. A screen that is an overview of something else (a portfolio, a process chain) follows the same rule.
- **Detail replaces the overview in place.** It never opens in a modal or a split panel. The page stays one screen deep, and the breadcrumb carries the depth.
- **Every path can end at evidence.** Typical chain: KPI ▶ breakdown ▶ entity ▶ record or case ▶ source documents.
- **Every entity has a profile** that explains why it surfaced in the current analysis.

## 3. Screen anatomy
```
┌ rail ┐┌─────────────────────────── ribbon ──────────────────────────────┐
│      ││ ☰  [screen tabs with icons]        [filters: label/value] ☀  PR │
│ tower││─────────────────────────── breadcrumb ───────────────────────────│
│ codes││ ←  [Overview: KPI sheet] ▶ [KPI: …] ▶ [Breakdown: …] ▶ [Case: …]  │
│      ││─────────────────────────── content ──────────────────────────────│
│      ││  overview, or the detail screen of the current breadcrumb step    │
└──────┘└───────────────────────────────────────────────────────────────────┘
```
- **Rail:** collapsible to tower codes; it remembers the user's choice.
- **Ribbon:** brand-teal gradient, square corners, gold underline. It holds up to three screen tabs per tower, the global filters (two-line fields; an active filter turns amber), the light/dark toggle and the user menu.
- **Breadcrumb:** always visible under the ribbon (section 4).
- **Content:** each area scrolls inside itself. **The page never scrolls on desktop**, and nothing scrolls sideways at phone width.

## 4. Breadcrumb rules
- **Shape:** arrow-shaped segments in one row, scrolling sideways; the newest step is always visible.
- **Each step:** an icon, a small level name ("Overview", "KPI", the dimension name, "Customer", "Document", "Case") and a bold label.
- **Current step:** filled with the KPI's accent colour. Earlier steps are neutral and clickable.
- **Restore:** clicking any step restores that view and its selection. A back arrow steps up one level. The first step returns to the overview.
- **URL:** the path is mirrored in the URL hash, so links and reloads reopen the same view. Support a deep link such as `#kpi=<id>`.
- **Don't:** use a plain "A > B > C" text crumb, or lose filters or selection on navigation.

## 5. Click grammar
| User action | Result |
|---|---|
| Click a KPI card, or any chart element, tile or row on it | Opens that KPI's detail with the clicked item pre-selected |
| Single-click a bar or row inside a detail | Selects it and shows its detail locally (no navigation) |
| Double-click, Enter, or the › button | Drills one level and adds a breadcrumb step |
| Click anywhere on a case or record row | Opens it (whole row is the target; the arrow stays as a cue) |
| Click a breadcrumb step | Goes back to that level, with its selection restored |
| Change a global filter | Applies at every level; never clears the path or the entity in focus |

Every interaction also works from the keyboard. Double-click is never the only route.

## 6. The KPI sheet
- **Sections:** each has an icon tile, a title and a one-line description. They sit on the page with no tinted boxes, separated by a hairline and spacing. Typical order: Headline KPIs, then subject sections (spend/revenue/balances), entities and exposure, controls, and exceptions.
- **Headline composite card:** a full-width "health" card for the tower.
  - **Left:** score ring, band, change, coverage, trend.
  - **Right:** one tile per component, showing value, score bar, an "% of entities affected" tag and a note.
  - **Segment filter:** the tower's own segmentation re-scopes the tiles.
- **Standard KPI card, top to bottom:**
  1. Icon, title and basis tag (period or "Snapshot").
  2. Value with a chip for change or count.
  3. One visual.
  4. One plain-language note.
  5. A **boxed contributor table**: the top four, each with a thin bar and three figures.
  6. A three-figure footer pinned to the bottom.
- **Layout:** four standard cards per row on wide screens, 2×2 on laptops. Cards in a row share the same height, and there is no leftover white space.
- **Notes:** one or two plain sentences with the numbers (e.g. *"₹54 Cr of bills are past due. ₹41 Cr will be paid in the next run."*). They must be computed from data on screen. No icon, no jargon, no guessed causes.
- **Type scale:** small on purpose. Body 12–13px, section title about 17px, card value about 21px. Labels stay on one line with an ellipsis and show the full text on hover.

## 7. Detail and case templates
- **KPI detail screen:**
  - **Header:** icon and title in the KPI accent, the question it answers, basis, filter count and a definition popover (formula, denominator, exclusions, owner, refresh, drill path).
  - **Body:** the value and three or four stats, a trend against target, a breakdown with a "By:" picker, and a compact grouped record table.
- **Process checkpoints (where a tower has a process):** one card per stage, coloured by the share of records with issues (green under 5%, amber 5–15%, red over 15%). Clicking a stage filters the record table in place; View all resets it, and a button opens the full process screen.
- **Case screen (investigation workspace):** the same layout in every tower, with content adapted to the case type.
  - **Header strip:** exposure or value, confidence, days open, records, outstanding, which measure it counts in.
  - **Summary:** a plain-language summary and the estimation method.
  - **What happened:** specific to the case type.
  - **Entity panel:** identity, risk, history.
  - **Context:** the process chain of the main record, related exceptions and evidence.
  - **Actions:** investigate actions.
- **Decisions:** go through the shared decision drawer, themed to match. Never build a second decision mechanism.

## 8. Honesty rules (non-negotiable)
1. **No fake zeros:** missing or ineligible data shows **N/A**. Show coverage when data is partial.
2. **Keep measures separate:** potential exposure, disputed amounts and confirmed loss are never added together. Control issues show "value affected", never a loss estimate.
3. **Count once:** one estimate per case.
4. **Reconcile:** totals agree across sheet, detail, tables and profiles, so build every view from one shared model.
5. **Label demo data** as illustrative. Separate period flows from snapshot balances, and state the date of each.
6. **No silent changes:** nothing on screen changes unless the user acts.
7. **Use domain vocabulary consistently** (e.g. P2P always says "vendor").

## 9. Visual system
- **Font:** Inter (Google Fonts) for all text, with tabular figures for numbers.
- **Themes:** dark by default plus a light theme. Always three contrasting layers: page, card, detail.
- **KPI accents:** one accent and one icon per KPI, used on its card, detail title and breadcrumb step. Pick from teal `#4FB3A3`, blue `#6E9BE0`, violet `#A08BE0`, amber `#E0B25A`, green `#6CC18F`, rust `#E58A6B` (light-theme equivalents are in `assets/css/p2p.css`).
- **Status:** green on target, amber watch, red off target, always paired with a label. **Risk:** Critical red, High orange, Medium ochre, Low grey-green.
- **Shape and motion:** square ribbon and breadcrumb, cards with a 6–8px radius, no decorative shadows. Motion only where it shows a change: breadcrumb step-in, detail slide in the direction of travel, tab highlight. Respect reduced motion.

## 10. Reuse, don't rebuild
| Reuse from P2P | Replace per tower |
|---|---|
| `p2p-ui.js` components: ribbon (`ScreenTabs`), `FilterBar` and `Dropdown`, `GlobalCrumb`, `PanelBody`, `Table`, `BarList`, charts, `Chain`, `Heat`, `Boundary`, theme toggle | KPI catalogue and config (`data/<tower>/master.js`) |
| Navigation reducer `P2PM.nav` (state, URL hash, restore) | Data model and engine (facts per KPI, breakdowns, cases) |
| Theme tokens and P2P stylesheet patterns (`--kc`, `--card`, `--pg`) | Views: sheet sections, card contents, case "What happened" blocks |
| The shared drawer and `body.px-full` shell mode | Accent and icon mapping per KPI |

## 11. Definition of done for a tower
- [ ] The overview (KPI sheet) is the default; every KPI opens its detail in place.
- [ ] The global breadcrumb follows section 4; every step restores its view; deep links work.
- [ ] Click grammar follows section 5, including keyboard support and whole-row targets.
- [ ] Cards follow the anatomy in section 6. Notes are plain language and built from data.
- [ ] The case screen uses the shared template; decisions go through the shared drawer.
- [ ] Honesty rules hold (section 8); totals reconcile; N/A, empty and error states are shown.
- [ ] Inter, both themes and KPI accents work. No page scroll on desktop; no horizontal scroll at 390px.
- [ ] Model tests cover formulas, reconciliation, filters and navigation.
