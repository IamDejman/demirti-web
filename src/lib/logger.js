/**
 * Structured logger - use instead of console in server-side code.
 * In production, outputs JSON for log aggregation and ships to Axiom.
 * In dev, readable format only.
 * Avoids leaking PII or sensitive data in logs.
 */
import { Logger } from 'next-axiom';

const isDev = process.env.NODE_ENV === 'development';

function formatEntry(level, message, meta = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  return isDev ? `[${level}] ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}` : JSON.stringify(entry);
}

// One shared Axiom logger instance for server-side use.
// next-axiom batches and flushes automatically on Vercel.
const axiom = new Logger({ source: 'server' });

export const logger = {
  info(message, meta = {}) {
    console.log(formatEntry('info', message, meta));
    if (!isDev) axiom.info(message, meta);
  },
  warn(message, meta = {}) {
    console.warn(formatEntry('warn', message, meta));
    if (!isDev) axiom.warn(message, meta);
  },
  error(message, meta = {}) {
    console.error(formatEntry('error', message, meta));
    if (!isDev) axiom.error(message, meta);
  },
};

export function reportError(error, context = {}) {
  const safeContext = { ...context };
  delete safeContext.email;
  delete safeContext.password;
  delete safeContext.token;
  logger.error(error?.message || String(error), {
    ...safeContext,
    // Always include stack in Axiom (not in the HTTP response); dev gets it locally too.
    stack: error?.stack || undefined,
  });
}

/** Safe error message for API responses - avoids leaking internal details in production */
export function safeErrorMessage(error, fallback = 'Something went wrong') {
  if (isDev && error?.message) return error.message;
  return fallback;
}
