# Contract compliance: proposed additions

**Tower:** Compliance (CMP) · **Screen:** Controls › Contract compliance · **Status:** proposal, for manager sign-off before build
**Demo date:** Mon 05-Oct-2026 · **Period:** Q2 FY27 (Jul–Sep)

---

## 1. Where we are today

Contract compliance sits inside **Controls** because Compliance does not manage contracts. Legal and Procurement own the contract register. Compliance tests whether **what we paid or committed rests on a valid, properly approved contract**. Each check is a control with an ID, a target and a pass/fail result, like every other control in the tower.

The four tiles live today:

| Tile | Control | Question it answers | Today |
|---|---|---|---|
| Related-party transactions | CTL-CMP-021 | Is the other party connected to us, and was it approved? | Nova Packaging: 4 of 4 POs without Audit Committee approval |
| Payments against a valid contract | CTL-P2P-040 | Is there a live contract behind each payment? | 23 of 3,412 Q2 payments, 4 vendors |
| Contracts within delegation of authority | CTL-P2P-041 | Did the right person sign it? | 2 of 120 Q2 contracts |
| Invoice price within contract | CTL-P2P-017 | Are we paying the agreed price? | 453 of 8,760 contracted lines above contract |

**The gap:** these check *who signed* and *what price*, but not **how much was spent against the contract**. They also only look back, while every other Compliance section also looks ahead (filings due in 30 days, the 01-Nov rule change).

---

## 2. Proposed additions

| # | Tile | Recommendation | Why |
|---|---|---|---|
| 1 | Spend within contract value | **Add** | Most common contract audit test; closes "signed right, but overspent" |
| 2 | Contracts expiring in the next 90 days | **Add** | The forward view; stops the next Bharat Electricals (paid 9 times after expiry) |
| 3 | Leases inside contracts (Ind AS 116) | **Optional** | Auditor will ask; the Ganesh Estates lease already raises it |

Section layout after the change (one screen, no new tab):

```
Contract compliance
 Is it authorised?          Related parties · Valid contract · Within authority
 Are we paying right?       Price within contract · Spend within contract value (new)
 What is coming?            Expiring in 90 days (new) · Leases in contracts (optional)
```

Rules every new item follows (same as the rest of the tower):
- Every number states its base ("out of what"): "3 of 64 rate contracts", never "3 contracts".
- Amounts are shown per item, never added across items.
- Exact names: contract ID, vendor, entity, person, date, amount.
- Same drill path: **tile → KPI panel (formula, inputs, why it matters, chart) → item → case**.
- Every case has: what happened, root cause, detected by, evidence, process chain, recommendation, gate (who decides) and Towers involved with "Open in ↗" links.

---

## 3. Tile 1: Spend within contract value

**Question:** Did we keep spending within the value each contract was approved for?

| Field | Value |
|---|---|
| Control | CTL-P2P-042 *Spend within contract value* (new) |
| Formula | Rate contracts with Q2 spend at or below their approved value ÷ rate contracts active in Q2 |
| Target | 100% |
| Tile text | **95.3%** · 3 of 64 rate contracts spent above their approved value · CTL-P2P-042 |
| Why it matters | Spend above the approved value has no approval behind it. The DoA check covers the signature, this covers the spending. |

**Drill-down**

1. **KPI panel:** formula, inputs (64 contracts, 3 above value), chart *"Contracts by % of approved value used"*. One bar per contract, with a 100% line; bars past it are red.
2. **Click a contract:**
   - **Date strip:** approved value reached on a date (dashed line), then each PO after it (dots).
   - **Fields:** contract, vendor, entity, approved value, spent to date (% used), when the value was crossed, POs after that date (number, date, amount each), who approved those POs.
3. **Case CMP-CAP-20** (one case for the 3 contracts).

**Proposed demo data**

| Contract | Vendor | Entity | Approved value | Spent to 30-Sep | Value crossed | POs after |
|---|---|---|---|---|---|---|
| RC-IN02-0318 Solvent supply | Apex Chem Intermediates (V-301776) | IN-02 | ₹6.00 Cr | ₹6.84 Cr (114%) | 18-Aug | 3: 4500187702 ₹31.0 L, 4500187790 ₹28.5 L, 4500187855 ₹24.5 L |
| SVC-IN08-0402 Security services | Swift Security Services | IN-08 | ₹1.20 Cr | ₹1.31 Cr (109%) | 02-Sep | 2: monthly service POs ₹5.5 L each |
| MSA-IN05-0077 Contract labour | Sapna Manpower Services | IN-05 | ₹2.40 Cr | ₹2.52 Cr (105%) | 21-Sep | 1: 4500188301 ₹12.0 L |

**Case CMP-CAP-20: Spend above the approved contract value**
- **What happened:** names the 3 contracts above, with the date each crossed its value and every PO after it.
- **Root cause:** POs are checked against the contract *price* but not the remaining contract *value*. The value sits in Legal's register and is not loaded into the purchasing system, so nothing stops a PO once the value is used up.
- **Detected by:** contract-value test, 30-Sep, CTL-P2P-042.
- **Process chain:** contract approved → POs raised → value reached (no check) → POs continue → paid.
- **Recommendation:** get the original approver (per DoA) to approve the excess or amend each contract; load contract values into purchasing so a PO stops at 100%.
- **Gate:** amending contract value sits with the original approving authority per the DoA matrix.
- **Towers involved:** CMP (runs the test) · P2P (raised the POs; adds the value check).
- **Links to existing cases:** Apex Chem is also the vendor in the bank-change case (PTP-BNK-05). Sapna Manpower is the contractor holding up IN-05's ESI filing.

---

## 4. Tile 2: Contracts expiring in the next 90 days

**Question:** Which contracts end before 03-Jan, and is each one being renewed in time?

| Field | Value |
|---|---|
| Type | Watch list (forward view), not a pass-rate control. Same pattern as *Filings due in the next 30 days*. |
| Tile text | **6 of 118** active contracts expire by 03-Jan · 2 have no renewal started |
| Why it matters | A contract that lapses while we keep buying becomes a "paid without a valid contract" exception, as happened with Bharat Electricals. |

**Drill-down**

1. **Tile → list:** one row per contract, soonest first. Columns: contract, vendor, entity, expires, days left, annual spend, renewal status, owner.
2. **Click a contract → side panel** (same style as the filing panel):
   - **Three date boxes:** Today → Renewal start (expiry minus 60 days) → Expiry.
   - **Details:** renewal status and next step, owner, open POs that run past expiry, bank guarantee (if any) and its expiry date.
   - **Buttons:** Chase owner, Open in P2P ↗.
3. **Bank guarantees:** a row is flagged red when a vendor's bank guarantee expires before its contract does, because we would lose the protection while the contract is still running.

**Proposed demo data**

| Contract | Vendor | Entity | Expires | Days left | Renewal status | Owner |
|---|---|---|---|---|---|---|
| MSA-IN05-0077 Contract labour | Sapna Manpower Services | IN-05 | 15-Nov | 41 | Not started; also above approved value (CMP-CAP-20) | Ankit Shah |
| SVC-IN08-0402 Security services | Swift Security Services | IN-08 | 30-Nov | 56 | Tender issued 28-Sep | Lata Krishnan |
| RC-IN02-0318 Solvent supply | Apex Chem Intermediates | IN-02 | 31-Dec | 87 | Price negotiation open | Kiran Rao |
| FRT-IN02-0144 Freight services | Kirti Logistics LLP (related party) | IN-02, IN-04 | 31-Dec | 87 | Renewal needs Audit Committee approval on 30-Oct (R. Shah abstains) | Sameer Khan |
| RC-IN03-0210 API intermediates | Narmada Organics Ltd | IN-03 | 31-Dec | 87 | Draft with Legal | Deepak Menon |
| SVC-IN05-2207 Reactor maintenance | Precision Engineering Works | IN-05 | Runs to Aug-29 | — | **Performance bank guarantee BG-HDFC-7781 expires 12-Nov**, contract continues | Ankit Shah |

*Last row: the contract is not expiring, but its guarantee is, so it appears as a red flag.*

No case is created for the list itself. A row becomes a case only if it lapses while POs stay open.

---

## 5. Tile 3 (optional): Leases inside contracts (Ind AS 116)

**Question:** Do any contracts give us the right to use a specific asset, and are they recorded as leases?

| Field | Value |
|---|---|
| Control | CTL-R2R-045 *Contracts reviewed for leases* (new) |
| Tile text | **3 of 120** Q2 contracts contain a lease not yet in the lease register |
| Why it matters | An unrecorded lease understates assets and liabilities on the balance sheet, which is an audit finding under Ind AS 116. |

**Drill-down:** tile → list of the 3 contracts → each shows the asset, term, monthly payment, estimated right-of-use value and status → **case CMP-LSE-21**.

**Proposed demo data**

| Contract | What makes it a lease | Term | Payment | Estimated right-of-use asset (9% discount rate) |
|---|---|---|---|---|
| LSE-IN02-0091 Ganesh Estates | Specific warehouse, exclusive use | 3 years from Sep-26 | ₹5.0 L a month | about ₹1.57 Cr |
| TRN-IN06-0210 Om Fleet Services | 6 dedicated trucks used only by IN-06 | 2 years | ₹2.4 L a month | about ₹0.52 Cr |
| SVC-IN05-3310 Forklift hire | 4 named forklifts at IN-05 | 3 years | ₹0.9 L a month | about ₹0.28 Cr |

**Case CMP-LSE-21:** contracts are booked as monthly expenses because nobody reviews new contracts for a lease. The fix is for R2R to recognise the right-of-use asset and lease liability and add a lease check to contract onboarding. Towers: CMP · R2R · P2P.

---

## 6. Considered and left out (and what to say if asked)

| Topic | Why not in Compliance | Answer to the client |
|---|---|---|
| Paying earlier than contract terms | Working capital, owned by P2P and treasury | "Tracked in P2P, on-time payment" |
| Volume rebates and late-delivery penalties not claimed | Value leakage, owned by P2P | "Tracked in P2P" |
| Commitments to disclose (Schedule III) | Financial statement notes, owned by R2R | "Covered in the R2R close" |
| Advances not recovered, wrong TDS section on contracts | Already in the P2P and vendor master checks | "Covered by CMP-VMD-18 and P2P" |
| Customer (sales) contracts, Ind AS 115 | Revenue side, owned by O2C | "Covered by the O2C tower" |

---

## 7. Effect on the rest of the screen

- **Health score:** unchanged. The new controls pass at group level, as the existing contract controls do.
- **Case count:** +1 (CMP-CAP-20), or +2 with the optional lease tile (CMP-LSE-21). The open-cases badge goes from 27 to 28 or 29.
- **Search:** the new cases, contracts and vendors are searchable straight away.
- **Entity profiles:** IN-02, IN-05 and IN-08 gain the new items.
- **Files:** `data/cmp.js` (cases), `assets/js/cmp/cmp-preview.js` (tiles, drills, demo data). No other tower's files change.

## 8. Decision needed

- [ ] Add Tile 1: Spend within contract value
- [ ] Add Tile 2: Contracts expiring in the next 90 days
- [ ] Add Tile 3 (optional): Leases inside contracts
- [ ] Demo data above approved as written, or changes noted
