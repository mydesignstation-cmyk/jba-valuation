import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserCog } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { listMakers } from "@/services/user.service";

interface AssignMakerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Human-readable case number, shown in the dialog copy. */
  caseNumber: string;
  /** Called with the chosen Maker's Neon Auth UUID. Should perform the assign. */
  onAssign: (makerId: string) => Promise<void>;
  isSubmitting: boolean;
  /**
   * Reassignment mode (Admin / Super Admin changing an existing Maker). Adjusts
   * the copy and pre-selects the currently assigned Maker. Defaults to false
   * (first-time assignment).
   */
  isReassign?: boolean;
  /** Currently assigned Maker id, used to pre-select the picker on reassign. */
  currentMakerId?: string;
}

/**
 * Small dialog to assign (or reassign) a real Neon Auth MAKER to a case.
 *
 * Loads the live list of MAKER users (banned excluded) from
 * neon_auth."user" through the service layer. The actor picks one and
 * confirms; the parent runs the server-enforced assignment. This dialog only
 * gathers input — the server is the authority on whether the (re)assignment is
 * allowed. The same dialog is reused for Admin/Super Admin reassignment.
 */
export function AssignMakerDialog({
  open,
  onOpenChange,
  caseNumber,
  onAssign,
  isSubmitting,
  isReassign = false,
  currentMakerId,
}: AssignMakerDialogProps) {
  const [makerId, setMakerId] = useState<string>("");

  const {
    data: makers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["makers"],
    queryFn: listMakers,
    enabled: open,
  });

  // On reassign, pre-select the current Maker each time the dialog opens so the
  // admin sees who is assigned and can change it.
  useEffect(() => {
    if (open) {
      setMakerId(isReassign && currentMakerId ? currentMakerId : "");
    }
  }, [open, isReassign, currentMakerId]);

  const title = isReassign ? "Reassign Maker" : "Assign Maker";
  const description = isReassign
    ? `Change the Maker assigned to case ${caseNumber}. Only the newly selected Maker will see this case.`
    : `Assign a Maker to case ${caseNumber}. Only the selected Maker will see this case.`;
  const confirmIdle = isReassign ? "Reassign Maker" : "Assign Maker";
  const confirmBusy = isReassign ? "Reassigning..." : "Assigning...";
  // On reassign, block confirming the no-op of the already-assigned Maker.
  const unchanged = isReassign && !!currentMakerId && makerId === currentMakerId;

  const handleAssign = async () => {
    if (!makerId || unchanged) return;
    await onAssign(makerId);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setMakerId("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="assign-maker-select">Select Maker</Label>
          <Select value={makerId} onValueChange={setMakerId} disabled={isLoading || isSubmitting}>
            <SelectTrigger id="assign-maker-select">
              <SelectValue
                placeholder={
                  isLoading
                    ? "Loading makers..."
                    : makers.length === 0
                      ? "No makers available"
                      : "Choose a maker"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {makers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="flex flex-col">
                    <span className="font-medium">{m.name}</span>
                    {m.email && m.email !== m.name && (
                      <span className="text-xs text-muted-foreground">{m.email}</span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isError && (
            <p className="text-sm text-destructive">Failed to load makers. Please try again.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!makerId || unchanged || isSubmitting}>
            {isSubmitting ? confirmBusy : confirmIdle}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
