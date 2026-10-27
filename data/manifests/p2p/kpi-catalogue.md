# P2P Control Tower — KPI Catalogue (v2, 21-Oct-2026)

The 12 KPIs on the P2P KPI sheet, plus their supporting measures: what each means, how it is calculated, what the card shows and how it drills. The live definitions are in code at `data/p2p/master.js` (`config.kpis`); formulas and edge cases are in `data/p2p/MODEL.md`. Demo values are for **Sep-26 flows / snapshot 05-Oct-2026 09:10**, with no filters (illustrative data).

## Conventions
- **Currency:** INR, shown as ₹ Cr, or ₹ L under ₹1 Cr. Exact values appear in tooltips.
- **Two time bases:**
  - **Period:** activity in the selected month or quarter (spend, rates).
  - **Snapshot:** balances at 05-Oct-2026 09:10 (commitments, overdue, exposure, vendor mix).
- **Never zero for missing:** no eligible records shows N/A.
- **Separate measures:** spend, commitments, payables, potential exposure, disputed amounts and confirmed loss are distinct and never added together.
- **Status bands** for rate KPIs compare against `target` and `warn`. Health uses Healthy 75+, Watch 55–74, At risk below 55.
- **Vendor terminology** throughout ("vendor", never "supplier").

## The 12 KPIs
| # | KPI | Plain meaning | Formula (denominator) | Basis | Demo value |
|---|---|---|---|---|---|
| 1 | **P2P Health Score** | One 0–100 score for how well P2P controls and execution work | Weighted normalised score of 6 components (see below); missing components are excluded and lower coverage | Period | **65 / 100**, Watch, −5 vs Aug |
| 2 | **Total Spend** | What we bought and booked | Σ posted invoices − credit notes (excludes GST, intercompany, advances) | Period | **₹551.0 Cr**, −1.9% |
| 3 | **Open Commitments** | Ordered but not yet delivered | Σ (PO line value − value received), open lines; GRNI shown beside, not added | Snapshot | **₹1,006 Cr**, 16,199 lines |
| 4 | **Overdue Payables** | Bills past their due date and unpaid | Σ unpaid posted invoices with due date < snapshot | Snapshot | **₹54.0 Cr**, 880 invoices |
| 5 | **Potential Exposure** | Value that could be at risk and needs checking | Σ estimates of open and under-investigation cases with a financial method, one per case | Snapshot | **₹9.19 Cr**, 187 cases |
| 6 | **Vendor Risk Mix** | How risky our active vendors are | Count of active vendors by approved risk category; spend share is a separate toggle | Snapshot | 148 vendors: Critical 2 · High 8 · Medium 49 · Low 89 |
| 7 | **Top Vendors by Spend** | Where spend is concentrated | Vendor spend ÷ Total Spend; top 10 plus Others | Period | Top 5 = 15.4%, top 10 = 24.1% |
| 8 | **Invoice Match Rate** | Bills that match their PO and delivery | Matched (first pass or after correction) ÷ PO invoices received; forced matches don't count | Period | **97.8%** (284 of 12,969 not matched) |
| 9 | **Approval Compliance** | Orders signed off properly before they went out | PO lines approved at the right DoA level before release ÷ PO lines released | Period | **96.4%** (503 of 13,972 breaches) |
| 10 | **Contract-Price Compliance** | Bills charged at the agreed price | Contracted lines within valid contract ±2% ÷ contracted lines (expired contract = non-compliant) | Period | **94.8%** (453 of 8,760) |
| 11 | **Goods Receipt Timeliness** | Deliveries logged within 48 hours | Receipts posted ≤48 h after gate entry ÷ receipts with a gate time; sites without a gate feed are N/A | Period | **81.5%** (984 of 5,331 late) |
| 12 | **On-Time Payment Rate** | Bills paid by their due date | Paid on or before due ÷ invoices paid in the period; unpaid overdue reported separately | Period | **87.0%** (1,832 of 14,093 late) |

## Supporting measures
- **Vendor master-data quality** (Health component): passed checks ÷ (active vendors × 6 checks: bank, GSTIN, PAN, MSME, contact, terms). Demo: **93.0%**, 62 failing checks.
- **Disputed amount / confirmed loss:** case estimates by status. Never added to Potential Exposure. Demo: ₹0.19 Cr / ₹0.00 Cr.
- **Control value affected:** the value tied to approval-breach and no-PO cases. Shown beside exposure, never added. Demo: ₹96.7 Cr.
- **GRNI:** received, not invoiced. Shown beside Open Commitments. Demo: ₹24.0 Cr.

## P2P Health Score in detail
| Component | Weight | Floor → target | Demo value |
|---|---|---|---|
| Approval compliance | 20 | 90 → 99 | 96.4% |
| Invoice match | 20 | 90 → 99.5 | 97.8% |
| Contract-price compliance | 15 | 88 → 98 | 94.8% |
| Vendor master-data quality | 15 | 85 → 99 | 93.0% |
| Goods-receipt timeliness | 15 | 70 → 95 | 81.5% |
| On-time payment | 15 | 75 → 97 | 87.0% |

- **Component score:** clamp((value − floor) ÷ (target − floor)) × 100.
- **Health:** Σ (weight × score) ÷ Σ weights of components that have data.
- **Vendor tags:** each component tile shows the share of vendors with at least one problem in it (e.g. Approval: 84% of vendors, 122 of 145).
- **Vendor segments (Kraljic):** each vendor is classed by spend impact and supply risk.
  - **High impact:** among the vendors carrying the top 60% of six-month spend.
  - **Supply risk:** sole source, dependency 40+, or a financial-distress or delivery factor of 60+.
  - **Result:** Strategic 10 · Leverage 31 · Bottleneck 21 · Transactional 86.
  - **Filter:** choosing a segment recomputes every tile for that segment and compares it with all vendors.
- **Process checkpoints (detail screen):** Requisition, PR approval, Purchase order, Goods receipt, Invoice and match, Payment.
  - **Colour** comes from the share of records with issues: under 5% green, 5–15% amber, over 15% red.
  - **Filtering:** clicking a checkpoint filters the open-case table in place.

## What each card shows and how it drills
| KPI | Card on the sheet | Drill path (breadcrumb steps) |
|---|---|---|
| Health | Ring, band, trend, six component tiles with vendor tags, segment filter | Component ▶ BU or category ▶ vendor ▶ case ▶ evidence; checkpoint filter ▶ case |
| Total Spend | Value and change, trend, top business units table | Category / BU / region ▶ vendor ▶ invoice |
| Open Commitments | Value, PO-age bar, largest open vendors table | PO age / status ▶ vendor ▶ PO line |
| Overdue Payables | Value, days-past-due bar, most overdue vendors table | Days past due / status ▶ vendor ▶ invoice and payment status |
| Potential Exposure | Value, top exposure types, vendors with most exposure table | Exposure type ▶ case ▶ calculation and evidence ▶ vendor ▶ document |
| Vendor Risk Mix | Risk bar and four tiles | Risk category ▶ vendor ▶ Vendor Profile (risk factors, due diligence) |
| Top Vendors | Ranked bars with risk dots | Vendor ▶ spend trend ▶ transactions and contracts |
| Five rates | Value, status, bar to target, trend, records and exceptions | Mismatch type / DoA rule / variance type / site / lateness ▶ vendor ▶ record |

## Case types (Potential Exposure and control cases)
- **Financial (estimate):**
  - price above contract
  - contract price not loaded
  - FX and tolerance
  - unit-of-measure mismatch
  - duplicate invoice
  - quantity above receipt
  - bank-detail change before payment
  - aged advance of a dormant vendor
  - MSME late-payment interest
  - payment through an SoD conflict
- **Control (value affected):**
  - approval breach
  - spend without a PO
- **Statuses:** Open and Under investigation count as potential; Disputed counts as disputed; Confirmed loss counts as loss; Prevented/recovered and Closed (no issue) are closed.
