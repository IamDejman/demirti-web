/**
 * Format timestamp in Lagos timezone (Africa/Lagos).
 * Handles both full ISO timestamps and date-only strings.
 */
export function formatTimeLagos(dateStr) {
  if (!dateStr) return '';
  const s = dateStr;
  const iso = typeof s === 'string' && !/Z|[+-]\d{2}:?\d{2}$/.test(s) ? s.replace(' ', 'T') + 'Z' : s;
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'short',
    timeStyle: 'medium',
    hour12: true,
  }).format(d);
}

/**
 * Format date-only in Lagos timezone (Africa/Lagos).
 */
export function formatDateLagos(dateStr) {
  if (!dateStr) return '';
  const s = dateStr;
  const iso = typeof s === 'string' && !/Z|[+-]\d{2}:?\d{2}$/.test(s) ? s.replace(' ', 'T') + 'Z' : s;
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'short',
  }).format(d);
}
