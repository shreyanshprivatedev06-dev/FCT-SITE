# Supply Chain Control Desk --- Design Specification

## 1. Design objective

Transform the existing `/screens/sc/desk.html` Supply Chain page into a
modern financial-control cockpit. Retain the existing Finance Control
Tower shell, left navigation, branding, close timeline, and product
visual identity. Reduce text-heavy presentation and create a clear
hierarchy from executive overview to anomaly-level inspection.

## 2. Page structure

Arrange the main content in this order:

1.  **Global KPI overview** --- overall supply-chain health plus
    supporting KPIs.
2.  **Risk-category intelligence** --- High, Medium, Low, and an All
    risks state.
3.  **Organizational impact and process-tower contribution** --- what
    kind of impact exists and where it is concentrated.
4.  **AI-recommended action plan** --- up to five prioritized actions.
5.  **Consolidated anomaly explorer** --- the existing line-by-line
    anomaly table at the bottom.

Use clear section titles and consistent spacing. The top should be
compact enough to show the health summary quickly; the lower sections
should progressively reveal more detail.

## 3. Visual language

Build an advanced, systematic control panel, not a wall of cards. Use a
versatile set of appropriate visualizations, such as:

-   Composite health gauge or score visualization.
-   Actual-versus-target indicators.
-   Forecast-versus-actual line charts.
-   Forecast-bias directional visualization.
-   Sparklines and compact time-series charts.
-   Donut charts or proportional bars for risk distribution.
-   Stacked bars for risk by process tower.
-   Exposure bars or waterfall charts when they communicate financial
    drivers.
-   Inventory coverage or supply-sufficiency visuals where relevant.
-   Concise status indicators and contextual icons.

Do not use every chart type simply for variety. Select each
visualization based on the question it answers. Vary presentation where
it improves comprehension; do not represent every KPI as a numeric card.

Use consistent typography, alignment, spacing, chart legends, number
formatting, and color semantics. Make financial figures easy to scan.
Use color together with labels/icons so meaning is not communicated by
color alone.

## 4. Global KPI overview

Make the overall supply-chain health indicator the primary visual anchor
and default analytical lens. It should show a score or state, a concise
interpretation, and the main contributing factors. The score must be
explainable by a documented configuration of component KPIs and
thresholds.

Supporting KPI visualizations should cover demand and forecast health,
inventory and supply, and financial/control performance. Include
forecast accuracy and forecast bias prominently, alongside relevant
indicators such as material exposure, net inventory, inventory record
accuracy, DIO, valuation decisions pending, and receipts not booked.

Keep only the most useful metrics prominent. Use secondary indicators or
supporting views for the rest rather than crowding the first viewport.

## 5. Risk-category section

Show High, Medium, and Low risk as distinct interactive visual elements.
Each should display the distinct anomaly count, financial exposure when
available, share of the applicable population or exposure, leading
process tower by anomaly count, and a compact indication of
organizational impact.

Allow selection of a category to update relevant content below. Show the
All risks state clearly and make it easy to restore.

## 6. Organizational-impact indicators

Show approximately three compact indicators, selected according to the
current context:

-   Financial exposure (currency or financial icon).
-   Operational/delivery impact (delivery vehicle or logistics icon).
-   Compliance/control integrity (shield, check, or audit icon).

These describe organizational consequences, not process-tower names.
Show a value, count, or short label only when the data supports it. Use
a consistent icon library and accessible labels/tooltips. Avoid
cluttering the risk section with many unrelated icons.

For each risk category, also show which process tower contributes the
most anomalies. Keep the primary contribution measure explicit: anomaly
count by default, with financial exposure shown separately. If the
leader by count differs from the leader by exposure, display both
distinctions.

## 7. AI recommendation section

Place the recommendation panel above the anomaly table. Show up to five
recommendations with concise, action-oriented headings. Each item should
show risk category, process tower, financial impact when known,
deadline/urgency, and a brief prioritization rationale. Include a clear
way to inspect the associated anomaly or group.

Use restrained visual emphasis to distinguish the highest-priority
actions without making the whole section visually noisy.

## 8. Anomaly explorer

Keep the individual anomaly table at the bottom of the page. Retain a
compact, scannable row structure with priority, description, risk
category, process tower, financial impact, due date/urgency, relevant
control/system reference, and concise action/status where available.

Use secondary styling for identifiers. Keep long descriptions and
evidence out of the rows.

Preserve the existing double-click behavior that opens the downstream
views for an anomaly. Do not redesign those downstream views as part of
this dashboard task.

## 9. Interaction and motion

-   Single-click KPI selection changes the active analytical lens.
-   Single-click risk selection filters the connected views.
-   Single-click process-tower selection filters the anomaly explorer.
-   Selecting a recommendation opens or highlights its associated
    anomaly.
-   Double-clicking an anomaly row invokes the existing downstream
    workflow.
-   Active selections and filters must be visually obvious.
-   Returning to All KPIs, All risks, or All towers must be
    straightforward.

Use subtle, purposeful animation for chart transitions, KPI updates,
selected-state changes, and panels where applicable. Do not animate
everything or delay access to information. Respect reduced-motion
preferences.

## 10. Responsive and accessible design

Maintain readable numbers, charts, and controls at supported screen
sizes. Avoid relying on hover alone for essential information. Provide
tooltips or labels for icons and chart semantics. Ensure keyboard focus
and reduced-motion behavior are considered. If the layout must collapse
at smaller widths, preserve the same information hierarchy.

## 11. Design acceptance checklist

-   [ ] Overall health is the main visual anchor and default view.
-   [ ] Forecast accuracy and bias are distinct, prominent
    visualizations.
-   [ ] Visualizations vary meaningfully; KPIs are not all numeric
    cards.
-   [ ] Risk categories show counts and useful financial/organizational
    context.
-   [ ] Leading process-tower contribution is clear.
-   [ ] Organizational impact uses a small, consistent set of meaningful
    icons.
-   [ ] Recommendations appear above the table.
-   [ ] The anomaly table is at the bottom.
-   [ ] KPI/filter changes animate subtly and update connected views.
-   [ ] Existing shell, navigation, and anomaly downstream workflow are
    preserved.
