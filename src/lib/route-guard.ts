import { redirect } from "@tanstack/react-router";
import { getCurrentUser, isBootstrapped, bootstrapSession } from "@/lib/auth-client";
import { can, type Permission } from "@/lib/permissions";

/** Reusable beforeLoad guard: unauthenticated → /auth/login, forbidden → /403. */
export function requirePermission(permission?: Permission) {
  return async () => {
    // On first navigation (e.g. a hard refresh) restore the session from the
    // Neon Auth cookie before deciding whether to redirect.
    if (!isBootstrapped()) {
      await bootstrapSession();
    }
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/auth/login" });
    if (permission && !can(user.role, permission)) throw redirect({ to: "/403" });
  };
}
