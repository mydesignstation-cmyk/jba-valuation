import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createMakerValuationSchema,
  typeOfPropertyOptions,
  localityOptions,
  classOfLocality1Options,
  classOfLocality2Options,
  classOfLocality3Options,
  typeOfLandOptions,
  genuinenessOptions,
  occupancyOptions,
  boundaryMeasuredOptions,
  occupancyStatusOptions,
  qualityOptions,
  yesNoOptions,
  typeOfStructureOptions,
  buildingTypeOptions,
  openCoveredParkingOptions,
  marketabilityOptions,
  areaBasisOptions,
} from "@/schemas/makerValuation.schema";
import { api_createMakerValuation } from "@/data/makerValuation.functions";
import type { CreateMakerValuationInput } from "@/schemas/makerValuation.schema";
import type { MakerValuation } from "@/types";

const makerValuationFields = [
  "dateOfValuation", "dateOfInspection", "refNo", "branch", "bankName",
  "purchaserName", "typeOfProperty", "flatNo", "locatedOnFloor", "wing", "buildingName", "landmark", "roadNameArea", "location", "plotNo", "ctsNo", "sNo", "other", "village", "wardNo", "taluka", "blockNo", "district", "pinCode",
  "purposeOfValuation", "documentsName1", "documentsDetails1", "documentsName2", "documentsDetails2", "documentsName3", "documentsDetails3", "nameOfOwner", "address", "configurationInShort", "configurationFullDescription", "locality", "classOfLocality1", "classOfLocality2", "classOfLocality3", "municipalCorporation", "typeOfLand", "genuinenessOrAuthenticity", "anyOtherComments", "nosOfFloor", "nosOfStaircase", "nosOfLifts",
  "boundaryPropertyNorth", "boundaryPropertySouth", "boundaryPropertyEast", "boundaryPropertyWest", "boundaryPropertyMeasured", "boundarySiteNorth", "boundarySiteSouth", "boundarySiteEast", "boundarySiteWest", "boundarySiteMeasured", "latitude", "longitude", "occupancy",
  "yearOfConstruction", "ageOfBuilding", "residualLife", "typeOfStructure", "nosOfUnitPerFloor", "buildingType", "appearance", "qualityOfConstruction", "maintenance", "protectedWaterSupply", "undergroundSewerage", "nosOfParking", "compoundWall", "openCoveredParking", "pavementLaidAroundBuilding", "flooring", "doors", "windows", "fittings", "finishing", "assessmentNo", "taxAmount", "taxPaidInNameOf", "electricityServiceConnectionNo", "meterCardInNameOf", "meterCardDated", "undividedAreaOfLand",
  "marketability", "positiveFactors", "negativeFactors",
  "physicalMeasuredArea", "physicalMeasuredAreaBasis", "documentedArea", "documentedAreaBasis", "approvedPlanArea", "approvedPlanAreaBasis", "builtUpArea", "builtUpAreaBasis", "adoptedArea", "adoptedAreaBasis", "floorSpaceIndex",
  "rateRange", "adoptedRate", "buildingRate", "landRate", "insuranceValue", "marketValue", "carParkingValue", "fairMarketValue", "realizableValue", "distressValue", "govtReadyReckonerRatePerSqMtr", "govtReadyReckonerRatePerSqFt", "govtValue", "rentRangePerMonth", "remarks",
] as const satisfies readonly (keyof Omit<CreateMakerValuationInput, "caseId">)[];

function formString(value: unknown): string {
  return value == null ? "" : String(value);
}

function formDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return formString(value).slice(0, 10);
}

function makerValuationToFormValues(
  caseId: string,
  valuation: MakerValuation,
): CreateMakerValuationInput {
  const values: Record<string, string> = { caseId };
  const source = valuation as unknown as Record<string, unknown>;
  for (const field of makerValuationFields) {
    values[field] = field === "dateOfValuation" || field === "dateOfInspection"
      ? formDate(source[field])
      : formString(source[field]);
  }
  return values as CreateMakerValuationInput;
}

interface MakerValuationFormProps {
  caseId: string;
  initialValues?: MakerValuation;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MakerValuationForm({
  caseId,
  initialValues,
  onSuccess,
  onCancel,
}: MakerValuationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formDefaultValues = useMemo(
    (): CreateMakerValuationInput =>
      initialValues ? makerValuationToFormValues(caseId, initialValues) : {
      caseId: caseId,
      dateOfValuation: "",
      dateOfInspection: "",
      refNo: "",
      branch: "",
      bankName: "",
      purchaserName: "",
      typeOfProperty: "",
      flatNo: "",
      locatedOnFloor: "",
      wing: "",
      buildingName: "",
      landmark: "",
      roadNameArea: "",
      location: "",
      plotNo: "",
      ctsNo: "",
      sNo: "",
      other: "",
      village: "",
      wardNo: "",
      taluka: "",
      blockNo: "",
      district: "",
      pinCode: "",
      purposeOfValuation: "",
      documentsName1: "",
      documentsDetails1: "",
      documentsName2: "",
      documentsDetails2: "",
      documentsName3: "",
      documentsDetails3: "",
      nameOfOwner: "",
      address: "",
      configurationInShort: "",
      configurationFullDescription: "",
      locality: "",
      classOfLocality1: "",
      classOfLocality2: "",
      classOfLocality3: "",
      municipalCorporation: "",
      typeOfLand: "",
      genuinenessOrAuthenticity: "",
      anyOtherComments: "",
      nosOfFloor: "",
      nosOfStaircase: "",
      nosOfLifts: "",
      boundaryPropertyNorth: "",
      boundaryPropertySouth: "",
      boundaryPropertyEast: "",
      boundaryPropertyWest: "",
      boundaryPropertyMeasured: "",
      boundarySiteNorth: "",
      boundarySiteSouth: "",
      boundarySiteEast: "",
      boundarySiteWest: "",
      boundarySiteMeasured: "",
      latitude: "",
      longitude: "",
      occupancy: "",
      yearOfConstruction: "",
      ageOfBuilding: "",
      residualLife: "",
      typeOfStructure: "",
      nosOfUnitPerFloor: "",
      buildingType: "",
      appearance: "",
      qualityOfConstruction: "",
      maintenance: "",
      protectedWaterSupply: "",
      undergroundSewerage: "",
      nosOfParking: "",
      compoundWall: "",
      openCoveredParking: "",
      pavementLaidAroundBuilding: "",
      flooring: "",
      doors: "",
      windows: "",
      fittings: "",
      finishing: "",
      assessmentNo: "",
      taxAmount: "",
      taxPaidInNameOf: "",
      electricityServiceConnectionNo: "",
      meterCardInNameOf: "",
      meterCardDated: "",
      undividedAreaOfLand: "",
      marketability: "",
      positiveFactors: "",
      negativeFactors: "",
      physicalMeasuredArea: "",
      physicalMeasuredAreaBasis: "",
      documentedArea: "",
      documentedAreaBasis: "",
      approvedPlanArea: "",
      approvedPlanAreaBasis: "",
      builtUpArea: "",
      builtUpAreaBasis: "",
      adoptedArea: "",
      adoptedAreaBasis: "",
      floorSpaceIndex: "",
      rateRange: "",
      adoptedRate: "",
      buildingRate: "",
      landRate: "",
      insuranceValue: "",
      marketValue: "",
      carParkingValue: "",
      fairMarketValue: "",
      realizableValue: "",
      distressValue: "",
      govtReadyReckonerRatePerSqMtr: "",
      govtReadyReckonerRatePerSqFt: "",
      govtValue: "",
      rentRangePerMonth: "",
      remarks: "",
    },
    [caseId, initialValues],
  );

  const form = useForm<CreateMakerValuationInput>({
    resolver: zodResolver(createMakerValuationSchema),
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    form.reset(initialValues ? makerValuationToFormValues(caseId, initialValues) : formDefaultValues);
  }, [caseId, initialValues, form]);
  const handleAutoFill = () => {
    const today = new Date().toISOString().split("T")[0];
    form.reset({
      caseId: caseId,
      dateOfValuation: today,
      dateOfInspection: today,
      refNo: "REF-DEV-001",
      branch: "Dev Branch",
      bankName: "Dev Bank",
      purchaserName: "John Developer",
      typeOfProperty: "Residential Flat",
      flatNo: "101",
      locatedOnFloor: "1st Floor",
      wing: "A",
      buildingName: "Dev Towers",
      landmark: "Near Dev Park",
      roadNameArea: "Developer Street",
      location: "Dev City",
      plotNo: "123",
      ctsNo: "456",
      sNo: "789",
      other: "Dev Area",
      village: "Dev Village",
      wardNo: "W1",
      taluka: "Dev Taluka",
      blockNo: "B1",
      district: "Dev District",
      pinCode: "123456",
      purposeOfValuation: "Bank Loan",
      documentsName1: "Title Deed",
      documentsDetails1: "Document 1 details",
      documentsName2: "Agreement",
      documentsDetails2: "Document 2 details",
      documentsName3: "Plan",
      documentsDetails3: "Document 3 details",
      nameOfOwner: "Dev Owner",
      address: "123 Dev Street, Dev City",
      configurationInShort: "3BHK",
      configurationFullDescription: "3 Bedroom, Hall, Kitchen with modern amenities",
      locality: "Dev Locality",
      classOfLocality1: "High",
      classOfLocality2: "Urban",
      classOfLocality3: "Posh class",
      municipalCorporation: "Dev Municipal Corp",
      typeOfLand: "Freehold",
      genuinenessOrAuthenticity: "Yes",
      anyOtherComments: "Dev property for testing",
      nosOfFloor: "15",
      nosOfStaircase: "2",
      nosOfLifts: "2",
      boundaryPropertyNorth: "Street",
      boundaryPropertySouth: "Garden",
      boundaryPropertyEast: "Park",
      boundaryPropertyWest: "Building",
      boundaryPropertyMeasured: "As per actuals",
      boundarySiteNorth: "100m",
      boundarySiteSouth: "100m",
      boundarySiteEast: "100m",
      boundarySiteWest: "100m",
      boundarySiteMeasured: "As per actuals",
      latitude: "19.0760",
      longitude: "72.8777",
      occupancy: "Self-occupied",
      yearOfConstruction: "2020",
      ageOfBuilding: "4",
      residualLife: "50",
      typeOfStructure: "RCC, Load Bearing, Mixed",
      nosOfUnitPerFloor: "4",
      buildingType: "Residential",
      appearance: "Good",
      qualityOfConstruction: "Good",
      maintenance: "Good",
      protectedWaterSupply: "Yes",
      undergroundSewerage: "Yes",
      nosOfParking: "2",
      compoundWall: "Yes",
      openCoveredParking: "Covered",
      pavementLaidAroundBuilding: "Yes",
      flooring: "Marble",
      doors: "Wooden",
      windows: "Aluminum",
      fittings: "Brass",
      finishing: "Premium",
      assessmentNo: "ASS-001",
      taxAmount: "5000",
      taxPaidInNameOf: "Owner Name",
      electricityServiceConnectionNo: "ELEC-001",
      meterCardInNameOf: "Owner Name",
      meterCardDated: today,
      undividedAreaOfLand: "250",
      marketability: "Good",
      positiveFactors: "Prime location, near metro",
      negativeFactors: "Old building",
      // Area Calculation
      physicalMeasuredArea: "1000",
      physicalMeasuredAreaBasis: "CA",
      documentedArea: "1000",
      documentedAreaBasis: "RERA CA",
      approvedPlanArea: "1000",
      approvedPlanAreaBasis: "BUA",
      builtUpArea: "800",
      builtUpAreaBasis: "BUA",
      adoptedArea: "1000",
      adoptedAreaBasis: "CA",
      floorSpaceIndex: "2.5",
      // Rate Section
      rateRange: "5000",
      adoptedRate: "5000",
      buildingRate: "3000",
      landRate: "2000",
      insuranceValue: "2400000.00",
      marketValue: "5000000.00",
      carParkingValue: "100000",
      fairMarketValue: "5100000.00",
      realizableValue: "4845000.00",
      distressValue: "4080000.00",
      govtReadyReckonerRatePerSqMtr: "4000",
      govtReadyReckonerRatePerSqFt: "370",
      govtValue: "4000000.00",
      rentRangePerMonth: "25000",
      remarks: "Dev test property - all formulas will auto-calculate",
    } as any);
  };

  const handleSubmit = async (values: CreateMakerValuationInput) => {
    setIsSubmitting(true);
    try {
      // Calculate formula-based values
      const adoptedArea = values.adoptedArea ? Number(values.adoptedArea) : 0;
      const adoptedRate = values.adoptedRate ? Number(values.adoptedRate) : 0;
      const builtUpArea = values.builtUpArea ? Number(values.builtUpArea) : 0;
      const buildingRate = values.buildingRate ? Number(values.buildingRate) : 0;
      const carParkingValue = values.carParkingValue ? Number(values.carParkingValue) : 0;
      const govtReadyReckonerRatePerSqMtr = values.govtReadyReckonerRatePerSqMtr ? Number(values.govtReadyReckonerRatePerSqMtr) : 0;
      
      const insuranceValue = builtUpArea * buildingRate;
      const marketValue = adoptedArea * adoptedRate;
      const fairMarketValue = marketValue + carParkingValue;
      const realizableValue = fairMarketValue * 0.95;
      const distressValue = fairMarketValue * 0.8;
      const govtValue = adoptedArea * govtReadyReckonerRatePerSqMtr;
      
      // Update values with calculated amounts
      const submissionData: CreateMakerValuationInput = {
        ...values,
        insuranceValue: insuranceValue > 0 ? insuranceValue.toString() : values.insuranceValue || "",
        marketValue: marketValue > 0 ? marketValue.toString() : values.marketValue || "",
        fairMarketValue: fairMarketValue > 0 ? fairMarketValue.toString() : values.fairMarketValue || "",
        realizableValue: realizableValue > 0 ? realizableValue.toString() : values.realizableValue || "",
        distressValue: distressValue > 0 ? distressValue.toString() : values.distressValue || "",
        govtValue: govtValue > 0 ? govtValue.toString() : values.govtValue || "",
      };
      
      await api_createMakerValuation(submissionData);
      toast.success(initialValues ? "Valuation updated successfully" : "Valuation created successfully");
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save valuation:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to save valuation";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create Valuation</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAutoFill}
            className="text-xs text-blue-600"
          >
            📝 Dev Auto-Fill
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Basic Details</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="dateOfValuation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Valuation *</FormLabel>
                      <Input type="date" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfInspection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Inspection *</FormLabel>
                      <Input type="date" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="refNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ref. No. *</FormLabel>
                      <Input placeholder="Enter reference number" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch *</FormLabel>
                      <Input placeholder="Enter branch" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name *</FormLabel>
                      <Input placeholder="Enter bank name" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Additional Details</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="purchaserName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchaser Name</FormLabel>
                      <Input placeholder="Enter purchaser name" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="typeOfProperty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Property</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOfPropertyOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="flatNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flat No.</FormLabel>
                      <Input placeholder="Enter flat no." {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locatedOnFloor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Located on Floor</FormLabel>
                      <Input placeholder="Enter floor" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wing</FormLabel>
                      <Input placeholder="Enter wing" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buildingName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Name</FormLabel>
                      <Input placeholder="Enter building name" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="landmark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landmark</FormLabel>
                      <Input placeholder="Enter landmark" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roadNameArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Road Name & Area</FormLabel>
                      <Input placeholder="Enter road name & area" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Input placeholder="Enter location" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plotNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plot No.</FormLabel>
                      <Input placeholder="Enter plot no." {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ctsNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>C.T.S No.</FormLabel>
                      <Input placeholder="Enter CTS no." {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>S. No.</FormLabel>
                      <Input placeholder="Enter S. no." {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="other"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other</FormLabel>
                      <Input placeholder="Enter other details" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="village"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Village</FormLabel>
                      <Input placeholder="Enter village" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wardNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ward No.</FormLabel>
                      <Input placeholder="Enter ward no." {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taluka"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taluka</FormLabel>
                      <Input placeholder="Enter taluka" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="blockNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Block No.</FormLabel>
                      <Input placeholder="Enter block no." {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <Input placeholder="Enter district" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pin Code</FormLabel>
                      <Input placeholder="Enter pin code" {...field} />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">General</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="purposeOfValuation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose of Valuation</FormLabel>
                      <Input placeholder="Enter purpose" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentsName1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documents Name (1)</FormLabel>
                      <Input placeholder="Enter document name" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentsDetails1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details of Documents Name (1)</FormLabel>
                      <Input placeholder="Enter document details" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentsName2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documents Name (2)</FormLabel>
                      <Input placeholder="Enter document name" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentsDetails2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details of Documents Name (2)</FormLabel>
                      <Input placeholder="Enter document details" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentsName3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documents Name (3)</FormLabel>
                      <Input placeholder="Enter document name" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentsDetails3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details of Documents Name (3)</FormLabel>
                      <Input placeholder="Enter document details" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameOfOwner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name of Owner</FormLabel>
                      <Input placeholder="Enter owner name" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <Input placeholder="Enter address" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="configurationInShort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Configuration (In Short)</FormLabel>
                      <Input placeholder="e.g. 1BHK, 2BHK" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="configurationFullDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Configuration (full description)</FormLabel>
                      <Input placeholder="e.g. 1 living, 1 Kitchen, 1 Bedroom" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Locality</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select locality" />
                        </SelectTrigger>
                        <SelectContent>
                          {localityOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classOfLocality1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class of locality (1)</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classOfLocality1Options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classOfLocality2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class of locality (2)</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classOfLocality2Options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classOfLocality3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class of locality (3)</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classOfLocality3Options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="municipalCorporation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Municipal Corporation</FormLabel>
                      <Input placeholder="Enter municipal corporation" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="typeOfLand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Land</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOfLandOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="genuinenessOrAuthenticity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genuineness or Authenticity</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          {genuinenessOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="anyOtherComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Any other comments</FormLabel>
                      <Input placeholder="Enter additional comments" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nosOfFloor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nos. of Floor</FormLabel>
                      <Input placeholder="Enter number of floors" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nosOfStaircase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nos. of Staircase</FormLabel>
                      <Input placeholder="Enter number of staircases" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nosOfLifts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nos. of Lifts</FormLabel>
                      <Input placeholder="Enter number of lifts" {...field} />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Boundaries</h3>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {/* Boundaries of Property - Left Side */}
                <div>
                  <h4 className="font-medium text-sm mb-3 pb-2 border-b">Boundaries of Property</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="boundaryPropertyNorth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>North</FormLabel>
                          <Input placeholder="Enter north boundary" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="boundaryPropertySouth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>South</FormLabel>
                          <Input placeholder="Enter south boundary" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="boundaryPropertyEast"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>East</FormLabel>
                          <Input placeholder="Enter east boundary" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="boundaryPropertyWest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>West</FormLabel>
                          <Input placeholder="Enter west boundary" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="boundaryPropertyMeasured"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Boundary Measured</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select measurement basis" />
                            </SelectTrigger>
                            <SelectContent>
                              {boundaryMeasuredOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Boundary of Site - Right Side */}
                <div>
                  <h4 className="font-medium text-sm mb-3 pb-2 border-b">Boundary of Site</h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="boundarySiteNorth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>North</FormLabel>
                          <Input placeholder="Enter north boundary" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="boundarySiteSouth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>South</FormLabel>
                          <Input placeholder="Enter south boundary" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="boundarySiteEast"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>East</FormLabel>
                          <Input placeholder="Enter east boundary" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="boundarySiteWest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>West</FormLabel>
                          <Input placeholder="Enter west boundary" {...field} />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="boundarySiteMeasured"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Boundary Measured</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select measurement basis" />
                            </SelectTrigger>
                            <SelectContent>
                              {boundaryMeasuredOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Location</h3>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <Input placeholder="Enter latitude" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <Input placeholder="Enter longitude" {...field} />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Occupancy Status</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="occupancy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupancy</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select occupancy status" />
                        </SelectTrigger>
                        <SelectContent>
                          {occupancyStatusOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Apartment Section */}
            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Apartment</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="yearOfConstruction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Construction</FormLabel>
                      <Input placeholder="Enter year" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ageOfBuilding"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age of Building</FormLabel>
                      <Input placeholder="Enter age" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="residualLife"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Residual Life</FormLabel>
                      <Input placeholder="Enter residual life" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="typeOfStructure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Structure</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select structure type" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOfStructureOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nosOfUnitPerFloor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nos. of unit per floor</FormLabel>
                      <Input placeholder="Enter number" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buildingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select building type" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildingTypeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appearance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appearance</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select appearance" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualityOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="qualityOfConstruction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality of Construction</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualityOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maintenance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maintenance</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select maintenance" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualityOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="protectedWaterSupply"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protected Water Supply</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          {yesNoOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="undergroundSewerage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Underground Sewerage</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          {yesNoOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nosOfParking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nos. of Parking</FormLabel>
                      <Input placeholder="Enter number" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="compoundWall"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compound Wall</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          {yesNoOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="openCoveredParking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open / Covered parking</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {openCoveredParkingOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pavementLaidAroundBuilding"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pavement laid around the Building</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          {yesNoOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Flat Section */}
            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Flat</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="flooring"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flooring</FormLabel>
                      <Input placeholder="Enter flooring details" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="doors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doors</FormLabel>
                      <Input placeholder="Enter doors details" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="windows"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Windows</FormLabel>
                      <Input placeholder="Enter windows details" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fittings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fittings</FormLabel>
                      <Input placeholder="Enter fittings details" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="finishing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Finishing</FormLabel>
                      <Input placeholder="Enter finishing details" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assessmentNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assessment No</FormLabel>
                      <Input placeholder="Enter assessment number" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Amount</FormLabel>
                      <Input placeholder="Enter tax amount" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxPaidInNameOf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Paid in the name of</FormLabel>
                      <Input placeholder="Enter name" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electricityServiceConnectionNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Electricity Service Connection No</FormLabel>
                      <Input placeholder="Enter connection number" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="meterCardInNameOf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Card is in the name of</FormLabel>
                      <Input placeholder="Enter name" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="meterCardDated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Card Dated</FormLabel>
                      <Input placeholder="Enter date" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="undividedAreaOfLand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Undivided area of land</FormLabel>
                      <Input placeholder="Enter area" {...field} />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Marketability Section */}
            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Marketability</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="marketability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketability</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select marketability" />
                        </SelectTrigger>
                        <SelectContent>
                          {marketabilityOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="positiveFactors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Positive Factors</FormLabel>
                      <Input placeholder="Enter positive factors" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="negativeFactors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Negative Factors</FormLabel>
                      <Input placeholder="Enter negative factors" {...field} />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Area Calculation Section */}
            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Area Calculation</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="physicalMeasuredArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Measured Area</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter area" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="physicalMeasuredAreaBasis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Measured Area Basis</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select basis" />
                        </SelectTrigger>
                        <SelectContent>
                          {areaBasisOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentedArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documented Area</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter area" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentedAreaBasis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documented Area Basis</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select basis" />
                        </SelectTrigger>
                        <SelectContent>
                          {areaBasisOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="approvedPlanArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approved Plan Area</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter area" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="approvedPlanAreaBasis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approved Plan Area Basis</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select basis" />
                        </SelectTrigger>
                        <SelectContent>
                          {areaBasisOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="builtUpArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Built Up Area</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter area" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="builtUpAreaBasis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Built Up Area Basis</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select basis" />
                        </SelectTrigger>
                        <SelectContent>
                          {areaBasisOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adoptedArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adopted Area</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter area" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adoptedAreaBasis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adopted Area Basis</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select basis" />
                        </SelectTrigger>
                        <SelectContent>
                          {areaBasisOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="floorSpaceIndex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor Space Index</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter value" {...field} />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Rate Section */}
            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Rate</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="rateRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Range</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter range" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adoptedRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adopted Rate</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter rate" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buildingRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Rate</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter rate" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="landRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land Rate</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter rate" {...field} />
                    </FormItem>
                  )}
                />
                {/* Insurance Value (read-only, formula-based) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Insurance Value</label>
                  <div className="px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm">
                    {form.watch("builtUpArea") && form.watch("buildingRate")
                      ? (
                          Number(form.watch("builtUpArea")) *
                          Number(form.watch("buildingRate"))
                        ).toFixed(2)
                      : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Details of Valuation Section */}
            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Details of Valuation</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Market Value (formula-based) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Market Value</label>
                  <div className="px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm">
                    {form.watch("adoptedArea") && form.watch("adoptedRate")
                      ? (
                          Number(form.watch("adoptedArea")) *
                          Number(form.watch("adoptedRate"))
                        ).toFixed(2)
                      : "—"}
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="carParkingValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Parking Value</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter value" {...field} />
                    </FormItem>
                  )}
                />
                {/* Fair Market Value (formula-based) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Fair Market Value</label>
                  <div className="px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm">
                    {form.watch("adoptedArea") && form.watch("adoptedRate") && form.watch("carParkingValue")
                      ? (
                          Number(form.watch("adoptedArea")) * Number(form.watch("adoptedRate")) +
                          Number(form.watch("carParkingValue"))
                        ).toFixed(2)
                      : form.watch("adoptedArea") && form.watch("adoptedRate")
                      ? (Number(form.watch("adoptedArea")) * Number(form.watch("adoptedRate"))).toFixed(2)
                      : "—"}
                  </div>
                </div>
                {/* Realizable Value (formula-based: FMV × 95%) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Realizable Value</label>
                  <div className="px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm">
                    {form.watch("adoptedArea") && form.watch("adoptedRate")
                      ? (
                          (Number(form.watch("adoptedArea")) * Number(form.watch("adoptedRate")) +
                            (form.watch("carParkingValue") ? Number(form.watch("carParkingValue")) : 0)) *
                          0.95
                        ).toFixed(2)
                      : "—"}
                  </div>
                </div>
                {/* Distress Value (formula-based: FMV × 80%) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Distress Value</label>
                  <div className="px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm">
                    {form.watch("adoptedArea") && form.watch("adoptedRate")
                      ? (
                          (Number(form.watch("adoptedArea")) * Number(form.watch("adoptedRate")) +
                            (form.watch("carParkingValue") ? Number(form.watch("carParkingValue")) : 0)) *
                          0.8
                        ).toFixed(2)
                      : "—"}
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="govtReadyReckonerRatePerSqMtr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Govt. Ready Reckoner Rate (Per Sq.Mtr.)</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter rate" {...field} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="govtReadyReckonerRatePerSqFt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Govt. Ready Reckoner Rate (Per Sq.Ft.)</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter rate" {...field} />
                    </FormItem>
                  )}
                />
                {/* Govt. Value (calculated) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Govt. Value</label>
                  <div className="px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm">
                    {form.watch("adoptedArea") && form.watch("govtReadyReckonerRatePerSqMtr")
                      ? (
                          Number(form.watch("adoptedArea")) *
                          Number(form.watch("govtReadyReckonerRatePerSqMtr"))
                        ).toFixed(2)
                      : "—"}
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="rentRangePerMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rent Range Per month</FormLabel>
                      <Input type="number" step="0.01" placeholder="Enter range" {...field} />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Remarks Section */}
            <div className="border-b-2 border-gray-200 pb-6">
              <h3 className="font-semibold text-base mb-4">Remarks</h3>
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <textarea
                      placeholder="Enter any remarks or notes"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      {...field}
                    />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Valuation"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
