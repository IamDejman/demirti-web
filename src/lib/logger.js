/**
 * Structured logger - use instead of console in server-side code.
 * In production, outputs JSON for log aggregation. In dev, readable format.
 * Avoids leaking PII or sensitive data in logs.
 */

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

export const logger = {
  info(message, meta = {}) {
    console.log(formatEntry('info', message, meta));
  },
  warn(message, meta = {}) {
    console.warn(formatEntry('warn', message, meta));
  },
  error(message, meta = {}) {
    console.error(formatEntry('error', message, meta));
  },
};

export function reportError(error, context = {}) {
  const safeContext = { ...context };
  delete safeContext.email;
  delete safeContext.password;
  delete safeContext.token;
  logger.error(error?.message || String(error), {
    ...safeContext,
    stack: isDev && error?.stack ? error.stack : undefined,
  });
}
