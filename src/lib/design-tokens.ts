import type { CaseStage } from "@/types";

/**
 * Centralized design tokens (TypeScript mirror of src/styles.css @theme).
 *
 * Colors, radius, typography, spacing and shadows are defined as CSS
 * variables in src/styles.css and consumed via Tailwind utilities
 * (bg-primary, text-muted-foreground, rounded-lg, shadow-card, ...).
 * This file exposes the token *names* for use in JS/TS (charts, badges,
 * dynamic class selection) without hardcoding values.
 */

export const statusColors: Record<CaseStage, string> = {
  CREATED: "bg-status-created text-status-created-foreground",
  ASSIGNED: "bg-status-assigned text-status-assigned-foreground",
  FIELD_VISIT_PENDING: "bg-status-pending text-status-pending-foreground",
  FIELD_VISIT_SUBMITTED: "bg-status-submitted text-status-submitted-foreground",
  HOLD: "bg-status-pending text-status-pending-foreground",
  MAKER_ASSIGNED: "bg-status-maker text-status-maker-foreground",
  MAKER_PENDING: "bg-status-pending text-status-pending-foreground",
  MAKER_COMPLETED: "bg-status-maker text-status-maker-foreground",
  CHECKER_PENDING: "bg-status-pending text-status-pending-foreground",
  CHECKER_COMPLETED: "bg-status-checker text-status-checker-foreground",
  UPLOADER_PENDING: "bg-status-pending text-status-pending-foreground",
  COMPLETED: "bg-status-uploaded text-status-uploaded-foreground",
};

export const stageLabels: Record<CaseStage, string> = {
  CREATED: "Created",
  ASSIGNED: "Assigned",
  FIELD_VISIT_PENDING: "Field Visit Pending",
  FIELD_VISIT_SUBMITTED: "Field Visit Submitted",
  HOLD: "On Hold",
  MAKER_ASSIGNED: "Maker Assigned",
  MAKER_PENDING: "Maker Pending",
  MAKER_COMPLETED: "Maker Completed",
  CHECKER_PENDING: "Checker Pending",
  CHECKER_COMPLETED: "Checker Completed",
  UPLOADER_PENDING: "Uploader Pending",
  COMPLETED: "Completed",
};

export const typography = {
  display: "text-4xl font-bold tracking-tight",
  h1: "text-3xl font-semibold tracking-tight",
  h2: "text-2xl font-semibold",
  h3: "text-xl font-semibold",
  body: "text-base",
  small: "text-sm text-muted-foreground",
  caption: "text-xs text-muted-foreground",
} as const;

export const spacing = {
  page: "p-6 md:p-8",
  section: "space-y-6",
  card: "p-4 md:p-6",
} as const;

export const shadows = {
  card: "shadow-card",
  popover: "shadow-popover",
} as const;
