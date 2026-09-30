import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/app/FormActions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createCaseSchema } from "@/schemas/case.schema";
import { createCustomerSchema } from "@/schemas/customer.schema";
import { api_createCustomer } from "@/data/customer.functions";
import { api_listBanks } from "@/data/bank.functions";
import { api_listBranches } from "@/data/branch.functions";
import { listSiteEngineers } from "@/services/user.service";
import { toast } from "sonner";

export type CaseFormValues = z.infer<typeof createCaseSchema>;
export type CustomerFormValues = z.infer<typeof createCustomerSchema>;

// Extended form values that include both customer and case data
export type CaseWithCustomerFormValues = CaseFormValues & {
  customerName: string;
  customerContact: string;
  customerEmail: string;
  customerAddress: string;
};

interface CaseFormProps {
  initialData?:
    | {
        customerId: string;
        requestNumber: string;
        bankId: string;
        branchId: string;
        assignedEngineerId: string;
      }
    | undefined;
  onSubmit: (data: CaseFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitText: string;
  isNewCase?: boolean;
}

export function CaseForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText,
  isNewCase = false,
}: CaseFormProps) {
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Only load banks, branches, and engineers
  const { data: banks = [] } = useQuery({ queryKey: ["banks"], queryFn: api_listBanks });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: api_listBranches });
  const { data: engineers = [] } = useQuery({
    queryKey: ["site-engineers"],
    queryFn: listSiteEngineers,
  });

  // Create an extended schema that includes customer fields when creating a new case
  const formSchema = isNewCase
    ? createCaseSchema.extend({
        customerName: z.string().min(1, "Customer name is required"),
        customerContact: z.string().min(1, "Contact is required"),
        customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
        customerAddress: z.string().min(1, "Address is required"),
      })
    : createCaseSchema;

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: initialData?.customerId ?? "",
      requestNumber: initialData?.requestNumber ?? "",
      bankId: initialData?.bankId ?? "",
      branchId: initialData?.branchId ?? "",
      assignedEngineerId: initialData?.assignedEngineerId ?? "",
      ...(isNewCase && {
        customerName: "",
        customerContact: "",
        customerEmail: "",
        customerAddress: "",
      }),
    },
  });

  const handleSubmit = async (values: any) => {
    console.log("Form submitted with values:", {
      customerName: values.customerName,
      customerContact: values.customerContact,
      customerAddress: values.customerAddress,
      requestNumber: values.requestNumber,
      bankId: values.bankId,
      branchId: values.branchId,
      assignedEngineerId: values.assignedEngineerId,
    });

    // If this is a new case with customer data, create the customer first
    if (isNewCase && values.customerName) {
      setIsCreatingCustomer(true);
      try {
        console.log("Creating customer with:", {
          name: values.customerName,
          contact: values.customerContact,
          address: values.customerAddress,
        });
        const newCustomer = await api_createCustomer({
          name: values.customerName,
          contact: values.customerContact,
          email: values.customerEmail || undefined,
          address: values.customerAddress,
        });

        console.log("Customer created successfully:", newCustomer.id);

        // Call parent submit with the new customer ID
        await onSubmit({
          customerId: newCustomer.id,
          requestNumber: values.requestNumber,
          bankId: values.bankId,
          branchId: values.branchId,
          assignedEngineerId: values.assignedEngineerId,
        });
        
        console.log("Case submitted successfully");
      } catch (err) {
        console.error("Error creating customer or case:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        toast.error(`Failed to create customer or case: ${errorMessage}`);
        setIsCreatingCustomer(false);
      }
    } else {
      // For edit mode or if no customer data, just submit normally
      try {
        await onSubmit(values);
        console.log("Case submitted successfully");
      } catch (err) {
        console.error("Error submitting case:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        toast.error(`Failed to submit case: ${errorMessage}`);
      }
    }
  };

  const finalIsSubmitting = isSubmitting || isCreatingCustomer;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
          {/* Customer Fields — shown when creating a new case */}
          {isNewCase && (
            <>
              <div className="border-b pb-6">
                <h3 className="mb-4 font-semibold text-sm">Customer Information</h3>

                {/* Customer Name */}
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Name</FormLabel>
                      <Input
                        {...field}
                        placeholder="Enter customer name"
                        disabled={finalIsSubmitting}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Customer Contact */}
                <FormField
                  control={form.control}
                  name="customerContact"
                  render={({ field }) => {
                    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      // Only allow digits, remove everything else
                      const value = e.target.value.replace(/\D/g, "");
                      field.onChange(value);
                    };
                    
                    return (
                      <FormItem className="mb-4">
                        <FormLabel>Contact</FormLabel>
                        <Input
                          {...field}
                          placeholder="10 digit phone number"
                          maxLength={10}
                          type="tel"
                          disabled={finalIsSubmitting}
                          onChange={handlePhoneChange}
                          inputMode="numeric"
                        />
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Customer Email */}
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Email</FormLabel>
                      <Input
                        {...field}
                        placeholder="Enter email address"
                        type="email"
                        disabled={finalIsSubmitting}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Customer Address */}
                <FormField
                  control={form.control}
                  name="customerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <Textarea
                        {...field}
                        placeholder="Enter address"
                        className="resize-none"
                        rows={3}
                        disabled={finalIsSubmitting}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}

          {/* Request Number — required, first field */}
          <FormField
            control={form.control}
            name="requestNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Request Number</FormLabel>
                <Input
                  {...field}
                  maxLength={15}
                  autoCapitalize="characters"
                  placeholder="Enter bank/customer request reference"
                  disabled={finalIsSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bank & Branch — share a row on wider screens, stack on mobile */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Bank — required select */}
            <FormField
              control={form.control}
              name="bankId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" disabled={finalIsSubmitting}>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Branch — required select */}
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" disabled={finalIsSubmitting}>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Site Engineer — required select, spans full width on wide screens */}
            <FormField
              control={form.control}
              name="assignedEngineerId"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Site Engineer</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" disabled={finalIsSubmitting}>
                      <SelectValue placeholder="Select site engineer" />
                    </SelectTrigger>
                    <SelectContent>
                      {engineers.map((engineer) => (
                        <SelectItem key={engineer.id} value={engineer.id}>
                          <span className="flex flex-col">
                            <span>{engineer.name}</span>
                            <span className="text-xs text-muted-foreground">{engineer.email}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormActions
          submitText={submitText}
          isSubmitting={finalIsSubmitting}
          onCancel={onCancel}
        />
      </form>
    </Form>
  );
}
