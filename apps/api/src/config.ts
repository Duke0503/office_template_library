import path from 'node:path';
import { z } from 'zod';

// Every environment variable is parsed once here (conventions: Config). Defaults run the
// app locally next to `docker compose up documentserver`; .env.example documents each one.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  /** Folder holding templates/manifest.json, mounted read-only in Docker (AD-4). */
  MANIFEST_DIR: z.string().default('../../templates'),
  /** Root for the SQLite file and stored files (AD-4). */
  STORAGE_ROOT: z.string().default('../../.data'),
  /** Built SPA served by Express in production; empty disables static serving. */
  WEB_DIST_DIR: z.string().default(''),
  /** Secret for signed file URLs handed to Document Server (AD-7). */
  APP_SECRET: z.string().min(16).default('dev-app-secret-change-me'),
  /** Shared with Document Server as JWT_SECRET (AD-7). */
  ONLYOFFICE_JWT_SECRET: z.string().min(16).default('dev-onlyoffice-secret-change-me'),
  /** Origin the browser loads the editor from. */
  PUBLIC_DOCSERVER_URL: z.url().default('http://localhost:8080'),
  /** Origin the app container uses to reach Document Server. */
  DOCSERVER_INTERNAL_URL: z.url().default('http://localhost:8080'),
  /** Origin Document Server uses to reach this app (file fetch and callback). */
  APP_INTERNAL_URL: z.url().default('http://host.docker.internal:3000'),
});

export type Config = z.infer<typeof schema> & { dbFile: string };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.parse(env);
  const config = {
    ...parsed,
    MANIFEST_DIR: path.resolve(parsed.MANIFEST_DIR),
    STORAGE_ROOT: path.resolve(parsed.STORAGE_ROOT),
    WEB_DIST_DIR: parsed.WEB_DIST_DIR ? path.resolve(parsed.WEB_DIST_DIR) : '',
  };
  return { ...config, dbFile: path.join(config.STORAGE_ROOT, 'app.db') };
}
