import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface StickyFormFooterProps {
  onBack: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  isBackDisabled?: boolean;
  isNextDisabled?: boolean;
  isPending?: boolean;
  showBackButton?: boolean;
  showNextIcon?: boolean;
}

/**
 * Sticky footer component for form navigation (Back, Save & Continue / Submit).
 *
 * Pins to the bottom of the viewport so users don't need to scroll to reach
 * navigation buttons. On mobile, buttons stack with the primary action on top.
 * On desktop, Back is left and Next/Submit is right.
 *
 * Pass parent's pb-24 (or pb-20) on the form content to prevent overlap.
 */
export function StickyFormFooter({
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Save & Continue",
  isBackDisabled = false,
  isNextDisabled = false,
  isPending = false,
  showBackButton = true,
  showNextIcon = true,
}: StickyFormFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 flex shrink-0 flex-col-reverse gap-2 border-t bg-background px-4 py-3 shadow-md sm:flex-row sm:justify-between sm:px-6">
      {showBackButton && (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isBackDisabled || isPending}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>
      )}

      <Button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled || isPending}
        className="w-full sm:w-auto"
      >
        {nextLabel}
        {showNextIcon && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  );
}
