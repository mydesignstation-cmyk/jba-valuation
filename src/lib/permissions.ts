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
  | "fieldVisit.access"
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

export const permissionRoles: Record<Permission, Role[]> = {
  "dashboard.view": ALL,
  "cases.view": ADMINS,
  "cases.create": ADMINS,
  "cases.update": ADMINS,
  "cases.delete": ADMINS,
  "cases.detail": [...ADMINS, "SITE_ENGINEER"],
  "fieldVisit.access": [...ADMINS, "SITE_ENGINEER"],
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
  "customers.delete": ADMINS,
  "banks.view": ADMINS,
  "banks.create": ADMINS,
  "banks.update": ADMINS,
  "banks.delete": ADMINS,
  "branches.view": ADMINS,
  "branches.create": ADMINS,
  "branches.update": ADMINS,
  "branches.delete": ADMINS,
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && permissionRoles[permission].includes(role);
}
