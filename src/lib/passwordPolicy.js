/**
 * OWASP-aligned password policy: minimum length and basic complexity.
 * Use for registration, admin user creation, and all password reset/change flows.
 */

const MIN_LENGTH = 8;
const HAS_LETTER = /[a-zA-Z]/;
const HAS_NUMBER = /\d/;

const GENERIC_MESSAGE = 'Password must be at least 8 characters and include both a letter and a number';

/**
 * Validates a password against policy.
 * @param {string} password - Raw password (can be null/undefined for optional passwords e.g. guest)
 * @returns {{ valid: boolean, message?: string }} - valid true if passes; otherwise message (generic in production)
 */
export function validatePassword(password) {
  if (password == null || typeof password !== 'string') {
    return { valid: false, message: GENERIC_MESSAGE };
  }
  const trimmed = password.trim();
  if (trimmed.length < MIN_LENGTH) {
    return { valid: false, message: process.env.NODE_ENV === 'development' ? 'Password must be at least 8 characters' : GENERIC_MESSAGE };
  }
  if (!HAS_LETTER.test(trimmed)) {
    return { valid: false, message: process.env.NODE_ENV === 'development' ? 'Password must include at least one letter' : GENERIC_MESSAGE };
  }
  if (!HAS_NUMBER.test(trimmed)) {
    return { valid: false, message: process.env.NODE_ENV === 'development' ? 'Password must include at least one number' : GENERIC_MESSAGE };
  }
  return { valid: true };
}
