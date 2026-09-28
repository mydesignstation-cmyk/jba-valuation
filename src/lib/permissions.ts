import type { Role } from "@/types";

/**
 * Centralized role → permission map (single source of truth for the UI).
 * NOTE: UI checks are for navigation/visibility only. The same rules must be
 * enforced server-side once a backend exists.
 */
export type Permission =
  | "dashboard.view"
  | "cases.view"
  | "cases.create"
  | "cases.update"
  | "cases.delete"
  | "cases.detail"
  | "cases.assignMaker"
  | "cases.reassignMaker"
  | "fieldVisit.access"
  | "fieldVisit.edit"
  | "myCases.view"
  | "maker.access"
  | "checker.access"
  | "uploader.access"
  | "masterData.view"
  | "notifications.view"
  | "profile.view"
  | "customers.view"
  | "customers.create"
  | "customers.update"
  | "customers.delete"
  | "banks.view"
  | "banks.create"
  | "banks.update"
  | "banks.delete"
  | "branches.view"
  | "branches.create"
  | "branches.update"
  | "branches.delete";

const ALL: Role[] = ["SUPER_ADMIN", "ADMIN", "SITE_ENGINEER", "MAKER", "CHECKER", "UPLOADER"];
const ADMINS: Role[] = ["SUPER_ADMIN", "ADMIN"];
const SUPER_ADMIN_ONLY: Role[] = ["SUPER_ADMIN"];

export const permissionRoles: Record<Permission, Role[]> = {
  "dashboard.view": ALL,
  "cases.view": ADMINS,
  "cases.create": ADMINS,
  "cases.update": ADMINS,
  "cases.delete": SUPER_ADMIN_ONLY,
  // Case detail is reachable by the roles that act on a case: admins, the
  // owning site engineer, and — once the field visit is submitted — the
  // Checker (to assign a Maker), the assigned Maker (to view it), and the
  // Uploader (to open a case in their queue and mark the upload completed).
  "cases.detail": [...ADMINS, "SITE_ENGINEER", "CHECKER", "MAKER", "UPLOADER"],
  // Assigning a Maker (when none is assigned) is a Checker or admin action.
  // Reassigning/changing an existing Maker is an admin-only responsibility.
  // These are UI gates only; api_assignMaker is the server-side authority.
  "cases.assignMaker": [...ADMINS, "CHECKER"],
  "cases.reassignMaker": ADMINS,
  "fieldVisit.access": [...ADMINS, "SITE_ENGINEER"],
  // Editing a submitted field visit is the assigned Maker's review-time
  // correction. UI gate only; api_updateFieldVisit enforces the assignment
  // and stage server-side. Admins are included for UI parity but the server
  // guard currently limits writes to the assigned MAKER.
  "fieldVisit.edit": [...ADMINS, "MAKER"],
  "myCases.view": ["SITE_ENGINEER"],
  "maker.access": ["MAKER"],
  "checker.access": ["CHECKER"],
  "uploader.access": ["UPLOADER"],
  "masterData.view": ADMINS,
  "notifications.view": ALL,
  "profile.view": ALL,
  "customers.view": ADMINS,
  "customers.create": ADMINS,
  "customers.update": ADMINS,
  "customers.delete": SUPER_ADMIN_ONLY,
  "banks.view": ADMINS,
  "banks.create": ADMINS,
  "banks.update": ADMINS,
  "banks.delete": SUPER_ADMIN_ONLY,
  "branches.view": ADMINS,
  "branches.create": ADMINS,
  "branches.update": ADMINS,
  "branches.delete": SUPER_ADMIN_ONLY,
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && permissionRoles[permission].includes(role);
}
