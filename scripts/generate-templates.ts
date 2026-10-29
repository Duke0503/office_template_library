// Generates the seed template files in templates/files/ (SPEC CAP-10).
// Content is self-authored so the repository carries no third-party material.
// Run: npm run templates:generate. Re-running overwrites the source files in the repo only;
// the import command then creates a new revision for any file whose checksum changed (AD-4).

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IParagraphOptions,
} from 'docx';
import PptxGenJS from 'pptxgenjs';

const OUT = path.resolve(import.meta.dirname, '../templates/files');

// ---------------------------------------------------------------- DOCX helpers ---

const FONT = 'Calibri';

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function para(runs: (string | TextRun)[], options: Partial<IParagraphOptions> = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    ...options,
    children: runs.map((r) => (typeof r === 'string' ? new TextRun(r) : r)),
  });
}

function bullet(text: string, level = 0) {
  return new Paragraph({ text, bullet: { level }, spacing: { after: 60 } });
}

function numbered(text: string) {
  return new Paragraph({ text, numbering: { reference: 'numbered', level: 0 }, spacing: { after: 60 } });
}

function cell(text: string, opts: { bold?: boolean; fill?: string; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new TableCell({
    shading: opts.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: opts.align,
        children: [new TextRun({ text, bold: opts.bold, color: opts.color })],
      }),
    ],
  });
}

function table(headers: string[], rows: string[][], accent: string, alignRight: number[] = []) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) =>
          cell(h, { bold: true, fill: accent, color: 'FFFFFF', align: alignRight.includes(i) ? AlignmentType.RIGHT : undefined }),
        ),
      }),
      ...rows.map(
        (r, ri) =>
          new TableRow({
            children: r.map((c, i) =>
              cell(c, { fill: ri % 2 ? 'F3F4F6' : undefined, align: alignRight.includes(i) ? AlignmentType.RIGHT : undefined }),
            ),
          }),
      ),
    ],
  });
}

function docxFile(title: string, accent: string, children: (Paragraph | Table)[]) {
  return new Document({
    creator: 'Office Template Library',
    title,
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 36, bold: true, color: accent } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: '1F2937' } },
        { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 52, bold: true, color: accent } },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'numbered',
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
      ],
    },
    sections: [
      {
        properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: accent, space: 4 } },
                children: [new TextRun({ text: title, color: '6B7280', size: 18 })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], color: '6B7280', size: 18 })],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

const b = (text: string) => new TextRun({ text, bold: true });
const i = (text: string) => new TextRun({ text, italics: true });

// ------------------------------------------------------------- DOCX templates ---

const docxTemplates: Record<string, Document> = {
  'business-letter': docxFile('Business Letter', '1D4ED8', [
    para([b('Northwind Studio')], { spacing: { after: 0 } }),
    para(['12 Harbour Street, Da Nang'], { spacing: { after: 0 } }),
    para(['hello@northwind.example · +84 236 000 000'], { spacing: { after: 360 } }),
    para(['29 October 2026']),
    para([b('Ms. Linh Tran')], { spacing: { after: 0 } }),
    para(['Procurement Manager, Sunrise Retail'], { spacing: { after: 0 } }),
    para(['88 Le Loi Boulevard, Ho Chi Minh City'], { spacing: { after: 240 } }),
    para([b('Subject: '), 'Proposal for the 2027 store redesign']),
    para(['Dear Ms. Tran,']),
    para(['Thank you for meeting our team last week. As discussed, we propose a phased redesign of your flagship store that keeps it open throughout the work.']),
    para(['The proposal covers three points:']),
    bullet('A customer-flow study during the first two weeks.'),
    bullet('Concept designs with two alternatives for your review.'),
    bullet('A fixed-price build phase with weekly progress reports.'),
    para(['We would welcome the chance to present the details in person. ', i('Please reply by 15 November'), ' so we can reserve the survey team.']),
    para(['Yours sincerely,'], { spacing: { before: 240, after: 600 } }),
    para([b('Minh Nguyen')], { spacing: { after: 0 } }),
    para(['Managing Director, Northwind Studio']),
  ]),

  'meeting-minutes': docxFile('Meeting Minutes', '047857', [
    heading('Weekly Product Meeting', HeadingLevel.TITLE),
    table(['Date', 'Time', 'Location', 'Chair'], [['29 Oct 2026', '09:00–10:00', 'Room 3B / Online', 'An Pham']], '047857'),
    heading('Attendees', HeadingLevel.HEADING_2),
    para(['An Pham (chair), Bao Le, Chi Vo, Dung Hoang. ', i('Apologies: '), 'Hanh Do.']),
    heading('Agenda', HeadingLevel.HEADING_2),
    numbered('Review of last week’s actions'),
    numbered('Release 2.4 readiness'),
    numbered('Customer feedback summary'),
    numbered('Any other business'),
    heading('Decisions', HeadingLevel.HEADING_2),
    bullet('Release 2.4 ships on 5 November after the final regression run.'),
    bullet('The onboarding survey moves to the second login, not the first.'),
    heading('Action items', HeadingLevel.HEADING_2),
    table(
      ['Action', 'Owner', 'Due', 'Status'],
      [
        ['Run final regression suite', 'Bao Le', '3 Nov', 'Open'],
        ['Update release notes', 'Chi Vo', '4 Nov', 'Open'],
        ['Share feedback dashboard', 'Dung Hoang', '1 Nov', 'Done'],
      ],
      '047857',
    ),
    para([b('Next meeting: '), '5 November 2026, 09:00.'], { spacing: { before: 240 } }),
  ]),

  invoice: docxFile('Invoice', 'B45309', [
    heading('INVOICE', HeadingLevel.TITLE),
    table(
      ['Invoice no.', 'Issue date', 'Due date'],
      [['INV-2026-0147', '29 Oct 2026', '28 Nov 2026']],
      'B45309',
    ),
    heading('Bill to', HeadingLevel.HEADING_2),
    para([b('Sunrise Retail Co., Ltd.')], { spacing: { after: 0 } }),
    para(['88 Le Loi Boulevard, District 1, Ho Chi Minh City'], { spacing: { after: 0 } }),
    para(['Tax code: 0312345678']),
    heading('Services', HeadingLevel.HEADING_2),
    table(
      ['Description', 'Qty', 'Unit price (VND)', 'Amount (VND)'],
      [
        ['Customer-flow study', '1', '45,000,000', '45,000,000'],
        ['Concept design, two alternatives', '2', '30,000,000', '60,000,000'],
        ['Site visits', '4', '2,500,000', '10,000,000'],
        ['Subtotal', '', '', '115,000,000'],
        ['VAT 10%', '', '', '11,500,000'],
        ['Total due', '', '', '126,500,000'],
      ],
      'B45309',
      [1, 2, 3],
    ),
    heading('Payment', HeadingLevel.HEADING_2),
    para(['Bank transfer to ', b('Northwind Studio'), ', account 0123 4567 890, Example Bank, Da Nang branch.']),
    para([i('Please quote the invoice number in the transfer reference.')]),
  ]),

  resume: docxFile('Resume', '7C3AED', [
    heading('Thao Nguyen', HeadingLevel.TITLE),
    para(['Fullstack Developer · Ho Chi Minh City · thao@example.com · github.com/thao-example']),
    heading('Profile', HeadingLevel.HEADING_1),
    para(['Developer with five years of experience building web products in ', b('TypeScript'), ', ', b('React'), ' and ', b('Node.js'), '. Cares about clear architecture, tests and accessible interfaces.']),
    heading('Experience', HeadingLevel.HEADING_1),
    heading('Senior Developer — Example Commerce (2023–present)', HeadingLevel.HEADING_2),
    bullet('Led the checkout rewrite; conversion rose 8% in the first quarter.'),
    bullet('Introduced contract tests between five services.'),
    heading('Developer — Example Software (2021–2023)', HeadingLevel.HEADING_2),
    bullet('Built an internal document-generation service used by 300 staff.'),
    bullet('Mentored three junior developers.'),
    heading('Skills', HeadingLevel.HEADING_1),
    table(
      ['Area', 'Technologies'],
      [
        ['Frontend', 'React, TypeScript, Tailwind CSS, Vite'],
        ['Backend', 'Node.js, Express, PostgreSQL, SQLite'],
        ['Delivery', 'Docker, GitHub Actions, Vitest, Playwright'],
      ],
      '7C3AED',
    ),
    heading('Education', HeadingLevel.HEADING_1),
    para([b('B.Sc. Computer Science'), ', Example University, 2020']),
  ]),

  'lesson-plan': docxFile('Lesson Plan', 'DB2777', [
    heading('Lesson Plan: The Water Cycle', HeadingLevel.TITLE),
    table(['Subject', 'Grade', 'Duration', 'Teacher'], [['Science', '6', '45 minutes', 'Ms. Mai']], 'DB2777'),
    heading('Learning objectives', HeadingLevel.HEADING_1),
    para(['By the end of the lesson, students can:']),
    numbered('Name the four stages of the water cycle.'),
    numbered('Explain how the sun drives evaporation.'),
    numbered('Draw and label a water-cycle diagram.'),
    heading('Materials', HeadingLevel.HEADING_1),
    bullet('Clear plastic bowl, cling film, ice cubes, warm water'),
    bullet('Worksheet: “Follow the droplet”'),
    heading('Lesson flow', HeadingLevel.HEADING_1),
    table(
      ['Time', 'Activity', 'Purpose'],
      [
        ['0–5 min', 'Question: where does rain come from?', 'Activate prior knowledge'],
        ['5–20 min', 'Bowl experiment in groups', 'Observe condensation'],
        ['20–35 min', 'Diagram and vocabulary', 'Name the stages'],
        ['35–45 min', 'Exit ticket', 'Check understanding'],
      ],
      'DB2777',
    ),
    heading('Assessment', HeadingLevel.HEADING_1),
    para(['Students complete the exit ticket. ', i('Success: '), 'three of four stages named correctly.']),
  ]),

  'project-proposal': docxFile('Project Proposal', '0E7490', [
    heading('Project Proposal', HeadingLevel.TITLE),
    para([b('Project: '), 'Customer self-service portal'], { spacing: { after: 0 } }),
    para([b('Sponsor: '), 'Operations Director'], { spacing: { after: 0 } }),
    para([b('Date: '), '29 October 2026']),
    heading('1. Problem', HeadingLevel.HEADING_1),
    para(['Support handles about 1,200 requests a month that customers could resolve themselves, such as invoice copies and address changes.']),
    heading('2. Goals', HeadingLevel.HEADING_1),
    bullet('Cut routine support requests by 40% within six months.'),
    bullet('Give customers 24/7 access to invoices and orders.'),
    heading('3. Scope', HeadingLevel.HEADING_1),
    table(
      ['In scope', 'Out of scope'],
      [
        ['Invoice and order history', 'Payments'],
        ['Profile and address changes', 'Mobile app'],
        ['Support ticket tracking', 'Live chat'],
      ],
      '0E7490',
    ),
    heading('4. Timeline and budget', HeadingLevel.HEADING_1),
    table(
      ['Phase', 'Duration', 'Budget (USD)'],
      [
        ['Discovery', '3 weeks', '12,000'],
        ['Build', '10 weeks', '68,000'],
        ['Launch and support', '3 weeks', '10,000'],
      ],
      '0E7490',
      [2],
    ),
    heading('5. Risks', HeadingLevel.HEADING_1),
    bullet('Legacy billing data may need cleaning before import.'),
    bullet('Adoption depends on clear customer communication.'),
  ]),
};

// ------------------------------------------------------------- PPTX templates ---

interface Theme {
  bg: string;
  accent: string;
  ink: string;
  muted: string;
  titleBg: string;
  titleInk: string;
}

function deck(title: string, theme: Theme) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
  pptx.title = title;
  pptx.author = 'Office Template Library';
  pptx.defineSlideMaster({
    title: 'TITLE',
    background: { color: theme.titleBg },
    objects: [{ rect: { x: 0, y: 6.9, w: 13.33, h: 0.6, fill: { color: theme.accent } } }],
  });
  pptx.defineSlideMaster({
    title: 'CONTENT',
    background: { color: theme.bg },
    objects: [
      { rect: { x: 0, y: 0, w: 0.25, h: 7.5, fill: { color: theme.accent } } },
      { text: { text: title, options: { x: 0.6, y: 7.0, w: 8, h: 0.35, fontSize: 10, color: theme.muted, fontFace: 'Calibri' } } },
    ],
    slideNumber: { x: 12.4, y: 7.0, w: 0.6, h: 0.35, fontSize: 10, color: theme.muted, fontFace: 'Calibri' },
  });
  return pptx;
}

function titleSlide(pptx: PptxGenJS, theme: Theme, title: string, subtitle: string) {
  const s = pptx.addSlide({ masterName: 'TITLE' });
  s.addText(title, { x: 0.8, y: 2.3, w: 11.5, h: 1.4, fontSize: 48, bold: true, color: theme.titleInk, fontFace: 'Calibri' });
  s.addText(subtitle, { x: 0.8, y: 3.8, w: 11.5, h: 0.8, fontSize: 22, color: theme.titleInk, fontFace: 'Calibri', transparency: 15 });
}

function contentSlide(pptx: PptxGenJS, theme: Theme, title: string) {
  const s = pptx.addSlide({ masterName: 'CONTENT' });
  s.addText(title, { x: 0.6, y: 0.4, w: 12, h: 0.9, fontSize: 32, bold: true, color: theme.ink, fontFace: 'Calibri' });
  return s;
}

function bullets(s: PptxGenJS.Slide, theme: Theme, items: string[], box = { x: 0.6, y: 1.5, w: 12, h: 5 }) {
  s.addText(
    items.map((t) => ({ text: t, options: { bullet: { indent: 24 }, breakLine: true } })),
    { ...box, fontSize: 22, color: theme.ink, fontFace: 'Calibri', paraSpaceAfter: 14, valign: 'top' },
  );
}

function cards(pptx: PptxGenJS, s: PptxGenJS.Slide, theme: Theme, items: [string, string][]) {
  const w = (12 - (items.length - 1) * 0.3) / items.length;
  items.forEach(([head, body], idx) => {
    const x = 0.6 + idx * (w + 0.3);
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.7, w, h: 4.2, fill: { color: 'FFFFFF' }, line: { color: theme.accent, width: 1.5 }, rectRadius: 0.1 });
    s.addText(head, { x: x + 0.2, y: 1.9, w: w - 0.4, h: 0.8, fontSize: 22, bold: true, color: theme.accent, fontFace: 'Calibri' });
    s.addText(body, { x: x + 0.2, y: 2.7, w: w - 0.4, h: 3, fontSize: 16, color: theme.ink, fontFace: 'Calibri', valign: 'top' });
  });
}

const pptxTemplates: Record<string, () => PptxGenJS> = {
  'pitch-deck': () => {
    const t: Theme = { bg: 'F8FAFC', accent: '2563EB', ink: '0F172A', muted: '64748B', titleBg: '1E3A8A', titleInk: 'FFFFFF' };
    const p = deck('Startup Pitch Deck', t);
    titleSlide(p, t, 'Startup Pitch Deck', 'Your company · Seed round 2026');
    bullets(contentSlide(p, t, 'The problem'), t, ['Small shops lose 3 hours a week reconciling stock by hand.', 'Existing tools are built for warehouses, not corner stores.', 'Errors cost an average shop 4% of monthly revenue.']);
    cards(p, contentSlide(p, t, 'Our solution'), t, [['Scan', 'Count stock with a phone camera in minutes.'], ['Sync', 'Sales and stock stay in step automatically.'], ['Act', 'Reorder alerts before shelves run empty.']]);
    const m = contentSlide(p, t, 'Market traction');
    m.addChart(p.ChartType.bar, [{ name: 'Active shops', labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [120, 340, 780, 1450] }], { x: 0.6, y: 1.5, w: 12, h: 5, chartColors: [t.accent], showValue: true, valAxisHidden: true, catAxisLabelFontSize: 16, dataLabelFontSize: 14 });
    bullets(contentSlide(p, t, 'The ask'), t, ['Raising USD 1.5M seed.', '18 months of runway.', 'Goal: 10,000 shops across Vietnam and Thailand.']);
    return p;
  },

  'quarterly-report': () => {
    const t: Theme = { bg: 'FFFFFF', accent: '059669', ink: '111827', muted: '6B7280', titleBg: '064E3B', titleInk: 'FFFFFF' };
    const p = deck('Quarterly Business Review', t);
    titleSlide(p, t, 'Quarterly Business Review', 'Q3 2026 · Finance team');
    cards(p, contentSlide(p, t, 'Highlights'), t, [['Revenue', 'USD 4.2M, up 12% on Q2.'], ['Margin', 'Gross margin steady at 61%.'], ['Customers', '2,140 active, up 9%.']]);
    const r = contentSlide(p, t, 'Revenue by month');
    r.addChart(p.ChartType.line, [{ name: 'Revenue (USD k)', labels: ['Jul', 'Aug', 'Sep'], values: [1310, 1395, 1495] }], { x: 0.6, y: 1.5, w: 12, h: 5, chartColors: [t.accent], lineSize: 3, showValue: true, catAxisLabelFontSize: 16 });
    const k = contentSlide(p, t, 'Key figures');
    k.addTable(
      [
        [{ text: 'Metric', options: { bold: true, color: 'FFFFFF', fill: { color: t.accent } } }, { text: 'Q2', options: { bold: true, color: 'FFFFFF', fill: { color: t.accent } } }, { text: 'Q3', options: { bold: true, color: 'FFFFFF', fill: { color: t.accent } } }],
        ['Revenue (USD M)', '3.75', '4.20'],
        ['Operating costs (USD M)', '2.10', '2.25'],
        ['New customers', '180', '196'],
      ],
      { x: 0.6, y: 1.6, w: 12, fontSize: 18, fontFace: 'Calibri', color: t.ink, border: { type: 'solid', color: 'E5E7EB', pt: 1 }, rowH: 0.6 },
    );
    bullets(contentSlide(p, t, 'Next quarter'), t, ['Launch the annual plan discount.', 'Hire two account managers.', 'Target: USD 4.6M revenue.']);
    return p;
  },

  'class-lesson': () => {
    const t: Theme = { bg: 'FFFBEB', accent: 'D97706', ink: '1C1917', muted: '78716C', titleBg: 'F59E0B', titleInk: '1C1917' };
    const p = deck('Classroom Lesson', t);
    titleSlide(p, t, 'The Water Cycle', 'Science · Grade 6');
    bullets(contentSlide(p, t, 'Today we will'), t, ['Name the four stages of the water cycle.', 'See condensation happen in a bowl.', 'Draw our own water-cycle diagram.']);
    cards(p, contentSlide(p, t, 'Four stages'), t, [['Evaporation', 'The sun heats water and it rises as vapour.'], ['Condensation', 'Vapour cools and forms clouds.'], ['Precipitation', 'Water falls as rain, snow or hail.'], ['Collection', 'Water gathers in rivers, lakes and seas.']]);
    bullets(contentSlide(p, t, 'Exit ticket'), t, ['Which stage makes clouds?', 'What gives the water cycle its energy?', 'Draw one stage and label it.']);
    return p;
  },

  'product-launch': () => {
    const t: Theme = { bg: '0F172A', accent: 'F43F5E', ink: 'F8FAFC', muted: '94A3B8', titleBg: '020617', titleInk: 'F8FAFC' };
    const p = deck('Product Launch', t);
    titleSlide(p, t, 'Introducing Aurora', 'Product launch · November 2026');
    bullets(contentSlide(p, t, 'Why Aurora'), t, ['Teams juggle five tools to plan one campaign.', 'Aurora puts brief, assets and schedule in one place.', 'Built with 40 marketing teams in a closed beta.']);
    cards(p, contentSlide(p, t, 'Key features'), t, [['Briefs', 'Structured briefs that everyone signs off.'], ['Assets', 'Versioned files with review comments.'], ['Calendar', 'One campaign calendar across channels.']]);
    const s = contentSlide(p, t, 'Launch plan');
    s.addTable(
      [
        [{ text: 'Week', options: { bold: true, fill: { color: t.accent } } }, { text: 'Milestone', options: { bold: true, fill: { color: t.accent } } }],
        ['1', 'Press briefing and website live'],
        ['2', 'Webinar with beta customers'],
        ['3–4', 'Paid campaign in three markets'],
      ],
      { x: 0.6, y: 1.6, w: 12, fontSize: 18, fontFace: 'Calibri', color: t.ink, border: { type: 'solid', color: '334155', pt: 1 }, rowH: 0.6 },
    );
    return p;
  },
};

// --------------------------------------------------------------------- write ---

await mkdir(OUT, { recursive: true });
for (const [slug, doc] of Object.entries(docxTemplates)) {
  await writeFile(path.join(OUT, `${slug}.docx`), await Packer.toBuffer(doc));
  console.log(`docx  ${slug}`);
}
for (const [slug, build] of Object.entries(pptxTemplates)) {
  const buffer = (await build().write({ outputType: 'nodebuffer' })) as Buffer;
  await writeFile(path.join(OUT, `${slug}.pptx`), buffer);
  console.log(`pptx  ${slug}`);
}
