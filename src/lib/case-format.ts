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
/**
 * Six pipeline milestones matching the real workflow. The Checker appears
 * twice: once when they assign a Maker (CHECKER_ASSIGN, step 2) and again when
 * they review the Maker's work and submit to the Uploader (CHECKER_REVIEW,
 * step 4). Both render as "Checker".
 */
export type CaseMilestoneKey =
  | "FIELD_VISIT"
  | "CHECKER_ASSIGN"
  | "MAKER"
  | "CHECKER_REVIEW"
  | "UPLOADER"
  | "COMPLETED";

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
  { key: "CHECKER_ASSIGN", label: "Checker", role: "Checker" },
  { key: "MAKER", label: "Maker", role: "Maker" },
  { key: "CHECKER_REVIEW", label: "Checker", role: "Checker" },
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
  // Field Visit (index 0) is current while the visit is pending.
  FIELD_VISIT_PENDING: 0,
  // Field visit submitted but no Maker assigned yet: Field Visit is done and
  // the case now waits on the Checker to assign a Maker, so the first Checker
  // milestone (CHECKER_ASSIGN, index 1) becomes current.
  FIELD_VISIT_SUBMITTED: 1,
  // Checker assigned a Maker: CHECKER_ASSIGN done, Maker (index 2) current.
  MAKER_ASSIGNED: 2,
  MAKER_PENDING: 2,
  // Maker done, waiting to hand off to the Checker's review.
  MAKER_COMPLETED: 2.5,
  // Checker review (CHECKER_REVIEW, index 3) is current.
  CHECKER_PENDING: 3,
  CHECKER_COMPLETED: 3.5,
  // Uploader (index 4) is current while awaiting the final upload.
  UPLOADER_PENDING: 4,
  // Completed (index 5).
  COMPLETED: 5,
};

/**
 * Resolve the six pipeline milestones for a given stage, each tagged with
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
