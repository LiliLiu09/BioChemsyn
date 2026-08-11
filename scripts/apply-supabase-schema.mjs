import { readFile } from "node:fs/promises";
import pg from "pg";
import { loadLocalEnv } from "./env.mjs";

await loadLocalEnv();

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
try {
  const sql = await readFile("supabase/schema.sql", "utf8");
  await client.query(sql);
  console.log("Supabase schema applied.");
} finally {
  await client.end();
}
