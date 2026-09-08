import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

let rateLimit;

beforeEach(async () => {
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  vi.useFakeTimers();
  vi.setSystemTime(0);
  vi.resetModules();
  ({ rateLimit } = await import('./rateLimit'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('in-memory rateLimit', () => {
  it('allows the quota, rejects excess calls, and isolates keys', async () => {
    const options = { windowMs: 1000, limit: 2 };
    expect(await rateLimit('user-a', options)).toEqual({ allowed: true, remaining: 1, resetAt: 1000 });
    expect(await rateLimit('user-a', options)).toEqual({ allowed: true, remaining: 0, resetAt: 1000 });
    expect(await rateLimit('user-a', options)).toEqual({ allowed: false, remaining: 0, resetAt: 1000 });
    expect(await rateLimit('user-b', options)).toEqual({ allowed: true, remaining: 1, resetAt: 1000 });
  });

  it('restores the quota after the window expires', async () => {
    const options = { windowMs: 1000, limit: 1 };
    expect((await rateLimit('user', options)).allowed).toBe(true);
    vi.setSystemTime(999);
    expect((await rateLimit('user', options)).allowed).toBe(false);
    vi.setSystemTime(1001);
    expect(await rateLimit('user', options)).toEqual({ allowed: true, remaining: 0, resetAt: 2001 });
    expect((await rateLimit('user', options)).allowed).toBe(false);
  });
});
