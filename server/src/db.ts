import pg from 'pg';

/** Minimalny kontrakt bazy — spełnia go i `pg.Pool`, i adapter pg-mem (testy).
 *  rowCount jest potrzebny przy atomowym „update … where …" — S-2, zużycie klucza pokoju. */
export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rows: any[]; rowCount?: number | null }>;
}

export function makePool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL nie ustawione');
  return new pg.Pool({ connectionString, max: 10 });
}
