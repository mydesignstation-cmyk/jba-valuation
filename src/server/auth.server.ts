/**
 * Server-side authentication helpers.
 *
 * Authentication is backed by Neon Auth (Managed Better Auth). The session
 * cookie is first-party to the Neon Auth domain, so it never reaches this app's
 * own origin and a server function cannot read it. Instead the browser exchanges
 * its session for a short-lived, signed JWT (see getSessionToken in
 * src/lib/auth-client.ts) and passes that token to our server functions.
 *
 * The server VERIFIES the JWT signature against Neon Auth's published JWKS
 * (EdDSA / Ed25519 public key). A forged or tampered token fails verification,
 * so the browser cannot impersonate another user. The trusted user id comes
 * from the verified `sub` claim — never from a raw client-supplied field.
 *
 * The JWT only carries a generic auth role ("authenticated"), so the app role
 * (SUPER_ADMIN / SITE_ENGINEER / ...) is read from the authoritative source:
 * the Neon-Auth-synced `neon_auth."user"` table (same table the rest of the
 * server reads). No app-owned users table is created or modified.
 */

import { createRemoteJWKSet, jwtVerify } from "jose";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";
import type { Role, User } from "@/types";

const KNOWN_ROLES = new Set<Role>([
  "SUPER_ADMIN",
  "ADMIN",
  "SITE_ENGINEER",
  "MAKER",
  "CHECKER",
  "UPLOADER",
]);

/** Server-only Neon Auth config (never bundled into the browser). */
const AUTH_BASE_URL: string =
  process.env["NEON_AUTH_BASE_URL"] ?? process.env["VITE_NEON_AUTH_URL"] ?? "";

const JWKS_URL: string =
  process.env["NEON_AUTH_JWKS_URL"] ??
  (AUTH_BASE_URL ? `${AUTH_BASE_URL}/.well-known/jwks.json` : "");

/** Cached remote JWKS (jose refreshes/rotates keys internally). */
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!jwks) {
    if (!JWKS_URL) throw new Error("NEON_AUTH_JWKS_URL is not set");
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
}

interface NeonAuthUserRow {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
}

/**
 * Resolve the authenticated user by verifying a Neon Auth JWT and looking up
 * the app role in neon_auth."user". Returns null when the token is missing,
 * invalid/expired, the user is not found, or has no known application role.
 */
export async function getServerUser(token: string | null | undefined): Promise<User | null> {
  if (!token) return null;
  if (!JWKS_URL) {
    console.error("NEON_AUTH_JWKS_URL is not set. Cannot verify session tokens.");
    return null;
  }

  // 1) Verify the signature and extract the trusted user id from `sub`.
  let userId: string;
  try {
    const { payload } = await jwtVerify(token, getJwks());
    if (!payload.sub) return null;
    userId = payload.sub;
  } catch (error) {
    console.error("Session token verification failed:", error);
    return null;
  }

  // 2) Read the authoritative app role from the synced Neon Auth user table.
  try {
    const result = await getDb().execute(
      sql`SELECT id, name, email, role
          FROM neon_auth."user"
          WHERE id = ${userId}
            AND banned IS NOT TRUE
          LIMIT 1`,
    );
    const rows = result as unknown as NeonAuthUserRow[];
    const row = rows[0];
    if (!row) return null;

    const role = row.role && KNOWN_ROLES.has(row.role as Role) ? (row.role as Role) : null;
    if (!role) return null;

    return {
      id: row.id,
      name: row.name ?? row.email,
      email: row.email,
      role,
    };
  } catch (error) {
    console.error("Failed to load authenticated user from database:", error);
    return null;
  }
}

/**
 * Verify the token and require that the resolved user holds one of the given
 * roles. Throws when unauthenticated or the role is not permitted.
 */
export async function requireServerUser(
  token: string | null | undefined,
  ...allowedRoles: Role[]
): Promise<User> {
  const user = await getServerUser(token);
  if (!user) {
    throw new Error("Not authenticated");
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
