/* Build docs/O2C-screen-guide.docx — walkthrough of every visible O2C control. */
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber,
  LevelFormat, VerticalAlign, PageBreak } = require('docx');
const fs = require('fs');
const path = require('path');

const TEAL = '0B3B3A';
const TEAL2 = '1A4A47';
const BRASS = 'B08A1E';
const INK = '1C2423';
const MUTED = '5A6A67';
const LINE = 'D5DDDB';
const HEAD_BG = '0B3B3A';
const ALT = 'F4F7F6';
const CREAM = 'F7F3EA';
const TW = 9360;

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const thin = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: thin, bottom: thin, left: thin, right: thin };
const none = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

const r = (text, o = {}) => new TextRun({
  text, font: 'Calibri', size: o.size || 22, color: o.color || INK, bold: o.bold, italics: o.italics,
});
const p = (text, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 160, before: o.before ?? 0, line: o.line || 276 },
  alignment: o.align,
  children: Array.isArray(text) ? text : [r(text, o)],
});
const h = (text, level) => new Paragraph({
  heading: level,
  spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 280, after: 120 },
  border: level === HeadingLevel.HEADING_1
    ? { bottom: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 6 } }
    : undefined,
  children: [new TextRun({ text, font: 'Calibri', bold: true, color: TEAL,
    size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 24 })],
});
const note = (text) => p([r(text, { italics: true, color: MUTED, size: 20 })]);
const bullet = (text, ref = 'bullets') => new Paragraph({
  numbering: { reference: ref, level: 0 },
  spacing: { after: 80, line: 276 },
  children: [r(text)],
});

function cell(text, w, o = {}) {
  const kids = (Array.isArray(text) ? text : [text]).map(t => new Paragraph({
    spacing: { after: 40, before: 40 },
    children: [r(String(t), { size: o.size || 18, bold: o.bold, color: o.color || (o.header ? 'FFFFFF' : INK) })],
  }));
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders,
    shading: o.header ? { type: ShadingType.CLEAR, fill: HEAD_BG }
      : o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: kids,
  });
}
function table(headers, rows, widths) {
  const head = new TableRow({
    children: headers.map((h, i) => cell(h, widths[i], { header: true, bold: true, size: 18 })),
  });
  const body = rows.map((row, ri) => new TableRow({
    children: row.map((c, i) => cell(c, widths[i], { fill: ri % 2 ? ALT : 'FFFFFF', size: 18 })),
  }));
  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: widths,
    rows: [head, ...body],
  });
}
function kvTable(pairs) {
  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: pairs.map(([k, v], i) => new TableRow({
      children: [
        cell(k, 2800, { bold: true, fill: i % 2 ? ALT : CREAM, size: 18 }),
        cell(v, 6560, { fill: i % 2 ? ALT : 'FFFFFF', size: 18 }),
      ],
    })),
  });
}
function spacer(after = 200) {
  return new Paragraph({ spacing: { after }, children: [] });
}

const children = [];

/* ---------- cover ---------- */
children.push(
  new Paragraph({ spacing: { before: 0, after: 80 }, children: [r('FCT  ·  Finance Control Tower', { size: 20, color: TEAL, bold: true })] }),
  new Paragraph({ spacing: { after: 80 }, children: [r('Jubilant (demo) working session', { size: 20, color: MUTED })] }),
  new Paragraph({
    spacing: { before: 480, after: 120 },
    children: [new TextRun({ text: 'Order to Cash', font: 'Calibri', size: 56, bold: true, color: TEAL })],
  }),
  new Paragraph({
    spacing: { after: 280 },
    children: [new TextRun({ text: 'Screen guide', font: 'Calibri', size: 40, color: BRASS })],
  }),
  p('What every control, number and action on the O2C tower means — written against the screens as they appear, not against the old eleven-page layout.'),
  spacer(80),
  kvTable([
    ['Who this is for', 'Controllers, AR, credit, billing and collections using the demo'],
    ['Demo persona', 'Priya Raman, Group Financial Controller'],
    ['Period on screen', 'Sep-26 flows (Q2 FY27)'],
    ['Snapshot clock', '05-Oct-2026 09:10 (working day +2 of the Sep close)'],
    ['Currency', 'INR, shown as ₹ Cr, or ₹ L when the amount is under ₹1 Cr'],
    ['Data', 'Illustrative. Entities, people and system links are simulated.'],
  ]),
  new Paragraph({ children: [new PageBreak()] }),
);

children.push(
  h('Contents', HeadingLevel.HEADING_1),
  p('This guide follows the screen, top to bottom, then explains what happens after you click.'),
  bullet('1. What you are looking at'),
  bullet('2. The chrome around every O2C page'),
  bullet('3. How clicking works'),
  bullet('4. Control tower — the KPI sheet (including customer segments)'),
  bullet('5. What each KPI is measuring'),
  bullet('6. After you open a KPI'),
  bullet('7. Customer profiles'),
  bullet('8. Document chain and case screen'),
  bullet('9. Process chain'),
  bullet('10. The decision drawer and named exceptions'),
  bullet('11. How to read the numbers honestly'),
);

children.push(
  h('1. What you are looking at', HeadingLevel.HEADING_1),
  p('Order to cash answers two controller questions: is revenue right, and is cash coming in? The tower is three screens, not eleven. Everything that used to live on credit, collections, disputes, cash, cut-off, balances, provisions, outlook, evidence and improvement is now a view on one of these three.'),
  spacer(80),
  table(
    ['Screen', 'Tab label', 'What it is for'],
    [
      ['Control tower', 'Control tower', 'The KPI sheet. This is the default. Every number you need for the close sits here; click anything to go deeper.'],
      ['Customer profiles', 'Customer profiles', 'Who the customers are, how risky they are, and the full Customer Profile for any account.'],
      ['Process chain', 'Process chain', 'Where Order → Credit check → Dispatch → Invoice → Collection → Cash applied breaks, and which customers cause it.'],
    ],
    [2200, 2400, 4760],
  ),
  spacer(160),
  p('The old eleven pages (credit, collections, disputes, cash, outlook, cut-off, balances, provisions, evidence, improvement) have been removed. Deep links use the address bar hash on the three remaining screens (for example desk.html#kpi=overdue).'),
  p([
    r('The main entity is the ', { size: 22 }),
    r('customer', { size: 22, bold: true }),
    r(', never the vendor. Filters, tables, heat maps and profiles all say customer.', { size: 22 }),
  ]),
);

children.push(
  h('2. The chrome around every O2C page', HeadingLevel.HEADING_1),
  p('The three screens share one frame. Learn it once.'),

  h('Left rail', HeadingLevel.HEADING_2),
  p('The dark-teal strip on the left is the tower navigator for the whole Finance Control Tower, not only O2C.'),
  kvTable([
    ['« / » at the top', 'Collapses the rail to codes (P2P, O2C, R2R, SC, CMP) or expands the full names. The choice is remembered.'],
    ['FCT mark', 'Home of the product. Not a data control.'],
    ['PR avatar', 'The signed-in persona — Priya Raman, Group Financial Controller.'],
    ['All towers / P2P / O2C / R2R / SC / CMP', 'The five towers plus Controller home. O2C is expanded while you are on these screens. Click a tower to jump.'],
    ['O2C sub-links', 'When O2C is expanded: Control tower, Customer profiles, Process chain. The current page is highlighted.'],
  ]),

  h('Command ribbon', HeadingLevel.HEADING_2),
  p('The dark-teal bar under the (hidden) close clock is the O2C command bar. It replaces the classic top bar on these three screens.'),
  kvTable([
    ['☰ menu', 'Same as the rail collapse: hide or show tower names.'],
    ['Control tower / Customer profiles / Process chain', 'The three O2C tabs. The current tab has a gold underline and a filled pill. Switching tabs does not reset filters.'],
    ['Period', 'Which month or quarter the flow KPIs use. Default Sep-26. Also Aug-26, Jul-26, Q2 FY27, H1 FY27. Changing it recomputes billed revenue and the five rates. Snapshot KPIs (AR, overdue, exposure) stay on 05-Oct.'],
    ['BU', 'Business unit. IN-01 Corporate through IN-08 Distribution, plus US-01 and EU-01. “All” is the group view.'],
    ['Region', 'North India, West India, South India, North America, Europe, or All.'],
    ['Category', 'Product line: Formulations, API, Life science ingredients, Nutrition, Specialty chemicals, Distribution, or All.'],
    ['Risk', 'Approved customer risk: Critical, High, Medium, Low, or All.'],
    ['Search customer', 'Type two or more letters to find an account by name or ID (C-40102). Choosing one pins that customer through every drill.'],
    ['Sun / moon', 'Light or dark theme. Dark is the default. The choice is remembered for O2C.'],
    ['PR menu', 'Switch persona, sign out, or open the user menu.'],
  ]),
  note('An active filter turns amber on the control. Filters persist when you drill. They never drop the customer you have open.'),

  h('Breadcrumb', HeadingLevel.HEADING_2),
  p('The arrow-shaped trail under the ribbon is how you know where you are. It is always there, even on the overview (where it shows a single step: Overview · KPI sheet).'),
  kvTable([
    ['← back arrow', 'Steps up one level. Disabled on the overview.'],
    ['Each chevron', 'An icon, a small level name (Overview, KPI, Product line, Customer, Document, Case) and a bold label.'],
    ['Filled current step', 'Coloured with that KPI’s accent (teal for health, blue for revenue, violet for AR/overdue, amber for exposure and customers).'],
    ['Earlier steps', 'Neutral and clickable. Clicking one restores that view and whatever you had selected there.'],
    ['URL hash', 'The path is written into the address bar, so a reload or a pasted link reopens the same view.'],
  ]),
);

children.push(
  h('3. How clicking works', HeadingLevel.HEADING_1),
  p('The same grammar is used on every card, bar, row and heat cell. Nothing important is hover-only; every action has a keyboard route.'),
  spacer(80),
  table(
    ['What you do', 'What happens'],
    [
      ['Click a KPI card, slice, tile or row on the sheet', 'The sheet is replaced, in place, by that KPI’s detail. The breadcrumb gains a step. The thing you clicked is pre-selected.'],
      ['Single-click a bar or row inside a detail', 'Selects it and shows its numbers locally. You do not navigate yet.'],
      ['Double-click, press Enter, or click ›', 'Drills one level and adds a breadcrumb step.'],
      ['Click anywhere on a case or invoice row', 'Opens that record. The whole row is the target; the arrow is only a cue.'],
      ['Click a breadcrumb step', 'Returns to that level with its selection restored.'],
      ['Change a filter', 'Recomputes every number on the current view. The path stays.'],
      ['Decide or Investigate', 'Opens the shared decision drawer (Decide) or the case screen (Investigate).'],
    ],
    [4200, 5160],
  ),
  spacer(120),
  p('Typical path: KPI sheet → Billed Revenue → Formulations → a customer → an invoice → evidence. You can stop at any step. The first breadcrumb always takes you home to the overview of that screen.'),
);

children.push(
  h('4. Control tower — the KPI sheet', HeadingLevel.HEADING_1),
  p('This is the default O2C screen. It is one board in five sections. Numbers in this guide are the unfiltered Sep-26 / 05-Oct demo so you can match them to what you see; they are illustrative.'),
  note('Footer of the board: “Flows: Sep-26. Balances at 05-Oct-2026 09:10. Illustrative data.” Period flows and snapshot balances are never mixed in one total.'),

  h('Section: Headline KPIs', HeadingLevel.HEADING_2),
  p('The section title sits with a one-line description: billed revenue is for Sep-26; receivables, overdue and exposure are as at 05-Oct-2026 09:10. Two pills on the right repeat Health (score and band) and the open collections exposure.'),

  h('O2C Health Score card', HeadingLevel.HEADING_3),
  p('The large left card is the composite score for the tower. It is not a traffic-light opinion; it is a weighted average of six control rates.'),
  kvTable([
    ['Ring (57 / 100)', 'The score. 75 and above is Healthy, 55–74 is Watch, below 55 is At risk. 57 is Watch.'],
    ['Watch pill', 'The band name, coloured amber.'],
    ['▼ 9.0 pts', 'Change versus Aug-26. Red down, green up.'],
    ['Coverage 100%', 'Share of the six components that had enough records to score. Missing data is excluded and lowers coverage; it is never scored as 100.'],
    ['Points lost 43', '100 minus the score. Useful when you want “how far from perfect”, not the band.'],
    ['Apr–Sep trend', 'A sparkline of the score across the six months of the demo ledger.'],
    ['Plain-language note', 'Computed from the numbers on the card, e.g. “The score is 57 out of 100, 9 points lower than Aug-26. Cash application is pulling it down the most.”'],
    ['Customer segment', 'All, plus Strategic, Distributor, Export, Transactional. Each button shows the count of active customers. Choosing a segment recomputes the six tiles for that segment only. Explained under Customer segment chips.'],
  ]),
  p('The six tiles on the right of the health card are the components. Each shows the rate, a bar from floor to target, a “% of customers affected” tag, a count (for example 4 of 55), and a one-line note. Click a tile to open Health already focused on that component.'),
  spacer(80),
  table(
    ['Tile', 'Weight', 'Floor → target', 'What the note is telling you'],
    [
      ['Collection success', '20', '60 → 92', 'Of the overdue invoices on the worklist at period start, how many were collected. Failures are counted, and the note names the segment with most misses.'],
      ['Promises kept', '20', '55 → 88', 'Dated promises that fell due in the period and were honoured. A revised promise is a new promise, not a keep.'],
      ['Cash application', '15', '88 → 99', 'Receipts that matched invoices without a person guessing. Low-confidence and on-account holds count as not matched.'],
      ['Credit policy', '15', '85 → 99', 'Limit changes, new accounts and order-release decisions made inside approved policy.'],
      ['On-time billing', '15', '75 → 97', 'Dispatches invoiced within two days of control passing. In-transit DAP/DDP at month-end is unbilled, not late.'],
      ['Master data', '15', '85 → 99', 'Six checks on every active customer: GSTIN, PAN, credit limit, billing contact, payment terms, POD / e-invoicing.'],
    ],
    [2000, 1000, 1600, 4760],
  ),

  h('Customer segment chips', HeadingLevel.HEADING_3),
  p('These four labels sit on the Health card. They are how the customer is sold and collected — not credit risk, and not the P2P Kraljic matrix (Strategic / Leverage / Bottleneck / Transactional). Every active customer in the current filters is tagged with one of them. The number under All is the total of the four chips.'),
  spacer(80),
  table(
    ['Chip', 'Unfiltered count', 'What it means on this screen', 'Named examples'],
    [
      ['All', '56', 'Active customers only. Onboarding records (CON-1182, CON-1179, CON-1176) are excluded from Health, risk mix and master-data quality.', '—'],
      ['Strategic', '18', 'Hospital and other key care networks. Internally some accounts are stored as Key account; the Health card folds those into Strategic, which is why the chip is 18 rather than the eight purely labelled Strategic.', 'Meridian Health Systems, Lakeshore Clinics, Coastline Hospitals, NutriBlend Foods, AgriNova'],
      ['Distributor', '12', 'Domestic wholesale and distribution. Longer terms (often 45-60 days), higher credit limits, more orders held for credit review.', 'Medilink Distributors, Corvia Healthcare'],
      ['Export', '8', 'Overseas wholesalers and buyers (EU/US books, foreign flag). Incoterms, FX and export credit sit here.', 'Helvetia Pharma Distribution AG (Switzerland), Pacific Generics Inc (USA)'],
      ['Transactional', '18', 'The remainder: smaller or occasional accounts. Shorter terms, lower limits. 56 minus 18 minus 12 minus 8.', 'Orbit Pharmacy Chain, Zenith Life Care, Helix Diagnostics'],
    ],
    [1800, 1400, 3760, 2400],
  ),
  spacer(160),
  p('Picking a chip recomputes the six Health tiles for that slice: the rate, the bar from floor to target, and the percent of customers affected tag. The italic note compares that segment with all customers (better, worse, or the same). The rest of the KPI sheet does not change until you leave Health — this is a Health-card lens only.'),
  p('Segment is not risk. Risk (Low / Medium / High / Critical) is a separate score on the customer. A Strategic hospital can be High risk (Meridian); a Transactional account can be Low. The identity line on a Customer Profile still shows the stored label, so NutriBlend can read Key account there while counting as Strategic on the Health chips.'),

  h('Billed Revenue card', HeadingLevel.HEADING_3),
  kvTable([
    ['Value', 'Posted customer invoices minus credit notes in Sep-26. GST, intercompany and unbilled are excluded.'],
    ['▲ vs Aug-26', 'Period-on-period change. The small “i” opens the definition (formula, exclusions, owner, refresh).'],
    ['Spark area', 'Monthly billed revenue Apr–Sep.'],
    ['Top business units table', 'The three BUs with most billed revenue, with share and change versus the prior period.'],
    ['Footer: Invoices / Credit notes / Top 5 AR', 'Count of invoices posted, value of credit notes, and the share of open AR sitting in the top five customers.'],
  ]),

  h('Open Receivables card', HeadingLevel.HEADING_3),
  kvTable([
    ['Value', 'Open invoice balances at 05-Oct-2026 09:10, net of credits applied. Ageing is days past due.'],
    ['Invoice pill', 'How many invoices make up that balance.'],
    ['Ageing bar', 'Not due, 1–30, 31–60, 61–90, Over 90. The demo is pinned to 1,102 + 238 + 96 + 54.2 + 46.8 = ₹1,537 Cr.'],
    ['Note', 'Repeats open AR, how much of it is past due, and ECL required versus ECL booked (₹12.42 Cr required, ₹10.90 Cr booked).'],
    ['Largest open customers', 'Top three customers by AR, with share and their overdue slice.'],
    ['Footer', 'Overdue total, ECL required, unapplied cash (shown beside AR, never netted until matched).'],
  ]),

  h('Overdue Receivables card', HeadingLevel.HEADING_3),
  kvTable([
    ['Value', 'Open invoices whose due date is before the snapshot. Not-yet-due invoices are excluded. Disputed balances sit inside the total and are flagged.'],
    ['Days-past-due bar', '1–30 / 31–60 / 61–90 / Over 90 only — there is no “not due” here.'],
    ['DSO', 'Open AR ÷ billed revenue in the last 90 days × 90. It is a cash-cycle number, not a collections rate.'],
    ['Most overdue customers', 'Top three, with bill count and the age of the oldest bill.'],
    ['Footer', 'DSO, disputed amount inside overdue, and overdue older than 30 days.'],
  ]),

  h('Collections Exposure card', HeadingLevel.HEADING_3),
  p('This is not a provision and not a write-off. It is the sum of estimated values on open and under-investigation financial cases, counted once per case.'),
  kvTable([
    ['Value and “open cases” pill', 'Potential exposure and how many financial cases feed it.'],
    ['Three source bars', 'The largest exposure types on the open set (for example pricing dispute, predicted late payment, shortage deduction).'],
    ['Note', 'Names the biggest source as a share of the total, and states that nothing is confirmed lost unless a loss figure is shown.'],
    ['Footer: Disputed / Loss / Control', 'Three measures that must never be added to potential exposure. Control is value affected on credit-limit, duplicate, wrong-period and AR–GL cases.'],
  ]),

  h('Section: Revenue KPIs', HeadingLevel.HEADING_2),
  kvTable([
    ['Revenue by product line', 'A donut of Sep-26 billed revenue by Formulations, Nutrition, Life science ingredients, API, Distribution and Specialty chemicals. The centre is the total and the category count. Click a slice or a legend row to open Billed Revenue already filtered to that line.'],
    ['Top Customers by AR', 'Ranked bars of open AR. The coloured dot is the approved risk category. The subtitle is concentration: top 5 share and top 10 share. Click a name to open that customer inside the Top Customers KPI.'],
  ]),

  h('Section: Customer and Exposure KPIs', HeadingLevel.HEADING_2),
  kvTable([
    ['Customer risk and compliance', 'A stacked bar of active customers by Critical / High / Medium / Low. Four tiles: High-risk count (High + Critical), re-reviews (model category differs from approved), master-data quality %, and duplicate records sharing PAN or GSTIN. Duplicate opens Customer profiles.'],
    ['Potential exposure by type', 'Full list of open/under-investigation estimates by type. Footer repeats Potential, Disputed and Confirmed loss. Click a type to open Collections Exposure on that type.'],
  ]),
  p('Risk categories, as labelled on screen:'),
  bullet('Critical — score 80+: default, dispute hold or credit-limit breach. Reviewed weekly by AR & Credit.'),
  bullet('High — 60–79: overdue, broken promises or bureau deterioration. Fortnightly review.'),
  bullet('Medium — 40–59: isolated delays. Monthly review.'),
  bullet('Low — below 40: pays in cycle. Quarterly review.'),

  h('Section: Control KPIs', HeadingLevel.HEADING_2),
  p('Five rate cards in a row. The section pill says how many of the five are on target. Each card is built the same way so you can scan them:'),
  bullet('Title (short name) and the rate as a percentage.'),
  bullet('Status pill: On target (green), Watch (amber), Off target (red), or No data.'),
  bullet('A bar from a floor just below “watch” up to 100, with a marker at the target.'),
  bullet('Target % and the change versus the prior period.'),
  bullet('A six-month sparkline.'),
  bullet('Footer: records in the denominator, exception count, and the prior-period rate.'),
  p('The five cards, left to right: Cash application, Credit policy, Promises kept, On-time billing, Collection success. Click any card to open that KPI’s detail.'),

  h('Section: Exceptions', HeadingLevel.HEADING_2),
  p('Open cases that still need a person. The pills count financial cases (an estimate) versus control cases (value affected, never a loss). The All / Financial / Control radios filter the table.'),
  kvTable([
    ['Priority', 'High / Medium / Low from the amount on that case. Financial and control use different thresholds so a ₹2 Cr control breach is High, while a ₹0.4 Cr financial estimate is Medium.'],
    ['Type', 'The exposure type (pricing dispute, unapplied cash, credit-limit breach, …) and the case ID. Control rows say “value affected”.'],
    ['Customer', 'The account the case is on.'],
    ['Amount', 'Estimate for financial cases; value affected for control cases. These are not added together in the headline.'],
    ['Age', 'Days since the case was opened, relative to 05-Oct.'],
    ['Status', 'Open, Under investigation, Disputed with customer, and so on.'],
    ['Decide / Investigate', 'Decide opens the shared drawer when the case is tied to a named exception (O2C-STR-09, O2C-ONB-06, …). Investigate opens the case screen inside the tower.'],
  ]),
);

children.push(
  h('5. What each KPI is measuring', HeadingLevel.HEADING_1),
  p('The “i” on a KPI detail header repeats this definition: formula, denominator, exclusions, owner, refresh and drill path. All of it is illustrative demo configuration.'),
  spacer(80),
  table(
    ['KPI', 'Question it answers', 'How it is calculated', 'Basis'],
    [
      ['O2C Health Score', 'How well are controls and collections performing?', 'Weighted normalised scores of the six components. Missing components are dropped and reduce coverage.', 'Period'],
      ['Billed Revenue', 'How much did we invoice in the period?', 'Posted customer invoices minus credit notes, by invoice month. Unbilled is shown beside, not inside.', 'Period'],
      ['Open Receivables', 'What do customers owe us today?', 'Open invoice balances at the snapshot, net of credits. Unapplied cash is beside, not netted.', 'Snapshot'],
      ['Overdue Receivables', 'What is past due, and how long will cash take?', 'Open invoices with due date before the snapshot. DSO = AR ÷ last-90-days billed × 90.', 'Snapshot'],
      ['Collections Exposure', 'What value is at risk and needs a person?', 'Sum of estimates on open and under-investigation financial cases, one per case.', 'Snapshot'],
      ['Customer Risk Mix', 'How are active customers spread by risk?', 'Count of unique active customers by approved category. AR share is a separate toggle.', 'Snapshot'],
      ['Top Customers by AR', 'Who carries the most open receivables?', 'Open AR by customer, ranked. Share = customer AR ÷ Open Receivables.', 'Snapshot'],
      ['Collection Success', 'Of the overdue we targeted, how much came in?', 'Overdue collected in the period ÷ overdue on the worklist at period start.', 'Period'],
      ['Promises Kept', 'Did customers pay when they said they would?', 'Promises due in the period that were honoured ÷ promises due in the period.', 'Period'],
      ['Cash Application Match', 'How many receipts match without guessing?', 'Auto-matched or accepted receipts ÷ receipts loaded in the period.', 'Period'],
      ['Credit Policy Adherence', 'Were credit decisions inside policy?', 'Decisions inside limit, terms and security ÷ credit decisions in the period.', 'Period'],
      ['On-Time Billing', 'Was every shipment billed when control passed?', 'Dispatches invoiced within 2 days of control transfer ÷ dispatches whose control passed in the period.', 'Period'],
    ],
    [2000, 2400, 3560, 1400],
  ),
  spacer(160),
  p('Master-data quality is a supporting measure inside Health, not a twelfth headline card of its own. Passed checks ÷ (active customers × 6). Onboarding accounts are excluded.'),
);

children.push(
  h('6. After you open a KPI', HeadingLevel.HEADING_1),
  p('The sheet is replaced by a detail screen. The layout is the same for every KPI, with content swapped.'),
  kvTable([
    ['Header', 'KPI icon and title in that KPI’s accent, the question it answers, a period or Snapshot tag, and the “i” definition.'],
    ['Headline value', 'The same number you saw on the sheet, so the two views reconcile.'],
    ['Three or four stats', 'For Billed Revenue: invoices posted, credit notes, top-5 AR share. For Overdue: invoices past due, disputed inside the total, DSO.'],
    ['Trend chart', 'Where the KPI has a series (revenue by month, health, the rates). “Show as table” is the accessible alternative to the chart.'],
    ['Breakdown', 'A “By:” picker — product line, business unit, region, customer, month, days past due, status, and so on, depending on the KPI. Each row is a bar, a record count, a customer count and a › to drill.'],
    ['Transactions / records', 'Once you have drilled into a group, a compact table of invoices (or orders, receipts, cases). Columns are sortable. “Show 50 more” pages without leaving the view.'],
  ]),
  p('Worked example, matching the screen: click Billed Revenue → you are on “How much did we invoice in the period?” with ₹1,729 Cr. Click › on Formulations → the breadcrumb reads Overview · KPI sheet ▸ Billed Revenue ▸ Formulations, the value becomes ₹408.6 Cr, and the table lists the 217 invoices. Click a customer name or › on a row to go one step further.'),
  p('Rate KPIs (cash, credit, promises, billing, collection) add a grouped record table of the exceptions — the receipts that did not match, the promises that broke, the shipments billed late. Health detail lets you pick a component and then a business unit or segment.'),
);

children.push(
  h('7. Customer profiles', HeadingLevel.HEADING_1),
  p('The second tab. The overview is the customer portfolio. Opening a customer replaces the right-hand page with that Customer Profile; the left list stays so you can jump accounts without going home.'),

  h('Left list', HeadingLevel.HEADING_2),
  kvTable([
    ['Customers 59', 'Active accounts in scope plus onboarding requests. The count includes onboarding; the portfolio stats on the right do not (56 active, 3 onboarding).'],
    ['Find a customer or ID', 'Filters the list as you type.'],
    ['Sort: Risk / AR / Exposure / Name', 'Risk is the default — highest model score first. AR is open receivables. Exposure is open potential cases. Name is alphabetical.'],
    ['Each row', 'Name, approved risk tag and score, customer ID, product line, open AR, and a red “₹ … open” chip when that customer has open potential exposure.'],
    ['Onboarding rows', 'Status reads Onboarding instead of an AR figure (Verde Agro Inputs, Coastline Hospitals new site, Zenith Lifecare Pvt Ltd).'],
  ]),
  p('Click a name to open the profile. The current account has a gold bar on the left of the list.'),

  h('Portfolio (right side, before you pick a customer)', HeadingLevel.HEADING_2),
  kvTable([
    ['Active customers', '56. Subtitle is onboarding excluded from this count.'],
    ['High or Critical', '45 in the current seed, with the C / H / M / L split underneath.'],
    ['Re-review proposed', 'Model category differs from the approved category. Needs a person, not an automatic downgrade.'],
    ['Master-data quality', 'Passed checks over active customers × 6.'],
    ['Possible duplicate records', 'Pairs sharing PAN, GSTIN or bank details. Merges go through MDM; the screen does not merge them.'],
    ['AR against risk', 'Scatter of customers: x is open AR (square-root scale so small accounts remain visible), y is risk score, bubble size is open potential exposure. The red band is High and Critical (60+). Click selects; double-click opens the profile. “Show as table” lists the same points.'],
    ['Customer Risk Mix donut', 'Toggle Customers versus AR — two different denominators, never mixed. Click a segment to select; double-click lists those customers.'],
    ['Where customers break the O2C chain', 'A heat of risk category × stage. Numbers are records with issues. Open Process chain for the full stage view.'],
    ['Master-data checks failing', 'Bars for the six checks, with fail count and pass rate. Drill lists the customers failing that check.'],
    ['Customers with the most issue value', 'Heat of named customers × the six stages. Click a name for the profile; click a cell to open that customer at that stage on the process screen.'],
    ['Re-review table', 'Customer, approved tag, model tag, main driver.'],
    ['Possible duplicate table', 'Record A, Record B, billed over six months. Opening a row goes to one of the pair.'],
    ['Onboarding in progress', 'Requests not yet active. Check result and a Decide button when a named exception exists (O2C-ONB-06).'],
  ]),

  h('Customer Profile', HeadingLevel.HEADING_2),
  p('Opened from the list, from a KPI drill, or from the process heat. The breadcrumb reads Customer portfolio ▸ Customer Profile · <name>. A gold identity chip repeats the ID, product line and risk tag.'),
  kvTable([
    ['Identity line', 'ID, product line, business unit, segment, collector code, status and year since.'],
    ['Tags', 'Approved risk and score, “Model suggests …: re-review” when the model disagrees, Export country if foreign, payment terms, credit limit.'],
    ['Six-month billed / Open orders / Overdue AR', 'Headline stats for this account only.'],
    ['Why this customer surfaced', 'The reasons this account is on a controller’s list — pricing dispute, predicted late window, open cases, overdue, strategic-account notes. If a named exception exists, Decide is here.'],
    ['Risk factors', 'Six weighted factors (payment behaviour 25, overdue concentration 20, credit utilisation 15, disputes 15, bureau 15, promise reliability 10). Score = 60% worst factor + 40% weighted average of assessed factors. Coverage is shown if a factor is N/A.'],
    ['Where in the O2C chain', 'The six stages for this customer: records with issues, value, and the top issue names. Below, a month-by-month issue table.'],
    ['Billed trend', 'Bar chart of invoices Apr–Sep. Rank and share of open AR sit under the chart.'],
    ['Credit, billing and payment', 'Paid on time, overdue AR, credit limit (and any requested increase), terms, predicted payment window, segment.'],
    ['Open items', 'Unpaid invoices by status, open sales orders, unbilled dispatches.'],
    ['Contracts and agreed prices', 'Contract header when loaded; otherwise a plain note that no contract is on file.'],
    ['Due diligence and master data', 'The six checks plus insolvency, GST filings, bank-change call-back, and a duplicate warning when a pair exists.'],
    ['Records and evidence', 'Toggle Invoices / Open orders / Cases. Invoices show ID, date, sales order, value, payment status and issues. › opens the document chain.'],
  ]),
);

children.push(
  h('8. Document chain and case screen', HeadingLevel.HEADING_1),
  p('Two more screens appear after you drill past a customer. They replace the KPI detail in place. The breadcrumb gains Document or Case.'),

  h('Document chain', HeadingLevel.HEADING_2),
  p('Opened from an invoice row, an open sales order, or an unbilled dispatch. The title is Invoice, Sales order, or Unbilled, with customer, entity and site underneath. A Customer button jumps to the profile.'),
  kvTable([
    ['Process chain graphic', 'The six O2C stages for this one record, with dates and the issues sitting on each stage. Missing dates are blank, never invented.'],
    ['Values', 'Invoice value, order value when present, unit price (invoice / order / contract), quantity invoiced versus dispatched, variance estimate, terms and due date, payment status (Paid, Open, Overdue, Blocked, Disputed).'],
    ['Issues on this record', 'Stage name plus issue name. If a named exception is tied to the line, Decide is here. Linked cases are listed as buttons (Case ID, type, estimate or value affected).'],
    ['Evidence', 'Source documents with system of record (ERP FI, TMS, GSTN, bank statement). View requests the document and logs a simulated toast; nothing is posted.'],
  ]),

  h('Case screen', HeadingLevel.HEADING_2),
  p('Opened from Investigate on the exceptions table, from a case row on the Customer Profile, or from a linked case on a document. Header: Case ID, optional exception ID, type name, status pill, primary stage, Financial or Control, and the customer name.'),
  kvTable([
    ['Facts strip', 'Exposure (estimate or value affected), confidence, days open, record count, outstanding, and which headline the case currently counts in (Collections Exposure, Control value, Disputed, Confirmed loss, or Closed).'],
    ['Plain-language summary', 'One sentence that changes with the type — pricing hold, shortage deduction, broken promise, predicted late payment, unapplied cash, unbilled at cut-off, credit-limit breach, duplicate customer, wrong-period invoice, AR-to-GL.'],
    ['Method', 'The calculation written in the catalogue, plus any case note and which stages are touched.'],
    ['What happened', 'A month chart of the disputed or open value when it exists, then a table of the invoices or sales orders in the case. Rows open the document chain.'],
    ['Process chain', 'The chain for the first linked record, so you can see where this event sits.'],
    ['Customer panel', 'Name, ID, product line, risk tag, top three risk factors, billed-by-month, six-month billed, open orders, overdue AR, other cases on the same account.'],
    ['Related exceptions', 'Decide when a named exception exists; other cases for this customer; count of the same type still open across the book.'],
    ['Evidence', 'Deduplicated source documents from the linked records. View is simulated.'],
    ['Investigate', 'If there is no named exception: Assign investigator, Raise dispute, Close: no issue, Mark recovered, Confirm loss (needs a validation basis). If there is a named exception: the case is decided only in the shared drawer so the audit trail stays in one place.'],
  ]),
  p('Confirming a loss without a validation basis is refused. Notes that are still typed are confirmed before you switch KPI. Status changes are written to the decision log under tower O2C.'),
);

children.push(
  h('9. Process chain', HeadingLevel.HEADING_1),
  p('The third tab. It is a picture of where the order-to-cash chain breaks, not a second KPI sheet.'),
  p('Stage questions, as written on the cards:'),
  spacer(80),
  table(
    ['Stage', 'Question on the card', 'Typical issues you will see'],
    [
      ['Order', 'Is the order complete, priced and within policy?', 'Order priced off contract.'],
      ['Credit check', 'Is the customer within limit and terms before we ship?', 'Order held for credit review; exposure above approved limit; possible duplicate customer.'],
      ['Dispatch', 'Did we ship on time, with proof of delivery?', 'Dispatch later than promised; shipped, not invoiced at cut-off.'],
      ['Invoice', 'Is the invoice raised when control passed, at the contract price?', 'Billing later than POD; price does not match contract; invoice in the wrong period.'],
      ['Collection', 'Are overdue balances chased in the right sequence?', 'Invoice past due with no promise; promise broken; invoice disputed.'],
      ['Cash applied', 'Is the receipt matched to the right invoices, once?', 'Unapplied or low-confidence match; short payment / deduction; AR sub-ledger vs GL.'],
    ],
    [1800, 3600, 3960],
  ),
  spacer(160),
  kvTable([
    ['Records with an issue', 'Counted once per stage, so the same invoice can appear in Invoice and Collection.'],
    ['Most value affected', 'The stage with the largest rupee amount on records that have issues (Collection, in the current seed).'],
    ['Open sales orders', 'Orders not yet invoiced, with how many are held for credit.'],
    ['Open overdue', 'Overdue invoices at the snapshot, with the snapshot label.'],
    ['The O2C chain cards', 'One card per stage: records with issues, rupees affected, and the top issue. Click selects the stage and focuses the issue list; › or double-click drills in.'],
    ['Issues across the chain', 'Every issue type ranked by value affected. Subtitle is stage · amount · financial / control / process. › drills to that issue.'],
    ['Fixes in the pipeline', 'Improvement opportunities mapped to the stage they fix, with owner, status, effort and illustrative annual benefit (or n.q. when not quantified).'],
    ['Which customers break which stage', 'Heat of the top customers by value affected. Columns are the six stages. Click a name for the Customer Profile; click a cell to open that customer at that stage.'],
  ]),
  p('After you drill a stage, the detail shows volume through the stage, records with issues as a share of volume, median cycle time when it exists, value affected, and the customers behind it. The record table distinguishes invoices, open sales orders and unbilled dispatches.'),
);

children.push(
  h('10. The decision drawer and named exceptions', HeadingLevel.HEADING_1),
  p('Decide never invents a second workflow. It opens the same exception drawer used on Controller home, P2P and the other towers, themed to the case. Example: O2C-ONB-06 “New customer may duplicate an existing account”.'),
  kvTable([
    ['Header chips', 'Tower (O2C), severity, priority, exception ID, business unit, status (Open).'],
    ['Title and subtitle', 'What happened, in one sentence, with the two customer names or documents involved.'],
    ['Facts strip', 'The three numbers that matter for this type — duplicate score, due working day, owner.'],
    ['What happened', 'The narrative: which records, which amounts, why a second account would matter (for example doubling the credit line).'],
    ['Evidence', 'Side-by-side source fields (name, PAN, GSTIN, limit) with differences highlighted.'],
    ['AI recommendation', 'A proposed action and a confidence. This is a recommendation, not a posting.'],
    ['Related', 'Links into the matching O2C screen (Customer profiles, Overdue Receivables, …).'],
    ['Activity', 'The audit trail of earlier actions on this exception.'],
  ]),
  p('Buttons along the bottom, left to right:'),
  bullet('Take recommendation — accept the AI proposal. The demo logs the decision and applies the configured outcome (merge, hold orders, create a task).'),
  bullet('Hold — park the decision with a reason. The exception stays open.'),
  bullet('Override — pick a different option. Overrides are logged and, in the story of the product, used to retrain the model.'),
  bullet('Assign — hand to another named person, with a note. A Teams notification is simulated.'),
  bullet('Nudge — remind the current owner.'),
  bullet('Escalate — send to Group CFO, Compliance, Internal Audit or the entity head, opening an escalation case.'),
  p('Closing the drawer (X or Esc) returns you to the screen you were on. Filters and breadcrumb are unchanged.'),

  h('Named exceptions you will see on Decide', HeadingLevel.HEADING_2),
  p('These IDs appear on Customer Profile, document, case and the exceptions table when a universe story is attached. Decide opens this drawer; Investigate without an ID stays on the case screen.'),
  spacer(80),
  table(
    ['ID', 'Story on screen', 'Opens'],
    [
      ['O2C-STR-09', 'Meridian Health Systems pricing dispute (strategic hospital; dunning paused).', 'Overdue Receivables'],
      ['O2C-CRL-07', 'Medilink Distributors credit-limit increase request (12 Cr approved, 18 Cr requested).', 'Customer profiles'],
      ['O2C-PTP-08', 'Corvia Healthcare broken promise to pay.', 'Overdue Receivables'],
      ['O2C-DED-10', 'NutriBlend Foods shortage deduction.', 'Collections Exposure'],
      ['O2C-CSH-11', 'Unapplied cash on Medilink.', 'Cash Application Match'],
      ['O2C-ONB-06', 'Zenith Lifecare onboarding may duplicate C-40118 (PAN and GSTIN).', 'Customer profiles'],
      ['O2C-CRD-05', 'Helvetia Pharma over the approved export credit limit.', 'Customer profiles'],
      ['O2C-BILL-04', 'Unbilled at cut-off where control had passed by 30-Sep.', 'On-Time Billing'],
      ['O2C-WPI-12', 'Invoice in the wrong period (also on R2R).', 'On-Time Billing'],
      ['O2C-ARGL-13', 'AR sub-ledger versus GL (also on R2R).', 'Open Receivables'],
      ['O2C-DSO-01', 'Group DSO / overdue concentration on Home.', 'Overdue Receivables'],
      ['O2C-CASH-03', 'Cash application backlog on Home.', 'Cash Application Match'],
      ['O2C-DED-02', 'Group shortage / deduction theme on Home.', 'Collections Exposure'],
    ],
    [1800, 5160, 2400],
  ),

);

children.push(
  h('11. How to read the numbers honestly', HeadingLevel.HEADING_1),
  p('These rules are on purpose, and they explain several things that look like “missing” numbers.'),
  bullet('N/A, never a fake zero. If there were no eligible records, the cell says N/A. Coverage on Health tells you when a component was dropped.'),
  bullet('Period and snapshot stay apart. Billed revenue and the five rates move with Period. AR, overdue, exposure and risk mix are the 05-Oct-2026 09:10 snapshot. The Headline KPIs subtitle says this in one sentence.'),
  bullet('Potential exposure, disputed amounts and confirmed loss are three columns, never one total. Control cases show “value affected” and sit beside exposure.'),
  bullet('One estimate per case. A pricing dispute on nine invoices is still one case.'),
  bullet('Unapplied cash is not overdue and is not negative AR. It is shown next to Open Receivables until a person matches it.'),
  bullet('Unbilled at cut-off is not billed revenue and not AR. It lives on Dispatch / On-time billing / Collections Exposure (cut-off type).'),
  bullet('Onboarding customers are not active. They appear on Customer profiles for duplicate and compliance checks, and they are excluded from Health, risk mix and master-data quality.'),
  bullet('Customer segment is not risk. Strategic / Distributor / Export / Transactional is how the account is sold and collected. Low / Medium / High / Critical is a separate score. Key account is stored on some profiles but counted as Strategic on the Health chips.'),
  bullet('Duplicate records are not merged on screen. MDM has to take the decision in the drawer.'),
  bullet('Nothing on screen changes unless you act. There is no live poll and no silent refresh.'),
  bullet('Every number is labelled illustrative. The ageing anchors (₹1,102 / 238 / 96 / 54.2 / 46.8 Cr) are the universe the demo is built to hit; other computed figures (DSO, monthly billed) come from the same ledger and will not always match a one-line target in an older briefing note.'),
  spacer(200),
  p([r('Where to go next. ', { bold: true }), r('Start on Control tower, read Health and the four headline cards, then click the rate that is off target. Use Customer profiles when the question is “who?”, and Process chain when the question is “where in the chain?”. Take decisions in the drawer so they become evidence.')]),
  spacer(280),
  new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 10 } },
    spacing: { before: 200, after: 80 },
    children: [r('FCT Finance Control Tower  ·  Order to cash screen guide  ·  21 October 2026', { size: 18, color: MUTED })],
  }),
  note('Demonstration prototype. All data, entities, people and system connections are simulated for the Jubilant (demo) working session.'),
);

const doc = new Document({
  styles: {
    default: {
      document: { styles: [{ id: 'Normal', run: { font: 'Calibri', size: 22, color: INK } }] },
    },
  },
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 180 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 6 } },
          spacing: { after: 80 },
          children: [
            r('FCT  ·  Order to Cash', { size: 16, bold: true, color: TEAL }),
            r('     Screen guide     ', { size: 16, color: MUTED }),
            r('Illustrative demo', { size: 16, color: MUTED, italics: true }),
          ],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 6 } },
          spacing: { before: 80 },
          children: [
            r('Jubilant (demo)  ·  Sep-26 / 05-Oct-2026 09:10  ·  ', { size: 16, color: MUTED }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: MUTED }),
          ],
        })],
      }),
    },
    children,
  }],
});

const out = path.join(__dirname, '../../docs/O2C-screen-guide.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(out, buf);
  console.log('Wrote', out, buf.length, 'bytes');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
