import type { MakerValuation } from "@/types";

export type MakerValuationFieldKey = Exclude<
  keyof MakerValuation,
  "id" | "caseId" | "pdfBytes" | "createdById" | "createdAt"
>;

export interface MakerValuationDisplayField {
  key: MakerValuationFieldKey;
  label: string;
}

export interface MakerValuationDisplaySection {
  title: string;
  fields: readonly MakerValuationDisplayField[];
}

const fields = (...items: readonly [MakerValuationFieldKey, string][]) =>
  items.map(([key, label]) => ({ key, label }));

export const makerValuationSections: readonly MakerValuationDisplaySection[] = [
  {
    title: "Basic",
    fields: fields(
      ["dateOfValuation", "Date of Valuation"],
      ["dateOfInspection", "Date of Inspection"],
      ["refNo", "Ref. No."],
      ["branch", "Branch"],
      ["bankName", "Bank Name"],
    ),
  },
  {
    title: "Additional",
    fields: fields(
      ["purchaserName", "Purchaser Name"],
      ["typeOfProperty", "Type of Property"],
      ["flatNo", "Flat No."],
      ["locatedOnFloor", "Located on Floor"],
      ["wing", "Wing"],
      ["buildingName", "Building Name"],
      ["landmark", "Landmark"],
      ["roadNameArea", "Road Name & Area"],
      ["location", "Location"],
      ["plotNo", "Plot No."],
      ["ctsNo", "C.T.S No."],
      ["sNo", "S. No."],
      ["other", "Other"],
      ["village", "Village"],
      ["wardNo", "Ward No."],
      ["taluka", "Taluka"],
      ["blockNo", "Block No."],
      ["district", "District"],
      ["pinCode", "Pin Code"],
    ),
  },
  {
    title: "General",
    fields: fields(
      ["purposeOfValuation", "Purpose of Valuation"],
      ["documentsName1", "Documents Name (1)"],
      ["documentsDetails1", "Details of Documents Name (1)"],
      ["documentsName2", "Documents Name (2)"],
      ["documentsDetails2", "Details of Documents Name (2)"],
      ["documentsName3", "Documents Name (3)"],
      ["documentsDetails3", "Details of Documents Name (3)"],
      ["nameOfOwner", "Name of Owner"],
      ["address", "Address"],
      ["configurationInShort", "Configuration (In Short)"],
      ["configurationFullDescription", "Configuration (full description)"],
      ["locality", "Locality"],
      ["classOfLocality1", "Class of locality (1)"],
      ["classOfLocality2", "Class of locality (2)"],
      ["classOfLocality3", "Class of locality (3)"],
      ["municipalCorporation", "Municipal Corporation"],
      ["typeOfLand", "Type of Land"],
      ["genuinenessOrAuthenticity", "Genuineness or Authenticity"],
      ["anyOtherComments", "Any other comments"],
      ["nosOfFloor", "Nos. of Floor"],
      ["nosOfStaircase", "Nos. of Staircase"],
      ["nosOfLifts", "Nos. of Lifts"],
    ),
  },
  {
    title: "Boundary / Location / Occupancy",
    fields: fields(
      ["boundaryPropertyNorth", "Boundary of Property - North"],
      ["boundaryPropertySouth", "Boundary of Property - South"],
      ["boundaryPropertyEast", "Boundary of Property - East"],
      ["boundaryPropertyWest", "Boundary of Property - West"],
      ["boundaryPropertyMeasured", "Boundary Property Measured"],
      ["boundarySiteNorth", "Boundary of Site - North"],
      ["boundarySiteSouth", "Boundary of Site - South"],
      ["boundarySiteEast", "Boundary of Site - East"],
      ["boundarySiteWest", "Boundary of Site - West"],
      ["boundarySiteMeasured", "Boundary Site Measured"],
      ["latitude", "Latitude"],
      ["longitude", "Longitude"],
      ["occupancy", "Occupancy"],
    ),
  },
  {
    title: "Apartment",
    fields: fields(
      ["yearOfConstruction", "Year of Construction"],
      ["ageOfBuilding", "Age of Building"],
      ["residualLife", "Residual Life"],
      ["typeOfStructure", "Type of Structure"],
      ["nosOfUnitPerFloor", "Nos. of unit per floor"],
      ["buildingType", "Building"],
      ["appearance", "Appearance"],
      ["qualityOfConstruction", "Quality of Construction"],
      ["maintenance", "Maintenance"],
      ["protectedWaterSupply", "Protected Water Supply"],
      ["undergroundSewerage", "Underground Sewerage"],
      ["nosOfParking", "Nos. of Parking"],
      ["compoundWall", "Compound Wall"],
      ["openCoveredParking", "Open / Covered parking"],
      ["pavementLaidAroundBuilding", "Pavement laid around the Building"],
    ),
  },
  {
    title: "Flat",
    fields: fields(
      ["flooring", "Flooring"],
      ["doors", "Doors"],
      ["windows", "Windows"],
      ["fittings", "Fittings"],
      ["finishing", "Finishing"],
      ["assessmentNo", "Assessment No"],
      ["taxAmount", "Tax Amount"],
      ["taxPaidInNameOf", "Tax Paid in the name of"],
      ["electricityServiceConnectionNo", "Electricity Service Connection No"],
      ["meterCardInNameOf", "Meter Card is in the name of & Dated"],
      ["meterCardDated", "Meter Card Dated"],
      ["undividedAreaOfLand", "Undivided area of land"],
    ),
  },
  {
    title: "Marketability",
    fields: fields(
      ["marketability", "Marketability"],
      ["positiveFactors", "Positive Factors"],
      ["negativeFactors", "Negative Factors"],
    ),
  },
  {
    title: "Area",
    fields: fields(
      ["physicalMeasuredArea", "Physical Measured Area"],
      ["physicalMeasuredAreaBasis", "Physical Measured Area Basis"],
      ["documentedArea", "Documented Area"],
      ["documentedAreaBasis", "Documented Area Basis"],
      ["approvedPlanArea", "Approved Plan Area"],
      ["approvedPlanAreaBasis", "Approved Plan Area Basis"],
      ["builtUpArea", "Built Up Area"],
      ["builtUpAreaBasis", "Built Up Area Basis"],
      ["adoptedArea", "Adopted Area"],
      ["adoptedAreaBasis", "Adopted Area Basis"],
      ["floorSpaceIndex", "Floor Space Index"],
    ),
  },
  {
    title: "Rate",
    fields: fields(
      ["rateRange", "Rate Range"],
      ["adoptedRate", "Adopted Rate"],
      ["buildingRate", "Building Rate"],
      ["landRate", "Land Rate"],
    ),
  },
  {
    title: "Details of Valuation",
    fields: fields(
      ["carParkingValue", "Car Parking Value"],
      ["govtReadyReckonerRatePerSqMtr", "Govt. Ready Reckoner Rate (Per Sq.Mtr.)"],
      ["govtReadyReckonerRatePerSqFt", "Govt. Ready Reckoner Rate (Per Sq.Ft.)"],
      ["rentRangePerMonth", "Rent Range Per month"],
    ),
  },
  {
    title: "Calculation",
    fields: fields(
      ["insuranceValue", "Insurance Value"],
      ["marketValue", "Market Value"],
      ["fairMarketValue", "Fair Market Value"],
      ["realizableValue", "Realizable Value"],
      ["distressValue", "Distress Value"],
      ["govtValue", "Govt. Value"],
    ),
  },
  {
    title: "Remarks",
    fields: fields(["remarks", "Remarks"]),
  },
];
