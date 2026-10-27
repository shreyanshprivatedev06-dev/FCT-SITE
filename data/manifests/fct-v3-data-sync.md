# FCT v3 — data sanitisation and cross-tower sync plan (27-Oct-2026)

Branch `fct-v3` = executive-layer-V3 (P2P v2, O2C v3, SC v3, Executive layer) + r2r-v3 + compliance-v3 + P2P headline/budget work.
Goal: one data universe. Every number that appears in two places is the same number, computed from one source.
Status key: [ ] todo · [x] done.

## 0. Audit findings (measured 27-Oct on fct-v3, Sep-26, all filters = All)

Already consistent
- Time: every tower uses Sep-26, the same period set (Apr–Sep, Q1, Q2, H1) and snapshot 05-Oct-2026 09:10.
- Entity master: 10 legal entities IN-01…IN-08, US-01, EU-01 with the same names in core, P2P, O2C, R2R.
- Entity → region: core / P2P / O2C / R2R / Executive agree (IN-01..03 North, IN-04..06 West, IN-07..08 South, US-01 North America, EU-01 Europe).
- Anchors held: AR ₹1,538 Cr (O2C) ≈ core ₹1,537 Cr · inventory ₹642.0 Cr (SC) = core · GRNI ₹24.0 Cr (P2P) · Sep spend ₹551 Cr · R2R tasks 486 / recs 1,284 = core entity rows.
- Compliance P2P controls read the P2P ledger (453/8,760 price, 984/5,331 GR, 62/888 master data).
- Executive layer computes health live from the tower models (no copied scores).

Broken (to fix)
| # | Issue | Evidence |
|---|---|---|
| B1 | R2R GL balances are random, not the sub-ledgers | GL 1310 ₹3,206 vs AR ₹1,538 · GL 1410 ₹5,901 vs inventory ₹642 · GL 2110 ₹197 vs GRNI ₹24 · GL 2010 ₹3,012 vs open AP ₹1,001. Inventory GL at IN-01 / IN-07, which hold no stock |
| B2 | O2C Sep revenue spike | Apr–Aug ₹823 → ₹1,095 Cr, Sep ₹1,729 Cr (+58%): seeding artefact |
| B3 | Site / city master differs by screen | Compliance map: IN-02 Nanjangud (South), IN-04 Gajraula (North), IN-08 Mumbai (West), overseas = "Outside India". Executive map: IN-02 Lucknow, IN-08 Kochi. No coordinates in P2P / SC / R2R |
| B4 | SC suppliers missing from the P2P vendor master | 10 of 17 external SC suppliers (Zhejiang, Shandong, EuroCat, Deccan Industrial, Western Excipients, Orion Fabricators, Bharat Chem, Kalinga, Sahyadri, …) have no P2P vendor record or spend |
| B5 | SC entity names and regions | SC `bus` has no region; US-01 "North America", EU-01 "Europe" instead of the master names |
| B6 | Executive layer covers 3 of 5 towers | loads P2P / O2C / SC models only; R2R (R2RM exists) and Compliance show no health |
| B7 | Compliance figures for O2C / R2R / SC controls are fixed "baseline" text | e.g. CTL-R2R-017 "3 of 10 confirmations", CTL-O2C-011 "6 overrides", CTL-SC-006 "14%" not read from the tower ledgers |
| B8 | Map + three-tier filter only on O2C (and a different variant on Compliance / Executive) | user requirement: same map analytics on every tower; tiers Risk · Geography · tower segment |

## 1. Single sources of truth (decisions)

```
data/core.js  ── entities[] + SITES (city, state, lat, lng, region)  ← one place for geography
     │
     ├── P2P ledger ── spend, AP open, GRNI, vendor master (incl. SC suppliers) ──┐
     ├── O2C ledger ── revenue, AR, customers ───────────────────────────────────┤
     ├── SC ledger  ── inventory by entity / material, receipts not booked ───────┤
     │                                                                             ▼
     └── R2R ledger ── GL balance = sub-ledger balance (by entity, account) + seeded rec difference
                         1310 ← O2C AR · 1410 ← SC inventory · 2010 ← P2P open AP · 2110 ← P2P GRNI
     Compliance ── control results read from the tower models (P2P already; O2C / R2R / SC next)
     Executive  ── health + exceptions from all five models
```

Rules
- Region is owned by `core.entities`; towers read it (no per-tower region tables).
- Keep the current entity → region mapping (5 of 6 places agree); choose real-sounding cities inside those regions. Compliance and Executive maps switch to the shared sites.
- Where a ledger is regenerated, the tower's documented anchors (BUILD_PLAN.md, MODEL.md, tests) stay true unless listed below as changed.
- Sub-ledger → GL: R2R keeps its reconciliation *differences* and statuses (they drive Unmatched Balances ₹9.11 Cr and the cases); only the GL / sub-ledger levels move.

## 2. Work plan

Phase A — shared masters
- [x] A1 `core.entities`: add `region`, `site` {city, state, lat, lng}, `cls` (Manufacturing / Services and trading / Overseas sales) for all 10 entities.
- [x] A2 Shared `PLACES` (cities by region with lat/lng) in core; O2C reads it instead of its own copy (same cities, so customer placement is unchanged).
- [x] A3 SC `bus`: master names + region from core (B5).
- [x] A4 P2P vendor master: add the 10 SC suppliers with category, BU, terms and a spend profile consistent with SC; regenerate P2P ledger with anchors held (B4).

Phase B — ledger sync
- [x] B1 R2R: GL for 1310 / 1410 / 2010 / 2110 per entity = tower sub-ledger at 30-Sep; other accounts scaled to the same balance-sheet size. Tests updated; Unmatched ₹9.11 Cr held.
- [x] B2 O2C: smooth the Sep revenue spike so Sep sits on the Apr–Aug trend while AR ₹1,538 Cr holds (re-balance opening AR / collections instead of Sep billing).
- [x] B3 Revenue ↔ spend sense check: material spend ÷ revenue in a plausible pharma band (40–55%).
- [x] B4 Compliance: O2C / R2R / SC control results computed from their models (as P2P is); the text in `cmp-preview.js` reads the computed values.

Phase C — screens
- [x] C1 Map analytics card (manifest `data/manifests/maps/map-analytics.md`) on every tower's profile screen, three tiers that scope the tower's control tower:
  | Tower | Screen | Marker | Value | Risk | Geography | Tier 3 |
  |---|---|---|---|---|---|---|
  | O2C | Customer profiles | customer | open AR | approved credit risk | region | Customer segment (built) |
  | P2P | Vendor profiles | vendor | Sep spend | approved vendor risk | region | Vendor segment (Strategic / Leverage / Bottleneck / Transactional) |
  | SC | Material profiles | material at plant | stock value | material risk | region | Material class (ABC / value class) |
  | R2R | Entity profiles | legal entity | unreconciled balance | close risk | region | Entity class |
  | CMP | Entity profiles | entity / site | open items | worst severity | region | Process (tower) |
- [x] C2 Executive layer: load R2R and Compliance models; health for all five; map uses the shared sites.

Phase D — QA
- [x] All tower test suites pass (P2P 81, O2C 92, R2R 113, SC 98 + new cross-tower checks).
- [x] New `tools/fct/test-sync.js`: GL 1310 / 1410 / 2010 / 2110 = sub-ledger by entity (±0.01); every SC supplier is a P2P vendor; every entity has a site; map totals = KPI sheet.
- [x] Browser: every screen loads with 0 console errors; no dead links; map tier cross-filter checks per tower.

## 3. Outcome (27-Oct-2026)
- A4 done by aliasing nine generic P2P vendors to the SC suppliers (not new vendors), so the P2P ledger and anchors are unchanged.
- B1: IN-01 receivables / IN-01 and IN-07 inventory units moved to 1520 Prepaid (no tower sub-ledger there); named IN-05 GR/IR rec scaled to 60% of P2P GRNI.
- B2: Sep billing ₹1,081 Cr (was ₹1,729 Cr); spend is 51% of billing. O2C health 62 → 56 (corrected billing, six US-01 overrides now in the ledger).
- B4: CTL-O2C-011 overrides live in the O2C ledger; F-2026-038 / CTL-R2R-017 rewritten to R2R's IC position (IN-07 with IN-01).
- Found on the way: random sort comparators made R2R and SC data depend on the JS engine (Node ≠ Chromium ≠ Safari). Fixed; R2R health now 63, SC 56 everywhere.
- Compliance still runs on its fixed demo set for control-library totals (policy checks, attestations); only the control results above are tied to tower ledgers.
