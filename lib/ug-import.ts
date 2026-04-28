/**
 * Konverter: Ultimate-Guitar-Paste → ChordPro mit deutscher Notation.
 *
 * Eingabe ist nicht-standardisiert. Heuristiken decken die häufigsten Fälle ab,
 * Edge Cases werden bewusst nicht alle abgefangen — der Benutzer korrigiert
 * danach manuell. Wichtige Annahmen:
 *
 * - UG verwendet eine Akkord-Zeile direkt über der Lyric-Zeile, mit Spalten
 *   ausgerichtet (Spaces) auf die Stelle, wo der Akkord beginnen soll.
 * - Section-Header in eckigen Klammern (`[Verse 1]`, `[Chorus]`) bleiben erhalten;
 *   der Renderer kümmert sich um die Umwandlung in ChordPro-Direktiven.
 * - Spezial-Marker wie `N.C.`, `x2`, `(2x)`, `-`, `|` zählen *nicht* als
 *   Disqualifikation einer Akkord-Zeile, werden aber beim Merge ignoriert.
 *
 * Notation:
 * - Wir erkennen, ob der Input dt. oder engl. ist (siehe `detectNotation`).
 * - Output ist immer dt. (englische Chords werden via `englishToGerman` konvertiert).
 */

import { parseChord, englishToGerman } from "./notation";

export type Notation = "de" | "en";

const SPECIAL_MARKERS = new Set([
  "N.C.",
  "NC",
  "-",
  "|",
  ":|",
  "|:",
  "||",
  "/",
]);

const REPETITION_MARKER = /^\(?x\d+\)?$|^\(\d+x\)$|^x\d+$/i;

function isSpecialMarker(token: string): boolean {
  if (SPECIAL_MARKERS.has(token)) return true;
  if (REPETITION_MARKER.test(token)) return true;
  return false;
}

function isChordToken(token: string, notation: Notation): boolean {
  // Akkorde sind in UG immer großgeschrieben am Anfang. Lowercase wäre
  // dt. Moll-Konvention, aber UG nutzt das nicht — kommt nur bei reinem
  // dt. Input vor.
  if (notation === "en" && !/^[A-G]/.test(token)) return false;
  if (notation === "de" && !/^[A-Ha-h]/.test(token)) return false;

  try {
    parseChord(token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Erkennt die Notation des Inputs anhand eindeutiger Marker.
 * - `H` (z.B. H, Hm, H7) → deutsch
 * - `Bb` (z.B. Bb, Bbm, Bbmaj7) → englisch
 * - Lowercase 1-2-Buchstaben-Akkorde (z.B. `am`, `dm`) → deutsch
 *
 * Default: englisch (UG ist primär englisch).
 */
export function detectNotation(input: string): Notation {
  let german = 0;
  let english = 0;

  // Wir scannen alle Whitespace-getrennten Tokens auf eindeutige Hinweise.
  const tokens = input.split(/\s+/);
  for (const raw of tokens) {
    if (!raw) continue;
    const token = raw.replace(/[(),.:|]/g, "");
    if (!token) continue;

    // Eindeutig deutsch: H als Grundton (nicht Hm in einem Wort wie "Help")
    // → wir prüfen, ob das ganze Token ein gültiger Akkord ist.
    if (/^H($|[#bm0-9sausjdai])/.test(token)) {
      try {
        parseChord(token);
        german += 2;
        continue;
      } catch {
        /* nope */
      }
    }

    // Eindeutig englisch: Bb-Grundton
    if (/^Bb/.test(token)) {
      try {
        parseChord(token);
        english += 2;
        continue;
      } catch {
        /* nope */
      }
    }

    // Lowercase Akkord (am, dm, em, gm, fm, hm) → deutsch
    if (/^[a-h](?:m|7|m7|maj7|sus|dim|aug|add)?$/.test(token)) {
      try {
        parseChord(token);
        german += 1;
      } catch {
        /* nope */
      }
    }
  }

  if (german > english) return "de";
  if (english > german) return "en";
  return "en";
}

/**
 * Findet alle Chord-Tokens in einer Zeile mit ihrer Spaltenposition.
 * Spezial-Marker werden mit identifiziert (für Disqualifikations-Logik).
 */
type Token = { text: string; col: number; isChord: boolean; isMarker: boolean };

function tokenizeLine(line: string, notation: Notation): Token[] {
  const tokens: Token[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const text = m[0];
    const col = m.index;
    const isChord = isChordToken(text, notation);
    const isMarker = isSpecialMarker(text);
    tokens.push({ text, col, isChord, isMarker });
  }
  return tokens;
}

/**
 * Eine Akkord-Zeile besteht ausschließlich aus Akkord-Tokens und/oder
 * Spezial-Markern, mit mindestens einem echten Akkord.
 */
function isChordLine(tokens: Token[]): boolean {
  if (tokens.length === 0) return false;
  let chordCount = 0;
  for (const t of tokens) {
    if (!t.isChord && !t.isMarker) return false;
    if (t.isChord) chordCount++;
  }
  return chordCount >= 1;
}

/** Section-Header wie `[Verse 1]`, `[Chorus]`. */
function isSectionHeader(line: string): boolean {
  return /^\s*\[[^\]]+\]\s*$/.test(line);
}

function convertChord(token: string, notation: Notation): string {
  if (notation === "en") {
    try {
      return englishToGerman(token);
    } catch {
      return token;
    }
  }
  return token;
}

/**
 * Mergt Akkord-Zeile spaltenweise in die Lyric-Zeile.
 * Akkorde werden als `[Chord]` an der entsprechenden Spalte eingefügt.
 * Marker (`N.C.`, `x2`, …) werden in dieser Variante übersprungen.
 */
function mergeChordsIntoLyric(
  chordTokens: Token[],
  lyric: string,
  notation: Notation,
): string {
  const chordsOnly = chordTokens.filter((t) => t.isChord);
  // Rückwärts einfügen, damit frühere Indizes stabil bleiben.
  let result = lyric;
  for (let i = chordsOnly.length - 1; i >= 0; i--) {
    const { text, col } = chordsOnly[i];
    const bracketed = `[${convertChord(text, notation)}]`;
    if (col > result.length) {
      result = result.padEnd(col, " ") + bracketed;
    } else {
      result = result.slice(0, col) + bracketed + result.slice(col);
    }
  }
  return result.trimEnd();
}

/**
 * Standalone-Akkord-Zeile (kein Lyric-Folgezeile) → `[C] [G] [Am]` Form.
 * Marker bleiben als Plain-Text erhalten und werden hinten angehängt.
 */
function emitStandaloneChordLine(
  tokens: Token[],
  notation: Notation,
): string {
  const chordParts: string[] = [];
  const markerParts: string[] = [];
  for (const t of tokens) {
    if (t.isChord) chordParts.push(`[${convertChord(t.text, notation)}]`);
    else if (t.isMarker) markerParts.push(t.text);
  }
  const out = chordParts.join(" ");
  return markerParts.length > 0 ? `${out} ${markerParts.join(" ")}` : out;
}

/**
 * Hauptkonverter. Verarbeitet den Input zeilenweise:
 * - Leerzeilen bleiben Leerzeilen
 * - Section-Header bleiben erhalten
 * - Akkord-Zeile + Folge-Lyric-Zeile → Inline-Merge
 * - Akkord-Zeile ohne Folge-Lyric → Standalone-Chord-Zeile
 * - Lyric-Zeile ohne vorausgehende Akkord-Zeile → unverändert
 */
export function convertUgToChordPro(input: string): string {
  const normalized = input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "    "); // Tabs in 4 Spaces

  const notation = detectNotation(normalized);
  const lines = normalized.split("\n");
  const out: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      out.push("");
      i++;
      continue;
    }

    if (isSectionHeader(line)) {
      out.push(line.trim());
      i++;
      continue;
    }

    const tokens = tokenizeLine(line, notation);

    if (isChordLine(tokens)) {
      const next = i + 1 < lines.length ? lines[i + 1] : "";
      const nextTokens = next ? tokenizeLine(next, notation) : [];
      const nextIsLyric =
        next.trim() !== "" &&
        !isSectionHeader(next) &&
        !isChordLine(nextTokens);

      if (nextIsLyric) {
        out.push(mergeChordsIntoLyric(tokens, next, notation));
        i += 2;
      } else {
        out.push(emitStandaloneChordLine(tokens, notation));
        i++;
      }
      continue;
    }

    // Reguläre Lyric-Zeile (oder Text vor irgendwas)
    out.push(line.trimEnd());
    i++;
  }

  // Mehrere aufeinanderfolgende Leerzeilen auf eine kürzen
  const collapsed: string[] = [];
  let prevEmpty = false;
  for (const l of out) {
    const empty = l === "";
    if (empty && prevEmpty) continue;
    collapsed.push(l);
    prevEmpty = empty;
  }

  return collapsed.join("\n").replace(/^\n+|\n+$/g, "");
}
