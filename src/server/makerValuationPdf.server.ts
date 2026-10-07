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

  private drawRow(label: string, value: string): void {
    const lineHeight = 18;
    const fontSize = 11;

    // Add new page if we're running out of space
    if (this.y - lineHeight < this.bottomMargin) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - MARGIN;
    }

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
    // Basic Details
    this.drawRow("Date of Valuation", formatDisplayDate(valuation.dateOfValuation));
    this.drawRow("Date of Inspection", formatDisplayDate(valuation.dateOfInspection));
    this.drawRow("Ref. No.", show(valuation.refNo));
    this.drawRow("Branch", show(valuation.branch));
    this.drawRow("Bank Name", show(valuation.bankName));
    
    // Additional Fields (22 fields)
    this.drawRow("Purchaser Name", show(valuation.purchaserName));
    this.drawRow("Type of Property", show(valuation.typeOfProperty));
    this.drawRow("Flat No.", show(valuation.flatNo));
    this.drawRow("Located on Floor", show(valuation.locatedOnFloor));
    this.drawRow("Wing", show(valuation.wing));
    this.drawRow("Building Name", show(valuation.buildingName));
    this.drawRow("Landmark", show(valuation.landmark));
    this.drawRow("Road Name & Area", show(valuation.roadNameArea));
    this.drawRow("Location", show(valuation.location));
    this.drawRow("Plot No.", show(valuation.plotNo));
    this.drawRow("C.T.S No.", show(valuation.ctsNo));
    this.drawRow("S. No.", show(valuation.sNo));
    this.drawRow("Other", show(valuation.other));
    this.drawRow("Village", show(valuation.village));
    this.drawRow("Ward No.", show(valuation.wardNo));
    this.drawRow("Taluka", show(valuation.taluka));
    this.drawRow("Block No.", show(valuation.blockNo));
    this.drawRow("District", show(valuation.district));
    this.drawRow("Pin Code", show(valuation.pinCode));
    
    // General Section (19 fields)
    this.drawRow("Purpose of Valuation", show(valuation.purposeOfValuation));
    this.drawRow("Documents Name (1)", show(valuation.documentsName1));
    this.drawRow("Details of Documents Name (1)", show(valuation.documentsDetails1));
    this.drawRow("Documents Name (2)", show(valuation.documentsName2));
    this.drawRow("Details of Documents Name (2)", show(valuation.documentsDetails2));
    this.drawRow("Documents Name (3)", show(valuation.documentsName3));
    this.drawRow("Details of Documents Name (3)", show(valuation.documentsDetails3));
    this.drawRow("Name of Owner", show(valuation.nameOfOwner));
    this.drawRow("Address", show(valuation.address));
    this.drawRow("Configuration (In Short)", show(valuation.configurationInShort));
    this.drawRow("Configuration (full description)", show(valuation.configurationFullDescription));
    this.drawRow("Locality", show(valuation.locality));
    this.drawRow("Class of locality (1)", show(valuation.classOfLocality1));
    this.drawRow("Class of locality (2)", show(valuation.classOfLocality2));
    this.drawRow("Class of locality (3)", show(valuation.classOfLocality3));
    this.drawRow("Municipal Corporation", show(valuation.municipalCorporation));
    this.drawRow("Type of Land", show(valuation.typeOfLand));
    this.drawRow("Genuineness or Authenticity", show(valuation.genuinenessOrAuthenticity));
    this.drawRow("Any other comments", show(valuation.anyOtherComments));
    this.drawRow("Nos. of Floor", show(valuation.nosOfFloor));
    this.drawRow("Nos. of Staircase", show(valuation.nosOfStaircase));
    this.drawRow("Nos. of Lifts", show(valuation.nosOfLifts));
    
    // Boundaries Section
    this.drawRow("Boundary of Property - North", show(valuation.boundaryPropertyNorth));
    this.drawRow("Boundary of Property - South", show(valuation.boundaryPropertySouth));
    this.drawRow("Boundary of Property - East", show(valuation.boundaryPropertyEast));
    this.drawRow("Boundary of Property - West", show(valuation.boundaryPropertyWest));
    this.drawRow("Boundary Property Measured", show(valuation.boundaryPropertyMeasured));
    this.drawRow("Boundary of Site - North", show(valuation.boundarySiteNorth));
    this.drawRow("Boundary of Site - South", show(valuation.boundarySiteSouth));
    this.drawRow("Boundary of Site - East", show(valuation.boundarySiteEast));
    this.drawRow("Boundary of Site - West", show(valuation.boundarySiteWest));
    this.drawRow("Boundary Site Measured", show(valuation.boundarySiteMeasured));
    
    this.drawRow("Latitude", show(valuation.latitude));
    this.drawRow("Longitude", show(valuation.longitude));
    this.drawRow("Occupancy", show(valuation.occupancy));
    
    // Apartment Section
    this.drawRow("Year of Construction", show(valuation.yearOfConstruction));
    this.drawRow("Age of Building", show(valuation.ageOfBuilding));
    this.drawRow("Residual Life", show(valuation.residualLife));
    this.drawRow("Type of Structure", show(valuation.typeOfStructure));
    this.drawRow("Nos. of unit per floor", show(valuation.nosOfUnitPerFloor));
    this.drawRow("Building", show(valuation.buildingType));
    this.drawRow("Appearance", show(valuation.appearance));
    this.drawRow("Quality of Construction", show(valuation.qualityOfConstruction));
    this.drawRow("Maintenance", show(valuation.maintenance));
    this.drawRow("Protected Water Supply", show(valuation.protectedWaterSupply));
    this.drawRow("Underground Sewerage", show(valuation.undergroundSewerage));
    this.drawRow("Nos. of Parking", show(valuation.nosOfParking));
    this.drawRow("Compound Wall", show(valuation.compoundWall));
    this.drawRow("Open / Covered parking", show(valuation.openCoveredParking));
    this.drawRow("Pavement laid around the Building", show(valuation.pavementLaidAroundBuilding));
    
    // Flat Section
    this.drawRow("Flooring", show(valuation.flooring));
    this.drawRow("Doors", show(valuation.doors));
    this.drawRow("Windows", show(valuation.windows));
    this.drawRow("Fittings", show(valuation.fittings));
    this.drawRow("Finishing", show(valuation.finishing));
    this.drawRow("Assessment No", show(valuation.assessmentNo));
    this.drawRow("Tax Amount", show(valuation.taxAmount));
    this.drawRow("Tax Paid in the name of", show(valuation.taxPaidInNameOf));
    this.drawRow("Electricity Service Connection No", show(valuation.electricityServiceConnectionNo));
    this.drawRow("Meter Card is in the name of & Dated", show(valuation.meterCardInNameOf));
    this.drawRow("Meter Card Dated", show(valuation.meterCardDated));
    this.drawRow("Undivided area of land", show(valuation.undividedAreaOfLand));
    
    // Marketability Section
    this.drawRow("Marketability", show(valuation.marketability));
    this.drawRow("Positive Factors", show(valuation.positiveFactors));
    this.drawRow("Negative Factors", show(valuation.negativeFactors));
    
    // Area Calculation Section
    this.drawRow("Physical Measured Area", show(valuation.physicalMeasuredArea));
    this.drawRow("Physical Measured Area Basis", show(valuation.physicalMeasuredAreaBasis));
    this.drawRow("Documented Area", show(valuation.documentedArea));
    this.drawRow("Documented Area Basis", show(valuation.documentedAreaBasis));
    this.drawRow("Approved Plan Area", show(valuation.approvedPlanArea));
    this.drawRow("Approved Plan Area Basis", show(valuation.approvedPlanAreaBasis));
    this.drawRow("Built Up Area", show(valuation.builtUpArea));
    this.drawRow("Built Up Area Basis", show(valuation.builtUpAreaBasis));
    this.drawRow("Adopted Area", show(valuation.adoptedArea));
    this.drawRow("Adopted Area Basis", show(valuation.adoptedAreaBasis));
    this.drawRow("Floor Space Index", show(valuation.floorSpaceIndex));
    
    // Rate Section
    this.drawRow("Rate Range", show(valuation.rateRange));
    this.drawRow("Adopted Rate", show(valuation.adoptedRate));
    this.drawRow("Building Rate", show(valuation.buildingRate));
    this.drawRow("Land Rate", show(valuation.landRate));
    this.drawRow("Insurance Value", show(valuation.insuranceValue));
    
    // Details of Valuation Section
    this.drawRow("Market Value", show(valuation.marketValue));
    this.drawRow("Car Parking Value", show(valuation.carParkingValue));
    this.drawRow("Fair Market Value", show(valuation.fairMarketValue));
    this.drawRow("Realizable Value", show(valuation.realizableValue));
    this.drawRow("Distress Value", show(valuation.distressValue));
    this.drawRow("Govt. Ready Reckoner Rate (Per Sq.Mtr.)", show(valuation.govtReadyReckonerRatePerSqMtr));
    this.drawRow("Govt. Ready Reckoner Rate (Per Sq.Ft.)", show(valuation.govtReadyReckonerRatePerSqFt));
    this.drawRow("Govt. Value", show(valuation.govtValue));
    this.drawRow("Rent Range Per month", show(valuation.rentRangePerMonth));
    
    // Remarks Section
    this.drawRow("Remarks", show(valuation.remarks));
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
