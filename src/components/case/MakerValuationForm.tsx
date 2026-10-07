import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
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
} from "@/schemas/makerValuation.schema";
import { api_createMakerValuation } from "@/data/makerValuation.functions";
import { getSessionToken } from "@/lib/auth-client";
import type { CreateMakerValuationInput } from "@/schemas/makerValuation.schema";

interface MakerValuationFormProps {
  caseId: string;
  initialValues?: {
    dateOfValuation: string;
    dateOfInspection: string;
    refNo: string;
    branch: string;
    bankName: string;
  };
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

  const form = useForm<CreateMakerValuationInput>({
    resolver: zodResolver(createMakerValuationSchema),
    defaultValues: {
      caseId: caseId,
      dateOfValuation: initialValues?.dateOfValuation || "",
      dateOfInspection: initialValues?.dateOfInspection || "",
      refNo: initialValues?.refNo || "",
      branch: initialValues?.branch || "",
      bankName: initialValues?.bankName || "",
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
    },
  });

  const handleSubmit = async (values: CreateMakerValuationInput) => {
    setIsSubmitting(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      
      await api_createMakerValuation(values);
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
        <CardTitle>Create Valuation</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div>
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

            <div>
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

            <div>
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

            <div>
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

            <div>
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

            <div>
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
