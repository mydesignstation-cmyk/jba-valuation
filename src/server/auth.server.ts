/**
 * Server-side authentication helpers.
 *
 * Authentication is backed by Neon Auth (Managed Better Auth), a hosted REST
 * API. On the client we talk to it directly (see src/lib/auth-client.ts). On
 * the SERVER we cannot trust anything the browser sends in a request body — a
 * caller could claim to be any engineer. Instead we resolve the current user
 * from the httpOnly session cookie that the browser automatically attaches to
 * every request:
 *
 *   1. Read the incoming request's `Cookie` header (server-only, via the
 *      TanStack Start request context).
 *   2. Forward that cookie to Neon Auth's `GET /get-session` endpoint.
 *   3. Trust only the user object Neon Auth returns.
 *
 * This makes the server the sole authority on "who is calling", so a
 * SITE_ENGINEER can never see another engineer's data by tampering with a
 * request argument.
 */

import { getRequestHeader } from "@tanstack/react-start/server";
import type { Role, User } from "@/types";

const KNOWN_ROLES = new Set<Role>([
  "SUPER_ADMIN",
  "ADMIN",
  "SITE_ENGINEER",
  "MAKER",
  "CHECKER",
  "UPLOADER",
]);

/**
 * Server-side Neon Auth base URL. Mirrors the client's VITE_NEON_AUTH_URL but
 * read from a server-only env var so it is never bundled into the browser.
 */
const AUTH_BASE_URL: string =
  process.env["NEON_AUTH_BASE_URL"] ?? process.env["VITE_NEON_AUTH_URL"] ?? "";

interface NeonAuthUserRow {
  id: string;
  name: string | null;
  email: string;
  role?: string | null;
}

function toAppUser(raw: NeonAuthUserRow | null | undefined): User | null {
  if (!raw?.id) return null;
  const role = raw.role && KNOWN_ROLES.has(raw.role as Role) ? (raw.role as Role) : null;
  if (!role) return null;
  return {
    id: raw.id,
    name: raw.name ?? raw.email,
    email: raw.email,
    role,
  };
}

/**
 * Resolve the currently authenticated user from the request session cookie.
 * Returns null when there is no valid session or the user has no known role.
 *
 * The identity is derived entirely from the httpOnly cookie — never from a
 * client-supplied argument — so it is safe to use as an authorization anchor.
 */
export async function getServerUser(): Promise<User | null> {
  if (!AUTH_BASE_URL) {
    console.error("NEON_AUTH_BASE_URL is not set. Server-side session resolution will fail.");
    return null;
  }

  const cookie = getRequestHeader("cookie");
  if (!cookie) return null;

  try {
    const res = await fetch(`${AUTH_BASE_URL}/get-session`, {
      method: "GET",
      headers: {
        cookie,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as { user?: NeonAuthUserRow } | null;
    return toAppUser(data?.user);
  } catch (error) {
    console.error("Failed to resolve server-side session:", error);
    return null;
  }
}

/**
 * Resolve the current user and require that they hold one of the given roles.
 * Throws when unauthenticated or the role is not permitted, so callers can rely
 * on the returned user being authorized.
 */
export async function requireServerUser(...allowedRoles: Role[]): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
