/**
 * Read replica connection for scaling read operations.
 * Uses DATABASE_URL_READ_REPLICA when set; falls back to DATABASE_URL for local dev.
 * Use sqlRead for read-only queries (public catalogs, etc.).
 * Use sql from postgres.js for writes and init.
 */
import './env-db';
import { sql, createPool } from './postgres';

const readConnectionString =
  process.env.DATABASE_URL_READ_REPLICA?.trim() ||
  process.env.DATABASE_URL?.trim();

const readPool = readConnectionString
  ? createPool({ connectionString: readConnectionString })
  : null;

/** Use for read-only queries. Routes to read replica when configured; otherwise primary DB. */
export const sqlRead = readPool ? readPool.sql : sql;
