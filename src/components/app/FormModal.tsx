import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Generic modal shell for create/edit forms.
 *
 * Layout is a flex column with three regions:
 *   - header  : fixed, never scrolls
 *   - body    : the form (its scrollable fields + sticky action bar live inside)
 *
 * On mobile the dialog docks to the bottom of the screen as a sheet
 * (full width, rounded top) and is height-capped so long forms scroll
 * while the action bar stays pinned. See DialogContent + FormActions.
 */
export function FormModal({ open, onOpenChange, title, description, children }: FormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-1.5 border-b px-4 py-4 text-left sm:px-6">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
