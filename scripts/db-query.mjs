/**
 * Ad-hoc DB query runner for THIS project's Neon database.
 *
 * Uses the same connection the app uses (DATABASE_URL_UNPOOLED / DATABASE_URL
 * from .env.local) via the already-installed `postgres` package, so it always
 * hits the correct valuation database — not whatever an MCP server is pointed
 * at. Intended for verification / inspection, run from the workspace root:
 *
 *   node scripts/db-query.mjs "SELECT count(*) FROM cases"
 *
 * Reads SQL from the first CLI argument, or from stdin if no argument is given.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = join(__dirname, "..", ".env.local");
  const text = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const env = loadEnvLocal();
  const connectionString = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL_UNPOOLED or DATABASE_URL in .env.local");
    process.exit(1);
  }

  const sqlText = process.argv[2] ?? (await readStdin());
  if (!sqlText || !sqlText.trim()) {
    console.error('Usage: node scripts/db-query.mjs "SELECT ..."');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });
  try {
    const rows = await sql.unsafe(sqlText);
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
