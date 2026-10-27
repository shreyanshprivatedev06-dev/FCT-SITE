# Supply Chain Control Desk --- Narrative & Purpose

## 1. Purpose

Redesign the existing Supply Chain Control Desk as a financial
controller's decision cockpit. The page should help a controller
understand the state of supply chain, identify the risks that matter,
decide what to address first, and inspect the supporting anomaly.

The page is not a generic warehouse dashboard. It connects demand and
supply conditions to inventory, financial exposure, accounting
completeness, working capital, supplier continuity, and close-period
decisions.

## 2. The intended story

Present information in this order, from top to bottom:

1.  **Overall health:** How healthy is the supply chain?
2.  **Performance drivers:** What do demand, forecast accuracy and bias,
    inventory, and financial-control KPIs say?
3.  **Risk distribution:** How many anomalies are high, medium, and low
    risk, and what is their financial significance?
4.  **Organizational impact:** Which process tower contributes most, and
    are the main consequences financial, operational/delivery-related,
    or control/compliance-related?
5.  **Next best actions:** Which five actions should the controller
    prioritize, considering materiality, urgency, dependencies, and
    wider impact?
6.  **Full exception population:** What are the individual anomalies,
    line by line?
7.  **Supporting detail:** When an anomaly is opened through the
    existing row interaction, show its established downstream detail
    workflow.

The controller should be able to understand the headline position within
seconds without reading paragraphs, then progressively explore the
evidence.

## 3. Default state

The default page state shows the overall supply-chain health view, all
risk categories, and all relevant process towers. It must not silently
hide anomalies through pre-applied filters.

The overall health KPI is the primary visual anchor. Supporting KPIs
explain the score and the current state. The risk section highlights the
scale and nature of exceptions. Recommendations identify useful actions.
The full anomaly table remains at the bottom.

## 4. Global analytical context

KPI selection is a global analytical lens, not merely a link to another
page. Selecting a KPI changes the relevant context across the dashboard.
For example:

-   **Forecast bias:** emphasize forecast direction and trend, related
    demand-planning anomalies, their risk distribution, contributing
    process towers, consequences, and relevant actions.
-   **Material exposure:** emphasize exposure drivers, related
    anomalies, organizational impact, and actions.

Only views logically related to the selected KPI should change. Do not
change unrelated metric values merely to make the page appear
interactive.

Selecting High, Medium, or Low risk updates the risk-specific summary,
process-tower contribution, impact indicators, relevant recommendations,
and anomaly list. Selecting a process tower filters the anomaly explorer
while preserving the current KPI and risk context. Provide a clear way
to return to the overall view and clear filters.

Use a single click for KPI and filter selection. Preserve the existing
double-click workflow for opening an anomaly row and its downstream
views.

## 5. Risk categories should explain the problem

Each of the three risk categories must show:

-   Count of distinct anomalies.
-   Financial exposure when supported by the data.
-   Share of the relevant anomaly population or exposure.
-   Process tower contributing the largest number of anomalies.
-   A concise indication of the primary organizational concern.
-   A small number of meaningful impact icons.

Use anomaly count to identify the leading process tower by default, and
show financial exposure separately. If the tower with the most anomalies
differs from the tower with the largest exposure, make the distinction
clear.

## 6. Organizational-impact language

Process towers identify where an issue is managed; impact categories
explain what it means for the organization. Use approximately three
concise impact indicators:

-   **Financial exposure:** monetary impact, valuation, payment, or
    potential loss.
-   **Operational and delivery impact:** material availability,
    production continuity, supplier delivery, fulfilment, or service
    commitments.
-   **Compliance and control integrity:** accounting, approval, policy,
    regulatory, or control concerns.

Use appropriate consistent icons, such as a currency symbol, delivery
vehicle, and shield/check. These are broad categories, not process-tower
labels. Adapt the indicators if another impact dimension is more
relevant to the data, but keep the presentation compact. Distinguish
confirmed impact from potential consequences.

## 7. AI-recommended action plan

Show up to five recommendations above the anomaly table. They must not
simply be the five highest severity scores. Select a useful portfolio of
actions based on financial materiality, urgency, deadlines, close
impact, operational continuity, dependencies, recurrence, control
significance, and decision authority.

The recommendation set may include a mix of high-, medium-, and low-risk
items when that produces the best overall plan; do not enforce a fixed
one-per-category quota. Group related anomalies only when they share a
meaningful root cause or resolution dependency.

Each recommendation communicates the action, linked anomaly or
anomalies, risk, tower, financial impact where known, deadline, and a
brief reason for priority. AI suggestions must be presented as
recommendations, not confirmed facts or automatically executed actions.

## 8. Tone and information density

The screen should be concise, systematic, and decision-oriented. Use
short labels, chart annotations, tooltips, and visual summaries instead
of long paragraphs. Put evidence and extended explanations in the
existing downstream anomaly-detail views.

The design should make the most important financial and operational
issues obvious without making every metric equally prominent.

## 9. Demo-data narrative integrity

All business information is synthetic. It must still tell a coherent
enterprise scenario. Forecast changes should plausibly affect material
requirements and inventory; receipts not booked should relate to
ownership, receipt dates, purchase orders, and cut-off; supplier risks
should have plausible financial and operational consequences; KPI
trends, anomaly counts, risk totals, and recommendations must agree with
the underlying demo records.

Do not display a confirmed loss when the data supports only a potential
exposure. Do not use unrelated random values in different widgets.

## 10. Success criteria

A controller should be able to answer, in order:

-   What is the overall state?
-   Which performance indicators explain it?
-   Where are the highest-priority risks and how much do they matter?
-   Which organizational impacts are involved?
-   What should be addressed first?
-   Which individual anomalies support those conclusions?

The screen succeeds when this story is immediately understandable and
deeper detail is available without losing context.
