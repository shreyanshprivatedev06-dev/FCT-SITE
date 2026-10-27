# O2C control tower — calculation model

Every number on `screens/o2c/` is calculated by `assets/js/o2c/o2c-model.js` from the seeded ledger in `data/o2c/ledger.js`. Configuration and named customers live in `data/o2c/master.js`. Shared universe anchors (AR ageing, ECL, named exceptions) stay in `data/o2c.js` and must still reconcile.

## Screens
- **Control tower** (`desk.html`): KPI sheet → in-place KPI detail under a global breadcrumb.
- **Customer profiles** (`customers.html`): portfolio → Customer Profile → document / case.
- **Process chain** (`process.html`): Order → Credit check → Dispatch → Invoice → Collection → Cash applied.

Internal identifiers keep `vendor` (filter key, fact dimension) so the shared UI can stay close to P2P. Visible copy always says **customer**.

## Snapshot
Demo clock **05-Oct-2026 09:10**. AR ageing anchors (₹ Cr): Not due 1,102 + 1–30 238 + 31–60 96 + 61–90 54.2 + Over 90 46.8 = **1,537**. ECL booked 10.90, required 12.42.

## KPIs
See `config.kpis` in `master.js`. Headline: Health, Billed Revenue, Open Receivables, Overdue Receivables, Collections Exposure. Customer: Risk Mix, Top Customers by AR. Control rates: Overdue AR Collected, Payment Commitments Met, Cash Auto-Match Rate, Credit Decisions Within Policy, On-Time Invoicing Rate. Support: master-data quality.

Health = weighted normalised scores of the six control components. Missing data reduces coverage; it is never scored as perfect.

## Honesty
Potential exposure is the sum of open/under-investigation **financial** case estimates. Disputed and confirmed loss sit beside it. Control cases (credit breach, duplicate, wrong-period invoice, AR-GL) show value affected and never add to the headline.

## Location risk (illustrative)
`M.locRisk(f)` (not shown on any screen at present; the Location risk card was removed) summarises collection (overdue share by city), concentration (city shares, HHI), hazard zones, public-sector owners and parent groups. Hazards, ownership and parent groups are seeded in `master.js` (`config.loc`, `customer.loc`) for the demo and are not sourced. Scenario amounts overlap and are never added.

## Credit utilisation
`M.credit(id)` / `M.creditBook(f)`: used = open AR + open sales orders (customer `openOrd` plus open `X.orders`), against the approved limit, as at the snapshot. Bands: over limit (>100%), about to exceed (90–100%), within limit, no limit set. Shown on the Credit policy KPI (risky-transaction tiles, limit status by segment, amount over limit by segment, customer utilisation table, limit changes) and on the Customer Profile (consumption bar). Credit limits are calibrated in `data/o2c/ledger.js` (section 7b) against each customer's exposure, using a hash of the id so no other seeded number changes; Helvetia (over by ₹35 L) and Medilink (near limit, increase requested) are pinned. The invoice ledger cannot supply a utilisation history: payment dates are set to hit the ageing anchors at the snapshot, so exposure read back in time swells far above any limit.

`M.creditHist(id)` instead builds a 60-day daily history.
- It walks back from today's used figure with a seeded generator keyed on the customer id. The generator is separate from the ledger's random stream, so no other number moves.
- Today's values are exact; earlier days are illustrative, and the screen says so.
- Customers over or near their limit drift up into it; the others wander around today's level.
- The limit steps at each approved change and ends at today's limit. Approved limit events in `X.credit` now end at the current limit, so the change list and the limit agree.
- Weekly roll-up: opening available − orders + payments + limit change = closing available.

`M.creditRisk(rows)` is the share of used credit held by customers over or about to exceed their limit; it feeds the "Credit at risk" gauge. `creditBook().orders` lists every open sales order with its customer's credit position.

Screen (Credit policy KPI), after the utilisation card:
- credit history for a picked customer: a daily validity trend plus weekly consumption;
- change in credit limit by customer and by date;
- an open sales orders summary that follows the band and segment selection.

The Customer Profile credit card also shows the 60-day trend.
