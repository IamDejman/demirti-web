import { describe, it, expect } from 'vitest';
import { sanitizeHtml, stripHtml } from './sanitize';

describe('sanitize', () => {
  it('sanitizeHtml removes script tags', () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(dirty);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('sanitizeHtml preserves safe HTML', () => {
    const safe = '<p><strong>Bold</strong> and <a href="https://example.com">link</a></p>';
    const result = sanitizeHtml(safe);
    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('link');
  });

  it('sanitizeHtml removes event handlers', () => {
    const dirty = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeHtml(dirty);
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click me');
  });

  it('sanitizeHtml removes javascript: hrefs', () => {
    const dirty = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeHtml(dirty);
    expect(result).not.toContain('javascript:');
  });

  it('sanitizeHtml removes iframe tags', () => {
    const dirty = '<p>Hello</p><iframe src="https://evil.com"></iframe>';
    const result = sanitizeHtml(dirty);
    expect(result).not.toContain('<iframe');
    expect(result).toContain('Hello');
  });

  it('stripHtml removes all HTML', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    const result = stripHtml(html);
    expect(result).toBe('Hello world');
  });

  it('stripHtml returns empty for empty input', () => {
    expect(stripHtml('')).toBe('');
  });

  it('stripHtml handles null/undefined', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
  });

  it('stripHtml decodes HTML entities', () => {
    expect(stripHtml('&amp; &lt; &gt;')).toBe('& < >');
  });

  it('stripHtml removes script content', () => {
    const result = stripHtml('Hello<script>alert("xss")</script> world');
    expect(result).toBe('Hello world');
    expect(result).not.toContain('alert');
  });
});
