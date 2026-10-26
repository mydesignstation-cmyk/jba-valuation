import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  PageBreak,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { formatDisplayDate } from "@/lib/date-format";
import type { MakerValuation } from "@/types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const EM_DASH = "—";

function value(input: unknown): string {
  const text = input == null ? "" : String(input).trim();
  return text || EM_DASH;
}

function money(input: unknown): string {
  const text = value(input);
  if (text === EM_DASH) return text;
  const number = Number(text.replace(/,/g, ""));
  return Number.isFinite(number)
    ? `Rs. ${number.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/-`
    : text;
}

function address(valuation: MakerValuation): string {
  return [
    valuation.flatNo && `Flat No. ${valuation.flatNo}`,
    valuation.locatedOnFloor,
    valuation.wing && `Wing ${valuation.wing}`,
    valuation.buildingName,
    valuation.landmark,
    valuation.roadNameArea,
    valuation.plotNo && `Plot No. ${valuation.plotNo}`,
    valuation.ctsNo && `C.T.S. No. ${valuation.ctsNo}`,
    valuation.sNo && `S. No. ${valuation.sNo}`,
    valuation.village && `Village: ${valuation.village}`,
    valuation.location,
    valuation.taluka && `Taluka: ${valuation.taluka}`,
    valuation.district && `District: ${valuation.district}`,
    valuation.pinCode,
  ].filter(Boolean).join(", ");
}

export const MAKER_VALUATION_REPORT_TEMPLATE_ID = "BOI" as const;

type ReportFieldKey =
  | "nameOfOwner"
  | "typeOfProperty"
  | "address"
  | "fairMarketValue"
  | "realizableValue"
  | "distressValue"
  | "govtValue"
  | "insuranceValue";

type ReportFieldRow = {
  type: "field";
  label: string;
  binding: ReportFieldKey;
  value: string;
  valueBold?: boolean;
};

function tableRows(valuation: MakerValuation): ReportFieldRow[] {
  return [
    { type: "field", label: "Borrower / Owner", binding: "nameOfOwner", value: value(valuation.nameOfOwner), valueBold: true },
    { type: "field", label: "Type of asset", binding: "typeOfProperty", value: value(valuation.typeOfProperty) },
    { type: "field", label: "Address of the property", binding: "address", value: address(valuation) },
    { type: "field", label: "Fair Market Value of the Property 100%", binding: "fairMarketValue", value: money(valuation.fairMarketValue) },
    { type: "field", label: `Realizable Market Value of the Property ${value(valuation.realizableValuePercent)}%`, binding: "realizableValue", value: money(valuation.realizableValue) },
    { type: "field", label: `Force / Distress Sale Value of the Property ${value(valuation.distressValuePercent)}%`, binding: "distressValue", value: money(valuation.distressValue) },
    { type: "field", label: "Govt. Value", binding: "govtValue", value: money(valuation.govtValue) },
    { type: "field", label: "Insurance Value", binding: "insuranceValue", value: money(valuation.insuranceValue) },
  ];
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(next, size) > width) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function textRunsWithBreaks(text: string, size: number, bold = false): TextRun[] {
  return text.split(/\r?\n/).flatMap((line, index) => [
    ...(index > 0 ? [new TextRun({ break: 1 })] : []),
    new TextRun({ text: line, size, bold, font: "Arial" }),
  ]);
}

export async function generateMakerValuationReportPdf(valuation: MakerValuation): Promise<string> {
  const document = await PDFDocument.create();
  const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0.08, 0.08, 0.08);
  const margin = 70;
  const tableX = 70;
  const tableWidth = PAGE_WIDTH - tableX * 2;
  const labelWidth = 230;
  const valueWidth = tableWidth - labelWidth;
  let y = PAGE_HEIGHT - 58;

  // Reserved letterhead area. The report intentionally leaves this blank for printing.
  y -= 105;
  page.drawText("Date", { x: 365, y, size: 8, font: regular, color: black });
  page.drawText(":", { x: 407, y, size: 8, font: regular, color: black });
  page.drawText(formatDisplayDate(value(valuation.dateOfValuation)), { x: 420, y, size: 8, font: regular, color: black });
  y -= 13;
  page.drawText("Ref. No.", { x: 365, y, size: 8, font: regular, color: black });
  page.drawText(":", { x: 407, y, size: 8, font: regular, color: black });
  page.drawText(value(valuation.refNo), { x: 420, y, size: 8, font: regular, color: black });

  y -= 40;
  page.drawText("To", { x: margin, y, size: 9, font: bold, color: black });
  y -= 14;
  page.drawText("The Branch Manager", { x: margin, y, size: 9, font: bold, color: black });
  y -= 12;
  page.drawText(value(valuation.bankName), { x: margin, y, size: 9, font: regular, color: black });
  y -= 12;
  page.drawText(`${value(valuation.branch)} Branch,`, { x: margin, y, size: 9, font: regular, color: black });
  y -= 12;
  page.drawText(`${value(valuation.district)}.`, { x: margin, y, size: 9, font: regular, color: black });

  y -= 36;
  const title = "CERTIFICATE";
  page.drawText(title, { x: (PAGE_WIDTH - bold.widthOfTextAtSize(title, 11)) / 2, y, size: 11, font: bold, color: black });
  y -= 27;
  const intro = "We certify that we have surveyed the said immovable property";
  page.drawText(intro, { x: (PAGE_WIDTH - regular.widthOfTextAtSize(intro, 8)) / 2, y, size: 8, font: regular, color: black });
  y -= 18;

  const rows = tableRows(valuation);
  const labelFontSize = 12;
  const valueFontSize = 12;
  const lineHeight = 14;
  const padding = 5;
  for (const row of rows) {
    const label = row.label;
    const rowValue = row.value;
    const labelLines = wrap(label, bold, labelFontSize, labelWidth - padding * 2);
    const valueLines = wrap(rowValue, regular, valueFontSize, valueWidth - padding * 2);
    const height = Math.max(labelLines.length, valueLines.length) * lineHeight + padding * 2;
    page.drawRectangle({ x: tableX, y: y - height, width: tableWidth, height, borderColor: black, borderWidth: 0.5 });
    page.drawLine({ start: { x: tableX + labelWidth, y }, end: { x: tableX + labelWidth, y: y - height }, thickness: 0.5, color: black });
    labelLines.forEach((line, index) => page.drawText(line, { x: tableX + padding, y: y - padding - lineHeight * index - labelFontSize, size: labelFontSize, font: bold, color: black }));
    valueLines.forEach((line, index) => page.drawText(line, { x: tableX + labelWidth + padding, y: y - padding - lineHeight * index - valueFontSize, size: valueFontSize, font: row.valueBold ? bold : regular, color: black }));
    y -= height;
  }

  y -= 34;
  const certifier = "For JBA Consulting & Advisory Services LLP";
  page.drawText(certifier, { x: PAGE_WIDTH - margin - regular.widthOfTextAtSize(certifier, 8), y, size: 8, font: regular, color: black });
  y -= 58;
  const signature = "Authorised Signature";
  page.drawText(signature, { x: PAGE_WIDTH - margin - bold.widthOfTextAtSize(signature, 8), y, size: 8, font: bold, color: black });
  y -= 11;
  for (const line of ["(Approved panel valuer)", "Vr. Jasmin Bhatt - MRICS", "B-Tech (Civil), MSc Valuation, MBA in Finance", "Govt. Registered Valuer (IBBI), Chartered Surveyor,"]) {
    page.drawText(line, { x: PAGE_WIDTH - margin - regular.widthOfTextAtSize(line, 7), y, size: 7, font: regular, color: black });
    y -= 10;
  }
  page.drawText("Structural Engineer, Town Planner, Project Management Consultant.", { x: PAGE_WIDTH - margin - regular.widthOfTextAtSize("Structural Engineer, Town Planner, Project Management Consultant.", 7), y, size: 7, font: regular, color: black });
  page.drawText("JBA Consulting & Advisory Services LLP", { x: PAGE_WIDTH - margin - regular.widthOfTextAtSize("JBA Consulting & Advisory Services LLP", 7), y: 18, size: 7, font: regular, color: rgb(0.45, 0.45, 0.45) });

  renderPageTwo(document, regular, bold, valuation);
  renderStructuredPage(document, regular, bold, pageThreeRows(valuation), 3);
  renderStructuredPage(document, regular, bold, pageFourRows(valuation), 4);
  renderStructuredPage(document, regular, bold, pageFiveRows(valuation), 5);
  renderAnnexurePdf(document, regular, bold, valuation);
  renderPropertyPhotosPage(document, regular, bold);
  addDynamicPageNumbers(document, regular);
  return Buffer.from(await document.save()).toString("base64");
}

export async function generateMakerValuationReportDocx(valuation: MakerValuation): Promise<string> {
  const borders = { style: BorderStyle.SINGLE, size: 4, color: "666666" } as const;
  const cellBorders = { top: borders, bottom: borders, left: borders, right: borders };
  const cellMargins = { top: 70, bottom: 70, left: 90, right: 90 };
  const rows = tableRows(valuation).map((row) =>
    new TableRow({ children: [
      new TableCell({ width: { size: 42, type: WidthType.PERCENTAGE }, margins: cellMargins, borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: row.label, bold: true, size: 24, font: "Arial" })] })] }),
      new TableCell({ width: { size: 58, type: WidthType.PERCENTAGE }, margins: cellMargins, borders: cellBorders, children: [new Paragraph({ children: textRunsWithBreaks(row.value, 24, row.valueBold) })] }),
    ]}),
  );
  const doc = new Document({ sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 1000, right: 1000 } } }, children: [
    new Paragraph({ spacing: { after: 2600 }, text: "" }),
    new Paragraph({ alignment: AlignmentType.RIGHT, children: textRunsWithBreaks(`Date       :  ${formatDisplayDate(value(valuation.dateOfValuation))}\nRef. No.  :  ${value(valuation.refNo)}`, 24) }),
    new Paragraph({ spacing: { before: 500 }, children: [new TextRun({ text: "To", size: 24, font: "Arial" })] }),
    new Paragraph({ children: [new TextRun({ text: "The Branch Manager", bold: true, size: 24, font: "Arial" })] }),
    new Paragraph({ children: [new TextRun({ text: value(valuation.bankName), size: 24, font: "Arial" })] }),
    new Paragraph({ children: [new TextRun({ text: `${value(valuation.branch)} Branch,`, size: 24, font: "Arial" })] }),
    new Paragraph({ children: [new TextRun({ text: `${value(valuation.district)}.`, size: 24, font: "Arial" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 500, after: 260 }, children: [new TextRun({ text: "CERTIFICATE", bold: true, underline: {}, size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 }, children: [new TextRun({ text: "We certify that we have surveyed the said immovable property", size: 24 })] }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: borders, bottom: borders, left: borders, right: borders, insideHorizontal: borders, insideVertical: borders }, rows }),
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 550 }, children: [new TextRun({ text: "For JBA Consulting & Advisory Services LLP", size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 300 }, children: textRunsWithBreaks("Authorised Signature\n(Approved panel valuer)\nVr. Jasmin Bhatt - MRICS\nB-Tech (Civil), MSc Valuation, MBA in Finance\nGovt. Registered Valuer (IBBI), Chartered Surveyor,\nStructural Engineer, Town Planner, Project Management Consultant.", 20) }),
    new Paragraph({ alignment: AlignmentType.CENTER, pageBreakBefore: true, spacing: { after: 220 }, children: [new TextRun({ text: "VALUATION REPORT", bold: true, underline: {}, size: 20 })] }),
    structuredDocxTable(
      [...pageTwoRows(valuation), ...pageThreeRows(valuation), ...pageFourRows(valuation), ...pageFiveRows(valuation)],
      borders,
      cellMargins,
    ),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Annexure A", bold: true, size: 24, font: "Arial" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "DECLARATION FROM VALUERS", bold: true, size: 24, font: "Arial" })] }),
    ...annexureParagraphs(valuation).map((paragraph) => new Paragraph({ spacing: { after: 100, line: 240 }, children: emphasizedTextRuns(paragraph, [value(valuation.dateOfValuation), value(valuation.dateOfInspection)], 24) })),
    annexureDocxTable(valuation, borders, cellMargins),
    new Paragraph({ spacing: { before: 500 }, children: textRunsWithBreaks(`Date: ${value(valuation.dateOfValuation)}\nPlace: Mumbai`, 20, true) }),
    new Paragraph({ alignment: AlignmentType.RIGHT, children: textRunsWithBreaks("JBA Consulting & Advisory Services LLP\n\nAuthorised Signature\n(Approved panel valuer)", 24) }),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 500 }, children: [new TextRun({ text: "Property Photos", bold: true, size: 24, font: "Arial" })] }),
  ] }] });
  return Buffer.from(await Packer.toBuffer(doc)).toString("base64");
}

type PageTwoRow = {
  number?: string;
  description: string;
  value?: string;
  section?: boolean;
  placeholder?: boolean;
};

function pageTwoRows(valuation: MakerValuation): PageTwoRow[] {
  const documentList = [valuation.documentsName1, valuation.documentsName2, valuation.documentsName3]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(", ");

  return [
    { description: "GENERAL", section: true },
    { number: "1.", description: "Purpose for which valuation is made", value: `To Assess the ${value(valuation.purposeOfValuation)} of subject Property for Bank purpose.` },
    { number: "2.", description: "a) Date of inspection", value: formatDisplayDate(value(valuation.dateOfInspection)) },
    { description: "b) Date on which the valuation is made", value: formatDisplayDate(value(valuation.dateOfValuation)) },
    { number: "3.", description: "List of documents produced for perusal", value: documentList },
    { description: `a) ${value(valuation.documentsName1)}`, value: value(valuation.documentsDetails1) },
    { description: `b) ${value(valuation.documentsName2)}`, value: value(valuation.documentsDetails2) },
    { description: `c) ${value(valuation.documentsName3)}`, value: value(valuation.documentsDetails3) },
    { number: "4.", description: "Name of owner(s) and his/their address (with phone no., details of share of each owner in case of joint ownership)", value: `${value(valuation.nameOfOwner)}\nAdd: ${value(valuation.address)}` },
    { number: "5.", description: "Brief description of property.", value: `The property is a ${value(valuation.configurationInShort)} ${value(valuation.typeOfProperty)}, located on ${value(valuation.locatedOnFloor)} Floor in the ${value(valuation.buildingName)} Building comprises of ${value(valuation.nosOfFloor)} Floors with ${value(valuation.nosOfLifts)} Lifts & ${value(valuation.nosOfStaircase)} Staircase.` },
    { number: "6.", description: "Location of property", value: "" },
    { description: "a) Plot No. / Survey No.", value: `Plot No. ${value(valuation.plotNo)}, C.T.S. No. ${value(valuation.ctsNo)}, Survey No. ${value(valuation.sNo)}.` },
    { description: "b) Door No.", value: `Flat No. ${value(valuation.flatNo)}` },
    { description: "c) T. S. No. / Village", value: `Village ${value(valuation.village)}` },
    { description: "d) Ward / Taluka", value: `Taluka ${value(valuation.taluka)}` },
    { description: "e) Mandal / District", value: `District ${value(valuation.district)} (Pin Code ${value(valuation.pinCode)}).` },
    { description: "f) Date of issue and validity of layout of approved map / Occupancy Certificate", value: value(valuation.documentsName2) },
    { description: "g) Approved map / occupancy Certificate issuing authority", value: value(valuation.municipalCorporation) },
    { description: "h) Whether genuineness or authenticity of approved map / plan is verified", value: value(valuation.genuinenessOrAuthenticity) },
    { description: "i) Any other comments by our employee / valuer on authentic of approved plan", value: value(valuation.anyOtherComments) },
    { description: "Postal address of the property", value: `Flat No. ${value(valuation.flatNo)}, ${value(valuation.locatedOnFloor)} Floor, Wing ${value(valuation.wing)}, Building Name, Landmark, Road Name & Area, Plot No. ${value(valuation.plotNo)}, C.T.S. No. ${value(valuation.ctsNo)}, Survey No. ${value(valuation.sNo)}, Village ${value(valuation.village)}, ${value(valuation.location)}, Taluka ${value(valuation.taluka)}, District ${value(valuation.district)} (Pin Code ${value(valuation.pinCode)}).` },
    { number: "7.", description: "City / Town", value: value(valuation.location) },
    { description: "Residential Area", value: value(valuation.locality) },
    { description: "Commercial Area", value: "" },
    { description: "Industrial Area", value: "" },
    { number: "8.", description: "Classification of area", value: "" },
    { description: "i) High / Middle / Poor", value: value(valuation.classOfLocality1) },
  ];
}

function renderPageTwo(
  document: PDFDocument,
  regular: PDFFont,
  bold: PDFFont,
  valuation: MakerValuation,
): void {
  const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const black = rgb(0.08, 0.08, 0.08);
  const tableX = 70;
  const numberWidth = 28;
  const descriptionWidth = 235;
  const valueWidth = PAGE_WIDTH - tableX * 2 - numberWidth - descriptionWidth;
  const fontSize = 12;
  const lineHeight = 14;
  const padding = 3;
  let y = PAGE_HEIGHT - 72;
  const title = "VALUATION REPORT";
  page.drawText(title, { x: (PAGE_WIDTH - bold.widthOfTextAtSize(title, 10)) / 2, y, size: 10, font: bold, color: black });
  y -= 18;

  for (const row of pageTwoRows(valuation)) {
    const descriptionLines = wrap(row.description, regular, fontSize, descriptionWidth - padding * 2);
    const valueLines = wrap(row.value ?? "", regular, fontSize, valueWidth - padding * 2);
    const height = row.section
      ? lineHeight + padding * 2
      : Math.max(descriptionLines.length, valueLines.length, 1) * lineHeight + padding * 2;
    page.drawRectangle({ x: tableX, y: y - height, width: PAGE_WIDTH - tableX * 2, height, borderColor: black, borderWidth: 0.45 });
    if (row.section) {
      page.drawText(row.description, { x: tableX + numberWidth + padding, y: y - padding - fontSize, size: fontSize, font: bold, color: black });
    } else {
      page.drawLine({ start: { x: tableX + numberWidth, y }, end: { x: tableX + numberWidth, y: y - height }, thickness: 0.45, color: black });
      page.drawLine({ start: { x: tableX + numberWidth + descriptionWidth, y }, end: { x: tableX + numberWidth + descriptionWidth, y: y - height }, thickness: 0.45, color: black });
      if (row.number) page.drawText(row.number, { x: tableX + 8, y: y - padding - fontSize, size: fontSize, font: regular, color: black });
      descriptionLines.forEach((line, index) => page.drawText(line, { x: tableX + numberWidth + padding, y: y - padding - fontSize - index * lineHeight, size: fontSize, font: regular, color: black }));
      valueLines.forEach((line, index) => page.drawText(line, { x: tableX + numberWidth + descriptionWidth + padding, y: y - padding - fontSize - index * lineHeight, size: fontSize, font: row.placeholder ? bold : regular, color: row.placeholder ? rgb(0.8, 0, 0) : black }));
    }
    y -= height;
  }

  page.drawText("JBA Consulting & Advisory Services LLP", { x: 255, y: 28, size: 7, font: regular, color: rgb(0.45, 0.45, 0.45) });
}

function pageTwoDocxTable(
  valuation: MakerValuation,
  borders: { style: "single"; size: number; color: string },
  cellMargins: { top: number; bottom: number; left: number; right: number },
): Table {
  const cellBorders = { top: borders, bottom: borders, left: borders, right: borders };
  const rows = pageTwoRows(valuation).map((row) => {
    const cells = row.section
      ? [new TableCell({ columnSpan: 3, margins: cellMargins, borders: cellBorders, shading: { type: ShadingType.CLEAR, fill: "EDEDED" }, children: [new Paragraph({ children: [new TextRun({ text: row.description, bold: true, size: 24, font: "Arial" })] })] })]
      : [
          new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, margins: cellMargins, borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: row.number ?? "", size: 24, font: "Arial" })] })] }),
          new TableCell({ width: { size: 52, type: WidthType.PERCENTAGE }, margins: cellMargins, borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: row.description, size: 24, font: "Arial" })] })] }),
          new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, margins: cellMargins, borders: cellBorders, children: [new Paragraph({ children: row.placeholder ? [new TextRun({ text: row.value ?? "", size: 24, bold: true, color: "C00000", font: "Arial" })] : textRunsWithBreaks(row.value ?? "", 24) })] }),
        ];
    return new TableRow({ children: cells });
  });
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: borders, bottom: borders, left: borders, right: borders, insideHorizontal: borders, insideVertical: borders }, rows });
}

function pageThreeRows(valuation: MakerValuation): PageTwoRow[] {
  return [
    { description: "ii) Urban / Semi Urban / Rural", value: value(valuation.classOfLocality2) },
    { number: "9.", description: "Coming under Corporation / Village Panchayat / Municipality / CIDCO", value: value(valuation.municipalCorporation) },
    { number: "10.", description: "If leasehold, the name of lessee, nature of lease, dates of commencement and termination of lease and terms of renewal of lease.", value: value(valuation.typeOfLand) },
    { number: "11.", description: "Boundaries of the property", value: "As per site" },
    { description: "North", value: value(valuation.boundaryPropertyNorth) },
    { description: "South", value: value(valuation.boundaryPropertySouth) },
    { description: "East", value: value(valuation.boundaryPropertyEast) },
    { description: "West", value: value(valuation.boundaryPropertyWest) },
    { number: "12.", description: "Boundaries of the site", value: "A                 B\nAs per Deed       As Per Actuals" },
    { description: "North", value: value(valuation.boundarySiteNorth) },
    { description: "South", value: value(valuation.boundarySiteSouth) },
    { description: "East", value: value(valuation.boundarySiteEast) },
    { description: "West", value: value(valuation.boundarySiteWest) },
    { number: "13.", description: "Extent of the site", value: `Physical Measured Area: ${value(valuation.physicalMeasuredArea)} Sq.Ft.\nDocumented Area: ${value(valuation.documentedArea)} Sq.Ft.\nApproved Plan Area: ${value(valuation.approvedPlanArea)} Sq.Ft.\nBuilt Up Area: ${value(valuation.builtUpArea)} Sq.Ft.\nAdopted Area: ${value(valuation.adoptedArea)} Sq.Ft.` },
    { number: "14.", description: "Latitude, Longitude and Coordinates of the site", value: `Latitude: ${value(valuation.latitude)}\nLongitude: ${value(valuation.longitude)}` },
    { number: "15.", description: "Extent of the site considered for valuation", value: `Adopted Area: ${value(valuation.adoptedArea)} Sq.Ft.` },
    { number: "16.", description: "Whether occupied by the owner / tenant? If occupied by tenant, since how long? Rent received per month.", value: value(valuation.occupancy) },
    { description: "II.   APARTMENT BUILDING", section: true },
    { number: "1.", description: "Nature of the Apartment", value: `${value(valuation.configurationInShort)}\n${value(valuation.typeOfProperty)}\n${value(valuation.configurationFullDescription)}` },
    { number: "2.", description: "Location", value: value(valuation.location) },
    { description: "C.T.S. No.", value: value(valuation.ctsNo) },
    { description: "Block No.", value: value(valuation.blockNo) },
    { description: "Ward No.", value: value(valuation.wardNo) },
    { description: "Village / Municipality / Corporation / CIDCO", value: value(valuation.village) },
    { description: "Door No., Street or Road (Pin Code)", value: address(valuation) },
    { number: "3.", description: "Description of the locality Residential / Commercial /Mixed", value: value(valuation.location) },
  ];
}

function pageFourRows(valuation: MakerValuation): PageTwoRow[] {
  return [
    { number: "4.", description: "Year of Construction", value: value(valuation.yearOfConstruction) },
    { description: "Age of building", value: `${value(valuation.ageOfBuilding)} Years` },
    { description: "Residual Life of Building", value: `${value(valuation.residualLife)} Years (Subjected to periodic maintenance)` },
    { number: "5.", description: "Numbers of Floors", value: value(valuation.nosOfFloor) },
    { number: "6.", description: "Type of Structure", value: value(valuation.typeOfStructure) },
    { number: "7.", description: "Number of Dwelling units in the building", value: value(valuation.nosOfUnitPerFloor) },
    { number: "8.", description: "Quality of Construction", value: value(valuation.qualityOfConstruction) },
    { number: "9.", description: "Appearance of the Building", value: value(valuation.appearance) },
    { number: "10.", description: "Maintenance of Building", value: value(valuation.maintenance) },
    { number: "11.", description: "Facilities Available", value: "" },
    { description: "Lift", value: value(valuation.nosOfLifts) },
    { description: "Protected Water Supply", value: value(valuation.protectedWaterSupply) },
    { description: "Underground Sewerage", value: value(valuation.undergroundSewerage) },
    { description: "Car Parking – Open/Covered", value: `${value(valuation.nosOfParking)} / ${value(valuation.openCoveredParking)}` },
    { description: "Does Compound wall exist?", value: value(valuation.compoundWall) },
    { description: "Is pavement laid around the Building", value: value(valuation.pavementLaidAroundBuilding) },
    { description: "III.   FLAT", section: true },
    { number: "1.", description: "The floor on which the flat is situated", value: `${value(valuation.locatedOnFloor)} Floor` },
    { number: "2.", description: "Door No. of the flat", value: `Flat No. ${value(valuation.flatNo)}` },
    { number: "3.", description: "Specifications of the flat", value: "" },
    { description: "Roof", value: value(valuation.typeOfStructure) },
    { description: "Flooring", value: value(valuation.flooring) },
    { description: "Doors", value: value(valuation.doors) },
    { description: "Windows", value: value(valuation.windows) },
    { description: "Fittings", value: value(valuation.fittings) },
    { description: "Finishing", value: value(valuation.finishing) },
    { number: "4.", description: "House Tax", value: "" },
    { description: "Assessment No.", value: value(valuation.assessmentNo) },
    { description: "Tax Paid in the name of", value: value(valuation.taxPaidInNameOf) },
    { description: "Tax Amount", value: money(valuation.taxAmount) },
    { number: "5.", description: "Electricity Service Connection No.", value: value(valuation.electricityServiceConnectionNo) },
    { description: "Meter Card is in the name of", value: `${value(valuation.meterCardInNameOf)}\nDate: ${value(valuation.meterCardDated)}` },
    { number: "6.", description: "How is the Maintenance of the flat", value: value(valuation.maintenance) },
    { number: "7.", description: "Sale Deed executed in the name of", value: value(valuation.nameOfOwner) },
    { number: "8.", description: "What is the undivided area of land as per sale Deed?", value: value(valuation.undividedAreaOfLand) },
    { number: "9.", description: "What is the plinth area of the flat?", value: `Adopted Area: ${value(valuation.adoptedArea)} Sq.Ft.` },
    { number: "10.", description: "What is the floor space index (app.)", value: value(valuation.floorSpaceIndex) },
    { number: "11.", description: "What is the carpet area of the flat?", value: `Physical Measured Area: ${value(valuation.physicalMeasuredArea)} Sq.Ft.\nDocumented Area: ${value(valuation.documentedArea)} Sq.Ft.` },
    { number: "12.", description: "Is it Posh / class/Medium/ Ordinary?", value: value(valuation.classOfLocality3) },
    { number: "13.", description: "Is it being used for Residential or Commercial purpose?", value: value(valuation.typeOfProperty) },
    { number: "14.", description: "Is it Owner-occupied or let out?", value: value(valuation.occupancy) },
  ];
}

function renderStructuredPage(
  document: PDFDocument,
  regular: PDFFont,
  bold: PDFFont,
  rows: PageTwoRow[],
  pageNumber: number,
): void {
  const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const black = rgb(0.08, 0.08, 0.08);
  const tableX = 70;
  const numberWidth = 28;
  const descriptionWidth = 235;
  const valueWidth = PAGE_WIDTH - tableX * 2 - numberWidth - descriptionWidth;
  const fontSize = 12;
  const lineHeight = 14;
  const padding = 3;
  let y = PAGE_HEIGHT - 58;
  for (const row of rows) {
    const descriptionLines = wrap(row.description, regular, fontSize, descriptionWidth - padding * 2);
    const valueLines = wrap(row.value ?? "", regular, fontSize, valueWidth - padding * 2);
    const height = row.section ? lineHeight + padding * 2 : Math.max(descriptionLines.length, valueLines.length, 1) * lineHeight + padding * 2;
    if (y - height < 42) break;
    page.drawRectangle({ x: tableX, y: y - height, width: PAGE_WIDTH - tableX * 2, height, borderColor: black, borderWidth: 0.45 });
    if (row.section) {
      page.drawText(row.description, { x: tableX + numberWidth + padding, y: y - padding - fontSize, size: fontSize, font: bold, color: black });
    } else {
      page.drawLine({ start: { x: tableX + numberWidth, y }, end: { x: tableX + numberWidth, y: y - height }, thickness: 0.45, color: black });
      page.drawLine({ start: { x: tableX + numberWidth + descriptionWidth, y }, end: { x: tableX + numberWidth + descriptionWidth, y: y - height }, thickness: 0.45, color: black });
      if (row.number) page.drawText(row.number, { x: tableX + 8, y: y - padding - fontSize, size: fontSize, font: regular, color: black });
      descriptionLines.forEach((line, index) => page.drawText(line, { x: tableX + numberWidth + padding, y: y - padding - fontSize - index * lineHeight, size: fontSize, font: regular, color: black }));
      valueLines.forEach((line, index) => page.drawText(line, { x: tableX + numberWidth + descriptionWidth + padding, y: y - padding - fontSize - index * lineHeight, size: fontSize, font: row.placeholder ? bold : regular, color: row.placeholder ? rgb(0.8, 0, 0) : black }));
    }
    y -= height;
  }
  page.drawText("JBA Consulting & Advisory Services LLP", { x: 255, y: 28, size: 7, font: regular, color: rgb(0.45, 0.45, 0.45) });
}

function structuredDocxTable(
  rows: PageTwoRow[],
  borders: { style: "single"; size: number; color: string },
  cellMargins: { top: number; bottom: number; left: number; right: number },
): Table {
  const cellBorders = { top: borders, bottom: borders, left: borders, right: borders };
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: borders, bottom: borders, left: borders, right: borders, insideHorizontal: borders, insideVertical: borders }, rows: rows.map((row) => {
    if (row.section) return new TableRow({ children: [new TableCell({ columnSpan: 3, margins: cellMargins, borders: cellBorders, shading: { type: ShadingType.CLEAR, fill: "EDEDED" }, children: [new Paragraph({ children: [new TextRun({ text: row.description, bold: true, size: 24, font: "Arial" })] })] })] });
    return new TableRow({ children: [
      new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, margins: cellMargins, borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: row.number ?? "", size: 24, font: "Arial" })] })] }),
      new TableCell({ width: { size: 52, type: WidthType.PERCENTAGE }, margins: cellMargins, borders: cellBorders, children: [new Paragraph({ children: textRunsWithBreaks(row.description, 24) })] }),
      new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, margins: cellMargins, borders: cellBorders, children: [new Paragraph({ children: row.placeholder ? [new TextRun({ text: row.value ?? "", size: 24, bold: true, color: "C00000", font: "Arial" })] : textRunsWithBreaks(row.value ?? "", 24) })] }),
    ] });
  }) });
}

function pageFiveRows(valuation: MakerValuation): PageTwoRow[] {
  return [
    { description: "IV.   MARKETABILITY", section: true },
    { number: "1.", description: "How is the marketability", value: value(valuation.marketability) },
    { number: "2.", description: "What are the factors favoring for an extra potential value?", value: value(valuation.positiveFactors) },
    { number: "3.", description: "Any negative factors are observed which affect the market value in general?", value: value(valuation.negativeFactors) },
    { description: "V.   RATE", section: true },
    { number: "1.", description: "After analyzing the comparable sale instances, what is the composite rate for similar flat with same specifications in the adjoining locality? (Along with details of reference of at least two latest deals/transactions with respect to adjacent properties in the areas)", value: `Prevailing rate of flats in the locality is Rs. ${value(valuation.rateRange)} /- to Rs. ${value(valuation.rateRange)} /- Per Sq. ft. on BUA` },
    { number: "2.", description: "Assuming it is a new construction, what is the adopted basic composite rate of the flat under valuation after comparing with the specifications and other factors with the flat under comparison (give details).", value: `Rs. ${value(valuation.adoptedRate)} /- Per Sq. ft. on BUA` },
    { number: "3.", description: "Break-up for the rate", value: "" },
    { description: "i) Building", value: `Rs. ${value(valuation.buildingRate)} /-` },
    { description: "ii) Land", value: `Rs. ${value(valuation.landRate)} /-` },
    { number: "4.", description: "Guideline rate obtained from registrar office (evidence thereof to be enclosed)", value: `Rs. ${value(valuation.govtReadyReckonerRatePerSqMtr)} /- Per Sq. mtr.\nRs. ${value(valuation.govtReadyReckonerRatePerSqFt)} /- Per Sq. ft.` },
    { description: "VI.   COMPOSITE RATE ADOPTED AFTER DEPRECIATION", section: true },
    { description: "a.", value: "" },
    { description: "Depreciated building rate", value: `Rs. ${value(valuation.buildingRate)} /-` },
    { description: "Replacement cost / Insurance Value of Flat with Services / Insurance Value (v (3) ii)", value: `Rs. ${value(valuation.insuranceValue)} /-` },
    { description: "Age of the building", value: `${value(valuation.ageOfBuilding)} Years` },
    { description: "Life of the building estimated", value: `${value(valuation.residualLife)} Years (Subject to proper maintenance)` },
    { description: "Actual works completed", value: "{{Stage of Construction %}}", placeholder: true },
    { description: "Depreciation percentage assuming salvage value as 15% say", value: "{{deperciation percentage}}", placeholder: true },
    { description: "Depreciated Ratio of the building", value: "N.A." },
    { description: "b. Total composite rate arrived for valuation", value: "" },
    { description: "Depreciated building rate (V (a))", value: `Rs. ${value(valuation.buildingRate)} /-` },
    { description: "Rate for Land and other V (3) ii", value: `Rs. ${value(valuation.landRate)} /-` },
    { description: "Total Composite Rate", value: `Rs. ${value(valuation.adoptedRate)} /- Per Sq. ft. on BUA` },
  ];
}

type AnnexureRow = { number: string; particulars: string; comment: string };

function annexureRows(valuation: MakerValuation): AnnexureRow[] {
  return [
    { number: "1", particulars: "background information of the asset being valued;", comment: `The property under consideration is Owned by ${value(valuation.nameOfOwner)}` },
    { number: "2", particulars: "purpose of valuation and appointing authority", comment: `As per the request from ${value(valuation.bankName)} (${value(valuation.branch)}) Branch, to assess fair market value of the property for Bank purpose.` },
    { number: "3", particulars: "identity of the valuer and any other experts involved in the valuation;", comment: `Er. Prasanna Bhat – Reg. Valuer / Name of Engineer – ${value(valuation.engineerName)} / Name of Processing Officer – ${value(valuation.processingOfficerName)}` },
    { number: "4", particulars: "disclosure of valuer interest or conflict, if any;", comment: "We have no interest, either direct or indirect, in the property valued. Further, to state that we do not have relation or any connection with property owner / applicant directly or indirectly." },
    { number: "5", particulars: "date of appointment, valuation date and date of report;", comment: `Date of Appointment – ${value(valuation.dateOfValuation)}\nInspection Date – ${value(valuation.dateOfInspection)}\nValuation Date – ${value(valuation.dateOfValuation)}` },
    { number: "6", particulars: "inspections and/or investigations undertaken;", comment: `Physical inspection done on ${value(valuation.dateOfInspection)}` },
    { number: "7", particulars: "nature and sources of the information used or relied upon;", comment: "Market survey at the time of site visit / Online Price Indicators on real estate portals / Enquiries with Real estate agents / Ready Reckoner rates / Circle rates / Online Search for Registered Transactions" },
    { number: "8", particulars: "procedures adopted in carrying out the valuation and valuation standards followed;", comment: "Sales Comparison Method" },
    { number: "9", particulars: "restrictions on use of the report, if any;", comment: "Our Valuation is only for the use of the party to whom it is addressed and no responsibility is accepted to any third party for the whole or any part of its contents. The said report will not hold good / should not be used for any court / legal matters." },
    { number: "10", particulars: "major factors that were taken into account during the valuation;", comment: "Current Market conditions, demand and supply position, location, upswing in real estate prices, sustained demand for Residential flat, all round development of Industrial, commercial and residential application in the locality etc." },
    { number: "12", particulars: "Caveats, limitations and disclaimers to the extent they explain or elucidate the limitations faced by valuer, which shall not be for the purpose of implying responsibility for the valuation report.", comment: "Attached" },
  ];
}

function annexureParagraphs(valuation: MakerValuation): string[] {
  return [
    "I hereby declare that",
    `a) The information furnished in my valuation report dated ${value(valuation.dateOfValuation)} is true and correct to the best of my knowledge and belief and I have made an impartial and true valuation of the property.`,
    "b) I have no direct or indirect interest in the property valued;",
    `c) I have personally inspected the property on ${value(valuation.dateOfInspection)}. The work is not subcontracted to any other valuer and carried out by myself.`,
    "d) I have not been convicted of any offence and sentenced to a term of imprisonment;",
    "e) I have not been found guilty of misconduct in my professional capacity.",
    "f) I have read the IBA Circular No. LEGAL/CIR/9229 dated 10.04.2014 on Creation of Portal/Central Registry for Collecting and Disseminating Details of Recalcitrant Chartered Accountants, Advocates and Valuers and understand that same is adopted by the Bank and agree to be bound by the same",
    "g) I have read the International Valuation Standards (IVS) and the report submitted to the Bank for the respective asset class is in conformity to the Standards as enshrined for valuation in the IVS in General Standards and Standards as applicable.",
    "h) I abide by the Model Code of Conduct for employment of valuer in the Bank.",
    "i) I am registered under Section 34AB of the Wealth Tax Act, 1957.",
    "j) I am the proprietor / partner / authorized official of the firm / company, who is competent to sign this valuation report.",
    "k) Further, I hereby provide the following information.",
    "l) I/we have inspected and valued the right property.",
  ];
}

function renderAnnexurePdf(document: PDFDocument, regular: PDFFont, bold: PDFFont, valuation: MakerValuation): void {
  const black = rgb(0.08, 0.08, 0.08);
  const red = rgb(0.8, 0, 0);
  const tableX = 70;
  const tableWidth = PAGE_WIDTH - tableX * 2;
  const colWidths: [number, number, number] = [30, 205, tableWidth - 235];
  const fontSize = 9;
  const lineHeight = 10.5;
  const padding = 4;
  let page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 70;

  const newPage = () => {
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - 70;
  };

  const drawRow = (row: AnnexureRow) => {
    const leftLines = wrap(row.particulars, regular, fontSize, colWidths[1] - padding * 2);
    const rightLines = wrap(row.comment, regular, fontSize, colWidths[2] - padding * 2);
    const height = Math.max(leftLines.length, rightLines.length, 1) * lineHeight + padding * 2;
    if (y - height < 55) newPage();
    page.drawRectangle({ x: tableX, y: y - height, width: tableWidth, height, borderColor: black, borderWidth: 0.45 });
    page.drawLine({ start: { x: tableX + colWidths[0], y }, end: { x: tableX + colWidths[0], y: y - height }, thickness: 0.45, color: black });
    page.drawLine({ start: { x: tableX + colWidths[0] + colWidths[1], y }, end: { x: tableX + colWidths[0] + colWidths[1], y: y - height }, thickness: 0.45, color: black });
    page.drawText(row.number, { x: tableX + 8, y: y - padding - fontSize, size: fontSize, font: regular, color: black });
    leftLines.forEach((line, index) => page.drawText(line, { x: tableX + colWidths[0] + padding, y: y - padding - fontSize - index * lineHeight, size: fontSize, font: regular, color: black }));
    rightLines.forEach((line, index) => page.drawText(line, { x: tableX + colWidths[0] + colWidths[1] + padding, y: y - padding - fontSize - index * lineHeight, size: fontSize, font: regular, color: black }));
    y -= height;
  };

  const heading = "Annexure A";
  page.drawText(heading, { x: (PAGE_WIDTH - bold.widthOfTextAtSize(heading, 11)) / 2, y, size: 11, font: bold, color: black });
  y -= 15;
  const subheading = "DECLARATION FROM VALUERS";
  page.drawText(subheading, { x: (PAGE_WIDTH - bold.widthOfTextAtSize(subheading, 11)) / 2, y, size: 11, font: bold, color: black });
  y -= 22;
  for (const paragraph of annexureParagraphs(valuation)) {
    const lines = wrap(paragraph, regular, 9, PAGE_WIDTH - 120);
    for (const line of lines) {
      if (y < 55) newPage();
      page.drawText(line, { x: 70, y, size: 9, font: regular, color: black });
      y -= 10;
    }
    y -= 3;
  }

  y -= 5;
  for (const row of annexureRows(valuation)) drawRow(row);

  if (y < 175) newPage();
  y -= 25;
  page.drawText(`Date: ${value(valuation.dateOfValuation)}`, { x: 70, y, size: 9, font: bold, color: red });
  page.drawText("Place: Mumbai", { x: 70, y: y - 14, size: 9, font: bold, color: black });
  page.drawText("JBA Consulting & Advisory Services LLP", { x: 350, y, size: 9, font: regular, color: black });
  page.drawText("Authorised Signature", { x: 400, y: y - 50, size: 9, font: bold, color: black });
  page.drawText("(Approved panel valuer)", { x: 395, y: y - 64, size: 8, font: regular, color: black });
  page.drawText(`The undersigned has inspected the property detailed in the Valuation Report dated ${value(valuation.dateOfValuation)}.`, { x: 70, y: y - 108, size: 9, font: regular, color: black });
}

function renderPropertyPhotosPage(document: PDFDocument, regular: PDFFont, bold: PDFFont): void {
  const page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const title = "Property Photos";
  page.drawText(title, {
    x: (PAGE_WIDTH - bold.widthOfTextAtSize(title, 24)) / 2,
    y: PAGE_HEIGHT - 90,
    size: 16,
    font: bold,
    color: rgb(0.08, 0.08, 0.08),
  });
  page.drawText("JBA Consulting & Advisory Services LLP", {
    x: 255,
    y: 28,
    size: 7,
    font: regular,
    color: rgb(0.45, 0.45, 0.45),
  });
}

function addDynamicPageNumbers(document: PDFDocument, regular: PDFFont): void {
  const pages = document.getPages();
  pages.forEach((page, index) => {
    page.drawText(`Page ${index + 1} of ${pages.length}`, {
      x: 54,
      y: 28,
      size: 7,
      font: regular,
      color: rgb(0.08, 0.08, 0.08),
    });
  });
}

function annexureDocxTable(
  valuation: MakerValuation,
  borders: { style: "single"; size: number; color: string },
  cellMargins: { top: number; bottom: number; left: number; right: number },
): Table {
  const cellBorders = { top: borders, bottom: borders, left: borders, right: borders };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: borders, bottom: borders, left: borders, right: borders, insideHorizontal: borders, insideVertical: borders },
    rows: annexureRows(valuation).map((row) => new TableRow({ children: [
      new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, margins: cellMargins, borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: row.number, size: 24, font: "Arial" })] })] }),
      new TableCell({ width: { size: 42, type: WidthType.PERCENTAGE }, margins: cellMargins, borders: cellBorders, children: [new Paragraph({ children: textRunsWithBreaks(row.particulars, 24) })] }),
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, margins: cellMargins, borders: cellBorders, children: [new Paragraph({ children: emphasizedTextRuns(row.comment, annexureMappedValues(valuation, row.number), 24) })] }),
    ] })),
  });
}

function emphasizedTextRuns(text: string, values: string[], size: number): TextRun[] {
  const targets = values.filter((item) => item && item !== EM_DASH);
  return text.split(/\r?\n/).flatMap((line, lineIndex) => {
    const runs: TextRun[] = [];
    let cursor = 0;
    while (cursor < line.length) {
      let matchIndex = line.length;
      let matchValue = "";
      for (const target of targets) {
        const index = line.indexOf(target, cursor);
        if (index >= 0 && index < matchIndex) {
          matchIndex = index;
          matchValue = target;
        }
      }
      if (!matchValue) {
        runs.push(new TextRun({ text: line.slice(cursor), size, font: "Arial" }));
        break;
      }
      if (matchIndex > cursor) runs.push(new TextRun({ text: line.slice(cursor, matchIndex), size, font: "Arial" }));
      runs.push(new TextRun({ text: matchValue, size, bold: true, font: "Arial" }));
      cursor = matchIndex + matchValue.length;
    }
    if (lineIndex > 0) runs.unshift(new TextRun({ break: 1 }));
    return runs;
  });
}

function annexureMappedValues(valuation: MakerValuation, rowNumber: string): string[] {
  switch (rowNumber) {
    case "1": return [value(valuation.nameOfOwner)];
    case "2": return [value(valuation.bankName), value(valuation.branch)];
    case "3": return [value(valuation.engineerName), value(valuation.processingOfficerName)];
    case "5": return [value(valuation.dateOfValuation), value(valuation.dateOfInspection)];
    case "6": return [value(valuation.dateOfInspection)];
    default: return [];
  }
}
