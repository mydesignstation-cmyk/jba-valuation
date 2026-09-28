import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCaseMilestones, stageLabels } from "@/lib/case-format";
import type { CaseStage } from "@/types";

/**
 * Horizontal (desktop) / vertical (mobile) pipeline tracker for a case.
 * Collapses the ten stages into five milestones and marks each as done,
 * current, or upcoming. Read-only — it reflects the case's stage, it does
 * not advance it.
 */
export function CasePipeline({ stage }: { stage: CaseStage }) {
  const milestones = getCaseMilestones(stage);

  return (
    <Card className="shadow-card">
      <CardContent className="py-6">
        {/* Desktop: horizontal stepper */}
        <ol className="hidden items-start sm:flex">
          {milestones.map((m, index) => {
            const isLast = index === milestones.length - 1;
            const done = m.status === "done";
            const current = m.status === "current";
            return (
              <li key={m.key} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {/* leading connector (hidden on first) */}
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      index === 0
                        ? "opacity-0"
                        : done
                          ? "bg-green-600"
                          : current
                            ? "bg-primary"
                            : "bg-border",
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition-colors",
                      done && "border-green-600 bg-green-600 text-white",
                      current && "border-primary bg-primary/10 text-primary ring-4 ring-primary/15",
                      !done && !current && "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  {/* trailing connector (hidden on last) */}
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      isLast ? "opacity-0" : done ? "bg-green-600" : "bg-border",
                    )}
                    aria-hidden
                  />
                </div>
                <div className="mt-2 space-y-0.5 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      current
                        ? "text-primary"
                        : done
                          ? "text-green-700"
                          : "text-muted-foreground",
                    )}
                  >
                    {m.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Mobile: vertical stepper */}
        <ol className="space-y-0 sm:hidden">
          {milestones.map((m, index) => {
            const isLast = index === milestones.length - 1;
            const done = m.status === "done";
            const current = m.status === "current";
            return (
              <li key={m.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition-colors",
                      done && "border-green-600 bg-green-600 text-white",
                      current && "border-primary bg-primary/10 text-primary ring-4 ring-primary/15",
                      !done && !current && "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  {!isLast && (
                    <span
                      className={cn("my-1 w-0.5 flex-1", done ? "bg-green-600" : "bg-border")}
                      aria-hidden
                    />
                  )}
                </div>
                <div className={cn("space-y-0.5", isLast ? "pb-0" : "pb-6")}>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      current
                        ? "text-primary"
                        : done
                          ? "text-green-700"
                          : "text-muted-foreground",
                    )}
                  >
                    {m.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-4 text-center text-xs text-muted-foreground sm:mt-6">
          Current stage: <span className="font-medium text-foreground">{stageLabels[stage]}</span>
        </p>
      </CardContent>
    </Card>
  );
}
