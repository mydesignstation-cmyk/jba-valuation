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
const LABEL_WIDTH = 180;
const VALUE_X = MARGIN + LABEL_WIDTH + 12;

const COLOR_TEXT = rgb(0.13, 0.13, 0.15);

const EM_DASH = "\u2014";

/** Coerce value to display string. */
function show(value: unknown): string {
  if (value === undefined || value === null) return EM_DASH;
  const s = String(value).trim();
  return s.length > 0 ? s : EM_DASH;
}

/**
 * Minimal PDF writer for Maker Valuation: 5 Basic Details fields only.
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

  private drawRow(label: string, value: string): void {
    const lineHeight = 18;
    const fontSize = 11;

    // Draw label
    this.page.drawText(label, {
      x: MARGIN,
      y: this.y,
      size: fontSize,
      font: this.bold,
      color: COLOR_TEXT,
    });

    // Draw value
    this.page.drawText(value, {
      x: VALUE_X,
      y: this.y,
      size: fontSize,
      font: this.font,
      color: COLOR_TEXT,
    });

    this.y -= lineHeight;
  }

  async finalize(): Promise<string> {
    const pdfBytes = await this.doc.save();
    return Buffer.from(pdfBytes).toString("base64");
  }

  async render(valuation: MakerValuation): Promise<void> {
    // Draw the 5 fields only, nothing else
    this.drawRow("Date of Valuation", formatDisplayDate(valuation.dateOfValuation));
    this.drawRow("Date of Inspection", formatDisplayDate(valuation.dateOfInspection));
    this.drawRow("Ref. No.", show(valuation.refNo));
    this.drawRow("Branch", show(valuation.branch));
    this.drawRow("Bank Name", show(valuation.bankName));
  }
}

/**
 * Generate Maker Valuation PDF as base64 string.
 * Contains only the 5 Basic Details fields.
 */
export async function generateMakerValuationPdf(
  valuation: MakerValuation,
): Promise<string> {
  const writer = await ValuationWriter.create();
  await writer.render(valuation);
  return await writer.finalize();
}
