import { redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/mock-auth";
import { can, type Permission } from "@/lib/permissions";

/** Reusable beforeLoad guard: unauthenticated → /auth/login, forbidden → /403. */
export function requirePermission(permission?: Permission) {
  return () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/auth/login" });
    if (permission && !can(user.role, permission)) throw redirect({ to: "/403" });
  };
}
