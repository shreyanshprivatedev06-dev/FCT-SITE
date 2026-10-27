# P2P Control Tower — manifest (v2, 21-Oct-2026)

**Building another tower (O2C, R2R, SC, Compliance)?** Start with `general-design.md`: it is tower-agnostic and defines how your screens must probe and look. Use the P2P files as the worked example.

The P2P tower as built: 3 screens (Control tower · Vendor profiles · Process chain), 12 KPIs, a KPI sheet that drills in place under a global breadcrumb, and an investigation-grade case screen. Demo data is synthetic and illustrative (Jubilant, Sep-26, snapshot 05-Oct-2026 09:10).

| File | Read it for |
|---|---|
| `general-design.md` | **For every tower.** The shared UI/UX rules: probing model, breadcrumb, click grammar, KPI-card anatomy, detail and case templates, honesty rules, visual system, reuse, definition of done. It also sets out what is shared and what each tower defines. |
| `p2p-design-principles.md` | How P2P applies those rules: its pillars, KPI sheet sections, Health card and vendor segments, breadcrumb examples, drill paths, case screen, visual choices |
| `kpi-catalogue.md` | Each KPI in plain words, its formula and basis, demo values, Health components and vendor segments, card contents and drill paths, case types |
| `technical-manifest.md` | Screens, stack, files, data model, navigation and state, interaction contract, tests, how to extend, open assumptions |

Related: `data/p2p/MODEL.md` (code-level formulas and calibration anchors) and `BUILD_PLAN.md` (project tracker).
Superseded and removed: `P2P_Control_Tower_Handoff.docx` (the 19-Oct brief; its KPI list and interaction rules are carried into these files).
