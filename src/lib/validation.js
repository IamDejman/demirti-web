/**
 * Shared validation helpers for API routes (e.g. UUID path params).
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true if the value is a valid UUID v4-style string.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}
