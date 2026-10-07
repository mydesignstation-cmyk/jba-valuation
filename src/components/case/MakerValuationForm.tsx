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
import { createMakerValuationSchema, typeOfPropertyOptions } from "@/schemas/makerValuation.schema";
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
    },
  });

  const handleSubmit = async (values: CreateMakerValuationInput) => {
    setIsSubmitting(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      
      await api_createMakerValuation({
        token,
        caseId: caseId,
        dateOfValuation: values.dateOfValuation,
        dateOfInspection: values.dateOfInspection,
        refNo: values.refNo,
        branch: values.branch,
        bankName: values.bankName,
      });
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
