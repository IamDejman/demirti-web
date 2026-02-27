/**
 * Split week description into lines and detect list items (•, -, *, or "1.") for structured display.
 * @param {string} description - Raw description text (may contain newlines)
 * @param {number} maxLines - Max list/paragraph lines to return (null = no limit)
 * @returns {{ displayLines: string[], hasList: boolean, truncated: boolean } | null}
 */
export function formatWeekDescription(description, maxLines = null) {
  if (!description?.trim()) return null;

  // Normalise line breaks and bullet entities so content coming from rich text
  // or HTML (&bull;, <br/>, etc.) is rendered as clean bullets.
  let text = description
    // Convert common <br> variants to real newlines first
    .replace(/<br\s*\/?>/gi, '\n')
    // Normalise common HTML bullet entities to a real bullet character
    // so "&bull; Item" and "• Item" are handled the same way.
    .replace(/&(bull|#8226|#x2022|middot);/gi, '•');

  // Split on newlines, then further split any lines that contain multiple
  // inline bullet separators (e.g. "• Item 1 • Item 2 • Item 3").
  const rawLines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return null;

  const lines = [];

  for (const raw of rawLines) {
    // If a line contains multiple bullet characters, treat each segment as
    // its own list item for clearer display.
    const parts = raw.split('•').map((p) => p.trim()).filter(Boolean);

    if (parts.length <= 1) {
      lines.push(raw);
    } else {
      for (const part of parts) {
        const alreadyListLike = /^[•\-*]\s+/.test(part) || /^\d+\.\s+/.test(part);
        const normalized = alreadyListLike ? part : `• ${part}`;
        lines.push(normalized);
      }
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
