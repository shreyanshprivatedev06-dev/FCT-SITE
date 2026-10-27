# Supply Chain Control Desk --- Technical Requirements

## 1. Implementation scope

Modify the existing Supply Chain Control Desk at
`/screens/sc/desk.html`. Before coding, inspect the project structure,
framework, existing data models, styling, dependencies, and anomaly-row
interaction. Reuse the current architecture and working components where
possible. Do not introduce a framework migration or rewrite unrelated
process-tower screens without a clear need.

Use available Claude front-end skills or project guidance. For React
applications, select suitable React-compatible libraries; otherwise
choose libraries compatible with the existing framework. Candidate
libraries include Recharts or Apache ECharts for charts, Motion/Framer
Motion for transitions, and Lucide for icons. Inspect existing
dependencies first and avoid redundant libraries.

## 2. Synthetic data and shared model

All displayed business data is synthetic. Create or adapt realistic,
coherent demo data wherever necessary to support the requested features.
Do not omit a feature merely because a real source is unavailable.

Use a shared data model rather than independently hardcoding each
visualization. At minimum, support:

### KPI records

-   ID, name, unit, current value, target/benchmark.
-   Status thresholds and calculation definition.
-   Time-series values and prior-period comparison where relevant.
-   Related anomaly IDs.

### Demand and forecast records

-   Period, product/material ID, forecast quantity, actual demand.
-   Forecast variance, accuracy, and bias values.
-   Formula/definition and target thresholds.
-   Related inventory, procurement, or shortage consequences where
    relevant.

### Anomaly records

-   Unique ID, description, risk category, priority signals.
-   Process-tower ID.
-   Financial exposure, currency, and confirmed-versus-estimated status.
-   Due date/urgency.
-   Impact categories.
-   Control/system/transaction references.
-   Recommended action and evidence references.
-   Related KPI IDs and dependency/related-anomaly IDs where relevant.

### Process-tower relationships

-   Tower ID and related anomaly IDs.
-   Risk classification and financial exposure.
-   Organizational-impact categories.

### Recommendation records

-   Recommendation ID and associated anomaly IDs.
-   Action, ranking rationale, urgency/deadline.
-   Financial and operational consequences.
-   Required decision/approval and status where supported.

Keep synthetic values deterministic or controlled so the demo remains
repeatable. Ensure the data describes a plausible enterprise scenario
and is internally consistent.

## 3. Calculation and integrity rules

-   Calculate anomaly counts from distinct underlying anomaly IDs.
-   Calculate risk-category counts and process-tower contributions from
    shared records, not hardcoded display totals.
-   Use anomaly count to determine the leading tower by default; show
    financial exposure separately.
-   If the leader by count differs from the leader by exposure, preserve
    that distinction.
-   Define how exposure is aggregated to avoid double-counting related
    records or overlapping amounts.
-   Document the composite supply-chain health score, including
    components, weights, and thresholds.
-   Define forecast accuracy and forecast bias formulas and the sign
    convention for over- versus under-forecasting.
-   Ensure chart trends, KPI summaries, category totals,
    recommendations, and table records agree.
-   Do not display estimated exposure as confirmed loss.
-   Do not show zero when data is unavailable; use a clear unavailable
    state.
-   Do not fabricate evidence or claim an action has occurred when it is
    only recommended.

## 4. Global state and interaction model

Maintain a coherent shared dashboard context, including: - Active KPI
(default: overall supply-chain health). - Active risk category (default:
All risks). - Active process tower (default: All towers). - Active
impact filter, if applicable. - Relevant selected recommendation/anomaly
state.

Apply filters consistently to connected sections.

### KPI selection

Single-clicking a KPI updates the active analytical lens and relevant
supporting summaries, process-tower contributions, recommendations, and
anomaly context. Only logically related content should change; unrelated
KPI values must remain truthful.

### Risk selection

Single-clicking High, Medium, or Low updates the relevant anomaly
population, risk-specific summaries, process-tower distribution, impact
indicators, and recommendations. Provide an All risks reset.

### Process-tower selection

Filter the anomaly explorer to the selected tower while retaining other
active context. Provide an All towers reset.

### Impact selection

If impact indicators are interactive, filter or emphasize anomalies
associated with the selected impact category.

### Recommendation selection

Open or highlight the linked anomaly or linked group. Recommendations
must reference real records in the synthetic dataset.

### Anomaly row

Preserve the existing double-click workflow for opening the downstream
anomaly views. Do not replace that behavior with a new incompatible
interaction. Preserve list filters and context when practical.

Support combined filters, clear active-filter indicators, and useful
empty states. Prevent stale charts, inconsistent counts, or
recommendations unrelated to the current context.

## 5. Recommendation-ranking logic

Display up to five recommendations. Do not simply sort anomalies by
severity and take the first five.

Rank and select actions using available signals: - Financial
materiality. - Risk severity/likelihood. - Deadline and urgency. -
Financial-close impact. - Operational continuity and delivery
consequences. - Dependencies and downstream effects. -
Recurrence/control significance. - Feasibility and required decision
authority.

The recommendation set may contain different risk categories if that
produces a more useful action plan; do not enforce a fixed quota per
category. Group anomalies only when a meaningful shared root cause or
resolution dependency exists. Display a concise rationale for each
recommendation. Recommendations must not automatically execute actions
unless an existing authorized workflow explicitly supports it.

## 6. Visualization and animation implementation

Choose visualization types according to the analytical purpose: health
gauge, actual-versus-target, forecast-versus-actual, bias direction,
sparklines, risk distribution, stacked process-tower breakdown, exposure
bars/waterfalls, or inventory/supply visuals as appropriate.

-   Use chart libraries compatible with the existing application.
-   Prefer reusable components and consistent formatting.
-   Ensure chart data comes from the shared data model.
-   Provide labels/tooltips and accessible names for charts and icons.
-   Use restrained transitions for chart updates, KPI selection, risk
    changes, and panel transitions.
-   Avoid continuous decorative motion and respect reduced-motion
    preferences.
-   Ensure essential information remains understandable without
    animation or hover.
-   Avoid redundant libraries and unnecessary bundle weight.

## 7. UI behavior and preservation

-   Retain the existing application shell, left navigation, branding,
    close timeline, and working functionality.
-   Put the consolidated anomaly table at the bottom of the page.
-   Keep long evidence and descriptions in existing downstream detail
    views rather than cluttering the table.
-   Do not redesign the downstream views opened by double-clicking an
    anomaly row.
-   Do not hardcode illustrative values as production display logic.
-   Keep the interface responsive at supported screen sizes.

## 8. Validation and acceptance tests

Verify the following before completion:

1.  The default state shows overall health, all risk categories, and all
    relevant process towers.
2.  KPI selection changes the appropriate context without changing
    unrelated values.
3.  Risk counts reconcile with distinct anomaly records.
4.  Process-tower counts reconcile with the selected risk and KPI
    context.
5.  Financial exposure totals follow documented aggregation rules.
6.  The leading process tower is calculated dynamically and is not
    confused with the tower having the greatest exposure.
7.  Forecast accuracy and bias use documented, distinct formulas.
8.  The health score is explainable from its component KPIs.
9.  Recommendations refer to actual demo records and show a valid
    prioritization rationale.
10. Selecting recommendations opens/highlights the correct records.
11. Combined KPI, risk, tower, and impact filters behave consistently.
12. Clearing filters restores the expected population.
13. Empty and unavailable-data states are clear and not misleading.
14. Double-clicking an anomaly row still opens its existing downstream
    workflow.
15. Existing navigation and unrelated application behavior continue to
    work.
16. Charts and animations remain readable, responsive, and accessible.

## 9. Implementation sequence

1.  Inspect existing framework, page, dependencies, data model, and
    anomaly interactions.
2.  Map current data fields and identify gaps.
3.  Define shared synthetic records and calculation rules.
4.  Implement overall health and global KPI context.
5.  Implement risk summaries, process-tower contributions, and impact
    indicators.
6.  Implement recommendation ranking and presentation.
7.  Integrate the anomaly explorer while preserving downstream row
    behavior.
8.  Add appropriate visualizations, restrained animation,
    responsiveness, and accessibility.
9.  Test data consistency and all interaction combinations.

Deliver working application changes, not a disconnected visual mockup.
Summarize the files changed, libraries reused or added, data
assumptions, calculation rules, and tests performed.
