/**
 * Liest alle einzigartigen Akkordnamen aus dem von chordsheetjs
 * gerenderten HTML in der Reihenfolge ihres ersten Auftretens.
 *
 * Das HtmlDivFormatter-Output hat pro Akkord ein <div class="chord">…</div>;
 * leere Akkord-Slots (zu Lyric-only-Spalten) sind enthalten und werden
 * herausgefiltert.
 */
export function extractUniqueChords(html: string): string[] {
  const matches = html.matchAll(
    /<div\b[^>]*\bclass\s*=\s*"(?:[^"]*\s)?chord(?:\s[^"]*)?"[^>]*>([^<]*)<\/div>/gi,
  );
  const seen = new Set<string>();
  const result: string[] = [];

  for (const m of matches) {
    const name = m[1].trim();
    if (!name) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    result.push(name);
  }

  return result;
}
