import pg from 'pg';

/** Minimalny kontrakt bazy — spełnia go i `pg.Pool`, i adapter pg-mem (testy). */
export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>;
}

export function makePool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL nie ustawione');
  return new pg.Pool({ connectionString, max: 10 });
}
