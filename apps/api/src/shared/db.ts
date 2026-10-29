import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as catalogSchema from '../modules/catalog/adapters/schema.js';
import * as workspaceSchema from '../modules/workspace/adapters/schema.js';

// One SQLite file; each module owns its own schema file (AD-5).
export const schema = { ...catalogSchema, ...workspaceSchema };
export type Db = BetterSQLite3Database<typeof schema>;

const MIGRATIONS = path.resolve(import.meta.dirname, '../../drizzle');

export function openDb(file: string): { db: Db; close: () => void } {
  if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS });
  return { db, close: () => sqlite.close() };
}
