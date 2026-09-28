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

/**
 * The case pipeline collapses the ten fine-grained stages into five
 * human-readable milestones, so the workflow reads as a clean tick-by-tick
 * flow (Field Visit → Maker → Checker → Uploader → Completed).
 */
export type CaseMilestoneKey = "FIELD_VISIT" | "MAKER" | "CHECKER" | "UPLOADER" | "COMPLETED";

export type MilestoneStatus = "done" | "current" | "upcoming";

export interface CaseMilestone {
  key: CaseMilestoneKey;
  label: string;
  /** The role that owns this milestone, shown as supporting text. */
  role: string;
  status: MilestoneStatus;
}

/** Milestone definitions in pipeline order. */
const MILESTONE_DEFS: { key: CaseMilestoneKey; label: string; role: string }[] = [
  { key: "FIELD_VISIT", label: "Field Visit", role: "Site Engineer" },
  { key: "MAKER", label: "Maker", role: "Maker" },
  { key: "CHECKER", label: "Checker", role: "Checker" },
  { key: "UPLOADER", label: "Uploader", role: "Uploader" },
  { key: "COMPLETED", label: "Completed", role: "Done" },
];

/**
 * Position of each stage along the pipeline, as a fractional milestone index.
 * A whole number (e.g. 1) means "at the start of that milestone" (current);
 * anything greater than a milestone's index means that milestone is done.
 * CREATED / ASSIGNED sit before Field Visit begins, so nothing is current yet.
 */
const STAGE_POSITION: Record<CaseStage, number> = {
  CREATED: -1,
  ASSIGNED: -0.5,
  FIELD_VISIT_PENDING: 0,
  FIELD_VISIT_SUBMITTED: 0.5,
  MAKER_PENDING: 1,
  MAKER_COMPLETED: 1.5,
  CHECKER_PENDING: 2,
  CHECKER_COMPLETED: 2.5,
  UPLOADER_PENDING: 3,
  COMPLETED: 4,
};

/**
 * Resolve the five pipeline milestones for a given stage, each tagged with
 * whether it is done, current, or upcoming. Drives the pipeline stepper UI.
 */
export function getCaseMilestones(stage: CaseStage): CaseMilestone[] {
  const position = STAGE_POSITION[stage];
  return MILESTONE_DEFS.map((def, index) => {
    let status: MilestoneStatus;
    // A milestone is done once its own work is finished. Whole-number
    // positions mean that milestone's work is pending/in progress (current);
    // half-step positions (…_SUBMITTED / …_COMPLETED) mean it is done and the
    // case is waiting to hand off to the next milestone.
    if (position >= index + 0.5 || (def.key === "COMPLETED" && stage === "COMPLETED")) {
      status = "done";
    } else if (position >= index - 0.5) {
      status = "current";
    } else {
      status = "upcoming";
    }
    return { ...def, status };
  });
}
