# P2P Control Tower — P2P Design Principles (v2, 21-Oct-2026)

How the P2P screens apply the shared FCT tower rules, and the choices that are specific to P2P. **The shared rules for every tower (probing model, breadcrumb, click grammar, card anatomy, honesty rules, visual system) are in `general-design.md`.** Read that first if you are building another tower. This file shows what P2P puts into those patterns. Read it with `kpi-catalogue.md` (what each KPI means) and `technical-manifest.md` (how it is built).

**P2P at a glance:**
- **Entity:** vendor.
- **Screens:** Control tower (KPI sheet), Vendor profiles, Process chain.
- **KPIs:** 12. Health (6 components), Spend, Open Commitments, Overdue Payables, Potential Exposure, Vendor Risk Mix, Top Vendors, and five control rates.
- **Process stages:** PR → PR approval → PO → Goods receipt → Invoice and match → Payment.
- **Segmentation:** Kraljic (Strategic, Leverage, Bottleneck, Transactional).
- **Case types:** 12 (10 financial, 2 control).

## 1. The core idea, as P2P applies it
**Start with the whole picture, go one level deeper with every click, and always know where you are.** A controller opens a KPI sheet, picks a number that looks wrong, and keeps clicking until they reach the vendor, the document and the evidence behind it. The breadcrumb records the path and lets them walk back to any earlier step.

## 2. Design pillars
| # | Pillar | What it means on screen |
|---|---|---|
| 1 | **Overview first, detail on demand** | The default view is the KPI sheet. Detail never crowds the sheet; it replaces it in the same place. |
| 2 | **One screen, one question** | Each screen answers a single question ("What do we owe that is overdue?"). The question sits under the screen title. |
| 3 | **The breadcrumb is the navigation** | Every drill adds a step; every earlier step is clickable and restores what you were looking at. No dead ends, no browser-back dependence. |
| 4 | **Colour means identity, not decoration** | Each KPI owns one accent colour and one icon. The same colour marks its card, its detail title and its breadcrumb step, so the eye maps left to right without reading. |
| 5 | **Numbers you can trust** | Every value, chart, table row and note comes from one shared data model. Totals reconcile across views. Missing data shows as N/A, never zero. |
| 6 | **Exposure is not loss** | Potential exposure, disputed amounts and confirmed loss are always shown separately. Control issues show "value affected", never an estimate of loss. |
| 7 | **Plain language** | Short italic notes explain what is happening in simple words with the numbers that matter. No jargon, no invented causes. |
| 8 | **Vendor-first** | "Vendor" in all visible copy (never "supplier"). Every path can end at a Vendor Profile that explains why the vendor surfaced. |
| 9 | **Dense, calm, fits the screen** | High information density, single-line labels with full text on hover, no page-level scroll, no leftover white space. |

## 3. Screen anatomy
```
┌ rail (collapsible: full ↔ tower codes) ┐┌──────────────────── ribbon ─────────────────────────────┐
│ FCT · towers · P2P / O2C / R2R / SC …  ││ ☰  Control tower | Vendor profiles | Process chain        │
│                                        ││        Period · BU · Region · Category · Risk · 🔍  ☀ PR │
│                                        │├──────────────────── breadcrumb ─────────────────────────┤
│                                        ││ ←  [Overview: KPI sheet] ▶ [KPI: Overdue Payables] ▶ …    │
│                                        │├──────────────────── content ────────────────────────────┤
│                                        ││ KPI sheet  —or—  the detail screen of the current step     │
└────────────────────────────────────────┘└──────────────────────────────────────────────────────────┘
```
- **Rail:** tower navigation, collapsible to a slim strip so the content gets the width. P2P opens collapsed; the choice is remembered.
- **Ribbon:** a brand-teal band with a gold underline and square corners. It holds the three P2P screens, the global filters, the light/dark switch and the user menu. Filters are two-line fields (label over value); an active filter turns amber.
- **Breadcrumb:** always under the ribbon; see section 5.
- **Content:** one screen at a time, scrolling inside its own area. The page itself never scrolls on desktop.

## 4. The KPI sheet (default view)
Five sections, each with an icon tile, a title and a one-line description. There are no tinted boxes: sections sit on the page, separated by spacing and a hairline.

| Section | Contents |
|---|---|
| **Headline KPIs** | P2P Health Score as a full-width card, then Total Spend, Open Commitments, Overdue Payables and Potential Exposure as standard cards (4 in a row; 2×2 on a laptop). |
| **Spend KPIs** | Spend by category (donut and legend with share bars) and Top Vendors by Spend (ranked bars with risk dots). |
| **Vendor and Exposure KPIs** | Risk-mix bar with four tiles (high-risk vendors, re-reviews, master-data quality, duplicate records), and exposure by type. |
| **Control KPIs** | Five rate cards: invoice match, approval, contract price, receipt timeliness and on-time payment. |
| **Exceptions** | Open cases ranked by value, with All / Financial / Control tabs. |

**Standard KPI card**, top to bottom:
1. Icon and title; the basis (period or "Snapshot").
2. Headline value, with a chip for change or count.
3. One visual: trend, ageing bar or type bars.
4. One plain-language note (italic).
5. A **boxed contributor table**: the top four contributors with a thin bar and three figures. Examples: Business unit · Spend · Share · Change; Vendor · Overdue · Bills · Oldest.
6. A three-figure footer pinned to the bottom.

**Health Score card:**
- **Left:** score ring with band, change, coverage, points lost and trend, plus a note.
- **Right:** six component tiles (Approval, Invoice match, Contract price, Master data, Receipt timeliness, On-time payment). Each shows its value, a score bar, a *% of vendors affected* tag and a note.
- **Vendor segment filter:** All · Strategic · Leverage · Bottleneck · Transactional (Kraljic). Picking a segment switches every tile to that segment's rate and vendor share, and the note compares the segment with all vendors.

**Writing the notes.** One sentence or two, in plain words, with numbers. Example: *"503 orders (3.6%) went out without the right sign-off. Most were signed off only after the order was placed (340)."* Every note is computed from the records on screen. There is no icon and no speculation.

## 5. Breadcrumb specification
- **Shape:** arrow-shaped segments in a single row, scrolling sideways when long. The newest step is always in view.
- **Each step:** an icon, a small level name ("Overview", "KPI", "Days past due", "Vendor", "Document", "Case") above a bold label.
- **Current step:** filled with the KPI's accent colour and slightly larger type. It animates in from the left.
- **Ancestors:** clicking one restores that view and what was selected there. A back arrow steps one level up.
- **Roots per screen:** KPI sheet (Control tower), Vendor portfolio (Vendor profiles), Process chain (Process chain).
- **Example:** `KPI sheet ▶ Potential Exposure ▶ Type: Price above contract ▶ Sunrise Solvents ▶ Case PX-26045 ▶ Invoice SUN/26/4471`
- **Persistence:** global filters persist through every step. Picking a vendor never clears other filters. The path is kept in the URL, so links and reloads reopen the same view (`desk.html#kpi=otp` deep-links).

## 6. Drill-down grammar
| Action | Result |
|---|---|
| Click a KPI card (or any slice, bar, tile or row on it) | Opens that KPI's detail screen, with the clicked item pre-selected |
| Single-click a bar or row inside a detail | Selects it and shows what is behind it (local detail; no navigation) |
| Double-click, Enter, or the › button | Drills one level deeper and adds a breadcrumb step |
| Click anywhere on a case row | Opens the case (whole-row target; the arrow stays as a cue) |
| Click a breadcrumb step | Returns to that level with its selection restored |

Standard paths (each KPI follows its own, defined in `kpi-catalogue.md`):
`KPI ▶ breakdown (category, BU, ageing, type …) ▶ vendor ▶ Vendor Profile ▶ document or case ▶ evidence`

## 7. Detail screens
- **Header:** KPI icon and name in its accent colour, the question it answers, its basis, the active-filter count and a definition popover (ⓘ).
- **Body:** the headline value with three to four stats, a trend against target, and a breakdown with a "By:" dimension picker. Records are shown in compact, grouped tables.
- **Health Score detail:**
  - **Checkpoints:** six status-coloured process checkpoints (green under 5% of records with issues, amber 5–15%, red over 15%).
  - **Filtering:** clicking a checkpoint filters the open-case table in place. **View all** resets it, and **Process chain** opens the dedicated screen.
  - **Relationships:** cases relate to stages through real record links: the stage where the case type is raised, plus every stage where its linked records have an issue.
- **Case screen (the investigation workspace):** everything needed to decide, without leaving the screen.
  - **Header strip:** exposure, confidence, days open, records, outstanding amount, and which measure the case counts in.
  - **Summary:** a plain-language summary and the estimation method.
  - **What happened:** adapts to each of the 12 case types. Examples: price lines against contract, a side-by-side duplicate comparison, advance age and dormancy, MSME days to pay, DoA dates and levels.
  - **Vendor panel:** identity, risk factors, spend by month, commitments, overdue and other cases.
  - **Context:** the process chain of the main record, related exceptions and evidence.
  - **Actions:** Investigate actions (assign, dispute, close, recover, confirm loss with a required basis).
- **Decide panel:** the shared decision drawer, restyled to the P2P theme (brand header, dark or light surfaces). Its decisions, gates and audit trail are unchanged.

## 8. Visual system
- **Typography:** **Inter** (Google Fonts) for everything, with tabular figures for numbers. Sheet type is deliberately small (12–13px body, 17px section titles, 21px values).
- **Themes:** dark by default (near-black page, charcoal-green cards) and a light theme from the ☀/☾ switch. Three layers always contrast: page, card, and detail.
- **KPI accents:** Health teal · Spend blue · Commitments and Overdue violet · Exposure and vendor risk amber · Controls green.
- **Status:** green on target · amber watch · red off target. A status is always paired with a label or icon, never colour alone.
- **Risk categories:** Critical red · High orange · Medium ochre · Low grey-green.
- **Motion:** used sparingly. Breadcrumb steps animate in, detail content slides in the direction of travel, and the tab highlight slides. Reduced-motion preferences are respected.
- **Shape:** square ribbon and breadcrumb; cards with a 6–8px radius; no decorative shadows. Information density over decoration.

## 9. Honesty rules (non-negotiable)
- **No fake zeros:** N/A when there are no eligible records. Coverage is shown when data is partial, for example sites without a gate feed.
- **One estimate per case:** each case counts once. Control cases are shown beside the financial total, never added to it.
- **Labelled data:** demo data is labelled "Illustrative".
- **No invented causes:** notes use only values that exist in the data.
- **No silent resets:** filters, selections and paths never change without the user acting.

## 10. Responsive and accessible
- **Desktop:** the page never scrolls; each area scrolls inside its own container. The board reflows by its own width: four headline cards, then 2×2, then one column.
- **Phone:** no horizontal scroll at 390px. The rail becomes a menu.
- **Keyboard:** full support (Enter drills; arrows move through rows and dropdowns; Esc closes popovers). Visible focus everywhere, and charts have a table alternative.
