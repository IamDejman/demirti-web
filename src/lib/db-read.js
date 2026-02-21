/**
 * Read replica connection for scaling read operations.
 * Uses POSTGRES_URL_READ_REPLICA when set; falls back to POSTGRES_URL for local dev.
 * Use sqlRead for read-only queries (public catalogs, etc.).
 * Use sql from db.js for writes and init.
 * When no connection string is available at load time, falls back to primary sql.
 */
import './env-db';
import { createPool, sql as defaultSql } from '@vercel/postgres';

const readConnectionString =
  process.env.POSTGRES_URL_READ_REPLICA?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.NEW_POSTGRES_URL_READ_REPLICA?.trim() ||
  process.env.NEW_POSTGRES_URL?.trim();

const readPool = readConnectionString
  ? createPool({ connectionString: readConnectionString })
  : null;

/** Use for read-only queries. Routes to read replica when configured; otherwise primary DB. */
export const sqlRead = readPool ? readPool.sql : defaultSql;
