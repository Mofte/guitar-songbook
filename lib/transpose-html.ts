import { transposeGerman } from "./notation";

/**
 * Transponiert alle Akkorde in einer HtmlDivFormatter-Ausgabe um `semitones`
 * Halbtöne. Erwartet HTML mit `<div class="chord">XX</div>` und deutscher
 * Akkordnotation.
 *
 * Reine String-Operation — läuft im Browser ohne chordsheetjs-Bundle.
 */
export function transposeChordHtml(html: string, semitones: number): string {
  if (semitones === 0) return html;
  return html.replace(
    /<div class="chord">([^<]+)<\/div>/g,
    (match, chord) => {
      const trimmed = chord.trim();
      if (!trimmed) return match;
      try {
        return `<div class="chord">${transposeGerman(trimmed, semitones)}</div>`;
      } catch {
        return match;
      }
    },
  );
}
