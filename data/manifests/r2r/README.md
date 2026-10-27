# R2R Control Tower — manifest (v1, 21-Oct-2026)

**Built on the shared tower rules.** `../p2p/general-design.md` defines how every tower probes and looks; these files say what R2R puts into those patterns. P2P is the reference implementation and R2R reuses its components.

The R2R tower as built: 3 screens (Control tower · Entity profiles · Close chain), 13 KPIs (12 on the sheet + account mapping as a Health component), a KPI sheet that drills in place under the global breadcrumb, and the shared case workspace. Demo data is synthetic and illustrative (Jubilant, Sep-26 close in flight, snapshot Mon 05-Oct-2026 09:10 = WD+2).

| File | Read it for |
|---|---|
| `r2r-design-principles.md` | How R2R applies the shared rules: main entity, sheet sections, Health card and entity classes, breadcrumb examples, drill paths, case screen |
| `kpi-catalogue.md` | Each KPI in plain words, formula and basis, demo values, Health components, card contents, drill paths, case types |
| `technical-manifest.md` | Screens, files, data model, anchors, navigation and state, live effects, tests, open assumptions |

Related: `data/r2r/MODEL.md` (code-level formulas and calibration anchors) and `BUILD_PLAN.md` (project tracker).
Superseded: the 13 earlier R2R pages (overview, desk, close, journals, recs, balances, variance, consolidation, controls, ai, rootcauses, programme, settings) were folded into these three screens and moved out of the app to `../r2r-legacy-screens/` (outside `FCT-V2`, not served). `data/r2r.js` is kept: it seeds the new ledger and is still read by the Compliance tower.
