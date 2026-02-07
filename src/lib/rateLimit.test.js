import { describe, it, expect } from 'vitest';
import { rateLimit } from './rateLimit';

describe('rateLimit', () => {
  it('allows requests within limit', async () => {
    const key = `test_${Date.now()}_${Math.random()}`;
    const r1 = await rateLimit(key, { windowMs: 60_000, limit: 5 });
    expect(r1.allowed).toBe(true);
    const r2 = await rateLimit(key, { windowMs: 60_000, limit: 5 });
    expect(r2.allowed).toBe(true);
  });

  it('returns remaining count', async () => {
    const key = `test_rm_${Date.now()}_${Math.random()}`;
    const r = await rateLimit(key, { windowMs: 60_000, limit: 10 });
    expect(r).toHaveProperty('remaining');
    expect(typeof r.remaining).toBe('number');
  });

  it('returns allowed boolean', async () => {
    const key = `test_al_${Date.now()}_${Math.random()}`;
    const r = await rateLimit(key, { windowMs: 60_000, limit: 1 });
    expect(r).toHaveProperty('allowed');
    expect(typeof r.allowed).toBe('boolean');
  });
});
