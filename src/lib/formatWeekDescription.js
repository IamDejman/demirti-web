/**
 * Split week description into lines and detect list items (•, -, *, or "1.") for structured display.
 * @param {string} description - Raw description text (may contain newlines)
 * @param {number} maxLines - Max list/paragraph lines to return (null = no limit)
 * @returns {{ displayLines: string[], hasList: boolean, truncated: boolean } | null}
 */
export function formatWeekDescription(description, maxLines = null) {
  if (!description?.trim()) return null;
  const lines = description
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  const isListItem = (line) => /^[•\-*]\s+/.test(line) || /^\d+\.\s+/.test(line);
  const listLines = lines.filter(isListItem);
  const hasList = listLines.length > 0;
  const source = hasList ? listLines : lines;
  const displayLines = maxLines != null ? source.slice(0, maxLines) : source;
  const truncated = maxLines != null && source.length > maxLines;
  return { displayLines, hasList, truncated };
}

/** Strip leading bullet/number from a line for display */
export function stripBullet(line) {
  return line.replace(/^[•\-*]\s+/, '').replace(/^\d+\.\s+/, '');
}
