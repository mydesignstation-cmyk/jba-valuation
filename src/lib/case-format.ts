import type { CaseStage } from "@/types";

/** Human-readable labels for case stages, shared across case views. */
export const stageLabels: Record<CaseStage, string> = {
  CREATED: "Created",
  ASSIGNED: "Assigned",
  FIELD_VISIT_PENDING: "Field Visit Pending",
  FIELD_VISIT_SUBMITTED: "Field Visit Submitted",
  MAKER_ASSIGNED: "Maker Assigned",
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
  MAKER_ASSIGNED: "secondary",
  MAKER_PENDING: "secondary",
  MAKER_COMPLETED: "secondary",
  CHECKER_PENDING: "secondary",
  CHECKER_COMPLETED: "secondary",
  UPLOADER_PENDING: "secondary",
  COMPLETED: "default",
};

/**
 * A Site Engineer's work on a case is the field visit. From their point of
 * view a case is "Pending" until they submit the field visit, and "Completed"
 * once it has been submitted (regardless of where the case travels afterwards
 * in the maker/checker/uploader pipeline). This is the single source of truth
 * for that split, shared by My Cases and the engineer dashboard.
 */
export function isEngineerCasePending(stage: CaseStage): boolean {
  return stage === "CREATED" || stage === "ASSIGNED" || stage === "FIELD_VISIT_PENDING";
}

/**
 * A Maker's work on a case is the maker report. From their point of view a
 * case is "Pending" while it is still waiting on them (just assigned, or maker
 * work in progress) and "Completed" once they have finished their maker step
 * (regardless of where the case travels afterwards in the checker/uploader
 * pipeline). Single source of truth for that split, shared by the Maker Queue
 * and the maker dashboard.
 */
export function isMakerCasePending(stage: CaseStage): boolean {
  return stage === "MAKER_ASSIGNED" || stage === "MAKER_PENDING";
}

/**
 * An Uploader's work on a case is the final upload. From their point of view a
 * case is "Pending" while it awaits the upload (UPLOADER_PENDING) and
 * "Completed" once it has been closed (COMPLETED). Single source of truth for
 * that split, shared by the uploader dashboard.
 */
export function isUploaderCasePending(stage: CaseStage): boolean {
  return stage === "UPLOADER_PENDING";
}

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
  // Field visit is submitted but no Maker assigned yet: keep the Field Visit
  // milestone current and do NOT light up the Maker milestone. Advancing the
  // pipeline is the Checker's Maker-assignment action, not submission.
  FIELD_VISIT_SUBMITTED: 0,
  // Checker has assigned a Maker: Field Visit is done, Maker is now current.
  MAKER_ASSIGNED: 1,
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
