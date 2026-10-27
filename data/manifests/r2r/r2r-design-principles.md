# R2R Control Tower — R2R Design Principles (v1, 21-Oct-2026)

How the R2R screens apply the shared FCT tower rules (`../p2p/general-design.md`) and the choices specific to R2R. Read with `kpi-catalogue.md` and `technical-manifest.md`.

**R2R at a glance:**
- **Entity:** legal entity (10: IN-01 … IN-08, US-01, EU-01). Group account (chart of accounts) is the second dimension.
- **Screens:** Control tower (KPI sheet), Entity profiles, Close chain.
- **KPIs:** 12 on the sheet. Close Health (6 components), Close Progress, Journals Pending, Unreconciled Balances, Potential Misstatement, Entity Close Risk, Journal Mix, Manual Adjustments by Account, and five control rates.
- **Process stages:** Sub-ledger close → Journals and accruals → Reconciliation → Review and certify → Close and consolidate → Report.
- **Segmentation:** entity class — Manufacturing (5), Services and trading (3), Overseas sales (2).
- **Case types:** 13 (10 financial with a misstatement estimate, 3 control with value affected).

## 1. The core idea
**Will we close on time, and are the numbers right?** The controller opens the KPI sheet at WD+2, picks the number that looks wrong and keeps clicking until they reach the entity, the journal or reconciliation, and the evidence behind it.

## 2. Pillars specific to R2R
| Pillar | On screen |
|---|---|
| **The close is in flight** | Snapshot KPIs (progress, journals pending, unreconciled, misstatement) are "as at WD+2". Rate KPIs measure the open close *to date* (tasks and reconciliations due by WD+2; commentary signed by WD+2) and earlier closes at the same cut-off, so closes compare. |
| **Misstatement is not an adjustment** | Potential misstatement (open estimates), adjustments proposed and adjustments booked are three separate measures. Control cases (closed-period posting, unsupported journals, unmapped accounts) show value affected beside, never added. Cross-tower P&L decisions from the drawer are shown beside, never added (they overlap). |
| **Entity-first** | Every path can end at an Entity Profile that explains why the entity surfaced: close risk and its main factor, tasks behind plan, breaks, open cases, feed problems. |
| **Named records stay true** | The reconciliations, journals, variances, IC pairs and late tasks named in `data/r2r.js` and the drawer exceptions appear with their exact values. |

## 3. The KPI sheet
| Section | Contents |
|---|---|
| **Headline KPIs** | Close Health (full-width), then Close Progress, Journals Pending, Unreconciled Balances, Potential Misstatement (4 in a row; 2×2 on a laptop). |
| **Journal KPIs** | Journal Mix (donut by source with share bars) and Manual Adjustments by Account (ranked bars, dot = account risk class). |
| **Entity and Exposure KPIs** | Entity close-risk bar with four tiles (critical or high, forecast after target, account mapping, reconciliation breaks) and potential misstatement by type. |
| **Control KPIs** | Task timeliness, reconciliations on time, journal first-time-right, IC match, variance commentary. |
| **Exceptions** | Open cases ranked by value with All / Financial / Control tabs; rows with a drawer exception open the shared drawer. |

**Health card:** score ring, band, change, coverage, points lost, Apr–Sep trend, note; six component tiles, each with value, score bar, a **% of entities affected** tag and a note. The **entity class** filter re-scopes every tile and compares the class with the group.

**Card contributor tables:** Close Progress — entities furthest behind (behind · done · forecast); Journals Pending — largest waiting (value · journals · oldest); Unreconciled — largest open differences (difference · entity · items); Potential Misstatement — entities with most at stake (at stake · share · cases).

## 4. Breadcrumb and drill paths
- Roots per screen: KPI sheet (Control tower), Entity portfolio (Entity profiles), Close chain (Close chain).
- Example: `KPI sheet ▶ Unreconciled Balances ▶ Account: 1360 Intercompany receivables ▶ IN-02 API Manufacturing ▶ Reconciliation 1360 IC receivable US-01`
- Example: `Close chain ▶ Stage: Review and certify ▶ Issue: Due, not yet certified ▶ IN-02 ▶ Reconciliation …`
- Deep links: `desk.html#kpi=<id>` (used by the close clock, home desk, drawer links and search); `entities.html#…` opens an Entity Profile.

## 5. Detail screens
- **Health detail:** component contributions, health by close, six close checkpoints coloured by issue rate (under 5% green, 5–15% amber, over 15% red); a checkpoint filters the open-case table in place; View all resets; Close chain opens the chain screen.
- **Close Progress detail:** the close burn-up (plan vs actual by working day, `data/r2r.js` burnup with the live done count), entities against plan, breakdown by task group / entity / status / owner, tasks behind plan.
- **Record view** (journal, reconciliation, task, IC item, variance, local account): its position in the close chain, values, issues, linked cases and drawer exception, evidence.
- **Case workspace:** header strip (at stake, confidence, days open, records, close, which measure it counts in), plain summary and method, What happened (drawer evidence table where linked, plus the linked records by kind), entity panel (risk factors, progress, unexplained, journals waiting), close chain of the main record, related exceptions, evidence, and actions: assign reviewer, propose adjustment, book adjustment (journal reference required), close no issue, waive below materiality. Cases tied to a drawer exception are decided only in the drawer.

## 6. Visual choices
Same system as P2P (Inter, dark default + light theme, square ribbon and breadcrumb, 6–8 px cards). KPI accents: Health teal · Progress, Journal Mix, Manual by Account blue · Journals Pending and Unreconciled violet · Misstatement and Entity Close Risk amber · control rates green. Close-risk categories reuse the risk palette (Critical red, High orange, Medium ochre, Low grey-green).

## 7. Honesty rules as applied
- N/A, not zero: the account-risk filter removes records without an account (tasks, variances), so those KPIs show N/A.
- Earlier closes have no account-mapping snapshot: Health runs on five components (coverage 85%), never scored as perfect.
- Group-wide cases (e.g. GRNI accrual) appear only with no entity, region or class filter.
- Waiting time and ages are calendar time at the snapshot; working days are labelled WD±n.
