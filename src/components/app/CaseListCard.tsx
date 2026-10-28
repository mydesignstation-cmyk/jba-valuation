import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/date-format";
import { stageBadgeVariant, stageLabels, stageColors } from "@/lib/case-format";
import type { CaseStage } from "@/types";

interface CaseListCardProps {
  caseNumber: string;
  requestNumber: string;
  customerName: string;
  bankName: string;
  branchName: string;
  /** Optional, shown on the admin Cases list where an engineer is assigned. */
  engineerName?: string;
  /** Names of assigned Maker/Checker shown on hover. */
  assignmentTooltip?: string | undefined;
  stage: CaseStage;
  /** Shows a green check and "Field Visit" for submitted visits. */
  fieldVisitIconLabel?: boolean;
  createdAt: string | Date;
  onOpen: () => void;
  /** Optional actions slot (e.g. the row actions dropdown on the admin list). */
  actions?: ReactNode;
}

/**
 * A compact, tappable case card for mobile viewports. Shows the essentials
 * (case number + stage) with the customer as the main line and bank/branch as
 * a compact two-line detail. Long values truncate so the layout never overflows
 * on narrow screens.
 */
export function CaseListCard({
  caseNumber,
  requestNumber,
  customerName,
  bankName,
  branchName,
  engineerName,
  assignmentTooltip,
  stage,
  fieldVisitIconLabel = false,
  createdAt,
  onOpen,
  actions,
}: CaseListCardProps) {
  const created = formatDisplayDate(createdAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "flex flex-col gap-1 rounded-lg border bg-card p-3 text-card-foreground shadow-sm",
        "cursor-pointer transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{caseNumber}</p>
          {requestNumber ? (
            <p className="truncate text-xs text-muted-foreground">Req {requestNumber}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge
            title={assignmentTooltip || undefined}
            className={cn(stageColors[stage].bg, stageColors[stage].text, "border-0 hover:brightness-90")}
          >
            {fieldVisitIconLabel && stage === "FIELD_VISIT_SUBMITTED" ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Field Visit
              </span>
            ) : (
              stageLabels[stage]
            )}
          </Badge>
          {actions}
        </div>
      </div>

      <p className="truncate text-sm font-medium">{customerName}</p>

      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{bankName}</p>
        <p className="truncate text-xs text-muted-foreground">{branchName}</p>
      </div>

      <p className="truncate text-xs text-muted-foreground">
        {[engineerName, created].filter((v) => v && v !== "—").join(" · ")}
      </p>
    </div>
  );
}
