import { config } from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

// Load environment variables from .env.local
config({ path: ".env.local" });

const connectionString = process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is not set");
}

async function runMigrations() {
  const client = postgres(connectionString as string, { max: 1 });
  const db = drizzle(client);

  console.log("Running migrations...");

  try {
    await migrate(db, {
      migrationsFolder: "./src/db/migrations",
    });

    console.log("✓ Migrations completed successfully");
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error);
    await client.end();
    process.exit(1);
  }
}

runMigrations();
