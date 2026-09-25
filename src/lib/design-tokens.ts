/**
 * Centralized design tokens (TypeScript mirror of src/styles.css @theme).
 *
 * Colors, radius, typography, spacing and shadows are defined as CSS
 * variables in src/styles.css and consumed via Tailwind utilities
 * (bg-primary, text-muted-foreground, rounded-lg, shadow-card, ...).
 * This file exposes the token *names* for use in JS/TS (charts, badges,
 * dynamic class selection) without hardcoding values.
 */

export const statusColors = {
  created: "bg-status-created text-status-created-foreground",
  engineerAssigned: "bg-status-assigned text-status-assigned-foreground",
  fieldVisitSubmitted: "bg-status-submitted text-status-submitted-foreground",
  makerCompleted: "bg-status-maker text-status-maker-foreground",
  checkerCompleted: "bg-status-checker text-status-checker-foreground",
  uploaded: "bg-status-uploaded text-status-uploaded-foreground",
} as const;

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
