# Database Rule — Single Source of Truth (READ BEFORE ANY DB WORK)

This project uses **exactly one** Neon Postgres database. Using any other
database — even briefly for a test or a check — has already caused data to be
written to the wrong place and "disappear" on refresh. Do not let it happen
again.

## The ONE and ONLY database for this project

- **Neon endpoint:** `ep-muddy-math-b3on57py` (region `ap-southeast-1`, AWS)
  - Pooled host: `ep-muddy-math-b3on57py-pooler.c-4.ap-southeast-1.aws.neon.tech`
  - Direct host: `ep-muddy-math-b3on57py.c-4.ap-southeast-1.aws.neon.tech`
- **Database name:** `neondb`
- **Role:** `neondb_owner`

The full connection string (with the password) lives ONLY in `.env.local` as
`DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct). `.env.local` is
gitignored — never commit it, and never paste the password into any tracked
file (steering, code, migrations, README, commit messages, etc.). This repo
syncs to Lovable/GitHub, so a committed secret would be exposed publicly.

## Hard rules

1. **Only ever connect to `ep-muddy-math-b3on57py` / `neondb`.** Do not create,
   switch to, or connect to any other Neon project, branch, or endpoint. In
   particular, the project `solitary-rice-*` / branch `br-silent-hall-*` is
   NOT ours — never touch it.
2. **Always read the connection string from `.env.local`** via
   `process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL` (the same
   precedence `src/db/index.ts`, `src/db/migrate.ts`, and `drizzle.config.ts`
   already use). Never hardcode a connection string in code or scripts.
3. **Before running anything that reads or writes the DB** (app, migrations,
   ad-hoc scripts), verify the active endpoint host is
   `ep-muddy-math-b3on57py...`. If it is anything else, STOP and fix the env —
   do not run the command.
4. **Never run destructive SQL (`DELETE`, `DROP`, `TRUNCATE`, `UPDATE` without a
   tight `WHERE`) against this database for testing.** If a temporary/ad-hoc
   script is unavoidable, confirm the endpoint first, scope it to test-only
   rows, and delete the script afterward. Prefer not to write throwaway data to
   the real DB at all.
5. **Migrations** are generated with `npx drizzle-kit generate` and applied with
   `npx tsx src/db/migrate.ts`, both of which resolve the URL from `.env.local`.
   Confirm the endpoint before applying.

## Why this rule exists

A field visit appeared to save and then vanish on refresh because writes landed
in a *different* Neon database than the one the app reads. The two databases
looked similar but were separate projects. Pinning every tool to
`ep-muddy-math-b3on57py / neondb` — and reading the string only from
`.env.local` — prevents that class of "blunder" entirely.
