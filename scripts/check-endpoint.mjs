import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });

const pooled = process.env.DATABASE_URL;
const unpooled = process.env.DATABASE_URL_UNPOOLED;
const active = unpooled || pooled;

function host(u) {
  try { return new URL(u).host; } catch { return "(unparseable/unset)"; }
}
console.log("DATABASE_URL host          :", pooled ? host(pooled) : "(unset)");
console.log("DATABASE_URL_UNPOOLED host :", unpooled ? host(unpooled) : "(unset)");
console.log("ACTIVE (what getDb uses)   :", host(active));

const s = postgres(active, { max: 1 });
try {
  const db = await s`SELECT current_database() AS db, current_user AS usr, inet_server_addr()::text AS srv`;
  console.log("connected:", JSON.stringify(db[0]));
  const fv = await s`SELECT id, case_id, floor, building, age_of_building, sq_feet, status, created_at, submitted_at FROM field_visits ORDER BY created_at`;
  console.log("field_visits rows via ACTIVE endpoint:", fv.length);
  for (const r of fv) console.log(JSON.stringify(r));
} finally {
  await s.end();
}
