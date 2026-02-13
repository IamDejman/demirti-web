/**
 * Centralized application configuration.
 * Use env vars where possible; fallbacks for defaults.
 */

/** Validate required env vars at runtime. Call early to fail fast. Accepts NEW_POSTGRES_URL if POSTGRES_URL unset (see instrumentation.js). */
export function validateEnv() {
  if (process.env.NODE_ENV === 'development') return;
  const hasDb = process.env.POSTGRES_URL?.trim() || process.env.NEW_POSTGRES_URL?.trim();
  if (!hasDb) {
    throw new Error('Missing required env vars: POSTGRES_URL or NEW_POSTGRES_URL. Copy .env.example to .env.local and fill values.');
  }
}

export const DEFAULT_SPONSORED_COHORT = process.env.NEXT_PUBLIC_DEFAULT_COHORT || 'Data Science Feb 2026';

export const DEFAULT_FALLBACK_EMAIL = process.env.RESEND_FROM_EMAIL || 'admin@demirti.com';

export const APPLICATION_DEFAULTS = {
  coursePrice: 150000,
  discountPercentage: 50,
  scholarshipLimit: 10,
};
