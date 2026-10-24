/**
 * Server-only Maker Valuation PDF builder.
 *
 * Renders the complete canonical Maker Valuation field inventory with section
 * headings, wrapped content, and page breaks for readable saved reports.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatDisplayDate } from "@/lib/date-format";
import { makerValuationSections, type MakerValuationFieldKey } from "@/lib/makerValuationFields";
import type { MakerValuation } from "@/types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const LABEL_WIDTH = 188;
const VALUE_X = MARGIN + LABEL_WIDTH + 12;
const VALUE_WIDTH = PAGE_WIDTH - MARGIN - VALUE_X;
const COLOR_TEXT = rgb(0.13, 0.13, 0.15);
const COLOR_MUTED = rgb(0.3, 0.3, 0.34);
const EM_DASH = "\u2014";
const BODY_FONT_SIZE = 10;
const LINE_HEIGHT = 14;

const monetaryFieldKeys = new Set<MakerValuationFieldKey>([
  "rateRange",
  "adoptedRate",
  "buildingRate",
  "landRate",
  "carParkingValue",
  "govtReadyReckonerRatePerSqMtr",
  "govtReadyReckonerRatePerSqFt",
  "rentRangePerMonth",
  "insuranceValue",
  "marketValue",
  "fairMarketValue",
  "realizableValue",
  "distressValue",
  "govtValue",
]);

function show(value: unknown): string {
  if (value === undefined || value === null) return EM_DASH;
  const text = String(value).trim();
  return text.length > 0 ? text : EM_DASH;
}

function formatMonetaryValue(value: string): string {
  const numericValue = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(numericValue)) return value;

  return `Rs. ${numericValue.toLocaleString("en-IN", {
    minimumFractionDigits: value.includes(".") ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function splitLongWord(word: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const chunks: string[] = [];
  let chunk = "";

  for (const character of word) {
    const candidate = chunk + character;
    if (chunk && font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
      chunks.push(chunk);
      chunk = character;
    } else {
      chunk = candidate;
    }
  }

  if (chunk) chunks.push(chunk);
  return chunks.length > 0 ? chunks : [""];
}

function wrapParagraph(
  paragraph: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const words = paragraph.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
      if (current) {
        lines.push(current);
        current = "";
      }
      lines.push(...splitLongWord(word, font, fontSize, maxWidth));
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((paragraph) => wrapParagraph(paragraph, font, fontSize, maxWidth));
}

class ValuationWriter {
  private readonly doc: PDFDocument;
  private readonly font: PDFFont;
  private readonly bold: PDFFont;
  private page: PDFPage;
  private y: number;
  private readonly bottomMargin = 48;

  private constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.font = font;
    this.bold = bold;
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  static async create(): Promise<ValuationWriter> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    return new ValuationWriter(doc, font, bold);
  }

  private newPage(): void {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensureSpace(height: number): void {
    if (this.y < PAGE_HEIGHT - MARGIN && this.y - height < this.bottomMargin) {
      this.newPage();
    }
  }

  private drawSectionHeading(title: string): void {
    this.ensureSpace(30);
    this.page.drawText(title, {
      x: MARGIN,
      y: this.y,
      size: 13,
      font: this.bold,
      color: COLOR_TEXT,
    });
    this.y -= 20;
  }

  private drawRow(label: string, value: string): void {
    const labelLines = wrapText(label, this.bold, BODY_FONT_SIZE, LABEL_WIDTH);
    const valueLines = wrapText(value, this.font, BODY_FONT_SIZE, VALUE_WIDTH);
    const lineCount = Math.max(labelLines.length, valueLines.length);
    const rowHeight = lineCount * LINE_HEIGHT + 6;

    this.ensureSpace(Math.min(rowHeight, PAGE_HEIGHT - MARGIN - this.bottomMargin));

    for (let index = 0; index < lineCount; index += 1) {
      if (this.y - LINE_HEIGHT < this.bottomMargin) this.newPage();

      const labelLine = labelLines[index];
      const valueLine = valueLines[index];
      if (labelLine) {
        this.page.drawText(labelLine, {
          x: MARGIN,
          y: this.y,
          size: BODY_FONT_SIZE,
          font: this.bold,
          color: COLOR_TEXT,
        });
      }
      if (valueLine) {
        this.page.drawText(valueLine, {
          x: VALUE_X,
          y: this.y,
          size: BODY_FONT_SIZE,
          font: this.font,
          color: COLOR_TEXT,
        });
      }
      this.y -= LINE_HEIGHT;
    }

    this.y -= 6;
  }

  private displayValue(valuation: MakerValuation, key: MakerValuationFieldKey): string {
    const value = valuation[key];
    const displayed = show(value);
    if (displayed === EM_DASH) return displayed;
    if (key === "dateOfValuation" || key === "dateOfInspection") {
      return formatDisplayDate(displayed);
    }
    return monetaryFieldKeys.has(key) ? formatMonetaryValue(displayed) : displayed;
  }

  async render(valuation: MakerValuation): Promise<void> {
    this.page.drawText("Maker Valuation", {
      x: MARGIN,
      y: this.y,
      size: 16,
      font: this.bold,
      color: COLOR_TEXT,
    });
    this.y -= 28;

    for (const section of makerValuationSections) {
      this.drawSectionHeading(section.title);
      for (const field of section.fields) {
        this.drawRow(field.label, this.displayValue(valuation, field.key));
      }
      this.y -= 8;
    }
  }

  async finalize(): Promise<string> {
    const pdfBytes = await this.doc.save();
    return Buffer.from(pdfBytes).toString("base64");
  }
}

export async function generateMakerValuationPdf(valuation: MakerValuation): Promise<string> {
  const writer = await ValuationWriter.create();
  await writer.render(valuation);
  return writer.finalize();
}
