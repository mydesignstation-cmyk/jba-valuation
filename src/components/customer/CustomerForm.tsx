import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormActions } from "@/components/app/FormActions";
import { createCustomerSchema } from "@/schemas/customer.schema";

export type CustomerFormValues = z.infer<typeof createCustomerSchema>;

interface CustomerFormProps {
  initialData?:
    | {
        name: string;
        contact: string;
        email: string;
        address: string;
        alternativeContactPersonName?: string;
        alternativePhoneNumber?: string;
      }
    | undefined;
  onSubmit: (data: CustomerFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitText: string;
}

export function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText,
}: CustomerFormProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      contact: initialData?.contact ?? "",
      email: initialData?.email ?? "",
      address: initialData?.address ?? "",
      alternativeContactPersonName: initialData?.alternativeContactPersonName ?? "",
      alternativePhoneNumber: initialData?.alternativePhoneNumber ?? "",
    },
  });

  const handleSubmit = async (values: CustomerFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <Input {...field} placeholder="Enter customer name" />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => {
              const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value.replace(/\D/g, "");
                field.onChange(value);
              };

              return (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <Input
                    {...field}
                    placeholder="10 digit phone number"
                    maxLength={10}
                    type="tel"
                    onChange={handlePhoneChange}
                    inputMode="numeric"
                  />
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input {...field} placeholder="Enter email address" type="email" />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <Textarea {...field} placeholder="Enter address" className="resize-none" rows={3} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="alternativeContactPersonName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternative Contact Person Name</FormLabel>
                  <Input {...field} placeholder="Enter name" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alternativePhoneNumber"
              render={({ field }) => {
                const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value.replace(/\D/g, "");
                  field.onChange(value);
                };

                return (
                  <FormItem>
                    <FormLabel>Alternative Phone Number</FormLabel>
                    <Input
                      {...field}
                      placeholder="10 digit phone number"
                      maxLength={10}
                      type="tel"
                      onChange={handlePhoneChange}
                      inputMode="numeric"
                    />
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>

        <FormActions submitText={submitText} isSubmitting={isSubmitting} onCancel={onCancel} />
      </form>
    </Form>
  );
}
