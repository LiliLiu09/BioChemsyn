import pg from "pg";

const globalForPg = globalThis as typeof globalThis & {
  chemB2BPgPool?: pg.Pool;
};

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  globalForPg.chemB2BPgPool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3
  });

  return globalForPg.chemB2BPgPool;
}

export async function dbQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, values: unknown[] = []) {
  const result = await getPool().query<T>(sql, values);
  return result.rows;
}

export async function dbTransaction<T>(callback: (query: <R extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, values?: unknown[]) => Promise<R[]>) => Promise<T>) {
  const client = await getPool().connect();
  const query = async <R extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, values: unknown[] = []) => {
    const result = await client.query<R>(sql, values);
    return result.rows;
  };

  try {
    await client.query("begin");
    const value = await callback(query);
    await client.query("commit");
    return value;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
