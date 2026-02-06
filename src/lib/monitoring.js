export function reportError(error, context = {}) {
  console.error('Monitoring error:', { error: error?.message || error, ...context });
}
