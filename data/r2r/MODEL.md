# R2R control tower v2 — data model and calculation rules
Scope: `screens/r2r/*` (desk, entities, process). Engine `assets/js/r2r/r2r-model.js`; generator `data/r2r/ledger.js`; config `data/r2r/master.js`. Tests: `node tools/r2r/test-model.js`. All data synthetic, labelled "Illustrative data". Design and catalogue: `data/manifests/r2r/`.

## Time
Day 0 = 01-Apr-2026. WD0 = last calendar day of the month; WD+k = k-th business day after (weekends and 02-Oct excluded). Snapshot = Sep close WD+2 = 05-Oct 09:10. The Sep close is in flight; Apr–Aug closes are complete.

## KPI formulas
- **Close Health:** Σ(wᵢ·sᵢ)/Σ(wᵢ with data); sᵢ = clamp((v−floor)/(target−floor))×100. Weights/floor/target: tasks 20/75/97, recs 20/85/99, jnl 20/90/99, ic 15/85/99, var 10/30/90, mapq 15/90/100. Mapping is a snapshot: earlier closes run on five components (coverage 85%).
- **Close Progress (snapshot):** Sep tasks done ÷ Sep tasks. Done = done WD set, or (fixable and RTR-CLS-01 taken).
- **Close Task Timeliness:** tasks with done WD ≤ planned WD ÷ tasks due (Sep: planned ≤ WD+2; earlier closes: all).
- **Reconciliations on time:** certified WD ≤ due WD ÷ reconciliations due (same cut-off).
- **Journal FTR:** posted manual + AI-drafted journals with no flag ÷ posted manual + AI-drafted. Flags: no support, approved after posting, same preparer and approver, anomaly ≥0.75, corrected later, posted into a closed period.
- **IC match:** items with status Agreed or Agreed (FX rounding) ÷ items.
- **Variance commentary:** signed WD ≤ 2 ÷ material variances (earlier closes at the same WD+2 cut-off).
- **Journals Pending:** Σ value of status Pending (after RTR-JNL-08: non-review journals post). AI drafts (status Draft) beside.
- **Unreconciled:** Σ |diff| of Sep reconciliations not Certified with diff ≠ 0.
- **Potential Misstatement:** Σ est of financial cases whose status measure is potential. Proposed, booked, closed separate; control cases → value affected.
- **Entity close risk:** factors tasks (behind ÷ due × 250), recs (breaks × 22 + uncertified-due share × 150), jnl (pending × 1.5 + drafts × 4 + anomalies × 12), IC (difference × 12 + 40 if a confirmation is unsent; counted against the side that must act), people (85 if an owner of open tasks is on leave with no backup), feed (IN-07 70, 30 after a manual extract; other stale feeds 45), history ((avg close − 3) × 30). Score = 0.6 × max + 0.4 × weighted average.

## Filters
Entity, region and class filter by entity; account risk filters records with an account (reconciliations by their own risk class, journals by debited account, IC as 1360/2260); records with no account drop out (KPI shows N/A). Group-wide cases show only without entity, region, class or risk filters.

## Close chain
Issue codes map to six stages; a record counts once per stage. Value affected: journals = value; reconciliations = |diff| for difference issues, GL balance for timeliness issues; IC = difference; variances = |variance|; local accounts = balance; tasks carry no value. Stage volume = records passing the stage in the period.
