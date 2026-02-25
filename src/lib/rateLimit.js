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
let redisClient = null;
let useUpstash = false;

let warnedInMemory = false;

async function initUpstash() {
  if (upstashRatelimit !== null) return;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === 'production' && !warnedInMemory) {
      warnedInMemory = true;
      console.warn('[security] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting uses ephemeral in-memory store. Configure Upstash Redis for production.');
    }
  }
  if (url && token) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit');
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({ url, token });
      redisClient = redis;
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

// --- Exponential backoff for login failures ---
// In-memory fallback (used when Redis is unavailable)
const failedAttempts = new Map();

const BACKOFF_TTL = 3600; // 1 hour in seconds
const BACKOFF_PREFIX = 'backoff:';

function getLockoutMs(count) {
  if (count >= 10) return 3600_000;
  if (count >= 8) return 300_000;
  if (count >= 5) return 30_000;
  if (count >= 3) return 5_000;
  return 0;
}

/**
 * Record a failed login attempt. Increases the backoff counter.
 * @param {string} key - Identifier (e.g. `login_email_user@example.com`)
 */
export async function recordLoginFailure(key) {
  await initUpstash();

  if (redisClient) {
    try {
      const redisKey = `${BACKOFF_PREFIX}${key}`;
      const pipe = redisClient.pipeline();
      pipe.hincrby(redisKey, 'count', 1);
      pipe.hset(redisKey, { lastFailure: String(Date.now()) });
      pipe.expire(redisKey, BACKOFF_TTL);
      await pipe.exec();
      return;
    } catch { /* fall through to in-memory */ }
  }

  const now = Date.now();
  const entry = failedAttempts.get(key) || { count: 0, lastFailure: now };
  if (now - entry.lastFailure > 3600_000) {
    entry.count = 0;
  }
  entry.count += 1;
  entry.lastFailure = now;
  failedAttempts.set(key, entry);
}

/**
 * Clear login failures on successful login.
 */
export async function clearLoginFailures(key) {
  await initUpstash();

  if (redisClient) {
    try {
      await redisClient.del(`${BACKOFF_PREFIX}${key}`);
      return;
    } catch { /* fall through to in-memory */ }
  }

  failedAttempts.delete(key);
}

/**
 * Check if a login attempt is allowed given past failures.
 * Returns { allowed, retryAfterMs, failures }.
 * Backoff schedule: 3 failures → 5s, 5 → 30s, 8 → 5min, 10+ → 1h.
 */
export async function getLoginBackoff(key) {
  await initUpstash();

  if (redisClient) {
    try {
      const data = await redisClient.hgetall(`${BACKOFF_PREFIX}${key}`);
      if (!data || !data.count) return { allowed: true, retryAfterMs: 0, failures: 0 };

      const count = parseInt(data.count, 10);
      const lastFailure = parseInt(data.lastFailure, 10);
      const now = Date.now();
      const elapsed = now - lastFailure;

      if (elapsed > 3600_000) {
        await redisClient.del(`${BACKOFF_PREFIX}${key}`);
        return { allowed: true, retryAfterMs: 0, failures: 0 };
      }

      const lockoutMs = getLockoutMs(count);
      if (lockoutMs === 0 || elapsed >= lockoutMs) {
        return { allowed: true, retryAfterMs: 0, failures: count };
      }
      return { allowed: false, retryAfterMs: lockoutMs - elapsed, failures: count };
    } catch { /* fall through to in-memory */ }
  }

  const entry = failedAttempts.get(key);
  if (!entry) return { allowed: true, retryAfterMs: 0, failures: 0 };

  const now = Date.now();
  const elapsed = now - entry.lastFailure;

  if (elapsed > 3600_000) {
    failedAttempts.delete(key);
    return { allowed: true, retryAfterMs: 0, failures: 0 };
  }

  const lockoutMs = getLockoutMs(entry.count);
  if (lockoutMs === 0 || elapsed >= lockoutMs) {
    return { allowed: true, retryAfterMs: 0, failures: entry.count };
  }

  return { allowed: false, retryAfterMs: lockoutMs - elapsed, failures: entry.count };
}
