/**
 * Split week description into lines and detect list items (•, -, *, or "1.") for structured display.
 * @param {string} description - Raw description text (may contain newlines)
 * @param {number} maxLines - Max list/paragraph lines to return (null = no limit)
 * @returns {{ displayLines: string[], hasList: boolean, truncated: boolean } | null}
 */
export function formatWeekDescription(description, maxLines = null) {
  if (!description?.trim()) return null;

  // First split on newlines, then further split any lines that contain
  // multiple inline bullet separators (e.g. "• Item 1 • Item 2 • Item 3")
  const rawLines = description
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return null;

  const lines = [];

  for (const line of rawLines) {
    // Split on the bullet character when it appears inline, treating each
    // segment as its own list item.
    const pieces = line.split('•').map((p) => p.trim()).filter(Boolean);

    if (pieces.length > 1) {
      for (const piece of pieces) {
        const alreadyListLike = /^[•\-*]\s+/.test(piece) || /^\d+\.\s+/.test(piece);
        const normalized = alreadyListLike ? piece : `• ${piece}`;
        lines.push(normalized);
      }
    } else {
      lines.push(line);
    }
  }

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
