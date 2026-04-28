/**
 * Konvertierung deutsche ↔ englische Akkordnotation.
 *
 * Deutsche Notation:
 * - H = englisch B (die Note h)
 * - B = englisch Bb (B-flat)
 * - Kleinbuchstaben am Anfang = Moll (am = Am, hm = Hm)
 *
 * Akkord-Erweiterungen (m7, maj7, sus4, m7b5, add9, ...) und Vorzeichen
 * an anderen Tönen (C#, Eb, F#) bleiben gleich, da sie aus dem
 * englischen Theorie-Vokabular stammen und auch im Deutschen so verwendet
 * werden.
 */

export type ChordParts = {
  root: string;
  accidental: string;
  suffix: string;
  bass?: { root: string; accidental: string };
};

const ROOT_LETTERS = new Set(["A", "B", "C", "D", "E", "F", "G", "H"]);

function parseRootSegment(segment: string): {
  root: string;
  accidental: string;
  suffix: string;
  isLowerCase: boolean;
} {
  if (!segment) throw new Error("Leerer Akkord-Teil");

  const firstChar = segment[0];
  const isLowerCase = firstChar >= "a" && firstChar <= "h";
  const root = firstChar.toUpperCase();

  if (!ROOT_LETTERS.has(root)) {
    throw new Error(`Ungültiger Grundton: ${firstChar}`);
  }

  let i = 1;
  let accidental = "";
  while (i < segment.length && (segment[i] === "#" || segment[i] === "b")) {
    accidental += segment[i];
    i++;
    if (accidental.length === 2) break;
  }

  let suffix = segment.slice(i);

  if (isLowerCase && !suffix.startsWith("m")) {
    suffix = "m" + suffix;
  }

  return { root, accidental, suffix, isLowerCase };
}

export function parseChord(input: string): ChordParts {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Leerer Akkord");

  const slashIdx = trimmed.indexOf("/");
  const mainStr = slashIdx >= 0 ? trimmed.slice(0, slashIdx) : trimmed;
  const bassStr = slashIdx >= 0 ? trimmed.slice(slashIdx + 1) : null;

  const main = parseRootSegment(mainStr);

  let bass: ChordParts["bass"] | undefined;
  if (bassStr !== null) {
    const bassParsed = parseRootSegment(bassStr);
    bass = { root: bassParsed.root, accidental: bassParsed.accidental };
  }

  return {
    root: main.root,
    accidental: main.accidental,
    suffix: main.suffix,
    bass,
  };
}

function formatChord(parts: ChordParts): string {
  let result = parts.root + parts.accidental + parts.suffix;
  if (parts.bass) {
    result += "/" + parts.bass.root + parts.bass.accidental;
  }
  return result;
}

function rootGermanToEnglish(
  root: string,
  accidental: string,
): { root: string; accidental: string } {
  if (root === "H") {
    return { root: "B", accidental };
  }
  if (root === "B" && accidental === "") {
    return { root: "B", accidental: "b" };
  }
  if (root === "B" && accidental === "b") {
    return { root: "B", accidental: "bb" };
  }
  return { root, accidental };
}

function rootEnglishToGerman(
  root: string,
  accidental: string,
): { root: string; accidental: string } {
  if (root === "B" && accidental === "") {
    return { root: "H", accidental: "" };
  }
  if (root === "B" && accidental === "b") {
    return { root: "B", accidental: "" };
  }
  if (root === "B" && accidental === "bb") {
    return { root: "B", accidental: "b" };
  }
  return { root, accidental };
}

export function germanToEnglish(chord: string): string {
  const parts = parseChord(chord);
  const main = rootGermanToEnglish(parts.root, parts.accidental);
  const bass = parts.bass
    ? rootGermanToEnglish(parts.bass.root, parts.bass.accidental)
    : undefined;
  return formatChord({
    root: main.root,
    accidental: main.accidental,
    suffix: parts.suffix,
    bass,
  });
}

export function englishToGerman(chord: string): string {
  const parts = parseChord(chord);
  const main = rootEnglishToGerman(parts.root, parts.accidental);
  const bass = parts.bass
    ? rootEnglishToGerman(parts.bass.root, parts.bass.accidental)
    : undefined;
  return formatChord({
    root: main.root,
    accidental: main.accidental,
    suffix: parts.suffix,
    bass,
  });
}

export function normalizeChord(chord: string): string {
  return formatChord(parseChord(chord));
}

const ENGLISH_PITCH_CLASSES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
  Cb: "B",
  Fb: "E",
};

const SHARP_TO_FLAT: Record<string, string> = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
};

function noteToSemitone(root: string, accidental: string): number {
  const base = root + accidental;
  const normalized = FLAT_TO_SHARP[base] ?? base;
  const idx = ENGLISH_PITCH_CLASSES.indexOf(normalized);
  if (idx < 0) {
    throw new Error(`Unbekannte Note: ${base}`);
  }
  return idx;
}

function semitoneToNote(
  semitone: number,
  preferFlat: boolean,
): { root: string; accidental: string } {
  const idx = ((semitone % 12) + 12) % 12;
  const sharpName = ENGLISH_PITCH_CLASSES[idx];
  const name = preferFlat ? (SHARP_TO_FLAT[sharpName] ?? sharpName) : sharpName;
  return { root: name[0], accidental: name.slice(1) };
}

/**
 * Transponiert einen Akkord um `semitones` Halbtöne (positiv = höher).
 * Eingabe und Ausgabe in englischer Notation.
 * `preferFlat`: bei true werden Flats bevorzugt (Eb statt D#).
 */
export function transposeEnglish(
  chord: string,
  semitones: number,
  preferFlat = false,
): string {
  const parts = parseChord(chord);
  const mainSemi = noteToSemitone(parts.root, parts.accidental);
  const newMain = semitoneToNote(mainSemi + semitones, preferFlat);

  let bass: ChordParts["bass"] | undefined;
  if (parts.bass) {
    const bassSemi = noteToSemitone(parts.bass.root, parts.bass.accidental);
    const newBass = semitoneToNote(bassSemi + semitones, preferFlat);
    bass = { root: newBass.root, accidental: newBass.accidental };
  }

  return formatChord({
    root: newMain.root,
    accidental: newMain.accidental,
    suffix: parts.suffix,
    bass,
  });
}

/**
 * Transponiert einen Akkord in deutscher Notation um `semitones` Halbtöne.
 * Pipeline: dt. → engl. → transponieren → engl. → dt.
 */
export function transposeGerman(chord: string, semitones: number): string {
  const english = germanToEnglish(chord);
  const parts = parseChord(english);
  // Wenn der englische Akkord Flats enthält (z.B. dt. B → engl. Bb,
  // oder dt. Eb → engl. Eb), Flats beim Transponieren bevorzugen.
  // Sonst Sharps (Standard).
  const preferFlat = parts.accidental.includes("b");
  const transposed = transposeEnglish(english, semitones, preferFlat);
  return englishToGerman(transposed);
}
