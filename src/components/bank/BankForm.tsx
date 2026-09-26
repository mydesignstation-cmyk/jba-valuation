import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormActions } from "@/components/app/FormActions";
import { createBankSchema } from "@/schemas/bank.schema";

export type BankFormValues = z.infer<typeof createBankSchema>;

interface BankFormProps {
  initialData?:
    | {
        name: string;
      }
    | undefined;
  onSubmit: (data: BankFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitText: string;
}

export function BankForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText,
}: BankFormProps) {
  const form = useForm<BankFormValues>({
    resolver: zodResolver(createBankSchema),
    defaultValues: {
      name: initialData?.name ?? "",
    },
  });

  const handleSubmit = async (values: BankFormValues) => {
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
                <FormLabel>Bank Name</FormLabel>
                <Input {...field} placeholder="Enter bank name" />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormActions submitText={submitText} isSubmitting={isSubmitting} onCancel={onCancel} />
      </form>
    </Form>
  );
}
