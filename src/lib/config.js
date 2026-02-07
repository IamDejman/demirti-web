/**
 * Centralized application configuration.
 * Use env vars where possible; fallbacks for defaults.
 */

export const DEFAULT_SPONSORED_COHORT = process.env.NEXT_PUBLIC_DEFAULT_COHORT || 'Data Science Feb 2026';

export const DEFAULT_FALLBACK_EMAIL = process.env.BREVO_FROM_EMAIL || process.env.BREVO_TO_EMAIL || 'admin@demirti.com';

export const APPLICATION_DEFAULTS = {
  coursePrice: 150000,
  discountPercentage: 50,
  scholarshipLimit: 10,
};
