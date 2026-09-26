import type { CaseStage } from "@/types";

/** Human-readable labels for case stages, shared across case views. */
export const stageLabels: Record<CaseStage, string> = {
  CREATED: "Created",
  ASSIGNED: "Assigned",
  FIELD_VISIT_PENDING: "Field Visit Pending",
  FIELD_VISIT_SUBMITTED: "Field Visit Submitted",
  MAKER_PENDING: "Maker Pending",
  MAKER_COMPLETED: "Maker Completed",
  CHECKER_PENDING: "Checker Pending",
  CHECKER_COMPLETED: "Checker Completed",
  UPLOADER_PENDING: "Uploader Pending",
  COMPLETED: "Completed",
};

/** Badge variant per stage, so status reads consistently across case views. */
export const stageBadgeVariant: Record<CaseStage, "default" | "secondary" | "outline"> = {
  CREATED: "outline",
  ASSIGNED: "secondary",
  FIELD_VISIT_PENDING: "secondary",
  FIELD_VISIT_SUBMITTED: "secondary",
  MAKER_PENDING: "secondary",
  MAKER_COMPLETED: "secondary",
  CHECKER_PENDING: "secondary",
  CHECKER_COMPLETED: "secondary",
  UPLOADER_PENDING: "secondary",
  COMPLETED: "default",
};
