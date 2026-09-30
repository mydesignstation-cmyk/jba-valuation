import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createCaseSchema } from "@/schemas/case.schema";
import { createCustomerSchema } from "@/schemas/customer.schema";
import { api_createCustomer, api_listCustomers } from "@/data/customer.functions";
import { api_listBanks } from "@/data/bank.functions";
import { api_listBranches } from "@/data/branch.functions";
import { listSiteEngineers } from "@/services/user.service";
import { toast } from "sonner";

export type CaseFormValues = z.infer<typeof createCaseSchema>;
export type CustomerFormValues = z.infer<typeof createCustomerSchema>;

interface CaseWithCustomerTabsProps {
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

export function CaseWithCustomerTabs({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText,
  isNewCase = false,
}: CaseWithCustomerTabsProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"customer" | "case">("customer");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialData?.customerId ?? ""
  );
  const [useExisting, setUseExisting] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Load data - all at top level (no conditional hooks)
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: api_listCustomers,
  });
  const { data: banks = [] } = useQuery({ queryKey: ["banks"], queryFn: api_listBanks });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: api_listBranches });
  const { data: engineers = [] } = useQuery({
    queryKey: ["site-engineers"],
    queryFn: listSiteEngineers,
  });

  // All forms created at top level (no conditional hooks)
  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: "",
      contact: "",
      email: "",
      address: "",
    },
  });

  const caseForm = useForm<CaseFormValues>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      customerId: selectedCustomerId,
      requestNumber: initialData?.requestNumber ?? "",
      bankId: initialData?.bankId ?? "",
      branchId: initialData?.branchId ?? "",
      assignedEngineerId: initialData?.assignedEngineerId ?? "",
    },
  });

  const handleCreateCustomer = async (values: CustomerFormValues) => {
    setIsCreatingCustomer(true);
    try {
      console.log("Creating customer:", values.name);
      const newCustomer = await api_createCustomer(values);
      console.log("Customer created:", newCustomer.id);

      setSelectedCustomerId(newCustomer.id);
      caseForm.setValue("customerId", newCustomer.id, { shouldValidate: true });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });

      setActiveTab("case");
      toast.success("Customer created successfully");
      customerForm.reset();
    } catch (err) {
      console.error("Error creating customer:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to create customer: ${errorMessage}`);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleSelectExisting = (customerId: string) => {
    setSelectedCustomerId(customerId);
    caseForm.setValue("customerId", customerId, { shouldValidate: true });
  };

  const handleProceedToCaseDetails = () => {
    if (!selectedCustomerId) {
      toast.error("Please create or select a customer first");
      return;
    }
    setActiveTab("case");
  };

  const handleCreateCase = async (values: CaseFormValues) => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer first");
      return;
    }

    try {
      await onSubmit({
        ...values,
        customerId: selectedCustomerId,
      });
      console.log("Case created successfully");
    } catch (err) {
      console.error("Error creating case:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to create case: ${errorMessage}`);
    }
  };

  const selectedCustomerName = customers.find((c) => c.id === selectedCustomerId)?.name;

  // For edit mode, skip tabs and go straight to case form
  if (!isNewCase || initialData?.customerId) {
    return (
      <Form {...caseForm}>
        <form onSubmit={caseForm.handleSubmit(handleCreateCase)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
            <FormField
              control={caseForm.control}
              name="requestNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Number</FormLabel>
                  <Input
                    {...field}
                    maxLength={15}
                    autoCapitalize="characters"
                    placeholder="Enter bank/customer request reference"
                    disabled={isSubmitting}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                control={caseForm.control}
                name="bankId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" disabled={isSubmitting}>
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

              <FormField
                control={caseForm.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" disabled={isSubmitting}>
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

              <FormField
                control={caseForm.control}
                name="assignedEngineerId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Site Engineer</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" disabled={isSubmitting}>
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
            isSubmitting={isSubmitting}
            onCancel={onCancel}
          />
        </form>
      </Form>
    );
  }

  // 2-Tab interface: Customer (default create) + Case Details
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex flex-1 flex-col">
        <TabsList className="grid w-full grid-cols-2 px-4 pt-4">
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="case" disabled={!selectedCustomerId}>
            Case Details
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Customer (Create by default, with option to use existing) */}
        <TabsContent value="customer" className="flex flex-1 flex-col">
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(handleCreateCustomer)} className="flex flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6">
                <div>
                  <h3 className="mb-4 font-semibold text-sm">Create New Customer</h3>

                  <FormField
                    control={customerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Name</FormLabel>
                        <Input
                          {...field}
                          placeholder="Enter customer name"
                          disabled={isCreatingCustomer || useExisting}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={customerForm.control}
                    name="contact"
                    render={({ field }) => {
                      const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                            disabled={isCreatingCustomer || useExisting}
                            onChange={handlePhoneChange}
                            inputMode="numeric"
                          />
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={customerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Email</FormLabel>
                        <Input
                          {...field}
                          placeholder="Enter email address (optional)"
                          type="email"
                          disabled={isCreatingCustomer || useExisting}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={customerForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Address</FormLabel>
                        <Textarea
                          {...field}
                          placeholder="Enter address"
                          className="resize-none"
                          rows={3}
                          disabled={isCreatingCustomer || useExisting}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isCreatingCustomer || useExisting}
                    className="w-full"
                  >
                    {isCreatingCustomer ? "Creating..." : "Create Customer"}
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Use Existing Customer Option */}
                <div>
                  <div className="mb-4 flex items-center space-x-2">
                    <Checkbox
                      id="useExisting"
                      checked={useExisting}
                      onCheckedChange={(checked) => {
                        setUseExisting(checked as boolean);
                        if (!checked) {
                          setSelectedCustomerId("");
                        }
                      }}
                    />
                    <Label htmlFor="useExisting" className="text-sm font-medium cursor-pointer">
                      Use Existing Customer
                    </Label>
                  </div>

                  {useExisting && (
                    <div className="space-y-2">
                      <FormLabel>Select Customer</FormLabel>
                      {customers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No customers found</p>
                      ) : (
                        <Select value={selectedCustomerId} onValueChange={handleSelectExisting}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name} ({customer.contact})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t px-4 py-4 sm:px-6">
                <Button
                  type="button"
                  onClick={handleProceedToCaseDetails}
                  disabled={!selectedCustomerId}
                  className="w-full"
                >
                  Next: Case Details
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Tab 2: Case Details */}
        <TabsContent value="case" className="flex flex-1 flex-col">
          <Form {...caseForm}>
            <form onSubmit={caseForm.handleSubmit(handleCreateCase)} className="flex flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
                {/* Selected Customer Display */}
                {selectedCustomerName && (
                  <div className="rounded-md bg-blue-50 p-3">
                    <p className="text-sm font-medium text-blue-900">
                      Selected Customer: <span className="font-bold">{selectedCustomerName}</span>
                    </p>
                  </div>
                )}

                {/* Request Number */}
                <FormField
                  control={caseForm.control}
                  name="requestNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Number</FormLabel>
                      <Input
                        {...field}
                        maxLength={15}
                        autoCapitalize="characters"
                        placeholder="Enter bank/customer request reference"
                        disabled={isSubmitting}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bank & Branch & Engineer */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField
                    control={caseForm.control}
                    name="bankId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full" disabled={isSubmitting}>
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

                  <FormField
                    control={caseForm.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full" disabled={isSubmitting}>
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

                  <FormField
                    control={caseForm.control}
                    name="assignedEngineerId"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Site Engineer</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full" disabled={isSubmitting}>
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
                isSubmitting={isSubmitting}
                onCancel={onCancel}
              />
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
