import { ChordProParser, HtmlDivFormatter } from "chordsheetjs";
import { germanToEnglish, englishToGerman } from "./notation";

// Section labels → ChordPro directives
const SECTION_DIRECTIVE: Record<string, [string, string]> = {
  verse: ["start_of_verse", "end_of_verse"],
  chorus: ["start_of_chorus", "end_of_chorus"],
  bridge: ["start_of_bridge", "end_of_bridge"],
  intro: ["start_of_intro", "end_of_intro"],
  outro: ["start_of_outro", "end_of_outro"],
  "pre-chorus": ["start_of_pre_chorus", "end_of_pre_chorus"],
  prechorus: ["start_of_pre_chorus", "end_of_pre_chorus"],
  interlude: ["start_of_verse", "end_of_verse"],
};

function getSectionDirective(label: string): [string, string] | null {
  const base = label.toLowerCase().trim().split(/\s+/)[0].replace(/-/g, "");
  // Try exact match, then prefix match
  for (const key of Object.keys(SECTION_DIRECTIVE)) {
    const keyNorm = key.replace(/-/g, "");
    if (base === keyNorm || base.startsWith(keyNorm)) {
      return SECTION_DIRECTIVE[key];
    }
  }
  return null;
}

/**
 * Konvertiert UG-/Songbook-Sektionsmarker ([Verse], [Chorus] etc.) in
 * ChordPro-Direktiven. Nur Zeilen, die *nur* aus einem solchen Marker
 * bestehen, werden konvertiert.
 */
function preprocessSections(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];
  let closeDirective: string | null = null;

  for (const line of lines) {
    const m = line.match(/^\[([^\]]+)\]\s*$/);
    if (m) {
      const directive = getSectionDirective(m[1]);
      if (directive) {
        if (closeDirective) out.push(`{${closeDirective}}`);
        out.push(`{${directive[0]}: ${m[1]}}`);
        closeDirective = directive[1];
        continue;
      }
    }
    out.push(line);
  }
  if (closeDirective) out.push(`{${closeDirective}}`);

  return out.join("\n");
}

/**
 * Konvertiert alle [Akkord]-Tokens im ChordPro-Text mit einer
 * Transformationsfunktion. Lässt Sektions-Direktiven unberührt.
 */
function mapChordsInContent(
  content: string,
  fn: (chord: string) => string,
): string {
  return content.replace(/\[([^\]]+)\]/g, (match, name) => {
    // Sektionsmarker nicht anfassen
    if (getSectionDirective(name)) return match;
    try {
      return `[${fn(name)}]`;
    } catch {
      return match;
    }
  });
}

/**
 * Konvertiert Akkordnamen in den `.chord`-Divs einer HtmlDivFormatter-
 * Ausgabe mit einer Transformationsfunktion.
 */
function mapChordsInHtml(
  html: string,
  fn: (chord: string) => string,
): string {
  return html.replace(
    /<div class="chord">([^<]+)<\/div>/g,
    (_match, chord) => {
      try {
        return `<div class="chord">${fn(chord.trim())}</div>`;
      } catch {
        return _match;
      }
    },
  );
}

/**
 * Parst einen ChordPro-String (ohne Frontmatter, mit dt. Akkordnotation)
 * und gibt fertig formatiertes HTML zurück. Ausgabe zeigt dt. Notation.
 */
export function renderChordPro(content: string): string {
  const withDirectives = preprocessSections(content);
  const withEnglishChords = mapChordsInContent(withDirectives, germanToEnglish);

  const parser = new ChordProParser();
  const song = parser.parse(withEnglishChords);
  const formatter = new HtmlDivFormatter();
  const html = formatter.format(song);

  return mapChordsInHtml(html, englishToGerman);
}

/**
 * Wie renderChordPro, aber transponiert um `semitones` Halbtöne.
 * Akkorde werden intern in Englisch transponiert und dann in Dt. zurückgegeben.
 */
export function renderChordProTransposed(
  content: string,
  semitones: number,
): string {
  const withDirectives = preprocessSections(content);
  const withEnglishChords = mapChordsInContent(withDirectives, (chord) => {
    const eng = germanToEnglish(chord);
    // transposeEnglish importieren wäre ein zirkulärer Bezug vermieden durch
    // Inline-Nutzung der Transpose-Logik aus notation.ts
    return eng;
  });

  const parser = new ChordProParser();
  let song = parser.parse(withEnglishChords);

  if (semitones !== 0) {
    song = song.transpose(semitones);
  }

  const formatter = new HtmlDivFormatter();
  const html = formatter.format(song);

  return mapChordsInHtml(html, englishToGerman);
}
