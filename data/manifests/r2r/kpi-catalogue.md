# R2R Control Tower — KPI Catalogue (v1, 21-Oct-2026)

Live definitions are in `data/r2r/master.js` (`config.kpis`); formulas and edge cases in `data/r2r/MODEL.md`. Demo values: **Sep-26 close, snapshot 05-Oct-2026 09:10 (WD+2)**, no filters, illustrative data.

## Conventions
- **Currency:** INR, ₹ Cr (₹ L under ₹1 Cr).
- **Bases:** *Period* = the selected close(s), measured at the same cut-off for every close; *Snapshot* = the Sep-26 close at WD+2.
- **Separate measures:** potential misstatement, adjustments proposed, adjustments booked, control value affected and cross-tower P&L decisions are never added together.
- **Bands:** Health Healthy 75+, Watch 55–74, At risk below 55. Rates use target and warn.

## The KPIs
| # | KPI | Plain meaning | Formula (denominator) | Basis | Demo value |
|---|---|---|---|---|---|
| 1 | **R2R Close Health Score** | One 0–100 score for how well the close runs | Weighted normalised score of 6 components | Period | **61 / 100**, Watch, +2 vs Aug |
| 2 | **Close Progress** | How far through the close we are | Tasks done ÷ all Sep-26 close tasks; plan to date and forecast beside | Snapshot | **59.5%** (289 of 486; plan 307; forecast WD+5) |
| 3 | **Journals Pending Approval** | Journals waiting for a sign-off | Σ value of submitted, unapproved journals; AI drafts not yet submitted shown beside | Snapshot | **₹9.33 Cr**, 64 (58 low-risk ₹1.20 Cr, 6 to review) |
| 4 | **Unreconciled Balances** | Balances not yet agreed to support | Σ unexplained difference on uncertified Sep reconciliations | Snapshot | **₹9.11 Cr**, 32 reconciliations; 8 breaks ₹7.46 Cr |
| 5 | **Potential Misstatement** | Value that could misstate the accounts | Σ estimates of open and under-review financial cases, one per case | Snapshot | **₹30.23 Cr**, 25 cases |
| 6 | **Entity Close Risk** | Which entities endanger the close | Entities by close-risk score (60% worst + 40% weighted average of 7 factors) | Snapshot | Critical 1 (IN-07) · High 0 · Medium 2 · Low 7 |
| 7 | **Journal Mix** | Where journals come from | Posted journals by source; manual share = (manual + AI-drafted) ÷ all | Period | **3,912**, manual 29.3% |
| 8 | **Manual Adjustments by Account** | Where manual adjustment concentrates | Manual + AI-drafted journal value by debited account ÷ total manual value | Period | Top 5 = 45.7%, top 10 = 73.7% |
| 9 | **Close Task Timeliness** | Tasks done by their planned day | On-time ÷ tasks due by the cut-off | Period | **89.9%** (31 of 307 behind) |
| 10 | **Reconciliations Certified on Time** | Recs certified by their due day | On-time ÷ reconciliations due by the cut-off | Period | **89.4%** (88 of 829) |
| 11 | **Journal First-Time-Right** | Manual journals right first time | Posted with no exception ÷ manual + AI-drafted posted | Period | **96.2%** (43 of 1,146) |
| 12 | **Intercompany Match Rate** | Both sides of IC agree | Items agreed within ₹10 L ÷ IC items | Period | **93.1%** (10 of 145) |
| 13 | **Variance Commentary Coverage** | Material variances explained in time | Signed by WD+2 ÷ variances ≥ ₹2 Cr | Period | **61.8%** (21 of 34) |
| – | Account Mapping Quality (Health component) | Local accounts mapped to group CoA | Mapped ÷ local accounts | Snapshot | **98.6%** (25 of 1,774 unmapped) |

## Health components
| Component | Weight | Floor → target |
|---|---|---|
| Close task timeliness | 20 | 75 → 97 |
| Reconciliations on time | 20 | 85 → 99 |
| Journal first-time-right | 20 | 90 → 99 |
| Intercompany match | 15 | 85 → 99 |
| Variance commentary | 10 | 30 → 90 |
| Account mapping | 15 | 90 → 100 |

Component score = clamp((value − floor) ÷ (target − floor)) × 100; Health = Σ(weight × score) ÷ Σ weights with data. Each tile tags the share of entities with at least one exception. Close checkpoints = the six close-chain stages.

## Drill paths
| KPI | Breakdowns (By:) | Path |
|---|---|---|
| Health | Component | Component ▶ breakdown ▶ entity ▶ record ▶ evidence; checkpoint ▶ case |
| Close Progress | Task group, entity, status, owner | ▶ entity ▶ task |
| Journals Pending | Waiting, risk, entity, source | ▶ entity ▶ journal |
| Unreconciled | Account, entity, status, risk | ▶ entity ▶ reconciliation |
| Potential Misstatement | Type, status, stage, entity | ▶ case ▶ records and evidence ▶ entity |
| Entity Close Risk | Close risk, class, region | ▶ entity ▶ Entity Profile (factors) |
| Journal Mix | Source, entity, category, close | ▶ entity ▶ journal |
| Manual by Account | Account | ▶ account ▶ entity ▶ journal |
| Five rates | Group / risk / exception / pair / status, entity, … | ▶ entity ▶ record |

## Case types
- **Financial (estimate):** accrual missing or understated · accrual not reversed · revenue or expense cut-off · anomalous journal · expense capitalised or misclassified · unexplained reconciliation difference · intercompany mismatch or elimination · aged suspense · FX revaluation error · provision not updated.
- **Control (value affected):** posting into a closed period · journals without support · unmapped account or pack tie-out.
- **Statuses:** Open and Under review = potential; Adjustment proposed; Adjustment booked; Closed no issue and Waived below materiality = closed.
- **Drawer links:** RTR-REC-03, RTR-JNL-02, RTR-REC-07, RTR-ACR-09, RTR-PER-10, RTR-PCK-11, RTR-CLS-01 (IN-07 accruals), plus cross-tower PTP-GRNI-01, O2C-BILL-04, SC-INV-01, SC-URP-08.
