import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormActions } from "@/components/app/FormActions";
import { createBranchSchema } from "@/schemas/branch.schema";

export type BranchFormValues = z.infer<typeof createBranchSchema>;

interface BranchFormProps {
  initialData?:
    | {
        name: string;
      }
    | undefined;
  onSubmit: (data: BranchFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitText: string;
}

export function BranchForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText,
}: BranchFormProps) {
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: initialData?.name ?? "",
    },
  });

  const handleSubmit = async (values: BranchFormValues) => {
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
                <FormLabel>Branch Name</FormLabel>
                <Input {...field} placeholder="Enter branch name" />
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
