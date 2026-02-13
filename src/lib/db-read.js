/**
 * Read replica connection for scaling read operations.
 * Uses POSTGRES_URL_READ_REPLICA when set; falls back to POSTGRES_URL for local dev.
 * Use sqlRead for read-only queries (public catalogs, etc.).
 * Use sql from db.js for writes and init.
 */
import './env-db';
import { createPool } from '@vercel/postgres';

const readConnectionString =
  process.env.POSTGRES_URL_READ_REPLICA?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.NEW_POSTGRES_URL_READ_REPLICA?.trim() ||
  process.env.NEW_POSTGRES_URL?.trim();

const readPool = createPool({
  connectionString: readConnectionString,
});

/** Use for read-only queries. Routes to read replica when configured. */
export const sqlRead = readPool.sql;
