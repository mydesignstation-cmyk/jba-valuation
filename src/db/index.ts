import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString =
    process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"];

  if (!connectionString) {
    throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is not set");
  }

  const client = postgres(connectionString);
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

export type Database = ReturnType<typeof getDb>;
