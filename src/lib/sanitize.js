/**
 * Centralized HTML sanitization for user- or DB-sourced content (XSS prevention).
 * Use for assignment descriptions, portfolio bio/headline if rendered as HTML in future, etc.
 */
import DOMPurify from 'isomorphic-dompurify';

/** Allowed tags for rich text (assignments, similar content). */
export const ALLOWED_TAGS_RICH = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'code', 'pre'];

/**
 * Sanitizes HTML string for safe rendering (e.g. in dangerouslySetInnerHTML).
 * @param {string} dirty - Raw HTML
 * @param {string[]} [allowedTags=ALLOWED_TAGS_RICH] - Allowed tag names
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(dirty, allowedTags = ALLOWED_TAGS_RICH) {
  if (dirty == null || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: allowedTags });
}

/**
 * Strips all HTML tags, returning plain text only.
 * Use for fields that should never contain HTML (chat messages, names, etc.).
 */
export function stripHtml(dirty) {
  if (dirty == null || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
