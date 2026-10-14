import { readFileSync } from 'node:fs';

const LOCAL_URL_PATH = '.instance/local-postgres-url';

/** Explicit local database connection; never use legacy managed-provider credentials. */
export function localPostgresUrl(override = process.env.DATABASE_URL) {
  const value = override || readFileSync(LOCAL_URL_PATH, 'utf8').trim();
  const parsed = new URL(value);

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('Expected a PostgreSQL connection string');
  }

  if (!['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)) {
    throw new Error('Registry Atlas requires locally hosted PostgreSQL; remote database URLs are disabled');
  }

  return parsed.toString();
}
