import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange"
> {
  value: string;
  onValueChange: (value: string) => void;
  containerClassName?: string;
}

/**
 * Reusable search box with the search icon rendered inside the input.
 * Use across list/index screens for a consistent search experience.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { value, onValueChange, placeholder = "Search...", className, containerClassName, ...props },
    ref,
  ) => {
    return (
      // FEATURE-HIDDEN (CSS-only): `feature-hidden-search` hides every search
      // box app-wide during the staged rollout. The input stays mounted and
      // functional. To release, remove `feature-hidden-search` from the
      // container class below. See docs/feature-reveal-flags.md.
      <div className={cn("feature-hidden-search relative w-full sm:w-64", containerClassName)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={cn("pl-9", className)}
          {...props}
        />
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
