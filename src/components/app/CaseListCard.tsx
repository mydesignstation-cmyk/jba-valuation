import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/date-format";
import { stageBadgeVariant, stageLabels } from "@/lib/case-format";
import type { CaseStage } from "@/types";

interface CaseListCardProps {
  caseNumber: string;
  requestNumber: string;
  customerName: string;
  bankName: string;
  branchName: string;
  /** Optional, shown on the admin Cases list where an engineer is assigned. */
  engineerName?: string;
  stage: CaseStage;
  createdAt: string | Date;
  onOpen: () => void;
  /** Optional actions slot (e.g. the row actions dropdown on the admin list). */
  actions?: ReactNode;
}

/**
 * A compact, tappable case card for mobile viewports. Shows the essentials
 * (case number + stage) with the customer as the main line and a single muted
 * supporting line (bank · branch · engineer · date). Long values truncate so
 * the layout never overflows on narrow screens.
 */
export function CaseListCard({
  caseNumber,
  requestNumber,
  customerName,
  bankName,
  branchName,
  engineerName,
  stage,
  createdAt,
  onOpen,
  actions,
}: CaseListCardProps) {
  const supporting = [bankName, branchName, engineerName].filter((v) => v && v !== "—").join(" · ");
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
          <Badge variant={stageBadgeVariant[stage]}>{stageLabels[stage]}</Badge>
          {actions}
        </div>
      </div>

      <p className="truncate text-sm font-medium">{customerName}</p>

      <p className="truncate text-xs text-muted-foreground">
        {supporting ? `${supporting} · ${created}` : created}
      </p>
    </div>
  );
}
