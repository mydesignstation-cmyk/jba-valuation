/**
 * Server-only Maker Valuation PDF builder.
 *
 * Generates a minimal PDF containing only the 5 Basic Details fields.
 * Returns PDF as base64 string for storage in the database.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatDisplayDate } from "@/lib/date-format";
import type { MakerValuation } from "@/types";

// --- Layout constants ---
const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LABEL_WIDTH = 190;
const VALUE_X = MARGIN + LABEL_WIDTH + 12;
const VALUE_WIDTH = PAGE_WIDTH - MARGIN - VALUE_X;

const COLOR_TEXT = rgb(0.13, 0.13, 0.15);
const COLOR_HEADING = rgb(0.11, 0.31, 0.53);
const COLOR_RULE = rgb(0.82, 0.85, 0.89);
const COLOR_BAND = rgb(0.93, 0.95, 0.98);

const EM_DASH = "\u2014";

/** Coerce value to display string. */
function show(value: unknown): string {
  if (value === undefined || value === null) return EM_DASH;
  const s = String(value).trim();
  return s.length > 0 ? s : EM_DASH;
}

/**
 * Minimal cursor-based PDF writer for Maker Valuation.
 */
class ValuationWriter {
  private doc: PDFDocument;
  private font: PDFFont;
  private bold: PDFFont;
  private page: PDFPage;
  private y: number;

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

  private wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private drawLine(y: number) {
    this.page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: COLOR_RULE,
    });
  }

  private drawSectionHeader(title: string): void {
    const lineSpacing = 24;
    this.page.drawText(title, {
      x: MARGIN,
      y: this.y,
      size: 13,
      font: this.bold,
      color: COLOR_HEADING,
    });
    this.y -= lineSpacing;
    this.drawLine(this.y);
    this.y -= 12;
  }

  private drawRow(label: string, value: string): void {
    const lineHeight = 20;
    const fontSize = 11;

    // Wrap value if needed
    const valueLines = this.wrap(value, this.font, fontSize, VALUE_WIDTH);

    // Draw label
    this.page.drawText(label, {
      x: MARGIN,
      y: this.y,
      size: fontSize,
      font: this.bold,
      color: COLOR_TEXT,
    });

    // Draw value lines
    for (let i = 0; i < valueLines.length; i++) {
      const line = valueLines[i];
      if (!line) continue;
      this.page.drawText(line, {
        x: VALUE_X,
        y: this.y - i * lineHeight,
        size: fontSize,
        font: this.font,
        color: COLOR_TEXT,
      });
    }

    this.y -= lineHeight * Math.max(valueLines.length, 1) + 4;
  }

  async finalize(): Promise<string> {
    const pdfBytes = await this.doc.save();
    return Buffer.from(pdfBytes).toString("base64");
  }

  async render(valuation: MakerValuation): Promise<void> {
    // Title
    this.page.drawText("Maker Valuation — Basic Details", {
      x: MARGIN,
      y: this.y,
      size: 16,
      font: this.bold,
      color: COLOR_HEADING,
    });
    this.y -= 28;

    // Basic Details section
    this.drawSectionHeader("Basic Details");

    // Draw the 5 fields
    this.drawRow("Date of Valuation", formatDisplayDate(valuation.dateOfValuation));
    this.drawRow("Date of Inspection", formatDisplayDate(valuation.dateOfInspection));
    this.drawRow("Ref. No.", show(valuation.refNo));
    this.drawRow("Branch", show(valuation.branch));
    this.drawRow("Bank Name", show(valuation.bankName));

    // Add generated timestamp at bottom
    this.y -= 20;
    this.drawLine(this.y);
    this.y -= 12;
    this.page.drawText(`Generated: ${new Date().toLocaleString("en-GB")}`, {
      x: MARGIN,
      y: this.y,
      size: 9,
      font: this.font,
      color: rgb(0.6, 0.6, 0.6),
    });
  }
}

/**
 * Generate Maker Valuation PDF as base64 string.
 */
export async function generateMakerValuationPdf(
  valuation: MakerValuation,
): Promise<string> {
  const writer = await ValuationWriter.create();
  await writer.render(valuation);
  return await writer.finalize();
}
