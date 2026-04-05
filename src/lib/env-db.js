/**
 * Normalize database connection env vars to DATABASE_URL before any pg usage.
 * Supports legacy POSTGRES_URL / NEW_POSTGRES_URL for backwards compat.
 */
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_URL?.trim() ||
    process.env.NEW_POSTGRES_URL?.trim() ||
    '';
}
if (!process.env.DATABASE_URL_READ_REPLICA?.trim()) {
  process.env.DATABASE_URL_READ_REPLICA =
    process.env.POSTGRES_URL_READ_REPLICA?.trim() ||
    process.env.NEW_POSTGRES_URL_READ_REPLICA?.trim() ||
    '';
}
