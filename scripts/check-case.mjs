import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local" });
const s = postgres(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL, { max: 1 });

const caseId = "c2658355-b82c-46fc-ac42-33dbe9e85bd6";
try {
  const [c] =
    await s`SELECT id, case_number, stage, assigned_engineer_id FROM cases WHERE id = ${caseId}`;
  console.log("CASE:", JSON.stringify(c, null, 2));

  if (c?.assigned_engineer_id) {
    const [u] =
      await s`SELECT id, name, email, role FROM neon_auth."user" WHERE id = ${c.assigned_engineer_id}`;
    console.log("ASSIGNED ENGINEER:", JSON.stringify(u, null, 2));
  }

  const fv =
    await s`SELECT id, case_id, engineer_id, floor, building, age_of_building, sq_feet, status, created_at, submitted_at FROM field_visits WHERE case_id = ${caseId}`;
  console.log("FIELD VISITS for this case:", fv.length);
  for (const r of fv) console.log(JSON.stringify(r, null, 2));

  const total = await s`SELECT count(*)::int AS n FROM field_visits`;
  console.log("TOTAL field_visits rows in DB:", total[0].n);
} finally {
  await s.end();
}
