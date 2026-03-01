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
 * Format a live class time range in Lagos timezone.
 * Returns e.g. "Sun 1 Mar · 3:30 pm" or "Sun 1 Mar · 3:30 – 5:30 pm"
 */
export function formatClassTimeLagos(startIso, endIso) {
  if (!startIso) return '';
  const toD = (iso) => {
    if (!iso) return null;
    const s = typeof iso === 'string' && !/Z|[+-]\d{2}:?\d{2}$/.test(iso) ? iso.replace(' ', 'T') + 'Z' : iso;
    const d = new Date(s);
    return isNaN(d) ? null : d;
  };
  const tz = { timeZone: 'Africa/Lagos' };
  const start = toD(startIso);
  if (!start) return '';
  const datePart = start.toLocaleDateString('en-GB', { ...tz, weekday: 'short', day: 'numeric', month: 'short' });
  const startTime = start.toLocaleTimeString('en-GB', { ...tz, hour: 'numeric', minute: '2-digit', hour12: true });
  if (!endIso) return `${datePart} · ${startTime}`;
  const end = toD(endIso);
  if (!end) return `${datePart} · ${startTime}`;
  const endTime = end.toLocaleTimeString('en-GB', { ...tz, hour: 'numeric', minute: '2-digit', hour12: true });
  const sameDay = start.toLocaleDateString('en-GB', tz) === end.toLocaleDateString('en-GB', tz);
  if (sameDay) return `${datePart} · ${startTime} – ${endTime}`;
  const endDatePart = end.toLocaleDateString('en-GB', { ...tz, weekday: 'short', day: 'numeric', month: 'short' });
  return `${datePart} ${startTime} – ${endDatePart} ${endTime}`;
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
