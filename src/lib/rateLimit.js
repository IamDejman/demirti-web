/**
 * Rate limiting: Upstash Redis when configured, in-memory fallback otherwise.
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for distributed rate limiting.
 */

const buckets = new Map();

function inMemoryRateLimit(key, { windowMs = 60_000, limit = 30 } = {}) {
  const now = Date.now();
  const entry = buckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  buckets.set(key, entry);
  const remaining = Math.max(0, limit - entry.count);
  return { allowed: entry.count <= limit, remaining, resetAt: entry.resetAt };
}

let upstashRatelimit = null;
let useUpstash = false;

async function initUpstash() {
  if (upstashRatelimit !== null) return;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit');
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({ url, token });
      upstashRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '60 s'),
        analytics: true,
      });
      useUpstash = true;
    } catch {
      useUpstash = false;
    }
  }
}

/**
 * Check rate limit. Returns { allowed, remaining, resetAt }.
 * @param {string} key - Identifier (e.g. ip, user id)
 * @param {{ windowMs?: number, limit?: number }} options - Window and limit for in-memory fallback
 */
export async function rateLimit(key, { windowMs = 60_000, limit = 30 } = {}) {
  await initUpstash();
  if (useUpstash && upstashRatelimit) {
    const result = await upstashRatelimit.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }
  return inMemoryRateLimit(key, { windowMs, limit });
}
