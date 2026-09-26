import { Button } from "@/components/ui/button";

interface FormActionsProps {
  submitText: string;
  isSubmitting?: boolean;
  onCancel?: (() => void) | undefined;
}

/**
 * Sticky action bar for modal forms.
 *
 * Pins to the bottom of the scrollable form body so the primary CTA is always
 * reachable, even on small screens with long forms. On mobile the buttons go
 * full width and stack the primary action on top for thumb reach.
 */
export function FormActions({ submitText, isSubmitting = false, onCancel }: FormActionsProps) {
  return (
    <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Submitting..." : submitText}
      </Button>
    </div>
  );
}
