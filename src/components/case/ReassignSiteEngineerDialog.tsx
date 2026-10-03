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
import { listSiteEngineers } from "@/services/user.service";

interface ReassignSiteEngineerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseNumber: string;
  currentEngineerId: string;
  onReassign: (engineerId: string) => Promise<void>;
  isSubmitting: boolean;
}

export function ReassignSiteEngineerDialog({
  open,
  onOpenChange,
  caseNumber,
  currentEngineerId,
  onReassign,
  isSubmitting,
}: ReassignSiteEngineerDialogProps) {
  const [engineerId, setEngineerId] = useState("");
  const { data: engineers = [], isLoading, isError } = useQuery({
    queryKey: ["site-engineers"],
    queryFn: listSiteEngineers,
    enabled: open,
  });
  const availableEngineers = engineers.filter((engineer) => engineer.id !== currentEngineerId);

  useEffect(() => {
    if (open) setEngineerId("");
  }, [open, currentEngineerId]);

  const handleReassign = async () => {
    if (!engineerId || isSubmitting) return;
    await onReassign(engineerId);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setEngineerId("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Reassign Site Engineer
          </DialogTitle>
          <DialogDescription>
            Choose a different Site Engineer for case {caseNumber}. The current engineer is not
            selectable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="reassign-site-engineer-select">Select Site Engineer</Label>
          <Select value={engineerId} onValueChange={setEngineerId} disabled={isLoading || isSubmitting}>
            <SelectTrigger id="reassign-site-engineer-select">
              <SelectValue
                placeholder={
                  isLoading
                    ? "Loading site engineers..."
                    : availableEngineers.length === 0
                      ? "No other site engineers available"
                      : "Choose a site engineer"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableEngineers.map((engineer) => (
                <SelectItem key={engineer.id} value={engineer.id}>
                  <span className="flex flex-col">
                    <span className="font-medium">{engineer.name}</span>
                    {engineer.email && engineer.email !== engineer.name && (
                      <span className="text-xs text-muted-foreground">{engineer.email}</span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isError && (
            <p className="text-sm text-destructive">
              Failed to load site engineers. Please try again.
            </p>
          )}
          {!isLoading && !isError && availableEngineers.length === 0 && (
            <p className="text-sm text-muted-foreground">No different active Site Engineer is available.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={!engineerId || isSubmitting}>
            {isSubmitting ? "Reassigning..." : "Reassign Site Engineer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
