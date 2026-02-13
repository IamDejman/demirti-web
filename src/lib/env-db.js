/**
 * Ensure POSTGRES_URL is set from NEW_POSTGRES_URL before any @vercel/postgres usage.
 * Import this first in any module that uses the DB (so Vercel env works without renaming vars).
 */
if (!process.env.POSTGRES_URL?.trim() && process.env.NEW_POSTGRES_URL?.trim()) {
  process.env.POSTGRES_URL = process.env.NEW_POSTGRES_URL;
}
if (!process.env.POSTGRES_URL_READ_REPLICA?.trim() && process.env.NEW_POSTGRES_URL_READ_REPLICA?.trim()) {
  process.env.POSTGRES_URL_READ_REPLICA = process.env.NEW_POSTGRES_URL_READ_REPLICA;
}
