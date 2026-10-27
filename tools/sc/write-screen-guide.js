/* Build docs/SC-screen-guide.docx — walkthrough of every visible Supply chain control (same layout as the O2C guide). */
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
  new Paragraph({ spacing: { before: 480, after: 120 }, children: [new TextRun({ text: 'Supply Chain', font: 'Calibri', size: 56, bold: true, color: TEAL })] }),
  new Paragraph({ spacing: { after: 280 }, children: [new TextRun({ text: 'Screen guide', font: 'Calibri', size: 40, color: BRASS })] }),
  p('What every control, number and action on the Supply chain tower means. It is written against the three screens as they now appear, not the old nine-page layout.'),
  spacer(80),
  kvTable([
    ['Who this is for', 'Controllers, plant controllers, supply chain, procurement and stores teams using the demo'],
    ['Demo persona', 'Priya Raman, Group Financial Controller'],
    ['Period on screen', 'Sep-26 flows (Q2 FY27)'],
    ['Book date / snapshot', 'Stock at 30-Sep-2026; snapshot clock 05-Oct-2026 09:10 (working day +2 of the Sep close)'],
    ['Currency', 'INR, shown as ₹ Cr, or ₹ L when the amount is under ₹1 Cr'],
    ['Data', 'Illustrative. Entities, people and system links are simulated.'],
  ]),
  new Paragraph({ children: [new PageBreak()] }),
);

children.push(
  h('Contents', HeadingLevel.HEADING_1),
  p('This guide follows the screen from top to bottom, then explains what happens after you click.'),
  bullet('1. What you are looking at'),
  bullet('2. The frame around every SC page'),
  bullet('3. How clicking works'),
  bullet('4. Control tower: the KPI sheet (including ABC × XYZ chips)'),
  bullet('5. What each KPI is measuring'),
  bullet('6. After you open a KPI'),
  bullet('7. Material profiles'),
  bullet('8. Document chain and case screen'),
  bullet('9. Process chain and root causes'),
  bullet('10. The decision drawer and named exceptions'),
  bullet('11. How to read the numbers honestly'),
  bullet('12. A five-minute demo script'),
);

children.push(
  h('1. What you are looking at', HeadingLevel.HEADING_1),
  p('Supply chain answers one controller question: is inventory stated right, and is cash tied up? The tower is three screens, not nine. Everything that used to live on demand, valuation, cost, integrity, receipts, suppliers, working capital and root causes is now a view on one of these three.'),
  spacer(80),
  table(['Screen', 'Tab label', 'What it is for'], [
    ['Control tower', 'Control tower', 'The KPI sheet. This is the default. Every number you need for the inventory close is here; click anything to go deeper.'],
    ['Material profiles', 'Material profiles', 'Which materials at which plants hold the stock, how risky they are, which suppliers they depend on, and the full Material Profile.'],
    ['Process chain', 'Process chain', 'Where Forecast → Plan → Procure → Receive → Produce → Ship breaks, which materials cause it, and the root causes being fixed.'],
  ], [2200, 2400, 4760]),
  spacer(160),
  p('Where the old pages went:'),
  table(['Old page', 'Now lives in'], [
    ['Desk', 'Control tower (KPI sheet)'],
    ['Valuation & provisions', 'Inventory Value (provision beside it) and Valuation Review Completeness'],
    ['Cost & variances', 'Process chain, Produce stage (yield, cost and absorption cases)'],
    ['Inventory integrity', 'Inventory Record Accuracy, plus count, adjustment, job-work and 3PL cases'],
    ['Working capital', 'Excess Stock, DIO and turns on the Inventory Value card'],
    ['Receipts & liabilities', 'Receipts Not Booked and Receipt Timeliness'],
    ['Supplier risk', 'Material profiles: supplier dependence table and the supplier on each profile'],
    ['Demand & forecast', 'Forecast Accuracy (with bias) and the Forecast stage'],
    ['Root causes & AI', 'Process chain: "Root causes being fixed"'],
  ], [3200, 6160]),
  spacer(120),
  p('The old addresses (demand.html, valuation.html and the rest) no longer exist. Deep links use the address-bar hash on the three remaining screens, for example desk.html#kpi=rnb.'),
  p([r('The main entity is a '), r('material at a plant', { bold: true }), r(' (for example KSM-17 at IN-02 Plant A). The same material at two plants is two rows. The supplier is a dimension on the material, not a screen of its own.')]),
);

children.push(
  h('2. The frame around every SC page', HeadingLevel.HEADING_1),
  p('The three screens share one frame, identical to P2P and O2C. Learn it once.'),
  h('Left rail', HeadingLevel.HEADING_2),
  kvTable([
    ['« / » at the top', 'Collapses the rail to tower codes or expands the full names. The choice is remembered.'],
    ['PR avatar', 'The signed-in persona: Priya Raman, Group Financial Controller.'],
    ['Supply chain sub-links', 'SC control tower, Material profiles, Process chain. The badge on Control tower is the open exception count.'],
  ]),
  h('Command ribbon', HeadingLevel.HEADING_2),
  kvTable([
    ['☰ menu', 'Hide or show tower names in the rail.'],
    ['Control tower / Material profiles / Process chain', 'The three SC tabs. The current tab has a gold underline. Switching tabs keeps your filters.'],
    ['Period', 'The month or quarter for flow KPIs (forecast accuracy, record accuracy, receipt timeliness, OTIF). Default Sep-26. Snapshot KPIs stay on the 30-Sep book.'],
    ['Entity', 'Legal entity: IN-02 API Manufacturing to IN-08 Distribution, plus US-01 and EU-01.'],
    ['Plant', 'IN-02 Plant A and B, IN-03 to IN-06 plants, IN-08 Central DC, US-01 3PL, EU-01 3PL, Job-workers.'],
    ['Category', 'Raw material, Packing material, Work in progress, Finished goods, Stores and spares, Goods in transit (booked).'],
    ['Risk', 'Approved inventory-risk category: Critical, High, Medium, Low.'],
    ['Search material', 'Two or more letters of a code, name or plant. Choosing one pins that material-plant through every drill.'],
    ['Sun / moon', 'Light or dark theme. Dark is the default.'],
  ]),
  note('An active filter turns amber. Filters persist when you drill and never drop the material you have open.'),
  h('Breadcrumb', HeadingLevel.HEADING_2),
  kvTable([
    ['← back arrow', 'Steps up one level. Disabled on the overview.'],
    ['Each chevron', 'An icon, a level name (Overview, KPI, Plant, Type, Material, Document, Case) and a bold label.'],
    ['Filled current step', 'Coloured with the KPI accent: teal for health, blue for inventory, violet for excess and receipts, amber for exposure and materials, green for control rates.'],
    ['Earlier steps', 'Clickable. Each restores that view and its selection.'],
    ['URL hash', 'The path is written into the address bar, so a reload or a pasted link reopens the same view.'],
  ]),
);

children.push(
  h('3. How clicking works', HeadingLevel.HEADING_1),
  p('The same grammar is used on every card, bar, row and heat cell. Every action also works from the keyboard.'),
  spacer(80),
  table(['What you do', 'What happens'], [
    ['Click a KPI card, slice, tile or row on the sheet', 'The sheet is replaced, in place, by that KPI’s detail. The breadcrumb gains a step and the item you clicked is pre-selected.'],
    ['Single-click a bar or row inside a detail', 'Selects it and shows its numbers locally, without navigating.'],
    ['Double-click, press Enter, or click ›', 'Drills one level and adds a breadcrumb step.'],
    ['Click anywhere on a case or record row', 'Opens that record. The whole row is the target.'],
    ['Click a breadcrumb step', 'Returns to that level with its selection restored.'],
    ['Change a filter', 'Recomputes every number on the current view. The path stays.'],
    ['Decide', 'Opens the shared decision drawer for the named exception behind the case.'],
  ], [4200, 5160]),
  spacer(120),
  p('Typical path: KPI sheet → Receipts Not Booked → In transit, title passed → IN-02 Plant A → shipment BL-MSCU-77120 → evidence.'),
);

children.push(
  h('4. Control tower: the KPI sheet', HeadingLevel.HEADING_1),
  p('The default SC screen: one board in five sections. Numbers quoted here are the unfiltered Sep-26 / 30-Sep demo, before any decision is taken, so you can match them to the screen.'),
  note('Board footer: “Flows: Sep-26. Balances at book date 30-Sep-2026, as at 05-Oct-2026 09:10. Illustrative data.”'),
  h('Section: Headline KPIs', HeadingLevel.HEADING_2),
  h('SC Health Score card', HeadingLevel.HEADING_3),
  kvTable([
    ['Ring (53 / 100)', 'The score. 75+ Healthy, 50–74 Watch, below 50 At risk. 53 is Watch.'],
    ['▼ 15.0 pts', 'Change versus Aug-26.'],
    ['Coverage 100%', 'Share of the six components with data. Valuation review and master data have no history before this snapshot, so earlier months show 70% coverage.'],
    ['Points lost 47', '100 minus the score.'],
    ['Apr–Sep trend', 'Sparkline of the score: 84, 78, 81, 75, 68, 53.'],
    ['Plain-language note', 'Built from the card, e.g. “Receipt timeliness is pulling it down the most.”'],
    ['ABC and XYZ chips', 'The tower’s own segmentation. Explained below.'],
  ]),
  spacer(80),
  table(['Tile', 'Weight', 'Floor → target', 'Sep-26', 'What the note tells you'], [
    ['Forecast accuracy', '20', '65 → 90', '79.1%', '1 − WMAPE. The note adds bias (+9.6%: over-forecast) and how many material-months were more than 20% out.'],
    ['Record accuracy', '20', '94 → 99.5', '97.2%', 'Cycle counts within 0.5% tolerance. Names the plant with most variances.'],
    ['Receipt timeliness', '15', '60 → 95', '71.0%', 'Goods receipts within 48 hours of the gate. The 142 receipts still without a GR count as late.'],
    ['Valuation review', '15', '70 → 98', '80.0%', 'Lots in provision scope (over 180 days, expiring within 180 days, or NRV test) with a current review.'],
    ['Supplier OTIF', '15', '80 → 95', '87.7%', 'PO lines on the confirmed date and in full. Names the weakest supplier (Kaveri Intermediates).'],
    ['Master data', '15', '85 → 99', '96.5%', 'Six checks per material-plant: standard cost, reorder point, safety stock, shelf life, unit of measure, valuation class.'],
  ], [1700, 800, 1300, 900, 4660]),

  h('ABC × XYZ chips', HeadingLevel.HEADING_3),
  p('Two chip groups sit on the Health card. Pick one from each, or just one. Only the six component tiles re-scope; each tile then compares that slice with all materials. The score itself stays whole.'),
  spacer(80),
  table(['Chip', 'Count', 'Meaning'], [
    ['All', '91', 'Active material-plants in the current filters.'],
    ['A', '52', 'Top 80% of inventory value (cumulative).'],
    ['B', '24', 'Next 15% of value.'],
    ['C', '15', 'Last 5% of value.'],
    ['X', '39', 'Steady consumption: variability (CoV) under 0.25.'],
    ['Y', '35', 'Variable: CoV 0.25–0.5.'],
    ['Z', '17', 'Erratic: CoV 0.5 and above.'],
  ], [1400, 1200, 6760]),
  spacer(120),
  p('Class is not risk. ABC/XYZ describes size and variability; the Critical / High / Medium / Low tag is a separate inventory-risk score on each material. A class-C material can still be Critical (CAT-PDC, the sole-source Pd/C catalyst).'),

  h('Inventory Value card', HeadingLevel.HEADING_3),
  kvTable([
    ['Value', '₹642.0 Cr: stock lots at standard cost at the 30-Sep book date. Snapshot.'],
    ['Ageing bar', '0–90 days ₹498.3 Cr, 91–180 ₹74.6 Cr, 181–365 ₹47.3 Cr, over 365 ₹21.8 Cr.'],
    ['Note', 'How much is over 180 days old, plus DIO 42.7 days and 8.5 turns a year.'],
    ['Largest plants', 'Top four plants with value, share and the aged slice.'],
    ['Footer', 'Provision ₹14.8 Cr (beside, not netted), DIO, turns.'],
  ]),
  h('Excess Stock card', HeadingLevel.HEADING_3),
  kvTable([
    ['Value', '₹38.5 Cr above the policy maximum days of cover. IN-02 Plant A ₹21.2 Cr, IN-03 ₹9.8 Cr, others ₹7.5 Cr.'],
    ['Note', 'Calls out the ₹12.0 Cr approved strategic buy of KSM-04 (inside the total, labelled) and how many materials are below minimum cover.'],
    ['Most excess', 'Material, excess, current cover and the policy maximum.'],
    ['Footer', 'Strategic buy, slow-moving on watch (₹6.8 Cr, contingent) and stock over 365 days.'],
  ]),
  h('Receipts Not Booked card', HeadingLevel.HEADING_3),
  kvTable([
    ['Value', '₹19.0 Cr of goods we own but have not booked.'],
    ['Split', '₹12.6 Cr in transit where title passed at loading (19 shipments, FOB, CFR, CIF) + ₹6.4 Cr at the gate with no goods receipt (142 receipts).'],
    ['Note', '₹4.9 Cr of supplier invoices are blocked only because the GR is missing.'],
    ['Footer', 'In transit, at the gate, and ₹2.1 Cr of DAP/DDP shipments excluded because the seller still holds title.'],
  ]),
  h('Material Exposure card', HeadingLevel.HEADING_3),
  p('Not a provision and not a write-off. It is the sum of the one estimate on each open financial case.'),
  kvTable([
    ['Value', '₹85.79 Cr across 25 open financial cases.'],
    ['Source bars', 'Largest types: supplier risk, in transit not booked, forecast drift.'],
    ['Footer', 'Contingent ₹28.93 Cr (revenue at risk, slow-moving on watch), control value, confirmed loss. None of these are added to the headline.'],
  ]),
  h('Section: Inventory KPIs', HeadingLevel.HEADING_2),
  kvTable([
    ['Inventory by category', 'Donut by Raw material ₹236.5 Cr, Finished goods ₹198.6 Cr, Work in progress ₹121.4 Cr, Stores and spares ₹33.8 Cr, Packing ₹28.9 Cr, booked Goods in transit ₹22.8 Cr. Click a slice to open Inventory Value on that category.'],
    ['Top Materials by Value', 'Ranked material-plants; the dot is the approved risk category. Subtitle shows top-5 and top-10 concentration.'],
  ]),
  h('Section: Material and Exposure KPIs', HeadingLevel.HEADING_2),
  kvTable([
    ['Material risk and master data', 'Stacked bar of active material-plants by risk (3 Critical, 18 High, 16 Medium, 54 Low). Tiles: high-risk count, re-reviews, master-data quality, materials below minimum cover.'],
    ['Material exposure by type', 'Every open estimate by case type. Click a type to open Material Exposure on it.'],
  ]),
  h('Section: Control KPIs', HeadingLevel.HEADING_2),
  p('Five rate cards: Forecast accuracy, Record accuracy, Receipt timeliness, Valuation review, Supplier OTIF. Each card shows the rate, a status pill, a bar with the target marker, change versus prior period, a sparkline and a three-figure footer. Forecast accuracy shows bias in its footer.'),
  h('Section: Exceptions', HeadingLevel.HEADING_2),
  kvTable([
    ['Priority', 'From the amount. Financial and control cases use different thresholds.'],
    ['Type', 'Case type and exception ID, with “value affected”, “contingent” or “not quantified” when there is no estimate.'],
    ['Material', 'Material name and plant.'],
    ['Amount', 'Estimate for financial cases; value affected for control cases; N/A when not quantified.'],
    ['Decide', 'Every SC case is tied to a named exception, so Decide always opens the shared drawer.'],
  ]),
);

children.push(
  h('5. What each KPI is measuring', HeadingLevel.HEADING_1),
  p('The “?” on a KPI detail header repeats this: formula, denominator, exclusions, owner, refresh and drill path.'),
  spacer(80),
  table(['KPI', 'Question it answers', 'How it is calculated', 'Basis'], [
    ['SC Health Score', 'Are SC controls keeping inventory stated right?', 'Weighted normalised scores of six components; missing ones reduce coverage.', 'Period'],
    ['Inventory Value', 'What inventory do we carry, and how old is it?', 'Σ stock lots at standard cost. Provision beside.', 'Snapshot'],
    ['Excess Stock', 'How much cash is tied up above policy?', 'Σ value above policy maximum days of cover.', 'Snapshot'],
    ['Receipts Not Booked', 'What do we own that is not in the books?', 'Title-passed shipments without a GIT entry + gate receipts without a GR.', 'Snapshot'],
    ['Material Exposure', 'What value needs a decision?', 'Σ one estimate (confirmed + estimated) per open financial case.', 'Snapshot'],
    ['Material Risk Mix', 'How are material-plants spread by risk?', 'Count by approved category; inventory-value share is a toggle.', 'Snapshot'],
    ['Top Materials by Value', 'Which material-plants hold most stock?', 'Value by material-plant, ranked; share of Inventory Value.', 'Snapshot'],
    ['Forecast Accuracy', 'How close was forecast to demand?', '1 − Σ|F − A| ÷ ΣA, value-weighted. Bias = (ΣF − ΣA) ÷ ΣA.', 'Period'],
    ['Inventory Record Accuracy', 'Do books match the physical count?', 'Counts within 0.5% ÷ counts.', 'Period'],
    ['Receipt Timeliness', 'Is stock booked within 48 hours?', 'GRs within 48 h of gate entry ÷ gate entries (including those still without a GR).', 'Period'],
    ['Valuation Review Completeness', 'Has every lot needing a provision or NRV test been reviewed?', 'Reviewed lots in scope ÷ lots in scope.', 'Snapshot'],
    ['Supplier OTIF', 'Do suppliers deliver on time, in full?', 'PO lines on the confirmed date and quantity ÷ lines due.', 'Period'],
  ], [2100, 2500, 3460, 1300]),
  spacer(120),
  p('Master-data quality is a supporting measure inside Health: passed checks ÷ (active material-plants × 6). DIO and turns come from the finance metric store and are group-level.'),
);

children.push(
  h('6. After you open a KPI', HeadingLevel.HEADING_1),
  kvTable([
    ['Header', 'KPI icon and title in its accent, the question, a period or Snapshot tag, and the definition popover.'],
    ['Headline value', 'The same number as the sheet, so the two reconcile.'],
    ['Stats', 'For Receipts Not Booked: in transit, at the gate, invoices blocked, DAP/DDP excluded. For Inventory Value: lots, provision, over 180 days, DIO and turns.'],
    ['Trend', 'Monthly series where one exists. Snapshot-only measures say there is no history.'],
    ['Breakdown', 'A “By:” picker: category, ageing, plant, ABC class, material, supplier, type, reason and so on.'],
    ['Records', 'Grouped tables of the records behind the view: stock lots, PO lines, goods receipts, gate entries, shipments, counts, batches, dispatches or cases.'],
  ]),
  p('Worked example: click Receipts Not Booked (₹19.00 Cr). Click › on “In transit, title passed”, then › on IN-02 Plant A, then double-click BL-MSCU-77120. The breadcrumb reads KPI sheet ▸ Receipts Not Booked ▸ In transit, title passed ▸ IN-02 Plant A ▸ Shipment BL-MSCU-77120.'),
);

children.push(
  h('7. Material profiles', HeadingLevel.HEADING_1),
  h('Left list', HeadingLevel.HEADING_2),
  kvTable([
    ['Materials 91', 'Active material-plants in scope.'],
    ['Find a material, code or plant', 'Filters the list as you type.'],
    ['Sort: Risk / Stock / Exposure / Code', 'Risk is the default, highest score first.'],
    ['Each row', 'Code and name, risk tag and score, plant, ABC/XYZ class, stock value, and a red “₹ … open” chip when there is open exposure.'],
  ]),
  h('Portfolio', HeadingLevel.HEADING_2),
  kvTable([
    ['Stats', 'Active material-plants and stock, High or Critical, re-reviews, below minimum cover and sole-source count, master-data quality.'],
    ['Stock against risk', 'Scatter: x is stock value (square-root scale), y is risk score, bubble is open exposure. The red band is High and Critical.'],
    ['Material Risk Mix', 'Donut with a Materials / Value toggle (different denominators).'],
    ['ABC × XYZ', 'Heat matrix of count and value. Click a cell to list those materials.'],
    ['Where materials break the chain', 'Risk category × stage heat.'],
    ['Supplier dependence', 'Suppliers behind the materials in scope, weakest first: risk score, OTIF, materials (with sole-source count), stock dependent, distress signal. Click a row to list its materials. Kaveri Intermediates (insolvency petition, sole source of KSM-17) and Polychem Catalysts (sole source of Pd/C, OTIF 76%) sit at the top.'],
    ['Master-data checks failing', 'Bars for the six checks; drill lists the materials.'],
    ['Re-review proposed', 'Approved versus model category, with the main driver.'],
    ['Materials with the most issue value', 'Material × stage heat.'],
  ]),
  h('Material Profile', HeadingLevel.HEADING_2),
  kvTable([
    ['Identity line', 'Plant, entity, category, supplier and status. Tags: risk, class, sole source, policy cover band.'],
    ['Stock / Cover / Excess', 'Headline stats for this material-plant.'],
    ['Why this material surfaced', 'Drivers (e.g. “Sole source in insolvency; 21 days of cover plus 4 in transit”), cover against policy, open cases, supplier signals, notes. Named exceptions with Decide.'],
    ['Inventory risk factors', 'Cover against policy 25, ageing and expiry 20, supply risk 20, record accuracy 15, valuation 10, forecast error 10. Score = 60% worst factor + 40% weighted average. A factor without data (no forecast) shows N/A and lowers coverage.'],
    ['Where in the supply chain', 'Six stages with records, value and top issues, then a month-by-month issue table.'],
    ['Consumption trend', 'Six months of consumption, with CoV and class.'],
    ['Supply and demand', 'Supplier, supplier OTIF, forecast accuracy and bias, record accuracy, supplier signal.'],
    ['Stock by age', 'Four age bands, and how many lots in provision scope are not reviewed.'],
    ['Planning and master data', 'The six checks plus cover against policy.'],
    ['Records and evidence', 'Toggle Lots / Receipts and POs / Counts and batches / Forecast / Dispatches / Cases.'],
  ]),
);

children.push(
  h('8. Document chain and case screen', HeadingLevel.HEADING_1),
  h('Document chain', HeadingLevel.HEADING_2),
  p('Opened from any record row: a lot, PO line, goods receipt, gate entry, shipment, count, batch, dispatch or forecast month.'),
  kvTable([
    ['Chain graphic', 'The record’s place across Forecast, Plan, Procure, Receive, Produce and Ship, with the material’s context at the other stages (forecast for the month, cover against policy). Missing steps show N/A.'],
    ['Values', 'Specific to the record kind: e.g. a shipment shows supplier, Incoterm, bill-of-lading date, ETA and treatment (Recognise: title passed / Exclude: seller holds title).'],
    ['Issues on this record', 'Stage and issue name, plus linked cases.'],
    ['Evidence', 'Source documents (bill of lading, gate entry, weighbridge slip, count sheet, batch record). View is simulated.'],
  ]),
  h('Case screen', HeadingLevel.HEADING_2),
  kvTable([
    ['Facts strip', 'Exposure (estimate, or value affected for control cases), contingent, confidence, days open, records, and which measure it counts in.'],
    ['Summary and method', 'The exception title and what happened, the method from the case-type catalogue, and the parts (confirmed / estimated / contingent).'],
    ['What happened', 'The exception’s evidence table, a month chart, and the linked records.'],
    ['Material panel', 'Identity, risk, top factors, stock, cover, excess, other cases.'],
    ['Related exceptions and evidence', 'Other cases on the material and the count of the same type still open.'],
    ['Decide', 'All SC cases are decided only in the shared drawer, so the audit trail stays in one place. The case status follows that decision.'],
  ]),
);

children.push(
  h('9. Process chain and root causes', HeadingLevel.HEADING_1),
  spacer(60),
  table(['Stage', 'Question on the card', 'Typical issues'], [
    ['Forecast', 'Is demand forecast without bias, and is the plan re-baselined when it drifts?', 'Over- or under-forecast by more than 20%.'],
    ['Plan', 'Is stock held inside policy cover, with ageing and expiry under control?', 'Stock above policy maximum; cover below minimum; slow-moving; expiring; planning master data out of date.'],
    ['Procure', 'Do suppliers deliver on time, in full, at the contract price?', 'Delivered late or short; invoice price differs from contract.'],
    ['Receive', 'Is everything we own on the books, with a goods receipt within 48 hours?', 'GR after 48 hours; at the gate with no GR; owned in transit, not booked.'],
    ['Produce', 'Are yields, costs and counts right where stock is made and held?', 'Abnormal yield loss; count variance above tolerance.'],
    ['Ship', 'Does stock leave at the right time and carry no more than it will sell for?', 'Removed from stock before delivery; 3PL stock differs; carried above NRV.'],
  ], [1500, 4100, 3760]),
  spacer(120),
  kvTable([
    ['Records with an issue', 'Counted once per stage.'],
    ['Most value affected', 'The stage with the largest value on records with issues.'],
    ['Receipts not booked / Outside policy cover', 'Snapshot reminders: what is not on the books, and how many material-plants are above maximum or below minimum cover.'],
    ['The supply chain cards', 'One per stage: records with issues, value affected, top issue. Click selects; › drills.'],
    ['Issues across the chain', 'Every issue type ranked by value.'],
    ['Root causes being fixed', 'RC-01 delayed GR at 3 plants (Receive), RC-09 renewed contract prices not loaded (Procure), RC-10 adjustment authority too broad and RC-11 manual job-work challans (Produce), RC-12 sole-sourced KSMs (Procure), RC-08 stale reorder parameters (Plan). Each fix removes a class of issues, not one case.'],
    ['Which materials break which stage', 'Heat of the top material-plants by value affected.'],
  ]),
);

children.push(
  h('10. The decision drawer and named exceptions', HeadingLevel.HEADING_1),
  p('Decide opens the same exception drawer used on Controller home and every other tower. Take, Hold, Override, Assign, Nudge and Escalate behave exactly as they do elsewhere; Take asks you to confirm.'),
  p('Example: SC-GIT-06 “19 inbound shipments owned at 30-Sep not recorded”. Take recommendation → Confirm books ₹12.6 Cr of goods in transit. Receipts Not Booked falls from ₹19.0 Cr to ₹6.4 Cr, Inventory Value rises to ₹654.6 Cr, and Material Exposure falls from ₹85.79 Cr to ₹73.19 Cr.'),
  spacer(80),
  table(['ID', 'Story on screen', 'Material'], [
    ['SC-SUP-02', 'Sole-source KSM supplier (Kaveri) insolvency petition: advance, open POs; revenue at risk kept contingent.', 'KSM-17 · IN-02 Plant A'],
    ['SC-GIT-06', '19 shipments owned at 30-Sep not recorded (₹12.6 Cr).', 'KSM-17 · IN-02 Plant A'],
    ['SC-GRL-10', '142 receipts at the gate without a GR (₹6.4 Cr).', 'KSM-17 · IN-02 Plant A'],
    ['SC-INV-01', 'Near-expiry and slow-moving provision ₹2.90 Cr.', 'CAT-14 · IN-05'],
    ['SC-NRV-03', '14 finished-goods SKUs above NRV (₹3.4 Cr).', 'FG-US-4471 · US-01 3PL'],
    ['SC-CNT-04', 'Cycle-count shortage; catalysts 14% short; custodian counted own stock.', 'CAT-PDC · IN-05'],
    ['SC-ADJ-12', '23 write-offs split under the ₹5 L limit (control).', 'TR-DIS-01 · IN-08'],
    ['SC-JWK-05', 'Stock at job-workers not confirmed (₹8.2 Cr).', 'JW-DEC-01 · Job-workers'],
    ['SC-VAR-13', 'Abnormal yield loss in closing stock (₹2.1 Cr).', 'API-L71 · IN-02 Plant A'],
    ['SC-EXC-11', 'Stock above policy maximum (₹38.5 Cr, control).', 'KSM-04 · IN-02 Plant A'],
    ['SC-PPV-07', 'Invoice prices differ from contracts (₹7.0 Cr).', 'Toluene · IN-02 Plant A'],
    ['SC-DPS-14', 'Bank stock statement overstates eligible stock (₹23.5 Cr, control).', 'FG-IN-2210 · IN-03'],
    ['SC-FCB-15 / 16 / 17', 'Forecast drift: US generics +43%, API exports −14%, specialty chemicals +19%.', 'FG-US-4471, API-V12, SC-ACX-11'],
  ], [1800, 5160, 2400]),
  spacer(80),
  note('All 40 named SC exceptions have exactly one case each. The table above lists the ones most used in a demo.'),
);

children.push(
  h('11. How to read the numbers honestly', HeadingLevel.HEADING_1),
  bullet('N/A, never a fake zero. Unquantified cases show N/A or “not quantified”; a material with no forecast has N/A on that risk factor and lower coverage.'),
  bullet('Period and snapshot stay apart. Forecast, counts, receipts and OTIF move with Period; inventory, excess, receipts not booked and exposure are the 30-Sep book.'),
  bullet('One estimate per case. Kaveri is one case with ₹12.0 Cr (advance plus open POs); the ₹14.1 Cr revenue at risk is contingent and sits beside it.'),
  bullet('Material Exposure, contingent amounts, disputed, confirmed loss and control value are separate columns, never one total.'),
  bullet('Excess is cash tied up, not a loss. It is a control case with value affected.'),
  bullet('Provision is shown beside Inventory Value, never netted inside it.'),
  bullet('Class is not risk. ABC/XYZ is size and variability; risk is a separate score.'),
  bullet('Goods owned but not booked are not inventory until a decision books them. Then both numbers move together.'),
  bullet('Nothing changes unless you act. Every number is illustrative.'),
  bullet('Material Exposure (₹85.79 Cr) replaces the old desk’s ₹88.86 Cr, which counted High-risk anomalies from every tower. The new number counts only open SC financial cases.'),
);

children.push(
  h('12. A five-minute demo script', HeadingLevel.HEADING_1),
  p('The narrated walkthrough video follows the same twelve steps.'),
  table(['#', 'Show', 'Say'], [
    ['1', 'The three tabs', 'One question: is inventory stated right, and is cash tied up? Three screens, same as every tower.'],
    ['2', 'Health card', '53, Watch, down 15 points; receipt timeliness is the biggest drag.'],
    ['3', 'ABC and XYZ chips', 'Pick A, then Z: only the tiles re-scope, against all materials.'],
    ['4', 'Four headline cards', '₹642 Cr inventory, ₹38.5 Cr excess, ₹19 Cr not booked, ₹86 Cr exposure.'],
    ['5', 'Open Receipts Not Booked', '₹12.6 Cr in transit + ₹6.4 Cr at the gate; ₹4.9 Cr invoices blocked.'],
    ['6', 'Drill to BL-MSCU-77120', 'Type → plant → shipment; the breadcrumb restores every step.'],
    ['7', 'Control rates', 'Forecast 79% with +9.6% bias; record accuracy 97.2 vs 99.5.'],
    ['8', 'Decide SC-GIT-06', 'Take and confirm: not booked drops to ₹6.4 Cr immediately.'],
    ['9', 'Material portfolio', 'Supplier is a dimension: Kaveri is a sole source in distress.'],
    ['10', 'KSM-17 profile', 'Why it surfaced: 21 days of cover, sole source, three open cases.'],
    ['11', 'Process chain', 'Receive carries the most value; RC-01 delayed GR is the fix.'],
    ['12', 'Exposure deep link', 'One estimate per case; contingent and control beside, never added.'],
  ], [600, 2700, 6060]),
  spacer(280),
  new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 10 } },
    spacing: { before: 200, after: 80 },
    children: [r('FCT Finance Control Tower  ·  Supply chain screen guide  ·  21 October 2026', { size: 18, color: MUTED })],
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
            r('FCT  ·  Supply Chain', { size: 16, bold: true, color: TEAL }),
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

const out = path.join(__dirname, '../../docs/SC-screen-guide.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(out, buf);
  console.log('Wrote', out, buf.length, 'bytes');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
