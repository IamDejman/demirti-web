/**
 * Centralized HTML sanitization for user- or DB-sourced content (XSS prevention).
 * Pure-JS implementation — no jsdom dependency, works in both browser and serverless.
 */

/** Allowed tags for rich text (assignments, similar content). */
export const ALLOWED_TAGS_RICH = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'code', 'pre'];

/** Common HTML entities */
const ENTITY_MAP = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&#039;': "'", '&#x27;': "'", '&nbsp;': ' ', '&#160;': ' ',
  '&apos;': "'",
};

function decodeEntities(str) {
  return str.replace(/&(?:#x[\da-fA-F]+|#\d+|\w+);/g, (entity) => {
    if (ENTITY_MAP[entity]) return ENTITY_MAP[entity];
    if (entity.startsWith('&#x')) {
      const code = parseInt(entity.slice(3, -1), 16);
      return Number.isNaN(code) ? entity : String.fromCharCode(code);
    }
    if (entity.startsWith('&#')) {
      const code = parseInt(entity.slice(2, -1), 10);
      return Number.isNaN(code) ? entity : String.fromCharCode(code);
    }
    return entity;
  });
}

/** Tags whose content should be completely removed (not just the tag). */
const DANGEROUS_CONTENT_TAGS = [
  'script', 'style', 'iframe', 'object', 'embed', 'form',
  'input', 'textarea', 'button', 'select', 'meta', 'link',
  'base', 'applet', 'frame', 'frameset', 'noscript',
];

/**
 * Strips all HTML tags, returning plain text only.
 * Use for fields that should never contain HTML (chat messages, names, etc.).
 */
export function stripHtml(dirty) {
  if (dirty == null || typeof dirty !== 'string') return '';
  // Remove dangerous tags and their content
  let text = dirty;
  for (const tag of DANGEROUS_CONTENT_TAGS) {
    text = text.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
    text = text.replace(new RegExp(`<${tag}\\b[^>]*/?>`, 'gi'), '');
  }
  // Remove all remaining tags
  text = text.replace(/<[^>]*>/g, '');
  // Decode HTML entities
  text = decodeEntities(text);
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * Sanitizes HTML string for safe rendering (e.g. in dangerouslySetInnerHTML).
 * Removes dangerous tags/attributes while preserving allowed tags.
 * @param {string} dirty - Raw HTML
 * @param {string[]} [allowedTags=ALLOWED_TAGS_RICH] - Allowed tag names
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(dirty, allowedTags = ALLOWED_TAGS_RICH) {
  if (dirty == null || typeof dirty !== 'string') return '';
  const allowedSet = new Set(allowedTags.map((t) => t.toLowerCase()));
  let clean = dirty;

  // 1. Remove dangerous tags and their content
  for (const tag of DANGEROUS_CONTENT_TAGS) {
    clean = clean.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
    clean = clean.replace(new RegExp(`<${tag}\\b[^>]*/?>`, 'gi'), '');
  }

  // 2. Remove event handler attributes (onclick, onerror, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi, '');

  // 3. Remove javascript:/data:/vbscript: from href, src, action attributes
  clean = clean.replace(
    /\s+(href|src|action)\s*=\s*(?:"(?:javascript|data|vbscript):[^"]*"|'(?:javascript|data|vbscript):[^']*')/gi,
    '',
  );

  // 4. Process tags — keep allowed ones (with safe attributes), remove others
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g, (match, tagName) => {
    const lower = tagName.toLowerCase();
    if (!allowedSet.has(lower)) return '';

    // Closing tags
    if (match.startsWith('</')) return `</${lower}>`;

    // <a> — only keep href with http(s)
    if (lower === 'a') {
      const hrefMatch = match.match(/\s+href\s*=\s*["'](https?:\/\/[^"']*?)["']/i);
      return hrefMatch
        ? `<a href="${hrefMatch[1]}" rel="noopener noreferrer" target="_blank">`
        : '<a>';
    }

    // Self-closing tags
    if (lower === 'br') return '<br />';

    // All other allowed tags — strip attributes
    return `<${lower}>`;
  });

  return clean;
}
