/* Build docs/O2C-customer-characterisation.docx */
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber,
  LevelFormat, VerticalAlign } = require('docx');
const fs = require('fs');
const path = require('path');

const TEAL = '0B3B3A';
const BRASS = 'B08A1E';
const INK = '1C2423';
const MUTED = '5A6A67';
const LINE = 'D5DDDB';
const HEAD_BG = '0B3B3A';
const ALT = 'F4F7F6';
const CREAM = 'F7F3EA';
const TW = 9360;

const thin = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: thin, bottom: thin, left: thin, right: thin };

const r = (text, o = {}) => new TextRun({
  text, font: 'Calibri', size: o.size || 22, color: o.color || INK, bold: o.bold, italics: o.italics,
});
const p = (text, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 160, before: o.before ?? 0, line: o.line || 276 },
  children: Array.isArray(text) ? text : [r(text, o)],
});
const h = (text, level) => new Paragraph({
  heading: level,
  spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 280, after: 120 },
  border: level === HeadingLevel.HEADING_1
    ? { bottom: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 6 } }
    : undefined,
  children: [new TextRun({ text, font: 'Calibri', bold: true, color: TEAL,
    size: level === HeadingLevel.HEADING_1 ? 32 : 26 })],
});
const note = (text) => p([r(text, { italics: true, color: MUTED, size: 20 })]);
const bullet = (text) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  spacing: { after: 80, line: 276 },
  children: [r(text)],
});

function cell(text, w, o = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders,
    shading: o.header ? { type: ShadingType.CLEAR, fill: HEAD_BG }
      : o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      spacing: { after: 40, before: 40 },
      children: [r(String(text), { size: o.size || 18, bold: o.bold, color: o.color || (o.header ? 'FFFFFF' : INK) })],
    })],
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

const children = [
  new Paragraph({ spacing: { before: 0, after: 80 }, children: [r('FCT  ·  Finance Control Tower', { size: 20, color: TEAL, bold: true })] }),
  new Paragraph({ spacing: { after: 80 }, children: [r('Jubilant (demo) working session', { size: 20, color: MUTED })] }),
  new Paragraph({
    spacing: { before: 360, after: 80 },
    children: [new TextRun({ text: 'Order to Cash', font: 'Calibri', size: 48, bold: true, color: TEAL })],
  }),
  new Paragraph({
    spacing: { after: 240 },
    children: [new TextRun({ text: 'Customer characterisation', font: 'Calibri', size: 36, color: BRASS })],
  }),
  p('How every customer on the O2C tower is classified. Two independent characterisations: commercial segment and credit risk. They must not be mixed.'),
  kvTable([
    ['Applies to', 'O2C Health card chips, Customer Profile, Customer Risk Mix, ribbon Risk filter'],
    ['Population', 'Active customers only. Onboarding (CON-*) is excluded from counts and Health.'],
    ['Unfiltered total', '56 active customers at snapshot 05-Oct-2026 09:10'],
    ['Data', 'Illustrative. Definitions are those coded in the demo master.'],
  ]),

  h('The rule in one sentence', HeadingLevel.HEADING_1),
  p([
    r('Segment answers ', { size: 22 }),
    r('what kind of customer is this commercially?', { size: 22, italics: true }),
    r(' Risk answers ', { size: 22 }),
    r('how worried should credit and collections be?', { size: 22, italics: true }),
  ]),
  p('A Strategic hospital can be High risk. A Transactional clinic can be Low risk. The Health chips never change the risk tag, and the risk tag never changes the segment.'),

  h('1. Commercial segment', HeadingLevel.HEADING_1),
  p('Assigned on the customer master. It is how we sell to and collect from the account. It is not a credit grade and it is not the P2P Kraljic matrix (Strategic / Leverage / Bottleneck / Transactional).'),
  p('On the O2C Health card the chips are All, Strategic, Distributor, Export, Transactional. Picking a chip rescopes only the six Health component tiles (rate, floor-to-target bar, percent of customers affected, and the comparison note). The rest of the KPI sheet is unchanged.'),
  note('All = the sum of the four segments under the current filters. Unfiltered: 56.'),
  table(
    ['Segment', 'Definition', 'Who sits here', 'Count'],
    [
      ['Strategic', 'A named hospital or key care network whose volume and relationship justify account-managed credit, collections and commercial terms.', 'Meridian Health Systems, Lakeshore Clinics, Coastline Hospitals. Key account (NutriBlend Foods, AgriNova) is stored on the profile but counted as Strategic on the chips.', '18'],
      ['Distributor', 'A domestic wholesaler or stockist that buys to resell. Longer terms (typically 45-60 days), higher credit limits, more orders held for credit review.', 'Medilink Distributors, Corvia Healthcare', '12'],
      ['Export', 'A foreign buyer or overseas wholesaler on the EU or US books. Incoterms, FX and export credit apply.', 'Helvetia Pharma Distribution AG (Switzerland), Pacific Generics Inc (USA)', '8'],
      ['Transactional', 'A smaller or occasional buyer with standard terms and a low limit. Not account-managed as Strategic or Distributor.', 'Orbit Pharmacy Chain, Zenith Life Care, Helix Diagnostics', '18'],
      ['All', 'Every active customer in the current filters. Onboarding excluded.', '18 + 12 + 8 + 18', '56'],
    ],
    [1600, 3360, 3000, 1400],
  ),
  p('Key account is an internal master label, not a fifth chip. The Customer Profile identity line can still show Key account; Health always folds it into Strategic. That is why Strategic is 18 rather than the eight records labelled Strategic on the master.'),

  h('2. Credit and collections risk', HeadingLevel.HEADING_1),
  p('This is how likely the account is to pay late, dispute, or breach limit. Score 0-100: 60 percent of the worst assessed factor plus 40 percent of the weighted average of factors that have data. Missing factors reduce coverage; they are never scored as perfect.'),
  table(
    ['Factor', 'Weight', 'Source'],
    [
      ['Payment behaviour', '25', 'Days to pay and DSO versus terms (six months)'],
      ['Overdue concentration', '20', 'Open overdue as a share of open AR'],
      ['Credit utilisation', '15', 'AR plus open orders versus approved limit'],
      ['Disputes and deductions', '15', 'Open dispute value and recurrence'],
      ['Bureau and financials', '15', 'Credit bureau score and filings'],
      ['Promise-to-pay reliability', '10', 'Promises kept in six months'],
    ],
    [2800, 1200, 5360],
  ),
  p('The model category is read from the score. The approved category is the tag on the customer master. If they differ, the profile shows re-review: a person must confirm. The model does not auto-downgrade.'),
  table(
    ['Approved category', 'Score', 'Meaning', 'Review'],
    [
      ['Critical', '80+', 'Default, dispute hold, or credit-limit breach.', 'Weekly, AR and Credit'],
      ['High', '60-79', 'Overdue, broken promises, or bureau deterioration.', 'Fortnightly'],
      ['Medium', '40-59', 'Isolated delays.', 'Monthly'],
      ['Low', 'Below 40', 'Pays in cycle.', 'Quarterly'],
    ],
    [2000, 1400, 3960, 2000],
  ),
  p('Worked contrast: Meridian Health Systems is Strategic and High risk (pricing dispute, dunning paused). Helix Diagnostics is Transactional and Low risk. Medilink Distributors is Distributor and High risk (near limit; increase requested).'),

  h('3. Other labels on the same record', HeadingLevel.HEADING_1),
  p('These are not segments and not risk. They appear on the identity line, filters and breakdowns.'),
  table(
    ['Label', 'Definition'],
    [
      ['Status', 'Active versus Onboarding. Only Active enters the 56 and is used in Health, risk mix and master-data quality. Onboarding (CON-1182, CON-1179, CON-1176) is for duplicate and credit-assessment checks.'],
      ['Product line', 'What they buy: Formulations, API, Life science ingredients, Nutrition, Specialty chemicals, Distribution. Commercial segment is who they are in the channel, not the SKU mix.'],
      ['Business unit', 'Which book they sit on (IN-02 API Manufacturing through IN-08 Distribution and Trading, US-01, EU-01).'],
      ['Region', 'North India, West India, South India, North America, Europe — derived from the business unit.'],
      ['Collector', 'Named collector code on the account (for example NI). Used when Collection Success is broken down, not as a characterisation of the customer.'],
    ],
    [2200, 7160],
  ),

  h('How to use this on the screens', HeadingLevel.HEADING_1),
  bullet('Health card chips: commercial segment. Use when the question is whether Strategic hospitals, distributors, export or transactional accounts are dragging a control rate.'),
  bullet('Ribbon Risk filter and Customer Risk Mix: approved risk category. Use when the question is concentration of High and Critical, or re-reviews.'),
  bullet('Customer Profile: both. Identity line shows stored segment (including Key account). Tags show approved risk, model suggestion, terms and limit.'),
  bullet('Do not add segment counts to risk counts. They are different denominators answering different questions.'),

  new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 10 } },
    spacing: { before: 360, after: 80 },
    children: [r('FCT Finance Control Tower  ·  O2C customer characterisation  ·  21 October 2026', { size: 18, color: MUTED })],
  }),
  note('Demonstration prototype. All data, entities, people and system connections are simulated for the Jubilant (demo) working session.'),
];

const doc = new Document({
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
    properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 6 } },
          spacing: { after: 80 },
          children: [
            r('FCT  ·  Order to Cash', { size: 16, bold: true, color: TEAL }),
            r('     Customer characterisation     ', { size: 16, color: MUTED }),
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
            r('Jubilant (demo)  ·  56 active customers  ·  ', { size: 16, color: MUTED }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: MUTED }),
          ],
        })],
      }),
    },
    children,
  }],
});

const out = path.join(__dirname, '../../docs/O2C-customer-characterisation.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(out, buf);
  console.log('Wrote', out, buf.length, 'bytes');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
