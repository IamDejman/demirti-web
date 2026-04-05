/**
 * Runs when the Node process starts (e.g. Vercel serverless cold start).
 * Normalize legacy env var names to DATABASE_URL so all DB code works.
 */
export async function register() {
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
}
