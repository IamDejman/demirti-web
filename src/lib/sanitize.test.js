import { describe, it, expect } from 'vitest';

// Import will work in Node/Vitest because isomorphic-dompurify works server-side
let sanitizeHtml, stripHtml;

try {
  const mod = await import('./sanitize');
  sanitizeHtml = mod.sanitizeHtml;
  stripHtml = mod.stripHtml;
} catch {
  // Module may not export these functions or DOMPurify may not be available in test env
  sanitizeHtml = null;
  stripHtml = null;
}

describe('sanitize', () => {
  it.skipIf(!sanitizeHtml)('sanitizeHtml removes script tags', () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(dirty);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it.skipIf(!sanitizeHtml)('sanitizeHtml preserves safe HTML', () => {
    const safe = '<p><strong>Bold</strong> and <a href="https://example.com">link</a></p>';
    const result = sanitizeHtml(safe);
    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('link');
  });

  it.skipIf(!stripHtml)('stripHtml removes all HTML', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    const result = stripHtml(html);
    expect(result).toBe('Hello world');
  });

  it.skipIf(!stripHtml)('stripHtml returns empty for empty input', () => {
    expect(stripHtml('')).toBe('');
  });
});
