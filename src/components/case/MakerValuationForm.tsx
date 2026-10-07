import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";

import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMakerValuationSchema } from "@/schemas/makerValuation.schema";
import { api_createMakerValuation } from "@/data/makerValuation.functions";
import { getSessionToken } from "@/lib/auth-client";
import type { CreateMakerValuationInput } from "@/schemas/makerValuation.schema";

interface MakerValuationFormProps {
  caseId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MakerValuationForm({
  caseId,
  onSuccess,
  onCancel,
}: MakerValuationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateMakerValuationInput>({
    resolver: zodResolver(createMakerValuationSchema),
    defaultValues: {
      caseId,
      dateOfValuation: "",
      dateOfInspection: "",
      refNo: "",
      branch: "",
      bankName: "",
    },
  });

  const handleSubmit = async (values: CreateMakerValuationInput) => {
    setIsSubmitting(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error("Not authenticated");
      
      await api_createMakerValuation({
        token,
        caseId: values.caseId,
        dateOfValuation: values.dateOfValuation,
        dateOfInspection: values.dateOfInspection,
        refNo: values.refNo,
        branch: values.branch,
        bankName: values.bankName,
      });
      toast.success("Valuation created successfully");
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create valuation:", error);
      toast.error("Failed to create valuation");
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

              <div className="space-y-4">
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
