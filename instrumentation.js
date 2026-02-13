/**
 * Runs when the Node process starts (e.g. Vercel serverless cold start).
 * If POSTGRES_URL is not set but NEW_POSTGRES_URL is (Vercel env), use it
 * so @vercel/postgres and all DB code work without changing env var names.
 */
export async function register() {
  if (!process.env.POSTGRES_URL?.trim() && process.env.NEW_POSTGRES_URL?.trim()) {
    process.env.POSTGRES_URL = process.env.NEW_POSTGRES_URL;
  }
  if (!process.env.POSTGRES_URL_READ_REPLICA?.trim() && process.env.NEW_POSTGRES_URL_READ_REPLICA?.trim()) {
    process.env.POSTGRES_URL_READ_REPLICA = process.env.NEW_POSTGRES_URL_READ_REPLICA;
  }
}
