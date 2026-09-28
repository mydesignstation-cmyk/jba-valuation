/**
 * Server-only Field Visit PDF builder.
 *
 * Pure rendering: given the already-loaded Field Visit and its Case-derived
 * header data, produce a professional valuation-report PDF as raw bytes using
 * pdf-lib (pure JS, no native/font-asset dependencies — safe in the Nitro /
 * serverless build). This module NEVER touches the database and NEVER stores
 * anything: the caller (api.server.ts) reads the latest data from Neon at
 * request time and hands it here, so every download reflects the current
 * saved values.
 *
 * Only fields that actually exist on the Field Visit / Case are rendered; no
 * data is invented. Missing values render as an em dash.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { FieldVisit } from "@/types";

/** Case-derived header values (same shape the UI already builds). */
export interface FieldVisitPdfHeader {
  caseNumber: string;
  requestNumber: string;
  bankName: string;
  customerName: string;
  address: string;
}

/** A single label/value pair rendered as a row within a section. */
interface FieldRow {
  label: string;
  value: string;
}

// --- Layout constants ------------------------------------------------------

const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LABEL_WIDTH = 190; // left column for labels
const VALUE_X = MARGIN + LABEL_WIDTH + 12;
const VALUE_WIDTH = PAGE_WIDTH - MARGIN - VALUE_X;

const COLOR_TEXT = rgb(0.13, 0.13, 0.15);
const COLOR_MUTED = rgb(0.42, 0.45, 0.5);
const COLOR_HEADING = rgb(0.11, 0.31, 0.53);
const COLOR_RULE = rgb(0.82, 0.85, 0.89);
const COLOR_BAND = rgb(0.93, 0.95, 0.98);

const EM_DASH = "\u2014";

/** Coerce any optional value to a display string, using an em dash when empty. */
function show(value: unknown): string {
  if (value === undefined || value === null) return EM_DASH;
  const s = String(value).trim();
  return s.length > 0 ? s : EM_DASH;
}

/**
 * A tiny cursor-based writer over one or more PDF pages. Handles wrapping,
 * section bands, key/value rows, and automatic page breaks.
 */
class ReportWriter {
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

  static async create(): Promise<ReportWriter> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    return new ReportWriter(doc, font, bold);
  }

  /** Split text into lines that fit within maxWidth at the given font size. */
  private wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.length > 0 ? lines : [""];
  }

  /** Ensure at least `needed` vertical points remain; otherwise new page. */
  private ensureSpace(needed: number) {
    if (this.y - needed < MARGIN) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }

  /** Report title + subtitle block at the top of the first page. */
  drawTitle(title: string, subtitle: string) {
    this.page.drawText(title, {
      x: MARGIN,
      y: this.y - 20,
      size: 20,
      font: this.bold,
      color: COLOR_HEADING,
    });
    this.y -= 30;
    this.page.drawText(subtitle, {
      x: MARGIN,
      y: this.y - 12,
      size: 10,
      font: this.font,
      color: COLOR_MUTED,
    });
    this.y -= 22;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 1.2,
      color: COLOR_HEADING,
    });
    this.y -= 18;
  }

  /** A section heading rendered as a light band with bold text. */
  drawSectionHeading(text: string) {
    this.ensureSpace(40);
    const bandHeight = 20;
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - bandHeight + 4,
      width: CONTENT_WIDTH,
      height: bandHeight,
      color: COLOR_BAND,
    });
    this.page.drawText(text, {
      x: MARGIN + 8,
      y: this.y - bandHeight + 10,
      size: 11,
      font: this.bold,
      color: COLOR_HEADING,
    });
    this.y -= bandHeight + 8;
  }

  /** A label/value row. Value wraps within the right column. */
  drawRow(label: string, value: string) {
    const size = 10;
    const lineHeight = 14;
    const valueLines = this.wrap(value, this.font, size, VALUE_WIDTH);
    const rowHeight = Math.max(lineHeight, valueLines.length * lineHeight);

    this.ensureSpace(rowHeight + 4);

    // Label (top-aligned with the first value line).
    this.page.drawText(label, {
      x: MARGIN,
      y: this.y - size,
      size,
      font: this.bold,
      color: COLOR_MUTED,
    });

    // Value lines.
    let lineY = this.y - size;
    for (const line of valueLines) {
      this.page.drawText(line, {
        x: VALUE_X,
        y: lineY,
        size,
        font: this.font,
        color: COLOR_TEXT,
      });
      lineY -= lineHeight;
    }

    this.y -= rowHeight + 4;

    // Thin separator between rows.
    this.page.drawLine({
      start: { x: MARGIN, y: this.y + 2 },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y + 2 },
      thickness: 0.5,
      color: COLOR_RULE,
    });
    this.y -= 4;
  }

  /** Render a whole section: heading followed by its rows. */
  drawSection(title: string, rows: FieldRow[]) {
    this.drawSectionHeading(title);
    for (const row of rows) {
      this.drawRow(row.label, row.value);
    }
    this.y -= 8;
  }

  async toBytes(): Promise<Uint8Array> {
    return this.doc.save();
  }
}

/**
 * Build the Field Visit PDF from the latest saved data.
 * Returns raw PDF bytes; the caller base64-encodes for JSON transport.
 */
export async function buildFieldVisitPdf(
  visit: FieldVisit,
  header: FieldVisitPdfHeader,
): Promise<Uint8Array> {
  const writer = await ReportWriter.create();

  const generatedOn = new Date().toLocaleString();
  writer.drawTitle(
    "Field Visit Report",
    `Case ${show(header.caseNumber)}  \u2022  Generated ${generatedOn}`,
  );

  const gps =
    visit.gpsLatitude != null && visit.gpsLongitude != null
      ? `${visit.gpsLatitude}, ${visit.gpsLongitude}`
      : EM_DASH;
  const submittedOn = visit.submittedAt ? new Date(visit.submittedAt).toLocaleString() : EM_DASH;

  writer.drawSection("Case Details", [
    { label: "Case Number", value: show(header.caseNumber) },
    { label: "Request Number", value: show(header.requestNumber) },
    { label: "Bank Name", value: show(header.bankName) },
    { label: "Customer Name", value: show(header.customerName) },
    { label: "Property Address", value: show(header.address) },
  ]);

  writer.drawSection("Visit Details", [
    { label: "Date of Visit", value: show(visit.visitDate) },
    { label: "GPS Latitude", value: show(visit.gpsLatitude) },
    { label: "GPS Longitude", value: show(visit.gpsLongitude) },
    { label: "GPS Location", value: gps },
    { label: "Person Met", value: show(visit.personMet) },
    { label: "Phone Number", value: show(visit.personPhone) },
    { label: "Relationship with Property", value: show(visit.relationship) },
  ]);

  writer.drawSection("Property Details", [
    { label: "Landmark", value: show(visit.landmark) },
    { label: "Property Type", value: show(visit.propertyType) },
    { label: "Locality", value: show(visit.localityType) },
    { label: "Occupancy Status", value: show(visit.occupancyStatus) },
  ]);

  writer.drawSection("Building Details", [
    { label: "Type of Structure", value: show(visit.structureType) },
    { label: "Occupancy Level", value: show(visit.occupancyLevel) },
    { label: "Total Floors", value: show(visit.floorsInBuilding) },
    { label: "Located Floor", value: show(visit.locatedOnFloor) },
    { label: "Flats on Floor", value: show(visit.flatsOnFloor) },
    { label: "Wings", value: show(visit.wingsInBuilding) },
    { label: "Lifts/Staircases", value: show(visit.liftsStaircases) },
  ]);

  writer.drawSection("Construction", [
    { label: "Year of Construction", value: show(visit.yearOfConstruction) },
    { label: "Construction Stage", value: show(visit.constructionStage) },
    { label: "Description of Work", value: show(visit.workDescription) },
  ]);

  writer.drawSection("Boundaries", [
    { label: "East", value: show(visit.boundaryEast) },
    { label: "West", value: show(visit.boundaryWest) },
    { label: "North", value: show(visit.boundaryNorth) },
    { label: "South", value: show(visit.boundarySouth) },
  ]);

  writer.drawSection("Assessment", [
    { label: "Approach Road Condition", value: show(visit.approachRoadCondition) },
    { label: "Area of Property", value: show(visit.areaSqFt) },
    { label: "Rate per Sq. Ft.", value: show(visit.ratePerSqFt) },
    { label: "Negative Points", value: show(visit.negativePoints) },
    { label: "Agent Opinion", value: show(visit.agentOpinion) },
  ]);

  writer.drawSection("Final", [
    { label: "Final Remarks", value: show(visit.finalRemarks) },
    { label: "Field Visit Status", value: show(visit.status) },
    { label: "Submitted", value: submittedOn },
  ]);

  return writer.toBytes();
}
