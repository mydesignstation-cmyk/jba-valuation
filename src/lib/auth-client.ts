import { useSyncExternalStore } from "react";
import type { Role, User } from "@/types";

/**
 * Real authentication client backed by Neon Auth (Managed Better Auth).
 *
 * The Neon Auth service is a hosted REST API. We talk to it directly over
 * fetch with `credentials: "include"` so the httpOnly session cookie
 * (`__Secure-neon-auth.session_token`) is sent on every request.
 *
 * The signed-in user object returned by Neon Auth carries our application
 * role (SUPER_ADMIN / ADMIN / MAKER / CHECKER / SITE_ENGINEER / UPLOADER)
 * in its `role` field — this is the same value stored in neon_auth.user.role.
 *
 * A synchronous in-memory cache of the current user is kept so route guards
 * (which run in `beforeLoad`) can read the user without awaiting. The cache
 * is populated by `bootstrapSession()` on app start and by `signIn()`.
 */

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrator",
  ADMIN: "Administrator",
  SITE_ENGINEER: "Site Engineer",
  MAKER: "Maker",
  CHECKER: "Checker",
  UPLOADER: "Uploader",
};

const KNOWN_ROLES = new Set<string>([
  "SUPER_ADMIN",
  "ADMIN",
  "SITE_ENGINEER",
  "MAKER",
  "CHECKER",
  "UPLOADER",
]);

/** Placeholder until a real notifications feature exists. */
export const notificationCount = 0;

const AUTH_BASE_URL: string = (import.meta.env["VITE_NEON_AUTH_URL"] as string | undefined) ?? "";

if (!AUTH_BASE_URL && typeof window !== "undefined") {
  // Surface misconfiguration early in the browser console rather than failing silently.
  console.error("VITE_NEON_AUTH_URL is not set. Neon Auth requests will fail.");
}

// ---------------------------------------------------------------------------
// Synchronous current-user store (useSyncExternalStore compatible)
// ---------------------------------------------------------------------------

let current: User | null = null;
let bootstrapped = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setUser(u: User | null) {
  current = u;
  emit();
}

export function getCurrentUser(): User | null {
  return current;
}

/** True once we've attempted to restore a session (success or not). */
export function isBootstrapped(): boolean {
  return bootstrapped;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCurrentUser(): User | null {
  return useSyncExternalStore(subscribe, getCurrentUser, () => null);
}

// ---------------------------------------------------------------------------
// Neon Auth REST calls
// ---------------------------------------------------------------------------

interface NeonAuthUser {
  id: string;
  name: string | null;
  email: string;
  role?: string | null;
}

function toAppUser(raw: NeonAuthUser | null | undefined): User | null {
  if (!raw?.id) return null;
  const role = raw.role && KNOWN_ROLES.has(raw.role) ? (raw.role as Role) : null;
  if (!role) {
    // A user with no recognized application role cannot use the app.
    return null;
  }
  return {
    id: raw.id,
    name: raw.name ?? raw.email,
    email: raw.email,
    role,
  };
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${AUTH_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export class AuthError extends Error {
  code: string | undefined;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

/** Sign in with email + password. Updates the current-user cache on success. */
export async function signIn(email: string, password: string): Promise<User> {
  const res = await authFetch("/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const code = data?.code as string | undefined;
    const message =
      code === "INVALID_EMAIL_OR_PASSWORD" || res.status === 401
        ? "Invalid email or password."
        : (data?.message as string) || "Unable to sign in. Please try again.";
    throw new AuthError(message, res.status, code);
  }

  const user = toAppUser(data?.user);
  if (!user) {
    throw new AuthError(
      "Your account does not have an assigned role. Contact an administrator.",
      403,
      "NO_ROLE",
    );
  }
  setUser(user);
  return user;
}

/** Sign out of Neon Auth and clear the local cache. */
export async function signOut(): Promise<void> {
  try {
    await authFetch("/sign-out", { method: "POST" });
  } finally {
    setUser(null);
  }
}

/**
 * Fetch a short-lived Neon Auth JWT for the current session.
 *
 * The session cookie is first-party to the Neon Auth domain, so only the
 * browser (with credentials: "include") can exchange it for a token. That
 * token is then handed to our server functions, which verify it back with
 * Neon Auth to derive the caller's identity — the app server never sees the
 * session cookie directly, and never trusts a raw client-supplied user id.
 *
 * Better Auth's JWT plugin returns the token in the `set-auth-jwt` response
 * header and/or the JSON body (`{ token }`); we read whichever is present.
 * Returns null when there is no active session.
 */
export async function getSessionToken(): Promise<string | null> {
  try {
    const res = await authFetch("/token", { method: "GET" });
    if (!res.ok) return null;

    const headerToken = res.headers.get("set-auth-jwt");
    if (headerToken) return headerToken;

    const data = (await res.json().catch(() => null)) as { token?: string } | null;
    return data?.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Restore the current session from the Neon Auth cookie (if any).
 * Safe to call multiple times; only meaningful in the browser.
 */
export async function bootstrapSession(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await authFetch("/get-session", { method: "GET" });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      setUser(toAppUser(data?.user));
    } else {
      setUser(null);
    }
  } catch {
    setUser(null);
  } finally {
    bootstrapped = true;
    emit();
  }
  return current;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
