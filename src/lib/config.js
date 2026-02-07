/**
 * Centralized application configuration.
 * Use env vars where possible; fallbacks for defaults.
 */

const REQUIRED_ENV = ['POSTGRES_URL'];

/** Validate required env vars at runtime. Call early to fail fast. */
export function validateEnv() {
  if (process.env.NODE_ENV === 'development') return;
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}. Copy .env.example to .env.local and fill values.`);
  }
}

export const DEFAULT_SPONSORED_COHORT = process.env.NEXT_PUBLIC_DEFAULT_COHORT || 'Data Science Feb 2026';

export const DEFAULT_FALLBACK_EMAIL = process.env.RESEND_FROM_EMAIL || 'admin@demirti.com';

export const APPLICATION_DEFAULTS = {
  coursePrice: 150000,
  discountPercentage: 50,
  scholarshipLimit: 10,
};
