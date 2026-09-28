import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";

import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/app/FormActions";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createCaseSchema } from "@/schemas/case.schema";
import { api_listCustomers } from "@/data/customer.functions";
import { api_listBanks } from "@/data/bank.functions";
import { api_listBranches } from "@/data/branch.functions";
import { listSiteEngineers } from "@/services/user.service";

export type CaseFormValues = z.infer<typeof createCaseSchema>;

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
}

export function CaseForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText,
}: CaseFormProps) {
  const [customerOpen, setCustomerOpen] = useState(false);

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: api_listCustomers });
  const { data: banks = [] } = useQuery({ queryKey: ["banks"], queryFn: api_listBanks });
  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: api_listBranches });
  const { data: engineers = [] } = useQuery({
    queryKey: ["site-engineers"],
    queryFn: listSiteEngineers,
  });

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      customerId: initialData?.customerId ?? "",
      requestNumber: initialData?.requestNumber ?? "",
      bankId: initialData?.bankId ?? "",
      branchId: initialData?.branchId ?? "",
      assignedEngineerId: initialData?.assignedEngineerId ?? "",
    },
  });

  const selectedCustomerId = form.watch("customerId");
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleSubmit = async (values: CaseFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6">
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
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Customer — required searchable select */}
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Customer</FormLabel>
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerOpen}
                      className={cn(
                        "w-full justify-between font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {selectedCustomer ? selectedCustomer.name : "Select customer"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search customers..." />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={`${customer.name} ${customer.contact}`}
                              onSelect={() => {
                                form.setValue("customerId", customer.id, {
                                  shouldValidate: true,
                                });
                                setCustomerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  customer.id === field.value ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <span className="flex flex-col">
                                <span>{customer.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {customer.contact}
                                </span>
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Property Address — read-only, sourced from the selected Customer */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground">
              Property Address (from Customer)
            </Label>
            <p className="min-h-9 rounded-md border border-dashed bg-muted/40 px-3 py-2 text-sm">
              {selectedCustomer
                ? selectedCustomer.address
                : "Select a customer to view their property address"}
            </p>
          </div>

          {/* Bank & Branch — share a row on wider screens, stack on mobile */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Bank — required select */}
            <FormField
              control={form.control}
              name="bankId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
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

        <FormActions submitText={submitText} isSubmitting={isSubmitting} onCancel={onCancel} />
      </form>
    </Form>
  );
}
